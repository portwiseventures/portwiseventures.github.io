/* Portwise Visual Journal (public, read-only). Shows ONLY published media (enforced by database access rules too).
   All text is inserted with textContent. Media files come from the public "portwise-journal" bucket. */
(function () {
  'use strict';
  var C = window.PW || {}, PAGE = 12, items = [], albums = [], view = [];
  var S = { cat: '', brand: '', country: '', album: '', type: '', q: '', shown: PAGE };
  var CATS = [['products', 'Products'], ['agriculture', 'Agriculture'], ['sourcing_production', 'Sourcing & Production'], ['processing_packaging', 'Processing & Packaging'], ['logistics_trade', 'Logistics & Trade'], ['business_events', 'Business & Events'], ['behind_the_scenes', 'Behind the Scenes']];
  var BRANDS = [['evara', 'EVARA'], ['agrinest', 'AGRINEST'], ['primecrest', 'PRIME CREST'], ['logicwise', 'LOGICWISE']];
  function $(id) { return document.getElementById(id); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function pub(p) { return (p && /^[A-Za-z0-9_\-./]+$/.test(p) && p.indexOf('..') < 0) ? C.supabaseUrl + '/storage/v1/object/public/portwise-journal/' + p.split('/').map(encodeURIComponent).join('/') : ''; }
  function date(v) { var d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }
  function label(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return ''; }
  function title(m) { return m.title || m.caption || 'Portwise Visual Journal'; }
  function rest(path) { return fetch(C.supabaseUrl + '/rest/v1/' + path, { headers: { apikey: C.anonKey || '', Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
  function load() { return Promise.all([rest('journal_media?select=*&is_published=eq.true&order=sort_order.asc,published_at.desc&limit=500'), rest('journal_albums?select=*&is_published=eq.true&order=sort_order.asc,published_at.desc&limit=100')]); }

  function tile(m, list, big) {
    var b = el('button', 'jm' + (big ? ' big' : '') + (m.media_type === 'video' ? ' vid' : ''), null); b.type = 'button'; b.setAttribute('aria-label', 'Open ' + title(m) + (m.media_type === 'video' ? ' (video)' : ''));
    var u = m.media_type === 'video' ? pub(m.thumbnail_path) : (pub(m.thumbnail_path) || pub(m.media_path)), box = el('span', 'jf');
    if (u) { var i = el('img'); i.src = u; i.alt = m.alt_text || title(m); i.loading = 'lazy'; i.decoding = 'async'; box.appendChild(i); }
    if (m.media_type === 'video') box.appendChild(el('span', 'play', '▶'));
    b.appendChild(box); var cap = el('span', 'jc'); cap.appendChild(el('b', '', title(m)));
    var meta = [label(BRANDS, m.brand), m.country, date(m.published_at)].filter(Boolean).join(' · '); if (meta) cap.appendChild(el('small', '', meta)); b.appendChild(cap);
    b.addEventListener('click', function () { openLb(list, list.indexOf(m), b); }); return b;
  }

  // ---------- lightbox
  var lb, lbIdx = 0, lbList = [], opener = null, tx = 0;
  function buildLb() {
    lb = el('div', 'lb'); lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Media viewer');
    var x = el('button', 'lbx', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); var p = el('button', 'lbn prev', '‹'), n = el('button', 'lbn next', '›'); p.type = n.type = 'button'; p.setAttribute('aria-label', 'Previous'); n.setAttribute('aria-label', 'Next');
    var stage = el('div', 'lbs'), meta = el('div', 'lbm'); stage.id = 'lbStage'; meta.id = 'lbMeta'; lb.appendChild(x); lb.appendChild(p); lb.appendChild(n); lb.appendChild(stage); lb.appendChild(meta); document.body.appendChild(lb);
    x.onclick = closeLb; p.onclick = function () { go(-1); }; n.onclick = function () { go(1); }; lb.addEventListener('click', function (e) { if (e.target === lb || e.target === stage) closeLb(); });
    lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true }); lb.addEventListener('touchend', function (e) { var d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 60) go(d < 0 ? 1 : -1); }, { passive: true });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return; if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Tab') { var f = lb.querySelectorAll('button:not([disabled]),a[href],video[controls]'); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
  }
  function show() {
    var m = lbList[lbIdx], st = $('lbStage'), mt = $('lbMeta'); st.innerHTML = ''; mt.innerHTML = '';
    if (m.media_type === 'video') { var v = el('video'); v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.setAttribute('aria-label', title(m)); var po = pub(m.thumbnail_path); if (po) v.poster = po; v.src = pub(m.media_path); st.appendChild(v); }
    else { var i = el('img'); i.src = pub(m.media_path); i.alt = m.alt_text || title(m); st.appendChild(i); }
    mt.appendChild(el('h2', '', title(m))); if (m.caption && m.caption !== m.title) mt.appendChild(el('p', 'cp', m.caption)); if (m.description) mt.appendChild(el('p', '', m.description));
    var info = [label(CATS, m.category), label(BRANDS, m.brand), m.country, date(m.published_at)].filter(Boolean).join(' · '); if (info) mt.appendChild(el('p', 'in', info));
    if (m.tags && m.tags.length) { var tg = el('p', 'tg'); m.tags.forEach(function (t) { var b = el('button', '', '#' + t); b.type = 'button'; b.onclick = function () { closeLb(); if ($('jrQ')) { $('jrQ').value = t; S.q = t; S.shown = PAGE; apply(); location.hash = 'gallery'; } }; tg.appendChild(b); }); mt.appendChild(tg); }
    lb.querySelector('.prev').disabled = lbList.length < 2; lb.querySelector('.next').disabled = lbList.length < 2;
  }
  function go(d) { if (lbList.length < 2) return; stopVid(); lbIdx = (lbIdx + d + lbList.length) % lbList.length; show(); }
  function stopVid() { var v = lb.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } }
  function openLb(list, i, from) { if (!lb) buildLb(); lbList = list; lbIdx = Math.max(0, i); opener = from; show(); lb.hidden = false; document.body.classList.add('lbo'); lb.querySelector('.lbx').focus(); }
  function closeLb() { if (!lb || lb.hidden) return; stopVid(); lb.hidden = true; document.body.classList.remove('lbo'); if (opener && opener.focus) opener.focus(); }

  // ---------- gallery page
  function pills(box, list, key, allLabel) {
    box.innerHTML = ''; [['', allLabel]].concat(list).forEach(function (o) { var b = el('button', 'pl', o[1]); b.type = 'button'; b.setAttribute('aria-pressed', S[key] === o[0] ? 'true' : 'false'); b.onclick = function () { S[key] = o[0]; S.shown = PAGE; apply(); }; box.appendChild(b); });
  }
  function matches(m) {
    if (S.cat && m.category !== S.cat) return false; if (S.brand && m.brand !== S.brand) return false; if (S.country && m.country !== S.country) return false; if (S.album && m.album_id !== S.album) return false; if (S.type && m.media_type !== S.type) return false;
    if (S.q) { var h = [m.title, m.caption, m.description, m.country, label(CATS, m.category), label(BRANDS, m.brand)].concat(m.tags || []).join(' ').toLowerCase(); if (h.indexOf(S.q.toLowerCase()) < 0) return false; } return true;
  }
  function apply() {
    pills($('jrCats'), CATS, 'cat', 'All'); pills($('jrBrands'), BRANDS, 'brand', 'All brands');
    view = items.filter(matches); var grid = $('jrGrid'); grid.innerHTML = '';
    if (!items.length) { var e = el('div', 'opempty'); e.appendChild(el('h3', '', 'The Visual Journal is being curated.')); e.appendChild(el('p', '', 'Authentic photographs and videos from Portwise sourcing, production and trade activity will appear here as they are published.')); grid.appendChild(e); $('jrMore').hidden = true; $('jrCount').textContent = ''; return; }
    if (!view.length) { grid.appendChild(el('p', 'opmeta', 'Nothing matches these filters.')); $('jrMore').hidden = true; $('jrCount').textContent = ''; return; }
    view.slice(0, S.shown).forEach(function (m) { grid.appendChild(tile(m, view)); }); $('jrCount').textContent = 'Showing ' + Math.min(S.shown, view.length) + ' of ' + view.length; $('jrMore').hidden = view.length <= S.shown;
  }
  function gallery() {
    var grid = $('jrGrid'); if (!grid) return;
    load().then(function (r) {
      items = r[0]; albums = r[1];
      function fill(sel, vals) { vals.filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort().forEach(function (v) { var o = el('option', '', v); o.value = v; sel.appendChild(o); }); }
      fill($('jrCountry'), items.map(function (m) { return m.country; }));
      albums.forEach(function (a) { var o = el('option', '', a.title); o.value = a.id; $('jrAlbum').appendChild(o); });
      var fe = items.filter(function (m) { return m.is_featured; }).slice(0, 6); if (fe.length) { $('jrFeat').hidden = false; fe.forEach(function (m, i) { $('jrFeatGrid').appendChild(tile(m, fe, i === 0)); }); }
      var qa = (new URLSearchParams(location.search).get('album') || ''); albums.forEach(function (a) { if (a.slug === qa) { S.album = a.id; $('jrAlbum').value = a.id; } });
      if (albums.length) { $('jrAlbums').hidden = false; albums.forEach(function (a) { var b = el('button', 'jm'); b.type = 'button'; var cov = pub(a.cover_image_path) || (function () { var f = items.filter(function (m) { return m.album_id === a.id && m.media_type === 'image'; })[0]; return f ? (pub(f.thumbnail_path) || pub(f.media_path)) : ''; })();
        var f = el('span', 'jf'); if (cov) { var i = el('img'); i.src = cov; i.alt = ''; i.loading = 'lazy'; f.appendChild(i); } b.appendChild(f); var n = items.filter(function (m) { return m.album_id === a.id; }).length; var c = el('span', 'jc'); c.appendChild(el('b', '', a.title)); c.appendChild(el('small', '', n + (n === 1 ? ' item' : ' items'))); b.appendChild(c);
        b.onclick = function () { S.album = a.id; $('jrAlbum').value = a.id; S.shown = PAGE; apply(); $('gallery').scrollIntoView({ behavior: 'smooth' }); }; $('jrAlbumGrid').appendChild(b); }); }
      apply();
    }).catch(function () { grid.innerHTML = ''; grid.appendChild(el('p', 'opempty', 'We could not load the journal right now. Please try again shortly.')); });
    $('jrQ').addEventListener('input', function () { S.q = this.value.trim(); S.shown = PAGE; apply(); });
    [['jrCountry', 'country'], ['jrAlbum', 'album'], ['jrType', 'type']].forEach(function (p) { $(p[0]).addEventListener('change', function () { S[p[1]] = this.value; S.shown = PAGE; apply(); }); });
    $('jrMore').onclick = function () { S.shown += PAGE; apply(); }; $('jrReset').onclick = function () { S = { cat: '', brand: '', country: '', album: '', type: '', q: '', shown: PAGE }; $('jrQ').value = ''; ['jrCountry', 'jrAlbum', 'jrType'].forEach(function (id) { $(id).value = ''; }); apply(); };
  }
  // ---------- homepage preview
  function home() {
    var box = $('homeJournal'); if (!box) return;
    rest('journal_media?select=*&is_published=eq.true&order=is_featured.desc,published_at.desc&limit=6').then(function (rows) { box.innerHTML = '';
      if (!rows.length) { box.appendChild(el('p', 'opmeta', 'Photographs and videos from Portwise activity will appear here as they are published.')); return; }
      rows.forEach(function (m) { var a = el('a', 'jm'); a.href = 'visual-journal.html'; a.setAttribute('aria-label', title(m)); var f = el('span', 'jf'), u = pub(m.thumbnail_path) || (m.media_type === 'image' ? pub(m.media_path) : ''); if (u) { var i = el('img'); i.src = u; i.alt = m.alt_text || title(m); i.loading = 'lazy'; f.appendChild(i); } if (m.media_type === 'video') f.appendChild(el('span', 'play', '▶')); a.appendChild(f); var c = el('span', 'jc'); c.appendChild(el('b', '', title(m))); a.appendChild(c); box.appendChild(a); });
    }).catch(function () { box.innerHTML = ''; box.appendChild(el('p', 'opmeta', 'The Visual Journal is temporarily unavailable.')); });
  }
  gallery(); home();
})();
