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
  var started = typeof WeakSet === 'function' ? new WeakSet() : null;
  function track(name, props) {
    if (window.__pwAnalyticsProvider === 'ga4' && get() === 'granted' && window.gtag) window.gtag('event', name, props || {});
    if (window.__pwAnalyticsProvider === 'plausible' && window.plausible) window.plausible(name, { props: props || {} });
  }
  document.addEventListener('focusin', function (e) {
    var f = e.target.closest && e.target.closest('form'); if (!f || (started && started.has(f))) return;
    if (started) started.add(f); track('form_start', { form_id: f.id || 'form' });
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || f.tagName !== 'FORM') return;
    if (f.id === 'tsForm') track('trade_statistics_search', { page: 'trade-statistics' });
    else if (f.id === 'smartEnquiry' || f.hasAttribute('data-formemail')) track('enquiry_submit', { form_id: f.id || 'enquiry' });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return; var href = a.getAttribute('href') || '';
    if (/^(rfq-|.*\.(pdf|docx))(\?|$)/i.test(href)) track('resource_download', { resource: href.split('?')[0] });
    else if (/specification|comparison|guide\.txt/i.test(a.download || '')) track('specification_download', { resource: a.download || 'download' });
    else if (/^(product|marketplace|evara|agrinest|primecrest)\.html/i.test(href)) track('product_interest', { page: href.split('?')[0] });
    else if (/import-requirements|trade-agreements|trade-statistics/.test(href)) track('trade_guide_visit', { page: href.split(/[?#]/)[0] });
    if (a.hasAttribute('data-add-shortlist') || a.classList.contains('add-shortlist')) track('product_shortlist_add', {});
    var button = e.target.closest && e.target.closest('button'); if (button && /shortlist/i.test(button.textContent)) track('product_shortlist_add', {});
  });
  if (!window.fetch) return;
  fetch('site-config.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (c) {
    var a = c && c.analytics; if (!a || !a.provider || !a.id) return;
    if (a.provider === 'plausible' && /^[a-z0-9.-]+$/i.test(a.id)) { window.__pwAnalyticsProvider = 'plausible'; var s = document.createElement('script'); s.defer = true; s.setAttribute('data-domain', a.id); s.src = 'https://plausible.io/js/script.js'; document.head.appendChild(s); track('page_view', { page: location.pathname }); if (/(product|marketplace|evara|agrinest|primecrest)\.html/i.test(location.pathname)) track('product_page_visit', { page: location.pathname.split('/').pop() }); if (/country|import-requirements/i.test(location.pathname)) track('country_guide_visit', { page: location.pathname.split('/').pop() }); if (/thanks\.html/i.test(location.pathname)) track('enquiry_success', { page: 'thanks' }); return; }
    if (a.provider !== 'ga4') return;
    window.__pwAnalyticsProvider = 'ga4';
    footerLink(a.id);
    var v = get(); if (v === 'granted') { loadGA(a.id); track('page_view', { page: location.pathname }); if (/(product|marketplace|evara|agrinest|primecrest)\.html/i.test(location.pathname)) track('product_page_visit', { page: location.pathname.split('/').pop() }); if (/country|import-requirements/i.test(location.pathname)) track('country_guide_visit', { page: location.pathname.split('/').pop() }); if (/thanks\.html/i.test(location.pathname)) track('enquiry_success', { page: 'thanks' }); } else if (v !== 'denied') banner(a.id);
  });
})();
