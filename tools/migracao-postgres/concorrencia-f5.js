// F5 — teste de concorrência: pool + transações sob carga paralela
const db = require(require('path').join(__dirname, '..', '..', 'js', 'db.js'));

async function main() {
  let pass = 0, fail = 0;
  const ok = (n, c, x) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? ' → ' + x : '')); } };

  // 1. 8 syncs completos em paralelo (leituras pesadas)
  const t0 = Date.now();
  const syncs = await Promise.all(Array.from({ length: 8 }, () => db.getFullSync('default')));
  const dt = Date.now() - t0;
  ok('8 getFullSync paralelos', syncs.length === 8 && syncs.every(s => s.materiais.length > 0), dt + 'ms');
  ok('todos com materiais', syncs.every(s => s.materiais.length === syncs[0].materiais.length));

  // 2. 20 escritas/leituras alternadas em paralelo (pool distribui entre conexões)
  const ops = [];
  for (let i = 0; i < 10; i++) {
    const id = 'conc-' + Date.now() + '-' + i;
    ops.push((async () => {
      await db.create('clientes', { id, empresa_id: 'default', razaoSocial: 'Concorrencia ' + i });
      const achou = await db.findById('clientes', id);
      await db.remove('clientes', id);
      const depois = await db.findById('clientes', id);
      return !!achou && !depois;
    })());
  }
  const resultados = await Promise.all(ops);
  ok('20 ops paralelas (create/find/remove)', resultados.every(Boolean), 'ok=' + resultados.filter(Boolean).length + '/10');

  // 3. transações paralelas (AsyncLocalStorage: cada chamada com seu cliente)
  //    savePriceHistory usa withTransaction internamente
  const mats = [];
  for (let n = 1; n <= 4; n++) {
    const id = 'tx-conc-' + n;
    await db.create('materiais', { id, empresa_id: 'default', descricao: 'TX conc ' + n });
    mats.push(id);
  }
  const txs = await Promise.all(mats.map((id, n) => db.savePriceHistory(id, [
    { custo: 10 + n, markup: 20, date: '2026-01-01', title: 't' + n, origin: 'x' }
  ])));
  ok('4 transações paralelas (savePriceHistory)', txs.length === 4);
  const contagens = await Promise.all(mats.map(id => db.getPriceHistory(id)));
  ok('cada transação commitou no seu alvo', contagens.every((r, i) => r.length === 1), JSON.stringify(contagens.map(r => r.length)));

  // 4. rollback paralelo não afeta a transação vizinha
  await db.create('clientes', { id: 'tx-ok', empresa_id: 'default', razaoSocial: 'OK' });
  const [a, b] = await Promise.all([
    db.savePriceHistory(mats[0], [{ custo: 99, markup: 1, date: '2026-01-02', title: 'ok', origin: 'x' }]).then(() => 'ok').catch(() => 'falhou'),
    db.restoreFromBackup({ clientes: [{ semId: true }] }).then(() => 'inesperado').catch(() => 'rollback')
  ]);
  const phOk = await db.getPriceHistory(mats[0]);
  const temOk = !!(await db.findById('clientes', 'tx-ok'));
  ok('rollback paralelo não contamina o vizinho',
    a === 'ok' && b === 'rollback' && phOk.length === 1 && temOk,
    'a=' + a + ' b=' + b + ' ph=' + phOk.length + ' ok=' + temOk);
  await db.remove('clientes', 'tx-ok');
  for (const id of mats) await db.remove('materiais', id); // cascade apaga price_history

  // 5. nada residual
  const resid = (await db.getDb().prepare("SELECT count(*) c FROM clientes WHERE id LIKE 'conc-%' OR id LIKE 'tx-%'").get()).c;
  const residM = (await db.getDb().prepare("SELECT count(*) c FROM materiais WHERE id LIKE 'tx-conc-%'").get()).c;
  ok('sem resíduos', Number(resid) === 0 && Number(residM) === 0, 'clientes=' + resid + ' materiais=' + residM);

  console.log('══ CONCORRÊNCIA: ' + pass + ' passaram, ' + fail + ' falharam ══');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERRO FATAL:', e); process.exit(2); });
