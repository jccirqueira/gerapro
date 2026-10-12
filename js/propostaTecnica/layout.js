// layout.js (bloco 4/7) — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { store } from '../state.js';
import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from '../busbarCalculator.js';
import { deriveMaterials } from '../automacaoMateriais.js';
import { EMPRESA } from '../empresaConfig.js';
import { infraSubtotal, infraPrecoFinal } from '../infraPricing.js';
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './shared.js';

const app = window.app;
export const layout = {
    renderLayoutSuggester(eq) {
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) return this._renderAutomationLayout(eq);
        const validForms = ['Forma 1', 'Forma 2a', 'Forma 2b', 'Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'];
        const seg = eq.technical?.segregacao;
        if (!seg || !validForms.includes(seg)) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível</div>
                <div style="font-size:13px;margin-top:6px;">Selecione uma Forma de Segregação na Ficha Técnica.</div>
            </div>`;
        }

        const fabricante = eq.technical?.fabricante || 'Genérico';
        if (this._isForma34(seg) && !this._isForma34EstruturaModular(seg, fabricante)) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível para este fabricante</div>
                <div style="font-size:13px;margin-top:6px;">Para Formas <strong>3a, 3b, 4a, 4b</strong>, selecione <strong>KitFrame</strong> ou <strong>Eletropoll</strong> como Fabricante na Ficha Técnica.</div>
            </div>`;
        }

        const montagem = eq.technical?.montagem || 'Em Linha';
        const isBackToBack = montagem === 'Back to Back';

        const result = isBackToBack ? this.suggestLayout(eq, 'front') : this.suggestLayout(eq);

        if (!result.hasLoads) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Nenhuma carga vinculada a típicos</div>
                <div style="font-size:13px;margin-top:6px;">Associe cargas a típicos na aba Cargas para gerar o layout sugerido.</div>
            </div>`;
        }

        const { cabinets } = result;

        if (cabinets.length === 0) {
            const arvore = this._geraArvoreMateriais(eq);
            const bomHtml = this._renderBOMAlocacao(arvore, [], eq.technical?.montagem);
            const totalMateriais = Object.values(arvore).reduce((s, tip) => s + Object.keys(tip.materiais).length, 0);
            return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div class="ls-header">
                        <div>
                            <h4 class="ls-header-title">Layout Sugerido: ${eq.tag}</h4>
                            <div class="ls-header-subtitle">Distribuição física dos armários com base nas cargas × típicos × materiais</div>
                        </div>
                    </div>
                    <div class="ls-empty">
                        <i class="ph ph-frame-corners" style="font-size:48px;color:#94a3b8;opacity:0.3;margin-bottom:12px;"></i>
                        <div style="font-size:16px;font-weight:700;color:var(--color-text-muted);margin-bottom:16px;">Nenhum armário definido</div>
                        <button class="btn btn-primary" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:13px;padding:8px 20px;">
                            + Criar Armário
                        </button>
                        <div class="ls-empty-desc">
                            Para começar, vá até a <strong>Lista de Materiais</strong> abaixo, selecione uma carga e clique em <strong>"Alocar Carga"</strong> para posicionar todos os materiais nos armários criados.
                        </div>
                    </div>
                    ${this._lsRenderBom(bomHtml, totalMateriais, 'bom_body_empty')}
                </div>
            </div>`;
        }

        const arvore = this._geraArvoreMateriais(eq);
        const bomHtml = this._renderBOMAlocacao(arvore, cabinets, eq.technical?.montagem);
        const totalMateriais = Object.values(arvore).reduce((s, tip) => s + Object.keys(tip.materiais).length, 0);

        if (isBackToBack) {
            const resultRear = this.suggestLayout(eq, 'rear');
            const cabsRear = resultRear.cabinets;

            const canvasF = document.createElement('canvas');
            this._drawLayoutCanvas(canvasF, cabinets);
            const dataUrlF = canvasF.toDataURL('image/png');

            const canvasT = document.createElement('canvas');
            this._drawLayoutCanvas(canvasT, cabsRear);
            const dataUrlT = canvasT.toDataURL('image/png');

            const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
            const isEletropollFixo = seg && this._isForma34(seg) && eq.technical?.fabricante === 'Eletropoll' && eq.technical?.tipoGaveta === 'Fixo';
            const hasExternalViewB2B = isForma2 || seg === 'Forma 1' || isEletropollFixo;
            let dataUrlExtF = '', dataUrlExtR = '';
            if (hasExternalViewB2B) {
                const offFE = document.createElement('canvas');
                this._drawLayoutCanvasExternal(offFE, cabinets);
                dataUrlExtF = offFE.toDataURL('image/png');
                const offRE = document.createElement('canvas');
                this._drawLayoutCanvasExternal(offRE, cabsRear);
                dataUrlExtR = offRE.toDataURL('image/png');
            }

            const isForma2b2b = seg === 'Forma 2a' || seg === 'Forma 2b' || this._isForma34EstruturaModular(seg, eq.technical?.fabricante);

            return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div class="ls-header">
                        <div>
                            <h4 class="ls-header-title">Layout Sugerido: ${eq.tag}</h4>
                            <div class="ls-header-subtitle">Montagem <strong>Back to Back</strong> — Vistas Frontal e Traseira</div>
                        </div>
                        <div class="ls-header-actions">
                            <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._showLayoutConfigPanel()" style="gap:4px;">
                                <i class="ph ph-gear"></i> Configurar
                            </button>
                            ${this._isForma34EstruturaModular(seg, eq.technical?.fabricante) ? `
                            <button type="button" class="btn btn-sm btn-primary" onclick="window.propostaTecnicaModule._onCriarArranjoOtimizado()" style="gap:4px;background:#059669;border-color:#059669;">
                                <i class="ph ph-stars"></i> Criar Arranjo Otimizado
                            </button>` : ''}
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutPDF()" style="gap:4px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutDXF()" style="gap:4px;">
                                <i class="ph ph-file"></i> Exportar DXF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutQET()" style="gap:4px;">
                                <i class="ph ph-lightning"></i> Exportar QET
                            </button>
                            <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica._aplicarMateriaisChaparia()" style="gap:4px;background:#d97706;border-color:#d97706;">
                                <i class="ph ph-package"></i> Gerar Chaparia
                            </button>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--color-text-muted);cursor:pointer;user-select:none;">
                                <input type="checkbox" id="chk_auto_chaparia_b2b" onchange="window.propostaTecnicaModule._onChangeAutoChaparia(this.checked)" ${eq.autoChaparia !== false ? 'checked' : ''}> Auto Chaparia
                            </label>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--color-text-muted);cursor:pointer;user-select:none;">
                                <input type="checkbox" id="chk_side_view_b2b" onchange="window.propostaTecnicaModule._toggleSideView()" ${eq.layoutConfig?.showSideView ? 'checked' : ''}> Vista Lateral
                            </label>
                        </div>
                    </div>
                    ${this._lsRenderSummary(cabinets)}
                    ${this._lsRenderWarnings(cabinets)}
                    <div class="ls-views">
                        <div>
                            <h5 class="ls-section-title ls-section-title--front">▸ VISTA FRONTAL INTERNA</h5>
                            <div class="ls-canvas-box ls-canvas-box--front">
                                <img id="layout-canvas-front" src="${dataUrlF}" class="ls-canvas-img" alt="Vista Frontal">
                            </div>
                        </div>
                        ${hasExternalViewB2B ? `
                        <div>
                            <h5 class="ls-section-title ls-section-title--external">▸ VISTA FRONTAL EXTERNA</h5>
                            <div class="ls-canvas-box ls-canvas-box--external">
                                <img id="layout-canvas-external-front" src="${dataUrlExtF}" class="ls-canvas-img" alt="Vista Frontal Externa">
                            </div>
                        </div>
                        ` : ''}
                        <div>
                            <h5 class="ls-section-title ls-section-title--rear">▸ VISTA TRASEIRA INTERNA</h5>
                            <div class="ls-canvas-box ls-canvas-box--rear">
                                <img id="layout-canvas-rear" src="${dataUrlT}" class="ls-canvas-img" alt="Vista Traseira">
                            </div>
                        </div>
                        ${hasExternalViewB2B ? `
                        <div>
                            <h5 class="ls-section-title ls-section-title--external">▸ VISTA TRASEIRA EXTERNA</h5>
                            <div class="ls-canvas-box ls-canvas-box--external">
                                <img id="layout-canvas-external-rear" src="${dataUrlExtR}" class="ls-canvas-img" alt="Vista Traseira Externa">
                            </div>
                        </div>
                        ` : ''}
                        <div id="side-view-container-b2b" style="display:${eq.layoutConfig?.showSideView ? 'block' : 'none'};">
                            <div class="ls-side-header">
                                <h5 class="ls-section-title ls-section-title--side">▸ VISTA LATERAL (CORTE)</h5>
                                <select id="sel_side_view_cabinet_b2b" onchange="window.propostaTecnicaModule._onChangeSideViewCabinet()" class="ls-cab-select">
                                    <option value="-1" ${(eq.layoutConfig?.sideViewCabinetIndex ?? -1) === -1 ? 'selected' : ''}>Todos (Combinado)</option>
                                    ${cabinets.map((c, i) => `<option value="${i}" ${eq.layoutConfig?.sideViewCabinetIndex === i ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="ls-canvas-box ls-canvas-box--side">
                                <img id="layout-canvas-side-b2b" class="ls-canvas-img" alt="Vista Lateral Frontal">
                            </div>
                        </div>
                    </div>
                    ${this._lsRenderCabinetControls(cabinets, seg, eq, true)}
                    ${this._lsRenderBom(bomHtml, totalMateriais, 'bom_body')}
                </div>
            </div>`;
        }

        const offscreen = document.createElement('canvas');
        this._drawLayoutCanvas(offscreen, cabinets);
        const dataUrl = offscreen.toDataURL('image/png');

        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const isEletropollFixo = seg && this._isForma34(seg) && eq.technical?.fabricante === 'Eletropoll' && eq.technical?.tipoGaveta === 'Fixo';
        const hasExternalView = isForma2 || seg === 'Forma 1' || isEletropollFixo;
        let dataUrlExt = '';
        if (hasExternalView) {
            const offscreenExt = document.createElement('canvas');
            this._drawLayoutCanvasExternal(offscreenExt, cabinets);
            dataUrlExt = offscreenExt.toDataURL('image/png');
        }

        const externalViewHtml = hasExternalView ? `
                        <div style="margin-top:24px;">
                            <h5 class="ls-section-title ls-section-title--external">▸ VISTA FRONTAL EXTERNA</h5>
                            <div class="ls-canvas-box ls-canvas-box--external">
                                <img id="layout-canvas-external" src="${dataUrlExt}" class="ls-canvas-img" alt="Vista Frontal Externa">
                            </div>
                        </div>` : '';

        return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div class="ls-header">
                        <div>
                            <h4 class="ls-header-title">Layout Sugerido: ${eq.tag}</h4>
                            <div class="ls-header-subtitle">Distribuição física dos armários com base nas cargas × típicos × materiais</div>
                        </div>
                        <div class="ls-header-actions">
                            <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._showLayoutConfigPanel()" style="gap:4px;">
                                <i class="ph ph-gear"></i> Configurar
                            </button>
                            ${this._isForma34EstruturaModular(seg, eq.technical?.fabricante) ? `
                            <button type="button" class="btn btn-sm btn-primary" onclick="window.propostaTecnicaModule._onCriarArranjoOtimizado()" style="gap:4px;background:#059669;border-color:#059669;">
                                <i class="ph ph-stars"></i> Criar Arranjo Otimizado
                            </button>` : ''}
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutPDF()" style="gap:4px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutDXF()" style="gap:4px;">
                                <i class="ph ph-file"></i> Exportar DXF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutQET()" style="gap:4px;">
                                <i class="ph ph-lightning"></i> Exportar QET
                            </button>
                            <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica._aplicarMateriaisChaparia()" style="gap:4px;background:#d97706;border-color:#d97706;">
                                <i class="ph ph-package"></i> Gerar Chaparia
                            </button>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--color-text-muted);cursor:pointer;user-select:none;">
                                <input type="checkbox" id="chk_auto_chaparia" onchange="window.propostaTecnicaModule._onChangeAutoChaparia(this.checked)" ${eq.autoChaparia !== false ? 'checked' : ''}> Auto Chaparia
                            </label>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--color-text-muted);cursor:pointer;user-select:none;">
                                <input type="checkbox" id="chk_side_view" onchange="window.propostaTecnicaModule._toggleSideView()" ${eq.layoutConfig?.showSideView ? 'checked' : ''}> Vista Lateral
                            </label>
                        </div>
                    </div>
                    ${this._lsRenderSummary(cabinets)}
                    ${this._lsRenderWarnings(cabinets)}
                    <div class="ls-canvas-box">
                        <img id="layout-canvas" src="${dataUrl}" class="ls-canvas-img" alt="Layout Sugerido">
                        <div class="ls-canvas-label">LAYOUT ORIENTATIVO</div>
                    </div>
                    ${externalViewHtml}
                    <div id="side-view-container" style="display:${eq.layoutConfig?.showSideView ? 'block' : 'none'};margin-top:20px;">
                        <div class="ls-side-header">
                            <h5 class="ls-section-title ls-section-title--side">▸ VISTA LATERAL (CORTE)</h5>
                            <select id="sel_side_view_cabinet" onchange="window.propostaTecnicaModule._onChangeSideViewCabinet()" class="ls-cab-select">
                                <option value="-1" ${(eq.layoutConfig?.sideViewCabinetIndex ?? -1) === -1 ? 'selected' : ''}>Todos (Combinado)</option>
                                ${cabinets.map((c, i) => `<option value="${i}" ${eq.layoutConfig?.sideViewCabinetIndex === i ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="ls-canvas-box ls-canvas-box--side">
                            <img id="layout-canvas-side" class="ls-canvas-img" alt="Vista Lateral">
                        </div>
                    </div>
                    ${this._lsRenderCabinetControls(cabinets, seg, eq, false)}
                    ${this._lsRenderBom(bomHtml, totalMateriais, 'bom_body')}
                </div>
            </div>
        `;
    },

    _lsFormatGrouped(arr, prop, unit) {
        const counts = {};
        for (const c of arr) {
            const v = c[prop] || 600;
            counts[v] = (counts[v] || 0) + 1;
        }
        return Object.entries(counts)
            .sort(([a], [b]) => b - a)
            .map(([v, n]) => n > 1 ? `${n}×${v}${unit}` : `${v}${unit}`)
            .join(', ');
    },

    _lsRenderSummary(cabinets) {
        const fmt = (arr, prop, unit) => this._lsFormatGrouped(arr, prop, unit);
        return `
            <div class="ls-summary">
                <div class="ls-summary-card">
                    <div class="ls-summary-label">Armários</div>
                    <div class="ls-summary-value">${cabinets.length}</div>
                </div>
                <div class="ls-summary-card">
                    <div class="ls-summary-label">Larguras Instaladas</div>
                    <div class="ls-summary-value ls-summary-value--small ls-summary-value--green">${fmt(cabinets, 'width', 'mm')}</div>
                </div>
                <div class="ls-summary-card">
                    <div class="ls-summary-label">Altura Instalada</div>
                    <div class="ls-summary-value ls-summary-value--small">${fmt(cabinets, 'height', 'mm')}</div>
                </div>
                <div class="ls-summary-card">
                    <div class="ls-summary-label">Profundidade Instalada</div>
                    <div class="ls-summary-value ls-summary-value--small">${fmt(cabinets, 'depth', 'mm')}</div>
                </div>
            </div>`;
    },

    _lsRenderWarnings(cabinets) {
        const warnings = cabinets.filter(c => c.warning).map(c => `
            <div class="ls-warning"><strong>${c.name}:</strong> ${c.warning}</div>
        `).join('');

        const allExcess = cabinets.filter(c => c._excessLoads?.length > 0).flatMap(c => c._excessLoads);
        const excessDataAttr = allExcess.length > 0 ? encodeURIComponent(JSON.stringify(allExcess.map(l => ({ tag: l.tag, desc: l.desc || l.tag, power: l.power, current: l.current })))) : '';
        const excessWarning = allExcess.length > 0 ? `
            <div class="ls-excess">
                <strong>⚠️ Capacidade máxima atingida:</strong> ${allExcess.length} carga(s) não puderam ser alocadas.
                <button class="btn btn-xs btn-primary" data-excess='${excessDataAttr}' onclick="window.propostaTecnicaModule._showExcessLoadsDialog(JSON.parse(decodeURIComponent(this.dataset.excess)))" style="margin-left:8px;background:#dc2626;border-color:#dc2626;">Resolver</button>
            </div>` : '';

        return warnings + excessWarning;
    },

    _lsRenderCabinetControls(cabinets, seg, eq, isB2B) {
        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const isForma2b2b = isForma2 || this._isForma34EstruturaModular(seg, eq.technical?.fabricante);
        const baseCabs = isB2B
            ? Object.entries(eq.layoutConfig?.cabinetAssignments || {}).map(([id, d]) => ({ id, name: d.name, width: d.width || 600, height: d.height, depth: d.depth || 600 }))
            : cabinets;

        return `
            <div class="ls-cab-controls">
                ${baseCabs.map(bc => {
                    const cabId = isB2B ? bc.id : (bc._cabId || '');
                    const currentWidth = isB2B ? bc.width : (bc._userWidth || bc.width);
                    const cabH = isB2B ? bc.height || ((isForma2b2b) ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100) : bc.height;
                    const isForma2Cab = isB2B ? (isForma2 || this._isForma34EstruturaModular(seg, eq.technical?.fabricante)) : (bc.segregacao === 'Forma 2a' || bc.segregacao === 'Forma 2b' || this._isForma34EstruturaModular(bc.segregacao, bc._fabricante));
                    const gavetas = isB2B ? [] : (bc._gavetas || []);
                    const gavInfo = gavetas.length > 0 ? gavetas.length + ' gav. (' + gavetas.reduce((s, g) => s + g.height, 0) + '/1800mm)' : '';
                    return `<div class="ls-cab-item">
                        <span class="ls-cab-name">${bc.name}</span>
                        ${gavInfo ? `<span class="ls-cab-gaveta" title="${gavetas.map(g => g.cargaTag + ' (' + g.height + 'mm)').join(', ')}">${gavInfo}</span>` : ''}
                        <span class="ls-cab-sep">|</span>
                        <span class="ls-cab-label">Largura:</span>
                        <select class="ls-cab-select" onchange="window.propostaTecnicaModule._setLarguraArmario('${cabId}',this.value)" ${!cabId ? 'disabled' : ''}>
                            <option value="400" ${currentWidth === 400 ? 'selected' : ''}>400mm</option>
                            <option value="600" ${currentWidth === 600 ? 'selected' : ''}>600mm</option>
                            <option value="800" ${currentWidth === 800 ? 'selected' : ''}>800mm</option>
                            <option value="1000" ${currentWidth === 1000 ? 'selected' : ''}>1000mm</option>
                        </select>
                        ${!isForma2Cab ? `<span class="ls-cab-sep">|</span>
                        <span class="ls-cab-label">Altura:</span>
                        <select class="ls-cab-select" onchange="window.propostaTecnicaModule._setAlturaArmario('${cabId}',this.value)" ${!cabId ? 'disabled' : ''}>
                            <option value="1600" ${cabH === 1600 ? 'selected' : ''}>1600mm</option>
                            <option value="1800" ${cabH === 1800 ? 'selected' : ''}>1800mm</option>
                            <option value="2000" ${cabH === 2000 ? 'selected' : ''}>2000mm</option>
                            <option value="2300" ${(!cabH || cabH === 2300) ? 'selected' : ''}>2300mm</option>
                        </select>` : ''}
                        <span class="ls-cab-sep">|</span>
                        <span class="ls-cab-label">Profundidade:</span>
                        <select class="ls-cab-select" onchange="window.propostaTecnicaModule._setProfundidadeArmario('${cabId}',this.value)" ${!cabId ? 'disabled' : ''}>
                            <option value="400" ${(isB2B ? bc.depth : (bc.depth || 600)) === 400 ? 'selected' : ''}>400mm</option>
                            <option value="600" ${(isB2B ? bc.depth : (bc.depth || 600)) === 600 ? 'selected' : ''}>600mm</option>
                            <option value="800" ${(isB2B ? bc.depth : (bc.depth || 600)) === 800 ? 'selected' : ''}>800mm</option>
                            <option value="1000" ${(isB2B ? bc.depth : (bc.depth || 600)) === 1000 ? 'selected' : ''}>1000mm</option>
                            <option value="1200" ${(isB2B ? bc.depth : (bc.depth || 600)) === 1200 ? 'selected' : ''}>1200mm</option>
                        </select>
                        ${isB2B ? `<button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerArmario('${bc.id}')" style="color:#ef4444;font-size:11px;padding:2px 4px;" title="Remover armário">✕</button>`
                            : (cabId ? `<button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerArmario('${cabId}')" style="color:#ef4444;font-size:11px;padding:2px 4px;" title="Remover armário">✕</button>` : '')}
                    </div>`;
                }).join('')}
                <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:11px;padding:6px 10px;">+ Adicionar Armário</button>
            </div>`;
    },

    _lsRenderBom(bomHtml, totalMateriais, bomId) {
        return `
            <div class="ls-bom">
                <div class="ls-bom-header" onclick="const e=document.getElementById('${bomId}');const v=e.style.display;e.style.display=v==='none'?'':'none';this.querySelector('.bom-arrow').textContent=v==='none'?'▼':'▶'">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="bom-arrow" style="font-size:10px;">▶</span>
                        <strong style="font-size:14px;">Lista de Materiais (${totalMateriais} itens)</strong>
                    </div>
                    <span style="font-size:11px;color:var(--color-text-muted);">Aloque materiais aos armários</span>
                </div>
                <div id="${bomId}" class="ls-bom-body" style="display:none;">
                    ${bomHtml}
                </div>
            </div>`;
    },

    _renderLinhasTable(linhas, dflt) {
        return linhas.map((l, i) => {
            const yCentro = l.yCentroTrilho ?? Math.round(((l.yInicio || 0) + (l.yFim || 0)) / 2);
            return `<tr draggable="true" data-linha-idx="${i}" style="cursor:grab;">
                <td style="display:none;"><input type="hidden" class="lcfg_id" value="${l.id || ''}"></td>
                <td style="text-align:center;color:#94a3b8;font-size:12px;cursor:grab;user-select:none;" title="Arrastar para reordenar">⠿</td>
                <td><input type="text" class="form-control lcfg_nome" value="${l.nome}" style="width:120px;font-size:12px;"></td>
                <td><input type="number" class="form-control lcfg_yCentro" value="${yCentro}" style="width:70px;font-size:12px;"></td>
                <td style="text-align:center;"><input type="checkbox" class="lcfg_trilho" ${l.temTrilho !== false ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;"></td>
                <td><input type="text" class="form-control lcfg_cats" value="${l.categorias.join(', ')}" style="width:160px;font-size:12px;" placeholder="DISJUNTOR, CONTATOR..."></td>
                <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
            </tr>`;
        }).join('');
    },

    _renderGapsGrid(lc, dflt) {
        const gapsCombo = { ...dflt.gapsTermicos, ...(lc.gapsTermicos || {}) };
        return Object.entries(gapsCombo).map(([cat, gap]) => `
            <div class="form-group" style="margin:0;">
                <label class="form-label" style="font-size:10px;white-space:nowrap;">${cat}</label>
                <input type="number" class="form-control cab-gap" data-gap-cat="${cat}" value="${gap}" style="width:100%;font-size:12px;" min="0" step="1">
            </div>
        `).join('');
    },

    _renderCanaletasList(canaletas, blockCabId) {
        if (canaletas.length === 0) {
            return '<div style="font-size:11px;color:#94a3b8;padding:4px 0;">Nenhuma canaleta adicional.</div>';
        }
        return canaletas.map(can => {
            const detalhe = can.tipo === 'quadro'
                ? `${can.modelo}, ${can.larguraQuadro}x${can.alturaQuadro}mm`
                : `${can.modelo}, ${can.orientacao === 'V' ? 'Vertical' : 'Horizontal'}, ${can.comprimento}mm`;
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;background:#f8fafc;border-radius:4px;margin-bottom:2px;font-size:11px;">
                <span>${can.tipo === 'quadro' ? '📐' : '📏'} ${detalhe}</span>
                <div>
                    <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._editarCanaleta('${can.id}','${blockCabId}')" style="color:#3b82f6;font-size:10px;">✏️</button>
                    <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._removerCanaleta('${can.id}','${blockCabId}')" style="color:#ef4444;font-size:10px;">✕</button>
                </div>
            </div>`;
        }).join('');
    },

    _renderDoorLinhasTable(doorLinhas, dflt) {
        return (doorLinhas || dflt.doorLinhas).map((l, i) => {
            const yCentro = l.yCentro ?? l.yCentroTrilho ?? 200;
            return `<tr>
                <td style="display:none;"><input type="hidden" class="dlcfg_id" value="${l.id || ''}"></td>
                <td><input type="text" class="form-control dlcfg_nome" value="${l.nome}" style="width:140px;font-size:12px;"></td>
                <td><input type="number" class="form-control dlcfg_yCentro" value="${yCentro}" style="width:70px;font-size:12px;"></td>
                <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
            </tr>`;
        }).join('');
    },

    _renderLinhaPreview(linhas, cabHeight) {
        const h = cabHeight || 2300;
        const stripW = 30;
        const stripH = 200;
        const scale = stripH / h;
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
        let svg = `<svg width="${stripW}" height="${stripH}" style="display:block;">`;
        svg += `<rect x="0" y="0" width="${stripW}" height="${stripH}" fill="#f8fafc" stroke="#e2e8f0" rx="2"/>`;
        for (let i = 0; i < linhas.length; i++) {
            const l = linhas[i];
            const yc = l.yCentroTrilho ?? 500;
            const bandH = Math.max(30, 80) * scale;
            const bandY = (yc * scale) - bandH / 2;
            const color = colors[i % colors.length];
            svg += `<rect x="1" y="${Math.max(0, bandY)}" width="${stripW - 2}" height="${Math.min(bandH, stripH - Math.max(0, bandY))}" fill="${color}" opacity="0.3" rx="1"/>`;
            svg += `<line x1="0" y1="${yc * scale}" x2="${stripW}" y2="${yc * scale}" stroke="${color}" stroke-width="1.5"/>`;
            svg += `<text x="${stripW / 2}" y="${Math.max(8, Math.min(yc * scale + 3, stripH - 2))}" text-anchor="middle" font-size="7" fill="${color}" font-weight="bold">${i + 1}</text>`;
        }
        svg += '</svg>';
        return svg;
    },

    _detectLinhaCollisions(linhas) {
        const warnings = [];
        for (let i = 0; i < linhas.length; i++) {
            for (let j = i + 1; j < linhas.length; j++) {
                const a = linhas[i], b = linhas[j];
                const ya = a.yCentroTrilho ?? 500;
                const yb = b.yCentroTrilho ?? 500;
                const dist = Math.abs(ya - yb);
                if (dist < 120) {
                    warnings.push({ linhas: [a, b], dist, msg: `"${a.nome}" e "${b.nome}" estão muito próximas (${dist}mm). Materiais grandes podem se sobrepor.` });
                }
            }
        }
        return warnings;
    },

    _detectMaterialCollisions(rows) {
        const MIN_OVERLAP = 10;
        const collisions = [];
        for (let i = 0; i < rows.length; i++) {
            for (let j = i + 1; j < rows.length; j++) {
                const rA = rows[i], rB = rows[j];
                for (const itemA of rA.items || []) {
                    for (const itemB of rB.items || []) {
                        const topA = itemA.y, botA = itemA.y + itemA.h;
                        const topB = itemB.y, botB = itemB.y + itemB.h;
                        const vOverlap = Math.min(botA, botB) - Math.max(topA, topB);
                        if (vOverlap < MIN_OVERLAP) continue;
                        const leftA = itemA.x, rightA = itemA.x + itemA.w;
                        const leftB = itemB.x, rightB = itemB.x + itemB.w;
                        const hOverlap = Math.min(rightA, rightB) - Math.max(leftA, leftB);
                        if (hOverlap >= MIN_OVERLAP) {
                            collisions.push({ itemA, itemB, linhaA: rA.linha?.nome || '?', linhaB: rB.linha?.nome || '?' });
                        }
                    }
                }
            }
        }
        return collisions;
    },

    _detectZCollisions(items) {
        const MIN_OVERLAP = 5;
        const collisions = [];
        const sorted = [...items].sort((a, b) => (a.z || 0) - (b.z || 0));
        for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
                const a = sorted[i], b = sorted[j];
                const zA = a.z || 0, zB = b.z || 0;
                const dA = a.d || 20, dB = b.d || 20;
                const endA = zA + dA, endB = zB + dB;
                const zOverlap = Math.min(endA, endB) - Math.max(zA, zB);
                if (zOverlap < MIN_OVERLAP) {
                    if (zB >= endA) break;
                    continue;
                }
                const topA = a.y || 0, botA = (a.y || 0) + (a.h || 40);
                const topB = b.y || 0, botB = (b.y || 0) + (b.h || 40);
                const vOverlap = Math.min(botA, botB) - Math.max(topA, topB);
                if (vOverlap >= MIN_OVERLAP) {
                    collisions.push({ itemA: a, itemB: b });
                }
            }
        }
        return collisions;
    },

    _showLayoutConfigPanel() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const existing = document.getElementById('_layout_config_overlay');
        if (existing) existing.remove();

        const ass = eq.layoutConfig?.cabinetAssignments;
        const montagem = eq.technical?.montagem || 'Em Linha';
        const isB2B = montagem === 'Back to Back';
        let cabinetsHtml = '';

        if (!ass || Object.keys(ass).length === 0) {
            cabinetsHtml = '<div style="font-size:11px;color:#94a3b8;padding:20px 0;text-align:center;">Nenhum armário definido. Use "+ Adicionar" ou "Auto" para criar.</div>';
        } else {
            const dflt = this._getDefaultLayoutConfig();
            cabinetsHtml = Object.entries(ass).flatMap(([cabId, cab]) => {
                const facesToRender = isB2B
                    ? [{ face: 'front', suffix: 'F', label: 'Frontal' }, { face: 'rear', suffix: 'T', label: 'Traseira' }]
                    : [{ face: null, suffix: '', label: '' }];
                return facesToRender.map(({ face, suffix, label }) => {
                    const blockCabId = face ? cabId + '|' + face : cabId;
                    const lc = face
                        ? (cab.faces?.[face]?.layoutConfig || cab.layoutConfig || dflt)
                        : (cab.layoutConfig || dflt);
                    const qtdMats = face
                        ? Object.keys(this._getLoadsAsFlat(cab.faces?.[face])).length
                        : Object.keys(this._getLoadsAsFlat(cab)).length + Object.values(cab.faces || {}).reduce((s, f) => s + Object.keys(this._getLoadsAsFlat(f)).length, 0);
                    const largura = cab.width || 'auto';
                    const blockName = face ? cab.name + suffix : cab.name;

                // Linhas table
                const linhasHtml = this._renderLinhasTable(lc.linhas || dflt.linhas, dflt);

                // Gaps grid
                const gapsHtml = this._renderGapsGrid(lc, dflt);

                // Canaletas list
                const canaletas = lc.canaletas || [];
                const canaletasHtml = this._renderCanaletasList(canaletas, blockCabId);

                const isKF = this._isForma34EstruturaModular(eq.technical?.segregacao || '', eq.technical?.fabricante);
                const isEletropoll = eq.technical?.fabricante === 'Eletropoll';
                const gavList = (cab.loads ? Object.keys(cab.loads) : []);
                const ccwCab = cab.layoutConfig?.colunaCabosWidth || (isEletropoll ? 400 : 200);
                const temExaustor = cab.layoutConfig?.exaustor !== false;
                const gavetaWidthCab = isEletropoll ? (cab.width - 400) : 600;
                return `<div class="cab-config-block" data-cab-id="${blockCabId}" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;overflow:hidden;">
                    <div class="cab-config-header" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#f8fafc;cursor:pointer;user-select:none;"
                        onclick="const b=this.nextElementSibling;if(b){const d=b.style.display;b.style.display=d==='none'?'':'none';this.querySelector('.cab-arrow').textContent=b.style.display==='none'?'▶':'▼'}">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;">
                            <span class="cab-arrow" style="font-size:10px;color:#94a3b8;">▶</span>
                            <input type="text" value="${blockName}" data-cab-name="${blockCabId}"
                                style="font-size:12px;padding:2px 6px;border:1px solid #cbd5e1;border-radius:4px;width:130px;font-weight:600;"
                                onchange="window.propostaTecnicaModule._setNomeArmario('${blockCabId}',this.value)" onclick="event.stopPropagation();">
                            <span style="color:#64748b;font-size:11px;">${label ? label + ' — ' : ''}${qtdMats} materiais${gavList.length > 0 ? ' — ' + gavList.length + ' gavetas' : ''}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            ${isKF ? (isEletropoll ? `
                            <span style="font-size:11px;color:#64748b;font-weight:600;">${gavetaWidthCab}mm + 400mm</span>` : `
                            <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;font-weight:600;" onchange="window.propostaTecnicaModule._onChangeCcwArmario('${blockCabId}',this.value)" onclick="event.stopPropagation();">
                                <option value="200" ${ccwCab === 200 ? 'selected' : ''}>200mm</option>
                                <option value="300" ${ccwCab === 300 ? 'selected' : ''}>300mm</option>
                                <option value="400" ${ccwCab === 400 ? 'selected' : ''}>400mm</option>
                            </select>`) : `
                            <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                onchange="window.propostaTecnicaModule._setLarguraArmario('${blockCabId}',this.value)" onclick="event.stopPropagation();">
                                <option value="400" ${largura == 400 ? 'selected' : ''}>400mm</option>
                                <option value="600" ${largura == 600 || largura === 'auto' ? 'selected' : ''}>600mm</option>
                                <option value="800" ${largura == 800 ? 'selected' : ''}>800mm</option>
                                <option value="1000" ${largura == 1000 ? 'selected' : ''}>1000mm</option>
                            </select>`}
                            <button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();this.closest('.cab-config-block').remove()" style="color:#ef4444;font-size:11px;">✕</button>
                        </div>
                    </div>
                    <div class="cab-config-body" style="display:none;padding:10px 12px;border-top:1px solid #e2e8f0;background:#fff;">
                        ${isKF ? `
                        <div style="font-size:12px;color:#64748b;padding:8px 0;">
                            <strong>Gavetas (${gavList.length})</strong>
                            <div style="margin-top:4px;max-height:200px;overflow-y:auto;">
                                ${gavList.map(tag => `<div style="padding:2px 4px;font-size:11px;border-bottom:1px solid #f1f5f9;">${tag}</div>`).join('')}
                            </div>
                            <div style="margin-top:8px;font-size:11px;color:#94a3b8;">${isEletropoll ? 'Eletropoll' : 'KitFrame'} — ${gavetaWidthCab}mm (gavetas) + ${isEletropoll ? 400 : ccwCab}mm (coluna cabos) = ${largura}mm × 2300mm</div>
                            ${isEletropoll ? `
                            <div style="margin-top:8px;display:flex;gap:12px;align-items:center;">
                                <label style="font-size:11px;color:#64748b;font-weight:600;">
                                    <input type="checkbox" ${temExaustor ? 'checked' : ''} onchange="window.propostaTecnicaModule._onChangeExaustorArmario('${blockCabId}',this.checked)" onclick="event.stopPropagation();">
                                    Exaustor
                                </label>
                                <label style="font-size:11px;color:#64748b;font-weight:600;">Profundidade:</label>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._onChangeProfundidadeArmario('${blockCabId}',this.value)" onclick="event.stopPropagation();">
                                    <option value="600" ${(cab.depth || 600) == 600 ? 'selected' : ''}>600mm</option>
                                    <option value="800" ${(cab.depth || 600) == 800 ? 'selected' : ''}>800mm</option>
                                    ${eq.technical?.montagem === 'Back to Back' ? `
                                    <option value="1000" ${(cab.depth || 600) == 1000 ? 'selected' : ''}>1000mm</option>
                                    <option value="1200" ${(cab.depth || 600) == 1200 ? 'selected' : ''}>1200mm</option>` : ''}
                                </select>
                            </div>` : ''}
                            <div style="margin-top:8px;">
                                <label style="font-size:11px;color:#64748b;font-weight:600;">Modo:</label>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._onChangeGavetaMode('${blockCabId}',this.value)">
                                    <option value="sequential" ${(cab.layoutConfig?.gavetaMode || 'sequential') === 'sequential' ? 'selected' : ''}>Automática (Sequencial)</option>
                                    <option value="otimizada" ${cab.layoutConfig?.gavetaMode === 'otimizada' ? 'selected' : ''}>Automática (Otimizada)</option>
                                    <option value="manual" ${cab.layoutConfig?.gavetaMode === 'manual' ? 'selected' : ''}>Manual</option>
                                </select>
                            </div>
                        </div>
                        ` : `
                        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px;">
                            <div><label style="font-size:10px;">Margem Esq.</label><input type="number" class="form-control cab-dim" data-field="canaletaEsq" value="${lc.canaletaEsq ?? 0}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Margem Dir.</label><input type="number" class="form-control cab-dim" data-field="canaletaDir" value="${lc.canaletaDir ?? 0}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Trilho DIN</label><input type="number" class="form-control cab-dim" data-field="larguraTrilhoDIN" value="${lc.larguraTrilhoDIN ?? 35}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Espaçamento</label><input type="number" class="form-control cab-dim" data-field="espacamentoLinhas" value="${lc.espacamentoLinhas ?? 10}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Comp. Trilho</label><input type="number" class="form-control cab-dim" data-field="comprimentoTrilho" value="${lc.comprimentoTrilho ?? 0}" style="width:100%;font-size:11px;height:26px;"></div>
                        </div>

                        <div style="margin-bottom:6px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:13px;">Linhas / Faixas</strong>
                                <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarLinhaLayout('${blockCabId}')" style="font-size:11px;">+ Adicionar Linha</button>
                            </div>
                        </div>
                        <div style="display:flex;gap:10px;align-items:flex-start;">
                            <div style="flex-shrink:0;padding-top:28px;" title="Preview das posições verticais">
                                ${this._renderLinhaPreview(lc.linhas || dflt.linhas, cab.height || 2300)}
                            </div>
                            <div style="flex:1;min-width:0;">
                                <table class="table" style="width:100%;">
                                    <thead><tr><th style="width:20px;"></th><th style="font-size:10px;">Nome</th><th style="font-size:10px;">Y Centro</th><th style="font-size:10px;">Trilho</th><th style="font-size:10px;">Categorias</th><th style="width:24px;"></th></tr></thead>
                                    <tbody class="cab-linhas-tbody" data-cab-id="${blockCabId}">${linhasHtml}</tbody>
                                </table>
                            </div>
                        </div>
                        ${(() => {
                            const linhaWarns = this._detectLinhaCollisions(lc.linhas || dflt.linhas);
                            if (linhaWarns.length === 0) return '';
                            return `<div style="margin-top:6px;padding:6px 8px;background:#fef3c7;border:1px solid #fbbf24;border-radius:4px;font-size:11px;color:#92400e;">
                                ${linhaWarns.map(w => `<div>⚠️ ${w.msg}</div>`).join('')}
                            </div>`;
                        })()}

                        <div style="margin-top:12px;">
                            <strong style="font-size:13px;">Gaps Térmicos</strong>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:4px;">${gapsHtml}</div>
                        </div>

                        <div style="margin-top:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:13px;">Canaletas</strong>
                                <div style="display:flex;gap:4px;">
                                    <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarQuadroCanaleta('${blockCabId}');event.stopPropagation();" style="font-size:10px;">+ Quadro</button>
                                    <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarPecaRetaCanaleta('${blockCabId}');event.stopPropagation();" style="font-size:10px;">+ Peça Reta</button>
                                </div>
                            </div>
                            <div class="cab-canaletas-list" style="margin-top:4px;">${canaletasHtml}</div>
                        </div>

                        <div style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:13px;">Linhas da Porta (Vista Externa)</strong>
                                <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarLinhaPortaLayout('${blockCabId}')" style="font-size:11px;">+ Adicionar Faixa</button>
                            </div>
                            <div style="font-size:10px;color:#94a3b8;margin-bottom:6px;">Largura útil da porta: ${cab.width || 800}mm - 10mm = ${(cab.width || 800) - 10}mm</div>
                            <table class="table" style="width:100%;">
                                <thead><tr><th style="font-size:10px;">Nome</th><th style="font-size:10px;">Y Centro</th><th style="width:24px;"></th></tr></thead>
                                <tbody class="cab-door-linhas-tbody">
                                    ${this._renderDoorLinhasTable(lc.doorLinhas, dflt)}
                                </tbody>
                            </table>
                        </div>
                        `}
                    </div>
                </div>`;
            });
        }).join('');
    }

        const overlay = document.createElement('div');
        overlay.id = '_layout_config_overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:12px;padding:20px;max-width:900px;width:90%;max-height:92vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3 style="margin:0;">Configuração do Layout</h3>
                    <button class="btn btn-ghost" onclick="this.closest('#_layout_config_overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:8px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
                    <label style="font-size:12px;font-weight:600;color:#0369a1;white-space:nowrap;">📋 Template:</label>
                    <select id="layout-template-select" style="flex:1;font-size:12px;padding:4px 8px;border:1px solid #bae6fd;border-radius:4px;background:#fff;"
                        onchange="if(this.value)window.propostaTecnicaModule._applyLayoutTemplate(this.value);this.value='';">
                        <option value="">Selecione um template...</option>
                        <optgroup label="Pré-definidos">
                            ${this._getLayoutTemplates().filter(t => !t._isCustom).map(t => {
                                const active = eq.layoutConfig?._activeTemplateId === t.id;
                                return `<option value="${t.id}" ${active ? 'selected' : ''}>${active ? '✓ ' : ''}${t.nome} — ${t.desc}</option>`;
                            }).join('')}
                        </optgroup>
                        ${(store.getState?.().layoutTemplates || []).filter(t => t._isCustom).length > 0 ? `
                        <optgroup label="Personalizados">
                            ${this._getLayoutTemplates().filter(t => t._isCustom).map(t => {
                                const active = eq.layoutConfig?._activeTemplateId === t.id;
                                return `<option value="${t.id}" ${active ? 'selected' : ''}>${active ? '✓ ' : ''}${t.nome} — ${t.desc}</option>`;
                            }).join('')}
                        </optgroup>` : ''}
                    </select>
                    <button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._saveLayoutTemplate()" style="font-size:10px;color:#059669;white-space:nowrap;" title="Salvar configuração atual como template">💾 Salvar</button>
                    ${eq.layoutConfig?._activeTemplateId ? (() => {
                        const tmpl = this._getLayoutTemplates().find(t => t.id === eq.layoutConfig._activeTemplateId);
                        if (!tmpl) return '';
                        return `<span style="font-size:11px;color:#059669;background:#d1fae5;padding:2px 8px;border-radius:10px;white-space:nowrap;">✓ ${tmpl.nome}</span>
                            ${tmpl._isCustom ? `<button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._deleteLayoutTemplate('${tmpl.id}')" style="font-size:10px;color:#ef4444;" title="Excluir template">🗑️</button>` : ''}`;
                    })() : ''}
                </div>
                ${(() => {
                    const rules = eq.layoutConfig?.componentRules || [];
                    if (rules.length === 0) return '';
                    const materiais = window.store?.getState?.().materiais || [];
                    return `<div style="margin-bottom:14px;padding:10px 12px;background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <strong style="font-size:12px;">Regras de Posicionamento (${rules.length})</strong>
                            <button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._addComponentRule()" style="font-size:10px;">+ Adicionar Regra</button>
                        </div>
                        <div style="max-height:200px;overflow-y:auto;">
                            ${rules.map((r, i) => {
                                const matchLabel = r.match === 'category' ? `Categoria: ${r.value}` : r.match === 'materialId' ? `Material: ${(materiais.find(m=>m.id===r.value)?.descricao||r.value).slice(0,20)}` : `Padrão: ${r.value}`;
                                const linhaLabel = (eq.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas)?.find(l=>l.id===r.linhaId)?.nome || r.linhaId || '?';
                                return `<div style="display:flex;align-items:center;gap:6px;padding:3px 4px;font-size:11px;border-bottom:1px solid #f1f5f9;">
                                    <span style="color:#64748b;min-width:130px;">${matchLabel}</span>
                                    <span style="color:#94a3b8;">→</span>
                                    <span style="color:#1e293b;font-weight:500;">${linhaLabel}</span>
                                    ${r.xOffset != null ? `<span style="color:#3b82f6;">X:${r.xOffset}</span>` : ''}
                                    ${r.zOffset != null ? `<span style="color:#8b5cf6;">Z:${r.zOffset}</span>` : ''}
                                    ${r.porta ? '<span style="color:#f59e0b;">Porta</span>' : ''}
                                    <button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removeComponentRule(${i})" style="color:#ef4444;font-size:10px;margin-left:auto;">✕</button>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                })()}
                ${cabinetsHtml}
                <div style="display:flex;gap:6px;margin-top:12px;">
                    <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:11px;">+ Adicionar Armário</button>
                    <button class="btn btn-sm btn-ghost" onclick="if(confirm('Remover todas as alocações e voltar ao agrupamento automático?'))window.propostaTecnicaModule._resetarAlocacoes()" style="font-size:11px;">Auto</button>
                </div>
                ${(() => {
                    const allLoads = eq.loads || [];
                    const assignedTags = new Set();
                    for (const cab of Object.values(ass || {})) {
                        if (cab.loads) Object.keys(cab.loads).forEach(t => assignedTags.add(t));
                        if (cab.faces) {
                            for (const f of Object.values(cab.faces)) {
                                if (f.loads) Object.keys(f.loads).forEach(t => assignedTags.add(t));
                            }
                        }
                    }
                    const unallocated = allLoads.filter(l => l.tag && !assignedTags.has(l.tag));
                    if (unallocated.length === 0) return '';
                    return `
                    <div style="border:2px dashed #ef4444;border-radius:8px;padding:12px;margin-top:12px;">
                        <strong style="color:#ef4444;font-size:13px;">⚠️ Cargas não alocadas (${unallocated.length})</strong>
                        <div style="margin-top:6px;font-size:11px;color:#64748b;max-height:150px;overflow-y:auto;">
                            ${unallocated.map(l => `
                            <div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #f1f5f9;">
                                <span>• ${l.tag} - ${l.desc || l.tag} (${this._getDrawerHeight(l, eq.technical?.fabricante, eq.technical?.tipoGaveta || 'Fixo')}mm)</span>
                                <button class="btn btn-xs btn-ghost" style="color:#059669;font-size:10px;margin-left:auto;" onclick="window.propostaTecnicaModule._adicionarArmario()">+ Novo Armário</button>
                            </div>`).join('')}
                        </div>
                    </div>`;
                })()}
                <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e2e8f0;padding-top:14px;margin-top:14px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_layout_config_overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._saveLayoutConfig()">Aplicar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        // Setup drag-and-drop for linhas tables
        overlay.querySelectorAll('.cab-linhas-tbody').forEach(tbody => {
            let dragRow = null;
            tbody.addEventListener('dragstart', e => {
                dragRow = e.target.closest('tr');
                if (dragRow) { dragRow.style.opacity = '0.4'; e.dataTransfer.effectAllowed = 'move'; }
            });
            tbody.addEventListener('dragend', e => {
                if (dragRow) dragRow.style.opacity = '';
                tbody.querySelectorAll('tr').forEach(r => r.style.borderTop = '');
                dragRow = null;
            });
            tbody.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const target = e.target.closest('tr');
                if (target && target !== dragRow) {
                    tbody.querySelectorAll('tr').forEach(r => r.style.borderTop = '');
                    target.style.borderTop = '2px solid #3b82f6';
                }
            });
            tbody.addEventListener('drop', e => {
                e.preventDefault();
                const target = e.target.closest('tr');
                if (target && dragRow && target !== dragRow) {
                    const rows = [...tbody.querySelectorAll('tr')];
                    const dragIdx = rows.indexOf(dragRow);
                    const targetIdx = rows.indexOf(target);
                    if (dragIdx < targetIdx) {
                        tbody.insertBefore(dragRow, target.nextSibling);
                    } else {
                        tbody.insertBefore(dragRow, target);
                    }
                }
                tbody.querySelectorAll('tr').forEach(r => r.style.borderTop = '');
            });
        });

        // Setup live collision warnings for linhas Y Centro changes
        overlay.querySelectorAll('.cab-linhas-tbody').forEach(tbody => {
            const checkCollisions = () => {
                const existing = tbody.parentElement.parentElement.querySelector('.linha-collision-warnings');
                if (existing) existing.remove();
                const rows = tbody.querySelectorAll('tr');
                const linhas = [];
                rows.forEach(row => {
                    const nome = row.querySelector('.lcfg_nome')?.value || '';
                    const yc = parseInt(row.querySelector('.lcfg_yCentro')?.value) || 500;
                    linhas.push({ nome, yCentroTrilho: yc });
                });
                const warns = this._detectLinhaCollisions(linhas);
                if (warns.length > 0) {
                    const div = document.createElement('div');
                    div.className = 'linha-collision-warnings';
                    div.style.cssText = 'margin-top:6px;padding:6px 8px;background:#fef3c7;border:1px solid #fbbf24;border-radius:4px;font-size:11px;color:#92400e;';
                    div.innerHTML = warns.map(w => `<div>⚠️ ${w.msg}</div>`).join('');
                    tbody.parentElement.parentElement.appendChild(div);
                }
            };
            tbody.addEventListener('change', checkCollisions);
        });
    },

    _saveLayoutConfig() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const overlay = document.getElementById('_layout_config_overlay');
        if (!overlay) return;

        // Validate linha collisions before saving
        let hasCollisions = false;
        overlay.querySelectorAll('.cab-linhas-tbody').forEach(tbody => {
            const rows = tbody.querySelectorAll('tr');
            const linhas = [];
            rows.forEach(row => {
                const nome = row.querySelector('.lcfg_nome')?.value || '';
                const yc = parseInt(row.querySelector('.lcfg_yCentro')?.value) || 500;
                linhas.push({ nome, yCentroTrilho: yc });
            });
            if (this._detectLinhaCollisions(linhas).length > 0) hasCollisions = true;
        });
        if (hasCollisions && !confirm('Existem linhas muito próximas que podem causar sobreposição de materiais.\n\nDeseja salvar mesmo assim?')) return;

        const dflt = this._getDefaultLayoutConfig();
        if (!eq.layoutConfig) eq.layoutConfig = {};
        if (!eq.layoutConfig.cabinetAssignments) eq.layoutConfig.cabinetAssignments = {};

        const cabBlocks = overlay.querySelectorAll('.cab-config-block');
        cabBlocks.forEach(block => {
            const rawCabId = block.dataset.cabId;
            if (!rawCabId) return;
            const parts = rawCabId.split('|');
            const cabId = parts[0];
            const face = parts[1] || null;
            let cab = eq.layoutConfig.cabinetAssignments[cabId];
            if (!cab) {
                cab = { name: cabId, width: 600 };
                eq.layoutConfig.cabinetAssignments[cabId] = cab;
            }
            // Ensure faces exist for B2B
            if (!cab.faces) cab.faces = { front: { loads: {}, layoutConfig: null }, rear: { loads: {}, layoutConfig: null } };

            // Read dimensions
            const dims = {};
            block.querySelectorAll('.cab-dim').forEach(inp => {
                dims[inp.dataset.field] = parseInt(inp.value) || 0;
            });

            // Read linhas
            const linhas = [];
            block.querySelectorAll('.cab-linhas-tbody tr').forEach(row => {
                const nome = row.querySelector('.lcfg_nome')?.value?.trim();
                const yCentroTrilho = parseInt(row.querySelector('.lcfg_yCentro')?.value) || 500;
                const temTrilho = row.querySelector('.lcfg_trilho')?.checked ?? true;
                const catsStr = row.querySelector('.lcfg_cats')?.value || '';
                const categorias = catsStr.split(',').map(s => s.trim()).filter(Boolean);
                if (nome) {
                    const origId = row.querySelector('.lcfg_id')?.value;
                    linhas.push({ id: origId || 'linha_' + Date.now() + '_' + linhas.length, nome, yCentroTrilho, categorias, temTrilho });
                }
            });

            // Read gaps
            const gapsTermicos = {};
            block.querySelectorAll('.cab-gap').forEach(inp => {
                const raw = inp.value.trim();
                const val = raw === '' ? null : parseFloat(raw);
                gapsTermicos[inp.dataset.gapCat] = val !== null && !isNaN(val) ? val : 5;
            });

            // Read door linhas
            const doorLinhas = [];
            block.querySelectorAll('.cab-door-linhas-tbody tr').forEach(row => {
                const nome = row.querySelector('.dlcfg_nome')?.value?.trim();
                const yCentro = parseInt(row.querySelector('.dlcfg_yCentro')?.value) || 200;
                if (nome) {
                    const origId = row.querySelector('.dlcfg_id')?.value;
                    doorLinhas.push({ id: origId || 'door_linha_' + Date.now() + '_' + doorLinhas.length, nome, yCentro });
                }
            });

            // Keep existing config, merge form values into it (preserving canaletas, etc.)
            const targetCfg = face ? (cab.faces?.[face]?.layoutConfig) : cab.layoutConfig;
            const existingCfg = targetCfg || {};
            if (!targetCfg) {
                const newCfg = {
                    canaletaEsq: dims.canaletaEsq ?? 0,
                    canaletaDir: dims.canaletaDir ?? 0,
                    larguraTrilhoDIN: dims.larguraTrilhoDIN ?? 35,
                    espacamentoLinhas: dims.espacamentoLinhas ?? 10,
                    comprimentoTrilho: dims.comprimentoTrilho ?? 0,
                    linhas,
                    gapsTermicos,
                    doorLinhas,
                    canaletas: existingCfg.canaletas || [],
                    retalhosCanaleta: existingCfg.retalhosCanaleta || []
                };
                if (face && cab.faces?.[face]) {
                    cab.faces[face].layoutConfig = newCfg;
                } else {
                    cab.layoutConfig = newCfg;
                }
            } else {
                Object.assign(targetCfg, {
                    canaletaEsq: dims.canaletaEsq ?? 0,
                    canaletaDir: dims.canaletaDir ?? 0,
                    larguraTrilhoDIN: dims.larguraTrilhoDIN ?? 35,
                    espacamentoLinhas: dims.espacamentoLinhas ?? 10,
                    comprimentoTrilho: dims.comprimentoTrilho ?? 0,
                    linhas,
                    gapsTermicos,
                    doorLinhas
                });
            }
        });

        // Remove cabines cujo bloco DOM foi deletado (X)
        const remainingCabIds = new Set();
        overlay.querySelectorAll('.cab-config-block').forEach(block => {
            const raw = block.dataset.cabId || '';
            const baseId = raw.split('|')[0];
            if (baseId) remainingCabIds.add(baseId);
        });
        for (const key of Object.keys(eq.layoutConfig.cabinetAssignments || {})) {
            if (!remainingCabIds.has(key)) {
                delete eq.layoutConfig.cabinetAssignments[key];
            }
        }
        if (Object.keys(eq.layoutConfig.cabinetAssignments || {}).length === 0) {
            delete eq.layoutConfig.cabinetAssignments;
        }

        overlay.remove();

        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        this._syncLayoutToEnclosures(eq);
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
 
        if (this.activeSubTab === 'layout') {
            this.renderSubTab();
        }
    },

    _drawLayoutCanvas(canvas, cabinets) {
        const CANVAS_HEIGHT = 500;
        const PADDING = 30;
        const BOTTOM_LABEL_HEIGHT = 50;
        const maxH = cabinets.length > 0 ? Math.max(...cabinets.map(c => c.height || 2300), 2300) : 2300;
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / maxH;

        const totalCabinetPixels = cabinets.reduce((s, c) => s + c.width * SCALE, 0);
        const canvasWidth = Math.ceil(totalCabinetPixels + PADDING * 2);

        if (cabinets.length === 0) {
            canvas.width = 400;
            canvas.height = CANVAS_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, CANVAS_HEIGHT);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Nenhum armário para exibir', 200, CANVAS_HEIGHT / 2);
            return;
        }

        canvas.width = canvasWidth;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');
        this._drawLayoutInternal(ctx, cabinets, SCALE, 1, PADDING);
    },

    _drawLayoutCanvasExternal(canvas, cabinets) {
        const CANVAS_HEIGHT = 500;
        const PADDING = 30;
        const BOTTOM_LABEL_HEIGHT = 50;
        const maxH = cabinets.length > 0 ? Math.max(...cabinets.map(c => c.height || 2300), 2300) : 2300;
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / maxH;

        const totalCabinetPixels = cabinets.reduce((s, c) => s + c.width * SCALE, 0);
        const canvasWidth = Math.ceil(totalCabinetPixels + PADDING * 2);

        if (cabinets.length === 0) {
            canvas.width = 400;
            canvas.height = CANVAS_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, CANVAS_HEIGHT);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Nenhum armário para exibir', 200, CANVAS_HEIGHT / 2);
            return;
        }

        canvas.width = canvasWidth;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');
        this._drawLayoutInternal(ctx, cabinets, SCALE, 1, PADDING, true);
    },

    _drawSideView(cabinets, containerId, imgId, cabinetIndex, rearCabins = null) {
        const container = document.getElementById(containerId);
        const img = document.getElementById(imgId);
        if (!container || !img || cabinets.length === 0) return;

        const isB2B = Array.isArray(rearCabins) && rearCabins.length > 0;

        const CANVAS_HEIGHT = 500;
        const PADDING = 30;
        const BOTTOM_LABEL_HEIGHT = 50;
        const maxCabHeight = Math.max(...[...cabinets, ...(rearCabins || [])].map(c => c.height || 2300), 2300);
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / maxCabHeight;
        const SCREEN_SCALE = (500 - 60 - 50) / 2300;
        const fontMult = SCALE / SCREEN_SCALE;

        const selectedCabins = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
            ? [cabinets[cabinetIndex]]
            : cabinets;

        const frontDepth = Math.max(...selectedCabins.map(c => c.depth || 600));
        const rearDepth = isB2B
            ? Math.max(...rearCabins.map(c => c.depth || 600))
            : 0;
        const totalDepth = isB2B ? frontDepth : frontDepth + rearDepth;
        const boxW = totalDepth * SCALE;
        const canvasWidth = Math.ceil(boxW + PADDING * 2);

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT);

        const singleLabel = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
            ? cabinets[cabinetIndex].name
            : null;
        this._drawSideViewInternal(ctx, selectedCabins, frontDepth, SCALE, fontMult, PADDING, singleLabel, rearCabins);

        img.src = canvas.toDataURL('image/png');
        container.style.display = 'block';
    },

    _drawSideViewInternal(ctx, selectedCabins, boxDepth, scale, fontMult, padding, singleCabName, rearCabins = null) {
        const CANVAS_HEIGHT = ctx.canvas.height;
        const xOff = padding;
        const isB2B = Array.isArray(rearCabins) && rearCabins.length > 0;
        const frontDepth = boxDepth;
        const rearDepth = isB2B ? Math.max(...rearCabins.map(c => c.depth || 600)) : 0;
        const effectiveDepth = isB2B ? frontDepth : frontDepth + rearDepth;
        const cabW = effectiveDepth * scale;
        const maxCabHeight = Math.max(...[...selectedCabins, ...(rearCabins || [])].map(c => c.height || 2300), 2300);
        const cabH = maxCabHeight * scale;

        // Single cabinet body (combined box)
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(xOff, padding, cabW, cabH, 4);
        ctx.fill();
        ctx.stroke();

        // Base
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        const baseY = padding + (maxCabHeight - 100) * scale;
        ctx.beginPath();
        ctx.moveTo(xOff, baseY);
        ctx.lineTo(xOff + cabW, baseY);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Base', xOff + cabW / 2, baseY + 12 * fontMult);

        // Ground bar label (apenas CCM Forma 1)
        const isForma2 = selectedCabins.some(c => c.segregacao === 'Forma 2a' || c.segregacao === 'Forma 2b');
        const isAutomation = selectedCabins.some(c => c._isAutomation);
        if (!isForma2 && !isAutomation) {
            const gndY = padding + (maxCabHeight - 110) * scale;
            ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xOff, gndY);
            ctx.lineTo(xOff + cabW, gndY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.fillText('Barramento Terra', xOff + cabW / 2, gndY - 4);
        }

        // Placa de montagem: face direita (fundo) encosta no fundo do componente de menor Z
        let minPlateZ = null;
        let minPlateD = 0;
        for (const cab of selectedCabins) {
            const cd = cab._assignData;
            const src = cd && cab._face ? this._getLoadsAsFlat(cd.faces?.[cab._face]) : this._getLoadsAsFlat(cd);
            for (const row of cab.rows || []) {
                for (const item of row.items || []) {
                    const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                    if (zo != null && (minPlateZ === null || zo < minPlateZ)) {
                        minPlateZ = zo;
                        minPlateD = item.d || 0;
                    }
                }
            }
        }
        const plateFaceDir = minPlateZ !== null ? minPlateZ : 0;
        const plateRightFaceX = xOff + (effectiveDepth - plateFaceDir) * scale;

        // Rear cabinet mounting plate Z (B2B)
        let minRearZ = null, minRearD = 0;
        if (isB2B) {
            for (const cab of rearCabins) {
                const cd = cab._assignData;
                const src = cd && cab._face ? this._getLoadsAsFlat(cd.faces?.[cab._face]) : this._getLoadsAsFlat(cd);
                for (const row of cab.rows || []) {
                    for (const item of row.items || []) {
                        const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                        if (zo != null && (minRearZ === null || zo < minRearZ)) {
                            minRearZ = zo;
                            minRearD = item.d || 0;
                        }
                    }
                }
            }
        }
        const plateFaceDirRear = minRearZ !== null ? minRearZ : 0;

        // Borda de 30mm + placa de montagem
        if (isForma2) {
            // Borda de 30mm (Forma 2a/2b)
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(xOff + 30 * scale, padding + 30 * scale, (effectiveDepth - 60) * scale, 2140 * scale);
            // Placa de montagem (20mm espessura) — Forma 2
            const plateX = plateRightFaceX - 20 * scale;
            const plateY = padding + 315 * scale;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(plateX, plateY, 20 * scale, 1840 * scale);
            ctx.fillStyle = '#64748b';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Placa Montagem', plateX + 10 * scale, plateY + 1840 * scale - 20 * scale);

            // Placa de montagem traseira (B2B)
            if (isB2B) {
                const rearPlateX = xOff + plateFaceDirRear * scale;
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(rearPlateX, plateY, 20 * scale, 1840 * scale);
                ctx.fillStyle = '#64748b';
                ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Placa Montagem', rearPlateX + 10 * scale, plateY + 1840 * scale - 20 * scale);
            }

            // Canaletas na vista lateral (retângulo tracejado: profundidade × comprimento)
            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = '#0e7490';
            ctx.lineWidth = 0.5;
            for (const cab of selectedCabins) {
                const cfgC = cab.layoutConfig || this._getDefaultLayoutConfig();
                for (const can of cfgC.canaletas || []) {
                    const prof = can.profundidade || can.largura_base || 50;
                    const canX = xOff + (effectiveDepth - plateFaceDir) * scale;
                    const canSy = padding + (can.y || 0) * scale;
                    if (can.tipo === 'quadro') {
                        for (const seg of can.segmentos || []) {
                            const segSy = padding + seg.y * scale;
                            if (seg.orientacao === 'V') {
                                ctx.strokeRect(canX, segSy, prof * scale, seg.comprimento * scale);
                            }
                        }
                    } else if (can.tipo === 'linear') {
                        if (can.orientacao === 'V') {
                            ctx.strokeRect(canX, canSy, prof * scale, can.comprimento * scale);
                        } else {
                            ctx.strokeRect(canX, canSy, can.comprimento * scale, prof * scale);
                        }
                    }
                }
            }
            ctx.restore();

            // Porta (6.5mm × 2190mm) na face frontal da vista lateral
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 0.5;
            const doorThick = 6.5 * scale;
            const doorSideX = xOff + cabW - doorThick;
            ctx.strokeRect(doorSideX, padding, doorThick, 2190 * scale);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.round(5 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Porta', doorSideX + doorThick / 2, padding + (12 - 50) * scale);
        } else {
            // Borda de 30mm + placa de montagem proporcional (Forma 1)
            const panelH = maxCabHeight - 100;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(xOff + 30 * scale, padding + 30 * scale, (effectiveDepth - 60) * scale, (panelH - 60) * scale);
            // Placa de montagem em perfil (20mm espessura) — proporcional
            const plateHSide = panelH - 105;
            const plateYSide = 30 + (panelH - 60 - plateHSide) / 2;
            const plateX = plateRightFaceX - 20 * scale;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(plateX, padding + plateYSide * scale, 20 * scale, plateHSide * scale);
            ctx.fillStyle = '#64748b';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Placa Montagem', plateX + 10 * scale, padding + (plateYSide + plateHSide - 20) * scale);
            // Placa de montagem traseira (B2B)
            if (isB2B) {
                const rearPlateX = xOff + plateFaceDirRear * scale;
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(rearPlateX, padding + plateYSide * scale, 20 * scale, plateHSide * scale);
                ctx.fillStyle = '#64748b';
                ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Placa Montagem', rearPlateX + 10 * scale, padding + (plateYSide + plateHSide - 20) * scale);
            }
        }

        // Olhais para içamento — vista lateral (corte): 4×60mm, faces internas distanciadas 485mm
        const eyeW = 4, eyeH = 60, innerDist = 485;
        const marginEye = (effectiveDepth - innerDist - eyeW * 2) / 2;
        if (marginEye > 0) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(xOff + marginEye * scale, padding - eyeH * scale, eyeW * scale, eyeH * scale);
            ctx.strokeRect(xOff + (marginEye + eyeW + innerDist) * scale, padding - eyeH * scale, eyeW * scale, eyeH * scale);
        }

        // Linha dos barramentos (Y=300) — apenas Forma 2a/2b
        if (isForma2) {
            const barraSideY = padding + 300 * scale;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xOff + 30 * scale, barraSideY);
            ctx.lineTo(xOff + (effectiveDepth - 30) * scale, barraSideY);
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Barramentos', xOff + (effectiveDepth / 2) * scale, barraSideY - 50 * scale);
        }

        // Cota de profundidade (30mm abaixo da base)
        const cotaSideY = padding + (maxCabHeight + 90) * scale;
        ctx.fillStyle = '#475569';
        ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(effectiveDepth + ' mm', xOff + (effectiveDepth / 2) * scale, cotaSideY);

        // Título da vista lateral (horizontal, mesma linha que vista frontal interna)
        ctx.fillStyle = '#1e293b';
        ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Vista Lateral (Corte)', xOff + effectiveDepth / 2 * scale, padding + (maxCabHeight + 180) * scale);

        // Collect all items from selected cabinets with their load source
        const allItems = [];
        for (const cab of selectedCabins) {
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

        // Separate items with and without manual zOffset
        const itemsWithManualZ = [];
        const itemsWithoutZ = [];
        for (const { item, assignedSource } of allItems) {
                    const zOff = item._matId ? (assignedSource[item._matId]?.zOffset ?? item._zOffset) : undefined;
            if (zOff != null) {
                itemsWithManualZ.push({ item, z: zOff });
            } else {
                itemsWithoutZ.push(item);
            }
        }

        // Calculate Z distribution
        const totalManualZEnd = itemsWithManualZ.reduce((s, e) => Math.max(s, e.z), 0);
        const remainingDepth = Math.max(0, frontDepth - totalManualZEnd);
        const autoItemsDepth = itemsWithoutZ.reduce((s, it) => s + (it.d || 0), 0);
        const gap = autoItemsDepth > 0 && itemsWithoutZ.length > 1
            ? Math.min(5, Math.max(0, remainingDepth - autoItemsDepth) / (itemsWithoutZ.length - 1))
            : 0;

        // Draw items with manual Z
        for (const { item, z } of itemsWithManualZ) {
            const id = item.d || 20;
            const ih = item.h || 40;
            const clampedZ = Math.min(Math.max(z, id), Math.max(effectiveDepth, 0));
            const ix = xOff + (effectiveDepth - clampedZ) * scale;
            const iy = padding + (item.y || 0) * scale;
            const iw = id * scale;

            ctx.shadowColor = 'rgba(0,0,0,0.06)';
            ctx.shadowBlur = 3 * fontMult;
            ctx.shadowOffsetY = 1 * fontMult;
            ctx.fillStyle = item.color || '#94a3b8';
            ctx.beginPath();
            if (iw > 4 && ih * scale > 4) {
                ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
            } else {
                ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
            }
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Draw auto-distributed items front-to-back
        let currentZ = totalManualZEnd;
        const sortedAuto = [...itemsWithoutZ].sort((a, b) => (b.d || 0) - (a.d || 0));
        for (const item of sortedAuto) {
            const id = item.d || 20;
            const ih = item.h || 40;
            const ix = xOff + (effectiveDepth - currentZ) * scale;
            const iy = padding + (item.y || 0) * scale;
            const iw = id * scale;
            item.z = currentZ;

            ctx.shadowColor = 'rgba(0,0,0,0.06)';
            ctx.shadowBlur = 3 * fontMult;
            ctx.shadowOffsetY = 1 * fontMult;
            ctx.fillStyle = item.color || '#94a3b8';
            ctx.beginPath();
            if (iw > 4 && ih * scale > 4) {
                ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
            } else {
                ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
            }
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            currentZ += id + gap;
        }

        // Detect z-axis collisions and highlight
        const allSideItems = [...itemsWithManualZ.map(e => e.item), ...sortedAuto];
        const zCollisions = this._detectZCollisions(allSideItems);
        if (zCollisions.length > 0) {
            for (const col of zCollisions) {
                for (const item of [col.itemA, col.itemB]) {
                    const id = item.d || 20;
                    const ih = item.h || 40;
                    const z = item.z || 0;
                    const ix = xOff + (effectiveDepth - z) * scale;
                    const iy = padding + (item.y || 0) * scale;
                    const iw = id * scale;
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([3, 2]);
                    ctx.strokeRect(ix - 1, iy - 1, Math.max(iw, 4) + 2, Math.max(ih * scale, 4) + 2);
                    ctx.setLineDash([]);
                }
            }
        }

        // Draw rear cabinet items (B2B) — mirrored
        if (isB2B) {
            const allRearItems = [];
            for (const cab of rearCabins) {
                const cabData = cab._assignData;
                const assignedSource = cabData && cab._face
                    ? this._getLoadsAsFlat(cabData.faces?.[cab._face])
                    : this._getLoadsAsFlat(cabData);
                for (const row of cab.rows || []) {
                    for (const item of row.items || []) {
                        allRearItems.push({ item, assignedSource });
                    }
                }
            }
            const rearItemsWithManualZ = [];
            const rearItemsWithoutZ = [];
            for (const { item, assignedSource } of allRearItems) {
                const zOff = item._matId ? (assignedSource[item._matId]?.zOffset ?? item._zOffset) : undefined;
                if (zOff != null) {
                    rearItemsWithManualZ.push({ item, z: zOff });
                } else {
                    rearItemsWithoutZ.push(item);
                }
            }
            const rearTotalManualZEnd = rearItemsWithManualZ.reduce((s, e) => Math.max(s, e.z), 0);
            const rearRemainingDepth = Math.max(0, rearDepth - rearTotalManualZEnd);
            const rearAutoItemsDepth = rearItemsWithoutZ.reduce((s, it) => s + (it.d || 0), 0);
            const rearGap = rearAutoItemsDepth > 0 && rearItemsWithoutZ.length > 1
                ? Math.min(5, Math.max(0, rearRemainingDepth - rearAutoItemsDepth) / (rearItemsWithoutZ.length - 1))
                : 0;
            // Draw rear items with manual Z (mirrored)
            for (const { item, z } of rearItemsWithManualZ) {
                const id = item.d || 20;
                const ih = item.h || 40;
                const clampedZ = Math.min(Math.max(z, id), rearDepth);
                const ix = xOff + (clampedZ - id) * scale;
                const iy = padding + (item.y || 0) * scale;
                const iw = id * scale;
                ctx.shadowColor = 'rgba(0,0,0,0.06)';
                ctx.shadowBlur = 3 * fontMult;
                ctx.shadowOffsetY = 1 * fontMult;
                ctx.fillStyle = item.color || '#94a3b8';
                ctx.beginPath();
                if (iw > 4 && ih * scale > 4) {
                    ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
                } else {
                    ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
                }
                ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            // Draw rear auto-distributed items (mirrored)
            let rearCurrentZ = rearTotalManualZEnd;
            const rearSortedAuto = [...rearItemsWithoutZ].sort((a, b) => (b.d || 0) - (a.d || 0));
            for (const item of rearSortedAuto) {
                const id = item.d || 20;
                const ih = item.h || 40;
                const ix = xOff + Math.max(rearCurrentZ - id, 0) * scale;
                const iy = padding + (item.y || 0) * scale;
                const iw = id * scale;
                ctx.shadowColor = 'rgba(0,0,0,0.06)';
                ctx.shadowBlur = 3 * fontMult;
                ctx.shadowOffsetY = 1 * fontMult;
                ctx.fillStyle = item.color || '#94a3b8';
                ctx.beginPath();
                if (iw > 4 && ih * scale > 4) {
                    ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
                } else {
                    ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
                }
                ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
                rearCurrentZ -= id + rearGap;
            }
        }

        // Depth dimension label
        ctx.fillStyle = '#475569';
        ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('P: ' + effectiveDepth + 'mm', xOff + cabW / 2, padding + cabH + 4);
    },

    _isForma34(seg) {
        return ['Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'].includes(seg);
    },

    _isForma34KitFrame(seg, fabricante) {
        return this._isForma34(seg) && (fabricante === 'KitFrame');
    },

    _isForma34EstruturaModular(seg, fabricante) {
        return this._isForma34(seg) && (fabricante === 'KitFrame' || fabricante === 'Eletropoll');
    },

    _getEletropollDrawerConfig() {
        return {
            fixo: {
                'Partida Direta': [
                    { maxCV: 3,    largura: 600, altura: 100 },
                    { maxCV: 50,   largura: 600, altura: 150 },
                    { maxCV: 150,  largura: 600, altura: 200 },
                    { maxCV: 175,  largura: 600, altura: 800 },
                    { maxCV: 270,  largura: 800, altura: 1000 },
                    { maxCV: 500,  largura: 800, altura: 1200 },
                    { maxCV: Infinity, largura: 800, altura: 1200, consultar: true }
                ],
                'Soft-Starter': [
                    { maxCV: 15,   largura: 600, altura: 300 },
                    { maxCV: 50,   largura: 600, altura: 400 },
                    { maxCV: 150,  largura: 600, altura: 600 },
                    { maxCV: 175,  largura: 600, altura: 800 },
                    { maxCV: 270,  largura: 800, altura: 1000 },
                    { maxCV: 500,  largura: 800, altura: 1200 },
                    { maxCV: Infinity, largura: 800, altura: 1200, consultar: true }
                ],
                'Inversor de Frequência': [
                    { maxCV: 15,   largura: 600, altura: 300 },
                    { maxCV: 50,   largura: 600, altura: 400 },
                    { maxCV: 175,  largura: 600, altura: 600 },
                    { maxCV: 200,  largura: 600, altura: 1000 },
                    { maxCV: 250,  largura: 800, altura: 1600 },
                    { maxCV: 500,  largura: 800, altura: 1800 },
                    { maxCV: Infinity, largura: 800, altura: 1800, consultar: true }
                ]
            },
            extraivel: {
                'Partida Direta': [
                    { maxCV: 50,   largura: 600, altura: 150 },
                    { maxCV: 150,  largura: 600, altura: 200 },
                    { maxCV: 175,  largura: 600, altura: 300, consultar: true },
                    { maxCV: Infinity, largura: 600, altura: 300, consultar: true }
                ],
                'Soft-Starter': [
                    { maxCV: 50,   largura: 600, altura: 300 },
                    { maxCV: 150,  largura: 600, altura: 400 },
                    { maxCV: 175,  largura: 600, altura: 800, consultar: true },
                    { maxCV: Infinity, largura: 600, altura: 800, consultar: true }
                ],
                'Inversor de Frequência': [
                    { maxCV: 15,   largura: 600, altura: 300 },
                    { maxCV: 175,  largura: 600, altura: 400 },
                    { maxCV: Infinity, largura: 600, altura: 400, consultar: true }
                ]
            }
        };
    },

    _getTipoPartidaParaCarga(carga) {
        const desc = (carga?.tipico || carga?.desc || '').toLowerCase();
        if (desc.includes('inversor') || desc.includes('frequencia') || desc.includes('freq')) {
            return 'Inversor de Frequência';
        }
        if (desc.includes('soft') || desc.includes('starter')) {
            return 'Soft-Starter';
        }
        return 'Partida Direta';
    },

    _getEletropollDrawerHeight(carga, tipoMontagem) {
        if (!carga) return null;
        const cv = parseFloat(carga.cv) || (parseFloat(carga.power) / 0.736) || 0;
        const config = this._getEletropollDrawerConfig();
        const tipo = tipoMontagem === 'Extraível' ? 'extraivel' : 'fixo';
        const tipoPartida = this._getTipoPartidaParaCarga(carga);
        const tabela = config[tipo]?.[tipoPartida];
        if (!tabela) return null;
        for (const row of tabela) {
            if (cv <= row.maxCV) {
                if (row.consultar) {
                    return { height: null, width: null, consultar: true, tipoPartida };
                }
                return { height: row.altura, width: row.largura, consultar: false, tipoPartida };
            }
        }
        return { height: null, width: null, consultar: true, tipoPartida };
    },

    // Gaveta height table: smallest height that satisfies BOTH kW and A
    _getDrawerHeight(carga, fabricante, tipoMontagem) {
        if (fabricante === 'Eletropoll') {
            const result = this._getEletropollDrawerHeight(carga, tipoMontagem);
            if (result && !result.consultar && result.height != null) return result.height;
        }
        const kw = parseFloat(carga?.power) || 0;
        const a = parseFloat(carga?.current) || 0;
        const table = [
            { height: 100, maxKw: 37,  maxA: 80 },
            { height: 150, maxKw: 55,  maxA: 250 },
            { height: 225, maxKw: 75,  maxA: 400 },
            { height: 300, maxKw: 110, maxA: 630 },
            { height: 375, maxKw: 132, maxA: 800 },
            { height: 450, maxKw: 160, maxA: 1000 },
        ];
        for (const row of table) {
            if (kw <= row.maxKw && a <= row.maxA) return row.height;
        }
        return 450;
    },

    // Auto-stack gavetas for a KitFrame coluna (max 1800mm total height per coluna)
    _createReserveGavetas(remaining, cabNumber, gavIdx) {
        const STD_H = [100, 150, 225, 300, 375, 450];
        const reserve = [];
        let space = remaining;
        for (const h of STD_H) {
            while (space >= h) {
                gavIdx++;
                reserve.push({
                    id: 'gav-' + cabNumber + '.' + gavIdx,
                    colunaIndex: -1,
                    posicao: gavIdx - 1,
                    height: h,
                    cargaTag: 'TAG??',
                    potencia: 'Gav. Reserva',
                    _isReserva: true,
                    materiais: {},
                });
                space -= h;
            }
        }
        return { reserve, gavIdx };
    },

    _tryFillExact(space) {
        const STD_H = [100, 150, 225, 300, 375, 450];
        if (space === 0) return [];
        const dp = new Array(space + 1).fill(null);
        dp[0] = [];
        for (let s = 0; s <= space; s++) {
            if (dp[s] === null) continue;
            for (const h of STD_H) {
                if (s + h <= space && dp[s + h] === null) {
                    dp[s + h] = [...dp[s], h];
                }
            }
        }
        return dp[space];
    },

    _getReserveOptions(space) {
        const STD_H = [100, 150, 225, 300, 375, 450];
        if (space < 100) return [[space]];
        const MAX_PER_SLOT = 20;
        const dp = new Array(space + 1).fill(null);
        dp[0] = [[]];
        for (let s = 0; s <= space; s++) {
            if (!dp[s]) continue;
            for (const h of STD_H) {
                const ns = s + h;
                if (ns > space) continue;
                if (!dp[ns]) dp[ns] = [];
                for (const combo of dp[s]) {
                    if (dp[ns].length >= MAX_PER_SLOT) break;
                    dp[ns].push([...combo, h]);
                }
            }
        }
        if (!dp[space] || dp[space].length === 0) return [[space]];
        const seen = new Set();
        const unique = [];
        for (const combo of dp[space]) {
            const key = [...combo].sort((a, b) => a - b).join(',');
            if (!seen.has(key)) { seen.add(key); unique.push(combo); }
        }
        unique.sort((a, b) => a.length - b.length);
        const result = [];
        const usedCounts = new Set();
        for (const combo of unique) {
            if (result.length >= 6) break;
            if (!usedCounts.has(combo.length)) {
                result.push(combo);
                usedCounts.add(combo.length);
            }
        }
        return result;
    },

    _autoStackGavetas(cargas, cabLoads, cabNumber = 1, mode = 'sequential', reserveCombo = null, fabricante, tipoMontagem) {
        const MAX_HEIGHT = 1800;
        const excessLoads = [];
        let gavIdx = 0;
        let usedH = 0;
        const gavetas = [];

        let cargasOrdered;
        if (mode === 'otimizada') {
            cargasOrdered = [...cargas].sort((a, b) => {
                const pa = parseFloat(a.power) || 0;
                const pb = parseFloat(b.power) || 0;
                return pb - pa;
            });
        } else {
            cargasOrdered = [...cargas];
        }

        for (const carga of cargasOrdered) {
            if (!carga.tag) continue;
            let h = this._getDrawerHeight(carga, fabricante, tipoMontagem);
            const epResult = (fabricante === 'Eletropoll') ? this._getEletropollDrawerHeight(carga, tipoMontagem) : null;
            if (epResult && epResult.consultar) {
                excessLoads.push({ ...carga, _consultar: true });
                continue;
            }
            if (usedH + h > MAX_HEIGHT) {
                excessLoads.push(carga);
                continue;
            }
            const loadMats = cabLoads?.[carga.tag] || {};
            gavetas.push({
                id: 'gav-' + cabNumber + '.' + (gavIdx + 1),
                colunaIndex: 0,
                posicao: gavIdx,
                height: h,
                cargaTag: carga.tag,
                cargaDesc: carga.desc || carga.tag,
                potencia: carga.power || '',
                corrente: carga.current || '',
                materiais: loadMats,
            });
            usedH += h;
            gavIdx++;
        }

        if (mode !== 'manual') {
            const remaining = MAX_HEIGHT - usedH;
            if (remaining >= 225) {
                let fill;
                if (reserveCombo) {
                    fill = reserveCombo;
                } else {
                    fill = this._tryFillExact(remaining);
                    if (!fill) fill = [remaining];
                }
                for (const h of fill) {
                    gavIdx++;
                    gavetas.push({
                        id: 'gav-' + cabNumber + '.' + gavIdx,
                        colunaIndex: 0,
                        posicao: gavIdx - 1,
                        height: h,
                        cargaTag: 'TAG??',
                        potencia: 'Gav. Reserva',
                        _isReserva: true,
                        materiais: {},
                    });
                    usedH += h;
                }
            }
        }

        return { colunas: [{ index: 0, gavetas, totalAltura: usedH }], excessLoads };
    },

    _distributeLoadsAcrossCabinets(cargas, fabricante, tipoMontagem) {
        const MAX = 1800;

        const loads = cargas
            .filter(c => c.tag)
            .map(c => ({ ...c, h: this._getDrawerHeight(c, fabricante, tipoMontagem) }))
            .sort((a, b) => {
                const pa = parseFloat(a.power) || 0;
                const pb = parseFloat(b.power) || 0;
                return pb - pa;
            });

        const result = [];
        let currentGroup = [];
        let currentHeight = 0;

        for (const carga of loads) {
            if (currentHeight + carga.h > MAX && currentGroup.length > 0) {
                result.push({ loads: [...currentGroup], totalHeight: currentHeight });
                currentGroup = [];
                currentHeight = 0;
            }
            currentGroup.push(carga);
            currentHeight += carga.h;
        }

        if (currentGroup.length > 0) {
            result.push({ loads: [...currentGroup], totalHeight: currentHeight });
        }

        return result;
    },

    _rebalanceCabinets(arrangement) {
        if (!arrangement || arrangement.length < 2) return arrangement;
        const MAX = 1800;
        const MIN_OK = 225;
        let changed = true;
        let safety = 0;

        while (changed && safety < 50) {
            changed = false;
            safety++;

            for (let i = 0; i < arrangement.length; i++) {
                const donor = arrangement[i];
                const donorRemaining = MAX - donor.totalHeight;
                if (donorRemaining === 0 || donorRemaining >= MIN_OK) continue;
                if (donor.loads.length === 0) continue;

                const candidates = [...donor.loads].sort((a, b) => a.h - b.h);

                for (const load of candidates) {
                    let moved = false;
                    for (let j = 0; j < arrangement.length; j++) {
                        if (j === i) continue;
                        const rec = arrangement[j];
                        if (MAX - rec.totalHeight >= load.h) {
                            donor.loads = donor.loads.filter(l => l !== load);
                            donor.totalHeight -= load.h;
                            rec.loads.push(load);
                            rec.totalHeight += load.h;
                            moved = true;
                            changed = true;
                            break;
                        }
                    }
                    if (moved) break;
                }
            }
        }

        return arrangement.filter(c => c.loads.length > 0);
    },

    _drawCabinetForma34(ctx, cab, x, y, scale, fontMult, cabW, cabHeight, displayName) {
        const isEletropoll = cab._fabricante === 'Eletropoll';
        const ccw = isEletropoll ? 400 : (cab.layoutConfig?.colunaCabosWidth || 200);
        const L = cab.width || (600 + ccw);
        const gavetasW = isEletropoll ? (cabW - ccw * scale) : (600 * scale);
        const colunaCabosW = ccw * scale;
        const barraSecY = 300;
        const gavetasSecY = barraSecY + 1800;
        const colunaCabosSecY = barraSecY + 1900;
        const baseSecY = colunaCabosSecY;

        // ── Barramentos (Y=0 to 300) ──
        const barY = y;
        const barH = 300 * scale;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.fillRect(x, barY, cabW, barH);
        ctx.strokeRect(x, barY, cabW, barH);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(x + 3 * scale, barY + 3 * scale, cabW - 6 * scale, barH - 6 * scale);
        ctx.fillStyle = '#0284c7';
        ctx.font = `bold ${Math.round(8 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Barramentos', x + cabW / 2, barY + barH / 2);

        // ── Olhais para içamento (apenas Eletropoll) ──
        if (isEletropoll) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, 60 * scale, 60 * scale);
            ctx.strokeRect(x + cabW - 60 * scale, y, 60 * scale, 60 * scale);
            ctx.beginPath();
            ctx.arc(x + 30 * scale, y + 30 * scale, 10 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + cabW - 30 * scale, y + 30 * scale, 10 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Exaustor de teto (500×100mm acima da área de gavetas) ──
        const temExaustor = isEletropoll ? (cab.layoutConfig?.exaustor !== false) : true;
        if (temExaustor) {
            const exW = 500 * scale;
            const exH = 100 * scale;
            const exX = x + cabW / 2 - exW / 2;
            const exY = y - exH;
            ctx.fillStyle = '#e0f2fe';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.5;
            ctx.fillRect(exX, exY, exW, exH);
            ctx.strokeRect(exX, exY, exW, exH);
            ctx.strokeStyle = '#93c5fd';
            ctx.lineWidth = 0.3;
            ctx.strokeRect(exX + 3 * scale, exY - 3 * scale, exW - 6 * scale, exH - 6 * scale);
            ctx.fillStyle = '#0284c7';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Exaustor', exX + exW / 2, exY + exH / 2);
        }

        // ── Coluna de Cabos (Y=300 to 2200, right side) ──
        const colCabX = x + gavetasW;
        const colCabY = y + barraSecY * scale;
        const colCabH = (colunaCabosSecY - barraSecY) * scale;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.fillRect(colCabX, colCabY, colunaCabosW, colCabH);
        ctx.strokeRect(colCabX, colCabY, colunaCabosW, colCabH);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(colCabX + 3 * scale, colCabY + 3 * scale, colunaCabosW - 6 * scale, colCabH - 6 * scale);
        ctx.setLineDash([]);
        ctx.fillStyle = '#0284c7';
        ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Coluna', colCabX + colunaCabosW / 2, colCabY + 30 * scale);
        ctx.fillText('Cabos', colCabX + colunaCabosW / 2, colCabY + 50 * scale);

        // ── Gavetas (Y=300 to 2100, left area) ──
        const gavY = y + barraSecY * scale;
        const gavH = (gavetasSecY - barraSecY) * scale;
        const gavetas = cab._gavetas || [];
        if (gavetas.length > 0) {
            let gavYOff = gavY;
            for (const gav of gavetas) {
                const gh = gav.height * scale;
                ctx.fillStyle = '#e0f2fe';
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 0.5;
                ctx.fillRect(x, gavYOff, gavetasW, gh);
                ctx.strokeRect(x, gavYOff, gavetasW, gh);
                ctx.strokeStyle = '#93c5fd';
                ctx.lineWidth = 0.3;
                ctx.strokeRect(x + 3 * scale, gavYOff + 3 * scale, gavetasW - 6 * scale, gh - 6 * scale);
                // Fecho for gavetas
                {
                    const fechoW = 20 * scale;
                    const fechoH = 30 * scale;
                    const fechoX = x + gavetasW - 40 * scale;
                    const drawFecho = fy => {
                        ctx.fillStyle = '#94a3b8';
                        ctx.strokeStyle = '#64748b';
                        ctx.lineWidth = 0.5;
                        ctx.fillRect(fechoX, fy, fechoW, fechoH);
                        ctx.strokeRect(fechoX, fy, fechoW, fechoH);
                        ctx.fillStyle = '#64748b';
                        ctx.beginPath();
                        ctx.arc(fechoX + fechoW / 2, fy + fechoH / 2, 5 * scale, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    if (gav.height === 100 || gav.height === 150) {
                        drawFecho(gavYOff + gh / 2 - fechoH / 2);
                    } else if (gav.height >= 200) {
                        drawFecho(gavYOff + 50 * scale - fechoH / 2);
                        drawFecho(gavYOff + gh - 50 * scale - fechoH / 2);
                    }
                }
                // Comando Mecânico (70x70mm rect + 16mm circle)
                {
                    const cmW = 70 * scale;
                    const cmH = 70 * scale;
                    const cmX = x + gavetasW / 2 - cmW / 2;
                    let cmY;
                    if (gav.height === 100) {
                        cmY = gavYOff + gh / 2 - cmH / 2;
                    } else {
                        cmY = gavYOff + gh - 50 * scale - cmH / 2;
                    }
                    ctx.fillStyle = '#94a3b8';
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 0.5;
                    ctx.fillRect(cmX, cmY, cmW, cmH);
                    ctx.strokeRect(cmX, cmY, cmW, cmH);
                    ctx.fillStyle = '#64748b';
                    ctx.beginPath();
                    ctx.arc(cmX + cmW / 2, cmY + cmH / 2, 8 * scale, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Gaveta id (top-left)
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.round(4.5 * fontMult)}px sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(gav.id, x + 2, gavYOff + 2);
                // Carga tag (center)
                ctx.fillStyle = '#1e293b';
                ctx.font = `bold ${Math.round(6 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const cmCenterY = gav.height === 100 ? gavYOff + gh / 2 : gavYOff + gh - 50 * scale;
                if (gav._isReserva) {
                    ctx.fillText('TAG??', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale - 23.2 * scale);
                    ctx.fillStyle = '#64748b';
                    ctx.font = `${Math.round(12 * fontMult)}px sans-serif`;
                    ctx.fillText('Gav. Reserva', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale + 10 * fontMult + 20 * scale - 23.2 * scale);
                } else {
                    ctx.fillText(gav.cargaTag || '', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale - 23.2 * scale);
                    ctx.fillStyle = '#64748b';
                    ctx.font = `${Math.round(12 * fontMult)}px sans-serif`;
                    ctx.fillText(gav.potencia ? gav.potencia + 'kW' : '', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale + 10 * fontMult + 20 * scale - 23.2 * scale);
                }
                // Height label (bottom center)
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.round(4.5 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(gav.height + 'mm', x + gavetasW / 2, gavYOff + gh - 2);
                gavYOff += gh;
            }
        } else {
            // No gavetas: show empty area with cabinet name
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, gavY, gavetasW, gavH);
            ctx.fillStyle = '#475569';
            ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayName, x + gavetasW / 2, gavY + 20 * scale);
        }

        // ── Barra Terra (Y=2100 to 2200, left 600mm) ──
        const btY = y + gavetasSecY * scale;
        const btH = (colunaCabosSecY - gavetasSecY) * scale;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.5;
        ctx.fillRect(x, btY, gavetasW, btH);
        ctx.strokeRect(x, btY, gavetasW, btH);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(x + 3 * scale, btY + 3 * scale, gavetasW - 6 * scale, btH - 6 * scale);
        ctx.fillStyle = '#0284c7';
        ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Barra Terra', x + gavetasW / 2, btY + btH / 2);

        // ── Dividers (vertical lines between gavetas section and cable column) ──
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(colCabX, colCabY);
        ctx.lineTo(colCabX, colCabY + colCabH);
        ctx.stroke();
    },

    _drawLayoutInternal(ctx, cabinets, scale, fontMult, padding, externalOnly = false) {
        const CANVAS_WIDTH = ctx.canvas.width;
        const CANVAS_HEIGHT = ctx.canvas.height;

        const COLORS = [
            { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' },
            { fill: '#fce7f3', stroke: '#ec4899', text: '#9d174d' },
            { fill: '#d1fae5', stroke: '#10b981', text: '#065f46' },
            { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
            { fill: '#e0e7ff', stroke: '#6366f1', text: '#3730a3' },
            { fill: '#ccfbf1', stroke: '#14b8a6', text: '#115e59' },
            { fill: '#f3e8ff', stroke: '#a855f7', text: '#6b21a8' },
            { fill: '#fff7ed', stroke: '#f97316', text: '#9a3412' },
        ];

        const r = 4;
        let x = padding;
        const y = padding;

        for (let idx = 0; idx < cabinets.length; idx++) {
            const cab = cabinets[idx];
            const color = COLORS[0];
            const cabW = Math.max(cab.width * scale, 60);
            const cabH = (cab.height || 2300) * scale;
            const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();
            const displayName = cab.name && cab.name.length > 16 ? cab.name.slice(0, 15) + '..' : (cab.name || '');

            // Cabinet body
            ctx.shadowColor = 'rgba(0,0,0,0.08)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, cabW, cabH, r);
            ctx.fillStyle = color.fill;
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Olhais para içamento (60×60mm acima da linha 0, círculo 20mm Ø) — Forma 1/2 e Eletropoll
            const temOlhais = !this._isForma34EstruturaModular(cab.segregacao, cab._fabricante) || cab._fabricante === 'Eletropoll';
            if (temOlhais) {
                const olhalSize = 60 * scale;
                const furoR = 10 * scale;
                const olhalTopY = y - olhalSize;
                const olhalCenterY = y - olhalSize / 2;
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, olhalTopY, olhalSize, olhalSize);
                ctx.beginPath();
                ctx.arc(x + olhalSize / 2, olhalCenterY, furoR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeRect(x + cabW - olhalSize, olhalTopY, olhalSize, olhalSize);
                ctx.beginPath();
                ctx.arc(x + cabW - olhalSize / 2, olhalCenterY, furoR, 0, Math.PI * 2);
                ctx.stroke();
            }

            const cabHeight = cab.height || 2300;

            if (externalOnly) {
                // Vista Externa: desenha a porta com componentes externos
                const doorW = (cab.width - 10) * scale;
                const doorH = (cabHeight - 10) * scale;
                const doorX = x + (cabW - doorW) / 2;
                const doorY = y + 5 * scale;

                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                ctx.strokeRect(doorX, doorY, doorW, doorH);

                // Label "Porta" no topo da porta
                ctx.fillStyle = '#1e293b';
                ctx.font = `bold ${Math.round(7 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Porta', x + cabW / 2, doorY + 12 * scale);

                // Desenha as faixas (door rows) e componentes da porta
                const doorRows = cab.doorRows || [];
                for (const row of doorRows) {
                    // Linha guia horizontal (tracejada)
                    const rowY = doorY + row.y * scale;
                    if (row.linha && row.linha.nome !== 'Outros (Porta)') {
                        ctx.save();
                        ctx.strokeStyle = '#94a3b8';
                        ctx.lineWidth = 0.5;
                        ctx.setLineDash([3 * scale, 3 * scale]);
                        ctx.beginPath();
                        ctx.moveTo(doorX + 5 * scale, rowY);
                        ctx.lineTo(doorX + doorW - 5 * scale, rowY);
                        ctx.stroke();
                        ctx.restore();

                        ctx.fillStyle = '#94a3b8';
                        ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(row.linha.nome, doorX + 4 * scale, rowY - 2 * scale);
                    }

                    for (const item of row.items) {
                        const ix = x + item.x * scale;
                        const iy = doorY + item.y * scale;
                        const iw = Math.max(item.w * scale, 4);
                        const ih = Math.max(item.h * scale, 4);

                        ctx.shadowColor = 'rgba(0,0,0,0.06)';
                        ctx.shadowBlur = 3 * fontMult;
                        ctx.shadowOffsetY = 1 * fontMult;
                        ctx.beginPath();
                        if (iw > 8 && ih > 8) {
                            ctx.roundRect(ix, iy, iw, ih, 2);
                        } else {
                            ctx.rect(ix, iy, iw, ih);
                        }
                        ctx.fillStyle = item.color;
                        ctx.fill();
                        ctx.shadowColor = 'transparent';
                        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        if (iw > 20 * fontMult && ih > 10 * fontMult) {
                            ctx.fillStyle = '#fff';
                            ctx.font = `bold ${Math.round(6 * fontMult)}px sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const label = item.desc.length > 5 ? item.desc.slice(0, 4) + '.' : item.desc;
                            ctx.fillText(label, ix + iw / 2, iy + ih / 2);
                        }
                    }
                }

                // "Vista Frontal Externa" no lugar do nome do armário
                ctx.fillStyle = color.stroke;
                ctx.font = `bold ${Math.round(7 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayName, x + cabW / 2, y + 20 * scale);

                // Não desenha: barramentos, canaletas, componentes internos, placa de montagem, barra terra
            } else {
                // Vista Interna - conteúdo normal
                const isForma2 = cab.segregacao === 'Forma 2a' || cab.segregacao === 'Forma 2b';
                const isForma34 = this._isForma34EstruturaModular(cab.segregacao, cab._fabricante);

                if (isForma2) {
                    // "Barramentos" centered at Y=150mm (middle of 0-300mm zone)
                    ctx.fillStyle = color.stroke;
                    ctx.font = `bold ${Math.round(9 * fontMult)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Barramentos', x + cabW / 2, y + 150 * scale);

                    // 300mm horizontal line
                    ctx.save();
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 1;
                    const line300Y = y + 300 * scale;
                    ctx.beginPath();
                    ctx.moveTo(x + 30 * scale, line300Y);
                    ctx.lineTo(x + cabW - 30 * scale, line300Y);
                    ctx.stroke();
                    ctx.restore();
                }

                if (isForma34) {
                    this._drawCabinetForma34(ctx, cab, x, y, scale, fontMult, cabW, cabHeight, displayName);
                }

                // Cabinet name 20mm below top, centered
                ctx.fillStyle = color.stroke;
                ctx.font = `bold ${Math.round(7 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayName, x + cabW / 2, y + 20 * scale);

                // Canaletas do array (objetos de infraestrutura)
                const canaletas = cfg.canaletas || [];
                for (const can of canaletas) {
                    if (can.tipo === 'quadro') {
                        this._drawQuadroCanaleta(ctx, can, x, y, scale, fontMult);
                    } else if (can.tipo === 'linear') {
                        this._drawCanaletaSegment(ctx, {
                            x: x / scale + can.x, y: y / scale + can.y,
                            comprimento: can.comprimento, largura: can.largura_base || can.largura || 50,
                            orientacao: can.orientacao, modelo: can.modelo
                        }, scale, fontMult);
                    }
                }

                // Component rows + trilhos
                const rows = cab.rows || [];
                const collisionSet = new Set();
                if (cab._collisions) {
                    for (const c of cab._collisions) {
                        collisionSet.add(c.itemA);
                        collisionSet.add(c.itemB);
                    }
                }
                for (const row of rows) {
                    // DIN rail below row (draw FIRST, components cover it)
                    if (row.trilho) {
                        const t = row.trilho;
                        ctx.fillStyle = '#e2e8f0';
                        ctx.strokeStyle = '#94a3b8';
                        ctx.lineWidth = 0.5;
                        ctx.fillRect(x + t.x * scale, y + t.y * scale, t.w * scale, t.h * scale);
                        ctx.strokeRect(x + t.x * scale, y + t.y * scale, t.w * scale, t.h * scale);
                    }
                    for (const item of row.items) {
                        const ix = x + item.x * scale;
                        const iy = y + item.y * scale;
                        const iw = Math.max(item.w * scale, 4);
                        const ih = Math.max(item.h * scale, 4);

                        ctx.shadowColor = 'rgba(0,0,0,0.06)';
                        ctx.shadowBlur = 3 * fontMult;
                        ctx.shadowOffsetY = 1 * fontMult;
                        ctx.beginPath();
                        if (iw > 8 && ih > 8) {
                            ctx.roundRect(ix, iy, iw, ih, 2);
                        } else {
                            ctx.rect(ix, iy, iw, ih);
                        }
                        ctx.fillStyle = item.color;
                        ctx.fill();
                        ctx.shadowColor = 'transparent';
                        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        // Collision highlight
                        if (collisionSet.has(item)) {
                            ctx.strokeStyle = '#ef4444';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([3, 2]);
                            ctx.strokeRect(ix - 1, iy - 1, iw + 2, ih + 2);
                            ctx.setLineDash([]);
                        }

                        if (iw > 20 * fontMult && ih > 10 * fontMult) {
                            ctx.fillStyle = '#fff';
                            ctx.font = `bold ${Math.round(6 * fontMult)}px sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const label = item.desc.length > 5 ? item.desc.slice(0, 4) + '.' : item.desc;
                            ctx.fillText(label, ix + iw / 2, iy + ih / 2);
                        }
                    }
                }

                // Placa de montagem + borda 30mm (comum a todas as formas, exceto Forma 3A-4B)
                if (!isForma34) {
                const borderInset = 30;
                const plateMargin = 50;
                const plateW = (cab.width - plateMargin * 2) * scale;
                const plateX = x + plateMargin * scale;
                if (isForma2) {
                    // Forma 2a/2b: borda + placa fixa 1840mm (após barramento 300mm)
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x + borderInset * scale, y + borderInset * scale, (cab.width - borderInset * 2) * scale, (cabHeight - borderInset * 2 - 100) * scale);
                    const plateH = 1840 * scale;
                    const plateY = y + 315 * scale;
                    ctx.fillStyle = '#f8fafc';
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(plateX, plateY, plateW, plateH);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Placa de Montagem', x + cabW / 2, plateY + 20 * scale);
                } else {
                    // Forma 1: borda 30mm + placa proporcional (sem zona de barramento)
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x + borderInset * scale, y + borderInset * scale, (cab.width - borderInset * 2) * scale, (cabHeight - borderInset * 2 - 100) * scale);
                    const plateH = (cabHeight - 150) * scale;
                    const plateY = y + 40 * scale;
                    ctx.fillStyle = '#f8fafc';
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(plateX, plateY, plateW, plateH);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Placa de Montagem', x + cabW / 2, plateY + 20 * scale);

                    // Barra Terra: apenas para CCM (não automação)
                    if (!cab._isAutomation) {
                        const barraTerraY = y + (cabHeight - 110) * scale;
                        ctx.save();
                        ctx.strokeStyle = '#94a3b8';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x, barraTerraY);
                        ctx.lineTo(x + cabW, barraTerraY);
                        ctx.stroke();
                        ctx.restore();
                        ctx.fillStyle = '#475569';
                        ctx.font = `${Math.round(8 * fontMult)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('Barra Terra', x + cabW / 2, barraTerraY + 50 * scale);
                    }
                }
                } // end !isForma34
            }

            // Base (cabHeight - 100mm) — comum a ambas as vistas
            const baseY = y + (cabHeight - 100) * scale;
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + cabW, baseY);
            ctx.stroke();
            ctx.restore();
            ctx.fillStyle = '#000';
            ctx.font = `${Math.round(8 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Base', x + cabW / 2, baseY + 50 * scale);

            // Cotas (30mm abaixo da base)
            const bottomY = baseY + 190 * scale;

            // Dimension label
            ctx.fillStyle = '#475569';
            ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(externalOnly ? (cab.width + 'mm × ' + cabHeight + 'mm') : (cab.width + ' mm'), x + cabW / 2, bottomY);

            if (!externalOnly && cab.calculatedWidth > 0 && Math.abs(cab.calculatedWidth - cab.width) > 20) {
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.round(8 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('(calc: ' + Math.ceil(cab.calculatedWidth) + 'mm)', x + cabW / 2, bottomY + Math.round(13 * fontMult));
            }

            if (!externalOnly) {
                this._drawVerticalDimensions(ctx, cab, x, y, scale, fontMult);
            }

            x += cabW + 0;
        }

        // Título da vista
        const totalWidthDraw = x - padding;
        if (totalWidthDraw > 0 && cabinets.length > 0) {
            const isRear = cabinets[0]._face === 'rear';
            let titulo;
            if (externalOnly) {
                titulo = isRear ? 'Vista Traseira Externa' : 'Vista Frontal Externa';
            } else {
                titulo = isRear ? 'Vista Traseira Interna' : 'Vista Frontal Interna';
            }
            ctx.fillStyle = '#1e293b';
            ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const cabMaxHeight = Math.max(...cabinets.map(c => c.height || 2300), 2300);
            ctx.fillText(titulo, padding + totalWidthDraw / 2, y + (cabMaxHeight + 180) * scale);
        }

        // Legend (apenas vista interna, exceto KitFrame)
        const allKitFrame = cabinets.length > 0 && cabinets.every(c => this._isForma34EstruturaModular(c.segregacao, c._fabricante));
        if (!externalOnly && !allKitFrame) {
            const legendY = CANVAS_HEIGHT - Math.round(14 * fontMult);
            ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            let lx = padding;
            const legendItems = [
                { label: 'Disjuntor', color: '#ef4444' },
                { label: 'Contator', color: '#3b82f6' },
                { label: 'Inv./S.Starter', color: '#f59e0b' },
                { label: 'Relé', color: '#8b5cf6' },
                { label: 'Borne', color: '#10b981' },
                { label: 'Fonte', color: '#ec4899' },
            ];
            for (const leg of legendItems) {
                const boxSize = Math.round(10 * fontMult);
                ctx.fillStyle = leg.color;
                ctx.fillRect(lx, legendY - boxSize / 2, boxSize, boxSize);
                ctx.fillStyle = '#64748b';
                ctx.fillText(leg.label, lx + boxSize + Math.round(4 * fontMult), legendY);
                lx += ctx.measureText(leg.label).width + boxSize + Math.round(28 * fontMult);
            }
        }
    },

    _getDefaultLayoutConfig() {
        return {
            canaletaEsq: 0,
            canaletaDir: 0,
            larguraTrilhoDIN: 35,
            espacamentoLinhas: 10,
            linhas: [
                { id: 'protecoes', nome: 'Proteções', yCentroTrilho: 525, categorias: ['DISJUNTOR', 'DISJUNTOR MOTOR', 'SECCIONADORA', 'FUSÍVEL'], temTrilho: true },
                { id: 'acionamentos', nome: 'Acionamentos', yCentroTrilho: 1025, categorias: ['CONTATOR', 'INVERSOR', 'SOFT-STARTER', 'SOFT STARTER'], temTrilho: true },
                { id: 'comandos', nome: 'Comandos / Automação', yCentroTrilho: 1500, categorias: ['RELÉ', 'RELE', 'FONTE', 'PLC', 'MÓDULO', 'MODULO'], temTrilho: true },
                { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1900, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
            ],
            gapsTermicos: {
                'DISJUNTOR': 10,
                'DISJUNTOR MOTOR': 10,
                'SECCIONADORA': 8,
                'FUSÍVEL': 8,
                'CONTATOR': 5,
                'INVERSOR': 15,
                'SOFT-STARTER': 10,
                'SOFT STARTER': 10,
                'RELÉ': 3,
                'RELE': 3,
                'FONTE': 8,
                'PLC': 5,
                'MÓDULO': 3,
                'MODULO': 3,
                'BORNE': 2,
                'BORNE PORTA-FUSÍVEL': 2,
                'Outros': 5
            },
            canaletas: [],
            retalhosCanaleta: [],
            comprimentoTrilho: 0,
            showSideView: false,
            sideViewCabinetIndex: -1,
            colunaCabosWidth: 200,

            doorLinhas: [
                { id: 'door_ihm', nome: 'IHM', yCentro: 200 },
                { id: 'door_comando', nome: 'Comando', yCentro: 600 },
                { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1200 }
            ]
        };
    },

    _getLayoutTemplates() {
        const predefined = [
            {
                id: 'ccm-forma1',
                nome: 'CCM — Forma 1',
                desc: 'CCM padrão sem separação entre barramentos',
                segregacao: 'Forma 1',
                config: {
                    canaletaEsq: 0, canaletaDir: 0, larguraTrilhoDIN: 35, espacamentoLinhas: 10, comprimentoTrilho: 0, colunaCabosWidth: 200,
                    linhas: [
                        { id: 'protecoes', nome: 'Proteções', yCentroTrilho: 525, categorias: ['DISJUNTOR', 'DISJUNTOR MOTOR', 'SECCIONADORA', 'FUSÍVEL'], temTrilho: true },
                        { id: 'acionamentos', nome: 'Acionamentos', yCentroTrilho: 1025, categorias: ['CONTATOR', 'INVERSOR', 'SOFT-STARTER', 'SOFT STARTER'], temTrilho: true },
                        { id: 'comandos', nome: 'Comandos / Automação', yCentroTrilho: 1500, categorias: ['RELÉ', 'RELE', 'FONTE', 'PLC', 'MÓDULO', 'MODULO'], temTrilho: true },
                        { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1900, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
                    ],
                    gapsTermicos: { 'DISJUNTOR': 10, 'DISJUNTOR MOTOR': 10, 'SECCIONADORA': 8, 'FUSÍVEL': 8, 'CONTATOR': 5, 'INVERSOR': 15, 'SOFT-STARTER': 10, 'SOFT STARTER': 10, 'RELÉ': 3, 'RELE': 3, 'FONTE': 8, 'PLC': 5, 'MÓDULO': 3, 'MODULO': 3, 'BORNE': 2, 'BORNE PORTA-FUSÍVEL': 2, 'Outros': 5 },
                    componentRules: [
                        { match: 'category', value: 'DISJUNTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'DISJUNTOR MOTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SECCIONADORA', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FUSÍVEL', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'CONTATOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'INVERSOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT-STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELÉ', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FONTE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'PLC', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MÓDULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MODULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE PORTA-FUSÍVEL', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                    ],
                    doorLinhas: [
                        { id: 'door_ihm', nome: 'IHM', yCentro: 200 },
                        { id: 'door_comando', nome: 'Comando', yCentro: 600 },
                        { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1200 }
                    ]
                }
            },
            {
                id: 'ccm-forma2',
                nome: 'CCM — Forma 2a/2b',
                desc: 'CCM com placa fixa e zona de barramento (Y=300)',
                segregacao: 'Forma 2a',
                config: {
                    canaletaEsq: 0, canaletaDir: 0, larguraTrilhoDIN: 35, espacamentoLinhas: 10, comprimentoTrilho: 0, colunaCabosWidth: 200,
                    linhas: [
                        { id: 'protecoes', nome: 'Proteções', yCentroTrilho: 525, categorias: ['DISJUNTOR', 'DISJUNTOR MOTOR', 'SECCIONADORA', 'FUSÍVEL'], temTrilho: true },
                        { id: 'acionamentos', nome: 'Acionamentos', yCentroTrilho: 1025, categorias: ['CONTATOR', 'INVERSOR', 'SOFT-STARTER', 'SOFT STARTER'], temTrilho: true },
                        { id: 'comandos', nome: 'Comandos / Automação', yCentroTrilho: 1500, categorias: ['RELÉ', 'RELE', 'FONTE', 'PLC', 'MÓDULO', 'MODULO'], temTrilho: true },
                        { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1900, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
                    ],
                    gapsTermicos: { 'DISJUNTOR': 10, 'DISJUNTOR MOTOR': 10, 'SECCIONADORA': 8, 'FUSÍVEL': 8, 'CONTATOR': 5, 'INVERSOR': 15, 'SOFT-STARTER': 10, 'SOFT STARTER': 10, 'RELÉ': 3, 'RELE': 3, 'FONTE': 8, 'PLC': 5, 'MÓDULO': 3, 'MODULO': 3, 'BORNE': 2, 'BORNE PORTA-FUSÍVEL': 2, 'Outros': 5 },
                    componentRules: [
                        { match: 'category', value: 'DISJUNTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'DISJUNTOR MOTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SECCIONADORA', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FUSÍVEL', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'CONTATOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'INVERSOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT-STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELÉ', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FONTE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'PLC', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MÓDULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MODULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE PORTA-FUSÍVEL', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                    ],
                    doorLinhas: [
                        { id: 'door_ihm', nome: 'IHM', yCentro: 200 },
                        { id: 'door_comando', nome: 'Comando', yCentro: 600 },
                        { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1200 }
                    ]
                }
            },
            {
                id: 'inversor',
                nome: 'Inversor de Frequência (IF)',
                desc: 'Painel com IF — gaps térmicos maiores para dissipação',
                segregacao: null,
                config: {
                    canaletaEsq: 0, canaletaDir: 0, larguraTrilhoDIN: 35, espacamentoLinhas: 10, comprimentoTrilho: 0, colunaCabosWidth: 400,
                    linhas: [
                        { id: 'protecoes', nome: 'Proteções', yCentroTrilho: 400, categorias: ['DISJUNTOR', 'DISJUNTOR MOTOR', 'SECCIONADORA', 'FUSÍVEL'], temTrilho: true },
                        { id: 'acionamentos', nome: 'Acionamentos', yCentroTrilho: 850, categorias: ['INVERSOR', 'CONTATOR', 'SOFT-STARTER', 'SOFT STARTER'], temTrilho: true },
                        { id: 'comandos', nome: 'Comandos / Automação', yCentroTrilho: 1400, categorias: ['RELÉ', 'RELE', 'FONTE', 'PLC', 'MÓDULO', 'MODULO'], temTrilho: true },
                        { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1900, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
                    ],
                    gapsTermicos: { 'DISJUNTOR': 15, 'DISJUNTOR MOTOR': 15, 'SECCIONADORA': 10, 'FUSÍVEL': 10, 'CONTATOR': 8, 'INVERSOR': 25, 'SOFT-STARTER': 15, 'SOFT STARTER': 15, 'RELÉ': 5, 'RELE': 5, 'FONTE': 10, 'PLC': 8, 'MÓDULO': 5, 'MODULO': 5, 'BORNE': 3, 'BORNE PORTA-FUSÍVEL': 3, 'Outros': 8 },
                    componentRules: [
                        { match: 'category', value: 'DISJUNTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'DISJUNTOR MOTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SECCIONADORA', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FUSÍVEL', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'INVERSOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'CONTATOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT-STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELÉ', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FONTE', linhaId: 'comandos', xOffset: 50, zOffset: 0, porta: false },
                        { match: 'category', value: 'PLC', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MÓDULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MODULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE PORTA-FUSÍVEL', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                    ],
                    doorLinhas: [
                        { id: 'door_ihm', nome: 'IHM', yCentro: 200 },
                        { id: 'door_comando', nome: 'Comando', yCentro: 600 },
                        { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1200 }
                    ]
                }
            },
            {
                id: 'softstarter',
                nome: 'Soft-Starter (SS)',
                desc: 'Painel com soft-starter — gaps intermediários',
                segregacao: null,
                config: {
                    canaletaEsq: 0, canaletaDir: 0, larguraTrilhoDIN: 35, espacamentoLinhas: 10, comprimentoTrilho: 0, colunaCabosWidth: 200,
                    linhas: [
                        { id: 'protecoes', nome: 'Proteções', yCentroTrilho: 475, categorias: ['DISJUNTOR', 'DISJUNTOR MOTOR', 'SECCIONADORA', 'FUSÍVEL'], temTrilho: true },
                        { id: 'acionamentos', nome: 'Acionamentos', yCentroTrilho: 950, categorias: ['SOFT-STARTER', 'SOFT STARTER', 'CONTATOR', 'INVERSOR'], temTrilho: true },
                        { id: 'comandos', nome: 'Comandos / Automação', yCentroTrilho: 1450, categorias: ['RELÉ', 'RELE', 'FONTE', 'PLC', 'MÓDULO', 'MODULO'], temTrilho: true },
                        { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1900, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
                    ],
                    gapsTermicos: { 'DISJUNTOR': 12, 'DISJUNTOR MOTOR': 12, 'SECCIONADORA': 8, 'FUSÍVEL': 8, 'CONTATOR': 8, 'INVERSOR': 18, 'SOFT-STARTER': 12, 'SOFT STARTER': 12, 'RELÉ': 5, 'RELE': 5, 'FONTE': 8, 'PLC': 5, 'MÓDULO': 3, 'MODULO': 3, 'BORNE': 2, 'BORNE PORTA-FUSÍVEL': 2, 'Outros': 5 },
                    componentRules: [
                        { match: 'category', value: 'DISJUNTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'DISJUNTOR MOTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SECCIONADORA', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FUSÍVEL', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT-STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'CONTATOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'INVERSOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELÉ', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FONTE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'PLC', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MÓDULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MODULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE PORTA-FUSÍVEL', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                    ],
                    doorLinhas: [
                        { id: 'door_ihm', nome: 'IHM', yCentro: 200 },
                        { id: 'door_comando', nome: 'Comando', yCentro: 600 },
                        { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1200 }
                    ]
                }
            },
            {
                id: 'partida-direta',
                nome: 'Partida Direta (PD/PDR)',
                desc: 'CCM compacto com contactores — gaps menores',
                segregacao: null,
                config: {
                    canaletaEsq: 0, canaletaDir: 0, larguraTrilhoDIN: 35, espacamentoLinhas: 10, comprimentoTrilho: 0, colunaCabosWidth: 200,
                    linhas: [
                        { id: 'protecoes', nome: 'Proteções', yCentroTrilho: 500, categorias: ['DISJUNTOR', 'DISJUNTOR MOTOR', 'SECCIONADORA', 'FUSÍVEL'], temTrilho: true },
                        { id: 'acionamentos', nome: 'Acionamentos', yCentroTrilho: 950, categorias: ['CONTATOR', 'SOFT-STARTER', 'SOFT STARTER', 'INVERSOR'], temTrilho: true },
                        { id: 'comandos', nome: 'Comandos / Automação', yCentroTrilho: 1400, categorias: ['RELÉ', 'RELE', 'FONTE', 'PLC', 'MÓDULO', 'MODULO'], temTrilho: true },
                        { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1850, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
                    ],
                    gapsTermicos: { 'DISJUNTOR': 8, 'DISJUNTOR MOTOR': 8, 'SECCIONADORA': 5, 'FUSÍVEL': 5, 'CONTATOR': 3, 'INVERSOR': 12, 'SOFT-STARTER': 8, 'SOFT STARTER': 8, 'RELÉ': 2, 'RELE': 2, 'FONTE': 5, 'PLC': 3, 'MÓDULO': 2, 'MODULO': 2, 'BORNE': 2, 'BORNE PORTA-FUSÍVEL': 2, 'Outros': 3 },
                    componentRules: [
                        { match: 'category', value: 'DISJUNTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'DISJUNTOR MOTOR', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SECCIONADORA', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FUSÍVEL', linhaId: 'protecoes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'CONTATOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT-STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SOFT STARTER', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'INVERSOR', linhaId: 'acionamentos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELÉ', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FONTE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'PLC', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MÓDULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MODULO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE PORTA-FUSÍVEL', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                    ],
                    doorLinhas: [
                        { id: 'door_ihm', nome: 'IHM', yCentro: 200 },
                        { id: 'door_comando', nome: 'Comando', yCentro: 600 },
                        { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1200 }
                    ]
                }
            },
            {
                id: 'plc-automacao',
                nome: 'PLC / Automação',
                desc: 'Rack de automação — sem bornes, foco em módulos PLC',
                segregacao: null,
                config: {
                    canaletaEsq: 0, canaletaDir: 0, larguraTrilhoDIN: 35, espacamentoLinhas: 10, comprimentoTrilho: 0, colunaCabosWidth: 200,
                    linhas: [
                        { id: 'alimentacao', nome: 'Alimentação', yCentroTrilho: 500, categorias: ['FONTE', 'DISJUNTOR', 'FUSÍVEL'], temTrilho: true },
                        { id: 'plc', nome: 'PLC / Controladores', yCentroTrilho: 1000, categorias: ['PLC', 'MÓDULO', 'MODULO', 'CPU', 'ENTRADA', 'SAÍDA', 'SAIDA'], temTrilho: true },
                        { id: 'comandos', nome: 'Comandos / Sinalização', yCentroTrilho: 1500, categorias: ['RELÉ', 'RELE', 'CONTATOR', 'LUMINOTECNICO'], temTrilho: true },
                        { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1900, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
                    ],
                    gapsTermicos: { 'DISJUNTOR': 8, 'DISJUNTOR MOTOR': 8, 'SECCIONADORA': 5, 'FUSÍVEL': 5, 'CONTATOR': 5, 'INVERSOR': 15, 'SOFT-STARTER': 10, 'SOFT STARTER': 10, 'RELÉ': 3, 'RELE': 3, 'FONTE': 5, 'PLC': 3, 'MÓDULO': 2, 'MODULO': 2, 'BORNE': 2, 'BORNE PORTA-FUSÍVEL': 2, 'Outros': 3 },
                    componentRules: [
                        { match: 'category', value: 'DISJUNTOR', linhaId: 'alimentacao', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FUSÍVEL', linhaId: 'alimentacao', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'FONTE', linhaId: 'alimentacao', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'PLC', linhaId: 'plc', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MÓDULO', linhaId: 'plc', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'MODULO', linhaId: 'plc', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'CPU', linhaId: 'plc', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'ENTRADA', linhaId: 'plc', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SAÍDA', linhaId: 'plc', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'SAIDA', linhaId: 'plc', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELÉ', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'RELE', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'CONTATOR', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'LUMINOTECNICO', linhaId: 'comandos', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                        { match: 'category', value: 'BORNE PORTA-FUSÍVEL', linhaId: 'bornes', xOffset: null, zOffset: 0, porta: false },
                    ],
                    doorLinhas: [
                        { id: 'door_ihm', nome: 'IHM', yCentro: 300 },
                        { id: 'door_comando', nome: 'Comando', yCentro: 800 },
                        { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1400 }
                    ]
                }
            }
        ];
        const custom = (store.getState?.().layoutTemplates || []).filter(t => t._isCustom);
        return [...predefined, ...custom];
    },

    _applyLayoutTemplate(templateId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const templates = this._getLayoutTemplates();
        const tmpl = templates.find(t => t.id === templateId);
        if (!tmpl) return;
        if (!confirm(`Aplicar template "${tmpl.nome}"?\n\nIsso substituirá as configurações de linhas, gaps e regras de componentes do layout atual.`)) return;
        if (!eq.layoutConfig) eq.layoutConfig = {};
        const cfgCopy = JSON.parse(JSON.stringify(tmpl.config));
        eq.layoutConfig.linhas = cfgCopy.linhas;
        eq.layoutConfig.gapsTermicos = cfgCopy.gapsTermicos;
        eq.layoutConfig.doorLinhas = cfgCopy.doorLinhas;
        eq.layoutConfig.canaletaEsq = cfgCopy.canaletaEsq;
        eq.layoutConfig.canaletaDir = cfgCopy.canaletaDir;
        eq.layoutConfig.larguraTrilhoDIN = cfgCopy.larguraTrilhoDIN;
        eq.layoutConfig.espacamentoLinhas = cfgCopy.espacamentoLinhas;
        eq.layoutConfig.colunaCabosWidth = cfgCopy.colunaCabosWidth;
        eq.layoutConfig.componentRules = cfgCopy.componentRules || [];
        eq.layoutConfig._activeTemplateId = tmpl.id;
        if (eq.layoutConfig.cabinetAssignments) {
            for (const cab of Object.values(eq.layoutConfig.cabinetAssignments)) {
                if (!cab.layoutConfig) cab.layoutConfig = {};
                cab.layoutConfig.linhas = JSON.parse(JSON.stringify(tmpl.config.linhas));
                cab.layoutConfig.gapsTermicos = JSON.parse(JSON.stringify(tmpl.config.gapsTermicos));
                cab.layoutConfig.componentRules = JSON.parse(JSON.stringify(tmpl.config.componentRules || []));
            }
        }
        this._applyComponentRules(eq);
        try { store.setState({ activeTechnicalProposal: { ...data } }); } catch (e) { console.warn('[Layout] store error:', e); }
        this._showLayoutConfigPanel();
        if (typeof app?.toast === 'function') app.toast(`Template "${tmpl.nome}" aplicado com sucesso!`, 'success');
    },

    _matchComponentRule(rule, material) {
        if (!rule || !material) return false;
        const cat = (material.categoria || '').toUpperCase();
        const desc = material.descricao || material.desc || '';
        const matId = material.id || material.materialId || '';
        switch (rule.match) {
            case 'category': return cat === (rule.value || '').toUpperCase();
            case 'materialId': return matId === rule.value;
            case 'pattern': try { return new RegExp(rule.value, 'i').test(desc); } catch { return false; }
            default: return false;
        }
    },

    _resolveComponentRule(componentRules, material) {
        if (!componentRules || !material) return null;
        for (const rule of componentRules) {
            if (this._matchComponentRule(rule, material)) {
                return { linhaId: rule.linhaId, xOffset: rule.xOffset ?? null, zOffset: rule.zOffset ?? null, porta: rule.porta || false, portaLinhaId: rule.portaLinhaId || null };
            }
        }
        return null;
    },

    _applyComponentRules(eq) {
        if (!eq?.layoutConfig?.componentRules) return;
        const rules = eq.layoutConfig.componentRules;
        const materiais = store.getState().materiais || [];
        const ass = eq.layoutConfig.cabinetAssignments;
        if (!ass) return;
        for (const cab of Object.values(ass)) {
            const targets = [cab, ...(cab.faces?.front ? [cab.faces.front] : []), ...(cab.faces?.rear ? [cab.faces.rear] : [])];
            for (const target of targets) {
                if (!target?.loads) continue;
                for (const loadTag of Object.keys(target.loads)) {
                    for (const [matId, entry] of Object.entries(target.loads[loadTag])) {
                        const mat = materiais.find(m => m.id === matId);
                        if (!mat) continue;
                        const resolved = this._resolveComponentRule(rules, mat);
                        if (resolved) {
                            if (resolved.linhaId) entry.linhaId = resolved.linhaId;
                            if (resolved.xOffset != null) entry.xOffset = resolved.xOffset;
                            if (resolved.zOffset != null) entry.zOffset = resolved.zOffset;
                            if (resolved.porta) entry.porta = true;
                            if (resolved.portaLinhaId) entry.portaLinhaId = resolved.portaLinhaId;
                        }
                    }
                }
            }
        }
    },

    _addComponentRule() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!eq.layoutConfig) eq.layoutConfig = {};
        if (!eq.layoutConfig.componentRules) eq.layoutConfig.componentRules = [];
        const linhas = eq.layoutConfig.linhas || this._getDefaultLayoutConfig().linhas;
        const linhaOpts = linhas.map(l => `${l.id}:${l.nome}`).join(', ');
        const input = prompt(
            `Nova regra de posicionamento.\n\nTipos de match:\n- category:CATEGORIA (ex: category:INVERSOR)\n- materialId:ID (ex: materialId:mat-dj-32)\n- pattern:regex (ex: pattern:inversor.*150cv)\n\nLinhas disponíveis: ${linhaOpts}\n\nFormato: match|linhaId|xOffset|zOffset|porta\nExemplo: category:INVERSOR|acionamentos|null|0|false`
        );
        if (!input) return;
        const parts = input.split('|');
        if (parts.length < 3) { app.toast('Formato inválido. Use: match|linhaId|xOffset|zOffset|porta', 'error'); return; }
        const [matchType, ...rest] = parts[0].split(':');
        const matchValue = rest.join(':');
        const linhaId = parts[1] || null;
        const xOffset = parts[2] === 'null' || parts[2] === '' ? null : parseInt(parts[2]) || null;
        const zOffset = parts[3] === 'null' || parts[3] === '' ? null : parseInt(parts[3]) || null;
        const porta = parts[4] === 'true';
        eq.layoutConfig.componentRules.push({ match: matchType, value: matchValue, linhaId, xOffset, zOffset, porta });
        try { store.setState({ activeTechnicalProposal: { ...data } }); } catch (e) { console.warn('[Layout] store error:', e); }
        this._showLayoutConfigPanel();
        if (typeof app?.toast === 'function') app.toast('Regra adicionada!', 'success');
    },

    _removeComponentRule(idx) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq?.layoutConfig?.componentRules) return;
        eq.layoutConfig.componentRules.splice(idx, 1);
        try { store.setState({ activeTechnicalProposal: { ...data } }); } catch (e) { console.warn('[Layout] store error:', e); }
        this._showLayoutConfigPanel();
    },

    _saveLayoutTemplate() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const nome = prompt('Nome do template personalizado:');
        if (!nome || !nome.trim()) return;
        const desc = prompt('Descrição (opcional):') || '';
        const seg = eq.technical?.segregacao || '';
        const tipo = eq.technical?.tipoPartida || eq.loads?.[0]?.type || '';
        const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const template = {
            id,
            nome: nome.trim(),
            desc: desc.trim() || `Personalizado — ${seg || 'Geral'}`,
            segregacao: seg || null,
            _isCustom: true,
            config: {
                canaletaEsq: eq.layoutConfig?.canaletaEsq ?? 0,
                canaletaDir: eq.layoutConfig?.canaletaDir ?? 0,
                larguraTrilhoDIN: eq.layoutConfig?.larguraTrilhoDIN ?? 35,
                espacamentoLinhas: eq.layoutConfig?.espacamentoLinhas ?? 10,
                comprimentoTrilho: eq.layoutConfig?.comprimentoTrilho ?? 0,
                colunaCabosWidth: eq.layoutConfig?.colunaCabosWidth ?? 200,
                linhas: JSON.parse(JSON.stringify(eq.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas)),
                gapsTermicos: JSON.parse(JSON.stringify(eq.layoutConfig?.gapsTermicos || this._getDefaultLayoutConfig().gapsTermicos)),
                componentRules: JSON.parse(JSON.stringify(eq.layoutConfig?.componentRules || [])),
                doorLinhas: JSON.parse(JSON.stringify(eq.layoutConfig?.doorLinhas || this._getDefaultLayoutConfig().doorLinhas)),
            }
        };
        const templates = [...(store.getState().layoutTemplates || []), template];
        store.setState({ layoutTemplates: templates });
        store._syncCreate?.('layoutTemplates', template);
        eq.layoutConfig._activeTemplateId = id;
        try { store.setState({ activeTechnicalProposal: { ...data } }); } catch (e) { console.warn('[Layout] store error:', e); }
        this._showLayoutConfigPanel();
        if (typeof app?.toast === 'function') app.toast(`Template "${nome}" salvo com sucesso!`, 'success');
    },

    _deleteLayoutTemplate(templateId) {
        const templates = store.getState().layoutTemplates || [];
        const tmpl = templates.find(t => t.id === templateId);
        if (!tmpl) return;
        if (!confirm(`Excluir template "${tmpl.nome}"?`)) return;
        const updated = templates.filter(t => t.id !== templateId);
        store.setState({ layoutTemplates: updated });
        store._syncDelete?.('layoutTemplates', templateId);
        if (typeof app?.toast === 'function') app.toast(`Template "${tmpl.nome}" excluído.`, 'success');
        this._showLayoutConfigPanel();
    },

    _getModelosCanaleta() {
        return [
            { id: '30x50', largura: 30, altura: 50 },
            { id: '30x80', largura: 30, altura: 80 },
            { id: '50x50', largura: 50, altura: 50 },
            { id: '50x80', largura: 50, altura: 80 },
            { id: '80x50', largura: 80, altura: 50 },
            { id: '80x80', largura: 80, altura: 80 },
        ];
    },

    _calcularConsumoCanaletas(canaletas) {
        let total = 0;
        const CONNECTOR_LOSS = 0;
        for (const can of canaletas || []) {
            if (can.tipo === 'quadro' && can.segmentos) {
                for (const seg of can.segmentos) {
                    total += seg.comprimento || 0;
                }
            } else if (can.tipo === 'linear') {
                total += can.comprimento || 0;
            }
        }
        const BARRA = 2000;
        const barras = Math.ceil(total / BARRA);
        const sobra = Math.max(0, barras * BARRA - total);
        return { totalComprimento: total, barras, sobra };
    },

    _drawQuadroCanaleta(ctx, can, cabX, cabY, scale, fontMult) {
        const fx = cabX / scale + (can.x || 0);
        const fy = cabY / scale + (can.y || 0);
        const W = can.larguraQuadro || 500;
        const H = can.alturaQuadro || 1800;
        const L = can.largura_base || 50;

        const sx = fx * scale, sy = fy * scale;
        const sw = W * scale, sh = H * scale;
        const sl = L * scale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(sx, sy, sw, sh);
        ctx.rect(sx + sl, sy + sl, sw - 2 * sl, sh - 2 * sl);
        ctx.clip('evenodd');

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(sx, sy, sw, sh);

        ctx.strokeStyle = 'rgba(100,116,139,0.2)';
        ctx.lineWidth = 0.3;
        const step = 6 * fontMult;
        for (let iy = sy; iy < sy + sh; iy += step) {
            ctx.beginPath(); ctx.moveTo(sx, iy); ctx.lineTo(sx + sw, iy + step); ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.strokeRect(sx + sl, sy + sl, sw - 2 * sl, sh - 2 * sl);

        ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(sx + sl, sy + sl);
        ctx.moveTo(sx + sw, sy); ctx.lineTo(sx + sw - sl, sy + sl);
        ctx.moveTo(sx + sw, sy + sh); ctx.lineTo(sx + sw - sl, sy + sh - sl);
        ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sl, sy + sh - sl);
        ctx.stroke();

        if (W > 60 && H > 40) {
            ctx.fillStyle = '#475569';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(can.modelo || '', sx + sw / 2, sy + sh / 2);
        }
    },

    _drawCanaletaSegment(ctx, seg, scale, fontMult) {
        const { x: sx, y: sy, comprimento, largura, orientacao } = seg;
        const sw = orientacao === 'H' ? comprimento : largura;
        const sh = orientacao === 'H' ? largura : comprimento;

        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.5;
        ctx.fillRect(sx * scale, sy * scale, sw * scale, sh * scale);
        ctx.strokeRect(sx * scale, sy * scale, sw * scale, sh * scale);

        if (sw * scale > 20 && sh * scale > 8) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(sx * scale, sy * scale, sw * scale, sh * scale);
            ctx.clip();
            ctx.strokeStyle = 'rgba(100,116,139,0.2)';
            ctx.lineWidth = 0.3;
            const step = 6 * fontMult;
            if (orientacao === 'H') {
                for (let ix = sx * scale; ix < (sx + sw) * scale; ix += step) {
                    ctx.beginPath(); ctx.moveTo(ix, sy * scale); ctx.lineTo(ix + step, (sy + sh) * scale); ctx.stroke();
                }
            } else {
                for (let iy = sy * scale; iy < (sy + sh) * scale; iy += step) {
                    ctx.beginPath(); ctx.moveTo(sx * scale, iy); ctx.lineTo((sx + sw) * scale, iy + step); ctx.stroke();
                }
            }
            ctx.restore();
        }

        if (sw * scale > 30 && sh * scale > 12) {
            ctx.fillStyle = '#475569';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seg.modelo || '', (sx + sw / 2) * scale, (sy + sh / 2) * scale);
        }
    },

    _drawVerticalDimensions(ctx, cab, x, y, scale, fontMult) {
        const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();
        const cabHeight = cab.height || 2300;
        const canEsq = cfg.canaletaEsq || 0;
        const dimX = canEsq >= 20 ? x + canEsq * 0.55 * scale : x - 6 * scale;
        const marks = [];

        marks.push({ y: 0 });

        const isForma2 = cab.segregacao === 'Forma 2a' || cab.segregacao === 'Forma 2b';
        if (isForma2) {
            marks.push({ y: 300 });
        }

        for (const linha of cfg.linhas || []) {
            const yc = linha.yCentroTrilho ?? Math.round(((linha.yInicio || 0) + (linha.yFim || 0)) / 2);
            marks.push({ y: yc, label: linha.nome });
        }

        for (const can of cfg.canaletas || []) {
            if (can.tipo === 'quadro') {
                const t = can.y || 300;
                const b = t + (can.alturaQuadro || 1800);
                marks.push({ y: t, canaleta: true, label: 'Quadro' });
                marks.push({ y: b, canaleta: true });
            } else if (can.tipo === 'linear' && can.orientacao === 'V') {
                marks.push({ y: can.y, canaleta: true, label: 'Canaleta' });
                marks.push({ y: can.y + can.comprimento, canaleta: true });
            }
        }

        if (!isForma2 && !cab._isAutomation) {
            marks.push({ y: cabHeight - 110, label: 'Barra Terra' });
        }
        marks.push({ y: cabHeight - 100, label: 'Base' });
        marks.push({ y: cabHeight });

        marks.sort((a, b) => a.y - b.y);
        const merged = [];
        for (const m of marks) {
            if (merged.length === 0 || Math.abs(m.y - merged[merged.length - 1].y) > 3) {
                merged.push({ ...m });
            } else if (m.label && !merged[merged.length - 1].label) {
                merged[merged.length - 1].label = m.label;
                merged[merged.length - 1].canaleta = merged[merged.length - 1].canaleta || m.canaleta;
            }
        }
        if (merged.length < 2) return;

        ctx.save();

        const tickLen = Math.max(3 * fontMult, 5);
        const gap = Math.max(2 * fontMult, 3);

        const y0 = y + merged[0].y * scale;
        const y1 = y + merged[merged.length - 1].y * scale;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(dimX, y0);
        ctx.lineTo(dimX, y1);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `${Math.round(5.5 * fontMult)}px sans-serif`;
        ctx.textBaseline = 'middle';

        for (let i = 0; i < merged.length; i++) {
            const m = merged[i];
            const py = y + m.y * scale;
            if (py < y - 10) continue;

            const isCanaleta = m.canaleta;
            ctx.strokeStyle = isCanaleta ? '#0e7490' : '#64748b';
            ctx.lineWidth = isCanaleta ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(dimX - tickLen, py);
            ctx.lineTo(dimX + tickLen, py);
            ctx.stroke();

            ctx.textAlign = 'right';
            ctx.fillStyle = isCanaleta ? '#0e7490' : '#64748b';
            ctx.fillText(m.y + '', dimX - tickLen - gap, py);

            if (m.label && !/^\d+$/.test(m.label)) {
                ctx.textAlign = 'left';
                ctx.fillStyle = isCanaleta ? '#0e7490' : '#64748b';
                ctx.fillText(m.label, dimX + tickLen + gap, py);
            }

            if (i < merged.length - 1) {
                const nextPy = y + merged[i + 1].y * scale;
                const midY = (py + nextPy) / 2;
                const diff = merged[i + 1].y - merged[i].y;
                if (diff >= 20 && midY >= y) {
                    ctx.fillStyle = '#475569';
                    const fontSize = Math.round(5 * fontMult);
                    ctx.font = `${fontSize}px sans-serif`;
                    const labelW = m.label && !/^\d+$/.test(m.label)
                        ? ctx.measureText(m.label).width + gap * 2 : 0;
                    ctx.textAlign = 'left';
                    ctx.fillText(diff + 'mm', dimX + tickLen + gap + labelW, midY);
                    ctx.font = `${Math.round(5.5 * fontMult)}px sans-serif`;
                }
            }
        }

        ctx.restore();
    },

    _adicionarLinhaLayout(cabId) {
        const selector = cabId
            ? `.cab-config-block[data-cab-id="${cabId}"] .cab-linhas-tbody`
            : '#_layout_config_overlay .cab-linhas-tbody';
        const tbody = document.querySelector(selector);
        if (!tbody) return;
        const i = tbody.children.length;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td style="display:none;"><input type="hidden" class="lcfg_id" value=""></td>
                <td><input type="text" class="form-control lcfg_nome" value="Nova" style="width:120px;font-size:12px;"></td>
                <td><input type="number" class="form-control lcfg_yCentro" value="1000" style="width:70px;font-size:12px;"></td>
                <td style="text-align:center;"><input type="checkbox" class="lcfg_trilho" checked style="width:16px;height:16px;cursor:pointer;"></td>
                <td><input type="text" class="form-control lcfg_cats" value="" style="width:160px;font-size:12px;"></td>
                <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
            </tr>
        `);
    },

    _adicionarLinhaPortaLayout(cabId) {
        const selector = cabId
            ? `.cab-config-block[data-cab-id="${cabId}"] .cab-door-linhas-tbody`
            : '#_layout_config_overlay .cab-door-linhas-tbody';
        const tbody = document.querySelector(selector);
        if (!tbody) return;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td style="display:none;"><input type="hidden" class="dlcfg_id" value=""></td>
                <td><input type="text" class="form-control dlcfg_nome" value="Nova Faixa" style="width:140px;font-size:12px;"></td>
                <td><input type="number" class="form-control dlcfg_yCentro" value="800" style="width:70px;font-size:12px;"></td>
                <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
            </tr>
        `);
    },

    _getCanaletaTarget(eq, cabId) {
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0] || cabId;
        const face = parts[1] || null;
        if (actualCabId) {
            const cab = eq.layoutConfig?.cabinetAssignments?.[actualCabId];
            if (cab) {
                if (face && cab.faces?.[face]) {
                    const fc = cab.faces[face];
                    if (!fc.layoutConfig) fc.layoutConfig = this._getDefaultLayoutConfig();
                    if (!fc.layoutConfig.canaletas) fc.layoutConfig.canaletas = [];
                    return fc.layoutConfig;
                }
                if (!cab.layoutConfig) cab.layoutConfig = this._getDefaultLayoutConfig();
                if (!cab.layoutConfig.canaletas) cab.layoutConfig.canaletas = [];
                return cab.layoutConfig;
            }
        }
        return eq.layoutConfig || this._getDefaultLayoutConfig();
    },

    _editarCanaleta(canId, cabId) {
        console.log('[Edit] canId:', canId, 'cabId:', cabId, 'idx:', this.activeEquipmentIndex);
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        console.log('[Edit] eq:', !!eq);
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        console.log('[Edit] cfg keys:', Object.keys(cfg), 'canaletas:', cfg.canaletas?.length);
        console.log('[Edit] IDs no cfg.canaletas:', (cfg.canaletas || []).map(c => c.id));
        const can = (cfg.canaletas || []).find(c => c.id === canId);
        console.log('[Edit] can found:', !!can);
        if (!can) return;
        console.log('[Edit] tipo:', can.tipo);
        if (can.tipo === 'quadro') {
            this._adicionarQuadroCanaleta(cabId, can);
        } else {
            this._adicionarPecaRetaCanaleta(cabId, can);
        }
    },

    _refreshCanaletasList(cabId) {
        const listEl = Array.from(document.querySelectorAll('.cab-config-block'))
            .find(el => el.getAttribute('data-cab-id') === cabId)
            ?.querySelector('.cab-canaletas-list');
        if (!listEl) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        const canaletas = cfg.canaletas || [];
        const html = canaletas.length === 0
            ? '<div style="font-size:11px;color:#94a3b8;padding:4px 0;">Nenhuma canaleta adicional.</div>'
            : canaletas.map(can => {
                const detalhe = can.tipo === 'quadro'
                    ? `${can.modelo}, ${can.larguraQuadro}x${can.alturaQuadro}mm`
                    : `${can.modelo}, ${can.orientacao === 'V' ? 'Vertical' : 'Horizontal'}, ${can.comprimento}mm`;
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;background:#f8fafc;border-radius:4px;margin-bottom:2px;font-size:11px;">
                            <span>${can.tipo === 'quadro' ? '📐' : '📏'} ${detalhe}</span>
                            <div>
                                <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._editarCanaleta('${can.id}','${cabId}')" style="color:#3b82f6;font-size:10px;">✏️</button>
                                <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._removerCanaleta('${can.id}','${cabId}')" style="color:#ef4444;font-size:10px;">✕</button>
                            </div>
                        </div>`;
            }).join('');
        listEl.innerHTML = html;
    },

    _adicionarQuadroCanaleta(cabId, editCan = null) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelos = this._getModelosCanaleta();
        const editModelo = editCan ? editCan.modelo : null;
        const opts = modelos.map(m => `<option value="${m.id}" ${editModelo === m.id ? 'selected' : ''}>${m.id} (${m.largura}x${m.altura}mm)</option>`).join('');

        const isEdit = !!editCan;
        const title = isEdit ? 'Editar Quadro de Canaletas' : 'Adicionar Quadro de Canaletas';
        const btnText = isEdit ? 'Salvar' : 'Adicionar';
        const wVal = editCan ? editCan.larguraQuadro : 500;
        const hVal = editCan ? editCan.alturaQuadro : 1800;

        const dlg = document.createElement('div');
        dlg.id = '_can_frame_dlg';
        dlg.dataset.cabId = cabId || '';
        if (isEdit) dlg.dataset.editId = editCan.id;
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        dlg.innerHTML = `
            <div style="background:white;border-radius:12px;padding:24px;max-width:480px;width:90%;">
                <h3 style="margin:0 0 16px;">${title}</h3>
                <div class="form-group"><label class="form-label">Modelo</label><select id="can_frame_model" class="form-control">${opts}</select></div>
                <div style="display:flex;gap:12px;">
                    <div class="form-group" style="flex:1;"><label class="form-label">Largura (mm)</label><input type="number" id="can_frame_w" class="form-control" value="${wVal}" min="100"></div>
                    <div class="form-group" style="flex:1;"><label class="form-label">Altura (mm)</label><input type="number" id="can_frame_h" class="form-control" value="${hVal}" min="100"></div>
                </div>
                <div style="font-size:11px;color:#64748b;margin:4px 0 16px;">Posicionado nas bordas da área útil (Y=315-2155mm). Esta é a área útil para uso de canaleta. O ponto "0" superior para canaleta é x=50, y=315</div>
                <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_can_frame_dlg').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._confirmQuadroCanaleta()">${btnText}</button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _confirmQuadroCanaleta() {
        const dlg = document.getElementById('_can_frame_dlg');
        if (!dlg) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cabId = dlg.dataset.cabId;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelId = document.getElementById('can_frame_model')?.value;
        const frameW = parseInt(document.getElementById('can_frame_w')?.value) || 500;
        const frameH = parseInt(document.getElementById('can_frame_h')?.value) || 1800;
        const modelo = this._getModelosCanaleta().find(m => m.id === modelId);
        if (!modelo) { dlg.remove(); return; }

        const l = modelo.largura;
        const editId = dlg.dataset.editId || null;
        if (editId) {
            const idx = cfg.canaletas.findIndex(c => c.id === editId);
            if (idx === -1) { dlg.remove(); return; }
            cfg.canaletas[idx] = {
                ...cfg.canaletas[idx],
                modelo: modelId,
                largura_base: l,
                profundidade: modelo.altura,
                larguraQuadro: frameW,
                alturaQuadro: frameH,
                segmentos: [
                    { id: editId + '_v1', orientacao: 'V', x: 50, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tl,bl' },
                    { id: editId + '_v2', orientacao: 'V', x: 50 + frameW - l, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tr,br' },
                    { id: editId + '_h1', orientacao: 'H', x: 50, y: 315, comprimento: frameW, largura: l, modelo: modelId, miter: 'tl,tr' },
                    { id: editId + '_h2', orientacao: 'H', x: 50, y: 315 + frameH - l, comprimento: frameW, largura: l, modelo: modelId, miter: 'bl,br' },
                ]
            };
        } else {
            const id = 'can_' + Date.now();
            cfg.canaletas.push({
                id, tipo: 'quadro', modelo: modelId,
                largura_base: l, profundidade: modelo.altura,
                x: 50, y: 315, larguraQuadro: frameW, alturaQuadro: frameH,
                segmentos: [
                    { id: id + '_v1', orientacao: 'V', x: 50, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tl,bl' },
                    { id: id + '_v2', orientacao: 'V', x: 50 + frameW - l, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tr,br' },
                    { id: id + '_h1', orientacao: 'H', x: 50, y: 315, comprimento: frameW, largura: l, modelo: modelId, miter: 'tl,tr' },
                    { id: id + '_h2', orientacao: 'H', x: 50, y: 315 + frameH - l, comprimento: frameW, largura: l, modelo: modelId, miter: 'bl,br' },
                ]
            });
        }
        dlg.remove();
        this._refreshCanaletasList(cabId);
        this._recalcularLayout();
    },

    _adicionarPecaRetaCanaleta(cabId, editCan = null) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelos = this._getModelosCanaleta();
        const editModelo = editCan ? editCan.modelo : null;
        const opts = modelos.map(m => `<option value="${m.id}" ${editModelo === m.id ? 'selected' : ''}>${m.id} (${m.largura}x${m.altura}mm)</option>`).join('');

        const isEdit = !!editCan;
        const title = isEdit ? 'Editar Peça Reta de Canaleta' : 'Adicionar Peça Reta de Canaleta';
        const btnText = isEdit ? 'Salvar' : 'Adicionar';
        const orientV = editCan && editCan.orientacao === 'V';
        const orientH = editCan && editCan.orientacao === 'H';
        const compVal = editCan ? editCan.comprimento : 500;
        const xVal = editCan ? editCan.x : 50;
        const yVal = editCan ? editCan.y : 315;

        const dlg = document.createElement('div');
        dlg.id = '_can_lin_dlg';
        dlg.dataset.cabId = cabId || '';
        if (isEdit) dlg.dataset.editId = editCan.id;
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        dlg.innerHTML = `
            <div style="background:white;border-radius:12px;padding:24px;max-width:480px;width:90%;">
                <h3 style="margin:0 0 16px;">${title}</h3>
                <div class="form-group"><label class="form-label">Modelo</label><select id="can_lin_model" class="form-control">${opts}</select></div>
                <div style="display:flex;gap:12px;">
                    <div class="form-group" style="flex:1;"><label class="form-label">Orientação</label><select id="can_lin_orient" class="form-control"><option value="V" ${orientV ? 'selected' : ''}>Vertical</option><option value="H" ${orientH ? 'selected' : ''}>Horizontal</option></select></div>
                    <div class="form-group" style="flex:1;"><label class="form-label">Comprimento (mm)</label><input type="number" id="can_lin_comp" class="form-control" value="${compVal}" min="50"></div>
                </div>
                <div style="display:flex;gap:12px;">
                    <div class="form-group" style="flex:1;"><label class="form-label">Posição X (mm)</label><input type="number" id="can_lin_x" class="form-control" value="${xVal}" min="0"></div>
                    <div class="form-group" style="flex:1;"><label class="form-label">Posição Y (mm)</label><input type="number" id="can_lin_y" class="form-control" value="${yVal}" min="300"></div>
                </div>
                <div style="font-size:11px;color:#64748b;margin:4px 0 16px;">Posição relativa ao canto superior esquerdo do armário.</div>
                <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_can_lin_dlg').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._confirmPecaRetaCanaleta()">${btnText}</button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _confirmPecaRetaCanaleta() {
        const dlg = document.getElementById('_can_lin_dlg');
        if (!dlg) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cabId = dlg.dataset.cabId;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelId = document.getElementById('can_lin_model')?.value;
        const orient = document.getElementById('can_lin_orient')?.value || 'V';
        const comp = parseInt(document.getElementById('can_lin_comp')?.value) || 500;
        const px = parseInt(document.getElementById('can_lin_x')?.value) || 0;
        const py = parseInt(document.getElementById('can_lin_y')?.value) || 300;
        const modelo = this._getModelosCanaleta().find(m => m.id === modelId);
        if (!modelo) { dlg.remove(); return; }

        const editId = dlg.dataset.editId || null;
        if (editId) {
            const idx = cfg.canaletas.findIndex(c => c.id === editId);
            if (idx === -1) { dlg.remove(); return; }
            cfg.canaletas[idx] = {
                ...cfg.canaletas[idx],
                modelo: modelId,
                largura_base: modelo.largura,
                profundidade: modelo.altura,
                orientacao: orient,
                x: px, y: py,
                comprimento: comp
            };
        } else {
            cfg.canaletas.push({
                id: 'can_' + Date.now(), tipo: 'linear', modelo: modelId,
                largura_base: modelo.largura, profundidade: modelo.altura,
                orientacao: orient, x: px, y: py, comprimento: comp
            });
        }
        dlg.remove();
        this._refreshCanaletasList(cabId);
        this._recalcularLayout();
    },

    _removerCanaleta(canId, cabId) {
        console.log('[Remover] canId:', canId, 'cabId:', cabId, 'idx:', this.activeEquipmentIndex);
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        console.log('[Remover] eq:', !!eq);
        if (!eq) return;
        const target = this._getCanaletaTarget(eq, cabId);
        console.log('[Remover] target:', !!target, 'canaletas:', target?.canaletas?.length);
        console.log('[Remover] IDs no target.canaletas:', (target?.canaletas || []).map(c => c.id));
        if (!target || !target.canaletas) return;
        console.log('[Remover] removing:', target.canaletas.some(c => c.id === canId));
        target.canaletas = target.canaletas.filter(c => c.id !== canId);
        const overlay = document.getElementById('_layout_config_overlay');
        if (overlay) overlay.remove();
        this._recalcularLayout();
    },

    _adicionarArmario() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};

        const seg = eq.technical?.segregacao || '';
        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const isKitFrame = this._isForma34EstruturaModular(seg, eq.technical?.fabricante);
        const defaultHeight = isForma2 ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100;
        const alturaOptions = [1600, 1800, 2000, 2300].map(h =>
            `<option value="${h}" ${h === defaultHeight ? 'selected' : ''}>${h} mm</option>`
        ).join('');

        const currentCCW = 300;
        const existingCount = Object.keys(layoutConfig.cabinetAssignments).length;
        const defaultNome = isKitFrame ? 'Coluna ' + String(existingCount + 1).padStart(2, '0') : 'Novo Armário';

        const dlg = document.createElement('div');
        dlg.id = '_armario_add_dlg';
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        dlg.innerHTML = `
            <div style="background:white;border-radius:12px;padding:24px;max-width:400px;width:90%;">
                <h3 style="margin:0 0 16px;">Adicionar Armário</h3>
                <div class="form-group"><label class="form-label">Nome do Armário</label><input type="text" id="arm_add_nome" class="form-control" value="${defaultNome}" style="font-size:13px;"></div>
                ${isKitFrame ? `
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Altura</label>
                    <div style="font-size:13px;padding:6px 0;color:#475569;font-weight:600;">2300 mm</div>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Coluna de Cabos (mm)</label>
                    <select id="arm_add_ccw" class="form-control" style="font-size:13px;">
                        <option value="200" ${currentCCW === 200 ? 'selected' : ''}>200 mm</option>
                        <option value="300" ${currentCCW === 300 ? 'selected' : ''}>300 mm</option>
                        <option value="400" ${currentCCW === 400 ? 'selected' : ''}>400 mm</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Profundidade (mm)</label>
                    <select id="arm_add_profundidade" class="form-control" style="font-size:13px;">
                        <option value="600" selected>600 mm</option>
                        <option value="800">800 mm</option>
                    </select>
                </div>
                ` : `
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Altura (mm)</label>
                    <select id="arm_add_altura" class="form-control" style="font-size:13px;">
                        ${isForma2 ? `<option value="2300" selected>2300 mm</option>` : alturaOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Largura (mm)</label>
                    <select id="arm_add_largura" class="form-control" style="font-size:13px;">
                        <option value="400">400 mm</option>
                        <option value="600" selected>600 mm</option>
                        <option value="800">800 mm</option>
                        <option value="1000">1000 mm</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Profundidade (mm)</label>
                    <select id="arm_add_profundidade" class="form-control" style="font-size:13px;">
                        <option value="400">400 mm</option>
                        <option value="600" selected>600 mm</option>
                        <option value="800">800 mm</option>
                        <option value="1000">1000 mm</option>
                        <option value="1200">1200 mm</option>
                    </select>
                </div>
                `}
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_armario_add_dlg').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._confirmAdicionarArmario()">Adicionar</button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _confirmAdicionarArmario() {
        const dlg = document.getElementById('_armario_add_dlg');
        if (!dlg) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const seg = eq.technical?.segregacao || '';
        const isKitFrame = this._isForma34EstruturaModular(seg, eq.technical?.fabricante);

        const nome = document.getElementById('arm_add_nome')?.value?.trim() || 'Armário';
        const depth = parseInt(document.getElementById('arm_add_profundidade')?.value) || 600;
        const cabId = 'cab_' + Date.now();
        const cabConfig = JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()));

        let height, width;
        if (isKitFrame) {
            height = 2300;
            const ccw = parseInt(document.getElementById('arm_add_ccw')?.value) || 200;
            width = 600 + ccw;
            cabConfig.colunaCabosWidth = ccw;
            if (eq.layoutConfig) eq.layoutConfig.colunaCabosWidth = ccw;
        } else {
            height = parseInt(document.getElementById('arm_add_altura')?.value) || 2300;
            width = parseInt(document.getElementById('arm_add_largura')?.value) || 600;
        }

        layoutConfig.cabinetAssignments[cabId] = {
            name: nome, height, width, depth,
            faces: {
                front: { loads: {}, layoutConfig: null },
                rear: { loads: {}, layoutConfig: null }
            },
            layoutConfig: cabConfig
        };
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        dlg.remove();

        const configOverlay = document.getElementById('_layout_config_overlay');
        const wasInConfigMode = !!configOverlay;
        if (wasInConfigMode) configOverlay.remove();

        this._recalcularLayout();
        this.renderSubTab();

        if (wasInConfigMode) this._showLayoutConfigPanel();
    },

    _removerArmario(cabId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig;
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig?.cabinetAssignments?.[actualCabId]) return;
        const cabName = layoutConfig.cabinetAssignments[actualCabId].name || actualCabId;
        if (!confirm(`Remover armário "${cabName}"? Os materiais alocados voltam para a lista disponível.`)) return;
        delete layoutConfig.cabinetAssignments[actualCabId];
        if (Object.keys(layoutConfig.cabinetAssignments).length === 0) {
            delete layoutConfig.cabinetAssignments;
        }
        this._recalcularLayout();
        this.renderSubTab();
    },

    _setLarguraArmario(cabId, width) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].width = parseInt(width) || 600;
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setAlturaArmario(cabId, height) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].height = parseInt(height) || 2300;
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setProfundidadeArmario(cabId, depth) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].depth = parseInt(depth) || 600;
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setNomeArmario(cabId, nome) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].name = nome || 'Armário';
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _getLayoutLinhas(layoutConfig, categoria) {
        const cat = (categoria || '').toUpperCase();
        const linhas = layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;
        for (const linha of linhas) {
            if (linha.categorias.some(c => cat.includes(c))) return linha;
        }
        return null;
    },

    _getLinhaParaItem(layoutConfig, categoria, item, lineItemCount) {
        const cat = (categoria || '').toUpperCase();
        const linhas = layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;

        if (item && item._linhaId) {
            const found = linhas.find(l => l.id === item._linhaId);
            if (found) return found;
        }

        // Check componentRules from template
        const rules = layoutConfig?.componentRules;
        if (rules && item) {
            const mat = store.getState().materiais?.find(m => m.id === item._matId);
            if (mat) {
                const resolved = this._resolveComponentRule(rules, mat);
                if (resolved?.linhaId) {
                    const found = linhas.find(l => l.id === resolved.linhaId);
                    if (found) return found;
                }
            }
        }

        const matching = [];
        for (const linha of linhas) {
            if (linha.categorias.some(c => cat.includes(c))) {
                matching.push(linha);
            }
        }

        if (matching.length === 0) return null;
        if (matching.length === 1) return matching[0];

        let best = matching[0];
        let bestCount = lineItemCount ? (lineItemCount[best.id] || 0) : 0;
        for (let i = 1; i < matching.length; i++) {
            const count = lineItemCount ? (lineItemCount[matching[i].id] || 0) : 0;
            if (count < bestCount) {
                best = matching[i];
                bestCount = count;
            }
        }
        return best;
    },

    _getGapTermico(layoutConfig, categoria) {
        const defaults = this._getDefaultLayoutConfig().gapsTermicos;
        const gaps = { ...defaults, ...(layoutConfig?.gapsTermicos || {}) };
        const cat = (categoria || '').toUpperCase();
        if (gaps[cat] !== undefined) return gaps[cat];
        const entries = Object.entries(gaps).sort((a, b) => b[0].length - a[0].length);
        for (const [key, val] of entries) {
            if (cat.includes(key)) return val;
        }
        return gaps['Outros'] || 5;
    },

    _simulateMinWidth(items, layoutConfig) {
        if (!items || items.length === 0) return 0;
        const cfg = layoutConfig || this._getDefaultLayoutConfig();
        const linhas = cfg.linhas || [];

        const grouped = {};
        for (const linha of linhas) grouped[linha.id] = [];
        grouped.__outros = [];

        const lineItemCount = {};
        for (const item of items) {
            const linha = this._getLinhaParaItem(cfg, item.category, item, lineItemCount);
            grouped[linha ? linha.id : '__outros'].push(item);
            if (linha) {
                lineItemCount[linha.id] = (lineItemCount[linha.id] || 0) + (item.qtd || 1);
            }
        }

        let maxUsed = 0;
        for (const key of [...Object.keys(grouped)]) {
            const grp = grouped[key];
            if (!grp || grp.length === 0) continue;
            const localRows = [];
            let cur = { usedWidth: 0, items: [] };
            for (const item of grp) {
                const iw = item.w || this._getDefaultDimension(item.category, 'w');
                const gap = this._getGapTermico(cfg, item.category);
                const qtd = item.qtd || 1;
                for (let i = 0; i < qtd; i++) {
                    const addGap = cur.items.length > 0 ? gap : 0;
                    if (cur.usedWidth + addGap + iw > 9999 && cur.items.length > 0) {
                        maxUsed = Math.max(maxUsed, cur.usedWidth);
                        localRows.push(cur);
                        cur = { usedWidth: 0, items: [] };
                    }
                    cur.items.push(1);
                    cur.usedWidth += (cur.items.length > 1 ? gap : 0) + iw;
                }
            }
            if (cur.items.length > 0) maxUsed = Math.max(maxUsed, cur.usedWidth);
        }
        return Math.ceil(maxUsed + (cfg.canaletaEsq || 0) + (cfg.canaletaDir || 0));
    },

    suggestLayout(eq, face) {
        const tipicos = store.getState().tipicos || [];
        const materiais = store.getState().materiais || [];
        const loads = eq.loads || [];

        const loadsWithTipico = loads.filter(l => l.typicalId);
        if (loadsWithTipico.length === 0) return { cabinets: [], hasLoads: false };

        const materialBuckets = {};
        const matToTypical = {};
        for (const load of loadsWithTipico) {
            const typical = tipicos.find(t => t.id === load.typicalId);
            if (!typical || !typical.items) continue;
            for (const item of typical.items) {
                const material = materiais.find(m => m.id === item.materialId);
                if (!material) continue;
                const w = parseFloat(material.largura_mm) || 0;
                const h = parseFloat(material.altura_mm) || 0;
                const d = parseFloat(material.profundidade_mm) || 0;
                if (w === 0 && h === 0 && d === 0) continue;

                if (!materialBuckets[material.id]) {
                    materialBuckets[material.id] = { material, totalQtd: 0, loadTags: new Set(), typicals: {} };
                }
                materialBuckets[material.id].totalQtd += item.qtd || 1;
                materialBuckets[material.id].loadTags.add(load.tag || '-');
                if (!materialBuckets[material.id].typicals[typical.id]) {
                    materialBuckets[material.id].typicals[typical.id] = { nome: typical.nome || typical.nomeTipo || typical.id, qtd: 0 };
                }
                materialBuckets[material.id].typicals[typical.id].qtd += item.qtd || 1;
            }
        }

        const buckets = Object.values(materialBuckets);
        if (buckets.length === 0) return { cabinets: [], hasLoads: false };

        const STANDARD_WIDTHS = [400, 600, 800, 1000];
        const getStdWidth = tw => { for (const sw of STANDARD_WIDTHS) { if (tw <= sw) return sw; } return 1000; };
        const baseLayoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();

        const cabinets = [];
        let totalCalculatedWidth = 0;
        let totalSuggestedWidth = 0;
        const isRear = face === 'rear';
        const suf = isRear ? 'T' : 'F';

        const assignments = baseLayoutConfig.cabinetAssignments;
        let cabIdx = 0;
        if (assignments && Object.keys(assignments).length > 0) {
            for (const [cabId, cabData] of Object.entries(assignments)) {
                cabIdx++;
                const items = [];
                let maxD = 0;
                const parent = face ? cabData.faces?.[face] : cabData;
                // Merge loads from all load tags (deduplicate: skip matIds already in a load)
                const mergedSource = {};
                const loadsMatIds = new Set();
                if (parent?.loads) {
                    for (const mats of Object.values(parent.loads)) {
                        for (const [matId, ass] of Object.entries(mats || {})) {
                            loadsMatIds.add(matId);
                            if (!mergedSource[matId]) mergedSource[matId] = { qtd: 0 };
                            mergedSource[matId].qtd += ass.qtd || 0;
                            if (ass.linhaId) mergedSource[matId].linhaId = ass.linhaId;
                            if (ass.xOffset !== undefined) mergedSource[matId].xOffset = ass.xOffset;
                            if (ass.zOffset !== undefined) mergedSource[matId].zOffset = ass.zOffset;
                            if (ass.linhaSplit) mergedSource[matId].linhaSplit = ass.linhaSplit;
                            if (ass.porta) mergedSource[matId].porta = true;
                            if (ass.portaLinhaId) mergedSource[matId].portaLinhaId = ass.portaLinhaId;
                        }
                    }
                }
                const cabDoorItems = [];
                for (const [matId, ass] of Object.entries(mergedSource)) {
                    const bucket = materialBuckets[matId];
                    if (!bucket) continue;
                    const m = bucket.material;
                    const cat = m.categoria || 'Outros';
                    const w = parseFloat(m.largura_mm) || 0;
                    const h = parseFloat(m.altura_mm) || 0;
                    const d = parseFloat(m.profundidade_mm) || 0;
                    if (d > maxD) maxD = d;
                    const qtd = ass.qtd || 0;
                    const isPorta = ass.porta === true;
                    if (qtd > 0 && w > 0 && h > 0) {
                        if (ass.linhaSplit && ass.linhaSplit.length > 0) {
                            for (const split of ass.linhaSplit) {
                                if (split.qtd > 0) {
                                    const item = {
                                        desc: m.descricao || m.codigoInterno || '-',
                                        qtd: split.qtd, tags: [...(bucket.loadTags || [])].join(', '),
                                        category: cat, w, h, d, color: this._getCategoryColor(cat),
                                        _matId: matId, _zOffset: ass.zOffset,
                                        _linhaId: isPorta ? undefined : split.linhaId,
                                        _porta: isPorta,
                                        _portaLinhaId: isPorta ? (ass.portaLinhaId || split.linhaId) : undefined
                                    };
                                    if (isPorta) cabDoorItems.push(item);
                                    else items.push(item);
                                }
                            }
                        } else {
                            const item = {
                                desc: m.descricao || m.codigoInterno || '-',
                                qtd, tags: [...(bucket.loadTags || [])].join(', '),
                                category: cat, w, h, d, color: this._getCategoryColor(cat),
                                _matId: matId, _zOffset: ass.zOffset,
                                _linhaId: isPorta ? undefined : ass.linhaId,
                                _porta: isPorta,
                                _portaLinhaId: isPorta ? ass.portaLinhaId : undefined
                            };
                            if (isPorta) cabDoorItems.push(item);
                            else items.push(item);
                        }
                    }
                }
                {
                    const faceLayout = face ? cabData.faces?.[face]?.layoutConfig : null;
                    const cabConfig = faceLayout ?? cabData.layoutConfig ?? this._getDefaultLayoutConfig();
                    const calcW = items.length > 0 ? this._simulateMinWidth(items, cabConfig) : 200;
                    const stdW = cabData.width ? getStdWidth(cabData.width) : getStdWidth(calcW);
                    const segregacaoCab = eq.technical?.segregacao || '';
                    const isForma34 = this._isForma34EstruturaModular(segregacaoCab, eq.technical?.fabricante);
                    const cabPanelH = cabData.height || (isForma34 ? 2300 : ((segregacaoCab === 'Forma 2a' || segregacaoCab === 'Forma 2b') ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100));
                    if (isForma34) {
                        const isEletropoll = eq.technical?.fabricante === 'Eletropoll';
                        let forma34width;
                        let ccw;
                        if (isEletropoll) {
                            ccw = 400;
                            const tipoGaveta = eq.technical?.tipoGaveta || 'Fixo';
                            let maxGavetaW = 600;
                            for (const carga of (eq.loads || [])) {
                                if (!carga.tag) continue;
                                const epRes = this._getEletropollDrawerHeight(carga, tipoGaveta);
                                if (epRes && !epRes.consultar && epRes.width && epRes.width > maxGavetaW) {
                                    maxGavetaW = epRes.width;
                                }
                            }
                            forma34width = maxGavetaW + ccw;
                            cabData.width = forma34width;
                        } else {
                            ccw = cabConfig.colunaCabosWidth || 200;
                            forma34width = 600 + ccw;
                            cabData.width = forma34width;
                        }
                        // Build colunas/gavetas for KitFrame/Eletropoll
                        const parentForLoads = face ? cabData.faces?.[face] : cabData;
                        const cabLoads = parentForLoads?.loads || {};
                        // Collect loads that appear in this cabinet's loads map
                        const cargaList = (eq.loads || []).filter(l => l.tag && cabLoads[l.tag]);
                        const reserveCombo = cabData._reserveCombo || (face ? cabData.faces?.[face]?._reserveCombo : null);
                        const { colunas, excessLoads } = this._autoStackGavetas(cargaList, cabLoads, cabIdx, cabConfig.gavetaMode || 'sequential', reserveCombo, eq.technical?.fabricante, eq.technical?.tipoGaveta || 'Fixo');
                        const gavetasFlat = colunas.flatMap(c => c.gavetas);
                        cabinets.push({ _cabId: cabId, _assignData: cabData, name: cabData.name + suf, layoutConfig: cabConfig, items, doorItems: cabDoorItems, _fabricante: eq.technical?.fabricante, width: forma34width, height: cabPanelH,                     depth: cabData.depth || maxD || 600, calculatedWidth: forma34width, _userWidth: forma34width, _face: face || null, segregacao: segregacaoCab, _gavetas: gavetasFlat, _colunas: colunas, _excessLoads: excessLoads });
                    } else {
                    cabinets.push({ _cabId: cabId, _assignData: cabData, name: cabData.name + suf, layoutConfig: cabConfig, items, doorItems: cabDoorItems, _fabricante: eq.technical?.fabricante, width: stdW, height: cabPanelH,                     depth: cabData.depth || maxD || 600, calculatedWidth: calcW, _userWidth: cabData.width || null, _face: face || null, segregacao: segregacaoCab });
                    }
                    totalCalculatedWidth += calcW;
                    totalSuggestedWidth += stdW;
                }
            }
        } else {
            // Auto-create cabinet for KitFrame/Eletropoll when no assignments exist
            const isForma34Auto = this._isForma34EstruturaModular(eq.technical?.segregacao || '', eq.technical?.fabricante);
            if (isForma34Auto) {
                if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
                if (!eq.layoutConfig.cabinetAssignments) eq.layoutConfig.cabinetAssignments = {};
                const cabId = 'cab_' + Date.now();
                const isEletropollAuto = eq.technical?.fabricante === 'Eletropoll';
                const ccwAuto = isEletropollAuto ? 400 : 200;
                let autoGavetaW = 600;
                const tipoGavetaAuto = eq.technical?.tipoGaveta || 'Fixo';
                if (isEletropollAuto) {
                    for (const load of (eq.loads || [])) {
                        if (!load.tag) continue;
                        const epRes = this._getEletropollDrawerHeight(load, tipoGavetaAuto);
                        if (epRes && !epRes.consultar && epRes.width && epRes.width > autoGavetaW) {
                            autoGavetaW = epRes.width;
                        }
                    }
                }
                eq.layoutConfig.cabinetAssignments[cabId] = {
                    name: eq.tag || (isEletropollAuto ? 'Eletropoll' : 'KitFrame'),
                    width: (isEletropollAuto ? autoGavetaW : 600) + ccwAuto,
                    height: 2300,
                    depth: 600,
                    loads: {},
                    faces: {
                        front: { loads: {}, layoutConfig: null },
                        rear: { loads: {}, layoutConfig: null }
                    },
                    layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
                };
                // Assign all loads to the cabinet
                const parent = eq.layoutConfig.cabinetAssignments[cabId];
                for (const load of loadsWithTipico) {
                    if (!load.tag) continue;
                    if (!parent.loads[load.tag]) parent.loads[load.tag] = {};
                    for (const bucket of Object.values(materialBuckets)) {
                        if (bucket.loadTags.has(load.tag)) {
                            const matId = bucket.material.id;
                            if (!parent.loads[load.tag][matId]) parent.loads[load.tag][matId] = { qtd: 0 };
                            parent.loads[load.tag][matId].qtd += bucket.totalQtd;
                        }
                    }
                }
                // Re-run the assignments loop
                const newAssignments = eq.layoutConfig.cabinetAssignments;
                if (newAssignments && Object.keys(newAssignments).length > 0) {
                    for (const [cabId2, cabData2] of Object.entries(newAssignments)) {
                        const items2 = [];
                        let maxD2 = 0;
                        const parent2 = face ? cabData2.faces?.[face] : cabData2;
                        const mergedSource2 = {};
                        const loadsMatIds2 = new Set();
                        if (parent2?.loads) {
                            for (const mats of Object.values(parent2.loads)) {
                                for (const [matId, ass] of Object.entries(mats || {})) {
                                    loadsMatIds2.add(matId);
                                    if (!mergedSource2[matId]) mergedSource2[matId] = { qtd: 0 };
                                    mergedSource2[matId].qtd += ass.qtd || 0;
                                }
                            }
                        }
                        for (const [matId, ass] of Object.entries(mergedSource2)) {
                            const bucket = materialBuckets[matId];
                            if (!bucket) continue;
                            const m = bucket.material;
                            const cat = m.categoria || 'Outros';
                            const w = parseFloat(m.largura_mm) || 0;
                            const h2 = parseFloat(m.altura_mm) || 0;
                            const d = parseFloat(m.profundidade_mm) || 0;
                            if (d > maxD2) maxD2 = d;
                            const qtd = ass.qtd || 0;
                            if (qtd > 0 && w > 0 && h2 > 0) {
                                items2.push({ desc: m.descricao || m.codigoInterno || '-', qtd, tags: [...(bucket.loadTags || [])].join(', '), category: cat, w, h: h2, d, color: this._getCategoryColor(cat), _matId: matId });
                            }
                        }
                        const cabConfig2 = cabData2.layoutConfig || this._getDefaultLayoutConfig();
                        const forma34width2 = isEletropollAuto ? (cabData2.width || (autoGavetaW + 400)) : (600 + ccwAuto);
                        const cabPanelHAuto = 2300;
                        const parentForLoadsAuto = face ? cabData2.faces?.[face] : cabData2;
                        const cabLoadsAuto = parentForLoadsAuto?.loads || {};
                        const cargaListAuto = (eq.loads || []).filter(l => l.tag && cabLoadsAuto[l.tag]);
                        const reserveComboAuto = cabData2._reserveCombo || (face ? cabData2.faces?.[face]?._reserveCombo : null);
                        const { colunas: colunasAuto, excessLoads: excessLoadsAuto } = this._autoStackGavetas(cargaListAuto, cabLoadsAuto, 1, cabConfig2.gavetaMode || 'sequential', reserveComboAuto, eq.technical?.fabricante, eq.technical?.tipoGaveta || 'Fixo');
                        const gavetasFlatAuto = colunasAuto.flatMap(c => c.gavetas);
                        cabinets.push({ _cabId: cabId2, _assignData: cabData2, name: (cabData2.name || cabId2) + suf, layoutConfig: cabConfig2, items: items2, doorItems: [], _fabricante: eq.technical?.fabricante, width: forma34width2, height: cabPanelHAuto, depth: cabData2.depth || maxD2 || 600, calculatedWidth: forma34width2, _userWidth: forma34width2, _face: face || null, segregacao: eq.technical?.segregacao || '', _gavetas: gavetasFlatAuto, _colunas: colunasAuto, _excessLoads: excessLoadsAuto });
                        totalCalculatedWidth += forma34width2;
                        totalSuggestedWidth += forma34width2;
                    }
                }
            } else {
                return { cabinets: [], hasLoads: true };
            }
        }

        if (isRear) cabinets.reverse();

        for (const cab of cabinets) {
            const isCabForma34 = this._isForma34EstruturaModular(cab.segregacao, cab._fabricante);
            if (!isCabForma34) {
                cab.rows = this._layoutCabinetRows(cab);
                cab.doorRows = this._layoutDoorRows(cab);
            }
        }

        return { cabinets, totalCalculatedWidth, totalSuggestedWidth, hasLoads: true };
    },

    _suggestAutomationLayout(eq) {
        const io = eq.ioList || { racks: [] };
        const hasRacks = io.racks && io.racks.length > 0 && io.racks.some(r => (r.slots || []).length > 0);
        if (!hasRacks) return { cabinets: [], hasLoads: false };

        const bomResult = deriveMaterials(io);
        const materiais = store.getState().materiais || [];

        const items = [];
        for (const bomItem of bomResult.items) {
            if (!bomItem.materialId) continue;
            const mat = materiais.find(m => m.id === bomItem.materialId);
            if (!mat) continue;
            const w = parseFloat(mat.largura_mm) || 0;
            const h = parseFloat(mat.altura_mm) || 0;
            const d = parseFloat(mat.profundidade_mm) || 0;
            if (w === 0 && h === 0) continue;
            const catBlacklist = ['Cabos', 'Eletrodutos', 'Canaletas', 'Conectores'];
            if (catBlacklist.includes(bomItem.categoria)) continue;
            const existing = items.find(it => it._matId === bomItem.materialId);
            if (existing) {
                existing.qtd += bomItem.qtd;
            } else {
                items.push({
                    desc: mat.descricao || bomItem.descricao,
                    qtd: bomItem.qtd,
                    category: bomItem.categoria,
                    w, h, d,
                    color: this._getCategoryColor(bomItem.categoria),
                    _matId: bomItem.materialId
                });
            }
        }

        if (items.length === 0) return { cabinets: [], hasLoads: false };

        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        if (!eq.layoutConfig.cabinetAssignments || Object.keys(eq.layoutConfig.cabinetAssignments).length === 0) {
            const cabId = 'cab_auto';
            eq.layoutConfig.cabinetAssignments = {
                [cabId]: {
                    name: eq.tag || 'PLC',
                    width: 600,
                    depth: 600,
                    faces: {
                        front: { loads: {}, layoutConfig: null },
                        rear: { loads: {}, layoutConfig: null }
                    },
                    layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
                }
            };
        }

        const STANDARD_WIDTHS = [400, 600, 800, 1000];
        const getStdWidth = tw => { for (const sw of STANDARD_WIDTHS) { if (tw <= sw) return sw; } return 1000; };

        const cabinets = [];
        let totalCalculatedWidth = 0;
        let totalSuggestedWidth = 0;

        for (const [cabId, cabData] of Object.entries(eq.layoutConfig.cabinetAssignments)) {
            const cabConfig = cabData.layoutConfig || this._getDefaultLayoutConfig();
            const calcW = this._simulateMinWidth(items, cabConfig);
            const stdW = cabData.width ? getStdWidth(cabData.width) : getStdWidth(calcW);
            const seg = eq.technical?.segregacao || '';
            const panelH = parseInt(eq.technical?.alturaPainel) || 2200;
            const cabPanelH = cabData.height || ((seg === 'Forma 2a' || seg === 'Forma 2b') ? 2300 : panelH + 100);
            const maxD = items.reduce((m, it) => Math.max(m, it.d || 0), 600);

            cabinets.push({
                _cabId: cabId,
                _assignData: cabData,
                name: (cabData.name || cabId) + 'F',
                layoutConfig: cabConfig,
                items: [...items].map(it => ({ ...it, _zOffset: this._getLoadsAsFlat(cabData)[it._matId]?.zOffset ?? undefined })),
                doorItems: [],
                width: stdW,
                height: cabPanelH,
                depth: cabData.depth || maxD || 600,
                calculatedWidth: calcW,
                _userWidth: cabData.width || null,
                _face: null,
                segregacao: seg,
                _isAutomation: true
            });

            totalCalculatedWidth += calcW;
            totalSuggestedWidth += stdW;
        }

        for (const cab of cabinets) {
            cab.rows = this._layoutCabinetRows(cab);
            cab.doorRows = this._layoutDoorRows(cab);
        }

        return { cabinets, totalCalculatedWidth, totalSuggestedWidth, hasLoads: true };
    },

    _renderAutomationLayout(eq) {
        const validForms = ['Forma 1', 'Forma 2a', 'Forma 2b', 'Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'];
        const seg = eq.technical?.segregacao;
        if (!seg || !validForms.includes(seg)) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível</div>
                <div style="font-size:13px;margin-top:6px;">Selecione uma Forma de Segregação na Ficha Técnica.</div>
            </div>`;
        }

        const fabricanteAE = eq.technical?.fabricante || 'Genérico';
        if (this._isForma34(seg) && !this._isForma34EstruturaModular(seg, fabricanteAE)) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível para este fabricante</div>
                <div style="font-size:13px;margin-top:6px;">Para Formas <strong>3a, 3b, 4a, 4b</strong>, selecione <strong>KitFrame</strong> ou <strong>Eletropoll</strong> como Fabricante na Ficha Técnica.</div>
            </div>`;
        }

        const montagem = eq.technical?.montagem || 'Em Linha';

        const result = this._suggestAutomationLayout(eq);

        if (!result.hasLoads) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-list-bullets" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Nenhum material da Lista de Materiais</div>
                <div style="font-size:13px;margin-top:6px;">Configure a Lista de I/O e certifique-se de que os materiais possuem dimensões no catálogo.</div>
            </div>`;
        }

        const { cabinets } = result;

        if (cabinets.length === 0) {
            return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        <div>
                            <h4 style="margin:0;color:#1e3a8a;font-size:18px;">Layout Sugerido: ${eq.tag}</h4>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Distribuição física dos armários com base na Lista de Materiais</div>
                        </div>
                    </div>
                    <div style="text-align:center;padding:40px 40px;background:white;border-radius:12px;border:2px dashed #cbd5e1;margin-bottom:20px;">
                        <i class="ph ph-frame-corners" style="font-size:48px;color:#94a3b8;opacity:0.3;margin-bottom:12px;"></i>
                        <div style="font-size:16px;font-weight:700;color:#64748b;margin-bottom:16px;">Nenhum armário definido</div>
                        <button class="btn btn-primary" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:13px;padding:8px 20px;">
                            + Criar Armário
                        </button>
                    </div>
                </div>
            </div>`;
        }

        const formatGrouped = (arr, prop, unit) => {
            const counts = {};
            for (const c of arr) {
                const v = c[prop] || 600;
                counts[v] = (counts[v] || 0) + 1;
            }
            return Object.entries(counts)
                .sort(([a], [b]) => b - a)
                .map(([v, n]) => n > 1 ? `${n}×${v}${unit}` : `${v}${unit}`)
                .join(', ');
        };
        const summaryCards = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Armários</div>
                    <div style="font-size:28px;font-weight:800;color:#1e3a8a;margin-top:4px;">${cabinets.length}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Larguras Instaladas</div>
                    <div style="font-size:18px;font-weight:800;color:#16a34a;margin-top:4px;">${formatGrouped(cabinets, 'width', 'mm')}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Altura Instalada</div>
                    <div style="font-size:18px;font-weight:800;color:#1e3a8a;margin-top:4px;">${formatGrouped(cabinets, 'height', 'mm')}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Profundidade Instalada</div>
                    <div style="font-size:18px;font-weight:800;color:#1e3a8a;margin-top:4px;">${formatGrouped(cabinets, 'depth', 'mm')}</div>
                </div>
            </div>
        `;

        const offscreen = document.createElement('canvas');
        this._drawLayoutCanvas(offscreen, cabinets);
        const dataUrl = offscreen.toDataURL('image/png');

        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const hasExternalViewAE = isForma2 || seg === 'Forma 1';
        let dataUrlExt = '';
        if (hasExternalViewAE) {
            const offscreenExt = document.createElement('canvas');
            this._drawLayoutCanvasExternal(offscreenExt, cabinets);
            dataUrlExt = offscreenExt.toDataURL('image/png');
        }

        const warnings = cabinets.filter(c => c.warning).map(c => `
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#92400e;">
                <strong>${c.name}:</strong> ${c.warning}
            </div>
        `).join('');

        const externalViewHtml = hasExternalViewAE ? `
                        <div style="margin-top:24px;">
                            <h5 style="margin:0 0 8px;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA FRONTAL EXTERNA</h5>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                                <img id="layout-canvas-external" src="${dataUrlExt}" style="display:block;margin:0 auto;" alt="Vista Frontal Externa">
                            </div>
                        </div>` : '';

        const baseCabs = Object.entries(eq.layoutConfig?.cabinetAssignments || {}).map(([id, d]) => ({ id, name: d.name, width: d.width || 600, height: d.height, depth: d.depth || 600 }));

        return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        <div>
                            <h4 style="margin:0;color:#1e3a8a;font-size:18px;">Layout Sugerido: ${eq.tag}</h4>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Distribuição física dos armários com base nos materiais da Lista de Materiais</div>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                            <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._showLayoutConfigPanel()" style="gap:4px;">
                                <i class="ph ph-gear"></i> Configurar
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutPDF()" style="gap:4px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutDXF()" style="gap:4px;">
                                <i class="ph ph-file"></i> Exportar DXF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutQET()" style="gap:4px;">
                                <i class="ph ph-lightning"></i> Exportar QET
                            </button>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;user-select:none;margin-left:4px;">
                                <input type="checkbox" id="chk_side_view" onchange="window.propostaTecnicaModule._toggleSideView()" ${eq.layoutConfig?.showSideView ? 'checked' : ''}> Vista Lateral
                            </label>
                        </div>
                    </div>
                    ${summaryCards}
                    ${warnings}
                    <div style="background:white;border-radius:12px;overflow:auto;padding:16px;">
                        <img id="layout-canvas" src="${dataUrl}" style="display:block;margin:0 auto;" alt="Layout Sugerido">
                        <div style="text-align:center;margin-top:12px;font-size:13px;font-weight:700;color:#64748b;letter-spacing:2px;">LAYOUT ORIENTATIVO</div>
                    </div>
                    ${externalViewHtml}
                    <div id="side-view-container" style="display:${eq.layoutConfig?.showSideView ? 'block' : 'none'};margin-top:20px;">
                        <div style="display:flex;align-items:center;gap:12px;margin:0 0 8px;">
                            <h5 style="margin:0;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA LATERAL (CORTE)</h5>
                            <select id="sel_side_view_cabinet" onchange="window.propostaTecnicaModule._onChangeSideViewCabinet()" style="font-size:12px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;">
                                <option value="-1" ${(eq.layoutConfig?.sideViewCabinetIndex ?? -1) === -1 ? 'selected' : ''}>Todos (Combinado)</option>
                                ${cabinets.map((c, i) => `<option value="${i}" ${eq.layoutConfig?.sideViewCabinetIndex === i ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                            <img id="layout-canvas-side" style="display:block;margin:0 auto;" alt="Vista Lateral">
                        </div>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;justify-content:center;">
                        ${baseCabs.map(bc => {
                            const cabH = bc.height || ((isForma2) ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100);
                            return `<div style="display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:12px;">
                                <span style="font-weight:600;color:#1e3a8a;">${bc.name}</span>
                                <span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Largura:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setLarguraArmario('${bc.id}',this.value)">
                                    <option value="400" ${bc.width === 400 ? 'selected' : ''}>400mm</option>
                                    <option value="600" ${bc.width === 600 ? 'selected' : ''}>600mm</option>
                                    <option value="800" ${bc.width === 800 ? 'selected' : ''}>800mm</option>
                                    <option value="1000" ${bc.width === 1000 ? 'selected' : ''}>1000mm</option>
                                </select>
                                ${!isForma2 ? `<span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Altura:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setAlturaArmario('${bc.id}',this.value)">
                                    <option value="1600" ${cabH === 1600 ? 'selected' : ''}>1600mm</option>
                                    <option value="1800" ${cabH === 1800 ? 'selected' : ''}>1800mm</option>
                                    <option value="2000" ${cabH === 2000 ? 'selected' : ''}>2000mm</option>
                                    <option value="2300" ${cabH === 2300 ? 'selected' : ''}>2300mm</option>
                                </select>` : ''}
                                <span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Profundidade:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setProfundidadeArmario('${bc.id}',this.value)">
                                    <option value="400" ${(bc.depth || 600) === 400 ? 'selected' : ''}>400mm</option>
                                    <option value="600" ${(bc.depth || 600) === 600 ? 'selected' : ''}>600mm</option>
                                    <option value="800" ${(bc.depth || 600) === 800 ? 'selected' : ''}>800mm</option>
                                    <option value="1000" ${(bc.depth || 600) === 1000 ? 'selected' : ''}>1000mm</option>
                                    <option value="1200" ${(bc.depth || 600) === 1200 ? 'selected' : ''}>1200mm</option>
                                </select>
                                <button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerArmario('${bc.id}')" style="color:#ef4444;font-size:11px;padding:2px 4px;" title="Remover armário">✕</button>
                            </div>`;
                        }).join('')}
                        <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:11px;padding:6px 10px;">+ Adicionar Armário</button>
                    </div>
                    ${(() => {
                        const arvoreAuto = this._geraArvoreAutomacao(eq);
                        const totalMats = Object.values(arvoreAuto).reduce((s, tip) => s + Object.keys(tip.materiais).length, 0);
                        const bomHtml = this._renderBOMAlocacao(arvoreAuto, cabinets, montagem);
                        return `<div style="margin-top:16px;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                            <div onclick="const e=document.getElementById('bom_body_automacao');const v=e.style.display;e.style.display=v==='none'?'':'none';this.querySelector('.bom-arrow').textContent=v==='none'?'▼':'▶'" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;cursor:pointer;background:#f8fafc;border-bottom:1px solid #e2e8f0;user-select:none;">
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <span class="bom-arrow" style="font-size:10px;">▶</span>
                                    <strong style="font-size:14px;">Lista de Materiais (${totalMats} itens)</strong>
                                </div>
                                <span style="font-size:11px;color:#64748b;">Aloque materiais aos armários expandindo cada carga</span>
                            </div>
                            <div id="bom_body_automacao" style="display:none;padding:16px;">
                                ${bomHtml}
                            </div>
                        </div>`;
                    })()}
                </div>
            </div>`;
    },

};
