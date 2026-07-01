import { store } from './state.js';

const CalculosModule = {
    render() {
        const container = document.getElementById('view-calculos');
        if (!container) return;

        // Extract data from Proposta Técnica module
        const loads = this.extractLoads();
        
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

        const html = `
            <div class="card" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 class="text-xl font-bold" style="color: var(--color-primary); display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-lightning"></i> Cálculos Elétricos/Mecânicos
                    </h2>
                    <button class="btn btn-secondary" onclick="app.calculos.render()" title="Recalcular">
                        <i class="ph ph-arrows-clockwise"></i> Atualizar Resumo
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="padding: 20px; background: #fdf4ff; border-color: #f5d0fe; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #d946ef; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="ph ph-engine" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600;">Potência Total (CV)</div>
                            <div style="font-size: 28px; font-weight: 700; color: #701a75; margin-top: 4px;">${totalCV.toFixed(2)} CV</div>
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
                </div>

                <h3 class="card-title text-sm" style="margin-bottom: 12px;">Detalhamento das Cargas (Extraído da Proposta Técnica)</h3>
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
                            ${tableRows || '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhuma carga preenchida na Lista de Carga Detalhada.</td></tr>'}
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

        container.innerHTML = html;
    },

    extractLoads() {
        const rows = document.querySelectorAll('#view-proposta-tecnica .detailed-load-row');
        const loads = [];

        rows.forEach(row => {
            const tagInput = row.querySelector('input[name^="dload_tag_"]');
            const descInput = row.querySelector('input[name^="dload_desc_"]');
            const modelInput = row.querySelector('input[name^="dload_model_"]');
            const currentInput = row.querySelector('input[name^="dload_no_"]');

            const tag = tagInput ? tagInput.value || '-' : '-';
            const desc = descInput ? descInput.value || '-' : '-';
            const modelStr = modelInput ? modelInput.value || '0' : '0';
            const currentStr = currentInput ? currentInput.value || '0' : '0';

            // Parse numbers (extract numerical part, e.g., "15 CV" -> 15)
            // It could be 15.5 or 15,50. We need to handle Brazilian format carefully.
            let cleanModelStr = modelStr.replace(/\s+/g, '').replace('CV', '').replace('kW', '').replace('Kvar', '');
            let modelMatch = cleanModelStr.match(/[\d.,]+/);
            let modelNum = 0;
            if (modelMatch) {
                // If there are dots and a comma (e.g. 1.500,50), remove dots, replace comma with dot
                let matchStr = modelMatch[0];
                if (matchStr.includes(',') && matchStr.includes('.')) {
                    matchStr = matchStr.replace(/\\./g, '').replace(',', '.');
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
                    matchStr = matchStr.replace(/\\./g, '').replace(',', '.');
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
                    currentNum
                });
            }
        });

        return loads;
    }
};

window.app = window.app || {};
window.app.calculos = CalculosModule;
window.calculosModule = CalculosModule;

export default CalculosModule;
