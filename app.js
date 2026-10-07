'use strict';

/* ================= Utilidades DOM (el marcado vive en index.html) ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = id => $('#tpl-' + id).content.firstElementChild.cloneNode(true);
const slot = (n, k) => $(`[data-slot="${k}"]`, n);
function fill(n, data) {
  for (const k in data) {
    const e = n.matches(`[data-f="${k}"]`) ? n : $(`[data-f="${k}"]`, n);
    if (e) e.textContent = data[k];
  }
  return n;
}

/* ================= Estado ================= */
const KEY = 'padelmaster-v3';
const TYPES = {
  ko: [' Eliminación directa', 'Perdés y quedás afuera.'],
  groups: ['Fase de grupos + final', 'Grupos todos contra todos; clasifican 2 por grupo a eliminación directa.'],
  rr: ['Todos contra todos', 'Todas las duplas se enfrentan. Gana quien suma más puntos.']
};
const DEMO = ['Gómez / Pérez', 'Lugano / Díaz', 'Fernández / Ruiz', 'Sosa / Molina', 'Navarro / Gil', 'Castro / Vega', 'Ortiz / Rey', 'Silva / Luna'];
const blank = () => ({n: '', d: '', p: '', r: true, type: 'ko', teams: []});
let T = null, S = blank(), mounted = false, setupBuilt = false;
try { const s = localStorage.getItem(KEY); if (s) T = JSON.parse(s) } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(T)) } catch (e) {} };

const name = id => id === 'BYE' ? 'Libre (pasa)' : id == null ? 'Por definir' : T.teams[id];
// Mejor de 3 sets: gana quien llega a 2; el otro tiene 0 o 1 (nunca 2-3, 3-0, etc.)
const done = m => (m.sa === 2 && [0, 1].includes(m.sb)) || (m.sb === 2 && [0, 1].includes(m.sa));
const mw = m => m.sa > m.sb ? m.a : m.b;

/* ================= Pantalla de configuración ================= */
function setupView() {
  $('#setup').replaceChildren(clone('setup'));
  $('#n').value = S.n; $('#d').value = S.d; $('#p').value = S.p; $('#r').checked = S.r;
  $('#n').oninput = e => S.n = e.target.value;
  $('#d').oninput = e => S.d = e.target.value;
  $('#r').onchange = e => S.r = e.target.checked;
  $('#p').oninput = e => { S.p = e.target.value; clearTimeout(setupView.t); setupView.t = setTimeout(drawMap, 600) };
  $('#t').onkeydown = e => { if (e.key === 'Enter') addTeam() };
  $('#add').onclick = addTeam;
  $('#demo').onclick = () => { S.teams = DEMO.slice(); drawTeams() };
  $('#go').onclick = create;
  drawTeams(); drawTypes(); drawMap();
}
function drawTeams() {
  $('#cnt').textContent = S.teams.length;
  $('#chips').replaceChildren(...S.teams.map((t, i) => {
    const c = clone('chip'); fill(c, {t});
    $('b', c).onclick = () => { S.teams.splice(i, 1); drawTeams() };
    return c;
  }));
}
function drawTypes() {
  $('#types').replaceChildren(...Object.entries(TYPES).map(([k, v]) => {
    const c = clone('type'); fill(c, {h: v[0], p: v[1]});
    c.classList.toggle('sel', S.type === k);
    c.onclick = () => { S.type = k; drawTypes() };
    return c;
  }));
}
function drawMap() {
  const p = S.p.trim(), q = encodeURIComponent(p);
  $('#mp').hidden = $('#ml').hidden = !p;
  if (!p) return;
  $('#mp').src = 'https://maps.google.com/maps?q=' + q + '&output=embed';
  $('#mlink').href = 'https://www.google.com/maps/search/?api=1&query=' + q;
}
function addTeam() {
  const v = $('#t').value.trim();
  if (v && !S.teams.includes(v)) S.teams.push(v);
  $('#t').value = ''; drawTeams(); $('#t').focus();
}

/* ================= Generación del torneo ================= */
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]] } return a };
const mk = (a, b, x = {}) => ({a, b, sa: '', sb: '', ...x});

