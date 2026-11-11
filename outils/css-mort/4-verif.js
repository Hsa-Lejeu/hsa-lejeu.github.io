// Vérifie que la nouvelle page a exactement les anciennes règles, moins des déclarations prouvées mortes.
const fs=require('fs');const [A,B,PLAN]=process.argv.slice(2);const a=JSON.parse(fs.readFileSync(A)),b=JSON.parse(fs.readFileSync(B)),plan=JSON.parse(fs.readFileSync(PLAN));
const P=new Map(plan.map(p=>[p.sh+':'+p.ri,new Set(p.dead.map(d=>d.p))]));let bad=0,gone=0,rg=0;
for(const n of Object.keys(a)){if(!b[n]){console.log('relevé manquant',n);bad++;continue}const sa=a[n].sheets,sb=b[n].sheets;if(Math.abs(sa.length-sb.length)>1){console.log(n,'feuilles',sa.length,sb.length);bad++;continue}
 if(n!=='an3-p')continue; // le plan est indexé sur ce relevé
 sa.forEach((sh,si)=>{const nr=sb[si].rules;let j=0;sh.rules.forEach((r,ri)=>{const dead=P.get(si+':'+ri)||new Set();const c=nr[j];
   if(c&&c.sel===r.sel&&c.ctx.join()===r.ctx.join()){const nm=new Map(c.d.map(x=>[x[0],x]));let ok=true;for(const x of c.d){if(!r.d.some(y=>y[0]===x[0]&&y[1]===x[1]&&y[2]===x[2])){if(dead.has(x[0])&&r.d.some(y=>y[0]===x[0]&&y[2]>=x[2])){gone++;continue}ok=false;console.log('AJOUT/CHANGEMENT',r.sel.slice(0,60),x.join(' '))}}
    for(const y of r.d){if(!nm.has(y[0])){if(dead.has(y[0]))gone++;else{ok=false;console.log('PERTE non prévue',r.sel.slice(0,60),y.join(' '))}}}if(!ok)bad++;j++}
   else{ // règle disparue : toutes ses déclarations devaient être mortes
    if(r.d.every(y=>dead.has(y[0]))){rg++;gone+=r.d.length}else{bad++;console.log('RÈGLE perdue',si,ri,r.sel.slice(0,80))}}});
  if(j!==nr.length){bad++;console.log('feuille',si,'décalage',j,nr.length)}})}
console.log('déclarations retirées (détaillées)',gone,'· règles retirées',rg,'· anomalies',bad);process.exit(bad?1:0)
