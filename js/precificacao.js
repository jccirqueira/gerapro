import { store } from './state.js';
import { getIcmsRate, INTERNAL_RATES } from './icmsTabela.js';
import { deriveMaterials } from './automacaoMateriais.js';

/**
 * Módulo de Precificação e Rentabilidade (Refatorado)
 * Permite modelagem financeira individualizada por Equipamento (TAG).
 */

class PrecificacaoModule {
    constructor() {
        this.activeTag = 'SUMMARY';
        this.pricingMap = {};
        this.calculatedResults = {};
        this.lastStateVersion = null;
        this._manualIcmsOverrides = new Set();

        store.subscribe((state) => {
            const container = document.getElementById('view-precificacao');
            if (container && !container.classList.contains('hidden-module')) {
                const equips = state.activeTechnicalProposal?.equipments || [];
                const stateVersion = JSON.stringify(equips.map(e => e.tag));
                
                if (stateVersion !== this.lastStateVersion) {
                    // Proposta ou lista de equipamentos mudou — sempre volta ao Resumo
                    this.lastStateVersion = stateVersion;
                    this.activeTag = 'SUMMARY';
                    this.render();
                }
            }
        });

        window.app = window.app || {};
        window.app.precificacao = this;
        
        setTimeout(() => this.init(), 500);
    }

    init() {
        console.log('[Precificacao] Inicializando módulo...');
        this.render();
    }

    // Called when switching to this module or when state updates
    render() {
        const container = document.getElementById('view-precificacao');
        if (!container) return;

        const state = store.getState();
        const equipments = state.activeTechnicalProposal?.equipments || [];

        if (!container.querySelector('.module-header-sticky')) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
                    <!-- Header -->
                    <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                        <div>
                            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                                <i class="ph ph-calculator"></i> Precificação e Rentabilidade <span style="font-weight: 300; opacity: 0.8;">| ${state.activeTechnicalProposal?.projeto || 'Novo Projeto'}</span>
                            </h2>
                            <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Modelagem Financeira e Análise de Lucratividade</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex: 1; overflow: hidden;">
                        <div class="prec-sidebar" style="width: 260px; background: #f8fafc; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column;">
                            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                                <h3 style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em; margin: 0;">Navegação por Equipamento</h3>
                            </div>
                            <div id="prec-tag-list" style="flex: 1; overflow-y: auto; padding: 10px 0;"></div>
                            <div style="padding: 15px; border-top: 1px solid #e2e8f0; background: white;">
                                 <button class="btn btn-primary" id="btn-save-precificacao" onclick="app.precificacao.saveToServer()" style="width: 100%; justify-content: center; gap: 8px;">
                                    <i class="ph ph-floppy-disk"></i> Salvar Tudo
                                 </button>
                            </div>
                        </div>
                        <div id="prec-content-viewport" style="flex: 1; overflow-y: auto; padding: 0; background: #f1f5f9; position: relative;"></div>
                    </div>
                </div>
            `;
        }

        this.renderSidebar(equipments);
        this.renderActiveView();
    }

    renderSidebar(equipments) {
        const list = document.getElementById('prec-tag-list');
        if (!list) return;

        // Equipamentos normais (não-SEU) — botões de precificação individual
        let html = equipments.filter(eq => eq.type !== 'SEU').map(eq => {
            const isActive = this.activeTag === eq.tag;
            return `
                <div class="tag-nav-item ${isActive ? 'active' : ''}" 
                     onclick="app.precificacao.switchTag('${eq.tag}')"
                     style="padding: 12px 20px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-weight: ${isActive ? '700' : '500'}; color: ${isActive ? 'white' : '#475569'}; border-left: 4px solid ${isActive ? 'var(--color-accent)' : 'transparent'}; background: ${isActive ? 'var(--color-accent)' : 'transparent'}; transition: all 0.2s;">
                    <i class="ph ph-cpu" style="font-size: 20px; opacity: ${isActive ? '1' : '0.5'};"></i>
                    <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px;">${eq.tag}</span>
                    ${isActive ? '<i class="ph ph-caret-right" style="font-size: 12px;"></i>' : ''}
                </div>
            `;
        }).join('');

        // SEUs — botões clicáveis separados
        const seus = equipments.filter(eq => eq.type === 'SEU');
        if (seus.length > 0) {
            html += `<div style="margin: 12px 10px 0 10px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; padding: 0 10px 6px;">Subestações Unitárias</div>
                ${seus.map(s => {
                    const isActive = this.activeTag === s.tag;
                    return `
                        <div onclick="app.precificacao.switchTag('${s.tag}')"
                             style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 10px;
                                    color: ${isActive ? '#92400e' : '#78350f'};
                                    background: ${isActive ? '#fef3c7' : '#fefce8'};
                                    border-left: 4px solid ${isActive ? '#f59e0b' : '#fbbf24'};
                                    margin-bottom: 3px; border-radius: 0 6px 6px 0;
                                    font-weight: ${isActive ? '700' : '500'};
                                    transition: all 0.2s;">
                            <i class="ph ph-lightning-slash" style="font-size: 18px;"></i>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size: 13px; font-weight: 700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.tag}</div>
                                <div style="font-size: 10px; opacity: 0.7;">${(s.seu_components || []).length} componente(s)</div>
                            </div>
                            ${isActive ? '<i class="ph ph-caret-right" style="font-size: 12px;"></i>' : ''}
                        </div>`;
                }).join('')}
            </div>`;
        }

        // Infraestrutura — só aparece se houver ao menos 1 item
        const pt = store.getState().activeTechnicalProposal;
        const totalInfraItens = pt?.infraestrutura?.disciplinas?.reduce((s, d) => s + d.itens.length, 0) || 0;
        if (totalInfraItens > 0) {
            const infraActive = this.activeTag === '__INFRA__';
            html += `
                <div style="margin: 12px 10px 0 10px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                    <div class="tag-nav-item ${infraActive ? 'active' : ''}"
                         onclick="app.precificacao.switchTag('__INFRA__')"
                         style="padding: 12px 20px; cursor: pointer; display: flex; align-items: center; gap: 12px;
                                font-weight: ${infraActive ? '700' : '500'};
                                color: ${infraActive ? 'white' : '#475569'};
                                border-left: 4px solid ${infraActive ? 'var(--color-accent)' : 'transparent'};
                                background: ${infraActive ? 'var(--color-accent)' : 'transparent'};
                                transition: all 0.2s;">
                        <i class="ph ph-wrench" style="font-size: 20px; opacity: ${infraActive ? '1' : '0.5'};"></i>
                        <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px;">Infraestrutura</span>
                        <span style="background:${infraActive ? 'rgba(255,255,255,0.2)' : '#e5e7eb'};padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${totalInfraItens}</span>
                        ${infraActive ? '<i class="ph ph-caret-right" style="font-size: 12px;"></i>' : ''}
                    </div>
                </div>`;
        }

        const summaryActive = this.activeTag === 'SUMMARY';
        html += `
            <div style="margin: 15px 10px 0 10px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <div class="tag-nav-item ${summaryActive ? 'active' : ''}" id="btn-resumo-consolidado"
                     onclick="app.precificacao.switchTag('SUMMARY')"
                     style="padding: 14px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-weight: 700; color: white; border-radius: 8px; background: var(--color-accent); border: 1px solid var(--color-accent); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); transition: all 0.2s;">
                    <i class="ph ph-chart-line-up" style="font-size: 20px;"></i>
                    <span style="flex: 1; font-size: 13px;">Resumo Consolidado</span>
                </div>
            </div>
        `;

        list.innerHTML = html;
    }

    switchTag(tag) {
        if (this.activeTag !== 'SUMMARY' && this.activeTag !== '__INFRA__') {
            this.captureCurrentTagData();
        }
        this.activeTag = tag;
        this.renderSidebar(store.getState().activeTechnicalProposal?.equipments || []);
        this.renderActiveView();
    }

    renderActiveView() {
        const viewport = document.getElementById('prec-content-viewport');
        if (!viewport) return;

        // Guard: se infra está ativo mas não tem itens, volta ao resumo
        if (this.activeTag === '__INFRA__') {
            const infra = store.getState().activeTechnicalProposal?.infraestrutura;
            const total = infra?.disciplinas?.reduce((s, d) => s + d.itens.length, 0) || 0;
            if (total === 0) {
                this.activeTag = 'SUMMARY';
            }
        }

        if (this.activeTag === 'SUMMARY') {
            this.renderSummaryView(viewport);
        } else if (this.activeTag === '__INFRA__') {
            this.renderInfraSummaryView(viewport);
        } else {
            // Verifica se a tag ativa é uma SEU
            const equipments = store.getState().activeTechnicalProposal?.equipments || [];
            const activeEq = equipments.find(e => e.tag === this.activeTag);
            if (activeEq && activeEq.type === 'SEU') {
                this.renderSeuView(viewport, activeEq);
            } else {
                this.renderTagPricingView(viewport);
            }
        }
    }

    renderSeuView(container, seu) {
        const equipments = store.getState().activeTechnicalProposal?.equipments || [];
        const comps = seu.seu_components || [];
        const compEqs = equipments.filter(e => comps.includes(String(e.id)));

        let seuCost = 0, seuSales = 0, seuIpi = 0, seuProfit = 0;

        const rows = compEqs.map(eq => {
            const result = this.calculatedResults[eq.tag] || { finalPriceNoIpi: 0, ipiValue: 0, cost: 0, profit: 0 };
            seuCost   += result.cost || 0;
            seuSales  += result.finalPriceNoIpi || 0;
            seuIpi    += result.ipiValue || 0;
            seuProfit += result.profit || 0;
            const margin = result.finalPriceNoIpi > 0 ? (result.profit / result.finalPriceNoIpi) * 100 : 0;
            return `
                <tr>
                    <td class="font-bold">${eq.tag}</td>
                    <td style="text-align:right;">${app.formatCurrency(result.cost)}</td>
                    <td style="text-align:right;color:var(--color-primary);font-weight:600;">${app.formatCurrency(result.finalPriceNoIpi)}</td>
                    <td style="text-align:right;font-weight:700;color:${result.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${app.formatCurrency(result.profit)}</td>
                    <td style="text-align:right;font-weight:700;color:${margin >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${margin.toFixed(2)}%</td>
                </tr>`;
        }).join('');

        const seuMargin = seuSales > 0 ? (seuProfit / seuSales) * 100 : 0;
        const emptyMsg = compEqs.length === 0
            ? `<tr><td colspan="5" style="text-align:center;padding:30px;color:#94a3b8;">
                   <i class="ph ph-info" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                   Nenhum componente selecionado para esta SEU.<br>
                   <small>Edite a Ficha Técnica da SEU para selecionar os equipamentos.</small>
               </td></tr>` : rows;

        container.innerHTML = `
            <div class="card" style="padding:24px;border:none;box-shadow:none;">

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                    <h2 class="text-xl font-bold" style="color:var(--color-primary);display:flex;align-items:center;gap:10px;margin:0;">
                        <i class="ph ph-lightning-slash" style="color:#f59e0b;"></i>
                        Resumo da Subestação
                        <span style="color:#f59e0b;">${seu.tag}</span>
                    </h2>
                    <span style="background:#fef3c7;color:#92400e;padding:6px 16px;border-radius:20px;font-weight:700;font-size:12px;">
                        ${comps.length} componente(s)
                    </span>
                </div>

                <!-- Cards resumo da SEU -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
                    <div style="background:#fefce8;padding:16px;border-radius:8px;border:1px solid #fde68a;">
                        <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:#92400e;">Custo Total SEU</div>
                        <div style="font-size:20px;font-weight:700;color:#92400e;margin-top:4px;">${app.formatCurrency(seuCost)}</div>
                    </div>
                    <div style="background:#eff6ff;padding:16px;border-radius:8px;border:1px solid #bae6fd;">
                        <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:#0369a1;">Venda Total (IPI Isento)</div>
                        <div style="font-size:20px;font-weight:700;color:#0369a1;margin-top:4px;">${app.formatCurrency(seuSales + seuIpi)}</div>
                    </div>
                    <div style="background:#f0fdf4;padding:16px;border-radius:8px;border:1px solid #bbf7d0;">
                        <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:#16a34a;">Lucro / Margem</div>
                        <div style="font-size:20px;font-weight:700;color:#16a34a;margin-top:4px;">${app.formatCurrency(seuProfit)} <span style="font-size:13px;">(${seuMargin.toFixed(1)}%)</span></div>
                    </div>
                </div>

                <!-- Tabela de componentes -->
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Equipamento (TAG)</th>
                                <th style="text-align:right;">Custo</th>
                                <th style="text-align:right;">Venda (IPI Isento)</th>
                                <th style="text-align:right;">Lucro</th>
                                <th style="text-align:right;">Margem</th>
                            </tr>
                        </thead>
                        <tbody>${emptyMsg}</tbody>
                        <tfoot>
                            <tr style="background:#fef3c7;font-weight:700;border-top:2px solid #f59e0b;">
                                <td style="color:#92400e;"><i class="ph ph-lightning-slash" style="margin-right:4px;"></i>${seu.tag} — TOTAL</td>
                                <td style="text-align:right;color:#92400e;">${app.formatCurrency(seuCost)}</td>
                                <td style="text-align:right;color:#92400e;">${app.formatCurrency(seuSales)}</td>
                                <td style="text-align:right;color:${seuProfit >= 0 ? '#16a34a' : '#dc2626'};">${app.formatCurrency(seuProfit)}</td>
                                <td style="text-align:right;">${seuMargin.toFixed(2)}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    }

