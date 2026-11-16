// Codemod Fase 2 — v2: async/await via AST com wrap correto de cadeias.
// Regras:
//   - flagged: db.prepare/db.exec/db.<fn> (membro de `db`), stmt.all/get/run, chamadas a fns asyncNeed
//   - await PLAIN quando a cadeia após o call é só API de statement (prepare/all/get/run):
//       await db.prepare('x').all()          ✓ (await cobre a cadeia)
//   - wrap PARENTESIS quando a cadeia tem métodos de DADOS (map/filter/propriedade...):
//       (await findAll('x')).map(...)        ✓ (senão .map rodaria no Promise)
//   - funções envolventes viram async; callbacks → lista de revisão; topo do módulo → revisão
const fs = require('fs');
const acorn = require('acorn');

const arquivo = process.argv[2];
const aplicar = process.argv.includes('--aplicar');
if (!arquivo) { console.log('uso: node codemod.js <arquivo.js> [--aplicar]'); process.exit(1); }

const src = fs.readFileSync(arquivo, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 2022, locations: true, ranges: true });

const STMT_PROPS = new Set(['prepare', 'all', 'get', 'run']);
const FN_KEYS = ['type', 'start', 'end', 'loc', 'range'];

// objeto = driver `db` OU chamada getDb() (cobrir db.getDb().prepare e getDb().prepare)
function isDbObject(obj) {
  if (!obj) return false;
  if (obj.type === 'Identifier' && obj.name === 'db') return true;
  if (obj.type === 'CallExpression' && obj.callee.type === 'Identifier' && obj.callee.name === 'getDb') return true;
  return false;
}

// ── mapa de pais + coleta de topo/stmtVars ──
const parent = new Map();
const topLevelFns = new Map();
const stmtVars = new Set();

function containsDbPrepare(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'MemberExpression' && node.object && node.object.type === 'Identifier' &&
      node.object.name === 'db' && node.property && node.property.name === 'prepare') return true;
  if (node.type === 'MemberExpression' && node.object && node.object.type === 'CallExpression' &&
      node.object.callee && node.object.callee.type === 'Identifier' && node.object.callee.name === 'getDb' &&
      node.property && node.property.name === 'prepare') return true;
  for (const k of Object.keys(node)) {
    if (FN_KEYS.includes(k)) continue;
    const c = node[k];
    if (Array.isArray(c) && c.some(containsDbPrepare)) return true;
    else if (c && typeof c === 'object' && containsDbPrepare(c)) return true;
  }
  return false;
}

(function build(node, par) {
  if (!node || typeof node.type !== 'string') return;
  parent.set(node, par);
  if (node.type === 'FunctionDeclaration' && par === ast && node.id) topLevelFns.set(node.id.name, node);
  if (node.type === 'VariableDeclarator' && node.init && node.id.type === 'Identifier' && containsDbPrepare(node.init)) {
    stmtVars.add(node.id.name);
  }
  for (const k of Object.keys(node)) {
    if (FN_KEYS.includes(k)) continue;
    const c = node[k];
    if (Array.isArray(c)) c.forEach(x => build(x, node));
    else if (c && typeof c.type === 'string') build(c, node);
  }
})(ast, null);

// ── coleta de flagged ──
const flagged = [];
(function coleta(node, fnStack) {
  if (!node || typeof node.type !== 'string') return;
  const ehFn = /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(node.type);
  if (ehFn) fnStack.push(node);

  if (node.type === 'CallExpression') {
    const cal = node.callee;
    if (cal.type === 'MemberExpression' && !cal.computed && isDbObject(cal.object) && cal.property.type === 'Identifier') {
      flagged.push({ node, fnStack: fnStack.slice(), motivo: 'db.' + cal.property.name });
    } else if (cal.type === 'MemberExpression' && !cal.computed && cal.object.type === 'Identifier' &&
               stmtVars.has(cal.object.name) && ['all', 'get', 'run'].includes(cal.property.name)) {
      flagged.push({ node, fnStack: fnStack.slice(), motivo: cal.object.name + '.' + cal.property.name });
    }
  }
  for (const k of Object.keys(node)) {
    if (FN_KEYS.includes(k)) continue;
    const c = node[k];
    if (Array.isArray(c)) c.forEach(x => coleta(x, fnStack));
    else if (c && typeof c.type === 'string') coleta(c, fnStack);
  }
  if (ehFn) fnStack.pop();
})(ast, []);

// ── transitivo asyncNeed ──
const asyncNeed = new Set();
const argFn = process.argv.indexOf('--async-fn');
if (argFn >= 0 && process.argv[argFn + 1]) process.argv[argFn + 1].split(',').forEach(n => n && asyncNeed.add(n.trim()));

function achaChamadas(fn) {
  const achadas = [];
  (function w(node, fs2) {
    if (!node || typeof node.type !== 'string') return;
    const ehFn = /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(node.type);
    if (ehFn) fs2.push(node);
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && asyncNeed.has(node.callee.name)) {
      achadas.push({ node, fnStack: fs2.slice() });
    }
    for (const k of Object.keys(node)) {
      if (FN_KEYS.includes(k)) continue;
      const c = node[k];
      if (Array.isArray(c)) c.forEach(x => w(x, fs2));
      else if (c && typeof c.type === 'string') w(c, fs2);
    }
    if (ehFn) fs2.pop();
  })(fn, []);
  return achadas;
}

