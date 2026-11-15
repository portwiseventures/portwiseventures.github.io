/* Portwise Ventures: consent-aware analytics.
   Nothing loads and no banner appears until an analytics account is added to site-config.json:
   "analytics": {"provider": "ga4", "id": "G-XXXXXXXXXX"}   (asks for consent first, then loads Google Analytics 4)
   "analytics": {"provider": "plausible", "id": "portwiseventures.com"}   (cookieless, loads without a banner) */
(function () {
  'use strict';
  var KEY = 'pw_consent';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA(id) {
    if (window.__pwga || !/^G-[A-Z0-9]+$/.test(id)) return; window.__pwga = 1;
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', id, { anonymize_ip: true });
  }
  function banner(id) {
    if (document.getElementById('pwcookie')) return;
    var b = document.createElement('div'); b.id = 'pwcookie'; b.className = 'cookiebar'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookie consent');
    b.innerHTML = '<div>We would like to use analytics cookies to understand how this website is used and improve it. Essential pages work without them. See our <a href="privacy.html">Privacy Policy</a>.</div><div class="cb"><button class="ok" type="button">Accept analytics</button><button class="no" type="button">Decline</button></div>';
    b.querySelector('.ok').onclick = function () { set('granted'); b.remove(); loadGA(id); };
    b.querySelector('.no').onclick = function () { set('denied'); b.remove(); };
    document.body.appendChild(b);
  }
  function footerLink(id) {
    var f = document.querySelector('footer'); if (!f || document.getElementById('pwcs')) return;
    var a = document.createElement('a'); a.href = '#'; a.id = 'pwcs'; a.textContent = 'Cookie settings';
    a.onclick = function (e) { e.preventDefault(); set(''); banner(id); };
    var d = f.querySelector('div') || f; d.appendChild(document.createTextNode(' · ')); d.appendChild(a);
  }
  if (!window.fetch) return;
  fetch('site-config.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (c) {
    var a = c && c.analytics; if (!a || !a.provider || !a.id) return;
    if (a.provider === 'plausible' && /^[a-z0-9.-]+$/i.test(a.id)) { var s = document.createElement('script'); s.defer = true; s.setAttribute('data-domain', a.id); s.src = 'https://plausible.io/js/script.js'; document.head.appendChild(s); return; }
    if (a.provider !== 'ga4') return;
    footerLink(a.id);
    var v = get(); if (v === 'granted') loadGA(a.id); else if (v !== 'denied') banner(a.id);
  });
})();
