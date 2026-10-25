const CACHE='hsa-v338';
const ASSETS=['./','index.html','manifest.webmanifest','icon-192-v2.png','icon-512-v2.png','icon-maskable-512-v2.png','apple-touch-icon-v2.png',
 'musique/hiver.mp3','musique/printemps.mp3','musique/ete.mp3','musique/automne.mp3','musique/reunions.mp3'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return res})).catch(()=>caches.match('index.html')))});
