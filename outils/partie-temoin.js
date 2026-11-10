// Partie témoin — filet de sécurité avant un nettoyage du code.
//
// Joue automatiquement la même partie sur deux versions du jeu, avec le hasard et l'horloge
// figés (même graine, temps simulé), puis compare tout ce qui s'est passé : fenêtres, scènes,
// alertes, et l'état complet de la sauvegarde toutes les 10 secondes de jeu.
// Si les deux versions se comportent pareil, le résultat est « identiques ».
// Sinon, le script donne le moment de la première différence et les valeurs qui diffèrent.
//
// Installation (une fois) :  npm install playwright && npx playwright install chromium
// Utilisation :
//   node outils/partie-temoin.js AVANT APRES [départ=an2] [durée_s=600] [graine=1]
//     AVANT, APRES : adresses des deux versions (ex. http://localhost:8765/sauvegarde-v682.html
//                    et http://localhost:8765/index.html). La même adresse deux fois vérifie
//                    que la partie témoin est bien reproductible.
//     départ       : debut (nouvelle partie), an2, an3 ou an3j (parties de test du jeu)
//     durée_s      : secondes de jeu simulées
// Ajouter V=1 devant la commande pour voir chaque geste du joueur automatique.
// Ajouter SORTIE=dossier pour garder les deux journaux complets (JSON).
//
// Limites : la partie témoin ne couvre que ce que ce joueur automatique rencontre. Le dessin
// n'est pas comparé (voir outils/test-ecrans.js pour la mise en page).

const { chromium } = require('playwright');
const [A, B_, START = 'an2', DUR = '600', SEED = '1'] = process.argv.slice(2);
if (!A || !B_) { console.error('Utilisation : node outils/partie-temoin.js AVANT APRES [départ=an2] [durée_s=600] [graine=1]'); process.exit(2) }
const STEP = 250, SNAP = 10000;

