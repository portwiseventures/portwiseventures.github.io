/* Corporate Publications resource library. Add entries to publications.json (status "available" with "file" or "link", or "soon"). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, items = [], cat = '', q = '';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function tabs() {
    var cats = ['All'], box = $('ltabs'); box.innerHTML = '';
    items.forEach(function (i) { if (cats.indexOf(i.category) < 0) cats.push(i.category); });
    cats.forEach(function (c) { var b = el('button', (c === 'All' && !cat) || c === cat ? 'on' : '', c); b.type = 'button'; b.onclick = function () { cat = c === 'All' ? '' : c; tabs(); draw(); }; box.appendChild(b); });
  }
  function draw() {
    var g = $('lgrid'); g.innerHTML = '';
    var list = items.filter(function (i) { return (!cat || i.category === cat) && (!q || (i.title + ' ' + i.brand + ' ' + i.description).toLowerCase().indexOf(q.toLowerCase()) > -1); });
    list.sort(function (a, b) { return (a.status === 'soon') - (b.status === 'soon'); });
    $('lcount').textContent = list.length + (list.length === 1 ? ' publication' : ' publications');
    list.forEach(function (i) {
      var c = el('div', 'item' + (i.status === 'soon' ? ' soon' : '')), l = el('div');
      l.appendChild(el('span', 'tagc', i.category)); l.appendChild(el('h3', '', i.title)); l.appendChild(el('p', 'sm', i.description));
      l.appendChild(el('p', 'meta', [i.brand, i.format, i.size, i.meta].filter(Boolean).join(' · '))); c.appendChild(l);
      if (i.status === 'soon') c.appendChild(el('span', 'bt', 'Coming soon'));
      else { var a = el('a', 'btn', i.file ? 'Download' : 'Open'); a.href = i.file || i.link; if (i.file) a.setAttribute('download', ''); c.appendChild(a); }
      g.appendChild(c);
    });
    if (!list.length) g.appendChild(el('p', '', 'No publications match your search.'));
  }
  $('lq').oninput = function () { q = this.value.trim(); draw(); };
  fetch('publications.json').then(function (r) { return r.json(); }).then(function (d) { items = d; tabs(); draw(); })
    .catch(function () { $('lgrid').textContent = 'The library could not be loaded. Please refresh the page.'; });
})();
