import { store } from './state.js';

/* =====================================================================
   MÓDULO DE COMPRAS — GeraPro
   ---------------------------------------------------------------------
   Fase 0: esqueleto, wiring e ciclo de vida do módulo (lista/detalhe).
   Fase 1: ENTRADA DA LM — upload do arquivo da Engenharia, pareamento
           contra o Banco de Materiais, alerta de material não cadastrado
           e gate formal de "Liberar para Compras".
   Fase 2: COTAÇÕES — 1 requisição → N cotações (uma por fornecedor),
           matriz de comparação item × fornecedor, marcação de vencedor
           item a item, import da tabela de preços e campos de negociação.

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

/* Pontuação mínima para ACEITAR O VÍNCULO AUTOMÁTICO quando a descrição tem
   medida comparável (corrente/tensão/potência). É mais restritiva que o
   limiar de sugestão: se a medida divergir, o score cai abaixo daqui e o
   item fica NÃO CADASTRADO (alerta de cadastro) em vez de apontar para o
   material errado. Medida igual só dá ~55 pts sozinha; precisa do restante
   da descrição bater para fechar acima de 80. */
const CP_LIMIAR_SUGESTAO = 80;

/* Uma requisição aberta é deduplicada destas. */
const CP_ABERTAS = ['rascunho', 'em_conferencia', 'liberada', 'em_cotacao', 'em_pedido'];

/* Status da Cotação de preços junto a um fornecedor. */
const CP_COT_STATUS = {
    aberta: 'Aberta',
    enviada: 'Enviada',
    recebida: 'Recebida',
    vencedora: 'Vencedora',
    descartada: 'Descartada',
    cancelada: 'Cancelada'
};

/* Transições permitidas a partir de cada status da cotação. */
const CP_COT_TRANSICOES = {
    aberta: ['enviada', 'cancelada'],
    enviada: ['recebida', 'cancelada'],
    recebida: ['vencedora', 'descartada', 'enviada', 'cancelada'],
    vencedora: ['recebida', 'descartada'],
    descartada: ['recebida'],
    cancelada: []
};

/* Aliases de cabeçalho da TABELA DE PREÇOS do fornecedor.
   Template: Código | Descrição | Preço Unitário | Prazo (dias) */
