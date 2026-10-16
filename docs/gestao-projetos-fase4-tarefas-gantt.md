# Gestão de Projetos — Fase 4: Tarefas por Fase (projeto_tarefas) + Refinamentos do Gantt

> Entregue em outubro/2026. Continua a Fase 2 (cronograma/Gantt com `projeto_fases`).

## O que a Fase 4 trouxe

1. **Nova entidade `projeto_tarefas`** — subtarefas organizadas por fase (padrão MS Project: a fase
   é a "tarefa resumo" e as tarefas aparecem indentadas sob ela).
2. **Tarefas no Gantt** — cada fase ganhou um chevron que expande/recolhe suas tarefas; cada tarefa
   é uma linha própria com barra de data, progresso, atraso e ações.
3. **Progresso agregado** — a fase COM tarefas tem o progresso calculado como a **média das tarefas**
   (materializado em `projeto_fases.progresso`, para a lista/resumo lerem o mesmo valor); fase SEM
   tarefas mantém o progresso manual, como antes.
4. **Refinamentos do Gantt** — destaque de **fim de semana** na régua de dias, botão **Tarefas**
   (mostrar/ocultar o nível de subtarefas), **Expandir/Recolher** tudo, contador "N fase(s) · M tarefa(s)"
   e chip "x/y tarefas" na linha da fase.

## Schema — `projeto_tarefas` (14 colunas + 2 índices)

| Coluna | Tipo | Observação |
|---|---|---|
| id / empresa_id | TEXT | PK + multiempresa (padrão do sistema) |
| projeto_id | TEXT | projeto dono |
| **fase_id** | TEXT | fase "mãe" (subtarefas por fase) |
| ordem | INTEGER | ordenação dentro da fase |
| nome / descricao / responsavel | TEXT | dados da tarefa |
| status | TEXT | `pendente \| em_andamento \| concluido \| bloqueada` — mesmas chaves de `projeto_fases` |
| data_inicio / data_fim | TEXT | ISO; barra no Gantt |
| progresso | INTEGER 0-100 | `concluido` força 100 (mesma regra das fases) |
| created_at / updated_at | TEXT | auditoria |

Índices: `(empresa_id)` e `(empresa_id, projeto_id, fase_id, ordem)`.

Integração completa e idempotente:
- `js/db.js`: `CREATE TABLE IF NOT EXISTS` no startup (migração automática em produção) + `TABLE_MAP`
  (`projetoTarefas`) + `getFullSync` + `restoreFromBackup` (genérico via TABLE_MAP).
- `server_new.js`: `projetoTarefas` em `validEntities` (CRUD schema-driven).
- `js/state.js`: `projetoTarefas` no estado inicial e no full sync; CRUD otimista com rollback
  (`add/update/deleteProjetoTarefa`) gerado pela fábrica das entidades — sufixo no **singular**
  para seguir a convenção `addProjetoFase`/`addProjetoCusto`.

## Comportamentos

- **Criar tarefa**: botão "+ tarefa" (hover na linha da fase) → modal (nome*, datas, status,
  progresso, responsável, descrição). A fase é expandida automaticamente para a nova tarefa aparecer.
- **Expandir fase**: chevron antes do ponto colorido (aparece só em fases com tarefas). A expansão
  persiste em `localStorage (gerapro_prj_gantt_exp)`.
- **Barra da tarefa**: arrastável (reprograma ± dias) e clique abre o modal de edição — mesmo
  mecanismo `barDown` das fases, agora com parâmetro `tipo`.
- **Progresso delegado**: qualquer criação/edição/toggle/exclusão de tarefa recalcula a média da fase
  e grava em `projeto_fases.progresso` (PUT no servidor). No modal da fase, o campo de progresso
  fica **desabilitado** com o aviso "calculado pelas tarefas" enquanto a fase tiver tarefas.
  Ao remover a última tarefa, o último valor calculado permanece como progresso manual.
- **Exclusão em cascata**: excluir fase pergunta sobre as tarefas ligadas; excluir projeto remove
  fases + tarefas + lançamentos da DRE.
- **Responsável**: exibido em `<small>` ao lado do nome da tarefa no Gantt.

## Validação (browser, dados reais, projeto temporário criado e removido no mesmo dia)

| # | Verificação | Resultado |
|---|---|---|
| 1 | Tabela criada no startup (14 colunas, 2 índices) | ✅ |
| 2 | Criar projeto pela UI → `PRJ-0001` | ✅ |
| 3 | Gerar Fases Padrão (confirm real) → 7 fases 15/10→16/12 | ✅ |
| 4 | Criar tarefa pela linha da fase → POST `projetoTarefas` 200, chip "0/1 tarefas" | ✅ |
| 5 | Segunda tarefa (progresso 50) → fase materializou 25% | ✅ |
| 6 | Toggle concluída → chip "1/2", fase 75%, fills 100%/50% | ✅ |
| 7 | Editar tarefa: prefill correto; `status concluido` força progresso 100 | ✅ |
| 8 | Reordenar (↓): ordem 1↔2 trocada no estado e no DOM | ✅ |
| 9 | Arrastar barra da tarefa +3 dias (pointer events) → 19→22/10 e 21→24/10 | ✅ |
| 10 | Escala dia: 72 células de dia, 20 de fim de semana, hoje "15 Q" destacado | ✅ |
| 11 | Botão Tarefas oculta/mostra o nível (0 linhas → 2 linhas) | ✅ |
| 12 | Expandir/Recolher tudo (estado e DOM sincronizados) | ✅ |
| 13 | Modal da fase: progresso travado com tarefas (valor 75), editável sem tarefas | ✅ |
| 14 | Excluir tarefa: confirm real → chip "1/1", fase 100% | ✅ |
| 15 | Excluir fase com tarefa: "…e 1 tarefa(s) ligada(s) a ela?" → cascade OK | ✅ |
| 16 | Lista: mini progresso "0/7 · 14%", badge 1; excluir projeto → cascade (0 linhas); console **0 erros**; `foreign_key_check` 0; limpeza total (4 tabelas zeradas) | ✅ |

## Arquivos

- `js/projetos.js` — `_tarefasDoProjeto/_tarefasDaFase/_recalcProgressoFase`, `_tarefaRowHTML`,
  `openTarefaModal/saveTarefa/toggleTarefa/moveTarefa/removeTarefa`,
  `toggleFaseExpandida/toggleExpandirTodas/toggleGanttTarefas`, `barDown` genérico, cascatas.
- `css/projetos.css` — seção "Fase 4" (chevron, chip, linhas/barras de tarefa, fds, botão ativo).
- `js/db.js`, `js/state.js`, `server_new.js` — schema/sync/API da nova entidade.
