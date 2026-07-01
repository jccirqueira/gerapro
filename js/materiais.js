import { store } from './state.js';

/**
 * Materiais Module
 */

const MateriaisModule = {
    init() {
        window.app.materiais = {
            openNewModal: this.openNewModal.bind(this),
            edit: this.edit.bind(this),
            remove: this.remove.bind(this),
            save: this.save.bind(this),
            closeModal: this.closeModal.bind(this),
            switchTab: this.switchTab.bind(this),
            calculatePrice: this.calculatePrice.bind(this),
            filterMaterials: this.filterMaterials.bind(this),
            resetView: this.resetView.bind(this),
            clearFilters: this.clearFilters.bind(this),
            openBulkUpdateModal: this.openBulkUpdateModal.bind(this),
            applyBulkUpdate: this.applyBulkUpdate.bind(this),
            openImportPricesModal: this.openImportPricesModal.bind(this),
            handlePriceImportFile: this.handlePriceImportFile.bind(this),
            applyPriceImport: this.applyPriceImport.bind(this),
            cleanupDuplicates: this.cleanupDuplicates.bind(this),
            openHistoryModal: this.openHistoryModal.bind(this),
            restorePrice: this.restorePrice.bind(this),
            previewImport: this.previewImport.bind(this),
            goBackToStep2: this.goBackToStep2.bind(this),
            downloadUnmatched: this.downloadUnmatched.bind(this),
            onSupplierChange: this.onSupplierChange.bind(this),
            saveTemplate: this.saveTemplate.bind(this),
            onSheetChange: this.onSheetChange.bind(this),
            toggleFavorito: this.toggleFavorito.bind(this),
            goToPage: this.goToPage.bind(this),
            uploadDxf: this.uploadDxf.bind(this),
            removeDxf: this.removeDxf.bind(this)
        };

        this.viewMode = 'list';
        this.currentFilter = { query: '', category: '', area: '', favoritosOnly: false };
        this.searchResults = [];
        this.searchMeta = { total: 0, page: 1, pages: 0, limit: 100 };
        this._searchTimer = null;

        store.subscribe((state) => {
            if (this.viewMode === 'list' && this.searchMeta.page === 1 && !this.currentFilter.query && !this.currentFilter.category && !this.currentFilter.area && !this.currentFilter.favoritosOnly) {
                this.doSearch();
            }
        });
    },

    async toggleFavorito(id) {
        await store.toggleFavorite(id);
        this.doSearch();
    },

    clearFilters() {
        this.currentFilter = { query: '', category: '', area: '' };
        const qInput = document.querySelector('#mat-search-controls input');
        const cSelect = document.getElementById('mat-filter-category');
        const aSelect = document.getElementById('mat-filter-area');
        if (qInput) qInput.value = '';
        if (cSelect) cSelect.value = '';
        if (aSelect) aSelect.value = '';
        this.searchMeta.page = 1;
        this.doSearch();
    },

    resetView() {
        this.viewMode = 'list';
    },

    getBaseHTML() {
        return `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <!-- Header -->
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-package"></i> Catálogo de Materiais
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Banco de Dados Global de Componentes e Insumos</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.materiais.openNewModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-plus"></i> Novo Material</button>` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div id="mat-search-controls" style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div style="position: relative; flex: 1; min-width: 300px;">
                            <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            <input type="text" class="form-control" placeholder="Buscar por descrição, código ou fabricante..." style="padding-left: 38px;" oninput="app.materiais.filterMaterials()">
                        </div>
                        <select class="form-control" style="width: 200px;" onchange="app.materiais.filterMaterials()" id="mat-filter-category">
                            <option value="">Todas Categorias</option>
                            <option value="Disjuntor">Disjuntor</option>
                            <option value="Contator">Contator</option>
                            <option value="Relé">Relé</option>
                            <option value="Inversor">Inversor</option>
                            <option value="Soft-Starter">Soft-Starter</option>
                            <option value="PLC">PLC</option>
                            <option value="Fonte">Fonte</option>
                            <option value="Borne">Borne</option>
                            <option value="Cabo">Cabo</option>
                            <option value="Outros">Outros</option>
                        </select>
                        <select class="form-control" style="width: 200px;" onchange="app.materiais.filterMaterials()" id="mat-filter-area">
                            <option value="">Todas as Áreas</option>
                        </select>
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: pointer; color: #f59e0b;">
                            <input type="checkbox" onchange="app.materiais.filterMaterials()" id="mat-filter-favoritos"> ⭐ Só favoritos
                        </label>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-sm" onclick="app.materiais.openBulkUpdateModal()" title="Reajuste em Massa">
                                <i class="ph ph-arrows-clockwise"></i> Reajuste
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="app.materiais.openImportPricesModal()" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
                                <i class="ph ph-file-xls"></i> Importar
                            </button>
${store.canDelete() ? `                            <button class="btn btn-ghost btn-sm" onclick="app.materiais.cleanupDuplicates()" style="color: #ef4444;" title="Limpar Duplicados">
                                <i class="ph ph-broom"></i>
                            </button>` : ''}
                        </div>
                    </div>

                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-container">
                            <table id="materiais-table">
                                <thead>
                                    <tr>
                                        <th>Código Fabricante</th>
                                        <th>Modelo</th>
                                        <th>Descrição</th>
                                        <th>Fabricante</th>
                                        <th>Preço Custo</th>
                                        <th>Estoque</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Injected by renderList -->
                                </tbody>
                            </table>
                        </div>
                        <div id="mat-pagination" style="border-top: 1px solid #e2e8f0; background: #f8fafc;"></div>
                    </div>
                </div>
            </div>
        `;
    },

    render() {
        if (this.viewMode === 'form') return;

        const container = document.getElementById('view-materiais');
        if (!container) return;

        // Force overwrite to apply new design
        container.innerHTML = this.getBaseHTML();

        // Popula os filtros dinamicamente baseado nos materiais cadastrados
        const allMaterials = store.getState().materiais || [];

        const catSelect = document.getElementById('mat-filter-category');
        if (catSelect) {
            const currentCat = this.currentFilter.category || '';
            const cats = [...new Set(allMaterials.map(m => m.categoria).filter(Boolean))].sort();
            catSelect.innerHTML = `<option value="">Todas Categorias</option>` + 
                cats.map(c => `<option value="${c}" ${currentCat === c ? 'selected' : ''}>${c}</option>`).join('');
        }

        const areaSelect = document.getElementById('mat-filter-area');
        if (areaSelect) {
            const currentArea = this.currentFilter.area || '';
            const areas = [...new Set(allMaterials.map(m => m.area).filter(Boolean))].sort();
            areaSelect.innerHTML = `<option value="">Todas as Áreas</option>` + 
                areas.map(a => `<option value="${a}" ${currentArea === a ? 'selected' : ''}>${a}</option>`).join('');
        }

        this.searchMeta.page = 1;
        this.searchResults = [];
        this.doSearch();
    },

    async doSearch() {
        const { query, category, area, favoritosOnly } = this.currentFilter;
        const filters = {
            q: query,
            categoria: category,
            page: this.searchMeta.page,
            limit: this.searchMeta.limit,
            favorito: favoritosOnly
        };
        const result = await store.searchMaterials(filters);
        this.searchResults = result.rows || [];
        this.searchMeta = { total: result.total || 0, page: result.page || 1, pages: result.pages || 0, limit: this.searchMeta.limit };

        this.renderList();
    },

    filterMaterials() {
        const query = document.querySelector('#mat-search-controls input')?.value.toLowerCase() || '';
        const category = document.getElementById('mat-filter-category')?.value || '';
        const area = document.getElementById('mat-filter-area')?.value || '';
        const favoritosOnly = document.getElementById('mat-filter-favoritos')?.checked || false;

        this.currentFilter = { query, category, area, favoritosOnly };
        this.searchMeta.page = 1;

        if (this._searchTimer) clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => this.doSearch(), 300);
    },

    async goToPage(page) {
        if (page < 1 || page > this.searchMeta.pages) return;
        this.searchMeta.page = page;
        await this.doSearch();
        const tableContainer = document.querySelector('#materiais-table');
        if (tableContainer) tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    renderList() {
        const tbody = document.querySelector('#materiais-table tbody');
        const paginationEl = document.getElementById('mat-pagination');
        if (!tbody) return;

        const materiaisList = this.searchResults;

        if (!materiaisList || materiaisList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Nenhum material encontrado com os filtros atuais.</td></tr>`;
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        tbody.innerHTML = materiaisList.map(m => `
            <tr>
                <td>
                    <div style="font-weight: 600; font-family: monospace;">${m.codigoFabricante || '-'}</div>
                </td>
                <td>${m.modelo || '-'}</td>
                <td>
                    <div style="font-size: 13px; font-weight: 500;">${m.descricao || '-'}</div>
                    <div class="text-xs text-muted">${m.categoria} | ${m.unidade}${m.area ? ` | Área: ${m.area}` : ''}</div>
                </td>
                <td>${m.fabricante || '-'}</td>
                <td>
                    <div>${app.formatCurrency(m.custo || 0)}</div>
                    <div class="text-xs text-muted">Markup: ${m.markup || 0}%</div>
                    ${m.lastUpdateTitle ? `<div class="text-xs" style="color: var(--color-primary); font-size: 9px; margin-top:3px;"><i class="ph ph-calendar"></i> ${m.lastUpdateTitle}</div>` : ''}
                    ${m.priceHistory && m.priceHistory.length > 1 ? `<div class="text-xs" style="cursor:pointer;color:#3b82f6;margin-top:2px;" onclick="app.materiais.openHistoryModal('${m.id}')"><i class="ph ph-clock-counter-clockwise"></i> ${m.priceHistory.length} versões</div>` : ''}
                </td>
                <td>
                   <span class="status-badge status-green">Disponível</span>
                </td>
                <td>
                    <span class="favorito-star" onclick="app.materiais.toggleFavorito('${m.id}')" style="cursor:pointer;font-size:18px;${m.favorito ? 'color:#f59e0b;' : 'color:#d1d5db;'}" title="${m.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${m.favorito ? '★' : '☆'}</span>
                    ${store.canEdit() ? `<button class="btn btn-ghost" style="padding: 4px;" onclick="app.materiais.edit('${m.id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>` : ''}
                    ${m.priceHistory && m.priceHistory.length > 1 ? `<button class="btn btn-ghost" style="padding: 4px; color: #3b82f6;" onclick="app.materiais.openHistoryModal('${m.id}')" title="Histórico de Preços"><i class="ph ph-clock-counter-clockwise"></i></button>` : ''}
                    ${store.canDelete() ? `<button class="btn btn-ghost" style="padding: 4px; color: var(--color-danger);" onclick="app.materiais.remove('${m.id}')" title="Excluir"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');

        if (paginationEl) {
            const { total, page, pages } = this.searchMeta;
            if (pages <= 1) {
                paginationEl.innerHTML = `<div class="text-xs text-muted" style="padding: 8px 12px;">${total} material(is) encontrado(s)</div>`;
            } else {
                let pageLinks = '';
                const startPage = Math.max(1, page - 2);
                const endPage = Math.min(pages, page + 2);
                if (startPage > 1) pageLinks += `<span class="page-btn" onclick="app.materiais.goToPage(1)">1</span><span class="page-ellipsis">...</span>`;
                for (let i = startPage; i <= endPage; i++) {
                    pageLinks += `<span class="page-btn${i === page ? ' active' : ''}" onclick="app.materiais.goToPage(${i})">${i}</span>`;
                }
                if (endPage < pages) pageLinks += `<span class="page-ellipsis">...</span><span class="page-btn" onclick="app.materiais.goToPage(${pages})">${pages}</span>`;
                paginationEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; flex-wrap: wrap; gap: 8px;">
                        <div class="text-xs text-muted">${total} material(is) — Página ${page} de ${pages}</div>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <button class="btn btn-ghost btn-xs" onclick="app.materiais.goToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}><i class="ph ph-caret-left"></i></button>
                            ${pageLinks}
                            <button class="btn btn-ghost btn-xs" onclick="app.materiais.goToPage(${page + 1})" ${page >= pages ? 'disabled' : ''}><i class="ph ph-caret-right"></i></button>
                        </div>
                    </div>
                `;
            }
        }
    },

    // --- Modal Logic ---

    openNewModal() {
        this.viewMode = 'form';
        this.render();
        this.renderModal();
    },

    edit(id) {
        const item = store.getState().materiais.find(m => m.id === id);
        if (item) {
            this.viewMode = 'form';
            this.render();
            this.renderModal(item);
        }
    },

    closeModal() {
        this.viewMode = 'list';
        this.render();
    },

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        document.getElementById(`tab-mat-${tabName}`).style.display = 'block';

        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(`btn-tab-mat-${tabName}`).classList.add('active');
    },

    calculatePrice() {
        const cost = parseFloat(document.getElementById('input-custo').value) || 0;
        const markup = parseFloat(document.getElementById('input-markup').value) || 0;
        const price = cost * (1 + (markup / 100));
        document.getElementById('input-preco').value = app.formatCurrencyRaw(price);
    },

    renderModal(data = {}) {
        const isEdit = !!data.id;

        // Helper for selects
        const fornecedoresState = store.getState().fornecedores || [];
        // Map to strings if they are objects, or keep as strings if legacy
        const manufacturers = fornecedoresState.map(f => typeof f === 'object' ? f.razaoSocial : f);

        if (manufacturers.length === 0) {
            manufacturers.push('WEG', 'Siemens', 'Schneider', 'ABB'); // Default fallbacks
        }

        const categories = ['Disjuntor', 'Contator', 'Relé', 'Inversor', 'Soft-Starter', 'PLC', 'Fonte', 'Borne', 'Cabo', 'Outros'];

        const html = `
            <div id="form-material-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.materiais.closeModal()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">${isEdit ? 'Editar Material' : 'Novo Material'}</h3>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-cancel" onclick="app.materiais.closeModal()">Cancelar</button>
                            ${!isEdit ? `<button class="btn btn-secondary" onclick="app.materiais.save(true)"><i class="ph ph-plus"></i> Salvar e Novo</button>` : ''}
                            <button class="btn btn-primary" onclick="app.materiais.save()"><i class="ph ph-check"></i> Salvar Material</button>
                        </div>
                    </div>
                    
                    <div style="padding: 0 var(--spacing-md); border-bottom: 1px solid var(--color-border); background: #f8fafc;">
                        <button id="btn-tab-mat-tecnico" class="tab-btn active" onclick="app.materiais.switchTab('tecnico')">Técnico</button>
                        <button id="btn-tab-mat-comercial" class="tab-btn" onclick="app.materiais.switchTab('comercial')">Comercial</button>
                        <button id="btn-tab-mat-fiscal" class="tab-btn" onclick="app.materiais.switchTab('fiscal')">Fiscal (Impostos)</button>
                        ${isEdit ? `<button id="btn-tab-mat-historico" class="tab-btn" onclick="app.materiais.switchTab('historico')"><i class="ph ph-clock-counter-clockwise"></i> Histórico</button>` : ''}
                    </div>

                    <div style="padding: 20px; flex: 1; overflow-y: auto;">
                        <form id="form-material">
                            <input type="hidden" name="id" value="${data.id || ''}">
                            
                            <!-- TAB: TÉCNICO -->
                            <div id="tab-mat-tecnico" class="tab-content">
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Código Interno</label>
                                        <input type="text" name="codigoInterno" class="form-control" value="${data.codigoInterno || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Código Fabricante</label>
                                        <input type="text" name="codigoFabricante" class="form-control" value="${data.codigoFabricante || ''}">
                                    </div>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Fabricante</label>
                                        <select name="fabricante" class="form-control">
                                            <option value="">Selecione...</option>
                                            ${manufacturers.map(f => `<option value="${f}" ${data.fabricante === f ? 'selected' : ''}>${f}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Categoria</label>
                                        <select name="categoria" class="form-control">
                                            ${categories.map(c => `<option value="${c}" ${data.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Área</label>
                                        <input type="text" name="area" class="form-control" value="${data.area || ''}" placeholder="Ex: GERAÇÃO E DISTR. ENERGIA">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Descrição Técnica *</label>
                                    <textarea name="descricao" class="form-control" rows="2" required>${data.descricao || ''}</textarea>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Unidade</label>
                                        <select name="unidade" class="form-control">
                                            <option value="un" ${data.unidade === 'un' ? 'selected' : ''}>Unidade (un)</option>
                                            <option value="m" ${data.unidade === 'm' ? 'selected' : ''}>Metro (m)</option>
                                            <option value="kg" ${data.unidade === 'kg' ? 'selected' : ''}>Quilo (kg)</option>
                                            <option value="cj" ${data.unidade === 'cj' ? 'selected' : ''}>Conjunto (cj)</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Peso (kg)</label>
                                        <input type="number" step="0.01" name="peso" class="form-control" value="${data.peso || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Largura (mm)</label>
                                        <input type="number" step="1" name="largura_mm" class="form-control" value="${data.largura_mm || ''}" placeholder="0">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Altura (mm)</label>
                                        <input type="number" step="1" name="altura_mm" class="form-control" value="${data.altura_mm || ''}" placeholder="0">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Prof. (mm)</label>
                                        <input type="number" step="1" name="profundidade_mm" class="form-control" value="${data.profundidade_mm || ''}" placeholder="0">
                                    </div>
                                 </div>

                                <!-- DXF Block Upload -->
                                <div style="margin-top:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                                        <label style="font-weight:600;font-size:13px;color:#1e293b;">Desenho DXF da Peça</label>
                                        <div style="display:flex;gap:8px;">
                                            <button type="button" class="btn btn-sm btn-secondary" onclick="app.materiais.uploadDxf()" style="gap:4px;">
                                                <i class="ph ph-upload"></i> Importar DXF
                                            </button>
                                            <button type="button" class="btn btn-sm btn-ghost" onclick="app.materiais.removeDxf()" style="gap:4px;color:#ef4444;${data.dxf_block ? '' : 'display:none'}" id="btn-remove-dxf">
                                                <i class="ph ph-trash"></i> Remover
                                            </button>
                                        </div>
                                    </div>
                                    <div id="dxf-preview-area" style="display:${data.dxf_block ? 'flex' : 'none'};align-items:center;gap:12px;padding:12px;background:white;border:1px dashed #cbd5e1;border-radius:6px;min-height:60px;">
                                        <i class="ph ph-file-dxf" style="font-size:24px;color:#3b82f6;"></i>
                                        <div style="flex:1;">
                                            <div style="font-size:13px;font-weight:600;color:#1e293b;" id="dxf-file-name">${data.dxf_block ? 'Desenho DXF associado' : ''}</div>
                                            <div style="font-size:11px;color:#64748b;" id="dxf-entity-count"></div>
                                        </div>
                                        <canvas id="dxf-preview-canvas" style="width:80px;height:60px;border:1px solid #e2e8f0;border-radius:4px;display:none;"></canvas>
                                    </div>
                                    <div id="dxf-empty-state" style="display:${data.dxf_block ? 'none' : 'block'};padding:12px;text-align:center;color:#94a3b8;font-size:12px;border:1px dashed #e2e8f0;border-radius:6px;">
                                        <i class="ph ph-frame-corners" style="font-size:20px;display:block;margin-bottom:4px;opacity:0.4;"></i>
                                        Nenhum desenho DXF associado. Os componentes aparecerão como retângulos no layout.
                                    </div>
                                    <input type="file" id="dxf-file-input" accept=".dxf" style="display:none">
                                </div>

                                <div class="row" style="display: flex; gap: 16px;">
                                     <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Tensão (V)</label>
                                        <select name="tensao" class="form-control">
                                            <option value="">Selecione...</option>
                                            <option value="24" ${data.tensao === '24' ? 'selected' : ''}>24</option>
                                            <option value="110" ${data.tensao === '110' ? 'selected' : ''}>110</option>
                                            <option value="220" ${data.tensao === '220' ? 'selected' : ''}>220</option>
                                            <option value="380" ${data.tensao === '380' ? 'selected' : ''}>380</option>
                                            <option value="440" ${data.tensao === '440' ? 'selected' : ''}>440</option>
                                            <option value="480" ${data.tensao === '480' ? 'selected' : ''}>480</option>
                                            <option value="690" ${data.tensao === '690' ? 'selected' : ''}>690</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Corrente (A)</label>
                                        <input type="text" name="corrente" class="form-control" value="${data.corrente || ''}" placeholder="Ex: 32A">
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: COMERCIAL -->
                            <div id="tab-mat-comercial" class="tab-content" style="display: none;">
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Custo Unitário (R$) *</label>
                                        <input type="number" step="0.01" id="input-custo" name="custo" class="form-control" value="${data.custo || ''}" oninput="app.materiais.calculatePrice()">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Markup Padrão (%)</label>
                                        <input type="number" step="0.1" id="input-markup" name="markup" class="form-control" value="${data.markup || '50'}" oninput="app.materiais.calculatePrice()">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Preço Sugerido (R$)</label>
                                    <input type="text" id="input-preco" class="form-control" readonly value="${data.precoSugerido || ''}" style="background-color: #f1f5f9; font-weight: bold;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Lead Time (dias)</label>
                                    <input type="number" name="leadTime" class="form-control" value="${data.leadTime || '5'}">
                                </div>
                            </div>

                            <!-- TAB: FISCAL -->
                            <div id="tab-mat-fiscal" class="tab-content" style="display: none;">
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">NCM *</label>
                                        <input type="text" name="ncm" class="form-control" value="${data.ncm || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Origem</label>
                                        <select name="origem" class="form-control">
                                            <option value="0" ${data.origem === '0' ? 'selected' : ''}>0 - Nacional</option>
                                            <option value="1" ${data.origem === '1' ? 'selected' : ''}>1 - Importação Direta</option>
                                            <option value="2" ${data.origem === '2' ? 'selected' : ''}>2 - Importado no Mercado</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">ICMS (%)</label>
                                        <input type="number" step="0.1" name="icms" class="form-control" value="${data.icms || '18'}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">IPI (%)</label>
                                        <input type="number" step="0.1" name="ipi" class="form-control" value="${data.ipi || '10'}">
                                    </div>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">PIS (%)</label>
                                        <input type="number" step="0.01" name="pis" class="form-control" value="${data.pis || '1.65'}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">COFINS (%)</label>
                                        <input type="number" step="0.01" name="cofins" class="form-control" value="${data.cofins || '7.60'}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">UF do Fornecedor</label>
                                    <select name="ufFornecedor" class="form-control">
                                        <option value="">Selecione...</option>
                                        ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf =>
                                            `<option value="${uf}" ${data.ufFornecedor === uf ? 'selected' : ''}>${uf}</option>`
                                        ).join('')}
                                     </select>
                                 </div>
                                 <div class="form-group">
                                     <label class="form-label">Grupo Siemens</label>
                                     <select name="grupoSiemens" class="form-control">
                                         <option value="">Nenhum</option>
                                         ${['A03','A23','A33','A34','A41','A43','A58','B20','B21','C00','C01','C02','C03','C05','C06','C08','C10','C11','C13','C14','C15','C17','C18','C19','C30','C32','C35','C36','C37','C38','C39','C40','C41','C42','C43','C44','C45','C46','C47','C48','C49','C51','C55','C56','C57','C59','C61','C62','C63','C64','C65','C67','C72','C74','C80','C81','C83','C89','C91','C94','C96','C97','C98','C99','CA2','E03','EAA','EAB','EAC','EAF','EAG','EAH','EAJ','EAK','EAL','EAM','EAN','EBA','EBB','EBC','ECA','ECB','EDB','EDD','EDE','EDF','EDG','EDH','EDL','EEA','EEB','EEC','EED','EEE','EEH','EEI','EEJ','EFA','EFB','EGA','ELA','ELB','EMD','EMG','EMI','EMJ','EML','EMM','EMZ','EOA','EOB','EOC','EOD','EOF','EOI','EOJ','G15','G16','I02','I03','I04','I07','I10','I12','I15','J02','J04','J06','J13','J14','J16','J18','J20','J71','J76','J77','J78','K02','K10','K11','K20','K21','K24','K25','K26','K29','K30','K31','K32','K33','K34','K36','K37','K40','K41','K42','K45','K50','K53','K54','K57','K58','K59','K63','K64','K65','K68','Z10','Z12','Z13','Z14','Z15','Z16','Z17','Z18','Z19','Z22','Z24','Z31','Z32','Z37','Z38','Z50','Z51','Z70','Z71'].map(g =>
                                             `<option value="${g}" ${data.grupoSiemens === g ? 'selected' : ''}>${g}</option>`
                                         ).join('')}
                                     </select>
                                 </div>
                             </div>

                             <!-- TAB: HISTÓRICO -->
                            ${isEdit ? `
                            <div id="tab-mat-historico" class="tab-content" style="display: none;">
                                <div id="history-tab-content">
                                    <p class="text-sm text-muted" style="margin-bottom: 16px;">Histórico de alterações de preço deste material.</p>
                                    <div id="history-tab-table"></div>
                                </div>
                            </div>
                            ` : ''}
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.getElementById('view-materiais');
        if (container) {
            container.innerHTML = html;
        }
        this.calculatePrice(); // Init calculation

        // Render history tab content if editing
        if (isEdit && data.priceHistory?.length > 0) {
            this.renderHistoryTabContent(data);
        }
    },

    renderHistoryTabContent(data) {
        const container = document.getElementById('history-tab-table');
        if (!container) return;

        const history = data.priceHistory || [];
        if (history.length === 0) {
            container.innerHTML = '<p class="text-sm text-muted">Nenhum histórico disponível.</p>';
            return;
        }

        const rows = [...history].reverse().map((entry, i) => `
            <tr>
                <td style="padding: 6px 10px; white-space: nowrap; font-size: 12px;">${new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                <td style="padding: 6px 10px; font-weight: 600; font-size: 12px;">${app.formatCurrency(entry.custo)}</td>
                <td style="padding: 6px 10px; font-size: 12px;">${entry.markup || 0}%</td>
                <td style="padding: 6px 10px; font-size: 12px;"><span style="display:inline-block;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:600;${entry.origin === 'bulk' ? 'background:#fef3c7;color:#92400e;' : entry.origin === 'import' ? 'background:#e0f2fe;color:#0369a1;' : entry.origin === 'restore' ? 'background:#f3e8ff;color:#6b21a8;' : 'background:#dcfce7;color:#15803d;'}">${entry.origin === 'bulk' ? 'Massa' : entry.origin === 'import' ? 'Planilha' : entry.origin === 'restore' ? 'Restaurado' : 'Manual'}</span></td>
                <td style="padding: 6px 10px; font-size: 12px; color: #64748b;">${entry.title || '-'}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                <table style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th style="padding: 6px 10px;">Data</th>
                            <th style="padding: 6px 10px;">Custo</th>
                            <th style="padding: 6px 10px;">Markup</th>
                            <th style="padding: 6px 10px;">Origem</th>
                            <th style="padding: 6px 10px;">Título</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    },

    async save() {
        const form = document.getElementById('form-material');
        if (!form) return;

        const formData = new FormData(form);
        const obj = {};
        formData.forEach((value, key) => obj[key] = value);

        if (!obj.descricao) {
            app.toast("A Descrição é obrigatória.", "error");
            return;
        }

        const id = obj.id || null;
        if (store.isCodeDuplicate(obj.codigoInterno, id)) {
            app.toast(`Código Interno "${obj.codigoInterno}" já existe em outro material!`, "error");
            return;
        }
        if (store.isCodeDuplicate(obj.codigoFabricante, id)) {
            app.toast(`Código do Fabricante "${obj.codigoFabricante}" já existe em outro material!`, "error");
            return;
        }

        obj.precoSugerido = document.getElementById('input-preco').value;
        obj.custo = parseFloat(obj.custo) || 0;
        obj.markup = parseFloat(obj.markup) || 0;
        obj.largura_mm = parseFloat(obj.largura_mm) || 0;
        obj.altura_mm = parseFloat(obj.altura_mm) || 0;
        obj.profundidade_mm = parseFloat(obj.profundidade_mm) || 0;

        let ok;
        if (obj.id) {
            ok = await store.updateMaterial(obj.id, obj);
        } else {
            delete obj.id;
            ok = await store.addMaterial(obj);
        }

        if (!ok) {
            app.toast("Erro ao salvar. Verifique se o servidor está rodando.", "error");
            return;
        }

        this.closeModal();
        app.toast("Material salvo com sucesso!", "success");
        this.doSearch();
    },

    async remove(id) {
        if (await window.app.confirm("Remover este material?")) {
            const ok = await store.deleteMaterial(id);
            if (!ok) {
                window.app.toast("Erro ao remover. Verifique se o servidor está rodando.", "error");
                return;
            }
            window.app.toast("Material removido.", "info");
            this.doSearch();
        }
    },

    openBulkUpdateModal() {
        const modalId = 'modal-bulk-update';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const manufacturers = [...new Set(store.getState().materiais.map(m => m.fabricante))].filter(Boolean).sort();
        const categories = [...new Set(store.getState().materiais.map(m => m.categoria))].filter(Boolean).sort();
        const areas = [...new Set(store.getState().materiais.map(m => m.area).filter(Boolean))].sort();

        const html = `
            <div id="${modalId}" class="modal-overlay" style="z-index: 10000;">
                <div class="modal" style="width: 450px;">
                    <div class="modal-header">
                        <h3 class="card-title">Atualização de Preços em Massa</h3>
                        <button class="btn btn-icon" onclick="document.getElementById('${modalId}').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-sm text-muted" style="margin-bottom: 20px;">Filtre os materiais e aplique o reajuste nos custos base.</p>
                        
                        <div class="form-group">
                            <label class="form-label">Fabricante</label>
                            <select id="bulk-filter-fab" class="form-control">
                                <option value="">Todos os Fabricantes</option>
                                ${manufacturers.map(f => `<option value="${f}">${f}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Categoria (Família)</label>
                            <select id="bulk-filter-cat" class="form-control">
                                <option value="">Todas as Categorias</option>
                                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Área</label>
                            <select id="bulk-filter-area" class="form-control">
                                <option value="">Todas as Áreas</option>
                                ${areas.map(a => `<option value="${a}">${a}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Grupo Siemens</label>
                            <select id="bulk-filter-grupo" class="form-control">
                                <option value="">Todos os Grupos</option>
                                ${['A03','A23','A33','A34','A41','A43','A58','B20','B21','C00','C01','C02','C03','C05','C06','C08','C10','C11','C13','C14','C15','C17','C18','C19','C30','C32','C35','C36','C37','C38','C39','C40','C41','C42','C43','C44','C45','C46','C47','C48','C49','C51','C55','C56','C57','C59','C61','C62','C63','C64','C65','C67','C72','C74','C80','C81','C83','C89','C91','C94','C96','C97','C98','C99','CA2','E03','EAA','EAB','EAC','EAF','EAG','EAH','EAJ','EAK','EAL','EAM','EAN','EBA','EBB','EBC','ECA','ECB','EDB','EDD','EDE','EDF','EDG','EDH','EDL','EEA','EEB','EEC','EED','EEE','EEH','EEI','EEJ','EFA','EFB','EGA','ELA','ELB','EMD','EMG','EMI','EMJ','EML','EMM','EMZ','EOA','EOB','EOC','EOD','EOF','EOI','EOJ','G15','G16','I02','I03','I04','I07','I10','I12','I15','J02','J04','J06','J13','J14','J16','J18','J20','J71','J76','J77','J78','K02','K10','K11','K20','K21','K24','K25','K26','K29','K30','K31','K32','K33','K34','K36','K37','K40','K41','K42','K45','K50','K53','K54','K57','K58','K59','K63','K64','K65','K68','Z10','Z12','Z13','Z14','Z15','Z16','Z17','Z18','Z19','Z22','Z24','Z31','Z32','Z37','Z38','Z50','Z51','Z70','Z71'].map(g => `<option value="${g}">${g}</option>`).join('')}
                            </select>
                        </div>

                        <hr style="margin: 20px 0; border: none; border-top: 1px dashed var(--color-border);">

                        <div class="form-group">
                            <label class="form-label">Título do Reajuste *</label>
                            <input type="text" id="bulk-title" class="form-control" placeholder="Ex: Reajuste Anual 2026" required>
                        </div>

                        <div class="row" style="display: flex; gap: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Tipo de Ajuste</label>
                                <select id="bulk-type" class="form-control">
                                    <option value="percent">Percentual (%)</option>
                                    <option value="fixed">Valor Fixo (R$)</option>
                                </select>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Valor (+ ou -)</label>
                                <input type="number" id="bulk-value" class="form-control" step="0.01" placeholder="Ex: 5.5">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Data de Vigência</label>
                            <input type="date" id="bulk-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-cancel" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.materiais.applyBulkUpdate()">Aplicar Reajuste</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    applyBulkUpdate() {
        const title = document.getElementById('bulk-title').value;
        const value = parseFloat(document.getElementById('bulk-value').value);
        const type = document.getElementById('bulk-type').value;
        const date = document.getElementById('bulk-date').value;
        const fab = document.getElementById('bulk-filter-fab').value;
        const cat = document.getElementById('bulk-filter-cat').value;
        const area = document.getElementById('bulk-filter-area').value;
        const grupo = document.getElementById('bulk-filter-grupo').value;

        if (!title) {
            app.toast("Título do reajuste é obrigatório.", "warning");
            return;
        }

        if (isNaN(value)) {
            app.toast("Informe um valor válido para o reajuste.", "warning");
            return;
        }

        const filters = { fabricante: fab, categoria: cat, area: area, grupoSiemens: grupo };
        const updateData = { type, value, title, date };

        // Count affected items for confirmation
        const allMaterials = store.getState().materiais;
        const affectedCount = allMaterials.filter(m => {
            const matchFab = !fab || m.fabricante === fab;
            const matchCat = !cat || m.categoria === cat;
            const matchArea = !area || m.area === area;
            const matchGrupo = !grupo || m.grupoSiemens === grupo;
            return matchFab && matchCat && matchArea && matchGrupo;
        }).length;

        if (affectedCount === 0) {
            app.toast("Nenhum material encontrado com os filtros selecionados.", "warning");
            return;
        }

        if (!confirm(`Deseja aplicar o reajuste "${title}" de ${value}${type === 'percent' ? '%' : ' R$'} em ${affectedCount} materiais?`)) {
            return;
        }

        store.bulkUpdateMaterials(filters, updateData);
        document.getElementById('modal-bulk-update').remove();
        app.toast(`${affectedCount} materiais atualizados com sucesso!`, "success");
    },

    // --- Price Import Utilities ---

    parseCSV(text) {
        const lines = [];
        let currentLine = [];
        let currentField = '';
        let inQuotes = false;

        // Remove BOM
        text = text.replace(/^\uFEFF/, '');

        // Detect delimiter: count occurrences of ; , \t on first line
        const firstLine = text.split('\n')[0] || '';
        const delimiters = [
            { char: ';', count: (firstLine.match(/;/g) || []).length },
            { char: ',', count: (firstLine.match(/,/g) || []).length },
            { char: '\t', count: (firstLine.match(/\t/g) || []).length }
        ];
        delimiters.sort((a, b) => b.count - a.count);
        const delim = delimiters[0].char;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < text.length && text[i + 1] === '"') {
                        currentField += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentField += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === delim) {
                    currentLine.push(currentField.trim());
                    currentField = '';
                } else if (ch === '\n') {
                    currentLine.push(currentField.trim());
                    if (currentLine.some(f => f !== '')) {
                        lines.push(currentLine);
                    }
                    currentLine = [];
                    currentField = '';
                } else if (ch === '\r') {
                    // skip \r, handle \r\n
                    if (i + 1 < text.length && text[i + 1] === '\n') i++;
                } else {
                    currentField += ch;
                }
            }
        }
        // Last line
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f !== '')) {
            lines.push(currentLine);
        }

        if (lines.length < 2) return [];

        const headers = lines[0].map(h => h.trim());
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = idx < row.length ? row[idx] : '';
            });
            result.push(obj);
        }
        return result;
    },

    normalizeNumber(value) {
        if (value === null || value === undefined || value === '') return NaN;
        if (typeof value === 'number') return value;

        let str = String(value).trim();
        if (!str) return NaN;

        // Remove currency symbols, R$, spaces at start/end
        str = str.replace(/^[R$\s]+/g, '');
        str = str.replace(/[R$\s]+$/g, '');
        if (!str) return NaN;

        const lastComma = str.lastIndexOf(',');
        const lastDot = str.lastIndexOf('.');

        if (lastComma > lastDot) {
            // Last separator is comma → decimal separator (Brazilian: 1.234,56)
            str = str.replace(/\./g, '');
            str = str.replace(',', '.');
        } else if (lastDot > lastComma) {
            // Last separator is dot → decimal separator (US: 1,234.56)
            str = str.replace(/,/g, '');
        } else if (lastDot >= 0 && lastComma < 0) {
            // Only dots present
            const dots = str.match(/\./g);
            if (dots && dots.length > 1) {
                const lastIdx = str.lastIndexOf('.');
                str = str.substring(0, lastIdx).replace(/\./g, '') + '.' + str.substring(lastIdx + 1);
            }
        } else if (lastComma >= 0 && lastDot < 0) {
            // Only commas present
            const commas = str.match(/,/g);
            if (commas && commas.length > 1) {
                const lastIdx = str.lastIndexOf(',');
                str = str.substring(0, lastIdx).replace(/,/g, '') + '.' + str.substring(lastIdx + 1);
            } else {
                str = str.replace(',', '.');
            }
        }

        const num = parseFloat(str);
        return isNaN(num) || !isFinite(num) ? NaN : num;
    },

    _bestMatch(headers, candidates) {
        let best = null;
        let bestScore = 0;
        headers.forEach(h => {
            const hLower = h.toLowerCase().trim();
            candidates.forEach(c => {
                const cLower = c.toLowerCase().trim();
                let score = 0;
                if (hLower === cLower) score = 100;
                else if (hLower.includes(cLower) || cLower.includes(hLower)) score = 60;
                else if (hLower.split(/[\s_\-]+/).some(w => w === cLower)) score = 40;
                if (score > bestScore) { bestScore = score; best = h; }
            });
        });
        return best;
    },

    openImportPricesModal() {
        const modalId = 'modal-import-prices';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const html = `
            <div id="${modalId}" class="modal-overlay" style="z-index: 10000;">
                <div class="modal" style="width: 600px; max-width: 95vw;">
                    <div class="modal-header">
                        <h3 class="card-title">Importar Preços de Planilha</h3>
                        <button class="btn btn-icon" onclick="document.getElementById('${modalId}').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <div id="import-step-1">
                            <p class="text-sm text-muted" style="margin-bottom: 20px;">Selecione um fornecedor (opcional) e o arquivo de preços.</p>

                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label">Fornecedor (para salvar template)</label>
                                <select id="import-supplier-select" class="form-control" onchange="app.materiais.onSupplierChange()">
                                    <option value="">— Nenhum —</option>
                                    ${store.getState().fornecedores.filter(f => typeof f === 'object').map(f => `<option value="${f.id}">${f.razaoSocial || f.nomeFantasia || 'Sem Nome'}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div id="import-sheet-selector" style="display:none; margin-bottom: 12px;">
                                <label class="form-label">Aba / Planilha</label>
                                <select id="import-sheet-select" class="form-control" onchange="app.materiais.onSheetChange()"></select>
                            </div>

                            <div style="position: relative; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 20px;">
                                <i class="ph ph-cloud-arrow-up" style="font-size: 40px; color: #94a3b8; margin-bottom: 12px;"></i>
                                <h4 style="margin: 0; font-size: 14px; color: var(--color-primary);">Clique para selecionar ou arraste o arquivo</h4>
                                <input type="file" id="price-import-input" accept=".xlsx, .xls, .csv" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; opacity: 0; cursor: pointer;" onchange="app.materiais.handlePriceImportFile(this)">
                            </div>
                        </div>

                        <div id="import-step-2" style="display: none;">
                            <h4 class="text-sm font-bold" style="margin-bottom: 12px;">Mapeamento de Colunas</h4>
                            <p class="text-xs text-muted" style="margin-bottom: 15px;">Identificamos as seguintes colunas na sua planilha. Selecione as correspondentes:</p>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                                <div class="form-group">
                                    <label class="form-label">Código * (ID/Ref)</label>
                                    <select id="map-col-code" class="form-control"></select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Preço * (R$)</label>
                                    <select id="map-col-price" class="form-control"></select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Fabricante</label>
                                    <select id="map-col-fabricante" class="form-control">
                                        <option value="">— Não mapear —</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Desconto (%)</label>
                                    <select id="map-col-discount" class="form-control">
                                        <option value="">— Não mapear —</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Markup (%)</label>
                                    <select id="map-col-markup" class="form-control">
                                        <option value="">— Não mapear —</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Descrição</label>
                                    <select id="map-col-desc" class="form-control">
                                        <option value="">— Não mapear —</option>
                                    </select>
                                </div>
                            </div>

                            <hr style="margin: 15px 0; border: none; border-top: 1px dashed #e2e8f0;">

                            <div class="form-group">
                                <label class="form-label">Título do Reajuste/Lote</label>
                                <input type="text" id="import-price-title" class="form-control" placeholder="Ex: Tabela WEG 2026-04">
                            </div>

                            <div style="margin-top: 15px;">
                                <h5 class="text-xs font-bold" style="margin-bottom: 8px;">Pré-visualização</h5>
                                <div class="table-container" style="max-height: 220px; overflow-y: auto;">
                                    <table id="import-price-preview" style="font-size: 11px;">
                                        <thead></thead>
                                        <tbody></tbody>
                                    </table>
                                </div>
                            </div>
                            <div style="margin-top: 16px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                                <button class="btn btn-primary" onclick="app.materiais.previewImport()">Pré-visualizar Importação</button>
                                <button class="btn btn-secondary" id="btn-save-template" style="display:none;" onclick="app.materiais.saveTemplate()"><i class="ph ph-floppy-disk"></i> Salvar como Template</button>
                            </div>
                        </div>

                        <div id="import-step-3" style="display: none;">
                            <h4 class="text-sm font-bold" style="margin-bottom: 12px;">📊 Resumo da Importação</h4>
                            <div id="import-preview-stats"></div>
                            <div style="margin-top: 16px; text-align: center;">
                                <button class="btn btn-secondary" onclick="app.materiais.goBackToStep2()" style="margin-right: 8px;">Voltar</button>
                                <button class="btn btn-primary" onclick="app.materiais.applyPriceImport()" id="btn-step3-apply">Aplicar Atualização</button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-cancel" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    onSupplierChange() {
        const supplierId = document.getElementById('import-supplier-select')?.value;
        const templateBtn = document.getElementById('btn-save-template');
        if (!supplierId) {
            if (templateBtn) templateBtn.style.display = 'none';
            return;
        }

        // Load template if exists
        const template = store.getPriceImportTemplate(supplierId);
        if (template && template.columns) {
            const map = (id) => {
                const el = document.getElementById(id);
                if (el && template.columns[id.replace('map-col-', '')]) {
                    el.value = template.columns[id.replace('map-col-', '')];
                }
            };
            map('map-col-code');
            map('map-col-price');
            map('map-col-fabricante');
            map('map-col-discount');
            map('map-col-markup');
            map('map-col-desc');
            app.toast(`Template "${template.name || template.fabricante || 'Sem nome'}" carregado.`, 'info');
        }
    },

    saveTemplate() {
        const supplierId = document.getElementById('import-supplier-select')?.value;
        if (!supplierId) {
            app.toast("Selecione um fornecedor para salvar o template.", "warning");
            return;
        }

        const supplier = store.getState().fornecedores.find(f => f.id === supplierId);
        if (!supplier) return;

        const columns = {
            code: document.getElementById('map-col-code')?.value || '',
            price: document.getElementById('map-col-price')?.value || '',
            fabricante: document.getElementById('map-col-fabricante')?.value || '',
            discount: document.getElementById('map-col-discount')?.value || '',
            markup: document.getElementById('map-col-markup')?.value || '',
            desc: document.getElementById('map-col-desc')?.value || ''
        };

        if (!columns.code || !columns.price) {
            app.toast("Mapeie ao menos Código e Preço antes de salvar.", "warning");
            return;
        }

        const name = prompt("Nome do template:", `Tabela ${supplier.razaoSocial || 'Fornecedor'}`);
        if (!name) return;

        store.savePriceImportTemplate(supplierId, {
            name,
            fabricante: supplier.razaoSocial || '',
            columns
        });

        app.toast(`Template "${name}" salvo com sucesso!`, "success");
    },

    handlePriceImportFile(input) {
        const file = input.files[0];
        if (!file) return;

        console.log('[Materiais] File selected:', file.name);
        const reader = new FileReader();
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);

        reader.onload = (e) => {
            try {
                if (isExcel) {
                    const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                    this._workbook = workbook;

                    const sheetNames = workbook.SheetNames;
                    const selector = document.getElementById('import-sheet-select');
                    const selectorDiv = document.getElementById('import-sheet-selector');

                    if (sheetNames.length > 1) {
                        if (selector) {
                            selector.innerHTML = sheetNames.map((name, i) =>
                                `<option value="${name}">${name}${i === 0 ? ' (padrão)' : ''}</option>`
                            ).join('');
                        }
                        if (selectorDiv) selectorDiv.style.display = 'block';
                    } else {
                        if (selectorDiv) selectorDiv.style.display = 'none';
                    }

                    const firstSheet = workbook.Sheets[sheetNames[0]];
                    const data = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
                    this._parseAndShowData(data);
                } else {
                    this._workbook = null;
                    const data = this.parseCSV(e.target.result);
                    this._parseAndShowData(data);
                }
            } catch (err) {
                console.error('[Materiais] Parse error:', err);
                app.toast("Erro ao processar arquivo.", "error");
            }
        };

        if (isExcel) reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
    },

    onSheetChange() {
        const select = document.getElementById('import-sheet-select');
        if (!select || !this._workbook) return;

        const sheetName = select.value;
        if (!sheetName) return;

        const sheet = this._workbook.Sheets[sheetName];
        if (!sheet) return;

        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        this._parseAndShowData(data);
    },

    _parseAndShowData(data) {
        if (!data || data.length === 0) {
            app.toast("Aba/planilha vazia ou inválida.", "error");
            return;
        }

        this.importData = data;
        this.renderImportStep2(data);
    },

    renderImportStep2(data) {
        const step1 = document.getElementById('import-step-1');
        const step2 = document.getElementById('import-step-2');
        const preview = document.getElementById('import-price-preview');

        const selectIds = ['map-col-code', 'map-col-price', 'map-col-fabricante', 'map-col-discount', 'map-col-markup', 'map-col-desc'];
        const selects = {};
        selectIds.forEach(id => { selects[id] = document.getElementById(id); });

        if (!step1 || !step2 || !data.length) return;

        step1.style.display = 'none';
        step2.style.display = 'block';

        // Show "Salvar como template" button if supplier is selected
        const supplierId = document.getElementById('import-supplier-select')?.value;
        const templateBtn = document.getElementById('btn-save-template');
        if (templateBtn) {
            templateBtn.style.display = supplierId ? 'inline-flex' : 'none';
        }

        const headers = Object.keys(data[0]);
        const optionsHtml = headers.map(h => `<option value="${h}">${h}</option>`).join('');

        // Populate required selects
        selects['map-col-code'].innerHTML = `<option value="">Selecione...</option>` + optionsHtml;
        selects['map-col-price'].innerHTML = `<option value="">Selecione...</option>` + optionsHtml;

        // Populate optional selects (with "Não mapear" option)
        ['map-col-fabricante', 'map-col-discount', 'map-col-markup', 'map-col-desc'].forEach(id => {
            if (selects[id]) {
                selects[id].innerHTML = `<option value="">— Não mapear —</option>` + optionsHtml;
            }
        });

        // Auto-detect columns (improved scoring)
        const columnHints = {
            code: ['codigo', 'código', 'code', 'ref', 'referencia', 'referência', 'pn', 'part number', 'sku', 'material', 'cód.'],
            price: ['preco', 'preço', 'custo', 'price', 'cost', 'valor', 'unit cost', 'list price', 'tabela'],
            desc: ['descricao', 'descrição', 'description', 'desc', 'nome', 'produto'],
            fabricante: ['fabricante', 'manufacturer', 'marca', 'brand', 'fornecedor'],
            markup: ['markup', 'margem', 'margin'],
            discount: ['desconto', 'discount', 'desc %']
        };

        if (selects['map-col-code']) {
            const best = this._bestMatch(headers, columnHints.code);
            if (best) selects['map-col-code'].value = best;
        }
        if (selects['map-col-price']) {
            const best = this._bestMatch(headers, columnHints.price);
            if (best) selects['map-col-price'].value = best;
        }
        if (selects['map-col-fabricante']) {
            const best = this._bestMatch(headers, columnHints.fabricante);
            if (best) selects['map-col-fabricante'].value = best;
        }
        if (selects['map-col-desc']) {
            const best = this._bestMatch(headers, columnHints.desc);
            if (best) selects['map-col-desc'].value = best;
        }
        if (selects['map-col-markup']) {
            const best = this._bestMatch(headers, columnHints.markup);
            if (best) selects['map-col-markup'].value = best;
        }
        if (selects['map-col-discount']) {
            const best = this._bestMatch(headers, columnHints.discount);
            if (best) selects['map-col-discount'].value = best;
        }

        // Render Preview (first 10 lines with enriched columns)
        const thead = preview.querySelector('thead');
        const tbody = preview.querySelector('tbody');
        const previewRows = data.slice(0, 10);

        const priceCol = selects['map-col-price']?.value || headers[0];
        const fabricanteCol = selects['map-col-fabricante']?.value;
        const markupCol = selects['map-col-markup']?.value;
        const discountCol = selects['map-col-discount']?.value;
        const descCol = selects['map-col-desc']?.value;

        // Build preview columns: first data columns + enriched
        const dataCols = headers.slice(0, 4);
        const enrichedCols = [
            { label: 'R$ Normalizado', key: 'normalizedPrice' },
            { label: 'Custo Final', key: 'finalCost' },
        ];
        if (fabricanteCol) enrichedCols.push({ label: 'Fabricante', key: 'fabricante' });
        if (markupCol) enrichedCols.push({ label: 'Markup', key: 'markup' });
        if (discountCol) enrichedCols.push({ label: 'Desconto', key: 'discount' });

        thead.innerHTML = `<tr>
            ${dataCols.map(h => `<th>${h}</th>`).join('')}
            ${enrichedCols.map(c => `<th style="color:#3b82f6;">${c.label}</th>`).join('')}
        </tr>`;

        tbody.innerHTML = previewRows.map(r => {
            const rawPrice = r[priceCol];
            const normalized = this.normalizeNumber(rawPrice);
            const discount = discountCol ? this.normalizeNumber(r[discountCol]) : NaN;
            const finalCost = Number.isFinite(normalized) && Number.isFinite(discount)
                ? normalized * (1 - discount / 100)
                : normalized;

            const enriched = {
                normalizedPrice: Number.isFinite(normalized) ? normalized.toFixed(2) : '-',
                finalCost: Number.isFinite(finalCost) ? finalCost.toFixed(2) : '-',
                fabricante: fabricanteCol ? (r[fabricanteCol] || '-') : null,
                markup: markupCol ? (r[markupCol] || '-') : null,
                discount: discountCol ? (Number.isFinite(discount) ? discount.toFixed(1) + '%' : '-') : null,
            };

            return `<tr>
                ${dataCols.map(h => `<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r[h] !== undefined ? r[h] : ''}</td>`).join('')}
                ${enrichedCols.map(c => `<td style="color:#3b82f6;font-weight:600;${c.key === 'finalCost' ? 'color:#16a34a;' : ''}">${enriched[c.key] || '-'}</td>`).join('')}
            </tr>`;
        }).join('');
    },

    previewImport() {
        const colCode = document.getElementById('map-col-code')?.value;
        const colPrice = document.getElementById('map-col-price')?.value;
        const colFabricante = document.getElementById('map-col-fabricante')?.value;
        const colDiscount = document.getElementById('map-col-discount')?.value;
        const colMarkup = document.getElementById('map-col-markup')?.value;
        const title = document.getElementById('import-price-title')?.value;

        if (!colCode || !colPrice) {
            app.toast("Mapeie as colunas de Código e Preço.", "warning");
            return;
        }

        if (!this.importData) return;

        const allMaterials = store.getState().materiais || [];
        const rows = this.importData.map(r => {
            const code = String(r[colCode] || '').trim().toLowerCase();
            const newCost = this.normalizeNumber(r[colPrice]);
            let rowFabricante = null;
            if (colFabricante) rowFabricante = String(r[colFabricante] || '').trim().toLowerCase();
            let discount = NaN;
            if (colDiscount) discount = this.normalizeNumber(r[colDiscount]);
            const finalCost = Number.isFinite(newCost) && Number.isFinite(discount)
                ? newCost * (1 - discount / 100) : newCost;
            return { code, newCost, finalCost, rowFabricante, discount: Number.isFinite(discount) ? discount : null };
        }).filter(r => r.code && Number.isFinite(r.newCost));

        if (rows.length === 0) {
            app.toast("Nenhuma linha válida encontrada para importação.", "warning");
            return;
        }

        // Dry-run match
        let matched = 0;
        let unmatched = [];
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let minReajuste = Infinity;
        let maxReajuste = -Infinity;
        let minReajusteCode = '';
        let maxReajusteCode = '';

        rows.forEach(r => {
            // Try to find a matching material
            const material = allMaterials.find(m => {
                const codeMatch = (m.codigoInterno && String(m.codigoInterno).trim().toLowerCase() === r.code) ||
                    (m.codigoFabricante && String(m.codigoFabricante).trim().toLowerCase() === r.code);
                if (!codeMatch) return false;
                // Fabricante filter
                if (r.rowFabricante && m.fabricante) {
                    const matFab = String(m.fabricante).trim().toLowerCase();
                    if (r.rowFabricante !== matFab) return false;
                }
                return true;
            });

            if (material) {
                matched++;
                if (r.finalCost < minPrice) minPrice = r.finalCost;
                if (r.finalCost > maxPrice) maxPrice = r.finalCost;
                const oldCost = parseFloat(material.custo) || 0;
                if (oldCost > 0) {
                    const reajuste = ((r.finalCost - oldCost) / oldCost) * 100;
                    if (reajuste < minReajuste) { minReajuste = reajuste; minReajusteCode = r.code; }
                    if (reajuste > maxReajuste) { maxReajuste = reajuste; maxReajusteCode = r.code; }
                }
            } else {
                unmatched.push(r.code);
            }
        });

        this._lastUnmatched = unmatched;
        this._renderImportStep3({ rows, matched, unmatched, total: rows.length, minPrice, maxPrice, minReajuste, maxReajuste, minReajusteCode, maxReajusteCode });
    },

    _renderImportStep3(stats) {
        const step2 = document.getElementById('import-step-2');
        const step3 = document.getElementById('import-step-3');
        const container = document.getElementById('import-preview-stats');
        if (!step2 || !step3 || !container) return;

        step2.style.display = 'none';
        step3.style.display = 'block';

        const matchPct = stats.total > 0 ? ((stats.matched / stats.total) * 100).toFixed(0) : '0';
        const hasUnmatched = stats.unmatched.length > 0;
        const priceRange = stats.matched > 0
            ? `${app.formatCurrency(stats.minPrice)} — ${app.formatCurrency(stats.maxPrice)}`
            : '—';

        const reajusteHtml = stats.matched > 0 && stats.maxReajuste > -Infinity ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
                <span style="color:#64748b;font-size:13px;">Menor reajuste:</span>
                <span><span style="font-weight:700;font-size:15px;color:${stats.minReajuste < 0 ? '#16a34a' : '#ef4444'};">${stats.minReajuste >= 0 ? '+' : ''}${stats.minReajuste.toFixed(1)}%</span> <span style="font-size:11px;color:#94a3b8;">(${stats.minReajusteCode})</span></span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
                <span style="color:#64748b;font-size:13px;">Maior reajuste:</span>
                <span><span style="font-weight:700;font-size:15px;color:${stats.maxReajuste >= 0 ? '#ef4444' : '#16a34a'};">${stats.maxReajuste >= 0 ? '+' : ''}${stats.maxReajuste.toFixed(1)}%</span> <span style="font-size:11px;color:#94a3b8;">(${stats.maxReajusteCode})</span></span>
            </div>
        ` : '';

        container.innerHTML = `
            <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
                    <span style="color:#64748b;font-size:13px;">Total de linhas válidas:</span>
                    <span style="font-weight:700;font-size:15px;">${stats.total}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
                    <span style="color:#64748b;font-size:13px;">Correspondências encontradas:</span>
                    <span style="color:#16a34a;font-weight:700;font-size:15px;">${stats.matched} <span style="font-weight:400;font-size:12px;color:#64748b;">(${matchPct}%)</span></span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
                    <span style="color:#64748b;font-size:13px;">Sem correspondência:</span>
                    <span style="color:${hasUnmatched ? '#dc2626' : '#16a34a'};font-weight:700;font-size:15px;">${stats.unmatched.length}${hasUnmatched ? ` <button class="btn btn-ghost btn-sm" style="font-size:11px;color:#3b82f6;padding:0 4px;vertical-align:middle;" onclick="app.materiais.downloadUnmatched()"><i class="ph ph-download-simple"></i> Baixar lista</button>` : ''}</span>
                </div>
                <hr style="margin:12px 0;border:none;border-top:1px dashed #e2e8f0;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
                    <span style="color:#64748b;font-size:13px;">Faixa de preços:</span>
                    <span style="font-weight:700;font-size:15px;">${priceRange}</span>
                </div>
                ${reajusteHtml}
            </div>
            <p style="margin-top:12px;text-align:center;font-size:12px;color:#94a3b8;">
                <i class="ph ph-info"></i> Revise as informações acima antes de confirmar a importação.
            </p>
        `;
    },

    goBackToStep2() {
        const step2 = document.getElementById('import-step-2');
        const step3 = document.getElementById('import-step-3');
        if (step2) step2.style.display = 'block';
        if (step3) step3.style.display = 'none';
    },

    downloadUnmatched() {
        if (!this._lastUnmatched) return;
        const header = 'Código';
        const rows = this._lastUnmatched.map(c => `"${c}"`).join('\n');
        const csv = `${header}\n${rows}`;
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nao_encontrados_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    applyPriceImport() {
        const colCode = document.getElementById('map-col-code')?.value;
        const colPrice = document.getElementById('map-col-price')?.value;
        const colFabricante = document.getElementById('map-col-fabricante')?.value;
        const colDiscount = document.getElementById('map-col-discount')?.value;
        const colMarkup = document.getElementById('map-col-markup')?.value;
        const title = document.getElementById('import-price-title')?.value;

        if (!colCode || !colPrice) {
            app.toast("Mapeie as colunas de Código e Preço.", "warning");
            return;
        }

        if (!this.importData) return;

        const updates = this.importData.map(r => {
            const update = { code: r[colCode], newCost: this.normalizeNumber(r[colPrice]) };

            // Fabricante filter per row
            if (colFabricante) update.rowFabricante = r[colFabricante];

            // Markup per row
            if (colMarkup) {
                const markup = parseFloat(r[colMarkup]);
                update.newMarkup = !isNaN(markup) ? markup : null;
            }

            // Discount per row
            if (colDiscount) {
                const discount = this.normalizeNumber(r[colDiscount]);
                update.discount = Number.isFinite(discount) ? discount : null;
            }

            return update;
        }).filter(u => u.code && Number.isFinite(u.newCost));

        if (updates.length === 0) {
            app.toast("Nenhuma linha válida encontrada para importação.", "warning");
            return;
        }

        const metadata = {
            title: title || 'Importação de Planilha',
            date: new Date().toISOString()
        };

        const updatedCount = store.importPricesByCode(updates, metadata);

        if (updatedCount > 0) {
            app.toast(`${updatedCount} de ${updates.length} materiais atualizados com sucesso!`, "success");
            document.getElementById('modal-import-prices').remove();
            this.importData = null;
            this.doSearch();
        } else {
            app.toast("Nenhuma correspondência encontrada. Verifique se os códigos na planilha batem com os códigos no sistema.", "warning");
        }
    },

    openHistoryModal(id) {
        const material = store.getState().materiais.find(m => m.id === id);
        if (!material) return;

        const history = store.getPriceHistory(id);
        if (history.length === 0) {
            app.toast("Nenhum histórico de preços disponível.", "info");
            return;
        }

        const modalId = 'modal-price-history';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const rows = history.map((entry, i) => {
            const actualIndex = (material.priceHistory?.length || 0) - 1 - i;
            return `
                <tr>
                    <td style="padding: 8px; white-space: nowrap;">${new Date(entry.date).toLocaleDateString('pt-BR')} ${new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style="padding: 8px; font-weight: 600;">${app.formatCurrency(entry.custo)}</td>
                    <td style="padding: 8px;">${entry.markup || 0}%</td>
                    <td style="padding: 8px;"><span style="display:inline-block;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:600;${entry.origin === 'bulk' ? 'background:#fef3c7;color:#92400e;' : entry.origin === 'import' ? 'background:#e0f2fe;color:#0369a1;' : entry.origin === 'restore' ? 'background:#f3e8ff;color:#6b21a8;' : 'background:#dcfce7;color:#15803d;'}">${entry.origin === 'bulk' ? 'Massa' : entry.origin === 'import' ? 'Planilha' : entry.origin === 'restore' ? 'Restaurado' : 'Manual'}</span></td>
                    <td style="padding: 8px; font-size: 12px; color: #64748b;">${entry.title}</td>
                    <td style="padding: 8px;">${i > 0 ? `<button class="btn btn-ghost btn-sm" style="padding: 2px 6px; font-size: 11px; color: #3b82f6;" onclick="app.materiais.restorePrice('${id}', ${actualIndex})" title="Restaurar este valor"><i class="ph ph-arrow-counter-clockwise"></i></button>` : '<span class="text-xs text-muted">Atual</span>'}</td>
                </tr>
            `;
        }).join('');

        const current = history[0];
        const html = `
            <div id="${modalId}" class="modal-overlay" style="z-index: 10000;">
                <div class="modal" style="width: 800px; max-width: 95vw;">
                    <div class="modal-header">
                        <h3 class="card-title"><i class="ph ph-clock-counter-clockwise"></i> Histórico de Preços</h3>
                        <button class="btn btn-icon" onclick="document.getElementById('${modalId}').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 16px; padding: 12px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
                            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${material.descricao}</div>
                            <div class="text-xs text-muted">${material.codigoInterno} | ${material.fabricante} | ${material.categoria}</div>
                            <div style="margin-top: 8px; display: flex; gap: 20px;">
                                <div><span class="text-xs text-muted">Preço Atual:</span> <span style="font-weight: 700; color: var(--color-accent);">${app.formatCurrency(current.custo)}</span></div>
                                <div><span class="text-xs text-muted">Markup:</span> <span style="font-weight: 600;">${current.markup || 0}%</span></div>
                                <div><span class="text-xs text-muted">Última atualização:</span> <span style="font-weight: 600;">${new Date(current.date).toLocaleDateString('pt-BR')}</span></div>
                            </div>
                        </div>

                        <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                            <table style="font-size: 12px;">
                                <thead>
                                    <tr>
                                        <th style="padding: 8px;">Data</th>
                                        <th style="padding: 8px;">Custo</th>
                                        <th style="padding: 8px;">Markup</th>
                                        <th style="padding: 8px;">Origem</th>
                                        <th style="padding: 8px;">Título</th>
                                        <th style="padding: 8px; width: 60px;">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">Fechar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    async restorePrice(id, index) {
        const material = store.getState().materiais.find(m => m.id === id);
        if (!material) return;

        const history = material.priceHistory || [];
        const entry = history[index];
        if (!entry) return;

        const confirmed = await app.confirm(
            `Restaurar o preço de R$ ${app.formatCurrency(entry.custo)} (${entry.title}) para "${material.descricao}"?`,
            "Restaurar Preço"
        );
        if (!confirmed) return;

        store.restorePrice(id, index);
        document.getElementById('modal-price-history')?.remove();
        app.toast(`Preço restaurado para ${app.formatCurrency(entry.custo)}`, "success");
    },

    cleanupDuplicates() {
        app.confirm("Deseja remover materiais duplicados? O sistema manterá apenas a versão mais recente de cada código.", "Limpar Duplicados")
            .then(confirmed => {
                if (confirmed) {
                    const removedCount = store.cleanupDuplicateMaterials();
                    if (removedCount > 0) {
                        app.toast(`${removedCount} materiais duplicados removidos com sucesso!`, "success");
                    } else {
                        app.toast("Nenhum material duplicado encontrado.", "info");
                    }
                    this.doSearch();
                }
            });
    },

    async uploadDxf() {
        const input = document.getElementById('dxf-file-input');
        if (!input) return;
        input.value = '';
        input.click();
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith('.dxf')) {
                app.toast('Selecione um arquivo no formato DXF.', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                app.toast('Arquivo DXF muito grande (máx 5MB). O DXF deve conter apenas a geometria de um componente individual, não um painel completo.', 'error');
                return;
            }
            const form = document.getElementById('form-material');
            if (!form) return;
            const materialId = form.querySelector('[name="id"]')?.value;
            if (!materialId) {
                app.toast('Salve o material primeiro antes de associar um DXF.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64 = e.target.result.split(',')[1];
                    const resp = await fetch('/api/materiais/' + materialId + '/dxf', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (store.getState().auth?.token || '') },
                        body: JSON.stringify({ fileData: base64 })
                    });
                    const data = await resp.json();
                    if (data.success) {
                        app.toast('Desenho DXF importado com sucesso!', 'success');
                        await this._renderDxfPreview(materialId);
                    } else {
                        app.toast('Erro ao importar DXF: ' + (data.error || 'Erro desconhecido'), 'error');
                    }
                } catch (err) {
                    app.toast('Erro ao ler arquivo DXF.', 'error');
                }
            };
            reader.readAsDataURL(file);
        };
    },

    async removeDxf() {
        const form = document.getElementById('form-material');
        if (!form) return;
        const materialId = form.querySelector('[name="id"]')?.value;
        if (!materialId) return;
        if (!await app.confirm('Remover o desenho DXF deste material? O componente passará a ser representado como retângulo no layout.', 'Remover DXF')) return;
        const resp = await fetch('/api/materiais/' + materialId + '/dxf', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + (store.getState().auth?.token || '') }
        });
        const data = await resp.json();
        if (data.success) {
            app.toast('Desenho DXF removido.', 'success');
            document.getElementById('dxf-preview-area').style.display = 'none';
            document.getElementById('dxf-empty-state').style.display = 'block';
            document.getElementById('btn-remove-dxf').style.display = 'none';
        } else {
            app.toast('Erro ao remover DXF.', 'error');
        }
    },

    async _renderDxfPreview(materialId) {
        const resp = await fetch('/api/materiais/' + materialId + '/dxf', {
            headers: { 'Authorization': 'Bearer ' + (store.getState().auth?.token || '') }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const hasBlock = !!data.dxf_block;
        document.getElementById('dxf-preview-area').style.display = hasBlock ? 'flex' : 'none';
        document.getElementById('dxf-empty-state').style.display = hasBlock ? 'none' : 'block';
        document.getElementById('btn-remove-dxf').style.display = hasBlock ? '' : 'none';
        if (hasBlock) {
            document.getElementById('dxf-file-name').textContent = 'Desenho DXF associado';
            let entityCount = 0;
            try { entityCount = JSON.parse(data.dxf_block).entities.length; } catch (e) { entityCount = 0; }
            document.getElementById('dxf-entity-count').textContent = entityCount + ' entidades geométricas';
        }
    }
};

window.materiaisModule = MateriaisModule;
MateriaisModule.init();
