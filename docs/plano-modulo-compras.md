# Plano de Implementação — Módulo COMPRAS

> **Status:** em aprovação
> **Data:** 2026-10-15
> **Depende de:** Fase 1 e 2 de Gestão de Projetos (`projetos`, `projeto_fases`), Fase 3 DRE (`projeto_custos`)
> **Entrega por fases**, cada uma com validação no browser com dados reais, 0 erros de console e remoção total de dados de teste antes do commit.

---

## 1. Objetivo

Disponibilizar o fluxo real de compras de uma indústria de painéis elétricos:

```
LM da Engenharia ──► REQUISIÇÃO ──► COTAÇÃO ──► PEDIDO DE COMPRAS ──► NF RECEBIDA
                     (gatilho)      (n Fornecedores)  (n Pedidos)        (baixa + conferência)
```

### Funcionalidades exigidas

| # | Funcionalidade | Fase |
|---|---|---|
| 1 | Gatilho = LM (BOM) recebida da Engenharia, via upload (XLSX/CSV) | Fase 1 |
| 2 | **Alerta obrigatório** para material não cadastrado no Banco de Materiais | Fase 1 |
| 3 | Cotação de preços junto a N fornecedores | Fase 2 |
| 4 | Emissão de Pedido de Compras (1 requisição → N pedidos, por fornecedor) | Fase 3 |
| 5 | Lançamento das NFes das compras recebidas, com conferência | Fase 4 |

### Escopo **fora** (decidido com o usuário)

- ❌ Controle de saldo em estoque — apenas fluxo de compras.
- ❌ Gestão de qualidade/reclamação a fornecedor.
- ❌ Emissão/composição fiscal (tomador) — a NF é lançada como registro de entrada, não escriturada.
- ❌ Integração com ERP contábil.

---

## 2. Situação atual (levantamento)

### 2.1 Banco de Materiais — `materiais`

25.498 registros (Siemens 25.350 / WEG 146). Colunas relevantes em `js/db.js:158-189` + migrações `db.js:1055-1070`:

- **Identificação:** `codigoInterno`, `codigoFabricante`, `fabricante`, `descricao`, `modelo`, `categoria`, `grupoSiemens`
- **Preço:** `custo` (REAL), `markup`, `precoSugerido`
- **Logística:** `unidade`, `leadTime` (dias, default 5), `peso`, dimensões
- **Fiscal:** `ncm`, `origem`, `icms`, `ipi`, `pis`, `cofins`

**Limitações que impactam o módulo:**

| Limitação | Consequência | Mitigação |
|---|---|---|
| **Sem `fornecedorId`** | Não há "fornecedor padrão" do material | Derivar do último Pedido de Compras do material (auto-aprendizado) e sugerir na cotação |
| **Sem UNIQUE em `codigoInterno`/`codigoFabricante`** | 15 códigos duplicados reais no banco | Matching por código **com escopo de `empresa_id`** + normalização `trim().toLowerCase()` + fallback textual com score |
| **`price_history` vazia** (0 registros) | Sem histórico de preço real | Passar a gravar com `origin='compra'` no recebimento da NF (Fase 4) — **o catálogo passa a se auto-alimentar** |
| **Sem estoque** | Confirmado: fora de escopo | — |

Referências de matching a replicar: `js/state.js:1279-1287` (`isCodeDuplicate`), `js/db.js:1404-1433` (dedup por código), `js/materiais.js:1479-1489` (pareamento de importação), `js/automacaoMateriais.js:117-146` (score textual por categoria + keywords).

### 2.2 Fornecedores — `fornecedores`

Apenas **2 cadastrados** (Wago, WEG). Campos: `razaoSocial`, `nomeFantasia`, `cnpj`, endereço completo, `contatoNome/Cargo`, `email`, `telefone`.

