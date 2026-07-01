import { store } from './state.js';

/**
 * Cubiculos Module (Típicos de Cubículo)
 */

const CubiculosModule = {
    init() {
        window.app.cubiculos = {
            render: this.render.bind(this),
            create: this.create.bind(this),
            edit: this.edit.bind(this),
            clone: this.clone.bind(this),
            addItem: this.addItem.bind(this),
            removeItem: this.removeItem.bind(this),
            save: this.save.bind(this),
            renderBuilder: this.renderBuilder.bind(this),
            closeBuilder: this.closeBuilder.bind(this),
            recalculateCosts: this.recalculateCosts.bind(this),
            openMaterialSelector: this.openMaterialSelector.bind(this),
            closeMaterialSelector: this.closeMaterialSelector.bind(this),
            filterSelectorItems: this.filterSelectorItems.bind(this),
            selectMaterial: this.selectMaterial.bind(this),
            triggerAddMaterial: this.triggerAddMaterial.bind(this),
            confirmAddMaterial: this.confirmAddMaterial.bind(this),
            updateAutoName: this.updateAutoName.bind(this),
            calculateCurrent: this.calculateCurrent.bind(this),
            togglePotencyFields: this.togglePotencyFields.bind(this),
            resetView: this.resetView.bind(this),
            remove: this.remove.bind(this)
        };

        this.viewMode = 'list';

        store.subscribe((state) => {
            // Re-render list if active
            const container = document.getElementById('cubiculos-list-container');
            if (container) this.renderList(state.cubiculos);
        });

        // Initial attach if needed
        this.currentBuilderState = {
            items: [],
            pendingMaterial: null
        };
        this._materialsByFabricante = null;
        this._materialsLength = 0;
    },

    resetView() {
        this.viewMode = 'list';
    },

    render() {
        if (this.viewMode === 'form') return;

        const container = document.getElementById('view-cubiculos');
        if (!container) return;

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <!-- Header -->
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-grid-nine"></i> Biblioteca de Típicos de Cubículo
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Engenharia de Cubículos de Média Tensão</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.cubiculos.create()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-plus"></i> Novo Cubículo</button>` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div id="cubiculos-list-container">
                        <div class="card" style="padding: 0; overflow: hidden;">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nome do Cubículo</th>
                                            <th>Tipo de Cubículo</th>
                                            <th>Tensão</th>
                                            <th>Icc (KA)</th>
                                            <th>Comunicação</th>
                                            <th>Custo Ref.</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="cubiculos-table-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.renderList(store.getState().cubiculos);
    },

    renderList(cubiculos) {
        const tbody = document.querySelector('#cubiculos-table-body');
        if (!tbody) return;

        if (!cubiculos || cubiculos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Nenhum cubículo cadastrado.</td></tr>`;
            return;
        }

        const priorityOrder = ['CE', 'CS', 'CM', 'CP', 'CT', 'CPS', 'CAN'];
        const sortedCubiculos = [...cubiculos].sort((a, b) => {
            const getPrefix = (nome) => (nome || '').split('-')[0].trim().toUpperCase();
            const pA = priorityOrder.indexOf(getPrefix(a.nome));
            const pB = priorityOrder.indexOf(getPrefix(b.nome));
            
            if (pA !== -1 && pB !== -1) {
                if (pA !== pB) return pA - pB;
                return a.nome.localeCompare(b.nome); // Mesma sigla, ordena alfabeticamente
            }
            if (pA !== -1) return -1;
            if (pB !== -1) return 1;
            return a.nome.localeCompare(b.nome);
        });

        tbody.innerHTML = sortedCubiculos.map(t => `
            <tr>
                <td style="font-weight: 600;">${t.nome}</td>
                <td>${t.tipoAcionamento || '-'}</td>
                <td>${t.tensao || '-'}</td>
                <td>${t.icc || '-'}</td>
                <td>${t.comunicacao || t.aplicacao || '-'}</td>
                <td>${app.formatCurrency(t.custoTotal || 0)}</td>
                <td>
                    ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.cubiculos.clone('${t.id}')" title="Duplicar Cubículo" style="color: var(--color-primary);"><i class="ph ph-copy"></i></button>` : ''}
                    ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.cubiculos.edit('${t.id}')" title="Editar Cubículo"><i class="ph ph-pencil-simple"></i></button>` : ''}
                    ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.cubiculos.remove('${t.id}')" title="Excluir Cubículo" style="color: #ef4444;"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    // --- Builder Logic ---

    create() {
        this.currentBuilderState = {
            id: null,
            items: [],
            pendingMaterial: null,
            nome: '',
            tipoAcionamento: '',
            comunicacao: '',
            tensao: '',
            correnteNominal: '',
            nbi: '',
            frequencia: '',
            instalacao: '',
            icc: '',
            protecao: '',
            releProtecao: '',
            drives: '',
            descricao_word: ''
        };
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    edit(id) {
        const t = store.getState().cubiculos.find(x => x.id === id);
        if (!t) return;
        this.currentBuilderState = JSON.parse(JSON.stringify(t)); // Deep copy
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    async remove(id) {
        const t = store.getState().cubiculos.find(x => x.id === id);
        if (!t) return;
        const confirmed = await window.app.confirm(`Excluir o cubículo "${t.nome}"?`);
        if (!confirmed) return;
        const ok = await store.deleteCubiculos(id);
        if (ok) {
            window.app.toast(`Cubículo "${t.nome}" excluído.`, 'info');
        } else {
            window.app.toast('Erro ao excluir cubículo.', 'error');
        }
    },

    clone(id) {
        const t = store.getState().cubiculos.find(x => x.id === id);
        if (!t) return;
        this.currentBuilderState = JSON.parse(JSON.stringify(t)); // Deep copy
        
        // Remove existing ID so it saves as new
        this.currentBuilderState.id = null;
        
        // Prepend "- Cópia" so user knows it's a clone before any modification
        this.currentBuilderState.nome = (t.nome || 'Cubículo') + ' - Cópia';
        
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
        
        if (window.app.toast) {
            window.app.toast("Cubículo duplicado! Faça suas alterações e salve.", "info");
        }
    },

    renderBuilder() {
        const state = this.currentBuilderState;

        // Modal with full screen builder feel
        const html = `
            <div id="form-cubiculos-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.cubiculos.closeBuilder()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">Construtor de Cubículo</h3>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <div class="text-sm text-muted" style="align-self: center;">Custo Total: <b id="builder-total">R$ 0,00</b></div>
                            <button class="btn btn-secondary" onclick="app.cubiculos.recalculateCosts()" title="Atualizar custos com base no banco de dados de materiais"><i class="ph ph-arrows-clockwise"></i> Atualizar Custos</button>
                            <button class="btn btn-cancel" onclick="app.cubiculos.closeBuilder()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.cubiculos.save()"><i class="ph ph-check"></i> Salvar Cubículo</button>
                        </div>
                    </div>

                    <div style="flex: 1; padding: 0; display: flex; overflow: hidden;">
                        <!-- Configuration Pane -->
                        <div style="width: 450px; padding: 20px; border-right: 1px solid var(--color-border); background: #f8fafc; overflow-y: auto;">
                            <h4 class="text-sm font-bold" style="margin-bottom: 16px;">Propriedades</h4>
                    <div class="form-group">
                        <label class="form-label">Nome do Cubículo *</label>
                        <input type="text" id="t-nome" class="form-control" value="${state.nome}" placeholder="Ex: Cubículo de Entrada 13,8KV">
                    </div>
                    <div class="row" style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex: 1.5;">
                            <label class="form-label">Tipo de Cubículo</label>
                            <select id="t-tipoAcionamento" class="form-control" onchange="app.cubiculos.togglePotencyFields();app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                <option value="Cubículo de Entrada">Cubículo de Entrada</option>
                                <option value="Cubículo de Seccionamento">Cubículo de Seccionamento</option>
                                <option value="Cubículo de Medição">Cubículo de Medição</option>
                                <option value="Cubículo de Proteção">Cubículo de Proteção</option>
                                <option value="Cubículo de Transformação">Cubículo de Transformação</option>
                                <option value="Cubículo de Proteção Contra Surto">Cubículo de Proteção Contra Surto</option>
                                <option value="Cubículo Aterramento de Neutro">Cubículo Aterramento de Neutro</option>
                            </select>
                        </div>
                    </div>

                    <div class="row" style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Tensão Nominal (KV)</label>
                            <select id="t-tensao" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                 <option value="3,6KV" ${state.tensao === '3,6KV' ? 'selected' : ''}>3,6KV</option>
                                <option value="7,2KV" ${state.tensao === '7,2KV' ? 'selected' : ''}>7,2KV</option>
                                <option value="12KV" ${state.tensao === '12KV' ? 'selected' : ''}>12KV</option>
                                <option value="17,5KV" ${state.tensao === '17,5KV' ? 'selected' : ''}>17,5KV</option>
                                <option value="24KV" ${state.tensao === '24KV' ? 'selected' : ''}>24KV</option>
                                <option value="36KV" ${state.tensao === '36KV' ? 'selected' : ''}>36KV</option>
                            </select>
                         </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Corrente Nominal (A)</label>
                            <select id="t-correnteNominal" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                <option value="630A" ${state.correnteNominal === '630A' ? 'selected' : ''}>630A</option>
                                <option value="1.250A" ${state.correnteNominal === '1.250A' ? 'selected' : ''}>1.250A</option>
                                <option value="1.600A" ${state.correnteNominal === '1.600A' ? 'selected' : ''}>1.600A</option>
                                <option value="2.000A" ${state.correnteNominal === '2.000A' ? 'selected' : ''}>2.000A</option>
                                <option value="2.500A" ${state.correnteNominal === '2.500A' ? 'selected' : ''}>2.500A</option>
                                <option value="3.150A" ${state.correnteNominal === '3.150A' ? 'selected' : ''}>3.150A</option>
                                <option value="4.000A" ${state.correnteNominal === '4.000A' ? 'selected' : ''}>4.000A</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Icc (KA) (1s)</label>
                            <select id="t-icc" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                <option value="16KA" ${state.icc === '16KA' ? 'selected' : ''}>16KA</option>
                                <option value="25KA" ${state.icc === '25KA' ? 'selected' : ''}>25KA</option>
                                <option value="31,5KA" ${state.icc === '31,5KA' ? 'selected' : ''}>31,5KA</option>
                                <option value="40KA" ${state.icc === '40KA' ? 'selected' : ''}>40KA</option>
                                <option value="50KA" ${state.icc === '50KA' ? 'selected' : ''}>50KA</option>
                            </select>
                        </div>
                    </div>
                    <div class="row" style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Disjuntor (Fabricante)</label>
                            <select id="t-protecao" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                <option value="ABB">ABB</option>
                                <option value="Eaton">Eaton</option>
                                <option value="Siemens">Siemens</option>
                                <option value="Schneider Electric">Schneider Electric</option>
                                <option value="WEG">WEG</option>
                                <option value="CHINT">CHINT</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Relé (Fabricante)</label>
                            <select id="t-releProtecao" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                <option value="SEL" ${state.releProtecao === 'SEL' ? 'selected' : ''}>SEL</option>
                                <option value="Siemens" ${state.releProtecao === 'Siemens' ? 'selected' : ''}>Siemens</option>
                                <option value="ABB" ${state.releProtecao === 'ABB' ? 'selected' : ''}>ABB</option>
                                <option value="Schneider Electric" ${state.releProtecao === 'Schneider Electric' ? 'selected' : ''}>Schneider Electric</option>
                                <option value="GE" ${state.releProtecao === 'GE' ? 'selected' : ''}>GE</option>
                                <option value="Pextron" ${state.releProtecao === 'Pextron' ? 'selected' : ''}>Pextron</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Chaparia (Fabricante)</label>
                            <select id="t-drives" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                <option value="QT">QT</option>
                                <option value="Pressmat">Pressmat</option>
                                <option value="Siemens">Siemens</option>
                                <option value="Eletromei">Eletromei</option>
                                <option value="Eletropoll">Eletropoll</option>
                                <option value="ABB">ABB</option>
                                <option value="Engemakro">Engemakro</option>
                                <option value="Carthom´s">Carthom´s</option>
                                <option value="Schneider Electric">Schneider Electric</option>
                            </select>
                        </div>
                    </div>
                            <div class="form-group">
                                <label class="form-label">Comunicação</label>
                                <select id="t-comunicacao" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                    <option value="">Selecione...</option>
                                    <option value="AS-Interface">AS-Interface</option>
                                    <option value="DeviceNet">DeviceNet</option>
                                    <option value="EtherCAT">EtherCAT</option>
                                    <option value="Ethernet/IP">Ethernet/IP</option>
                                    <option value="IO-LINK">IO-LINK</option>
                                    <option value="Modbus RTU">Modbus RTU</option>
                                    <option value="Modbus TCP">Modbus TCP</option>
                                    <option value="Profibus DP">Profibus DP</option>
                                    <option value="Profibus PA">Profibus PA</option>
                                    <option value="Profinet">Profinet</option>
                                    <option value="RS-232">RS-232</option>
                                    <option value="RS-485">RS-485</option>
                                <option value="IEC 61850">IEC 61850</option>
                                <option value="DNP3">DNP3</option>
                            </select>
                            </div>
                    <div class="row" style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Instalação</label>
                            <select id="t-instalacao" class="form-control" onchange="app.cubiculos.updateAutoName()">
                                <option value="">Selecione...</option>
                                <option value="Abrigada" ${state.instalacao === 'Abrigada' ? 'selected' : ''}>Abrigada</option>
                                <option value="Ao Tempo" ${state.instalacao === 'Ao Tempo' ? 'selected' : ''}>Ao Tempo</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Opcional-1</label>
                            <input type="text" id="t-nbi" class="form-control" value="${state.nbi}" placeholder="Digite..." oninput="app.cubiculos.updateAutoName()">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Opcional-2</label>
                            <input type="text" id="t-frequencia" class="form-control" value="${state.frequencia}" placeholder="Digite..." oninput="app.cubiculos.updateAutoName()">
                        </div>
                    </div>
                            <div class="form-group" style="margin-top: 15px;">
                                <label class="form-label" style="display: flex; justify-content: space-between;">
                                    <span>Especificação Técnica (Word)</span>
                                    <span class="text-xs text-muted font-normal">Para chave {especificacao_tecnica}</span>
                                </label>
                                <textarea id="t-descricao_word" class="form-control" rows="8" placeholder="Cole aqui a descrição detalhada para a Proposta Técnica (Ex: lista de bobinas, TCs, relés de proteção para colunas MT). Pode usar quebras de linha."></textarea>
                            </div>
                        </div>

                        <!-- BOM List (Right) -->
                        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;">
                            <div id="bom-header-container" style="padding: 10px 20px; border-bottom: 1px solid var(--color-border); background: #f1f5f9; display: flex; gap: 10px; align-items: center;">
                                <span class="font-bold text-sm" style="margin-right: auto;">Lista de Materiais (LM)</span>
                                
                                <div id="selected-material-display" style="font-size: 11px; color: var(--color-accent); font-weight: 600; display: none;"></div>


                                
                                <select class="form-control" style="width: 200px; font-size: 12px;" onchange="app.cubiculos.openMaterialSelector(this.value); this.value='';">
                                    <option value="">Selecione Fabricante...</option>
                                    <option value="ABB">ABB</option>
                                    <option value="Allen Bradley">Allen Bradley</option>
                                    <option value="Danfoss">Danfoss</option>
                                    <option value="Eletropoll">Eletropoll</option>
                                    <option value="Phoenix Contact">Phoenix Contact</option>
                                    <option value="Rockwell Automation">Rockwell Automation</option>
                                    <option value="Schneider Electric">Schneider Electric</option>
                                    <option value="Siemens">Siemens</option>
                                    <option value="Steck">Steck</option>
                                    <option value="Wago">Wago</option>
                                    <option value="WEG">WEG</option>
                                    <option value="__NEW__">+ Incluir Fabricante</option>
                                </select>
                            </div>
                            
                            <!-- Split View: Materials Search Result vs Selected Items -->
                            <div style="display: flex; flex: 1; overflow: hidden;">
                                <!-- Search Results -->
                                <div id="builder-search-results" style="width: 40%; border-right: 1px solid var(--color-border); overflow-y: auto; display: none;">
                                    <!-- Populated by JS -->
                                </div>

                                <!-- Selected Items table -->
                                <div style="flex: 1; overflow-y: auto; padding: 0;">
                                    <table class="table table-striped" style="margin: 0;">
                                        <thead>
                                            <tr>
                                                <th style="width: 60px; text-align: center;">QTD</th>
                                                <th style="padding-left: 10px;">DESCRIÇÃO</th>
                                                <th style="width: 100px; text-align: center;">MODELO</th>
                                                <th style="width: 100px; text-align: center;">CÓD. FAB.</th>
                                                <th style="width: 100px; text-align: center;">FABRICANTE</th>
                                                <th style="width: 100px; text-align: right;">VALOR UNIT. S/ IPI</th>
                                                <th style="width: 100px; text-align: right;">SUBTOTAL</th>
                                                <th style="width: 40px;"></th>
                                            </tr>
                                        </thead>
                                        <tbody id="builder-items-body">
                                            <!-- Items go here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('view-cubiculos');
        if (container) {
            container.innerHTML = html;
        }
        this.renderBuilderItems();

        // Initial setup
        document.getElementById('t-comunicacao').value = state.comunicacao || state.aplicacao || '';
        document.getElementById('t-tipoAcionamento').value = state.tipoAcionamento || '';
        document.getElementById('t-protecao').value = state.protecao || '';
        document.getElementById('t-icc').value = state.icc || '';
        document.getElementById('t-drives').value = state.drives || '';
        document.getElementById('t-frequencia').value = state.frequencia || '';
        document.getElementById('t-descricao_word').value = state.descricao_word || '';
    },

    togglePotencyFields() {
    },

    openMaterialSelector(manufacturer) {
        if (!manufacturer) return;

        if (manufacturer === '__NEW__') {
            window.app.toast("Funcionalidade de incluir novo fabricante será implementada em breve.", "info");
            return;
        }

        const panel = document.getElementById('builder-search-results');
        if (!panel) return;

        panel.style.display = 'block';
        panel.innerHTML = `
            <div style="padding: 10px; display: flex; flex-direction: column; height: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--color-border);">
                    <h3 style="font-size: 14px; margin: 0;">Selecione - <span style="color: var(--color-accent);">${manufacturer}</span></h3>
                    <button class="btn btn-ghost" onclick="app.cubiculos.closeMaterialSelector()" style="padding: 2px;"><i class="ph ph-x"></i></button>
                </div>
                
                <div style="padding: 10px 0; border-bottom: 1px solid var(--color-border); display: flex; gap: 10px;">
                    <input type="hidden" id="sel-manufacturer" value="${manufacturer}">
                    <div style="flex: 1;">
                        <input type="text" id="sel-filter-model" class="form-control" placeholder="Filtrar Modelo..." oninput="app.cubiculos.filterSelectorItems()" style="font-size: 12px;">
                    </div>
                    <div style="flex: 1;">
                        <input type="text" id="sel-filter-code" class="form-control" placeholder="Filtrar Código..." oninput="app.cubiculos.filterSelectorItems()" style="font-size: 12px;">
                    </div>
                </div>

                <div style="flex: 1; overflow-y: auto;">
                    <table class="table" style="width: 100%;">
                        <thead style="position: sticky; top: 0; background: white; z-index: 1;">
                            <tr>
                                <th style="padding: 8px 10px; font-size: 11px;">DESCRIÇÃO</th>
                                <th style="width: 100px; font-size: 11px;">MODELO</th>
                                <th style="width: 100px; font-size: 11px;">CÓD. FAB.</th>
                                <th style="width: 80px; font-size: 11px;">VALOR</th>
                                <th style="width: 40px;"></th>
                            </tr>
                        </thead>
                        <tbody id="selector-items-body">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        this.filterSelectorItems();
    },

    closeMaterialSelector() {
        const panel = document.getElementById('builder-search-results');
        if (panel) {
            panel.style.display = 'none';
            panel.innerHTML = '';
        }
    },

    _buildMaterialsIndex() {
        const materiais = store.getState().materiais || [];
        this._materialsByFabricante = {};
        this._materialsLength = materiais.length;
        for (const m of materiais) {
            const key = (m.fabricante || '').toLowerCase();
            if (!this._materialsByFabricante[key]) {
                this._materialsByFabricante[key] = [];
            }
            this._materialsByFabricante[key].push(m);
        }
    },

    filterSelectorItems() {
        const manufacturer = document.getElementById('sel-manufacturer').value;
        const filterModel = document.getElementById('sel-filter-model').value.toLowerCase();
        const filterCode = document.getElementById('sel-filter-code').value.toLowerCase();

        const tbody = document.getElementById('selector-items-body');
        if (!tbody) return;

        const materiais = store.getState().materiais || [];
        if (!this._materialsByFabricante || this._materialsLength !== materiais.length) {
            this._buildMaterialsIndex();
        }

        const target = manufacturer.toLowerCase();
        let filtered = this._materialsByFabricante[target] || [];

        if (filterModel || filterCode) {
            filtered = filtered.filter(m => {
                const modelText = (m.modelo || m.descricao || '').toLowerCase();
                const codeText = (m.codigoFabricante || '').toLowerCase();
                const matchModel = !filterModel || modelText.includes(filterModel);
                const matchCode = !filterCode || codeText.includes(filterCode);
                return matchModel && matchCode;
            });
        }

        const limited = filtered.slice(0, 200);

        if (limited.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">Nenhum material encontrado para ${manufacturer}.</td></tr>`;
            return;
        }

        tbody.innerHTML = limited.map(m => `
            <tr style="cursor: pointer;" onclick="app.cubiculos.selectMaterial('${m.id}')" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='white'">
                <td style="padding: 8px 15px;">
                    <div style="font-weight: 500;">${m.descricao}</div>
                </td>
                <td>
                    <div class="text-xs text-muted">${m.modelo || '-'}</div>
                </td>
                <td style="font-family: monospace; color: #475569;">${m.codigoFabricante || '-'}</td>
                <td>${app.formatCurrency(m.custo || 0)}</td>
                <td style="text-align: right;"><i class="ph ph-plus-circle" style="color: var(--color-accent);"></i></td>
            </tr>
        `).join('');
    },

    selectMaterial(id) {
        this.addItem(id, 1);
        if (window.app.toast) {
            const material = store.getState().materiais.find(m => m.id === id);
            window.app.toast(`Item adicionado: ${material?.descricao || ''}`, "success");
        }
    },

    clearPending() {
        this.currentBuilderState.pendingMaterial = null;
        const btn = document.getElementById('btn-add-mat');
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
        btn.innerHTML = 'Adic. Mat.';
    },

    triggerAddMaterial() {
        const pending = this.currentBuilderState.pendingMaterial;
        if (!pending) {
            window.app.toast("Selecione um material e um fabricante primeiro.", "warning");
            return;
        }

        // Show QTY Input Modal
        const html = `
            <div id="modal-qty-input" class="modal-overlay" style="z-index: 1200; background: rgba(0,0,0,0.2);">
                <div class="modal" style="width: 300px; box-shadow: var(--shadow-md);">
                    <div style="padding: 20px;">
                         <h4 class="text-sm font-bold" style="margin-bottom: 10px;">Quantidade</h4>
                         <div style="font-size: 13px; margin-bottom: 10px; color: #64748b;">${pending.descricao}</div>
                         <input type="number" id="input-qty-add" class="form-control" value="1" min="1" autofocus>
                         <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                             <button class="btn btn-cancel" onclick="document.getElementById('modal-qty-input').remove()">Cancelar</button>
                             <button class="btn btn-primary" onclick="app.cubiculos.confirmAddMaterial()">Confirmar</button>
                         </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(() => document.getElementById('input-qty-add').focus(), 50);
    },

    confirmAddMaterial() {
        const qtyVal = document.getElementById('input-qty-add').value;
        const qty = parseInt(qtyVal) || 1;

        if (this.currentBuilderState.pendingMaterial) {
            this.addItem(this.currentBuilderState.pendingMaterial.id, qty);
        }

        document.getElementById('modal-qty-input').remove();
        this.clearPending();
    },

    addItem(materialId, qtd = 1) {
        const material = store.getState().materiais.find(m => m.id === materialId);
        if (!material) return;

        // Check if already exists
        const existing = this.currentBuilderState.items.find(i => i.materialId === materialId);
        if (existing) {
            existing.qtd += qtd;
        } else {
            this.currentBuilderState.items.push({
                materialId: material.id,
                descricao: material.descricao,
                fabricante: material.fabricante,
                codigoFabricante: material.codigoFabricante, // Cod. Fab.
                modelo: material.modelo || '',
                custo: material.custo,
                qtd: qtd
            });
        }

        this.renderBuilderItems();
    },

    removeItem(index) {
        this.currentBuilderState.items.splice(index, 1);
        this.renderBuilderItems();
    },

    renderBuilderItems() {
        const tbody = document.getElementById('builder-items-body');
        const totalEl = document.getElementById('builder-total');
        if (!tbody) return;

        let total = 0;

        tbody.innerHTML = this.currentBuilderState.items.map((item, index) => {
            const subtotal = item.custo * item.qtd;
            total += subtotal;
            return `
                <tr>
                    <td style="text-align: center;"><input type="number" class="form-control" style="padding: 2px; height: 24px; text-align: center;" value="${item.qtd}" onchange="app.cubiculos.updateQtd(${index}, this.value)"></td>
                    <td style="padding-left: 10px;">
                        <div style="font-size: 13px;">${item.descricao || '-'}</div>
                    </td>
                    <td style="text-align: center;">
                        <div class="text-xs text-muted">${item.modelo || '-'}</div>
                    </td>
                    <td style="text-align: center;">
                         <div class="text-xs text-muted" style="font-family: monospace;">${item.codigoFabricante || (store.getState().materiais.find(m => m.id === item.materialId)?.codigoFabricante || '-')}</div>
                    </td>
                    <td style="text-align: center;">
                        <div class="text-xs text-muted">${item.fabricante || (store.getState().materiais.find(m => m.id === item.materialId)?.fabricante || '-')}</div>
                    </td>
                    <td style="text-align: right;">${app.formatCurrency(item.custo)}</td>
                    <td style="text-align: right;">${app.formatCurrency(subtotal)}</td>
                    <td>${store.canDelete() ? `<button class="btn btn-ghost text-danger" onclick="app.cubiculos.removeItem(${index})"><i class="ph ph-trash"></i></button>` : ''}</td>
                </tr>
            `;
        }).join('');

        if (totalEl) totalEl.textContent = app.formatCurrency(total);

        // Add helper for updateQtd to window app temporarily or bind it better
        window.app.cubiculos.updateQtd = (index, val) => {
            this.currentBuilderState.items[index].qtd = parseInt(val) || 1;
            this.renderBuilderItems();
        };
    },

    recalculateCosts() {
        const materials = store.getState().materiais;
        let updatedCount = 0;

        this.currentBuilderState.items.forEach(item => {
            const currentMat = materials.find(m => m.id === item.materialId);
            if (currentMat) {
                if (item.custo !== currentMat.custo) {
                    item.custo = currentMat.custo;
                    updatedCount++;
                }
                // Optional: Update description if changed
                // item.descricao = currentMat.descricao;
            }
        });

        if (updatedCount > 0) {
            alert(`${updatedCount} itens foram atualizados com os preços atuais.`);
            this.renderBuilderItems();
        } else {
            alert("Todos os itens já estão atualizados.");
        }
    },

    async save() {
        const nome = document.getElementById('t-nome').value;
        if (!nome) {
            window.app.toast("Nome do Cubículo é obrigatório.", "error");
            return;
        }

        this.currentBuilderState.nome = nome;
        this.currentBuilderState.tipoAcionamento = document.getElementById('t-tipoAcionamento').value;
        this.currentBuilderState.comunicacao = document.getElementById('t-comunicacao').value;
        this.currentBuilderState.tensao = document.getElementById('t-tensao').value;
        this.currentBuilderState.correnteNominal = document.getElementById('t-correnteNominal').value;
        this.currentBuilderState.icc = document.getElementById('t-icc').value;
        this.currentBuilderState.protecao = document.getElementById('t-protecao').value;
        this.currentBuilderState.releProtecao = document.getElementById('t-releProtecao').value;
        this.currentBuilderState.drives = document.getElementById('t-drives').value;
        this.currentBuilderState.frequencia = document.getElementById('t-frequencia').value;
        this.currentBuilderState.nbi = document.getElementById('t-nbi').value;
        this.currentBuilderState.instalacao = document.getElementById('t-instalacao').value;
        this.currentBuilderState.descricao_word = document.getElementById('t-descricao_word').value;

        const total = this.currentBuilderState.items.reduce((acc, i) => acc + (i.custo * i.qtd), 0);
        this.currentBuilderState.custoTotal = total;

        const { pendingMaterial, ...cleanData } = this.currentBuilderState;

        let ok;
        if (this.currentBuilderState.id) {
            ok = await store.updateCubiculos(this.currentBuilderState.id, { ...cleanData, id: this.currentBuilderState.id });
        } else {
            this.currentBuilderState.id = crypto.randomUUID();
            ok = await store.addCubiculos({ ...cleanData, id: this.currentBuilderState.id });
        }

        if (!ok) {
            window.app.toast("Erro ao salvar. Verifique se o servidor está rodando.", "error");
            return;
        }

        this.closeBuilder();
    },

    updateAutoName() {
        const mapping = {
            'Cubículo de Entrada': 'CE',
            'Cubículo de Seccionamento': 'CS',
            'Cubículo de Medição': 'CM',
            'Cubículo de Proteção': 'CP',
            'Cubículo de Transformação': 'CT',
            'Cubículo de Proteção Contra Surto': 'CPS',
            'Cubículo Aterramento de Neutro': 'CAN'
        };

        const tipo = mapping[document.getElementById('t-tipoAcionamento').value] || '';
        const tensao = document.getElementById('t-tensao').value || '';
        const correnteNominal = document.getElementById('t-correnteNominal').value || '';
        const icc = document.getElementById('t-icc').value || '';
        const instalacao = document.getElementById('t-instalacao').value || '';
        const protecao = document.getElementById('t-protecao').value || '';
        const releProtecao = document.getElementById('t-releProtecao').value || '';
        const drives = document.getElementById('t-drives').value || '';
        const comunicacao = document.getElementById('t-comunicacao').value || '';

        const opcional1 = document.getElementById('t-nbi').value || '';
        const opcional2 = document.getElementById('t-frequencia').value || '';

        const parts = [tipo, tensao, correnteNominal, icc, instalacao, protecao, releProtecao, drives, comunicacao, opcional1, opcional2].filter(p => p !== '');

        if (parts.length > 0) {
            document.getElementById('t-nome').value = parts.join('-');
        }
    },

    calculateCurrent() {
    },

    updateAutoNameSilently() {
        const mapping = {
            'Cubículo de Entrada': 'CE',
            'Cubículo de Seccionamento': 'CS',
            'Cubículo de Medição': 'CM',
            'Cubículo de Proteção': 'CP',
            'Cubículo de Transformação': 'CT',
            'Cubículo de Proteção Contra Surto': 'CPS',
            'Cubículo Aterramento de Neutro': 'CAN'
        };

        const tipo = mapping[document.getElementById('t-tipoAcionamento').value] || '';
        const tensao = document.getElementById('t-tensao').value || '';
        const correnteNominal = document.getElementById('t-correnteNominal').value || '';
        const icc = document.getElementById('t-icc').value || '';
        const instalacao = document.getElementById('t-instalacao').value || '';
        const protecao = document.getElementById('t-protecao').value || '';
        const releProtecao = document.getElementById('t-releProtecao').value || '';
        const drives = document.getElementById('t-drives').value || '';
        const comunicacao = document.getElementById('t-comunicacao').value || '';
        const opcional1 = document.getElementById('t-nbi').value || '';
        const opcional2 = document.getElementById('t-frequencia').value || '';

        const parts = [tipo, tensao, correnteNominal, icc, instalacao, protecao, releProtecao, drives, comunicacao, opcional1, opcional2].filter(p => p !== '');

        if (parts.length > 0) {
            document.getElementById('t-nome').value = parts.join('-');
        }
    },

    closeBuilder() {
        this.viewMode = 'list';
        this.render();
    }
};

// Initialize
window.cubiculosModule = CubiculosModule;
CubiculosModule.init();
