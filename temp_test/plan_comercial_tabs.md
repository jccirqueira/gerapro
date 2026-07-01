# Implementation Plan: Proposta Comercial Tab Navigation

## Objetivo
Reestruturar a Proposta Comercial com menu horizontal de abas idêntico ao da Proposta Técnica.

## Abas Planejadas

| # | Aba | Conteúdo |
|---|---|---|
| 1 | **Dados Gerais** | Tudo de linha 196 a 310 (Cliente, Código, Datas, Projeto, Logos, Marca d'água) |
| 2 | **Escopo** | Linhas 312-337 (Descrição Fornecimento + Investimento + Impostos) |
| 3 | **Condições Comerciais** | Linhas 387-483 (Condições Detalhadas + Outras Condições) |
| 4 | **Assinaturas (Rodapé)** | Linhas 432-476 (3 blocos de assinatura) |

## Mudanças Necessárias

### propostaComercial.js

1. **Adicionar `activeTab` ao estado inicial** (já existe como `'geral'`)
2. **Adicionar `switchTab(tab)` method** — igual ao da Proposta Técnica
3. **Refatorar `renderModal`**:
   - Adicionar barra de tabs horizontal logo após o header
   - Separar conteúdo em 4 funções de renderização de aba:
     - `renderTabGeral(data)` — Dados Gerais
     - `renderTabEscopo(data)` — Escopo Comercial
     - `renderTabCondicoes(data)` — Condições Comerciais
     - `renderTabAssinaturas(data)` — Assinaturas
4. **Preservar toda lógica de captura de dados** (save, export)

## Seções mapeadas no arquivo atual:
- **Dados Gerais**: linhas 194-310 (form fields + logos)
- **Escopo**: linhas 312-384 (supply items + matriz resp + investimento + impostos)  
- **Condições Comerciais**: linhas 386-483 (condições detalhadas + outras condições)
- **Assinaturas**: linhas 432-476 (sig1, sig2, sig3)
