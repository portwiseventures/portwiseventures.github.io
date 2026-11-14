/* Portwise Ventures - catalogue.js
   Builds the product list on catalogue.html from products.json (if present).
   products.json format: [{"name":"...","brand":"Evara","category":"...","description":"...","image":"photo.jpg"}]
   With no products.json, the page shows its "New products are being added" message. */
(function () {
  'use strict';
  var list = document.getElementById('list'), flt = document.getElementById('flt'), empty = document.getElementById('empty');
  if (!list) return;
  var colors = { evara: '', agrinest: 'g', primecrest: 'p', logicwise: 't' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function render(items, brand) {
    list.innerHTML = '';
    var shown = 0;
    items.forEach(function (p) {
      if (brand && brand !== 'All' && p.brand !== brand) return;
      var c = el('div', 'card ' + (colors[String(p.brand || '').toLowerCase()] || ''));
      if (p.image) { var im = el('img'); im.src = p.image; im.alt = p.name || ''; im.style.cssText = 'width:100%;border-radius:8px;margin-bottom:10px'; c.appendChild(im); }
      c.appendChild(el('h3', '', p.name || ''));
      if (p.brand || p.category) c.appendChild(el('p', '', [p.brand, p.category].filter(Boolean).join(' · ')));
      if (p.description) c.appendChild(el('p', '', p.description));
      var a = el('a', 'btn', 'Request a quote'); a.href = 'quote.html'; c.appendChild(a);
      list.appendChild(c); shown++;
    });
    if (empty) empty.style.display = shown ? 'none' : '';
  }

  function build(items) {
    if (!items.length) { if (empty) empty.style.display = ''; return; }
    var brands = ['All'];
    items.forEach(function (p) { if (p.brand && brands.indexOf(p.brand) < 0) brands.push(p.brand); });
    if (flt && brands.length > 2) {
      brands.forEach(function (b, i) {
        var btn = el('button', i === 0 ? 'on' : '', b);
        btn.type = 'button';
        btn.onclick = function () {
          var all = flt.querySelectorAll('button');
          for (var k = 0; k < all.length; k++) all[k].className = '';
          btn.className = 'on'; render(items, b);
        };
        flt.appendChild(btn);
      });
    }
    render(items, 'All');
  }

  if (!window.fetch) { if (empty) empty.style.display = ''; return; }
  fetch('products.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .catch(function () { return []; })
    .then(function (d) { build(Array.isArray(d) ? d : (d && d.products) || []); });
})();
