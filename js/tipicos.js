import { store } from './state.js';

/**
 * Tipicos Module (Típicos de Partida)
 */

const TipicosModule = {
    init() {
        window.app.tipicos = {
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
            const container = document.getElementById('tipicos-list-container');
            if (container) this.renderList(state.tipicos);
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

        const container = document.getElementById('view-tipicos');
        if (!container) return;

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <!-- Header -->
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-circuitry"></i> Biblioteca de Típicos de Partida
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Engenharia de Padrões e Listas de Materiais para Acionamentos</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.tipicos.create()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-plus"></i> Novo Típico</button>` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div id="tipicos-list-container">
                        <div class="card" style="padding: 0; overflow: hidden;">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nome do Típico</th>
                                            <th>Tipo de Partida</th>
                                            <th>Potência/Tensão</th>
                                            <th>Icc (KA)</th>
                                            <th>Comunicação</th>
                                            <th>Custo Ref.</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tipicos-table-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.renderList(store.getState().tipicos);
    },

    renderList(tipicos) {
        const tbody = document.querySelector('#tipicos-table-body');
        if (!tbody) return;

        if (!tipicos || tipicos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Nenhum típico cadastrado.</td></tr>`;
            return;
        }

        // Ordenação por sigla conforme solicitado: EG, ME, CS, SA, IF, SS, PD, PDR, AL, ET, BC
        const priorityOrder = ['EG', 'ME', 'CS', 'SA', 'IF', 'SS', 'PD', 'PDR', 'AL', 'ET', 'BC'];
        const sortedTipicos = [...tipicos].sort((a, b) => {
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

        tbody.innerHTML = sortedTipicos.map(t => `
            <tr>
                <td style="font-weight: 600;">${t.nome}</td>
                <td>${t.tipoAcionamento || '-'}</td>
                <td>${t.potencia || t.potenciaKvar || '-'} / ${t.tensao || '-'}</td>
                <td>${t.icc || '-'} kA</td>
                <td>${t.comunicacao || t.aplicacao || '-'}</td>
                <td>${app.formatCurrency(t.custoTotal || 0)}</td>
                <td>
                    ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.tipicos.clone('${t.id}')" title="Duplicar Típico" style="color: var(--color-primary);"><i class="ph ph-copy"></i></button>` : ''}
                    ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.tipicos.edit('${t.id}')" title="Editar Típico"><i class="ph ph-pencil-simple"></i></button>` : ''}
                    ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.tipicos.remove('${t.id}')" title="Excluir Típico" style="color: #ef4444;"><i class="ph ph-trash"></i></button>` : ''}
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
            regimeAcionamento: 'standard',
            comunicacao: '',
            potencia: '',
            tensao: '',
            icc: '',
            protecao: '',
            drives: '',
            tensaoComando: '',
            descricao_word: ''
        };
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    edit(id) {
        const t = store.getState().tipicos.find(x => x.id === id);
        if (!t) return;
        this.currentBuilderState = JSON.parse(JSON.stringify(t)); // Deep copy
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
    },

    async remove(id) {
        const t = store.getState().tipicos.find(x => x.id === id);
        if (!t) return;
        const confirmed = await window.app.confirm(`Excluir o típico "${t.nome}"?`);
        if (!confirmed) return;
        const ok = await store.deleteTipico(id);
        if (ok) {
            window.app.toast(`Típico "${t.nome}" excluído.`, 'info');
        } else {
            window.app.toast('Erro ao excluir típico.', 'error');
        }
    },

    clone(id) {
        const t = store.getState().tipicos.find(x => x.id === id);
        if (!t) return;
        this.currentBuilderState = JSON.parse(JSON.stringify(t)); // Deep copy
        
        // Remove existing ID so it saves as new
        this.currentBuilderState.id = null;
        
        // Prepend "- Cópia" so user knows it's a clone before any modification
        this.currentBuilderState.nome = (t.nome || 'Típico') + ' - Cópia';
        
        this.viewMode = 'form';
        this.render();
        this.renderBuilder();
        
        if (window.app.toast) {
            window.app.toast("Típico duplicado! Faça suas alterações e salve.", "info");
        }
    },

    renderBuilder() {
        const state = this.currentBuilderState;

        // Modal with full screen builder feel
        const html = `
            <div id="form-tipicos-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.tipicos.closeBuilder()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">Construtor de Típico</h3>
                            <div id="builder-context-info" style="display: none; font-size: 12px; margin-left: 16px; vertical-align: middle; border-left: 2px solid var(--color-border); padding-left: 16px;">
                                <div id="builder-context-name" style="font-weight: 600; color: #1e293b;"></div>
                                <div id="builder-context-current" style="color: #64748b; font-size: 11px;"></div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <div class="text-sm text-muted" style="align-self: center;">Custo Total: <b id="builder-total">R$ 0,00</b></div>
                            <button class="btn btn-secondary" onclick="app.tipicos.recalculateCosts()" title="Atualizar custos com base no banco de dados de materiais"><i class="ph ph-arrows-clockwise"></i> Atualizar Custos</button>
                            <button class="btn btn-cancel" onclick="app.tipicos.closeBuilder()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.tipicos.save()"><i class="ph ph-check"></i> Salvar Típico</button>
                        </div>
                    </div>

                    <div style="flex: 1; padding: 0; display: flex; overflow: hidden;">
                        <!-- Configuration Pane -->
                        <div id="builder-props-pane" style="width: 450px; padding: 20px; border-right: 1px solid var(--color-border); background: #f8fafc; overflow-y: auto;">
                            <h4 class="text-sm font-bold" style="margin-bottom: 16px;">Propriedades</h4>
                            <div class="form-group">
                                <label class="form-label">Nome do Típico *</label>
                                <input type="text" id="t-nome" class="form-control" value="${state.nome}" placeholder="Ex: Partida Direta 5CV">
                            </div>
                            <div class="row" style="display: flex; gap: 10px;">
                                <div class="form-group" style="flex: 1.5;">
                                    <label class="form-label">Tipo de Típico</label>
                                    <select id="t-tipoAcionamento" class="form-control" onchange="app.tipicos.togglePotencyFields()">
                                        <option value="">Selecione...</option>
                                        <option value="Inversor de Frequência">Inversor de Frequência</option>
                                        <option value="Soft-Starter">Soft-Starter</option>
                                        <option value="Partida Direta">Partida Direta</option>
                                        <option value="Partida Direta Reversora">Partida Direta Reversora</option>
                                        <option value="Estrela-Triângulo">Estrela-Triângulo</option>
                                        <option value="Alimentador">Alimentador</option>
                                        <option value="Entrada Geral">Entrada Geral</option>
                                        <option value="Medição">Medição</option>
                                        <option value="Comando e Sinalização">Comando e Sinalização</option>
                                        <option value="Serviços Auxiliares">Serviços Auxiliares</option>
                                        <option value="Banco de Capacitores">Banco de Capacitores</option>
                                        <option value="Cubículo MT">Cubículo MT</option>
                                    </select>
                                </div>
                                <div id="group-regime" class="form-group" style="flex: 1;">
                                    <label class="form-label">Acionamento</label>
                                    <select id="t-regimeAcionamento" class="form-control" onchange="app.tipicos.updateAutoName()">
                                        <option value="standard" ${state.regimeAcionamento === 'standard' ? 'selected' : ''}>Standard</option>
                                        <option value="pesado" ${state.regimeAcionamento === 'pesado' ? 'selected' : ''}>Pesado</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row" style="display: flex; gap: 10px;">
                                <div id="group-potencia-cv" class="form-group" style="flex: 1;">
                                    <label class="form-label">Potência (CV/KW)</label>
                                    <select id="t-potencia" class="form-control" onchange="app.tipicos.calculateCurrent()">
                                        <option value="">Selecione...</option>
                                        <option value="0,16" ${state.potencia === '0,16' ? 'selected' : ''}>0,16/0,12</option>
                                        <option value="0,25" ${state.potencia === '0,25' ? 'selected' : ''}>0,25/0,18</option>
                                        <option value="0,33" ${state.potencia === '0,33' ? 'selected' : ''}>0,33/0,25</option>
                                        <option value="0,5" ${state.potencia === '0,5' ? 'selected' : ''}>0,5/0,37</option>
                                        <option value="0,75" ${state.potencia === '0,75' ? 'selected' : ''}>0,75/0,55</option>
                                        <option value="1" ${state.potencia === '1' ? 'selected' : ''}>1/0,75</option>
                                        <option value="1,5" ${state.potencia === '1,5' ? 'selected' : ''}>1,5/1,1</option>
                                        <option value="2" ${state.potencia === '2' ? 'selected' : ''}>2/1,5</option>
                                        <option value="3" ${state.potencia === '3' ? 'selected' : ''}>3/2,2</option>
                                        <option value="4" ${state.potencia === '4' ? 'selected' : ''}>4/3</option>
                                        <option value="5" ${state.potencia === '5' ? 'selected' : ''}>5/3,7</option>
                                        <option value="6" ${state.potencia === '6' ? 'selected' : ''}>6/4,5</option>
                                        <option value="7,5" ${state.potencia === '7,5' ? 'selected' : ''}>7,5/5,5</option>
                                        <option value="10" ${state.potencia === '10' ? 'selected' : ''}>10/7,5</option>
                                        <option value="12,5" ${state.potencia === '12,5' ? 'selected' : ''}>12,5/9,2</option>
                                        <option value="15" ${state.potencia === '15' ? 'selected' : ''}>15/11</option>
                                        <option value="20" ${state.potencia === '20' ? 'selected' : ''}>20/15</option>
                                        <option value="25" ${state.potencia === '25' ? 'selected' : ''}>25/18,5</option>
                                        <option value="30" ${state.potencia === '30' ? 'selected' : ''}>30/22</option>
                                        <option value="40" ${state.potencia === '40' ? 'selected' : ''}>40/30</option>
                                        <option value="50" ${state.potencia === '50' ? 'selected' : ''}>50/37</option>
                                        <option value="60" ${state.potencia === '60' ? 'selected' : ''}>60/45</option>
                                        <option value="75" ${state.potencia === '75' ? 'selected' : ''}>75/55</option>
                                        <option value="100" ${state.potencia === '100' ? 'selected' : ''}>100/75</option>
                                        <option value="125" ${state.potencia === '125' ? 'selected' : ''}>125/90</option>
                                        <option value="150" ${state.potencia === '150' ? 'selected' : ''}>150/110</option>
                                        <option value="175" ${state.potencia === '175' ? 'selected' : ''}>175/132</option>
                                        <option value="200" ${state.potencia === '200' ? 'selected' : ''}>200/150</option>
                                        <option value="250" ${state.potencia === '250' ? 'selected' : ''}>250/185</option>
                                        <option value="270" ${state.potencia === '270' ? 'selected' : ''}>270/200</option>
                                        <option value="300" ${state.potencia === '300' ? 'selected' : ''}>300/220</option>
                                        <option value="350" ${state.potencia === '350' ? 'selected' : ''}>350/260</option>
                                        <option value="400" ${state.potencia === '400' ? 'selected' : ''}>400/300</option>
                                        <option value="450" ${state.potencia === '450' ? 'selected' : ''}>450/330</option>
                                        <option value="500" ${state.potencia === '500' ? 'selected' : ''}>500/370</option>
                                        <option value="600" ${state.potencia === '600' ? 'selected' : ''}>600/447</option>
                                    </select>
                                </div>
                                <div id="group-potencia-kvar" class="form-group" style="flex: 1; display: none;">
                                    <label class="form-label">Potência (KVAr)</label>
                                    <select id="t-potenciaKvar" class="form-control" onchange="app.tipicos.calculateCurrent()">
                                        <option value="">Selecione...</option>
                                        <option value="2,5" ${state.potenciaKvar === '2,5' ? 'selected' : ''}>2,5</option>
                                        <option value="5" ${state.potenciaKvar === '5' ? 'selected' : ''}>5</option>
                                        <option value="7,5" ${state.potenciaKvar === '7,5' ? 'selected' : ''}>7,5</option>
                                        <option value="10" ${state.potenciaKvar === '10' ? 'selected' : ''}>10</option>
                                        <option value="12,5" ${state.potenciaKvar === '12,5' ? 'selected' : ''}>12,5</option>
                                        <option value="15" ${state.potenciaKvar === '15' ? 'selected' : ''}>15</option>
                                        <option value="20" ${state.potenciaKvar === '20' ? 'selected' : ''}>20</option>
                                        <option value="25" ${state.potenciaKvar === '25' ? 'selected' : ''}>25</option>
                                        <option value="30" ${state.potenciaKvar === '30' ? 'selected' : ''}>30</option>
                                        <option value="40" ${state.potenciaKvar === '40' ? 'selected' : ''}>40</option>
                                        <option value="50" ${state.potenciaKvar === '50' ? 'selected' : ''}>50</option>
                                        <option value="60" ${state.potenciaKvar === '60' ? 'selected' : ''}>60</option>
                                        <option value="75" ${state.potenciaKvar === '75' ? 'selected' : ''}>75</option>
                                        <option value="100" ${state.potenciaKvar === '100' ? 'selected' : ''}>100</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label id="label-tensao" class="form-label">Tensão (V)</label>
                                    <select id="t-tensao" class="form-control" onchange="app.tipicos.calculateCurrent()">
                                        <option value="">Selecione...</option>
                                        <option value="24" ${state.tensao === '24' ? 'selected' : ''}>24</option>
                                        <option value="110" ${state.tensao === '110' ? 'selected' : ''}>110</option>
                                        <option value="125" ${state.tensao === '125' ? 'selected' : ''}>125</option>
                                        <option value="220" ${state.tensao === '220' ? 'selected' : ''}>220</option>
                                        <option value="220/24" ${state.tensao === '220/24' ? 'selected' : ''}>220/24</option>
                                        <option value="220/110" ${state.tensao === '220/110' ? 'selected' : ''}>220/110</option>
                                        <option value="220/220" ${state.tensao === '220/220' ? 'selected' : ''}>220/220</option>
                                        <option value="380" ${state.tensao === '380' ? 'selected' : ''}>380</option>
                                        <option value="380/24" ${state.tensao === '380/24' ? 'selected' : ''}>380/24</option>
                                        <option value="380/110" ${state.tensao === '380/110' ? 'selected' : ''}>380/110</option>
                                        <option value="380/220" ${state.tensao === '380/220' ? 'selected' : ''}>380/220</option>
                                        <option value="440" ${state.tensao === '440' ? 'selected' : ''}>440</option>
                                        <option value="440/24" ${state.tensao === '440/24' ? 'selected' : ''}>440/24</option>
                                        <option value="440/110" ${state.tensao === '440/110' ? 'selected' : ''}>440/110</option>
                                        <option value="440/220" ${state.tensao === '440/220' ? 'selected' : ''}>440/220</option>
                                        <option value="480" ${state.tensao === '480' ? 'selected' : ''}>480</option>
                                        <option value="480/24" ${state.tensao === '480/24' ? 'selected' : ''}>480/24</option>
                                        <option value="480/110" ${state.tensao === '480/110' ? 'selected' : ''}>480/110</option>
                                        <option value="480/220" ${state.tensao === '480/220' ? 'selected' : ''}>480/220</option>
                                        <option value="690" ${state.tensao === '690' ? 'selected' : ''}>690</option>
                                        <option value="690/24" ${state.tensao === '690/24' ? 'selected' : ''}>690/24</option>
                                        <option value="690/110" ${state.tensao === '690/110' ? 'selected' : ''}>690/110</option>
                                        <option value="690/220" ${state.tensao === '690/220' ? 'selected' : ''}>690/220</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row" style="display: flex; gap: 10px;">
                                <div class="form-group" style="flex: 1;">
                                    <label id="label-icc" class="form-label">Icc (KA)</label>
                                    <select id="t-icc" class="form-control" onchange="app.tipicos.updateAutoName()">
                                        <option value="">Selecione...</option>
                                        <option value="10" ${state.icc === '10' ? 'selected' : ''}>10</option>
                                        <option value="16" ${state.icc === '16' ? 'selected' : ''}>16</option>
                                        <option value="25" ${state.icc === '25' ? 'selected' : ''}>25</option>
                                        <option value="35" ${state.icc === '35' ? 'selected' : ''}>35</option>
                                        <option value="50" ${state.icc === '50' ? 'selected' : ''}>50</option>
                                        <option value="65" ${state.icc === '65' ? 'selected' : ''}>65</option>
                                        <option value="85" ${state.icc === '85' ? 'selected' : ''}>85</option>
                                        <option value="100" ${state.icc === '100' ? 'selected' : ''}>100</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label id="label-frequencia" class="form-label">Frequência (Hz)</label>
                                    <select id="t-frequencia" class="form-control" onchange="app.tipicos.updateAutoName()">
                                        <option value="">Selecione...</option>
                                        <option value="50" ${state.frequencia === '50' ? 'selected' : ''}>50</option>
                                        <option value="60" ${state.frequencia === '60' ? 'selected' : ''}>60</option>
                                    </select>
                                </div>
                            </div>
                            <div id="group-corrente" class="row" style="display: flex; gap: 10px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Corrente Aproximada (A)</label>
                                    <input type="text" id="t-correnteApx" class="form-control" value="${(state.correnteApx || '').toString().replace('.', ',')}" readonly style="background: #e2e8f0; font-weight: bold; color: var(--color-accent);">
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Corrente Placa (A)</label>
                                    <input type="text" id="t-correntePlaca" class="form-control" oninput="app.tipicos.updateAutoName()" value="${state.correntePlaca || ''}" placeholder="Inserir valor...">
                                </div>
                            </div>
                            <div id="group-fatores" class="row" style="display: flex; gap: 10px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Fator de Potência (cos &phi;)</label>
                                    <select id="t-fp" class="form-control" onchange="app.tipicos.calculateCurrent()">
                                        <option value="">Selecione...</option>
                                        ${[0.70, 0.72, 0.75, 0.78, 0.80, 0.82, 0.85, 0.88, 0.90, 0.92, 0.95].map(v => `<option value="${v}" ${state.fp == v ? 'selected' : ''}>${v.toFixed(2).replace('.', ',')}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Fator de Serviço (FS)</label>
                                    <select id="t-fs" class="form-control" onchange="app.tipicos.calculateCurrent()">
                                        <option value="">Selecione...</option>
                                        ${[1.0, 1.15, 1.25].map(v => `<option value="${v}" ${state.fs == v ? 'selected' : ''}>${v.toFixed(2).replace('.', ',')}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div id="group-rendimento" class="row" style="display: flex; gap: 10px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Rendimento (&eta; %)</label>
                                    <select id="t-rendimento" class="form-control" onchange="app.tipicos.calculateCurrent()">
                                        <option value="">Selecione...</option>
                                        ${[70, 75, 80, 82, 85, 88, 90, 92, 94, 95].map(v => `<option value="${v / 100}" ${state.rendimento == v / 100 ? 'selected' : ''}>${v}%</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Sinalização/Comando Porta</label>
                                    <select id="t-reserva" class="form-control" onchange="app.tipicos.updateAutoName()">
                                        <option value="">Selecione...</option>
                                        <option value="SF">Sinaleiro Falha</option>
                                        <option value="SF-CS-BDI">Sinaleiro Falha + Comutadora 2 pos. + Botão duplo iluminado</option>
                                        <option value="SF-CS-BL-BD">Sinaleiro Falha + Comutadora 2 pos. + Botão Liga + Botão Desliga</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row" style="display: flex; gap: 10px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Tensão de Comando</label>
                                    <select id="t-tensaoComando" class="form-control" onchange="app.tipicos.updateAutoName()">
                                        <option value="">Selecione...</option>
                                        <option value="220VCA">220vca</option>
                                        <option value="24VCC">24vcc</option>
                                        <option value="220VCA-24VCC">220vca/24vcc</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row" style="display: flex; gap: 10px;">
                                <div class="form-group" style="flex: 1;">
                                    <label id="label-protecao" class="form-label">Proteção (Fabricante)</label>
                                    <select id="t-protecao" class="form-control" onchange="app.tipicos.updateAutoName()">
                                        <option value="">Selecione...</option>
                                        <option value="ABB">ABB</option>
                                        <option value="Allen Bradley">Allen Bradley</option>
                                        <option value="Rockwell Automation">Rockwell Automation</option>
                                        <option value="Schneider Electric">Schneider Electric</option>
                                        <option value="Siemens">Siemens</option>
                                        <option value="Steck">Steck</option>
                                        <option value="WEG">WEG</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label id="label-drives" class="form-label">Drives (Fabricante)</label>
                                    <select id="t-drives" class="form-control" onchange="app.tipicos.updateAutoName()">
                                        <option value="">Selecione...</option>
                                        <option value="ABB">ABB</option>
                                        <option value="Allen Bradley">Allen Bradley</option>
                                        <option value="Danfoss">Danfoss</option>
                                        <option value="Rockwell Automation">Rockwell Automation</option>
                                        <option value="Siemens">Siemens</option>
                                        <option value="WEG">WEG</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Comunicação</label>
                                <select id="t-comunicacao" class="form-control" onchange="app.tipicos.updateAutoName()">
                                    <option value="">Selecione...</option>
                                    <option value="AS-Interface">AS-Interface</option>
                                    <option value="DeviceNet">DeviceNet</option>
                                    <option value="EtherCAT">EtherCAT</option>
                                    <option value="Ethernet/IP">Ethernet/IP</option>
                                    <option value="IO-LINK">IO-LINK</option>
                                    <option value="I/O">I/O</option>
                                    <option value="Modbus RTU">Modbus RTU</option>
                                    <option value="Modbus TCP">Modbus TCP</option>
                                    <option value="Profibus DP">Profibus DP</option>
                                    <option value="Profibus PA">Profibus PA</option>
                                    <option value="Profinet">Profinet</option>
                                    <option value="RS-232">RS-232</option>
                                    <option value="RS-485">RS-485</option>
                                    <option value="IEC 61850">IEC 61850</option>
                                </select>
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


                                
                                <select class="form-control" style="width: 200px; font-size: 12px;" onchange="app.tipicos.openMaterialSelector(this.value); this.value='';">
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

        const container = document.getElementById('view-tipicos');
        if (container) {
            container.innerHTML = html;
        }
        this.renderBuilderItems();

        // Initial setup
        document.getElementById('t-comunicacao').value = state.comunicacao || state.aplicacao || '';
        document.getElementById('t-tipoAcionamento').value = state.tipoAcionamento || '';
        document.getElementById('t-regimeAcionamento').value = state.regimeAcionamento || 'standard';
        document.getElementById('t-protecao').value = state.protecao || '';
        document.getElementById('t-icc').value = state.icc || '';
        document.getElementById('t-drives').value = state.drives || '';
        document.getElementById('t-frequencia').value = state.frequencia || '60';
        document.getElementById('t-rendimento').value = state.rendimento || '0.90';
        document.getElementById('t-reserva').value = state.reserva || '';
        document.getElementById('t-tensaoComando').value = state.tensaoComando || '';
        document.getElementById('t-descricao_word').value = state.descricao_word || '';

        // Handle initial potency visibility
        this.togglePotencyFields(true);
    },

    togglePotencyFields(isInitial = false) {
        const typeEl = document.getElementById('t-tipoAcionamento');
        if (!typeEl) return;

        const val = typeEl.value;
        const isBC = val === 'Banco de Capacitores';
        const isMT = val === 'Cubículo MT';

        const groupCV = document.getElementById('group-potencia-cv');
        const groupKVAr = document.getElementById('group-potencia-kvar');
        const groupRegime = document.getElementById('group-regime');
        const groupCorrente = document.getElementById('group-corrente');
        const groupFatores = document.getElementById('group-fatores');
        const groupRendimento = document.getElementById('group-rendimento');
        
        const labelTensao = document.getElementById('label-tensao');
        const selectTensao = document.getElementById('t-tensao');
        
        const labelIcc = document.getElementById('label-icc');
        const selectIcc = document.getElementById('t-icc');
        
        const labelFreq = document.getElementById('label-frequencia');
        const selectFreq = document.getElementById('t-frequencia');
        
        const labelProtecao = document.getElementById('label-protecao');
        const selectProtecao = document.getElementById('t-protecao');
        
        const labelDrives = document.getElementById('label-drives');
        const selectDrives = document.getElementById('t-drives');

        if (isMT) {
            groupCV.style.display = 'none';
            groupKVAr.style.display = 'none';
            groupRegime.style.display = 'none';
            groupCorrente.style.display = 'none';
            groupFatores.style.display = 'none';
            groupRendimento.style.display = 'none';
            
            // Update Label and Options for MT Tension
            if (labelTensao) labelTensao.textContent = 'Tensão Nominal (KV)';
            if (selectTensao) {
                const currentVal = selectTensao.value;
                selectTensao.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="4,16KV">4,16KV</option>
                    <option value="6,0KV">6,0KV</option>
                    <option value="6,9KV">6,9KV</option>
                    <option value="13,8KV">13,8KV</option>
                `;
                if (['4,16KV', '6,0KV', '6,9KV', '13,8KV'].includes(currentVal)) {
                    selectTensao.value = currentVal;
                } else if (!isInitial) {
                    selectTensao.value = '';
                } else {
                    selectTensao.value = this.currentBuilderState.tensao || '';
                }
            }

            // Update Options for MT Icc
            if (selectIcc) {
                const currentVal = selectIcc.value;
                selectIcc.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="16KA">16KA</option>
                    <option value="20KA">20KA</option>
                    <option value="25KA">25KA</option>
                    <option value="31,5KA">31,5KA</option>
                    <option value="40KA">40KA</option>
                `;
                if (['16KA', '20KA', '25KA', '31,5KA', '40KA'].includes(currentVal)) {
                    selectIcc.value = currentVal;
                } else if (!isInitial) {
                    selectIcc.value = '';
                } else {
                    selectIcc.value = this.currentBuilderState.icc || '';
                }
            }

            // Update Options for MT Frequency
            if (selectFreq) {
                const currentVal = selectFreq.value;
                selectFreq.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="50HZ">50HZ</option>
                    <option value="60HZ">60HZ</option>
                `;
                if (['50HZ', '60HZ'].includes(currentVal)) {
                    selectFreq.value = currentVal;
                } else if (!isInitial) {
                    selectFreq.value = '';
                } else {
                    selectFreq.value = this.currentBuilderState.frequencia || '';
                }
            }

            // Update Label and Options for MT Circuit Breaker (Disjuntor)
            if (labelProtecao) labelProtecao.textContent = 'Disjuntor (Fabricante)';
            if (selectProtecao) {
                const currentVal = selectProtecao.value;
                selectProtecao.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="ABB">ABB</option>
                    <option value="Eaton">Eaton</option>
                    <option value="Siemens">Siemens</option>
                    <option value="Schneider Electric">Schneider Electric</option>
                    <option value="WEG">WEG</option>
                `;
                if (['ABB', 'Eaton', 'Siemens', 'Schneider Electric', 'WEG'].includes(currentVal)) {
                    selectProtecao.value = currentVal;
                } else if (!isInitial) {
                    selectProtecao.value = '';
                } else {
                    selectProtecao.value = this.currentBuilderState.protecao || '';
                }
            }

            // Update Label and Options for MT Enclosure (Chaparia)
            if (labelDrives) labelDrives.textContent = 'Chaparia (Fabricante)';
            if (selectDrives) {
                const currentVal = selectDrives.value;
                selectDrives.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="QT">QT</option>
                    <option value="Pressmat">Pressmat</option>
                    <option value="Siemens">Siemens</option>
                `;
                if (['QT', 'Pressmat', 'Siemens'].includes(currentVal)) {
                    selectDrives.value = currentVal;
                } else if (!isInitial) {
                    selectDrives.value = '';
                } else {
                    selectDrives.value = this.currentBuilderState.drives || '';
                }
            }
            
            if (!isInitial) {
                document.getElementById('t-potencia').value = '';
                document.getElementById('t-potenciaKvar').value = '';
                document.getElementById('t-regimeAcionamento').value = 'standard';
                document.getElementById('t-fp').value = '';
                document.getElementById('t-fs').value = '';
                document.getElementById('t-rendimento').value = '';
            }
        } else {
            // Restore BT Label and Options
            if (labelTensao) labelTensao.textContent = 'Tensão (V)';
            if (selectTensao && (selectTensao.options.length < 10)) { // Simple check if it's already BT or MT
                const currentVal = selectTensao.value;
                selectTensao.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="24">24</option>
                    <option value="110">110</option>
                    <option value="125">125</option>
                    <option value="220">220</option>
                    <option value="220/24">220/24</option>
                    <option value="220/110">220/110</option>
                    <option value="220/220">220/220</option>
                    <option value="380">380</option>
                    <option value="380/24">380/24</option>
                    <option value="380/110">380/110</option>
                    <option value="380/220">380/220</option>
                    <option value="440">440</option>
                    <option value="440/24">440/24</option>
                    <option value="440/110">440/110</option>
                    <option value="440/220">440/220</option>
                    <option value="480">480</option>
                    <option value="480/24">480/24</option>
                    <option value="480/110">480/110</option>
                    <option value="480/220">480/220</option>
                    <option value="690">690</option>
                    <option value="690/24">690/24</option>
                    <option value="690/110">690/110</option>
                    <option value="690/220">690/220</option>
                `;
                // Try to restore value if it matches BT options
                if (!currentVal.includes(',') && currentVal !== '') {
                    selectTensao.value = currentVal;
                } else if (!isInitial) {
                    selectTensao.value = '';
                } else {
                     selectTensao.value = this.currentBuilderState.tensao || '';
                }
            }

            // Restore BT Icc Options
            if (selectIcc && (selectIcc.options.length < 10 || selectIcc.innerHTML.includes('KA'))) {
                const currentVal = selectIcc.value;
                selectIcc.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="10">10</option>
                    <option value="16">16</option>
                    <option value="25">25</option>
                    <option value="35">35</option>
                    <option value="50">50</option>
                    <option value="65">65</option>
                    <option value="85">85</option>
                    <option value="100">100</option>
                `;
                if (!currentVal.includes('KA') && currentVal !== '') {
                    selectIcc.value = currentVal;
                } else if (!isInitial) {
                    selectIcc.value = '';
                } else {
                    selectIcc.value = this.currentBuilderState.icc || '';
                }
            }

            // Restore BT Frequency Options
            if (selectFreq && (selectFreq.options.length < 5 || selectFreq.innerHTML.includes('HZ'))) {
                const currentVal = selectFreq.value;
                selectFreq.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="50">50</option>
                    <option value="60">60</option>
                `;
                if (!currentVal.includes('HZ') && currentVal !== '') {
                    selectFreq.value = currentVal;
                } else if (!isInitial) {
                    selectFreq.value = '';
                } else {
                    selectFreq.value = this.currentBuilderState.frequencia || '60';
                }
            }

            // Restore BT Protecao Options
            if (labelProtecao) labelProtecao.textContent = 'Proteção (Fabricante)';
            if (selectProtecao && (selectProtecao.options.length < 5 || selectProtecao.innerHTML.includes('Eaton'))) {
                const currentVal = selectProtecao.value;
                selectProtecao.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="ABB">ABB</option>
                    <option value="Allen Bradley">Allen Bradley</option>
                    <option value="Rockwell Automation">Rockwell Automation</option>
                    <option value="Schneider Electric">Schneider Electric</option>
                    <option value="Siemens">Siemens</option>
                    <option value="Steck">Steck</option>
                    <option value="WEG">WEG</option>
                `;
                if (['ABB', 'Allen Bradley', 'Rockwell Automation', 'Schneider Electric', 'Siemens', 'Steck', 'WEG'].includes(currentVal)) {
                    selectProtecao.value = currentVal;
                } else if (!isInitial) {
                    selectProtecao.value = '';
                } else {
                    selectProtecao.value = this.currentBuilderState.protecao || '';
                }
            }

            // Restore BT Drives Options
            if (labelDrives) labelDrives.textContent = 'Drives (Fabricante)';
            if (selectDrives && (selectDrives.options.length < 5 || selectDrives.innerHTML.includes('Pressmat'))) {
                const currentVal = selectDrives.value;
                selectDrives.innerHTML = `
                    <option value="">Selecione...</option>
                    <option value="ABB">ABB</option>
                    <option value="Allen Bradley">Allen Bradley</option>
                    <option value="Danfoss">Danfoss</option>
                    <option value="Rockwell Automation">Rockwell Automation</option>
                    <option value="Siemens">Siemens</option>
                    <option value="WEG">WEG</option>
                `;
                if (['ABB', 'Allen Bradley', 'Danfoss', 'Rockwell Automation', 'Siemens', 'WEG'].includes(currentVal)) {
                    selectDrives.value = currentVal;
                } else if (!isInitial) {
                    selectDrives.value = '';
                } else {
                    selectDrives.value = this.currentBuilderState.drives || '';
                }
            }

            if (isBC) {
                groupCV.style.display = 'none';
                groupKVAr.style.display = 'block';
                groupRegime.style.display = 'block';
                groupCorrente.style.display = 'flex';
                groupFatores.style.display = 'flex';
                groupRendimento.style.display = 'flex';
                if (!isInitial) document.getElementById('t-potencia').value = '';
            } else {
                groupCV.style.display = 'block';
                groupKVAr.style.display = 'none';
                groupRegime.style.display = 'block';
                groupCorrente.style.display = 'flex';
                groupFatores.style.display = 'flex';
                groupRendimento.style.display = 'flex';
                if (!isInitial) document.getElementById('t-potenciaKvar').value = '';
            }
        }

        if (!isInitial) this.updateAutoName();
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
        const propsPane = document.getElementById('builder-props-pane');
        if (propsPane) propsPane.style.display = 'none';
        const infoEl = document.getElementById('builder-context-info');
        const nameEl = document.getElementById('builder-context-name');
        const currentEl = document.getElementById('builder-context-current');
        if (infoEl && nameEl && currentEl) {
            nameEl.textContent = this.currentBuilderState.nome || 'Típico sem nome';
            currentEl.textContent = this.currentBuilderState.correnteApx
                ? `Corrente Aproximada (${this.currentBuilderState.correnteApx.toString().replace('.', ',')}A)`
                : '';
            infoEl.style.display = 'inline-block';
        }
        panel.innerHTML = `
            <div style="padding: 10px; display: flex; flex-direction: column; height: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--color-border);">
                    <h3 style="font-size: 14px; margin: 0;">Selecione - <span style="color: var(--color-accent);">${manufacturer}</span></h3>
                    <button class="btn btn-ghost" onclick="app.tipicos.closeMaterialSelector()" style="padding: 2px;"><i class="ph ph-x"></i></button>
                </div>
                
                <div style="padding: 10px 0; border-bottom: 1px solid var(--color-border); display: flex; gap: 10px;">
                    <input type="hidden" id="sel-manufacturer" value="${manufacturer}">
                    <div style="flex: 1;">
                        <input type="text" id="sel-filter-model" class="form-control" placeholder="Filtrar Modelo..." oninput="app.tipicos.filterSelectorItems()" style="font-size: 12px;">
                    </div>
                    <div style="flex: 1;">
                        <input type="text" id="sel-filter-descricao" class="form-control" placeholder="Filtrar Descrição..." oninput="app.tipicos.filterSelectorItems()" style="font-size: 12px;">
                    </div>
                    <div style="flex: 1;">
                        <input type="text" id="sel-filter-code" class="form-control" placeholder="Filtrar Código..." oninput="app.tipicos.filterSelectorItems()" style="font-size: 12px;">
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
        const propsPane = document.getElementById('builder-props-pane');
        if (propsPane) propsPane.style.display = '';
        const infoEl = document.getElementById('builder-context-info');
        if (infoEl) infoEl.style.display = 'none';
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
        const filterDesc = document.getElementById('sel-filter-descricao').value.toLowerCase();
        const filterCode = document.getElementById('sel-filter-code').value.toLowerCase();

        const tbody = document.getElementById('selector-items-body');
        if (!tbody) return;

        const materiais = store.getState().materiais || [];
        if (!this._materialsByFabricante || this._materialsLength !== materiais.length) {
            this._buildMaterialsIndex();
        }

        const target = manufacturer.toLowerCase();
        let filtered = this._materialsByFabricante[target] || [];

        if (filterModel || filterDesc || filterCode) {
            filtered = filtered.filter(m => {
                const modelText = (m.modelo || m.descricao || '').toLowerCase();
                const descText = (m.descricao || '').toLowerCase();
                const codeText = (m.codigoFabricante || '').toLowerCase();
                const matchModel = !filterModel || modelText.includes(filterModel);
                const matchDesc = !filterDesc || descText.includes(filterDesc);
                const matchCode = !filterCode || codeText.includes(filterCode);
                return matchModel && matchDesc && matchCode;
            });
        }

        const limited = filtered.slice(0, 200);

        if (limited.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">Nenhum material encontrado para ${manufacturer}.</td></tr>`;
            return;
        }

        tbody.innerHTML = limited.map(m => `
            <tr style="cursor: pointer;" onclick="app.tipicos.selectMaterial('${m.id}')" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='white'">
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
                             <button class="btn btn-primary" onclick="app.tipicos.confirmAddMaterial()">Confirmar</button>
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
                    <td style="text-align: center;"><input type="number" class="form-control" style="padding: 2px; height: 24px; text-align: center;" value="${item.qtd}" onchange="app.tipicos.updateQtd(${index}, this.value)"></td>
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
                    <td>${store.canDelete() ? `<button class="btn btn-ghost text-danger" onclick="app.tipicos.removeItem(${index})"><i class="ph ph-trash"></i></button>` : ''}</td>
                </tr>
            `;
        }).join('');

        if (totalEl) totalEl.textContent = app.formatCurrency(total);

        // Add helper for updateQtd to window app temporarily or bind it better
        window.app.tipicos.updateQtd = (index, val) => {
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
            window.app.toast("Nome do Típico é obrigatório.", "error");
            return;
        }

        this.currentBuilderState.nome = nome;
        this.currentBuilderState.tipoAcionamento = document.getElementById('t-tipoAcionamento').value;
        this.currentBuilderState.regimeAcionamento = document.getElementById('t-regimeAcionamento').value;
        this.currentBuilderState.comunicacao = document.getElementById('t-comunicacao').value;
        this.currentBuilderState.potencia = document.getElementById('t-potencia').value;
        this.currentBuilderState.potenciaKvar = document.getElementById('t-potenciaKvar').value;
        this.currentBuilderState.tensao = document.getElementById('t-tensao').value;
        this.currentBuilderState.icc = document.getElementById('t-icc').value;
        this.currentBuilderState.correnteApx = document.getElementById('t-correnteApx').value.replace(',', '.');
        this.currentBuilderState.correntePlaca = document.getElementById('t-correntePlaca').value;
        this.currentBuilderState.fp = document.getElementById('t-fp').value;
        this.currentBuilderState.fs = document.getElementById('t-fs').value;
        this.currentBuilderState.protecao = document.getElementById('t-protecao').value;
        this.currentBuilderState.drives = document.getElementById('t-drives').value;
        this.currentBuilderState.frequencia = document.getElementById('t-frequencia').value;
        this.currentBuilderState.rendimento = document.getElementById('t-rendimento').value;
        this.currentBuilderState.reserva = document.getElementById('t-reserva').value;
        this.currentBuilderState.tensaoComando = document.getElementById('t-tensaoComando').value;
        this.currentBuilderState.descricao_word = document.getElementById('t-descricao_word').value;

        const total = this.currentBuilderState.items.reduce((acc, i) => acc + (i.custo * i.qtd), 0);
        this.currentBuilderState.custoTotal = total;

        const { pendingMaterial, ...cleanData } = this.currentBuilderState;

        let ok;
        if (this.currentBuilderState.id) {
            ok = await store.updateTipico(this.currentBuilderState.id, { ...cleanData, id: this.currentBuilderState.id });
        } else {
            this.currentBuilderState.id = crypto.randomUUID();
            ok = await store.addTipico({ ...cleanData, id: this.currentBuilderState.id });
        }

        if (!ok) {
            window.app.toast("Erro ao salvar. Verifique se o servidor está rodando.", "error");
            return;
        }

        this.closeBuilder();
    },

    updateAutoName() {
        const mapping = {
            'Inversor de Frequência': 'IF',
            'Soft-Starter': 'SS',
            'Partida Direta': 'PD',
            'Partida Direta Reversora': 'PDR',
            'Estrela-Triângulo': 'ET',
            'Alimentador': 'AL',
            'Entrada Geral': 'EG',
            'Medição': 'ME',
            'Comando e Sinalização': 'CS',
            'Serviços Auxiliares': 'SA',
            'Banco de Capacitores': 'BC',
            'Cubículo MT': 'PNMT'
        };

        const tipo = mapping[document.getElementById('t-tipoAcionamento').value] || '';
        const potenciaCV = document.getElementById('t-potencia').value || '';
        const potenciaKvar = document.getElementById('t-potenciaKvar').value || '';
        const tensao = document.getElementById('t-tensao').value || '';
        const icc = document.getElementById('t-icc').value || '';
        const comunicacao = document.getElementById('t-comunicacao').value || '';
        const protecao = document.getElementById('t-protecao').value || '';
        const drives = document.getElementById('t-drives').value || '';
        const reserva = document.getElementById('t-reserva').value || '';
        const tensaoComando = document.getElementById('t-tensaoComando').value || '';
        const regime = document.getElementById('t-regimeAcionamento').value || 'standard';
        let regimeSuffix = regime === 'pesado' ? 'PES' : 'STD';
        if (tipo === 'PNMT') regimeSuffix = '';

        // Prioritize Kvar for BC types, otherwise use CV
        const selectedPotencia = (tipo === 'BC' && potenciaKvar) ? potenciaKvar : potenciaCV;

        const parts = [tipo, selectedPotencia, tensao, icc, comunicacao, protecao, drives, reserva, tensaoComando, regimeSuffix].filter(p => p !== '');

        if (parts.length > 0) {
            document.getElementById('t-nome').value = parts.join('-');
        }
        this.calculateCurrent();
    },

    calculateCurrent() {
        const typeEl = document.getElementById('t-tipoAcionamento');
        const isBC = typeEl && typeEl.value === 'Banco de Capacitores';

        const potenciaStr = isBC ? document.getElementById('t-potenciaKvar').value : document.getElementById('t-potencia').value;
        const tensaoStr = document.getElementById('t-tensao').value;
        const fpStr = document.getElementById('t-fp').value;
        const fsStr = document.getElementById('t-fs').value;
        const rendStr = document.getElementById('t-rendimento').value;
        const freqStr = document.getElementById('t-frequencia').value;

        // Note: Frequency (freqStr) is important for reactance-based components, 
        // but for calculation from Power (W/VAR), it validates the operating point.

        if (!potenciaStr || !tensaoStr || !fsStr) {
            document.getElementById('t-correnteApx').value = '';
            return;
        }

        // Parse values
        const P = parseFloat(potenciaStr.replace(',', '.')) || 0;
        const V = parseFloat(tensaoStr.split('/')[0]) || 0;
        const FP = parseFloat(fpStr) || 1;
        const FS = parseFloat(fsStr) || 1;
        const Rend = parseFloat(rendStr) || 0.90; // Default 90% if not selected for motors

        if (V === 0) return;

        /**
         * Engineering Formulas for Three-Phase Current:
         * 1. Motors/General (CV): I = (P_cv * 735.5 * FS) / (sqrt(3) * V * cos phi * Rend)
         *    Note: We use 735.5W for CV. If it were HP, we'd use 745.7W.
         * 2. Capacitor Bank (KVAr): I = (Q_kvar * 1000 * FS) / (sqrt(3) * V)
         *    Note: Frequency impacts Q if C is constant, but if Q is fixed, I depends on V.
         */
        let I = 0;
        if (isBC) {
            I = (P * 1000 * FS) / (Math.sqrt(3) * V);
            // Show Rendimento only for motors
            if (document.getElementById('group-rendimento')) document.getElementById('group-rendimento').style.display = 'none';
        } else {
            if (FP === 0 || Rend === 0) return;
            if (document.getElementById('group-rendimento')) document.getElementById('group-rendimento').style.display = 'block';
            I = (P * 735.5 * FS) / (Math.sqrt(3) * V * FP * Rend);
        }

        document.getElementById('t-correnteApx').value = I.toFixed(2).replace('.', ',');
        // Update Auto Name again to include the new calculated current if needed
        // but avoid infinite loop by check
        const currentName = document.getElementById('t-nome').value;
        this.updateAutoNameSilently();
    },

    updateAutoNameSilently() {
        const mapping = {
            'Inversor de Frequência': 'IF',
            'Soft-Starter': 'SS',
            'Partida Direta': 'PD',
            'Partida Direta Reversora': 'PDR',
            'Estrela-Triângulo': 'ET',
            'Alimentador': 'AL',
            'Entrada Geral': 'EG',
            'Medição': 'ME',
            'Comando e Sinalização': 'CS',
            'Serviços Auxiliares': 'SA',
            'Banco de Capacitores': 'BC'
        };

        const tipo = mapping[document.getElementById('t-tipoAcionamento').value] || '';
        const potenciaCV = document.getElementById('t-potencia').value || '';
        const potenciaKvar = document.getElementById('t-potenciaKvar').value || '';
        const tensao = document.getElementById('t-tensao').value || '';
        const icc = document.getElementById('t-icc').value || '';
        const comunicacao = document.getElementById('t-comunicacao').value || '';
        const protecao = document.getElementById('t-protecao').value || '';
        const drives = document.getElementById('t-drives').value || '';
        const reserva = document.getElementById('t-reserva').value || '';
        const tensaoComando = document.getElementById('t-tensaoComando').value || '';
        const regime = document.getElementById('t-regimeAcionamento').value || 'standard';
        const regimeSuffix = regime === 'pesado' ? 'PES' : 'STD';

        const selectedPotencia = (tipo === 'BC' && potenciaKvar) ? potenciaKvar : potenciaCV;
        const parts = [tipo, selectedPotencia, tensao, icc, comunicacao, protecao, drives, reserva, tensaoComando, regimeSuffix].filter(p => p !== '');

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
window.tipicosModule = TipicosModule;
TipicosModule.init();
