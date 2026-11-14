/* Portwise Ventures product page. Reads product.html?p=<id> from products.json. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var id = new URLSearchParams(location.search).get('p');
  function nf() { $('pwrap').style.display = 'none'; $('nf').style.display = ''; document.title = 'Product not found | Portwise Ventures'; }
  fetch('products.json').then(function (r) { return r.json(); }).then(function (all) {
    var p = all.filter(function (x) { return x.id === id; })[0];
    if (!p) return nf();
    document.title = p.name + ' (' + p.brand + ') | Portwise Ventures';
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', p.name + ' from ' + p.brand + ', Portwise Ventures. ' + p.description);
    var cu = 'https://portwiseventures.com/product.html?p=' + encodeURIComponent(p.id);
    var cl = document.querySelector('link[rel="canonical"]'); if (cl) cl.setAttribute('href', cu);
    $('crumb').textContent = p.name;
    $('cbrand').textContent = p.brand; $('cbrand').href = 'marketplace.html?brand=' + encodeURIComponent(p.brand.replace(' ', '-'));
    $('pname').textContent = p.name; $('pbrand').textContent = p.brand + ' · ' + p.category; $('pdesc').textContent = p.description;
    var main = $('mainimg'); main.src = p.images[0]; main.alt = p.name + ' (' + p.brand + ')';
    var th = $('thumbs');
    if (p.images.length > 1) p.images.forEach(function (s) { var t = el('img'); t.src = s; t.alt = p.name; t.onclick = function () { main.src = s; }; th.appendChild(t); });
    var rows = p.specs.slice();
    rows.push(['Country of origin', p.origin]);
    if (p.variants) rows.push(['Available variants', p.variants]);
    rows.push(['Packaging', p.packaging], ['Minimum order quantity', p.moq], ['Availability', p.availability], ['Export', p.export]);
    var tb = $('spec'); rows.forEach(function (r) { var tr = el('tr'); tr.appendChild(el('th', '', r[0])); tr.appendChild(el('td', '', r[1])); tb.appendChild(tr); });
    if (p.catalogue) { var d = $('dlcat'); d.href = p.catalogue; d.textContent = 'Download ' + p.catalogue_label + ' (PDF)'; d.style.display = ''; }
    // RFQ
    $('f_product').value = p.name + ' (' + p.brand + (p.sku ? ', ' + p.sku : '') + ')';
    $('f_pid').value = p.id; $('f_brand').value = p.brand;
    $('f_subject').value = 'New RFQ from Portwise Ventures website: ' + p.name + ' (' + p.brand + ')';
    var msg = 'Hello Portwise Ventures, I would like a quotation for ' + p.name + ' (' + p.brand + '). ' + cu;
    $('fb_wa').setAttribute('href', 'https://wa.me/8801575645253?text=' + encodeURIComponent(msg));
    $('fb_mail').setAttribute('href', 'mailto:info@portwiseventures.com?subject=' + encodeURIComponent('Quotation request: ' + p.name) + '&body=' + encodeURIComponent(msg));
    // related
    var rel = all.filter(function (x) { return x.id !== p.id && x.brand === p.brand && x.category === p.category; }).slice(0, 4);
    if (!rel.length) $('relbox').style.display = 'none';
    rel.forEach(function (x) {
      var a = el('a', 'rc'); a.href = 'product.html?p=' + encodeURIComponent(x.id);
      var i = el('img'); i.src = x.images[0]; i.alt = x.name; i.loading = 'lazy'; a.appendChild(i); a.appendChild(el('span', '', x.name)); $('rel').appendChild(a);
    });
    var ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, brand: { '@type': 'Brand', name: p.brand }, image: 'https://portwiseventures.com/' + p.images[0], countryOfOrigin: p.origin, url: cu };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.text = JSON.stringify(ld); document.head.appendChild(s);
    $('pwrap').style.display = '';
    if (location.hash === '#rfq') setTimeout(function () { var r = $('rfq'); if (r) r.scrollIntoView(); }, 100);
  }).catch(nf);
})();
