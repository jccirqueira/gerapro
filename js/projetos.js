import { store } from './state.js';

/**
 * GESTÃO DE PROJETOS
 * Módulo criado automaticamente quando uma proposta do Pipeline é "Fechada" (ganha).
 * Fase 1: entidade + gancho "fechado" + sidebar + visões lista/detalhe.
 * Fase 2: cronograma/Gantt com a entidade projeto_fases.
 * Fase 3: DRE Estimado x Real com a entidade projeto_custos.
 * Fase 4: subtarefas por fase (projeto_tarefas) + refinamentos do Gantt.
 */

const STATUS = {
    em_andamento: 'Em Andamento',
    pausado: 'Pausado',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
};

/* Fase 2 — Fases do cronograma (entidade projeto_fases) */
const FASE_STATUS = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluída',
    bloqueada: 'Bloqueada'
};

/* Cor padrão por status (usada quando a fase não tem cor própria) */
const FASE_CORES = {
    pendente: '#94A3B8',
    em_andamento: '#6366F1',
    concluido: '#10B981',
    bloqueada: '#EF4444'
};

/* Fase 4 — Subtarefas (projeto_tarefas): mesmos status/chaves das fases */
const TAREFA_STATUS = { ...FASE_STATUS };
const TAREFA_CORES = { ...FASE_CORES };

/* Modelo padrão de fases — configurável pelo usuário (persistido em localStorage) */
const FASES_PADRAO = [
    { nome: 'Planejamento e Engenharia', dias: 10, cor: '#6366F1' },
    { nome: 'Compras e Suprimentos', dias: 15, cor: '#0EA5E9' },
    { nome: 'Manufatura e Montagem', dias: 30, cor: '#8B5CF6' },
    { nome: 'Testes e QA', dias: 10, cor: '#10B981' },
    { nome: 'Logística e Entrega', dias: 7, cor: '#F59E0B' },
    { nome: 'Instalação e Comissionamento', dias: 10, cor: '#EC4899' },
    { nome: 'Aceite e Entrega Final', dias: 5, cor: '#64748B' }
];

const GANTT_ZOOM = { auto: 0, dia: 22, semana: 8, mes: 3 };

/* ================================================================
   FASE 3 — DRE ESTIMADO × REAL (entidade projeto_custos)
   Cada lançamento aponta para uma categoria. `valor` é sempre
   positivo — o sinal da linha é definido por `sinal` aqui.
   `maiorMelhor`: se o REAL maior que o ESTIMADO é bom (receita)
   ou ruim (custos/despesas) — usado para colorir a variação.
   ================================================================ */
const DRE_CATEGORIAS = [
    { key: 'receita',          label: 'Receita Bruta',          sinal: '+', grupo: 'receita',      maiorMelhor: true,  icone: 'ph-trend-up' },
    { key: 'impostos',         label: 'Impostos sobre Vendas',  sinal: '−', grupo: 'deducoes',     maiorMelhor: false, icone: 'ph-percent' },
    { key: 'material',         label: 'Materiais',              sinal: '−', grupo: 'custos',       maiorMelhor: false, icone: 'ph-cube' },
    { key: 'mo',               label: 'Mão de Obra',            sinal: '−', grupo: 'custos',       maiorMelhor: false, icone: 'ph-users-three' },
    { key: 'despesas_diretas', label: 'Despesas Diretas',       sinal: '−', grupo: 'custos',       maiorMelhor: false, icone: 'ph-wrench' },
    { key: 'subcontratacao',   label: 'Subcontratação',         sinal: '−', grupo: 'custos',       maiorMelhor: false, icone: 'ph-handshake' },
    { key: 'custos_fixos',     label: 'Custos Fixos / Admin.',  sinal: '−', grupo: 'operacionais', maiorMelhor: false, icone: 'ph-buildings' },
    { key: 'comissao',         label: 'Comissão de Vendas',     sinal: '−', grupo: 'operacionais', maiorMelhor: false, icone: 'ph-badge-percent' },
    { key: 'viagens',          label: 'Viagens e Hospedagem',   sinal: '−', grupo: 'operacionais', maiorMelhor: false, icone: 'ph-airplane-tilt' },
    { key: 'frete',            label: 'Frete e Logística',      sinal: '−', grupo: 'operacionais', maiorMelhor: false, icone: 'ph-truck' },
    { key: 'outras',           label: 'Outras Despesas',        sinal: '−', grupo: 'operacionais', maiorMelhor: false, icone: 'ph-dots-three' }
];

const DRE_GRUPOS = {
    receita:      'Receita',
    deducoes:     '(−) Deduções sobre Vendas',
    custos:       '(−) Custos Diretos',
    operacionais: '(−) Despesas Operacionais'
};

/* Subtotais encadeados da DRE, na ordem em que aparecem */
const DRE_SUBTOTAIS = [
    { grupo: 'deducoes',     label: 'RECEITA LÍQUIDA', campos: ['receitaBruta', '-deducoes'] },
    { grupo: 'custos',       label: 'LUCRO BRUTO',     campos: ['receitaLiquida', '-custosDiretos'] },
    { grupo: 'operacionais', label: 'LUCRO LÍQUIDO',   campos: ['lucroBruto', '-despesasOpers'], destaque: true }
];

/* Percentuais usados para semear o ESTIMADO — espelham os defaults
   de precificacao.js (getDefaultPricingData). Editáveis depois. */
const DRE_SEED_PADRAO = {
    impostos:     21.25,  // ICMS 12% + PIS/COFINS 9,25% (Lucro Real)
    impostosSN:   4,      // DAS — Simples Nacional
    custos_fixos: 8,
    comissao:     5
};

