// Fase 4 — migração de dados: SQLite (data/gerapro.db) → PostgreSQL local.
// Uso: node tools/migracao-postgres/migrar-dados.js [--dry]
//   1. Pré-flight: verifica tipos (bigint/double aceitam só números), NOT NULL e colunas ausentes
//   2. Importa: TRUNCATE geral + INSERTs em lote (FKs em modo replica durante a cópia)
//   3. Verifica: contagens por tabela, FKs (anti-join) e sequences de identidade
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { Client } = require('pg');

const REPO = path.join(__dirname, '..', '..');
const PG_CONF = {
  host: process.env.PGHOST || 'localhost',
  port: +(process.env.PGPORT || 5433),
  user: process.env.PGUSER || 'gerapro',
  password: process.env.PGPASSWORD || 'gerapro_local_2026',
  database: process.env.PGDATABASE || 'gerapro',
};
const DRY = process.argv.includes('--dry');
const LOTE = 400;

const q = (id) => '"' + String(id).toLowerCase() + '"';

function converter(ty, v, ref, problemas) {
  if (v === null || v === undefined) return null;
  if (ty === 'bigint') {
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) { problemas.push(`${ref} = ${JSON.stringify(v)} (esperado número p/ bigint)`); return null; }
    return n;
  }
  if (ty === 'double precision') {
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) { problemas.push(`${ref} = ${JSON.stringify(v)} (esperado número p/ double)`); return null; }
    return n;
  }
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

