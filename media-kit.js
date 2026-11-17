(function () { 'use strict';
  function copy(t, b) { var done = function () { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () {}); }
  [].slice.call(document.querySelectorAll('.cphex')).forEach(function (b) { b.onclick = function () { copy(b.getAttribute('data-hex'), b); }; });
  [].slice.call(document.querySelectorAll('.cptxt')).forEach(function (b) { b.onclick = function () { copy(b.getAttribute('data-t'), b); }; });
})();
