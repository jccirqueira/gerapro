// Auditor pós-codemod: encontra chamadas de banco NÃO cobertas por await/return,
// cadeias `await X().map` quebradas e referências a db.<fn> sem chamada.
// Uso: node audit.js <arquivo.js> --async-fn withTransaction,...
const fs = require('fs');
const acorn = require('acorn');

const arquivo = process.argv[2];
const src = fs.readFileSync(arquivo, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 2022, locations: true, ranges: true });
const FN_KEYS = ['type', 'start', 'end', 'loc', 'range'];

// objeto = driver `db` OU chamada getDb()
function isDbObject(obj) {
  if (!obj) return false;
  if (obj.type === 'Identifier' && obj.name === 'db') return true;
  if (obj.type === 'CallExpression' && obj.callee.type === 'Identifier' && obj.callee.name === 'getDb') return true;
  return false;
}

// ── coleta (mesmos critérios do codemod) ──
const parent = new Map();
const topLevelFns = new Map();
const stmtVars = new Set();
function containsDbPrepare(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'MemberExpression' && node.object && node.property && node.property.name === 'prepare' && isDbObject(node.object)) return true;
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
  if (node.type === 'VariableDeclarator' && node.init && node.id.type === 'Identifier' && containsDbPrepare(node.init)) stmtVars.add(node.id.name);
  for (const k of Object.keys(node)) {
    if (FN_KEYS.includes(k)) continue;
    const c = node[k];
    if (Array.isArray(c)) c.forEach(x => build(x, node));
    else if (c && typeof c.type === 'string') build(c, node);
  }
})(ast, null);

// asyncNeed: recompute (mesmo algoritmo do codemod)
const flagged0 = [];
(function coleta(node, fs2) {
  if (!node || typeof node.type !== 'string') return;
  const ehFn = /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(node.type);
  if (ehFn) fs2.push(node);
  if (node.type === 'CallExpression') {
    const cal = node.callee;
    if (cal.type === 'MemberExpression' && !cal.computed && isDbObject(cal.object) && cal.property.type === 'Identifier') {
      flagged0.push({ node, fnStack: fs2.slice() });
    } else if (cal.type === 'MemberExpression' && !cal.computed && cal.object.type === 'Identifier' && stmtVars.has(cal.object.name) && ['all', 'get', 'run'].includes(cal.property.name)) {
      flagged0.push({ node, fnStack: fs2.slice() });
    }
  }
  for (const k of Object.keys(node)) {
    if (FN_KEYS.includes(k)) continue;
    const c = node[k];
    if (Array.isArray(c)) c.forEach(x => coleta(x, fs2));
    else if (c && typeof c.type === 'string') coleta(c, fs2);
  }
  if (ehFn) fs2.pop();
})(ast, []);

const asyncNeed = new Set();
const argFn = process.argv.indexOf('--async-fn');
if (argFn >= 0 && process.argv[argFn + 1]) process.argv[argFn + 1].split(',').forEach(n => n && asyncNeed.add(n.trim()));
let mudou = true;
while (mudou) {
  mudou = false;
  for (const f of flagged0) {
    const decl = f.fnStack.find(fn => fn.type === 'FunctionDeclaration' && fn.id && topLevelFns.has(fn.id.name));
    if (decl && !asyncNeed.has(decl.id.name)) { asyncNeed.add(decl.id.name); mudou = true; }
  }
  (function w(node, fs2) {
    if (!node || typeof node.type !== 'string') return;
    const ehFn = /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(node.type);
    if (ehFn) fs2.push(node);
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && asyncNeed.has(node.callee.name)) {
      const decl = fs2.find(fn => fn.type === 'FunctionDeclaration' && fn.id && topLevelFns.has(fn.id.name));
      if (decl && !asyncNeed.has(decl.id.name)) { asyncNeed.add(decl.id.name); mudou = true; }
      if (!flagged0.find(f => f.node === node)) { flagged0.push({ node, fnStack: fs2.slice() }); mudou = true; }
    }
    for (const k of Object.keys(node)) {
      if (FN_KEYS.includes(k)) continue;
      const c = node[k];
      if (Array.isArray(c)) c.forEach(x => w(x, fs2));
      else if (c && typeof c.type === 'string') w(c, fs2);
    }
    if (ehFn) fs2.pop();
  })(ast, []);
}

