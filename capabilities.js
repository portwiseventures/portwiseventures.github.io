/* Factory capability profiles. Add verified entries to capabilities.json:
   {"id":"cap-1","categories":["Jute bags"],"capabilities":["Cutting and stitching"],"materials":["Jute"],"customisation":["Private label"],"capacity":"verified text","exportExperience":"verified text","region":"Dhaka region","verified":true} */
(function () {
  'use strict';
  var list = document.getElementById('capList'), empty = document.getElementById('capEmpty'); if (!list) return;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function line(card, label, v) { if (!v || (Array.isArray(v) && !v.length)) return; var p = el('p', 'sm'); p.appendChild(el('b', '', label + ': ')); p.appendChild(document.createTextNode(Array.isArray(v) ? v.join(', ') : v)); card.appendChild(p); }
  fetch('capabilities.json').then(function (r) { return r.json(); }).then(function (d) {
    d = d.filter(function (x) { return x.verified === true; }); if (!d.length) return; empty.style.display = 'none';
    d.forEach(function (x) { var c = el('div', 'card'); c.appendChild(el('span', 'badge live', 'Verified')); c.appendChild(el('h3', '', (x.categories || []).join(', ') || 'Supplier profile'));
      line(c, 'Manufacturing capabilities', x.capabilities); line(c, 'Materials', x.materials); line(c, 'Customisation', x.customisation); line(c, 'Production capacity', x.capacity); line(c, 'Export experience', x.exportExperience); line(c, 'Region', x.region);
      var a = el('a', 'btn', 'Ask about this capability'); a.href = 'requirement-builder.html'; c.appendChild(a); list.appendChild(c); });
  }).catch(function () {});
})();
