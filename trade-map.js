/* Interactive trade map. Statuses are defined here; add or change countries by editing INFO and the group ids in trade-map.html. */
(function () {
  'use strict';
  var svg = document.getElementById('wmap'); if (!svg) return;
  var $ = function (id) { return document.getElementById(id); }, W = 960, H = 500, view = [0, 0, W, H], cur = '', anim = 0;
  var RES = {"uae": "https://www.dubaitrade.ae/", "uk": "https://www.trade-tariff.service.gov.uk/", "canada": "https://www.cbsa-asfc.gc.ca/", "nz": "https://www.customs.govt.nz/", "australia": "https://www.abf.gov.au/", "usa": "https://hts.usitc.gov/", "europe": "https://www.europa.eu/youreurope/business/"};
  var NAMES = {"bangladesh": "Bangladesh", "india": "India", "uae": "United Arab Emirates", "uk": "United Kingdom", "canada": "Canada", "nz": "New Zealand", "australia": "Australia", "usa": "United States", "europe": "Europe (EU member states)"};
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function setView(v) { view = v; svg.setAttribute('viewBox', v.map(function (n) { return Math.round(n * 10) / 10; }).join(' ')); }
  function go(to) { cancelAnimationFrame(anim); var from = view.slice(), t0 = null; function step(t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 320), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; setView(from.map(function (f, i) { return f + (to[i] - f) * e; })); if (k < 1) anim = requestAnimationFrame(step); } anim = requestAnimationFrame(step); }
  function clamp(v) { var w = Math.max(70, Math.min(W, v[2])), h = w * H / W, x = Math.max(0, Math.min(W - w, v[0])), y = Math.max(0, Math.min(H - h, v[1])); return [x, y, w, h]; }
  function zoomBy(f) { var cx = view[0] + view[2] / 2, cy = view[1] + view[3] / 2, w = view[2] * f; go(clamp([cx - w / 2, cy - (w * H / W) / 2, w, w * H / W])); }
  function focusOn(g) {
    var ps = [].slice.call(svg.querySelectorAll('path[data-g="' + g + '"]')), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ps.forEach(function (p) { var b = p.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); });
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = Math.max((x1 - x0) * 2.6, (y1 - y0) * 2.6 * W / H, 150); go(clamp([cx - w / 2, cy - (w * H / W) / 2, w, w * H / W]));
  }
  function link(card, label, href, cls, ext) { var row = card.querySelector('.pr') || card.appendChild(el('div', 'pr')); var a = el('a', cls || 'btn', label); a.href = href; if (ext) { a.target = '_blank'; a.rel = 'noopener'; } row.appendChild(a); }
  function info(g) {
    var box = $('mapInfo'), n = NAMES[g], st = svg.querySelector('path[data-g="' + g + '"]').getAttribute('class');
    box.innerHTML = ''; box.appendChild(el('h3', '', n));
    if (g === 'bangladesh') {
      box.appendChild(el('span', 'badge live', 'Sourcing country')); box.appendChild(el('p', '', 'We currently source from Bangladesh. Products listed today are EVARA jute products and AGRINEST fresh vegetables and fruits.'));
      link(box, 'Browse products', 'marketplace.html'); link(box, 'Sourcing hub', 'sourcing.html', 'btn2');
    } else if (g === 'india') {
      box.appendChild(el('span', 'badge est', 'Planned sourcing')); box.appendChild(el('p', '', 'We plan to begin sourcing from India from January 2027. Product categories will be announced once confirmed.'));
      link(box, 'Ask about India sourcing', 'business-desk.html');
    } else {
      box.appendChild(el('span', 'badge cat', 'Target market')); box.appendChild(el('p', '', n + ' is a market we are building towards. It is not yet a confirmed active market.'));
      box.appendChild(el('p', 'sm', 'Product categories we list today: EVARA (jute and leather) and AGRINEST (fresh vegetables and fruits). PRIME CREST and LOGICWISE details are to be confirmed. Import requirements differ by product and market, and are confirmed in your quotation.'));
      link(box, 'Enquire about shipping to ' + n.replace(' (EU member states)', ''), 'requirement-builder.html?destination=' + encodeURIComponent(n.replace(' (EU member states)', '')));
      link(box, 'Official trade resources', RES[g], 'btn2', true); link(box, 'Countries & Markets', 'markets.html#countries', 'btn2');
    }
  }
  function select(g, zoom) {
    cur = g; [].slice.call(svg.querySelectorAll('path[data-g]')).forEach(function (p) { p.classList.toggle('sel', p.getAttribute('data-g') === g); });
    [].slice.call($('mapChips').children).forEach(function (b) { b.className = b.getAttribute('data-g') === g ? 'on' : ''; }); info(g); if (zoom !== false) focusOn(g);
  }
  svg.addEventListener('click', function (e) { var p = e.target.closest ? e.target.closest('path[data-g]') : null; if (p) select(p.getAttribute('data-g')); });
  svg.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('data-g')) { e.preventDefault(); select(e.target.getAttribute('data-g')); } });
  [].slice.call($('mapChips').children).forEach(function (b) { b.onclick = function () { select(b.getAttribute('data-g')); }; });
  $('zin').onclick = function () { zoomBy(.6); }; $('zout').onclick = function () { zoomBy(1 / .6); }; $('zreset').onclick = function () { go([0, 0, W, H]); };
  var q = new URLSearchParams(location.search).get('c'); if (q && NAMES[q]) select(q);
})();
