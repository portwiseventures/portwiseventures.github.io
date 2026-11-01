(function(){
function clean(h){var d=new DOMParser().parseFromString(h,'text/html').body;d.querySelectorAll('*').forEach(function(n){if(!/^(B|I|STRONG|EM|BR|A|SPAN)$/.test(n.tagName)){n.replaceWith(document.createTextNode(n.textContent));return}[].slice.call(n.attributes).forEach(function(a){if(!(n.tagName=='A'&&a.name=='href'&&/^(https?:|mailto:|#|[\w.\-]+\.html)/i.test(a.value)))n.removeAttribute(a.name)})});return d.innerHTML}
fetch('content.json?v='+Date.now()).then(function(r){return r.ok?r.json():{}}).then(function(c){
var t=c.texts||{},s=c.settings||{},q=function(a,f){document.querySelectorAll(a).forEach(f)};
q('[data-key]',function(e){var v=t[e.getAttribute('data-key')];if(v){if(e.hasAttribute('data-rich'))e.innerHTML=clean(v);else e.textContent=v}});
if(s.phone)q('[data-txt~="phone"]',function(e){e.textContent=s.phone});
if(s.whatsapp)q('[data-set~="wa"]',function(e){e.href=e.href.replace(/wa\.me\/\d+/,'wa.me/'+String(s.whatsapp).replace(/\D/g,''))});
if(s.email){q('[data-set~="email"]',function(e){e.href='mailto:'+s.email});q('[data-txt~="email"]',function(e){e.textContent=s.email});q('form[data-formemail]',function(f){f.action='https://formsubmit.co/'+s.email})}
if(s.linkedin){q('[data-set~="linkedin"]',function(e){e.href=s.linkedin});q('[data-txt~="linkedin"]',function(e){e.textContent=s.linkedin.replace(/^https?:\/\//,'')})}
}).catch(function(){})})();