// Todos contra todos (método del círculo)
function rr(ids, g) {
  const l = ids.slice(); if (l.length % 2) l.push(null);
  const n = l.length, out = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) { const a = l[i], b = l[n - 1 - i]; if (a != null && b != null) out.push(mk(a, b, {r: r + 1, g})) }
    l.splice(1, 0, l.pop());
  }
  return out;
}
// Orden estándar de cuadro: 1 vs último, 2 vs anteúltimo...
function seedOrder(n) { let a = [1]; while (a.length < n) { const s = a.length * 2; a = a.flatMap(x => [x, s + 1 - x]) } return a }
// Eliminación directa; los mejores sembrados reciben los byes
function buildKO(seeds) {
  const n = seeds.length; let size = 2; while (size < n) size *= 2;
  const o = seedOrder(size).map(s => s <= n ? seeds[s - 1] : 'BYE'), r0 = [];
  for (let i = 0; i < size; i += 2) r0.push(mk(o[i], o[i + 1]));
  const rounds = [r0]; let c = size / 2;
  while (c > 1) { c /= 2; rounds.push(Array.from({length: c}, () => mk(null, null))) }
  T.ko = {rounds}; prop();
}
function win(m) {
  if (!m) return null;
  if (m.a === 'BYE') return m.b; if (m.b === 'BYE') return m.a;
  if (m.a == null || m.b == null) return null;
  return done(m) ? mw(m) : null;
}
// Pasa ganadores a la ronda siguiente (y limpia resultados si cambió el cruce)
function prop() {
  const R = T.ko.rounds;
  for (let r = 1; r < R.length; r++) R[r].forEach((m, i) => {
    const a = win(R[r - 1][2 * i]), b = win(R[r - 1][2 * i + 1]);
    if (m.a !== a || m.b !== b) Object.assign(m, {a, b, sa: '', sb: ''});
  });
}
function create() {
  const e = $('#e'), n = S.teams.length, min = S.type === 'groups' ? 6 : 3;
  if (!S.n.trim()) return e.textContent = 'Poné un nombre al torneo.';
  if (n < min) return e.textContent = `Para este formato necesitás al menos ${min} duplas (tenés ${n}).`;
  const ids = S.teams.map((_, i) => i); if (S.r) shuffle(ids);
  T = {name: S.n.trim(), desc: S.d, place: S.p.trim(), type: S.type, teams: S.teams.slice(), matches: [], ko: null, tab: 'a', groups: null};
  if (S.type === 'rr') T.matches = rr(ids);
  if (S.type === 'groups') {
    const g = n <= 7 ? 2 : Math.ceil(n / 4);
    T.groups = Array.from({length: g}, () => []);
    ids.forEach((id, i) => { const k = i % (2 * g); T.groups[k < g ? k : 2 * g - 1 - k].push(id) }); // reparto en serpiente
    T.groups.forEach((gr, gi) => T.matches.push(...rr(gr, gi)));
  }
  if (S.type === 'ko') buildKO(ids);
  mounted = false; save(); render();
}
function startKO() {
  const st = T.groups.map(g => standings(g, T.matches.filter(m => g.includes(m.a))));
  const w = st.map(s => s[0].id); const r = st.map(s => s[1].id);
  if (r.length % 2) r.push(r.shift()); // evita cruces del mismo grupo
  buildKO(w.concat(r)); T.tab = 'b'; save(); render();
}

