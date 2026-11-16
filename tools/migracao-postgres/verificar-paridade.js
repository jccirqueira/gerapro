// Verificação de paridade SQLite × PostgreSQL (tabelas, colunas, FKs, contagens).
// Uso:  node tools/migracao-postgres/verificar-paridade.js   (requer npm install pg)
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

async function main() {
  const sqlite = new DatabaseSync(path.join(REPO, 'data', 'gerapro.db'), { readOnly: true });
  const pg = new Client(PG_CONF);
  await pg.connect();

  // ── tabelas ──
  const st = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
  const pt = (await pg.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(r => r.tablename);
  const sóSQLite = st.filter(x => !pt.includes(x));
  const sóPG = pt.filter(x => !st.includes(x));
  console.log('TABELAS → SQLite: ' + st.length + ' | PG: ' + pt.length + ' | só SQLite: [' + sóSQLite + '] | só PG: [' + sóPG + ']');

  // ── colunas por tabela ──
  let colOk = 0; const difs = [];
  for (const t of st) {
    const sc = sqlite.prepare(`PRAGMA table_info("${t}")`).all().map(r => r.name);
    const pc = (await pg.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t])).rows.map(r => r.column_name);
    const faltaPG = sc.filter(x => !pc.includes(x));
    const sobraPG = pc.filter(x => !sc.includes(x));
    if (faltaPG.length || sobraPG.length) difs.push(`${t}: faltaPG=[${faltaPG}] sobraPG=[${sobraPG}]`);
    else colOk++;
  }
  console.log('COLUNAS → tabelas idênticas: ' + colOk + '/' + st.length);
  difs.forEach(d => console.log('  !! ' + d));

  // ── tipos PG ──
  const tipos = await pg.query("SELECT data_type, count(*) n FROM information_schema.columns WHERE table_schema='public' GROUP BY data_type ORDER BY n DESC");
  console.log('TIPOS PG → ' + tipos.rows.map(r => r.data_type + ':' + r.n).join(', '));

  // ── FKs ──
  let fkSq = 0;
  for (const t of st) fkSq += sqlite.prepare(`PRAGMA foreign_key_list("${t}")`).all().length;
  const fkPG = await pg.query("SELECT count(*) n FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace");
  console.log('FKs → SQLite: ' + fkSq + ' | PG: ' + fkPG.rows[0].n);

  // ── contagens por tabela (baseline da F4) ──
  let totalSq = 0, comDados = 0; const linhasDif = [];
  for (const t of st) {
    const nSq = sqlite.prepare(`SELECT COUNT(*) c FROM "${t}"`).get().c;
    const nPg = +(await pg.query(`SELECT count(*) n FROM "${t.replace(/"/g, '""')}"`)).rows[0].n;
    totalSq += nSq; if (nSq > 0) comDados++;
    if (nSq !== nPg) linhasDif.push(`${t}: sqlite=${nSq} pg=${nPg}`);
  }
  console.log('LINHAS → total SQLite: ' + totalSq + ' | tabelas com dados: ' + comDados);
  console.log(linhasDif.length ? '  !! divergências: ' + linhasDif.join('; ') : '  ✅ contagens idênticas em todas as tabelas');

  await pg.end();
  sqlite.close();
  if (sóSQLite.length || sóPG.length || difs.length || linhasDif.length) process.exit(2);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
