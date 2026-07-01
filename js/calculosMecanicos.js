import { store } from './state.js';

const CalculosMecanicosModule = {
    activeTab: null,

    switchTab(tabId) {
        this.activeTab = tabId;
        this.render();
    },

    render() {
        const container = document.getElementById('view-calculos-mecanicos');
        if (!container) return;

        const activeProposal = store.getState().activeTechnicalProposal;
        if (!activeProposal) {
            container.innerHTML = `
                <div class="card" style="padding: 40px; text-align: center;">
                    <i class="ph ph-file-search" style="font-size: 48px; color: #94a3b8; margin-bottom: 16px;"></i>
                    <h3 style="color: #64748b; font-weight: 600;">Nenhuma Proposta Técnica Ativa</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Abra uma Proposta Técnica para visualizar o resumo dos cálculos mecânicos e de barramentos.</p>
                </div>
            `;
            return;
        }

        const panelTags = this._getPanelTags(activeProposal);
        if (!this.activeTab || !panelTags.includes(this.activeTab)) {
            this.activeTab = panelTags.length > 0 ? panelTags[0] : null;
        }

        container.innerHTML = this.buildHtml(this.activeTab, panelTags, activeProposal);
    },

    _getPanelTags(proposal) {
        const datasheets = proposal.datasheets || [];
        const detailedLoads = proposal.detailedLoadItems || [];
        return [...new Set([
            ...datasheets.map(ds => ds.tag).filter(Boolean),
            ...detailedLoads.map(load => load.panelTag).filter(p => p && p !== 'Geral' && p !== 'GERAL')
        ])];
    },

    buildHtml(panelTag, panelTagsOverride, proposalOverride) {
        const activeProposal = proposalOverride || store.getState().activeTechnicalProposal;
        if (!activeProposal) return `<div style="padding:40px;text-align:center;color:#94a3b8;">Nenhuma proposta ativa.</div>`;

        const panelTags = panelTagsOverride || this._getPanelTags(activeProposal);
        const activeTag = panelTag || (panelTags.length > 0 ? panelTags[0] : null);
        const data = this.extractData(activeTag);

        const panelTabsHtml = panelTags.map(tag => `
            <button class="btn btn-sm ${activeTag === tag ? 'btn-primary' : 'btn-outline'}"
                    onclick="app.calculosMecanicos.switchTab('${tag}')"
                    style="border-radius: 20px; padding: 6px 16px; white-space: nowrap;">
                ${tag}
            </button>
        `).join('');

        return `
            <div style="animation: fadeIn 0.3s ease;">
                <!-- Header -->
                <div style="background: var(--color-accent); color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; margin-bottom: 20px;">
                    <div>
                        <h4 style="margin: 0; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-wrench"></i> Cálculos Mecânicos
                            <span style="font-weight: 300; opacity: 0.8; font-size: 14px;">| ${activeProposal?.projeto || 'Proposta Ativa'}</span>
                        </h4>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Dimensionamento de Barramentos e Estrutura · Painel: <b>${activeTag || '—'}</b></div>
                    </div>
                    <button class="btn btn-sm" onclick="app.calculosMecanicos.render()" style="color: white; border: 1px solid rgba(255,255,255,0.4); background: transparent;">
                        <i class="ph ph-arrows-clockwise"></i> Atualizar
                    </button>
                </div>

                <!-- Seletor de Painel -->
                ${panelTags.length > 1 ? `
                <div style="display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                    ${panelTabsHtml}
                </div>` : ''}

                <!-- Cards Resumo -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="padding: 20px; background: #f0fdf4; border-color: #bbf7d0; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--color-accent); display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="ph ph-ruler" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600;">Dimensões Totais (L x A x P)</div>
                            <div style="font-size: 20px; font-weight: 700; color: #166534; margin-top: 4px;">
                                ${data.width} x ${data.height} x ${data.depth} mm
                            </div>
                            <div class="text-xs text-muted">Extraído da Chaparia (${activeTag})</div>
                        </div>
                    </div>
                    <div class="card" style="padding: 20px; background: #fff7ed; border-color: #ffedd5; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #f97316; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="ph ph-cube" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600;">Barramento de Cobre (kg)</div>
                            <div style="font-size: 20px; font-weight: 700; color: #9a3412; margin-top: 4px;">${data.busWeight.toFixed(2)} kg</div>
                            <div class="text-xs text-muted">Corrente do Painel: ${data.totalAmps.toFixed(1)} A</div>
                        </div>
                    </div>
                </div>

                <!-- Tabela de Detalhamento -->
                <div style="margin-top: 24px;">
                    <h3 class="card-title text-sm" style="margin-bottom: 12px;">Detalhamento para o Painel: <b>${activeTag}</b></h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Parâmetro</th>
                                    <th style="text-align: center;">Valor Estimado</th>
                                    <th style="text-align: center;">Unidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Largura Total</td><td>Soma de colunas + laterais do painel</td><td style="text-align: center; font-weight: 700;">${data.width}</td><td style="text-align: center;">mm</td></tr>
                                <tr><td>Altura de Referência</td><td>Maior altura de painel selecionado</td><td style="text-align: center; font-weight: 700;">${data.height}</td><td style="text-align: center;">mm</td></tr>
                                <tr><td>Profundidade de Referência</td><td>Maior profundidade de painel selecionado</td><td style="text-align: center; font-weight: 700;">${data.depth}</td><td style="text-align: center;">mm</td></tr>
                                <tr><td>Peso Total (Cobre)</td><td>Barramento Principal + Derivações (${activeTag})</td><td style="text-align: center; font-weight: 700; color: #9a3412;">${data.busWeight.toFixed(2)}</td><td style="text-align: center;">kg</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="alert alert-info" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 8px; color: #0369a1; display: flex; gap: 12px; align-items: flex-start; margin-top: 20px;">
                    <i class="ph ph-info" style="font-size: 20px; margin-top: 2px;"></i>
                    <p style="font-size: 13px; margin: 0;">Valores calculados dinamicamente para o painel <b>${activeTag}</b>. Certifique-se de associar as cargas e chaparias corretamente na Proposta Técnica.</p>
                </div>
            </div>
        `;
    },

    extractData(panelTag) {
        const modal = document.getElementById('form-proposta-container');
        
        let totalWidth = 0;
        let maxHeight = 0;
        let maxDepth = 0;
        let totalAmps = 0;
        let busWeight = 0;

        const proposal = store.getState().activeTechnicalProposal;

        // 1. Tentar ler do estado da proposta ativa
        if (proposal && proposal.equipments) {
            const eq = proposal.equipments.find(e => e.tag === panelTag);
            if (eq) {
                // Dimensões do Estado (enclosureItems)
                const enclosureItems = eq.enclosureItems || [];
                enclosureItems.forEach(item => {
                    if (item.dim) {
                        const parts = item.dim.toLowerCase().split('x');
                        if (parts.length >= 3) {
                            const h = parseFloat(parts[0]) || 0;
                            const w = parseFloat(parts[1]) || 0;
                            const d = parseFloat(parts[2]) || 0;
                            totalWidth += w;
                            maxHeight = Math.max(maxHeight, h);
                            maxDepth = Math.max(maxDepth, d);
                        }
                    }
                });

                // Corrente do Estado (loads)
                const loads = eq.loads || [];
                loads.forEach(load => {
                    const current = parseFloat(load.no || load.current) || 0;
                    totalAmps += current;
                });

                // Se cargas do equipamento estiverem vazias, buscar no detailedLoadItems global filtrado por panelTag
                if (totalAmps === 0 && proposal.detailedLoadItems) {
                    proposal.detailedLoadItems.forEach(load => {
                        if (load.panelTag === panelTag) {
                            const current = parseFloat(load.no || load.current) || 0;
                            totalAmps += current;
                        }
                    });
                }
            }
        }

        // 2. Fallback para o DOM caso o estado esteja zerado (ex: durante edição em tela)
        if ((totalWidth === 0 || totalAmps === 0) && modal) {
            const chapariaRows = modal.querySelectorAll('.chaparia-row');
            const painelTypes = store.getState().painelTypes;

            chapariaRows.forEach(row => {
                const rowPanel = row.querySelector('select[name^="chap_panel_tag_"]')?.value || 'GERAL';
                if (rowPanel === panelTag) {
                    const select = row.querySelector('select[name^="chap_painel_"]');
                    if (select && select.value) {
                        const painel = painelTypes.find(p => String(p.id) === String(select.value));
                        if (painel) {
                            totalWidth += parseFloat(painel.largura) || 0;
                            maxHeight = Math.max(maxHeight, parseFloat(painel.altura) || 0);
                            maxDepth = Math.max(maxDepth, parseFloat(painel.profundidade) || 0);
                        }
                    }
                }
            });

            const loadRows = modal.querySelectorAll('.detailed-load-row');
            loadRows.forEach(row => {
                const rowPanel = row.querySelector('input[name^="dload_panel_"]')?.value || 'GERAL';
                if (rowPanel === panelTag) {
                    const currentInput = row.querySelector('input[name^="dload_no_"]') || row.querySelector('input[name^="dload_current_"]');
                    const current = parseFloat(currentInput?.value) || 0;
                    totalAmps += current;
                }
            });
        }

        // 3. Peso do Barramento (Estimativa baseada no peso global proporcional à corrente e largura)
        if (modal) {
            const weightEl = modal.querySelector('#bus_weight_text');
            const lengthEl = modal.querySelector('#bus_length_text');
            
            if (weightEl && lengthEl) {
                const totalWeight = parseFloat(weightEl.textContent.replace(' kg', '')) || 0;
                const globalAmps = parseFloat(modal.querySelector('#bus_amps')?.value) || 1;
                
                // Estimativa: Proporcional à corrente deste painel em relação à corrente global calculada no barramento
                // e proporcional à largura deste painel (considerando que o barramento atravessa a largura)
                const weightPerAmpPerMm = totalWeight / (globalAmps * (parseFloat(modal.querySelector('#bus_panel_width')?.value) || 1));
                busWeight = weightPerAmpPerMm * totalAmps * totalWidth;

                // Se o cálculo acima falhar (divisão por zero ou similar), usa uma regra de três simples
                if (!busWeight || busWeight === Infinity) {
                    busWeight = (totalWeight * (totalAmps / globalAmps)) || 0;
                }
            }
        }

        // 4. Estimativa de Engenharia de Cobre (se o modal estiver fechado ou se o cálculo do DOM falhar)
        if (!busWeight || busWeight === 0) {
            // Densidade do cobre: 8.9e-6 kg/mm3
            // Densidade de corrente típica para barras: 1.8 A/mm2
            // Número de fases: 3 fases + 1 Neutro (50%) + 1 Terra (50%) = 4 barras completas percorrendo a largura
            const currentDensity = 1.8; // A/mm2
            const copperDensity = 8.9e-6; // kg/mm3
            const numBars = 4;
            const crossSection = totalAmps / currentDensity; // mm2
            busWeight = numBars * crossSection * totalWidth * copperDensity;
        }

        return {
            width: totalWidth,
            height: maxHeight,
            depth: maxDepth,
            busWeight: busWeight,
            totalAmps: totalAmps
        };
    }
};

window.app = window.app || {};
window.app.calculosMecanicos = CalculosMecanicosModule;

export default CalculosMecanicosModule;

