import { store } from './state.js';

const CalculosEletricosModule = {
    activeTab: null,


    switchTab(tabId) {
        this.activeTab = tabId;
        this.render();
    },

    render() {
        const container = document.getElementById('view-calculos-eletricos');
        if (!container) return;
        const proposal = store.getState().activeTechnicalProposal;
        const allLoads = this.extractLoads();
        const panelTags = [...new Set([
            ...(proposal.datasheets || []).map(ds => ds.tag).filter(Boolean),
            ...allLoads.map(load => load.panel).filter(p => p !== 'Geral')
        ])];
        if (!this.activeTab || !panelTags.includes(this.activeTab)) {
            this.activeTab = panelTags.length > 0 ? panelTags[0] : null;
        }
        container.innerHTML = this.buildHtml(this.activeTab, panelTags);
    },

    buildHtml(panelTag, panelTagsOverride) {
        const proposal = store.getState().activeTechnicalProposal;
        const allLoads = this.extractLoads();

        const panelTags = panelTagsOverride || [...new Set([
            ...(proposal?.datasheets || []).map(ds => ds.tag).filter(Boolean),
            ...allLoads.map(load => load.panel).filter(p => p !== 'Geral')
        ])];

        const activeTag = panelTag || (panelTags.length > 0 ? panelTags[0] : null);
        const loads = allLoads.filter(l => l.panel === activeTag);

        let totalCV = 0;
        let totalCurrent = 0;

        const tableRows = loads.map(load => {
            totalCV += load.modelNum;
            totalCurrent += load.currentNum;
            return `
                <tr>
                    <td>${load.tag}</td>
                    <td>${load.desc}</td>
                    <td style="text-align: center;">${load.modelStr}</td>
                    <td style="text-align: center;">${load.currentStr}</td>
                </tr>
            `;
        }).join('');

        const panelTabsHtml = panelTags.map(tag => `
            <button class="btn btn-sm ${activeTag === tag ? 'btn-primary' : 'btn-outline'}"
                    onclick="app.calculosEletricos.switchTab('${tag}'); app.propostaTecnica && app.propostaTecnica.renderInlineCalc && app.propostaTecnica.renderInlineCalc('calc_eletrico', '${tag}')"
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
                            <i class="ph ph-lightning"></i> Cálculos Elétricos
                            <span style="font-weight: 300; opacity: 0.8; font-size: 14px;">| ${proposal?.projeto || 'Proposta Ativa'}</span>
                        </h4>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Análise de Cargas, Potência e Dimensionamento · Painel: <b>${activeTag || '—'}</b></div>
                    </div>
                    <button class="btn btn-sm" onclick="app.propostaTecnica && app.propostaTecnica.refreshCalcEletrico ? app.propostaTecnica.refreshCalcEletrico() : app.calculosEletricos.render()" style="color: white; border: 1px solid rgba(255,255,255,0.4); background: transparent;">
                        <i class="ph ph-arrows-clockwise"></i> Atualizar
                    </button>
                </div>

                <!-- Seletor de Painel -->
                ${panelTags.length > 1 ? `
                <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                    ${panelTabsHtml}
                </div>` : ''}

                <!-- Cards Resumo -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="padding: 20px; background: #fdf4ff; border-color: #f5d0fe; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #d946ef; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="ph ph-engine" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600;">Potência Total (CV)</div>
                            <div style="font-size: 24px; font-weight: 700; color: #701a75; margin-top: 4px;">${totalCV.toFixed(2)} CV</div>
                        </div>
                    </div>
                    <div class="card" style="padding: 20px; background: #eff6ff; border-color: #bfdbfe; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="ph ph-lightning" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600;">Corrente Total (A)</div>
                            <div style="font-size: 28px; font-weight: 700; color: #1e3a8a; margin-top: 4px;">${totalCurrent.toFixed(2)} A</div>
                        </div>
                    </div>
                    <div class="card" style="padding: 20px; background: #ecfdf5; border-color: #a7f3d0; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="ph ph-trend-up" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600;">Corrente Nominal</div>
                            <div style="font-size: 22px; font-weight: 700; color: #065f46; margin-top: 4px;">${(() => {
                                if (totalCurrent <= 0) return '0 A';
                                const faixas = [100,160,200,250,300,400,500,630,800,1000,1250,1600,2000,2500,3200,4000,5000,6300];
                                const n = faixas.find(f => f >= totalCurrent);
                                return n ? `${n} A` : 'Sob Consulta';
                            })()}</div>
                        </div>
                    </div>
                    <div class="card" style="padding: 20px; background: #fffbeb; border-color: #fef08a; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #eab308; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="ph ph-shield-check" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600;">Disj. Geral Sugerido</div>
                            <div style="font-size: 13px; font-weight: 700; color: #854d0e; margin-top: 4px;">${this.suggestDisjuntor(totalCurrent, activeTag)}</div>
                        </div>
                    </div>
                </div>

                <!-- Tabela de Cargas -->
                <h3 class="card-title text-sm" style="margin-bottom: 12px;">Detalhamento das Cargas — Painel: <b>${activeTag || '—'}</b></h3>
                <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>TAG</th>
                                <th>Descrição</th>
                                <th style="text-align: center;">Potência Informada</th>
                                <th style="text-align: center;">Corrente Aprox. Informada</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">Nenhuma carga detectada para este painel.</td></tr>`}
                        </tbody>
                        ${loads.length > 0 ? `
                        <tfoot>
                            <tr style="font-weight: bold; background: #f1f5f9;">
                                <td colspan="2" style="text-align: right;">TOTAL:</td>
                                <td style="text-align: center;">${totalCV.toFixed(2)} CV</td>
                                <td style="text-align: center;">${totalCurrent.toFixed(2)} A</td>
                            </tr>
                        </tfoot>` : ''}
                    </table>
                </div>
            </div>
        `;
    },

    suggestDisjuntor(corrente, panelTag) {
        if (corrente <= 0) return 'Nenhuma carga detectada';
        
        // 1. Obter Icc da Proposta Técnica diretamente do estado
        let icc = 'XX';
        const proposal = store.getState().activeTechnicalProposal;
        if (proposal) {
            // Buscar nos datasheets
            const ds = (proposal.datasheets || []).find(d => d.tag === panelTag);
            if (ds && ds.icc) {
                icc = ds.icc;
            }
            // Buscar nos equipamentos
            if (icc === 'XX' && proposal.equipments) {
                const eq = proposal.equipments.find(e => e.tag === panelTag);
                if (eq && eq.technical && eq.technical.icc) {
                    icc = eq.technical.icc;
                }
            }
        }

        // 2. Fallback para o DOM
        if (icc === 'XX') {
            const iccRad = document.querySelector('#view-proposta-tecnica input[name="icc"]:checked');
            if (iccRad) {
                if (iccRad.value === 'Outro') {
                    const custom = document.querySelector('#view-proposta-tecnica input[name="icc_custom"]');
                    icc = custom ? custom.value : 'XX';
                } else {
                    icc = iccRad.value;
                }
            }
        }

        // 3. Lógica de Amperagem
        let amparagem = "";
        if (corrente <= 80) amparagem = "100A";
        else if (corrente <= 120) amparagem = "160A";
        else if (corrente <= 180) amparagem = "200A";
        else if (corrente <= 220) amparagem = "250A";
        else if (corrente <= 300) amparagem = "320A";
        else if (corrente <= 380) amparagem = "400A";
        else if (corrente <= 480) amparagem = "500A";
        else if (corrente <= 580) amparagem = "630A";
        else return "Acima de 580A - Consultar Engenharia";

        return `Disjuntor Caixa Moldada ${amparagem} - ${icc}`;
    },

    extractLoads() {
        const proposal = store.getState().activeTechnicalProposal;
        if (!proposal) return [];

        // 1. Priorizar dados do Estado (detailedLoadItems)
        const detailedLoads = proposal.detailedLoadItems || [];
        if (detailedLoads.length > 0) {
            return detailedLoads.map(load => {
                const tag = load.tag || '-';
                const desc = load.desc || '-';
                const modelStr = load.model || '0';
                const currentStr = load.no || '0';
                const panel = load.panelTag || 'Geral';

                let cleanModelStr = String(modelStr).replace(/\s+/g, '').replace('CV', '').replace('kW', '').replace('Kvar', '');
                let modelMatch = cleanModelStr.match(/[\d.,]+/);
                let modelNum = 0;
                if (modelMatch) {
                    let matchStr = modelMatch[0];
                    if (matchStr.includes(',') && matchStr.includes('.')) {
                        matchStr = matchStr.replace(/\./g, '').replace(',', '.');
                    } else if (matchStr.includes(',')) {
                        matchStr = matchStr.replace(',', '.');
                    }
                    modelNum = parseFloat(matchStr) || 0;
                }

                let cleanCurrStr = String(currentStr).replace(/\s+/g, '').replace('A', '');
                let currentMatch = cleanCurrStr.match(/[\d.,]+/);
                let currentNum = 0;
                if (currentMatch) {
                    let matchStr = currentMatch[0];
                    if (matchStr.includes(',') && matchStr.includes('.')) {
                        matchStr = matchStr.replace(/\./g, '').replace(',', '.');
                    } else if (matchStr.includes(',')) {
                        matchStr = matchStr.replace(',', '.');
                    }
                    currentNum = parseFloat(matchStr) || 0;
                }

                return {
                    tag,
                    desc,
                    modelStr: String(modelStr),
                    currentStr: String(currentStr),
                    modelNum,
                    currentNum,
                    panel
                };
            });
        }

        // 2. Fallback para parsing do DOM caso o estado esteja vazio (por exemplo, na criação de nova proposta antes de salvar)
        const rows = document.querySelectorAll('#view-proposta-tecnica .detailed-load-row');
        const loads = [];

        rows.forEach(row => {
            const tagInput = row.querySelector('input[name^="dload_tag_"]');
            const descInput = row.querySelector('input[name^="dload_desc_"]');
            const modelInput = row.querySelector('input[name^="dload_power_"]') || row.querySelector('input[name^="dload_model_"]');
            const currentInput = row.querySelector('input[name^="dload_current_"]') || row.querySelector('input[name^="dload_no_"]');
            const panelInput = row.querySelector('input[name^="dload_panel_"]');

            const tag = tagInput ? tagInput.value || '-' : '-';
            const desc = descInput ? descInput.value || '-' : '-';
            const modelStr = modelInput ? modelInput.value || '0' : '0';
            const currentStr = currentInput ? currentInput.value || '0' : '0';
            const panel = panelInput ? panelInput.value || 'Geral' : 'Geral';


            let cleanModelStr = modelStr.replace(/\s+/g, '').replace('CV', '').replace('kW', '').replace('Kvar', '');
            let modelMatch = cleanModelStr.match(/[\d.,]+/);
            let modelNum = 0;
            if (modelMatch) {
                let matchStr = modelMatch[0];
                if (matchStr.includes(',') && matchStr.includes('.')) {
                    matchStr = matchStr.replace(/\./g, '').replace(',', '.');
                } else if (matchStr.includes(',')) {
                    matchStr = matchStr.replace(',', '.');
                }
                modelNum = parseFloat(matchStr) || 0;
            }

            let cleanCurrStr = currentStr.replace(/\s+/g, '').replace('A', '');
            let currentMatch = cleanCurrStr.match(/[\d.,]+/);
            let currentNum = 0;
            if (currentMatch) {
                let matchStr = currentMatch[0];
                if (matchStr.includes(',') && matchStr.includes('.')) {
                    matchStr = matchStr.replace(/\./g, '').replace(',', '.');
                } else if (matchStr.includes(',')) {
                    matchStr = matchStr.replace(',', '.');
                }
                currentNum = parseFloat(matchStr) || 0;
            }

            if ((tag !== '-' && tag !== '') || modelNum > 0 || currentNum > 0) {
                loads.push({
                    tag,
                    desc,
                    modelStr,
                    currentStr,
                    modelNum,
                    currentNum,
                    panel
                });
            }

        });

        return loads;
    }
};

window.app = window.app || {};
window.app.calculosEletricos = CalculosEletricosModule;

export default CalculosEletricosModule;