    renderTagPricingView(container) {
        const state = store.getState();
        const eq = state.activeTechnicalProposal?.equipments.find(e => e.tag === this.activeTag);
        
        if (!eq) {
            container.innerHTML = `<h3>Equipamento não encontrado: ${this.activeTag}</h3>`;
            return;
        }

        // Verifica se este equipamento é componente de alguma SEU
        const equipments = state.activeTechnicalProposal?.equipments || [];
        const activeEq = equipments.find(e => e.tag === this.activeTag);
        const isSeuComponent = activeEq && equipments
            .filter(e => e.type === 'SEU')
            .some(seu => (seu.seu_components || []).includes(String(activeEq.id)));

        // Se for componente de SEU, força IPI zerado e isento antes de qualquer coisa
        if (isSeuComponent) {
            if (!this.pricingMap[this.activeTag]) this.pricingMap[this.activeTag] = this.getDefaultPricingData();
            this.pricingMap[this.activeTag].ipiIsento = true;
            this.pricingMap[this.activeTag].ipi = 0;
        }

        // Se o equipamento for Cubículo de Média Tensão (MT), força IPI zerado e isento
        const isCubMt = eq.type === 'CUB-MT';
        if (isCubMt) {
            if (!this.pricingMap[this.activeTag]) this.pricingMap[this.activeTag] = this.getDefaultPricingData();
            this.pricingMap[this.activeTag].ipiIsento = true;
            this.pricingMap[this.activeTag].ipi = 0;
        }

        // Se não houver dados salvos para esta TAG, inicializa com os padrões
        if (!this.pricingMap[this.activeTag]) {
            this.pricingMap[this.activeTag] = this.getDefaultPricingData();
        }

        // Auto-fill ICMS com base na tabela CONFAZ (UF origem x UF destino)
        this._autoFillIcmsFromConfaz(this.activeTag);

        const data = this.pricingMap[this.activeTag];
        const regime = state.company?.regimeTributario || 'Lucro Real';

        // Calcular custos automáticos baseados na Proposta Técnica
        const matCost = this.calculateEquipmentMaterialCost(eq);
        const laborCost = this.calculateEquipmentLaborCost(eq);
        const expenseCost = this.calculateEquipmentExpenseCost(eq);

        const isAutPro = state.company?.folderName?.startsWith('AUT_');
        container.innerHTML = this.getPricingFormHTML(this.activeTag, data, { matCost, laborCost, expenseCost }, regime, isSeuComponent, isCubMt, isAutPro);
        
        // Pre-fill credit fields from all material sources if not manually overridden
        if (regime !== 'Simples Nacional' && !data.icmsCredito && !data.pisCofinsCredito && !data.ipiCredito) {
            const credits = this.calculateEquipmentCredits(eq);
            if (credits.credIcms > 0) { data.icmsCredito = credits.credIcms; this.setVal('prec_icms_credito', app.formatCurrencyRaw(credits.credIcms)); }
            if (credits.credIpi > 0) { data.ipiCredito = credits.credIpi; this.setVal('prec_ipi_credito', app.formatCurrencyRaw(credits.credIpi)); }
            if (credits.credPisCof > 0) { data.pisCofinsCredito = credits.credPisCof; this.setVal('prec_pis_cofins_credito', app.formatCurrencyRaw(credits.credPisCof)); }
        }

        // Bind event listeners to new elements
        this.bindPricingEvents(data);
        this.calculate(); // Initial calc for this view

        // Show CONFAZ indicator if ICMS was auto-filled and not overridden
        this._updateConfazIndicator();
    }

    _updateConfazIndicator() {
        const indicator = document.getElementById('prec-icms-confaz-indicator');
        if (!indicator) return;
        if (this._manualIcmsOverrides.has(this.activeTag)) {
            indicator.style.display = 'none';
            return;
        }
        const state = store.getState();
        const eq = state.activeTechnicalProposal?.equipments.find(e => e.tag === this.activeTag);
        if (!eq) { indicator.style.display = 'none'; return; }
        const ufOrigem = eq.ufOrigem || state.company?.uf || '';
        const ufDestino = this._extractUfDestino();
        if (ufOrigem && ufDestino && getIcmsRate(ufOrigem, ufDestino) !== null) {
            indicator.title = `ICMS auto-calculado: ${ufOrigem} → ${ufDestino} = ${getIcmsRate(ufOrigem, ufDestino)}%`;
            indicator.style.display = 'inline';
        } else {
            indicator.style.display = 'none';
        }
    }

    calculateEquipmentMaterialCost(eq) {
        const state = store.getState();
        const tipicos = state.tipicos || [];
        const materiais = state.materiais || [];
        const overrides = state.activeTechnicalProposal?.materialOverrides || {};
        let total = 0;

        const getCusto = (item) => {
            const ov = item.materialId ? overrides[item.materialId]?.custo : undefined;
            if (ov != null) return ov;
            const mat = item.materialId ? materiais.find(m => m.id === item.materialId) : null;
            if (mat?.custo != null) return mat.custo;
            return item.custo ?? 0;
        };

        (eq.loads || []).forEach(load => {
            const typical = tipicos.find(t => t.id === load.typicalId);
            if (typical && typical.items) {
                typical.items.forEach(item => {
                    total += (item.qtd || 0) * getCusto(item);
                });
            }
        });
        (eq.materials || []).forEach(item => {
            total += (item.qtd || 0) * getCusto(item);
        });
        const autoMat = eq.automationMaterials || (() => {
            if (eq.ioList && eq.ioList.racks && eq.ioList.racks.some(r => (r.slots || []).length > 0)) {
                const bom = deriveMaterials(eq.ioList);
                return (bom.items || []).map(item => ({
                    materialId: item.materialId || '',
                    descricao: item.descricao,
                    custo: item.custoUnitario || 0,
                    qtd: item.qtd || 0,
                    icms: item.icms || 0,
                    ipi: item.ipi || 0,
                    pis: item.pis || 0,
                    cofins: item.cofins || 0
                }));
            }
            return [];
        })();
        autoMat.forEach(item => {
            total += (item.qtd || 0) * getCusto(item);
        });
        return total;
    }

    calculateEquipmentCredits(eq) {
        const state = store.getState();
        const tipicos = state.tipicos || [];
        const materiais = state.materiais || [];
        const overrides = state.activeTechnicalProposal?.materialOverrides || {};
        let totalIcms = 0, totalIpi = 0, totalPisCof = 0;

        const calcCred = (item, field, dft) => {
            const ov = item.materialId ? overrides[item.materialId]?.custo : undefined;
            let custo;
            if (ov != null) {
                custo = ov;
            } else {
                const mat = item.materialId ? materiais.find(m => m.id === item.materialId) : null;
                custo = mat?.custo != null ? mat.custo : (item.custo ?? 0);
            }
            let taxa;
            if (item.materialId) {
                const mat = materiais.find(m => m.id === item.materialId);
                taxa = mat?.[field] != null ? Number(mat[field]) : (item[field] != null ? Number(item[field]) : dft);
            } else {
                taxa = item[field] != null ? Number(item[field]) : dft;
            }
            return (item.qtd || 0) * custo * taxa / 100;
        };

        (eq.loads || []).forEach(load => {
            const typical = tipicos.find(t => t.id === load.typicalId);
            if (typical && typical.items) {
                typical.items.forEach(item => {
                    totalIcms += calcCred(item, 'icms', 18);
                    totalIpi += calcCred(item, 'ipi', 0);
                    totalPisCof += calcCred(item, 'pis', 1.65) + calcCred(item, 'cofins', 7.60);
                });
            }
        });

        (eq.materials || []).forEach(item => {
            totalIcms += calcCred(item, 'icms', 18);
            totalIpi += calcCred(item, 'ipi', 0);
            totalPisCof += calcCred(item, 'pis', 1.65) + calcCred(item, 'cofins', 7.60);
        });

        (eq.automationMaterials || []).forEach(item => {
            totalIcms += calcCred(item, 'icms', 18);
            totalIpi += calcCred(item, 'ipi', 0);
            totalPisCof += calcCred(item, 'pis', 1.65) + calcCred(item, 'cofins', 7.60);
        });

        return { credIcms: totalIcms, credIpi: totalIpi, credPisCof: totalPisCof };
    }