/* ================= Posiciones ================= */
function standings(ids, ms) {
  const o = {}; ids.forEach(i => o[i] = {id: i, pj: 0, g: 0, p: 0, sf: 0, sc: 0, pts: 0});
  ms.filter(done).forEach(m => {
    const A = o[m.a], B = o[m.b]; if (!A || !B) return;
    A.pj++; B.pj++; A.sf += m.sa; A.sc += m.sb; B.sf += m.sb; B.sc += m.sa;
    const w = mw(m) === m.a ? [A, B] : [B, A]; w[0].g++; w[0].pts += 3; w[1].p++;
  });
  return Object.values(o).sort((x, y) => y.pts - x.pts || (y.sf - y.sc) - (x.sf - x.sc) || y.sf - x.sf);
}
function table(ids, ms, q) {
  const t = clone('table'), body = $('tbody', t);
  standings(ids, ms).forEach((s, i) => {
    const r = clone('row'), d = s.sf - s.sc;
    fill(r, {pos: i + 1, name: name(s.id), pj: s.pj, g: s.g, p: s.p, sets: `${s.sf}-${s.sc}`, dif: (d > 0 ? '+' : '') + d, pts: s.pts});
    r.classList.toggle('q', i < q);
    body.append(r);
  });
  return t;
}

/* ================= Partidos ================= */
const get = r => { const p = r.split(','); return p[0] === 'm' ? T.matches[p[1]] : T.ko.rounds[p[1]][p[2]] };
// Mejor de 3 sets: cada dupla de 0 a 2 y máximo 3 sets en total (no se permite 2-2, 3-0, 3-1...)
let warn = null;
function setSet(ref, k, v) {
  const m = get(ref), other = m[k === 'sa' ? 'sb' : 'sa'], n = v === '' ? '' : Math.trunc(+v);
  warn = null;
  if (n !== '' && !(n >= 0 && n <= 2)) warn = [ref, 'Cada dupla puede ganar como máximo 2 sets (mejor de 3).'];
  else if (n !== '' && other !== '' && n + other > 3) warn = [ref, `Máximo 3 sets en total: ${n}-${other} no es posible.`];
  else { m[k] = n; if (ref[0] === 'k') prop() }
  save(); render();
}
function card(m, ref, lbl) {
  if (m.a === 'BYE' || m.b === 'BYE') {
    return fill(clone('bye'), {lbl: lbl || '', txt: `${name(m.a === 'BYE' ? m.b : m.a)} pasa directo`});
  }
  const n = clone('match'), d = done(m), ok = m.a != null && m.b != null;
  fill(n, {lbl: lbl || '', na: name(m.a), nb: name(m.b)});
  n.classList.toggle('done', d);
  [['a', 'sa', 'sb'], ['b', 'sb', 'sa']].forEach(([side, mine, rival]) => {
    const row = $(`[data-side="${side}"]`, n), inp = $('input', row);
    row.classList.toggle('w', d && m[mine] > m[rival]);
    inp.value = m[mine]; inp.disabled = !ok;
    inp.onchange = () => setSet(ref, mine, inp.value);
  });
  const hint = $('.hint', n), w = warn && warn[0] === ref ? warn[1] : null;
  hint.textContent = w || 'Mejor de 3 sets: alguna dupla tiene que llegar a 2.';
  hint.hidden = !(w || (m.sa !== '' && m.sb !== '' && !d));
  return n;
}
const roundName = (r, t) => ({1: 'Final', 2: 'Semifinales', 3: 'Cuartos de final', 4: 'Octavos de final'}[t - r] || 'Ronda ' + (r + 1));
function bracket() {
  const b = clone('bracket'), R = T.ko.rounds;
  R.forEach((ms, r) => {
    const c = clone('col'); fill(c, {title: roundName(r, R.length)});
    slot(c, 'cards').append(...ms.map((m, i) => card(m, `k,${r},${i}`, 'Partido ' + (i + 1))));
    b.append(c);
  });
  return b;
}
const allDone = () => T.matches.every(done);
function champion() {
  if (T.type === 'rr') return allDone() ? standings(T.teams.map((_, i) => i), T.matches)[0].id : null;
  return T.ko ? win(T.ko.rounds.at(-1)[0]) : null;
}
function played() {
  const a = T.matches.filter(done);
  if (T.ko) T.ko.rounds.flat().forEach(m => { if (m.a != null && m.b != null && m.a !== 'BYE' && m.b !== 'BYE' && done(m)) a.push(m) });
  return a;
}
function total() {
  let n = T.matches.length;
  if (T.ko) n += T.ko.rounds.flat().filter(m => m.a !== 'BYE' && m.b !== 'BYE').length;
  if (T.type === 'groups' && !T.ko) n += 2 * T.groups.length - 1;
  return n;
}

