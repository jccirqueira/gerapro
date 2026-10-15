import { store } from './state.js';

/* =====================================================================
   MÓDULO DE COMPRAS — GeraPro
   ---------------------------------------------------------------------
   Fase 0: esqueleto, wiring e ciclo de vida do módulo (lista/detalhe).
   Fase 1: ENTRADA DA LM — upload do arquivo da Engenharia, pareamento
           contra o Banco de Materiais, alerta de material não cadastrado
           e gate formal de "Liberar para Compras".

   Fluxo completo (fases seguintes): REQUISIÇÃO → COTAÇÃO → PEDIDO → NF.
   ===================================================================== */

/* Status da Requisição de Compras */
const CP_STATUS = {
    rascunho: 'Rascunho',
    em_conferencia: 'Em Conferência',
    liberada: 'Liberada',
    em_cotacao: 'Em Cotação',
    em_pedido: 'Em Pedido',
    recebida: 'Recebida',
    cancelada: 'Cancelada'
};

/* Origem do arquivo da LM — AGNÓSTICA da fonte:
   hoje o engenheiro envia por upload; quando a Engenharia virar módulo
   nativo, a LM será gerada da proposta técnica sem mudar nenhuma tabela. */
const CP_ORIGEM = {
    upload: 'Upload da Engenharia',
    manual: 'Lançamento manual',
    proposta: 'Gerada da Proposta Técnica'
};

/* Aliases de cabeçalho aceitos no arquivo da LM (já sem acento/minúsculo).
   Template oficial: Código | Descrição | Fabricante | Unidade | Quantidade */
const CP_ALIASES = {
    codigo: ['codigo', 'cod', 'codigo interno', 'cod interno', 'codigo fabricante',
             'cod fabricante', 'part number', 'pn', 'referencia', 'ref', 'sku'],
    descricao: ['descricao', 'desc', 'item', 'material', 'denominacao',
                'especificacao', 'description', 'descricao do item', 'descricao do material'],
    fabricante: ['fabricante', 'marca', 'manufacturer', 'fornecedor', 'fabricante marca'],
    unidade: ['unidade', 'un', 'um', 'unid', 'unidad'],
    qtd: ['quantidade', 'qtd', 'qtde', 'qty', 'qtd total', 'qtd.', 'quant']
};

/* Pontuação mínima para aceitar uma correspondência textual como "sugestão".
   Abaixo disso o item é tratado como NÃO CADASTRADO. */
const CP_LIMIAR = 55;

/* Uma requisição aberta é deduplicada destas. */
const CP_ABERTAS = ['rascunho', 'em_conferencia', 'liberada', 'em_cotacao', 'em_pedido'];

