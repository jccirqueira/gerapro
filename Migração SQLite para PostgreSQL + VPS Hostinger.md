# Plano de Migração: SQLite → PostgreSQL + VPS Hostinger

## Resumo Executivo

| Item | Resposta |
|------|----------|
| **É seguro?** | Sim, PostgreSQL é mais robusto que SQLite |
| **É complexo?** | Sim, complexidade média-alta (3-5 dias de trabalho) |
| **Risco de quebra?** | Moderado — mitigável com testes em staging |
| **Tamanho do código afetado** | `db.js` (2230 linhas) + `server_new.js` (3535 linhas) |

---

## FASE 0 — Pré-requisitos e Ambiente (1 dia)

### 0.1 Escolha da VPS (Hostinger)
- Plano: **KVM 2** (2 vCPU, 4GB RAM, 100GB NVMe) — suficiente para o GeraPro
- SO: **Ubuntu 24.04 LTS**
- Instalar: Node.js 22.x, PostgreSQL 16, Nginx, PM2, Git
- Domínio: configurar DNS apontando para IP da VPS

### 0.2 Instalações na VPS
```bash
# PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs

# PM2 (gerenciador de processos)
npm install -g pm2

# Nginx (proxy reverso + SSL)
sudo apt install nginx certbot python3-certbot-nginx
```

### 0.3 Configurar PostgreSQL
```sql
CREATE USER gerapro WITH PASSWORD 'senha_segura';
CREATE DATABASE gerapro OWNER gerapro;
GRANT ALL PRIVILEGES ON DATABASE gerapro TO gerapro;
```

---

## FASE 1 — Criar `db-pg.js` (2 dias)

O coração da migração. Um novo arquivo que substitui o `db.js` original, mantendo a **mesma interface de funções exportadas** para que `server_new.js` não precise mudar a estrutura de chamadas.

### 1.1 Estrutura do novo módulo

```javascript
// js/db-pg.js
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'gerapro',
    user: process.env.PG_USER || 'gerapro',
    password: process.env.PG_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Helper para converter placeholders ? para $1,$2,...
function _toPG(sql, params) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    return { text: pgSql, values: params };
}
```

### 1.2 Mapeamento de funções

Todas as ~50 funções exportadas de `db.js` precisam ser reimplementadas:

| Função | Mudança principal |
|--------|------------------|
| `findAll(entity, empresaId)` | `?` → `$1`, `pool.query()` assíncrono |
| `findById(entity, id)` | Idem |
| `create(entity, data, empresaId)` | `INSERT ... RETURNING *` |
| `update(entity, id, data)` | `UPDATE ... SET col=$N ... WHERE pk=$1 RETURNING *` |
| `remove(entity, id)` | `DELETE ... RETURNING id` |
| `getFullSync(empresaId)` | Agrupar ~30 queries em paralelo com `Promise.all()` |
| `searchMateriais(filters, empresaId)` | `LIKE` funciona igual, `OFFSET/LIMIT` idem |
| `getSettings(empresaId)` | `SELECT * FROM settings WHERE empresa_id = $1` |
| `saveSettings(data, empresaId)` | `INSERT ... ON CONFLICT (empresa_id) DO UPDATE` |
| Transações (`savePriceHistory`, `bulkImportMateriais`) | `BEGIN` / `COMMIT` / `ROLLBACK` via `pool.connect()` |

### 1.3 Conversões SQLite → PostgreSQL

| SQLite | PostgreSQL |
|--------|-----------|
| `?` placeholder | `$1`, `$2`, ... |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| `INSERT OR REPLACE INTO` | `INSERT ... ON CONFLICT (pk) DO UPDATE SET ...` |
| `INSERT OR IGNORE INTO` | `INSERT ... ON CONFLICT DO NOTHING` |
| `TEXT` colunas | `TEXT` (idêntico, ou `VARCHAR` para campos curtos) |
| `REAL` colunas | `NUMERIC` ou `DOUBLE PRECISION` |
| `INTEGER` (booleano) | `INTEGER` (idêntico, ou `BOOLEAN`) |
| `db.transaction(fn)` | `pool.connect()` + `client.query('BEGIN')` ... `COMMIT` |
| `JSON.parse(row.dados)` | Pode usar `JSONB` + `row.dados` já é objeto, ou manter TEXT |
| `PRAGMA foreign_keys = ON` | Padrão no PG |
| `PRAGMA journal_mode = WAL` | Config via `postgresql.conf` |
| `crypto.randomUUID()` para IDs | Mesmo — PG aceita UUID como TEXT |

### 1.4 Schema de inicialização

