# Deploy GeraPro na VPS Hostinger — 01/07/2026

## 1. Acesso à VPS

```
IP:      5.161.xxx.xxx
Usuário: gerapro
Domínio: gerapro.cacir.com.br
```

### Conexão SSH
```bash
ssh gerapro@5.161.xxx.xxx
```

## 2. Softwares Instalados

| Software | Versão | Finalidade |
|----------|--------|------------|
| Ubuntu | 24.04 LTS | Sistema operacional |
| Node.js | 22.23.1 | Runtime JavaScript |
| npm | 10.9.8 | Gerenciador de pacotes |
| PostgreSQL | 16.14 | Banco de dados (instalado, aguardando migração) |
| Nginx | 1.24 | Proxy reverso + SSL |
| PM2 | 5.x | Gerenciador de processos Node.js |
| Git | 2.x | Controle de versão |
| Certbot | 2.x | Certificado SSL Let's Encrypt |
| dotenv | 16.x | Carregar variáveis de ambiente |

## 3. Estrutura de Diretórios

```
/home/gerapro/
├── app/                              # Código do GeraPro (git clone)
│   ├── server_new.js                 # Servidor backend
│   ├── package.json                  # Dependências npm
│   ├── .env                          # Variáveis de ambiente (NÃO versionado)
│   ├── index.html                    # Frontend principal
│   ├── js/                           # Módulos JavaScript
│   │   ├── state.js                  # Store global
│   │   ├── app.js                    # Controller principal
│   │   ├── db.js                     # Camada SQLite
│   │   └── ...                       # Demais módulos
│   ├── css/                          # Estilos
│   ├── templates/                    # Templates DOCX
│   └── data/                         # Dados da aplicação
│       ├── gerapro.db                # Banco SQLite (19MB)
│       ├── GeraPro/                  # Pastas de PTCs (propostas)
│       ├── uploads/                  # Uploads diversos
│       └── anexos_manufatura/        # Anexos da manufatura
├── .pm2/                             # Configuração do PM2
│   └── logs/                         # Logs do servidor
│       ├── gerapro-out.log           # Log de saída
│       └── gerapro-error.log         # Log de erros
```

## 4. Arquivo .env

Localização: `/home/gerapro/app/.env`

```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=gerapro
PG_USER=gerapro
PG_PASSWORD=sua_senha_aqui
JWT_SECRET=hash_64_caracteres_hex
NODE_ENV=production
PORT=8082
GERAPRO_DATA_DIR=/home/gerapro/app/data
```

### Variáveis explicadas:
- `PORT=8082` — Porta interna do servidor Node.js
- `GERAPRO_DATA_DIR` — Redireciona dados PTC de `/home/GeraPro` para `/home/gerapro/app/data` (resolveu erro de permissão)
- `JWT_SECRET` — Chave para assinar tokens de autenticação

## 5. PM2 — Gerenciamento do Servidor

### Comandos úteis

```bash
# Status
pm2 status

# Logs
pm2 logs gerapro --lines 50

# Parar / Iniciar / Reiniciar
pm2 stop gerapro
pm2 start gerapro
pm2 restart gerapro

# Salvar configuração (após PM2 start)
pm2 save
pm2 startup   # Iniciar automaticamente com o sistema
```

### Logs (PM2 do root — o canônico):
- Saída: `/root/.pm2/logs/gerapro-out.log`
- Erros: `/root/.pm2/logs/gerapro-error.log`

### ⚠️ CRÍTICO — somente UM PM2 pode gerenciar o GeraPro

Na VPS existem **dois daemons PM2** com `PM2_HOME` diferentes:

| Daemon | Usuário | PM2_HOME | Apps |
|---|---|---|---|
| `PM2 v7.0.4` | `root` | `/root/.pm2` | **gerapro**, barbearia-api, cafe1-espaco, cafe2-office |
| `PM2 v7.0.3` | `gerapro` | `/home/gerapro/.pm2` | coffeecraft-api |

**O canônico é o do `root`** (é o que atende a porta 8082). O app `gerapro` NÃO deve
estar registrado no PM2 do usuário `gerapro` — se estiver, os dois brigam pela porta
8082 e o resultado é:

- O processo perdedor entra em loop de `EADDRINUSE` (contador `↺` cresce sem parar);
- O processo vencedor pode rodar **código antigo**, tornando os deploys silenciosamente
  inefetivos (o `git pull` atualiza os arquivos, mas quem serve é outro processo);
- Processos "zumbis" acumulados, às vezes com semanas de vida.

Isso já aconteceu: um processo de **34 dias** servia código anterior à Fase 1 de
Gestão de Projetos, fazendo o `POST /api/data/projetos` retornar `400
{"error":"Entidade inválida"}` — o import de propostas fechadas falhava sem aviso.

**Diagnóstico:**

```bash
# Quem escuta a porta e a qual PM2 pertence
ss -lptn 'sport = :8082'

# Deve existir apenas UM processo rodando server_new.js
ps -eo user,pid,ppid,etime,cmd | grep 'gerapro/app/server_new' | grep -v grep

# Lista de apps de cada instância
pm2 list                                                   # root
sudo -u gerapro PM2_HOME=/home/gerapro/.pm2 pm2 list       # usuário gerapro
```

**Correção (remove só o duplicado, sem tocar no coffeecraft-api):**

