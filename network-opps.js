/* Portwise Ventures: Sourcing Opportunities (public, read-only).
   Reads ONLY the limited view v_public_opportunities with the public publishable key.
   All data is inserted with textContent (no HTML injection). */
(function () {
  'use strict';
  var C = window.PW || {}, PAGE = 9, all = [], shown = PAGE;
  var LABEL = { open: 'Open', urgent: 'Urgent', responses_received: 'Supplier Responses Received', under_review: 'Under Review', closed: 'Closed', fulfilled: 'Fulfilled' };
  var ACCEPT = ['open', 'urgent', 'responses_received'];
  function $(id) { return document.getElementById(id); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function date(v) { if (!v) return ''; var d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function name(o) { return o.product_name || o.title || 'Sourcing requirement'; }
  function qty(o) { return o.quantity != null ? [Number(o.quantity).toLocaleString('en-GB'), o.quantity_unit || ''].join(' ').trim() : ''; }
  function dest(o) { return [o.destination_location, o.destination_country].filter(Boolean).join(', '); }
  function status(o) {
    var s = o.display_status || 'open';
    if (ACCEPT.indexOf(s) > -1 && o.closing_date && new Date(o.closing_date) < new Date()) return 'closed';
    if (s === 'open' && o.is_urgent) return 'urgent';
    return s;
  }
  function imgUrl(p) {
    if (!p || !/^[A-Za-z0-9_\-./]+$/.test(p) || p.indexOf('..') > -1) return '';
    return C.supabaseUrl + '/storage/v1/object/public/portwise-public-assets/' + p.split('/').map(encodeURIComponent).join('/');
  }
  function thumb(o, cls) {
    var d = el('div', cls || 'oi'), u = imgUrl(o.image_path);
    if (u) { var i = el('img'); i.src = u; i.alt = name(o); i.loading = 'lazy'; i.onerror = function () { i.remove(); d.textContent = name(o).charAt(0).toUpperCase(); }; d.appendChild(i); }
    else d.textContent = name(o).charAt(0).toUpperCase();
    return d;
  }
  function badges(o) { var w = el('div'), s = status(o); if (o.is_featured) w.appendChild(el('span', 'sb feat', 'Featured')); w.appendChild(el('span', 'sb ' + s, LABEL[s] || s)); return w; }
  function fetchAll() {
    if (!C.anonKey) return Promise.reject(new Error('not configured'));
    return fetch(C.supabaseUrl + '/rest/v1/v_public_opportunities?select=*&order=is_featured.desc,closing_date.asc.nullslast&limit=300', { headers: { apikey: C.anonKey, Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function respondHref(o) { return 'supplier-response.html?opp=' + encodeURIComponent(o.reference_number); }
  function card(o) {
    var a = el('article', 'oc'), b = el('div', 'ob'), s = status(o);
    a.appendChild(thumb(o)); b.appendChild(badges(o)); b.appendChild(el('h3', '', name(o))); b.appendChild(el('div', 'oid', 'ID: ' + o.reference_number));
    var dl = el('dl'); [['Quantity', qty(o)], ['Destination', dest(o)], ['Category', o.product_category], ['Closing date', date(o.closing_date)]].forEach(function (r) { if (r[1]) { dl.appendChild(el('dt', '', r[0])); dl.appendChild(el('dd', '', r[1])); } });
    b.appendChild(dl); var act = el('div', 'oa'), v = el('a', 'btn', 'View Details'); v.href = 'sourcing-opportunity.html?id=' + encodeURIComponent(o.reference_number); act.appendChild(v);
    if (ACCEPT.indexOf(s) > -1) { var r = el('a', 'btn', 'Submit Supplier Response'); r.href = respondHref(o); act.appendChild(r); }
    b.appendChild(act); a.appendChild(b); return a;
  }
  function empty(box, msg) {
    box.innerHTML = ''; var e = el('div', 'opempty'); e.appendChild(el('h3', '', msg));
    e.appendChild(el('p', '', 'New requirements are published here as they become available. You can also tell us what you need to source.'));
    [['request-a-product.html', 'Request a Product'], ['supplier-registration.html', 'Register as a Supplier']].forEach(function (l) { var a = el('a', 'btn', l[1]); a.href = l[0]; e.appendChild(a); }); box.appendChild(e);
  }

  // ---------- listing page
  function list() {
    var grid = $('opGrid'); if (!grid) return;
    function fill(sel, vals) { vals.filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort().forEach(function (v) { var o = el('option', '', v); o.value = v; sel.appendChild(o); }); }
    function apply(reset) {
      if (reset) shown = PAGE;
      var q = $('opSearch').value.trim().toLowerCase(), c = $('opCat').value, k = $('opCountry').value, st = $('opStatus').value;
      var rows = all.filter(function (o) {
        var hay = [name(o), o.reference_number, o.product_category, o.destination_country, o.summary].join(' ').toLowerCase();
        return (!q || hay.indexOf(q) > -1) && (!c || o.product_category === c) && (!k || o.destination_country === k) && (!st || status(o) === st);
      });
      grid.innerHTML = '';
      if (!all.length) { empty(grid, 'No sourcing opportunities are published at the moment.'); $('opMore').style.display = 'none'; $('opCount').textContent = ''; return; }
      if (!rows.length) { grid.appendChild(el('p', 'opmeta', 'No opportunities match your filters.')); $('opMore').style.display = 'none'; $('opCount').textContent = ''; return; }
      rows.slice(0, shown).forEach(function (o) { grid.appendChild(card(o)); });
      $('opCount').textContent = 'Showing ' + Math.min(shown, rows.length) + ' of ' + rows.length + ' opportunities';
      $('opMore').style.display = rows.length > shown ? '' : 'none';
    }
    $('opMore').onclick = function () { shown += PAGE; apply(false); };
    ['opSearch', 'opCat', 'opCountry', 'opStatus'].forEach(function (id) { $(id).addEventListener('input', function () { apply(true); }); });
    $('opReset').onclick = function () { ['opSearch', 'opCat', 'opCountry', 'opStatus'].forEach(function (id) { $(id).value = ''; }); apply(true); };
    fetchAll().then(function (d) {
      all = d; fill($('opCat'), d.map(function (o) { return o.product_category; })); fill($('opCountry'), d.map(function (o) { return o.destination_country; }));
      var seen = {}; d.forEach(function (o) { seen[status(o)] = 1; }); Object.keys(LABEL).forEach(function (k) { if (seen[k]) { var o = el('option', '', LABEL[k]); o.value = k; $('opStatus').appendChild(o); } });
      apply(true);
    }).catch(function () { grid.innerHTML = ''; grid.appendChild(el('p', 'opempty', 'We could not load sourcing opportunities right now. Please try again shortly or contact us.')); });
  }

  // ---------- detail page
  function detail() {
    var box = $('opDetail'); if (!box) return;
    var id = (new URLSearchParams(location.search).get('id') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);
    if (!id) return empty(box, 'Opportunity not found.');
    fetch(C.supabaseUrl + '/rest/v1/v_public_opportunities?select=*&reference_number=eq.' + encodeURIComponent(id) + '&limit=1', { headers: { apikey: C.anonKey || '', Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!d.length) return empty(box, 'This opportunity is not available.');
        var o = d[0], s = status(o); document.title = name(o) + ' | Sourcing Opportunity | Portwise Ventures'; box.innerHTML = '';
        var top = el('div', 'top'); top.appendChild(thumb(o)); var tb = el('div', 'tb'); tb.appendChild(badges(o)); tb.appendChild(el('h2', '', name(o))); tb.appendChild(el('div', 'oid', 'Opportunity ID: ' + o.reference_number));
        if (o.summary) tb.appendChild(el('p', '', o.summary));
        if (ACCEPT.indexOf(s) > -1) { var r = el('a', 'btn', 'Submit Supplier Response'); r.href = respondHref(o); tb.appendChild(r); } else tb.appendChild(el('p', 'oid', 'This opportunity is not currently accepting responses.'));
        top.appendChild(tb); box.appendChild(top);
        var price = o.target_price != null ? [Number(o.target_price).toLocaleString('en-GB'), o.target_currency || ''].join(' ').trim() : '';
        var secs = [['Basic information', [['Opportunity ID', o.reference_number], ['Product name', name(o)], ['Product category', o.product_category], ['Required quantity', qty(o)], ['Destination country', o.destination_country], ['Destination location', o.destination_location]]],
          ['Product specifications', [['Size', o.size], ['Grade', o.grade], ['Variety', o.variety], ['Quality requirements', o.quality_requirements], ['Product condition', o.product_condition], ['Origin preferences', o.origin_preferences], ['Additional specifications', o.additional_specifications]]],
          ['Packaging requirements', [['Packaging type', o.packaging_type], ['Packaging material', o.packaging_material], ['Packaging size', o.packaging_size], ['Labeling requirements', o.labeling_requirements], ['Private-label requirements', o.private_label_requirements]]],
          ['Export requirements', [['Required certifications', (o.required_certifications || []).join(', ')], ['Required documentation', o.required_documentation], ['Shipping requirements', o.shipping_requirements], ['Incoterms', o.preferred_incoterm], ['Delivery timeline', o.delivery_timeline]]],
          ['Commercial information', [['Target price', price], ['Pricing basis', o.pricing_basis], ['Additional commercial requirements', o.additional_commercial_requirements]]],
          ['Opportunity management', [['Opening date', date(o.opening_date)], ['Closing date', date(o.closing_date)], ['Status', LABEL[s] || s]]]];
        secs.forEach(function (sec) {
          var rows = sec[1].filter(function (r) { return r[1]; }); if (!rows.length) return;
          var w = el('section', 'sec'); w.appendChild(el('h3', '', sec[0])); var dl = el('dl', 'dl'); rows.forEach(function (r) { dl.appendChild(el('dt', '', r[0])); dl.appendChild(el('dd', '', r[1])); }); w.appendChild(dl); box.appendChild(w);
        });
      }).catch(function () { empty(box, 'We could not load this opportunity right now.'); });
  }

  // ---------- homepage preview (real published opportunities only)
  function home() {
    var box = $('homeOpps'); if (!box) return;
    fetchAll().then(function (d) {
      var open = d.filter(function (o) { return ACCEPT.indexOf(status(o)) > -1; }).slice(0, 3); box.innerHTML = '';
      if (!open.length) { box.appendChild(el('p', 'opmeta', 'No sourcing opportunities are published right now. New requirements appear here as they are released.')); return; }
      open.forEach(function (o) { box.appendChild(card(o)); });
    }).catch(function () { box.innerHTML = ''; box.appendChild(el('p', 'opmeta', 'Sourcing opportunities are temporarily unavailable.')); });
  }
  list(); detail(); home();
})();
