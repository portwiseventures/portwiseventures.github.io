(function(){
var $=function(i){return document.getElementById(i)},API='https://api.github.com/repos/',sha=null,items=[];
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function msg(t,bad){var m=$('msg');m.textContent=t;m.style.color=bad?'#b3261e':'#2a7a4f'}
function hdr(){return{'Authorization':'Bearer '+$('tok').value.trim(),'Accept':'application/vnd.github+json','Content-Type':'application/json'}}
function url(p){return API+$('repo').value.trim()+'/contents/'+p}
function b64(s){return btoa(unescape(encodeURIComponent(s)))}
function unb64(s){return decodeURIComponent(escape(atob(s.replace(/\s/g,''))))}
function store(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
function read(k){try{return localStorage.getItem(k)||''}catch(e){return ''}}
async function load(){
 var r=await fetch(url('products.json')+'?t='+Date.now(),{headers:hdr()});
 if(r.status==404){items=[];sha=null}
 else if(!r.ok){throw new Error('GitHub replied '+r.status+'. Check the token, its permissions and the repository name.')}
 else{var j=await r.json();sha=j.sha;items=JSON.parse(unb64(j.content))}
 render()}
async function saveJson(note){
 var body={message:note,content:b64(JSON.stringify(items,null,2)),branch:'main'};if(sha)body.sha=sha;
 var r=await fetch(url('products.json'),{method:'PUT',headers:hdr(),body:JSON.stringify(body)});
 if(!r.ok)throw new Error('Saving failed ('+r.status+'). Try again.');
 var j=await r.json();sha=j.content.sha}
function shrink(file){return new Promise(function(ok,no){var im=new Image(),u=URL.createObjectURL(file);
 im.onload=function(){var s=Math.min(1,1200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',0.82).split(',')[1])};
 im.onerror=function(){no(new Error('Could not read that image file'))};im.src=u})}
function render(){
 $('app').style.display='block';
 $('list').innerHTML=items.length?items.map(function(p){return '<div class="card"><span class="tag">'+esc(p.brand)+'</span>'+(p.image?'<img class="pimg" src="'+esc(p.image)+'" alt="">':'')+'<h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p>'+(p.moq?'<p><b>Minimum order:</b> '+esc(p.moq)+'</p>':'')+'<button class="btn" style="background:#b3261e;color:#fff" data-del="'+esc(p.id)+'">Delete</button></div>'}).join(''):'<p>No products yet. Add your first one above.</p>'}
async function del(id){
 var p=items.find(function(x){return x.id==id});
 if(!p||!confirm('Delete "'+p.name+'"? This cannot be undone.'))return;
 try{items=items.filter(function(x){return x.id!=id});await saveJson('Delete product '+p.name);
  if(p.image){var g=await fetch(url(p.image),{headers:hdr()});if(g.ok){var j=await g.json();await fetch(url(p.image),{method:'DELETE',headers:hdr(),body:JSON.stringify({message:'Delete image '+p.id,sha:j.sha,branch:'main'})})}}
  render();msg('Deleted. The Catalogue page updates in about a minute.')}
 catch(x){msg(x.message,1);try{await load()}catch(e){}}}
$('list').onclick=function(e){var id=e.target.getAttribute('data-del');if(id)del(id)};
$('add').onsubmit=async function(e){
 e.preventDefault();var f=e.target,btn=f.querySelector('button');btn.disabled=true;
 try{var id='p'+Date.now(),img='',file=$('img').files[0];
  if(file){var data=await shrink(file);img='images/'+id+'.jpg';
   var r=await fetch(url(img),{method:'PUT',headers:hdr(),body:JSON.stringify({message:'Add image '+id,content:data,branch:'main'})});
   if(!r.ok)throw new Error('Image upload failed ('+r.status+')')}
  items.push({id:id,brand:f.brand.value,name:f.pname.value.trim(),desc:f.desc.value.trim(),moq:f.moq.value.trim(),image:img});
  await saveJson('Add product '+f.pname.value.trim());f.reset();render();
  msg('Added. It appears on the Catalogue page in about a minute.')}
 catch(x){msg(x.message,1)}
 btn.disabled=false};
$('save').onclick=async function(){store('pw_repo',$('repo').value.trim());store('pw_tok',$('tok').value.trim());
 try{msg('Connecting...');await load();msg('Connected.')}catch(x){msg(x.message,1)}};
$('forget').onclick=function(){store('pw_tok',null);$('tok').value='';$('app').style.display='none';msg('Token removed from this browser.')};
if(read('pw_repo'))$('repo').value=read('pw_repo');
if(read('pw_tok')){$('tok').value=read('pw_tok');load().then(function(){msg('Connected.')}).catch(function(x){msg(x.message,1)})}
})();
