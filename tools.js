/* Trade Intelligence tools: shipping estimate, live currency conversion, seasonal availability (catalogue data). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function money(n, d) { return Number(n).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d }); }
  function row(box, k, v) { var r = el('div', 'row'); r.appendChild(el('span', '', k)); r.appendChild(el('b', '', v)); box.appendChild(r); }
  /* ---- Shipping estimate (calculated from the user's own inputs) ---- */
  if ($('tShipGo')) $('tShipGo').onclick = function () {
    var mode = $('tShipType').value, kg = Math.max(0, +$('tKg').value || 0), cbm = Math.max(0, +$('tCbm').value || 0), rk = Math.max(0, +$('tRateKg').value || 0), rc = Math.max(0, +$('tRateCbm').value || 0), out = $('tShipOut'), total, basis;
    out.innerHTML = '';
    var big = el('span', 'big'); out.appendChild(big);
    if (mode === 'air') {
      var vol = cbm * 167, chg = Math.max(kg, vol); total = chg * rk;
      basis = chg === kg ? 'actual weight' : 'volumetric weight';
      row(out, 'Actual weight', money(kg) + ' kg'); row(out, 'Volumetric weight (1 CBM = 167 kg)', money(vol) + ' kg'); row(out, 'Chargeable weight (' + basis + ')', money(chg) + ' kg'); row(out, 'Rate per kg', 'USD ' + money(rk));
    } else {
      var wc = kg * rk, vc = cbm * rc; total = Math.max(wc, vc); basis = total === wc ? 'weight' : 'volume';
      row(out, 'Weight-based charge', 'USD ' + money(wc)); row(out, 'Volume-based charge', 'USD ' + money(vc)); row(out, 'Applied (higher of the two)', basis);
    }
    big.textContent = 'Estimated freight: USD ' + money(total);
  };
  /* ---- Currency (live data, with saved fallback) ---- */
  function fxSave(from, d) { try { localStorage.setItem('pw_fx_' + from, JSON.stringify(d)); } catch (e) {} }
  function fxLoad(from) { try { return JSON.parse(localStorage.getItem('pw_fx_' + from)); } catch (e) { return null; } }
  function fxShow(d, amt, from, to, saved) {
    var out = $('tFxOut'); out.innerHTML = ''; var rate = d.rates[to];
    var big = el('span', 'big', money(amt) + ' ' + from + ' = ' + money(amt * rate) + ' ' + to); out.appendChild(big);
    row(out, 'Rate', '1 ' + from + ' = ' + money(rate, 4) + ' ' + to);
    row(out, saved ? 'Saved rate from' : 'Rates updated', d.date); out.appendChild(el('span', 'hint', saved ? 'Live rates are unavailable right now, so a previously saved rate is shown.' : 'Live rate from a public feed. Indicative only.'));
  }
  function fx() {
    var amt = +$('tFxAmt').value || 0, from = $('tFxFrom').value, to = $('tFxTo').value, out = $('tFxOut');
    out.innerHTML = ''; out.appendChild(el('span', 'hint', 'Loading live rate…'));
    fetch('https://open.er-api.com/v6/latest/' + encodeURIComponent(from)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (j.result !== 'success' || !j.rates[to]) throw 0;
      var d = { rates: j.rates, date: j.time_last_update_utc.replace(/ \+0000$/, ' UTC') }; fxSave(from, d); fxShow(d, amt, from, to, false);
    }).catch(function () {
      var d = fxLoad(from); out.innerHTML = '';
      if (d && d.rates && d.rates[to]) fxShow(d, amt, from, to, true);
      else out.appendChild(el('span', 'hint', 'Live rate unavailable right now. Please check your bank or a trusted currency provider.'));
    });
  }
  if ($('tFxGo')) { $('tFxGo').onclick = fx; $('tFxSwap').onclick = function () { var a = $('tFxFrom').value; $('tFxFrom').value = $('tFxTo').value; $('tFxTo').value = a; fx(); }; }
  /* ---- Seasonal availability (from products.json) ---- */
  if ($('tSeasonOut')) fetch('products.json').then(function (r) { return r.json(); }).then(function (all) {
    var P = all.filter(function (p) { return p.brand === 'AGRINEST'; }), cats = [], sel = $('tSeasonCat'), q = $('tSeasonQ');
    P.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    cats.forEach(function (c) { var o = el('option', '', c); o.value = c; sel.appendChild(o); });
    function draw() {
      var out = $('tSeasonOut'), list = P.filter(function (p) { return (!sel.value || p.category === sel.value) && (!q.value || p.name.toLowerCase().indexOf(q.value.toLowerCase()) > -1); });
      out.innerHTML = ''; if (!list.length) { out.appendChild(el('span', 'hint', 'No products match.')); return; }
      var ul = el('ul'); list.forEach(function (p) { var li = el('li'); var a = el('a', '', p.name); a.href = 'product.html?p=' + encodeURIComponent(p.id); li.appendChild(a); li.appendChild(document.createTextNode(': ' + p.availability)); ul.appendChild(li); });
      out.appendChild(el('span', 'big', list.length + ' products')); out.appendChild(ul);
    }
    sel.onchange = draw; q.oninput = draw; draw();
  }).catch(function () { $('tSeasonOut').textContent = 'Season details are confirmed on request.'; });
  /* ---- Market reports (reports.json, optional) ---- */
  var rl = $('reportList');
  if (rl) fetch('reports.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (d) {
    if (!Array.isArray(d) || !d.length) return;
    rl.innerHTML = '';
    d.forEach(function (x) { var c = el('div', 'card'); c.appendChild(el('p', 'bt', (x.category || 'Report') + (x.date ? ' · ' + x.date : ''))); c.appendChild(el('h3', '', x.title)); c.appendChild(el('p', '', x.summary || '')); if (x.file) { var a = el('a', 'btn', 'Download'); a.href = x.file; c.appendChild(a); } rl.appendChild(c); });
  }).catch(function () {});
})();
