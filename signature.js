/* Email signature generator. Everything stays in the browser. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(u) { u = u.trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; return /^https?:\/\/([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/[^\s"'<>]*)?$/i.test(u) ? u : ''; }
  function html() {
    var n = $('sgName').value.trim(), r = $('sgRole').value.trim(), c = $('sgCompany').value.trim(), e = $('sgEmail').value.trim(), p = $('sgPhone').value.trim(), w = url($('sgWeb').value), L = $('sgLogo').checked;
    var link = 'color:#142D4C;text-decoration:none', rows = [];
    if (e && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(e)) rows.push('<div style="margin-top:6px">Email: <a href="mailto:' + esc(e) + '" style="' + link + '">' + esc(e) + '</a></div>');
    if (p) rows.push('<div>Phone: <a href="tel:' + esc(p.replace(/[^\d+]/g, '')) + '" style="' + link + '">' + esc(p) + '</a></div>');
    if (w) rows.push('<div>Web: <a href="' + esc(w) + '" style="' + link + '">' + esc(w.replace(/^https?:\/\//, '')) + '</a></div>');
    return '<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1f2a37;line-height:1.4"><tr>' +
      (L ? '<td style="padding-right:14px;border-right:3px solid #E0B25B;vertical-align:top"><img src="https://portwiseventures.com/logo-mark.png" width="39" height="55" alt="Portwise Ventures" style="display:block;border:0"/></td>' : '') +
      '<td style="' + (L ? 'padding-left:14px;' : '') + 'vertical-align:top"><div style="font-size:16px;font-weight:bold;color:#142D4C">' + esc(n || 'Your name') + '</div>' + (r ? '<div style="color:#385170">' + esc(r) + '</div>' : '') + (c ? '<div style="font-weight:bold;color:#142D4C;margin-top:4px">' + esc(c) + '</div>' : '') + rows.join('') + '<div style="margin-top:8px;font-size:11px;color:#6b7b8c;font-style:italic">Bridging Markets, Empowering Trade.</div></td></tr></table>';
  }
  function paint() { $('sgPreview').innerHTML = html(); }
  function say(t) { $('sgMsg').textContent = t; }
  ['sgName', 'sgRole', 'sgCompany', 'sgEmail', 'sgPhone', 'sgWeb', 'sgLogo'].forEach(function (id) { $(id).addEventListener('input', paint); $(id).addEventListener('change', paint); });
  function need() { if (!$('sgName').value.trim()) { var e = $('sgErr'); e.style.display = ''; e.textContent = 'Please enter your name first.'; $('sgName').focus(); return false; } $('sgErr').style.display = 'none'; return true; }
  function selectCopy() { var r = document.createRange(); r.selectNodeContents($('sgPreview')); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} s.removeAllRanges(); return ok; }
  $('sgCopy').onclick = function () { if (!need()) return; var h = html();
    if (navigator.clipboard && window.ClipboardItem) navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob([$('sgPreview').innerText], { type: 'text/plain' }) })]).then(function () { say('Signature copied. Paste it into your email signature settings.'); }, function () { say(selectCopy() ? 'Signature copied. Paste it into your email signature settings.' : 'Copy failed. Select the preview and copy it manually.'); });
    else say(selectCopy() ? 'Signature copied. Paste it into your email signature settings.' : 'Copy failed. Select the preview and copy it manually.'); };
  $('sgCode').onclick = function () { if (!need()) return; var h = html(); if (navigator.clipboard) navigator.clipboard.writeText(h).then(function () { say('HTML code copied.'); }, function () { say('Copy failed. Please try again.'); }); else say('Copy is not available in this browser.'); };
  paint();
})();
