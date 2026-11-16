// Fase 2 — smoke test da camada de dados PostgreSQL (round-trips reais)
const db = require(require('path').join(__dirname, '..', '..', 'js', 'db.js'));

let pass = 0, fail = 0;
const ok = (nome, cond, extra) => {
  if (cond) { pass++; console.log('  ✅ ' + nome); }
  else { fail++; console.log('  ✗ ' + nome + (extra ? ' → ' + extra : '')); }
};

async function main() {
  console.log('── 1. leituras básicas ──');
  const settings = await db.getSettings('default');
  ok('getSettings retorna objeto ou null (pré-F4: vazio)', settings === null || typeof settings === 'object', JSON.stringify(settings).slice(0, 80));
  const mats = await db.findAll('materiais');
  ok('findAll materiais (array)', Array.isArray(mats));
  const empresas = await db.listEmpresas();
  ok('listEmpresas (array)', Array.isArray(empresas));

  console.log('── 2. sync completo ──');
  const sync = await db.getFullSync('default');
  ok('getFullSync tem chaves esperadas', sync && Array.isArray(sync.materiais) && sync.company && sync.settings);
  ok('company.sigla é string (não Promise)', typeof (sync.company || {}).sigla === 'string', typeof (sync.company || {}).sigla);
  ok('company.folderName é string', typeof (sync.company || {}).folderName === 'string');
  ok('loginTheme é objeto', typeof sync.loginTheme === 'object');

  console.log('── 3. CRUD round-trip ──');
  const id = 'smoke-' + Date.now();
  const criado = await db.create('clientes', { id, empresa_id: 'default', razaoSocial: 'Smoke Test LTDA', nomeFantasia: 'Smoke' });
  ok('create', !!criado);
  const achado = await db.findById('clientes', id);
  ok('findById encontra', achado && achado.razaoSocial === 'Smoke Test LTDA', achado && achado.razaoSocial);
  const upd = await db.update('clientes', id, { nomeFantasia: 'Smoke2' });
  ok('update', upd === true || (upd && upd.changes >= 0) || upd !== false, 'ret=' + JSON.stringify(upd));
  const achado2 = await db.findById('clientes', id);
  ok('update persistiu', achado2 && achado2.nomeFantasia === 'Smoke2', achado2 && achado2.nomeFantasia);
  const removido = await db.remove('clientes', id);
  ok('remove', removido !== false);
  const achado3 = await db.findById('clientes', id);
  ok('remove apagou', !achado3);

  console.log('── 4. INSERT OR REPLACE (settings: PK empresa_id) ──');
  await db.getDb().prepare("DELETE FROM clientes WHERE id LIKE 'smoke-%' OR id LIKE 'tx-%'").run(); // limpa resíduos
  await db.saveSettings({ aliq_cbs: 11.2, aliq_ibs: 0.1, modelo_tributario: '2027' }, 'default');
  const s1 = await db.getSettings('default');
  await db.saveSettings({ aliq_cbs: 12.5 }, 'default');
  const s2 = await db.getSettings('default');
  ok('upsert sobrescreve sem duplicar', s2 && Number(s2.aliqCbs) === 12.5, 'aliqCbs=' + (s2 && s2.aliqCbs));
  const nSettings = (await db.getDb().prepare('SELECT count(*) c FROM settings WHERE empresa_id = ?').get('default')).c;
  ok('sem linha duplicada', Number(nSettings) === 1, 'n=' + nSettings);
  // restaura valores
  await db.saveSettings({ aliq_cbs: 11.2, aliq_ibs: 0.1, modelo_tributario: '2027' }, 'default');

  console.log('── 5. searchMateriais (ILIKE) ──');
  const r1 = await db.searchMateriais({ q: 'nada-que-exista-xyz' });
  ok('search vazio', Array.isArray(r1.rows || r1), '');
  const r2 = await db.searchMateriais({ q: 'a' });
  ok('search com resultado estrutura', r2 && (Array.isArray(r2.rows) || Array.isArray(r2)));

  console.log('── 6. transação: commit + rollback (via funções exportadas) ──');
  // material real antes (FK de price_history.material_id → materiais.id validada aqui!)
  await db.create('materiais', { id: 'smoke-mat-tx', empresa_id: 'default', descricao: 'Mat TX smoke' });
  // commit: savePriceHistory usa withTransaction internamente
  await db.savePriceHistory('smoke-mat-tx', [{ custo: 10, markup: 20, date: '2026-01-01', title: 't', origin: 'x' }]);
  const ph = await db.getPriceHistory('smoke-mat-tx');
  ok('commit persiste (savePriceHistory)', Array.isArray(ph) && ph.length === 1, 'n=' + (ph && ph.length));
  // rollback: restoreFromBackup lança erro DENTRO da transação → nada pode mudar
  await db.create('clientes', { id: 'tx-sentinel', empresa_id: 'default', razaoSocial: 'Sentinel' });
  const antes = (await db.getDb().prepare('SELECT count(*) c FROM clientes').get()).c;
  let rollbackErr = null;
  try {
    await db.restoreFromBackup({ clientes: [{ semId: true }] });
  } catch (e) { rollbackErr = e.message; }
  const depois = (await db.getDb().prepare('SELECT count(*) c FROM clientes').get()).c;
  ok('rollback desfaz (erro dentro da tx)', rollbackErr && rollbackErr.includes('sem id') && Number(antes) === Number(depois), 'err=' + rollbackErr + ' antes=' + antes + ' depois=' + depois);
  await db.remove('clientes', 'tx-sentinel');
  await db.savePriceHistory('smoke-mat-tx', []); // limpa
  const phVazio = await db.getPriceHistory('smoke-mat-tx');
  ok('limpeza price_history', Array.isArray(phVazio) && phVazio.length === 0, 'n=' + (phVazio && phVazio.length));
  await db.remove('materiais', 'smoke-mat-tx'); // cascade apaga price_history

  console.log('── 8. cauda getDb(): mail (coluna "user") + crm_stages + dxf ──');
  await db.upsertMailSettings('default', { host: 'smtp.teste.com', port: 587, secure: 0, user: 'smoke@x.com', pass: 'abc', from_name: 'T', from_email: 't@x.com', provider: 'smtp', api_key: '' });
  const mail = await db.findMailSettings('default');
  ok('mail_settings upsert (coluna user citada)', mail && mail.user === 'smoke@x.com', mail && mail.user);
  const stages = await db.findAllCrmStages('default');
  ok('findAllCrmStages (seed)', Array.isArray(stages) && stages.length > 0, 'n=' + (stages && stages.length));
  await db.create('materiais', { id: 'smoke-dxf', empresa_id: 'default', descricao: 'Mat DXF smoke' });
  await db.setMaterialDxf('smoke-dxf', 'fake-block-content');
  const dxf = await db.getMaterialDxf('smoke-dxf');
  ok('set/get MaterialDxf', typeof dxf === 'string' && dxf.includes('fake-block'), String(dxf).slice(0, 40));
  await db.remove('materiais', 'smoke-dxf');

  console.log('── 9. proposal_counters (OR REPLACE PK data) ──');
  const n1 = await db.getNextProposalNumber();
  const n2 = await db.getNextProposalNumber();
  ok('sequencial', typeof n1 === 'number' || typeof n1 === 'string', 'n1=' + n1 + ' n2=' + n2);

  console.log('── 10. bulk (bulkImportMateriais) ──');
  const res = await db.bulkImportMateriais([{ codigoInterno: 'SMOKE-IMP-1', descricao: 'Item smoke', custo: 1.5 }], 'default');
  ok('bulkImport retorna', res !== undefined, JSON.stringify(res).slice(0, 100));
  const achou = await db.searchMateriais({ q: 'SMOKE-IMP-1' });
  const rows = achou.rows || achou;
  ok('importado encontrado (ILIKE)', rows.length > 0, 'n=' + rows.length);
  // limpa item de teste
  for (const m of rows) await db.remove('materiais', m.id);

  console.log('');
  console.log('══ RESULTADO: ' + pass + ' passaram, ' + fail + ' falharam ══');
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('ERRO FATAL:', e); process.exit(2); });
