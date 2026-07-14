import { store } from './state.js';

/**
 * Proposta Comercial Module
 * Manages commercial proposals.
 */

window.app = window.app || {};

const PropostaComercialModule = {
    init() {
        console.log("Proposta Comercial Module Initializing...");

        window.app.propostaComercial = {
            create: this.create.bind(this),
            renderModal: this.renderModal.bind(this),
            closeModal: this.closeModal.bind(this),
            save: this.save.bind(this),
            exportToWord: this.exportToWord.bind(this),
            toggleOther: this.toggleOther.bind(this),
            handleLogoUpload: this.handleLogoUpload.bind(this),
            handleClientLogoUpload: this.handleClientLogoUpload.bind(this),
            removeClientLogo: this.removeClientLogo.bind(this),
            handleWatermarkUpload: this.handleWatermarkUpload.bind(this),
            edit: this.edit.bind(this),
            deleteProposal: this.deleteProposal.bind(this),
            addSupplyRow: this.addSupplyRow.bind(this),
            addItemRow: this.addItemRow.bind(this),
            formatCurrency: this.formatCurrency.bind(this),
            updateContactDropdown: this.updateContactDropdown.bind(this),
            handleContactSelection: this.handleContactSelection.bind(this),
            resetView: this.resetView.bind(this),
            switchTab: this.switchTab.bind(this),
            addRevisionRow: this.addRevisionRow.bind(this),
            addPagamentoEventoRow: this.addPagamentoEventoRow.bind(this)
        };

        this.viewMode = 'list';
        this._forcedList = false;
        this._loading = false;
        this._usersCache = null;
        this.activeTab = 'geral'; // geral, escopo, condicoes, assinaturas

        // Restore state if available
        const savedProposal = store.getState().activeCommercialProposal;
        if (savedProposal) {
            console.log("[PropostaComercial] Restoring active proposal from state...");
            this.viewMode = 'form';
        }

        store.subscribe((state) => {
            const container = document.getElementById('view-proposta-comercial');
            if (container && !container.classList.contains('hidden-module') && this.viewMode === 'list') {
                this.render();
            }
        });

        this._loadUsers();
    },

    resetView() {
        this.viewMode = 'list';
    },

    switchTab(tab) {
        // Save current form data before switching
        const form = document.getElementById('form-proposta-comercial');
        if (form) {
            // Usa _proposalData como base para preservar campos de abas não visíveis
            const current = this._proposalData || store.getState().activeCommercialProposal || {};
            const updated = this._captureFormData(form, current);
            this._proposalData = updated; // atualiza dados locais
            store.setState({ activeCommercialProposal: updated });
        }
        this.activeTab = tab;
        // Re-render only the tab content area
        const tabContent = document.getElementById('pc-tab-content');
        if (tabContent) {
            const data = this._proposalData || store.getState().activeCommercialProposal || {};
            tabContent.innerHTML = this._renderActiveTab(data);
            // Update tab button styles
            document.querySelectorAll('.pc-tab-btn').forEach(btn => {
                const isActive = btn.dataset.tab === tab;
                btn.style.color = isActive ? 'var(--color-accent)' : '#64748b';
                btn.style.borderBottom = isActive ? '3px solid var(--color-accent)' : '3px solid transparent';
                btn.style.fontWeight = isActive ? '700' : '600';
            });
            // Restore contact dropdown if on geral tab
            if (tab === 'geral' && data.cliente) {
                setTimeout(() => this.updateContactDropdown(data.cliente, data.aos_cuidados), 50);
            }
        }
    },

    // Captures current form DOM values and merges into a data object (non-persisting)
    _captureFormData(form, current = {}) {
        const fd = new FormData(form);
        // Supply items
        const supplyItems = [];
        form.querySelectorAll('#supply-items-container textarea').forEach(ta => {
            if (ta.value.trim()) supplyItems.push({ text: ta.value.trim() });
        });
        // Investment items
        const itens = [];
        form.querySelectorAll('#investment-items-body tr').forEach(row => {
            const qtd  = row.querySelector('input[name^="item_qtd_"]');
            const desc = row.querySelector('input[name^="item_desc_"]');
            const ipi  = row.querySelector('input[name^="item_ipi_"]');
            const price = row.querySelector('input[name^="item_price_"]');
            const direto = row.querySelector('input[name^="item_direto_"]');
            if (qtd && desc) itens.push({ qtd: qtd.value, desc: desc.value, ipi: ipi?.value, price: price?.value, direto: direto?.checked || false });
        });
        const get = k => fd.get(k) ?? current[k] ?? null;
        const cidade = get('cidade') || '';
        const uf = get('uf') || '';
        const result = Object.assign({}, current, {
            cliente: get('cliente'), projeto: get('projeto'), referencia: get('referencia'),
            codigo: get('codigo'), aos_cuidados: get('aos_cuidados'), data_emissao: get('data_emissao'),
            objeto: get('objeto'), cidade, uf,
            localizacao: [cidade, uf].filter(Boolean).join('/') || get('localizacao') || '',
            email: get('email'), telefone: get('telefone'),
            supplyItems: supplyItems.length ? supplyItems : current.supplyItems,
            resp_projeto: fd.get('resp_projeto') === 'on', resp_montagem: fd.get('resp_montagem') === 'on',
            resp_supervisao: fd.get('resp_supervisao') === 'on', resp_comissionamento: fd.get('resp_comissionamento') === 'on',
            resp_frete: fd.get('resp_frete') === 'on',
            itens: itens.length ? itens : current.itens,
            impostos_texto: get('impostos_texto'), ipi_texto: get('ipi_texto'),
            pgto_evento: get('pgto_evento'), pgto_parcela: get('pgto_parcela'), pgto_fat: get('pgto_fat'),
            faturamento_ncm: fd.get('faturamento_ncm') === 'Outro'
                ? (fd.get('faturamento_ncm_outro') || '')
                : (fd.get('faturamento_ncm') || current.faturamento_ncm || null),
            prazo_entrega: get('prazo_entrega'),
            validade: get('validade'), data_base: get('data_base'), despesas: get('despesas'),
            transporte: get('transporte'), condicoes: get('condicoes'),
            sig1_active: get('sig1_active') === 'on', sig1_nome: get('sig1_nome'), sig1_cargo: get('sig1_cargo'), sig1_tel: get('sig1_tel'), sig1_cel: get('sig1_cel'), sig1_email: get('sig1_email'),
            sig2_active: get('sig2_active') === 'on', sig2_nome: get('sig2_nome'), sig2_cargo: get('sig2_cargo'), sig2_tel: get('sig2_tel'), sig2_cel: get('sig2_cel'), sig2_email: get('sig2_email'),
            sig3_active: get('sig3_active') === 'on', sig3_nome: get('sig3_nome'), sig3_cargo: get('sig3_cargo'), sig3_tel: get('sig3_tel'), sig3_cel: get('sig3_cel'), sig3_email: get('sig3_email'),
            logo_base64: document.getElementById('calc_logo_base64')?.value || current.logo_base64 || '',
            client_logo_base64: document.getElementById('client_logo_base64')?.value || current.client_logo_base64 || '',
            watermark_base64: document.getElementById('calc_watermark_base64')?.value || current.watermark_base64 || '',
        });
        // Capture payment events from DOM
        const pagamentoEventos = [];
        form.querySelectorAll('#pagamento-eventos-body .pagamento-evento-row').forEach(row => {
            const perc = row.querySelector('input[name^="pgto_evento_percentual_"]');
            const desc = row.querySelector('input[name^="pgto_evento_descricao_"]');
            pagamentoEventos.push({ percentual: perc?.value || '', descricao: desc?.value || '' });
        });
        if (pagamentoEventos.length) Object.assign(result, { pagamento_eventos: pagamentoEventos });
        // Capture revisions from DOM
        const revisions = [];
        form.querySelectorAll('.revision-row').forEach((row, i) => {
            revisions.push({
                no: fd.get(`rev_no_${i}`),
                desc: fd.get(`rev_desc_${i}`),
                elab: fd.get(`rev_elab_${i}`),
                verif: fd.get(`rev_verif_${i}`),
                aprov: fd.get(`rev_aprov_${i}`),
                data: (() => {
                    const val = fd.get(`rev_data_${i}`);
                    if(!val) return '';
                    if(val.includes('-')) {
                        const [y,m,d] = val.split('-');
                        return `${d}/${m}/${y}`;
                    }
                    return val;
                })()
            });
        });
        if (revisions.length) Object.assign(result, { revisions });
        return result;
    },


    render() {
        const container = document.getElementById('view-proposta-comercial');
        if (!container) return;

        // Auto-load from current PTC if in list mode with no active proposal
        const ptc = window.app.currentPtc;
        const active = store.getState().activeCommercialProposal;
        if (ptc && ptc.folder && this.viewMode === 'list' && !this._forcedList && !active) {
            this._loadFromPtc(ptc.folder, ptc.revision || '');
            if (!container.querySelector('.card')) {
                container.innerHTML = `<div style="text-align:center;padding:60px;color:#94a3b8;"><i class="ph ph-spinner ph-spin" style="font-size:32px;"></i><p style="margin-top:12px;">Carregando proposta da PTC ${ptc.folder}...</p></div>`;
            }
            return;
        }
        this._forcedList = false;

        if (this.viewMode === 'form') {
            // Check if form is actually in the DOM
            if (!container.querySelector('#form-proposta-comercial-container')) {
                console.log("[PropostaComercial] Form mode active but DOM empty. Restoring...");
                const savedProposal = store.getState().activeCommercialProposal;
                if (savedProposal) {
                    this.renderModal(savedProposal);
                } else {
                    this.viewMode = 'list';
                    this.render();
                }
            }
            return;
        }

        const propostas = store.getState().propostasComerciais || [];

        // Static Shell if not exists
        if (!container.querySelector('.module-header-sticky')) {
            container.innerHTML = `
                <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                    <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-briefcase"></i> Propostas Comerciais
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">Gerencie suas propostas comerciais aqui.</div>
                        </div>
                        <div style="display:flex;gap:10px;">
${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.propostaComercial.create()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                                <i class="ph ph-plus"></i> Nova Proposta
                            </button>` : ''}
                        </div>
                    </div>

                    <div id="propostas-comerciais-list-container" style="flex:1;overflow-y:auto;padding:0;"></div>
                </div>
            `;
        }

        const listContainer = container.querySelector('#propostas-comerciais-list-container');
        if (!listContainer) return;

        if (propostas.length === 0) {
            listContainer.innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
                    <div style="text-align: center; color: #94a3b8;">
                        <i class="ph ph-briefcase" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Nenhuma proposta comercial cadastrada.</p>
                        <button class="btn btn-sm btn-secondary" style="margin-top: 10px;" onclick="app.propostaComercial.create()">Criar a primeira</button>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<table class="w-full text-left" style="border-collapse: collapse;">';
        html += `
            <thead>
                <tr style="border-bottom: 1px solid var(--color-border); background: #f8fafc;">
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Data</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">PTC</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Cliente</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Projeto</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px; text-align: right;">Ações</th>
                </tr>
            </thead>
            <tbody>
        `;

        propostas.forEach(p => {
            const date = new Date(p.createdAt || p.updatedAt).toLocaleDateString();

            html += `
                <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 12px 16px;">${date}</td>
                    <td style="padding: 12px 16px; font-weight: 500; font-size: 12px; color: var(--color-primary);">${p.ptc_folder || '-'}</td>
                    <td style="padding: 12px 16px; font-weight: 500;">${p.cliente}</td>
                    <td style="padding: 12px 16px; font-weight: 500;">${p.projeto || '-'}</td>
                    <td style="padding: 12px 16px; text-align: right;">
${store.canEdit() ? `                        <button class="btn-icon" onclick="app.propostaComercial.edit('${p.id}')" title="Editar">
                            <i class="ph ph-pencil-simple"></i>
                        </button>` : ''}
                        <button class="btn-icon" onclick="app.propostaComercial.deleteProposal('${p.id}')" title="Excluir" style="color: var(--color-danger);">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        listContainer.innerHTML = html;
    },

    create() {
        console.log('[PC.create] currentPtc.client:', window.app.currentPtc?.client);
        let initialData = {};
        if (window.app.currentPtc) {
            initialData = {
                cliente: window.app.currentPtc.client || '',
                projeto: window.app.currentPtc.title || '',
                objeto: window.app.currentPtc.type || 'PAINEL ELÉTRICO DE BAIXA TENSÃO',
                engenheiroResponsavel: ''
            };
        }
        this.viewMode = 'form';
        store.setState({ activeCommercialProposal: initialData });
        this.renderModal(initialData);
    },

    _userOptions(selected, initialsOnly) {
        if (!this._usersCache) return '<option value="">Nenhum usuário encontrado</option>';
        const users = this._usersCache.filter(u => u.nivel === 'admin' || u.nivel === 'engenheiro');
        const _initials = name => name.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
        const selectedIsInitials = !initialsOnly && selected && !users.some(u => u.name === selected);
        const matchedUser = selectedIsInitials ? users.find(u => _initials(u.name) === selected.toUpperCase()) : null;
        const html = users.map(u => {
            const val = initialsOnly ? _initials(u.name) : u.name;
            const isSelected = initialsOnly
                ? _initials(u.name) === (selected || '').toUpperCase()
                : (u.name === selected || u === matchedUser);
            let displayText;
            if (initialsOnly) {
                displayText = isSelected ? val : `${u.name} (${u.nivel})`;
            } else {
                displayText = u.name;
            }
            return `<option value="${val}" ${isSelected ? 'selected' : ''}>${displayText}</option>`;
        }).join('');
        return '<option value="">Selecione...</option>' + html;
    },

    async _loadUsers() {
        if (this._usersCache) return;
        const token = store.getState().auth?.token;
        if (!token) return;
        try {
            const r = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const j = await r.json();
            if (j && Array.isArray(j.users)) {
                this._usersCache = j.users;
                this._refreshUserDropdown();
            }
        } catch {}
    },

    _refreshUserDropdown() {
        if (!this._usersCache || this._usersCache.length === 0) return;
        const _initials = name => name.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
        const selects = document.querySelectorAll('#form-proposta-comercial select[data-user-select]');
        selects.forEach(select => {
            const initialsOnly = select.hasAttribute('data-initials-only');
            const currentValue = select.value;
            let matchedUser = null;
            if (!initialsOnly) {
                const currentIsInitials = currentValue && !this._usersCache.some(u => u.name === currentValue);
                matchedUser = currentIsInitials ? this._usersCache.find(u => _initials(u.name) === currentValue.toUpperCase()) : null;
            }
            select.innerHTML = '<option value="">Selecione...</option>';
            this._usersCache
                .filter(u => u.nivel === 'admin' || u.nivel === 'engenheiro')
                .forEach(u => {
                    const opt = document.createElement('option');
                    const val = initialsOnly ? _initials(u.name) : u.name;
                    let isSelected;
                    if (initialsOnly) {
                        isSelected = _initials(u.name) === (currentValue || '').toUpperCase();
                    } else {
                        isSelected = u.name === currentValue || u === matchedUser;
                    }
                    opt.value = val;
                    if (initialsOnly) {
                        opt.textContent = isSelected ? val : `${u.name} (${u.nivel})`;
                    } else {
                        opt.textContent = u.name;
                    }
                    if (isSelected) opt.selected = true;
                    select.appendChild(opt);
                });
        });
    },

    _setRevisionUserText(select) {
        select.options[select.selectedIndex].text = select.value;
    },

    async renderModal(data = {}) {
        await this._loadUsers();
        try {
            console.log('[PC.renderModal] data.cliente:', data.cliente, '| data completo:', data);
            if (!data.cliente && window.app.currentPtc?.client) {
                data.cliente = window.app.currentPtc.client;
                console.log('[PC.renderModal] fallback cliente ->', data.cliente);
            }
            const existing = document.getElementById('modal-proposta-comercial');
            if (existing) existing.remove();

            if (!data.revisions) data.revisions = [];
            // Armazena dados completos localmente para uso em trocas de aba
            this._proposalData = { ...data };

            if (!this.activeTab) this.activeTab = 'geral';
            const tab = this.activeTab;

            const tabBtn = (id, label, icon) => `
                <button type="button" class="pc-tab-btn" data-tab="${id}"
                    onclick="app.propostaComercial.switchTab('${id}')"
                    style="padding:14px 20px;border:none;background:transparent;font-weight:${tab===id?'700':'600'};
                           font-size:13px;cursor:pointer;white-space:nowrap;
                           color:${tab===id?'var(--color-accent)':'#64748b'};
                           border-bottom:3px solid ${tab===id?'var(--color-accent)':'transparent'};
                           transition:all 0.2s;">
                    <i class="ph ${icon}"></i> ${label}
                </button>`;

            const html = `
                <div id="form-proposta-comercial-container" class="fade-in"
                     style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                    <!-- Header -->
                    <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-briefcase"></i> Proposta Comercial <span style="font-weight:300;opacity:0.8;">| ${data.projeto || 'Novo Projeto'}</span>
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">Gestão Comercial e Financeira</div>
                        </div>
                        <div style="display:flex;gap:10px;">
                            <button class="btn btn-sm btn-ghost" onclick="app.propostaComercial.closeModal()" style="color:white;border:1px solid rgba(255,255,255,0.3);"><i class="ph ph-arrow-left"></i> Voltar</button>
                        </div>
                    </div>

                    <!-- Tab Bar -->
                    <div style="border-bottom:1px solid #e2e8f0;background:white;display:flex;overflow-x:auto;flex-shrink:0;padding:0 20px;">
                        ${tabBtn('geral',      'Dados Gerais',          'ph-identification-card')}
                        ${tabBtn('escopo',     'Escopo',                'ph-list-checks')}
                        ${tabBtn('condicoes',  'Condições Comerciais',  'ph-handshake')}
                        ${tabBtn('revisoes',   'Revisões',              'ph-clock-history')}
                        ${tabBtn('assinaturas','Assinaturas (Rodapé)',   'ph-pen-nib')}
                    </div>

                    <!-- Tab Content -->
                    <form id="form-proposta-comercial" onsubmit="return false;" style="flex:1;display:flex;flex-direction:column;min-height:0;">
                        <div style="flex:1;overflow-y:auto;scrollbar-gutter:stable;">
                            <input type="hidden" name="id" value="${data.id || ''}">
                            <div id="pc-tab-content">
                                ${this._renderActiveTab(data)}
                            </div>
                        </div>
                    </form>

                    <!-- Footer -->
                    <div class="module-footer" style="padding:15px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;gap:8px;">
                            <button type="button" class="btn btn-ghost btn-export-word" onclick="app.propostaComercial.exportToWord()" style="background:var(--color-accent);color:white;"><i class="ph ph-file-doc"></i> Exportar Word</button>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <button type="button" class="btn btn-cancel" onclick="app.propostaComercial.closeModal()">Cancelar</button>
                            <button type="button" class="btn btn-primary btn-save" onclick="app.propostaComercial.save()" style="">Salvar</button>
                            <button type="button" class="btn btn-outline btn-save-as-new" onclick="app.propostaComercial.saveAsNew()" style="background:var(--color-accent);color:white;display:flex;align-items:center;gap:6px;"><i class="ph ph-copy"></i> Salvar como Nova</button>
                        </div>
                    </div>
                </div>
            `;

            const container = document.getElementById('view-proposta-comercial');
            if (container) container.innerHTML = html;

            // Modo somente leitura (Fechada/Perdida no pipeline)
            if (store.getState().proposalReadOnly) {
                this._applyReadOnly(container);
            }

            if (!document.getElementById('pc-form-styles')) {
                const style = document.createElement('style');
                style.id = 'pc-form-styles';
                style.textContent = `
                    #form-proposta-comercial-container .form-label {
                        font-weight: 700; font-size: 11px; color: #64748b;
                        text-transform: uppercase; margin-bottom: 6px; display: block;
                    }
                    #form-proposta-comercial-container .form-control {
                        border-radius: 8px; border: 1.5px solid #e2e8f0;
                        padding: 10px 14px; font-size: 13px; transition: all 0.2s;
                    }
                    #form-proposta-comercial-container .form-control:focus {
                        border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); outline: none;
                    }
                    #form-proposta-comercial-container .btn-save:hover { background-color: rgb(85, 40, 191) !important; border-color: rgb(85, 40, 191) !important; }
                    #form-proposta-comercial-container .btn-save-as-new:hover { background-color: rgb(230, 134, 67) !important; border-color: rgb(230, 134, 67) !important; }
                    #form-proposta-comercial-container .btn-export-word:hover { background-color: rgb(155, 158, 150) !important; border-color: rgb(155, 158, 150) !important; }
                `;
                document.head.appendChild(style);
            }

            if (data.cliente) {
                setTimeout(() => this.updateContactDropdown(data.cliente, data.aos_cuidados), 50);
            }
        } catch (e) {
            console.error('CRITICAL ERROR IN renderModal:', e);
            alert('Erro crítico ao renderizar modal da proposta: ' + e.message);
        }
    },

    _renderActiveTab(data) {
        switch (this.activeTab) {
            case 'escopo':      return this._renderTabEscopo(data);
            case 'condicoes':   return this._renderTabCondicoes(data);
            case 'assinaturas': return this._renderTabAssinaturas(data);
            case 'revisoes':    return this._renderTabRevisoes(data);
            default:            return this._renderTabGeral(data);
        }
    },

    _renderTabGeral(data) {
        console.log('[PC._renderTabGeral] data.cliente:', data.cliente);
        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Dados Gerais da Proposta</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Informações do cliente e detalhes do projeto</div>
                    </div>
                </div>

                <div class="form-group">

                    <label class="form-label">Cliente</label>

                    <select name="cliente" id="pc_cliente" class="form-control" onchange="app.propostaComercial.updateContactDropdown(this.value)">

                        <option value="" disabled ${!data.cliente ? 'selected' : ''}>Selecione um cliente...</option>

                        ${(store.getState().clientes || []).map(c => `

                            <option value="${c.razaoSocial}" ${data.cliente === c.razaoSocial ? 'selected' : ''}>${c.razaoSocial}</option>

                        `).join('')}

                    </select>

                    <div style="margin-top: 5px; font-size: 12px;">

                        <a href="#" onclick="window.returnTo = 'proposta-comercial'; app.navigateTo('clientes'); app.propostaComercial.closeModal(); return false;" style="color: #3b82f6;">+ Gerenciar Clientes</a>

                    </div>

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Código da Proposta</label>

                        <div style="display: flex; gap: 8px;">

                            <input type="text" id="prop-codigo" name="codigo" class="form-control" value="${data.codigo || (() => {
                                const ptcFolder = String(window.app.currentPtc?.folder || '');
                                const newMatch = ptcFolder.match(/^(\d{8,10})/);
                                const oldMatch = ptcFolder.match(/PTC-\d{4}-\d+/i);
                                const basePtc = newMatch ? newMatch[1] : (oldMatch ? oldMatch[0].toUpperCase() : (window.app.currentPtcInfo?.ptcNumber || 'PTC-0000-0000'));
                                return `${basePtc}-PC${data.customCodigoSuffix || '_Rev00'}`;
                            })()}" readonly style="background-color: #f1f5f9; font-weight: 500;">

                            <button type="button" class="btn btn-secondary" title="Editar Código" onclick="const el = document.getElementById('prop-codigo'); el.removeAttribute('readonly'); el.style.backgroundColor = 'white'; el.focus();">

                                <i class="ph ph-pencil-simple"></i>

                            </button>

                        </div>

                    </div>

                    <div class="form-group">

                        <label class="form-label">Data de Emissão</label>

                        <input type="date" name="data_emissao" class="form-control" value="${data.data_emissao || new Date().toISOString().split('T')[0]}">

                    </div>

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Aos Cuidados (A/C)</label>

                        <div id="pc_contact_container">

                            <select name="aos_cuidados" id="pc_aos_cuidados" class="form-control" onchange="app.propostaComercial.handleContactSelection(this.value)">

                                <option value="">Selecione um cliente primeiro...</option>

                                ${data.cliente ? this.getContactOptionsHTML(data.cliente, data.aos_cuidados) : ''}

                            </select>

                        </div>

                    </div>

                    <div class="form-group">

                        <label class="form-label">E-mail</label>

                        <input type="email" name="email" id="pc_email" class="form-control" value="${data.email || ''}" placeholder="email@exemplo.com" readonly style="background: #f1f5f9; cursor: not-allowed;">

                    </div>

                    <div class="form-group">

                        <label class="form-label">Telefone</label>

                        <input type="text" name="telefone" id="pc_telefone" class="form-control" value="${data.telefone || ''}" placeholder="(00) 00000-0000" readonly style="background: #f1f5f9; cursor: not-allowed;">

                    </div>

                </div>



                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Nome do Projeto / Título</label>

                    <input type="text" name="projeto" class="form-control" value="${data.projeto || (window.app.currentPtc ? window.app.currentPtc.title : '')}" placeholder="Ex: Painel Elétrico de Baixa Tensão - 440V">

                </div>



                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Referência / Subtítulo</label>

                    <input type="text" name="referencia" class="form-control" value="${data.referencia || ''}" placeholder="Ex: CCM para Projeto Aumento do Mix de Açúcar">

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Objeto do Fornecimento</label>

                        <input type="text" name="objeto" class="form-control" value="${data.objeto || 'FORNECIMENTO DE PAINÉIS ELÉTRICOS'}">

                    </div>

                    <div class="row" style="display: flex; gap: 12px;">
                        <div class="form-group" style="flex: 2;">
                            <label class="form-label">Cidade</label>
                            <input type="text" name="cidade" id="pc_cidade" class="form-control" value="${data.cidade || ''}" placeholder="Ex: Sertãozinho">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">UF</label>
                            <select name="uf" id="pc_uf" class="form-control">
                                <option value="">Selecione...</option>
                                ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf =>
                                    `<option value="${uf}" ${data.uf === uf ? 'selected' : ''}>${uf}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <input type="hidden" name="localizacao" id="pc_localizacao" value="${data.localizacao || ''}">

                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div class="form-group">
                        <label class="form-label">Engenheiro Responsável</label>
                        <select name="engenheiroResponsavel" class="form-control" data-user-select>
                            ${this._userOptions(data.engenheiroResponsavel)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Vendedor</label>
                        <select name="vendedor" class="form-control">
                            <option value="">Selecione...</option>
                            ${(() => {
                                const list = store.getState().vendedores || [];
                                const current = data.vendedor || '';
                                const exists = list.some(v => v.nome === current);
                                let html = '';
                                if (current && !exists) {
                                    html += `<option value="${this._escapeHtml(current)}" selected>${this._escapeHtml(current)}</option>`;
                                }
                                html += list.map(v => `<option value="${this._escapeHtml(v.nome)}"${v.nome === current ? ' selected' : ''}>${this._escapeHtml(v.nome)}</option>`).join('');
                                return html;
                            })()}
                        </select>
                    </div>
                </div>

                <!-- Image Uploads Row -->

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">

                    <!-- Company Header Logo -->

                    <div class="form-group">

                        <label class="form-label">Cabeçalho (Logo)</label>

                        <div style="display: flex; flex-direction: column; gap: 10px;">

                            <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-upload-simple"></i> Alterar Header

                                <input type="file" id="calc_logo_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaComercial.handleLogoUpload(this)">

                            </label>

                            <div id="calc_logo_preview_container" style="display: ${data.logo_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="calc_logo_preview" src="${data.logo_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px;">

                                <input type="hidden" id="calc_logo_base64" name="logo_base64" value="${data.logo_base64 || ''}">

                            </div>

                        </div>

                    </div>



                    <!-- Client Logo -->

                    <div class="form-group">

                        <label class="form-label">Logo do Cliente (Centro)</label>

                        <div style="display: flex; flex-direction: column; gap: 10px;">

                            <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-user-circle"></i> Escolher Logo Cliente

                                <input type="file" id="client_logo_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaComercial.handleClientLogoUpload(this)">

                            </label>

                            <div id="client_logo_preview_container" style="display: ${data.client_logo_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="client_logo_preview" src="${data.client_logo_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px;">

                                <input type="hidden" id="client_logo_base64" name="client_logo_base64" value="${data.client_logo_base64 || ''}">
                                <div style="margin-top: 8px;">
                                    <button type="button" class="btn btn-sm btn-danger" onclick="app.propostaComercial.removeClientLogo()">
                                        <i class="ph ph-trash"></i> Remover Logo
                                    </button>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>



                <!-- Watermark Upload -->

                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Marca D'água (Fundo)</label>

                    <div style="display: flex; flex-direction: column; gap: 10px;">

                        <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-image"></i> Escolher Marca D'água

                                <input type="file" id="calc_watermark_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaComercial.handleWatermarkUpload(this)">

                            </label>

                            <div id="calc_watermark_preview_container" style="display: ${data.watermark_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="calc_watermark_preview" src="${data.watermark_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px; opacity: 0.5;">

                                <input type="hidden" id="calc_watermark_base64" name="watermark_base64" value="${data.watermark_base64 || ''}">

                            </div>

                    </div>

                </div>

            </div>

        `;

    },

    _renderTabEscopo(data) {
        const techData = store.getState().activeProposal || {};
        const techScopeItems = techData.scopeItems || [];
        const supplyItems = data.supplyItems && data.supplyItems.length > 0
            ? data.supplyItems
            : [{ text: 'Em atenção a vossa solicitação, apresentamos nossa Proposta Comercial...' }];
        return `<div style="padding:30px;max-width:900px;">
            <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <label class="form-label">1 - Descrição do Fornecimento (Itens do Escopo)</label>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaComercial.addSupplyRow()">+ Adicionar Item</button>
                </div>
                <div id="supply-items-container" style="display:flex;flex-direction:column;gap:8px;">
                    ${supplyItems.map((item,i)=>`
                        <div class="supply-row" style="display:flex;gap:8px;align-items:flex-start;">
                            <textarea name="supply_item_${i}" class="form-control" rows="2">${item.text}</textarea>
                            <button type="button" onclick="this.closest('.supply-row').remove()" class="btn-icon" style="color:red;margin-top:8px;"><i class="ph ph-trash"></i></button>
                        </div>`).join('')}
                </div>
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label class="form-label">Matriz de Responsabilidade (Marque o que é Escopo da Minha Empresa)</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;padding:10px;border-radius:6px;border:1px solid var(--color-border);">
                    <label><input type="checkbox" name="resp_projeto" ${data.resp_projeto?'checked':''}> Projeto / Estudos Elétricos</label>
                    <label><input type="checkbox" name="resp_montagem" ${data.resp_montagem?'checked':''}> Montagem em Campo</label>
                    <label><input type="checkbox" name="resp_supervisao" ${data.resp_supervisao?'checked':''}> Supervisão de Montagem</label>
                    <label><input type="checkbox" name="resp_comissionamento" ${data.resp_comissionamento?'checked':''}> Comissionamento e Start-up</label>
                    <label><input type="checkbox" name="resp_frete" ${data.resp_frete?'checked':''}> Frete / Entrega</label>
                </div>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <label class="form-label">2 - Investimento (Itens)</label>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaComercial.addItemRow()">+ Adicionar Item</button>
                </div>
                <table class="w-full text-left" style="font-size:13px;border:1px solid var(--color-border);">
                    <thead><tr style="background:#f1f5f9;">
                        <th style="padding:5px;">Qtd</th><th style="padding:5px;">Descrição</th>
                        <th style="padding:5px;">IPI (%)</th><th style="padding:5px;">Preço Unit. (R$)</th>
                        <th style="padding:5px;text-align:center;font-size:10px;" title="Faturamento Direto">Fat. Dir?</th>
                        <th style="padding:5px;"></th>
                    </tr></thead>
                    <tbody id="investment-items-body">
                        ${(data.itens||[]).map((item,i)=>`
                            <tr>
                                <td style="padding:5px;"><input type="number" name="item_qtd_${i}" class="form-control" value="${item.qtd}" style="width:60px;"></td>
                                <td style="padding:5px;"><input type="text" name="item_desc_${i}" class="form-control" value="${item.desc}"></td>
                                <td style="padding:5px;"><input type="number" name="item_ipi_${i}" class="form-control" value="${item.ipi}" style="width:70px;"></td>
                                <td style="padding:5px;"><input type="text" name="item_price_${i}" class="form-control" value="${item.price}" onblur="this.value=app.formatCurrencyRaw(app.parseCurrency(this.value))"></td>
                                <td style="padding:5px;text-align:center;"><input type="checkbox" name="item_direto_${i}" ${item.direto?'checked':''}></td>
                                <td style="padding:5px;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color:red;"><i class="ph ph-trash"></i></button></td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label class="form-label">3 - Impostos (Configuração)</label>
                <div style="display:flex;gap:15px;">
                    <div style="flex:1;"><label class="form-label" style="font-size:11px;">Impostos Inclusos (Texto)</label>
                        <input type="text" name="impostos_texto" class="form-control" value="${data.impostos_texto||'ICMS, PIS, COFINS Inclusos'}"></div>
                    <div style="flex:1;"><label class="form-label" style="font-size:11px;">IPI Geral (Texto)</label>
                        <input type="text" name="ipi_texto" class="form-control" value="${data.ipi_texto||'A incluir conforme tabela'}"></div>
                </div>
            </div>
        </div>`;
    },

    _renderTabCondicoes(data) {
        // Build payment events - migrate legacy if needed
        let events = data.pagamento_eventos;
        if (!events || !events.length) {
            if (data.pgto_evento || data.pgto_parcela || data.pgto_fat) {
                events = [{ percentual: data.pgto_parcela || '', descricao: data.pgto_fat || '' }];
            } else {
                events = [{ percentual: '100%', descricao: '' }];
            }
        }
        const eventRows = events.map((ev, i) => `
            <tr class="pagamento-evento-row">
                <td style="padding:8px;font-weight:600;white-space:nowrap;">${i+1}° EVENTO DE PAGAMENTO</td>
                <td style="padding:8px;"><input type="text" name="pgto_evento_percentual_${i}" class="form-control" value="${ev.percentual||''}" placeholder="%" style="width:100px;"></td>
                <td style="padding:8px;"><input type="text" name="pgto_evento_descricao_${i}" class="form-control" value="${ev.descricao||''}" placeholder="Descrição"></td>
                <td style="padding:8px;text-align:center;"><button type="button" onclick="if(this.closest('tbody').querySelectorAll('.pagamento-evento-row').length>1)this.closest('tr').remove()" class="btn-icon" style="color:#ef4444;" title="Remover"><i class="ph ph-trash"></i></button></td>
            </tr>
        `).join('');
        return `<div style="padding:30px;max-width:900px;">
            <div class="form-group">
                <label class="form-label">4 - Condição de Pagamento</label>
                <div class="table-container" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                    <table class="w-full" style="font-size:13px;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                                <th style="padding:10px 8px;text-align:left;color:#1e3a8a;font-size:12px;">Evento</th>
                                <th style="padding:10px 8px;text-align:left;color:#1e3a8a;font-size:12px;width:120px;">%</th>
                                <th style="padding:10px 8px;text-align:left;color:#1e3a8a;font-size:12px;">Descrição</th>
                                <th style="padding:10px 8px;text-align:center;color:#1e3a8a;font-size:12px;width:50px;"></th>
                            </tr>
                        </thead>
                        <tbody id="pagamento-eventos-body">
                            ${eventRows}
                        </tbody>
                    </table>
                </div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaComercial.addPagamentoEventoRow()" style="margin-top:8px;">+ Adicionar Evento</button>
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label class="form-label">Classificação Fiscal (NCM)</label>
                ${(() => {
                    const equipments = store.getState().activeTechnicalProposal?.equipments || [];
                    const hasSeu = equipments.some(e => e.type === 'SEU');
                    const hasCubMt = equipments.some(e => e.type === 'CUB-MT');
                    const hasAltaTensao = hasSeu || hasCubMt;
                    const ncmVal = data.faturamento_ncm || '';
                    const isAlta = hasAltaTensao || ncmVal.includes('8537.20') || ncmVal.includes('superior');
                    const isBaixa = ncmVal.includes('8537.10') || ncmVal.includes('até 1.000') || ncmVal.includes('até 1000');
                    const isOutro = !isAlta && !isBaixa && ncmVal !== '';
                    const locked = hasAltaTensao;
                    const lockMsg = hasSeu
                        ? 'Fixado automaticamente — Proposta contém Subestação Unitária (SEU)'
                        : 'Fixado automaticamente — Proposta contém Cubículo de Média Tensão (MT)';
                    return `
                        <select name="faturamento_ncm" class="form-control"
                                ${locked ? 'disabled' : ''}
                                onchange="const d=this.closest('.form-group').querySelector('.ncm-outro');if(d)d.style.display=this.value==='Outro'?'block':'none';">
                            <option value="">Selecione...</option>
                            <option value="8537.10.90 - Quadros e Painéis para tensão até 1.000V" ${!isAlta && isBaixa ? 'selected' : ''}>8537.10.90 - Quadros e Painéis para tensão até 1.000V</option>
                            <option value="8537.20.90 - Quadros e Painéis para tensão superior a 1.000V" ${isAlta ? 'selected' : ''}>8537.20.90 - Quadros e Painéis para tensão superior a 1.000V</option>
                            <option value="Outro" ${isOutro ? 'selected' : ''}>Outro</option>
                        </select>
                        ${locked ? `<div style="font-size:11px;color:#92400e;margin-top:4px;"><i class="ph ph-lock-simple"></i> ${lockMsg}</div>` : ''}
                        <input type="hidden" name="faturamento_ncm_locked" value="${locked ? '1' : '0'}">
                        <div class="ncm-outro" style="margin-top:8px;display:${isOutro ? 'block' : 'none'}">
                            <input type="text" name="faturamento_ncm_outro" class="form-control"
                                   value="${isOutro ? ncmVal : ''}" placeholder="Especifique o NCM...">
                        </div>`;
                })()}
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label class="form-label">6 - Prazo de Entrega</label>
                <input type="text" name="prazo_entrega" class="form-control" value="${data.prazo_entrega||'90 dias após o recebimento do pedido de compra;'}">
            </div>
            <div class="form-group" style="margin-top:15px;display:flex;gap:10px;">
                <div style="flex:1;"><label class="form-label">7 - Validade da Proposta</label>
                    <input type="text" name="validade" class="form-control" value="${data.validade||'10 (dez) dias'}"></div>
                <div style="flex:1;"><label class="form-label">8 - Data Base</label>
                    <input type="text" name="data_base" class="form-control" value="${data.data_base||new Date().toLocaleDateString('pt-BR')}"></div>
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label class="form-label">9 - Despesas</label>
                <input type="text" name="despesas" class="form-control" value="${data.despesas||'Não se aplica a este fornecimento.'}">
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label class="form-label">10 - Transporte</label>
                <textarea name="transporte" class="form-control" rows="3">${data.transporte||'Consideramos nesta proposta o frete tipo CIF, com entrega na USINA SÃO FRANCISCO S/A, localizada no município de SERTÃOZINHO/SP.'}</textarea>
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label class="form-label">Outras Condições / Observações (Opcional)</label>
                <textarea name="condicoes" class="form-control" rows="3" placeholder="Observações extras...">${data.condicoes||''}</textarea>
            </div>
        </div>`;
    },

    _renderTabAssinaturas(data) {
        const sig = (n, label, defNome, defCargo, defTel, defCel, defEmail) => `
            <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:12px;border:1px solid var(--color-border);">
                <label style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                    <input type="checkbox" name="sig${n}_active" ${data['sig'+n+'_active'] !== false ? 'checked' : ''} style="width:16px;height:16px;">
                    <span style="font-size:11px;font-weight:600;">${label}</span>
                </label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <input type="text" name="sig${n}_nome" class="form-control" placeholder="Nome" value="${data['sig'+n+'_nome']||defNome}">
                    <input type="text" name="sig${n}_cargo" class="form-control" placeholder="Cargo" value="${data['sig'+n+'_cargo']||defCargo}">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:8px;">
                    <input type="text" name="sig${n}_tel" class="form-control" placeholder="Tel" value="${data['sig'+n+'_tel']||defTel}">
                    <input type="text" name="sig${n}_cel" class="form-control" placeholder="Cel" value="${data['sig'+n+'_cel']||defCel}">
                    <input type="text" name="sig${n}_email" class="form-control" placeholder="Email" value="${data['sig'+n+'_email']||defEmail}">
                </div>
            </div>`;
        return `<div style="padding:30px;max-width:900px;">
            ${sig(1,'Assinatura 1 (Consultor)','José Cirqueira','Consultor de Vendas','(16) 3945-2145','(16) 9 9793-2877','jose.cirqueira@minhaempresa.com.br')}
            ${sig(2,'Assinatura 2 (Gerente)','Leandro Pereira','Gerente Comercial','(16) 3945-2145','(16) 9 9713-3674','leandro.pereira@minhaempresa.com.br')}
            ${sig(3,'Assinatura 3 (Diretor)','Márcio Vaz','Diretor de Negócios','(16) 3945-2145','(16) 99730-6540','marcio.vaz@minhaempresa.com.br')}
        </div>`;
    },

    _renderTabRevisoes(data) {
        return `
            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Controle de Revisões</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Histórico de versões da proposta comercial</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaComercial.addRevisionRow()">+ Nova Revisão</button>
                </div>
                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto;">
                <table class="w-full" style="font-size: 13px; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 14px; width: 70px; color: #1e3a8a; font-size: 13px;">Nú</th>
                            <th style="padding: 14px; color: #1e3a8a; font-size: 13px;">Descrição</th>
                            <th style="padding: 14px; width: 70px; text-align: center; color: #1e3a8a; font-size: 13px;">Elab.</th>
                            <th style="padding: 14px; width: 70px; text-align: center; color: #1e3a8a; font-size: 13px;">Verif.</th>
                            <th style="padding: 14px; width: 70px; text-align: center; color: #1e3a8a; font-size: 13px;">Aprov.</th>
                            <th style="padding: 14px; width: 120px; text-align: center; color: #1e3a8a; font-size: 13px;">Data</th>
                            <th style="padding: 14px; width: 50px;"></th>
                        </tr>
                    </thead>
                    <tbody id="pc-revisions-body">
                        ${(data.revisions || []).map((rev, index) => `
                            <tr class="revision-row" style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px;"><input type="text" name="rev_no_${index}" class="form-control" value="${rev.no || ''}" style="text-align: center; padding: 10px 4px;"></td>
                                <td style="padding: 12px;"><input type="text" name="rev_desc_${index}" class="form-control" value="${rev.desc || ''}"></td>
                                <td style="padding: 12px;"><select name="rev_elab_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaComercialModule._setRevisionUserText(this)">${this._userOptions(rev.elab, true)}</select></td>
                                <td style="padding: 12px;"><select name="rev_verif_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaComercialModule._setRevisionUserText(this)">${this._userOptions(rev.verif, true)}</select></td>
                                <td style="padding: 12px;"><select name="rev_aprov_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaComercialModule._setRevisionUserText(this)">${this._userOptions(rev.aprov, true)}</select></td>
                                <td style="padding: 12px;"><input type="date" name="rev_data_${index}" class="form-control" value="${(() => {
                                    if(!rev.data) return '';
                                    if(rev.data.includes('/')) {
                                        const [d,m,y] = rev.data.split('/');
                                        return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
                                    }
                                    return rev.data;
                                })()}" style="text-align: center; padding: 10px 8px;"></td>
                                <td style="padding: 12px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                </div>
            </div>
        `;
    },

    updateContactDropdown(clientName, selectedContact = null) {
        const container = document.getElementById('pc_contact_container');
        const msgDiv = document.getElementById('pc_no_contact_msg');
        if (!container) return;

        const slug = (s) => (s || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const targetSlug = slug(clientName);
        
        const state = store.getState();
        const client = state.clientes.find(c => slug(c.razaoSocial) === targetSlug);
        
        console.log(`[PropostaComercial] Search for "${clientName}" (slug: ${targetSlug}). Found?`, !!client);

        // Build contact list from array or legacy fallback fields
        const contacts = [];
        if (client) {
            if (Array.isArray(client.contatos) && client.contatos.length > 0) {
                contacts.push(...client.contatos);
            } else if (client.contatoNome || client.email || client.telefone) {
                contacts.push({
                    nome: client.contatoNome || '',
                    email: client.email || '',
                    telefone: client.telefone || '',
                    cargo: client.contatoCargo || ''
                });
            }
        }

        // Populate contact dropdown
        if (contacts.length > 0) {
            const options = contacts.map(c => {
                const isSelected = selectedContact === c.nome || (!selectedContact && contacts[0] === c);
                return `<option value="${c.nome}" ${isSelected ? 'selected' : ''}>${c.nome}</option>`;
            }).join('');
            container.innerHTML = `
                <select name="aos_cuidados" id="pc_aos_cuidados" class="form-control" onchange="app.propostaComercial.handleContactSelection(this.value)">
                    <option value="">Selecione um contato...</option>
                    ${options}
                </select>
            `;
            if(msgDiv) msgDiv.style.display = 'none';
        } else {
            container.innerHTML = `
                <select name="aos_cuidados" id="pc_aos_cuidados" class="form-control">
                    <option value="">Nenhum contato encontrado</option>
                </select>
            `;
        }

        // Auto-fill email and telefone from first contact (or legacy fields)
        const emailInput = document.getElementById('pc_email');
        const telInput = document.getElementById('pc_telefone');
        let primeiroContato = null;
        if (contacts.length > 0) {
            if (selectedContact) {
                primeiroContato = contacts.find(c => c.nome === selectedContact);
            }
            if (!primeiroContato) {
                primeiroContato = contacts[0];
            }
        }
        if (emailInput) emailInput.value = (primeiroContato && primeiroContato.email) || '';
        if (telInput) telInput.value = (primeiroContato && primeiroContato.telefone) || '';

        // Auto-fill Cidade e UF
        const cidadeInput = document.getElementById('pc_cidade');
        const ufSelect = document.getElementById('pc_uf');
        const locInput = document.getElementById('pc_localizacao');
        if (client) {
            const cidade = client.cidade || client.city || '';
            const estado = client.estado || client.uf || '';
            if (cidadeInput) cidadeInput.value = cidade.trim();
            if (ufSelect) ufSelect.value = estado.trim().toUpperCase();
            if (locInput) locInput.value = [cidade.trim(), estado.trim().toUpperCase()].filter(Boolean).join('/');
        } else {
            if (cidadeInput) cidadeInput.value = '';
            if (ufSelect) ufSelect.value = '';
            if (locInput) locInput.value = '';
        }

        // Auto-carregar logo do cliente (só se a proposta não tiver um valor explicitamente salvo)
        const pcProposalData = store.getState().activeCommercialProposal;
        const clPreview = document.getElementById('client_logo_preview');
        const clContainer = document.getElementById('client_logo_preview_container');
        const clInput = document.getElementById('client_logo_base64');
        if (!pcProposalData?.client_logo_base64 && client && client.logo && clPreview && clContainer && clInput) {
            clPreview.src = client.logo;
            clContainer.style.display = 'block';
            clInput.value = client.logo;
        }
    },

    getContactOptionsHTML(clientName, selectedValue = '') {
        const clients = store.getState().clientes || [];
        const client = clients.find(c => c.razaoSocial === clientName);
        if (!client || !Array.isArray(client.contatos) || client.contatos.length === 0) {
            return '<option value="">Nenhum contato encontrado</option>';
        }
        return client.contatos.map(c => `
            <option value="${c.nome}" ${selectedValue === c.nome ? 'selected' : ''}>${c.nome}</option>
        `).join('');
    },

    handleContactSelection(contactName) {
        const clientName = document.getElementById('pc_cliente').value;
        const clients = store.getState().clientes || [];
        const client = clients.find(c => c.razaoSocial === clientName);
        const contacts = [];
        if (client) {
            if (Array.isArray(client.contatos) && client.contatos.length > 0) {
                contacts.push(...client.contatos);
            } else if (client.contatoNome || client.email || client.telefone) {
                contacts.push({
                    nome: client.contatoNome || '',
                    email: client.email || '',
                    telefone: client.telefone || '',
                    cargo: client.contatoCargo || ''
                });
            }
        }
        const contact = contacts.find(c => c.nome === contactName);
        if (contact) {
            const emailInput = document.getElementById('pc_email');
            const telInput = document.getElementById('pc_telefone');
            if (emailInput) emailInput.value = contact.email || '';
            if (telInput) telInput.value = contact.telefone || '';
        }
    },

    save() {

        if (store.getState().proposalReadOnly) {
            window.app.toast('Proposta em modo somente leitura. Não é possível salvar.', 'warning', 0);
            return;
        }

        const form = document.getElementById('form-proposta-comercial');
        if (!form) return;

        const formData = new FormData(form);
        const id = formData.get('id');

        // Parse Supply Items
        const supplyItems = [];
        const supplyRows = document.querySelectorAll('#supply-items-container textarea');
        supplyRows.forEach(input => {
            if (input.value.trim()) {
                supplyItems.push({ text: input.value.trim() });
            }
        });

        // Parse Items (Investment)
        const items = [];
        const itemRows = document.querySelectorAll('#investment-items-body tr');
        itemRows.forEach((row, index) => {
            // Because we might have deleted rows, we can't rely on 'index' from loop matching the row name index strictly if we used unique IDs, 
            // but here we used index at creation. A better way is to iterate inputs.
            const qtdInput = row.querySelector('input[name^="item_qtd_"]');
            const descInput = row.querySelector('input[name^="item_desc_"]');
            const ipiInput = row.querySelector('input[name^="item_ipi_"]');
            const priceInput = row.querySelector('input[name^="item_price_"]');
            const diretoInput = row.querySelector('input[name^="item_direto_"]');

            if (qtdInput && descInput) {
                items.push({
                    qtd: qtdInput.value,
                    desc: descInput.value,
                    ipi: ipiInput.value,
                    price: priceInput.value,
                    direto: diretoInput ? diretoInput.checked : false
                });
            }
        });

        // Parse revisions
        const revisions = [];
        const revRows = form.querySelectorAll('.revision-row');
        revRows.forEach((row, i) => {
            revisions.push({
                no: formData.get(`rev_no_${i}`),
                desc: formData.get(`rev_desc_${i}`),
                elab: formData.get(`rev_elab_${i}`),
                verif: formData.get(`rev_verif_${i}`),
                aprov: formData.get(`rev_aprov_${i}`),
                data: (() => {
                    const val = formData.get(`rev_data_${i}`);
                    if(!val) return '';
                    if(val.includes('-')) {
                        const [y,m,d] = val.split('-');
                        return `${d}/${m}/${y}`;
                    }
                    return val;
                })()
            });
        });

        const clienteFormValue = formData.get('cliente');
        const fallbackClient = (window.app.currentPtc && window.app.currentPtc.client) ? window.app.currentPtc.client : 'Cliente Não Informado';
        const finalClient = (clienteFormValue && clienteFormValue.trim() !== '') ? clienteFormValue : fallbackClient;

        const proposta = {
            id: id || undefined,
            ptc_folder: (window.app.currentPtc && window.app.currentPtc.folder) ? window.app.currentPtc.folder : undefined,
            cliente: finalClient,
            projeto: formData.get('projeto') || ((window.app.currentPtc && window.app.currentPtc.title) ? window.app.currentPtc.title : ''),
            referencia: formData.get('referencia') || '',
            codigo: formData.get('codigo'),
            aos_cuidados: formData.get('aos_cuidados'),
            data_emissao: formData.get('data_emissao'),
            supplyItems: supplyItems,
            resp_projeto: formData.get('resp_projeto') === 'on',
            resp_montagem: formData.get('resp_montagem') === 'on',
            resp_supervisao: formData.get('resp_supervisao') === 'on',
            resp_comissionamento: formData.get('resp_comissionamento') === 'on',
            resp_frete: formData.get('resp_frete') === 'on',
            itens: items,
            impostos_texto: formData.get('impostos_texto'),
            ipi_texto: formData.get('ipi_texto'),
            objeto: formData.get('objeto'),
            cidade: formData.get('cidade') || '',
            uf: formData.get('uf') || '',
            localizacao: formData.get('localizacao') || [formData.get('cidade') || '', formData.get('uf') || ''].filter(Boolean).join('/'),
            engenheiroResponsavel: formData.get('engenheiroResponsavel') || '',
            vendedor: formData.get('vendedor') || '',
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            // Payment Events (dynamic table)
            pagamento_eventos: (() => {
                const evts = [];
                document.querySelectorAll('#pagamento-eventos-body .pagamento-evento-row').forEach(row => {
                    const perc = row.querySelector('input[name^="pgto_evento_percentual_"]');
                    const desc = row.querySelector('input[name^="pgto_evento_descricao_"]');
                    evts.push({ percentual: perc?.value || '', descricao: desc?.value || '' });
                });
                return evts;
            })(),
            pgto_evento: (() => { const e = document.querySelectorAll('#pagamento-eventos-body .pagamento-evento-row'); return e.length > 0 ? '1° EVENTO DE PAGAMENTO' : (formData.get('pgto_evento') || ''); })(),
            pgto_parcela: (() => { const p = document.querySelector('#pagamento-eventos-body .pagamento-evento-row input[name^="pgto_evento_percentual_"]'); return p?.value || (formData.get('pgto_parcela') || ''); })(),
            pgto_fat: (() => { const d = document.querySelector('#pagamento-eventos-body .pagamento-evento-row input[name^="pgto_evento_descricao_"]'); return d?.value || (formData.get('pgto_fat') || ''); })(),
            faturamento_ncm: formData.get('faturamento_ncm') === 'Outro'
                ? (formData.get('faturamento_ncm_outro') || '')
                : (formData.get('faturamento_ncm') || ''),
            prazo_entrega: formData.get('prazo_entrega'),
            validade: formData.get('validade'),
            data_base: formData.get('data_base'),
            despesas: formData.get('despesas'),
            transporte: formData.get('transporte'),

            // Signatures
            sig1_nome: formData.get('sig1_nome'), sig1_cargo: formData.get('sig1_cargo'), sig1_tel: formData.get('sig1_tel'), sig1_cel: formData.get('sig1_cel'), sig1_email: formData.get('sig1_email'),
            sig2_nome: formData.get('sig2_nome'), sig2_cargo: formData.get('sig2_cargo'), sig2_tel: formData.get('sig2_tel'), sig2_cel: formData.get('sig2_cel'), sig2_email: formData.get('sig2_email'),
            sig3_nome: formData.get('sig3_nome'), sig3_cargo: formData.get('sig3_cargo'), sig3_tel: formData.get('sig3_tel'), sig3_cel: formData.get('sig3_cel'), sig3_email: formData.get('sig3_email'),

            condicoes: formData.get('condicoes'),
            revisions: revisions,
            logo_base64: document.getElementById('calc_logo_base64') ? document.getElementById('calc_logo_base64').value : '',
            client_logo_base64: document.getElementById('client_logo_base64') ? document.getElementById('client_logo_base64').value : '',
            watermark_base64: document.getElementById('calc_watermark_base64') ? document.getElementById('calc_watermark_base64').value : '',
            updatedAt: new Date().toISOString()
        };

        if (!proposta.cliente) {
            alert("ERRO DE VALIDAÇÃO: Você precisa selecionar um Cliente na lista suspensa antes de Salvar a Proposta!");
            const selectEl = document.querySelector('#form-proposta-comercial select[name="cliente"]');
            if (selectEl) {
                selectEl.style.border = '2px solid red';
                selectEl.focus();
            }
            return;
        }

        if (id) {
            store.updatePropostaComercial(id, proposta);
            window.app.toast("Proposta atualizada com sucesso!", "success");
        } else {
            store.addPropostaComercial(proposta);
            window.app.toast("Proposta criada com sucesso!", "success");
        }

        const pipelinePtc = proposta.ptc_folder || (window.app.currentPtc && window.app.currentPtc.folder);
        if (pipelinePtc && window.app._ensurePipelineItemForPtc) {
            const valorTotal = (proposta.itens || []).reduce((s, item) => {
                const q = parseFloat(item.qtd) || 0;
                const p = parseFloat(item.price) || 0;
                return s + (q * p);
            }, 0);
            const ok = window.app._ensurePipelineItemForPtc(pipelinePtc, proposta.cliente, proposta.projeto, valorTotal);
            if (!ok) {
                window.app.toast('Proposta salva, mas o pipeline não foi alterado (cartão está Fechado/Perdido).', 'info');
            }
        }

        // Save to Server (Versioning)
        const currentPtc = window.app.currentPtc;
        if (currentPtc && currentPtc.folder) {
            console.log('Salvando Proposta Comercial no servidor...', currentPtc.folder);
            const _tkPC1335 = store.getState().auth?.token;
            fetch('/api/save-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(_tkPC1335 ? { 'Authorization': 'Bearer ' + _tkPC1335 } : {}) },
                body: JSON.stringify({
                    ptcFolder: currentPtc.folder,
                    type: 'comercial', // 'tecnica' or 'comercial'
                    content: proposta,
                    revisionFolder: currentPtc.revision
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        window.app.toast(`Salvo no servidor: ${data.filename}`, 'success');

                        // Update persistence state
                        store.setState({ activeCommercialProposal: proposta });

                        // Sync vendedor to pipeline item
                        const syncPtc = window.app.currentPtc;
                        if (syncPtc && syncPtc.folder && proposta.vendedor) {
                            const state = store.getState();
                            const pitems = state.pipelineItems || [];
                            const pi = pitems.find(i => i.origemId === syncPtc.folder);
                            if (pi) {
                                const idx = pitems.indexOf(pi);
                                const updated = { ...pi, vendedor: proposta.vendedor, updatedAt: new Date().toISOString() };
                                pitems[idx] = updated;
                                store.setState({ pipelineItems: [...pitems] });
                                store._syncUpdate('pipelineItems', pi.id, { vendedor: proposta.vendedor, updatedAt: updated.updatedAt });
                            }
                        }

                        // Refresh global list from filesystem
                        if (window.app && window.app.syncProposals) {
                            window.app.syncProposals();
                        }

                        // Auto-Generate background DOC file so lay users only interact with the Word Doc
                        if (typeof this.exportToWord === 'function') {
                            this.exportToWord(true); // true = skipDownload, just stream to disk via API
                        }
                    } else {
                        window.app.toast('Erro ao salvar no servidor: ' + data.error, 'error');
                    }
                })
                .catch(err => {
                    console.error('Erro ao salvar proposta:', err);
                    window.app.toast('Erro de conexão ao salvar no servidor.', 'error');
                });
        }
    },

    async saveAsNew() {

        try {
            const form = document.getElementById('form-proposta-comercial');
            if (!form) { window.app.toast('Formulário não encontrado.', 'warning'); return; }
            const formData = new FormData(form);

            const finalClient = formData.get('cliente');
            const proposta = {
                id: undefined,
                cliente: finalClient,
                projeto: formData.get('projeto') || '',
                referencia: formData.get('referencia') || '',
                codigo: formData.get('codigo'),
                aos_cuidados: formData.get('aos_cuidados'),
                data_emissao: formData.get('data_emissao'),
                objeto: formData.get('objeto'),
                cidade: formData.get('cidade') || '',
                uf: formData.get('uf') || '',
                localizacao: formData.get('localizacao') || [formData.get('cidade') || '', formData.get('uf') || ''].filter(Boolean).join('/')
            };

            this._openSaveAsModal(proposta);
        } catch (e) {
            console.error('[saveAsNew] Error:', e);
            window.app.toast('Erro: ' + e.message, 'error');
        }
    },

    _openSaveAsModal(sourceData) {
        if (document.getElementById('modal-save-as-comercial')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-save-as-comercial';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 480px;">
                <div class="modal-header" style="background: var(--color-accent); color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-copy"></i> Salvar como Nova Proposta
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
                        Uma cópia da proposta atual será salva em uma nova PTC.
                    </p>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="font-weight: 600; font-size: 13px; margin-bottom: 8px; display: block;">PTC de destino:</label>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <label style="flex: 1; padding: 8px 12px; border: 2px solid var(--color-accent); border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px; background: #f0fdf4;">
                                <input type="radio" name="sas-com-ptc-option" value="new-dual" checked onchange="document.getElementById('sas-com-ptc-new-fields').style.display='block'; document.getElementById('sas-com-ptc-existing-fields').style.display='none';">
                                Criar nova PTC (2 arquivos PT + PC)
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="sas-com-ptc-option" value="new-single" onchange="document.getElementById('sas-com-ptc-new-fields').style.display='block'; document.getElementById('sas-com-ptc-existing-fields').style.display='none';">
                                Criar nova PTC (arquivo \u00fanico)
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="sas-com-ptc-option" value="existing" onchange="document.getElementById('sas-com-ptc-new-fields').style.display='none'; document.getElementById('sas-com-ptc-existing-fields').style.display='block'; app.propostaComercial.loadPtcListSas();">
                                PTC existente
                            </label>
                        </div>
                        <div id="sas-com-ptc-new-fields">
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="sas-com-ptc-number" class="form-control" value="${window.app.generateDvtNumber ? window.app.generateDvtNumber() : 'PTC-' + new Date().getFullYear() + '-XXXX'}" style="flex: 1; font-weight: 700;">
                                <input type="text" id="sas-com-ptc-title" class="form-control" placeholder="Título do Projeto" value="${this._escapeHtml(sourceData.projeto || '')}" style="flex: 2;">
                            </div>
                        </div>
                        <div id="sas-com-ptc-existing-fields" style="display: none;">
                            <select id="sas-com-ptc-select" class="form-control">
                                <option value="">Carregando PTCs...</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Cliente</label>
                            <input type="text" id="sas-com-cliente" class="form-control" value="${this._escapeHtml(sourceData.cliente || '')}">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Projeto</label>
                            <input type="text" id="sas-com-projeto" class="form-control" value="${this._escapeHtml(sourceData.projeto || '')}">
                        </div>
                    </div>
                    <div id="sas-com-status" style="font-size: 13px; color: #64748b; margin-top: 12px;"></div>
                </div>
                <div class="modal-footer" style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn btn-cancel" onclick="document.getElementById('modal-save-as-comercial').remove()">Cancelar</button>
                    <button class="btn btn-primary" id="sas-com-btn-confirmar" style="background: var(--color-accent); display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-copy"></i> Salvar como Nova
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._sourceData = sourceData;

        document.getElementById('sas-com-btn-confirmar').addEventListener('click', () => {
            this._confirmSaveAs(modal);
        });
    },

    loadPtcListSas() {
        const select = document.getElementById('sas-com-ptc-select');
        if (!select) return;
        const _tkPC1495 = store.getState().auth?.token;
        fetch('/api/list-ptcs', { headers: { ...(_tkPC1495 ? { 'Authorization': 'Bearer ' + _tkPC1495 } : {}) } })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.dvts) {
                    select.innerHTML = '<option value="">Selecione uma PTC...</option>'
                        + data.dvts.map(d => `<option value="${d}">${d}</option>`).join('');
                } else {
                    select.innerHTML = '<option value="">Nenhuma PTC encontrada</option>';
                }
            })
            .catch(() => { select.innerHTML = '<option value="">Erro ao carregar</option>'; });
    },

    async _confirmSaveAs(modal) {
        const statusEl = document.getElementById('sas-com-status');
        const btnConfirmar = document.getElementById('sas-com-btn-confirmar');
        const sourceData = modal._sourceData;
        if (!sourceData) return;

        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="ph ph-spinner" style="animation: spin 1s linear infinite;"></i> Salvando...';
        statusEl.textContent = 'Preparando...';

            try {
                const option = document.querySelector('input[name="sas-com-ptc-option"]:checked')?.value;
                const isDual = option === 'new-dual';
                const isNewPtc = option === 'new-dual' || option === 'new-single';
                let targetFolder = '';

                if (isNewPtc) {
                    statusEl.textContent = 'Criando nova PTC...';
                    const ptcNumber = document.getElementById('sas-com-ptc-number')?.value || '';
                    const ptcTitle = document.getElementById('sas-com-ptc-title')?.value || '';
                    const clientName = document.getElementById('sas-com-cliente')?.value || '';
                    if (!ptcTitle) {
                        window.app.toast('Informe o título do projeto.', 'warning');
                        btnConfirmar.disabled = false;
                        btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                        statusEl.textContent = '';
                        return;
                    }
                    targetFolder = await window.app.createPtcSimple(ptcNumber, ptcTitle, clientName);
                } else {
                    targetFolder = document.getElementById('sas-com-ptc-select')?.value;
                    if (!targetFolder) {
                        window.app.toast('Selecione um PTC existente.', 'warning');
                        btnConfirmar.disabled = false;
                        btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                        statusEl.textContent = '';
                        return;
                    }
                }

                const options = {
                    cliente: document.getElementById('sas-com-cliente')?.value || undefined,
                    projeto: document.getElementById('sas-com-projeto')?.value || undefined
                };

                if (isDual) {
                    statusEl.textContent = 'Salvando Proposta Comercial...';
                    await window.app.duplicateProposal('comercial', sourceData, targetFolder, options);
                    statusEl.textContent = 'Salvando Proposta T\u00e9cnica...';
                    const techData = store.getState().activeTechnicalProposal;
                    if (techData) {
                        await window.app.duplicateProposal('tecnica', techData, targetFolder, options);
                    } else {
                        const now = new Date().toISOString();
                        const empty = {
                            id: crypto.randomUUID(),
                            cliente: options?.cliente || '',
                            projeto: options?.projeto || '',
                            codigo: 'PT-' + Date.now().toString(36).toUpperCase(),
                            objeto: '',
                            status: 'Rascunho',
                            data_emissao: now.split('T')[0],
                            createdAt: now,
                            updatedAt: now,
                            ptc_folder: targetFolder,
                            revisions: []
                        };
                        const _tkPC1575 = store.getState().auth?.token;
                        const res = await fetch('/api/save-proposal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...(_tkPC1575 ? { 'Authorization': 'Bearer ' + _tkPC1575 } : {}) },
                            body: JSON.stringify({ ptcFolder: targetFolder, type: 'tecnica', content: empty, revisionFolder: '0' })
                        });
                        const r = await res.json();
                        if (!r.success) throw new Error(r.error || 'Erro ao criar Proposta T\u00e9cnica vazia');
                    }
                    window.app._ensurePipelineItemForPtc(targetFolder, options?.cliente || sourceData?.cliente || '', options?.projeto || sourceData?.projeto || '', 0, '', 'separado');
                } else {
                    statusEl.textContent = 'Salvando cópia...';
                    await window.app.duplicateProposal('comercial', sourceData, targetFolder, options);
                }

                modal.remove();
                window.app.toast(`Proposta Salva com o N\u00famero ${targetFolder}. Favor ir em "Buscar PTC" e abrir a Proposta.`, 'info');
        } catch (e) {
            console.error('[saveAsNew]', e);
            window.app.toast('Erro: ' + e.message, 'error');
            statusEl.textContent = 'Erro: ' + e.message;
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
        }
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    async exportToWord(skipDownload = false) {

        if (store.getState().proposalReadOnly) {
            window.app.toast('Exportação bloqueada para propostas Fechadas/Perdidas.', 'warning', 0);
            return;
        }

        console.log("[PropostaComercial] Exporting to Word using template...");

        // CRITICAL PATCH for ImageModule Compatibility
        try {
            const proto = (typeof Element !== 'undefined' ? Element.prototype : Node.prototype);
            const desc = Object.getOwnPropertyDescriptor(proto, 'namespaceURI');
            if (desc && !desc.set) {
                Object.defineProperty(proto, 'namespaceURI', {
                    get: function() { 
                        return this._nsURI !== undefined ? this._nsURI : (desc.get ? desc.get.call(this) : null); 
                    },
                    set: function(v) { this._nsURI = v; },
                    configurable: true
                });
            }
        } catch (e) { console.error("Patch error:", e); }
        
        // Libraries
        const DocxLib = window.Docxtemplater || window.docxtemplater;
        const ZipLib = window.PizZip || window.pizzip || (window.Docxtemplater ? window.Docxtemplater.PizZip : null);
        const ImageModule = window.ImageModule;

        if (!DocxLib || !ZipLib) {
            alert("Erro: Bibliotecas de exportação (docxtemplater/PizZip) não carregadas.");
            return;
        }

        const form = document.getElementById('form-proposta-comercial');
        if (!form) return;

        const formData = new FormData(form);

        // Helper Base64 to Buffer
        const base64ToBuffer = (data) => {
            if (!data) return null;
            const base64String = data.split(',')[1] || data;
            try {
                const binaryString = window.atob(base64String);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            } catch (e) {
                console.error("Error decoding base64:", e);
                return null;
            }
        };

        // Prepare Data
        const cliente = formData.get('cliente') || '';
        const aosCuidados = formData.get('aos_cuidados') || '';
        
        // Find client contact details from store
        let clientEmail = '';
        let clientPhone = '';
        let clientData = null;
        if (store && store.getState) {
            const state = store.getState();
            const slug = (s) => (s || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
            const targetSlug = slug(cliente);
            
            clientData = state.clientes?.find(c => slug(c.razaoSocial) === targetSlug);
            
            if (clientData) {
                const searchNameSlug = slug((aosCuidados || '').split(' (')[0]);
                // Find in contatos array
                let contact = (Array.isArray(clientData.contatos) ? clientData.contatos : []).find(c => slug(c.nome) === searchNameSlug);
                
                // Fallback to legacy fields if not in array
                if (contact) {
                    clientEmail = contact.email || '';
                    clientPhone = contact.telefone || contact.celular || '';
                } else if (slug(clientData.contatoNome) === searchNameSlug) {
                    clientEmail = clientData.email || '';
                    clientPhone = clientData.telefone || '';
                }
                
                if (clientEmail || clientPhone) {
                    console.log("[PropostaComercial] Contact details found:", { clientEmail, clientPhone });
                }
            }
        }

        const _isAUTPRO = store.getState().company?.folderName?.startsWith('AUT_');
        const _ptcFolderPC = String(window.app.currentPtc?.folder || '');
        const _ptcMatchPC = _ptcFolderPC.match(/^(\d{8,10})/);
        const _ptcNumberPC = _ptcMatchPC ? _ptcMatchPC[1] : (window.app.currentPtcInfo?.ptcNumber || '00000000');
        const _revPCVal = window.app.currentPtc?.revision || '00';
        const _revStrPC = _revPCVal && _revPCVal !== '0' ? String(_revPCVal).replace(/[^0-9]/g, '') : '00';

        const templateData = {
            ptc_number: _isAUTPRO ? `PC-${_ptcNumberPC}-Rev${_revStrPC}` : `${_ptcNumberPC}-PC-Rev${_revStrPC}`,
            cliente: cliente,
            razao_social: clientData?.razaoSocial || '',
            nome_fantasia: clientData?.nomeFantasia || '',
            cnpj: clientData?.cnpj || '',
            inscricao_estadual: clientData?.inscricaoEstadual || '',
            inscricao_municipal: clientData?.inscricaoMunicipal || '',
            logradouro: clientData?.logradouro || '',
            numero: clientData?.numero || '',
            bairro: clientData?.bairro || '',
            cidade: clientData?.cidade || '',
            estado: clientData?.estado || '',
            cep: clientData?.cep || '',
            segmento: clientData?.segmento || '',
            cnae: clientData?.cnae || '',
            observacoes: clientData?.observacoes || '',
            contato_nome: (clientData?.contatos?.[0]?.nome) || clientData?.contatoNome || '',
            contato_cargo: (clientData?.contatos?.[0]?.cargo) || clientData?.contatoCargo || '',
            contato_email: (clientData?.contatos?.[0]?.email) || clientData?.email || '',
            contato_telefone: (clientData?.contatos?.[0]?.telefone) || clientData?.telefone || '',
            projeto: formData.get('projeto') || '',
            referencia: formData.get('referencia') || '',
            codigo: formData.get('codigo') || '',
            data_emissao: formData.get('data_emissao') ? new Date(formData.get('data_emissao')).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
            aos_cuidados: aosCuidados,
            contato: aosCuidados,
            // Varias formas de tag para garantir compatibilidade com o template
            'E-mail': clientEmail,
            'Email': clientEmail,
            'email': clientEmail,
            'E_mail': clientEmail,
            'telefone': clientPhone,
            'Telefone': clientPhone,
            'fone': clientPhone,
            'celular': clientPhone,
            'TEL': clientPhone,
            objeto: formData.get('objeto') || '',
            cidade: formData.get('cidade') || '',
            uf: formData.get('uf') || '',
            localizacao: formData.get('localizacao') || [formData.get('cidade') || '', formData.get('uf') || ''].filter(Boolean).join('/') || '',
            engenheiro_responsavel: formData.get('engenheiroResponsavel') || '',
            impostos_texto: formData.get('impostos_texto') || '',
            ipi_texto: formData.get('ipi_texto') || '',
            pagamento_eventos: (() => {
                const domRows = document.querySelectorAll('#pagamento-eventos-body .pagamento-evento-row');
                if (domRows.length) {
                    return Array.from(domRows).map(row => ({
                        percentual: row.querySelector('input[name^="pgto_evento_percentual_"]')?.value || '',
                        descricao: row.querySelector('input[name^="pgto_evento_descricao_"]')?.value || ''
                    }));
                }
                return this._proposalData?.pagamento_eventos || store.getState().activeCommercialProposal?.pagamento_eventos || [];
            })(),
            pgto_evento: (() => {
                const v = formData.get('pgto_evento');
                if (v) return v;
                const evts = this._proposalData?.pagamento_eventos || store.getState().activeCommercialProposal?.pagamento_eventos || [];
                return evts.length > 0 ? '1° EVENTO DE PAGAMENTO' : '';
            })(),
            pgto_parcela: (() => {
                const v = formData.get('pgto_parcela');
                if (v) return v;
                const evts = this._proposalData?.pagamento_eventos || store.getState().activeCommercialProposal?.pagamento_eventos || [];
                return evts[0]?.percentual || '';
            })(),
            pgto_fat: (() => {
                const v = formData.get('pgto_fat');
                if (v) return v;
                const evts = this._proposalData?.pagamento_eventos || store.getState().activeCommercialProposal?.pagamento_eventos || [];
                return evts[0]?.descricao || '';
            })(),
            faturamento_ncm: formData.get('faturamento_ncm') || '',
            prazo_entrega: formData.get('prazo_entrega') || '',
            validade: formData.get('validade') || '',
            data_base: formData.get('data_base') || '',
            despesas: formData.get('despesas') || '',
            transporte: formData.get('transporte') || '',
            condicoes: formData.get('condicoes') || '',
            
            // Signatures (ativas)
            sig1_nome: (formData.get('sig1_active') !== 'off') ? (formData.get('sig1_nome') || '') : '',
            sig1_cargo: (formData.get('sig1_active') !== 'off') ? (formData.get('sig1_cargo') || '') : '',
            sig1_tel: (formData.get('sig1_active') !== 'off') ? (formData.get('sig1_tel') || '') : '',
            sig1_cel: (formData.get('sig1_active') !== 'off') ? (formData.get('sig1_cel') || '') : '',
            sig1_email: (formData.get('sig1_active') !== 'off') ? (formData.get('sig1_email') || '') : '',
            sig2_nome: (formData.get('sig2_active') !== 'off') ? (formData.get('sig2_nome') || '') : '',
            sig2_cargo: (formData.get('sig2_active') !== 'off') ? (formData.get('sig2_cargo') || '') : '',
            sig2_tel: (formData.get('sig2_active') !== 'off') ? (formData.get('sig2_tel') || '') : '',
            sig2_cel: (formData.get('sig2_active') !== 'off') ? (formData.get('sig2_cel') || '') : '',
            sig2_email: (formData.get('sig2_active') !== 'off') ? (formData.get('sig2_email') || '') : '',
            sig3_nome: (formData.get('sig3_active') !== 'off') ? (formData.get('sig3_nome') || '') : '',
            sig3_cargo: (formData.get('sig3_active') !== 'off') ? (formData.get('sig3_cargo') || '') : '',
            sig3_tel: (formData.get('sig3_active') !== 'off') ? (formData.get('sig3_tel') || '') : '',
            sig3_cel: (formData.get('sig3_active') !== 'off') ? (formData.get('sig3_cel') || '') : '',
            sig3_email: (formData.get('sig3_active') !== 'off') ? (formData.get('sig3_email') || '') : '',

            // Revisions
            revisao: (() => {
                const revs = this._proposalData?.revisions || store.getState().activeCommercialProposal?.revisions || [];
                return revs.length > 0 ? revs[revs.length - 1].no : '00';
            })(),
            revisoes: (() => {
                const revs = this._proposalData?.revisions || store.getState().activeCommercialProposal?.revisions || [];
                return revs.map(r => ({
                    no: r.no || '', desc: r.desc || '', elab: r.elab || '',
                    verif: r.verif || '', aprov: r.aprov || '', data: r.data || ''
                }));
            })()
        };

        console.log("[PropostaComercial] Final Template Data:", templateData);

        // Loops
        templateData.supply_items = [];
        document.querySelectorAll('#supply-items-container textarea').forEach((textarea, idx) => {
            if (textarea.value.trim()) {
                templateData.supply_items.push({ 
                    text: textarea.value.trim(),
                    index: idx + 1
                });
            }
        });

        templateData.investment_items = [];
        let totalInvestment = 0;
        document.querySelectorAll('#investment-items-body tr').forEach((row, idx) => {
            const qtd = parseFloat(row.querySelector('input[name^="item_qtd_"]')?.value || 0);
            const desc = row.querySelector('input[name^="item_desc_"]')?.value || '';
            const ipi = row.querySelector('input[name^="item_ipi_"]')?.value || '0';
            const priceRaw = row.querySelector('input[name^="item_price_"]')?.value || '0,00';
            const price = parseFloat(priceRaw.replace(/\./g, '').replace(',', '.')) || 0;
            const subtotal = qtd * price;
            const direto = row.querySelector('input[name^="item_direto_"]')?.checked ? '(Faturamento Direto)' : '';
            
            if (desc) {
                templateData.investment_items.push({
                    index: idx + 1,
                    qtd,
                    desc,
                    ipi,
                    price: priceRaw,
                    subtotal: subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                    direto
                });
                totalInvestment += subtotal;
            }
        });
        templateData.total_investment = totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        // Pricing Results
        const domSemIpi = document.getElementById('res_preco_final_s_ipi');
        const domComIpi = document.getElementById('res_preco_final_c_ipi');
        const domValIpi = document.getElementById('res_valor_ipi');
        
        templateData.res_preco_final_s_ipi = domSemIpi ? domSemIpi.innerText : templateData.total_investment;
        templateData.res_preco_final_c_ipi = domComIpi ? domComIpi.innerText : "";
        templateData.res_valor_ipi = domValIpi ? domValIpi.innerText : "";

        // Images
        const logoBase64 = document.getElementById('calc_logo_base64')?.value;
        const clientLogoBase64 = document.getElementById('client_logo_base64')?.value;
        const watermarkBase64 = document.getElementById('calc_watermark_base64')?.value;

        templateData.logo_img = logoBase64;
        templateData.client_logo_img = clientLogoBase64;
        templateData.watermark_img = watermarkBase64;

        try {
            const company = store.getState().company || {};
            const auth = store.getState().auth || {};
            const empresaId = auth.user?.empresa_id || 'default';
            const templateFile = company.templateComercial || 'TEMPLATE_COM.docx';
            const folderName = company.folderName || empresaId;
            const templateUri = 'templates/' + folderName + '/' + templateFile + '?v=' + Date.now();
            const response = await fetch(templateUri);
            if (!response.ok) throw new Error('Template ' + templateFile + ' não encontrado.');
            const arrayBuffer = await response.arrayBuffer();

            const zip = new ZipLib(arrayBuffer);
            
            let modules = [];
            if (ImageModule) {
                const imageOpts = {
                    centered: false,
                    getImage(tagValue) {
                        const TINI_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                        if (!tagValue || typeof tagValue !== 'string' || !tagValue.includes('base64')) {
                            return base64ToBuffer(TINI_PNG);
                        }
                        return base64ToBuffer(tagValue) || base64ToBuffer(TINI_PNG);
                    },
                    getSize(img, tagValue, tagName) {
                        const name = tagName.toLowerCase();
                        if (name.includes('client_logo')) return [378, 150]; // Aprox 10cm de largura
                        if (name.includes('logo')) return [150, 60];
                        if (name.includes('watermark')) return [600, 600];
                        return [100, 100];
                    }
                };
                modules.push(new ImageModule(imageOpts));
            }

            const doc = new DocxLib(zip, {
                paragraphLoop: true,
                linebreaks: true,
                modules: modules,
                nullGetter: () => ""
            });

            // Case-insensitive support
            const finalData = {};
            for (let key in templateData) {
                finalData[key] = templateData[key];
                finalData[key.toUpperCase()] = templateData[key];
            }

            doc.setData(finalData);
            doc.render();

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            const ptcFolder = String(window.app.currentPtc?.folder || '');
            const ptcMatch = ptcFolder.match(/^(\d{8,10})/);
            const ptcNumber = ptcMatch ? ptcMatch[1] : (window.app.currentPtcInfo?.ptcNumber || '00000000');
            const rev = window.app.currentPtc?.revision;
            const revStr = rev && rev !== '0' ? rev.replace(/[^0-9]/g, '') : '00';
            const filename = _isAUTPRO ? `PC-${ptcNumber}-Rev${revStr}.docx` : `${ptcNumber}-PC-Rev${revStr}.docx`;

            if (!skipDownload) {
                const url = window.URL.createObjectURL(out);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            }

            // Server Save Backup
            const currentPtc = window.app.currentPtc;
            if (currentPtc && currentPtc.folder) {
                const _tkPC1947 = store.getState().auth?.token;
                const reader = new FileReader();
                reader.onloadend = function() {
                    const base64data = reader.result.split(',')[1];
                    fetch('/api/save-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(_tkPC1947 ? { 'Authorization': 'Bearer ' + _tkPC1947 } : {}) },
                        body: JSON.stringify({
                            ptcFolder: currentPtc.folder,
                            filename: filename,
                            content: base64data,
                            isBase64: true,
                            revisionFolder: currentPtc.revision
                        })
                    })
                    .then(res => res.json())
                    .catch(err => console.error('Error saving to server:', err));
                };
                reader.readAsDataURL(out);
            }

            window.app.toast("Proposta DOCX gerada com sucesso!", "success");

        } catch (error) {
            alert("Erro ao gerar Word: " + error.message);
        }
    },

    addSupplyRow() {
        const container = document.getElementById('supply-items-container');
        if (!container) return;
        const index = Date.now();
        const html = `
            <div class="supply-row" style="display: flex; gap: 8px; align-items: flex-start;">
                <textarea name="supply_item_${index}" class="form-control" rows="2" placeholder="Descreva o item do fornecimento..."></textarea>
                <button type="button" onclick="this.closest('.supply-row').remove()" class="btn-icon" style="color: red; margin-top: 8px;"><i class="ph ph-trash"></i></button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    addItemRow() {
        const tbody = document.getElementById('investment-items-body');
        if (!tbody) return;
        const index = Date.now(); // Unique ID for name
        const html = `
            <tr>
                <td style="padding: 5px;"><input type="number" name="item_qtd_${index}" class="form-control" value="1" style="width: 60px;"></td>
                <td style="padding: 5px;"><input type="text" name="item_desc_${index}" class="form-control" placeholder="Descrição"></td>
                <td style="padding: 5px;"><input type="number" name="item_ipi_${index}" class="form-control" value="0" style="width: 70px;"></td>
                <td style="padding: 5px;"><input type="text" name="item_price_${index}" class="form-control" value="0,00" onblur="this.value = app.formatCurrencyRaw(app.parseCurrency(this.value))"></td>
                <td style="padding: 5px; text-align: center;"><input type="checkbox" name="item_direto_${index}" title="Faturamento Direto"></td>
                <td style="padding: 5px;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: red;"><i class="ph ph-trash"></i></button></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', html);
    },

    addRevisionRow() {
        const body = document.getElementById('pc-revisions-body');
        if (!body) return;
        const index = body.querySelectorAll('.revision-row').length;
        const row = document.createElement('tr');
        row.className = 'revision-row';
        row.style.borderBottom = '1px solid #f1f5f9';
        row.innerHTML = `
            <td style="padding: 8px;"><input type="text" name="rev_no_${index}" class="form-control" value="${String(index).padStart(2, '0')}" style="text-align: center; padding: 10px 4px;"></td>
            <td style="padding: 8px;"><input type="text" name="rev_desc_${index}" class="form-control"></td>
            <td style="padding: 8px;"><select name="rev_elab_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaComercialModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>
            <td style="padding: 8px;"><select name="rev_verif_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaComercialModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>
            <td style="padding: 8px;"><select name="rev_aprov_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaComercialModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>
            <td style="padding: 8px;"><input type="date" name="rev_data_${index}" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="text-align: center; padding: 10px 8px;"></td>
            <td style="padding: 8px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>
        `;
        body.appendChild(row);
    },

    addPagamentoEventoRow() {
        const body = document.getElementById('pagamento-eventos-body');
        if (!body) return;
        const index = body.querySelectorAll('.pagamento-evento-row').length;
        const row = document.createElement('tr');
        row.className = 'pagamento-evento-row';
        row.style.borderBottom = '1px solid #f1f5f9';
        row.innerHTML = `
            <td style="padding:8px;font-weight:600;white-space:nowrap;">${index+1}° EVENTO DE PAGAMENTO</td>
            <td style="padding:8px;"><input type="text" name="pgto_evento_percentual_${index}" class="form-control" placeholder="%" style="width:100px;"></td>
            <td style="padding:8px;"><input type="text" name="pgto_evento_descricao_${index}" class="form-control" placeholder="Descrição"></td>
            <td style="padding:8px;text-align:center;"><button type="button" onclick="if(this.closest('tbody').querySelectorAll('.pagamento-evento-row').length>1)this.closest('tr').remove()" class="btn-icon" style="color:#ef4444;" title="Remover"><i class="ph ph-trash"></i></button></td>
        `;
        body.appendChild(row);
    },

    formatCurrency(value) {
        if (!value) return '0,00';
        // Lógica de máscara: pega apenas dígitos, divide por 100 e formata
        const cleanValue = value.replace(/\D/g, '');
        const numericValue = (parseInt(cleanValue) || 0) / 100;
        return app.formatCurrencyRaw(numericValue);
    },

    handleLogoUpload(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            // element not present in HTML, preventing crash
            // document.getElementById('calc_logo_filename').textContent = file.name;
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('calc_logo_preview');
                const container = document.getElementById('calc_logo_preview_container');
                const hiddenParams = document.getElementById('calc_logo_base64');
                if (preview) preview.src = e.target.result;
                if (container) container.style.display = 'block';
                if (hiddenParams) hiddenParams.value = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    },

    handleClientLogoUpload(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('client_logo_preview');
                const container = document.getElementById('client_logo_preview_container');
                const hiddenParams = document.getElementById('client_logo_base64');
                if (preview) preview.src = e.target.result;
                if (container) container.style.display = 'block';
                if (hiddenParams) hiddenParams.value = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    },

    removeClientLogo() {
        const preview = document.getElementById('client_logo_preview');
        const container = document.getElementById('client_logo_preview_container');
        const hidden = document.getElementById('client_logo_base64');
        if (preview) preview.src = '';
        if (container) container.style.display = 'none';
        if (hidden) hidden.value = '';
    },

    handleWatermarkUpload(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            // element not present in HTML, preventing crash
            // document.getElementById('calc_watermark_filename').textContent = file.name;
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('calc_watermark_preview');
                const container = document.getElementById('calc_watermark_preview_container');
                const hiddenParams = document.getElementById('calc_watermark_base64');
                if (preview) preview.src = e.target.result;
                if (container) container.style.display = 'block';
                if (hiddenParams) hiddenParams.value = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    },

    toggleOther(name, show) {
        // Not used currently in commercial but kept for compatibility if we add radios
    },



    async _loadFromPtc(ptcFolder, revisionFolder) {
        if (this._loading) return;
        this._loading = true;
        try {
            const _tkPCL = store.getState().auth?.token;
            const _hPCL = _tkPCL ? { 'Authorization': 'Bearer ' + _tkPCL } : {};
            const res = await fetch(`/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=PropostaComercial.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hPCL });
            const data = await res.json();
            if (data && !data.error && Object.keys(data).length > 0) {
                if (!data.cliente && window.app.currentPtc?.client) {
                    data.cliente = window.app.currentPtc.client;
                }
                if (!data.ptc_folder) data.ptc_folder = ptcFolder;
                this.viewMode = 'form';
                this._forcedList = false;
                store.setState({ activeCommercialProposal: data });
                this.renderModal(data);
            } else {
                this._createFromPtc();
            }
        } catch (err) {
            console.warn('[PropostaComercial] Error auto-loading from PTC:', err);
            this._createFromPtc();
        } finally {
            this._loading = false;
        }
    },

    _createFromPtc() {
        console.log('[PC._createFromPtc] ptc?.client:', window.app.currentPtc?.client);
        const ptc = window.app.currentPtc;
        const ptcFolder = String(window.app.currentPtc?.folder || '');
        const newMatch = ptcFolder.match(/^(\d{8,10})/);
        const oldMatch = ptcFolder.match(/PTC-\d{4}-\d+/i);
        const basePtc = newMatch ? newMatch[1] : (oldMatch ? oldMatch[0].toUpperCase() : (window.app.currentPtcInfo?.ptcNumber || ''));
        const newData = {
            cliente: ptc?.client || '',
            projeto: ptc?.title || '',
            objeto: ptc?.type || 'PAINEL ELÉTRICO DE BAIXA TENSÃO',
            ptc_folder: ptc?.folder || '',
            codigo: basePtc ? `${basePtc}-PC_Rev00` : '',
            vendedor: ptc?.vendedor || ''
        };
        this.viewMode = 'form';
        this._forcedList = false;
        store.setState({ activeCommercialProposal: newData });
        this.renderModal(newData);
    },

    closeModal() {
        this.viewMode = 'list';
        this._forcedList = true;
        store.setState({ activeCommercialProposal: null, proposalReadOnly: false });
        this.render();
    },

    _applyReadOnly(container) {
        container.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (el.type !== 'hidden') el.disabled = true;
        });
        container.querySelectorAll('.btn-save-as-new').forEach(el => el.disabled = false);
        container.querySelectorAll('.pc-tab-btn').forEach(el => el.disabled = false);
        container.querySelectorAll('.btn-export-word').forEach(el => el.disabled = false);
        container.querySelectorAll('[onclick*="closeModal"], [onclick*="showListModal"]').forEach(el => el.disabled = false);
        const banner = document.createElement('div');
        banner.style.cssText = 'padding:10px 16px;background:#ef4444;color:#fff;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;';
        banner.innerHTML = '<i class="ph ph-lock-simple" style="font-size:18px;"></i> SOMENTE LEITURA — Esta proposta está Fechada/Perdida no Pipeline. Nenhuma alteração pode ser salva.';
        const header = container.querySelector('.module-header-sticky');
        if (header) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            container.insertBefore(banner, container.firstChild);
        }
    },

    edit(id) {
        const proposta = store.getState().propostasComerciais.find(p => p.id === id);
        if (proposta) {
            // Migração: se tem localizacao mas não tem cidade/uf, parsear
            if (!proposta.cidade && !proposta.uf && proposta.localizacao) {
                const loc = proposta.localizacao;
                let sep = loc.includes('/') ? '/' : loc.includes('-') ? '-' : null;
                if (sep) {
                    const parts = loc.split(sep);
                    if (parts.length >= 2) {
                        proposta.cidade = parts.slice(0, -1).join(sep).trim();
                        proposta.uf = parts[parts.length - 1].trim().toUpperCase();
                    }
                }
            }
            this.viewMode = 'form';
            store.setState({ activeCommercialProposal: proposta });
            this.render();
            this.renderModal(proposta);
            setTimeout(() => {
                if (proposta.logo_base64) {
                    const preview = document.getElementById('calc_logo_preview');
                    const container = document.getElementById('calc_logo_preview_container');
                    const hiddenParams = document.getElementById('calc_logo_base64');
                    if (preview && container && hiddenParams) {
                        preview.src = proposta.logo_base64;
                        container.style.display = 'block';
                        hiddenParams.value = proposta.logo_base64;
                    }
                }
                if (proposta.client_logo_base64) {
                    const preview = document.getElementById('client_logo_preview');
                    const container = document.getElementById('client_logo_preview_container');
                    const hiddenParams = document.getElementById('client_logo_base64');
                    if (preview && container && hiddenParams) {
                        preview.src = proposta.client_logo_base64;
                        container.style.display = 'block';
                        hiddenParams.value = proposta.client_logo_base64;
                    }
                }
                if (proposta.watermark_base64) {
                    const wPreview = document.getElementById('calc_watermark_preview');
                    const wContainer = document.getElementById('calc_watermark_preview_container');
                    const wHidden = document.getElementById('calc_watermark_base64');
                    if (wPreview && wContainer && wHidden) {
                        wPreview.src = proposta.watermark_base64;
                        wContainer.style.display = 'block';
                        wHidden.value = proposta.watermark_base64;
                    }
                }
            }, 100);
        }
    },

    deleteProposal(id) {
        if (confirm('Tem certeza que deseja excluir esta proposta comercial?')) {
            store.deletePropostaComercial(id);
            window.app.toast("Proposta removida.", "success");
        }
    }
};

window.propostaComercialModule = PropostaComercialModule;
PropostaComercialModule.init();
