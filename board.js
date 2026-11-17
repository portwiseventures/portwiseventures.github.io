/* Business Opportunity Board. Add approved items to opportunities.json:
   {"title","category":"Sourcing opportunity|Distribution partnership|Export collaboration|Business representation|Strategic partnership","market":"","description":"","requirements":"","date":"YYYY-MM-DD","status":"open"} */
(function () {
  'use strict';
  var list = document.getElementById('boardList'); if (!list) return;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var items = [], cur = '';
  function draw() {
    list.innerHTML = ''; var show = items.filter(function (o) { return !cur || o.category === cur; });
    document.getElementById('boardEmpty').style.display = items.length ? 'none' : '';
    show.forEach(function (o) {
      var c = el('div', 'card'); c.appendChild(el('p', 'bt', o.category + (o.date ? ' · ' + o.date : ''))); c.appendChild(el('h3', '', o.title)); c.appendChild(el('p', '', o.description || ''));
      if (o.market) { var m = el('p', 'sm'); m.appendChild(el('b', '', 'Target market: ')); m.appendChild(document.createTextNode(o.market)); c.appendChild(m); }
      if (o.requirements) { var r = el('p', 'sm'); r.appendChild(el('b', '', 'Requirements: ')); r.appendChild(document.createTextNode(o.requirements)); c.appendChild(r); }
      var a = el('a', 'btn', 'Enquire about this opportunity'); a.href = 'partner-with-us.html?opportunity=' + encodeURIComponent(o.title) + '#apply'; c.appendChild(a); list.appendChild(c);
    });
  }
  fetch('opportunities.json').then(function (r) { return r.json(); }).then(function (d) {
    items = d.filter(function (o) { return !o.status || o.status === 'open'; }); if (!items.length) return;
    var cats = []; items.forEach(function (o) { if (cats.indexOf(o.category) < 0) cats.push(o.category); });
    var t = document.getElementById('boardTabs'); ['All'].concat(cats).forEach(function (c) { var b = el('button', c === 'All' ? 'on' : '', c); b.type = 'button'; b.onclick = function () { cur = c === 'All' ? '' : c; [].slice.call(t.children).forEach(function (x) { x.className = ''; }); b.className = 'on'; draw(); }; t.appendChild(b); });
    draw();
  }).catch(function () {});
})();
