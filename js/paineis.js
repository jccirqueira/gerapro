import { store } from './state.js';

/**
 * Paineis Module (Tipos de Painéis)
 * Manages Panel Types and their Bill of Materials (BOM).
 */

const PaineisModule = {
    init() {
        window.app.paineis = {
            create: this.create.bind(this),
            edit: this.edit.bind(this),
            delete: this.delete.bind(this),
            save: this.save.bind(this),
            closeModal: this.closeModal.bind(this),
            // Builder methods
            addItem: this.addItem.bind(this),
            removeItem: this.removeItem.bind(this),
            recalculateCosts: this.recalculateCosts.bind(this),
            openMaterialSelector: this.openMaterialSelector.bind(this),
            closeMaterialSelector: this.closeMaterialSelector.bind(this),
            filterSelectorItems: this.filterSelectorItems.bind(this),
            selectMaterial: this.selectMaterial.bind(this),
            updateSigla: this.updateSigla.bind(this),
            onClasseTensaoChange: this.onClasseTensaoChange.bind(this),
            updateItemQtd: this.updateItemQtd.bind(this),
            resetView: this.resetView.bind(this)
        };

        this.viewMode = 'list';

        store.subscribe((state) => {
            const container = document.getElementById('view-paineis');
            if (container && !container.classList.contains('hidden-module')) {
                if (this.viewMode === 'list') {
                    this.renderList(state.painelTypes);
                }
            }
        });

        this.currentBuilderState = {
            id: null,
            items: []
        };
    },

    resetView() {
        this.viewMode = 'list';
    },

    render() {
        console.log("[Paineis] Render called. viewMode:", this.viewMode);
        if (this.viewMode === 'form') return;

        const container = document.getElementById('view-paineis');
        if (!container) {
            console.error("[Paineis] Container #view-paineis not found!");
            return;
        }

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <!-- Header -->
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-rows"></i> Cadastro de Tipos de Painéis
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Especificação de Estruturas, Dimensões e Lista de Materiais Padrão</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.paineis.create()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-plus"></i> Novo Tipo de Painel</button>` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-container">
                            <table id="paineis-table">
                                <thead>
                                    <tr>
                                        <th>Tipo / Descrição</th>
                                        <th>Dimensões (AxLxP)</th>
                                        <th>Grau de Proteção</th>
                                        <th>Custo Est.</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Dynamic Content -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const items = store.getState().painelTypes;
        console.log("[Paineis] Rendering list with items:", items);
        this.renderList(items);
    },

    renderList(items) {
        const tbody = document.querySelector('#paineis-table tbody');
        if (!tbody) {
            console.error("[Paineis] Table body not found!");
            return;
        }

        if (!items || items.length === 0) {
            console.log("[Paineis] No items to display.");
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">Nenhum tipo de painel cadastrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(p => `
            <tr>
                <td>
                    <div style="font-weight: bold;">${p.tipo}</div>
                    <div class="text-xs text-muted">${p.descricao || ''}</div>
                </td>
                <td>${p.altura || '-'} x ${p.largura || '-'} x ${p.profundidade || '-'} mm</td>
                <td>${p.ip || '-'}</td>
                <td>${app.formatCurrency(p.custoTotal || 0)}</td>
                <td>
                     ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.paineis.edit('${p.id}')"><i class="ph ph-pencil-simple"></i></button>` : ''}
                     ${store.canDelete() ? `<button class="btn btn-ghost text-danger" onclick="app.paineis.delete('${p.id}')"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    create() {
        this.currentBuilderState = {
            id: null,
            tipo: '',
            descricao: '',
            altura: '',
            largura: '',
            profundidade: '',
            ip: '',
            cor: '',
            items: [] // Bill of Materials
        };
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    edit(id) {
        const item = store.getState().painelTypes.find(x => x.id === id);
        if (!item) return;
        this.currentBuilderState = JSON.parse(JSON.stringify(item)); // Deep copy

        // Ensure new metadata fields exist for older items if any
        this.currentBuilderState.cat_categoria = this.currentBuilderState.cat_categoria || '';
        this.currentBuilderState.cat_tensao = this.currentBuilderState.cat_tensao || '';
        this.currentBuilderState.cat_forma = this.currentBuilderState.cat_forma || '1';
        this.currentBuilderState.cat_execucao = this.currentBuilderState.cat_execucao || 'FX';
        this.currentBuilderState.cat_instalacao = this.currentBuilderState.cat_instalacao || 'LN';
        this.currentBuilderState.cat_gp = this.currentBuilderState.cat_gp || 'IP54';
        this.currentBuilderState.cat_cor = this.currentBuilderState.cat_cor || 'RAL 7035';

        // Ensure items array exists
        if (!this.currentBuilderState.items) this.currentBuilderState.items = [];
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    renderBuilder() {
        const state = this.currentBuilderState;
        const isEdit = !!state.id;

        // Calculate totals for display
        const totalCost = state.items.reduce((acc, item) => acc + (item.custo * item.qtd), 0);
        state.custoTotal = totalCost; // Update state ref

        const html = `
            <div id="form-painel-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.paineis.closeModal()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">${isEdit ? 'Editar Tipo de Painel' : 'Novo Tipo de Painel'}</h3>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <div class="text-sm text-muted">Custo Estimado: <b style="color: var(--color-primary); font-size: 1.1em;">${app.formatCurrency(totalCost)}</b></div>
                            <button class="btn btn-cancel" onclick="app.paineis.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.paineis.save()"><i class="ph ph-check"></i> Salvar</button>
                        </div>
                    </div>

                    <div style="flex: 1; padding: 0; display: flex; overflow: hidden;">
                        <!-- Left Pane: Properties -->
                        <div style="width: 350px; padding: 20px; border-right: 1px solid var(--color-border); background: #f8fafc; overflow-y: auto;">
                            <h4 class="text-sm font-bold" style="margin-bottom: 16px; color: #64748b; text-transform: uppercase;">Propriedades Gerais</h4>
                            
                            <form id="form-painel-props">
                                <div class="form-group">
                                    <label class="form-label">Tipo (Sigla) *</label>
                                    <input type="text" id="p-tipo" class="form-control" value="${state.tipo || ''}" placeholder="Gerado automaticamente..." readonly style="background: #f1f5f9; font-weight: bold;">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Categoria</label>
                                    <select id="p-categoria" class="form-control" onchange="app.paineis.updateSigla()">
                                        <option value="">Selecione...</option>
                                        ${['CCM', 'QGBT', 'CUB', 'QDF', 'QDL', 'QTA', 'PLC', 'BC', 'REM'].map(opt => `<option value="${opt}" ${state.cat_categoria === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Classe Tensão</label>
                                    <select id="p-classe-tensao" class="form-control" onchange="app.paineis.onClasseTensaoChange()">
                                        <option value="">Selecione...</option>
                                        <option value="BT690" ${state.cat_tensao === 'BT690' ? 'selected' : ''}>BT690</option>
                                        <option value="MT17,5" ${state.cat_tensao === 'MT17,5' ? 'selected' : ''}>MT17,5</option>
                                        <option value="MT24" ${state.cat_tensao === 'MT24' ? 'selected' : ''}>MT24</option>
                                        <option value="MT36" ${state.cat_tensao === 'MT36' ? 'selected' : ''}>MT36</option>
                                    </select>
                                </div>

                                <div id="group-bt-only" style="${state.cat_tensao === 'BT690' ? 'display: block;' : 'display: none;'}">
                                    <div class="form-group">
                                        <label class="form-label">Forma</label>
                                        <select id="p-forma" class="form-control" onchange="app.paineis.updateSigla()">
                                            ${['1', '2B', '3A', '3B', '4A', '4B'].map(opt => `<option value="${opt}" ${state.cat_forma === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                                        </select>
                                    </div>

                                    <div class="form-group" id="group-execucao" style="${['3A', '3B', '4A', '4B'].includes(state.cat_forma) ? 'display: block;' : 'display: none;'}">
                                        <label class="form-label">Execução</label>
                                        <select id="p-execucao" class="form-control" onchange="app.paineis.updateSigla()">
                                            ${['FX', 'EX'].map(opt => `<option value="${opt}" ${state.cat_execucao === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Instalação</label>
                                        <select id="p-instalacao" class="form-control" onchange="app.paineis.updateSigla()">
                                            ${['BB', 'LN'].map(opt => `<option value="${opt}" ${state.cat_instalacao === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Grau de Proteção</label>
                                        <select id="p-gp" class="form-control" onchange="app.paineis.updateSigla()">
                                            ${['IP21', 'IP42', 'IP54', 'IP65'].map(opt => `<option value="${opt}" ${state.cat_gp === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Cor de Acabamento</label>
                                    <select id="p-cor-acabamento" class="form-control" onchange="app.paineis.updateSigla()">
                                        <option value="RAL 7032" ${state.cat_cor === 'RAL 7032' ? 'selected' : ''}>RAL 7032</option>
                                        <option value="RAL 7035" ${state.cat_cor === 'RAL 7035' ? 'selected' : ''}>RAL 7035</option>
                                        <option value="Munsell N6.5" ${state.cat_cor === 'Munsell N6.5' ? 'selected' : ''}>Munsell N6.5</option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                    <label class="form-label">Descrição Complementar</label>
                                    <input type="text" id="p-descricao" class="form-control" value="${state.descricao || ''}" placeholder="Ex: CCM com Gavetas Fixas">
                                </div>
                                
                                <div class="row" style="display: flex; gap: 10px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Altura (mm)</label>
                                        <input type="number" id="p-altura" class="form-control" value="${state.altura || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Largura (mm)</label>
                                        <input type="number" id="p-largura" class="form-control" value="${state.largura || ''}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Profundidade (mm)</label>
                                    <input type="number" id="p-profundidade" class="form-control" value="${state.profundidade || ''}">
                                </div>
                            </form>
                        </div>

                        <!-- Right Pane: Bill of Materials -->
                        <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; overflow: hidden; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-shrink: 0;">
                                <h4 class="text-sm font-bold" style="color: #64748b; text-transform: uppercase;">Lista de Materiais (Estrutura)</h4>
                                <button class="btn btn-sm btn-primary" onclick="app.paineis.openMaterialSelector()"><i class="ph ph-plus"></i> Adicionar Material</button>
                            </div>
                            
                            <div class="table-container" style="flex: 1; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 4px;">
                                <table class="w-full text-left" style="font-size: 13px;">
                                    <thead style="position: sticky; top: 0; background: #fff; z-index: 1;">
                                        <tr style="background: #f1f5f9; color: #475569;">
                                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; width: 60px; text-align: center;">Qtd</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Descrição</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Fabricante</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; width: 100px; text-align: right;">Custo Unit.</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; width: 100px; text-align: right;">Subtotal</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; width: 50px;"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="painel-items-body">
                                        ${this.renderBuilderItems(state.items)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const container = document.getElementById('view-paineis');
        if (container) {
            container.innerHTML = html;
        }
    },

    renderBuilderItems(items) {
        if (!items || items.length === 0) {
            return `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">Nenhum material adicionado.<br>Clique em "Adicionar Material" para compor a estrutura deste painel.</td></tr>`;
        }

        return items.map((item, index) => `
            <tr>
                <td style="text-align: center;">
                    <input type="number" class="form-control" value="${item.qtd}" min="1" style="width: 50px; text-align: center; padding: 2px;" onchange="app.paineis.updateItemQtd(${index}, this.value)">
                </td>
                <td>
                    <div style="font-weight: 500;">${item.descricao}</div>
                    <div style="font-size: 11px; color: #64748b;">${item.codigoFabricante || ''}</div>
                </td>
                <td>${item.fabricante || '-'}</td>
                <td style="text-align: right;">${app.formatCurrency(item.custo)}</td>
                <td style="text-align: right; font-weight: 600;">${app.formatCurrency(item.custo * item.qtd)}</td>
                <td style="text-align: center;">
                    ${store.canDelete() ? `<button class="btn-icon text-danger" onclick="app.paineis.removeItem(${index})"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    // --- State Updates for Builder ---

    updateItemQtd(index, newQtd) {
        if (newQtd < 1) newQtd = 1;
        this.currentBuilderState.items[index].qtd = parseFloat(newQtd);
        this.renderBuilder(); // Re-render to update totals
    },

    removeItem(index) {
        this.currentBuilderState.items.splice(index, 1);
        this.renderBuilder();
    },

    recalculateCosts() {
        // Reload costs from master Materials DB
        const materialsDB = store.getState().materiais;
        let updatedCount = 0;

        this.currentBuilderState.items = this.currentBuilderState.items.map(item => {
            if (!item.materialId) return item;
            const fresh = materialsDB.find(m => m.id === item.materialId);
            if (fresh) {
                if (fresh.custo !== item.custo) updatedCount++;
                return { ...item, custo: fresh.custo, descricao: fresh.descricao, fabricante: fresh.fabricante };
            }
            return item;
        });

        if (updatedCount > 0) window.app.toast(`${updatedCount} itens tiveram seus custos atualizados.`, "info");
        this.renderBuilder();
    },

    // --- Material Selector (Similar to Tipicos) ---

    openMaterialSelector() {
        // Reuse or create a selector modal
        const html = `
            <div id="modal-material-selector" class="modal-overlay" style="z-index: 10100;">
                <div class="modal" style="width: 800px; height: 80vh;">
                    <div class="modal-header">
                        <h3 class="card-title">Selecionar Material</h3>
                        <button class="btn btn-ghost" onclick="app.paineis.closeMaterialSelector()"><i class="ph ph-x"></i></button>
                    </div>
                    <div style="padding: 10px; border-bottom: 1px solid var(--color-border);">
                        <input type="text" id="mat-selector-search" class="form-control" placeholder="Buscar por descrição, código ou fabricante..." onkeyup="app.paineis.filterSelectorItems()">
                    </div>
                    <div class="modal-body" style="padding: 0; overflow-y: auto;">
                        <table class="w-full text-left">
                            <thead style="position: sticky; top: 0; background: #fff;">
                                <tr style="background: #f8fafc;">
                                    <th style="padding: 8px;">Descrição</th>
                                    <th style="padding: 8px;">Fabricante</th>
                                    <th style="padding: 8px;">Custo</th>
                                    <th style="padding: 8px; width: 50px;"></th>
                                </tr>
                            </thead>
                            <tbody id="mat-selector-body">
                                <!-- Items -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        this.filterSelectorItems(); // Initial populate

        // Auto focus search
        setTimeout(() => document.getElementById('mat-selector-search').focus(), 100);
    },

    closeMaterialSelector() {
        const m = document.getElementById('modal-material-selector');
        if (m) m.remove();
    },

    filterSelectorItems() {
        const term = document.getElementById('mat-selector-search')?.value.toLowerCase() || '';
        const tbody = document.getElementById('mat-selector-body');
        if (!tbody) return;

        const allMaterials = store.getState().materiais || [];
        // Limit to 50 for performance
        const filtered = allMaterials.filter(m =>
        (m.descricao.toLowerCase().includes(term) ||
            m.codigoFabricante?.toLowerCase().includes(term) ||
            m.fabricante?.toLowerCase().includes(term))
        ).slice(0, 50);

        tbody.innerHTML = filtered.map(m => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px;">
                    <div style="font-weight: 500;">${m.descricao}</div>
                    <div style="font-size: 11px; color: #64748b;">${m.codigoFabricante || ''}</div>
                </td>
                <td style="padding: 8px;">${m.fabricante}</td>
                <td style="padding: 8px;">${app.formatCurrency(m.custo || 0)}</td>
                <td style="padding: 8px; text-align: center;">
                    <button class="btn btn-sm btn-primary" onclick="app.paineis.selectMaterial('${m.id}')">Selecionar</button>
                </td>
            </tr>
        `).join('');
    },

    selectMaterial(id) {
        const material = store.getState().materiais.find(m => m.id === id);
        if (material) {
            this.addItem(material);
            this.closeMaterialSelector();
            window.app.toast("Material adicionado.", "success");
        }
    },

    addItem(material) {
        this.currentBuilderState.items.push({
            materialId: material.id,
            descricao: material.descricao,
            fabricante: material.fabricante,
            codigoFabricante: material.codigoFabricante,
            custo: parseFloat(material.custo || 0),
            qtd: 1 // Default qty
        });
        this.renderBuilder();
    },

    // --- CRUD ---

    save() {
        // Collect Form Data from Left Pane
        const tipo = document.getElementById('p-tipo').value;
        if (!tipo) {
            window.app.toast("O campo 'Tipo' é obrigatório.", "error");
            return;
        }

        const newState = {
            ...this.currentBuilderState,
            tipo: document.getElementById('p-tipo').value,
            cat_categoria: document.getElementById('p-categoria').value,
            cat_tensao: document.getElementById('p-classe-tensao').value,
            cat_forma: document.getElementById('p-forma')?.value || '',
            cat_execucao: document.getElementById('p-execucao')?.value || '',
            cat_instalacao: document.getElementById('p-instalacao')?.value || '',
            cat_gp: document.getElementById('p-gp')?.value || '',
            cat_cor: document.getElementById('p-cor-acabamento').value,
            descricao: document.getElementById('p-descricao')?.value || '',
            altura: document.getElementById('p-altura')?.value || '',
            largura: document.getElementById('p-largura')?.value || '',
            profundidade: document.getElementById('p-profundidade')?.value || '',
            ip: document.getElementById('p-gp')?.value || document.getElementById('p-ip')?.value || 'IP54',
            cor: document.getElementById('p-cor-acabamento')?.value || '7035'
        };

        // Calculate final total cost before saving
        newState.custoTotal = newState.items.reduce((acc, item) => acc + (item.custo * item.qtd), 0);

        if (newState.id) {
            // Update
            const list = store.getState().painelTypes.map(p => p.id === newState.id ? newState : p);
            store.setState({ painelTypes: list });
        } else {
            // Create
            newState.id = crypto.randomUUID();
            const list = [...(store.getState().painelTypes || []), newState];
            store.setState({ painelTypes: list });
        }

        window.app.toast("Tipo de painel salvo com sucesso!", "success");
        this.closeModal();
    },

    async delete(id) {
        if (await window.app.confirm("Remover este tipo de painel?")) {
            const list = store.getState().painelTypes.filter(p => p.id !== id);
            store.setState({ painelTypes: list });
            window.app.toast("Tipo de painel removido.", "info");
        }
    },

    closeModal() {
        this.viewMode = 'list';
        this.render();
    },

    // --- Logic for Sigla Generation ---

    onClasseTensaoChange() {
        const val = document.getElementById('p-classe-tensao').value;
        const group = document.getElementById('group-bt-only');
        if (group) {
            group.style.display = (val === 'BT690') ? 'block' : 'none';
        }
        this.updateSigla();
    },

    updateSigla() {
        const cat = document.getElementById('p-categoria').value;
        const tensao = document.getElementById('p-classe-tensao').value;
        const corFull = document.getElementById('p-cor-acabamento').value;

        if (!cat || !tensao) return;

        let siglaParts = [cat];

        // Mapping Tensao
        if (tensao === 'BT690') {
            siglaParts.push('BT');
            // Add BT exclusive fields
            const forma = document.getElementById('p-forma').value;
            const inst = document.getElementById('p-instalacao').value;
            const gp = document.getElementById('p-gp').value;

            siglaParts.push(forma);

            // Execucao only for 3A, 3B, 4A, 4B
            const groupExec = document.getElementById('group-execucao');
            const showExec = ['3A', '3B', '4A', '4B'].includes(forma);
            if (groupExec) groupExec.style.display = showExec ? 'block' : 'none';

            if (showExec) {
                const exec = document.getElementById('p-execucao').value;
                siglaParts.push(exec);
            }

            siglaParts.push(inst);
            siglaParts.push(gp);
        } else {
            // MT
            siglaParts.push(tensao.replace(',', '.'));
        }

        // Mapping Cor
        let corSigla = corFull;
        if (corFull === 'RAL 7032') corSigla = '7032';
        else if (corFull === 'RAL 7035') corSigla = '7035';
        else if (corFull === 'Munsell N6.5') corSigla = 'N6.5';

        siglaParts.push(corSigla);

        const sigla = siglaParts.filter(Boolean).join('-');
        document.getElementById('p-tipo').value = sigla;

        // Sync to current state
        this.currentBuilderState.cat_categoria = cat;
        this.currentBuilderState.cat_tensao = tensao;
        this.currentBuilderState.cat_cor = corFull;
        if (tensao === 'BT690') {
            this.currentBuilderState.cat_forma = document.getElementById('p-forma').value;
            this.currentBuilderState.cat_execucao = document.getElementById('p-execucao').value;
            this.currentBuilderState.cat_instalacao = document.getElementById('p-instalacao').value;
            this.currentBuilderState.cat_gp = document.getElementById('p-gp').value;
        }
    }
};

window.paineisModule = PaineisModule;
PaineisModule.init();
