// F4 — leitura somente-leitura via camada da app (valida case map + tipos com dados reais)
const db = require(require('path').join(__dirname, '..', '..', 'js', 'db.js'));

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? ' → ' + x : '')); } };

async function main() {
  console.log('── settings (case + tipos) ──');
  const s = await db.getSettings('default');
  ok('getSettings com dados reais', s && typeof s === 'object', JSON.stringify(s).slice(0, 120));
  ok('aliqCbs numérico', s && typeof s.aliqCbs === 'number', s && typeof s.aliqCbs + '=' + s.aliqCbs);
  ok('modeloTributario string', s && typeof s.modeloTributario === 'string', s && s.modeloTributario);
  ok('splitPayment booleano', s && typeof s.splitPayment === 'boolean', s && typeof s.splitPayment);

  console.log('── materiais (25k, case map) ──');
  const mats = await db.findAll('materiais');
  // findAll filtra empresa_id='default' (total geral = 25.498 em 5 empresas)
  ok('materiais default > 25 mil', mats.length > 25000, 'n=' + mats.length);
  const m = mats.find(x => x.codigoInterno);
  ok('chave camel restaurada (codigoInterno)', !!m, m && m.codigoInterno);
  ok('campo numérico como number (custo)', m && typeof m.custo === 'number', m && typeof m.custo + '=' + m.custo);
  ok('flag favorito number', typeof m.favorito === 'number' || m.favorito === null, m && typeof m.favorito);

  console.log('── busca (ILIKE) ──');
  const r = await db.searchMateriais({ q: mats[0].codigoInterno || 'a' });
  const rows = r.rows || r;
  ok('search encontra', rows.length > 0, 'n=' + rows.length);

  console.log('── sync completo ──');
  const sync = await db.getFullSync('default');
  ok('materiais no sync = findAll', sync.materiais.length === mats.length, 'sync=' + sync.materiais.length + ' find=' + mats.length);
  ok('company.sigla string', typeof (sync.company || {}).sigla === 'string', JSON.stringify(sync.company && sync.company.sigla));
  ok('propostasComerciais default', Array.isArray(sync.propostasComerciais) && sync.propostasComerciais.length > 0, 'n=' + (sync.propostasComerciais || []).length);
  ok('priceHistory no material', Array.isArray(sync.materiais[0].priceHistory));
  ok('chaves do sync presentes', Array.isArray(sync.clientes) && Array.isArray(sync.tipicos) && Array.isArray(sync.composicoes));

  console.log('── outros módulos ──');
  const comps = await db.findAll('composicoes');
  ok('composicoes 50', comps.length === 50, 'n=' + comps.length);
  const stages = await db.findAllCrmStages('default');
  ok('crm_stages 8', stages.length === 8, 'n=' + stages.length);
  const emp = await db.listEmpresas();
  ok('empresas 5', emp.length === 5, 'n=' + emp.length);

  console.log('');
  console.log('══ LEITURA: ' + pass + ' passaram, ' + fail + ' falharam ══');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERRO FATAL:', e); process.exit(2); });
