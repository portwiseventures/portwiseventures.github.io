(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
function text(id,s){var n=$(id);if(n)n.textContent=s;}
function money(n){return Number(n).toLocaleString(undefined,{maximumFractionDigits:2});}
var inc={
EXW:'The seller makes the goods available at the named place. The buyer generally arranges collection, transport and export/import formalities.',
FCA:'The seller delivers the goods to the carrier or another person nominated by the buyer at the named place, with export clearance handled as specified by the rule.',
FOB:'The seller delivers the goods on board the vessel nominated by the buyer at the named port of shipment. Sea and inland waterway transport only.',
CFR:'The seller delivers the goods on board the vessel and pays freight to the named port of destination. Risk transfers when goods are on board.',
CIF:'Like CFR, with the seller also arranging the required cargo insurance cover. Sea and inland waterway transport only.',
DAP:'The seller delivers the goods at the named destination, ready for unloading. The buyer generally handles import clearance and duties.',
DPU:'The seller delivers and unloads the goods at the named destination. The buyer generally handles import clearance and duties.',
DDP:'The seller delivers goods cleared for import, ready for unloading at the named destination. The seller takes on extensive import obligations.'
};
function updateInc(){text('incotermText',inc[$('incoterm').value]);}
if($('incoterm')){$('incoterm').addEventListener('change',updateInc);updateInc();}
if($('shipCalc'))$('shipCalc').onclick=function(){
 var kg=Math.max(0,Number($('shipKg').value)||0),cbm=Math.max(0,Number($('shipCbm').value)||0),
 rk=Math.max(0,Number($('rateKg').value)||0),rc=Math.max(0,Number($('rateCbm').value)||0),
 typ=$('shipType').value,est=typ==='air'?kg*rk:Math.max(kg*rk,cbm*rc);
 text('shipResult','Indicative freight planning estimate: USD '+money(est)+'. Excludes origin/destination handling, customs, duties, insurance, surcharges and other fees. Confirm with a freight provider.');
};
if($('fxCalc'))$('fxCalc').onclick=async function(){
 var amount=Number($('fxAmount').value)||0,from=$('fxFrom').value,to=$('fxTo').value;
 text('fxResult','Loading indicative rate…');
 try{
  var r=await fetch('https://open.er-api.com/v6/latest/'+encodeURIComponent(from));
  if(!r.ok)throw new Error('Rate service unavailable');
  var d=await r.json();if(d.result!=='success'||!d.rates[to])throw new Error('Rate unavailable');
  text('fxResult',money(amount)+' '+from+' ≈ '+money(amount*d.rates[to])+' '+to+' (rate date: '+d.time_last_update_utc+'). Indicative only.');
 }catch(e){text('fxResult','Live rate unavailable right now. Please check your bank or a trusted currency provider.');}
};
if($('printChecklist'))$('printChecklist').onclick=function(){window.print();};
if($('buyerGuide'))$('buyerGuide').onclick=function(){window.print();};
var products=[];
function fillProducts(){
 var a=$('compareA'),b=$('compareB');if(!a||!b)return;
 products.forEach(function(p){[a,b].forEach(function(s){var o=document.createElement('option');o.value=p.id;o.textContent=p.name+' — '+p.brand;s.appendChild(o);});});
 if(b.options.length>1)b.selectedIndex=1;
}
function compare(){
 var a=products.find(function(p){return p.id===$('compareA').value;}),b=products.find(function(p){return p.id===$('compareB').value;});
 var box=$('compareResult');box.innerHTML='';
 if(!a||!b||a.id===b.id){box.textContent='Choose two different products to compare.';return;}
 var rows=[['Product','name'],['Brand','brand'],['Category','category'],['Origin','origin'],['Packaging','packaging'],['MOQ','moq'],['Availability','availability']];
 var table=document.createElement('table'),body=document.createElement('tbody');
 rows.forEach(function(row){var tr=document.createElement('tr');[row[0],a[row[1]]||'Not listed',b[row[1]]||'Not listed'].forEach(function(v){var td=document.createElement('td');td.textContent=v;tr.appendChild(td);});body.appendChild(tr);});
 table.appendChild(body);box.appendChild(table);
}
if($('compareBtn'))$('compareBtn').onclick=compare;
var seasonBox=$('seasonList');
if(seasonBox)fetch('products.json').then(function(r){return r.json();}).then(function(list){
 var items=list.filter(function(p){return p.brand==='AGRINEST';}).slice(0,10);
 seasonBox.innerHTML='';
 if(!items.length){seasonBox.textContent='Season details are confirmed on request.';return;}
 var ul=document.createElement('ul');
 items.forEach(function(p){var li=document.createElement('li');li.textContent=p.name+': '+(p.availability||'Confirm availability');ul.appendChild(li);});
 seasonBox.appendChild(ul);
}).catch(function(){seasonBox.textContent='Season details are confirmed on request.';});

if($('compareA'))fetch('products.json').then(function(r){return r.json();}).then(function(d){products=d;fillProducts();}).catch(function(){text('compareResult','Product catalogue could not be loaded.');});
var q=$('assistantAsk');
if(q)q.onclick=function(){
 var v=$('assistantQ').value.toLowerCase(),ans='I can help with product enquiries, export services and the quotation process. For a specific question, contact info@portwiseventures.com.';
 if(/quote|quotation|price|cost/.test(v))ans='Use the Request a Quote form and include the product, quantity, destination country or port, specifications and required timeline.';
 else if(/sample/.test(v))ans='Samples may be requested. Availability, sample cost and courier arrangements are confirmed individually.';
 else if(/product|catalogue|marketplace/.test(v))ans='Browse the Product Marketplace to search by brand, category, origin and availability. Open a product page for its specifications.';
 else if(/ship|freight|logistic|delivery/.test(v))ans='Portwise coordinates trade and logistics arrangements. Freight costs and transit details are confirmed for each shipment.';
 else if(/document|certificate|invoice|packing/.test(v))ans='Typical export documents can include a commercial invoice, packing list, transport document and product-specific certificates. Requirements depend on the goods and destination.';
 else if(/contact|email|whatsapp/.test(v))ans='Email info@portwiseventures.com or use the WhatsApp contact link on the website.';
 text('assistantAnswer',ans+' This is general website guidance, not customs, legal or financial advice.');
};
})();
