import { store } from './state.js';

/**
 * Main Application Controller
 */

const App = {
    _isRegisterMode: false,

    init() {
        console.log("GeraPro Initializing...");

        this.cacheDOM();
        this.bindEvents();

        // Expose methods to global app object for HTML access
        window.app.saveSettings = this.saveSettings.bind(this);
        window.app.restoreBackup = this.restoreBackup.bind(this);
        window.app.backup = this.backup.bind(this);
        window.app.toggleTheme = () => this.setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        window.app.toast = this.showToast.bind(this);
        window.app.confirm = this.confirm.bind(this);
        window.app.navigateTo = this.navigateTo.bind(this);
        window.app.openPtcModal = this.openPtcModal.bind(this);
        window.app.savePtc = this.savePtc.bind(this);
        window.app.openSearchPtcModal = this.openSearchPtcModal.bind(this);
        window.app.loadPtcRevisions = this.loadPtcRevisions.bind(this);
        window.app.loadProposalVersion = this.loadProposalVersion.bind(this);
        window.app.updateActivePtcBadge = this.updateActivePtcBadge.bind(this);
        window.app.filterPtcList = this.filterPtcList.bind(this);
        window.app.closeSearchPtcModal = this.closeSearchPtcModal.bind(this);
        window.app.populatePtcContactFields = this.populatePtcContactFields.bind(this);
        window.app.onPtcContactChange = this.onPtcContactChange.bind(this);
        window.app.formatCurrency = this.formatCurrency.bind(this);
        window.app.formatCurrencyRaw = this.formatCurrencyRaw.bind(this);
        window.app.formatProposalCode = this.formatProposalCode.bind(this);
        window.app.parseCurrency = this.parseCurrency.bind(this);
        window.app.duplicateProposal = this.duplicateProposal.bind(this);
        window.app.createPtcSimple = this.createPtcSimple.bind(this);
        window.app.handleLogin = this.handleLogin.bind(this);
        window.app.handleLogout = this.handleLogout.bind(this);
        window.app.toggleRegisterMode = this.toggleRegisterMode.bind(this);
        window.app.openUserManager = this.openUserManager.bind(this);
        window.app._ensurePipelineItemForPtc = this._ensurePipelineItemForPtc.bind(this);
        window.app.iniciarPropostaComercial = this.iniciarPropostaComercial.bind(this);
        window.app.cleanupLeads = this.cleanupLeads.bind(this);
        window.app.applySalesFilter = this.applySalesFilter.bind(this);
        window.app.refreshDashboard = this.refreshDashboard.bind(this);
        window.app.saveAiSettings = this.saveAiSettings.bind(this);
        window.app.onAiProviderChange = this.onAiProviderChange.bind(this);
        window.app.toggleAiKeyVisibility = this.toggleAiKeyVisibility.bind(this);
        window.app.testAiConnection = this.testAiConnection.bind(this);
        window.app.loadAiSettingsForm = this.loadAiSettingsForm.bind(this);
        window.app.applyLoginTheme = this.applyLoginTheme.bind(this);
        window.app.saveLoginTheme = this.saveLoginTheme.bind(this);
        window.app.loadLoginThemeForm = this.loadLoginThemeForm.bind(this);
        window.app.onLoginBgTypeChange = this.onLoginBgTypeChange.bind(this);
        window.app.previewLoginLogo = this.previewLoginLogo.bind(this);
        window.app.clearLoginLogo = this.clearLoginLogo.bind(this);
        window.app.previewLoginBgImage = this.previewLoginBgImage.bind(this);
        window.app.clearLoginBgImage = this.clearLoginBgImage.bind(this);
        window.app.resetLoginTheme = this.resetLoginTheme.bind(this);
        window.app.getVendedorNameByUserEmail = this.getVendedorNameByUserEmail.bind(this);
        window.app.addEmpresa = this.addEmpresa.bind(this);
        window.app.uploadTemplate = this.uploadTemplate.bind(this);
        window.app.deleteSelectedTemplate = this.deleteSelectedTemplate.bind(this);

        this.render(); // Initial render based on state

        // Auth flow
        this._initAuth();
    },

    async _ensureDataLoaded() {
        const loaded = await store._loadFromServer();
        if (loaded) return true;
        const legacyData = localStorage.getItem('gerapro_db_v1');
        if (!legacyData) return false;
        try {
            const res = await fetch(`${store._getServerUrl()}/api/data/sync/migrate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${store.getState().auth.token}`, 'Content-Type': 'application/json' },
                body: legacyData
            });
            const result = await res.json();
            if (result.success) {
                localStorage.removeItem('gerapro_db_v1');
                return await store._loadFromServer();
            }
        } catch (e) {
            console.warn('[App] Migration error:', e);
        }
        return false;
    },

    async _initAuth() {
        const loginView = document.getElementById('view-login');
        const appContainer = document.querySelector('.app-container');

        const token = store.getState().auth.token;
        let isAuthenticated = false;

        if (token) {
            isAuthenticated = await store.checkAuth();
        }

        if (isAuthenticated) {
            loginView.classList.add('hidden-module');
            appContainer.classList.remove('hidden-module');
            await this._ensureDataLoaded();
            this.updateUserBadge();
            this.updatePipelineBadge();
            this.updateSyncIndicator();
            this.syncProposals();
            const savedPtc = store.getState().currentPtc;
            if (savedPtc) {
                console.log("[App] Restoring PTC context:", savedPtc.folder);
                window.app.currentPtc = savedPtc;
                this.updateActivePtcBadge();
            }
        } else {
            loginView.classList.remove('hidden-module');
            appContainer.classList.add('hidden-module');
            try {
                const saved = localStorage.getItem('gerapro_login_theme');
                if (saved) store.setState({ loginTheme: { ...store.getState().loginTheme, ...JSON.parse(saved) } });
            } catch (e) {}
            this.applyLoginTheme();
        }
    },

    updateSyncIndicator() {
        const dot = document.getElementById('sync-dot');
        const text = document.getElementById('sync-text');
        if (!dot || !text) return;
        const online = store.sync.online;
        dot.style.background = online ? '#22c55e' : '#ef4444';
        text.textContent = online ? 'Online' : 'Offline';
    },

    cacheDOM() {
        this.dom = {
            navItems: document.querySelectorAll('.nav-item'),
            views: document.querySelectorAll('.module-view'),
            pageTitle: document.getElementById('page-title'),
            toggleSidebar: document.getElementById('toggle-sidebar'),
            sidebar: document.querySelector('.app-sidebar'),
            toggleTheme: document.getElementById('toggle-theme'),
            themeIcon: document.getElementById('theme-icon')
        };
    },

    bindEvents() {
        // Navigation
        // Navigation - Event Delegation
        const navContainer = document.getElementById('main-nav');
        if (navContainer) {
            navContainer.addEventListener('click', (e) => {
                const link = e.target.closest('.nav-item');
                if (!link) return;

                e.preventDefault();
                const targetView = link.dataset.target;
                if (targetView) {
                    this.navigateTo(targetView);
                }
            });
        }

        // Sidebar Toggle
        this.dom.toggleSidebar.addEventListener('click', () => {
            // Simple toggle for now, could be persisted in state
            this.dom.sidebar.classList.toggle('collapsed'); // CSS needs to handle this if we want it
        });

        // Theme Toggle
        this.dom.toggleTheme.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });

        // Close user dropdown on outside click
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('user-dropdown');
            const btn = document.getElementById('btn-user-menu');
            if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden-module');
            }
        });

        // Login form Enter key
        const loginForm = document.getElementById('form-login');
        if (loginForm) {
            loginForm.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        }

        // State subscription
        store.subscribe((state) => {
            this.updateActivePtcBadge();
            this.updateSyncIndicator();
            if (state.ui.currentView === 'dashboard' || !state.ui.currentView) {
                this.renderDashboard(state);
            }
        });

        // Initial Dashboard Render
        this.renderDashboard(store.getState());

        // Init Theme
        const storedTheme = store.getState().settings?.theme || 'light';
        this.setTheme(storedTheme);
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.dom.themeIcon.classList = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';

        // Update state logic if needed (debounce ideally)
        store.setState({ settings: { ...store.getState().settings, theme } });

        // Update charts if they exist (to fix colors)
        if (this.salesChart || this.statusChart || this.pipelineChart) {
            this.renderCharts(store.getState());
        }
    },

    renderDashboard(state) {
        // Safe check for elements
        const els = {
            propostasCount: document.querySelector('#view-dashboard .card:nth-child(1) div:nth-child(2)'),
            valorTotal: document.querySelector('#view-dashboard .card:nth-child(2) div:nth-child(2)'),
            projetosCount: document.querySelector('#view-dashboard .card:nth-child(3) div:nth-child(2)'),
            recentActivity: document.getElementById('dash-atividades-container')
        };

        if (!els.propostasCount) return;

        // Filter data for vendedor users
        const userLevel = store.getUserLevel();
        if (userLevel === 'vendedor') {
            const vendedorName = this.getVendedorNameByUserEmail();
            if (vendedorName) {
                const vendedorNomeLower = vendedorName.toLowerCase().trim();
                const vendedorPipeItems = (state.pipelineItems || []).filter(pi =>
                    (pi.vendedor || '').toLowerCase().trim() === vendedorNomeLower
                );
                const linkedOrcIds = new Set(
                    vendedorPipeItems
                        .filter(pi => pi.origem === 'orcamento')
                        .map(pi => String(pi.origemId))
                );
                state = {
                    ...state,
                    pipelineItems: vendedorPipeItems,
                    orcamentos: (state.orcamentos || []).filter(orc =>
                        linkedOrcIds.has(String(orc.id))
                    )
                };
            } else {
                state = { ...state, pipelineItems: [], orcamentos: [] };
            }
        }

        // Calc Logic
        const propostas = state.orcamentos || [];
        const openProposals = propostas.filter(p => p.status !== 'Perdido');
        const totalValue = openProposals.reduce((acc, p) => acc + (p.total || 0), 0);

        // Update DOM
        els.propostasCount.textContent = openProposals.length;
        els.valorTotal.textContent = `R$ ${(totalValue / 1000).toFixed(1)}k`;
        els.projetosCount.textContent = propostas.filter(p => p.status === 'Aprovado' || p.status === 'Pedido').length;

        // Recent Activity — merge orcamentos + pipelineItems
        const orcamentos = state.orcamentos || [];
        const pipelineItems = state.pipelineItems || [];
        const recentActivity = [];

        orcamentos.forEach(o => {
            recentActivity.push({
                numero: o.numero || `ORC-${o.id}`,
                cliente: o.clienteName || '—',
                status: o.status || 'Em Elaboração',
                createdAt: o.createdAt
            });
        });

        const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };

        pipelineItems.forEach(pi => {
            const tipoAbr = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' }[pi.tipo] || '';
            const base = pi.origemId ? (window.app.formatProposalCode?.(pi.origemId) || pi.origemId) : pi.id;
            const revStr = pi.revisao != null ? `_Rev${String(pi.revisao).padStart(2, '0')}` : '';
            recentActivity.push({
                numero: `${base}${tipoAbr ? `_${tipoAbr}` : ''}${revStr}`,
                cliente: pi.cliente || '—',
                status: stageLabels[pi.status] || pi.status,
                createdAt: pi.createdAt,
                tipo: pi.tipo,
                valor: pi.valor || 0,
                consolidada: pi.consolidada
            });
        });

        recentActivity.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        const recent = recentActivity.slice(0, 5);

        const container = els.recentActivity;
        if (container) {
            // Remove old content (keep h3)
            container.querySelectorAll('.recent-items-wrapper, div[style*="display: flex"], .no-recent-items').forEach(el => el.remove());
            const STATUS_COLORS = {
                'Aguardando Início': { bg: 'rgb(99, 102, 241)', text: '#fff' },
                'Em Elaboração': { bg: 'rgb(245, 158, 11)', text: '#fff' },
                'Proposta Enviada': { bg: 'rgb(148, 163, 184)', text: '#fff' },
                'Negociação': { bg: 'rgb(250, 204, 21)', text: '#1e293b' },
                'Fechado': { bg: 'rgb(34, 197, 94)', text: '#fff' },
                'Perdido': { bg: 'rgb(239, 68, 68)', text: '#fff' }
            };
            const wrapper = document.createElement('div');
            wrapper.className = 'recent-items-wrapper';
            if (recent.length > 0) {
                wrapper.innerHTML = recent.map(p => {
                    const statusBase = p.status === 'Negociação' && p.consolidada ? 'Negociação' : p.status;
                    const cor = STATUS_COLORS[statusBase] || { bg: '#3b82f6', text: '#fff' };
                    const label = p.status === 'Negociação' && p.consolidada ? 'Negociação (CONSOLIDADA)' : p.status;
                    return `
                    <div style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                        <div>
                            <div style="font-weight: 600; color: var(--color-primary);">${p.numero}</div>
                            <div class="text-xs text-muted">${p.cliente}</div>
                            <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                                <span style="background:${cor.bg};color:${cor.text};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${label}</span>
                                <span class="text-xs text-muted">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</span>
                            </div>
                            ${p.tipo === 'comercial' ? `<div class="text-xs text-muted" style="margin-top: 2px;">R$ ${(p.valor || 0).toLocaleString()}</div>` : ''}
                        </div>
                    </div>`;
                }).join('');
                container.style.padding = '0';
            } else {
                wrapper.className = 'no-recent-items';
                wrapper.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; width: 100%; min-height:60px;"><span class="text-muted">Nenhuma atividade recente registrada.</span></div>`;
                container.style.padding = '20px';
            }
            container.appendChild(wrapper);
        }
        this.renderCharts(state);
        const ativos = (state.pipelineItems || []).filter(i => i.status !== 'perdido');
        const totalValor = ativos.reduce((s, i) => s + (i.valor || 0), 0);
        const countEl = document.getElementById('dash-pipeline-count');
        const valorEl = document.getElementById('dash-pipeline-valor');
        if (countEl) countEl.textContent = `${ativos.length} oportunidades ativas`;
        if (valorEl) valorEl.textContent = `R$ ${(totalValor / 1000).toFixed(1)}k`;
    },

    async refreshDashboard() {
        const ok = await store.refresh();
        if (ok) this.showToast('Dashboard atualizado com sucesso!', 'success');
        else this.showToast('Erro ao atualizar dados do servidor.', 'error');
    },

    updatePipelineBadge() {
        const state = store.getState();
        const badge = document.getElementById('pipeline-badge');
        if (!badge) return;
        const today = new Date().toISOString().slice(0, 10);
        let count = 0;
        (state.pipelineItems || []).forEach(i => {
            if (i.proximoFollowup && i.proximoFollowup.slice(0, 10) <= today) count++;
        });
        badge.style.display = count > 0 ? '' : 'none';
        badge.textContent = count > 0 ? count : '';
    },

    _ensurePipelineItemForPtc(ptcFolder, clientName, projectTitle, valor = 0, vendedor = '', tipoProposta = 'tecnica_comercial') {
        if (!ptcFolder) return;
        store.setState({ proposalReadOnly: false });
        const state = store.getState();
        const items = [...(state.pipelineItems || [])];

        // Check if any items already exist for this PTC folder
        const existingItems = items.filter(i =>
            i.origemId && ptcFolder &&
            i.origemId.trim().toLowerCase() === ptcFolder.trim().toLowerCase()
        );

        console.log('[Pipeline] existingItems for', ptcFolder, ':', existingItems.map(i => ({ status: i.status, origemId: i.origemId, tipo: i.tipo })));

        // Se algum cartão existente estiver fechado/perdido, bloquear reabertura
        if (existingItems.some(i => i.status === 'fechado' || i.status === 'perdido')) {
            store.setState({ proposalReadOnly: true });
            const blockedItem = existingItems.find(i => i.status === 'fechado' || i.status === 'perdido');
            const statusPt = blockedItem.status === 'fechado' ? 'Fechada' : 'Perdida';
            const ident = clientName || ptcFolder;
            window.app.toast(
                `Esta Proposta ${ident} foi ${statusPt}. Portanto, seu conteúdo NÃO pode ser alterado, apenas visualizado. Caso necessário, faça uma cópia para edição.`,
                'warning'
            );
            return false;
        }

        if (existingItems.length > 0) {
            // Update existing items (preserve their tipo/revisao/consolidada)
            for (const exists of existingItems) {
                const idx = items.indexOf(exists);
                const updated = {
                    ...exists,
                    cliente: clientName || exists.cliente,
                    projeto: projectTitle || exists.projeto,
                    valor: valor || exists.valor,
                    origem: valor > 0 ? 'proposta_comercial' : exists.origem,
                    vendedor: vendedor || exists.vendedor || '',
                    updatedAt: new Date().toISOString()
                };
                items[idx] = updated;
                store._syncUpdate('pipelineItems', exists.id, {
                    cliente: updated.cliente,
                    projeto: updated.projeto,
                    valor: updated.valor,
                    origem: updated.origem,
                    vendedor: updated.vendedor,
                    updatedAt: updated.updatedAt
                });
            }
            store.setState({ pipelineItems: items });
            return true;
        }

        // Create new items based on tipoProposta
        const tipos = tipoProposta === 'separado' ? ['tecnica', 'comercial'] : ['tecnica_comercial'];
        for (const tipo of tipos) {
            const newItem = {
                id: crypto.randomUUID(),
                empresa_id: 'default',
                cliente: clientName || '',
                projeto: projectTitle || '',
                valor: valor || 0,
                status: 'prospect',
                origem: valor > 0 ? 'proposta_comercial' : 'ptc',
                origemId: ptcFolder,
                tipo: tipo,
                revisao: 0,
                consolidada: 0,
                observacoes: '',
                ultimoContato: null,
                proximoFollowup: null,
                interacoes: [],
                vendedor: vendedor || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            items.push(newItem);
            const syncItem = { ...newItem, interacoes: JSON.stringify([]) };
            store._syncCreate('pipelineItems', syncItem);
        }
        store.setState({ pipelineItems: items });
        return true;
    },

    iniciarPropostaComercial(ptcFolder, clientName, projectTitle, vendedor = '', itemOriginalId = null) {
        if (!ptcFolder) return;
        const state = store.getState();
        const items = [...(state.pipelineItems || [])];
        const exists = items.find(i =>
            i.origemId && i.origemId.trim().toLowerCase() === ptcFolder.trim().toLowerCase() &&
            i.tipo === 'comercial'
        );
        if (exists) {
            this.showToast('Proposta Comercial já existe para esta PTC.', 'info');
            return;
        }

        const newItem = {
            id: crypto.randomUUID(),
            empresa_id: 'default',
            cliente: clientName || '',
            projeto: projectTitle || '',
            valor: 0,
            status: 'prospect',
            origem: 'ptc',
            origemId: ptcFolder,
            tipo: 'comercial',
            revisao: 0,
            consolidada: 0,
            observacoes: '',
            ultimoContato: null,
            proximoFollowup: null,
            interacoes: [],
            vendedor: vendedor || '',
            engenheiro_responsavel: '',
            data_entrega: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        items.push(newItem);
        store.setState({ pipelineItems: items });
        const syncItem = { ...newItem, interacoes: JSON.stringify([]) };
        store._syncCreate('pipelineItems', syncItem);
        if (itemOriginalId) {
            const orig = items.find(i => String(i.id) === String(itemOriginalId));
            if (orig && orig.tipo === 'tecnica_comercial') {
                orig.tipo = 'tecnica';
                store.setState({ pipelineItems: items });
                store._syncUpdate('pipelineItems', itemOriginalId, { tipo: 'tecnica' });
            }
        }
        this.showToast('Proposta Comercial iniciada!', 'success');
        if (window.app.pipelineComercial) window.app.pipelineComercial.renderKanban();
    },

    cleanupLeads() {
        const state = store.getState();
        const leads = state.pipelineItems.filter(i => i.origem === 'lead');
        if (leads.length === 0) { this.showToast('Nenhum lead manual encontrado.', 'info'); return; }
        leads.forEach(item => store._syncDelete('pipelineItems', item.id));
        store.setState({ pipelineItems: state.pipelineItems.filter(i => i.origem !== 'lead') });
        this.showToast(`${leads.length} lead(s) manual(is) removido(s) do pipeline.`, 'success');
        if (window.app.pipelineComercial?.renderKanban) window.app.pipelineComercial.renderKanban();
    },

    applySalesFilter() {
        this.renderCharts(store.getState());
    },

    renderCharts(state) {
        if (!window.Chart) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';

        const ctxSales = document.getElementById('chart-sales');
        const ctxStatus = document.getElementById('chart-status');

        if (!ctxSales || !ctxStatus) return;

        // Destroy prev instances if needed
        [ctxSales, ctxStatus].forEach(canvas => {
            const chart = Chart.getChart(canvas);
            if (chart) chart.destroy();
        });

        if (this.pipelineChart) this.pipelineChart.destroy();

        // 1. Sales Chart — pipeline + orçamentos (3 linhas + filtro)
        const startInput = document.getElementById('filter-sales-start');
        const endInput = document.getElementById('filter-sales-end');
        const nowDate = new Date();
        const defaultStart = new Date(nowDate.getFullYear(), nowDate.getMonth() - 5, 1);
        const defaultEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);

        if (startInput && !startInput.value) {
            const y = defaultStart.getFullYear();
            const m = String(defaultStart.getMonth() + 1).padStart(2, '0');
            startInput.value = `${y}-${m}`;
        }
        if (endInput && !endInput.value) {
            const y = defaultEnd.getFullYear();
            const m = String(defaultEnd.getMonth() + 1).padStart(2, '0');
            endInput.value = `${y}-${m}`;
        }

        const filterStart = startInput && startInput.value
            ? new Date(parseInt(startInput.value.slice(0, 4)), parseInt(startInput.value.slice(5, 7)) - 1, 1)
            : defaultStart;
        const filterEnd = endInput && endInput.value
            ? new Date(parseInt(endInput.value.slice(0, 4)), parseInt(endInput.value.slice(5, 7)) - 1, 1)
            : defaultEnd;

        const _now = new Date();
        const _currentMonthStart = new Date(_now.getFullYear(), _now.getMonth(), 1);
        if (filterEnd > _currentMonthStart) {
            filterEnd.setTime(_currentMonthStart.getTime());
        }

        const months = [];
        const cursor = new Date(filterStart);
        while (cursor <= filterEnd) {
            months.push({
                label: cursor.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
                year: cursor.getFullYear(),
                month: cursor.getMonth()
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }

        const mergedSales = new Map();
        const seenPtc = new Set();
        (state.pipelineItems || []).forEach(pi => {
            // dedup PTC items pelo origemId
            if (pi.origem === 'ptc' || pi.origem === 'proposta_comercial') {
                const ptcKey = (pi.origemId || '').trim().toLowerCase();
                if (ptcKey && seenPtc.has(ptcKey)) return;
                if (ptcKey) seenPtc.add(ptcKey);
            }
            const key = pi.origem === 'orcamento' ? `orc:${pi.origemId}` : `pi:${pi.id}`;
            if (!mergedSales.has(key)) {
                mergedSales.set(key, {
                    createdAt: pi.createdAt,
                    fechado: pi.status === 'fechado',
                    perdido: pi.status === 'perdido'
                });
            }
        });
        (state.orcamentos || []).forEach(orc => {
            const key = `orc:${orc.id}`;
            if (!mergedSales.has(key)) {
                mergedSales.set(key, {
                    createdAt: orc.createdAt,
                    fechado: orc.status === 'Aprovado',
                    perdido: orc.status === 'Perdido'
                });
            }
        });

        const allSalesItems = [...mergedSales.values()];

        const byMonth = months.map(m => {
            const filtered = allSalesItems.filter(p => {
                const c = new Date(p.createdAt);
                if (isNaN(c.getTime())) return false;
                return c.getFullYear() === m.year && c.getMonth() === m.month;
            });
            return {
                abertas: filtered.length,
                fechadas: filtered.filter(p => p.fechado).length,
                perdidas: filtered.filter(p => p.perdido).length
            };
        });

        this.salesChart = new Chart(ctxSales, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [{
                    label: 'Total',
                    data: byMonth.map(m => m.abertas),
                    borderColor: '#0284c7',
                    backgroundColor: 'rgba(2, 132, 199, 0.08)',
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Fechadas',
                    data: byMonth.map(m => m.fechadas),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Perdidas',
                    data: byMonth.map(m => m.perdidas),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderWidth: 1.5,
                    borderDash: [5, 3],
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: textColor } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor, stepSize: 1 },
                        grid: { color: gridColor }
                    },
                    x: { grid: { display: false }, ticks: { color: textColor } }
                }
            }
        });

        // 2. Status Chart — mesmo pipeline do Kanban
        const stageOrderStatus = ['prospect', 'elaboracao', 'enviado', 'negociacao', 'fechado', 'perdido'];
        const stageLabelsStatus = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
        const stageColorsStatus = ['#6366f1', '#f59e0b', '#94a3b8', '#facc15', '#22c55e', '#ef4444'];

        const pipelineStatus = [...(state.pipelineItems || [])];
        (state.orcamentos || []).forEach(orc => {
            const sMap = { 'Em Elaboração': 'elaboracao', 'Enviado': 'enviado', 'Aprovado': 'fechado', 'Perdido': 'perdido' };
            const ms = sMap[orc.status] || 'prospect';
            if (!pipelineStatus.find(i => i.origem === 'orcamento' && String(i.origemId) === String(orc.id))) {
                pipelineStatus.push({ status: ms });
            }
        });

        const statusCounts = stageOrderStatus.map(id => pipelineStatus.filter(i => i.status === id).length);

        this.statusChart = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: stageOrderStatus.map(id => stageLabelsStatus[id]),
                datasets: [{
                    data: statusCounts,
                    backgroundColor: stageColorsStatus,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: textColor }
                    }
                }
            }
        });

        // 3. Pipeline Funnel Chart
        const pipelineCanvas = document.getElementById('chart-pipeline-funnel');
        if (pipelineCanvas) {
            const stageOrder = ['prospect', 'elaboracao', 'enviado', 'negociacao', 'fechado', 'perdido'];
            const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
            const stageColors = ['#6366f1', '#f59e0b', '#94a3b8', '#facc15', '#22c55e', '#ef4444'];

            const pipelineItens = [...(state.pipelineItems || [])];
            (state.orcamentos || []).forEach(orc => {
                const sMap = { 'Em Elaboração': 'elaboracao', 'Enviado': 'enviado', 'Aprovado': 'fechado', 'Perdido': 'perdido' };
                const ms = sMap[orc.status] || 'prospect';
                if (!pipelineItens.find(i => i.origem === 'orcamento' && String(i.origemId) === String(orc.id))) {
                    pipelineItens.push({ status: ms, valor: orc.total || 0, origem: 'orcamento', origemId: orc.id });
                }
            });

            const counts = stageOrder.map(id => pipelineItens.filter(i => i.status === id).length);
            const labels = stageOrder.map(id => stageLabels[id]);

            this.pipelineChart = new Chart(pipelineCanvas, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: stageColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    const stageId = stageOrder[ctx.dataIndex];
                                    const total = pipelineItens.filter(i => i.status === stageId).reduce((s, i) => s + (i.valor || 0), 0);
                                    return `${ctx.parsed} itens · R$ ${total.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    },

    navigateTo(viewName) {
        console.log(`Navigating to: ${viewName}`);

        store.setState({ ui: { ...store.getState().ui, currentView: viewName } });

        // Permission check for admin-only views
        const adminViews = ['configuracoes'];
        const userLevel = store.getUserLevel();
                if (adminViews.includes(viewName) && userLevel !== 'admin' && userLevel !== 'engenheiro') {
            this.showToast('Acesso restrito a administradores.', 'error');
            return;
        }

        // Permission check for vendedor level
        if (userLevel === 'vendedor') {
            const allowedViews = ['dashboard', 'crm', 'pipeline-comercial', 'relatorio-propostas'];
            if (!allowedViews.includes(viewName)) {
                this.showToast('Acesso restrito ao seu perfil de usuário.', 'error');
                return;
            }
        }

        // 1. Update Active Nav
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.target === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 2. toggle Views
        const targetId = `view-${viewName}`;
        this.dom.views.forEach(view => {
            if (view.id === targetId) {
                view.classList.remove('hidden-module');
                view.classList.remove('fade-in');
                void view.offsetWidth; // Trigger reflow
                view.classList.add('fade-in');
            } else {
                view.classList.add('hidden-module');
                view.classList.remove('fade-in');
            }
        });

        // Fail-safe: if the view wasn't in the cached list (e.g. dynamic add), find it manually
        const directView = document.getElementById(targetId);
        if (directView && directView.classList.contains('hidden-module')) {
            directView.classList.remove('hidden-module');
            directView.classList.add('fade-in');
        }

        // Re-cache DOM views because if we cloned (optional above), references break. 
        // For now, let's stick to simple class toggle which works for display:none -> block transition animations.
        this.dom.views = document.querySelectorAll('.module-view');

        // 3. Update Title
        const titleMap = {
            'dashboard': 'Dashboard',
            'clientes': 'Gestão de Clientes',
            'fornecedores': 'Gestão de Fornecedores',
            'materiais': 'Catálogo de Materiais',
            'mao-de-obra': 'Consolidado de Mão de Obra',
            'despesas': 'Gestão de Despesas de Projeto',
            'orcamentos': 'Propostas & Orçamentos',
            'paineis': 'Cadastros de Painéis',
            'tipicos': 'Engenharia de Típicos',
            'cubiculos': 'Engenharia de Cubículos',
            'cargas': 'Lista de Cargas',
            'lm': 'Lista de Materiais (LM)',
            'importacao': 'Importação de Dados',
            'configuracoes': 'Configurações do Sistema',
            'precificacao': 'Precificação e Rentabilidade',
            'calculos-eletricos': 'Cálculos Elétricos',
            'calculos-mecanicos': 'Cálculos Mecânicos',
            'proposta-tecnica': 'Proposta Técnica',
            'proposta-comercial': 'Proposta Comercial',
            'proposta-completa': 'Proposta Completa',
            'pipeline-comercial': 'Gestão de Propostas',
            'relatorio-propostas': 'Relatório de Propostas',
            'relatorio-cadastros': 'Relatório de Cadastros',
            'relatorio-tipicos': 'Relatório de Típicos',
            'relatorio-manufatura': 'Relatório de Manufatura',
            'composicoes': 'Composições de Mão de Obra',
            'regras-derivacao': 'Regras de Derivação',
            'crm': 'CRM — Gestão de Leads',
            'manufatura': 'Gestão de Manufatura'
        };
        this.dom.pageTitle.textContent = 'GeraPro_1.0';

        // 4. Trigger specific module loads if necessary
        // Reset viewMode for modules that support it
        const modulesToReset = ['clientes', 'fornecedores', 'materiais', 'composicoes', 'regras-derivacao', 'mao-de-obra', 'despesas', 'paineis', 'tipicos', 'cubiculos'];
        modulesToReset.forEach(m => {
            const moduleName = m.replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // camelCase
            const module = window.app[moduleName] || window[`${moduleName}Module`];
            if (module && typeof module.resetView === 'function') {
                module.resetView();
            }
        });

        if (viewName === 'clientes' && window.clientesModule) {
            window.clientesModule.render();
        }
        if (viewName === 'fornecedores' && window.fornecedoresModule) {
            window.fornecedoresModule.render();
        }
        if (viewName === 'materiais' && window.materiaisModule) {
            window.materiaisModule.render();
        }
        if (viewName === 'regras-derivacao' && window.regrasDerivacaoModule) {
            window.regrasDerivacaoModule.render();
        }
        if (viewName === 'composicoes' && window.composicoesModule) {
            window.composicoesModule.render();
        }
        if (viewName === 'mao-de-obra' && window.maoDeObraModule) {
            window.maoDeObraModule.render();
        }
        if (viewName === 'despesas' && window.despesasModule) {
            window.despesasModule.render();
        }
        if (viewName === 'lm' && window.lmModule) {
            window.lmModule.render();
        }
        if (viewName === 'cargas' && window.cargasModule) {
            window.cargasModule.render();
        }
        if (viewName === 'proposta-tecnica' && window.propostaTecnicaModule) {
            window.propostaTecnicaModule.render();
        }
        if (viewName === 'proposta-comercial' && window.propostaComercialModule) {
            window.propostaComercialModule.render();
        }
        if (viewName === 'proposta-completa' && window.propostaCompletaModule) {
            window.propostaCompletaModule.render();
        }
        if (viewName === 'pipeline-comercial' && window.pipelineComercialModule) {
            window.pipelineComercialModule.render();
        }
        if (viewName === 'crm' && window.crm) {
            if (window.crm._notifyOverdue) window.crm._notifyOverdue(true);
        }
        if (viewName === 'paineis' && window.paineisModule) {
            window.paineisModule.render();
        }
        if (viewName === 'tipicos' && window.app.tipicos) {
            window.app.tipicos.render();
        }
        if (viewName === 'cubiculos' && window.app.cubiculos) {
            window.app.cubiculos.render();
        }
        if (viewName === 'precificacao' && window.app.precificacao) {
            window.app.precificacao.calculate();
            this.loadPrecificacaoData(); // Try to load saved data if exists
        }
        if (viewName === 'calculos-eletricos' && window.app.calculosEletricos) {
            window.app.calculosEletricos.render();
        }
        if (viewName === 'calculos-mecanicos' && window.app.calculosMecanicos) {
            window.app.calculosMecanicos.render();
        }
        if (viewName === 'configuracoes') {
            store.fetchAiSettings().then(() => this.loadSettingsForm());
        }
        if (viewName === 'relatorio-propostas' && window.relatorioPropostasModule) {
            window.relatorioPropostasModule.render();
        }
        if (viewName === 'relatorio-cadastros' && window.relatorioCadastrosModule) {
            window.relatorioCadastrosModule.render();
        }
        if (viewName === 'relatorio-tipicos' && window.relatorioTipicosModule) {
            window.relatorioTipicosModule.render();
        }
        if (viewName === 'relatorio-manufatura' && window.relatorioManufaturaModule) {
            window.relatorioManufaturaModule.render();
        }
        if (viewName === 'manufatura' && window.app.manufatura) {
            window.app.manufatura.render();
        }

        // DVT visibility / theme
        const company = store.getState().company || {};
        const isDVT = company.folderName?.startsWith('DVT_');
        document.querySelectorAll('.dvt-only').forEach(el => {
            el.style.display = isDVT ? '' : 'none';
        });
        this.applyCompanyTheme();

        this.updatePipelineBadge();
    },

    applyCompanyTheme() {
        const comp = store.getState().company || {};
        const dvt = comp.folderName?.startsWith('DVT_');
        const root = document.documentElement;
        root.style.setProperty('--color-accent', dvt ? 'rgb(67, 101, 17)' : 'rgb(3, 92, 169)');
        root.style.setProperty('--color-accent-hover', dvt ? 'rgb(82, 124, 21)' : 'rgb(56, 86, 14)');
    },

    // === Auth Methods ===

    async handleLogin() {
        const btn = document.getElementById('btn-login-submit');
        const errorEl = document.getElementById('login-error');
        if (!btn || !errorEl) return;

        btn.disabled = true;
        btn.innerHTML = '<span class="login-spinner"></span> Entrando...';
        errorEl.textContent = '';

        try {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                errorEl.textContent = 'Preencha email e senha.';
                btn.disabled = false;
                btn.textContent = 'Entrar';
                return;
            }

            if (this._isRegisterMode) {
                const name = document.getElementById('login-name').value.trim();
                if (!name) {
                    errorEl.textContent = 'Preencha seu nome.';
                    btn.disabled = false;
                    btn.textContent = 'Criar Conta';
                    return;
                }
                await store.register(email, password, name);
            } else {
                await store.login(email, password);
            }

            // Success
            await this._ensureDataLoaded();
            this.updateSyncIndicator();
            document.getElementById('view-login').classList.add('hidden-module');
            document.querySelector('.app-container').classList.remove('hidden-module');
            this.updateUserBadge();
            this.syncProposals();
        } catch (err) {
            errorEl.textContent = err.message || 'Erro ao conectar ao servidor.';
        } finally {
            btn.disabled = false;
            btn.textContent = this._isRegisterMode ? 'Criar Conta' : 'Entrar';
        }
    },

    handleLogout() {
        store.logout();
        document.getElementById('view-login').classList.remove('hidden-module');
        document.querySelector('.app-container').classList.add('hidden-module');
        document.getElementById('login-error').textContent = '';
        document.getElementById('form-login').reset();
        this.applyLoginTheme();
        this._filterSidebarForVendedor();
    },

    async toggleRegisterMode() {
        this._isRegisterMode = !this._isRegisterMode;
        const btn = document.getElementById('btn-login-submit');
        const link = document.getElementById('login-register-link');
        const nameGroup = document.getElementById('login-name-group');
        const errorEl = document.getElementById('login-error');

        if (this._isRegisterMode) {
            // Check if registration is allowed (no users yet)
            try {
                const res = await fetch(`${store._getServerUrl()}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'check', password: 'check' })
                });
                if (res.status !== 401) {
                    // If we get something other than 401, server might have users
                    // We try a more direct approach - try to register and see
                }
            } catch (e) {
                // Server offline
            }

            nameGroup.style.display = 'block';
            btn.textContent = 'Criar Conta';
            link.textContent = 'Já tem conta? Fazer login';
            errorEl.textContent = '';
        } else {
            nameGroup.style.display = 'none';
            btn.textContent = 'Entrar';
            link.textContent = 'Primeiro acesso? Criar conta master';
            errorEl.textContent = '';
        }
    },

    updateUserBadge() {
        const user = store.getState().auth.user;
        if (!user) return;

        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const levelBadge = document.getElementById('user-level-badge');
        if (nameEl) nameEl.textContent = user.name || 'Usuário';
        if (avatarEl) {
            const initials = (user.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
            avatarEl.textContent = initials;
        }
        if (levelBadge) {
            const levelNames = { admin: 'Admin', engenheiro: 'Engenheiro', visualizador: 'Visualizador', vendedor: 'Vendedor' };
            levelBadge.textContent = levelNames[user.nivel] || user.nivel;
        }

        const company = store.getState().company || {};
        const badge = document.getElementById('company-badge');
        const badgeText = document.getElementById('company-badge-text');
        if (badge && badgeText) {
            let label = company.name || company.nome || '';
            label = label.split(' ')[0] || company.sigla || '';
            badgeText.textContent = label;
            badge.style.display = label ? 'flex' : 'none';
            badge.style.background = company.companyColor || '#0055AA';
        }

        this.applyCompanyTheme();
        this._filterSidebarForVendedor();
    },

    _filterSidebarForVendedor() {
        const userLevel = store.getUserLevel();
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        if (userLevel === 'vendedor') {
            const allowed = ['dashboard', 'pipeline-comercial', 'relatorio-propostas'];
            for (const child of nav.children) {
                if (child.tagName === 'A' && child.classList.contains('nav-item')) {
                    const target = child.dataset.target;
                    child.style.display = allowed.includes(target) ? '' : 'none';
                } else {
                    child.style.display = 'none';
                }
            }
            // Hide PTC header buttons
            const btnBuscar = document.getElementById('btn-buscar-ptc');
            const btnIniciar = document.getElementById('btn-iniciar-ptc');
            if (btnBuscar) btnBuscar.style.display = 'none';
            if (btnIniciar) btnIniciar.style.display = 'none';
        } else {
            for (const child of nav.children) {
                child.style.display = '';
            }
            // Restore PTC header buttons
            const btnBuscar = document.getElementById('btn-buscar-ptc');
            const btnIniciar = document.getElementById('btn-iniciar-ptc');
            if (btnBuscar) btnBuscar.style.display = '';
            if (btnIniciar) btnIniciar.style.display = '';
        }
    },

    getVendedorNameByUserEmail() {
        const user = store.getState().auth.user;
        if (!user || user.nivel !== 'vendedor') return null;
        const vendedores = store.getState().vendedores || [];
        const match = vendedores.find(v => v.email?.toLowerCase() === user.email?.toLowerCase());
        return match ? match.nome : null;
    },

    async openUserManager() {
        // Close dropdown
        document.getElementById('user-dropdown')?.classList.add('hidden-module');

        if (store.getUserLevel() !== 'admin') {
            this.showToast('Acesso restrito.', 'error');
            return;
        }

        let users = [];
        let empresas = [];
        try {
            users = await store.fetchUsers();
            empresas = await store.fetchEmpresas();
        } catch (err) {
            this.showToast('Erro ao carregar dados: ' + err.message, 'error');
            return;
        }

        const modalId = 'modal-user-manager';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const levelNames = { admin: 'Admin', engenheiro: 'Engenheiro', vendedor: 'Vendedor', visualizador: 'Visualizador' };
        const levelBadge = (nivel) =>
            `<span class="user-level-badge ${nivel}">${levelNames[nivel] || nivel}</span>`;
        const empresaMap = {};
        empresas.forEach(e => empresaMap[e.id] = e.nome);

        const html = `
            <div id="${modalId}" class="modal-overlay" style="z-index: 10000;">
                <div class="modal" style="width: 750px; max-width: 95vw;">
                    <div class="modal-header">
                        <h3 class="card-title"><i class="ph ph-shield-check"></i> Gerenciar Usuários</h3>
                        <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <table class="user-manager-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Empresa</th>
                                    <th>Nível</th>
                                    <th>Status</th>
                                    <th style="width:80px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr>
                                        <td><strong>${u.name}</strong></td>
                                        <td style="color:#64748b;">${u.email}</td>
                                        <td style="color:#64748b;font-size:12px;">${empresaMap[u.empresa_id] || u.empresa_id || '—'}</td>
                                        <td>${levelBadge(u.nivel)}</td>
                                        <td>${u.ativo ? '<span style="color:#16a34a;">Ativo</span>' : '<span style="color:#94a3b8;">Inativo</span>'}</td>
                                        <td>
                                            <button class="btn btn-sm btn-ghost" onclick="app.editUser('${u.id}')" title="Editar" style="padding:2px 6px;">
                                                <i class="ph ph-pencil-simple"></i>
                                            </button>
                                            ${u.ativo ? `<button class="btn btn-sm btn-ghost" onclick="app.deleteUser('${u.id}')" title="Desativar" style="padding:2px 6px;color:#dc2626;">
                                                <i class="ph ph-trash"></i>
                                            </button>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="margin-top:16px;">
                            <button class="btn btn-primary" onclick="app.addUser()"><i class="ph ph-user-plus"></i> Novo Usuário</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        // Expose helper methods
        window.app.editUser = (userId) => this._editUserModal(userId, users, empresas);
        window.app.deleteUser = (userId) => this._deleteUser(userId);
        window.app.addUser = () => this._addUserModal(empresas);
    },

    async _editUserModal(userId, users, empresas) {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('modal-user-manager').remove();

        const empOptions = (empresas || []).map(e =>
            `<option value="${e.id}" ${user.empresa_id === e.id ? 'selected' : ''}>${e.nome}</option>`
        ).join('');

        const modalId = 'modal-user-edit';
        const html = `
            <div id="${modalId}" class="modal-overlay" style="z-index: 10001;">
                <div class="modal" style="width: 420px;">
                    <div class="modal-header">
                        <h3 class="card-title">Editar Usuário</h3>
                        <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <form onsubmit="return false;">
                            <div class="form-group">
                                <label class="form-label">Nome</label>
                                <input type="text" id="edit-user-name" class="form-control" value="${user.name}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="edit-user-email" class="form-control" value="${user.email}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nova senha (deixe em branco para manter)</label>
                                <input type="password" id="edit-user-password" class="form-control" placeholder="••••••••">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Empresa</label>
                                <select id="edit-user-empresa" class="form-control">
                                    ${empOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nível de Acesso</label>
                                <select id="edit-user-nivel" class="form-control">
                                    <option value="admin" ${user.nivel === 'admin' ? 'selected' : ''}>Admin</option>
                                    <option value="engenheiro" ${user.nivel === 'engenheiro' ? 'selected' : ''}>Engenheiro</option>
                                    <option value="vendedor" ${user.nivel === 'vendedor' ? 'selected' : ''}>Vendedor</option>
                                    <option value="visualizador" ${user.nivel === 'visualizador' ? 'selected' : ''}>Visualizador</option>
                                </select>
                            </div>
                        </form>
                        <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px;">
                            <button class="btn btn-cancel" onclick="document.getElementById('${modalId}').remove();app.openUserManager()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.saveUserEdit('${userId}')">Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        window.app.saveUserEdit = async (id) => {
            const updates = {
                name: document.getElementById('edit-user-name').value.trim(),
                email: document.getElementById('edit-user-email').value.trim(),
                nivel: document.getElementById('edit-user-nivel').value,
                empresa_id: document.getElementById('edit-user-empresa').value
            };
            const password = document.getElementById('edit-user-password').value;
            if (password) updates.password = password;

            try {
                await store.updateUser(id, updates);
                this.showToast('Usuário atualizado!', 'success');
                document.getElementById('modal-user-edit').remove();
                this.openUserManager();
            } catch (err) {
                this.showToast('Erro: ' + err.message, 'error');
            }
        };
    },

    async _addUserModal(empresas) {
        document.getElementById('modal-user-manager').remove();

        const empOptions = (empresas || []).map(e =>
            `<option value="${e.id}">${e.nome}</option>`
        ).join('');

        const modalId = 'modal-user-add';
        const html = `
            <div id="${modalId}" class="modal-overlay" style="z-index: 10001;">
                <div class="modal" style="width: 420px;">
                    <div class="modal-header">
                        <h3 class="card-title">Novo Usuário</h3>
                        <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <form onsubmit="return false;">
                            <div class="form-group">
                                <label class="form-label">Nome</label>
                                <input type="text" id="add-user-name" class="form-control" placeholder="Nome completo">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="add-user-email" class="form-control" placeholder="email@exemplo.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Senha</label>
                                <input type="password" id="add-user-password" class="form-control" placeholder="••••••••">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Empresa</label>
                                <select id="add-user-empresa" class="form-control">
                                    ${empOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nível de Acesso</label>
                                <select id="add-user-nivel" class="form-control">
                                    <option value="engenheiro" selected>Engenheiro</option>
                                    <option value="admin">Admin</option>
                                    <option value="vendedor">Vendedor</option>
                                    <option value="visualizador">Visualizador</option>
                                </select>
                            </div>
                        </form>
                        <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px;">
                            <button class="btn btn-cancel" onclick="document.getElementById('${modalId}').remove();app.openUserManager()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.saveNewUser()">Criar Usuário</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        window.app.saveNewUser = async () => {
            const name = document.getElementById('add-user-name').value.trim();
            const email = document.getElementById('add-user-email').value.trim();
            const password = document.getElementById('add-user-password').value;
            const nivel = document.getElementById('add-user-nivel').value;
            const empresa_id = document.getElementById('add-user-empresa').value;

            if (!name || !email || !password) {
                this.showToast('Preencha todos os campos.', 'warning');
                return;
            }

            try {
                await store.createUser(email, password, name, nivel, empresa_id);
                this.showToast('Usuário criado!', 'success');
                document.getElementById('modal-user-add').remove();
                this.openUserManager();
            } catch (err) {
                this.showToast('Erro: ' + err.message, 'error');
            }
        };
    },

    async _deleteUser(userId) {
        const confirmed = await this.confirm('Desativar este usuário? Ele não poderá mais fazer login.', 'Desativar Usuário');
        if (!confirmed) return;

        try {
            await store.deleteUser(userId);
            this.showToast('Usuário desativado.', 'info');
            document.getElementById('modal-user-manager').remove();
            this.openUserManager();
        } catch (err) {
            this.showToast('Erro: ' + err.message, 'error');
        }
    },

    render() {
        // Restore current view from state (not implemented fully in state yet, defaulting to dashboard)
        // this.navigateTo(store.getState().ui.currentView);
    },

    // --- Settings Logic ---

    loadSettingsForm() {
        const state = store.getState();
        const conf = state.company || {};

        if (document.getElementById('conf-name')) document.getElementById('conf-name').value = conf.name || '';
        if (document.getElementById('conf-cnpj')) document.getElementById('conf-cnpj').value = conf.cnpj || '';
        if (document.getElementById('conf-email')) document.getElementById('conf-email').value = conf.email || '';
        if (document.getElementById('conf-regime')) document.getElementById('conf-regime').value = conf.regimeTributario || 'Lucro Real';
        if (document.getElementById('conf-ipi')) document.getElementById('conf-ipi').value = state.settings?.defaultIpi || 9.75;
        if (document.getElementById('conf-company-color')) document.getElementById('conf-company-color').value = conf.companyColor || '#0055AA';

        // Fill address fields (individual or fallback parse from legacy address string)
        let logradouro = conf.logradouro || '';
        let numero = conf.numero || '';
        let cep = conf.cep || '';
        let cidade = conf.cidade || '';
        let uf = conf.uf || '';

        if (!logradouro && !numero && !cidade && !uf && conf.address) {
            const parsed = this._parseLegacyAddress(conf.address);
            logradouro = parsed.logradouro;
            numero = parsed.numero;
            cep = parsed.cep;
            cidade = parsed.cidade;
            uf = parsed.uf;
        }

        if (document.getElementById('conf-logradouro')) document.getElementById('conf-logradouro').value = logradouro;
        if (document.getElementById('conf-numero')) document.getElementById('conf-numero').value = numero;
        if (document.getElementById('conf-cep')) document.getElementById('conf-cep').value = cep;
        if (document.getElementById('conf-cidade')) document.getElementById('conf-cidade').value = cidade;
        if (document.getElementById('conf-uf')) document.getElementById('conf-uf').value = uf;

        if (document.getElementById('conf-template-tecnica')) document.getElementById('conf-template-tecnica').value = conf.templateTecnica || '';
        if (document.getElementById('conf-template-comercial')) document.getElementById('conf-template-comercial').value = conf.templateComercial || '';
        if (document.getElementById('conf-template-completa')) document.getElementById('conf-template-completa').value = conf.templateCompleta || '';
        this.loadTemplateOptions();
        this.loadAiSettingsForm();
        this.loadVendedoresForm();
        this.loadLoginThemeForm();
        this.loadLaborRatesForm();
        this.loadTelegramSettingsForm();
        this.loadMailSettingsForm();
        this.stageManager.load();
        this.loadEmpresasTable();
    },

    async loadEmpresasTable() {
        const tbody = document.getElementById('conf-empresas-tbody');
        if (!tbody) return;
        try {
            const empresas = await store.fetchEmpresas();
            tbody.innerHTML = empresas.map(e => `
                <tr>
                    <td style="padding:8px 12px;">${e.nome}</td>
                    <td style="padding:8px 12px; color:#64748b;">${e.cnpj || '—'}</td>
                    <td style="padding:8px 12px;"><span class="user-level-badge admin">${e.sigla || '—'}</span></td>
                    <td style="padding:8px 12px; color:#64748b;">${e.plano || 'trial'}</td>
                    <td style="padding:8px 12px; white-space:nowrap;">
                        <button class="btn btn-ghost" style="padding:4px;" onclick="app.editEmpresa('${e.id}','${e.nome.replace(/'/g, "\\'")}','${e.cnpj || ''}','${e.sigla || ''}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn btn-ghost" style="padding:4px;color:var(--color-danger);" onclick="app.deleteEmpresa('${e.id}','${e.nome.replace(/'/g, "\\'")}')" title="Excluir"><i class="ph ph-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.warn('[App] Erro ao carregar empresas:', err);
        }
    },

    async addEmpresa() {
        const nome = document.getElementById('conf-empresa-nome')?.value?.trim();
        const cnpj = document.getElementById('conf-empresa-cnpj')?.value?.trim();
        const sigla = document.getElementById('conf-empresa-sigla')?.value?.trim();
        if (!nome) {
            this.showToast('Informe o nome da empresa.', 'warning');
            return;
        }
        try {
            await store.createEmpresa(nome, cnpj, sigla);
            this.showToast('Empresa criada com sucesso!', 'success');
            document.getElementById('conf-empresa-nome').value = '';
            document.getElementById('conf-empresa-cnpj').value = '';
            document.getElementById('conf-empresa-sigla').value = '';
            this.loadEmpresasTable();
        } catch (err) {
            this.showToast('Erro: ' + err.message, 'error');
        }
    },

    editEmpresa(id, nome, cnpj, sigla) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.className = 'empresa-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:400px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;">Editar Empresa</h3>
                    <button type="button" class="btn btn-ghost" onclick="this.closest('.empresa-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                </div>
                <div style="padding:20px;">
                    <div class="form-group">
                        <label class="form-label">Nome da Empresa</label>
                        <input type="text" id="edit-empresa-nome" class="form-control" value="${nome}">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">CNPJ</label>
                        <input type="text" id="edit-empresa-cnpj" class="form-control" value="${cnpj}">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Sigla</label>
                        <input type="text" id="edit-empresa-sigla" class="form-control" value="${sigla}" maxlength="6">
                    </div>
                    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border);">
                        <button type="button" class="btn btn-cancel" onclick="this.closest('.empresa-overlay').remove()">Cancelar</button>
                        <button type="button" class="btn btn-primary" style="background:#6366f1;border-color:#6366f1;" onclick="app.saveEmpresa('${id}')">Salvar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async saveEmpresa(id) {
        const nome = document.getElementById('edit-empresa-nome')?.value?.trim();
        const cnpj = document.getElementById('edit-empresa-cnpj')?.value?.trim();
        const sigla = document.getElementById('edit-empresa-sigla')?.value?.trim();
        if (!nome) { this.showToast('Informe o nome da empresa.', 'warning'); return; }
        try {
            await store.updateEmpresa(id, nome, cnpj, sigla);
            this.showToast('Empresa atualizada!', 'success');
            const overlay = document.getElementById('edit-empresa-nome')?.closest('.empresa-overlay');
            if (overlay) overlay.remove();
            this.loadEmpresasTable();
        } catch (err) {
            this.showToast('Erro: ' + err.message, 'error');
        }
    },

    async deleteEmpresa(id, nome) {
        if (!confirm(`Excluir a empresa "${nome}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await store.deleteEmpresa(id);
            this.showToast('Empresa excluída.', 'info');
            this.loadEmpresasTable();
        } catch (err) {
            this.showToast('Erro: ' + err.message, 'error');
        }
    },

    _parseLegacyAddress(address) {
        let resto = address.trim();
        let cep = '';
        const cepMatch = resto.match(/(\d{5})-?(\d{3})/);
        if (cepMatch) {
            cep = `${cepMatch[1]}-${cepMatch[2]}`;
            resto = resto.replace(cepMatch[0], '').trim();
        }
        resto = resto.replace(/\s{2,}/g, ' ').replace(/[,\s]*$/, '');
        let cidade = '', uf = '', logradouro = '', numero = '';
        const dashIdx = resto.lastIndexOf(' - ');
        if (dashIdx > -1) {
            const left = resto.slice(0, dashIdx).trim();
            const right = resto.slice(dashIdx + 3).trim();
            const ufMatch = right.match(/^(.+?)[,\s]+([A-Za-z]{2})$/);
            if (ufMatch) {
                cidade = ufMatch[1].trim();
                uf = ufMatch[2].toUpperCase();
            } else {
                cidade = right;
            }
            const numMatch = left.match(/^(.*?)[,\s]+(\d[\d\s]*)$/);
            if (numMatch) {
                logradouro = numMatch[1].trim();
                numero = numMatch[2].trim();
            } else {
                logradouro = left;
            }
        } else {
            logradouro = resto;
        }
        return { logradouro, numero, cep, cidade, uf };
    },

    loadLaborRatesForm() {
        const tbody = document.getElementById('conf-labor-rates-tbody');
        if (!tbody) return;
        const savedRates = store.getState().settings?.laborRates || {};
        const composicoes = store.getState().composicoes || [];

        const allRoles = [...DEFAULT_LABOR_ROLES];
        const existingKeys = new Set(allRoles.map(r => `${r.group}|${r.role}`));

        composicoes.forEach(c => {
            if (!c.categoria_profissional) return;
            const group = c.area_alocacao || 'Montagem';
            const role = c.categoria_profissional;
            const key = `${group}|${role}`;
            if (!existingKeys.has(key)) {
                allRoles.push({ group, role, hours: 0, hourlyRate: 0 });
                existingKeys.add(key);
            }
        });

        this._laborRateKeys = allRoles;

        tbody.innerHTML = allRoles.map((item, i) => {
            const rate = savedRates[`${item.group}|${item.role}`] || savedRates[item.role] || 0;
            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 12px; font-size: 12px; color: #475569;">${this._escapeHtml(item.group)}</td>
                    <td style="padding: 8px 12px; font-size: 12px; font-weight: 600;">${this._escapeHtml(item.role)}</td>
                    <td style="padding: 8px 12px; text-align: right;">
                        <input type="text" id="conf-labor-rate-${i}" class="form-control" value="${app.formatCurrency(rate).replace('R$', '').trim()}" style="text-align: right; font-size: 12px; width: 120px; display: inline-block;" onblur="this.value=app.formatCurrencyRaw(app.parseCurrency(this.value))">
                    </td>
                </tr>
            `;
        }).join('');
    },

    loadVendedoresForm() {
        const vendedores = store.getState().vendedores || [];
        const tbody = document.getElementById('conf-vendedores-tbody');
        if (!tbody) return;
        tbody.innerHTML = vendedores.map(v => `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 12px;">${this._escapeHtml(v.nome || '')}</td>
                <td style="padding:8px 12px;">${this._escapeHtml(v.email || '')}</td>
                <td style="padding:8px 12px;">${this._escapeHtml(v.telefone || '')}</td>
                <td style="padding:8px 12px; text-align:center;">
                    <button class="btn btn-sm btn-ghost text-danger" onclick="app.deleteVendedor('${v.id}')" title="Remover">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    addVendedor() {
        const nome = document.getElementById('conf-vendedor-nome')?.value?.trim();
        if (!nome) { this.showToast('Informe o nome do vendedor.', 'warning'); return; }
        const email = document.getElementById('conf-vendedor-email')?.value?.trim() || '';
        const telefone = document.getElementById('conf-vendedor-telefone')?.value?.trim() || '';
        const vendedor = {
            id: crypto.randomUUID(),
            nome, email, telefone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const vendedores = [...(store.getState().vendedores || []), vendedor];
        store.setState({ vendedores });
        store._syncCreate('vendedores', vendedor).catch(() => {});
        document.getElementById('conf-vendedor-nome').value = '';
        document.getElementById('conf-vendedor-email').value = '';
        document.getElementById('conf-vendedor-telefone').value = '';
        this.loadVendedoresForm();
        this.showToast('Vendedor adicionado!', 'success');
    },

    deleteVendedor(id) {
        const vendedores = (store.getState().vendedores || []).filter(v => v.id !== id);
        store.setState({ vendedores });
        store._syncDelete('vendedores', id).catch(() => {});
        this.loadVendedoresForm();
        this.showToast('Vendedor removido.', 'info');
    },

    saveSettings() {
        const logradouro = (document.getElementById('conf-logradouro')?.value || '').trim();
        const numero = (document.getElementById('conf-numero')?.value || '').trim();
        const cep = (document.getElementById('conf-cep')?.value || '').trim();
        const cidade = (document.getElementById('conf-cidade')?.value || '').trim();
        const uf = (document.getElementById('conf-uf')?.value || '').trim();

        const addressParts = [logradouro, numero].filter(Boolean).join(', ');
        const cityPart = [cidade, uf].filter(Boolean).join(', ');
        const address = [addressParts, cityPart].filter(Boolean).join(' - ');
        const addressWithCep = [address, cep].filter(Boolean).join(' - ');

        const company = {
            name: document.getElementById('conf-name').value,
            cnpj: document.getElementById('conf-cnpj').value,
            address: addressWithCep,
            logradouro, numero, cep, cidade, uf,
            email: document.getElementById('conf-email').value,
            regimeTributario: document.getElementById('conf-regime').value,
            logoUrl: store.getState().company.logoUrl,
            templateTecnica: document.getElementById('conf-template-tecnica')?.value || '',
            templateComercial: document.getElementById('conf-template-comercial')?.value || '',
            templateCompleta: document.getElementById('conf-template-completa')?.value || '',
            companyColor: document.getElementById('conf-company-color')?.value || '#0055AA'
        };

        const laborRates = {};
        const roles = this._laborRateKeys || DEFAULT_LABOR_ROLES;
        roles.forEach((item, i) => {
            const el = document.getElementById(`conf-labor-rate-${i}`);
            if (el) {
                const val = parseFloat(el.value.replace(/\./g, '').replace(',', '.')) || 0;
                if (val > 0) laborRates[`${item.group}|${item.role}`] = val;
            }
        });

        store.setState({ 
            company,
            settings: { ...store.getState().settings, defaultIpi: parseFloat(document.getElementById('conf-ipi').value) || 9.75, laborRates }
        });
        // Persist company data to server
        const _tkSC = store.getState().auth?.token;
        const _s = store.getState().settings || {};
        fetch(`http://${location.hostname}:8082/api/settings/company`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(_tkSC ? { 'Authorization': 'Bearer ' + _tkSC } : {}) },
            body: JSON.stringify({
                theme: _s.theme || 'light',
                defaultMarkup: _s.defaultMarkup ?? 30,
                defaultTax: _s.defaultTax ?? 18,
                defaultIpi: _s.defaultIpi ?? 9.75,
                company_name: company.name,
                company_cnpj: company.cnpj,
                company_address: company.address,
                company_logradouro: company.logradouro,
                company_numero: company.numero,
                company_cep: company.cep,
                company_cidade: company.cidade,
                company_uf: company.uf,
                company_email: company.email,
                company_logoUrl: company.logoUrl,
                company_regimeTributario: company.regimeTributario,
                company_color: company.companyColor,
                template_tecnica: company.templateTecnica || 'TEMPLATE_TEC.docx',
                template_comercial: company.templateComercial || 'TEMPLATE_COM.docx',
                template_completa: company.templateCompleta || 'TEMPLATE_TEC_COM.docx',
                vendor_defaults: _s.vendor_defaults || '[]',
                loginTheme: _s.loginTheme || {}
            })
        }).then(r => {
            if (!r.ok) console.warn('[App] Erro ao salvar empresa no servidor');
        }).catch(err => console.warn('[App] Erro ao salvar empresa no servidor:', err));
        alert("Configurações salvas com sucesso!");
    },

    // --- Telegram Settings ---

    async loadTelegramSettingsForm() {
        const data = await store.fetchTelegramSettings();
        if (!data) return;
        const tokenEl = document.getElementById('conf-telegram-token');
        if (tokenEl) tokenEl.value = data.botToken || '';
        const tbody = document.getElementById('conf-telegram-users-tbody');
        if (!tbody) return;
        tbody.innerHTML = (data.users || []).map(u => `
            <tr>
                <td style="padding:8px 12px;">${this._escapeHtml(u.name)}</td>
                <td style="padding:8px 12px;">${this._escapeHtml(u.email)}</td>
                <td style="padding:8px 12px;">${this._escapeHtml(u.nivel)}</td>
                <td style="padding:8px 12px;">
                    <input type="text" class="form-control" style="width:160px;font-size:12px;"
                        data-user-id="${u.id}"
                        value="${this._escapeHtml(u.telegram_chat_id)}"
                        placeholder="Chat ID">
                </td>
            </tr>
        `).join('');
    },

    async saveTelegramSettings() {
        const botToken = document.getElementById('conf-telegram-token')?.value || '';
        const inputs = document.querySelectorAll('#conf-telegram-users-tbody input[data-user-id]');
        const users = Array.from(inputs).map(inp => ({
            id: inp.getAttribute('data-user-id'),
            telegram_chat_id: inp.value.trim()
        }));
        const statusEl = document.getElementById('conf-telegram-status');
        if (statusEl) statusEl.textContent = 'Salvando...';
        try {
            await store.saveTelegramSettings({ botToken, users });
            if (statusEl) statusEl.textContent = '✓ Salvo';
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        } catch (e) {
            if (statusEl) statusEl.textContent = '✗ Erro: ' + e.message;
        }
    },

    async testTelegram() {
        const botToken = document.getElementById('conf-telegram-token')?.value || '';
        const statusEl = document.getElementById('conf-telegram-status');
        if (statusEl) statusEl.textContent = 'Testando...';
        try {
            const inputs = document.querySelectorAll('#conf-telegram-users-tbody input[data-user-id]');
            const users = Array.from(inputs).map(inp => ({
                id: inp.getAttribute('data-user-id'),
                telegram_chat_id: inp.value.trim()
            }));
            await store.saveTelegramSettings({ botToken, users });
            const res = await fetch(`http://localhost:8082/api/notify-telegram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (store.getState().auth?.token || '') },
                body: JSON.stringify({ cliente: 'Teste', projeto: 'Mensagem de teste', acao: 'Notificação de teste', responsavel: store.getState().auth?.user?.name || '', vendedor: '', tipo: 'movimentacao' })
            });
            if (res.ok) {
                if (statusEl) statusEl.textContent = '✓ Notificação enviada!';
            } else {
                if (statusEl) statusEl.textContent = '✗ Erro ao testar';
            }
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        } catch (e) {
            if (statusEl) statusEl.textContent = '✗ Erro: ' + e.message;
        }
    },

    // --- AI Settings ---

    loadAiSettingsForm() {
        const ai = store.getState().aiSettings || {};
        const provider = ai.provider || 'ollama';

        const provEl = document.getElementById('conf-ai-provider');
        if (provEl) provEl.value = provider;

        const openaiEl = document.getElementById('ai-openai-fields');
        const ollamaEl = document.getElementById('ai-ollama-fields');

        if (provider === 'openai') {
            if (openaiEl) openaiEl.style.display = 'block';
            if (ollamaEl) ollamaEl.style.display = 'none';
        } else {
            if (openaiEl) openaiEl.style.display = 'none';
            if (ollamaEl) ollamaEl.style.display = 'block';
        }

        const keyEl = document.getElementById('conf-ai-key');
        if (keyEl && ai.apiKey) keyEl.value = ai.apiKey;

        if (provider === 'openai') {
            const modelEl = document.getElementById('conf-ai-model-openai');
            if (modelEl) modelEl.value = ai.model || 'gpt-4o-mini';
        } else {
            const modelEl = document.getElementById('conf-ai-model-ollama');
            if (modelEl) modelEl.value = ai.model || 'qwen2.5:14b';
        }

        const urlEl = document.getElementById('conf-ai-ollama-url');
        if (urlEl) urlEl.value = ai.ollamaUrl || 'http://localhost:11434';
    },

    onAiProviderChange() {
        const provider = document.getElementById('conf-ai-provider').value;
        const openaiEl = document.getElementById('ai-openai-fields');
        const ollamaEl = document.getElementById('ai-ollama-fields');
        if (provider === 'openai') {
            if (openaiEl) openaiEl.style.display = 'block';
            if (ollamaEl) ollamaEl.style.display = 'none';
        } else {
            if (openaiEl) openaiEl.style.display = 'none';
            if (ollamaEl) ollamaEl.style.display = 'block';
        }
    },

    toggleAiKeyVisibility() {
        const keyEl = document.getElementById('conf-ai-key');
        const iconEl = document.getElementById('ai-key-eye-icon');
        if (!keyEl || !iconEl) return;
        if (keyEl.type === 'password') {
            keyEl.type = 'text';
            iconEl.className = 'ph ph-eye-slash';
        } else {
            keyEl.type = 'password';
            iconEl.className = 'ph ph-eye';
        }
    },

    async saveAiSettings() {
        const provider = document.getElementById('conf-ai-provider').value;
        const apiKey = document.getElementById('conf-ai-key')?.value || '';
        const ollamaUrl = document.getElementById('conf-ai-ollama-url')?.value || 'http://localhost:11434';
        const model = provider === 'openai'
            ? document.getElementById('conf-ai-model-openai')?.value || 'gpt-4o-mini'
            : document.getElementById('conf-ai-model-ollama')?.value || 'qwen2.5:14b';

        const btn = document.getElementById('btn-ai-save');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando...'; }

        try {
            await store.saveAiSettings({ provider, model, apiKey, ollamaUrl });
            this.loadAiSettingsForm();
            this.showToast('Configurações de IA salvas com sucesso!', 'success');
        } catch (err) {
            this.showToast('Erro ao salvar: ' + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Configurações'; }
        }
    },

    async testAiConnection() {
        const resultDiv = document.getElementById('ai-test-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#f8fafc';
            resultDiv.style.border = '1px solid #e2e8f0';
            resultDiv.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Testando conexão...';
        }

        try {
            const result = await store.testAiConnection();
            if (resultDiv) {
                if (result.success) {
                    resultDiv.style.background = '#f0fdf4';
                    resultDiv.style.border = '1px solid #bbf7d0';
                    resultDiv.style.color = '#166534';
                    resultDiv.innerHTML = `<i class="ph ph-check-circle"></i> ${result.message}`;
                } else {
                    resultDiv.style.background = '#fef2f2';
                    resultDiv.style.border = '1px solid #fecaca';
                    resultDiv.style.color = '#991b1b';
                    resultDiv.innerHTML = `<i class="ph ph-x-circle"></i> ${result.error || 'Falha na conexão'}`;
                }
            }
        } catch (err) {
            if (resultDiv) {
                resultDiv.style.background = '#fef2f2';
                resultDiv.style.border = '1px solid #fecaca';
                resultDiv.style.color = '#991b1b';
                resultDiv.innerHTML = `<i class="ph ph-x-circle"></i> Erro: ${err.message}`;
            }
        }
    },

    // --- Mail Settings ---

    async loadMailSettingsForm() {
        try {
            const token = store.getState().auth?.token;
            const res = await fetch(`http://${location.hostname}:8082/api/settings/mail`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success) return;
            const s = data.settings;
            if (!s) return;
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
            setVal('conf-mail-provider', s.provider || 'smtp');
            setVal('conf-mail-host', s.host || '');
            setVal('conf-mail-port', s.port || 587);
            const secureEl = document.getElementById('conf-mail-secure');
            if (secureEl) secureEl.checked = s.secure === 1 || s.secure === true;
            setVal('conf-mail-user', s.user || '');
            setVal('conf-mail-pass', '');
            setVal('conf-mail-api-key', '');
            setVal('conf-mail-from-name', s.from_name || '');
            setVal('conf-mail-from-email', s.from_email || '');
            this.onMailProviderChange();
        } catch (err) {
            console.warn('[MailSettings] Error loading:', err);
        }
    },

    onMailProviderChange() {
        const provider = document.getElementById('conf-mail-provider')?.value || 'smtp';
        const smtpFields = document.getElementById('mail-smtp-fields');
        const sgFields = document.getElementById('mail-sendgrid-fields');
        if (provider === 'sendgrid') {
            if (smtpFields) smtpFields.style.display = 'none';
            if (sgFields) sgFields.style.display = 'block';
        } else {
            if (smtpFields) smtpFields.style.display = 'grid';
            if (sgFields) sgFields.style.display = 'none';
        }
    },

    async saveMailSettings() {
        const getVal = (id) => document.getElementById(id)?.value || '';
        const provider = getVal('conf-mail-provider') || 'smtp';
        const data = {
            provider,
            host: getVal('conf-mail-host'),
            port: parseInt(getVal('conf-mail-port')) || 587,
            secure: document.getElementById('conf-mail-secure')?.checked || false,
            user: getVal('conf-mail-user'),
            pass: getVal('conf-mail-pass'),
            api_key: getVal('conf-mail-api-key'),
            from_name: getVal('conf-mail-from-name'),
            from_email: getVal('conf-mail-from-email')
        };
        const statusEl = document.getElementById('conf-mail-status');
        if (statusEl) statusEl.textContent = 'Salvando...';
        try {
            const token = store.getState().auth?.token;
            const res = await fetch(`http://${location.hostname}:8082/api/settings/mail`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                if (statusEl) statusEl.textContent = '✓ Configurações salvas!';
                if (result.settings) {
                    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
                    setVal('conf-mail-from-name', result.settings.from_name || '');
                    setVal('conf-mail-from-email', result.settings.from_email || '');
                }
            } else {
                if (statusEl) statusEl.textContent = '✗ Erro: ' + (result.error || 'Falha ao salvar');
            }
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        } catch (err) {
            if (statusEl) statusEl.textContent = '✗ Erro: ' + err.message;
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        }
    },

    async testMailSettings() {
        const statusEl = document.getElementById('conf-mail-status');
        if (statusEl) statusEl.textContent = 'Testando...';
        try {
            const token = store.getState().auth?.token;
            const res = await fetch(`http://${location.hostname}:8082/api/test-email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const result = await res.json();
            if (result.success) {
                if (statusEl) statusEl.textContent = '✓ E-mail de teste enviado! Verifique sua caixa de entrada.';
            } else {
                if (statusEl) statusEl.textContent = '✗ Erro: ' + (result.error || 'Falha no teste');
            }
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 6000);
        } catch (err) {
            if (statusEl) statusEl.textContent = '✗ Erro: ' + err.message;
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        }
    },

    toggleMailPassVisibility() {
        const el = document.getElementById('conf-mail-pass');
        const icon = document.getElementById('mail-pass-eye-icon');
        if (!el || !icon) return;
        if (el.type === 'password') {
            el.type = 'text';
            icon.className = 'ph ph-eye-slash';
        } else {
            el.type = 'password';
            icon.className = 'ph ph-eye';
        }
    },

    toggleMailApiKeyVisibility() {
        const el = document.getElementById('conf-mail-api-key');
        const icon = document.getElementById('mail-apikey-eye-icon');
        if (!el || !icon) return;
        if (el.type === 'password') {
            el.type = 'text';
            icon.className = 'ph ph-eye-slash';
        } else {
            el.type = 'password';
            icon.className = 'ph ph-eye';
        }
    },

    // --- CRM Stage Manager ---

    stageManager: {
        _stages: [],

        async load() {
            const container = document.getElementById('crm-stages-manager');
            if (!container) return;
            this._stages = (store.getState().crmStages || []).map(s => ({ ...s }));
            if (this._stages.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8"><p style="font-size:12px">Nenhum estágio configurado. Clique em "Adicionar Estágio" para começar.</p></div>';
                return;
            }
            this.render(container);
        },

        render(container) {
            if (!container) container = document.getElementById('crm-stages-manager');
            if (!container) return;
            const items = this._stages.map((s, i) => `
                <div class="crm-stage-item" data-stage-id="${s.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:6px;background:#fff">
                    <div style="cursor:grab;color:#94a3b8;font-size:16px" title="Arrastar para reordenar"><i class="ph ph-grip-vertical"></i></div>
                    <div style="width:16px;height:16px;border-radius:50%;background:${s.color || '#6b7280'};flex-shrink:0"></div>
                    <div style="flex:1;min-width:0">
                        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                            <span class="stage-label" style="font-weight:600;font-size:13px">${this._esc(s.label)}</span>
                            <span class="stage-id-label" style="font-size:10px;color:#94a3b8;font-family:monospace">(${this._esc(s.stage_id || s.id)})</span>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:4px;font-size:11px;color:#64748b;flex-wrap:wrap">
                            ${s.is_default ? '<span style="background:#e0f2fe;color:#0369a1;padding:1px 6px;border-radius:4px">Padrão</span>' : ''}
                            ${s.is_terminal ? '<span style="background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:4px">Terminal</span>' : ''}
                            ${s.allows_proposal ? '<span style="background:#f0fdf4;color:#16a34a;padding:1px 6px;border-radius:4px">Permite Proposta</span>' : ''}
                            ${s.tracks_qualificacao ? '<span style="background:#f3e8ff;color:#7c3aed;padding:1px 6px;border-radius:4px">Registra Qualif.</span>' : ''}
                            ${s.tracks_conversao ? '<span style="background:#dbeafe;color:#2563eb;padding:1px 6px;border-radius:4px">Registra Conv.</span>' : ''}
                            ${s.is_loss ? '<span style="background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:4px">Perda</span>' : ''}
                        </div>
                    </div>
                    <div style="display:flex;gap:4px">
                        <button class="btn btn-sm btn-ghost" onclick="app.stageManager.edit('${s.id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn btn-sm btn-ghost" onclick="app.stageManager.remove('${s.id}')" title="Excluir" style="color:#dc2626"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
            `).join('');
            container.innerHTML = `<div style="max-height:500px;overflow-y:auto">${items}</div>`;
            this._enableDragReorder(container);
        },

        _esc(str) {
            if (str == null) return '';
            const d = document.createElement('div');
            d.textContent = String(str);
            return d.innerHTML;
        },

        _enableDragReorder(container) {
            const items = container.querySelectorAll('.crm-stage-item');
            items.forEach(item => {
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.dataset.stageId);
                    item.style.opacity = '0.5';
                });
                item.addEventListener('dragend', (e) => {
                    item.style.opacity = '1';
                });
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    const dragging = container.querySelector('.crm-stage-item[draggable="true"][style*="opacity: 0.5"]');
                    if (!dragging || dragging === item) return;
                    const rect = item.getBoundingClientRect();
                    const mid = rect.top + rect.height / 2;
                    if (e.clientY < mid) {
                        container.querySelector('div').insertBefore(dragging, item);
                    } else {
                        container.querySelector('div').insertBefore(dragging, item.nextSibling);
                    }
                });
            });
        },

        _getOrderedIds() {
            const container = document.getElementById('crm-stages-manager');
            if (!container) return this._stages.map(s => s.id);
            const items = container.querySelectorAll('.crm-stage-item');
            return Array.from(items).map(el => el.dataset.stageId);
        },

        async saveAll() {
            const orderedIds = this._getOrderedIds();
            const statusEl = document.getElementById('crm-stages-status');
            if (statusEl) statusEl.textContent = 'Salvando...';

            // Reorder first
            await store.reorderCrmStages(orderedIds);

            // Refresh from server
            const success = await this._refreshStages();
            if (statusEl) statusEl.textContent = success ? 'Salvo com sucesso!' : 'Erro ao salvar';
            if (success) setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        },

        async add() {
            const id = 'stage_' + crypto.randomUUID().substring(0, 8);
            const newStage = {
                id,
                stage_id: id,
                label: 'Novo Estágio',
                color: '#6b7280',
                icon: 'ph-dot-outline',
                position: this._stages.length,
                is_default: 0,
                is_terminal: 0,
                allows_proposal: 0,
                tracks_qualificacao: 0,
                tracks_conversao: 0,
                is_loss: 0,
                loss_reasons: []
            };
            this._stages.push(newStage);
            this.render();
        },

        async edit(id) {
            const stage = this._stages.find(s => s.id === id);
            if (!stage) return;
            const overlay = document.createElement('div');
            overlay.className = 'crm-modal-overlay';
            const flags = [
                { key: 'is_default', label: 'Estágio Padrão (leads novos vão para cá)', desc: 'Apenas um estágio pode ser padrão' },
                { key: 'is_terminal', label: 'Terminal (bloqueia drag e interações)', desc: 'Impede avanço manual e registro de interações' },
                { key: 'allows_proposal', label: 'Permite solicitar proposta', desc: 'Exibe botão "Solicitar Proposta"' },
                { key: 'tracks_qualificacao', label: 'Registra data de qualificação', desc: 'Preenche automaticamente a data de qualificação' },
                { key: 'tracks_conversao', label: 'Registra data de conversão', desc: 'Preenche automaticamente a data de conversão' },
                { key: 'is_loss', label: 'É perda (abre modal de motivo)', desc: 'Exibe motivo de desqualificação ao entrar' }
            ];
            const lossReasonsStr = Array.isArray(stage.loss_reasons) ? stage.loss_reasons.join(', ') : '';
            overlay.innerHTML = `
                <div class="crm-modal" style="max-width:600px">
                    <div class="crm-modal-header">
                        <h3>Editar Estágio</h3>
                        <button class="crm-modal-close" onclick="this.closest('.crm-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="crm-modal-body">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
                            <div>
                                <label style="font-size:11px;font-weight:600;color:#374151">Label</label>
                                <input type="text" id="stage-edit-label" class="form-control" value="${this._esc(stage.label)}" style="font-size:12px">
                            </div>
                            <div>
                                <label style="font-size:11px;font-weight:600;color:#374151">ID técnico</label>
                                <input type="text" id="stage-edit-stage-id" class="form-control" value="${this._esc(stage.stage_id || stage.id)}" style="font-size:12px;font-family:monospace">
                            </div>
                            <div>
                                <label style="font-size:11px;font-weight:600;color:#374151">Cor</label>
                                <input type="color" id="stage-edit-color" class="form-control" value="${stage.color || '#6b7280'}" style="height:36px;padding:2px">
                            </div>
                            <div>
                                <label style="font-size:11px;font-weight:600;color:#374151">Ícone (Phosphor)</label>
                                <input type="text" id="stage-edit-icon" class="form-control" value="${this._esc(stage.icon || 'ph-dot-outline')}" style="font-size:12px;font-family:monospace">
                                <span style="font-size:10px;color:#94a3b8">Ex: ph-dot-outline, ph-star, ph-check-circle</span>
                            </div>
                        </div>
                        <div style="margin-bottom:16px">
                            <label style="font-size:11px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Flags de Negócio</label>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                                ${flags.map(f => `
                                    <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px">
                                        <input type="checkbox" data-flag="${f.key}" ${stage[f.key] ? 'checked' : ''} style="width:16px;height:16px;margin-top:1px">
                                        <div>
                                            <div style="font-weight:500">${f.label}</div>
                                            <div style="font-size:10px;color:#94a3b8">${f.desc}</div>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <div id="stage-edit-loss-section" style="margin-bottom:16px;${stage.is_loss ? '' : 'display:none'}">
                            <label style="font-size:11px;font-weight:600;color:#374151">Motivos de Perda (separados por vírgula)</label>
                            <input type="text" id="stage-edit-loss-reasons" class="form-control" value="${this._esc(lossReasonsStr)}" style="font-size:12px">
                        </div>
                        <div style="display:flex;gap:8px;justify-content:flex-end">
                            <button class="btn" onclick="this.closest('.crm-modal-overlay').remove()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.stageManager._saveEdit('${id}')">Salvar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            // Show/hide loss reasons section based on is_loss checkbox
            overlay.querySelectorAll('[data-flag="is_loss"]').forEach(cb => {
                cb.addEventListener('change', () => {
                    const section = document.getElementById('stage-edit-loss-section');
                    if (section) section.style.display = cb.checked ? 'block' : 'none';
                });
            });
            // If is_default is checked, uncheck all others
            overlay.querySelectorAll('[data-flag="is_default"]').forEach(cb => {
                cb.addEventListener('change', () => {
                    if (cb.checked) {
                        overlay.querySelectorAll('[data-flag="is_default"]').forEach(c2 => { if (c2 !== cb) c2.checked = false; });
                    }
                });
            });
        },

        async _saveEdit(id) {
            const stage = this._stages.find(s => s.id === id);
            if (!stage) return;
            const label = document.getElementById('stage-edit-label')?.value || stage.label;
            const stageId = document.getElementById('stage-edit-stage-id')?.value || stage.stage_id || stage.id;
            const color = document.getElementById('stage-edit-color')?.value || stage.color;
            const icon = document.getElementById('stage-edit-icon')?.value || stage.icon;
            const lossReasonsStr = document.getElementById('stage-edit-loss-reasons')?.value || '';
            const lossReasons = lossReasonsStr.split(/[,;]/).map(s => s.trim()).filter(Boolean);

            const flags = {};
            document.querySelectorAll('[data-flag]').forEach(el => {
                flags[el.getAttribute('data-flag')] = el.checked ? 1 : 0;
            });

            Object.assign(stage, {
                label,
                stage_id: stageId,
                color,
                icon,
                ...flags,
                loss_reasons: lossReasons
            });

            // Save to server
            const statusEl = document.getElementById('crm-stages-status');
            if (statusEl) statusEl.textContent = 'Salvando...';
            await store.updateCrmStage(id, {
                label, stage_id: stageId, color, icon, ...flags,
                loss_reasons: lossReasons
            });
            if (statusEl) statusEl.textContent = 'Salvo!';

            document.querySelector('.crm-modal-overlay')?.remove();
            this.render();

            // Notify CRM to refresh
            if (window.crm && typeof window.crm._renderView === 'function') window.crm._renderView();
            if (window.crm && typeof window.crm.updateBadge === 'function') window.crm.updateBadge();
        },

        async remove(id) {
            const stage = this._stages.find(s => s.id === id);
            if (!stage) return;
            if (!confirm(`Excluir estágio "${stage.label}"?\n\nLeads neste estágio precisarão ser reatribuídos manualmente antes da exclusão.`)) return;
            const statusEl = document.getElementById('crm-stages-status');
            if (statusEl) statusEl.textContent = 'Excluindo...';
            const ok = await store.deleteCrmStage(id);
            if (ok) {
                this._stages = this._stages.filter(s => s.id !== id);
                this.render();
                if (statusEl) statusEl.textContent = 'Excluído!';
                if (window.crm && typeof window.crm._renderView === 'function') window.crm._renderView();
            } else {
                if (statusEl) statusEl.textContent = 'Erro: há leads neste estágio. Reatribua-os primeiro.';
            }
            if (statusEl) setTimeout(() => { statusEl.textContent = ''; }, 4000);
        },

        async resetToDefaults() {
            if (!confirm('Restaurar estágios padrão?\n\nIsso irá remover todos os estágios personalizados e recriar os 8 estágios originais. Leads com estágios removidos precisarão ser reatribuídos.')) return;
            const statusEl = document.getElementById('crm-stages-status');
            if (statusEl) statusEl.textContent = 'Restaurando padrões...';
            const ok = await store.resetCrmStages();
            if (ok) {
                await this._refreshStages();
                if (statusEl) statusEl.textContent = 'Padrões restaurados!';
                if (window.crm && typeof window.crm._renderView === 'function') window.crm._renderView();
                if (window.crm && typeof window.crm.updateBadge === 'function') window.crm.updateBadge();
            } else {
                if (statusEl) statusEl.textContent = 'Erro ao restaurar padrões';
            }
            if (statusEl) setTimeout(() => { statusEl.textContent = ''; }, 3000);
        },

        async _refreshStages() {
            // Trigger a sync reload
            try {
                const token = store.getState().auth?.token;
                if (!token) return false;
                const res = await fetch(`${store._getServerUrl()}/api/data/sync/full`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.data && data.data.crmStages) {
                    store.setState({ crmStages: data.data.crmStages });
                    this._stages = data.data.crmStages.map(s => ({ ...s }));
                    this.render();
                    return true;
                }
                return false;
            } catch (e) {
                console.error('[StageManager] Refresh error:', e);
                return false;
            }
        }
    },

    loadLoginThemeForm() {
        const lt = store.getState().loginTheme || {};
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('lt-company-name', lt.companyName || '');
        setVal('lt-subtitle', lt.subtitle || '');
        setVal('lt-bg-type', lt.backgroundType || 'gradient');
        setVal('lt-bg-color', lt.backgroundColor || '#0f172a');
        setVal('lt-gradient-start', lt.gradientStart || '#0f172a');
        setVal('lt-gradient-end', lt.gradientEnd || '#1e293b');
        setVal('lt-card-bg', lt.cardBg || '#1e293b');
        setVal('lt-card-border', lt.cardBorder || '#334155');
        setVal('lt-title-color', lt.titleColor || '#38bdf8');
        setVal('lt-primary-color', lt.primaryColor || '#38bdf8');
        setVal('lt-primary-hover', lt.primaryHover || '#7dd3fc');
        setVal('lt-text-color', lt.textColor || '#ffffff');
        setVal('lt-subtitle-color', lt.subtitleColor || '#64748b');
        setVal('lt-input-bg', lt.inputBg || '#0f172a');
        setVal('lt-input-border', lt.inputBorder || '#334155');
        this.onLoginBgTypeChange();
        const logoPreview = document.getElementById('lt-logo-preview');
        if (lt.logoUrl && logoPreview) {
            logoPreview.src = lt.logoUrl;
            logoPreview.style.display = 'block';
        }
    },

    onLoginBgTypeChange() {
        const type = document.getElementById('lt-bg-type')?.value || 'gradient';
        document.getElementById('lt-bg-color-field').style.display = type === 'color' ? 'block' : 'none';
        document.getElementById('lt-gradient-start-field').style.display = type === 'gradient' ? 'block' : 'none';
        document.getElementById('lt-gradient-end-field').style.display = type === 'gradient' ? 'block' : 'none';
        document.getElementById('lt-bg-image-field').style.display = type === 'image' ? 'block' : 'none';
    },

    previewLoginLogo(input) {
        if (!input.files?.[0]) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('lt-logo-preview');
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
            this._pendingLogoData = e.target.result.split(',')[1];
            this._pendingLogoName = input.files[0].name;
        };
        reader.readAsDataURL(input.files[0]);
    },

    clearLoginLogo() {
        const preview = document.getElementById('lt-logo-preview');
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
        this._pendingLogoData = null;
        this._pendingLogoName = null;
    },

    previewLoginBgImage(input) {
        if (!input.files?.[0]) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('lt-bg-image-preview');
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
            this._pendingBgData = e.target.result.split(',')[1];
            this._pendingBgName = input.files[0].name;
        };
        reader.readAsDataURL(input.files[0]);
    },

    clearLoginBgImage() {
        const preview = document.getElementById('lt-bg-image-preview');
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
        this._pendingBgData = null;
        this._pendingBgName = null;
    },

    resetLoginTheme() {
        if (!confirm('Restaurar padrão? Isso substituirá a personalização atual.')) return;
        const defaults = {
            logoUrl: '', backgroundType: 'gradient', backgroundColor: '#0f172a',
            gradientStart: '#0f172a', gradientEnd: '#1e293b', backgroundImage: '',
            cardBg: '#1e293b', cardBorder: '#334155', primaryColor: '#38bdf8',
            primaryHover: '#7dd3fc', textColor: '#ffffff', subtitleColor: '#64748b',
            titleColor: '#38bdf8',
            inputBg: '#0f172a', inputBorder: '#334155', companyName: 'GeraPro', subtitle: 'Sistema de Propostas Técnicas / Comerciais'
        };
        store.setState({ loginTheme: defaults });
        this.loadLoginThemeForm();
        this.showToast('Tema restaurado ao padrão.', 'info');
    },

    async saveLoginTheme() {
        const el = (id) => document.getElementById(id);
        const lt = {
            logoUrl: store.getState().loginTheme?.logoUrl || '',
            backgroundType: el('lt-bg-type')?.value || 'gradient',
            backgroundColor: el('lt-bg-color')?.value || '#0f172a',
            gradientStart: el('lt-gradient-start')?.value || '#0f172a',
            gradientEnd: el('lt-gradient-end')?.value || '#1e293b',
            backgroundImage: store.getState().loginTheme?.backgroundImage || '',
            cardBg: el('lt-card-bg')?.value || '#1e293b',
            cardBorder: el('lt-card-border')?.value || '#334155',
            titleColor: el('lt-title-color')?.value || '#38bdf8',
            primaryColor: el('lt-primary-color')?.value || '#38bdf8',
            primaryHover: el('lt-primary-hover')?.value || '#7dd3fc',
            textColor: el('lt-text-color')?.value || '#ffffff',
            subtitleColor: el('lt-subtitle-color')?.value || '#64748b',
            inputBg: el('lt-input-bg')?.value || '#0f172a',
            inputBorder: el('lt-input-border')?.value || '#334155',
            companyName: el('lt-company-name')?.value || 'GeraPro',
            subtitle: el('lt-subtitle')?.value || 'Sistema de Propostas Técnicas / Comerciais'
        };

        try {
            if (this._pendingLogoData) {
                const resp = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (store.getState().auth.token || '') },
                    body: JSON.stringify({ fileName: this._pendingLogoName, fileData: this._pendingLogoData })
                });
                const data = await resp.json();
                if (resp.ok && data.url) lt.logoUrl = data.url;
            }
            if (this._pendingBgData) {
                const resp = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (store.getState().auth.token || '') },
                    body: JSON.stringify({ fileName: this._pendingBgName, fileData: this._pendingBgData })
                });
                const data = await resp.json();
                if (resp.ok && data.url) lt.backgroundImage = data.url;
            }

            await store.saveLoginTheme(lt);
            localStorage.setItem('gerapro_login_theme', JSON.stringify(lt));
            this._pendingLogoData = null;
            this._pendingLogoName = null;
            this._pendingBgData = null;
            this._pendingBgName = null;
            this.showToast('Personalização salva com sucesso!', 'success');
        } catch (err) {
            this.showToast('Erro: ' + err.message, 'error');
        }
    },

    applyLoginTheme() {
        let lt = store.getState().loginTheme || {};
        if (!lt.primaryColor || lt.companyName === 'GeraPro') {
            try {
                const saved = localStorage.getItem('gerapro_login_theme');
                if (saved) lt = { ...lt, ...JSON.parse(saved) };
            } catch (e) {}
        }
        const loginView = document.getElementById('view-login');
        const card = document.getElementById('login-card');
        const logoImg = document.getElementById('login-logo-img');
        const logoText = document.getElementById('login-logo-text');
        const subtitle = document.getElementById('login-subtitle-text');
        const btn = document.getElementById('btn-login-submit');

        if (!loginView) return;

        if (lt.backgroundType === 'color') {
            loginView.style.background = lt.backgroundColor || '#0f172a';
        } else if (lt.backgroundType === 'gradient') {
            loginView.style.background = `linear-gradient(135deg, ${lt.gradientStart || '#0f172a'}, ${lt.gradientEnd || '#1e293b'})`;
        } else if (lt.backgroundType === 'image') {
            loginView.style.background = lt.backgroundImage ? `url(${lt.backgroundImage}) center/cover no-repeat` : '#0f172a';
        }
        loginView.style.backgroundSize = 'cover';

        if (card) {
            card.style.background = lt.cardBg || '#1e293b';
            card.style.borderColor = lt.cardBorder || '#334155';
            card.style.color = lt.textColor || '#ffffff';
        }

        if (logoImg) {
            if (lt.logoUrl) {
                logoImg.src = lt.logoUrl;
                logoImg.style.display = 'block';
            } else {
                logoImg.style.display = 'none';
            }
        }
        if (logoText) {
            logoText.textContent = lt.companyName || 'GeraPro';
            logoText.style.color = lt.titleColor || lt.primaryColor || '#38bdf8';
        }
        if (subtitle) {
            subtitle.textContent = lt.subtitle || '';
            subtitle.style.color = lt.subtitleColor || '#64748b';
        }
        if (btn) {
            btn.style.background = lt.primaryColor || '#38bdf8';
            btn.style.color = lt.textColor || '#ffffff';
            btn.addEventListener('mouseenter', () => { btn.style.background = lt.primaryHover || '#7dd3fc'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = lt.primaryColor || '#38bdf8'; });
        }

        const styleId = 'login-theme-style';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `
            .login-card .form-group input {
                background: ${lt.inputBg || '#0f172a'} !important;
                border-color: ${lt.inputBorder || '#334155'} !important;
                color: ${lt.textColor || '#ffffff'} !important;
            }
            .login-card .form-group input:focus {
                border-color: ${lt.primaryColor || '#38bdf8'} !important;
            }
            .login-card .form-group label {
                color: ${lt.subtitleColor || '#94a3b8'} !important;
            }
            .login-card .login-footer a {
                color: ${lt.primaryColor || '#38bdf8'} !important;
            }
        `;
    },

    restoreBackup(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Basic validation
                if (data.clientes && Array.isArray(data.materiais)) {
                    this.confirm("Isso substituirá todos os dados atuais. Deseja continuar?", "Restaurar Backup").then(confirmed => {
                        if (confirmed) {
                            store.setState(data);
                            this.showToast("Backup restaurado com sucesso! A página será recarregada.", "success");
                            setTimeout(() => location.reload(), 1000);
                        }
                    });
                } else {
                    this.showToast("Arquivo de backup inválido.", "error");
                }
            } catch (err) {
                console.error(err);
                this.showToast("Erro ao ler arquivo de backup.", "error");
            }
        };
        reader.readAsText(file);
    },

    // Explicit global export for HTML access
    backup() {
        const data = JSON.stringify(store.getState(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gerapro_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast("Backup baixado com sucesso!", "success");
    },

    showToast(message, type = 'info', duration = 3000, action = null) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 320px;
            max-width: 480px;
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#22c55e' : '#6366f1'};
        `;
        let html = `<span style="flex:1;text-align:left">${message}</span>`;
        if (action && action.label) {
            html += `<button class="toast-action" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap">${action.label}</button>`;
        }
        html += `<button class="toast-close" onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.8);cursor:pointer;font-size:18px;padding:0;line-height:1;flex-shrink:0"><i class="ph ph-x"></i></button>`;
        toast.innerHTML = html;

        if (action && action.onClick) {
            const btn = toast.querySelector('.toast-action');
            if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); action.onClick(); toast.remove(); });
        }

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, duration);
        }
    },

    // --- PTC Creation Logic ---

    async openPtcModal() {
        const clientsInfo = store.getState().clientes.length > 0
            ? store.getState().clientes.map(c => `<option value="${c.razaoSocial}">${c.razaoSocial}</option>`).join('')
            : '<option value="">Nenhum cliente cadastrado</option>';

        let ptcNum;
        try {
            const token = store.getState().auth?.token;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const res = await fetch('http://localhost:8082/api/next-proposal-number-preview', { headers });
            const data = await res.json();
            if (data.success && data.numero) ptcNum = data.numero;
        } catch (e) {
            console.warn('[PTC] Falha ao buscar prévia do número:', e);
        }
        if (!ptcNum) {
            const d = new Date();
            const hoje = String(d.getFullYear()).slice(-2) +
                String(d.getMonth() + 1).padStart(2, '0') +
                String(d.getDate()).padStart(2, '0');
            ptcNum = hoje + '--';
        }

        const html = `
            <div id="modal-ptc" class="modal-overlay">
                <div class="modal" style="width: 500px;">
                    <div class="modal-header">
                        <h3 class="card-title">Iniciar Nova PTC</h3>
                        <button class="btn btn-ghost" onclick="document.getElementById('modal-ptc').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Número da PTC</label>
                            <input type="text" id="ptc-number" class="form-control" value="${ptcNum}" readonly style="background: #e2e8f0; font-weight: bold;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Título da PTC (Projeto)</label>
                            <input type="text" id="ptc-title" class="form-control" placeholder="Ex: Retrofit Painel Caldeira">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cliente</label>
                            <select id="ptc-client" class="form-control" onchange="app.populatePtcContactFields(this.value)">
                                <option value="">Selecione...</option>
                                ${clientsInfo}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contato (Nome)</label>
                            <div id="ptc-contact-container">
                                <input type="text" id="ptc-contact" class="form-control" placeholder="Ex: Eng. João Silva">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">E-mail</label>
                            <input type="email" id="ptc-email" class="form-control" placeholder="email@exemplo.com">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label class="form-label">Telefone</label>
                                <input type="tel" id="ptc-phone" class="form-control" placeholder="(00) 00000-0000">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cargo</label>
                                <input type="text" id="ptc-role" class="form-control" placeholder="Ex: Gerente Industrial">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo de Projeto</label>
                            <select id="ptc-type" class="form-control">
                                <option value="Painel de Baixa Tensão">Painel de Baixa Tensão</option>
                                <option value="Painel de Média Tensão">Painel de Média Tensão</option>
                                <option value="Painel de Automação">Painel de Automação</option>
                                <option value="Painel de Controle">Painel de Controle</option>
                                <option value="Eletrocentro">Eletrocentro</option>
                                <option value="Serviços de Campo">Serviços de Campo</option>
                                <option value="Serviços Desenv. Automação">Serviços Desenv. Automação</option>
                                <option value="Elaboração de Projetos">Elaboração de Projetos</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Tipo de Negócio</label>
                            <select id="ptc-business-type" class="form-control">
                                <option value="Industrialização">Industrialização</option>
                                <option value="Revenda">Revenda</option>
                                <option value="Prestação de Serviços">Prestação de Serviços</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Tipo de Proposta</label>
                            <select id="ptc-tipo-proposta" class="form-control">
                                <option value="tecnica_comercial">Completa (documento único)</option>
                                <option value="separado">Técnica + Comercial (2 documentos)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Vendedor</label>
                            <input type="text" id="ptc-vendedor" class="form-control" list="ptc-vendedor-list" placeholder="Selecione o vendedor">
                            <datalist id="ptc-vendedor-list">
                                ${(store.getState().vendedores || []).map(v => `<option value="${this._escapeHtml(v.nome)}">`).join('')}
                            </datalist>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                            <div class="form-group">
                                <label class="form-label">Abertura</label>
                                <input type="date" id="ptc-date-abertura" class="form-control">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Neces. Cliente</label>
                                <input type="date" id="ptc-date-cliente" class="form-control">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Programado para</label>
                                <input type="date" id="ptc-date-programado" class="form-control">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Envio Orçamento</label>
                                <input type="date" id="ptc-date-orcamento" class="form-control">
                            </div>
                        </div>
                        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                            <button class="btn btn-cancel" onclick="document.getElementById('modal-ptc').remove()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.savePtc()">Salvar e Criar Pastas</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    populatePtcContactFields(clientName) {
        const client = store.getState().clientes.find(c => c.razaoSocial === clientName);
        const elContainer = document.getElementById('ptc-contact-container');
        const elEmail = document.getElementById('ptc-email');
        const elPhone = document.getElementById('ptc-phone');
        const elRole = document.getElementById('ptc-role');

        const fillFields = (contact) => {
            if (elEmail) elEmail.value = contact?.email || '';
            if (elPhone) elPhone.value = contact?.telefone || '';
            if (elRole) elRole.value = contact?.cargo || '';
        };

        if (!client) {
            if (elContainer) elContainer.innerHTML = '<input type="text" id="ptc-contact" class="form-control" placeholder="Ex: Eng. João Silva">';
            fillFields(null);
            return;
        }

        let contacts = [];
        if (Array.isArray(client.contatos) && client.contatos.length > 0) {
            contacts = client.contatos;
        } else if (client.contatoNome || client.email || client.telefone) {
            contacts = [{
                nome: client.contatoNome || '',
                email: client.email || '',
                telefone: client.telefone || '',
                cargo: client.contatoCargo || ''
            }];
        }

        if (contacts.length === 0) {
            if (elContainer) elContainer.innerHTML = '<input type="text" id="ptc-contact" class="form-control" placeholder="Ex: Eng. João Silva">';
            fillFields(null);
        } else if (contacts.length === 1) {
            const c = contacts[0];
            if (elContainer) {
                elContainer.innerHTML = `<input type="text" id="ptc-contact" class="form-control" value="${this._escapeHtml(c.nome || '')}" placeholder="Ex: Eng. João Silva">`;
            }
            fillFields(c);
        } else {
            let html = `<select id="ptc-contact" class="form-control" onchange="app.onPtcContactChange(this.value)">`;
            contacts.forEach((c, idx) => {
                const label = (c.nome || 'Sem nome') + (c.cargo ? ` (${c.cargo})` : '');
                html += `<option value="${idx}" ${idx === 0 ? 'selected' : ''}>${this._escapeHtml(label)}</option>`;
            });
            html += `</select>`;
            if (elContainer) elContainer.innerHTML = html;
            fillFields(contacts[0]);
        }
    },

    onPtcContactChange(contactIndex) {
        if (contactIndex === '') return;
        const clientSelect = document.getElementById('ptc-client');
        if (!clientSelect) return;
        const clientName = clientSelect.value;
        const client = store.getState().clientes.find(c => c.razaoSocial === clientName);
        if (!client) return;

        let contacts = [];
        if (Array.isArray(client.contatos) && client.contatos.length > 0) {
            contacts = client.contatos;
        } else if (client.contatoNome || client.email || client.telefone) {
            contacts = [{
                nome: client.contatoNome || '',
                email: client.email || '',
                telefone: client.telefone || '',
                cargo: client.contatoCargo || ''
            }];
        }

        const contact = contacts[parseInt(contactIndex)];
        if (contact) {
            const elEmail = document.getElementById('ptc-email');
            const elPhone = document.getElementById('ptc-phone');
            const elRole = document.getElementById('ptc-role');
            if (elEmail) elEmail.value = contact.email || '';
            if (elPhone) elPhone.value = contact.telefone || '';
            if (elRole) elRole.value = contact.cargo || '';
        }
    },

    async generatePtcNumber() {
        try {
            const token = store.getState().auth?.token;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const res = await fetch('http://localhost:8082/api/next-proposal-number', { headers });
            const data = await res.json();
            if (data.success && data.numero) return data.numero;
        } catch (e) {
            console.warn('[PTC] Falha ao buscar número do servidor, usando fallback local:', e);
        }
        const d = new Date();
        const hoje = String(d.getFullYear()).slice(-2) +
            String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0');
        const fallbackSeq = String(Date.now()).slice(-2);
        return hoje + fallbackSeq;
    },

    async savePtc() {
        try {
            // Check elements existence
            const elNumber = document.getElementById('ptc-number');
            const elTitle = document.getElementById('ptc-title');
            const elClient = document.getElementById('ptc-client');
            const elContact = document.getElementById('ptc-contact');
            const elType = document.getElementById('ptc-type');

            if (!elNumber || !elTitle || !elClient || !elContact || !elType) {
                alert("Erro CRÍTICO: Elementos do formulário não encontrados no DOM!");
                return;
            }

            const ptcNumber = await this.generatePtcNumber();
            elNumber.value = ptcNumber;
            const ptcTitle = elTitle.value;
            const clientName = elClient.value;
            const contact = elContact.value;
            const email = document.getElementById('ptc-email')?.value || '';
            const phone = document.getElementById('ptc-phone')?.value || '';
            const role = document.getElementById('ptc-role')?.value || '';
            const type = elType.value;
            const businessType = document.getElementById('ptc-business-type')?.value || 'Industrialização';
            const tipoProposta = document.getElementById('ptc-tipo-proposta')?.value || 'tecnica_comercial';
            const vendedor = document.getElementById('ptc-vendedor')?.value || '';

            // Date Fields
            const abertura = document.getElementById('ptc-date-abertura').value;
            const necesCliente = document.getElementById('ptc-date-cliente').value;
            const programadoPara = document.getElementById('ptc-date-programado').value;
            const envioOrcamento = document.getElementById('ptc-date-orcamento').value;

            if (!ptcTitle || !clientName) {
                this.showToast('Preencha Título e Cliente.', 'error');
                return;
            }

            const payload = { ptcNumber, ptcTitle, clientName, contact, email, phone, role, type, businessType, vendedor, dates: { abertura, necesCliente, programadoPara, envioOrcamento } };

            // Call Backend to create folders
            // 8082 Hardcoded to match server
            const _tkC2387 = store.getState().auth?.token;
            const response = await fetch('http://localhost:8082/api/create-ptc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(_tkC2387 ? { 'Authorization': 'Bearer ' + _tkC2387 } : {}) },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const txt = await response.text();
                alert(`Erro de Rede: ${response.status}\n${txt}`);
                throw new Error(`Server returned ${response.status}: ${txt}`);
            }

            const result = await response.json();

            if (result.success) {
                // Extract folder name from path (last segment)
                // Windows path might be double backslashes
                const fullPath = result.path.replace(/\\/g, '/');
                const folderName = fullPath.split('/').pop();

                window.app.currentPtc = {
                    folder: folderName,
                    title: ptcTitle,
                    client: clientName,
                    businessType: businessType,
                    vendedor: vendedor
                };
                store.setState({ currentPtc: window.app.currentPtc });

                this.updateActivePtcBadge();
                this._ensurePipelineItemForPtc(folderName, clientName, ptcTitle, 0, vendedor, tipoProposta);

                alert(`Sucesso! Pasta criada em:\n${result.path}\n\nPTC "${folderName}" selecionada para trabalho.`);
                this.showToast('Estrutura de pastas criada com sucesso!', 'success');
                if (document.getElementById('modal-ptc')) {
                    document.getElementById('modal-ptc').remove();
                }
            } else {
                alert(`Erro do servidor retornou false:\n${result.error}`);
                this.showToast('Erro ao criar pastas: ' + result.error, 'error');
            }

        } catch (err) {
            console.error("ERRO GERAL NO SAVE_PTC:", err);
            alert(`Erro CRÍTICO no Javascript:\n${err.message}\n${err.stack}`);
            this.showToast('Erro crítico no sistema: ' + err.message, 'error');
        }
    },

    confirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const html = `
                <div id="modal-confirm-overlay" class="modal-overlay" style="z-index: 99999;">
                    <div class="modal modal-confirm">
                        <div class="icon-box"><i class="ph ph-warning"></i></div>
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <div class="btns">
                            <button class="btn btn-cancel" id="btn-confirm-cancel">Cancelar</button>
                            <button class="btn btn-primary" id="btn-confirm-ok" style="background: var(--color-danger); border-color: var(--color-danger);">Confirmar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);

            const overlay = document.getElementById('modal-confirm-overlay');
            const btnCancel = document.getElementById('btn-confirm-cancel');
            const btnOk = document.getElementById('btn-confirm-ok');

            const close = (result) => {
                overlay.remove();
                resolve(result);
            };

            btnCancel.onclick = () => close(false);
            btnOk.onclick = () => close(true);
        });
    }
    ,

    async openSearchPtcModal(onCloseCallback) {
        try {
            // Clear any pending callback from previous modal
            window.app._searchPtcOnClose = null;

            const _tkLP2474 = store.getState().auth?.token;
            const res = await fetch('http://localhost:8082/api/list-ptcs', { headers: { ...(_tkLP2474 ? { 'Authorization': 'Bearer ' + _tkLP2474 } : {}) } });
            const data = await res.json();

            if (!data.success) {
                alert('Erro ao listar PTCs: ' + data.error);
                return;
            }

            // Remove existing modal if any
            const existing = document.getElementById('modal-search-ptc');
            if (existing) existing.remove();

            window.app._searchPtcOnClose = typeof onCloseCallback === 'function' ? onCloseCallback : null;
            window.app._allPtcs = data.ptcs || [];

            const ptcOptions = data.ptcs.map(d => `<option value="${d}">${d}</option>`).join('');

            const html = `
                <div id="modal-search-ptc" class="modal-overlay">
                    <div class="modal" style="width: 600px;">
                        <div class="modal-header">
                            <h3 class="card-title">Buscar PTC Existente</h3>
                            <button class="btn btn-ghost" onclick="app.closeSearchPtcModal()"><i class="ph ph-x"></i></button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Filtrar PTC</label>
                                <input type="text" id="search-ptc-filter" class="form-control" placeholder="Digite o número ex: 5331 ou PTC-2026-5331" oninput="app.filterPtcList(this.value)">
                                <div id="search-ptc-feedback" style="font-size:12px;margin-top:4px;color:#64748b;min-height:16px;"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Selecione a PTC</label>
                                <select id="search-ptc-select" class="form-control" onchange="app.loadPtcRevisions(this.value)">
                                    <option value="">Selecione...</option>
                                    ${ptcOptions}
                                </select>
                            </div>
                            
                            <div id="revisions-container" style="margin-top: 20px; display: none;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <h4 style="font-size: 14px; font-weight: 700; color: var(--color-primary);">Revisões Disponíveis</h4>
                                </div>
                                <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                                    <table id="revisions-list-table">
                                        <thead>
                                            <tr>
                                                <th>Revisão</th>
                                                <th>Pasta</th>
                                                <th>Ação Técnica</th>
                                                <th>Ação Comercial</th>
                                            </tr>
                                        </thead>
                                        <tbody id="revisions-list-body"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);

            // Overlay click to close
            const overlay = document.getElementById('modal-search-ptc');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) app.closeSearchPtcModal();
                });
            }

            // ESC key to close
            if (window.app._searchPtcEscHandler) {
                document.removeEventListener('keydown', window.app._searchPtcEscHandler);
            }
            const escHandler = (e) => {
                if (e.key === 'Escape') app.closeSearchPtcModal();
            };
            window.app._searchPtcEscHandler = escHandler;
            document.addEventListener('keydown', escHandler);

        } catch (err) {
            console.error('Error fetching PTCs:', err);
            alert('Erro ao conectar ao servidor.');
        }
    },

    filterPtcList(query) {
        const select = document.getElementById('search-ptc-select');
        const feedback = document.getElementById('search-ptc-feedback');
        if (!select) return;
        const allPtcs = window.app._allPtcs || [];
        select.innerHTML = '<option value="">Selecione...</option>';
        const filtered = query
            ? allPtcs.filter(d => d.toLowerCase().includes(query.toLowerCase()))
            : allPtcs;
        filtered.forEach(d => {
            select.innerHTML += `<option value="${d}">${d}</option>`;
        });
        if (feedback) {
            if (!query) {
                feedback.textContent = '';
            } else if (filtered.length === 0) {
                feedback.textContent = 'Nenhuma PTC encontrado';
                feedback.style.color = '#ef4444';
            } else if (filtered.length === 1) {
                feedback.textContent = '1 PTC encontrado — selecionando automaticamente...';
                feedback.style.color = '#16a34a';
                select.value = filtered[0];
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
            } else {
                feedback.textContent = `${filtered.length} PTCs encontrados`;
                feedback.style.color = '#64748b';
            }
        }
        const container = document.getElementById('revisions-container');
        if (container && (!query || filtered.length !== 1)) {
            container.style.display = 'none';
        }
    },

    closeSearchPtcModal() {
        const m = document.getElementById('modal-search-ptc');
        if (m) m.remove();
        if (window.app._searchPtcEscHandler) {
            document.removeEventListener('keydown', window.app._searchPtcEscHandler);
            window.app._searchPtcEscHandler = null;
        }
        if (window.app._searchPtcOnClose) {
            window.app._searchPtcOnClose();
            window.app._searchPtcOnClose = null;
        }
    },

    async loadPtcRevisions(ptcFolder) {
        if (!ptcFolder) {
            document.getElementById('revisions-container').style.display = 'none';
            return;
        }

        try {
            const _tkR2616 = store.getState().auth?.token;
            const res = await fetch(`http://localhost:8082/api/ptc-revisions-folders?ptc=${encodeURIComponent(ptcFolder)}`, { headers: { ...(_tkR2616 ? { 'Authorization': 'Bearer ' + _tkR2616 } : {}) } });
            const data = await res.json();

            if (!data.success) {
                alert('Erro ao buscar revisões: ' + data.error);
                return;
            }

            const tbody = document.getElementById('revisions-list-body');
            tbody.innerHTML = '';
            
            // Store PTC Info globally to be used by new proposals in this PTC
            window.app.currentPtcInfo = data.info || {};

            if (data.revisions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 10px;">Nenhuma revisão encontrada.</td></tr>';
            } else {
                data.revisions.forEach((revData, index) => {
                    const isLatest = index === 0; // Array is sorted desc (highest rev first)
                    const revNum = revData.rev;
                    const folder = revData.folder;

                    const btnClass = isLatest ? 'btn-primary' : 'btn-secondary';
                    const btnText = isLatest ? '(Atual)' : '(Antiga)';

                    tbody.innerHTML += `
                        <tr>
                            <td>
                                <div style="font-weight: bold; font-size: 1.1em;">${revData.label}</div>
                                ${isLatest ? '<span class="status-badge status-green" style="font-size: 10px; margin-top: 4px; display: inline-block;">Mais Recente</span>' : ''}
                            </td>
                            <td><span class="text-xs text-muted">/${folder}</span></td>
                            <td>
                                <button class="btn btn-sm ${btnClass}" onclick="app.loadProposalVersion('${ptcFolder}', 'PropostaTecnica.json', '${folder}', '${revNum}', ${isLatest})">
                                    <i class="ph ph-file-text"></i> Abrir Técnica ${btnText}
                                </button>
                            </td>
                            <td>
                                <button class="btn btn-sm ${btnClass}" onclick="app.loadProposalVersion('${ptcFolder}', 'PropostaComercial.json', '${folder}', '${revNum}', ${isLatest})">
                                    <i class="ph ph-currency-dollar"></i> Abrir Comercial ${btnText}
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }

            document.getElementById('revisions-container').style.display = 'block';

        } catch (err) {
            console.error('Error fetching revisions:', err);
        }
    },

    async loadProposalVersion(ptcFolder, filename, revisionFolder, revNum, isLatest) {
        if (!isLatest) {
            const confirmed = await this.confirm('ATENÇÃO:\nVocê não está na última Revisão, portanto tome cuidado para não alterar estes arquivos.\nDeseja abri-la mesmo assim?', 'Revisão Antiga Identificada');
            if (!confirmed) return;
        }

        try {
            const _tkALV = store.getState().auth?.token;
            const _hALV = _tkALV ? { 'Authorization': 'Bearer ' + _tkALV } : {};
            const res = await fetch(`http://localhost:8082/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=${encodeURIComponent(filename)}&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hALV });
            let data = await res.json();

            // Store current PTC context EVEN IF content fails to load, so you can save a NEW one in this revision
            const currentPtc = {
                folder: ptcFolder,
                client: data.cliente || '',
                title: data.projeto || '',
                revision: revisionFolder,
                revisionNum: revNum,
                businessType: window.app.currentPtcInfo?.businessType || window.app.currentPtc?.businessType || 'Industrialização',
                vendedor: window.app.currentPtcInfo?.vendedor || window.app.currentPtc?.vendedor || ''
            };
            window.app.currentPtc = currentPtc;
            store.setState({ currentPtc });

            // Clear other module's active proposal to prevent stale data from previous PTC
            if (filename.includes('PropostaTecnica')) {
                store.setState({ activeCommercialProposal: null });
                if (window.app.propostaComercial) window.app.propostaComercial.viewMode = 'list';
            } else if (filename.includes('PropostaComercial')) {
                store.setState({ activeTechnicalProposal: null });
                if (window.app.propostaTecnica) window.app.propostaTecnica.viewMode = 'list';
            }

            this.updateActivePtcBadge();
            if (ptcFolder) {
                this._ensurePipelineItemForPtc(ptcFolder, window.app.currentPtc.client || '', window.app.currentPtc.title || '', 0, window.app.currentPtcInfo?.vendedor || window.app.currentPtc?.vendedor || '');
            }

            // Close search modal safely now
            const m = document.getElementById('modal-search-ptc');
            if (m) m.remove();

            if (!data || Object.keys(data).length === 0 || data.error) {
                let extractedTitle = window.app.currentPtc.title || '';
                
                // If title is empty (happens on new files because data.projeto is undefined), extract from folder name
                if (!extractedTitle && ptcFolder) {
                    const match = ptcFolder.match(/^PTC-\d{4}-\d+-(.+)$/i);
                    if (match && match[1]) {
                        extractedTitle = match[1].trim();
                        window.app.currentPtc.title = extractedTitle;
                    }
                }
                
                // Try to get client and type from the loaded ptc info
                let extractedClient = window.app.currentPtc.client || '';
                let extractedType = window.app.currentPtc.type || '';
                if (window.app.currentPtcInfo) {
                    if (!extractedClient && window.app.currentPtcInfo.clientName) {
                        extractedClient = window.app.currentPtcInfo.clientName;
                        window.app.currentPtc.client = extractedClient;
                    }
                    if (!extractedType && window.app.currentPtcInfo.type) {
                        extractedType = window.app.currentPtcInfo.type;
                        window.app.currentPtc.type = extractedType;
                    }
                    if (window.app.currentPtcInfo.businessType) {
                        window.app.currentPtc.businessType = window.app.currentPtcInfo.businessType;
                    }
                }

                // Inject vendedor from ptc_info.json
                const extractedVendedor = window.app.currentPtcInfo?.vendedor || window.app.currentPtc?.vendedor || '';

                const paddedRev = String(revNum || 0).padStart(2, '0');
                data = {
                    cliente: extractedClient,
                    projeto: extractedTitle,
                    vendedor: extractedVendedor,
                    customCodigoSuffix: `_Rev${paddedRev}`
                };
            } else {
                // Ensure vendedor is set on existing proposals from ptc_info
                if (!data.vendedor && (window.app.currentPtcInfo?.vendedor || window.app.currentPtc?.vendedor)) {
                    data.vendedor = window.app.currentPtcInfo?.vendedor || window.app.currentPtc?.vendedor;
                }
            }

            // Determine type and open correct modal
            if (filename.includes('PropostaTecnica')) {
                if (window.app.propostaTecnica) {
                    app.navigateTo('proposta-tecnica');
                    // Usar edit() para garantir reset completo de estado (activeTab, index, deep copy)
                    window.app.propostaTecnica.edit(data);
                }
        } else if (filename.includes('PropostaComercial')) {
            if (window.app.propostaComercial) {
                app.navigateTo('proposta-comercial');
                window.app.propostaComercial.viewMode = 'form';
                store.setState({ activeCommercialProposal: data });
                window.app.propostaComercial.renderModal(data);
            }
        }

        } catch (err) {
            console.error('Error loading proposal:', err);
            app.toast('Erro ao carregar proposta. (Pode estar vazia na revisão)', 'error');
        }
    },

    async loadPrecificacaoData() {
        // Sempre reseta e re-renderiza ao navegar para Precificação,
        // independente de haver PTC ativa ou arquivo salvo
        if (window.app.precificacao) {
            window.app.precificacao.pricingMap = {};
            window.app.precificacao.calculatedResults = {};
            window.app.precificacao.activeTag = 'SUMMARY';
            window.app.precificacao.lastStateVersion = null;
        }

        if (!window.app.currentPtc || !window.app.currentPtc.folder) {
            if (window.app.precificacao) {
                window.app.precificacao.calculateAll();
                window.app.precificacao.render();
            }
            return;
        }

        const ptcFolder = window.app.currentPtc.folder;
        const revisionFolder = window.app.currentPtc.revision || '';

        try {
            const _tkALP = store.getState().auth?.token;
            const _hALP = _tkALP ? { 'Authorization': 'Bearer ' + _tkALP } : {};
            // Tenta carregar o novo formato (Map por TAG) primeiro
            let res = await fetch(`http://localhost:8082/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=Precificacao_Map.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hALP });
            let data = await res.json();

            // Se não encontrar o Map, tenta o formato antigo (Global)
            if (!data || data.error || Object.keys(data).length === 0) {
                res = await fetch(`http://localhost:8082/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=Precificacao.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hALP });
                data = await res.json();
            }

            if (data && !data.error && window.app.precificacao) {
                window.app.precificacao.loadData(data);
                console.log('[App] Precificação loaded for PTC:', ptcFolder);
                return;
            }
        } catch (err) {
            console.log('[App] Nenhuma precificação salva encontrada para esta PTC.');
        }

        // Se chegou aqui, não havia dados salvos - calcula com defaults
        if (window.app.precificacao) {
            window.app.precificacao.calculateAll();
            window.app.precificacao.render();
        }
    },

    formatProposalCode(origemId, revision) {
        if (!origemId) return '';
        let base = '';
        const newMatch = origemId.match(/^(\d{8,10})/);
        if (newMatch) {
            base = newMatch[1];
        } else {
            const oldMatch = origemId.match(/^(PTC-\d{4}-\d+)/i);
            if (oldMatch) base = oldMatch[1].replace(/-/g, '');
        }
        if (!base) return origemId;
        if (revision !== undefined && revision !== null && revision !== '') {
            const revStr = `_Rev${String(revision).replace(/[^0-9]/g, '').padStart(2, '0')}`;
            return `${base}${revStr}`;
        }
        return base;
    },

    updateActivePtcBadge() {
        const badge = document.getElementById('active-ptc-badge');
        const textEl = document.getElementById('active-ptc-text');

        if (badge && textEl) {
            if (window.app.currentPtc && window.app.currentPtc.folder) {
                const folder = window.app.currentPtc.folder;
                const rev = window.app.currentPtc.revision;
                const state = store.getState();
                const currentView = state.ui?.currentView || '';
                let tipo = '';
                if (currentView === 'proposta-tecnica') tipo = 'PT';
                else if (currentView === 'proposta-comercial') tipo = 'PC';
                else if (currentView === 'proposta-completa') tipo = 'PTC';

                let base = folder;
                const newMatch = folder.match(/^(\d{8,10})/);
                if (newMatch) base = newMatch[1];
                const revNum = window.app.currentPtc.revisionNum;
                const revStr = (revNum !== undefined && revNum !== null)
                    ? `_Rev${String(revNum).padStart(2, '0')}` : '';
                textEl.textContent = tipo ? `${base}-${tipo}${revStr}` : `${base}${revStr}`;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    async loadTemplateOptions() {
        try {
            const token = store.getState().auth?.token;
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`http://${location.hostname}:8082/api/list-templates`, { headers });
            const data = await res.json();
            if (data.success && data.templates) {
                const ids = ['conf-template-tecnica', 'conf-template-comercial', 'conf-template-completa'];
                ids.forEach(id => {
                    const sel = document.getElementById(id);
                    if (!sel) return;
                    const currentVal = sel.value;
                    sel.innerHTML = '<option value="">— Selecione —</option>';
                    data.templates.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.name;
                        opt.textContent = t.name;
                        sel.appendChild(opt);
                    });
                    if (currentVal) sel.value = currentVal;
                });
            }
        } catch (err) {
            console.warn('[App] Erro ao carregar lista de templates:', err);
        }
    },

    uploadTemplate(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.docx';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;
            if (!file.name.endsWith('.docx')) {
                this.showToast('Apenas arquivos .docx são permitidos.', 'warning');
                return;
            }
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64 = e.target.result.split(',')[1];
                    const token = store.getState().auth?.token;
                    const res = await fetch(`http://${location.hostname}:8082/api/templates/upload`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileName: file.name, fileData: base64 })
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.showToast('Template enviado com sucesso!', 'success');
                        // Map type to select id
                        const map = { tecnica: 'conf-template-tecnica', comercial: 'conf-template-comercial', completa: 'conf-template-completa' };
                        const sel = document.getElementById(map[type]);
                        if (sel) sel.value = file.name;
                        this.loadTemplateOptions();
                    } else {
                        this.showToast('Erro no upload: ' + (data.error || 'desconhecido'), 'error');
                    }
                };
                reader.readAsDataURL(file);
            } catch (err) {
                this.showToast('Erro: ' + err.message, 'error');
            }
        };
        input.click();
    },

    async deleteSelectedTemplate(type) {
        const map = { tecnica: 'conf-template-tecnica', comercial: 'conf-template-comercial', completa: 'conf-template-completa' };
        const sel = document.getElementById(map[type]);
        if (!sel || !sel.value) {
            this.showToast('Selecione um template para excluir.', 'warning');
            return;
        }
        const fileName = sel.value;
        const confirmed = await this.confirm(`Excluir o template "${fileName}"? Esta ação não pode ser desfeita.`, 'Excluir Template');
        if (!confirmed) return;
        try {
            const token = store.getState().auth?.token;
            const res = await fetch(`http://${location.hostname}:8082/api/templates/${encodeURIComponent(fileName)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('Template excluído!', 'success');
                sel.value = '';
                this.loadTemplateOptions();
            } else {
                this.showToast('Erro: ' + (data.error || 'desconhecido'), 'error');
            }
        } catch (err) {
            this.showToast('Erro: ' + err.message, 'error');
        }
    },

    formatCurrency(val) {
        if (val === null || val === undefined) return 'R$ 0,00';
        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    formatCurrencyRaw(val) {
        if (val === null || val === undefined) return '0,00';
        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    parseCurrency(val) {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        // Remove separador de milhar (.) e substitui separador decimal (,) por ponto
        const clean = val.toString().replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
        return parseFloat(clean) || 0;
    },

    async syncProposals() {
        console.log("[App] Syncing proposals with filesystem...");
        try {
            const _tkSP2996 = store.getState().auth?.token;
            const response = await fetch('http://localhost:8082/api/list-all-proposals', { headers: { ...(_tkSP2996 ? { 'Authorization': 'Bearer ' + _tkSP2996 } : {}) } });
            if (!response.ok) { console.warn("[App] Sync proposals returned", response.status); return; }
            const data = await response.json();

            if (data.success) {
                console.log(`[App] Synced: ${data.tecnicas.length} technical, ${data.comerciais.length} commercial proposals.`);
                
                // Update store
                store.setState({
                    propostasTecnicas: data.tecnicas,
                    propostasComerciais: data.comerciais
                });
            }
        } catch (error) {
            console.error("[App] Error syncing proposals:", error);
        }
    },

    createPtcSimple(ptcNumber, ptcTitle, clientName) {
        return new Promise((resolve, reject) => {
            const payload = {
                ptcNumber,
                ptcTitle,
                clientName,
                contact: '',
                email: '',
                phone: '',
                role: '',
                type: 'Painel de Baixa Tensão',
                businessType: 'Industrialização',
                dates: {
                    abertura: new Date().toISOString().split('T')[0],
                    necesCliente: '',
                    programadoPara: '',
                    envioOrcamento: ''
                }
            };

            const _tkC3034 = store.getState().auth?.token;
            fetch('http://localhost:8082/api/create-ptc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(_tkC3034 ? { 'Authorization': 'Bearer ' + _tkC3034 } : {}) },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    const fullPath = result.path.replace(/\\/g, '/');
                    const folderName = fullPath.split('/').pop();
                    resolve(folderName);
                } else {
                    reject(new Error(result.error || 'Erro ao criar PTC'));
                }
            })
            .catch(reject);
        });
    },

    async duplicateProposal(sourceType, sourceData, targetPtcFolder, options) {
        try {
            const data = JSON.parse(JSON.stringify(sourceData));
            const now = new Date().toISOString();
            const today = now.split('T')[0];

            data.id = crypto.randomUUID();
            data.createdAt = now;
            data.updatedAt = now;
            data.data_emissao = today;
            data.status = 'Rascunho';

            if (data.codigo) {
                data.codigo = (sourceType === 'tecnica' ? 'PT-' : 'PC-') + Date.now().toString(36).toUpperCase();
            }
            if (data.numero) {
                data.numero = '';
            }
            data.ptc_folder = targetPtcFolder;
            if (data.revisions) data.revisions = [];

            if (options) {
                if (options.cliente) data.cliente = options.cliente;
                if (options.projeto) data.projeto = options.projeto;
                if (options.obra) data.obra = options.obra;
                if (options.objeto) data.objeto = options.objeto;
                if (options.clienteName) data.clienteName = options.clienteName;
            }

            const _tkAPP3079 = store.getState().auth?.token;
            const _authHeaders = _tkAPP3079 ? { 'Authorization': 'Bearer ' + _tkAPP3079, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
            const filename = sourceType === 'tecnica' ? 'PropostaTecnica.json' : 'PropostaComercial.json';
            const res = await fetch('http://localhost:8082/api/save-proposal', {
                method: 'POST',
                headers: _authHeaders,
                body: JSON.stringify({
                    ptcFolder: targetPtcFolder,
                    type: sourceType,
                    content: data,
                    revisionFolder: '0'
                })
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.error || 'Erro ao salvar proposta duplicada');

            if (options && options.includePrecificacao && sourceData._origPtcFolder) {
                try {
                    const precRes = await fetch(`http://localhost:8082/api/load-proposal?ptc=${encodeURIComponent(sourceData._origPtcFolder)}&file=Precificacao_Map.json&revisionFolder=0`, { headers: _authHeaders });
                    const precData = await precRes.json();
                    if (precData && !precData.error) {
                        await fetch('http://localhost:8082/api/save-proposal', {
                            method: 'POST',
                            headers: _authHeaders,
                            body: JSON.stringify({
                                ptcFolder: targetPtcFolder,
                                type: 'tecnica',
                                content: precData,
                                revisionFolder: '0'
                            })
                        });
                    }
                } catch (e) {
                    console.warn('[Duplicate] Precificação não encontrada ou erro ao copiar:', e);
                }
            }

            this.syncProposals();
            return { success: true, folder: targetPtcFolder };
        } catch (error) {
            console.error('[Duplicate] Error:', error);
            this.showToast('Erro ao duplicar proposta: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    },

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
};

// Global accessor - apontar para o App real via __realApp (Proxy no HTML delega chamadas)
window.__realApp = App;
window.__realApp.clientes = {};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
