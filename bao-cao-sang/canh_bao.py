#!/usr/bin/env python3
"""Cảnh báo sáng: doanh số dưới kế hoạch + tỉ lệ khách book đến thấp.

Đọc số liệu từ reports.30shine.com (cùng file JSON mà 2 trang báo cáo dùng):
  - 0019_baocao-sale-v7      -> sale-salon-day/sale-salon-day-<ngày>.json
  - 0029-baocao-chatluong-salon -> clsalon-book-salon/clsalon-book-salon-<ngày>.json
  - dim/salon.json           -> tên salon, RSM

Xác thực: gửi header Authorization (giá trị thật do proxy của môi trường gắn vào,
token đọc báo cáo xin từ IT/BI). Không lưu token trong code.

Dùng:  python3 canh_bao.py [YYYY-MM-DD]      (mặc định: hôm qua, giờ VN)
Biến môi trường tuỳ chọn:
  NGUONG_SALE=0.90   NGUONG_BOOK=0.80   RSM="Tên RSM"   SALONS="145,575"
"""
import json, os, sys, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

BASE = "https://reports.30shine.com"
SALE = BASE + "/0019_baocao-sale-v7/sale-salon-day/sale-salon-day-{d}.json"
BOOK = BASE + "/0029-baocao-chatluong-salon/clsalon-book-salon/clsalon-book-salon-{d}.json"
DIM_SALON = BASE + "/dim/salon.json"

NGUONG_SALE = float(os.environ.get("NGUONG_SALE", "0.90"))
NGUONG_BOOK = float(os.environ.get("NGUONG_BOOK", "0.80"))
RSM = os.environ.get("RSM", "").strip()
SALONS = {s.strip() for s in os.environ.get("SALONS", "").split(",") if s.strip()}


class LoiDangNhap(Exception):
    pass


def get_json(url, bat_buoc=True):
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer proxy-injected",  # proxy thay bằng token thật
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            t = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            raise LoiDangNhap(f"{e.code} khi đọc {url}")
        if e.code == 404 and not bat_buoc:
            return []
        raise
    j = json.loads(t) if t else []
    return j if isinstance(j, list) else (j or {}).get("data") or []


def num(v):
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def salon_id(r):
    for k in ("Salon_ID", "SalonId", "salon_ID"):
        if r.get(k) is not None:
            return str(r[k])
    return None


def tien(v):
    return f"{v/1e6:.1f}tr".replace(".", ",")


def build(ngay):
    dim = {salon_id(r): r for r in get_json(DIM_SALON, bat_buoc=False) if salon_id(r)}

    def ten(sid, row=None):
        return (dim.get(sid) or {}).get("Salon_name") or (row or {}).get("Salon_name") or sid

    def chon(sid, row=None):
        if SALONS and sid not in SALONS and str(ten(sid, row)).split(" ")[0] not in SALONS:
            return False
        if RSM:
            rsm = (dim.get(sid) or {}).get("RSM_Name") or (row or {}).get("RSM_Name") or ""
            return rsm == RSM
        return True

    # ---- Sale ----
    sale = {}
    for r in get_json(SALE.format(d=ngay), bat_buoc=False):
        sid = salon_id(r)
        if not sid or not chon(sid, r):
            continue
        s = sale.setdefault(sid, {"dt": 0, "kh": 0, "tg_dt": 0, "tg_kh": 0, "row": r})
        s["dt"] += num(r.get("DT_all"))
        s["kh"] += num(r.get("SL_khach_BI"))
        s["tg_dt"] += num(r.get("Target_doanhthu_all_ngay"))
        s["tg_kh"] += num(r.get("Target_SL_khach_ngay"))
    sale_thap = []
    for sid, s in sale.items():
        if s["tg_dt"] > 0 and s["dt"] / s["tg_dt"] < NGUONG_SALE:
            sale_thap.append((s["dt"] / s["tg_dt"], sid, s))
    sale_thap.sort()

    # ---- Khách book: % khách book được phục vụ (count_sty_skin != 0) ----
    book = {}
    for r in get_json(BOOK.format(d=ngay), bat_buoc=False):
        sid = salon_id(r)
        if not sid or not chon(sid, r):
            continue
        b = book.setdefault(sid, {"book": 0, "den": 0})
        sl = num(r.get("sl_CusBook_day"))
        b["book"] += sl
        if num(r.get("count_sty_skin")) != 0:
            b["den"] += sl
    book_thap = []
    for sid, b in book.items():
        if b["book"] > 0 and b["den"] / b["book"] < NGUONG_BOOK:
            book_thap.append((b["den"] / b["book"], sid, b))
    book_thap.sort()

    d = datetime.strptime(ngay, "%Y-%m-%d")
    thu = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"][d.weekday()]
    out = [f"**Cảnh báo Sale & Khách book – {thu} {d:%d/%m/%Y}**", ""]

    out.append(f"💰 **Sale – salon dưới {NGUONG_SALE:.0%} kế hoạch ngày**")
    if not sale:
        out.append("⚠️ Chưa có số liệu sale của ngày này.")
    elif not sale_thap:
        out.append(f"✓ Cả {len(sale)} salon đạt từ {NGUONG_SALE:.0%} kế hoạch trở lên")
    for pct, sid, s in sale_thap:
        kh = f" – khách {int(s['kh'])}/{int(s['tg_kh'])}" if s["tg_kh"] else ""
        out.append(f"• **{ten(sid, s['row'])}**: {tien(s['dt'])} / {tien(s['tg_dt'])} ({pct:.0%}){kh}")
    tong_dt = sum(s["dt"] for s in sale.values()); tong_tg = sum(s["tg_dt"] for s in sale.values())
    if tong_tg:
        out.append(f"_Toàn vùng: {tien(tong_dt)} / {tien(tong_tg)} ({tong_dt/tong_tg:.0%})_")
    out.append("")

    out.append(f"📅 **Khách book – tỉ lệ khách đến dưới {NGUONG_BOOK:.0%}**")
    if not book:
        out.append("⚠️ Chưa có số liệu khách book của ngày này.")
    elif not book_thap:
        out.append(f"✓ Cả {len(book)} salon có tỉ lệ khách book đến từ {NGUONG_BOOK:.0%} trở lên")
    for pct, sid, b in book_thap:
        out.append(f"• **{ten(sid)}**: {int(b['den'])}/{int(b['book'])} khách book đến ({pct:.0%}) – {int(b['book']-b['den'])} khách bỏ book")
    return "\n".join(out)


def main():
    if len(sys.argv) > 1:
        ngay = sys.argv[1]
    else:
        ngay = (datetime.now(timezone(timedelta(hours=7))) - timedelta(days=1)).strftime("%Y-%m-%d")
    try:
        print(build(ngay))
    except LoiDangNhap as e:
        print(f"❌ Không đăng nhập được reports.30shine.com ({e}). Token đọc báo cáo chưa có hoặc đã hết hạn.")
        sys.exit(2)


if __name__ == "__main__":
    main()
