/* Portwise staff dashboard: modules (buyers, suppliers, opportunities, responses, requests, products, documents, activity, settings). */
(function () {
  'use strict';
  var D = window.PWD, h = D.h, api = D.api, toast = D.toast, human = D.human, when = D.when, badge = D.badge, MODS = D.MODS, C = window.PW;
  var PUB = C.supabaseUrl + '/storage/v1/object/public/portwise-public-assets/';
  function pj(arr) { var c = (arr || []).filter(function (x) { return x.is_primary; })[0] || (arr || [])[0]; return c ? c.full_name + ' · ' + c.email : ''; }
  function st(list) { return list.map(function (s) { return [s[0], s[1]]; }); }
  function qty(r) { return r.quantity != null ? Number(r.quantity).toLocaleString('en-GB') + ' ' + (r.quantity_unit || '') : ''; }
  function patch(table, id, body, msg, reload) { return api('/rest/v1/' + table + '?id=eq.' + id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: body }).then(function () { toast(msg || 'Saved.'); if (reload) reload(); }).catch(function (e) { toast(e.message, true); }); }

  // ---------- Buyers / Suppliers
  MODS.buyers = { title: 'Buyers', table: 'buyers', select: '*,buyer_contacts(*)', statusCol: 'registration_status', reviewed: true, order: 'created_at.desc', search: ['organization_name', 'country', 'reference_number', 'city'], placeholder: 'Search company, country or reference', contacts: 'buyer_contacts', skip: ['buyer_contacts', 'admin_review_notes'],
    statuses: [['new_registration', 'New Registration'], ['pending_review', 'Pending Review'], ['verified', 'Verified'], ['active_buyer', 'Active Buyer'], ['inactive', 'Inactive'], ['rejected', 'Rejected'], ['archived', 'Archived']],
    cols: [['Ref', function (r) { return r.reference_number; }], ['Company', function (r) { return r.organization_name; }], ['Country', function (r) { return r.country; }], ['Contact', function (r) { return pj(r.buyer_contacts); }], ['Status', function (r) { return badge(r.registration_status); }], ['Received', function (r) { return when(r.created_at, 1); }]],
    recordTitle: function (r) { return r.organization_name; } };
  MODS.suppliers = { title: 'Suppliers', table: 'suppliers', select: '*,supplier_contacts(*)', statusCol: 'approval_status', reviewed: true, order: 'created_at.desc', search: ['company_name', 'country', 'reference_number', 'city'], placeholder: 'Search company, country or reference', contacts: 'supplier_contacts', skip: ['supplier_contacts', 'admin_review_notes'],
    statuses: [['new_registration', 'New Registration'], ['pending_review', 'Pending Review'], ['documents_received', 'Documents Received'], ['verification_in_progress', 'Verification in Progress'], ['verified', 'Verified'], ['approved', 'Approved Supplier'], ['rejected', 'Rejected'], ['suspended', 'Suspended'], ['archived', 'Archived']],
    confirm: { approved: 'Approve this supplier? Approved suppliers can respond to published sourcing opportunities (while that rule is on in Settings).' },
    cols: [['Ref', function (r) { return r.reference_number; }], ['Company', function (r) { return r.company_name; }], ['Type', function (r) { return r.supplier_type ? human(r.supplier_type) : ''; }], ['Country', function (r) { return r.country; }], ['Contact', function (r) { return pj(r.supplier_contacts); }], ['Status', function (r) { return badge(r.approval_status, r.approval_status === 'approved' ? 'Approved Supplier' : null); }], ['Received', function (r) { return when(r.created_at, 1); }]],
    recordTitle: function (r) { return r.company_name; } };

  // ---------- Products
  MODS.products = { title: 'Product Submissions', table: 'product_submissions', statusCol: 'product_status', order: 'created_at.desc', search: ['reference_number', 'product_name', 'company_name', 'supplier_country'], placeholder: 'Search product, supplier or reference',
    statuses: [['new_submission', 'New Submission'], ['under_review', 'Under Review'], ['additional_information_requested', 'Additional Information Requested'], ['shortlisted', 'Shortlisted'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['published', 'Published'], ['archived', 'Archived']],
    confirm: { published: 'Set status to Published? A product appears on the public website only when you also use "List in public catalogue" below.' },
    cols: [['Ref', function (r) { return r.reference_number; }], ['Product', function (r) { return r.product_name; }], ['Supplier', function (r) { return r.company_name; }], ['Country', function (r) { return r.supplier_country; }], ['Status', function (r) { return badge(r.product_status); }], ['Received', function (r) { return when(r.created_at, 1); }]],
    recordTitle: function (r) { return r.product_name; } };

  MODS.products.actions = function (row, reload) {
    var PUBB = 'portwise-public-assets', body = h('div'), box = D.section('Public catalogue listing', body), approved = row.product_status === 'approved' || row.product_status === 'published';
    body.appendChild(h('p', { class: 'muted', text: 'If listed, the public sees ONLY: the name and summary you write here, category, origin, grade, packaging and the chosen image. Supplier name, contact details and prices are never shown.' }));
    var nm = h('input', { maxlength: 120, value: row.catalogue_name || row.product_name || '', 'aria-label': 'Catalogue name' }), sm = h('textarea', { maxlength: 600, 'aria-label': 'Catalogue summary' }); sm.value = row.catalogue_summary || '';
    body.appendChild(h('label', {}, 'Catalogue name', nm)); body.appendChild(h('label', {}, 'Catalogue summary (write it yourself, 1–3 sentences)', sm));
    if (row.catalogue_image_path && /^[A-Za-z0-9_\-./]+$/.test(row.catalogue_image_path)) body.appendChild(h('img', { src: C.supabaseUrl + '/storage/v1/object/public/' + PUBB + '/' + row.catalogue_image_path.split('/').map(encodeURIComponent).join('/'), alt: 'Catalogue image', width: 200 }));
    var imgs = h('div', {}); body.appendChild(h('h2', { text: 'Catalogue image' })); body.appendChild(imgs);
    function setImage(blobPromise) { return blobPromise.then(function (b) { return resize(b, 1200, 0.82); }).then(function (jb) { var path = 'catalogue/' + row.id + '/' + crypto.randomUUID() + '.jpg'; return D.upload(PUBB, path, jb).then(function () { return patch('product_submissions', row.id, { catalogue_image_path: path }, 'Image saved.', reload); }); }).catch(function (e) { toast(e.message, true); }); }
    api('/rest/v1/business_documents?entity_type=eq.product&entity_id=eq.' + row.id + '&document_category=eq.product_image&deleted_at=is.null&select=*').then(function (ds) {
      if (!ds.length) imgs.appendChild(h('p', { class: 'muted', text: 'No product photos were submitted. Upload one below.' }));
      ds.filter(function (d) { return /^image\//.test(d.mime_type || ''); }).forEach(function (d) { imgs.appendChild(h('div', { class: 'item acts' }, h('div', { class: 'grow', text: d.original_filename }), h('button', { class: 'btn sec sm', text: 'Use this image', onclick: function () { setImage(D.sign(d.storage_bucket, d.storage_path).then(function (u) { return fetch(u); }).then(function (r) { if (!r.ok) throw new Error('Could not read the image.'); return r.blob(); })); } }))); });
    }).catch(function () { });
    var up = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Upload catalogue image' });
    body.appendChild(h('div', { class: 'acts' }, up, h('button', { class: 'btn sec sm', text: 'Upload image', onclick: function () { var f = up.files[0]; if (!f || !/^image\/(jpeg|png|webp)$/.test(f.type)) return toast('Choose a JPG, PNG or WebP image.', true); setImage(Promise.resolve(f)); } })));
    var acts = h('div', { class: 'acts' });
    acts.appendChild(h('button', { class: 'btn sec', text: 'Save text', onclick: function () { patch('product_submissions', row.id, { catalogue_name: nm.value.trim() || null, catalogue_summary: sm.value.trim() || null }, 'Saved.', reload); } }));
    if (!row.is_in_catalogue) acts.appendChild(h('button', { class: 'btn gold', text: 'List in public catalogue', onclick: function () {
      if (!approved) return toast('Set the status to Approved first.', true); if (!nm.value.trim() || !sm.value.trim()) return toast('Add a catalogue name and summary first.', true);
      if (!confirm('List this product on the public website now?')) return; patch('product_submissions', row.id, { catalogue_name: nm.value.trim(), catalogue_summary: sm.value.trim(), is_in_catalogue: true, product_status: 'published' }, 'Listed in the public catalogue.', reload); } }));
    else acts.appendChild(h('button', { class: 'btn warn', text: 'Remove from public catalogue', onclick: function () { if (!confirm('Remove this product from the public website?')) return; patch('product_submissions', row.id, { is_in_catalogue: false, product_status: 'approved' }, 'Removed from the catalogue.', reload); } }));
    body.appendChild(h('p', {}, row.is_in_catalogue ? badge('published', 'Listed publicly') : badge('archived', approved ? 'Not listed' : 'Not eligible: approve first'))); body.appendChild(acts);
    return box;
  };

  // ---------- Responses
  MODS.responses = { title: 'Supplier Responses', table: 'opportunity_responses', select: '*,sourcing_opportunities(reference_number,title,product_name)', statusCol: 'response_status', order: 'created_at.desc', search: ['reference_number', 'company_name', 'supplier_name', 'product_name'], placeholder: 'Search supplier, product or reference', skip: ['sourcing_opportunities'],
    statuses: [['new_response', 'New Response'], ['under_review', 'Under Review'], ['shortlisted', 'Shortlisted'], ['sample_requested', 'Sample Requested'], ['sample_received', 'Sample Received'], ['negotiation', 'Negotiation'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['archived', 'Archived']],
    cols: [['Ref', function (r) { return r.reference_number; }], ['Opportunity', function (r) { return r.sourcing_opportunities ? r.sourcing_opportunities.reference_number : ''; }], ['Supplier', function (r) { return r.company_name; }], ['Product', function (r) { return r.product_name; }], ['Price', function (r) { return r.proposed_price != null ? Number(r.proposed_price).toLocaleString('en-GB') + ' ' + (r.currency || '') : ''; }], ['Status', function (r) { return badge(r.response_status); }], ['Received', function (r) { return when(r.created_at, 1); }]],
    recordTitle: function (r) { return (r.company_name || 'Response') + ' — ' + (r.product_name || ''); } };

  // ---------- Buyer requests (+ create opportunity)
  MODS.requests = { title: 'Buyer Requests', table: 'buyer_requests', statusCol: 'request_status', order: 'created_at.desc', search: ['reference_number', 'company_name', 'product_name', 'destination_country'], placeholder: 'Search company, product or reference',
    statuses: [['new_request', 'New Request'], ['reviewing', 'Reviewing'], ['sourcing', 'Sourcing'], ['supplier_identified', 'Supplier Identified'], ['quotation_in_progress', 'Quotation in Progress'], ['negotiation', 'Negotiation'], ['fulfilled', 'Fulfilled'], ['closed', 'Closed'], ['archived', 'Archived']],
    cols: [['Ref', function (r) { return r.reference_number; }], ['Buyer', function (r) { return r.company_name; }], ['Product', function (r) { return r.product_name; }], ['Quantity', qty], ['Destination', function (r) { return r.destination_country; }], ['Status', function (r) { return badge(r.request_status); }], ['Received', function (r) { return when(r.created_at, 1); }]],
    recordTitle: function (r) { return (r.product_name || 'Request') + ' — ' + (r.company_name || ''); },
    actions: function (row) {
      if (row.converted_opportunity_id) return D.section('Sourcing opportunity', h('div', { class: 'acts' }, h('span', { text: 'A sourcing opportunity was created from this request.' }), h('button', { class: 'btn sec sm', text: 'Open it', onclick: function () { D.openRecord('opportunities', row.converted_opportunity_id); } })));
      return D.section('Sourcing opportunity', h('div', { class: 'acts' }, h('button', { class: 'btn gold', text: 'Create opportunity from this request', onclick: function () {
        var cert = (row.certifications || '').split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
        oppForm(null, { title: row.product_name, product_name: row.product_name, product_category: row.product_category, quantity: row.quantity, quantity_unit: row.quantity_unit, destination_country: row.destination_country, destination_location: row.destination_location, additional_specifications: row.product_specifications, origin_preferences: row.preferred_origin, packaging_type: row.packaging_requirements, required_certifications: cert, shipping_requirements: row.shipping_requirements, delivery_timeline: row.delivery_timeline, target_price: row.target_budget, target_currency: row.target_currency, source_request_id: row.id }, row);
      } })));
    } };

  // ---------- Opportunities
  var OF = [['title', 'Title *'], ['product_name', 'Product name'], ['product_category', 'Product category'], ['summary', 'Public summary', 'area'], ['quantity', 'Required quantity', 'num'], ['quantity_unit', 'Measurement unit'], ['destination_country', 'Destination country'], ['destination_location', 'Destination location'],
    ['size', 'Size'], ['grade', 'Grade'], ['variety', 'Variety'], ['quality_requirements', 'Quality requirements', 'area'], ['product_condition', 'Product condition'], ['origin_preferences', 'Origin preferences'], ['additional_specifications', 'Additional specifications', 'area'],
    ['packaging_type', 'Packaging type'], ['packaging_material', 'Packaging material'], ['packaging_size', 'Packaging size'], ['labeling_requirements', 'Labeling requirements', 'area'], ['private_label_requirements', 'Private-label requirements', 'area'],
    ['required_certifications', 'Required certifications (comma separated)', 'arr'], ['required_documentation', 'Required documentation', 'area'], ['shipping_requirements', 'Shipping requirements', 'area'], ['preferred_incoterm', 'Incoterm'], ['delivery_timeline', 'Delivery timeline'],
    ['target_price', 'Target price (optional)', 'num'], ['target_currency', 'Currency (3 letters)'], ['pricing_basis', 'Pricing basis'], ['additional_commercial_requirements', 'Additional commercial requirements', 'area'], ['opening_date', 'Opening date', 'date'], ['response_deadline', 'Closing date and time', 'dt']];
  function toLocal(v) { if (!v) return ''; var d = new Date(v); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  function oppForm(row, pre, req) {
    var body = D.$('dBody'), v = row || pre || {}; D.$('drawer').hidden = false; body.innerHTML = ''; var inputs = {};
    body.appendChild(h('h1', { text: row ? 'Edit opportunity' : 'New sourcing opportunity' }));
    body.appendChild(h('p', { class: 'muted', text: 'Everything on this form becomes PUBLIC when the opportunity is published. Do not enter buyer names, contacts or internal information.' }));
    if (req) body.appendChild(h('p', { class: 'muted', text: 'Pre-filled from request ' + req.reference_number + '. Review before publishing. It is saved as a draft.' }));
    var grid = h('div', { class: 'row2' });
    OF.forEach(function (f) {
      var val = v[f[0]], t = f[2], el;
      if (t === 'area') el = h('textarea', { maxlength: 4000 }); else el = h('input', { type: t === 'num' ? 'number' : t === 'date' ? 'date' : t === 'dt' ? 'datetime-local' : 'text', step: t === 'num' ? 'any' : null, min: t === 'num' ? '0' : null, maxlength: 300 });
      el.value = val == null ? '' : t === 'arr' ? (val || []).join(', ') : t === 'date' ? String(val).slice(0, 10) : t === 'dt' ? toLocal(val) : val; inputs[f[0]] = [el, t]; grid.appendChild(h('label', {}, f[1], el));
    });
    body.appendChild(h('div', { class: 'panel' }, grid));
    var err = h('div', { class: 'err', role: 'alert' }), save = h('button', { class: 'btn', text: row ? 'Save changes' : 'Create draft', onclick: function () {
      var out = {}; err.textContent = '';
      OF.forEach(function (f) { var el = inputs[f[0]][0], t = inputs[f[0]][1], x = el.value.trim(); out[f[0]] = x === '' ? (t === 'arr' ? [] : null) : t === 'num' ? Number(x) : t === 'arr' ? x.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : t === 'date' ? new Date(x + 'T00:00:00Z').toISOString() : t === 'dt' ? new Date(x).toISOString() : x; });
      if (!out.title) return err.textContent = 'Title is required.';
      if (out.quantity != null && !(out.quantity > 0)) return err.textContent = 'Quantity must be greater than 0.';
      if (out.target_price != null && !(out.target_price >= 0)) return err.textContent = 'Target price cannot be negative.';
      if (out.target_currency) { out.target_currency = out.target_currency.toUpperCase(); if (!/^[A-Z]{3}$/.test(out.target_currency)) return err.textContent = 'Currency must be 3 letters, e.g. USD.'; }
      save.disabled = true;
      if (row) return patch('sourcing_opportunities', row.id, out, 'Opportunity saved.').then(function () { D.openRecord('opportunities', row.id); if (D.refreshList) D.refreshList(); });
      if (pre && pre.source_request_id) out.source_request_id = pre.source_request_id; out.created_by = D.S.user.id; out.opportunity_status = 'draft';
      api('/rest/v1/sourcing_opportunities', { method: 'POST', headers: { Prefer: 'return=representation' }, body: out }).then(function (r) {
        var id = r[0].id, done = function () { toast('Draft created: ' + r[0].reference_number); D.openRecord('opportunities', id); if (D.refreshList) D.refreshList(); };
        if (req) return api('/rest/v1/buyer_requests?id=eq.' + req.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { converted_opportunity_id: id, request_status: 'sourcing' } }).then(done); done();
      }).catch(function (e) { err.textContent = e.message; save.disabled = false; });
    } });
    body.appendChild(err); body.appendChild(h('div', { class: 'acts' }, save, h('button', { class: 'btn sec', text: 'Cancel', onclick: function () { if (row) D.openRecord('opportunities', row.id); else D.closeDrawer(); } })));
  }
  function compare(opp) {
    var body = D.$('dBody'); body.innerHTML = ''; body.appendChild(h('div', { class: 'acts' }, h('button', { class: 'btn sec sm', text: '← Back to opportunity', onclick: function () { D.openRecord('opportunities', opp.id); } }), h('h1', { text: 'Compare responses: ' + (opp.product_name || opp.title) })));
    body.appendChild(h('p', { class: 'muted', text: 'Private to Portwise staff. Lowest price in each currency is outlined in green.' }));
    api('/rest/v1/opportunity_responses?' + 'opportunity_id=eq.' + opp.id + '&order=created_at.asc&select=*').then(function (rs) {
      if (!rs.length) return body.appendChild(h('p', { class: 'panel muted', text: 'No responses received yet.' }));
      var min = {}; rs.forEach(function (r) { if (r.proposed_price != null && r.currency) min[r.currency] = Math.min(min[r.currency] == null ? Infinity : min[r.currency], Number(r.proposed_price)); });
      var rows = [['Supplier', function (r) { return r.company_name + (r.supplier_name ? ' (' + r.supplier_name + ')' : ''); }], ['Registered supplier', function (r) { return r.supplier_id ? 'Yes (linked)' : 'No'; }], ['Product', function (r) { return r.product_name; }], ['Origin', function (r) { return r.product_origin; }],
        ['Grade', function (r) { return r.product_grade; }], ['Available quantity', function (r) { return r.available_quantity != null ? r.available_quantity + ' ' + (r.quantity_unit || '') : ''; }], ['Price', function (r) { return r.proposed_price != null ? Number(r.proposed_price).toLocaleString('en-GB') + ' ' + (r.currency || '') + (r.price_basis ? ' (' + r.price_basis + ')' : '') : ''; }, 'price'],
        ['MOQ', function (r) { return r.minimum_order_quantity; }], ['Packaging', function (r) { return r.packaging_details; }], ['Lead time', function (r) { return r.lead_time_days != null ? r.lead_time_days + ' days' : ''; }], ['Available from', function (r) { return r.availability_date; }],
        ['Certifications', function (r) { return r.certifications; }], ['Specifications', function (r) { return r.product_specifications; }], ['Quality', function (r) { return r.quality_information; }], ['Export experience', function (r) { return r.export_experience; }], ['Received', function (r) { return when(r.created_at, 1); }]];
      var thead = h('tr', {}, h('th', { text: '' }), rs.map(function (r) { return h('th', {}, h('button', { class: 'btn sec sm', text: r.reference_number, onclick: function () { D.openRecord('responses', r.id); } })); }));
      var tb = h('tbody'); rows.forEach(function (R) { tb.appendChild(h('tr', {}, h('td', {}, h('b', { text: R[0] })), rs.map(function (r) { var v = R[1](r); var td = h('td', { text: v == null ? '' : String(v) }); if (R[2] === 'price' && r.proposed_price != null && min[r.currency] === Number(r.proposed_price) && rs.length > 1) td.className = 'best'; return td; }))); });
      var sr = h('tr', {}, h('td', {}, h('b', { text: 'Status' })), rs.map(function (r) { var sel = h('select', { 'aria-label': 'Status for ' + r.reference_number }, MODS.responses.statuses.map(function (s) { return h('option', { value: s[0], text: s[1], selected: r.response_status === s[0] }); }));
        sel.addEventListener('change', function () { patch('opportunity_responses', r.id, { response_status: sel.value }, 'Status updated.'); }); return h('td', {}, sel); })); tb.appendChild(sr);
      body.appendChild(h('div', { class: 'panel scroll' }, h('table', { class: 'cmp' }, h('thead', {}, thead), tb)));
    }).catch(function (e) { body.appendChild(h('p', { class: 'err', text: e.message })); });
  }
  MODS.opportunities = { title: 'Sourcing Opportunities', table: 'sourcing_opportunities', statusCol: 'opportunity_status', order: 'created_at.desc', search: ['reference_number', 'title', 'product_name', 'destination_country', 'product_category'], placeholder: 'Search product, ID or destination',
    statuses: [['draft', 'Draft'], ['published', 'Published'], ['closed', 'Closed'], ['archived', 'Archived']], noStatusEdit: true, onNew: function () { oppForm(null, {}); },
    cols: [['ID', function (r) { return r.reference_number; }], ['Product', function (r) { return r.product_name || r.title; }], ['Quantity', qty], ['Destination', function (r) { return r.destination_country; }], ['Closing', function (r) { return when(r.response_deadline, 1); }], ['Status', function (r) { return badge(r.opportunity_status); }], ['Shown as', function (r) { return r.opportunity_status === 'published' ? human(r.display_status) : ''; }]],
    recordTitle: function (r) { return r.product_name || r.title; }, skip: ['display_status', 'source_request_id'],
    actions: function (row, reload) {
      var s = row.opportunity_status, box = D.section('Publishing and management', h('div')), inner = box.lastChild, acts = h('div', { class: 'acts' });
      function set(p, msg, ask) { if (ask && !confirm(ask)) return; patch('sourcing_opportunities', row.id, p, msg, reload); }
      function missing() { var m = []; if (!(row.product_name || row.title)) m.push('product name'); if (!row.quantity) m.push('quantity'); if (!row.destination_country) m.push('destination country'); return m; }
      if (s === 'draft' || s === 'archived') acts.appendChild(h('button', { class: 'btn gold', text: 'Publish', onclick: function () {
        var m = missing(); if (m.length) return toast('Cannot publish. Missing: ' + m.join(', ') + '.', true);
        var ask = 'Publish this opportunity? Everything in it becomes visible on the public website.' + (row.response_deadline ? '' : '\n\nNo closing date is set.'); if (row.response_deadline && new Date(row.response_deadline) < new Date()) return toast('Closing date has passed. Edit it first.', true);
        set({ opportunity_status: 'published', published_at: row.published_at || new Date().toISOString(), opening_date: row.opening_date || new Date().toISOString(), display_status: /closed|fulfilled/.test(row.display_status) ? 'open' : row.display_status }, 'Published.', ask); } }));
      if (s === 'published') { acts.appendChild(h('button', { class: 'btn sec', text: 'Unpublish', onclick: function () { set({ opportunity_status: 'draft' }, 'Unpublished.', 'Remove from the public website?'); } }));
        acts.appendChild(h('button', { class: 'btn sec', text: 'Close', onclick: function () { set({ opportunity_status: 'closed' }, 'Closed.', 'Close this opportunity? It will show as Closed and stop accepting responses.'); } }));
        acts.appendChild(h('button', { class: 'btn sec', text: 'Mark fulfilled', onclick: function () { set({ opportunity_status: 'closed', display_status: 'fulfilled' }, 'Marked fulfilled.', 'Mark as fulfilled?'); } })); }
      if (s === 'closed') acts.appendChild(h('button', { class: 'btn', text: 'Reopen', onclick: function () { if (row.response_deadline && new Date(row.response_deadline) < new Date()) return toast('Closing date has passed. Edit it first.', true); set({ opportunity_status: 'published', display_status: 'open' }, 'Reopened.', 'Reopen this opportunity publicly?'); } }));
      if (s !== 'archived') acts.appendChild(h('button', { class: 'btn sec', text: 'Archive', onclick: function () { set({ opportunity_status: 'archived' }, 'Archived.', 'Archive this opportunity? It will be hidden from the public.'); } }));
      acts.appendChild(h('button', { class: 'btn sec', text: 'Edit details', onclick: function () { oppForm(row); } })); inner.appendChild(acts);
      if (s === 'published') { var ds = h('select', { 'aria-label': 'Public display status' }, [['open', 'Open'], ['urgent', 'Urgent'], ['responses_received', 'Supplier Responses Received'], ['under_review', 'Under Review']].map(function (o) { return h('option', { value: o[0], text: o[1], selected: row.display_status === o[0] }); }));
        inner.appendChild(h('div', { class: 'acts' }, h('label', {}, 'Shown publicly as', ds), h('button', { class: 'btn sm', text: 'Update', onclick: function () { set({ display_status: ds.value }, 'Display status updated.'); } }))); }
      function toggle(label, col) { var c = h('input', { type: 'checkbox' }); c.checked = !!row[col]; c.addEventListener('change', function () { set(Object.fromEntries([[col, c.checked]]), label + (c.checked ? ' on.' : ' off.')); }); return h('label', { class: 'ck' }, c, label); }
      inner.appendChild(h('div', { class: 'acts' }, toggle('Featured', 'is_featured'), toggle('Urgent', 'is_urgent')));
      var img = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Product image' }), upb = h('button', { class: 'btn sec sm', text: 'Upload product image', onclick: function () {
        var f = img.files[0]; if (!f) return toast('Choose an image first.', true); if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 10485760) return toast('JPG, PNG or WebP up to 10 MB.', true);
        var path = 'opportunities/' + row.id + '/' + crypto.randomUUID() + '-' + f.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-60); upb.disabled = true;
        D.upload('portwise-public-assets', path, f).then(function () { return patch('sourcing_opportunities', row.id, { image_path: path }, 'Image saved.', reload); }).catch(function (e) { toast(e.message, true); }).then(function () { upb.disabled = false; }); } });
      if (row.image_path && /^[A-Za-z0-9_\-./]+$/.test(row.image_path)) inner.appendChild(h('img', { src: PUB + row.image_path.split('/').map(encodeURIComponent).join('/'), alt: 'Product image', width: 160 }));
      inner.appendChild(h('p', { class: 'muted', text: 'Product images are public once the opportunity is published.' })); inner.appendChild(h('div', { class: 'acts' }, img, upb));
      var rbox = h('div', { class: 'acts' }, h('span', { class: 'muted', text: 'Loading responses…' })); inner.appendChild(h('h2', { text: 'Supplier responses' })); inner.appendChild(rbox);
      api('/rest/v1/opportunity_responses?select=id&opportunity_id=eq.' + row.id, { raw: true, headers: { Prefer: 'count=exact' } }).then(function (r) { var n = (r.headers.get('content-range') || '').split('/')[1] || '0'; rbox.innerHTML = '';
        rbox.appendChild(h('span', { text: n + ' response' + (n === '1' ? '' : 's') })); if (n !== '0') { rbox.appendChild(h('button', { class: 'btn sm', text: 'Compare responses', onclick: function () { compare(row); } }));
          rbox.appendChild(h('button', { class: 'btn sec sm', text: 'View list', onclick: function () { D.listState.responses = { q: '', status: '', page: 0, extra: { opportunity_id: row.id } }; D.closeDrawer(); if (location.hash === '#/responses') window.dispatchEvent(new Event('hashchange')); else location.hash = '#/responses'; } })); } }).catch(function () { rbox.textContent = ''; });
      return box;
    } };

  // ---------- Documents + Activity (read-only lists)
  var ENTMOD = { buyer: 'buyers', supplier: 'suppliers', buyer_request: 'requests', product: 'products', response: 'responses', opportunity: 'opportunities' };
  var ENTS = Object.keys(ENTMOD).map(function (k) { return [k, human(k)]; });
  MODS.documents = { title: 'Documents', table: 'business_documents', statusCol: 'entity_type', statuses: ENTS, order: 'created_at.desc', fixed: { deleted_at: 'is.null' }, search: ['original_filename', 'document_category'], placeholder: 'Search file name or category',
    cols: [['File', function (r) { return r.original_filename; }], ['Linked to', function (r) { return human(r.entity_type); }], ['Category', function (r) { return human(r.document_category || 'other'); }], ['Size', function (r) { return r.file_size_bytes ? D.fsize(r.file_size_bytes) : ''; }], ['Uploaded', function (r) { return when(r.created_at); }],
      ['', function (r) { return h('button', { class: 'btn sec sm', text: 'Go to record', onclick: function (e) { e.stopPropagation(); location.hash = '#/' + ENTMOD[r.entity_type]; setTimeout(function () { D.openRecord(ENTMOD[r.entity_type], r.entity_id); }, 50); } }); }]],
    rowOpen: function (r) { D.sign(r.storage_bucket, r.storage_path).then(function (u) { D.openUrl(u); }).catch(function (e) { toast(e.message, true); }); } };
  MODS.activity = { title: 'Activity History', table: 'activity_logs', statusCol: 'entity_type', statuses: ENTS, order: 'created_at.desc', search: ['action'], placeholder: 'Search action (e.g. status_changed)',
    cols: [['When', function (r) { return when(r.created_at); }], ['Action', function (r) { return human(r.action); }], ['Record type', function (r) { return r.entity_type ? human(r.entity_type) : ''; }], ['Detail', function (r) { var d = r.details || {}; return d.from ? human(d.from) + ' → ' + human(d.to) : (d.reference || d.filename || ''); }], ['By', function (r) { return D.S.staff[r.actor_user_id] || (r.actor_user_id ? 'Staff' : 'Website submission'); }]],
    rowOpen: function (r) { if (ENTMOD[r.entity_type] && r.entity_id) { location.hash = '#/' + ENTMOD[r.entity_type]; setTimeout(function () { D.openRecord(ENTMOD[r.entity_type], r.entity_id); }, 50); } } };

  // ---------- Visual Journal: media + albums
  var JCATS = [['products', 'Products'], ['agriculture', 'Agriculture'], ['sourcing_production', 'Sourcing & Production'], ['processing_packaging', 'Processing & Packaging'], ['logistics_trade', 'Logistics & Trade'], ['business_events', 'Business & Events'], ['behind_the_scenes', 'Behind the Scenes']];
  var JBRANDS = [['portwise', 'Portwise'], ['evara', 'EVARA'], ['agrinest', 'AGRINEST'], ['primecrest', 'PRIME CREST'], ['logicwise', 'LOGICWISE']];
  var JB = 'portwise-journal', JURL = C.supabaseUrl + '/storage/v1/object/public/' + JB + '/';
  function jpub(p) { return p && /^[A-Za-z0-9_\-./]+$/.test(p) ? JURL + p.split('/').map(encodeURIComponent).join('/') : ''; }
  function lab(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return v || ''; }
  function opts(list, cur, blank) { return [h('option', { value: '', text: blank })].concat(list.map(function (o) { return h('option', { value: o[0], text: o[1], selected: cur === o[0] }); })); }
  function resize(file, max, q) {
    return createImageBitmap(file).then(function (bm) { var s = Math.min(1, max / Math.max(bm.width, bm.height)), w = Math.max(1, Math.round(bm.width * s)), ht = Math.max(1, Math.round(bm.height * s)), c = document.createElement('canvas'); c.width = w; c.height = ht;
      var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, ht); x.drawImage(bm, 0, 0, w, ht); if (bm.close) bm.close();
      return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('Could not process this image.')); }, 'image/jpeg', q); }); });
  }
  function safe(n) { return n.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 50) || 'file'; }
  function niceTitle(n) { return n.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 120); }
  function jbadge(on) { return h('span', { class: 'st ' + (on ? 'g' : ''), text: on ? 'Published' : 'Draft' }); }
  function albumsList() { return api('/rest/v1/journal_albums?select=id,title,is_published&order=title.asc'); }

  MODS.media = { title: 'Media Management', table: 'journal_media', select: '*,journal_albums(title)', statusCol: 'is_published', statuses: [['true', 'Published'], ['false', 'Unpublished']], order: 'sort_order.asc,created_at.desc', search: ['title', 'caption', 'description', 'country'], placeholder: 'Search title, caption or country',
    onNew: function () { mediaUpload(); }, rowOpen: function (r) { mediaEdit(r.id); },
    cols: [['Preview', function (r) { var u = jpub(r.thumbnail_path) || (r.media_type === 'image' ? jpub(r.media_path) : ''); return u ? h('img', { src: u, alt: '', width: 56, height: 42 }) : h('span', { text: r.media_type === 'video' ? '🎞 video' : '' }); }], ['Title', function (r) { return r.title || r.caption || '(untitled)'; }], ['Type', function (r) { return human(r.media_type); }],
      ['Category', function (r) { return lab(JCATS, r.category); }], ['Brand', function (r) { return lab(JBRANDS, r.brand); }], ['Album', function (r) { return r.journal_albums ? r.journal_albums.title : ''; }], ['Status', function (r) { return jbadge(r.is_published); }], ['★', function (r) { return r.is_featured ? '★' : ''; }], ['Order', function (r) { return String(r.sort_order); }]] };

  function mediaUpload() {
    var body = D.$('dBody'); D.$('drawer').hidden = false; body.innerHTML = ''; body.appendChild(h('h1', { text: 'Upload media' }));
    body.appendChild(h('p', { class: 'muted', text: 'Everything uploads as an unpublished DRAFT. Photos are resized for the web and location data is removed. Videos: MP4 or WebM up to 50 MB.' }));
    var file = h('input', { type: 'file', multiple: true, accept: 'image/jpeg,image/png,image/webp,video/mp4,video/webm', 'aria-label': 'Photos or videos' }), cat = h('select', { 'aria-label': 'Category' }, opts(JCATS, '', 'Category (optional)')), br = h('select', { 'aria-label': 'Brand' }, opts(JBRANDS, '', 'Brand (optional)')),
      alb = h('select', { 'aria-label': 'Album' }, h('option', { value: '', text: 'No album' })), ctry = h('input', { placeholder: 'Country (optional)', maxlength: 80 }), tags = h('input', { placeholder: 'Tags, separated by commas', maxlength: 200 });
    albumsList().then(function (as) { as.forEach(function (a) { alb.appendChild(h('option', { value: a.id, text: a.title + (a.is_published ? '' : ' (unpublished)') })); }); }).catch(function () { });
    var out = h('div', { class: 'item' }), go = h('button', { class: 'btn', text: 'Upload', onclick: function () {
      var fs = Array.prototype.slice.call(file.files); if (!fs.length) return toast('Choose at least one file.', true); var bad = fs.filter(function (f) { return !/^(image\/(jpeg|png|webp)|video\/(mp4|webm))$/.test(f.type) || (f.type.indexOf('video/') === 0 ? f.size > 52428800 : f.size > 26214400); });
      if (bad.length) return toast('Not allowed or too large: ' + bad.map(function (f) { return f.name; }).join(', '), true);
      go.disabled = true; out.innerHTML = ''; var done = 0, fail = [], chain = Promise.resolve(), tg = tags.value.split(',').map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean).slice(0, 20), yr = new Date().getFullYear();
      fs.forEach(function (f, i) { chain = chain.then(function () {
        go.textContent = 'Uploading ' + (i + 1) + ' of ' + fs.length + '…'; var id = crypto.randomUUID(), base = 'media/' + yr + '/' + id + '-' + safe(f.name), isVid = f.type.indexOf('video/') === 0, row = { media_type: isVid ? 'video' : 'image', title: niceTitle(f.name), alt_text: niceTitle(f.name), is_published: false, category: cat.value || null, brand: br.value || null, album_id: alb.value || null, country: ctry.value.trim() || null, tags: tg, sort_order: 0 };
        if (isVid) { row.media_path = base + '.' + (f.type === 'video/webm' ? 'webm' : 'mp4'); return D.upload(JB, row.media_path, f).then(function () { return api('/rest/v1/journal_media', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: row }); }); }
        row.media_path = base + '.jpg'; row.thumbnail_path = base + '-thumb.jpg';
        return Promise.all([resize(f, 2000, 0.85), resize(f, 700, 0.8)]).then(function (b) { return D.upload(JB, row.media_path, b[0]).then(function () { return D.upload(JB, row.thumbnail_path, b[1]); }); }).then(function () { return api('/rest/v1/journal_media', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: row }); });
      }).then(function () { done++; }).catch(function (e) { fail.push(f.name + ': ' + e.message); }); });
      chain.then(function () { go.disabled = false; go.textContent = 'Upload'; file.value = ''; out.appendChild(h('div', { class: done ? 'ok' : 'err', text: done + ' uploaded as drafts' + (fail.length ? ', ' + fail.length + ' failed.' : '.') })); fail.forEach(function (x) { out.appendChild(h('div', { class: 'err', text: x })); }); if (done) { toast('Uploaded. Review and publish each item.'); if (D.refreshList) D.refreshList(); } });
    } });
    body.appendChild(h('div', { class: 'panel' }, h('label', {}, 'Files', file), h('div', { class: 'row2' }, cat, br, alb, ctry), tags, h('div', { class: 'acts' }, go, h('button', { class: 'btn sec', text: 'Close', onclick: function () { D.closeDrawer(); } })), out));
  }

  function mediaEdit(id) {
    var body = D.$('dBody'); D.$('drawer').hidden = false; body.innerHTML = ''; body.appendChild(h('p', { class: 'muted', text: 'Loading…' }));
    Promise.all([api('/rest/v1/journal_media?select=*&id=eq.' + id), albumsList()]).then(function (r) {
      var m = r[0][0]; if (!m) throw new Error('Media not found.'); var as = r[1]; body.innerHTML = '';
      body.appendChild(h('div', { class: 'acts' }, h('h1', { text: m.title || m.caption || 'Media' }), jbadge(m.is_published)));
      var pv = jpub(m.media_path); body.appendChild(h('div', { class: 'panel' }, m.media_type === 'video' ? h('video', { src: pv, controls: true, preload: 'metadata', width: 320, poster: jpub(m.thumbnail_path) || null }) : h('img', { src: pv, alt: m.alt_text || '', width: 320 })));
      var F = {}; function inp(k, label, area, type) { var el = area ? h('textarea', { maxlength: 2000 }) : h('input', { type: type || 'text', maxlength: 300 }); el.value = m[k] == null ? '' : (k === 'tags' ? (m.tags || []).join(', ') : m[k]); F[k] = el; return h('label', {}, label, el); }
      var catS = h('select', {}, opts(JCATS, m.category, 'No category')), brS = h('select', {}, opts(JBRANDS, m.brand, 'No brand')), alS = h('select', {}, [h('option', { value: '', text: 'No album' })].concat(as.map(function (a) { return h('option', { value: a.id, text: a.title + (a.is_published ? '' : ' (unpublished)'), selected: m.album_id === a.id }); })));
      var feat = h('input', { type: 'checkbox' }); feat.checked = !!m.is_featured;
      body.appendChild(h('div', { class: 'panel' }, h('div', { class: 'row2' }, inp('title', 'Title'), inp('country', 'Country')), inp('caption', 'Caption (shown on the public page)', true), inp('description', 'Description', true), inp('alt_text', 'Alt text (describes the image for screen readers)'), inp('tags', 'Tags (comma separated)'),
        h('div', { class: 'row2' }, h('label', {}, 'Category', catS), h('label', {}, 'Brand', brS), h('label', {}, 'Album', alS), inp('sort_order', 'Display order (lower shows first)', false, 'number')), h('label', { class: 'ck' }, feat, 'Featured (shown in the Featured section)')));
      function collect() { var o = { title: F.title.value.trim() || null, country: F.country.value.trim() || null, caption: F.caption.value.trim() || null, description: F.description.value.trim() || null, alt_text: F.alt_text.value.trim() || null, tags: F.tags.value.split(',').map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean).slice(0, 20), category: catS.value || null, brand: brS.value || null, album_id: alS.value || null, sort_order: parseInt(F.sort_order.value, 10) || 0, is_featured: feat.checked }; return o; }
      function reload() { mediaEdit(id); if (D.refreshList) D.refreshList(); }
      var acts = h('div', { class: 'acts' });
      acts.appendChild(h('button', { class: 'btn', text: 'Save changes', onclick: function () { patch('journal_media', id, collect(), 'Saved.', reload); } }));
      acts.appendChild(h('button', { class: m.is_published ? 'btn sec' : 'btn gold', text: m.is_published ? 'Unpublish' : 'Publish', onclick: function () {
        var p = collect(); p.is_published = !m.is_published;
        if (p.is_published) { var al = as.filter(function (a) { return a.id === p.album_id; })[0]; if (al && !al.is_published && !confirm('This album is not published, so the item stays hidden until the album is published. Continue?')) return; if (!confirm('Publish this to the public Visual Journal?')) return; } patch('journal_media', id, p, p.is_published ? 'Published.' : 'Unpublished.', reload); } }));
      acts.appendChild(h('button', { class: 'btn sec', text: 'Move to top', onclick: function () { api('/rest/v1/journal_media?select=sort_order&order=sort_order.asc&limit=1').then(function (r2) { var top = r2.length ? r2[0].sort_order - 1 : 0; patch('journal_media', id, { sort_order: top }, 'Moved to the top.', reload); }); } }));
      body.appendChild(h('div', { class: 'panel' }, acts));
      if (m.media_type === 'video') { var pf = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Poster image' }); body.appendChild(D.section('Video poster image', h('div', { class: 'acts' }, pf, h('button', { class: 'btn sec sm', text: 'Upload poster', onclick: function () { var f = pf.files[0]; if (!f || !/^image\/(jpeg|png|webp)$/.test(f.type)) return toast('Choose a JPG, PNG or WebP image.', true);
        var path = 'media/' + new Date().getFullYear() + '/' + crypto.randomUUID() + '-poster.jpg'; resize(f, 1200, 0.82).then(function (b) { return D.upload(JB, path, b); }).then(function () { return patch('journal_media', id, { thumbnail_path: path }, 'Poster saved.', reload); }).catch(function (e) { toast(e.message, true); }); } })))); }
      body.appendChild(h('div', { class: 'panel acts' }, h('button', { class: 'btn warn', text: 'Delete permanently', onclick: function () {
        if (!confirm('Permanently delete this media and its files? This cannot be undone.')) return; var pre = [m.media_path].concat(m.thumbnail_path ? [m.thumbnail_path] : []);
        api('/storage/v1/object/' + JB, { method: 'DELETE', body: { prefixes: pre } }).then(function () { return api('/rest/v1/journal_media?id=eq.' + id, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); }).then(function () { toast('Deleted.'); D.closeDrawer(); if (D.refreshList) D.refreshList(); }).catch(function (e) { toast(e.message, true); }); } }), h('button', { class: 'btn sec', text: 'Close', onclick: function () { D.closeDrawer(); } })));
    }).catch(function (e) { body.innerHTML = ''; body.appendChild(h('p', { class: 'err', text: e.message })); });
  }

  MODS.albums = { title: 'Albums', table: 'journal_albums', select: '*,journal_media(count)', statusCol: 'is_published', statuses: [['true', 'Published'], ['false', 'Unpublished']], order: 'sort_order.asc,created_at.desc', search: ['title', 'slug', 'description'], placeholder: 'Search albums',
    onNew: function () { albumForm(null); }, rowOpen: function (r) { albumForm(r); },
    cols: [['Title', function (r) { return r.title; }], ['Slug', function (r) { return r.slug; }], ['Items', function (r) { return String(r.journal_media && r.journal_media[0] ? r.journal_media[0].count : 0); }], ['Status', function (r) { return jbadge(r.is_published); }], ['★', function (r) { return r.is_featured ? '★' : ''; }], ['Order', function (r) { return String(r.sort_order); }]] };
  function albumForm(a) {
    var body = D.$('dBody'); D.$('drawer').hidden = false; body.innerHTML = ''; body.appendChild(h('h1', { text: a ? 'Edit album' : 'New album' })); a = a || {};
    var t = h('input', { value: a.title || '', maxlength: 120 }), sl = h('input', { value: a.slug || '', maxlength: 80, placeholder: 'auto-filled from title' }), de = h('textarea', { maxlength: 1000 }), so = h('input', { type: 'number', value: a.sort_order || 0 }), ft = h('input', { type: 'checkbox' }), pb = h('input', { type: 'checkbox' }), cv = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Cover image' }), err = h('div', { class: 'err', role: 'alert' });
    de.value = a.description || ''; ft.checked = !!a.is_featured; pb.checked = !!a.is_published;
    body.appendChild(h('div', { class: 'panel' }, h('label', {}, 'Title *', t), h('label', {}, 'Web address name (slug)', sl), h('label', {}, 'Description', de), h('label', {}, 'Display order (lower first)', so), h('label', {}, 'Cover image (optional)', cv), h('label', { class: 'ck' }, ft, 'Featured'), h('label', { class: 'ck' }, pb, 'Published (visible on the website)'), err,
      h('div', { class: 'acts' }, h('button', { class: 'btn', text: 'Save album', onclick: function () {
        err.textContent = ''; var title = t.value.trim(); if (!title) return err.textContent = 'Title is required.'; var slug = (sl.value.trim() || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); if (!slug) return err.textContent = 'Slug needs letters or numbers.';
        var o = { title: title, slug: slug, description: de.value.trim() || null, sort_order: parseInt(so.value, 10) || 0, is_featured: ft.checked, is_published: pb.checked }, f = cv.files[0];
        if (f && !/^image\/(jpeg|png|webp)$/.test(f.type)) return err.textContent = 'Cover must be JPG, PNG or WebP.';
        var pre = f ? resize(f, 1600, 0.82).then(function (b) { var path = 'albums/' + crypto.randomUUID() + '-' + safe(f.name) + '.jpg'; return D.upload(JB, path, b).then(function () { o.cover_image_path = path; }); }) : Promise.resolve();
        pre.then(function () { return a.id ? api('/rest/v1/journal_albums?id=eq.' + a.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: o }) : api('/rest/v1/journal_albums', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: Object.assign({ created_by: D.S.user.id }, o) }); })
          .then(function () { toast('Album saved.'); D.closeDrawer(); if (D.refreshList) D.refreshList(); }).catch(function (e) { err.textContent = /duplicate|unique/i.test(e.message) ? 'That slug is already used. Choose another.' : e.message; }); } }),
        a.id ? h('button', { class: 'btn warn', text: 'Delete album', onclick: function () { var n = a.journal_media && a.journal_media[0] ? a.journal_media[0].count : 0; if (n > 0) return toast('This album has ' + n + ' item(s). Move or delete them first.', true); if (!confirm('Delete this album?')) return;
          api('/rest/v1/journal_albums?id=eq.' + a.id, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).then(function () { toast('Deleted.'); D.closeDrawer(); if (D.refreshList) D.refreshList(); }).catch(function (e) { toast(e.message, true); }); } }) : null,
        h('button', { class: 'btn sec', text: 'Cancel', onclick: function () { D.closeDrawer(); } }))));
  }

  // ---------- Overview + Settings
  D.views = {};
  var STATS = [['total_buyers', 'Total buyers', 'buyers', ''], ['total_suppliers', 'Total suppliers', 'suppliers', ''], ['pending_registrations', 'Pending registrations', 'buyers', 'new_registration'], ['verified_buyers', 'Verified buyers', 'buyers', 'verified'], ['approved_suppliers', 'Approved suppliers', 'suppliers', 'approved'],
    ['active_opportunities', 'Active opportunities', 'opportunities', 'published'], ['new_responses', 'New supplier responses', 'responses', 'new_response'], ['pending_responses', 'Pending responses', 'responses', 'under_review'], ['new_buyer_requests', 'New buyer requests', 'requests', 'new_request'], ['new_product_submissions', 'New product submissions', 'products', 'new_submission']];
  function go(mod, status) { D.listState[mod] = { q: '', status: status || '', page: 0, extra: {} }; if (location.hash === '#/' + mod) window.dispatchEvent(new Event('hashchange')); else location.hash = '#/' + mod; }
  D.views.overview = function (root) {
    root.innerHTML = ''; root.appendChild(h('h1', { text: 'Overview' })); var cards = h('div', { class: 'cards' }, h('p', { class: 'muted', text: 'Loading…' })); root.appendChild(cards);
    api('/rest/v1/rpc/admin_dashboard_stats', { method: 'POST', body: {} }).then(function (s) { cards.innerHTML = ''; STATS.forEach(function (c) { cards.appendChild(h('button', { class: 'stat', onclick: function () { go(c[2], c[3]); } }, h('b', { text: String(s[c[0]] == null ? '—' : s[c[0]]) }), h('span', { text: c[1] }))); }); }).catch(function (e) { cards.innerHTML = ''; cards.appendChild(h('p', { class: 'err', text: 'Could not load statistics: ' + e.message })); });
    [['buyers', 'Recently received registrations: buyers', 'organization_name'], ['suppliers', 'Recently received registrations: suppliers', 'company_name'], ['requests', 'Recent buyer requests', 'product_name'], ['products', 'Recent product submissions', 'product_name'], ['responses', 'Recent supplier responses', 'company_name']].forEach(function (x) {
      var m = MODS[x[0]], box = h('div', {}, h('p', { class: 'muted', text: 'Loading…' })); root.appendChild(D.section(x[1], box));
      api('/rest/v1/' + m.table + '?select=id,reference_number,created_at,' + m.statusCol + ',' + x[2] + '&order=created_at.desc&limit=5').then(function (rows) { box.innerHTML = ''; if (!rows.length) box.appendChild(h('p', { class: 'muted', text: 'Nothing received yet.' }));
        rows.forEach(function (r) { box.appendChild(h('div', { class: 'item acts' }, h('div', { class: 'grow' }, h('div', { text: (r[x[2]] || '') + (r.reference_number ? '  ·  ' + r.reference_number : '') }), h('small', { text: when(r.created_at) })), badge(r[m.statusCol]), h('button', { class: 'btn sec sm', text: 'Open', onclick: function () { D.openRecord(x[0], r.id); } }))); }); }).catch(function (e) { box.textContent = e.message; }); });
  };
  D.views.settings = function (root) {
    root.innerHTML = ''; root.appendChild(h('h1', { text: 'Settings' }));
    var s1 = h('div', {}, h('p', { class: 'muted', text: 'Loading…' })); root.appendChild(D.section('Business rules', s1));
    api('/rest/v1/app_settings?select=*').then(function (rows) { var by = {}; rows.forEach(function (r) { by[r.key] = r; }); s1.innerHTML = '';
      var req = by.require_approved_supplier_for_responses, c = h('input', { type: 'checkbox' }); c.checked = req ? req.value === true : true;
      c.addEventListener('change', function () { if (!c.checked && !confirm('Allow suppliers who are NOT approved to respond to opportunities?')) { c.checked = true; return; } api('/rest/v1/app_settings?key=eq.require_approved_supplier_for_responses', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { value: c.checked, updated_at: new Date().toISOString() } }).then(function () { toast('Saved.'); }).catch(function (e) { toast(e.message, true); c.checked = !c.checked; }); });
      s1.appendChild(h('label', { class: 'ck' }, c, 'Only approved suppliers may respond to sourcing opportunities'));
      var em = h('input', { type: 'email', value: by.staff_notification_email ? String(by.staff_notification_email.value) : '', 'aria-label': 'Staff notification email' });
      s1.appendChild(h('label', {}, 'Staff notification email (receives new-submission alerts)', em)); s1.appendChild(h('div', { class: 'acts' }, h('button', { class: 'btn sm', text: 'Save email', onclick: function () { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) return toast('Enter a valid email.', true);
        api('/rest/v1/app_settings?key=eq.staff_notification_email', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { value: em.value.trim(), updated_at: new Date().toISOString() } }).then(function () { toast('Saved.'); }).catch(function (e) { toast(e.message, true); }); } })));
    }).catch(function (e) { s1.textContent = e.message; });
    var s2 = h('div', {}, h('p', { class: 'muted', text: 'Loading…' })); root.appendChild(D.section('Staff accounts', s2));
    api('/rest/v1/profiles?select=user_id,email,full_name,role,account_status&order=created_at.asc').then(function (ps) { s2.innerHTML = '';
      s2.appendChild(h('p', { class: 'muted', text: 'New staff: create the user in Supabase Authentication, then set their role to Admin here. Admins can see all business data.' }));
      ps.forEach(function (p) { var me = p.user_id === D.S.user.id, role = h('select', { disabled: me, 'aria-label': 'Role for ' + p.email }, ['member', 'admin'].map(function (r) { return h('option', { value: r, text: human(r), selected: p.role === r }); })), sta = h('select', { disabled: me, 'aria-label': 'Account status for ' + p.email }, ['active', 'suspended'].map(function (r) { return h('option', { value: r, text: human(r), selected: p.account_status === r }); }));
        function upd() { if (!confirm('Change access for ' + p.email + '?')) { role.value = p.role; sta.value = p.account_status; return; } api('/rest/v1/profiles?user_id=eq.' + p.user_id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { role: role.value, account_status: sta.value } }).then(function () { p.role = role.value; p.account_status = sta.value; toast('Saved.'); }).catch(function (e) { toast(e.message, true); }); }
        role.addEventListener('change', upd); sta.addEventListener('change', upd); s2.appendChild(h('div', { class: 'item row2' }, h('div', {}, h('div', { text: p.full_name || p.email }), h('small', { text: p.email + (me ? ' (you)' : '') })), h('div', { class: 'acts' }, role, sta))); }); }).catch(function (e) { s2.textContent = e.message; });
    var pw1 = h('input', { type: 'password', autocomplete: 'new-password', minlength: 12, 'aria-label': 'New password' }), pw2 = h('input', { type: 'password', autocomplete: 'new-password', minlength: 12, 'aria-label': 'Confirm new password' }), pmsg = h('div', { class: 'err', role: 'alert' });
    root.appendChild(D.section('My account: change password', h('div', {}, h('p', { class: 'muted', text: 'At least 12 characters. You stay signed in.' }), h('label', {}, 'New password', pw1), h('label', {}, 'Confirm new password', pw2), pmsg,
      h('div', { class: 'acts' }, h('button', { class: 'btn sm', text: 'Change password', onclick: function () { pmsg.className = 'err'; pmsg.textContent = ''; D.changePassword(pw1.value, pw2.value).then(function () { pw1.value = ''; pw2.value = ''; pmsg.className = 'ok'; pmsg.textContent = 'Password changed.'; }).catch(function (e) { pmsg.textContent = e.message; }); } })))));
    var s3 = h('div', {}, h('p', { class: 'muted', text: 'Loading…' })); root.appendChild(D.section('Email queue (pending or failed)', s3));
    api('/rest/v1/email_outbox?select=*&email_status=in.(pending,failed)&order=created_at.desc&limit=20').then(function (rows) { s3.innerHTML = ''; if (!rows.length) s3.appendChild(h('p', { class: 'muted', text: 'No pending or failed emails.' }));
      rows.forEach(function (m) { s3.appendChild(h('div', { class: 'item' }, h('div', { text: m.subject }), h('small', { text: m.recipient_email + ' · ' + m.email_status + ' · attempts ' + m.attempt_count + ' · ' + when(m.created_at) + (m.last_error ? ' · ' + m.last_error : '') }))); }); }).catch(function (e) { s3.textContent = e.message; });
  };

  D.NAV = [['overview', 'Overview'], ['buyers', 'Buyers'], ['suppliers', 'Suppliers'], ['opportunities', 'Sourcing Opportunities'], ['responses', 'Supplier Responses'], ['requests', 'Buyer Requests'], ['products', 'Product Submissions'], ['documents', 'Documents'], ['media', 'Media Management'], ['albums', 'Albums'], ['activity', 'Activity History'], ['settings', 'Settings']];
  D.boot();
})();