async function main() {
  const sqlite = new DatabaseSync(path.join(REPO, 'data', 'gerapro.db'), { readOnly: true });
  const pg = new Client(PG_CONF);
  await pg.connect();
  const t0 = Date.now();

  const tabelas = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
  console.log('tabelas de app: ' + tabelas.length);

  // ── metadados PG: tipos + nullable + identity ──
  const meta = {};
  for (const t of tabelas) {
    const r = await pg.query(`SELECT column_name, data_type, is_nullable, is_identity FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [t]);
    meta[t] = {};
    for (const x of r.rows) meta[t][x.column_name] = { ty: x.data_type, nullable: x.is_nullable === 'YES', identity: x.is_identity === 'YES' };
  }

  // ── 1. PRÉ-FLIGHT ──
  console.log('\n── 1. pré-flight ──');
  const problemas = [];
  let totalLinhas = 0;
  const dados = {}; // tabela → rows
  for (const t of tabelas) {
    // normaliza chaves para minúsculo (PG grava minúsculo; case map restaura na leitura)
    const rows = sqlite.prepare(`SELECT * FROM "${t}"`).all().map(r => {
      const o = {};
      for (const [k, v] of Object.entries(r)) o[k.toLowerCase()] = v;
      return o;
    });
    dados[t] = rows;
    totalLinhas += rows.length;
    const colsPg = Object.keys(meta[t]);
    for (const row of rows) {
      for (const k of Object.keys(row)) {
        if (!meta[t][k]) { problemas.push(`${t}: coluna "${k}" não existe no PG`); continue; }
      }
      for (const c of colsPg) {
        const m = meta[t][c];
        const v = row[c];
        if (v === null || v === undefined) {
          if (!m.nullable) problemas.push(`${t}.${c} = NULL em coluna NOT NULL`);
          continue;
        }
        converter(m.ty, v, `${t}.${c}`, problemas); // só acumula problemas
      }
    }
  }
  console.log(`linhas a migrar: ${totalLinhas}`);
  if (problemas.length) {
    console.log(`PROBLEMAS (${problemas.length}) — nada foi alterado:`);
    [...new Set(problemas)].slice(0, 30).forEach(p => console.log('  ✗ ' + p));
    process.exit(2);
  }
  console.log('tipos e NOT NULL: OK');
  if (DRY) { console.log('(dry-run — parado antes da importação)'); await pg.end(); sqlite.close(); return; }

  // ── 2. IMPORTAÇÃO ──
  console.log('\n── 2. importação ──');
  await pg.query('BEGIN');
  try {
    await pg.query('SET session_replication_role = replica'); // FKs fora durante a cópia
    await pg.query('TRUNCATE ' + tabelas.map(q).join(', ') + ' RESTART IDENTITY');

    let importadas = 0;
    for (const t of tabelas) {
      const rows = dados[t];
      if (!rows.length) continue;
      const cols = Object.keys(meta[t]);
      let n = 0;
      for (let i = 0; i < rows.length; i += LOTE) {
        const chunk = rows.slice(i, i + LOTE);
        const params = [];
        const VALUES = chunk.map(row => {
          const marks = cols.map(c => {
            params.push(converter(meta[t][c].ty, row[c], `${t}.${c}`, []));
            return '$' + params.length;
          });
          return '(' + marks.join(', ') + ')';
        });
        await pg.query(`INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES ${VALUES.join(', ')}`, params);
        n += chunk.length;
      }
      importadas += n;
      console.log(`  ${t}: ${n}`);
    }

    await pg.query('SET session_replication_role = origin');
    await pg.query('COMMIT');
    console.log(`total importado: ${importadas} linhas`);
  } catch (e) {
    await pg.query('ROLLBACK').catch(() => {});
    console.error('FALHA — rollback executado:', e.message);
    await pg.end(); sqlite.close();
    process.exit(3);
  }

  // ── 3. VERIFICAÇÃO ──
  console.log('\n── 3. verificação ──');
  let falhas = 0;

  // 3a. contagens
  for (const t of tabelas) {
    const nSq = dados[t].length;
    const nPg = +(await pg.query(`SELECT count(*) n FROM ${q(t)}`)).rows[0].n;
    if (nSq !== nPg) { console.log(`  ✗ contagem ${t}: sqlite=${nSq} pg=${nPg}`); falhas++; }
  }
  console.log(`  contagens: ${tabelas.length} tabelas conferidas`);

  // 3b. FKs (anti-join dinâmico)
  const fks = await pg.query(`
    SELECT c.conrelid::regclass::text AS tab, a.attname AS col,
           c.confrelid::regclass::text AS reftab, af.attname AS refcol, c.conname
    FROM pg_constraint c
    JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS ck(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ck.attnum
    JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = c.confkey[ck.ord]
    WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace`);
  for (const fk of fks.rows) {
    const r = await pg.query(
      `SELECT count(*) n FROM ${q(fk.tab)} t LEFT JOIN ${q(fk.reftab)} r ON t.${q(fk.col)} = r.${q(fk.refcol)} WHERE t.${q(fk.col)} IS NOT NULL AND r.${q(fk.refcol)} IS NULL`);
    const n = +r.rows[0].n;
    if (n > 0) { console.log(`  ✗ FK ${fk.conname}: ${n} órfãs`); falhas++; }
  }
  console.log(`  FKs: ${fks.rows.length} conferidas (0 órfãs)`);

  // 3c. sequences de identidade
  const ids = await pg.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND is_identity='YES'`);
  for (const ic of ids.rows) {
    const max = +(await pg.query(`SELECT COALESCE(MAX(${q(ic.column_name)}), 0) n FROM ${q(ic.table_name)}`)).rows[0].n;
    await pg.query(`SELECT setval(pg_get_serial_sequence('${ic.table_name}', '${ic.column_name}'), GREATEST(${max}, 1))`);
    console.log(`  sequence ${ic.table_name}.${ic.column_name} → ${Math.max(max, 1)}`);
  }

  // 3d. amostra de soma (custo dos materiais)
  const sumSq = sqlite.prepare('SELECT COALESCE(SUM(custo), 0) s FROM materiais').get().s;
  const sumPg = +(await pg.query('SELECT COALESCE(SUM(custo), 0) s FROM materiais')).rows[0].s;
  if (Math.abs(Number(sumSq) - sumPg) > 0.001) { console.log(`  ✗ SUM(custo): sqlite=${sumSq} pg=${sumPg}`); falhas++; }
  else console.log(`  SUM(custo) materiais: ${sumPg} ✓`);

  const segs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n══ ${falhas === 0 ? 'MIGRAÇÃO CONCLUÍDA SEM FALHAS' : falhas + ' FALHAS'} (${segs}s) ══`);
  await pg.end();
  sqlite.close();
  process.exit(falhas ? 4 : 0);
}

main().catch(e => { console.error('ERRO FATAL:', e); process.exit(1); });
