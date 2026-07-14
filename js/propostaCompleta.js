import { store } from './state.js';

const PropostaCompletaModule = {
    init() {
        console.log("Proposta Completa Module Initializing...");

        window.app.propostaCompleta = {
            create: this.create.bind(this),
            renderModal: this.renderModal.bind(this),
            closeModal: this.closeModal.bind(this),
            save: this.save.bind(this),
            exportToWord: this.exportToWord.bind(this),
            edit: this.edit.bind(this),
            deleteProposal: this.deleteProposal.bind(this),
            resetView: this.resetView.bind(this),
            onClientChange: this.onClientChange.bind(this),
            showListModal: this.showListModal.bind(this),
            editFromList: this.editFromList.bind(this),
            deleteFromList: this.deleteFromList.bind(this)
        };

        this.viewMode = 'list';

        const saved = store.getState().activeCompleteProposal;
        if (saved) {
            this.viewMode = 'form';
        }

        store.subscribe((state) => {
            const container = document.getElementById('view-proposta-completa');
            if (container && !container.classList.contains('hidden-module')) {
                this.render().then(() => {});
            }
        });
    },

    resetView() {
        this.viewMode = 'list';
    },

    async render() {
        const container = document.getElementById('view-proposta-completa');
        if (!container) return;

        if (this.viewMode === 'form') {
            const data = store.getState().activeCompleteProposal || {};
            this.renderModal(data);
            return;
        }

        await this.create();
    },

    async create() {
        const prefill = {};
        const ptc = window.app.currentPtc;

        if (ptc && ptc.folder) {
            const state = store.getState();

            // Load proposals from filesystem if not already in state
            if (!state.activeTechnicalProposal || (state.activeTechnicalProposal.ptc_folder !== ptc.folder && state.activeTechnicalProposal.ptcFolder !== ptc.folder)) {
                await this._loadProposal('tecnica', ptc.folder);
            }
            if (!state.activeCommercialProposal || (state.activeCommercialProposal.ptc_folder !== ptc.folder && state.activeCommercialProposal.ptcFolder !== ptc.folder)) {
                await this._loadProposal('comercial', ptc.folder);
            }

            const updated = store.getState();
            const tecMatch = (updated.propostasTecnicas || []).find(p => p.ptcFolder === ptc.folder || p.ptc_folder === ptc.folder)
                || (updated.activeTechnicalProposal?.ptc_folder === ptc.folder || updated.activeTechnicalProposal?.ptcFolder === ptc.folder ? updated.activeTechnicalProposal : null);
            const comMatch = (updated.propostasComerciais || []).find(p => p.ptcFolder === ptc.folder || p.ptc_folder === ptc.folder)
                || (updated.activeCommercialProposal?.ptc_folder === ptc.folder || updated.activeCommercialProposal?.ptcFolder === ptc.folder ? updated.activeCommercialProposal : null);

            prefill.cliente = ptc.client || '';
            prefill.projeto = ptc.title || '';
            if (tecMatch) prefill.tecId = tecMatch.id;
            if (comMatch) prefill.comId = comMatch.id;
            prefill.ptcFolder = ptc.folder;
        }

        this.viewMode = 'form';
        store.setState({ activeCompleteProposal: prefill });
        this.renderModal(prefill);
    },

    async _loadProposal(type, folder) {
        try {
            const _tkLP = store.getState().auth?.token;
            const _hLP = _tkLP ? { 'Authorization': 'Bearer ' + _tkLP } : {};
            const fileName = type === 'tecnica' ? 'PropostaTecnica.json' : 'PropostaComercial.json';
            const res = await fetch(`/api/load-proposal?ptc=${encodeURIComponent(folder)}&file=${fileName}&revisionFolder=`, { headers: _hLP });
            const data = await res.json();
            if (data && !data.error && Object.keys(data).length > 0) {
                if (!data.ptc_folder) data.ptc_folder = folder;
                if (type === 'tecnica') {
                    store.setState({ activeTechnicalProposal: data });
                } else {
                    store.setState({ activeCommercialProposal: data });
                }
            }
        } catch (e) {
            console.warn(`Failed to load ${type} proposal for ${folder}:`, e);
        }
    },

    edit(id) {
        const propostas = store.getState().propostasCompletas || [];
        const proposta = propostas.find(p => p.id === id);
        if (proposta) {
            this.viewMode = 'form';
            this.renderModal(proposta);
        }
    },

    renderModal(data = {}) {
        const isEdit = !!data.id;
        const state = store.getState();
        const clientes = state.clientes || [];
        const propostasTecnicas = state.propostasTecnicas || [];
        const propostasComerciais = state.propostasComerciais || [];

        const selectedClient = data.cliente || '';
        const selectedTecId = data.tecId || '';
        const selectedComId = data.comId || '';

        const getDisplayCode = p => {
            const folder = p.ptcFolder || p.ptc_folder || '';
            const match = folder.match(/PTC-\d{4}-\d+/i) || folder.match(/^\d{6,10}/);
            return p.codigo || match?.[0]?.toUpperCase() || folder || p.id;
        };

        let filteredTec = selectedClient
            ? propostasTecnicas.filter(p => p.cliente === selectedClient || p.clienteName === selectedClient)
            : propostasTecnicas;
        let filteredCom = selectedClient
            ? propostasComerciais.filter(p => p.cliente === selectedClient || p.clienteName === selectedClient)
            : propostasComerciais;

        // Force-include proposals from the current PTC folder so pre-selection works
        if (data.ptcFolder) {
            const tecFromFolder = propostasTecnicas.find(p => p.ptcFolder === data.ptcFolder || p.ptc_folder === data.ptcFolder);
            const comFromFolder = propostasComerciais.find(p => p.ptcFolder === data.ptcFolder || p.ptc_folder === data.ptcFolder);
            const activeTec = store.getState().activeTechnicalProposal;
            const activeCom = store.getState().activeCommercialProposal;
            if (tecFromFolder && !filteredTec.find(p => p.id === tecFromFolder.id)) {
                filteredTec = [...filteredTec, tecFromFolder];
            }
            if (activeTec && (activeTec.ptc_folder === data.ptcFolder || activeTec.ptcFolder === data.ptcFolder) && !filteredTec.find(p => p.id === activeTec.id)) {
                filteredTec = [...filteredTec, activeTec];
            }
            if (comFromFolder && !filteredCom.find(p => p.id === comFromFolder.id)) {
                filteredCom = [...filteredCom, comFromFolder];
            }
            if (activeCom && (activeCom.ptc_folder === data.ptcFolder || activeCom.ptcFolder === data.ptcFolder) && !filteredCom.find(p => p.id === activeCom.id)) {
                filteredCom = [...filteredCom, activeCom];
            }
        }

        const container = document.getElementById('view-proposta-completa');
        if (!container) return;

        container.innerHTML = `
            <div id="form-proposta-completa-container" class="fade-in" style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <div>
                        <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                            <i class="ph ph-file"></i>
                            ${isEdit ? 'Editar Proposta Completa' : 'Nova Proposta Completa'}
                            <span style="font-weight:300;opacity:0.8;">${data.projeto ? '| ' + data.projeto : ''}</span>
                        </h2>
                        <div style="font-size:12px;opacity:0.9;margin-top:2px;">
                            Combine proposta técnica e comercial em um único documento.
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.propostaCompleta.showListModal()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-list"></i> Lista
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="app.propostaCompleta.closeModal()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                    </div>
                </div>

                <form id="form-proposta-completa" onsubmit="return false;" style="flex:1;display:flex;flex-direction:column;min-height:0;">
                    <div style="flex:1;overflow-y:auto;padding:20px;">
                        <input type="hidden" name="id" value="${data.id || ''}">

                        <div class="form-group">
                            <label class="form-label">Cliente</label>
                            <select name="cliente" class="form-control" onchange="app.propostaCompleta.onClientChange(this.value)">
                                <option value="">Selecione um cliente...</option>
                                ${clientes.map(c => `
                                    <option value="${c.razaoSocial}" ${selectedClient === c.razaoSocial ? 'selected' : ''}>${c.razaoSocial}</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="row" style="display: flex; gap: 16px; margin-top: 16px;">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Proposta Técnica</label>
                                <select name="tecId" class="form-control">
                                    <option value="">Selecione...</option>
                                    ${filteredTec.map(p => `
                                        <option value="${p.id}" ${selectedTecId === p.id ? 'selected' : ''}>${getDisplayCode(p)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Proposta Comercial</label>
                                <select name="comId" class="form-control">
                                    <option value="">Selecione...</option>
                                    ${filteredCom.map(p => `
                                        <option value="${p.id}" ${selectedComId === p.id ? 'selected' : ''}>${getDisplayCode(p)}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="row" style="display: flex; gap: 16px; margin-top: 16px;">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Projeto</label>
                                <input type="text" name="projeto" class="form-control" value="${data.projeto || ''}">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Código</label>
                                <input type="text" name="codigo" class="form-control" value="${data.codigo || ''}">
                            </div>
                        </div>
                    </div>
                </form>

                <div class="module-footer" style="padding:15px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <div>
                        <button type="button" class="btn btn-ghost" onclick="app.propostaCompleta.exportToWord()">
                            <i class="ph ph-file-doc"></i> Exportar Word
                        </button>
                    </div>
                    <div style="display:flex;gap:12px;">
                        <button type="button" class="btn btn-cancel" onclick="app.propostaCompleta.closeModal()">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="app.propostaCompleta.save()" style="">Salvar</button>
                    </div>
                </div>
            </div>
        `;

        if (store.getState().proposalReadOnly) {
            this._applyReadOnly(container);
        }
    },

    _applyReadOnly(container) {
        container.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (el.type !== 'hidden') el.disabled = true;
        });
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

    onClientChange(clientName) {
        const form = document.getElementById('form-proposta-completa');
        if (!form) return;
        const state = store.getState();
        const propostasTecnicas = state.propostasTecnicas || [];
        const propostasComerciais = state.propostasComerciais || [];
        const data = store.getState().activeCompleteProposal || {};
        data.cliente = clientName;

        const filteredTec = clientName
            ? propostasTecnicas.filter(p => p.cliente === clientName || p.clienteName === clientName)
            : propostasTecnicas;
        const filteredCom = clientName
            ? propostasComerciais.filter(p => p.cliente === clientName || p.clienteName === clientName)
            : propostasComerciais;

        const tecSelect = form.querySelector('select[name="tecId"]');
        const comSelect = form.querySelector('select[name="comId"]');
        const codDisplay = p => {
            const folder = p.ptcFolder || p.ptc_folder || '';
            const match = folder.match(/PTC-\d{4}-\d+/i) || folder.match(/^\d{6,10}/);
            return p.codigo || match?.[0]?.toUpperCase() || folder || p.id;
        };
        if (tecSelect) {
            tecSelect.innerHTML = `<option value="">Selecione...</option>
                ${filteredTec.map(p => `<option value="${p.id}">${codDisplay(p)}</option>`).join('')}`;
        }
        if (comSelect) {
            comSelect.innerHTML = `<option value="">Selecione...</option>
                ${filteredCom.map(p => `<option value="${p.id}">${codDisplay(p)}</option>`).join('')}`;
        }
    },

    save() {

        if (store.getState().proposalReadOnly) {
            window.app.toast('Proposta em modo somente leitura. Não é possível salvar.', 'warning', 0);
            return;
        }

        const form = document.getElementById('form-proposta-completa');
        if (!form) return;

        const formData = new FormData(form);
        const id = formData.get('id') || undefined;
        const cliente = formData.get('cliente') || '';
        const tecId = formData.get('tecId') || '';
        const comId = formData.get('comId') || '';
        const projeto = formData.get('projeto') || '';
        const codigo = formData.get('codigo') || '';

        const state = store.getState();
        const tecProposta = (state.propostasTecnicas || []).find(p => p.id === tecId);
        const comProposta = (state.propostasComerciais || []).find(p => p.id === comId);

        const proposta = {
            id: id || crypto.randomUUID(),
            cliente,
            tecId,
            comId,
            projeto: projeto || tecProposta?.projeto || comProposta?.projeto || '',
            codigo: codigo || tecProposta?.codigo || comProposta?.codigo || '',
            tecProjeto: tecProposta?.projeto || '',
            comProjeto: comProposta?.projeto || '',
            updatedAt: new Date().toISOString()
        };

        if (id) {
            store.updatePropostaCompleta(id, proposta);
            window.app.toast("Proposta completa atualizada!", "success");
        } else {
            store.addPropostaCompleta(proposta);
            window.app.toast("Proposta completa criada!", "success");
        }

        store.setState({ activeCompleteProposal: proposta });
        this.closeModal();
    },

    closeModal() {
        this.viewMode = 'list';
        store.setState({ activeCompleteProposal: null, proposalReadOnly: false });
        this.render();
    },

    deleteProposal(id) {
        if (!confirm("Excluir esta proposta completa?")) return;
        store.deletePropostaCompleta(id);
        window.app.toast("Proposta completa excluída.", "info");
        this.render();
    },

    showListModal() {
        const propostas = store.getState().propostasCompletas || [];
        const overlay = document.createElement('div');
        overlay.id = 'lista-propostas-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:800px;max-width:90vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--color-border);">
                    <h3 style="margin:0;font-size:16px;font-weight:600;">Propostas Completas Salvas</h3>
                    <button class="btn btn-ghost" onclick="this.closest('#lista-propostas-overlay').remove()" style="padding:4px 8px;">
                        <i class="ph ph-x"></i>
                    </button>
                </div>
                <div style="flex:1;overflow-y:auto;padding:0;">
                    ${propostas.length === 0 ? `
                        <div style="padding:40px;text-align:center;color:#94a3b8;">
                            <i class="ph ph-file" style="font-size:36px;margin-bottom:12px;"></i>
                            <p>Nenhuma proposta completa salva.</p>
                        </div>
                    ` : `
                        <table class="w-full text-left" style="border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--color-border);background:#f8fafc;">
                                    <th style="padding:12px 16px;font-weight:600;font-size:13px;">Data</th>
                                    <th style="padding:12px 16px;font-weight:600;font-size:13px;">Cliente</th>
                                    <th style="padding:12px 16px;font-weight:600;font-size:13px;">Projeto</th>
                                    <th style="padding:12px 16px;font-weight:600;font-size:13px;">Prop. Técnica</th>
                                    <th style="padding:12px 16px;font-weight:600;font-size:13px;">Prop. Comercial</th>
                                    <th style="padding:12px 16px;font-weight:600;font-size:13px;text-align:right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(() => {
                                    const st = store.getState();
                                    const tecList = st.propostasTecnicas || [];
                                    const comList = st.propostasComerciais || [];
                                    const codDisplay = prop => prop ? (() => {
                                        const folder = prop.ptcFolder || prop.ptc_folder || '';
                                        const match = folder.match(/PTC-\d{4}-\d+/i) || folder.match(/^\d{6,10}/);
                                        return prop.codigo || match?.[0]?.toUpperCase() || folder || prop.id;
                                    })() : '-';
                                    return propostas.map(p => {
                                        const date = new Date(p.createdAt).toLocaleDateString();
                                        const tecCode = codDisplay(tecList.find(t => t.id === p.tecId));
                                        const comCode = codDisplay(comList.find(c => c.id === p.comId));
                                        return `
                                            <tr style="border-bottom:1px solid var(--color-border);">
                                                <td style="padding:12px 16px;">${date}</td>
                                                <td style="padding:12px 16px;font-weight:500;">${p.cliente}</td>
                                                <td style="padding:12px 16px;font-weight:500;">${p.projeto || '-'}</td>
                                                <td style="padding:12px 16px;">${tecCode}</td>
                                                <td style="padding:12px 16px;">${comCode}</td>
                                                <td style="padding:12px 16px;text-align:right;">
                                                    <button class="btn-icon" onclick="app.propostaCompleta.editFromList('${p.id}')" title="Editar">
                                                        <i class="ph ph-pencil-simple"></i>
                                                    </button>
                                                    <button class="btn-icon" onclick="app.propostaCompleta.deleteFromList('${p.id}')" title="Excluir" style="color:var(--color-danger);">
                                                        <i class="ph ph-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>`;
                                    }).join('');
                                })()}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    editFromList(id) {
        const overlay = document.getElementById('lista-propostas-overlay');
        if (overlay) overlay.remove();
        this.edit(id);
    },

    deleteFromList(id) {
        const overlay = document.getElementById('lista-propostas-overlay');
        if (!confirm("Excluir esta proposta completa?")) return;
        store.deletePropostaCompleta(id);
        window.app.toast("Proposta completa excluída.", "info");
        if (overlay) overlay.remove();
        this.showListModal();
    },

    async exportToWord() {

        if (store.getState().proposalReadOnly) {
            window.app.toast('Exportação bloqueada para propostas Fechadas/Perdidas.', 'warning', 0);
            return;
        }

        const form = document.getElementById('form-proposta-completa');
        if (!form) return;

        const formData = new FormData(form);
        const tecId = formData.get('tecId') || '';
        const comId = formData.get('comId') || '';

        if (!tecId && !comId) {
            window.app.toast("Selecione ao menos uma Proposta Técnica ou Comercial.", "warning");
            return;
        }

        const state = store.getState();
        let tecProposta = (state.propostasTecnicas || []).find(p => p.id === tecId);
        let comProposta = (state.propostasComerciais || []).find(p => p.id === comId);
        const activeTec = state.activeTechnicalProposal;
        const activeCom = state.activeCommercialProposal;
        if (!tecProposta && activeTec && activeTec.id === tecId) tecProposta = activeTec;
        if (!comProposta && activeCom && activeCom.id === comId) comProposta = activeCom;

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

        const DocxLib = window.Docxtemplater || window.docxtemplater;
        const ZipLib = window.PizZip || window.pizzip || (window.Docxtemplater ? window.Docxtemplater.PizZip : null);
        const ImageModule = window.ImageModule;

        if (!DocxLib || !ZipLib) {
            window.app.toast('Erro: Bibliotecas de exportação não carregadas.', 'error');
            return;
        }

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

        window.app.toast('Gerando documento Word...', 'info');

        try {
            const cliente = formData.get('cliente') || tecProposta?.cliente || comProposta?.cliente || '';
            const projeto = formData.get('projeto') || tecProposta?.projeto || comProposta?.projeto || '';
            const codigo = formData.get('codigo') || tecProposta?.codigo || comProposta?.codigo || '';

            // Lookup client data
            const clientObj = (state.clientes || []).find(c => c.razaoSocial === cliente);

            // Build templateData from technical proposal
            const _isAUTPRO = state.company?.folderName?.startsWith('AUT_');
            const _ptcFolderPComp = String(window.app.currentPtc?.folder || '');
            const _ptcMatchPComp = _ptcFolderPComp.match(/^(\d{8,10})/);
            const _ptcNumberPComp = _ptcMatchPComp ? _ptcMatchPComp[1] : (window.app.currentPtcInfo?.ptcNumber || '00000000');
            const _revPCompVal = window.app.currentPtc?.revision || '00';
            const _revStrPComp = _revPCompVal && _revPCompVal !== '0' ? String(_revPCompVal).replace(/[^0-9]/g, '') : '00';

            const templateData = {
                ptc_number: _isAUTPRO ? `PTC-${_ptcNumberPComp}-Rev${_revStrPComp}` : `${_ptcNumberPComp}-PTC-Rev${_revStrPComp}`,
                cliente: cliente || '',
                razao_social: clientObj?.razaoSocial || '',
                nome_fantasia: clientObj?.nomeFantasia || '',
                cnpj: clientObj?.cnpj || '',
                inscricao_estadual: clientObj?.inscricaoEstadual || '',
                inscricao_municipal: clientObj?.inscricaoMunicipal || '',
                logradouro: clientObj?.logradouro || '',
                numero: clientObj?.numero || '',
                bairro: clientObj?.bairro || '',
                cidade_cliente: clientObj?.cidade || '',
                estado: clientObj?.estado || '',
                cep: clientObj?.cep || '',
                segmento: clientObj?.segmento || '',
                cnae: clientObj?.cnae || '',
                observacoes: clientObj?.observacoes || '',
                contato_nome: (clientObj?.contatos?.[0]?.nome) || clientObj?.contatoNome || '',
                contato_cargo: (clientObj?.contatos?.[0]?.cargo) || clientObj?.contatoCargo || '',
                contato_email: (clientObj?.contatos?.[0]?.email) || clientObj?.email || '',
                contato_telefone: (clientObj?.contatos?.[0]?.telefone) || clientObj?.telefone || '',
                projeto: projeto || '',
                codigo: codigo || '',
                objeto: tecProposta?.objeto || comProposta?.objeto || '',
                cidade: tecProposta?.cidade || comProposta?.cidade || '',
                uf: tecProposta?.uf || comProposta?.uf || '',
                localizacao: tecProposta?.localizacao || comProposta?.localizacao || [tecProposta?.cidade, tecProposta?.uf].filter(Boolean).join('/') || [comProposta?.cidade, comProposta?.uf].filter(Boolean).join('/') || '',
                data_emissao: new Date().toLocaleDateString('pt-BR'),
                revisao: tecProposta?.revisions?.length > 0 ? tecProposta.revisions[tecProposta.revisions.length - 1].no : '00',
                aos_cuidados: tecProposta?.aos_cuidados || comProposta?.aos_cuidados || '',
                email: tecProposta?.email || comProposta?.email || '',
                telefone: tecProposta?.telefone || comProposta?.telefone || '',
            };

            // Technical: revisions
            if (tecProposta?.revisions) {
                templateData.revisoes = tecProposta.revisions.map(r => ({
                    no: r.no || '',
                    desc: r.desc || '',
                    elab: r.elab || '',
                    verif: r.verif || '',
                    aprov: r.aprov || '',
                    data: r.data || ''
                }));
            } else {
                templateData.revisoes = [];
            }

            // Technical: equipment list (lista_paineis)
            if (tecProposta?.equipments) {
                const eletrocentroEq = tecProposta.equipments.find(eq => eq.type === 'ELETROCENTRO');
                templateData.tem_eletrocentro = !!eletrocentroEq;
                templateData.tem_escopo_eletrocentro = !!eletrocentroEq;

                templateData.lista_paineis = tecProposta.equipments.map(eq => {
                    const tech = eq.technical || {};
                    const loads = eq.loads || [];
                    const eqData = {
                        tag: eq.tag,
                        tipo: eq.type,
                        ...tech,
                    };

                    // Cargas loop
                    eqData.cargas = loads.map((load, idx) => ({
                        index: idx + 1,
                        tag: load.tag || '',
                        desc: load.desc || '',
                        power: load.power || '',
                        tensao: load.tensao || '',
                        corrente: load.corrente || '',
                        regime: load.regime || '',
                        type: load.type || '',
                        disjuntor: load.disjuntor || '',
                        cabo: load.cabo || '',
                        typicalId: load.typicalId || ''
                    }));

                    return eqData;
                });
            } else {
                templateData.tem_eletrocentro = false;
                templateData.tem_escopo_eletrocentro = false;
                templateData.lista_paineis = [];
            }

            // Technical: scope items
            if (tecProposta?.scopeItems) {
                templateData.escopo = tecProposta.scopeItems.map(item => ({
                    desc: item.desc || '',
                    minhaEmpresa: item.minhaEmpresa ? 'X' : '',
                    cliente: item.cliente ? 'X' : ''
                }));
            } else {
                templateData.escopo = [];
            }

            // Technical: AUTPRO scope (condicionais individuais)
            if (tecProposta?.autproScope) {
                templateData.tem_autpro_escopo = tecProposta.autproScope.some(item => item.incluso);
                tecProposta.autproScope.forEach(item => {
                    templateData[item.id + '_incluso'] = !!item.incluso;
                });
            } else {
                templateData.tem_autpro_escopo = false;
            }

            // Technical: vendor list
            if (tecProposta?.vendorList) {
                templateData.vendor_list = tecProposta.vendorList.map((v, idx) => ({
                    index: idx + 1,
                    comp: v.comp || '',
                    brand: v.brand || '',
                    opt_display: v.opt_display || ''
                }));
            } else {
                templateData.vendor_list = [];
            }

            // Commercial: supply items
            if (comProposta?.supplyItems) {
                templateData.supply_items = comProposta.supplyItems.map((item, idx) => ({
                    text: item.text || '',
                    index: idx + 1
                }));
            } else {
                templateData.supply_items = [];
            }

            // Commercial: investment items
            if (comProposta?.itens) {
                templateData.investment_items = comProposta.itens.map((item, idx) => {
                    const qtd = parseFloat(item.qtd) || 0;
                    const price = parseFloat(String(item.price || '0').replace(/\./g, '').replace(',', '.')) || 0;
                    const subtotal = qtd * price;
                    return {
                        index: idx + 1,
                        qtd: qtd,
                        desc: item.desc || '',
                        ipi: item.ipi || '0',
                        price: String(item.price || '0,00'),
                        subtotal: subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                        direto: item.direto ? '(Faturamento Direto)' : ''
                    };
                });
            } else {
                templateData.investment_items = [];
            }

            // Commercial: pricing
            templateData.res_preco_final_s_ipi = comProposta?.res_preco_final_s_ipi || '';
            templateData.res_preco_final_c_ipi = comProposta?.res_preco_final_c_ipi || '';
            templateData.res_valor_ipi = comProposta?.res_valor_ipi || '';

            // Commercial: tax & payment fields
            templateData.impostos_texto = comProposta?.impostos_texto || '';
            templateData.ipi_texto = comProposta?.ipi_texto || '';
            templateData.pagamento_eventos = comProposta?.pagamento_eventos || [];
            templateData.pgto_evento = comProposta?.pgto_evento || '';
            templateData.pgto_parcela = comProposta?.pgto_parcela || '';
            templateData.pgto_fat = comProposta?.pgto_fat || '';
            templateData.faturamento_ncm = comProposta?.faturamento_ncm || '';
            templateData.prazo_entrega = comProposta?.prazo_entrega || '';
            templateData.validade = comProposta?.validade || '';
            templateData.data_base = comProposta?.data_base || '';
            templateData.despesas = comProposta?.despesas || '';
            templateData.transporte = comProposta?.transporte || '';
            templateData.condicoes = comProposta?.condicoes || '';

            // Commercial: contact variants
            const comEmail = comProposta?.email || tecProposta?.email || '';
            const comPhone = comProposta?.telefone || tecProposta?.telefone || '';
            templateData['E-mail'] = comEmail;
            templateData['Email'] = comEmail;
            templateData['E_mail'] = comEmail;
            templateData['telefone'] = comPhone;
            templateData['Telefone'] = comPhone;
            templateData['fone'] = comPhone;
            templateData['celular'] = comPhone;
            templateData['TEL'] = comPhone;
            templateData.contato = templateData.aos_cuidados;

            // Signatures (commercial has 3, only active)
            if (comProposta) {
                templateData.sig1_nome = (comProposta.sig1_active !== false) ? (comProposta.sig1_nome || '') : '';
                templateData.sig1_cargo = (comProposta.sig1_active !== false) ? (comProposta.sig1_cargo || '') : '';
                templateData.sig1_tel = (comProposta.sig1_active !== false) ? (comProposta.sig1_tel || '') : '';
                templateData.sig1_cel = (comProposta.sig1_active !== false) ? (comProposta.sig1_cel || '') : '';
                templateData.sig1_email = (comProposta.sig1_active !== false) ? (comProposta.sig1_email || '') : '';
                templateData.sig2_nome = (comProposta.sig2_active !== false) ? (comProposta.sig2_nome || '') : '';
                templateData.sig2_cargo = (comProposta.sig2_active !== false) ? (comProposta.sig2_cargo || '') : '';
                templateData.sig2_tel = (comProposta.sig2_active !== false) ? (comProposta.sig2_tel || '') : '';
                templateData.sig2_cel = (comProposta.sig2_active !== false) ? (comProposta.sig2_cel || '') : '';
                templateData.sig2_email = (comProposta.sig2_active !== false) ? (comProposta.sig2_email || '') : '';
                templateData.sig3_nome = (comProposta.sig3_active !== false) ? (comProposta.sig3_nome || '') : '';
                templateData.sig3_cargo = (comProposta.sig3_active !== false) ? (comProposta.sig3_cargo || '') : '';
                templateData.sig3_tel = (comProposta.sig3_active !== false) ? (comProposta.sig3_tel || '') : '';
                templateData.sig3_cel = (comProposta.sig3_active !== false) ? (comProposta.sig3_cel || '') : '';
                templateData.sig3_email = (comProposta.sig3_active !== false) ? (comProposta.sig3_email || '') : '';
            }

            // Commercial: revisions (revisions_com)
            if (comProposta?.revisions) {
                templateData.revisions_com = comProposta.revisions.map(r => ({
                    no: r.no || '',
                    desc: r.desc || '',
                    elab: r.elab || '',
                    verif: r.verif || '',
                    aprov: r.aprov || '',
                    data: r.data || ''
                }));
            } else {
                templateData.revisions_com = [];
            }

            // Images (prefer commercial logos, fallback to technical)
            templateData.logo_img = comProposta?.logo_base64 || tecProposta?.logo_base64 || '';
            templateData.client_logo_img = comProposta?.client_logo_base64 || tecProposta?.client_logo_base64 || '';
            templateData.watermark_img = comProposta?.watermark_base64 || tecProposta?.watermark_base64 || '';

            // UPPERCASE mirroring for all string/array keys
            Object.keys(templateData).forEach(key => {
                const val = templateData[key];
                if (typeof val === 'string' || Array.isArray(val)) {
                    templateData[key.toUpperCase()] = val;
                }
            });

            // Load template
            const company = store.getState().company || {};
            const auth = store.getState().auth || {};
            const empresaId = auth.user?.empresa_id || 'default';
            const templateFile = company.templateCompleta || 'TEMPLATE_TEC_COM.docx';
            const folderName = company.folderName || empresaId;
            const response = await fetch('templates/' + folderName + '/' + templateFile + '?v=' + Date.now());
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
                        if (name.includes('client_logo')) return [378, 150];
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

            doc.setData(templateData);
            doc.render();

            const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            const outBlob = doc.getZip().generate({ type: "blob", mimeType });
            const outBase64 = doc.getZip().generate({ type: "base64", mimeType });

            const ptcFolder = String(window.app.currentPtc?.folder || '');
            const ptcMatch = ptcFolder.match(/^(\d{8,10})/);
            const ptcNumber = ptcMatch ? ptcMatch[1] : (window.app.currentPtcInfo?.ptcNumber || '00000000');
            const rev = window.app.currentPtc?.revision;
            const revStr = rev && rev !== '0' ? rev.replace(/[^0-9]/g, '') : '00';
            const filename = _isAUTPRO ? `PTC-${ptcNumber}-Rev${revStr}.docx` : `${ptcNumber}-PTC-Rev${revStr}.docx`;

            const url = URL.createObjectURL(outBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Save to server PTC folder
            const currentPtc = window.app.currentPtc;
            if (currentPtc && currentPtc.folder) {
                const _tkSFPC = store.getState().auth?.token;
                fetch('/api/save-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(_tkSFPC ? { 'Authorization': 'Bearer ' + _tkSFPC } : {}) },
                    body: JSON.stringify({
                        ptcFolder: currentPtc.folder,
                        filename,
                        content: outBase64,
                        isBase64: true,
                        revisionFolder: currentPtc.revision
                    })
                })
                .then(res => res.json())
                .then(r => {
                    if (r.success) {
                        console.log('[Export] PTC DOCX saved to server:', filename);
                        window.app.toast('Documento salvo na pasta da PTC!', 'success');
                    } else {
                        console.error('[Export] Server save failed:', r.error);
                        window.app.toast('Erro ao salvar no servidor: ' + (r.error || 'desconhecido'), 'error');
                    }
                })
                .catch(err => {
                    console.error('Error saving PTC DOCX to server:', err);
                    window.app.toast('Erro de conexão ao salvar no servidor.', 'error');
                });
            }

            window.app.toast(`Documento gerado: ${filename}`, 'success');
        } catch (err) {
            console.error("Erro na exportação:", err);
            window.app.toast('Erro ao exportar: ' + err.message, 'error');
        }
    }
};

window.propostaCompletaModule = PropostaCompletaModule;
PropostaCompletaModule.init();
