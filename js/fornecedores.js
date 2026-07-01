import { store } from './state.js';

/**
 * Fornecedores Module
 */

const FornecedoresModule = {
    init() {
        window.app.fornecedores = {
            openNewModal: this.openNewModal.bind(this),
            edit: this.edit.bind(this),
            delete: this.delete.bind(this),
            save: this.save.bind(this),
            closeModal: this.closeModal.bind(this),
            switchTab: this.switchTab.bind(this),
            filterSuppliers: this.filterSuppliers.bind(this),
            resetView: this.resetView.bind(this),
            deleteTemplate: this.deleteTemplate.bind(this)
        };

        this.viewMode = 'list';

        store.subscribe((state) => {
            this.renderList(state.fornecedores);
        });
    },

    resetView() {
        this.viewMode = 'list';
    },

    render() {
        const container = document.getElementById('view-fornecedores');
        if (!container) return;

        if (this.viewMode === 'form') return;

        // Restore List Layout
        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <!-- Header -->
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-truck"></i> Gerenciamento de Fornecedores
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Gestão de Parceiros, Fabricantes e Prestadores de Serviço</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoCadastros.downloadModelo('fornecedores')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;"><i class="ph ph-download-simple"></i> Modelo</button>
                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoCadastros.exportarCSV('fornecedores')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;"><i class="ph ph-upload"></i> Exportar</button>
                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoCadastros.abrirImportacaoModal('fornecedores')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;"><i class="ph ph-file-arrow-up"></i> Importar</button>
                        ${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.fornecedores.openNewModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-plus"></i> Novo Fornecedor</button>` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div id="for-search-controls" style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <div style="position: relative; flex: 1; max-width: 400px;">
                            <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            <input type="text" class="form-control" placeholder="Buscar por Razão Social ou CNPJ..." style="padding-left: 38px;" oninput="app.fornecedores.filterSuppliers()">
                        </div>
                    </div>
                    
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-container">
                            <table id="fornecedores-table">
                                <thead>
                                    <tr>
                                        <th>Razão Social</th>
                                        <th>CNPJ</th>
                                        <th>Cidade/UF</th>
                                        <th>Contato</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Content injected by renderList -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const state = store.getState();
        this.renderList(state.fornecedores);
    },

    filterSuppliers() {
        const query = document.querySelector('#for-search-controls input').value.toLowerCase();
        const all = store.getState().fornecedores || [];

        const filtered = all.filter(c => {
            // handle legacy strings if any
            if (typeof c === 'string') return c.toLowerCase().includes(query);

            return !query ||
                (c.razaoSocial && c.razaoSocial.toLowerCase().includes(query)) ||
                (c.cnpj && c.cnpj.includes(query));
        });

        this.renderList(filtered);
    },

    renderList(fornecedores) {
        const tbody = document.querySelector('#fornecedores-table tbody');
        if (!tbody) return;

        if (!fornecedores || fornecedores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Nenhum fornecedor cadastrado. Clique em "Novo Fornecedor" para começar.</td></tr>`;
            return;
        }

        tbody.innerHTML = fornecedores.map(c => {
            // Handle legacy string data
            if (typeof c === 'string') {
                return `
                    <tr>
                        <td>
                            <div style="font-weight: 600; color: var(--color-primary);">${c} (Legado)</div>
                        </td>
                         <td>-</td>
                         <td>-</td>
                         <td>-</td>
                        <td>
                            <button class="btn btn-ghost" style="padding: 4px; color: var(--color-danger);" title="Para editar, recrie como novo" disabled><i class="ph ph-warning"></i></button>
                        </td>
                    </tr>
                 `;
            }

            return `
            <tr>
                <td>
                    <div style="font-weight: 600; color: var(--color-primary);">${c.razaoSocial || 'Sem Nome'}</div>
                    <div class="text-xs text-muted">${c.segmento || '-'}</div>
                </td>
                <td>
                    <div>${c.cnpj || '-'}</div>
                    <div class="text-xs text-muted">IE: ${c.inscricaoEstadual || '-'}</div>
                </td>
                <td>
                    <div>${c.cidade || '-'}/${c.estado || '-'}</div>
                    <div class="text-xs text-muted">${c.cep || '-'}</div>
                </td>
                <td>
                    <div style="font-size: 13px;">${c.contatoNome || '-'}</div>
                    <div class="text-xs text-muted">${c.email || '-'}</div>
                </td>
                <td>
                    ${store.canEdit() ? `<button class="btn btn-ghost" style="padding: 4px;" onclick="app.fornecedores.edit('${c.id}')"><i class="ph ph-pencil-simple"></i></button>` : ''}
                    ${store.canDelete() ? `<button class="btn btn-ghost" style="padding: 4px; color: var(--color-danger);" onclick="app.fornecedores.delete('${c.id}')"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `}).join('');
    },

    // --- Form Logic ---

    openNewModal() {
        this.viewMode = 'form';
        this.render();
        this.renderModal(); // Open empty
    },

    edit(id) {
        const fornecedor = store.getState().fornecedores.find(c => c.id === id);
        if (fornecedor) {
            this.viewMode = 'form';
            this.render();
            this.renderModal(fornecedor);
        }
    },

    closeModal() {
        this.viewMode = 'list';
        const modal = document.getElementById('modal-fornecedor');
        if (modal) modal.remove();
        this.render();
    },

    switchTab(tabName) {
        // Simple tab switcher
        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        document.getElementById(`tab-for-${tabName}`).style.display = 'block';

        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(`btn-tab-for-${tabName}`).classList.add('active');
    },

    renderModal(data = {}) {
        const isEdit = !!data.id;

        const html = `
            <div id="form-fornecedor-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.fornecedores.closeModal()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">${isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-cancel" onclick="app.fornecedores.closeModal()">Cancelar</button>
                            ${!isEdit ? `<button class="btn btn-primary" onclick="app.fornecedores.save(true)"><i class="ph ph-plus"></i> Salvar e Novo</button>` : ''}
                            <button class="btn btn-primary" onclick="app.fornecedores.save()" style=""><i class="ph ph-check"></i> Salvar Fornecedor</button>
                        </div>
                    </div>
                    
                    <div style="padding: 0 var(--spacing-md); border-bottom: 1px solid var(--color-border); background: #f8fafc;">
                        <button id="btn-tab-for-geral" class="tab-btn active" onclick="app.fornecedores.switchTab('geral')">Dados Gerais</button>
                        <button id="btn-tab-for-endereco" class="tab-btn" onclick="app.fornecedores.switchTab('endereco')">Endereço & Fiscal</button>
                        <button id="btn-tab-for-contato" class="tab-btn" onclick="app.fornecedores.switchTab('contato')">Contatos</button>
                        ${isEdit ? `<button id="btn-tab-for-importacao" class="tab-btn" onclick="app.fornecedores.switchTab('importacao')"><i class="ph ph-file-arrow-up"></i> Importação</button>` : ''}
                    </div>

                    <div style="padding: 20px; flex: 1; overflow-y: auto;">
                        <form id="form-fornecedor">
                            <input type="hidden" name="id" value="${data.id || ''}">
                            
                            <!-- TAB: GERAL -->
                            <div id="tab-for-geral" class="tab-content">
                                <div class="form-group">
                                    <label class="form-label">Razão Social *</label>
                                    <input type="text" name="razaoSocial" class="form-control" value="${data.razaoSocial || ''}" required>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Nome Fantasia</label>
                                        <input type="text" name="nomeFantasia" class="form-control" value="${data.nomeFantasia || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">CNPJ *</label>
                                        <input type="text" name="cnpj" class="form-control" value="${data.cnpj || ''}" placeholder="00.000.000/0000-00">
                                    </div>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Segmento / Tipo</label>
                                         <input type="text" name="segmento" class="form-control" value="${data.segmento || ''}" placeholder="Ex: Elétrica, Mecânica...">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">CNAE</label>
                                        <input type="text" name="cnae" class="form-control" value="${data.cnae || ''}">
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: ENDEREÇO -->
                            <div id="tab-for-endereco" class="tab-content" style="display: none;">
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Inscrição Estadual</label>
                                        <input type="text" name="inscricaoEstadual" class="form-control" value="${data.inscricaoEstadual || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Inscrição Municipal</label>
                                        <input type="text" name="inscricaoMunicipal" class="form-control" value="${data.inscricaoMunicipal || ''}">
                                    </div>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="width: 120px;">
                                        <label class="form-label">CEP</label>
                                        <input type="text" name="cep" class="form-control" value="${data.cep || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Logradouro</label>
                                        <input type="text" name="logradouro" class="form-control" value="${data.logradouro || ''}">
                                    </div>
                                    <div class="form-group" style="width: 80px;">
                                        <label class="form-label">Número</label>
                                        <input type="text" name="numero" class="form-control" value="${data.numero || ''}">
                                    </div>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Bairro</label>
                                        <input type="text" name="bairro" class="form-control" value="${data.bairro || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Cidade</label>
                                        <input type="text" name="cidade" class="form-control" value="${data.cidade || ''}">
                                    </div>
                                    <div class="form-group" style="width: 60px;">
                                        <label class="form-label">UF</label>
                                        <input type="text" name="estado" class="form-control" value="${data.estado || ''}" maxlength="2" style="text-transform: uppercase;">
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: CONTATO -->
                            <div id="tab-for-contato" class="tab-content" style="display: none;">
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Nome do Contato</label>
                                        <input type="text" name="contatoNome" class="form-control" value="${data.contatoNome || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Cargo</label>
                                        <input type="text" name="contatoCargo" class="form-control" value="${data.contatoCargo || ''}">
                                    </div>
                                </div>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">E-mail</label>
                                        <input type="email" name="email" class="form-control" value="${data.email || ''}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Telefone / Celular</label>
                                        <input type="text" name="telefone" class="form-control" value="${data.telefone || ''}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Observações</label>
                                    <textarea name="observacoes" class="form-control" rows="3">${data.observacoes || ''}</textarea>
                                </div>
                            </div>

                            ${isEdit ? `
                            <!-- TAB: IMPORTAÇÃO -->
                            <div id="tab-for-importacao" class="tab-content" style="display: none;">
                                <div id="importacao-tab-content">
                                    <p class="text-sm text-muted" style="margin-bottom: 16px;">Configurações de importação de preços para este fornecedor.</p>
                                    <div id="importacao-tab-template-info"></div>
                                </div>
                                <div style="margin-top: 16px;">
                                    <button class="btn btn-secondary btn-sm" onclick="app.fornecedores.deleteTemplate('${data.id}')" id="btn-for-del-template" style="display:none;color:#ef4444;border-color:#fecaca;"><i class="ph ph-trash"></i> Remover Template</button>
                                </div>
                            </div>
                            ` : ''}
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Append to container
        const container = document.getElementById('view-fornecedores');
        if (container) {
            container.innerHTML = html;
        }

        // Render template info if editing
        if (isEdit && data.id) {
            this.renderImportTemplateInfo(data.id);
        }
    },

    renderImportTemplateInfo(id) {
        const container = document.getElementById('importacao-tab-template-info');
        if (!container) return;

        const template = store.getPriceImportTemplate(id);
        if (!template) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 8px;">
                    <i class="ph ph-file" style="font-size: 32px; opacity: 0.3; margin-bottom: 8px;"></i>
                    <br>Nenhum template de importação salvo.
                    <br><span class="text-xs text-muted">Acesse "Catálogo de Materiais → Importar" e selecione este fornecedor para criar um template.</span>
                </div>
            `;
            document.getElementById('btn-for-del-template').style.display = 'none';
            return;
        }

        const cols = template.columns || {};
        const colLabels = [];
        if (cols.code) colLabels.push(`Código: <strong>${cols.code}</strong>`);
        if (cols.price) colLabels.push(`Preço: <strong>${cols.price}</strong>`);
        if (cols.fabricante) colLabels.push(`Fabricante: <strong>${cols.fabricante}</strong>`);
        if (cols.markup) colLabels.push(`Markup: <strong>${cols.markup}</strong>`);
        if (cols.discount) colLabels.push(`Desconto: <strong>${cols.discount}</strong>`);

        document.getElementById('btn-for-del-template').style.display = 'inline-flex';

        container.innerHTML = `
            <div style="background:#f0fdf4;border-radius:8px;padding:16px;border:1px solid #bbf7d0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-weight:600;color:#166534;">${template.name || 'Template'}</span>
                    <span class="text-xs text-muted">${template.updatedAt ? 'Última atualização: ' + new Date(template.updatedAt).toLocaleDateString('pt-BR') : ''}</span>
                </div>
                <div class="text-xs" style="color:#475569;line-height:1.6;">
                    ${colLabels.join(' · ')}
                </div>
            </div>
        `;
    },

    deleteTemplate(id) {
        app.confirm("Remover template de importação deste fornecedor?", "Remover Template")
            .then(confirmed => {
                if (confirmed) {
                    store.deletePriceImportTemplate(id);
                    this.renderImportTemplateInfo(id);
                    app.toast("Template removido.", "info");
                }
            });
    },

    async save() {
        const form = document.getElementById('form-fornecedor');
        if (!form) return;

        const formData = new FormData(form);
        const obj = {};
        formData.forEach((value, key) => obj[key] = value);

        if (!obj.razaoSocial) {
            app.toast("A Razão Social é obrigatória.", "error");
            return;
        }

        let ok;
        if (obj.id) {
            ok = await store.updateFornecedor(obj.id, obj);
        } else {
            delete obj.id;
            ok = await store.addFornecedor(obj);
        }

        if (!ok) {
            app.toast("Erro ao salvar. Verifique se o servidor está rodando.", "error");
            return;
        }

        this.closeModal();
        app.toast("Fornecedor salvo com sucesso!", "success");
    },

    async delete(id) {
        if (await window.app.confirm("Tem certeza que deseja remover este fornecedor?")) {
            const ok = await store.deleteFornecedor(id);
            if (!ok) {
                window.app.toast("Erro ao remover. Verifique se o servidor está rodando.", "error");
                return;
            }
            window.app.toast("Fornecedor removido.", "info");
        }
    }
};

window.fornecedoresModule = FornecedoresModule;
FornecedoresModule.init();
