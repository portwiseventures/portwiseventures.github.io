/* Prefills the application when arriving from an opportunity: partner-with-us.html?opportunity=<title> */
(function () { 'use strict'; var q = new URLSearchParams(location.search).get('opportunity'); if (!q) return;
  var f = document.getElementById('pfOpp'), n = document.getElementById('pfNote'); if (f) f.value = q; if (n) { n.style.display = ''; n.textContent = 'You are applying for the opportunity: ' + q; } })();