const ComprasModule = {
    _active: false,
    _seeding: false,        // suprime re-render durante escrita em lote
    viewMode: 'list',       // 'list' | 'nova' | 'detail'
    activeId: null,
    activeTab: 'itens',     // 'itens' | 'resumo'
    searchQuery: '',
    statusFilter: '',
    projetoFilter: '',
    _staging: null,         // requisição em construção (viewMode === 'nova')
    _idx: null,             // índice do catálogo para o pareamento
    _matModal: null,        // { idx, material (sugestão) }
    _loteErros: null,       // mensagens do último bloqueio de liberação

    /* ================================================================
       CICLO DE VIDA
       ================================================================ */

    init() {
        window.comprasModule = this;
        window.app = window.app || {};
        window.app.compras = {
            render: this.render.bind(this),
            resetView: this.resetView.bind(this),
            openDetail: this.openDetail.bind(this),
            backToList: this.backToList.bind(this),
            switchTab: this.switchTab.bind(this),
            filter: this.filter.bind(this),
            openNova: this.openNova.bind(this),
            cancelarNova: this.cancelarNova.bind(this),
            setCampo: this.setCampo.bind(this),
            setItemCampo: this.setItemCampo.bind(this),
            baixarTemplateLM: this.baixarTemplateLM.bind(this),
            handleLMFile: this.handleLMFile.bind(this),
            dropArquivo: this.dropArquivo.bind(this),
            removerArquivo: this.removerArquivo.bind(this),
            salvarRequisicao: this.salvarRequisicao.bind(this),
            abrirArquivo: this.abrirArquivo.bind(this),
            openMaterialModal: this.openMaterialModal.bind(this),
            buscaCatalogo: this.buscaCatalogo.bind(this),
            vincularSugestao: this.vincularSugestao.bind(this),
            vincularResultado: this.vincularResultado.bind(this),
            salvarMaterialNovo: this.salvarMaterialNovo.bind(this),
            removerItem: this.removerItem.bind(this),
            liberarRequisicao: this.liberarRequisicao.bind(this),
            cancelarRequisicao: this.cancelarRequisicao.bind(this),
            remove: this.remove.bind(this),
            exportXLSX: this.exportXLSX.bind(this)
        };

        store.subscribe((state) => {
            if (this._active && !this._seeding) {
                if (this.viewMode === 'nova') {
                    // staging próprio: não re-render, para não perder foco de digitação
                } else if (this.viewMode === 'detail' && this.activeId) {
                    const exists = (state.comprasRequisicoes || []).some(r => r.id === this.activeId);
                    if (!exists) this.backToList();
                    else this.renderDetail();
                } else if (this.viewMode === 'list') {
                    this.renderList();
                }
            }
            this.updateBadge();
        });

        this.updateBadge();
        console.log('[Compras] Module initialized.');
    },

    resetView() {
        this._active = false;
        this.viewMode = 'list';
        this.activeId = null;
        this.activeTab = 'itens';
        this.searchQuery = '';
        this.statusFilter = '';
        this.projetoFilter = '';
        this._staging = null;
        this._matModal = null;
    },

    /* Badge: prioriza itens ainda não resolvidos; senão, pendências de fluxo. */
    updateBadge() {
        const badge = document.getElementById('compras-badge');
        if (!badge) return;
        const state = store.getState();
        const reqs = state.comprasRequisicoes || [];
        const validas = new Set(reqs.filter(r => r.status !== 'cancelada').map(r => r.id));

        let count = (state.comprasRequisicaoItens || [])
            .filter(i => validas.has(i.requisicao_id) && (!i.material_id || i.nao_cadastrado))
            .length;
        if (!count) count = reqs.filter(r => r.status === 'rascunho' || r.status === 'em_conferencia').length;
        if (!count) count = reqs.filter(r => r.status === 'liberada').length;

        badge.textContent = count > 0 ? (count > 99 ? '99+' : String(count)) : '';
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    },

    /* ================================================================
       NAVEGAÇÃO
       ================================================================ */

    render() {
        this._active = true;
        if (this.viewMode === 'nova') this.renderNova();
        else if (this.viewMode === 'detail' && this.activeId) this.renderDetail();
        else this.renderList();
    },

    openDetail(id) {
        this.activeId = id;
        this.viewMode = 'detail';
        this.activeTab = 'itens';
        this.render();
    },

    backToList() {
        this.viewMode = 'list';
        this.activeId = null;
        this.activeTab = 'itens';
        this._matModal = null;
        this.render();
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.renderDetail();
    },

    filter(kind, value) {
        if (kind === 'search') this.searchQuery = value || '';
        if (kind === 'status') this.statusFilter = value || '';
        if (kind === 'projeto') this.projetoFilter = value || '';
        const box = document.getElementById('cp-results');
        if (box) box.innerHTML = this._resultsHTML((store.getState().comprasRequisicoes || []).length);
        else this.renderList();
    },

    _getRequisicoes() {
        const state = store.getState();
        let items = [...(state.comprasRequisicoes || [])];
        const q = this.searchQuery.trim().toLowerCase();
        if (q) {
            items = items.filter(r =>
                (r.codigo || '').toLowerCase().includes(q) ||
                (r.titulo || '').toLowerCase().includes(q) ||
                (r.solicitante || '').toLowerCase().includes(q) ||
                (r.revisao || '').toLowerCase().includes(q)
            );
        }
        if (this.statusFilter) items = items.filter(r => r.status === this.statusFilter);
        if (this.projetoFilter) items = items.filter(r => r.projeto_id === this.projetoFilter);
        items.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
        return items;
    },

    _req(id) {
        return (store.getState().comprasRequisicoes || []).find(r => r.id === id) || null;
    },

    _itensDaRequisicao(reqId) {
        return (store.getState().comprasRequisicaoItens || [])
            .filter(i => i.requisicao_id === reqId)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    },

    _itensAtuais() {
        if (this.viewMode === 'nova' && this._staging) return this._staging.itens || [];
        if (this.viewMode === 'detail' && this.activeId) return this._itensDaRequisicao(this.activeId);
        return [];
    },

    /* ================================================================
       VIEW — LISTA
       ================================================================ */

    renderList() {
        const container = document.getElementById('view-compras');
        if (!container) return;

        const all = store.getState().comprasRequisicoes || [];
        const items = this._getRequisicoes();

        const naoCadastrados = this._countNaoCadastrados();
        const emAndamento = all.filter(r => r.status === 'liberada' || r.status === 'em_cotacao' || r.status === 'em_pedido').length;
        const valorEstimado = all.reduce((s, r) => s + (parseFloat(r.total_estimado) || 0), 0);
        const projetos = store.getState().projetos || [];

        container.innerHTML = `
            <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <div>
                        <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                            <i class="ph ph-shopping-cart"></i> Compras
                        </h2>
                        <div style="font-size:12px;opacity:0.9;margin-top:2px;">Requisição (LM da Engenharia) → Cotação → Pedido de Compras → Nota Fiscal.</div>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.openNova()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-plus"></i> Nova Requisição
                        </button>
                    </div>
                </div>
                <div class="cp-body">
                    <div class="cp-summary">
                        <div class="cp-card"><div class="cp-card-value">${all.length}</div><div class="cp-card-label">Requisições</div></div>
                        <div class="cp-card ${naoCadastrados > 0 ? 'alert' : ''}"><div class="cp-card-value">${naoCadastrados}</div><div class="cp-card-label">Itens Não Cadastrados</div></div>
                        <div class="cp-card"><div class="cp-card-value">${emAndamento}</div><div class="cp-card-label">Em Andamento</div></div>
                        <div class="cp-card"><div class="cp-card-value">${window.app.formatCurrency(valorEstimado)}</div><div class="cp-card-label">Valor Estimado</div></div>
                    </div>

                    <div class="cp-toolbar">
                        <div class="cp-search">
                            <i class="ph ph-magnifying-glass"></i>
                            <input type="text" placeholder="Buscar por código, título, revisão ou solicitante..." value="${this._esc(this.searchQuery)}"
                                oninput="app.compras.filter('search', this.value)">
                        </div>
                        <select class="cp-filter" onchange="app.compras.filter('status', this.value)">
                            <option value="" ${this.statusFilter === '' ? 'selected' : ''}>Todos os status</option>
                            ${Object.entries(CP_STATUS).map(([k, v]) => `<option value="${k}" ${this.statusFilter === k ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                        <select class="cp-filter" onchange="app.compras.filter('projeto', this.value)">
                            <option value="" ${this.projetoFilter === '' ? 'selected' : ''}>Todos os projetos</option>
                            ${projetos.map(p => `<option value="${p.id}" ${this.projetoFilter === p.id ? 'selected' : ''}>${this._esc(p.codigo || p.projeto)}</option>`).join('')}
                        </select>
                        <span class="cp-count" id="cp-count">${items.length} de ${all.length} requisição(ões)</span>
                    </div>

                    <div id="cp-results">${this._resultsHTML(all.length)}</div>
                </div>
            </div>
        `;
    },

    _countNaoCadastrados() {
        const state = store.getState();
        const validas = new Set((state.comprasRequisicoes || [])
            .filter(r => r.status !== 'cancelada').map(r => r.id));
        return (state.comprasRequisicaoItens || [])
            .filter(i => validas.has(i.requisicao_id) && (!i.material_id || i.nao_cadastrado))
            .length;
    },

    _resultsHTML(total) {
        const items = this._getRequisicoes();
        const count = document.getElementById('cp-count');
        if (count) count.textContent = `${items.length} de ${total} requisição(ões)`;
        if (items.length === 0) return this._emptyStateHTML(total);

        const projetos = store.getState().projetos || [];
        const nomeProjeto = (id) => {
            const p = projetos.find(x => x.id === id);
            return p ? (p.codigo || p.projeto) : '';
        };

        return `
                    <div class="cp-table-wrap">
                        <table class="cp-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Título / Projeto</th>
                                    <th>Solicitante</th>
                                    <th>Revisão</th>
                                    <th>Status</th>
                                    <th>Itens</th>
                                    <th style="text-align:right">Valor Estimado</th>
                                    <th>Data Req.</th>
                                    <th style="text-align:right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(r => {
                                    const itens = this._itensDaRequisicao(r.id);
                                    const pend = itens.filter(i => !i.material_id || i.nao_cadastrado).length;
                                    const proj = nomeProjeto(r.projeto_id);
                                    return `
                                    <tr onclick="app.compras.openDetail('${r.id}')">
                                        <td class="cp-codigo">${this._esc(r.codigo)}</td>
                                        <td>
                                            <div class="cp-titulo">${this._esc(r.titulo) || '<span class="cp-sub">Sem título</span>'}</div>
                                            <div class="cp-sub">${this._esc(proj) || ''}</div>
                                        </td>
                                        <td>${this._esc(r.solicitante) || '<span class="cp-sub">—</span>'}</td>
                                        <td class="cp-datas">${this._esc(r.revisao) || '—'}</td>
                                        <td><span class="cp-badge ${this._esc(r.status)}">${CP_STATUS[r.status] || this._esc(r.status)}</span></td>
                                        <td>
                                            <span class="cp-sub">${itens.length} item(ns)</span>
                                            ${pend ? `<div class="cp-sub" style="color:#dc2626;font-weight:700;">${pend} não cadastrado(s)</div>` : ''}
                                        </td>
                                        <td class="cp-valor">${window.app.formatCurrency(r.total_estimado || 0)}</td>
                                        <td class="cp-datas">${this._fmtDate(r.data_requisicao)}</td>
                                        <td class="cp-actions" onclick="event.stopPropagation()">
                                            <button onclick="app.compras.openDetail('${r.id}')" title="Abrir"><i class="ph ph-arrow-square-out"></i></button>
                                            <button class="cp-danger" onclick="app.compras.remove('${r.id}')" title="Excluir"><i class="ph ph-trash"></i></button>
                                        </td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>`;
    },

    _emptyStateHTML(total) {
        if (total === 0) {
            return `
                <div class="cp-empty-state">
                    <i class="ph ph-shopping-cart"></i>
                    <h3>Nenhuma requisição ainda</h3>
                    <p>A <strong>Requisição de Compras</strong> nasce da LM (Lista de Materiais) enviada pela <strong>Engenharia</strong>.
                       Baixe o template, preencha a planilha e envie — o sistema confere cada item contra o Banco de Materiais.</p>
                    <button class="btn btn-primary" onclick="app.compras.openNova()"><i class="ph ph-plus"></i> Criar primeira requisição</button>
                    <button class="btn btn-ghost" onclick="app.compras.baixarTemplateLM()" style="margin-left:8px;"><i class="ph ph-file-xls"></i> Baixar template da LM</button>
                </div>`;
        }
        return `
            <div class="cp-empty-state">
                <i class="ph ph-magnifying-glass"></i>
                <h3>Nenhum resultado</h3>
                <p>Nenhuma requisição corresponde aos filtros aplicados.</p>
            </div>`;
    },

    /* ================================================================
       VIEW — NOVA REQUISIÇÃO (Fase 1)
       ================================================================ */

    openNova() {
        this.viewMode = 'nova';
        this._staging = {
            id: crypto.randomUUID(),
            titulo: '',
            projeto_id: '',
            revisao: '',
            solicitante: '',
            data_lm: '',
            observacoes: '',
            arquivo: null,
            itens: []
        };
        this.render();
    },

    cancelarNova() {
        this._staging = null;
        this.viewMode = 'list';
        this.render();
    },

    /* Atualiza um campo do staging SEM re-render (preserva o foco do input). */
    setCampo(campo, valor) {
        if (!this._staging) return;
        this._staging[campo] = valor;
    },

    renderNova() {
        const container = document.getElementById('view-compras');
        if (!container) return;
        const s = this._staging;
        if (!s) { this.backToList(); return; }

        const projetos = store.getState().projetos || [];
        const resumo = this._resumo(s.itens);
        const erroLote = this._loteErros;

        container.innerHTML = `
            <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.cancelarNova()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-file-arrow-up"></i> Nova Requisição de Compras
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">Envie a LM recebida da Engenharia e confira os itens contra o Banco de Materiais.</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.baixarTemplateLM()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Modelo de planilha aceito pelo sistema">
                            <i class="ph ph-file-xls"></i> Template LM
                        </button>
                    </div>
                </div>

                <div class="cp-body">

                    ${erroLote && erroLote.length ? `
                    <div class="cp-banner err">
                        <i class="ph ph-warning-octagon"></i>
                        <div>
                            <b>Não foi possível liberar:</b>
                            <div style="margin-top:4px;">${erroLote.map(e => `• ${this._esc(e)}`).join('<br>')}</div>
                        </div>
                    </div>` : ''}

                    <div class="cp-section-title"><span class="cp-step">1</span> Dados da Requisição</div>
                    <div class="cp-panel">
                        <div class="cp-form-grid">
                            <div class="cp-field cp-span-2">
                                <label>Título</label>
                                <input type="text" class="form-control" placeholder="Ex.: Painéis Sala Q2 — LM rev. 3"
                                    value="${this._esc(s.titulo)}" oninput="app.compras.setCampo('titulo', this.value)">
                            </div>
                            <div class="cp-field">
                                <label>Projeto</label>
                                <select class="form-control" onchange="app.compras.setCampo('projeto_id', this.value)">
                                    <option value="">— Sem vínculo —</option>
                                    ${projetos.map(p => `<option value="${p.id}" ${s.projeto_id === p.id ? 'selected' : ''}>${this._esc(p.codigo || p.projeto)}${p.cliente ? ' — ' + this._esc(p.cliente) : ''}</option>`).join('')}
                                </select>
                            </div>
                            <div class="cp-field">
                                <label>Revisão da LM</label>
                                <input type="text" class="form-control" placeholder="Ex.: 3"
                                    value="${this._esc(s.revisao)}" oninput="app.compras.setCampo('revisao', this.value)">
                            </div>
                            <div class="cp-field">
                                <label>Solicitante / Engenheiro</label>
                                <input type="text" class="form-control" placeholder="Responsável pela emissão"
                                    value="${this._esc(s.solicitante)}" oninput="app.compras.setCampo('solicitante', this.value)">
                            </div>
                            <div class="cp-field">
                                <label>Data da LM</label>
                                <input type="date" class="form-control" value="${this._esc(s.data_lm)}"
                                    onchange="app.compras.setCampo('data_lm', this.value)">
                            </div>
                            <div class="cp-field cp-span-2">
                                <label>Observações</label>
                                <input type="text" class="form-control" placeholder="Observações sobre o documento"
                                    value="${this._esc(s.observacoes)}" oninput="app.compras.setCampo('observacoes', this.value)">
                            </div>
                        </div>
                    </div>

                    <div class="cp-section-title">
                        <span class="cp-step">2</span> Origem da LM — Arquivo da Engenharia
                        <span class="cp-hint">Formatos aceitos: .xlsx, .xls e .csv</span>
                    </div>
                    <div class="cp-panel">
                        ${s.arquivo ? this._arquivoHTML(s.arquivo) : this._dropHTML()}
                        <input type="file" id="cp-lm-input" accept=".xlsx,.xls,.csv" style="display:none"
                            onchange="app.compras.handleLMFile(this)">
                    </div>

                    ${s.itens.length ? `
                    <div class="cp-section-title">
                        <span class="cp-step">3</span> Conferência dos Itens
                        <span class="cp-hint">A liberação exige que todos os itens estejam vinculados ao catálogo</span>
                    </div>
                    ${this._bannerHTML(resumo)}
                    ${this._legendaHTML(resumo)}
                    ${this._conferenciaHTML(s.itens, resumo)}
                    ` : `
                    <div class="cp-section-title"><span class="cp-step">3</span> Conferência dos Itens</div>
                    <div class="cp-empty-state">
                        <i class="ph ph-clipboard-text"></i>
                        <h3>Nenhum item carregado</h3>
                        <p>Envie o arquivo da LM na etapa 2 para que o sistema leia os itens e faça o pareamento automático
                           com o <strong>Banco de Materiais</strong>.</p>
                    </div>`}
                </div>

                <div class="cp-footbar">
                    <div class="cp-footbar-info">
                        ${s.itens.length
                            ? `<b>${resumo.total}</b> item(ns) · <b>${resumo.exato}</b> casado(s) · <b>${resumo.sugestao}</b> sugestão(ões) · <b style="color:${resumo.naoCadastrado ? '#dc2626' : '#6b7280'}">${resumo.naoCadastrado}</b> não cadastrado(s)`
                            : 'Envie a LM da Engenharia para habilitar a liberação para compras.'}
                    </div>
                    <div class="cp-footbar-actions">
                        <button class="btn btn-ghost" onclick="app.compras.salvarRequisicao(false)"><i class="ph ph-floppy-disk"></i> Salvar rascunho</button>
                        <button class="btn btn-primary" onclick="app.compras.salvarRequisicao(true)"><i class="ph ph-check-circle"></i> Salvar e Liberar para Compras</button>
                    </div>
                </div>
            </div>
        `;

        this._bindDrop();
        this._loteErros = null;
    },

    _dropHTML() {
        return `
            <div class="cp-drop" id="cp-drop">
                <i class="ph ph-cloud-arrow-up"></i>
                <h4>Arraste a planilha da LM aqui ou clique para selecionar</h4>
                <p>Colunas obrigatórias: <code>Código</code> <code>Descrição</code> <code>Unidade</code> <code>Quantidade</code><br>
                   <code>Fabricante</code> é opcional, mas melhora o pareamento.</p>
                <div class="cp-drop-actions">
                    <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('cp-lm-input').click()">
                        <i class="ph ph-upload-simple"></i> Selecionar arquivo
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="app.compras.baixarTemplateLM()">
                        <i class="ph ph-file-xls"></i> Baixar template
                    </button>
                </div>
            </div>`;
    },

    _arquivoHTML(a) {
        return `
            <div class="cp-file">
                <i class="ph ph-file-xls"></i>
                <div class="cp-file-meta">
                    <div class="cp-file-name">${this._esc(a.nome)}</div>
                    <div class="cp-file-sub">
                        ${a.itens ? `<span class="cp-file-ok">${a.itens} item(ns) lidos</span> · ` : ''}
                        ${(a.bytes ? Math.max(1, Math.round(a.bytes / 1024)) + ' KB · ' : '')}
                        SHA-256 ${this._esc(a.hash ? a.hash.slice(0, 24) + '…' : '—')}
                    </div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="document.getElementById('cp-lm-input').click()" title="Substituir arquivo">
                    <i class="ph ph-arrows-clockwise"></i> Substituir
                </button>
                <button class="btn btn-ghost btn-sm" onclick="app.compras.removerArquivo()" title="Remover arquivo">
                    <i class="ph ph-trash"></i>
                </button>
            </div>`;
    },

    _bindDrop() {
        const drop = document.getElementById('cp-drop');
        if (!drop) return;
        drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', (e) => this.dropArquivo(e));
        drop.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const inp = document.getElementById('cp-lm-input');
            if (inp) inp.click();
        });
    },

    dropArquivo(ev) {
        ev.preventDefault();
        if (ev.currentTarget) ev.currentTarget.classList.remove('over');
        const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
        if (f) this._lerArquivo(f);
    },

    handleLMFile(input) {
        const file = input.files && input.files[0];
        if (!file) return;
        this._lerArquivo(file);
        input.value = '';
    },

    /* Lê o arquivo da LM, valida o cabeçalho e monta o staging dos itens. */
    async _lerArquivo(file) {
        if (!this._staging) return;
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            window.app.toast('Formato não suportado. Envie .xlsx, .xls ou .csv.', 'error');
            return;
        }
        try {
            const buf = await file.arrayBuffer();
            const hash = await this._sha256(buf);
            const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });

            // Procura a primeira planilha cujo cabeçalho tenha Descrição + Quantidade.
            let rows = null, mapa = null, usada = '';
            for (const nome of wb.SheetNames) {
                const ws = wb.Sheets[nome];
                if (!ws || !ws['!ref']) continue;
                const r = XLSX.utils.sheet_to_json(ws, { defval: '' });
                if (!r.length) continue;
                const m = this._mapearColunas(Object.keys(r[0]));
                if (m.descricao !== undefined && m.qtd !== undefined) { rows = r; mapa = m; usada = nome; break; }
            }

            if (!rows) {
                window.app.toast(
                    'Cabeçalho não reconhecido. Use o template: colunas Código, Descrição, Fabricante, Unidade e Quantidade.',
                    'error'
                );
                return;
            }

            const itens = [];
            rows.forEach((row) => {
                const desc = String(row[mapa.descricao] ?? '').trim();
                if (!desc) return; // linha em branco
                itens.push({
                    ordem: itens.length + 1,
                    codigo: mapa.codigo !== undefined ? String(row[mapa.codigo] ?? '').trim() : '',
                    descricao: desc,
                    fabricante: mapa.fabricante !== undefined ? String(row[mapa.fabricante] ?? '').trim() : '',
                    unidade: mapa.unidade !== undefined ? String(row[mapa.unidade] ?? '').trim() : '',
                    qtd: Math.max(0, this._num(row[mapa.qtd])),
                    custo_catalogo: 0,
                    lead_time_catalogo: 0,
                    material_id: '',
                    nao_cadastrado: 1,
                    match_confianca: 0,
                    status: 'pendente',
                    observacoes: '',
                    _duplicados: 0
                });
            });

            if (!itens.length) {
                window.app.toast('A planilha não contém itens com descrição.', 'error');
                return;
            }

            this._staging.arquivo = {
                nome: file.name,
                hash,
                bytes: file.size,
                tipo: ext,
                itens: itens.length,
                planilha: usada,
                base64: buf.byteLength <= 10 * 1024 * 1024 ? this._toBase64(buf) : ''
            };
            this._staging.itens = itens;
            this.parearTodos();
            this.renderNova();
            window.app.toast(`${itens.length} item(ns) lidos. Pareamento com o Banco de Materiais concluído.`, 'success');
        } catch (e) {
            console.error('[Compras] Leitura da LM:', e);
            window.app.toast('Não foi possível ler o arquivo: ' + e.message, 'error');
        }
    },

    removerArquivo() {
        if (!this._staging) return;
        this._staging.arquivo = null;
        this._staging.itens = [];
        this.renderNova();
    },

    /* ================================================================
       MAPEAMENTO DE COLUNAS E PARSING
       ================================================================ */

    _mapearColunas(headers) {
        const mapa = {};
        headers.forEach((h) => {
            const n = this._norm(h);
            if (!n) return;
            for (const campo of ['codigo', 'descricao', 'fabricante', 'unidade', 'qtd']) {
                if (mapa[campo] !== undefined) continue;
                const aliases = CP_ALIASES[campo];
                if (aliases.includes(n)) { mapa[campo] = h; break; }
                if (n.length >= 3 && aliases.some(a => n.startsWith(a) || a.startsWith(n))) { mapa[campo] = h; break; }
            }
        });
        return mapa;
    },

    /* ================================================================
       PAREAMENTO CONTRA O BANCO DE MATERIAIS
       ----------------------------------------------------------------
       3 passos: código exato (escopo da empresa) → pontuação textual
       → NÃO CADASTRADO. O catálogo não tem UNIQUE nos códigos (existem
       duplicados reais), por isso o estado "exato" só vale com 1 hit.
       ================================================================ */

    _norm(v) {
        if (v === null || v === undefined) return '';
        let s = String(v);
        if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    },

    _num(v) {
        if (typeof v === 'number') return v;
        if (v === null || v === undefined) return 0;
        let s = String(v).trim().replace(/[^\d.,-]/g, '');
        if (!s || s === '-' || s === '.' || s === ',') return 0;
        const temVirgula = s.includes(','), temPonto = s.includes('.');
        if (temVirgula && temPonto) {
            if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
            else s = s.replace(/,/g, '');
        } else if (temVirgula) {
            const p = s.split(',');
            if (p.length === 2 && p[1].length !== 3) s = p[0] + '.' + p[1];
            else if (p.length === 2 && p[1].length === 3) s = p[0] + p[1];
            else s = s.replace(/,/g, '');
        } else if (temPonto) {
            const p = s.split('.');
            if (p.length > 2) s = s.replace(/\./g, '');
            else if (p[1].length === 3 && p[0] !== '' && p[0] !== '0') s = p[0] + p[1];
            // senão mantém como decimal
        }
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    },

    async _sha256(buf) {
        try {
            const h = await crypto.subtle.digest('SHA-256', buf);
            return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('[Compras] SHA-256 indisponível:', e);
            return '';
        }
    },

    _toBase64(buf) {
        const bytes = new Uint8Array(buf);
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin);
    },

    _invalidateIndice() { this._idx = null; },

    /* Índice do catálogo (25k+ materiais): mapa por código exato e
       índice invertido por token. Reconstruído apenas quando o catálogo muda. */
    _catalogo() {
        const materiais = store.getState().materiais || [];
        if (this._idx && this._idx.total === materiais.length) return this._idx;

        const porCodigo = new Map();
        const porToken = new Map();

        for (let i = 0; i < materiais.length; i++) {
            const m = materiais[i];
            for (const campo of ['codigoInterno', 'codigoFabricante']) {
                const c = this._norm(m[campo]);
                if (!c) continue;
                if (!porCodigo.has(c)) porCodigo.set(c, []);
                porCodigo.get(c).push(i);
            }
            const tokens = new Set();
            this._norm(m.descricao).split(' ').forEach(t => { if (t.length >= 4) tokens.add(t); });
            const cf = this._norm(m.codigoFabricante);
            if (cf.length >= 4) tokens.add(cf);
            tokens.forEach(t => {
                if (!porToken.has(t)) porToken.set(t, []);
                porToken.get(t).push(i);
            });
        }

        this._idx = { total: materiais.length, materiais, porCodigo, porToken };
        return this._idx;
    },

    _candidatos(item, idx) {
        const kws = [];
        this._norm(item.descricao).split(' ').forEach(t => { if (t.length >= 4) kws.push(t); });
        const cf = this._norm(item.codigo);
        if (cf.length >= 4) kws.push(cf);

        // Tokens mais seletivos primeiro (menor lista) — evita gastar o
        // orçamento em palavras genéricas como "disjuntor" ou "painel".
        const ordenados = kws
            .map(t => ({ t, n: (idx.porToken.get(t) || []).length }))
            .filter(x => x.n > 0)
            .sort((a, b) => a.n - b.n);

        const vistas = new Set();
        const out = [];
        for (const { t } of ordenados) {
            for (const i of idx.porToken.get(t)) {
                if (vistas.has(i)) continue;
                vistas.add(i);
                out.push(i);
                if (out.length >= 600) return out;
            }
        }
        return out;
    },

    _score(item, m) {
        const descItem = this._norm(item.descricao);
        const kw = descItem.split(' ').filter(w => w.length >= 4);
        if (!kw.length) return 0;

        const descMat = this._norm(m.descricao);
        let hit = 0;
        for (const w of kw) if (descMat.includes(w)) hit++;
        if (!hit) return 0;

        let score = (hit / kw.length) * 100;

        // Código do fabricante citado na descrição é evidência forte.
        const cf = this._norm(m.codigoFabricante);
        if (cf && cf.length >= 4 && descItem.includes(cf)) score += 60;

        // Fabricante/marca compatível.
        const fab = this._norm(item.fabricante);
        if (fab) {
            const alvo = this._norm(m.fabricante) + ' ' + this._norm(m.grupoSiemens);
            if (alvo.includes(fab)) score += 25;
        }
        return Math.round(score * 10) / 10;
    },

    _parear(item, idx) {
        const cod = this._norm(item.codigo);
        if (cod) {
            const hits = idx.porCodigo.get(cod);
            if (hits && hits.length === 1) {
                return { material: idx.materiais[hits[0]], confianca: 1, duplicados: 0, score: 100 };
            }
            if (hits && hits.length > 1) {
                // Códigos duplicados no catálogo — não é "exato", o usuário confirma.
                return { material: idx.materiais[hits[0]], confianca: 0.9, duplicados: hits.length, score: 90 };
            }
        }

        const cands = this._candidatos(item, idx);
        let melhor = -1, melhorScore = 0;
        for (const i of cands) {
            const s = this._score(item, idx.materiais[i]);
            if (s > melhorScore) { melhorScore = s; melhor = i; }
        }
        if (melhor >= 0 && melhorScore >= CP_LIMIAR) {
            return { material: idx.materiais[melhor], confianca: Math.min(0.95, melhorScore / 100), duplicados: 0, score: melhorScore };
        }
        return { material: null, confianca: 0, duplicados: 0, score: melhorScore };
    },

    parearTodos() {
        if (!this._staging) return;
        for (const item of this._staging.itens) {
            Object.assign(item, this._calcPareamento(item));
        }
    },

    /* Calcula os campos de vínculo de UM item contra o catálogo.
       Retorna um objeto novo — não muta o estado do store. */
    _calcPareamento(item) {
        const r = this._parear(item, this._catalogo());
        return {
            material_id: r.material ? r.material.id : '',
            nao_cadastrado: r.material ? 0 : 1,
            match_confianca: r.confianca,
            custo_catalogo: r.material ? (parseFloat(r.material.custo) || 0) : 0,
            lead_time_catalogo: r.material ? (parseFloat(r.material.leadTime) || 0) : 0,
            _duplicados: r.duplicados || 0,
            _score: r.score || 0
        };
    },

    /* Os itens só podem ser editados enquanto a requisição está em conferência. */
    _podeEditarItens() {
        if (this.viewMode === 'nova') return !!this._staging;
        const r = this._req(this.activeId);
        return !!r && (r.status === 'rascunho' || r.status === 'em_conferencia');
    },

    /* Edição inline na grade de conferência: código (re-pareia), qtd e unidade.
       Corrigir a planilha aqui evita reenviar o arquivo inteiro. */
    async setItemCampo(idx, campo, valor) {
        const bruto = valor === null || valor === undefined ? '' : String(valor);

        if (this.viewMode === 'nova') {
            const it = (this._staging && this._staging.itens[idx]) || null;
            if (!it) return;
            if (campo === 'qtd') it.qtd = Math.max(0, this._num(bruto));
            else if (campo === 'codigo') { it.codigo = bruto.trim(); Object.assign(it, this._calcPareamento(it)); }
            else it[campo] = bruto.trim();
            this.renderNova();
            return;
        }

        const item = this._itensAtuais()[idx];
        if (!item) return;

        const dados = {};
        if (campo === 'qtd') {
            dados.qtd = Math.max(0, this._num(bruto));
        } else if (campo === 'codigo') {
            const calc = this._calcPareamento({ ...item, codigo: bruto.trim() });
            Object.assign(dados, { codigo: bruto.trim() }, {
                material_id: calc.material_id,
                nao_cadastrado: calc.nao_cadastrado,
                match_confianca: calc.match_confianca,
                custo_catalogo: calc.custo_catalogo,
                lead_time_catalogo: calc.lead_time_catalogo
            });
        } else {
            dados[campo] = bruto.trim();
        }

        this._seeding = true;
        await store.updateComprasRequisicaoItens(item.id, dados);
        this._seeding = false;
        this.renderDetail();
        this.updateBadge();
    },

    /* Deriva o estado de exibição do item a partir dos campos persistidos.
       match_confianca: 1 = código exato | (0,1) = sugestão textual | 2 = vínculo manual */
    _estado(item) {
        if (!item || !item.material_id || item.nao_cadastrado) return 'nao_cadastrado';
        const c = parseFloat(item.match_confianca) || 0;
        if (c >= 2) return 'manual';
        if (c >= 0.999) return 'exato';
        return 'sugestao';
    },

    _resumo(itens) {
        const r = { total: itens.length, exato: 0, sugestao: 0, manual: 0, naoCadastrado: 0, semQtd: 0, semUnidade: 0, estimado: 0, duplicados: [] };
        for (const i of itens) {
            const est = this._estado(i);
            r[est === 'nao_cadastrado' ? 'naoCadastrado' : est]++;
            if (!(parseFloat(i.qtd) > 0)) r.semQtd++;
            if (!(i.unidade || '').trim()) r.semUnidade++;
            r.estimado += (parseFloat(i.qtd) || 0) * (parseFloat(i.custo_catalogo) || 0);
            if (i.material_id && est !== 'nao_cadastrado') r.duplicados.push(i.material_id);
        }
        return r;
    },

    /* ================================================================
       CONFERÊNCIA — BANNER, LEGENDA E GRID
       ================================================================ */

    _bannerHTML(res) {
        if (res.total === 0) return '';
        if (res.naoCadastrado > 0) {
            return `
            <div class="cp-banner err">
                <i class="ph ph-warning-octagon"></i>
                <div>
                    <b>${res.total} itens</b> — ${res.exato} casado(s), ${res.sugestao + res.manual} sugestão(ões),
                    <b>${res.naoCadastrado} não cadastrado(s) no Banco de Materiais</b>.
                    A requisição não pode ser liberada até resolver ${res.naoCadastrado === 1 ? 'este item' : 'estes itens'}.
                </div>
                <div class="cp-banner-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.compras.irParaPendente()">
                        <i class="ph ph-crosshair"></i> Ir para pendência
                    </button>
                </div>
            </div>`;
        }
        if (res.semQtd > 0 || res.semUnidade > 0) {
            const faltas = [];
            if (res.semQtd) faltas.push(`<b>${res.semQtd}</b> item(ns) sem quantidade maior que zero`);
            if (res.semUnidade) faltas.push(`<b>${res.semUnidade}</b> item(ns) sem unidade`);
            return `
            <div class="cp-banner warn">
                <i class="ph ph-warning"></i>
                <div>Todos os itens têm correspondência no catálogo, mas ainda há pendências: ${faltas.join(' e ')}.</div>
            </div>`;
        }
        return `
            <div class="cp-banner ok">
                <i class="ph ph-check-circle"></i>
                <div>
                    <b>${res.total} itens conferidos</b> — todos vinculados ao Banco de Materiais, com quantidade e unidade preenchidas.
                    Requisição pronta para ser liberada a compras.
                </div>
            </div>`;
    },

    _legendaHTML(res) {
        return `
            <div class="cp-legend">
                <span class="cp-leg"><span class="cp-dot exato"></span> Casado por código <span class="cp-legend-count">${res.exato}</span></span>
                <span class="cp-leg"><span class="cp-dot sugestao"></span> Sugestão a confirmar <span class="cp-legend-count">${res.sugestao}</span></span>
                <span class="cp-leg"><span class="cp-dot manual"></span> Vinculado manualmente <span class="cp-legend-count">${res.manual}</span></span>
                <span class="cp-leg"><span class="cp-dot nao_cadastrado"></span> Não cadastrado <span class="cp-legend-count">${res.naoCadastrado}</span></span>
                <span class="cp-legend-count" style="margin-left:auto;">Estimado: <b>${window.app.formatCurrency(res.estimado)}</b></span>
            </div>`;
    },

    _conferenciaHTML(itens, res) {
        const nomeMat = this._nomeMaterialMap();
        const dupMap = this._duplicidades();
        const podeRemover = store.canDelete();
        const podeEditar = this._podeEditarItens();
        const idxCat = this._catalogo();
        const podeRemoverLinha = podeRemover && this.viewMode === 'nova';

        return `
            <div class="cp-conf-wrap">
                <div class="cp-conf-scroll cp-conf">
                    <table>
                        <thead>
                            <tr>
                                <th class="cp-conf-num">#</th>
                                <th style="width:180px">Situação</th>
                                <th style="width:130px">Código (LM)</th>
                                <th>Descrição (LM) / Item do catálogo</th>
                                <th style="width:110px">Fabricante</th>
                                <th style="width:88px">Unid.</th>
                                <th style="width:90px;text-align:right">Qtd</th>
                                <th style="width:110px;text-align:right">Custo Catálogo</th>
                                <th style="width:170px;text-align:right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itens.map((it, i) => {
                                const est = this._estado(it);
                                const mat = it.material_id ? nomeMat.get(it.material_id) : null;
                                const dup = it.material_id ? dupMap.get(it.material_id) : null;
                                const dupCod = it.codigo ? (idxCat.porCodigo.get(this._norm(it.codigo)) || []).length : 0;
                                const inpCod = `<input type="text" class="form-control" style="padding:4px 7px;font-size:12px;font-weight:700;"
                                    value="${this._esc(it.codigo)}" onchange="app.compras.setItemCampo(${i},'codigo',this.value)">`;
                                const inpUni = `<input type="text" class="form-control" style="padding:4px 6px;font-size:12px;text-align:center;"
                                    value="${this._esc(it.unidade)}" placeholder="—" onchange="app.compras.setItemCampo(${i},'unidade',this.value)">`;
                                const inpQtd = `<input type="number" min="0" step="any" class="form-control" style="padding:4px 6px;font-size:12px;text-align:right;"
                                    value="${parseFloat(it.qtd) || 0}" onchange="app.compras.setItemCampo(${i},'qtd',this.value)">`;
                                return `
                                <tr class="cp-row-${est}">
                                    <td class="cp-conf-num">${it.ordem || (i + 1)}</td>
                                    <td>${this._estadoBadge(it, est)}</td>
                                    <td>${podeEditar ? inpCod : `<span class="cp-codigo">${this._esc(it.codigo) || '—'}</span>`}</td>
                                    <td>
                                        <div class="cp-titulo">${this._esc(it.descricao)}</div>
                                        ${mat ? `
                                            <div class="cp-link">
                                                <i class="ph ph-link-simple"></i>
                                                <b>${this._esc(mat.codigoInterno || mat.codigoFabricante || mat.id.slice(0, 8))}</b>
                                                <span>${this._esc(mat.descricao)}</span>
                                                ${dupCod > 1 ? `<span class="cp-dup" title="Este código existe ${dupCod} vezes no catálogo">${dupCod} códigos iguais</span>` : ''}
                                                ${dup ? `<span class="cp-dup" title="Este material já está em outras requisições abertas">também em ${dup.map(c => this._esc(c)).join(', ')}</span>` : ''}
                                            </div>` : `
                                            <div class="cp-link" style="color:#dc2626;">
                                                <i class="ph ph-warning-octagon"></i>
                                                <span>Sem correspondência no Banco de Materiais</span>
                                            </div>`}
                                    </td>
                                    <td class="cp-datas">${this._esc(it.fabricante) || '—'}</td>
                                    <td>${podeEditar ? inpUni : (this._esc(it.unidade) || '—')}</td>
                                    <td class="cp-conf-qtd">${podeEditar ? inpQtd : this._fmtQtd(it.qtd)}</td>
                                    <td class="cp-conf-custo">${it.material_id ? window.app.formatCurrency(it.custo_catalogo || 0) : '—'}</td>
                                    <td class="cp-conf-actions">
                                        <button class="cp-primary" onclick="app.compras.openMaterialModal(${i})" title="${est === 'exato' ? 'Trocar vínculo' : 'Vincular / cadastrar material'}">
                                            <i class="ph ${est === 'nao_cadastrado' ? 'ph-plus-circle' : 'ph-link-simple'}"></i>
                                            ${est === 'nao_cadastrado' ? 'Cadastrar' : (est === 'sugestao' ? 'Confirmar' : 'Trocar')}
                                        </button>
                                        ${podeRemoverLinha ? `<button class="cp-danger" onclick="app.compras.removerItem(${i})" title="Remover item da LM"><i class="ph ph-trash"></i></button>` : ''}
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    _estadoBadge(it, est) {
        if (est === 'exato') return `<span class="cp-st exato"><i class="ph ph-check-circle"></i> Casado</span>`;
        if (est === 'sugestao') return `<span class="cp-st sugestao"><i class="ph ph-question"></i> Sugestão</span>`;
        if (est === 'manual') return `<span class="cp-st manual"><i class="ph ph-link-simple"></i> Vinculado</span>`;
        return `<span class="cp-st nao_cadastrado"><i class="ph ph-warning-octagon cp-alert-ico"></i> Não cadastrado</span>`;
    },

    _nomeMaterialMap() {
        const map = new Map();
        for (const m of (store.getState().materiais || [])) map.set(m.id, m);
        return map;
    },

    /* Materiais já presentes em OUTRAS requisições abertas — alerta de compra duplicada. */
    _duplicidades(excludeReqId) {
        const state = store.getState();
        const abertas = (state.comprasRequisicoes || [])
            .filter(r => r.id !== excludeReqId && CP_ABERTAS.includes(r.status));
        const porId = new Map(abertas.map(r => [r.id, r.codigo]));
        const mapa = new Map();
        for (const it of (state.comprasRequisicaoItens || [])) {
            if (!it.material_id || !porId.has(it.requisicao_id)) continue;
            if (!mapa.has(it.material_id)) mapa.set(it.material_id, []);
            const cod = porId.get(it.requisicao_id);
            if (!mapa.get(it.material_id).includes(cod)) mapa.get(it.material_id).push(cod);
        }
        return mapa;
    },

    irParaPendente() {
        const itens = this._itensAtuais();
        const idx = itens.findIndex(i => !i.material_id || i.nao_cadastrado);
        if (idx >= 0) this.openMaterialModal(idx);
        else window.app.toast('Nenhuma pendência encontrada.', 'info');
    },

    removerItem(idx) {
        if (this.viewMode === 'nova') {
            this._staging.itens.splice(idx, 1);
            this._staging.itens.forEach((it, i) => { it.ordem = i + 1; });
            this.renderNova();
            return;
        }
        const item = this._itensAtuais()[idx];
        if (!item) return;
        window.app.confirm('Remover este item da requisição?').then(async (ok) => {
            if (!ok) return;
            this._seeding = true;
            await store.deleteComprasRequisicaoItens(item.id);
            this._seeding = false;
            this.renderDetail();
            this.updateBadge();
        });
    },

    /* ================================================================
       MODAL — VINCULAR / CADASTRAR MATERIAL
       ================================================================ */

    openMaterialModal(idx) {
        const item = this._itensAtuais()[idx];
        if (!item) return;
        const est = this._estado(item);
        const sugestao = (est === 'sugestao' || est === 'exato' || est === 'manual') && item.material_id
            ? (this._nomeMaterialMap().get(item.material_id) || null)
            : null;
        const sugScore = Math.round((parseFloat(item.match_confianca) || 0) * 100);
        const dupCod = item.codigo ? (this._catalogo().porCodigo.get(this._norm(item.codigo)) || []).length : 0;

        this._matModal = { idx, sugestao };
        document.querySelectorAll('.cp-modal-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'cp-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="cp-modal">
                <div class="cp-modal-head">
                    <div>
                        <h3><i class="ph ph-link-simple"></i> Vincular material</h3>
                        <div class="cp-modal-sub">Item ${item.ordem || (idx + 1)} da LM — pareamento contra o Banco de Materiais</div>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.cp-modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="cp-modal-body">
                    <div class="cp-cat-hint">
                        <b>LM:</b> ${this._esc(item.codigo) || 'sem código'} — ${this._esc(item.descricao)}
                        ${item.fabricante ? ' · ' + this._esc(item.fabricante) : ''}
                        ${item.unidade ? ' · ' + this._fmtQtd(item.qtd) + ' ' + this._esc(item.unidade) : ''}
                    </div>

                    ${sugestao ? `
                    <div class="cp-banner ${est === 'sugestao' ? 'warn' : 'ok'}" style="margin-bottom:14px;">
                        <i class="ph ${est === 'sugestao' ? 'ph-question' : 'ph-check-circle'}"></i>
                        <div>
                            <b>${est === 'sugestao' ? 'Sugestão do catálogo' : 'Vinculado atualmente'}:</b>
                            ${this._esc(sugestao.codigoInterno || sugestao.codigoFabricante || '')} —
                            ${this._esc(sugestao.descricao)}${dupCod > 1 ? ` (${dupCod} códigos iguais no catálogo)` : ''}
                            ${est === 'sugestao' && sugScore ? `<div style="font-size:11.5px;margin-top:3px;">Confiança: ${sugScore}%</div>` : ''}
                        </div>
                        <div class="cp-banner-actions">
                            <button class="btn btn-sm btn-primary" onclick="app.compras.vincularSugestao()">Usar este</button>
                        </div>
                    </div>` : `
                    <div class="cp-banner err" style="margin-bottom:14px;">
                        <i class="ph ph-warning-octagon"></i>
                        <div>Nenhuma correspondência foi encontrada no catálogo. Busque abaixo ou cadastre o material novo.</div>
                    </div>`}

                    <div class="cp-field">
                        <label>Buscar no catálogo por código ou descrição</label>
                        <input type="text" class="form-control" id="cp-cat-q" placeholder="Ex.: disjuntor 3VA / 3VA6116"
                               oninput="app.compras.buscaCatalogo(this.value)">
                    </div>
                    <div id="cp-cat-res">
                        <div class="cp-cat-hint">Digite ao menos 3 caracteres. O catálogo tem
                            <b>${(store.getState().materiais || []).length}</b> materiais.</div>
                    </div>

                    <div style="border-top:1px solid #eef0f3;margin:16px 0 14px;"></div>

                    <div class="cp-section-title" style="margin-top:0;">
                        <span class="cp-step">+</span> Cadastrar material novo
                        <span class="cp-hint">Campos pré-preenchidos a partir da LM</span>
                    </div>
                    <div class="cp-field-row-3">
                        <div class="cp-field"><label>Código Interno</label>
                            <input type="text" class="form-control" id="cp-m-codigo" value="${this._esc(item.codigo)}"></div>
                        <div class="cp-field"><label>Código Fabricante</label>
                            <input type="text" class="form-control" id="cp-m-codfab" value="${this._esc(item.codigoFabricante || '')}"></div>
                        <div class="cp-field"><label>Fabricante</label>
                            <input type="text" class="form-control" id="cp-m-fabricante" value="${this._esc(item.fabricante)}"></div>
                    </div>
                    <div class="cp-field"><label>Descrição *</label>
                        <input type="text" class="form-control" id="cp-m-descricao" value="${this._esc(item.descricao)}"></div>
                    <div class="cp-field-row-3">
                        <div class="cp-field"><label>Unidade</label>
                            <input type="text" class="form-control" id="cp-m-unidade" value="${this._esc(item.unidade)}"></div>
                        <div class="cp-field"><label>Custo (R$)</label>
                            <input type="number" step="0.01" min="0" class="form-control" id="cp-m-custo" value="${parseFloat(item.custo_catalogo) || 0}"></div>
                        <div class="cp-field"><label>Lead Time (dias)</label>
                            <input type="number" step="1" min="0" class="form-control" id="cp-m-lead" value="5"></div>
                    </div>
                    <div class="cp-field-row-3">
                        <div class="cp-field"><label>Categoria</label>
                            <input type="text" class="form-control" id="cp-m-categoria" placeholder="Ex.: Disjuntor"></div>
                        <div class="cp-field"><label>NCM</label>
                            <input type="text" class="form-control" id="cp-m-ncm" placeholder="8536.20.00"></div>
                        <div class="cp-field"><label>&nbsp;</label>
                            <button class="btn btn-primary" style="width:100%" onclick="app.compras.salvarMaterialNovo()">
                                <i class="ph ph-plus"></i> Cadastrar e vincular
                            </button></div>
                    </div>
                </div>
                <div class="cp-modal-foot">
                    <button class="btn btn-ghost" onclick="this.closest('.cp-modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    /* Preenche a lista de resultados do catálogo dentro do modal. */
    buscaCatalogo(q) {
        const box = document.getElementById('cp-cat-res');
        if (!box) return;
        const n = this._norm(q);
        if (n.length < 3) {
            box.innerHTML = `<div class="cp-cat-hint">Digite ao menos 3 caracteres. O catálogo tem
                <b>${(store.getState().materiais || []).length}</b> materiais.</div>`;
            return;
        }
        const toks = n.split(' ');
        const hits = [];
        for (const m of (store.getState().materiais || [])) {
            const cod = this._norm(m.codigoInterno) + ' ' + this._norm(m.codigoFabricante);
            const desc = this._norm(m.descricao);
            let score = 0, ok = true;
            for (const t of toks) {
                if (cod.includes(t)) score += 12;
                else if (desc.includes(t)) score += 6;
                else { ok = false; break; }
            }
            if (ok) hits.push({ m, score });
        }
        hits.sort((a, b) => b.score - a.score);
        const top = hits.slice(0, 12);

        if (!top.length) {
            box.innerHTML = `
                <div class="cp-banner err" style="margin-bottom:0;">
                    <i class="ph ph-magnifying-glass"></i>
                    <div>Nenhum material encontrado para "<b>${this._esc(q)}</b>". Cadastre o item abaixo.</div>
                </div>`;
            return;
        }
        box.innerHTML = `
            <div class="cp-table-wrap" style="max-height:220px;overflow:auto;">
                <table class="cp-table">
                    <thead><tr><th>Código</th><th>Descrição</th><th>Unid.</th><th style="text-align:right">Custo</th><th></th></tr></thead>
                    <tbody>
                        ${top.map(({ m }) => `
                        <tr>
                            <td class="cp-codigo">${this._esc(m.codigoInterno || m.codigoFabricante || '')}</td>
                            <td>
                                <div class="cp-titulo">${this._esc(m.descricao)}</div>
                                <div class="cp-sub">${this._esc(m.fabricante || '')}</div>
                            </td>
                            <td>${this._esc(m.unidade || '')}</td>
                            <td class="cp-valor">${window.app.formatCurrency(m.custo || 0)}</td>
                            <td class="cp-actions"><button class="btn btn-xs btn-primary" onclick="app.compras.vincularResultado('${m.id}')">Selecionar</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            ${hits.length > 12 ? `<div class="cp-sub" style="margin-top:6px;">${hits.length - 12} resultado(s) adicional(is) — refine a busca.</div>` : ''}`;
    },

    vincularSugestao() {
        const mm = this._matModal;
        if (!mm || !mm.sugestao) return;
        this._vincular(mm.idx, mm.sugestao);
        document.querySelectorAll('.cp-modal-overlay').forEach(el => el.remove());
    },

    vincularResultado(materialId) {
        const m = (store.getState().materiais || []).find(x => x.id === materialId);
        if (!m) return;
        this._vincular(this._matModal.idx, m);
        document.querySelectorAll('.cp-modal-overlay').forEach(el => el.remove());
    },

    async _vincular(idx, material) {
        if (!material) return;
        const dados = {
            material_id: material.id,
            nao_cadastrado: 0,
            match_confianca: 2, // vínculo explícito confirmado pelo usuário
            custo_catalogo: parseFloat(material.custo) || 0,
            lead_time_catalogo: parseFloat(material.leadTime) || 0
        };
        if (this.viewMode === 'nova') {
            const it = this._staging.itens[idx];
            if (!it) return;
            Object.assign(it, dados);
            it._duplicados = 0;
            this.renderNova();
        } else {
            const item = this._itensAtuais()[idx];
            if (!item) return;
            this._seeding = true;
            await store.updateComprasRequisicaoItens(item.id, dados);
            this._seeding = false;
            this.renderDetail();
        }
        this.updateBadge();
        window.app.toast(`Item vinculado a "${material.descricao}".`, 'success');
    },

    async salvarMaterialNovo() {
        const v = (id) => (document.getElementById(id) || {}).value || '';
        const descricao = v('cp-m-descricao').trim();
        if (!descricao) {
            window.app.toast('A Descrição é obrigatória.', 'error');
            return;
        }
        const codigoInterno = v('cp-m-codigo').trim();
        const codigoFabricante = v('cp-m-codfab').trim();
        if (codigoInterno && store.isCodeDuplicate(codigoInterno)) {
            window.app.toast(`Código Interno "${codigoInterno}" já existe em outro material.`, 'error');
            return;
        }
        if (codigoFabricante && store.isCodeDuplicate(codigoFabricante)) {
            window.app.toast(`Código do Fabricante "${codigoFabricante}" já existe em outro material.`, 'error');
            return;
        }

        const novo = {
            codigoInterno,
            codigoFabricante,
            fabricante: v('cp-m-fabricante').trim(),
            descricao,
            unidade: v('cp-m-unidade').trim(),
            categoria: v('cp-m-categoria').trim(),
            ncm: v('cp-m-ncm').trim(),
            custo: this._num(v('cp-m-custo')),
            leadTime: this._num(v('cp-m-lead')) || 5,
            markup: 0,
            precoSugerido: '',
            peso: 0, tensao: '', corrente: '', modelo: '', origem: '', area: '',
            icms: 18, ipi: 10, pis: 1.65, cofins: 7.6,
            largura_mm: 0, altura_mm: 0, profundidade_mm: 0
        };

        const mm = this._matModal;
        if (!mm) return;
        const item = this._itensAtuais()[mm.idx];
        if (!item) return;
        // Se a LM já traz unidade, mantém a da requisição no vínculo.
        if (!novo.unidade && item.unidade) novo.unidade = item.unidade;

        this._seeding = true;
        const criado = await store.addMaterial(novo);
        this._seeding = false;
        if (!criado) {
            window.app.toast('Erro ao salvar o material. Verifique a conexão.', 'error');
            return;
        }
        this._invalidateIndice();
        document.querySelectorAll('.cp-modal-overlay').forEach(el => el.remove());
        await this._vincular(mm.idx, criado);
    },

    /* ================================================================
       SALVAR E LIBERAR
       ================================================================ */

    _validacoesLiberacao(itens) {
        const erros = [];
        if (!itens.length) erros.push('A requisição precisa de pelo menos 1 item.');
        const semQtd = itens.filter(i => !(parseFloat(i.qtd) > 0)).length;
        if (semQtd) erros.push(`${semQtd} item(ns) com quantidade menor ou igual a zero.`);
        const semUn = itens.filter(i => !(i.unidade || '').trim()).length;
        if (semUn) erros.push(`${semUn} item(ns) sem unidade de medida.`);
        const naoCad = itens.filter(i => !i.material_id || i.nao_cadastrado).length;
        if (naoCad) erros.push(`${naoCad} item(ns) não cadastrado(s) no Banco de Materiais.`);
        return erros;
    },

    async salvarRequisicao(liberar) {
        const s = this._staging;
        if (!s) return;
        if (!s.itens.length) {
            window.app.toast('Envie o arquivo da LM antes de salvar.', 'error');
            return;
        }
        if (!s.titulo.trim()) {
            window.app.toast('Informe um título para a requisição.', 'error');
            return;
        }

        const erros = liberar ? this._validacoesLiberacao(s.itens) : [];
        if (erros.length) {
            this._loteErros = erros;
            this.renderNova();
            window.app.toast(erros[0], 'error');
            // Abre direto no primeiro item pendente — é o coração do alerta.
            this.irParaPendente();
            return;
        }
        this._loteErros = null;

        const now = new Date().toISOString();
        const user = (store.getState().auth && store.getState().auth.user) || {};
        const resumo = this._resumo(s.itens);

        const payload = {
            id: s.id,
            codigo: this._nextCodigo(store.getState().comprasRequisicoes || []),
            projeto_id: s.projeto_id || '',
            origem: 'upload',
            titulo: s.titulo.trim(),
            solicitante: s.solicitante.trim(),
            revisao: s.revisao.trim(),
            arquivo_nome: s.arquivo ? s.arquivo.nome : '',
            arquivo_path: '',
            arquivo_hash: s.arquivo ? s.arquivo.hash : '',
            data_lm: s.data_lm || '',
            data_requisicao: now.slice(0, 10),
            data_liberacao: liberar ? now : '',
            liberada_por: liberar ? (user.name || user.email || '') : '',
            status: liberar ? 'liberada' : 'em_conferencia',
            total_estimado: Math.round(resumo.estimado * 100) / 100,
            total_real: 0,
            observacoes: s.observacoes || '',
            created_at: now,
            updated_at: now
        };

        this._seeding = true;
        const criado = await store.addComprasRequisicoes(payload);
        if (!criado) {
            this._seeding = false;
            window.app.toast('Erro ao salvar a requisição no servidor.', 'error');
            return;
        }

        // Anexo da LM em disco (documento versionado da requisição).
        let caminho = '';
        if (s.arquivo && s.arquivo.base64) {
            caminho = await this._uploadArquivo(criado.id, s.arquivo);
            if (caminho) await store.updateComprasRequisicoes(criado.id, { arquivo_path: caminho });
        }

        const itensPayload = s.itens.map((it, i) => this._itemPayload(it, criado.id, i + 1));
        const resultados = await this._emLote(itensPayload, (p) => store.addComprasRequisicaoItens(p), 10);
        this._seeding = false;

        const falhas = resultados.filter(r => !r).length;
        this._staging = null;
        this.viewMode = 'detail';
        this.activeId = criado.id;
        this.activeTab = 'itens';
        this.render();

        if (falhas) {
            window.app.toast(`${falhas} item(ns) não puderam ser gravados. Abra a requisição e confira.`, 'error');
        } else {
            window.app.toast(
                liberar
                    ? `Requisição ${criado.codigo} criada e liberada para compras.`
                    : `Requisição ${criado.codigo} salva como rascunho em conferência.`,
                'success'
            );
        }
        if (!caminho && s.arquivo && s.arquivo.base64) {
            window.app.toast('O arquivo da LM não pôde ser anexado — os itens foram preservados.', 'warning');
        }
    },

    _itemPayload(it, requisicaoId, ordem) {
        return {
            id: crypto.randomUUID(),
            requisicao_id: requisicaoId,
            ordem,
            material_id: it.material_id || '',
            nao_cadastrado: it.material_id ? 0 : 1,
            match_confianca: parseFloat(it.match_confianca) || 0,
            codigo: it.codigo || '',
            descricao: it.descricao || '',
            fabricante: it.fabricante || '',
            unidade: it.unidade || '',
            qtd: parseFloat(it.qtd) || 0,
            custo_catalogo: parseFloat(it.custo_catalogo) || 0,
            lead_time_catalogo: parseFloat(it.lead_time_catalogo) || 0,
            status: 'pendente',
            qtd_cotada: 0, qtd_pedida: 0, qtd_recebida: 0,
            observacoes: it.observacoes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    },

    /* Executa em lotes paralelos — 148 POSTs sequenciais levariam ~10s. */
    async _emLote(itens, fn, tam) {
        const out = [];
        for (let i = 0; i < itens.length; i += tam) {
            const parte = itens.slice(i, i + tam);
            const res = await Promise.all(parte.map(p => fn(p)));
            out.push(...res);
        }
        return out;
    },

    async _uploadArquivo(requisicaoId, arquivo) {
        try {
            const res = await fetch('/api/compras/lm/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${store.getState().auth ? store.getState().auth.token : ''}`
                },
                body: JSON.stringify({
                    requisicao_id: requisicaoId,
                    nome_arquivo: arquivo.nome,
                    tipo_arquivo: arquivo.tipo,
                    fileData: arquivo.base64
                })
            });
            if (!res.ok) return '';
            const data = await res.json();
            return data.success ? (data.caminho || '') : '';
        } catch (e) {
            console.error('[Compras] upload LM:', e);
            return '';
        }
    },

    _nextCodigo(requisicoes) {
        let max = 0;
        requisicoes.forEach(r => {
            const m = String(r.codigo || '').match(/(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'REQ-' + String(max + 1).padStart(4, '0');
    },

    abrirArquivo(requisicaoId) {
        const token = store.getState().auth ? store.getState().auth.token : '';
        fetch(`/api/compras/lm/arquivo?id=${encodeURIComponent(requisicaoId)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.ok ? r.blob() : Promise.reject(new Error('Arquivo não encontrado')))
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (this._req(requisicaoId) || {}).arquivo_nome || 'lm';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            })
            .catch(e => window.app.toast('Não foi possível baixar o arquivo: ' + e.message, 'error'));
    },

    /* ================================================================
       VIEW — DETALHE
       ================================================================ */

    renderDetail() {
        const container = document.getElementById('view-compras');
        if (!container) return;
        const r = this._req(this.activeId);
        if (!r) { this.backToList(); return; }

        const itens = this._itensDaRequisicao(r.id);
        const resumo = this._resumo(itens);
        const projetos = store.getState().projetos || [];
        const proj = projetos.find(p => p.id === r.projeto_id);
        const podeEditar = store.canEdit();
        const podeRemover = store.canDelete();
        const podeLiberar = podeEditar && (r.status === 'rascunho' || r.status === 'em_conferencia');
        const emConferencia = r.status === 'rascunho' || r.status === 'em_conferencia';

        container.innerHTML = `
            <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.backToList()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-clipboard-text"></i> ${this._esc(r.codigo)}
                                <span class="cp-badge ${this._esc(r.status)}" style="background:rgba(255,255,255,.16);color:#fff;">${CP_STATUS[r.status] || this._esc(r.status)}</span>
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">${this._esc(r.titulo) || 'Sem título'}${proj ? ' · ' + this._esc(proj.codigo || proj.projeto) : ''}</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        ${r.arquivo_nome ? `<button class="btn btn-sm btn-ghost" onclick="app.compras.abrirArquivo('${r.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Baixar o arquivo da LM"><i class="ph ph-download-simple"></i> Baixar LM</button>` : ''}
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.exportXLSX('${r.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-file-xls"></i> Exportar
                        </button>
                        ${podeLiberar ? `<button class="btn btn-sm btn-ghost" onclick="app.compras.liberarRequisicao('${r.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-check-circle"></i> Liberar para Compras
                        </button>` : ''}
                        ${podeEditar && r.status !== 'cancelada' && r.status !== 'recebida' ? `<button class="btn btn-sm btn-ghost" onclick="app.compras.cancelarRequisicao('${r.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Encerra a requisição sem gerar pedido">
                            <i class="ph ph-prohibit"></i> Cancelar
                        </button>` : ''}
                        ${podeRemover ? `<button class="btn btn-sm btn-ghost" onclick="app.compras.remove('${r.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-trash"></i> Excluir
                        </button>` : ''}
                    </div>
                </div>

                <div class="cp-body">
                    <div class="cp-detail-head">
                        <div class="cp-grid">
                            <div class="cp-info"><div class="cp-info-label">Projeto</div><div class="cp-info-value ${proj ? '' : 'cp-empty'}">${proj ? this._esc(proj.codigo || proj.projeto) : 'Sem vínculo'}</div></div>
                            <div class="cp-info"><div class="cp-info-label">Revisão da LM</div><div class="cp-info-value ${r.revisao ? '' : 'cp-empty'}">${this._esc(r.revisao) || '—'}</div></div>
                            <div class="cp-info"><div class="cp-info-label">Solicitante</div><div class="cp-info-value ${r.solicitante ? '' : 'cp-empty'}">${this._esc(r.solicitante) || '—'}</div></div>
                            <div class="cp-info"><div class="cp-info-label">Data da LM</div><div class="cp-info-value ${r.data_lm ? '' : 'cp-empty'}">${this._fmtDate(r.data_lm) || '—'}</div></div>
                            <div class="cp-info"><div class="cp-info-label">Data da Requisição</div><div class="cp-info-value ${r.data_requisicao ? '' : 'cp-empty'}">${this._fmtDate(r.data_requisicao) || '—'}</div></div>
                            <div class="cp-info"><div class="cp-info-label">Liberação</div>
                                <div class="cp-info-value ${r.data_liberacao ? '' : 'cp-empty'}">
                                    ${r.data_liberacao ? this._fmtDate(r.data_liberacao) + (r.liberada_por ? ' · ' + this._esc(r.liberada_por) : '') : 'Aguardando'}
                                </div></div>
                            <div class="cp-info"><div class="cp-info-label">Origem</div><div class="cp-info-value">${this._esc(CP_ORIGEM[r.origem] || r.origem || '—')}</div></div>
                            <div class="cp-info"><div class="cp-info-label">Arquivo da LM</div>
                                <div class="cp-info-value ${r.arquivo_nome ? '' : 'cp-empty'}" style="font-size:12.5px;">
                                    ${r.arquivo_nome ? `<i class="ph ph-paperclip"></i> ${this._esc(r.arquivo_nome)}` : 'Nenhum arquivo anexado'}
                                </div>
                                ${r.arquivo_hash ? `<div class="cp-sub" style="font-family:ui-monospace,monospace;margin-top:4px;">SHA-256 ${this._esc(r.arquivo_hash.slice(0, 20))}…</div>` : ''}
                            </div>
                            <div class="cp-info"><div class="cp-info-label">Valor Estimado</div><div class="cp-info-value">${window.app.formatCurrency(r.total_estimado || 0)}</div></div>
                        </div>
                    </div>

                    <div class="cp-tabs">
                        <button class="cp-tab ${this.activeTab === 'itens' ? 'active' : ''}" onclick="app.compras.switchTab('itens')">
                            <i class="ph ph-list-checks"></i> Itens
                            <span class="cp-tab-tag">${resumo.total}</span>
                            ${resumo.naoCadastrado ? `<span class="cp-tab-tag warn">${resumo.naoCadastrado} pendente(s)</span>` : ''}
                        </button>
                        <button class="cp-tab ${this.activeTab === 'resumo' ? 'active' : ''}" onclick="app.compras.switchTab('resumo')">
                            <i class="ph ph-chart-bar"></i> Resumo
                        </button>
                    </div>

                    ${this.activeTab === 'itens'
                        ? this._detalheItensHTML(r, itens, resumo, emConferencia)
                        : this._detalheResumoHTML(r, itens, resumo)}
                </div>
            </div>
        `;
    },

    _detalheItensHTML(r, itens, resumo, emConferencia) {
        if (!itens.length) {
            return `<div class="cp-empty-state"><i class="ph ph-clipboard-text"></i><h3>Sem itens</h3><p>Esta requisição não contém itens.</p></div>`;
        }
        return `
            ${emConferencia ? this._bannerHTML(resumo) : ''}
            ${this._legendaHTML(resumo)}
            ${this._conferenciaHTML(itens, resumo)}
        `;
    },

    _detalheResumoHTML(r, itens, resumo) {
        const dupMap = this._duplicidades(r.id);
        const materiais = this._nomeMaterialMap();
        const pendentes = itens.filter(i => !i.material_id || i.nao_cadastrado);
        const usados = new Set(itens.map(i => i.material_id).filter(Boolean));
        let emOutras = 0;
        usados.forEach(id => { if (dupMap.has(id)) emOutras++; });

        return `
            <div class="cp-summary">
                <div class="cp-card"><div class="cp-card-value">${resumo.total}</div><div class="cp-card-label">Itens na LM</div></div>
                <div class="cp-card ${resumo.naoCadastrado ? 'alert' : ''}"><div class="cp-card-value">${resumo.naoCadastrado}</div><div class="cp-card-label">Não Cadastrados</div></div>
                <div class="cp-card"><div class="cp-card-value">${resumo.exato + resumo.manual}</div><div class="cp-card-label">Vinculados</div></div>
                <div class="cp-card"><div class="cp-card-value">${window.app.formatCurrency(resumo.estimado)}</div><div class="cp-card-label">Valor Estimado</div></div>
            </div>

            ${pendentes.length ? `
            <div class="cp-banner err">
                <i class="ph ph-warning-octagon"></i>
                <div>
                    <b>${pendentes.length} item(ns) ainda sem correspondência</b> no Banco de Materiais.
                    <div style="margin-top:6px;">
                        ${pendentes.slice(0, 8).map(p => `• <b>${this._esc(p.codigo) || 's/ código'}</b> — ${this._esc(p.descricao)}`).join('<br>')}
                        ${pendentes.length > 8 ? `<br>… e mais ${pendentes.length - 8}` : ''}
                    </div>
                </div>
                <div class="cp-banner-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.compras.switchTab('itens')"><i class="ph ph-list-checks"></i> Ir para a conferência</button>
                </div>
            </div>` : ''}

            ${emOutras ? `
            <div class="cp-banner warn">
                <i class="ph ph-warning"></i>
                <div><b>${emOutras} material(is)</b> desta requisição também aparecem em outras requisições ainda em aberto.
                Confira se não é uma compra duplicada.</div>
            </div>` : ''}

            <div class="cp-panel" style="margin-top:12px;">
                <div class="cp-section-title" style="margin-top:0;"><span class="cp-step">i</span> Situação dos itens</div>
                <div class="cp-table-wrap">
                    <table class="cp-table">
                        <thead><tr><th>Situação</th><th style="text-align:right">Itens</th><th style="text-align:right">Qtd total</th></tr></thead>
                        <tbody>
                            ${['exato', 'sugestao', 'manual', 'nao_cadastrado'].map(est => {
                                const grupo = itens.filter(i => this._estado(i) === est);
                                if (!grupo.length) return '';
                                const label = { exato: 'Casado por código', sugestao: 'Sugestão a confirmar', manual: 'Vinculado manualmente', nao_cadastrado: 'Não cadastrado' }[est];
                                const qtd = grupo.reduce((s, i) => s + (parseFloat(i.qtd) || 0), 0);
                                return `<tr><td>${this._estadoBadge(grupo[0], est)} <span style="margin-left:8px;">${label}</span></td>
                                        <td style="text-align:right;font-weight:700;">${grupo.length}</td>
                                        <td class="cp-valor">${this._fmtQtd(qtd)}</td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="cp-panel" style="margin-top:12px;">
                <div class="cp-section-title" style="margin-top:0;"><span class="cp-step">i</span> Materiais mais frequentes</div>
                <div class="cp-table-wrap">
                    <table class="cp-table">
                        <thead><tr><th>Código</th><th>Descrição</th><th style="text-align:right">Itens</th><th style="text-align:right">Qtd</th></tr></thead>
                        <tbody>
                            ${this._frequentes(itens, materiais)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    _frequentes(itens, materiais) {
        const agg = new Map();
        for (const i of itens) {
            const key = i.material_id || ('sem:' + (i.descricao || '').slice(0, 40));
            if (!agg.has(key)) agg.set(key, { qtd: 0, n: 0, item: i });
            const a = agg.get(key);
            a.n++;
            a.qtd += parseFloat(i.qtd) || 0;
        }
        const top = [...agg.values()].sort((a, b) => b.n - a.n).slice(0, 10);
        if (!top.length) return `<tr><td colspan="4" class="cp-sub">Sem dados.</td></tr>`;
        return top.map(({ qtd, n, item }) => {
            const m = item.material_id ? materiais.get(item.material_id) : null;
            return `
                <tr>
                    <td class="cp-codigo">${this._esc(m ? (m.codigoInterno || m.codigoFabricante || '') : (item.codigo || '—'))}</td>
                    <td>${this._esc(m ? m.descricao : item.descricao)}</td>
                    <td style="text-align:right;font-weight:700;">${n}</td>
                    <td class="cp-valor">${this._fmtQtd(qtd)} ${this._esc(m ? m.unidade : item.unidade) || ''}</td>
                </tr>`;
        }).join('');
    },

    /* ================================================================
       LIBERAR / CANCELAR / EXCLUIR
       ================================================================ */

    async liberarRequisicao(id) {
        const r = this._req(id);
        if (!r) return;
        const itens = this._itensDaRequisicao(id);
        const erros = this._validacoesLiberacao(itens);
        if (erros.length) {
            this.activeTab = 'itens';
            this.renderDetail();
            window.app.toast(erros[0], 'error');
            window.app.toast('Resolva as pendências na aba Itens.', 'info');
            return;
        }
        const ok = await window.app.confirm(
            `Liberar a requisição ${r.codigo} para compras? A partir daqui ela poderá ser cotada.`
        );
        if (!ok) return;

        const user = (store.getState().auth && store.getState().auth.user) || {};
        const agora = new Date().toISOString();
        const resumo = this._resumo(itens);
        this._seeding = true;
        const ok2 = await store.updateComprasRequisicoes(id, {
            status: 'liberada',
            data_liberacao: agora,
            liberada_por: user.name || user.email || '',
            total_estimado: Math.round(resumo.estimado * 100) / 100
        });
        this._seeding = false;
        this.renderDetail();
        if (ok2) window.app.toast(`Requisição ${r.codigo} liberada para compras.`, 'success');
        else window.app.toast('Erro ao liberar a requisição.', 'error');
    },

    async cancelarRequisicao(id) {
        const r = this._req(id);
        if (!r) return;
        const ok = await window.app.confirm(`Cancelar a requisição ${r.codigo}?`);
        if (!ok) return;
        this._seeding = true;
        await store.updateComprasRequisicoes(id, { status: 'cancelada' });
        this._seeding = false;
        this.render();
        window.app.toast(`Requisição ${r.codigo} cancelada.`, 'info');
    },

    async remove(id) {
        const r = this._req(id);
        if (!r) return;
        const ok = await window.app.confirm(
            `Excluir a requisição ${r.codigo}${r.titulo ? ' (' + r.titulo + ')' : ''}? Os itens também serão removidos.`
        );
        if (!ok) return;

        const itens = this._itensDaRequisicao(id);
        this._seeding = true;
        await this._emLote(itens, (it) => store.deleteComprasRequisicaoItens(it.id), 10);
        const okDel = await store.deleteComprasRequisicoes(id);
        this._seeding = false;

        if (!okDel) {
            window.app.toast('Erro ao excluir a requisição.', 'error');
            this.render();
            return;
        }
        window.app.toast(itens.length
            ? `Requisição excluída (junto com ${itens.length} item(ns)).`
            : 'Requisição excluída.', 'info');
        if (this.activeId === id) this.backToList();
        else this.render();
    },

    /* ================================================================
       TEMPLATE DA LM E EXPORT XLSX
       ================================================================ */

    baixarTemplateLM() {
        try {
            if (typeof XLSX === 'undefined') {
                window.app.toast('Biblioteca XLSX não disponível.', 'warning');
                return;
            }
            const ws = XLSX.utils.aoa_to_sheet([
                ['Código', 'Descrição', 'Fabricante', 'Unidade', 'Quantidade'],
                ['3VA6116-1', 'Disjuntor 3VA 160A 3P 50kA', 'Siemens', 'pc', 2],
                ['7KA1112-1', 'Contator 3RT 12A AC-3', 'Siemens', 'pc', 4],
                ['10201143', 'Borne duplo 4mm² 800V', 'Wago', 'pc', 50]
            ]);
            ws['!cols'] = [{ wch: 22 }, { wch: 44 }, { wch: 16 }, { wch: 12 }, { wch: 13 }];

            const headerStyle = {
                font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '4F46E5' } },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cell = ws[XLSX.utils.encode_cell({ c, r: 0 })];
                if (cell) {
                    if (cell.t === 's' && cell.v) cell.v = String(cell.v).toUpperCase();
                    cell.s = headerStyle;
                }
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'LM');
            XLSX.writeFile(wb, 'Template_LM_GeraPro.xlsx');
            window.app.toast('Template da LM baixado.', 'success');
        } catch (e) {
            console.error('[Compras] template LM:', e);
            window.app.toast('Erro ao gerar o template: ' + e.message, 'error');
        }
    },

    exportXLSX(requisicaoId) {
        const r = this._req(requisicaoId);
        if (!r) return;
        try {
            if (typeof XLSX === 'undefined') {
                window.app.toast('Biblioteca XLSX não disponível.', 'warning');
                return;
            }
            const itens = this._itensDaRequisicao(requisicaoId);
            const nomeMat = this._nomeMaterialMap();

            const linhas = itens.map(it => {
                const m = it.material_id ? nomeMat.get(it.material_id) : null;
                const est = this._estado(it);
                return {
                    '#': it.ordem || '',
                    'Situação': { exato: 'CASADO', sugestao: 'SUGESTÃO', manual: 'VINCULADO', nao_cadastrado: 'NÃO CADASTRADO' }[est],
                    'Código (LM)': it.codigo || '',
                    'Descrição (LM)': it.descricao || '',
                    'Fabricante (LM)': it.fabricante || '',
                    'Unidade': it.unidade || '',
                    'Quantidade': this._num(it.qtd),
                    'Código Catálogo': m ? (m.codigoInterno || m.codigoFabricante || '') : '',
                    'Descrição Catálogo': m ? m.descricao : '',
                    'Unid. Catálogo': m ? (m.unidade || '') : '',
                    'Custo Unit.': Math.round((parseFloat(it.custo_catalogo) || 0) * 100) / 100,
                    'Total': Math.round(((parseFloat(it.qtd) || 0) * (parseFloat(it.custo_catalogo) || 0)) * 100) / 100
                };
            });
            if (!linhas.length) {
                window.app.toast('Esta requisição não tem itens para exportar.', 'info');
                return;
            }

            const ws = XLSX.utils.json_to_sheet(linhas);
            const range = XLSX.utils.decode_range(ws['!ref']);
            const headerStyle = {
                font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '4F46E5' } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
            };
            const zebraStyle = { fill: { fgColor: { rgb: 'F3F4F6' } } };
            const moneyFmt = '#,##0.00';
            const alertStyle = { fill: { fgColor: { rgb: 'FEE2E2' } }, font: { color: { rgb: '991B1B' } } };

            for (let row = range.s.r; row <= range.e.r; row++) {
                const linha = linhas[row - range.s.r] || {};
                const ehAlerta = linha['Situação'] === 'NÃO CADASTRADO';
                for (let c = range.s.c; c <= range.e.c; c++) {
                    const addr = XLSX.utils.encode_cell({ c, r: row });
                    const cell = ws[addr];
                    if (!cell) continue;
                    let base;
                    if (row === 0) {
                        if (cell.t === 's' && cell.v) cell.v = String(cell.v).toUpperCase();
                        base = headerStyle;
                    } else if (ehAlerta) {
                        base = alertStyle;
                    } else {
                        base = row % 2 === 1 ? zebraStyle : null;
                    }
                    // xlsx-js-style lê numFmt de style.numFmt (dentro de cell.s);
                    // cell.z é ignorado quando a célula tem estilo.
                    if (typeof cell.v === 'number') {
                        cell.s = { ...(base || {}), numFmt: moneyFmt };
                    } else if (base) {
                        cell.s = base;
                    }
                }
            }
            ws['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 18 }, { wch: 44 }, { wch: 16 }, { wch: 9 },
                           { wch: 13 }, { wch: 18 }, { wch: 44 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Requisição');

            const nomeArquivo = `${String(r.codigo || 'REQ').replace(/[^\w-]/g, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            this._patchXlsxFreezePane(buf).then(patched => {
                const blob = new Blob([patched], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nomeArquivo;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                window.app.toast('Requisição exportada em XLSX.', 'success');
            }).catch(err => {
                console.error('[Compras] XLSX freeze patch error:', err);
                XLSX.writeFile(wb, nomeArquivo);
                window.app.toast('Requisição exportada em XLSX.', 'success');
            });
        } catch (e) {
            console.error('[Compras] export XLSX:', e);
            window.app.toast('Erro ao exportar: ' + e.message, 'error');
        }
    },

    /**
     * Injeta freeze pane (primeira linha congelada) num XLSX gerado pelo SheetJS.
     * Mesmo helper de projetos.js e crm.js — o xlsx-js-style não suporta !freeze
     * no write, então este post-processa o zip: descomprime as folhas, insere o
     * <pane> e reconstrói o zip.
     */
    async _patchXlsxFreezePane(arrayBuffer) {
        const orig = new Uint8Array(arrayBuffer);
        const dv = new DataView(orig.buffer);
        const entries = [];
        let pos = 0;
        while (pos < orig.length - 4) {
            if (dv.getUint32(pos, true) === 0x04034b50) {
                const method = dv.getUint16(pos + 8, true);
                const compSize = dv.getUint32(pos + 18, true);
                const nameLen = dv.getUint16(pos + 26, true);
                const extraLen = dv.getUint16(pos + 28, true);
                const nameStart = pos + 30;
                const name = new TextDecoder().decode(orig.slice(nameStart, nameStart + nameLen));
                const dataStart = nameStart + nameLen + extraLen;
                const data = orig.slice(dataStart, dataStart + compSize);
                let content;
                if (method === 8) {
                    const ds = new DecompressionStream('deflate-raw');
                    content = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer());
                } else {
                    content = data;
                }
                entries.push({ name, content });
                pos = dataStart + compSize;
            } else { pos++; }
        }
        let patched = false;
        for (const entry of entries) {
            if (/xl\/worksheets\/sheet\d+\.xml$/.test(entry.name)) {
                let xml = new TextDecoder().decode(entry.content);
                if (!xml.includes('<pane')) {
                    xml = xml.replace(
                        /<sheetView([^>]*)\/>/,
                        '<sheetView$1><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView>'
                    );
                    entry.content = new TextEncoder().encode(xml);
                    patched = true;
                }
            }
        }
        if (!patched) return arrayBuffer;
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
        const crc32 = (buf) => {
            let crc = 0xFFFFFFFF;
            for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
            return (crc ^ 0xFFFFFFFF) >>> 0;
        };
        const chunks = [], cdEntries = [];
        let offset = 0;
        for (const entry of entries) {
            const nameBytes = new TextEncoder().encode(entry.name);
            const crc = crc32(entry.content);
            const size = entry.content.length;
            const local = new Uint8Array(30 + nameBytes.length);
            const lv = new DataView(local.buffer);
            lv.setUint32(0, 0x04034b50, true);
            lv.setUint16(4, 20, true);
            lv.setUint16(8, 0, true);
            lv.setUint32(14, crc, true);
            lv.setUint32(18, size, true);
            lv.setUint32(22, size, true);
            lv.setUint16(26, nameBytes.length, true);
            local.set(nameBytes, 30);
            chunks.push(local, entry.content);
            const cd = new Uint8Array(46 + nameBytes.length);
            const cv = new DataView(cd.buffer);
            cv.setUint32(0, 0x02014b50, true);
            cv.setUint16(4, 20, true);
            cv.setUint16(6, 20, true);
            cv.setUint16(10, 0, true);
            cv.setUint32(16, crc, true);
            cv.setUint32(20, size, true);
            cv.setUint32(24, size, true);
            cv.setUint16(28, nameBytes.length, true);
            cv.setUint32(42, offset, true);
            cd.set(nameBytes, 46);
            cdEntries.push(cd);
            offset += local.length + size;
        }
        const cdTotal = cdEntries.reduce((s, e) => s + e.length, 0);
        const eocd = new Uint8Array(22);
        const ev = new DataView(eocd.buffer);
        ev.setUint32(0, 0x06054b50, true);
        ev.setUint16(8, entries.length, true);
        ev.setUint16(10, entries.length, true);
        ev.setUint32(12, cdTotal, true);
        ev.setUint32(16, offset, true);
        const all = [...chunks, ...cdEntries, eocd];
        const totalLen = all.reduce((s, c) => s + c.length, 0);
        const result = new Uint8Array(totalLen);
        let wp = 0;
        for (const c of all) { result.set(c, wp); wp += c.length; }
        return result.buffer;
    },

    /* ================================================================
       HELPERS
       ================================================================ */

    _fmtDate(v) {
        if (!v) return '';
        const s = String(v);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [y, m, d] = s.slice(0, 10).split('-');
            return `${d}/${m}/${y}`;
        }
        const dt = new Date(s);
        return isNaN(dt.getTime()) ? s : dt.toLocaleDateString('pt-BR');
    },

    _fmtQtd(v) {
        const n = parseFloat(v) || 0;
        return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
    },

    _esc(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

window.comprasModule = ComprasModule;
ComprasModule.init();