    calculateEquipmentLaborCost(eq) {
        let total = 0;
        if (eq.labor && eq.labor.items) {
            eq.labor.items.forEach(r => {
                const horas = r.hours || r.quantidade || 0;
                const taxa = r.hourlyRate || r.valorHora || 0;
                total += horas * taxa;
            });
        }
        return total;
    }

    calculateEquipmentExpenseCost(eq) {
        let total = 0;
        if (eq.expenses) {
            if (Array.isArray(eq.expenses)) {
                eq.expenses.forEach(ex => total += (ex.unit || 0) * (ex.qtd || 0));
            } else if (eq.expenses.items) {
                eq.expenses.items.forEach(ex => total += (ex.subtotal || 0));
            }
        }
        return total;
    }

    calculateInfraestruturaCost() {
        const pt = store.getState().activeTechnicalProposal;
        if (!pt?.infraestrutura) return { cost: 0, finalPrice: 0 };
        let cost = 0, finalPrice = 0;
        pt.infraestrutura.disciplinas.forEach(disc => {
            const perda = disc.perda ?? 10;
            (disc.itens || []).forEach(item => {
                const sub = (item.qtd||0) * (1 + perda/100) * (item.custoUnitario||0) + (item.horasInstalacao||0) * (item.valorHora||0) * (item.dificuldade||1.0);
                cost += sub;
                const totalPercent = (item.desconto||0) + (item.markup||0);
                const fator = 1 - totalPercent / 100;
                const pf = fator > 0 ? sub / fator : sub;
                finalPrice += pf;
            });
        });
        return { cost, finalPrice };
    }

    getPricingFormHTML(tag, data, costs, regime, isSeuComponent = false, isCubMt = false, isAutPro = false) {
        return `
            <div class="card" style="padding: 24px; border: none; box-shadow: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="text-xl font-bold" style="color: var(--color-primary); display: flex; align-items: center; gap: 10px;">
                        <i class="ph ph-calculator"></i> Precificação: <span style="color: var(--color-accent);">${tag}</span>
                        <span id="prec-regime-badge" class="status-badge ${regime === 'Simples Nacional' ? 'status-green' : 'status-blue'}" style="font-size: 10px; margin-left: 10px; text-transform: uppercase;">Regime: ${regime}</span>
                        <select id="prec-business-type-select" class="status-badge" style="font-size: 10px; margin-left: 6px; text-transform: uppercase; border: 1px solid transparent; cursor: pointer; outline: none;">
                            <option value="Industrialização" ${data.businessType === 'Industrialização' ? 'selected' : ''}>Negócio: Industrialização</option>
                            <option value="Revenda" ${data.businessType === 'Revenda' ? 'selected' : ''}>Negócio: Revenda</option>
                            <option value="Prestação de Serviços" ${data.businessType === 'Prestação de Serviços' ? 'selected' : ''}>Negócio: Prestação de Serviços</option>
                        </select>
                        <select id="prec-faturamento-select" class="status-badge" style="font-size: 10px; margin-left: 6px; text-transform: uppercase; border: 1px solid transparent; cursor: pointer; outline: none;">
                            <option value="Próprio" ${data.faturamento === 'Próprio' ? 'selected' : ''}>Faturamento: Próprio</option>
                            <option value="Direto" ${data.faturamento === 'Direto' ? 'selected' : ''}>Faturamento: Direto</option>
                        </select>
                    </h2>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                    <!-- Coluna 1: Entradas -->
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        <!-- Custos Diretos -->
                        <div style="border: 1px solid var(--color-border); border-radius: 8px; padding: 16px;">
                            <h3 class="text-sm font-bold" style="margin-bottom: 12px; color: var(--color-muted); text-transform: uppercase;">1. Custos Diretos</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                                <div class="form-group">
                                    <label class="form-label">Total Materiais (PT) R$
                                        <span id="btn-override-materiais" style="cursor:pointer;color:#0369a1;margin-left:6px;font-size:14px;" title="Editar custo dos materiais">✏️</span>
                                    </label>
                                    <div style="display:flex;align-items:center;gap:4px;">
                                        <input type="text" id="prec_material" class="form-control" value="${app.formatCurrency(costs.matCost)}" readonly style="background: var(--color-bg-alt); font-weight: bold; flex:1;">
                                    </div>
                                </div>
                                <div class="form-group" id="group-consumiveis" style="display: ${data.businessType === 'Prestação de Serviços' ? 'none' : 'block'};">
                                    <label class="form-label">Total Consumíveis (%) <small>(sobre material)</small></label>
                                    <input type="number" id="prec_consumiveis" class="form-control" value="${data.consumiveis || 0}" step="0.01">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                                <div class="form-group">
                                    <label class="form-label">Mão de Obra (MOD + ENG) R$</label>
                                    <input type="text" id="prec_labor_total" class="form-control" value="${app.formatCurrency(costs.laborCost)}" readonly style="text-align: right; background: var(--color-bg-alt); font-weight: bold;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Despesas Logística R$</label>
                                    <input type="text" id="prec_despesas" class="form-control" value="${app.formatCurrency(costs.expenseCost)}" readonly style="text-align: right; background: var(--color-bg-alt); font-weight: bold;">
                                </div>
                            </div>
                            <!-- Campos de Crédito Tributário -->
                            <div id="wrapper-creditos" style="display: ${regime === 'Simples Nacional' ? 'none' : 'block'}">
                                <h4 class="text-xs font-bold" style="color: #0369a1; text-transform: uppercase; margin-bottom: 8px;">Créditos sobre Entradas</h4>
                                <div id="container-creditos" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; background: #f0f9ff; padding: 10px; border-radius: 6px; border: 1px solid #bae6fd;">
                                    <div class="form-group" id="group-credito-icms">
                                        <label class="form-label" style="color: #0369a1;">Créd. ICMS R$</label>
                                        <input type="text" id="prec_icms_credito" class="form-control" value="${app.formatCurrencyRaw(data.icmsCredito || 0)}" style="text-align: right;">
                                    </div>
                                    <div class="form-group" id="group-credito-pis-cofins">
                                        <label class="form-label" style="color: #0369a1;">Créd. PIS/COF R$</label>
                                        <input type="text" id="prec_pis_cofins_credito" class="form-control" value="${app.formatCurrencyRaw(data.pisCofinsCredito || 0)}" style="text-align: right;">
                                    </div>
                                    <div class="form-group" id="group-credito-ipi">
                                        <label class="form-label" style="color: #0369a1;">Créd. IPI R$</label>
                                        <input type="text" id="prec_ipi_credito" class="form-control" value="${app.formatCurrencyRaw(data.ipiCredito || 0)}" style="text-align: right;">
                                    </div>
                                </div>
                            </div>

                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--color-border); display: flex; justify-content: space-between;">
                                <span class="font-bold">Custo Direto Total (${tag}):</span>
                                <span class="font-bold text-main" id="prec_custo_total_display">R$ 0,00</span>
                            </div>
                        </div>

                        <!-- Impostos -->
                        <div style="border: 1px solid var(--color-border); border-radius: 8px; padding: 16px;">
                            <h3 class="text-sm font-bold" style="margin-bottom: 12px; color: var(--color-muted); text-transform: uppercase;">2. Impostos (Deduções)</h3>
                            
                            <div id="container-simples" style="display: ${regime === 'Simples Nacional' ? 'block' : 'none'}; margin-bottom: 16px;">
                                <div class="form-group">
                                    <label class="form-label">Alíquota Unificada DAS (%)</label>
                                    <input type="number" id="prec_das" class="form-control" value="${data.das || 0}" step="0.01">
                                </div>
                            </div>

                            <div id="container-impostos-detalhados" style="display: ${regime === 'Simples Nacional' ? 'none' : 'grid'}; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                                <div class="form-group" id="group-icms">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label class="form-label">ICMS (%)</label>
                                        <span id="prec-icms-confaz-indicator" style="font-size: 10px; color: #0369a1; display: none;"><i class="ph ph-check-circle"></i> CONFAZ</span>
                                    </div>
                                    <input type="number" id="prec_icms" class="form-control" value="${data.icms || 0}" step="0.01" onchange="app.precificacao.markManualIcms('${tag}')">
                                </div>
                                <div class="form-group" id="group-pis-cofins">
                                    <label class="form-label">PIS/COFINS (%)</label>
                                    <input type="number" id="prec_pis_cofins" class="form-control" value="${data.pisCofins || 9.25}" step="0.01">
                                </div>
                                <div class="form-group" id="group-iss" style="display: ${data.businessType === 'Prestação de Serviços' ? 'block' : 'none'};">
                                    <label class="form-label">ISS (%)</label>
                                    <input type="number" id="prec_iss" class="form-control" value="${data.iss || 0}" step="0.01">
                                </div>
                                <div class="form-group" id="group-ipi" style="display: ${data.businessType === 'Industrialização' ? 'block' : 'none'};">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label class="form-label">IPI (%)</label>
                                        <label class="text-xs" style="display: flex; align-items: center; gap: 4px; cursor: pointer; color: ${(isSeuComponent || isCubMt) ? '#92400e' : 'var(--color-primary)'}">
                                            <input type="checkbox" id="prec_ipi_isento" ${(data.ipiIsento || isSeuComponent || isCubMt) ? 'checked' : ''} ${(isSeuComponent || isCubMt) ? 'disabled' : ''}> Isento
                                        </label>
                                    </div>
                                    <input type="number" id="prec_ipi" class="form-control" value="${(isSeuComponent || isCubMt) ? 0 : (data.ipi || 9.75)}" step="0.01" ${(isSeuComponent || isCubMt) ? 'disabled style="background:#f1f5f9;color:#94a3b8;"' : ''}>
                                    ${isSeuComponent ? `<div style="font-size:10px;color:#92400e;margin-top:4px;"><i class="ph ph-lock-simple"></i> IPI zerado — Componente de SEU (NCM 8537.20.90)</div>` : ''}
                                    ${isCubMt ? `<div style="font-size:10px;color:#92400e;margin-top:4px;"><i class="ph ph-lock-simple"></i> IPI zerado — Cubículo de Média Tensão (NCM 8537.20.90)</div>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Margens e Desconto -->
                        <div style="border: 1px solid var(--color-border); border-radius: 8px; padding: 16px;">
                            <h3 class="text-sm font-bold" style="margin-bottom: 12px; color: var(--color-muted); text-transform: uppercase;">3. Margem e Negociação</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                                <div class="form-group">
                                    <label class="form-label">Custos Fixos / Admin (%)</label>
                                    <input type="number" id="prec_custos_fixos" class="form-control" value="${data.custosFixos || 8}" step="0.01">
                                </div>
                                ${isAutPro ? `
                                <div class="form-group">
                                    <div style="display:flex;align-items:center;gap:8px;background:#f0fdf4;padding:8px 12px;border-radius:6px;border:1px solid #bbf7d0;">
                                        <i class="ph ph-check-circle" style="color:#16a34a;font-size:16px;flex-shrink:0;"></i>
                                        <div>
                                            <div style="font-size:11px;color:#475569;font-weight:600;">Comissão Fixa AutPro</div>
                                            <div style="font-weight:700;color:#16a34a;">0,5% s/ Valor Bruto</div>
                                            <div style="font-size:10px;color:#ca8a04;">Limitada a R$ 30.000,00 por proposta</div>
                                        </div>
                                    </div>
                                    <input type="hidden" id="prec_comissao" value="0.5">
                                </div>
                                ` : `
                                <div class="form-group">
                                    <label class="form-label">Comissão Vendas (%)</label>
                                    <input type="number" id="prec_comissao" class="form-control" value="${data.comissao || 5}" step="0.01">
                                </div>
                                `}
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding-top: 12px; border-top: 1px dashed var(--color-border);">
                                <div class="form-group">
                                    <label class="form-label">Margem Lucro Ideal (%)</label>
                                    <input type="number" id="prec_margem_ideal" class="form-control" value="${data.margemIdeal || 20}" step="0.01">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Desconto Negociado (%)</label>
                                    <input type="number" id="prec_desconto" class="form-control" value="${data.desconto || 0}" step="0.01">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna 2: Resultados (Dashboard) -->
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div style="background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px; position: sticky; top: 0;">
                            <h3 class="text-md font-bold" style="margin-bottom: 16px; border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">Resumo Financeiro: ${tag}</h3>

                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span class="text-muted">Preço Final (Sem IPI):</span>
                                <span class="font-bold" style="color: #0369a1; font-size: 18px;" id="res_preco_final_s_ipi">R$ 0,00</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span class="text-muted">Valor do IPI:</span>
                                <span class="font-bold" id="res_valor_ipi">R$ 0,00</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: #0369a1; color: #fff; padding: 12px; border-radius: 6px;">
                                <span class="font-bold">Total (Com IPI):</span>
                                <span class="font-bold" style="font-size: 20px;" id="res_preco_final_c_ipi">R$ 0,00</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-top: 8px; border-top: 1px dashed var(--color-border);">
                                <span class="text-muted">(−) Impostos:</span>
                                <span class="font-bold" id="res_impostos">R$ 0,00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span class="text-muted">(−) Custos Fixos / Admin:</span>
                                <span class="font-bold" id="res_custos_fixos">R$ 0,00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span class="text-muted">(−) Comissão (s/ ${isAutPro ? 'Bruto' : 'líquido'}):</span>
                                <span class="font-bold" id="res_comissao">R$ 0,00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--color-border); align-items: center;">
                                <span class="font-bold">LUCRO LÍQUIDO:</span>
                                <div style="text-align: right;">
                                    <div class="font-bold text-success" style="font-size: 18px;" id="res_lucro_reais">R$ 0,00</div>
                                    <div class="text-sm font-bold text-success" id="res_margem_real">0,00% Margem</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _calcSummaryData() {
        const state = store.getState();
        const equipments = state.activeTechnicalProposal?.equipments || [];
        const seus = equipments.filter(eq => eq.type === 'SEU');
        const useSeuMode = seus.length > 0;

        let totalCost = 0, totalSalesNoIpi = 0, totalIpi = 0, totalProfit = 0;
        let totalDiretoSales = 0, totalProprioSales = 0;
        let tableRows = '';

        if (useSeuMode) {
            tableRows = seus.map(seu => {
                const comps = seu.seu_components || [];
                const compTags = equipments.filter(e => comps.includes(String(e.id))).map(e => e.tag);
                let seuCost = 0, seuSales = 0, seuIpi = 0, seuProfit = 0;
                compTags.forEach(tag => {
                    const r = this.calculatedResults[tag] || {};
                    seuCost   += r.cost || 0;
                    seuSales  += r.finalPriceNoIpi || 0;
                    seuIpi    += r.ipiValue || 0;
                    seuProfit += r.profit || 0;
                });
                totalCost        += seuCost;
                totalSalesNoIpi  += seuSales;
                totalIpi         += seuIpi;
                totalProfit      += seuProfit;
                const seuMargin = seuSales > 0 ? (seuProfit / seuSales) * 100 : 0;
                return { tag: seu.tag, desc: `${comps.length} componente(s): ${comps.join(', ') || '—'}`, cost: seuCost, sales: seuSales, ipi: seuIpi, profit: seuProfit, margin: seuMargin };
            });
        } else {
            const normalRows = [];
            for (const eq of equipments) {
                const result = this.calculatedResults[eq.tag] || { finalPriceNoIpi: 0, ipiValue: 0, cost: 0, profit: 0, direto: false };
                totalCost += result.cost || 0;
                totalSalesNoIpi += result.finalPriceNoIpi || 0;
                if (result.direto) {
                    totalDiretoSales += result.finalPriceNoIpi || 0;
                    normalRows.push({ tag: eq.tag, desc: 'FATURAMENTO DIRETO', cost: result.cost || 0, sales: result.finalPriceNoIpi || 0, ipi: 0, profit: 0, margin: 0, direto: true });
                } else {
                    totalProprioSales += result.finalPriceNoIpi || 0;
                    totalIpi    += result.ipiValue || 0;
                    totalProfit += result.profit || 0;
                    const margin = result.finalPriceNoIpi > 0 ? (result.profit / result.finalPriceNoIpi) * 100 : 0;
                    normalRows.push({ tag: eq.tag, desc: '', cost: result.cost, sales: result.finalPriceNoIpi || 0, ipi: result.ipiValue || 0, profit: result.profit || 0, margin });
                }
            }
            tableRows = normalRows;
        }

        const infraResult = this.calculatedResults['__INFRA__'];
        if (infraResult && (infraResult.cost || infraResult.finalPriceNoIpi)) {
            totalCost += infraResult.cost || 0;
            totalSalesNoIpi += infraResult.finalPriceNoIpi || 0;
            totalProfit += infraResult.profit || 0;
            tableRows.push({ tag: 'Infraestrutura', desc: '', cost: infraResult.cost || 0, sales: infraResult.finalPriceNoIpi || 0, ipi: infraResult.ipiValue || 0, profit: infraResult.profit || 0, margin: null, infra: true });
        }

        const totalMargin = totalSalesNoIpi > 0 ? (totalProfit / totalSalesNoIpi) * 100 : 0;
        const hasDireto = !useSeuMode && equipments.some(eq => {
            const r = this.calculatedResults[eq.tag] || {};
            return r.direto === true;
        });

        // AutPro: aplicar cap de R$ 30k na comissão
        const isAutPro = state.company?.folderName?.startsWith('AUT_');
        let autproComissaoBruta = 0, autproComissaoEfetiva = 0, autproEconomiaCap = 0;
        if (isAutPro) {
            // Soma comissão de todos os itens (exceto faturamento direto)
            for (const r of Object.values(this.calculatedResults)) {
                if (!r.direto && r.comissao !== undefined) {
                    autproComissaoBruta += r.comissao;
                }
            }
            autproComissaoEfetiva = Math.min(autproComissaoBruta, 30000);
            autproEconomiaCap = Math.max(0, autproComissaoBruta - 30000);
            // Ajusta o lucro total: adiciona a economia do cap de volta
            totalProfit += autproEconomiaCap;
        }

        return { equipments, seus, useSeuMode, totalCost, totalSalesNoIpi, totalIpi, totalProfit, totalDiretoSales, totalProprioSales, tableRows, totalMargin, hasDireto, infraResult, projectName: state.activeTechnicalProposal?.nomeProjeto || '', isAutPro, autproComissaoBruta, autproComissaoEfetiva, autproEconomiaCap };
    }

