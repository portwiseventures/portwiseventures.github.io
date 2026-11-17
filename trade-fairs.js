/* Trade Fair Calendar. Add verified events to trade-fairs.json:
   {"name","industry","country","city","start":"YYYY-MM-DD","end":"YYYY-MM-DD","website":"https://official-site","description","verified":true}
   Only entries with "verified": true are shown. */
(function () {
  'use strict';
  var list = document.getElementById('tfList'); if (!list) return;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var all = [], $ = function (id) { return document.getElementById(id); };
  function fmt(d) { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function fill(sel, vals, label) { sel.innerHTML = ''; var o = el('option', '', label); o.value = ''; sel.appendChild(o); vals.forEach(function (v) { var x = el('option', '', v); x.value = v; sel.appendChild(x); }); }
  function draw() {
    var today = new Date().toISOString().slice(0, 10), past = $('tfPast').checked; list.innerHTML = '';
    var s = all.filter(function (e) { return (!$('tfInd').value || e.industry === $('tfInd').value) && (!$('tfCountry').value || e.country === $('tfCountry').value) && (past || e.end >= today); }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    $('tfCount').textContent = all.length ? s.length + (s.length === 1 ? ' event' : ' events') : '';
    s.forEach(function (e) {
      var c = el('div', 'card'); c.appendChild(el('p', 'bt', e.industry)); c.appendChild(el('h3', '', e.name)); c.appendChild(el('p', 'sm', fmt(e.start) + (e.end && e.end !== e.start ? ' to ' + fmt(e.end) : '') + ' · ' + e.city + ', ' + e.country));
      c.appendChild(el('p', '', e.description || '')); if (/^https?:\/\//.test(e.website || '')) { var a = el('a', 'btn', 'Official website'); a.href = e.website; a.rel = 'noopener'; a.target = '_blank'; c.appendChild(a); } list.appendChild(c);
    });
  }
  fetch('trade-fairs.json').then(function (r) { return r.json(); }).then(function (d) {
    all = d.filter(function (e) { return e.verified === true; }); if (!all.length) { fill($('tfInd'), [], 'All industries'); fill($('tfCountry'), [], 'All countries'); return; }
    $('tfEmpty').style.display = 'none'; var u = function (k) { var o = []; all.forEach(function (e) { if (o.indexOf(e[k]) < 0) o.push(e[k]); }); return o.sort(); };
    fill($('tfInd'), u('industry'), 'All industries'); fill($('tfCountry'), u('country'), 'All countries');
    ['tfInd', 'tfCountry', 'tfPast'].forEach(function (id) { $(id).onchange = draw; }); draw();
  }).catch(function () {});
})();
