/* Cảnh báo sale từ checkout.30shine.com (danh sách hoá đơn) – chạy bằng dấu trang khi đã đăng nhập.
 * Gọi đúng API mà trang "Danh sách hoá đơn" dùng (billingview-service-api), bằng mã đăng nhập của chính trang.
 * Không gửi số liệu đi đâu, không hiện SĐT khách: chỉ hiện tổng số lên màn hình để chép.
 */
(function () {
  'use strict';
  var API = 'https://billingview-service-api.30shine.com/api/v1/checkout/bill-histories';
  // 9 salon vùng Thanh Sang + 671 QL50 (mã salon trên checkout)
  var SALONS = [[147, '99 TSN'], [11, '8 CVL'], [69, '312 LVS'], [188, '190 HB'], [22, '927 HG'],
    [193, '145 THT'], [47, '708 LTT'], [21, '575 AC'], [58, '730 TL10'], [208, '671 QL50']];
  var NGUONG = 0.8;  // dưới 80% mức TB 14 ngày → ⚠️
  var SO_NGAY = 14;
  var THU = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  if (!/30shine\.com$/.test(location.hostname)) { alert('Mở trang checkout.30shine.com (đã đăng nhập) rồi bấm dấu trang này.'); return; }

  function findToken() {
    var m = document.cookie.match(/(?:^|; )AccessToken=([^;]+)/);
    if (m) return decodeURIComponent(m[1]).replace(/^"|"$/g, '');
    var ls = localStorage.getItem('AccessToken');
    if (ls) return ls.replace(/^"|"$/g, '');
    var stores = [localStorage, sessionStorage];
    for (var s = 0; s < stores.length; s++) {
      for (var i = 0; i < stores[s].length; i++) {
        var v = stores[s].getItem(stores[s].key(i)) || '';
        var j = v.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
        if (j && /access/i.test(stores[s].key(i) + v.slice(0, 200))) return j[0];
      }
    }
    var c = document.cookie.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
    return c ? c[0] : null;
  }
  var token = findToken();
  if (!token) { alert('Chưa thấy mã đăng nhập. Đăng nhập checkout.30shine.com rồi bấm lại.'); return; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function tr(v) { return (v / 1e6).toFixed(1).replace('.', ',') + 'tr'; }
  function fk(v) { return Math.round(v / 1000).toLocaleString('vi-VN') + 'k'; }
  function pct(v) { return Math.round(v * 100) + '%'; }
  function nfc(x) { return String(x || '').normalize('NFC').trim(); }
  function ngayBill(b) {
    var t = String(b.completeBillTime || b.createdDate || b.billDate || b.bill_date || '');
    var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0];
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]);
    return '';
  }

  var now = new Date();
  var hom = prompt('Xem ngày nào? Gõ 0 = hôm nay (đến giờ này), 1 = hôm qua, hoặc YYYY-MM-DD', '1');
  if (hom === null) return;
  var HQ = /^\d{4}-\d{2}-\d{2}$/.test(hom.trim()) ? hom.trim()
    : iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (parseInt(hom, 10) || 0)));
  var dHQ = new Date(HQ + 'T00:00:00');
  var TU = iso(new Date(dHQ.getFullYear(), dHQ.getMonth(), dHQ.getDate() - SO_NGAY));
  var laHomNay = HQ === iso(now);

  var box = document.getElementById('cb-co') || document.createElement('div');
  box.id = 'cb-co';
  box.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto;font-family:system-ui,-apple-system,Segoe UI,sans-serif';
  box.innerHTML = '<div style="background:#fff;color:#111;border-radius:16px;max-width:560px;width:100%;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.3)">' +
    '<div style="font-weight:700;font-size:17px;margin-bottom:8px">Cảnh báo sale (checkout)</div>' +
    '<pre id="cb-co-txt" style="white-space:pre-wrap;font:14px/1.5 system-ui,-apple-system,sans-serif;margin:0 0 12px">Đang tải…</pre>' +
    '<button id="cb-co-copy" style="width:100%;padding:14px;font-size:16px;font-weight:700;border:0;border-radius:10px;background:#1a7f37;color:#fff">CHÉP CẢNH BÁO</button>' +
    '<button id="cb-co-close" style="width:100%;padding:10px;margin-top:8px;font-size:14px;border:0;border-radius:10px;background:#eef2f7">Đóng</button></div>';
  document.body.appendChild(box);
  var txt = document.getElementById('cb-co-txt');
  document.getElementById('cb-co-close').onclick = function () { box.remove(); };
  document.getElementById('cb-co-copy').onclick = function () {
    var b = this;
    navigator.clipboard.writeText(txt.textContent).then(function () { b.textContent = 'ĐÃ CHÉP ✓'; },
      function (e) { alert('Không chép được: ' + e); });
  };

  var het = false;
  function call(id, tu, den) {
    return fetch(API + '?salonId=' + id + '&fromDate=' + tu + '&toDate=' + den,
      { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } })
      .then(function (r) { if (r.status === 401) { het = true; return null; } return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  var xong = 0;
  Promise.all(SALONS.map(function (s) {
    return Promise.all([call(s[0], TU, HQ), call(s[0], HQ, HQ)]).then(function (r) {
      xong++; txt.textContent = 'Đang tải ' + xong + '/' + SALONS.length + ' salon…';
      return { id: s[0], ten: s[1], range: r[0], ngay: r[1] };
    });
  })).then(function (all) {
    if (het) { txt.textContent = '❌ Mã đăng nhập checkout đã hết hạn. Tải lại trang, đăng nhập rồi bấm dấu trang lại.'; return; }
    var L = ['Cảnh báo sale (checkout) – ' + THU[dHQ.getDay()] + ' ' + pad(dHQ.getDate()) + '/' + pad(dHQ.getMonth() + 1) +
      (laHomNay ? ' – tính đến ' + pad(now.getHours()) + 'h' + pad(now.getMinutes()) : ''),
      '(⚠️ = dưới ' + pct(NGUONG) + ' mức TB ' + SO_NGAY + ' ngày' + (laHomNay ? '; hôm nay chưa hết ngày nên so cho biết thôi' : '') + ')', ''];
    var tongDT = 0, tongBill = 0, khongCo = [];
    all.forEach(function (s) {
      if (!s.range || !s.ngay) { khongCo.push(s.ten); return; }
      var bills = s.range.bills || [];
      var theoNgay = {}, st = {}, sk = {};
      bills.forEach(function (b) {
        var d = ngayBill(b); if (!d) return;
        var m = num(b.totalMoney);
        var x = theoNgay[d] || (theoNgay[d] = { dt: 0, bill: 0 }); x.dt += m; x.bill++;
        [[st, b.stylistName], [sk, b.skinnerName]].forEach(function (p) {
          var nm = nfc(p[1]); if (!nm) return;
          var o = p[0][nm] || (p[0][nm] = {});
          var c = o[d] || (o[d] = { dt: 0, bill: 0, book: 0 });
          c.dt += m; c.bill++; if (b.bookingId) c.book++;
        });
      });
      var h = theoNgay[HQ] || { dt: 0, bill: 0 };
      var tr0 = Object.keys(theoNgay).filter(function (d) { return d < HQ && theoNgay[d].bill > 0; });
      var tbDT = tr0.length ? tr0.reduce(function (a, d) { return a + theoNgay[d].dt; }, 0) / tr0.length : 0;
      var tbBill = tr0.length ? tr0.reduce(function (a, d) { return a + theoNgay[d].bill; }, 0) / tr0.length : 0;
      var rp = s.ngay.totalReport || {};
      tongDT += h.dt; tongBill += h.bill;
      var lowS = tbDT > 0 && h.dt / tbDT < NGUONG;
      L.push((lowS ? '🏠 ⚠️ ' : '🏠 ') + s.ten + ': ' + tr(h.dt) + (tbDT ? ' (' + pct(h.dt / tbDT) + ' TB ' + tr(tbDT) + ')' : '') +
        ' · ' + h.bill + ' bill' + (tbBill ? ' (TB ' + Math.round(tbBill) + ')' : '') +
        ' · AOV ' + fk(h.bill ? h.dt / h.bill : 0));
      var phu = [];
      if (rp.product_money != null) phu.push('MP ' + fk(num(rp.product_money)));
      if (rp.totalBuyAccountTopup != null) phu.push('Topup ' + fk(num(rp.totalBuyAccountTopup)));
      if (rp.product_shinemember_money != null) phu.push('Shine Member ' + fk(num(rp.product_shinemember_money)));
      if (phu.length) L.push('   ' + phu.join(' · '));
      [[st, '✂️'], [sk, '💆']].forEach(function (g) {
        var thap = [], vang = [];
        Object.keys(g[0]).forEach(function (nm) {
          var o = g[0][nm], x = o[HQ];
          var t0 = Object.keys(o).filter(function (d) { return d < HQ; });
          if (!x) { if (t0.length >= 5) vang.push(nm); return; }
          if (t0.length < 3) return;
          var tb = t0.reduce(function (a, d) { return a + o[d].dt; }, 0) / t0.length;
          var tbb = t0.reduce(function (a, d) { return a + o[d].bill; }, 0) / t0.length;
          if (tb > 0 && x.dt / tb < NGUONG) thap.push({ nm: nm, r: x.dt / tb, x: x, tb: tb, tbb: tbb });
        });
        thap.sort(function (a, b) { return a.r - b.r; });
        thap.forEach(function (t) {
          L.push('   ' + g[1] + ' ⚠️ ' + t.nm + ': ' + fk(t.x.dt) + ' / TB ' + fk(t.tb) + ' (' + pct(t.r) + ') · ' +
            t.x.bill + ' bill (TB ' + t.tbb.toFixed(1).replace('.', ',') + ') · book ' + t.x.book);
        });
        if (vang.length && !laHomNay) L.push('   ' + g[1] + ' không có bill: ' + vang.join(', '));
      });
    });
    L.push('', 'Tổng: ' + tr(tongDT) + ' · ' + tongBill + ' bill');
    if (khongCo.length) L.push('Không đọc được: ' + khongCo.join(', ') + ' (tài khoản không có quyền hoặc lỗi mạng)');
    txt.textContent = L.join('\n');
  }).catch(function (e) { txt.textContent = '❌ Lỗi: ' + e; });
})();