```bash
sudo -u gerapro PM2_HOME=/home/gerapro/.pm2 pm2 delete gerapro
sudo -u gerapro PM2_HOME=/home/gerapro/.pm2 pm2 save
pm2 restart gerapro        # no PM2 do root
```

**Verifique após cada deploy** que `pm2 status` mostra uptime crescente (sem `↺`
crescendo) e que `curl -s -o /dev/null -w '%{http_code}' http://localhost:8082/`
responde `200`.

## 6. Nginx — Proxy Reverso

### Arquivo de configuração
`/etc/nginx/sites-available/gerapro`

```nginx
server {
    listen 80;
    server_name gerapro.cacir.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gerapro.cacir.com.br;

    ssl_certificate /etc/letsencrypt/live/gerapro.cacir.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gerapro.cacir.com.br/privkey.pem;

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
        client_max_body_size 50M;
    }
}
```

### Comandos Nginx
```bash
sudo nginx -t                  # Testar configuração
sudo systemctl reload nginx    # Recarregar
sudo systemctl restart nginx   # Reiniciar
```

## 7. DNS (Hostinger)

Registro A criado no painel Hostinger:

| Tipo | Nome | Valor |
|------|------|-------|
| A | gerapro | 5.161.xxx.xxx |

## 8. Certificado SSL

Gerado com Certbot (Let's Encrypt):

```bash
sudo certbot --nginx -d gerapro.cacir.com.br
```

Renovação automática (cron nativo do certbot).

## 9. Banco de Dados

### SQLite (atual)
- Localização: `/home/gerapro/app/data/gerapro.db`
- Tamanho: 19MB
- Contém: 3 usuários, mais dados completos

### PostgreSQL (pronto para migração futura)
```sql
CREATE USER gerapro WITH PASSWORD 'senha';
CREATE DATABASE gerapro OWNER gerapro;
```

## 10. Usuários Cadastrados

| E-mail | Nome | Nível |
|--------|------|-------|
| jcc.cacir@gmail.com | JOSE CARLOS CIRQUEIRA | admin |
| jcc.dev.br@gmail.com | Guilherme | engenheiro |
| fabiano.oliveira@drivetech.com.br | Fabiano Oliveira | vendedor |

## 11. Git — Repositório

- **Remote:** `https://github.com/jccirqueira/gerapro.git`
- **Branch:** `main`
- **Commits importantes:**
  - `3f200be` — Initial commit
  - `878e752` — fix: add grupoSiemens column to materiais table schema
  - `xxx` — feat: add dotenv to load .env file
  - `xxx` — fix: use same-origin API calls to avoid Mixed Content error

### Fluxo de deploy:
```bash
# Windows (desenvolvimento)
git add .
git commit -m "descrição"
git push

# VPS (produção)
cd ~/app
git pull
pm2 restart gerapro
```

## 12. Problemas Resolvidos Durante o Deploy

### 12.1. Permissão `/home/GeraPro`
- **Problema:** `EACCES: permission denied, mkdir '/home/GeraPro'`
- **Causa:** `BASE_DIR` = `path.join(__dirname,'..','..')` resolvia para `/home/` (sem permissão)
- **Solução:** `.env` com `GERAPRO_DATA_DIR=/home/gerapro/app/data`

### 12.2. Coluna `grupoSiemens` ausente no schema
- **Problema:** `Error: no such column: grupoSiemens`
- **Causa:** `CREATE INDEX` usava coluna que só existia como migration posterior
- **Solução:** Adicionar `grupoSiemens TEXT DEFAULT ''` no `CREATE TABLE materiais` (db.js:137)

### 12.3. Dotenv não carregava .env
- **Problema:** Variáveis do `.env` não estavam disponíveis
- **Causa:** Node.js não lê `.env` automaticamente
- **Solução:** Adicionar `require('dotenv').config()` no `server_new.js`

### 12.4. Mixed Content (HTTP × HTTPS)
- **Problema:** `Failed to load resource: ... Mixed Content` bloqueava login
- **Causa:** `_getServerUrl()` retornava `http://hostname:8082`, mas página estava em HTTPS
- **Solução:** `_getServerUrl()` passou a retornar `''` (mesma origem)

### 12.5. Banco vazio na VPS
- **Problema:** `Usuários: []` mesmo após scp
- **Causa:** Servidor rodando durante a cópia
- **Solução:** Parar PM2 antes de copiar o banco

## 13. Comandos de Manutenção Rápida

```bash
# Verificar servidor
pm2 status

# Ver logs de erro
pm2 logs gerapro --err --lines 20

# Verificar banco
cd ~/app
node -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('./data/gerapro.db');console.log(db.prepare('SELECT COUNT(*) as total FROM usuarios').get());db.close();"

# Backup manual do banco
cp /home/gerapro/app/data/gerapro.db /home/gerapro/app/data/backup_$(date +%Y%m%d_%H%M).db

# Atualizar código
cd ~/app && git pull && pm2 restart gerapro

# Verificar Nginx
sudo nginx -t && sudo systemctl reload nginx

# Verificar SSL
sudo certbot renew --dry-run
```

## 14. Acesso ao Sistema

URL: `https://gerapro.cacir.com.br`

Login padrão: `jcc.cacir@gmail.com` (admin)
