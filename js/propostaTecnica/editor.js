// editor.js (bloco 7/7) — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { store } from '../state.js';
import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from '../busbarCalculator.js';
import { deriveMaterials } from '../automacaoMateriais.js';
import { EMPRESA } from '../empresaConfig.js';
import { infraSubtotal, infraPrecoFinal } from '../infraPricing.js';
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './shared.js';

const app = window.app;
export const editor = {
    renderLoadsLM(eq) {

        const tipicos = store.getState().tipicos || [];
        const company = store.getState().company || {};
        const isAutPro = company.folderName?.startsWith('AUT_');
        const lmHeaderBg = isAutPro ? 'rgb(3, 92, 169)' : '#22c55e';

        const loads = eq.loads || [];

        

        if (loads.length === 0) {

            return `<div style="padding: 40px; text-align: center; color: #94a3b8; background: white; border-radius: 8px; border: 1px dashed #e2e8f0;">Nenhuma carga cadastrada para gerar a LM.</div>`;

        }



        return `

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">

                <div style="display: flex; gap: 10px; flex: 1;">

                    <div style="position: relative; flex: 1; max-width: 400px;">

                        <i class="ph ph-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>

                        <input type="text" id="lm-search-input" class="form-control" placeholder="Filtrar materiais nesta lista..." style="padding-left: 35px; font-size: 12px; border-radius: 4px;" value="${this.lmFilterQuery}" oninput="window.propostaTecnicaModule.filterLM(this.value)">

                    </div>

                </div>

                <div style="display: flex; gap: 8px;">

                    <button type="button" class="btn btn-sm btn-outline" onclick="app.propostaTecnica.exportLMXLS(null, false)" style="font-size: 11px; background: white; border: 1px solid #e2e8f0; border-radius: 4px;">

                        <i class="ph ph-file-xls"></i> Exportar Excel

                    </button>

                    <button type="button" class="btn btn-sm btn-outline" onclick="app.propostaTecnica.exportLMXLS(null, true)" style="font-size: 11px; background: white; border: 1px solid #e2e8f0; border-radius: 4px;">

                        <i class="ph ph-file-xls"></i> Exportar Excel (Preço)

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('lm')" style="background: #0284c7; color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-arrows-clockwise"></i> Atualizar Lista

                    </button>

                </div>

            </div>



            <div id="lm-sortable-container" style="display: flex; flex-direction: column; gap: 20px;">

                ${loads.map((load, idx) => {

                    const typical = tipicos.find(t => t.id === load.typicalId);

                    let items = load._itemsOverride || (typical ? (typical.items || []) : []);

                    

                    // Aplicar Filtro

                    if (this.lmFilterQuery) {

                        const q = this.lmFilterQuery.toLowerCase();

                        items = items.filter(i => 

                            (i.descricao && i.descricao.toLowerCase().includes(q)) ||

                            (i.modelo && i.modelo.toLowerCase().includes(q)) ||

                            (i.codigoFabricante && i.codigoFabricante.toLowerCase().includes(q)) ||

                            (i.fabricante && i.fabricante.toLowerCase().includes(q))

                        );

                        // Se não houver itens que coincidam com o filtro nesta carga, não renderizar o card

                        if (items.length === 0) return '';

                    }



                    const typicalName = typical ? typical.nome : 'Nenhum típico associado';

                    

                    return `

                        <div class="lm-group-card" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">

                            <div style="background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">

                                <div style="display: flex; align-items: center; gap: 10px;">

                                    <span class="lm-drag-handle" style="cursor: grab; margin-right: 2px;"><i class="ph ph-grip-vertical" style="font-size: 14px; opacity: 0.3;"></i></span>

                                    <span style="background: #1e3a8a; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 12px;">${load.tag || '?' }</span>

                                    <span style="font-weight: 700; color: #334155; font-size: 13px;">${load.desc || 'Sem Descrição'}</span>

                                    <span style="color: #64748b; font-size: 12px; font-style: italic;">(${typicalName})</span>

                                </div>

                                <div style="font-size: 12px; font-weight: 700; color: #1e3a8a;">

                                    SUBTOTAL: ${app.formatCurrency(items.reduce((sum, item) => sum + (parseFloat(item.qtd) * parseFloat(item.custo || 0)), 0))}

                                </div>

                            </div>

                            <table class="w-full" style="font-size: 10px; border-collapse: collapse;">

                                <thead>

                                    <tr style="background: ${lmHeaderBg}; border-bottom: 1px solid #f1f5f9; color: #fff; text-transform: uppercase;">

                                        <th style="padding: 8px; text-align: center; width: 40px; color:#fff;">QTD</th>

                                        <th style="padding: 8px; text-align: left; color:#fff;">DESCRIÇÃO</th>

                                        <th style="padding: 8px; text-align: left; width: 120px; color:#fff;">MODELO</th>

                                        <th style="padding: 8px; text-align: left; width: 120px; color:#fff;">CÓD. FAB.</th>

                                        <th style="padding: 8px; text-align: left; width: 100px; color:#fff;">FABRICANTE</th>

                                        <th style="padding: 8px; text-align: center; width: 50px; color:#fff;">ICMS</th>

                                        <th style="padding: 8px; text-align: center; width: 50px; color:#fff;">IPI</th>

                                        <th style="padding: 8px; text-align: right; width: 80px; color:#fff;">UNIT.</th>

                                        <th style="padding: 8px; text-align: right; width: 80px; color:#fff;">TOTAL</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${items.map(item => `

                                        <tr style="border-bottom: 1px solid #f8fafc;">

                                            <td style="padding: 8px; text-align: center; font-weight: 700;">${item.qtd}</td>

                                            <td style="padding: 8px; color: #334155;">${item.descricao}</td>

                                            <td style="padding: 8px; color: #64748b;">${item.modelo || '-'}</td>

                                            <td style="padding: 8px; color: #64748b; font-family: monospace;">${item.codigoFabricante || '-'}</td>

                                            <td style="padding: 8px; color: #64748b;">${item.fabricante || '-'}</td>

                                            <td style="padding: 8px; text-align: center; color: #94a3b8;">${item.icms || '18'}%</td>

                                            <td style="padding: 8px; text-align: center; color: #94a3b8;">${item.ipi || '0'}%</td>

                                            <td style="padding: 8px; text-align: right; color: #64748b;">${app.formatCurrency(item.custo || 0)}</td>

                                            <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e3a8a;">${app.formatCurrency(parseFloat(item.qtd) * parseFloat(item.custo || 0))}</td>

                                        </tr>

                                    `).join('')}

                                    ${items.length === 0 ? '<tr><td colspan="9" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum material vinculado a este típico.</td></tr>' : ''}

                                </tbody>

                            </table>

                            <div style="padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">

                                <button type="button" class="btn btn-xs btn-outline" style="font-size: 10px; padding: 4px 8px;" onclick="app.propostaTecnica.openAddItemModal('${load.typicalId}', ${eq.type === 'CUB-MT'}, ${idx})"><i class="ph ph-plus"></i> Incluir Itens</button>

                                <button type="button" class="btn btn-xs btn-outline" style="font-size: 10px; padding: 4px 8px;" onclick="window.propostaTecnicaModule._editTypicalItems('${load.typicalId}', ${eq.type === 'CUB-MT'}, ${idx})"><i class="ph ph-pencil"></i> Editar Itens</button>

                            </div>

                        </div>

                    `;

                }).join('')}

            </div>

        `;

    },

    openAddItemModal(typicalId, isCubMt = false, loadIndex = -1) {
        const sourceData = isCubMt ? store.getState().cubiculos : store.getState().tipicos;
        const tipico = sourceData.find(t => t.id === typicalId);
        if (!tipico) return app.toast?.(isCubMt ? 'Cubículo não encontrado.' : 'Típico não encontrado.', 'error');

        const hasOverride = loadIndex >= 0 && this._hasOverride(loadIndex);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-add-item-lm';
        modal.innerHTML = `
            <div class="modal" style="width:800px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3>Adicionar Itens — ${this._escapeHtml(tipico.nome)}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                        <select id="ami-manufacturer" class="form-control" style="width:200px;" onchange="app.propostaTecnica._debouncedAddItemSearch()">
                            <option value="">Todos os Fabricantes</option>
                        </select>
                        <input type="text" id="ami-filter-model" class="form-control" placeholder="Filtrar descrição..." oninput="app.propostaTecnica._debouncedAddItemSearch()">
                        <input type="text" id="ami-filter-code" class="form-control" placeholder="Filtrar código..." oninput="app.propostaTecnica._debouncedAddItemSearch()">
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;white-space:nowrap;cursor:pointer;color:#f59e0b;">
                            <input type="checkbox" id="ami-filter-favoritos" onchange="app.propostaTecnica._debouncedAddItemSearch()"> ⭐ Favoritos
                        </label>
                    </div>
                    <div style="max-height:400px;overflow-y:auto;border:1px solid var(--color-border);border-radius:4px;">
                        <table class="w-full" style="font-size:13px;">
                            <thead><tr style="background:#f1f5f9;">
                                <th style="padding:10px;">DESCRIÇÃO</th>
                                <th style="padding:10px;width:120px;">MODELO</th>
                                <th style="padding:10px;width:130px;">CÓD. FAB.</th>
                                <th style="padding:10px;width:110px;">FABRICANTE</th>
                                <th style="padding:10px;width:100px;text-align:right;">UNIT. (R$)</th>
                                <th style="padding:10px;width:60px;text-align:center;">QTD</th>
                                <th style="padding:10px;width:50px;"></th>
                            </tr></thead>
                            <tbody id="ami-items-body"></tbody>
                        </table>
                    </div>
                    <div id="ami-pagination" style="padding:10px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                        <span>Carregando...</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                        Itens adicionados serão salvos ${hasOverride ? 'apenas nesta proposta (local)' : `no ${isCubMt ? 'cubículo' : 'típico'} <b>${this._escapeHtml(tipico.nome)}</b>`}
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmAddItems('${typicalId}', ${isCubMt})" style="">
                        <i class="ph ph-check"></i> Concluído
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._typicalId = typicalId;
        modal._isCubMt = isCubMt;
        modal._loadIndex = loadIndex;
        this._populateManufacturers(modal);
        this._searchAddItems(modal);
    },

    _editTypicalItems(typicalId, isCubMt = false, loadIndex = -1) {
        const sourceData = isCubMt ? store.getState().cubiculos : store.getState().tipicos;
        const tipico = sourceData.find(t => t.id === typicalId);
        if (!tipico) return app.toast?.(isCubMt ? 'Cubículo não encontrado.' : 'Típico não encontrado.', 'error');

        const hasOverride = loadIndex >= 0 && this._hasOverride(loadIndex);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-edit-items';
        modal.innerHTML = `
            <div class="modal" style="width:800px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3>Editar Itens — ${this._escapeHtml(tipico.nome)}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="max-height:450px;overflow-y:auto;border:1px solid var(--color-border);border-radius:4px;">
                        <table class="w-full" style="font-size:13px;">
                            <thead><tr style="background:#f1f5f9;">
                                <th style="padding:8px;width:50px;text-align:center;">QTD</th>
                                <th style="padding:8px;">DESCRIÇÃO</th>
                                <th style="padding:8px;width:100px;">MODELO</th>
                                <th style="padding:8px;width:110px;">CÓD. FAB.</th>
                                <th style="padding:8px;width:90px;">FABRICANTE</th>
                                <th style="padding:8px;width:80px;text-align:right;">CUSTO (R$)</th>
                                <th style="padding:8px;width:40px;"></th>
                            </tr></thead>
                            <tbody id="edit-items-body"></tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                        ${(hasOverride ? this._getOverrideItems(loadIndex) : tipico.items || []).length} material(is)${hasOverride ? ' (apenas nesta proposta)' : ''} — alterações salvas ao clicar em Concluído
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmEditItems('${typicalId}', ${isCubMt}, ${loadIndex})">
                        <i class="ph ph-check"></i> Concluído
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const tbody = modal.querySelector('#edit-items-body');
        if (tbody) {
            const load = hasOverride ? store.getState().activeTechnicalProposal?.equipments?.[this.activeEquipmentIndex]?.loads?.[loadIndex] : null;
            const items = load?._itemsOverride || tipico.items || [];
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum item neste típico.</td></tr>';
            } else {
                tbody.innerHTML = items.map((item, idx) => {
                    const desc = this._escapeHtml(item.descricao || '');
                    const modelo = this._escapeHtml(item.modelo || '');
                    const codFab = this._escapeHtml(item.codigoFabricante || '');
                    const fab = this._escapeHtml(item.fabricante || '');
                    return `<tr>
                        <td style="padding:4px;text-align:center;">
                            <input type="number" class="form-control edit-item-qtd" value="${item.qtd || 1}" min="0.001" step="1"
                                style="width:50px;padding:4px;text-align:center;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-desc" value="${desc}"
                                style="padding:4px;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-modelo" value="${modelo}"
                                style="padding:4px;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-codfab" value="${codFab}"
                                style="padding:4px;height:28px;font-size:12px;font-family:monospace;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-fab" value="${fab}"
                                style="padding:4px;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;text-align:right;">
                            <input type="number" class="form-control edit-item-custo" value="${item.custo || 0}" min="0" step="0.01"
                                style="width:80px;padding:4px;text-align:right;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;text-align:center;">
                            <button class="btn btn-xs" style="background:#fef2f2;color:#ef4444;border:1px solid #fee2e2;"
                                onclick="this.closest('tr').remove()" title="Remover item">
                                <i class="ph ph-trash"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('');
            }
        }
    },

    _hasOverride(loadIndex) {
        if (loadIndex < 0) return false;
        const data = store.getState().activeTechnicalProposal;
        return !!data?.equipments?.[this.activeEquipmentIndex]?.loads?.[loadIndex]?._itemsOverride;
    },

    _getOverrideItems(loadIndex) {
        const data = store.getState().activeTechnicalProposal;
        return data?.equipments?.[this.activeEquipmentIndex]?.loads?.[loadIndex]?._itemsOverride || [];
    },

    _confirmSaveToDatabase(isCubMt) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = 100001;
            overlay.innerHTML = `
                <div class="modal" style="width:460px;">
                    <div class="modal-header" style="background:var(--color-accent);color:white;">
                        <h3 style="margin:0;font-size:15px;">Alterar ${isCubMt ? 'Cubículo' : 'Típico'} na Base?</h3>
                    </div>
                    <div class="modal-body" style="padding:20px;line-height:1.6;">
                        <p style="margin:0 0 12px;font-size:14px;color:#334155;">
                            <strong>Sim</strong> — altera o ${isCubMt ? 'cubículo' : 'típico'} original.<br>
                            Todas as propostas que usam este ${isCubMt ? 'cubículo' : 'típico'} serão afetadas.
                        </p>
                        <p style="margin:0;font-size:14px;color:#334155;">
                            <strong>Não</strong> — altera apenas nesta proposta.<br>
                            O ${isCubMt ? 'cubículo' : 'típico'} original permanece intacto.
                        </p>
                    </div>
                    <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;padding:12px 20px;">
                        <button class="btn btn-cancel" id="btn-db-no" style="min-width:100px;">Não</button>
                        <button class="btn btn-primary" id="btn-db-yes" style="min-width:100px;">Sim</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('#btn-db-no').onclick = () => { overlay.remove(); resolve(false); };
            overlay.querySelector('#btn-db-yes').onclick = () => { overlay.remove(); resolve(true); };
        });
    },

    async _confirmEditItems(typicalId, isCubMt = false, loadIndex = -1) {
        const modal = document.getElementById('modal-edit-items');
        if (!modal) return;

        const rows = modal.querySelectorAll('#edit-items-body tr');
        const items = [];
        rows.forEach(row => {
            const qtd = parseFloat(row.querySelector('.edit-item-qtd')?.value) || 0;
            if (qtd <= 0) return;
            items.push({
                qtd: qtd,
                descricao: row.querySelector('.edit-item-desc')?.value || '',
                modelo: row.querySelector('.edit-item-modelo')?.value || '',
                codigoFabricante: row.querySelector('.edit-item-codfab')?.value || '',
                fabricante: row.querySelector('.edit-item-fab')?.value || '',
                custo: parseFloat(row.querySelector('.edit-item-custo')?.value) || 0
            });
        });

        const custoTotal = items.reduce((acc, i) => acc + (i.custo * i.qtd), 0);

        // Se tem loadIndex e veio da LM, perguntar se quer salvar no banco
        if (loadIndex >= 0) {
            const saveToDb = await this._confirmSaveToDatabase(isCubMt);
            if (!saveToDb) {
                // Salvar apenas na proposta (local override)
                const data = store.getState().activeTechnicalProposal;
                const eq = data?.equipments?.[this.activeEquipmentIndex];
                if (eq?.loads?.[loadIndex]) {
                    eq.loads[loadIndex]._itemsOverride = items;
                    eq.loads[loadIndex]._overrideCustoTotal = custoTotal;
                    store.setState({ activeTechnicalProposal: data });
                    modal.remove();
                    this.renderModal(data);
                    if (this.cargasSubView !== 'lm') {
                        this.switchCargasSubView('lm');
                    }
                    app.toast?.('Itens atualizados apenas nesta proposta!', 'success');
                }
                return;
            }
        }

        // Salvar no banco (comportamento atual)
        const savePromise = isCubMt
            ? store.updateCubiculos(typicalId, { items, custoTotal })
            : store.updateTipico(typicalId, { items, custoTotal });
        savePromise.then(ok => {
            modal.remove();
            if (ok) {
                const data = store.getState().activeTechnicalProposal;
                // Se salvou no banco, limpar override local se existia
                if (loadIndex >= 0) {
                    const eq = data?.equipments?.[this.activeEquipmentIndex];
                    if (eq?.loads?.[loadIndex]) {
                        delete eq.loads[loadIndex]._itemsOverride;
                        delete eq.loads[loadIndex]._overrideCustoTotal;
                    }
                }
                if (data) {
                    store.setState({ activeTechnicalProposal: data });
                    this.renderModal(data);
                    if (this.cargasSubView !== 'lm') {
                        this.switchCargasSubView('lm');
                    }
                }
                app.toast?.(`Itens atualizados no ${isCubMt ? 'cubículo' : 'típico'}!`, 'success');
            } else {
                app.toast?.('Erro ao salvar itens.', 'error');
            }
        });
    },

    _populateManufacturers(modal) {
        const all = store.getState().materiais || [];
        const unique = [...new Set(all.map(m => m.fabricante).filter(Boolean))].sort();
        const sel = modal.querySelector('#ami-manufacturer');
        if (sel) {
            unique.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                sel.appendChild(opt);
            });
        }
    },

    _debouncedAddItemSearch() {
        if (this._addItemSearchTimer) clearTimeout(this._addItemSearchTimer);
        this._addItemSearchTimer = setTimeout(() => {
            const modal = document.getElementById('modal-add-item-lm');
            if (modal) this._searchAddItems(modal);
        }, 300);
    },

    async _searchAddItems(modal) {
        const manufacturer = modal.querySelector('#ami-manufacturer')?.value || '';
        const filterModel  = (modal.querySelector('#ami-filter-model')?.value || '').trim();
        const filterCode   = (modal.querySelector('#ami-filter-code')?.value || '').trim();
        const favoritosOnly = modal.querySelector('#ami-filter-favoritos')?.checked || false;
        const tbody = modal.querySelector('#ami-items-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;"><i class="ph ph-spinner ph-spin"></i> Carregando...</td></tr>';

        const q = [filterModel, filterCode].filter(Boolean).join(' ');
        const page = parseInt(modal._searchPage || 1);
        const result = await store.searchMaterials({
            q: q || undefined,
            fabricante: manufacturer || undefined,
            favorito: favoritosOnly || undefined,
            page: page,
            limit: 100
        });

        modal._searchTotal = result.total || 0;
        modal._searchPages = result.pages || 0;
        modal._searchPage = result.page || 1;

        this._renderAddItemResults(modal, result.rows || []);
    },

    _renderAddItemResults(modal, rows) {
        const tbody = modal.querySelector('#ami-items-body');
        if (!tbody) return;
        const typicalId = modal._typicalId;
        const isCubMt = modal._isCubMt;

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum material encontrado.</td></tr>';
            this._renderAddItemPagination(modal);
            return;
        }

        tbody.innerHTML = rows.map(m => {
            const desc = this._escapeHtml(m.descricao || '');
            const modelo = this._escapeHtml(m.modelo || '-');
            const codFab = this._escapeHtml(m.codigoFabricante || '-');
            const fab = this._escapeHtml(m.fabricante || '-');
            return `<tr>
                <td style="padding:8px 10px;">${desc}</td>
                <td style="padding:8px 10px;">${modelo}</td>
                <td style="padding:8px 10px;font-family:monospace;">${codFab}</td>
                <td style="padding:8px 10px;">${fab}</td>
                <td style="padding:8px 10px;text-align:right;">${app.formatCurrency(m.custo || 0)}</td>
                <td style="padding:8px 10px;text-align:center;">
                    <input type="number" class="form-control" value="1" min="1"
                        style="width:50px;padding:4px;text-align:center;height:28px;"
                        data-material-id="${m.id}"
                        data-custo="${m.custo}"
                        data-descricao="${desc}"
                        data-fabricante="${fab}"
                        data-codfab="${codFab}"
                        data-modelo="${modelo}"
                        data-icms="${m.icms || 18}"
                        data-ipi="${m.ipi || 0}"
                        data-uf="${m.ufFornecedor || ''}">
                </td>
                <td style="padding:8px 10px;text-align:center;">
                    <button class="btn btn-xs btn-primary" onclick="app.propostaTecnica._addSingleItem(this, '${typicalId}', ${isCubMt})"
                        style="font-size:11px;padding:4px 10px;">
                        <i class="ph ph-plus"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        this._renderAddItemPagination(modal);
    },

    _renderAddItemPagination(modal) {
        const container = modal.querySelector('#ami-pagination');
        if (!container) return;
        const total = modal._searchTotal || 0;
        const pages = modal._searchPages || 0;
        const page = modal._searchPage || 1;

        if (pages <= 1) {
            container.innerHTML = `<span>${total} material(is) encontrado(s)</span>`;
            return;
        }

        container.innerHTML = `
            <span>${total} material(is) encontrados</span>
            <div style="display:flex;gap:4px;align-items:center;">
                <button class="btn btn-xs btn-outline" ${page <= 1 ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddItemPage(${page - 1})">« Anterior</button>
                <span style="margin:0 8px;font-weight:600;">${page} de ${pages}</span>
                <button class="btn btn-xs btn-outline" ${page >= pages ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddItemPage(${page + 1})">Próxima »</button>
            </div>
        `;
    },

    _goAddItemPage(page) {
        const modal = document.getElementById('modal-add-item-lm');
        if (!modal) return;
        modal._searchPage = page;
        this._searchAddItems(modal);
    },

    _addSingleItem(btn, typicalId, isCubMt = false) {
        const row = btn.closest('tr');
        const qtdInput = row.querySelector('input[type="number"]');
        const qtd = parseInt(qtdInput?.value) || 1;
        const materialId = qtdInput?.dataset?.materialId;
        if (!materialId) return;

        const addModal = document.getElementById('modal-add-item-lm');
        const loadIndex = addModal?._loadIndex ?? -1;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];

        if (loadIndex >= 0 && eq?.loads?.[loadIndex]?._itemsOverride) {
            // Modo local — adicionar no override da carga
            const override = eq.loads[loadIndex]._itemsOverride;
            const existing = override.find(i => i.materialId === materialId);
            if (existing) {
                existing.qtd = (existing.qtd || 0) + qtd;
            } else {
                override.push({
                    materialId: materialId,
                    descricao: qtdInput.dataset.descricao,
                    fabricante: qtdInput.dataset.fabricante,
                    codigoFabricante: qtdInput.dataset.codfab,
                    modelo: qtdInput.dataset.modelo,
                    custo: parseFloat(qtdInput.dataset.custo) || 0,
                    qtd: qtd,
                    icms: parseFloat(qtdInput.dataset.icms) || 18,
                    ipi: parseFloat(qtdInput.dataset.ipi) || 0,
                    ufFornecedor: qtdInput.dataset.uf || ''
                });
            }
            eq.loads[loadIndex]._overrideCustoTotal = override.reduce((acc, i) => acc + ((i.custo || 0) * (i.qtd || 0)), 0);
            store.setState({ activeTechnicalProposal: data });
            window.app.toast?.('Item adicionado à lista local da proposta!', 'success');
            this.renderModal(data);
            setTimeout(() => this.openAddItemModal(typicalId, isCubMt, loadIndex), 50);
            return;
        }

        // Modo global — adicionar no típico (comportamento atual)
        const state = store.getState();
        const sourceData = [...(isCubMt ? (state.cubiculos || []) : (state.tipicos || []))];
        const idx = sourceData.findIndex(t => t.id === typicalId);
        if (idx === -1) return;

        const item = { ...sourceData[idx] };
        item.items = [...(item.items || [])];

        const existing = item.items.find(i => i.materialId === materialId);
        if (existing) {
            existing.qtd = (existing.qtd || 0) + qtd;
        } else {
            item.items.push({
                materialId: materialId,
                descricao: qtdInput.dataset.descricao,
                fabricante: qtdInput.dataset.fabricante,
                codigoFabricante: qtdInput.dataset.codfab,
                modelo: qtdInput.dataset.modelo,
                custo: parseFloat(qtdInput.dataset.custo) || 0,
                qtd: qtd,
                icms: parseFloat(qtdInput.dataset.icms) || 18,
                ipi: parseFloat(qtdInput.dataset.ipi) || 0,
                ufFornecedor: qtdInput.dataset.uf || ''
            });
        }

        item.custoTotal = item.items.reduce((acc, i) => acc + ((i.custo || 0) * (i.qtd || 0)), 0);
        sourceData[idx] = item;
        if (isCubMt) {
            store.setState({ cubiculos: sourceData });
        } else {
            store.setState({ tipicos: sourceData });
        }

        window.app.toast?.(`Item adicionado ao ${isCubMt ? 'cubículo' : 'típico'}!`, 'success');

        if (data) {
            this.renderModal(data);
            setTimeout(() => this.openAddItemModal(typicalId, isCubMt, loadIndex), 50);
        }
    },

    _confirmAddItems(typicalId, isCubMt = false) {
        document.getElementById('modal-add-item-lm')?.remove();
        const data = store.getState().activeTechnicalProposal;
        if (data) {
            this.renderModal(data);
            if (this.cargasSubView !== 'lm') {
                this.switchCargasSubView('lm');
            }
        }
        window.app.toast?.(`Itens salvos com sucesso!`, 'success');
    },

    openAddEqMaterialModal() {
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-add-eq-material';
        modal.innerHTML = `
            <div class="modal" style="width:800px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3>Adicionar Material — ${this._escapeHtml(eq.tag)}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                        <select id="aem-manufacturer" class="form-control" style="width:200px;" onchange="app.propostaTecnica._debouncedAddEqMaterialSearch()">
                            <option value="">Todos os Fabricantes</option>
                        </select>
                        <input type="text" id="aem-filter-model" class="form-control" placeholder="Filtrar descrição..." oninput="app.propostaTecnica._debouncedAddEqMaterialSearch()">
                        <input type="text" id="aem-filter-code" class="form-control" placeholder="Filtrar código..." oninput="app.propostaTecnica._debouncedAddEqMaterialSearch()">
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;white-space:nowrap;cursor:pointer;color:#f59e0b;">
                            <input type="checkbox" id="aem-filter-favoritos" onchange="app.propostaTecnica._debouncedAddEqMaterialSearch()"> ⭐ Favoritos
                        </label>
                    </div>
                    <div style="max-height:400px;overflow-y:auto;border:1px solid var(--color-border);border-radius:4px;">
                        <table class="w-full" style="font-size:13px;">
                            <thead><tr style="background:#f1f5f9;">
                                <th style="padding:10px;">DESCRIÇÃO</th>
                                <th style="padding:10px;width:120px;">MODELO</th>
                                <th style="padding:10px;width:130px;">CÓD. FAB.</th>
                                <th style="padding:10px;width:110px;">FABRICANTE</th>
                                <th style="padding:10px;width:100px;text-align:right;">UNIT. (R$)</th>
                                <th style="padding:10px;width:60px;text-align:center;">QTD</th>
                                <th style="padding:10px;width:50px;"></th>
                            </tr></thead>
                            <tbody id="aem-items-body"></tbody>
                        </table>
                    </div>
                    <div id="aem-pagination" style="padding:10px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                        <span>Carregando...</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                        Materiais adicionados serão vinculados ao equipamento <b>${this._escapeHtml(eq.tag)}</b>
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmAddEqMaterial()" style="">
                        <i class="ph ph-check"></i> Concluído
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._populateEqMaterialManufacturers(modal);
        this._searchAddEqMaterials(modal);
    },

    _populateEqMaterialManufacturers(modal) {
        const all = store.getState().materiais || [];
        const unique = [...new Set(all.map(m => m.fabricante).filter(Boolean))].sort();
        const sel = modal.querySelector('#aem-manufacturer');
        if (sel) {
            unique.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                sel.appendChild(opt);
            });
        }
    },

    _debouncedAddEqMaterialSearch() {
        if (this._addEqMatSearchTimer) clearTimeout(this._addEqMatSearchTimer);
        this._addEqMatSearchTimer = setTimeout(() => {
            const modal = document.getElementById('modal-add-eq-material');
            if (modal) this._searchAddEqMaterials(modal);
        }, 300);
    },

    async _searchAddEqMaterials(modal) {
        const manufacturer = modal.querySelector('#aem-manufacturer')?.value || '';
        const filterModel  = (modal.querySelector('#aem-filter-model')?.value || '').trim();
        const filterCode   = (modal.querySelector('#aem-filter-code')?.value || '').trim();
        const favoritosOnly = modal.querySelector('#aem-filter-favoritos')?.checked || false;
        const tbody = modal.querySelector('#aem-items-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;"><i class="ph ph-spinner ph-spin"></i> Carregando...</td></tr>';

        const q = [filterModel, filterCode].filter(Boolean).join(' ');
        const page = parseInt(modal._searchPage || 1);
        const result = await store.searchMaterials({
            q: q || undefined,
            fabricante: manufacturer || undefined,
            favorito: favoritosOnly || undefined,
            page: page,
            limit: 100
        });

        modal._searchTotal = result.total || 0;
        modal._searchPages = result.pages || 0;
        modal._searchPage = result.page || 1;

        this._renderAddEqMaterialResults(modal, result.rows || []);
    },

    _renderAddEqMaterialResults(modal, rows) {
        const tbody = modal.querySelector('#aem-items-body');
        if (!tbody) return;

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum material encontrado.</td></tr>';
            this._renderAddEqMaterialPagination(modal);
            return;
        }

        tbody.innerHTML = rows.map(m => {
            const desc = this._escapeHtml(m.descricao || '');
            const modelo = this._escapeHtml(m.modelo || '-');
            const codFab = this._escapeHtml(m.codigoFabricante || '-');
            const fab = this._escapeHtml(m.fabricante || '-');
            return `<tr>
                <td style="padding:8px 10px;">${desc}</td>
                <td style="padding:8px 10px;">${modelo}</td>
                <td style="padding:8px 10px;font-family:monospace;">${codFab}</td>
                <td style="padding:8px 10px;">${fab}</td>
                <td style="padding:8px 10px;text-align:right;">${app.formatCurrency(m.custo || 0)}</td>
                <td style="padding:8px 10px;text-align:center;">
                    <input type="number" class="form-control" value="1" min="1"
                        style="width:50px;padding:4px;text-align:center;height:28px;"
                        data-material-id="${m.id}"
                        data-custo="${m.custo}"
                        data-descricao="${desc}"
                        data-fabricante="${fab}"
                        data-codfab="${codFab}"
                        data-modelo="${modelo}">
                </td>
                <td style="padding:8px 10px;text-align:center;">
                    <button class="btn btn-xs btn-primary" onclick="app.propostaTecnica._addEqMaterialSingleItem(this)"
                        style="font-size:11px;padding:4px 10px;">
                        <i class="ph ph-plus"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        this._renderAddEqMaterialPagination(modal);
    },

    _renderAddEqMaterialPagination(modal) {
        const container = modal.querySelector('#aem-pagination');
        if (!container) return;
        const total = modal._searchTotal || 0;
        const pages = modal._searchPages || 0;
        const page = modal._searchPage || 1;

        if (pages <= 1) {
            container.innerHTML = `<span>${total} material(is) encontrado(s)</span>`;
            return;
        }

        container.innerHTML = `
            <span>${total} material(is) encontrados</span>
            <div style="display:flex;gap:4px;align-items:center;">
                <button class="btn btn-xs btn-outline" ${page <= 1 ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddEqMaterialPage(${page - 1})">« Anterior</button>
                <span style="margin:0 8px;font-weight:600;">${page} de ${pages}</span>
                <button class="btn btn-xs btn-outline" ${page >= pages ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddEqMaterialPage(${page + 1})">Próxima »</button>
            </div>
        `;
    },

    _goAddEqMaterialPage(page) {
        const modal = document.getElementById('modal-add-eq-material');
        if (!modal) return;
        modal._searchPage = page;
        this._searchAddEqMaterials(modal);
    },

    _addEqMaterialSingleItem(btn) {
        const row = btn.closest('tr');
        const qtdInput = row.querySelector('input[type="number"]');
        const qtd = parseInt(qtdInput?.value) || 1;
        const materialId = qtdInput?.dataset?.materialId;
        if (!materialId) return;

        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        if (!eq.materials) eq.materials = [];
        const existing = eq.materials.find(m => m.materialId === materialId);
        if (existing) {
            existing.qtd = (existing.qtd || 0) + qtd;
        } else {
            eq.materials.push({
                materialId: materialId,
                descricao: qtdInput.dataset.descricao,
                fabricante: qtdInput.dataset.fabricante,
                codigoFabricante: qtdInput.dataset.codfab,
                modelo: qtdInput.dataset.modelo,
                custo: parseFloat(qtdInput.dataset.custo) || 0,
                qtd: qtd
            });
        }

        store.setState({ activeTechnicalProposal: data });
        window.app.toast?.('Material adicionado ao equipamento!', 'success');
        this.renderModal(data);
        setTimeout(() => this.openAddEqMaterialModal(), 50);
    },

    _confirmAddEqMaterial() {
        document.getElementById('modal-add-eq-material')?.remove();
        const data = store.getState().activeTechnicalProposal;
        if (data) {
            this.renderModal(data);
        }
        window.app.toast?.('Materiais vinculados ao equipamento!', 'success');
    },

    filterLM(query) {

        this.lmFilterQuery = query;

        this.renderModal(store.getState().activeTechnicalProposal);

        

        // Restaurar foco e posição do cursor no input de busca

        const input = document.getElementById('lm-search-input');

        if (input) {

            input.focus();

            // Coloca o cursor no final do texto

            const len = input.value.length;

            input.setSelectionRange(len, len);

        }

    },



    updateLoadFromTypical(idx) {

        const select = document.querySelector(`select[name="dload_typicalId_${idx}"]`);

        if (!select) return;



        const typicalId = select.value;

        if (!typicalId) return;

        // Limpar override local ao trocar o típico associado
        const ptData = store.getState().activeTechnicalProposal;
        const ptEq = ptData?.equipments?.[this.activeEquipmentIndex];
        if (ptEq?.loads?.[idx]) {
            delete ptEq.loads[idx]._itemsOverride;
            delete ptEq.loads[idx]._overrideCustoTotal;
        }

        const isCubMt = (() => {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            return eq && eq.type === 'CUB-MT';
        })();



        const row = select.closest('tr');

        const inputPotencia = row.querySelector(`input[name="dload_power_${idx}"]`);

        const inputTensao = row.querySelector(`input[name="dload_tensao_${idx}"]`);

        const inputCorrente = row.querySelector(`input[name="dload_current_${idx}"]`);

        const selectRegime = row.querySelector(`select[name="dload_regime_${idx}"]`);

        const selectTipo = row.querySelector(`select[name="dload_type_${idx}"]`);
        const inputTipo = row.querySelector(`input[name="dload_type_${idx}"]`);



        if (isCubMt) {

            const typical = store.getState().cubiculos.find(t => t.id === typicalId);

            if (!typical) return;

            if (inputPotencia) inputPotencia.value = typical.tensao || '';

            if (inputTensao) inputTensao.value = typical.correnteNominal || '';

            if (inputCorrente) inputCorrente.value = typical.icc || '';

            if (selectRegime) {
                const optionExists = Array.from(selectRegime.options).some(opt => opt.value === typical.instalacao);
                selectRegime.value = optionExists ? typical.instalacao : 'Abrigada';
            }

            if (selectTipo) {
                const tipoNomeToSigla = {
                    'Cubículo de Entrada': 'CE',
                    'Cubículo de Seccionamento': 'CS',
                    'Cubículo de Medição': 'CM',
                    'Cubículo de Proteção': 'CP',
                    'Cubículo de Transformação': 'CT',
                    'Cubículo de Proteção Contra Surto': 'CPS',
                    'Cubículo Aterramento de Neutro': 'CAN'
                };
                selectTipo.value = tipoNomeToSigla[typical.tipoAcionamento] || '';
            }

            app.toast(`Dados preenchidos a partir de: ${typical.nome}`, 'info');
            return;

        }



        const typical = store.getState().tipicos.find(t => t.id === typicalId);

        if (!typical) return;



        // Mapeamento de Tipos (Sincronizado com tipicos.js)

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



        if (inputPotencia) inputPotencia.value = typical.potencia || typical.potenciaKvar || '';

        if (inputTensao) inputTensao.value = typical.tensao || '';

        if (inputCorrente) inputCorrente.value = typical.correnteApx || '';

        if (selectRegime) {

            // Tentar encontrar o valor exato no select

            const optionExists = Array.from(selectRegime.options).some(opt => opt.value === typical.regimeAcionamento);

            selectRegime.value = optionExists ? typical.regimeAcionamento : 'S1';

        }

        if (inputTipo) inputTipo.value = mapping[typical.tipoAcionamento] || 'IF';



        app.toast(`Dados preenchidos a partir de: ${typical.nome}`, 'info');

    },



    delete(id) {

        if (!confirm('Excluir proposta?')) return;

        const current = store.getState().propostasTecnicas;

        store.setState({ propostasTecnicas: current.filter(p => p.id !== id) });

        app.toast('Proposta excluída localmente.', 'success');

    },



    async _loadFromPtc(ptcFolder, revisionFolder) {
        if (this._loading) return;
        this._loading = true;
        try {
            const _tkPTL = store.getState().auth?.token;
            const _hPTL = _tkPTL ? { 'Authorization': 'Bearer ' + _tkPTL } : {};
            const res = await fetch(`/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=PropostaTecnica.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hPTL });
            const data = await res.json();
            if (data && !data.error && Object.keys(data).length > 0) {
                this.viewMode = 'form';
                this.forcedDashboard = false;
                const copy = JSON.parse(JSON.stringify(data));
                if (!copy.ptc_folder) copy.ptc_folder = ptcFolder;
                store.setState({ activeTechnicalProposal: copy });
                this.renderModal(copy);
            } else {
                this._createFromPtc();
            }
        } catch (err) {
            console.warn('[PropostaTecnica] Error auto-loading from PTC:', err);
            this._createFromPtc();
        } finally {
            this._loading = false;
        }
    },

    _createFromPtc() {
        const ptc = window.app.currentPtc;
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
        const ptcFolder = String(window.app.currentPtc?.folder || '');
        const newMatch = ptcFolder.match(/^(\d{8,10})/);
        const oldMatch = ptcFolder.match(/PTC-\d{4}-\d+/i);
        const basePtc = newMatch ? newMatch[1] : (oldMatch ? oldMatch[0].toUpperCase() : (window.app.currentPtcInfo?.ptcNumber || ''));
        const _existingPT = (store.getState().propostasTecnicas || []).find(p => p.ptc_folder === ptcFolder || p.ptcFolder === ptcFolder);
        const _stableId = _existingPT ? _existingPT.id : ('PT-' + (basePtc || Date.now().toString(36).toUpperCase()));
        const _stableCodigo = _existingPT?.codigo || (basePtc ? `${basePtc}-PT_R00` : _stableId);
        const newData = {
            id: _stableId,
            codigo: _stableCodigo,
            ptc_folder: ptcFolder,
            cliente: ptc?.client || '',
            projeto: ptc?.title || '',
            objeto: 'FORNECIMENTO DE PAINÉIS ELÉTRICOS',
            equipments: [],
            scopeItems: [],
            exclusions: makeDefaultExclusions(),
            vendorList: initialVendorList,
            clientDocuments: [],
            revisions: [{ no: '00', desc: 'Emissão Inicial', elab: '', verif: '', aprov: '', data: new Date().toLocaleDateString() }],
            engenheiroResponsavel: '',
            vendedor: ptc?.vendedor || '',
            updatedAt: new Date().toISOString()
        };
        this.viewMode = 'form';
        this.forcedDashboard = false;
        const copy = JSON.parse(JSON.stringify(newData));
        store.setState({ activeTechnicalProposal: copy });
        this.renderModal(copy);

        if (copy.cliente) {
            setTimeout(() => this.updateContactDropdown(copy.cliente), 50);
        }
    },

    closeModal() {

        console.log("[PropostaTecnica] Closing modal...");

        this.viewMode = 'list';

        this.forcedDashboard = true;

        store.setState({ proposalReadOnly: false });

        if (window.app.syncProposals) window.app.syncProposals();

        this.render();

    },

    _applyReadOnly(container) {
        container.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (el.type !== 'hidden') el.disabled = true;
        });
        container.querySelectorAll('.btn-save-as-new').forEach(el => el.disabled = false);
        container.querySelectorAll('.tab-btn, .sub-tab-btn').forEach(el => el.disabled = false);
        container.querySelectorAll('.btn-export-word').forEach(el => el.disabled = false);
        container.querySelectorAll('[onclick*="closeModal"], [onclick*="showListModal"]').forEach(el => el.disabled = false);
        const searchInput = container.querySelector('#lm-search-input');
        if (searchInput) searchInput.disabled = false;
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



    render() {

        const state = store.getState();

        const activeProposal = state.activeTechnicalProposal;



        // Auto-load from current PTC if no active proposal
        if (this.viewMode === 'list' && !this._loading && !this.forcedDashboard) {
            const ptc = window.app.currentPtc;
            if (!activeProposal && ptc && ptc.folder) {
                this._loadFromPtc(ptc.folder, ptc.revision || '');
                return;
            }
        }

        // Se houver uma proposta ativa e não viemos de um fechamento explícito, abre o formulário

        if (activeProposal && this.viewMode === 'list' && !this.forcedDashboard) {

            this.renderModal(activeProposal);

            return;

        }



        // Renderiza a lista na tela principal (se não estiver em modo form)

        if (this.viewMode === 'form') return;

        const container = document.getElementById('view-proposta-tecnica');

        if (!container) return;



        const propostas = store.getState().propostasTecnicas || [];

        // Rebuild se faltar o header OU o container da lista: o markup do modal tem
        // .module-header-sticky mas não tem #propostas-tecnicas-list-container — sem
        // isto, closeModal -> subscriber -> render() estourava em listContainer null
        // e abortava o closeModal (syncProposals/render finais nunca rodavam).
        if (!container.querySelector('.module-header-sticky') || !container.querySelector('#propostas-tecnicas-list-container')) {
            container.innerHTML = `
                <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                    <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-file-text"></i> Propostas Técnicas
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">Gerencie suas propostas técnicas aqui.</div>
                        </div>
                        <div style="display:flex;gap:10px;">
${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.propostaTecnica.create()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                                <i class="ph ph-plus"></i> Nova Proposta
                            </button>` : ''}
                        </div>
                    </div>

                    <div id="propostas-tecnicas-list-container" style="flex:1;overflow-y:auto;padding:0;"></div>
                </div>
            `;
        }

        const listContainer = container.querySelector('#propostas-tecnicas-list-container');

        if (propostas.length === 0) {
            listContainer.innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
                    <div style="text-align: center; color: #94a3b8;">
                        <i class="ph ph-file-text" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Nenhuma proposta técnica cadastrada.</p>
                        <button class="btn btn-sm btn-secondary" style="margin-top: 10px;" onclick="app.propostaTecnica.create()">Criar a primeira</button>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<table class="w-full text-left" style="border-collapse: collapse;">';
        html += `
            <thead>
                <tr style="border-bottom: 1px solid var(--color-border); background: #f8fafc;">
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Data</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">PTC</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Cliente</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Projeto</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px; text-align: right;">Ações</th>
                </tr>
            </thead>
            <tbody>
        `;

        propostas.forEach(p => {
            const date = new Date(p.createdAt || p.updatedAt).toLocaleDateString();

            html += `
                <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 12px 16px;">${date}</td>
                    <td style="padding: 12px 16px; font-weight: 500; font-size: 12px; color: var(--color-primary);">${p.ptcFolder || '-'}</td>
                    <td style="padding: 12px 16px; font-weight: 500;">${p.cliente}</td>
                    <td style="padding: 12px 16px; font-weight: 500;">${p.projeto || '-'}</td>
                    <td style="padding: 12px 16px; text-align: right;">
${store.canEdit() ? `                        <button class="btn-icon" onclick="app.propostaTecnica.editProposal('${p.id}')" title="Editar">
                            <i class="ph ph-pencil-simple"></i>
                        </button>` : ''}
                        <button class="btn-icon" onclick="app.propostaTecnica.deleteProposal('${p.id}')" title="Excluir" style="color: var(--color-danger);">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        listContainer.innerHTML = html;

    },

    editProposal(id) {
        const propostas = store.getState().propostasTecnicas || [];
        const proposta = propostas.find(p => p.id === id);
        if (proposta) this.edit(proposta);
    },

    deleteProposal(id) {
        if (confirm('Tem certeza que deseja excluir esta proposta técnica?')) {
            store.deletePropostaTecnica(id);
            window.app.toast("Proposta removida.", "success");
        }
    },

    renderEletrocentroTab(eq) {

        eq.eletrocentroScope = migrateEletrocentroScope(eq.eletrocentroScope);

        const groups = eq.eletrocentroScope;



        // Calcula offset de numeração global

        let globalIndex = 0;

        const groupsHtml = groups.map((group, gi) => {

            const groupItemsHtml = group.items.map((it) => {

                globalIndex++;

                const idx = globalIndex;

                return `

                <tr class="el-scope-row" data-group="${gi}" style="border-bottom: 1px solid #f1f5f9;">

                    <td class="el-scope-index" style="padding: 12px; text-align: center; font-weight: 800; color: #64748b; width: 60px;">${String(idx).padStart(2, '0')}</td>

                    <td style="padding: 12px;"><input type="text" name="el_scope_desc" class="form-control" value="${(it.desc || '').replace(/"/g, '&quot;')}"></td>

                    <td style="padding: 12px; text-align: center;"><input type="checkbox" name="el_scope_empresa" ${it.minhaEmpresa ? 'checked' : ''} ${it.na ? 'disabled style="opacity:0.5"' : ''}></td>

                    <td style="padding: 12px; text-align: center;"><input type="checkbox" name="el_scope_na" ${it.na ? 'checked' : ''} onchange="app.propostaTecnica.handleNaChange(this)"></td>

                    <td style="padding: 12px; text-align: center;"><input type="checkbox" name="el_scope_cli" ${it.cli ? 'checked' : ''} ${it.na ? 'disabled style="opacity:0.5"' : ''}></td>

                    <td style="padding: 12px; text-align: center;"><button type="button" class="btn-icon" style="color:#ef4444" onclick="this.closest('tr').remove(); app.propostaTecnica.reindexEletrocentroRows();"><i class="ph ph-trash"></i></button></td>

                </tr>`;

            }).join('');



            return `

            <tbody class="el-scope-group" data-group="${gi}">

                <tr class="el-section-row" style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">

                    <td style="background:#e2e8f0; width:60px;"></td>

                    <td style="background:#e2e8f0; padding:8px 12px;">

                        <input type="text" class="el-group-name form-control" data-group="${gi}"

                            value="${(group.groupName || '').replace(/"/g, '&quot;')}"

                            style="font-weight:800; color:#1e3a8a; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; background:transparent; border:1px dashed #93c5fd; padding:4px 8px; border-radius:6px;"

                            placeholder="Nome do grupo">

                    </td>

                    <td style="background:#e2e8f0;"></td>

                    <td style="background:#e2e8f0;"></td>

                    <td style="background:#e2e8f0;"></td>

                    <td style="background:#e2e8f0; text-align:center; white-space:nowrap;">

                        <button type="button" class="btn-icon" style="color:#3b82f6; font-size:11px; margin-right:4px;" title="Adicionar item neste grupo" onclick="app.propostaTecnica.addEletrocentroRowToGroup(${gi})"><i class="ph ph-plus-circle"></i></button>

                        <button type="button" class="btn-icon" style="color:#ef4444; font-size:11px;" title="Remover grupo" onclick="app.propostaTecnica.removeEletrocentroGroup(${gi})"><i class="ph ph-trash"></i></button>

                    </td>

                </tr>

                ${groupItemsHtml}

            </tbody>`;

        }).join('');



        return `

            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 800px; display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">

                    <div>

                        <h4 style="margin:0; color:#1e3a8a; font-size:18px;">Escopo: ${eq.tag}</h4>

                        <div style="font-size:12px; color:#64748b; margin-top:4px;">Definição de itens inclusos na sala modular</div>

                    </div>

                    <div style="display:flex; gap:8px;">

                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.loadDefaultEletrocentroScope()"><i class="ph ph-arrow-counter-clockwise"></i> Restaurar Padrão</button>

                        <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica.addEletrocentroGroup()"><i class="ph ph-plus"></i> Adicionar Grupo</button>

                    </div>

                </div>

                <div id="el-scope-container" style="border:1px solid #e2e8f0; border-radius:0 12px 12px 12px; overflow:hidden; background:white;">

                    <div style="max-height:500px; overflow-y:auto;">

                        <table class="w-full" style="font-size:13px; border-collapse:collapse;">

                            <thead>

                                <tr style="position:sticky; top:0; background:rgb(30, 58, 138); color:#fff; z-index:10; box-shadow:inset 0 -2px 0 #e2e8f0;">

                                    <th style="padding:14px; text-align:center; width:60px; background:rgb(30, 58, 138); color:#fff;">ITEM</th>

                                    <th style="padding:14px; text-align:left; background:rgb(30, 58, 138); color:#fff;">MATRIZ DE RESPONSABILIDADE</th>

                                    <th style="padding:14px; text-align:center; width:90px; background:rgb(30, 58, 138); color:#fff;">PTC</th>

                                    <th style="padding:14px; text-align:center; width:90px; background:rgb(30, 58, 138); color:#fff;">N/A</th>

                                    <th style="padding:14px; text-align:center; width:90px; background:rgb(30, 58, 138); color:#fff;">CLIENTE</th>

                                    <th style="padding:14px; width:80px; background:rgb(30, 58, 138); color:#fff;"></th>

                                </tr>

                            </thead>

                            ${groupsHtml}

                        </table>

                    </div>

                    ${groups.length === 0 ? '<div style="padding:40px; text-align:center; color:#94a3b8;">Nenhum grupo. Clique em "+ Adicionar Grupo".</div>' : ''}

                </div>

            </div>

        `;

    },



    addEletrocentroGroup() {

        const container = document.getElementById('el-scope-container');

        if (!container) return;

        const existingGroups = container.querySelectorAll('.el-scope-group');

        const gi = existingGroups.length;

        const tbody = document.createElement('tbody');

        tbody.className = 'el-scope-group';

        tbody.dataset.group = gi;

        tbody.innerHTML = `

            <tr class="el-section-row" style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">

                <td style="background:#e2e8f0; width:60px;"></td>

                <td style="background:#e2e8f0; padding:8px 12px;">

                    <input type="text" class="el-group-name form-control" data-group="${gi}"

                        value="NOVO GRUPO"

                        style="font-weight:800; color:#1e3a8a; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; background:transparent; border:1px dashed #93c5fd; padding:4px 8px; border-radius:6px;"

                        placeholder="Nome do grupo">

                </td>

                <td style="background:#e2e8f0;"></td>

                <td style="background:#e2e8f0;"></td>

                <td style="background:#e2e8f0;"></td>

                <td style="background:#e2e8f0; text-align:center; white-space:nowrap;">

                    <button type="button" class="btn-icon" style="color:#3b82f6; font-size:11px; margin-right:4px;" title="Adicionar item neste grupo" onclick="app.propostaTecnica.addEletrocentroRowToGroup(${gi})"><i class="ph ph-plus-circle"></i></button>

                    <button type="button" class="btn-icon" style="color:#ef4444; font-size:11px;" title="Remover grupo" onclick="app.propostaTecnica.removeEletrocentroGroup(${gi})"><i class="ph ph-trash"></i></button>

                </td>

            </tr>`;

        const table = container.querySelector('table');

        if (table) table.appendChild(tbody);

        this.reindexEletrocentroRows();

    },



    addEletrocentroRowToGroup(gi) {

        const tbody = document.querySelector(`.el-scope-group[data-group="${gi}"]`);

        if (!tbody) return;

        const row = document.createElement('tr');

        row.className = 'el-scope-row';

        row.dataset.group = gi;

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td class="el-scope-index" style="padding:12px; text-align:center; font-weight:800; color:#64748b; width:60px;">00</td>

            <td style="padding:12px;"><input type="text" name="el_scope_desc" class="form-control" value=""></td>

            <td style="padding:12px; text-align:center;"><input type="checkbox" name="el_scope_empresa"></td>

            <td style="padding:12px; text-align:center;"><input type="checkbox" name="el_scope_na" onchange="app.propostaTecnica.handleNaChange(this)"></td>

            <td style="padding:12px; text-align:center;"><input type="checkbox" name="el_scope_cli"></td>

            <td style="padding:12px; text-align:center;"><button type="button" class="btn-icon" style="color:#ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.reindexEletrocentroRows();"><i class="ph ph-trash"></i></button></td>`;

        tbody.appendChild(row);

        this.reindexEletrocentroRows();

    },



    removeEletrocentroGroup(gi) {

        if (!confirm('Remover este grupo e todos os seus itens?')) return;

        const tbody = document.querySelector(`.el-scope-group[data-group="${gi}"]`);

        if (tbody) tbody.remove();

        this.reindexEletrocentroRows();

    },



    reindexEletrocentroRows() {

        // Numeração contínua global, ignorando linhas de cabeçalho de grupo

        const rows = document.querySelectorAll('.el-scope-row');

        rows.forEach((row, i) => {

            const cell = row.querySelector('.el-scope-index');

            if (cell) cell.textContent = String(i + 1).padStart(2, '0');
        });
    },

    _exportLayoutPDF() {
        try {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const montagem = eq.technical?.montagem || 'Em Linha';
        const isB2B = montagem === 'Back to Back';

        const CANVAS_HEIGHT = 2000;
        const PADDING = 80;
        const BOTTOM_LABEL_HEIGHT = 120;
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / 2300;
        const SCREEN_SCALE = (500 - 60 - 50) / 2300;
        const FONT_MULT = SCALE / SCREEN_SCALE;

        const makeCanvas = cabinets => {
            const totalCabinetPixels = cabinets.reduce((s, c) => s + c.width * SCALE, 0);
            const cw = Math.ceil(totalCabinetPixels + PADDING * 2);
            const cv = document.createElement('canvas');
            cv.width = cw;
            cv.height = CANVAS_HEIGHT;
            this._drawLayoutInternal(cv.getContext('2d'), cabinets, SCALE, FONT_MULT, PADDING);
            return cv;
        };

        const makeSideCanvas = (cabinets, cabinetIndex, rearCabins = null) => {
            const isB2B = Array.isArray(rearCabins) && rearCabins.length > 0;
            const selectedCabins = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
                ? [cabinets[cabinetIndex]]
                : cabinets;
            const frontDepth = Math.max(...selectedCabins.map(c => c.depth || 600));
            const rearDepth = isB2B
                ? Math.max(...rearCabins.map(c => c.depth || 600))
                : 0;
            const boxDepth = isB2B ? frontDepth : frontDepth + rearDepth;
            const boxW = boxDepth * SCALE;
            const cw = Math.ceil(boxW + PADDING * 2);
            const cv = document.createElement('canvas');
            cv.width = cw;
            cv.height = CANVAS_HEIGHT;
            const ctx = cv.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, cw, CANVAS_HEIGHT);
            const singleLabel = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
                ? cabinets[cabinetIndex].name
                : null;
            this._drawSideViewInternal(ctx, selectedCabins, frontDepth, SCALE, FONT_MULT, PADDING, singleLabel, rearCabins);
            return cv;
        };

        let imagesHtml = '';
        const showSide = eq.layoutConfig?.showSideView;
        const flexPage = (mainCv, sideCv) => {
            const main = `<img src="${mainCv.toDataURL('image/png')}" style="max-height:97vh;width:auto;object-fit:contain;">`;
            const side = sideCv ? `<img src="${sideCv.toDataURL('image/png')}" style="max-height:97vh;width:auto;object-fit:contain;">` : '';
            return `<div style="display:flex;gap:40px;align-items:flex-start;justify-content:center;page-break-after:always;">${main}${side}</div>`;
        };
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                app.toast('Nenhum material com dimensões ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            const cv = makeCanvas(result.cabinets);
            const cvS = showSide && result.cabinets.length > 0
                ? makeSideCanvas(result.cabinets, eq.layoutConfig?.sideViewCabinetIndex) : null;
            imagesHtml = flexPage(cv, cvS);
        } else if (isB2B) {
            const resultF = this.suggestLayout(eq, 'front');
            const resultT = this.suggestLayout(eq, 'rear');
            if (resultF.hasLoads && resultF.cabinets.length > 0) {
                const cvF = makeCanvas(resultF.cabinets);
                const cvS = showSide && resultF.cabinets.length > 0
                    ? makeSideCanvas(resultF.cabinets, eq.layoutConfig?.sideViewCabinetIndex, resultT.cabinets) : null;
                imagesHtml += flexPage(cvF, cvS);
            }
            if (resultT.hasLoads && resultT.cabinets.length > 0) {
                const cvT = makeCanvas(resultT.cabinets);
                const cvSr = showSide && resultT.cabinets.length > 0
                    ? makeSideCanvas(resultF.cabinets, eq.layoutConfig?.sideViewCabinetIndex, resultT.cabinets) : null;
                imagesHtml += flexPage(cvT, cvSr);
            }
        } else {
            const result = this.suggestLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                app.toast('Nenhuma carga com típico ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            const cv = makeCanvas(result.cabinets);
            const cvS = showSide && result.cabinets.length > 0
                ? makeSideCanvas(result.cabinets, eq.layoutConfig?.sideViewCabinetIndex) : null;
            imagesHtml = flexPage(cv, cvS);
        }

        const printFrame = document.createElement('iframe');
        printFrame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
        document.body.appendChild(printFrame);

        const printDoc = printFrame.contentWindow.document;
        printDoc.open();
        printDoc.write(`<!DOCTYPE html><html><head>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { display:flex; justify-content:center; align-items:flex-start; background:white; }
                img { max-width:100%; height:auto; }
                @media print {
                    body { display:flex; justify-content:center; align-items:flex-start; }
                    img { max-width:100%; height:auto; page-break-inside:avoid; }
                }
            </style>
        </head><body>${imagesHtml}</body></html>`);
        printDoc.close();

        console.log('[PDF] iframe ready, calling print');

        const cleanup = () => {
            document.body.removeChild(printFrame);
            window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);
        printFrame.contentWindow.focus();
        requestAnimationFrame(() => {
            printFrame.contentWindow.print();
        });
        setTimeout(cleanup, 30000);
        } catch(e) { console.error('[PDF] error:', e); app.toast('Erro ao exportar PDF: ' + e.message, 'error'); }
    },

    _exportLayoutDXF() {
        try {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) { console.warn('[DXF] eq not found'); app.toast('Nenhum equipamento ativo.', 'error'); return; }
        const montagem = eq.technical?.montagem || 'Em Linha';
        const isB2B = montagem === 'Back to Back';
        const materiais = store.getState().materiais || [];

        const materialDxfMap = {};
        for (const m of materiais) {
            if (m.dxf_block) {
                try { materialDxfMap[m.id] = JSON.parse(m.dxf_block); }
                catch (e) { /* skip invalid JSON */ }
            }
        }

        let CAB_H = 2300;
        const yf = y => CAB_H - y;

        const d = new DXFWriter();
        d.setUseCRLF(true);

        const L_CAB = 'CABINETE';
        const L_BAR = 'BARRAMENTO';
        const L_CAN = 'CANALETA';
        const L_CAN_SIDE = 'CANALETA_SIDE';
        const L_TRI = 'TRILHO_DIN';
        const L_COMP = 'COMPONENTE';
        const L_TERRA = 'BARRA_TERRA';
        const L_BASE = 'BASE';
        const L_DIM = 'DIMENSAO';
        const L_TXT = 'TEXTO';

        d.addLayer(L_CAB, 7, 'CONTINUOUS');
        d.addLayer(L_BAR, 7, 'CONTINUOUS');
        d.addLayer(L_CAN, 7, 'CONTINUOUS');
        d.addLayer(L_CAN_SIDE, 7, 'DASHED');
        d.addLayer(L_TRI, 7, 'CONTINUOUS');
        d.addLayer(L_COMP, 7, 'CONTINUOUS');
        d.addLayer(L_TERRA, 7, 'CONTINUOUS');
        d.addLayer(L_BASE, 7, 'CONTINUOUS');
        d.addLayer(L_DIM, 7, 'CONTINUOUS');
        d.addLayer(L_TXT, 7, 'CONTINUOUS');
        d.addStyle('ARIAL', 'Arial', 0, 1);
        d.setDimStyle('GERAPRO');

        const addedBlocks = new Set();

        const drawCabinetGroup = (cabinets, offsetX) => {
            let x = offsetX;
            for (let ci = 0; ci < cabinets.length; ci++) {
                const cab = cabinets[ci];
                const cabW = cab.width;
                const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();

                // Cabinet outline (layout: 0 to 2300mm)
                d.setActiveLayer(L_CAB);
                d.rect(x, yf(CAB_H), cabW, CAB_H);

                // Olhais para içamento (60×60mm acima da linha 0, círculo 20mm Ø) — Forma 1/2 e Eletropoll
                const temOlhaisDxf = !this._isForma34EstruturaModular(cab.segregacao, cab._fabricante) || cab._fabricante === 'Eletropoll';
                if (temOlhaisDxf) {
                    d.rect(x, yf(0), 60, 60);                              // canto esquerdo
                    d.rect(x + cabW - 60, yf(0), 60, 60);                 // canto direito
                    d.circle(x + 30, yf(-30), 10);                         // furo central esquerdo
                    d.circle(x + cabW - 30, yf(-30), 10);                  // furo central direito
                }

                // Busbar zone label (apenas Forma 2)
                if (isForma2) {
                    d.setActiveLayer(L_BAR);
                    d.line(x, yf(300), x + cabW, yf(300));
                    d.setActiveLayer(L_TXT);
                    d.text(x + cabW / 2, yf(150), 20, 0, 'Barramentos', 'ARIAL');
                }
                d.setActiveLayer(L_TXT);
                d.text(x + cabW / 2, yf(20), 20, 0, cab.name, 'ARIAL');

                const isCabForma34 = this._isForma34EstruturaModular(cab.segregacao, cab._fabricante);
                const isEletropollDxf = cab._fabricante === 'Eletropoll';

                if (isCabForma34) {
                    // ── KitFrame / Eletropoll Forma 3A-4B: barramentos, gavetas, coluna cabos, barra terra ──
                    const ccwDxf = isEletropollDxf ? 400 : (cfg.colunaCabosWidth || 200);
                    const gavWDxf = isEletropollDxf ? (cabW - ccwDxf) : 600;
                    const colCabWDxf = ccwDxf;

                    // Barramentos (Y=0-300, full width)
                    d.setActiveLayer(L_BAR);
                    d.rect(x, yf(300), cabW, 300);
                    d.rect(x + 3, yf(297), cabW - 6, 294);
                    d.line(x, yf(300), x + cabW, yf(300));
                    d.setActiveLayer(L_TXT);
                    d.text(x + cabW / 2, yf(150), 20, 0, 'Barramentos', 'ARIAL');

                    // ── Exaustor de teto (500×100mm acima da área de gavetas) ──
                    const temExaustorDxf = isEletropollDxf ? (cab.layoutConfig?.exaustor !== false) : true;
                    if (temExaustorDxf) {
                        const exWDxf = 500;
                        const exHDxf = 100;
                        const exXDxf = x + cabW / 2 - 250;
                        d.setActiveLayer(L_CAB);
                        d.rect(exXDxf, yf(0), exWDxf, exHDxf);
                        d.rect(exXDxf + 3, yf(-3), exWDxf - 6, exHDxf - 6);
                        d.setActiveLayer(L_TXT);
                        d.text(exXDxf + exWDxf / 2, yf(-50), 12, 0, 'Exaustor', 'ARIAL');
                    }

                    // Coluna de Cabos (Y=300-2200, right side)
                    const colCabXDxf = x + gavWDxf;
                    d.setActiveLayer(L_CAB);
                    d.rect(colCabXDxf, yf(2200), colCabWDxf, 1900);
                    d.rect(colCabXDxf + 3, yf(2197), colCabWDxf - 6, 1894);
                    d.setActiveLayer(L_TXT);
                    d.text(colCabXDxf + colCabWDxf / 2, yf(2170), 15, 0, 'Coluna Cabos', 'ARIAL');

                    // Gavetas area (Y=300-2100, left area)
                    const gavDxf = cab._gavetas || [];
                    if (gavDxf.length > 0) {
                        let gavYOffDxf = 300;
                        for (const gav of gavDxf) {
                            const ghDxf = gav.height;
                            d.setActiveLayer(L_COMP);
                            d.rect(x, yf(gavYOffDxf + ghDxf), gavWDxf, ghDxf);
                            d.rect(x + 3, yf(gavYOffDxf + ghDxf - 3), gavWDxf - 6, ghDxf - 6);
                            const fechoXDxf = x + gavWDxf - 40;
                            if (gav.height === 100 || gav.height === 150) {
                                const fy = gavYOffDxf + ghDxf / 2 - 15;
                                d.rect(fechoXDxf, yf(fy + 30), 20, 30);
                                d.circle(fechoXDxf + 10, yf(fy + 15), 5);
                            } else if (gav.height >= 200) {
                                const fy1 = gavYOffDxf + 50 - 15;
                                const fy2 = gavYOffDxf + ghDxf - 50 - 15;
                                d.rect(fechoXDxf, yf(fy1 + 30), 20, 30);
                                d.circle(fechoXDxf + 10, yf(fy1 + 15), 5);
                                d.rect(fechoXDxf, yf(fy2 + 30), 20, 30);
                                d.circle(fechoXDxf + 10, yf(fy2 + 15), 5);
                            }
                            // Comando Mecânico (70x70mm rect + 16mm circle)
                            {
                                const cmWDxf = 70;
                                const cmHDxf = 70;
                                const cmXDxf = x + gavWDxf / 2 - 35;
                                let cmYDxf;
                                if (gav.height === 100) {
                                    cmYDxf = gavYOffDxf + ghDxf / 2 - 35;
                                } else {
                                    cmYDxf = gavYOffDxf + ghDxf - 50 - 35;
                                }
                                d.setActiveLayer(L_COMP);
                                d.rect(cmXDxf, yf(cmYDxf + cmHDxf), cmWDxf, cmHDxf);
                                d.circle(cmXDxf + 35, yf(cmYDxf + 35), 8);
                            }
                            d.setActiveLayer(L_TXT);
                            const cmCenterYDxf = gav.height === 100 ? gavYOffDxf + ghDxf / 2 : gavYOffDxf + ghDxf - 50;
                            if (gav._isReserva) {
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 8 - 23.2), 12, 0, 'TAG??', 'ARIAL');
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 38 - 23.2), 12, 0, 'Gav. Reserva', 'ARIAL');
                            } else {
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 8 - 23.2), 12, 0, gav.cargaTag || '', 'ARIAL');
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 38 - 23.2), 12, 0, (gav.potencia ? gav.potencia + 'kW' : ''), 'ARIAL');
                            }
                            d.text(x + 30, yf(gavYOffDxf + 10), 8, 0, gav.id, 'ARIAL');
                            gavYOffDxf += ghDxf;
                        }
                    } else {
                        d.setActiveLayer(L_CAB);
                        d.rect(x, yf(2100), gavWDxf, 1800);
                        d.setActiveLayer(L_TXT);
                        d.text(x + gavWDxf / 2, yf(1200), 15, 0, 'Gavetas', 'ARIAL');
                    }

                    // Barra Terra (Y=2100-2200, left 600mm)
                    d.setActiveLayer(L_TERRA);
                    d.rect(x, yf(2200), gavWDxf, 100);
                    d.rect(x + 3, yf(2197), gavWDxf - 6, 94);
                    d.setActiveLayer(L_TXT);
                    d.text(x + gavWDxf / 2, yf(2150), 15, 0, 'Barra Terra', 'ARIAL');
                } else {
                    // ── Forma 1 / Forma 2: canaletas, trilhos, componentes, placa de montagem ──
                    // Canaletas
                    d.setActiveLayer(L_CAN);
                    for (const can of cfg.canaletas || []) {
                        if (can.tipo === 'quadro') {
                            const cx = x + (can.x || 0);
                            const cy = (can.y || 0);
                            const cw = can.larguraQuadro || 500;
                            const ch = can.alturaQuadro || 1800;
                            const cl = can.largura_base || 50;
                            d.rect(cx, yf(cy + ch), cw, ch);
                            d.rect(cx + cl, yf(cy + ch - cl), cw - 2 * cl, ch - 2 * cl);
                            d.line(cx, yf(cy), cx + cl, yf(cy + cl));
                            d.line(cx + cw, yf(cy), cx + cw - cl, yf(cy + cl));
                            d.line(cx + cw, yf(cy + ch), cx + cw - cl, yf(cy + ch - cl));
                            d.line(cx, yf(cy + ch), cx + cl, yf(cy + ch - cl));
                            if (cw > 60 && ch > 40) {
                                const modeloTxt = can.modelo || (can.largura_base || '') + 'x' + (can.profundidade || '');
                                if (modeloTxt) {
                                    d.setActiveLayer(L_TXT);
                                    d.text(cx + cw / 2, yf(cy + ch / 2), 30, 0, modeloTxt, 'ARIAL');
                                    d.setActiveLayer(L_CAN);
                                }
                            }
                        } else if (can.tipo === 'linear') {
                            const lx = x + (can.x || 0);
                            const ly = (can.y || 0);
                            const lw = can.orientacao === 'H' ? (can.comprimento || 0) : (can.largura_base || can.largura || 50);
                            const lh = can.orientacao === 'H' ? (can.largura_base || can.largura || 50) : (can.comprimento || 0);
                            d.rect(lx, yf(ly + lh), lw, lh);
                            d.setActiveLayer(L_TXT);
                            d.text(lx + lw / 2, yf(ly + lh / 2), 30, 0, 'TESTE', 'ARIAL');
                            d.setActiveLayer(L_CAN);
                        }
                    }

                    // DIN rails + components
                    for (const row of cab.rows || []) {
                        if (row.trilho) {
                            const t = row.trilho;
                            d.setActiveLayer(L_TRI);
                            d.rect(x + t.x, yf(t.y + t.h), t.w, t.h);
                        }
                        for (const item of row.items) {
                            const ix = x + item.x;
                            const iy = item.y;
                            const iw = Math.max(item.w, 1);
                            const ih = Math.max(item.h, 1);
                            const matDxf = materialDxfMap[item._matId];

                            if (matDxf && matDxf.entities && matDxf.entities.length > 0) {
                                const rawId = item._matId;
                                const blockName = 'B' + (rawId ? rawId.replace(/[^a-zA-Z0-9]/g, '_') : 'x_' + Math.random().toString(36).slice(2, 8));
                                if (!addedBlocks.has(blockName)) {
                                    addedBlocks.add(blockName);
                                    d.addBlock(blockName, (b) => {
                                        for (const ent of matDxf.entities) {
                                            this._drawDxfEntity(b, ent);
                                        }
                                    });
                                }
                                d.setActiveLayer(L_COMP);
                                d.insertBlock(blockName, ix, yf(iy + ih), 1, 1, 0);
                            } else {
                                d.setActiveLayer(L_COMP);
                                d.rect(ix, yf(iy + ih), iw, ih);
                                if (iw > 20 && ih > 10) {
                                    const label = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                                    d.setActiveLayer(L_TXT);
                                    d.text(ix + iw / 2, yf(iy + ih / 2), 20, 0, label, 'ARIAL');
                                }
                            }
                        }
                    }

                    // Placa de montagem + barra terra
                    const isCabForma2 = cab.segregacao === 'Forma 2a' || cab.segregacao === 'Forma 2b';
                    d.setActiveLayer(L_CAB);
                    d.rect(x + 30, yf(panelH - 30), cabW - 60, panelH - 60);
                    d.setActiveLayer(L_TERRA);
                    if (isCabForma2) {
                        d.rect(x + 50, yf(315 + 1840), cabW - 100, 1840);
                    } else {
                        const plateH = panelH - 105;
                        const plateYFront = 30 + (panelH - 60 - plateH) / 2;
                        d.rect(x + 50, yf(plateYFront + plateH), cabW - 100, plateH);
                    }
                    d.setActiveLayer(L_TXT);
                    d.text(x + cabW / 2, yf(2135), 20, 0, 'Placa de Montagem', 'ARIAL');
                    if (!isCabForma2 && !cab._isAutomation) {
                        d.setActiveLayer(L_TERRA);
                        d.line(x, yf(panelH - 100), x + cabW, yf(panelH - 100));
                        d.setActiveLayer(L_TXT);
                        d.text(x + cabW / 2, yf(panelH - 75), 20, 0, 'Barra Terra', 'ARIAL');
                    }
                }

                // Base
                d.setActiveLayer(L_BASE);
                d.line(x, yf(panelH), x + cabW, yf(panelH));
                d.setActiveLayer(L_TXT);
                d.text(x + cabW / 2, yf(panelH + 25), 20, 0, 'Base', 'ARIAL');

                // Cabinet width dimension
                d.setActiveLayer(L_DIM);
                d.dim(x, yf(panelH + 190), x + cabW, yf(panelH + 190), cabW + 'mm', yf(panelH + 185), 'ARIAL');

                x += cabW;
            }
            // Título da vista (abaixo da base e das labels, centralizado)
            const totalWdxf = x - offsetX;
            if (totalWdxf > 0 && cabinets.length > 0) {
                const isRear = cabinets[0]._face === 'rear';
                const titulo = isRear ? 'Vista Traseira Interna' : 'Vista Frontal Interna';
                d.setActiveLayer(L_TXT);
                d.text(offsetX + totalWdxf / 2, yf(panelH + 280), 25, 0, titulo, 'ARIAL');
            }
        };

        const drawDoorCabinetGroup = (cabinets, offsetX) => {
            let x = offsetX;
            for (let ci = 0; ci < cabinets.length; ci++) {
                const cab = cabinets[ci];
                const cabW = cab.width;
                const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();

                // Cabinet outline
                d.setActiveLayer(L_CAB);
                d.rect(x, yf(CAB_H), cabW, CAB_H);

                // Olhais
                d.rect(x, yf(0), 60, 60);
                d.rect(x + cabW - 60, yf(0), 60, 60);
                d.circle(x + 30, yf(-30), 10);
                d.circle(x + cabW - 30, yf(-30), 10);

                // Door rectangle (cab.width - 10 × panelH - 10)
                const doorW = cabW - 10;
                const doorX = x + 5;
                const doorY = 5;
                const doorH = panelH - 10;
                d.setActiveLayer(L_CAB);
                d.rect(doorX, yf(doorY + doorH), doorW, doorH);

                // Door components
                const doorRows = cab.doorRows || [];
                for (const row of doorRows) {
                    for (const item of row.items) {
                        const ix = x + item.x;
                        const iy = doorY + item.y;
                        const iw = Math.max(item.w, 1);
                        const ih = Math.max(item.h, 1);
                        d.setActiveLayer(L_COMP);
                        d.rect(ix, yf(iy + ih), iw, ih);
                        if (iw > 20 && ih > 10) {
                            const label = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                            d.setActiveLayer(L_TXT);
                            d.text(ix + iw / 2, yf(iy + ih / 2), 20, 0, label, 'ARIAL');
                        }
                    }
                }

                // Base
                d.setActiveLayer(L_BASE);
                d.line(x, yf(panelH), x + cabW, yf(panelH));
                d.setActiveLayer(L_TXT);
                d.text(x + cabW / 2, yf(panelH + 25), 20, 0, 'Base', 'ARIAL');

                // Dimension
                d.setActiveLayer(L_DIM);
                d.dim(x, yf(panelH + 190), x + cabW, yf(panelH + 190), cabW + 'mm × ' + (panelH + 100) + 'mm', yf(panelH + 185), 'ARIAL');

                x += cabW;
            }
            const totalWdxf = x - offsetX;
            if (totalWdxf > 0 && cabinets.length > 0) {
                const isRear = cabinets[0]._face === 'rear';
                const titulo = isRear ? 'Vista Traseira Externa' : 'Vista Frontal Externa';
                d.setActiveLayer(L_TXT);
                d.text(offsetX + totalWdxf / 2, yf(panelH + 280), 25, 0, titulo, 'ARIAL');
            }
        };

        const showSide = eq.layoutConfig?.showSideView;
        const seg = eq.technical?.segregacao;
        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const isForma34dxf = this._isForma34EstruturaModular(seg, eq.technical?.fabricante);
        const isEletropollFixoDxf = seg && this._isForma34(seg) && eq.technical?.fabricante === 'Eletropoll' && eq.technical?.tipoGaveta === 'Fixo';
        const panelH = (isForma2 || isForma34dxf) ? 2200 : parseInt(eq.technical?.alturaPainel) || 2200;
        const panelW = parseInt(eq.technical?.larguraPainel) || 800;
        const panelD = parseInt(eq.technical?.profundidadePainel) || 600;
        if (!isForma2 && !isForma34dxf) CAB_H = panelH + 100;

        let frontCabinets = [];
        let rearCabinets = [];
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                console.warn('[DXF] Export canceled: no BOM materials or no cabinets defined');
                app.toast('Nenhum material com dimensões ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            frontCabinets = result.cabinets;
            const maxH_auto = Math.max(...frontCabinets.map(c => c.height || 2300), 2300);
            if (!isForma2 && !isForma34dxf) { CAB_H = maxH_auto; panelH = maxH_auto - 100; }
            drawCabinetGroup(frontCabinets, 0);
            const totalW = frontCabinets.reduce((s, c) => s + c.width, 0);
            if (isForma2 || seg === 'Forma 1' || isEletropollFixoDxf) drawDoorCabinetGroup(frontCabinets, totalW + 200);
        } else if (isB2B) {
            const resultF = this.suggestLayout(eq, 'front');
            const resultR = this.suggestLayout(eq, 'rear');
            frontCabinets = resultF.cabinets;
            rearCabinets = resultR.cabinets;
            const maxH_b2b = Math.max(...[...frontCabinets, ...rearCabinets].map(c => c.height || 2300), 2300);
            if (!isForma2 && !isForma34dxf) { CAB_H = maxH_b2b; panelH = maxH_b2b - 100; }
            if (resultF.hasLoads && frontCabinets.length > 0) {
                drawCabinetGroup(frontCabinets, 0);
            }
            if (resultR.hasLoads && rearCabinets.length > 0) {
                const totalW = frontCabinets.reduce((s, c) => s + c.width, 0);
                drawCabinetGroup(rearCabinets, totalW + 200);
            }
            if ((isForma2 || seg === 'Forma 1' || isEletropollFixoDxf) && frontCabinets.length > 0 && rearCabinets.length > 0) {
                const doorStart = frontCabinets.reduce((s, c) => s + c.width, 0) + 200 + rearCabinets.reduce((s, c) => s + c.width, 0) + 200;
                drawDoorCabinetGroup(frontCabinets, doorStart);
                const doorFrontEnd = doorStart + frontCabinets.reduce((s, c) => s + c.width, 0) + 200;
                drawDoorCabinetGroup(rearCabinets, doorFrontEnd);
            }
        } else {
            const result = this.suggestLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                console.warn('[DXF] Export canceled: no loads with typicals or no cabinets defined');
                app.toast('Nenhuma carga com típico ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            frontCabinets = result.cabinets;
            const maxH_single = Math.max(...frontCabinets.map(c => c.height || 2300), 2300);
            if (!isForma2 && !isForma34dxf) { CAB_H = maxH_single; panelH = maxH_single - 100; }
            drawCabinetGroup(frontCabinets, 0);
            if (isForma2 || seg === 'Forma 1' || isEletropollFixoDxf) {
                const totalW = frontCabinets.reduce((s, c) => s + c.width, 0);
                drawDoorCabinetGroup(frontCabinets, totalW + 200);
            }
        }

        // Side view group (DXF) — combined single section view
        const drawDxfSideView = (cabinets, cabinetIndex, labelPrefix, startX, rearCabinets) => {
            if (!cabinets || cabinets.length === 0) return startX;
            const isB2B = Array.isArray(rearCabinets) && rearCabinets.length > 0;
            const cabIdx = cabinetIndex;
            const selectedCabins = (cabIdx != null && cabIdx >= 0 && cabIdx < cabinets.length)
                ? [cabinets[cabIdx]]
                : cabinets;

            // Depths: front cabinet + optional rear cabinet
            const frontDepth = Math.max(...selectedCabins.map(c => c.depth || 600));
            const rearDepth = isB2B
                ? Math.max(...rearCabinets.map(c => c.depth || 600))
                : 0;
            const totalDepth = isB2B ? frontDepth : frontDepth + rearDepth;
            const isForma34Side = cabinets.some(c => this._isForma34EstruturaModular(c.segregacao, c._fabricante));
            const sx = startX;

            // Cabinet outline (single combined box)
            d.setActiveLayer(L_CAB);
            d.rect(sx, yf(CAB_H), totalDepth, CAB_H);

            // Olhais para içamento — vista lateral (corte): 4×60mm, faces internas distanciadas 485mm — Forma 1/2 e Eletropoll
            const temOlhaisSide = !isForma34Side || cabinets.some(c => c._fabricante === 'Eletropoll');
            if (temOlhaisSide) {
                const eyeW_dx = 4, eyeH_dx = 60, innerDist_dx = 485;
                const marginEyeDx = (totalDepth - innerDist_dx - eyeW_dx * 2) / 2;
                if (marginEyeDx > 0) {
                    d.rect(sx + marginEyeDx, yf(0), 4, 60);
                    d.rect(sx + marginEyeDx + eyeW_dx + innerDist_dx, yf(0), 4, 60);
                }
            }

            // Base
            d.setActiveLayer(L_BASE);
            d.line(sx, yf(panelH), sx + totalDepth, yf(panelH));
            d.setActiveLayer(L_TXT);
            d.text(sx + totalDepth / 2, yf(panelH + 25), 20, 0, 'Base', 'ARIAL');

            // Ground bar (apenas CCM Forma 1)
            const isForma2 = cabinets.some(c => c.segregacao === 'Forma 2a' || c.segregacao === 'Forma 2b');
            const isAutomationSide = cabinets.some(c => c._isAutomation);
            if (!isForma2 && !isAutomationSide && !isForma34Side) {
                d.setActiveLayer(L_TERRA);
                d.line(sx, yf(panelH - 100), sx + totalDepth, yf(panelH - 100));
                d.setActiveLayer(L_TXT);
                d.text(sx + totalDepth / 2, yf(panelH - 75), 20, 0, 'Barra Terra', 'ARIAL');
            }

            if (!isForma34Side) {
                // Borda de 30mm + placa de montagem (apenas Forma 1 / Forma 2)
                let minPlateZ_dx = null, minPlateD_dx = 0;
                for (const cab of selectedCabins) {
                    const cd = cab._assignData;
                    const src = cd && cab._face ? this._getLoadsAsFlat(cd.faces?.[cab._face]) : this._getLoadsAsFlat(cd);
                    for (const row of cab.rows || []) {
                        for (const item of row.items || []) {
                            const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                            if (zo != null && (minPlateZ_dx === null || zo < minPlateZ_dx)) {
                                minPlateZ_dx = zo;
                                minPlateD_dx = item.d || 0;
                            }
                        }
                    }
                }
                const plateFaceDir_dx = minPlateZ_dx !== null ? minPlateZ_dx : 0;
                let minRearZ_dx = null, minRearD_dx = 0;
                if (isB2B) {
                    for (const cab of rearCabinets) {
                        const cd = cab._assignData;
                        const src = cd && cab._face ? this._getLoadsAsFlat(cd.faces?.[cab._face]) : this._getLoadsAsFlat(cd);
                        for (const row of cab.rows || []) {
                            for (const item of row.items || []) {
                                const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                                if (zo != null && (minRearZ_dx === null || zo < minRearZ_dx)) {
                                    minRearZ_dx = zo;
                                    minRearD_dx = item.d || 0;
                                }
                            }
                        }
                    }
                }
                const plateFaceDirRear_dx = minRearZ_dx !== null ? minRearZ_dx : 0;
                if (isForma2) {
                    d.setActiveLayer(L_CAB);
                    d.rect(sx + 30, yf(panelH - 30), totalDepth - 60, panelH - 60);
                    d.setActiveLayer(L_TERRA);
                    const plateLeft_dx = totalDepth - plateFaceDir_dx - 20;
                    d.rect(sx + plateLeft_dx, yf(315 + 1840), 20, 1840);
                    d.setActiveLayer(L_TXT);
                    d.text(sx + plateLeft_dx + 10, yf(335), 20, 0, 'PM', 'ARIAL');
                    if (isB2B) {
                        d.setActiveLayer(L_TERRA);
                        d.rect(sx + plateFaceDirRear_dx, yf(315 + 1840), 20, 1840);
                        d.setActiveLayer(L_TXT);
                        d.text(sx + plateFaceDirRear_dx + 10, yf(335), 20, 0, 'PM', 'ARIAL');
                    }
                } else {
                    d.setActiveLayer(L_CAB);
                    d.rect(sx + 30, yf(panelH - 30), totalDepth - 60, panelH - 60);
                    d.setActiveLayer(L_TERRA);
                    const plateHSide = panelH - 105;
                    const plateYSide = 30 + (panelH - 60 - plateHSide) / 2;
                    const plateLeft_dx = totalDepth - plateFaceDir_dx - 20;
                    d.rect(sx + plateLeft_dx, yf(plateYSide + plateHSide), 20, plateHSide);
                    d.setActiveLayer(L_TXT);
                    d.text(sx + plateLeft_dx + 10, yf(35 + plateHSide / 2), 20, 0, 'PM', 'ARIAL');
                    if (isB2B) {
                        d.setActiveLayer(L_TERRA);
                        d.rect(sx + plateFaceDirRear_dx, yf(plateYSide + plateHSide), 20, plateHSide);
                        d.setActiveLayer(L_TXT);
                        d.text(sx + plateFaceDirRear_dx + 10, yf(35 + plateHSide / 2), 20, 0, 'PM', 'ARIAL');
                    }
                }

                // Canaletas na vista lateral (apenas Forma 1 / Forma 2)
                d.setActiveLayer(L_CAN_SIDE);
                for (const cab of selectedCabins) {
                    const cfgC = cab.layoutConfig || this._getDefaultLayoutConfig();
                    for (const can of cfgC.canaletas || []) {
                        const profC = can.profundidade || can.largura_base || 50;
                        const canZPos = isForma2 ? sx + totalDepth - plateFaceDir_dx : sx + totalDepth - profC;
                        if (can.tipo === 'quadro') {
                            for (const seg of can.segmentos || []) {
                                if (seg.orientacao === 'V') {
                                    d.rect(canZPos, yf(seg.y + seg.comprimento), profC, seg.comprimento);
                                    const modeloTxt = can.modelo || (can.largura_base || '') + 'x' + (can.profundidade || '');
                                    if (modeloTxt) {
                                        d.setActiveLayer(L_TXT);
                                        d.text(canZPos + profC / 2, yf(seg.y + seg.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                        d.setActiveLayer(L_CAN_SIDE);
                                    }
                                }
                            }
                        } else if (can.tipo === 'linear' && can.orientacao === 'V') {
                            d.rect(canZPos, yf(can.y + can.comprimento), profC, can.comprimento);
                            const modeloTxt = can.modelo || (can.largura_base || can.largura || '') + 'x' + (can.profundidade || can.altura || '');
                            if (modeloTxt) {
                                d.setActiveLayer(L_TXT);
                                d.text(canZPos + profC / 2, yf(can.y + can.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                d.setActiveLayer(L_CAN_SIDE);
                            }
                        }
                    }
                }

                if (isB2B) {
                    for (const cab of rearCabinets) {
                        const cfgC = cab.layoutConfig || this._getDefaultLayoutConfig();
                        for (const can of cfgC.canaletas || []) {
                            const profC = can.profundidade || can.largura_base || 50;
                            const canZPos = sx;
                            if (can.tipo === 'quadro') {
                                for (const seg of can.segmentos || []) {
                                    if (seg.orientacao === 'V') {
                                        d.rect(canZPos, yf(seg.y + seg.comprimento), profC, seg.comprimento);
                                        const modeloTxt = can.modelo || (can.largura_base || '') + 'x' + (can.profundidade || '');
                                        if (modeloTxt) {
                                            d.setActiveLayer(L_TXT);
                                            d.text(canZPos + profC / 2, yf(seg.y + seg.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                            d.setActiveLayer(L_CAN_SIDE);
                                        }
                                    }
                                }
                            } else if (can.tipo === 'linear' && can.orientacao === 'V') {
                                d.rect(canZPos, yf(can.y + can.comprimento), profC, can.comprimento);
                                const modeloTxt = can.modelo || (can.largura_base || can.largura || '') + 'x' + (can.profundidade || can.altura || '');
                                if (modeloTxt) {
                                    d.setActiveLayer(L_TXT);
                                    d.text(canZPos + profC / 2, yf(can.y + can.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                    d.setActiveLayer(L_CAN_SIDE);
                                }
                            }
                        }
                    }
                }
            }

            // Porta frontal (6.5mm × panelH-10mm) — lado externo (direita)
            const doorSideH = panelH - 10;
            d.setActiveLayer(L_CAB);
            d.rect(sx + totalDepth, yf(panelH - 5), 6.5, doorSideH);
            d.setActiveLayer(L_TXT);
            d.text(sx + totalDepth + 3.25, yf(-25), 15, 0, 'Porta', 'ARIAL');

            // Elemento traseiro espelhado (esquerda): Porta (B2B) ou Tampa Traseira aparafusada
            const backLabel = isB2B ? 'Porta' : 'Tampa Traseira';
            d.setActiveLayer(L_CAB);
            d.rect(sx - 6.5, yf(panelH - 5), 6.5, doorSideH);
            d.setActiveLayer(L_TXT);
            d.text(sx - 3.25, yf(-25), 15, 0, backLabel, 'ARIAL');

            // Linha dos barramentos (Y=300) — apenas Forma 2
            if (isForma2) {
                d.setActiveLayer(L_BAR);
                d.line(sx + 30, yf(300), sx + totalDepth - 30, yf(300));
                d.setActiveLayer(L_TXT);
                d.text(sx + totalDepth / 2, yf(150), 20, 0, 'Barramentos', 'ARIAL');
            }

            // ============================================================
            // FRONT CABINET COMPONENTS
            // ============================================================
            const collectItems = (cabList) => {
                const allItems = [];
                for (const cab of cabList) {
                    const cabData = cab._assignData;
                    const assignedSource = cabData && cab._face
                        ? this._getLoadsAsFlat(cabData.faces?.[cab._face])
                        : this._getLoadsAsFlat(cabData);
                    for (const row of cab.rows || []) {
                        for (const item of row.items || []) {
                            allItems.push({ item, assignedSource });
                        }
                    }
                }
                return allItems;
            };

            const drawItems = (itemsList, depth, isMirrored) => {
                const itemsWithManualZ = [];
                const itemsWithoutZ = [];
                for (const { item, assignedSource } of itemsList) {
            const zOff = item._matId ? (assignedSource[item._matId]?.zOffset ?? item._zOffset) : undefined;
                    if (zOff != null) {
                        itemsWithManualZ.push({ item, z: zOff });
                    } else {
                        itemsWithoutZ.push(item);
                    }
                }

                const totalManualZEnd = itemsWithManualZ.reduce((s, e) => Math.max(s, e.z), 0);
                const remainingDepth = Math.max(0, depth - totalManualZEnd);
                const autoItemsDepth = itemsWithoutZ.reduce((s, it) => s + (it.d || 0), 0);
                const gap = autoItemsDepth > 0 && itemsWithoutZ.length > 1
                    ? Math.min(5, Math.max(0, remainingDepth - autoItemsDepth) / (itemsWithoutZ.length - 1))
                    : 0;

                // Draw items with manual Z
                d.setActiveLayer(L_COMP);
                for (const { item, z } of itemsWithManualZ) {
                    const id = item.d || 20;
                    const ih = item.h || 40;
                    const izx = isMirrored
                        ? sx + Math.max(Math.min(z, depth) - id, 0)
                        : sx + Math.max(depth - z, 0);
                    const izy = (item.y || 0);
                    d.rect(izx, yf(izy + ih), Math.max(id, 1), Math.max(ih, 1));
                    if (id > 10 && ih > 10) {
                        const label2 = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                        d.setActiveLayer(L_TXT);
                        d.text(izx + id / 2, yf(izy + ih / 2), 20, 0, label2, 'ARIAL');
                        d.setActiveLayer(L_COMP);
                    }
                }

                // Draw auto-distributed items
                let currentZ = totalManualZEnd;
                const sortedAuto = [...itemsWithoutZ].sort((a, b) => (b.d || 0) - (a.d || 0));
                for (const item of sortedAuto) {
                    const id = item.d || 20;
                    const ih = item.h || 40;
                    const izx = isMirrored
                        ? sx + Math.max(currentZ - id, 0)
                        : sx + Math.max(depth - currentZ, 0);
                    const izy = (item.y || 0);
                    d.setActiveLayer(L_COMP);
                    d.rect(izx, yf(izy + ih), Math.max(id, 1), Math.max(ih, 1));
                    if (id > 10 && ih > 10) {
                        const label2 = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                        d.setActiveLayer(L_TXT);
                        d.text(izx + id / 2, yf(izy + ih / 2), 20, 0, label2, 'ARIAL');
                    }
                    currentZ += isMirrored ? -(id + gap) : (id + gap);
                }
            };

            // Draw front cabinet items
            drawItems(collectItems(selectedCabins), frontDepth, false);

            // Draw rear cabinet items (B2B) — mirrored
            if (isB2B) {
                const rearSelected = (cabIdx != null && cabIdx >= 0 && cabIdx < rearCabinets.length)
                    ? [rearCabinets[cabIdx]]
                    : rearCabinets;
                const actualRearDepth = Math.max(...rearSelected.map(c => c.depth || 600));
                drawItems(collectItems(rearSelected), actualRearDepth, true);
            }

            // Depth dimension
            d.setActiveLayer(L_DIM);
            if (isB2B) {
                d.dim(sx, yf(panelH + 190), sx + totalDepth, yf(panelH + 190), totalDepth + 'mm', yf(panelH + 175), 'ARIAL');
            } else {
                d.dim(sx, yf(panelH + 190), sx + totalDepth, yf(panelH + 190), frontDepth + 'mm', yf(panelH + 175), 'ARIAL');
            }

            d.setActiveLayer(L_TXT);
            d.text(sx + totalDepth / 2, yf(panelH + 280), 20, 0, labelPrefix, 'ARIAL');

            return sx + totalDepth;
        };

        if (showSide && frontCabinets.length > 0) {
            const frontW = frontCabinets.reduce((s, c) => s + c.width, 0);
            const rearW = rearCabinets.reduce((s, c) => s + c.width, 0);
            let lastGroupEnd = frontW;
            if (isB2B) lastGroupEnd += 200 + rearW;
            if (isForma2 || isAutomation) {
                lastGroupEnd += 200 + frontW;
                if (isB2B) lastGroupEnd += 200 + rearW;
            }
            const dx = lastGroupEnd + 300;
            drawDxfSideView(frontCabinets, -1, 'VISTA LATERAL (Corte)', dx, isB2B ? rearCabinets : undefined);
        }

        const dxfStr = d.toDxfString();

        // Diagnostic: find non-ASCII characters
        const nonAscii = (dxfStr.match(/[^\x00-\x7F]/g) || []);
        const nonAsciiInfo = nonAscii.length > 0
            ? 'NON-ASCII CHARS: [' + [...new Set(nonAscii)].join(', ') + ']\n'
            : 'NON-ASCII CHARS: none (all ASCII)\n';
        const hasNaN = /NaN/.test(dxfStr) ? 'WARNING: Contains NaN values!\n' : 'No NaN found\n';
        const blkStart = dxfStr.indexOf('0\nSECTION\n2\nBLOCKS');
        const blkEndVal = blkStart >= 0 ? dxfStr.indexOf('0\nENDSEC', blkStart + 10) : -1;
        const blkSection = blkStart >= 0 && blkEndVal >= 0 ? dxfStr.slice(blkStart, blkEndVal + 10) : 'BLOCKS SECTION NOT FOUND';
        const diagnosticHeader =
            '=== DXF DIAGNOSTIC ===\n' +
            'Size: ' + dxfStr.length + ' bytes\n' +
            'Layers: ' + Object.keys(d.layers).join(', ') + '\n' +
            'Blocks: ' + (d.blockOrder || []).join(', ') + '\n' +
            'Entities (main): ' + d.entities.length + '\n' +
            'Starts with SECTION: ' + dxfStr.startsWith('0\nSECTION') + '\n' +
            'Ends with EOF: ' + dxfStr.trimEnd().endsWith('0\nEOF') + '\n' +
            'SECTION count: ' + (dxfStr.match(/0\nSECTION/g) || []).length + '\n' +
            'ENDSEC count: ' + (dxfStr.match(/0\nENDSEC/g) || []).length + '\n' +
            hasNaN +
            nonAsciiInfo +
            'First 500 chars:\n' + dxfStr.slice(0, 500) + '\n\n' +
            'Last 500 chars:\n' + dxfStr.slice(-500) + '\n\n' +
            'BLOCKS section:\n' + blkSection + '\n\n' +
            '=== FULL DXF CONTENT ===\n';

        // Download .dxf
        const blob = new Blob([dxfStr], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (eq.tag || 'layout') + '_layout.dxf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Also download diagnostic .txt
        const blobTxt = new Blob([diagnosticHeader + dxfStr], { type: 'text/plain;charset=utf-8' });
        const urlTxt = URL.createObjectURL(blobTxt);
        const aTxt = document.createElement('a');
        aTxt.href = urlTxt;
        aTxt.download = (eq.tag || 'layout') + '_layout_dxf_debug.txt';
        document.body.appendChild(aTxt);
        setTimeout(() => {
            aTxt.click();
            document.body.removeChild(aTxt);
            URL.revokeObjectURL(urlTxt);
            URL.revokeObjectURL(url);
        }, 500);
        } catch (e) {
            console.error('[DXF Export Error]', e);
            if (typeof app?.toast === 'function') app.toast('Erro ao exportar DXF: ' + (e.message || e), 'error');
        }
    },

    _exportLayoutQET() {
        try {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            if (!eq) { app.toast('Nenhum equipamento ativo.', 'error'); return; }

            const materiais = store.getState().materiais || [];
            const componentes = [];
            const bornes = [];
            let compY = 0;
            let borneY = 0;
            const seen = new Set();

            const cabAssignments = eq.layoutConfig?.cabinetAssignments || {};
            const matIds = new Set();
            const addLoadMatIds = (loadsObj) => {
                if (!loadsObj) return;
                for (const loadTag of Object.keys(loadsObj)) {
                    Object.keys(loadsObj[loadTag]).forEach(id => matIds.add(id));
                }
            };
            for (const cab of Object.values(cabAssignments)) {
                addLoadMatIds(cab.loads);
                if (cab.faces) {
                    for (const face of Object.values(cab.faces)) {
                        addLoadMatIds(face.loads);
                    }
                }
            }

            if (matIds.size === 0) {
                for (const m of materiais) matIds.add(m.id);
            }

            for (const m of materiais) {
                if (!matIds.has(m.id)) continue;
                if (seen.has(m.id)) continue;
                seen.add(m.id);
                const isBorne = (m.categoria || '').toLowerCase().includes('borne');
                if (isBorne) {
                    bornes.push({
                        numero: String(bornes.length + 1),
                        regua_parent: 'X1',
                        posicaoX: 0,
                        posicaoY: borneY
                    });
                    borneY += 8;
                } else {
                    const simboloQet = 'embed://import/gerapro/box_60x80.elmt';
                    const tag = m.descricao || m.codigoInterno || m.id;
                    const altura = parseFloat(m.altura_mm) || 50;
                    componentes.push({
                        id: m.id,
                        tag: tag.length > 30 ? tag.substring(0, 30) : tag,
                        posicaoX: 50,
                        posicaoY: compY,
                        simboloQet,
                        orientacao: 0,
                        terminais: [
                            { x: 0, y: -Math.round(altura / 2 / 10) * 10, name: '1', orientation: 0, number: '1' },
                            { x: 0, y: Math.round(altura / 2 / 10) * 10, name: '2', orientation: 2, number: '2' }
                        ]
                    });
                    compY += 8;
                }
            }

            const ptcFolder = window.app.currentPtc?.folder || data.codigo || '';
            const titleblock = {
                titulo: `Layout - ${eq.tag}`,
                cliente: data.cliente || '',
                numeroProposta: ptcFolder,
                data: new Date().toISOString().split('T')[0],
                autor: 'GeraPro'
            };

            const _tkExpQET = store.getState().auth?.token;
            fetch('/api/export-qet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(_tkExpQET ? { 'Authorization': 'Bearer ' + _tkExpQET } : {}) },
                body: JSON.stringify({ componentes, bornes, titleblock })
            })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${eq.tag || 'layout'}.qet`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                a.remove();
                app.toast('Arquivo QET exportado com sucesso!', 'success');
            })
            .catch(e => {
                console.error(e);
                app.toast('Erro: ' + e.message, 'error');
            });
        } catch (e) {
            console.error(e);
            app.toast('Erro ao exportar QET: ' + e.message, 'error');
        }
    },

    _drawDxfEntity(drawing, entity) {
        switch (entity.type) {
            case 'LINE':
                if (entity.startPoint && entity.endPoint) {
                    drawing.line(entity.startPoint.x, entity.startPoint.y, entity.endPoint.x, entity.endPoint.y);
                }
                break;
            case 'CIRCLE':
                if (entity.center && entity.radius) {
                    drawing.circle(entity.center.x, entity.center.y, entity.radius);
                }
                break;
            case 'ARC':
                if (entity.center && entity.radius && entity.startAngle != null && entity.endAngle != null) {
                    const segs = 32;
                    const pts = [];
                    const sr = entity.startAngle * Math.PI / 180;
                    const er = entity.endAngle * Math.PI / 180;
                    for (let i = 0; i <= segs; i++) {
                        const t = sr + (er - sr) * (i / segs);
                        pts.push([entity.center.x + entity.radius * Math.cos(t), entity.center.y + entity.radius * Math.sin(t)]);
                    }
                    drawing.polyline(pts, false);
                }
                break;
            case 'LWPOLYLINE':
            case 'POLYLINE':
                if (entity.vertices && entity.vertices.length >= 2) {
                    const pts = entity.vertices.map(v => [v.x, v.y]);
                    const isClosed = !!entity.closed;
                    if (isClosed) pts.push(pts[0]);
                    drawing.polyline(pts, isClosed);
                }
                break;
            case 'TEXT':
            case 'MTEXT':
                if (entity.startPoint && entity.text) {
                    drawing.text(entity.startPoint.x, entity.startPoint.y, entity.textHeight || 10, 0, entity.text);
                }
                break;
            case 'POINT':
                if (entity.position) {
                    drawing.point(entity.position.x, entity.position.y);
                }
                break;
            case 'ELLIPSE':
                if (entity.center && entity.majorAxisEndPoint && entity.ratio) {
                    const cx = entity.center.x, cy = entity.center.y;
                    const ex = entity.majorAxisEndPoint.x - cx, ey = entity.majorAxisEndPoint.y - cy;
                    const angle = Math.atan2(ey, ex);
                    const a = Math.sqrt(ex * ex + ey * ey);
                    const b = a * entity.ratio;
                    const pts = [];
                    const segments = 64;
                    for (let i = 0; i < segments; i++) {
                        const t = (i / segments) * Math.PI * 2;
                        const ct = Math.cos(t), st = Math.sin(t);
                        const ca = Math.cos(angle), sa = Math.sin(angle);
                        pts.push([cx + a * ct * ca - b * st * sa, cy + a * ct * sa + b * st * ca]);
                    }
                    drawing.polyline(pts, true);
                }
                break;
            case 'SOLID':
            case 'TRACE':
                if (entity.points && entity.points.length >= 3) {
                    drawing.polyline(entity.points.map(p => [p.x, p.y]), false);
                }
                break;
            case 'SPLINE':
                if (entity.controlPoints && entity.controlPoints.length >= 2) {
                    drawing.polyline(entity.controlPoints.map(p => [p.x, p.y]), false);
                }
                break;
            case 'INSERT':
                console.warn('[DXF] Nested INSERT ignored:', entity.block);
                break;
        }
    },

    handleNaChange(checkbox) {

        const row = checkbox.closest('tr');

        if (!row) return;

        const empresaBox = row.querySelector('input[name="el_scope_empresa"]');

        const cliBox = row.querySelector('input[name="el_scope_cli"]');

        if (checkbox.checked) {

            if (empresaBox) {

                empresaBox.checked = false;

                empresaBox.disabled = true;

                empresaBox.style.opacity = '0.5';

            }

            if (cliBox) {

                cliBox.checked = false;

                cliBox.disabled = true;

                cliBox.style.opacity = '0.5';

            }

        } else {

            if (empresaBox) {

                empresaBox.disabled = false;

                empresaBox.style.opacity = '1';

            }

            if (cliBox) {

                cliBox.disabled = false;

                cliBox.style.opacity = '1';

            }

        }

    },



    loadDefaultEletrocentroScope() {

        if (!confirm("Deseja substituir a matriz atual pelos 17 itens padrão? Todas as marcações e descrições atuais serão restauradas para o padrão.")) return;

        const state = store.getState();

        const activeProposal = state.activeTechnicalProposal;

        if (!activeProposal || !activeProposal.equipments) return;

        

        const eq = activeProposal.equipments[this.activeEquipmentIndex];

        if (eq) {

            eq.eletrocentroScope = JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

            this.renderModal(activeProposal);

            app.toast("Matriz padrão carregada!", "success");

        }

    },



    async exportToWord() {

        if (store.getState().proposalReadOnly) {
            window.app.toast('Exportação bloqueada para propostas Fechadas/Perdidas.', 'warning', 0);
            return;
        }

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        if (!data) {

            app.toast('Nenhuma proposta carregada.', 'error');

            return;

        }



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



        // Bibliotecas

        const DocxLib = window.Docxtemplater || window.docxtemplater;

        const ZipLib = window.PizZip || window.pizzip || (window.Docxtemplater ? window.Docxtemplater.PizZip : null);

        const ImageModule = window.ImageModule;

        

        if (!DocxLib || !ZipLib) {

            app.toast('Erro: Bibliotecas de exportação não carregadas.', 'error');

            return;

        }



        // Helper Base64 to Buffer

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



        app.toast('Gerando documento Word...', 'info');



        try {

            // Localizar o primeiro equipamento do tipo ELETROCENTRO para expor seus dados globalmente

            const eletrocentroEq = (data.equipments || []).find(eq => eq.type === 'ELETROCENTRO');

            if (eletrocentroEq) {

                if (!eletrocentroEq.eletrocentroScope || eletrocentroEq.eletrocentroScope.length === 0) {

                    eletrocentroEq.eletrocentroScope = JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

                }

            }



            // Atualizar documentos do cliente antes de exportar
            await this._fetchClientDocuments(data.ptc_folder || window.app.currentPtc?.folder);

            // Preparar dados do template
            const clientObj = (store.getState().clientes || []).find(c => c.razaoSocial === data.cliente);
            const _isAUTPRO = store.getState().company?.folderName?.startsWith('AUT_');
            const _ptcFolderPT = String(window.app.currentPtc?.folder || '');
            const _ptcMatchPT = _ptcFolderPT.match(/^(\d{8,10})/);
            const _ptcNumberPT = _ptcMatchPT ? _ptcMatchPT[1] : (window.app.currentPtcInfo?.ptcNumber || data.codigo || '00000000');
            const _revPTVal = data.revisions?.length > 0 ? data.revisions[data.revisions.length - 1].no : '00';
            const _revStrPT = _revPTVal && _revPTVal !== '0' ? String(_revPTVal).replace(/[^0-9]/g, '') : '00';

            const formatarDescricao = (desc) => {
                const siglas = ['MT', 'BT', 'SPDA', 'PDA', 'CFTV', 'ART', 'TAC', 'DIO', 'COVID', 'IO', 'IO´S'];
                return desc.split(' ').map(p => {
                    if (p.includes('/')) {
                        return p.split('/').map(part => {
                            if (siglas.includes(part)) return part;
                            return part.charAt(0) + part.slice(1).toLowerCase();
                        }).join('/');
                    }
                    const limpa = p.replace(/[^A-Z0-9]/g, '');
                    if (siglas.includes(limpa)) return p;
                    const limpa2 = p.replace(/[^A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ0-9´]/g, '');
                    if (siglas.includes(limpa2)) return p;
                    const firstLetter = p.search(/[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]/);
                    if (firstLetter > 0) {
                        return p.slice(0, firstLetter) + p[firstLetter] + p.slice(firstLetter + 1).toLowerCase();
                    }
                    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
                }).join(' ');
            };

            const templateData = {

                projeto: data.projeto || '',

                cliente: data.cliente || '',
                razao_social: clientObj?.razaoSocial || '',
                nome_fantasia: clientObj?.nomeFantasia || '',
                cnpj: clientObj?.cnpj || '',
                inscricao_estadual: clientObj?.inscricaoEstadual || '',
                inscricao_municipal: clientObj?.inscricaoMunicipal || '',
                logradouro: clientObj?.logradouro || '',
                numero: clientObj?.numero || '',
                bairro: clientObj?.bairro || '',
                cidade: clientObj?.cidade || '',
                estado: clientObj?.estado || '',
                cep: clientObj?.cep || '',
                segmento: clientObj?.segmento || '',
                cnae: clientObj?.cnae || '',
                observacoes: clientObj?.observacoes || '',
                contato_nome: (clientObj?.contatos?.[0]?.nome) || clientObj?.contatoNome || '',
                contato_cargo: (clientObj?.contatos?.[0]?.cargo) || clientObj?.contatoCargo || '',
                contato_email: (clientObj?.contatos?.[0]?.email) || clientObj?.email || '',
                contato_telefone: (clientObj?.contatos?.[0]?.telefone) || clientObj?.telefone || '',

                cidade_cliente: clientObj?.cidade || '',

                nome_empresa: clientObj?.razaoSocial || clientObj?.nomeFantasia || data.cliente || '',

                cidade_uf: [clientObj?.cidade, clientObj?.estado].filter(Boolean).join('/') || '',

                unidade_nome: (() => {
                    if (!data.unidade_cliente || !clientObj?.id) return '';
                    const raw = (store.getState().unidadesCliente || []).find(u => u.cliente_id === clientObj.id && u.codigo_unidade === data.unidade_cliente);
                    return raw?.nome_unidade || '';
                })(),

                unidade_codigo: (() => {
                    if (!data.unidade_cliente || !clientObj?.id) return '';
                    return data.unidade_cliente;
                })(),

                contato_unidade_nome: (() => {
                    if (!data.unidade_cliente || !clientObj?.id) return '';
                    const raw = (store.getState().unidadesCliente || []).find(u => u.cliente_id === clientObj.id && u.codigo_unidade === data.unidade_cliente);
                    if (!raw) return '';
                    const contatos = typeof raw.contatos === 'string' ? JSON.parse(raw.contatos) : (raw.contatos || []);
                    return contatos[0]?.nome || '';
                })(),

                contato_unidade_email: (() => {
                    if (!data.unidade_cliente || !clientObj?.id) return '';
                    const raw = (store.getState().unidadesCliente || []).find(u => u.cliente_id === clientObj.id && u.codigo_unidade === data.unidade_cliente);
                    if (!raw) return '';
                    const contatos = typeof raw.contatos === 'string' ? JSON.parse(raw.contatos) : (raw.contatos || []);
                    return contatos[0]?.email || '';
                })(),

                contato_unidade_telefone: (() => {
                    if (!data.unidade_cliente || !clientObj?.id) return '';
                    const raw = (store.getState().unidadesCliente || []).find(u => u.cliente_id === clientObj.id && u.codigo_unidade === data.unidade_cliente);
                    if (!raw) return '';
                    const contatos = typeof raw.contatos === 'string' ? JSON.parse(raw.contatos) : (raw.contatos || []);
                    return contatos[0]?.telefone || '';
                })(),

                contato_unidade_celular: (() => {
                    if (!data.unidade_cliente || !clientObj?.id) return '';
                    const raw = (store.getState().unidadesCliente || []).find(u => u.cliente_id === clientObj.id && u.codigo_unidade === data.unidade_cliente);
                    if (!raw) return '';
                    const contatos = typeof raw.contatos === 'string' ? JSON.parse(raw.contatos) : (raw.contatos || []);
                    return contatos[0]?.celular || '';
                })(),

                objeto: data.objeto || '',
                objeto_do_fornecimento: data.objeto || '',
                documentos_cliente: (data.clientDocuments || []).map((d, i) => ({
                    index: i + 1,
                    nome: d.nome || '',
                    extensao: d.extensao || ''
                })),
                cidade: data.cidade || '',
                uf: data.uf || '',

                localizacao: data.localizacao || [data.cidade, data.uf].filter(Boolean).join('/') || '',

                engenheiro_responsavel: data.engenheiroResponsavel || '',

                aos_cuidados: data.aos_cuidados || '',

                email: data.email || '',

                telefone: data.telefone || '',

                celular: data.celular || '',

                data_emissao: new Date().toLocaleDateString('pt-BR'),

                revisao: data.revisions?.length > 0 ? data.revisions[data.revisions.length - 1].no : '00',

                codigo: data.codigo || '',
                ptc_number: _isAUTPRO ? `PT-${_ptcNumberPT || '00000000'}-R${_revStrPT}` : `${_ptcNumberPT || '00000000'}-PT-R${_revStrPT}`,

                revisoes: (data.revisions || []).map(r => ({

                    no: r.no || '',

                    desc: r.desc || '',

                    elab: r.elab || '',

                    verif: r.verif || '',

                    aprov: r.aprov || '',

                    data: r.data || ''

                })),

                

                // Seção Eletrocentro: controla visibilidade do Tópico 4 inteiro no Word

                tem_eletrocentro: !!eletrocentroEq,



                // Matriz Eletrocentro Global â achata grupos em array plano com numeração contínua

                tem_escopo_eletrocentro: !!eletrocentroEq,

                escopo_eletrocentro: eletrocentroEq ? (() => {

                    const groups = migrateEletrocentroScope(eletrocentroEq.eletrocentroScope);

                    const flat = [];

                    groups.forEach(group => {

                        (group.items || []).forEach(item => {

                            flat.push({

                                index: String(flat.length + 1).padStart(2, '0'),

                                desc: item.desc || '',

                                minhaEmpresa: item.na ? 'N/A' : (item.minhaEmpresa ? 'X' : ''),

                                na: item.na ? 'X' : '',

                            });

                        });

                    });

                    return flat;

                })() : [],

                

                // Imagens (Logos)

                logo_img: data.logo_base64 || '',

                client_logo_img: data.client_logo_base64 || '',

                watermark_img: data.watermark_base64 || '',

                

                // Lista de painéis (Loop no Word)

                lista_paineis: (data.equipments || []).map(eq => {

                    const tech = eq.technical || {};

                    const loads = eq.loads || [];

                    

                    // Mapeamento exaustivo para chaves do template

                    const eqData = {

                        tag: eq.tag,

                        tipo: eq.type,

                        ...tech, // Espalha todos os campos técnicos salvos

                        

                        // Fallbacks e aliases comuns (incluindo padrões fd_ de versões anteriores)

                        cor: tech.cor_externa,

                        pintura: tech.cor_externa,

                        fd_color: tech.cor_externa,

                        espessura: tech.camada_pintura,

                        camada_pintura: tech.camada_pintura,

                        entrada: tech.entrada_cabos,

                        fd_cable_entry: tech.entrada_cabos,

                        saida: tech.saida_cabos,

                        fd_cable_exit: tech.saida_cabos,

                        acesso: tech.acesso_manutencao,

                        fd_maint_access: tech.acesso_manutencao,

                        acesso_frontal: tech.acesso_frontal,

                        fd_frontal_access: tech.acesso_frontal,

                        acesso_traseiro: tech.acesso_traseiro,

                        fd_rear_access: tech.acesso_traseiro,

                        protocolo: tech.protocolo,

                        fd_protocol: tech.protocolo,

                        cabo: tech.cabo_comunicacao,

                        fd_comm_cable: tech.cabo_comunicacao,

                        monitoramento_arco: tech.monitoramento_arco_eq || tech.arco_interno,

                        fd_arc_monitor: tech.monitoramento_arco_eq || tech.arco_interno,

                        iluminacao: tech.iluminacao || tech.iluminacao_interna,

                        fd_internal_lighting: tech.iluminacao || tech.iluminacao_interna,

                        tomada: tech.tomada || tech.tomada_servico,

                        fd_service_outlet: tech.tomada || tech.tomada_servico,

                        termostato: tech.termostato || tech.termostato_resistor,

                        fd_thermostat: tech.termostato || tech.termostato_resistor,

                        ventilacao: tech.ventilacao || tech.ventilacao_forcada,

                        fd_ventilation: tech.ventilacao || tech.ventilacao_forcada,

                        

                        // Barramentos

                        bus_main_mat: eq.busbars?.main?.mat || '',

                        bus_main_dim: eq.busbars?.main?.dim || '',

                        bus_main_inc: eq.busbars?.main?.inc || '',

                        bus_main_weight: eq.busbars?.main?.weight || '',

                        bus_branch_mat: eq.busbars?.branch?.mat || '',

                        bus_branch_dim: eq.busbars?.branch?.dim || '',

                        bus_branch_inc: eq.busbars?.branch?.inc || '',

                        bus_branch_weight: eq.busbars?.branch?.weight || '',

                        bus_ground_mat: eq.busbars?.ground?.mat || '',

                        bus_ground_dim: eq.busbars?.ground?.dim || '',

                        bus_ground_weight: eq.busbars?.ground?.weight || '',



                        // Lista de cargas para este painel

                        tem_cargas: loads.length > 0,

                        cargas: loads.map((load, idx) => ({

                            index: idx + 1,

                            ...load,

                            corrente: load.corrente || '0A',

                            disjuntor: load.disjuntor || '-',

                            cabo: load.cabo || '-'

                        })),



                        // Escopo Eletrocentro (Se for Eletrocentro)

                        tem_escopo_eletrocentro: (eq.type === 'ELETROCENTRO'),

                        escopo_eletrocentro: (() => {

                            if (eq.type !== 'ELETROCENTRO') return [];

                            const groups = migrateEletrocentroScope(eq.eletrocentroScope);

                            const flat = [];

                            groups.forEach(group => {

                                (group.items || []).forEach(item => {

                                    flat.push({

                                        index: String(flat.length + 1).padStart(2, '0'),

                                        desc: item.desc || '',

                                        minhaEmpresa: item.na ? 'N/A' : (item.minhaEmpresa ? 'X' : ''),

                                        na: item.na ? 'X' : '',

                                        cliente: item.na ? 'N/A' : (item.cli ? 'X' : '')

                                    });

                                });

                            });

                            return flat;

                        })()

                    };



                    // Adicionar chaves em maiúsculo para compatibilidade

                    Object.keys(eqData).forEach(key => {

                        if (typeof eqData[key] === 'string' || typeof eqData[key] === 'number') {

                            eqData[key.toUpperCase()] = eqData[key];

                        }

                    });



                    return eqData;

                }),

                

                // Itens de Escopo (Loop no Word)

                escopo: (data.scopeItems || []).map(item => ({

                    desc: item.desc || '',

                    minhaEmpresa: item.minhaEmpresa ? 'X' : '',

                    cliente: item.cli ? 'X' : ''

                })),

                // ─── AUTPRO: Escopo (Seções 5, 7, 9) ───

                tem_autpro_escopo: (data.autproScope || []).some(item => item.incluso),

                ...Object.fromEntries((data.autproScope || []).map(item => [
                    item.id + '_incluso',
                    !!item.incluso
                ])),

                premissas_incluso: (data.autproScope || [])
                    .filter(item => PREMISSAS_IDS.includes(item.id))
                    .some(item => item.incluso),

                premissas_itens: (() => {
                    const scope = data.autproScope || [];
                    return scope
                        .filter(item => PREMISSAS_IDS.includes(item.id) && item.incluso)
                        .sort((a, b) => PREMISSAS_IDS.indexOf(a.id) - PREMISSAS_IDS.indexOf(b.id))
                        .map((item, idx) => ({
                            numero: idx + 1,
                            descricao: formatarDescricao(item.desc)
                        }));
                })(),

                documentacao_incluso: (data.autproScope || [])
                    .filter(item => DOCUMENTACAO_IDS.includes(item.id))
                    .some(item => item.incluso),

                secao71_itens: (() => {
                    const subIds = DOCUMENTACAO_SUB_MASTERS.autpro_97 || [];
                    return (data.autproScope || [])
                        .filter(item => subIds.includes(item.id) && item.incluso)
                        .map((item, idx) => ({ numero: idx + 1, descricao: formatarDescricao(item.desc) }));
                })(),

                secao72_itens: (() => {
                    const subIds = DOCUMENTACAO_SUB_MASTERS.autpro_72 || [];
                    return (data.autproScope || [])
                        .filter(item => subIds.includes(item.id) && item.incluso)
                        .map((item, idx) => ({ numero: idx + 1, descricao: formatarDescricao(item.desc) }));
                })(),

                secao73_itens: (() => {
                    const subIds = DOCUMENTACAO_SUB_MASTERS.autpro_73 || [];
                    return (data.autproScope || [])
                        .filter(item => subIds.includes(item.id) && item.incluso)
                        .map((item, idx) => ({ numero: idx + 1, descricao: formatarDescricao(item.desc) }));
                })(),

                fornecimento_incluso: (data.autproScope || [])
                    .filter(item => FORNECIMENTO_IDS.includes(item.id))
                    .some(item => item.incluso),

                fornecimento_numero_secao: (() => {
                    const scope = data.autproScope || [];
                    const s5 = scope.filter(i => PREMISSAS_IDS.includes(i.id)).some(i => i.incluso);
                    const s7 = scope.filter(i => DOCUMENTACAO_IDS.includes(i.id)).some(i => i.incluso);
                    const s9 = scope.filter(i => FORNECIMENTO_IDS.includes(i.id)).some(i => i.incluso);
                    let count = 0;
                    if (s5) count++;
                    if (s7) count++;
                    return s9 ? count + 1 : 0;
                })(),

                fornecimento_grupos: (() => {
                    const scope = data.autproScope || [];
                    return FORNECIMENTO_ORDER
                        .map(id => scope.find(i => i.id === id))
                        .filter(grupo => grupo?.incluso)
                        .map((grupo, gIdx) => {
                            const subIds = FORNECIMENTO_SUB_MASTERS[grupo.id] || [];
                            const itens = subIds
                                .map(subId => scope.find(i => i.id === subId))
                                .filter(sub => sub?.incluso)
                                .map((sub, sIdx) => ({
                                    numero: sIdx + 1,
                                    descricao: formatarDescricao(sub.desc)
                                }));
                            const static_itens = [];
                            subIds.forEach(subId => {
                                const sub = scope.find(i => i.id === subId);
                                if (sub?.incluso && FORNECIMENTO_STATIC_SUB_ITEMS[subId]) {
                                    FORNECIMENTO_STATIC_SUB_ITEMS[subId].forEach(t => static_itens.push(t));
                                }
                            });
                            return {
                                numero: gIdx + 1,
                                titulo: formatarDescricao(grupo.desc),
                                itens,
                                static_itens
                            };
                        });
                })(),

                secao91_itens: (() => {
                    const subIds = FORNECIMENTO_SUB_MASTERS.autpro_99 || [];
                    return (data.autproScope || [])
                        .filter(item => subIds.includes(item.id) && item.incluso)
                        .map((item, idx) => ({ numero: idx + 1, descricao: formatarDescricao(item.desc) }));
                })(),

                secao92_itens: (() => {
                    const subIds = FORNECIMENTO_SUB_MASTERS.autpro_08 || [];
                    return (data.autproScope || [])
                        .filter(item => subIds.includes(item.id) && item.incluso)
                        .map((item, idx) => ({ numero: idx + 1, descricao: formatarDescricao(item.desc) }));
                })(),

                secao93_itens: (() => {
                    const subIds = FORNECIMENTO_SUB_MASTERS.autpro_17 || [];
                    return (data.autproScope || [])
                        .filter(item => subIds.includes(item.id) && item.incluso)
                        .map((item, idx) => ({ numero: idx + 1, descricao: formatarDescricao(item.desc) }));
                })(),

                vendor_list: (data.vendorList || []).map((v, idx) => {
                    const opt = v.opt || '';
                    let opt_display = '';
                    if (opt === '__PADRAO__') {
                        opt_display = v.brand || '';
                    } else if (opt === '__SIMILAR__') {
                        opt_display = 'Similar';
                    } else if (opt === '__OUTRO__') {
                        opt_display = v.optEspecifique ? 'Outro \u2014 ' + v.optEspecifique : 'Outro';
                    } else if (opt) {
                        opt_display = opt;
                    }
                    return { index: idx + 1, comp: v.comp || '', brand: v.brand || '', opt_display };
                }),
                
                // Signatures (ativas)
                sig1_nome: (data.sig1_active !== false) ? (data.sig1_nome || '') : '',
                sig1_cargo: (data.sig1_active !== false) ? (data.sig1_cargo || '') : '',
                sig1_tel: (data.sig1_active !== false) ? (data.sig1_tel || '') : '',
                sig1_cel: (data.sig1_active !== false) ? (data.sig1_cel || '') : '',
                sig1_email: (data.sig1_active !== false) ? (data.sig1_email || '') : '',
                sig2_nome: (data.sig2_active !== false) ? (data.sig2_nome || '') : '',
                sig2_cargo: (data.sig2_active !== false) ? (data.sig2_cargo || '') : '',
                sig2_tel: (data.sig2_active !== false) ? (data.sig2_tel || '') : '',
                sig2_cel: (data.sig2_active !== false) ? (data.sig2_cel || '') : '',
                sig2_email: (data.sig2_active !== false) ? (data.sig2_email || '') : '',
                sig3_nome: (data.sig3_active !== false) ? (data.sig3_nome || '') : '',
                sig3_cargo: (data.sig3_active !== false) ? (data.sig3_cargo || '') : '',
                sig3_tel: (data.sig3_active !== false) ? (data.sig3_tel || '') : '',
                sig3_cel: (data.sig3_active !== false) ? (data.sig3_cel || '') : '',
                sig3_email: (data.sig3_active !== false) ? (data.sig3_email || '') : '',

                // ─── Infraestrutura ───
                infra_tem_itens: (data.infraestrutura?.disciplinas || []).reduce((s, d) => s + d.itens.length, 0) > 0,
                infraestrutura: (() => {
                    const rows = [];
                    (data.infraestrutura?.disciplinas || []).forEach(disc => {
                        const perda = disc.perda ?? 10;
                        (disc.itens || []).forEach(item => {
                            const sub = window.propostaTecnicaModule._infraSubtotal(item, perda);
                            const pf = window.propostaTecnicaModule._infraPrecoFinal(item, perda);
                            rows.push({
                                infra_disciplina: disc.nome,
                                infra_codigo: item.codigo || '',
                                infra_descricao: item.descricao || '',
                                infra_qtd: String(item.qtd || 0),
                                infra_un: item.un || '',
                                infra_custo_unitario: app.formatCurrency(item.custoUnitario || 0),
                                infra_horas_instalacao: String(item.horasInstalacao || 0),
                                infra_dificuldade: item.dificuldade === 1.5 ? 'Elevado' : item.dificuldade === 2.5 ? 'Crítico' : 'Normal',
                                infra_icms: String(item.icms || 0) + '%',
                                infra_ipi: String(item.ipi || 0) + '%',
                                infra_desconto: String(item.desconto || 0) + '%',
                                infra_markup: String(item.markup || 0) + '%',
                                infra_subtotal: app.formatCurrency(sub),
                                infra_preco_final: app.formatCurrency(pf)
                            });
                        });
                    });
                    return rows;
                })(),
                infra_qtd_itens: (data.infraestrutura?.disciplinas || []).reduce((s, d) => s + d.itens.length, 0),
                infra_custo_direto: app.formatCurrency((() => { let t=0; (data.infraestrutura?.disciplinas||[]).forEach(d => { const p=d.perda??10; d.itens.forEach(i => { t += window.propostaTecnicaModule._infraSubtotal(i, p); }); }); return t; })()),
                infra_preco_final_total: app.formatCurrency((() => { let t=0; (data.infraestrutura?.disciplinas||[]).forEach(d => { const p=d.perda??10; d.itens.forEach(i => { t += window.propostaTecnicaModule._infraPrecoFinal(i, p); }); }); return t; })()),

            };

            // AUTPRO: fornecimento grupo/item numbering
            if (data.autproScope) {
                const gruposInclusos = FORNECIMENTO_ORDER.filter(id =>
                    data.autproScope.find(i => i.id === id)?.incluso
                );
                FORNECIMENTO_ORDER.forEach(id => {
                    const num = id.replace('autpro_', '');
                    templateData['fornecimento_grupo_' + num + '_numero'] = gruposInclusos.includes(id)
                        ? gruposInclusos.indexOf(id) + 1 : 0;
                });
                FORNECIMENTO_ORDER.forEach(grupoId => {
                    const subIds = FORNECIMENTO_SUB_MASTERS[grupoId] || [];
                    const itensInclusos = subIds.filter(subId =>
                        data.autproScope.find(i => i.id === subId)?.incluso
                    );
                    subIds.forEach(subId => {
                        const num = subId.replace('autpro_', '');
                        templateData['fornecimento_item_' + num + '_numero'] = itensInclusos.includes(subId)
                            ? itensInclusos.indexOf(subId) + 1 : 0;
                    });
                });
            } else {
                FORNECIMENTO_ORDER.forEach(id => {
                    const num = id.replace('autpro_', '');
                    templateData['fornecimento_grupo_' + num + '_numero'] = 0;
                });
                FORNECIMENTO_ORDER.forEach(grupoId => {
                    const subIds = FORNECIMENTO_SUB_MASTERS[grupoId] || [];
                    subIds.forEach(subId => {
                        const num = subId.replace('autpro_', '');
                        templateData['fornecimento_item_' + num + '_numero'] = 0;
                    });
                });
            }

            // Adicionar campos globais em maiúsculo (Strings e Arrays)

            Object.keys(templateData).forEach(key => {

                const val = templateData[key];

                if (typeof val === 'string' || Array.isArray(val)) {

                    templateData[key.toUpperCase()] = val;

                }

            });



            // Carregar Template (configurável por empresa)

            const company = store.getState().company || {};
            const auth = store.getState().auth || {};
            const empresaId = auth.user?.empresa_id || 'default';
            const templateFile = company.templateTecnica || EMPRESA.templateTecnica || 'TEMPLATE_TEC.docx';

            const folderName = company.folderName || empresaId;
            const response = await fetch('templates/' + folderName + '/' + templateFile + '?v=' + Date.now());

            if (!response.ok) throw new Error('Template ' + templateFile + ' não encontrado.');

            const arrayBuffer = await response.arrayBuffer();



            const zip = new ZipLib(arrayBuffer);

            // Injetar tabela de Infraestrutura no documento
            try {
                const infraRows = templateData.infraestrutura || [];
                if (infraRows.length > 0) {
                    const _xmlEscape = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                    const colW = [1700,1100,2600,600,500,1000,600,900,600,600,600,600,1000,1000];
                    const headers = ['Disciplina','Código','Descrição','Qtd','UN','Custo Unit.','H Inst','Difíc.','ICMS','IPI','Desc','Markup','Subtotal','Preço Final'];
                    const hdrCells = headers.map(h => `<w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="16"/><w:color w:val="FFFFFF"/></w:rPr><w:t>${_xmlEscape(h)}</w:t></w:r></w:p></w:tc>`).join('');
                    const flds = ['infra_disciplina','infra_codigo','infra_descricao','infra_qtd','infra_un','infra_custo_unitario','infra_horas_instalacao','infra_dificuldade','infra_icms','infra_ipi','infra_desconto','infra_markup','infra_subtotal','infra_preco_final'];
                    const dataRows = infraRows.map(r => {
                        const cells = flds.map(f => `<w:tc><w:p><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>${_xmlEscape(r[f]||'')}</w:t></w:r></w:p></w:tc>`).join('');
                        return `<w:tr>${cells}</w:tr>`;
                    }).join('');
                    const totCells = headers.map((h,i) => {
                        if (i === 0) return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>TOTAIS</w:t></w:r></w:p></w:tc>`;
                        if (i === 13) return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${_xmlEscape(templateData.infra_preco_final_total||'')}</w:t></w:r></w:p></w:tc>`;
                        if (i === 12) return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${_xmlEscape(templateData.infra_custo_direto||'')}</w:t></w:r></w:p></w:tc>`;
                        return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t/></w:r></w:p></w:tc>`;
                    }).join('');
                    const grd = colW.map(w => `<w:gridCol w:w="${w}"/>`).join('');
                    const infraOXML = `
<w:p><w:pPr><w:keepNext/><w:keepLines/></w:pPr>
<w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="436511"/></w:rPr><w:t xml:space="preserve">INFRAESTRUTURA</w:t></w:r>
</w:p>
<w:tbl>
<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="436511"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="436511"/></w:tblBorders></w:tblPr>
<w:tblGrid>${grd}</w:tblGrid>
<w:tr><w:trPr><w:trHeight w:val="300"/><w:shd w:val="clear" w:color="auto" w:fill="436511"/></w:trPr>${hdrCells}</w:tr>
${dataRows}
</w:tbl>
`;
                    const docXml = zip.file('word/document.xml').asText();
                    const modifiedXml = docXml.replace('</w:body>', infraOXML + '</w:body>');
                    zip.file('word/document.xml', modifiedXml);
                }
            } catch (e) {
                console.warn('Failed to inject infraestrutura table:', e);
            }

            // Configurar Módulo de Imagem

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

                        if (name.includes('client_logo')) return [264, 105];

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
            const ptcNumber = ptcMatch ? ptcMatch[1] : (window.app.currentPtcInfo?.ptcNumber || data.codigo || '00000000');
            const rev = window.app.currentPtc?.revision;
            const revStr = rev && rev !== '0' ? rev.replace(/[^0-9]/g, '') : '00';
            const fileName = _isAUTPRO ? `PT-${ptcNumber}-R${revStr}.docx` : `${ptcNumber}-PT-R${revStr}.docx`;

            const url = window.URL.createObjectURL(outBlob);

            const a = document.createElement("a");

            a.href = url;

            a.download = fileName;

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);

            document.body.removeChild(a);

            app.toast('Download concluído!', 'success');

            // Salvar no servidor (PTC/Rev)
            const currentPtc = window.app.currentPtc;
            if (currentPtc && currentPtc.folder) {
                const _token_sf = store.getState().auth?.token;
            fetch('/api/save-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(_token_sf ? { 'Authorization': 'Bearer ' + _token_sf } : {}) },
                    body: JSON.stringify({
                        ptcFolder: currentPtc.folder,
                        filename: fileName,
                        content: outBase64,
                        isBase64: true,
                        revisionFolder: currentPtc.revision
                    })
                })
                .then(res => res.json())
                .then(r => {
                    if (r.success) {
                        console.log('[Export] DOCX saved to server:', fileName);
                        app.toast('Documento salvo na pasta da PTC!', 'success');
                    } else {
                        console.error('[Export] Server save failed:', r.error);
                        app.toast('Erro ao salvar no servidor: ' + (r.error || 'desconhecido'), 'error');
                    }
                })
                .catch(err => {
                    console.error('Error saving DOCX to server:', err);
                    app.toast('Erro de conexão ao salvar no servidor.', 'error');
                });
            }

        } catch (e) {

            console.error(e);

            app.toast('Erro na exportação: ' + e.message, 'error');

        }

    }

};
