/* Product Discovery Centre extras: brand counts, category shortcuts and product comparison. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  fetch('products.json').then(function (r) { return r.json(); }).then(function (P) {
    ['EVARA', 'AGRINEST', 'PRIME CREST', 'LOGICWISE'].forEach(function (b) {
      var n = P.filter(function (p) { return p.brand === b; }).length, s = document.querySelector('[data-count="' + b + '"]');
      if (s) s.textContent = n ? n + ' products' : 'Coming soon';
    });
    var cc = $('catchips'), seen = {};
    if (cc) P.forEach(function (p) {
      var k = p.brand + '|' + p.category; if (seen[k]) return; seen[k] = 1;
      var n = P.filter(function (x) { return x.brand === p.brand && x.category === p.category; }).length;
      var b = el('button', '', p.category + ' (' + n + ')'); b.type = 'button'; b.title = p.brand;
      b.onclick = function () { location.href = 'marketplace.html?brand=' + encodeURIComponent(p.brand.replace(' ', '-')) + '&cat=' + encodeURIComponent(p.category); };
      cc.appendChild(b);
    });
    var A = $('cmpA'), B = $('cmpB'); if (!A || !B) return;
    [A, B].forEach(function (sel, i) {
      var o = el('option', '', 'Choose product ' + (i + 1)); o.value = ''; sel.appendChild(o);
      ['EVARA', 'AGRINEST'].forEach(function (br) {
        var g = document.createElement('optgroup'); g.label = br;
        P.filter(function (p) { return p.brand === br; }).forEach(function (p) { var x = el('option', '', p.name); x.value = p.id; g.appendChild(x); });
        sel.appendChild(g);
      });
    });
    function rows(p) {
      var o = {}; o['Brand'] = p.brand; o['Category'] = p.category;
      p.specs.forEach(function (s) { o[s[0]] = s[1]; });
      o['Country of origin'] = p.origin; if (p.variants) o['Variants'] = p.variants;
      o['Packaging'] = p.packaging; o['Minimum order quantity'] = p.moq; o['Availability'] = p.availability; return o;
    }
    $('cmpBtn').onclick = function () {
      var a = P.filter(function (p) { return p.id === A.value; })[0], b = P.filter(function (p) { return p.id === B.value; })[0], out = $('cmpOut');
      out.innerHTML = '';
      if (!a || !b) { out.appendChild(el('p', 'sm', 'Please choose two products to compare.')); return; }
      var ra = rows(a), rb = rows(b), keys = Object.keys(ra); Object.keys(rb).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
      var t = el('table', 'cmp'), h = el('tr'); h.appendChild(el('th', '', ''));
      [a, b].forEach(function (p) { var th = el('th'); var l = el('a', '', p.name); l.href = 'product.html?p=' + encodeURIComponent(p.id); th.appendChild(l); h.appendChild(th); });
      t.appendChild(h);
      keys.forEach(function (k) { var tr = el('tr'); tr.appendChild(el('th', '', k)); tr.appendChild(el('td', '', ra[k] || '–')); tr.appendChild(el('td', '', rb[k] || '–')); t.appendChild(tr); });
      out.appendChild(t);
    };
  }).catch(function () {});
})();
