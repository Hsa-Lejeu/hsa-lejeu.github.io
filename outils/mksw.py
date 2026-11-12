# génère sw.js : le code dans un cache par version ; images, musiques, police et three.js dans un cache durable
# usage : python3 outils/mksw.py v689 liste-des-images.txt   (à lancer depuis la racine du site)
import sys,json,glob
ver,liste=sys.argv[1],sys.argv[2]
IMG=[l.strip() for l in open(liste) if l.strip()]
MUS=['musique/hiver.mp3','musique/printemps.mp3','musique/ete.mp3','musique/automne.mp3','musique/reunions_m.mp3','musique/debat.mp3','musique/petanque_m.mp3','musique/petanque_choix_m.mp3','musique/tidy_clinic_m.mp3']
LIB=['three-r128.min.js']+sorted(glob.glob('fonts/*.woff2'))
CODE=['index.html','manifest.webmanifest','icon-192-v2.png','icon-512-v2.png','icon-maskable-512-v2.png','apple-touch-icon-v2.png']
js=f"""// v586 : le code (index.html) est dans un cache par version ; les images, les musiques, la police et three.js dans un cache durable.
// Un fichier durable garde son nom tant qu'il ne change pas : une nouvelle version ne retélécharge que ce qui a changé.
// Une musique, une police ou three.js modifiés doivent changer de nom.
const CACHE='hsa-{ver}',AC='hsa-medias';
const CODE={json.dumps(CODE)};
const MEDIA={json.dumps(MUS+LIB+IMG)};
self.addEventListener('install',e=>{{e.waitUntil(Promise.all([
 caches.open(CACHE).then(c=>c.addAll(CODE.map(u=>new Request(u,{{cache:'no-cache'}})))),
 caches.open(AC).then(c=>Promise.all(MEDIA.map(u=>c.match(u).then(r=>r||c.add(u).catch(()=>{{}})))))
]).then(()=>self.skipWaiting()))}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==AC).map(k=>caches.delete(k))))
 .then(()=>caches.open(AC)).then(c=>c.keys().then(rs=>Promise.all(rs.filter(r=>!MEDIA.some(u=>new URL(u,self.registration.scope).href===r.url)).map(r=>c.delete(r))))).then(()=>self.clients.claim()))}});
self.addEventListener('fetch',e=>{{if(e.request.method!=='GET')return;
 // la page du jeu : le réseau d'abord (validation ETag : une page inchangée revient en 304) ;
 // si le réseau ne répond pas en 3 s, la copie en cache est servie tout de suite et la réponse du réseau, si elle arrive, remplace la copie pour la prochaine fois
 if(e.request.mode==='navigate'||/\\/(index\\.html)?$/.test(new URL(e.request.url).pathname)){{
  const net=fetch(e.request,{{cache:'no-cache'}}).then(res=>{{if(res&&res.ok){{const cp=res.clone();caches.open(CACHE).then(c=>c.put('index.html',cp))}}return res}});
  const cached=()=>caches.match('index.html',{{ignoreSearch:true}}).then(r=>r||caches.match('./'));
  e.respondWith(new Promise(ok=>{{let done=0;const fin=r=>{{if(!done&&r){{done=1;ok(r)}}}};
   const t=setTimeout(()=>cached().then(r=>{{if(r)fin(r)}}),3000);
   net.then(r=>{{clearTimeout(t);fin(r)}},()=>{{clearTimeout(t);cached().then(r=>{{if(r)fin(r);else if(!done){{done=1;ok(Response.error())}}}})}});
  }}));
  e.waitUntil(net.catch(()=>{{}}));return}}
 e.respondWith(caches.match(e.request,{{ignoreSearch:true}}).then(r=>r||fetch(e.request).then(res=>{{if(res&&(res.ok||res.type==='opaque')){{const cp=res.clone();const m=/\\/(a|musique|fonts)\\/|three-r\\d+/.test(new URL(e.request.url).pathname);caches.open(m?AC:CACHE).then(c=>c.put(e.request,cp))}}return res}})).catch(()=>caches.match('index.html')))}});
"""
open('sw.js','w').write(js);print('sw.js',len(IMG),'images,',len(LIB),'fichiers durables de plus, musiques',len(MUS))