/* ================= Vistas por pestaña ================= */
function viewMatches() {
  if (T.type === 'ko') return bracket();
  if (T.type === 'rr') {
    const w = clone('fechas');
    [...new Set(T.matches.map(m => m.r))].forEach(r => {
      const f = clone('fecha'); fill(f, {title: 'Fecha ' + r});
      slot(f, 'cards').append(...T.matches.map((m, i) => m.r === r ? card(m, 'm,' + i) : null).filter(Boolean));
      w.append(f);
    });
    return w;
  }
  const box = document.createDocumentFragment();
  T.groups.forEach((g, gi) => {
    const c = clone('group'), ms = T.matches.filter(m => m.g === gi);
    fill(c, {title: 'Grupo ' + String.fromCharCode(65 + gi)});
    slot(c, 'table').append(table(g, ms, 2));
    slot(c, 'cards').append(...T.matches.map((m, i) => m.g === gi ? card(m, 'm,' + i, 'Fecha ' + m.r) : null).filter(Boolean));
    box.append(c);
  });
  return box;
}
function viewSecond() {
  if (T.type === 'rr') {
    const s = clone('standings');
    slot(s, 'table').append(table(T.teams.map((_, i) => i), T.matches, 1));
    return s;
  }
  if (T.ko) return bracket();
  const w = clone('kowait'), ok = allDone();
  fill(w, {msg: 'Clasifican los 2 primeros de cada grupo. ' + (ok ? '¡Fase de grupos completa!' : 'Cargá todos los resultados de grupos para continuar.')});
  $('#startko', w).disabled = !ok;
  $('#startko', w).onclick = startKO;
  return w;
}

/* ================= Análisis final ================= */
function analysis() {
  const c = champion();
  if (c == null) return clone('pending');
  const P = played(), ids = T.teams.map((_, i) => i), st = standings(ids, P), s0 = st.find(s => s.id === c), pj = P.length;
  const three = P.filter(m => m.sa + m.sb === 3), sweeps = P.filter(m => m.sa + m.sb === 2);
  const att = [...st].sort((a, b) => b.sf - a.sf)[0];
  const def = st.filter(s => s.pj).sort((a, b) => a.sc / a.pj - b.sc / b.pj)[0];
  const unb = st.filter(s => s.pj && !s.p);
  let sub;
  if (T.type === 'rr') sub = st[1];
  else { const f = T.ko.rounds.at(-1)[0]; sub = st.find(s => s.id === (f.a === c ? f.b : f.a)) }
  const mt = m => `${name(m.a)} ${m.sa}-${m.sb} ${name(m.b)}`;

  const n = clone('analysis');
  fill(n, {
    kicker: 'CAMPEONES DE ' + T.name.toUpperCase(),
    champ: name(c),
    runner: sub ? 'Subcampeón: ' + name(sub.id) : '',
    story: `${name(c)} se consagró en ${T.name} con ${s0.g} victorias en ${s0.pj} partidos (${Math.round(100 * s0.g / s0.pj)}% de efectividad), ganando ${s0.sf} sets y perdiendo ${s0.sc}. ` +
      (s0.p ? `Cayó ${s0.p} ${s0.p > 1 ? 'veces' : 'vez'} en el camino, pero levantó el trofeo igual. ` : 'Terminó invicto: dominio total. ') +
      `De ${pj} partidos, ${three.length} se definieron en el tercer set (${Math.round(100 * three.length / pj)}%), lo que muestra un nivel ${three.length / pj > .4 ? 'muy parejo' : 'con diferencias claras'}.`
  });
  const stats = [
    ['Partidos jugados', pj],
    ['Definidos en 3 sets', `${three.length} de ${pj}`],
    ['Mejor ataque', `${name(att.id)} · ${att.sf} sets ganados`],
    ['Mejor defensa', `${name(def.id)} · ${(def.sc / def.pj).toFixed(1)} sets en contra por partido`],
    ['Invictas', unb.length ? unb.map(s => name(s.id)).join(', ') : 'Ninguna']
  ];
  if (three[0]) stats.push(['Partido más ajustado', mt(three[0])]);
  if (sweeps[0]) stats.push(['Mayor paliza', mt(sweeps[0])]);
  slot(n, 'stats').append(...stats.map(([k, v]) => fill(clone('stat'), {k, v})));

  slot(n, 'path').append(...P.filter(m => m.a === c || m.b === c).map(m => {
    const li = document.createElement('li'), mine = m.a === c;
    li.textContent = `${mw(m) === c ? '✅' : '❌'} vs ${name(mine ? m.b : m.a)} — ${mine ? m.sa + '-' + m.sb : m.sb + '-' + m.sa} en sets`;
    return li;
  }));
  slot(n, 'rank').append(table(ids, P, 1));
  return n;
}

