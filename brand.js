/* Brand page interactives: collections/season grids, gallery, sizing table, availability updates, LOGICWISE data. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var grid = $('bGrid'), gal = $('bGallery'), size = $('sizeTable'), avail = $('availList'), lwS = $('lwServices'), sel = $('aProduct');
  if (grid || gal || size || sel) fetch('products.json').then(function (r) { return r.json(); }).then(function (all) {
    if (grid) {
      var brand = grid.getAttribute('data-brand'), P = all.filter(function (p) { return p.brand === brand; }), cat = '', shown = 24, more = $('bMore'), fl = $('bFilters');
      var cats = []; P.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
      function draw() {
        grid.innerHTML = ''; var list = P.filter(function (p) { return !cat || p.category === cat; });
        list.slice(0, shown).forEach(function (p) {
          var href = 'product.html?p=' + encodeURIComponent(p.id), c = el('div', 'pc'), a = el('a', 'pi'); a.href = href; var im = el('img'); im.src = p.images[0]; im.alt = p.name + ' (' + p.brand + ')'; im.loading = 'lazy'; a.appendChild(im); c.appendChild(a);
          var b = el('div', 'pb'); b.appendChild(el('span', 'bt', p.category)); var h = el('h3'), l = el('a', '', p.name); l.href = href; h.appendChild(l); b.appendChild(h);
          var sz = p.specs.filter(function (s) { return s[0] === 'Size'; })[0], rg = p.specs.filter(function (s) { return s[0] === 'Growing regions'; })[0];
          b.appendChild(el('p', 'sm', sz ? 'Size: ' + sz[1] + (rg ? ' · ' + rg[1] : '') : p.description));
          var r = el('div', 'pr'), d = el('a', 'btn2', 'Details'); d.href = href; r.appendChild(d); var q = el('a', 'btn', 'Request quotation'); q.href = href + '#rfq'; r.appendChild(q);
          var sb = el('button', 'btn2 slbtn', ''); sb.type = 'button'; (function (sb, p) { function paint() { var h2 = window.PW && PW.sl && PW.sl.has(p.id); sb.textContent = h2 ? '\u2605 Shortlisted' : '\u2606 Shortlist'; sb.setAttribute('aria-pressed', h2 ? 'true' : 'false'); } sb.onclick = function () { if (window.PW && PW.sl) { PW.sl.toggle(p.id); paint(); } }; paint(); })(sb, p); r.appendChild(sb);
          b.appendChild(r); c.appendChild(b); grid.appendChild(c);
        });
        if (more) more.style.display = list.length > shown ? '' : 'none';
      }
      function tabs() { fl.innerHTML = ''; ['All'].concat(cats).forEach(function (c) { var b = el('button', (c === 'All' && !cat) || c === cat ? 'on' : '', c); b.type = 'button'; b.onclick = function () { cat = c === 'All' ? '' : c; shown = 24; tabs(); draw(); }; fl.appendChild(b); }); }
      if (more) more.onclick = function () { shown += 24; draw(); };
      tabs(); draw();
    }
    if (gal) gal.getAttribute('data-ids').split(',').forEach(function (id) {
      var p = all.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      var f = el('a', 'gi'); f.href = 'product.html?p=' + encodeURIComponent(p.id); var im = el('img'); im.src = p.images[0]; im.alt = p.name; im.loading = 'lazy'; f.appendChild(im); var cap = el('span', '', p.name + ': ' + p.description); f.appendChild(cap); gal.appendChild(f);
    });
    if (size) {
      var A = all.filter(function (p) { return p.brand === 'AGRINEST'; }), sc = $('sizeCat'), q = $('sizeQ'), cs = [];
      A.forEach(function (p) { if (cs.indexOf(p.category) < 0) cs.push(p.category); }); var o = el('option', '', 'All categories'); o.value = ''; sc.appendChild(o); cs.forEach(function (c) { var x = el('option', '', c); x.value = c; sc.appendChild(x); });
      function t() {
        size.innerHTML = ''; var h = el('tr'); ['Product', 'Size', 'Growing regions'].forEach(function (x) { h.appendChild(el('th', '', x)); }); size.appendChild(h);
        A.filter(function (p) { return (!sc.value || p.category === sc.value) && (!q.value || p.name.toLowerCase().indexOf(q.value.toLowerCase()) > -1); }).forEach(function (p) {
          var g = function (k) { var f = p.specs.filter(function (s) { return s[0] === k; })[0]; return f ? f[1] : '-'; }, tr = el('tr'), td = el('td'), a = el('a', '', p.name); a.href = 'product.html?p=' + encodeURIComponent(p.id); td.appendChild(a); tr.appendChild(td); tr.appendChild(el('td', '', g('Size'))); tr.appendChild(el('td', '', g('Growing regions'))); size.appendChild(tr);
        });
      }
      sc.onchange = t; q.oninput = t; t();
    }
    if (sel) all.filter(function (p) { return p.brand === 'AGRINEST'; }).forEach(function (p) { var o = el('option', '', p.name); o.value = p.name; sel.appendChild(o); });
  }).catch(function () {});
  if (avail) fetch('availability.json').then(function (r) { return r.json(); }).then(function (d) {
    d.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    d.forEach(function (u) { var c = el('div', 'card'); c.appendChild(el('p', 'bt', new Date(u.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))); c.appendChild(el('p', '', u.text)); avail.appendChild(c); });
  }).catch(function () { avail.appendChild(el('p', 'sm', 'No updates available right now.')); });
  if (lwS) fetch('logicwise.json').then(function (r) { return r.json(); }).then(function (d) {
    var S = d.services || [], cs = d.caseStudies || [];
    if (S.length) {
      $('lwEmpty').style.display = 'none'; var cats = [], cur = ''; S.forEach(function (s) { if (s.category && cats.indexOf(s.category) < 0) cats.push(s.category); });
      function draw() { lwS.querySelectorAll('.card.svc').forEach(function (n) { n.remove(); }); S.filter(function (s) { return !cur || s.category === cur; }).forEach(function (s) { var c = el('div', 'card svc'); c.appendChild(el('h3', '', s.name)); c.appendChild(el('p', '', s.description || '')); lwS.appendChild(c); }); }
      var fl = $('lwFilters'); ['All'].concat(cats).forEach(function (c) { var b = el('button', c === 'All' ? 'on' : '', c); b.type = 'button'; b.onclick = function () { cur = c === 'All' ? '' : c; [].slice.call(fl.children).forEach(function (x) { x.className = ''; }); b.className = 'on'; draw(); }; fl.appendChild(b); }); draw();
      if (S.length > 1) { var box = $('lwCmp'); box.innerHTML = ''; var t = el('table', 'cmp'), h = el('tr'); h.appendChild(el('th')); S.forEach(function (s) { h.appendChild(el('th', '', s.name)); }); t.appendChild(h); [['Category', 'category'], ['Description', 'description'], ['Typical deliverables', 'deliverables'], ['Timeline', 'timeline']].forEach(function (r) { var tr = el('tr'); tr.appendChild(el('th', '', r[0])); S.forEach(function (s) { tr.appendChild(el('td', '', s[r[1]] || 'To be confirmed')); }); t.appendChild(tr); }); box.appendChild(t); }
    }
    if (cs.length) { var cb = $('lwCases'); cb.innerHTML = ''; cs.filter(function (c) { return c.verified === true; }).forEach(function (c) { var d2 = el('div', 'card'); d2.appendChild(el('h3', '', c.title)); d2.appendChild(el('p', '', c.summary || '')); cb.appendChild(d2); }); }
  }).catch(function () {});
})();
