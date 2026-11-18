/* Export Readiness Checker: guided questions, per-area result and PDF checklist. Informational only. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var SETS = {
    buyer: [
      ['Product identification', [['I can name the exact product or product type I need.', 'Write down the product name, type and intended use.'], ['I have a photo, sample or link that shows what I want.', 'Collect a reference photo, link or sample to share with suppliers.'], ['I know the product\u2019s customs (HS) code, or I know how to find it.', 'Ask your customs broker or use your official tariff database to find the HS code.']]],
      ['Product specifications', [['I have defined sizes, dimensions or weight.', 'Define sizes, dimensions and weight, with tolerances where they matter.'], ['I have defined materials, grade or quality level.', 'Decide the materials, grade or quality level you expect.'], ['I have defined colours, finish or any customisation.', 'List colours, finish, branding or labelling you need.']]],
      ['Quantity', [['I know my first order quantity.', 'Decide a first order quantity. Smaller trial orders are possible to discuss.'], ['I know my expected repeat quantity or frequency.', 'Estimate repeat quantity and frequency, as it can help in discussions with suppliers.'], ['I understand minimum order quantities may apply.', 'Ask for minimum order quantities in your quotation request.']]],
      ['Destination market', [['I know my destination country and port.', 'Confirm your destination country and the port or place of delivery.'], ['I have checked whether the product needs a licence, permit or health certificate in my country.', 'Check this with your official customs or trade authority before you order.'], ['I have an importer of record or an import arrangement.', 'Confirm who will clear the goods through customs on arrival.']]],
      ['Packaging requirements', [['I know the packaging type I need.', 'Decide the packaging type, such as cartons, bags or pallets.'], ['I know the labelling my market requires.', 'Check label content and language requirements for your market.'], ['I know whether I need private-label or custom branding.', 'Decide whether you need private label, and prepare artwork or brand details.']]],
      ['Documentation considerations', [['I know which documents my customs authority requires.', 'Ask your customs authority or broker for the documents required for this product.'], ['I have chosen a payment method (for example advance payment or L/C).', 'Agree the payment method you will use before ordering.'], ['I know of any certificates my market requires.', 'Check which certificates or test reports your market needs and tell us in your enquiry.']]],
      ['Delivery expectations', [['I know when I need the goods.', 'Set a target delivery date or season, allowing time for sampling and shipping.'], ['I know my preferred shipping mode (sea or air).', 'Decide between sea and air freight, based on cost and time.'], ['I have considered freight and import costs in my budget.', 'Include freight, insurance, duties and local handling in your budget.']]]
    ],
    supplier: [
      ['Business information', [['My business is registered and I can show the registration.', 'Prepare your company registration and trade licence documents.'], ['My address and contact details can be verified.', 'Make sure your address, phone and email are accurate and verifiable.'], ['I have exported before, or I am ready to start exporting.', 'Note your export experience, or explain your plan to start exporting.']]],
      ['Product capability', [['I can make the product to a buyer\u2019s specification.', 'Prepare to confirm what you can make and what you cannot.'], ['I can provide samples.', 'Prepare sample production and shipping arrangements.'], ['My products are documented with photos and details.', 'Create a simple catalogue with photos, sizes and materials.']]],
      ['Quality documentation', [['I have documented quality procedures.', 'Write down how you check quality during and after production.'], ['I keep inspection or test records.', 'Keep inspection and test records that you can share when asked.'], ['Any certificates I mention are valid and I can show them.', 'Only claim certificates you hold, and keep copies ready as evidence.']]],
      ['Packaging capability', [['I can pack products for export.', 'Prepare export packing methods and materials.'], ['I can label to a buyer\u2019s requirements.', 'Be ready to apply buyer-specified labels and barcodes.'], ['I can offer custom or more sustainable packaging.', 'Note any custom or sustainable packaging options you can supply.']]],
      ['Production capacity', [['I know my monthly production capacity.', 'Work out your monthly capacity for each product.'], ['I know my usual lead times.', 'Confirm lead times for samples and production orders.'], ['I know any seasonal limits.', 'Note seasonal limits or peak periods that affect supply.']]],
      ['Export documentation readiness', [['I know how to prepare a commercial invoice and packing list.', 'Learn or arrange support for the commercial invoice and packing list.'], ['I can provide origin and other documents when required.', 'Find out which origin or other documents buyers may ask for.'], ['I have a bank arrangement for export payments.', 'Speak to your bank about export payments and letters of credit.']]]
    ]
  };
  var OPT = [['Yes', 2], ['Partly', 1], ['No', 0], ['Not sure', 0]];
  var role = '', areas = [], cur = 0, ans = {};
  function start(r) { role = r; areas = SETS[r]; cur = 0; ans = {}; $('erStart').hidden = true; $('erForm').hidden = false; $('erOut').hidden = true; draw(); }
  [].slice.call(document.querySelectorAll('[data-role]')).forEach(function (b) { b.onclick = function () { start(b.getAttribute('data-role')); }; });
  function draw() {
    var a = areas[cur], q = $('erQ'); q.innerHTML = ''; $('erProg').textContent = (role === 'buyer' ? 'Buyer' : 'Supplier') + ' checklist: area ' + (cur + 1) + ' of ' + areas.length; $('erErr').style.display = 'none';
    var fs = el('fieldset', 'step'); fs.appendChild(el('legend', '', a[0]));
    a[1].forEach(function (it, i) {
      var k = cur + '_' + i, box = el('div', 'card'); box.style.marginBottom = '10px'; box.appendChild(el('p', '', it[0])); var row = el('div', 'pr');
      OPT.forEach(function (o) { var l = el('label', 'opt'); l.style.margin = '0'; l.style.padding = '8px 12px'; var r = el('input'); r.type = 'radio'; r.name = 'q' + k; r.value = o[1]; r.setAttribute('data-l', o[0]); if (ans[k] && ans[k][0] === o[0]) r.checked = true; r.onchange = function () { ans[k] = [o[0], o[1]]; }; l.appendChild(r); l.appendChild(el('span', '', o[0])); row.appendChild(l); });
      box.appendChild(row); fs.appendChild(box);
    }); q.appendChild(fs); $('erBack').style.display = cur ? '' : 'none'; $('erNext').textContent = cur === areas.length - 1 ? 'See my result' : 'Next'; $('erForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('erNext').onclick = function () {
    var a = areas[cur]; for (var i = 0; i < a[1].length; i++) if (!ans[cur + '_' + i]) { var e = $('erErr'); e.style.display = ''; e.textContent = 'Please answer every question to continue.'; return; }
    if (cur < areas.length - 1) { cur++; draw(); } else result();
  };
  $('erBack').onclick = function () { cur--; draw(); };
  function status(p) { return p >= 0.85 ? ['Ready', 'live'] : p >= 0.5 ? ['Partly ready', 'est'] : ['Needs attention', 'cat']; }
  function calc() { return areas.map(function (a, ai) { var s = 0, items = a[1].map(function (it, i) { var v = ans[ai + '_' + i]; s += v[1]; return { text: it[0], action: it[1], answer: v[0], score: v[1] }; }); var p = s / (2 * a[1].length); return { name: a[0], pct: p, status: status(p), items: items }; }); }
  function result() {
    $('erForm').hidden = true; var out = $('erOut'); out.hidden = false; out.innerHTML = ''; var R = calc(), tot = R.reduce(function (s, r) { return s + r.pct; }, 0) / R.length, st = status(tot);
    out.appendChild(el('h2', '', 'Your result: ' + st[0])); out.appendChild(el('p', '', 'Overall readiness across ' + R.length + ' areas: ' + Math.round(tot * 100) + '%. This is a self-assessment based on your answers.'));
    var g = el('div', 'grid'); R.forEach(function (r) { var c = el('div', 'card'); c.appendChild(el('span', 'badge ' + r.status[1], r.status[0])); c.appendChild(el('h3', '', r.name)); c.appendChild(el('p', 'sm', Math.round(r.pct * 100) + '% ready'));
      var todo = r.items.filter(function (i) { return i.score < 2; }); if (todo.length) { var ul = el('ul', 'ben'); todo.forEach(function (i) { ul.appendChild(el('li', '', i.action)); }); c.appendChild(ul); } else c.appendChild(el('p', 'sm', 'Nothing to prepare in this area.')); g.appendChild(c); }); out.appendChild(g);
    var pr = el('div', 'pr'); pr.style.margin = '18px 0'; var dl = el('button', 'btn', 'Download my checklist (PDF)'); dl.type = 'button'; dl.onclick = function () { pdf(R, tot, st[0]); }; pr.appendChild(dl);
    var nx = el('a', 'btn2', role === 'buyer' ? 'Describe your requirement' : 'Apply to partner with us'); nx.href = role === 'buyer' ? 'requirement-builder.html' : 'partner-with-us.html'; pr.appendChild(nx);
    var re = el('button', 'lnk', 'Start again'); re.type = 'button'; re.onclick = function () { out.hidden = true; $('erStart').hidden = false; }; pr.appendChild(re); out.appendChild(pr);
    out.appendChild(el('p', 'srcnote', 'This result is informational and is not an official compliance assessment. Requirements depend on your product and market. Confirm them with your official customs or trade authority.')); out.scrollIntoView({ behavior: 'smooth' });
  }
  function clean(t) { return String(t || '').replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, ''); }
  function pdf(R, tot, label) {
    if (!window.jspdf) { alert('The PDF library did not load. Please refresh and try again.'); return; }
    var d = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), y;
    function head() { d.setFillColor(20, 45, 76); d.rect(0, 0, 210, 26, 'F'); d.setFillColor(224, 178, 91); d.rect(0, 26, 210, 1.3, 'F'); d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(15); d.text('PORTWISE VENTURES', 14, 12); d.setFont('helvetica', 'normal'); d.setFontSize(10); d.text('Export Readiness Checklist (' + (role === 'buyer' ? 'Buyer' : 'Supplier') + ')', 14, 20); }
    head(); y = 38; d.setTextColor(20, 45, 76); d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text('Overall result: ' + label + ' (' + Math.round(tot * 100) + '%)', 14, y); y += 6; d.setFont('helvetica', 'normal'); d.setFontSize(9); d.setTextColor(91, 103, 115); d.text('Generated ' + new Date().toISOString().slice(0, 10) + '. Self-assessment based on your answers.', 14, y); y += 8;
    R.forEach(function (r) {
      if (y > 255) { d.addPage(); head(); y = 38; }
      d.setFillColor(222, 230, 240); d.rect(14, y, 182, 7, 'F'); d.setFont('helvetica', 'bold'); d.setFontSize(10.5); d.setTextColor(20, 45, 76); d.text(clean(r.name) + '  -  ' + r.status[0] + ' (' + Math.round(r.pct * 100) + '%)', 16, y + 5); y += 10;
      r.items.forEach(function (i) {
        var l1 = d.splitTextToSize(clean(i.text), 150), l2 = i.score < 2 ? d.splitTextToSize('To do: ' + clean(i.action), 172) : [];
        var h = l1.length * 4.6 + l2.length * 4.4 + 3; if (y + h > 280) { d.addPage(); head(); y = 38; }
        d.setFont('helvetica', 'normal'); d.setFontSize(9.5); d.setTextColor(40, 50, 60); d.text(l1, 16, y + 3.5); d.setFont('helvetica', 'bold'); d.setTextColor(i.score === 2 ? 31 : 160, i.score === 2 ? 122 : 100, i.score === 2 ? 77 : 20); d.text(i.answer, 196, y + 3.5, { align: 'right' }); y += l1.length * 4.6;
        if (l2.length) { d.setFont('helvetica', 'italic'); d.setFontSize(9); d.setTextColor(91, 103, 115); d.text(l2, 20, y + 3.2); y += l2.length * 4.4; } y += 3;
      }); y += 3;
    });
    if (y > 262) { d.addPage(); head(); y = 38; }
    d.setFont('helvetica', 'italic'); d.setFontSize(8); d.setTextColor(91, 103, 115); d.text(d.splitTextToSize('This checklist is informational and is not an official compliance or regulatory assessment. Requirements depend on your product and market; confirm them with your official customs or trade authority. Questions: info@portwiseventures.com | +880 1575 645253 | portwiseventures.com', 182), 14, y + 4);
    d.save('Portwise-export-readiness-' + role + '.pdf');
  }
})();