    renderSummaryView(container) {
        const state = store.getState();
        const equipments = state.activeTechnicalProposal?.equipments || [];
        
        if (equipments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #94a3b8;">
                    <i class="ph ph-warning-circle" style="font-size: 48px; opacity: 0.2;"></i>
                    <p style="margin-top: 10px;">Adicione equipamentos na Proposta Técnica para visualizar o resumo.</p>
                </div>
            `;
            return;
        }

        const d = this._calcSummaryData();
        const { useSeuMode, hasDireto, totalCost, totalSalesNoIpi, totalIpi, totalProfit, totalDiretoSales, totalProprioSales, totalMargin, isAutPro, autproComissaoBruta, autproComissaoEfetiva, autproEconomiaCap } = d;

        container.innerHTML = `
            <div class="card" style="padding: 24px; border: none; box-shadow: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="text-xl font-bold" style="color: var(--color-primary); display: flex; align-items: center; gap: 10px; margin: 0;">
                        <i class="ph ph-chart-pie"></i> Resumo Consolidado da Proposta
                    </h2>
                    <button type="button" onclick="app.precificacao.printResumoConsolidado()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-printer"></i> Imprimir
                    </button>
                </div>

                ${useSeuMode ? `
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <span class="text-xs text-muted text-uppercase font-bold">Custo Total Global</span>
                        <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">${app.formatCurrency(totalCost)}</div>
                    </div>
                    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bae6fd;">
                        <span class="text-xs text-muted text-uppercase font-bold">Venda Total (IPI ISENTO)</span>
                        <div style="font-size: 20px; font-weight: 700; color: #0369a1; margin-top: 4px;">${app.formatCurrency(totalSalesNoIpi)}</div>
                    </div>
                    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
                        <span class="text-xs text-muted text-uppercase font-bold">Lucro Líquido Global</span>
                        <div style="font-size: 20px; font-weight: 700; color: var(--color-accent); margin-top: 4px;">${app.formatCurrency(totalProfit)}</div>
                    </div>
                    <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border: 1px solid #fed7aa;">
                        <span class="text-xs text-muted text-uppercase font-bold">Margem Média Real</span>
                        <div style="font-size: 20px; font-weight: 700; color: #ea580c; margin-top: 4px;">${totalMargin.toFixed(2)}%</div>
                    </div>
                </div>
                ` : hasDireto ? `
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 30px;">
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <span class="text-xs text-muted text-uppercase font-bold">Custo Total</span>
                        <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">${app.formatCurrency(totalCost)}</div>
                    </div>
                    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0;">
                        <span class="text-xs text-muted text-uppercase font-bold">Venda (Próprio)</span>
                        <div style="font-size: 18px; font-weight: 700; color: var(--color-accent); margin-top: 4px;">${app.formatCurrency(totalProprioSales)}</div>
                    </div>
                    <div style="background: #fff7ed; padding: 16px; border-radius: 8px; border: 1px solid #fed7aa;">
                        <span class="text-xs text-muted text-uppercase font-bold">Venda (Direto)</span>
                        <div style="font-size: 18px; font-weight: 700; color: rgb(234, 88, 12); margin-top: 4px;">${app.formatCurrency(totalDiretoSales)}</div>
                    </div>
                    <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border: 1px solid #bae6fd;">
                        <span class="text-xs text-muted text-uppercase font-bold">Valor Total do Pacote</span>
                        <div style="font-size: 20px; font-weight: 700; color: #0369a1; margin-top: 4px;">${app.formatCurrency(totalSalesNoIpi)}</div>
                    </div>
                    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0;">
                        <span class="text-xs text-muted text-uppercase font-bold">Lucro Líquido</span>
                        <div style="font-size: 18px; font-weight: 700; color: var(--color-accent); margin-top: 4px;">${app.formatCurrency(totalProfit)}</div>
                    </div>
                    <div style="background: #fff7ed; padding: 16px; border-radius: 8px; border: 1px solid #fed7aa;">
                        <span class="text-xs text-muted text-uppercase font-bold">Margem Média</span>
                        <div style="font-size: 18px; font-weight: 700; color: #ea580c; margin-top: 4px;">${totalMargin.toFixed(2)}%</div>
                    </div>
                </div>
                ` : `
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <span class="text-xs text-muted text-uppercase font-bold">Custo Total Global</span>
                        <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">${app.formatCurrency(totalCost)}</div>
                    </div>
                    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bae6fd;">
                        <span class="text-xs text-muted text-uppercase font-bold">Venda Total (S/ IPI)</span>
                        <div style="font-size: 20px; font-weight: 700; color: #0369a1; margin-top: 4px;">${app.formatCurrency(totalSalesNoIpi)}</div>
                    </div>
                    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
                        <span class="text-xs text-muted text-uppercase font-bold">Lucro Líquido Global</span>
                        <div style="font-size: 20px; font-weight: 700; color: var(--color-accent); margin-top: 4px;">${app.formatCurrency(totalProfit)}</div>
                    </div>
                    <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border: 1px solid #fed7aa;">
                        <span class="text-xs text-muted text-uppercase font-bold">Margem Média Real</span>
                        <div style="font-size: 20px; font-weight: 700; color: #ea580c; margin-top: 4px;">${totalMargin.toFixed(2)}%</div>
                    </div>
                </div>
                `}

                ${isAutPro ? `
                <div style="display: flex; gap: 16px; margin-bottom: 20px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; align-items: center;">
                    <i class="ph ph-percent" style="font-size: 24px; color: #16a34a;"></i>
                    <div style="flex: 1;">
                        <span class="text-xs text-muted text-uppercase font-bold">Comissão AutPro (0,5% s/ Valor Bruto)</span>
                        <div style="display: flex; gap: 24px; margin-top: 4px; flex-wrap: wrap;">
                            <span style="font-size: 13px; color: #475569;">Bruta: <strong>${app.formatCurrency(autproComissaoBruta)}</strong></span>
                            <span style="font-size: 13px; color: #475569;">Cap: <strong>R$ 30.000,00</strong></span>
                            <span style="font-size: 13px; font-weight: 700; color: #16a34a;">Efetiva: ${app.formatCurrency(autproComissaoEfetiva)}</span>
                            ${autproEconomiaCap > 0 ? `<span style="font-size: 13px; color: #ca8a04;">Economia (adicionada ao lucro): <strong>${app.formatCurrency(autproEconomiaCap)}</strong></span>` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Equipamento (TAG)</th>
                                <th style="text-align: right;">Custo</th>
                                <th style="text-align: right;">${useSeuMode ? 'Venda (IPI Isento)' : 'Venda (S/ IPI)'}</th>
                                ${useSeuMode ? '' : '<th style="text-align: right;">IPI</th>'}
                                ${useSeuMode ? '' : '<th style="text-align: right;">Venda (C/ IPI)</th>'}
                                <th style="text-align: right;">Lucro</th>
                                <th style="text-align: right;">Margem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${d.tableRows}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f1f5f9; font-weight: 700;">
                                <td>TOTAIS</td>
                                <td style="text-align: right;">${app.formatCurrency(totalCost)}</td>
                                <td style="text-align: right;">${app.formatCurrency(totalSalesNoIpi)}</td>
                                ${useSeuMode ? '' : `<td style="text-align: right;">${app.formatCurrency(totalIpi)}</td>`}
                                ${useSeuMode ? '' : `<td style="text-align: right; color: #0369a1; font-size: 16px;">${app.formatCurrency(totalSalesNoIpi + totalIpi)}</td>`}
                                <td style="text-align: right; color: ${totalProfit >= 0 ? '#16a34a' : '#dc2626'}">${app.formatCurrency(totalProfit)}</td>
                                <td style="text-align: right;">${totalMargin.toFixed(2)}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    }

    printResumoConsolidado() {
        const d = this._calcSummaryData();
        const { equipments, useSeuMode, hasDireto, totalCost, totalSalesNoIpi, totalIpi, totalProfit, totalDiretoSales, totalProprioSales, totalMargin, tableRows, isAutPro, autproComissaoBruta, autproComissaoEfetiva, autproEconomiaCap } = d;

        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Resumo Consolidado da Proposta</title>
<style>
    @page { margin: 20mm 15mm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin:0; padding:20px; }
    :root { --color-primary: #0369a1; --color-success: #16a34a; --color-danger: #dc2626; }
    h2 { color: #1e3a5f; font-size: 18px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 6px 8px; border: 1px solid #ccc; text-align: left; }
    th { background: #1e3a5f; color: #fff; font-size: 11px; text-transform: uppercase; }
    td { font-size: 11px; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .totals-row { background: #e9ecef; font-weight: bold; }
    .font-bold { font-weight: bold; }
    .text-muted { color: #666; }
    .text-xs { font-size: 10px; }
    .text-uppercase { text-transform: uppercase; }
    .kpi-grid { display: flex; gap: 12px; margin-bottom: 20px; }
    .kpi-box { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .kpi-label { font-size: 9px; text-transform: uppercase; color: #666; }
    .kpi-value { font-size: 16px; font-weight: bold; margin-top: 2px; }
    .profit-positive { color: #16a34a; }
    .profit-negative { color: #dc2626; }
</style>
</head>
<body>
    <h2>Resumo Consolidado da Proposta</h2>
    ${useSeuMode ? `
    <div class="kpi-grid">
        <div class="kpi-box"><div class="kpi-label">Custo Total Global</div><div class="kpi-value">${app.formatCurrency(totalCost)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Venda Total (IPI Isento)</div><div class="kpi-value">${app.formatCurrency(totalSalesNoIpi)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Lucro Líquido Global</div><div class="kpi-value">${app.formatCurrency(totalProfit)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Margem Média Real</div><div class="kpi-value">${totalMargin.toFixed(2)}%</div></div>
    </div>
    ` : hasDireto ? `
    <div class="kpi-grid">
        <div class="kpi-box"><div class="kpi-label">Custo Total</div><div class="kpi-value">${app.formatCurrency(totalCost)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Venda (Próprio)</div><div class="kpi-value">${app.formatCurrency(totalProprioSales)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Venda (Direto)</div><div class="kpi-value">${app.formatCurrency(totalDiretoSales)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Valor Total do Pacote</div><div class="kpi-value">${app.formatCurrency(totalSalesNoIpi)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Lucro Líquido</div><div class="kpi-value">${app.formatCurrency(totalProfit)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Margem Média</div><div class="kpi-value">${totalMargin.toFixed(2)}%</div></div>
    </div>
    ` : `
    <div class="kpi-grid">
        <div class="kpi-box"><div class="kpi-label">Custo Total Global</div><div class="kpi-value">${app.formatCurrency(totalCost)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Venda Total (S/ IPI)</div><div class="kpi-value">${app.formatCurrency(totalSalesNoIpi)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Lucro Líquido Global</div><div class="kpi-value">${app.formatCurrency(totalProfit)}</div></div>
        <div class="kpi-box"><div class="kpi-label">Margem Média Real</div><div class="kpi-value">${totalMargin.toFixed(2)}%</div></div>
    </div>
    `}
    ${isAutPro ? `
    <div style="margin-bottom:16px;padding:8px 12px;border:1px solid #bbf7d0;border-radius:4px;background:#f0fdf4;font-size:11px;">
        <strong>Comiss&atilde;o AutPro (0,5% s/ Valor Bruto):</strong>
        Bruta: ${app.formatCurrency(autproComissaoBruta)} |
        Cap: R$ 30.000,00 |
        <strong>Efetiva: ${app.formatCurrency(autproComissaoEfetiva)}</strong>
        ${autproEconomiaCap > 0 ? `| Economia (no lucro): ${app.formatCurrency(autproEconomiaCap)}` : ''}
    </div>
    ` : ''}
    <table>
        <thead>
            <tr>
                <th>Equipamento (TAG)</th>
                <th class="text-right">Custo</th>
                <th class="text-right">${useSeuMode ? 'Venda (IPI Isento)' : 'Venda (S/ IPI)'}</th>
                ${useSeuMode ? '' : '<th class="text-right">IPI</th>'}
                ${useSeuMode ? '' : '<th class="text-right">Venda (C/ IPI)</th>'}
                <th class="text-right">Lucro</th>
                <th class="text-right">Margem</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
        <tfoot>
            <tr class="totals-row">
                <td>TOTAIS</td>
                <td class="text-right">${app.formatCurrency(totalCost)}</td>
                <td class="text-right">${app.formatCurrency(totalSalesNoIpi)}</td>
                ${useSeuMode ? '' : `<td class="text-right">${app.formatCurrency(totalIpi)}</td>`}
                ${useSeuMode ? '' : `<td class="text-right">${app.formatCurrency(totalSalesNoIpi + totalIpi)}</td>`}
                <td class="text-right ${totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${app.formatCurrency(totalProfit)}</td>
                <td class="text-right">${totalMargin.toFixed(2)}%</td>
            </tr>
        </tfoot>
    </table>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    renderInfraSummaryView(container) {
        const pt = store.getState().activeTechnicalProposal;
        if (!pt?.infraestrutura) {
            container.innerHTML = '<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;">Infraestrutura n\u00e3o configurada.</div>';
            return;
        }
        const infra = pt.infraestrutura;

        const discData = infra.disciplinas.map(disc => {
            const perda = disc.perda ?? 10;
            let custoMaterial = 0, custoMO = 0, precoFinal = 0;
            (disc.itens || []).forEach(item => {
                custoMaterial += (item.qtd||0) * (1 + perda/100) * (item.custoUnitario||0);
                custoMO += (item.horasInstalacao||0) * (item.valorHora||0) * (item.dificuldade||1.0);
                precoFinal += app.propostaTecnica._infraPrecoFinal(item, perda);
            });
            return {
                id: disc.id, nome: disc.nome, icone: disc.icone,
                qtdItens: disc.itens.length, custoMaterial, custoMO,
                subtotal: custoMaterial + custoMO, precoFinal
            };
        });

        const totalItens = discData.reduce((s, d) => s + d.qtdItens, 0);
        const totalGeral = discData.reduce((s, d) => s + d.subtotal, 0);
        const totalPrecoFinal = discData.reduce((s, d) => s + d.precoFinal, 0);
        const totalMaterial = discData.reduce((s, d) => s + d.custoMaterial, 0);
        const totalMO = discData.reduce((s, d) => s + d.custoMO, 0);

        const cardsHtml = discData.filter(dd => dd.qtdItens > 0).map(dd => `
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <i class="ph ${dd.icone}" style="font-size:20px;color:var(--color-accent);"></i>
                    <h4 style="margin:0;font-size:13px;font-weight:600;color:#1e293b;">${dd.nome}</h4>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                    <div style="color:#64748b;">Itens:</div>
                    <div style="text-align:right;font-weight:600;color:#1e293b;">${dd.qtdItens}</div>
                    <div style="color:#64748b;">Custo Material:</div>
                    <div style="text-align:right;font-weight:600;color:#1e293b;">${app.formatCurrency(dd.custoMaterial)}</div>
                    <div style="color:#64748b;">M\u00e3o de Obra:</div>
                    <div style="text-align:right;font-weight:600;color:#1e293b;">${app.formatCurrency(dd.custoMO)}</div>
                    <div style="border-top:1px solid #e2e8f0;padding-top:6px;color:#1e293b;font-weight:700;">Custo Direto:</div>
                    <div style="border-top:1px solid #e2e8f0;padding-top:6px;text-align:right;font-weight:700;color:#1e293b;font-size:13px;">${app.formatCurrency(dd.subtotal)}</div>
                    <div style="color:#4d7c0f;font-weight:700;">Pre\u00e7o Final:</div>
                    <div style="text-align:right;font-weight:700;color:#4d7c0f;font-size:13px;">${app.formatCurrency(dd.precoFinal)}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div style="padding:24px;height:100%;display:flex;flex-direction:column;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-shrink:0;">
                    <h3 style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">
                        <i class="ph ph-wrench" style="margin-right:6px;"></i>
                        Resumo da Infraestrutura
                    </h3>
                    <div style="display:flex;gap:8px;">
                        <button type="button" onclick="app.propostaTecnica.exportInfraCSV()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                            <i class="ph ph-file-csv"></i> CSV
                        </button>
                        <button type="button" onclick="app.propostaTecnica.exportInfraXLSX()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                            <i class="ph ph-file-xls"></i> XLSX
                        </button>
                        <button type="button" onclick="app.propostaTecnica.printInfraResumo()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                            <i class="ph ph-printer"></i> Imprimir
                        </button>
                    </div>
                </div>
                <div style="overflow-y:auto;flex:1;">
                    ${totalItens > 0 ? `
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-bottom:16px;">
                        ${cardsHtml}
                    </div>
                    <div style="background:white;border:2px solid var(--color-accent);border-radius:8px;padding:16px;display:flex;align-items:center;justify-content:space-between;">
                        <div style="font-size:12px;color:#64748b;">
                            Itens: <strong>${totalItens}</strong>
                            <span style="margin:0 10px;color:#d1d5db;">|</span>
                            Custo Material: <strong>${app.formatCurrency(totalMaterial)}</strong>
                            <span style="margin:0 10px;color:#d1d5db;">|</span>
                            M\u00e3o de Obra: <strong>${app.formatCurrency(totalMO)}</strong>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px;color:#475569;">Custo Direto Total: <strong>${app.formatCurrency(totalGeral)}</strong></div>
                            <div style="font-size:18px;font-weight:700;color:var(--color-accent);">Pre\u00e7o Final Total: ${app.formatCurrency(totalPrecoFinal)}</div>
                        </div>
                    </div>
                    ` : '<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;"><i class="ph ph-package" style="font-size:32px;display:block;margin-bottom:8px;"></i>Nenhum item cadastrado na Infraestrutura.</div>'}
                </div>
            </div>
        `;
    }

    bindPricingEvents(data) {
        const inputs = [
            'prec_icms', 'prec_pis_cofins', 'prec_iss', 'prec_ipi',
            'prec_margem_ideal', 'prec_desconto', 'prec_consumiveis', 'prec_custos_fixos', 
            'prec_comissao', 'prec_icms_credito', 'prec_pis_cofins_credito', 'prec_das',
            'prec_ipi_credito'
        ];

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Formatting for currency fields
                if (['prec_icms_credito', 'prec_pis_cofins_credito', 'prec_ipi_credito'].includes(id)) {
                    el.addEventListener('blur', (e) => {
                        const val = app.parseCurrency(e.target.value);
                        e.target.value = app.formatCurrencyRaw(val);
                    });
                    el.addEventListener('focus', (e) => {
                        e.target.value = e.target.value.replace(/\./g, '');
                    });
                }
                el.addEventListener('input', () => this.calculate());
            }
        });

        const checkIsento = document.getElementById('prec_ipi_isento');
        if (checkIsento) checkIsento.addEventListener('change', () => this.calculate());

        const businessSelect = document.getElementById('prec-business-type-select');
        if (businessSelect) {
            businessSelect.addEventListener('change', (e) => {
                const newVal = e.target.value;
                this.pricingMap[this.activeTag].businessType = newVal;
                this.applyBusinessRules(newVal);
                this.calculate();
            });
            this.updateBusinessSelectStyle(data.businessType);
        }

        const fatSelect = document.getElementById('prec-faturamento-select');
        if (fatSelect) {
            fatSelect.addEventListener('change', (e) => {
                this.pricingMap[this.activeTag].faturamento = e.target.value;
                this.calculate();
            });
            this.updateFatSelectStyle(data.faturamento);
        }

        // Override materiais
        const btnOverride = document.getElementById('btn-override-materiais');
        if (btnOverride) {
            btnOverride.addEventListener('click', () => this.openMaterialOverrideModal());
        }
    }

    openMaterialOverrideModal() {
        const state = store.getState();
        const eq = state.activeTechnicalProposal?.equipments.find(e => e.tag === this.activeTag);
        if (!eq) return;

        const materiais = state.materiais || [];
        const overrides = state.activeTechnicalProposal?.materialOverrides || {};
        const tipicos = state.tipicos || [];

        const items = [];

        (eq.loads || []).forEach(load => {
            const typical = tipicos.find(t => t.id === load.typicalId);
            if (typical && typical.items) {
                typical.items.forEach(item => {
                    const mat = materiais.find(m => m.id === item.materialId);
                    items.push({
                        materialId: item.materialId,
                        descricao: mat?.descricao || item.descricao || '(material sem descrição)',
                        qtd: item.qtd || 0,
                        custoOriginal: mat?.custo ?? item.custo ?? 0,
                        override: overrides[item.materialId]?.custo
                    });
                });
            }
        });

        (eq.materials || []).forEach(item => {
            const mat = materiais.find(m => m.id === item.materialId);
            items.push({
                materialId: item.materialId,
                descricao: mat?.descricao || item.descricao || '(material)',
                qtd: item.qtd || 0,
                custoOriginal: mat?.custo ?? item.custo ?? 0,
                override: item.materialId ? overrides[item.materialId]?.custo : undefined
            });
        });

        (eq.automationMaterials || []).forEach(item => {
            const mat = item.materialId ? materiais.find(m => m.id === item.materialId) : null;
            items.push({
                materialId: item.materialId,
                descricao: mat?.descricao || item.descricao || '(automação)',
                qtd: item.qtd || 0,
                custoOriginal: mat?.custo ?? item.custo ?? 0,
                override: item.materialId ? overrides[item.materialId]?.custo : undefined
            });
        });

        if (items.length === 0) {
            app.toast('Aviso', 'Nenhum material encontrado para este equipamento.', 'info');
            return;
        }

        const modalId = 'modal-override-materiais';
        document.getElementById(modalId)?.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

        const rows = items.map((item, i) => {
            const ov = item.override != null ? app.formatCurrencyRaw(item.override) : '';
            return `
                <tr>
                    <td style="padding:6px 8px;font-size:13px;">${item.descricao}</td>
                    <td style="padding:6px 8px;text-align:center;">${item.qtd}</td>
                    <td style="padding:6px 8px;text-align:right;">${app.formatCurrency(item.custoOriginal)}</td>
                    <td style="padding:6px 8px;">
                        <input type="text" id="override-val-${i}" class="form-control" value="${ov}" data-material-id="${item.materialId}" style="width:120px;text-align:right;" placeholder="${app.formatCurrencyRaw(item.custoOriginal)}">
                    </td>
                    <td style="padding:6px 8px;text-align:right;font-size:13px;" id="override-total-${i}">${app.formatCurrency((item.override ?? item.custoOriginal) * item.qtd)}</td>
                </tr>`;
        }).join('');

        modal.innerHTML = `
            <div style="background:#fff;border-radius:8px;width:800px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 4px 24px rgba(0,0,0,0.2);">
                <div style="padding:16px 20px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:16px;">Override de Custos — Materiais</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;">&times;</button>
                </div>
                <div style="padding:12px 20px;font-size:13px;color:#64748b;">
                    <i>Preencha o custo negociado para esta proposta. Deixe em branco para usar o custo do cadastro.</i>
                </div>
                <div style="overflow-y:auto;flex:1;padding:0 20px 12px;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:2px solid var(--color-border);">
                                <th style="text-align:left;padding:8px;font-size:13px;">Descrição</th>
                                <th style="text-align:center;padding:8px;font-size:13px;">Qtd</th>
                                <th style="text-align:right;padding:8px;font-size:13px;">Custo Cadastro</th>
                                <th style="text-align:left;padding:8px;font-size:13px;">Override R$</th>
                                <th style="text-align:right;padding:8px;font-size:13px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--color-border);display:flex;justify-content:flex-end;gap:8px;">
                    <button class="btn" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button id="btn-save-override" class="btn btn-primary">Salvar e Recalcular</button>
                </div>
            </div>`;

        document.body.appendChild(modal);

        // Format currency inputs
        modal.querySelectorAll('[id^="override-val-"]').forEach(input => {
            input.addEventListener('blur', (e) => {
                const val = app.parseCurrency(e.target.value);
                e.target.value = val > 0 ? app.formatCurrencyRaw(val) : '';
                const idx = parseInt(e.target.id.replace('override-val-', ''));
                const item = items[idx];
                const overrideVal = val > 0 ? val : null;
                const totalEl = document.getElementById(`override-total-${idx}`);
                if (totalEl) {
                    totalEl.textContent = app.formatCurrency((overrideVal ?? item.custoOriginal) * item.qtd);
                }
            });
            input.addEventListener('focus', (e) => {
                e.target.value = e.target.value.replace(/\./g, '');
            });
        });

        document.getElementById('btn-save-override').addEventListener('click', () => {
            const newOverrides = { ...overrides };
            modal.querySelectorAll('[id^="override-val-"]').forEach(input => {
                const mid = input.dataset.materialId;
                if (!mid) return;
                const val = app.parseCurrency(input.value);
                if (val > 0) {
                    newOverrides[mid] = { ...(newOverrides[mid] || {}), custo: val };
                } else {
                    if (newOverrides[mid]) {
                        delete newOverrides[mid].custo;
                        if (Object.keys(newOverrides[mid]).length === 0) delete newOverrides[mid];
                    }
                }
            });

            const proposal = { ...store.getState().activeTechnicalProposal, materialOverrides: newOverrides };
            store.setState({ activeTechnicalProposal: proposal });
            modal.remove();

            // Recalcular custo material e créditos com overrides e atualizar os inputs
            const eq2 = store.getState().activeTechnicalProposal?.equipments.find(e => e.tag === this.activeTag);
            if (eq2) {
                const newMatCost = this.calculateEquipmentMaterialCost(eq2);
                const matInput = document.getElementById('prec_material');
                if (matInput) matInput.value = app.formatCurrency(newMatCost);

                const regime = store.getState().company?.regimeTributario || 'Lucro Real';
                if (regime !== 'Simples Nacional') {
                    const credits = this.calculateEquipmentCredits(eq2);
                    if (credits.credIcms > 0) { this.setVal('prec_icms_credito', app.formatCurrencyRaw(credits.credIcms)); }
                    if (credits.credIpi > 0) { this.setVal('prec_ipi_credito', app.formatCurrencyRaw(credits.credIpi)); }
                    if (credits.credPisCof > 0) { this.setVal('prec_pis_cofins_credito', app.formatCurrencyRaw(credits.credPisCof)); }
                }
            }

            this.calculate();
            app.toast('Sucesso', 'Overrides salvos.', 'success');
        });
    }

    updateFatSelectStyle(faturamento) {
        const el = document.getElementById('prec-faturamento-select');
        if (!el) return;
        if (faturamento === 'Direto') {
            el.style.background = '#fef3c7';
            el.style.color = '#92400e';
            el.style.borderColor = '#fde68a';
        } else {
            el.style.background = '#f0fdf4';
            el.style.color = '#166534';
            el.style.borderColor = '#bbf7d0';
        }
    }

    applyBusinessRules(businessType) {
        console.log(`[Precificacao] Aplicando regras automáticas para: ${businessType}`);

        if (businessType === 'Prestação de Serviços') {
            this.setVal('prec_icms', 0);
            this.setVal('prec_ipi', 0);
            this.setVal('prec_iss', 5);
            this.setVal('prec_pis_cofins', 4.65);
            this.setVal('prec_consumiveis', 0);
            
            this.toggleDisplay('group-icms', false);
            this.toggleDisplay('group-ipi', false);
            this.toggleDisplay('group-iss', true);
            this.toggleDisplay('group-consumiveis', false);

            // Serviços não costumam ter créditos tributários sobre materiais
            this.setVal('prec_icms_credito', '0,00');
            this.setVal('prec_pis_cofins_credito', '0,00');
            this.setVal('prec_ipi_credito', '0,00');
            this.toggleDisplay('wrapper-creditos', false);
        } else if (businessType === 'Revenda') {
            this.setVal('prec_icms', 18);
            this.setVal('prec_ipi', 0);
            this.setVal('prec_iss', 0);
            this.setVal('prec_pis_cofins', 9.25);
            
            this.toggleDisplay('group-icms', true);
            this.toggleDisplay('group-ipi', false);
            this.toggleDisplay('group-iss', false);
            this.toggleDisplay('group-consumiveis', true);

            // Revenda tem ICMS e PIS/COFINS, mas IPI entra no custo (sem crédito na entrada)
            this.toggleDisplay('wrapper-creditos', true);
            this.toggleDisplay('group-credito-icms', true);
            this.toggleDisplay('group-credito-pis-cofins', true);
            this.toggleDisplay('group-credito-ipi', false);
            this.setVal('prec_ipi_credito', '0,00');
        } else {
            // Industrialização (Padrão)
            this.setVal('prec_icms', 12);
            this.setVal('prec_ipi', 9.75);
            this.setVal('prec_iss', 0);
            this.setVal('prec_pis_cofins', 9.25);
            
            this.toggleDisplay('group-icms', true);
            this.toggleDisplay('group-ipi', true);
            this.toggleDisplay('group-iss', false);
            this.toggleDisplay('group-consumiveis', true);

            // Industrialização tem todos os créditos
            this.toggleDisplay('wrapper-creditos', true);
            this.toggleDisplay('group-credito-icms', true);
            this.toggleDisplay('group-credito-pis-cofins', true);
            this.toggleDisplay('group-credito-ipi', true);
        }
        
        this.updateBusinessSelectStyle(businessType);
    }

    toggleDisplay(id, show) {
        const el = document.getElementById(id);
        if (el) el.style.display = show ? 'block' : 'none';
    }

    setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    updateBusinessSelectStyle(businessType) {
        const businessSelect = document.getElementById('prec-business-type-select');
        if (!businessSelect) return;

        const colors = { 
            'Industrialização': { bg: '#eff6ff', text: '#1e40af' },
            'Revenda': { bg: '#fff7ed', text: '#9a3412' },
            'Prestação de Serviços': { bg: '#f0fdf4', text: '#166534' }
        };
        const style = colors[businessType] || colors['Industrialização'];
        
        businessSelect.style.backgroundColor = style.bg;
        businessSelect.style.color = style.text;
        
        businessSelect.classList.remove('status-blue', 'status-orange', 'status-green');
        const classMap = { 'Industrialização': 'status-blue', 'Revenda': 'status-orange', 'Prestação de Serviços': 'status-green' };
        businessSelect.classList.add(classMap[businessType] || 'status-blue');
    }

    _extractUfDestino() {
        const data = store.getState().activeTechnicalProposal;
        if (data?.uf && INTERNAL_RATES[data.uf]) return data.uf;
        if (!data?.localizacao) return null;
        const sep = data.localizacao.includes('/') ? '/' : '-';
        const parts = data.localizacao.split(sep);
        if (parts.length < 2) return null;
        const uf = parts[parts.length - 1].trim().toUpperCase();
        if (INTERNAL_RATES[uf]) return uf;
        return null;
    }

    _autoFillIcmsFromConfaz(tag) {
        if (this._manualIcmsOverrides.has(tag)) return;
        const state = store.getState();
        const eq = state.activeTechnicalProposal?.equipments.find(e => e.tag === tag);
        if (!eq) return;
        const ufOrigem = eq.ufOrigem || state.company?.uf || '';
        const ufDestino = this._extractUfDestino();
        if (!ufOrigem || !ufDestino) return;
        const rate = getIcmsRate(ufOrigem, ufDestino);
        if (rate === null) return;
        if (!this.pricingMap[tag]) {
            this.pricingMap[tag] = this.getDefaultPricingData();
        }
        this.pricingMap[tag].icms = rate;
    }

    markManualIcms(tag) {
        this._manualIcmsOverrides.add(tag);
        const indicator = document.getElementById('prec-icms-confaz-indicator');
        if (indicator) indicator.style.display = 'none';
    }

    captureCurrentTagData() {
        if (this.activeTag === 'SUMMARY') return;

        const getVal = (id, isCurrency = false) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            return isCurrency ? app.parseCurrency(el.value) : parseFloat(el.value) || 0;
        };

        this.pricingMap[this.activeTag] = {
            businessType: document.getElementById('prec-business-type-select')?.value || 'Industrialização',
            faturamento: document.getElementById('prec-faturamento-select')?.value || 'Próprio',
            consumiveis: getVal('prec_consumiveis'),
            icms: getVal('prec_icms'),
            pisCofins: getVal('prec_pis_cofins'),
            iss: getVal('prec_iss'),
            ipi: getVal('prec_ipi'),
            ipiIsento: document.getElementById('prec_ipi_isento')?.checked || false,
            custosFixos: getVal('prec_custos_fixos'),
            comissao: getVal('prec_comissao'),
            margemIdeal: getVal('prec_margem_ideal'),
            desconto: getVal('prec_desconto'),
            icmsCredito: getVal('prec_icms_credito', true),
            pisCofinsCredito: getVal('prec_pis_cofins_credito', true),
            ipiCredito: getVal('prec_ipi_credito', true),
            das: getVal('prec_das')
        };
    }

    calculate() {
        if (this.activeTag === 'SUMMARY') return;

        const state = store.getState();
        const regime = state.company?.regimeTributario || 'Lucro Real';
        const isAutPro = state.company?.folderName?.startsWith('AUT_');
        
        const getVal = (id, isCurrency = false) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            return isCurrency ? app.parseCurrency(el.value) : parseFloat(el.value) || 0;
        };

        const faturamento = document.getElementById('prec-faturamento-select')?.value || 'Próprio';

        // 1. Custos Diretos
        const matBruto = app.parseCurrency(document.getElementById('prec_material')?.value || '0');
        const labor = app.parseCurrency(document.getElementById('prec_labor_total')?.value || '0');
        const despesas = app.parseCurrency(document.getElementById('prec_despesas')?.value || '0');

        // Faturamento Direto: preço = custo, sem margens, impostos ou descontos
        if (faturamento === 'Direto') {
            const custoTotal = matBruto + labor + despesas;
            document.getElementById('prec_custo_total_display').innerText = app.formatCurrency(custoTotal);
            document.getElementById('res_preco_final_s_ipi').innerText = app.formatCurrency(custoTotal);
            document.getElementById('res_valor_ipi').innerText = app.formatCurrency(0);
            document.getElementById('res_preco_final_c_ipi').innerText = app.formatCurrency(custoTotal);
            document.getElementById('res_lucro_reais').innerText = app.formatCurrency(0);
            document.getElementById('res_margem_real').innerText = '0.00% Margem';
            this.calculatedResults[this.activeTag] = {
                cost: custoTotal,
                finalPriceNoIpi: custoTotal,
                ipiValue: 0,
                profit: 0,
                comissao: 0,
                faturamento: 'Direto',
                direto: true
            };
            return;
        }

        const businessType = document.getElementById('prec-business-type-select')?.value || 'Industrialização';

        let matLiquido = matBruto;
        if (regime !== 'Simples Nacional') {
            const credIcms = getVal('prec_icms_credito', true);
            const credPisCof = getVal('prec_pis_cofins_credito', true);
            const credIpi = getVal('prec_ipi_credito', true);
            matLiquido = matBruto - credIcms - credPisCof - credIpi;
        }

        const percConsumiveis = getVal('prec_consumiveis');
        const custoConsumiveis = matLiquido * (percConsumiveis / 100);
        
        const custoTotal = matLiquido + custoConsumiveis + labor + despesas;

        document.getElementById('prec_custo_total_display').innerText = app.formatCurrency(custoTotal);

        // 2. Impostos
        let totalImpostosPercent = 0;
        if (regime === 'Simples Nacional') {
            totalImpostosPercent = getVal('prec_das');
        } else {
            totalImpostosPercent = getVal('prec_icms') + getVal('prec_pis_cofins') + (businessType === 'Prestação de Serviços' ? getVal('prec_iss') : 0);
        }

        // 3. IPI (precisa ser lido antes do markup para AutPro)
        const ipiIsento = document.getElementById('prec_ipi_isento')?.checked;
        const ipiPercent = ipiIsento ? 0 : getVal('prec_ipi');

        // 4. Preço Ideal (Markup)
        const margemIdeal = getVal('prec_margem_ideal');
        const custosFixos = getVal('prec_custos_fixos');
        const comissao = getVal('prec_comissao');

        let percComissao, valorComissao;
        if (isAutPro) {
            percComissao = 0.5 * (1 + ipiPercent / 100);
            valorComissao = 0;
        } else {
            percComissao = comissao * (1 - totalImpostosPercent / 100);
            valorComissao = 0;
        }
        const fatorMarkup = 1 - ((totalImpostosPercent + custosFixos + percComissao + margemIdeal) / 100);
        let precoIdeal = fatorMarkup > 0 ? custoTotal / fatorMarkup : custoTotal;

        // 5. Preço Final (Com Desconto)
        const desconto = getVal('prec_desconto');
        const precoFinalNoIpi = precoIdeal * (1 - (desconto / 100));

        // 6.1. Valor do IPI
        const valorIpi = precoFinalNoIpi * (ipiPercent / 100);
        const precoFinalWithIpi = precoFinalNoIpi + valorIpi;

        // 6. Lucro Líquido
        const valorImpostos = precoFinalNoIpi * (totalImpostosPercent / 100);
        const valorCustosFixos = precoFinalNoIpi * (custosFixos / 100);
        if (isAutPro) {
            valorComissao = (precoFinalNoIpi + valorIpi) * (0.5 / 100);
        } else {
            const baseComissao = precoFinalNoIpi - valorImpostos;
            valorComissao = baseComissao * (comissao / 100);
        }
        const lucroLiquido = precoFinalNoIpi - custoTotal - valorImpostos - valorCustosFixos - valorComissao;
        const margemReal = precoFinalNoIpi > 0 ? (lucroLiquido / precoFinalNoIpi) * 100 : 0;

        // Update UI
        document.getElementById('res_preco_final_s_ipi').innerText = app.formatCurrency(precoFinalNoIpi);
        document.getElementById('res_valor_ipi').innerText = app.formatCurrency(valorIpi);
        document.getElementById('res_preco_final_c_ipi').innerText = app.formatCurrency(precoFinalWithIpi);
        document.getElementById('res_impostos').innerText = app.formatCurrency(valorImpostos);
        document.getElementById('res_custos_fixos').innerText = app.formatCurrency(valorCustosFixos);
        document.getElementById('res_comissao').innerText = app.formatCurrency(valorComissao);
        document.getElementById('res_lucro_reais').innerText = app.formatCurrency(lucroLiquido);
        document.getElementById('res_margem_real').innerText = margemReal.toFixed(2) + '% Margem';

        const lucroEl = document.getElementById('res_lucro_reais');
        lucroEl.className = lucroLiquido >= 0 ? 'font-bold text-success' : 'font-bold text-danger';

        // Save result for Summary
        this.calculatedResults[this.activeTag] = {
            cost: custoTotal,
            finalPriceNoIpi: precoFinalNoIpi,
            ipiValue: valorIpi,
            profit: lucroLiquido,
            comissao: valorComissao,
            faturamento: document.getElementById('prec-faturamento-select')?.value || 'Próprio',
            direto: faturamento === 'Direto'
        };
    }

    getDefaultPricingData() {
        return {
            businessType: 'Industrialização',
            faturamento: 'Próprio',
            consumiveis: 5,
            icms: 12,
            pisCofins: 9.25,
            iss: 0,
            ipi: 9.75,
            ipiIsento: false,
            custosFixos: 8,
            comissao: 5,
            margemIdeal: 20,
            desconto: 0,
            icmsCredito: 0,
            pisCofinsCredito: 0,
            ipiCredito: 0,
            das: 0
        };
    }

    async saveToServer() {
        this.captureCurrentTagData(); // Save active tag state

        const ptcFolder = window.app.currentPtc?.folder;
        if (!ptcFolder) return;

        const payload = {
            ptcFolder,
            revisionFolder: window.app.currentPtc?.revision || '',
            type: 'precificacao_map',
            content: this.pricingMap
        };

        try {
            const _tkPREC1426 = store.getState().auth?.token;
            const res = await fetch('/api/save-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(_tkPREC1426 ? { 'Authorization': 'Bearer ' + _tkPREC1426 } : {}) },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                app.toast('Sucesso', 'Configurações de precificação salvas.', 'success');
            }
        } catch (e) {
            console.error(e);
            app.toast('Erro', 'Falha ao salvar precificação.', 'error');
        }
    }

    calculateAll() {
        const state = store.getState();
        const equipments = state.activeTechnicalProposal?.equipments || [];
        const regime = state.company?.regimeTributario || 'Lucro Real';
        const isAutPro = state.company?.folderName?.startsWith('AUT_');
        console.log('[Precificacao] calculateAll - equipments:', equipments.length, 'pricingMap keys:', Object.keys(this.pricingMap));

        for (const eq of equipments) {
            const tag = eq.tag;
            if (!this.pricingMap[tag]) {
                this.pricingMap[tag] = this.getDefaultPricingData();
            }
            // Auto-fill ICMS com base na tabela CONFAZ
            this._autoFillIcmsFromConfaz(tag);
            const data = this.pricingMap[tag];

            // Força IPI zerado para Cubículo de Média Tensão (MT) e componentes de SEU
            if (eq.type === 'CUB-MT') {
                data.ipiIsento = true;
                data.ipi = 0;
            }
            const isSeuComp = equipments
                .filter(e => e.type === 'SEU')
                .some(seu => (seu.seu_components || []).includes(String(eq.id)));
            if (isSeuComp) {
                data.ipiIsento = true;
                data.ipi = 0;
            }
            const matBruto = this.calculateEquipmentMaterialCost(eq);
            const labor = this.calculateEquipmentLaborCost(eq);
            const despesas = this.calculateEquipmentExpenseCost(eq);
            console.log('[Precificacao] calculateAll - tag:', tag, 'mat:', matBruto, 'labor:', labor, 'desp:', despesas);

            let matLiquido = matBruto;
            if (regime !== 'Simples Nacional') {
                const autoCred = this.calculateEquipmentCredits(eq);
                const credIcms = (data.icmsCredito || 0) || autoCred.credIcms;
                const credPisCof = (data.pisCofinsCredito || 0) || autoCred.credPisCof;
                const credIpi = (data.ipiCredito || 0) || autoCred.credIpi;
                matLiquido = matBruto - credIcms - credPisCof - credIpi;
            }

            const custoConsumiveis = matLiquido * ((data.consumiveis || 0) / 100);
            const custoTotal = matLiquido + custoConsumiveis + labor + despesas;

            // Faturamento Direto: skip markup, impostos, descontos
            if (data.faturamento === 'Direto') {
                this.calculatedResults[tag] = {
                    cost: custoTotal,
                    finalPriceNoIpi: custoTotal,
                    ipiValue: 0,
                    profit: 0,
                    comissao: 0,
                    faturamento: 'Direto',
                    direto: true
                };
                continue;
            }

            let totalImpostosPercent = 0;
            if (regime === 'Simples Nacional') {
                totalImpostosPercent = data.das || 0;
            } else {
                totalImpostosPercent = (data.icms || 0) + (data.pisCofins || 0) + (data.businessType === 'Prestação de Serviços' ? (data.iss || 0) : 0);
            }

            const margemIdeal = data.margemIdeal || 0;
            const custosFixos = data.custosFixos || 0;
            const comissao = data.comissao || 0;

            const ipiIsento = data.ipiIsento || false;
            const ipiPercent = ipiIsento ? 0 : (data.ipi || 0);

            let percComissao, valorComissao;
            if (isAutPro) {
                percComissao = 0.5 * (1 + ipiPercent / 100);
                valorComissao = 0;
            } else {
                percComissao = comissao * (1 - totalImpostosPercent / 100);
                valorComissao = 0;
            }
            const fatorMarkup = 1 - ((totalImpostosPercent + custosFixos + percComissao + margemIdeal) / 100);
            let precoIdeal = fatorMarkup > 0 ? custoTotal / fatorMarkup : custoTotal;

            const desconto = data.desconto || 0;
            const precoFinalNoIpi = precoIdeal * (1 - (desconto / 100));

            const valorIpi = precoFinalNoIpi * (ipiPercent / 100);

            const valorImpostos = precoFinalNoIpi * (totalImpostosPercent / 100);
            const valorCustosFixos = precoFinalNoIpi * (custosFixos / 100);
            if (isAutPro) {
                valorComissao = (precoFinalNoIpi + valorIpi) * (0.5 / 100);
            } else {
                const baseComissao = precoFinalNoIpi - valorImpostos;
                valorComissao = baseComissao * (comissao / 100);
            }
            const lucroLiquido = precoFinalNoIpi - custoTotal - valorImpostos - valorCustosFixos - valorComissao;

            this.calculatedResults[tag] = {
                cost: custoTotal,
                finalPriceNoIpi: precoFinalNoIpi,
                ipiValue: valorIpi,
                profit: lucroLiquido,
                comissao: valorComissao,
                faturamento: data.faturamento,
                direto: false
            };
        }

        // Infraestrutura — custo e preço final com BDI próprio
        const infra = this.calculateInfraestruturaCost();
        if (infra.cost > 0 || infra.finalPrice > 0) {
            this.calculatedResults['__INFRA__'] = {
                cost: infra.cost,
                finalPriceNoIpi: infra.finalPrice,
                ipiValue: 0,
                profit: infra.finalPrice - infra.cost,
                infra: true
            };
        } else {
            delete this.calculatedResults['__INFRA__'];
        }
    }

    loadData(data) {
        if (!data) return;
        
        if (data.businessType && !data.pricingMap) {
            const state = store.getState();
            const equipments = state.activeTechnicalProposal?.equipments || [];
            
            if (equipments.length > 0) {
                console.log('[Precificacao] Migrando dados globais para o equipamento:', equipments[0].tag);
                this.pricingMap = { [equipments[0].tag]: data };
                this.activeTag = equipments[0].tag;
            } else {
                this.pricingMap = { 'Geral': data };
                this.activeTag = 'SUMMARY';
            }
        } else {
            this.pricingMap = data;
            const state = store.getState();
            const equipments = state.activeTechnicalProposal?.equipments || [];
            const totalInfraItens = state.activeTechnicalProposal?.infraestrutura?.disciplinas?.reduce((s, d) => s + d.itens.length, 0) || 0;
            if (this.activeTag === '__INFRA__' && totalInfraItens === 0) {
                this.activeTag = equipments.length > 0 ? equipments[0].tag : 'SUMMARY';
            } else if (this.activeTag !== 'SUMMARY' && this.activeTag !== '__INFRA__' && !equipments.some(e => e.tag === this.activeTag)) {
                this.activeTag = equipments.length > 0 ? equipments[0].tag : 'SUMMARY';
            }
        }
        this.calculateAll();
        this.render();
    }
}

window.app.precificacao = new PrecificacaoModule();
