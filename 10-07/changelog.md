# Changelog — 10/07/2026

## Resumo Geral

Redesign visual completo do módulo CRM e do sistema de temas do GeraPro, inspirado no design system do Pipedrive. O foco foi exclusivamente visual (CSS e assets estáticos), sem alterações na lógica de negócio ou no backend.

---

## 1. Tipografia — Fonte Inter

**Arquivo:** `index.html`

- Adicionados preconnect links para Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
- Adicionado import da família Inter com pesos 450, 500, 600 e 700
- A Inter agora é a fonte padrão do sistema via `--font-family` no CSS

---

## 2. Design Tokens — `css/theme-industrial.css`

### 2.1 Escalas de Cores (10 passos cada)

Todas as escalas seguem o padrão Pipedrive: números mais baixos = mais claro, números mais altos = mais escuro.

| Escala | Uso principal | Exemplos |
|--------|---------------|----------|
| `neutral-0` a `neutral-1000` | Fundos, bordas, texto secundário | `neutral-50` (#f4f5f7), `neutral-500` (#93949a), `neutral-1000` (#21232c) |
| `blue-100` a `blue-1000` | Ações primárias, links, foco | `blue-500` (#5195f6), `blue-700` (#0d68c5) |
| `green-100` a `green-1000` | Sucesso, metas atingidas | `green-500` (#61a36b), `green-700` (#077838) |
| `red-100` a `red-1000` | Erro, perigo, prazos estourados | `red-500` (#f16a60), `red-700` (#c82627) |
| `yellow-100` a `yellow-1000` | Alerta, aviso, pendências | `yellow-500` (#cf8501), `yellow-700` (#945b00) |
| `purple-100` a `purple-1000` | Destaques secundários | `purple-500` (#9086fc), `purple-700` (#6150e1) |

### 2.2 Cores Semânticas

Variáveis que mapeiam as escalas para usos específicos:

- `--color-primary`, `--color-accent`, `--color-accent-hover`
- `--color-bg-app`, `--color-bg-panel`, `--color-bg-sidebar`, `--color-bg-header`, `--color-bg-hover`, `--color-bg-selected`
- `--color-text-primary`, `--color-text-main`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`, `--color-text-link`
- `--color-border`, `--color-border-strong`, `--color-divider`, `--color-divider-strong`
- `--color-success`, `--color-warning`, `--color-danger`

### 2.3 Tipografia

- `--font-family`: Inter como padrão com fallback para -apple-system, BlinkMacSystemFont, sans-serif
- `--font-weight-regular`: 450, `--font-weight-medium`: 500, `--font-weight-semibold`: 600, `--font-weight-bold`: 700
- Tamanhos: xs (11px), sm (13px), base (14px), lg (16px), xl (20px), 2xl (24px)

### 2.4 Spacing, Border Radius, Shadows, Transitions

| Categoria | Valores |
|-----------|---------|
| Spacing | 2xs (2px), xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px) |
| Border Radius | xs (2px), **sm (4px)**, md (8px), lg (12px), full (9999px) |
| Shadows | xs, sm, md, lg, xl — com cores baseadas no tema (rgba com opacidade) |
| Transitions | fast (0.1s), base (0.18s), slow (0.25s) |

---

## 3. Dark Mode — `[data-theme="dark"]`

Todas as escalas de cores têm versões dark mode completas:
- Fundos escuros (slate-900 como base)
- Cores neutras invertidas: `neutral-50` vira `#1e293b`, `neutral-900` vira `#f8fafc`
- Cores de ação (blue, green, red, yellow, purple) com versões mais claras para contraste
- Sombras mais pronunciadas (opacidade maior)
- `--color-accent` muda para `#3b82f6` (blue-400) para melhor legibilidade em fundo escuro

---

## 4. Estilos Globais e Utilitários

- `*`, `*::before`, `*::after` com `box-sizing: border-box`
- `body` com `-webkit-font-smoothing: antialiased` e `-moz-osx-font-smoothing: grayscale`
- Scrollbars personalizadas com cores das variáveis `neutral-*`
- Utilitários: `.text-xs`, `.text-sm`, `.text-base`, `.text-muted`, `.text-secondary`, `.font-medium`, `.font-semibold`, `.font-bold`, `.hidden`

---

## 5. Botões

**Alturas padronizadas (Pipedrive-style):**
- `.btn`: 32px (padrão), `.btn-sm`: 28px, `.btn-lg`: 42px, `.btn-xs`: 24px

**Variantes:**
| Classe | Descrição |
|--------|-----------|
| `.btn-primary` | Fundo azul (`--color-accent`), hover escurece |
| `.btn-secondary` | Outline com borda, hover com fundo neutro |
| `.btn-danger` | Fundo vermelho (`--color-danger`) |
| `.btn-ghost` | Transparente, mostra fundo no hover |
| `.btn-success` | Fundo verde (`--color-success`) |
| `.btn-warning` | Fundo amarelo |
| `.btn-outline` | Borda visível sem fundo |
| `.btn-cancel` | Fundo azul, hover vermelho (compatibilidade) |

- `gap: 6px` para ícones + texto
- `border-radius: var(--radius-sm)` (4px)
- `font-weight: var(--font-weight-semibold)`
- `transition` apenas em `background-color` e `box-shadow`

---

## 6. Form Controls

- `.form-label`: 11px, uppercase, semibold, secondary color
- `.form-control`: padding 8px 12px, font-size 13px, Inter, border-radius 4px
- **Focus ring**: `box-shadow: 0 0 0 3px rgba(81, 149, 246, .15)` (Pipedrive-style blue glow)
- Placeholder com `neutral-400`
- `select.form-control` mantém `appearance: auto`

---

## 7. Tabs (Underline Style — Pipedrive)

**Três sistemas de tabs foram convertidos para o padrão underline:**

| Sistema | Localização |
|---------|-------------|
| `.tab-btn` | Tabs gerais (ex: configurações) |
| `.crm-tab` | Tabs do módulo CRM (header) |
| `.crm-modal-tab` | Tabs internas dos modais CRM |

**Padrão comum:**
- Borda inferior de 2px — transparent quando inativa, `blue-600` quando ativa
- Padding: 10px vertical, 16-20px horizontal
- Cor: `text-secondary` → `text-primary` no hover → `blue-600` no active
- Sem background no estado ativo (apenas a underline)
- Container `.crm-tabs` e `.crm-modal-tabs` com `border-bottom: 1px solid divider`

---

## 8. Modais

### 8.1 Modais Gerais (`.modal-overlay`, `.modal`)

- Fundo overlay: `rgba(0,0,0,0.5)`
- Modal: `var(--color-bg-panel)`, borda `divider`, shadow `lg`
- Header: padding 16px, divider, sem background
- Footer: sem background, gap entre botões

### 8.2 Modais CRM (`.crm-modal-*`)

- `.crm-modal`: shadow `lg`, borda `divider`, animação `crmModalIn`
- `.crm-modal-header`: padding 16px 20px, `h3` com semibold
- `.crm-modal-close`: botão ghost com hover neutro
- `.crm-modal-body`: padding 20px, max-height 70vh

---

## 9. Painéis e Cards

### 9.1 Cards Gerais (`.card`)

- Borda: `divider`, shadow: `xs`, radius: `sm`
- `card-title`: `text-primary`, `semibold`

### 9.2 Painéis CRM (`.crm-panel`)

- Borda: `divider`, shadow: `xs`, radius: `md`
- Header sem background (transparente), divider abaixo
- Body padding: 16px

### 9.3 Lead Cards (`.crm-lead-card`)

- Borda: `divider`, shadow: `xs`, hover: shadow `sm` + borda `neutral-300`
- Margin bottom: 8px, padding: 10px 12px
- Divisores internos com `divider`

---

## 10. Kanban (`.crm-kanban-*`)

- Colunas com `neutral-50`, borda `divider`, radius `md`
- Header com borda inferior de 3px colorida (por estágio)
- Contador com `neutral-200`, semibold
- Cartões seguem o padrão `.crm-lead-card`

---

## 11. Tabelas

### 11.1 Tabelas Gerais

- Container com borda `divider`, fundo `bg-panel`
- `th`: uppercase, 11px, semibold, `text-secondary`, sticky top
- `td`: padding 8px 12px, `text-primary`, divider sutil
- Hover: `neutral-50`

### 11.2 Tabelas CRM (`.crm-table`)

- `th`: 11px, uppercase, semibold, `text-secondary`
- `td`: padding 10px 12px
- Hover: `neutral-50`

---

## 12. Scores e Badges

### Score (`.crm-score`)

- Círculo/ badge com cores das escalas: alto = `green-600`, médio = `yellow-500`, baixo = `red-600`
- Critérios com `checkmark` em `green-600`

### Status Badge (`.crm-status-badge`, `.status-*`)

- `.status-green`, `.status-blue`, `.status-gray`, `.status-danger`
- Cores atualizadas para usar `green-*`, `blue-*`, `neutral-*`, `red-*`

---

## 13. Componentes CRM Específicos

### Interação Card (`.crm-interacao-card`)

- Fundo: `neutral-50`, borda esquerda de 3px
- Tipos com cores temáticas: ligação (blue), email (purple), whatsapp (green), reunião (yellow), visita (blue)
- Anexos com borda e hover

### Tarefa Card (`.crm-tarefa-card`)

- Borda esquerda colorida por estado: late (danger), hoje (warning)
- Fundo: `bg-panel`, borda: `divider`
- Tipo com badge neutro

### Relatórios (`.crm-bar-*`)

- Fundo da barra: `neutral-200`, fill: `blue-500`

### Calendário (`.crm-cal-*`)

- Grid 7 colunas
- Dias com fundo `bg-panel`, hover `neutral-50`
- Hoje: `blue-50` + borda `blue-400`
- Selecionado: `blue-100` + borda `blue-600` + shadow
- Badges: tarefa (yellow), followup (blue)

### Empty State

- Padding aumentado (60px), ícone maior (48px), opacidade menor (.2)

---

## 14. Ajuda System

- Overlay: `rgba(0,0,0,0.6)`
- Modal: fundo `bg-panel`, borda `divider`, shadow `xl`
- Sidebar: `neutral-50`, items com hover `neutral-100`, active com `green-*`
- Search input: focus ring azul padronizado
- Campos de destaque: borda esquerda `green-600`
- Footer: `neutral-50`
- Cores de código inline: `red-600`
- Responsivo: mobile com largura total

---

## 15. Paginação

- Botões com `text-primary`, hover `neutral-100`
- Active: fundo `text-primary`, texto `bg-panel` (invertido)
- Ellipsis: `neutral-400`

---

## 16. Dark Mode — Cobertura Completa

Todas as seções acima funcionam em dark mode porque usam exclusivamente variáveis CSS que são redefinidas no bloco `[data-theme="dark"]`:

- Fundos: `bg-app` (#0f172a), `bg-panel` (#1e293b), `bg-sidebar` (#020617)
- Textos: `text-primary` (#f1f5f9), `text-secondary` (#94a3b8), `text-muted` (#64748b)
- Bordas: `divider` (rgba branco 12%), `divider-strong` (rgba branco 24%)
- Sombras mais pronunciadas (opacidade maior)
- Cores de ação invertidas (ex: `blue-500` = #60a5fa em dark mode)

---

## Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `index.html` | Adicionado preconnect + font import |
| `css/theme-industrial.css` | Reescrevido ~90% do arquivo com novos tokens e componentes |

---

## O que NÃO foi alterado

- Nenhuma lógica JavaScript (`app.js`, `crm.js`, etc.)
- Nenhuma rota ou endpoint do servidor
- Nenhuma estrutura de banco de dados
- Nenhum HTML de templates inline (JS) — apenas o CSS foi alterado
- A funcionalidade existente permanece idêntica

---

## Próximos Passos Sugeridos

1. **Testar visual em telas reais** — verificar contraste, espaçamento e responsividade
2. **Ajustar templates inline no `crm.js`** — se houver classes CSS hardcoded que precisem ser atualizadas
3. **Adicionar animações de transição** entre estados (ex: hover em cards, foco em inputs)
4. **Revisar ícones** — considerar migrar para um conjunto mais moderno (Lucide ou Phosphor)
5. **Testar dark mode** em todos os componentes
