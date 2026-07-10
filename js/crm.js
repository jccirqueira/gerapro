import { store } from './state.js';

const CRM = {
    _currentView: 'dashboard',
    _selectedLeadId: null,
    _calendarDate: new Date(),
    _selectedCalendarDay: null,
    _filterStatus: 'todos',
    _filterVendedor: 'todos',
    _searchTerm: '',
    _sortField: 'created_at',
    _sortDir: 'desc',
    _filterDateField: 'created_at',
    _filterDateStart: '',
    _filterDateEnd: '',

    PRIORIDADES: ['baixa', 'media', 'alta', 'urgente'],

    getLeads() {
        return store.getState().crmLeads || [];
    },

    getInteracoes(leadId) {
        return (store.getState().crmInteracoes || []).filter(i => i.lead_id === leadId);
    },

    getTarefas(leadId) {
        const all = store.getState().crmTarefas || [];
        return leadId ? all.filter(t => t.lead_id === leadId) : all;
    },

    getNotas(leadId) {
        return (store.getState().crmNotas || []).filter(n => n.lead_id === leadId);
    },

    getVendedores() {
        return store.getState().vendedores || [];
    },

    getVendedorNome(id) {
        const v = this.getVendedores().find(v => v.id === id);
        return v ? v.nome || v.razao_social || id : '—';
    },

    _getStages() {
        const stored = store.getState().crmStages;
        if (stored && stored.length > 0) return stored;
        return [
            { id: 'novo', label: 'Novo', color: '#6b7280', icon: 'ph-dot-outline', position: 0, is_default: 1, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 5 },
            { id: 'tentando_contato', label: 'Tentando Contato', color: '#f59e0b', icon: 'ph-phone-call', position: 1, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 10 },
            { id: 'contato_realizado', label: 'Contato Realizado', color: '#3b82f6', icon: 'ph-chats', position: 2, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 20 },
            { id: 'qualificado', label: 'Qualificado', color: '#8b5cf6', icon: 'ph-star', position: 3, is_default: 0, is_terminal: 0, allows_proposal: 1, tracks_qualificacao: 1, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 40 },
            { id: 'agendado_visita', label: 'Agendado', color: '#06b6d4', icon: 'ph-calendar-check', position: 4, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 60 },
            { id: 'visita_realizada', label: 'Visita Realizada', color: '#10b981', icon: 'ph-map-pin', position: 5, is_default: 0, is_terminal: 0, allows_proposal: 1, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 70 },
            { id: 'virou_proposta', label: 'Virou Proposta', color: '#2563eb', icon: 'ph-file-arrow-up', position: 6, is_default: 0, is_terminal: 1, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 1, is_loss: 0, loss_reasons: [], probability: 90 },
            { id: 'desqualificado', label: 'Desqualificado', color: '#ef4444', icon: 'ph-x-circle', position: 7, is_default: 0, is_terminal: 1, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 1, loss_reasons: ['nao_qualificado','sem_orcamento','nao_decidiu','concorrente','sem_contato','nao_responde','outro'], probability: 0 }
        ];
    },

    _getStage(stageId) {
        return this._getStages().find(s => s.id === stageId) || null;
    },

    getStatusLabel(id) {
        const s = this._getStage(id);
        return s ? s.label : id;
    },

    getStatusColor(id) {
        const s = this._getStage(id);
        return s ? s.color : '#6b7280';
    },

    getStatusNext(statusId) {
        const stages = this._getStages();
        const current = this._getStage(statusId);
        if (!current) return null;
        const next = stages.find(s => s.position > current.position && !s.is_loss);
        return next || null;
    },

    getStatusPrev(statusId) {
        const stages = this._getStages();
        const current = this._getStage(statusId);
        if (!current) return null;
        const prev = [...stages].reverse().find(s => s.position < current.position);
        return prev || null;
    },

    getLeadsPorStatus() {
        const leads = this.getLeads();
        const map = {};
        this._getStages().forEach(s => { map[s.id] = []; });
        leads.forEach(l => {
            if (map[l.status]) map[l.status].push(l);
            else {
                const defaultStage = this._getStages().find(s => s.is_default);
                if (defaultStage) map[defaultStage.id].push(l);
            }
        });
        return map;
    },

    getScoreClass(score) {
        if (score >= 80) return 'score-alto';
        if (score >= 50) return 'score-medio';
        return 'score-baixo';
    },

    calcularScoreAuto(lead) {
        let score = 0;
        if (lead.estimativa_valor > 50000) score += 25;
        else if (lead.estimativa_valor > 10000) score += 15;
        else if (lead.estimativa_valor > 5000) score += 10;
        else score += 5;
        if (lead.segmento) score += 5;
        if (lead.email) score += 5;
        if (lead.telefone || lead.celular) score += 5;
        if (lead.cargo) score += 3;
        if (lead.cnpj) score += 5;
        const interacoes = this.getInteracoes(lead.id);
        score += Math.min(interacoes.length * 3, 15);
        if (lead.orcamento_informado > 0) score += 5;
        if (lead.prazo_interesse) {
            const dias = Math.max(0, Math.ceil((new Date(lead.prazo_interesse) - new Date()) / 86400000));
            if (dias <= 15) score += 10;
            else if (dias <= 30) score += 5;
        }
        const stage = this._getStage(lead.status);
        const posWeight = stage ? Math.min(stage.position * 5, 35) : 0;
        score += posWeight;
        return Math.min(Math.max(score, 0), 100);
    },

    async recalcularScore(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) return;
        const score = this.calcularScoreAuto(lead);
        await store.updateCrmLead(leadId, { score, updated_at: new Date().toISOString() });
        return score;
    },

    async reindexAllScores() {
        const leads = this.getLeads();
        let changed = 0;
        for (const lead of leads) {
            const score = this.calcularScoreAuto(lead);
            if (score !== lead.score) {
                await store.updateCrmLead(lead.id, { score });
                changed++;
            }
        }
        if (changed > 0) console.log(`[CRM] Reindexed scores: ${changed} leads updated`);
    },

    async init() {
        this.container = document.getElementById('crm-app');
        this.render();
        this.updateBadge();
        this.reindexAllScores();
        this._lastOverdueTotal = 0;
        this._overdueTimer = null;
        this._notifyOverdue(true);
        this._startOverdueTimer();
        this._runAllSequencias().catch(() => {});
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    render() {
        if (!this.container) return;
        this.container.innerHTML = this._renderLayout();
        this._bindNavEvents();
        this._renderView();
    },

    _renderLayout() {
        return `
            <div class="crm-layout">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;margin:0;flex-shrink:0;">
                    <div>
                        <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                            <i class="ph ph-funnel"></i> CRM
                        </h2>
                        <div style="font-size:12px;opacity:0.9;margin-top:2px;">Gerencie seus leads e oportunidades aqui.</div>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-sm btn-ghost" onclick="window.crm.abrirModalNovoLead()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-plus"></i> Novo Lead
                        </button>
                    </div>
                </div>
                <div class="crm-header">
                    <div class="crm-tabs" id="crm-tabs">
                        <button class="crm-tab active" data-view="dashboard"><i class="ph ph-chart-bar"></i> Dashboard</button>
                        <button class="crm-tab" data-view="kanban"><i class="ph ph-columns"></i> Kanban</button>
                        <button class="crm-tab" data-view="tabela"><i class="ph ph-table"></i> Lista</button>
                        <button class="crm-tab" data-view="tarefas"><i class="ph ph-check-square"></i> Tarefas</button>
                        <button class="crm-tab" data-view="calendario"><i class="ph ph-calendar"></i> Calendário</button>
                        <button class="crm-tab" data-view="relatorios"><i class="ph ph-presentation-chart"></i> Relatórios</button>
                    </div>
                </div>
                <div class="crm-toolbar" id="crm-toolbar">
                    <div class="crm-filters">
                        <select id="crm-filter-status" onchange="window.crm._setFilter('status', this.value)"><option value="todos">Todos Status</option>${this._getStages().map(s => `<option value="${s.id}">${s.label}</option>`).join('')}</select>
                        <select id="crm-filter-vendedor" onchange="window.crm._setFilter('vendedor', this.value)"><option value="todos">Todos Vendedores</option>${this.getVendedores().map(v => `<option value="${v.id}">${v.nome || v.razao_social}</option>`).join('')}</select>
                        <input type="text" id="crm-search" placeholder="Buscar lead..." oninput="window.crm._setFilter('search', this.value)">
                        <select id="crm-filter-datefield" onchange="window.crm._setFilter('dateField', this.value)">
                            <option value="created_at">Data Criação</option>
                            <option value="data_ultimo_contato">Data Último Contato</option>
                        </select>
                        <input type="date" id="crm-filter-datestart" onchange="window.crm._setFilter('dateStart', this.value)" style="max-width:150px">
                        <input type="date" id="crm-filter-dateend" onchange="window.crm._setFilter('dateEnd', this.value)" style="max-width:150px">
                    </div>
                    <button class="btn btn-sm btn-ghost" onclick="window.crm.abrirConfigSequencias()" title="Sequências" style="margin-left:4px;white-space:nowrap"><i class="ph ph-flow-arrow"></i> Sequências</button>
                    <button class="btn btn-sm btn-ghost" onclick="window.crm.abrirConfigWebhooks()" title="Webhooks" style="margin-left:4px;white-space:nowrap"><i class="ph ph-plug"></i> Webhooks</button>
                </div>
                <div class="crm-content" id="crm-content"></div>
            </div>
        `;
    },

    _bindNavEvents() {
        const tabs = this.container.querySelectorAll('.crm-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._currentView = view;
                this._renderView();
            });
        });
    },

    _setFilter(type, value) {
        if (type === 'status') this._filterStatus = value;
        else if (type === 'vendedor') this._filterVendedor = value;
        else if (type === 'search') this._searchTerm = value.toLowerCase();
        else if (type === 'dateField') this._filterDateField = value;
        else if (type === 'dateStart') this._filterDateStart = value;
        else if (type === 'dateEnd') this._filterDateEnd = value;
        if (this._currentView === 'dashboard') this._renderDashboard();
        else if (this._currentView === 'tabela') this._renderTabela();
        else if (this._currentView === 'kanban') this._renderKanban();
        else if (this._currentView === 'tarefas') this._renderTarefas();
        else if (this._currentView === 'calendario') this._renderCalendario();
    },

    _filterLeads(leads) {
        let filtered = [...leads];
        if (this._filterStatus !== 'todos') {
            filtered = filtered.filter(l => l.status === this._filterStatus);
        }
        if (this._filterVendedor !== 'todos') {
            filtered = filtered.filter(l => l.vendedor_id === this._filterVendedor);
        }
        if (this._searchTerm) {
            const t = this._searchTerm;
            filtered = filtered.filter(l =>
                (l.nome || '').toLowerCase().includes(t) ||
                (l.empresa || '').toLowerCase().includes(t) ||
                (l.email || '').toLowerCase().includes(t) ||
                (l.celular || '').includes(t) ||
                (l.telefone || '').includes(t)
            );
        }
        if (this._filterDateStart || this._filterDateEnd) {
            const field = this._filterDateField;
            const start = this._filterDateStart;
            const end = this._filterDateEnd;
            filtered = filtered.filter(l => {
                const val = l[field];
                if (!val) return false;
                const d = val.slice(0, 10);
                if (start && d < start) return false;
                if (end && d > end) return false;
                return true;
            });
        }
        return filtered;
    },

    _renderView() {
        const content = document.getElementById('crm-content');
        if (!content) return;
        if (this._currentView === 'dashboard') this._renderDashboard();
        else if (this._currentView === 'kanban') this._renderKanban();
        else if (this._currentView === 'tabela') this._renderTabela();
        else if (this._currentView === 'tarefas') this._renderTarefas();
        else if (this._currentView === 'calendario') this._renderCalendario();
        else if (this._currentView === 'relatorios') this._renderRelatorios();
    },

    _renderDashboard() {
        const content = document.getElementById('crm-content');
        if (!content) return;
        const leads = this._filterLeads(this.getLeads());
        const total = leads.length;
        const stageDefault = this._getStages().find(s => s.is_default);
        const defaultId = stageDefault ? stageDefault.id : 'novo';
        const qualificados = leads.filter(l => {
            const st = this._getStage(l.status);
            return st && !st.is_default && !st.is_terminal && !st.is_loss && !st.tracks_conversao;
        }).length;
        const novos = leads.filter(l => {
            const st = this._getStage(l.status);
            return st ? st.is_default : l.status === defaultId;
        }).length;
        const desqualificados = leads.filter(l => {
            const st = this._getStage(l.status);
            return st ? st.is_loss : false;
        }).length;
        const viraram = leads.filter(l => {
            const st = this._getStage(l.status);
            return st ? st.tracks_conversao : false;
        }).length;
        const valorEst = leads.reduce((s, l) => s + (parseFloat(l.estimativa_valor) || 0), 0);
        const forecastPonderado = leads.reduce((s, l) => {
            const st = this._getStage(l.status);
            const prob = st ? (st.probability ?? 0) : 0;
            return s + (parseFloat(l.estimativa_valor) || 0) * prob / 100;
        }, 0);
        const hoje = new Date().toISOString().slice(0, 10);
        const tarefasHoje = this.getTarefas().filter(t => t.status !== 'concluida' && t.data_vencimento && t.data_vencimento.slice(0, 10) <= hoje).length;
        const leadsComFollowup = leads.filter(l => {
            if (!l.data_proximo_followup) return false;
            const st = this._getStage(l.status);
            if (st && st.is_terminal) return false;
            return l.data_proximo_followup.slice(0, 10) <= hoje;
        }).length;

        const porStatus = this.getLeadsPorStatus();

        const funnelBars = this._getStages().map(s => {
            const qtde = porStatus[s.id]?.length || 0;
            const pct = total > 0 ? (qtde / total * 100) : 0;
            return `
                <div class="crm-funnel-bar">
                    <div class="crm-funnel-row">
                        <span class="crm-funnel-label">${s.label}</span>
                        <span class="crm-funnel-count" style="color:${s.color}">${qtde}</span>
                    </div>
                    <div class="crm-bar-bg"><div class="crm-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
                </div>
            `;
        }).join('');

        const ultimosLeads = leads.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10);

        content.innerHTML = `
            <div class="crm-dashboard">
                <div class="crm-dashboard-grid">
                    <div class="crm-dashboard-col">
                        <div class="crm-panel">
                            <div class="crm-panel-header"><i class="ph ph-chart-pie"></i> Resumo Geral</div>
                            <div class="crm-panel-body">
                                <div class="crm-summary-cards">
                                    <div class="crm-summary-card"><div class="crm-summary-value">${total}</div><div class="crm-summary-label">Total Leads</div></div>
                                    <div class="crm-summary-card"><div class="crm-summary-value">${novos}</div><div class="crm-summary-label">Novos</div></div>
                                    <div class="crm-summary-card"><div class="crm-summary-value">${qualificados}</div><div class="crm-summary-label">Qualificados</div></div>
                                    <div class="crm-summary-card"><div class="crm-summary-value">${viraram}</div><div class="crm-summary-label">Viraram Proposta</div></div>
                                    <div class="crm-summary-card"><div class="crm-summary-value">${desqualificados}</div><div class="crm-summary-label">Desqualificados</div></div>
                                    <div class="crm-summary-card"><div class="crm-summary-value">${this.formatCurrency(valorEst)}</div><div class="crm-summary-label">Estimativa Total</div></div>
                                    <div class="crm-summary-card"><div class="crm-summary-value">${this.formatCurrency(forecastPonderado)}</div><div class="crm-summary-label">Forecast Ponderado</div></div>
                                </div>
                                ${(() => {
                                    const vends = this.getVendedores();
                                    const metaTotal = vends.reduce((s, v) => s + (parseFloat(v.meta_mensal) || 0), 0);
                                    if (metaTotal <= 0) return '';
                                    const leadsAll = this._filterLeads(this.getLeads());
                                    const valorTotal = leadsAll.reduce((s, l) => s + (parseFloat(l.estimativa_valor) || 0), 0);
                                    const pct = Math.min(valorTotal / metaTotal * 100, 100);
                                    const color = pct >= 100 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444';
                                    return `<div style="margin-top:10px;padding:8px 10px;background:#f8fafc;border-radius:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span>Meta Global: ${this.formatCurrency(metaTotal)}</span><span style="font-weight:600;color:${color}">${pct.toFixed(0)}%</span></div><div class="crm-bar-bg"><div class="crm-bar-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
                                })()}
                            </div>
                        </div>
                        <div class="crm-panel">
                            <div class="crm-panel-header"><i class="ph ph-bell"></i> Alertas e Ações</div>
                            <div class="crm-panel-body">
                                ${tarefasHoje > 0 || leadsComFollowup > 0 ? `
                                    <div style="margin-bottom:8px">
                                        ${tarefasHoje > 0 ? `<div class="crm-alert-item"><span class="crm-alert-icon" style="color:var(--color-danger)"><i class="ph ph-warning-circle"></i></span> ${tarefasHoje} tarefa(s) pendente(s) para hoje</div>` : ''}
                                        ${leadsComFollowup > 0 ? `<div class="crm-alert-item"><span class="crm-alert-icon" style="color:var(--color-warning)"><i class="ph ph-bell-ringing"></i></span> ${leadsComFollowup} lead(s) com follow-up atrasado</div>` : ''}
                                    </div>
                                ` : '<div style="color:var(--color-text-muted);padding:8px 0">Nenhum alerta pendente</div>'}
                                <button class="btn btn-sm" onclick="window.crm._currentView='tarefas';window.crm._renderView();document.querySelectorAll('.crm-tab').forEach(t=>t.classList.remove('active'));document.querySelector('.crm-tab[data-view=tarefas]')?.classList.add('active')">Ver Tarefas</button>
                            </div>
                        </div>
                    </div>
                    <div class="crm-dashboard-col">
                        <div class="crm-panel">
                            <div class="crm-panel-header"><i class="ph ph-funnel"></i> Funil</div>
                            <div class="crm-panel-body">
                                ${funnelBars}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="crm-panel" style="margin-top:12px">
                    <div class="crm-panel-header"><i class="ph ph-list"></i> Últimos Leads</div>
                    <div class="crm-panel-body" style="padding:0">
                        <table class="crm-table">
                            <thead><tr><th>Lead</th><th>Status</th><th>Score</th><th>Vendedor</th><th>Valor Est.</th><th>Criação</th></tr></thead>
                            <tbody>
                                ${ultimosLeads.map(l => `
                                    <tr class="crm-table-row-clickable" onclick="window.crm.abrirModalLead('${l.id}')">
                                        <td><strong>${this._esc(l.nome)}</strong>${l.empresa ? `<br><span class="crm-text-muted">${this._esc(l.empresa)}</span>` : ''}</td>
                                        <td><span class="crm-status-badge" style="background:${this.getStatusColor(l.status)}">${this.getStatusLabel(l.status)}</span></td>
                                        <td><span class="crm-score ${this.getScoreClass(l.score)}">${l.score ?? 0}</span></td>
                                        <td>${this.getVendedorNome(l.vendedor_id)}</td>
                                        <td>${this.formatCurrency(l.estimativa_valor)}</td>
                                        <td class="crm-text-muted">${l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    _renderKanban() {
        const content = document.getElementById('crm-content');
        if (!content) return;
        const porStatus = this.getLeadsPorStatus();

        let columns = '';
        this._getStages().forEach(s => {
            const leads = porStatus[s.id] || [];
            let cards = leads.map(l => this._renderLeadCard(l)).join('');
            if (!cards) cards = '<div class="crm-kanban-empty">Nenhum lead</div>';
            columns += `
                <div class="crm-kanban-col" data-status="${s.id}">
                    <div class="crm-kanban-col-header" style="border-bottom-color:${s.color}">
                        <span class="crm-kanban-col-title">${s.label}</span>
                        <span class="crm-kanban-col-count">${leads.length}</span>
                    </div>
                    <div class="crm-kanban-col-body" ondragover="event.preventDefault()" ondrop="window.crm._onDrop(event, '${s.id}')">
                        ${cards}
                    </div>
                </div>
            `;
        });

        content.innerHTML = `<div class="crm-kanban">${columns}</div>`;
    },

    _renderLeadCard(lead) {
        const stage = this._getStage(lead.status);
        const isTerminal = stage ? stage.is_terminal : false;
        const hasFollowup = lead.data_proximo_followup && !isTerminal;
        const isLate = hasFollowup && lead.data_proximo_followup.slice(0, 10) <= new Date().toISOString().slice(0, 10);
        return `
            <div class="crm-lead-card" draggable="true" data-id="${lead.id}"
                 onclick="window.crm.abrirModalLead('${lead.id}')"
                 ondragstart="window.crm._onDragStart(event, '${lead.id}')">
                <div class="crm-lead-card-header">
                    <strong>${this._esc(lead.nome)}</strong>
                    <span class="crm-score ${this.getScoreClass(lead.score)}">${lead.score ?? 0}</span>
                </div>
                ${lead.empresa ? `<div class="crm-lead-card-empresa">${this._esc(lead.empresa)}</div>` : ''}
                <div class="crm-lead-card-info">
                    ${lead.celular ? `<span><i class="ph ph-phone"></i> ${lead.celular}</span>` : ''}
                    ${lead.estimativa_valor > 0 ? `<span><i class="ph ph-currency-circle-dollar"></i> ${this.formatCurrency(lead.estimativa_valor)}</span>` : ''}
                    ${lead.estimativa_valor > 0 && stage && (stage.probability ?? 0) > 0 ? `<span><i class="ph ph-chart-line"></i> ${this.formatCurrency(lead.estimativa_valor * (stage.probability ?? 0) / 100)}</span>` : ''}
                </div>
                <div class="crm-lead-card-footer">
                    <span class="crm-text-muted">${this.getVendedorNome(lead.vendedor_id)}</span>
                    ${isLate ? `<span class="crm-followup-late"><i class="ph ph-warning"></i></span>` : ''}
                </div>
                <div class="crm-lead-card-preview">
                    ${this._getNextTaskPreview(lead.id)}
                    ${hasFollowup ? `<span class="${isLate ? 'crm-followup-late' : ''}"><i class="ph ph-calendar"></i> ${new Date(lead.data_proximo_followup).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;
    },

    _getNextTaskPreview(leadId) {
        const tarefas = this.getTarefas(leadId).filter(t => t.status === 'pendente');
        if (tarefas.length === 0) return '';
        const next = tarefas.sort((a, b) => new Date(a.data_vencimento || 0) - new Date(b.data_vencimento || 0))[0];
        const date = next.data_vencimento ? new Date(next.data_vencimento).toLocaleDateString() : '';
        return `<span><i class="ph ph-check-square"></i> ${this._esc(next.titulo)}${date ? ' (' + date + ')' : ''}</span>`;
    },

    _onDragStart(event, leadId) {
        event.dataTransfer.setData('text/plain', leadId);
        event.currentTarget.style.opacity = '0.5';
    },

    async _onDrop(event, newStatus) {
        event.preventDefault();
        const leadId = event.dataTransfer.getData('text/plain');
        if (!leadId) return;
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead || lead.status === newStatus) return;
        const oldStage = this._getStage(lead.status);
        if (oldStage && oldStage.is_terminal) return;
        const newStage = this._getStage(newStatus);
        if (!newStage) return;
        if (newStage.is_loss) {
            this.abrirModalDesqualificar(leadId);
            return;
        }
        await store.updateCrmLead(leadId, { status: newStatus, updated_at: new Date().toISOString() });
        if (newStage.tracks_qualificacao && !lead.data_qualificacao) {
            await store.updateCrmLead(leadId, { data_qualificacao: new Date().toISOString() });
        }
        this.updateBadge();
        this._renderView();
    },

    _renderTabela() {
        const content = document.getElementById('crm-content');
        if (!content) return;
        const leads = this._filterLeads(this.getLeads());
        const sorted = this._sortLeads(leads);

        if (sorted.length === 0) {
            content.innerHTML = '<div class="crm-empty"><i class="ph ph-ghost"></i><p>Nenhum lead encontrado</p></div>';
            return;
        }

        const sortIcon = (field) => {
            if (this._sortField !== field) return '';
            return this._sortDir === 'asc' ? ' ▲' : ' ▼';
        };

        content.innerHTML = `
            <div style="display:flex;gap:8px;margin-bottom:8px;justify-content:flex-end">
                <button class="btn btn-sm" onclick="window.crm._baixarModeloCsv()" title="Baixar modelo CSV para importação"><i class="ph ph-download-simple"></i> Modelo</button>
                <button class="btn btn-sm" onclick="window.crm.abrirModalImportarLeads()" title="Importar leads de CSV ou XLSX"><i class="ph ph-upload-simple"></i> Importar</button>
                <button class="btn btn-sm" onclick="window.crm._exportCSV()"><i class="ph ph-file-csv"></i> CSV</button>
                <button class="btn btn-sm" onclick="window.crm._exportXLSX()"><i class="ph ph-table"></i> XLSX</button>
            </div>
            <table class="crm-table">
                <thead>
                    <tr>
                        <th onclick="window.crm._toggleSort('nome')" style="cursor:pointer">Lead${sortIcon('nome')}</th>
                        <th onclick="window.crm._toggleSort('status')" style="cursor:pointer">Status${sortIcon('status')}</th>
                        <th onclick="window.crm._toggleSort('score')" style="cursor:pointer">Score${sortIcon('score')}</th>
                        <th onclick="window.crm._toggleSort('vendedor_id')" style="cursor:pointer">Vendedor${sortIcon('vendedor_id')}</th>
                        <th onclick="window.crm._toggleSort('estimativa_valor')" style="cursor:pointer">Valor Est.${sortIcon('estimativa_valor')}</th>
                        <th onclick="window.crm._toggleSort('probability')" style="cursor:pointer">Prob.${sortIcon('probability')}</th>
                        <th onclick="window.crm._toggleSort('created_at')" style="cursor:pointer">Criação${sortIcon('created_at')}</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(l => `
                        <tr class="crm-table-row-clickable" onclick="window.crm.abrirModalLead('${l.id}')">
                            <td><strong>${this._esc(l.nome)}</strong>${l.empresa ? `<br><span class="crm-text-muted">${this._esc(l.empresa)}</span>` : ''}</td>
                            <td><span class="crm-status-badge" style="background:${this.getStatusColor(l.status)}">${this.getStatusLabel(l.status)}</span></td>
                            <td><span class="crm-score ${this.getScoreClass(l.score)}">${l.score ?? 0}</span></td>
                            <td>${this.getVendedorNome(l.vendedor_id)}</td>
                            <td>${this.formatCurrency(l.estimativa_valor)}</td>
                            <td>${(() => { const st = this._getStage(l.status); const prob = st ? (st.probability ?? 0) : 0; return prob > 0 ? `<span style="font-weight:600">${prob}%</span><br><span class="crm-text-muted">${this.formatCurrency((parseFloat(l.estimativa_valor) || 0) * prob / 100)}</span>` : '—'; })()}</td>
                            <td class="crm-text-muted">${l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
                            <td>
                                <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
                                    <button class="btn btn-sm" onclick="window.crm.abrirModalLead('${l.id}')" title="Abrir"><i class="ph ph-eye"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    _sortLeads(leads) {
        const field = this._sortField;
        const dir = this._sortDir === 'asc' ? 1 : -1;
        return [...leads].sort((a, b) => {
            if (field === 'probability') {
                const stA = this._getStage(a.status);
                const stB = this._getStage(b.status);
                const probA = stA ? (stA.probability ?? 0) : 0;
                const probB = stB ? (stB.probability ?? 0) : 0;
                return (probA - probB) * dir;
            }
            let va = a[field] ?? '';
            let vb = b[field] ?? '';
            if (field === 'estimativa_valor' || field === 'score') {
                va = parseFloat(va) || 0;
                vb = parseFloat(vb) || 0;
                return (va - vb) * dir;
            }
            if (field === 'created_at') {
                return (new Date(va) - new Date(vb)) * dir;
            }
            return String(va).localeCompare(String(vb)) * dir;
        });
    },

    _toggleSort(field) {
        if (this._sortField === field) {
            this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this._sortField = field;
            this._sortDir = 'asc';
        }
        this._renderTabela();
    },

    _renderTarefas() {
        const content = document.getElementById('crm-content');
        if (!content) return;
        const tarefas = this.getTarefas();
        const pendentes = tarefas.filter(t => t.status !== 'concluida').sort((a, b) => {
            if (!a.data_vencimento) return 1;
            if (!b.data_vencimento) return -1;
            return new Date(a.data_vencimento) - new Date(b.data_vencimento);
        });
        const concluidas = tarefas.filter(t => t.status === 'concluida').sort((a, b) => new Date(b.data_conclusao || 0) - new Date(a.data_conclusao || 0));
        const hoje = new Date().toISOString().slice(0, 10);

        content.innerHTML = `
            <div style="display:flex;gap:12px;height:100%">
                <div style="flex:1">
                    <div class="crm-panel">
                        <div class="crm-panel-header"><i class="ph ph-clock"></i> Pendentes (${pendentes.length})</div>
                        <div class="crm-panel-body" style="max-height:60vh;overflow-y:auto">
                            ${pendentes.length === 0 ? '<div class="crm-empty"><p>Nenhuma tarefa pendente</p></div>' :
                                pendentes.map(t => this._renderTarefaCard(t, hoje)).join('')}
                        </div>
                    </div>
                </div>
                        <div style="flex:1">
                            <div class="crm-panel">
                                <div class="crm-panel-header"><i class="ph ph-check-circle"></i> Concluídas (${concluidas.length})</div>
                                <div class="crm-panel-body" style="max-height:60vh;overflow-y:auto">
                                    ${concluidas.length === 0 ? '<div class="crm-empty"><p>Nenhuma tarefa concluída</p></div>' :
                                        concluidas.map(t => this._renderTarefaCard(t, hoje)).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                this.updateBadge();
            },

    _renderCalendario() {
        const content = document.getElementById('crm-content');
        if (!content) return;

        const now = new Date();
        const year = this._calendarDate.getFullYear();
        const month = this._calendarDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const weekdayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

        const tarefas = this.getTarefas();
        const leads = this.getLeads();

        const todayStr = now.toISOString().slice(0, 10);
        const selDay = this._selectedCalendarDay;

        const itemsByDay = {};
        const addItem = (dateStr, item, type) => {
            if (!itemsByDay[dateStr]) itemsByDay[dateStr] = [];
            itemsByDay[dateStr].push({ ...item, _type: type });
        };

        tarefas.forEach(t => {
            if (t.data_vencimento) {
                const d = t.data_vencimento.slice(0, 10);
                addItem(d, t, 'tarefa');
            }
        });

        leads.forEach(l => {
            if (l.data_proximo_followup) {
                const d = l.data_proximo_followup.slice(0, 10);
                addItem(d, l, 'followup');
            }
        });

        const cellHtml = [];
        for (let i = 0; i < firstDay; i++) {
            const d = daysInPrevMonth - firstDay + 1 + i;
            cellHtml.push(`<div class="crm-cal-day crm-cal-day-other">${d}</div>`);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = selDay === dateStr;
            const items = itemsByDay[dateStr] || [];
            const tarefaCount = items.filter(i => i._type === 'tarefa').length;
            const followupCount = items.filter(i => i._type === 'followup').length;
            cellHtml.push(`
                <div class="crm-cal-day ${isToday ? 'crm-cal-day-today' : ''} ${isSelected ? 'crm-cal-day-selected' : ''}" onclick="window.crm._selectCalendarDay('${dateStr}')">
                    <span class="crm-cal-day-num">${d}</span>
                    ${tarefaCount > 0 ? `<span class="crm-cal-badge crm-cal-badge-tarefa" title="${tarefaCount} tarefa(s)">${tarefaCount}</span>` : ''}
                    ${followupCount > 0 ? `<span class="crm-cal-badge crm-cal-badge-followup" title="${followupCount} follow-up(s)">${followupCount}</span>` : ''}
                </div>
            `);
        }

        const selectedItems = selDay && itemsByDay[selDay] ? itemsByDay[selDay] : [];
        const selDateLabel = selDay ? new Date(selDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

        content.innerHTML = `
            <div style="display:flex;gap:12px;height:100%">
                <div style="flex:2">
                    <div class="crm-panel">
                        <div class="crm-panel-header">
                            <div style="display:flex;align-items:center;gap:8px">
                                <button class="btn btn-sm" onclick="window.crm._calendarNav(-1)" title="Mês anterior"><i class="ph ph-caret-left"></i></button>
                                <strong style="font-size:15px">${monthNames[month]} ${year}</strong>
                                <button class="btn btn-sm" onclick="window.crm._calendarNav(1)" title="Próximo mês"><i class="ph ph-caret-right"></i></button>
                                <button class="btn btn-sm" onclick="window.crm._calendarToday()" title="Hoje"><i class="ph ph-clock-counter-clockwise"></i> Hoje</button>
                            </div>
                        </div>
                        <div class="crm-panel-body" style="padding:8px">
                            <div class="crm-cal-grid">
                                ${weekdayNames.map(w => `<div class="crm-cal-weekday">${w}</div>`).join('')}
                                ${cellHtml.join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1">
                    <div class="crm-panel">
                        <div class="crm-panel-header"><i class="ph ph-list"></i> ${selDay ? this._esc(selDateLabel) : 'Selecione um dia'}</div>
                        <div class="crm-panel-body" style="max-height:60vh;overflow-y:auto">
                            ${!selDay ? '<div class="crm-empty"><p>Clique em um dia para ver os eventos</p></div>' :
                                selectedItems.length === 0 ? '<div class="crm-empty"><p>Nenhum evento neste dia</p></div>' :
                                selectedItems.sort((a, b) => {
                                    if (a._type !== b._type) return a._type === 'tarefa' ? -1 : 1;
                                    return 0;
                                }).map(item => {
                                    if (item._type === 'tarefa') {
                                        const lead = leads.find(l => l.id === item.lead_id);
                                        const isLate = item.data_vencimento && item.data_vencimento.slice(0, 10) < todayStr && item.status !== 'concluida';
                                        return `
                                            <div class="crm-tarefa-card ${isLate ? 'crm-tarefa-late' : ''}">
                                                <div class="crm-tarefa-card-header">
                                                    <strong>${this._esc(item.titulo)}</strong>
                                                    <span class="crm-tarefa-tipo ${item.tipo}">${item.tipo}</span>
                                                </div>
                                                <div class="crm-tarefa-card-body">
                                                    ${item.descricao ? `<p>${this._esc(item.descricao)}</p>` : ''}
                                                    <div class="crm-tarefa-card-meta">
                                                        ${lead ? `<span><i class="ph ph-user"></i> ${this._esc(lead.nome)}</span>` : ''}
                                                        ${item.status !== 'concluida' ? `<button class="btn btn-sm btn-success" onclick="window.crm._concluirTarefa('${item.id}')"><i class="ph ph-check"></i></button>` : `<span style="color:#16a34a;font-size:11px"><i class="ph ph-check-circle"></i> Concluída</span>`}
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    } else {
                                        const lead = leads.find(l => l.id === item.id);
                                        return `
                                            <div class="crm-interacao-card" style="cursor:pointer" onclick="window.crm.abrirModalLead('${item.id}')">
                                                <div class="crm-interacao-header">
                                                    <span class="crm-status-badge" style="background:${this.getStatusColor(item.status)};font-size:10px;padding:2px 6px">${this.getStatusLabel(item.status)}</span>
                                                </div>
                                                <div class="crm-interacao-body">
                                                    <strong>${this._esc(item.nome)}${item.empresa ? ' — ' + this._esc(item.empresa) : ''}</strong>
                                                </div>
                                                <div class="crm-interacao-resultado"><i class="ph ph-bell-ringing"></i> Follow-up agendado</div>
                                            </div>
                                        `;
                                    }
                                }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    _calendarNav(dir) {
        const d = new Date(this._calendarDate);
        d.setMonth(d.getMonth() + dir);
        this._calendarDate = d;
        this._selectedCalendarDay = null;
        this._renderCalendario();
    },

    _calendarToday() {
        this._calendarDate = new Date();
        const todayStr = new Date().toISOString().slice(0, 10);
        this._selectedCalendarDay = todayStr;
        this._renderCalendario();
    },

    _selectCalendarDay(dateStr) {
        this._selectedCalendarDay = this._selectedCalendarDay === dateStr ? null : dateStr;
        this._renderCalendario();
    },

    abrirConfigWebhooks() {
        const webhooks = store.getState().crmWebhooks || [];
        const eventosDisponiveis = [
            { id: 'crmLeads:created', label: 'Lead Criado' },
            { id: 'crmLeads:updated', label: 'Lead Atualizado' },
            { id: 'crmLeads:deleted', label: 'Lead Excluído' },
            { id: 'crmInteracoes:created', label: 'Interação Registrada' },
            { id: 'crmTarefas:created', label: 'Tarefa Criada' },
            { id: 'crmTarefas:updated', label: 'Tarefa Atualizada' },
            { id: 'crmNotas:created', label: 'Nota Adicionada' }
        ];

        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal" style="max-width:700px">
                <div class="crm-modal-header">
                    <h3><i class="ph ph-plug"></i> Webhooks Pipeline</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <div style="margin-bottom:16px;font-size:12px;color:var(--color-text-muted)">
                        Webhooks disparam requisições HTTP para URLs externas quando eventos do CRM ocorrem.
                    </div>
                    <div style="margin-bottom:12px">
                        <button class="btn btn-sm btn-primary" onclick="window.crm._addWebhookForm()"><i class="ph ph-plus"></i> Novo Webhook</button>
                    </div>
                    <div id="crm-webhooks-list">
                        ${webhooks.length === 0 ? '<div class="crm-empty"><p>Nenhum webhook configurado</p></div>' :
                            webhooks.map(wh => {
                                const eventos = (() => { try { return JSON.parse(wh.eventos || '[]'); } catch { return []; } })();
                                return `
                                <div class="crm-interacao-card" style="margin-bottom:8px">
                                    <div class="crm-interacao-header">
                                        <strong>${this._esc(wh.nome)}</strong>
                                        <div style="display:flex;gap:6px;align-items:center">
                                            <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer">
                                                <input type="checkbox" ${wh.ativo !== false ? 'checked' : ''} onchange="window.crm._toggleWebhook('${wh.id}', this.checked)">
                                                Ativo
                                            </label>
                                        </div>
                                    </div>
                                    <div class="crm-interacao-body">
                                        <div style="font-size:11px;color:var(--color-text-muted);word-break:break-all">${this._esc(wh.url)}</div>
                                        <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">
                                            ${eventos.map(e => `<span style="font-size:10px;background:#e2e8f0;padding:1px 6px;border-radius:4px">${eventosDisponiveis.find(ed => ed.id === e)?.label || e}</span>`).join('')}
                                        </div>
                                    </div>
                                    <div class="crm-interacao-footer">
                                        <button class="btn btn-sm" onclick="window.crm._testWebhook('${wh.id}')"><i class="ph ph-lightning"></i> Testar</button>
                                        <button class="btn btn-sm btn-danger" onclick="window.crm._deleteWebhook('${wh.id}')"><i class="ph ph-trash"></i></button>
                                    </div>
                                </div>
                            `}).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _addWebhookForm() {
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal" style="max-width:500px">
                <div class="crm-modal-header">
                    <h3>Novo Webhook</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <form id="crm-webhook-form" onsubmit="event.preventDefault();window.crm._saveWebhook()">
                        <div class="crm-form-grid">
                            <div class="crm-field" style="grid-column:span 2">
                                <label>Nome</label>
                                <input type="text" id="wh-nome" class="form-control" required placeholder="Ex: Notificar Slack">
                            </div>
                            <div class="crm-field" style="grid-column:span 2">
                                <label>URL</label>
                                <input type="url" id="wh-url" class="form-control" required placeholder="https://hooks.slack.com/...">
                            </div>
                            <div class="crm-field" style="grid-column:span 2">
                                <label>Eventos</label>
                                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
                                    ${[
                                        { id: 'crmLeads:created', label: 'Lead Criado' },
                                        { id: 'crmLeads:updated', label: 'Lead Atualizado' },
                                        { id: 'crmLeads:deleted', label: 'Lead Excluído' },
                                        { id: 'crmInteracoes:created', label: 'Interação' },
                                        { id: 'crmTarefas:created', label: 'Tarefa Criada' },
                                        { id: 'crmTarefas:updated', label: 'Tarefa Atualizada' },
                                        { id: 'crmNotas:created', label: 'Nota' }
                                    ].map(e => `
                                        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer">
                                            <input type="checkbox" class="wh-evento" value="${e.id}" checked> ${e.label}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
                            <button type="button" class="btn btn-sm" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                            <button type="submit" class="btn btn-sm btn-primary"><i class="ph ph-check"></i> Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async _saveWebhook() {
        const nome = document.getElementById('wh-nome')?.value?.trim();
        const url = document.getElementById('wh-url')?.value?.trim();
        if (!nome || !url) { this.showToast('Preencha nome e URL.', 'warning'); return; }
        const eventoEls = document.querySelectorAll('.wh-evento:checked');
        const eventos = Array.from(eventoEls).map(el => el.value);
        if (eventos.length === 0) { this.showToast('Selecione pelo menos um evento.', 'warning'); return; }
        const item = {
            id: crypto.randomUUID(),
            nome, url,
            eventos: JSON.stringify(eventos),
            ativo: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const webhooks = [...(store.getState().crmWebhooks || []), item];
        store.setState({ crmWebhooks: webhooks });
        await store._syncCreate('crmWebhooks', item).catch(() => {});
        const overlay = document.getElementById('crm-webhook-form')?.closest('.crm-modal-overlay');
        if (overlay) overlay.remove();
        this.abrirConfigWebhooks();
        this.showToast('Webhook adicionado!', 'success');
    },

    async _toggleWebhook(id, ativo) {
        const webhooks = store.getState().crmWebhooks || [];
        const wh = webhooks.find(w => w.id === id);
        if (!wh) return;
        wh.ativo = ativo ? 1 : 0;
        store.setState({ crmWebhooks: webhooks });
        await store._syncUpdate('crmWebhooks', id, { ativo: wh.ativo }).catch(() => {});
        this.abrirConfigWebhooks();
    },

    async _deleteWebhook(id) {
        if (!confirm('Excluir este webhook?')) return;
        const webhooks = (store.getState().crmWebhooks || []).filter(w => w.id !== id);
        store.setState({ crmWebhooks: webhooks });
        await store._syncDelete('crmWebhooks', id).catch(() => {});
        this.abrirConfigWebhooks();
    },

    async _testWebhook(id) {
        const wh = (store.getState().crmWebhooks || []).find(w => w.id === id);
        if (!wh) return;
        const token = store.getState().auth?.token;
        if (!token) { this.showToast('Não autenticado.', 'warning'); return; }
        try {
            const res = await fetch('/api/webhooks/test', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: wh.url, entity: 'crmLeads' })
            });
            const data = await res.json();
            if (data.success && data.status >= 200 && data.status < 300) {
                this.showToast(`Teste OK! Status: ${data.status}`, 'success');
            } else {
                this.showToast(`Falha: ${data.status || data.error}`, 'error');
            }
        } catch (err) {
            this.showToast(`Erro: ${err.message}`, 'error');
        }
    },

    _getSequencias() {
        return store.getState().crmSequencias || [];
    },

    async _applySequencias(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) return;
        const sequencias = this._getSequencias().filter(s => s.ativo !== false);
        const existingTasks = this.getTarefas(leadId);
        for (const seq of sequencias) {
            if (seq.trigger_event === 'stage_entered' && seq.trigger_value === lead.status) {
                const alreadyHas = existingTasks.some(t => t.titulo === seq.task_titulo && t.status !== 'concluida' && t._seq_id === seq.id);
                if (alreadyHas) continue;
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + (parseInt(seq.delay_days) || 0));
                const tarefa = {
                    id: crypto.randomUUID(),
                    lead_id: leadId,
                    titulo: seq.task_titulo,
                    descricao: seq.task_descricao || '',
                    tipo: 'sequencia',
                    prioridade: seq.task_prioridade || 'media',
                    status: 'pendente',
                    data_vencimento: dueDate.toISOString().slice(0, 10),
                    lead_nome: lead.nome,
                    _seq_id: seq.id,
                    created_at: new Date().toISOString()
                };
                await store.addCrmTarefa(tarefa);
            }
        }
    },

    async _runAllSequencias() {
        const leads = this.getLeads();
        for (const lead of leads) {
            await this._applySequencias(lead.id);
        }
        console.log('[CRM] Sequências aplicadas para', leads.length, 'leads');
    },

    abrirConfigSequencias() {
        const sequencias = this._getSequencias();
        const stages = this._getStages();
        const content = document.getElementById('crm-content');
        if (!content) return;

        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal" style="max-width:700px">
                <div class="crm-modal-header">
                    <h3><i class="ph ph-flow-arrow"></i> Sequências de Atividades</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <div style="margin-bottom:16px;font-size:12px;color:var(--color-text-muted)">
                        Sequências criam tarefas automaticamente quando um lead atinge um estágio específico.
                    </div>
                    <div style="margin-bottom:12px">
                        <button class="btn btn-sm btn-primary" onclick="window.crm._addSequenciaForm()"><i class="ph ph-plus"></i> Nova Sequência</button>
                    </div>
                    <div id="crm-sequencias-list">
                        ${sequencias.length === 0 ? '<div class="crm-empty"><p>Nenhuma sequência configurada</p></div>' :
                            sequencias.map(seq => {
                                const stageLabel = stages.find(s => s.id === seq.trigger_value)?.label || seq.trigger_value;
                                return `
                                <div class="crm-interacao-card" style="margin-bottom:8px">
                                    <div class="crm-interacao-header">
                                        <strong>${this._esc(seq.nome)}</strong>
                                        <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer">
                                            <input type="checkbox" ${seq.ativo !== false ? 'checked' : ''} onchange="window.crm._toggleSequencia('${seq.id}', this.checked)">
                                            Ativo
                                        </label>
                                    </div>
                                    <div class="crm-interacao-body" style="font-size:12px">
                                        <span style="background:#e2e8f0;padding:1px 6px;border-radius:4px">${this._esc(stageLabel)}</span>
                                        → ${this._esc(seq.task_titulo)}
                                        ${parseInt(seq.delay_days) > 0 ? ` (${seq.delay_days} dia(s) após)` : ' (imediato)'}
                                    </div>
                                    <div class="crm-interacao-footer">
                                        <button class="btn btn-sm btn-danger" onclick="window.crm._deleteSequencia('${seq.id}')"><i class="ph ph-trash"></i></button>
                                    </div>
                                </div>
                            `}).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _addSequenciaForm() {
        const stages = this._getStages();
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal" style="max-width:500px">
                <div class="crm-modal-header">
                    <h3>Nova Sequência</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <form id="crm-sequencia-form" onsubmit="event.preventDefault();window.crm._saveSequencia()">
                        <div class="crm-form-grid">
                            <div class="crm-field" style="grid-column:span 2">
                                <label>Nome da Sequência</label>
                                <input type="text" id="seq-nome" class="form-control" required placeholder="Ex: Follow-up pós-qualificação">
                            </div>
                            <div class="crm-field">
                                <label>Quando entrar no estágio</label>
                                <select id="seq-trigger-value" class="form-control" required>
                                    <option value="">Selecione...</option>
                                    ${stages.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
                                </select>
                            </div>
                            <div class="crm-field">
                                <label>Atraso (dias)</label>
                                <input type="number" id="seq-delay" class="form-control" value="0" min="0">
                            </div>
                            <div class="crm-field" style="grid-column:span 2">
                                <label>Título da Tarefa</label>
                                <input type="text" id="seq-titulo" class="form-control" required placeholder="Ex: Ligar para cliente">
                            </div>
                            <div class="crm-field" style="grid-column:span 2">
                                <label>Descrição</label>
                                <textarea id="seq-descricao" class="form-control" rows="2"></textarea>
                            </div>
                            <div class="crm-field">
                                <label>Prioridade</label>
                                <select id="seq-prioridade" class="form-control">
                                    <option value="baixa">Baixa</option>
                                    <option value="media" selected>Média</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                        </div>
                        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
                            <button type="button" class="btn btn-sm" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                            <button type="submit" class="btn btn-sm btn-primary"><i class="ph ph-check"></i> Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async _saveSequencia() {
        const nome = document.getElementById('seq-nome')?.value?.trim();
        const trigger_value = document.getElementById('seq-trigger-value')?.value;
        const delay_days = parseInt(document.getElementById('seq-delay')?.value) || 0;
        const task_titulo = document.getElementById('seq-titulo')?.value?.trim();
        const task_descricao = document.getElementById('seq-descricao')?.value?.trim() || '';
        const task_prioridade = document.getElementById('seq-prioridade')?.value || 'media';
        if (!nome || !trigger_value || !task_titulo) { this.showToast('Preencha nome, estágio e título da tarefa.', 'warning'); return; }
        const item = {
            id: crypto.randomUUID(),
            nome,
            trigger_event: 'stage_entered',
            trigger_value,
            delay_days,
            task_titulo,
            task_descricao,
            task_prioridade,
            ativo: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const sequencias = [...(this._getSequencias()), item];
        store.setState({ crmSequencias: sequencias });
        await store._syncCreate('crmSequencias', item).catch(() => {});
        const overlay = document.getElementById('crm-sequencia-form')?.closest('.crm-modal-overlay');
        if (overlay) overlay.remove();
        this.abrirConfigSequencias();
        this.showToast('Sequência criada!', 'success');
    },

    async _toggleSequencia(id, ativo) {
        const sequencias = this._getSequencias();
        const seq = sequencias.find(s => s.id === id);
        if (!seq) return;
        seq.ativo = ativo ? 1 : 0;
        store.setState({ crmSequencias: sequencias });
        await store._syncUpdate('crmSequencias', id, { ativo: seq.ativo }).catch(() => {});
        this.abrirConfigSequencias();
    },

    async _deleteSequencia(id) {
        if (!confirm('Excluir esta sequência?')) return;
        const sequencias = this._getSequencias().filter(s => s.id !== id);
        store.setState({ crmSequencias: sequencias });
        await store._syncDelete('crmSequencias', id).catch(() => {});
        this.abrirConfigSequencias();
    },

    showToast(msg, type, duration, action) {
        if (typeof app !== 'undefined' && app.showToast) app.showToast(msg, type || 'info', duration, action);
    },

    _renderTarefaCard(tarefa, hoje) {
        const isLate = tarefa.data_vencimento && tarefa.data_vencimento.slice(0, 10) < hoje && tarefa.status !== 'concluida';
        const lead = this.getLeads().find(l => l.id === tarefa.lead_id);
        const isHoje = tarefa.data_vencimento && tarefa.data_vencimento.slice(0, 10) === hoje;
        return `
            <div class="crm-tarefa-card ${isLate ? 'crm-tarefa-late' : ''} ${isHoje && tarefa.status !== 'concluida' ? 'crm-tarefa-hoje' : ''}">
                <div class="crm-tarefa-card-header">
                    <strong>${this._esc(tarefa.titulo)}</strong>
                    <div style="display:flex;gap:4px">
                        ${tarefa.status !== 'concluida' ? `
                            <button class="btn btn-sm btn-success" onclick="window.crm._concluirTarefa('${tarefa.id}')" title="Concluir"><i class="ph ph-check"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="window.crm._excluirTarefa('${tarefa.id}')" title="Excluir"><i class="ph ph-trash"></i></button>
                        ` : ''}
                    </div>
                </div>
                <div class="crm-tarefa-card-body">
                    ${tarefa.descricao ? `<p>${this._esc(tarefa.descricao)}</p>` : ''}
                    <div class="crm-tarefa-card-meta">
                        ${lead ? `<span><i class="ph ph-user"></i> ${this._esc(lead.nome)}</span>` : ''}
                        ${tarefa.data_vencimento ? `<span><i class="ph ph-calendar"></i> ${new Date(tarefa.data_vencimento).toLocaleDateString()}${isLate ? ' <span style="color:var(--color-danger)">(Atrasada)</span>' : ''}${isHoje ? ' <span style="color:var(--color-warning)">(Hoje)</span>' : ''}</span>` : ''}
                        <span class="crm-tarefa-tipo ${tarefa.tipo}">${tarefa.tipo}</span>
                    </div>
                </div>
            </div>
        `;
    },

    async _concluirTarefa(id) {
        await store.updateCrmTarefa(id, { status: 'concluida', data_conclusao: new Date().toISOString() });
        this._renderTarefas();
    },

    async _excluirTarefa(id) {
        if (!confirm('Excluir tarefa?')) return;
        await store.deleteCrmTarefa(id);
        this._renderTarefas();
    },

    _renderRelatorios() {
        const content = document.getElementById('crm-content');
        if (!content) return;
        const leads = this.getLeads();
        const total = leads.length;
        const porStatus = this.getLeadsPorStatus();
        const vendedores = this.getVendedores();
        const porVendedor = {};
        leads.forEach(l => {
            const vid = l.vendedor_id || 'sem_vendedor';
            if (!porVendedor[vid]) porVendedor[vid] = { total: 0, qualificados: 0, propostas: 0, valorTotal: 0, meta: 0, leads: [] };
            porVendedor[vid].total++;
            porVendedor[vid].leads.push(l);
            porVendedor[vid].valorTotal += parseFloat(l.estimativa_valor) || 0;
            const vendedor = vendedores.find(v => v.id === vid);
            if (vendedor) porVendedor[vid].meta = parseFloat(vendedor.meta_mensal) || 0;
            const st = this._getStage(l.status);
            if (st && st.tracks_conversao) porVendedor[vid].propostas++;
            if (st && !st.is_default && !st.is_terminal && !st.is_loss && !st.tracks_conversao) porVendedor[vid].qualificados++;
        });
        const totalConvertidos = leads.filter(l => { const st = this._getStage(l.status); return st && st.tracks_conversao; }).length;
        const totalPerdidos = leads.filter(l => { const st = this._getStage(l.status); return st && st.is_loss; }).length;
        const taxaConversao = total > 0 ? (totalConvertidos / total * 100).toFixed(1) : '0.0';

        const vendedorRows = Object.entries(porVendedor).map(([vid, data]) => {
            const meta = data.meta || 0;
            const atingido = meta > 0 ? Math.min(data.valorTotal / meta * 100, 100) : 0;
            return `
            <tr>
                <td>${this.getVendedorNome(vid)}</td>
                <td>${data.total}</td>
                <td>${data.qualificados}</td>
                <td>${data.propostas}</td>
                <td>${data.total > 0 ? (data.propostas / data.total * 100).toFixed(1) + '%' : '0%'}</td>
                <td>${meta > 0 ? 'R$ ' + meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'}</td>
                <td>${meta > 0 ? `<div style="display:flex;align-items:center;gap:6px"><div class="crm-bar-bg" style="flex:1;max-width:80px"><div class="crm-bar-fill" style="width:${atingido}%;background:${atingido >= 100 ? '#16a34a' : atingido >= 50 ? '#f59e0b' : '#ef4444'}"></div></div><span style="font-size:11px;font-weight:600">${atingido.toFixed(0)}%</span></div>` : '—'}</td>
            </tr>
        `}).join('');

        content.innerHTML = `
            <div class="crm-dashboard" style="max-width:900px">
                <div class="crm-panel">
                    <div class="crm-panel-header"><i class="ph ph-presentation-chart"></i> Relatórios CRM
                        <button class="btn btn-sm" onclick="window.crm._printRelatorios()" style="margin-left:auto"><i class="ph ph-printer"></i> Imprimir</button>
                    </div>
                    <div class="crm-panel-body">
                        <div class="crm-summary-cards" style="margin-bottom:16px">
                            <div class="crm-summary-card"><div class="crm-summary-value">${total}</div><div class="crm-summary-label">Total Leads</div></div>
                            <div class="crm-summary-card"><div class="crm-summary-value">${totalConvertidos}</div><div class="crm-summary-label">Convertidos</div></div>
                            <div class="crm-summary-card"><div class="crm-summary-value">${totalPerdidos}</div><div class="crm-summary-label">Perdidos</div></div>
                            <div class="crm-summary-card"><div class="crm-summary-value">${taxaConversao}%</div><div class="crm-summary-label">Taxa Conversão</div></div>
                        </div>
                        <h3 style="font-size:14px;margin:0 0 8px">Desempenho por Vendedor</h3>
                        <table class="crm-table">
                            <thead><tr><th>Vendedor</th><th>Total Leads</th><th>Qualificados</th><th>Propostas</th><th>Conversão</th><th>Meta (R$)</th><th>% Atingido</th></tr></thead>
                            <tbody>${vendedorRows || '<tr><td colspan="7" class="crm-text-muted">Nenhum dado</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
                <div class="crm-panel" style="margin-top:12px">
                    <div class="crm-panel-header"><i class="ph ph-funnel"></i> Funil Detalhado</div>
                    <div class="crm-panel-body">
                        ${this._getStages().map(s => {
                            const qtde = porStatus[s.id]?.length || 0;
                            const pct = total > 0 ? (qtde / total * 100) : 0;
                            return `
                                <div style="margin-bottom:8px">
                                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
                                        <span>${s.label}</span>
                                        <span>${qtde} (${pct.toFixed(1)}%)</span>
                                    </div>
                                    <div class="crm-bar-bg"><div class="crm-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    _getExportLeads() {
        return this._filterLeads(this.getLeads()).map(l => {
            const st = this._getStage(l.status);
            const prob = st ? (st.probability ?? 0) : 0;
            return {
            Nome: l.nome || '',
            Empresa: l.empresa || '',
            Status: this.getStatusLabel(l.status),
            Score: l.score ?? 0,
            Probabilidade: prob + '%',
            'Forecast': (parseFloat(l.estimativa_valor) || 0) * prob / 100,
            Vendedor: this.getVendedorNome(l.vendedor_id),
            'Valor Estimado': l.estimativa_valor || 0,
            Celular: l.celular || '',
            Email: l.email || '',
            Cidade: l.cidade || '',
            Estado: l.estado || '',
            Segmento: l.segmento || '',
            Origem: l.origem || '',
            'Data Criação': l.created_at ? l.created_at.slice(0, 10) : '',
            'Data Último Contato': l.data_ultimo_contato ? l.data_ultimo_contato.slice(0, 10) : '',
            'Data Qualificação': l.data_qualificacao ? l.data_qualificacao.slice(0, 10) : '',
            Observações: l.observacoes || ''
        };
        });
    },

    _exportCSV() {
        console.log('[CRM] Export CSV');
        try {
            const data = this._getExportLeads();
            if (data.length === 0) { alert('Nenhum lead para exportar.'); return; }
            const keys = Object.keys(data[0]);
            const csvRows = [keys.join(';')];
            for (const row of data) {
                csvRows.push(keys.map(k => {
                    let v = String(row[k] ?? '');
                    if (v.includes(';') || v.includes('"') || v.includes('\n')) v = `"${v.replace(/"/g, '""')}"`;
                    return v;
                }).join(';'));
            }
            const csv = '\ufeff' + csvRows.join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crm_leads_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            console.error('[CRM] CSV export error:', e);
            alert('Erro ao exportar CSV: ' + e.message);
        }
    },

    _exportXLSX() {
        console.log('[CRM] Export XLSX');
        try {
            const data = this._getExportLeads();
            if (data.length === 0) { alert('Nenhum lead para exportar.'); return; }
            if (typeof XLSX === 'undefined') { alert('Biblioteca XLSX não disponível.'); return; }
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Leads');
            ws['!cols'] = Object.keys(data[0]).map(() => ({ wch: 20 }));
            XLSX.writeFile(wb, `crm_leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (e) {
            console.error('[CRM] XLSX export error:', e);
            alert('Erro ao exportar XLSX: ' + e.message);
        }
    },

    _printRelatorios() {
        const leads = this._filterLeads(this.getLeads());
        const total = leads.length;
        const porStatus = {};
        this._getStages().forEach(s => { porStatus[s.id] = []; });
        leads.forEach(l => { if (porStatus[l.status]) porStatus[l.status].push(l); });
        const porVendedor = {};
        leads.forEach(l => {
            const vid = l.vendedor_id || 'sem_vendedor';
            if (!porVendedor[vid]) porVendedor[vid] = { total: 0, qualificados: 0, propostas: 0 };
            porVendedor[vid].total++;
            const st2 = this._getStage(l.status);
            if (st2 && st2.tracks_conversao) porVendedor[vid].propostas++;
            if (st2 && !st2.is_default && !st2.is_terminal && !st2.is_loss && !st2.tracks_conversao) porVendedor[vid].qualificados++;
        });
        const totalConvertidosPrint = leads.filter(l => { const st = this._getStage(l.status); return st && st.tracks_conversao; }).length;
        const totalPerdidosPrint = leads.filter(l => { const st = this._getStage(l.status); return st && st.is_loss; }).length;
        const taxaConversao = total > 0 ? (totalConvertidosPrint / total * 100).toFixed(1) : '0,0';
        const vendedorRows = Object.entries(porVendedor).map(([vid, d]) =>
            `<tr><td>${this.getVendedorNome(vid)}</td><td>${d.total}</td><td>${d.qualificados}</td><td>${d.propostas}</td><td>${d.total > 0 ? (d.propostas / d.total * 100).toFixed(1) + '%' : '0%'}</td></tr>`
        ).join('');

        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><meta charset="UTF-8"><title>Relatório CRM</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
                h2 { color:var(--color-accent); font-size: 18px; margin: 0 0 4px; }
                .subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
                .kpi-grid { display: flex; gap: 12px; margin-bottom: 20px; }
                .kpi-box { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; text-align: center; }
                .kpi-label { font-size: 9px; text-transform: uppercase; color: #666; }
                .kpi-value { font-size: 18px; font-weight: bold; margin-top: 2px; color:var(--color-accent); }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                th, td { padding: 5px 6px; border: 1px solid #ccc; text-align: left; font-size: 10px; }
                th { background:var(--color-accent); color: #fff; font-size: 9px; text-transform: uppercase; }
                .section-title { font-size: 13px; font-weight: bold; margin: 16px 0 4px; color: #333; }
                .bar-bg { height: 8px; background: #e2e8f0; border-radius: 4px; margin: 4px 0 8px; overflow: hidden; }
                .bar-fill { height: 100%; border-radius: 4px; }
                .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666; text-align: center; }
                @media print { body { padding: 0; } }
            </style></head><body>
                <h2>Relatório CRM</h2>
                <div class="subtitle">Exportado em ${new Date().toLocaleString()} · ${total} lead(s)</div>
                <div class="kpi-grid">
                    <div class="kpi-box"><div class="kpi-label">Total Leads</div><div class="kpi-value">${total}</div></div>
                    <div class="kpi-box"><div class="kpi-label">Convertidos</div><div class="kpi-value">${totalConvertidosPrint}</div></div>
                    <div class="kpi-box"><div class="kpi-label">Perdidos</div><div class="kpi-value">${totalPerdidosPrint}</div></div>
                    <div class="kpi-box"><div class="kpi-label">Taxa Conversão</div><div class="kpi-value">${taxaConversao}%</div></div>
                </div>
                <div class="section-title">Desempenho por Vendedor</div>
                <table><thead><tr><th>Vendedor</th><th>Total</th><th>Qualificados</th><th>Propostas</th><th>Conversão</th></tr></thead>
                <tbody>${vendedorRows || '<tr><td colspan="5">Nenhum dado</td></tr>'}</tbody></table>
                <div class="section-title">Funil Detalhado</div>
                ${this._getStages().map(s => {
                    const qtde = porStatus[s.id]?.length || 0;
                    const pct = total > 0 ? (qtde / total * 100) : 0;
                    return `<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;font-size:11px">${s.label}<span>${qtde} (${pct.toFixed(1)}%)</span></div><div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${s.color}"></div></div></div>`;
                }).join('')}
                <div class="footer">Relatório gerado pelo GeraPro CRM</div>
                <script>window.print();window.close();<\/script>
            </body></html>
        `);
        win.document.close();
    },

    abrirModalNovoLead() {
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal crm-modal-lg">
                <div class="crm-modal-header">
                    <h3>Novo Lead</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <form id="crm-lead-form" onsubmit="event.preventDefault();window.crm._salvarNovoLead()">
                        <div class="crm-form-grid">
                            <div class="crm-field">
                                <label>Nome *</label>
                                <input type="text" id="f-nome" required>
                            </div>
                            <div class="crm-field">
                                <label>Empresa</label>
                                <input type="text" id="f-empresa">
                            </div>
                            <div class="crm-field">
                                <label>Cargo</label>
                                <input type="text" id="f-cargo">
                            </div>
                            <div class="crm-field">
                                <label>Segmento</label>
                                <input type="text" id="f-segmento">
                            </div>
                            <div class="crm-field">
                                <label>Email</label>
                                <input type="email" id="f-email">
                            </div>
                            <div class="crm-field">
                                <label>Telefone</label>
                                <input type="text" id="f-telefone">
                            </div>
                            <div class="crm-field">
                                <label>Celular</label>
                                <input type="text" id="f-celular">
                            </div>
                            <div class="crm-field">
                                <label>WhatsApp</label>
                                <input type="text" id="f-whatsapp">
                            </div>
                            <div class="crm-field">
                                <label>Cidade</label>
                                <input type="text" id="f-cidade">
                            </div>
                            <div class="crm-field">
                                <label>Estado</label>
                                <input type="text" id="f-estado">
                            </div>
                            <div class="crm-field">
                                <label>CNPJ</label>
                                <input type="text" id="f-cnpj">
                            </div>
                            <div class="crm-field">
                                <label>Vendedor</label>
                                <select id="f-vendedor">
                                    <option value="">Selecione...</option>
                                    ${this.getVendedores().map(v => `<option value="${v.id}">${v.nome || v.razao_social}</option>`).join('')}
                                </select>
                            </div>
                            <div class="crm-field">
                                <label>Origem</label>
                                <select id="f-origem">
                                    <option value="manual">Manual</option>
                                    <option value="indicacao">Indicação</option>
                                    <option value="site">Site</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="google_ads">Google Ads</option>
                                    <option value="email_marketing">Email Marketing</option>
                                    <option value="feira">Feira / Evento</option>
                                    <option value="parceiro">Parceiro</option>
                                    <option value="ligacao">Ligação Ativa</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div class="crm-field">
                                <label>Interesse</label>
                                <input type="text" id="f-interesse" placeholder="Ex: Painéis de distribuição">
                            </div>
                            <div class="crm-field">
                                <label>Valor Estimado (R$)</label>
                                <input type="number" id="f-estimativa" step="0.01" min="0">
                            </div>
                            <div class="crm-field">
                                <label>Orçamento Informado (R$)</label>
                                <input type="number" id="f-orcamento" step="0.01" min="0">
                            </div>
                            <div class="crm-field">
                                <label>Prazo de Interesse</label>
                                <input type="date" id="f-prazo">
                            </div>
                            <div class="crm-field" style="grid-column:span 2">
                                <label>Observações</label>
                                <textarea id="f-observacoes" rows="3"></textarea>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
                            <button type="button" class="btn" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Lead</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async _salvarNovoLead() {
        const nome = document.getElementById('f-nome')?.value;
        if (!nome) { alert('Nome é obrigatório'); return; }
        const defaultSt = this._getStages().find(s => s.is_default);
        const lead = {
            nome,
            empresa: document.getElementById('f-empresa')?.value || '',
            cargo: document.getElementById('f-cargo')?.value || '',
            segmento: document.getElementById('f-segmento')?.value || '',
            email: document.getElementById('f-email')?.value || '',
            telefone: document.getElementById('f-telefone')?.value || '',
            celular: document.getElementById('f-celular')?.value || '',
            whatsapp: document.getElementById('f-whatsapp')?.value || '',
            cidade: document.getElementById('f-cidade')?.value || '',
            estado: document.getElementById('f-estado')?.value || '',
            cnpj: document.getElementById('f-cnpj')?.value || '',
            vendedor_id: document.getElementById('f-vendedor')?.value || null,
            origem: document.getElementById('f-origem')?.value || 'manual',
            interesse: document.getElementById('f-interesse')?.value || '',
            estimativa_valor: parseFloat(document.getElementById('f-estimativa')?.value) || 0,
            orcamento_informado: parseFloat(document.getElementById('f-orcamento')?.value) || 0,
            prazo_interesse: document.getElementById('f-prazo')?.value || '',
            observacoes: document.getElementById('f-observacoes')?.value || '',
            status: defaultSt ? defaultSt.id : 'novo',
            score: 0,
            tags: []
        };
        const novo = await store.addCrmLead(lead);
        if (novo) {
            await this.recalcularScore(novo.id);
            document.querySelector('.crm-modal-overlay')?.remove();
            this.updateBadge();
            this._renderView();
        }
    },

    abrirModalLead(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) return;
        this._selectedLeadId = leadId;
        const interacoes = this.getInteracoes(leadId);
        const tarefas = this.getTarefas(leadId);
        const pipelineItems = (store.getState().pipelineItems || []).filter(p => p.origem === 'crm' && p.origemId === leadId);

        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal crm-modal-lead">
                <div class="crm-modal-header">
                    <div>
                        <h3>${this._esc(lead.nome)}</h3>
                        ${lead.empresa ? `<span class="crm-text-muted">${this._esc(lead.empresa)}</span>` : ''}
                    </div>
                    <div style="display:flex;gap:8px;align-items:center">
                        <span class="crm-status-badge" style="background:${this.getStatusColor(lead.status)}">${this.getStatusLabel(lead.status)}</span>
                        ${lead.score >= 0 ? `<span class="crm-score ${this.getScoreClass(lead.score)}">${lead.score}</span>` : ''}
                        <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                    </div>
                </div>
                <div class="crm-modal-tabs">
                    <button class="crm-modal-tab active" data-tab="dados" onclick="window.crm._switchModalTab(this, 'dados')"><i class="ph ph-user"></i> Dados</button>
                    <button class="crm-modal-tab" data-tab="interacoes" onclick="window.crm._switchModalTab(this, 'interacoes')"><i class="ph ph-chats"></i> Interações (${interacoes.length})</button>
                    <button class="crm-modal-tab" data-tab="tarefas" onclick="window.crm._switchModalTab(this, 'tarefas')"><i class="ph ph-check-square"></i> Tarefas (${tarefas.length})</button>
                    <button class="crm-modal-tab" data-tab="propostas" onclick="window.crm._switchModalTab(this, 'propostas')"><i class="ph ph-file"></i> Propostas (${pipelineItems.length})</button>
                    <button class="crm-modal-tab" data-tab="notas" onclick="window.crm._switchModalTab(this, 'notas')"><i class="ph ph-note-pencil"></i> Notas (${this.getNotas(lead.id).length})</button>
                    <button class="crm-modal-tab" data-tab="score" onclick="window.crm._switchModalTab(this, 'score')"><i class="ph ph-star"></i> Score</button>
                    <button class="crm-modal-tab" data-tab="acoes" onclick="window.crm._switchModalTab(this, 'acoes')"><i class="ph ph-lightning"></i> Ações</button>
                    <button class="crm-modal-tab" data-tab="email" onclick="window.crm._switchModalTab(this, 'email')"><i class="ph ph-envelope"></i> E-mail</button>
                </div>
                <div class="crm-modal-body" id="crm-lead-modal-body">
                    ${this._renderModalTabDados(lead)}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _switchModalTab(el, tabName) {
        const tabs = el.closest('.crm-modal-tabs')?.querySelectorAll('.crm-modal-tab');
        tabs?.forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        const lead = this.getLeads().find(l => l.id === this._selectedLeadId);
        if (!lead) return;
        const body = document.getElementById('crm-lead-modal-body');
        if (!body) return;
        if (tabName === 'dados') body.innerHTML = this._renderModalTabDados(lead);
        else if (tabName === 'interacoes') body.innerHTML = this._renderModalTabInteracoes(lead);
        else if (tabName === 'tarefas') body.innerHTML = this._renderModalTabTarefas(lead);
        else if (tabName === 'propostas') body.innerHTML = this._renderModalTabPropostas(lead);
        else if (tabName === 'notas') body.innerHTML = this._renderModalTabNotas(lead);
        else if (tabName === 'score') body.innerHTML = this._renderModalTabScore(lead);
        else if (tabName === 'acoes') body.innerHTML = this._renderModalTabAcoes(lead);
        else if (tabName === 'email') {
            body.innerHTML = this._renderModalTabEmail(lead);
            this._loadEmailLog(lead.id);
        }
    },

    _renderModalTabDados(lead) {
        const leadStage = this._getStage(lead.status);
        const podeAvancar = leadStage ? !leadStage.is_terminal : true;
        return `
            <div class="crm-modal-tab-content">
                <div class="crm-form-grid">
                    <div class="crm-field">
                        <label>Nome</label>
                        <input type="text" value="${this._esc(lead.nome)}" onchange="window.crm._updateLeadField('${lead.id}','nome',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Empresa</label>
                        <input type="text" value="${this._esc(lead.empresa || '')}" onchange="window.crm._updateLeadField('${lead.id}','empresa',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Cargo</label>
                        <input type="text" value="${this._esc(lead.cargo || '')}" onchange="window.crm._updateLeadField('${lead.id}','cargo',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Segmento</label>
                        <input type="text" value="${this._esc(lead.segmento || '')}" onchange="window.crm._updateLeadField('${lead.id}','segmento',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Email</label>
                        <input type="email" value="${this._esc(lead.email || '')}" onchange="window.crm._updateLeadField('${lead.id}','email',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Telefone</label>
                        <input type="text" value="${this._esc(lead.telefone || '')}" onchange="window.crm._updateLeadField('${lead.id}','telefone',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Celular</label>
                        <input type="text" value="${this._esc(lead.celular || '')}" onchange="window.crm._updateLeadField('${lead.id}','celular',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>WhatsApp</label>
                        <input type="text" value="${this._esc(lead.whatsapp || '')}" onchange="window.crm._updateLeadField('${lead.id}','whatsapp',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Cidade</label>
                        <input type="text" value="${this._esc(lead.cidade || '')}" onchange="window.crm._updateLeadField('${lead.id}','cidade',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Estado</label>
                        <input type="text" value="${this._esc(lead.estado || '')}" onchange="window.crm._updateLeadField('${lead.id}','estado',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>CNPJ</label>
                        <input type="text" value="${this._esc(lead.cnpj || '')}" onchange="window.crm._updateLeadField('${lead.id}','cnpj',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Vendedor</label>
                        <select onchange="window.crm._updateLeadField('${lead.id}','vendedor_id',this.value)">
                            <option value="">Selecione...</option>
                            ${this.getVendedores().map(v => `<option value="${v.id}" ${lead.vendedor_id === v.id ? 'selected' : ''}>${v.nome || v.razao_social}</option>`).join('')}
                        </select>
                    </div>
                    <div class="crm-field">
                        <label>Origem</label>
                        <select onchange="window.crm._updateLeadField('${lead.id}','origem',this.value)">
                            ${['manual','indicacao','site','whatsapp','instagram','facebook','linkedin','google_ads','email_marketing','feira','parceiro','ligacao','outro'].map(o =>
                                `<option value="${o}" ${lead.origem === o ? 'selected' : ''}>${o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' ')}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="crm-field">
                        <label>Interesse</label>
                        <input type="text" value="${this._esc(lead.interesse || '')}" onchange="window.crm._updateLeadField('${lead.id}','interesse',this.value)">
                    </div>
                    <div class="crm-field">
                        <label>Valor Estimado (R$)</label>
                        <input type="number" value="${lead.estimativa_valor || 0}" onchange="window.crm._updateLeadField('${lead.id}','estimativa_valor',parseFloat(this.value)||0)">
                    </div>
                    <div class="crm-field">
                        <label>Status</label>
                        <select onchange="window.crm._mudarStatus('${lead.id}', this.value)">
                            ${this._getStages().map(s => `<option value="${s.id}" ${lead.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="crm-field" style="grid-column:span 2">
                        <label>Observações</label>
                        <textarea rows="3" onchange="window.crm._updateLeadField('${lead.id}','observacoes',this.value)">${this._esc(lead.observacoes || '')}</textarea>
                    </div>
                </div>
                <div style="margin-top:12px;display:flex;gap:8px;justify-content:space-between">
                    <div>
                        <span class="crm-text-muted">Criado em: ${lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'} | Atualizado: ${lead.updated_at ? new Date(lead.updated_at).toLocaleString() : '—'}</span>
                    </div>
                    ${podeAvancar ? `<button class="btn btn-sm btn-outline" onclick="window.crm.abrirModalInteracao('${lead.id}')"><i class="ph ph-plus-circle"></i> Registrar Interação</button>` : ''}
                </div>
            </div>
        `;
    },

    _renderModalTabInteracoes(lead) {
        const interacoes = this.getInteracoes(lead.id);
        return `
            <div class="crm-modal-tab-content">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                    <span class="crm-text-muted">${interacoes.length} interação(ões)</span>
                    <button class="btn btn-sm" onclick="window.crm.abrirModalInteracao('${lead.id}')"><i class="ph ph-plus"></i> Nova Interação</button>
                </div>
                ${interacoes.length === 0 ? '<div class="crm-empty"><p>Nenhuma interação registrada</p></div>' :
                    interacoes.sort((a, b) => new Date(b.data_hora || 0) - new Date(a.data_hora || 0)).map(i => `
                        <div class="crm-interacao-card">
                            <div class="crm-interacao-header">
                                <span class="crm-interacao-tipo ${i.tipo}">${i.tipo}</span>
                                <span class="crm-text-muted">${i.data_hora ? new Date(i.data_hora).toLocaleString() : '—'}</span>
                                ${i.duracao_min ? `<span class="crm-text-muted">${i.duracao_min}min</span>` : ''}
                            </div>
                            <div class="crm-interacao-body">${this._esc(i.descricao)}</div>
                            ${i.resultado ? `<div class="crm-interacao-resultado"><strong>Resultado:</strong> ${this._esc(i.resultado)}</div>` : ''}
                            ${i.proximo_passo ? `<div class="crm-interacao-proximo"><strong>Próximo passo:</strong> ${this._esc(i.proximo_passo)}${i.proxima_data ? ` até ${new Date(i.proxima_data).toLocaleDateString()}` : ''}</div>` : ''}
                            ${(() => { try { const a = typeof i.anexos === 'string' ? JSON.parse(i.anexos) : (i.anexos || []); return a.length > 0 ? `<div class="crm-interacao-anexos">${a.map(an => `<a href="/api/crm/download-anexo/${encodeURIComponent(an.caminho)}" target="_blank" class="crm-anexo-link" title="${this._esc(an.nome)} (${an.tamanho || 0} KB)"><i class="ph ph-paperclip"></i> ${this._esc(an.nome)}</a>`).join('')}</div>` : ''; } catch(e) { return ''; } })()}
                            <div class="crm-interacao-footer">
                                ${i.realizado_por ? `<span>${this._esc(i.realizado_por)}</span>` : ''}
                                <button class="btn btn-sm btn-danger" onclick="window.crm._excluirInteracao('${i.id}','${lead.id}')"><i class="ph ph-trash"></i></button>
                            </div>
                        </div>
                    `).reverse().join('')}
            </div>
        `;
    },

    _renderModalTabTarefas(lead) {
        const tarefas = this.getTarefas(lead.id);
        const hoje = new Date().toISOString().slice(0, 10);
        return `
            <div class="crm-modal-tab-content">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                    <span class="crm-text-muted">${tarefas.length} tarefa(s)</span>
                    <button class="btn btn-sm" onclick="window.crm.abrirModalNovaTarefa('${lead.id}')"><i class="ph ph-plus"></i> Nova Tarefa</button>
                </div>
                ${tarefas.length === 0 ? '<div class="crm-empty"><p>Nenhuma tarefa</p></div>' :
                    tarefas.sort((a, b) => new Date(a.data_vencimento || 0) - new Date(b.data_vencimento || 0)).map(t => this._renderTarefaCard(t, hoje)).join('')}
            </div>
        `;
    },

    _renderModalTabNotas(lead) {
        const notas = this.getNotas(lead.id);
        return `
            <div class="crm-modal-tab-content">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                    <span class="crm-text-muted">${notas.length} nota(s)</span>
                </div>
                <div style="margin-bottom:12px">
                    <textarea id="crm-nota-conteudo" rows="2" class="form-control" placeholder="Escreva uma nota..." style="width:100%;resize:vertical" onkeydown="if(event.ctrlKey&&event.key==='Enter'){event.preventDefault();window.crm._addNota('${lead.id}')}"></textarea>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                        <span class="crm-text-muted" style="font-size:11px">Pressione Ctrl+Enter para salvar</span>
                        <button class="btn btn-sm btn-primary" onclick="window.crm._addNota('${lead.id}')"><i class="ph ph-plus"></i> Adicionar Nota</button>
                    </div>
                </div>
                <div id="crm-notas-lista">
                    ${notas.length === 0 ? '<div class="crm-empty"><p>Nenhuma nota</p></div>' :
                        notas.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map(n => {
                            const data = n.created_at ? new Date(n.created_at).toLocaleString() : '';
                            const autor = n.autor ? this._esc(n.autor) : '';
                            return `
                            <div class="crm-interacao-card">
                                <div class="crm-interacao-header">
                                    ${autor ? `<span style="font-weight:600;font-size:12px">${autor}</span>` : '<span class="crm-text-muted" style="font-size:12px">Anônimo</span>'}
                                    <span class="crm-text-muted">${data}</span>
                                </div>
                                <div class="crm-interacao-body" style="white-space:pre-wrap">${this._esc(n.conteudo)}</div>
                                <div class="crm-interacao-footer">
                                    <button class="btn btn-sm btn-danger" onclick="window.crm._excluirNota('${n.id}','${lead.id}')"><i class="ph ph-trash"></i></button>
                                </div>
                            </div>
                        `}).join('')}
                </div>
            </div>
        `;
    },

    _renderModalTabPropostas(lead) {
        const pipelineItems = (store.getState().pipelineItems || []).filter(p => p.origem === 'crm' && p.origemId === lead.id);
        const pipelineStatusLabel = (status) => {
            const labels = { proposta_enviada: 'Proposta Enviada', ganho: 'Ganho', perdido: 'Perdido', em_andamento: 'Em Andamento', revisao: 'Em Revisão' };
            return labels[status] || status;
        };
        const pipelineStatusColor = (status) => {
            const colors = { proposta_enviada: '#2563eb', ganho: '#16a34a', perdido: '#dc2626', em_andamento: '#f59e0b', revisao: '#8b5cf6' };
            return colors[status] || '#6b7280';
        };
        return `
            <div class="crm-modal-tab-content">
                <p class="crm-text-muted">Propostas geradas a partir deste lead (somente leitura)</p>
                ${pipelineItems.length === 0 ? '<div class="crm-empty"><p>Nenhuma proposta vinculada</p></div>' :
                    `<table class="crm-table">
                        <thead><tr><th>Título</th><th>Status</th><th>Valor</th><th>Data</th></tr></thead>
                        <tbody>
                            ${pipelineItems.map(p => `
                                <tr>
                                    <td>${this._esc(p.titulo || '—')}</td>
                                    <td><span class="crm-status-badge" style="background:${pipelineStatusColor(p.status)}">${pipelineStatusLabel(p.status)}</span></td>
                                    <td>${this.formatCurrency(p.valor)}</td>
                                    <td class="crm-text-muted">${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
                <div style="margin-top:12px;font-size:12px;color:var(--color-text-muted)">
                    <i class="ph ph-info"></i> Gerencie propostas no módulo Gestão de Propostas.
                </div>
            </div>
        `;
    },

    _renderModalTabScore(lead) {
        return `
            <div class="crm-modal-tab-content">
                <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">
                    <div class="crm-score-circle ${this.getScoreClass(lead.score)}">
                        <span>${lead.score ?? 0}</span>
                    </div>
                    <div>
                        <h4 style="margin:0">Score: ${lead.score ?? 0}/100</h4>
                        <p class="crm-text-muted">${lead.score >= 80 ? 'Lead quente — alto potencial' : lead.score >= 50 ? 'Lead morno — médio potencial' : 'Lead frio — baixo potencial'}</p>
                    </div>
                </div>
                <div style="margin-bottom:12px">
                    <label>Score Manual (sobrescreve automático)</label>
                    <div style="display:flex;gap:8px">
                        <input type="range" min="0" max="100" value="${lead.score ?? 0}" id="crm-score-range" oninput="document.getElementById('crm-score-value').textContent=this.value">
                        <span id="crm-score-value" style="font-weight:700;font-size:18px;min-width:30px">${lead.score ?? 0}</span>
                    </div>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-sm" onclick="window.crm._updateLeadField('${lead.id}','score',parseInt(document.getElementById('crm-score-range').value));window.crm.recalcularScore('${lead.id}').then(s=>{if(s!==undefined)document.getElementById('crm-score-value').textContent=s})">Recalcular Automático</button>
                    <button class="btn btn-sm btn-primary" onclick="window.crm._updateLeadField('${lead.id}','score',parseInt(document.getElementById('crm-score-range').value))">Salvar Manual</button>
                </div>
                <div style="margin-top:16px">
                    <h4 style="font-size:13px;margin:0 0 8px">Critérios de Pontuação</h4>
                    <ul class="crm-score-criterios">
                        <li>Valor estimado > R$ 50k: +25pts</li>
                        <li>Valor estimado > R$ 10k: +15pts</li>
                        <li>Valor estimado > R$ 5k: +10pts</li>
                        <li>Segmento preenchido: +5pts</li>
                        <li>Email preenchido: +5pts</li>
                        <li>Telefone/Celular preenchido: +5pts</li>
                        <li>CNPJ preenchido: +5pts</li>
                        <li>Prazo urgente (≤15 dias): +10pts</li>
                        <li>Prazo curto (≤30 dias): +5pts</li>
                        <li>Interações registradas: até +15pts</li>
                        <li>Status no funil: até +35pts</li>
                    </ul>
                </div>
            </div>
        `;
    },

    _renderModalTabAcoes(lead) {
        const leadStage = this._getStage(lead.status);
        const podeAvancar = leadStage ? !leadStage.is_terminal : true;
        const podeSolicitar = leadStage ? leadStage.allows_proposal : false;
        const isDead = leadStage ? (leadStage.is_terminal || leadStage.is_loss) : false;

        const stagesFiltered = this._getStages().filter(s => !s.is_default && s.id !== lead.status);
        return `
            <div class="crm-modal-tab-content">
                <div style="margin-bottom:16px">
                    <h4 style="font-size:13px;margin:0 0 8px">Avançar Status</h4>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        ${stagesFiltered.map(s => `
                            <button class="btn btn-sm" style="border-color:${s.color};color:${s.color}"
                                onclick="window.crm._mudarStatus('${lead.id}','${s.id}')"
                                ${isDead ? 'disabled' : ''}>
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div style="margin-bottom:16px">
                    <h4 style="font-size:13px;margin:0 0 8px">Registrar</h4>
                    <div style="display:flex;gap:8px">
                        <button class="btn btn-sm" onclick="window.crm.abrirModalInteracao('${lead.id}')" ${podeAvancar ? '' : 'disabled'}><i class="ph ph-chats"></i> Interação</button>
                        <button class="btn btn-sm" onclick="window.crm.abrirModalNovaTarefa('${lead.id}')" ${podeAvancar ? '' : 'disabled'}><i class="ph ph-check-square"></i> Tarefa</button>
                    </div>
                </div>
                ${podeSolicitar ? `
                    <div style="margin-bottom:16px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px">
                        <h4 style="font-size:13px;margin:0 0 8px;color:#16a34a"><i class="ph ph-file-arrow-up"></i> Solicitar Proposta</h4>
                        <p style="font-size:12px;margin:0 0 8px;color:#374151">Quando o lead estiver pronto, solicite a criação de uma proposta. O engenheiro responsável avaliará e criará na Gestão de Propostas.</p>
                        <button class="btn btn-primary" onclick="window.crm._solicitarProposta('${lead.id}')"><i class="ph ph-paper-plane-tilt"></i> Solicitar Proposta</button>
                    </div>
                ` : ''}
                ${!leadStage?.is_loss && !leadStage?.is_terminal ? `
                    <div style="margin-bottom:16px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:4px">
                        <h4 style="font-size:13px;margin:0 0 8px;color:#dc2626"><i class="ph ph-x-circle"></i> Desqualificar Lead</h4>
                        <p style="font-size:12px;margin:0 0 8px;color:#374151">Marque este lead como desqualificado informando o motivo.</p>
                        <button class="btn btn-sm btn-danger" onclick="window.crm.abrirModalDesqualificar('${lead.id}')">Desqualificar</button>
                    </div>
                ` : ''}
                <div style="padding:12px;background:#fefce8;border:1px solid #fef08a;border-radius:4px">
                    <h4 style="font-size:13px;margin:0 0 8px;color:#a16207"><i class="ph ph-trash"></i> Excluir Lead</h4>
                    <p style="font-size:12px;margin:0 0 8px;color:#374151">Remove permanentemente este lead e todas as interações vinculadas.</p>
                    <button class="btn btn-sm btn-danger" onclick="window.crm._excluirLead('${lead.id}')">Excluir Lead</button>
                </div>
            </div>
        `;
    },

    async _updateLeadField(leadId, field, value) {
        await store.updateCrmLead(leadId, { [field]: value, updated_at: new Date().toISOString() });
        this.updateBadge();
    },

    async _mudarStatus(leadId, newStatus) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) return;
        const newStage = this._getStage(newStatus);
        if (!newStage) return;
        if (newStage.is_loss) {
            this.abrirModalDesqualificar(leadId);
            return;
        }
        await store.updateCrmLead(leadId, { status: newStatus, updated_at: new Date().toISOString() });
        if (newStage.tracks_qualificacao && !lead.data_qualificacao) {
            await store.updateCrmLead(leadId, { data_qualificacao: new Date().toISOString() });
        }
        if (newStage.tracks_conversao) {
            await store.updateCrmLead(leadId, { data_conversao: new Date().toISOString() });
        }
        this._applySequencias(leadId).catch(() => {});
        this.updateBadge();
        const body = document.getElementById('crm-lead-modal-body');
        if (body) body.innerHTML = this._renderModalTabDados(lead);
        const headerStatus = document.querySelector('.crm-modal-header .crm-status-badge');
        if (headerStatus) {
            headerStatus.style.background = this.getStatusColor(newStatus);
            headerStatus.textContent = this.getStatusLabel(newStatus);
        }
        this._renderView();
    },

    async _solicitarProposta(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) return;
        if (!confirm(`Confirmar solicitação de proposta para ${lead.nome}?\n\nO lead será marcado como "Virou Proposta" e um item será criado na Gestão de Propostas para avaliação do engenheiro.`)) return;
        const state = store.getState();
        const items = [...(state.pipelineItems || [])];
        const newItem = {
            id: crypto.randomUUID(),
            empresa_id: 'default',
            cliente: `${lead.nome}${lead.empresa ? ` (${lead.empresa})` : ''}`,
            projeto: `CRM: ${lead.interesse || 'Lead do CRM'}`,
            origem: 'crm',
            origemId: lead.id,
            status: 'proposta_enviada',
            valor: parseFloat(lead.estimativa_valor) || 0,
            observacoes: `Lead originado do CRM.\nContato: ${lead.email || lead.celular || 'N/A'}\nInteresse: ${lead.interesse || 'N/A'}\nObservações: ${lead.observacoes || 'N/A'}`,
            vendedor: this.getVendedorNome(lead.vendedor_id),
            interacoes: '[]',
            ultimoContato: null,
            proximoFollowup: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        items.push(newItem);
        store.setState({ pipelineItems: items });
        store._syncCreate('pipelineItems', newItem);
        const convStage = this._getStages().find(s => s.tracks_conversao);
        const convStatus = convStage ? convStage.id : 'virou_proposta';
        await store.updateCrmLead(leadId, { status: convStatus, data_conversao: new Date().toISOString(), updated_at: new Date().toISOString() });
        this.updateBadge();
        document.querySelector('.crm-modal-overlay')?.remove();
        this._renderView();
        app.showToast('Proposta solicitada com sucesso! Disponível na Gestão de Propostas.', 'success');
    },

    abrirModalDesqualificar(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) return;
        const lossStage = this._getStages().find(s => s.is_loss);
        const lossReasons = lossStage?.loss_reasons || ['nao_qualificado','sem_orcamento','nao_decidiu','concorrente','sem_contato','nao_responde','outro'];
        const lossReasonsLabel = {
            nao_qualificado: 'Não qualificado',
            sem_orcamento: 'Sem orçamento',
            nao_decidiu: 'Não decidiu',
            concorrente: 'Escolheu concorrente',
            sem_contato: 'Sem contato',
            nao_responde: 'Não responde',
            outro: 'Outro'
        };
        const lossStatus = lossStage ? lossStage.id : 'desqualificado';
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal">
                <div class="crm-modal-header">
                    <h3>Desqualificar Lead</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <p>Motivo pelo qual <strong>${this._esc(lead.nome)}</strong> está sendo desqualificado:</p>
                    <select id="crm-motivo-perda" style="width:100%;margin-bottom:12px">
                        ${lossReasons.map(r => `<option value="${r}">${lossReasonsLabel[r] || r}</option>`).join('')}
                    </select>
                    <textarea id="crm-motivo-detalhe" rows="3" placeholder="Detalhes adicionais..." style="width:100%;margin-bottom:12px"></textarea>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button class="btn" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                        <button class="btn btn-danger" onclick="window.crm._confirmarDesqualificar('${leadId}')">Desqualificar</button>
                    </div>
                </div>
            </div>
        `;
        overlay.dataset.lossStatus = lossStatus;
        document.body.appendChild(overlay);
    },

    async _confirmarDesqualificar(leadId) {
        const motivo = document.getElementById('crm-motivo-perda')?.value || 'outro';
        const detalhe = document.getElementById('crm-motivo-detalhe')?.value || '';
        const overlay = document.getElementById('crm-motivo-perda')?.closest('.crm-modal-overlay');
        const lossStatus = overlay?.dataset?.lossStatus || 'desqualificado';
        await store.updateCrmLead(leadId, {
            status: lossStatus,
            motivo_desqualificacao: motivo + (detalhe ? `: ${detalhe}` : ''),
            updated_at: new Date().toISOString()
        });
        this.updateBadge();
        document.querySelector('.crm-modal-overlay')?.remove();
        this._renderView();
    },

    async _excluirLead(leadId) {
        if (!confirm('Tem certeza? Todas as interações e tarefas vinculadas também serão removidas.')) return;
        const interacoes = this.getInteracoes(leadId);
        const tarefas = this.getTarefas(leadId);
        for (const i of interacoes) await store.deleteCrmInteracao(i.id);
        for (const t of tarefas) await store.deleteCrmTarefa(t.id);
        await store.deleteCrmLead(leadId);
        this.updateBadge();
        document.querySelector('.crm-modal-overlay')?.remove();
        this._renderView();
    },

    // --- Email Tab ---

    _renderModalTabEmail(lead) {
        const templates = store.getState().crmEmailTemplates || [];
        const temSMTP = !!document.getElementById('conf-mail-host')?.value; // rough check if configured
        return `
            <div class="crm-modal-tab-content">
                <div style="margin-bottom:12px">
                    <label style="font-size:12px;font-weight:600;color:#374151">Template</label>
                    <select id="email-template-select" class="form-control" style="width:100%;font-size:13px" onchange="window.crm._onTemplateChange('${lead.id}')">
                        <option value="">[Sem template]</option>
                        ${templates.map(t => `<option value="${t.id}">${this._esc(t.nome)}${t.categoria ? ` (${t.categoria})` : ''}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-bottom:12px">
                    <label style="font-size:12px;font-weight:600;color:#374151">Para <span style="color:#dc2626">*</span></label>
                    <input type="text" id="email-para" class="form-control" style="width:100%;font-size:13px"
                        value="${this._esc(lead.email || '')}" placeholder="email@exemplo.com, email2@exemplo.com">
                </div>
                <div style="margin-bottom:12px">
                    <label style="font-size:12px;font-weight:600;color:#374151">Cc</label>
                    <input type="text" id="email-cc" class="form-control" style="width:100%;font-size:13px"
                        placeholder="cc@exemplo.com (opcional)">
                </div>
                <div style="margin-bottom:12px">
                    <label style="font-size:12px;font-weight:600;color:#374151">Assunto <span style="color:#dc2626">*</span></label>
                    <input type="text" id="email-assunto" class="form-control" style="width:100%;font-size:13px"
                        placeholder="Assunto do e-mail" oninput="window.crm._updateEmailPreview()">
                </div>
                <div style="margin-bottom:12px">
                    <label style="font-size:12px;font-weight:600;color:#374151">Corpo</label>
                    <textarea id="email-corpo" class="form-control" style="width:100%;min-height:180px;font-size:13px;font-family:monospace"
                        placeholder="Escreva o corpo do e-mail ou selecione um template..."
                        oninput="window.crm._updateEmailPreview()"></textarea>
                </div>
                <div style="margin-bottom:12px">
                    <label style="font-size:12px;font-weight:600;color:#374151">Anexos</label>
                    <input type="file" id="email-attachments" class="form-control" style="font-size:13px" multiple onchange="window.crm._updateAttachmentsList()">
                    <div id="email-attachments-list" style="font-size:12px;color:#6b7280;margin-top:4px"></div>
                </div>
                <div style="margin-bottom:12px;padding:8px 10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:12px;color:#166534">
                    <strong>Placeholders disponíveis:</strong>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{nome}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{empresa}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{cargo}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{email}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{telefone}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{celular}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{cidade}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{estado}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{vendedor}}</code>
                    <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{valor_estimado}}</code>
                </div>
                <div id="email-preview" style="display:none;margin-bottom:12px;padding:10px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;max-height:150px;overflow-y:auto"></div>
                <div style="display:flex;gap:8px;align-items:center">
                    <button class="btn btn-primary" onclick="window.crm._enviarEmail('${lead.id}')">
                        <i class="ph ph-paper-plane-tilt"></i> Enviar
                    </button>
                    <button class="btn btn-secondary" onclick="window.crm.abrirGerenciadorTemplates()">
                        <i class="ph ph-pencil"></i> Gerenciar Templates
                    </button>
                    <span id="email-status" style="font-size:12px;color:#6b7280"></span>
                </div>
                <div style="margin-top:24px;padding-top:16px;border-top:2px solid #e2e8f0">
                    <h4 style="margin:0 0 12px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-clock-counter-clockwise"></i> Histórico de E-mails
                    </h4>
                    <div id="crm-email-log-container" style="font-size:13px">
                        <div style="text-align:center;padding:16px;color:#94a3b8">
                            <i class="ph ph-spinner ph-spin" style="font-size:18px"></i>
                            <p style="font-size:12px;margin-top:6px">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    _updateAttachmentsList() {
        const fileInput = document.getElementById('email-attachments');
        const list = document.getElementById('email-attachments-list');
        if (!fileInput || !list) return;
        const files = fileInput.files;
        if (files.length === 0) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = Array.from(files).map(f => `<div style="padding:2px 0"><i class="ph ph-paperclip"></i> ${this._esc(f.name)} (${(f.size / 1024).toFixed(1)} KB)</div>`).join('');
    },

    _onTemplateChange(leadId) {
        const templateId = document.getElementById('email-template-select')?.value;
        if (!templateId) return;
        const templates = store.getState().crmEmailTemplates || [];
        const tpl = templates.find(t => t.id === templateId);
        if (!tpl) return;
        const as = document.getElementById('email-assunto');
        if (as) as.value = this._substituirPlaceholders(leadId, tpl.assunto || '');
        const cp = document.getElementById('email-corpo');
        if (cp) cp.value = this._substituirPlaceholders(leadId, tpl.corpo || '');
        this._updateEmailPreview();
    },

    _substituirPlaceholders(leadId, text) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead || !text) return text;
        const vendedorNome = this.getVendedorNome(lead.vendedor_id);
        const map = {
            '{{nome}}': lead.nome || '',
            '{{empresa}}': lead.empresa || '',
            '{{cargo}}': lead.cargo || '',
            '{{email}}': lead.email || '',
            '{{telefone}}': lead.telefone || '',
            '{{celular}}': lead.celular || '',
            '{{cidade}}': lead.cidade || '',
            '{{estado}}': lead.estado || '',
            '{{vendedor}}': vendedorNome || '',
            '{{valor_estimado}}': lead.estimativa_valor ? this.formatCurrency(lead.estimativa_valor) : '',
            '{{observacoes}}': lead.observacoes || '',
            '{{origem}}': lead.origem || '',
            '{{lead_id}}': lead.id || ''
        };
        let result = text;
        for (const [key, val] of Object.entries(map)) {
            result = result.split(key).join(val);
        }
        return result;
    },

    _updateEmailPreview() {
        const preview = document.getElementById('email-preview');
        const corpo = document.getElementById('email-corpo')?.value || '';
        if (corpo.trim()) {
            preview.style.display = 'block';
            preview.innerHTML = '<strong style="font-size:11px;color:#6b7280">Prévia:</strong><br>' + corpo.replace(/\n/g, '<br>');
        } else {
            preview.style.display = 'none';
        }
    },

    async _enviarEmail(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) { alert('Lead não encontrado'); return; }

        const toRaw = document.getElementById('email-para')?.value || '';
        const to = toRaw.split(',').map(s => s.trim()).filter(Boolean);
        if (to.length === 0) { alert('Informe ao menos um destinatário.'); return; }

        const ccRaw = document.getElementById('email-cc')?.value || '';
        const cc = ccRaw.split(',').map(s => s.trim()).filter(Boolean);

        const assunto = this._substituirPlaceholders(leadId, document.getElementById('email-assunto')?.value || '');
        if (!assunto) { alert('Informe o assunto.'); return; }

        let corpo = this._substituirPlaceholders(leadId, document.getElementById('email-corpo')?.value || '');
        corpo = corpo.replace(/\n/g, '<br>');

        const fileInput = document.getElementById('email-attachments');
        const files = fileInput?.files || [];
        const attachments = [];
        const readerPromises = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            readerPromises.push(new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    attachments.push({
                        filename: file.name,
                        content: base64,
                        encoding: 'base64',
                        contentType: file.type || 'application/octet-stream'
                    });
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }));
        }

        const statusEl = document.getElementById('email-status');
        if (statusEl) statusEl.textContent = 'Enviando...';
        const btn = document.querySelector('.crm-modal-body .btn-primary');
        if (btn) btn.disabled = true;

        try {
            await Promise.all(readerPromises);
            const token = store.getState().auth?.token;
            const res = await fetch(`http://${location.hostname}:8082/api/send-email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, cc, assunto, corpo, lead_id: leadId, attachments })
            });
            const data = await res.json();
            if (data.success) {
                alert('E-mail enviado com sucesso!');
                // Refresh email log
                this._loadEmailLog(leadId);
                // Clear form
                if (document.getElementById('email-corpo')) document.getElementById('email-corpo').value = '';
                if (document.getElementById('email-assunto')) document.getElementById('email-assunto').value = '';
                if (document.getElementById('email-cc')) document.getElementById('email-cc').value = '';
                if (document.getElementById('email-attachments')) document.getElementById('email-attachments').value = '';
                document.getElementById('email-attachments-list').innerHTML = '';
                document.getElementById('email-preview').style.display = 'none';
            } else {
                alert('Erro ao enviar: ' + (data.error || 'Falha desconhecida'));
            }
        } catch (err) {
            alert('Erro ao enviar: ' + err.message);
        } finally {
            if (statusEl) statusEl.textContent = '';
            if (btn) btn.disabled = false;
        }
    },

    async _loadEmailLog(leadId) {
        const container = document.getElementById('crm-email-log-container');
        if (!container) return;
        try {
            const token = store.getState().auth?.token;
            const res = await fetch(`http://${location.hostname}:8082/api/email-log?lead_id=${encodeURIComponent(leadId)}&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success || !data.data || data.data.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px"><i class="ph ph-envelope-open"></i><p style="margin-top:6px">Nenhum e-mail enviado para este lead.</p></div>';
                return;
            }
            container.innerHTML = data.data.map(log => {
                const statusColor = log.status === 'sent' ? '#16a34a' : '#dc2626';
                const statusIcon = log.status === 'sent' ? 'ph-check-circle' : 'ph-x-circle';
                const date = log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '';
                const preview = (log.body_preview || '').substring(0, 150);
                return `
                    <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:6px;background:#fff">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                            <div style="display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px">
                                <i class="ph ${statusIcon}" style="color:${statusColor};font-size:14px"></i>
                                ${this._esc(log.subject || '(sem assunto)')}
                            </div>
                            <span style="font-size:11px;color:#94a3b8">${date}</span>
                        </div>
                        <div style="font-size:12px;color:#64748b">
                            Para: ${this._esc(log.to_email || '')}
                            ${log.cc ? ` | Cc: ${this._esc(log.cc)}` : ''}
                            ${log.provider ? ` | <span style="font-size:10px;color:#94a3b8">via ${this._esc(log.provider)}</span>` : ''}
                        </div>
                        <div style="font-size:11px;margin-top:3px">
                            ${log.opened_at
                                ? `<span style="color:#16a34a"><i class="ph ph-eye"></i> Aberto em ${new Date(log.opened_at).toLocaleString('pt-BR')}${log.open_count > 1 ? ` (${log.open_count}x)` : ''}</span>`
                                : log.status === 'sent'
                                    ? `<span style="color:#94a3b8"><i class="ph ph-eye-slash"></i> Não aberto</span>`
                                    : ''}
                        </div>
                        ${preview ? `
                        <div style="margin-top:4px;font-size:11px;color:#94a3b8;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
                            <i class="ph ph-caret-down"></i> Ver prévia
                        </div>
                        <div style="display:none;margin-top:4px;padding:6px 8px;background:#f8fafc;border-radius:4px;font-size:11px;color:#475569;border:1px solid #e2e8f0;max-height:80px;overflow-y:auto">
                            ${this._esc(preview)}
                        </div>` : ''}
                        ${log.status === 'failed' && log.error_message ? `<div style="margin-top:4px;font-size:11px;color:#dc2626"><i class="ph ph-warning"></i> ${this._esc(log.error_message)}</div>` : ''}
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.warn('[CRM] Error loading email log:', err);
            container.innerHTML = '<div style="text-align:center;padding:16px;color:#dc2626;font-size:12px">Erro ao carregar histórico de e-mails.</div>';
        }
    },

    // --- Template Manager ---

    abrirGerenciadorTemplates() {
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal" style="max-width:700px">
                <div class="crm-modal-header">
                    <h3><i class="ph ph-envelope"></i> Gerenciar Templates de E-mail</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <div style="margin-bottom:16px;display:flex;gap:8px">
                        <button class="btn btn-primary btn-sm" onclick="window.crm.abrirModalTemplateNovo()">
                            <i class="ph ph-plus"></i> Novo Template
                        </button>
                    </div>
                    <div id="crm-template-list">
                        ${this._renderTemplateList()}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _renderTemplateList() {
        const templates = store.getState().crmEmailTemplates || [];
        if (templates.length === 0) {
            return '<p style="font-size:13px;color:#6b7280;padding:16px 0">Nenhum template cadastrado. Clique em "Novo Template" para criar.</p>';
        }
        return `
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
                        <th style="padding:8px 12px;text-align:left">Nome</th>
                        <th style="padding:8px 12px;text-align:left">Assunto</th>
                        <th style="padding:8px 12px;text-align:left">Categoria</th>
                        <th style="padding:8px 12px;text-align:center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${templates.map(t => `
                        <tr style="border-bottom:1px solid #e2e8f0">
                            <td style="padding:8px 12px;font-weight:600">${this._esc(t.nome)}</td>
                            <td style="padding:8px 12px;color:#6b7280">${this._esc(t.assunto)}</td>
                            <td style="padding:8px 12px"><span style="background:#e2e8f0;padding:2px 8px;border-radius:10px;font-size:11px">${this._esc(t.categoria || 'geral')}</span></td>
                            <td style="padding:8px 12px;text-align:center">
                                <button class="btn btn-sm btn-ghost" onclick="window.crm.abrirModalTemplateEditar('${t.id}')" title="Editar"><i class="ph ph-pencil"></i></button>
                                <button class="btn btn-sm btn-ghost" onclick="window.crm._excluirTemplate('${t.id}')" title="Excluir" style="color:#dc2626"><i class="ph ph-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    abrirModalTemplateNovo() {
        this._abrirModalTemplate(null);
    },

    abrirModalTemplateEditar(templateId) {
        const templates = store.getState().crmEmailTemplates || [];
        const tpl = templates.find(t => t.id === templateId);
        if (!tpl) return;
        this._abrirModalTemplate(tpl);
    },

    _abrirModalTemplate(template) {
        const isEdit = !!template;
        const t = template || { nome: '', assunto: '', corpo: '', categoria: 'geral' };
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal" style="max-width:600px">
                <div class="crm-modal-header">
                    <h3>${isEdit ? 'Editar' : 'Novo'} Template</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <div style="margin-bottom:12px">
                        <label style="font-size:12px;font-weight:600;color:#374151">Nome <span style="color:#dc2626">*</span></label>
                        <input type="text" id="tpl-nome" class="form-control" value="${this._esc(t.nome)}" placeholder="Ex: Follow-up Inicial">
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="font-size:12px;font-weight:600;color:#374151">Categoria</label>
                        <select id="tpl-categoria" class="form-control">
                            <option value="geral" ${t.categoria === 'geral' ? 'selected' : ''}>Geral</option>
                            <option value="followup" ${t.categoria === 'followup' ? 'selected' : ''}>Follow-up</option>
                            <option value="proposta" ${t.categoria === 'proposta' ? 'selected' : ''}>Proposta</option>
                            <option value="visita" ${t.categoria === 'visita' ? 'selected' : ''}>Visita</option>
                            <option value="agradecimento" ${t.categoria === 'agradecimento' ? 'selected' : ''}>Agradecimento</option>
                        </select>
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="font-size:12px;font-weight:600;color:#374151">Assunto <span style="color:#dc2626">*</span></label>
                        <input type="text" id="tpl-assunto" class="form-control" value="${this._esc(t.assunto)}" placeholder="Assunto do e-mail">
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="font-size:12px;font-weight:600;color:#374151">Corpo (HTML)</label>
                        <textarea id="tpl-corpo" class="form-control" style="width:100%;min-height:200px;font-size:13px;font-family:monospace"
                            placeholder="Corpo do e-mail com suporte a HTML e placeholders...">${this._esc(t.corpo)}</textarea>
                    </div>
                    <div style="margin-bottom:12px;padding:8px 10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:12px;color:#166534">
                        <strong>Placeholders disponíveis:</strong>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{nome}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{empresa}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{cargo}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{email}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{telefone}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{celular}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{cidade}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{estado}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{vendedor}}</code>
                        <code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px">{{valor_estimado}}</code>
                    </div>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button class="btn btn-secondary" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="window.crm._salvarTemplate(${isEdit ? `'${template.id}'` : 'null'})">
                            <i class="ph ph-floppy-disk"></i> ${isEdit ? 'Atualizar' : 'Criar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async _salvarTemplate(templateId) {
        const nome = document.getElementById('tpl-nome')?.value?.trim();
        if (!nome) { alert('Nome é obrigatório.'); return; }
        const assunto = document.getElementById('tpl-assunto')?.value?.trim();
        if (!assunto) { alert('Assunto é obrigatório.'); return; }
        const corpo = document.getElementById('tpl-corpo')?.value?.trim() || '';
        const categoria = document.getElementById('tpl-categoria')?.value || 'geral';

        const data = { nome, assunto, corpo, categoria };

        if (templateId) {
            await store.updateCrmEmailTemplate(templateId, data);
        } else {
            await store.addCrmEmailTemplate(data);
        }

        document.querySelector('.crm-modal-overlay')?.remove();
        this.abrirGerenciadorTemplates();
    },

    async _excluirTemplate(templateId) {
        if (!confirm('Excluir este template permanentemente?')) return;
        await store.deleteCrmEmailTemplate(templateId);
        // Re-render template list
        const listDiv = document.getElementById('crm-template-list');
        if (listDiv) listDiv.innerHTML = this._renderTemplateList();
    },

    abrirModalInteracao(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        if (!lead) return;
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal">
                <div class="crm-modal-header">
                    <h3>Registrar Interação — ${this._esc(lead.nome)}</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <form id="crm-interacao-form" onsubmit="event.preventDefault();window.crm._salvarInteracao('${leadId}')">
                        <div class="crm-form-grid" style="grid-template-columns:1fr 1fr">
                            <div class="crm-field">
                                <label>Tipo *</label>
                                <select id="i-tipo" required>
                                    <option value="ligacao">Ligação</option>
                                    <option value="email">Email</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="reuniao">Reunião</option>
                                    <option value="visita">Visita</option>
                                    <option value="proposta">Proposta</option>
                                    <option value="negociacao">Negociação</option>
                                    <option value="followup">Follow-up</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div class="crm-field">
                                <label>Duração (min)</label>
                                <input type="number" id="i-duracao" min="0" value="0">
                            </div>
                            <div class="crm-field">
                                <label>Contato</label>
                                <input type="text" id="i-contato" placeholder="Nome do contato">
                            </div>
                            <div class="crm-field">
                                <label>Cargo do Contato</label>
                                <input type="text" id="i-contato-cargo">
                            </div>
                        </div>
                        <div class="crm-field">
                            <label>Descrição *</label>
                            <textarea id="i-descricao" rows="3" required placeholder="Descreva o que foi discutido..."></textarea>
                        </div>
                        <div class="crm-field">
                            <label>Resultado</label>
                            <textarea id="i-resultado" rows="2" placeholder="Resultado da interação..."></textarea>
                        </div>
                        <div class="crm-field">
                            <label>Próximo Passo</label>
                            <input type="text" id="i-proximo" placeholder="Ex: Enviar orçamento">
                        </div>
                        <div class="crm-field">
                            <label>Data do Próximo Passo</label>
                            <input type="date" id="i-proxima-data">
                        </div>
                        <div class="crm-field" style="grid-column:span 2">
                            <label>Anexos</label>
                            <input type="file" id="i-anexos" multiple onchange="window.crm._previewAnexos(this)">
                            <div id="i-anexos-preview" style="font-size:11px;color:var(--color-text-muted);margin-top:4px"></div>
                        </div>
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
                            <button type="button" class="btn" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _previewAnexos(input) {
        const list = document.getElementById('i-anexos-preview');
        if (!list) return;
        const files = input.files;
        if (files.length === 0) { list.innerHTML = ''; return; }
        list.innerHTML = Array.from(files).map(f => `<div style="padding:2px 0"><i class="ph ph-paperclip"></i> ${this._esc(f.name)} (${(f.size / 1024).toFixed(1)} KB)</div>`).join('');
    },

    async _uploadAnexo(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64 = reader.result.split(',')[1];
                    const token = store.getState().auth?.token;
                    const res = await fetch(`http://${location.hostname}:8082/api/crm/upload-anexo`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nome_arquivo: file.name, fileData: base64, tipo_arquivo: file.type })
                    });
                    const data = await res.json();
                    if (data.success) resolve(data.item);
                    else reject(new Error(data.error || 'Falha no upload'));
                } catch (e) { reject(e); }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async _salvarInteracao(leadId) {
        const descricao = document.getElementById('i-descricao')?.value;
        if (!descricao) { alert('Descrição é obrigatória'); return; }

        const fileInput = document.getElementById('i-anexos');
        const files = fileInput?.files || [];
        const anexos = [];
        for (let i = 0; i < files.length; i++) {
            try {
                const meta = await this._uploadAnexo(files[i]);
                anexos.push(meta);
            } catch (e) {
                console.error('[CRM] Erro upload anexo:', e);
            }
        }

        const interacao = {
            lead_id: leadId,
            tipo: document.getElementById('i-tipo')?.value || 'ligacao',
            descricao,
            duracao_min: parseInt(document.getElementById('i-duracao')?.value) || 0,
            contato_nome: document.getElementById('i-contato')?.value || '',
            contato_cargo: document.getElementById('i-contato-cargo')?.value || '',
            resultado: document.getElementById('i-resultado')?.value || '',
            proximo_passo: document.getElementById('i-proximo')?.value || '',
            proxima_data: document.getElementById('i-proxima-data')?.value || '',
            realizado_por: store.getState().ui?.userName || 'Usuário',
            data_hora: new Date().toISOString(),
            anexos: JSON.stringify(anexos)
        };
        const created = await store.addCrmInteracao(interacao);
        if (created) {
            await store.updateCrmLead(leadId, {
                data_ultimo_contato: new Date().toISOString(),
                data_proximo_followup: interacao.proxima_data || null,
                updated_at: new Date().toISOString()
            });
            if (interacao.proximo_passo && interacao.proxima_data) {
                await store.addCrmTarefa({
                    lead_id: leadId,
                    titulo: interacao.proximo_passo,
                    descricao: `Follow-up: ${interacao.proximo_passo}`,
                    tipo: 'followup',
                    prioridade: 'media',
                    status: 'pendente',
                    responsavel: interacao.realizado_por,
                    data_vencimento: interacao.proxima_data,
                    lead_nome: this.getLeads().find(l => l.id === leadId)?.nome || ''
                });
            }
            await this.recalcularScore(leadId);
            document.querySelector('.crm-modal-overlay')?.remove();
            const body = document.getElementById('crm-lead-modal-body');
            const lead = this.getLeads().find(l => l.id === leadId);
            if (body && lead) body.innerHTML = this._renderModalTabInteracoes(lead);
        }
    },

    async _excluirInteracao(interacaoId, leadId) {
        if (!confirm('Excluir esta interação?')) return;
        await store.deleteCrmInteracao(interacaoId);
        const body = document.getElementById('crm-lead-modal-body');
        const lead = this.getLeads().find(l => l.id === leadId);
        if (body && lead) body.innerHTML = this._renderModalTabInteracoes(lead);
    },

    async _addNota(leadId) {
        const textarea = document.getElementById('crm-nota-conteudo');
        const conteudo = textarea?.value?.trim();
        if (!conteudo) { this.showToast('Escreva o conteúdo da nota.', 'warning'); return; }
        const userNome = store.getState().auth?.user?.nome || store.getState().auth?.user?.username || '—';
        const nota = {
            lead_id: leadId,
            conteudo,
            autor: userNome
        };
        await store.addCrmNota(nota);
        textarea.value = '';
        const body = document.getElementById('crm-lead-modal-body');
        const lead = this.getLeads().find(l => l.id === leadId);
        if (body && lead) body.innerHTML = this._renderModalTabNotas(lead);
    },

    async _excluirNota(notaId, leadId) {
        if (!confirm('Excluir esta nota?')) return;
        await store.deleteCrmNota(notaId);
        const body = document.getElementById('crm-lead-modal-body');
        const lead = this.getLeads().find(l => l.id === leadId);
        if (body && lead) body.innerHTML = this._renderModalTabNotas(lead);
    },

    abrirModalNovaTarefa(leadId) {
        const lead = this.getLeads().find(l => l.id === leadId);
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.innerHTML = `
            <div class="crm-modal">
                <div class="crm-modal-header">
                    <h3>Nova Tarefa${lead ? ` — ${this._esc(lead.nome)}` : ''}</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body">
                    <form id="crm-tarefa-form" onsubmit="event.preventDefault();window.crm._salvarTarefa('${leadId || ''}')">
                        <div class="crm-field">
                            <label>Título *</label>
                            <input type="text" id="t-titulo" required>
                        </div>
                        <div class="crm-field">
                            <label>Descrição</label>
                            <textarea id="t-descricao" rows="2"></textarea>
                        </div>
                        <div class="crm-form-grid" style="grid-template-columns:1fr 1fr 1fr">
                            <div class="crm-field">
                                <label>Tipo</label>
                                <select id="t-tipo">
                                    <option value="followup">Follow-up</option>
                                    <option value="ligacao">Ligação</option>
                                    <option value="email">Email</option>
                                    <option value="reuniao">Reunião</option>
                                    <option value="proposta">Proposta</option>
                                    <option value="cotacao">Cotação</option>
                                    <option value="visita">Visita</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div class="crm-field">
                                <label>Prioridade</label>
                                <select id="t-prioridade">
                                    <option value="baixa">Baixa</option>
                                    <option value="media" selected>Média</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                            <div class="crm-field">
                                <label>Vencimento</label>
                                <input type="date" id="t-vencimento">
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
                            <button type="button" class="btn" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async _salvarTarefa(leadId) {
        const titulo = document.getElementById('t-titulo')?.value;
        if (!titulo) { alert('Título é obrigatório'); return; }
        const tarefa = {
            lead_id: leadId || null,
            titulo,
            descricao: document.getElementById('t-descricao')?.value || '',
            tipo: document.getElementById('t-tipo')?.value || 'followup',
            prioridade: document.getElementById('t-prioridade')?.value || 'media',
            status: 'pendente',
            responsavel: store.getState().ui?.userName || 'Usuário',
            data_vencimento: document.getElementById('t-vencimento')?.value || '',
            lead_nome: leadId ? (this.getLeads().find(l => l.id === leadId)?.nome || '') : ''
        };
        const created = await store.addCrmTarefa(tarefa);
        if (created) {
            document.querySelector('.crm-modal-overlay')?.remove();
            if (this._currentView === 'tarefas') this._renderTarefas();
            else if (leadId) {
                const body = document.getElementById('crm-lead-modal-body');
                const lead = this.getLeads().find(l => l.id === leadId);
                if (body && lead) body.innerHTML = this._renderModalTabTarefas(lead);
            }
        }
    },

    updateBadge() {
        const overdue = this._checkOverdue();
        const total = overdue.total;
        const badge = document.getElementById('crm-badge');
        if (badge) {
            if (total > 0) { badge.style.display = 'inline'; badge.textContent = total > 99 ? '99+' : total; }
            else { badge.style.display = 'none'; }
        }
    },

    _checkOverdue() {
        const hoje = new Date().toISOString().slice(0, 10);
        const tarefas = this.getTarefas().filter(t =>
            t.status !== 'concluida' && t.data_vencimento && t.data_vencimento.slice(0, 10) <= hoje
        );
        const leads = this.getLeads().filter(l => {
            if (!l.data_proximo_followup) return false;
            const st = this._getStage(l.status);
            if (st && st.is_terminal) return false;
            return l.data_proximo_followup.slice(0, 10) <= hoje;
        });
        return {
            tasks: tarefas.length,
            followups: leads.length,
            total: tarefas.length + leads.length
        };
    },

    _notifyOverdue(showToast = true) {
        const overdue = this._checkOverdue();
        const total = overdue.total;
        const badge = document.getElementById('crm-badge');
        if (badge) {
            if (total > 0) { badge.style.display = 'inline'; badge.textContent = total > 99 ? '99+' : total; }
            else { badge.style.display = 'none'; }
        }
        if (total === 0) { this._lastOverdueTotal = 0; return; }
        const isNew = this._lastOverdueTotal === undefined || total > this._lastOverdueTotal;
        this._lastOverdueTotal = total;
        if (!isNew) return;
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
            const n = new Notification('GeraPro CRM — Atrasos Detectados', {
                body: `📋 ${overdue.tasks} tarefa(s) atrasada(s) · 📞 ${overdue.followups} follow-up(s) pendente(s)`,
                icon: '/favicon.ico'
            });
            n.onclick = () => { window.focus(); n.close(); if (window.crm) window.crm._setView('tarefas'); };
        }
        if (showToast && typeof app !== 'undefined' && app.showToast) {
            const parts = [];
            if (overdue.tasks > 0) parts.push(`📋 ${overdue.tasks} tarefa(s) atrasada(s)`);
            if (overdue.followups > 0) parts.push(`📞 ${overdue.followups} follow-up(s) pendente(s)`);
            app.showToast('🔔 ' + parts.join(' · '), 'warning', 8000, {
                label: 'Ver Tarefas',
                onClick: () => { if (window.crm) window.crm._setView('tarefas'); }
            });
        }
    },

    _startOverdueTimer() {
        this._stopOverdueTimer();
        this._overdueTimer = setInterval(() => {
            this._notifyOverdue(true);
        }, 60000);
    },

    _stopOverdueTimer() {
        if (this._overdueTimer) {
            clearInterval(this._overdueTimer);
            this._overdueTimer = null;
        }
    },

    formatCurrency(val) {
        const v = parseFloat(val) || 0;
        return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    _esc(str) {
        if (str == null) return '';
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    },

    // --- Import de Leads ---

    _baixarModeloCsv() {
        const headers = ['Nome','Empresa','Cargo','Segmento','Email','Telefone','Celular','Whatsapp','Cidade','Estado','CNPJ','Vendedor','Origem','Interesse','Valor Estimado','Orcamento Informado','Prazo Interesse','Observacoes','Tags'];
        const sample = ['João da Silva','ABC Ltda','Engenheiro','Industrial','joao@abc.com','1199998888','1198887777','1197776666','Sertãozinho','SP','00.000.000/0001-00','Carlos','Indicação','Painel CCM','50000','45000','30 dias','Lead da feira','grande-conta,urgente'];
        const bom = '\uFEFF';
        const csv = bom + headers.join(';') + '\n' + sample.join(';') + '\n';
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'modelo_importacao_leads.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    },

    abrirModalImportarLeads() {
        this._importData = null;
        this._importMapping = {};
        const overlay = document.createElement('div');
        overlay.className = 'crm-modal-overlay';
        overlay.id = 'crm-import-overlay';
        overlay.innerHTML = `
            <div class="crm-modal" style="max-width:800px">
                <div class="crm-modal-header">
                    <h3><i class="ph ph-upload-simple"></i> Importar Leads</h3>
                    <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="crm-modal-body" id="crm-import-body">
                    ${this._renderPassoUpload()}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _renderPassoUpload() {
        return `
            <div id="crm-import-passo" data-passo="1">
                <div style="margin-bottom:16px">
                    <h4 style="font-size:14px;margin:0 0 4px;color:#374151">Passo 1 de 2 — Selecionar Arquivo</h4>
                    <p style="font-size:12px;color:#6b7280;margin:0">Formatos aceitos: .csv (recomendado), .xlsx, .xls</p>
                </div>
                <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:8px;padding:40px;text-align:center;margin-bottom:16px">
                    <i class="ph ph-file-csv" style="font-size:40px;color:#94a3b8;margin-bottom:12px"></i>
                    <p style="font-size:14px;color:#374151;margin:0 0 4px">Arraste o arquivo aqui ou clique para selecionar</p>
                    <p style="font-size:11px;color:#94a3b8;margin:0 0 16px">.csv, .xlsx, .xls — Máx 10MB</p>
                    <label class="btn btn-secondary" style="background:#2563eb;color:#fff;border:none;cursor:pointer;padding:8px 20px">
                        <i class="ph ph-folder-open"></i> Escolher Arquivo
                        <input type="file" id="crm-import-file" accept=".csv,.xlsx,.xls" style="display:none" onchange="window.crm._onImportFileSelected(this)">
                    </label>
                </div>
                <div id="crm-import-preview" style="display:none">
                    <h5 style="font-size:13px;margin:0 0 8px;color:#374151">Pré-visualização (primeiras 5 linhas)</h5>
                    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:6px">
                        <table id="crm-import-table" style="width:100%;border-collapse:collapse;font-size:12px"></table>
                    </div>
                    <p id="crm-import-count" style="font-size:12px;color:#6b7280;margin-top:8px"></p>
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
                        <button class="btn btn-primary" onclick="window.crm._proximoPassoMapping()">
                            Próximo <i class="ph ph-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async _onImportFileSelected(input) {
        const file = input.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande. Máximo 10MB.'); return; }
        try {
            const data = await this._parseImportFile(file);
            if (!data || data.length === 0) { alert('Nenhum dado encontrado no arquivo.'); return; }
            this._importData = data;
            const preview = data.slice(0, 5);
            const headers = Object.keys(preview[0] || {});
            const table = document.getElementById('crm-import-table');
            if (table) {
                table.innerHTML = `
                    <thead><tr style="background:#f1f5f9">${headers.map(h => `<th style="padding:6px 10px;text-align:left;white-space:nowrap;font-weight:600;border-bottom:1px solid #e2e8f0">${this._esc(h)}</th>`).join('')}</tr></thead>
                    <tbody>${preview.map(row => `<tr>${headers.map(h => `<td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;white-space:nowrap">${this._esc(row[h] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
                `;
            }
            const count = document.getElementById('crm-import-count');
            if (count) count.textContent = `${data.length} registro(s) encontrados`;
            document.getElementById('crm-import-preview').style.display = 'block';
        } catch (err) {
            alert('Erro ao ler arquivo: ' + err.message);
        }
    },

    _parseImportFile(file) {
        return new Promise((resolve, reject) => {
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext === 'csv') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const text = e.target.result;
                        const lines = text.split(/\r?\n/).filter(l => l.trim());
                        if (lines.length < 2) { reject(new Error('Arquivo vazio ou sem dados')); return; }
                        const delim = lines[0].includes(';') ? ';' : ',';
                        const parseLine = (line) => {
                            const result = [];
                            let current = '', inQuotes = false;
                            for (let i = 0; i < line.length; i++) {
                                const c = line[i];
                                if (c === '"') { inQuotes = !inQuotes; continue; }
                                if (c === delim && !inQuotes) { result.push(current.trim()); current = ''; continue; }
                                current += c;
                            }
                            result.push(current.trim());
                            return result;
                        };
                        const headers = parseLine(lines[0]).map(h => h.replace(/["']/g, '').trim());
                        const rows = lines.slice(1).map(line => {
                            const vals = parseLine(line);
                            const obj = {};
                            headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
                            return obj;
                        }).filter(r => Object.values(r).some(v => v));
                        resolve(rows);
                    } catch (err) { reject(err); }
                };
                reader.onerror = reject;
                reader.readAsText(file);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                        resolve(json);
                    } catch (err) { reject(err); }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            }
        });
    },

    _proximoPassoMapping() {
        if (!this._importData || this._importData.length === 0) return;
        const body = document.getElementById('crm-import-body');
        if (!body) return;
        body.innerHTML = this._renderPassoMapping(this._importData);
    },

    _renderPassoMapping(data) {
        const headers = Object.keys(data[0] || {});
        const detected = this._autoDetectMapping(headers);
        this._importMapping = { ...detected };
        return `
            <div id="crm-import-passo" data-passo="2">
                <div style="margin-bottom:16px">
                    <h4 style="font-size:14px;margin:0 0 4px;color:#374151">Passo 2 de 2 — Mapeamento de Colunas</h4>
                    <p style="font-size:12px;color:#6b7280;margin:0">Associe as colunas do arquivo aos campos do CRM. <span style="color:#dc2626">*</span> = obrigatório</p>
                </div>
                <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:16px">
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead><tr style="background:#f1f5f9"><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0">Campo do CRM</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0">Coluna do Arquivo</th></tr></thead>
                        <tbody>
                            ${this._getCamposImportaveis().map(c => `
                                <tr style="border-bottom:1px solid #f1f5f9">
                                    <td style="padding:8px 12px;font-weight:${c.obrigatorio ? '700' : '400'}">${c.label}${c.obrigatorio ? ' <span style="color:#dc2626">*</span>' : ''}</td>
                                    <td style="padding:8px 12px">
                                        <select class="form-control" style="width:100%;font-size:12px" data-campo="${c.chave}" onchange="window.crm._onMappingChange(this)">
                                            <option value="">[Ignorar]</option>
                                            ${['', ...headers].map(h => `<option value="${this._esc(h)}" ${detected[c.chave] === h ? 'selected' : ''}>${h ? this._esc(h) : '[Ignorar]'}</option>`).join('')}
                                        </select>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-bottom:12px;padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px">
                    <label style="font-size:12px;display:flex;align-items:center;gap:8px;cursor:pointer">
                        <input type="checkbox" id="crm-import-update" style="width:16px;height:16px">
                        Atualizar leads existentes (mesmo e-mail ou nome+empresa) — merge conservador: preenche só campos vazios
                    </label>
                </div>
                <div id="crm-import-vendedores-pendentes" style="margin-bottom:12px;display:none">
                    <h5 style="font-size:13px;margin:0 0 8px;color:#a16207">Vendedores não encontrados</h5>
                    <div id="crm-import-vendedores-list" style="font-size:12px"></div>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn btn-secondary" onclick="window.crm._voltarPassoUpload()"><i class="ph ph-arrow-left"></i> Voltar</button>
                    <button class="btn btn-primary" onclick="window.crm._executarImportacao()"><i class="ph ph-check"></i> Importar ${data.length} registro(s)</button>
                </div>
            </div>
        `;
    },

    _getCamposImportaveis() {
        return [
            { chave: 'nome', label: 'Nome', hints: ['nome','name','contato','cliente','lead','razao_social','razaosocial'], obrigatorio: true },
            { chave: 'empresa', label: 'Empresa', hints: ['empresa','companhia','company','organization','org'], obrigatorio: false },
            { chave: 'cargo', label: 'Cargo', hints: ['cargo','funcao','role','position','titulo','cargo_do_contato'], obrigatorio: false },
            { chave: 'segmento', label: 'Segmento', hints: ['segmento','setor','ramo','industry','segment'], obrigatorio: false },
            { chave: 'email', label: 'E-mail', hints: ['email','e-mail','mail','correio','eletronico','email_address'], obrigatorio: false },
            { chave: 'telefone', label: 'Telefone', hints: ['telefone','phone','fone','tel','telefone_comercial','phone_number'], obrigatorio: false },
            { chave: 'celular', label: 'Celular', hints: ['celular','cel','mobile','whatsapp','whats','celular_whatsapp','movel'], obrigatorio: false },
            { chave: 'whatsapp', label: 'WhatsApp', hints: ['whatsapp','whats','whats_app','wpp','zap'], obrigatorio: false },
            { chave: 'cidade', label: 'Cidade', hints: ['cidade','city','municipio','cidade_do_lead'], obrigatorio: false },
            { chave: 'estado', label: 'Estado', hints: ['estado','uf','state','sigla_uf','estado_sigla'], obrigatorio: false },
            { chave: 'cnpj', label: 'CNPJ', hints: ['cnpj','cpf','documento','doc','cgc','cnpj_cpf','document'], obrigatorio: false },
            { chave: 'vendedor', label: 'Vendedor', hints: ['vendedor','vendedor_nome','nome_vendedor','responsavel','vendedor_responsavel'], obrigatorio: false },
            { chave: 'origem', label: 'Origem', hints: ['origem','fonte','source','origem_lead','lead_source','midia'], obrigatorio: false },
            { chave: 'interesse', label: 'Interesse', hints: ['interesse','descricao','produto','servico','produto_servico','necessidade'], obrigatorio: false },
            { chave: 'estimativa_valor', label: 'Valor Estimado', hints: ['valor','estimativa','valor_estimado','orcamento','budget','estimated_value','valor_estimado_total'], obrigatorio: false },
            { chave: 'orcamento_informado', label: 'Orçamento Informado', hints: ['orcamento_informado','orcamento_cliente','budget_client','orcamento_informado'], obrigatorio: false },
            { chave: 'prazo_interesse', label: 'Prazo de Interesse', hints: ['prazo','prazo_interesse','prazo_estimado','deadline','prazo_necessidade'], obrigatorio: false },
            { chave: 'observacoes', label: 'Observações', hints: ['observacoes','obs','notas','anotacoes','observacao','notes','comentarios'], obrigatorio: false },
            { chave: 'tags', label: 'Tags', hints: ['tags','etiquetas','labels','marcacoes','categorias','tag'], obrigatorio: false }
        ];
    },

    _autoDetectMapping(headers) {
        const campos = this._getCamposImportaveis();
        const mapping = {};
        const headersNorm = headers.map(h => h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
        for (const campo of campos) {
            const hintsNorm = campo.hints.map(h => h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
            let best = null, bestScore = 0;
            for (let i = 0; i < headersNorm.length; i++) {
                const h = headersNorm[i];
                const score = hintsNorm.some(hint => h.includes(hint) || hint.includes(h)) ? 1 + (h === hintsNorm[0] ? 2 : 0) : 0;
                if (score > bestScore) { bestScore = score; best = headers[i]; }
            }
            if (best) mapping[campo.chave] = best;
        }
        return mapping;
    },

    _onMappingChange(select) {
        const campo = select.getAttribute('data-campo');
        this._importMapping[campo] = select.value || '';
    },

    _voltarPassoUpload() {
        const body = document.getElementById('crm-import-body');
        if (!body) return;
        body.innerHTML = this._renderPassoUpload();
        if (this._importData) {
            const preview = this._importData.slice(0, 5);
            const headers = Object.keys(preview[0] || {});
            const table = document.getElementById('crm-import-table');
            if (table) {
                table.innerHTML = `
                    <thead><tr style="background:#f1f5f9">${headers.map(h => `<th style="padding:6px 10px;text-align:left;white-space:nowrap;font-weight:600;border-bottom:1px solid #e2e8f0">${this._esc(h)}</th>`).join('')}</tr></thead>
                    <tbody>${preview.map(row => `<tr>${headers.map(h => `<td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;white-space:nowrap">${this._esc(row[h] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
                `;
            }
            document.getElementById('crm-import-preview').style.display = 'block';
        }
    },

    async _executarImportacao() {
        if (!this._importData || !this._importMapping) return;
        const mapping = this._importMapping;
        const updateExisting = document.getElementById('crm-import-update')?.checked || false;
        const vendedores = store.getState().vendedores || [];
        const usuarioLogado = store.getState().ui?.userName || store.getState().auth?.user?.name || '';
        const vendedorLogado = vendedores.find(v => v.nome?.toLowerCase() === usuarioLogado.toLowerCase());
        const vendedorLogadoId = vendedorLogado?.id || '';

        // Collect unique vendedor names from data for matching
        const colVendedor = mapping.vendedor;
        const nomesVendedores = [...new Set(this._importData.map(r => (r[colVendedor] || '').trim()).filter(Boolean))];

        // Build vendedorMatch: try auto-match by name first
        const vendedorMatch = {};
        for (const nome of nomesVendedores) {
            const match = vendedores.find(v => v.nome?.toLowerCase() === nome.toLowerCase());
            vendedorMatch[nome] = match ? match.id : undefined;
        }

        // Read any existing vendedor selects from a previous pass
        const existingSelects = document.querySelectorAll('[data-vendedor-orig]');
        if (existingSelects.length > 0) {
            for (const sel of existingSelects) {
                const nome = sel.getAttribute('data-vendedor-orig');
                const val = sel.value;
                if (val) {
                    vendedorMatch[nome] = val;
                } else {
                    // User chose "[Atribuir ao usuário logado]" — use logged user
                    vendedorMatch[nome] = vendedorLogadoId || '__none__';
                }
            }
        }

        // Names still undefined are truly pending
        const pendentes = nomesVendedores.filter(n => vendedorMatch[n] === undefined);

        // If there are pending vendedors, show dropdown for each before proceeding
        if (pendentes.length > 0) {
            const div = document.getElementById('crm-import-vendedores-pendentes');
            const list = document.getElementById('crm-import-vendedores-list');
            if (div && list) {
                div.style.display = 'block';
                list.innerHTML = pendentes.map(nome => `
                    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
                        <span style="font-size:12px;min-width:140px;font-weight:600">${this._esc(nome)}</span>
                        <span style="font-size:11px;color:#6b7280">→</span>
                        <select class="form-control" style="font-size:12px;flex:1" data-vendedor-orig="${this._esc(nome)}">
                            <option value="">[Atribuir ao usuário logado]</option>
                            ${vendedores.map(v => `<option value="${v.id}">${this._esc(v.nome)}</option>`).join('')}
                        </select>
                    </div>
                `).join('');
            }
            return;
        }

        // Show loading
        const body = document.getElementById('crm-import-body');
        if (body) body.innerHTML = '<div style="text-align:center;padding:40px"><i class="ph ph-spinner ph-spin" style="font-size:32px;color:#2563eb"></i><p style="margin-top:12px;color:#6b7280">Importando leads...</p></div>';

        const leadsExistentes = store.getState().crmLeads || [];

        let importados = 0, atualizados = 0, pulados = 0, erros = [];

        for (let i = 0; i < this._importData.length; i++) {
            const row = this._importData[i];
            try {
                const lead = {};
                for (const [campo, coluna] of Object.entries(mapping)) {
                    if (!coluna) continue;
                    let val = row[coluna] || '';
                    if (campo === 'vendedor') {
                        const nomeV = val.trim();
                        lead.vendedor_id = vendedorMatch[nomeV] === '__none__' ? '' : (vendedorMatch[nomeV] || '');
                    } else if (campo === 'tags') {
                        lead.tags = this._converterTags(val);
                    } else if (campo === 'estimativa_valor' || campo === 'orcamento_informado') {
                        const num = parseFloat(String(val).replace(/[R$\s.]/g, '').replace(',', '.'));
                        lead[campo] = isNaN(num) ? 0 : num;
                    } else {
                        lead[campo] = val.trim();
                    }
                }

                if (!lead.nome) { erros.push({ linha: i + 2, nome: '', email: lead.email || '', motivo: 'Nome não preenchido' }); continue; }

                const defaultImportStage = this._getStages().find(s => s.is_default);
                const leadStatus = defaultImportStage ? defaultImportStage.id : 'novo';
                lead.status = leadStatus;
                lead.score = 0;
                lead.origem = lead.origem || 'importacao_planilha';

                // Check for duplicate
                const duplicata = leadsExistentes.find(l => {
                    if (lead.email && l.email?.toLowerCase() === lead.email.toLowerCase()) return true;
                    if (lead.nome && l.nome?.toLowerCase() === lead.nome.toLowerCase() && lead.empresa && l.empresa?.toLowerCase() === lead.empresa.toLowerCase()) return true;
                    return false;
                });

                if (duplicata) {
                    if (updateExisting) {
                        // Conservative merge: only fill empty fields
                        const updates = {};
                        for (const [k, v] of Object.entries(lead)) {
                            if (v && !duplicata[k]) updates[k] = v;
                        }
                        if (Object.keys(updates).length > 0) {
                            await store.updateCrmLead(duplicata.id, updates);
                            atualizados++;
                        } else {
                            pulados++;
                        }
                    } else {
                        pulados++;
                    }
                } else {
                    const created = await store.addCrmLead(lead);
                    if (created) importados++;
                    else erros.push({ linha: i + 2, nome: lead.nome, email: lead.email || '', motivo: 'Falha ao criar lead' });
                }
            } catch (err) {
                erros.push({ linha: i + 2, nome: row[mapping.nome] || '', email: row[mapping.email] || '', motivo: err.message });
            }
        }

        this._importErrors = erros;
        if (body) body.innerHTML = this._renderPassoResultado({ importados, atualizados, pulados, erros, total: this._importData.length });
        this._importData = null;
        this._importMapping = {};
        this._renderView();
        this.updateBadge();
    },

    _converterTags(val) {
        if (!val) return [];
        if (typeof val === 'string') {
            try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; } catch (e) {}
            return val.split(/[,;]/).map(t => t.trim()).filter(Boolean);
        }
        return Array.isArray(val) ? val : [];
    },

    _renderPassoResultado(stats) {
        return `
            <div id="crm-import-passo" data-passo="3">
                <div style="text-align:center;margin-bottom:24px">
                    <i class="ph ph-check-circle" style="font-size:48px;color:#16a34a;margin-bottom:12px"></i>
                    <h4 style="font-size:16px;margin:0;color:#374151">Importação Concluída</h4>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:700;color:#16a34a">${stats.importados}</div>
                        <div style="font-size:12px;color:#166534">Criados</div>
                    </div>
                    <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:700;color:#a16207">${stats.atualizados}</div>
                        <div style="font-size:12px;color:#854d0e">Atualizados</div>
                    </div>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:700;color:#64748b">${stats.pulados}</div>
                        <div style="font-size:12px;color:#64748b">Pulados</div>
                    </div>
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:700;color:#dc2626">${stats.erros.length}</div>
                        <div style="font-size:12px;color:#991b1b">Erros</div>
                    </div>
                </div>
                ${stats.erros.length > 0 ? `
                    <div style="margin-bottom:16px">
                        <button class="btn btn-sm" style="background:#dc2626;color:#fff;border:none" onclick="window.crm._baixarRelatorioErros()">
                            <i class="ph ph-download"></i> Baixar relatório de erros (.csv)
                        </button>
                    </div>
                ` : ''}
                <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn btn-primary" onclick="this.closest('.crm-modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;
    },

    _baixarRelatorioErros() {
        const erros = this._importErrors || [];
        const bom = '\uFEFF';
        const csv = bom + 'Linha;Nome;Email;Motivo\n' + erros.map(e => `${e.linha};${e.nome};${e.email};${e.motivo}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'erros_importacao_leads.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }
};

window.crm = CRM;

function tryInit() {
    if (document.getElementById('crm-app')) {
        CRM.init();
        return true;
    }
    return false;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
} else {
    tryInit();
}

if (typeof window !== 'undefined') {
    if (window.app) window.app.crm = CRM;
}
