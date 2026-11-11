// Applique le plan au fichier source : retire les déclarations mortes retrouvées sans ambiguïté.
// node apply.js plan.json dump.json entrée.html sortie.html
const fs=require('fs');const {chromium}=require('playwright');
const [PLAN,DUMP,IN,OUT]=process.argv.slice(2);
const plan=JSON.parse(fs.readFileSync(PLAN));const D=JSON.parse(fs.readFileSync(DUMP))['an3-p'];let src=fs.readFileSync(IN,'utf8');
const NEVER=/^(-webkit-|-moz-|-ms-)|^(backdrop-filter|user-select|appearance|mask|mask-.*|text-size-adjust|touch-action|overscroll-behavior.*|scrollbar-.*|content-visibility|contain|will-change)$/;
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const selRe=sel=>{ // sélecteur normalisé du navigateur -> motif tolérant sur les espaces et les guillemets
 let out='';const toks=sel.match(/\s*[>+~,]\s*|\s+|"|'|[^\s>+~,"']+/g)||[];
 for(const t of toks){if(/^\s*[>+~,]\s*$/.test(t))out+='\\s*'+esc(t.trim())+'\\s*';else if(/^\s+$/.test(t))out+='\\s+';else if(t==='"'||t==="'")out+='(?:\\\\?["\'])?';else out+=esc(t).replace(/\\\(/g,'\\(\\s*').replace(/\\\)/g,'\\s*\\)').replace(/:/g,':')}
 return out};
const unesc=s=>s.replace(/\\(['"`])/g,'$1').replace(/\\\\/g,'\\').replace(/\\n/g,' ');
const splitDecl=b=>{const o=[];let d=0,st=0;for(let i=0;i<b.length;i++){const c=b[i];if(c==='(')d++;else if(c===')')d--;else if(c===';'&&d<=0){o.push([st,i+1]);st=i+1}}if(b.slice(st).trim())o.push([st,b.length]);return o};
(async()=>{const br=await chromium.launch();const pg=await br.newPage();
 const expand=async blocks=>pg.evaluate(bs=>bs.map(b=>{try{const s=new CSSStyleSheet();s.replaceSync('x{'+b+'}');const r=s.cssRules[0];if(!r)return null;const o=[];for(let i=0;i<r.style.length;i++){const p=r.style[i];o.push([p,r.style.getPropertyValue(p),r.style.getPropertyPriority(p)?1:0])}return o}catch(e){return null}}),blocks);
 const sig=d=>d.map(x=>x.join('\u0001')).sort().join('\u0002');
 // règles du relevé, par signature (sélecteur + déclarations)
 const cs=new Map();D.sheets.forEach(sh=>sh.rules.forEach((r,ri)=>{const k=r.sel+'\u0003'+sig(r.d);(cs.get(k)||cs.set(k,[]).get(k)).push({sh:sh.si,ri})}));
 const planBy=new Map(plan.map(p=>[p.sh+':'+p.ri,p]));
 const edits=[];const stat={regles:plan.length,trouvees:0,ambigues:0,introuvables:0,modele:0,decl:0,reglesVides:0,partielles:0};const miss=[];
 for(const P of plan){const rule=D.sheets[P.sh].rules[P.ri];const re=new RegExp('(^|[}{>;\'"`/\\s])('+selRe(P.sel)+')\\s*\\{([^{}]*)\\}','g');let m;const cands=[];
  while((m=re.exec(src))){const a=m.index+m[1].length;const body=m[3];const bodyStart=m.index+m[0].length-1-body.length;cands.push({a,b:m.index+m[0].length,body,bodyStart});re.lastIndex=m.index+m[0].length}
  if(!cands.length){stat.introuvables++;miss.push(P.sel);continue}
  const ex=await expand(cands.map(c=>c.body.includes('${')?'x:':unesc(c.body)));
  const ok=cands.filter((c,i)=>!c.body.includes('${')&&ex[i]&&sig(ex[i])===sig(rule.d));
  if(!ok.length){if(cands.some(c=>c.body.includes('${')))stat.modele++;else{stat.introuvables++;miss.push(P.sel)}continue}
  const twins=cs.get(P.sel+'\u0003'+sig(rule.d));
  // plusieurs copies identiques : il faut que toutes aient le même sort
  const deadKey=p=>p?p.dead.map(d=>d.p).sort().join(','):'';
  if(ok.length!==twins.length||!twins.every(t=>deadKey(planBy.get(t.sh+':'+t.ri))===deadKey(P))){stat.ambigues++;continue}
  stat.trouvees++;const deadSet=new Set(P.dead.map(d=>d.p));
  for(const c of ok){if(edits.some(e=>e.rule===c.a))continue;const parts=splitDecl(c.body);const exd=await expand(parts.map(([x,y])=>unesc(c.body.slice(x,y))));let removed=0,kept=0;const loc=[];
   parts.forEach(([x,y],i)=>{const txt=c.body.slice(x,y);const prop=(txt.split(':')[0]||'').trim().toLowerCase();const lh=exd[i];
    if(lh&&lh.length&&!NEVER.test(prop)&&!prop.startsWith('--')&&lh.every(l=>deadSet.has(l[0])&&!NEVER.test(l[0]))){loc.push([c.bodyStart+x,c.bodyStart+y]);removed++}else if(txt.trim())kept++});
   if(!removed)continue;
   if(!kept){edits.push({a:c.a,b:c.b,rule:c.a,all:1});stat.reglesVides++;stat.decl+=removed}
   else{loc.forEach(([x,y])=>edits.push({a:x,b:y,rule:c.a}));stat.decl+=removed;stat.partielles++}}}
 edits.sort((x,y)=>y.a-x.a);for(let i=1;i<edits.length;i++)if(edits[i].b>edits[i-1].a)throw new Error('chevauchement');
 for(const e of edits)src=src.slice(0,e.a)+src.slice(e.b);
 fs.writeFileSync(OUT,src);console.log(JSON.stringify(stat));console.log('introuvables (extrait) :',miss.slice(0,12).join(' ║ ').slice(0,900));await br.close()})()
