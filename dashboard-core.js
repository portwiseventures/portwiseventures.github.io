/* Portwise staff dashboard: core (auth, API, helpers, generic list + record view).
   No third-party scripts. Every value from the database is inserted with textContent. */
(function () {
  'use strict';
  if (window.top !== window.self) { document.body.textContent = ''; return; } // anti-clickjacking
  var C = window.PW || {}, API = C.supabaseUrl, KEY = C.anonKey, SK = 'pw_staff_session', PAGE = 25, IDLE_MS = 30 * 60 * 1000;
  var D = window.PWD = { S: { session: null, user: null, profile: null, staff: {} }, MODS: {} };

  // ---------- tiny DOM helper
  function h(tag, a) {
    var n = document.createElement(tag), i = 2; a = a || {};
    Object.keys(a).forEach(function (k) {
      if (k === 'class') n.className = a[k]; else if (k === 'text') n.textContent = a[k]; else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), a[k]);
      else if (a[k] !== false && a[k] != null) n.setAttribute(k, a[k] === true ? '' : a[k]);
    });
    for (; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; if (Array.isArray(c)) c.forEach(function (x) { if (x != null) n.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); }); else n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    return n;
  }
  var $ = function (id) { return document.getElementById(id); };
  function toast(msg, bad) { var t = $('toast'); t.textContent = msg; t.className = 'toast on' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'toast'; }, 3500); }
  function human(k) { k = String(k).replace(/_/g, ' '); return k.charAt(0).toUpperCase() + k.slice(1); }
  function when(v, dOnly) { if (!v) return ''; var d = new Date(v); if (isNaN(d)) return String(v); return dOnly ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function fsize(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function stClass(s) { return /verified|approved|published|active|fulfilled|open|sent/.test(s) ? 'g' : /reject|suspend|failed|closed|inactive/.test(s) ? 'r' : /new|pending|additional|urgent|reviewing/.test(s) ? 'a' : /archiv/.test(s) ? '' : 'b'; }
  function badge(s, label) { return h('span', { class: 'st ' + stClass(String(s)), text: label || human(s) }); }
  function clean(q) { return String(q || '').replace(/[,()*\\"%:]/g, ' ').trim().slice(0, 80); }
  D.h = h; D.$ = $; D.toast = toast; D.human = human; D.when = when; D.fsize = fsize; D.badge = badge; D.clean = clean;

  // ---------- session + API
  function save(s) { D.S.session = s; if (s) sessionStorage.setItem(SK, JSON.stringify(s)); else sessionStorage.removeItem(SK); }
  function load() { try { return JSON.parse(sessionStorage.getItem(SK)); } catch (e) { return null; } }
  function tokenRes(r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error_description || j.msg || j.message || 'Sign-in failed'); return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: j.user }; }); }
  function refresh() {
    var s = D.S.session; if (!s || !s.refresh_token) return Promise.reject(new Error('expired'));
    return fetch(API + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) }).then(tokenRes).then(function (n) { save(n); return n; });
  }
  function ensure() { var s = D.S.session; if (!s) return Promise.reject(new Error('Not signed in')); return s.expires_at - 60 < Date.now() / 1000 ? refresh() : Promise.resolve(s); }
  function hdrs(extra) { return Object.assign({ apikey: KEY, Authorization: 'Bearer ' + D.S.session.access_token }, extra || {}); }
  function api(path, o) {
    o = o || {};
    function go() { return fetch(API + path, { method: o.method || 'GET', headers: hdrs(Object.assign({ 'Content-Type': 'application/json' }, o.headers || {})), body: o.body !== undefined ? JSON.stringify(o.body) : undefined }); }
    return ensure().then(go).then(function (r) { return r.status === 401 ? refresh().then(go) : r; }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { var m = t; try { var j = JSON.parse(t); m = j.message || j.msg || j.error || t; } catch (e) { } throw new Error(String(m).slice(0, 300)); });
      if (o.raw) return r; return r.status === 204 ? null : r.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }
  D.api = api;
  D.sign = function (bucket, path) {
    return api('/storage/v1/object/sign/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'POST', body: { expiresIn: 300 } }).then(function (j) { return API + '/storage/v1' + j.signedURL; });
  };
  D.upload = function (bucket, path, file) {
    return ensure().then(function () { return fetch(API + '/storage/v1/object/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'POST', headers: hdrs({ 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' }), body: file }); })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error('Upload failed: ' + t.slice(0, 160)); }); });
  };

  // ---------- generic list
  D.listState = {};
  function qs(o) { return Object.keys(o).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&'); }
  function filtersFor(m, st) {
    var f = {};
    if (st.status && m.statusCol) f[m.statusCol] = 'eq.' + st.status;
    if (st.extra) Object.keys(st.extra).forEach(function (k) { if (st.extra[k]) f[k] = 'eq.' + st.extra[k]; });
    var q = clean(st.q); if (q && m.search) f.or = '(' + m.search.map(function (c) { return c + '.ilike.*' + q + '*'; }).join(',') + ')';
    if (m.fixed) Object.keys(m.fixed).forEach(function (k) { f[k] = m.fixed[k]; });
    return f;
  }
  function csvCell(v) { if (v == null) return ''; if (Array.isArray(v)) v = v.join('; '); if (typeof v === 'object') v = JSON.stringify(v); v = String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
  function exportCsv(m, st) {
    var f = filtersFor(m, st); f.select = m.select || '*'; f.order = m.order; f.limit = 5000;
    api('/rest/v1/' + m.table + '?' + qs(f)).then(function (rows) {
      if (!rows.length) return toast('Nothing to export.', true);
      var keys = Object.keys(rows[0]).filter(function (k) { var v = rows[0][k]; return v === null || typeof v !== 'object' || Array.isArray(v); });
      var csv = [keys.map(csvCell).join(',')].concat(rows.map(function (r) { return keys.map(function (k) { return csvCell(r[k]); }).join(','); })).join('\r\n');
      var a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: m.table + '-' + new Date().toISOString().slice(0, 10) + '.csv' }); document.body.appendChild(a); a.click(); a.remove();
      toast('Exported ' + rows.length + ' rows.');
    }).catch(function (e) { toast(e.message, true); });
  }
  D.renderList = function (key, root) {
    var m = D.MODS[key], st = D.listState[key] = D.listState[key] || { q: '', status: '', page: 0, extra: {} };
    root.innerHTML = '';
    var head = h('div', { class: 'acts' }, h('h1', { text: m.title }), h('div', { class: 'grow' }), m.onNew ? h('button', { class: 'btn gold', text: '+ New', onclick: function () { m.onNew(); } }) : null);
    var qIn = h('input', { type: 'search', placeholder: m.placeholder || 'Search…', value: st.q, 'aria-label': 'Search' });
    var sSel = m.statusCol ? h('select', { 'aria-label': 'Status filter' }, h('option', { value: '', text: 'All statuses' }), m.statuses.map(function (s) { return h('option', { value: s[0], text: s[1], selected: st.status === s[0] }); })) : h('span');
    var go = h('button', { class: 'btn', text: 'Search', onclick: function () { st.q = qIn.value; st.status = sSel.value || ''; st.page = 0; D.renderList(key, root); } });
    qIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); }); if (m.statusCol) sSel.addEventListener('change', function () { go.click(); });
    var exp = h('button', { class: 'btn sec', text: 'Export CSV', onclick: function () { exportCsv(m, st); } });
    var reset = h('button', { class: 'btn sec', text: 'Reset', onclick: function () { D.listState[key] = null; D.renderList(key, root); } });
    var out = h('div', { class: 'panel' }, h('p', { class: 'muted', text: 'Loading…' }));
    root.appendChild(head); root.appendChild(h('div', { class: 'bar' }, qIn, sSel, go, exp, reset)); root.appendChild(out);
    var f = filtersFor(m, st); f.select = m.select || '*'; f.order = m.order; f.limit = PAGE; f.offset = st.page * PAGE;
    api('/rest/v1/' + m.table + '?' + qs(f), { raw: true, headers: { Prefer: 'count=exact' } }).then(function (r) {
      var total = Number((r.headers.get('content-range') || '').split('/')[1]) || 0;
      return r.json().then(function (rows) { return { rows: rows, total: total }; });
    }).then(function (d) {
      out.innerHTML = '';
      if (!d.rows.length) { out.appendChild(h('p', { class: 'muted', text: 'No records found.' })); return; }
      var tb = h('tbody');
      d.rows.forEach(function (row) {
        var tr = h('tr', { class: 'row', tabindex: 0, role: 'button' });
        m.cols.forEach(function (c) { var v = c[1](row); tr.appendChild(h('td', { 'data-label': c[0] }, v == null || v === '' ? '' : v)); });
        var open = function () { if (m.rowOpen) m.rowOpen(row); else D.openRecord(key, row.id); }; tr.addEventListener('click', open); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(); }); tb.appendChild(tr);
      });
      out.appendChild(h('div', { class: 'scroll' }, h('table', { class: 'rt' }, h('thead', {}, h('tr', {}, m.cols.map(function (c) { return h('th', { text: c[0] }); }))), tb)));
      var pages = Math.max(1, Math.ceil(d.total / PAGE));
      out.appendChild(h('div', { class: 'pager' }, h('span', { class: 'muted', text: d.total + ' record' + (d.total === 1 ? '' : 's') + ' · page ' + (st.page + 1) + ' of ' + pages }),
        h('div', { class: 'acts' }, h('button', { class: 'btn sec sm', text: '← Prev', disabled: st.page === 0, onclick: function () { st.page--; D.renderList(key, root); } }), h('button', { class: 'btn sec sm', text: 'Next →', disabled: st.page + 1 >= pages, onclick: function () { st.page++; D.renderList(key, root); } }))));
    }).catch(function (e) { out.innerHTML = ''; out.appendChild(h('p', { class: 'err', text: 'Could not load: ' + e.message })); });
  };

  // ---------- record drawer
  var SKIP = ['id', 'user_id', 'created_by', 'updated_by', 'reviewed_by', 'uploaded_by'];
  function fmtVal(k, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
    if (Array.isArray(v)) return v.join(', '); if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'object') { var j = JSON.stringify(v, null, 1); return j === '{}' ? null : j; }
    if (/(_at|_date|deadline)$/.test(k)) return when(v, /_date$/.test(k)); return String(v);
  }
  D.kv = function (row, skipExtra) {
    var dl = h('dl', { class: 'kv' });
    Object.keys(row).forEach(function (k) { var v = row[k]; if (SKIP.indexOf(k) > -1 || (skipExtra || []).indexOf(k) > -1 || (v && typeof v === 'object' && !Array.isArray(v) && k !== 'details' && k !== 'specifications')) return; var f = fmtVal(k, v); if (f != null) { dl.appendChild(h('dt', { text: human(k) })); dl.appendChild(h('dd', { text: f })); } });
    return dl;
  };
  var ENT = { buyers: 'buyer', suppliers: 'supplier', requests: 'buyer_request', products: 'product', responses: 'response', opportunities: 'opportunity' };
  D.ent = ENT;
  function section(title, body) { return h('section', { class: 'panel' }, h('h2', { text: title }), body); }
  D.section = section;

  function notesBox(entity, id) {
    var list = h('div'), ta = h('textarea', { placeholder: 'Add an internal note (staff only)…', maxlength: 4000, 'aria-label': 'New internal note' });
    function refreshNotes() { api('/rest/v1/internal_notes?' + qs({ entity_type: 'eq.' + entity, entity_id: 'eq.' + id, order: 'created_at.desc', select: '*' })).then(function (rows) {
      list.innerHTML = ''; if (!rows.length) list.appendChild(h('p', { class: 'muted', text: 'No notes yet.' }));
      rows.forEach(function (n) { list.appendChild(h('div', { class: 'item' }, h('div', { text: n.note_body }), h('small', { text: (D.S.staff[n.created_by] || 'Staff') + ' · ' + when(n.created_at) }))); }); }).catch(function (e) { list.textContent = e.message; }); }
    var add = h('button', { class: 'btn sm', text: 'Add note', onclick: function () { var t = ta.value.trim(); if (!t) return; add.disabled = true;
      api('/rest/v1/internal_notes', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { entity_type: entity, entity_id: id, note_body: t, created_by: D.S.user.id } }).then(function () { ta.value = ''; refreshNotes(); toast('Note added.'); }).catch(function (e) { toast(e.message, true); }).then(function () { add.disabled = false; }); } });
    refreshNotes(); return section('Internal notes', h('div', {}, ta, h('div', { class: 'acts' }, add), list));
  }
  var DOCCATS = ['company_profile', 'registration', 'certification', 'catalogue', 'quotation', 'specification', 'product_image', 'facility_image', 'product_video', 'business_document', 'supporting', 'other'];
  var OKT = { 'application/pdf': 1, 'image/jpeg': 1, 'image/png': 1, 'image/webp': 1, 'application/msword': 1, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 1, 'application/vnd.ms-excel': 1, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 1, 'video/mp4': 1, 'video/webm': 1 };
  function docsBox(entity, id) {
    var list = h('div'), cat = h('select', { 'aria-label': 'Document category' }, DOCCATS.map(function (c) { return h('option', { value: c, text: human(c), selected: c === 'supporting' }); })), file = h('input', { type: 'file', 'aria-label': 'File to upload' });
    function refreshDocs() { api('/rest/v1/business_documents?' + qs({ entity_type: 'eq.' + entity, entity_id: 'eq.' + id, deleted_at: 'is.null', order: 'created_at.desc', select: '*' })).then(function (rows) {
      list.innerHTML = ''; if (!rows.length) list.appendChild(h('p', { class: 'muted', text: 'No documents.' }));
      rows.forEach(function (d) { list.appendChild(h('div', { class: 'item acts' }, h('div', { class: 'grow' }, h('div', { text: d.original_filename }), h('small', { text: [human(d.document_category || 'other'), d.file_size_bytes ? fsize(d.file_size_bytes) : '', when(d.created_at)].filter(Boolean).join(' · ') })),
        h('button', { class: 'btn sec sm', text: 'Open', onclick: function () { D.sign(d.storage_bucket, d.storage_path).then(function (u) { window.open(u, '_blank', 'noopener'); }).catch(function (e) { toast(e.message, true); }); } }),
        h('button', { class: 'btn sec sm', text: 'Remove', onclick: function () { if (!confirm('Remove "' + d.original_filename + '" from this record? (It is hidden, not erased.)')) return; api('/rest/v1/business_documents?id=eq.' + d.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { deleted_at: new Date().toISOString() } }).then(function () { refreshDocs(); toast('Removed.'); }).catch(function (e) { toast(e.message, true); }); } }))); }); }).catch(function (e) { list.textContent = e.message; }); }
    var up = h('button', { class: 'btn sm', text: 'Upload', onclick: function () {
      var f = file.files[0]; if (!f) return toast('Choose a file first.', true); if (!OKT[f.type]) return toast('File type not allowed (PDF, Word, Excel, JPG, PNG, WebP, MP4, WebM).', true);
      if (f.size > (f.type.indexOf('video/') === 0 ? 50 : 25) * 1048576) return toast('File too large (25 MB, video 50 MB).', true);
      var bucket = /^(video\/|image\/)/.test(f.type) && ['product_image', 'facility_image', 'product_video'].indexOf(cat.value) > -1 ? 'portwise-product-media' : 'portwise-documents';
      var path = entity + '/' + id + '/' + crypto.randomUUID() + '-' + f.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-80); up.disabled = true; up.textContent = 'Uploading…';
      D.upload(bucket, path, f).then(function () { return api('/rest/v1/business_documents', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { entity_type: entity, entity_id: id, storage_bucket: bucket, storage_path: path, original_filename: f.name, mime_type: f.type, file_size_bytes: f.size, classification: 'confidential', document_category: cat.value, uploaded_by: D.S.user.id } }); })
        .then(function () { file.value = ''; refreshDocs(); toast('Uploaded.'); }).catch(function (e) { toast(e.message, true); }).then(function () { up.disabled = false; up.textContent = 'Upload'; }); } });
    refreshDocs(); return section('Documents', h('div', {}, list, h('div', { class: 'row2' }, cat, file), h('div', { class: 'acts' }, up)));
  }
  function activityBox(entity, id) {
    var list = h('div', {}, h('p', { class: 'muted', text: 'Loading…' }));
    api('/rest/v1/activity_logs?' + qs({ entity_type: 'eq.' + entity, entity_id: 'eq.' + id, order: 'created_at.desc', limit: 50, select: '*' })).then(function (rows) { list.innerHTML = ''; if (!rows.length) list.appendChild(h('p', { class: 'muted', text: 'No activity yet.' }));
      rows.forEach(function (a) { var d = a.details || {}, extra = d.from ? human(d.from) + ' → ' + human(d.to) : (d.filename || ''); list.appendChild(h('div', { class: 'item' }, h('div', { text: human(a.action) + (extra ? ': ' + extra : '') }), h('small', { text: (D.S.staff[a.actor_user_id] || (a.actor_user_id ? 'Staff' : 'Website submission')) + ' · ' + when(a.created_at) }))); }); }).catch(function (e) { list.textContent = e.message; });
    return section('Activity history', list);
  }
  D.openRecord = function (key, id) {
    var m = D.MODS[key], body = $('dBody'); $('drawer').hidden = false; document.body.style.overflow = 'hidden'; body.innerHTML = ''; body.appendChild(h('p', { class: 'muted', text: 'Loading…' })); $('drawer').scrollTop = 0;
    api('/rest/v1/' + m.table + '?' + qs({ select: m.detailSelect || m.select || '*', id: 'eq.' + id })).then(function (rows) {
      if (!rows.length) throw new Error('Record not found.'); var row = rows[0]; body.innerHTML = '';
      var title = m.recordTitle(row);
      body.appendChild(h('div', { class: 'acts' }, h('h1', { text: title }), m.statusCol ? badge(row[m.statusCol]) : null));
      if (row.reference_number) body.appendChild(h('p', { class: 'muted', text: 'Reference: ' + row.reference_number + ' · Received ' + when(row.created_at) }));
      if (m.statusCol && m.statuses && !m.noStatusEdit) {
        var sel = h('select', { 'aria-label': 'Change status' }, m.statuses.map(function (s) { return h('option', { value: s[0], text: s[1], selected: row[m.statusCol] === s[0] }); }));
        var btn = h('button', { class: 'btn sm', text: 'Update status', onclick: function () {
          if (sel.value === row[m.statusCol]) return toast('Status unchanged.'); if (m.confirm && m.confirm[sel.value] && !confirm(m.confirm[sel.value])) return;
          var patch = {}; patch[m.statusCol] = sel.value; if (m.reviewed) { patch.reviewed_by = D.S.user.id; patch.reviewed_at = new Date().toISOString(); }
          btn.disabled = true; api('/rest/v1/' + m.table + '?id=eq.' + id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: patch }).then(function () { toast('Status updated.'); D.openRecord(key, id); if (D.refreshList) D.refreshList(); }).catch(function (e) { toast(e.message, true); btn.disabled = false; }); } });
        body.appendChild(section('Status', h('div', { class: 'acts' }, sel, btn)));
      }
      if (m.actions) { var a = m.actions(row, function () { D.openRecord(key, id); if (D.refreshList) D.refreshList(); }); if (a) body.appendChild(a); }
      if (m.contacts) { var cs = row[m.contacts] || []; if (cs.length) body.appendChild(section('Contact', cs.map(function (c) { return D.kv(c, ['buyer_id', 'supplier_id', 'created_at', 'updated_at']); }))); }
      body.appendChild(section('Details', D.kv(row, m.skip)));
      if (m.extra) m.extra(row, body);
      body.appendChild(docsBox(ENT[key], id)); body.appendChild(notesBox(ENT[key], id)); body.appendChild(activityBox(ENT[key], id));
    }).catch(function (e) { body.innerHTML = ''; body.appendChild(h('p', { class: 'err', text: e.message })); });
  };
  function closeDrawer() { $('drawer').hidden = true; document.body.style.overflow = ''; }
  D.closeDrawer = closeDrawer; $('dClose').addEventListener('click', closeDrawer); document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('drawer').hidden) closeDrawer(); });

  // ---------- auth flow + routing
  function route() {
    if (!D.S.profile) return; var key = (location.hash.replace(/^#\/?/, '') || 'overview').split('/')[0], mods = D.NAV, main = $('main');
    if (!mods.some(function (n) { return n[0] === key; })) key = 'overview';
    $('side').querySelectorAll('a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-k') === key); }); $('side').classList.remove('open'); $('menuBtn').setAttribute('aria-expanded', 'false'); closeDrawer(); document.title = 'Portwise Staff · ' + human(key);
    D.refreshList = null; if (D.MODS[key]) { D.refreshList = function () { D.renderList(key, main); }; D.renderList(key, main); } else if (D.views[key]) D.views[key](main); main.focus({ preventScroll: true });
  }
  function startApp() {
    $('login').hidden = true; $('app').hidden = false; $('who').textContent = D.S.profile.full_name || D.S.user.email;
    var nav = $('side'); nav.innerHTML = ''; D.NAV.forEach(function (n) { nav.appendChild(h('a', { href: '#/' + n[0], 'data-k': n[0], text: n[1] })); });
    api('/rest/v1/profiles?select=user_id,full_name,email').then(function (ps) { ps.forEach(function (p) { D.S.staff[p.user_id] = p.full_name || p.email; }); }).catch(function () { }).then(route);
  }
  function showLogin(msg) { save(null); D.S.profile = null; $('app').hidden = true; $('login').hidden = false; $('lErr').textContent = msg || ''; $('lPass').value = ''; closeDrawer(); }
  function verify() {
    return api('/rest/v1/profiles?select=role,account_status,full_name&user_id=eq.' + D.S.user.id).then(function (r) {
      if (!r.length || r[0].role !== 'admin' || r[0].account_status !== 'active') throw new Error('This account does not have staff access.'); D.S.profile = r[0]; });
  }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); var b = $('lBtn'); b.disabled = true; $('lErr').textContent = '';
    fetch(API + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('lEmail').value.trim(), password: $('lPass').value }) })
      .then(tokenRes).then(function (s) { save(s); D.S.user = s.user; return verify(); }).then(startApp)
      .catch(function (err) { var bad = /invalid login/i.test(err.message); showLogin(bad ? 'Incorrect email or password.' : err.message); }).then(function () { b.disabled = false; });
  });
  $('logoutBtn').addEventListener('click', function () { var s = D.S.session; if (s) fetch(API + '/auth/v1/logout', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + s.access_token } }).catch(function () { }); showLogin('You have been signed out.'); });
  $('menuBtn').addEventListener('click', function () { var o = $('side').classList.toggle('open'); this.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  window.addEventListener('hashchange', route);
  var idle; function bump() { clearTimeout(idle); if (D.S.session) idle = setTimeout(function () { showLogin('Signed out after 30 minutes of inactivity.'); }, IDLE_MS); }
  ['click', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, bump, { passive: true }); });
  D.boot = function () {
    var s = load(); if (!s || !API || !KEY) return showLogin(!KEY ? 'Dashboard is not configured.' : '');
    D.S.session = s; D.S.user = s.user; ensure().then(verify).then(function () { bump(); startApp(); }).catch(function () { showLogin(''); });
  };
  var origStart = startApp; startApp = function () { bump(); origStart(); }; D.start = startApp;
})();