**~~Não existem~~** ~~campos de `prazo_pagamento` / `condicao_comercial`.~~ → **Existem desde a Fase 5**: `prazoEntrega` / `condicaoPagamento` (colunas novas, espelho da última negociação). O prazo/condição **da negociação** continua gravado **na cotação e no pedido** (o local contabilmente correto, pois variam por negociação); o cadastro guarda o valor usual e alimenta o pré-preenchimento.

### 2.3 LM / BOM

**Não existe hoje.** Fontes parciais de lista de materiais no sistema:

- `eq.materials` + `eq.automationMaterials` na proposta técnica (`js/propostaTecnica/editor.js:917-925`, `core.js:544-556`) — snapshot com `materialId`
- `chaparia_lists.items[]` com `materialId` real (`js/chaparia.js:347-357`)
- `orcamentos.items[]` com `refId` (`js/orcamentos.js:291-318`) — proposta de **venda**, não reutilizável
- `js/lm.js` monta a LM a partir de cargas × típicos

→ **Decisão:** a fonte será **upload de arquivo** pelo engenheiro responsável (conforme alinhado), e a Engenharia de Projetos passará a ser módulo nativo no futuro. O schema, portanto, é agnóstico da origem.

### 2.4 Ativos reutilizáveis

| Ativo | Onde | Uso no módulo |
|---|---|---|
| Extração de itens de PDF/XLSX/DOCX | `js/comparacaoDocumentos.js` | Pipeline de extração da LM (complemento ao XLSX determinístico) |
| Importação de tabela de preços por fornecedor | `store.importPricesByCode` (`js/state.js:1223-1277`) + `price_import_templates` | Preencher cotação a partir de planilha do fornecedor |
| Helper de API CRUD | `js/manufatura.js:5-47` (`api.get/getById/create/update/remove`) | Comunicação com `/api/data` |
| Padrão de módulo completo | `js/projetos.js` (header sticky + cards + toolbar + tabela + `prj-modal-overlay`) | Shell e UI |
| `window.app.confirm()` → `Promise<boolean>` | `js/app.js:3442-3481` | Confirmações (evita `confirm()` nativo) |
| Upload de arquivos | endpoint já usado pelo Comparação de Documentos | Anexo da LM |

---

## 3. Modelo de dados

8 entidades. Todas seguem o padrão estabelecido: `CREATE TABLE IF NOT EXISTS` em `js/db.js` + `TABLE_MAP` + `getFullSync` + `validEntities` em `server_new.js` + estado/CRUD em `js/state.js`. **`empresa_id` obrigatório em todas** (multiempresa).

### 3.1 `compras_requisicoes` — cabeçalho da LM recebida

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | TEXT PK | |
| `empresa_id` | TEXT NOT NULL | default `'default'` |
| `codigo` | TEXT | `REQ-0001` sequencial por empresa |
| `projeto_id` | TEXT | vínculo com Gestão de Projetos |
| `origem` | TEXT | `'upload'` \| `'manual'` \| `'proposta'` — **agnóstico da fonte** |
| `titulo` | TEXT | |
| `solicitante` | TEXT | engenheiro responsável pela LM |
| `revisao` | TEXT | nº da revisão da LM |
| `arquivo_nome` / `arquivo_path` / `arquivo_hash` | TEXT | anexo + detecção de reupload idêntico |
| `data_lm` | TEXT | data do documento |
| `data_requisicao` / `data_liberacao` | TEXT | |
| `liberada_por` | TEXT | auditoria do gate Engenharia → Compras |
| `status` | TEXT | `rascunho` \| `em_conferencia` \| `liberada` \| `em_cotacao` \| `em_pedido` \| `recebida` \| `cancelada` |
| `total_estimado` | REAL | Σ qtd × custo do catálogo (snapshot) |
| `total_real` | REAL | Σ efetivamente pedido/recebido |
| `observacoes`, `created_at`, `updated_at` | TEXT | |

Índices: `(empresa_id)`, `(empresa_id, projeto_id)`, `(empresa_id, status)`

### 3.2 `compras_requisicao_itens` — linhas da LM