async function run(url, tag) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await p.addInitScript(seed => {
    // horloge simulée : le temps n'avance que par __adv(ms) ; minuteries et images dans l'ordre exact de leurs échéances
    {
      const RD = Date, BASE = RD.UTC(2026, 0, 5, 9, 0, 0), FR = 1000 / 60, Q = new Map(), realRAF = window.requestAnimationFrame.bind(window); let now = 0, seq = 0;
      const add = (f, t, o) => { const id = ++seq; Q.set(id, Object.assign({ id, f, t }, o)); return id };
      window.setTimeout = (f, d, ...a) => add(f, now + Math.max(0, +d || 0), { a });
      window.setInterval = (f, d, ...a) => { const iv = Math.max(1, +d || 0); return add(f, now + iv, { a, iv }) };
      window.clearTimeout = window.clearInterval = window.cancelAnimationFrame = id => { Q.delete(id) };
      window.requestAnimationFrame = f => add(f, (Math.floor(now / FR + 1e-6) + 1) * FR, { raf: 1 });
      window.requestIdleCallback = f => add(() => f({ didTimeout: false, timeRemaining: () => 8 }), now + 1, {}); window.cancelIdleCallback = id => { Q.delete(id) };
      const pnow = () => now; try { Object.defineProperty(performance, 'now', { value: pnow, configurable: true }) } catch (_) { performance.now = pnow }
      class D extends RD { constructor(...a) { if (a.length) super(...a); else super(BASE + now) } static now() { return BASE + Math.floor(now) } } window.Date = D;
      window.__adv = async ms => {
        const end = now + ms;
        for (; ;) {
          let n = null; for (const e of Q.values()) if (e.t <= end && (!n || e.t < n.t || (e.t === n.t && e.id < n.id))) n = e;
          if (!n) break; if (n.t > now) now = n.t;
          if (n.iv) n.t += n.iv; else Q.delete(n.id);
          try { if (typeof n.f == 'function') n.f.apply(window, n.raf ? [now] : (n.a || [])); else (0, eval)(String(n.f)) } catch (e) { console.error(e); window.__ERRS = (window.__ERRS || 0) + 1 }
          await null; await null;
        }
        now = end; await new Promise(r => realRAF(() => r()));   // une vraie image entre deux pas : mise en page et observateurs
      };
    }
    // hasard figé (mulberry32)
    let a = seed >>> 0; Math.random = function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
    try { localStorage.clear(); sessionStorage.clear() } catch (_) { }
    try { window.AudioContext = undefined; window.webkitAudioContext = undefined } catch (_) { }
  }, +SEED);
  const q = START === 'debut' ? '' : '?an=' + START.replace('an', '');
  await p.goto(url + q, { waitUntil: 'load' });
  await p.waitForTimeout(1500);                       // images et polices (temps réel)
  if (!process.env.DESSIN) await p.evaluate(() => { try { const g = CanvasRenderingContext2D.prototype;['drawImage', 'fillRect', 'fillText', 'strokeText', 'fill', 'stroke', 'clearRect', 'strokeRect', 'putImageData'].forEach(n => { g[n] = function () { } }) } catch (_) { } });   // le dessin ne change pas le jeu : on l'allège pour aller vite (DESSIN=1 pour le garder)
  const ev = [], snaps = []; let vt = 0, lastK = '', same = 0, prev = {};
  const total = +DUR * 1000;
  while (vt < total) {
    try { await p.evaluate(ms => __adv(ms), STEP) } catch (e) { ev.push({ t: vt / 1000, k: 'ARRÊT', x: String(e.message).split('\n')[0].slice(0, 120) }); break } vt += STEP;
    // 1. ce qui est affiché
    const cur = await p.evaluate(() => {
      const $ = id => document.getElementById(id), tx = e => { try { return (window.txa ? txa(e) : e.textContent) } catch (_) { return e.textContent } };
      const cl = t => (t || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      const vis = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility != 'hidden';
      const o = {};
      const m = $('m'); if (m && !m.hidden) { const h = m.querySelector('h2,h3'); o.fenetre = cl(tx(h || m)) }
      const f = $('fmo'); if (f) o.scene = cl(tx(f.querySelector('.ft') || f)) + ' — ' + cl(tx(f.querySelector('.fd') || f)).slice(0, 90);
      { const ex = [...document.querySelectorAll('#mrt,#epov,#shov,#xpov,#rsp,#splx,#lcbook,#vig,#tconf')].filter(vis).map(e => (e.id + ' ' + cl(tx(e.querySelector('h2,h3,b') || e))).slice(0, 120)).join(' | '); if (ex) o.autre = ex }
      const c = $('ctip'); if (c && c.classList.contains('on')) o.conseil = cl(tx(c.querySelector('p') || c));
      const u = $('ulp'); if (u && vis(u)) o.nouveau = cl(tx(u.querySelector('.un') || u));
      const ts = $('mtst'); if (ts) o.toast = cl(tx(ts));
      o.alertes = [...document.querySelectorAll('.al')].filter(vis).map(e => cl(tx(e)).replace(/\(\d+ s\)/, '').replace(/\d+ ?s\b/g, '').slice(0, 80)).filter(t => t.length > 2).sort().join(' | ');
      try { o.date = 'A' + YR + ' M' + mo + ' J' + day } catch (_) { }
      try { if (ended) o.fin = String(typeof ENDING != 'undefined' ? ENDING : 'fin') } catch (_) { }
      return o;
    });
    for (const k of ['fenetre', 'scene', 'autre', 'conseil', 'nouveau', 'toast', 'alertes', 'fin']) if ((cur[k] || '') !== (prev[k] || '') && cur[k]) ev.push({ t: vt / 1000, d: cur.date, k, x: cur[k] });
    prev = cur;
    // 2. l'état complet, toutes les 10 s de jeu
    if (vt % SNAP === 0) {
      const s = await p.evaluate(() => { try { if (typeof started == 'undefined' || !started) return null; saveNow(1); return localStorage.getItem('hsa-save-v1') } catch (e) { return 'ERR ' + e.message } });
      snaps.push({ t: vt / 1000, d: cur.date, s });
    }
    // 3. un geste du joueur automatique par seconde de jeu
    if (vt % 1000) continue;
    const k = await p.evaluate(([stuck, rep]) => {
      const $ = id => document.getElementById(id);
      const NON = /Recommencer|Rejouer|Reprendre (au|depuis|le chapitre)|Revenir au|Effacer|Supprimer|Quitter|Partag|Télécharg|Installer|Tableau souvenir|Pétanque|Jouer le tournoi|Mode test/;   // boutons qui quittent ou relancent la partie
      const T0_ = e => (e.innerText || '').replace(/\s+/g, ' ').trim();
      const vis = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility != 'hidden' && !(e.tagName == 'BUTTON' && NON.test(T0_(e)));
      const T = e => (e.innerText || '').replace(/\s+/g, ' ').trim();
      const btn = (root, re) => [...(root || document).querySelectorAll('button')].find(x => vis(x) && !x.disabled && re.test(T(x)));
      const go = (x, k) => { x.click(); return k + ':' + T(x).slice(0, 40) };
      const tap = e => { const r = e.getBoundingClientRect(), o = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'touch', isPrimary: true };['pointerdown', 'pointerup'].forEach(n => e.dispatchEvent(new PointerEvent(n, o))); e.dispatchEvent(new MouseEvent('click', o)); return 'toucher:' + (e.id || e.className || e.tagName) };
      if (stuck) { const any = [...document.querySelectorAll('button')].filter(x => vis(x) && !x.disabled && !x.closest('#tabs,#hud')); const x = any[stuck % (any.length || 1)]; if (x) return go(x, 'débloquer') }
      const f = $('fmo'); if (f) { const bs = [...f.querySelectorAll('.fbt button')].filter(vis); const x = bs.find(x => !/Plus tard|Pas maintenant|Pas cette|Refuser|Ne pas|Laisser/.test(T(x))) || bs[0]; return x ? go(x, 'scène') : tap(f) }
      const m = $('m');
      { const x = btn(document, /^(▶ ?)?(Continuer|Fermer|Compris|Suivant|C.est parti|Reprendre)/); if (x && !(m && !m.hidden && m.contains(x)) && !x.closest('#ctip,#ulp')) return go(x, 'par-dessus') }
      if (m && !m.hidden) { const x = btn(m, /(Commencer|C.est moi|Suivant|C.est parti|Compris|Continuer|D.accord|Passer(?! le guide)|^OK|Fermer)/) || btn(m, /./); if (rep) { const all = [...m.querySelectorAll('button')].filter(x => vis(x) && !x.disabled); if (all.length) return go(all[rep % all.length], 'fenêtre') } if (x) return go(x, 'fenêtre'); return tap(m) }
      const n = $('nalg'); if (n && vis(n)) { const x = btn(n, /On en commande|Compris/); if (x) return go(x, 'naloxone'); const bn = $('bn'); if (bn && vis(bn) && !bn.disabled) return go(bn, 'naloxone') }
      const g = $('gdr'); if (g && vis(g)) { const r = g.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (e) { const b = e.closest('button') || e; if (b.click) { b.click(); return 'guide:' + (b.id || T(b).slice(0, 30) || b.tagName) } } }
      const c = $('ctip'); if (c && c.classList.contains('on')) { const x = c.querySelector('button'); if (x) return go(x, 'conseil') }
      const call = [...document.querySelectorAll('.al.call')].find(vis); if (call) { call.click(); return 'appel' }
      const u = $('ulp'); if (u && vis(u)) { const x = u.querySelector('.ub button'); if (x) return go(x, 'nouveau') }
      const tu = $('tut'); if (tu && !tu.hidden) { const x = btn(tu, /Suivant|Passer|C.est parti|Compris/); if (x) return go(x, 'tuto') }
      const any = btn(document, /(Commencer|C.est moi|Suivant|Passer(?! le guide)|C.est parti|Nouvelle partie|Jouer)/); if (any) return go(any, 'départ');
      // toute autre fenêtre qui met le jeu en pause : le premier bouton réellement au-dessus
      { let pz = false; try { pz = !!paused } catch (_) { } if (pz) { const x = [...document.querySelectorAll('button')].find(x => { if (!vis(x) || x.disabled || x.closest('#tabs,#hud,#side')) return false; const r = x.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && (e === x || x.contains(e)) }); if (x) return go(x, 'pause') } }
      const ov = [...document.querySelectorAll('div')].find(d => vis(d) && /Touche (l’écran )?pour continuer/.test(d.textContent) && d.textContent.length < 600); if (ov) return tap(ov);
      return '';
    }, [same > 12 ? same : 0, same]);
    if (k) { if (process.env.V) console.error(tag, vt / 1000 + 's', cur.date || '', k); ev.push({ t: vt / 1000, d: cur.date, k: 'geste', x: k }); const w = (cur.fenetre || cur.scene || cur.autre || '') + '|' + k.split(':')[0]; same = w === lastK ? same + 1 : 0; lastK = w } else { same = 0; lastK = '' }
    if (cur.fin && vt > 5000 && !k) break;
  }
  if (process.env.DEBUG) { console.error(tag, await p.evaluate(() => { const o = {}; for (const k of ['paused', 'started', 'ended', 'GAMEON', 'INTRO', 'day', 'dayT', 'TS']) try { o[k] = eval(k) } catch (_) { o[k] = '?' } o.body = document.body.className; o.m = !document.getElementById('m').hidden; o.top = [...document.querySelectorAll('body>*,#app>*')].filter(e => e.getClientRects().length && getComputedStyle(e).position == 'fixed' && e.getBoundingClientRect().width > 300 && e.getBoundingClientRect().height > 600).map(e => e.tagName + '#' + e.id + '.' + e.className).join(' '); o.errs = window.__ERRS; return JSON.stringify(o) })); await p.screenshot({ path: process.env.DEBUG + '-' + tag + '.png' }) }
  await b.close();
  return { url, ev, snaps, errs: [...new Set(errs)] };
}

