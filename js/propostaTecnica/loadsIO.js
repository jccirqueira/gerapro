// loadsIO.js (bloco 6/7) — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { store } from '../state.js';
import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from '../busbarCalculator.js';
import { deriveMaterials } from '../automacaoMateriais.js';
import { EMPRESA } from '../empresaConfig.js';
import { infraSubtotal, infraPrecoFinal } from '../infraPricing.js';
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './shared.js';

const app = window.app;
export const loadsIO = {
    openLMModal(loadIndex) {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        const isCubMt = eq && eq.type === 'CUB-MT';

        const load = eq.loads[loadIndex];

        

        if (!load || !load.typicalId) {

            app.toast('Por favor, associe um Típico a esta carga para visualizar a LM.', 'warning');

            return;

        }

        const sourceData = isCubMt ? store.getState().cubiculos : store.getState().tipicos;

        const typical = sourceData.find(t => t.id === load.typicalId);

        if (!typical) {

            app.toast(isCubMt ? 'Cubículo não encontrado.' : 'Típico não encontrado.', 'error');

            return;

        }



        const modalHtml = `

            <div id="modal-lm-preview" class="modal-overlay" style="z-index: 10001;">

                <div class="modal" style="width: 800px; max-height: 90vh; display: flex; flex-direction: column;">

                    <div class="modal-header" style="background: #1e3a8a; color: white;">

                        <div>

                            <h3 style="margin: 0;">Lista de Materiais: ${load.tag || 'Carga'}</h3>

                            <div style="font-size: 12px; opacity: 0.8;">${isCubMt ? 'Cubículo' : 'Típico'}: ${typical.nome}</div>

                        </div>

                        <button type="button" class="btn-icon" style="color: white;" onclick="document.getElementById('modal-lm-preview').remove()"><i class="ph ph-x"></i></button>

                    </div>

                    <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 20px;">

                        <table class="w-full" style="font-size: 12px; border-collapse: collapse;">

                            <thead>

                                <tr style="background: var(--color-accent); text-align: left; color: #fff;">

                                    <th style="padding: 8px; width: 60px;">Qtd</th>

                                    <th style="padding: 8px;">Descrição</th>

                                    <th style="padding: 8px;">Modelo</th>

                                    <th style="padding: 8px;">Fabricante</th>

                                    <th style="padding: 8px; text-align: right;">Unit.</th>

                                    <th style="padding: 8px; text-align: right;">Total</th>

                                </tr>

                            </thead>

                            <tbody>

                                ${(typical.items || []).map(item => `

                                    <tr style="border-bottom: 1px solid #f1f5f9;">

                                        <td style="padding: 8px; text-align: center;">${item.qtd}</td>

                                        <td style="padding: 8px;">${item.descricao}</td>

                                        <td style="padding: 8px;">${item.modelo || '-'}</td>

                                        <td style="padding: 8px;">${item.fabricante || '-'}</td>

                                        <td style="padding: 8px; text-align: right;">${app.formatCurrency(item.custo || 0)}</td>

                                        <td style="padding: 8px; text-align: right;">${app.formatCurrency(parseFloat(item.qtd) * parseFloat(item.custo || 0))}</td>

                                    </tr>

                                `).join('')}

                            </tbody>

                        </table>

                    </div>

                    <div class="modal-footer" style="background: #f8fafc; display: flex; justify-content: space-between;">

                        <div style="font-weight: 700; color: #1e3a8a;">Total: ${app.formatCurrency(typical.custoTotal || 0)}</div>

                        <div style="display: flex; gap: 10px;">

                            <button type="button" class="btn btn-secondary" onclick="app.propostaTecnica.exportLMXLS(${loadIndex}, false)"><i class="ph ph-file-xls"></i> Excel Sem Preço</button>

                            <button type="button" class="btn btn-primary" onclick="app.propostaTecnica.exportLMXLS(${loadIndex}, true)"><i class="ph ph-file-xls"></i> Excel Com Preço</button>

                        </div>

                    </div>

                </div>

            </div>

        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

    },



    async exportLMXLS(loadIndex, withPrice) {

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        const isCubMt = eq && eq.type === 'CUB-MT';

        const sourceData = isCubMt ? (store.getState().cubiculos || []) : (store.getState().tipicos || []);



        app.toast('Exportando Excel...', 'info');



        try {

            let groupedData = [];



            if (loadIndex !== null && loadIndex !== undefined) {

                // Exportar carga única

                const load = eq.loads[loadIndex];

                if (!load) return;

                const typical = sourceData.find(t => t.id === load.typicalId);

                if (typical) {

                    groupedData.push({

                        carga: load,

                        typical: typical,

                        items: load._itemsOverride || typical.items || []

                    });

                }

            } else {

                // Exportar todas as cargas do painel

                (eq.loads || []).forEach(load => {

                    const typical = sourceData.find(t => t.id === load.typicalId);

                    if (typical) {

                        groupedData.push({

                            carga: load,

                            typical: typical,

                            items: load._itemsOverride || typical.items || []

                        });

                    }

                });

            }



            if (groupedData.length === 0) {

                app.toast('Nenhum dado para exportar. Verifique se as cargas possuem típicos associados.', 'warning');

                return;

            }



            const _tkExpLM = store.getState().auth?.token;
            const response = await fetch('/api/export-lm', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json', ...(_tkExpLM ? { 'Authorization': 'Bearer ' + _tkExpLM } : {}) },

                body: JSON.stringify({ 

                    items: groupedData,

                    ptcNumber: data.codigo || 'LM',

                    withPrices: withPrice

                })

            });



            if (!response.ok) throw new Error('Falha na exportação');



            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');

            a.href = url;

            a.download = `LM_${eq.tag}_${withPrice ? 'C_Preco' : 'S_Preco'}.xlsx`;

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);

            document.body.removeChild(a);

            app.toast('Exportação concluída!', 'success');

        } catch (e) {

            app.toast('Erro ao exportar: ' + e.message, 'error');

        }

    },



    async syncLoadsFromCalculations(eqTag) {

        app.toast(`Sincronizando cargas para ${eqTag}...`, 'info');

        

        const state = store.getState();

        // Os cálculos agora podem vir de diversas fontes, mas o padrão é state.calculosEletricos

        const calcs = state.calculosEletricos || [];

        

        // Filtra as cargas que pertencem a este equipamento (TAG)

        const relevantLoads = calcs.filter(c => c.painelTag === eqTag || c.painel === eqTag);

        

        if (relevantLoads.length === 0) {

            app.toast(`Nenhuma carga encontrada para ${eqTag} nos cálculos.`, 'warning');

            return;

        }



        const data = state.activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        

        if (eq) {

            eq.loads = relevantLoads.map(l => ({

                tag: l.tag,

                desc: l.descricao || l.desc,

                power: l.potenciaCvKw || l.modelStr,

                corrente: l.correnteA || l.currentStr,

                typical: l.partidaTipo || l.typical,

                disjuntor: l.disjuntor || l.suggestedDisjuntor || '',

                cabo: l.cabo || l.suggestedCable || ''

            }));

            store.setState({ activeTechnicalProposal: data });

            app.toast(`${relevantLoads.length} carga(s) sincronizada(s).`, 'success');

            this.renderModal(data);

        }

    },



    // Captura para o state os campos da aba atual que estão no DOM.
    // Chamado pelo save() e pelo switchTab() (antes do DOM da aba ser destruído),
    // para que edições feitas em uma aba não sejam perdidas ao trocar de aba sem salvar.
    captureActiveTab() {

        const form = document.getElementById('form-proposta-tecnica');
        if (!form) return;

        const formData = new FormData(form);
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;

        // Captura de dados baseada na aba ativa (para evitar sobrescrever com null se o campo não estiver no DOM)

        if (this.activeTab === 'geral') {

            data.cliente = formData.get('cliente') || data.cliente;

            data.unidade_cliente = formData.get('unidade_cliente') || data.unidade_cliente;

            data.codigo = formData.get('codigo') || data.codigo;

            data.data_emissao = formData.get('data_emissao') || data.data_emissao;

            data.aos_cuidados = formData.get('aos_cuidados') || data.aos_cuidados;

            data.email = formData.get('email') || data.email;

            data.telefone = formData.get('telefone') || data.telefone;

            data.celular = formData.get('celular') || data.celular;

            data.projeto = formData.get('projeto') || data.projeto;

            data.referencia = formData.get('referencia') || data.referencia;

            data.objeto = formData.get('objeto') || data.objeto;

            data.cidade = formData.get('cidade') || data.cidade || '';
            data.uf = formData.get('uf') || data.uf || '';
            data.localizacao = [data.cidade, data.uf].filter(Boolean).join('/') || data.localizacao || '';

            data.engenheiroResponsavel = formData.get('engenheiroResponsavel') || data.engenheiroResponsavel || '';

            data.vendedor = formData.get('vendedor') || data.vendedor || '';

            data.logo_base64 = formData.get('logo_base64') || data.logo_base64;

            data.client_logo_base64 = formData.get('client_logo_base64') || data.client_logo_base64;

            data.watermark_base64 = formData.get('watermark_base64') || data.watermark_base64;

        }



        // Capturar Escopo SEMPRE (se existir no DOM)
        const scopeRows = form.querySelectorAll('.scope-row');
        if (scopeRows.length > 0) {
            const scopeItems = [];
            scopeRows.forEach(row => {
                const isAuto    = row.dataset.auto === '1';
                const isSeu     = row.dataset.isSeu === '1';
                const isSeuComp = row.dataset.isSeuComp === '1';
                const item = {
                    desc: row.querySelector('input[name="scope_desc"]')?.value || '',
                    minhaEmpresa:  row.querySelector('input[name="scope_empresa"]')?.checked  || false,
                    cli:  row.querySelector('input[name="scope_cli"]')?.checked  || false
                };
                if (isAuto)    { item.auto = true; item.equipTag = row.dataset.equipTag || ''; }
                if (isSeu)     { item.isSeu = true; }
                if (isSeuComp) { item.isSeuComp = true; item.parentSeu = row.dataset.parentSeu || ''; }
                scopeItems.push(item);
            });
            data.scopeItems = scopeItems;
        }

        // Capturar Escopo AUTPRO (se existir no DOM)
        const autproRows = form.querySelectorAll('.autpro-row');
        if (autproRows.length > 0) {
            data.autproScope = AUTPRO_SCOPE_ITEMS.map(item => {
                const row = form.querySelector(`.autpro-row[data-autpro-id="${item.id}"]`);
                const checked = row ? row.querySelector('input[type="checkbox"]')?.checked || false : false;
                return { id: item.id, desc: item.desc, incluso: checked };
            });
        }


        // Captura de dados baseada na aba ativa

        if (this.activeTab === 'geral') {

        } else if (this.activeTab === 'vendor') {

            const vendors = [];
            const rows = form.querySelectorAll('.vendor-row');
            rows.forEach((row) => {
                const compEl = row.querySelector('td:first-child');
                const compInput = compEl ? compEl.querySelector('input') : null;
                const comp = compInput ? compInput.value.trim() : (compEl ? compEl.textContent.trim() : '');
                if (!comp) return;
                const brandEl = row.querySelector('[name^="ven_brand_"]') || row.querySelector('td:nth-child(2) input, td:nth-child(2) select');
                const optEl = row.querySelector('[name^="ven_opt_"]');
                const especEl = row.querySelector('.ven-especifique');
                const opt = optEl ? optEl.value : '__PADRAO__';
                const optEspecifique = especEl ? especEl.value : '';
                vendors.push({
                    comp,
                    brand: brandEl ? brandEl.value : '',
                    opt,
                    optEspecifique: opt === '__OUTRO__' ? optEspecifique : ''
                });
            });
            data.vendorList = vendors;
            this._saveVendorDefaults(vendors);

        } else if (this.activeTab === 'revisoes') {

            // Capturar revisões

            const revisions = [];

            const rows = form.querySelectorAll('.revision-row');

            rows.forEach((row, i) => {

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

            data.revisions = revisions;

        } else if (this.activeTab === 'assinaturas') {

            data.sig1_active = formData.get('sig1_active') === 'on';
            data.sig1_nome = formData.get('sig1_nome') || '';
            data.sig1_cargo = formData.get('sig1_cargo') || '';
            data.sig1_tel = formData.get('sig1_tel') || '';
            data.sig1_cel = formData.get('sig1_cel') || '';
            data.sig1_email = formData.get('sig1_email') || '';
            data.sig2_active = formData.get('sig2_active') === 'on';
            data.sig2_nome = formData.get('sig2_nome') || '';
            data.sig2_cargo = formData.get('sig2_cargo') || '';
            data.sig2_tel = formData.get('sig2_tel') || '';
            data.sig2_cel = formData.get('sig2_cel') || '';
            data.sig2_email = formData.get('sig2_email') || '';
            data.sig3_active = formData.get('sig3_active') === 'on';
            data.sig3_nome = formData.get('sig3_nome') || '';
            data.sig3_cargo = formData.get('sig3_cargo') || '';
            data.sig3_tel = formData.get('sig3_tel') || '';
            data.sig3_cel = formData.get('sig3_cel') || '';
            data.sig3_email = formData.get('sig3_email') || '';

        } else if (this.activeTab === 'exclusions') {

            this._captureExclusionsEdits();

        } else if (this.activeTab === 'equipments') {

            this.captureEquipmentData();

        } else if (this.activeTab === 'infraestrutura') {

            this.captureInfraData();

        }
    },

    async save() {

        console.log("[PropostaTecnica] Save initiated...");

        if (store.getState().proposalReadOnly) {
            window.app.toast('Proposta em modo somente leitura. Não é possível salvar.', 'warning', 0);
            return;
        }

        try {

            this.captureActiveTab();

            const data = store.getState().activeTechnicalProposal;

            if (!data) {

                app.toast('Erro: Dados da proposta não encontrados.', 'error');

                return;

            }




            // Validação final antes de enviar (usa o que já está no 'data' do state)

            if (!data.cliente) {

                app.toast('Atenção: O campo Cliente (na aba Dados Gerais) é obrigatório para salvar no servidor.', 'warning');
                
                // Sincroniza estado local para não perder o que foi digitado na aba ativa
                store.setState({ activeTechnicalProposal: data });
                this.renderModal(data);

                return;

            }



            const _saveStart = Date.now();

            if (!window.app.currentPtc?.folder) {
                app.toast('Nenhuma PTC ativa. Selecione ou crie uma PTC antes de salvar.', 'warning');
                return;
            }

            app.toast('Salvando Proposta...', 'info', 1000);

            console.log("[PropostaTecnica] Data to be saved:", JSON.stringify(data.equipments.map(e => e.tag)));

            const _tk = store.getState().auth?.token;
            const res = await fetch('/api/save-proposal', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json', ...(_tk ? { 'Authorization': 'Bearer ' + _tk } : {}) },

                body: JSON.stringify({

                    ptcFolder: window.app.currentPtc?.folder,

                    type: 'tecnica',

                    content: data,

                    revisionFolder: window.app.currentPtc?.revision || ''

                })

            });

            const result = await res.json();

            if (result.success) {

                const _elapsed = Date.now() - _saveStart;
                if (_elapsed < 1000) {
                    await new Promise(r => setTimeout(r, 1000 - _elapsed));
                }
                app.toast('Proposta Salva com Sucesso!', 'success', 1000);

                // Sincroniza o store com os dados capturados
                store.setState({ activeTechnicalProposal: data });

                // Sincroniza a lista de propostas técnicas no state
                if (!data.id) data.id = crypto.randomUUID();
                if (!data.ptc_folder) data.ptc_folder = window.app.currentPtc?.folder || '';
                const _ptcList = store.getState().propostasTecnicas || [];
                const _ptcExisting = _ptcList.find(p => p.id === data.id);
                if (_ptcExisting) {
                    store.updatePropostaTecnica(data.id, data);
                } else {
                    store.addPropostaTecnica(data);
                }

                // Sync vendedor to pipeline item
                if (window.app.currentPtc?.folder && data.vendedor) {
                    const state = store.getState();
                    const pitems = state.pipelineItems || [];
                    const pi = pitems.find(i => i.origemId === window.app.currentPtc.folder);
                    if (pi) {
                        const idx = pitems.indexOf(pi);
                        const updated = { ...pi, vendedor: data.vendedor, updatedAt: new Date().toISOString() };
                        pitems[idx] = updated;
                        store.setState({ pipelineItems: [...pitems] });
                        store._syncUpdate('pipelineItems', pi.id, { vendedor: data.vendedor, updatedAt: updated.updatedAt });
                    }
                }

                // Forçar renderização do modal para atualizar a lista lateral de equipamentos e outros campos

                this.renderModal(data);

            } else {

                throw new Error(result.error || 'Erro desconhecido no servidor');

            }

        } catch (e) {

            console.error("[PropostaTecnica] Save Error:", e);

            app.toast('Erro ao salvar: ' + e.message, 'error');

        }

    },

    async saveAsNew() {
        try {
            const data = store.getState().activeTechnicalProposal;
            if (!data) {
                app.toast('Nenhuma proposta ativa para duplicar.', 'warning');
                return;
            }
            if (this.activeTab === 'infraestrutura') {
                this.captureInfraData();
            }
            const copy = JSON.parse(JSON.stringify(data));
            this._openSaveAsModal(copy);
        } catch (e) {
            console.error('[saveAsNew] Error:', e);
            app.toast('Erro ao duplicar proposta: ' + e.message, 'error');
        }
    },

    _openSaveAsModal(sourceData) {
        if (document.getElementById('modal-save-as')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-save-as';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 480px;">
                <div class="modal-header" style="background: #1e3a8a; color: white;">
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
                            <label style="flex: 1; padding: 8px 12px; border: 2px solid #1e3a8a; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px; background: #eff6ff;">
                                <input type="radio" name="sas-ptc-option" value="new-dual" checked onchange="document.getElementById('sas-ptc-new-fields').style.display='block'; document.getElementById('sas-ptc-existing-fields').style.display='none';">
                                Criar nova PTC (2 arquivos PT + PC)
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="sas-ptc-option" value="new-single" onchange="document.getElementById('sas-ptc-new-fields').style.display='block'; document.getElementById('sas-ptc-existing-fields').style.display='none';">
                                Criar nova PTC (arquivo \u00fanico)
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="sas-ptc-option" value="existing" onchange="document.getElementById('sas-ptc-new-fields').style.display='none'; document.getElementById('sas-ptc-existing-fields').style.display='block'; (window.propostaTecnicaModule||window.propostaTecnicaModule).loadPtcListSas();">
                                PTC existente
                            </label>
                        </div>
                        <div id="sas-ptc-new-fields">
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="sas-ptc-number" class="form-control" value="carregando..." style="flex: 1; font-weight: 700;">
                                <input type="text" id="sas-ptc-title" class="form-control" placeholder="Título do Projeto" value="${this._escapeHtml(sourceData.projeto || '')}" style="flex: 2;">
                            </div>
                        </div>
                        <div id="sas-ptc-existing-fields" style="display: none;">
                            <select id="sas-ptc-select" class="form-control">
                                <option value="">Carregando PTCs...</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Cliente</label>
                            <input type="text" id="sas-cliente" class="form-control" value="${this._escapeHtml(sourceData.cliente || '')}">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Projeto</label>
                            <input type="text" id="sas-projeto" class="form-control" value="${this._escapeHtml(sourceData.projeto || '')}">
                        </div>
                    </div>
                    <div id="sas-status" style="font-size: 13px; color: #64748b; margin-top: 12px;"></div>
                </div>
                <div class="modal-footer" style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn btn-cancel" onclick="document.getElementById('modal-save-as').remove()">Cancelar</button>
                    <button class="btn btn-primary" id="sas-btn-confirmar" style="background: #1e3a8a; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-copy"></i> Salvar como Nova
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._sourceData = sourceData;
        if (window.app.generatePtcNumber) {
            window.app.generatePtcNumber().then(n => {
                const el = document.getElementById('sas-ptc-number');
                if (el) el.value = n;
            });
        }

        document.getElementById('sas-btn-confirmar').addEventListener('click', () => {
            this._confirmSaveAs(modal);
        });
    },

    loadPtcListSas() {
        const select = document.getElementById('sas-ptc-select');
        if (!select) return;
        const _tkPT6398 = store.getState().auth?.token;
        fetch('/api/list-ptcs', { headers: { ...(_tkPT6398 ? { 'Authorization': 'Bearer ' + _tkPT6398 } : {}) } })
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
        const statusEl = document.getElementById('sas-status');
        const btnConfirmar = document.getElementById('sas-btn-confirmar');
        const sourceData = modal._sourceData;
        if (!sourceData) return;

        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="ph ph-spinner" style="animation: spin 1s linear infinite;"></i> Salvando...';
        statusEl.textContent = 'Preparando...';

        try {
            const option = document.querySelector('input[name="sas-ptc-option"]:checked')?.value;
            const isDual = option === 'new-dual';
            const isNewPtc = option === 'new-dual' || option === 'new-single';
            let targetFolder = '';

            if (isNewPtc) {
                statusEl.textContent = 'Criando nova PTC...';
                const ptcNumber = document.getElementById('sas-ptc-number')?.value || '';
                const ptcTitle = document.getElementById('sas-ptc-title')?.value || '';
                const clientName = document.getElementById('sas-cliente')?.value || '';
                if (!ptcTitle) {
                    app.toast('Informe o título do projeto.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                    statusEl.textContent = '';
                    return;
                }
                targetFolder = await window.app.createPtcSimple(ptcNumber, ptcTitle, clientName);
            } else {
                targetFolder = document.getElementById('sas-ptc-select')?.value;
                if (!targetFolder) {
                    app.toast('Selecione uma PTC existente.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                    statusEl.textContent = '';
                    return;
                }
            }

            const options = {
                cliente: document.getElementById('sas-cliente')?.value || undefined,
                projeto: document.getElementById('sas-projeto')?.value || undefined
            };

            if (isDual) {
                statusEl.textContent = 'Salvando Proposta Técnica...';
                await window.app.duplicateProposal('tecnica', sourceData, targetFolder, options);
                statusEl.textContent = 'Salvando Proposta Comercial...';
                const comData = store.getState().activeCommercialProposal;
                if (comData) {
                    await window.app.duplicateProposal('comercial', comData, targetFolder, options);
                } else {
                    const now = new Date().toISOString();
                    const empty = {
                        id: crypto.randomUUID(),
                        cliente: options?.cliente || '',
                        projeto: options?.projeto || '',
                        codigo: 'PC-' + Date.now().toString(36).toUpperCase(),
                        objeto: '',
                        status: 'Rascunho',
                        data_emissao: now.split('T')[0],
                        createdAt: now,
                        updatedAt: now,
                        ptc_folder: targetFolder,
                        revisions: []
                    };
                    const _tk6478 = store.getState().auth?.token;
                    const res = await fetch('/api/save-proposal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(_tk6478 ? { 'Authorization': 'Bearer ' + _tk6478 } : {}) },
                        body: JSON.stringify({ ptcFolder: targetFolder, type: 'comercial', content: empty, revisionFolder: '0' })
                    });
                    const r = await res.json();
                    if (!r.success) throw new Error(r.error || 'Erro ao criar Proposta Comercial vazia');
                }
                window.app._ensurePipelineItemForPtc(targetFolder, options?.cliente || sourceData?.cliente || '', options?.projeto || sourceData?.projeto || '', 0, '', 'separado');
            } else {
                statusEl.textContent = 'Salvando cópia...';
                await window.app.duplicateProposal('tecnica', sourceData, targetFolder, options);
            }

            modal.remove();
            app.toast(`Proposta Salva com o N\u00famero ${targetFolder}. Favor ir em "Buscar PTC" e abrir a Proposta.`, 'info');
        } catch (e) {
            console.error('[saveAsNew]', e);
            app.toast('Erro: ' + e.message, 'error');
            statusEl.textContent = 'Erro: ' + e.message;
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
        }
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    getContactOptionsHTML(clientName, selectedValue = '') {

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

        if (contacts.length === 0) {
            return '<option value="">Nenhum contato encontrado</option>';
        }

        return contacts.map(c => `
            <option value="${c.nome}" ${selectedValue === c.nome ? 'selected' : ''}>${c.nome}</option>
        `).join('');

    },



    handleClientChange(clientName) {
        this.clearAiField('cliente');
        const sel = document.getElementById('pt_cliente');
        if (sel) { sel.classList.remove('ai-filled'); const lb = sel.closest('.form-group')?.querySelector('.ai-label'); if (lb) lb.remove(); }

        console.log("[PropostaTecnica] Client Change:", clientName);

        const slug = (s) => (s || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const clients = store.getState().clientes || [];
        const client = clients.find(c => slug(c.razaoSocial) === slug(clientName));

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

        let primeiroContato = contacts[0] || null;

        const aosCuidados = document.getElementById('pt_aos_cuidados');
        if (aosCuidados) {
            aosCuidados.innerHTML = this.getContactOptionsHTML(clientName);
            if (primeiroContato) {
                aosCuidados.value = primeiroContato.nome || '';
            }
        }

        // 2. Preencher email e telefone do contato
        const emailInput = document.getElementById('pt_email');
        const telInput = document.getElementById('pt_telefone');
        if (emailInput) emailInput.value = (primeiroContato && primeiroContato.email) || '';
        if (telInput) telInput.value = (primeiroContato && primeiroContato.telefone) || '';

        // 3. Buscar e preencher Cidade e UF
        const cidadeInput = document.getElementById('pt_cidade');
        const ufSelect = document.getElementById('pt_uf');
        const locInput = document.getElementById('pt_localizacao');

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

        // 4. Disparar preenchimento de email/telefone pelo contato selecionado
        if (aosCuidados && primeiroContato) {
            this.handleContactSelection(primeiroContato.nome);
        }

        // 5. Auto-carregar logo do cliente (só se a proposta não tiver um valor explicitamente salvo)
        const ptProposalData = store.getState().activeTechnicalProposal;
        const clPreview = document.getElementById('pt_client_logo_preview');
        const clContainer = document.getElementById('pt_client_logo_preview_container');
        const clInput = document.getElementById('pt_client_logo_base64');
        if (!ptProposalData?.client_logo_base64 && client && client.logo && clPreview && clContainer && clInput) {
            clPreview.src = client.logo;
            clContainer.style.display = 'block';
            clInput.value = client.logo;
        }

        // 6. Preencher Unidade do Cliente (AUTPRO) + contatos da unidade
        const unidadeSel = document.getElementById('pt_unidade_cliente');
        if (unidadeSel) {
            if (client) {
                const rawUnidades = (store.getState().unidadesCliente || []).filter(u => u.cliente_id === client.id);
                const unidades = rawUnidades.map(u => ({
                    ...u,
                    contatos: typeof u.contatos === 'string' ? JSON.parse(u.contatos) : (u.contatos || [])
                }));
                unidadeSel.innerHTML = '<option value="">Selecione uma unidade...</option>' +
                    unidades.map(u => `<option value="${u.codigo_unidade}">${u.codigo_unidade} - ${this._escapeHtml(u.nome_unidade || '')}</option>`).join('');

                const savedUnidade = ptProposalData?.unidade_cliente || window.app.currentPtc?.unidade_cliente || window.app.currentPtcInfo?.autpro?.codigoUnidade || '';
                if (savedUnidade && unidades.some(u => u.codigo_unidade === savedUnidade)) {
                    unidadeSel.value = savedUnidade;
                    if (ptProposalData) {
                        ptProposalData.unidade_cliente = savedUnidade;
                        store.setState({ activeTechnicalProposal: ptProposalData });
                    }
                    this.handleUnidadeChange(savedUnidade);
                }
            } else {
                unidadeSel.innerHTML = '<option value="">Selecione um cliente primeiro...</option>';
            }
        }

    },

    handleUnidadeChange(codigoUnidade) {
        if (!codigoUnidade) return;
        const clientName = document.getElementById('pt_cliente')?.value;
        if (!clientName) return;

        const slug = (s) => (s || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const client = store.getState().clientes.find(c => slug(c.razaoSocial) === slug(clientName));
        if (!client) return;

        const raw = (store.getState().unidadesCliente || []).find(u => u.cliente_id === client.id && u.codigo_unidade === codigoUnidade);
        if (!raw) return;
        const unidade = { ...raw, contatos: typeof raw.contatos === 'string' ? JSON.parse(raw.contatos) : (raw.contatos || []) };
        const contacts = unidade.contatos || [];

        const data = store.getState().activeTechnicalProposal;
        if (data) {
            data.unidade_cliente = codigoUnidade;
            store.setState({ activeTechnicalProposal: data });
        }

        const aosCuidados = document.getElementById('pt_aos_cuidados');
        if (aosCuidados) {
            if (contacts.length > 0) {
                aosCuidados.innerHTML = contacts.map((c, i) =>
                    `<option value="${this._escapeHtml(c.nome)}" ${i === 0 ? 'selected' : ''}>${this._escapeHtml(c.nome || '')}</option>`
                ).join('');
            } else {
                aosCuidados.innerHTML = '<option value="">Nenhum contato na unidade</option>';
            }
        }

        const primeiro = contacts[0] || null;
        const emailInput = document.getElementById('pt_email');
        const telInput = document.getElementById('pt_telefone');
        const celInput = document.getElementById('pt_celular');
        if (emailInput) emailInput.value = (primeiro && primeiro.email) || '';
        if (telInput) telInput.value = (primeiro && primeiro.telefone) || '';
        if (celInput) celInput.value = (primeiro && primeiro.celular) || '';
    },

    updateContactDropdown(clientName) {

        // Mantido para compatibilidade, mas redireciona para a nova lógica

        this.handleClientChange(clientName);

    },



    handleContactSelection(contactName) {

        const clientName = document.getElementById('pt_cliente').value;
        const isAUTPRO = store.getState().company?.folderName?.startsWith('AUT_');

        // Para AUTPRO, buscar contatos da unidade selecionada
        if (isAUTPRO) {
            const codigoUnidade = document.getElementById('pt_unidade_cliente')?.value;
            if (codigoUnidade) {
                const slug = (s) => (s || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
                const client = store.getState().clientes.find(c => slug(c.razaoSocial) === slug(clientName));
                if (client) {
                    const raw = (store.getState().unidadesCliente || []).find(u => u.cliente_id === client.id && u.codigo_unidade === codigoUnidade);
                    if (raw) {
                        const unidade = { ...raw, contatos: typeof raw.contatos === 'string' ? JSON.parse(raw.contatos) : (raw.contatos || []) };
                        const contact = (unidade.contatos || []).find(c => c.nome === contactName);
                        if (contact) {
                            const emailInput = document.getElementById('pt_email');
                            const telInput = document.getElementById('pt_telefone');
                            const celInput = document.getElementById('pt_celular');
                            if (emailInput) emailInput.value = contact.email || '';
                            if (telInput) telInput.value = contact.telefone || '';
                            if (celInput) celInput.value = contact.celular || '';
                        }
                        return;
                    }
                }
            }
        }

        // Fallback: buscar contatos do cliente
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
            const emailInput = document.getElementById('pt_email');
            const telInput = document.getElementById('pt_telefone');
            if (emailInput) emailInput.value = contact.email || '';
            if (telInput) telInput.value = contact.telefone || '';
        }

    },



    handleLogoUpload(input) {

        if (!input.files || !input.files[0]) return;

        const reader = new FileReader();

        reader.onload = (e) => {

            const base64 = e.target.result;

            document.getElementById('pt_logo_preview').src = base64;

            document.getElementById('pt_logo_preview_container').style.display = 'block';

            document.getElementById('pt_logo_base64').value = base64;

        };

        reader.readAsDataURL(input.files[0]);

    },



    handleClientLogoUpload(input) {

        if (!input.files || !input.files[0]) return;

        const reader = new FileReader();

        reader.onload = (e) => {

            const base64 = e.target.result;

            document.getElementById('pt_client_logo_preview').src = base64;

            document.getElementById('pt_client_logo_preview_container').style.display = 'block';

            document.getElementById('pt_client_logo_base64').value = base64;

        };

        reader.readAsDataURL(input.files[0]);

    },

    removeClientLogo() {
        const preview = document.getElementById('pt_client_logo_preview');
        const container = document.getElementById('pt_client_logo_preview_container');
        const hidden = document.getElementById('pt_client_logo_base64');
        if (preview) preview.src = '';
        if (container) container.style.display = 'none';
        if (hidden) hidden.value = '';
    },


    handleWatermarkUpload(input) {

        if (!input.files || !input.files[0]) return;

        const reader = new FileReader();

        reader.onload = (e) => {

            const base64 = e.target.result;

            document.getElementById('pt_watermark_preview').src = base64;

            document.getElementById('pt_watermark_preview_container').style.display = 'block';

            document.getElementById('pt_watermark_base64').value = base64;

        };

        reader.readAsDataURL(input.files[0]);

    },



    async edit(proposal) {

        this.viewMode = 'form';

        this.activeTab = 'geral';

        this.activeEquipmentIndex = 0;

        this.activeSubTab = 'technical';

        this.cargasSubView = 'edit';

        

        // Migração para estrutura hierárquica se necessário
        // Só cria TAG-MIGRADO se houver dados legados para preservar

        if (!proposal.equipments || proposal.equipments.length === 0) {

            if (proposal.detailedLoadItems?.length || proposal.norms?.length) {

                proposal.equipments = [{

                    id: Date.now(),

                    tag: 'TAG-MIGRADO',

                    type: 'CCM-BT',

                    norms: proposal.norms || [],

                    technical: { tensao: '380V' },

                    loads: proposal.detailedLoadItems || []

                }];

            } else {

                proposal.equipments = [];

            }

        }

        

        // Deep copy para evitar mutacao cruzada entre propostas
        const proposalCopy = JSON.parse(JSON.stringify(proposal));

        // Migração: se tem localizacao mas não tem cidade/uf, parsear
        if (!proposalCopy.cidade && !proposalCopy.uf && proposalCopy.localizacao) {
            const loc = proposalCopy.localizacao;
            let sep = loc.includes('/') ? '/' : loc.includes('-') ? '-' : null;
            if (sep) {
                const parts = loc.split(sep);
                if (parts.length >= 2) {
                    proposalCopy.cidade = parts.slice(0, -1).join(sep).trim();
                    proposalCopy.uf = parts[parts.length - 1].trim().toUpperCase();
                }
            }
        }

        store.setState({ activeTechnicalProposal: proposalCopy });

        this.renderModal(proposalCopy);

        // Buscar documentos do cliente na pasta Documentação Cliente
        const ptcFolder = proposalCopy.ptc_folder || window.app.currentPtc?.folder;
        if (ptcFolder) {
            this._fetchClientDocuments(ptcFolder);
        }

        if (proposalCopy.cliente) {
            setTimeout(() => this.updateContactDropdown(proposalCopy.cliente), 50);
        }
    },

    async _fetchClientDocuments(ptcFolder) {
        if (!ptcFolder) return;
        try {
            const _tk = store.getState().auth?.token;
            const headers = _tk ? { 'Authorization': 'Bearer ' + _tk } : {};
            const res = await fetch(`/api/list-ptc-files?ptc=${encodeURIComponent(ptcFolder)}&subfolder=${encodeURIComponent('Documentação Cliente')}`, { headers });
            const data = await res.json();
            if (data.success) {
                const state = store.getState().activeTechnicalProposal;
                if (state) {
                    state.clientDocuments = data.files;
                    store.setState({ activeTechnicalProposal: state });
                    const section = document.getElementById('client-docs-section');
                    if (section) {
                        section.style.display = data.files.length ? 'block' : 'none';
                        const listEl = section.querySelector('div');
                        if (listEl) {
                            listEl.innerHTML = data.files.map(d =>
                                `<span style="display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;border:1px solid #e2e8f0;padding:4px 10px;border-radius:6px;font-size:12px;color:#334155;">
                                    <i class="ph ph-file"></i> ${d.nome}
                                </span>`
                            ).join('');
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Erro ao buscar documentos do cliente:', e);
        }
    },


    switchCargasSubView(view) {

        this.captureEquipmentData();

        this.cargasSubView = view;

        this.renderModal(store.getState().activeTechnicalProposal);

    },



    renderLoadsEdit(eq, tipicos) {

        return `

            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 15px;">

                <div style="display: flex; gap: 8px; align-items: center;">

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.clearLoads()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-trash"></i> Limpar

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.importLoads()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-microsoft-excel-logo"></i> Importar Excel

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.loadLoadsModel()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-tray-arrow-down"></i> Carregar Modelo

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.saveLoadsList()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-floppy-disk"></i> Salvar Lista

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.addLoadRow()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px; padding: 6px 12px; font-weight: 700;">

                        <i class="ph ph-plus"></i> ${eq && eq.type === 'CUB-MT' ? 'Novo Cubículo' : 'Nova Carga'}

                    </button>

                </div>

            </div>



            <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 4px; overflow-x: auto; background: white;">

                <table class="w-full" style="font-size: 10px; border-collapse: collapse; min-width: 1000px;">

                    <thead>

                        <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff; text-transform: uppercase;">

                            <th style="padding: 10px; text-align: center; width: 30px; color:#fff;"><i class="ph ph-grip-vertical" style="opacity: 0.5;"></i></th>

                            <th style="padding: 10px; text-align: left; width: 60px; color:#fff;">TAG</th>

                            <th style="padding: 10px; text-align: left; width: 320px; color:#fff;">DESCRIÇÃO</th>

                            <th style="padding: 10px; text-align: center; width: 80px; color:#fff;">${eq && eq.type === 'CUB-MT' ? 'TENSÃO NOMINAL (KV)' : 'POTÊNCIA (CV)'}</th>

                            <th style="padding: 10px; text-align: center; width: 80px; color:#fff;">${eq && eq.type === 'CUB-MT' ? 'CORRENTE NOMINAL (A)' : 'TENSÃO (V)'}</th>

                            <th style="padding: 10px; text-align: center; width: 80px; color:#fff;">${eq && eq.type === 'CUB-MT' ? 'ICC(KA)(1S)' : 'COR. APROX (A)'}</th>

                            <th style="padding: 10px; text-align: center; width: 140px; color:#fff;">${eq && eq.type === 'CUB-MT' ? 'INSTALAÇÃO' : 'REGIME DE TRABALHO'}</th>

                            <th style="padding: 10px; text-align: center; width: 60px; color:#fff;">TIPO</th>

                            <th style="padding: 10px; text-align: left; color:#fff;">${eq && eq.type === 'CUB-MT' ? 'TÍPICO DE CUBÍCULO (COMPOSIÇÃO)' : 'TÍPICO DE PARTIDA (COMPOSIÇÃO)'}</th>

                            <th style="padding: 10px; width: 85px; color:#fff;"></th>

                        </tr>

                    </thead>

                    <tbody id="loads-body">

                        ${(eq.loads || []).map((load, idx) => `

                            <tr class="detailed-load-row"
                                draggable="true"
                                ondragstart="event.dataTransfer.setData('text/plain',${idx}); this.classList.add('dragging')"
                                ondragend="this.classList.remove('dragging')"
                                ondragover="event.preventDefault(); this.classList.add('drag-over')"
                                ondragleave="this.classList.remove('drag-over')"
                                ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveLoad(parseInt(event.dataTransfer.getData('text/plain')),${idx})"
                                style="border-bottom: 1px solid #f1f5f9;">

                                <td style="padding: 4px; width: 30px;"><i class="ph ph-grip-vertical" style="opacity: 0.3; font-size: 14px; cursor: grab;"></i></td>

                                <td style="padding: 4px;"><input type="text" name="dload_tag_${idx}" class="form-control" value="${load.tag || ''}" style="font-size: 11px; font-weight: 700; text-align: center; border-radius: 4px; height: 32px;"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_desc_${idx}" class="form-control" value="${load.desc || ''}" style="font-size: 11px; border-radius: 4px; height: 32px;"></td>

                                ${eq && eq.type === 'CUB-MT' ? `
                                <td style="padding: 4px;"><input type="text" name="dload_power_${idx}" class="form-control" value="${load.power || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_tensao_${idx}" class="form-control" value="${load.tensao || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_current_${idx}" class="form-control" value="${load.current || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; background: #f8fafc; height: 32px;" readonly></td>

                                <td style="padding: 4px;">

                                    <select name="dload_regime_${idx}" class="form-control" style="font-size: 11px; height: 32px; border-radius: 4px; text-align: center; padding: 0 4px;">

                                        <option value="Abrigada" ${load.regime === 'Abrigada' ? 'selected' : ''}>Abrigada</option>

                                        <option value="Ao Tempo" ${load.regime === 'Ao Tempo' ? 'selected' : ''}>Ao Tempo</option>

                                    </select>

                                </td>

                                <td style="padding: 4px;">

                                    <select name="dload_type_${idx}" class="form-control" style="text-align: center; font-size: 11px; font-weight: 700; border-radius: 4px; height: 32px;" onchange="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})">

                                        <option value="">-- Selecione --</option>

                                        <option value="CE" ${load.type === 'CE' ? 'selected' : ''}>CE</option>

                                        <option value="CS" ${load.type === 'CS' ? 'selected' : ''}>CS</option>

                                        <option value="CM" ${load.type === 'CM' ? 'selected' : ''}>CM</option>

                                        <option value="CP" ${load.type === 'CP' ? 'selected' : ''}>CP</option>

                                        <option value="CT" ${load.type === 'CT' ? 'selected' : ''}>CT</option>

                                        <option value="CPS" ${load.type === 'CPS' ? 'selected' : ''}>CPS</option>

                                        <option value="CAN" ${load.type === 'CAN' ? 'selected' : ''}>CAN</option>

                                    </select>

                                </td>` : `
                                <td style="padding: 4px;"><input type="text" name="dload_power_${idx}" class="form-control" value="${load.power || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.calculateApproxCurrent(${idx});window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_tensao_${idx}" class="form-control" value="${load.tensao || '380'}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.calculateApproxCurrent(${idx});window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_current_${idx}" class="form-control" value="${load.current || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; background: #f8fafc; height: 32px;" readonly></td>

                                <td style="padding: 4px;">

                                    <select name="dload_regime_${idx}" class="form-control" style="font-size: 11px; height: 32px; border-radius: 4px; text-align: center; padding: 0 4px;">

                                        <option value="S1" ${load.regime === 'S1' ? 'selected' : ''}>S1 (Constante)</option>

                                        <option value="S2" ${load.regime === 'S2' ? 'selected' : ''}>S2 (Curta)</option>

                                        <option value="S3" ${load.regime === 'S3' ? 'selected' : ''}>S3 (Intermit.)</option>

                                    </select>

                                </td>

                                <td style="padding: 4px;"><input type="text" name="dload_type_${idx}" class="form-control" value="${load.type || 'IF'}" style="text-align: center; font-size: 11px; font-weight: 700; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>`}

                                <td style="padding: 4px;">

                                    <select name="dload_typicalId_${idx}" class="form-control" style="font-size: 11px; height: 32px; background: #fffbeb; border-color: #fde68a; border-radius: 4px; padding: 0 8px;" onchange="window.propostaTecnicaModule.updateLoadFromTypical(${idx})">

                                        <option value="">-- Selecione --</option>

                                        ${tipicos.map(t => `<option value="${t.id}" ${load.typicalId === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}

                                    </select>

                                </td>

                                <td style="padding: 4px; text-align: center;">

                                    <div style="display: flex; gap: 2px; justify-content: center;">

                                        ${store.canEdit() ? `<button type="button" onclick="window.propostaTecnicaModule.duplicateLoad(${idx})" class="btn-icon" style="color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; width: 26px; height: 26px; border-radius: 4px;" title="Duplicar"><i class="ph ph-copy"></i></button>` : ''}

                                        ${store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeLoad(${idx})" class="btn-icon" style="color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; width: 26px; height: 26px; border-radius: 4px;" title="Excluir"><i class="ph ph-trash"></i></button>` : ''}

                                    </div>

                                </td>

                            </tr>

                        `).join('')}

                        ${(eq.loads || []).length === 0 ? '<tr><td colspan="10" style="padding: 40px; text-align: center; color: #94a3b8;">Nenhuma carga definida. Clique em "+ Nova Carga" ou importe do Excel.</td></tr>' : ''}

                    </tbody>

                </table>

            </div>

        `;

    },



    addLoadRow() {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        if (!eq.loads) eq.loads = [];

        if (eq && eq.type === 'CUB-MT') {
            eq.loads.push({ tag: `C${eq.loads.length + 1}`, desc: '', power: '', tensao: '', regime: 'Abrigada', type: '' });
        } else {
            eq.loads.push({ tag: `M${eq.loads.length + 1}`, desc: '', power: '', tensao: '380', regime: 'S1', type: 'IF' });
        }

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    duplicateLoad(index) {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        const source = eq.loads[index];

        eq.loads.splice(index + 1, 0, { ...source, tag: source.tag + '_COPY' });

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    removeLoad(index) {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        eq.loads.splice(index, 1);

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    clearLoads() {

        if (!confirm('Deseja realmente apagar TODAS as cargas deste painel?')) return;

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        eq.loads = [];

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    calculateApproxCurrent(index) {

        const row = document.querySelectorAll('.detailed-load-row')[index];

        if (!row) return;

        const powerInput = row.querySelector(`[name="dload_power_${index}"]`);

        const tensaoInput = row.querySelector(`[name="dload_tensao_${index}"]`);

        const currentInput = row.querySelector(`[name="dload_current_${index}"]`);

        

        const power = parseFloat((powerInput.value || '0').replace(',', '.'));

        const tensao = parseFloat((tensaoInput.value || '380').replace(',', '.'));

        

        if (power > 0 && tensao > 0) {

            // Cálculo simplificado: I = (P_cv * 735.5) / (sqrt(3) * V * FP * Rend)

            // Usando FP=0.85 e Rend=0.90 como padrão médio

            const current = (power * 735.5) / (Math.sqrt(3) * tensao * 0.85 * 0.90);

            currentInput.value = current.toFixed(2).replace('.', ',');

        } else {

            currentInput.value = '';

        }

    },

    filterTypicalsByLoad(index) {

        const row = document.querySelectorAll('.detailed-load-row')[index];

        if (!row) return;

        const isCubMt = (() => {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            return eq && eq.type === 'CUB-MT';
        })();

        const powerInput = row.querySelector(`[name="dload_power_${index}"]`);

        const tensaoInput = row.querySelector(`[name="dload_tensao_${index}"]`);

        const typeInput = row.querySelector(`[name="dload_type_${index}"]`);

        const select = row.querySelector(`select[name="dload_typicalId_${index}"]`);

        if (!select) return;

        const powerVal = (powerInput?.value || '').trim();

        const tensaoVal = (tensaoInput?.value || '').trim();

        const typeVal = (typeInput?.value || '').trim();

        const currentSelected = select.value;

        if (isCubMt) {

            const cubiculos = store.getState().cubiculos || [];

            let filtered = cubiculos;

            if (powerVal) {
                filtered = filtered.filter(t => {
                    const tTensao = (t.tensao || '').trim();
                    return tTensao === powerVal || tTensao.startsWith(powerVal);
                });
            }

            if (tensaoVal) {
                filtered = filtered.filter(t => {
                    const tCorrente = (t.correnteNominal || '').trim();
                    return tCorrente === tensaoVal || tCorrente.startsWith(tensaoVal);
                });
            }

            if (typeVal) {
                const cubTypeSiglaToNome = {
                    'CE': 'Cubículo de Entrada',
                    'CS': 'Cubículo de Seccionamento',
                    'CM': 'Cubículo de Medição',
                    'CP': 'Cubículo de Proteção',
                    'CT': 'Cubículo de Transformação',
                    'CPS': 'Cubículo de Proteção Contra Surto',
                    'CAN': 'Cubículo Aterramento de Neutro'
                };
                const tipoNome = cubTypeSiglaToNome[typeVal.toUpperCase()];
                if (tipoNome) {
                    filtered = filtered.filter(t => t.tipoAcionamento === tipoNome);
                } else {
                    filtered = filtered.filter(t =>
                        (t.tipoAcionamento || '').toLowerCase().includes(typeVal.toLowerCase())
                    );
                }
            }

            select.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = filtered.length > 0 ? '-- Selecione --' : '-- Nenhum típico encontrado --';
            select.appendChild(defaultOption);

            filtered.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.nome;
                select.appendChild(option);
            });

            if (currentSelected && filtered.some(t => t.id === currentSelected)) {
                select.value = currentSelected;
            }

            return;

        }

        const tipicos = store.getState().tipicos || [];

        const typeToTipoAcionamento = {
            'IF': 'Inversor de Frequência',
            'SS': 'Soft-Starter',
            'PD': 'Partida Direta',
            'PDR': 'Partida Direta Reversora',
            'ET': 'Estrela-Triângulo',
            'AL': 'Alimentador',
            'EG': 'Entrada Geral',
            'ME': 'Medição',
            'CS': 'Comando e Sinalização',
            'SA': 'Serviços Auxiliares',
            'BC': 'Banco de Capacitores',
            'PNMT': 'Cubículo MT'
        };

        let filtered = tipicos;

        if (powerVal) {
            const powerNum = parseFloat(powerVal.replace(',', '.'));
            if (!isNaN(powerNum)) {
                filtered = filtered.filter(t => {
                    const tPower = parseFloat((t.potencia || t.potenciaKvar || '').replace(',', '.'));
                    return !isNaN(tPower) && tPower === powerNum;
                });
            }
        }

        if (tensaoVal) {
            filtered = filtered.filter(t => {
                const tTensao = (t.tensao || '').trim();
                return tTensao === tensaoVal || tTensao.startsWith(tensaoVal + '/');
            });
        }

        if (typeVal) {
            const tipoAcionamento = typeToTipoAcionamento[typeVal.toUpperCase()];
            if (tipoAcionamento) {
                filtered = filtered.filter(t => t.tipoAcionamento === tipoAcionamento);
            } else {
                filtered = filtered.filter(t =>
                    (t.tipoAcionamento || '').toLowerCase().includes(typeVal.toLowerCase())
                );
            }
        }

        select.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = filtered.length > 0 ? '-- Selecione --' : '-- Nenhum típico encontrado --';
        select.appendChild(defaultOption);

        filtered.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.nome;
            select.appendChild(option);
        });

        if (currentSelected && filtered.some(t => t.id === currentSelected)) {
            select.value = currentSelected;
        }

    },

    renderIOList(eq) {
        const io = eq.ioList || { racks: [] };
        const racks = io.racks || [];
        const isEmpty = racks.length === 0;
        const totals = this._calcIOTotals(racks);

        const sel = (v, options) => options.map(o =>
            `<option value="${o}" ${v === o ? 'selected' : ''}>${o}</option>`
        ).join('');

        return `
            <div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
                    <div style="flex: 1; min-width: 140px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #1d4ed8;">${totals.totalDI}</div>
                        <div style="font-size: 11px; color: #3b82f6; font-weight: 600;">Entradas Digitais</div>
                        <div style="font-size: 10px; color: #60a5fa;">${totals.spareDI} reservas</div>
                    </div>
                    <div style="flex: 1; min-width: 140px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #15803d;">${totals.totalDO}</div>
                        <div style="font-size: 11px; color: var(--color-accent); font-weight: 600;">Saídas Digitais</div>
                        <div style="font-size: 10px; color: #4ade80;">${totals.spareDO} reservas</div>
                    </div>
                    <div style="flex: 1; min-width: 140px; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #a16207;">${totals.totalAI}</div>
                        <div style="font-size: 11px; color: #ca8a04; font-weight: 600;">Entradas Analógicas</div>
                        <div style="font-size: 10px; color: #eab308;">${totals.spareAI} reservas</div>
                    </div>
                    <div style="flex: 1; min-width: 140px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #c2410c;">${totals.totalAO}</div>
                        <div style="font-size: 11px; color: #ea580c; font-weight: 600;">Saídas Analógicas</div>
                        <div style="font-size: 10px; color: #f97316;">${totals.spareAO} reservas</div>
                    </div>
                </div>

                <div style="margin-bottom: 16px; display: flex; gap: 8px; align-items: center;">
                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.addIORack()" style="background: #0f172a; color: white; font-size: 11px; border-radius: 4px; padding: 6px 12px; font-weight: 700;">
                        <i class="ph ph-plus"></i> Novo Rack
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.importIOList()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-microsoft-excel-logo"></i> Importar Excel
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.loadIOTemplate()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-tray-arrow-down"></i> Carregar Template
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.saveIOTemplate()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-floppy-disk"></i> Salvar Template
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.openIOTypeTypicals()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-gear-six"></i> Típicos I/O
                    </button>
                    <div style="position:relative;display:inline-block;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.toggleIOExportMenu()" style="font-size: 11px; border-radius: 4px;">
                            <i class="ph ph-download-simple"></i> Exportar ▾
                        </button>
                        <div id="io-export-menu" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:white;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;min-width:140px;overflow:hidden;">
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportIOListCSV()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;border-bottom:1px solid #f1f5f9;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-csv" style="color:var(--color-accent);"></i> CSV
                            </a>
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportIOListXLSX()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-xls" style="color:#3b82f6;"></i> XLSX (Formatado)
                            </a>
                        </div>
                    </div>
                </div>

                ${isEmpty ? `
                    <div style="padding: 60px; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 8px;">
                        <i class="ph ph-plugs" style="font-size: 48px; opacity: 0.2;"></i>
                        <p style="margin-top: 10px;">Nenhum rack configurado. Clique em "+ Novo Rack" ou importe do Excel.</p>
                    </div>
                ` : racks.map((rack, ri) => {
        const rackFab = this._getRackFabricante(rack, eq);
        const rackPH = this._getRackPlaceholders(rackFab);
        return `
                    <div class="io-rack-row" style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; overflow: hidden; background: white;">
                        <div style="background: #f1f5f9; padding: 10px 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-weight: 700; font-size: 13px; color: #1e293b; min-width: 60px;">Rack ${ri + 1}</span>
                            <input type="text" name="io_rack_pos_${ri}" value="${rack.position ?? ri + 1}" placeholder="Pos." style="width: 50px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">Fabr.:</span>
                            <select name="io_rack_fabricante_${ri}" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 3px 4px;" onchange="window.propostaTecnicaModule.onRackFabricanteChange(${ri})">
                                <option value="" ${!rack.fabricante ? 'selected' : ''}>Herdar</option>
                                <option value="Allen-Bradley" ${rack.fabricante === 'Allen-Bradley' ? 'selected' : ''}>Allen-Bradley</option>
                                <option value="Siemens" ${rack.fabricante === 'Siemens' ? 'selected' : ''}>Siemens</option>
                                <option value="ABB" ${rack.fabricante === 'ABB' ? 'selected' : ''}>ABB</option>
                                <option value="Schneider Electric" ${rack.fabricante === 'Schneider Electric' ? 'selected' : ''}>Schneider Electric</option>
                                <option value="WEG" ${rack.fabricante === 'WEG' ? 'selected' : ''}>WEG</option>
                                <option value="Phoenix Contact" ${rack.fabricante === 'Phoenix Contact' ? 'selected' : ''}>Phoenix Contact</option>
                                <option value="Mitsubishi" ${rack.fabricante === 'Mitsubishi' ? 'selected' : ''}>Mitsubishi</option>
                                <option value="Omron" ${rack.fabricante === 'Omron' ? 'selected' : ''}>Omron</option>
                            </select>
                            <label style="font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer; color: #64748b;">
                                <input type="checkbox" name="io_rack_compact_${ri}" value="1" ${rack.compactMode ? 'checked' : ''} onchange="window.propostaTecnicaModule.toggleRackCompactMode(${ri})" style="width: 14px; height: 14px; accent-color: #6366f1;">
                                Compacto
                            </label>
                            ${rack.compactMode ? `
                            <span style="font-size: 11px; color: #64748b;">Modelo:</span>
                            <input type="text" name="io_rack_modelo_${ri}" value="${rack.modelo || ''}" placeholder="${rackPH.modelo}" style="width: 180px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            ` : `
                            <span style="font-size: 11px; color: #64748b;">BP:</span>
                            <input type="text" name="io_rack_bp_${ri}" value="${rack.backplane || ''}" placeholder="${rackPH.bp}" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">Fonte:</span>
                            <input type="text" name="io_rack_ps_${ri}" value="${rack.powerSupply || ''}" placeholder="${rackPH.ps}" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">CPU:</span>
                            <input type="text" name="io_rack_cpu_${ri}" value="${rack.cpu || ''}" placeholder="${rackPH.cpu}" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">COMM:</span>
                            <input type="text" name="io_rack_comm_${ri}" value="${rack.comm || ''}" placeholder="${rackPH.comm}" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            `}
                            <div style="flex:1;"></div>
                            <button type="button" onclick="window.propostaTecnicaModule.duplicateIORack(${ri})" class="btn-icon" style="color: #64748b; background: white; border: 1px solid #e2e8f0; width: 26px; height: 26px; border-radius: 4px;" title="Duplicar Rack"><i class="ph ph-copy"></i></button>
                            <button type="button" onclick="window.propostaTecnicaModule.addIOSlot(${ri})" class="btn-icon" style="color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; width: 26px; height: 26px; border-radius: 4px;" title="Adicionar Slot"><i class="ph ph-plus"></i></button>
                            ${store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeIORack(${ri})" class="btn-icon" style="color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; width: 26px; height: 26px; border-radius: 4px;" title="Excluir Rack"><i class="ph ph-trash"></i></button>` : ''}
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="font-size: 10px; border-collapse: collapse; width: 100%;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 6px 6px; text-align: center; width: 36px;">Slot</th>
                                        <th style="padding: 6px 6px; text-align: left; width: 100px;">Módulo (PN)</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 56px;">Tipo</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 66px;">Sinal</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 42px;">N°Ch</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 44px;">Can.</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 36px;">Tp</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 46px;">Nv</th>
                                        <th style="padding: 6px 6px; text-align: left; width: 72px;">Tag</th>
                                        <th style="padding: 6px 6px; text-align: left;">Dispositivo de Campo</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 48px;">Borne</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 42px;">Status</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 50px;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(rack.slots || []).length === 0 ? `
                                        <tr>
                                            <td colspan="13" style="padding: 20px; text-align: center; color: #94a3b8;">
                                                Nenhum slot. <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.addIOSlot(${ri})" style="color: #3b82f6;">Adicionar slot</a>
                                            </td>
                                        </tr>
                                    ` : (rack.slots || []).map((slot, si) => {
                                        const channels = slot.channels || [];
                                        const slotTypeOptions = ['DI','DO','AI','AO','TC','RTD','COMM','CNT','PS'];
                                        const chTypeOptions = ['DI','DO','AI','AO','TC','RTD'];
                                        const signalOptions = ['24VDC','48VDC','120VAC','220VAC','0-10V','4-20mA','0-5V','TC-K','TC-J','PT100','RTD','Termopar'];
                                        const statusOptions = ['active','spare','unused','critical'];
                                        if (channels.length === 0) {
                                            return `
                                                <tr class="io-slot-row" style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_pos_${ri}_${si}" value="${slot.position ?? si + 1}" style="width:28px;text-align:center;font-size:10px;font-weight:700;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_pn_${ri}_${si}" value="${slot.modulePartNumber || ''}" placeholder="PN" style="width:92px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px;"><select name="io_slot_type_${ri}_${si}" style="width:52px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(slot.moduleType, slotTypeOptions)}</select></td>
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_signal_${ri}_${si}" value="${slot.signalType || ''}" placeholder="Sinal" style="width:58px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_channels_${ri}_${si}" value="${slot.totalChannels ?? ''}" style="width:34px;text-align:center;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                    <td colspan="${store.canDelete() ? 7 : 8}" style="padding: 3px 6px; text-align: center; color: #94a3b8;">
                                                        Sem canais
                                                        <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.addIOChannel(${ri},${si})" style="color:#3b82f6;margin-left:8px;">+ canal</a>
                                                    </td>
                                                    ${store.canDelete() ? `<td style="padding: 3px 6px; text-align: center;"><button type="button" onclick="window.propostaTecnicaModule.removeIOSlot(${ri},${si})" class="btn-icon" style="color:#ef4444;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Excluir Slot"><i class="ph ph-x-circle"></i></button></td>` : ''}
                                                </tr>
                                            `;
                                        }
                                        return channels.map((ch, ci) => `
                                            <tr class="io-channel-row" style="border-bottom: 1px solid #f1f5f9;">
                                                ${ci === 0 ? `
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_pos_${ri}_${si}" value="${slot.position ?? si + 1}" style="width:28px;text-align:center;font-size:10px;font-weight:700;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_pn_${ri}_${si}" value="${slot.modulePartNumber || ''}" placeholder="PN" style="width:92px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><select name="io_slot_type_${ri}_${si}" style="width:52px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(slot.moduleType, slotTypeOptions)}</select></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_signal_${ri}_${si}" value="${slot.signalType || ''}" placeholder="Sinal" style="width:58px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_channels_${ri}_${si}" value="${slot.totalChannels ?? ''}" style="width:34px;text-align:center;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                ` : ''}
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_num_${ri}_${si}_${ci}" value="${ch.channelNumber ?? ci}" style="width:32px;text-align:center;font-size:10px;font-weight:600;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                <td style="padding: 3px 6px;"><select name="io_ch_type_${ri}_${si}_${ci}" style="width:36px;font-size:9px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(ch.channelType || slot.moduleType || 'DI', chTypeOptions)}</select></td>
                                                <td style="padding: 3px 6px;"><select name="io_ch_signal_${ri}_${si}_${ci}" style="width:44px;font-size:9px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(ch.signalLevel || slot.signalType || '24VDC', signalOptions)}</select></td>
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_tag_${ri}_${si}_${ci}" value="${ch.tag || ''}" placeholder="Tag" style="width:84px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_device_${ri}_${si}_${ci}" value="${ch.fieldDevice || ''}" placeholder="Dispositivo" style="width:300px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_terminal_${ri}_${si}_${ci}" value="${ch.terminalNumber || ''}" placeholder="Borne" style="width:40px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                <td style="padding: 3px 6px;">
                                                    <select name="io_ch_status_${ri}_${si}_${ci}" style="width:42px;font-size:9px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;background:${ch.status === 'spare' ? '#fef3c7' : ch.status === 'critical' ? '#fef2f2' : '#fff'};">
                                                        ${sel(ch.status || 'active', statusOptions)}
                                                    </select>
                                                </td>
                                                <td style="padding: 3px 6px; white-space: nowrap;">
                                                    ${ci === 0 ? `<button type="button" onclick="window.propostaTecnicaModule.addIOChannel(${ri},${si})" class="btn-icon" style="color:#15803d;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Add Canal"><i class="ph ph-plus-circle"></i></button>` : `<button type="button" onclick="window.propostaTecnicaModule.addIOChannel(${ri},${si})" class="btn-icon" style="color:#15803d;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Add Canal"><i class="ph ph-plus-circle"></i></button>`}
                                                    ${store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeIOChannel(${ri},${si},${ci})" class="btn-icon" style="color:#ef4444;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Excluir Canal"><i class="ph ph-minus-circle"></i></button>` : ''}
                                                    ${ci === 0 && store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeIOSlot(${ri},${si})" class="btn-icon" style="color:#ef4444;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Excluir Slot"><i class="ph ph-x-circle"></i></button>` : ''}
                                                </td>
                                            </tr>
                                        `).join('');
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }).join('')}
            </div>
        `;
    },

    toggleIOExportMenu() {
        const menu = document.getElementById('io-export-menu');
        if (!menu) return;
        const isOpen = menu.style.display !== 'none';
        menu.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) {
            const close = (e) => {
                if (!menu.contains(e.target) && e.target !== menu.previousElementSibling) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        }
    },

    exportIOListCSV() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const racks = io.racks || [];
        if (racks.length === 0) { app.toast('Nenhum dado de I/O para exportar.', 'warning'); return; }

        const rows = [['Rack','Slot','Módulo (PN)','Tipo Módulo','Sinal','NºCh','Ch#','Tipo','Nível Sinal','Tag','Dispositivo de Campo','Borne','Wire Color','Wire #','Cable ID','Junction Box','Status','Notas']];
        racks.forEach((rack, ri) => {
            (rack.slots || []).forEach((slot, si) => {
                const channels = slot.channels || [];
                if (channels.length === 0) {
                    rows.push([rack.position ?? ri + 1, slot.position ?? si + 1, slot.modulePartNumber || '', slot.moduleType || '', slot.signalType || '', slot.totalChannels ?? '', '', '', '', '', '', '', '', '', '', '', '', '']);
                } else {
                    channels.forEach((ch, ci) => {
                        rows.push([
                            rack.position ?? ri + 1,
                            slot.position ?? si + 1,
                            slot.modulePartNumber || '',
                            slot.moduleType || '',
                            slot.signalType || '',
                            slot.totalChannels ?? '',
                            ch.channelNumber ?? ci,
                            ch.channelType || slot.moduleType || '',
                            ch.signalLevel || slot.signalType || '',
                            ch.tag || '',
                            ch.fieldDevice || '',
                            ch.terminalNumber || '',
                            ch.wireColor || '',
                            ch.wireNumber || '',
                            ch.cableId || '',
                            ch.junctionBox || '',
                            ch.status || 'active',
                            ch.notes || ''
                        ]);
                    });
                }
            });
        });

        const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IO_List_${eq.tag}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        app.toast('I/O List exportada como CSV!', 'success');
    },

    exportIOListXLSX() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const racks = io.racks || [];
        if (racks.length === 0) { app.toast('Nenhum dado de I/O para exportar.', 'warning'); return; }

        const payload = {
            ioList: io,
            tag: eq.tag
        };

        const _tkExpIO = store.getState().auth?.token;
        fetch('/api/export-io-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(_tkExpIO ? { 'Authorization': 'Bearer ' + _tkExpIO } : {}) },
            body: JSON.stringify(payload)
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erro ao exportar');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IO_List_${eq.tag}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            app.toast('I/O List exportada com formatação!', 'success');
        }).catch(err => {
            console.error('[Export IO List]', err);
            app.toast(err.message || 'Erro ao exportar XLSX.', 'error');
        });
    },

    openIOTypeTypicals() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!eq.ioList.ioTypicals) {
            eq.ioList.ioTypicals = {
                DI: { terminalBlocks: 1, fuseTerminal: true, relayTerminal: false, surgeProtector: false, wireColor: 'blue', wiringType: '2-wire', cableType: 'standard', notes: '' },
                DO: { terminalBlocks: 1, fuseTerminal: false, relayTerminal: true, surgeProtector: false, wireColor: 'red', wiringType: '2-wire', cableType: 'standard', notes: '' },
                AI: { terminalBlocks: 3, fuseTerminal: false, relayTerminal: false, surgeProtector: true, wireColor: 'green', wiringType: '3-wire', cableType: 'shielded-twisted-pair', notes: '' },
                AO: { terminalBlocks: 2, fuseTerminal: false, relayTerminal: false, surgeProtector: false, wireColor: 'yellow', wiringType: '2-wire', cableType: 'shielded', notes: '' }
            };
        }
        this._showIOTypeTypicalsModal(eq);
    },

    _showIOTypeTypicalsModal(eq) {
        if (document.getElementById('modal-io-typicals')) return;
        const typ = eq.ioList.ioTypicals;
        const sel = (id, val, opts) => `<select id="${id}" style="width:100%;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;">${opts.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
        const colors = ['blue','red','green','yellow','white','black','gray','brown','orange','purple'];
        const wirings = ['2-wire','3-wire','4-wire'];
        const cables = ['standard','shielded','shielded-twisted-pair','compensation-TC','compensation-RTD','multi-conductor'];

        const card = (type, label, t) => `
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:10px;">${label}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;font-size:11px;">
                    <label>Bornes</label>
                    <input type="number" id="iot_${type}_terminalBlocks" value="${t.terminalBlocks}" min="0" style="width:100%;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;">
                    <label>Fusível</label>
                    <input type="checkbox" id="iot_${type}_fuseTerminal" ${t.fuseTerminal ? 'checked' : ''} style="justify-self:start;">
                    <label>Relé</label>
                    <input type="checkbox" id="iot_${type}_relayTerminal" ${t.relayTerminal ? 'checked' : ''} style="justify-self:start;">
                    <label>Supressor</label>
                    <input type="checkbox" id="iot_${type}_surgeProtector" ${t.surgeProtector ? 'checked' : ''} style="justify-self:start;">
                    <label>Cor do fio</label>
                    ${sel(`iot_${type}_wireColor`, t.wireColor, colors)}
                    <label>Tipo ligação</label>
                    ${sel(`iot_${type}_wiringType`, t.wiringType, wirings)}
                    <label>Tipo cabo</label>
                    ${sel(`iot_${type}_cableType`, t.cableType, cables)}
                    <label style="grid-column:1/-1;">Observação</label>
                    <textarea id="iot_${type}_notes" style="grid-column:1/-1;width:100%;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;resize:vertical;" rows="2">${t.notes || ''}</textarea>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.id = 'modal-io-typicals';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div style="background:white;border-radius:12px;width:820px;max-width:95vw;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:700;font-size:15px;color:#1e3a8a;"><i class="ph ph-gear-six"></i> Típicos I/O — ${eq.tag}</span>
                    <button onclick="document.getElementById('modal-io-typicals').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8;">✕</button>
                </div>
                <div style="padding:16px 20px;overflow-y:auto;flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    ${card('DI','Entradas Digitais (DI)',typ.DI)}
                    ${card('DO','Saídas Digitais (DO)',typ.DO)}
                    ${card('AI','Entradas Analógicas (AI)',typ.AI)}
                    ${card('AO','Saídas Analógicas (AO)',typ.AO)}
                </div>
                <div style="padding:12px 20px;border-top:1px solid #e2e8f0;display:flex;gap:8px;justify-content:flex-end;background:#f8fafc;border-radius:0 0 12px 12px;">
                    <button type="button" class="btn btn-sm btn-ghost" onclick="document.getElementById('modal-io-typicals').remove();window.propostaTecnicaModule.saveIOTypeTypicalsAsTemplate()" style="font-size:11px;border-radius:4px;"><i class="ph ph-floppy-disk"></i> Salvar como Template</button>
                    <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule.loadIOTypeTypicalsTemplate()" style="font-size:11px;border-radius:4px;"><i class="ph ph-tray-arrow-down"></i> Carregar Template</button>
                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule._saveIOTypeTypicals()" style="background:#0f172a;color:white;font-size:11px;border-radius:4px;padding:6px 16px;font-weight:700;"><i class="ph ph-check"></i> Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _saveIOTypeTypicals() {
        const modal = document.getElementById('modal-io-typicals');
        if (!modal) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const typ = eq.ioList.ioTypicals;
        const read = (type, field, parse) => {
            const el = document.getElementById(`iot_${type}_${field}`);
            if (!el) return;
            const val = parse ? parse(el) : el.value;
            typ[type][field] = val;
        };
        const bool = (el) => el.checked;
        ['DI','DO','AI','AO'].forEach(type => {
            read(type,'terminalBlocks', el => parseInt(el.value) || 0);
            read(type,'fuseTerminal', bool);
            read(type,'relayTerminal', bool);
            read(type,'surgeProtector', bool);
            read(type,'wireColor');
            read(type,'wiringType');
            read(type,'cableType');
            read(type,'notes');
        });
        store.setState({ activeTechnicalProposal: data });
        modal.remove();
        app.toast('Típicos I/O salvos!', 'success');
    },

    saveIOTypeTypicalsAsTemplate() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const modal = document.getElementById('modal-io-typicals');
        if (modal) modal.remove();

        const name = prompt('Nome do template de Típicos I/O:');
        if (!name) return;
        const loadLists = store.getState().loadLists || [];
        const existingIndex = loadLists.findIndex(l => l.name === name && l.source === 'io-typical-template');
        if (existingIndex >= 0) {
            if (!confirm(`Template "${name}" já existe. Sobrescrever?`)) return;
            loadLists.splice(existingIndex, 1);
        }
        loadLists.push({
            name,
            data: JSON.parse(JSON.stringify(eq.ioList.ioTypicals)),
            source: 'io-typical-template',
            createdAt: new Date().toISOString()
        });
        store.setState({ loadLists });
        app.toast(`Template "${name}" salvo!`, 'success');
    },

    loadIOTypeTypicalsTemplate() {
        const loadLists = store.getState().loadLists || [];
        const templates = loadLists.filter(l => l.source === 'io-typical-template');
        if (document.getElementById('modal-load-io-typicals-template')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-load-io-typicals-template';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        if (templates.length === 0) {
            modal.innerHTML = `
                <div style="background:white;border-radius:12px;padding:30px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                    <p style="color:#64748b;">Nenhum template de Típicos I/O salvo.</p>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('modal-load-io-typicals-template').remove()" style="margin-top:10px;">Fechar</button>
                </div>
            `;
            document.body.appendChild(modal);
            return;
        }

        modal.innerHTML = `
            <div style="background:white;border-radius:12px;width:460px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:700;font-size:15px;color:#1e3a8a;"><i class="ph ph-tray-arrow-down"></i> Carregar Template</span>
                    <button onclick="document.getElementById('modal-load-io-typicals-template').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8;">✕</button>
                </div>
                <div style="padding:12px 20px;max-height:300px;overflow-y:auto;">
                    ${templates.map(t => `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;">
                            <span style="font-size:13px;color:#1e293b;">${t.name}</span>
                            <div style="display:flex;gap:6px;">
                                <button class="btn btn-sm" onclick="window.propostaTecnicaModule._confirmIOTypeTypicalsTemplate('${t.name.replace(/'/g, "\\'")}')" style="background:#0f172a;color:white;font-size:10px;border-radius:4px;padding:4px 10px;">Aplicar</button>
                                <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._deleteIOTypeTypicalsTemplate('${t.name.replace(/'/g, "\\'")}')" style="color:#ef4444;font-size:10px;border-radius:4px;padding:4px 10px;">Excluir</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="padding:12px 20px;border-top:1px solid #e2e8f0;text-align:right;background:#f8fafc;border-radius:0 0 12px 12px;">
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('modal-load-io-typicals-template').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _confirmIOTypeTypicalsTemplate(name) {
        if (!confirm(`Aplicar template "${name}"? Isso substituirá os Típicos I/O atuais.`)) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const loadLists = store.getState().loadLists || [];
        const template = loadLists.find(l => l.name === name && l.source === 'io-typical-template');
        if (!template) { app.toast('Template não encontrado.', 'error'); return; }
        eq.ioList.ioTypicals = JSON.parse(JSON.stringify(template.data));
        store.setState({ activeTechnicalProposal: data });

        const modal = document.getElementById('modal-io-typicals');
        if (modal) modal.remove();
        this._showIOTypeTypicalsModal(eq);
        app.toast(`Template "${name}" aplicado!`, 'success');
    },

    _deleteIOTypeTypicalsTemplate(name) {
        if (!confirm(`Excluir template "${name}"?`)) return;
        const loadLists = store.getState().loadLists || [];
        const idx = loadLists.findIndex(l => l.name === name && l.source === 'io-typical-template');
        if (idx >= 0) {
            loadLists.splice(idx, 1);
            store.setState({ loadLists });
            document.getElementById('modal-load-io-typicals-template')?.remove();
            this.loadIOTypeTypicalsTemplate();
        }
    },

    _calcIOTotals(racks) {
        let totalDI = 0, totalDO = 0, totalAI = 0, totalAO = 0;
        let spareDI = 0, spareDO = 0, spareAI = 0, spareAO = 0;
        racks.forEach(rack => {
            (rack.slots || []).forEach(slot => {
                (slot.channels || []).forEach(ch => {
                    const type = (ch.channelType || slot.moduleType || '').toUpperCase();
                    const isSpare = ch.status === 'spare' || ch.status === 'unused';
                    if (type === 'DI') { totalDI++; if (isSpare) spareDI++; }
                    else if (type === 'DO') { totalDO++; if (isSpare) spareDO++; }
                    else if (type === 'AI') { totalAI++; if (isSpare) spareAI++; }
                    else if (type === 'AO') { totalAO++; if (isSpare) spareAO++; }
                });
            });
        });
        return { totalDI, totalDO, totalAI, totalAO, spareDI, spareDO, spareAI, spareAO };
    },

    _getRackFabricante(rack, eq) {
        return rack.fabricante || eq.technical?.fabricante || 'Allen-Bradley';
    },

    _getRackPlaceholders(fabricante) {
        const map = {
            'Allen-Bradley': { bp: 'Ex: 1756-A7', ps: 'Ex: 1756-PA72', cpu: 'Ex: 1756-L71', comm: 'Ex: 1756-EN2T', modelo: 'Ex: 1756-L71' },
            'Siemens': { bp: 'Ex: 6ES7 155-6AU01-0BN0', ps: 'Ex: 6ES7 507-0KA00-0AB0', cpu: 'Ex: 6ES7 517-3AP00-0AB0', comm: 'Ex: 6ES7 543-1G00-0AB0', modelo: 'Ex: 6ES7 517-3AP00-0AB0' },
            'ABB': { bp: 'Ex: TU830', ps: 'Ex: SD831', cpu: 'Ex: PM573-ETH', comm: 'Ex: CI546', modelo: 'Ex: PM573-ETH' },
            'Schneider Electric': { bp: 'Ex: BMXXBP0400', ps: 'Ex: BMXCPS2010', cpu: 'Ex: BMXP342020', comm: 'Ex: BMXNOE0100', modelo: 'Ex: BMXP342020' },
            'WEG': { bp: 'Ex: BP-01', ps: 'Ex: PS-01', cpu: 'Ex: CPU300-16', comm: 'Ex: ETH-01', modelo: 'Ex: CPU300-16' },
            'Phoenix Contact': { bp: 'Ex: AXL F BP', ps: 'Ex: AXL F PS', cpu: 'Ex: AXC F 2152', comm: 'Ex: AXL F ETH', modelo: 'Ex: AXC F 2152' },
            'Mitsubishi': { bp: 'Ex: Q38B', ps: 'Ex: Q61P', cpu: 'Ex: Q06UDEH', comm: 'Ex: QJ71E71', modelo: 'Ex: Q06UDEH' },
            'Omron': { bp: 'Ex: CJ1W-PA205R', ps: 'Ex: CJ1W-PA205R', cpu: 'Ex: CJ2M-CPU31', comm: 'Ex: CJ1W-ETN21', modelo: 'Ex: CJ2M-CPU31' }
        };
        return map[fabricante] || { bp: 'Ex: BP-001', ps: 'Ex: PS-001', cpu: 'Ex: CPU-001', comm: 'Ex: COMM-001', modelo: 'Ex: CPU-001' };
    },

    renderAutomationBOM(eq) {
        const io = eq.ioList || { racks: [] };
        const hasRacks = io.racks && io.racks.length > 0 && io.racks.some(r => (r.slots || []).length > 0);

        if (!hasRacks) {
            return `
                <div style="padding: 60px; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 8px;">
                    <i class="ph ph-list-bullets" style="font-size: 48px; opacity: 0.2;"></i>
                    <p style="margin-top: 10px; font-weight: 600;">Nenhum material derivado</p>
                    <p style="font-size: 12px; margin-top: 4px;">Configure a Lista de I/O com racks, slots e canais para gerar a lista de materiais automaticamente.</p>
                </div>
            `;
        }

        const result = deriveMaterials(io);
        const { items, total } = result;

        if (!eq.automationMaterials || eq.automationMaterials.length === 0) {
            eq.automationMaterials = (items || []).map(item => ({
                materialId: item.materialId || '',
                descricao: item.descricao,
                fabricante: item.fabricante || '',
                codigoFabricante: item.codigoFabricante || '',
                modelo: '',
                custo: item.custoUnitario || 0,
                qtd: item.qtd || 0,
                icms: item.icms || 0,
                ipi: item.ipi || 0,
                pis: item.pis || 0,
                cofins: item.cofins || 0
            }));
            const data = store.getState().activeTechnicalProposal;
            if (data) store.setState({ activeTechnicalProposal: data });
        }

        if (items.length === 0) {
            return `<div style="padding:40px;text-align:center;color:#94a3b8;">Nenhum material derivado da configuração de I/O atual.</div>`;
        }

        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.categoria]) grouped[item.categoria] = [];
            grouped[item.categoria].push(item);
        });

        const categoryIcons = {
            'Estrutura': 'ph-cpu',
            'Fontes': 'ph-lightning',
            'Bornes': 'ph-plugs-connected',
            'Bornes Fusíveis': 'ph-shield-check',
            'Relés': 'ph-swap',
            'Cabos': 'ph-warning-circle',
            'Eletrodutos': 'ph-warning',
            'Canaletas': 'ph-squares-four',
            'Conectores': 'ph-plug'
        };

        return `
            <div style="animation: fadeIn 0.3s ease;">
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 20px;">
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.refreshAutomationBOM()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-arrows-clockwise"></i> Recalcular
                    </button>
                    <div style="position:relative;display:inline-block;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.toggleBOMExportMenu()" style="font-size: 11px; border-radius: 4px;">
                            <i class="ph ph-download-simple"></i> Exportar ▾
                        </button>
                        <div id="bom-export-menu" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:white;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;min-width:140px;overflow:hidden;">
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportAutomationBOMCSV()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;border-bottom:1px solid #f1f5f9;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-csv" style="color:var(--color-accent);"></i> CSV
                            </a>
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportAutomationBOMXLSX()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-xls" style="color:#3b82f6;"></i> XLSX (Formatado)
                            </a>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${items.length}</div>
                        <div style="font-size: 11px; color: #64748b;">Itens</div>
                    </div>
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 20px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #15803d;">${app.formatCurrency(total)}</div>
                        <div style="font-size: 11px; color: var(--color-accent);">Valor Total Estimado</div>
                    </div>
                </div>

                ${Object.entries(grouped).map(([cat, catItems]) => `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; overflow: hidden; background: white;">
                        <div style="background: #f1f5f9; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e2e8f0;">
                            <i class="ph ${categoryIcons[cat] || 'ph-circle'}"></i>
                            <span style="font-weight: 700; font-size: 13px; color: #1e293b;">${cat}</span>
                            <span style="font-size: 11px; color: #64748b;">${catItems.length} item(ns)</span>
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="font-size: 11px; border-collapse: collapse; width: 100%; table-layout: fixed;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 8px 12px; text-align: left;">Descrição</th>
                                        <th style="padding: 8px 12px; text-align: center; width: 60px;">Qtd</th>
                                        <th style="padding: 8px 12px; text-align: center; width: 50px;">Un.</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 100px;">Custo Unit.</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 100px;">Custo Total</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 80px;">ICMS</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 80px;">IPI</th>
                                        <th style="padding: 8px 12px; text-align: left; width: 180px;">Ref. Catálogo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catItems.map(item => {
                                        const cands = item.candidates || [];
                                        const groupedFab = {};
                                        cands.forEach(c => {
                                            const fab = c.fabricante || 'Outros';
                                            if (!groupedFab[fab]) groupedFab[fab] = [];
                                            groupedFab[fab].push(c);
                                        });
                                        const selOpts = cands.length > 0
                                            ? `<option value="">(nenhum)</option>${Object.entries(groupedFab).map(([fab, items]) =>
                                                `<optgroup label="${fab}">${items.map(c =>
                                                    `<option value="${c.id}" ${c.id === item.materialId ? 'selected' : ''}>${c.codigoFabricante || c.descricao} — ${app.formatCurrency(c.custo)}</option>`
                                                ).join('')}</optgroup>`
                                            ).join('')}`
                                            : '';
                                        return `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 6px 12px;">${item.descricao}</td>
                                            <td style="padding: 6px 12px; text-align: center; font-weight: 600; width: 60px;">${item.qtd}</td>
                                            <td style="padding: 6px 12px; text-align: center; width: 50px;">${item.unidade || 'un'}</td>
                                            <td style="padding: 6px 12px; text-align: right; width: 100px;">${item.materialId ? app.formatCurrency(item.custoUnitario) : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: right; font-weight: 700; width: 100px;">${item.materialId ? app.formatCurrency(item.custoUnitario * item.qtd) : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: right; width: 80px; font-size: 10px; color: #475569;">${(item.icms && item.materialId) ? app.formatCurrency(item.custoUnitario * item.qtd * item.icms / 100) + ' (' + item.icms + '%)' : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: right; width: 80px; font-size: 10px; color: #475569;">${(item.ipi && item.materialId) ? app.formatCurrency(item.custoUnitario * item.qtd * item.ipi / 100) + ' (' + item.ipi + '%)' : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: left; width: 180px;">
                                                ${selOpts
                                                    ? `<select data-key="${item._key}" onchange="window.propostaTecnicaModule._changeBOMMaterial(this)" style="max-width:140px;font-size:10px;border:1px solid #cbd5e1;border-radius:3px;padding:2px 4px;">${selOpts}</select>`
                                                    : item.codigoFabricante
                                                        ? `<span style="font-size:10px;color:#3b82f6;" title="${item.fabricante || ''}">${item.codigoFabricante}</span>`
                                                        : '<span style="font-size:10px;color:#94a3b8;">não encontrado</span>'
                                                }
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `).join('')}

                <div style="display: flex; justify-content: flex-end; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 8px;">
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a;">Total: ${app.formatCurrency(total)}</div>
                </div>
            </div>
        `;
    },

    _changeBOMMaterial(selectEl) {
        const key = selectEl.dataset.key;
        const materialId = selectEl.value;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!eq.ioList) eq.ioList = { racks: [] };
        if (!eq.ioList.materialOverrides) eq.ioList.materialOverrides = {};

        if (materialId) {
            eq.ioList.materialOverrides[key] = materialId;
        } else {
            delete eq.ioList.materialOverrides[key];
        }

        store.setState({ activeTechnicalProposal: data });
    },

    toggleBOMExportMenu() {
        const menu = document.getElementById('bom-export-menu');
        if (!menu) return;
        const isOpen = menu.style.display !== 'none';
        menu.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) {
            const close = (e) => {
                if (!menu.contains(e.target) && e.target !== menu.previousElementSibling) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        }
    },

    addIORack() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || (eq.type !== 'PLC' && eq.type !== 'REM')) return;
        if (!eq.ioList) eq.ioList = { racks: [], totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0, spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0 };
eq.ioList.racks.push({
                position: eq.ioList.racks.length + 1,
                backplane: '',
                cpu: '',
                powerSupply: '',
                comm: '',
                modelo: '',
                fabricante: '',
                compactMode: false,
                slots: []
            });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    duplicateIORack(index) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const source = eq.ioList.racks[index];
        if (!source) return;
        const copy = JSON.parse(JSON.stringify(source));
        copy.position = (eq.ioList.racks.length + 1);
        eq.ioList.racks.splice(index + 1, 0, copy);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    addIOSlot(rackIndex) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        if (!rack.slots) rack.slots = [];
        rack.slots.push({ position: rack.slots.length + 1, modulePartNumber: '', moduleType: 'DI', signalType: '24VDC', totalChannels: '', channels: [] });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    addIOChannel(rackIndex, slotIndex) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        const slot = rack.slots[slotIndex];
        if (!slot) return;
        if (!slot.channels) slot.channels = [];
        const typical = eq.ioList.ioTypicals?.[slot.moduleType];
        slot.channels.push({
            channelNumber: slot.channels.length,
            channelType: slot.moduleType || 'DI',
            signalLevel: slot.signalType || '24VDC',
            fieldDevice: '',
            tag: '',
            terminalNumber: '',
            wireColor: typical?.wireColor || '',
            wireNumber: '',
            cableId: '',
            junctionBox: '',
            status: 'active',
            notes: ''
        });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    toggleRackCompactMode(index) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[index];
        if (!rack) return;
        const el = document.querySelector(`[name="io_rack_compact_${index}"]`);
        rack.compactMode = el ? el.checked : !rack.compactMode;
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    onRackFabricanteChange(index) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[index];
        if (!rack) return;
        const el = document.querySelector(`[name="io_rack_fabricante_${index}"]`);
        rack.fabricante = el ? el.value : '';
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeIORack(index) {
        if (!confirm('Excluir este rack e todos os seus slots/canais?')) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        eq.ioList.racks.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeIOSlot(rackIndex, slotIndex) {
        if (!confirm('Excluir este slot e seus canais?')) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        rack.slots.splice(slotIndex, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeIOChannel(rackIndex, slotIndex, channelIndex) {
        if (!confirm('Excluir este canal?')) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        const slot = rack.slots[slotIndex];
        if (!slot) return;
        slot.channels.splice(channelIndex, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    importIOList() {
        this.captureEquipmentData();

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.style.display = 'none';
        input.onchange = (e) => this._handleIOImportFile(e);
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    },

    _handleIOImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);

        if (isExcel) {
            reader.onload = (evt) => {
                try {
                    const bdata = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(bdata, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                    this._showIOColumnMapping(data);
                } catch (err) {
                    console.error('[Import IO] XLSX error:', err);
                    app.toast('Erro ao ler arquivo Excel. Verifique se não está corrompido.', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (evt) => {
                const csv = evt.target.result;
                const lines = csv.split('\n').filter(l => l.trim());
                if (lines.length < 2) {
                    app.toast('CSV vazio ou inválido.', 'error');
                    return;
                }
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const rows = lines.slice(1).map(line => {
                    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    if (vals.length !== headers.length) return null;
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = vals[i]);
                    return obj;
                }).filter(r => r !== null);
                this._showIOColumnMapping(rows);
            };
            reader.readAsText(file);
        }
    },

    _showIOColumnMapping(rows) {
        if (!rows || rows.length === 0) {
            app.toast('Nenhuma linha de dados encontrada.', 'warning');
            return;
        }

        const headers = Object.keys(rows[0]);
        const fieldOptions = [
            { value: '', label: '(ignorar)' },
            { value: 'slotPosition', label: 'Slot / Posição' },
            { value: 'modulePartNumber', label: 'PN / Part Number / Código' },
            { value: 'moduleType', label: 'Tipo do Módulo' },
            { value: 'signalType', label: 'Tipo de Sinal (DI/DO/AI/AO)' },
            { value: 'channelNumber', label: 'Nº Canal' },
            { value: 'tag', label: 'Tag do Instrumento' },
            { value: 'fieldDevice', label: 'Dispositivo de Campo' },
            { value: 'terminalNumber', label: 'Borne / Terminal' },
            { value: 'wireColor', label: 'Cor do Fio' },
            { value: 'wireNumber', label: 'Nº do Fio / Condutor' },
            { value: 'cableId', label: 'Cabo / Cable ID' },
            { value: 'junctionBox', label: 'Caixa / Junction Box' },
            { value: 'channelType', label: 'Tipo Canal (Entrada/Saída)' },
            { value: 'notes', label: 'Observações / Notas' },
        ];

        const keywordMap = {
            slotPosition: ['slot', 'pos', 'posicao', 'posição', 'rack'],
            modulePartNumber: ['pn', 'part', 'partno', 'partnumber', 'codigo', 'código', 'modelo'],
            moduleType: ['moduletype', 'modulo', 'módulo', 'type', 'tipo_modulo'],
            signalType: ['signal', 'sinal', 'i/o', 'io', 'di/do', 'ai/ao'],
            channelNumber: ['channel', 'canal', 'ch', 'ch#', 'n°canal'],
            tag: ['tag', 'instrument', 'instrumento'],
            fieldDevice: ['device', 'dispositivo', 'field', 'campo'],
            terminalNumber: ['terminal', 'borne', 'born', 'terminals'],
            wireColor: ['wirecolor', 'cor', 'cor_fio', 'color', 'fio'],
            wireNumber: ['wireno', 'wire_n', 'nºfio', 'condutor', 'fio_n'],
            cableId: ['cable', 'cabo', 'cableid', 'cable_id'],
            junctionBox: ['jb', 'jbox', 'junction', 'caixa', 'junctionbox'],
            channelType: ['channeltype', 'tipo_canal', 'entrada', 'saida', 'direction'],
            notes: ['notes', 'obs', 'observacao', 'observação', 'notas'],
        };

        const autoDetect = {};
        headers.forEach(h => {
            const hl = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [field, keywords] of Object.entries(keywordMap)) {
                if (keywords.some(k => {
                    const kl = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return hl === kl || hl.includes(kl) || kl.includes(hl);
                })) {
                    if (!autoDetect[field]) autoDetect[field] = h;
                }
            }
        });

        if (document.getElementById('modal-io-import-mapping')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-io-import-mapping';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 700px;">
                <div class="modal-header" style="background: #0f172a; color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-microsoft-excel-logo"></i> Importar Lista de I/O
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 16px;">
                    <p style="font-size: 13px; color: #475569; margin: 0 0 12px;">
                        ${rows.length} linha(s) encontradas. Mapeie as colunas da planilha para os campos do sistema.
                    </p>

                    <div style="overflow-x: auto; margin-bottom: 16px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background: #f1f5f9;">
                                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0; min-width: 120px;">Coluna da Planilha</th>
                                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0; min-width: 160px;">Campo no Sistema</th>
                                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">Amostra (1ª linha)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${headers.map(h => `
                                    <tr>
                                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${h}</td>
                                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">
                                            <select class="form-select io-import-map" data-col="${h}" style="width: 100%; padding: 4px 6px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                                ${fieldOptions.map(f => `
                                                    <option value="${f.value}" ${autoDetect[f.value] === h ? 'selected' : ''}>${f.label}</option>
                                                `).join('')}
                                            </select>
                                        </td>
                                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0; color: #64748b; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rows[0][h] || ''}">${rows[0][h] || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="display: flex; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; align-items: center;">
                        <div style="font-size: 12px; color: #475569;">
                            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Opções de Importação</label>
                            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; margin-right: 16px;">
                                <input type="checkbox" id="io-import-clear-existing" checked>
                                <span>Limpar configuração atual antes de importar</span>
                            </label>
                            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="io-import-group-by-slot" checked>
                                <span>Agrupar canais por Slot</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button type="button" class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button type="button" class="btn btn-primary" style="background: #0f172a; color: white; font-weight: 600;" onclick="window.propostaTecnicaModule._executeIOImport()">
                        <i class="ph ph-check"></i> Importar ${rows.length} linha(s)
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this._pendingImportRows = rows;
        this._pendingImportHeaders = headers;
    },

    _executeIOImport() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const selects = document.querySelectorAll('#modal-io-import-mapping .io-import-map');
        const mapping = {};
        selects.forEach(sel => {
            const col = sel.getAttribute('data-col');
            const field = sel.value;
            if (field) mapping[field] = col;
        });

        const rows = this._pendingImportRows || [];
        if (!rows.length) return;

        const clearExisting = document.getElementById('io-import-clear-existing')?.checked ?? true;
        const groupBySlot = document.getElementById('io-import-group-by-slot')?.checked ?? true;

        // Build channel list from imported rows
        const channels = rows.map((row, i) => {
            const ch = {
                channelNumber: row[mapping.channelNumber] || String(i + 1),
                channelType: row[mapping.channelType] || (row[mapping.signalType] ? (row[mapping.signalType].toLowerCase().startsWith('a') ? 'Analog' : 'Digital') : 'Digital'),
                signalLevel: row[mapping.signalType] ? ('24Vdc') : '24Vdc',
                fieldDevice: row[mapping.fieldDevice] || '',
                tag: row[mapping.tag] || '',
                terminalNumber: row[mapping.terminalNumber] || '',
                wireColor: row[mapping.wireColor] || '',
                wireNumber: row[mapping.wireNumber] || '',
                cableId: row[mapping.cableId] || '',
                junctionBox: row[mapping.junctionBox] || '',
                status: row[mapping.status] || 'active',
                notes: row[mapping.notes] || '',
            };
            // Infer signalLevel from signalType
            const st = (row[mapping.signalType] || '').toLowerCase();
            if (st.includes('24v') || st.includes('dc')) ch.signalLevel = '24Vdc';
            else if (st.includes('220') || st.includes('110') || st.includes('ac')) ch.signalLevel = '220Vac';
            else if (st.includes('4-20') || st.includes('4_20') || st.includes('analog')) ch.signalLevel = '4-20mA';
            else if (st.includes('rtd') || st.includes('pt100') || st.includes('tc') || st.includes('thermocouple')) ch.signalLevel = 'RTD/TC';
            else if (st.includes('relay') || st.includes('rele') || st.includes('relé')) ch.signalLevel = 'Relay';

            return {
                ...ch,
                _slot: row[mapping.slotPosition] || '',
                _modulePN: row[mapping.modulePartNumber] || '',
                _moduleType: row[mapping.moduleType] || '',
                _signalType: row[mapping.signalType] || '',
            };
        });

        if (clearExisting) {
            eq.ioList = { racks: [], totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0, spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0 };
        }

        if (!eq.ioList) {
            eq.ioList = { racks: [], totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0, spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0 };
        }

        if (groupBySlot) {
            const grouped = {};
            channels.forEach(ch => {
                const key = ch._slot || '1';
                if (!grouped[key]) {
                    grouped[key] = {
                        position: parseInt(key) || 1,
                        backplane: '',
                        cpu: '',
                        powerSupply: '',
                        slots: {},
                    };
                }
                const slotKey = ch._slot || '1';
                if (!grouped[key].slots[slotKey]) {
                    grouped[key].slots[slotKey] = {
                        position: parseInt(slotKey) || 1,
                        modulePartNumber: ch._modulePN || '',
                        moduleType: ch._moduleType || '',
                        signalType: ch._signalType || '',
                        totalChannels: 0,
                        channels: [],
                    };
                }
                grouped[key].slots[slotKey].channels.push({
                    channelNumber: ch.channelNumber,
                    channelType: ch.channelType,
                    signalLevel: ch.signalLevel,
                    fieldDevice: ch.fieldDevice,
                    tag: ch.tag,
                    terminalNumber: ch.terminalNumber,
                    wireColor: ch.wireColor,
                    wireNumber: ch.wireNumber,
                    cableId: ch.cableId,
                    junctionBox: ch.junctionBox,
                    status: ch.status,
                    notes: ch.notes,
                });
            });

            Object.values(grouped).forEach(rack => {
                const slotArr = Object.values(rack.slots);
                slotArr.forEach(s => {
                    s.totalChannels = s.channels.length;
                });
                eq.ioList.racks.push({
                    position: rack.position,
                    backplane: rack.backplane,
                    cpu: rack.cpu,
                    powerSupply: rack.powerSupply,
                    slots: slotArr,
                });
            });
        } else {
            // Single rack, one slot per module PN
            const slotMap = {};
            channels.forEach(ch => {
                const key = ch._modulePN || 'imported';
                if (!slotMap[key]) {
                    slotMap[key] = {
                        position: 1,
                        modulePartNumber: ch._modulePN || '',
                        moduleType: ch._moduleType || '',
                        signalType: ch._signalType || '',
                        totalChannels: 0,
                        channels: [],
                    };
                }
                slotMap[key].channels.push({
                    channelNumber: ch.channelNumber,
                    channelType: ch.channelType,
                    signalLevel: ch.signalLevel,
                    fieldDevice: ch.fieldDevice,
                    tag: ch.tag,
                    terminalNumber: ch.terminalNumber,
                    wireColor: ch.wireColor,
                    wireNumber: ch.wireNumber,
                    cableId: ch.cableId,
                    junctionBox: ch.junctionBox,
                    status: ch.status,
                    notes: ch.notes,
                });
            });

            Object.values(slotMap).forEach(s => {
                s.totalChannels = s.channels.length;
            });

            eq.ioList.racks.push({
                position: 1,
                backplane: '',
                cpu: '',
                powerSupply: '',
                slots: Object.values(slotMap),
            });
        }

        store.setState({ activeTechnicalProposal: data });

        const modal = document.getElementById('modal-io-import-mapping');
        if (modal) modal.remove();

        this._pendingImportRows = null;
        this._pendingImportHeaders = null;

        this.renderModal(data);
        app.toast(`Importado: ${channels.length} canal(is) em ${eq.ioList.racks.length} rack(s).`, 'success');
    },

    saveIOTemplate() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq || !eq.ioList || !eq.ioList.racks || eq.ioList.racks.length === 0) {
            app.toast('Não há configuração de I/O para salvar.', 'warning');
            return;
        }

        let name = prompt('Nome do Template de I/O:', `I/O - ${eq.tag} - ${new Date().toLocaleDateString()}`);
        if (!name) return;

        const loadLists = store.getState().loadLists || [];
        const existingIndex = loadLists.findIndex(l => l.name === name && l.source === 'io-template');

        const templateData = JSON.parse(JSON.stringify(eq.ioList));

        if (existingIndex >= 0) {
            if (!confirm(`Já existe um template "${name}". Deseja substituir?`)) return;
            loadLists[existingIndex] = {
                ...loadLists[existingIndex],
                items: templateData,
                updatedAt: new Date().toISOString()
            };
        } else {
            loadLists.push({
                id: crypto.randomUUID(),
                name,
                source: 'io-template',
                items: templateData,
                createdAt: new Date().toISOString()
            });
        }

        store.setState({ loadLists: [...loadLists] });
        app.toast(`Template "${name}" salvo com sucesso!`, 'success');
    },

    loadIOTemplate() {
        this.captureEquipmentData();
        const loadLists = store.getState().loadLists || [];
        const ioLists = loadLists.filter(l => l.source === 'io-template');

        if (document.getElementById('modal-load-io-template')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-load-io-template';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 520px;">
                <div class="modal-header" style="background: #0f172a; color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-tray-arrow-down"></i> Carregar Template de I/O
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 16px;">
                    ${ioLists.length === 0 ? '<p style="color: #94a3b8; text-align: center; padding: 20px;">Nenhum template salvo.</p>' : `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${ioLists.map(l => `
                                <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 600; font-size: 14px; color: #0f172a;">${l.name}</div>
                                        <div style="font-size: 12px; color: #64748b;">
                                            ${l.items?.racks?.length || 0} rack(s) &middot;
                                            ${(l.items?.racks || []).reduce((s, r) => s + (r.slots || []).length, 0)} slot(s) &middot;
                                            ${new Date(l.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button type="button" class="btn btn-sm" style="background: #0f172a; color: white; border-radius: 4px; padding: 6px 14px; font-size: 12px;" onclick="window.propostaTecnicaModule._confirmIOTemplate('${l.id}')">
                                        <i class="ph ph-check"></i> Carregar
                                    </button>
                                    <button type="button" class="btn btn-sm" style="background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; border-radius: 4px; padding: 6px 10px; font-size: 12px;" onclick="window.propostaTecnicaModule.deleteIOTemplate('${l.id}')" title="Excluir template">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _confirmIOTemplate(id) {
        const loadLists = store.getState().loadLists || [];
        const selected = loadLists.find(l => l.id === id);
        if (!selected) return;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        if (eq.ioList?.racks?.length > 0) {
            if (!confirm(`Isso substituirá ${eq.ioList.racks.length} rack(s) existente(s). Continuar?`)) return;
        }

        eq.ioList = JSON.parse(JSON.stringify(selected.items));
        store.setState({ activeTechnicalProposal: data });

        const modal = document.getElementById('modal-load-io-template');
        if (modal) modal.remove();

        this.renderModal(data);
        app.toast(`Template "${selected.name}" carregado (${eq.ioList.racks.length} rack(s)).`, 'success');
    },

    deleteIOTemplate(id) {
        const loadLists = store.getState().loadLists || [];
        const target = loadLists.find(l => l.id === id);
        if (!target) return;

        if (!confirm(`Excluir template "${target.name}"?`)) return;

        const newList = loadLists.filter(l => l.id !== id);
        store.setState({ loadLists: newList });

        const modal = document.getElementById('modal-load-io-template');
        if (modal) modal.remove();
        this.loadIOTemplate();

        app.toast(`Template "${target.name}" excluído.`, 'success');
    },

    refreshAutomationBOM() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        this.renderModal(data);
    },

    exportAutomationBOMCSV() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const result = deriveMaterials(io);
        if (!result.items || result.items.length === 0) {
            app.toast('Nenhum material para exportar.', 'warning');
            return;
        }
        const rows = [['Categoria', 'Descrição', 'Quantidade', 'Unidade', 'Custo Unitário', 'Custo Total', 'Código Fabricante']];
        result.items.forEach(item => {
            rows.push([item.categoria, item.descricao, item.qtd, item.unidade || 'un',
                item.custoUnitario.toFixed(2), (item.custoUnitario * item.qtd).toFixed(2),
                item.codigoFabricante || '']);
        });
        rows.push([]);
        rows.push(['TOTAL', '', '', '', '', result.total.toFixed(2), '']);
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BOM_Automacao_${eq.tag}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        app.toast('Lista CSV exportada com sucesso!', 'success');
    },

    exportAutomationBOMXLSX() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const result = deriveMaterials(io);
        if (!result.items || result.items.length === 0) {
            app.toast('Nenhum material para exportar.', 'warning');
            return;
        }

        const payload = {
            items: result.items,
            tag: eq.tag,
            total: result.total
        };

        const _tkExpBOM = store.getState().auth?.token;
        fetch('/api/export-io-bom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(_tkExpBOM ? { 'Authorization': 'Bearer ' + _tkExpBOM } : {}) },
            body: JSON.stringify(payload)
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erro ao exportar');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BOM_Automacao_${eq.tag}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            app.toast('Planilha XLSX exportada com formatação!', 'success');
        }).catch(err => {
            console.error('[Export IO BOM]', err);
            app.toast(err.message || 'Erro ao exportar XLSX.', 'error');
        });
    },

    loadLoadsModel() {
        const loadLists = store.getState().loadLists || [];
        const ptLists = loadLists.filter(l => l.source === 'proposta-tecnica');

        if (ptLists.length === 0) {
            app.toast('Nenhum modelo de lista salvo. Use "Salvar Lista" primeiro.', 'info');
            return;
        }

        if (document.getElementById('modal-load-loads')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-load-loads';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 520px;">
                <div class="modal-header" style="background: #0f172a; color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-tray-arrow-down"></i> Carregar Lista de Cargas
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 16px;">
                    ${ptLists.length === 0 ? '<p style="color: #94a3b8; text-align: center; padding: 20px;">Nenhum modelo salvo.</p>' : `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${ptLists.map((l, i) => `
                                <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 600; font-size: 14px; color: #0f172a;">${l.name}</div>
                                        <div style="font-size: 12px; color: #64748b;">${l.items.length} carga(s) &middot; ${new Date(l.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <button type="button" class="btn btn-sm" style="background: #0f172a; color: white; border-radius: 4px; padding: 6px 14px; font-size: 12px;" onclick="window.propostaTecnicaModule._confirmLoadList('${l.id}')">
                                        <i class="ph ph-check"></i> Carregar
                                    </button>
                                    <button type="button" class="btn btn-sm" style="background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; border-radius: 4px; padding: 6px 10px; font-size: 12px;" onclick="window.propostaTecnicaModule.deleteLoadList('${l.id}')" title="Excluir modelo">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _confirmLoadList(id) {
        const loadLists = store.getState().loadLists || [];
        const selected = loadLists.find(l => l.id === id);
        if (!selected) return;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        if (eq.loads && eq.loads.length > 0) {
            if (!confirm(`Isso substituirá ${eq.loads.length} carga(s) existente(s). Continuar?`)) return;
        }

        eq.loads = JSON.parse(JSON.stringify(selected.items));
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);

        const modal = document.getElementById('modal-load-loads');
        if (modal) modal.remove();

        app.toast(`Lista "${selected.name}" carregada (${selected.items.length} cargas).`, 'success');
    },

    saveLoadsList() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq || !eq.loads || eq.loads.length === 0) {
            app.toast('Não há cargas para salvar.', 'warning');
            return;
        }

        let name = prompt('Nome da Lista de Cargas:', `Cargas - ${eq.tag} - ${new Date().toLocaleDateString()}`);
        if (!name) return;

        const loadLists = store.getState().loadLists || [];
        const existingIndex = loadLists.findIndex(l => l.name === name && l.source === 'proposta-tecnica');

        if (existingIndex >= 0) {
            if (!confirm(`Já existe uma lista "${name}". Deseja substituir?`)) return;
            loadLists[existingIndex] = {
                ...loadLists[existingIndex],
                items: JSON.parse(JSON.stringify(eq.loads)),
                updatedAt: new Date().toISOString()
            };
        } else {
            loadLists.push({
                id: crypto.randomUUID(),
                name,
                source: 'proposta-tecnica',
                items: JSON.parse(JSON.stringify(eq.loads)),
                createdAt: new Date().toISOString()
            });
        }

        store.setState({ loadLists: [...loadLists] });
        app.toast(`Lista "${name}" salva com sucesso!`, 'success');
    },

    deleteLoadList(id) {
        const loadLists = store.getState().loadLists || [];
        const target = loadLists.find(l => l.id === id);
        if (!target) return;

        if (!confirm(`Excluir modelo "${target.name}"?`)) return;

        const newList = loadLists.filter(l => l.id !== id);
        store.setState({ loadLists: newList });

        const modal = document.getElementById('modal-load-loads');
        if (modal) modal.remove();
        this.loadLoadsModel();

        app.toast(`Modelo "${target.name}" excluído.`, 'success');
    },



    importLoads() {

        const input = document.createElement('input');

        input.type = 'file';

        input.accept = '.xlsx, .xls, .csv';

        input.onchange = (e) => {

            const file = e.target.files[0];

            if (!file) return;



            app.toast('Lendo arquivo...', 'info');

            const reader = new FileReader();

            const isExcel = /\.(xlsx|xls)$/i.test(file.name);



            reader.onload = (evt) => {

                try {

                    let data = [];

                    if (isExcel) {

                        const bdata = new Uint8Array(evt.target.result);

                        const workbook = XLSX.read(bdata, { type: 'array' });

                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                        data = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

                    } else {

                        const csv = evt.target.result;

                        const lines = csv.split('\n').filter(l => l.trim());

                        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

                        data = lines.slice(1).map(line => {

                            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));

                            const obj = {};

                            headers.forEach((h, i) => obj[h] = vals[i]);

                            return obj;

                        });

                    }



                    this.processImportedLoads(data);

                } catch (err) {

                    console.error('[PropostaTecnica] Import Error:', err);

                    app.toast('Erro ao importar arquivo: ' + err.message, 'error');

                }

            };



            if (isExcel) reader.readAsArrayBuffer(file);

            else reader.readAsText(file);

        };

        input.click();

    },



    processImportedLoads(data) {

        if (!data || data.length === 0) {

            app.toast('Nenhum dado encontrado no arquivo.', 'warning');

            return;

        }



        this.captureEquipmentData();

        const proposal = store.getState().activeTechnicalProposal;

        const eq = proposal.equipments[this.activeEquipmentIndex];

        

        const findKey = (row, candidates) => {

            const keys = Object.keys(row);

            return keys.find(k => candidates.some(c => k.toLowerCase().includes(c.toLowerCase())));

        };



        let count = 0;

        data.forEach(row => {

            const tagKey = findKey(row, ['tag', 'identificação', 'id']);

            const descKey = findKey(row, ['descri', 'description', 'nome']);

            const powerKey = findKey(row, ['potencia', 'potência', 'power', 'cv', 'kw']);

            const tensaoKey = findKey(row, ['tensao', 'tensão', 'voltage', 'volts']);

            const regimeKey = findKey(row, ['regime', 'trabalho', 'duty']);

            const typeKey = findKey(row, ['tipo', 'type', 'partida']);



            if (tagKey || descKey) {

                eq.loads.push({

                    tag: row[tagKey] || `M${eq.loads.length + 1}`,

                    desc: row[descKey] || '',

                    power: row[powerKey] || '',

                    tensao: row[tensaoKey] || '380',

                    regime: row[regimeKey] || 'S1',

                    type: row[typeKey] || 'IF',

                    current: ''

                });

                count++;

            }

        });



        // Deep copy para evitar mutacao cruzada entre propostas
        const proposalCopy = JSON.parse(JSON.stringify(proposal));
        store.setState({ activeTechnicalProposal: proposalCopy });

        this.renderModal(proposalCopy);

        app.toast(`${count} cargas importadas com sucesso!`, 'success');

    },



};