/* ================= Render principal ================= */
function mountApp() {
  const a = clone('app');
  $('#app').replaceChildren(a);
  fill(a, {name: T.name, meta: `${TYPES[T.type][0]} · ${T.teams.length} duplas`, desc: T.desc, place: T.place});
  $('[data-f="desc"]', a).hidden = !T.desc;
  if (T.place) {
    const q = encodeURIComponent(T.place);
    $('#place').hidden = $('#amap').hidden = false;
    $('#plink').href = 'https://www.google.com/maps/search/?api=1&query=' + q;
    $('#amap').src = 'https://maps.google.com/maps?q=' + q + '&output=embed';
  }
  $('#reset').onclick = () => {
    if (!confirm('¿Descartar este torneo y crear uno nuevo?')) return;
    T = null; S = blank(); mounted = setupBuilt = false;
    try { localStorage.removeItem(KEY) } catch (e) {}
    render();
  };
  mounted = true;
}
function render() {
  $('#setup').hidden = !!T; $('#app').hidden = !T;
  if (!T) { if (!setupBuilt) { setupView(); setupBuilt = true } return }
  if (!mounted) mountApp();

  const pj = played().length, tt = total(), c = champion();
  $('#fill').style.width = Math.min(100, Math.round(100 * pj / tt)) + '%';
  fill($('#app'), {prog: `${pj} de ${tt} partidos${c != null ? ' · ¡Torneo finalizado!' : ''}`});

  const tabs = T.type === 'rr' ? [['a', 'Partidos'], ['b', 'Posiciones'], ['z', 'Análisis']]
    : T.type === 'groups' ? [['a', 'Grupos'], ['b', 'Fase final'], ['z', 'Análisis']]
    : [['a', 'Cuadro'], ['z', 'Análisis']];
  if (!tabs.some(x => x[0] === T.tab)) T.tab = 'a';
  $('#tabs').replaceChildren(...tabs.map(([k, label]) => {
    const b = clone('tab'); b.textContent = label;
    b.classList.toggle('on', T.tab === k);
    b.onclick = () => { T.tab = k; save(); render() };
    return b;
  }));
  const view = T.tab === 'a' ? viewMatches() : T.tab === 'b' ? viewSecond() : analysis();
  $('#body').replaceChildren(view);

  // Al terminar el torneo: ir al análisis y lanzar confeti una sola vez
  if (c != null && !T.cd) { T.cd = 1; T.tab = 'z'; save(); render(); boom() }
}

/* ================= Confeti ================= */
function boom() {
  const cv = $('#cf'), x = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#d7ff3a', '#3ddc97', '#ffffff', '#5ab0ff'];
  const p = Array.from({length: 140}, () => ({x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, v: 2 + Math.random() * 4, s: 4 + Math.random() * 6, c: colors[Math.random() * 4 | 0], r: Math.random() * 6}));
  let f = 0;
  (function frame() {
    x.clearRect(0, 0, cv.width, cv.height);
    p.forEach(q => { q.y += q.v; q.x += Math.sin(q.y / 30 + q.r); x.fillStyle = q.c; x.fillRect(q.x, q.y, q.s, q.s * .6) });
    if (++f < 260) requestAnimationFrame(frame); else x.clearRect(0, 0, cv.width, cv.height);
  })();
}

render();