Criar `migrations/001-initial.sql` com todas as CREATE TABLE para PostgreSQL:

```sql
-- Exemplo:
CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    nome TEXT,
    cnpj TEXT,
    sigla TEXT DEFAULT '',
    plano TEXT DEFAULT 'trial',
    ativo INTEGER DEFAULT 1,
    created_at TEXT,
    folder_name TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
    empresa_id TEXT PRIMARY KEY REFERENCES empresas(id),
    theme TEXT DEFAULT 'light',
    default_markup REAL DEFAULT 30,
    ...
);
```

**Vantagem do PG:** Podemos usar `FOREIGN KEY` real com `ON DELETE CASCADE` (o SQLite tem, mas é opcional e não era usado em todas as tabelas).

---

## FASE 2 — Adaptar `server_new.js` (1 dia)

### 2.1 Trocar o require
```javascript
// Antes
const db = require('./js/db');

// Depois
const db = require('./js/db-pg');
```

### 2.2 Converter chamadas síncronas para async/await

Este é o **maior esforço**. `node:sqlite` (DatabaseSync) é **síncrono**, `pg` é **assíncrono**. Cada chamada a `db.xxx()` no `server_new.js` precisa de `await`.

**Padrão atual (síncrono):**
```javascript
const settings = db.getSettings(empresaId);
const users = db.listUsuarios(empresaId);
res.end(JSON.stringify({ settings, users }));
```

**Padrão novo (assíncrono):**
```javascript
const settings = await db.getSettings(empresaId);
const users = await db.listUsuarios(empresaId);
res.end(JSON.stringify({ settings, users }));
```

**Onde precisa mudar:** Todas as rotas do `server_new.js` que chamam funções do `db`. Estimativa: ~100-150 pontos de chamada.

**Estratégia recomendada:** Não fazer tudo de uma vez. Usar um **wrapper de compatibilidade** temporário:

```javascript
// js/db-wrapper.js
const pgDb = require('./db-pg');

// Cria versões síncronas das funções (para transição gradual)
const syncDb = {};
for (const key of Object.keys(pgDb)) {
    syncDb[key] = (...args) => {
        // Aviso: isso é temporário!
        return pgDb[key](...args).catch(e => { throw e; });
    };
}
module.exports = syncDb;
```

### 2.3 Rotas que retornam JSON

O `res.end(JSON.stringify(...))` precisa ser chamado **depois** do `await`. Garantir que nenhuma resposta seja enviada antes dos dados estarem prontos:

```javascript
// Correto
app.handle('/api/data/sync/full', async (req, res) => {
    const data = await db.getFullSync(empresaId);
    res.end(JSON.stringify({ success: true, data }));
});

// ERRADO (enviaria vazio)
app.handle('/api/data/sync/full', (req, res) => {
    db.getFullSync(empresaId).then(data => {
        res.end(JSON.stringify({ success: true, data }));
    });
    // res.end NÃO deve ser chamado aqui fora!
});
```

### 2.4 Estratégia de roteamento

O `server_new.js` usa **3535 linhas** de if/else. Sugiro **não reescrever o roteamento agora**. Apenas converter o corpo de cada handler para async. O roteamento permanece igual.

---

## FASE 3 — Script de Migração de Dados (1 dia)

### 3.1 Estratégia: Export + Import via `pgLoader`

**Opção A (recomendada): Usar `pgloader`**
```bash
# Instalar pgloader
sudo apt install pgloader

# Arquivo de configuração: migrate.load
LOAD DATABASE
    FROM sqlite:///caminho/gerapro.db
    INTO postgresql://gerapro:senha@localhost/gerapro

WITH include no drop, create tables, create indexes, reset sequences,
     batch rows = 1000, batch size = 50MB

SET PostgreSQL PARAMETERS
    maintenance_work_mem = '128MB',
    work_mem = '12MB'

CAST type datetime to timestamp drop default,
     type date to date drop default;
```

**Opção B (manual, mais controle):**
1. Extrair cada tabela do SQLite via script Node
2. Gerar INSERTs em lote
3. Inserir no PostgreSQL via `COPY` (mais rápido)

### 3.2 Verificação pós-migração

```sql
-- Comparar contagens
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'materiais', COUNT(*) FROM materiais
UNION ALL
... todas as tabelas
ORDER BY 1;
```

---

## FASE 4 — Configuração da VPS (1 dia)

### 4.1 Estrutura de deploy

