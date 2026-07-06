import { store } from './state.js';

window.app = window.app || {};

const API = '/api/data';
const token = () => store.getState().auth.token;

const api = {
    async get(entity) {
        const res = await fetch(`${API}/${entity}`, { headers: { 'Authorization': `Bearer ${token()}` } });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data;
    },
    async getById(entity, id) {
        const res = await fetch(`${API}/${entity}/${id}`, { headers: { 'Authorization': `Bearer ${token()}` } });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data;
    },
    async create(entity, body) {
        const res = await fetch(`${API}/${entity}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erro ao criar');
        return data;
    },
    async update(entity, id, body) {
        const res = await fetch(`${API}/${entity}/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erro ao atualizar');
        return data;
    },
    async remove(entity, id) {
        const res = await fetch(`${API}/${entity}/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erro ao remover');
        return data;
    }
};

const STATUS_BADGE = {
    'em_andamento': { bg: '#dbeafe', color: '#1e40af', label: 'Em Andamento' },
    'concluido': { bg: '#dcfce7', color: '#166534', label: 'Concluído' },
    'cancelado': { bg: '#fee2e2', color: '#991b1b', label: 'Cancelado' }
};

const ETAPA_OPTIONS = [
    { value: 'inicio', label: 'Início', icon: 'ph-play-circle' },
    { value: 'montagem_mecanica', label: 'Montagem Mecânica', icon: 'ph-toolbox' },
    { value: 'fiacao', label: 'Fiação', icon: 'ph-wire' },
    { value: 'teste', label: 'Teste', icon: 'ph-flask' },
    { value: 'liberado', label: 'Liberado', icon: 'ph-check-circle' }
];

const _notify = async (evento, mensagem) => {
    try {
        const token = store.getState().auth.token;
        if (!token) return;
        await fetch('/api/manufatura/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ evento, mensagem })
        }).catch(() => {});
    } catch (e) {}
};

const _safe = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/`/g, '\\`')
        .replace(/"/g, '\\u0022')
        .replace(/\n/g, '\\n');
};

const ManufaturaModule = {
    projetos: [],
    colunas: [],
    gavetas: [],
    componentes: [],
    viewMode: 'list',
    activeProjectId: null,
    activeTab: 'colunas',
    searchQuery: '',
    kanbanFilterColuna: '',
    kanbanSearchTerm: '',
    _associateStep: null,
    _associateParentType: null,
    _associateParentId: null,
    _scannerInstance: null,
    historico: [],
    perfisTeste: [],
    resultadosTeste: [],
    anexos: [],

    init() {
        this._addDashboardButton();
        window.app.manufatura = {
            render: this.render.bind(this),
            backToList: this.backToList.bind(this),
            openProject: this.openProject.bind(this),
            showCreateProjectModal: this.showCreateProjectModal.bind(this),
            createProject: this.createProject.bind(this),
            deleteProject: this.deleteProject.bind(this),
            importFromProposta: this.importFromProposta.bind(this),
            switchTab: this.switchTab.bind(this),
            showColumnModal: this.showColumnModal.bind(this),
            saveColumn: this.saveColumn.bind(this),
            deleteColumn: this.deleteColumn.bind(this),
            showDrawerModal: this.showDrawerModal.bind(this),
            saveDrawer: this.saveDrawer.bind(this),
            deleteDrawer: this.deleteDrawer.bind(this),
            showComponentModal: this.showComponentModal.bind(this),
            saveComponent: this.saveComponent.bind(this),
            removeComponent: this.removeComponent.bind(this),
            filterProjects: this.filterProjects.bind(this),
            changeProjectStatus: this.changeProjectStatus.bind(this),
            updateColumnStatus: this.updateColumnStatus.bind(this),
            updateDrawerStatus: this.updateDrawerStatus.bind(this),
            filterKanban: this.filterKanban.bind(this),
            showQRCode: this.showQRCode.bind(this),
            openQRScanner: this.openQRScanner.bind(this),
            closeQRScanner: this.closeQRScanner.bind(this),
            startAssociation: this.startAssociation.bind(this),
            confirmAssociation: this.confirmAssociation.bind(this),
            lookupQRData: this.lookupQRData.bind(this),
            showTestModal: this.showTestModal.bind(this),
            submitTestResult: this.submitTestResult.bind(this),
            showTestProfileModal: this.showTestProfileModal.bind(this),
            saveTestProfile: this.saveTestProfile.bind(this),
            showCertificate: this.showCertificate.bind(this),
            exportDataBook: this.exportDataBook.bind(this),
            showUploadModal: this.showUploadModal.bind(this),
            uploadAnexo: this.uploadAnexo.bind(this),
            deleteAnexo: this.deleteAnexo.bind(this),
            downloadAnexo: this.downloadAnexo.bind(this),
            showReplaceDrawerModal: this.showReplaceDrawerModal.bind(this),
            confirmReplaceDrawer: this.confirmReplaceDrawer.bind(this),
            showDashboard: this.showDashboard.bind(this),
            searchMaterial: this.searchMaterial.bind(this),
            selectMaterialForComponent: this.selectMaterialForComponent.bind(this),
            showLaborModal: this.showLaborModal.bind(this),
            saveLaborRecord: this.saveLaborRecord.bind(this)
        };

        store.subscribe((state) => {
            if (state.manufaturaProjetos) {
                this.projetos = state.manufaturaProjetos;
                this.colunas = state.manufaturaColunas || [];
                this.gavetas = state.manufaturaGavetas || [];
                this.componentes = state.manufaturaComponentes || [];
                this.perfisTeste = state.manufaturaPerfisTeste || [];
                this.resultadosTeste = state.manufaturaResultadosTeste || [];
                this.anexos = state.manufaturaAnexos || [];
            }
        });
        this.loadData();
        console.log('[Manufatura] Module initialized.');
    },

    async loadData() {
        try {
            const s = store.getState();
            this.projetos = s.manufaturaProjetos || [];
            this.colunas = s.manufaturaColunas || [];
            this.gavetas = s.manufaturaGavetas || [];
            this.componentes = s.manufaturaComponentes || [];
            this.historico = s.manufaturaHistorico || [];
            this.perfisTeste = s.manufaturaPerfisTeste || [];
            this.resultadosTeste = s.manufaturaResultadosTeste || [];
            this.anexos = s.manufaturaAnexos || [];
        } catch (e) {
            this.projetos = [];
            this.colunas = [];
            this.gavetas = [];
            this.componentes = [];
            this.historico = [];
            this.perfisTeste = [];
            this.resultadosTeste = [];
            this.anexos = [];
        }
        this.render();
    },

    filterProjects(q) {
        this.searchQuery = q || '';
        const container = document.getElementById('manufatura-list');
        if (container) container.innerHTML = this.renderProjectList();
    },

    render() {
        const container = document.getElementById('view-manufatura');
        if (!container) return;

        if (this.viewMode === 'dashboard') {
            this.renderDashboard();
            return;
        }

        if (this.viewMode === 'project' && this.activeProjectId) {
            this.renderProjectView();
            return;
        }

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-wrench"></i> Manufatura
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Gerenciamento de manufatura de painéis elétricos — Rastreabilidade via QR Code</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showDashboard()" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                            <i class="ph ph-chart-bar"></i> Dashboard
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.openQRScanner('view')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                            <i class="ph ph-camera"></i> Scan QR
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.importFromProposta()" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                            <i class="ph ph-file-arrow-down"></i> Importar da Proposta
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showCreateProjectModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                            <i class="ph ph-plus"></i> Novo Projeto
                        </button>
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <div style="position: relative; flex: 1; max-width: 400px;">
                            <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            <input type="text" class="form-control" placeholder="Buscar projeto por nome ou cliente..." style="padding-left: 38px;" oninput="window.app.manufatura.filterProjects(this.value)">
                        </div>
                    </div>
                    <div id="manufatura-list">
                        ${this.renderProjectList()}
                    </div>
                </div>
            </div>
        `;
    },

    renderProjectList() {
        const filtered = this.searchQuery
            ? this.projetos.filter(p =>
                (p.nome || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (p.cliente || '').toLowerCase().includes(this.searchQuery.toLowerCase()))
            : this.projetos;

        if (filtered.length === 0) {
            return `
                <div style="padding: 60px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                    <i class="ph ph-wrench" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
                    <br>${this.searchQuery ? 'Nenhum projeto encontrado.' : 'Nenhum projeto de manufatura cadastrado.'}
                    <br><small style="color: #cbd5e1;">${this.searchQuery ? 'Tente outro termo de busca.' : 'Clique em "Novo Projeto" para começar.'}</small>
                </div>
            `;
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${filtered.map(p => {
                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE['em_andamento'];
                    const colCount = this.colunas.filter(c => c.projeto_id === p.id).length;
                    const gavCount = this.gavetas.filter(g => this.colunas.some(c => c.id === g.coluna_id && c.projeto_id === p.id)).length;
                    return `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
                             onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'"
                             onclick="window.app.manufatura.openProject('${p.id}')">
                            <div style="width: 42px; height: 42px; border-radius: 10px; background: #eff6ff; display: flex; align-items: center; justify-content: center; color: #3b82f6;">
                                <i class="ph ph-wrench" style="font-size: 22px;"></i>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; font-size: 14px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nome || 'Sem nome'}</div>
                                <div style="font-size: 12px; color: #64748b; display: flex; gap: 16px; margin-top: 2px;">
                                    <span><i class="ph ph-buildings" style="font-size: 11px;"></i> ${p.cliente || 'Sem cliente'}</span>
                                    <span><i class="ph ph-calendar" style="font-size: 11px;"></i> ${p.data_criacao ? new Date(p.data_criacao).toLocaleDateString('pt-BR') : '-'}</span>
                                    <span><i class="ph ph-grid-nine" style="font-size: 11px;"></i> ${colCount} coluna(s)</span>
                                    <span><i class="ph ph-tray" style="font-size: 11px;"></i> ${gavCount} gaveta(s)</span>
                                </div>
                            </div>
                            <span style="font-size: 11px; padding: 3px 10px; border-radius: 10px; background: ${badge.bg}; color: ${badge.color}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px;">${badge.label}</span>
                            <button class="btn btn-sm btn-ghost" style="margin-left: 2px;" onclick="event.stopPropagation(); window.app.manufatura.showQRCode('projeto', '${p.id}', '${_safe(p.nome)}')" title="QR Code">
                                <i class="ph ph-qr-code" style="color: #3b82f6;"></i>
                            </button>
                            <button class="btn btn-sm btn-ghost" style="margin-left: 2px;" onclick="event.stopPropagation(); if(confirm('Excluir projeto ${_safe(p.nome)}?')) window.app.manufatura.deleteProject('${p.id}')">
                                <i class="ph ph-trash" style="color: #ef4444;"></i>
                            </button>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderProjectView() {
        const proj = this.projetos.find(p => p.id === this.activeProjectId);
        if (!proj) { this.viewMode = 'list'; this.render(); return; }

        const container = document.getElementById('view-manufatura');
        if (!container) return;

        const badge = STATUS_BADGE[proj.status] || STATUS_BADGE['em_andamento'];
        const projectColunas = this.colunas.filter(c => c.projeto_id === proj.id);

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 16px 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.backToList()" style="color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 12px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <div>
                                <h2 style="margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                                    <i class="ph ph-wrench"></i> ${proj.nome || 'Sem nome'}
                                    <span style="font-size: 10px; padding: 2px 10px; border-radius: 10px; background: ${badge.bg}; color: ${badge.color}; text-transform: uppercase; font-weight: 700;">${badge.label}</span>
                                </h2>
                                <div style="font-size: 12px; opacity: 0.85; margin-top: 2px;">
                                    ${proj.cliente || 'Sem cliente'} — Criado em ${proj.data_criacao ? new Date(proj.data_criacao).toLocaleDateString('pt-BR') : '-'}
                                    ${proj.proposta_tecnica_id ? ` — PT: ${proj.proposta_tecnica_id}` : ''}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <select class="form-control" style="width: auto; font-size: 12px; padding: 4px 8px; border-radius: 6px;" onchange="window.app.manufatura.changeProjectStatus('${proj.id}', this.value)">
                                ${Object.entries(STATUS_BADGE).map(([k, v]) =>
                                    `<option value="${k}" ${proj.status === k ? 'selected' : ''}>${v.label}</option>`
                                ).join('')}
                            </select>
                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showQRCode('projeto', '${proj.id}', '${_safe(proj.nome)}')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                                <i class="ph ph-qr-code"></i> QR
                            </button>
                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.openQRScanner('associate')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                                <i class="ph ph-camera"></i> Scan
                            </button>
                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showColumnModal('${proj.id}')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                                <i class="ph ph-plus"></i> Coluna
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 16px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 8px;">
                        <button class="btn btn-sm btn-ghost ${this.activeTab === 'colunas' ? 'active' : ''}" onclick="window.app.manufatura.switchTab('colunas')" style="color: white; border: none; opacity: ${this.activeTab === 'colunas' ? 1 : 0.7}; font-size: 12px;">
                            <i class="ph ph-grid-nine"></i> Colunas (${projectColunas.length})
                        </button>
                        <button class="btn btn-sm btn-ghost ${this.activeTab === 'historico' ? 'active' : ''}" onclick="window.app.manufatura.switchTab('historico')" style="color: white; border: none; opacity: ${this.activeTab === 'historico' ? 1 : 0.7}; font-size: 12px;">
                            <i class="ph ph-clock-counter-clockwise"></i> Histórico
                        </button>
                        <button class="btn btn-sm btn-ghost ${this.activeTab === 'kanban' ? 'active' : ''}" onclick="window.app.manufatura.switchTab('kanban')" style="color: white; border: none; opacity: ${this.activeTab === 'kanban' ? 1 : 0.7}; font-size: 12px;">
                            <i class="ph ph-columns"></i> Kanban
                        </button>
                        <button class="btn btn-sm btn-ghost ${this.activeTab === 'testes' ? 'active' : ''}" onclick="window.app.manufatura.switchTab('testes')" style="color: white; border: none; opacity: ${this.activeTab === 'testes' ? 1 : 0.7}; font-size: 12px;">
                            <i class="ph ph-flask"></i> Testes
                        </button>
                        <button class="btn btn-sm btn-ghost ${this.activeTab === 'databook' ? 'active' : ''}" onclick="window.app.manufatura.switchTab('databook')" style="color: white; border: none; opacity: ${this.activeTab === 'databook' ? 1 : 0.7}; font-size: 12px;">
                            <i class="ph ph-book-open"></i> Data Book
                        </button>
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    ${this.activeTab === 'colunas' ? this.renderColunasTab(proj, projectColunas) : this.activeTab === 'kanban' ? this.renderKanbanTab(proj, projectColunas) : this.activeTab === 'testes' ? this.renderTestesTab(proj, projectColunas) : this.activeTab === 'databook' ? this.renderDataBookTab(proj, projectColunas) : this.renderHistoricoTab(proj)}
                </div>
            </div>
        `;

        if (this.activeTab === 'kanban') {
            setTimeout(() => this.setupKanbanDragDrop(), 50);
        }
    },

    renderColunasTab(proj, colunas) {
        if (colunas.length === 0) {
            return `
                <div style="padding: 60px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                    <i class="ph ph-grid-nine" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
                    <br>Nenhuma coluna cadastrada neste projeto.
                    <br><small style="color: #cbd5e1;">Clique em "Adicionar Coluna" para importar do layout CCM da proposta técnica ou criar manualmente.</small>
                </div>
            `;
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${colunas.sort((a, b) => (a.posicao || 0) - (b.posicao || 0)).map(col => {
                    const colGavetas = this.gavetas.filter(g => g.coluna_id === col.id);
                    const colBadge = STATUS_BADGE[col.status] || STATUS_BADGE['em_andamento'];
                    const etapaLabel = ETAPA_OPTIONS.find(e => e.value === col.etapa) || { label: col.etapa };
                    return `
                        <div class="card" style="padding: 0; overflow: hidden;">
                            <div style="padding: 14px 18px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="ph ph-grid-nine" style="font-size: 18px; color: #3b82f6;"></i>
                                    <strong style="font-size: 14px; color: #1e293b;">${col.tag || 'Sem TAG'}</strong>
                                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: #e2e8f0; color: #475569;">${col.tipo || 'CCM-BT'}</span>
                                    <span style="font-size: 11px; color: #64748b;"><i class="ph ph-tray"></i> ${colGavetas.length} gaveta(s)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 10px; background: ${colBadge.bg}; color: ${colBadge.color}; font-weight: 600;">${colBadge.label}</span>
                                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #f1f5f9; color: #475569;">${etapaLabel.label}</span>
                                    <select class="form-control" style="width: auto; font-size: 11px; padding: 2px 6px; border-radius: 4px;" onchange="window.app.manufatura.updateColumnStatus('${col.id}', this.value)">
                                        ${ETAPA_OPTIONS.map(e => `<option value="${e.value}" ${col.etapa === e.value ? 'selected' : ''}>${e.label}</option>`).join('')}
                                    </select>
                                    <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showColumnModal('${proj.id}', '${col.id}')" style="font-size: 11px;"><i class="ph ph-pencil"></i></button>
                                    <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showQRCode('coluna', '${col.id}', '${_safe(col.tag)}')" style="font-size: 11px;" title="QR Code"><i class="ph ph-qr-code" style="color: #3b82f6;"></i></button>
                                    <button class="btn btn-sm btn-ghost" onclick="if(confirm('Excluir coluna ${_safe(col.tag)}?')) window.app.manufatura.deleteColumn('${col.id}')" style="font-size: 11px;"><i class="ph ph-trash" style="color: #ef4444;"></i></button>
                                    <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showDrawerModal('${col.id}')" style="color: #3b82f6; font-size: 11px; border: 1px solid #3b82f6; padding: 2px 8px;">
                                        <i class="ph ph-plus"></i> Gaveta
                                    </button>
                                </div>
                            </div>
                            ${colGavetas.length > 0 ? `
                            <div style="padding: 8px 18px 14px 18px;">
                                ${colGavetas.sort((a, b) => (a.posicao || 0) - (b.posicao || 0)).map(g => {
                                    const gBadge = STATUS_BADGE[g.status] || STATUS_BADGE['em_andamento'];
                                    const gEtapa = ETAPA_OPTIONS.find(e => e.value === g.etapa) || { label: g.etapa, icon: 'ph-circle' };
                                    const gComp = this.componentes.filter(c => c.gaveta_id === g.id);
                                    return `
                                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-top: 6px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
                                            <i class="ph ph-tray" style="font-size: 16px; color: #64748b;"></i>
                                            <div style="flex: 1; min-width: 0;">
                                                <span style="font-weight: 600; font-size: 13px; color: #1e293b;">${g.tag || 'Sem TAG'}</span>
                                                <span style="font-size: 11px; margin-left: 8px; color: #64748b;">${g.modelo || g.tipo || '-'} ${g.potencia_kw ? `— ${g.potencia_kw}kW` : ''}</span>
                                                <span style="font-size: 11px; margin-left: 8px; color: #94a3b8;">${gComp.length} componente(s)</span>
                                            </div>
                                            <span style="font-size: 11px; padding: 1px 6px; border-radius: 8px; background: ${gBadge.bg}; color: ${gBadge.color}; font-weight: 600;">${gBadge.label}</span>
                                            <select class="form-control" style="width: auto; font-size: 10px; padding: 1px 4px; border-radius: 3px;" onchange="window.app.manufatura.updateDrawerStatus('${g.id}', this.value)">
                                                ${ETAPA_OPTIONS.map(e => `<option value="${e.value}" ${g.etapa === e.value ? 'selected' : ''}>${e.label}</option>`).join('')}
                                            </select>
                                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showDrawerModal('${col.id}', '${g.id}')" style="font-size: 10px;"><i class="ph ph-pencil"></i></button>
                                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showQRCode('gaveta', '${g.id}', '${_safe(g.tag)}')" style="font-size: 10px;" title="QR Code"><i class="ph ph-qr-code" style="color: #3b82f6;"></i></button>
                                            <button class="btn btn-sm btn-ghost" onclick="if(confirm('Excluir gaveta ${_safe(g.tag)}?')) window.app.manufatura.deleteDrawer('${g.id}')" style="font-size: 10px;"><i class="ph ph-trash" style="color: #ef4444;"></i></button>
                                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showComponentModal('${g.id}')" style="color: #3b82f6; font-size: 10px;"><i class="ph ph-plus"></i> Componente</button>
                                            ${gComp.length > 0 ? `
                                            <div style="position: relative; display: inline-block;">
                                                <button class="btn btn-sm btn-ghost" style="font-size: 10px;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">
                                                    <i class="ph ph-list"></i> ${gComp.length}
                                                </button>
                                                <div style="display: none; position: absolute; right: 0; top: 100%; z-index: 50; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 8px; min-width: 240px; margin-top: 4px;">
                                                    <div style="font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">Componentes da ${g.tag}</div>
                                                    ${gComp.map(c => `
                                                        <div style="display: flex; align-items: center; gap: 6px; padding: 4px 0; font-size: 11px; color: #334155;">
                                                            <span style="background: #e2e8f0; padding: 1px 6px; border-radius: 4px; font-size: 10px;">${c.tipo || '-'}</span>
                                                            <span style="flex: 1;">${c.codigo || ''}</span>
                                                            <span style="color: #94a3b8;">x${c.quantidade || 1}</span>
                                                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.removeComponent('${c.id}')" style="font-size: 10px; color: #ef4444;"><i class="ph ph-x"></i></button>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            ` : `
                            <div style="padding: 12px 18px; text-align: center; color: #94a3b8; font-size: 12px;">
                                Nenhuma gaveta cadastrada nesta coluna.
                            </div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderHistoricoTab(proj) {
        const historico = this._getHistorico(proj.id) || [];
        if (historico.length === 0) {
            return `
                <div style="padding: 60px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                    <i class="ph ph-clock-counter-clockwise" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
                    <br>Nenhum registro de histórico disponível.
                </div>
            `;
        }
        return `
            <div style="display: flex; flex-direction: column; gap: 6px;">
                ${historico.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map(h => `
                    <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <i class="ph ph-circle" style="font-size: 8px; color: #3b82f6; margin-top: 6px;"></i>
                        <div style="flex: 1;">
                            <div style="font-size: 13px; color: #1e293b;">${h.acao || '-'}</div>
                            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${h.usuario || 'Sistema'} — ${h.created_at ? new Date(h.created_at).toLocaleString('pt-BR') : '-'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    _getHistorico(projetoId) {
        const projectColunas = this.colunas.filter(c => c.projeto_id === projetoId);
        const colunaIds = projectColunas.map(c => c.id);
        const gavetas = this.gavetas.filter(g => colunaIds.includes(g.coluna_id));
        const gavetaIds = gavetas.map(g => g.id);
        const entityIds = [projetoId, ...colunaIds, ...gavetaIds];
        return this.historico.filter(h => entityIds.includes(h.entidade_id));
    },

    switchTab(tab) {
        this.activeTab = tab;
        if (this.viewMode === 'project' && this.activeProjectId) {
            this.renderProjectView();
        }
    },

    backToList() {
        this.viewMode = 'list';
        this.activeProjectId = null;
        this.activeTab = 'colunas';
        this.render();
    },

    _addDashboardButton() {
        const existing = document.querySelector('[data-manufatura-dashboard]');
        if (existing) existing.remove();
    },

    openProject(id) {
        this.activeProjectId = id;
        this.viewMode = 'project';
        this.activeTab = 'colunas';
        this.renderProjectView();
    },

    async changeProjectStatus(id, status) {
        try {
            await api.update('manufaturaProjetos', id, { status, updated_at: new Date().toISOString() });
            const p = this.projetos.find(x => x.id === id);
            if (p) p.status = status;
            this.renderProjectView();
            window.app.toast('Status do projeto atualizado!', 'success');
        } catch (e) {
            window.app.toast('Erro ao atualizar status: ' + e.message, 'error');
        }
    },

    async updateColumnStatus(id, etapa) {
        try {
            await api.update('manufaturaColunas', id, { etapa, updated_at: new Date().toISOString() });
            const c = this.colunas.find(x => x.id === id);
            if (c) c.etapa = etapa;
            window.app.toast('Etapa da coluna atualizada!', 'success');
        } catch (e) {
            window.app.toast('Erro ao atualizar etapa: ' + e.message, 'error');
        }
    },

    async updateDrawerStatus(id, etapa) {
        try {
            await api.update('manufaturaGavetas', id, { etapa, updated_at: new Date().toISOString() });
            const g = this.gavetas.find(x => x.id === id);
            if (g) g.etapa = etapa;
            window.app.toast('Etapa da gaveta atualizada!', 'success');
        } catch (e) {
            window.app.toast('Erro ao atualizar etapa: ' + e.message, 'error');
        }
    },

    showCreateProjectModal() {
        const data = store.getState().activeTechnicalProposal || {};
        const modal = document.createElement('div');
        modal.id = 'modal-manufatura-projeto';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 520px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease;">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-wrench" style="color: #3b82f6;"></i> Novo Projeto de Manufatura
                </h3>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Nome do Projeto</label>
                        <input id="mf-proj-nome" class="form-control" value="${data.projeto || ''}" placeholder="Ex: CCM Indústria Química" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Cliente</label>
                        <input id="mf-proj-cliente" class="form-control" value="${data.cliente || ''}" placeholder="Nome do cliente" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Proposta Técnica Vinculada</label>
                        <input class="form-control" value="${data.id ? data.id + ' - ' + (data.projeto || '') : 'Nenhuma proposta ativa'}" disabled style="width: 100%; opacity: 0.7;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Observações</label>
                        <textarea id="mf-proj-obs" class="form-control" rows="3" placeholder="Observações iniciais..." style="width: 100%; resize: vertical;"></textarea>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-manufatura-projeto').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.createProject()">Criar Projeto</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async createProject() {
        const nome = document.getElementById('mf-proj-nome')?.value?.trim();
        if (!nome) { window.app.toast('Informe o nome do projeto.', 'error'); return; }
        const cliente = document.getElementById('mf-proj-cliente')?.value?.trim() || '';
        const obs = document.getElementById('mf-proj-obs')?.value?.trim() || '';
        const data = store.getState().activeTechnicalProposal || {};

        const modal = document.getElementById('modal-manufatura-projeto');
        if (modal) modal.remove();

        try {
            const now = new Date().toISOString();
            const payload = {
                id: 'MF-' + Date.now().toString(36).toUpperCase(),
                nome,
                cliente,
                proposta_tecnica_id: data.id || '',
                data_criacao: now,
                status: 'em_andamento',
                etapa: 'inicio',
                observacoes: obs,
                created_at: now,
                updated_at: now
            };
            const result = await api.create('manufaturaProjetos', payload);
            this.projetos.push(result.item || payload);
            window.app.toast(`Projeto "${nome}" criado com sucesso!`, 'success');
            _notify('Projeto Criado', `📦 *${_safe(nome)}*\nCliente: ${_safe(cliente)}\nID: ${payload.id}`);
            this.render();
        } catch (e) {
            window.app.toast('Erro ao criar projeto: ' + e.message, 'error');
        }
    },

    async deleteProject(id) {
        try {
            const colunas = this.colunas.filter(c => c.projeto_id === id);
            for (const col of colunas) {
                const gavetas = this.gavetas.filter(g => g.coluna_id === col.id);
                for (const g of gavetas) {
                    const comps = this.componentes.filter(c => c.gaveta_id === g.id);
                    for (const c of comps) { await api.remove('manufaturaComponentes', c.id); this.componentes = this.componentes.filter(x => x.id !== c.id); }
                    await api.remove('manufaturaGavetas', g.id); this.gavetas = this.gavetas.filter(x => x.id !== g.id);
                }
                await api.remove('manufaturaColunas', col.id); this.colunas = this.colunas.filter(x => x.id !== col.id);
            }
            await api.remove('manufaturaProjetos', id);
            this.projetos = this.projetos.filter(p => p.id !== id);
            if (this.activeProjectId === id) { this.viewMode = 'list'; this.activeProjectId = null; }
            window.app.toast('Projeto removido.', 'info');
            this.render();
        } catch (e) {
            window.app.toast('Erro ao remover: ' + e.message, 'error');
        }
    },

    async importFromProposta() {
        const data = store.getState().activeTechnicalProposal || {};
        if (!data.id || !data.projeto) {
            window.app.toast('Nenhuma proposta técnica ativa encontrada. Abra uma proposta primeiro.', 'error');
            return;
        }
        try {
            const now = new Date().toISOString();
            const payload = {
                id: 'MF-' + Date.now().toString(36).toUpperCase(),
                nome: data.projeto + ' (Manufatura)',
                cliente: data.cliente || '',
                proposta_tecnica_id: data.id,
                data_criacao: now,
                status: 'em_andamento',
                etapa: 'inicio',
                observacoes: 'Importado da proposta técnica ' + data.id,
                created_at: now,
                updated_at: now
            };
            const result = await api.create('manufaturaProjetos', payload);
            this.projetos.push(result.item || payload);

            const eqs = data.equipments || data.equipamentos || [];
            if (eqs.length > 0) {
                for (let i = 0; i < eqs.length; i++) {
                    const eq = eqs[i];
                    const colPayload = {
                        id: 'COL-' + Date.now().toString(36).toUpperCase() + '-' + i,
                        projeto_id: payload.id,
                        tag: eq.tag || `CCM-${String(i + 1).padStart(2, '0')}`,
                        tipo: eq.type || 'CCM-BT',
                        posicao: i,
                        status: 'em_andamento',
                        etapa: 'montagem_mecanica'
                    };
                    const colResult = await api.create('manufaturaColunas', colPayload);
                    this.colunas.push(colResult.item || colPayload);
                }
                window.app.toast(`Projeto importado com ${eqs.length} colunas!`, 'success');
                _notify('Projeto Importado', `📥 *${_safe(payload.nome)}*\n${eqs.length} colunas importadas da proposta ${data.id}`);
            } else {
                window.app.toast('Projeto importado sem colunas (proposta sem equipamentos).', 'info');
            }
            this.render();
        } catch (e) {
            window.app.toast('Erro ao importar: ' + e.message, 'error');
        }
    },

    showColumnModal(projetoId, columnId) {
        const isEdit = !!columnId;
        const col = isEdit ? this.colunas.find(c => c.id === columnId) : null;

        const modal = document.createElement('div');
        modal.id = 'modal-manufatura-coluna';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 480px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease;">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-grid-nine" style="color: #3b82f6;"></i> ${isEdit ? 'Editar Coluna' : 'Nova Coluna'}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">TAG da Coluna</label>
                        <input id="mf-col-tag" class="form-control" value="${isEdit ? (col?.tag || '') : 'CCM-01'}" placeholder="Ex: CCM-01" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Tipo de Painel</label>
                        <select id="mf-col-tipo" class="form-control" style="width: 100%;">
                            ${['CCM-BT', 'QGBT', 'Cubículo MT', 'Painel Geral'].map(t =>
                                `<option value="${t}" ${isEdit && col?.tipo === t ? 'selected' : ''}>${t}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Posição</label>
                        <input id="mf-col-pos" type="number" class="form-control" value="${isEdit ? (col?.posicao || 0) : 0}" style="width: 100px;">
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-manufatura-coluna').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.saveColumn('${projetoId}', '${columnId || ''}')">${isEdit ? 'Salvar' : 'Adicionar'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async saveColumn(projetoId, columnId) {
        const tag = document.getElementById('mf-col-tag')?.value?.trim();
        if (!tag) { window.app.toast('Informe a TAG da coluna.', 'error'); return; }
        const tipo = document.getElementById('mf-col-tipo')?.value || 'CCM-BT';
        const posicao = parseInt(document.getElementById('mf-col-pos')?.value) || 0;
        const modal = document.getElementById('modal-manufatura-coluna');
        if (modal) modal.remove();

        try {
            const now = new Date().toISOString();
            if (columnId) {
                await api.update('manufaturaColunas', columnId, { tag, tipo, posicao, updated_at: now });
                const col = this.colunas.find(c => c.id === columnId);
                if (col) { col.tag = tag; col.tipo = tipo; col.posicao = posicao; }
                window.app.toast('Coluna atualizada!', 'success');
            } else {
                const payload = {
                    id: 'COL-' + Date.now().toString(36).toUpperCase(),
                    projeto_id: projetoId,
                    tag, tipo, posicao,
                    status: 'em_andamento',
                    etapa: 'montagem_mecanica',
                    created_at: now,
                    updated_at: now
                };
                const result = await api.create('manufaturaColunas', payload);
                this.colunas.push(result.item || payload);
                window.app.toast('Coluna adicionada!', 'success');
            }
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao salvar coluna: ' + e.message, 'error');
        }
    },

    async deleteColumn(id) {
        try {
            const gavetas = this.gavetas.filter(g => g.coluna_id === id);
            for (const g of gavetas) {
                const comps = this.componentes.filter(c => c.gaveta_id === g.id);
                for (const c of comps) { await api.remove('manufaturaComponentes', c.id); this.componentes = this.componentes.filter(x => x.id !== c.id); }
                await api.remove('manufaturaGavetas', g.id); this.gavetas = this.gavetas.filter(x => x.id !== g.id);
            }
            await api.remove('manufaturaColunas', id);
            this.colunas = this.colunas.filter(c => c.id !== id);
            window.app.toast('Coluna removida.', 'info');
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao remover: ' + e.message, 'error');
        }
    },

    showDrawerModal(colunaId, drawerId) {
        const isEdit = !!drawerId;
        const gav = isEdit ? this.gavetas.find(g => g.id === drawerId) : null;

        const modal = document.createElement('div');
        modal.id = 'modal-manufatura-gaveta';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 520px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease;">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-tray" style="color: #3b82f6;"></i> ${isEdit ? 'Editar Gaveta' : 'Nova Gaveta'}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">TAG da Gaveta</label>
                            <input id="mf-gav-tag" class="form-control" value="${isEdit ? (gav?.tag || '') : 'GAV-01'}" style="width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Posição</label>
                            <input id="mf-gav-pos" type="number" class="form-control" value="${isEdit ? (gav?.posicao || 0) : 0}" style="width: 100%;">
                        </div>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Tipo de Gaveta</label>
                        <select id="mf-gav-tipo" class="form-control" style="width: 100%;">
                            ${['partida_direta', 'soft_starter', 'inversor', 'relé', 'CLP', 'instrumentação', 'reserva'].map(t =>
                                `<option value="${t}" ${isEdit && gav?.tipo === t ? 'selected' : ''}>${t.replace(/_/g, ' ').toUpperCase()}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Modelo</label>
                            <input id="mf-gav-modelo" class="form-control" value="${isEdit ? (gav?.modelo || '') : ''}" placeholder="Ex: MMS-32" style="width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Potência (kW)</label>
                            <input id="mf-gav-pot" type="number" step="0.1" class="form-control" value="${isEdit ? (gav?.potencia_kw || '') : ''}" style="width: 100%;">
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-manufatura-gaveta').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.saveDrawer('${colunaId}', '${drawerId || ''}')">${isEdit ? 'Salvar' : 'Adicionar'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async saveDrawer(colunaId, drawerId) {
        const tag = document.getElementById('mf-gav-tag')?.value?.trim();
        if (!tag) { window.app.toast('Informe a TAG da gaveta.', 'error'); return; }
        const tipo = document.getElementById('mf-gav-tipo')?.value || 'partida_direta';
        const modelo = document.getElementById('mf-gav-modelo')?.value?.trim() || '';
        const potencia_kw = parseFloat(document.getElementById('mf-gav-pot')?.value) || 0;
        const posicao = parseInt(document.getElementById('mf-gav-pos')?.value) || 0;

        const modal = document.getElementById('modal-manufatura-gaveta');
        if (modal) modal.remove();

        try {
            const now = new Date().toISOString();
            if (drawerId) {
                await api.update('manufaturaGavetas', drawerId, { tag, tipo, modelo, potencia_kw, posicao, updated_at: now });
                const g = this.gavetas.find(x => x.id === drawerId);
                if (g) { g.tag = tag; g.tipo = tipo; g.modelo = modelo; g.potencia_kw = potencia_kw; g.posicao = posicao; }
                window.app.toast('Gaveta atualizada!', 'success');
            } else {
                const payload = {
                    id: 'GAV-' + Date.now().toString(36).toUpperCase(),
                    coluna_id: colunaId,
                    tag, tipo, modelo, potencia_kw, posicao,
                    status: 'em_andamento',
                    etapa: 'montagem_mecanica',
                    componentes: '[]',
                    created_at: now,
                    updated_at: now
                };
                const result = await api.create('manufaturaGavetas', payload);
                this.gavetas.push(result.item || payload);
                window.app.toast('Gaveta adicionada!', 'success');
            }
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao salvar gaveta: ' + e.message, 'error');
        }
    },

    async deleteDrawer(id) {
        try {
            const comps = this.componentes.filter(c => c.gaveta_id === id);
            for (const c of comps) { await api.remove('manufaturaComponentes', c.id); this.componentes = this.componentes.filter(x => x.id !== c.id); }
            await api.remove('manufaturaGavetas', id);
            this.gavetas = this.gavetas.filter(g => g.id !== id);
            window.app.toast('Gaveta removida.', 'info');
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao remover: ' + e.message, 'error');
        }
    },

    showComponentModal(gavetaId) {
        const modal = document.createElement('div');
        modal.id = 'modal-manufatura-componente';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 520px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease;">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-cpu" style="color: #3b82f6;"></i> Adicionar Componente
                </h3>
                <div style="margin-bottom: 16px;">
                    <div style="position: relative;">
                        <i class="ph ph-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 12px;"></i>
                        <input id="mf-comp-search" type="text" class="form-control" placeholder="Buscar material no catálogo..." style="padding-left: 28px; font-size: 12px;" oninput="window.app.manufatura.searchMaterial(this.value)">
                    </div>
                    <div id="mf-comp-search-results" style="margin-top: 6px; max-height: 120px; overflow-y: auto; display: none;"></div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Tipo</label>
                            <select id="mf-comp-tipo" class="form-control" style="width: 100%;">
                                ${['Disjuntor', 'Contator', 'Relé Térmico', 'Relé Auxiliar', 'Soft-Starter', 'Inversor', 'Fonte', 'CLP', 'Bornes', 'Cabo', 'Fusível', 'Outro'].map(t =>
                                    `<option value="${t}">${t}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Quantidade</label>
                            <input id="mf-comp-qtd" type="number" class="form-control" value="1" min="1" style="width: 100%;">
                        </div>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Código do Componente</label>
                        <input id="mf-comp-codigo" class="form-control" placeholder="Ex: 3RT2017-1BB44" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Fabricante</label>
                        <input id="mf-comp-fab" class="form-control" placeholder="Ex: Siemens" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Observações</label>
                        <input id="mf-comp-obs" class="form-control" placeholder="Opcional" style="width: 100%;">
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showLaborModal('${gavetaId}')" style="margin-right: auto; color: #8b5cf6; border: 1px solid #8b5cf6;">
                        <i class="ph ph-clock"></i> Mão de Obra
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-manufatura-componente').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.saveComponent('${gavetaId}')">Adicionar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async saveComponent(gavetaId) {
        const tipo = document.getElementById('mf-comp-tipo')?.value || '';
        const codigo = document.getElementById('mf-comp-codigo')?.value?.trim() || '';
        const fabricante = document.getElementById('mf-comp-fab')?.value?.trim() || '';
        const quantidade = parseInt(document.getElementById('mf-comp-qtd')?.value) || 1;
        const observacoes = document.getElementById('mf-comp-obs')?.value?.trim() || '';

        if (!codigo) { window.app.toast('Informe o código do componente.', 'error'); return; }

        const modal = document.getElementById('modal-manufatura-componente');
        if (modal) modal.remove();

        try {
            const now = new Date().toISOString();
            const payload = {
                id: 'CMP-' + Date.now().toString(36).toUpperCase(),
                gaveta_id: gavetaId,
                tipo, codigo, fabricante, quantidade, observacoes,
                created_at: now,
                updated_at: now
            };
            const result = await api.create('manufaturaComponentes', payload);
            this.componentes.push(result.item || payload);
            window.app.toast('Componente adicionado!', 'success');
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao adicionar componente: ' + e.message, 'error');
        }
    },

    async removeComponent(id) {
        try {
            await api.remove('manufaturaComponentes', id);
            this.componentes = this.componentes.filter(c => c.id !== id);
            window.app.toast('Componente removido.', 'info');
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao remover: ' + e.message, 'error');
        }
    },

    filterKanban(colunaId, searchTerm) {
        this.kanbanFilterColuna = colunaId || '';
        this.kanbanSearchTerm = (searchTerm || '').toLowerCase();
        const container = document.getElementById('kanban-board-container');
        if (container) {
            const proj = this.projetos.find(p => p.id === this.activeProjectId);
            const projectColunas = this.colunas.filter(c => c.projeto_id === this.activeProjectId);
            container.innerHTML = this.renderKanbanBoard(proj, projectColunas);
            this.setupKanbanDragDrop();
        }
    },

    renderKanbanTab(proj, colunas) {
        const todasGavetas = this.gavetas.filter(g => colunas.some(c => c.id === g.coluna_id));
        if (todasGavetas.length === 0) {
            return `
                <div style="padding: 60px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                    <i class="ph ph-columns" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
                    <br>Nenhuma gaveta cadastrada para exibir no Kanban.
                    <br><small style="color: #cbd5e1;">Adicione gavetas nas colunas do projeto para visualizar o board de produção.</small>
                </div>
            `;
        }
        return `
            <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 12px; font-weight: 600; color: #475569;">Coluna:</label>
                    <select id="kanban-filter-coluna" class="form-control" style="width: auto; font-size: 12px; padding: 4px 8px; border-radius: 6px;" onchange="window.app.manufatura.filterKanban(this.value, document.getElementById('kanban-search')?.value)">
                        <option value="">Todas as Colunas</option>
                        ${colunas.map(c => `<option value="${c.id}" ${this.kanbanFilterColuna === c.id ? 'selected' : ''}>${c.tag}</option>`).join('')}
                    </select>
                </div>
                <div style="position: relative; flex: 1; max-width: 280px;">
                    <i class="ph ph-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 12px;"></i>
                    <input id="kanban-search" type="text" class="form-control" placeholder="Buscar gaveta..." style="padding-left: 28px; font-size: 12px;" value="${this.kanbanSearchTerm}" oninput="window.app.manufatura.filterKanban(document.getElementById('kanban-filter-coluna')?.value || '', this.value)">
                </div>
            </div>
            <div id="kanban-board-container">
                ${this.renderKanbanBoard(proj, colunas)}
            </div>
        `;
    },

    renderKanbanBoard(proj, colunas) {
        const etapas = ETAPA_OPTIONS;
        let todasGavetas = this.gavetas.filter(g => colunas.some(c => c.id === g.coluna_id));

        if (this.kanbanFilterColuna) {
            todasGavetas = todasGavetas.filter(g => g.coluna_id === this.kanbanFilterColuna);
        }
        if (this.kanbanSearchTerm) {
            todasGavetas = todasGavetas.filter(g =>
                (g.tag || '').toLowerCase().includes(this.kanbanSearchTerm) ||
                (g.modelo || '').toLowerCase().includes(this.kanbanSearchTerm)
            );
        }

        const cols = colunas.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

        return `
            <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; min-height: 400px; align-items: flex-start;">
                ${etapas.map(etapa => {
                    const gavetasNaEtapa = todasGavetas.filter(g => (g.etapa || 'inicio') === etapa.value);
                    return `
                        <div style="flex: 1; min-width: 220px; max-width: 280px; display: flex; flex-direction: column;">
                            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: white; border-radius: 10px 10px 0 0; border: 1px solid #e2e8f0; border-bottom: 2px solid ${this._getEtapaColor(etapa.value)};">
                                <i class="ph ${etapa.icon}" style="color: ${this._getEtapaColor(etapa.value)}; font-size: 16px;"></i>
                                <strong style="font-size: 13px; color: #1e293b; flex: 1;">${etapa.label}</strong>
                                <span style="background: ${this._getEtapaColor(etapa.value)}; color: white; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 8px;">${gavetasNaEtapa.length}</span>
                            </div>
                            <div class="kanban-dropzone" data-etapa="${etapa.value}" style="flex: 1; min-height: 120px; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; display: flex; flex-direction: column; gap: 6px;">
                                ${gavetasNaEtapa.length === 0 ? `
                                    <div style="padding: 16px; text-align: center; color: #cbd5e1; font-size: 11px; border: 1px dashed #e2e8f0; border-radius: 8px;">
                                        <i class="ph ph-arrow-circle-down" style="font-size: 20px; display: block; margin-bottom: 4px;"></i>
                                        Arraste gavetas aqui
                                    </div>
                                ` : gavetasNaEtapa.map(g => {
                                    const col = cols[g.coluna_id] || {};
                                    const gComp = this.componentes.filter(c => c.gaveta_id === g.id);
                                    const gBadge = STATUS_BADGE[g.status] || STATUS_BADGE['em_andamento'];
                                    return `
                                        <div class="kanban-card" data-id="${g.id}" draggable="false" style="padding: 10px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: grab; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 0.15s;"
                                             onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'">
                                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                                <strong style="font-size: 13px; color: #1e293b;">${g.tag || 'Sem TAG'}</strong>
                                                <span style="font-size: 10px; padding: 1px 6px; border-radius: 6px; background: ${gBadge.bg}; color: ${gBadge.color}; font-weight: 600;">${gBadge.label}</span>
                                            </div>
                                            <div style="font-size: 11px; color: #64748b; display: flex; flex-wrap: wrap; gap: 8px;">
                                                <span><i class="ph ph-grid-nine" style="font-size: 10px;"></i> ${col.tag || '-'}</span>
                                                ${g.modelo ? `<span><i class="ph ph-tag" style="font-size: 10px;"></i> ${g.modelo}</span>` : ''}
                                                ${g.potencia_kw ? `<span><i class="ph ph-lightning" style="font-size: 10px;"></i> ${g.potencia_kw}kW</span>` : ''}
                                            </div>
                                            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; gap: 12px;">
                                                <span>${gComp.length} componente(s)</span>
                                                <span style="text-transform: capitalize; color: ${this._getEtapaColor(etapa.value)};">${(g.tipo || '').replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    _getEtapaColor(etapa) {
        const colors = {
            'inicio': '#6b7280',
            'montagem_mecanica': '#3b82f6',
            'fiacao': '#f59e0b',
            'teste': '#8b5cf6',
            'liberado': '#10b981'
        };
        return colors[etapa] || '#6b7280';
    },

    setupKanbanDragDrop() {
        if (!window.Sortable) return;
        document.querySelectorAll('.kanban-dropzone').forEach(el => {
            if (el.__sortable) el.__sortable.destroy();
            el.__sortable = Sortable.create(el, {
                group: 'kanban',
                animation: 200,
                ghostClass: 'opacity-30',
                delay: 100,
                delayOnTouchOnly: true,
                onEnd: (evt) => {
                    const novaEtapa = evt.to.dataset.etapa;
                    const drawerId = evt.item.dataset.id;
                    if (!drawerId || !novaEtapa) return;
                    this.moveDrawerToEtapa(drawerId, novaEtapa);
                }
            });
        });
    },

    async moveDrawerToEtapa(drawerId, novaEtapa) {
        const gaveta = this.gavetas.find(g => g.id === drawerId);
        if (!gaveta) return;
        const etapaAntiga = gaveta.etapa || 'inicio';
        if (etapaAntiga === novaEtapa) {
            this.renderKanbanBoardOnIdle();
            return;
        }

        if (novaEtapa === 'liberado') {
            const testes = this.resultadosTeste.filter(r => r.gaveta_id === drawerId);
            const passou = testes.some(r => r.status === 'pass');
            if (!passou) {
                window.app.toast('Interlock: Gaveta não pode ser liberada sem teste aprovado!', 'error');
                this.renderKanbanBoardOnIdle();
                return;
            }
        }

        try {
            const now = new Date().toISOString();
            await api.update('manufaturaGavetas', drawerId, { etapa: novaEtapa, updated_at: now });

            const oldLabel = ETAPA_OPTIONS.find(e => e.value === etapaAntiga)?.label || etapaAntiga;
            const newLabel = ETAPA_OPTIONS.find(e => e.value === novaEtapa)?.label || novaEtapa;

            const histPayload = {
                id: 'HST-' + Date.now().toString(36).toUpperCase(),
                entidade_tipo: 'gaveta',
                entidade_id: drawerId,
                acao: `Gaveta ${gaveta.tag} movida de "${oldLabel}" para "${newLabel}"`,
                usuario: store.getState().auth.user?.name || 'Sistema',
                dados: JSON.stringify({ de: etapaAntiga, para: novaEtapa, tag: gaveta.tag }),
                created_at: now
            };
            try { await api.create('manufaturaHistorico', histPayload); } catch (e) {}

            gaveta.etapa = novaEtapa;
            if (novaEtapa === 'liberado') {
                const proj = this.projetos.find(p => p.id === this.activeProjectId);
                _notify('Gaveta Liberada', `✅ *${_safe(gaveta.tag)}* liberada\nProjeto: ${_safe(proj?.nome || '')}`);
            }
        } catch (e) {
            window.app.toast('Erro ao mover gaveta: ' + e.message, 'error');
        }
    },

    renderKanbanBoardOnIdle() {
        const container = document.getElementById('kanban-board-container');
        if (!container) return;
        const proj = this.projetos.find(p => p.id === this.activeProjectId);
        const projectColunas = this.colunas.filter(c => c.projeto_id === this.activeProjectId);
        container.innerHTML = this.renderKanbanBoard(proj, projectColunas);
        this.setupKanbanDragDrop();
    },

    showQRCode(entityType, entityId, name) {
        const qrContent = this._buildQRData(entityType, entityId);
        const label = entityType === 'projeto' ? 'Projeto' : entityType === 'coluna' ? 'Coluna' : 'Gaveta';

        const modal = document.createElement('div');
        modal.id = 'modal-qrcode';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 400px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease; text-align: center;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #1e293b;">
                    <i class="ph ph-qr-code" style="color: #3b82f6;"></i> QR Code - ${label}
                </h3>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 20px;">${_safe(name)}</div>
                <div id="qr-code-container" style="display: flex; justify-content: center; margin-bottom: 16px;">
                    <div id="qrcode-canvas"></div>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 16px; word-break: break-all; background: #f8fafc; padding: 8px; border-radius: 6px;">
                    ${_safe(qrContent)}
                </div>
                <div style="display: flex; justify-content: center; gap: 8px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-qrcode').remove()">Fechar</button>
                    <button class="btn btn-sm btn-primary" onclick="(function(){const c=document.getElementById('qrcode-canvas').querySelector('canvas');if(c){const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='qrcode-${_safe(entityId)}.png';a.click()}})()">
                        <i class="ph ph-download-simple"></i> Download
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        setTimeout(() => {
            const container = document.getElementById('qrcode-canvas');
            if (container && window.QRCode) {
                container.innerHTML = '';
                new QRCode(container, {
                    text: qrContent,
                    width: 200,
                    height: 200,
                    colorDark: '#1e293b',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }, 100);
    },

    _buildQRData(entityType, entityId) {
        const baseUrl = `http://${location.hostname}:8082`;
        const payload = {
            type: entityType,
            id: entityId,
            src: 'gerapro'
        };
        if (entityType === 'projeto') {
            const p = this.projetos.find(x => x.id === entityId);
            if (p) { payload.tag = p.nome; payload.cliente = p.cliente; }
        } else if (entityType === 'coluna') {
            const c = this.colunas.find(x => x.id === entityId);
            if (c) {
                payload.tag = c.tag;
                payload.projeto_id = c.projeto_id;
                const p = this.projetos.find(x => x.id === c.projeto_id);
                if (p) payload.projeto = p.nome;
            }
        } else if (entityType === 'gaveta') {
            const g = this.gavetas.find(x => x.id === entityId);
            if (g) {
                payload.tag = g.tag;
                payload.coluna_id = g.coluna_id;
                const c = this.colunas.find(x => x.id === g.coluna_id);
                if (c) { payload.coluna_tag = c.tag; payload.projeto_id = c.projeto_id; }
                const p = this.projetos.find(x => x.id === c?.projeto_id);
                if (p) payload.projeto = p.nome;
            }
        }
        return `${baseUrl}/api/manufatura/scan?d=${encodeURIComponent(JSON.stringify(payload))}`;
    },

    openQRScanner(mode) {
        if (this._scannerInstance) this.closeQRScanner();

        if (mode === 'associate') {
            this._associateStep = 'parent';
            this._associateParentType = null;
            this._associateParentId = null;
        }

        const modal = document.createElement('div');
        modal.id = 'modal-qr-scanner';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; width: 520px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease; overflow: hidden;">
                <div style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="margin: 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-camera" style="color: #3b82f6;"></i>
                        ${mode === 'associate' ? (this._associateStep === 'parent' ? 'Escaneie o QR Code do Item Pai' : 'Escaneie o QR Code do Item Filho') : 'Leitor de QR Code'}
                    </h3>
                    <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.closeQRScanner()"><i class="ph ph-x"></i></button>
                </div>
                <div style="padding: 20px;">
                    <div id="qr-reader" style="width: 100%; max-width: 400px; margin: 0 auto;"></div>
                    <div style="margin-top: 16px; text-align: center;">
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Ou digite o código manualmente:</div>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <input id="qr-manual-input" class="form-control" placeholder="Código QR..." style="width: 280px; font-size: 13px;" onkeydown="if(event.key==='Enter') window.app.manufatura.lookupQRData(this.value)">
                            <button class="btn btn-sm btn-primary" onclick="window.app.manufatura.lookupQRData(document.getElementById('qr-manual-input').value)">Buscar</button>
                        </div>
                        <div id="qr-scan-result" style="margin-top: 12px;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (window.Html5Qrcode) {
            try {
                const scanner = new Html5Qrcode('qr-reader');
                this._scannerInstance = scanner;
                scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        this._handleScanResult(decodedText, mode);
                    },
                    () => {}
                ).catch(err => {
                    console.warn('[QR] Camera error:', err);
                    document.getElementById('qr-reader').innerHTML = '<div style="padding: 40px; text-align: center; color: #94a3b8;">Câmera não disponível. Use a entrada manual abaixo.</div>';
                });
            } catch (e) {
                console.warn('[QR] Scanner init error:', e);
            }
        } else {
            document.getElementById('qr-reader').innerHTML = '<div style="padding: 40px; text-align: center; color: #94a3b8;">Biblioteca de scanner não carregada. Use a entrada manual abaixo.</div>';
        }
    },

    closeQRScanner() {
        if (this._scannerInstance) {
            try { this._scannerInstance.stop().catch(() => {}); } catch (e) {}
            this._scannerInstance = null;
        }
        this._associateStep = null;
        this._associateParentType = null;
        this._associateParentId = null;
        const modal = document.getElementById('modal-qr-scanner');
        if (modal) modal.remove();
    },

    _handleScanResult(data, mode) {
        const resultDiv = document.getElementById('qr-scan-result');
        if (!resultDiv) return;

        const entity = this.lookupQRData(data, true);
        if (!entity) {
            resultDiv.innerHTML = '<div style="color: #ef4444; font-size: 13px; padding: 8px;">QR Code inválido ou entidade não encontrada.</div>';
            return;
        }

        if (mode === 'associate') {
            this._processAssociationStep(entity);
        } else {
            resultDiv.innerHTML = this._renderEntityCard(entity);
        }
    },

    lookupQRData(data, silent) {
        if (!data) { if (!silent) window.app.toast('Informe um código QR.', 'error'); return null; }
        let payload;
        try { payload = JSON.parse(decodeURIComponent(data.split('?d=')[1] || data)); } catch (e) {
            try { payload = JSON.parse(data); } catch (e2) {
                if (!silent) window.app.toast('Formato de QR Code inválido.', 'error');
                return null;
            }
        }
        if (!payload || !payload.type || !payload.id) {
            if (!silent) window.app.toast('Dados do QR Code incompletos.', 'error');
            return null;
        }
        if (payload.type === 'projeto') {
            const p = this.projetos.find(x => x.id === payload.id);
            return p ? { type: 'projeto', data: p, label: p.nome, tag: p.nome } : null;
        }
        if (payload.type === 'coluna') {
            const c = this.colunas.find(x => x.id === payload.id);
            return c ? { type: 'coluna', data: c, label: c.tag, tag: c.tag, projeto_id: c.projeto_id } : null;
        }
        if (payload.type === 'gaveta') {
            const g = this.gavetas.find(x => x.id === payload.id);
            return g ? { type: 'gaveta', data: g, label: g.tag, tag: g.tag, coluna_id: g.coluna_id } : null;
        }
        if (!silent) window.app.toast('Tipo de entidade desconhecido.', 'error');
        return null;
    },

    _renderEntityCard(entity) {
        const badge = entity.type === 'projeto' ? STATUS_BADGE[entity.data.status] || STATUS_BADGE['em_andamento']
            : entity.type === 'coluna' ? STATUS_BADGE[entity.data.status] || STATUS_BADGE['em_andamento']
            : STATUS_BADGE[entity.data.status] || STATUS_BADGE['em_andamento'];
        const icon = entity.type === 'projeto' ? 'ph-wrench' : entity.type === 'coluna' ? 'ph-grid-nine' : 'ph-tray';
        const extra = entity.type === 'projeto' ? `Cliente: ${entity.data.cliente || '-'}`
            : entity.type === 'coluna' ? `Tipo: ${entity.data.tipo || '-'} | Projeto: ${(this.projetos.find(p => p.id === entity.data.projeto_id)?.nome || '-')}`
            : `Tipo: ${(entity.data.tipo || '').replace(/_/g, ' ')} | Coluna: ${(this.colunas.find(c => c.id === entity.data.coluna_id)?.tag || '-')}`;

        return `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <i class="ph ${icon}" style="color: #3b82f6; font-size: 18px;"></i>
                    <strong style="font-size: 14px; color: #1e293b;">${_safe(entity.label)}</strong>
                    <span style="font-size: 10px; padding: 2px 8px; border-radius: 8px; background: ${badge.bg}; color: ${badge.color}; font-weight: 600; text-transform: uppercase;">${badge.label}</span>
                </div>
                <div style="font-size: 12px; color: #64748b;">${extra}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">ID: ${entity.data.id}</div>
            </div>
        `;
    },

    startAssociation() {
        this._associateStep = 'parent';
        this._associateParentType = null;
        this._associateParentId = null;
        this.openQRScanner('associate');
    },

    _processAssociationStep(entity) {
        const resultDiv = document.getElementById('qr-scan-result');
        if (!resultDiv) return;

        if (this._associateStep === 'parent') {
            if (entity.type !== 'coluna') {
                resultDiv.innerHTML = '<div style="color: #ef4444; font-size: 13px; padding: 8px;">O primeiro item deve ser uma COLUNA. Escaneie o QR Code de uma coluna.</div>';
                return;
            }
            this._associateParentType = 'coluna';
            this._associateParentId = entity.data.id;
            this._associateStep = 'child';
            const header = document.querySelector('#modal-qr-scanner h3');
            if (header) header.innerHTML = '<i class="ph ph-camera" style="color: #3b82f6;"></i> Escaneie o QR Code da Gaveta (filho)';
            resultDiv.innerHTML = `
                <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 10px; font-size: 12px; color: #166534;">
                    <i class="ph ph-check-circle"></i> Coluna selecionada: <strong>${_safe(entity.label)}</strong>
                    <br>Agora escaneie o QR Code da gaveta ou digite o código manualmente.
                </div>
            `;
        } else if (this._associateStep === 'child') {
            if (entity.type !== 'gaveta') {
                resultDiv.innerHTML = '<div style="color: #ef4444; font-size: 13px; padding: 8px;">O segundo item deve ser uma GAVETA. Escaneie o QR Code de uma gaveta.</div>';
                return;
            }
            if (entity.data.coluna_id) {
                resultDiv.innerHTML = `<div style="color: #ef4444; font-size: 13px; padding: 8px;">Esta gaveta já está associada à coluna ${_safe(this.colunas.find(c => c.id === entity.data.coluna_id)?.tag || '')}.</div>`;
                return;
            }
            resultDiv.innerHTML = `
                <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 13px; color: #92400e;">
                    <strong>Confirmar Associação</strong>
                    <div style="margin-top: 8px;">
                        <div>Coluna: ${_safe(this.colunas.find(c => c.id === this._associateParentId)?.tag || '')}</div>
                        <div>Gaveta: ${_safe(entity.label)}</div>
                    </div>
                    <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="window.app.manufatura.confirmAssociation('${entity.data.id}')">
                        <i class="ph ph-check"></i> Confirmar Vinculação
                    </button>
                    <button class="btn btn-sm btn-ghost" style="margin-top: 10px; margin-left: 6px;" onclick="window.app.manufatura.closeQRScanner()">Cancelar</button>
                </div>
            `;
        }
    },

    async confirmAssociation(gavetaId) {
        const colunaId = this._associateParentId;
        if (!colunaId || !gavetaId) {
            window.app.toast('Dados de associação incompletos.', 'error');
            return;
        }

        try {
            const now = new Date().toISOString();
            await api.update('manufaturaGavetas', gavetaId, { coluna_id: colunaId, updated_at: now });

            const g = this.gavetas.find(x => x.id === gavetaId);
            if (g) {
                g.coluna_id = colunaId;
                g.etapa = 'montagem_mecanica';
                await api.update('manufaturaGavetas', gavetaId, { etapa: 'montagem_mecanica', updated_at: now });
            }

            const coluna = this.colunas.find(c => c.id === colunaId);
            const histPayload = {
                id: 'HST-' + Date.now().toString(36).toUpperCase(),
                entidade_tipo: 'gaveta',
                entidade_id: gavetaId,
                acao: `Gaveta ${g?.tag || ''} vinculada à coluna ${coluna?.tag || ''}`,
                usuario: store.getState().auth.user?.name || 'Sistema',
                dados: JSON.stringify({ coluna_id: colunaId, gaveta_id: gavetaId }),
                created_at: now
            };
            try { await api.create('manufaturaHistorico', histPayload); } catch (e) {}

            window.app.toast('Gaveta vinculada à coluna com sucesso!', 'success');
            _notify('Gaveta Vinculada', `🔗 *${_safe(g?.tag || '')}* → ${_safe(coluna?.tag || '')}\nColuna vinculada por QR Code`);
            this.closeQRScanner();
            if (this.viewMode === 'project') this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao vincular: ' + e.message, 'error');
        }
    },

    renderTestesTab(proj, colunas) {
        const todasGavetas = this.gavetas.filter(g => colunas.some(c => c.id === g.coluna_id));
        const cols = colunas.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
        const perfisPorTipo = this.perfisTeste.reduce((acc, p) => {
            if (!acc[p.tipo_gaveta]) acc[p.tipo_gaveta] = [];
            acc[p.tipo_gaveta].push(p);
            return acc;
        }, {});

        return `
            <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <h3 style="margin: 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                    <i class="ph ph-flask" style="color: #8b5cf6;"></i> Testes de Gavetas
                </h3>
                <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showTestProfileModal()" style="border: 1px solid #e2e8f0;">
                    <i class="ph ph-plus"></i> Novo Perfil de Teste
                </button>
            </div>
            ${this.perfisTeste.length > 0 ? `
            <div style="margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
                ${this.perfisTeste.map(p => `
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-test-tube" style="color: #8b5cf6;"></i>
                        <strong>${_safe(p.nome)}</strong>
                        <span style="color: #64748b;">${p.tipo_gaveta.replace(/_/g, ' ')}</span>
                        <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showTestProfileModal('${p.id}')" style="font-size: 10px;"><i class="ph ph-pencil"></i></button>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${todasGavetas.length === 0 ? `
                <div style="padding: 40px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                    <i class="ph ph-flask" style="font-size: 40px; opacity: 0.2; margin-bottom: 8px;"></i>
                    <br>Nenhuma gaveta para testar.
                </div>
                ` : todasGavetas.map(g => {
                    const col = cols[g.coluna_id] || {};
                    const gComp = this.componentes.filter(c => c.gaveta_id === g.id);
                    const testes = this.resultadosTeste.filter(r => r.gaveta_id === g.id);
                    const ultimoTeste = testes.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0];
                    const statusTeste = ultimoTeste?.status || 'pendente';
                    const testBadge = statusTeste === 'pass' ? { bg: '#dcfce7', color: '#166534', label: 'Aprovado' }
                        : statusTeste === 'fail' ? { bg: '#fee2e2', color: '#991b1b', label: 'Reprovado' }
                        : { bg: '#f1f5f9', color: '#64748b', label: 'Pendente' };
                    return `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <i class="ph ph-tray" style="font-size: 16px; color: #64748b;"></i>
                            <div style="flex: 1; min-width: 0;">
                                <strong style="font-size: 13px; color: #1e293b;">${_safe(g.tag)}</strong>
                                <span style="font-size: 11px; margin-left: 8px; color: #64748b;">${col.tag || '-'} | ${g.modelo || g.tipo || '-'}</span>
                                <span style="font-size: 11px; margin-left: 8px; color: #94a3b8;">${testes.length} teste(s)</span>
                            </div>
                            <span style="font-size: 11px; padding: 2px 8px; border-radius: 8px; background: ${testBadge.bg}; color: ${testBadge.color}; font-weight: 600;">${testBadge.label}</span>
                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showTestModal('${g.id}')" style="font-size: 11px; border: 1px solid #8b5cf6; color: #8b5cf6; padding: 2px 8px;">
                                <i class="ph ph-flask"></i> Testar
                            </button>
                            ${testes.length > 0 ? `
                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showCertificate('${g.id}')" style="font-size: 11px; color: #3b82f6;">
                                <i class="ph ph-certificate"></i>
                            </button>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    showTestModal(gavetaId) {
        const gaveta = this.gavetas.find(g => g.id === gavetaId);
        if (!gaveta) return;
        const perfis = this.perfisTeste.filter(p => p.tipo_gaveta === gaveta.tipo);
        const perfilOpts = perfis.length > 0 ? perfis : [{ id: '', nome: 'Nenhum perfil disponível (teste manual)' }];

        const modal = document.createElement('div');
        modal.id = 'modal-manufatura-teste';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 520px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-flask" style="color: #8b5cf6;"></i> Teste - ${_safe(gaveta.tag)}
                </h3>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
                    ${gaveta.modelo ? `Modelo: ${gaveta.modelo} | ` : ''}Tipo: ${(gaveta.tipo || '').replace(/_/g, ' ')} | Potência: ${gaveta.potencia_kw || 0}kW
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Perfil de Teste</label>
                        <select id="mf-teste-perfil" class="form-control" style="width: 100%;">
                            ${perfilOpts.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Resultado</label>
                        <select id="mf-teste-status" class="form-control" style="width: 100%;">
                            <option value="pass">Aprovado (PASS)</option>
                            <option value="fail">Reprovado (FAIL)</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Operador</label>
                        <input id="mf-teste-op" class="form-control" value="${store.getState().auth.user?.name || ''}" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Observações</label>
                        <textarea id="mf-teste-obs" class="form-control" rows="3" placeholder="Resultados, valores medidos, observações..." style="width: 100%; resize: vertical;"></textarea>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-manufatura-teste').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.submitTestResult('${gavetaId}')">Registrar Teste</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async submitTestResult(gavetaId) {
        const status = document.getElementById('mf-teste-status')?.value;
        const perfilId = document.getElementById('mf-teste-perfil')?.value || '';
        const operador = document.getElementById('mf-teste-op')?.value?.trim() || 'Sistema';
        const observacoes = document.getElementById('mf-teste-obs')?.value?.trim() || '';

        if (!status) { window.app.toast('Selecione o resultado do teste.', 'error'); return; }
        const modal = document.getElementById('modal-manufatura-teste');
        if (modal) modal.remove();

        try {
            const now = new Date().toISOString();
            const payload = {
                id: 'TST-' + Date.now().toString(36).toUpperCase(),
                gaveta_id: gavetaId,
                perfil_id: perfilId,
                status,
                resultados: JSON.stringify({ observacoes }),
                operador,
                data_teste: now,
                observacoes,
                created_at: now,
                updated_at: now
            };

            const result = await api.create('manufaturaResultadosTeste', payload);
            this.resultadosTeste.push(result.item || payload);

            const gaveta = this.gavetas.find(g => g.id === gavetaId);
            const label = status === 'pass' ? 'APROVADO' : 'REPROVADO';
            const histPayload = {
                id: 'HST-' + Date.now().toString(36).toUpperCase(),
                entidade_tipo: 'gaveta',
                entidade_id: gavetaId,
                acao: `Teste ${label}: ${gaveta?.tag || ''} — ${operador}`,
                usuario: operador,
                dados: JSON.stringify({ status, perfil_id: perfilId }),
                created_at: now
            };
            try { await api.create('manufaturaHistorico', histPayload); } catch (e) {}

            if (status === 'pass' && gaveta && gaveta.etapa === 'teste') {
                await api.update('manufaturaGavetas', gavetaId, { etapa: 'liberado', updated_at: now });
                gaveta.etapa = 'liberado';
            }

            window.app.toast(`Teste registrado como ${label}!`, status === 'pass' ? 'success' : 'error');
            const proj = this.projetos.find(p => p.id === this.activeProjectId);
            _notify(`Teste ${label}`, `🧪 *${_safe(gaveta?.tag || '')}* ${label}\nProjeto: ${_safe(proj?.nome || '')}\nOperador: ${operador}`);
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao registrar teste: ' + e.message, 'error');
        }
    },

    showTestProfileModal(profileId) {
        const isEdit = !!profileId;
        const p = isEdit ? this.perfisTeste.find(x => x.id === profileId) : null;

        const modal = document.createElement('div');
        modal.id = 'modal-manufatura-perfil-teste';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 500px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-test-tube" style="color: #8b5cf6;"></i> ${isEdit ? 'Editar' : 'Novo'} Perfil de Teste
                </h3>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Nome do Perfil</label>
                        <input id="mf-perfil-nome" class="form-control" value="${isEdit ? (p?.nome || '') : ''}" placeholder="Ex: Teste de Partida Direta" style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Tipo de Gaveta</label>
                        <select id="mf-perfil-tipo" class="form-control" style="width: 100%;">
                            ${['partida_direta', 'soft_starter', 'inversor', 'relé', 'CLP', 'instrumentação', 'reserva'].map(t =>
                                `<option value="${t}" ${isEdit && p?.tipo_gaveta === t ? 'selected' : ''}>${t.replace(/_/g, ' ').toUpperCase()}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Parâmetros de Teste (JSON)</label>
                        <textarea id="mf-perfil-params" class="form-control" rows="6" style="width: 100%; font-family: monospace; font-size: 11px; resize: vertical;">${isEdit ? (p?.parametros || '{}') : JSON.stringify({
                            tensao_nominal: '380V',
                            corrente_nominal: '0A',
                            resistencia_isolation: '>1MΩ',
                            rigidez_dielétrica: '2.5kV',
                            teste_comunicacao: true,
                            teste_funcional: true
                        }, null, 2)}</textarea>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-manufatura-perfil-teste').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.saveTestProfile('${profileId || ''}')">${isEdit ? 'Salvar' : 'Criar Perfil'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async saveTestProfile(profileId) {
        const nome = document.getElementById('mf-perfil-nome')?.value?.trim();
        if (!nome) { window.app.toast('Informe o nome do perfil.', 'error'); return; }
        const tipo_gaveta = document.getElementById('mf-perfil-tipo')?.value || '';
        const paramsRaw = document.getElementById('mf-perfil-params')?.value?.trim() || '{}';
        let parametros;
        try { parametros = JSON.parse(paramsRaw); } catch (e) { window.app.toast('Parâmetros JSON inválidos.', 'error'); return; }

        const modal = document.getElementById('modal-manufatura-perfil-teste');
        if (modal) modal.remove();

        try {
            const now = new Date().toISOString();
            if (profileId) {
                await api.update('manufaturaPerfisTeste', profileId, { nome, tipo_gaveta, parametros: JSON.stringify(parametros), updated_at: now });
                const p = this.perfisTeste.find(x => x.id === profileId);
                if (p) { p.nome = nome; p.tipo_gaveta = tipo_gaveta; p.parametros = JSON.stringify(parametros); }
                window.app.toast('Perfil atualizado!', 'success');
            } else {
                const payload = {
                    id: 'PERF-' + Date.now().toString(36).toUpperCase(),
                    nome, tipo_gaveta,
                    parametros: JSON.stringify(parametros),
                    created_at: now,
                    updated_at: now
                };
                const result = await api.create('manufaturaPerfisTeste', payload);
                this.perfisTeste.push(result.item || payload);
                window.app.toast('Perfil criado!', 'success');
            }
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao salvar perfil: ' + e.message, 'error');
        }
    },

    showCertificate(gavetaId) {
        const gaveta = this.gavetas.find(g => g.id === gavetaId);
        if (!gaveta) return;
        const coluna = this.colunas.find(c => c.id === gaveta.coluna_id);
        const projeto = this.projetos.find(p => p.id === coluna?.projeto_id);
        const testes = this.resultadosTeste.filter(r => r.gaveta_id === gavetaId)
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        const comps = this.componentes.filter(c => c.gaveta_id === gavetaId);

        const modal = document.createElement('div');
        modal.id = 'modal-certificado';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; width: 600px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
                <div style="padding: 24px 32px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-certificate" style="color: #10b981;"></i> Certidão Digital - ${_safe(gaveta.tag)}
                    </h3>
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-certificado').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div style="padding: 24px 32px;">
                    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
                        <i class="ph ph-check-circle" style="font-size: 32px; color: #16a34a;"></i>
                        <div style="font-size: 14px; font-weight: 700; color: #166534; margin-top: 4px;">CERTIFICADO DE CONFORMIDADE</div>
                        <div style="font-size: 11px; color: #15803d;">Testes realizados conforme procedimento interno</div>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <h4 style="font-size: 13px; color: #475569; margin: 0 0 8px 0;">Identificação</h4>
                        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                            <tr><td style="padding: 4px 8px; color: #64748b; width: 120px;">Gaveta:</td><td style="padding: 4px 8px; font-weight: 600;">${_safe(gaveta.tag)}</td></tr>
                            <tr><td style="padding: 4px 8px; color: #64748b;">Coluna:</td><td style="padding: 4px 8px;">${_safe(coluna?.tag || '-')} (${_safe(coluna?.tipo || '-')})</td></tr>
                            <tr><td style="padding: 4px 8px; color: #64748b;">Projeto:</td><td style="padding: 4px 8px;">${_safe(projeto?.nome || '-')}</td></tr>
                            <tr><td style="padding: 4px 8px; color: #64748b;">Tipo:</td><td style="padding: 4px 8px;">${(gaveta.tipo || '').replace(/_/g, ' ')}</td></tr>
                            <tr><td style="padding: 4px 8px; color: #64748b;">Modelo:</td><td style="padding: 4px 8px;">${gaveta.modelo || '-'}</td></tr>
                            <tr><td style="padding: 4px 8px; color: #64748b;">Potência:</td><td style="padding: 4px 8px;">${gaveta.potencia_kw ? gaveta.potencia_kw + ' kW' : '-'}</td></tr>
                        </table>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <h4 style="font-size: 13px; color: #475569; margin: 0 0 8px 0;">Componentes Instalados</h4>
                        ${comps.length === 0 ? '<div style="font-size: 12px; color: #94a3b8;">Nenhum componente registrado.</div>' : `
                        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                            <thead><tr style="background: #f8fafc;"><th style="padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Tipo</th><th style="padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Código</th><th style="padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Fabricante</th><th style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">Qtd</th></tr></thead>
                            <tbody>${comps.map(c => `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9;">${c.tipo || '-'}</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9;">${c.codigo || '-'}</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9;">${c.fabricante || '-'}</td><td style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #f1f5f9;">${c.quantidade || 1}</td></tr>`).join('')}</tbody>
                        </table>
                        `}
                    </div>

                    <div>
                        <h4 style="font-size: 13px; color: #475569; margin: 0 0 8px 0;">Histórico de Testes</h4>
                        ${testes.length === 0 ? '<div style="font-size: 12px; color: #94a3b8;">Nenhum teste registrado.</div>' : testes.map(t => {
                            const tBadge = t.status === 'pass' ? { bg: '#dcfce7', color: '#166534', label: 'Aprovado' } : { bg: '#fee2e2', color: '#991b1b', label: 'Reprovado' };
                            return `
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 6px;">
                                <i class="ph ${t.status === 'pass' ? 'ph-check-circle' : 'ph-x-circle'}" style="color: ${t.status === 'pass' ? '#16a34a' : '#dc2626'}; font-size: 16px;"></i>
                                <div style="flex: 1;">
                                    <div style="font-size: 12px; color: #1e293b;">${tBadge.label} — ${_safe(t.operador || 'Sistema')}</div>
                                    <div style="font-size: 11px; color: #94a3b8;">${t.data_teste ? new Date(t.data_teste).toLocaleString('pt-BR') : ''}</div>
                                </div>
                                ${t.observacoes ? `<div style="font-size: 11px; color: #64748b; max-width: 200px; text-align: right;">${_safe(t.observacoes)}</div>` : ''}
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div style="padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8;">
                    Documento gerado pelo GeraPro - Sistema de Rastreabilidade de Manufatura
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    renderDataBookTab(proj, colunas) {
        const todasGavetas = this.gavetas.filter(g => colunas.some(c => c.id === g.coluna_id));
        const gavetaIds = todasGavetas.map(g => g.id);
        const projectAnexos = this.anexos.filter(a => a.entidade_tipo === 'projeto' && a.entidade_id === proj.id);
        const totalTestes = this.resultadosTeste.filter(r => gavetaIds.includes(r.gaveta_id));
        const aprovados = totalTestes.filter(r => r.status === 'pass').length;

        return `
            <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                    <i class="ph ph-book-open" style="color: #3b82f6;"></i> Data Book — ${_safe(proj.nome)}
                </h3>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showUploadModal('projeto', '${proj.id}')" style="border: 1px solid #e2e8f0;">
                        <i class="ph ph-upload"></i> Anexar
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="window.app.manufatura.exportDataBook('${proj.id}')">
                        <i class="ph ph-download-simple"></i> Exportar Excel
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="window.open('/api/manufatura/certificate/projeto?id=${proj.id}','_blank')" style="border: 1px solid #e2e8f0;">
                        <i class="ph ph-globe"></i> Portal
                    </button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px;">
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${colunas.length}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Colunas</div>
                </div>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${todasGavetas.length}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Gavetas</div>
                </div>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #10b981;">${aprovados}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Testes Aprovados</div>
                </div>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${projectAnexos.length}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Documentos</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="card" style="padding: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">📄 Documentos Anexos</h4>
                    ${projectAnexos.length === 0 ? `
                    <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border: 1px dashed #e2e8f0; border-radius: 8px;">
                        Nenhum documento anexado. Clique em "Anexar" para adicionar.
                    </div>` : projectAnexos.map(a => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 6px;">
                        <i class="ph ph-file" style="color: #3b82f6; font-size: 16px;"></i>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 12px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${_safe(a.nome_arquivo)}</div>
                            <div style="font-size: 10px; color: #94a3b8;">${a.tamanho_bytes || 0}KB — ${a.usuario || ''}</div>
                        </div>
                        <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.downloadAnexo('${a.id}')" style="font-size: 10px;"><i class="ph ph-download-simple"></i></button>
                        <button class="btn btn-sm btn-ghost" onclick="if(confirm('Excluir ${_safe(a.nome_arquivo)}?')) window.app.manufatura.deleteAnexo('${a.id}')" style="font-size: 10px;"><i class="ph ph-trash" style="color: #ef4444;"></i></button>
                    </div>`).join('')}
                </div>

                <div class="card" style="padding: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">🔧 Substituição em Campo</h4>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
                        Registre a substituição de uma gaveta em campo. A gaveta original é arquivada e uma nova gaveta é vinculada à coluna.
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${todasGavetas.map(g => `
                        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
                            <i class="ph ph-tray" style="color: #64748b;"></i>
                            <span style="flex: 1;">${_safe(g.tag)} — ${g.modelo || (g.tipo || '').replace(/_/g, ' ') || '-'}</span>
                            <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.showReplaceDrawerModal('${g.id}')" style="font-size: 10px; color: #f59e0b; border: 1px solid #f59e0b; padding: 1px 6px;">
                                <i class="ph ph-arrows-clockwise"></i> Substituir
                            </button>
                        </div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    async exportDataBook(projectId) {
        try {
            const token = store.getState().auth.token;
            const res = await fetch(`/api/manufatura/export/databook?projetoId=${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro na exportação'); }
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `databook_${projectId}.xlsx`;
            a.click();
            URL.revokeObjectURL(a.href);
            window.app.toast('Data Book exportado com sucesso!', 'success');
        } catch (e) {
            window.app.toast('Erro ao exportar: ' + e.message, 'error');
        }
    },

    showUploadModal(entityType, entityId) {
        const modal = document.createElement('div');
        modal.id = 'modal-upload-anexo';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; width: 480px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-upload" style="color: #3b82f6;"></i> Anexar Documento
                </h3>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Arquivo</label>
                        <input id="mf-anexo-file" type="file" class="form-control" style="padding: 8px; font-size: 12px; width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Descrição</label>
                        <input id="mf-anexo-desc" class="form-control" placeholder="Ex: Esquema elétrico, Certificado, Foto..." style="width: 100%;">
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-upload-anexo').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.uploadAnexo('${entityType}', '${entityId}')">Upload</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async uploadAnexo(entityType, entityId) {
        const fileInput = document.getElementById('mf-anexo-file');
        const descricao = document.getElementById('mf-anexo-desc')?.value?.trim() || '';
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            window.app.toast('Selecione um arquivo.', 'error'); return;
        }
        const file = fileInput.files[0];

        const modal = document.getElementById('modal-upload-anexo');
        if (modal) modal.remove();

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result.split(',')[1];
                const payload = {
                    entidade_tipo: entityType,
                    entidade_id: entityId,
                    nome_arquivo: file.name,
                    tipo_arquivo: file.type,
                    fileData: base64,
                    descricao
                };
                const result = await api.create('manufaturaAnexos', payload);
                this.anexos.push(result.item || payload);
                window.app.toast(`Arquivo "${file.name}" anexado!`, 'success');
                this.renderProjectView();
            };
            reader.readAsDataURL(file);
        } catch (e) {
            window.app.toast('Erro ao anexar: ' + e.message, 'error');
        }
    },

    downloadAnexo(anexoId) {
        const token = store.getState().auth.token;
        const a = document.createElement('a');
        a.href = `/api/manufatura/anexo/download/${anexoId}`;
        a.setAttribute('download', '');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    async deleteAnexo(anexoId) {
        try {
            await api.remove('manufaturaAnexos', anexoId);
            this.anexos = this.anexos.filter(a => a.id !== anexoId);
            window.app.toast('Documento removido.', 'info');
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro ao remover: ' + e.message, 'error');
        }
    },

    showReplaceDrawerModal(gavetaId) {
        const gaveta = this.gavetas.find(g => g.id === gavetaId);
        if (!gaveta) return;
        const coluna = this.colunas.find(c => c.id === gaveta.coluna_id);
        const candidatas = this.gavetas.filter(g => g.id !== gavetaId && !g.coluna_id && g.status === 'em_andamento');

        const modal = document.createElement('div');
        modal.id = 'modal-replace-drawer';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 28px; width: 520px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-arrows-clockwise" style="color: #f59e0b;"></i> Substituir Gaveta em Campo
                </h3>
                <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400e; margin-bottom: 16px;">
                    <strong>Gaveta original:</strong> ${_safe(gaveta.tag)} (${_safe(coluna?.tag || '-')})
                    <br>Esta ação arquiva a gaveta atual e opcionalmente vincula uma gaveta substituta.
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Motivo da Substituição</label>
                        <select id="mf-replace-motivo" class="form-control" style="width: 100%;">
                            <option value="Falha em campo">Falha em campo</option>
                            <option value="Manutenção programada">Manutenção programada</option>
                            <option value="Atualização de configuração">Atualização de configuração</option>
                            <option value="Fim de vida útil">Fim de vida útil</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Gaveta Substituta (opcional)</label>
                        ${candidatas.length === 0 ? `
                        <div style="font-size: 12px; color: #94a3b8; padding: 8px; border: 1px dashed #e2e8f0; border-radius: 6px;">
                            Nenhuma gaveta disponível para substituição. Crie uma nova gaveta primeiro.
                        </div>
                        <input id="mf-replace-gaveta-id" type="hidden" value="">
                        ` : `
                        <select id="mf-replace-gaveta-id" class="form-control" style="width: 100%;">
                            <option value="">— Sem substituta —</option>
                            ${candidatas.map(g => `<option value="${g.id}">${g.tag} - ${g.modelo || g.tipo || ''}</option>`).join('')}
                        </select>
                        `}
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-replace-drawer').remove()">Cancelar</button>
                    <button class="btn btn-sm btn-primary" style="background: #f59e0b; border-color: #f59e0b;" onclick="window.app.manufatura.confirmReplaceDrawer('${gavetaId}')">
                        <i class="ph ph-arrows-clockwise"></i> Confirmar Substituição
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async confirmReplaceDrawer(gavetaId) {
        const motivo = document.getElementById('mf-replace-motivo')?.value || 'Não informado';
        const substitutaId = document.getElementById('mf-replace-gaveta-id')?.value || '';

        const modal = document.getElementById('modal-replace-drawer');
        if (modal) modal.remove();

        try {
            const token = store.getState().auth.token;
            const res = await fetch(`/api/manufatura/substituir-gaveta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ gaveta_id: gavetaId, motivo, gaveta_substituta_id: substitutaId })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Erro na substituição');

            const g = this.gavetas.find(x => x.id === gavetaId);
            if (g) { g.status = 'cancelado'; g.observacoes = `Substituída: ${motivo}`; }
            if (substitutaId) {
                const sub = this.gavetas.find(x => x.id === substitutaId);
                if (sub) { sub.coluna_id = g?.coluna_id; sub.etapa = 'inicio'; sub.status = 'em_andamento'; }
            }

            window.app.toast('Gaveta substituída com sucesso!', 'success');
            const orig = this.gavetas.find(x => x.id === gavetaId);
            _notify('Gaveta Substituída', `🔄 *${_safe(orig?.tag || '')}* substituída\nMotivo: ${motivo}`);
            this.renderProjectView();
        } catch (e) {
            window.app.toast('Erro na substituição: ' + e.message, 'error');
        }
    },

    showDashboard() {
        this.viewMode = 'dashboard';
        this.render();
    },

    renderDashboard() {
        const container = document.getElementById('view-manufatura');
        if (!container) return;

        const totalProjetos = this.projetos.length;
        const totalColunas = this.colunas.length;
        const totalGavetas = this.gavetas.length;
        const totalComponentes = this.componentes.length;
        const totalTestes = this.resultadosTeste.length;
        const aprovados = this.resultadosTeste.filter(r => r.status === 'pass').length;
        const reprovados = this.resultadosTeste.filter(r => r.status === 'fail').length;
        const concluidos = this.projetos.filter(p => p.status === 'concluido').length;
        const liberadas = this.gavetas.filter(g => g.etapa === 'liberado').length;

        const porEtapa = ETAPA_OPTIONS.map(e => ({
            label: e.label,
            value: this.gavetas.filter(g => (g.etapa || 'inicio') === e.value).length,
            icon: e.icon,
            color: this._getEtapaColor(e.value)
        }));

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative; overflow-y: auto;">
                <div class="module-header-sticky" style="color: white; padding: 16px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-chart-bar"></i> Dashboard de Manufatura
                        </h2>
                        <div style="font-size: 12px; opacity: 0.85; margin-top: 2px;">Indicadores de produção e performance</div>
                    </div>
                    <button class="btn btn-sm btn-ghost" onclick="window.app.manufatura.backToList()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
                        <i class="ph ph-arrow-left"></i> Projetos
                    </button>
                </div>

                <div style="padding: 24px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;">
                        <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                            <div style="font-size: 28px; font-weight: 800; color: #3b82f6;">${totalProjetos}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Projetos</div>
                            <div style="font-size: 10px; color: #94a3b8;">${concluidos} concluídos</div>
                        </div>
                        <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                            <div style="font-size: 28px; font-weight: 800; color: #8b5cf6;">${totalColunas}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Colunas</div>
                        </div>
                        <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                            <div style="font-size: 28px; font-weight: 800; color: #f59e0b;">${totalGavetas}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Gavetas</div>
                            <div style="font-size: 10px; color: #94a3b8;">${liberadas} liberadas</div>
                        </div>
                        <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                            <div style="font-size: 28px; font-weight: 800; color: #10b981;">${aprovados}/${totalTestes}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Testes Aprovados</div>
                            <div style="font-size: 10px; color: #94a3b8;">${reprovados} reprovados</div>
                        </div>
                        <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                            <div style="font-size: 28px; font-weight: 800; color: #06b6d4;">${totalComponentes}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Componentes</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="card" style="padding: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">📊 Gavetas por Etapa</h4>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${porEtapa.map(e => {
                                    const pct = totalGavetas > 0 ? (e.value / totalGavetas * 100) : 0;
                                    return `
                                    <div>
                                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                                            <span style="color: #475569;"><i class="ph ${e.icon}" style="color: ${e.color};"></i> ${e.label}</span>
                                            <span style="font-weight: 600;">${e.value}</span>
                                        </div>
                                        <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                                            <div style="height: 100%; width: ${pct}%; background: ${e.color}; border-radius: 3px; transition: width 0.3s;"></div>
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>

                        <div class="card" style="padding: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">🏭 Projetos Recentes</h4>
                            ${this.projetos.length === 0 ? '<div style="font-size: 12px; color: #94a3b8;">Nenhum projeto cadastrado.</div>' :
                            this.projetos.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5).map(p => {
                                const badge = STATUS_BADGE[p.status] || STATUS_BADGE['em_andamento'];
                                return `
                                <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; cursor: pointer;"
                                     onclick="window.app.manufatura.openProject('${p.id}')">
                                    <i class="ph ph-wrench" style="color: #3b82f6;"></i>
                                    <span style="flex: 1; color: #1e293b; font-weight: 500;">${_safe(p.nome || '')}</span>
                                    <span style="font-size: 10px; padding: 1px 6px; border-radius: 6px; background: ${badge.bg}; color: ${badge.color}; font-weight: 600;">${badge.label}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>

                    <div style="margin-top: 16px;">
                        <canvas id="manufatura-chart" style="max-height: 200px;"></canvas>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const canvas = document.getElementById('manufatura-chart');
            if (canvas && window.Chart) {
                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: porEtapa.map(e => e.label),
                        datasets: [{
                            label: 'Gavetas',
                            data: porEtapa.map(e => e.value),
                            backgroundColor: porEtapa.map(e => e.color),
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }
                });
            }
        }, 100);
    },

    searchMaterial(q) {
        const container = document.getElementById('mf-comp-search-results');
        if (!container) return;
        if (!q || q.length < 2) { container.style.display = 'none'; return; }

        const qLower = q.toLowerCase();
        const materiais = (store.getState().materiais || []).filter(m =>
            (m.codigoInterno || '').toLowerCase().includes(qLower) ||
            (m.codigoFabricante || '').toLowerCase().includes(qLower) ||
            (m.descricao || '').toLowerCase().includes(qLower) ||
            (m.fabricante || '').toLowerCase().includes(qLower)
        ).slice(0, 8);

        if (materiais.length === 0) {
            container.style.display = 'block';
            container.innerHTML = '<div style="padding: 8px; font-size: 11px; color: #94a3b8; text-align: center;">Nenhum material encontrado.</div>';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = materiais.map(m => `
            <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 11px;"
                 onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background=''"
                 onclick="window.app.manufatura.selectMaterialForComponent('${m.id}')">
                <i class="ph ph-cpu" style="color: #3b82f6; font-size: 12px;"></i>
                <span style="font-weight: 600; color: #1e293b;">${_safe(m.codigoInterno || m.codigoFabricante || '')}</span>
                <span style="color: #64748b;">${_safe(m.fabricante || '')}</span>
                <span style="color: #94a3b8; font-size: 10px; flex: 1; text-align: right;">${_safe((m.descricao || '').substring(0, 40))}</span>
            </div>
        `).join('');
    },

    selectMaterialForComponent(materialId) {
        const materiais = store.getState().materiais || [];
        const m = materiais.find(x => x.id === materialId);
        if (!m) return;

        const codigoInput = document.getElementById('mf-comp-codigo');
        const fabInput = document.getElementById('mf-comp-fab');
        const tipoSelect = document.getElementById('mf-comp-tipo');
        const results = document.getElementById('mf-comp-search-results');

        if (codigoInput) codigoInput.value = m.codigoInterno || m.codigoFabricante || '';
        if (fabInput) fabInput.value = m.fabricante || '';
        if (tipoSelect && m.categoria) {
            for (const opt of tipoSelect.options) {
                if (opt.value.toLowerCase() === m.categoria.toLowerCase()) {
                    opt.selected = true;
                    break;
                }
            }
        }
        if (results) results.style.display = 'none';
        window.app.toast(`Material "${m.codigoInterno || m.codigoFabricante || ''}" selecionado!`, 'success');
    },

    showLaborModal(gavetaId) {
        const gaveta = this.gavetas.find(g => g.id === gavetaId);
        if (!gaveta) return;

        const modal = document.createElement('div');
        modal.id = 'modal-manufatura-labor';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 28px; width: 440px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-clock" style="color: #8b5cf6;"></i> Apontamento de Mão de Obra
                </h3>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
                    Gaveta: <strong>${_safe(gaveta.tag)}</strong> — ${gaveta.modelo || (gaveta.tipo || '').replace(/_/g, ' ') || ''}
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Atividade</label>
                        <input id="mf-labor-atividade" class="form-control" placeholder="Ex: Montagem mecânica, Fiação, Teste..." style="width: 100%;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Horas</label>
                            <input id="mf-labor-horas" type="number" step="0.5" class="form-control" value="1.0" min="0.5" style="width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Funcionário</label>
                            <input id="mf-labor-func" class="form-control" value="${store.getState().auth.user?.name || ''}" style="width: 100%;">
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#modal-manufatura-labor').remove()">Cancelar</button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.manufatura.saveLaborRecord('${gavetaId}')">Registrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async saveLaborRecord(gavetaId) {
        const atividade = document.getElementById('mf-labor-atividade')?.value?.trim();
        if (!atividade) { window.app.toast('Informe a atividade.', 'error'); return; }
        const horas = parseFloat(document.getElementById('mf-labor-horas')?.value) || 1;
        const funcionario = document.getElementById('mf-labor-func')?.value?.trim() || 'Sistema';

        const modal = document.getElementById('modal-manufatura-labor');
        if (modal) modal.remove();

        try {
            const now = new Date().toISOString();
            const gaveta = this.gavetas.find(g => g.id === gavetaId);
            const histPayload = {
                id: 'HST-' + Date.now().toString(36).toUpperCase(),
                entidade_tipo: 'gaveta',
                entidade_id: gavetaId,
                acao: `Mão de obra: ${atividade} — ${horas}h — ${funcionario}`,
                usuario: funcionario,
                dados: JSON.stringify({ atividade, horas, funcionario, gaveta_tag: gaveta?.tag }),
                created_at: now
            };
            await api.create('manufaturaHistorico', histPayload);
            window.app.toast(`${horas}h registrada(s) para "${atividade}"!`, 'success');
        } catch (e) {
            window.app.toast('Erro ao registrar: ' + e.message, 'error');
        }
    }
};

window.manufaturaModule = ManufaturaModule;
ManufaturaModule.init();
