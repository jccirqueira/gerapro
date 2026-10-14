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

const ProjetosModule = {
    _active: false,
    viewMode: 'list',       // 'list' | 'detail'
    activeId: null,
    activeTab: 'info',      // 'info' | 'cronograma' | 'dre'
    searchQuery: '',
    statusFilter: '',

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
            createFromPipeline: this.createFromPipeline.bind(this)
        };

        store.subscribe((state) => {
            if (this._active) {
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
        for (const item of fechados) {
            const antes = (store.getState().projetos || []).length;
            const r = await this.createFromPipeline(item, { silent: true });
            if (r && (store.getState().projetos || []).length > antes) criados++;
        }
        window.app.toast(
            criados > 0 ? `${criados} projeto(s) criado(s) a partir das propostas fechadas.` : 'Todos os projetos já estão importados.',
            criados > 0 ? 'success' : 'info'
        );
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
                            <i class="ph ph-calendar-blank"></i> Cronograma <span class="prj-tab-tag">Fase 2</span>
                        </button>
                        <button class="prj-tab ${this.activeTab === 'dre' ? 'active' : ''}" onclick="app.projetos.switchTab('dre')">
                            <i class="ph ph-currency-circle-dollar"></i> DRE <span class="prj-tab-tag">Fase 3</span>
                        </button>
                    </div>

                    ${this._tabContent(p)}
                </div>
            </div>
        `;
    },

    _tabContent(p) {
        if (this.activeTab === 'cronograma') {
            return `
                <div class="prj-placeholder">
                    <i class="ph ph-calendar-blank"></i>
                    <h3>Cronograma do Projeto</h3>
                    <p>Esta aba receberá o gerenciamento de <strong>fases, tarefas e marcos</strong> do projeto, com visualização em Gantt, dependências e acompanhamento de atrasos.</p>
                </div>`;
        }
        if (this.activeTab === 'dre') {
            return `
                <div class="prj-placeholder">
                    <i class="ph ph-currency-circle-dollar"></i>
                    <h3>DRE do Projeto</h3>
                    <p>Esta aba mostrará a <strong>Demonstração do Resultado</strong> comparando <strong>Estimado × Real</strong>: receita, deduções, custos diretos, despesas operacionais e lucro, com exportação para XLSX.</p>
                </div>`;
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
        await store.deleteProjeto(id);
        window.app.toast('Projeto excluído.', 'info');
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
