import { store } from './state.js';

/**
 * Lista de Materiais (LM) / BOM Module
 * Refactored: Displays materials GROUPED BY LOAD (Carga).
 * Does NOT consolidate items globally.
 */

window.app = window.app || {};

const LMModule = {
    init() {
        console.log("LM (Grouped) Module Initializing...");

        window.app.lm = {
            exportXLS: this.exportXLS.bind(this),
            refresh: this.render.bind(this)
        };

        store.subscribe((state) => {
            const container = document.getElementById('view-lm');
            if (container && !container.classList.contains('hidden-module')) {
                this.render();
            }
        });
    },

    render() {
        // Called by App on navigation
        const container = document.getElementById('view-lm');
        if (!container) return;

        const state = store.getState();
        // Prepare data grouped by Carga
        const groupedData = this.prepareGroupedData(state.cargas || [], state.tipicos || []);
        this.currentGroupedData = groupedData; // Cache for export

        // 1. Static Shell
        if (!container.querySelector('.lm-shell-rendered')) {
            container.innerHTML = `
                <div class="card lm-shell-rendered" style="height: calc(100vh - 100px); display: flex; flex-direction: column; overflow: hidden; padding: 0; background: rgb(250, 250, 250);">
                    <div class="card-header" style="padding: 16px; border-bottom: 1px solid var(--color-border);">
                        <div>
                            <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                                <i class="ph ph-list-bullets"></i> Lista de Materiais (Detalhada por Carga)
                            </h3>
                            <div class="text-xs text-muted">Materiais separados por conjunto/típico.</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                             <button class="btn btn-secondary" onclick="app.lm.exportXLS()"><i class="ph ph-file-xls"></i> Exportar Excel</button>
                             <button class="btn btn-primary" onclick="window.print()"><i class="ph ph-printer"></i> Imprimir</button>
                        </div>
                    </div>

                    <div style="flex: 1; display: flex; overflow: hidden;">
                        <div class="table-container" style="flex: 1; border: none; overflow-y: auto; background: white; padding: 20px; padding-bottom: 60px;">
                            <div id="lm-list-body">
                                <!-- Groups injected here -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        this.renderTable(groupedData);
    },

    prepareGroupedData(cargas, tipicos) {
        // Sort loads by TAG
        const sortedCargas = [...cargas].sort((a, b) => (a.tag || '').localeCompare(b.tag || ''));

        return sortedCargas.map(carga => {
            const typical = tipicos.find(t => t.id === carga.typicalId);
            // Make a mutable copy so reorder does not touch original until saved
            const origItems = typical ? typical.items : [];
            return {
                carga: carga,
                typical: typical,
                items: origItems ? [...origItems] : []
            };
        });
    },

    renderTable(groupedData) {
        const container = document.getElementById('lm-list-body');
        if (!container) return;

        if (groupedData.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #94a3b8;">
                    <i class="ph ph-lightning" style="font-size: 48px; opacity: 0.2;"></i>
                    <p style="margin-top: 10px;">Nenhuma carga cadastrada para gerar a lista.</p>
                </div>
            `;
            return;
        }

        const html = groupedData.map((group, gIdx) => {
            const { carga, typical, items } = group;

            if (!typical) return `
                <div class="lm-group-card" style="margin-bottom: 20px; border: 1px solid var(--color-border); border-radius: 4px; overflow: hidden;">
                     <div style="background: #fee2e2; padding: 10px 15px; color: #b91c1c; font-size: 13px;">
                        <b>TAG: ${carga.tag}</b> - Típico não encontrado ou removido.
                     </div>
                </div>`;

            let subtotalGroup = 0;

            const rows = items.map((item, iIdx) => {
                const total = item.qtd * item.custo;
                subtotalGroup += total;
                return `
                    <tr data-index="${iIdx}">
                        <td style="text-align:center;cursor:grab;width:32px;" class="bom-drag-handle">
                            <i class="ph ph-grip-vertical" style="font-size:14px;opacity:0.4;"></i>
                        </td>
                        <td style="text-align: center; width: 60px;">${item.qtd}</td>
                        <td>${item.descricao || '-'}</td>
                        <td style="width: 120px;">${item.modelo || '-'}</td>
                        <td style="width: 120px; font-family: monospace;">${item.codigoFabricante || '-'}</td>
                        <td style="width: 120px;">${item.fabricante || '-'}</td>
                        <td style="width: 100px; text-align: right;">${app.formatCurrency(item.custo)}</td>
                        <td style="width: 100px; text-align: right; font-weight: 600;">${app.formatCurrency(total)}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="lm-group-card" style="margin-bottom: 20px; border: 1px solid var(--color-border); border-radius: 4px; overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="background: #f1f5f9; padding: 10px 15px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-weight: 700; color: var(--color-primary); font-size: 15px; background: white; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${carga.tag}</span>
                            <span style="font-weight: 600; font-size: 14px;">${typical.nome}</span>
                            ${carga.descricao ? `<span style="font-size: 13px; color: #64748b;">(${carga.descricao})</span>` : ''}
                        </div>
                        <div style="font-size: 13px;">
                            <span style="color: #64748b;">Total do Conjunto:</span> 
                            <b style="color: var(--color-accent);">${app.formatCurrency(subtotalGroup)}</b>
                        </div>
                    </div>
                    <table class="table table-striped" style="margin: 0;">
                        <thead>
                            <tr>
                                <th style="text-align:center;width:32px;"></th>
                                <th style="text-align: center;">Qtd</th>
                                <th>Descrição</th>
                                <th>Modelo</th>
                                <th>Cód. Fab.</th>
                                <th>Fabricante</th>
                                <th style="text-align: right;">Unit.</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody data-group-index="${gIdx}">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        this._initSortableLM();
    },

    _initSortableLM() {
        if (!window.Sortable) return;
        document.querySelectorAll('#lm-list-body tbody[data-group-index]').forEach(tbody => {
            if (tbody.__sortable) tbody.__sortable.destroy();
            tbody.__sortable = Sortable.create(tbody, {
                handle: '.bom-drag-handle',
                animation: 150,
                ghostClass: 'opacity-30',
                onEnd: (evt) => {
                    if (evt.oldIndex === evt.newIndex) return;
                    const gIdx = parseInt(tbody.dataset.groupIndex);
                    const group = this.currentGroupedData[gIdx];
                    if (!group || !group.typical) return;
                    const items = group.items;
                    const [moved] = items.splice(evt.oldIndex, 1);
                    items.splice(evt.newIndex, 0, moved);
                    this._saveTipicoOrder(group.typical, items);
                    this.render();
                }
            });
        });
    },

    _saveTipicoOrder(typical, newItems) {
        const state = store.getState();
        const idx = state.tipicos.findIndex(t => t.id === typical.id);
        if (idx === -1) return;
        state.tipicos[idx].items = newItems;
        store.setState({ tipicos: state.tipicos });
        // Persist to localStorage or server
        const dbSave = window.db || window.store;
        if (typeof store.save === 'function') {
            store.save();
        } else if (typeof dbSave?.tipicos?.update === 'function') {
            dbSave.tipicos.update(state.tipicos[idx]);
        }
    },

    async exportXLS() {
        if (!this.currentGroupedData || this.currentGroupedData.length === 0) {
            window.app.toast("Lista vazia.", "warning");
            return;
        }

        const btn = document.querySelector('button[onclick="app.lm.exportXLS()"]');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Exportando...';
            btn.disabled = true;
        }

        try {
            const ptcNumber = store.getState().activePtc?.folder || 'LM';
            const response = await fetch('/api/export-lm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items: this.currentGroupedData,
                    ptcNumber: ptcNumber
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Falha na exportação');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Extract filename from header if possible
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `BOM_${ptcNumber}.xlsx`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename=(.+)/);
                if (filenameMatch) filename = filenameMatch[1];
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            window.app.toast("Sucesso! O arquivo Excel foi baixado.", "success");
        } catch (e) {
            console.error(e);
            window.app.toast("Erro na exportação: " + e.message, "error");
        }
 finally {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    }
};

window.lmModule = LMModule;
LMModule.init();
