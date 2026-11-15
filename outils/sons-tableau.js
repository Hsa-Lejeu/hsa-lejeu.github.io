// Contrôle : chaque bouton du tableau souvenir doit jouer un bruitage (autre que rien).
// node outils/sons-tableau.js URL   (URL du jeu, sans paramètres) — objectif : 0 bouton muet.
const { chromium } = require('playwright');
(async()=>{const url=(process.argv[2]||'http://localhost:8767/index.html')+'?an=3#tableau';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});
await p.addInitScript(()=>{try{localStorage.setItem('hsa-tab-intro','1')}catch(_){}});
await p.goto(url);await p.waitForTimeout(7000);await p.mouse.click(195,300);await p.waitForTimeout(400);
const out=[];
const tryAll=async(scope,label)=>{const n=await p.evaluate(s=>[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length&&!e.disabled).length,scope);
 for(let i=0;i<n;i++){const r=await p.evaluate(([s,i])=>{const e=[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length&&!e.disabled)[i];if(!e)return null;window.__SFXLOG=[];const t=(e.getAttribute('aria-label')||e.title||e.textContent||e.className||'').trim().slice(0,40)||e.className;e.click();return t},[scope,i]);
  if(r==null)continue;await p.waitForTimeout(250);const lg=await p.evaluate(()=>(window.__SFXLOG||[]).map(x=>x[1]+(x[2]===1?'':'('+x[2]+')')));out.push([label,r,lg.join('+')])}};
for(const t of ['txt','pho','sta','stk']){
 await p.evaluate(t=>{const b=document.querySelector('#shov .shtabs button[data-t="'+t+'"]');const pan=document.querySelector('#shov .shpan[data-t="'+t+'"]');if(b&&(!pan||!pan.getClientRects().length))b.click()},t);await p.waitForTimeout(400);
 await tryAll('#shov .shpan[data-t="'+t+'"] button','tiroir '+t);
 await tryAll('#shov .shsel button','élément choisi ('+t+')');}
await p.evaluate(()=>{const o=document.querySelector('#shov .shopt');if(o&&o.hidden){const m=document.querySelector('#shov .shmore');m&&m.click()}});await p.waitForTimeout(300);
const no=await p.evaluate(()=>[...document.querySelectorAll('#shov .shopt button')].filter(e=>e.getClientRects().length).length);
for(let i=0;i<no;i++){await p.evaluate(()=>{const o=document.querySelector('#shov .shopt');if(o&&o.hidden){const m=document.querySelector('#shov .shmore');m&&m.click()}});await p.waitForTimeout(200);
 const r=await p.evaluate(i=>{const e=[...document.querySelectorAll('#shov .shopt button')].filter(e=>e.getClientRects().length)[i];if(!e)return null;window.__SFXLOG=[];const t=(e.getAttribute('aria-label')||e.title||e.textContent||e.className||'').trim().slice(0,40)||e.className;e.click();return t},i);if(r==null)continue;await p.waitForTimeout(250);
 const lg=await p.evaluate(()=>(window.__SFXLOG||[]).map(x=>x[1]+(x[2]===1?'':'('+x[2]+')')));out.push(['options',r,lg.join('+')])}
await tryAll('#shov .shrail>button:not(.shx):not(.shdl):not(.shshare), #shov .shtabs button, #shov .shmode','barre');
let muets=0;out.forEach(([a,b_,c])=>{const m=!c;if(m)muets++;console.log((m?'MUET  ':'      ')+a+' · '+b_+' → '+(c||'rien'))});
console.log('Total : '+out.length+' boutons, '+muets+' muet(s) (objectif : 0)');await b.close()})();
