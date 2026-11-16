/* Buyer Matchmaker: suggests a brand and next steps. Suggestions only; supplier availability is confirmed in a quotation. */
(function () {
  'use strict';
  var f = document.getElementById('mm'); if (!f) return;
  var $ = function (id) { return document.getElementById(id); }, qs = [].slice.call(f.querySelectorAll('.step')), cur = 0;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function show(n) { cur = n; qs.forEach(function (q, i) { q.hidden = i !== n; }); $('mmBack').style.display = n ? '' : 'none'; $('mmNext').textContent = n === qs.length - 1 ? 'See my match' : 'Next'; $('mmProg').textContent = 'Question ' + (n + 1) + ' of ' + qs.length; $('mmErr').style.display = 'none'; }
  function val(k) { var c = f.querySelector('[name=' + k + ']:checked'); return c ? c.value : (f.querySelector('select[name=' + k + ']') || {}).value || ''; }
  var BR = {
    evara: { name: 'EVARA', page: 'evara.html', line: 'Jute and leather products from Bangladesh: bags, baskets, bottle bags, gift sets and packaging, with custom design and private label options listed in our catalogue.', mk: 'marketplace.html?brand=EVARA', status: 'Catalogue and 17 listed products available.' },
    agrinest: { name: 'AGRINEST', page: 'agrinest.html', line: 'Fresh vegetables and fruits from Bangladesh. The 2026-27 catalogue lists 46 winter products with sizes and growing regions.', mk: 'marketplace.html?brand=AGRINEST', status: 'Catalogue and 46 listed products available.' },
    primecrest: { name: 'PRIME CREST', page: 'primecrest.html', line: 'Our export-oriented brand for fish, meat, seafood, crabs and dry fish.', mk: null, status: 'Product listings are coming soon. Send an enquiry and we will tell you what is possible.' },
    logicwise: { name: 'LOGICWISE', page: 'logicwise.html', line: 'Digital products and solutions.', mk: null, status: 'Service details are coming soon. Contact us to discuss your project.' }
  };
  function result() {
    var need = val('need'), buyer = val('buyer'), want = val('want'), dest = val('dest'), out = $('mmOut'); out.innerHTML = '';
    var key = need === 'evara2' ? 'evara' : need, b = BR[key]; f.style.display = 'none'; out.style.display = '';
    out.appendChild(el('h2', '', b ? 'Your best match: ' + b.name : 'We will help you find it'));
    var c = el('div', 'card'); c.appendChild(el('p', '', b ? b.line : 'Tell us what you need and our team will check what we can source for you.'));
    if (b) c.appendChild(el('p', 'sm', b.status));
    var why = []; if (need === 'evara2') why.push('Gift and promotional products fit EVARA\u2019s bags, baskets and gift packaging.'); if (buyer === 'food' && need === 'agrinest') why.push('Food-service buyers often want consistent size and freshness, so ask for sizes and packing in your quotation.'); if (want === 'custom' && key === 'evara') why.push('Our Evara catalogue lists custom design, branding and labelling.');
    why.forEach(function (w) { c.appendChild(el('p', 'sm', w)); }); out.appendChild(c);
    out.appendChild(el('h3', '', 'Suggested next steps')); var g = el('div', 'grid');
    function step(t, d, href, label) { var s = el('div', 'card'); s.appendChild(el('h3', '', t)); s.appendChild(el('p', '', d)); var a = el('a', 'btn', label); a.href = href; s.appendChild(a); g.appendChild(s); }
    if (b && b.mk) step('Browse the products', 'See the listed products, filter them and add favourites to your shortlist.', b.mk, 'Open product discovery');
    if (b) step('Visit the ' + b.name + ' page', 'Read more about the brand.', b.page, 'Brand page');
    if (want === 'custom') step('Packaging and private label', 'Explore packaging, branding and labelling options.', 'packaging.html', 'See packaging options');
    if (want === 'sample') step('Request a sample', 'Tell us which product you would like to evaluate.', 'quote.html?samples=yes', 'Request a sample');
    if (want === 'new' || !b) step('Submit a sourcing requirement', 'Not listed? We can look for it.', 'sourcing.html#requirement', 'Sourcing requirement');
    step('Describe your requirement', 'Use the step-by-step builder to prepare a structured enquiry.', 'requirement-builder.html' + (b ? '?brand=' + encodeURIComponent(b.name.replace(' ', '-')) : ''), 'Open the requirement builder');
    if (dest && dest !== 'Other') step('Delivering to ' + dest, 'See official trade resources for your destination.', 'markets.html#resources', 'Countries and markets');
    out.appendChild(g);
    out.appendChild(el('p', 'srcnote', 'These are suggestions based on your answers. Supplier availability, pricing and lead times are confirmed only in a quotation.'));
    var r = el('button', 'lnk', 'Start again'); r.type = 'button'; r.onclick = function () { out.style.display = 'none'; f.style.display = ''; f.reset(); show(0); }; out.appendChild(r);
  }
  $('mmNext').onclick = function () {
    var k = qs[cur].getAttribute('data-q'); if (!val(k)) { var e = $('mmErr'); e.style.display = ''; e.textContent = 'Please choose an option to continue.'; return; }
    if (cur < qs.length - 1) show(cur + 1); else result();
  };
  $('mmBack').onclick = function () { show(cur - 1); };
  show(0);
})();
