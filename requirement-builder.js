/* Buyer Requirement Builder: step-by-step form, review, structured enquiry, email fallback. */
(function () {
  'use strict';
  var f = document.getElementById('rb'); if (!f) return;
  var $ = function (id) { return document.getElementById(id); }, steps = [].slice.call(f.querySelectorAll('.step')), cur = 0, prog = [].slice.call($('rbProg').children);
  function show(n) {
    cur = n; steps.forEach(function (s, i) { s.hidden = i !== n; }); prog.forEach(function (l, i) { l.className = i === n ? 'on' : (i < n ? 'done' : ''); });
    $('rbBack').style.display = n ? '' : 'none'; $('rbNext').style.display = n < steps.length - 1 ? '' : 'none'; $('rbSubmit').style.display = n === steps.length - 1 ? '' : 'none'; $('rbFallback').style.display = n === steps.length - 1 ? '' : 'none';
    $('rbErr').style.display = 'none'; if (n === steps.length - 1) review();
    var first = steps[n].querySelector('input,select,textarea'); if (first && n) first.focus({ preventScroll: true }); f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function valid() {
    var bad = null, els = steps[cur].querySelectorAll('input,select,textarea');
    for (var i = 0; i < els.length; i++) if (!els[i].checkValidity()) { bad = els[i]; break; }
    if (bad) { var e = $('rbErr'); e.style.display = ''; e.textContent = 'Please complete the required field' + (bad.labels && bad.labels[0] ? ': ' + (bad.labels[0].firstChild ? bad.labels[0].firstChild.textContent : '').replace(/\s*\*$/, '').trim() : '') + '.'; bad.focus(); return false; }
    return true;
  }
  function data() {
    var fd = new FormData(f), o = [], g = function (k) { return fd.getAll(k).filter(Boolean).join(', '); };
    [['Brand / category', g('brand')], ['Product or service', g('product')], ['Required specifications', g('specifications')], ['Quantity', g('quantity')], ['Packaging requirements', g('packaging')], ['Customisation', g('custom')], ['Customisation details', g('custom_details')], ['Destination country', g('destination_country')], ['Destination port', g('destination_port')], ['Purchasing timeline', g('timeline')], ['Additional comments', g('comments')], ['Company', g('company')], ['Contact person', g('name')], ['Email', g('email')], ['Phone / WhatsApp', g('phone')], ['Country', g('country')]].forEach(function (r) { if (r[1]) o.push(r); });
    return o;
  }
  function review() {
    var box = $('rbReview'), d = data(); box.innerHTML = '';
    d.forEach(function (r) { var row = document.createElement('div'); row.className = 'row'; var a = document.createElement('span'); a.textContent = r[0]; var b = document.createElement('b'); b.textContent = r[1]; b.style.textAlign = 'right'; b.style.maxWidth = '60%'; row.appendChild(a); row.appendChild(b); box.appendChild(row); });
    var txt = d.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n'); $('rbSummary').value = txt;
    $('rbMail').href = 'mailto:info@portwiseventures.com?subject=' + encodeURIComponent('Buyer requirement: ' + (d[1] ? d[1][1] : '')) + '&body=' + encodeURIComponent(txt);
    $('rbWa').href = 'https://wa.me/8801575645253?text=' + encodeURIComponent('Hello Portwise Ventures, my requirement:\n' + txt);
  }
  $('rbNext').onclick = function () { if (valid()) show(cur + 1); };
  $('rbBack').onclick = function () { show(cur - 1); };
  f.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && cur < steps.length - 1) { e.preventDefault(); $('rbNext').click(); } });
  f.addEventListener('submit', function (e) { for (var i = 0; i < steps.length - 1; i++) { cur = i; if (!valid()) { e.preventDefault(); show(i); return; } } review(); });
  /* Prefill from links: ?brand=, ?product=, ?topic=packaging, ?from=shortlist */
  var u = new URLSearchParams(location.search), pre = [];
  var br = (u.get('brand') || '').toUpperCase().replace('-', ' '); if (br) [].slice.call($('rbBrand').options).forEach(function (o) { if (o.text.toUpperCase().indexOf(br) === 0) { o.selected = true; } });
  if (u.get('product')) $('rbProduct').value = u.get('product');
  if (u.get('topic') === 'packaging') { [].slice.call(f.querySelectorAll('input[name=custom]')).forEach(function (c) { if (/Private|branding|labelling|dimensions/.test(c.value)) c.checked = true; }); pre.push('We have ticked the customisation options for a custom packaging enquiry. Please adjust them.'); }
  if (u.get('from') === 'shortlist' && window.PW) fetch('products.json').then(function (r) { return r.json(); }).then(function (all) { var l = PW.sl.get().map(function (id) { return all.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean); if (l.length) { $('rbProduct').value = l.map(function (p) { return p.name + ' (' + p.brand + ')'; }).join('; '); } });
  if (pre.length) { var n = $('rbPre'); n.style.display = ''; n.textContent = pre.join(' '); }
  show(0);
})();
