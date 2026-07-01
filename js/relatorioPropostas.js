import { store } from './state.js';

const RelatorioPropostas = {
    currentType: 'tecnicas',
    filterText: '',
    filterDataInicio: '',
    filterDataFim: '',
    filterDataAtualizacaoInicio: '',
    filterDataAtualizacaoFim: '',
    filterCliente: '',
    filterResponsavel: '',
    filterEngResp: '',
    filterRevisao: '',
    filterRevElab: '',
    filterTipoEquipamento: '',
    filterValorMin: '',
    filterValorMax: '',
    filterVendedor: '',
    filterProbabilidade: '',
    filterFase: '',
    filterRegiao: '',
    filterTags: '',
    filterVigenciaInicio: '',
    filterVigenciaFim: '',
    reportSectionsOpen: false,
    _usersCache: null,
    _documentClickBound: false,
    reportSections: {
        dadosGerais: true,
        escopo: true,
        equipamentos: true,
        fichaTecnica: true,
        normas: true,
        cargas: true,
        chaparia: true,
        barramentos: true,
        exclusionsDeviations: true,
        maoDeObra: true,
        despesas: true,
        precificacao: true,
        vendorList: true,
        revisoes: true,
        condicoesComerciais: true,
        assinaturas: true,
        logos: true
    },

    render() {
        const container = document.getElementById('view-relatorio-propostas');
        if (!container) return;

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-article"></i> Relatório de Propostas
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Consulte, filtre e exporte propostas técnicas e comerciais</div>
                    </div>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 24px;">
                <div class="card" style="padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                        <div style="display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px;">
                            <button class="btn-type ${this.currentType === 'tecnicas' ? 'btn-type-active' : ''}" data-type="tecnicas" style="padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; ${this.currentType === 'tecnicas' ? 'background: var(--color-accent); color: white;' : 'background: transparent; color: #64748b;'}">
                                <i class="ph ph-file-text"></i> Propostas Técnicas
                            </button>
                            <button class="btn-type ${this.currentType === 'comerciais' ? 'btn-type-active' : ''}" data-type="comerciais" style="padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; ${this.currentType === 'comerciais' ? 'background: var(--color-accent); color: white;' : 'background: transparent; color: #64748b;'}">
                                <i class="ph ph-briefcase"></i> Propostas Comerciais
                            </button>
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                            <input type="text" id="rel-prop-filtro-texto" placeholder="Buscar por cliente, projeto, código..." style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;">
                        </div>
                        <button id="rel-prop-btn-relatorio" class="btn btn-primary" style="display: flex; align-items: center; gap: 6px; padding: 8px 20px;" disabled>
                            <i class="ph ph-file-arrow-down"></i> Gerar Relatório Selecionados
                        </button>
                        <div id="rel-prop-export-wrapper" style="position: relative; display: inline-block;">
                            <button id="rel-prop-btn-exportar" class="btn btn-outline" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px;">
                                <i class="ph ph-download"></i> Exportar <span style="font-size: 10px; margin-left: 2px;">▾</span>
                            </button>
                            <div id="rel-prop-export-dropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 4px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 100; min-width: 140px; overflow: hidden;">
                                <button id="rel-prop-export-csv" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; text-align: left; color: #1e293b;">
                                    <i class="ph ph-file-csv" style="color: var(--color-accent);"></i> CSV
                                </button>
                                <button id="rel-prop-export-xls" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; text-align: left; color: #1e293b;">
                                    <i class="ph ph-file-xls" style="color: var(--color-accent);"></i> XLS (Excel)
                                </button>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 12px;">
                            <span style="font-weight: 600; color: #475569; white-space: nowrap;">Filtros Avançados</span>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Criação:</span>
                                <input type="date" id="rel-prop-filtro-data-inicio" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 130px;">
                                <span style="color: #94a3b8;">até</span>
                                <input type="date" id="rel-prop-filtro-data-fim" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 130px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Atualização:</span>
                                <input type="date" id="rel-prop-filtro-data-atualizacao-inicio" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 130px;">
                                <span style="color: #94a3b8;">até</span>
                                <input type="date" id="rel-prop-filtro-data-atualizacao-fim" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 130px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Cliente:</span>
                                <input type="text" id="rel-prop-filtro-cliente" list="rel-prop-clientes" placeholder="Filtrar cliente" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 130px;">
                                <datalist id="rel-prop-clientes"></datalist>
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Responsável:</span>
                                <input type="text" id="rel-prop-filtro-responsavel" placeholder="Ex: M.S" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 110px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Eng. Resp.:</span>
                                <select id="rel-prop-filtro-eng-resp" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; background: white; width: 110px;">
                                    <option value="">Todos</option>
                                </select>
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Revisão:</span>
                                <input type="text" id="rel-prop-filtro-revisao" placeholder="Ex: 01" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 60px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Rev. Elab.:</span>
                                <input type="text" id="rel-prop-filtro-rev-elab" placeholder="Nome" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 110px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Eq. Tipo:</span>
                                <input type="text" id="rel-prop-filtro-tipo-equip" placeholder="CCM-BT, CUB-MT..." style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 110px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Valor R$:</span>
                                <input type="text" id="rel-prop-filtro-valor-min" placeholder="min" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 70px;">
                                <span style="color: #94a3b8;">-</span>
                                <input type="text" id="rel-prop-filtro-valor-max" placeholder="max" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 70px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Vendedor:</span>
                                <select id="rel-prop-filtro-vendedor" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; background: white; width: 100px;">
                                    <option value="">Todos</option>
                                </select>
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Probab.:</span>
                                <select id="rel-prop-filtro-probabilidade" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; background: white;">
                                    <option value="">Todas</option>
                                    <option value="Hot">Hot</option>
                                    <option value="Warm">Warm</option>
                                    <option value="Cold">Cold</option>
                                </select>
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Status:</span>
                                <select id="rel-prop-filtro-fase" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; background: white;">
                                    <option value="">Todos</option>
                                    <option value="prospect">Aguardando Início</option>
                                    <option value="elaboracao">Em Elaboração</option>
                                    <option value="enviado">Proposta Enviada</option>
                                    <option value="negociacao">Negociação</option>
                                    <option value="fechado">Fechado</option>
                                    <option value="perdido">Perdido</option>
                                </select>
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Região/UF:</span>
                                <input type="text" id="rel-prop-filtro-regiao" placeholder="Ex: SP, RJ" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 80px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Tags:</span>
                                <input type="text" id="rel-prop-filtro-tags" placeholder="palavra-chave" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 100px;">
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="color: #64748b;">Vigência:</span>
                                <input type="date" id="rel-prop-filtro-vigencia-inicio" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 120px;">
                                <span style="color: #94a3b8;">até</span>
                                <input type="date" id="rel-prop-filtro-vigencia-fim" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; width: 120px;">
                            </label>
                        </div>
                    </div>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                        <div id="rel-prop-sections-toggle" style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; user-select: none;">
                            <span id="rel-prop-sections-chevron" style="transition: transform 0.2s; display: inline-block;">▶</span>
                            <span style="font-weight: 600; color: #475569;">Seções do Relatório</span>
                        </div>
                        <div id="rel-prop-sections-body" style="display: none; margin-top: 12px;">
                            <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px;">
                                <label class="rel-prop-section-label" data-section="dadosGerais" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.dadosGerais ? 'checked' : ''}> Dados Gerais
                                </label>
                                <label class="rel-prop-section-label" data-section="escopo" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.escopo ? 'checked' : ''}> Escopo
                                </label>
                                <label class="rel-prop-section-label" data-section="equipamentos" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.equipamentos ? 'checked' : ''}> Equipamentos
                                </label>
                                <label class="rel-prop-section-label" data-section="vendorList" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.vendorList ? 'checked' : ''}> Vendor List
                                </label>
                                <label class="rel-prop-section-label" data-section="revisoes" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.revisoes ? 'checked' : ''}> Revisões
                                </label>
                                <label class="rel-prop-section-label" data-section="condicoesComerciais" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.condicoesComerciais ? 'checked' : ''}> Condições Comerciais
                                </label>
                                <label class="rel-prop-section-label" data-section="assinaturas" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.assinaturas ? 'checked' : ''}> Assinaturas
                                </label>
                                <label class="rel-prop-section-label" data-section="logos" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.logos ? 'checked' : ''}> Logos
                                </label>
                            </div>
                            <div id="rel-prop-sections-sub" style="display: ${this.reportSections.equipamentos ? 'flex' : 'none'}; flex-wrap: wrap; gap: 12px; font-size: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                                <span style="font-weight: 600; color: #475569; white-space: nowrap;">Equipamentos →</span>
                                <label class="rel-prop-section-label" data-section="fichaTecnica" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.fichaTecnica ? 'checked' : ''}> Ficha Técnica
                                </label>
                                <label class="rel-prop-section-label" data-section="normas" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.normas ? 'checked' : ''}> Normas
                                </label>
                                <label class="rel-prop-section-label" data-section="cargas" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.cargas ? 'checked' : ''}> Cargas
                                </label>
                                <label class="rel-prop-section-label" data-section="chaparia" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.chaparia ? 'checked' : ''}> Chaparia
                                </label>
                                <label class="rel-prop-section-label" data-section="barramentos" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.barramentos ? 'checked' : ''}> Barramentos
                                </label>
                                <label class="rel-prop-section-label" data-section="exclusionsDeviations" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.exclusionsDeviations ? 'checked' : ''}> Exclusões/Desvios
                                </label>
                                <label class="rel-prop-section-label" data-section="maoDeObra" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.maoDeObra ? 'checked' : ''}> Mão de Obra
                                </label>
                                <label class="rel-prop-section-label" data-section="despesas" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.despesas ? 'checked' : ''}> Despesas
                                </label>
                                <label class="rel-prop-section-label" data-section="precificacao" style="display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" ${this.reportSections.precificacao ? 'checked' : ''}> Precificação
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 12px 16px; text-align: left; width: 40px;">
                                        <input type="checkbox" id="rel-prop-select-all" style="cursor: pointer;">
                                    </th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">PTC</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Cliente</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Projeto</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Código</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Revisão</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Eng. Resp.</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Rev. Elab.</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Vendedor</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Status</th>
                                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #475569;">Data</th>
                                    <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #475569; width: 120px;">Relatório</th>
                                </tr>
                            </thead>
                            <tbody id="rel-prop-tbody">
                                <tr>
                                    <td colspan="12" style="padding: 40px; text-align: center; color: #94a3b8;">
                                <i class="ph ph-spinner" style="font-size: 24px; animation: spin 1s linear infinite; display: inline-block;"></i>
                                        <br><br>Carregando propostas...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                .btn-type { transition: all 0.2s ease; }
                .btn-type:hover { opacity: 0.85; }
                #rel-prop-tbody tr:hover { background: #f8faff; }
                #rel-prop-tbody tr td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
            </style>
        `;

        this._debouncedLoad = this._debounce(() => this.loadData(), 200);
        this.bindEvents();
        this.loadData();
        this._loadEngRespOptions();
        this._loadVendedorOptions();
    },

    _debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    bindEvents() {
        document.querySelectorAll('.btn-type').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.currentType === e.currentTarget.dataset.type) return;
                this.currentType = e.currentTarget.dataset.type;
                document.querySelectorAll('.btn-type').forEach(b => {
                    const isActive = b.dataset.type === this.currentType;
                    b.style.background = isActive ? 'var(--color-accent)' : 'transparent';
                    b.style.color = isActive ? 'white' : '#64748b';
                });
                this.loadData();
            });
        });

        document.getElementById('rel-prop-filtro-texto')?.addEventListener('input', (e) => {
            this.filterText = e.target.value;
            this._debouncedLoad();
        });

        this._bindFilterInput('rel-prop-filtro-data-inicio', 'filterDataInicio');
        this._bindFilterInput('rel-prop-filtro-data-fim', 'filterDataFim');
        this._bindFilterInput('rel-prop-filtro-data-atualizacao-inicio', 'filterDataAtualizacaoInicio');
        this._bindFilterInput('rel-prop-filtro-data-atualizacao-fim', 'filterDataAtualizacaoFim');
        this._bindFilterInput('rel-prop-filtro-cliente', 'filterCliente');
        this._bindFilterInput('rel-prop-filtro-responsavel', 'filterResponsavel');
        this._bindFilterInput('rel-prop-filtro-eng-resp', 'filterEngResp', 'change');
        this._bindFilterInput('rel-prop-filtro-revisao', 'filterRevisao');
        this._bindFilterInput('rel-prop-filtro-rev-elab', 'filterRevElab');
        this._bindFilterInput('rel-prop-filtro-tipo-equip', 'filterTipoEquipamento');
        this._bindFilterInput('rel-prop-filtro-valor-min', 'filterValorMin');
        this._bindFilterInput('rel-prop-filtro-valor-max', 'filterValorMax');
        this._bindFilterInput('rel-prop-filtro-vendedor', 'filterVendedor', 'change');
        this._bindFilterInput('rel-prop-filtro-probabilidade', 'filterProbabilidade', 'change');
        this._bindFilterInput('rel-prop-filtro-fase', 'filterFase', 'change');
        this._bindFilterInput('rel-prop-filtro-regiao', 'filterRegiao');
        this._bindFilterInput('rel-prop-filtro-tags', 'filterTags');
        this._bindFilterInput('rel-prop-filtro-vigencia-inicio', 'filterVigenciaInicio');
        this._bindFilterInput('rel-prop-filtro-vigencia-fim', 'filterVigenciaFim');

        document.getElementById('rel-prop-sections-toggle')?.addEventListener('click', () => {
            this.reportSectionsOpen = !this.reportSectionsOpen;
            const body = document.getElementById('rel-prop-sections-body');
            const chevron = document.getElementById('rel-prop-sections-chevron');
            if (body) body.style.display = this.reportSectionsOpen ? 'block' : 'none';
            if (chevron) chevron.style.transform = this.reportSectionsOpen ? 'rotate(90deg)' : 'rotate(0deg)';
        });

        document.querySelectorAll('.rel-prop-section-label').forEach(label => {
            const cb = label.querySelector('input[type="checkbox"]');
            if (!cb) return;
            cb.addEventListener('change', (e) => {
                const section = label.dataset.section;
                this.reportSections[section] = e.currentTarget.checked;
                if (section === 'equipamentos') {
                    const sub = document.getElementById('rel-prop-sections-sub');
                    if (sub) sub.style.display = e.currentTarget.checked ? 'flex' : 'none';
                }
            });
        });

        document.getElementById('rel-prop-select-all')?.addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('.rel-prop-select-item').forEach(cb => cb.checked = checked);
            this.updateGenerateButton();
        });

        document.getElementById('rel-prop-btn-relatorio')?.addEventListener('click', () => {
            this.generateSelectedReports();
        });

        document.getElementById('rel-prop-btn-exportar')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const dd = document.getElementById('rel-prop-export-dropdown');
            if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
        });

        document.getElementById('rel-prop-export-csv')?.addEventListener('click', () => {
            document.getElementById('rel-prop-export-dropdown').style.display = 'none';
            this.exportCSV();
        });

        document.getElementById('rel-prop-export-xls')?.addEventListener('click', () => {
            document.getElementById('rel-prop-export-dropdown').style.display = 'none';
            this.exportXLS();
        });

        if (!this._documentClickBound) {
            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('rel-prop-export-wrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    const dd = document.getElementById('rel-prop-export-dropdown');
                    if (dd) dd.style.display = 'none';
                }
            });
            this._documentClickBound = true;
        }
    },

    loadData() {
        const state = store.getState();
        const proposals = this.currentType === 'tecnicas' ? (state.propostasTecnicas || []) : (state.propostasComerciais || []);

        this._populateClientDatalist(proposals);

        const filtered = proposals.filter(p => {
            if (this.filterText) {
                const t = this.filterText.toLowerCase();
                const cliente = (p.clienteName || p.cliente || '').toLowerCase();
                const projeto = (p.obra || p.projeto || p.titulo || '').toLowerCase();
                const codigo = (p.numero || p.codigo || '').toLowerCase();
                const ptc = (p.ptcFolder || '').toLowerCase();
                if (!cliente.includes(t) && !projeto.includes(t) && !codigo.includes(t) && !ptc.includes(t)) return false;
            }
            if (this.filterDataInicio) {
                const d = new Date(p.createdAt);
                if (d < new Date(this.filterDataInicio)) return false;
            }
            if (this.filterDataFim) {
                const d = new Date(p.createdAt);
                const fim = new Date(this.filterDataFim);
                fim.setDate(fim.getDate() + 1);
                if (d > fim) return false;
            }
            if (this.filterDataAtualizacaoInicio) {
                const d = new Date(p.updatedAt || p.createdAt);
                if (d < new Date(this.filterDataAtualizacaoInicio)) return false;
            }
            if (this.filterDataAtualizacaoFim) {
                const d = new Date(p.updatedAt || p.createdAt);
                const fim = new Date(this.filterDataAtualizacaoFim);
                fim.setDate(fim.getDate() + 1);
                if (d > fim) return false;
            }

            if (this.filterCliente) {
                const c = (p.clienteName || p.cliente || '').toLowerCase();
                if (!c.includes(this.filterCliente.toLowerCase())) return false;
            }
            if (this.filterResponsavel) {
                const r = (p.responsavel || p.elaborado || p._elab || '').toLowerCase();
                if (!r.includes(this.filterResponsavel.toLowerCase())) return false;
            }
            if (this.filterEngResp) {
                const eng = (p.engenheiroResponsavel || '').toLowerCase();
                if (!eng.includes(this.filterEngResp.toLowerCase())) return false;
            }
            if (this.filterRevisao) {
                const rev = String(p._rev || p.revision || '');
                if (!rev.includes(this.filterRevisao)) return false;
            }
            if (this.filterRevElab) {
                const elab = (p.ultimoElab || '').toLowerCase();
                if (!elab.includes(this.filterRevElab.toLowerCase())) return false;
            }
            if (this.filterTipoEquipamento) {
                const tipos = (p.equipments || []).map(e => (e.type || '').toLowerCase());
                const t = this.filterTipoEquipamento.toLowerCase();
                if (!tipos.some(tp => tp.includes(t))) return false;
            }
            if (this.filterValorMin) {
                const v = parseFloat(p.valorTotal || p.valor || 0);
                if (isNaN(v) || v < parseFloat(this.filterValorMin)) return false;
            }
            if (this.filterValorMax) {
                const v = parseFloat(p.valorTotal || p.valor || Infinity);
                if (isNaN(v) || v > parseFloat(this.filterValorMax)) return false;
            }
            if (this.filterVendedor) {
                const v = (p.vendedor || p.responsavel || '').toLowerCase();
                if (!v.includes(this.filterVendedor.toLowerCase())) return false;
            }
            if (this.filterProbabilidade) {
                if ((p.probabilidade || '') !== this.filterProbabilidade) return false;
            }
            if (this.filterFase) {
                if ((p.statusPipeline || 'prospect') !== this.filterFase) return false;
            }
            if (this.filterRegiao) {
                const r = (p.regiao || p.uf || p.localizacao || '').toLowerCase();
                if (!r.includes(this.filterRegiao.toLowerCase())) return false;
            }
            if (this.filterTags) {
                const tags = (p.tags || []).join(' ').toLowerCase();
                if (!tags.includes(this.filterTags.toLowerCase())) return false;
            }
            if (this.filterVigenciaInicio) {
                const d = new Date(p.data_validade || p.vigencia || p.createdAt);
                if (d < new Date(this.filterVigenciaInicio)) return false;
            }
            if (this.filterVigenciaFim) {
                const d = new Date(p.data_validade || p.vigencia || p.createdAt);
                const fim = new Date(this.filterVigenciaFim);
                fim.setDate(fim.getDate() + 1);
                if (d > fim) return false;
            }

            return true;
        });

        // Filter by vendedor for vendedor-level users
        if (store.getUserLevel() === 'vendedor') {
            const vendedorName = window.app.getVendedorNameByUserEmail();
            if (vendedorName) {
                this._lastFilteredData = filtered.filter(p => {
                    const pv = (p.vendedor || '').toLowerCase().trim();
                    return pv === vendedorName.toLowerCase().trim();
                });
            } else {
                this._lastFilteredData = [];
            }
        } else {
            this._lastFilteredData = filtered;
        }
        this.renderTable(this._lastFilteredData);
    },

    renderTable(proposals) {
        const tbody = document.getElementById('rel-prop-tbody');
        if (!tbody) return;

        if (proposals.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" style="padding: 40px; text-align: center; color: #94a3b8;">
                <i class="ph ph-magnifying-glass" style="font-size: 24px;"></i>
                <br><br>Nenhuma proposta encontrada.</td></tr>`;
            return;
        }

        tbody.innerHTML = proposals.map(p => `
            <tr>
                <td style="text-align: center;">
                    <input type="checkbox" class="rel-prop-select-item" data-ptc="${p.ptcFolder || ''}" data-rev="${p.revision || '0'}" style="cursor: pointer;">
                </td>
                <td style="font-weight: 600; color: #1e293b;">${this._escapeHtml(p.ptcFolder || 'N/A')}</td>
                <td>${this._escapeHtml(p.clienteName || p.cliente || 'N/A')}</td>
                <td>${this._escapeHtml(p.obra || p.projeto || p.titulo || '-')}</td>
                <td style="font-family: monospace; font-size: 12px;">${this._escapeHtml(p.numero || p.codigo || '-')}</td>
                <td>${this._escapeHtml(p._rev || p.revision || '0')}</td>
                <td style="font-size: 12px; color: #475569;">${this._escapeHtml(p.engenheiroResponsavel || '-')}</td>
                <td style="font-size: 12px; color: #475569;">${this._escapeHtml(p.ultimoElab || '-')}</td>
                <td style="font-size: 12px; color: #b45309;">${this._escapeHtml(p.vendedor || '-')}</td>
                <td style="font-size: 12px; color: #475569;">${this._labelPipelineStatus(p.statusPipeline)}</td>
                <td style="font-size: 12px; color: #64748b;">${p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                <td style="text-align: center;">
                    <button class="btn btn-xs btn-primary rel-prop-gerar" data-ptc="${p.ptcFolder || ''}" data-rev="${p.revision || '0'}" style="font-size: 11px; padding: 4px 10px;">
                        <i class="ph ph-file-arrow-down"></i> Relatório
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.rel-prop-select-item').forEach(cb => {
            cb.addEventListener('change', () => this.updateGenerateButton());
        });

        document.querySelectorAll('.rel-prop-gerar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ptc = e.currentTarget.dataset.ptc;
                const rev = e.currentTarget.dataset.rev;
                if (ptc) {
                    window.relatorioProposta.gerarRelatorio(ptc, rev);
                } else {
                    window.app.toast('PTC não disponível para esta proposta.', 'warning');
                }
            });
        });
    },

    generateSelectedReports() {
        const selected = document.querySelectorAll('.rel-prop-select-item:checked');
        if (selected.length === 0) {
            window.app.toast('Selecione pelo menos uma proposta.', 'warning');
            return;
        }
        let skipped = 0;
        selected.forEach(cb => {
            const ptc = cb.dataset.ptc;
            const rev = cb.dataset.rev;
            if (ptc) {
                window.relatorioProposta.gerarRelatorio(ptc, rev);
            } else {
                skipped++;
            }
        });
        if (skipped > 0) {
            window.app.toast(`${skipped} proposta(s) ignorada(s) — PTC não disponível.`, 'warning');
        }
    },

    updateGenerateButton() {
        const checked = document.querySelectorAll('.rel-prop-select-item:checked').length;
        const btn = document.getElementById('rel-prop-btn-relatorio');
        if (btn) {
            btn.disabled = checked === 0;
            btn.innerHTML = checked > 0
                ? `<i class="ph ph-file-arrow-down"></i> Gerar Relatório (${checked})`
                : `<i class="ph ph-file-arrow-down"></i> Gerar Relatório Selecionados`;
        }
    },

    openDuplicateModal(proposal) {
        if (document.getElementById('modal-duplicar-proposta')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-duplicar-proposta';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 540px;">
                <div class="modal-header" style="background: var(--color-accent); color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-copy"></i> Duplicar Proposta
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="font-weight: 600; font-size: 13px; margin-bottom: 8px; display: block;">PTC de destino:</label>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <label style="flex: 1; padding: 8px 12px; border: 2px solid var(--color-accent); border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px; background: #f0fdf4;">
                                <input type="radio" name="dup-ptc-option" value="new" checked onchange="document.getElementById('dup-ptc-new-fields').style.display='block'; document.getElementById('dup-ptc-existing-fields').style.display='none';">
                                Criar nova PTC
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="dup-ptc-option" value="existing" onchange="document.getElementById('dup-ptc-new-fields').style.display='none'; document.getElementById('dup-ptc-existing-fields').style.display='block'; window.relatorioPropostasModule.loadPtcList();">
                                PTC existente
                            </label>
                        </div>
                        <div id="dup-ptc-new-fields">
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="dup-ptc-number" class="form-control" value="carregando..." style="flex: 1; font-weight: 700;">
                                <input type="text" id="dup-ptc-title" class="form-control" placeholder="Título do Projeto" value="${this._escapeHtml(proposal.projeto)}" style="flex: 2;">
                    </div>

                </div>
                        <div id="dup-ptc-existing-fields" style="display: none;">
                            <select id="dup-ptc-select" class="form-control">
                                <option value="">Carregando PTCs...</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Cliente</label>
                            <input type="text" id="dup-cliente" class="form-control" value="${this._escapeHtml(proposal.clienteName)}">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Projeto</label>
                            <input type="text" id="dup-projeto" class="form-control" value="${this._escapeHtml(proposal.projeto)}">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Objeto</label>
                        <input type="text" id="dup-objeto" class="form-control" placeholder="Ex: FORNECIMENTO DE PAINÉIS ELÉTRICOS">
                    </div>

                    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" id="dup-include-prec" checked>
                            Duplicar também Precificação (se disponível)
                        </label>
                    </div>

                    <div id="dup-status" style="font-size: 13px; color: #64748b; margin-bottom: 8px;"></div>
                </div>
                <div class="modal-footer" style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn btn-cancel" onclick="document.getElementById('modal-duplicar-proposta').remove()">Cancelar</button>
                    <button class="btn btn-primary" id="dup-btn-confirmar" style="background: var(--color-accent); display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-copy"></i> Duplicar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._proposalData = proposal;
        if (window.app.generatePtcNumber) {
            window.app.generatePtcNumber().then(n => {
                const el = document.getElementById('dup-ptc-number');
                if (el) el.value = n;
            });
        }

        document.getElementById('dup-btn-confirmar').addEventListener('click', () => {
            this.confirmDuplicate(modal);
        });
    },

    async loadPtcList() {
        const select = document.getElementById('dup-ptc-select');
        if (!select) return;
        try {
            const _tkRP698 = store.getState().auth?.token;
            const res = await fetch('http://localhost:8082/api/list-ptcs', { headers: { ...(_tkRP698 ? { 'Authorization': 'Bearer ' + _tkRP698 } : {}) } });
            const data = await res.json();
            if (data.success && data.ptcs) {
                select.innerHTML = '<option value="">Selecione uma PTC...</option>'
                    + data.ptcs.map(d => `<option value="${d}">${d}</option>`).join('');
            } else {
                select.innerHTML = '<option value="">Nenhuma PTC encontrada</option>';
            }
        } catch {
            select.innerHTML = '<option value="">Erro ao carregar PTCs</option>';
        }
    },

    async confirmDuplicate(modal) {
        const statusEl = document.getElementById('dup-status');
        const btnConfirmar = document.getElementById('dup-btn-confirmar');
        const proposal = modal._proposalData;
        if (!proposal || !proposal.ptcFolder) {
            window.app.toast('Proposta de origem inválida.', 'error');
            return;
        }

        const isNewPtc = document.querySelector('input[name="dup-ptc-option"]:checked')?.value === 'new';
        let targetFolder = '';

        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="ph ph-spinner" style="animation: spin 1s linear infinite;"></i> Duplicando...';
        statusEl.textContent = 'Carregando proposta original...';

        try {
            const filename = proposal.type === 'tecnicas' ? 'PropostaTecnica.json' : 'PropostaComercial.json';
            const _tkRPL = store.getState().auth?.token;
            const _hRPL = _tkRPL ? { 'Authorization': 'Bearer ' + _tkRPL } : {};
            const loadRes = await fetch(`http://localhost:8082/api/load-proposal?ptc=${encodeURIComponent(proposal.ptcFolder)}&file=${encodeURIComponent(filename)}&revisionFolder=${encodeURIComponent(proposal.revision || '0')}`, { headers: _hRPL });
            const sourceData = await loadRes.json();
            if (!sourceData || sourceData.error) throw new Error('Proposta original não encontrada no servidor.');

            sourceData._origPtcFolder = proposal.ptcFolder;

            if (isNewPtc) {
                statusEl.textContent = 'Criando nova PTC...';
                const ptcNumber = document.getElementById('dup-ptc-number')?.value || '';
                const ptcTitle = document.getElementById('dup-ptc-title')?.value || '';
                const clientName = document.getElementById('dup-cliente')?.value || '';

                if (!ptcTitle) {
                    window.app.toast('Informe o título do projeto para criar uma nova PTC.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Duplicar';
                    statusEl.textContent = '';
                    return;
                }

                targetFolder = await window.app.createPtcSimple(ptcNumber, ptcTitle, clientName);
            } else {
                targetFolder = document.getElementById('dup-ptc-select')?.value;
                if (!targetFolder) {
                    window.app.toast('Selecione uma PTC existente.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Duplicar';
                    statusEl.textContent = '';
                    return;
                }
            }

            statusEl.textContent = 'Salvando proposta duplicada...';

            const options = {
                cliente: document.getElementById('dup-cliente')?.value || undefined,
                projeto: document.getElementById('dup-projeto')?.value || undefined,
                objeto: document.getElementById('dup-objeto')?.value || undefined,
                includePrecificacao: document.getElementById('dup-include-prec')?.checked || false
            };

            const result = await window.app.duplicateProposal(proposal.type === 'tecnicas' ? 'tecnica' : 'comercial', sourceData, targetFolder, options);

            if (result.success) {
                window.app.toast('Proposta duplicada com sucesso!', 'success');
                modal.remove();
                this.loadData();
            }
        } catch (e) {
            console.error('[Duplicate] Error:', e);
            window.app.toast('Erro: ' + e.message, 'error');
            statusEl.textContent = 'Erro: ' + e.message;
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Duplicar';
        }
    },

    exportCSV() {
        if (!this._lastFilteredData || this._lastFilteredData.length === 0) {
            window.app.toast('Nenhum dado para exportar.', 'warning');
            return;
        }
        const columns = [
            { label: 'PTC', fn: p => p.ptcFolder || '' },
            { label: 'Cliente', fn: p => p.clienteName || p.cliente || '' },
            { label: 'Projeto', fn: p => p.obra || p.projeto || p.titulo || '' },
            { label: 'Código', fn: p => p.numero || p.codigo || '' },
            { label: 'Revisão', fn: p => p._rev || p.revision || '' },
            { label: 'Eng. Responsável', fn: p => p.engenheiroResponsavel || '' },
            { label: 'Rev. Elaborado', fn: p => p.ultimoElab || '' },
            { label: 'Data Criação', fn: p => p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '' },
            { label: 'Data Atualização', fn: p => p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('pt-BR') : '' },
            { label: 'Responsável', fn: p => p.responsavel || p.elaborado || '' },
            { label: 'Vendedor', fn: p => p.vendedor || '' },
            { label: 'Probabilidade', fn: p => p.probabilidade || '' },
            { label: 'Status', fn: p => p.statusPipeline || 'prospect' },
            { label: 'Valor R$', fn: p => { const v = parseFloat(p.valorTotal || p.valor); return isNaN(v) ? '' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); } },
            { label: 'Região/UF', fn: p => p.regiao || p.uf || p.localizacao || '' },
            { label: 'Tags', fn: p => (p.tags || []).join('; ') },
            { label: 'Vigência', fn: p => p.data_validade || p.vigencia || '' },
            { label: 'Status', fn: p => p.status || p._status || '' }
        ];
        const BOM = '\uFEFF';
        const rows = [columns.map(c => c.label)];
        this._lastFilteredData.forEach(p => {
            rows.push(columns.map(c => {
                const val = String(c.fn(p));
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    return '"' + val.replace(/"/g, '""') + '"';
                }
                return val;
            }));
        });
        const csv = BOM + rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `propostas_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.app.toast('CSV exportado com sucesso.', 'success');
    },

    exportXLS() {
        if (!this._lastFilteredData || this._lastFilteredData.length === 0) {
            window.app.toast('Nenhum dado para exportar.', 'warning');
            return;
        }
        const columns = [
            { label: 'PTC', fn: p => p.ptcFolder || '' },
            { label: 'Cliente', fn: p => p.clienteName || p.cliente || '' },
            { label: 'Projeto', fn: p => p.obra || p.projeto || p.titulo || '' },
            { label: 'Código', fn: p => p.numero || p.codigo || '' },
            { label: 'Revisão', fn: p => p._rev || p.revision || '' },
            { label: 'Eng. Responsável', fn: p => p.engenheiroResponsavel || '' },
            { label: 'Rev. Elaborado', fn: p => p.ultimoElab || '' },
            { label: 'Data Criação', fn: p => p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '' },
            { label: 'Data Atualização', fn: p => p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('pt-BR') : '' },
            { label: 'Responsável', fn: p => p.responsavel || p.elaborado || '' },
            { label: 'Vendedor', fn: p => p.vendedor || '' },
            { label: 'Probabilidade', fn: p => p.probabilidade || '' },
            { label: 'Status', fn: p => p.statusPipeline || 'prospect' },
            { label: 'Valor R$', fn: p => { const v = parseFloat(p.valorTotal || p.valor); return isNaN(v) ? '' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); } },
            { label: 'Região/UF', fn: p => p.regiao || p.uf || p.localizacao || '' },
            { label: 'Tags', fn: p => (p.tags || []).join('; ') },
            { label: 'Vigência', fn: p => p.data_validade || p.vigencia || '' },
            { label: 'Status', fn: p => p.status || p._status || '' }
        ];
        const data = [columns.map(c => c.label)];
        this._lastFilteredData.forEach(p => {
            data.push(columns.map(c => c.fn(p)));
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Propostas');
        XLSX.writeFile(wb, `propostas_${new Date().toISOString().slice(0, 10)}.xlsx`);
        window.app.toast('XLS exportado com sucesso.', 'success');
    },

    _loadVendedorOptions() {
        const select = document.getElementById('rel-prop-filtro-vendedor');
        if (!select) return;
        const vendedores = store.getState().vendedores || [];
        const nomes = [...new Set(vendedores.map(v => v.nome).filter(Boolean))];
        select.innerHTML = '<option value="">Todos</option>' + nomes.map(n => `<option value="${this._escapeHtml(n)}">${this._escapeHtml(n)}</option>`).join('');
    },

    _loadEngRespOptions() {
        const select = document.getElementById('rel-prop-filtro-eng-resp');
        if (!select) return;
        if (this._usersCache) {
            select.innerHTML = '<option value="">Todos</option>' + this._usersCache.map(u => `<option value="${this._escapeHtml(u.name)}">${this._escapeHtml(u.name)}</option>`).join('');
            return;
        }
        const token = store.getState().auth?.token;
        if (!token) return;
        fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : null).then(j => {
            if (!j || !Array.isArray(j.users)) return;
            const users = j.users.filter(u => u.nivel === 'admin' || u.nivel === 'engenheiro');
            this._usersCache = users;
            select.innerHTML = '<option value="">Todos</option>' + users.map(u => `<option value="${this._escapeHtml(u.name)}">${this._escapeHtml(u.name)}</option>`).join('');
        }).catch(() => {});
    },

    _labelPipelineStatus(s) {
        const map = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
        return map[s] || s || 'Aguardando Início';
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    _bindFilterInput(id, prop, eventType) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener(eventType || 'input', (e) => {
            this[prop] = e.target.value;
            this._debouncedLoad();
        });
    },

    _populateClientDatalist(proposals) {
        const datalist = document.getElementById('rel-prop-clientes');
        if (!datalist) return;
        const names = [...new Set(proposals.map(p => p.clienteName || p.cliente || '').filter(Boolean))].sort();
        const key = names.join('|');
        if (key === this._lastClientListKey) return;
        this._lastClientListKey = key;
        datalist.innerHTML = names.map(n => `<option value="${this._escapeHtml(n)}">`).join('');
    }
};

window.relatorioPropostasModule = RelatorioPropostas;
