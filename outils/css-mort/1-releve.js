// Relevé : toutes les règles CSS de la page (ordre réel), les feuilles présentes dès l'accueil, et les ancêtres de chaque id.
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2],OUT=process.argv[3];
const grab=()=>{const h=s=>{let x=5381;for(let i=0;i<s.length;i++)x=(x*33^s.charCodeAt(i))>>>0;return x.toString(36)};
 const sheets=[...document.styleSheets].map((s,si)=>{let rules=[];try{const walk=(rs,ctx)=>{for(const r of rs){if(r.type===1){const d=[];for(let i=0;i<r.style.length;i++){const p=r.style[i];d.push([p,r.style.getPropertyValue(p),r.style.getPropertyPriority(p)?1:0])}rules.push({sel:r.selectorText,ctx,d})}else if(r.cssRules&&(r.type===4||r.type===12)){walk(r.cssRules,ctx.concat([(r.type===4?'@media ':'@supports ')+(r.conditionText||r.media.mediaText)]))}}};walk(s.cssRules,[])}catch(_){}
  return {si,id:s.ownerNode&&s.ownerNode.id||'',key:h(rules.map(r=>r.sel+'{'+r.d.join(';')).join('|')),n:rules.length,rules}});
 const anc={};document.querySelectorAll('[id]').forEach(e=>{const a=[];let p=e.parentElement;while(p){if(p.id)a.push(p.id);p=p.parentElement}anc[e.id]=a});
 return {sheets,anc}};
(async()=>{const b=await chromium.launch();const res={};
 const one=async(name,q,vp,pre)=>{const p=await b.newPage({viewport:vp});await p.goto(URL+q);await p.waitForTimeout(pre?4500:800);if(pre)await p.evaluate(pre).catch(()=>{});await p.waitForTimeout(pre?1200:0);res[name]=await p.evaluate(grab);await p.close()};
 await one('accueil','',{width:390,height:844});
 const VP={p:{width:390,height:844},l:{width:844,height:390},t:{width:1024,height:768}};
 for(const an of [1,2,3])for(const v of Object.keys(VP)){await one(`an${an}-${v}`,'?an='+an,VP[v],'0');await one(`an${an}-${v}-onglet`,'?an='+an,VP[v],'tab(0)');await one(`an${an}-${v}-fen`,'?an='+an,VP[v],'try{settings()}catch(e){}')}
 fs.writeFileSync(OUT,JSON.stringify(res));console.log(Object.keys(res).map(k=>k+':'+res[k].sheets.length+'f/'+res[k].sheets.reduce((a,s)=>a+s.n,0)+'r').join(' '));await b.close()})()
