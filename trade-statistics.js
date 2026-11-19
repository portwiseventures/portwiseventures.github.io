/* Statistics Explorer: summarises the user's search and links to official sources. No data is shown or invented. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var SRC = [['UN Comtrade (official UN trade database)', 'https://comtradeplus.un.org/'], ['ITC Trade Map (access and licensing may apply)', 'https://www.trademap.org/'], ['World Bank WITS (trade and tariff data)', 'https://wits.worldbank.org/'], ['World Bank Open Data', 'https://data.worldbank.org/'], ['Bangladesh Export Promotion Bureau', 'https://epb.gov.bd/'], ['Bangladesh Bureau of Statistics', 'https://bbs.gov.bd/']];
  function draw() {
    var o = $('tsOut'); o.innerHTML = ''; var cat = $('tsCat'), ex = $('tsEx').value.trim(), im = $('tsIm').value.trim(), hs = $('tsHs').value.trim(), yr = $('tsYear').value;
    var ul = el('ul', 'ben'); [['Exporter', ex || 'any'], ['Importer', im || 'any'], ['Product', (cat.value ? cat.selectedOptions[0].text + ' (HS chapter ' + cat.value + ')' : 'not chosen')], ['HS code', hs || 'not entered'], ['Year', yr || 'latest available'], ['Direction', $('tsDir').value]].forEach(function (x) { var li = el('li'); li.appendChild(el('b', '', x[0] + ': ')); li.appendChild(document.createTextNode(x[1])); ul.appendChild(li); }); o.appendChild(ul);
    o.appendChild(el('p', 'sm', 'Enter these filters in one of the official sources below. Check the reporting period and whether the data is complete before drawing conclusions.'));
    var r = el('div', 'pr'); SRC.forEach(function (s) { var a = el('a', 'btn2', s[0]); a.href = s[1]; a.target = '_blank'; a.rel = 'noopener'; r.appendChild(a); }); o.appendChild(r);
  }
  ['tsEx', 'tsIm', 'tsCat', 'tsHs', 'tsYear', 'tsDir'].forEach(function (i) { $(i).addEventListener('input', draw); $(i).addEventListener('change', draw); }); draw();
})();
