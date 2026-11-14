// Bookmarklet lấy tệp khách CSKH 927HG từ checkout.30shine.com/danh-sach-hoa-don
// Chạy hoàn toàn trong trình duyệt của bạn: không gửi dữ liệu đi đâu, file Excel tải thẳng về máy.
// Build: node build.js  -> tạo bookmarklet.txt và cai-dat.html
(async () => {
  const ID = "hd927";
  document.getElementById(ID)?.remove();
  const W = window;
  W.__hd = W.__hd || { caps: [], base: null, excl: null };
  const S = W.__hd;

  /* ---------- tiện ích ---------- */
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  const masked = p => !p || /\*/.test(p) || String(p).replace(/\D/g, "").length < 9;
  const normPhone = p => String(p || "").replace(/\D/g, "").replace(/^84/, "0");

  // mảng object lớn nhất trong JSON = danh sách hoá đơn
  function findArr(j, path = "", depth = 0, best = null) {
    if (depth > 4 || !j || typeof j !== "object") return best;
    if (Array.isArray(j)) {
      if (j.length && isObj(j[0]) && (!best || j.length > best.arr.length)) best = { path, arr: j };
      return best;
    }
    for (const k of Object.keys(j)) best = findArr(j[k], path ? path + "." + k : k, depth + 1, best);
    return best;
  }
  const getPath = (j, path) => path.split(".").filter(Boolean).reduce((o, k) => (o == null ? o : o[k]), j);
  function findTotal(j, depth = 0) {
    if (!isObj(j) || depth > 3) return null;
    for (const [k, v] of Object.entries(j)) {
      if (typeof v === "number" && /^(total|totalcount|totalrecord|totalrecords|totalitems|recordstotal|totalrow|totalrows)$/i.test(k)) return v;
    }
    for (const v of Object.values(j)) { const t = findTotal(v, depth + 1); if (t != null) return t; }
    return null;
  }
  // làm phẳng 1 hoá đơn: {customer:{name}} -> "customer.name"; mảng object -> nối tên
  function flat(o, pre = "", out = {}, d = 0) {
    for (const [k, v] of Object.entries(o || {})) {
      const key = pre ? pre + "." + k : k;
      if (isObj(v) && d < 3) flat(v, key, out, d + 1);
      else if (Array.isArray(v)) {
        out[key] = v.map(x => {
          if (!isObj(x)) return x;
          const nk = Object.keys(x).find(q => /name|ten/i.test(q) && typeof x[q] === "string");
          return nk ? x[nk] : JSON.stringify(x);
        }).filter(x => x !== "" && x != null).join(", ");
      } else out[key] = v;
    }
    return out;
  }

  /* ---------- bắt request của trang ---------- */
  function note(c) {
    try {
      const f = findArr(c.json);
      if (!f) return;
      const keys = Object.keys(flat(f.arr[0])).join(" ");
      if (!/phone|mobile|sdt|tel/i.test(keys)) return;
      c.url = new URL(c.url, location.href).href;
      c.path = f.path;
      c.n = f.arr.length;
      S.caps.push(c);
      S.cap = c;
      render();
    } catch (e) { /* bỏ qua */ }
  }
  if (!W.__hdHooked) {
    W.__hdHooked = true;
    const of = W.fetch;
    W.fetch = async function (input, init = {}) {
      const res = await of.apply(this, arguments);
      try {
        const url = typeof input === "string" ? input : input.url;
        const method = String(init.method || (input && input.method) || "GET").toUpperCase();
        const headers = {};
        const h = init.headers || (input instanceof Request ? input.headers : null);
        if (h instanceof Headers) h.forEach((v, k) => (headers[k] = v));
        else if (Array.isArray(h)) h.forEach(([k, v]) => (headers[k] = v));
        else if (h) Object.assign(headers, h);
        const body = typeof init.body === "string" ? init.body : null;
        res.clone().json().then(json => W.__hdNote({ url, method, headers, body, json })).catch(() => {});
      } catch (e) { /* bỏ qua */ }
      return res;
    };
    const P = XMLHttpRequest.prototype, XO = P.open, XS = P.send, XH = P.setRequestHeader;
    P.open = function (m, u) { this.__hdr = { method: String(m).toUpperCase(), url: String(u), headers: {} }; return XO.apply(this, arguments); };
    P.setRequestHeader = function (k, v) { if (this.__hdr) this.__hdr.headers[k] = v; return XH.apply(this, arguments); };
    P.send = function (b) {
      if (this.__hdr) {
        this.__hdr.body = typeof b === "string" ? b : null;
        this.addEventListener("load", () => {
          try {
            const json = this.responseType === "json" ? this.response
              : (this.responseType === "" || this.responseType === "text") ? JSON.parse(this.responseText) : null;
            if (json) W.__hdNote({ ...this.__hdr, json });
          } catch (e) { /* không phải JSON */ }
        });
      }
      return XS.apply(this, arguments);
    };
  }
  W.__hdNote = note;

  /* ---------- kéo hết các trang ---------- */
  const PAGE = /^(page|pageindex|pagenumber|pageno|currentpage|pagenum)$/i;
  const SIZE = /^(pagesize|limit|size|perpage|take|rows|pagelength)$/i;
  const OFFS = /^(skip|offset|start)$/i;

  async function pullAll(c, onProg) {
    const u = new URL(c.url);
    let body = null;
    try { body = c.body ? JSON.parse(c.body) : null; } catch (e) { body = null; }
    const where = [];
    u.searchParams.forEach((v, k) => where.push(["q", k, v]));
    if (isObj(body)) Object.entries(body).forEach(([k, v]) => where.push(["b", k, v]));
    const find = re => where.find(([, k]) => re.test(k));
    const pg = find(PAGE), sz = find(SIZE), of = find(OFFS);
    const set = ([w, k], v) => { if (w === "q") u.searchParams.set(k, String(v)); else body[k] = typeof body[k] === "string" ? String(v) : v; };
    const want = 100;
    if (sz) set(sz, want);
    const first = pg ? (Number(pg[2]) <= 0 ? 0 : 1) : 0;
    const all = [], seen = new Set();
    let firstLen = 0, total = null, retried = false;
    for (let i = 0; i < 1000; i++) {
      if (pg) set(pg, first + i);
      else if (of) set(of, i * (firstLen || want));
      else if (i > 0) break;
      let j = null;
      for (let k = 0; k < 4 && !j; k++) {
        try {
          const r = await fetch(u.href, {
            method: c.method, headers: c.headers, credentials: "include",
            body: c.method === "GET" || c.method === "HEAD" ? undefined : (body ? JSON.stringify(body) : c.body),
          });
          if (r.status === 401) throw new Error("Hết đăng nhập — tải lại trang, đăng nhập lại.");
          j = await r.json();
        } catch (e) {
          if (/đăng nhập/.test(e.message)) throw e;
          await sleep(800 * (k + 1));
        }
      }
      if (!j) throw new Error("Web không trả dữ liệu ở trang " + (i + 1) + " (mạng yếu?) — bấm kéo lại.");
      if (total == null) total = findTotal(j);
      const arr = getPath(j, c.path) || (findArr(j) || {}).arr || [];
      if (!arr.length && i === 0 && sz && !retried) { retried = true; set(sz, sz[2]); i--; continue; } // web không nhận 100/trang
      if (!arr.length) break;
      let fresh = 0;
      for (const b of arr) {
        const key = JSON.stringify(b);
        if (!seen.has(key)) { seen.add(key); all.push(b); fresh++; }
      }
      if (!fresh) break; // web bỏ qua tham số trang -> dừng
      if (!firstLen) firstLen = arr.length;
      onProg(all.length, total);
      if (arr.length < firstLen || (total != null && all.length >= total)) break;
      await sleep(250);
    }
    return { bills: all.map(b => flat(b)), paged: !!(pg || of), total };
  }

  /* ---------- đoán cột ---------- */
  const FIELDS = [
    ["cid", "Mã khách (để loại trùng)", [/customer.?id$|^cus.?id$|customerid|khachhang.?id/i]],
    ["name", "Tên khách", [/customer.?name|cus.?name|customer\.full.?name|customer\.name$/i, /full.?name|^name$|tenkh/i]],
    ["phone", "SĐT", [/customer.?phone|cus.?phone|customer\.phone|customer\.mobile/i, /phone|mobile|sdt|tel/i]],
    ["date", "Ngày ghé", [/checkout|complete|finish/i, /bill.?date|created|date|time/i]],
    ["stylist", "Stylist", [/stylist.*name|stylistname/i, /stylist/i]],
    ["skinner", "Skinner", [/skinner.*name|skinnername/i, /skinner/i]],
    ["service", "Dịch vụ", [/service.*name|servicename|services?$/i, /service|dichvu/i]],
  ];
  function guess(sample) {
    const keys = Object.keys(sample);
    const m = {};
    for (const [f, , res] of FIELDS) {
      for (const re of res) {
        const k = keys.find(k => re.test(k) && sample[k] !== "" && sample[k] != null && !(f !== "cid" && /id$/i.test(k)));
        if (k) { m[f] = k; break; }
      }
    }
    return m;
  }

  /* ---------- ghép tệp ---------- */
  const parseDate = s => {
    s = String(s || "");
    let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(.*)$/);
    if (m) s = m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") + m[4];
    const t = Date.parse(s.replace(" ", "T"));
    return isNaN(t) ? (Number(s) || 0) : t;
  };
  const showDate = s => {
    const t = parseDate(s);
    if (!t) return String(s || "");
    const d = new Date(t + 7 * 3600e3);
    return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear();
  };
  const v = (b, f) => (S.map[f] ? b[S.map[f]] ?? "" : "");
  const custKey = b => (S.map.cid && v(b, "cid") !== "" ? "id:" + v(b, "cid") : !masked(v(b, "phone")) ? "p:" + normPhone(v(b, "phone")) : "n:" + v(b, "name") + "|" + v(b, "phone"));

  function build() {
    const latest = new Map(), realPhone = new Map();
    for (const b of S.base.bills) {
      const k = custKey(b), old = latest.get(k);
      if (!old || parseDate(v(b, "date")) >= parseDate(v(old, "date"))) latest.set(k, b);
      if (!masked(v(b, "phone"))) realPhone.set(k, v(b, "phone")); // giữ SĐT thật từ bất kỳ bill nào của khách
    }
    const exIds = new Set(), exPhones = new Set();
    for (const b of (S.excl ? S.excl.bills : [])) {
      exIds.add(custKey(b));
      if (!masked(v(b, "phone"))) exPhones.add(normPhone(v(b, "phone")));
    }
    let daVe = 0, che = 0;
    const out = [];
    for (const [k, b] of latest) {
      const phone = realPhone.get(k) || v(b, "phone");
      if (exIds.has(k) || (!masked(phone) && exPhones.has(normPhone(phone)))) { daVe++; continue; }
      if (masked(phone)) { che++; continue; }
      out.push({ ...b, __phone: phone });
    }
    out.sort((a, b) => parseDate(v(b, "date")) - parseDate(v(a, "date")));
    return { out, total: latest.size, daVe, che };
  }

  /* ---------- xuất xlsx (tự viết, không cần thư viện) ---------- */
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], cd = [];
    let off = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    for (const [name, text] of files) {
      const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data);
      const common = [...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0)];
      const lh = new Uint8Array([...u32(0x04034b50), ...common]);
      parts.push(lh, nb, data);
      cd.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
      off += lh.length + nb.length + data.length;
    }
    const cdSize = cd.reduce((s, a) => s + a.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...cd, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  const xesc = s => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function xlsx(rows) {
    const col = i => String.fromCharCode(65 + i);
    const sheet = rows.map((r, ri) => '<row r="' + (ri + 1) + '">' + r.map((c, ci) => {
      const ref = col(ci) + (ri + 1);
      return typeof c === "number" ? '<c r="' + ref + '"><v>' + c + "</v></c>"
        : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xesc(c) + "</t></is></c>";
    }).join("") + "</row>").join("");
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return zip([
      ["[Content_Types].xml", X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
      ["_rels/.rels", X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ["xl/workbook.xml", X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="CSKH" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ["xl/_rels/workbook.xml.rels", X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
      ["xl/worksheets/sheet1.xml", X + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="6" customWidth="1"/><col min="2" max="2" width="26" customWidth="1"/><col min="3" max="4" width="14" customWidth="1"/><col min="5" max="6" width="22" customWidth="1"/><col min="7" max="7" width="40" customWidth="1"/></cols><sheetData>' + sheet + "</sheetData></worksheet>"],
    ]);
  }
  function download() {
    const r = build();
    const rows = [["STT", "Tên", "SĐT", "Ngày ghé", "Stylist", "Skinner", "Dịch vụ"]];
    r.out.forEach((b, i) => rows.push([i + 1, String(v(b, "name")).trim() || "Khách", normPhone(b.__phone || v(b, "phone")), showDate(v(b, "date")), String(v(b, "stylist")).trim(), String(v(b, "skinner")).trim(), String(v(b, "service")).trim()]));
    const d = new Date(Date.now() + 7 * 3600e3);
    const ten = "927HG_CSKH_" + String(d.getUTCDate()).padStart(2, "0") + String(d.getUTCMonth() + 1).padStart(2, "0") + d.getUTCFullYear() + ".xlsx";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(xlsx(rows));
    a.download = ten;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    W.__hdLast = { ten, n: r.out.length };
    return ten;
  }

  /* ---------- giao diện ---------- */
  const box = document.createElement("div");
  box.id = ID;
  box.style.cssText = "position:fixed;top:10px;right:10px;width:min(380px,calc(100vw - 20px));max-height:calc(100vh - 20px);overflow:auto;z-index:2147483647;background:#fff;color:#111;border:2px solid #0a7d32;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);font:14px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;padding:12px 14px";
  document.body.appendChild(box);
  const btn = (id, txt, on, bg = "#0a7d32") => '<button id="' + id + '" ' + (on ? "" : "disabled") + ' style="width:100%;padding:10px;margin:4px 0;font-size:15px;font-weight:600;border:0;border-radius:8px;color:#fff;background:' + (on ? bg : "#bbb") + '">' + txt + "</button>";
  let busy = "";

  function render() {
    if (!document.getElementById(ID)) return;
    const c = S.cap;
    let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:16px">Tệp khách CSKH 927HG</b><button id="hdx" style="padding:4px 10px">Đóng</button></div>';
    if (!c) {
      h += '<p style="color:#b45309"><b>Bước 1:</b> trên trang này, chọn khoảng ngày, salon 927HG rồi bấm <b>Tìm kiếm/Lọc</b> để trang tải danh sách hoá đơn.</p><p style="color:#555">Nút đang chờ bắt request danh sách hoá đơn…</p>';
    } else {
      h += '<p style="color:#0a7d32;margin:4px 0">✓ Đã bắt được danh sách hoá đơn (' + c.n + " dòng/trang).</p>";
      h += '<p style="margin:6px 0"><b>Bước 2 — tệp base:</b> lọc trên trang khoảng ngày tháng trước (vd 01/10 → 31/10), bấm Tìm kiếm, rồi bấm:</p>';
      h += btn("hdbase", busy === "base" ? "Đang kéo…" : "Kéo hết → tệp BASE", !busy);
      if (S.base) h += '<div style="font-size:13px;color:#555">BASE: ' + S.base.bills.length + " hoá đơn" + (S.base.paged ? "" : ' <span style="color:#b00">(không tìm thấy tham số trang — chỉ lấy được 1 trang)</span>') + "</div>";
      h += '<p style="margin:10px 0 6px"><b>Bước 3 — tệp loại trừ:</b> lọc khoảng ngày tháng này (vd 01/11 → hôm nay), bấm Tìm kiếm, rồi bấm:</p>';
      h += btn("hdexcl", busy === "excl" ? "Đang kéo…" : "Kéo hết → tệp LOẠI TRỪ (khách đã về)", !busy, "#1d4ed8");
      if (S.excl) h += '<div style="font-size:13px;color:#555">LOẠI TRỪ: ' + S.excl.bills.length + " hoá đơn</div>";
      if (S.base) {
        const sample = S.base.bills[0] || {};
        if (!S.map) S.map = guess(sample);
        const keys = Object.keys(sample);
        h += '<details style="margin:10px 0"><summary style="cursor:pointer"><b>Cột dữ liệu</b> (tự đoán — mở ra nếu file bị sai cột)</summary>';
        for (const [f, label] of FIELDS) {
          h += '<label style="display:block;margin:4px 0;font-size:13px">' + label + '<select data-f="' + f + '" style="width:100%;font-size:13px"><option value="">(không có)</option>' +
            keys.map(k => '<option value="' + esc(k) + '"' + (S.map[f] === k ? " selected" : "") + ">" + esc(k) + " = " + esc(String(sample[k]).slice(0, 30)) + "</option>").join("") + "</select></label>";
        }
        h += "</details>";
        const r = build();
        h += '<div style="background:#f3f4f6;border-radius:8px;padding:8px;margin:8px 0;font-size:13px">' + r.total + " khách trong base · " + r.daVe + " đã về (loại) · " + r.che + " bị che SĐT (bỏ)<br><b style=\"font-size:15px\">→ " + r.out.length + " khách xuất file</b>" +
          (S.excl ? "" : '<br><span style="color:#b45309">Chưa có tệp loại trừ — file sẽ gồm cả khách đã quay lại.</span>') +
          (r.che && r.che > r.out.length ? '<br><span style="color:#b45309">Đa số SĐT bị che: API chỉ trả số thật cho bill 3 ngày gần nhất — kéo base trong 3 ngày đầu tháng mới.</span>' : "") + "</div>";
        h += btn("hddl", "Tải file Excel", r.out.length > 0, "#7c3aed");
        if (W.__hdLast) h += '<div style="font-size:13px;color:#0a7d32">Đã tải ' + esc(W.__hdLast.ten) + " (" + W.__hdLast.n + " khách)</div>";
      }
      h += '<div id="hderr" style="color:#b00;font-size:13px"></div>';
      h += '<button id="hdreset" style="margin-top:8px;font-size:12px;padding:3px 8px">Làm lại từ đầu</button>';
    }
    box.innerHTML = h;
    box.querySelector("#hdx").onclick = () => box.remove();
    const q = s => box.querySelector(s);
    const pull = which => async () => {
      busy = which; render();
      try {
        const res = await pullAll(S.cap, (n, t) => { const b = q(which === "base" ? "#hdbase" : "#hdexcl"); if (b) b.textContent = "Đang kéo… " + n + (t ? "/" + t : "") + " hoá đơn"; });
        S[which] = res;
        if (which === "base") S.map = null;
        busy = ""; render();
      } catch (e) {
        busy = ""; render();
        const er = q("#hderr"); if (er) er.textContent = e.message;
      }
    };
    if (q("#hdbase")) q("#hdbase").onclick = pull("base");
    if (q("#hdexcl")) q("#hdexcl").onclick = pull("excl");
    if (q("#hddl")) q("#hddl").onclick = () => { download(); render(); };
    if (q("#hdreset")) q("#hdreset").onclick = () => { S.cap = null; S.base = null; S.excl = null; S.map = null; W.__hdLast = null; render(); };
    box.querySelectorAll("select[data-f]").forEach(s => (s.onchange = () => { S.map[s.dataset.f] = s.value; render(); }));
  }
  W.__hdRender = render;
  render();
})();