| Coluna | Tipo | Observação |
|---|---|---|
| `id`, `empresa_id`, `requisicao_id`, `ordem` | | |
| **`material_id`** | TEXT | **NULL quando não casou — é o gatilho do alerta** |
| **`nao_cadastrado`** | INTEGER | `0/1` (o `node:sqlite` não bindeia booleanos) |
| `match_confianca` | REAL | score do pareamento (1.0 = código exato) |
| `codigo` | TEXT | como veio no arquivo |
| `descricao`, `fabricante`, `unidade` | TEXT | |
| `qtd` | REAL | |
| `custo_catalogo` | REAL | snapshot do catálogo no import |
| `lead_time_catalogo` | REAL | |
| `status` | TEXT | `pendente` \| `cotado` \| `em_pedido` \| `recebido` \| `cancelado` |
| `qtd_cotada` / `qtd_pedida` / `qtd_recebida` | REAL | agregadores para a barra de progresso |
| `observacoes`, `created_at`, `updated_at` | TEXT | |

### 3.3 `compras_cotacoes` — uma cotação por fornecedor

`id`, `empresa_id`, `requisicao_id`, **`fornecedor_id`**, `numero` (`COT-0001`), `data_solicitacao`, `data_resposta`, `status` (`aberta` \| `enviada` \| `recebida` \| `vencedora` \| `descartada` \| `cancelada`), `prazo_entrega`, `condicao_pagamento`, `validade_proposta`, `frete`, **`total`**, `observacoes`, `created_at`, `updated_at`.

### 3.4 `compras_cotacao_itens` — preço do fornecedor por item

`id`, `empresa_id`, `cotacao_id`, **`requisicao_item_id`**, `material_id`, `qtd`, **`custo_unitario`**, `ipi`, `icms`, `desconto` (percentuais), `prazo_entrega`, **`total`**, **`vencedor`** (INTEGER 0/1 — marcação item a item), `observacoes`, `created_at`, `updated_at`.

### 3.5 `compras_pedidos` — Pedido de Compras

`id`, `empresa_id`, `codigo` (`PC-0001`), `requisicao_id`, `cotacao_id`, `fornecedor_id`, `data_pedido`, `data_prevista_entrega`, `data_recebimento`, `status` (`rascunho` \| `enviado` \| `em_entrega` \| `parcial` \| `recebido` \| `cancelado`), `condicao_pagamento`, `prazo_entrega`, `transportadora`, `frete`, `desconto`, **`total`**, `solicitante`, `aprovado_por`, `aprovado_em`, `observacoes`, `created_at`, `updated_at`.

### 3.6 `compras_pedido_itens`

`id`, `empresa_id`, `pedido_id`, `requisicao_item_id`, `cotacao_item_id`, `material_id`, `codigo`, `descricao`, `fabricante`, `unidade`, **`qtd`**, **`qtd_recebida`** (baixa parcial), `custo_unitario`, `ipi`, `icms`, `desconto`, `lead_time_previsto`, `total`, `created_at`, `updated_at`.

### 3.7 `compras_notas` — NF recebida (N por pedido)

`id`, `empresa_id`, `pedido_id`, `fornecedor_id`, `numero`, `serie`, `chave_acesso`, `data_emissao`, `data_recebimento`, `data_entrada`, `valor_produtos`, `valor_frete`, `valor_desconto`, **`valor_total`**, `icms`, `ipi`, `pis`, `cofins`, `transportadora`, `volumes`, `conferida` (0/1), `conferida_por`, `conferida_em`, `status` (`recebida` \| `conferida` \| `divergente` \| `estornada`), `observacoes`, `created_at`, `updated_at`.

### 3.8 `compras_nota_itens`

`id`, `empresa_id`, `nota_id`, `pedido_item_id`, `material_id`, `codigo`, `descricao`, `unidade`, **`qtd_recebida`**, `custo_unitario`, `lote`, `data_validade`, `total`, `created_at`, `updated_at`.

