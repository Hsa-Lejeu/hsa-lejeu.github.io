// Test des écrans en portrait et en paysage : chevauchements, boutons hors de l'écran, cibles trop petites.
// Usage : node outils/test-ecrans.js URL [DOSSIER_CAPTURES] [filtre]
//   URL      : adresse du jeu (ex. http://localhost:8765/index.html)
//   DOSSIER  : où écrire les captures et rapport.json (défaut : ./ecrans)
//   filtre   : ne jouer que les écrans dont le nom contient ce texte (ex. "debat")
// Chaque écran est ouvert dans 4 formats (2 téléphones, portrait et paysage).
// Problèmes relevés, pour chaque bouton ou zone touchable visible :
//   - « caché »  : le centre du bouton est recouvert par un autre élément (le doigt touche l'autre).
//                  Un panneau d'onglet ouvert qui recouvre la barre du haut est voulu : non compté.
//   - « dehors » : le bouton dépasse de l'écran (hors zone qui défile)
//   - « petit »  : moins de 28 px de haut ou de large
// Pour les fenêtres (#m) : « vide » si plus de 35 % de la fenêtre est sans contenu (sauf pendant l'animation du radar,
// quand « Passer » est affiché), « déborde » si elle dépasse l'écran.
// « erreur » : une erreur attrapée par oops() (v587) pendant l'écran.
// Le résumé final compte les problèmes par écran et par format ; 0 « caché » et 0 « dehors » est l'objectif.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const URL_=process.argv[2]||'http://localhost:8765/index.html';const OUT=process.argv[3]||'ecrans';const FILT=process.argv[4]||'';
fs.mkdirSync(OUT,{recursive:true});
const VP=[['portrait-375',375,812],['portrait-412',412,860],['paysage-812',812,375],['paysage-915',915,412]];
const CLEAN="try{window.mrtShow=function(){};B.mort=B.mort||{n:'-'}}catch(_){}try{gdEnd()}catch(_){}try{AG.q.length=0}catch(_){}try{POPQ.length=0}catch(_){}try{chapClose()}catch(_){}document.querySelectorAll('#fmo,#petov,#vig,#peta,#mrt,#envo,#ulp,#nalg,#tvov,#ctip.on,#chap,#chov').forEach(e=>e.remove());$('m').hidden=true;paused=false;";
const TAB0="try{tab(-1)}catch(_){};";
// [nom, paramètre d'adresse, code à lancer, attente ms]
const ST=[
 ['accueil','',null,3500],
 ['jeu','?an=2',TAB0,800],
 ...[0,1,2,3,4].map(i=>['onglet'+i,'?an=2',"tab("+i+")",900]),
 ['scene-orientation','?an=2',"AG.rel=1;try{for(const h of Object.values(hist)){h.v=Math.max(h.v||0,2);h.st='';h.orw=0}}catch(_){}orAsk('lhss');AG.rel=0",900],
 ['scene-telephone','?an=2',"AG.rel=1;telEv();AG.rel=0",1500],
 ['has','?an=2',"AG.rel=1;const lv=B.has||0,nx=Math.min(4,lv+1);window.hasReport(lv,nx,lv,window.hasStatsT(),window.HASC_[nx]);AG.rel=0",2500],
 ['bilan-mois-negatif','?an=2',"AG.rel=1;MS.acc=1;monthEnd();AG.rel=0",1800,['Continuer']],
 ['bilan-annuel','?an=2',"AG.rel=1;endGame();AG.rel=0",700,['Continuer']],
 ['bilan-annuel-fin','?an=2',"AG.rel=1;endGame();AG.rel=0",9000,['Continuer']],
 ['bilan-final','?an=3',"AG.rel=1;endGame();AG.rel=0",5000,['Passer','Voir le bilan']],
 ['debat','?an=3',"debOpen()",4000],
 ['album','?an=2',"album()",1200],
 ['carte','?an=2',"cardShow(CARDS[0][0])",1200],
 ['finances','?an=2',"finModal()",1200],
 ['petanque','?an=2',"petaShow(true)",2500],
];
const PROBE=()=>{const W=innerWidth,H=innerHeight,out=[];
 const vis=e=>{const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return null;let n=e;while(n&&n!==document.body){const c=getComputedStyle(n);if(c.display=='none'||c.visibility=='hidden'||+c.opacity<.05)return null;n=n.parentElement}return r};
 const scrollAnc=e=>{let n=e.parentElement;while(n&&n!==document.body){const c=getComputedStyle(n);if(/(auto|scroll)/.test(c.overflowY+c.overflowX)&&(n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2))return n;n=n.parentElement}return null};
 const nm=e=>{const t=(e.textContent||e.title||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,34);return (e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className=='string'?'.'+e.className.split(' ')[0]:''))+(t?' « '+t+' »':'')};
 // une fenêtre ou une scène plein écran : seuls ses boutons comptent (le reste est volontairement recouvert)
 let root=document.body;{let f=document.elementFromPoint(W/2,H/2);while(f&&f!==document.body){const c=getComputedStyle(f),r=f.getBoundingClientRect();if((c.position=='fixed'||c.position=='absolute')&&r.width>=W*.85&&r.height>=H*.85&&f.id!='app'&&f.id!='view'&&f.tagName!='CANVAS'){root=f}f=f.parentElement}}
 const els=[...root.querySelectorAll('button,[onclick],a[href],input,select,.rbc,.hand>*')].filter(e=>!e.disabled);
 for(const e of els){const r=vis(e);if(!r)continue;const sa=scrollAnc(e);
  let box={l:0,t:0,r:W,b:H};if(sa){const q=sa.getBoundingClientRect();box={l:Math.max(0,q.left),t:Math.max(0,q.top),r:Math.min(W,q.right),b:Math.min(H,q.bottom)}}
  const cx=r.left+r.width/2,cy=r.top+r.height/2;
  if(!sa&&(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1))out.push({k:'dehors',e:nm(e),r:[r.left|0,r.top|0,r.width|0,r.height|0]});
  if(cx>=box.l&&cx<=box.r&&cy>=box.t&&cy<=box.b&&cx>=0&&cy>=0&&cx<W&&cy<H){const f=document.elementFromPoint(cx,cy);if(f&&f!==e&&!e.contains(f)&&!f.contains(e)){const fb=f.closest('button,[onclick],a,input,select');const sheet=document.querySelector('#app.open')&&f.closest('#phead,#side')&&!e.closest('#phead,#side');if(!(fb&&e.contains(fb))&&!sheet)out.push({k:'caché',e:nm(e),par:nm(f),r:[r.left|0,r.top|0,r.width|0,r.height|0]})}}
  if((r.width<28||r.height<28)&&!(sa&&(cy<box.t||cy>box.b)))out.push({k:'petit',e:nm(e),r:[r.width|0,r.height|0]})}
 const m=document.getElementById('m');if(m&&!m.hidden){const mb=document.getElementById('mb')||m;const r=mb.getBoundingClientRect();
  if(r.bottom>H+1||r.top<-1||r.right>W+1||r.left<-1)out.push({k:'déborde',e:'#mb',r:[r.left|0,r.top|0,r.width|0,r.height|0]});
  // part vide : on quadrille la fenêtre et on cherche les cases sans contenu
  let empty=0,tot=0;const st=12;for(let y=r.top+st/2;y<Math.min(r.bottom,H);y+=st)for(let x=r.left+st/2;x<Math.min(r.right,W);x+=st){tot++;const f=document.elementFromPoint(x,y);if(!f||f===mb||f===m||(f.contains(mb)))empty++}
  const vf=tot?empty/tot:0;if(vf>.35&&!mb.querySelector('.rvskip,.yrsk'))out.push({k:'vide',e:'#mb',v:Math.round(vf*100)+' %'})}
 return out};
