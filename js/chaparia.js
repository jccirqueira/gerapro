import { store } from './state.js';

const ChapariaModule = {
    init() {
        window.app.chaparia = {
            create: this.create.bind(this),
            edit: this.edit.bind(this),
            delete: this.delete.bind(this),
            save: this.save.bind(this),
            closeModal: this.closeModal.bind(this),
            addItem: this.addItem.bind(this),
            removeItem: this.removeItem.bind(this),
            openMaterialSelector: this.openMaterialSelector.bind(this),
            closeMaterialSelector: this.closeMaterialSelector.bind(this),
            filterSelectorItems: this.filterSelectorItems.bind(this),
            selectMaterial: this.selectMaterial.bind(this),
            updateItemQtd: this.updateItemQtd.bind(this),
            resetView: this.resetView.bind(this),
            _findByFabricanteDimensoes: this._findByFabricanteDimensoes.bind(this)
        };

        this.viewMode = 'list';

        store.subscribe((state) => {
            const container = document.getElementById('view-chaparia');
            if (container && !container.classList.contains('hidden-module')) {
                if (this.viewMode === 'list') {
                    this.renderList(state.chapariaLists);
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
        if (this.viewMode === 'form') return;
        const container = document.getElementById('view-chaparia');
        if (!container) return;

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-package"></i> Catálogo de Chaparia
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Típicos de invólucros, acessórios e estrutura por fabricante e dimensões</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.chaparia.create()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-plus"></i> Novo Típico de Chaparia</button>` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-container">
                            <table id="chaparia-table">
                                <thead>
                                    <tr>
                                        <th>Nome / Descrição</th>
                                        <th>Fabricante</th>
                                        <th>Dimensões (L×A×P)</th>
                                        <th>Custo Est.</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const items = store.getState().chapariaLists;
        this.renderList(items);
    },

    renderList(items) {
        const tbody = document.querySelector('#chaparia-table tbody');
        if (!tbody) return;

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Nenhum típico de chaparia cadastrado.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(p => {
            const total = (p.items || []).reduce((s, i) => s + (i.custo || 0) * (i.qtd || 1), 0);
            return `
            <tr>
                <td>
                    <div style="font-weight: bold;">${p.name || 'Sem nome'}</div>
                    <div class="text-xs text-muted">${p.descricao || ''}</div>
                </td>
                <td>${p.fabricante || '-'}</td>
                <td>${p.largura_mm || '-'} x ${p.altura_mm || '-'} x ${p.profundidade_mm || '-'} mm</td>
                <td>${app.formatCurrency(total)}</td>
                <td>
                     ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.chaparia.edit('${p.id}')"><i class="ph ph-pencil-simple"></i></button>` : ''}
                     ${store.canDelete() ? `<button class="btn btn-ghost text-danger" onclick="app.chaparia.delete('${p.id}')"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>`;
        }).join('');
    },

    create() {
        this.currentBuilderState = {
            id: null,
            name: '',
            descricao: '',
            fabricante: '',
            largura_mm: '',
            altura_mm: '',
            profundidade_mm: '',
            items: []
        };
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    edit(id) {
        const item = store.getState().chapariaLists.find(x => x.id === id);
        if (!item) return;
        this.currentBuilderState = JSON.parse(JSON.stringify(item));
        if (!this.currentBuilderState.items) this.currentBuilderState.items = [];
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    renderBuilder() {
        const state = this.currentBuilderState;
        const isEdit = !!state.id;
        const totalCost = state.items.reduce((acc, item) => acc + (item.custo || 0) * (item.qtd || 1), 0);

        const html = `
            <div id="form-chaparia-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.chaparia.closeModal()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">${isEdit ? 'Editar Típico de Chaparia' : 'Novo Típico de Chaparia'}</h3>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <div class="text-sm text-muted">Custo Estimado: <b style="color: var(--color-primary); font-size: 1.1em;">${app.formatCurrency(totalCost)}</b></div>
                            <button class="btn btn-cancel" onclick="app.chaparia.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.chaparia.save()"><i class="ph ph-check"></i> Salvar</button>
                        </div>
                    </div>

                    <div style="flex: 1; padding: 0; display: flex; overflow: hidden;">
                        <div style="width: 350px; padding: 20px; border-right: 1px solid var(--color-border); background: #f8fafc; overflow-y: auto;">
                            <h4 class="text-sm font-bold" style="margin-bottom: 16px; color: #64748b; text-transform: uppercase;">Propriedades</h4>
                            <form id="form-chaparia-props">
                                <div class="form-group">
                                    <label class="form-label">Nome *</label>
                                    <input type="text" id="c-nome" class="form-control" value="${state.name || ''}" placeholder="Ex: KX600x2300x600">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Fabricante</label>
                                    <select id="c-fabricante" class="form-control">
                                        <option value="">Genérico</option>
                                        <option value="KitFrame" ${state.fabricante === 'KitFrame' ? 'selected' : ''}>KitFrame</option>
                                        <option value="Eletropoll" ${state.fabricante === 'Eletropoll' ? 'selected' : ''}>Eletropoll</option>
                                        <option value="Siemens" ${state.fabricante === 'Siemens' ? 'selected' : ''}>Siemens</option>
                                        <option value="ABB" ${state.fabricante === 'ABB' ? 'selected' : ''}>ABB</option>
                                        <option value="Schneider" ${state.fabricante === 'Schneider' ? 'selected' : ''}>Schneider</option>
                                        <option value="WEG" ${state.fabricante === 'WEG' ? 'selected' : ''}>WEG</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Descrição</label>
                                    <input type="text" id="c-descricao" class="form-control" value="${state.descricao || ''}" placeholder="Ex: Invólucro CCM 600x2300x600">
                                </div>
                                <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
                                    <h4 class="text-sm font-bold" style="margin-bottom: 12px; color: #64748b; text-transform: uppercase;">Dimensões Correspondentes</h4>
                                    <div class="row" style="display: flex; gap: 10px;">
                                        <div class="form-group" style="flex: 1;">
                                            <label class="form-label">Largura (mm)</label>
                                            <input type="number" id="c-largura" class="form-control" value="${state.largura_mm || ''}">
                                        </div>
                                        <div class="form-group" style="flex: 1;">
                                            <label class="form-label">Altura (mm)</label>
                                            <input type="number" id="c-altura" class="form-control" value="${state.altura_mm || ''}">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Profundidade (mm)</label>
                                        <input type="number" id="c-profundidade" class="form-control" value="${state.profundidade_mm || ''}">
                                    </div>
                                    <div style="font-size: 11px; color: #64748b; margin-top: 8px; background: #f1f5f9; border-radius: 6px; padding: 10px;">
                                        <i class="ph ph-info"></i> A associação automática com armários do layout é feita pelo 
                                        <b>Fabricante</b> + <b>Largura</b> + <b>Altura</b> + <b>Profundidade</b>. 
                                        Deixe em branco para genérico.
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; overflow: hidden; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-shrink: 0;">
                                <h4 class="text-sm font-bold" style="color: #64748b; text-transform: uppercase;">Lista de Materiais (Estrutura)</h4>
                                <button class="btn btn-sm btn-primary" onclick="app.chaparia.openMaterialSelector()"><i class="ph ph-plus"></i> Adicionar Material</button>
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
                                    <tbody id="chaparia-items-body">
                                        ${this.renderBuilderItems(state.items)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const container = document.getElementById('view-chaparia');
        if (container) container.innerHTML = html;
    },

    renderBuilderItems(items) {
        if (!items || items.length === 0) {
            return '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">Nenhum material adicionado.<br>Clique em "Adicionar Material" para compor a estrutura deste típico.</td></tr>';
        }
        return items.map((item, index) => `
            <tr>
                <td style="text-align: center;">
                    <input type="number" class="form-control" value="${item.qtd}" min="1" style="width: 50px; text-align: center; padding: 2px;" onchange="app.chaparia.updateItemQtd(${index}, this.value)">
                </td>
                <td>
                    <div style="font-weight: 500;">${item.descricao}</div>
                    <div style="font-size: 11px; color: #64748b;">${item.codigoFabricante || ''}</div>
                </td>
                <td>${item.fabricante || '-'}</td>
                <td style="text-align: right;">${app.formatCurrency(item.custo || 0)}</td>
                <td style="text-align: right; font-weight: 600;">${app.formatCurrency((item.custo || 0) * (item.qtd || 1))}</td>
                <td style="text-align: center;">
                    ${store.canDelete() ? `<button class="btn-icon text-danger" onclick="app.chaparia.removeItem(${index})"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    updateItemQtd(index, newQtd) {
        if (newQtd < 1) newQtd = 1;
        this.currentBuilderState.items[index].qtd = parseFloat(newQtd);
        this.renderBuilder();
    },

    removeItem(index) {
        this.currentBuilderState.items.splice(index, 1);
        this.renderBuilder();
    },

    openMaterialSelector() {
        const html = `
            <div id="modal-chaparia-material-selector" class="modal-overlay" style="z-index: 10100;">
                <div class="modal" style="width: 800px; height: 80vh;">
                    <div class="modal-header">
                        <h3 class="card-title">Selecionar Material</h3>
                        <button class="btn btn-ghost" onclick="app.chaparia.closeMaterialSelector()"><i class="ph ph-x"></i></button>
                    </div>
                    <div style="padding: 10px; border-bottom: 1px solid var(--color-border);">
                        <input type="text" id="chaparia-mat-selector-search" class="form-control" placeholder="Buscar por descrição, código ou fabricante..." onkeyup="app.chaparia.filterSelectorItems()">
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
                            <tbody id="chaparia-mat-selector-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        this.filterSelectorItems();
        setTimeout(() => document.getElementById('chaparia-mat-selector-search')?.focus(), 100);
    },

    closeMaterialSelector() {
        const m = document.getElementById('modal-chaparia-material-selector');
        if (m) m.remove();
    },

    filterSelectorItems() {
        const term = document.getElementById('chaparia-mat-selector-search')?.value.toLowerCase() || '';
        const tbody = document.getElementById('chaparia-mat-selector-body');
        if (!tbody) return;
        const allMaterials = store.getState().materiais || [];
        const filtered = allMaterials.filter(m =>
            (m.descricao?.toLowerCase().includes(term) ||
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
                    <button class="btn btn-sm btn-primary" onclick="app.chaparia.selectMaterial('${m.id}')">Selecionar</button>
                </td>
            </tr>
        `).join('');
    },

    selectMaterial(id) {
        const material = store.getState().materiais.find(m => m.id === id);
        if (material) {
            this.addItem(material);
            this.closeMaterialSelector();
            window.app.toast('Material adicionado.', 'success');
        }
    },

    addItem(material) {
        this.currentBuilderState.items.push({
            materialId: material.id,
            descricao: material.descricao,
            fabricante: material.fabricante,
            codigoFabricante: material.codigoFabricante,
            custo: parseFloat(material.custo || 0),
            qtd: 1
        });
        this.renderBuilder();
    },

    async save() {
        const nome = document.getElementById('c-nome')?.value;
        if (!nome) {
            window.app.toast('O campo "Nome" é obrigatório.', 'error');
            return;
        }

        const newState = {
            ...this.currentBuilderState,
            name: nome,
            fabricante: document.getElementById('c-fabricante')?.value || '',
            descricao: document.getElementById('c-descricao')?.value || '',
            largura_mm: parseFloat(document.getElementById('c-largura')?.value) || 0,
            altura_mm: parseFloat(document.getElementById('c-altura')?.value) || 0,
            profundidade_mm: parseFloat(document.getElementById('c-profundidade')?.value) || 0
        };

        newState.custoTotal = newState.items.reduce((acc, item) => acc + (item.custo || 0) * (item.qtd || 1), 0);

        const db = await import('./db.js');
        if (newState.id) {
            db.create('chapariaLists', newState);
            const list = store.getState().chapariaLists.map(p => p.id === newState.id ? { ...p, ...newState } : p);
            store.setState({ chapariaLists: list });
        } else {
            newState.id = crypto.randomUUID();
            db.create('chapariaLists', newState);
            const list = [...(store.getState().chapariaLists || []), newState];
            store.setState({ chapariaLists: list });
        }
        window.app.toast('Típico de chaparia salvo com sucesso!', 'success');
        this.closeModal();
    },

    async delete(id) {
        if (await window.app.confirm('Remover este típico de chaparia?')) {
            const db = await import('./db.js');
            db.remove('chapariaLists', id);
            const list = store.getState().chapariaLists.filter(p => p.id !== id);
            store.setState({ chapariaLists: list });
            window.app.toast('Típico de chaparia removido.', 'info');
        }
    },

    closeModal() {
        this.viewMode = 'list';
        this.render();
    },

    // ---- Lookup helper for propostaTecnica ----

    _findByFabricanteDimensoes(fabricante, largura_mm, altura_mm, profundidade_mm) {
        const lists = store.getState().chapariaLists || [];
        const match = lists.find(c =>
            (!c.fabricante || c.fabricante === fabricante) &&
            c.largura_mm === largura_mm &&
            c.altura_mm === altura_mm &&
            c.profundidade_mm === profundidade_mm
        );
        if (match) return match;
        const fallback = lists.find(c =>
            (!c.fabricante || c.fabricante === fabricante) &&
            c.largura_mm === largura_mm &&
            c.altura_mm === altura_mm &&
            (c.profundidade_mm === 0 || c.profundidade_mm === profundidade_mm)
        );
        if (fallback) return fallback;
        return lists.find(c =>
            c.fabricante === fabricante &&
            c.largura_mm === largura_mm &&
            c.altura_mm === altura_mm
        );
    }
};

window.chapariaModule = ChapariaModule;
ChapariaModule.init();
