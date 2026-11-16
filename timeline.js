/* Timeline helper: expand or collapse all stages. */
(function () { 'use strict'; var b = document.getElementById('tlAll'); if (!b) return; var open = false;
  b.onclick = function () { open = !open; [].slice.call(document.querySelectorAll('.tl details')).forEach(function (d) { d.open = open; }); b.textContent = open ? 'Collapse all stages' : 'Expand all stages'; }; })();