---

## 4. A entrada da LM — o coração do módulo

Conforme discutido, a LM vem por **upload do engenheiro responsável**. Abaixo, o desenho para tornar esse processo profissional.

### 4.1 Por que não PDF como fluxo primário

Extração de PDF é frágil (layouts variam por fornecedor/versão do CAD). O GeraPro já tem extração assistida por IA em `js/comparacaoDocumentos.js`, mas ela deve ser **complemento**, não o caminho principal.

**Fluxo primário: XLSX/CSV com template padrão.**
- Botão **"Baixar template LM.xlsx"** — colunas: `Código | Descrição | Fabricante | Unidade | Quantidade`
- Validação de cabeçalho: se as colunas não casarem, o upload é rejeitado com mensagem clara dizendo o que falta
- Resultado determinístico, 100% reproduzível, sem custo de IA

**Complemento opcional:** upload de PDF/DOCX passa pela extração do Comparação de Documentos e cai na **mesma grade de conferência** — o usuário valida antes de salvar.

### 4.2 Anexar ao Projeto, não solto no sistema

O arquivo deve viver como **documento versionado do Projeto**, não como upload avulso. Motivos:

1. **Rastreabilidade** — quem enviou, quando, que revisão, hash do arquivo
2. **Accountability** — separa formalmente Engenharia (que emite) de Compras (que executa)
3. **Reupload não destrói** — nova revisão preserva a anterior; é possível ver o histórico
4. O Projeto já existe (Fase 1 de Gestão de Projetos) e já tem `origem_id` apontando para a proposta ganha

### 4.3 Gate formal de Liberação para Compras

`rascunho → em_conferencia → liberada`

Só requisições **liberadas** podem ser cotadas ou virar pedido. A liberação registra `liberada_por` + `data_liberacao` (auditoria). Validações bloqueantes antes de liberar:

- [ ] Todos os itens com `material_id` preenchido (sem `nao_cadastrado`)
- [ ] Todos os `qtd` > 0
- [ ] Todos com `unidade` preenchida
- [ ] Sem itens duplicados internamente (mesmo material, mesma descrição)
- [ ] Pelo menos 1 item

Isso é o que separa "um upload" de um processo controlado.

### 4.4 Conferência guiada do matching — o alerta de material não cadastrado

Algoritmo em 3 passos:

1. **Código exato** — `codigoInterno` **ou** `codigoFabricante`, `trim().toLowerCase()`, **escopo de `empresa_id`**
   - Se >1 candidato → estado `ambiguo`, usuário escolhe
2. **Score textual** — categoria + keywords da descrição (reaproveitar a lógica de `js/automacaoMateriais.js:117-146`); aceitável se score alto
3. **Sem match** → `nao_cadastrado = 1`

A grade de conferência exibe 3 estados visuais:

| Estado | Cor | Ação |
|---|---|---|
| ✓ Casado (código exato) | verde | — |
| ? Sugestão (score textual) | âmbar | usuário confirma ou corrige |
| ✗ Não cadastrado | vermelho | botão **"Cadastrar material"** |

**"Cadastrar material"** abre o formulário de material **pré-preenchido** com `descricao`, `codigoInterno`, `fabricante`, `unidade` e `custo` vindos da LM. Ao salvar, o item é vinculado e o badge de pendências é atualizado.

**Banner de resumo no topo:** *"148 itens — 132 casados, 11 sugeridos, **5 não cadastrados**. A requisição não pode ser liberada até resolver."*

### 4.5 Requisitos profissionais adicionais