let mudou = true;
while (mudou) {
  mudou = false;
  for (const f of flagged) {
    const decl = f.fnStack.find(fn => fn.type === 'FunctionDeclaration' && fn.id && topLevelFns.has(fn.id.name));
    if (decl && !asyncNeed.has(decl.id.name)) { asyncNeed.add(decl.id.name); mudou = true; }
  }
  for (const c of achaChamadas(ast)) {
    const decl = c.fnStack.find(fn => fn.type === 'FunctionDeclaration' && fn.id && topLevelFns.has(fn.id.name));
    if (decl && !asyncNeed.has(decl.id.name)) { asyncNeed.add(decl.id.name); mudou = true; }
    if (!flagged.find(f => f.node === c.node)) { flagged.push({ node: c.node, fnStack: c.fnStack, motivo: 'fn:' + c.node.callee.name }); mudou = true; }
  }
}

// ── para cada flagged: decide plain vs wrap ──
const edicoes = [];
const revisao = [];
const semEscopo = [];
const fnsMarcadas = new Set();

// props da cadeia acima do call (até parar em não-membro)
function propsDaCadeia(node) {
  const props = [];
  let cur = node;
  while (true) {
    const p = parent.get(cur);
    if (p && p.type === 'MemberExpression' && p.object === cur && !p.computed && p.property.type === 'Identifier') {
      props.push(p.property.name); cur = p; continue;
    }
    if (p && p.type === 'CallExpression' && p.callee === cur) { cur = p; continue; }
    break;
  }
  return { props, fim: cur }; // fim = nó mais externo alcançado (call final da cadeia)
}

// alvo do wrap: até o último produtor de promise da statement API (all/get/run), senão o call base
function alvoWrap(node) {
  let cur = node;
  let ultimoStmtCall = null;
  while (true) {
    const p = parent.get(cur);
    if (p && p.type === 'MemberExpression' && p.object === cur && !p.computed && p.property.type === 'Identifier') {
      const prop = p.property.name;
      cur = p;
      const p2 = parent.get(cur);
      if (STMT_PROPS.has(prop) && p2 && p2.type === 'CallExpression' && p2.callee === cur) {
        ultimoStmtCall = p2; cur = p2;
      }
      continue;
    }
    if (p && p.type === 'CallExpression' && p.callee === cur) { cur = p; continue; }
    break;
  }
  return ultimoStmtCall || node;
}

for (const f of flagged) {
  const { node } = f;
  const antes = src.slice(Math.max(0, node.start - 12), node.start);
  if (/\bawait\s+$/.test(antes)) continue; // já awaitado

  const env = f.fnStack[f.fnStack.length - 1];
  if (!env) { semEscopo.push(f.motivo + ' @L' + node.loc.start.line + ': ' + src.slice(node.start, Math.min(node.end, node.start + 90)).replace(/\s+/g, ' ')); continue; }

  const { props } = propsDaCadeia(node);
  const soStatement = props.every(p => STMT_PROPS.has(p));

  if (soStatement) {
    edicoes.push({ ini: node.start, fim: node.start, txt: 'await ' });
  } else {
    // wrap: (await <até o produtor de promise>)
    const alvo = alvoWrap(node);
    edicoes.push({ ini: node.start, fim: node.start, txt: '(await ' });
    edicoes.push({ ini: alvo.end, fim: alvo.end, txt: ')' });
  }

  if (!fnsMarcadas.has(env)) {
    fnsMarcadas.add(env);
    if (env.type === 'FunctionDeclaration' && env.id) {
      if (!env.async) edicoes.push({ ini: env.start, fim: env.start + 'function'.length, txt: 'async function' });
    } else if (env.type === 'FunctionExpression') {
      const m = /^((?:async\s+)?)function/.exec(src.slice(env.start, env.start + 20));
      if (m && !m[1]) edicoes.push({ ini: env.start, fim: env.start + (m[0].length - 'function'.length), txt: 'async ' });
    } else if (env.type === 'ArrowFunctionExpression') {
      if (!env.async) edicoes.push({ ini: env.start, fim: env.start, txt: 'async ' });
    }
    if (env.type !== 'FunctionDeclaration') revisao.push('callback async @L' + env.loc.start.line + ' (' + f.motivo + ')');
  }
}

// ── dedup + anti `await await`/`async async` ──
edicoes.sort((a, b) => a.ini - b.ini || (b.txt.length - a.txt.length));
const vistas = new Set();
const finais = [];
for (const e of edicoes) {
  const k = e.ini + '|' + e.txt;
  if (vistas.has(k)) continue;
  vistas.add(k);
  const ctx = src.slice(Math.max(0, e.ini - 12), e.ini);
  if (e.txt === 'await ' && /\bawait\s+$/.test(ctx)) continue;
  if (e.txt === '(await ' && /\bawait\s+$/.test(ctx)) continue;
  if ((e.txt === 'async ' || e.txt === 'async function') && /\basync\s+$/.test(ctx)) continue;
  finais.push(e);
}

// aplica de trás pra frente
finais.sort((a, b) => b.ini - a.ini || b.fim - a.fim);
let out = src;
for (const e of finais) out = out.slice(0, e.ini) + e.txt + out.slice(e.fim);

console.log('=== ' + arquivo.split(/[\\/]/).pop() + ' ===');
console.log('flagged: ' + flagged.length + ' | fns async: ' + fnsMarcadas.size + ' | edições: ' + finais.length);
console.log('asyncNeed: ' + [...asyncNeed].sort().join(', '));
if (revisao.length) { console.log('REVISÃO (' + revisao.length + '):'); revisao.slice(0, 30).forEach(r => console.log('  ! ' + r)); }
if (semEscopo.length) { console.log('SEM ESCOPO (' + semEscopo.length + '):'); semEscopo.forEach(s => console.log('  ! ' + s)); }

if (aplicar) {
  fs.writeFileSync(arquivo, out, 'utf8');
  console.log('APLICADO → ' + arquivo);
} else {
  console.log('(dry-run — use --aplicar)');
}