const ProjetosModule = {
    _active: false,
    viewMode: 'list',       // 'list' | 'detail'
    activeId: null,
    activeTab: 'info',      // 'info' | 'cronograma' | 'dre'
    searchQuery: '',
    statusFilter: '',
    ganttZoom: 'auto',   // 'auto' | 'dia' | 'semana' | 'mes'
    ganttTarefas: localStorage.getItem('gerapro_prj_gantt_tarefas') !== '0', // Fase 4: subtarefas visíveis no Gantt
    ganttExpandido: (() => { try { return JSON.parse(localStorage.getItem('gerapro_prj_gantt_exp') || '[]'); } catch (e) { return []; } })(), // fases expandidas

    init() {
        window.projetosModule = this;
        window.app = window.app || {};
        window.app.projetos = {
            render: this.render.bind(this),
            resetView: this.resetView.bind(this),
            openDetail: this.openDetail.bind(this),
            backToList: this.backToList.bind(this),
            switchTab: this.switchTab.bind(this),
            filter: this.filter.bind(this),
            openModal: this.openModal.bind(this),
            save: this.save.bind(this),
            remove: this.remove.bind(this),
            changeStatus: this.changeStatus.bind(this),
            importFromPipeline: this.importFromPipeline.bind(this),
            createFromPipeline: this.createFromPipeline.bind(this),
            // Fase 2 — Cronograma / Gantt
            openFaseModal: this.openFaseModal.bind(this),
            saveFase: this.saveFase.bind(this),
            removeFase: this.removeFase.bind(this),
            toggleFase: this.toggleFase.bind(this),
            moveFase: this.moveFase.bind(this),
            seedFases: this.seedFases.bind(this),
            openTemplateModal: this.openTemplateModal.bind(this),
            saveTemplate: this.saveTemplate.bind(this),
            resetTemplate: this.resetTemplate.bind(this),
            barDown: this.barDown.bind(this),
            setZoom: this.setZoom.bind(this),
            exportarCronogramaPDF: this.exportarCronogramaPDF.bind(this),
            exportarCronogramaXLSX: this.exportarCronogramaXLSX.bind(this),
            _addTplRow: this._addTplRow.bind(this),
            // Fase 3 — DRE Estimado × Real
            openCustoModal: this.openCustoModal.bind(this),
            saveCusto: this.saveCusto.bind(this),
            removeCusto: this.removeCusto.bind(this),
            seedEstimado: this.seedEstimado.bind(this),
            exportDreXLSX: this.exportDreXLSX.bind(this),
            // Fase 4 — Subtarefas por fase (projeto_tarefas)
            openTarefaModal: this.openTarefaModal.bind(this),
            saveTarefa: this.saveTarefa.bind(this),
            toggleTarefa: this.toggleTarefa.bind(this),
            moveTarefa: this.moveTarefa.bind(this),
            removeTarefa: this.removeTarefa.bind(this),
            toggleFaseExpandida: this.toggleFaseExpandida.bind(this),
            toggleExpandirTodas: this.toggleExpandirTodas.bind(this),
            toggleGanttTarefas: this.toggleGanttTarefas.bind(this)
        };

        store.subscribe((state) => {
            if (this._active && !this._seeding) {
                if (this.viewMode === 'detail' && this.activeId) {
                    const exists = (state.projetos || []).some(p => p.id === this.activeId);
                    if (!exists) this.backToList();
                    else this.renderDetail();
                } else {
                    this.renderList();
                }
            }
            this.updateBadge();
        });

        this.updateBadge();
        console.log('[Projetos] Module initialized.');
    },

    resetView() {
        this._active = false;
        this.viewMode = 'list';
        this.activeId = null;
        this.activeTab = 'info';
        this.searchQuery = '';
        this.statusFilter = '';
    },

    updateBadge() {
        const badge = document.getElementById('projetos-badge');
        if (!badge) return;
        const state = store.getState();
        const count = (state.projetos || []).filter(p => p.status === 'em_andamento').length;
        badge.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    },

    /* ================================================================
       GANCHO — chamado pelo Pipeline quando um cartão vira "Fechado"
       ================================================================ */

    async createFromPipeline(item, opts = {}) {
        if (!item) return null;
        const state = store.getState();
        const projetos = state.projetos || [];

        // Deduplicação: uma proposta (origemId) gera um único projeto
        const chave = (item.origemId || item.id || '').toString().trim().toLowerCase();
        if (chave) {
            const existente = projetos.find(p => ((p.origem_id || '').toString().trim().toLowerCase()) === chave);
            if (existente) return existente;
        }

        const now = new Date().toISOString();
        const payload = {
            id: crypto.randomUUID(),
            codigo: this._nextCodigo(projetos),
            pipeline_item_id: item.id || '',
            origem: item.origem || 'pipeline',
            origem_id: item.origemId || item.id || '',
            cliente: item.cliente || '',
            projeto: item.projeto || '',
            descricao: '',
            status: 'em_andamento',
            fase_atual: '',
            responsavel: '',
            vendedor: item.vendedor || '',
            engenheiro_responsavel: item.engenheiro_responsavel || '',
            valor_contrato: parseFloat(item.valor) || 0,
            data_inicio: now.slice(0, 10),
            data_prevista_entrega: this._isoDateFromBR(item.data_entrega),
            data_entrega_real: '',
            observacoes: '',
            created_at: now,
            updated_at: now
        };

        const criado = await store.addProjeto(payload);
        if (criado && !opts.silent) {
            window.app.toast(`Projeto ${criado.codigo} criado a partir da proposta ganha.`, 'success');
        }
        if (this._active) this.render();
        return criado;
    },

    async importFromPipeline() {
        const state = store.getState();
        const fechados = (state.pipelineItems || []).filter(i => i.status === 'fechado');
        if (fechados.length === 0) {
            window.app.toast('Nenhuma proposta fechada encontrada no pipeline.', 'info');
            return;
        }
        let criados = 0;
        let jaImportados = 0;
        const falhas = [];
        for (const item of fechados) {
            const antes = (store.getState().projetos || []).length;
            let r = null;
            try {
                r = await this.createFromPipeline(item, { silent: true });
            } catch (e) {
                falhas.push(`${item.cliente || item.origemId || item.id}: ${e.message}`);
                continue;
            }
            // r === null => a gravação no servidor falhou (createFromPipeline faz rollback)
            if (!r) {
                falhas.push(`${item.cliente || item.origemId || item.id}: não foi possível gravar no servidor`);
            } else if ((store.getState().projetos || []).length > antes) {
                criados++;
            } else {
                // retornou um projeto já existente (deduplicação por origem_id)
                jaImportados++;
            }
        }
        if (falhas.length > 0) {
            window.app.toast(
                `Falha ao importar ${falhas.length} proposta(s): ${falhas[0]}${falhas.length > 1 ? ' (e outras)' : ''}. ` +
                `Verifique a conexão e recarregue a página (Ctrl+F5) para atualizar o sistema.`,
                'error'
            );
        }
        if (criados > 0) {
            window.app.toast(`${criados} projeto(s) criado(s) a partir das propostas fechadas.`, 'success');
        } else if (falhas.length === 0) {
            window.app.toast(
                jaImportados > 0
                    ? `${jaImportados} proposta(s) fechada(s) já estavam importadas — nenhum projeto novo.`
                    : 'Todos os projetos já estão importados.',
                'info'
            );
        }
        this.render();
    },

    _nextCodigo(projetos) {
        let max = 0;
        projetos.forEach(p => {
            const m = String(p.codigo || '').match(/(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'PRJ-' + String(max + 1).padStart(4, '0');
    },

    _isoDateFromBR(v) {
        if (!v) return '';
        const s = String(v).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        const m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
    },

    /* ================================================================
       NAVEGAÇÃO
       ================================================================ */

    render() {
        this._active = true;
        if (this.viewMode === 'detail' && this.activeId) this.renderDetail();
        else this.renderList();
    },

    openDetail(id) {
        this.activeId = id;
        this.viewMode = 'detail';
        this.activeTab = 'info';
        this.render();
    },

    backToList() {
        this.viewMode = 'list';
        this.activeId = null;
        this.activeTab = 'info';
        this.render();
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.renderDetail();
    },

    filter(kind, value) {
        if (kind === 'search') this.searchQuery = value || '';
        if (kind === 'status') this.statusFilter = value || '';
        // Re-render apenas a área de resultados para não perder o foco do input de busca
        const box = document.getElementById('prj-results');
        if (box) box.innerHTML = this._resultsHTML((store.getState().projetos || []).length);
        else this.renderList();
    },

    _getProjetos() {
        const state = store.getState();
        let items = [...(state.projetos || [])];
        const q = this.searchQuery.trim().toLowerCase();
        if (q) {
            items = items.filter(p =>
                (p.codigo || '').toLowerCase().includes(q) ||
                (p.cliente || '').toLowerCase().includes(q) ||
                (p.projeto || '').toLowerCase().includes(q)
            );
        }
        if (this.statusFilter) items = items.filter(p => p.status === this.statusFilter);
        items.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
        return items;
    },

    /* ================================================================
       VIEW — LISTA
       ================================================================ */

    renderList() {
        const container = document.getElementById('view-projetos');
        if (!container) return;

        const all = store.getState().projetos || [];
        const items = this._getProjetos();

        const total = all.length;
        const emAndamento = all.filter(p => p.status === 'em_andamento').length;
        const concluidos = all.filter(p => p.status === 'concluido').length;
        const valorTotal = all.reduce((s, p) => s + (parseFloat(p.valor_contrato) || 0), 0);

        container.innerHTML = `
            <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <div>
                        <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                            <i class="ph ph-folder"></i> Cronograma / DRE
                        </h2>
                        <div style="font-size:12px;opacity:0.9;margin-top:2px;">Projetos originados em propostas ganhas (Fechado).</div>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.projetos.importFromPipeline()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Criar projetos para propostas já fechadas">
                            <i class="ph ph-arrows-clockwise"></i> Importar Fechadas
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="app.projetos.openModal()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-plus"></i> Novo Projeto
                        </button>
                    </div>
                </div>
                <div class="prj-body">
                    <div class="prj-summary">
                        <div class="prj-card"><div class="prj-card-value">${total}</div><div class="prj-card-label">Total de Projetos</div></div>
                        <div class="prj-card"><div class="prj-card-value">${emAndamento}</div><div class="prj-card-label">Em Andamento</div></div>
                        <div class="prj-card"><div class="prj-card-value">${concluidos}</div><div class="prj-card-label">Concluídos</div></div>
                        <div class="prj-card"><div class="prj-card-value">${window.app.formatCurrency(valorTotal)}</div><div class="prj-card-label">Valor Contratado</div></div>
                    </div>

                    <div class="prj-toolbar">
                        <div class="prj-search">
                            <i class="ph ph-magnifying-glass"></i>
                            <input type="text" placeholder="Buscar por código, cliente ou projeto..." value="${this._esc(this.searchQuery)}"
                                oninput="app.projetos.filter('search', this.value)">
                        </div>
                        <select class="prj-filter" onchange="app.projetos.filter('status', this.value)">
                            <option value="" ${this.statusFilter === '' ? 'selected' : ''}>Todos os status</option>
                            ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${this.statusFilter === k ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                        <span class="prj-count" id="prj-count">${items.length} de ${total} projeto(s)</span>
                    </div>

                    <div id="prj-results">${this._resultsHTML(total)}</div>
                </div>
            </div>
        `;
    },

    _resultsHTML(total) {
        const items = this._getProjetos();
        const count = document.getElementById('prj-count');
        if (count) count.textContent = `${items.length} de ${total} projeto(s)`;

        if (items.length === 0) return this._emptyStateHTML(total);
        return `
                    <div class="prj-table-wrap">
                        <table class="prj-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Cliente</th>
                                    <th>Projeto</th>
                                    <th>Status</th>
                                    <th style="width:130px">Cronograma</th>
                                    <th style="text-align:right">Valor Contrato</th>
                                    <th>Início</th>
                                    <th>Entrega Prev.</th>
                                    <th style="text-align:right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(p => `
                                    <tr onclick="app.projetos.openDetail('${p.id}')">
                                        <td class="prj-codigo">${this._esc(p.codigo)}</td>
                                        <td>
                                            <div class="prj-cliente">${this._esc(p.cliente) || '—'}</div>
                                            <div class="prj-sub">${this._esc(p.vendedor) || ''}</div>
                                        </td>
                                        <td>${this._esc(p.projeto) || '<span class="prj-sub">—</span>'}</td>
                                        <td><span class="prj-badge ${this._esc(p.status)}">${STATUS[p.status] || this._esc(p.status)}</span></td>
                                        <td>${this._progressoMiniHTML(p.id)}</td>
                                        <td class="prj-valor">${window.app.formatCurrency(p.valor_contrato || 0)}</td>
                                        <td class="prj-datas">${this._fmtDate(p.data_inicio)}</td>
                                        <td class="prj-datas">${this._fmtDate(p.data_prevista_entrega)}</td>
                                        <td class="prj-actions" onclick="event.stopPropagation()">
                                            <button onclick="app.projetos.openDetail('${p.id}')" title="Abrir"><i class="ph ph-arrow-square-out"></i></button>
                                            <button onclick="app.projetos.openModal('${p.id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                                            <button class="prj-danger" onclick="app.projetos.remove('${p.id}')" title="Excluir"><i class="ph ph-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`;
    },

    _emptyStateHTML(total) {
        if (total === 0) {
            return `
                <div class="prj-empty-state">
                    <i class="ph ph-folder"></i>
                    <h3>Nenhum projeto ainda</h3>
                    <p>Quando uma proposta do <strong>Gestão de Propostas</strong> for movida para <strong>Fechado</strong>, o projeto é criado automaticamente aqui.</p>
                    <button class="btn btn-primary" onclick="app.projetos.importFromPipeline()"><i class="ph ph-arrows-clockwise"></i> Importar propostas já fechadas</button>
                </div>`;
        }
        return `
            <div class="prj-empty-state">
                <i class="ph ph-magnifying-glass"></i>
                <h3>Nenhum resultado</h3>
                <p>Nenhum projeto corresponde aos filtros aplicados.</p>
            </div>`;
    },

    /* ================================================================
       VIEW — DETALHE
       ================================================================ */

    renderDetail() {
        const container = document.getElementById('view-projetos');
        if (!container) return;
        const p = (store.getState().projetos || []).find(x => x.id === this.activeId);
        if (!p) { this.backToList(); return; }

        container.innerHTML = `
            <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.projetos.backToList()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                        <div>
                            <h2 style="margin:0;font-size:18px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-folder"></i> ${this._esc(p.codigo)}
                                <span class="prj-badge ${this._esc(p.status)}">${STATUS[p.status] || this._esc(p.status)}</span>
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">${this._esc(p.cliente)}${p.projeto ? ' — ' + this._esc(p.projeto) : ''}</div>
                        </div>
                    </div>
                    <div class="prj-detail-actions">
                        <select class="prj-filter" onchange="app.projetos.changeStatus('${p.id}', this.value)" title="Alterar status">
                            ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                        <button class="btn btn-sm btn-ghost" onclick="app.projetos.openModal('${p.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-pencil-simple"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="app.projetos.remove('${p.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-trash"></i> Excluir
                        </button>
                    </div>
                </div>

                <div class="prj-body">
                    <div class="prj-detail-head">
                        <div class="prj-detail-top">
                            <div>
                                <div class="prj-info-label">Projeto</div>
                                <div style="font-size:17px;font-weight:700;color:#1a1d23;margin-top:4px;">${this._esc(p.projeto) || '<span class="prj-info-value prj-empty">Sem título</span>'}</div>
                                <div class="prj-detail-sub">Código ${this._esc(p.codigo)} · Criado em ${this._fmtDate(p.created_at)}</div>
                            </div>
                            <div style="text-align:right">
                                <div class="prj-info-label">Valor do Contrato</div>
                                <div style="font-size:24px;font-weight:800;color:#4F46E5;margin-top:4px;">${window.app.formatCurrency(p.valor_contrato || 0)}</div>
                            </div>
                        </div>

                        <div class="prj-grid">
                            <div class="prj-info"><div class="prj-info-label">Cliente</div><div class="prj-info-value">${this._esc(p.cliente) || '<span class="prj-empty">Não informado</span>'}</div></div>
                            <div class="prj-info"><div class="prj-info-label">Vendedor</div><div class="prj-info-value">${this._esc(p.vendedor) || '<span class="prj-empty">Não informado</span>'}</div></div>
                            <div class="prj-info"><div class="prj-info-label">Engenheiro Responsável</div><div class="prj-info-value">${this._esc(p.engenheiro_responsavel) || '<span class="prj-empty">Não informado</span>'}</div></div>
                            <div class="prj-info"><div class="prj-info-label">Responsável pelo Projeto</div><div class="prj-info-value">${this._esc(p.responsavel) || '<span class="prj-empty">Não informado</span>'}</div></div>
                            <div class="prj-info"><div class="prj-info-label">Data de Início</div><div class="prj-info-value">${this._fmtDate(p.data_inicio) || '<span class="prj-empty">Não informada</span>'}</div></div>
                            <div class="prj-info"><div class="prj-info-label">Entrega Prevista</div><div class="prj-info-value">${this._fmtDate(p.data_prevista_entrega) || '<span class="prj-empty">Não informada</span>'}</div></div>
                            <div class="prj-info"><div class="prj-info-label">Entrega Real</div><div class="prj-info-value">${this._fmtDate(p.data_entrega_real) || '<span class="prj-empty">Não informada</span>'}</div></div>
                            <div class="prj-info"><div class="prj-info-label">Origem</div><div class="prj-info-value">${this._origemLabel(p)}</div></div>
                        </div>
                    </div>

                    <div class="prj-tabs">
                        <button class="prj-tab ${this.activeTab === 'info' ? 'active' : ''}" onclick="app.projetos.switchTab('info')">
                            <i class="ph ph-info"></i> Informações
                        </button>
                        <button class="prj-tab ${this.activeTab === 'cronograma' ? 'active' : ''}" onclick="app.projetos.switchTab('cronograma')">
                            <i class="ph ph-calendar-blank"></i> Cronograma
                        </button>
                        <button class="prj-tab ${this.activeTab === 'dre' ? 'active' : ''}" onclick="app.projetos.switchTab('dre')">
                            <i class="ph ph-currency-circle-dollar"></i> DRE
                        </button>
                    </div>

                    ${this._tabContent(p)}
                </div>
            </div>
        `;
    },

    _tabContent(p) {
        if (this.activeTab === 'cronograma') {
            return this._cronogramaHTML(p);
        }
        if (this.activeTab === 'dre') {
            return this._dreHTML(p);
        }
        return `
            <div class="prj-detail-head" style="margin-bottom:0;">
                <div class="prj-info-label">Descrição</div>
                <div class="prj-info-value" style="white-space:pre-wrap;line-height:1.6;">${this._esc(p.descricao) || '<span class="prj-empty">Sem descrição</span>'}</div>

                <div class="prj-info-label" style="margin-top:18px;">Fase Atual</div>
                <div class="prj-info-value">${this._esc(p.fase_atual) || '<span class="prj-empty">Não informada</span>'}</div>

                <div class="prj-info-label" style="margin-top:18px;">Observações</div>
                <div class="prj-info-value" style="white-space:pre-wrap;line-height:1.6;">${this._esc(p.observacoes) || '<span class="prj-empty">Sem observações</span>'}</div>
            </div>`;
    },

    _origemLabel(p) {
        const tipo = { ptc: 'Proposta Técnica', proposta_comercial: 'Proposta Comercial', tecnica_comercial: 'Proposta Completa', orcamento: 'Orçamento' }[p.origem] || 'Pipeline';
        const base = p.origem_id ? (window.app.formatProposalCode ? window.app.formatProposalCode(p.origem_id) : p.origem_id) : '';
        return base ? `${tipo} — <span style="color:#4F46E5">${this._esc(base)}</span>` : tipo;
    },

    /* ================================================================
       FASE 3 — DRE ESTIMADO × REAL (entidade projeto_custos)
       ================================================================ */

    _custosDoProjeto(projetoId, tipo) {
        const custos = (store.getState().projetoCustos || [])
            .filter(c => c.projeto_id === projetoId && (!tipo || c.tipo === tipo));
        custos.sort((a, b) => String(a.data || '').localeCompare(String(b.data || ''))
            || String(a.created_at || '').localeCompare(String(b.created_at || '')));
        return custos;
    },

    /* Soma o valor de cada categoria para um lado ('estimado' | 'real') */
    _drePorCategoria(projetoId, tipo) {
        const totais = {};
        DRE_CATEGORIAS.forEach(c => { totais[c.key] = 0; });
        this._custosDoProjeto(projetoId, tipo).forEach(c => {
            const k = DRE_CATEGORIAS.some(x => x.key === c.categoria) ? c.categoria : 'outras';
            totais[k] += Math.abs(Number(c.valor) || 0);
        });
        return totais;
    },

    /* Soma um subtotal a partir de campos do mapa calculado ('-campo' subtrai) */
    _dreAvaliar(c, campos) {
        return campos.reduce((s, f) => {
            const neg = f.startsWith('-');
            const v = Number(c[neg ? f.slice(1) : f]) || 0;
            return s + (neg ? -v : v);
        }, 0);
    },

    /* Subtotais encadeados da DRE a partir do mapa de categorias */
    _dreCalculo(t) {
        const receitaBruta   = t.receita || 0;
        const deducoes       = t.impostos || 0;
        const receitaLiquida = receitaBruta - deducoes;
        const custosDiretos  = (t.material || 0) + (t.mo || 0) + (t.despesas_diretas || 0) + (t.subcontratacao || 0);
        const lucroBruto     = receitaLiquida - custosDiretos;
        const despesasOpers  = (t.custos_fixos || 0) + (t.comissao || 0) + (t.viagens || 0) + (t.frete || 0) + (t.outras || 0);
        const lucroLiquido   = lucroBruto - despesasOpers;
        const margem         = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
        return { receitaBruta, deducoes, receitaLiquida, custosDiretos, lucroBruto, despesasOpers, lucroLiquido, margem };
    },

    /* Coluna de variação — cor verde quando o desvio é favorável */
    _dreDeltaHTML(est, real, maiorMelhor) {
        const delta = real - est;
        if (Math.abs(delta) < 0.005) return `<span class="prj-dre-delta neutro">—</span>`;
        const bom = maiorMelhor ? delta > 0 : delta < 0;
        const pct = Math.abs(est) > 0.005
            ? `<small> (${delta > 0 ? '+' : '−'}${Math.abs((delta / Math.abs(est)) * 100).toFixed(1)}%)</small>`
            : '';
        return `<span class="prj-dre-delta ${bom ? 'bom' : 'ruim'}">${delta > 0 ? '+' : '−'}${window.app.formatCurrency(Math.abs(delta))}${pct}</span>`;
    },

    _dreHTML(p) {
        const fc     = window.app.formatCurrency;
        const est    = this._drePorCategoria(p.id, 'estimado');
        const real   = this._drePorCategoria(p.id, 'real');
        const cEst   = this._dreCalculo(est);
        const cReal  = this._dreCalculo(real);
        const total  = this._custosDoProjeto(p.id).length;
        const temAlgum = total > 0;

        // Cards de resudo — base calculada no lado REAL
        const cards = [
            { label: 'RECEITA LÍQUIDA', valor: cReal.receitaLiquida, est: cEst.receitaLiquida, cor: '#4F46E5' },
            { label: 'CUSTOS DIRETOS',  valor: cReal.custosDiretos,  est: cEst.custosDiretos,  cor: '#F59E0B' },
            { label: 'DESPESAS OPER.',  valor: cReal.despesasOpers,  est: cEst.despesasOpers,  cor: '#EF4444' },
            { label: 'LUCRO LÍQUIDO',   valor: cReal.lucroLiquido,   est: cEst.lucroLiquido,   cor: cReal.lucroLiquido >= 0 ? '#10B981' : '#EF4444', margem: cReal.margem }
        ].map(c => `
            <div class="prj-card prj-dre-card">
                <div class="prj-card-label">${c.label}</div>
                <div class="prj-card-value" style="color:${c.cor}">${fc(c.valor)}</div>
                <div class="prj-card-sub">estimado ${fc(c.est)}${c.margem != null ? ` · <b>${c.margem.toFixed(1)}%</b> margem` : ''}</div>
            </div>`).join('');

        // Linhas do corpo, agrupadas, com subtotal encadeado ao fim de cada grupo
        let rows = '';
        Object.keys(DRE_GRUPOS).forEach(grupo => {
            rows += `<tr class="prj-dre-grupo"><td colspan="4">${DRE_GRUPOS[grupo]}</td></tr>`;
            DRE_CATEGORIAS.filter(c => c.grupo === grupo).forEach(cat => {
                const e = est[cat.key] || 0, r = real[cat.key] || 0;
                rows += `
                    <tr class="prj-dre-row">
                        <td class="prj-dre-conta"><i class="ph ${cat.icone}"></i><span class="prj-dre-sinal">${cat.sinal}</span>${cat.label}</td>
                        <td class="prj-num">${fc(e)}</td>
                        <td class="prj-num">${fc(r)}</td>
                        <td class="prj-num">${this._dreDeltaHTML(e, r, cat.maiorMelhor)}</td>
                    </tr>`;
            });
            const sub = DRE_SUBTOTAIS.find(s => s.grupo === grupo);
            if (sub) {
                const vEst  = this._dreAvaliar(cEst, sub.campos);
                const vReal = this._dreAvaliar(cReal, sub.campos);
                rows += `
                    <tr class="prj-dre-subtotal ${sub.destaque ? 'destaque' : ''}">
                        <td>${sub.label}</td>
                        <td class="prj-num">${fc(vEst)}</td>
                        <td class="prj-num">${fc(vReal)}</td>
                        <td class="prj-num">${this._dreDeltaHTML(vEst, vReal, grupo === 'receita' || sub.destaque)}</td>
                    </tr>`;
            }
        });

        // Lançamentos individuais
        const lancamentos = !temAlgum ? `
            <div class="prj-dre-empty">
                <i class="ph ph-receipt"></i>
                <p>Nenhum lançamento registrado ainda.<br>
                Use <b>Gerar Estimado</b> para criar as estimativas a partir do orçamento, ou <b>Novo Lançamento</b> para lançar custos reais.</p>
            </div>` : `
            <div class="prj-dre-lanc-wrap">
                <table class="prj-table prj-dre-lanc">
                    <thead>
                        <tr><th>Data</th><th>Conta</th><th>Descrição</th><th>Tipo</th><th class="prj-num">Valor</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${this._custosDoProjeto(p.id).map(c => {
                            const cat = DRE_CATEGORIAS.find(x => x.key === c.categoria)
                                || DRE_CATEGORIAS[DRE_CATEGORIAS.length - 1];
                            return `
                            <tr>
                                <td class="prj-datas">${this._fmtDate(c.data) || '—'}</td>
                                <td><i class="ph ${cat.icone}"></i>&nbsp;${cat.label}</td>
                                <td>${this._esc(c.descricao) || '<span class="prj-empty">—</span>'}</td>
                                <td><span class="prj-dre-tipo ${c.tipo}">${c.tipo === 'estimado' ? 'Estimado' : 'Real'}</span></td>
                                <td class="prj-num">${fc(c.valor)}</td>
                                <td class="prj-actions">
                                    <button title="Editar" onclick="app.projetos.openCustoModal('${p.id}','${c.id}')"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="prj-danger" title="Excluir" onclick="app.projetos.removeCusto('${c.id}')"><i class="ph ph-trash"></i></button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;

        return `
            <div class="prj-dre">
                <div class="prj-dre-toolbar">
                    <div class="prj-dre-title">
                        <i class="ph ph-currency-circle-dollar"></i> DRE — Estimado × Real
                        <span class="prj-dre-count">${total} lançamento(s)</span>
                    </div>
                    <div class="prj-dre-controls">
                        <button class="btn btn-ghost btn-sm" onclick="app.projetos.seedEstimado('${p.id}')" title="Cria as estimativas a partir do valor do contrato e dos percentuais tributários">
                            <i class="ph ph-sparkle"></i> Gerar Estimado
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="app.projetos.openCustoModal('${p.id}')">
                            <i class="ph ph-plus"></i> Novo Lançamento
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="app.projetos.exportDreXLSX('${p.id}')" title="Exporta a DRE detalhada: resumo, detalhamento por conta, lançamentos e análise">
                            <i class="ph ph-file-xls"></i> XLSX Detalhado
                        </button>
                    </div>
                </div>

                <div class="prj-summary prj-dre-cards">${cards}</div>

                <div class="prj-dre-table-wrap">
                    <table class="prj-table prj-dre-table">
                        <thead>
                            <tr>
                                <th>Conta</th>
                                <th class="prj-num">Estimado</th>
                                <th class="prj-num">Real</th>
                                <th class="prj-num">Variação (Real − Estimado)</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>

                <div class="prj-section-title" style="margin-top:20px;">Lançamentos</div>
                ${lancamentos}
            </div>`;
    },

    /* --- CRUD de lançamentos ------------------------------------------------ */

    openCustoModal(projetoId, custoId) {
        const c = custoId ? (store.getState().projetoCustos || []).find(x => x.id === custoId) : null;
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'prj-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="prj-modal">
                <div class="prj-modal-head">
                    <h3><i class="ph ${c ? 'ph-pencil-simple' : 'ph-plus'}"></i> ${c ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.prj-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="prj-modal-body">
                    <div class="prj-field">
                        <label>Conta (linha da DRE) *</label>
                        <select id="pc-cat" class="form-control">
                            ${Object.keys(DRE_GRUPOS).map(g => `
                                <optgroup label="${DRE_GRUPOS[g]}">
                                    ${DRE_CATEGORIAS.filter(x => x.grupo === g).map(x =>
                                        `<option value="${x.key}" ${(c?.categoria || 'outras') === x.key ? 'selected' : ''}>${x.sinal} ${x.label}</option>`).join('')}
                                </optgroup>`).join('')}
                        </select>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Tipo</label>
                            <select id="pc-tipo" class="form-control">
                                <option value="real" ${(c?.tipo || 'real') === 'real' ? 'selected' : ''}>Real (lançamento)</option>
                                <option value="estimado" ${c?.tipo === 'estimado' ? 'selected' : ''}>Estimado (orçamento)</option>
                            </select>
                        </div>
                        <div class="prj-field">
                            <label>Valor (R$) *</label>
                            <input type="text" id="pc-valor" class="form-control" value="${c ? window.app.formatCurrencyRaw(c.valor) : ''}" placeholder="0,00" inputmode="decimal">
                        </div>
                    </div>
                    <div class="prj-field">
                        <label>Data</label>
                        <input type="date" id="pc-data" class="form-control" value="${this._esc(c?.data || '')}">
                    </div>
                    <div class="prj-field" style="margin-bottom:0;">
                        <label>Descrição</label>
                        <input type="text" id="pc-desc" class="form-control" value="${this._esc(c?.descricao || '')}" placeholder="Ex.: nota fiscal de materiais, viagem à usina...">
                    </div>
                </div>
                <div class="prj-modal-foot">
                    <button class="btn btn-ghost" onclick="this.closest('.prj-modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.projetos.saveCusto('${projetoId}', '${c?.id || ''}')">
                        <i class="ph ph-check"></i> ${c ? 'Salvar' : 'Lançar'}
                    </button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const inp = document.getElementById('pc-valor');
        if (inp) inp.focus();
    },

    async saveCusto(projetoId, custoId) {
        const val = (fid) => document.getElementById(fid)?.value ?? '';
        const valor = window.app.parseCurrency(val('pc-valor'));
        if (!Number.isFinite(valor) || Math.abs(valor) < 0.005) {
            window.app.toast('Informe um valor para o lançamento.', 'warning');
            return;
        }
        const payload = {
            projeto_id: projetoId,
            categoria: val('pc-cat') || 'outras',
            tipo: val('pc-tipo') || 'real',
            valor: Math.abs(valor),
            data: val('pc-data') || '',
            descricao: val('pc-desc').trim()
        };
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        try {
            if (custoId) {
                const ok = await store.updateProjetoCusto(custoId, payload);
                if (ok) window.app.toast('Lançamento atualizado.', 'success');
            } else {
                const criado = await store.addProjetoCusto({ id: crypto.randomUUID(), ...payload });
                if (criado) window.app.toast('Lançamento registrado.', 'success');
            }
            this.renderDetail();
        } catch (e) {
            window.app.toast('Erro ao salvar lançamento: ' + e.message, 'error');
        }
    },

    async removeCusto(custoId) {
        const c = (store.getState().projetoCustos || []).find(x => x.id === custoId);
        if (!c) return;
        const cat = DRE_CATEGORIAS.find(x => x.key === c.categoria) || DRE_CATEGORIAS[DRE_CATEGORIAS.length - 1];
        if (!confirm(`Excluir o lançamento de ${cat.label} (${c.tipo === 'estimado' ? 'Estimado' : 'Real'}) no valor de ${window.app.formatCurrency(c.valor)}?`)) return;
        try {
            const ok = await store.deleteProjetoCusto(custoId);
            if (ok) window.app.toast('Lançamento excluído.', 'success');
            this.renderDetail();
        } catch (e) {
            window.app.toast('Erro ao excluir lançamento: ' + e.message, 'error');
        }
    },

    /**
     * Semear o lado ESTIMADO a partir do orçamento.
     * Não destrói lançamentos existentes: só cria as categorias que ainda não foram
     * estimadas. Materiais/Mão de Obra não são deriváveis sem o orçamento detalhado,
     * então criamos as linhas zeradas apenas para o usuário preencher.
     */
    async seedEstimado(projetoId) {
        const projeto = (store.getState().projetos || []).find(x => x.id === projetoId);
        if (!projeto) return;

        const jaTem = new Set(this._custosDoProjeto(projetoId, 'estimado').map(c => c.categoria));
        const receita = Number(projeto.valor_contrato) || 0;
        const regime = store.getState().company?.regimeTributario || 'Lucro Real';
        const pImpostos = regime === 'Simples Nacional' ? DRE_SEED_PADRAO.impostosSN : DRE_SEED_PADRAO.impostos;

        const novos = [];
        if (!jaTem.has('receita') && receita > 0) {
            novos.push({ categoria: 'receita', valor: receita, descricao: 'Valor do contrato' });
        }
        [
            ['impostos',     pImpostos,                    `Estimativa de impostos — ${regime}`],
            ['custos_fixos', DRE_SEED_PADRAO.custos_fixos, 'Rateio de custos fixos'],
            ['comissao',     DRE_SEED_PADRAO.comissao,     'Comissão de vendas']
        ].forEach(([cat, pct, desc]) => {
            if (!jaTem.has(cat) && receita > 0 && pct > 0) {
                novos.push({
                    categoria: cat,
                    valor: receita * pct / 100,
                    descricao: `${desc} (${String(pct).replace('.', ',')}% sobre a receita)`
                });
            }
        });
        ['material', 'mo'].forEach(cat => {
            if (!jaTem.has(cat)) novos.push({ categoria: cat, valor: 0, descricao: '' });
        });

        if (novos.length === 0) {
            window.app.toast('O estimado já está completo — nenhuma linha nova a criar.', 'info');
            return;
        }

        let falhas = 0;
        for (const n of novos) {
            const r = await store.addProjetoCusto({
                id: crypto.randomUUID(),
                projeto_id: projetoId,
                tipo: 'estimado',
                origem: 'orcamento',
                data: projeto.data_inicio || '',
                ...n
            });
            if (!r) falhas++;
        }
        if (falhas > 0) {
            window.app.toast(`Falha ao gravar ${falhas} linha(s) de estimado no servidor.`, 'error');
        } else {
            window.app.toast(`${novos.length} linha(s) de estimado criada(s). Ajuste os valores conforme o orçamento.`, 'success');
        }
        this.renderDetail();
    },

    /* --- Exportação --------------------------------------------------------- */

    /** DRE em XLSX detalhado — 4 abas: resumo executivo, detalhamento de
     *  cada conta com TODOS os lançamentos, base plana com autofiltro e
     *  análise (KPIs, participação, desvios e alertas). Padrão da casa:
     *  banner, cabeçalho em MAIÚSCULAS negrito centralizado, linhas
     *  zebradas e 2 primeiras linhas congeladas em cada aba. */
    exportDreXLSX(projetoId) {
        const p = (store.getState().projetos || []).find(x => x.id === projetoId);
        if (!p) return;
        try {
            if (typeof XLSX === 'undefined') {
                window.app.toast('Biblioteca XLSX não disponível.', 'warning');
                return;
            }
            const { wb, nLanc } = this._buildDreWorkbook(projetoId, p);
            const nomeArquivo = `DRE_${String(p.codigo || 'projeto').replace(/[^\w-]/g, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            this._patchXlsxFreezePane(buf, 2).then(patched => {
                const blob = new Blob([patched], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nomeArquivo;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                window.app.toast(`DRE detalhada exportada — 4 abas, ${nLanc} lançamento(s).`, 'success');
            }).catch(err => {
                console.error('[Projetos] XLSX freeze patch error:', err);
                XLSX.writeFile(wb, nomeArquivo);
                window.app.toast(`DRE detalhada exportada — 4 abas, ${nLanc} lançamento(s).`, 'success');
            });
        } catch (e) {
            console.error('[Projetos] DRE XLSX error:', e);
            window.app.toast('Erro ao exportar DRE: ' + e.message, 'error');
        }
    },

    /** Cronograma em XLSX estilo MS Project — estrutura de desdobramento
     *  (WBS): fases como linhas-resumo (macro), tarefas recuadas abaixo,
     *  colunas Início/Fim/Duração/Progresso/Status/Responsável e uma faixa
     *  de Gantt por semanas à direita (barras coloridas por fase). Padrão
     *  da casa: banner, cabeçalho MAIÚSCULO, zebra e 2 linhas congeladas. */
    exportarCronogramaXLSX(projetoId) {
        const p = (store.getState().projetos || []).find(x => x.id === projetoId);
        if (!p) return;
        try {
            if (typeof XLSX === 'undefined') {
                window.app.toast('Biblioteca XLSX não disponível.', 'warning');
                return;
            }
            const fases = this._fasesDoProjeto(projetoId);
            if (fases.length === 0) {
                window.app.toast('O cronograma está vazio — crie as fases antes de exportar o XLSX.', 'warning');
                return;
            }
            const { wb, nTarefas } = this._buildCronogramaWorkbook(projetoId, p, fases);
            const nomeArquivo = `Cronograma_${String(p.codigo || 'projeto').replace(/[^\w-]/g, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            this._patchXlsxFreezePane(buf, 2).then(patched => {
                const blob = new Blob([patched], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nomeArquivo;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                window.app.toast(`Cronograma exportado (MS Project) — ${fases.length} fase(s), ${nTarefas} tarefa(s).`, 'success');
            }).catch(err => {
                console.error('[Projetos] XLSX freeze patch error:', err);
                XLSX.writeFile(wb, nomeArquivo);
                window.app.toast(`Cronograma exportado (MS Project) — ${fases.length} fase(s), ${nTarefas} tarefa(s).`, 'success');
            });
        } catch (e) {
            console.error('[Projetos] Cronograma XLSX error:', e);
            window.app.toast('Erro ao exportar cronograma: ' + e.message, 'error');
        }
    },

    /** Constrói o workbook do cronograma estilo MS Project (somente leitura
     *  do estado) — usado pela exportação e validável sem disparar download.
     *  Aba "Cronograma": árvore WBS (fase resumo + tarefas recuadas) com
     *  faixa de Gantt semanal colorida; aba "Resumo": KPIs e legenda. */
    _buildCronogramaWorkbook(projetoId, p, fases) {
        const fmtD = (d) => {
            const s = String(d || '');
            const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
            return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
        };
        const hoje = this._today();
        const pct = (v) => Math.max(0, Math.min(100, Math.round(parseFloat(v) || 0)));
        const idProj = `${p.codigo || 'PROJ'} · ${p.projeto || '(sem nome)'} · Cliente: ${p.cliente || '—'}`;
        const gerado = `gerado em ${new Date().toLocaleDateString('pt-BR')}`;
        const tarefas = this._tarefasDoProjeto(projetoId);
        const progressoGeral = this._progressoProjeto(projetoId) || 0;

        /* ---- período do Gantt (mesma regra do PDF) ---- */
        const datas = [];
        fases.forEach(f => { if (f.data_inicio) datas.push(this._parseDate(f.data_inicio)); if (f.data_fim) datas.push(this._parseDate(f.data_fim)); });
        tarefas.forEach(t => { if (t.data_inicio) datas.push(this._parseDate(t.data_inicio)); if (t.data_fim) datas.push(this._parseDate(t.data_fim)); });
        if (p.data_inicio) datas.push(this._parseDate(p.data_inicio));
        if (p.data_prevista_entrega) datas.push(this._parseDate(p.data_prevista_entrega));
        datas.push(hoje);
        let min = new Date(Math.min(...datas.map(d => d.getTime())));
        let max = new Date(Math.max(...datas.map(d => d.getTime())));
        min = this._addDays(min, -3);
        max = this._addDays(max, 4);
        if (this._diffDays(min, max) < 14) max = this._addDays(min, 14);

        /* ---- faixa de Gantt: colunas MENSAIS (capped a 36) ---- */
        const MAX_COL = 36;
        const meses = [];
        let cur = new Date(min.getFullYear(), min.getMonth(), 1);
        while (cur <= max && meses.length < MAX_COL) {
            const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            const mStart = cur < min ? min : cur;
            const mEnd = nextMonth > max ? max : this._addDays(nextMonth, -1);
            const rotulo = cur.toLocaleDateString('pt-BR', { month: 'short' }).replace(/\./g, '') + '/' + String(cur.getFullYear()).slice(2);
            meses.push({ ini: mStart, fim: mEnd, rotulo });
            cur = nextMonth;
        }

        /* ---------------- estilos ---------------- */
        const stTitle  = { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '312E81' } }, alignment: { horizontal: 'left', vertical: 'center' } };
        const stHeader = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4F46E5' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        const stSemana = { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '6366F1' } }, alignment: { horizontal: 'center', vertical: 'center', textRotation: 90 } };
        const stZebra  = { fill: { fgColor: { rgb: 'F3F4F6' } } };
        const stGrupo  = { font: { bold: true, sz: 11, color: { rgb: '1F2937' } }, fill: { fgColor: { rgb: 'E0E7FF' } } };
        const stOk     = { font: { bold: true, color: { rgb: '15803D' } }, alignment: { horizontal: 'center' } };
        const stAtras  = { font: { bold: true, color: { rgb: 'B91C1C' } }, alignment: { horizontal: 'center' } };
        const stCentro = { alignment: { horizontal: 'center' } };

        const pctFmt = '0%';
        const STATUS_LABEL = { pendente: 'Pendente', em_andamento: 'Em Andamento', concluido: 'Concluída', bloqueada: 'Bloqueada' };

        /* ---- colunas fixas (WBS + descritivo) ---- */
        const colunas = ['WBS', 'Nome', 'Início', 'Fim', 'Duração (dias)', 'Progresso', 'Status', 'Responsável'];
        const largurasBase = [8, 44, 12, 12, 9, 10, 15, 22];
        const largurasSemana = meses.map(() => ({ wch: 3.6 }));
        const cabecalhoSemana = meses.map(m => m.rotulo);

        const aoa = [];
        const merges = [];
        const styles = []; // { r, c, st, fmt }

        /* linha 0: banner */
        const ncolTotal = colunas.length + meses.length;
        aoa.push([`CRONOGRAMA DO PROJETO — ${idProj} — ${gerado}`, ...Array(ncolTotal - 1).fill('')]);
        /* linha 1: cabeçalho fixo + cabeçalho de meses */
        aoa.push([...colunas, ...cabecalhoSemana]);

        for (let c = 0; c < ncolTotal; c++) {
            styles.push({ r: 0, c, st: stTitle });
            styles.push({ r: 1, c, st: c < colunas.length ? stHeader : stSemana });
        }
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: ncolTotal - 1 } });

        /* linhas de dados: fases (macro) + tarefas recuadas */
        let r = 2;
        fases.forEach((f, fi) => {
            const cor = (f.cor || '').replace('#', '').toUpperCase();
            const corBarras = /^[0-9A-F]{6}$/.test(cor) ? cor : '6366F1';
            const prog = pct(f.progresso) / 100;
            const tarefasFase = this._tarefasDaFase(f.id);
            const atrasada = f.status !== 'concluido' && f.data_fim && this._parseDate(f.data_fim) < hoje;
            const durDias = f.data_inicio && f.data_fim ? this._diffDays(this._parseDate(f.data_inicio), this._parseDate(f.data_fim)) + 1 : '';
            const wbsFase = String(fi + 1);

            aoa.push([
                wbsFase, f.nome || '', fmtD(f.data_inicio), fmtD(f.data_fim), durDias,
                prog, STATUS_LABEL[f.status] || 'Pendente', f.responsavel || ''
            ]);
            // estilo da linha-resumo (fase)
            styles.push({ r, c: 0, st: Object.assign({}, stGrupo, stCentro) });
            for (let c = 1; c < colunas.length; c++) styles.push({ r, c, st: stGrupo });
            styles.push({ r, c: 4, st: Object.assign({}, stGrupo, stCentro) });
            styles.push({ r, c: 5, st: Object.assign({}, stGrupo, stCentro), fmt: pctFmt });
            if (atrasada) styles.push({ r, c: 6, st: Object.assign({}, stGrupo, stAtras) });
            else if (f.status === 'concluido') styles.push({ r, c: 6, st: Object.assign({}, stGrupo, stOk) });
            // barras da fase na faixa de meses
            this._pintarBarraMensal(styles, r, colunas.length, meses, f.data_inicio, f.data_fim, prog, corBarras);
            r++;

            tarefasFase.forEach((t, ti) => {
                const progT = pct(t.progresso) / 100;
                const atrasT = t.status !== 'concluido' && t.data_fim && this._parseDate(t.data_fim) < hoje;
                const durT = t.data_inicio && t.data_fim ? this._diffDays(this._parseDate(t.data_inicio), this._parseDate(t.data_fim)) + 1 : '';
                const base = (r % 2 === 1) ? stZebra : {};
                aoa.push([
                    `${wbsFase}.${ti + 1}`, t.nome || '', fmtD(t.data_inicio), fmtD(t.data_fim), durT,
                    progT, STATUS_LABEL[t.status] || 'Pendente', t.responsavel || ''
                ]);
                styles.push({ r, c: 0, st: Object.assign({}, base, stCentro) });
                styles.push({ r, c: 1, st: Object.assign({}, base, { alignment: { horizontal: 'left', indent: 1 } }) });
                for (let c = 2; c < 5; c++) styles.push({ r, c, st: Object.assign({}, base, stCentro) });
                styles.push({ r, c: 5, st: Object.assign({}, base, stCentro), fmt: pctFmt });
                if (atrasT) styles.push({ r, c: 6, st: Object.assign({}, base, stAtras) });
                else if (t.status === 'concluido') styles.push({ r, c: 6, st: Object.assign({}, base, stOk) });
                this._pintarBarraMensal(styles, r, colunas.length, meses, t.data_inicio, t.data_fim, progT, corBarras);
                r++;
            });
        });

        /* ---- monta a folha ---- */
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [...largurasBase.map(w => ({ wch: w })), ...largurasSemana];
        ws['!merges'] = merges;
        styles.forEach(s => {
            const ref = XLSX.utils.encode_cell({ r: s.r, c: s.c });
            const cell = ws[ref];
            if (!cell) return;
            const stFinal = Object.assign({}, s.st || {});
            if (s.fmt) stFinal.numFmt = s.fmt;
            cell.s = stFinal;
        });

        /* ---- aba 2: Resumo (KPIs + legenda) ---- */
        const estado = { periodo: { inicio: this._iso(min), fim: this._iso(max) }, progressoGeral };
        const wsResumo = this._buildCronogramaResumoSheet(p, fases, estado, idProj, gerado, { stTitle, stHeader, stGrupo, stZebra, stOk, stAtras, stCentro });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
        return { wb, nTarefas: tarefas.length };
    },

    /** Pinta uma barra de Gantt numa faixa de colunas mensais já existentes.
     *  `colIni` = índice da primeira coluna da faixa; `meses` = [{ini,fim}]
     *  em Date. Cada célula da faixa recebe fundo da cor da fase quando o
     *  mês intersecta o período (conforme a regra do MS Project). */
    _pintarBarraMensal(styles, r, colIni, meses, dataInicio, dataFim, prog, corBarras) {
        if (!dataInicio || !this._parseDate(dataInicio)) return;
        const ini = this._parseDate(dataInicio);
        const fim = (dataFim && this._parseDate(dataFim)) || ini;
        const preenchidoAte = prog > 0 ? this._addDays(ini, Math.round(this._diffDays(ini, fim) * prog)) : null;
        meses.forEach((mes, i) => {
            if (mes.fim < ini || mes.ini > fim) return;
            let fill = corBarras;
            // parte ainda não concluída (após o preenchimento) fica cinza-claro
            if (preenchidoAte && mes.ini > preenchidoAte) fill = 'E5E7EB';
            styles.push({ r, c: colIni + i, st: { fill: { fgColor: { rgb: fill } }, border: { bottom: { style: 'thin', color: { rgb: 'FFFFFF' } } } } });
        });
    },

    /** Aba Resumo do cronograma XLSX: período, fases por status, tarefas e
     *  itens atrasados — leitura rápida do estado do projeto. */
    _buildCronogramaResumoSheet(p, fases, st, idProj, gerado, estilos) {
        const { stTitle, stHeader, stGrupo, stZebra, stOk, stAtras, stCentro } = estilos;
        const hoje = this._today();
        const fmtD = (d) => {
            const s = String(d || '');
            const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
            return m ? `${m[3]}/${m[2]}/${m[1]}` : (s ? String(s).slice(0, 10) : '—');
        };
        const STATUS_LABEL = { pendente: 'Pendente', em_andamento: 'Em Andamento', concluido: 'Concluída', bloqueada: 'Bloqueada' };
        const tarefas = fases.reduce((acc, f) => acc.concat(this._tarefasDaFase(f.id).map(t => ({ ...t, _fase: f.nome }))), []);

        const nConclF = fases.filter(f => f.status === 'concluido').length;
        const nConclT = tarefas.filter(t => t.status === 'concluido').length;
        const atrasadas = fases.filter(f => f.status !== 'concluido' && f.data_fim && this._parseDate(f.data_fim) < hoje)
            .concat(tarefas.filter(t => t.status !== 'concluido' && t.data_fim && this._parseDate(t.data_fim) < hoje));

        const iniMin = st.periodo ? st.periodo.inicio : null;
        const fimMax = st.periodo ? st.periodo.fim : null;

        const linhas = [];
        const push = (cells, kind) => linhas.push({ cells, kind });
        push(['PERÍODO DO CRONOGRAMA']);
        push(['Início', iniMin ? fmtD(iniMin) : '—']);
        push(['Entrega Prevista (projeto)', p.data_prevista_entrega ? fmtD(p.data_prevista_entrega) : '—']);
        push(['Fim real do cronograma', fimMax ? fmtD(fimMax) : '—']);
        push(['Hoje', fmtD(this._iso(hoje))]);
        push(['']);
        push(['PROGRESSO']);
        push(['Progresso geral', st.progressoGeral + '%']);
        push(['Fases concluídas', `${nConclF} / ${fases.length}`]);
        push(['Tarefas concluídas', `${nConclT} / ${tarefas.length}`]);
        push(['']);
        push(['ITENS ATRASADOS (' + atrasadas.length + ')']);
        if (atrasadas.length) atrasadas.forEach(a => push(['⚠ ' + (a._fase ? a._fase + ' › ' : '') + (a.nome || ''), ' fim ' + fmtD(a.data_fim)]));
        else push(['✓ Nenhum item atrasado']);

        const aoa = [[`RESUMO DO CRONOGRAMA — ${idProj} — ${gerado}`, ''], ...linhas.map(l => [l.cells[0] || '', l.cells[1] || ''])];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [{ wch: 44 }, { wch: 40 }];
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
        // aplica estilos: banner, seções em negrito, alertas
        for (let c = 0; c < 2; c++) {
            const banner = ws[XLSX.utils.encode_cell({ r: 0, c })];
            if (banner) banner.s = stTitle;
        }
        linhas.forEach((l, i) => {
            const r = i + 1;
            const ehSecao = l.cells.length === 1 && l.cells[0] !== '' && l.cells[0] === (l.cells[0] || '').toUpperCase();
            const ehAlerta = String(l.cells[0] || '').startsWith('⚠');
            const ehOk = String(l.cells[0] || '').startsWith('✓');
            for (let c = 0; c < 2; c++) {
                const cell = ws[XLSX.utils.encode_cell({ r, c })];
                if (!cell) continue;
                if (ehSecao) cell.s = stGrupo;
                else if (ehAlerta) cell.s = stAtras;
                else if (ehOk) cell.s = stOk;
            }
        });
        return ws;
    },

    /** Constrói o workbook completo da DRE (somente leitura do estado) —
     *  usado pela exportação e validável sem disparar o download. */
    _buildDreWorkbook(projetoId, p) {
        const num = (v) => Math.round((Number(v) || 0) * 100) / 100;
        const custos = this._custosDoProjeto(projetoId);
        const est    = this._drePorCategoria(projetoId, 'estimado');
        const real   = this._drePorCategoria(projetoId, 'real');
        const cEst   = this._dreCalculo(est);
        const cReal  = this._dreCalculo(real);
        const nEst   = custos.filter(c => c.tipo === 'estimado').length;

        const pctDe = (e, r) => Math.abs(e) > 0.005 ? (r - e) / Math.abs(e) : '';
        const fmtData = (d) => {
            const s = String(d || '');
            const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
            return m ? `${m[3]}/${m[2]}/${m[1]}` : (s || '—');
        };
        const ORIGEM_LABEL = { manual: 'Manual', orcamento: 'Orçamento', compra: 'Compras (NF)' };
        const origemDe = (c) => ORIGEM_LABEL[c.origem] || c.origem || 'Manual';
        const bucketKey = (c) => DRE_CATEGORIAS.some(x => x.key === c.categoria) ? c.categoria : 'outras';
        const porConta = {};
        DRE_CATEGORIAS.forEach(c => { porConta[c.key] = []; });
        custos.forEach(c => porConta[bucketKey(c)].push(c));
        const ordem = (a, b) =>
            (a.tipo === 'estimado' ? 0 : 1) - (b.tipo === 'estimado' ? 0 : 1) ||
            String(a.data || '').localeCompare(String(b.data || '')) ||
            String(a.descricao || '').localeCompare(String(b.descricao || ''));

        const idProj = `${p.codigo || 'PROJ'} · ${p.projeto || '(sem nome)'} · Cliente: ${p.cliente || '—'}`;
        const gerado = `gerado em ${new Date().toLocaleDateString('pt-BR')}`;

        /* ---------------- estilos ---------------- */
        const moneyFmt = '#,##0.00';
        const pctFmt   = '0.0%';
        const ppFmt    = '+0.0" p.p.";-0.0" p.p.";0.0" p.p."';
        const stTitle   = { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '312E81' } }, alignment: { horizontal: 'left', vertical: 'center' } };
        const stHeader  = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4F46E5' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        const stZebra   = { fill: { fgColor: { rgb: 'F3F4F6' } } };
        const stGroup   = { font: { bold: true, sz: 11, color: { rgb: '374151' } }, fill: { fgColor: { rgb: 'E0E7FF' } } };
        const stTotal   = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4B5563' } } };
        const stSub     = { font: { bold: true, sz: 11, color: { rgb: '1F2937' } }, fill: { fgColor: { rgb: 'EEF2FF' } } };
        const stNote    = { font: { italic: true, sz: 10, color: { rgb: '9CA3AF' } } };
        const stAlerta  = { fill: { fgColor: { rgb: 'FFFBEB' } }, font: { color: { rgb: '92400E' } }, alignment: { vertical: 'center' } };
        const stOk      = { fill: { fgColor: { rgb: 'F0FDF4' } }, font: { bold: true, color: { rgb: '15803D' } }, alignment: { vertical: 'center' } };
        const stEstTag  = { font: { bold: true, sz: 10, color: { rgb: '9A3412' } }, fill: { fgColor: { rgb: 'FFF7ED' } }, alignment: { horizontal: 'center' } };
        const stRealTag = { font: { bold: true, sz: 10, color: { rgb: '3730A3' } }, fill: { fgColor: { rgb: 'EEF2FF' } }, alignment: { horizontal: 'center' } };
        const stNeutro  = { font: { bold: true, color: { rgb: 'E5E7EB' } } };
        const BAND_CORES = { receita: '065F46', deducoes: '92400E', custos: '3730A3', operacionais: '374151' };
        /* Cor da variação: favorável verde, desfavorável vermelho.
           `escuro` = linha de total (fundo cinza): tons claros de texto. */
        const vStyle = (delta, maiorMelhor, escuro) => {
            if (Math.abs(delta) < 0.005) return { font: { color: { rgb: escuro ? 'E5E7EB' : '6B7280' } } };
            const bom = maiorMelhor ? delta > 0 : delta < 0;
            const st = { font: { bold: true, color: { rgb: bom ? (escuro ? '86EFAC' : '15803D') : (escuro ? 'FCA5A5' : 'B91C1C') } } };
            if (!escuro) st.fill = { fgColor: { rgb: bom ? 'F0FDF4' : 'FEF2F2' } };
            return st;
        };

        /* Monta uma aba: linha 0 = banner mesclado, linha 1 = cabeçalho em
           MAIÚSCULAS negrito centralizado, demais linhas com `kind`
           definindo o estilo base (zebra automática em linhas de dado). */
        const mkSheet = (titulo, cabecalho, linhas, larguras, opts) => {
            const ncol = cabecalho.length;
            const aoa = [
                [titulo, ...Array(ncol - 1).fill('')],
                cabecalho.map(h => String(h).toUpperCase())
            ];
            linhas.forEach(l => {
                const row = [...l.cells];
                while (row.length < ncol) row.push('');
                aoa.push(row);
            });
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            ws['!cols'] = larguras.map(w => ({ wch: w }));
            const baseDa = (l, r) => {
                switch (l.kind) {
                    case 'group':   return () => stGroup;
                    case 'total':   return () => stTotal;
                    case 'sub':     return () => stSub;
                    case 'band':    return () => ({ font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: l.cor || '4B5563' } } });
                    case 'note':    return () => stNote;
                    case 'alert':   return () => stAlerta;
                    case 'alertok': return () => stOk;
                    case 'data':    return () => (r % 2 === 1 ? stZebra : null);
                    default:        return () => null;
                }
            };
            const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: ncol - 1 } }];
            for (let c = 0; c < ncol; c++) {
                const a = ws[XLSX.utils.encode_cell({ r: 0, c })];
                if (a) a.s = stTitle;
                const b = ws[XLSX.utils.encode_cell({ r: 1, c })];
                if (b) b.s = stHeader;
            }
            linhas.forEach((l, i) => {
                const r = i + 2;
                const base = baseDa(l, r);
                if (l.merge) merges.push({ s: { r, c: l.merge[0] }, e: { r, c: l.merge[1] } });
                for (let c = 0; c < ncol; c++) {
                    const cell = ws[XLSX.utils.encode_cell({ r, c })];
                    if (!cell) continue;
                    const st = Object.assign({}, base() || {}, (l.st && l.st[c]) || {});
                    const fmt = l.fmt && l.fmt[c];
                    if (fmt) st.numFmt = fmt;
                    if (Object.keys(st).length) cell.s = st;
                }
            });
            ws['!merges'] = merges;
            if (opts && opts.autofilter) ws['!autofilter'] = { ref: opts.autofilter };
            return ws;
        };

        /* ---- aba 1: DRE (resumo executivo) ---- */
        const linhasDre = [];
        Object.keys(DRE_GRUPOS).forEach(grupo => {
            linhasDre.push({ kind: 'group', cells: [DRE_GRUPOS[grupo]], merge: [0, 6] });
            DRE_CATEGORIAS.filter(c => c.grupo === grupo).forEach(cat => {
                const e = est[cat.key] || 0, r = real[cat.key] || 0;
                const rlE = cEst.receitaLiquida, rlR = cReal.receitaLiquida;
                linhasDre.push({
                    kind: 'data',
                    cells: [
                        `${cat.sinal} ${cat.label}`,
                        num(e), num(r), num(r - e), pctDe(e, r),
                        rlE > 0.005 ? e / rlE : '', rlR > 0.005 ? r / rlR : ''
                    ],
                    fmt: { 1: moneyFmt, 2: moneyFmt, 3: moneyFmt, 4: pctFmt, 5: pctFmt, 6: pctFmt },
                    st: { 3: vStyle(r - e, cat.maiorMelhor), 4: vStyle(r - e, cat.maiorMelhor) }
                });
            });
            const sub = DRE_SUBTOTAIS.find(s => s.grupo === grupo);
            if (sub) {
                const vE = this._dreAvaliar(cEst, sub.campos);
                const vR = this._dreAvaliar(cReal, sub.campos);
                linhasDre.push({
                    kind: 'total',
                    cells: [sub.label, num(vE), num(vR), num(vR - vE), pctDe(vE, vR), '', ''],
                    fmt: { 1: moneyFmt, 2: moneyFmt, 3: moneyFmt, 4: pctFmt },
                    st: { 3: vStyle(vR - vE, true, true), 4: vStyle(vR - vE, true, true) }
                });
            }
        });
        linhasDre.push({
            kind: 'total',
            cells: ['MARGEM (% SOBRE RECEITA LÍQUIDA)', cEst.margem / 100, cReal.margem / 100, (cReal.margem - cEst.margem) / 100, '', '', ''],
            fmt: { 1: pctFmt, 2: pctFmt, 3: pctFmt },
            st: { 3: vStyle((cReal.margem - cEst.margem) / 100, true, true) }
        });
        const wsDre = mkSheet(
            `DRE DETALHADA — ${idProj} — ${gerado}`,
            ['Conta', 'Estimado (R$)', 'Real (R$)', 'Variação (R$)', 'Variação (%)', '% Receita Líq. (E)', '% Receita Líq. (R)'],
            linhasDre,
            [42, 16, 16, 16, 13, 16, 16]
        );

        /* ---- aba 2: Detalhamento — cada conta com todos os lançamentos ---- */
        const linhasDet = [];
        DRE_CATEGORIAS.forEach(cat => {
            const lista = porConta[cat.key] || [];
            linhasDet.push({ kind: 'band', cor: BAND_CORES[cat.grupo], cells: [cat.label.toUpperCase()], merge: [0, 5] });
            if (!lista.length) {
                linhasDet.push({ kind: 'note', cells: ['(sem lançamentos nesta conta)'], merge: [0, 5] });
                return;
            }
            [...lista].sort(ordem).forEach(c => {
                const ehEst = c.tipo === 'estimado';
                linhasDet.push({
                    kind: 'data',
                    cells: ['', ehEst ? 'ESTIMADO' : 'REAL', fmtData(c.data), c.descricao || '—', origemDe(c), Math.abs(num(c.valor))],
                    fmt: { 5: moneyFmt },
                    st: { 1: ehEst ? stEstTag : stRealTag }
                });
            });
            const e = est[cat.key] || 0, r = real[cat.key] || 0;
            linhasDet.push({ kind: 'sub', cells: ['SUBTOTAL ESTIMADO', '', '', '', '', num(e)], merge: [0, 4], fmt: { 5: moneyFmt } });
            linhasDet.push({ kind: 'sub', cells: ['SUBTOTAL REAL', '', '', '', '', num(r)], merge: [0, 4], fmt: { 5: moneyFmt } });
            linhasDet.push({
                kind: 'sub',
                cells: ['VARIAÇÃO (REAL − ESTIMADO)', '', '', '', pctDe(e, r), num(r - e)],
                merge: [0, 3],
                fmt: { 4: pctFmt, 5: moneyFmt },
                st: { 4: vStyle(r - e, cat.maiorMelhor), 5: vStyle(r - e, cat.maiorMelhor) }
            });
        });
        const volE = num(DRE_CATEGORIAS.reduce((s, c) => s + (est[c.key] || 0), 0));
        const volR = num(DRE_CATEGORIAS.reduce((s, c) => s + (real[c.key] || 0), 0));
        linhasDet.push({ kind: 'total', cells: ['VOLUME TOTAL LANÇADO — ESTIMADO', '', '', '', '', volE], merge: [0, 4], fmt: { 5: moneyFmt } });
        linhasDet.push({ kind: 'total', cells: ['VOLUME TOTAL LANÇADO — REAL', '', '', '', '', volR], merge: [0, 4], fmt: { 5: moneyFmt } });
        linhasDet.push({
            kind: 'total',
            cells: ['VARIAÇÃO DO VOLUME', '', '', '', pctDe(volE, volR), num(volR - volE)],
            merge: [0, 3],
            fmt: { 4: pctFmt, 5: moneyFmt },
            st: { 4: stNeutro, 5: stNeutro }
        });
        const wsDet = mkSheet(
            `DETALHAMENTO POR CONTA — ${idProj} — ${gerado}`,
            ['Conta', 'Tipo', 'Data', 'Descrição', 'Origem', 'Valor (R$)'],
            linhasDet,
            [34, 12, 12, 50, 15, 16]
        );

        /* ---- aba 3: Lançamentos — base plana com autofiltro (pivot-ready) ---- */
        const linhasLanc = [];
        Object.keys(DRE_GRUPOS).forEach(grupo => {
            DRE_CATEGORIAS.filter(c => c.grupo === grupo).forEach(cat => {
                [...(porConta[cat.key] || [])].sort(ordem).forEach(c => {
                    const ehEst = c.tipo === 'estimado';
                    linhasLanc.push({
                        kind: 'data',
                        cells: [DRE_GRUPOS[grupo], `${cat.sinal} ${cat.label}`, ehEst ? 'ESTIMADO' : 'REAL', fmtData(c.data), c.descricao || '—', origemDe(c), Math.abs(num(c.valor))],
                        fmt: { 6: moneyFmt },
                        st: { 2: ehEst ? stEstTag : stRealTag }
                    });
                });
            });
        });
        if (!linhasLanc.length) linhasLanc.push({ kind: 'note', cells: ['(nenhum lançamento registrado)'], merge: [0, 6] });
        const wsLanc = mkSheet(
            `LANÇAMENTOS (${custos.length}) — ${idProj} — ${gerado}`,
            ['Grupo', 'Conta', 'Tipo', 'Data', 'Descrição', 'Origem', 'Valor (R$)'],
            linhasLanc,
            [26, 26, 12, 12, 48, 15, 16],
            { autofilter: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: 1 + Math.max(1, linhasLanc.length), c: 6 } }) }
        );

        /* ---- aba 4: Análise — KPIs, participação, desvios e alertas ---- */
        const linhasAna = [];
        const pushBand = (txt) => linhasAna.push({ kind: 'band', cor: '1E1B4B', cells: [txt], merge: [0, 4] });

        pushBand('INDICADORES-CHAVE');
        [
            ['RECEITA BRUTA', cEst.receitaBruta, cReal.receitaBruta, true, 'data'],
            ['(−) IMPOSTOS SOBRE VENDAS', cEst.deducoes, cReal.deducoes, false, 'data'],
            ['RECEITA LÍQUIDA', cEst.receitaLiquida, cReal.receitaLiquida, true, 'sub'],
            ['(−) CUSTOS DIRETOS', cEst.custosDiretos, cReal.custosDiretos, false, 'data'],
            ['LUCRO BRUTO', cEst.lucroBruto, cReal.lucroBruto, true, 'sub'],
            ['(−) DESPESAS OPERACIONAIS', cEst.despesasOpers, cReal.despesasOpers, false, 'data'],
            ['LUCRO LÍQUIDO', cEst.lucroLiquido, cReal.lucroLiquido, true, 'sub']
        ].forEach(([label, vE, vR, mm, kind]) => {
            linhasAna.push({
                kind,
                cells: [label, num(vE), num(vR), num(vR - vE), ''],
                fmt: { 1: moneyFmt, 2: moneyFmt, 3: moneyFmt },
                st: { 3: vStyle(vR - vE, mm, false) }
            });
        });
        const dMargem = (cReal.margem - cEst.margem) / 100;
        const notaMargem = !(cReal.receitaLiquida > 0.005)
            ? 'sem receita líquida lançada'
            : cReal.margem >= 10 ? `saudável (${cReal.margem.toFixed(1).replace('.', ',')}%)`
            : cReal.margem > 0 ? `atenção: abaixo de 10% (${cReal.margem.toFixed(1).replace('.', ',')}%)`
            : 'prejuízo no realizado';
        linhasAna.push({
            kind: 'sub',
            cells: ['MARGEM LÍQUIDA', cEst.margem / 100, cReal.margem / 100, dMargem, notaMargem],
            fmt: { 1: pctFmt, 2: pctFmt, 3: pctFmt },
            st: {
                3: vStyle(dMargem, true, false),
                4: { font: { italic: true, bold: true, color: { rgb: cReal.margem >= 10 ? '15803D' : cReal.margem > 0 ? 'B45309' : 'B91C1C' } } }
            }
        });
        linhasAna.push({
            kind: 'data',
            cells: ['Nº DE LANÇAMENTOS', nEst, custos.length - nEst, custos.length, `${nEst} estimado · ${custos.length - nEst} real`],
            fmt: { 1: '0', 2: '0', 3: '0' }
        });

        pushBand('PARTICIPAÇÃO NA RECEITA LÍQUIDA');
        let temPart = false;
        DRE_CATEGORIAS.filter(c => c.key !== 'receita').forEach(cat => {
            const e = est[cat.key] || 0, r = real[cat.key] || 0;
            if (e < 0.005 && r < 0.005) return;
            temPart = true;
            const pE = cEst.receitaLiquida > 0.005 ? e / cEst.receitaLiquida : '';
            const pR = cReal.receitaLiquida > 0.005 ? r / cReal.receitaLiquida : '';
            const pp = (pE !== '' && pR !== '') ? (pR - pE) * 100 : '';
            linhasAna.push({
                kind: 'data',
                cells: [`${cat.sinal} ${cat.label}`, pE, pR, pp, pp === '' ? '' : (pp > 0.05 ? '↑ ganhou participação' : pp < -0.05 ? '↓ perdeu participação' : 'estável')],
                fmt: { 1: pctFmt, 2: pctFmt, 3: ppFmt },
                st: { 3: typeof pp === 'number' ? { font: { bold: true, color: { rgb: (cat.maiorMelhor ? pp < 0 : pp > 0) ? 'B91C1C' : '15803D' } } } : null }
            });
        });
        if (!temPart) linhasAna.push({ kind: 'note', cells: ['(sem lançamentos para calcular participação)'], merge: [0, 4] });

        pushBand('MAIORES DESVIOS (TOP 5 — REAL × ESTIMADO)');
        const desvios = DRE_CATEGORIAS.map(cat => ({ cat, e: est[cat.key] || 0, r: real[cat.key] || 0 }))
            .map(d => ({ ...d, delta: d.r - d.e }))
            .filter(d => Math.abs(d.delta) > 0.005)
            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
            .slice(0, 5);
        if (!desvios.length) linhasAna.push({ kind: 'note', cells: ['(nenhum desvio entre estimado e realizado)'], merge: [0, 4] });
        desvios.forEach(d => {
            const semEst = Math.abs(d.e) < 0.005;
            const bom = semEst ? null : (d.cat.maiorMelhor ? d.delta > 0 : d.delta < 0);
            linhasAna.push({
                kind: 'data',
                cells: [`${d.cat.sinal} ${d.cat.label}`, num(d.e), num(d.r), num(d.delta),
                    semEst ? 'REAL SEM ESTIMADO' : (bom ? 'FAVORÁVEL ✓' : 'DESFAVORÁVEL ✗')],
                fmt: { 1: moneyFmt, 2: moneyFmt, 3: moneyFmt },
                st: {
                    3: vStyle(d.delta, d.cat.maiorMelhor, false),
                    4: { font: { bold: true, color: { rgb: semEst ? '92400E' : bom ? '15803D' : 'B91C1C' } }, alignment: { horizontal: 'center' } }
                }
            });
        });

        pushBand('ALERTAS DA DRE');
        const alertas = [];
        const semEst  = DRE_CATEGORIAS.filter(c => (est[c.key] || 0) < 0.005 && (real[c.key] || 0) > 0.005);
        const semReal = DRE_CATEGORIAS.filter(c => (est[c.key] || 0) > 0.005 && (real[c.key] || 0) < 0.005);
        const desvio25 = DRE_CATEGORIAS.filter(c => {
            const e = est[c.key] || 0;
            return e > 0.005 && Math.abs((real[c.key] || 0) - e) / Math.abs(e) > 0.25;
        });
        const semData = custos.filter(c => !c.data);
        if (semEst.length) alertas.push(`⚠ ${semEst.length} conta(s) com REAL sem ESTIMADO: ${semEst.map(c => c.label).join(', ')}`);
        if (semReal.length) alertas.push(`⚠ ${semReal.length} conta(s) com ESTIMADO sem REAL: ${semReal.map(c => c.label).join(', ')}`);
        if (desvio25.length) alertas.push(`⚠ Desvio acima de 25% entre estimado e real: ${desvio25.map(c => c.label).join(', ')}`);
        if (semData.length) alertas.push(`⚠ ${semData.length} lançamento(s) sem data preenchida`);
        if (alertas.length) alertas.forEach(txt => linhasAna.push({ kind: 'alert', cells: [txt], merge: [0, 4] }));
        else linhasAna.push({ kind: 'alertok', cells: ['✓ DRE CONSISTENTE — nenhuma pendência encontrada'], merge: [0, 4] });

        const wsAna = mkSheet(
            `ANÁLISE DA DRE — ${idProj} — ${gerado}`,
            ['Indicador / Conta', 'Estimado', 'Real', 'Variação', 'Nota'],
            linhasAna,
            [44, 16, 16, 16, 40]
        );

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsDre, 'DRE');
        XLSX.utils.book_append_sheet(wb, wsDet, 'Detalhamento');
        XLSX.utils.book_append_sheet(wb, wsLanc, 'Lançamentos');
        XLSX.utils.book_append_sheet(wb, wsAna, 'Análise');
        return { wb, nLanc: custos.length };
    },

    /**
     * Injeta freeze pane (ySplit primeiras linhas congeladas) num XLSX gerado pelo SheetJS.
     * O xlsx-js-style não suporta !freeze no write — este helper faz post-processamento
     * no zip: descomprime as folhas, insere o <pane> e reconstrói o zip.
     */
    async _patchXlsxFreezePane(arrayBuffer, ySplit = 1) {
        const orig = new Uint8Array(arrayBuffer);
        const dv = new DataView(orig.buffer);
        const entries = [];
        let pos = 0;
        while (pos < orig.length - 4) {
            if (dv.getUint32(pos, true) === 0x04034b50) {
                const method = dv.getUint16(pos + 8, true);
                const compSize = dv.getUint32(pos + 18, true);
                const nameLen = dv.getUint16(pos + 26, true);
                const extraLen = dv.getUint16(pos + 28, true);
                const nameStart = pos + 30;
                const name = new TextDecoder().decode(orig.slice(nameStart, nameStart + nameLen));
                const dataStart = nameStart + nameLen + extraLen;
                const data = orig.slice(dataStart, dataStart + compSize);
                let content;
                if (method === 8) {
                    const ds = new DecompressionStream('deflate-raw');
                    content = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer());
                } else {
                    content = data;
                }
                entries.push({ name, content });
                pos = dataStart + compSize;
            } else { pos++; }
        }
        let patched = false;
        for (const entry of entries) {
            if (/xl\/worksheets\/sheet\d+\.xml$/.test(entry.name)) {
                let xml = new TextDecoder().decode(entry.content);
                if (!xml.includes('<pane')) {
                    const y = Math.max(1, ySplit | 0);
                    const tl = 'A' + (y + 1);
                    xml = xml.replace(
                        /<sheetView([^>]*)\/>/,
                        `<sheetView$1><pane ySplit="${y}" topLeftCell="${tl}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="${tl}" sqref="${tl}"/></sheetView>`
                    );
                    entry.content = new TextEncoder().encode(xml);
                    patched = true;
                }
            }
        }
        if (!patched) return arrayBuffer;
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c;
        }
        const crc32 = (buf) => {
            let crc = 0xFFFFFFFF;
            for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
            return (crc ^ 0xFFFFFFFF) >>> 0;
        };
        const chunks = [], cdEntries = [];
        let offset = 0;
        for (const entry of entries) {
            const nameBytes = new TextEncoder().encode(entry.name);
            const crc = crc32(entry.content);
            const size = entry.content.length;
            const local = new Uint8Array(30 + nameBytes.length);
            const lv = new DataView(local.buffer);
            lv.setUint32(0, 0x04034b50, true);
            lv.setUint16(4, 20, true);
            lv.setUint16(8, 0, true);
            lv.setUint32(14, crc, true);
            lv.setUint32(18, size, true);
            lv.setUint32(22, size, true);
            lv.setUint16(26, nameBytes.length, true);
            local.set(nameBytes, 30);
            chunks.push(local, entry.content);
            const cd = new Uint8Array(46 + nameBytes.length);
            const cv = new DataView(cd.buffer);
            cv.setUint32(0, 0x02014b50, true);
            cv.setUint16(4, 20, true);
            cv.setUint16(6, 20, true);
            cv.setUint16(10, 0, true);
            cv.setUint32(16, crc, true);
            cv.setUint32(20, size, true);
            cv.setUint32(24, size, true);
            cv.setUint16(28, nameBytes.length, true);
            cv.setUint32(42, offset, true);
            cd.set(nameBytes, 46);
            cdEntries.push(cd);
            offset += local.length + size;
        }
        const cdTotal = cdEntries.reduce((s, e) => s + e.length, 0);
        const eocd = new Uint8Array(22);
        const ev = new DataView(eocd.buffer);
        ev.setUint32(0, 0x06054b50, true);
        ev.setUint16(8, entries.length, true);
        ev.setUint16(10, entries.length, true);
        ev.setUint32(12, cdTotal, true);
        ev.setUint32(16, offset, true);
        const all = [...chunks, ...cdEntries, eocd];
        const totalLen = all.reduce((s, c) => s + c.length, 0);
        const result = new Uint8Array(totalLen);
        let wp = 0;
        for (const c of all) { result.set(c, wp); wp += c.length; }
        return result.buffer;
    },

    /* ================================================================
       FASE 2 — CRONOGRAMA / GANTT (entidade projeto_fases)
       ================================================================ */

    _fasesDoProjeto(projetoId) {
        const fases = (store.getState().projetoFases || []).filter(f => f.projeto_id === projetoId);
        fases.sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
        return fases;
    },

    _progressoProjeto(projetoId) {
        const fases = this._fasesDoProjeto(projetoId);
        if (fases.length === 0) return null;
        const soma = fases.reduce((s, f) => s + Math.max(0, Math.min(100, parseFloat(f.progresso) || 0)), 0);
        return Math.round(soma / fases.length);
    },

    /* Mini barra de progresso exibida na tabela da lista */
    _progressoMiniHTML(projetoId) {
        const fases = this._fasesDoProjeto(projetoId);
        if (fases.length === 0) return '<span class="prj-sub">sem cronograma</span>';
        const prog = this._progressoProjeto(projetoId);
        const concl = fases.filter(f => f.status === 'concluido').length;
        return `
            <div class="prj-mini-prog" title="${concl}/${fases.length} fases concluídas · ${prog}%">
                <div class="prj-mini-prog-track"><div style="width:${prog}%"></div></div>
                <span>${concl}/${fases.length} · ${prog}%</span>
            </div>`;
    },

    /* ================================================================
       Fase 4 — SUBTAREFAS POR FASE (entidade projeto_tarefas)
       ================================================================ */

    _tarefasDoProjeto(projetoId) {
        const tarefas = (store.getState().projetoTarefas || []).filter(t => t.projeto_id === projetoId);
        tarefas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
        return tarefas;
    },

    _tarefasDaFase(faseId) {
        const tarefas = (store.getState().projetoTarefas || []).filter(t => t.fase_id === faseId);
        tarefas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
        return tarefas;
    },

    /* Progresso delegado: fase COM tarefas tem progresso = média das tarefas
       (materializado em fase.progresso para lista/resumo lerem o mesmo valor);
       fase SEM tarefas mantém o progresso manual digitado. */
    _recalcProgressoFase(faseId) {
        const f = (store.getState().projetoFases || []).find(x => x.id === faseId);
        if (!f) return;
        const tarefas = this._tarefasDaFase(faseId);
        if (tarefas.length === 0) return;
        const soma = tarefas.reduce((s, t) => s + Math.max(0, Math.min(100, parseFloat(t.progresso) || 0)), 0);
        const media = Math.round(soma / tarefas.length);
        if ((parseFloat(f.progresso) || 0) !== media) {
            store.updateProjetoFase(faseId, { progresso: media });
        }
    },

    _faseExpandida(faseId) {
        return Array.isArray(this.ganttExpandido) && this.ganttExpandido.includes(faseId);
    },

    _persisteExpandido() {
        try { localStorage.setItem('gerapro_prj_gantt_exp', JSON.stringify(this.ganttExpandido || [])); } catch (e) { /* ignora */ }
    },

    toggleFaseExpandida(faseId) {
        const set = new Set(this.ganttExpandido || []);
        if (set.has(faseId)) set.delete(faseId); else set.add(faseId);
        this.ganttExpandido = [...set];
        this._persisteExpandido();
        this.renderDetail();
    },

    toggleExpandirTodas(projetoId) {
        const comTarefas = this._fasesDoProjeto(projetoId).filter(f => this._tarefasDaFase(f.id).length > 0);
        const todas = comTarefas.length > 0 && comTarefas.every(f => this._faseExpandida(f.id));
        this.ganttExpandido = todas ? [] : comTarefas.map(f => f.id);
        this._persisteExpandido();
        this.renderDetail();
    },

    toggleGanttTarefas() {
        this.ganttTarefas = !this.ganttTarefas;
        try { localStorage.setItem('gerapro_prj_gantt_tarefas', this.ganttTarefas ? '1' : '0'); } catch (e) { /* ignora */ }
        this.renderDetail();
    },

    setZoom(v) {
        this.ganttZoom = GANTT_ZOOM[v] !== undefined ? v : 'auto';
        this.renderDetail();
    },

    _cronogramaHTML(p) {
        const fases = this._fasesDoProjeto(p.id);
        const prog = this._progressoProjeto(p.id);
        const tarefas = this._tarefasDoProjeto(p.id);
        const mostrarTarefas = this.ganttTarefas !== false && tarefas.length > 0;
        const comTarefas = fases.filter(f => this._tarefasDaFase(f.id).length > 0);
        const todasExpandidas = mostrarTarefas && comTarefas.length > 0 && comTarefas.every(f => this._faseExpandida(f.id));

        const toolbar = `
            <div class="prj-gantt-toolbar">
                <div class="prj-gantt-title">
                    <i class="ph ph-chart-bar-horizontal"></i> Cronograma
                    <span class="prj-gantt-count">${fases.length} fase(s)${tarefas.length ? ' · ' + tarefas.length + ' tarefa(s)' : ''}</span>
                </div>
                <div class="prj-gantt-controls">
                    <select class="prj-filter" onchange="app.projetos.setZoom(this.value)" title="Escala do Gantt">
                        <option value="auto" ${(this.ganttZoom || 'auto') === 'auto' ? 'selected' : ''}>Escala: Automática</option>
                        <option value="dia" ${this.ganttZoom === 'dia' ? 'selected' : ''}>Escala: Dia</option>
                        <option value="semana" ${this.ganttZoom === 'semana' ? 'selected' : ''}>Escala: Semana</option>
                        <option value="mes" ${this.ganttZoom === 'mes' ? 'selected' : ''}>Escala: Mês</option>
                    </select>
                    <button class="btn btn-sm btn-ghost" onclick="app.projetos.openTemplateModal()" title="Editar o modelo padrão de fases">
                        <i class="ph ph-sliders-horizontal"></i> Modelo
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="app.projetos.seedFases('${p.id}')" title="Criar as 7 fases padrão distribuídas no período do projeto">
                        <i class="ph ph-magic-wand"></i> Gerar Fases Padrão
                    </button>
                    <button class="btn btn-sm btn-ghost ${this.ganttTarefas !== false ? 'prj-btn-on' : ''}" onclick="app.projetos.toggleGanttTarefas()" title="Mostrar ou ocultar as tarefas (subtarefas) das fases no Gantt">
                        <i class="ph ${this.ganttTarefas !== false ? 'ph-eye' : 'ph-eye-slash'}"></i> Tarefas
                    </button>
                    ${mostrarTarefas ? `<button class="btn btn-sm btn-ghost" onclick="app.projetos.toggleExpandirTodas('${p.id}')" title="${todasExpandidas ? 'Recolher' : 'Exibir'} as tarefas de todas as fases">
                        <i class="ph ${todasExpandidas ? 'ph-arrows-in' : 'ph-arrows-out'}"></i> ${todasExpandidas ? 'Recolher' : 'Expandir'}
                    </button>` : ''}
                    <button class="btn btn-sm btn-ghost" onclick="app.projetos.exportarCronogramaPDF('${p.id}')" title="Exportar o cronograma em PDF formatado (Gantt, fases, tarefas e assinaturas — imprima ou salve como PDF)">
                        <i class="ph ph-file-pdf"></i> PDF
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="app.projetos.exportarCronogramaXLSX('${p.id}')" title="Exportar o cronograma em XLSX estilo MS Project (WBS, fases, tarefas, faixa de Gantt mensal e resumo)">
                        <i class="ph ph-file-xls"></i> XLSX
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="app.projetos.openFaseModal('${p.id}')">
                        <i class="ph ph-plus"></i> Nova Fase
                    </button>
                </div>
            </div>`;

        if (fases.length === 0) {
            return toolbar + `
                <div class="prj-placeholder">
                    <i class="ph ph-chart-bar-horizontal"></i>
                    <h3>Cronograma vazio</h3>
                    <p>Crie as fases manualmente ou gere o <strong>modelo padrão</strong> (Planejamento, Compras, Manufatura, Testes, Logística, Instalação e Aceite), distribuído automaticamente entre a data de início e a entrega prevista.</p>
                    <button class="btn btn-primary" onclick="app.projetos.seedFases('${p.id}')"><i class="ph ph-magic-wand"></i> Gerar Fases Padrão</button>
                </div>`;
        }

        /* --- Período do Gantt --- */
        const hoje = this._today();
        const datas = [];
        fases.forEach(f => { if (f.data_inicio) datas.push(this._parseDate(f.data_inicio)); if (f.data_fim) datas.push(this._parseDate(f.data_fim)); });
        if (p.data_inicio) datas.push(this._parseDate(p.data_inicio));
        if (p.data_prevista_entrega) datas.push(this._parseDate(p.data_prevista_entrega));
        datas.push(hoje);
        let min = new Date(Math.min(...datas.map(d => d.getTime())));
        let max = new Date(Math.max(...datas.map(d => d.getTime())));
        min = this._addDays(min, -3);
        max = this._addDays(max, 4);
        if (this._diffDays(min, max) < 14) max = this._addDays(min, 14);
        const totalDias = this._diffDays(min, max) + 1;

        let colWidth = GANTT_ZOOM[this.ganttZoom || 'auto'];
        if (!colWidth) colWidth = Math.max(3, Math.min(28, Math.round(880 / totalDias)));
        const totalW = totalDias * colWidth;
        this._gantt = { colWidth, min: this._iso(min) };

        /* --- Cabeçalho de meses --- */
        let months = '';
        let cur = new Date(min.getFullYear(), min.getMonth(), 1);
        while (cur <= max) {
            const mStart = cur < min ? min : cur;
            const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            const mEnd = nextMonth > max ? max : this._addDays(nextMonth, -1);
            const left = this._diffDays(min, mStart) * colWidth;
            const width = (this._diffDays(mStart, mEnd) + 1) * colWidth;
            const label = cur.toLocaleDateString('pt-BR', { month: 'short' }).replace(/\./g, '') + '/' + String(cur.getFullYear()).slice(2);
            months += `<div class="prj-gantt-month" style="left:${left}px;width:${width}px">${label}</div>`;
            cur = nextMonth;
        }

        /* --- Linha de dias (apenas em escalas próximas do dia) --- */
        let daysRow = '';
        if (colWidth >= 14) {
            const NOMES_DIA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
            for (let i = 0; i < totalDias; i++) {
                const d = this._addDays(min, i);
                const isHoje = this._iso(d) === this._iso(hoje);
                const fds = d.getDay() === 0 || d.getDay() === 6;
                daysRow += `<div class="prj-gantt-day ${isHoje ? 'today' : ''}${fds && !isHoje ? ' weekend' : ''}" style="left:${i * colWidth}px;width:${colWidth}px">
                    <span>${d.getDate()}</span><small>${NOMES_DIA[d.getDay()]}</small></div>`;
            }
        }

        /* --- Marcador de hoje --- */
        const hojeX = this._diffDays(min, hoje) * colWidth + colWidth / 2;
        const hojeHTML = `<div class="prj-gantt-today-line" style="left:${260 + hojeX}px" title="Hoje — ${this._fmtDate(this._iso(hoje))}"></div>`;

        /* --- Linhas (fases) + subtarefas (Fase 4) --- */
        const ganttCtx = { min, colWidth, hoje, totalW };
        const linhas = fases.map(f => {
            const atrasada = f.status !== 'concluido' && f.data_fim && this._parseDate(f.data_fim) < hoje;
            const cor = f.cor || FASE_CORES[f.status] || FASE_CORES.pendente;
            const progF = Math.max(0, Math.min(100, parseFloat(f.progresso) || 0));
            const tarefasFase = this._tarefasDaFase(f.id);
            const temTarefas = tarefasFase.length > 0;
            const expandida = mostrarTarefas && temTarefas && this._faseExpandida(f.id);
            const nConcl = tarefasFase.filter(t => t.status === 'concluido').length;

            let bar = '';
            if (f.data_inicio) {
                const ini = this._parseDate(f.data_inicio);
                const fim = f.data_fim ? this._parseDate(f.data_fim) : ini;
                const left = Math.max(0, this._diffDays(min, ini) * colWidth);
                const dur = Math.max(1, this._diffDays(ini, fim) + 1);
                const width = Math.max(6, dur * colWidth);
                const mile = dur === 1 && f.status === 'concluido' ? ' milestone' : '';
                const titulo = `${f.nome} · ${this._fmtDate(f.data_inicio)}${f.data_fim ? ' → ' + this._fmtDate(f.data_fim) : ''} · ${dur} dia(s) · ${progF}%`;
                bar = `
                    <div class="prj-gantt-bar${mile}${atrasada ? ' atrasada' : ''}" data-fase="${f.id}"
                         style="left:${left}px;width:${width}px;background:${cor}"
                         onpointerdown="app.projetos.barDown(event, '${f.id}')"
                         title="${this._esc(titulo)} — arraste para reprogramar, clique para editar">
                        <div class="prj-gantt-bar-fill" style="width:${progF}%"></div>
                        ${width >= 46 ? `<span class="prj-gantt-bar-label">${this._esc(f.nome)}</span>` : ''}
                    </div>`;
            } else {
                bar = `<div class="prj-gantt-nodate">sem datas</div>`;
            }

            const linhaFase = `
                <div class="prj-gantt-row">
                    <div class="prj-gantt-row-left">
                        <div class="prj-gantt-name">
                            ${temTarefas && mostrarTarefas
                                ? `<button class="prj-gantt-chevron ${expandida ? 'open' : ''}" onclick="app.projetos.toggleFaseExpandida('${f.id}')" title="${expandida ? 'Recolher' : 'Exibir'} as ${tarefasFase.length} tarefa(s) desta fase"><i class="ph ph-caret-right"></i></button>`
                                : ''}
                            <span class="prj-gantt-dot" style="background:${cor}"></span>
                            <span title="${this._esc(f.nome)}">${this._esc(f.nome)}</span>
                        </div>
                        <div class="prj-gantt-meta">
                            ${this._fmtDate(f.data_inicio) || '—'}${f.data_fim ? ' → ' + this._fmtDate(f.data_fim) : ''}
                            · <b>${progF}%</b>
                            ${temTarefas ? `<span class="prj-chip-tarefas" title="${nConcl}/${tarefasFase.length} tarefa(s) concluída(s)">${nConcl}/${tarefasFase.length} tarefas</span>` : ''}
                            ${atrasada ? '<span class="prj-gantt-attr">atrasada</span>' : ''}
                        </div>
                        <div class="prj-gantt-row-actions">
                            <button onclick="app.projetos.openTarefaModal('${p.id}', '${f.id}')" title="Adicionar tarefa nesta fase"><i class="ph ph-list-plus"></i></button>
                            <button onclick="app.projetos.openFaseModal('${p.id}', '${f.id}')" title="Editar fase"><i class="ph ph-pencil-simple"></i></button>
                            <button onclick="app.projetos.toggleFase('${f.id}')" title="${f.status === 'concluido' ? 'Reabrir fase' : 'Marcar como concluída'}"><i class="ph ph-check-circle"></i></button>
                            <button onclick="app.projetos.moveFase('${f.id}', -1)" title="Mover para cima"><i class="ph ph-arrow-up"></i></button>
                            <button onclick="app.projetos.moveFase('${f.id}', 1)" title="Mover para baixo"><i class="ph ph-arrow-down"></i></button>
                            <button class="prj-danger" onclick="app.projetos.removeFase('${f.id}')" title="Excluir fase"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                    <div class="prj-gantt-row-track" style="width:${totalW}px;${colWidth >= 8 ? `background-size:${colWidth}px 100%;` : ''}">${bar}</div>
                </div>`;

            /* Fase 4 — linhas de subtarefas sob a fase expandida */
            const linhasTarefas = expandida ? tarefasFase.map(t => this._tarefaRowHTML(p, f, t, ganttCtx)).join('') : '';
            return linhaFase + linhasTarefas;
        }).join('');

        /* --- Legenda / resumo --- */
        const contagem = Object.keys(FASE_STATUS).map(k => {
            const n = fases.filter(f => (f.status || 'pendente') === k).length;
            if (!n) return '';
            return `<span class="prj-gantt-leg"><i style="background:${FASE_CORES[k]}"></i>${FASE_STATUS[k]} (${n})</span>`;
        }).join('');

        return toolbar + `
            <div class="prj-gantt-summary">
                <div class="prj-gantt-progress">
                    <div class="prj-gantt-progress-label">Progresso geral <b>${prog}%</b></div>
                    <div class="prj-gantt-progress-track"><div style="width:${prog}%"></div></div>
                </div>
                <div class="prj-gantt-legends">${contagem}</div>
            </div>
            <div class="prj-gantt">
                <div class="prj-gantt-scroll">
                    <div class="prj-gantt-inner" style="width:${260 + totalW}px">
                        <div class="prj-gantt-head">
                            <div class="prj-gantt-head-left">Fases</div>
                            <div class="prj-gantt-head-track" style="width:${totalW}px">
                                ${months}
                                <div class="prj-gantt-days">${daysRow}</div>
                            </div>
                        </div>
                        ${hojeHTML}
                        ${linhas}
                    </div>
                </div>
            </div>
            <div class="prj-gantt-hint"><i class="ph ph-info"></i> Arraste uma barra para reprogramar (fase ou tarefa) e clique nela para editar. Use a seta <i class="ph ph-caret-right" style="font-size:11px;vertical-align:-1px"></i> da fase para expandir as subtarefas; o botão <b>Tarefas</b> mostra/oculta esse nível.</div>`;
    },

    /* --- Linha de subtarefa no Gantt (Fase 4) --- */
    _tarefaRowHTML(p, f, t, g) {
        const atrasada = t.status !== 'concluido' && t.data_fim && this._parseDate(t.data_fim) < g.hoje;
        const corT = TAREFA_CORES[t.status] || TAREFA_CORES.pendente;
        const progT = Math.max(0, Math.min(100, parseFloat(t.progresso) || 0));
        const concluida = t.status === 'concluido';

        let bar = '';
        if (t.data_inicio) {
            const ini = this._parseDate(t.data_inicio);
            const fim = t.data_fim ? this._parseDate(t.data_fim) : ini;
            const left = Math.max(0, this._diffDays(g.min, ini) * g.colWidth);
            const dur = Math.max(1, this._diffDays(ini, fim) + 1);
            const width = Math.max(6, dur * g.colWidth);
            const titulo = `${t.nome} · ${this._fmtDate(t.data_inicio)}${t.data_fim ? ' → ' + this._fmtDate(t.data_fim) : ''} · ${dur} dia(s) · ${progT}%`;
            bar = `
                <div class="prj-gantt-bar prj-bar-tarefa${atrasada ? ' atrasada' : ''}" data-tarefa="${t.id}"
                     style="left:${left}px;width:${width}px;background:${corT}"
                     onpointerdown="app.projetos.barDown(event, '${t.id}', 'tarefa')"
                     title="${this._esc(titulo)} — arraste para reprogramar, clique para editar">
                    <div class="prj-gantt-bar-fill" style="width:${progT}%"></div>
                    ${width >= 46 ? `<span class="prj-gantt-bar-label">${this._esc(t.nome)}</span>` : ''}
                </div>`;
        } else {
            bar = `<div class="prj-gantt-nodate">sem datas</div>`;
        }

        return `
            <div class="prj-gantt-row prj-tarefa">
                <div class="prj-gantt-row-left">
                    <div class="prj-gantt-name prj-tarefa-name">
                        <button class="prj-t-check ${concluida ? 'ok' : ''}" onclick="app.projetos.toggleTarefa('${t.id}')" title="${concluida ? 'Reabrir tarefa' : 'Marcar como concluída'}"><i class="ph ${concluida ? 'ph-check-circle' : 'ph-circle'}"></i></button>
                        <span title="${this._esc(t.nome)}">${this._esc(t.nome)}</span>
                        ${t.responsavel ? `<small class="prj-t-resp" title="Responsável: ${this._esc(t.responsavel)}">${this._esc(t.responsavel)}</small>` : ''}
                    </div>
                    <div class="prj-gantt-meta">
                        ${this._fmtDate(t.data_inicio) || '—'}${t.data_fim ? ' → ' + this._fmtDate(t.data_fim) : ''}
                        · <b>${progT}%</b>
                        ${atrasada ? '<span class="prj-gantt-attr">atrasada</span>' : ''}
                    </div>
                    <div class="prj-gantt-row-actions">
                        <button onclick="app.projetos.openTarefaModal('${p.id}', '${f.id}', '${t.id}')" title="Editar tarefa"><i class="ph ph-pencil-simple"></i></button>
                        <button onclick="app.projetos.moveTarefa('${t.id}', -1)" title="Mover para cima"><i class="ph ph-arrow-up"></i></button>
                        <button onclick="app.projetos.moveTarefa('${t.id}', 1)" title="Mover para baixo"><i class="ph ph-arrow-down"></i></button>
                        <button class="prj-danger" onclick="app.projetos.removeTarefa('${t.id}')" title="Excluir tarefa"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <div class="prj-gantt-row-track prj-track-tarefa" style="width:${g.totalW}px;${g.colWidth >= 8 ? `background-size:${g.colWidth}px 100%;` : ''}">${bar}</div>
            </div>`;
    },

    /* ================================================================
       EXPORTAÇÃO — CRONOGRAMA EM PDF (impressão formatada)
       Abre a janela de impressão do navegador em A4 paisagem:
       cabeçalho da empresa, dados do projeto, resumo, Gantt com
       fases e tarefas, tabela detalhada, legenda e assinaturas.
       ================================================================ */

    exportarCronogramaPDF(projetoId) {
        const p = (store.getState().projetos || []).find(x => x.id === projetoId);
        if (!p) return;
        const fases = this._fasesDoProjeto(projetoId);
        if (fases.length === 0) {
            window.app.toast('O cronograma está vazio — crie as fases antes de exportar o PDF.', 'warning');
            return;
        }
        try {
            const html = this._buildCronogramaPdfHTML(projetoId, p);
            const win = window.open('', '_blank', 'width=1100,height=760');
            if (!win) { window.app.toast('Permita pop-ups para exportar o cronograma em PDF.', 'error'); return; }
            win.document.write(html);
            win.document.close();
            window.app.toast('Cronograma aberto para impressão — escolha "Salvar como PDF".', 'success');
        } catch (e) {
            console.error('[Projetos] Cronograma PDF error:', e);
            window.app.toast('Erro ao exportar cronograma: ' + e.message, 'error');
        }
    },

    /** Constrói o HTML do cronograma formatado (somente leitura do
     *  estado) — usado pela exportação e validável sem abrir janela. */
    _buildCronogramaPdfHTML(projetoId, p) {
        const esc = (v) => this._esc(v);
        const emp = store.getState().company || {};
        const fases = this._fasesDoProjeto(projetoId);
        const tarefas = this._tarefasDoProjeto(projetoId);
        const prog = this._progressoProjeto(projetoId) || 0;
        const hoje = this._today();
        const fmtD = (v) => this._fmtDate(v) || '—';
        const pct = (v) => Math.max(0, Math.min(100, Math.round(parseFloat(v) || 0)));
        const durD = (ini, fim) => (ini && fim && this._parseDate(ini) && this._parseDate(fim))
            ? this._diffDays(this._parseDate(ini), this._parseDate(fim)) + 1 : null;
        const atrasadaDe = (x) => x.status !== 'concluido' && x.data_fim && this._parseDate(x.data_fim) && this._parseDate(x.data_fim) < hoje;

        /* --- Período do Gantt (mesma regra da tela, com tarefas na conta) --- */
        const datas = [];
        fases.forEach(f => { if (f.data_inicio) datas.push(this._parseDate(f.data_inicio)); if (f.data_fim) datas.push(this._parseDate(f.data_fim)); });
        tarefas.forEach(t => { if (t.data_inicio) datas.push(this._parseDate(t.data_inicio)); if (t.data_fim) datas.push(this._parseDate(t.data_fim)); });
        if (p.data_inicio) datas.push(this._parseDate(p.data_inicio));
        if (p.data_prevista_entrega) datas.push(this._parseDate(p.data_prevista_entrega));
        datas.push(hoje);
        let min = new Date(Math.min(...datas.map(d => d.getTime())));
        let max = new Date(Math.max(...datas.map(d => d.getTime())));
        min = this._addDays(min, -3);
        max = this._addDays(max, 4);
        if (this._diffDays(min, max) < 14) max = this._addDays(min, 14);
        const totalDias = this._diffDays(min, max) + 1;
        const pctDe = (d) => Math.max(0, Math.min(100, this._diffDays(min, d) / totalDias * 100));

        /* --- Cabeçalho de meses e grades verticais (em % para caber na página) --- */
        let meses = '';
        let grid = '';
        let cur = new Date(min.getFullYear(), min.getMonth(), 1);
        while (cur <= max) {
            const mStart = cur < min ? min : cur;
            const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            const mEnd = nextMonth > max ? max : this._addDays(nextMonth, -1);
            const dias = this._diffDays(mStart, mEnd) + 1;
            const label = cur.toLocaleDateString('pt-BR', { month: 'short' }).replace(/\./g, '') + '/' + String(cur.getFullYear()).slice(2);
            meses += `<div class="mcol" style="width:${(dias / totalDias * 100).toFixed(3)}%">${esc(label)}</div>`;
            if (cur > min) grid += `<div class="gline" style="left:${pctDe(cur).toFixed(3)}%"></div>`;
            cur = nextMonth;
        }
        const hojeX = pctDe(hoje).toFixed(3);

        /* --- Barras do Gantt (posicionadas em % — cabem em qualquer página) --- */
        const barra = (iniStr, fimStr, cor, progF, atrasada, nome, ehTarefa) => {
            if (!iniStr || !this._parseDate(iniStr)) return '<span class="nodate">sem datas</span>';
            const ini = this._parseDate(iniStr);
            const fim = (fimStr && this._parseDate(fimStr)) || ini;
            const left = pctDe(ini);
            const width = Math.max(0.5, (this._diffDays(ini, fim) + 1) / totalDias * 100);
            const mile = this._diffDays(ini, fim) === 0 ? ' ms' : '';
            return `<div class="bar${mile}${atrasada ? ' atrasada' : ''}" style="left:${left.toFixed(3)}%;width:${Math.min(width, 100 - left).toFixed(3)}%;background:${esc(cor)}">
                <div class="fill" style="width:${progF}%"></div>
                ${ehTarefa ? '' : `<span class="lab">${esc(nome)}</span>`}
            </div>`;
        };

        /* --- Linhas do Gantt: fases e, logo abaixo, as tarefas --- */
        const linhasGantt = fases.map(f => {
            const cor = f.cor || FASE_CORES[f.status] || FASE_CORES.pendente;
            const progF = pct(f.progresso);
            const atrasada = atrasadaDe(f);
            const tarefasF = this._tarefasDaFase(f.id);
            const nConcl = tarefasF.filter(t => t.status === 'concluido').length;
            let h = `<div class="row">
                <div class="lbl">
                    <span class="dot" style="background:${esc(cor)}"></span><b>${esc(f.nome)}</b>
                    <small>${fmtD(f.data_inicio)}${f.data_fim ? ' → ' + fmtD(f.data_fim) : ''} · ${progF}%${tarefasF.length ? ` · ${nConcl}/${tarefasF.length} tarefas` : ''}${atrasada ? ' · <i class="at">atrasada</i>' : ''}</small>
                </div>
                <div class="track">${grid}<div class="hoje" style="left:${hojeX}%"></div>${barra(f.data_inicio, f.data_fim, cor, progF, atrasada, f.nome, false)}</div>
            </div>`;
            h += tarefasF.map(t => {
                const corT = TAREFA_CORES[t.status] || TAREFA_CORES.pendente;
                const progT = pct(t.progresso);
                const atrT = atrasadaDe(t);
                return `<div class="row tf">
                    <div class="lbl">
                        <span class="dot" style="background:${esc(corT)}"></span><span class="tn">${esc(t.nome)}</span>
                        <small>${fmtD(t.data_inicio)}${t.data_fim ? ' → ' + fmtD(t.data_fim) : ''} · ${progT}%${t.responsavel ? ' · ' + esc(t.responsavel) : ''}${atrT ? ' · <i class="at">atrasada</i>' : ''}</small>
                    </div>
                    <div class="track">${grid}<div class="hoje" style="left:${hojeX}%"></div>${barra(t.data_inicio, t.data_fim, corT, progT, atrT, t.nome, true)}</div>
                </div>`;
            }).join('');
            return h;
        }).join('');

        /* --- Tabela detalhada: fases e tarefas com datas, duração e progresso --- */
        const linhasTabela = fases.map(f => {
            const cor = f.cor || FASE_CORES[f.status] || FASE_CORES.pendente;
            const progF = pct(f.progresso);
            const tarefasF = this._tarefasDaFase(f.id);
            const atrasada = atrasadaDe(f);
            let h = `<tr class="f">
                <td><span class="dot" style="background:${esc(cor)}"></span><b>${esc(f.nome)}</b></td>
                <td>${esc(FASE_STATUS[f.status] || 'Pendente')}${atrasada ? ' <i class="at">(atrasada)</i>' : ''}</td>
                <td class="c">${fmtD(f.data_inicio)}</td>
                <td class="c">${fmtD(f.data_fim)}</td>
                <td class="c">${durD(f.data_inicio, f.data_fim) !== null ? durD(f.data_inicio, f.data_fim) + ' d' : '—'}</td>
                <td class="c">${tarefasF.length ? tarefasF.filter(t => t.status === 'concluido').length + '/' + tarefasF.length : '—'}</td>
                <td class="c pc"><div class="pbar"><div style="width:${progF}%"></div></div>${progF}%</td>
            </tr>`;
            h += tarefasF.map(t => {
                const corT = TAREFA_CORES[t.status] || TAREFA_CORES.pendente;
                const progT = pct(t.progresso);
                const atrT = atrasadaDe(t);
                return `<tr class="t">
                    <td class="ind"><span class="dot" style="background:${esc(corT)}"></span>${esc(t.nome)}</td>
                    <td>${esc(TAREFA_STATUS[t.status] || 'Pendente')}${atrT ? ' <i class="at">(atrasada)</i>' : ''}${t.responsavel ? ` <span class="resp">(${esc(t.responsavel)})</span>` : ''}</td>
                    <td class="c">${fmtD(t.data_inicio)}</td>
                    <td class="c">${fmtD(t.data_fim)}</td>
                    <td class="c">${durD(t.data_inicio, t.data_fim) !== null ? durD(t.data_inicio, t.data_fim) + ' d' : '—'}</td>
                    <td class="c">—</td>
                    <td class="c pc"><div class="pbar"><div style="width:${progT}%"></div></div>${progT}%</td>
                </tr>`;
            }).join('');
            return h;
        }).join('');

        /* --- Resumo, legenda e assinaturas --- */
        const conclF = fases.filter(f => f.status === 'concluido').length;
        const conclT = tarefas.filter(t => t.status === 'concluido').length;
        const atrasadas = fases.filter(atrasadaDe).length + tarefas.filter(atrasadaDe).length;
        const legenda = Object.keys(FASE_STATUS).map(k => {
            const n = fases.filter(f => (f.status || 'pendente') === k).length + tarefas.filter(t => (t.status || 'pendente') === k).length;
            return `<span class="leg"><i style="background:${FASE_CORES[k]}"></i>${FASE_STATUS[k]}${n ? ` (${n})` : ''}</span>`;
        }).join('');

        const logo = emp.logoUrl ? `<img src="${esc(emp.logoUrl)}" alt="">` : '';

        return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
        <title>Cronograma ${esc(p.codigo)}</title>
        <style>
            @page { size: A4 landscape; margin: 10mm; }
            * { box-sizing:border-box; margin:0; padding:0; }
            body { font-family:'Segoe UI',Arial,sans-serif; font-size:10.5px; color:#111; padding:14px 18px;
                   -webkit-print-color-adjust:exact; print-color-adjust:exact; }
            h1 { font-size:15px; letter-spacing:.6px; text-transform:uppercase; border-bottom:2.5px solid #111;
                 padding-bottom:7px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:baseline; }
            h1 .cod { font-size:13px; }
            .top { display:flex; justify-content:space-between; align-items:flex-start; }
            .top .logo img { max-height:44px; max-width:170px; }
            .top .emp { text-align:right; font-size:10px; color:#444; }
            .top .emp b { display:block; font-size:11.5px; color:#111; text-transform:uppercase; letter-spacing:.4px; }
            .meta { display:grid; grid-template-columns:repeat(4,1fr); gap:3px 24px; margin-bottom:12px; }
            .meta div { font-size:10px; }
            .meta b { display:inline-block; min-width:96px; color:#555; }
            .resumo { display:flex; gap:8px; margin-bottom:12px; }
            .resumo .card { flex:1; border:1px solid #ddd; border-top:3px solid #111; padding:6px 9px; }
            .resumo .k { font-size:8.5px; text-transform:uppercase; letter-spacing:.5px; color:#666; }
            .resumo .v { font-size:15px; font-weight:800; margin-top:1px; }
            .resumo .v small { font-size:9.5px; font-weight:600; color:#555; }
            .resumo .v.at { color:#dc2626; }
            h2 { font-size:11px; text-transform:uppercase; letter-spacing:.7px; margin:14px 0 7px;
                 border-bottom:1px solid #111; padding-bottom:3px; }
            .gantt { border:1px solid #ccc; }
            .ghead { display:flex; background:#111; color:#fff; font-weight:700; }
            .ghead .hleft { flex:0 0 68mm; padding:5px 7px; text-transform:uppercase; font-size:9px; letter-spacing:.5px; border-right:1px solid #555; }
            .ghead .htrack { flex:1; position:relative; display:flex; }
            .mcol { border-right:1px solid rgba(255,255,255,.35); text-align:center; font-size:8.5px; padding:4px 0;
                    overflow:hidden; white-space:nowrap; text-transform:uppercase; }
            .hmeses { position:absolute; left:0; right:0; top:0; bottom:0; display:flex; pointer-events:none; }
            .hhoje { position:absolute; top:0; bottom:0; border-left:2px dashed #dc2626; pointer-events:none; }
            .hhoje span { position:absolute; top:1px; left:2px; font-size:7.5px; color:#dc2626; font-weight:700; }
            .row { display:flex; border-top:1px solid #eee; }
            .row .lbl { flex:0 0 68mm; padding:3px 7px; border-right:1px solid #ddd; overflow:hidden; }
            .row .lbl b { font-size:10px; }
            .row .lbl small { display:block; font-size:8.5px; color:#666; margin-left:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .row .track { flex:1; position:relative; height:30px; }
            .row.tf .lbl { background:#f7f7f8; padding-left:16px; }
            .row.tf .track { height:20px; background:#fcfcfc; }
            .dot { display:inline-block; width:8px; height:8px; border-radius:2px; margin-right:5px; vertical-align:0; }
            .tn { font-size:9.5px; }
            .bar { position:absolute; top:6px; height:18px; border-radius:3px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,.25); }
            .row.tf .bar { top:4px; height:12px; border-radius:2px; }
            .bar .fill { position:absolute; left:0; top:0; bottom:0; background:rgba(255,255,255,.4); border-right:1px solid rgba(255,255,255,.6); }
            .bar .lab { position:absolute; left:0; right:0; padding:0 6px; font-size:9px; font-weight:700; color:#fff;
                        line-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-shadow:0 1px 1px rgba(0,0,0,.35); }
            .bar.ms { min-width:4px; }
            .bar.atrasada { outline:2px solid #dc2626; outline-offset:-2px; }
            .gline { position:absolute; top:0; bottom:0; border-left:1px solid #e8e8e8; pointer-events:none; }
            .hoje { position:absolute; top:0; bottom:0; border-left:2px dashed #dc2626; opacity:.8; pointer-events:none; }
            .nodate { position:absolute; left:5px; top:50%; transform:translateY(-50%); font-size:8.5px; color:#999; font-style:italic; }
            .at { color:#dc2626; font-style:normal; font-weight:700; }
            table { width:100%; border-collapse:collapse; margin-bottom:6px; }
            th { background:#111; color:#fff; text-transform:uppercase; font-size:8.5px; letter-spacing:.4px;
                 padding:5px 7px; text-align:left; }
            th.c { text-align:center; }
            td { border-bottom:1px solid #e5e7eb; padding:4px 7px; vertical-align:middle; }
            tr.t td { background:#f7f7f8; font-size:9.5px; }
            td.ind { padding-left:19px; }
            td.c, th.c { text-align:center; }
            .pc { min-width:88px; }
            .pbar { display:inline-block; width:44px; height:7px; background:#e5e7eb; border-radius:4px; vertical-align:middle; margin-right:5px; overflow:hidden; }
            .pbar div { height:100%; background:#111; border-radius:4px; }
            .resp { color:#666; font-size:9px; }
            .legenda { display:flex; flex-wrap:wrap; gap:14px; margin-top:7px; font-size:9px; color:#444; }
            .leg i { display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:4px; vertical-align:-1px; }
            .obs { margin-top:8px; font-size:9px; color:#555; }
            .assinaturas { display:flex; gap:50px; margin-top:44px; justify-content:center; }
            .assinaturas div { flex:0 0 250px; text-align:center; border-top:1px solid #111; padding-top:5px; font-size:10px; }
            .assinaturas small { display:block; color:#555; font-size:9px; margin-top:2px; }
            .foot { margin-top:14px; padding-top:6px; border-top:1px solid #ddd; font-size:8.5px; color:#777;
                    display:flex; justify-content:space-between; }
            tr, .row { page-break-inside:avoid; }
            thead { display:table-header-group; }
            @media print { body { padding:0; } }
        </style></head><body>
        <div class="top">
            <div>
                <h1><span>Cronograma do Projeto</span> <span class="cod">${esc(p.codigo)}</span></h1>
                <div class="meta">
                    <div><b>Projeto:</b> ${esc(p.projeto) || '—'}</div>
                    <div><b>Cliente:</b> ${esc(p.cliente) || '—'}</div>
                    <div><b>Status:</b> ${esc(STATUS[p.status] || p.status || '—')}</div>
                    <div><b>Valor:</b> ${window.app.formatCurrency(p.valor_contrato || 0)}</div>
                    <div><b>Início:</b> ${fmtD(p.data_inicio)}</div>
                    <div><b>Entrega Prevista:</b> ${fmtD(p.data_prevista_entrega)}</div>
                    <div><b>Responsável:</b> ${esc(p.responsavel) || '—'}</div>
                    <div><b>Engenheiro:</b> ${esc(p.engenheiro_responsavel) || '—'}</div>
                    <div><b>Vendedor:</b> ${esc(p.vendedor) || '—'}</div>
                    <div><b>Criado em:</b> ${fmtD(p.created_at)}</div>
                </div>
            </div>
            <div class="emp">${logo}<b>${esc(emp.name || 'GeraPro')}</b>${emp.cnpj ? esc(emp.cnpj) : ''}</div>
        </div>
        <div class="resumo">
            <div class="card"><div class="k">Progresso Geral</div><div class="v">${prog}%</div></div>
            <div class="card"><div class="k">Fases</div><div class="v">${conclF}/${fases.length} <small>concluídas</small></div></div>
            <div class="card"><div class="k">Tarefas</div><div class="v">${conclT}/${tarefas.length} <small>concluídas</small></div></div>
            <div class="card"><div class="k">Duração do Cronograma</div><div class="v">${this._diffDays(min, max) + 1} <small>dias corridos</small></div></div>
            <div class="card"><div class="k">Itens Atrasados</div><div class="v ${atrasadas ? 'at' : ''}">${atrasadas}</div></div>
        </div>
        <h2>Linha do Tempo (Gantt)</h2>
        <div class="gantt">
            <div class="ghead">
                <div class="hleft">Fases e Tarefas</div>
                <div class="htrack"><div class="hmeses">${meses}</div><div class="hhoje" style="left:${hojeX}%"><span>Hoje</span></div></div>
            </div>
            ${linhasGantt}
        </div>
        <div class="legenda">${legenda}<span class="leg"><i style="background:#fff;border:1px solid #999"></i>Preenchimento da barra = progresso concluído</span><span class="leg"><i style="background:#fff;border:2px dashed #dc2626"></i>Linha tracejada = hoje (${this._fmtDate(this._iso(hoje))})</span></div>
        <h2>Detalhamento das Fases e Tarefas</h2>
        <table>
            <thead><tr>
                <th>Fase / Tarefa</th><th style="width:170px;">Status</th>
                <th class="c" style="width:88px;">Início</th><th class="c" style="width:88px;">Fim</th>
                <th class="c" style="width:64px;">Duração</th><th class="c" style="width:74px;">Tarefas</th>
                <th class="c" style="width:120px;">Progresso</th>
            </tr></thead>
            <tbody>${linhasTabela}</tbody>
        </table>
        ${fases.some(f => atrasadaDe(f) || this._tarefasDaFase(f.id).some(atrasadaDe)) ? `<div class="obs"><i class="at">▲</i> Itens marcados como <b>atrasada</b> têm data de fim anterior a hoje e ainda não foram concluídos.</div>` : ''}
        <div class="assinaturas">
            <div>${esc(p.responsavel) || 'Responsável pelo Projeto'}<small>Responsável pelo Projeto</small></div>
            <div>${esc(p.engenheiro_responsavel) || 'Engenheiro Responsável'}<small>Engenheiro Responsável</small></div>
        </div>
        <div class="foot">
            <span>${esc(emp.name || 'GeraPro')}${emp.cnpj ? ' · ' + esc(emp.cnpj) : ''}</span>
            <span>Documento gerado pelo GeraPro em ${new Date().toLocaleString('pt-BR')}</span>
        </div>
        <script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
        </body></html>`;
    },

    /* --- Modal de fases (criar/editar) --- */

    openFaseModal(projetoId, faseId) {
        const f = faseId ? (store.getState().projetoFases || []).find(x => x.id === faseId) : null;
        const temTarefas = faseId ? this._tarefasDaFase(faseId).length > 0 : false;
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'prj-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="prj-modal">
                <div class="prj-modal-head">
                    <h3><i class="ph ${f ? 'ph-pencil-simple' : 'ph-plus'}"></i> ${f ? 'Editar Fase' : 'Nova Fase'}</h3>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.prj-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="prj-modal-body">
                    <div class="prj-field">
                        <label>Nome da Fase *</label>
                        <input type="text" id="pf-f-nome" class="form-control" value="${this._esc(f?.nome || '')}" placeholder="Ex.: Manufatura e Montagem" list="pf-lista-nomes">
                        <datalist id="pf-lista-nomes">
                            ${FASES_PADRAO.map(x => `<option value="${this._esc(x.nome)}">`).join('')}
                        </datalist>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Data de Início</label>
                            <input type="date" id="pf-f-inicio" class="form-control" value="${this._esc(f?.data_inicio || '')}">
                        </div>
                        <div class="prj-field">
                            <label>Data de Fim</label>
                            <input type="date" id="pf-f-fim" class="form-control" value="${this._esc(f?.data_fim || '')}">
                        </div>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Status</label>
                            <select id="pf-f-status" class="form-control">
                                ${Object.entries(FASE_STATUS).map(([k, v]) => `<option value="${k}" ${(f?.status || 'pendente') === k ? 'selected' : ''}>${v}</option>`).join('')}
                            </select>
                        </div>
                        <div class="prj-field">
                            <label>Progresso (%)${temTarefas ? ' — calculado pelas tarefas' : ''}</label>
                            <input type="number" min="0" max="100" step="5" id="pf-f-prog" class="form-control" value="${f?.progresso ?? 0}" ${temTarefas ? 'disabled title="Fase com tarefas: o progresso é a média delas e é atualizado automaticamente."' : ''}>
                        </div>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Responsável</label>
                            <input type="text" id="pf-f-resp" class="form-control" value="${this._esc(f?.responsavel || '')}" placeholder="Nome ou equipe">
                        </div>
                        <div class="prj-field">
                            <label>Cor da Barra</label>
                            <input type="color" id="pf-f-cor" class="form-control" value="${this._esc(f?.cor || FASE_CORES.pendente)}" style="height:38px;padding:3px;">
                        </div>
                    </div>
                    <div class="prj-field" style="margin-bottom:0;">
                        <label>Descrição / Observações</label>
                        <textarea id="pf-f-desc" class="form-control" rows="2" placeholder="Escopo, entregas, restrições...">${this._esc(f?.descricao || '')}</textarea>
                    </div>
                </div>
                <div class="prj-modal-foot">
                    <button class="btn btn-ghost" onclick="this.closest('.prj-modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.projetos.saveFase('${projetoId}', '${f?.id || ''}')">
                        <i class="ph ph-check"></i> ${f ? 'Salvar' : 'Criar Fase'}
                    </button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const inp = document.getElementById('pf-f-nome');
        if (inp) inp.focus();
    },

    async saveFase(projetoId, faseId) {
        const val = (fid) => document.getElementById(fid)?.value ?? '';
        const nome = val('pf-f-nome').trim();
        if (!nome) { window.app.toast('Informe o nome da fase.', 'warning'); return; }

        const data_inicio = val('pf-f-inicio');
        const data_fim = val('pf-f-fim');
        if (data_inicio && data_fim && data_fim < data_inicio) {
            window.app.toast('A data de fim não pode ser anterior à data de início.', 'warning');
            return;
        }
        let progresso = parseInt(val('pf-f-prog'), 10);
        if (!Number.isFinite(progresso)) progresso = 0;
        progresso = Math.max(0, Math.min(100, progresso));

        const payload = {
            nome,
            data_inicio,
            data_fim,
            status: val('pf-f-status') || 'pendente',
            progresso,
            responsavel: val('pf-f-resp').trim(),
            cor: val('pf-f-cor') || '',
            descricao: val('pf-f-desc').trim()
        };
        if (payload.status === 'concluido') payload.progresso = 100;
        // Fase 4: fase com tarefas delega o progresso à média delas — ignora o valor manual
        if (faseId && payload.status !== 'concluido' && this._tarefasDaFase(faseId).length > 0) {
            delete payload.progresso;
        }

        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        try {
            if (faseId) {
                const ok = await store.updateProjetoFase(faseId, payload);
                if (ok) window.app.toast('Fase atualizada.', 'success');
            } else {
                const fases = this._fasesDoProjeto(projetoId);
                const ordem = fases.length ? (Math.max(...fases.map(f => f.ordem || 0)) + 1) : 1;
                const criada = await store.addProjetoFase({
                    id: crypto.randomUUID(),
                    projeto_id: projetoId,
                    ordem,
                    ...payload
                });
                if (criada) window.app.toast(`Fase "${nome}" criada.`, 'success');
            }
            await this._syncFaseAtual(projetoId);
            this.renderDetail();
        } catch (e) {
            window.app.toast('Erro ao salvar fase: ' + e.message, 'error');
        }
    },

    async toggleFase(faseId) {
        const f = (store.getState().projetoFases || []).find(x => x.id === faseId);
        if (!f) return;
        const novo = f.status === 'concluido' ? 'em_andamento' : 'concluido';
        const ok = await store.updateProjetoFase(faseId, { status: novo, progresso: novo === 'concluido' ? 100 : Math.min(95, parseFloat(f.progresso) || 0) });
        if (ok) window.app.toast(novo === 'concluido' ? `Fase "${f.nome}" concluída.` : `Fase "${f.nome}" reaberta.`, 'success');
        await this._syncFaseAtual(f.projeto_id);
        this.renderDetail();
    },

    async moveFase(faseId, dir) {
        const f = (store.getState().projetoFases || []).find(x => x.id === faseId);
        if (!f) return;
        const fases = this._fasesDoProjeto(f.projeto_id);
        const idx = fases.findIndex(x => x.id === faseId);
        const alvo = idx + dir;
        if (alvo < 0 || alvo >= fases.length) return;
        const outra = fases[alvo];
        await store.updateProjetoFase(f.id, { ordem: outra.ordem || alvo + 1 });
        await store.updateProjetoFase(outra.id, { ordem: f.ordem || idx + 1 });
        this.renderDetail();
    },

    async removeFase(faseId) {
        const f = (store.getState().projetoFases || []).find(x => x.id === faseId);
        if (!f) return;
        const tarefas = this._tarefasDaFase(faseId);
        const msg = tarefas.length
            ? `Excluir a fase "${f.nome}" e ${tarefas.length} tarefa(s) ligada(s) a ela?`
            : `Excluir a fase "${f.nome}"?`;
        if (!confirm(msg)) return;
        for (const t of tarefas) {
            await store.deleteProjetoTarefa(t.id);
        }
        await store.deleteProjetoFase(faseId);
        await this._syncFaseAtual(f.projeto_id);
        window.app.toast(tarefas.length ? `Fase e ${tarefas.length} tarefa(s) excluídas.` : 'Fase excluída.', 'info');
        this.renderDetail();
    },

    /* ================================================================
       Fase 4 — SUBTAREFAS (projeto_tarefas): modal + CRUD
       ================================================================ */

    openTarefaModal(projetoId, faseId, tarefaId) {
        const t = tarefaId ? (store.getState().projetoTarefas || []).find(x => x.id === tarefaId) : null;
        const fid = t ? t.fase_id : faseId;
        const fase = (store.getState().projetoFases || []).find(x => x.id === fid);
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'prj-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="prj-modal">
                <div class="prj-modal-head">
                    <h3><i class="ph ${t ? 'ph-pencil-simple' : 'ph-plus'}"></i> ${t ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.prj-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="prj-modal-body">
                    <div class="prj-modal-contexto">Fase: <b>${this._esc(fase?.nome || '—')}</b></div>
                    <div class="prj-field">
                        <label>Nome da Tarefa *</label>
                        <input type="text" id="pt-f-nome" class="form-control" value="${this._esc(t?.nome || '')}" placeholder="Ex.: Aprovar projeto elétrico">
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Data de Início</label>
                            <input type="date" id="pt-f-inicio" class="form-control" value="${this._esc(t?.data_inicio || '')}">
                        </div>
                        <div class="prj-field">
                            <label>Data de Fim</label>
                            <input type="date" id="pt-f-fim" class="form-control" value="${this._esc(t?.data_fim || '')}">
                        </div>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Status</label>
                            <select id="pt-f-status" class="form-control">
                                ${Object.entries(TAREFA_STATUS).map(([k, v]) => `<option value="${k}" ${(t?.status || 'pendente') === k ? 'selected' : ''}>${v}</option>`).join('')}
                            </select>
                        </div>
                        <div class="prj-field">
                            <label>Progresso (%)</label>
                            <input type="number" min="0" max="100" step="5" id="pt-f-prog" class="form-control" value="${t?.progresso ?? 0}">
                        </div>
                    </div>
                    <div class="prj-field">
                        <label>Responsável</label>
                        <input type="text" id="pt-f-resp" class="form-control" value="${this._esc(t?.responsavel || '')}" placeholder="Nome ou equipe">
                    </div>
                    <div class="prj-field">
                        <label>Descrição</label>
                        <textarea id="pt-f-desc" class="form-control" rows="2" placeholder="Detalhes, critérios de aceite...">${this._esc(t?.descricao || '')}</textarea>
                    </div>
                </div>
                <div class="prj-modal-foot">
                    <button class="btn btn-ghost" onclick="this.closest('.prj-modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.projetos.saveTarefa('${projetoId}', '${fid}', '${tarefaId || ''}')"><i class="ph ph-check"></i> Salvar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('pt-f-nome')?.focus(), 60);
    },

    async saveTarefa(projetoId, faseId, tarefaId) {
        const val = (id) => (document.getElementById(id)?.value ?? '');
        const nome = val('pt-f-nome').trim();
        if (!nome) { window.app.toast('Informe o nome da tarefa.', 'warning'); return; }

        const payload = {
            nome,
            data_inicio: val('pt-f-inicio'),
            data_fim: val('pt-f-fim'),
            status: val('pt-f-status') || 'pendente',
            progresso: Math.max(0, Math.min(100, parseFloat(val('pt-f-prog')) || 0)),
            responsavel: val('pt-f-resp').trim(),
            descricao: val('pt-f-desc').trim()
        };
        if (payload.data_inicio && payload.data_fim && payload.data_fim < payload.data_inicio) {
            window.app.toast('A data de fim não pode ser anterior à de início.', 'warning');
            return;
        }
        if (payload.status === 'concluido') payload.progresso = 100;

        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        try {
            if (tarefaId) {
                const ok = await store.updateProjetoTarefa(tarefaId, payload);
                if (ok) window.app.toast('Tarefa atualizada.', 'success');
            } else {
                const tarefas = this._tarefasDaFase(faseId);
                const ordem = tarefas.length ? Math.max(...tarefas.map(t => t.ordem || 0)) + 1 : 1;
                const criada = await store.addProjetoTarefa({
                    id: crypto.randomUUID(),
                    projeto_id: projetoId,
                    fase_id: faseId,
                    ordem,
                    ...payload
                });
                if (criada) {
                    window.app.toast(`Tarefa "${nome}" criada.`, 'success');
                    // Mostra a fase expandida para a nova tarefa já aparecer no Gantt
                    if (!this._faseExpandida(faseId)) {
                        this.ganttExpandido = [...(this.ganttExpandido || []), faseId];
                        this._persisteExpandido();
                    }
                }
            }
            this._recalcProgressoFase(faseId);
            this.renderDetail();
        } catch (e) {
            window.app.toast('Erro ao salvar tarefa: ' + e.message, 'error');
        }
    },

    async toggleTarefa(tarefaId) {
        const t = (store.getState().projetoTarefas || []).find(x => x.id === tarefaId);
        if (!t) return;
        const novo = t.status === 'concluido' ? 'em_andamento' : 'concluido';
        const ok = await store.updateProjetoTarefa(tarefaId, {
            status: novo,
            progresso: novo === 'concluido' ? 100 : Math.min(95, parseFloat(t.progresso) || 0)
        });
        if (ok) window.app.toast(novo === 'concluido' ? `Tarefa "${t.nome}" concluída.` : `Tarefa "${t.nome}" reaberta.`, 'success');
        this._recalcProgressoFase(t.fase_id);
        this.renderDetail();
    },

    async moveTarefa(tarefaId, dir) {
        const t = (store.getState().projetoTarefas || []).find(x => x.id === tarefaId);
        if (!t) return;
        const tarefas = this._tarefasDaFase(t.fase_id);
        const idx = tarefas.findIndex(x => x.id === tarefaId);
        const alvo = idx + dir;
        if (alvo < 0 || alvo >= tarefas.length) return;
        const outra = tarefas[alvo];
        await store.updateProjetoTarefa(t.id, { ordem: outra.ordem || alvo + 1 });
        await store.updateProjetoTarefa(outra.id, { ordem: t.ordem || idx + 1 });
        this.renderDetail();
    },

    async removeTarefa(tarefaId) {
        const t = (store.getState().projetoTarefas || []).find(x => x.id === tarefaId);
        if (!t) return;
        if (!confirm(`Excluir a tarefa "${t.nome}"?`)) return;
        await store.deleteProjetoTarefa(tarefaId);
        this._recalcProgressoFase(t.fase_id);
        window.app.toast('Tarefa excluída.', 'info');
        this.renderDetail();
    },

    /* Atualiza o campo fase_atual do projeto a partir das fases (primeira não concluída) */
    async _syncFaseAtual(projetoId) {
        const p = (store.getState().projetos || []).find(x => x.id === projetoId);
        if (!p) return;
        const fases = this._fasesDoProjeto(projetoId);
        if (fases.length === 0) return;
        const atual = fases.find(f => f.status !== 'concluido');
        const nome = atual ? atual.nome : 'Concluído';
        if ((p.fase_atual || '') !== nome) {
            await store.updateProjeto(projetoId, { fase_atual: nome });
        }
    },

    /* --- Geração do modelo padrão de fases --- */

    async seedFases(projetoId) {
        const p = (store.getState().projetos || []).find(x => x.id === projetoId);
        if (!p) return;
        const existentes = this._fasesDoProjeto(projetoId);
        if (existentes.length > 0) {
            window.app.toast(`Este projeto já possui ${existentes.length} fase(s). Exclua-as antes de gerar o modelo padrão.`, 'info');
            return;
        }
        const modelo = this._getFasesPadrao();
        if (!confirm(`Criar ${modelo.length} fases padrão para o projeto ${p.codigo}?`)) return;

        const inicio = p.data_inicio ? this._parseDate(p.data_inicio) : this._today();
        const fimPrev = p.data_prevista_entrega ? this._parseDate(p.data_prevista_entrega) : null;
        const somaDias = modelo.reduce((s, f) => s + (parseInt(f.dias, 10) || 1), 0);

        // Se o projeto tem período definido, distribui proporcionalmente; senão usa os dias do modelo
        const encaixar = fimPrev && fimPrev > inicio;
        const span = encaixar ? this._diffDays(inicio, fimPrev) + 1 : 0;

        this._seeding = true;
        let cursor = new Date(inicio.getTime());
        let criadas = 0;
        try {
            for (let i = 0; i < modelo.length; i++) {
                const m = modelo[i];
                const diasModelo = parseInt(m.dias, 10) || 1;
                const dur = encaixar ? Math.max(1, Math.round(diasModelo / somaDias * span)) : diasModelo;
                const dFim = this._addDays(cursor, dur - 1);
                const r = await store.addProjetoFase({
                    id: crypto.randomUUID(),
                    projeto_id: projetoId,
                    ordem: i + 1,
                    nome: m.nome,
                    descricao: '',
                    data_inicio: this._iso(cursor),
                    data_fim: this._iso(dFim),
                    status: i === 0 ? 'em_andamento' : 'pendente',
                    progresso: 0,
                    responsavel: '',
                    cor: m.cor || ''
                });
                if (r) criadas++;
                cursor = this._addDays(dFim, 1);
            }
        } finally {
            this._seeding = false;
        }
        if (criadas > 0) {
            await this._syncFaseAtual(projetoId);
            window.app.toast(`${criadas} fases criadas no cronograma.`, 'success');
        } else {
            window.app.toast('Nenhuma fase foi criada (verifique a conexão).', 'error');
        }
        this.renderDetail();
    },

    /* --- Modelo de fases padrão (configurável) --- */

    _getFasesPadrao() {
        try {
            const raw = localStorage.getItem('gerapro_projetos_fases_padrao');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length) return arr;
            }
        } catch (e) { /* ignora */ }
        return FASES_PADRAO.map(f => ({ ...f }));
    },

    openTemplateModal() {
        const modelo = this._getFasesPadrao();
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'prj-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="prj-modal">
                <div class="prj-modal-head">
                    <h3><i class="ph ph-sliders-horizontal"></i> Modelo Padrão de Fases</h3>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.prj-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="prj-modal-body">
                    <p style="font-size:12.5px;color:#6b7280;margin:0 0 12px;line-height:1.5;">
                        Usado pelo botão <b>Gerar Fases Padrão</b>. A duração em dias é distribuída proporcionalmente quando o projeto tem início e entrega prevista definidos.
                    </p>
                    <div class="prj-tpl-head"><span>#</span><span>Nome da Fase</span><span>Dias</span><span>Cor</span><span></span></div>
                    <div id="prj-tpl-rows">
                        ${modelo.map((m, i) => this._tplRowHTML(m, i)).join('')}
                    </div>
                    <button class="btn btn-sm btn-ghost" onclick="app.projetos._addTplRow()" style="margin-top:8px;">
                        <i class="ph ph-plus"></i> Adicionar linha
                    </button>
                </div>
                <div class="prj-modal-foot" style="justify-content:space-between;">
                    <button class="btn btn-ghost" onclick="app.projetos.resetTemplate()">Restaurar padrão</button>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost" onclick="this.closest('.prj-modal-overlay').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.projetos.saveTemplate()"><i class="ph ph-check"></i> Salvar Modelo</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    _tplRowHTML(m, i) {
        return `
            <div class="prj-tpl-row" data-i="${i}">
                <span class="prj-tpl-idx">${i + 1}</span>
                <input type="text" class="form-control prj-tpl-nome" value="${this._esc(m.nome || '')}" placeholder="Nome da fase">
                <input type="number" min="1" class="form-control prj-tpl-dias" value="${parseInt(m.dias, 10) || 1}">
                <input type="color" class="form-control prj-tpl-cor" value="${this._esc(m.cor || '#6366F1')}" title="Cor da barra">
                <button class="prj-danger" onclick="this.closest('.prj-tpl-row').remove()" title="Remover linha"><i class="ph ph-x"></i></button>
            </div>`;
    },

    _addTplRow() {
        const box = document.getElementById('prj-tpl-rows');
        if (!box) return;
        const i = box.children.length;
        box.insertAdjacentHTML('beforeend', this._tplRowHTML({ nome: '', dias: 5, cor: '#6366F1' }, i));
    },

    saveTemplate() {
        const rows = [...document.querySelectorAll('#prj-tpl-rows .prj-tpl-row')];
        const arr = [];
        rows.forEach(r => {
            const nome = r.querySelector('.prj-tpl-nome')?.value.trim() || '';
            if (!nome) return;
            const dias = Math.max(1, parseInt(r.querySelector('.prj-tpl-dias')?.value, 10) || 1);
            const cor = r.querySelector('.prj-tpl-cor')?.value || '#6366F1';
            arr.push({ nome, dias, cor });
        });
        if (arr.length === 0) { window.app.toast('Mantenha ao menos uma fase no modelo.', 'warning'); return; }
        localStorage.setItem('gerapro_projetos_fases_padrao', JSON.stringify(arr));
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());
        window.app.toast(`Modelo salvo com ${arr.length} fase(s).`, 'success');
    },

    resetTemplate() {
        localStorage.removeItem('gerapro_projetos_fases_padrao');
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());
        window.app.toast('Modelo padrão restaurado.', 'info');
        this.openTemplateModal();
    },

    /* --- Arrastar barra para reprogramar (pointer events) --- */

    barDown(e, id, tipo = 'fase') {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        const bar = e.currentTarget;
        const g = this._gantt;
        if (!g) return;
        const isFase = tipo !== 'tarefa';
        const item = isFase
            ? (store.getState().projetoFases || []).find(x => x.id === id)
            : (store.getState().projetoTarefas || []).find(x => x.id === id);
        if (!item || !item.data_inicio) return;

        const startX = e.clientX;
        const origLeft = parseFloat(bar.style.left) || 0;
        let deltaDays = 0;
        let dragging = false;

        bar.setPointerCapture && (() => { try { bar.setPointerCapture(e.pointerId); } catch (_) { /* ignora (evento sintético) */ } })();
        bar.classList.add('dragging');

        const onMove = (ev) => {
            const dx = ev.clientX - startX;
            if (!dragging && Math.abs(dx) > 3) dragging = true;
            deltaDays = Math.round(dx / g.colWidth);
            bar.style.left = (origLeft + deltaDays * g.colWidth) + 'px';
        };
        const onUp = async () => {
            bar.removeEventListener('pointermove', onMove);
            bar.removeEventListener('pointerup', onUp);
            bar.removeEventListener('pointercancel', onUp);
            bar.classList.remove('dragging');
            try { bar.releasePointerCapture(e.pointerId); } catch (_) { /* ignora */ }

            if (!dragging) {
                if (isFase) this.openFaseModal(item.projeto_id, id);
                else this.openTarefaModal(item.projeto_id, item.fase_id, id);
                return;
            }
            if (deltaDays !== 0) {
                const ini = this._addDays(this._parseDate(item.data_inicio), deltaDays);
                const fim = item.data_fim ? this._addDays(this._parseDate(item.data_fim), deltaDays) : null;
                const updates = { data_inicio: this._iso(ini), data_fim: fim ? this._iso(fim) : '' };
                const ok = isFase
                    ? await store.updateProjetoFase(id, updates)
                    : await store.updateProjetoTarefa(id, updates);
                if (ok) window.app.toast(`"${item.nome}" reprogramada${deltaDays > 0 ? ' + ' + deltaDays : ' ' + deltaDays} dia(s).`, 'success');
                this.renderDetail();
            } else {
                this.renderDetail();
            }
        };
        bar.addEventListener('pointermove', onMove);
        bar.addEventListener('pointerup', onUp);
        bar.addEventListener('pointercancel', onUp);
        e.preventDefault();
    },

    /* ================================================================
       CRUD
       ================================================================ */

    openModal(id) {
        const p = id ? (store.getState().projetos || []).find(x => x.id === id) : null;
        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'prj-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="prj-modal">
                <div class="prj-modal-head">
                    <h3><i class="ph ${p ? 'ph-pencil-simple' : 'ph-plus'}"></i> ${p ? 'Editar Projeto' : 'Novo Projeto'}</h3>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.prj-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="prj-modal-body">
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Cliente *</label>
                            <input type="text" id="prj-f-cliente" class="form-control" value="${this._esc(p?.cliente || '')}" placeholder="Nome do cliente">
                        </div>
                        <div class="prj-field">
                            <label>Projeto</label>
                            <input type="text" id="prj-f-projeto" class="form-control" value="${this._esc(p?.projeto || '')}" placeholder="Título do projeto">
                        </div>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Valor do Contrato (R$)</label>
                            <input type="number" step="0.01" id="prj-f-valor" class="form-control" value="${p?.valor_contrato ?? ''}" placeholder="0,00">
                        </div>
                        <div class="prj-field">
                            <label>Status</label>
                            <select id="prj-f-status" class="form-control">
                                ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(p?.status || 'em_andamento') === k ? 'selected' : ''}>${v}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Data de Início</label>
                            <input type="date" id="prj-f-inicio" class="form-control" value="${this._esc(p?.data_inicio || '')}">
                        </div>
                        <div class="prj-field">
                            <label>Entrega Prevista</label>
                            <input type="date" id="prj-f-entrega" class="form-control" value="${this._esc(p?.data_prevista_entrega || '')}">
                        </div>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Entrega Real</label>
                            <input type="date" id="prj-f-entrega-real" class="form-control" value="${this._esc(p?.data_entrega_real || '')}">
                        </div>
                        <div class="prj-field">
                            <label>Fase Atual</label>
                            <input type="text" id="prj-f-fase" class="form-control" value="${this._esc(p?.fase_atual || '')}" placeholder="Ex.: Planejamento">
                        </div>
                    </div>
                    <div class="prj-field-row">
                        <div class="prj-field">
                            <label>Responsável</label>
                            <input type="text" id="prj-f-responsavel" class="form-control" value="${this._esc(p?.responsavel || '')}">
                        </div>
                        <div class="prj-field">
                            <label>Engenheiro Responsável</label>
                            <input type="text" id="prj-f-engenheiro" class="form-control" value="${this._esc(p?.engenheiro_responsavel || '')}">
                        </div>
                    </div>
                    <div class="prj-field">
                        <label>Descrição</label>
                        <textarea id="prj-f-descricao" class="form-control" rows="2" placeholder="Escopo do projeto...">${this._esc(p?.descricao || '')}</textarea>
                    </div>
                    <div class="prj-field" style="margin-bottom:0;">
                        <label>Observações</label>
                        <textarea id="prj-f-obs" class="form-control" rows="2">${this._esc(p?.observacoes || '')}</textarea>
                    </div>
                </div>
                <div class="prj-modal-foot">
                    <button class="btn btn-ghost" onclick="this.closest('.prj-modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.projetos.save('${p?.id || ''}')">
                        <i class="ph ph-check"></i> ${p ? 'Salvar' : 'Criar Projeto'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async save(id) {
        const val = (fid) => document.getElementById(fid)?.value ?? '';
        const cliente = val('prj-f-cliente').trim();
        if (!cliente) { window.app.toast('Informe o cliente.', 'warning'); return; }

        const payload = {
            cliente,
            projeto: val('prj-f-projeto').trim(),
            valor_contrato: parseFloat(val('prj-f-valor')) || 0,
            status: val('prj-f-status') || 'em_andamento',
            data_inicio: val('prj-f-inicio'),
            data_prevista_entrega: val('prj-f-entrega'),
            data_entrega_real: val('prj-f-entrega-real'),
            fase_atual: val('prj-f-fase').trim(),
            responsavel: val('prj-f-responsavel').trim(),
            engenheiro_responsavel: val('prj-f-engenheiro').trim(),
            descricao: val('prj-f-descricao').trim(),
            observacoes: val('prj-f-obs').trim()
        };

        document.querySelectorAll('.prj-modal-overlay').forEach(el => el.remove());

        try {
            if (id) {
                const ok = await store.updateProjeto(id, payload);
                if (ok) window.app.toast('Projeto atualizado.', 'success');
            } else {
                const state = store.getState();
                const now = new Date().toISOString();
                const item = {
                    id: crypto.randomUUID(),
                    codigo: this._nextCodigo(state.projetos || []),
                    pipeline_item_id: '',
                    origem: 'manual',
                    origem_id: '',
                    vendedor: '',
                    created_at: now,
                    updated_at: now,
                    ...payload
                };
                const criado = await store.addProjeto(item);
                if (criado) window.app.toast(`Projeto ${criado.codigo} criado.`, 'success');
            }
            this.render();
        } catch (e) {
            window.app.toast('Erro ao salvar projeto: ' + e.message, 'error');
        }
    },

    async changeStatus(id, status) {
        const ok = await store.updateProjeto(id, { status });
        if (ok) window.app.toast(`Status alterado para ${STATUS[status] || status}.`, 'success');
        this.render();
    },

    async remove(id) {
        const p = (store.getState().projetos || []).find(x => x.id === id);
        if (!p) return;
        if (!confirm(`Excluir o projeto ${p.codigo}${p.cliente ? ' (' + p.cliente + ')' : ''}?`)) return;
        // Cascade: remove fases do cronograma e lançamentos da DRE junto com o projeto
        const fases = this._fasesDoProjeto(id);
        for (const f of fases) {
            await store.deleteProjetoFase(f.id);
        }
        const custos = this._custosDoProjeto(id);
        for (const c of custos) {
            await store.deleteProjetoCusto(c.id);
        }
        const tarefas = this._tarefasDoProjeto(id);
        for (const t of tarefas) {
            await store.deleteProjetoTarefa(t.id);
        }
        await store.deleteProjeto(id);
        const removidos = [];
        if (fases.length) removidos.push(`${fases.length} fase(s)`);
        if (tarefas.length) removidos.push(`${tarefas.length} tarefa(s)`);
        if (custos.length) removidos.push(`${custos.length} lançamento(s) da DRE`);
        window.app.toast(removidos.length
            ? `Projeto excluído (junto com ${removidos.join(' e ')}).`
            : 'Projeto excluído.', 'info');
        if (this.activeId === id) this.backToList();
        else this.render();
    },

    /* ================================================================
       HELPERS
       ================================================================ */

    _fmtDate(v) {
        if (!v) return '';
        const s = String(v);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [y, m, d] = s.slice(0, 10).split('-');
            return `${d}/${m}/${y}`;
        }
        const dt = new Date(s);
        return isNaN(dt.getTime()) ? s : dt.toLocaleDateString('pt-BR');
    },

    /* --- Helpers de data (Gantt) --- */

    _today() {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    },

    _parseDate(v) {
        if (!v) return null;
        const s = String(v).slice(0, 10);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        return new Date(+m[1], +m[2] - 1, +m[3]);
    },

    _iso(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    _addDays(d, n) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    },

    _diffDays(a, b) {
        return Math.round((b.getTime() - a.getTime()) / 86400000);
    },

    _esc(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
};

window.projetosModule = ProjetosModule;
ProjetosModule.init();
