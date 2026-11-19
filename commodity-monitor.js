/* Commodity monitor. prices.json format (add only verified data with a source link):
   [{"commodity":"","market":"","price":0,"currency":"USD","unit":"per tonne","source":"","sourceUrl":"https://","updated":"YYYY-MM-DD","history":[{"date":"YYYY-MM","price":0}]}] */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var S = [
    ['Agricultural products, fruit and vegetables', 'FAO Food Price Monitoring and Analysis (FPMA)', 'https://fpma.fao.org/', 'USDA Agricultural Marketing Service: Market News', 'https://www.ams.usda.gov/market-news'],
    ['General commodity prices', 'World Bank Commodity Markets', 'https://www.worldbank.org/en/research/commodity-markets', '', ''],
    ['Fish and seafood', 'FAO GLOBEFISH', 'https://www.fao.org/in-action/globefish', '', ''],
    ['Jute, leather, sugarcane bagasse, areca palm leaf, coconut coir', 'No single official public price series has been confirmed.', '', 'Ask us for current supplier quotations.', 'business-desk.html']
  ];
  var g = $('cmSources'); S.forEach(function (s, i) { var c = el('div', 'card ' + ['', 't', 'p', 'g'][i % 4]); c.appendChild(el('h3', '', s[0])); c.appendChild(el('p', '', s[1])); var r = el('div', 'pr'); if (s[2]) { var a = el('a', 'btn2', 'Open source'); a.href = s[2]; a.target = '_blank'; a.rel = 'noopener'; r.appendChild(a); } if (s[3]) { if (s[4]) { var b = el('a', /^http/.test(s[4]) ? 'btn2' : 'btn', s[3]); b.href = s[4]; if (/^http/.test(s[4])) { b.target = '_blank'; b.rel = 'noopener'; } r.appendChild(b); } } c.appendChild(r); g.appendChild(c); });
  function fill(sel, vals, label) { sel.innerHTML = ''; var o = el('option', '', label); o.value = ''; sel.appendChild(o); vals.forEach(function (v) { var x = el('option', '', v); x.value = v; sel.appendChild(x); }); }
  function chart(h, cur, unit) {
    if (!h || h.length < 2) return null; var W = 560, H = 200, p = 30, min = Math.min.apply(null, h.map(function (x) { return x.price; })), max = Math.max.apply(null, h.map(function (x) { return x.price; })), rg = max - min || 1;
    var pts = h.map(function (x, i) { return [p + i * (W - 2 * p) / (h.length - 1), H - p - (x.price - min) / rg * (H - 2 * p)]; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Price history" style="width:100%;background:#fff;border:1px solid #dde3ea;border-radius:8px"><polyline fill="none" stroke="#142D4C" stroke-width="2.5" points="' + pts.map(function (q) { return q.join(','); }).join(' ') + '"/>' + pts.map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3" fill="#E0B25B"/>'; }).join('') + '<text x="4" y="14" font-size="10" fill="#5b6773">' + max + ' ' + cur + ' ' + unit + '</text><text x="4" y="' + (H - 6) + '" font-size="10" fill="#5b6773">' + min + '</text><text x="' + p + '" y="' + (H - 6) + '" font-size="10" fill="#5b6773">' + h[0].date + '</text><text x="' + (W - p) + '" y="' + (H - 6) + '" font-size="10" text-anchor="end" fill="#5b6773">' + h[h.length - 1].date + '</text></svg>';
  }
  fetch('prices.json').then(function (r) { return r.json(); }).then(function (d) {
    fill($('cmC'), [], 'All commodities'); fill($('cmM'), [], 'All markets'); if (!Array.isArray(d) || !d.length) return; $('cmEmpty').style.display = 'none';
    var cs = [], ms = []; d.forEach(function (x) { if (cs.indexOf(x.commodity) < 0) cs.push(x.commodity); if (ms.indexOf(x.market) < 0) ms.push(x.market); }); fill($('cmC'), cs.sort(), 'All commodities'); fill($('cmM'), ms.sort(), 'All markets');
    function draw() {
      var o = $('cmData'); o.innerHTML = ''; $('cmChart').innerHTML = '';
      var r = d.filter(function (x) { return (!$('cmC').value || x.commodity === $('cmC').value) && (!$('cmM').value || x.market === $('cmM').value); });
      r.forEach(function (x) { var c = el('div', 'card'); c.appendChild(el('span', 'badge est', 'Indicative reference price')); c.appendChild(el('h3', '', x.commodity)); c.appendChild(el('span', 'big', x.price + ' ' + x.currency + ' ' + x.unit)); c.appendChild(el('p', 'sm', 'Market: ' + x.market + '. Updated: ' + x.updated)); var a = el('a', 'btn2', 'Source: ' + x.source); a.href = x.sourceUrl; a.target = '_blank'; a.rel = 'noopener'; c.appendChild(a); o.appendChild(c); if (r.length === 1) { var s = chart(x.history, x.currency, x.unit); if (s) $('cmChart').innerHTML = s; } });
      if (!r.length) o.appendChild(el('p', '', 'No data for this selection.'));
    }
    $('cmC').onchange = draw; $('cmM').onchange = draw; draw();
  }).catch(function () { $('cmEmpty').style.display = ''; });
})();
