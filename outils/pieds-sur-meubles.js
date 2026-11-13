// Repère les personnages posés SUR un meuble dans les petites scènes (fenêtres, cartes, projets, parcours).
// Usage : node outils/pieds-sur-meubles.js http://localhost:8767/index.html [sortie.png]
// Principe : chaque scène est dessinée dans un canevas 200 × 104 ; on note, dans l'ordre, les meubles
// (H.F, H.O, EVd, iaG) et les personnages (H.spr). Un personnage est signalé quand ses pieds tombent
// dans le rectangle d'un meuble dessiné AVANT lui, plus haut que le bas de ce meuble : à l'écran, il a
// l'air debout dessus. Tapis, chaises, canapés, lits, bancs… sont permis (liste OK ci-dessous).
// Les scènes des fenêtres (popWin) sont relues dans le code et rejouées avec des valeurs d'essai :
// celles qui dépendent d'une variable inconnue sont comptées « non jouées ».
const { chromium } = require('playwright'); const fs = require('fs');
const URL = process.argv[2] || 'http://localhost:8767/index.html', OUT = process.argv[3] || 'pieds-sur-meubles.png';
const OK = /shop|tree|lamp_s|hydr|rug|yoga|chair|sofa|arm_|bed|recl|seat|bench|stool|wc|bal_|bl_|bub|mat|jwall|bars|window|poster|lamp|plant|stoveh/;
function bodies(s) { // toutes les scènes « draw: » du code
  const out = []; let i = 0;
  while ((i = s.indexOf('draw:', i)) >= 0) {
    let j = i + 5; while (s[j] === ' ') j++;
    let k = j, d = 0, q = null, st = false;
    if (s.startsWith('scn(', j)) { for (; k < s.length; k++) { const c = s[k]; if (c === '(') d++; else if (c === ')') { d--; if (!d) break } } }
    else if (s[j] === '(' || /\w/.test(s[j])) {
      const a = s.indexOf('=>', j); if (a < 0 || a - j > 40) { i = j; continue }
      k = a + 2; while (s[k] === ' ') k++;
      if (s[k] !== '{') { i = k; continue }
      for (; k < s.length; k++) { const c = s[k]; if (q) { if (c === '\\') k++; else if (c === q) q = null } else if ('\'"`'.includes(c)) q = c; else if (c === '{') { d++; st = true } else if (c === '}') { d--; if (!d && st) break } }
    } else { i = j; continue }
    const src = s.slice(j, k + 1), ctx = s.slice(Math.max(0, i - 600), i), m = [...ctx.matchAll(/[,{]n:[`']([^`']{3,60})/g)].pop() || [...ctx.matchAll(/t:'([^']{3,50})'/g)].pop();
    out.push([m ? m[1] : '?', src]); i = k;
  }
  return out;
}
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.route('**/*.html*', async r => { const res = await r.fetch(); let t = await res.text(); t = t.replace('function dfMonth(am){', 'window.__ev=s=>eval(s);function dfMonth(am){'); r.fulfill({ response: res, body: t, headers: { ...res.headers(), 'content-type': 'text/html; charset=utf-8' } }) });
  await p.goto(URL + (URL.includes('?') ? '' : '?an=3'), { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForTimeout(8000);
  const html = await (await fetch(URL.split('?')[0])).text(), BD = bodies(html);
  const R = await p.evaluate(([BD, OKs]) => {
    const OK = new RegExp(OKs), res = [], skipped = [];
    let LOG = null; const rect = (g, x, y, w, h) => { const t = g.getTransform(), xs = [x * t.a + y * t.c + t.e, (x + w) * t.a + y * t.c + t.e], ys = [x * t.b + y * t.d + t.f, x * t.b + (y + h) * t.d + t.f]; return [Math.min(...xs), Math.min(...ys), Math.abs(xs[1] - xs[0]), Math.abs(ys[1] - ys[0])] };
    const wrapG = g => { if (g.__pw) return; g.__pw = 1; const di = g.drawImage; g.drawImage = function (...a) { if (LOG && LOG.cap) { const n = a.length; const [x, y, w, h] = n >= 9 ? a.slice(5, 9) : n >= 5 ? a.slice(1, 5) : [a[1], a[2], a[0].width, a[0].height]; LOG.cap.push(rect(this, x, y, w, h)) } return di.apply(this, a) } };
    const tag = (kind, n, f) => function (...a) { if (!LOG) return f.apply(this, a); const prev = LOG.cap; LOG.cap = []; try { return f.apply(this, a) } finally { const rs = LOG.cap; LOG.cap = prev; if (rs.length) LOG.items.push({ kind, n: String(n(a)), r: rs[rs.length - 1], all: rs }) } };
    window.__mkH = H => { wrapG(H.g); for (const k of ['F', 'O']) H[k] = tag('m', a => a[0], H[k]); H.spr = tag('p', a => 'perso', H.spr); return H };
    for (const k of ['iaG', 'EVd']) if (typeof window[k] === 'function') { const f = window[k]; window[k] = tag('m', a => a[1], f) }
    const check = (name, run) => {
      for (const T of [1, 3.4, 7]) {
        LOG = { items: [], cap: null }; const c = document.createElement('canvas'); c.width = 200; c.height = 104; const g = c.getContext('2d'); wrapG(g); let err = null;
        try { run(g, T) } catch (e) { err = e.message }
        const it = LOG.items; LOG = null; if (err && !it.length) { skipped.push(name + ' : ' + err); return }
        const bad = [];
        it.forEach((P, i) => {
          if (P.kind !== 'p') return; const [px, py, pw, ph] = P.r, fx = px + pw / 2, fy = py + ph - 2;
          for (let j = 0; j < i; j++) {
            const M = it[j]; if (M.kind !== 'm' || OK.test(M.n)) continue; const [x, y, w, h] = M.r;
            if (w > 150 || h > 90) continue; // fonds
            if (fx > x + 1 && fx < x + w - 1 && fy > y + 2 && fy < y + h - 2) bad.push({ meuble: M.n, perso: [Math.round(fx), Math.round(fy)], r: M.r.map(Math.round) })
          }
        });
        if (bad.length) { res.push({ name, T, bad, png: c.toDataURL() }); return }
      }
    };
    const H0 = g => mkH(g);
    try { for (const k in PRJS) check('PRJS.' + k, (g, T) => PRJS[k](H0(g), T, 1)) } catch (e) { }
    try { for (const k in LCD) if (typeof LCD[k] === 'function') check('LCD.' + k, (g, T) => LCD[k](H0(g), T, 13, { who: 49, staff: 1 })) } catch (e) { }
    try { if (window.SC8) for (const k in SC8) check('SC8.' + k, (g, T) => SC8[k](H0(g), T, 8, () => { })) } catch (e) { }
    try { CARDS.forEach((cd, i) => check('carte ' + cd[0], (g, T) => { try { CXI[i] = null } catch (_) { } __ev('cxImg')(i) })) } catch (e) { }
    const scn = (bg, fn) => (H, T) => { H.room(bg[0], bg[1]); fn(H, T) };
    BD.forEach(([n, src], i) => {
      let f; try { f = __ev('((scn,h,z,ok,E,H_)=>(' + src + '))')(scn, { ci: 8, n: 'Léa' }, { ci: 49, n: 'Paul', r: 1 }, true, { sc: 'room' }, null) } catch (e) { skipped.push(n + ' : ' + e.message); return }
      check('fenêtre « ' + n + ' »', (g, T) => f(H0(g), T));
    });
    window.__mkH = null; return { res, skipped, n: BD.length };
  }, [BD, OK.source]);
  console.log(`${R.res.length} scène(s) signalée(s) ; ${R.n} scènes de fenêtres lues, ${R.skipped.length} non jouées.`);
  R.res.forEach(r => console.log(`- ${r.name} (T=${r.T}) : ` + r.bad.map(x => `pieds en ${x.perso} sur « ${x.meuble} » ${JSON.stringify(x.r)}`).join(' ; ')));
  if (R.res.length) {
    const u = await p.evaluate(L => new Promise(ok => { const cols = 4, c = document.createElement('canvas'); c.width = cols * 400; c.height = Math.ceil(L.length / cols) * 226; const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false; let n = 0; L.forEach((r, i) => { const im = new Image(); im.onload = () => { const X = (i % cols) * 400, Y = Math.floor(i / cols) * 226; g.drawImage(im, X, Y, 400, 208); g.strokeStyle = '#ff3030'; g.lineWidth = 2; r.bad.forEach(b => { g.strokeRect(X + b.r[0] * 2, Y + b.r[1] * 2, b.r[2] * 2, b.r[3] * 2); g.beginPath(); g.arc(X + b.perso[0] * 2, Y + b.perso[1] * 2, 5, 0, 7); g.stroke() }); g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.fillText(r.name.slice(0, 55), X + 4, Y + 221); if (++n === L.length) ok(c.toDataURL()) }; im.src = r.png }) }), R.res);
    fs.writeFileSync(OUT, Buffer.from(u.split(',')[1], 'base64')); console.log('Planche : ' + OUT);
  }
  if (process.env.VERBOSE) R.skipped.forEach(s => console.log('  non jouée : ' + s));
  await b.close();
})();
