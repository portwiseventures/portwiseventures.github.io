/* Country Import Requirement Explorer: links to official authorities. General guidance only. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var C = {
    'United Kingdom': { customs: [['Import goods into the UK (GOV.UK)', 'https://www.gov.uk/import-goods-into-uk'], ['UK Trade Tariff (rates and commodity codes)', 'https://www.trade-tariff.service.gov.uk/']], reg: { food: [['GOV.UK: importing food and drink', 'https://www.gov.uk/import-goods-into-uk']], other: [] } },
    'European Union': { customs: [['Access2Markets (tariffs, rules and procedures)', 'https://trade.ec.europa.eu/access-to-markets/'], ['EU customs', 'https://taxation-customs.ec.europa.eu/']], reg: { food: [['Access2Markets: sanitary and phytosanitary rules', 'https://trade.ec.europa.eu/access-to-markets/']], other: [] } },
    'United States': { customs: [['U.S. Customs and Border Protection', 'https://www.cbp.gov/'], ['Harmonized Tariff Schedule', 'https://hts.usitc.gov/']], reg: { food: [['USDA APHIS (plant and animal imports)', 'https://www.aphis.usda.gov/'], ['FDA (food imports)', 'https://www.fda.gov/']], other: [] } },
    'United Arab Emirates': { customs: [['Dubai Trade', 'https://www.dubaitrade.ae/']], reg: { food: [], other: [] } },
    'Australia': { customs: [['Australian Border Force: importing', 'https://www.abf.gov.au/'], ['Department of Agriculture, Fisheries and Forestry: imports', 'https://www.agriculture.gov.au/']], reg: { food: [['Department of Agriculture, Fisheries and Forestry', 'https://www.agriculture.gov.au/']], other: [] } },
    'Canada': { customs: [['Canada Border Services Agency', 'https://www.cbsa-asfc.gc.ca/']], reg: { food: [['Canadian Food Inspection Agency', 'https://inspection.canada.ca/']], other: [] } },
    'New Zealand': { customs: [['New Zealand Customs Service', 'https://www.customs.govt.nz/']], reg: { food: [['Ministry for Primary Industries: importing', 'https://www.mpi.govt.nz/']], other: [] } }
  };
  var P = { 'Fresh fruit and vegetables': 'food', 'Fish, seafood and meat': 'food', 'Jute and natural fibre products': 'other', 'Leather goods': 'other', 'Plant-based packaging and tableware': 'other', 'Another product': 'other' };
  var H = { '': 'Not selected', '02': '02 Meat and edible meat offal', '03': '03 Fish and crustaceans', '07': '07 Edible vegetables', '08': '08 Edible fruit and nuts', '41': '41 Raw hides and skins and leather', '42': '42 Articles of leather', '46': '46 Manufactures of straw, esparto or other plaiting materials; basketware', '53': '53 Other vegetable textile fibres (including jute)' };
  function fill(sel, vals) { vals.forEach(function (v) { var o = el('option', '', Array.isArray(v) ? v[1] : v); o.value = Array.isArray(v) ? v[0] : v; sel.appendChild(o); }); }
  fill($('irC'), Object.keys(C)); fill($('irP'), Object.keys(P)); fill($('irH'), Object.keys(H).map(function (k) { return [k, H[k]]; }));
  function link(row, l) { var a = el('a', 'btn2', l[0]); a.href = l[1]; a.target = '_blank'; a.rel = 'noopener'; row.appendChild(a); }
  function draw() {
    var c = $('irC').value, p = $('irP').value, h = $('irH').value, d = C[c], out = $('irOut'); out.innerHTML = '';
    var g = el('div', 'card'); g.appendChild(el('h3', '', 'Customs and tariff references: ' + c)); g.appendChild(el('p', '', 'Start here to find duty rates, commodity codes and general import procedures.')); var r = el('div', 'pr'); d.customs.forEach(function (l) { link(r, l); }); g.appendChild(r); out.appendChild(g);
    var reg = d.reg[P[p]] || []; var q = el('div', 'card t'); q.appendChild(el('h3', '', 'Product rules: ' + p)); q.appendChild(el('p', '', P[p] === 'food' ? 'Food, plant and animal products are usually controlled by a separate regulator, often with health or plant-health certificates and labelling rules.' : 'Check whether your product needs a licence, a certificate or special labelling in your market.')); var r2 = el('div', 'pr'); if (reg.length) reg.forEach(function (l) { link(r2, l); }); else q.appendChild(el('p', 'sm', 'Use the customs links above and ask the authority which regulator applies to this product.')); q.appendChild(r2); out.appendChild(q);
    var d3 = el('div', 'card p'); d3.appendChild(el('h3', '', 'Documents to expect')); var ul = el('ul', 'ben'); ['Commercial invoice', 'Packing list', 'Bill of lading or air waybill', 'Customs declaration (usually by the importer or their broker)', 'Any certificates or permits required for your product, as set by the authority'].forEach(function (t) { ul.appendChild(el('li', '', t)); }); d3.appendChild(ul); d3.appendChild(el('p', 'sm', 'This is a general list. The authority decides what your product needs.')); out.appendChild(d3);
    var l4 = el('div', 'card g'); l4.appendChild(el('h3', '', 'Labelling')); l4.appendChild(el('p', '', 'Label content, language and format are set by the destination authority and differ by product. Check the regulator\u2019s guidance before you finalise packaging.')); var r4 = el('div', 'pr'); var a = el('a', 'btn', 'Prepare your requirement'); a.href = 'requirement-builder.html?destination=' + encodeURIComponent(c); r4.appendChild(a); l4.appendChild(r4); out.appendChild(l4);
    if (h) { var s = el('div', 'card'); s.appendChild(el('h3', '', 'HS chapter ' + H[h])); s.appendChild(el('p', '', 'This is a chapter, not a full HS code. Your full code (6 digits or more) decides duty and rules. Use the tariff links above to find it, or ask a customs broker.')); out.appendChild(s); }
    out.appendChild(el('p', 'srcnote', 'Links go to official government websites. We do not verify the content of those sites, and requirements change. Confirm current rules on the official site.')); out.lastChild.style.gridColumn = '1/-1';
  }
  ['irC', 'irP', 'irH'].forEach(function (i) { $(i).addEventListener('change', draw); }); draw();
})();
