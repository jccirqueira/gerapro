import { store } from './state.js';

/**
 * Cargas Module (Lista de Cargas)
 * Manages the definition of loads/motors and assignment of Typical starters.
 * Uses a Modal-based approach for cleaner UI.
 */

window.app = window.app || {};

const CargasModule = {
    init() {
        window.app.cargas = {
            openNewModal: this.openNewModal.bind(this),
            edit: this.edit.bind(this),
            save: this.save.bind(this),
            saveTemplate: this.saveTemplate.bind(this),
            remove: this.remove.bind(this),
            clear: this.clear.bind(this),
            closeModal: this.closeModal.bind(this)
        };

        store.subscribe(state => {
            const container = document.getElementById('view-cargas');
            if (container && !container.classList.contains('hidden-module')) {
                this.renderList(state.cargas);
            }
        });
    },

    render() {
        // Called by navigation
        const container = document.getElementById('view-cargas');
        if (!container) return;

        // 1. Static Shell (Header + Table Container)
        if (!container.querySelector('.card')) {
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                                <i class="ph ph-lightning"></i> Lista de Cargas (Motores & Feeder)
                            </h3>
                            <div class="text-xs text-muted">Gerencie as cargas do projeto e defina os típicos de partida.</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
${store.canEdit() ? `                             <button class="btn btn-ghost text-danger" onclick="app.cargas.clear()"><i class="ph ph-trash"></i> Limpar Tudo</button>` : ''}
${store.canEdit() ? `                             <button class="btn btn-primary" onclick="app.cargas.openNewModal()">
                                <i class="ph ph-plus"></i> Nova Carga
                             </button>` : ''}
                             <button class="btn btn-secondary" onclick="app.cargas.saveTemplate()" title="Salvar como Modelo">
                                <i class="ph ph-floppy-disk"></i> Salvar Lista
                             </button>
                        </div>
                    </div>

                    <div class="table-container">
                        <table id="cargas-table">
                            <thead>
                                <tr>
                                    <th>TAG</th>
                                    <th>Descrição</th>
                                    <th>Potência / Tensão</th>
                                    <th>Típico Associado</th>
                                    <th style="width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="cargas-list-body">
                                <!-- Rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        this.renderList(store.getState().cargas);
    },

    renderList(cargas) {
        const tbody = document.getElementById('cargas-list-body');
        if (!tbody) return;

        if (!cargas || cargas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">
                        <i class="ph ph-lightning" style="font-size: 32px; opacity: 0.5; margin-bottom: 10px;"></i>
                        <p>Nenhuma carga cadastrada.</p>
                        <button class="btn btn-secondary btn-sm" onclick="app.cargas.openNewModal()" style="margin-top: 10px;">Adicionar Primeira Carga</button>
                    </td>
                </tr>`;
            return;
        }

        const tipicos = store.getState().tipicos || [];

        tbody.innerHTML = cargas.map(c => {
            const tipico = tipicos.find(t => t.id === c.typicalId);
            const tipicoName = tipico ? tipico.nome : '<span style="color: #94a3b8; font-style: italic;">Não definido / Removido</span>';
            const tipicoBadge = tipico ? `<span class="status-badge status-blue" style="font-size: 10px;">${tipico.items?.length || 0} itens</span>` : '';

            return `
                <tr>
                    <td>
                        <div style="font-weight: 700; color: var(--color-primary);">${c.tag}</div>
                    </td>
                    <td>${c.descricao || '-'}</td>
                    <td>
                        <div style="font-size: 13px;">${c.potencia || '-'}</div>
                        <div class="text-xs text-muted">${c.tensao ? c.tensao + 'V' : ''}</div>
                    </td>
                    <td>
                        <div style="font-weight: 500;">${tipicoName}</div>
                        ${tipicoBadge}
                    </td>
                    <td>
                        ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.cargas.edit('${c.id}')"><i class="ph ph-pencil-simple"></i></button>` : ''}
                        ${store.canDelete() ? `<button class="btn btn-ghost text-danger" onclick="app.cargas.remove('${c.id}')"><i class="ph ph-trash"></i></button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    // --- Modal Logic ---

    openNewModal() {
        this.renderModal();
    },

    edit(id) {
        const item = store.getState().cargas.find(c => c.id === id);
        if (item) {
            this.renderModal(item);
        }
    },

    closeModal() {
        const modal = document.getElementById('modal-carga');
        if (modal) modal.remove();
    },

    renderModal(data = {}) {
        const isEdit = !!data.id;
        const tipicos = store.getState().tipicos || [];

        const html = `
            <div id="modal-carga" class="modal-overlay">
                <div class="modal" style="width: 500px;">
                    <div class="modal-header">
                        <h3 class="card-title">${isEdit ? 'Editar Carga' : 'Nova Carga'}</h3>
                        <button class="btn btn-ghost" onclick="app.cargas.closeModal()"><i class="ph ph-x"></i></button>
                    </div>
                    
                    <div class="modal-body">
                        <form id="form-carga">
                            <input type="hidden" name="id" value="${data.id || ''}">
                            
                            <div class="row" style="display: flex; gap: 16px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">TAG *</label>
                                    <input type="text" name="tag" class="form-control" value="${data.tag || ''}" placeholder="Ex: M-101" required autofocus>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Tensão (V)</label>
                                    <select name="tensao" class="form-control">
                                        <option value="">Selecione...</option>
                                        <option value="220" ${data.tensao === '220' ? 'selected' : ''}>220V</option>
                                        <option value="380" ${data.tensao === '380' ? 'selected' : ''}>380V</option>
                                        <option value="440" ${data.tensao === '440' ? 'selected' : ''}>440V</option>
                                        <option value="480" ${data.tensao === '480' ? 'selected' : ''}>480V</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Descrição</label>
                                <input type="text" name="descricao" class="form-control" value="${data.descricao || ''}" placeholder="Ex: Bomba de circulação">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Potência (CV/kW)</label>
                                <input type="text" name="potencia" class="form-control" value="${data.potencia || ''}" placeholder="Ex: 5CV">
                            </div>

                            <div class="form-group" style="background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px;">
                                <label class="form-label" style="color: var(--color-accent);">Típico de Partida (Composição)</label>
                                <select name="typicalId" class="form-control" style="border-color: var(--color-accent);">
                                    <option value="">-- Selecione ou deixe vazio --</option>
                                    ${tipicos.map(t => `<option value="${t.id}" ${data.typicalId === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}
                                </select>
                                <p class="text-xs text-muted" style="margin-top: 5px;">
                                    Selecionar um típico associará automaticamente os materiais definidos (disjuntores, contatores, etc.) a esta carga.
                                </p>
                            </div>

                        </form>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-cancel" onclick="app.cargas.closeModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.cargas.save()"><i class="ph ph-check"></i> Salvar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        // Focus Tag
        if (!isEdit) setTimeout(() => document.querySelector('#form-carga input[name="tag"]').focus(), 100);
    },

    save() {
        const form = document.getElementById('form-carga');
        if (!form) return;

        const formData = new FormData(form);
        const obj = {};
        formData.forEach((value, key) => obj[key] = value);

        if (!obj.tag) {
            window.app.toast("O campo TAG é obrigatório.", "error");
            return;
        }

        // State update
        const state = store.getState();
        let newCargas = [...(state.cargas || [])];

        if (obj.id) {
            // Edit
            newCargas = newCargas.map(c => c.id === obj.id ? { ...c, ...obj } : c);
        } else {
            // New
            delete obj.id;
            newCargas.push({ ...obj, id: crypto.randomUUID(), createdAt: new Date() });
        }

        store.setState({ cargas: newCargas });

        this.closeModal();
        window.app.toast("Carga salva com sucesso!", "success");
    },

    saveTemplate() {
        const cargas = store.getState().cargas;
        if (!cargas || cargas.length === 0) {
            window.app.toast("A lista está vazia. Adicione cargas antes de salvar.", "warning");
            return;
        }

        let name = prompt("Nome da Lista de Carga (Template):", "Lista - " + new Date().toLocaleDateString());
        if (name === null) return; // Cancel
        name = name.trim();
        if (!name) return;

        const loadLists = store.getState().loadLists || [];

        // Check overwrite
        const existsIndex = loadLists.findIndex(l => l.name === name);
        let newList = [...loadLists];

        if (existsIndex >= 0) {
            if (!confirm(`Já existe uma lista com o nome "${name}". Deseja substituir?`)) return;
            newList[existsIndex] = { ...newList[existsIndex], items: [...cargas], updatedAt: new Date() };
        } else {
            newList.push({ id: crypto.randomUUID(), name, items: [...cargas], createdAt: new Date() });
        }

        store.setState({ loadLists: newList });
        window.app.toast("Lista de Carga salva com sucesso!", "success");
    },

    async remove(id) {
        if (await window.app.confirm("Remover esta carga?", "Excluir")) {
            const newCargas = store.getState().cargas.filter(c => c.id !== id);
            store.setState({ cargas: newCargas });
            window.app.toast("Carga removida.", "info");
        }
    },

    async clear() {
        if (await window.app.confirm("Isso apagará TODAS as cargas cadastradas. Deseja continuar?", "LIMPAR TUDO")) {
            store.setState({ cargas: [] });
            window.app.toast("Lista de Cargas limpa.", "info");
        }
    }
};

window.cargasModule = CargasModule;
CargasModule.init();
