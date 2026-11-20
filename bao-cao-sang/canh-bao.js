/* Cảnh báo sáng – chạy bằng dấu trang trên reports.30shine.com (đã đăng nhập 30Shine).
 * Đọc đúng các file số liệu mà 2 báo cáo Sale v7 (0019) và Chất lượng salon (0029) dùng,
 * trình duyệt tự gửi phiên đăng nhập của bạn. Không gửi số liệu đi đâu cả: chỉ hiện lên màn hình để chép.
 */
(function () {
  'use strict';
  var SALONS = [{ id: 22, ten: '927 HG' }, { id: 208, ten: '671 QL50' }];
  var NGUONG_SALE = 0.7;   // UDN/MP/Topup/Book hôm qua < 70% mức TB 14 ngày của chính người đó → ⚠️
  var NGUONG_BOOK = 0.8;   // tỉ lệ khách book được phục vụ < 80% (salon)
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
    '<div style="font-weight:700;font-size:17px;margin-bottom:8px">Năng suất &amp; cảnh báo</div>' +
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

  function nfc(x) { return String(x || '').normalize('NFC').trim(); }
  function fk(v) { return Math.round(v / 1000).toLocaleString('vi-VN') + 'k'; }

  Promise.all([
    firstOk([S + 'sale-dim-staff/sale-dim-staff.json', '/dim/sale-dim-staff.json', S + 'sale-dim-staff.json']),
    firstOk([C + 'clsalon-dim-staff/clsalon-dim-staff.json', '/dim/clsalon-dim-staff.json', C + 'clsalon-dim-staff.json']),
    firstOk([S + 'sale-dim-category/sale-dim-category.json', '/dim/sale-dim-category.json', S + 'sale-dim-category.json']),
    daily(S, 'sale-staff-category'),
    daily(S, 'sale-topup-mua'),
    daily(C, 'clsalon-book-stylist'),
    daily(C, 'clsalon-book-skinner'),
    get(C + 'clsalon-book-salon/clsalon-book-salon-' + HQ + '.json')
  ]).then(function (res) {
    if (het) { txt.textContent = '❌ Phiên đăng nhập báo cáo đã hết. Tải lại trang, đăng nhập 30Shine rồi bấm dấu trang lại.'; return; }
    var info = {}, idByName = {};
    res[0].concat(res[1]).forEach(function (r) {
      var id = r.staff_ID != null ? r.staff_ID : r.Staff_ID;
      if (id == null || !r.staff_name) return;
      if (!info[id]) info[id] = { n: nfc(r.staff_name), p: nfc(r.staff_position) };
      idByName[nfc(r.staff_name).toLowerCase()] = id;
    });
    var udnType = {};
    res[2].forEach(function (r) { if (nfc(r.Nganh_hang) === '3.DV_UND') udnType[nfc(r.Type_new)] = 1; });
    var cat = res[3], topDays = res[4], bkSt = res[5], bkSk = res[6], bookSalon = res[7] || [];
    var d0 = new Date(HQ + 'T00:00:00');
    var L = ['Năng suất & cảnh báo – ' + THU[d0.getDay()] + ' ' + pad(d0.getDate()) + '/' + pad(d0.getMonth() + 1) + '/' + d0.getFullYear(),
      '(⚠️ = dưới ' + pct(NGUONG_SALE) + ' mức TB ' + SO_NGAY + ' ngày của chính người đó)', ''];

    SALONS.forEach(function (sal) {
      // nv[id] = {role, d: {iso: {udn, mp, topup, book}}}
      var nv = {}, coSo = false;
      function cell(id, d) {
        var o = nv[id] || (nv[id] = { role: '', d: {} });
        return o.d[d] || (o.d[d] = { udn: 0, mp: 0, topup: 0, book: 0 });
      }
      cat.forEach(function (x) {
        x.rows.forEach(function (r) {
          if (sid(r) !== sal.id || r.staff_ID == null) return;
          var tn = nfc(r.Type_new), c = cell(r.staff_ID, x.d);
          if (udnType[tn]) c.udn += num(r.DT_DV_detail);
          if (tn.indexOf('_SP') >= 0) c.mp += num(r.DT_SP_detail);
          if (x.d === HQ) coSo = true;
        });
      });
      topDays.forEach(function (x) {
        x.rows.forEach(function (r) {
          if (sid(r) !== sal.id) return;
          var id = idByName[nfc(r.staff_name).toLowerCase()];
          if (id != null) cell(id, x.d).topup += num(r.DT_mua);
        });
      });
      [[bkSt, 'StylistId', 'st'], [bkSk, 'Meta_skinnerID', 'sk']].forEach(function (cfg) {
        cfg[0].forEach(function (x) {
          x.rows.forEach(function (r) {
            if (sid(r) !== sal.id || r[cfg[1]] == null) return;
            cell(r[cfg[1]], x.d).book += num(r.sl != null ? r.sl : r.cou);
            nv[r[cfg[1]]].role = nv[r[cfg[1]]].role || cfg[2];
          });
        });
      });

      L.push('🏠 ' + sal.ten);
      if (!coSo) { L.push('⚠️ Báo cáo chưa có số ngày ' + HQ.slice(8) + '/' + HQ.slice(5, 7) + '.', ''); return; }

      function dong(id, keys) {
        var o = nv[id], h = o.d[HQ] || { udn: 0, mp: 0, topup: 0, book: 0 };
        var truoc = Object.keys(o.d).filter(function (d) { return d < HQ; });
        var nhan = { udn: 'UDN', mp: 'MP', topup: 'Topup', book: 'Book' }, canh = [];
        var parts = keys.map(function (key) {
          var tb = truoc.length >= 3 ? truoc.reduce(function (s, d) { return s + o.d[d][key]; }, 0) / truoc.length : 0;
          var low = tb > 0 && h[key] / tb < NGUONG_SALE;
          if (low) canh.push(nhan[key] + ' ' + pct(h[key] / tb));
          return nhan[key] + ' ' + (key === 'book' ? h[key] : fk(h[key])) + (low ? '⚠️' : '');
        });
        var nm = info[id] ? info[id].n : ('Mã ' + id);
        return { s: '• ' + nm + ': ' + parts.join(' · '), canh: canh.length, di: keys.some(function (x) { return h[x] > 0; }) };
      }
      function role(id) {
        var p = info[id] ? info[id].p.toLowerCase() : '';
        if (p.indexOf('skinner') >= 0) return 'sk';
        if (p.indexOf('stylist') >= 0) return 'st';
        return nv[id].role;
      }
      [['st', '✂️ Stylist (UDN · MP · Book)', ['udn', 'mp', 'book']], ['sk', '💆 Skinner (MP · Topup · Book)', ['mp', 'topup', 'book']]].forEach(function (g) {
        var rows = Object.keys(nv).filter(function (id) { return role(id) === g[0]; })
          .map(function (id) { return dong(id, g[2]); }).filter(function (r) { return r.di; })
          .sort(function (a, b) { return b.canh - a.canh; });
        L.push(g[1]);
        if (!rows.length) L.push('(không có số)');
        rows.forEach(function (r) { L.push(r.s); });
      });

      var b = bookSalon.filter(function (r) { return sid(r) === sal.id; }), tong = 0, den = 0;
      b.forEach(function (r) { var sl = num(r.sl_CusBook_day); tong += sl; if (num(r.count_sty_skin) !== 0) den += sl; });
      if (tong) {
        var tl = den / tong;
        L.push((tl < NGUONG_BOOK ? '📅 ⚠️ ' : '📅 ✓ ') + 'Khách book đến: ' + den + '/' + tong + ' (' + pct(tl) + ')' +
          (tl < NGUONG_BOOK ? ' – ' + (tong - den) + ' khách bỏ book' : ''));
      }
      L.push('');
    });
    txt.textContent = L.join('\n').trim();
  }).catch(function (e) { txt.textContent = '❌ Lỗi: ' + e; });
})();