| # | Requisito | Valor |
|---|---|---|
| 1 | **Preço estimado automático** do catálogo ao importar | Dá visibilidade de investimento desde a entrada; vira `total_estimado` |
| 2 | **Duplicidade entre requisições** — alertar se o mesmo material já está em requisição aberta | Evita compra dupla (problema real e caro) |
| 3 | **Versionamento com diff** — reimportar LM nova mostra o delta (itens novos / removidos / quantidade alterada) | Reaproveita a lógica de comparação do Comparação de Documentos |
| 4 | **Fornecedor sugerido** — derivar do último Pedido de Compras daquele material | Auto-aprendizado; reduz trabalho de cotação |
| 5 | **Export XLSX da requisição** | Padrão já instalado (`lib/xlsx-js-style.min.js` + `_patchXlsxFreezePane`) |

### 4.6 Evolução futura (não bloqueia)

Quando a Engenharia de Projetos virar módulo nativo, a LM passará a ser gerada **dentro** do GeraPro a partir da proposta técnica (`eq.materials` + `eq.automationMaterials` + chaparia). Como `origem` é um campo do schema, essa mudança **não altera nenhuma tabela** — apenas entra um novo valor em `origem` e um novo botão de geração.

---

## 5. Fases de implementação

### Fase 0 — Esqueleto e infraestrutura

**Entregáveis**
- `js/compras.js` — módulo com estado (`viewMode`, `activeId`, `activeTab`, filtros), `init()` expondo `window.comprasModule` **e** `window.app.compras`, `store.subscribe` com guarda `_active`, `resetView()`, `render()` idempotente
- `css/compras.css` — seções numeradas no padrão de `projetos.css`, importado por `theme-industrial.css`
- 8 `CREATE TABLE` + índices + `TABLE_MAP` + `getFullSync` + `validEntities` + estado inicial + lista de sync + CRUD (`addX/updateX/deleteX` com rollback local)

**Wiring (checklist exato)**

| Arquivo | Local | O que |
|---|---|---|
| `index.html` | seção lateral, após Engenharia (~L108-141) | nav-item `data-target="compras"` + `#compras-badge` |
| `index.html` | bloco MODULE (~L1215-1265) | `<div id="view-compras" class="module-view hidden-module fade-in"></div>` |
| `index.html` | array `modules` (~L1277-1319) | `'js/compras.js'` **após** `js/app.js` |
| `js/app.js` | `titleMap` (~L854-888) | `'compras': 'Compras'` |
| `js/app.js` | `modulesToReset` (~L893) | `'compras'` |
| `js/app.js` | após L990 | bloco `if (viewName === 'compras' && window.comprasModule) window.comprasModule.render();` |
| `js/app.js` | `COLLECTIONS` (~L2720) | as 8 entidades (restore) |
| `css/theme-industrial.css` | L19 | `@import url("compras.css");` |

**Critério de aceite:** módulo abre pela sidebar, lista vazia renderiza, badge atualiza, 0 erros/0 warnings de console.

---

### Fase 1 — Entrada da LM: Requisição + alerta de material não cadastrado ⭐

**O coração do módulo.**

**Entregáveis**
- Tela de lista de Requisições (cards de resumo: total, em cotação, em pedido, recebidas; busca; filtro por status e projeto)
- **Upload da LM** — template XLSX para download, validação de colunas, hash p/ reupload, anexo ao Projeto
- **Parsing e matching** em 3 passos contra `materiais` (código → score textual → não cadastrado)
- **Grade de conferência** com os 3 estados + **cadastro inline** de material não cadastrado (formulário pré-preenchido)
- **Banner de pendências** e **validações de liberação**
- **Gate "Liberar para Compras"** com auditoria
- Detalhe da requisição com abas: Itens / Resumo
- Barra de progresso por item (`pendente → cotado → em_pedido → recebido`)
- Export XLSX

**Critério de aceite:** upload de LM real (arquivo do usuário, não sintético) → matching corretamente identifica não cadastrados → cadastro inline resolve → liberação bloqueada enquanto houver pendência → requisição liberada aparece como pronta para cotação.

---

### Fase 2 — Cotações

