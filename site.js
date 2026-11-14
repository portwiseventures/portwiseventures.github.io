/* Portwise Ventures - site.js
   Fills in contact details everywhere and (optionally) applies text/config overrides.
   Edit the defaults below, or add site-config.json / site-content.json next to this file. */
(function () {
  'use strict';
  var C = { email: 'info@portwiseventures.com', phone: '+880 1575 645253', whatsapp: '8801575645253', formEmail: '' };

  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function each(sel, fn) { var n = document.querySelectorAll(sel); for (var i = 0; i < n.length; i++) fn(n[i]); }

  function applyContact() {
    each('[data-set="email"]', function (a) { a.setAttribute('href', 'mailto:' + C.email); });
    each('[data-txt="email"]', function (s) { s.textContent = C.email; });
    each('[data-txt="phone"]', function (s) { s.textContent = C.phone; });
    each('[data-set="wa"]', function (a) {
      var h = a.getAttribute('href') || '', q = h.indexOf('?') > -1 ? h.slice(h.indexOf('?')) : '';
      a.setAttribute('href', 'https://wa.me/' + digits(C.whatsapp) + q);
    });
    if (C.formEmail) {
      each('form[data-formemail]', function (f) { f.setAttribute('action', 'https://formsubmit.co/' + C.formEmail); });
    }
  }

  function applyContent(map) {
    each('[data-key]', function (el) {
      var k = el.getAttribute('data-key');
      if (Object.prototype.hasOwnProperty.call(map, k) && typeof map[k] === 'string') {
        if (el.getAttribute('data-rich') === '1') el.innerHTML = map[k]; else el.textContent = map[k];
      }
    });
  }

  function load(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }


  // Prefill the existing quote form when a visitor arrives from a trade tool.
  function prefillQuote() {
    var form = document.querySelector('form[data-formemail]');
    if (!form) return;
    var q = new URLSearchParams(window.location.search);
    var brand = q.get('brand'), product = q.get('product'), type = q.get('type'), samples = q.get('samples');
    var msg = form.querySelector('[name="details"]');
    var brandField = form.querySelector('[name="brand"]');
    var sampleField = form.querySelector('[name="samples"]');
    if (brand && brandField) {
      var opts = Array.prototype.slice.call(brandField.options);
      var match = opts.find(function(o){return o.text.toLowerCase().indexOf(brand.toLowerCase())>-1;});
      if (match) brandField.value = match.value;
    }
    if (product && form.querySelector('[name="product"]')) form.querySelector('[name="product"]').value = product;
    if (samples === 'yes' && sampleField) sampleField.value = 'Yes';
    if (msg && (type || q.get('interest'))) {
      var prefix = type === 'custom' ? 'Custom product request. ' : type === 'bulk' ? 'Bulk order enquiry. ' : '';
      prefix += q.get('interest') ? 'Enquiry type: ' + q.get('interest') + '. ' : '';
      msg.value = prefix + msg.value;
    }
  }

  applyContact();
  prefillQuote();
  if (window.fetch) {
    load('site-config.json').then(function (cfg) {
      if (cfg) {
        if (cfg.email) C.email = cfg.email;
        if (cfg.phone) C.phone = cfg.phone;
        if (cfg.whatsapp) C.whatsapp = cfg.whatsapp;
        if (cfg.formEmail) C.formEmail = cfg.formEmail;
        applyContact();
      }
    });
    load('site-content.json').then(function (map) { if (map && typeof map === 'object') applyContent(map); });
  }
})();
