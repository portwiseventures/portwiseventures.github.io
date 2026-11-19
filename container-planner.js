/* Container loading planner: indicative single-grid estimate. Not a certified loading plan. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var C = {
    '20': { name: '20-foot standard', L: 5.898, W: 2.352, H: 2.393, P: 28000, DW: 2.34, DH: 2.28, typical: true },
    '40': { name: '40-foot standard', L: 12.032, W: 2.352, H: 2.393, P: 26500, DW: 2.34, DH: 2.28, typical: true },
    '40hc': { name: '40-foot high cube', L: 12.032, W: 2.352, H: 2.698, P: 26500, DW: 2.34, DH: 2.585, typical: true }
  };
  var U = { cm: .01, m: 1, 'in': .0254, ft: .3048 }, last = null;
  var IDS = ['cpUnit', 'cpWU', 'cpL', 'cpW', 'cpH', 'cpWt', 'cpN', 'cpType', 'ccL', 'ccW', 'ccH', 'ccP', 'ccDW', 'ccDH', 'cpUp'];
  function n(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function box() {
    var u = U[$('cpUnit').value], t = $('cpType').value, c;
    if (t === 'custom') c = { name: 'Custom container (user-entered)', L: n('ccL'), W: n('ccW'), H: n('ccH'), P: n('ccP'), DW: n('ccDW'), DH: n('ccDH'), typical: false }; else c = C[t];
    return { p: { l: n('cpL') * u, w: n('cpW') * u, h: n('cpH') * u, kg: n('cpWt') * ($('cpWU').value === 'lb' ? .45359237 : 1), n: Math.floor(n('cpN')) }, c: c, up: $('cpUp').checked };
  }
  function orient(p, up) { var o = [[p.l, p.w, p.h], [p.w, p.l, p.h]]; if (!up) o = o.concat([[p.l, p.h, p.w], [p.h, p.l, p.w], [p.w, p.h, p.l], [p.h, p.w, p.l]]); return o; }
  function calc() {
    var b = box(), p = b.p, c = b.c; if (!p.l || !p.w || !p.h || !c.L || !c.W || !c.H) return null;
    var best = null;
    orient(p, b.up).forEach(function (o) {
      var nl = Math.floor(c.L / o[0] + 1e-9), nw = Math.floor(c.W / o[1] + 1e-9), nh = Math.floor(c.H / o[2] + 1e-9), cnt = nl * nw * nh, door = (!c.DW || !c.DH) ? true : (o[1] <= c.DW && o[2] <= c.DH);
      var sc = (door ? 1e9 : 0) + cnt; if (!best || sc > best.sc) best = { o: o, nl: nl, nw: nw, nh: nh, cnt: cnt, door: door, sc: sc };
    });
    var vol = p.l * p.w * p.h, cvol = c.L * c.W * c.H, byW = (p.kg > 0 && c.P > 0) ? Math.floor(c.P / p.kg) : Infinity, fit = Math.min(best.cnt, byW), limit = byW < best.cnt ? 'weight (payload limit)' : 'space';
    var loaded = p.n ? Math.min(p.n, fit) : fit, containers = p.n && fit > 0 ? Math.ceil(p.n / fit) : null;
    return { b: b, best: best, vol: vol, cvol: cvol, bySpace: best.cnt, byW: byW, fit: fit, limit: limit, loaded: loaded, containers: containers, util: loaded * vol / cvol, weight: loaded * p.kg, unused: 1 - loaded * vol / cvol };
  }
  function f(x, d) { return x.toLocaleString('en-US', { maximumFractionDigits: d == null ? 0 : d }); }
  function viz(r) {
    var v = $('cpViz'); v.innerHTML = ''; var c = r.b.c, W = 360, sc = W / c.L, boxL = r.best.o[0], boxW = r.best.o[1], boxH = r.best.o[2], h1 = c.W * sc, h2 = c.H * sc;
    var rects = '', i, j, shown = Math.min(r.loaded, r.fit), cols = r.best.nl, rows = r.best.nw, per = cols * rows, k = 0;
    function drawTop() { var s = ''; for (j = 0; j < rows && k < shown; j++) for (i = 0; i < cols && k < shown; i++, k++) s += '<rect x="' + (i * boxL * sc).toFixed(1) + '" y="' + (j * boxW * sc).toFixed(1) + '" width="' + (boxL * sc).toFixed(1) + '" height="' + (boxW * sc).toFixed(1) + '" fill="#5B7FA6" stroke="#fff" stroke-width=".6"/>'; return s; }
    var top = '<svg viewBox="0 0 ' + W + ' ' + h1.toFixed(1) + '" role="img" aria-label="Top view of the container floor" style="width:100%;background:#fff;border:2px solid #142D4C;border-radius:4px">' + drawTop() + '</svg>';
    var layers = per ? Math.min(r.best.nh, Math.ceil(shown / per)) : 0, side = '';
    for (var a = 0; a < layers; a++) for (i = 0; i < cols; i++) { var filled = a < Math.floor(shown / per) || (a === Math.floor(shown / per) && i * rows < shown - a * 0 - Math.floor(shown / per) * per); side += '<rect x="' + (i * boxL * sc).toFixed(1) + '" y="' + (h2 - (a + 1) * boxH * sc).toFixed(1) + '" width="' + (boxL * sc).toFixed(1) + '" height="' + (boxH * sc).toFixed(1) + '" fill="' + (filled ? '#E0B25B' : '#eef2f7') + '" stroke="#fff" stroke-width=".6"/>'; }
    var sideSvg = '<svg viewBox="0 0 ' + W + ' ' + h2.toFixed(1) + '" role="img" aria-label="Side view of the container" style="width:100%;background:#fff;border:2px solid #142D4C;border-radius:4px;margin-top:10px">' + side + '</svg>';
    v.appendChild(el('p', 'srcnote', 'Top view (floor) and side view (length by height). Basic illustration of the best grid layout.')); v.insertAdjacentHTML('beforeend', top + sideSvg);
  }
  function show() {
    var r = calc(), out = $('cpOut'), err = $('cpErr'); out.innerHTML = ''; $('cpViz').innerHTML = ''; last = r;
    if (!r) { err.style.display = ''; err.textContent = 'Enter the package dimensions and container details to see the estimate.'; out.appendChild(el('span', 'hint', 'Waiting for inputs.')); return; } err.style.display = 'none';
    out.appendChild(el('span', 'big', f(r.fit) + ' packages per container'));
    [['Limited by', r.limit], ['By space (grid)', f(r.bySpace)], ['By payload', r.byW === Infinity ? 'n/a' : f(r.byW)], ['Packages in this load', f(r.loaded)], ['Estimated space utilisation', f(r.util * 100, 1) + '%'], ['Estimated unused space', f(r.unused * 100, 1) + '%'], ['Estimated cargo weight', f(r.weight) + ' kg'], ['Container payload limit', r.b.c.P ? f(r.b.c.P) + ' kg' : 'not entered']].forEach(function (x) { var row = el('div', 'row'); row.appendChild(el('span', '', x[0])); row.appendChild(el('b', '', x[1])); out.appendChild(row); });
    if (r.containers) { var row = el('div', 'row'); row.appendChild(el('span', '', 'Containers needed for ' + f(r.b.p.n) + ' packages')); row.appendChild(el('b', '', f(r.containers))); out.appendChild(row); }
    out.appendChild(el('span', 'hint', 'Layout: ' + r.best.nl + ' along the length x ' + r.best.nw + ' across x ' + r.best.nh + ' high. ' + (r.b.c.typical ? 'Container values are typical, not verified for your carrier.' : 'Container values were entered by you.')));
    if (!r.best.door) out.appendChild(el('span', 'hint', 'Warning: this package may not pass through the container door in this orientation.'));
    viz(r);
  }
  IDS.forEach(function (i) { $(i).addEventListener('input', show); $(i).addEventListener('change', function () { if (i === 'cpType') $('cpCustom').hidden = $('cpType').value !== 'custom'; show(); }); });
  $('cpPrint').onclick = function () { window.print(); };
  $('cpPdf').onclick = function () {
    show(); var r = last; if (!r) { $('cpMsg').textContent = 'Enter the inputs first.'; return; }
    try {
      var d = PW.pdf.start('Container Loading Estimate'), y = 38, c = PW.pdf.clean, b = r.b; d.setTextColor(20, 45, 76); d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text(c(f(r.fit) + ' packages per container (' + b.c.name + ')'), 14, y); y += 9; d.setFontSize(10);
      var rows = [['Package (L x W x H)', f(b.p.l * 100, 1) + ' x ' + f(b.p.w * 100, 1) + ' x ' + f(b.p.h * 100, 1) + ' cm'], ['Package weight', f(b.p.kg, 2) + ' kg'], ['Packages entered', b.p.n ? f(b.p.n) : 'not entered'], ['Limited by', r.limit], ['Packages by space', f(r.bySpace)], ['Packages by payload', r.byW === Infinity ? 'n/a' : f(r.byW)], ['Packages in this load', f(r.loaded)], ['Space utilisation', f(r.util * 100, 1) + '%'], ['Unused space', f(r.unused * 100, 1) + '%'], ['Cargo weight', f(r.weight) + ' kg'], ['Layout (length x width x height)', r.best.nl + ' x ' + r.best.nw + ' x ' + r.best.nh], ['Containers needed', r.containers ? f(r.containers) : 'n/a']];
      rows.forEach(function (x, i) { if (i % 2 === 0) { d.setFillColor(238, 242, 247); d.rect(14, y - 4.6, 182, 7.4, 'F'); } d.setFont('helvetica', 'normal'); d.setTextColor(40, 50, 60); d.text(c(x[0]), 17, y); d.setFont('helvetica', 'bold'); d.text(c(x[1]), 193, y, { align: 'right' }); y += 7.4; });
      y += 6; d.setFont('helvetica', 'bold'); d.setTextColor(20, 45, 76); d.text('Assumptions', 14, y); y += 6; d.setFont('helvetica', 'normal'); d.setFontSize(9); d.setTextColor(60, 70, 80);
      d.text(d.splitTextToSize(c('Container: ' + b.c.name + ' (internal ' + f(b.c.L, 2) + ' x ' + f(b.c.W, 2) + ' x ' + f(b.c.H, 2) + ' m, payload ' + f(b.c.P) + ' kg). ' + (b.c.typical ? 'Typical values; confirm with your carrier. ' : 'Values entered by the user. ') + 'Identical boxes in a single straight grid, no pallets or dunnage. ' + (b.up ? 'Packages kept upright. ' : 'Packages may be rotated. ') + 'Door clearance is checked simply. Stacking strength, weight distribution and carrier rules are not assessed.'), 182), 14, y);
      PW.pdf.footer(d, 'Indicative planning estimate. Not a certified cargo-loading plan and not a guarantee that a load is safe or feasible.'); d.save('Portwise-container-estimate.pdf'); $('cpMsg').textContent = 'PDF downloaded.';
    } catch (e) { $('cpMsg').textContent = 'The PDF could not be created. Please try again.'; }
  };
  show();
})();
