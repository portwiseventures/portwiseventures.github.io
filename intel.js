/* Trade Intelligence Centre: search over the published guides (intel-index.json). Text is inserted with textContent. */
(function () {
  'use strict'; var q = document.getElementById('iq'), out = document.getElementById('ir'); if (!q || !out) return; var idx = null, loading = false;
  function load(cb) { if (idx) return cb(); if (loading) return; loading = true; fetch('intel-index.json').then(function (r) { return r.json(); }).then(function (d) { idx = d; cb(); }).catch(function () { out.textContent = 'Search is unavailable right now. Browse the topics below.'; }); }
  function run() {
    var t = q.value.trim().toLowerCase(); out.innerHTML = ''; if (t.length < 2) return;
    var rows = idx.filter(function (a) { return [a.title, a.summary, a.category, a.tags.join(' ')].join(' ').toLowerCase().indexOf(t) > -1; });
    if (!rows.length) { out.textContent = 'No guides match “' + q.value.trim() + '”. Try another word, or browse the topics below.'; return; }
    rows.slice(0, 8).forEach(function (a) { var l = document.createElement('a'); l.href = a.url; var b = document.createElement('b'); b.textContent = a.title; var s = document.createElement('small'); s.textContent = a.category; l.appendChild(b); l.appendChild(s); out.appendChild(l); });
  }
  q.addEventListener('input', function () { load(run); });
})();