// ── verificações ──
const problemas = [];

// 1) calls flagged sem await/return por perto (varre tokens)
for (const f of flagged0) {
  const ini = f.node.start;
  const antes = src.slice(Math.max(0, ini - 60), ini);
  const coberto = /\bawait\s+[^(]*$/.test(antes) || /\breturn\s+$/.test(antes) || /\breturn\s+await\s+[^(]*$/.test(antes)
    || /^\s*\.then\s*\(/.test(src.slice(f.node.end, f.node.end + 24)); // boot encadeado: x().then(...)
  // return direto: retorna a promise para o chamador awaited
  const retDentro = (function () {
    let n = f.node;
    while (n) {
      if (n.type === 'ReturnStatement') return true;
      if (/^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type)) return false;
      n = parent.get(n);
    }
    return false;
  })();
  if (!coberto && !retDentro) {
    problemas.push('SEM AWAIT @L' + f.node.loc.start.line + ': ' + src.slice(f.node.start, Math.min(f.node.end, f.node.start + 80)).replace(/\s+/g, ' '));
  }
}

// 2) cadeias await X().<dados> quebradas (propriedade de dados logo após await de call)
const STMT = new Set(['prepare', 'all', 'get', 'run']);
const PROMISE_PROPS = new Set(['then', 'catch', 'finally', 'json', 'text', 'blob', 'arrayBuffer', 'toString']);
(function w2(node) {
  if (!node || typeof node.type !== 'string') return;
  if (node.type === 'AwaitExpression' && node.expression && node.expression.type === 'MemberExpression') {
    // percorre até a base
    let cur = node.expression, props = [];
    while (cur && cur.type === 'MemberExpression' && !cur.computed) { props.push(cur.property.name); cur = cur.object; }
    const ultima = props[props.length - 1]; // propriedade mais externa
    if (ultima && !STMT.has(ultima) && !PROMISE_PROPS.has(ultima)) {
      problemas.push('CADEIA DADOS @L' + node.loc.start.line + ': await ... .' + props.join('.') + '  ← deve ser (await ...).' + props.join('.'));
    }
  }
  for (const k of Object.keys(node)) {
    if (FN_KEYS.includes(k)) continue;
    const c = node[k];
    if (Array.isArray(c)) c.forEach(w2);
    else if (c && typeof c.type === 'string') w2(c);
  }
})(ast);

// 3) referências a db.<fn> sem chamada (passagem por referência)
(function w3(node) {
  if (!node || typeof node.type !== 'string') return;
  if (node.type === 'MemberExpression' && !node.computed && isDbObject(node.object) &&
      node.property.type === 'Identifier' && !node.property.name.includes('_')) {
    const p = parent.get(node);
    const ehChamada = p && p.type === 'CallExpression' && p.callee === node;
    const ehPropriedadeDe = p && p.type === 'MemberExpression' && p.object === node; // ex.: db.prepare dentro de chain é chamada no call acima
    if (!ehChamada && !ehPropriedadeDe) {
      problemas.push('REFERÊNCIA db.' + node.property.name + ' @L' + node.loc.start.line + ' (sem chamada)');
    }
  }
  for (const k of Object.keys(node)) {
    if (FN_KEYS.includes(k)) continue;
    const c = node[k];
    if (Array.isArray(c)) c.forEach(w3);
    else if (c && typeof c.type === 'string') w3(c);
  }
})(ast);

console.log('=== AUDIT ' + arquivo.split(/[\\/]/).pop() + ' ===');
console.log('flagged total: ' + flagged0.length + ' | asyncNeed: ' + asyncNeed.size);
if (problemas.length === 0) console.log('✅ NENHUM PROBLEMA ENCONTRADO');
else { console.log('PROBLEMAS (' + problemas.length + '):'); problemas.slice(0, 40).forEach(p => console.log('  ✗ ' + p)); }
process.exit(problemas.length ? 2 : 0);
