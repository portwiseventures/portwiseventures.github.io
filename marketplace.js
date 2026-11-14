/* Portwise Ventures marketplace. Data source: products.json (add a product there and it appears automatically). */
(function () {
  'use strict';
  var BRANDS = ['EVARA', 'AGRINEST', 'PRIME CREST', 'LOGICWISE'];
  var P = [], S = { q: '', brand: '', cat: '', origin: '', avail: '', shown: 24 };
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function uniq(a) { var o = [], i; for (i = 0; i < a.length; i++) if (a[i] && o.indexOf(a[i]) < 0) o.push(a[i]); return o; }
  function fill(sel, vals, label) {
    var cur = sel.value; sel.innerHTML = '';
    var o = el('option', '', label); o.value = ''; sel.appendChild(o);
    vals.forEach(function (v) { var x = el('option', '', v); x.value = v; sel.appendChild(x); });
    if (vals.indexOf(cur) > -1) sel.value = cur;
  }
  function match(p) {
    if (S.brand && p.brand !== S.brand) return false;
    if (S.cat && p.category !== S.cat) return false;
    if (S.origin && p.origin !== S.origin) return false;
    if (S.avail && p.availability !== S.avail) return false;
    if (S.q) {
      var hay = (p.name + ' ' + p.brand + ' ' + p.category + ' ' + p.description + ' ' + (p.sku || '') + ' ' + p.specs.map(function (s) { return s[1]; }).join(' ')).toLowerCase();
      var w = S.q.toLowerCase().split(/\s+/), i;
      for (i = 0; i < w.length; i++) if (w[i] && hay.indexOf(w[i]) < 0) return false;
    }
    return true;
  }
  function tabs() {
    var box = $('tabs'); box.innerHTML = '';
    function add(label, val, n) {
      var b = el('button', S.brand === val ? 'on' : '', label + (n != null ? ' (' + n + ')' : ''));
      b.type = 'button';
      b.onclick = function () { S.brand = val; S.cat = ''; S.shown = 24; refresh(); };
      box.appendChild(b);
    }
    add('All brands', '', P.length);
    BRANDS.forEach(function (b) { add(b, b, P.filter(function (p) { return p.brand === b; }).length); });
  }
  function selects() {
    var base = P.filter(function (p) { return !S.brand || p.brand === S.brand; });
    fill($('fcat'), uniq(base.map(function (p) { return p.category; })), 'All categories');
    fill($('forigin'), uniq(P.map(function (p) { return p.origin; })), 'All countries');
    fill($('favail'), uniq(P.map(function (p) { return p.availability; })), 'Any availability');
    $('fcat').value = S.cat; $('forigin').value = S.origin; $('favail').value = S.avail;
  }
  function card(p) {
    var c = el('div', 'pc');
    var a = el('a', 'pi'); a.href = 'product.html?p=' + encodeURIComponent(p.id);
    var im = el('img'); im.src = p.images[0]; im.alt = p.name + ' (' + p.brand + ')'; im.loading = 'lazy'; a.appendChild(im); c.appendChild(a);
    var b = el('div', 'pb');
    b.appendChild(el('span', 'bt', p.brand + ' · ' + p.category));
    var h = el('h3'); var l = el('a', '', p.name); l.href = a.href; h.appendChild(l); b.appendChild(h);
    var sz = p.specs.filter(function (s) { return s[0] === 'Size'; })[0];
    if (sz) b.appendChild(el('p', 'sm', 'Size: ' + sz[1]));
    else b.appendChild(el('p', 'sm', p.description));
    var r = el('div', 'pr');
    var d = el('a', 'btn2', 'View details'); d.href = a.href; r.appendChild(d);
    var q = el('a', 'btn', 'Request quotation'); q.href = a.href + '#rfq'; r.appendChild(q);
    b.appendChild(r); c.appendChild(b); return c;
  }
  function render() {
    var list = P.filter(match), g = $('grid'); g.innerHTML = '';
    list.slice(0, S.shown).forEach(function (p) { g.appendChild(card(p)); });
    $('count').textContent = list.length + (list.length === 1 ? ' product' : ' products');
    $('more').style.display = list.length > S.shown ? '' : 'none';
    var soon = S.brand && !P.some(function (p) { return p.brand === S.brand; });
    $('soon').style.display = soon ? '' : 'none';
    if (soon) $('soonname').textContent = S.brand;
    $('empty').style.display = (!list.length && !soon) ? '' : 'none';
  }
  function refresh() { tabs(); selects(); render(); }
  function reset() { S.q = ''; S.brand = ''; S.cat = ''; S.origin = ''; S.avail = ''; S.shown = 24; $('q').value = ''; refresh(); }
  function init() {
    var u = new URLSearchParams(location.search), b = (u.get('brand') || '').toUpperCase().replace('-', ' ');
    if (BRANDS.indexOf(b) > -1) S.brand = b;
    if (u.get('q')) { S.q = u.get('q'); $('q').value = S.q; }
    $('q').oninput = function () { S.q = this.value.trim(); S.shown = 24; render(); };
    $('fcat').onchange = function () { S.cat = this.value; S.shown = 24; render(); };
    $('forigin').onchange = function () { S.origin = this.value; S.shown = 24; render(); };
    $('favail').onchange = function () { S.avail = this.value; S.shown = 24; render(); };
    $('more').onclick = function () { S.shown += 24; render(); };
    $('clear').onclick = reset; $('clear2').onclick = reset;
    refresh();
  }
  fetch('products.json').then(function (r) { return r.json(); }).then(function (d) { P = d; init(); })
    .catch(function () { $('empty').style.display = ''; $('empty').firstChild.textContent = 'Products could not be loaded. Please refresh, or contact us and we will help you directly.'; });
})();
