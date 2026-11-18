/* Shared helper for branded PDFs made with the self-hosted jsPDF library. */
(function () {
  'use strict';
  window.PW = window.PW || {};
  function clean(t) { return String(t == null ? '' : t).replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[^\x09\x0A\x0D\x20-\xFF]/g, ''); }
  PW.pdf = {
    clean: clean,
    start: function (title) {
      if (!window.jspdf) throw new Error('PDF library not loaded');
      var d = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      d.setFillColor(20, 45, 76); d.rect(0, 0, 210, 26, 'F'); d.setFillColor(224, 178, 91); d.rect(0, 26, 210, 1.3, 'F');
      d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(15); d.text('PORTWISE VENTURES', 14, 12);
      d.setFont('helvetica', 'normal'); d.setFontSize(10); d.text(clean(title), 14, 20); return d;
    },
    footer: function (d, note) {
      var n = d.getNumberOfPages(); for (var i = 1; i <= n; i++) { d.setPage(i); d.setFont('helvetica', 'italic'); d.setFontSize(7.5); d.setTextColor(91, 103, 115);
        d.text(d.splitTextToSize(clean(note), 182), 14, 284); d.setFont('helvetica', 'normal'); d.text('info@portwiseventures.com | portwiseventures.com | Page ' + i + ' of ' + n, 196, 292, { align: 'right' }); }
    }
  };
})();
