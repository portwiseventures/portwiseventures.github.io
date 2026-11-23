/* Portwise Approved Supplier Products (public, read-only).
   Reads ONLY the limited view v_public_catalogue: staff-approved name/summary/category/origin/grade/packaging/image.
   No supplier identity, contact or price is ever exposed. All text is inserted with textContent. */
(function () {
  'use strict';
  var C = window.PW || {}, PAGE = 12, all = [], shown = PAGE;
  function $(id) { return document.getElementById(id); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function img(p) { return p && /^[A-Za-z0-9_\-./]+$/.test(p) && p.indexOf('..') < 0 ? C.supabaseUrl + '/storage/v1/object/public/portwise-public-assets/' + p.split('/').map(encodeURIComponent).join('/') : ''; }
  var grid = $('spGrid'); if (!grid) return;
  function card(o) {
    var a = el('article', 'oc'), t = el('div', 'oi'), u = img(o.catalogue_image_path);
    if (u) { var i = el('img'); i.src = u; i.alt = o.catalogue_name; i.loading = 'lazy'; i.onerror = function () { i.remove(); t.textContent = o.catalogue_name.charAt(0).toUpperCase(); }; t.appendChild(i); } else t.textContent = o.catalogue_name.charAt(0).toUpperCase();
    a.appendChild(t); var b = el('div', 'ob'); b.appendChild(el('h3', '', o.catalogue_name)); if (o.product_category) b.appendChild(el('div', 'oid', o.product_category)); b.appendChild(el('p', '', o.catalogue_summary));
    var dl = el('dl'); [['Origin', o.product_origin], ['Grade', o.product_grade], ['Packaging', o.packaging]].forEach(function (r) { if (r[1]) { dl.appendChild(el('dt', '', r[0])); dl.appendChild(el('dd', '', r[1])); } }); b.appendChild(dl);
    var act = el('div', 'oa'), r = el('a', 'btn', 'Request this product'); r.href = 'request-a-product.html?product=' + encodeURIComponent(o.catalogue_name.slice(0, 120)); act.appendChild(r); b.appendChild(act); a.appendChild(b); return a;
  }
  function empty(msg) { grid.innerHTML = ''; var e = el('div', 'opempty'); e.appendChild(el('h3', '', msg)); e.appendChild(el('p', '', 'Products submitted by suppliers appear here only after Portwise review and approval.'));
    [['request-a-product.html', 'Request a Product'], ['submit-a-product.html', 'Submit a Product']].forEach(function (l) { var a = el('a', 'btn', l[1]); a.href = l[0]; e.appendChild(a); }); grid.appendChild(e); }
  function apply(reset) {
    if (reset) shown = PAGE; var q = $('spSearch').value.trim().toLowerCase(), c = $('spCat').value;
    var rows = all.filter(function (o) { return (!c || o.product_category === c) && (!q || [o.catalogue_name, o.catalogue_summary, o.product_category, o.product_origin].join(' ').toLowerCase().indexOf(q) > -1); });
    grid.innerHTML = ''; if (!all.length) { empty('No approved supplier products are listed yet.'); $('spMore').hidden = true; $('spCount').textContent = ''; return; }
    if (!rows.length) { grid.appendChild(el('p', 'opmeta', 'No products match your search.')); $('spMore').hidden = true; $('spCount').textContent = ''; return; }
    rows.slice(0, shown).forEach(function (o) { grid.appendChild(card(o)); }); $('spCount').textContent = 'Showing ' + Math.min(shown, rows.length) + ' of ' + rows.length + ' products'; $('spMore').hidden = rows.length <= shown;
  }
  fetch(C.supabaseUrl + '/rest/v1/v_public_catalogue?select=*&order=catalogue_published_at.desc&limit=300', { headers: { apikey: C.anonKey || '', Accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) { all = d; d.map(function (o) { return o.product_category; }).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort().forEach(function (v) { var o = el('option', '', v); o.value = v; $('spCat').appendChild(o); }); apply(true); })
    .catch(function () { grid.innerHTML = ''; grid.appendChild(el('p', 'opempty', 'We could not load the products right now. Please try again shortly.')); });
  $('spSearch').addEventListener('input', function () { apply(true); }); $('spCat').addEventListener('change', function () { apply(true); }); $('spMore').onclick = function () { shown += PAGE; apply(false); };
  $('spReset').onclick = function () { $('spSearch').value = ''; $('spCat').value = ''; apply(true); };
})();
