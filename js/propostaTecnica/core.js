// core.js (bloco 1/7) — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { store } from '../state.js';
import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from '../busbarCalculator.js';
import { deriveMaterials } from '../automacaoMateriais.js';
import { EMPRESA } from '../empresaConfig.js';
import { infraSubtotal, infraPrecoFinal } from '../infraPricing.js';
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './shared.js';

const app = window.app;
export const core = {

    init() {

        console.log("Proposta Técnica Module Hierarchical Initializing...");

        

        // Exporta o módulo para o escopo global de forma consistente

        window.propostaTecnicaModule = this;

        

        // Mantém compatibilidade com referências legadas

        if (window.app) window.app.propostaTecnica = this;



        this.viewMode = 'list';

        this.activeTab = 'geral'; // geral, escopo, equipments, revisoes

        this.activeSubTab = 'technical'; // technical, norms, loads, etc.

        this.activeEquipmentIndex = 0;

        this.cargasSubView = 'edit'; // 'edit' ou 'lm'

        this.activePanelFilter = 'Geral';

        this.lmFilterQuery = '';

        this.forcedDashboard = false;

        this._loading = false;
        this._usersCache = null;

        store.subscribe((state) => {

            const container = document.getElementById('view-proposta-tecnica');

            if (container && !container.classList.contains('hidden-module')) {

                const sc = document.querySelector('#form-proposta-tecnica > div');
                this._savedScrollTop = sc ? sc.scrollTop : null;

                this.render();

            }

        });

        this._loadUsers();
    },



    create() {

        const company = store.getState().company || {};
        const vendorDefaults = (() => {
            try { return JSON.parse(company.vendorDefaults || '[]'); } catch (e) { return []; }
        })();
        const initialVendorList = Object.keys(VENDOR_MAP).map(comp => ({
            comp,
            brand: VENDOR_MAP[comp][0] || '',
            opt: '__PADRAO__',
            optEspecifique: ''
        }));
        vendorDefaults.forEach(dv => {
            if (!initialVendorList.find(v => v.comp === dv.comp)) {
                initialVendorList.push({
                    comp: dv.comp,
                    brand: dv.brand || '',
                    opt: dv.opt || '__PADRAO__',
                    optEspecifique: dv.optEspecifique || ''
                });
            }
        });

        let initialData = {

            id: 'PT-' + Date.now().toString(36).toUpperCase(),

            ptc_folder: window.app.currentPtc?.folder || '',

            cliente: window.app.currentPtc?.client || '',

            unidade_cliente: window.app.currentPtc?.unidade_cliente || window.app.currentPtcInfo?.autpro?.codigoUnidade || '',

            projeto: window.app.currentPtc?.title || '',

            objeto: 'FORNECIMENTO DE PAINÉIS ELÉTRICOS',

            equipments: [],
            scopeItems: [],
            autproScope: [],
            exclusions: makeDefaultExclusions(),
            cidade: '',
            uf: '',
            vendorList: initialVendorList,
            materialOverrides: {},
            clientDocuments: [],

            revisions: [{ no: '00', desc: 'Emissão Inicial', elab: '', verif: '', aprov: '', data: new Date().toLocaleDateString() }],
            engenheiroResponsavel: '',

            updatedAt: new Date().toISOString()

        };

        this.viewMode = 'form';

        this.activeTab = 'geral';

        this.activeEquipmentIndex = -1;

        this.cargasSubView = 'edit';

        store.setState({ activeTechnicalProposal: initialData });

        this.renderModal(initialData);

    },



    switchTab(tabId) {

        // Captura as edições da aba atual ANTES de o DOM dela ser destruído
        this.captureActiveTab();

        this.activeTab = tabId;

        const data = store.getState().activeTechnicalProposal;

        if (data) {

            data.lastActiveTab = tabId;

            store.setState({ activeTechnicalProposal: data });

        }

        this.renderModal(data);

    },



    switchEquipment(index) {

        this.captureEquipmentData();

        this.activeEquipmentIndex = index;

        const data = store.getState().activeTechnicalProposal;

        if (data) {

            const newEq = data.equipments[index];
            if (newEq) {
                const isTrMt = newEq.type === 'TR-MT';
                const isAutomation = newEq.type === 'PLC' || newEq.type === 'REM';
                const validSubTabs = isTrMt ? ['technical', 'materiais', 'norms', 'deviations', 'expenses']
                    : newEq.type === 'SEU' ? ['technical', 'deviations', 'expenses']
                    : newEq.type === 'ELETROCENTRO' ? ['eletrocentro', 'materiais', 'norms', 'deviations', 'labor', 'expenses', 'calc_mecanico']
                    : isAutomation ? ['technical', 'norms', 'io_list', 'bom', 'deviations', 'labor', 'expenses']
                    : ['technical', 'norms', 'loads', 'busbars', 'deviations', 'labor', 'expenses', 'calc_eletrico', 'calc_mecanico', 'layout'];
                if (!validSubTabs.includes(this.activeSubTab)) {
                    this.activeSubTab = validSubTabs[0];
                }
            }

            data.lastActiveEquipmentIndex = index;

            store.setState({ activeTechnicalProposal: data });

        }

        this.renderModal(data);

    },



    switchSubTab(tabId) {

        this.captureEquipmentData();

        this.activeSubTab = tabId;

        const data = store.getState().activeTechnicalProposal;

        if (data) {

            data.lastActiveSubTab = tabId;

            store.setState({ activeTechnicalProposal: data });

        }

        this.renderModal(data);

    },

    toggleSeuExpand(seuId) {
        if (!this._seuExpanded) this._seuExpanded = new Set();
        if (this._seuExpanded.has(seuId)) {
            this._seuExpanded.delete(seuId);
        } else {
            this._seuExpanded.add(seuId);
        }
        const data = store.getState().activeTechnicalProposal;
        this.renderModal(data);
    },

    /**

     * Captura dados do DOM para o equipamento ativo

     */

    captureEquipmentData() {

        const form = document.getElementById('form-proposta-tecnica');

        if (!form || this.activeEquipmentIndex === -1) return;

        if (!form.isConnected) return;



        const data = store.getState().activeTechnicalProposal;

        if (!data || !data.equipments || !data.equipments[this.activeEquipmentIndex]) {

            console.warn("[PropostaTecnica] captureEquipmentData aborted: missing data or equipment", { data, index: this.activeEquipmentIndex });

            return;

        }

        

        let eq = data.equipments[this.activeEquipmentIndex];

        if (eq && eq.type === 'TR-MT' && ['loads','busbars','labor','calc_eletrico','calc_mecanico'].includes(this.activeSubTab)) {
            return;
        }
        if (eq && eq.type === 'TR-MT' && this.activeSubTab === 'exclusions') {
            return;
        }

        const formData = new FormData(form);

        // Always capture ufOrigem when form is submitted
        eq.ufOrigem = formData.get('eq_ufOrigem') || eq.ufOrigem || '';

        if (this.activeSubTab === 'ficha_ec') {

            eq.tag = formData.get('eq_tag') || eq.tag;

            eq.type = formData.get('eq_type') || eq.type;

            if (!eq.technical) eq.technical = {};

            const ecFields = ['qtd_modulos', 'altura_externa', 'altura_interna', 'largura_total', 'comprimento_total', 'peso_total'];

            ecFields.forEach(field => {

                const val = formData.get(`eq_${field}`);

                if (val !== null) eq.technical[field] = val;

            });

        }

        if (this.activeSubTab === 'technical') {

            const formTag = formData.get('eq_tag');
            console.log("[PropostaTecnica] captureEquipmentData -> formTag:", formTag, "old tag:", eq.tag);
            eq.tag = formTag || eq.tag;

            eq.type = formData.get('eq_type') || eq.type; // preserved from hidden input (read-only badge)

            if (eq.type === 'ELETROCENTRO' && (!eq.eletrocentroScope || eq.eletrocentroScope.length === 0)) {

                eq.eletrocentroScope = JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

            }

            if (!eq.technical) eq.technical = {};

            // ── Captura especial SEU ───────────────────────────────────────────
            if (eq.type === 'SEU') {

                const tensao = formData.get('seu_tensao_primaria');
                eq.technical.tensao_primaria = tensao || '';
                eq.technical.tensao_primaria_outro = tensao === 'Outro'
                    ? (formData.get('seu_tensao_primaria_outro') || '')
                    : '';

            } else {

                // Capturar todos os campos dinâmicos da ficha técnica

                const technicalFields = [

                    'tensao', 'tensao_max', 'frequencia', 'icc', 'icp', 'nbi', 'suportabilidade',

                    'corrente_nominal', 'iac', 'iac_tempo', 'lsc', 'particao', 'altitude',

                    'tensao_operacao', 'sistema_eletrico', 'comando', 'comando_fonte', 'auxiliar', 'auxiliar_fonte',

                    'coordenacao', 'execucao', 'montagem', 'instalacao', 'ip',

                    'cor_externa', 'camada_pintura', 'placa_montagem',

                    'segregacao', 'entrada_cabos', 'saida_cabos',

                    'acesso_frontal', 'acesso_traseiro', 'acesso_manutencao',

                    'protocolo', 'cabo_comunicacao', 'monitoramento_arco_eq',

                    'arco_interno', 'iluminacao', 'tomada', 'termostato', 'ventilacao',

                    'barramento_tratamento', 'termoretratil', 'norma_teste',

                    'alturaPainel', 'larguraPainel', 'profundidadePainel',

                    'fabricante'

                ];



                technicalFields.forEach(field => {

                    const val = formData.get(`eq_${field}`);

                    const otherVal = formData.get(`eq_${field}_other`);

                    eq.technical[field] = (val === 'Outro') ? (otherVal || '') : val;

                });

                // Capture painelTypeId (stored at eq root, not in eq.technical)
                const pTypeId = formData.get('eq_painelTypeId');
                eq.painelTypeId = pTypeId || null;

            }

        }




        if (this.activeSubTab === 'norms') {

            eq.norms = Array.from(form.querySelectorAll('input[name="selectedNorms"]:checked')).map(cb => cb.value);

        }



        if (this.activeSubTab === 'busbars') {

            eq.busbars = {

                main: { 

                    mat: formData.get('bus_main_mat'), 

                    dim: formData.get('bus_main_dim'), 

                    inc: formData.get('bus_main_inc'),

                    weight: formData.get('bus_main_weight')

                },

                branch: { 

                    mat: formData.get('bus_branch_mat'), 

                    dim: formData.get('bus_branch_dim'), 

                    inc: formData.get('bus_branch_inc'),

                    weight: formData.get('bus_branch_weight')

                },

                ground: { 

                    mat: formData.get('bus_ground_mat'), 

                    dim: formData.get('bus_ground_dim'),

                    weight: formData.get('bus_ground_weight')

                }

            };

        }



        

        if (this.activeSubTab === 'loads' && this.cargasSubView === 'edit') {

            const items = [];

            const rows = form.querySelectorAll('.detailed-load-row');

            if (rows.length > 0) {

                rows.forEach((row, i) => {

                    items.push({

                        tag: formData.get(`dload_tag_${i}`),

                        desc: formData.get(`dload_desc_${i}`),

                        power: formData.get(`dload_power_${i}`),

                        tensao: formData.get(`dload_tensao_${i}`),

                        current: formData.get(`dload_current_${i}`),

                        regime: formData.get(`dload_regime_${i}`),

                        type: formData.get(`dload_type_${i}`),

                        typicalId: formData.get(`dload_typicalId_${i}`)

                    });

                });

                eq.loads = items;

            }

        }



        if (this.activeSubTab === 'io_list') {
            const currentIo = eq.ioList || { racks: [] };
            const racks = (currentIo.racks || []).map((rack, ri) => {
                const slots = (rack.slots || []).map((slot, si) => {
                    const channels = (slot.channels || []).map((ch, ci) => ({
                        channelNumber: formData.get(`io_ch_num_${ri}_${si}_${ci}`) ?? ch.channelNumber ?? ci,
                        channelType: formData.get(`io_ch_type_${ri}_${si}_${ci}`) || ch.channelType || 'DI',
                        signalLevel: formData.get(`io_ch_signal_${ri}_${si}_${ci}`) || ch.signalLevel || '',
                        fieldDevice: formData.get(`io_ch_device_${ri}_${si}_${ci}`) || ch.fieldDevice || '',
                        tag: formData.get(`io_ch_tag_${ri}_${si}_${ci}`) || ch.tag || '',
                        terminalNumber: formData.get(`io_ch_terminal_${ri}_${si}_${ci}`) || ch.terminalNumber || '',
                        wireColor: formData.get(`io_ch_wirecolor_${ri}_${si}_${ci}`) || ch.wireColor || '',
                        wireNumber: formData.get(`io_ch_wirenum_${ri}_${si}_${ci}`) || ch.wireNumber || '',
                        cableId: formData.get(`io_ch_cable_${ri}_${si}_${ci}`) || ch.cableId || '',
                        junctionBox: formData.get(`io_ch_jb_${ri}_${si}_${ci}`) || ch.junctionBox || '',
                        status: formData.get(`io_ch_status_${ri}_${si}_${ci}`) || ch.status || 'active',
                        notes: formData.get(`io_ch_notes_${ri}_${si}_${ci}`) || ch.notes || ''
                    }));
                    return {
                        position: formData.get(`io_slot_pos_${ri}_${si}`) ?? slot.position ?? si + 1,
                        modulePartNumber: formData.get(`io_slot_pn_${ri}_${si}`) ?? slot.modulePartNumber ?? '',
                        moduleType: formData.get(`io_slot_type_${ri}_${si}`) ?? slot.moduleType ?? 'DI',
                        signalType: formData.get(`io_slot_signal_${ri}_${si}`) ?? slot.signalType ?? '',
                        totalChannels: formData.get(`io_slot_channels_${ri}_${si}`) ?? slot.totalChannels ?? '',
                        channels
                    };
                });
                const fabEl = document.querySelector(`[name="io_rack_fabricante_${ri}"]`);
                const compactEl = document.querySelector(`[name="io_rack_compact_${ri}"]`);
                const modelEl = document.querySelector(`[name="io_rack_modelo_${ri}"]`);
                return {
                    position: formData.get(`io_rack_pos_${ri}`) ?? rack.position ?? ri + 1,
                    backplane: formData.get(`io_rack_bp_${ri}`) ?? rack.backplane ?? '',
                    cpu: formData.get(`io_rack_cpu_${ri}`) ?? rack.cpu ?? '',
                    powerSupply: formData.get(`io_rack_ps_${ri}`) ?? rack.powerSupply ?? '',
                    comm: formData.get(`io_rack_comm_${ri}`) ?? rack.comm ?? '',
                    fabricante: fabEl ? fabEl.value : (rack.fabricante || ''),
                    compactMode: compactEl ? compactEl.checked : !!rack.compactMode,
                    modelo: modelEl ? modelEl.value : (rack.modelo || ''),
                    slots
                };
            });
            const totals = this._calcIOTotals(racks);
            eq.ioList = { racks, ...totals };
            if (eq.type === 'PLC' || eq.type === 'REM') {
                const bom = deriveMaterials(eq.ioList || { racks: [] });
                eq.automationMaterials = (bom.items || []).map(item => ({
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
            }
        }

        if (this.activeSubTab === 'deviations') {
            const data = store.getState().activeTechnicalProposal;
            const devEq = data.equipments[this.activeEquipmentIndex];
            this._normalizeDeviations(devEq);
            devEq.deviations.forEach((it, i) => {
                if (it._editing) {
                    const docEl = document.querySelector(`[name="dev_documento_${i}"]`);
                    const solEl = document.querySelector(`[name="dev_solicitado_${i}"]`);
                    const desEl = document.querySelector(`[name="dev_desvio_${i}"]`);
                    if (docEl) it.documento = docEl.value;
                    if (solEl) it.solicitado = solEl.value;
                    if (desEl) it.desvio = desEl.value;
                    it._editing = false;
                }
            });
            devEq.deviations = devEq.deviations.map(({ _editing, ...rest }) => ({ id: rest.id || crypto.randomUUID(), ...rest }));
            store.setState({ activeTechnicalProposal: data });
            eq.deviations = devEq.deviations;

        }



        if (this.activeSubTab === 'labor') {

            const laborItems = [];

            const rows = form.querySelectorAll('.labor-row');

            rows.forEach(row => {

                const groupEl = row.querySelector('[name^="labor_group_"]');

                const roleEl = row.querySelector('[name^="labor_role_"]');

                const hoursEl = row.querySelector('[name^="labor_hours_"]');

                const rateEl = row.querySelector('[name^="labor_rate_"]');

                const autoEl = row.querySelector('[name^="labor_auto_"]');

                laborItems.push({

                    group: groupEl ? groupEl.value : '',

                    role: roleEl ? roleEl.value : '',

                    hours: hoursEl ? app.parseCurrency(hoursEl.value || '0') : 0,

                    hourlyRate: rateEl ? app.parseCurrency(rateEl.value || '0') : 0,

                    auto: autoEl ? autoEl.value === 'true' : false

                });

            });

            eq.labor = { items: this.deduplicarLaborItems(laborItems) };

        }

        if (this.activeSubTab === 'expenses') {

            const expenseItems = [];

            const rows = form.querySelectorAll('.expense-row');

            rows.forEach((row, i) => {

                expenseItems.push({

                    desc: formData.get(`exp_desc_${i}`),

                    unit: app.parseCurrency(formData.get(`exp_unit_${i}`) || '0'),

                    qtd: app.parseCurrency(formData.get(`exp_qtd_${i}`) || '0'),



                });

            });

            eq.expenses = expenseItems;

        }



        if (this.activeSubTab === 'materiais') {
            const materialItems = [];
            const rows = form.querySelectorAll('.mat-row');
            rows.forEach((row, i) => {
                const qtd = app.parseCurrency(formData.get(`mat_qtd_${i}`) || '0');
                const custo = app.parseCurrency(formData.get(`mat_custo_${i}`) || '0');
                materialItems.push({
                    materialId: formData.get(`mat_materialId_${i}`) || '',
                    descricao: formData.get(`mat_desc_${i}`) || '',
                    fabricante: formData.get(`mat_fabricante_${i}`) || '',
                    codigoFabricante: formData.get(`mat_codfab_${i}`) || '',
                    modelo: formData.get(`mat_modelo_${i}`) || '',
                    custo: custo,
                    qtd: qtd
                });
            });
            eq.materials = materialItems;
        }

        if (this.activeSubTab === 'eletrocentro') {

            const groups = [];

            document.querySelectorAll('.el-scope-group').forEach((tbody) => {

                const groupNameInput = tbody.querySelector('.el-group-name');

                const groupName = groupNameInput ? groupNameInput.value.trim() : 'GRUPO';

                const items = [];

                tbody.querySelectorAll('.el-scope-row').forEach((row) => {

                    items.push({

                        desc: row.querySelector('input[name="el_scope_desc"]')?.value || '',

                        minhaEmpresa: row.querySelector('input[name="el_scope_empresa"]')?.checked || false,

                        na: row.querySelector('input[name="el_scope_na"]')?.checked || false,

                        cli: row.querySelector('input[name="el_scope_cli"]')?.checked || false

                    });

                });

                groups.push({ groupName, items });

            });

            eq.eletrocentroScope = groups;

        }



        if (this.activeSubTab === 'calc_eletrico') {

            if (!eq.calculosEletricos) eq.calculosEletricos = {};

            const ceFields = ['corrente_nominal', 'corrente_curto', 'tensao_nominal', 'potencia_instalada',
                              'potencia_demandada', 'fator_demanda', 'fator_potencia', 'corrente_barramento',
                              'corrente_pico', 'observacoes'];

            ceFields.forEach(field => {

                const val = formData.get(`ce_${field}`);

                if (val !== null) eq.calculosEletricos[field] = val;

            });

        }



        if (this.activeSubTab === 'calc_mecanico') {

            if (!eq.calculosMecanicos) eq.calculosMecanicos = {};

            const cmFields = ['altura', 'largura', 'profundidade', 'peso', 'espessura_chapa',
                              'espessura_frontal', 'secao_barramento', 'carga_piso',
                              'dissipacao_calor', 'observacoes'];

            cmFields.forEach(field => {

                const val = formData.get(`cm_${field}`);

                if (val !== null) eq.calculosMecanicos[field] = val;

            });

        }



        // Persistir também o estado de navegação atual no dado

        data.lastActiveTab = this.activeTab;

        data.lastActiveSubTab = this.activeSubTab;

        data.lastActiveEquipmentIndex = this.activeEquipmentIndex;



        store.setState({ activeTechnicalProposal: data });

    },



    addEquipment() {

        const html = `

            <div id="modal-add-eq" class="modal-overlay" style="z-index: 9999;">

                <div class="modal" style="width: 400px; padding: 25px; border-radius: 16px;">

                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">Novo Equipamento</h3>

                    <div class="form-group">

                        <label class="form-label">TAG do Equipamento</label>

                        <input type="text" id="new-eq-tag" class="form-control" placeholder="Ex: CCM-01" value="TAG-0${store.getState().activeTechnicalProposal.equipments.length + 1}">

                    </div>

                    <div class="form-group">

                        <label class="form-label">Tipo de Equipamento</label>

                        <select id="new-eq-type" class="form-control">

                            <option value="CCM-BT">CCM-BT (Centro de Controle de Motores BT)</option>

                            <option value="QGBT">QGBT (Quadro Geral de Baixa Tensão)</option>

                            <option value="CUB-MT">Cubículo de Média Tensão (MT)</option>

                            <option value="ELETROCENTRO">ELETROCENTRO (Sala Elétrica Modular)</option>

                            <option value="QTA">QTA (Quadro de Transferência Automática)</option>

                            <option value="PLC">PLC (Painel de Automação)</option>

                            <option value="BC">BC (Banco de Capacitores)</option>

                            <option value="REM">REM (Remota de Automação)</option>

                            <option value="PNC">PNC (Painel de Controle)</option>

                            <option value="QDL">QDL (Quadro de Iluminação)</option>

                            <option value="QDF">QDF (Quadro Distribuição de Força)</option>

                            <option value="SEU">SEU (Subestação Unitária)</option>

                            <option value="TR-MT">TR-MT (Transformador de Potência)</option>

                        </select>

                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 25px; justify-content: flex-end;">

                        <button class="btn btn-cancel" onclick="document.getElementById('modal-add-eq').remove()">Cancelar</button>

                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmAddEquipment()" style="background: #1e3a8a;">Criar Equipamento</button>

                    </div>

                </div>

            </div>

        `;

        document.body.insertAdjacentHTML('beforeend', html);

    },



    addSeu(tag) {

        const data = store.getState().activeTechnicalProposal;

        const equipments = data.equipments || [];

        // IDs já vinculados a alguma SEU
        const boundIds = new Set();
        equipments.filter(e => e.type === 'SEU').forEach(seu => {
            (seu.seu_components || []).forEach(id => boundIds.add(String(id)));
        });

        // Equipamentos disponíveis (não-SEU, não vinculados a outra SEU)
        const available = equipments.filter(e =>
            e.type !== 'SEU' && !boundIds.has(String(e.id))
        );

        const nextNum = equipments.filter(e => e.type === 'SEU').length + 1;

        const html = `
            <div id="modal-add-seu" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 520px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
                        <i class="ph ph-lightning-slash"></i> Nova Subestação Unitária (SEU)
                    </h3>

                    <div class="form-group">
                        <label class="form-label">Tag da SEU</label>
                        <input type="text" id="seu-tag" class="form-control" placeholder="Ex: SEU-01" value="${tag || `SEU-0${nextNum}`}">
                    </div>

                    <div class="form-group" style="margin-top: 15px;">
                        <label class="form-label">Tensão Primária (V)</label>
                        <select id="seu-tensao" class="form-control" onchange="app.propostaTecnica.validateSeuTensao()">
                            <option value="">Selecione...</option>
                            <option value="6,0kV">6,0 kV</option>
                            <option value="6,9kV">6,9 kV</option>
                            <option value="11,9kV">11,9 kV</option>
                            <option value="13,8kV">13,8 kV</option>
                            <option value="22kV">22 kV</option>
                            <option value="34,5kV">34,5 kV</option>
                            <option value="Outro">Outro</option>
                        </select>
                        <div id="seu-tensao-outro-wrap" style="display:none; margin-top:8px;">
                            <input type="text" id="seu-tensao-outro" class="form-control" placeholder="Especifique a tensão...">
                        </div>
                        <div id="seu-tensao-msg" style="font-size: 12px; margin-top: 4px; color: #94a3b8;"></div>
                    </div>

                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        <label class="form-label" style="font-weight: 700; color: #1e3a8a;">Equipamentos desta SEU</label>
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">
                            Selecione os equipamentos que compõem esta subestação.
                            ${available.length === 0 ? '<div style="color:#dc2626;margin-top:4px;">Nenhum equipamento disponível. Crie equipamentos primeiro.</div>' : ''}
                        </div>
                        <div id="seu-comp-list" style="max-height: 260px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
                            ${available.length === 0 ? '<div style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum equipamento disponível para adicionar à SEU.</div>' : available.map(e => `
                                <label style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s;"
                                       onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='transparent'">
                                    <input type="checkbox" name="seu-comp-cb" value="${e.id}" onchange="app.propostaTecnica.updateSeuCompMsg()" style="width: 16px; height: 16px; accent-color: #92400e; flex-shrink: 0;">
                                    <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 13px; font-weight: 600;">${e.tag}</span>
                                        <span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">${e.type}</span>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                        <div id="seu-comp-msg" style="font-size: 12px; margin-top: 6px; min-height: 18px;"></div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 25px; justify-content: flex-end;">
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-add-seu').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmSeu()" style="background: #1e3a8a;">Criar SEU</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    validateSeuTensao() {
        const sel = document.getElementById('seu-tensao');
        const outroWrap = document.getElementById('seu-tensao-outro-wrap');
        const msg = document.getElementById('seu-tensao-msg');
        if (sel.value === 'Outro') {
            outroWrap.style.display = 'block';
            msg.textContent = 'Informe a tensão primária manualmente (deve ser > 1000V).';
            msg.style.color = '#f59e0b';
        } else if (sel.value) {
            outroWrap.style.display = 'none';
            msg.textContent = '';
        } else {
            outroWrap.style.display = 'none';
            msg.textContent = '';
        }
    },

    toggleSeuTensaoOutro(sel) {
        const wrap = document.getElementById('seu_tensao_primaria_outro_wrap');
        if (wrap) {
            wrap.style.display = (sel.value === 'Outro' || !sel.value) ? '' : 'none';
        }
    },

    updateSeuCompMsg() {
        const msg = document.getElementById('seu-comp-msg');
        if (!msg) return;
        const data = store.getState().activeTechnicalProposal;
        const checkboxes = document.querySelectorAll('#seu-comp-list input[name="seu-comp-cb"]:checked');
        const count = checkboxes.length;
        const hasTrMt = Array.from(checkboxes).some(cb => {
            const eq = (data.equipments || []).find(e => String(e.id) === String(cb.value));
            return eq && eq.type === 'TR-MT';
        });
        if (count === 0) {
            msg.innerHTML = '<span style="color:#f59e0b;">⚠️ Nenhum equipamento selecionado.</span>';
        } else if (!hasTrMt) {
            msg.innerHTML = `<span style="color:#f59e0b;">⚠️ ${count} equipamento(s) — Nenhum TR-MT selecionado (recomendado).</span>`;
        } else {
            msg.innerHTML = `<span style="color:#16a34a;">✅ ${count} equipamento(s) — TR-MT presente.</span>`;
        }
    },

    addSeuComponent(seuId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu) return;

        // IDs já vinculados
        const boundIds = new Set();
        data.equipments.filter(e => e.type === 'SEU').forEach(s => {
            (s.seu_components || []).forEach(id => boundIds.add(String(id)));
        });

        const available = data.equipments.filter(e =>
            e.type !== 'SEU' && !boundIds.has(String(e.id))
        );

        if (available.length === 0) return app.toast('Nenhum equipamento disponível para adicionar.', 'error');

        const html = `
            <div id="modal-add-seu-comp" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 420px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top:0;color:#1e3a8a;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        Adicionar Componente — ${seu.tag}
                    </h3>
                    <div style="max-height:300px;overflow-y:auto;">
                        ${available.map(e => `
                            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;cursor:pointer;"
                                   onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='transparent'">
                                <input type="checkbox" name="seu-add-comp-cb" value="${e.id}" style="width:16px;height:16px;accent-color:#92400e;">
                                <span style="flex:1;font-size:13px;font-weight:600;">${e.tag}</span>
                                <span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">${e.type}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div style="display:flex;gap:10px;margin-top:25px;justify-content:flex-end;">
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-add-seu-comp').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmAddSeuComponent(${seuId})" style="background:#1e3a8a;">Adicionar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmAddSeuComponent(seuId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu) return;
        if (!seu.seu_components) seu.seu_components = [];

        const checkboxes = document.querySelectorAll('#modal-add-seu-comp input[name="seu-add-comp-cb"]:checked');
        checkboxes.forEach(cb => {
            const id = cb.value;
            if (!seu.seu_components.includes(id)) {
                seu.seu_components.push(id);
            }
        });

        document.getElementById('modal-add-seu-comp').remove();
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
        app.toast(`Componente(s) adicionado(s) à ${seu.tag}.`, 'success');
    },

    removeSeuComponent(seuId, compId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu || !seu.seu_components) return;

        seu.seu_components = seu.seu_components.filter(id => String(id) !== String(compId));
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);

        const compEq = data.equipments.find(e => String(e.id) === String(compId));
        if (compEq) this.resetSeuComponentIpi(compEq.tag);

        app.toast('Componente removido da SEU e IPI restaurado.', 'success');
    },

    resetSeuComponentIpi(tag) {
        const prec = window.app?.precificacao;
        if (!prec || !prec.pricingMap || !prec.pricingMap[tag]) return;
        const def = prec.getDefaultPricingData();
        prec.pricingMap[tag].ipiIsento = def.ipiIsento;
        prec.pricingMap[tag].ipi = def.ipi;
    },

    undoSeu(seuId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu || seu.type !== 'SEU') return;

        if (!confirm(`Desfazer SEU ${seu.tag}? Os ${(seu.seu_components || []).length} equipamento(s) voltarão a ser independentes com IPI normal.`)) return;

        const index = data.equipments.indexOf(seu);

        (seu.seu_components || []).forEach(compId => {
            const compEq = data.equipments.find(e => String(e.id) === String(compId));
            if (compEq) this.resetSeuComponentIpi(compEq.tag);
        });

        data.equipments.splice(index, 1);
        this.activeEquipmentIndex = Math.max(0, data.equipments.length - 1);

        store.setState({ activeTechnicalProposal: data });
        this.syncScopeFromProposal();
        this.renderModal(data);

        const prec = window.app?.precificacao;
        if (prec) {
            prec.calculateAll();
            prec.render();
        }

        app.toast(`SEU ${seu.tag} desfeita. ${(seu.seu_components || []).length} equipamento(s) liberado(s) com IPI normal.`, 'success');
    },

    confirmSeu() {
        const tag = document.getElementById('seu-tag').value.trim();
        if (!tag) return app.toast('Informe a TAG da SEU', 'error');

        const tensaoSel = document.getElementById('seu-tensao');
        let tensao = tensaoSel.value;
        if (!tensao) {
            const msg = document.getElementById('seu-tensao-msg');
            if (msg) {
                msg.textContent = 'Selecione uma Tensão Primária (V) antes de criar a SEU.';
                msg.style.color = '#dc2626';
                msg.style.fontWeight = '600';
            }
            document.getElementById('seu-tensao')?.focus();
            return app.toast('Selecione a tensão primária', 'error');
        }
        if (tensao === 'Outro') {
            tensao = document.getElementById('seu-tensao-outro').value.trim();
            if (!tensao) return app.toast('Especifique a tensão primária', 'error');
        }

        const checkboxes = document.querySelectorAll('#seu-comp-list input[name="seu-comp-cb"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);

        const hasTrMt = selectedIds.some(id => {
            const data = store.getState().activeTechnicalProposal;
            const eq = (data.equipments || []).find(e => String(e.id) === String(id));
            return eq && eq.type === 'TR-MT';
        });

        if (!hasTrMt && !confirm('Nenhum Transformador (TR-MT) selecionado. Deseja continuar mesmo assim?')) {
            return;
        }

        const data = store.getState().activeTechnicalProposal;

        const newSeu = {
            id: Date.now(),
            tag: tag,
            type: 'SEU',
            ufOrigem: store.getState().company?.uf || '',
            seu_components: selectedIds,
            norms: [],
            technical: { tensao_primaria: tensao },
            loads: []
        };

        data.equipments.push(newSeu);
        this.activeEquipmentIndex = data.equipments.length - 1;
        this.activeSubTab = 'technical';
        document.getElementById('modal-add-seu').remove();
        this.syncScopeFromProposal();
        app.toast(`SEU ${tag} criada com ${selectedIds.length} equipamento(s).`, 'success');
    },

    confirmAddEquipment() {

        const tag = document.getElementById('new-eq-tag').value;

        const type = document.getElementById('new-eq-type').value;

        if (!tag) return app.toast('Informe a TAG', 'error');

        if (type === 'SEU') {
            document.getElementById('modal-add-eq').remove();
            return this.addSeu(tag);
        }

        const data = store.getState().activeTechnicalProposal;

        const isAutomation = type === 'PLC' || type === 'REM';

        const newEq = {

            id: Date.now(),

            tag: tag,

            type: type,

            ufOrigem: store.getState().company?.uf || '',

            norms: type === 'CUB-MT' ? ['nbr_iec_62271', 'nr10', 'nr12', 'nbr14039', 'nbr_iec_60529'] : type === 'ELETROCENTRO' ? ['iec_62271_202', 'nbr_8800', 'nbr_13231', 'nbr_10898'] : ['nbr_iec_61439', 'nr10', 'nr12', 'nbr_iec_60529'],

            technical: this.getDefaultTechnicalForType(type),

            loads: [],
            materials: [],
            painelTypeId: null,
            autoChaparia: true,

            ...(isAutomation ? {
                ioList: {
                    racks: [],
                    totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0,
                    spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0,
                    ioTypicals: {
                        DI: { terminalBlocks: 1, fuseTerminal: true, relayTerminal: false, surgeProtector: false, wireColor: 'blue', wiringType: '2-wire', cableType: 'standard', notes: '' },
                        DO: { terminalBlocks: 1, fuseTerminal: false, relayTerminal: true, surgeProtector: false, wireColor: 'red', wiringType: '2-wire', cableType: 'standard', notes: '' },
                        AI: { terminalBlocks: 3, fuseTerminal: false, relayTerminal: false, surgeProtector: true, wireColor: 'green', wiringType: '3-wire', cableType: 'shielded-twisted-pair', notes: '' },
                        AO: { terminalBlocks: 2, fuseTerminal: false, relayTerminal: false, surgeProtector: false, wireColor: 'yellow', wiringType: '2-wire', cableType: 'shielded', notes: '' }
                    }
                }
            } : {})

        };



        data.equipments.push(newEq);

        this.activeEquipmentIndex = data.equipments.length - 1;

        this.activeSubTab = 'technical';

        document.getElementById('modal-add-eq').remove();

        this.syncScopeFromProposal();

        app.toast(`Equipamento ${tag} adicionado.`, 'success');

    },



    getDefaultTechnicalForType(type) {

        if (type === 'TR-MT') {

            return {
                tipo: 'Trifásico Seco',
                potencia: '2000kVA',
                enrolamento: 'Alumínio',
                tensao_primaria: '13,8kV',
                tensao_secundaria: '440-254V',
                ligacao_primaria: 'Triângulo Δ (delta)',
                ligacao_secundaria: 'Estrela Y',
                grupo_ligacao: 'Dyn1',
                frequencia: '60Hz',
                fator_k: '1',
                classe: '15kV',
                ip: 'IP-23',
                classe_temperatura: 'F',
                instalacao: 'Abrigado',
                nbi: '95kV',
                resfriamento: 'Ar Natural (ONAN)',
                acessorios: 'Controlador de temperatura microprocessado com PT100',
                fabricante: 'WEG'
            };

        }

        if (type === 'CUB-MT') {

            return {

                tensao: '13.8kV',

                isolamento: '15kV',

                frequencia: '60Hz',

                icc: '16kA/1s',

                icp: '40kAp',

                iac: 'AFLR',

                perda_arco: 'LSC-2B',

                ip: 'IP-4X',

                cor: 'RAL 7032'

            };

        }

        if (type === 'ELETROCENTRO') {

            return {

                tensao: '380V',

                comando: '24Vcc',

                ip: 'IP-54',

                instalacao: 'Ao Tempo',

                cor: 'RAL 7035',

                ar_condicionado: 'Sim',

                iluminacao_emergencia: 'Sim'

            };

        }

        return {

            fabricante: 'Allen-Bradley',

            tensao: '380V',

            comando: '24Vcc',

            sistema_eletrico: '',

            tensao_operacao: '',

            corrente_nominal: '',

            frequencia: '60Hz',

            icc: '50kA',

            ip: 'IP-42',

            segregacao: 'Forma 2b',

            execucao: 'Fixa',

            instalacao: 'Abrigada',

            cor: 'RAL 7035',

            norma_teste: 'IEC 61439-1&2',

            alturaPainel: '2200',

            larguraPainel: '800',

            profundidadePainel: '600'

        };

    },

    _mapEqTypeToCategoria(eqType) {
        const map = {
            'CCM-BT': 'CCM',
            'QGBT': 'QGBT',
            'CUB-MT': 'CUB',
            'QTA': 'QTA',
            'PLC': 'PLC',
            'BC': 'BC',
            'REM': 'REM',
            'QDL': 'QDL',
            'QDF': 'QDF'
        };
        return map[eqType] || null;
    },

    _renderPainelTypeSelector(eq) {
        const categoria = this._mapEqTypeToCategoria(eq.type);
        const paineis = categoria ? (store.getState().painelTypes || []).filter(p => p.cat_categoria === categoria) : [];
        const selecionado = eq.painelTypeId || '';
        const painelSelecionado = paineis.find(p => p.id === selecionado);
        if (paineis.length === 0 && !selecionado) return '';
        return `
            <div class="form-group" style="border: 1px solid #dbeafe; border-radius: 10px; padding: 16px; background: #eff6ff; margin-bottom: 20px;">
                <label class="form-label" style="color: #1e40af; font-weight: 700;">Tipo de Painel (Estrutura)</label>
                <select name="eq_painelTypeId" class="form-control" onchange="app.propostaTecnica._onPainelTypeChange(this.value)" style="max-width: 500px;">
                    <option value="">${paineis.length > 0 ? 'Selecione um Tipo de Painel...' : 'Nenhum tipo disponível para esta categoria'}</option>
                    ${paineis.map(p => `
                        <option value="${p.id}" ${selecionado === p.id ? 'selected' : ''}>
                            ${p.tipo}${p.descricao ? ' — ' + p.descricao : ''} (${p.largura || '?'}x${p.profundidade || '?'}mm)
                        </option>
                    `).join('')}
                </select>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                    ${selecionado && painelSelecionado
                        ? 'Pré-carregado: ' + painelSelecionado.tipo + ' — ' + painelSelecionado.largura + 'x' + painelSelecionado.profundidade + 'mm, IP ' + (painelSelecionado.ip || '-')
                        : 'Selecione para pré-carregar dimensões, IP, cor e BOM da chaparia automaticamente.'}
                </div>
            </div>
        `;
    },

    _onPainelTypeChange(painelTypeId) {
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        if (!painelTypeId) {
            eq.painelTypeId = null;
            store.setState({ activeTechnicalProposal: data });
            this.renderSubTab();
            return;
        }

        const painel = store.getState().painelTypes.find(p => p.id === painelTypeId);
        if (!painel) return;

        eq.painelTypeId = painel.id;
        if (!eq.technical) eq.technical = {};
        if (painel.altura) eq.technical.alturaPainel = painel.altura;
        if (painel.largura) eq.technical.larguraPainel = painel.largura;
        if (painel.profundidade) eq.technical.profundidadePainel = painel.profundidade;
        if (painel.ip) eq.technical.ip = painel.ip;
        if (painel.cor) eq.technical.cor_externa = painel.cor;

        store.setState({ activeTechnicalProposal: data });
        app.toast(`Tipo de painel "${painel.tipo}" aplicado. Dimensões e IP pré-carregados.`, 'success');
        this.renderSubTab();
    },

    // ── Fase 2: Gerar materiais da chaparia a partir do layout ────────────────

    _gerarMateriaisChaparia(eq) {
        const painelType = (store.getState().painelTypes || []).find(p => p.id === eq.painelTypeId);
        const cabinets = eq.layoutConfig?.cabinetAssignments;
        if (!cabinets || Object.keys(cabinets).length === 0) return null;

        const fabricante = eq.technical?.fabricante || '';
        const bomBase = painelType?.items || [];
        const chapariaLists = store.getState().chapariaLists || [];
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        const gerados = [];

        const cabIds = Object.keys(cabinets);

        // ── Per-cabinet chaparia typical lookup ──
        cabIds.forEach(cabId => {
            const cab = cabinets[cabId];
            const w = cab.width || 800;
            const h = cab.height || 2300;
            const d = cab.depth || 600;

            // Try to find a chaparia typical matching fabricante + dimensions
            let typical = null;
            if (fabricante) {
                typical = chapariaLists.find(c =>
                    c.fabricante === fabricante &&
                    c.largura_mm === w &&
                    c.altura_mm === h &&
                    (c.profundidade_mm === d || c.profundidade_mm === 0)
                );
                if (!typical) {
                    typical = chapariaLists.find(c =>
                        c.fabricante === fabricante &&
                        c.largura_mm === w &&
                        c.altura_mm === h
                    );
                }
            }
            if (!typical) {
                typical = chapariaLists.find(c =>
                    (!c.fabricante || c.fabricante === fabricante) &&
                    c.largura_mm === w &&
                    c.altura_mm === h &&
                    (c.profundidade_mm === d || c.profundidade_mm === 0)
                );
            }

            if (typical && typical.items && typical.items.length > 0) {
                // Use chaparia typical items
                typical.items.forEach(item => {
                    gerados.push({
                        _origin: 'chaparia',
                        _cabId: cabId,
                        materialId: item.materialId || '',
                        descricao: item.descricao || '',
                        fabricante: item.fabricante || typical.fabricante || '',
                        codigoFabricante: item.codigoFabricante || '',
                        modelo: '',
                        custo: item.custo || 0,
                        qtd: item.qtd || 1,
                        _typicalId: typical.id
                    });
                });
            } else if (bomBase.length > 0) {
                // Fallback: use painelType BOM items × 1 cabinet
                bomBase.forEach(item => {
                    const descMatch = item.descricao ? item.descricao.match(/(\d{3,4})\s*mm/) : null;
                    const itemWidth = descMatch ? parseInt(descMatch[1]) : null;
                    const desc = itemWidth && itemWidth !== w
                        ? item.descricao.replace(String(itemWidth), String(w))
                        : item.descricao;
                    gerados.push({
                        _origin: 'chaparia',
                        _cabId: cabId,
                        materialId: item.materialId || '',
                        descricao: desc || item.descricao,
                        fabricante: item.fabricante || '',
                        codigoFabricante: item.codigoFabricante || '',
                        modelo: '',
                        custo: item.custo || 0,
                        qtd: item.qtd || 1
                    });
                });
            }
        });

        // ── Canaletas from layout ──
        const canaletas = layoutConfig.canaletas || [];
        if (canaletas.length > 0) {
            const barrasPorModelo = {};
            for (const can of canaletas) {
                const key = can.modelo || '50x50';
                if (!barrasPorModelo[key]) barrasPorModelo[key] = { qtd: 0, comprimento: 0 };
                if (can.tipo === 'quadro' && can.segmentos) {
                    for (const seg of can.segmentos) {
                        barrasPorModelo[key].comprimento += seg.comprimento || 0;
                    }
                } else {
                    barrasPorModelo[key].comprimento += can.comprimento || 0;
                }
            }
            for (const [modelo, dados] of Object.entries(barrasPorModelo)) {
                const barras = Math.ceil(dados.comprimento / 2000);
                gerados.push({
                    _origin: 'chaparia',
                    materialId: '',
                    descricao: `Canaleta ${modelo} — barra 2000mm`,
                    fabricante: '',
                    codigoFabricante: '',
                    modelo: '',
                    custo: 0,
                    qtd: barras
                });
            }
        }

        // ── Trilho DIN from layout lines ──
        const linhas = layoutConfig.linhas || this._getDefaultLayoutConfig().linhas;
        const linhasComTrilho = linhas.filter(l => l.temTrilho);
        if (linhasComTrilho.length > 0) {
            const larguraUtil = layoutConfig.larguraTrilhoDIN || 35;
            const comprimentoTotal = layoutConfig.comprimentoTrilho || cabIds.length * 1600;
            const barrasTrilho = Math.ceil(comprimentoTotal / 2000);
            gerados.push({
                _origin: 'chaparia',
                materialId: '',
                descricao: `Trilho DIN ${larguraUtil}mm — barra 2000mm`,
                fabricante: '',
                codigoFabricante: '',
                modelo: '',
                custo: 0,
                qtd: barrasTrilho
            });
        }

        // ── Side panels: always 2 ──
        const hasSidePanelItem = gerados.some(i =>
            (i.descricao || '').toLowerCase().includes('lateral')
        );
        if (!hasSidePanelItem) {
            gerados.push({
                _origin: 'chaparia',
                materialId: '',
                descricao: 'Fechamento Lateral (par)',
                fabricante: fabricante,
                codigoFabricante: '',
                modelo: '',
                custo: 0,
                qtd: 2
            });
        }

        // ── Consolidate items with same description+custo+fabricante ──
        const consolidado = {};
        gerados.forEach(item => {
            const key = (item.descricao || '') + '|' + (item.custo || 0) + '|' + (item.fabricante || '');
            if (consolidado[key]) {
                consolidado[key].qtd += item.qtd || 0;
            } else {
                consolidado[key] = { ...item };
            }
        });

        return Object.values(consolidado);
    },

    _aplicarMateriaisChaparia() {
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        const itens = this._gerarMateriaisChaparia(eq);
        if (!itens || itens.length === 0) {
            app.toast('Crie armários no Layout primeiro.', 'warning');
            return;
        }

        // Situação atual: primeira inserção ou substituição de chaparia existente?
        const chapariaAnterior = (eq.materials || []).filter(m => m._origin === 'chaparia');
        const custoAnterior = chapariaAnterior.reduce((s, i) => s + (i.custo || 0) * i.qtd, 0);
        const ehSubstituicao = chapariaAnterior.length > 0;

        // Show preview modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-chaparia-preview';
        const total = itens.reduce((s, i) => s + (i.custo || 0) * i.qtd, 0);
        modal.innerHTML = `
            <div class="modal" style="width:700px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3><i class="ph ph-package"></i> Materiais da Chaparia — ${eq.tag}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="font-size:13px;color:#64748b;margin-bottom:16px;">
                        Os seguintes materiais serão adicionados à Lista de Materiais do equipamento:
                    </div>
                    <div style="max-height:360px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;">
                        <table class="w-full" style="font-size:12px;">
                            <thead>
                                <tr style="background:#f8fafc;">
                                    <th style="padding:8px 10px;text-align:left;font-weight:700;">Descrição</th>
                                    <th style="padding:8px 10px;text-align:center;width:60px;">Qtd</th>
                                    <th style="padding:8px 10px;text-align:right;width:90px;">Custo Unit.</th>
                                    <th style="padding:8px 10px;text-align:right;width:100px;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itens.map(i => `
                                    <tr style="border-top:1px solid #f1f5f9;">
                                        <td style="padding:8px 10px;">${i.descricao}</td>
                                        <td style="padding:8px 10px;text-align:center;">${i.qtd}</td>
                                        <td style="padding:8px 10px;text-align:right;">${app.formatCurrency(i.custo || 0)}</td>
                                        <td style="padding:8px 10px;text-align:right;font-weight:700;">${app.formatCurrency((i.custo || 0) * i.qtd)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background:#f8fafc;border-top:2px solid #e2e8f0;">
                                    <td colspan="3" style="padding:10px;text-align:right;font-weight:700;text-transform:uppercase;">Total</td>
                                    <td style="padding:10px;text-align:right;font-weight:800;color:#1e3a8a;font-size:15px;">${app.formatCurrency(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:11px;color:#64748b;flex:1;">
                        ${ehSubstituicao
                            ? `<i class="ph ph-info"></i> Substituirá ${chapariaAnterior.length} item(ns) de chaparia existente — custo: ${app.formatCurrency(custoAnterior)} → ${app.formatCurrency(total)} (diferença ${app.formatCurrency(total - custoAnterior)}).`
                            : `<i class="ph ph-info"></i> Primeira inserção de chaparia — o custo do equipamento aumentará em ${app.formatCurrency(total)}.`}
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmarMateriaisChaparia()">
                        <i class="ph ph-check"></i> ${ehSubstituicao ? 'Confirmar e Substituir' : 'Confirmar e Adicionar'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _confirmarMateriaisChaparia() {
        document.getElementById('modal-chaparia-preview')?.remove();
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        const itens = this._gerarMateriaisChaparia(eq);
        if (!itens) return;

        // Remove old chaparia items and add new ones
        eq.materials = [...(eq.materials || []).filter(m => m._origin !== 'chaparia'), ...itens];
        store.setState({ activeTechnicalProposal: data });
        app.toast(`${itens.length} itens de chaparia adicionados aos materiais de ${eq.tag}!`, 'success');
    },

    removeEquipment(index) {

        const data = store.getState().activeTechnicalProposal;
        if (!data.equipments) return;
        const eq = data.equipments[index];
        if (!eq) return;

        if (eq.type === 'SEU') {
            if (!confirm(`Excluir SEU ${eq.tag} e liberar seus ${(eq.seu_components || []).length} equipamento(s)?`)) return;
            (eq.seu_components || []).forEach(compId => {
                const compEq = data.equipments.find(e => String(e.id) === String(compId));
                if (compEq) this.resetSeuComponentIpi(compEq.tag);
            });
        } else {
            // Verifica se é componente de alguma SEU
            const parentSeu = data.equipments.find(e => e.type === 'SEU' && (e.seu_components || []).includes(String(eq.id)));
            if (parentSeu && !confirm(`Excluir ${eq.tag}? Este equipamento pertence à SEU ${parentSeu.tag}.`)) return;
            if (!parentSeu && !confirm('Excluir este equipamento?')) return;
            // Remove das referências da SEU
            data.equipments.forEach(e => {
                if (e.type === 'SEU' && e.seu_components) {
                    e.seu_components = e.seu_components.filter(id => String(id) !== String(eq.id));
                }
            });
        }

        data.equipments.splice(index, 1);

        this.activeEquipmentIndex = Math.max(0, data.equipments.length - 1);

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },

    moveEquipment(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const data = store.getState().activeTechnicalProposal;
        const activeId = data.equipments[this.activeEquipmentIndex]?.id;
        const [moved] = data.equipments.splice(fromIndex, 1);
        const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
        data.equipments.splice(adjustedTo, 0, moved);
        this.activeEquipmentIndex = data.equipments.findIndex(e => e.id === activeId);
        if (this.activeEquipmentIndex === -1) this.activeEquipmentIndex = 0;
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    moveLoad(fromIdx, toIdx) {
        if (fromIdx === toIdx) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;
        const [moved] = eq.loads.splice(fromIdx, 1);
        const adjustedTo = toIdx > fromIdx ? toIdx - 1 : toIdx;
        eq.loads.splice(adjustedTo, 0, moved);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },



    renameEquipment(index) {

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[index];

        if (!eq) return;

        const newTag = prompt('Editar TAG do equipamento:', eq.tag);

        if (newTag && newTag.trim()) {

            eq.tag = newTag.trim();

            data.lastActiveEquipmentIndex = index;

            store.setState({ activeTechnicalProposal: data });

            this.renderModal(data);

            app.toast(`TAG alterada para ${newTag.trim()}`, 'success');

        }

    },
    clearAiField(field) {
        const state = store.getState();
        const p = state.activeTechnicalProposal;
        if (p && p._aiChanges) {
            if (p._aiChanges.geral) { const i = p._aiChanges.geral.indexOf(field); if (i !== -1) p._aiChanges.geral.splice(i, 1); }
            if (p._aiChanges.equipments) delete p._aiChanges.equipments[field];
        }
    },

    _hasAiForEq(sentinel) {
        const p = store.getState().activeTechnicalProposal;
        const eq = p?._aiChanges?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return false;
        if (eq instanceof Set) return eq.has(sentinel);
        return sentinel in eq;
    },

    clearAiFieldForEq(sentinel) {
        const p = store.getState().activeTechnicalProposal;
        const eq = p?._aiChanges?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (eq instanceof Set) eq.delete(sentinel);
        else delete eq[sentinel];
    },

    _clearAiVendorList() {
        const p = store.getState().activeTechnicalProposal;
        if (p?._aiChanges) p._aiChanges.vendorList = false;
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
        if (!this._usersCache) this._usersCache = [];
    },

    _refreshUserDropdown() {
        if (!this._usersCache || this._usersCache.length === 0) return;
        const _initials = name => name.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
        const selects = document.querySelectorAll('#form-proposta-tecnica select[data-user-select]');
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

    async renderModal(data) {
        await this._loadUsers();

        this.viewMode = 'form';

        this.forcedDashboard = false;

        if (!data) {

            console.warn("[PropostaTecnica] renderModal called with null data");

            return;

        }

        

        // Garantir estrutura mínima para propostas legadas ou novas

        if (!data.equipments) data.equipments = [];

        if (!data.scopeItems) data.scopeItems = [];

        if (!data.autproScope) data.autproScope = [];

        if (!data.revisions) data.revisions = [];

        if (!data.vendorList) data.vendorList = [];

        if (!data.infraestrutura) {
            data.infraestrutura = {
                activeDisciplina: 'civil',
                disciplinas: [
                    { id: 'civil', nome: 'Obra Civil', icone: 'ph-buildings', perda: 10, itens: [] },
                    { id: 'eletrica', nome: 'Infraestrutura Elétrica', icone: 'ph-lightning', perda: 10, itens: [] },
                    { id: 'spda', nome: 'SPDA / Aterramento', icone: 'ph-lightning-slash', perda: 10, itens: [] },
                    { id: 'mecanica', nome: 'Infraestrutura Mecânica', icone: 'ph-fan', perda: 10, itens: [] },
                    { id: 'cabeamento', nome: 'Cabeamento Estruturado', icone: 'ph-network', perda: 10, itens: [] },
                    { id: 'servicos', nome: 'Serviços Técnicos', icone: 'ph-wrench', perda: 10, itens: [] }
                ]
            };
        }
        if (!data.infraestrutura.activeDisciplina) data.infraestrutura.activeDisciplina = 'civil';

        if (data.equipments.length === 0) {
            this.activeEquipmentIndex = -1;
        } else if (data.lastActiveEquipmentIndex !== undefined) {
            this.activeEquipmentIndex = data.lastActiveEquipmentIndex;
        }

        if (typeof this.activeEquipmentIndex !== 'number') this.activeEquipmentIndex = -1;

        if (this.activeEquipmentIndex >= data.equipments.length && data.equipments.length > 0) this.activeEquipmentIndex = 0;

        

        const activeTab = data.lastActiveTab || this.activeTab || 'geral';

        const activeSubTab = data.lastActiveSubTab || this.activeSubTab || 'technical';

        

        // Sincronizar propriedades locais com o que veio do dado (âncora)

        this.activeTab = activeTab;

        this.activeSubTab = activeSubTab;



        const activeEq = (data.equipments && data.equipments.length > 0) 

            ? data.equipments[this.activeEquipmentIndex] 

            : null;

        const eq = activeEq;

        const company = store.getState().company || {};
        const isAUTPRO = company.folderName?.startsWith('AUT_');

        const html = `

            <div class="hierarchical-pt-view" style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">

                <!-- Header -->

                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">

                    <div>

                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">

                            <i class="ph ph-file-text"></i> Proposta Técnica <span style="font-weight: 300; opacity: 0.8;">| ${data.projeto || 'Novo Projeto'}</span>

                        </h2>

                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Gerenciamento de Equipamentos e Especificações</div>

                    </div>

                    <div style="display: flex; gap: 10px;">

                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoETModule.open()" style="color: white; border: 1px solid rgba(255,255,255,0.3);" title="Extrair dados de documento técnico com IA"><i class="ph ph-robot"></i> Importar de Documento</button>
                        <button class="btn btn-sm btn-ghost" onclick="window.comparacaoDocumentosModule.openFromToolbar(); return false;" style="color: white; border: 1px solid rgba(255,255,255,0.3);" title="Comparar documentos e quantitativos"><i class="ph ph-git-diff"></i> Comparar Documentos</button>

                        <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule.closeModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-arrow-left"></i> Voltar</button>

                    </div>

                </div>



                <!-- Main Navigation Tabs -->

                <div style="border-bottom:1px solid #e2e8f0;background:white;display:flex;overflow-x:auto;flex-shrink:0;padding:0 20px;">

                    <button type="button" class="tab-btn ${activeTab === 'geral' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('geral')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'geral' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'geral' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'geral' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-identification-card"></i> Dados Gerais</button>

                    <button type="button" class="tab-btn ${activeTab === 'equipments' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('equipments')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'equipments' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'equipments' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'equipments' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-cpu"></i> Equipamentos</button>

                    <button type="button" class="tab-btn ${activeTab === 'infraestrutura' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('infraestrutura')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'infraestrutura' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'infraestrutura' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'infraestrutura' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-toolbox"></i> Infraestrutura</button>

                    <button type="button" class="tab-btn ${activeTab === 'escopo' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('escopo')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'escopo' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'escopo' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'escopo' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-list-checks"></i> Escopo</button>

                    ${isAUTPRO ? `
                    <button type="button" class="tab-btn ${activeTab === 'escopoAUTPRO' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('escopoAUTPRO')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'escopoAUTPRO' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'escopoAUTPRO' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'escopoAUTPRO' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-clipboard-text"></i> Escopo AUTPRO</button>
                    ` : ''}

                    <button type="button" class="tab-btn ${activeTab === 'vendor' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('vendor')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'vendor' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'vendor' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'vendor' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-buildings"></i> Vendor List</button>

                    <button type="button" class="tab-btn ${activeTab === 'exclusions' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('exclusions')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'exclusions' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'exclusions' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'exclusions' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-x-circle"></i> Exclusões</button>

                    <button type="button" class="tab-btn ${activeTab === 'revisoes' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('revisoes')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'revisoes' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'revisoes' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'revisoes' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-clock-counter-clockwise"></i> Revisões</button>

                    <button type="button" class="tab-btn ${activeTab === 'assinaturas' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('assinaturas')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'assinaturas' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'assinaturas' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'assinaturas' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-pen-nib"></i> Assinaturas (Rodapé)</button>

                </div>



                <!-- Content Area -->

                <div class="module-body" style="flex: 1; overflow: hidden; background: rgb(250, 250, 250); position: relative; display: flex; flex-direction: column;">

                    <form id="form-proposta-tecnica" onsubmit="return false;" style="height: 100%; display: flex; flex-direction: column;">

                        <div style="flex: 1; overflow-y: auto; scrollbar-gutter: stable;">

                            ${activeTab === 'geral' ? this.renderTabGeral(data) : ''}

                            ${activeTab === 'escopo' ? this.renderTabEscopo(data) : ''}

                            ${activeTab === 'infraestrutura' ? this.renderTabInfraestrutura(data) : ''}

                            ${activeTab === 'equipments' ? this.renderTabEquipments(data, activeEq) : ''}

                            ${activeTab === 'vendor' ? this.renderTabVendorList(data) : ''}

                            ${activeTab === 'exclusions' ? this.renderProposalExclusions(data) : ''}

                            ${activeTab === 'revisoes' ? this.renderTabRevisoes(data) : ''}

                            ${activeTab === 'assinaturas' ? this.renderTabAssinaturas(data) : ''}

                            ${activeTab === 'escopoAUTPRO' && isAUTPRO ? this.renderTabEscopoAUTPRO(data) : ''}

                        </div>

                    </form>

                </div>



                <!-- Footer -->

                <div class="module-footer" style="padding: 15px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">

                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-ghost btn-export-word" onclick="window.propostaTecnicaModule.exportToWord()" style="background: var(--color-accent); color: white;"><i class="ph ph-file-doc"></i> Exportar Word</button>
                    </div>

                    <div style="display: flex; gap: 12px;">

                        <button type="button" class="btn btn-cancel" onclick="window.propostaTecnicaModule.closeModal()">Cancelar</button>

                        <button type="button" class="btn btn-primary btn-save" onclick="window.propostaTecnicaModule.save()" style="">Salvar</button>

                        <button type="button" class="btn btn-outline btn-save-as-new" onclick="window.propostaTecnicaModule.saveAsNew()" style="background: var(--color-accent); color: white; display: flex; align-items: center; gap: 6px;"><i class="ph ph-copy"></i> Salvar como Nova</button>

                    </div>

                </div>

            </div>

        `;

        const container = document.getElementById('view-proposta-tecnica');

        if (container) {

            container.innerHTML = html;

            if (this._savedScrollTop != null) {
                requestAnimationFrame(() => {
                    const sc = document.querySelector('#form-proposta-tecnica > div');
                    if (sc) sc.scrollTop = this._savedScrollTop;
                    this._savedScrollTop = null;
                });
            }

            // Draw side view on initial render if checkbox is already checked
            if (activeTab === 'equipments' && activeSubTab === 'layout') {
                const eq = data?.equipments?.[this.activeEquipmentIndex];
                if (eq?.layoutConfig?.showSideView) {
                    this._redrawLayoutCanvas();
                }
            }

            container.classList.remove('hidden-module');

            // Modo somente leitura (Fechada/Perdida no pipeline)
            if (store.getState().proposalReadOnly) {
                this._applyReadOnly(container);
            }

            // Auto-preenche dados do cliente a partir do nome extraído
            if (data.cliente) this.handleClientChange(data.cliente);



            // Add custom styles for the hierarchical view

            if (!document.getElementById('hierarchical-pt-styles')) {

                const style = document.createElement('style');

                style.id = 'hierarchical-pt-styles';

                style.textContent = `

                    .hierarchical-pt-view .tab-btn:hover { background: #f1f5f9; color: #1e3a8a; }

                    .hierarchical-pt-view .eq-item { transition: all 0.2s; }

                    .hierarchical-pt-view .eq-item:hover { background: #f1f5f9; border-color: #e2e8f0; }

                    .hierarchical-pt-view .eq-item.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }

                    .hierarchical-pt-view .eq-item.active:hover { background: rgb(56, 86, 14); border-color: rgb(56, 86, 14); color: white; }

                    .hierarchical-pt-view .eq-item.active button[title="Editar TAG"] { color: white !important; }

                    .hierarchical-pt-view .sub-tab-btn { cursor: pointer; transition: all 0.2s; }

                    .hierarchical-pt-view .sub-tab-btn:hover { color: var(--color-accent); }

                    .hierarchical-pt-view .sub-tab-btn.active { color: var(--color-accent); font-weight: 800; }

                    .hierarchical-pt-view .btn-save:hover { background-color: rgb(85, 40, 191) !important; border-color: rgb(85, 40, 191) !important; }

                    .hierarchical-pt-view .btn-save-as-new:hover { background-color: rgb(230, 134, 67) !important; border-color: rgb(230, 134, 67) !important; }

                    .hierarchical-pt-view .btn-export-word:hover { background-color: rgb(155, 158, 150) !important; border-color: rgb(155, 158, 150) !important; }

                    .hierarchical-pt-view .btn-add-revision:hover { background-color: rgb(0, 0, 255) !important; border-color: rgb(0, 0, 255) !important; }

                    .hierarchical-pt-view .form-label { font-weight: 700; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block; }

                    .hierarchical-pt-view .form-control { border-radius: 8px; border: 1.5px solid #e2e8f0; padding: 10px 14px; font-size: 13px; transition: all 0.2s; }

                    .hierarchical-pt-view .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); outline: none; }

                    .ai-filled { color: #2563eb !important; }
                    .ai-filled option { color: initial; }
                    .ai-label { color: #2563eb; font-size: 9px; font-weight: 700; margin-left: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                    .dragging { opacity: 0.4; }
                    .drag-over { background: #e0f2fe !important; border-bottom: 2px dashed #3b82f6 !important; }

                `;

                document.head.appendChild(style);

            }

            // Inicializar SortableJS para reordenar Cargas e LM
            this._initSortableLoads();

        }

    },

    _initSortableLoads() {
        const lmContainer = document.getElementById('lm-sortable-container');
        if (lmContainer && window.Sortable) {
            if (lmContainer.__sortable) lmContainer.__sortable.destroy();
            lmContainer.__sortable = Sortable.create(lmContainer, {
                handle: '.lm-drag-handle',
                animation: 150,
                ghostClass: 'opacity-30',
                onEnd: (evt) => {
                    if (evt.oldIndex === evt.newIndex) return;
                    this.captureEquipmentData();
                    const data = store.getState().activeTechnicalProposal;
                    const eq = data.equipments[this.activeEquipmentIndex];
                    if (!eq) return;
                    const [moved] = eq.loads.splice(evt.oldIndex, 1);
                    eq.loads.splice(evt.newIndex, 0, moved);
                    store.setState({ activeTechnicalProposal: data });
                    this.renderModal(data);
                }
            });
        }
    },



};
