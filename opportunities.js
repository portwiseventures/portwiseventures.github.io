/* Featured products for Business Opportunities. Mark products with "featured": true in products.json. */
(function () {
  'use strict';
  var grid = document.getElementById('featgrid'); if (!grid) return;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  fetch('products.json').then(function (r) { return r.json(); }).then(function (all) {
    var f = all.filter(function (p) { return p.featured; }); if (!f.length) f = all.slice(0, 8);
    f.forEach(function (p) {
      var href = 'product.html?p=' + encodeURIComponent(p.id), c = el('div', 'pc'), a = el('a', 'pi'); a.href = href;
      var im = el('img'); im.src = p.images[0]; im.alt = p.name + ' (' + p.brand + ')'; im.loading = 'lazy'; a.appendChild(im); c.appendChild(a);
      var b = el('div', 'pb'); b.appendChild(el('span', 'bt', p.brand + ' · ' + p.category));
      var h = el('h3'); var l = el('a', '', p.name); l.href = href; h.appendChild(l); b.appendChild(h);
      var r = el('div', 'pr'); var d = el('a', 'btn2', 'View details'); d.href = href; r.appendChild(d);
      var q = el('a', 'btn', 'Request quotation'); q.href = href + '#rfq'; r.appendChild(q); b.appendChild(r); c.appendChild(b); grid.appendChild(c);
    });
  }).catch(function () { grid.appendChild(el('p', '', 'Products could not be loaded. Please visit the Product Discovery Centre.')); });
})();
