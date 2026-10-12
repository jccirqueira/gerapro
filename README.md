# GeraPro — SaaS de Propostas Técnicas e Comerciais

**GeraPro** é uma aplicação web multiempresa para automatizar a rotina de uma empresa de
automação/engenharia elétrica: desde a proposta técnica (PTC) com cálculos elétricos até a
proposta comercial, precificação, pipeline de vendas e fábrica (manufatura).

Hoje é um sistema **cliente–servidor real**: backend Node.js, banco SQLite e frontend em
ES Modules — sem etapa de build.

---

## Funcionalidades

**Comercial**
- **Proposta Técnica (PTC)** — dados gerais, equipamentos e cargas, cálculos elétricos
  (barramentos, tipicos, QET), IO-List/BOM, materiais, mão de obra, infraestrutura e
  exportação DOCX/PDF.
- **Proposta Comercial / Completa** — itens, IPI/impostos, condições e exportação.
- **Pipeline Comercial** — funil de vendas com valores, revisões e log de alterações.
- **Precificação** — markup, ICMS (interestadual automático por UF), IPI, custos fixos e
  despesas.
- **CRM** — leads, funil, templates de e-mail e histórico.

**Operação**
- **Importação com IA** — extrai dados de PDF/DOCX/planilhas para dentro da proposta.
- **Catálogo de Materiais / Fornecedores / Clientes** — cadastros com sincronização ao servidor.
- **Manufatura** — ordens, DXF e relatórios de produção.
- **Comparar Documentos** — comparação de versões de documentos.
- **Gerador QET**, **LM (Lista de Materiais)** e relatórios gerenciais.
- **Ajuda integrada** com conteúdo e capturas de tela.

**Plataforma**
- Multiempresa (cada empresa tem seus templates, usuários e dados).
- Autenticação JWT com níveis de acesso (admin / engenheiro / visualizador).
- Backup/restauração de dados pelo servidor.

---

## Arquitetura e stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js “puro” (sem framework web) — `server_new.js` |
| Banco | SQLite via `node:sqlite` (nativo do Node, sem dependência externa) |
| Frontend | Vanilla JS com **ES Modules** (carregados pelo loader do `index.html`, sem bundler) |
| Estilo | CSS próprio (`css/theme-industrial.css`) |
| PDF / DOCX | `pdfmake` (servidor) e `docxtemplater` + `pizzip` (servidor) |
| Auth | `jsonwebtoken` (JWT) + `bcryptjs` |
| E-mail | `nodemailer` (SMTP) e `@sendgrid/mail` |
| Extras | `exceljs`/`xlsx`, `tesseract.js` (OCR), `pdf-parse`, `mammoth`, `dxf-parser`, Telegram (`node-telegram-bot-api`) |
| CDNs (frontend) | Chart.js, SortableJS, SheetJS, QRCode |

---

## Requisitos

- **Node.js 22.5 ou superior** (o banco usa `node:sqlite`; testado com Node 24)
- npm

## Como executar

```bash
# 1. Dependências
npm install

# 2. Arquivo de ambiente (na primeira execução o servidor também
#    gera JWT_SECRET e MAIL_ENCRYPTION_KEY e grava no .env)
Copy-Item .env.example .env     # PowerShell  |  cp .env.example .env  (Linux/macOS)

# 3. Subir o servidor
npm start                       # ou: node server_new.js  |  npm run dev (nodemon)
```

Acesse **http://localhost:8082**

### Primeiro acesso

- Na **primeira execução** (sistema sem usuários), o cadastro está aberto: crie o
  administrador inicial pela tela de login (“Criar Conta”).
- A partir daí o **registro fica fechado**: novas contas são criadas pelo administrador
  no painel de usuários.

---

## Configuração (`.env`)

| Variável | Descrição |
|---|---|
| `PORT` | Porta HTTP (padrão `8082`) |
| `JWT_SECRET` | Segredo dos tokens — gerado automaticamente se ausente |
| `MAIL_ENCRYPTION_KEY` | Chave que criptografa senhas de e-mail no banco — gerada automaticamente se ausente (a rotação exige reentrar as senhas SMTP) |
| `GERAPRO_DATA_DIR` | Diretório-base onde as pastas `GeraPro/<empresa>/PTC-*` são gravadas. **Recomendado em produção** |
| `NODE_ENV` | `development` \| `production` (em produção o servidor exige segredos persistíveis) |
| `AI_PROVIDER`, `OLLAMA_URL`, `OLLAMA_MODEL`, `OPENAI_KEY`, `OPENAI_MODEL` | IA (valores do banco prevalecem) |
| `TELEGRAM_BOT_TOKEN` | Notificações via Telegram (opcional) |

---

## Estrutura de pastas

```
server_new.js        Servidor HTTP + API (rotas, auth, uploads, exports)
index.html           Shell da aplicação + loader dos módulos
js/                  Módulos ES do frontend (state, app, propostaTecnica, …)
css/                 Tema e estilos
img/                 Ícones e imagens de interface
prints/              Capturas usadas na ajuda
fonts/               Fontes Roboto usadas na geração de PDF
templates/<empresa>/ Templates DOCX por empresa (fallback: templates/default)
data/                Banco SQLite, uploads e backups  (não versionado)
docs/                Guias (.md/.txt versionados) e documentos de cliente (não versionados)
_archive/            Lixo antigo movido para fora da raiz (não versionado)
xx/                  Planilhas avulsas de cliente (não versionado)
```

---

## Segurança

- Autenticação JWT; rotas de IA/exportação exigem token.
- Rate limiting em login, cadastro e chamadas de IA.
- Servidor de arquivos estáticos com **allowlist** (banco, `.git` e `.env` não são servidos).
- Sanitização de caminhos nas APIs de arquivo (anti path-traversal).
- Cada usuário opera no escopo da sua empresa (multi-tenancy).

## Deploy

O guia de implantação está em [`docs/deploy-vps-hostinger-2026-07-01.md`](docs/deploy-vps-hostinger-2026-07-01.md).

## Licença

Uso privado.
