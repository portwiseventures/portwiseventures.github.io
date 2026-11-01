(function(){
var $=function(i){return document.getElementById(i)},API='https://api.github.com/repos/',F={};
var PAGES=[['index','Home'],['about','About'],['products','Products'],['evara','Evara'],['agrinest','Agrinest'],['primecrest','Primecrest'],['catalogue','Catalogue'],['markets','Markets'],['order','How to Order'],['contact','Contact'],['quote','Get a Quote'],['shared','Menu and footer (all pages)']];
var KIND={h1:'Main heading',h2:'Heading',h3:'Sub-heading',p:'Text',li:'List item',a:'Button',button:'Button',span:'Label'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function msg(t,bad){var m=$('msg');m.textContent=t;m.style.color=bad?'#b3261e':'#2a7a4f'}
function hdr(){return{'Authorization':'Bearer '+$('tok').value.trim(),'Accept':'application/vnd.github+json','Content-Type':'application/json'}}
function url(p){return API+$('repo').value.trim()+'/contents/'+p}
function b64(s){return btoa(unescape(encodeURIComponent(s)))}
function unb64(s){return decodeURIComponent(escape(atob(s.replace(/\s/g,''))))}
function store(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
function read(k){try{return localStorage.getItem(k)||''}catch(e){return ''}}
async function get(p,dflt){var r=await fetch(url(p)+'?t='+Date.now(),{headers:hdr()});
 if(r.status==404)return F[p]={sha:null,data:dflt};
 if(!r.ok)throw new Error('GitHub replied '+r.status+'. Check the token, its permissions and the repository name.');
 var j=await r.json();return F[p]={sha:j.sha,data:JSON.parse(unb64(j.content))}}
async function put(p,data,note){var b={message:note,content:b64(JSON.stringify(data,null,2)),branch:'main'};if(F[p]&&F[p].sha)b.sha=F[p].sha;
 var r=await fetch(url(p),{method:'PUT',headers:hdr(),body:JSON.stringify(b)});
 if(!r.ok)throw new Error('Saving failed ('+r.status+'). Try again.');
 var j=await r.json();F[p]={sha:j.content.sha,data:data}}
function C(){var d=F['content.json'].data||{};d.texts=d.texts||{};d.settings=d.settings||{};return d}
async function connect(){await get('products.json',[]);await get('content.json',{texts:{},settings:{}});
 $('app').style.display='block';$('pg').innerHTML=PAGES.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>'}).join('');
 ['phone','whatsapp','email','linkedin'].forEach(function(k){$('s_'+k).value=C().settings[k]||''});
 await fields();plist()}
async function fields(){var pg=$('pg').value,box=$('fields');box.innerHTML='<p>Loading...</p>';
 var r=await fetch((pg=='shared'?'index':pg)+'.html?t='+Date.now());if(!r.ok){box.innerHTML='<p>Could not load that page.</p>';return}
 var doc=new DOMParser().parseFromString(await r.text(),'text/html'),t=C().texts,out='';
 doc.querySelectorAll('[data-key]').forEach(function(e){var k=e.getAttribute('data-key'),sh=/^(nav|footer)\./.test(k);if(sh!=(pg=='shared'))return;
  var rich=e.hasAttribute('data-rich'),def=(rich?e.innerHTML:e.textContent).trim().replace(/\s+/g,' '),v=t[k]!=null?t[k]:def,tag=e.tagName.toLowerCase();
  out+='<label>'+(KIND[tag]||'Text')+(t[k]!=null?' (edited)':'')+(tag=='p'||v.length>80||rich?'<textarea rows="3" data-k="'+esc(k)+'" data-d="'+esc(def)+'">'+esc(v)+'</textarea>':'<input data-k="'+esc(k)+'" data-d="'+esc(def)+'" value="'+esc(v)+'">')+'</label>'});
 box.innerHTML=out||'<p>No editable text on this page.</p>'}
$('pg').onchange=fields;
$('savepg').onclick=async function(){var d=C();$('fields').querySelectorAll('[data-k]').forEach(function(e){var v=e.value.trim().replace(/\s+/g,' ');if(!v||v==e.getAttribute('data-d'))delete d.texts[e.getAttribute('data-k')];else d.texts[e.getAttribute('data-k')]=v});
 try{msg('Saving...');await put('content.json',d,'Edit page content');msg('Saved. Your website updates in a few minutes.');fields()}catch(x){msg(x.message,1)}};
$('savest').onclick=async function(){var d=C();['phone','whatsapp','email','linkedin'].forEach(function(k){var v=$('s_'+k).value.trim();if(v)d.settings[k]=v});
 try{msg('Saving...');await put('content.json',d,'Edit contact details');msg('Saved. Your website updates in a few minutes.')}catch(x){msg(x.message,1)}};
document.querySelector('.tabs').onclick=function(e){var t=e.target.getAttribute('data-t');if(!t)return;document.querySelectorAll('.tabs button').forEach(function(b){b.className=b.getAttribute('data-t')==t?'on':''});document.querySelectorAll('.tp').forEach(function(p){p.style.display=p.id==t?'block':'none'})};
function items(){return F['products.json'].data}
function plist(){var it=items();$('plist').innerHTML=it.length?it.map(function(p){return '<div class="card"><span class="tag">'+esc(p.brand)+'</span>'+(p.image?'<img class="pimg" src="'+esc(p.image)+'" alt="">':'')+'<h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p>'+(p.moq?'<p><b>Minimum order:</b> '+esc(p.moq)+'</p>':'')+'<button class="btn" style="background:#b3261e;color:#fff" data-del="'+esc(p.id)+'">Delete</button></div>'}).join(''):'<p>No products yet. Add your first one above.</p>'}
function shrink(file){return new Promise(function(ok,no){var im=new Image(),u=URL.createObjectURL(file);
 im.onload=function(){var s=Math.min(1,1200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',0.82).split(',')[1])};
 im.onerror=function(){no(new Error('Could not read that image file'))};im.src=u})}
$('plist').onclick=async function(e){var id=e.target.getAttribute('data-del');if(!id)return;var it=items(),p=it.find(function(x){return x.id==id});
 if(!p||!confirm('Delete "'+p.name+'"? This cannot be undone.'))return;
 try{await put('products.json',it.filter(function(x){return x.id!=id}),'Delete product '+p.name);
  if(p.image){var g=await fetch(url(p.image),{headers:hdr()});if(g.ok){var j=await g.json();await fetch(url(p.image),{method:'DELETE',headers:hdr(),body:JSON.stringify({message:'Delete image '+p.id,sha:j.sha,branch:'main'})})}}
  plist();msg('Deleted. The Catalogue page updates in a few minutes.')}catch(x){msg(x.message,1)}};
$('add').onsubmit=async function(e){e.preventDefault();var f=e.target,btn=f.querySelector('button');btn.disabled=true;
 try{var id='p'+Date.now(),img='',file=$('img').files[0];
  if(file){var data=await shrink(file);img='images/'+id+'.jpg';var r=await fetch(url(img),{method:'PUT',headers:hdr(),body:JSON.stringify({message:'Add image '+id,content:data,branch:'main'})});if(!r.ok)throw new Error('Image upload failed ('+r.status+')')}
  var it=items().concat([{id:id,brand:f.brand.value,name:f.pname.value.trim(),desc:f.desc.value.trim(),moq:f.moq.value.trim(),image:img}]);
  await put('products.json',it,'Add product '+f.pname.value.trim());f.reset();plist();msg('Added. It appears on the Catalogue page in a few minutes.')}catch(x){msg(x.message,1)}
 btn.disabled=false};
$('save').onclick=async function(){store('pw_repo',$('repo').value.trim());store('pw_tok',$('tok').value.trim());try{msg('Connecting...');await connect();msg('Connected.')}catch(x){msg(x.message,1)}};
$('forget').onclick=function(){store('pw_tok',null);$('tok').value='';$('app').style.display='none';msg('Token removed from this browser.')};
if(read('pw_repo'))$('repo').value=read('pw_repo');
if(read('pw_tok')){$('tok').value=read('pw_tok');connect().then(function(){msg('Connected.')}).catch(function(x){msg(x.message,1)})}
})();
