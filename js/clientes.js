import { store } from './state.js';

/**
 * Clientes Module
 */

const ClientesModule = {
    init() {
        window.app.clientes = {
            openNewModal: this.openNewModal.bind(this),
            edit: this.edit.bind(this),
            delete: this.delete.bind(this),
            save: this.save.bind(this),
            closeModal: this.closeModal.bind(this),
            switchTab: this.switchTab.bind(this),
            filterClients: this.filterClients.bind(this),
            addContactRow: this.addContactRow.bind(this),
            handleLogoUpload: this.handleLogoUpload.bind(this),
            removeClientLogo: this.removeClientLogo.bind(this),
            resetView: this.resetView.bind(this)
        };

        this.viewMode = 'list';

        store.subscribe((state) => {
            this.renderList(state.clientes);
        });
    },
    resetView() {
        this.viewMode = 'list';
    },

    render() {
        const container = document.getElementById('view-clientes');
        if (!container) return;

        if (this.viewMode === 'form') return;

        // Restore List Layout
        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <!-- Header -->
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-users"></i> Gerenciamento de Clientes
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Cadastro Central de Empresas, Contatos e Localizações</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoCadastros.downloadModelo('clientes')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;"><i class="ph ph-download-simple"></i> Modelo</button>
                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoCadastros.exportarCSV('clientes')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;"><i class="ph ph-upload"></i> Exportar</button>
                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoCadastros.abrirImportacaoModal('clientes')" style="color: white; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;"><i class="ph ph-file-arrow-up"></i> Importar</button>
                        ${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.clientes.openNewModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-plus"></i> Novo Cliente</button>` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div id="cli-search-controls" style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <div style="position: relative; flex: 1; max-width: 400px;">
                            <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            <input type="text" class="form-control" placeholder="Buscar por Razão Social ou CNPJ..." style="padding-left: 38px;" oninput="app.clientes.filterClients()">
                        </div>
                    </div>
                    
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-container">
                            <table id="clientes-table">
                                <thead>
                                    <tr>
                                        <th>Razão Social</th>
                                        <th>CNPJ / IE</th>
                                        <th>Localização</th>
                                        <th>Contato Principal</th>
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
        this.renderList(state.clientes);
    },

    filterClients() {
        const query = document.querySelector('#cli-search-controls input').value.toLowerCase();
        const all = store.getState().clientes;

        const filtered = all.filter(c => {
            return !query ||
                (c.razaoSocial && c.razaoSocial.toLowerCase().includes(query)) ||
                (c.cnpj && c.cnpj.includes(query));
        });

        this.renderList(filtered);
    },

    renderList(clientes) {
        const tbody = document.querySelector('#clientes-table tbody');
        if (!tbody) return;

        if (!clientes || clientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.</td></tr>`;
            return;
        }

        tbody.innerHTML = clientes.map(c => `
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
                    ${store.canEdit() ? `<button class="btn btn-ghost" style="padding: 4px;" onclick="app.clientes.edit('${c.id}')"><i class="ph ph-pencil-simple"></i></button>` : ''}
                    ${store.canDelete() ? `<button class="btn btn-ghost" style="padding: 4px; color: var(--color-danger);" onclick="app.clientes.delete('${c.id}')"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    // --- Form Logic ---

    openNewModal() {
        this.viewMode = 'form';
        this.render(); // update shell if needed
        this.renderModal(); // render inline
    },

    edit(id) {
        const cliente = store.getState().clientes.find(c => c.id === id);
        if (cliente) {
            this.viewMode = 'form';
            this.render();
            this.renderModal(cliente);
        }
    },

    closeModal() {
        this.viewMode = 'list';
        this.render();
        const modal = document.getElementById('modal-cliente');
        if (modal) modal.remove();
    },

    switchTab(tabName) {
        // Simple tab switcher
        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        document.getElementById(`tab-${tabName}`).style.display = 'block';

        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(`btn-tab-${tabName}`).classList.add('active');
    },

    renderModal(client = null) {
        const isEdit = !!client;
        const data = client || {};

        const html = `
            <div id="form-cliente-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.clientes.closeModal()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">${isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-cancel" onclick="app.clientes.closeModal()">Cancelar</button>
                            ${!isEdit ? `<button class="btn btn-primary" onclick="app.clientes.save(true)"><i class="ph ph-plus"></i> Salvar e Novo</button>` : ''}
                            <button class="btn btn-primary" onclick="app.clientes.save()" style=""><i class="ph ph-check"></i> Salvar Cliente</button>
                        </div>
                    </div>
                    
                    <div style="padding: 0 var(--spacing-md); border-bottom: 1px solid var(--color-border); background: #f8fafc;">
                        <button id="btn-tab-geral" class="tab-btn active" onclick="app.clientes.switchTab('geral')">Dados Gerais</button>
                        <button id="btn-tab-endereco" class="tab-btn" onclick="app.clientes.switchTab('endereco')">Endereço & Fiscal</button>
                        <button id="btn-tab-contato" class="tab-btn" onclick="app.clientes.switchTab('contato')">Contatos</button>
                        <button id="btn-tab-logo" class="tab-btn" onclick="app.clientes.switchTab('logo')">Logo</button>
                    </div>

                    <div style="padding: 20px; flex: 1; overflow-y: auto;">
                        <form id="form-cliente">
                            <input type="hidden" name="id" value="${data.id || ''}">
                            
                            <!-- TAB: GERAL -->
                            <div id="tab-geral" class="tab-content">
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
                                        <label class="form-label">Segmento</label>
                                        <select name="segmento" class="form-control">
                                            <option value="">Selecione...</option>
                                            <option value="Biocombustíveis" ${data.segmento === 'Biocombustíveis' ? 'selected' : ''}>Biocombustíveis</option>
                                            <option value="Bioenergia" ${data.segmento === 'Bioenergia' ? 'selected' : ''}>Bioenergia</option>
                                            <option value="Siderurgia" ${data.segmento === 'Siderurgia' ? 'selected' : ''}>Siderurgia</option>
                                            <option value="Sucroenergético" ${data.segmento === 'Sucroenergético' ? 'selected' : ''}>Sucroenergético</option>
                                            <option value="Mineração" ${data.segmento === 'Mineração' ? 'selected' : ''}>Mineração</option>
                                            <option value="Alimentos e Bebidas" ${data.segmento === 'Alimentos e Bebidas' ? 'selected' : ''}>Alimentos e Bebidas</option>
                                            <option value="Cimento" ${data.segmento === 'Cimento' ? 'selected' : ''}>Cimento</option>
                                            <option value="Fundição" ${data.segmento === 'Fundição' ? 'selected' : ''}>Fundição</option>
                                            <option value="Energia" ${data.segmento === 'Energia' ? 'selected' : ''}>Energia</option>
                                            <option value="Papel e Celulose" ${data.segmento === 'Papel e Celulose' ? 'selected' : ''}>Papel e Celulose</option>
                                            <option value="Saneamento" ${data.segmento === 'Saneamento' ? 'selected' : ''}>Saneamento</option>
                                            <option value="Gases" ${data.segmento === 'Gases' ? 'selected' : ''}>Gases</option>
                                            <option value="Fabricante de Equipamentos" ${data.segmento === 'Fabricante de Equipamentos' ? 'selected' : ''}>Fabricante de Equipamentos</option>
                                            <option value="Aviação" ${data.segmento === 'Aviação' ? 'selected' : ''}>Aviação</option>
                                            <option value="Assessoria E Consultoria" ${data.segmento === 'Assessoria E Consultoria' ? 'selected' : ''}>Assessoria E Consultoria</option>
                                            <option value="Engenharia" ${data.segmento === 'Engenharia' ? 'selected' : ''}>Engenharia</option>
                                            <option value="Indústria Geral" ${data.segmento === 'Indústria Geral' ? 'selected' : ''}>Indústria Geral</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">CNAE</label>
                                        <input type="text" name="cnae" class="form-control" value="${data.cnae || ''}">
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: ENDEREÇO -->
                            <div id="tab-endereco" class="tab-content" style="display: none;">
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

                            <!-- TAB: LOGO -->
                            <div id="tab-logo" class="tab-content" style="display: none;">
                                <div class="form-group">
                                    <label class="form-label">Logo do Cliente (PNG/JPEG)</label>
                                    <div style="display: flex; flex-direction: column; gap: 10px;">
                                        <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center; padding: 8px 16px; border: 1px solid var(--color-border); border-radius: 6px; background: #f8fafc;">
                                            <i class="ph ph-upload-simple"></i> Escolher Imagem
                                            <input type="file" accept="image/png,image/jpeg" style="display: none;" onchange="app.clientes.handleLogoUpload(this)">
                                        </label>
                                        <div id="cli-logo-preview-container" style="display: ${data.logo ? 'block' : 'none'}; text-align: center;">
                                            <img id="cli-logo-preview" src="${data.logo || ''}" style="max-height: 120px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px; background: #fff;">
                                            <input type="hidden" name="logo" value="${data.logo || ''}">
                                            <div style="margin-top: 8px;">
                                                <button type="button" class="btn btn-sm btn-danger" onclick="app.clientes.removeClientLogo()">
                                                    <i class="ph ph-trash"></i> Remover Logo
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: CONTATO -->
                            <div id="tab-contato" class="tab-content" style="display: none;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <label class="form-label" style="margin-bottom: 0;">Lista de Contatos</label>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.clientes.addContactRow()">+ Adicionar Contato</button>
                                </div>
                                <div id="contacts-container" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                                    ${(Array.isArray(data.contatos) && data.contatos.length > 0 ? data.contatos : [
                                        { nome: data.contatoNome || '', cargo: data.contatoCargo || '', email: data.email || '', telefone: data.telefone || '' }
                                    ]).map((c, index) => `
                                        <div class="contact-row" style="background: #fff; border: 1px solid var(--color-border); padding: 10px; border-radius: 6px; position: relative;">
                                            <button type="button" onclick="this.closest('.contact-row').remove()" class="btn-icon" style="position: absolute; top: 10px; right: 10px; color: red;" title="Remover Contato"><i class="ph ph-trash"></i></button>
                                            <div class="row" style="display: flex; gap: 16px; margin-bottom: 10px; padding-right: 30px;">
                                                <div class="form-group" style="flex: 1;">
                                                    <label class="form-label" style="font-size: 11px;">Nome do Contato</label>
                                                    <input type="text" name="contatoNome_${index}" class="form-control contact-name-input" value="${c.nome}" placeholder="Ex: João Silva">
                                                </div>
                                                <div class="form-group" style="flex: 1;">
                                                    <label class="form-label" style="font-size: 11px;">Cargo</label>
                                                    <input type="text" name="contatoCargo_${index}" class="form-control contact-role-input" value="${c.cargo}" placeholder="Ex: Gerente de Manutenção">
                                                </div>
                                            </div>
                                            <div class="row" style="display: flex; gap: 16px;">
                                                <div class="form-group" style="flex: 1;">
                                                    <label class="form-label" style="font-size: 11px;">E-mail</label>
                                                    <input type="email" name="contatoEmail_${index}" class="form-control contact-email-input" value="${c.email}" placeholder="joao@empresa.com.br">
                                                </div>
                                                <div class="form-group" style="flex: 1;">
                                                    <label class="form-label" style="font-size: 11px;">Telefone / Celular</label>
                                                    <input type="text" name="contatoTelefone_${index}" class="form-control contact-phone-input" value="${c.telefone}" placeholder="(00) 00000-0000">
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Observações Técnicas / Comerciais</label>
                                    <textarea name="observacoes" class="form-control" rows="3">${data.observacoes || ''}</textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Append to container
        const container = document.getElementById('view-clientes');
        if (container) {
            container.innerHTML = html;
        }
    },

    async save(keepOpen = false) {
        const form = document.getElementById('form-cliente');
        if (!form) return;

        // Simple form to object
        const formData = new FormData(form);
        const obj = {};
        
        // Extract flat fields, ignore contact specific inputs for now
        formData.forEach((value, key) => {
            if (!key.startsWith('contatoNome_') && !key.startsWith('contatoCargo_') && !key.startsWith('contatoEmail_') && !key.startsWith('contatoTelefone_')) {
                obj[key] = value;
            }
        });

        // Parse Contacts array
        obj.contatos = [];
        const contactRows = document.querySelectorAll('.contact-row');
        contactRows.forEach(row => {
            const nomeInput = row.querySelector('.contact-name-input');
            const cargoInput = row.querySelector('.contact-role-input');
            const emailInput = row.querySelector('.contact-email-input');
            const phoneInput = row.querySelector('.contact-phone-input');
            
            if (nomeInput && (nomeInput.value.trim() || emailInput.value.trim() || phoneInput.value.trim())) {
                obj.contatos.push({
                    nome: nomeInput.value.trim(),
                    cargo: cargoInput.value.trim(),
                    email: emailInput.value.trim(),
                    telefone: phoneInput.value.trim()
                });
            }
        });
        
        // Fallback for list display (keep legacy support for old renderList views)
        if (obj.contatos.length > 0) {
            obj.contatoNome = obj.contatos[0].nome;
            obj.contatoCargo = obj.contatos[0].cargo;
            obj.email = obj.contatos[0].email;
            obj.telefone = obj.contatos[0].telefone;
        } else {
            obj.contatoNome = '';
            obj.contatoCargo = '';
            obj.email = '';
            obj.telefone = '';
        }

        if (!obj.razaoSocial) {
            app.toast("A Razão Social é obrigatória.", "error");
            return;
        }

        let ok;
        if (obj.id) {
            ok = await store.updateClient(obj.id, obj);
        } else {
            delete obj.id;
            ok = await store.addClient(obj);
        }

        if (!ok) {
            app.toast("Erro ao salvar. Verifique se o servidor está rodando.", "error");
            return;
        }

        app.toast("Cliente salvo com sucesso!", "success");

        if (keepOpen) {
            form.reset();
            form.querySelector('input[name="id"]').value = '';
            this.switchTab('geral');
        } else {
            this.closeModal();

            if (window.returnTo) {
                const dest = window.returnTo;
                window.returnTo = null;
                setTimeout(() => {
                    app.navigateTo(dest);
                    if (dest === 'proposta-comercial' && window.app.propostaComercial) {
                        setTimeout(() => app.propostaComercial.create(), 300);
                    } else if (dest === 'proposta-tecnica' && window.app.propostaTecnica) {
                        setTimeout(() => app.propostaTecnica.create(), 300);
                    }
                }, 500);
            }
        }
    },

    async delete(id) {
        if (await window.app.confirm("Tem certeza que deseja remover este cliente?")) {
            const ok = await store.deleteClient(id);
            if (!ok) {
                window.app.toast("Erro ao remover. Verifique se o servidor está rodando.", "error");
                return;
            }
            window.app.toast("Cliente removido.", "info");
        }
    },

    handleLogoUpload(input) {
        if (!input.files || !input.files[0]) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('cli-logo-preview');
            const container = document.getElementById('cli-logo-preview-container');
            const hidden = document.querySelector('input[name="logo"]');
            if (preview) preview.src = e.target.result;
            if (container) container.style.display = 'block';
            if (hidden) hidden.value = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    },

    removeClientLogo() {
        const preview = document.getElementById('cli-logo-preview');
        const container = document.getElementById('cli-logo-preview-container');
        const hidden = document.querySelector('input[name="logo"]');
        if (preview) preview.src = '';
        if (container) container.style.display = 'none';
        if (hidden) hidden.value = '';
    },

    addContactRow() {
        const container = document.getElementById('contacts-container');
        if (!container) return;
        const index = new Date().getTime(); // unique id
        
        const html = `
            <div class="contact-row" style="background: #fff; border: 1px solid var(--color-border); padding: 10px; border-radius: 6px; position: relative; animation: fadeIn 0.3s ease;">
                <button type="button" onclick="this.closest('.contact-row').remove()" class="btn-icon" style="position: absolute; top: 10px; right: 10px; color: red;" title="Remover Contato"><i class="ph ph-trash"></i></button>
                <div class="row" style="display: flex; gap: 16px; margin-bottom: 10px; padding-right: 30px;">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" style="font-size: 11px;">Nome do Contato</label>
                        <input type="text" name="contatoNome_${index}" class="form-control contact-name-input" placeholder="Ex: João Silva">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" style="font-size: 11px;">Cargo</label>
                        <input type="text" name="contatoCargo_${index}" class="form-control contact-role-input" placeholder="Ex: Gerente de Manutenção">
                    </div>
                </div>
                <div class="row" style="display: flex; gap: 16px;">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" style="font-size: 11px;">E-mail</label>
                        <input type="email" name="contatoEmail_${index}" class="form-control contact-email-input" placeholder="joao@empresa.com.br">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" style="font-size: 11px;">Telefone / Celular</label>
                        <input type="text" name="contatoTelefone_${index}" class="form-control contact-phone-input" placeholder="(00) 00000-0000">
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    }
};

window.clientesModule = ClientesModule;
ClientesModule.init();