const flat = (o, pre = '', out = {}) => { if (o && typeof o == 'object') { for (const k of Object.keys(o)) flat(o[k], pre ? pre + '.' + k : k, out) } else out[pre] = o; return out };
const NOISE = /(^|\.)(ts|runId)$/;

(async () => {
  const t0 = Date.now();
  const [ra, rb] = await Promise.all([run(A, 'A'), run(B_, 'B')]);
  if (process.env.SORTIE) { const fs = require('fs'); fs.mkdirSync(process.env.SORTIE, { recursive: true }); fs.writeFileSync(process.env.SORTIE + '/avant.json', JSON.stringify(ra)); fs.writeFileSync(process.env.SORTIE + '/apres.json', JSON.stringify(rb)) }
  const last = r => (r.snaps.at(-1) || {}).d || '?';
  console.log(`Partie témoin : départ ${START}, ${DUR} s de jeu, graine ${SEED} — ${Math.round((Date.now() - t0) / 1000)} s de calcul`);
  console.log(`  AVANT : ${ra.ev.length} événements, ${ra.snaps.length} états, arrivée ${last(ra)}${ra.errs.length ? ' · erreurs : ' + ra.errs.join(' / ') : ''}`);
  console.log(`  APRÈS : ${rb.ev.length} événements, ${rb.snaps.length} états, arrivée ${last(rb)}${rb.errs.length ? ' · erreurs : ' + rb.errs.join(' / ') : ''}`);
  let bad = 0;
  // événements
  const n = Math.max(ra.ev.length, rb.ev.length);
  for (let i = 0; i < n; i++) {
    const x = ra.ev[i], y = rb.ev[i];
    if (!x || !y || x.t !== y.t || x.k !== y.k || x.x !== y.x) {
      bad++; console.log(`\nPremière différence dans les événements (n° ${i + 1}) :`);
      for (let j = Math.max(0, i - 3); j < i; j++) console.log(`   = ${ra.ev[j].t} s ${ra.ev[j].d || ''} · ${ra.ev[j].k} · ${ra.ev[j].x}`);
      console.log(`   AVANT ${x ? `${x.t} s ${x.d || ''} · ${x.k} · ${x.x}` : '(rien)'}`);
      console.log(`   APRÈS ${y ? `${y.t} s ${y.d || ''} · ${y.k} · ${y.x}` : '(rien)'}`);
      break;
    }
  }
  // états
  for (let i = 0; i < Math.max(ra.snaps.length, rb.snaps.length); i++) {
    const x = ra.snaps[i], y = rb.snaps[i];
    if (!x || !y) { bad++; console.log(`\nÉtat n° ${i + 1} : présent d'un seul côté.`); break }
    if (x.s === y.s) continue;
    let fx, fy; try { fx = flat(JSON.parse(x.s)); fy = flat(JSON.parse(y.s)) } catch (_) { bad++; console.log(`\nÉtat à ${x.t} s illisible : ${String(x.s).slice(0, 80)} / ${String(y.s).slice(0, 80)}`); break }
    const keys = [...new Set([...Object.keys(fx), ...Object.keys(fy)])].filter(k => !NOISE.test(k) && fx[k] !== fy[k]);
    if (!keys.length) continue;
    bad++; console.log(`\nPremière différence dans l'état du jeu, à ${x.t} s (${x.d || '?'}) : ${keys.length} valeur(s)`);
    keys.slice(0, 25).forEach(k => console.log(`   ${k} : ${JSON.stringify(fx[k])} → ${JSON.stringify(fy[k])}`));
    if (keys.length > 25) console.log(`   … et ${keys.length - 25} autres`);
    break;
  }
  console.log(bad ? '\nRésultat : DIFFÉRENTES' : '\nRésultat : identiques');
  process.exit(bad ? 1 : 0);
})();
