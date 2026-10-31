(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var all=[],cur='All';
function draw(){var l=document.getElementById('list'),e=document.getElementById('empty');var v=all.filter(function(p){return cur=='All'||p.brand==cur});e.style.display=v.length?'none':'block';l.innerHTML=v.map(function(p){return '<div class="card"><span class="tag">'+esc(p.brand)+'</span>'+(p.image?'<img class="pimg" loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.name)+'">':'')+'<h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p>'+(p.moq?'<p><b>Minimum order:</b> '+esc(p.moq)+'</p>':'')+'<p><a href="quote.html"><b>Request a quote &rarr;</b></a></p></div>'}).join('')}
function filters(){var b=['All'];all.forEach(function(p){if(b.indexOf(p.brand)<0)b.push(p.brand)});document.getElementById('flt').innerHTML=b.length>2?b.map(function(n){return '<button class="'+(n==cur?'on':'')+'" data-b="'+esc(n)+'">'+esc(n)+'</button>'}).join(''):''}
document.getElementById('flt').onclick=function(e){var b=e.target.getAttribute('data-b');if(b){cur=b;filters();draw()}};
fetch('products.json?v='+Date.now()).then(function(r){return r.ok?r.json():[]}).then(function(d){all=Array.isArray(d)?d:[];filters();draw()}).catch(function(){draw()});
})();
