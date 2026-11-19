/* Trade Agreement Explorer. Data: agreements.json. Add only entries verified against official sources. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, all = [];
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function fill(sel, vals, label) { sel.innerHTML = ''; var o = el('option', '', label); o.value = ''; sel.appendChild(o); vals.forEach(function (v) { var x = el('option', '', v); x.value = v; sel.appendChild(x); }); }
  function kind(s) { return /^In force/.test(s) ? 'live' : /not in force|concluded|Negotiat/i.test(s) ? 'est' : 'cat'; }
  function draw() {
    var q = $('taQ').value.toLowerCase(), c = $('taCountry').value, s = $('taStatus').value, list = $('taList'); list.innerHTML = '';
    var r = all.filter(function (a) { return (!c || a.parties.indexOf(c) > -1) && (!s || a.status === s) && (!q || (a.name + ' ' + a.summary + ' ' + a.parties.join(' ')).toLowerCase().indexOf(q) > -1); });
    $('taCount').textContent = r.length + (r.length === 1 ? ' entry' : ' entries');
    r.forEach(function (a) {
      var card = el('div', 'card'); card.appendChild(el('span', 'badge ' + kind(a.status), a.status)); card.appendChild(el('p', 'bt', a.type)); card.appendChild(el('h3', '', a.name));
      card.appendChild(el('p', '', a.statusNote)); card.appendChild(el('p', '', a.summary));
      [['Participating countries', a.parties.join(', ')], ['Products or sectors', a.sectors], ['Rules of origin', a.rules]].forEach(function (x) { var p = el('p', 'sm'); p.appendChild(el('b', '', x[0] + ': ')); p.appendChild(document.createTextNode(x[1])); card.appendChild(p); });
      var row = el('div', 'pr'); a.links.forEach(function (l) { var k = el('a', 'btn2', l[0]); k.href = l[1]; k.target = '_blank'; k.rel = 'noopener'; row.appendChild(k); }); card.appendChild(row);
      card.appendChild(el('p', 'srcnote', a.verified ? 'Last verified by Portwise: ' + a.verified + '. Always confirm on the official source.' : 'Official reference. Confirm details on the source.')); list.appendChild(card);
    });
    if (!r.length) list.appendChild(el('p', '', 'No entries match your search.'));
  }
  fetch('agreements.json').then(function (x) { return x.json(); }).then(function (d) {
    all = d; var cs = [], ss = []; d.forEach(function (a) { a.parties.forEach(function (p) { if (cs.indexOf(p) < 0) cs.push(p); }); if (ss.indexOf(a.status) < 0) ss.push(a.status); });
    fill($('taCountry'), cs.sort(), 'All countries'); fill($('taStatus'), ss, 'Any status'); ['taQ', 'taCountry', 'taStatus'].forEach(function (i) { $(i).addEventListener('input', draw); $(i).addEventListener('change', draw); }); draw();
  }).catch(function () { $('taList').textContent = 'The agreements could not be loaded. Please refresh the page.'; });
})();
