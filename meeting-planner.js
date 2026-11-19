/* Time zone meeting planner. Uses the browser's time zone database, so daylight saving is handled automatically. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var HOME = 'Asia/Dhaka', OPEN = 10, CLOSE = 18, DAYS = [0, 1, 2, 3, 4]; /* Sunday to Thursday, 10:00-18:00 Dhaka */
  var ZONES = [['Dubai, UAE', 'Asia/Dubai'], ['Abu Dhabi, UAE', 'Asia/Dubai'], ['Riyadh, Saudi Arabia', 'Asia/Riyadh'], ['Doha, Qatar', 'Asia/Qatar'], ['Cairo, Egypt', 'Africa/Cairo'], ['Istanbul, Turkey', 'Europe/Istanbul'], ['London, United Kingdom', 'Europe/London'], ['Dublin, Ireland', 'Europe/Dublin'], ['Paris, France', 'Europe/Paris'], ['Berlin, Germany', 'Europe/Berlin'], ['Amsterdam, Netherlands', 'Europe/Amsterdam'], ['Madrid, Spain', 'Europe/Madrid'], ['Rome, Italy', 'Europe/Rome'], ['New York, USA', 'America/New_York'], ['Chicago, USA', 'America/Chicago'], ['Denver, USA', 'America/Denver'], ['Los Angeles, USA', 'America/Los_Angeles'], ['Toronto, Canada', 'America/Toronto'], ['Vancouver, Canada', 'America/Vancouver'], ['Mumbai / Delhi, India', 'Asia/Kolkata'], ['Karachi, Pakistan', 'Asia/Karachi'], ['Dhaka, Bangladesh', 'Asia/Dhaka'], ['Singapore', 'Asia/Singapore'], ['Kuala Lumpur, Malaysia', 'Asia/Kuala_Lumpur'], ['Hong Kong', 'Asia/Hong_Kong'], ['Shanghai, China', 'Asia/Shanghai'], ['Tokyo, Japan', 'Asia/Tokyo'], ['Seoul, South Korea', 'Asia/Seoul'], ['Sydney, Australia', 'Australia/Sydney'], ['Melbourne, Australia', 'Australia/Melbourne'], ['Perth, Australia', 'Australia/Perth'], ['Auckland, New Zealand', 'Pacific/Auckland'], ['Johannesburg, South Africa', 'Africa/Johannesburg'], ['Nairobi, Kenya', 'Africa/Nairobi'], ['Lagos, Nigeria', 'Africa/Lagos']];
  var OTHERS = [['Dubai', 'Asia/Dubai'], ['London', 'Europe/London'], ['Toronto', 'America/Toronto'], ['Sydney', 'Australia/Sydney'], ['Auckland', 'Pacific/Auckland']];
  function fmt(ms, tz, o) { return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: tz }, o)).format(new Date(ms)); }
  function parts(ms, tz) { var p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; }); return p; }
  function dateKey(ms, tz) { var p = parts(ms, tz); return p.year + '-' + p.month + '-' + p.day; }
  var sel = $('mpZone'), dev = ''; try { dev = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
  if (dev) { var o = el('option', '', 'Use my device time zone (' + dev + ')'); o.value = dev; sel.appendChild(o); }
  ZONES.forEach(function (z) { var o = el('option', '', z[0]); o.value = z[1]; sel.appendChild(o); });
  var d0 = new Date(); $('mpDate').min = d0.toISOString().slice(0, 10); var def = new Date(d0.getTime() + 2 * 864e5); $('mpDate').value = def.toISOString().slice(0, 10);
  function listFor(key, tz) {
    var y = +key.slice(0, 4), m = +key.slice(5, 7), d = +key.slice(8, 10), list = [];
    for (var off = -1; off <= 1; off++) for (var h = OPEN; h < CLOSE; h++) for (var mi = 0; mi < 60; mi += 30) {
      var utc = Date.UTC(y, m - 1, d + off, h - 6, mi); /* Dhaka is UTC+6 all year */
      var dh = new Date(Date.UTC(y, m - 1, d + off)).getUTCDay(); if (DAYS.indexOf(dh) < 0) continue; if (dateKey(utc, tz) !== key) continue; if (utc < Date.now()) continue; list.push(utc);
    }
    return list.sort(function (a, b) { return a - b; });
  }
  function slots(auto) {
    var tz = sel.value, key = $('mpDate').value, box = $('mpSlots'), err = $('mpErr'); box.innerHTML = ''; $('mpReq').hidden = true; $('mpOut').innerHTML = '<span class="hint">Choose a time to see it in each time zone.</span>';
    if (!key) { err.style.display = ''; err.textContent = 'Please choose a date.'; return; } err.style.display = 'none';
    var list = listFor(key, tz);
    if (!list.length && auto) { for (var i = 1; i <= 8 && !list.length; i++) { var t = new Date(key + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + i); var k2 = t.toISOString().slice(0, 10); list = listFor(k2, tz); if (list.length) { key = k2; $('mpDate').value = k2; } } }
    if (!list.length) { box.appendChild(el('p', 'sm', 'No Dhaka availability falls on that date in your time zone (we are available Sunday to Thursday, 10:00 to 18:00 Dhaka time). Please try another date.')); return; }
    list.forEach(function (utc) { var b = el('button', 'btn2', fmt(utc, tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })); b.type = 'button'; b.style.background = '#fff'; b.style.cursor = 'pointer'; b.onclick = function () { pick(utc, tz, b); }; box.appendChild(b); });
  }
  function pick(utc, tz, btn) {
    [].slice.call($('mpSlots').children).forEach(function (x) { x.style.background = '#fff'; x.style.color = ''; }); btn.style.background = '#142D4C'; btn.style.color = '#fff';
    var out = $('mpOut'); out.innerHTML = ''; var long = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' };
    function row(k, v) { var r = el('div', 'row'); r.appendChild(el('span', '', k)); r.appendChild(el('b', '', v)); out.appendChild(r); }
    var local = fmt(utc, tz, long), dh = fmt(utc, HOME, long); out.appendChild(el('span', 'big', fmt(utc, tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) + ' your time'));
    row('Your local time', local); row('Dhaka time', dh + (dateKey(utc, tz) !== dateKey(utc, HOME) ? ' (different date)' : '')); row('UTC', fmt(utc, 'UTC', long));
    OTHERS.forEach(function (z) { if (z[1] !== tz) row(z[0], fmt(utc, z[1], long)); });
    out.appendChild(el('span', 'hint', 'Times use each place\u2019s daylight saving rules for that date.'));
    $('mpTz').value = tz; $('mpLocal').value = local; $('mpDhaka').value = dh; $('mpUtc').value = new Date(utc).toISOString(); $('mpReq').hidden = false; $('mpReq').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  sel.onchange = function () { slots(true); }; $('mpDate').onchange = function () { slots(false); }; slots(true);
})();
