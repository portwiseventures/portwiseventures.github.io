/* Portwise Ventures product shortlist. No account needed: the list is kept in this browser only (7 days) and is sent to us only if the visitor submits an enquiry. */
(function () {
  'use strict';
  var KEY = 'pw_shortlist', TTL = 7 * 864e5, subs = [];
  function read() { try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.ids) && Date.now() - d.t < TTL) return d.ids; } catch (e) {} return []; }
  function write(ids) { try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), ids: ids })); } catch (e) {} subs.forEach(function (f) { f(ids); }); }
  var sl = {
    get: read, count: function () { return read().length; }, has: function (id) { return read().indexOf(id) > -1; },
    add: function (id) { var a = read(); if (a.indexOf(id) < 0) { a.push(id); write(a); } },
    remove: function (id) { write(read().filter(function (x) { return x !== id; })); },
    toggle: function (id) { if (sl.has(id)) sl.remove(id); else sl.add(id); },
    clear: function () { write([]); }, on: function (f) { subs.push(f); }
  };
  window.PW = window.PW || {}; window.PW.sl = sl;
  /* Floating shortlist shortcut (hidden when the list is empty and on the shortlist page) */
  function pill() {
    if (/shortlist\.html/.test(location.pathname)) return;
    var a = document.createElement('a'); a.href = 'shortlist.html'; a.className = 'slpill'; a.setAttribute('aria-label', 'Open product shortlist');
    a.style.cssText = 'position:fixed;left:14px;bottom:18px;z-index:55;background:#142D4C;color:#fff;border:2px solid #E0B25B;border-radius:24px;padding:10px 16px;font:700 14px Arial,sans-serif;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.3);display:none';
    function paint() { var n = sl.count(); a.textContent = '\u2605 Shortlist (' + n + ')'; a.style.display = n ? 'inline-block' : 'none'; }
    document.body.appendChild(a); paint(); sl.on(paint);
    window.addEventListener('storage', paint);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pill); else pill();
})();
