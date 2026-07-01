import { store } from './state.js';

const RegrasDerivacaoModule = {
    init() {
        window.app.regrasDerivacao = {
            render: this.render.bind(this),
            resetView: this.resetView.bind(this),
            openNewModal: this.openNewModal.bind(this),
            edit: this.edit.bind(this),
            remove: this.remove.bind(this),
            save: this.save.bind(this),
            closeModal: this.closeModal.bind(this),
            filtrar: this.filtrar.bind(this),
            addCondicao: this.addCondicao.bind(this),
            removeCondicao: this.removeCondicao.bind(this),
            addAcao: this.addAcao.bind(this),
            removeAcao: this.removeAcao.bind(this),
            testarRegra: this.testarRegra.bind(this),
            toggleAtiva: this.toggleAtiva.bind(this),
            duplicar: this.duplicar.bind(this),
            previewCondicoes: this.previewCondicoes.bind(this)
        };

        this.viewMode = 'list';
        this.currentFilter = { query: '', tipo: '' };

        store.subscribe((state) => {
            if (this.viewMode === 'list') {
                const container = document.getElementById('view-regras-derivacao');
                if (container && !container.classList.contains('hidden-module')) {
                    this.renderList(state.regrasDerivacao);
                }
            }
        });
    },

    resetView() {
        this.viewMode = 'list';
    },

    getBaseHTML() {
        const tiposPainel = ['*', 'CCM-BT', 'QGBT', 'CUB-MT', 'TR-MT', 'SEU', 'ELETROCENTRO', 'QTA', 'PLC', 'BC'];
        return `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-git-branch"></i> Regras de Derivação de Mão de Obra
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Associe parâmetros dos equipamentos às composições de mão de obra</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${store.canEdit() ? `
                            <button class="btn btn-sm btn-ghost" onclick="app.regrasDerivacao.openNewModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
                                <i class="ph ph-plus"></i> Nova Regra
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div style="position: relative; flex: 1; min-width: 250px;">
                            <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            <input type="text" class="form-control" placeholder="Buscar por nome da regra..." style="padding-left: 38px;" oninput="app.regrasDerivacao.filtrar()">
                        </div>
                        <select class="form-control" style="width: 200px;" onchange="app.regrasDerivacao.filtrar()" id="regra-filtro-tipo">
                            <option value="">Todos os Tipos</option>
                            ${tiposPainel.map(t => `<option value="${t}">${t === '*' ? 'Todos (qualquer tipo)' : t}</option>`).join('')}
                        </select>
                        <button class="btn btn-secondary btn-sm" onclick="app.regrasDerivacao.filtrar(true)">Limpar</button>
                    </div>

                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-container">
                            <table id="regras-derivacao-table">
                                <thead>
                                    <tr>
                                        <th style="width: 30px;">#</th>
                                        <th>Nome</th>
                                        <th>Tipo Painel</th>
                                        <th>Condições</th>
                                        <th>Ações</th>
                                        <th style="width: 80px;">Ativa</th>
                                        <th style="width: 120px;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    render() {
        if (this.viewMode === 'form') return;
        const container = document.getElementById('view-regras-derivacao');
        if (!container) return;
        container.innerHTML = this.getBaseHTML();
        this.renderList(store.getState().regrasDerivacao);
    },

    renderList(regras) {
        const tbody = document.querySelector('#regras-derivacao-table tbody');
        if (!tbody) return;

        if (!regras || regras.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma regra cadastrada. Clique em "Nova Regra" para começar.</td></tr>`;
            return;
        }

        const { query, tipo } = this.currentFilter;
        const filtered = regras.filter(r => {
            const matchQuery = !query || (r.nome && r.nome.toLowerCase().includes(query));
            const matchTipo = !tipo || (r.tipo_equipamento || '*') === tipo;
            return matchQuery && matchTipo;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma regra encontrada com os filtros atuais.</td></tr>`;
            return;
        }

        const sorted = [...filtered].sort((a, b) => (a.prioridade || 0) - (b.prioridade || 0));

        tbody.innerHTML = sorted.map((r, idx) => {
            const condicoes = this._parseCondicoes(r.condicoes);
            const acoes = this._parseAcoes(r.acoes);
            const condStr = condicoes.map(c => `${c.campo || '?'} ${c.operador || '?'} ${c.valor || '?'}`).join(' E ') || '(sempre verdadeiro)';
            const acaoStr = acoes.map(a => {
                const comp = this._findComposicao(a.composicao_id);
                return (comp ? comp.codigo : '?') + ' × ' + (a.quantidade || '0');
            }).join(', ') || '(nenhuma)';
            const isAtiva = r.regra_ativa !== 0;

            return `
                <tr style="${isAtiva ? '' : 'opacity: 0.5;'}">
                    <td style="text-align: center; font-weight: 700; color: #94a3b8;">${idx + 1}</td>
                    <td>
                        <div style="font-weight: 600;">${r.nome || 'Sem nome'}</div>
                        <div class="text-xs text-muted">Prioridade: ${r.prioridade || 0}</div>
                    </td>
                    <td><span class="status-badge" style="background: #ede9fe; color: #6d28d9;">${r.tipo_equipamento || '*'}</span></td>
                    <td style="font-size: 12px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${condStr}">${condStr}</td>
                    <td style="font-size: 12px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${acaoStr}">${acaoStr}</td>
                    <td style="text-align: center;">
                        <label style="position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer;" onclick="event.stopPropagation(); app.regrasDerivacao.toggleAtiva('${r.id}')">
                            <input type="checkbox" ${isAtiva ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; inset: 0; background: ${isAtiva ? '#7c3aed' : '#cbd5e1'}; border-radius: 10px; transition: 0.3s;">
                                <span style="position: absolute; top: 2px; left: ${isAtiva ? '18px' : '2px'}; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s;"></span>
                            </span>
                        </label>
                    </td>
                    <td>
                        ${store.canEdit() ? `
                            <button class="btn btn-ghost" style="padding: 4px;" onclick="app.regrasDerivacao.edit('${r.id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                            <button class="btn btn-ghost" style="padding: 4px; color: #3b82f6;" onclick="app.regrasDerivacao.duplicar('${r.id}')" title="Duplicar"><i class="ph ph-copy"></i></button>
                            <button class="btn btn-ghost" style="padding: 4px; color: #f59e0b;" onclick="app.regrasDerivacao.testarRegra('${r.id}')" title="Testar"><i class="ph ph-play"></i></button>
                        ` : ''}
                        ${store.canDelete() ? `
                            <button class="btn btn-ghost" style="padding: 4px; color: var(--color-danger);" onclick="app.regrasDerivacao.remove('${r.id}')" title="Excluir"><i class="ph ph-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    toggleAtiva(id) {
        const r = (store.getState().regrasDerivacao || []).find(x => x.id === id);
        if (r) {
            const nova = r.regra_ativa === 0 ? 1 : 0;
            store.updateRegraDerivacao(id, { regra_ativa: nova });
        }
    },

    async duplicar(id) {
        const r = (store.getState().regrasDerivacao || []).find(x => x.id === id);
        if (r) {
            delete r.id;
            await store.addRegraDerivacao({
                ...r,
                nome: r.nome + ' (cópia)',
                created_at: undefined,
                updated_at: undefined
            });
            app.toast('Regra duplicada.', 'success');
        }
    },

    filtrar(clear = false) {
        if (clear) {
            this.currentFilter = { query: '', tipo: '' };
            const el = document.querySelector('#regras-derivacao-table').parentElement?.parentElement?.parentElement?.querySelector('input');
            if (el) el.value = '';
            const sel = document.getElementById('regra-filtro-tipo');
            if (sel) sel.value = '';
        } else {
            const input = document.querySelector('#regras-derivacao-table').parentElement?.parentElement?.parentElement?.querySelector('input');
            this.currentFilter = {
                query: input?.value?.toLowerCase() || '',
                tipo: document.getElementById('regra-filtro-tipo')?.value || ''
            };
        }
        this.renderList(store.getState().regrasDerivacao);
    },

    openNewModal() {
        this.viewMode = 'form';
        this.render();
        this.renderModal();
    },

    edit(id) {
        const item = store.getState().regrasDerivacao.find(r => r.id === id);
        if (item) {
            this.viewMode = 'form';
            this.render();
            this.renderModal(item);
        }
    },

    closeModal() {
        this.viewMode = 'list';
        this.render();
    },

    _parseCondicoes(condicoes) {
        if (!condicoes) return [];
        if (typeof condicoes === 'string') {
            try { return JSON.parse(condicoes); } catch { return []; }
        }
        return Array.isArray(condicoes) ? condicoes : [];
    },

    _parseAcoes(acoes) {
        if (!acoes) return [];
        if (typeof acoes === 'string') {
            try { return JSON.parse(acoes); } catch { return []; }
        }
        return Array.isArray(acoes) ? acoes : [];
    },

    _findComposicao(id) {
        return (store.getState().composicoes || []).find(c => c.id === id);
    },

    _findComposicaoByCodigo(codigo) {
        return (store.getState().composicoes || []).find(c => c.codigo === codigo);
    },

    _formatCondicaoText(c) {
        const opMap = { '==': 'igual a', '!=': 'diferente de', '>': 'maior que', '>=': 'maior ou igual', '<': 'menor que', '<=': 'menor ou igual', 'exists': 'existe', 'length>': 'qtde >', 'length=': 'qtde =' };
        if (c.operador === 'exists') return `${c.campo} existe`;
        return `${c.campo} ${opMap[c.operador] || c.operador} ${c.valor}`;
    },

    _getCompositeKey(campo, operador, valor, idx) {
        return `cond_${idx}_${campo}_${operador}_${valor}`.replace(/[^a-zA-Z0-9_]/g, '_');
    },

    _getAcaoKey(composicao_id, idx) {
        return `acao_${idx}_${composicao_id}`.replace(/[^a-zA-Z0-9_]/g, '_');
    },

    previewCondicoes() {
        const condicoes = this._getCondicoesFromDOM();
        const preview = document.getElementById('regra-preview-condicoes');
        if (!preview) return;
        if (condicoes.length === 0) {
            preview.textContent = 'Nenhuma condição (aplica-se a todos os equipamentos)';
            return;
        }
        preview.textContent = condicoes.map(c => this._formatCondicaoText(c)).join(' E ');
    },

    _getCondicoesFromDOM() {
        const container = document.getElementById('condicoes-container');
        if (!container) return [];
        const rows = container.querySelectorAll('.condicao-row');
        const condicoes = [];
        rows.forEach(row => {
            const campo = row.querySelector('.cond-campo')?.value;
            const operador = row.querySelector('.cond-operador')?.value;
            const valor = row.querySelector('.cond-valor')?.value;
            if (campo) condicoes.push({ campo, operador: operador || '>', valor: valor || '0' });
        });
        return condicoes;
    },

    _getAcoesFromDOM() {
        const container = document.getElementById('acoes-container');
        if (!container) return [];
        const rows = container.querySelectorAll('.acao-row');
        const acoes = [];
        rows.forEach(row => {
            const composicao_id = row.querySelector('.acao-composicao')?.value;
            const quantidade = row.querySelector('.acao-quantidade')?.value;
            if (composicao_id && quantidade) acoes.push({ composicao_id, quantidade });
        });
        return acoes;
    },

    renderModal(data = {}) {
        const isEdit = !!data.id;
        const condicoes = this._parseCondicoes(data.condicoes);
        const acoes = this._parseAcoes(data.acoes);
        const composicoes = store.getState().composicoes || [];
        const tiposPainel = ['*', 'CCM-BT', 'QGBT', 'CUB-MT', 'TR-MT', 'SEU', 'ELETROCENTRO', 'QTA', 'PLC', 'BC'];
        const camposDisponiveis = [
            { value: 'tipo', label: 'Tipo do painel' },
            { value: 'tag', label: 'Tag do equipamento' },
            { value: 'tensao', label: 'Tensão (V)' },
            { value: 'correnteNominal', label: 'Corrente nominal (A)' },
            { value: 'icc', label: 'ICC (kA)' },
            { value: 'ip', label: 'Grau de proteção IP' },
            { value: 'num_disjuntores', label: 'Nº de disjuntores' },
            { value: 'cargas.length', label: 'Quantidade de cargas' },
            { value: 'barramentos.length', label: 'Quantidade de barramentos' },
            { value: 'protocolo', label: 'Protocolo de comunicação' },
            { value: 'forma', label: 'Forma de separação' },
            { value: 'instalacao', label: 'Tipo de instalação' }
        ];
        const operadores = [
            { value: '==', label: 'igual a' },
            { value: '!=', label: 'diferente de' },
            { value: '>', label: 'maior que' },
            { value: '>=', label: 'maior ou igual' },
            { value: '<', label: 'menor que' },
            { value: '<=', label: 'menor ou igual' },
            { value: 'exists', label: 'existe (não vazio)' },
            { value: 'length>', label: 'qtde. maior que' },
            { value: 'length=', label: 'qtde. igual a' }
        ];

        const html = `
            <div id="form-regra-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.regrasDerivacao.closeModal()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">${isEdit ? 'Editar Regra' : 'Nova Regra de Derivação'}</h3>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-cancel" onclick="app.regrasDerivacao.closeModal()">Cancelar</button>
                            <button class="btn btn-secondary" onclick="app.regrasDerivacao.testarRegra()" style="color: #f59e0b; border-color: #f59e0b;">
                                <i class="ph ph-play"></i> Testar
                            </button>
                            <button class="btn btn-primary" onclick="app.regrasDerivacao.save()" style="background: #7c3aed; border-color: #7c3aed;">
                                <i class="ph ph-check"></i> ${isEdit ? 'Atualizar' : 'Salvar'}
                            </button>
                        </div>
                    </div>

                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        <form id="form-regra">
                            <input type="hidden" name="id" value="${data.id || ''}">

                            <div class="row" style="display: flex; gap: 16px; margin-bottom: 20px;">
                                <div class="form-group" style="flex: 2;">
                                    <label class="form-label">Nome da Regra *</label>
                                    <input type="text" name="nome" class="form-control" value="${data.nome || ''}" placeholder="Ex: Barramento para CCM-BT" required>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Tipo de Painel</label>
                                    <select name="tipo_equipamento" class="form-control">
                                        ${tiposPainel.map(t => `<option value="${t}" ${(data.tipo_equipamento || '*') === t ? 'selected' : ''}>${t === '*' ? 'Todos (qualquer tipo)' : t}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 0 0 100px;">
                                    <label class="form-label">Prioridade</label>
                                    <input type="number" name="prioridade" class="form-control" value="${data.prioridade || 0}" min="0">
                                </div>
                                <div class="form-group" style="flex: 0 0 80px; display: flex; align-items: flex-end; padding-bottom: 4px;">
                                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                        <input type="checkbox" name="regra_ativa" value="1" ${data.regra_ativa !== 0 ? 'checked' : ''} style="width: 16px; height: 16px;">
                                        <span style="font-size: 12px; font-weight: 600;">Ativa</span>
                                    </label>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                                <!-- COLUNA ESQUERDA: CONDIÇÕES -->
                                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #fafafa;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                        <h4 style="margin: 0; font-size: 14px; color: #7c3aed; display: flex; align-items: center; gap: 6px;">
                                            <i class="ph ph-funnel"></i> Condições (SE)
                                        </h4>
                                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.regrasDerivacao.addCondicao()">+ Add Condição</button>
                                    </div>
                                    <div id="condicoes-container">
                                        ${condicoes.length === 0 ? `
                                            <div class="condicao-row" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                                                <select class="form-control cond-campo" style="flex: 1; font-size: 12px;" onchange="app.regrasDerivacao.previewCondicoes()">
                                                    <option value="">Selecione campo...</option>
                                                    ${camposDisponiveis.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
                                                </select>
                                                <select class="form-control cond-operador" style="width: 120px; font-size: 12px;" onchange="app.regrasDerivacao.previewCondicoes()">
                                                    ${operadores.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
                                                </select>
                                                <input type="text" class="form-control cond-valor" style="width: 100px; font-size: 12px;" placeholder="Valor" oninput="app.regrasDerivacao.previewCondicoes()">
                                                <button type="button" class="btn btn-ghost" style="padding: 4px; color: #ef4444;" onclick="app.regrasDerivacao.removeCondicao(this)"><i class="ph ph-x"></i></button>
                                            </div>
                                        ` : condicoes.map((c, i) => `
                                            <div class="condicao-row" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                                                <select class="form-control cond-campo" style="flex: 1; font-size: 12px;" onchange="app.regrasDerivacao.previewCondicoes()">
                                                    <option value="">Selecione campo...</option>
                                                    ${camposDisponiveis.map(camp => `<option value="${camp.value}" ${c.campo === camp.value ? 'selected' : ''}>${camp.label}</option>`).join('')}
                                                </select>
                                                <select class="form-control cond-operador" style="width: 120px; font-size: 12px;" onchange="app.regrasDerivacao.previewCondicoes()">
                                                    ${operadores.map(o => `<option value="${o.value}" ${c.operador === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                                                </select>
                                                <input type="text" class="form-control cond-valor" style="width: 100px; font-size: 12px;" placeholder="Valor" value="${c.valor || ''}" oninput="app.regrasDerivacao.previewCondicoes()">
                                                <button type="button" class="btn btn-ghost" style="padding: 4px; color: #ef4444;" onclick="app.regrasDerivacao.removeCondicao(this)"><i class="ph ph-x"></i></button>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div style="margin-top: 12px; padding: 8px; background: #f0fdf4; border-radius: 4px; font-size: 11px; color: #166534;">
                                        <i class="ph ph-code"></i> Preview: <span id="regra-preview-condicoes">${condicoes.length === 0 ? 'Nenhuma condição (aplica-se a todos os equipamentos)' : condicoes.map(c => this._formatCondicaoText(c)).join(' E ')}</span>
                                    </div>
                                </div>

                                <!-- COLUNA DIREITA: AÇÕES -->
                                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #fafafa;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                        <h4 style="margin: 0; font-size: 14px; color: #059669; display: flex; align-items: center; gap: 6px;">
                                            <i class="ph ph-list-checks"></i> Ações (ENTÃO)
                                        </h4>
                                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.regrasDerivacao.addAcao()">+ Add Ação</button>
                                    </div>
                                    <div id="acoes-container">
                                        ${acoes.length === 0 ? `
                                            <div class="acao-row" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                                                <select class="form-control acao-composicao" style="flex: 1; font-size: 12px;">
                                                    <option value="">Selecione composição...</option>
                                                    ${composicoes.map(comp => `<option value="${comp.id}" data-codigo="${comp.codigo}">[${comp.codigo}] ${comp.atividade}</option>`).join('')}
                                                </select>
                                                <input type="text" class="form-control acao-quantidade" style="width: 120px; font-size: 12px;" placeholder="Qtd (ex: 1, {n}/100)" value="">
                                                <button type="button" class="btn btn-ghost" style="padding: 4px; color: #ef4444;" onclick="app.regrasDerivacao.removeAcao(this)"><i class="ph ph-x"></i></button>
                                            </div>
                                        ` : acoes.map((a, i) => {
                                            const comp = this._findComposicao(a.composicao_id);
                                            return `
                                            <div class="acao-row" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                                                <select class="form-control acao-composicao" style="flex: 1; font-size: 12px;">
                                                    <option value="">Selecione composição...</option>
                                                    ${composicoes.map(comp => `<option value="${comp.id}" data-codigo="${comp.codigo}" ${a.composicao_id === comp.id ? 'selected' : ''}>[${comp.codigo}] ${comp.atividade}</option>`).join('')}
                                                </select>
                                                <input type="text" class="form-control acao-quantidade" style="width: 120px; font-size: 12px;" placeholder="Qtd (ex: 1, {n}/100)" value="${a.quantidade || ''}">
                                                <button type="button" class="btn btn-ghost" style="padding: 4px; color: #ef4444;" onclick="app.regrasDerivacao.removeAcao(this)"><i class="ph ph-x"></i></button>
                                            </div>
                                        `}).join('')}
                                    </div>
                                    <div style="margin-top: 12px; padding: 8px; background: #fef3c7; border-radius: 4px; font-size: 11px; color: #92400e;">
                                        <i class="ph ph-info"></i> Use <code>{campo}</code> para valores dinâmicos do equipamento. Ex: <code>{correnteNominal}/100</code>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('view-regras-derivacao');
        if (container) container.innerHTML = html;
    },

    addCondicao() {
        const container = document.getElementById('condicoes-container');
        if (!container) return;
        const camposDisponiveis = [
            { value: 'tipo', label: 'Tipo do painel' },
            { value: 'tag', label: 'Tag do equipamento' },
            { value: 'tensao', label: 'Tensão (V)' },
            { value: 'correnteNominal', label: 'Corrente nominal (A)' },
            { value: 'icc', label: 'ICC (kA)' },
            { value: 'ip', label: 'Grau de proteção IP' },
            { value: 'num_disjuntores', label: 'Nº de disjuntores' },
            { value: 'cargas.length', label: 'Quantidade de cargas' },
            { value: 'protocolo', label: 'Protocolo de comunicação' }
        ];
        const operadores = [
            { value: '==', label: 'igual a' },
            { value: '!=', label: 'diferente de' },
            { value: '>', label: 'maior que' },
            { value: 'exists', label: 'existe (não vazio)' }
        ];
        const div = document.createElement('div');
        div.className = 'condicao-row';
        div.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;';
        div.innerHTML = `
            <select class="form-control cond-campo" style="flex: 1; font-size: 12px;" onchange="app.regrasDerivacao.previewCondicoes()">
                <option value="">Selecione campo...</option>
                ${camposDisponiveis.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
            </select>
            <select class="form-control cond-operador" style="width: 120px; font-size: 12px;" onchange="app.regrasDerivacao.previewCondicoes()">
                ${operadores.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
            <input type="text" class="form-control cond-valor" style="width: 100px; font-size: 12px;" placeholder="Valor" oninput="app.regrasDerivacao.previewCondicoes()">
            <button type="button" class="btn btn-ghost" style="padding: 4px; color: #ef4444;" onclick="app.regrasDerivacao.removeCondicao(this)"><i class="ph ph-x"></i></button>
        `;
        container.appendChild(div);
        this.previewCondicoes();
    },

    removeCondicao(btn) {
        const row = btn.closest('.condicao-row');
        if (row) row.remove();
        this.previewCondicoes();
    },

    addAcao() {
        const container = document.getElementById('acoes-container');
        if (!container) return;
        const composicoes = store.getState().composicoes || [];
        const div = document.createElement('div');
        div.className = 'acao-row';
        div.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;';
        div.innerHTML = `
            <select class="form-control acao-composicao" style="flex: 1; font-size: 12px;">
                <option value="">Selecione composição...</option>
                ${composicoes.map(comp => `<option value="${comp.id}" data-codigo="${comp.codigo}">[${comp.codigo}] ${comp.atividade}</option>`).join('')}
            </select>
            <input type="text" class="form-control acao-quantidade" style="width: 120px; font-size: 12px;" placeholder="Qtd (ex: 1, {n}/100)" value="">
            <button type="button" class="btn btn-ghost" style="padding: 4px; color: #ef4444;" onclick="app.regrasDerivacao.removeAcao(this)"><i class="ph ph-x"></i></button>
        `;
        container.appendChild(div);
    },

    removeAcao(btn) {
        const row = btn.closest('.acao-row');
        if (row) row.remove();
    },

    async save() {
        const form = document.getElementById('form-regra');
        if (!form) return;

        const formData = new FormData(form);
        const obj = {};
        for (const [key, val] of formData.entries()) {
            obj[key] = val;
        }

        if (!obj.nome) {
            app.toast('O nome da regra é obrigatório.', 'error');
            return;
        }

        const condicoes = this._getCondicoesFromDOM();
        const acoes = this._getAcoesFromDOM();

        if (acoes.length === 0) {
            app.toast('Adicione pelo menos uma ação (composição + quantidade).', 'error');
            return;
        }

        obj.condicoes = JSON.stringify(condicoes);
        obj.acoes = JSON.stringify(acoes);
        obj.tipo_equipamento = obj.tipo_equipamento || '*';
        obj.prioridade = parseInt(obj.prioridade) || 0;
        obj.regra_ativa = obj.regra_ativa ? 1 : 0;
        delete obj.regra_ativa; // Will be handled separately

        const isAtiva = document.querySelector('#form-regra input[name="regra_ativa"]')?.checked !== false;
        obj.regra_ativa = isAtiva ? 1 : 0;

        let ok;
        if (obj.id) {
            ok = await store.updateRegraDerivacao(obj.id, obj);
        } else {
            delete obj.id;
            ok = await store.addRegraDerivacao(obj);
        }

        if (!ok) {
            app.toast('Erro ao salvar. Verifique se o servidor está rodando.', 'error');
            return;
        }

        this.closeModal();
        app.toast('Regra salva com sucesso!', 'success');
    },

    async remove(id) {
        if (await window.app.confirm('Remover esta regra de derivação?')) {
            const ok = await store.deleteRegraDerivacao(id);
            if (!ok) {
                window.app.toast('Erro ao remover. Verifique se o servidor está rodando.', 'error');
                return;
            }
            window.app.toast('Regra removida.', 'info');
        }
    },

    // --- Simulação / Teste de Regra ---

    async testarRegra(regraId) {
        let condicoes, acoes, nome;
        if (regraId) {
            const r = (store.getState().regrasDerivacao || []).find(x => x.id === regraId);
            if (!r) { app.toast('Regra não encontrada.', 'error'); return; }
            condicoes = this._parseCondicoes(r.condicoes);
            acoes = this._parseAcoes(r.acoes);
            nome = r.nome;
        } else {
            condicoes = this._getCondicoesFromDOM();
            acoes = this._getAcoesFromDOM();
            nome = document.querySelector('#form-regra input[name="nome"]')?.value || 'Rascunho';
        }

        if (acoes.length === 0) {
            app.toast('A regra não tem ações definidas.', 'warning');
            return;
        }

        // Criar equipamento simulado
        const eqSimulado = {
            tipo: document.getElementById('sim-tipo')?.value || 'CCM-BT',
            tag: 'TESTE-01',
            tensao: document.getElementById('sim-tensao')?.value || '380',
            correnteNominal: parseFloat(document.getElementById('sim-corrente')?.value) || 100,
            icc: document.getElementById('sim-icc')?.value || '25',
            ip: document.getElementById('sim-ip')?.value || 'IP54',
            num_disjuntores: parseInt(document.getElementById('sim-disjuntores')?.value) || 5,
            cargas: { length: parseInt(document.getElementById('sim-cargas')?.value) || 3 },
            protocolo: document.getElementById('sim-protocolo')?.value || 'Profinet'
        };

        // Avaliar condições
        const condOk = this._avaliarCondicoes(condicoes, eqSimulado);
        if (!condOk) {
            app.toast('Condições NÃO atendidas para o equipamento simulado.', 'warning');
            return;
        }

        // Calcular resultados
        const composicoes = store.getState().composicoes || [];
        const resultados = acoes.map(a => {
            const comp = this._findComposicao(a.composicao_id);
            if (!comp) return null;
            const qtd = this._calcularQuantidade(a.quantidade, eqSimulado);
            const hh = qtd * (comp.coeficiente_hh || 0);
            return {
                composicao: comp,
                quantidade: qtd,
                hh: hh,
                expressao: a.quantidade
            };
        }).filter(Boolean);

        if (resultados.length === 0) {
            app.toast('Nenhuma ação válida.', 'warning');
            return;
        }

        // Modal de resultado
        this._showTestResult(nome, eqSimulado, resultados);
    },

    _avaliarCondicoes(condicoes, eq) {
        if (!condicoes || condicoes.length === 0) return true;
        return condicoes.every(c => {
            const valorEq = this._getCampoEquipamento(eq, c.campo);
            const valorCond = c.valor;
            switch (c.operador) {
                case '==': return String(valorEq) === String(valorCond);
                case '!=': return String(valorEq) !== String(valorCond);
                case '>': return parseFloat(valorEq) > parseFloat(valorCond);
                case '>=': return parseFloat(valorEq) >= parseFloat(valorCond);
                case '<': return parseFloat(valorEq) < parseFloat(valorCond);
                case '<=': return parseFloat(valorEq) <= parseFloat(valorCond);
                case 'exists': return valorEq !== undefined && valorEq !== null && valorEq !== '';
                case 'length>': return (valorEq || 0) > parseInt(valorCond);
                case 'length=': return (valorEq || 0) === parseInt(valorCond);
                default: return true;
            }
        });
    },

    _getCampoEquipamento(eq, campo) {
        if (!campo) return undefined;
        if (campo.includes('.')) {
            const parts = campo.split('.');
            let val = eq;
            for (const p of parts) {
                val = val ? val[p] : undefined;
            }
            return val;
        }
        // Mapear campos alternativos
        const map = {
            'num_disjuntores': eq.num_disjuntores || 0,
            'correnteNominal': eq.correnteNominal || 0,
            'tensao': eq.tensao || '',
            'icc': eq.icc || '',
            'ip': eq.ip || '',
            'tipo': eq.tipo || '',
            'tag': eq.tag || '',
            'protocolo': eq.protocolo || '',
            'forma': eq.forma || '',
            'instalacao': eq.instalacao || '',
            'cargas.length': (eq.cargas && eq.cargas.length) || 0
        };
        return map[campo] !== undefined ? map[campo] : eq[campo];
    },

    _calcularQuantidade(expressao, eq) {
        if (!expressao) return 0;
        expressao = String(expressao).trim();
        // Se for número puro
        if (!isNaN(parseFloat(expressao))) return parseFloat(expressao);
        // Substituir {campo} pelo valor
        const resolvido = expressao.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, campo) => {
            return this._getCampoEquipamento(eq, campo) || '0';
        });
        try {
            const result = Function('"use strict"; return (' + resolvido + ')')();
            return typeof result === 'number' && !isNaN(result) ? result : 0;
        } catch {
            return 0;
        }
    },

    _showTestResult(nome, eq, resultados) {
        const totalHH = resultados.reduce((s, r) => s + r.hh, 0);
        const modalId = 'modal-test-regra-' + Date.now();
        const html = `
            <div id="${modalId}" class="modal-overlay" style="z-index: 10000;">
                <div class="modal" style="width: 600px;">
                    <div class="modal-header">
                        <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-play-circle" style="color: #f59e0b;"></i> Resultado do Teste
                        </h3>
                        <button class="btn btn-icon" onclick="document.getElementById('${modalId}').remove()"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 16px;">
                            <div style="font-weight: 700; font-size: 16px;">${nome}</div>
                            <div class="text-xs text-muted">Equipamento simulado: ${eq.tipo} | ${eq.tag} | ${eq.correnteNominal}A | ${eq.tensao}V</div>
                        </div>

                        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f1f5f9;">
                                        <th style="padding: 10px; text-align: left;">Composição</th>
                                        <th style="padding: 10px; text-align: center;">Expressão</th>
                                        <th style="padding: 10px; text-align: center;">Qtd</th>
                                        <th style="padding: 10px; text-align: center;">Coef. HH</th>
                                        <th style="padding: 10px; text-align: right;">Total HH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${resultados.map(r => `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 8px 10px;">
                                                <div style="font-weight: 600;">[${r.composicao.codigo}] ${r.composicao.atividade}</div>
                                                <div class="text-xs text-muted">${r.composicao.categoria_profissional || ''}</div>
                                            </td>
                                            <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-size: 11px;">${r.expressao}</td>
                                            <td style="padding: 8px 10px; text-align: center; font-weight: 600;">${r.quantidade.toFixed(2)} ${r.composicao.unidade}</td>
                                            <td style="padding: 8px 10px; text-align: center;">${r.composicao.coeficiente_hh}h</td>
                                            <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: var(--color-primary);">${r.hh.toFixed(2)}h</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot style="background: #f8fafc;">
                                    <tr>
                                        <td colspan="4" style="padding: 10px; text-align: right; font-weight: 700;">Total</td>
                                        <td style="padding: 10px; text-align: right; font-weight: 800; color: #7c3aed; font-size: 16px;">${totalHH.toFixed(2)}h</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div style="margin-top: 16px; display: flex; gap: 12px; align-items: center; padding: 12px; background: #f0fdf4; border-radius: 8px;">
                            <i class="ph ph-check-circle" style="color: #16a34a; font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600; color: #15803d;">Condições atendidas ✓</div>
                                <div class="text-xs text-muted">${resultados.length} composições geradas, ${totalHH.toFixed(2)} horas totais</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }
};

window.regrasDerivacaoModule = RegrasDerivacaoModule;
RegrasDerivacaoModule.init();
