/* Portwise Ventures: Business Network forms engine (vanilla JS, no dependencies).
   Sends data to the Supabase "intake" Edge Function. Files go straight to private storage
   through one-time signed upload links. No secrets live in this file. */
(function () {
  'use strict';
  var CFG = window.PW || {}, MB = 1048576, MAX_FILES = 12;
  var EXT = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', mp4: 'video/mp4', webm: 'video/webm' };
  var MEDIA = ['product_image', 'facility_image', 'product_video'];
  var DOC_OK = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', EXT.docx, 'application/vnd.ms-excel', EXT.xlsx];
  var MEDIA_OK = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
  var COUNTRIES = 'Afghanistan,Albania,Algeria,Argentina,Australia,Austria,Bahrain,Bangladesh,Belgium,Bhutan,Brazil,Brunei,Bulgaria,Cambodia,Canada,Chile,China,Colombia,Croatia,Cyprus,Czechia,Denmark,Egypt,Estonia,Ethiopia,Finland,France,Germany,Ghana,Greece,Hong Kong,Hungary,India,Indonesia,Iran,Iraq,Ireland,Israel,Italy,Japan,Jordan,Kazakhstan,Kenya,Kuwait,Laos,Latvia,Lebanon,Lithuania,Luxembourg,Malaysia,Maldives,Malta,Mauritius,Mexico,Morocco,Myanmar,Nepal,Netherlands,New Zealand,Nigeria,Norway,Oman,Pakistan,Peru,Philippines,Poland,Portugal,Qatar,Romania,Russia,Saudi Arabia,Singapore,Slovakia,Slovenia,South Africa,South Korea,Spain,Sri Lanka,Sweden,Switzerland,Taiwan,Tanzania,Thailand,Turkey,Uganda,Ukraine,United Arab Emirates,United Kingdom,United States,Uzbekistan,Vietnam'.split(',');

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function fmt(b) { return b > MB ? (b / MB).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function mimeOf(f) { var m = f.type; if (!m) { var e = (f.name.split('.').pop() || '').toLowerCase(); m = EXT[e] || ''; } return m; }

  document.querySelectorAll('datalist#countries').forEach(function (d) { COUNTRIES.forEach(function (c) { var o = el('option'); o.value = c; d.appendChild(o); }); });

  function init(form) {
    var kind = form.getAttribute('data-form'), btn = form.querySelector('button[type=submit]'), alertBox = form.querySelector('.alert'),
      idem = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
      token = '', widget = null, chosen = {};

    // ---- opportunity reference from link (?opp=OPP-2026-000001)
    var oppField = form.querySelector('[name=opportunity_ref]');
    if (oppField) {
      var q = (new URLSearchParams(location.search).get('opp') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);
      if (q) { oppField.value = q; var tag = document.getElementById('oppTag'); if (tag) tag.textContent = q; }
    }

    // ---- prefill product name from a catalogue link (?product=...), text only
    var pf = form.querySelector('[name=product_name]');
    if (pf && !pf.value) { var pq = (new URLSearchParams(location.search).get('product') || '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, 120); if (pq) pf.value = pq; }

    // ---- Turnstile
    function mountTS() {
      var box = form.querySelector('.ts-box'); if (!box || !CFG.turnstileSiteKey) return;
      function go() { widget = window.turnstile.render(box, { sitekey: CFG.turnstileSiteKey, callback: function (t) { token = t; }, 'expired-callback': function () { token = ''; }, 'error-callback': function () { token = ''; } }); }
      if (window.turnstile) return go();
      var s = el('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = go; document.head.appendChild(s);
    }
    mountTS();

    // ---- file inputs
    form.querySelectorAll('input[type=file]').forEach(function (inp) {
      var list = inp.parentNode.querySelector('ul') || inp.parentNode.appendChild(el('ul'));
      inp.addEventListener('change', function () {
        var cat = inp.getAttribute('data-category'), rows = []; list.innerHTML = ''; chosen[cat] = [];
        Array.prototype.forEach.call(inp.files, function (f) {
          var type = mimeOf(f), media = MEDIA.indexOf(cat) > -1, ok = (media ? MEDIA_OK : DOC_OK).indexOf(type) > -1, lim = type.indexOf('video/') === 0 ? 50 * MB : 25 * MB, msg = '';
          if (!ok) msg = 'File type not accepted'; else if (f.size > lim) msg = 'Too large (max ' + (lim / MB) + ' MB)';
          var li = el('li', msg ? 'x' : '', f.name + ' (' + fmt(f.size) + ')'); if (msg) li.appendChild(el('b', '', msg)); list.appendChild(li);
          if (!msg) chosen[cat].push({ file: new File([f], f.name, { type: type }), name: f.name, type: type, size: f.size, category: cat });
        });
      });
    });

    function total() { var n = 0; for (var k in chosen) n += chosen[k].length; return n; }
    function showAlert(t) { alertBox.textContent = t; alertBox.classList.add('on'); alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    function clearErrs() { alertBox.classList.remove('on'); form.querySelectorAll('small.err').forEach(function (s) { s.remove(); }); form.querySelectorAll('.bad').forEach(function (b) { b.classList.remove('bad'); }); }
    function fieldErr(name, msg) {
      var f = form.querySelector('[name="' + name + '"]'); if (!f) return;
      f.classList.add('bad'); f.setAttribute('aria-invalid', 'true'); var host = f.closest('label') || f.parentNode; host.appendChild(el('small', 'err', msg));
    }

    function collect() {
      var d = {}, fd = new FormData(form);
      form.querySelectorAll('[name]').forEach(function (f) {
        var n = f.name; if (!n || n === 'hp' || n === 'consent' || f.type === 'file' || n.indexOf('cf-turnstile') === 0 || n in d) return;
        if (f.type === 'checkbox') { var vals = fd.getAll(n); d[n] = vals; return; }
        var v = String(fd.get(n) || '').trim();
        if (f.hasAttribute('data-arr')) d[n] = v ? v.split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean) : [];
        else if (f.hasAttribute('data-upper')) d[n] = v.toUpperCase(); else d[n] = v;
      });
      return d;
    }

    function clientValidate(d) {
      var bad = 0;
      form.querySelectorAll('[required]').forEach(function (f) {
        if (f.type === 'checkbox') { if (!f.checked) { fieldErr(f.name, 'Please tick to continue.'); bad++; } return; }
        if (!String(f.value || '').trim()) { fieldErr(f.name, 'This field is required.'); bad++; }
      });
      form.querySelectorAll('input[type=email]').forEach(function (f) { if (f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim())) { fieldErr(f.name, 'Enter a valid email address.'); bad++; } });
      form.querySelectorAll('input[type=tel]').forEach(function (f) { var n = f.value.replace(/\D/g, '').length; if (f.value && (n < 6 || n > 15)) { fieldErr(f.name, 'Enter a valid phone number with country code.'); bad++; } });
      if (total() > MAX_FILES) { showAlert('You can upload up to ' + MAX_FILES + ' files.'); bad++; }
      form.querySelectorAll('.fl li.x').forEach(function () { bad++; });
      return bad === 0;
    }

    function upload(u, item, bar) {
      return new Promise(function (res, rej) {
        var x = new XMLHttpRequest(), fd = new FormData(); fd.append('cacheControl', '3600'); fd.append('', item.file);
        x.open('PUT', u.signedUrl); x.upload.onprogress = function (e) { if (e.lengthComputable && bar) bar.style.width = Math.round(e.loaded / e.total * 100) + '%'; };
        x.onload = function () { x.status >= 200 && x.status < 300 ? res() : rej(new Error('HTTP ' + x.status)); }; x.onerror = function () { rej(new Error('network')); }; x.send(fd);
      });
    }

    function done(ref, failed, uploads, items) {
      var box = el('div', 'done'); box.setAttribute('role', 'status'); box.appendChild(el('h2', '', 'Thank you. Your submission has been received.'));
      box.appendChild(el('p', '', 'Your reference number is:')); box.appendChild(el('div', 'ref', ref));
      box.appendChild(el('p', '', 'Please keep it for your records. A confirmation email is on its way (check spam if you do not see it). Your information is stored privately and is never shown publicly.'));
      if (failed.length) {
        var w = el('div', 'warn'); w.appendChild(el('b', '', failed.length + ' file(s) could not be uploaded: ' + failed.map(function (i) { return i.name; }).join(', ') + '.'));
        w.appendChild(el('p', '', 'Your form is safe. Tap retry, or email the files to info@portwiseventures.com quoting ' + ref + '.'));
        var r = el('button', 'btn', 'Retry upload'); r.type = 'button';
        r.onclick = function () { r.disabled = true; r.textContent = 'Uploading...'; var still = []; var chain = Promise.resolve();
          failed.forEach(function (it) { chain = chain.then(function () { return upload(it.u, it.item).catch(function () { still.push(it); }); }); });
          chain.then(function () { box.remove(); done(ref, still, uploads, items); }); };
        w.appendChild(r); box.appendChild(w);
      }
      var a = el('a', 'btn', 'Back to home'); a.href = 'index.html'; box.appendChild(a);
      form.style.display = 'none'; form.parentNode.insertBefore(box, form); box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault(); clearErrs();
      if (!navigator.onLine) return showAlert('You appear to be offline. Please check your connection and try again.');
      var data = collect(); if (!clientValidate(data)) { var f = form.querySelector('.bad'); if (f) f.focus(); return; }
      if (!token) return showAlert('Please complete the spam check (the box above the Submit button) and try again.');
      var files = []; for (var k in chosen) files = files.concat(chosen[k]);
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Submitting...';
      var body = { form: kind, data: data, turnstileToken: token, idempotencyKey: idem, hp: (form.querySelector('[name=hp]') || {}).value || '',
        files: files.map(function (f) { return { name: f.name, type: f.type, size: f.size, category: f.category }; }) };
      fetch(CFG.intakeUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (o) {
          if (o.s === 200 && o.j.ok) {
            var ups = o.j.uploads || [], failed = [], bar = form.querySelector('.prog i'), chain = Promise.resolve();
            btn.textContent = ups.length ? 'Uploading files...' : 'Done'; if (ups.length) { var pb = form.querySelector('.prog'); if (pb) pb.classList.add('on'); }
            ups.forEach(function (u, i) { chain = chain.then(function () { var it = files[i] && files[i].name === u.name ? files[i] : files.filter(function (f) { return f.name === u.name; })[0];
              return upload(u, it, bar).catch(function () { failed.push({ name: u.name, u: u, item: it }); }); }); });
            return chain.then(function () { done(o.j.reference, failed, ups, files); });
          }
          if (o.s === 422 && o.j.fields) { Object.keys(o.j.fields).forEach(function (n) { fieldErr(n, o.j.fields[n]); }); showAlert(o.j.error || 'Please correct the highlighted fields.'); }
          else showAlert(o.j.error || 'Something went wrong. Please try again.');
          if (window.turnstile && widget !== null) { window.turnstile.reset(widget); token = ''; }
        })
        .catch(function () { showAlert('We could not reach the server. Please check your connection and try again.'); if (window.turnstile && widget !== null) { window.turnstile.reset(widget); token = ''; } })
        .then(function () { if (form.style.display !== 'none') { btn.disabled = false; btn.textContent = label; } });
    });
  }
  document.querySelectorAll('form.nf[data-form]').forEach(init);
})();
