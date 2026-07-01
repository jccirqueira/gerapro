import { store } from './state.js';

const RelatorioManufatura = {
    reportType: 'andamento',
    filtroDataInicio: '',
    filtroDataFim: '',
    filtroProjeto: '',
    filtroCliente: '',
    filtroStatus: '',
    filtroEtapa: '',
    filtroTipoGaveta: '',
    filtroTeste: '',
    filtroBusca: '',
    _page: 1,
    _pageSize: 20,
    _lastFilteredData: [],
    _debounceTimer: null,
    _documentClickBound: false,

    REPORT_TYPES: [
        { value: 'andamento', icon: 'ph-chart-bar', label: 'Andamento de Projetos', desc: 'Visão geral do progresso dos projetos' },
        { value: 'gavetas', icon: 'ph-tray', label: 'Gavetas & Produção', desc: 'Detalhamento de gavetas por etapa' },
        { value: 'testes', icon: 'ph-flask', label: 'Resultados de Testes', desc: 'Histórico de testes e aprovações' },
        { value: 'bom', icon: 'ph-cpu', label: 'Lista de Componentes', desc: 'Bill of Materials por gaveta' },
        { value: 'historico', icon: 'ph-clock-counter-clockwise', label: 'Histórico de Atividades', desc: 'Auditoria de ações e movimentações' }
    ],

    render() {
        const container = document.getElementById('view-relatorio-manufatura');
        if (!container) return;

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px;">
                            <i class="ph ph-wrench"></i> Relatório de Manufatura
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Relatórios gerenciais e exportação de dados</div>
                    </div>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 24px;">

                    <!-- KPI Summary Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;" id="rel-mf-kpis"></div>

                    <!-- Filter Card -->
                    <div class="card" style="padding: 20px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; color: #475569; font-weight: 600; font-size: 13px;">
                            <i class="ph ph-funnel"></i> Filtros
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Data Criação (início)</label>
                                <input type="date" id="rel-mf-filtro-data-inicio" class="form-control" style="width: 100%; font-size: 12px;">
                            </div>
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Data Criação (fim)</label>
                                <input type="date" id="rel-mf-filtro-data-fim" class="form-control" style="width: 100%; font-size: 12px;">
                            </div>
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Projeto</label>
                                <select id="rel-mf-filtro-projeto" class="form-control" style="width: 100%; font-size: 12px;">
                                    <option value="">Todos os Projetos</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Cliente</label>
                                <select id="rel-mf-filtro-cliente" class="form-control" style="width: 100%; font-size: 12px;">
                                    <option value="">Todos os Clientes</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Status</label>
                                <select id="rel-mf-filtro-status" class="form-control" style="width: 100%; font-size: 12px;">
                                    <option value="">Todos</option>
                                    <option value="em_andamento">Em Andamento</option>
                                    <option value="concluido">Concluído</option>
                                    <option value="parado">Parado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Etapa</label>
                                <select id="rel-mf-filtro-etapa" class="form-control" style="width: 100%; font-size: 12px;">
                                    <option value="">Todas</option>
                                    <option value="inicio">Início</option>
                                    <option value="montagem_mecanica">Montagem Mecânica</option>
                                    <option value="fiacao">Fiação</option>
                                    <option value="teste">Teste</option>
                                    <option value="liberado">Liberado</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Tipo Gaveta</label>
                                <select id="rel-mf-filtro-tipo-gaveta" class="form-control" style="width: 100%; font-size: 12px;">
                                    <option value="">Todos</option>
                                    <option value="partida_direta">Partida Direta</option>
                                    <option value="soft_starter">Soft-Starter</option>
                                    <option value="inversor">Inversor</option>
                                    <option value="relé">Relé</option>
                                    <option value="CLP">CLP</option>
                                    <option value="instrumentação">Instrumentação</option>
                                    <option value="reserva">Reserva</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 11px; color: #64748b; display: block; margin-bottom: 3px;">Resultado Teste</label>
                                <select id="rel-mf-filtro-teste" class="form-control" style="width: 100%; font-size: 12px;">
                                    <option value="">Todos</option>
                                    <option value="pass">Aprovado</option>
                                    <option value="fail">Reprovado</option>
                                    <option value="pendente">Pendente</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; margin-top: 12px; align-items: center; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 200px;">
                                <input type="text" id="rel-mf-filtro-busca" class="form-control" placeholder="Buscar em todos os campos..." style="width: 100%; font-size: 12px;">
                            </div>
                            <button id="rel-mf-btn-aplicar" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px;">
                                <i class="ph ph-magnifying-glass"></i> Aplicar
                            </button>
                            <button id="rel-mf-btn-limpar" class="btn btn-ghost btn-sm" style="display: flex; align-items: center; gap: 6px;">
                                <i class="ph ph-x"></i> Limpar
                            </button>
                        </div>
                        <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;" id="rel-mf-filter-summary"></div>
                    </div>

                    <!-- Report Type Selector -->
                    <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;" id="rel-mf-type-tabs"></div>

                    <!-- Action Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                        <div style="font-size: 13px; color: #475569; font-weight: 600;" id="rel-mf-count">Carregando...</div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <div id="rel-mf-export-wrapper" style="position: relative; display: inline-block;">
                                <button id="rel-mf-btn-exportar" class="btn btn-outline btn-sm" style="display: flex; align-items: center; gap: 6px;">
                                    <i class="ph ph-download"></i> Exportar <span style="font-size: 10px;">▾</span>
                                </button>
                                <div id="rel-mf-export-dropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 4px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 100; min-width: 160px; overflow: hidden;">
                                    <button id="rel-mf-export-xls" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; text-align: left; color: #1e293b;">
                                        <i class="ph ph-file-xls" style="color: var(--color-accent);"></i> XLSX (Excel)
                                    </button>
                                    <button id="rel-mf-export-csv" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; text-align: left; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
                                        <i class="ph ph-file-csv" style="color: #2563eb;"></i> CSV
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;" id="rel-mf-thead"></tr>
                                </thead>
                                <tbody id="rel-mf-tbody">
                                    <tr>
                                        <td colspan="10" style="padding: 40px; text-align: center; color: #94a3b8;">
                                            <i class="ph ph-spinner" style="font-size: 24px; animation: spin 1s linear infinite; display: inline-block;"></i>
                                            <br><br>Carregando...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 16px; font-size: 12px;" id="rel-mf-pagination"></div>

                </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                #rel-mf-tbody tr:hover { background: #f8faff; }
                #rel-mf-tbody tr td { padding: 9px 14px; border-bottom: 1px solid #f1f5f9; }
                #rel-mf-tbody tr td:first-child { padding-left: 18px; }
                #rel-mf-thead th { padding: 11px 14px; text-align: left; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; cursor: pointer; user-select: none; white-space: nowrap; }
                #rel-mf-thead th:hover { color: #1e293b; }
                .rel-mf-type-btn { padding: 7px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
                .rel-mf-type-btn:hover { border-color: #3b82f6; color: #1e293b; background: #eff6ff; }
                .rel-mf-type-btn.active { border-color: #3b82f6; background: #3b82f6; color: white; }
                .rel-mf-pag-btn { padding: 5px 10px; border: 1px solid #e2e8f0; border-radius: 5px; background: white; cursor: pointer; font-size: 11px; color: #475569; }
                .rel-mf-pag-btn:hover { background: #f1f5f9; }
                .rel-mf-pag-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
                .rel-mf-pag-btn:disabled { opacity: 0.4; cursor: default; }
                .rel-mf-kpi-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
                .rel-mf-kpi-card .value { font-size: 24px; font-weight: 700; color: #1e293b; }
                .rel-mf-kpi-card .label { font-size: 11px; color: #64748b; margin-top: 2px; }
                .rel-mf-kpi-card .icon { font-size: 20px; margin-bottom: 4px; }
                .badge-pass { display: inline-block; padding: 1px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; background: #dcfce7; color: #166534; }
                .badge-fail { display: inline-block; padding: 1px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; background: #fee2e2; color: #991b1b; }
                .badge-pendente { display: inline-block; padding: 1px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; background: #f1f5f9; color: #64748b; }
            </style>
        `;

        this.bindEvents();
        this.loadFilterOptions();
        this.applyFilters();
        this._updateKPIs();
    },

    getReportTypeLabel() {
        const found = this.REPORT_TYPES.find(t => t.value === this.reportType);
        return found ? found.label : 'Relatório';
    },

    bindEvents() {
        document.getElementById('rel-mf-btn-aplicar')?.addEventListener('click', () => {
            this._readFilters();
            this._page = 1;
            this.applyFilters();
        });

        document.getElementById('rel-mf-btn-limpar')?.addEventListener('click', () => {
            this.filtroDataInicio = '';
            this.filtroDataFim = '';
            this.filtroProjeto = '';
            this.filtroCliente = '';
            this.filtroStatus = '';
            this.filtroEtapa = '';
            this.filtroTipoGaveta = '';
            this.filtroTeste = '';
            this.filtroBusca = '';
            document.querySelectorAll('#rel-mf-filtro-data-inicio, #rel-mf-filtro-data-fim, #rel-mf-filtro-busca').forEach(el => el.value = '');
            document.querySelectorAll('#rel-mf-filtro-projeto, #rel-mf-filtro-cliente, #rel-mf-filtro-status, #rel-mf-filtro-etapa, #rel-mf-filtro-tipo-gaveta, #rel-mf-filtro-teste').forEach(el => el.value = '');
            this._page = 1;
            this.applyFilters();
        });

        document.getElementById('rel-mf-filtro-busca')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this._readFilters();
                this._page = 1;
                this.applyFilters();
            }
        });

        document.getElementById('rel-mf-btn-exportar')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const dd = document.getElementById('rel-mf-export-dropdown');
            if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
        });

        document.getElementById('rel-mf-export-xls')?.addEventListener('click', () => {
            document.getElementById('rel-mf-export-dropdown').style.display = 'none';
            this.exportXLS();
        });

        document.getElementById('rel-mf-export-csv')?.addEventListener('click', () => {
            document.getElementById('rel-mf-export-dropdown').style.display = 'none';
            this.exportCSV();
        });

        if (!this._documentClickBound) {
            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('rel-mf-export-wrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    const dd = document.getElementById('rel-mf-export-dropdown');
                    if (dd) dd.style.display = 'none';
                }
            });
            this._documentClickBound = true;
        }
    },

    _readFilters() {
        this.filtroDataInicio = document.getElementById('rel-mf-filtro-data-inicio')?.value || '';
        this.filtroDataFim = document.getElementById('rel-mf-filtro-data-fim')?.value || '';
        this.filtroProjeto = document.getElementById('rel-mf-filtro-projeto')?.value || '';
        this.filtroCliente = document.getElementById('rel-mf-filtro-cliente')?.value || '';
        this.filtroStatus = document.getElementById('rel-mf-filtro-status')?.value || '';
        this.filtroEtapa = document.getElementById('rel-mf-filtro-etapa')?.value || '';
        this.filtroTipoGaveta = document.getElementById('rel-mf-filtro-tipo-gaveta')?.value || '';
        this.filtroTeste = document.getElementById('rel-mf-filtro-teste')?.value || '';
        this.filtroBusca = document.getElementById('rel-mf-filtro-busca')?.value?.trim() || '';
    },

    loadFilterOptions() {
        const state = store.getState();
        const projetos = state.manufaturaProjetos || [];
        const clientes = [...new Set(projetos.map(p => p.cliente).filter(Boolean))].sort();

        const projSelect = document.getElementById('rel-mf-filtro-projeto');
        const cliSelect = document.getElementById('rel-mf-filtro-cliente');
        if (projSelect) {
            projSelect.innerHTML = '<option value="">Todos os Projetos</option>' +
                projetos.map(p => `<option value="${p.id}">${this._escapeHtml(p.nome || 'Sem nome')}</option>`).join('');
        }
        if (cliSelect) {
            cliSelect.innerHTML = '<option value="">Todos os Clientes</option>' +
                clientes.map(c => `<option value="${c}">${this._escapeHtml(c)}</option>`).join('');
        }
    },

    _updateKPIs() {
        const state = store.getState();
        const projetos = state.manufaturaProjetos || [];
        const gavetas = state.manufaturaGavetas || [];
        const colunas = state.manufaturaColunas || [];
        const resultados = state.manufaturaResultadosTeste || [];
        const aprovados = resultados.filter(r => r.status === 'pass').length;
        const colunasAtivas = new Set(colunas.map(c => c.projeto_id)).size;
        const gavetasEmTeste = gavetas.filter(g => g.etapa === 'teste').length;
        const gavetasLiberadas = gavetas.filter(g => g.etapa === 'liberado').length;

        const kpis = [
            { icon: 'ph-wrench', value: projetos.length, label: 'Projetos', color: '#3b82f6' },
            { icon: 'ph-grid-nine', value: colunasAtivas, label: 'Projetos c/ Colunas', color: '#8b5cf6' },
            { icon: 'ph-tray', value: gavetas.length, label: 'Gavetas', color: '#10b981' },
            { icon: 'ph-flask', value: aprovados, label: 'Testes Aprovados', color: '#f59e0b' },
            { icon: 'ph-check-circle', value: gavetasLiberadas, label: 'Liberadas', color: '#06b6d4' },
            { icon: 'ph-hourglass', value: gavetasEmTeste, label: 'Em Teste', color: '#ef4444' }
        ];

        const container = document.getElementById('rel-mf-kpis');
        if (!container) return;

        container.innerHTML = kpis.map(k => `
            <div class="rel-mf-kpi-card">
                <div class="icon"><i class="ph ${k.icon}" style="color: ${k.color};"></i></div>
                <div class="value" style="color: ${k.color};">${k.value}</div>
                <div class="label">${k.label}</div>
            </div>
        `).join('');
    },

    applyFilters() {
        const state = store.getState();
        const projetos = state.manufaturaProjetos || [];
        const colunas = state.manufaturaColunas || [];
        const gavetas = state.manufaturaGavetas || [];
        const componentes = state.manufaturaComponentes || [];
        const resultados = state.manufaturaResultadosTeste || [];
        const historico = state.manufaturaHistorico || [];

        const colunasPorProjeto = {};
        colunas.forEach(c => {
            if (!colunasPorProjeto[c.projeto_id]) colunasPorProjeto[c.projeto_id] = [];
            colunasPorProjeto[c.projeto_id].push(c);
        });
        const gavetasPorColuna = {};
        gavetas.forEach(g => {
            if (!gavetasPorColuna[g.coluna_id]) gavetasPorColuna[g.coluna_id] = [];
            gavetasPorColuna[g.coluna_id].push(g);
        });
        const compsPorGaveta = {};
        componentes.forEach(co => {
            if (!compsPorGaveta[co.gaveta_id]) compsPorGaveta[co.gaveta_id] = [];
            compsPorGaveta[co.gaveta_id].push(co);
        });
        const resultadosPorGaveta = {};
        resultados.forEach(r => {
            if (!resultadosPorGaveta[r.gaveta_id]) resultadosPorGaveta[r.gaveta_id] = [];
            resultadosPorGaveta[r.gaveta_id].push(r);
        });

        const projMap = {};
        projetos.forEach(p => { projMap[p.id] = p; });
        const colMap = {};
        colunas.forEach(c => { colMap[c.id] = c; });

        let filteredData = [];

        if (this.reportType === 'andamento') {
            filteredData = projetos.filter(p => {
                if (this.filtroProjeto && p.id !== this.filtroProjeto) return false;
                if (this.filtroCliente && p.cliente !== this.filtroCliente) return false;
                if (this.filtroStatus && p.status !== this.filtroStatus) return false;
                if (this.filtroEtapa && p.etapa !== this.filtroEtapa) return false;
                if (this.filtroDataInicio && (!p.created_at || p.created_at.slice(0, 10) < this.filtroDataInicio)) return false;
                if (this.filtroDataFim && (!p.created_at || p.created_at.slice(0, 10) > this.filtroDataFim)) return false;
                if (this.filtroBusca) {
                    const t = this.filtroBusca.toLowerCase();
                    const fields = [p.nome, p.cliente, p.status, p.id].filter(Boolean);
                    if (!fields.some(f => f.toLowerCase().includes(t))) return false;
                }
                return true;
            }).map(p => {
                const pColunas = colunasPorProjeto[p.id] || [];
                const pGavetas = pColunas.reduce((acc, c) => acc.concat(gavetasPorColuna[c.id] || []), []);
                const pComps = pGavetas.reduce((acc, g) => acc.concat(compsPorGaveta[g.id] || []), []);
                const pTestes = pGavetas.reduce((acc, g) => acc.concat(resultadosPorGaveta[g.id] || []), []);
                const aprovados = pTestes.filter(r => r.status === 'pass').length;
                const totalGavs = pGavetas.length;
                const liberadas = pGavetas.filter(g => g.etapa === 'liberado').length;
                const pct = totalGavs > 0 ? Math.round((liberadas / totalGavs) * 100) : 0;
                return [
                    p.nome || 'Sem nome',
                    p.cliente || '-',
                    this._statusLabel(p.status),
                    this._etapaLabel(p.etapa || p.status),
                    pColunas.length,
                    totalGavs,
                    pComps.length,
                    aprovados + '/' + pTestes.length,
                    pct + '%',
                    this._formatDate(p.data_criacao || p.created_at),
                    this._formatDate(p.updated_at)
                ];
            });
        } else if (this.reportType === 'gavetas') {
            filteredData = [];
            gavetas.forEach(g => {
                const col = colMap[g.coluna_id];
                const proj = col ? projMap[col.projeto_id] : null;
                if (!proj) return;
                if (this.filtroProjeto && proj.id !== this.filtroProjeto) return;
                if (this.filtroCliente && proj.cliente !== this.filtroCliente) return;
                if (this.filtroStatus && proj.status !== this.filtroStatus) return;
                if (this.filtroEtapa && g.etapa !== this.filtroEtapa) return;
                if (this.filtroTipoGaveta && g.tipo !== this.filtroTipoGaveta) return;
                if (this.filtroDataInicio && (!g.created_at || g.created_at.slice(0, 10) < this.filtroDataInicio)) return;
                if (this.filtroDataFim && (!g.created_at || g.created_at.slice(0, 10) > this.filtroDataFim)) return;
                if (this.filtroBusca) {
                    const t = this.filtroBusca.toLowerCase();
                    const fields = [g.tag, g.modelo, g.tipo, col?.tag, proj?.nome].filter(Boolean);
                    if (!fields.some(f => f.toLowerCase().includes(t))) return;
                }
                if (this.reportType === 'gavetas') {
                    const gTestes = resultadosPorGaveta[g.id] || [];
                    const ultimo = gTestes.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0];
                    if (this.filtroTeste) {
                        const testStatus = ultimo?.status || 'pendente';
                        if (this.filtroTeste !== testStatus) return;
                    }
                    filteredData.push([
                        proj.nome || 'Sem nome',
                        col?.tag || '-',
                        g.tag || '-',
                        this._tipoLabel(g.tipo),
                        g.modelo || '-',
                        g.potencia_kw ? g.potencia_kw + ' kW' : '-',
                        this._etapaLabel(g.etapa),
                        ultimo ? this._testBadge(ultimo.status) : this._testBadge('pendente'),
                        ultimo?.operador || '-',
                        ultimo?.data_teste ? this._formatDate(ultimo.data_teste) : '-'
                    ]);
                }
            });
        } else if (this.reportType === 'testes') {
            filteredData = [];
            resultados.forEach(r => {
                const gav = gavetas.find(g => g.id === r.gaveta_id);
                if (!gav) return;
                const col = colMap[gav.coluna_id];
                const proj = col ? projMap[col.projeto_id] : null;
                if (!proj) return;
                if (this.filtroProjeto && proj.id !== this.filtroProjeto) return;
                if (this.filtroCliente && proj.cliente !== this.filtroCliente) return;
                if (this.filtroStatus && proj.status !== this.filtroStatus) return;
                if (this.filtroTipoGaveta && gav.tipo !== this.filtroTipoGaveta) return;
                if (this.filtroTeste && r.status !== this.filtroTeste) return;
                if (this.filtroDataInicio && (!r.created_at || r.created_at.slice(0, 10) < this.filtroDataInicio)) return;
                if (this.filtroDataFim && (!r.created_at || r.created_at.slice(0, 10) > this.filtroDataFim)) return;
                if (this.filtroBusca) {
                    const t = this.filtroBusca.toLowerCase();
                    const fields = [gav.tag, r.operador, r.observacoes, col?.tag, proj?.nome].filter(Boolean);
                    if (!fields.some(f => f.toLowerCase().includes(t))) return;
                }
                const perfil = this._getPerfilNome(r.perfil_id);
                filteredData.push([
                    proj.nome || 'Sem nome',
                    col?.tag || '-',
                    gav.tag || '-',
                    this._tipoLabel(gav.tipo),
                    this._testBadge(r.status),
                    r.operador || '-',
                    r.data_teste ? this._formatDate(r.data_teste) : '-',
                    perfil,
                    r.observacoes || '-'
                ]);
            });
        } else if (this.reportType === 'bom') {
            filteredData = [];
            componentes.forEach(co => {
                const gav = gavetas.find(g => g.id === co.gaveta_id);
                if (!gav) return;
                const col = colMap[gav.coluna_id];
                const proj = col ? projMap[col.projeto_id] : null;
                if (!proj) return;
                if (this.filtroProjeto && proj.id !== this.filtroProjeto) return;
                if (this.filtroCliente && proj.cliente !== this.filtroCliente) return;
                if (this.filtroStatus && proj.status !== this.filtroStatus) return;
                if (this.filtroTipoGaveta && gav.tipo !== this.filtroTipoGaveta) return;
                if (this.filtroBusca) {
                    const t = this.filtroBusca.toLowerCase();
                    const fields = [co.codigo, co.fabricante, co.tipo, gav.tag, col?.tag, proj?.nome].filter(Boolean);
                    if (!fields.some(f => f.toLowerCase().includes(t))) return;
                }
                filteredData.push([
                    proj.nome || 'Sem nome',
                    col?.tag || '-',
                    gav.tag || '-',
                    co.tipo || '-',
                    co.codigo || '-',
                    co.fabricante || '-',
                    co.quantidade || 1,
                    co.observacoes || ''
                ]);
            });
        } else if (this.reportType === 'historico') {
            filteredData = [];
            historico.forEach(h => {
                let projNome = '-';
                if (h.entidade_tipo === 'gaveta') {
                    const gav = gavetas.find(g => g.id === h.entidade_id);
                    if (gav) {
                        const col = colMap[gav.coluna_id];
                        if (col) {
                            const proj = projMap[col.projeto_id];
                            if (proj) projNome = proj.nome || '-';
                        }
                    }
                } else if (h.entidade_tipo === 'coluna') {
                    const col = colMap[h.entidade_id];
                    if (col) {
                        const proj = projMap[col.projeto_id];
                        if (proj) projNome = proj.nome || '-';
                    }
                } else if (h.entidade_tipo === 'projeto') {
                    const proj = projMap[h.entidade_id];
                    if (proj) projNome = proj.nome || '-';
                }
                if (this.filtroProjeto && projNome === '-') return;
                if (this.filtroProjeto && !this._anyProjMatch(projNome, this.filtroProjeto, projMap)) return;
                if (this.filtroDataInicio && (!h.created_at || h.created_at.slice(0, 10) < this.filtroDataInicio)) return;
                if (this.filtroDataFim && (!h.created_at || h.created_at.slice(0, 10) > this.filtroDataFim)) return;
                if (this.filtroBusca) {
                    const t = this.filtroBusca.toLowerCase();
                    const fields = [h.acao, h.usuario, h.entidade_tipo, h.entidade_id].filter(Boolean);
                    if (!fields.some(f => f.toLowerCase().includes(t))) return;
                }
                filteredData.push([
                    projNome,
                    h.entidade_tipo || '-',
                    h.entidade_id || '-',
                    h.acao || '-',
                    h.usuario || '-',
                    h.created_at ? this._formatDateTime(h.created_at) : '-'
                ]);
            });
        }

        this._lastFilteredData = filteredData;
        this._page = 1;
        this.renderTable(filteredData);
        this._renderPagination(filteredData);

        const count = document.getElementById('rel-mf-count');
        if (count) count.textContent = `${filteredData.length} registro(s) encontrado(s)`;

        const summary = document.getElementById('rel-mf-filter-summary');
        if (summary) {
            const parts = [];
            if (this.filtroDataInicio) parts.push(`Data início: ${this.filtroDataInicio}`);
            if (this.filtroDataFim) parts.push(`Data fim: ${this.filtroDataFim}`);
            if (this.filtroProjeto) {
                const p = projMap[this.filtroProjeto];
                if (p) parts.push(`Projeto: ${p.nome}`);
            }
            if (this.filtroCliente) parts.push(`Cliente: ${this.filtroCliente}`);
            if (this.filtroStatus) parts.push(`Status: ${this._statusLabel(this.filtroStatus)}`);
            if (this.filtroEtapa) parts.push(`Etapa: ${this._etapaLabel(this.filtroEtapa)}`);
            if (this.filtroTipoGaveta) parts.push(`Tipo Gaveta: ${this._tipoLabel(this.filtroTipoGaveta)}`);
            if (this.filtroTeste) parts.push(`Teste: ${this._testeLabel(this.filtroTeste)}`);
            if (this.filtroBusca) parts.push(`Busca: "${this._escapeHtml(this.filtroBusca)}"`);
            summary.textContent = parts.length > 0 ? 'Filtros: ' + parts.join(' | ') : '';
        }

        this._renderTypeTabs();
    },

    _anyProjMatch(projNome, projId, projMap) {
        const p = projMap[projId];
        return p && projNome === p.nome;
    },

    _getPerfilNome(perfilId) {
        if (!perfilId) return '-';
        const state = store.getState();
        const perfis = state.manufaturaPerfisTeste || [];
        const p = perfis.find(x => x.id === perfilId);
        return p ? p.nome : perfilId;
    },

    _renderTypeTabs() {
        const container = document.getElementById('rel-mf-type-tabs');
        if (!container) return;
        container.innerHTML = this.REPORT_TYPES.map(t => `
            <button class="rel-mf-type-btn ${this.reportType === t.value ? 'active' : ''}" data-type="${t.value}">
                <i class="ph ${t.icon}"></i> ${t.label}
            </button>
        `).join('');
        container.querySelectorAll('.rel-mf-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.reportType = btn.dataset.type;
                this._page = 1;
                this.applyFilters();
            });
        });
    },

    getColumns() {
        const cols = {
            andamento: [
                { key: 0, label: 'Projeto' },
                { key: 1, label: 'Cliente' },
                { key: 2, label: 'Status' },
                { key: 3, label: 'Etapa' },
                { key: 4, label: 'Colunas' },
                { key: 5, label: 'Gavetas' },
                { key: 6, label: 'Componentes' },
                { key: 7, label: 'Testes (Apv/Total)' },
                { key: 8, label: '% Liberado' },
                { key: 9, label: 'Criação' },
                { key: 10, label: 'Atualização' }
            ],
            gavetas: [
                { key: 0, label: 'Projeto' },
                { key: 1, label: 'Coluna' },
                { key: 2, label: 'Gaveta' },
                { key: 3, label: 'Tipo' },
                { key: 4, label: 'Modelo' },
                { key: 5, label: 'Potência' },
                { key: 6, label: 'Etapa' },
                { key: 7, label: 'Último Teste' },
                { key: 8, label: 'Operador' },
                { key: 9, label: 'Data Teste' }
            ],
            testes: [
                { key: 0, label: 'Projeto' },
                { key: 1, label: 'Coluna' },
                { key: 2, label: 'Gaveta' },
                { key: 3, label: 'Tipo' },
                { key: 4, label: 'Resultado' },
                { key: 5, label: 'Operador' },
                { key: 6, label: 'Data Teste' },
                { key: 7, label: 'Perfil' },
                { key: 8, label: 'Observações' }
            ],
            bom: [
                { key: 0, label: 'Projeto' },
                { key: 1, label: 'Coluna' },
                { key: 2, label: 'Gaveta' },
                { key: 3, label: 'Tipo Comp.' },
                { key: 4, label: 'Código' },
                { key: 5, label: 'Fabricante' },
                { key: 6, label: 'Qtd' },
                { key: 7, label: 'Observações' }
            ],
            historico: [
                { key: 0, label: 'Projeto' },
                { key: 1, label: 'Entidade' },
                { key: 2, label: 'ID' },
                { key: 3, label: 'Ação' },
                { key: 4, label: 'Usuário' },
                { key: 5, label: 'Data' }
            ]
        };
        return cols[this.reportType] || cols.andamento;
    },

    renderTable(data) {
        const thead = document.getElementById('rel-mf-thead');
        const tbody = document.getElementById('rel-mf-tbody');
        if (!thead || !tbody) return;

        const columns = this.getColumns();
        thead.innerHTML = `<tr>${columns.map(c => `<th data-col="${c.key}">${c.label}</th>`).join('')}</tr>`;

        const start = (this._page - 1) * this._pageSize;
        const pageData = data.slice(start, start + this._pageSize);

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length}" style="padding: 40px; text-align: center; color: #94a3b8;">
                <i class="ph ph-magnifying-glass" style="font-size: 24px;"></i>
                <br><br>Nenhum registro encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = pageData.map(row => {
            const cells = row.map((val, i) => {
                if (this.reportType === 'gavetas' && i === 7) return `<td>${val || '-'}</td>`;
                return `<td>${val !== undefined && val !== '' ? val : '-'}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
    },

    _renderPagination(data) {
        const container = document.getElementById('rel-mf-pagination');
        if (!container) return;
        const totalPages = Math.max(1, Math.ceil(data.length / this._pageSize));
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        let html = `<button class="rel-mf-pag-btn" data-page="${this._page - 1}" ${this._page <= 1 ? 'disabled' : ''}><i class="ph ph-caret-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - this._page) <= 2) {
                html += `<button class="rel-mf-pag-btn ${i === this._page ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (Math.abs(i - this._page) === 3) {
                html += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
            }
        }
        html += `<button class="rel-mf-pag-btn" data-page="${this._page + 1}" ${this._page >= totalPages ? 'disabled' : ''}><i class="ph ph-caret-right"></i></button>`;

        container.innerHTML = html;
        container.querySelectorAll('button.rel-mf-pag-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                this._page = parseInt(btn.dataset.page);
                this.renderTable(data);
                this._renderPagination(data);
                container.querySelector('.rel-mf-pag-btn.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
        });
    },

    _exportData() {
        if (!this._lastFilteredData || this._lastFilteredData.length === 0) return null;
        const columns = this.getColumns();
        const headers = columns.map(c => c.label);
        const rows = this._lastFilteredData.map(row =>
            columns.map(col => {
                const val = row[col.key];
                if (val === undefined || val === null) return '';
                return String(val).replace(/<[^>]*>/g, '').trim();
            })
        );
        return { headers, rows };
    },

    exportCSV() {
        const sep = ',';
        const data = this._exportData();
        if (!data) {
            window.app.toast('Nenhum dado para exportar.', 'warning');
            return;
        }
        const BOM = '\uFEFF';
        const allRows = [data.headers, ...data.rows];
        const csv = BOM + allRows.map(r => r.map(v => {
            if (v.includes(sep) || v.includes('"') || v.includes('\n')) return '"' + v.replace(/"/g, '""') + '"';
            return v;
        }).join(sep)).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const suffix = sep === ';' ? 'csv_semicolon' : 'csv';
        a.download = `manufatura_${this.reportType}_${new Date().toISOString().slice(0, 10)}.${suffix === 'csv_semicolon' ? 'csv' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.app.toast(`${suffix === 'csv_semicolon' ? 'CSV (ponto e vírgula)' : 'CSV'} exportado com sucesso.`, 'success');
    },

    exportXLS() {
        const data = this._exportData();
        if (!data) {
            window.app.toast('Nenhum dado para exportar.', 'warning');
            return;
        }
        if (typeof XLSX === 'undefined') {
            window.app.toast('Biblioteca XLSX não disponível.', 'error');
            return;
        }
        const allRows = [data.headers, ...data.rows];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(allRows);

        ws['!cols'] = data.headers.map(() => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(wb, ws, this.getReportTypeLabel().slice(0, 31));
        XLSX.writeFile(wb, `manufatura_${this.reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        window.app.toast('XLSX exportado com sucesso.', 'success');
    },

    _statusLabel(s) {
        const map = { em_andamento: 'Em Andamento', concluido: 'Concluído', parado: 'Parado', cancelado: 'Cancelado' };
        return map[s] || s || '-';
    },

    _etapaLabel(e) {
        const map = { inicio: 'Início', montagem_mecanica: 'Mont. Mec.', fiacao: 'Fiação', teste: 'Teste', liberado: 'Liberado' };
        return map[e] || e || '-';
    },

    _tipoLabel(t) {
        return t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
    },

    _testeLabel(t) {
        const map = { pass: 'Aprovado', fail: 'Reprovado', pendente: 'Pendente' };
        return map[t] || t || '-';
    },

    _testBadge(status) {
        if (status === 'pass') return '<span class="badge-pass">APROVADO</span>';
        if (status === 'fail') return '<span class="badge-fail">REPROVADO</span>';
        return '<span class="badge-pendente">PENDENTE</span>';
    },

    _formatDate(d) {
        if (!d) return '-';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        return dt.toLocaleDateString('pt-BR');
    },

    _formatDateTime(d) {
        if (!d) return '-';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        return dt.toLocaleString('pt-BR');
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};

window.relatorioManufaturaModule = RelatorioManufatura;
