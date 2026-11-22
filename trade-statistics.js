/* Trade Statistics Explorer powered by the UN Comtrade public preview API.
   Preview is key-free and limited to 500 records per request; this is not a complete dataset. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var src = 'https://comtrade.un.org/en/api-docs';
  function node(tag, cls, value) { var n = document.createElement(tag); if (cls) n.className = cls; if (value != null) n.textContent = value; return n; }
  function sourceLink(label, url) { var a = node('a', 'btn2', label); a.href = url; a.target = '_blank'; a.rel = 'noopener'; return a; }
  function params(reporter, partner, product, year, flow) {
    var p = new URLSearchParams({ reporterCode: reporter, partnerCode: partner, cmdCode: product, period: year, flowCode: flow });
    return 'https://comtradeapi.un.org/public/v1/preview/C/A/HS?' + p.toString();
  }
  function drawSources() {
    var out = $('tsOut'); out.innerHTML = '';
    out.appendChild(node('p', 'sm', 'The chart below uses UN Comtrade reported trade values. Open the source to inspect the query and metadata. Other official and licensed resources are listed here.'));
    var row = node('div', 'pr');
    [['UN Comtrade API and query documentation', src], ['ITC Trade Map (access may require registration)', 'https://www.trademap.org/'], ['World Bank WITS', 'https://wits.worldbank.org/'], ['Bangladesh Export Promotion Bureau', 'https://epb.gov.bd/'], ['Bangladesh Bureau of Statistics', 'https://bbs.gov.bd/']].forEach(function (x) { row.appendChild(sourceLink(x[0], x[1])); });
    out.appendChild(row);
  }
  function lineChart(rows) {
    var w = 720, h = 260, pad = 48, vals = rows.map(function (x) { return x.value; }), max = Math.max.apply(null, vals) || 1, min = Math.min.apply(null, vals), range = max - min || max;
    var points = rows.map(function (x, i) { return [pad + (rows.length < 2 ? 0 : i * (w - 2 * pad) / (rows.length - 1)), h - pad - (x.value - min) * (h - 2 * pad) / range]; });
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'UN Comtrade trade value by year'); svg.style.cssText = 'width:100%;max-width:900px;background:#fff;border:1px solid #dde3ea;border-radius:8px';
    function elem(tag, attrs, text) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (text) e.textContent = text; svg.appendChild(e); }
    elem('line', {x1:pad,y1:h-pad,x2:w-pad,y2:h-pad,stroke:'#9aa7b5'});
    elem('polyline', {fill:'none',stroke:'#142D4C','stroke-width':'3',points:points.map(function (p) { return p.join(','); }).join(' ')});
    points.forEach(function (p, i) { elem('circle', {cx:p[0],cy:p[1],r:5,fill:'#E0B25B'}); elem('text', {x:p[0],y:h-pad+22,'text-anchor':'middle','font-size':'12',fill:'#385170'}, rows[i].year); });
    elem('text', {x:pad,y:20,'font-size':'12',fill:'#385170'}, 'Trade value (current US$)');
    elem('text', {x:pad,y:h-8,'font-size':'11',fill:'#5b6773'}, '$' + min.toLocaleString()); elem('text', {x:pad,y:40,'font-size':'11',fill:'#5b6773'}, '$' + max.toLocaleString());
    return svg;
  }
  function display(records, errors, details) {
    var status = $('tsStatus'), chart = $('tsChart'), table = $('tsTable'), download = $('tsDownload'); chart.innerHTML = ''; table.innerHTML = ''; download.innerHTML = '';
    if (!records.length) { status.textContent = errors.length ? 'No data could be loaded. The source may be temporarily unavailable, the query may have no reported data, or browser access may be blocked. Try another year or product, then open UN Comtrade directly.' : 'The source returned no records for these filters. This is a data-unavailable result, not a zero trade value.'; status.appendChild(document.createTextNode(' ')); status.appendChild(sourceLink('Open UN Comtrade API documentation', src)); return; }
    var groups = {};
    records.forEach(function (r) { var key = r.series; (groups[key] = groups[key] || []).push(r); });
    Object.keys(groups).forEach(function (key) { groups[key].sort(function (a,b) { return a.year-b.year; }); var g = groups[key]; if (g.length > 1) { chart.appendChild(node('h3','',key)); chart.appendChild(lineChart(g)); } });
    var note = node('p', 'srcnote', records.length + ' record(s) returned. Data source: UN Comtrade public preview. Query: ' + details + '. Figures may be incomplete; reporting years and partner coverage vary.'); chart.appendChild(note);
    var wrap = node('div', 'tablewrap'); var t = node('table', 'data-table');
    var head = node('thead'), hr = node('tr'); ['Reporting country','Direction','Partner','Product code','Year','Trade value (US$)','Net weight (kg)'].forEach(function (x) { hr.appendChild(node('th','',x)); }); head.appendChild(hr); t.appendChild(head);
    var body = node('tbody'); records.sort(function (a,b) { return a.year-b.year || a.reporter.localeCompare(b.reporter); }).forEach(function (r) { var tr = node('tr'); [r.reporter,r.flow,r.partner,r.product,r.year,r.value.toLocaleString(undefined,{maximumFractionDigits:0}),r.weight ? r.weight.toLocaleString(undefined,{maximumFractionDigits:0}) : 'Not reported'].forEach(function (x) { tr.appendChild(node('td','',String(x))); }); body.appendChild(tr); }); t.appendChild(body); wrap.appendChild(t); table.appendChild(wrap);
    var csv = ['Reporting country,Direction,Partner,Product code,Year,Trade value USD,Net weight kg'].concat(records.map(function (r) { return [r.reporter,r.flow,r.partner,r.product,r.year,r.value,r.weight].map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g,'""') + '"'; }).join(','); })).join('\r\n');
    var a = node('a','btn','Download CSV'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download = 'portwise-un-comtrade-preview.csv'; download.appendChild(a); download.appendChild(sourceLink('View source and methodology', src));
    if (errors.length) { status.textContent = 'Some requests failed; the displayed records are partial. Check the official source before comparing countries or years.'; }
    else status.textContent = 'Preview loaded. These official reports can be revised and may not be comparable across reporters or years.';
  }
  async function load(ev) {
    if (ev) ev.preventDefault(); var status = $('tsStatus');
    var ex = $('tsEx').value, im = $('tsIm').value, flow = $('tsDir').value, product = $('tsHs').value.trim() || $('tsCat').value, latest = Number($('tsYear').value) || new Date().getFullYear() - 1, count = Number($('tsRange').value) || 1;
    if (!/^\d{2,6}$/.test(product) && product !== 'TOTAL') { status.textContent = 'Enter a valid HS product code or choose a product category.'; return; }
    if (latest < 1990 || latest > new Date().getFullYear()) { status.textContent = 'Enter a year between 1990 and the current year.'; return; }
    var queries = [], years = []; for (var y = latest - count + 1; y <= latest; y++) years.push(y);
    years.forEach(function (year) {
      if (flow === 'X' || flow === 'B') queries.push({url:params(ex,im,product,year,'X'),reporter:$('tsEx').selectedOptions[0].text,partner:$('tsIm').selectedOptions[0].text,flow:'Exports'});
      if (flow === 'M' || flow === 'B') queries.push({url:params(im,ex,product,year,'M'),reporter:$('tsIm').selectedOptions[0].text,partner:$('tsEx').selectedOptions[0].text,flow:'Imports'});
    });
    status.textContent = 'Loading official UN Comtrade preview…'; $('tsChart').innerHTML=''; $('tsTable').innerHTML=''; $('tsDownload').innerHTML='';
    var results = await Promise.all(queries.map(async function (q) { try { var response = await fetch(q.url); if (!response.ok) throw new Error('HTTP ' + response.status); var data = await response.json(); return {q:q,data:data}; } catch (e) { return {q:q,error:e}; } }));
    var records = [], errors = [];
    results.forEach(function (item) {
      if (item.error) { errors.push(item.error); return; }
      (item.data.data || []).forEach(function (r) { var n = Number(r.primaryValue); if (!isFinite(n)) return; records.push({year:Number(r.refYear || r.period),value:n,weight:Number(r.netWgt)||0,reporter:item.q.reporter,flow:item.q.flow,partner:r.partnerDesc || (r.partnerCode === 0 ? 'World' : item.q.partner),product:r.cmdCode || product,series:item.q.reporter + ' / ' + item.q.flow}); });
    });
    display(records,errors, years.join(', ') + '; HS ' + product + '; bilateral reporter pair');
  }
  drawSources(); $('tsForm').addEventListener('submit', load);
  $('tsForm').addEventListener('change', function () { $('tsStatus').textContent = 'Filters changed. Load a preview to refresh the results.'; });
})();
