import { store } from './state.js';

const RelatorioCadastros = {
    currentEntity: 'clientes',
    filterText: '',
    filterExtra1: '',
    filterExtra2: '',
    _documentClickBound: false,
    _debounceTimer: null,
    _materiaisCache: null,
    _materiaisCacheVersion: -1,
    _searchPage: 1,
    _searchPages: 0,
    _searchTotal: 0,
    _searchLimit: 100,
    _isLoading: false,

    render() {
        const container = document.getElementById('view-relatorio-cadastros');
        if (!container) return;

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-clipboard-text"></i> Relatório de Cadastros
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Relatórios de clientes, fornecedores e materiais cadastrados</div>
                    </div>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 24px;">
                <div class="card" style="padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                        <div style="display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px;">
                            <button class="btn-entity" data-entity="clientes" style="padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                <i class="ph ph-users"></i> Clientes
                            </button>
                            <button class="btn-entity" data-entity="fornecedores" style="padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                <i class="ph ph-truck"></i> Fornecedores
                            </button>
                            <button class="btn-entity" data-entity="materiais" style="padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                <i class="ph ph-package"></i> Materiais
                            </button>
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                            <input type="text" id="rel-cad-filtro-texto" placeholder="Buscar..." style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;">
                        </div>
                        <div>
                            <select id="rel-cad-filtro-extra1" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; background: white; min-width: 160px;">
                                <option value="">Todos</option>
                            </select>
                        </div>
                        <div>
                            <select id="rel-cad-filtro-extra2" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; background: white; min-width: 160px;">
                                <option value="">Todos</option>
                            </select>
                        </div>
                        <button id="rel-cad-btn-gerar" class="btn btn-primary" style="display: flex; align-items: center; gap: 6px; padding: 8px 20px;">
                            <i class="ph ph-file-arrow-down"></i> Gerar Relatório
                        </button>
                        <div id="rel-cad-export-wrapper" style="position: relative; display: inline-block;">
                            <button id="rel-cad-btn-exportar" class="btn btn-outline" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px;">
                                <i class="ph ph-download"></i> Exportar <span style="font-size: 10px; margin-left: 2px;">▾</span>
                            </button>
                            <div id="rel-cad-export-dropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 4px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 100; min-width: 140px; overflow: hidden;">
                                <button id="rel-cad-export-csv" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; text-align: left; color: #1e293b;">
                                    <i class="ph ph-file-csv" style="color: #2563eb;"></i> CSV
                                </button>
                                <button id="rel-cad-export-xls" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; text-align: left; color: #1e293b;">
                                    <i class="ph ph-file-xls" style="color: var(--color-accent);"></i> XLS (Excel)
                                </button>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; font-size: 12px; color: #64748b;" id="rel-cad-count"></div>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;" id="rel-cad-thead"></tr>
                            </thead>
                            <tbody id="rel-cad-tbody">
                                <tr>
                                    <td colspan="8" style="padding: 40px; text-align: center; color: #94a3b8;">
                                        <i class="ph ph-spinner" style="font-size: 24px; animation: spin 1s linear infinite; display: inline-block;"></i>
                                        <br><br>Carregando...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="rel-cad-pagination" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;"></div>
                </div>
            </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                .btn-entity { transition: all 0.2s ease; }
                .btn-entity:hover { opacity: 0.85; }
                #rel-cad-tbody tr:hover { background: #f8faff; }
                #rel-cad-tbody tr td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
            </style>
        `;

        this.bindEvents();
        this.updateEntityUI();
        this.loadData();
    },

    getEntityLabel() {
        return { clientes: 'Clientes', fornecedores: 'Fornecedores', materiais: 'Materiais' }[this.currentEntity] || 'Cadastros';
    },

    updateEntityUI() {
        document.querySelectorAll('.btn-entity').forEach(btn => {
            const isActive = btn.dataset.entity === this.currentEntity;
            btn.style.background = isActive ? 'var(--color-accent)' : 'transparent';
            btn.style.color = isActive ? 'white' : '#64748b';
        });

        const extra1 = document.getElementById('rel-cad-filtro-extra1');
        const extra2 = document.getElementById('rel-cad-filtro-extra2');
        if (!extra1 || !extra2) return;

        const state = store.getState();
        let opts1 = [], opts2 = [];
        const label1 = document.querySelector('label[for="rel-cad-filtro-extra1"]');

        if (this.currentEntity === 'clientes' || this.currentEntity === 'fornecedores') {
            const data = this.currentEntity === 'clientes' ? state.clientes : state.fornecedores;
            const segmentos = [...new Set(data.map(d => d.segmento).filter(Boolean))].sort();
            const estados = [...new Set(data.map(d => d.estado).filter(Boolean))].sort();
            opts1 = segmentos;
            opts2 = estados;
            extra1.previousElementSibling?.remove();
            extra1.insertAdjacentHTML('beforebegin', '<label style="font-size:12px;color:#64748b;margin-right:4px;">Segmento</label> ');
            extra2.previousElementSibling?.remove();
            extra2.insertAdjacentHTML('beforebegin', '<label style="font-size:12px;color:#64748b;margin-right:4px;">UF</label> ');
        } else if (this.currentEntity === 'materiais') {
            const data = state.materiais || [];
            if (!this._materiaisCache || this._materiaisCacheVersion !== data.length) {
                this._materiaisCache = {
                    categorias: [...new Set(data.map(d => d.categoria).filter(Boolean))].sort(),
                    fabricantes: [...new Set(data.map(d => d.fabricante).filter(Boolean))].sort()
                };
                this._materiaisCacheVersion = data.length;
            }
            opts1 = this._materiaisCache.categorias;
            opts2 = this._materiaisCache.fabricantes;
            extra1.previousElementSibling?.remove();
            extra1.insertAdjacentHTML('beforebegin', '<label style="font-size:12px;color:#64748b;margin-right:4px;">Categoria</label> ');
            extra2.previousElementSibling?.remove();
            extra2.insertAdjacentHTML('beforebegin', '<label style="font-size:12px;color:#64748b;margin-right:4px;">Fabricante</label> ');
        }

        extra1.innerHTML = '<option value="">Todos</option>' + opts1.map(o => `<option value="${o}">${o}</option>`).join('');
        extra2.innerHTML = '<option value="">Todos</option>' + opts2.map(o => `<option value="${o}">${o}</option>`).join('');
    },

    bindEvents() {
        document.querySelectorAll('.btn-entity').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentEntity = e.currentTarget.dataset.entity;
                this.filterText = '';
                this.filterExtra1 = '';
                this.filterExtra2 = '';
                this._searchPage = 1;
                this.updateEntityUI();
                this.loadData();
                const input = document.getElementById('rel-cad-filtro-texto');
                if (input) input.value = '';
                const extra1 = document.getElementById('rel-cad-filtro-extra1');
                const extra2 = document.getElementById('rel-cad-filtro-extra2');
                if (extra1) extra1.value = '';
                if (extra2) extra2.value = '';
            });
        });

        document.getElementById('rel-cad-filtro-texto')?.addEventListener('input', (e) => {
            this.filterText = e.target.value;
            this._searchPage = 1;
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this.loadData(), 200);
        });

        document.getElementById('rel-cad-filtro-extra1')?.addEventListener('change', (e) => {
            this.filterExtra1 = e.target.value;
            this._searchPage = 1;
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this.loadData(), 200);
        });

        document.getElementById('rel-cad-filtro-extra2')?.addEventListener('change', (e) => {
            this.filterExtra2 = e.target.value;
            this._searchPage = 1;
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this.loadData(), 200);
        });

        document.getElementById('rel-cad-btn-gerar')?.addEventListener('click', () => {
            this.gerarRelatorio();
        });

        document.getElementById('rel-cad-btn-exportar')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const dd = document.getElementById('rel-cad-export-dropdown');
            if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
        });

        document.getElementById('rel-cad-export-csv')?.addEventListener('click', () => {
            document.getElementById('rel-cad-export-dropdown').style.display = 'none';
            this.exportCSV();
        });

        document.getElementById('rel-cad-export-xls')?.addEventListener('click', () => {
            document.getElementById('rel-cad-export-dropdown').style.display = 'none';
            this.exportXLS();
        });

        if (!this._documentClickBound) {
            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('rel-cad-export-wrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    const dd = document.getElementById('rel-cad-export-dropdown');
                    if (dd) dd.style.display = 'none';
                }
            });
            this._documentClickBound = true;
        }
    },

    async loadData() {
        const state = store.getState();

        if (this.currentEntity === 'materiais') {
            this._isLoading = true;
            this.renderTable([]);
            const result = await store.searchMaterials({
                q: this.filterText || undefined,
                categoria: this.filterExtra1 || undefined,
                fabricante: this.filterExtra2 || undefined,
                page: this._searchPage,
                limit: this._searchLimit
            });
            this._isLoading = false;
            this._lastFilteredData = result.rows || [];
            this._searchTotal = result.total || 0;
            this._searchPages = result.pages || 0;
            this.renderTable(this._lastFilteredData);
            this._renderPagination();
            const count = document.getElementById('rel-cad-count');
            if (count) count.textContent = `${result.total} registro(s) encontrado(s) em Materiais (página ${result.page} de ${result.pages})`;
            return;
        }

        let data = [];
        if (this.currentEntity === 'clientes') data = state.clientes || [];
        else if (this.currentEntity === 'fornecedores') data = state.fornecedores || [];

        const filtered = data.filter(item => {
            if (this.filterText) {
                const t = this.filterText.toLowerCase();
                const searchFields = [item.razaoSocial, item.nomeFantasia, item.cnpj, item.descricao, item.codigoInterno, item.codigoFabricante, item.fabricante].filter(Boolean);
                if (!searchFields.some(f => f.toLowerCase().includes(t))) return false;
            }
            if (this.filterExtra1) {
                if ((this.currentEntity === 'clientes' || this.currentEntity === 'fornecedores') && item.segmento !== this.filterExtra1) return false;
                if (this.currentEntity === 'materiais' && item.categoria !== this.filterExtra1) return false;
            }
            if (this.filterExtra2) {
                if ((this.currentEntity === 'clientes' || this.currentEntity === 'fornecedores') && item.estado !== this.filterExtra2) return false;
                if (this.currentEntity === 'materiais' && item.fabricante !== this.filterExtra2) return false;
            }
            return true;
        });

        this._lastFilteredData = filtered;
        this.renderTable(filtered);
        this._renderPagination();
        const count = document.getElementById('rel-cad-count');
        if (count) count.textContent = `${filtered.length} registro(s) encontrado(s) em ${this.getEntityLabel()}`;
    },

    getColumns() {
        if (this.currentEntity === 'clientes') {
            return [
                { key: 'razaoSocial', label: 'Razão Social' },
                { key: 'cnpj', label: 'CNPJ' },
                { key: 'segmento', label: 'Segmento' },
                { key: 'cidade', label: 'Cidade' },
                { key: 'estado', label: 'UF' },
                { key: 'contatoNome', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'telefone', label: 'Telefone' }
            ];
        } else if (this.currentEntity === 'fornecedores') {
            return [
                { key: 'razaoSocial', label: 'Razão Social' },
                { key: 'cnpj', label: 'CNPJ' },
                { key: 'segmento', label: 'Segmento' },
                { key: 'cidade', label: 'Cidade' },
                { key: 'estado', label: 'UF' },
                { key: 'contatoNome', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'telefone', label: 'Telefone' }
            ];
        } else if (this.currentEntity === 'materiais') {
            return [
                { key: 'codigoInterno', label: 'Cód. Interno' },
                { key: 'codigoFabricante', label: 'Cód. Fabricante' },
                { key: 'fabricante', label: 'Fabricante' },
                { key: 'categoria', label: 'Categoria' },
                { key: 'descricao', label: 'Descrição' },
                { key: 'unidade', label: 'Un.' },
                { key: 'custo', label: 'Custo R$', format: 'currency' }
            ];
        }
        return [];
    },

    renderTable(data) {
        const thead = document.getElementById('rel-cad-thead');
        const tbody = document.getElementById('rel-cad-tbody');
        if (!thead || !tbody) return;

        if (this._isLoading) {
            const cols = this.getColumns().length || 8;
            thead.innerHTML = '';
            tbody.innerHTML = `<tr><td colspan="${cols}" style="padding: 40px; text-align: center; color: #94a3b8;">
                <i class="ph ph-spinner" style="font-size: 24px; animation: spin 1s linear infinite; display: inline-block;"></i>
                <br><br>Carregando...</td></tr>`;
            return;
        }

        const columns = this.getColumns();

        thead.innerHTML = `<tr>${columns.map(c => `<th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">${c.label}</th>`).join('')}</tr>`;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length}" style="padding: 40px; text-align: center; color: #94a3b8;">
                <i class="ph ph-magnifying-glass" style="font-size: 24px;"></i>
                <br><br>Nenhum registro encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const cells = columns.map(c => {
                let val = this._getField(item, c.key);
                if (c.format === 'currency' && val) {
                    val = 'R$ ' + Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                return `<td>${this._escapeHtml(val || '-')}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
    },

    _renderPagination() {
        const container = document.getElementById('rel-cad-pagination');
        if (!container) return;
        if (this.currentEntity !== 'materiais' || this._searchPages <= 1) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = `
            <span>${this._searchTotal} registro(s) encontrados</span>
            <div style="display:flex;gap:4px;align-items:center;">
                <button class="btn btn-xs btn-outline" ${this._searchPage <= 1 ? 'disabled' : ''}
                    onclick="window.relatorioCadastrosModule.goToPage(${this._searchPage - 1})">« Anterior</button>
                <span style="margin:0 8px;font-weight:600;">${this._searchPage} de ${this._searchPages}</span>
                <button class="btn btn-xs btn-outline" ${this._searchPage >= this._searchPages ? 'disabled' : ''}
                    onclick="window.relatorioCadastrosModule.goToPage(${this._searchPage + 1})">Próxima »</button>
            </div>
        `;
    },

    goToPage(page) {
        this._searchPage = page;
        this.loadData();
    },

    _getField(obj, path) {
        return path.split('.').reduce((o, k) => (o || {})[k], obj) || '';
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    async gerarRelatorio() {
        let filtered;

        if (this.currentEntity === 'materiais') {
            const result = await store.searchMaterials({
                q: this.filterText || undefined,
                categoria: this.filterExtra1 || undefined,
                fabricante: this.filterExtra2 || undefined,
                limit: 99999
            });
            filtered = result.rows || [];
        } else {
            const state = store.getState();
            let data = [];
            if (this.currentEntity === 'clientes') data = state.clientes || [];
            else if (this.currentEntity === 'fornecedores') data = state.fornecedores || [];

            filtered = data.filter(item => {
                if (this.filterText) {
                    const t = this.filterText.toLowerCase();
                    const searchFields = [item.razaoSocial, item.nomeFantasia, item.cnpj, item.descricao, item.codigoInterno, item.codigoFabricante, item.fabricante].filter(Boolean);
                    if (!searchFields.some(f => f.toLowerCase().includes(t))) return false;
                }
                if (this.filterExtra1) {
                    if ((this.currentEntity === 'clientes' || this.currentEntity === 'fornecedores') && item.segmento !== this.filterExtra1) return false;
                    if (this.currentEntity === 'materiais' && item.categoria !== this.filterExtra1) return false;
                }
                if (this.filterExtra2) {
                    if ((this.currentEntity === 'clientes' || this.currentEntity === 'fornecedores') && item.estado !== this.filterExtra2) return false;
                    if (this.currentEntity === 'materiais' && item.fabricante !== this.filterExtra2) return false;
                }
                return true;
            });
        }

        if (filtered.length === 0) {
            window.app.toast('Nenhum registro para gerar relatório.', 'warning');
            return;
        }

        const columns = this.getColumns();
        const entityLabel = this.getEntityLabel();
        const now = new Date().toLocaleString('pt-BR');

        let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de ${entityLabel}</title>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            padding: 40px;
        }
        .report-container {
            max-width: 1100px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            overflow: hidden;
        }
        .report-header {
            background: var(--color-accent);
            color: white;
            padding: 30px 36px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .report-header h1 { font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        .report-header .meta { font-size: 13px; opacity: 0.85; text-align: right; }
        .report-body { padding: 30px 36px; }
        .report-filters { margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #475569; }
        .report-filters strong { color: #1e293b; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        thead th {
            background: #f1f5f9;
            padding: 10px 12px;
            text-align: left;
            font-weight: 700;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
            white-space: nowrap;
        }
        tbody td {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        tbody tr:hover { background: #f8faff; }
        .report-footer {
            padding: 20px 36px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
        }
        .no-print { position: fixed; bottom: 24px; right: 24px; z-index: 1000; }
        .no-print button {
            padding: 12px 24px;
            background: var(--color-accent);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(124,58,237,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .no-print button:hover { background: #6d28d9; }
        @media print {
            body { padding: 0; background: white; }
            .report-container { box-shadow: none; border-radius: 0; }
            .no-print { display: none !important; }
            .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="window.print()"><i class="ph ph-printer"></i> Imprimir / PDF</button>
    </div>
    <div class="report-container">
        <div class="report-header">
            <h1><i class="ph ph-clipboard-text"></i> Relatório de ${entityLabel}</h1>
            <div class="meta">
                Gerado em: ${now}<br>
                Total: ${filtered.length} registro(s)
            </div>
        </div>
        <div class="report-body">
            <div class="report-filters">
                <strong>Filtros aplicados:</strong>
                ${this.filterText ? `Texto: "${this._escapeHtml(this.filterText)}" | ` : ''}
                ${this.filterExtra1 ? `${this.currentEntity === 'materiais' ? 'Categoria' : 'Segmento'}: "${this._escapeHtml(this.filterExtra1)}" | ` : ''}
                ${this.filterExtra2 ? `${this.currentEntity === 'materiais' ? 'Fabricante' : 'UF'}: "${this._escapeHtml(this.filterExtra2)}" | ` : ''}
                Sem filtros
            </div>
            <table>
                <thead>
                    <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
                </thead>
                <tbody>`;

        filtered.forEach(item => {
            html += '<tr>';
            columns.forEach(c => {
                let val = this._getField(item, c.key);
                if (c.format === 'currency' && val) {
                    val = 'R$ ' + Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                html += `<td>${this._escapeHtml(val || '-')}</td>`;
            });
            html += '</tr>';
        });

        html += `</tbody>
            </table>
        </div>
        <div class="report-footer">
            GeraPro v1.0 — Relatório gerado automaticamente em ${now}
        </div>
    </div>
</body>
</html>`;

        this._abrirJanela(html);
    },

    async _exportData() {
        let items;
        if (this.currentEntity === 'materiais') {
            const result = await store.searchMaterials({
                q: this.filterText || undefined,
                categoria: this.filterExtra1 || undefined,
                fabricante: this.filterExtra2 || undefined,
                limit: 99999
            });
            items = result.rows || [];
        } else {
            items = this._lastFilteredData || [];
        }
        if (!items || items.length === 0) return null;
        const columns = this.getColumns();
        const headers = columns.map(c => c.label);
        const rows = items.map(item =>
            columns.map(col => {
                const val = item[col.key];
                if (val === undefined || val === null) return '';
                if (col.format === 'currency') {
                    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d,.-]/g, '').replace(',', '.'));
                    if (isNaN(num)) return String(val);
                    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                }
                return String(val);
            })
        );
        return { headers, rows };
    },

    async exportCSV() {
        const data = await this._exportData();
        if (!data) {
            window.app.toast('Nenhum dado para exportar.', 'warning');
            return;
        }
        const BOM = '\uFEFF';
        const allRows = [data.headers, ...data.rows];
        const csv = BOM + allRows.map(r => r.map(v => {
            if (v.includes(',') || v.includes('"') || v.includes('\n')) return '"' + v.replace(/"/g, '""') + '"';
            return v;
        }).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentEntity}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.app.toast('CSV exportado com sucesso.', 'success');
    },

    async exportXLS() {
        const data = await this._exportData();
        if (!data) {
            window.app.toast('Nenhum dado para exportar.', 'warning');
            return;
        }
        const allRows = [data.headers, ...data.rows];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(allRows);
        XLSX.utils.book_append_sheet(wb, ws, this.getEntityLabel());
        XLSX.writeFile(wb, `${this.currentEntity}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        window.app.toast('XLS exportado com sucesso.', 'success');
    },

    _abrirJanela(html) {
        const w = window.open('', '_blank');
        if (!w) {
            window.app.toast('Pop-up bloqueado. Permita pop-ups para este site.', 'error');
            return;
        }
        w.document.open();
        w.document.write(html);
        w.document.close();
    }
};

window.relatorioCadastrosModule = RelatorioCadastros;
