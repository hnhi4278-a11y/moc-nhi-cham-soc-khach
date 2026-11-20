/* Cảnh báo sáng – chạy bằng dấu trang trên reports.30shine.com (đã đăng nhập 30Shine).
 * Đọc đúng các file số liệu mà 2 báo cáo Sale v7 (0019) và Chất lượng salon (0029) dùng,
 * trình duyệt tự gửi phiên đăng nhập của bạn. Không gửi số liệu đi đâu cả: chỉ hiện lên màn hình để chép.
 */
(function () {
  'use strict';
  var SALONS = [{ id: 22, ten: '927 HG' }, { id: 208, ten: '671 QL50' }];
  var NGUONG_SALE = 0.7;   // sale hôm qua < 70% mức TB 14 ngày của chính người đó
  var NGUONG_BOOK = 0.8;   // tỉ lệ khách book được phục vụ < 80% (salon)
  var NGUONG_BOOK_NV = 0.6; // số book của stylist < 60% mức TB của chính người đó
  var SO_NGAY = 14;
  var S = '/0019_baocao-sale-v7/', C = '/0029-baocao-chatluong-salon/';
  var THU = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  if (!/reports\.30shine\.com$/.test(location.hostname)) {
    alert('Mở trang reports.30shine.com (đã đăng nhập) rồi bấm dấu trang này.');
    return;
  }

  var box = document.getElementById('cb-sang') || document.createElement('div');
  box.id = 'cb-sang';
  box.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto;font-family:system-ui,-apple-system,Segoe UI,sans-serif';
  box.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:560px;width:100%;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.3)">' +
    '<div style="font-weight:700;font-size:17px;margin-bottom:8px">Cảnh báo Sale &amp; Khách book</div>' +
    '<pre id="cb-txt" style="white-space:pre-wrap;font:14px/1.5 system-ui,-apple-system,sans-serif;margin:0 0 12px">Đang tải số liệu…</pre>' +
    '<button id="cb-copy" style="width:100%;padding:14px;font-size:16px;font-weight:700;border:0;border-radius:10px;background:#1a7f37;color:#fff">CHÉP CẢNH BÁO</button>' +
    '<button id="cb-close" style="width:100%;padding:10px;margin-top:8px;font-size:14px;border:0;border-radius:10px;background:#eef2f7">Đóng</button></div>';
  document.body.appendChild(box);
  var txt = document.getElementById('cb-txt');
  document.getElementById('cb-close').onclick = function () { box.remove(); };
  document.getElementById('cb-copy').onclick = function () {
    var b = this;
    navigator.clipboard.writeText(txt.textContent).then(function () { b.textContent = 'ĐÃ CHÉP ✓'; },
      function (e) { alert('Không chép được: ' + e + '\nGiữ tay vào chữ để chọn và chép.'); });
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function tr(v) { return (v / 1e6).toFixed(1).replace('.', ',') + 'tr'; }
  function pct(v) { return Math.round(v * 100) + '%'; }
  function unwrap(j) { return Array.isArray(j) ? j : (j && j.data) || []; }
  function sid(r) { var v = r.Salon_ID != null ? r.Salon_ID : (r.SalonId != null ? r.SalonId : r.salon_ID); return Number(v); }

  var het = false;
  function get(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) {
      if (r.status === 401 || r.status === 403) { het = true; return []; }
      if (!r.ok) return null;
      return r.text().then(function (t) { return t ? unwrap(JSON.parse(t)) : []; });
    }).catch(function () { return null; });
  }
  function firstOk(urls) {
    var i = 0;
    function next() { if (i >= urls.length) return Promise.resolve([]); return get(urls[i++]).then(function (r) { return r && r.length ? r : next(); }); }
    return next();
  }

  // Ngày báo cáo: hôm qua theo giờ máy (VN)
  var now = new Date();
  var hq = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  var ngay = [];
  for (var k = SO_NGAY; k >= 0; k--) ngay.push(iso(new Date(hq.getFullYear(), hq.getMonth(), hq.getDate() - k)));
  var HQ = iso(hq);

  function daily(dir, name) {
    return Promise.all(ngay.map(function (d) {
      return get(dir + name + '/' + name + '-' + d + '.json').then(function (rows) { return { d: d, rows: rows || [] }; });
    }));
  }

  Promise.all([
    firstOk([S + 'sale-dim-staff/sale-dim-staff.json', '/dim/sale-dim-staff.json', S + 'sale-dim-staff.json']),
    firstOk([C + 'clsalon-dim-staff/clsalon-dim-staff.json', '/dim/clsalon-dim-staff.json', C + 'clsalon-dim-staff.json']),
    daily(S, 'sale-staff-day'),
    daily(C, 'clsalon-book-stylist'),
    get(C + 'clsalon-book-salon/clsalon-book-salon-' + HQ + '.json')
  ]).then(function (res) {
    if (het) { txt.textContent = '❌ Phiên đăng nhập báo cáo đã hết. Tải lại trang, đăng nhập 30Shine rồi bấm dấu trang lại.'; return; }
    var ten = {};
    res[0].concat(res[1]).forEach(function (r) {
      var id = r.staff_ID != null ? r.staff_ID : r.Staff_ID;
      if (id != null && r.staff_name && !ten[id]) ten[id] = { n: String(r.staff_name).normalize('NFC').trim(), p: r.staff_position || '' };
    });
    var saleDays = res[2], bookDays = res[3], bookSalon = res[4] || [];
    var d0 = new Date(HQ + 'T00:00:00');
    var L = ['Cảnh báo Sale & Khách book – ' + THU[d0.getDay()] + ' ' + pad(d0.getDate()) + '/' + pad(d0.getMonth() + 1) + '/' + d0.getFullYear(), ''];

    SALONS.forEach(function (sal) {
      L.push('🏠 ' + sal.ten);
      // ---- Sale theo nhân viên ----
      var nv = {};
      var coSoHomQua = false;
      saleDays.forEach(function (x) {
        x.rows.forEach(function (r) {
          if (sid(r) !== sal.id || r.staff_ID == null) return;
          var o = nv[r.staff_ID] || (nv[r.staff_ID] = {});
          var day = o[x.d] || (o[x.d] = { dt: 0, kh: 0 });
          day.dt += num(r.DT_DV_staff) + num(r.DT_SP_staff);
          day.kh += num(r.SL_khach_BI_staff);
          if (x.d === HQ) coSoHomQua = true;
        });
      });
      L.push('💰 Sale – nhân viên dưới ' + pct(NGUONG_SALE) + ' mức TB ' + SO_NGAY + ' ngày của chính mình');
      if (!coSoHomQua) {
        L.push('⚠️ Báo cáo chưa có số sale ngày ' + HQ.slice(8) + '/' + HQ.slice(5, 7) + '.');
      } else {
        var thap = [], tongDT = 0, tongKH = 0, soNV = 0;
        Object.keys(nv).forEach(function (id) {
          var o = nv[id], h = o[HQ];
          if (!h || (h.dt <= 0 && h.kh <= 0)) return;
          soNV++; tongDT += h.dt; tongKH += h.kh;
          var tr0 = Object.keys(o).filter(function (d) { return d < HQ && (o[d].dt > 0 || o[d].kh > 0); });
          if (tr0.length < 3) return;
          var tb = tr0.reduce(function (s, d) { return s + o[d].dt; }, 0) / tr0.length;
          var tbkh = tr0.reduce(function (s, d) { return s + o[d].kh; }, 0) / tr0.length;
          if (tb > 0 && h.dt / tb < NGUONG_SALE) thap.push({ id: id, r: h.dt / tb, h: h, tb: tb, tbkh: tbkh });
        });
        thap.sort(function (a, b) { return a.r - b.r; });
        if (!thap.length) L.push('✓ Cả ' + soNV + ' nhân viên đi làm đều đạt từ ' + pct(NGUONG_SALE) + ' mức thường');
        thap.forEach(function (t) {
          var nm = ten[t.id] ? ten[t.id].n : ('Mã ' + t.id);
          L.push('• ' + nm + ': ' + tr(t.h.dt) + ' / TB ' + tr(t.tb) + ' (' + pct(t.r) + ') – ' + t.h.kh + ' khách (TB ' + Math.round(t.tbkh) + ')');
        });
        L.push('Tổng salon: ' + tr(tongDT) + ' – ' + tongKH + ' khách – ' + soNV + ' người');
      }

      // ---- Khách book: tỉ lệ khách book được phục vụ (giống báo cáo 0029) ----
      var b = bookSalon.filter(function (r) { return sid(r) === sal.id; });
      var tong = 0, den = 0;
      b.forEach(function (r) { var sl = num(r.sl_CusBook_day); tong += sl; if (num(r.count_sty_skin) !== 0) den += sl; });
      L.push('📅 Khách book');
      if (!tong) {
        L.push('⚠️ Báo cáo chưa có số khách book ngày này.');
      } else {
        var tl = den / tong;
        L.push((tl < NGUONG_BOOK ? '• ⚠️ ' : '✓ ') + 'Khách book đến: ' + den + '/' + tong + ' (' + pct(tl) + ')' +
          (tl < NGUONG_BOOK ? ' – ' + (tong - den) + ' khách bỏ book' : ''));
      }
      // Book theo stylist so với mức TB của chính người đó
      var bk = {};
      bookDays.forEach(function (x) {
        x.rows.forEach(function (r) {
          if (sid(r) !== sal.id || r.StylistId == null) return;
          var o = bk[r.StylistId] || (bk[r.StylistId] = {});
          o[x.d] = (o[x.d] || 0) + num(r.sl != null ? r.sl : r.cou);
        });
      });
      Object.keys(bk).forEach(function (id) {
        var o = bk[id], h = o[HQ];
        if (!h) return;
        var tr0 = Object.keys(o).filter(function (d) { return d < HQ && o[d] > 0; });
        if (tr0.length < 3) return;
        var tb = tr0.reduce(function (s, d) { return s + o[d]; }, 0) / tr0.length;
        if (tb > 0 && h / tb < NGUONG_BOOK_NV) {
          var nm = ten[id] ? ten[id].n : ('Mã ' + id);
          L.push('• ' + nm + ': ' + h + ' book / TB ' + tb.toFixed(1) + ' (' + pct(h / tb) + ')');
        }
      });
      L.push('');
    });
    txt.textContent = L.join('\n').trim();
  }).catch(function (e) { txt.textContent = '❌ Lỗi: ' + e; });
})();
