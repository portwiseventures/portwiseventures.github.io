/* Landed cost calculator. All rates are entered by the user; nothing is assumed. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var RES = { 'United Arab Emirates': 'https://www.dubaitrade.ae/', 'United Kingdom': 'https://www.trade-tariff.service.gov.uk/', 'Canada': 'https://www.cbsa-asfc.gc.ca/', 'New Zealand': 'https://www.customs.govt.nz/', 'Australia': 'https://www.abf.gov.au/', 'United States': 'https://hts.usitc.gov/', 'European Union': 'https://trade.ec.europa.eu/access-to-markets/' };
  var IDS = ['lcCur', 'lcQty', 'lcOrigin', 'lcDest', 'lcValue', 'lcFreight', 'lcIns', 'lcDuty', 'lcDutyBase', 'lcTax', 'lcTaxBase', 'lcHandling', 'lcOther', 'lcShow'];
  var DEF = {}; IDS.forEach(function (i) { DEF[i] = $(i).value; });
  var last = null, rateCache = {};
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; }
  function money(n, cur) { try { return n.toLocaleString('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 2 }); } catch (e) { return cur + ' ' + n.toFixed(2); } }
  function calc() {
    var cur = $('lcCur').value, v = num('lcValue'), f = num('lcFreight'), ins = num('lcIns'), dr = num('lcDuty'), tr = num('lcTax'), h = num('lcHandling'), o = num('lcOther'), q = num('lcQty');
    var cv = $('lcDutyBase').value === 'cif' ? v + f + ins : v, duty = cv * dr / 100, taxBase = $('lcTaxBase').value === 'cvd' ? cv + duty : cv, tax = taxBase * tr / 100;
    var total = v + f + ins + duty + tax + h + o;
    return { cur: cur, v: v, f: f, ins: ins, duty: duty, tax: tax, h: h, o: o, q: q, total: total, perUnit: q > 0 ? total / q : null, dr: dr, tr: tr, dutyBase: $('lcDutyBase').selectedOptions[0].text, taxBase: $('lcTaxBase').selectedOptions[0].text, origin: $('lcOrigin').value, dest: $('lcDest').value };
  }
  function show() {
    var r = calc(); last = r; var out = $('lcOut'), err = $('lcErr'); out.innerHTML = '';
    if (r.v <= 0) { err.style.display = ''; err.textContent = 'Enter a product value above zero to see the estimate.'; out.appendChild(el('span', 'hint', 'Waiting for a product value.')); return; } err.style.display = 'none';
    out.appendChild(el('span', 'big', money(r.total, r.cur)));
    [['Product cost', r.v], ['Freight', r.f], ['Insurance', r.ins], ['Customs duty (' + r.dr + '%, entered by you)', r.duty], ['Import taxes (' + r.tr + '%, entered by you)', r.tax], ['Port and handling', r.h], ['Other charges', r.o]].forEach(function (x) { var row = el('div', 'row'); row.appendChild(el('span', '', x[0])); row.appendChild(el('b', '', money(x[1], r.cur))); out.appendChild(row); });
    var pu = el('div', 'row'); pu.appendChild(el('span', '', 'Estimated cost per unit')); pu.appendChild(el('b', '', r.perUnit == null ? 'Enter a quantity' : money(r.perUnit, r.cur))); out.appendChild(pu);
    var bar = el('div'); bar.style.cssText = 'display:flex;height:12px;border-radius:6px;overflow:hidden;margin:10px 0 4px;background:#dde3ea'; var cols = ['#142D4C', '#385170', '#5B7FA6', '#E0B25B', '#b07a12', '#B0B8C1', '#8a97a6'];
    [r.v, r.f, r.ins, r.duty, r.tax, r.h, r.o].forEach(function (a, i) { if (a > 0) { var s = el('span'); s.style.cssText = 'width:' + (a / r.total * 100) + '%;background:' + cols[i]; s.title = money(a, r.cur); bar.appendChild(s); } }); out.appendChild(bar);
    out.appendChild(el('span', 'hint', 'Bar shows the share of each cost: product, freight, insurance, duty, taxes, handling, other.'));
    $('lcLookup').href = RES[r.dest] || 'markets.html#resources'; $('lcRfq').href = 'requirement-builder.html?destination=' + encodeURIComponent(r.dest);
    var s = $('lcShow').value; if (s && s !== r.cur) convert(r, s, out);
  }
  function convert(r, to, out) {
    var line = el('div', 'row'); line.appendChild(el('span', '', 'Total in ' + to)); var b = el('b', '', 'Loading rate...'); line.appendChild(b); out.appendChild(line);
    function fin(rates, note) { if (!rates || !rates[to]) { b.textContent = 'Rate unavailable'; return; } b.textContent = money(r.total * rates[to], to) + ' (1 ' + r.cur + ' = ' + rates[to].toFixed(4) + ' ' + to + ')'; r.converted = { to: to, text: b.textContent + note }; out.appendChild(el('span', 'hint', 'Rate source: open.er-api.com, indicative only' + note + '.')); }
    fetch('https://open.er-api.com/v6/latest/' + encodeURIComponent(r.cur)).then(function (x) { if (!x.ok) throw 0; return x.json(); }).then(function (j) { if (j.result !== 'success') throw 0; rateCache[r.cur] = j.rates; try { localStorage.setItem('pw_fx_' + r.cur, JSON.stringify({ rates: j.rates, date: j.time_last_update_utc })); } catch (e) {} fin(j.rates, ''); })
      .catch(function () { var s = null; try { s = JSON.parse(localStorage.getItem('pw_fx_' + r.cur)); } catch (e) {} if (s && s.rates) fin(s.rates, ' (saved rate from ' + s.date + ')'); else b.textContent = 'Live rate unavailable'; });
  }
  IDS.forEach(function (i) { $(i).addEventListener('input', show); $(i).addEventListener('change', show); });
  $('lcReset').onclick = function () { IDS.forEach(function (i) { $(i).value = DEF[i]; }); $('lcMsg').textContent = ''; show(); };
  $('lcPdf').onclick = function () {
    show(); var r = last; if (!r || r.v <= 0) { $('lcMsg').textContent = 'Enter a product value first.'; return; }
    try {
      var d = PW.pdf.start('Landed Cost Estimate'), y = 38, c = PW.pdf.clean; d.setTextColor(20, 45, 76); d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text('Total landed cost: ' + c(money(r.total, r.cur)), 14, y); y += 7;
      d.setFont('helvetica', 'normal'); d.setFontSize(10); d.setTextColor(60, 70, 80); d.text(c('Origin: ' + r.origin + '   Destination: ' + r.dest + '   Quantity: ' + r.q), 14, y); y += 6; d.text('Generated ' + new Date().toISOString().slice(0, 10), 14, y); y += 9;
      [['Product cost', r.v], ['Freight', r.f], ['Insurance', r.ins], ['Customs duty (' + r.dr + '%)', r.duty], ['Import taxes (' + r.tr + '%)', r.tax], ['Port and handling', r.h], ['Other charges', r.o]].forEach(function (x, i) { if (i % 2 === 0) { d.setFillColor(238, 242, 247); d.rect(14, y - 4.6, 182, 7.4, 'F'); } d.text(c(x[0]), 17, y); d.text(c(money(x[1], r.cur)), 193, y, { align: 'right' }); y += 7.4; });
      d.setFont('helvetica', 'bold'); d.text('Total', 17, y + 2); d.text(c(money(r.total, r.cur)), 193, y + 2, { align: 'right' }); y += 9; d.text('Estimated cost per unit', 17, y); d.text(r.perUnit == null ? 'n/a' : c(money(r.perUnit, r.cur)), 193, y, { align: 'right' }); y += 8;
      if (r.converted) { d.setFont('helvetica', 'normal'); d.text(c('Total in ' + r.converted.to + ': ' + r.converted.text), 17, y); y += 8; }
      y += 4; d.setFont('helvetica', 'bold'); d.text('Assumptions', 14, y); y += 6; d.setFont('helvetica', 'normal'); d.setFontSize(9);
      d.text(d.splitTextToSize(c('Duty rate and import tax rate were entered by the user and are not confirmed rates. Duty base: ' + r.dutyBase + '. Tax base: ' + r.taxBase + '. All amounts are in ' + r.cur + '. Actual costs depend on HS classification, destination regulations, customs valuation and applicable trade rules.'), 182), 14, y);
      PW.pdf.footer(d, 'Indicative planning estimate. Not customs advice or a quotation. Request a written quotation from Portwise Ventures for confirmed prices.'); d.save('Portwise-landed-cost-estimate.pdf'); $('lcMsg').textContent = 'PDF downloaded.';
    } catch (e) { $('lcMsg').textContent = 'The PDF could not be created. Please try again.'; }
  };
  show();
})();