**Entregáveis**
- Criar cotação por fornecedor a partir da requisição **liberada** (1 requisição → N cotações)
- **Matriz de comparação** — itens × fornecedores lado a lado, com destaque do menor preço e do menor prazo
- Preenchimento manual **e** importação de tabela de preços do fornecedor (reaproveitar `importPricesByCode` + `price_import_templates`)
- **Marcação de vencedor item a item** (não necessariamente o mesmo fornecedor para todos os itens)
- Campos de negociação: prazo de entrega, condição de pagamento, validade da proposta, frete
- Status da requisição → `em_cotacao`

**Critério de aceite:** 2+ fornecedores cotados, matriz compara corretamente, vencedores marcados, totais conferem, requisição avança.

---

### Fase 3 — Pedido de Compras

**Entregáveis**
- **Gerar Pedido** a partir dos itens vencedores, **agrupando por fornecedor** (1 requisição → N pedidos)
- Código sequencial `PC-0001`
- **Aprovação por valor** com limite configurável (sem aprovação até o limite; acima, exige `aprovado_por`)
- Ciclo de vida de status com datas (`enviado → em_entrega → parcial → recebido`)
- Visualização/impressão do PC (XLSX no padrão instalado; PDF via navegador)
- Fechamento automático da requisição quando todos os itens tiverem pedido

**Critério de aceite:** requisição com vencedores em 2 fornecedores gera 2 pedidos corretos; aprovação por valor funciona; status evolui.

---

### Fase 4 — Recebimento / NF ⭐ (fecha o ciclo) ✅ **concluída e validada**

**Entregáveis**
- **Lançar NF** por pedido (N NFs por pedido → entregas parciais; item com qtd 0 fica de fora da NF)
- Itens da NF com baixa parcial em `compras_pedido_itens.qtd_recebida` (recalculada em cada save, ignorando NFs estornadas)
- **Conferência automática** quantidade e preço × pedido → divergência sinalizada (tolerância de preço 0,005)
- Status da NF: `recebida → conferida | divergente | estornada`
- **Gravação em `price_history`** com `origin='compra'` (custo real do fornecedor) + `custo_anterior` para estorno exato
- **Integração com a DRE do Projeto**: `projeto_custos` (`tipo='real'`, `categoria='material'`, `origem='compra'`) — **atualizado** na edição da NF (não duplica)
- **Fechamento do ciclo**: pedido vira `recebido`/`parcial`; requisição vira `recebida` quando todos os pedidos recebem (`total_real` + `qtd_recebida` agregado nos itens da LM)

**Critério de aceite:** ✅ NF recebida baixa o pedido corretamente (parcial e total); divergência detectada (banner + badge); `price_history` populada com `origin='compra'`; DRE reflete o custo real (2 NFs = 2 lançamentos, edição não duplica); estorno reverte baixa/preço/DRE exatamente. Validado no browser com 0 erros de console.

---

### Fase 5 — Indicadores e relatórios (enriquecimento) ✅ **concluída e validada**

**Entregáveis**
- **Painel "Indicadores"** (novo `viewMode 'painel'`, botão no cabeçalho da lista) com **4 KPIs**: valor em cotação (cotações abertas/enviadas/recebidas), em pedido (não cancelados/recebidos), recebido no mês (NFs ≠ estornada com `data_entrada` no mês) e **pedidos em atraso** (previsão explícita ou `data_pedido + prazo_entrega` < hoje, aritmética de calendário sem fuso)
- **Lead time real × catálogo**: média de `data_pedido → data_recebimento` por material (só itens com `qtd_recebida > 0`) vs `materiais.leadTime` + prazo prometido na cotação; botão por linha e botão em lote **gravam o real no catálogo** (`store.updateMaterial`)
- **Desempenho de fornecedores**: pedidos, total comprado, prazo prometido × real, NFs (com estornos), índice de divergências e **Δ preço vs catálogo** (diferença média ponderada pela quantidade)
- **Relatório de duplicidade**: mesmo `material_id` em ≥2 requisições com status em `CP_ABERTAS`
- **Cópia de prazo/condição ao cadastro do fornecedor**: novas colunas `fornecedores.prazoEntrega` / `condicaoPagamento` (CREATE + migração `ALTER TABLE` + INSERT de restore); pré-preenchimento na troca do fornecedor no modal de cotação e **espelho automático** ao criar/salvar cotação (a última negociação vence; campo vazio nunca apaga)
- **Export XLSX multi-aba** (Resumo, Lead Time, Fornecedores, Duplicidade) no padrão do módulo (cabeçalho MAIÚSCULO em negrito centralizado, zebra, primeira linha congelada em todas as abas)

