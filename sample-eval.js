/* Sample evaluation checklist with PDF download (jsPDF, self-hosted). */
(function () {
  'use strict';
  var ITEMS = [
    ['Material and workmanship', ['Material matches the agreed specification', 'Stitching, joins and finishing are clean', 'Colour matches the agreed reference', 'No unexpected odour, marks or damage']],
    ['Dimensions and specifications', ['Size matches the agreed dimensions', 'Weight is within the agreed tolerance', 'Capacity or quantity per unit is correct']],
    ['Packaging', ['Packing protects the product', 'Packing style and material are as agreed', 'Quantity per pack is correct']],
    ['Functionality', ['Product works as intended in normal use', 'Handles, closures or parts are strong and secure']],
    ['Labelling', ['Brand name and product information are correct', 'Origin and any required regulatory text are present', 'Barcodes or codes, if required, scan correctly']],
    ['Consistency with agreed requirements', ['Sample matches the written specification', 'Differences from the specification are recorded', 'I would accept this quality in the full order']]];
  var tbl = document.getElementById('seTable'); if (!tbl) return;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var n = 0; var head = el('tr'); ['Check', 'Pass', 'Concern', 'N/A'].forEach(function (h) { head.appendChild(el('th', '', h)); }); tbl.appendChild(head);
  ITEMS.forEach(function (g) {
    var gr = el('tr'), gh = el('th', '', g[0]); gh.colSpan = 4; gh.style.background = '#dde6f0'; gr.appendChild(gh); tbl.appendChild(gr);
    g[1].forEach(function (t) { n++; var tr = el('tr'); tr.appendChild(el('td', '', t));
      ['Pass', 'Concern', 'N/A'].forEach(function (v) { var td = el('td'), i = el('input'); i.type = 'radio'; i.name = 'se' + n; i.value = v; i.setAttribute('aria-label', t + ': ' + v); td.appendChild(i); tr.appendChild(td); }); tbl.appendChild(tr); });
  });
  function clean(t) { return String(t || '').replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, ''); }
  function pdf(blank) {
    if (!window.jspdf) { alert('The PDF library did not load. Please refresh and try again.'); return; }
    var d = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), y = 0, k = 0, v = function (id) { return blank ? '' : document.getElementById(id).value; };
    d.setFillColor(20, 45, 76); d.rect(0, 0, 210, 26, 'F'); d.setFillColor(224, 178, 91); d.rect(0, 26, 210, 1.3, 'F');
    d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(15); d.text('PORTWISE VENTURES', 14, 12); d.setFont('helvetica', 'normal'); d.setFontSize(10); d.text('Sample Approval Checklist', 14, 20);
    d.setTextColor(20, 45, 76); d.setFontSize(10); y = 38;
    [['Sample / product', v('seSample')], ['Supplier / reference', v('seRef')], ['Evaluator', v('seBy')], ['Date', v('seDate')]].forEach(function (r) { d.setFont('helvetica', 'bold'); d.text(r[0] + ':', 14, y); d.setFont('helvetica', 'normal'); d.text(clean(r[1]), 55, y); d.setDrawColor(180, 190, 200); d.line(55, y + 1.5, 196, y + 1.5); y += 8; });
    y += 2; d.setFont('helvetica', 'bold'); d.setFontSize(9); d.text('Pass', 140, y); d.text('Concern', 156, y); d.text('N/A', 182, y); y += 4;
    ITEMS.forEach(function (g) {
      if (y > 262) { d.addPage(); y = 20; }
      d.setFillColor(222, 230, 240); d.rect(14, y, 182, 6.5, 'F'); d.setFont('helvetica', 'bold'); d.setFontSize(10); d.setTextColor(20, 45, 76); d.text(g[0], 16, y + 4.6); y += 8.5;
      g[1].forEach(function (t) {
        k++; var sel = blank ? '' : (document.querySelector('input[name=se' + k + ']:checked') || {}).value || '';
        d.setFont('helvetica', 'normal'); d.setFontSize(9.5); d.setTextColor(40, 50, 60); var lines = d.splitTextToSize(t, 118); d.text(lines, 16, y + 3.8);
        [[140, 'Pass'], [158, 'Concern'], [182, 'N/A']].forEach(function (c) { d.setDrawColor(90, 100, 112); d.rect(c[0], y, 4.5, 4.5); if (sel === c[1]) { d.setFont('helvetica', 'bold'); d.text('X', c[0] + 1.1, y + 3.7); d.setFont('helvetica', 'normal'); } });
        y += Math.max(7.5, lines.length * 4.6 + 3);
      });
    });
    if (y > 232) { d.addPage(); y = 20; }
    y += 4; d.setFont('helvetica', 'bold'); d.setFontSize(10); d.setTextColor(20, 45, 76); d.text('Overall decision:', 14, y);
    var dec = blank ? '' : document.getElementById('seDecision').value; ['Approved', 'Approved with changes', 'Not approved'].forEach(function (o, i) { var x = 50 + i * 48; d.setDrawColor(90, 100, 112); d.rect(x, y - 3.6, 4.5, 4.5); if (dec === o) d.text('X', x + 1.1, y); d.setFont('helvetica', 'normal'); d.setFontSize(9.5); d.text(o, x + 7, y); d.setFont('helvetica', 'bold'); d.setFontSize(10); });
    y += 10; d.text('Notes:', 14, y); d.setDrawColor(180, 190, 200); for (var i = 0; i < 4; i++) { y += 8; d.line(14, y, 196, y); }
    d.setFont('helvetica', 'italic'); d.setFontSize(7.5); d.setTextColor(91, 103, 115); d.text('Prepared with the Portwise Ventures sample evaluation guide. info@portwiseventures.com | portwiseventures.com. This checklist is a guide and not a certification.', 14, 287);
    d.save(blank ? 'Portwise-sample-checklist-blank.pdf' : 'Portwise-sample-checklist.pdf');
  }
  document.getElementById('seDl').onclick = function () { pdf(false); }; document.getElementById('seBlank').onclick = function () { pdf(true); };
})();
