# Módulo Compras — Fase 4: Recebimento / NF (Design)

## Objetivo
Fechar o ciclo Requisição → Cotação → Pedido → **NF**. Lançar N NFs por pedido (entregas
parciais), baixar `compras_pedido_itens.qtd_recebida`, detectar divergência de qtd/preço,
gravar `price_history(origin='compra')` e espelhar o custo real na DRE do projeto.

## Fluxo de dados

```
Pedido (PC-0001)
  └─ NF (NF-0001, NF-0002 …)          N por pedido
       └─ NF itens                    vinculados a pedido_item_id
            ├─ baixa em pedido_item.qtd_recebida  (parcial ok)
            ├─ conferência qtd × custo vs pedido  → status nota
            ├─ price_history(origin='compra')     → materiais.custo
            └─ projeto_custos(tipo='real', cat='material', origem='compra')
```

## Decisões de design

### 1. Status da NF
- `recebida` → ao criar (lançamento do recebimento)
- `conferida` → qtd e preço batem com o pedido
- `divergente` → qualquer item com qtd > pedido ou custo_unitário ≠ pedido
- `estornada` → baixa revertida

Transições: `recebida → conferida | divergente | estornada`. A conferência é automática
no save; o usuário só pode estornar.

### 2. Baixa parcial (N NFs por pedido)
Cada item da NF aponta para `pedido_item_id`. No save:
`pedido_item.qtd_recebida += nf_item.qtd_recebida`. Quando todos os itens do pedido têm
`qtd_recebida >= qtd`, o pedido vira `recebido` (ação de sistema, fora do validador);
senão, se ≥1 item tem recebimento parcial → `parcial`.

### 3. Conferência automática (qtd × preço)
Por item da NF comparado ao `pedido_item` correspondente:
- **Divergência de quantidade**: `nf_item.qtd_recebida > pedido_item.qtd − já_recebido_antes`
- **Divergência de preço**: `|nf_item.custo_unitario − pedido_item.custo_unitario| > 0,005`

Qualquer divergência → NF `divergente` (banner + badge). Não bloqueia: o usuário decide
se estorna. O total conferido usa os valores REAIS da NF (não os do pedido).

### 4. price_history com origin='compra'
Para cada item da NF com `material_id` preenchido:
- entrada `{ custo: nf_item.custo_unitario, custo_anterior, markup: 0, date, title: '<numero> · <forn>',
  origin: 'compra' }` via `store.updateMaterial(materialId, { custo }, { origin: 'compra', title, custoHistorico, custo_anterior })`
- `custo_anterior` (coluna nova em `price_history`) guarda o valor pré-compra para o estorno
  restaurar **exatamente** o catálogo
- Só grava se o custo difere do atual (evita spam de histórico idêntico)
- `updateMaterial` já propaga `priceHistory` ao servidor (db.js `update()`), que grava
  `price_history` em transação

### 5. DRE do projeto (projeto_custos)
Se a requisição tem `projeto_id`, cria/atualiza um `projeto_custos`:
- `tipo: 'real'`, `categoria: 'material'`, `origem: 'compra'`
- `descricao: '<numero> · <fornecedor>'` (ex.: `NF-0001 · Fornecedor Alpha`)
- `valor: nf.valor_total`, `data: nf.data_entrada || hoje`
- Um custo por NF (não por item) — a DRE soma por categoria.
- **Edição da NF atualiza** o lançamento existente (match por projeto + `origem='compra'` +
  `_mesmaNF(descricao, numero)`), nunca duplica; estorno remove só o lançamento daquela NF
  (match exato: `=== numero` ou `startsWith(numero + ' ·')` — `NF-00011` não casa com `NF-0001`).

### 6. UI — dentro do Pedido
- **Botão "Lançar NF"** no `renderPedido` (status ≠ cancelado)
- **Lista de NFs** do pedido (cards) com status/divergência
- **Modal/tela de NF**: cabeçalho (número, série, chave, datas, totais, transportadora)
  + tabela de itens pré-carregada do pedido, editando `qtd_recebida` e `custo_unitario`
- **Estornar NF** → devolve baixa e remove efeitos (price_history e projeto_custos da NF)

## Funções novas (js/compras.js)

| Função | Papel |
|---|---|
| `abrirNovaNF(pedidoId)` | cria staging da NF a partir dos itens do pedido |
| `renderNota()` | view da NF (cabeçalho + itens editáveis) |
| `setNotaCampo(c,v)` / `setNotaItemCampo(i,c,v)` | staging sem re-render |
| `salvarNota()` | grava NF + itens, baixa pedido, conferência, price_history, DRE |
| `estornarNota(notaId)` | reverte baixa e efeitos |
| `_notasDoPedido(pedidoId)` / `_nota(id)` / `_itensDaNota(notaId)` | leituras |
| `_conferirNota(nota, itens)` | computa status + divergências |
| `_baixarPedidoItem(pedidoItemId, qtd)` | incremento de `qtd_recebida` |
| `_atualizaStatusPedido(pedidoId)` | recalcula `parcial`/`recebido` |
| `_atualizaRequisicao(reqId)` | fecha o ciclo: `recebida` + `total_real` + `qtd_recebida` agregado |
| `_registrarPriceHistory(nfItem, nota, fornecedor)` | grava custo real |
| `_lancarCustoProjeto(payloadNota, nota)` | cria/atualiza `projeto_custos` da NF |
| `_mesmaNF(texto, numero)` | match exato de rótulo × número da NF |

## Schema (db.js — já existe, confirmar)
- `compras_notas`: numero, serie, chave_acesso, data_emissao, data_recebimento, data_entrada,
  valor_produtos, valor_frete, valor_desconto, valor_total, icms, ipi, pis, cofins,
  transportadora, volumes, conferida(0/1), conferida_por, conferida_em, status, observacoes
- `compras_nota_itens`: nota_id, pedido_item_id, material_id, codigo, descricao, unidade,
  qtd_recebida, custo_unitario, lote, data_validade, total

## Critério de aceite (Fase 4)
1. NF recebida baixa o pedido corretamente (parcial e total)
2. Divergência detectada (status `divergente` + banner)
3. `price_history` populada com `origin='compra'` e `materiais.custo` atualizado
4. DRE do projeto reflete o custo real de material (`projeto_custos` tipo='real') sem duplicar na edição da NF
5. Estorno reverte baixa, `price_history` (custo exato via `custo_anterior`) e o lançamento da DRE

**Status: ✅ concluída** — validada no browser (parcial, divergência, estorno, fechamento da
requisição e edição de NF) com 0 erros de console.
