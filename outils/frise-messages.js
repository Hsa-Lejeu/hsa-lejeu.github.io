// Frise des messages du début de partie — voir RYTHME.md, règle 9.
//
// Joue automatiquement une nouvelle partie au format téléphone (375 × 812) et note,
// toutes les 150 ms, ce qui est affiché dans chaque canal de message
// (fenêtre, scène, réunion, conseil, « Nouveau ! », bulle de Camille, alertes, toast).
// Le « joueur » suit le guide, choisit la première option des scènes, répond aux appels
// et prend READ ms pour lire chaque fenêtre avant de la fermer.
//
// Installation (une fois) :  npm install playwright && npx playwright install chromium
// Utilisation :              node outils/frise-messages.js [durée_s=240] [lecture_ms=2500] [sortie=frise.json] [url]
//   url par défaut : https://hsa-lejeu.github.io/  (pour tester une version locale :
//   python3 -m http.server 8765  puis  url = http://localhost:8765/index.html)
// Ajouter V=1 devant la commande pour voir chaque action du joueur automatique.
//
// Sortie : le fichier JSON (une ligne par message : secondes, date du jeu, canal, texte)
// et un résumé comparé aux objectifs de RYTHME.md.

const { chromium } = require('playwright');
const DUR = +(process.argv[2]||240)*1000, READ = +(process.argv[3]||2500), OUT = process.argv[4]||'frise.json', URL = process.argv[5]||'https://hsa-lejeu.github.io/';
(async()=>{
 const b = await chromium.launch();
 const ctx = await b.newContext({viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p = await ctx.newPage();
 await p.addInitScript(()=>{
  window.__LOG=[];const T0=performance.now();let prev={};
  const dt=()=>{try{return (typeof YR!='undefined'?'A'+YR+' ':'')+(document.body.innerText.match(/(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s*J\d+/)||[''])[0]}catch(_){return ''}};
  const cl=t=>(t||'').replace(/\s+/g,' ').trim().slice(0,140);
  const vis=e=>e&&e.offsetParent!==null&&getComputedStyle(e).visibility!='hidden';
  setInterval(()=>{try{
   const cur={};const $=id=>document.getElementById(id);
   const m=$('m'); if(m&&!m.hidden){const h=m.querySelector('h2,h3');cur.modal=cl(h?h.textContent:m.textContent)}
   const f=$('fmo'); if(f) cur.event=cl((f.querySelector('.ft')||{}).textContent+' — '+(f.querySelector('.fd')||{}).textContent);
   const c=$('ctip'); if(c&&c.classList.contains('on')) cur.tip=cl(c.querySelector('p').textContent);
   const u=$('ulp'); if(u&&vis(u)) cur.nouveau=cl((u.querySelector('.un')||u).textContent);
   const tu=$('tut'); if(tu&&!tu.hidden) cur.tuto=cl(tu.textContent);
   const gb=$('gdb'); if(gb&&vis(gb)) cur.guide=cl(gb.textContent);
   try{if(typeof MEET!='undefined'&&MEET)cur.reunion='réunion de saison'}catch(_){}
   const cb=$('cbub'),ct=$('ctxt'); if(cb&&ct&&+getComputedStyle(cb).opacity>0.5) cur.bulle=cl(ct.textContent);
   const qb=$('qban'); if(qb&&!qb.classList.contains('off')&&vis(qb)) cur.banniere=cl(qb.textContent);
   const ts=$('mtst'); if(ts) cur.toast=cl(ts.textContent);
   const als=[...document.querySelectorAll('.al')].filter(vis).filter(e=>e.textContent.trim().length>2).map(e=>cl(e.textContent).replace(/\(\d+ s\)/,'').slice(0,90));
   const s=+((performance.now()-T0)/1000).toFixed(1);
   for(const k of Object.keys(cur)){ if(cur[k]!==prev[k]) __LOG.push({s,d:dt(),ch:k,t:cur[k]}) }
   const pa=prev.alertes||[]; als.filter(a=>!pa.includes(a)).forEach(a=>__LOG.push({s,d:dt(),ch:'alerte',t:a}));
   cur.alertes=als; prev=cur;
  }catch(e){window.__ERR=e.message}},150);
 });
 await p.goto(URL);
 await p.waitForTimeout(3000);
 const t0=Date.now(); let last=''; let same=0; const ALL=[]; let seen=0; p.on('framenavigated',f=>{if(f===p.mainFrame())ALL.push({s:(Date.now()-t0)/1000,d:'',ch:'RELOAD',t:f.url()})});
 while(Date.now()-t0<DUR){
  try{const L=await p.evaluate(()=>window.__LOG||[]);if(L.length<seen)seen=0;L.slice(seen).forEach(e=>ALL.push({...e,s:+((Date.now()-t0)/1000).toFixed(1)}));seen=L.length;}catch(e){console.error("LOGERR",e.message)}
  const a = await p.evaluate(()=>{
   const $=id=>document.getElementById(id);
   const vis=e=>e&&e.offsetParent!==null&&getComputedStyle(e).visibility!='hidden'&&e.getBoundingClientRect().width>0;
   const ctr=e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}};
   const top=x=>{const r=x.getBoundingClientRect();const cx=Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),cy=Math.min(innerHeight-1,Math.max(0,r.top+r.height/2));const e=document.elementFromPoint(cx,cy);return e&&(x===e||x.contains(e))};
   const btn=(root,re)=>{const c=[...(root||document).querySelectorAll('button')].filter(x=>vis(x)&&!x.disabled&&re.test(x.innerText));for(const x of c){if(!top(x)){x.scrollIntoView({block:'center'})}if(top(x))return x}return null};
   const f=$('fmo'); if(f){const bs=[...f.querySelectorAll('.fbt button')].filter(vis);const pick=bs.find(x=>!/Plus tard|Pas maintenant|Pas cette|Refuser|Ne pas|Laisser/.test(x.innerText))||bs[0];if(pick)return {k:'event:'+pick.innerText.slice(0,30),...ctr(pick)};return {k:'event-tap',...ctr(f)}}
   const m=$('m'); {const gx=btn(document,/(Continuer|Fermer|Compris|Suivant|C.est parti|Reprendre)/);if(gx&&!(m&&!m.hidden&&m.contains(gx))&&!gx.closest('#ctip')&&!gx.closest('#ulp'))return {k:'over:'+gx.innerText.slice(0,25)+' in '+(gx.closest('[id]')||{}).id,...ctr(gx)}} if(m&&!m.hidden){const x=btn(m,/(Commencer|C.est moi|Suivant|C.est parti|Compris|Continuer|D.accord|Passer(?! le guide)|^OK|Fermer)/)||btn(m,/./);if(x)return {k:'modal:'+x.innerText.slice(0,25),...ctr(x)};const hb=[...m.querySelectorAll('button')].pop();if(hb)hb.scrollIntoView({block:'center'});[m,document.getElementById('mb')].forEach(e=>{if(e)e.scrollTop=1e6});return {k:'modal-scroll '+document.body.className+' vis:'+getComputedStyle(m).visibility,x:187,y:300}}
   {const g=$('gdr');if(g&&getComputedStyle(g).display!='none'&&getComputedStyle(g).visibility!='hidden'){const r=g.getBoundingClientRect();if(r.width>0)return {k:'guide',x:r.left+r.width/2,y:r.top+r.height/2}}}
   const c=$('ctip'); if(c&&c.classList.contains('on')){const x=c.querySelector('button');const r=x.getBoundingClientRect();if(r.width>0&&r.top<innerHeight)return {k:'tip',...ctr(x)}}
   const call=[...document.querySelectorAll('.al.call')].find(vis); if(call) return {k:'call',...ctr(call)};
   const u=$('ulp'); if(u&&vis(u)){const x=u.querySelector('.ub button');if(x)return {k:'nouveau',...ctr(x)}}
   const tu=$('tut'); if(tu&&!tu.hidden){const x=btn(tu,/Suivant|Passer|C.est parti|Compris/);if(x)return {k:'tuto',...ctr(x)}}
   const any=btn(document,/(Commencer|C.est moi|Suivant|Passer(?! le guide)|C.est parti)/); if(any)return {k:'start:'+any.innerText.slice(0,20),...ctr(any)};
   const ov=[...document.querySelectorAll('div')].find(d=>vis(d)&&/Touche l’écran pour continuer|Touche pour continuer/.test(d.textContent)&&d.textContent.length<600); if(ov) return {k:'tap',...ctr(ov)};
   return null;
  });
  if(a){ if(process.env.V)console.error(((Date.now()-t0)/1000|0)+'s',a.k,Math.round(a.x),Math.round(a.y)); await p.waitForTimeout(a.k==='guide'?1200:READ); await p.mouse.click(a.x,a.y); if(a.k===last){same++; if(same>8){await p.mouse.click(187,620);same=0}} else same=0; last=a.k; await p.waitForTimeout(500);}
  else await p.waitForTimeout(400);
 }
 const log=ALL;
 require('fs').writeFileSync(OUT,JSON.stringify(log));
 await p.screenshot({path:'end.png'});
 const op=(log.find(e=>/ouvre ses portes/.test(e.t))||{}).s;
 const blq=['modal','event','reunion'];const L=log.filter(e=>e.ch!=='guide'&&e.ch!=='RELOAD');
 const avant=op==null?L:L.filter(e=>e.s<op),apres=op==null?[]:L.filter(e=>e.s>=op);
 const span=apres.length?(apres.at(-1).s-op)/60:0;
 console.log(`${L.length} messages enregistrés · ouverture à ${op==null?'?':Math.round(op)+' s'}`);
 console.log(`Avant l'ouverture : ${avant.filter(e=>blq.includes(e.ch)).length} fenêtres bloquantes (objectif ≤ 2)`);
 if(span)console.log(`Après l'ouverture : ${(apres.length/span).toFixed(1)} messages par minute (objectif ≤ 5)`);
 const bq=L.filter(e=>blq.includes(e.ch));const proches=bq.filter((e,i)=>i&&e.s-bq[i-1].s<40).length;
 console.log(`Fenêtres bloquantes à moins de 40 s l'une de l'autre : ${proches} (temps réel, pauses comprises)`);
 await b.close();
})();
