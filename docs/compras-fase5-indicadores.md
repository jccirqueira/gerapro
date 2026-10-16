# Módulo Compras — Fase 5: Indicadores e Relatórios (Design)

## Objetivo
Dar visibilidade de gestão ao ciclo Compras: **painel de indicadores** com KPIs do
pipeline financeiro, **lead time real × catálogo** (alimentando o Banco de Materiais),
**desempenho de fornecedores**, relatório de **duplicidade** em requisições abertas e
**cópia de prazo/condição** para o cadastro do fornecedor.

## Fluxo de dados

```
comprasCotacoes ──┐
comprasPedidos  ──┼──► renderPainel() (viewMode 'painel')
comprasNotas    ──┤      ├─ KPIs: em cotação / em pedido / recebido no mês / atrasos
materiais       ──┤      ├─ Lead time real (pedido → NF) × materiais.leadTime
fornecedores    ──┘      │     └─ botão grava via store.updateMaterial  → "alimenta a base"
                         ├─ Desempenho por fornecedor (prazo prometido × real, índice de
                         │     divergências das NFs, Δ preço ponderado vs catálogo)
                         └─ Duplicidade: mesmo material em ≥2 requisições em CP_ABERTAS

criarCotacao / salvarCotacao ──► _espelhaCondicoesFornecedor() ──► fornecedores
modal de cotação (troca de fornecedor) ◄── prefillCotFornecedor() ◄── fornecedores
```

## Decisões de design

### 1. `viewMode 'painel'` (não uma rota nova)
O painel é um modo de visualização do módulo, como `nova`/`detail`/`nota`:
- Botão **"Indicadores"** no cabeçalho da lista; "← Requisições" volta via `backToList()`.
- O `store.subscribe` ganhou branch própria: o painel **não tem inputs**, então o
  re-render automático é seguro (KPIs sempre refletem o estado atual).
- Sem staging: `resetView`/`backToList` não precisam limpar nada.

### 2. Datas sem fuso (aritmética de calendário pura)
`_previstaEntrega(p)` devolve **string `YYYY-MM-DD`** (não `Date`):
- Campo explícito `data_prevista_entrega` quando existir; senão
  `data_pedido + _num(prazo_entrega)` via `Date.UTC(y, m-1, d + dias)`.
- Comparação de atraso usa `_hojeISO()` (data **local**) — `setDate()` em objeto
  parseado como UTC mediava entre calendário local/UTC e podia deslocar 1 dia.
- `dias de atraso = _diasEntre(prevista, hojeISO)` (ambas em UTC midnight → inteiro exato).

### 3. Definições dos KPIs
| KPI | Regra |
|---|---|
| Em cotação | cotações `aberta\|enviada\|recebida` → soma de `total` |
| Em pedido | pedidos ≠ `cancelado` e ≠ `recebido` → soma de `total` |
| Recebido no mês | NFs ≠ `estornada` com `data_entrada` (ou `created_at`) no mês corrente → `valor_total` |
| Pedidos em atraso | pedidos ≠ `recebido` com previsão < hoje (contagem; tabela listada) |

### 4. Lead time real
- Amostra só de pedidos com `data_pedido` **e** `data_recebimento`, não cancelados, e
  itens com `qtd_recebida > 0` (efetivamente recebidos).
- Média aritmética por `material_id`; prazo **prometido** = média de `lead_time_previsto`.
- Δ = real − catálogo (vermelho se real maior). Botão por linha e botão em lote
  ("Atualizar catálogo (n)") escrevem `materiais.leadTime` com confirmação —
  é a rotina de **alimentação da base** do Planejamento de Compras.

### 5. Desempenho de fornecedores
- **Δ preço vs catálogo**: `(Σ custo_unitário×qtd ÷ Σ custo_catalogo×qtd − 1) × 100`,
  ponderado pela quantidade, usando o `custo_catalogo` do item da requisição
  (comparação justa mesmo quando o catálogo mudou depois do pedido).
- Índice de divergências = NFs `divergente` ÷ NFs ≠ estornada; estornos exibidos
  como sufixo da coluna NFs (tooltip).

### 6. Cópia de prazo/condição — colunas novas em `fornecedores`
- **`prazoEntrega` / `condicaoPagamento`** (TEXT): CREATE TABLE + migração
  `ALTER TABLE` (try/catch idempotente) + colunas no INSERT de restore do `migrateFromLegacy`.
- **Prefill**: `onchange` do select do modal chama `prefillCotFornecedor()`, que
  **espelha sempre** o cadastro do fornecedor selecionado (valor vazio limpa o campo —
  evita herdar a condição do fornecedor anterior). Chamado também após o render quando
  há pré-seleção (`m.pre`).
- **Espelho**: após `criarCotacao` e após `salvarCotacao` (fora do bloco `_seeding`),
  `_espelhaCondicoesFornecedor()` grava só campos **não vazios e diferentes** —
  a **última negociação vence**, campo vazio nunca apaga histórico.
- Form de fornecedores: dois inputs nomeados (`FormData` → `updateFornecedor`, sem whitelist).

### 7. Export XLSX multi-aba
Helper `_painelXLSXAba(wb, nome, cabeçalhos, linhas, fmtColunas)` reaproveita o padrão
do módulo: cabeçalho **MAIÚSCULO** com negrito + fill `4F46E5` + centralizado, zebra
`F3F4F6` nas linhas ímpares, `numFmt` por coluna (`cell.s.numFmt` — o `cell.z` é ignorado
pelo xlsx-js-style) e **freeze** (`_patchXlsxFreezePane`) em todas as abas.
Abas: Resumo (KPIs), Lead Time, Fornecedores, Duplicidade.

## Validação (browser, dados reais)
- Cenário: 3 requisições, 2 fornecedores (Beta com condições no cadastro), 3 cotações,
  3 pedidos (1 recebido com lead 10d, 1 atrasado 19d), 2 NFs (1 conferida, 1 divergente).
- KPIs 1:1: R$ 58.650 / R$ 16.068 / R$ 42.450 / 1 atraso; duplicidade `IMP-29658`
  em `REQ-0001, REQ-0002` (qtd 3); Alpha −3,72% vs catálogo / Beta +1,02% e índice 100%.
- Lead time: linha e lote gravaram `leadTime` 5 → 10 (Δ 0 no painel).
- Prefill (30 dias/45 dias no Beta; limpo no Alpha), espelho nos dois caminhos
  (`15 dias/28/56 dias` na criação → `12 dias/45/75 dias` no salvar → última vence),
  save do form → `18 dias` round-trip.
- XLSX validado no **XML do ZIP**: `A1 s=3` (bold/fill/center), zebra `s=6` em A2,
  `state="frozen" ySplit=1` nas 4 abas, numFmt presente.
- Console: **0 erros/warnings**. Limpeza total: `foreign_key_check = 0`,
  lead times restaurados em 5, custos intactos.
