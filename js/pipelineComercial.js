import { store } from './state.js';

const PipelineComercialModule = {
    _columnsCollapsed: {},

    init() {
        window.app.pipelineComercial = {
            render: this.render.bind(this),
            openItemModal: this.openItemModal.bind(this),
            updateStatus: this.updateStatus.bind(this),
            resetView: this.resetView.bind(this),
            openEditModal: this.openEditModal.bind(this),
            saveEditedLead: this.saveEditedLead.bind(this),
            registerInteraction: this.registerInteraction.bind(this),
            exportPipeline: this.exportPipeline.bind(this),
            printPipeline: this.printPipeline.bind(this),
            showPrintOptions: this.showPrintOptions.bind(this),
            printRevisionLogs: this.printRevisionLogs.bind(this),
            openRevisionModal: this.openRevisionModal.bind(this),
            subirRevisao: this.subirRevisao.bind(this),
            openEngenheiroSelector: this.openEngenheiroSelector.bind(this),
            iniciarPropostaComercial: this.iniciarPropostaComercial.bind(this),
            toggleColumn: this.toggleColumn.bind(this),
            deleteItem: this.deleteItem.bind(this),
            bulkCleanup: this.bulkCleanup.bind(this),
            _executeBulkCleanup: this._executeBulkCleanup.bind(this),
            syncOrphans: this.syncOrphans.bind(this),
            openRevisionLogModal: this.openRevisionLogModal.bind(this),
            _exportRevisionLogCSV: this._exportRevisionLogCSV.bind(this),
            _exportRevisionLogXLSX: this._exportRevisionLogXLSX.bind(this),
            _logPipelineAction: this._logPipelineAction.bind(this)
        };

        store.subscribe(() => {
            if (this._active) this.renderKanban();
        });
    },

    resetView() {
        this._active = false;
        this._columnsCollapsed = {};
    },

    render() {
        this._active = true;
        const container = document.getElementById('view-pipeline-comercial');
        if (!container) return;

        if (!container.querySelector('.module-header-sticky')) {
            container.innerHTML = `
                <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                    <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-stack"></i> Gestão de Propostas
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">Acompanhe o ciclo de vida completo das suas propostas.</div>
                        </div>
                        <div style="display:flex;gap:10px;">
                            ${store.getUserLevel() !== 'vendedor' ? `<button class="btn btn-sm btn-ghost" onclick="app.pipelineComercial.bulkCleanup()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Limpar cartões antigos">
                                <i class="ph ph-trash"></i> Limpar Antigos
                            </button>` : ''}
                            <button class="btn btn-sm btn-ghost" onclick="app.pipelineComercial.syncOrphans()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Remover cartões cujas pastas foram deletadas do servidor">
                                <i class="ph ph-arrows-clockwise"></i> Sincronizar
                            </button>
                            <button class="btn btn-sm btn-ghost" onclick="app.pipelineComercial.showPrintOptions()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Imprimir Pipeline">
                                <i class="ph ph-printer"></i> Imprimir
                            </button>
                            <button class="btn btn-sm btn-ghost" onclick="app.pipelineComercial.exportPipeline()" style="color:white;border:1px solid rgba(255,255,255,0.3);" title="Exportar Pipeline">
                                <i class="ph ph-download"></i> Exportar
                            </button>
                        </div>
                    </div>
                    <div id="pipeline-kanban" style="flex:1;overflow:auto;padding:16px 20px;"></div>
                </div>
            `;
        }
        this.renderKanban();
    },

    getPipelineData() {
        const state = store.getState();
        const itens = [...(state.pipelineItems || [])].map(item => ({
            ...item,
            interacoes: Array.isArray(item.interacoes) ? item.interacoes : []
        }));

        (state.orcamentos || []).forEach(orc => {
            if (!itens.find(i => i.origem === 'orcamento' && String(i.origemId) === String(orc.id))) {
                itens.push({
                    id: orc.id,
                    cliente: orc.clienteName || orc.cliente || 'Sem nome',
                    projeto: orc.obra || orc.projeto || '',
                    valor: orc.total || 0,
                    status: this._mapStatus(orc.status),
                    origem: 'orcamento',
                    origemId: orc.id,
                    observacoes: '',
                    ultimoContato: orc.updatedAt,
                    proximoFollowup: null,
                    interacoes: [],
                    createdAt: orc.createdAt
                });
            }
        });

        const seenPtc = new Set();
        const deduped = [];
        for (const item of itens) {
            if (item.origem === 'ptc' || item.origem === 'proposta_comercial') {
                const key = ((item.origemId || '') + '|' + (item.tipo || '')).trim().toLowerCase();
                if (key && seenPtc.has(key)) continue;
                if (key) seenPtc.add(key);
            }
            deduped.push(item);
        }

        // Filter by vendedor for vendedor-level users
        const userLevel = store.getUserLevel();
        if (userLevel === 'vendedor') {
            const vendedorName = window.app.getVendedorNameByUserEmail();
            if (vendedorName) {
                return deduped.filter(item => {
                    const itemVendedor = (item.vendedor || '').toLowerCase().trim();
                    return itemVendedor === vendedorName.toLowerCase().trim();
                });
            }
            return [];
        }

        return deduped;
    },

    _mapStatus(status) {
        const map = {
            'Em Elaboração': 'elaboracao',
            'Enviado': 'enviado',
            'Aprovado': 'fechado',
            'Perdido': 'perdido'
        };
        return map[status] || 'prospect';
    },

    _daysSince(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    },

    _heatColor(days) {
        if (days === null || days === undefined) return '#94a3b8';
        if (days <= 3) return '#22c55e';
        if (days <= 7) return '#f59e0b';
        return '#ef4444';
    },

    renderKanban() {
        const container = document.getElementById('pipeline-kanban');
        if (!container) return;

        const itens = this.getPipelineData();
        const stages = [
            { id: 'prospect', label: 'Aguardando Início', color: '#6366f1', icon: 'ph-user-plus' },
            { id: 'elaboracao', label: 'Em Elaboração', color: '#f59e0b', icon: 'ph-pencil' },
            { id: 'enviado', label: 'Proposta Enviada', color: '#3b82f6', icon: 'ph-paper-plane' },
            { id: 'negociacao', label: 'Negociação', color: '#facc15', icon: 'ph-handshake' },
            { id: 'fechado', label: 'Fechado', color: '#22c55e', icon: 'ph-check-circle' },
            { id: 'perdido', label: 'Perdido', color: '#ef4444', icon: 'ph-x-circle' }
        ];

        // Agrupa por PTC/orçamento (origemId) para métricas no nível do projeto
        const projetoMap = new Map();
        itens.forEach(item => {
            const key = item.origemId || item.id;
            if (!projetoMap.has(key)) {
                projetoMap.set(key, { origemId: key, statuses: [], valor: 0 });
            }
            const e = projetoMap.get(key);
            e.statuses.push(item.status);
            if (item.tipo === 'comercial' && item.valor) e.valor = item.valor;
            else if (!e.valor) e.valor = item.valor || 0;
        });
        const projetos = Array.from(projetoMap.values()).map(p => ({
            ...p,
            projectStatus: p.statuses.some(s => s === 'fechado') ? 'fechado'
                : p.statuses.every(s => s === 'perdido') ? 'perdido' : 'ativo'
        }));
        const ativos = projetos.filter(p => p.projectStatus !== 'perdido');
        const valorPipeline = ativos.reduce((s, p) => s + p.valor, 0);
        const fechados = projetos.filter(p => p.projectStatus === 'fechado').length;
        const valorFechados = projetos.filter(p => p.projectStatus === 'fechado').reduce((s, p) => s + p.valor, 0);
        const taxaConv = projetos.length > 0 ? Math.round(fechados / projetos.length * 100) : 0;
        const ticketMedio = fechados > 0 ? Math.round(valorFechados / fechados) : 0;

        let html = `
            <div style="display:flex;gap:16px;margin-bottom:20px;flex-shrink:0;">
                <div class="card" style="flex:1;padding:16px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;color:#6366f1;">${ativos.length}</div>
                    <div style="font-size:12px;color:#64748b;">Itens Ativos</div>
                </div>
                <div class="card" style="flex:1;padding:16px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;color:#22c55e;">R$ ${valorPipeline.toLocaleString()}</div>
                    <div style="font-size:12px;color:#64748b;">Valor em Pipeline</div>
                </div>
                <div class="card" style="flex:1;padding:16px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;color:#3b82f6;">${taxaConv}%</div>
                    <div style="font-size:12px;color:#64748b;">Taxa de Conversão</div>
                </div>
                <div class="card" style="flex:1;padding:16px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;color:#8b5cf6;">R$ ${ticketMedio.toLocaleString()}</div>
                    <div style="font-size:12px;color:#64748b;">Ticket Médio</div>
                </div>
            </div>
            <div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:20px;height:calc(100% - 120px);">
        `;

        stages.forEach(stage => {
            const stageItens = itens.filter(i => i.status === stage.id);
            const stageTotal = stageItens.reduce((s, i) => s + (i.valor || 0), 0);
            const collapsed = this._columnsCollapsed[stage.id];

            html += `
                <div class="pipeline-column" data-stage="${stage.id}" style="flex:0 0 ${collapsed ? '50' : '280'}px;min-width:${collapsed ? '50' : '280'}px;background:#f1f5f9;border-radius:8px;display:flex;flex-direction:column;max-height:100%;${collapsed ? 'overflow:hidden;' : ''}">
                    <div style="padding:12px 16px;border-bottom:3px solid ${stage.color};display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px 8px 0 0;flex-shrink:0;${collapsed ? 'writing-mode:vertical-rl;text-orientation:mixed;justify-content:center;gap:8px;padding:12px 8px;' : ''}">
                        <div style="display:flex;align-items:center;gap:8px;${collapsed ? 'flex-direction:column;' : ''}">
                            <i class="ph ${stage.icon}" style="color:${stage.color};font-size:18px;cursor:pointer;" onclick="app.pipelineComercial.toggleColumn('${stage.id}')" title="${collapsed ? 'Expandir' : 'Recolher'}"></i>
                            ${collapsed ? '' : `<span style="font-weight:700;font-size:14px;">${stage.label}</span>`}
                        </div>
                        ${collapsed ? '' : `
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-size:11px;color:#64748b;">R$ ${stageTotal.toLocaleString()}</span>
                                <span style="background:${stage.color}20;color:${stage.color};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;">${stageItens.length}</span>
                            </div>
                        `}
                    </div>
                    ${collapsed ? '' : `
                        <div class="pipeline-dropzone" style="flex:1;overflow-y:auto;padding:8px;min-height:100px;">
                            ${stageItens.length === 0 ? '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">Arraste itens para cá</div>' : ''}
                            ${stageItens.map(item => this._renderCard(item)).join('')}
                        </div>
                        <div style="padding:8px 16px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;background:#f8fafc;border-radius:0 0 8px 8px;flex-shrink:0;">
                            Total: R$ ${stageTotal.toLocaleString()}
                        </div>
                    `}
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        this._setupDragAndDrop();
    },

    toggleColumn(stageId) {
        this._columnsCollapsed[stageId] = !this._columnsCollapsed[stageId];
        this.renderKanban();
    },

    _renderCard(item) {
        const stageColors = { prospect: '#6366f1', elaboracao: '#f59e0b', enviado: '#94a3b8', negociacao: '#facc15', fechado: '#22c55e', perdido: '#ef4444' };
        const color = stageColors[item.status] || '#94a3b8';
        const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
        const daysInactive = item.ultimoContato ? this._daysSince(item.ultimoContato) : this._daysSince(item.createdAt);
        const heatColor = this._heatColor(daysInactive);
        const hasFollowup = item.proximoFollowup && new Date(item.proximoFollowup) > new Date();
        const isOverdue = item.proximoFollowup && new Date(item.proximoFollowup) <= new Date();
        const tipo = item.tipo || 'tecnica_comercial';
        const tipoLabels = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };
        const tipoColors = { tecnica: '#3b82f6', comercial: '#22c55e', tecnica_comercial: '#8b5cf6' };
        const tipoBadge = `<span style="background:${tipoColors[tipo]}15;color:${tipoColors[tipo]};padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;">${tipoLabels[tipo] || tipo}</span>`;
        const base = item.origemId ? (window.app.formatProposalCode ? window.app.formatProposalCode(item.origemId) : item.origemId) : '';
        const revStr = item.revisao !== undefined && item.revisao !== null ? `_R${String(item.revisao).padStart(2, '0')}` : '';
        const codigo = base ? `${base}_${tipoLabels[tipo] || tipo}${revStr}` : '';
        const showIniciarPco = false;
        const podeSubirRev = item.status !== 'fechado' && item.status !== 'perdido' && item.status !== 'elaboracao' && store.getUserLevel() !== 'vendedor';

        return `
            <div class="pipeline-card" draggable="true" data-id="${item.id}" onclick="app.pipelineComercial.openItemModal('${item.id}')"
                 style="background:white;border-radius:6px;padding:12px;margin-bottom:8px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-left:4px solid ${color};transition:box-shadow 0.2s;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    ${codigo ? `<span style="font-size:11px;font-weight:700;color:#1e293b;">${codigo}</span>` : ''}
                    ${tipoBadge}
                    ${item.consolidada ? `<span style="background:#facc1515;color:#b45309;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;"><i class="ph ph-check"></i> Consolidada</span>` : ''}
                </div>
                <div style="font-weight:600;font-size:13px;margin-bottom:2px;display:flex;align-items:center;justify-content:space-between;">
                    <span>${item.cliente}</span>
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${heatColor};flex-shrink:0;" title="${daysInactive !== null ? `${daysInactive} dias sem contato` : 'Sem contato registrado'}"></span>
                </div>
                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">${item.projeto || '—'}</div>
                <div style="font-size:11px;color:#b45309;margin-bottom:4px;"><i class="ph ph-user-circle"></i> <strong>Vend.:</strong> ${item.vendedor || '—'}</div>
                <div style="font-size:11px;color:#6366f1;margin-bottom:4px;"><i class="ph ph-user-gear"></i> <strong>Eng. Resp.:</strong> ${item.engenheiro_responsavel || '—'}</div>
                <div style="font-size:11px;color:#475569;margin-bottom:2px;"><strong>Data Abertura:</strong> ${date}</div>
                <div style="font-size:11px;color:#475569;margin-bottom:4px;"><strong>Data Entrega:</strong> ${item.data_entrega ? item.data_entrega.split('-').reverse().join('/') : '—'}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;margin-top:6px;gap:4px;flex-wrap:wrap;">
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        ${podeSubirRev ? (item.status === 'prospect'
                            ? `<button class="btn btn-sm" onclick="event.stopPropagation();app.pipelineComercial.openEngenheiroSelector('${item.id}')" style="padding:2px 8px;font-size:10px;background:${item.engenheiro_responsavel ? '#6366f1' : '#ef4444'};color:white;border:none;border-radius:4px;cursor:pointer;"><i class="ph ph-user-gear"></i> ${item.engenheiro_responsavel ? 'Eng. Resp. OK' : 'Eng. Resp.??'}</button>`
                            : `<button class="btn btn-sm" onclick="event.stopPropagation();app.pipelineComercial.openRevisionModal('${item.id}')" style="padding:2px 8px;font-size:10px;background:#6366f1;color:white;border:none;border-radius:4px;cursor:pointer;"><i class="ph ph-arrow-up"></i> Subir Revisão</button>`
                        ) : ''}
                        ${item.origemId ? `<button class="btn btn-sm" onclick="event.stopPropagation();app.pipelineComercial.openRevisionLogModal('${item.id}')" style="padding:2px 8px;font-size:10px;background:#78716c;color:white;border:none;border-radius:4px;cursor:pointer;"><i class="ph ph-notebook"></i> Ver Log</button>` : ''}
                        ${showIniciarPco ? `<button class="btn btn-sm" onclick="event.stopPropagation();app.pipelineComercial.iniciarPropostaComercial('${item.id}')" style="padding:2px 8px;font-size:10px;background:#22c55e;color:white;border:none;border-radius:4px;cursor:pointer;"><i class="ph ph-plus"></i> Iniciar PCO</button>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        ${tipo !== 'tecnica' ? `<span style="font-weight:700;color:#1e293b;font-size:12px;">R$ ${(item.valor || 0).toLocaleString()}</span>` : ''}
                        ${isOverdue ? `<span style="color:#ef4444;font-weight:700;"><i class="ph ph-warning-circle"></i> Vencido</span>` : hasFollowup ? `<span style="color:#6366f1;"><i class="ph ph-bell"></i> ${new Date(item.proximoFollowup).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    _temItemComercial(origemId) {
        if (!origemId) return false;
        const items = store.getState().pipelineItems || [];
        return items.some(i =>
            i.origemId && i.origemId.trim().toLowerCase() === origemId.trim().toLowerCase() &&
            i.tipo === 'comercial'
        );
    },

    _setupDragAndDrop() {
        // Disable drag-and-drop for vendedor users
        if (store.getUserLevel() === 'vendedor') return;

        if (window.Sortable) {
            document.querySelectorAll('.pipeline-dropzone').forEach(el => {
                Sortable.create(el, {
                    group: 'pipeline',
                    animation: 200,
                    ghostClass: 'opacity-30',
                    onEnd: (evt) => {
                        const stage = evt.to.closest('.pipeline-column').dataset.stage;
                        const id = evt.item.dataset.id;
                        this.updateStatus(id, stage);
                    }
                });
            });
        }
    },

    updateStatus(id, newStatus) {
        const state = store.getState();
        const item = (state.pipelineItems || []).find(i => String(i.id) === String(id));

        if (item) {
            if (item.status === 'fechado') {
                window.app.toast('Proposta Fechada', 'error');
                this.renderKanban();
                return;
            }
            const stageOrder = ['prospect', 'elaboracao', 'enviado', 'negociacao', 'fechado', 'perdido'];
            const currentIdx = stageOrder.indexOf(item.status);
            const targetIdx = stageOrder.indexOf(newStatus);
            if (targetIdx >= 0 && targetIdx < currentIdx) {
                window.app.toast('Não é permitido retroceder o cartão manualmente.', 'error');
                this.renderKanban();
                return;
            }
            const oldStatus = item.status;
            if (item.consolidada && newStatus === 'enviado') {
                newStatus = 'negociacao';
            }
            item.status = newStatus;
            store.setState({ pipelineItems: state.pipelineItems.map(i => String(i.id) === String(id) ? item : i) });
            const syncData = { status: newStatus };
            if (item.interacoes) syncData.interacoes = JSON.stringify(item.interacoes);
            store._syncUpdate('pipelineItems', id, syncData);

            const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
            const oldLabel = stageLabels[oldStatus] || oldStatus;
            const newLabel = stageLabels[newStatus] || newStatus;
            const rev = item.revisao ?? 0;
            const padRev = (rev !== undefined && rev !== null && rev !== '') ? String(rev).padStart(2, '0') : '';
            let actionDesc;
            if (newStatus === 'enviado') {
                actionDesc = 'Proposta Enviada ao Cliente';
            } else if (newStatus === 'negociacao') {
                actionDesc = 'Proposta Em Negociação';
            } else if (newStatus === 'fechado') {
                actionDesc = 'Fechado ✅';
            } else if (newStatus === 'perdido') {
                actionDesc = 'Perdido 🚫';
            } else if (oldStatus === 'prospect' && newStatus === 'elaboracao') {
                actionDesc = padRev ? `Início de Elaboração da Rev${padRev}` : 'Início de Elaboração';
            } else if (oldStatus === 'enviado' && newStatus === 'prospect') {
                actionDesc = padRev ? `Proposta Enviada para Rev${padRev}` : 'Proposta Enviada';
            } else {
                actionDesc = `Proposta movida de ${oldLabel} para ${newLabel}`;
            }
            this._logPipelineAction(id, 'movimentacao', actionDesc);

            // Sync irmão PT ↔ PC quando fechado/perdido
            if ((newStatus === 'fechado' || newStatus === 'perdido') && item.origemId && (item.tipo === 'tecnica' || item.tipo === 'comercial')) {
                const irmaoTipo = item.tipo === 'tecnica' ? 'comercial' : 'tecnica';
                const irmao = (state.pipelineItems || []).find(i =>
                    i.origemId === item.origemId && i.tipo === irmaoTipo && String(i.id) !== String(id)
                );
                if (irmao) {
                    irmao.status = newStatus;
                    store.setState({ pipelineItems: state.pipelineItems.map(i => String(i.id) === String(irmao.id) ? irmao : i) });
                    store._syncUpdate('pipelineItems', irmao.id, { status: newStatus });
                    this._logPipelineAction(irmao.id, 'movimentacao', `${actionDesc} (sincronizada com irmão)`);
                }
            }
        } else {
            const orc = (state.orcamentos || []).find(o => String(o.id) === String(id));
            if (orc) {
                const statusMap = { elaboracao: 'Em Elaboração', enviado: 'Enviado', fechado: 'Aprovado', perdido: 'Perdido' };
                orc.status = statusMap[newStatus] || orc.status;
                store.setState({ orcamentos: state.orcamentos.map(o => String(o.id) === String(id) ? orc : o) });
                store._syncUpdate('orcamentos', id, { status: orc.status });
            }
        }
    },

    deleteItem(id) {
        if (!confirm('Tem certeza que deseja excluir este cartão do pipeline?')) return;
        const state = store.getState();
        const items = state.pipelineItems || [];
        const idx = items.findIndex(i => String(i.id) === String(id));
        if (idx === -1) { window.app.toast('Item não encontrado.', 'error'); return; }
        this._logPipelineAction(id, 'exclusao', 'Proposta Excluída');
        items.splice(idx, 1);
        store.setState({ pipelineItems: [...items] });
        store._syncDelete('pipelineItems', id);
        window.app.toast('Cartão excluído.', 'success');
        if (window.app.updatePipelineBadge) window.app.updatePipelineBadge();
        document.querySelectorAll('.pipeline-modal-overlay').forEach(el => el.remove());
        this.renderKanban();
    },

    openRevisionModal(id) {
        const state = store.getState();
        const item = (state.pipelineItems || []).find(i => String(i.id) === String(id));
        if (!item) return;

        const tipo = item.tipo || 'tecnica_comercial';
        const tipoLabel = { tecnica: 'Proposta Técnica', comercial: 'Proposta Comercial', tecnica_comercial: 'Proposta Completa' }[tipo] || 'Proposta';
        const tipoAbr = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' }[tipo] || '';
        const base = window.app.formatProposalCode ? window.app.formatProposalCode(item.origemId) : (item.origemId || '');
        const revStr = item.revisao !== undefined && item.revisao !== null ? `_R${String(item.revisao).padStart(2, '0')}` : '';
        const codigo = base ? `${base}_${tipoAbr}${revStr}` : (item.origemId || '');
        const novaRev = (item.revisao || 0) + 1;
        const jaConsolidada = item.consolidada;

        const overlay = document.createElement('div');
        overlay.className = 'pipeline-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:520px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;"><i class="ph ph-arrow-up"></i> Subir Revisão</h3>
                    <button type="button" class="btn btn-ghost" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                </div>
                <form id="form-revisao" onsubmit="event.preventDefault();app.pipelineComercial.subirRevisao('${item.id}')" style="padding:20px;">
                    <div style="margin-bottom:16px;">
                        <label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;">${tipoLabel}</label>
                        <div style="font-size:16px;font-weight:700;">${codigo}</div>
                    </div>
                    <div style="margin-bottom:16px;">
                        <label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;">Nova Revisão</label>
                        <div style="font-size:24px;font-weight:800;color:#6366f1;">Rev${String(novaRev).padStart(2, '0')}</div>
                    </div>
                    <div style="margin-bottom:16px;">
                        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Descrição da Revisão</label>
                        <textarea id="descricao-revisao" class="form-control" rows="4" maxlength="1000" placeholder="Descreva os detalhes esperados nesta revisão..." style="resize:vertical;width:100%;">${(item.descricao_revisao || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                    </div>
                    <div style="margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:6px;">
                        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                            <input type="checkbox" id="chk-consolidada" ${jaConsolidada ? 'checked' : ''}>
                            <div>
                                <div style="font-weight:600;font-size:13px;">Consolidada</div>
                                <div style="font-size:11px;color:#64748b;">${jaConsolidada ? 'Já consolidada — permanecerá em Negociação.' : 'Ao marcar, o cartão irá para Negociação.'}</div>
                            </div>
                        </label>
                    </div>
                    <div style="margin-bottom:16px;">
                        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Data Entrega</label>
                        <input type="date" id="rev-data-entrega" class="form-control" value="${item.data_entrega ? item.data_entrega.slice(0, 10) : ''}">
                    </div>
                    <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--color-border);">
                        <button type="button" class="btn btn-cancel" onclick="this.closest('.pipeline-modal-overlay').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="background:#6366f1;border-color:#6366f1;"><i class="ph ph-arrow-up"></i> Subir para Rev${String(novaRev).padStart(2, '0')}</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    subirRevisao(id) {
        const state = store.getState();
        const items = state.pipelineItems || [];
        const idx = items.findIndex(i => String(i.id) === String(id));
        if (idx === -1) { window.app.toast('Item não encontrado.', 'error'); return; }

        const item = items[idx];
        if (item.status === 'fechado') {
            window.app.toast('Proposta Fechada não pode ter revisão subida.', 'error');
            return;
        }
        const consolidadaCheck = document.getElementById('chk-consolidada');
        const consolidada = consolidadaCheck ? consolidadaCheck.checked : false;
        const dataEntrega = document.getElementById('rev-data-entrega')?.value || item.data_entrega || '';
        const descricaoRevisao = document.getElementById('descricao-revisao')?.value || '';
        const novaRev = (item.revisao || 0) + 1;

        let novoStatus;
        if (item.status === 'negociacao') {
            novoStatus = 'prospect';
        } else if (consolidada) {
            novoStatus = 'negociacao';
        } else {
            novoStatus = 'prospect';
        }

        const updated = {
            ...item,
            revisao: novaRev,
            consolidada: consolidada ? 1 : 0,
            status: novoStatus,
            data_entrega: dataEntrega,
            descricao_revisao: descricaoRevisao,
            engenheiro_responsavel: '',
            updatedAt: new Date().toISOString()
        };
        items[idx] = updated;
        store.setState({ pipelineItems: [...items] });

        store._syncUpdate('pipelineItems', id, {
            revisao: novaRev,
            consolidada: consolidada ? 1 : 0,
            status: novoStatus,
            data_entrega: dataEntrega,
            descricao_revisao: descricaoRevisao,
            updatedAt: updated.updatedAt
        });

        const msg = consolidada
            ? `Revisão ${novaRev} consolidada — cartão movido para Negociação.`
            : `Proposta Enviada para Rev${String(novaRev).padStart(2, '0')}`;
        window.app.toast(msg, 'success');

        // Criar pastas de revisão no servidor (sempre que houver ptcFolder)
        const ptcFolder = item.origemId;
        if (ptcFolder) {
            const _tkUP551 = store.getState().auth?.token;
            fetch(`http://${location.hostname}:8082/api/uprevision-ptc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(_tkUP551 ? { 'Authorization': 'Bearer ' + _tkUP551 } : {}) },
                body: JSON.stringify({ ptcFolder, revisionNum: novaRev })
            }).catch(err => console.warn('[Pipeline] Erro ao subir revisão no servidor:', err));

            // Atualizar currentPtc.revision se estivermos no mesmo PTC
            if (window.app.currentPtc && window.app.currentPtc.folder === ptcFolder) {
                const revFolder = `Rev${String(novaRev).padStart(2, '0')}`;
                window.app.currentPtc.revision = revFolder;
                window.app.currentPtc.revisionNum = novaRev;
            }
        }

        // Escrever log no servidor (apenas para PTCs)
        if (ptcFolder && (item.origem === 'ptc' || item.origem === 'proposta_comercial')) {
            const token = store.getState().auth?.token;
            fetch(`http://${location.hostname}:8082/api/pipeline-log-revision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    ptcFolder,
                    revisionData: {
                        item_tipo: item.tipo,
                        descricao: `Revisão subida para ${String(novaRev).padStart(2, '0')}`,
                        revisao: novaRev,
                        cliente: updated.cliente,
                        projeto: updated.projeto,
                        valor: updated.valor,
                        descricao_revisao: descricaoRevisao,
                        consolidada: consolidada ? 1 : 0,
                        vendedor: item.vendedor || '',
                        engenheiro_responsavel: updated.engenheiro_responsavel || '',
                        data_entrega: dataEntrega,
                        observacoes: item.observacoes || '',
                        status: novoStatus,
                        interacoes: item.interacoes || [],
                        createdAt: item.createdAt,
                        ultimoContato: item.ultimoContato || ''
                    }
                })
            }).catch(err => console.warn('[Pipeline] Erro ao escrever log de revisão:', err));
        }

        document.querySelectorAll('.pipeline-modal-overlay').forEach(el => el.remove());
        this.renderKanban();
    },

    async openRevisionLogModal(id) {
        const state = store.getState();
        const item = (state.pipelineItems || []).find(i => String(i.id) === String(id));
        if (!item) { window.app.toast('Item não encontrado.', 'error'); return; }

        const ptcFolder = item.origemId;
        if (!ptcFolder) { window.app.toast('Este cartão não possui pasta PTC associada.', 'error'); return; }

        const token = state.auth?.token;
        let logs = [];
        try {
            const res = await fetch(`http://${location.hostname}:8082/api/pipeline-log-revisions?ptcFolder=${encodeURIComponent(ptcFolder)}`, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            const data = await res.json();
            if (data.success) {
                logs = (data.logs || [])
                    .filter(log => log.item_tipo === item.tipo)
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
        } catch (err) {
            console.warn('[Pipeline] Erro ao carregar logs:', err);
            window.app.toast('Erro ao carregar logs.', 'error');
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'pipeline-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
        const tipoLabelsPtc = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };
        const ptcLabel = tipoLabelsPtc[item.tipo] || 'PT';
        const ptcCode = window.app.formatProposalCode ? window.app.formatProposalCode(item.origemId) : item.origemId;
        const ptcDisplay = `${ptcCode}-${ptcLabel}`;
        const showValor = item.tipo !== 'tecnica';

        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:1000px;max-width:95vw;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;"><i class="ph ph-notebook"></i> Log das Revisões — ${item.cliente}</h3>
                    <div style="display:flex;gap:6px;">
                        ${logs.length > 0 ? `<button type="button" class="btn btn-sm btn-secondary" onclick="app.pipelineComercial._exportRevisionLogCSV('${item.id}')" style="display:flex;align-items:center;gap:4px;"><i class="ph ph-file-csv"></i> CSV</button>` : ''}
                        ${logs.length > 0 ? `<button type="button" class="btn btn-sm btn-secondary" onclick="app.pipelineComercial._exportRevisionLogXLSX('${item.id}')" style="display:flex;align-items:center;gap:4px;"><i class="ph ph-file-xls"></i> XLSX</button>` : ''}
                        <button type="button" class="btn btn-ghost" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                    </div>
                </div>
                <div style="flex:1;overflow-y:auto;padding:20px;">
                    ${logs.length === 0 ? `
                        <div style="padding:40px;text-align:center;color:#94a3b8;">
                            <i class="ph ph-notebook" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                            <br>Nenhum log encontrado.
                            <br>Os logs são gerados automaticamente ao mover, editar ou interagir com os cartões.
                        </div>
                    ` : `
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <thead>
                                <tr style="background:#f8fafc;">
                                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">PTC</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Rev</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Data/Hora</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Ação feita na Proposta</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Eng. Resp.</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Status</th>
                                    ${showValor ? '<th style="padding:10px 12px;text-align:right;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Valor</th>' : ''}
                                    <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Consolidada</th>
                                    <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;">Prazo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.map(log => {
                                    const revDisplay = `<span style="font-weight:700;color:#6366f1;">${log.revisao != null ? String(log.revisao).padStart(2, '0') : '00'}</span>`;
                                    const descDisplay = log.descricao || log.descricao_revisao || '—';
                                    const engDisplay = log.engenheiro_responsavel || log.usuario || '—';
                                    const statusDisplay = stageLabels[log.status] || log.status || '—';
                                    const statusBg = log.consolidada ? '#fef3c7' : '#e2e8f0';
                                    const statusColor = log.consolidada ? '#92400e' : '#475569';
                                    return `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:10px 12px;color:#475569;font-weight:600;font-size:11px;">${ptcDisplay}</td>
                                        <td style="padding:10px 12px;">${revDisplay}</td>
                                        <td style="padding:10px 12px;color:#64748b;white-space:nowrap;">${log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '—'}</td>
                                        <td style="padding:10px 12px;color:#334155;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${(descDisplay).replace(/"/g, '&quot;')}">${descDisplay}</td>
                                        <td style="padding:10px 12px;color:#64748b;">${engDisplay}</td>
                                        <td style="padding:10px 12px;"><span style="background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;white-space:nowrap;">${statusDisplay}</span></td>
                                        ${showValor ? '<td style="padding:10px 12px;text-align:right;font-weight:600;">R$ ' + (log.valor || 0).toLocaleString() + '</td>' : ''}
                                        <td style="padding:10px 12px;text-align:center;">${log.consolidada ? '<span style="color:#16a34a;"><i class="ph ph-check-circle" style="font-size:16px;"></i></span>' : '<span style="color:#94a3b8;">—</span>'}</td>
                                        <td style="padding:10px 12px;text-align:center;font-size:11px;">${(function(p){try{return PipelineComercialModule._calcularPrazo(p).html}catch(e){return '—'}})(log.data_entrega)}</td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async _exportRevisionLogCSV(id) {
        const item = (store.getState().pipelineItems || []).find(i => String(i.id) === String(id));
        const logs = (await this._fetchLogsForItem(id))
            .filter(log => log.item_tipo === item?.tipo)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (!logs || logs.length === 0) { window.app.toast('Nenhum log disponível.', 'error'); return; }
        const tipoLabelsPtc = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };
        const ptcLabel = tipoLabelsPtc[item?.tipo] || 'PT';
        const ptcDisplay = item ? `${(window.app.formatProposalCode ? window.app.formatProposalCode(item.origemId) : item.origemId)}-${ptcLabel}` : '';
        const showValor = item?.tipo !== 'tecnica';
        const header = showValor ? 'PTC,Rev,Data/Hora,Ação feita na Proposta,Eng.Resp.,Status,Valor,Consolidada,Prazo' : 'PTC,Rev,Data/Hora,Ação feita na Proposta,Eng.Resp.,Status,Consolidada,Prazo';
        const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
        const rows = logs.map(l => {
            const data = l.timestamp ? new Date(l.timestamp).toLocaleString('pt-BR') : '';
            const rev = l.revisao != null ? String(l.revisao).padStart(2, '0') : '00';
            const desc = (l.descricao || l.descricao_revisao || '').replace(/"/g, '""');
            const engResp = (l.engenheiro_responsavel || l.usuario || '').replace(/"/g, '""');
            const status = (stageLabels[l.status] || l.status || '').replace(/"/g, '""');
            const valor = (l.valor || 0).toLocaleString();
            const consol = l.consolidada ? 'Sim' : 'Não';
            const prazo = (function(p){try{return PipelineComercialModule._calcularPrazo(p).text}catch(e){return '—'}})(l.data_entrega);
            if (showValor) {
                return `"${ptcDisplay}","${rev}","${data}","${desc}","${engResp}","${status}","${valor}","${consol}","${prazo}"`;
            }
            return `"${ptcDisplay}","${rev}","${data}","${desc}","${engResp}","${status}","${consol}","${prazo}"`;
        }).join('\n');
        const blob = new Blob([header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Log_Revisoes_${(item?.cliente || 'cartao').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        window.app.toast('CSV exportado.', 'success');
    },

    async _exportRevisionLogXLSX(id) {
        const item = (store.getState().pipelineItems || []).find(i => String(i.id) === String(id));
        const logs = (await this._fetchLogsForItem(id))
            .filter(log => log.item_tipo === item?.tipo)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (!logs || logs.length === 0) { window.app.toast('Nenhum log disponível.', 'error'); return; }
        const tipoLabelsPtc = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };
        const ptcLabel = tipoLabelsPtc[item?.tipo] || 'PT';
        const ptcDisplay = item ? `${(window.app.formatProposalCode ? window.app.formatProposalCode(item.origemId) : item.origemId)}-${ptcLabel}` : '';
        try {
            const res = await fetch(`http://${location.hostname}:8082/api/export-pipeline-log-xlsx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs, ptcDisplay, cliente: item?.cliente || 'cartao', tipo: item?.tipo })
            });
            if (!res.ok) { window.app.toast('Erro ao exportar XLSX.', 'error'); return; }
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Log_Revisoes_${(item?.cliente || 'cartao').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(a.href);
            window.app.toast('XLSX exportado.', 'success');
        } catch (err) {
            console.error('[Pipeline] Erro export XLSX:', err);
            window.app.toast('Erro ao exportar XLSX.', 'error');
        }
    },

    async _fetchLogsForItem(id) {
        const state = store.getState();
        const item = (state.pipelineItems || []).find(i => String(i.id) === String(id));
        if (!item || !item.origemId) return [];
        const token = state.auth?.token;
        try {
            const res = await fetch(`http://${location.hostname}:8082/api/pipeline-log-revisions?ptcFolder=${encodeURIComponent(item.origemId)}`, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            const data = await res.json();
            return data.success ? (data.logs || []) : [];
        } catch { return []; }
    },

    _logPipelineAction(id, tipo, descricao) {
        const state = store.getState();
        const item = (state.pipelineItems || []).find(i => String(i.id) === String(id));
        if (!item || !item.origemId) return;
        if (item.origem !== 'ptc' && item.origem !== 'proposta_comercial') return;
        const token = state.auth?.token;
        const usuario = state.auth?.user?.name || '';
        const ptcFolder = item.origemId;
        fetch(`http://${location.hostname}:8082/api/pipeline-log-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: JSON.stringify({
                ptcFolder,
                    actionData: {
                        item_tipo: item.tipo,
                        tipo,
                        descricao,
                        usuario,
                        revisao: item.revisao,
                    cliente: item.cliente,
                    projeto: item.projeto,
                    valor: item.valor,
                    vendedor: item.vendedor || '',
                    engenheiro_responsavel: item.engenheiro_responsavel || '',
                    data_entrega: item.data_entrega || '',
                    observacoes: item.observacoes || '',
                    status: item.status,
                    consolidada: item.consolidada ? 1 : 0,
                    interacoes: item.interacoes || [],
                    createdAt: item.createdAt,
                    ultimoContato: item.ultimoContato || ''
                }
            })
        }).catch(err => console.warn('[Pipeline] Erro ao escrever log de ação:', err));
    },

    async openEngenheiroSelector(id) {
        const state = store.getState();
        const item = (state.pipelineItems || []).find(i => String(i.id) === String(id));
        if (!item) { window.app.toast('Item não encontrado.', 'error'); return; }

        let users;
        try {
            users = await store.fetchUsers();
        } catch (err) {
            window.app.toast('Erro ao carregar usuários: ' + err.message, 'error');
            return;
        }
        const engenheiros = users.filter(u => u.nivel === 'engenheiro' && u.ativo !== false);

        const overlay = document.createElement('div');
        overlay.className = 'pipeline-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:380px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;"><i class="ph ph-user-gear"></i> Engenheiro Responsável</h3>
                    <button type="button" class="btn btn-ghost" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                </div>
                <div style="padding:12px;">
                    ${engenheiros.length === 0 ? '<p style="color:#64748b;text-align:center;">Nenhum engenheiro cadastrado.</p>' : ''}
                    ${engenheiros.map(e => `
                        <button type="button" class="btn" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;margin-bottom:4px;border:1px solid var(--color-border);border-radius:6px;background:${item.engenheiro_responsavel === e.name ? '#eef2ff' : '#fff'};cursor:pointer;text-align:left;font-size:13px;"
                                onclick="app.pipelineComercial.assignEngineer('${id}','${e.name.replace(/'/g, "\\'")}')">
                            <i class="ph ph-user-circle" style="font-size:20px;color:#6366f1;"></i>
                            <div>
                                <div style="font-weight:600;">${e.name}</div>
                                <div style="font-size:11px;color:#64748b;">${e.email}</div>
                            </div>
                            ${item.engenheiro_responsavel === e.name ? '<i class="ph ph-check" style="margin-left:auto;color:#6366f1;"></i>' : ''}
                        </button>
                    `).join('')}
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--color-border);display:flex;justify-content:flex-end;">
                    <button type="button" class="btn btn-cancel" onclick="this.closest('.pipeline-modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Expose helper inline
            window.app.pipelineComercial.assignEngineer = (aid, name) => {
                const s = store.getState();
                const items = [...(s.pipelineItems || [])];
                const i = items.findIndex(x => String(x.id) === String(aid));
                if (i === -1) return;
                items[i] = { ...items[i], engenheiro_responsavel: name, updatedAt: new Date().toISOString() };
                store.setState({ pipelineItems: items });
                store._syncUpdate('pipelineItems', aid, { engenheiro_responsavel: name, updatedAt: items[i].updatedAt });
                window.app.toast(`Engenheiro responsável: ${name}`, 'success');
                document.querySelectorAll('.pipeline-modal-overlay').forEach(el => el.remove());
                this.renderKanban();
                this._logPipelineAction(aid, 'atribuicao_eng', `Engenheiro responsável: ${name}`);
            };
    },

    iniciarPropostaComercial(id) {
        const state = store.getState();
        const items = state.pipelineItems || [];
        const item = items.find(i => String(i.id) === String(id));
        if (!item) return;

        if (window.app.iniciarPropostaComercial) {
            window.app.iniciarPropostaComercial(item.origemId, item.cliente, item.projeto, item.vendedor, item.id);
        }
    },

    bulkCleanup() {
        const state = store.getState();
        const overlay = document.createElement('div');
        overlay.className = 'pipeline-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:460px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;"><i class="ph ph-trash" style="color:#ef4444;"></i> Limpar Cartões Antigos</h3>
                    <button type="button" class="btn btn-ghost" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                </div>
                <form id="form-bulk-cleanup" onsubmit="event.preventDefault();app.pipelineComercial._executeBulkCleanup()" style="padding:20px;">
                    <p style="font-size:13px;color:#64748b;margin:0 0 16px 0;">Selecione os critérios para remover cartões em lote. Cartões vindos de orçamentos não serão removidos.</p>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <label style="display:flex;align-items:center;gap:10px;padding:10px;background:#fef2f2;border-radius:6px;cursor:pointer;">
                            <input type="checkbox" name="criteria" value="perdido" checked>
                            <div>
                                <div style="font-weight:600;font-size:13px;">Status "Perdido"</div>
                                <div style="font-size:11px;color:#64748b;">Remove todos os cartões com status "Perdido"</div>
                            </div>
                        </label>
                        <label style="display:flex;align-items:center;gap:10px;padding:10px;background:#fffbeb;border-radius:6px;cursor:pointer;">
                            <input type="checkbox" name="criteria" value="inactive">
                            <div>
                                <div style="font-weight:600;font-size:13px;">Sem contato há mais de</div>
                                <div style="font-size:11px;color:#64748b;">Cartões sem interação recente</div>
                            </div>
                            <input type="number" name="inactiveDays" class="form-control" value="90" min="1" style="width:80px;margin-left:auto;" onclick="event.stopPropagation()">
                            <span style="font-size:12px;color:#64748b;">dias</span>
                        </label>
                        <label style="display:flex;align-items:center;gap:10px;padding:10px;background:#f0fdf4;border-radius:6px;cursor:pointer;">
                            <input type="checkbox" name="criteria" value="old">
                            <div>
                                <div style="font-weight:600;font-size:13px;">Criado há mais de</div>
                                <div style="font-size:11px;color:#64748b;">Cartões antigos sem atualização</div>
                            </div>
                            <input type="number" name="oldDays" class="form-control" value="180" min="1" style="width:80px;margin-left:auto;" onclick="event.stopPropagation()">
                            <span style="font-size:12px;color:#64748b;">dias</span>
                        </label>
                    </div>
                    <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:6px;font-size:12px;color:#64748b;">
                        <span id="cleanup-preview">0 cartão(ões) serão removidos.</span>
                    </div>
                    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border);">
                        <button type="button" class="btn btn-cancel" onclick="this.closest('.pipeline-modal-overlay').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-danger" style="background:#ef4444;border-color:#ef4444;color:white;"><i class="ph ph-trash"></i> Limpar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        this._previewBulkCleanup();
        overlay.querySelectorAll('input').forEach(el => el.addEventListener('change', () => this._previewBulkCleanup()));
        overlay.querySelectorAll('input').forEach(el => el.addEventListener('input', () => this._previewBulkCleanup()));
    },

    _previewBulkCleanup() {
        const form = document.getElementById('form-bulk-cleanup');
        if (!form) return;
        const fd = new FormData(form);
        const selected = fd.getAll('criteria');
        const inactiveDays = parseInt(fd.get('inactiveDays')) || 90;
        const oldDays = parseInt(fd.get('oldDays')) || 180;
        const count = this._getCleanupCandidates(selected, inactiveDays, oldDays).length;
        const preview = document.getElementById('cleanup-preview');
        if (preview) preview.textContent = `${count} cartão(ões) serão removidos.`;
    },

    _getCleanupCandidates(selected, inactiveDays, oldDays) {
        const state = store.getState();
        const items = state.pipelineItems || [];
        const now = Date.now();
        return items.filter(item => {
            if (item.origem === 'orcamento') return false;
            if (selected.includes('perdido') && item.status === 'perdido') return true;
            if (selected.includes('inactive')) {
                const ref = item.ultimoContato || item.createdAt;
                if (ref && (now - new Date(ref).getTime()) > inactiveDays * 86400000) return true;
            }
            if (selected.includes('old')) {
                if (item.createdAt && (now - new Date(item.createdAt).getTime()) > oldDays * 86400000) return true;
            }
            return false;
        });
    },

    _executeBulkCleanup() {
        const form = document.getElementById('form-bulk-cleanup');
        if (!form) return;
        const fd = new FormData(form);
        const selected = fd.getAll('criteria');
        const inactiveDays = parseInt(fd.get('inactiveDays')) || 90;
        const oldDays = parseInt(fd.get('oldDays')) || 180;
        const candidates = this._getCleanupCandidates(selected, inactiveDays, oldDays);
        if (candidates.length === 0) { window.app.toast('Nenhum cartão para limpar.', 'info'); return; }
        if (!confirm(`Remover ${candidates.length} cartão(ões) permanentemente?`)) return;
        const state = store.getState();
        const keepIds = new Set((state.pipelineItems || []).map(i => i.id));
        candidates.forEach(c => keepIds.delete(c.id));
        const remaining = (state.pipelineItems || []).filter(i => keepIds.has(i.id));
        store.setState({ pipelineItems: remaining });
        candidates.forEach(c => store._syncDelete('pipelineItems', c.id));
        window.app.toast(`${candidates.length} cartão(ões) removido(s).`, 'success');
        if (window.app.updatePipelineBadge) window.app.updatePipelineBadge();
        document.querySelectorAll('.pipeline-modal-overlay').forEach(el => el.remove());
        this.renderKanban();
    },

    async syncOrphans() {
        const state = store.getState();
        const items = state.pipelineItems || [];
        try {
            const _tkPC1000 = store.getState().auth?.token;
            const res = await fetch('/api/list-ptcs', { headers: { ...(_tkPC1000 ? { 'Authorization': 'Bearer ' + _tkPC1000 } : {}) } });
            const data = await res.json();
            if (!data.success) { window.app.toast('Erro ao consultar servidor.', 'error'); return; }
            const pastas = new Set((data.ptcs || []).map(p => p.toLowerCase().trim()));
            const orfaos = items.filter(item =>
                (item.origem === 'ptc' || item.origem === 'proposta_comercial') &&
                item.origemId &&
                !pastas.has(item.origemId.toLowerCase().trim())
            );
            if (orfaos.length === 0) { window.app.toast('Nenhum cartão órfão encontrado.', 'info'); return; }
            const msg = `${orfaos.length} cartão(ões) para remover (pasta excluída do servidor).\n` +
                orfaos.slice(0, 10).map(i => `  • ${i.cliente} — ${i.origemId}`).join('\n') +
                (orfaos.length > 10 ? `\n  ... e mais ${orfaos.length - 10}` : '') +
                '\n\nRemover permanentemente?';
            if (!confirm(msg)) return;
            const keepIds = new Set(items.map(i => i.id));
            orfaos.forEach(o => keepIds.delete(o.id));
            const remaining = items.filter(i => keepIds.has(i.id));
            store.setState({ pipelineItems: remaining });
            orfaos.forEach(o => store._syncDelete('pipelineItems', o.id));
            window.app.toast(`${orfaos.length} cartão(ões) órfão(s) removido(s).`, 'success');
            if (window.app.updatePipelineBadge) window.app.updatePipelineBadge();
            this.renderKanban();
        } catch (e) {
            console.error('[Pipeline] syncOrphans error:', e);
            window.app.toast('Erro ao sincronizar: ' + e.message, 'error');
        }
    },

    openItemModal(id) {
        const state = store.getState();
        const item = this.getPipelineData().find(i => i.id === id);
        if (!item) return;

        const clientObj = (state.clientes || []).find(c =>
            c.razaoSocial?.toLowerCase() === item.cliente?.toLowerCase()
        );

        const tipoLabels = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };
        const tipoAbr = tipoLabels[item.tipo] || '';
        const base = item.origemId ? (window.app.formatProposalCode ? window.app.formatProposalCode(item.origemId) : item.origemId) : '';
        const revStr = item.revisao !== undefined && item.revisao !== null ? `_R${String(item.revisao).padStart(2, '0')}` : '';
        const codigoProposta = base ? `${base}_${tipoAbr}${revStr}` : (item.origemId || '');

        const overlay = document.createElement('div');
        overlay.className = 'pipeline-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
        const interacoes = Array.isArray(item.interacoes) ? item.interacoes : [];
        const daysInactive = item.ultimoContato ? this._daysSince(item.ultimoContato) : this._daysSince(item.createdAt);

        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:560px;max-width:90vw;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;">${item.cliente}</h3>
                    <div style="display:flex;gap:6px;">
                        ${store.getUserLevel() !== 'vendedor' && item.origem !== 'orcamento' ? `<button type="button" class="btn btn-sm btn-outline" onclick="app.pipelineComercial.openEditModal('${item.id}');this.closest('.pipeline-modal-overlay').remove()"><i class="ph ph-pencil"></i> Editar</button>` : ''}
                        ${store.getUserLevel() !== 'vendedor' && item.origem !== 'orcamento' ? `<button type="button" class="btn btn-sm btn-outline" style="color:#ef4444;border-color:#ef4444;" onclick="app.pipelineComercial.deleteItem('${item.id}')"><i class="ph ph-trash"></i> Excluir</button>` : ''}
                        <button type="button" class="btn btn-ghost" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                    </div>
                </div>
                <div style="flex:1;overflow-y:auto;padding:20px;">
                    ${item.origemId ? `<div style="margin-bottom:12px;"><label style="font-size:11px;color:#64748b;display:block;">Código da Proposta</label><span style="font-weight:600;font-size:14px;">${codigoProposta}</span></div>` : ''}
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                        <div><label style="font-size:11px;color:#64748b;display:block;">Projeto</label><span style="font-weight:600;">${item.projeto || '—'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Valor</label><span style="font-weight:600;">R$ ${(item.valor || 0).toLocaleString()}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Status</label><span style="font-weight:600;">${stageLabels[item.status] || item.status}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Origem</label><span style="font-weight:600;">${item.origem === 'orcamento' ? 'Orçamento' : 'PTC'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Criado em</label><span style="font-weight:600;">${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Revisão</label><span style="font-weight:600;">Rev ${String(item.revisao ?? 0).padStart(2, '0')}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Vendedor</label><span style="font-weight:600;">${item.vendedor || '—'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Engenheiro Responsável</label><span style="font-weight:600;">${item.engenheiro_responsavel || '—'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Data Entrega</label><span style="font-weight:600;">${item.data_entrega ? item.data_entrega.split('-').reverse().join('/') : '—'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Último Contato</label><span style="font-weight:600;">${item.ultimoContato ? new Date(item.ultimoContato).toLocaleDateString() : '—'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Status</label><span style="font-weight:600;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${this._heatColor(daysInactive)};margin-right:4px;"></span>${daysInactive !== null ? `${daysInactive}d sem contato` : 'Sem contato'}</span></div>
                        <div><label style="font-size:11px;color:#64748b;display:block;">Próx. Follow-up</label><span style="font-weight:600;">${item.proximoFollowup ? new Date(item.proximoFollowup).toLocaleDateString() : '—'}</span></div>
                    </div>
                    ${item.observacoes ? `<div style="margin-top:12px;"><label style="font-size:11px;color:#64748b;display:block;">Observações</label><p style="font-size:13px;margin:4px 0 0;color:#334155;">${item.observacoes}</p></div>` : ''}
                    ${item.descricao_revisao ? `<div style="margin-top:12px;"><label style="font-size:11px;color:#64748b;display:block;">Descrição da Revisão</label><p style="font-size:13px;margin:4px 0 0;color:#334155;">${item.descricao_revisao}</p></div>` : ''}
                    ${clientObj ? `
                        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border);">
                            <h4 style="font-size:13px;font-weight:600;margin:0 0 8px 0;">Contato</h4>
                            <p style="font-size:12px;color:#64748b;margin:2px 0;">${clientObj.email || ''}${clientObj.telefone ? ' | ' + clientObj.telefone : ''}</p>
                            ${clientObj.contatoNome ? `<p style="font-size:12px;color:#64748b;margin:2px 0;">Contato: ${clientObj.contatoNome}${clientObj.contatoCargo ? ' — ' + clientObj.contatoCargo : ''}</p>` : ''}
                        </div>
                    ` : ''}
                    ${item.origem === 'orcamento' ? `
                        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border);">
                            <button type="button" class="btn btn-sm btn-outline" onclick="app.navigateTo('orcamentos');this.closest('.pipeline-modal-overlay').remove()">
                                <i class="ph ph-calculator"></i> Abrir Orçamento
                            </button>
                        </div>
                    ` : ''}
                    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border);">
                        <h4 style="font-size:13px;font-weight:600;margin:0 0 12px 0;">Registrar Interação</h4>
                        <form id="form-interacao" onsubmit="event.preventDefault();app.pipelineComercial.registerInteraction('${item.id}')" style="display:flex;flex-direction:column;gap:8px;">
                            <div style="display:flex;gap:8px;">
                                <select name="tipo" class="form-control" style="width:180px;flex-shrink:0;">
                                    <option value="ligacao">Ligação</option>
                                    <option value="email">E-mail</option>
                                    <option value="reuniao">Reunião</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="outro">Outro</option>
                                </select>
                                <input type="date" name="data" class="form-control" style="width:160px;flex-shrink:0;" value="${new Date().toISOString().slice(0, 10)}">
                            </div>
                            <textarea name="descricao" class="form-control" rows="2" placeholder="Descrição da interação..." required></textarea>
                            <div style="display:flex;gap:8px;">
                                <input type="date" name="followup" class="form-control" style="width:160px;flex-shrink:0;" placeholder="Próx. follow-up">
                                <input type="time" name="followupHora" class="form-control" style="width:120px;flex-shrink:0;">
                                <button type="submit" class="btn btn-sm btn-primary" style="background:#6366f1;border-color:#6366f1;">Registrar</button>
                            </div>
                        </form>
                    </div>
                    ${interacoes.length > 0 ? `
                        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border);">
                            <h4 style="font-size:13px;font-weight:600;margin:0 0 12px 0;">Histórico de Interações (${interacoes.length})</h4>
                            <div style="max-height:240px;overflow-y:auto;">
                                ${interacoes.slice().reverse().map((int, idx) => {
                                    const tipoIcon = { ligacao: 'ph-phone', email: 'ph-envelope', reuniao: 'ph-users', whatsapp: 'ph-chat', outro: 'ph-note' };
                                    const tipoLabel = { ligacao: 'Ligação', email: 'E-mail', reuniao: 'Reunião', whatsapp: 'WhatsApp', outro: 'Outro' };
                                    return `
                                        <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
                                            <div style="width:32px;height:32px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                                <i class="ph ${tipoIcon[int.tipo] || 'ph-note'}" style="color:#6366f1;font-size:16px;"></i>
                                            </div>
                                            <div style="flex:1;">
                                                <div style="display:flex;justify-content:space-between;font-size:12px;">
                                                    <span style="font-weight:600;">${tipoLabel[int.tipo] || int.tipo}</span>
                                                    <span style="color:#94a3b8;">${int.data ? new Date(int.data).toLocaleDateString() : ''}</span>
                                                </div>
                                                <p style="font-size:12px;color:#475569;margin:4px 0 0;">${int.descricao}</p>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    openEditModal(id) {
        const state = store.getState();
        const item = (state.pipelineItems || []).find(i => String(i.id) === String(id));
        if (!item) return;

        const overlay = document.createElement('div');
        overlay.className = 'pipeline-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:480px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;">Editar Item do Pipeline</h3>
                    <button type="button" class="btn btn-ghost" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                </div>
                <form id="form-editar-lead" onsubmit="event.preventDefault();app.pipelineComercial.saveEditedLead()" style="padding:20px;">
                    <input type="hidden" name="id" value="${item.id}">
                    <div class="form-group">
                        <label class="form-label">Cliente</label>
                        <input type="text" name="cliente" class="form-control" value="${this._escapeHtml(item.cliente)}" required>
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Projeto</label>
                        <input type="text" name="projeto" class="form-control" value="${this._escapeHtml(item.projeto || '')}">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Valor Estimado</label>
                        <input type="number" name="valor" class="form-control" value="${item.valor || 0}" step="0.01" min="0">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Vendedor</label>
                        <input type="text" name="vendedor" class="form-control" list="edit-pipeline-vendedor-list" value="${this._escapeHtml(item.vendedor || '')}">
                        <datalist id="edit-pipeline-vendedor-list">
                            ${(store.getState().vendedores || []).map(v => `<option value="${this._escapeHtml(v.nome)}">`).join('')}
                        </datalist>
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Observações</label>
                        <textarea name="observacoes" class="form-control" rows="3">${this._escapeHtml(item.observacoes || '')}</textarea>
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Descrição da Revisão</label>
                        <textarea name="descricao_revisao" class="form-control" rows="3">${this._escapeHtml(item.descricao_revisao || '')}</textarea>
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Engenheiro Responsável</label>
                        <input type="text" name="engenheiro_responsavel" class="form-control" value="${this._escapeHtml(item.engenheiro_responsavel || '')}">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Data Entrega</label>
                        <input type="date" name="data_entrega" class="form-control" value="${item.data_entrega ? item.data_entrega.slice(0, 10) : ''}">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Data Último Contato</label>
                        <input type="date" name="ultimoContato" class="form-control" value="${item.ultimoContato ? item.ultimoContato.slice(0, 10) : ''}">
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <label class="form-label">Próximo Follow-up</label>
                        <input type="date" name="proximoFollowup" class="form-control" value="${item.proximoFollowup ? item.proximoFollowup.slice(0, 10) : ''}">
                    </div>
                    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border);">
                        <button type="button" class="btn btn-cancel" onclick="this.closest('.pipeline-modal-overlay').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="background:#6366f1;border-color:#6366f1;">Salvar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    saveEditedLead() {
        try {
            const form = document.getElementById('form-editar-lead');
            if (!form) return;

            const fd = new FormData(form);
            const id = fd.get('id');
            const cliente = fd.get('cliente')?.trim();
            if (!cliente) { window.app.toast('Informe o nome do cliente.', 'warning'); return; }

            const state = store.getState();
            const items = state.pipelineItems || [];
            const idx = items.findIndex(i => String(i.id) === String(id));
            if (idx === -1) { window.app.toast('Item não encontrado.', 'error'); return; }

            const oldItem = items[idx];
            const updated = {
                ...oldItem,
                cliente,
                projeto: fd.get('projeto')?.trim() || oldItem.projeto,
                valor: parseFloat(fd.get('valor')) || oldItem.valor || 0,
                vendedor: fd.get('vendedor')?.trim() || oldItem.vendedor || '',
                observacoes: fd.get('observacoes')?.trim() || '',
                descricao_revisao: fd.get('descricao_revisao')?.trim() || '',
                engenheiro_responsavel: fd.get('engenheiro_responsavel')?.trim() || '',
                data_entrega: fd.get('data_entrega') || null,
                ultimoContato: fd.get('ultimoContato') || oldItem.ultimoContato,
                proximoFollowup: fd.get('proximoFollowup') || oldItem.proximoFollowup
            };
            items[idx] = updated;
            store.setState({ pipelineItems: [...items] });

            const syncData = {
                cliente: updated.cliente,
                projeto: updated.projeto,
                valor: updated.valor,
                vendedor: updated.vendedor,
                observacoes: updated.observacoes,
                descricao_revisao: updated.descricao_revisao,
                engenheiro_responsavel: updated.engenheiro_responsavel,
                data_entrega: updated.data_entrega,
                ultimoContato: updated.ultimoContato,
                proximoFollowup: updated.proximoFollowup
            };
            if (updated.interacoes) syncData.interacoes = JSON.stringify(updated.interacoes);
            store._syncUpdate('pipelineItems', id, syncData);

            const changedFields = [];
            if (updated.cliente !== oldItem.cliente) changedFields.push('cliente');
            if (updated.projeto !== oldItem.projeto) changedFields.push('projeto');
            if (updated.valor !== oldItem.valor) changedFields.push('valor');
            if (updated.vendedor !== oldItem.vendedor) changedFields.push('vendedor');
            if (updated.engenheiro_responsavel !== oldItem.engenheiro_responsavel) changedFields.push('eng. resp.');
            if (updated.data_entrega !== oldItem.data_entrega) changedFields.push('data entrega');
            if (updated.observacoes !== oldItem.observacoes) changedFields.push('observações');
            if (updated.descricao_revisao !== oldItem.descricao_revisao) changedFields.push('descrição revisão');
            if (changedFields.length > 0) {
                this._logPipelineAction(id, 'edicao', `Campos editados: ${changedFields.join(', ')}`);
            }

            window.app.toast('Item atualizado.', 'success');
            if (window.app.updatePipelineBadge) window.app.updatePipelineBadge();

            const overlay = form.closest('.pipeline-modal-overlay');
            if (overlay) overlay.remove();
            this.renderKanban();
        } catch (e) {
            console.error('[Pipeline] saveEditedLead error:', e);
            window.app.toast('Erro ao salvar: ' + e.message, 'error');
        }
    },

    registerInteraction(id) {
        try {
            const form = document.getElementById('form-interacao');
            if (!form) return;

            const fd = new FormData(form);
            const tipo = fd.get('tipo');
            const data = fd.get('data');
            const descricao = fd.get('descricao')?.trim();
            if (!descricao) { window.app.toast('Descreva a interação.', 'warning'); return; }

            const state = store.getState();
            const items = state.pipelineItems || [];
            const idx = items.findIndex(i => String(i.id) === String(id));

            if (idx === -1) {
                window.app.toast('Item não encontrado.', 'error');
                return;
            }

            const interacao = { tipo, data, descricao, registradaEm: new Date().toISOString() };
            const item = items[idx];
            const interacoes = Array.isArray(item.interacoes) ? item.interacoes : [];
            interacoes.push(interacao);

            const followupDate = fd.get('followup');
            let proximoFollowup = item.proximoFollowup;
            if (followupDate) {
                const hora = fd.get('followupHora');
                proximoFollowup = hora ? `${followupDate}T${hora}:00` : `${followupDate}T00:00:00`;
            }

            item.interacoes = interacoes;
            item.ultimoContato = new Date().toISOString();
            item.proximoFollowup = proximoFollowup || item.proximoFollowup;
            items[idx] = item;
            store.setState({ pipelineItems: [...items] });

            const syncData = {
                interacoes: JSON.stringify(interacoes),
                ultimoContato: item.ultimoContato,
                proximoFollowup: item.proximoFollowup
            };
            store._syncUpdate('pipelineItems', id, syncData);

            const tipoLabel = { ligacao: 'ligação', email: 'e-mail', reuniao: 'reunião', whatsapp: 'WhatsApp', outro: 'outro' };
            this._logPipelineAction(id, 'interacao', `Interação (${tipoLabel[tipo] || tipo}): ${descricao}`);

            window.app.toast('Interação registrada.', 'success');
            if (window.app.updatePipelineBadge) window.app.updatePipelineBadge();
            this.openItemModal(id);
        } catch (e) {
            console.error('[Pipeline] registerInteraction error:', e);
            window.app.toast('Erro ao registrar: ' + e.message, 'error');
        }
    },

    exportPipeline() {
        const itens = this.getPipelineData();
        if (itens.length === 0) { window.app.toast('Nenhum item para exportar.', 'warning'); return; }

        const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };

        const rows = itens.map(item => ({
            Cliente: item.cliente,
            Projeto: item.projeto || '',
            'Valor (R$)': item.valor || 0,
            Status: stageLabels[item.status] || item.status,
            Origem: item.origem === 'orcamento' ? 'Orçamento' : 'PTC',
            'Criado em': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
            'Último Contato': item.ultimoContato ? new Date(item.ultimoContato).toLocaleDateString() : '',
            'Próx. Follow-up': item.proximoFollowup ? new Date(item.proximoFollowup).toLocaleDateString() : '',
            Observações: item.observacoes || ''
        }));

        const stageOrder = ['prospect', 'elaboracao', 'enviado', 'negociacao', 'fechado', 'perdido'];
        const stageNames = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };

        const summary = stageOrder.map(id => {
            const total = itens.filter(i => i.status === id).reduce((s, i) => s + (i.valor || 0), 0);
            return { Status: stageNames[id], Itens: itens.filter(i => i.status === id).length, 'Valor Total (R$)': total };
        });

        let csvRows = [];
        csvRows.push('=== PIPELINE COMERCIAL - RESUMO ===');
        csvRows.push('Status,Itens,Valor Total (R$)');
        summary.forEach(r => csvRows.push(`${r.Status},${r.Itens},${r['Valor Total (R$)']}`));
        csvRows.push('');
        csvRows.push('=== ITENS DO PIPELINE ===');
        csvRows.push(Object.keys(rows[0]).join(','));
        rows.forEach(r => csvRows.push(Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')));

        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pipeline_comercial_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.app.toast(`Exportado ${rows.length} itens.`, 'success');
    },

    showPrintOptions() {
        const overlay = document.createElement('div');
        overlay.className = 'pipeline-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div style="background:white;border-radius:8px;width:440px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;"><i class="ph ph-printer"></i> Imprimir</h3>
                    <button type="button" class="btn btn-ghost" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                </div>
                <div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.pipeline-modal-overlay').remove();app.pipelineComercial.printPipeline()" style="padding:14px 20px;font-size:14px;justify-content:flex-start;gap:12px;background:#1e3a5f;border-color:#1e3a5f;">
                        <i class="ph ph-trend-up" style="font-size:20px;"></i> Gestão de Propostas
                        <span style="font-weight:400;font-size:12px;opacity:0.8;margin-left:auto;">KPIs, itens por etapa</span>
                    </button>
                    <button type="button" class="btn btn-primary" onclick="this.closest('.pipeline-modal-overlay').remove();app.pipelineComercial.printRevisionLogs()" style="padding:14px 20px;font-size:14px;justify-content:flex-start;gap:12px;background:#6366f1;border-color:#6366f1;">
                        <i class="ph ph-notebook" style="font-size:20px;"></i> Log das Revisões
                        <span style="font-weight:400;font-size:12px;opacity:0.8;margin-left:auto;">Histórico de ações e revisões</span>
                    </button>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--color-border);display:flex;justify-content:flex-end;">
                    <button type="button" class="btn btn-cancel" onclick="this.closest('.pipeline-modal-overlay').remove()" style="padding:8px 20px;">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    printPipeline() {
        const itens = this.getPipelineData();
        const stages = [
            { id: 'prospect', label: 'Aguardando Início', color: '#6366f1', icon: 'ph-user-plus' },
            { id: 'elaboracao', label: 'Em Elaboração', color: '#f59e0b', icon: 'ph-pencil' },
            { id: 'enviado', label: 'Proposta Enviada', color: '#3b82f6', icon: 'ph-paper-plane' },
            { id: 'negociacao', label: 'Negociação', color: '#facc15', icon: 'ph-handshake' },
            { id: 'fechado', label: 'Fechado', color: '#22c55e', icon: 'ph-check-circle' },
            { id: 'perdido', label: 'Perdido', color: '#ef4444', icon: 'ph-x-circle' }
        ];

        const projetoMap = new Map();
        itens.forEach(item => {
            const key = item.origemId || item.id;
            if (!projetoMap.has(key)) {
                projetoMap.set(key, { origemId: key, statuses: [], valor: 0 });
            }
            const e = projetoMap.get(key);
            e.statuses.push(item.status);
            if (item.tipo === 'comercial' && item.valor) e.valor = item.valor;
            else if (!e.valor) e.valor = item.valor || 0;
        });
        const projetos = Array.from(projetoMap.values()).map(p => ({
            ...p,
            projectStatus: p.statuses.some(s => s === 'fechado') ? 'fechado'
                : p.statuses.every(s => s === 'perdido') ? 'perdido' : 'ativo'
        }));
        const ativos = projetos.filter(p => p.projectStatus !== 'perdido');
        const valorPipeline = ativos.reduce((s, p) => s + p.valor, 0);
        const fechados = projetos.filter(p => p.projectStatus === 'fechado').length;
        const valorFechados = projetos.filter(p => p.projectStatus === 'fechado').reduce((s, p) => s + p.valor, 0);
        const taxaConv = projetos.length > 0 ? Math.round(fechados / projetos.length * 100) : 0;
        const ticketMedio = fechados > 0 ? Math.round(valorFechados / fechados) : 0;

        const dataStr = new Date().toLocaleDateString();

        let stageTablesHtml = '';
        stages.forEach(stage => {
            const stageItens = itens.filter(i => i.status === stage.id);
            const stageTotal = stageItens.reduce((s, i) => s + (i.valor || 0), 0);
            if (stageItens.length === 0) return;

            const tipoLabels = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };

            let rowsHtml = '';
            stageItens.forEach(item => {
                const tipo = item.tipo || 'tecnica_comercial';
                const tipoLabel = tipoLabels[tipo] || tipo;
                const base = item.origemId ? (window.app.formatProposalCode ? window.app.formatProposalCode(item.origemId) : item.origemId) : '';
                const revStr = item.revisao !== undefined && item.revisao !== null ? `_R${String(item.revisao).padStart(2, '0')}` : '';
                const codigo = base ? `${base}_${tipoLabel}${revStr}` : '';
                const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
                const ultContato = item.ultimoContato ? new Date(item.ultimoContato).toLocaleDateString() : '';
                rowsHtml += `
                    <tr>
                        <td>${item.cliente}</td>
                        <td>${item.projeto || '—'}</td>
                        <td>${codigo || '—'}</td>
                        <td>${tipoLabel}</td>
                        <td>${item.vendedor || '—'}</td>
                        <td>${item.engenheiro_responsavel || '—'}</td>
                        <td>${date}</td>
                        <td style="text-align:right;">R$ ${(item.valor || 0).toLocaleString()}</td>
                    </tr>`;
            });

            stageTablesHtml += `
                <h3 style="color:${stage.color};border-left:6px solid ${stage.color};padding-left:10px;margin:24px 0 8px 0;font-size:15px;">
                    ${stage.label}
                    <span style="font-weight:400;font-size:12px;color:#666;"> — ${stageItens.length} item(ns) · R$ ${stageTotal.toLocaleString()}</span>
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Projeto</th>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Vendedor</th>
                            <th>Eng. Resp.</th>
                            <th>Data Abertura</th>
                            <th style="text-align:right;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>`;
        });

        const grandTotal = itens.reduce((s, i) => s + (i.valor || 0), 0);

        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Gestão de Propostas</title>
<style>
    @page { margin: 15mm 12mm; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #333; margin:0; padding:20px; }
    h2 { color: #1e3a5f; font-size: 20px; margin:0 0 4px 0; }
    .subtitle { color: #666; font-size: 11px; margin-bottom:20px; }
    .kpi-grid { display: flex; gap: 12px; margin-bottom: 24px; }
    .kpi-box { flex:1; padding:10px; border:1px solid #ccc; border-radius:4px; text-align:center; }
    .kpi-label { font-size: 9px; text-transform: uppercase; color: #666; }
    .kpi-value { font-size: 18px; font-weight: bold; margin-top: 2px; }
    table { width:100%; border-collapse:collapse; margin-top:4px; page-break-inside:auto; }
    tr { page-break-inside:avoid; page-break-after:auto; }
    th, td { padding:5px 6px; border:1px solid #ccc; text-align:left; font-size:10px; }
    th { background:#1e3a5f; color:#fff; font-size:9px; text-transform:uppercase; }
    .text-right { text-align:right; }
    .footer { margin-top:20px; padding-top:10px; border-top:1px solid #ccc; font-size:10px; color:#666; text-align:center; }
</style>
</head>
<body>
    <h2>Gestão de Propostas</h2>
    <div class="subtitle">Exportado em ${dataStr} · ${itens.length} itens no total</div>

    <div class="kpi-grid">
        <div class="kpi-box"><div class="kpi-label">Itens Ativos</div><div class="kpi-value" style="color:#6366f1;">${ativos.length}</div></div>
        <div class="kpi-box"><div class="kpi-label">Valor em Pipeline</div><div class="kpi-value" style="color:#22c55e;">R$ ${valorPipeline.toLocaleString()}</div></div>
        <div class="kpi-box"><div class="kpi-label">Taxa de Conversão</div><div class="kpi-value" style="color:#3b82f6;">${taxaConv}%</div></div>
        <div class="kpi-box"><div class="kpi-label">Ticket Médio</div><div class="kpi-value" style="color:#8b5cf6;">R$ ${ticketMedio.toLocaleString()}</div></div>
    </div>

    ${stageTablesHtml}

    <div class="footer">
        <strong>Valor Total Geral:</strong> R$ ${grandTotal.toLocaleString()}
        &nbsp;·&nbsp; <strong>Itens:</strong> ${itens.length}
        &nbsp;·&nbsp; Gerado em ${dataStr}
    </div>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    },

    async printRevisionLogs() {
        const state = store.getState();
        const items = state.pipelineItems || [];
        const token = state.auth?.token;
        const allLogs = [];
        const folders = [...new Set(items.filter(i => i.origemId).map(i => i.origemId))];

        const tipoLabels = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };
        const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };

        for (const folder of folders) {
            try {
                const res = await fetch(`http://${location.hostname}:8082/api/pipeline-log-revisions?ptcFolder=${encodeURIComponent(folder)}`, {
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                });
                const data = await res.json();
                if (data.success) {
                    const logs = (data.logs || []).map(log => ({ ...log, _folder: folder }));
                    allLogs.push(...logs);
                }
            } catch {}
        }

        allLogs.sort((a, b) => {
            const ta = a.timestamp || a.createdAt || '';
            const tb = b.timestamp || b.createdAt || '';
            return tb.localeCompare(ta);
        });

        const dataStr = new Date().toLocaleDateString('pt-BR');
        let rowsHtml = '';
        allLogs.forEach(log => {
            const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '—';
            const rev = log.revisao !== undefined && log.revisao !== null ? String(log.revisao).padStart(2, '0') : '—';
            const statusLabel = stageLabels[log.status] || log.status || '—';
            const engResp = log.engenheiro_responsavel || log.usuario || '—';
            const base = log._folder ? (window.app.formatProposalCode ? window.app.formatProposalCode(log._folder) : log._folder) : '';
            const tipoLabel = tipoLabels[log.item_tipo] || 'PTC';
            const codigo = base ? `${base}-${tipoLabel}` : log._folder || '—';
            rowsHtml += `
                <tr>
                    <td>${codigo}</td>
                    <td>${log.projeto || '—'}</td>
                    <td style="text-align:center;color:#6366f1;font-weight:700;">${rev}</td>
                    <td>${log.descricao || log.descricao_revisao || '—'}</td>
                    <td>${dateStr}</td>
                    <td>${engResp}</td>
                    <td>${log.vendedor || '—'}</td>
                    <td>${statusLabel}</td>
                    <td>${(function(p){try{return PipelineComercialModule._calcularPrazo(p).html}catch(e){return '—'}})(log.data_entrega)}</td>
                </tr>`;
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Log das Revisões</title>
<style>
    @page { margin: 15mm 12mm; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #333; margin:0; padding:20px; }
    h2 { color: #1e3a5f; font-size: 20px; margin:0 0 4px 0; }
    .subtitle { color: #666; font-size: 11px; margin-bottom:20px; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th, td { padding:5px 6px; border:1px solid #ccc; text-align:left; font-size:10px; }
    th { background:#1e3a5f; color:#fff; font-size:9px; text-transform:uppercase; }
    .footer { margin-top:20px; padding-top:10px; border-top:1px solid #ccc; font-size:10px; color:#666; text-align:center; }
</style>
</head>
<body>
    <h2>Log das Revisões</h2>
    <div class="subtitle">Exportado em ${dataStr} · ${allLogs.length} registro(s)</div>

    <table>
        <thead>
            <tr>
                <th>PTC</th>
                <th>NOME DO PROJETO</th>
                <th style="text-align:center;">REV</th>
                <th>AÇÃO</th>
                <th>DATA/HORA</th>
                <th>ENG. RESP.</th>
                <th>VENDEDOR</th>
                <th>STATUS</th>
                <th>PRAZO</th>
            </tr>
        </thead>
        <tbody>${rowsHtml || '<tr><td colspan="9" style="text-align:center;color:#999;">Nenhum registro encontrado.</td></tr>'}</tbody>
    </table>

    <div class="footer">
        <strong>Total de Registros:</strong> ${allLogs.length}
        &nbsp;·&nbsp; Gerado em ${dataStr}
    </div>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    },

    _calcularPrazo(dataEntrega) {
        if (!dataEntrega) return { text: '—', html: '<span style="color:#94a3b8;">—</span>' };
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const entrega = new Date(dataEntrega + 'T00:00:00');
        const diff = entrega - hoje;
        const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
            const txt = `No Prazo (Faltam ${diffDays} dia${diffDays !== 1 ? 's' : ''})`;
            return { text: txt, html: `<span style="color:#16a34a;font-weight:600;">${txt}</span>` };
        }
        if (diffDays === 0) {
            return { text: 'Último dia', html: '<span style="color:#f59e0b;font-weight:600;">Último dia</span>' };
        }
        const abs = Math.abs(diffDays);
        const txt = `Atrasado (${abs} dia${abs !== 1 ? 's' : ''})`;
        return { text: txt, html: `<span style="color:#dc2626;font-weight:600;">${txt}</span>` };
    }
};

window.pipelineComercialModule = PipelineComercialModule;
PipelineComercialModule.init();