(async()=>{const b=await chromium.launch();const rep={};let tot={caché:0,dehors:0,petit:0,vide:0,déborde:0,erreur:0};
 for(const [n,q,code,wait,clk] of ST){if(FILT&&!n.includes(FILT))continue;
  for(const [vn,w,h] of VP){const pg=await b.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true});const errs=[];pg.on('pageerror',e=>errs.push(e.message.slice(0,140)));
   try{await pg.goto(URL_+q);await pg.waitForTimeout(q?6000:wait);
    if(q&&n!='debat'){for(let i=0;i<6;i++){await pg.evaluate("(()=>{try{"+CLEAN+"}catch(_){}})()");await pg.waitForTimeout(500)}await pg.evaluate("(()=>{try{"+CLEAN+"}catch(_){}paused=true})()")}
    if(code)await pg.evaluate("(()=>{"+code+"})()").catch(e=>errs.push('setup '+e.message.slice(0,140)));
    if(n=='debat'){for(let i=0;i<70;i++){const d=await pg.evaluate("(()=>{if(document.querySelector('#debov .hand>*'))return 1;const b=[...document.querySelectorAll('#debov button,#debov [onclick]')].filter(b=>{const r=b.getBoundingClientRect();if(!r.width)return false;const f=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return f&&(f===b||b.contains(f))});const g=b.find(x=>/Suivant|Continuer|C’est parti|Commencer|Débattre|Y aller|Allons|Go|▶/.test(x.textContent))||b.find(x=>x.classList.contains('go'))||b[0];if(g)g.click();else{const o=document.getElementById('debov');if(o){const r=o.getBoundingClientRect();o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.width/2,clientY:r.height/2}));o.click()}}return 0})()");if(d)break;await pg.waitForTimeout(700)}}
    await pg.waitForTimeout(wait);
    for(const t of (clk||[])){await pg.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>{const r=b.getBoundingClientRect();if(!r.width||!b.textContent.includes(t))return false;const f=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return f&&(f===b||b.contains(f))});b&&b.click()},t);await pg.waitForTimeout(wait)}
    const P=await pg.evaluate(PROBE);const ER=await pg.evaluate(()=>window.__ERRS?window.__ERRS.dernieres.slice():[]);if(ER.length){P.push({k:'erreur',e:ER.slice(-3).join(' | ')})}await pg.screenshot({path:path.join(OUT,n+'_'+vn+'.png')});
    rep[n+' · '+vn]={pb:P,errs};const c={};P.forEach(p=>{c[p.k]=(c[p.k]||0)+1;tot[p.k]=(tot[p.k]||0)+1});
    console.log((n+' · '+vn).padEnd(34),Object.entries(c).map(([k,v])=>k+' '+v).join(', ')||'ok',errs.length?' ⚠ '+errs[0]:'');
    P.filter(p=>p.k!='petit').slice(0,6).forEach(p=>console.log('     ',p.k,p.e,p.par?'← '+p.par:'',p.v||'',p.r?JSON.stringify(p.r):''))}
   catch(e){console.log(n,vn,'ERREUR',e.message.slice(0,160))}await pg.close()}}
 fs.writeFileSync(path.join(OUT,'rapport.json'),JSON.stringify(rep,null,1));
 console.log('\nTotal :',Object.entries(tot).map(([k,v])=>k+' '+v).join(', '),'(objectif : 0 caché, 0 dehors, 0 déborde, 0 vide)');await b.close()})();