**Critério de aceite:** ✅ KPIs batem 1:1 com os dados (58.650 / 16.068 / 42.450 / 1 atraso no cenário de teste); lead time real atualiza o catálogo nas duas rotinas (linha e lote); prefill reflete o cadastro do fornecedor selecionado (limpa ao trocar); espelhamento confirmado nos dois caminhos (`criarCotacao` e `salvarCotacao`, última negociação vence); campos novos no form de fornecedores salvam round-trip completo; XLSX com 4 abas validado no XML (negrito/fill/zebra/freeze/numFmt); 0 erros de console. Validado no browser com dados reais.

---

## 6. Integrações

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ Engenharia      │      │     COMPRAS      │      │   CATÁLOGO      │
│ (upload LM)     │─────►│ REQ → COT → PC   │─────►│  materiais      │
└────────┬────────┘      │        → NF      │      │  price_history  │
         │               └────────┬─────────┘      └────────▲────────┘
         │                        │                         │
         ▼                        ▼                         │
┌─────────────────┐      ┌──────────────────┐               │
│ Gestão de       │      │  DRE do Projeto  │◄──────────────┘
│ Projetos        │      │ projeto_custos   │   (custo real de material)
│ projeto_id      │      │ Fase 3           │
└─────────────────┘      └──────────────────┘
```

1. **Catálogo de materiais** — leitura na importação da LM; **escrita** de `price_history` no recebimento da NF
2. **DRE do Projeto** (entregue na Fase 3 de Projetos) — NF recebida alimenta `categoria='material'`, fechando o ciclo estimado × real
3. **Gestão de Projetos** — `projeto_id` na requisição; painel de compras no detalhe do projeto
4. **Fornecedores** — `fornecedor_id`; prazo/condição gravados na cotação/pedido e **espelhados** no cadastro (`prazoEntrega`/`condicaoPagamento`, Fase 5)

---

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Extração de PDF frágil | XLSX/CSV com template é o fluxo primário; IA é complemento com conferência humana |
| `materiais` sem UNIQUE nos códigos | Matching com escopo `empresa_id` + normalização + fallback textual + estado `ambiguo` |
| Só 2 fornecedores cadastrados | Cadastro rápido inline a partir da cotação |
| Endpoint/limite de upload | Verificar antes da Fase 1 o endpoint já usado pelo Comparação de Documentos |
| `node:sqlite` não bindeia booleanos | Usar `0/1` em `nao_cadastrado`, `vencedor`, `conferida` |
| Dado de teste em produção | Validação sempre com dados reais + remoção total antes do commit (fluxo do projeto) |
| PM2 duplicado na VPS | Seguir o procedimento de `docs/deploy-vps-hostinger-2026-07-01.md` (PM2 canônico é o do root) |

---

## 8. Critérios globais de qualidade (todos os entregues)

- Validação no **browser com dados reais**, sem dados de teste remanescentes
- **0 erros / 0 warnings** de console
- Verificar o código **em execução** (`Function.toString()`), não apenas o arquivo servido
- Export XLSX no padrão instalado: cabeçalho maiúsculo negrito centralizado, zebrado, estilos de grupo/total, freeze pane e `numFmt` **dentro** de `cell.s` (`xlsx-js-style` ignora `cell.z`)
- Multiempresa: `empresa_id` em todas as tabelas e filtros
- Commit + **rebase** + push, depois deploy VPS com verificação pós-deploy