const CP_PRECO_ALIASES = {
    codigo: CP_ALIASES.codigo,
    preco: ['preco', 'preco unitario', 'preco unit', 'preco de venda', 'valor',
            'valor unitario', 'valor unit', 'vl unit', 'vlr unit', 'custo',
            'custo unitario', 'unit price', 'price', 'vunit', 'tabela'],
    prazo: ['prazo', 'prazo entrega', 'prazo de entrega', 'entrega', 'lead time',
            'dias', 'dias uteis', 'leadtime'],
    ipi: ['ipi'], icms: ['icms'],
    // 'desc' NÃO pode estar aqui: a regra de prefixo faria 'desc' casar com
    // "Descrição" (que não é campo desta lista) e jogaria os dígitos da
    // descrição na coluna de desconto. 'desconto' cobre "Desc" por prefixo.
    desconto: ['desconto', 'desconto %', 'desc %', 'dsc', 'percentual desconto']
};

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
    activeCotacao: null,    // id da cotação aberta (viewMode === 'cotacao')
    cotSub: 'lista',        // sub-view da aba Cotações: 'lista' | 'comparar'
    _cotStaging: null,      // cotação em construção ({ cotacao, itens })
    _cotModal: null,        // { requisicao_id, usados:Set, sugeridos:Set }
    _cotAviso: null,        // retorno do último import de preços

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
            exportXLSX: this.exportXLSX.bind(this),
            novaCotacao: this.novaCotacao.bind(this),
            criarCotacao: this.criarCotacao.bind(this),
            trocarModalCot: this.trocarModalCot.bind(this),
            salvarFornecedorRapido: this.salvarFornecedorRapido.bind(this),
            fecharModalCot: this.fecharModalCot.bind(this),
            openCotacao: this.openCotacao.bind(this),
            voltarDaCotacao: this.voltarDaCotacao.bind(this),
            setCotCampo: this.setCotCampo.bind(this),
            setCotItemCampo: this.setCotItemCampo.bind(this),
            salvarCotacao: this.salvarCotacao.bind(this),
            mudarStatusCot: this.mudarStatusCot.bind(this),
            removerCotacao: this.removerCotacao.bind(this),
            importarPrecos: this.importarPrecos.bind(this),
            handleCotImportFile: this.handleCotImportFile.bind(this),
            baixarModeloPrecos: this.baixarModeloPrecos.bind(this),
            preencherCatalogo: this.preencherCatalogo.bind(this),
            marcarVencedor: this.marcarVencedor.bind(this),
            marcarMenorPreco: this.marcarMenorPreco.bind(this),
            alternarSubCot: this.alternarSubCot.bind(this)
        };

        store.subscribe((state) => {
            if (this._active && !this._seeding) {
                if (this.viewMode === 'nova') {
                    // staging próprio: não re-render, para não perder foco de digitação
                } else if (this.viewMode === 'cotacao' && this.activeCotacao) {
                    // staging própria da cotação; só reage se ela for removida
                    const existe = (state.comprasCotacoes || []).some(c => c.id === this.activeCotacao);
                    if (!existe) this.voltarDaCotacao();
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
        this.activeCotacao = null;
        this.cotSub = 'lista';
        this._cotStaging = null;
        this._cotModal = null;
        this._cotAviso = null;
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
        else if (this.viewMode === 'cotacao' && this._cotStaging) this.renderCotacao();
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
        this.activeCotacao = null;
        this._cotStaging = null;
        this.cotSub = 'lista';
        this.render();
    },

    switchTab(tab) {
        if (tab !== this.activeTab && tab === 'cotacoes') this.cotSub = 'lista';
        this.activeTab = tab;
        this.renderDetail();
    },

    /* Sub-view dentro da aba Cotações: lista de cotações × matriz de comparação. */
    alternarSubCot(sub) {
        this.cotSub = sub;
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

    /* Mapeia cabeçalhos da planilha para campos. Por padrão usa os aliases
       da LM; passe `aliases`/`campos` para reaproveitar em outros fluxos
       (ex.: a tabela de preços do fornecedor). */
    _mapearColunas(headers, aliases = CP_ALIASES, campos = ['codigo', 'descricao', 'fabricante', 'unidade', 'qtd']) {
        const mapa = {};
        headers.forEach((h) => {
            const n = this._norm(h);
            if (!n) return;
            for (const campo of campos) {
                if (mapa[campo] !== undefined) continue;
                const lista = aliases[campo] || [];
                if (lista.includes(n)) { mapa[campo] = h; break; }
                if (n.length >= 3 && lista.some(a => n.startsWith(a) || a.startsWith(n))) { mapa[campo] = h; break; }
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

    /* Extrai medidas comparáveis de um texto normalizado (LM ou catálogo):
       corrente em A, tensão em V e potência em kW/HP. É o que separa um
       "disjuntor 6A" de um "4A" — texto idêntico, especificação diferente.
       Só lê o que está ANTES da unidade (6A, 400V, 1,5kW), ignora códigos
       e números soltos como NH02 ou 60947-2. */
    _medidas(texto) {
        const s = ' ' + this._norm(texto) + ' ';
        const out = { amp: [], volt: [], kw: [] };
        const NUM = '(\\d+(?:[\\.,]\\d+)?)';
        const pares = (re, alvo) => {
            let m; while ((m = re.exec(s)) !== null) alvo.push(parseFloat(m[1].replace(',', '.')));
        };
        // Corrente: 6A vale; 5kA NÃO (precisa separar — "6A, ... 5kA" tem as
        // duas, e tratar kA como A faz 6A casar com 4A via o "5kA" comum).
        // Corrente: o "a" precisa vir COLADO no número (6a, 320a) — senão o
        // "disparo de 5 a 10 x In" de um disjuntor vira "5A" e casa com
        // qualquer 5A. E não pode ser "ka" (5kA é potência de curto-circuito).
        pares(new RegExp(NUM + 'a(?![a-z0-9])(?![k])', 'g'), out.amp);
        pares(new RegExp(NUM + '\\s*v(?![a-z0-9])', 'g'), out.volt);
        pares(new RegExp(NUM + '\\s*kw(?![a-z0-9])', 'g'), out.kw);
        // Corrente "real" (>=1A): descarta falso positivo como o "5 a 10 x In"
        // de um disjuntor, que viraria "5A" e casaria com qualquer 5A.
        out.amp = out.amp.filter(a => a >= 1);
        const hp = new RegExp(NUM + '\\s*(?:cv|hp)(?![a-z0-9])', 'g');
        let m; while ((m = hp.exec(s)) !== null) out.kw.push(parseFloat(m[1].replace(',', '.')) * 0.7457);
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

        // Medidas (corrente/tensão/potência): se AMBAS têm e divergem, o texto
        // é parecido mas a especificação é outra — penaliza pesado para não
        // vincular um material errado em silêncio. Se bate, reforça (o texto
        // sozinho pode ser genérico demais para passar do limiar).
        const mi = this._medidas(item.descricao), mm = this._medidas(m.descricao);
        const div = (a, b) => a.length && b.length && !a.some(x => b.some(y => Math.abs(x - y) < 0.001));
        if (div(mi.amp, mm.amp) || div(mi.volt, mm.volt) || div(mi.kw, mm.kw)) {
            score -= 45;
        } else if ((mi.amp.length && mm.amp.length && !div(mi.amp, mm.amp)) ||
                   (mi.volt.length && mm.volt.length && !div(mi.volt, mm.volt)) ||
                   (mi.kw.length && mm.kw.length && !div(mi.kw, mm.kw))) {
            score += 25;
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
            // Medida divergente (corrente/tensão/potência) zera o vínculo:
            // texto parecido, especificação outra. Vira NÃO CADASTRADO p/ alertar.
            const mi = this._medidas(item.descricao), mm = this._medidas(idx.materiais[melhor].descricao);
            const div = (a, b) => a.length && b.length && !a.some(x => b.some(y => Math.abs(x - y) < 0.001));
            if (div(mi.amp, mm.amp) || div(mi.volt, mm.volt) || div(mi.kw, mm.kw)) {
                return { material: null, confianca: 0, duplicados: 0, score: melhorScore };
            }
            const lim = mi.amp.length || mi.volt.length || mi.kw.length ? CP_LIMIAR_SUGESTAO : CP_LIMIAR;
            if (melhorScore >= lim) {
                return { material: idx.materiais[melhor], confianca: Math.min(0.95, melhorScore / 100), duplicados: 0, score: melhorScore };
            }
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
        const cotacoes = this._cotacoesDaRequisicao(r.id);

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
                        <button class="cp-tab ${this.activeTab === 'cotacoes' ? 'active' : ''}" onclick="app.compras.switchTab('cotacoes')">
                            <i class="ph ph-tag"></i> Cotações
                            <span class="cp-tab-tag">${cotacoes.length}</span>
                        </button>
                    </div>

                    ${this.activeTab === 'itens'
                        ? this._detalheItensHTML(r, itens, resumo, emConferencia)
                        : this.activeTab === 'cotacoes'
                            ? this._detalheCotacoesHTML(r, itens, cotacoes, podeEditar)
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

    /* ================================================================
       COTAÇÕES (Fase 2) — 1 requisição → N cotações, uma por fornecedor
       ----------------------------------------------------------------
       A cotação tem staging próprio (digitação sem re-render); a matriz
       de comparação lê o store, então só é aberta depois de salvar.
       ================================================================ */

    _cotacoesDaRequisicao(reqId) {
        return (store.getState().comprasCotacoes || [])
            .filter(c => c.requisicao_id === reqId)
            .sort((a, b) => String(a.numero || '').localeCompare(String(b.numero || '')));
    },

    _cotacao(id) {
        return (store.getState().comprasCotacoes || []).find(c => c.id === id) || null;
    },

    _itensDaCotacao(cotId) {
        return (store.getState().comprasCotacaoItens || []).filter(i => i.cotacao_id === cotId);
    },

    _fornecedor(id) {
        return (store.getState().fornecedores || []).find(f => f.id === id) || null;
    },

    _nomeFornecedor(f) {
        if (!f) return 'Fornecedor não identificado';
        return f.nomeFantasia || f.razaoSocial || 'Sem nome';
    },

    /* Fornecedores sugeridos vêm do HISTÓRICO (cotações vencedoras ou pedidos
       destes materiais) — nunca de cadastro manual, senão viraria circular. */
    _fornecedoresSugeridos(itens) {
        const matIds = new Set(itens.map(i => i.material_id).filter(Boolean));
        const cont = new Map();
        const inc = (fid) => { if (fid) cont.set(fid, (cont.get(fid) || 0) + 1); };

        (store.getState().comprasCotacoes || []).forEach(c => {
            if (c.status !== 'vencedora') return;
            this._itensDaCotacao(c.id).forEach(ci => {
                if ((ci.vencedor === 1 || ci.vencedor === '1') && matIds.has(ci.material_id)) inc(c.fornecedor_id);
            });
        });

        const pedidos = store.getState().comprasPedidos || [];
        const pIds = new Set((store.getState().comprasPedidoItens || [])
            .filter(pi => matIds.has(pi.material_id)).map(pi => pi.pedido_id));
        pedidos.forEach(p => { if (pIds.has(p.id)) inc(p.fornecedor_id); });

        return new Set([...cont.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]));
    },

    _nextCodigoCot(cotacoes) {
        let max = 0;
        cotacoes.forEach(c => {
            const m = String(c.numero || '').match(/(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'COT-' + String(max + 1).padStart(4, '0');
    },

    /* Total do item: Qtd × Unit × (1+IPI%) × (1−Desc%). ICMS é só referência —
       ele já vem embutido no preço de tabela do fornecedor.
       IPI e desconto são PERCENTUAIS 0–100: fora da faixa é erro de
       digitação/coluna e não pode nem inflar nem inverter o total. */
    _cotItemTotal(ci) {
        const qtd = parseFloat(ci.qtd) || 0;
        const unit = parseFloat(ci.custo_unitario) || 0;
        if (unit <= 0 || qtd <= 0) return 0;
        const faixa = v => Math.min(100, Math.max(0, parseFloat(v) || 0));
        const ipi = faixa(ci.ipi);
        const desc = faixa(ci.desconto);
        return qtd * unit * (1 + ipi / 100) * (1 - desc / 100);
    },

    _cotSomaItens() {
        const st = this._cotStaging;
        if (!st) return 0;
        return st.itens.reduce((s, ci) => s + this._cotItemTotal(ci), 0);
    },

    _cotGeral() {
        const st = this._cotStaging;
        if (!st) return 0;
        return this._cotSomaItens() + (parseFloat(st.cotacao.frete) || 0);
    },

    /* ------------------------------------------------------------
       ABA "COTAÇÕES" NO DETALHE DA REQUISIÇÃO
       ------------------------------------------------------------ */

    _detalheCotacoesHTML(r, itens, cotacoes, podeEditar) {
        if (r.status === 'rascunho' || r.status === 'em_conferencia') {
            return `
                <div class="cp-banner warn">
                    <i class="ph ph-lock"></i>
                    <div><b>Cotações bloqueadas.</b> Libere a requisição para compras antes de enviar pedidos de preço a fornecedores.</div>
                </div>
                ${cotacoes.length ? this._listaCotacoesHTML(cotacoes, false)
                                  : this._cotacoesVaziasHTML(false)}
            `;
        }
        if (!itens.length) {
            return `<div class="cp-empty-state"><i class="ph ph-tag"></i><h3>Sem itens</h3><p>Esta requisição não contém itens para cotar.</p></div>`;
        }

        const cotar = podeEditar && (r.status === 'liberada' || r.status === 'em_cotacao');
        const comparando = cotacoes.length > 0 && this.cotSub === 'comparar';

        return `
            <div class="cp-toolbar" style="justify-content:space-between;">
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <span style="font-size:12.5px;font-weight:700;color:#4b5563;">
                        <i class="ph ph-tag"></i> ${cotacoes.length} cotação(ões)
                    </span>
                    ${cotacoes.length ? `
                    <button class="btn btn-sm ${comparando ? 'btn-primary' : 'btn-ghost'}" onclick="app.compras.alternarSubCot('${comparando ? 'lista' : 'comparar'}')">
                        <i class="ph ph-squares-four"></i> ${comparando ? 'Voltar à lista' : 'Comparar preços'}
                    </button>` : ''}
                </div>
                ${cotar ? `
                <button class="btn btn-sm btn-primary" onclick="app.compras.novaCotacao('${r.id}')">
                    <i class="ph ph-plus"></i> Nova cotação
                </button>` : ''}
            </div>

            ${!cotar && cotacoes.length && r.status !== 'cancelada' ? `
            <div class="cp-cat-hint">A requisição está em <b>${this._esc(CP_STATUS[r.status] || r.status)}</b> — a leitura continua disponível, mas criar novas cotações exige Liberada/Em Cotação.</div>` : ''}

            ${!cotacoes.length
                ? this._cotacoesVaziasHTML(cotar)
                : comparando
                    ? this._matrizHTML(r, itens, cotacoes)
                    : this._listaCotacoesHTML(cotacoes, podeEditar)}
        `;
    },

    _cotacoesVaziasHTML(podeCriar) {
        return `
            <div class="cp-empty-state">
                <i class="ph ph-tag"></i>
                <h3>Nenhuma cotação ainda</h3>
                <p>Abra uma cotação por fornecedor e compare preço, prazo e condição de pagamento lado a lado antes de gerar o pedido.</p>
                ${podeCriar ? `<button class="btn btn-primary" style="margin-top:14px;" onclick="app.compras.novaCotacao('${this.activeId}')">
                    <i class="ph ph-plus"></i> Nova cotação
                </button>` : ''}
            </div>
        `;
    },

    _listaCotacoesHTML(cotacoes, podeEditar) {
        return `<div class="cp-cot-list">${cotacoes.map(c => {
            const f = this._fornecedor(c.fornecedor_id);
            const itensCot = this._itensDaCotacao(c.id);
            const cotados = itensCot.filter(i => parseFloat(i.custo_unitario) > 0).length;
            const vencendo = itensCot.filter(i => i.vencedor === 1 || i.vencedor === '1').length;
            return `
            <div class="cp-cot-card cp-cot-${this._esc(c.status)}">
                <div class="cp-cot-head">
                    <div style="min-width:0;">
                        <div class="cp-cot-numero">
                            ${this._esc(c.numero)}
                            <span class="cp-badge cp-badge-cot cp-cot-${this._esc(c.status)}">${this._esc(CP_COT_STATUS[c.status] || c.status)}</span>
                        </div>
                        <div class="cp-cot-forn">${this._esc(this._nomeFornecedor(f))}${f && f.cnpj ? ' · CNPJ ' + this._esc(f.cnpj) : ''}</div>
                    </div>
                    <div class="cp-cot-vals">
                        <div class="cp-cot-total">${window.app.formatCurrency(c.total || 0)}</div>
                        <div class="cp-sub">${cotados}/${itensCot.length} item(ns) com preço${vencendo ? ` · <b style="color:#15803d;">${vencendo} vencendo</b>` : ''}</div>
                    </div>
                </div>
                <div class="cp-cot-meta">
                    <span><i class="ph ph-clock"></i> ${this._esc(c.prazo_entrega) || 'Prazo —'}</span>
                    <span><i class="ph ph-calendar-check"></i> ${this._esc(c.condicao_pagamento) || 'Condição —'}</span>
                    <span><i class="ph ph-hourglass"></i> ${this._esc(c.validade_proposta) || 'Validade —'}</span>
                    <span><i class="ph ph-truck"></i> Frete ${window.app.formatCurrency(c.frete || 0)}</span>
                    ${c.data_resposta ? `<span><i class="ph ph-check-circle"></i> Resposta ${this._fmtDate(c.data_resposta)}</span>` : ''}
                </div>
                <div class="cp-cot-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.compras.openCotacao('${c.id}')">
                        <i class="ph ph-pencil-simple"></i> Abrir cotação
                    </button>
                    ${podeEditar && c.status !== 'cancelada' ? `
                    <button class="btn btn-sm btn-ghost" onclick="app.compras.removerCotacao('${c.id}')">
                        <i class="ph ph-trash"></i> Excluir
                    </button>` : ''}
                </div>
            </div>`;
        }).join('')}</div>`;
    },

    /* Matriz de comparação: itens × fornecedores, célula clicável para
       marcar o vencedor do item. */
    _matrizHTML(req, itens, cotacoes) {
        const cells = new Map();
        cotacoes.forEach(c => this._itensDaCotacao(c.id).forEach(ci => {
            if (!cells.has(ci.requisicao_item_id)) cells.set(ci.requisicao_item_id, new Map());
            cells.get(ci.requisicao_item_id).set(c.id, ci);
        }));

        const melhorTotal = new Map(), melhorPrazo = new Map(), vitorias = new Map();
        cotacoes.forEach(c => vitorias.set(c.id, 0));

        itens.forEach(it => {
            const row = cells.get(it.id);
            if (!row) return;
            let mt = null, mp = null;
            cotacoes.forEach(c => {
                const ci = row.get(c.id);
                if (!ci) return;
                const tot = this._cotItemTotal(ci);
                if (tot > 0 && (mt === null || tot < mt)) mt = tot;
                const pz = this._num(ci.prazo_entrega || c.prazo_entrega);
                if (pz > 0 && (mp === null || pz < mp)) mp = pz;
                if (ci.vencedor === 1 || ci.vencedor === '1') vitorias.set(c.id, (vitorias.get(c.id) || 0) + 1);
            });
            if (mt !== null) melhorTotal.set(it.id, mt);
            if (mp !== null) melhorPrazo.set(it.id, mp);
        });

        const algumPreco = itens.some(it => {
            const row = cells.get(it.id);
            return row && [...row.values()].some(ci => this._cotItemTotal(ci) > 0);
        });
        const lider = [...vitorias.entries()].sort((a, b) => b[1] - a[1])[0];

        return `
            <div class="cp-legend">
                <span class="cp-leg"><span class="cp-dot cp-dot-best"></span> Menor total do item</span>
                <span class="cp-leg"><span class="cp-dot cp-dot-prazo"></span> Menor prazo</span>
                <span class="cp-leg"><span class="cp-dot cp-dot-win"></span> Vencedor marcado</span>
                <span class="cp-leg" style="margin-left:auto;color:#8b919a;">Clique na célula para marcar o vencedor</span>
            </div>

            ${!algumPreco ? `
            <div class="cp-banner warn">
                <i class="ph ph-question"></i>
                <div><b>Nenhum preço informado ainda.</b> Abra cada cotação e lance os preços do fornecedor — ou importe a tabela de preços dele — antes de comparar.</div>
            </div>` : ''}

            <div class="cp-mat-actions">
                <button class="btn btn-sm btn-primary" onclick="app.compras.marcarMenorPreco('${req.id}')">
                    <i class="ph ph-lightning"></i> Marcar menor preço automaticamente
                </button>
            </div>

            <div class="cp-conf-wrap" style="margin-top:10px;">
                <div class="cp-conf-scroll">
                    <table class="cp-table cp-matriz">
                        <thead>
                            <tr>
                                <th class="cp-mat-item">Item da LM</th>
                                ${cotacoes.map(c => {
                                    const f = this._fornecedor(c.fornecedor_id);
                                    return `<th class="cp-mat-forn">
                                        <div class="cp-mat-forn-nome">${this._esc(this._nomeFornecedor(f))}</div>
                                        <div class="cp-mat-forn-sub">${this._esc(c.numero)}
                                            <span class="cp-badge cp-badge-cot cp-cot-${this._esc(c.status)}">${this._esc(CP_COT_STATUS[c.status] || c.status)}</span>
                                        </div>
                                    </th>`;
                                }).join('')}
                                <th class="cp-mat-win">Vencedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itens.map(it => {
                                const row = cells.get(it.id) || new Map();
                                const mt = melhorTotal.get(it.id);
                                const mp = melhorPrazo.get(it.id);
                                const venc = cotacoes.find(c => {
                                    const ci = row.get(c.id);
                                    return ci && (ci.vencedor === 1 || ci.vencedor === '1');
                                });
                                return `<tr>
                                    <td class="cp-mat-item">
                                        <div class="cp-codigo">${this._esc(it.codigo) || 'sem código'}</div>
                                        <div class="cp-mat-desc">${this._esc(it.descricao)}</div>
                                        <div class="cp-sub">${this._fmtQtd(it.qtd)} ${this._esc(it.unidade)}</div>
                                    </td>
                                    ${cotacoes.map(c => {
                                        const ci = row.get(c.id);
                                        if (!ci) return `<td class="cp-cell cp-cell-na">—</td>`;
                                        const tot = this._cotItemTotal(ci);
                                        const unit = parseFloat(ci.custo_unitario) || 0;
                                        const pz = this._num(ci.prazo_entrega || c.prazo_entrega);
                                        const best = tot > 0 && mt !== null && Math.abs(tot - mt) < 0.005;
                                        const pzBest = pz > 0 && mp !== null && pz === mp;
                                        const venceu = ci.vencedor === 1 || ci.vencedor === '1';
                                        const cls = ['cp-cell', tot > 0 ? '' : 'cp-cell-vazio',
                                                     best ? 'cp-cell-best' : '', pzBest ? 'cp-cell-pzbest' : '',
                                                     venceu ? 'cp-cell-win' : ''].filter(Boolean).join(' ');
                                        const nome = this._esc(this._nomeFornecedor(this._fornecedor(c.fornecedor_id)));
                                        return `<td class="${cls}" onclick="app.compras.marcarVencedor('${it.id}','${c.id}')"
                                              title="${nome} — ${window.app.formatCurrency(tot)}${pz ? ' · ' + pz + ' dias' : ''}">
                                            ${venceu ? '<span class="cp-cell-flag"><i class="ph ph-trophy"></i></span>' : ''}
                                            <div class="cp-cell-price">${tot > 0 ? window.app.formatCurrency(tot) : '<span class="cp-cell-none">sem preço</span>'}</div>
                                            ${unit > 0 ? `<div class="cp-cell-unit">${window.app.formatCurrency(unit)} / ${this._esc(it.unidade)}</div>` : ''}
                                            ${pz > 0 ? `<div class="cp-cell-pz${pzBest ? ' best' : ''}"><i class="ph ph-clock"></i> ${pz}d</div>` : ''}
                                        </td>`;
                                    }).join('')}
                                    <td class="cp-mat-win">${venc
                                        ? `<span class="cp-win-name">${this._esc(this._nomeFornecedor(this._fornecedor(venc.fornecedor_id)))}</span>`
                                        : '<span class="cp-cell-none">—</span>'}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td class="cp-mat-item"><b>Total da proposta</b><div class="cp-sub">itens + frete</div></td>
                                ${cotacoes.map(c => {
                                    const soma = this._itensDaCotacao(c.id).reduce((s, ci) => s + this._cotItemTotal(ci), 0) + (parseFloat(c.frete) || 0);
                                    return `<td class="cp-cell cp-cell-total${soma > 0 ? '' : ' cp-cell-vazio'}"><b>${soma > 0 ? window.app.formatCurrency(soma) : '—'}</b></td>`;
                                }).join('')}
                                <td class="cp-mat-win"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div class="cp-cat-hint" style="margin-top:12px;">
                <b>Total do item</b> = Qtd × Valor unitário × (1 + IPI%) × (1 − Desconto%). O ICMS aparece apenas como referência.
                ${lider && lider[1] ? `<br><b>Contagem de vitórias:</b> ${this._esc(this._nomeFornecedor(this._fornecedor(lider[0])))} vence ${lider[1]} de ${itens.length} item(ns).` : ''}
            </div>
        `;
    },

    /* ------------------------------------------------------------
       CRIAÇÃO DA COTAÇÃO
       ------------------------------------------------------------ */

    novaCotacao(requisicaoId) {
        const r = this._req(requisicaoId);
        if (!r) return;
        if (r.status !== 'liberada' && r.status !== 'em_cotacao') {
            window.app.toast('Libere a requisição para compras antes de criar cotações.', 'error');
            return;
        }
        const itens = this._itensDaRequisicao(requisicaoId);
        if (!itens.length) { window.app.toast('A requisição não tem itens para cotar.', 'error'); return; }

        this._cotModal = {
            requisicao_id: requisicaoId,
            usados: new Set(this._cotacoesDaRequisicao(requisicaoId).map(c => c.fornecedor_id)),
            sugeridos: this._fornecedoresSugeridos(itens),
            pre: ''
        };
        this._renderCotModal();
    },

    _renderCotModal() {
        const m = this._cotModal;
        if (!m) return;
        const r = this._req(m.requisicao_id);
        const fornecedores = (store.getState().fornecedores || [])
            .slice().sort((a, b) => this._nomeFornecedor(a).localeCompare(this._nomeFornecedor(b), 'pt-BR'));

        document.querySelectorAll('.cp-modal-overlay').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.className = 'cp-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) this.fecharModalCot(); };
        overlay.innerHTML = `
            <div class="cp-modal">
                <div class="cp-modal-head">
                    <div>
                        <h3><i class="ph ph-tag"></i> Nova cotação de preços</h3>
                        <div class="cp-modal-sub">${this._esc(r ? r.codigo : '')} · ${fornecedores.length} fornecedor(es) cadastrado(s)</div>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="app.compras.fecharModalCot()"><i class="ph ph-x"></i></button>
                </div>
                <div class="cp-modal-body">
                    ${fornecedores.length === 0 ? `
                    <div class="cp-banner warn">
                        <i class="ph ph-question"></i>
                        <div><b>Nenhum fornecedor cadastrado.</b> Cadastre o primeiro para começar a cotar.</div>
                    </div>` : `
                    <div class="cp-field"><label>Fornecedor <span style="color:#dc2626;">*</span></label>
                        <select id="cp-cot-fornecedor" class="form-control">
                            <option value="">— Selecione —</option>
                            ${fornecedores.map(f => {
                                const usado = m.usados.has(f.id);
                                const rotulo = this._nomeFornecedor(f) + (f.cnpj ? ' · ' + f.cnpj : '') +
                                    (usado ? ' — já cotado nesta requisição' : '') + (m.sugeridos.has(f.id) ? ' ✓ histórico' : '');
                                return `<option value="${f.id}"${m.pre === f.id ? ' selected' : ''}${usado ? ' disabled' : ''}>${this._esc(rotulo)}</option>`;
                            }).join('')}
                        </select>
                        ${m.sugeridos.size ? `<div class="cp-sub" style="margin-top:6px;"><i class="ph ph-lightning"></i> Já compraram/cotaram estes materiais.</div>` : ''}
                    </div>`}

                    <div class="cp-field-row-3">
                        <div class="cp-field"><label>Prazo de entrega</label>
                            <input type="text" class="form-control" id="cp-cot-prazo" placeholder="Ex.: 15 dias"></div>
                        <div class="cp-field"><label>Condição de pagamento</label>
                            <input type="text" class="form-control" id="cp-cot-condicao" placeholder="Ex.: 30/60 dias"></div>
                        <div class="cp-field"><label>Validade da proposta</label>
                            <input type="text" class="form-control" id="cp-cot-validade" placeholder="Ex.: 15 dias"></div>
                    </div>

                    <div class="cp-cat-hint" style="margin-top:16px;margin-bottom:0;">
                        Será criada <b>uma cotação para este fornecedor</b>, com ${this._itensDaRequisicao(m.requisicao_id).length} item(ns)
                        já vinculados. Os preços entram na própria cotação, por import ou manualmente.
                    </div>
                </div>
                <div class="cp-modal-foot" style="justify-content:space-between;">
                    <button class="btn btn-ghost" onclick="app.compras.trocarModalCot('fornecedor')">
                        <i class="ph ph-plus"></i> Cadastrar fornecedor
                    </button>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost" onclick="app.compras.fecharModalCot()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.compras.criarCotacao()"><i class="ph ph-check"></i> Criar cotação</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    /* Formulário de cadastro rápido do fornecedor — mesmo modal, volta ao
       picker já com o novo selecionado (risco "só N fornecedores no cadastro"). */
    trocarModalCot(qual) {
        if (qual !== 'fornecedor') return;
        if (!this._cotModal) return;
        const r = this._req(this._cotModal.requisicao_id);
        document.querySelectorAll('.cp-modal-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'cp-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) this.fecharModalCot(); };
        overlay.innerHTML = `
            <div class="cp-modal">
                <div class="cp-modal-head">
                    <div>
                        <h3><i class="ph ph-buildings"></i> Cadastrar fornecedor</h3>
                        <div class="cp-modal-sub">${this._esc(r ? r.codigo : '')} — cadastro rápido para cotar agora</div>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="app.compras.fecharModalCot()"><i class="ph ph-x"></i></button>
                </div>
                <div class="cp-modal-body">
                    <div class="cp-field-row">
                        <div class="cp-field"><label>Razão social *</label>
                            <input type="text" class="form-control" id="cp-fn-razao" placeholder="Ex.: WEG S.A."></div>
                        <div class="cp-field"><label>Nome fantasia</label>
                            <input type="text" class="form-control" id="cp-fn-fantasia" placeholder="Ex.: WEG"></div>
                    </div>
                    <div class="cp-field-row">
                        <div class="cp-field"><label>CNPJ</label>
                            <input type="text" class="form-control" id="cp-fn-cnpj" placeholder="00.000.000/0001-00"></div>
                        <div class="cp-field"><label>Cidade / UF</label>
                            <input type="text" class="form-control" id="cp-fn-cidade" placeholder="Ex.: Jaraguá do Sul / SC"></div>
                    </div>
                    <div class="cp-field-row">
                        <div class="cp-field"><label>Contato</label>
                            <input type="text" class="form-control" id="cp-fn-contato" placeholder="Nome do atendente"></div>
                        <div class="cp-field"><label>Telefone</label>
                            <input type="text" class="form-control" id="cp-fn-telefone" placeholder="(47) 3333-0000"></div>
                    </div>
                    <div class="cp-field"><label>E-mail</label>
                        <input type="email" class="form-control" id="cp-fn-email" placeholder="cotacoes@fornecedor.com.br"></div>
                </div>
                <div class="cp-modal-foot" style="justify-content:space-between;">
                    <button class="btn btn-ghost" onclick="app.compras._renderCotModal()">Voltar</button>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost" onclick="app.compras.fecharModalCot()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.compras.salvarFornecedorRapido()"><i class="ph ph-floppy-disk"></i> Salvar fornecedor</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async salvarFornecedorRapido() {
        const g = id => String((document.getElementById(id) || {}).value || '').trim();
        const razao = g('cp-fn-razao');
        if (!razao) { window.app.toast('Informe a razão social.', 'error'); return; }

        const novo = {
            id: crypto.randomUUID(),
            razaoSocial: razao,
            nomeFantasia: g('cp-fn-fantasia'),
            cnpj: g('cp-fn-cnpj'),
            cidade: g('cp-fn-cidade'),
            contatoNome: g('cp-fn-contato'),
            telefone: g('cp-fn-telefone'),
            email: g('cp-fn-email'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const criado = await store.addFornecedor(novo);
        if (!criado) { window.app.toast('Não foi possível cadastrar o fornecedor.', 'error'); return; }
        if (this._cotModal) this._cotModal.pre = criado.id;
        window.app.toast('Fornecedor cadastrado.', 'success');
        this._renderCotModal();
    },

    fecharModalCot() {
        document.querySelectorAll('.cp-modal-overlay').forEach(el => el.remove());
        this._cotModal = null;
    },

    async criarCotacao() {
        const m = this._cotModal;
        if (!m) return;
        const sel = document.getElementById('cp-cot-fornecedor');
        const fornecedorId = sel ? sel.value : '';
        if (!fornecedorId) { window.app.toast('Selecione o fornecedor.', 'error'); return; }
        if (m.usados.has(fornecedorId)) {
            window.app.toast('Este fornecedor já tem cotação nesta requisição.', 'error');
            return;
        }

        const g = id => String((document.getElementById(id) || {}).value || '').trim();
        const itensReq = this._itensDaRequisicao(m.requisicao_id);
        const numero = this._nextCodigoCot(store.getState().comprasCotacoes || []);
        const agora = new Date().toISOString();
        const r = this._req(m.requisicao_id);

        const payload = {
            id: crypto.randomUUID(),
            requisicao_id: m.requisicao_id,
            fornecedor_id: fornecedorId,
            numero,
            data_solicitacao: agora,
            data_resposta: '',
            status: 'aberta',
            prazo_entrega: g('cp-cot-prazo'),
            condicao_pagamento: g('cp-cot-condicao'),
            validade_proposta: g('cp-cot-validade'),
            frete: 0,
            total: 0,
            observacoes: '',
            created_at: agora,
            updated_at: agora
        };

        this._seeding = true;
        const criada = await store.addComprasCotacoes(payload);
        if (!criada) {
            this._seeding = false;
            window.app.toast('Não foi possível criar a cotação.', 'error');
            return;
        }

        // Preço de catálogo NÃO entra como cotação — ele é só dica na grade,
        // senão dois fornecedores pareceriam ter o mesmo preço.
        const itensPayload = itensReq.map(it => ({
            id: crypto.randomUUID(),
            cotacao_id: criada.id,
            requisicao_item_id: it.id,
            material_id: it.material_id || '',
            qtd: parseFloat(it.qtd) || 0,
            custo_unitario: 0,
            ipi: 0, icms: 0, desconto: 0,
            prazo_entrega: '',
            total: 0,
            vencedor: 0,
            observacoes: '',
            created_at: agora,
            updated_at: agora
        }));
        const res = await this._emLote(itensPayload, p => store.addComprasCotacaoItens(p), 10);
        const falhas = res.filter(x => !x).length;

        // 1ª cotação da requisição → avança para "Em Cotação"
        if (r && r.status === 'liberada') await store.updateComprasRequisicoes(r.id, { status: 'em_cotacao' });
        this._seeding = false;
        this.fecharModalCot();

        if (falhas) window.app.toast(`Cotação ${numero} criada, mas ${falhas} item(ns) falharam ao gravar.`, 'error');
        else window.app.toast(`Cotação ${numero} criada para ${this._nomeFornecedor(this._fornecedor(fornecedorId))}.`, 'success');
        this.openCotacao(criada.id);
    },

    /* ------------------------------------------------------------
       VIEW — DETALHE DA COTAÇÃO
       ------------------------------------------------------------ */

    openCotacao(id) {
        const c = this._cotacao(id);
        if (!c) { this.voltarDaCotacao(); return; }
        const reqItens = new Map(this._itensDaRequisicao(c.requisicao_id).map(i => [i.id, i]));
        const itens = this._itensDaCotacao(id).map(ci => ({ ...ci, _req: reqItens.get(ci.requisicao_item_id) || null }));
        this._cotStaging = { cotacao: { ...c }, itens };
        this.activeCotacao = id;
        this.viewMode = 'cotacao';
        this._cotAviso = null;
        this.render();
    },

    voltarDaCotacao() {
        const reqId = this._cotStaging ? this._cotStaging.cotacao.requisicao_id : null;
        const volta = (reqId && this._req(reqId)) ? reqId : (this._req(this.activeId) ? this.activeId : null);
        this._cotStaging = null;
        this.activeCotacao = null;
        if (volta) {
            this.viewMode = 'detail';
            this.activeId = volta;
            this.activeTab = 'cotacoes';
        } else {
            this.viewMode = 'list';
            this.activeId = null;
        }
        this.render();
    },

    renderCotacao() {
        const container = document.getElementById('view-compras');
        if (!container) return;
        const st = this._cotStaging;
        if (!st) { this.voltarDaCotacao(); return; }

        const c = st.cotacao;
        const r = this._req(c.requisicao_id);
        const f = this._fornecedor(c.fornecedor_id);
        const podeEditar = store.canEdit();
        const trans = podeEditar ? (CP_COT_TRANSICOES[c.status] || []) : [];
        const semPreco = !st.itens.some(ci => this._cotItemTotal(ci) > 0);

        container.innerHTML = `
            <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.voltarDaCotacao()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-tag"></i> ${this._esc(c.numero)}
                                <span class="cp-badge cp-badge-cot cp-cot-${this._esc(c.status)}" style="background:rgba(255,255,255,.16);color:#fff;">${this._esc(CP_COT_STATUS[c.status] || c.status)}</span>
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">${this._esc(this._nomeFornecedor(f))} · ${this._esc(r ? r.codigo : '')}</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <input type="file" id="cp-cot-input" accept=".xlsx,.xls,.csv" style="display:none" onchange="app.compras.handleCotImportFile(this)">
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.importarPrecos()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Importar a tabela de preços do fornecedor">
                            <i class="ph ph-upload-simple"></i> Importar preços
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.baixarModeloPrecos()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Planilha modelo já com os itens desta cotação">
                            <i class="ph ph-download-simple"></i> Modelo
                        </button>
                        ${podeEditar ? `
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.salvarCotacao()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-floppy-disk"></i> Salvar
                        </button>` : ''}
                        ${podeEditar && c.status !== 'cancelada' ? `
                        <button class="btn btn-sm btn-ghost" onclick="app.compras.removerCotacao('${c.id}')" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                            <i class="ph ph-trash"></i> Excluir
                        </button>` : ''}
                    </div>
                </div>

                <div class="cp-body">
                    ${this._cotAviso ? `
                    <div class="cp-banner ${this._cotAviso.ok ? 'ok' : 'warn'}">
                        <i class="ph ${this._cotAviso.ok ? 'ph-check-circle' : 'ph-question'}"></i>
                        <div><b>Import de preços — ${this._esc(this._cotAviso.nome)}:</b>
                            ${this._cotAviso.ok} preço(s) aplicado(s) em ${this._cotAviso.total} linha(s).
                            ${this._cotAviso.falha ? ` <b>${this._cotAviso.falha} código(s) sem correspondência</b> nesta cotação.` : ''}
                        </div>
                    </div>` : ''}

                    ${semPreco ? `
                    <div class="cp-banner warn">
                        <i class="ph ph-currency-circle-dollar"></i>
                        <div><b>Cotação sem preços.</b> Lance os valores manualmente, importe a tabela do fornecedor ou use o modelo já preenchido com os itens.</div>
                    </div>` : ''}

                    <div class="cp-panel">
                        <div class="cp-section-title" style="margin-top:0;"><span class="cp-step">1</span> Negociação</div>
                        <div class="cp-form-grid">
                            <div class="cp-field"><label>Fornecedor</label>
                                <input type="text" class="form-control" value="${this._esc(this._nomeFornecedor(f))}" readonly></div>
                            <div class="cp-field"><label>Prazo de entrega</label>
                                <input type="text" class="form-control" value="${this._esc(c.prazo_entrega || '')}" placeholder="Ex.: 15 dias úteis" oninput="app.compras.setCotCampo('prazo_entrega', this.value)"></div>
                            <div class="cp-field"><label>Condição de pagamento</label>
                                <input type="text" class="form-control" value="${this._esc(c.condicao_pagamento || '')}" placeholder="Ex.: 30/60 dias" oninput="app.compras.setCotCampo('condicao_pagamento', this.value)"></div>
                            <div class="cp-field"><label>Validade da proposta</label>
                                <input type="text" class="form-control" value="${this._esc(c.validade_proposta || '')}" placeholder="Ex.: 15 dias" oninput="app.compras.setCotCampo('validade_proposta', this.value)"></div>
                            <div class="cp-field"><label>Frete (R$)</label>
                                <input type="number" step="0.01" min="0" class="form-control" value="${parseFloat(c.frete) || 0}" oninput="app.compras.setCotCampo('frete', this.value)"></div>
                            <div class="cp-field"><label>Data da resposta</label>
                                <input type="date" class="form-control" value="${this._esc(String(c.data_resposta || '').slice(0, 10))}" onchange="app.compras.setCotCampo('data_resposta', this.value)"></div>
                        </div>
                        <div class="cp-field" style="margin-top:12px;"><label>Observações</label>
                            <textarea class="form-control" rows="2" placeholder="Restrições, marcações, observações do fornecedor..." oninput="app.compras.setCotCampo('observacoes', this.value)">${this._esc(c.observacoes || '')}</textarea></div>

                        <div class="cp-cot-status">
                            <span class="cp-cot-status-label">Situação:</span>
                            ${trans.length
                                ? trans.map(s => `<button class="btn btn-sm btn-ghost" onclick="app.compras.mudarStatusCot('${s}')">${this._esc(CP_COT_STATUS[s])}</button>`).join('')
                                : '<span class="cp-sub">Status final — nenhuma transição disponível.</span>'}
                        </div>
                    </div>

                    <div class="cp-section-title"><span class="cp-step">2</span> Preços por item
                        ${podeEditar ? `<button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="app.compras.preencherCatalogo()" title="Preenche os campos vazios com o preço do catálogo">
                            <i class="ph ph-copy"></i> Usar catálogo
                        </button>` : ''}
                    </div>

                    <div class="cp-conf-wrap">
                        <div class="cp-conf-scroll">
                            <table class="cp-table cp-price">
                                <thead>
                                    <tr>
                                        <th>#</th><th>Item da LM</th><th style="text-align:right">Qtd</th><th>Un.</th>
                                        <th style="text-align:right">Unitário (R$)</th><th style="text-align:right">IPI %</th>
                                        <th style="text-align:right">ICMS %</th><th style="text-align:right">Desc. %</th>
                                        <th>Prazo</th><th style="text-align:right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${st.itens.length ? st.itens.map((ci, i) => this._precoLinhaHTML(ci, i, podeEditar)).join('')
                                                      : '<tr><td colspan="10" style="padding:22px;text-align:center;color:#9ca3af;">Sem itens vinculados.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="cp-footbar">
                        <div class="cp-footbar-info">
                            Itens <b id="cp-cot-itens">${window.app.formatCurrency(this._cotSomaItens())}</b>
                            · Frete <b>${window.app.formatCurrency(parseFloat(c.frete) || 0)}</b>
                            · Total <b id="cp-cot-geral" style="color:#4F46E5;">${window.app.formatCurrency(this._cotGeral())}</b>
                            <div class="cp-sub" style="margin-top:3px;">Total do item = Qtd × Unitário × (1 + IPI%) × (1 − Desconto%)</div>
                        </div>
                        <div class="cp-footbar-actions">
                            <button class="btn btn-ghost" onclick="app.compras.voltarDaCotacao()">Voltar</button>
                            ${podeEditar ? `<button class="btn btn-primary" onclick="app.compras.salvarCotacao()">
                                <i class="ph ph-floppy-disk"></i> Salvar cotação
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    _precoLinhaHTML(ci, i, podeEditar) {
        const ri = ci._req;
        const cat = ri ? (parseFloat(ri.custo_catalogo) || 0) : 0;
        const dis = podeEditar ? '' : 'disabled';
        const inpNum = (campo, val, ph) => `<input type="number" min="0" step="0.0001" class="form-control cp-price-in" ${dis}
            value="${val ? val : ''}" placeholder="${ph}" oninput="app.compras.setCotItemCampo(${i},'${campo}',this.value)">`;
        const inpTxt = (campo, val, ph) => `<input type="text" class="form-control cp-price-in" ${dis}
            value="${this._esc(val || '')}" placeholder="${ph}" oninput="app.compras.setCotItemCampo(${i}','${campo}',this.value)">`;

        return `<tr>
            <td>${i + 1}</td>
            <td style="min-width:220px;">
                <div class="cp-codigo">${this._esc(ri ? ri.codigo : '') || 'sem código'}</div>
                <div class="cp-mat-desc">${this._esc(ri ? ri.descricao : 'Item da requisição removido')}</div>
            </td>
            <td style="width:92px;text-align:right;">${inpNum('qtd', ci.qtd, '')}</td>
            <td style="width:52px;text-align:center;font-weight:600;">${this._esc(ri ? ri.unidade : '')}</td>
            <td style="width:150px;text-align:right;">
                ${inpNum('custo_unitario', ci.custo_unitario, cat ? String(this._fmtQtd(cat)) : '0,00')}
                ${cat ? `<div class="cp-sub">catálogo ${window.app.formatCurrency(cat)}</div>` : ''}
            </td>
            <td style="width:82px;text-align:right;">${inpNum('ipi', ci.ipi, '0')}</td>
            <td style="width:82px;text-align:right;">${inpNum('icms', ci.icms, '0')}</td>
            <td style="width:82px;text-align:right;">${inpNum('desconto', ci.desconto, '0')}</td>
            <td style="width:104px;">${inpTxt('prazo_entrega', ci.prazo_entrega, 'dias')}</td>
            <td style="width:130px;text-align:right;white-space:nowrap;"><b data-cot-tot="${i}">${window.app.formatCurrency(this._cotItemTotal(ci))}</b></td>
        </tr>`;
    },

    setCotCampo(campo, valor) {
        if (!this._cotStaging) return;
        this._cotStaging.cotacao[campo] = valor;
        this._atualizaTotaisCot();
    },

    setCotItemCampo(idx, campo, valor) {
        const st = this._cotStaging;
        if (!st || !st.itens[idx]) return;
        const numerico = campo === 'qtd' || campo === 'custo_unitario' || campo === 'ipi' || campo === 'icms' || campo === 'desconto';
        st.itens[idx][campo] = numerico ? (valor === '' ? 0 : (parseFloat(valor) || 0)) : valor;
        this._atualizaTotaisCot();
    },

    /* Atualiza só os totais — re-render completo derrubaria o foco do input. */
    _atualizaTotaisCot() {
        const st = this._cotStaging;
        if (!st) return;
        st.itens.forEach((ci, i) => {
            const el = document.querySelector(`[data-cot-tot="${i}"]`);
            if (el) el.textContent = window.app.formatCurrency(this._cotItemTotal(ci));
        });
        const itens = document.getElementById('cp-cot-itens');
        if (itens) itens.textContent = window.app.formatCurrency(this._cotSomaItens());
        const geral = document.getElementById('cp-cot-geral');
        if (geral) geral.textContent = window.app.formatCurrency(this._cotGeral());
    },

    /* Preenche os campos VAZIOS com o preço do catálogo (dica de partida,
       não substitui o preço do fornecedor). */
    preencherCatalogo() {
        const st = this._cotStaging;
        if (!st || !store.canEdit()) return;
        let n = 0;
        st.itens.forEach(ci => {
            if (parseFloat(ci.custo_unitario) > 0) return;
            const ri = ci._req;
            const cat = ri ? (parseFloat(ri.custo_catalogo) || 0) : 0;
            if (cat > 0) { ci.custo_unitario = cat; n++; }
        });
        if (!n) { window.app.toast('Nenhum item com preço de catálogo para preencher.', 'warning'); return; }
        this.renderCotacao();
        window.app.toast(`${n} preço(s) preenchido(s) com o catálogo. Revise antes de salvar.`, 'success');
    },

    async salvarCotacao() {
        const st = this._cotStaging;
        if (!st || !store.canEdit()) return;
        const c = st.cotacao;

        if (c.status === 'recebida' && !st.itens.some(ci => this._cotItemTotal(ci) > 0)) {
            window.app.toast('Informe ao menos um preço antes de marcar a cotação como recebida.', 'error');
            return;
        }
        const negativo = st.itens.find(ci => parseFloat(ci.custo_unitario) < 0 || parseFloat(ci.qtd) < 0);
        if (negativo) { window.app.toast('Quantidade e preço não podem ser negativos.', 'error'); return; }
        // Percentuais fora de 0–100 = erro de digitação (coluna importada trocada,
        // casas decimais a mais). Bloqueia antes de gravar total distorcido.
        const foraDeFaixa = st.itens.find(ci => {
            const ipi = parseFloat(ci.ipi) || 0, desc = parseFloat(ci.desconto) || 0;
            return ipi < 0 || ipi > 100 || desc < 0 || desc > 100;
        });
        if (foraDeFaixa) {
            window.app.toast('IPI e Desconto devem estar entre 0% e 100% — confira as colunas importadas.', 'error');
            return;
        }

        const geral = this._cotGeral();
        const agora = new Date().toISOString();

        this._seeding = true;
        const okCot = await store.updateComprasCotacoes(c.id, {
            prazo_entrega: String(c.prazo_entrega || ''),
            condicao_pagamento: String(c.condicao_pagamento || ''),
            validade_proposta: String(c.validade_proposta || ''),
            frete: parseFloat(c.frete) || 0,
            total: geral,
            observacoes: String(c.observacoes || ''),
            data_resposta: String(c.data_resposta || ''),
            status: c.status
        });

        const atualizacoes = st.itens.map(ci => ({
            id: ci.id,
            qtd: parseFloat(ci.qtd) || 0,
            custo_unitario: parseFloat(ci.custo_unitario) || 0,
            ipi: parseFloat(ci.ipi) || 0,
            icms: parseFloat(ci.icms) || 0,
            desconto: parseFloat(ci.desconto) || 0,
            prazo_entrega: String(ci.prazo_entrega || ''),
            total: this._cotItemTotal(ci),
            observacoes: ci.observacoes || '',
            updated_at: agora
        }));
        const res = await this._emLote(atualizacoes, p => store.updateComprasCotacaoItens(p.id, p), 10);
        const falhas = res.filter(x => !x).length;
        this._seeding = false;

        if (!okCot || falhas) {
            window.app.toast(`Falha ao salvar: ${!okCot ? 'cotação' : ''}${!okCot && falhas ? ' e ' : ''}${falhas ? falhas + ' item(ns)' : ''}.`, 'error');
        } else {
            const semPreco = !st.itens.some(ci => this._cotItemTotal(ci) > 0);
            window.app.toast(semPreco
                ? 'Cotação salva — ainda sem preços informados.'
                : `Cotação ${c.numero} salva · total ${window.app.formatCurrency(geral)}.`, 'success');
        }
        this.openCotacao(c.id);
    },

    async mudarStatusCot(status) {
        const st = this._cotStaging;
        if (!st || !store.canEdit()) return;
        const atual = st.cotacao.status;
        if (!(CP_COT_TRANSICOES[atual] || []).includes(status)) {
            window.app.toast(`Transição inválida: ${CP_COT_STATUS[atual]} → ${CP_COT_STATUS[status]}.`, 'error');
            return;
        }
        if (status === 'recebida' && !st.itens.some(ci => this._cotItemTotal(ci) > 0)) {
            window.app.toast('Informe ao menos um preço antes de marcar a cotação como recebida.', 'error');
            return;
        }
        const updates = { status };
        if (status === 'recebida' && !st.cotacao.data_resposta) updates.data_resposta = new Date().toISOString();
        const ok = await store.updateComprasCotacoes(st.cotacao.id, updates);
        if (!ok) { window.app.toast('Não foi possível alterar o status.', 'error'); return; }
        this.openCotacao(st.cotacao.id);
    },

    async removerCotacao(id) {
        const c = this._cotacao(id);
        if (!c || !store.canDelete()) return;
        const temVencedor = this._itensDaCotacao(id).some(i => i.vencedor === 1 || i.vencedor === '1');
        const ok = await window.app.confirm(
            `Excluir a cotação ${c.numero} (${this._nomeFornecedor(this._fornecedor(c.fornecedor_id))})?` +
            (temVencedor ? ' Ela tem itens marcados como vencedores, que serão desmarcados.' : ' Os itens da cotação também serão removidos.')
        );
        if (!ok) return;

        this._seeding = true;
        const itens = this._itensDaCotacao(id);
        await this._emLote(itens, i => store.deleteComprasCotacaoItens(i.id), 10);
        const delOk = await store.deleteComprasCotacoes(id);
        this._seeding = false;

        if (!delOk) { window.app.toast('Não foi possível excluir a cotação.', 'error'); this.openCotacao(id); return; }

        if (this.viewMode === 'cotacao' && this.activeCotacao === id) {
            const restantes = this._cotacoesDaRequisicao(c.requisicao_id);
            if (!restantes.length && c.requisicao_id) {
                const r = this._req(c.requisicao_id);
                if (r && r.status === 'em_cotacao') await store.updateComprasRequisicoes(r.id, { status: 'liberada' });
            }
            this.voltarDaCotacao();
        } else {
            this.renderDetail();
        }
        window.app.toast(`Cotação ${c.numero} excluída.`, 'success');
    },

    /* ------------------------------------------------------------
       IMPORT DA TABELA DE PREÇOS DO FORNECEDOR
       ----------------------------------------------------------------
       Reaproveita o mapeamento de cabeçalho da LM, mas aplica no ALVO
       cotação_item (não no catálogo): o custo do material só muda no
       recebimento da NF (Fase 4).
       ------------------------------------------------------------ */

    importarPrecos() {
        const inp = document.getElementById('cp-cot-input');
        if (inp) inp.click();
    },

    handleCotImportFile(input) {
        const file = input.files && input.files[0];
        if (!file) return;
        input.value = '';
        if (!this._cotStaging) return;
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);
        const campos = ['codigo', 'preco', 'prazo', 'ipi', 'icms', 'desconto'];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let linhas = [];
                if (isExcel) {
                    const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                    let melhor = null;
                    wb.SheetNames.forEach(nome => {
                        const rows = XLSX.utils.sheet_to_json(wb.Sheets[nome], { defval: '' });
                        if (!rows.length) return;
                        const mapa = this._mapearColunas(Object.keys(rows[0]), CP_PRECO_ALIASES, campos);
                        if (mapa.codigo && mapa.preco && (!melhor || Object.keys(mapa).length > melhor.n)) {
                            melhor = { rows, mapa, n: Object.keys(mapa).length };
                        }
                    });
                    if (!melhor) {
                        window.app.toast('Cabeçalho não reconhecido. Baixe o Modelo e use Código | Preço Unitário.', 'error');
                        return;
                    }
                    linhas = melhor.rows.map(row => this._linhaPrecos(row, melhor.mapa));
                } else {
                    linhas = this._csvPrecos(e.target.result, campos);
                    if (!linhas.length) {
                        window.app.toast('CSV sem cabeçalho reconhecido (Código e Preço Unitário).', 'error');
                        return;
                    }
                }
                this._aplicarPrecos(linhas, file.name);
            } catch (err) {
                console.error('[Compras] import preços:', err);
                window.app.toast('Erro ao processar o arquivo: ' + err.message, 'error');
            }
        };
        if (isExcel) reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
    },

    _linhaPrecos(row, mapa) {
        const val = (campo) => mapa[campo] !== undefined ? row[mapa[campo]] : '';
        return {
            codigo: val('codigo'),
            preco: this._num(val('preco')),
            prazo: String(val('prazo') ?? '').replace(/[^\d]/g, ''),
            ipi: this._num(val('ipi')),
            icms: this._num(val('icms')),
            desconto: this._num(val('desconto'))
        };
    },

    _csvPrecos(texto, campos) {
        const linhas = String(texto).split(/\r?\n/).filter(l => l.trim());
        if (linhas.length < 2) return [];
        const sep = (linhas[0].split(';').length > linhas[0].split(',').length) ? ';' : ',';
        const quebrar = (l) => {
            const out = []; let cur = ''; let asp = false;
            for (let i = 0; i < l.length; i++) {
                const ch = l[i];
                if (ch === '"') { asp = !asp; continue; }
                if (ch === sep && !asp) { out.push(cur); cur = ''; continue; }
                cur += ch;
            }
            out.push(cur);
            return out.map(s => s.trim());
        };
        const cab = quebrar(linhas[0]);
        const mapa = this._mapearColunas(cab, CP_PRECO_ALIASES, campos);
        if (!mapa.codigo || !mapa.preco) return [];
        // `mapa` guarda o NOME do cabeçalho; em CSV as células são um array
        // posicional — precisa converter nome → posição antes de ler.
        const pos = {};
        Object.keys(mapa).forEach(c => { pos[c] = cab.indexOf(mapa[c]); });
        return linhas.slice(1).map(l => {
            const cel = quebrar(l);
            const obj = {};
            Object.keys(pos).forEach(c => {
                const p = pos[c];
                obj[c] = p >= 0 && cel[p] !== undefined ? cel[p] : '';
            });
            return this._linhaPrecos(obj, { codigo: 'codigo', preco: 'preco', prazo: 'prazo', ipi: 'ipi', icms: 'icms', desconto: 'desconto' });
        });
    },

    _aplicarPrecos(linhas, nomeArquivo) {
        const st = this._cotStaging;
        if (!st) return;

        const materiais = new Map((store.getState().materiais || []).map(m => [m.id, m]));
        const porChave = new Map();
        st.itens.forEach((ci, i) => {
            const ri = ci._req;
            const chaves = [];
            if (ri && ri.codigo) chaves.push(this._norm(ri.codigo));
            const m = ci.material_id ? materiais.get(ci.material_id) : null;
            if (m) {
                if (m.codigoInterno) chaves.push(this._norm(m.codigoInterno));
                if (m.codigoFabricante) chaves.push(this._norm(m.codigoFabricante));
            }
            chaves.filter(Boolean).forEach(k => { if (!porChave.has(k)) porChave.set(k, i); });
        });

        let ok = 0;
        const vistos = new Set();
        linhas.forEach(l => {
            const k = this._norm(l.codigo);
            if (!k || vistos.has(k)) return;
            const i = porChave.get(k);
            if (i === undefined) return;
            vistos.add(k);
            const ci = st.itens[i];
            if (l.preco > 0) { ci.custo_unitario = l.preco; ok++; }
            if (l.prazo) ci.prazo_entrega = l.prazo;
            // Só aplica percentuais plausíveis — coluna mapeada errado dispara
            // valor absurdo e o total estoura (guarda extra além da validação).
            if (l.ipi > 0 && l.ipi <= 100) ci.ipi = l.ipi;
            if (l.icms > 0 && l.icms <= 100) ci.icms = l.icms;
            if (l.desconto > 0 && l.desconto <= 100) ci.desconto = l.desconto;
        });

        const falha = linhas.length - ok;
        this._cotAviso = { ok, falha: falha > 0 ? falha : 0, total: linhas.length, nome: nomeArquivo };
        this.renderCotacao();
        window.app.toast(ok
            ? `${ok} preço(s) importado(s).`
            : 'Nenhum código do arquivo corresponde a esta cotação.', ok ? 'success' : 'error');
    },

    /* Planilha para o fornecedor preencher — já sai com os itens da cotação. */
    baixarModeloPrecos() {
        const st = this._cotStaging;
        if (!st) return;
        try {
            if (typeof XLSX === 'undefined') { window.app.toast('Biblioteca XLSX não disponível.', 'warning'); return; }
            const linhas = [['Código', 'Descrição', 'Unidade', 'Quantidade', 'Preço Unitário', 'Prazo (dias)', 'IPI %', 'ICMS %', 'Desconto %']];
            st.itens.forEach(ci => {
                const ri = ci._req;
                linhas.push([
                    ri ? ri.codigo : '', ri ? ri.descricao : '', ri ? ri.unidade : '',
                    ci.qtd, '', '', '', '', ''
                ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(linhas);
            ws['!cols'] = [{ wch: 20 }, { wch: 58 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 9 }, { wch: 9 }, { wch: 11 }];

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
            XLSX.utils.book_append_sheet(wb, ws, 'Preços');
            XLSX.writeFile(wb, `${st.cotacao.numero || 'cotacao'}_precos.xlsx`);
            window.app.toast('Modelo de preços baixado.', 'success');
        } catch (e) {
            console.error('[Compras] modelo preços:', e);
            window.app.toast('Erro ao gerar o modelo: ' + e.message, 'error');
        }
    },

    /* ------------------------------------------------------------
       VENCEDOR ITEM A ITEM
       ------------------------------------------------------------ */

    async marcarVencedor(reqItemId, cotacaoId) {
        if (!store.canEdit()) return;
        const alvo = (store.getState().comprasCotacaoItens || [])
            .find(ci => ci.requisicao_item_id === reqItemId && ci.cotacao_id === cotacaoId);
        if (!alvo) return;
        if (this._cotItemTotal(alvo) <= 0) {
            window.app.toast('Informe o preço desta cotação antes de marcá-la como vencedora.', 'error');
            return;
        }
        const eraVencedor = alvo.vencedor === 1 || alvo.vencedor === '1';
        const todos = (store.getState().comprasCotacaoItens || []).filter(ci => ci.requisicao_item_id === reqItemId);

        this._seeding = true;
        await Promise.all(todos.map(ci => {
            const novo = (ci.id === alvo.id && !eraVencedor) ? 1 : 0;
            if ((ci.vencedor === 1 ? 1 : 0) === novo) return Promise.resolve(true);
            return store.updateComprasCotacaoItens(ci.id, { vencedor: novo });
        }));
        await this._atualizaStatusVencedores(reqItemId, todos.map(t => t.cotacao_id));
        this._seeding = false;
        this.renderDetail();
    },

    async marcarMenorPreco(reqId) {
        if (!store.canEdit()) return;
        const itens = this._itensDaRequisicao(reqId);
        const cotacoes = this._cotacoesDaRequisicao(reqId)
            .filter(c => c.status !== 'cancelada' && c.status !== 'descartada');

        const vencedores = new Map();   // reqItemId -> cotacaoItem id
        for (const it of itens) {
            let melhor = null;
            for (const c of cotacoes) {
                const ci = this._itensDaCotacao(c.id).find(x => x.requisicao_item_id === it.id);
                if (!ci) continue;
                const tot = this._cotItemTotal(ci);
                if (tot > 0 && (melhor === null || tot < melhor.tot)) melhor = { id: ci.id, cot: c.id, tot };
            }
            if (melhor) vencedores.set(it.id, melhor);
        }
        if (!vencedores.size) {
            window.app.toast('Nenhum item tem preço informado — abra as cotações e lance os preços.', 'error');
            return;
        }

        const decididos = new Set(vencedores.keys());
        const todos = (store.getState().comprasCotacaoItens || []).filter(ci => decididos.has(ci.requisicao_item_id));
        const cotIds = [...new Set([...vencedores.values()].map(v => v.cot))];

        this._seeding = true;
        // Exclusividade: só o escolhido pelo menor-preço fica vencedor;
        // os demais itens do MESMO requisicao_item_id são desmarcados (senão
        // um vencedor manual anterior conviveria com o novo).
        await Promise.all(todos.map(ci => {
            const escolhido = vencedores.get(ci.requisicao_item_id);
            const novo = (escolhido && escolhido.id === ci.id) ? 1 : 0;
            if ((ci.vencedor === 1 ? 1 : 0) === novo) return Promise.resolve(true);
            return store.updateComprasCotacaoItens(ci.id, { vencedor: novo });
        }));
        await this._atualizaStatusVencedores(null, cotIds);
        this._seeding = false;
        this.renderDetail();
        window.app.toast(`Menor preço marcado em ${vencedores.size} de ${itens.length} item(ns).`, 'success');
    },

    /* Status automático: cotação com ≥1 vitória vira "Vencedora"; ao perder
       todas, volta para "Recebida" (ou "Aberta" se ainda sem preço).
       Ação de sistema — não passa pelo validador de transições do usuário. */
    async _atualizaStatusVencedores(reqItemId, cotIds) {
        const ids = new Set(cotIds && cotIds.length
            ? cotIds
            : [...new Set((store.getState().comprasCotacaoItens || [])
                .filter(ci => !reqItemId || ci.requisicao_item_id === reqItemId)
                .map(ci => ci.cotacao_id))]);

        await Promise.all([...ids].map(async cid => {
            const c = this._cotacao(cid);
            if (!c || c.status === 'cancelada' || c.status === 'descartada') return;
            const itens = this._itensDaCotacao(cid);
            const venc = itens.some(i => i.vencedor === 1 || i.vencedor === '1');
            const temPreco = itens.some(i => this._cotItemTotal(i) > 0);

            let novo = c.status;
            if (venc && c.status !== 'vencedora') novo = 'vencedora';
            else if (!venc && c.status === 'vencedora') novo = temPreco ? 'recebida' : 'aberta';
            if (novo !== c.status) await store.updateComprasCotacoes(cid, { status: novo });
        }));
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
