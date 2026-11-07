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

/* Form handler: sends via FormSubmit; if it fails, offers WhatsApp / email with the enquiry pre-written */
(function(){var F=document.querySelectorAll('form[data-formemail]');if(!F.length)return;
F.forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();
var b=f.querySelector('button[type=submit],button:not([type])'),old=b?b.textContent:'',box=f.nextElementSibling;
if(!box||!box.classList.contains('fbk')){box=document.createElement('div');box.className='fbk';box.setAttribute('role','status');f.parentNode.insertBefore(box,f.nextSibling)}
var d={},lines=[];new FormData(f).forEach(function(v,k){d[k]=v;if(k.charAt(0)!=='_'&&String(v).trim())lines.push(k.replace(/_/g,' ').replace(/^./,function(c){return c.toUpperCase()})+': '+v)});
var em=(f.action.split('/').pop()||'').trim(),wa=document.querySelector('a[data-set~="wa"]'),num=(wa&&(wa.href.match(/wa\.me\/(\d+)/)||[])[1])||'8801575645253',
subj=d._subject||'Website enquiry',msg=subj+'\n\n'+lines.join('\n');
if(b){b.disabled=true;b.textContent='Sending...'}
var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){ctl&&ctl.abort()},9000);
fetch('https://formsubmit.co/ajax/'+em,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(d),signal:ctl?ctl.signal:undefined})
.then(function(r){return r.json()}).then(function(j){if(j&&(j.success===true||j.success==='true')){box.className='fbk ok';box.innerHTML='<b>Thank you.</b> We have received your request and will reply personally.';f.reset()}else throw 0})
.catch(function(){box.className='fbk no';box.innerHTML='<b>We could not send your request automatically.</b> Your details are ready, so please send them in one tap:<br><a class="btn" target="_blank" rel="noopener" href="https://wa.me/'+num+'?text='+encodeURIComponent(msg)+'">Send on WhatsApp</a><a class="btn o2" href="mailto:'+em+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(msg)+'">Send by email</a>'})
.then(function(){clearTimeout(tm);if(b){b.disabled=false;b.textContent=old}});
box.scrollIntoView({block:'nearest'})})})})();
