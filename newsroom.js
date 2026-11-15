/* Portwise Newsroom. Add items to news.json: {"title","date":"YYYY-MM-DD","category":"Company announcements"|"Industry updates","summary","link","linklabel"} */
(function () {
  'use strict';
  var CATS = ['Company announcements', 'Industry updates'], items = [], cur = '';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function render() {
    var list = $('nlist'); list.innerHTML = '';
    var shown = items.filter(function (n) { return !cur || n.category === cur; });
    shown.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    shown.forEach(function (n) {
      var c = el('div', 'card'), t = el('time', '', new Date(n.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      t.setAttribute('datetime', n.date); c.appendChild(t); c.appendChild(el('p', 'bt', n.category)); c.appendChild(el('h3', '', n.title)); c.appendChild(el('p', '', n.summary));
      if (n.link) { var a = el('a', 'btn', n.linklabel || 'Read more'); a.href = n.link; c.appendChild(a); }
      list.appendChild(c);
    });
    var e = $('nempty'); e.style.display = shown.length ? 'none' : '';
    if (!shown.length) e.textContent = cur === 'Industry updates' ? 'We will post verified industry updates here. In the meantime, see the trade statistics and market resources in Trade Intelligence.' : 'No announcements yet.';
  }
  function tabs() {
    var box = $('ntabs'); box.innerHTML = '';
    ['All'].concat(CATS).forEach(function (c) {
      var b = el('button', (c === 'All' && !cur) || c === cur ? 'on' : '', c); b.type = 'button';
      b.onclick = function () { cur = c === 'All' ? '' : c; tabs(); render(); }; box.appendChild(b);
    });
  }
  fetch('news.json').then(function (r) { return r.json(); }).then(function (d) { items = d; tabs(); render(); })
    .catch(function () { $('nempty').style.display = ''; $('nempty').textContent = 'News could not be loaded. Please refresh the page.'; });
})();
