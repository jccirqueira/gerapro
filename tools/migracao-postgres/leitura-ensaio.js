// Ensaio — leitura via camada da app contra gerapro_rehearsal (dados de produção)
process.env.PGDATABASE = 'gerapro_rehearsal';
const db = require(require('path').join(__dirname, '..', '..', 'js', 'db.js'));

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? ' → ' + x : '')); } };

async function main() {
  const s = await db.getSettings('default');
  ok('getSettings (valores REAIS de produção)', s && typeof s === 'object', JSON.stringify(s).slice(0, 140));
  ok('aliqCbs number', s && typeof s.aliqCbs === 'number', s && typeof s.aliqCbs);
  ok('modeloTributario', s && typeof s.modeloTributario === 'string', s && s.modeloTributario);

  const mats = await db.findAll('materiais');
  ok('65.194 materiais (default)', mats.length > 60000, 'n=' + mats.length);
  const m = mats.find(x => x.codigoInterno);
  ok('case map (codigoInterno)', !!m, m && m.codigoInterno);
  ok('custo number', m && typeof m.custo === 'number', m && typeof m.custo);

  const sync = await db.getFullSync('default');
  ok('getFullSync completo', sync && Array.isArray(sync.materiais) && sync.materiais.length === mats.length, 'sync=' + (sync.materiais && sync.materiais.length));
  ok('projetos presentes (3 na produção)', Array.isArray(sync.projetos), '');

  const r = await db.searchMateriais({ q: 'WEG' });
  const rows = r.rows || r;
  ok('ILIKE search', rows.length > 0, 'n=' + rows.length);

  const proj = await db.findAll('projetos');
  ok('projetos via findAll', proj.length === 3, 'n=' + proj.length);
  const comps = await db.findAll('composicoes');
  ok('composicoes 51', comps.length === 51, 'n=' + comps.length);

  console.log('══ ENSAIO LEITURA: ' + pass + ' passaram, ' + fail + ' falharam ══');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERRO FATAL:', e); process.exit(2); });