```
/home/gerapro/
├── app/                    # Código do GeraPro (git clone)
│   ├── server_new.js
│   ├── js/db-pg.js
│   ├── data/
│   │   ├── templates/
│   │   ├── uploads/
│   │   ├── anexos_manufatura/
│   │   └── GeraPro/
│   └── ...
├── .env                    # Variáveis de ambiente
└── ecosystem.config.js     # Config PM2
```

### 4.2 Arquivo `.env`
```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=gerapro
PG_USER=gerapro
PG_PASSWORD=senha_segura_32_caracteres
JWT_SECRET=outra_senha_segura_32_caracteres
MAIL_ENCRYPTION_KEY=chave_criptografia_email
NODE_ENV=production
PORT=8082
```

### 4.3 Config Nginx (proxy reverso)
```nginx
server {
    listen 80;
    server_name gerapro.meusite.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gerapro.meusite.com.br;

    ssl_certificate /etc/letsencrypt/live/gerapro.meusite.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gerapro.meusite.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Aumentar limite para uploads de arquivos grandes
        client_max_body_size 50M;
    }
}
```

### 4.4 PM2 (ecosystem.config.js)
```javascript
module.exports = {
    apps: [{
        name: 'gerapro',
        script: 'server_new.js',
        env: { NODE_ENV: 'production' },
        env_file: '.env',
        instances: 1,
        exec_mode: 'fork',
        max_memory_restart: '1G',
        error_file: 'logs/err.log',
        out_file: 'logs/out.log',
        merge_logs: true,
        autorestart: true,
        watch: false,
    }]
};
```

### 4.5 Backup Automático (cron)
```bash
# /etc/cron.d/gerapro-backup
0 3 * * * root /usr/bin/pg_dump -U gerapro gerapro | gzip > /backups/gerapro_$(date +\%Y\%m\%d).sql.gz
0 5 * * * root find /backups -name "gerapro_*.sql.gz" -mtime +30 -delete

# Backup dos arquivos (uploads, templates, anexos)
30 3 * * * root tar -czf /backups/files_$(date +\%Y\%m\%d).tar.gz -C /home/gerapro/app data/uploads data/anexos_manufatura data/templates
```

---

## FASE 5 — Rollback e Contingência

### 5.1 Plano de rollback
Manter o SQLite funcional paralelamente até a migração ser validada:

```javascript
// js/db.js (modificado)
try {
    module.exports = require('./db-pg');
    console.log('[DB] PostgreSQL ativo');
} catch (e) {
    module.exports = require('./db-sqlite');
    console.log('[DB] Fallback para SQLite:', e.message);
}
```

### 5.2 Checklist de verificação pós-migração

- [ ] Login funciona
- [ ] Lista de clientes carrega
- [ ] Lista de materiais carrega
- [ ] Proposta técnica abre e salva
- [ ] Proposta comercial abre e salva
- [ ] CRM carrega leads
- [ ] Manufatura carrega projetos
- [ ] Testes ATE funcionam
- [ ] Data Book exporta
- [ ] Relatório de Manufatura carrega
- [ ] Upload/download de anexos funciona
- [ ] Envio de e-mail funciona
- [ ] Notificação Telegram funciona
- [ ] Backup agendado funciona

---

## Cronograma Estimado

| Fase | Dias | Descrição |
|------|------|-----------|
| **Fase 0** | 1 | Provisionar VPS, instalar dependências, configurar DNS |
| **Fase 1** | 2 | Criar `db-pg.js` com todas as ~50 funções reimplementadas |
| **Fase 2** | 1 | Adaptar `server_new.js`: `await` em todas as chamadas DB |
| **Fase 3** | 1 | Migrar dados (SQLite → PostgreSQL) + validar |
| **Fase 4** | 1 | Configurar Nginx, SSL, PM2, backups, domínio |
| **Fase 5** | 1 | Testes completos, rollback testado, ajustes finos |
| **Total** | **7 dias** | Trabalho intercalado (não consecutivo) |

---

## Análise de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Query com `?` não convertido | Média | Alto | Teste automatizado: grep em todas as queries |
| `db.transaction()` quebra | Média | Alto | Reimplementar com `pool.connect()` + BEGIN/COMMIT |
| Performance lenta no PG | Baixa | Médio | Adicionar índices, `EXPLAIN ANALYZE` nas queries lentas |
| Perda de dados na migração | Baixa | Crítico | Manter SQLite original como backup, testar em staging |
| Sincronismo `DatabaseSync` vs async | Alta | Alto | Usar `await` em TODAS as chamadas, revisar cada rota |
| Upload de arquivos falha | Baixa | Médio | `fs.writeFileSync` é síncrono e não muda — só o DB fica async |
| Certificado SSL expira | Baixa | Médio | `certbot renew` automático no cron |
