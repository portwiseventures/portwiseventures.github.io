/* Product specification sheet (PDF) generator. Uses the self-hosted jsPDF library in /vendor. Unconfirmed values are marked, never invented. */
(function () {
  'use strict';
  var NAVY = [20, 45, 76], GOLD = [224, 178, 91], GREY = [91, 103, 115], LIGHT = [238, 242, 247];
  var LOGO = { 'EVARA': 'pw-logo-evara.jpg', 'AGRINEST': 'pw-logo-agrinest.jpg', 'PRIME CREST': 'pw-logo-primecrest.jpg', 'LOGICWISE': 'pw-logo-logicwise.jpg' };
  var NC = 'Not confirmed. Provided in your quotation.';
  function clean(t) { return String(t == null ? '' : t).replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u00A0/g, ' ').replace(/[^\x09\x0A\x0D\x20-\xFF]/g, ''); }
  function img(src) {
    return new Promise(function (res) {
      var i = new Image(); i.onload = function () { try { var c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); res({ d: c.toDataURL('image/jpeg', .85), w: i.naturalWidth, h: i.naturalHeight }); } catch (e) { res(null); } }; i.onerror = function () { res(null); }; i.src = src;
    });
  }
  function spec(p, k) { var f = (p.specs || []).filter(function (s) { return s[0] === k; })[0]; return f ? f[1] : ''; }
  function rows(p) {
    var fresh = p.brand === 'AGRINEST';
    return [
      ['Product name', p.name], ['Brand', p.brand], ['Category', p.category],
      [fresh ? 'Botanical name' : 'Item code', spec(p, fresh ? 'Botanical name' : 'Item code') || NC],
      ['Material', fresh ? 'Not applicable (fresh produce)' : NC],
      ['Dimensions / size', spec(p, 'Size') || NC],
      ['Available variations', p.variants || NC],
      ['Growing regions', fresh ? (spec(p, 'Growing regions') || NC) : null],
      ['Packaging', p.packaging && !/^Confirmed/.test(p.packaging) ? p.packaging : NC],
      ['Minimum order quantity', p.moq && !/^Confirmed/.test(p.moq) ? p.moq : NC],
      ['Country of origin', p.origin || NC], ['Availability', p.availability || NC], ['Export', p.export || NC]
    ].filter(function (r) { return r[1] !== null; });
  }
  function page(doc, p, im, logo, n, total) {
    var W = 210;
    doc.setFillColor.apply(doc, NAVY); doc.rect(0, 0, W, 34, 'F'); doc.setFillColor.apply(doc, GOLD); doc.rect(0, 34, W, 1.6, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('PORTWISE VENTURES', 14, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor.apply(doc, GOLD); doc.text('Bridging Markets, Empowering Trade.', 14, 23); doc.setTextColor(255, 255, 255); doc.text('Product Specification Sheet', 14, 29);
    if (logo) { var bw = 30, bh = 22.5; doc.setFillColor(255, 255, 255); doc.roundedRect(W - 14 - bw - 2, 5.5, bw + 4, bh + 3, 2, 2, 'F'); doc.addImage(logo.d, 'JPEG', W - 14 - bw, 7, bw, bh); }
    doc.setTextColor.apply(doc, NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    var t = doc.splitTextToSize(clean(p.name), 182); doc.text(t, 14, 49);
    var y = 49 + t.length * 8; doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor.apply(doc, GREY); doc.text(clean(p.brand + '  |  ' + p.category), 14, y); y += 6;
    var ix = 14, iw = 78, ih = 58;
    if (im) { var r = Math.min(iw / im.w, ih / im.h), dw = im.w * r, dh = im.h * r; doc.setDrawColor(221, 227, 234); doc.rect(ix, y, iw, ih); doc.addImage(im.d, 'JPEG', ix + (iw - dw) / 2, y + (ih - dh) / 2, dw, dh); }
    doc.setTextColor(40, 50, 60); doc.setFontSize(10.5); var d = doc.splitTextToSize(clean(p.description), 96); doc.text(d, 98, y + 5);
    y += ih + 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor.apply(doc, NAVY); doc.text('SPECIFICATIONS', 14, y); y += 3;
    rows(p).forEach(function (r, i) {
      var v = doc.splitTextToSize(clean(r[1]), 118), h = Math.max(7.5, v.length * 5 + 3);
      if (i % 2 === 0) { doc.setFillColor.apply(doc, LIGHT); doc.rect(14, y, 182, h, 'F'); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor.apply(doc, NAVY); doc.text(clean(r[0]), 17, y + 5);
      var unconfirmed = r[1] === NC; doc.setFont('helvetica', unconfirmed ? 'italic' : 'normal'); doc.setTextColor.apply(doc, unconfirmed ? GREY : [40, 50, 60]); doc.text(v, 72, y + 5); y += h;
    });
    y += 8; if (y > 236) y = 236;
    doc.setFillColor.apply(doc, NAVY); doc.roundedRect(14, y, 182, 30, 2, 2, 'F'); doc.setTextColor.apply(doc, GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('REQUEST A QUOTATION', 20, y + 8);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    doc.text('Email: info@portwiseventures.com    WhatsApp: +880 1575 645253', 20, y + 15); doc.text('Website: portwiseventures.com    Product page: portwiseventures.com/product.html?p=' + p.id, 20, y + 21);
    doc.setFontSize(8.5); doc.text('Tell us your quantity, destination port and packaging needs and we will reply with a quotation.', 20, y + 27);
    doc.setTextColor.apply(doc, GREY); doc.setFontSize(7.5); doc.setFont('helvetica', 'italic');
    var note = doc.splitTextToSize('Information is taken from Portwise Ventures catalogues and is subject to change. Values marked "Not confirmed" are not yet verified and will be provided in your quotation. Sizes and availability vary by season where applicable. Generated ' + new Date().toISOString().slice(0, 10) + '.', 182);
    doc.text(note, 14, 281); doc.setFont('helvetica', 'normal'); doc.text('Page ' + n + ' of ' + total, 196, 292, { align: 'right' });
  }
  window.PW = window.PW || {};
  window.PW.spec = {
    download: function (list, filename) {
      if (!window.jspdf) return Promise.reject(new Error('PDF library not loaded'));
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), logos = {};
      return Promise.all(list.map(function (p) { return Promise.all([img(p.images[0]), logos[p.brand] ? Promise.resolve(logos[p.brand]) : img(LOGO[p.brand] || 'logo-mark.png')]); })).then(function (all) {
        list.forEach(function (p, i) { if (i) doc.addPage(); page(doc, p, all[i][0], all[i][1], i + 1, list.length); });
        doc.save(filename || (list.length === 1 ? 'Portwise-' + list[0].id + '-specification.pdf' : 'Portwise-specification-sheets.pdf'));
      });
    }
  };
})();
