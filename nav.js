/* Portwise Ventures navigation: mobile menu button and dropdown toggles. Desktop dropdowns also open on hover and keyboard focus (CSS). */
(function () {
  'use strict';
  var nav = document.getElementById('site-nav'), btn = document.querySelector('.navtoggle');
  if (!nav) return;
  function closeAll(except) { var o = nav.querySelectorAll('li.dd.open'); for (var i = 0; i < o.length; i++) if (o[i] !== except) { o[i].classList.remove('open'); o[i].querySelector('.car').setAttribute('aria-expanded', 'false'); } }
  if (btn) btn.addEventListener('click', function () { var open = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); if (!open) closeAll(); });
  var cars = nav.querySelectorAll('.car');
  for (var i = 0; i < cars.length; i++) cars[i].addEventListener('click', function (e) {
    e.preventDefault(); var li = this.parentNode, open = !li.classList.contains('open'); closeAll(li);
    li.classList.toggle('open', open); this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeAll(); if (btn && nav.classList.contains('open')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); } } });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target) && !(btn && btn.contains(e.target))) closeAll(); });
})();
