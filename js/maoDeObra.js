import { store } from './state.js';

const MaoDeObraModule = {
    init() {
        console.log('[MaoDeObra] Inicializando módulo...');
        window.app = window.app || {};
        window.app.maoDeObra = {
            render: this.render.bind(this),
            resetView: this.resetView.bind(this)
        };

        store.subscribe(() => {
            const container = document.getElementById('view-mao-de-obra');
            if (container && !container.classList.contains('hidden-module')) {
                this.render();
            }
        });
        console.log('[MaoDeObra] Módulo registrado com sucesso.');
    },

    resetView() {
        // nothing to reset
    },

    calcularTotais(data) {
        const equipments = data?.equipments || [];
        let engTotal = 0;
        let montTotal = 0;
        equipments.forEach(eq => {
            if (eq.type === 'SEU' || !eq.labor?.items) return;
            eq.labor.items.forEach(item => {
                const horas = item.hours || item.quantidade || 0;
                const taxa = item.hourlyRate || item.valorHora || 0;
                const group = item.group || item.grupo || '';
                if (group === 'Engenharia' || group === 'Engenharia de Aplicação' || group === 'Engenharia de Projetos') {
                    engTotal += horas * taxa;
                } else {
                    montTotal += horas * taxa;
                }
            });
        });
        return { engenharia: engTotal, montagem: montTotal, geral: engTotal + montTotal };
    },

    renderAgregado() {
        const data = store.getState().activeTechnicalProposal;
        const equipments = data?.equipments || [];
        const filtered = equipments.filter(eq => eq.type !== 'SEU' && eq.labor?.items?.length > 0);

        if (filtered.length === 0) {
            return `<div style="text-align: center; padding: 40px; color: var(--color-muted);">
                <i class="ph ph-warning" style="font-size: 40px; margin-bottom: 12px; display: block;"></i>
                <div>Nenhum equipamento com mão de obra estimada.</div>
                <div style="font-size: 12px; margin-top: 6px;">Use "Estimar M.O." nos equipamentos da Proposta Técnica ou edite manualmente na sub-aba "Mão de Obra" de cada equipamento.</div>
            </div>`;
        }

        return `
            <table class="w-full text-left" style="border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid var(--color-border);">
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase;">Equipamento</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase;">Tag</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase;">Itens</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase;">Total Horas</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(eq => {
                        const total = (eq.labor?.items || []).reduce((s, i) => s + (i.hours || i.quantidade || 0), 0);
                        return `<tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 12px; font-weight: 500;">${eq.tag || eq.equipamento || '—'}</td>
                            <td style="padding: 8px 12px; color: var(--color-muted);">${eq.tag || eq.id_equipamento || '—'}</td>
                            <td style="padding: 8px 12px;">${(eq.labor?.items || []).length}</td>
                            <td style="padding: 8px 12px; font-weight: 600;">${total.toFixed(2)}h</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px;">
                <h4 style="margin: 0 0 10px 0;">Detalhamento por Composição</h4>
                ${filtered.map(eq => {
                    const comp = eq._composicaoDetalhada || [];
                    return `<div style="margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid var(--color-border);">
                        <div style="font-weight: 600; margin-bottom: 6px;">${eq.tag || eq.equipamento || 'Equipamento'}</div>
                        ${comp.length > 0 ? `
                            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                                <thead><tr style="background: #f1f5f9;"><th style="padding: 4px 8px; text-align: left;">Composição</th><th style="padding: 4px 8px; text-align: left;">Qtd</th><th style="padding: 4px 8px; text-align: left;">Unidade</th></tr></thead>
                                <tbody>${comp.map(c => `<tr><td style="padding: 3px 8px;">${c.composicao_atividade || c.composicao_codigo || '—'}</td><td style="padding: 3px 8px;">${(c.quantidadeCalculada ?? c.quantidade ?? 0).toFixed(2)}</td><td style="padding: 3px 8px;">${c.unidade || 'h'}</td></tr>`).join('')}</tbody>
                            </table>
                        ` : `
                            <p style="margin: 0; color: var(--color-muted); font-size: 12px;">Detalhamento não disponível.</p>
                        `}
                    </div>`;
                }).join('')}
            </div>
        `;
    },

    async render() {
        const container = document.getElementById('view-mao-de-obra');
        if (!container) return;

        try {
            const data = store.getState().activeTechnicalProposal;
            const totais = this.calcularTotais(data);
            const fmt = (v) => (window.app?.formatCurrency || ((x) => `R$ ${x.toFixed(2)}`))(v);

            container.innerHTML = `
                <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                    <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                        <div>
                            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                                <i class="ph ph-hammer"></i> Mão de Obra (Consolidado por Equipamento)
                            </h2>
                            <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Visão consolidada das horas estimadas de cada equipamento da proposta. A edição manual é feita na sub-aba "Mão de Obra" de cada equipamento na Proposta Técnica.</div>
                        </div>
                    </div>

                    <div style="padding: 24px; overflow-y: auto; flex: 1;">
                        <div id="mao-de-obra-content">
                            ${this.renderAgregado()}
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 16px 24px; border-top: 2px solid var(--color-border);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                            <div class="stat-card" style="background: white; padding: 12px; border-radius: 6px; border: 1px solid var(--color-border);">
                                <div class="text-xs text-muted uppercase font-bold">Total Engenharia</div>
                                <div class="text-lg font-bold text-main">${fmt(totais.engenharia)}</div>
                            </div>
                            <div class="stat-card" style="background: white; padding: 12px; border-radius: 6px; border: 1px solid var(--color-border);">
                                <div class="text-xs text-muted uppercase font-bold">Total Montagem</div>
                                <div class="text-lg font-bold text-main">${fmt(totais.montagem)}</div>
                            </div>
                            <div class="stat-card" style="background: #0369a1; padding: 12px; border-radius: 6px; color: white;">
                                <div class="text-xs uppercase font-bold" style="opacity: 0.8;">Total Geral Mão de Obra</div>
                                <div class="text-xl font-bold">${fmt(totais.geral)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            console.log('[MaoDeObra] Renderização concluída.');

        } catch (err) {
            console.error('[MaoDeObra] Falha crítica na renderização:', err);
            container.innerHTML = `<div class="card" style="padding: 40px; text-align: center; border: 1px solid #fee2e2;">
                <i class="ph ph-warning-circle text-danger" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h3 class="text-danger">Erro ao carregar Mão de Obra</h3>
                <p class="text-muted">${err.message}</p>
                <button class="btn btn-secondary" onclick="location.reload()" style="margin-top: 16px;">Recarregar Sistema</button>
            </div>`;
        }
    }
};

window.maoDeObraModule = MaoDeObraModule;
MaoDeObraModule.init();
