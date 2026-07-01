import { store } from './state.js';

/**
 * Módulo de Gestão de Despesas do Projeto
 * Integra com a Precificação e Rentabilidade.
 */

const DespesasModule = {
    defaultItems: [
        { desc: "Representação / comissões com comprovante", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Cafes da manhã", unit: 12.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Refeições Diárias para Funcionários", unit: 60.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Diárias Hotel / Hospedagem", unit: 200.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Outras Despesas no Hotel", unit: 0.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Locação Automóvel", unit: 150.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Passagem Aérea", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Passagens Diversas", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "ART", unit: 500.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Uniforme", unit: 0.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "TAXI e Estacionamento", unit: 0.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Internet / Telef. a serviço", unit: 0.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Plataforma Pantográfica", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Aluguel de imovel", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Container", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Caminhão munck", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Faxineira, produtos", unit: 0.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Ferramentas", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Caminhão ferramental", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Banheiro quimico mensal", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Andaimes", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "EPI", unit: 0.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Custo KM rodado - Caminhão/Van", unit: 3.0, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Custo KM rodado - Carro", unit: 1.90, pis: 0.0, cofins: 0.0, iss: 0.0 },
        { desc: "Pedagios", unit: 50.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Frete de entrega", unit: 500.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Embalagem padrão exportação (cotar)", unit: 500.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Certificado de origem (exportação)", unit: 130.0, pis: 1.65, cofins: 7.60, iss: 0.0 },
        { desc: "Desembaraço aduaneiro (exportação)", unit: 950.0, pis: 1.65, cofins: 7.60, iss: 0.0 }
    ],

    init() {
        console.log('[Despesas] Inicializando módudo...');
        this.loadData();

        // Listen for project changes to reload data
        store.subscribe(() => {
            const state = store.getState();
            const currentFolder = state.currentPtc ? state.currentPtc.folder : null;

            if (this.lastPtc !== currentFolder) {
                this.lastPtc = currentFolder;
                this.loadData();
            }

            const container = document.getElementById('view-despesas');
            if (container && !container.classList.contains('hidden-module')) {
                this.render();
            }
        });
    },

    render() {
        const container = document.getElementById('view-despesas');
        if (!container) return;

        let data = store.getState().despesas;
        
        // Fallback para os itens padrão se a lista estiver vazia ou nula
        if (!data || data.length === 0) {
            data = this.defaultItems.map(item => ({ ...item, qtd: 0 }));
        }

        container.innerHTML = `
            <div class="card fade-in">
                <div class="card-header">
                    <div>
                        <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-money"></i> Estimativa de Despesas de Projeto / Logística
                        </h3>
                        <div class="text-xs text-muted">Preencha as quantidades para cada item de despesa previsto.</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-ghost text-muted" onclick="window.despesasModule.resetToDefaults()">
                            <i class="ph ph-arrow-counter-clockwise"></i> Restaurar Padrões
                        </button>
                        <button class="btn btn-secondary" onclick="window.despesasModule.addNewLine()">
                            <i class="ph ph-plus"></i> Nova Linha
                        </button>
                        <button class="btn btn-primary" onclick="window.despesasModule.save()">
                            <i class="ph ph-check"></i> Salvar e Aplicar
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="table" style="width: 100%;">
                        <thead>
                            <tr style="background: var(--color-bg-alt);">
                                <th style="width: 350px;">Descrição da Despesa</th>
                                <th style="width: 80px; text-align: center;">Qtd</th>
                                <th style="width: 130px; text-align: right;">Custo Unit. (R$)</th>
                                <th style="width: 80px; text-align: center;">PIS %</th>
                                <th style="width: 80px; text-align: center;">COFINS %</th>
                                <th style="width: 80px; text-align: center;">ISS %</th>
                                <th style="width: 140px; text-align: right;">Total Bruto (R$)</th>
                                <th style="width: 50px;"></th>
                            </tr>
                        </thead>
                        <tbody id="despesas-tbody">
                            ${data.map((item, index) => this.renderRow(item, index)).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: var(--color-bg-alt); font-weight: bold;">
                                <td colspan="6" style="text-align: right; padding: 12px;">TOTAL GERAL DE DESPESAS:</td>
                                <td id="despesas-total-geral" style="text-align: right; color: var(--color-primary); font-size: 16px;">R$ 0,00</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        this.calculateTotals();
    },

    renderRow(item, index) {
        const total = (item.qtd || 0) * (item.unit || 0);
        return `
            <tr>
                <td>
                    <input type="text" class="form-control" value="${item.desc}" onchange="window.despesasModule.updateItem(${index}, 'desc', this.value)" style="border: none; background: transparent;">
                </td>
                <td>
                    <input type="number" class="form-control" value="${item.qtd || 0}" oninput="window.despesasModule.updateItem(${index}, 'qtd', this.value)" style="text-align: center;">
                </td>
                <td>
                    <input type="text" class="form-control" value="${app.formatCurrencyRaw(item.unit)}" onblur="window.despesasModule.updateItemMoney(${index}, 'unit', this.value)" style="text-align: right;">
                </td>
                <td>
                    <input type="text" class="form-control" value="${item.pis}%" onblur="window.despesasModule.updateItemPercent(${index}, 'pis', this.value)" style="text-align: center;">
                </td>
                <td>
                    <input type="text" class="form-control" value="${item.cofins}%" onblur="window.despesasModule.updateItemPercent(${index}, 'cofins', this.value)" style="text-align: center;">
                </td>
                <td>
                    <input type="text" class="form-control" value="${item.iss}%" onblur="window.despesasModule.updateItemPercent(${index}, 'iss', this.value)" style="text-align: center;">
                </td>
                <td style="text-align: right; font-weight: 600;" id="row-total-${index}">
                    ${app.formatCurrency(total)}
                </td>
                <td style="text-align: center;">
${store.canDelete() ? `                    <button class="btn btn-ghost text-danger btn-sm" onclick="window.despesasModule.removeLine(${index})">
                        <i class="ph ph-trash"></i>
                    </button>` : ''}
                </td>
            </tr>
        `;
    },

    updateItem(index, field, value) {
        const data = store.getState().despesas || [];
        if (field === 'qtd') value = parseFloat(value) || 0;
        
        data[index][field] = value;
        store.setState({ despesas: data });
        this.updateRowUI(index);
    },

    updateItemMoney(index, field, value) {
        const numeric = app.parseCurrency(value);
        this.updateItem(index, field, numeric);
        this.render(); // Redraw for formatting
    },

    updateItemPercent(index, field, value) {
        const numeric = parseFloat(value.replace('%', '').replace(',', '.')) || 0;
        this.updateItem(index, field, numeric);
        this.render(); 
    },

    updateRowUI(index) {
        const data = store.getState().despesas || [];
        const item = data[index];
        const total = (item.qtd || 0) * (item.unit || 0);
        
        const cell = document.getElementById(`row-total-${index}`);
        if (cell) cell.textContent = app.formatCurrency(total);
        
        this.calculateTotals();
    },

    calculateTotals() {
        const data = store.getState().despesas || [];
        const total = data.reduce((acc, item) => acc + ((item.qtd || 0) * (item.unit || 0)), 0);
        
        const el = document.getElementById('despesas-total-geral');
        if (el) el.textContent = app.formatCurrency(total);

        return total;
    },

    addNewLine() {
        let data = store.getState().despesas;
        // Se a lista estiver vazia ou não inicializada, carregar os padrões primeiro
        if (!data || data.length === 0) {
            data = this.defaultItems.map(item => ({ ...item, qtd: 0 }));
        }

        data.push({ desc: "Nova Despesa", unit: 0, qtd: 0, pis: 0, cofins: 0, iss: 0 });
        store.setState({ despesas: data });
        this.render();
    },

    removeLine(index) {
        let data = store.getState().despesas;
        if (!data || data.length === 0) {
            data = this.defaultItems.map(item => ({ ...item, qtd: 0 }));
        }
        
        data.splice(index, 1);
        store.setState({ despesas: data });
        this.render();
    },

    async resetToDefaults() {
        if (await window.app.confirm("Isso irá remover todas as alterações atuais e restaurar os 29 itens padrão. Confirma?", "Restaurar")) {
            const defaults = this.defaultItems.map(item => ({ ...item, qtd: 0 }));
            store.setState({ despesas: defaults });
            this.render();
            window.app.toast("Itens padrão restaurados!", "info");
        }
    },

    async save() {
        const state = store.getState();
        const despesas = state.despesas || [];
        // PEGANDO O CONTEXTO DO APP GLOBAL DIRETAMENTE PARA EVITAR ERROS DE ESTADO
        const currentPtcObj = window.app.currentPtc || {};
        const currentPtc = currentPtcObj.folder || null;
        const revisionFolder = currentPtcObj.revision || '';

        if (!currentPtc) {
            window.app.toast("Selecione um projeto (PTC) antes de salvar.", "error");
            return;
        }

        const total = this.calculateTotals();

        // 1. Sync with Precificação state
        if (window.app.precificacao) {
            window.app.precificacao.updateExpenseCosts(total);
        }

        // 2. Persist to server
        const payload = {
            ptcFolder: currentPtc,
            revisionFolder: revisionFolder,
            type: 'precificacao', 
            content: JSON.stringify({ despesas, total, updatedAt: new Date() }),
            filename: 'Despesas.json'
        };

        try {
            const _tkDESP265 = store.getState().auth?.token;
            const res = await fetch('/api/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(_tkDESP265 ? { 'Authorization': 'Bearer ' + _tkDESP265 } : {}) },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            if (result.success) {
                window.app.toast("Despesas salvas e aplicadas na Precificação!", "success");
            } else {
                window.app.toast("Erro ao salvar: " + result.error, "error");
            }
        } catch (err) {
            console.error("Error saving expenses:", err);
            window.app.toast("Erro de conexão com o servidor.", "error");
        }
    },

    async loadData() {
        const currentPtcObj = window.app.currentPtc || {};
        const currentPtc = currentPtcObj.folder || null;
        const revisionFolder = currentPtcObj.revision || '';
        
        if (!currentPtc) return;

        try {
            const _tkDESP = store.getState().auth?.token;
            const _hDESP = _tkDESP ? { 'Authorization': 'Bearer ' + _tkDESP } : {};
            const res = await fetch(`/api/load-proposal?ptc=${currentPtc}&file=Despesas.json&revisionFolder=${revisionFolder}`, { headers: _hDESP });
            if (res.ok) {
                const data = await res.json();
                if (data && data.despesas) {
                    store.setState({ despesas: data.despesas });
                    return;
                }
            }
            // Initialize default list if not found or error
            store.setState({ despesas: this.defaultItems.map(item => ({ ...item, qtd: 0 })) });
        } catch (err) {
            console.warn("Could not load expenses, using defaults.", err);
            store.setState({ despesas: this.defaultItems.map(item => ({ ...item, qtd: 0 })) });
        }
    },

    // Helpers agora centralizados no app.js
};

window.despesasModule = DespesasModule;
DespesasModule.init();
