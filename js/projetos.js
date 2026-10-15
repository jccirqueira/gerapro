import { store } from './state.js';

/**
 * GESTÃO DE PROJETOS
 * Módulo criado automaticamente quando uma proposta do Pipeline é "Fechada" (ganha).
 * Fase 1: entidade + gancho "fechado" + sidebar + visões lista/detalhe.
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
            _addTplRow: this._addTplRow.bind(this),
            // Fase 3 — DRE Estimado × Real
            openCustoModal: this.openCustoModal.bind(this),
            saveCusto: this.saveCusto.bind(this),
            removeCusto: this.removeCusto.bind(this),
            seedEstimado: this.seedEstimado.bind(this),
            exportDreXLSX: this.exportDreXLSX.bind(this)
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
                            <i class="ph ph-folder"></i> Gestão de Projetos
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
                        <button class="btn btn-ghost btn-sm" onclick="app.projetos.exportDreXLSX('${p.id}')">
                            <i class="ph ph-file-xls"></i> XLSX
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

    /** DRE em XLSX — cabeçalho formatado, linhas zebradas e primeira linha congelada. */
    exportDreXLSX(projetoId) {
        const p = (store.getState().projetos || []).find(x => x.id === projetoId);
        if (!p) return;
        try {
            if (typeof XLSX === 'undefined') {
                window.app.toast('Biblioteca XLSX não disponível.', 'warning');
                return;
            }
            const est   = this._drePorCategoria(projetoId, 'estimado');
            const real  = this._drePorCategoria(projetoId, 'real');
            const cEst  = this._dreCalculo(est);
            const cReal = this._dreCalculo(real);
            const num   = (v) => Math.round((Number(v) || 0) * 100) / 100;
            const pctDe = (e, r) => {
                const d = r - e;
                return Math.abs(e) > 0.005 ? Math.round((d / Math.abs(e)) * 1000) / 10 : '';
            };

            const linhas = [];
            Object.keys(DRE_GRUPOS).forEach(grupo => {
                linhas.push({ Conta: DRE_GRUPOS[grupo], Estimado: '', Real: '', 'Variação (R$)': '', 'Variação (%)': '' });
                DRE_CATEGORIAS.filter(c => c.grupo === grupo).forEach(cat => {
                    const e = est[cat.key] || 0, r = real[cat.key] || 0;
                    linhas.push({
                        Conta: `${cat.sinal} ${cat.label}`,
                        Estimado: num(e),
                        Real: num(r),
                        'Variação (R$)': num(r - e),
                        'Variação (%)': pctDe(e, r)
                    });
                });
                const sub = DRE_SUBTOTAIS.find(s => s.grupo === grupo);
                if (sub) {
                    const vE = this._dreAvaliar(cEst, sub.campos);
                    const vR = this._dreAvaliar(cReal, sub.campos);
                    linhas.push({ Conta: sub.label, Estimado: num(vE), Real: num(vR), 'Variação (R$)': num(vR - vE), 'Variação (%)': pctDe(vE, vR) });
                }
            });
            linhas.push({ Conta: 'MARGEM (% sobre receita líquida)', Estimado: num(cEst.margem), Real: num(cReal.margem), 'Variação (R$)': '', 'Variação (%)': '' });

            const ws = XLSX.utils.json_to_sheet(linhas);
            const range = XLSX.utils.decode_range(ws['!ref']);
            const headerStyle = {
                font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '4F46E5' } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
            };
            const zebraStyle   = { fill: { fgColor: { rgb: 'F3F4F6' } } };
            const groupStyle   = { font: { bold: true, sz: 11, color: { rgb: '374151' } }, fill: { fgColor: { rgb: 'E0E7FF' } } };
            const totalStyle   = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4B5563' } } };
            const moneyFmt     = '#,##0.00';

            for (let r = range.s.r; r <= range.e.r; r++) {
                const linha  = linhas[r - range.s.r] || {};
                const conta  = String(linha.Conta || '');
                const ehGrupo = Object.values(DRE_GRUPOS).includes(conta);
                const ehTotal = /^(RECEITA LÍQUIDA|LUCRO BRUTO|LUCRO LÍQUIDO|MARGEM)/.test(conta);
                for (let c = range.s.c; c <= range.e.c; c++) {
                    const addr = XLSX.utils.encode_cell({ c, r });
                    const cell = ws[addr];
                    if (!cell) continue;
                    let base;
                    if (r === 0) {
                        if (cell.t === 's' && cell.v) cell.v = String(cell.v).toUpperCase();
                        base = headerStyle;
                    } else if (ehTotal) {
                        base = totalStyle;
                    } else if (ehGrupo) {
                        base = groupStyle;
                    } else {
                        base = r % 2 === 1 ? zebraStyle : null;
                    }
                    // O xlsx-js-style lê o formato numérico de `style.numFmt` (dentro de cell.s).
                    // `cell.z` é ignorado quando a célula já tem estilo, então o formato é
                    // injetado numa cópia do estilo da própria célula.
                    if (c > 0 && typeof cell.v === 'number') {
                        cell.s = { ...(base || {}), numFmt: moneyFmt };
                    } else if (base) {
                        cell.s = base;
                    }
                }
            }
            ws['!cols'] = [{ wch: 36 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 13 }];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'DRE');

            const nomeArquivo = `DRE_${String(p.codigo || 'projeto').replace(/[^\w-]/g, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            this._patchXlsxFreezePane(buf).then(patched => {
                const blob = new Blob([patched], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nomeArquivo;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                window.app.toast('DRE exportada em XLSX.', 'success');
            }).catch(err => {
                console.error('[Projetos] XLSX freeze patch error:', err);
                XLSX.writeFile(wb, nomeArquivo);
                window.app.toast('DRE exportada em XLSX.', 'success');
            });
        } catch (e) {
            console.error('[Projetos] DRE XLSX error:', e);
            window.app.toast('Erro ao exportar DRE: ' + e.message, 'error');
        }
    },

    /**
     * Injeta freeze pane (primeira linha congelada) num XLSX gerado pelo SheetJS.
     * O xlsx-js-style não suporta !freeze no write — este helper faz post-processamento
     * no zip: descomprime as folhas, insere o <pane> e reconstrói o zip.
     */
    async _patchXlsxFreezePane(arrayBuffer) {
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
                    xml = xml.replace(
                        /<sheetView([^>]*)\/>/,
                        '<sheetView$1><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView>'
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

    setZoom(v) {
        this.ganttZoom = GANTT_ZOOM[v] !== undefined ? v : 'auto';
        this.renderDetail();
    },

    _cronogramaHTML(p) {
        const fases = this._fasesDoProjeto(p.id);
        const prog = this._progressoProjeto(p.id);

        const toolbar = `
            <div class="prj-gantt-toolbar">
                <div class="prj-gantt-title">
                    <i class="ph ph-chart-bar-horizontal"></i> Cronograma
                    <span class="prj-gantt-count">${fases.length} fase(s)</span>
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
                daysRow += `<div class="prj-gantt-day ${isHoje ? 'today' : ''}" style="left:${i * colWidth}px;width:${colWidth}px">
                    <span>${d.getDate()}</span><small>${NOMES_DIA[d.getDay()]}</small></div>`;
            }
        }

        /* --- Marcador de hoje --- */
        const hojeX = this._diffDays(min, hoje) * colWidth + colWidth / 2;
        const hojeHTML = `<div class="prj-gantt-today-line" style="left:${260 + hojeX}px" title="Hoje — ${this._fmtDate(this._iso(hoje))}"></div>`;

        /* --- Linhas (fases) --- */
        const linhas = fases.map(f => {
            const atrasada = f.status !== 'concluido' && f.data_fim && this._parseDate(f.data_fim) < hoje;
            const cor = f.cor || FASE_CORES[f.status] || FASE_CORES.pendente;
            const progF = Math.max(0, Math.min(100, parseFloat(f.progresso) || 0));

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

            return `
                <div class="prj-gantt-row">
                    <div class="prj-gantt-row-left">
                        <div class="prj-gantt-name">
                            <span class="prj-gantt-dot" style="background:${cor}"></span>
                            <span title="${this._esc(f.nome)}">${this._esc(f.nome)}</span>
                        </div>
                        <div class="prj-gantt-meta">
                            ${this._fmtDate(f.data_inicio) || '—'}${f.data_fim ? ' → ' + this._fmtDate(f.data_fim) : ''}
                            · <b>${progF}%</b>
                            ${atrasada ? '<span class="prj-gantt-attr">atrasada</span>' : ''}
                        </div>
                        <div class="prj-gantt-row-actions">
                            <button onclick="app.projetos.openFaseModal('${p.id}', '${f.id}')" title="Editar fase"><i class="ph ph-pencil-simple"></i></button>
                            <button onclick="app.projetos.toggleFase('${f.id}')" title="${f.status === 'concluido' ? 'Reabrir fase' : 'Marcar como concluída'}"><i class="ph ph-check-circle"></i></button>
                            <button onclick="app.projetos.moveFase('${f.id}', -1)" title="Mover para cima"><i class="ph ph-arrow-up"></i></button>
                            <button onclick="app.projetos.moveFase('${f.id}', 1)" title="Mover para baixo"><i class="ph ph-arrow-down"></i></button>
                            <button class="prj-danger" onclick="app.projetos.removeFase('${f.id}')" title="Excluir fase"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                    <div class="prj-gantt-row-track" style="width:${totalW}px;${colWidth >= 8 ? `background-size:${colWidth}px 100%;` : ''}">${bar}</div>
                </div>`;
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
            <div class="prj-gantt-hint"><i class="ph ph-info"></i> Arraste uma barra para reprogramar a fase; clique nela para editar datas, status e progresso.</div>`;
    },

    /* --- Modal de fases (criar/editar) --- */

    openFaseModal(projetoId, faseId) {
        const f = faseId ? (store.getState().projetoFases || []).find(x => x.id === faseId) : null;
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
                            <label>Progresso (%)</label>
                            <input type="number" min="0" max="100" step="5" id="pf-f-prog" class="form-control" value="${f?.progresso ?? 0}">
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
        if (!confirm(`Excluir a fase "${f.nome}"?`)) return;
        await store.deleteProjetoFase(faseId);
        await this._syncFaseAtual(f.projeto_id);
        window.app.toast('Fase excluída.', 'info');
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

    barDown(e, faseId) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        const bar = e.currentTarget;
        const g = this._gantt;
        if (!g) return;
        const f = (store.getState().projetoFases || []).find(x => x.id === faseId);
        if (!f || !f.data_inicio) return;

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

            if (!dragging) { this.openFaseModal(f.projeto_id, faseId); return; }
            if (deltaDays !== 0) {
                const ini = this._addDays(this._parseDate(f.data_inicio), deltaDays);
                const fim = f.data_fim ? this._addDays(this._parseDate(f.data_fim), deltaDays) : null;
                const ok = await store.updateProjetoFase(faseId, {
                    data_inicio: this._iso(ini),
                    data_fim: fim ? this._iso(fim) : ''
                });
                if (ok) window.app.toast(`Fase "${f.nome}" reprogramada${deltaDays > 0 ? ' + ' + deltaDays : ' ' + deltaDays} dia(s).`, 'success');
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
        await store.deleteProjeto(id);
        const removidos = [];
        if (fases.length) removidos.push(`${fases.length} fase(s)`);
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
