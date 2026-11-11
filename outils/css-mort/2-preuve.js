// Preuve : déclarations qui perdent toujours contre une autre de même cible et mêmes conditions.
const fs=require('fs');const D=JSON.parse(fs.readFileSync(process.argv[2]));const OUT=process.argv[3];
const names=Object.keys(D);
// ancêtres garantis de chaque id : intersection sur tous les relevés où il existe
const ANC={};for(const n of names)for(const [id,a] of Object.entries(D[n].anc)){ANC[id]=ANC[id]?ANC[id].filter(x=>a.includes(x)):a.slice()}
const baseKeys=new Set(D.accueil.sheets.map(s=>s.key));
const ref=D['an3-p'];
const splitTop=(s,ch)=>{const o=[];let d=0,cur='',q='';for(let i=0;i<s.length;i++){const c=s[i];if(q){cur+=c;if(c==='\\'){cur+=s[++i]}else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;cur+=c;continue}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;if(!d&&c===ch){o.push(cur);cur=''}else cur+=c}o.push(cur);return o.map(x=>x.trim())};
const complex=sel=>{ // -> [{c:compound, k:combinator vers la gauche}]
 const t=[];let d=0,cur='',q='',comb='';const push=()=>{if(cur){t.push({c:cur,k:comb||(t.length?' ':'')});cur='';comb=''}};
 for(let i=0;i<sel.length;i++){const c=sel[i];if(q){cur+=c;if(c==='\\'){cur+=sel[++i]}else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;cur+=c;continue}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;
  if(!d&&(c===' '||c==='>'||c==='+'||c==='~')){push();if(c!==' ')comb=c;continue}cur+=c}push();return t};
const spec=sel=>{let a=0,b=0,c=0;let s=sel;
 // pseudo-classes fonctionnelles
 s=s.replace(/:(not|is|has|where|matches)\(((?:[^()]|\([^()]*\))*)\)/g,(m,f,arg)=>{if(f==='where')return '';let best=[0,0,0];for(const x of splitTop(arg,',')){const v=spec(x);if(v[0]>best[0]||(v[0]===best[0]&&(v[1]>best[1]||(v[1]===best[1]&&v[2]>best[2]))))best=v}a+=best[0];b+=best[1];c+=best[2];return ''});
 s=s.replace(/:(nth-[a-z-]+|lang|dir)\([^)]*\)/g,()=>{b++;return ''});
 s=s.replace(/\[[^\]]*\]/g,()=>{b++;return ''});
 s=s.replace(/::[a-z-]+(\([^)]*\))?/g,()=>{c++;return ''});
 s=s.replace(/:(before|after|first-line|first-letter)\b/g,()=>{c++;return ''});
 s=s.replace(/#[\w-]+/g,()=>{a++;return ''});s=s.replace(/\.[\w-]+/g,()=>{b++;return ''});s=s.replace(/:[a-z-]+/g,()=>{b++;return ''});
 s=s.replace(/[a-zA-Z][\w-]*/g,()=>{c++;return ''});return [a,b,c]};
const idOf=c=>{const m=c.replace(/:(not|is|has|where)\((?:[^()]|\([^()]*\))*\)/g,'').replace(/\[[^\]]*\]/g,'').match(/#([\w-]+)/);return m?m[1]:null};
const canon=sel=>{let t=complex(sel);let ch=true;
 while(ch){ch=false;
  for(let i=1;i<t.length;i++){const X=idOf(t[i].c);const p=t[i-1];if(t[i].k!==' ')continue;
   if(p.c==='html'||p.c==='body'){if(i-1===0||t[i-1].k===' '){t.splice(i-1,1);t[0]&&(t[0].k=t[0].k&&i-1===0?'':t[0].k);if(i-1===0)t[0].k='';ch=true;break}}
   const m=/^#([\w-]+)$/.exec(p.c);if(m&&X&&ANC[X]&&ANC[X].includes(m[1])&&(i-1===0||t[i-1].k===' ')){t.splice(i-1,1);if(i-1===0)t[0].k='';ch=true;break}}}
 return t.map((x,i)=>(i?(x.k===' '?' ':x.k):'')+x.c).join('')};
const cmp=(x,y)=>x.imp-y.imp||x.sp[0]-y.sp[0]||x.sp[1]-y.sp[1]||x.sp[2]-y.sp[2]||x.ord-y.ord;
const plain=v=>/^[-\w\s.,%#()\/'"+*]*$/.test(v)&&!/\d(dvh|svh|lvh|dvw|svw|lvw|cq\w+)\b|\b(clamp|min|max|env|color-mix|image-set)\(/.test(v)&&v.length<300;
const G=new Map();let ord=0;const R=[];
ref.sheets.forEach(sh=>sh.rules.forEach((r,ri)=>{const sels=splitTop(r.sel,',');const rec={sh:sh.si,key:sh.key,sid:sh.id,ri,sel:r.sel,ctx:r.ctx,d:r.d,sels:sels.map(s=>({s,cn:canon(s),sp:spec(s)})),o:ord++,base:baseKeys.has(sh.key)};R.push(rec);
 rec.sels.forEach(S=>{const gk=S.cn+' § '+r.ctx.join(' & ');let g=G.get(gk);if(!g){g=new Map();G.set(gk,g)}r.d.forEach(([p,v,imp])=>{if(p.startsWith('--'))return;const e={rec,S,p,v,imp,sp:S.sp,ord:rec.o};const w=g.get(p);if(!w||cmp(e,w)>0)g.set(p,e)})})}));
let dead=0,total=0;const plan=[];
for(const rec of R){const dd=[];for(const [p,v,imp] of rec.d){if(p.startsWith('--'))continue;total++;let ok=true,by=null;
  for(const S of rec.sels){const w=G.get(S.cn+' § '+rec.ctx.join(' & ')).get(p);if(w.rec===rec){ok=false;break}if(!(w.rec.base||w.rec.key===rec.key)||!plain(w.v)){ok=false;break}by=w}
  if(ok){dd.push({p,v,imp,by:{sel:by.rec.sel,v:by.v,imp:by.imp,sh:by.rec.sh,ri:by.rec.ri}})}}
 if(dd.length){dead+=dd.length;plan.push({sh:rec.sh,sid:rec.sid,ri:rec.ri,sel:rec.sel,ctx:rec.ctx,all:dd.length===rec.d.filter(x=>!x[0].startsWith('--')).length&&dd.length===rec.d.length,n:rec.d.length,dead:dd})}}
fs.writeFileSync(OUT,JSON.stringify(plan));
const hud=/#hud|#spw|#hplank|#chapc|#obc|\.blab|#eu\b|#ac\b|#pl\b|#pf\b|#hardc|#tsb/;
console.log('règles',R.length,'· déclarations (détaillées)',total,'· mortes par preuve',dead,'dans',plan.length,'règles · règles entièrement mortes',plan.filter(x=>x.all).length);
console.log('bandeau : mortes',plan.filter(x=>hud.test(x.sel)).reduce((a,x)=>a+x.dead.length,0),'dans',plan.filter(x=>hud.test(x.sel)).length,'règles, entièrement mortes',plan.filter(x=>hud.test(x.sel)&&x.all).length);
plan.filter(x=>hud.test(x.sel)).slice(0,14).forEach(x=>console.log(' ',x.sel.slice(0,60),'|',x.ctx.join('&').slice(0,40),'|',x.dead.slice(0,3).map(d=>d.p+':'+d.v.slice(0,18)+(d.imp?'!':'')+' ← '+d.by.sel.slice(0,40)+' '+d.by.v.slice(0,18)+(d.by.imp?'!':'')).join(' ; ')));
