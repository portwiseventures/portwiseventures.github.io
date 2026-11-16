/* Shortlist page: list, compare, spec sheets and multi-product enquiry. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, ALL = [];
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function items() { return PW.sl.get().map(function (id) { return ALL.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean); }
  function rowsOf(p) { var o = {}; o['Brand'] = p.brand; o['Category'] = p.category; p.specs.forEach(function (s) { o[s[0]] = s[1]; }); o['Country of origin'] = p.origin; if (p.variants) o['Variants'] = p.variants; o['Packaging'] = p.packaging; o['Minimum order quantity'] = p.moq; o['Availability'] = p.availability; return o; }
  function compare(list) {
    var out = $('slCompare'); out.innerHTML = ''; if (list.length < 2) { out.appendChild(el('p', 'sm', 'Add at least two products to compare them.')); return; }
    var rs = list.map(rowsOf), keys = []; rs.forEach(function (r) { Object.keys(r).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    var t = el('table', 'cmp'), h = el('tr'); h.appendChild(el('th'));
    list.forEach(function (p) { var th = el('th'), a = el('a', '', p.name); a.href = 'product.html?p=' + encodeURIComponent(p.id); th.appendChild(a); h.appendChild(th); }); t.appendChild(h);
    keys.forEach(function (k) { var tr = el('tr'); tr.appendChild(el('th', '', k)); rs.forEach(function (r) { tr.appendChild(el('td', '', r[k] || '-')); }); t.appendChild(tr); });
    out.appendChild(t);
  }
  function draw() {
    var list = items(), g = $('slGrid'); g.innerHTML = ''; $('slQty').innerHTML = '';
    $('slEmpty').style.display = list.length ? 'none' : ''; $('slMain').style.display = list.length ? '' : 'none'; $('slCompare').innerHTML = '';
    list.forEach(function (p, i) {
      var href = 'product.html?p=' + encodeURIComponent(p.id), c = el('div', 'pc'), a = el('a', 'pi'); a.href = href;
      var im = el('img'); im.src = p.images[0]; im.alt = p.name + ' (' + p.brand + ')'; a.appendChild(im); c.appendChild(a);
      var b = el('div', 'pb'); b.appendChild(el('span', 'bt', p.brand + ' · ' + p.category)); var h = el('h3'), l = el('a', '', p.name); l.href = href; h.appendChild(l); b.appendChild(h);
      var sz = p.specs.filter(function (s) { return s[0] === 'Size'; })[0]; b.appendChild(el('p', 'sm', sz ? 'Size: ' + sz[1] : p.description));
      var r = el('div', 'pr'), rm = el('button', 'btn2', 'Remove'); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove ' + p.name + ' from shortlist'); rm.onclick = function () { PW.sl.remove(p.id); }; r.appendChild(rm); b.appendChild(r); c.appendChild(b); g.appendChild(c);
      var lab = el('label'); lab.appendChild(document.createTextNode(p.name + ' (' + p.brand + ')')); var q = el('input'); q.name = 'qty_' + (i + 1); q.placeholder = 'e.g. 500 pcs or 2 tons'; q.setAttribute('data-pid', p.id); lab.appendChild(q); $('slQty').appendChild(lab);
    });
  }
  $('slClear').onclick = function () { if (confirm('Remove all products from your shortlist?')) PW.sl.clear(); };
  $('slCmpBtn').onclick = function () { compare(items()); $('slCompare').scrollIntoView({ behavior: 'smooth' }); };
  $('slSpec').onclick = function () { var b = this, t = b.textContent, l = items(); if (!l.length) return; b.disabled = true; b.textContent = 'Preparing PDF...'; PW.spec.download(l).then(function () { b.textContent = t; b.disabled = false; }).catch(function () { b.textContent = t; b.disabled = false; alert('The PDF could not be created. Please try again or contact us.'); }); };
  $('slForm').addEventListener('submit', function (e) {
    var l = items(), err = $('slErr'); if (!l.length) { e.preventDefault(); err.style.display = ''; err.textContent = 'Please add at least one product to your shortlist first.'; return; }
    var qs = $('slQty').querySelectorAll('input'), lines = l.map(function (p, i) { var q = qs[i] ? qs[i].value.trim() : ''; return (i + 1) + '. ' + p.name + ' (' + p.brand + ', ' + p.category + ') - Quantity: ' + (q || 'to be confirmed') + ' - ' + location.origin + '/product.html?p=' + p.id; });
    $('slProducts').value = lines.join('\n'); $('slCount').value = l.length; err.style.display = 'none';
  });
  fetch('products.json').then(function (r) { return r.json(); }).then(function (d) { ALL = d; draw(); PW.sl.on(draw); }).catch(function () { $('slEmpty').style.display = ''; $('slEmpty').textContent = 'Products could not be loaded. Please refresh the page.'; });
})();
