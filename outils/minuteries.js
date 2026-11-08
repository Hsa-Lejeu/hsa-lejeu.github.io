// Mesure des minuteries (setInterval) pendant 20 s de jeu, en portrait et en paysage.
// Usage : node outils/minuteries.js URL   (ex. http://localhost:8765/index.html)
// mesure des minuteries : nombre d'intervalles actifs, appels par seconde, temps passé (ms par seconde)
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [vn,w,h] of [['portrait',412,860],['paysage',915,412]]){const p=await b.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true});
 await p.addInitScript(()=>{const S=window.__IV={act:new Map(),calls:0,ms:0,by:{}};const _si=window.setInterval,_ci=window.clearInterval;
  window.setInterval=function(f,d,...a){if(typeof f!='function')return _si(f,d,...a);const src=String(f).slice(0,70).replace(/\s+/g,' ');const id=_si(function(){const t=performance.now();try{return f.apply(this,arguments)}finally{const dt=performance.now()-t;S.calls++;S.ms+=dt;const k=(d|0)+'ms '+src;const o=S.by[k]||(S.by[k]={n:0,ms:0});o.n++;o.ms+=dt}},d,...a);S.act.set(id,d|0);return id};
  window.clearInterval=function(id){S.act.delete(id);return _ci(id)}});
 await p.goto(process.argv[2]+'?an=2');await p.waitForTimeout(7000);
 await p.evaluate(()=>{try{window.mrtShow=function(){};gdEnd()}catch(_){}document.querySelectorAll('#mrt,#fmo').forEach(e=>e.remove());$('m').hidden=true;paused=false;const S=__IV;S.calls=0;S.ms=0;S.by={};if(window.__LAYST){__LAYST.n=0;__LAYST.ms=0}});
 await p.waitForTimeout(20000);
 const r=await p.evaluate(()=>{const S=__IV;const top=Object.entries(S.by).sort((a,b)=>b[1].ms-a[1].ms).slice(0,8).map(([k,o])=>(o.ms/20).toFixed(2)+' ms/s · '+(o.n/20).toFixed(1)+'/s · '+k);const L=window.__LAYST;return {lay:L?(L.n/20).toFixed(1)+' passages/s, '+(L.ms/20).toFixed(2)+' ms/s':'',actifs:S.act.size,rapides:[...S.act.values()].filter(d=>d<=250).length,appels:(S.calls/20).toFixed(0),ms:(S.ms/20).toFixed(1),top}});
 console.log(vn,r.lay?'· mise en page à la demande : '+r.lay:'','· intervalles actifs',r.actifs,'(≤250 ms :',r.rapides+')','·',r.appels,'appels/s ·',r.ms,'ms de calcul par seconde');r.top.forEach(t=>console.log('   ',t));await p.close()}
await b.close()})();
