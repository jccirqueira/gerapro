// bom.js (bloco 5/7) — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { store } from '../state.js';
import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from '../busbarCalculator.js';
import { deriveMaterials } from '../automacaoMateriais.js';
import { EMPRESA } from '../empresaConfig.js';
import { infraSubtotal, infraPrecoFinal } from '../infraPricing.js';
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './shared.js';

const app = window.app;
export const bom = {
    _geraArvoreMateriais(eq) {
        const tipicos = store.getState().tipicos || [];
        const materiais = store.getState().materiais || [];
        const loads = eq.loads || [];
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();

        const loadsWithTipico = loads.filter(l => l.typicalId);
        const arvore = {};

        for (const load of loadsWithTipico) {
            const typical = tipicos.find(t => t.id === load.typicalId);
            if (!typical || !typical.items) continue;
            const loadKey = load.id || load.tag || 'load_' + Math.random().toString(36).slice(2, 8);
            const tipName = typical.nome || typical.nomeTipo || 'Típico';
            arvore[loadKey] = {
                nome: `${load.tag || '?'} - ${load.desc || 'Sem descrição'} (${tipName})`,
                loadTag: load.tag || '',
                loadDesc: load.desc || '',
                typicalNome: tipName,
                typicalId: typical.id,
                materiais: {}
            };
            for (const item of typical.items) {
                const material = materiais.find(m => m.id === item.materialId);
                if (!material) continue;
                const w = parseFloat(material.largura_mm) || 0;
                const h = parseFloat(material.altura_mm) || 0;
                if (w === 0 && h === 0) continue;
                const matId = material.id;
                if (!arvore[loadKey].materiais[matId]) {
                    arvore[loadKey].materiais[matId] = {
                        desc: material.descricao || material.codigoInterno || '-',
                        categoria: material.categoria || 'Outros',
                        w, h, qtdTotal: 0, alocado: {}
                    };
                }
                arvore[loadKey].materiais[matId].qtdTotal += item.qtd || 1;
            }
            if (Object.keys(arvore[loadKey].materiais).length === 0) delete arvore[loadKey];
        }

        const canaletas = layoutConfig.canaletas || [];
        if (canaletas.length > 0) {
            arvore.__canaletas = { nome: 'Canaletas', materiais: {} };
            const consumo = this._calcularConsumoCanaletas(canaletas);
            const barrasPorModelo = {};
            for (const can of canaletas) {
                const key = can.modelo || '50x50';
                if (!barrasPorModelo[key]) barrasPorModelo[key] = { qtd: 0, comprimento: 0 };
                if (can.tipo === 'quadro' && can.segmentos) {
                    for (const seg of can.segmentos) {
                        barrasPorModelo[key].comprimento += seg.comprimento || 0;
                    }
                } else {
                    barrasPorModelo[key].comprimento += can.comprimento || 0;
                }
            }
            for (const [modelo, dados] of Object.entries(barrasPorModelo)) {
                const barras = Math.ceil(dados.comprimento / 2000);
                dados.qtd = barras;
                const matId = '__canaleta_' + modelo;
                arvore.__canaletas.materiais[matId] = {
                    desc: `Canaleta ${modelo} — barra 2000mm`,
                    categoria: 'Canaleta',
                    w: 0, h: 0, qtdTotal: barras,
                    alocado: {},
                    _consumo: dados.comprimento,
                    _barras: barras,
                    _sobra: Math.max(0, barras * 2000 - dados.comprimento)
                };
            }
        }

        if (layoutConfig.cabinetAssignments) {
            for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
                const faces = cabData.faces || {};

                // Read from new loads-based schema
                const readLoads = (loadsObj, keySuffix) => {
                    if (!loadsObj) return;
                    for (const [loadId, mats] of Object.entries(loadsObj)) {
                        for (const [matId, ass] of Object.entries(mats || {})) {
                            const key = cabId + (keySuffix || '');
                            if (arvore[loadId]?.materiais?.[matId]) {
                                arvore[loadId].materiais[matId].alocado[key] = (arvore[loadId].materiais[matId].alocado[key] || 0) + (ass.qtd || 0);
                            }
                        }
                    }
                };
                readLoads(cabData.loads, '');
                readLoads(faces.front?.loads, '|front');
                readLoads(faces.rear?.loads, '|rear');

                // Build set of already-handled matIds from loads schema
                const handledMatIds = new Set();
                const collectMatIds = (loadsObj) => {
                    if (!loadsObj) return;
                    for (const mats of Object.values(loadsObj)) {
                        for (const matId of Object.keys(mats || {})) handledMatIds.add(matId);
                    }
                };
                collectMatIds(cabData.loads);
                collectMatIds(faces.front?.loads);
                collectMatIds(faces.rear?.loads);
            }
        }

        return arvore;
    },

    _geraArvoreAutomacao(eq) {
        const materiais = store.getState().materiais || [];
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        const io = eq.ioList || { racks: [] };
        const bomResult = deriveMaterials(io);

        const arvore = {};
        const matMap = {};

        for (const bomItem of bomResult.items) {
            if (!bomItem.materialId) continue;
            const mat = materiais.find(m => m.id === bomItem.materialId);
            if (!mat) continue;
            const w = parseFloat(mat.largura_mm) || 0;
            const h = parseFloat(mat.altura_mm) || 0;
            if (w === 0 && h === 0) continue;
            const catBlacklist = ['Cabos', 'Eletrodutos', 'Canaletas', 'Conectores'];
            if (catBlacklist.includes(bomItem.categoria)) continue;
            if (!matMap[bomItem.materialId]) {
                matMap[bomItem.materialId] = {
                    desc: mat.descricao || bomItem.descricao,
                    categoria: bomItem.categoria || 'Outros',
                    w, h, qtdTotal: 0, alocado: {}
                };
            }
            matMap[bomItem.materialId].qtdTotal += bomItem.qtd;
        }

        if (Object.keys(matMap).length === 0) return arvore;

        arvore['automacao'] = {
            nome: 'Lista de Materiais',
            loadTag: '',
            loadDesc: '',
            materiais: matMap
        };

        if (layoutConfig.cabinetAssignments) {
            for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
                const faces = cabData.faces || {};
                const readLoads = (loadsObj, keySuffix) => {
                    if (!loadsObj) return;
                    for (const [loadId, mats] of Object.entries(loadsObj)) {
                        for (const [matId, ass] of Object.entries(mats || {})) {
                            const key = cabId + (keySuffix || '');
                            if (arvore[loadId]?.materiais?.[matId]) {
                                arvore[loadId].materiais[matId].alocado[key] = (arvore[loadId].materiais[matId].alocado[key] || 0) + (ass.qtd || 0);
                            }
                        }
                    }
                };
                readLoads(cabData.loads, '');
                readLoads(faces.front?.loads, '|front');
                readLoads(faces.rear?.loads, '|rear');
                const handledMatIds = new Set();
                const collectMatIds = (loadsObj) => {
                    if (!loadsObj) return;
                    for (const mats of Object.values(loadsObj)) {
                        for (const matId of Object.keys(mats || {})) handledMatIds.add(matId);
                    }
                };
                collectMatIds(cabData.loads);
                collectMatIds(faces.front?.loads);
                collectMatIds(faces.rear?.loads);
            }
        }

        return arvore;
    },

    _renderBOMAlocacao(arvore, cabinets, montagem) {
        const tipKeys = Object.keys(arvore);
        if (tipKeys.length === 0) return '<div style="padding:12px;color:#94a3b8;font-size:13px;text-align:center;">Nenhum material encontrado para alocação.</div>';

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        const layoutConfig = eq?.layoutConfig || this._getDefaultLayoutConfig();
        const linhas = layoutConfig.linhas || [];

        const isB2B = montagem === 'Back to Back';
        const cabOptions = cabinets.flatMap(c => {
            const base = c._cabId || c.name;
            if (isB2B) {
                const baseName = c._assignData?.name || c.name.replace(/[FT]$/, '');
                return [
                    `<option value="${base}|front">${baseName}F - Frontal</option>`,
                    `<option value="${base}|rear">${baseName}T - Traseira</option>`
                ];
            }
            return [`<option value="${base}">${c.name}</option>`];
        }).join('');

        const hasLoads = tipKeys.some(k => k !== '__canaletas');
        const loadHtml = tipKeys.filter(k => k !== '__canaletas').map(loadKey => {
            const load = arvore[loadKey];
            const matIds = Object.keys(load.materiais);
            if (matIds.length === 0) return '';

            const alocadoPorMat = matIds.map(matId => Object.values(load.materiais[matId].alocado).reduce((s, v) => s + v, 0));
            const qtdTotalMats = matIds.reduce((s, mId) => s + load.materiais[mId].qtdTotal, 0);
            const alocadoTotalMats = alocadoPorMat.reduce((s, v) => s + v, 0);
            const loadDisp = qtdTotalMats - alocadoTotalMats;
            let statusIcon = alocadoTotalMats === 0 ? '❌' : (loadDisp > 0 ? '⚠️' : '✅');
            let statusText = alocadoTotalMats === 0 ? '0/' + qtdTotalMats : alocadoTotalMats + '/' + qtdTotalMats;

            const matHtml = matIds.map(matId => {
                const m = load.materiais[matId];
                const alocadoTotal = Object.values(m.alocado).reduce((s, v) => s + v, 0);
                const disp = m.qtdTotal - alocadoTotal;
                const alocStr = Object.entries(m.alocado).map(([cabId, qtd]) => {
                    let cabName = cabId;
                    let faceLabel = '';
                    const pi = cabId.indexOf('|');
                    let baseCabId = cabId;
                    let face = null;
                    if (pi > 0) {
                        baseCabId = cabId.slice(0, pi);
                        face = cabId.slice(pi + 1);
                        const match = cabinets.find(c => c._cabId === baseCabId);
                        const baseName = match?._assignData?.name || (match?.name || baseCabId).replace(/[FT]$/, '');
                        cabName = baseName + (face === 'front' ? 'F' : 'T');
                        faceLabel = face === 'front' ? ' - Frontal' : ' - Traseira';
                    } else {
                        const match = cabinets.find(c => (c._cabId || c.name) === cabId);
                        cabName = match?.name || cabId;
                    }
                    let linhaHtml = '';
                    let xInputHtml = '';
                    let alocEntryHtml = '';
                    const matchCab = cabinets.find(c => c._cabId === baseCabId);
                    const isKitFrameCab = matchCab ? this._isForma34EstruturaModular(matchCab.segregacao, matchCab._fabricante) : false;
                    if (matchCab?._assignData) {
                        const cabLinhas = (matchCab.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas);
                        const cabDoorLinhas = (matchCab.layoutConfig?.doorLinhas || this._getDefaultLayoutConfig().doorLinhas);
                        const source = face ? matchCab._assignData.faces?.[face]?.loads?.[loadKey] : matchCab._assignData.loads?.[loadKey];
                        const matEntry = source?.[matId];
                        if (matEntry && !isKitFrameCab) {
                            const isPorta = matEntry.porta === true;
                            const isSplit = matEntry.linhaSplit && matEntry.linhaSplit.length > 0;
                            const linhaOptions = cabLinhas.map(l =>
                                `<option value="${l.id}" ${matEntry.linhaId === l.id ? 'selected' : ''}>${l.nome}</option>`
                            ).join('');
                            const doorLinhaOptions = cabDoorLinhas.map(l =>
                                `<option value="${l.id}" ${matEntry.portaLinhaId === l.id ? 'selected' : ''}>${l.nome}</option>`
                            ).join('');
                            if (!isSplit) {
                                const chkPorta = `
                                    <span style="margin-left:6px;color:#64748b;font-size:11px;font-weight:600;">
                                        <input type="checkbox" ${isPorta ? 'checked' : ''}
                                            onchange="window.propostaTecnicaModule._setPortaMaterial('${matId}','${loadKey}','${cabId}',this.checked)"
                                            style="width:14px;height:14px;cursor:pointer;vertical-align:middle;"> Porta
                                    </span>`;
                                if (isPorta) {
                                    linhaHtml = `
                                        ${chkPorta}
                                        <span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">Faixa:</span>
                                        <select style="font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;height:24px;vertical-align:middle;"
                                            onchange="window.propostaTecnicaModule._setPortaLinhaMaterial('${matId}','${loadKey}','${cabId}',this.value)">
                                            <option value="">Auto</option>
                                            ${doorLinhaOptions}
                                        </select>`;
                                } else {
                                    linhaHtml = `
                                        ${chkPorta}
                                        <span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">Linha:</span>
                                        <select style="font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;height:24px;vertical-align:middle;"
                                            onchange="window.propostaTecnicaModule._setLinhaMaterial('${matId}','${loadKey}','${cabId}',this.value)">
                                            <option value="">Auto</option>
                                            ${linhaOptions}
                                        </select>
                                        <span style="font-size:10px;color:#94a3b8;cursor:pointer;margin-left:3px;" onclick="window.propostaTecnicaModule._toggleSplitMode('${matId}','${loadKey}','${cabId}')" title="Fracionar entre linhas">[⊕]</span>`;
                                }
                            }
                            const xVal = matEntry.xOffset;
                            const zVal = matEntry.zOffset;
                            xInputHtml = `<span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">X:</span>
                                <input type="number" value="${xVal != null ? xVal : ''}" placeholder="auto"
                                style="width:56px;font-size:12px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;height:26px;"
                                onchange="window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onblur="window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onkeydown="if(event.key==='Enter'){event.preventDefault();window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,this.value)}" title="Posicao X (mm)">
                                <button class="btn btn-xs btn-ghost" style="font-size:11px;padding:1px 5px;height:26px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;cursor:pointer;vertical-align:middle;"
                                onclick="this.previousElementSibling.value='';window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,'')" title="Auto">A</button>
                                <span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">Z:</span>
                                <input type="number" value="${zVal != null ? zVal : ''}" placeholder="auto"
                                style="width:56px;font-size:12px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;height:26px;"
                                onchange="window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onblur="window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onkeydown="if(event.key==='Enter'){event.preventDefault();window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,this.value)}" title="Posicao Z (profundidade) - Enter ou sair do campo para aplicar">
                                <button class="btn btn-xs btn-ghost" style="font-size:11px;padding:1px 5px;height:26px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;cursor:pointer;vertical-align:middle;"
                                onclick="this.previousElementSibling.value='';window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,'')" title="Auto">A</button>`;

                            if (isSplit) {
                                const splitRows = matEntry.linhaSplit.map((entry, ei) => {
                                    const splitLinhaOpts = linhas.map(l =>
                                        `<option value="${l.id}" ${entry.linhaId === l.id ? 'selected' : ''}>${l.nome}</option>`
                                    ).join('');
                                    return `<div style="display:flex;align-items:center;gap:4px;padding:1px 0;">
                                        <input type="number" value="${entry.qtd}" min="1"
                                            style="width:36px;font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;height:22px;"
                                            onchange="window.propostaTecnicaModule._updateSplitEntry('${matId}','${loadKey}','${cabId}',${ei},'qtd',this.value)"
                                            onkeydown="if(event.key==='Enter')this.blur()">
                                        <select style="font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;height:22px;"
                                            onchange="window.propostaTecnicaModule._updateSplitEntry('${matId}','${loadKey}','${cabId}',${ei},'linhaId',this.value)">
                                            <option value="">Auto</option>
                                            ${splitLinhaOpts}
                                        </select>
                                        <span style="font-size:10px;color:#ef4444;cursor:pointer;padding:0 2px;"
                                            onclick="window.propostaTecnicaModule._removeSplitEntry('${matId}','${loadKey}','${cabId}',${ei})" title="Remover">✕</span>
                                    </div>`;
                                }).join('');
                                const addBtn = `<span style="font-size:10px;color:#3b82f6;cursor:pointer;padding:1px 4px;display:inline-block;"
                                    onclick="window.propostaTecnicaModule._addSplitEntry('${matId}','${loadKey}','${cabId}')">[+]</span>`;
                                alocEntryHtml = `<div style="background:#dbeafe;border-radius:4px;padding:3px 6px;margin:0 2px;font-size:12px;">
                                    <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
                                        <span style="font-weight:600;">${cabName}${faceLabel}:</span>
                                        <span style="font-weight:700;">${qtd}x</span>
                                        <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule._removerMaterial('${cabId}','${matId}','${loadKey}')" style="color:#ef4444;text-decoration:none;margin-left:2px;" title="Remover">&#10005;</a>
                                        <span style="font-size:10px;color:#94a3b8;cursor:pointer;margin-left:3px;" onclick="window.propostaTecnicaModule._toggleSplitMode('${matId}','${loadKey}','${cabId}')" title="Agrupar em uma linha">[⊖]</span>
                                    </div>
                                    <div style="padding-left:4px;">${splitRows}</div>
                                    <div style="padding-left:4px;margin-top:1px;">${addBtn}</div>
                                    <div style="padding-left:4px;margin-top:2px;">${xInputHtml ? `<span style="color:#64748b;font-size:11px;font-weight:600;">X:</span>${xInputHtml}` : ''}</div>
                                </div>`;
                            }
                        }
                    }
                    if (!alocEntryHtml) {
                        alocEntryHtml = `<span style="background:#dbeafe;border-radius:4px;padding:1px 6px;margin:0 2px;font-size:12px;white-space:nowrap;">${cabName}${faceLabel}: ${qtd}x <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule._removerMaterial('${cabId}','${matId}','${loadKey}')" style="color:#ef4444;text-decoration:none;margin-left:4px;" title="Remover">&#10005;</a>${linhaHtml}${xInputHtml || ''}</span>`;
                    }
                    return alocEntryHtml;
                }).join(' ');
                const isManual = alocadoTotal > 0;
                const statusBadge = isManual
                    ? `<span style="display:inline-flex;align-items:center;gap:2px;margin-left:6px;font-size:11px;color:#6366f1;font-weight:600;" title="Alocação manual — o sistema respeita sua posição">🔧 Manual</span>`
                    : `<span style="display:inline-flex;align-items:center;gap:2px;margin-left:6px;font-size:11px;color:#94a3b8;font-weight:600;" title="Alocação automática — pode mudar se as cargas forem alteradas">⚙️ Auto</span>`;
                const extraInfo = `<span style="color:#64748b;margin-left:8px;font-size:11px;">(${m.categoria}, ${m.w}x${m.h}mm)</span>`;
                const selectId = `bom_assign_cab_${loadKey}_${matId}`;
                const qtdId = `bom_assign_qtd_${loadKey}_${matId}`;
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;margin-left:12px;">
                    <div style="flex:1;">
                        <span style="font-weight:500;">${m.desc}</span>
                        ${statusBadge}
                        ${extraInfo}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">
                        <span style="font-weight:700;color:#1e3a8a;">${m.qtdTotal}x</span>
                        ${disp > 0 ? `
                            <select id="${selectId}" style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;">
                                <option value="">Alocar em...</option>
                                ${cabOptions}
                                <option value="__new__">+ Novo Armário</option>
                            </select>
                            <input type="number" id="${qtdId}" value="${disp}" min="1" max="${disp}" style="width:50px;font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;">
                            <button type="button" class="btn btn-xs btn-primary" onclick="window.propostaTecnicaModule._atribuirMaterial('${matId}','${loadKey}')" style="font-size:11px;">Alocar</button>
                        ` : '<span style="color:#10b981;font-size:11px;">✓</span>'}
                        ${alocStr ? `<div style="display:flex;gap:3px;flex-wrap:wrap;">${alocStr}</div>` : ''}
                    </div>
                </div>`;
            }).join('');

            const loadCabSelId = `bom_load_cab_${loadKey}`;
            const loadInfoHtml = `
                <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#f8fafc;border-radius:4px;margin:4px 8px;">
                    <span style="font-size:12px;font-weight:600;color:#64748b;">Carga toda:</span>
                    ${loadDisp > 0 ? `
                        <select id="${loadCabSelId}" style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;">
                            <option value="">Alocar em...</option>
                            ${cabOptions}
                            <option value="__new__">+ Novo Armário</option>
                        </select>
                        <button type="button" class="btn btn-xs btn-primary" onclick="window.propostaTecnicaModule._atribuirCarga('${loadKey}')" style="font-size:11px;">Alocar Carga</button>
                    ` : ''}
                    ${alocadoTotalMats > 0 ? `<button type="button" class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerCarga('${loadKey}')" style="font-size:11px;color:#ef4444;">Remover Carga</button>` : ''}
                </div>`;

            return `<div class="bom-load-section" style="margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <div class="bom-load-header" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f1f5f9;cursor:pointer;user-select:none;"
                    onclick="const b=this.nextElementSibling;const a=this.querySelector('.bom-arrow');b.style.display=b.style.display==='none'?'':'none';a.textContent=b.style.display==='none'?'▶':'▼'">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="bom-arrow" style="font-size:12px;color:#64748b;">▼</span>
                        <span style="font-weight:700;font-size:13px;color:#1e3a8a;">${load.nome}</span>
                    </div>
                    <div style="font-size:12px;white-space:nowrap;">
                        ${statusIcon} <span style="color:#64748b;">${statusText} itens alocados</span>
                    </div>
                </div>
                <div class="bom-load-body" style="padding:4px 0 8px;">
                    ${loadInfoHtml}
                    <div style="margin-top:4px;">${matHtml}</div>
                </div>
            </div>`;
        }).join('');

        // Canaletas section (unchanged)
        const canalHtml = tipKeys.filter(k => k === '__canaletas').map(tipKey => {
            const tip = arvore[tipKey];
            const matIds = Object.keys(tip.materiais);
            if (matIds.length === 0) return '';
            const matHtml = matIds.map(matId => {
                const m = tip.materiais[matId];
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;">
                    <div style="flex:1;">
                        <span style="font-weight:500;">${m.desc}</span>
                        ${m._consumo ? `<span style="color:#64748b;font-size:11px;margin-left:4px;">(${m._consumo}mm, sobra ${m._sobra}mm)</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">
                        <span style="font-weight:700;color:#1e3a8a;">${m.qtdTotal}x</span>
                        <span style="color:#10b981;font-size:11px;">✓ Alocado (layout)</span>
                    </div>
                </div>`;
            }).join('');
            return `<div style="margin-bottom:8px;">
                <div style="font-weight:700;font-size:13px;color:#0e7490;padding:6px 8px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">${tip.nome}</div>
                ${matHtml}
            </div>`;
        }).join('');

        return `
            <div style="margin-top:4px;">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
                    <input type="text" id="bom_filter" placeholder="Filtrar por descrição..." class="form-control" style="font-size:12px;flex:1;" oninput="window.propostaTecnicaModule._filtrarBOM()">
                    <button class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._resetarAlocacoes()" style="font-size:11px;">Resetar Alocações</button>
                </div>
                <div id="bom_tree">${hasLoads ? loadHtml : ''}${canalHtml}</div>
            </div>
        `;
    },

    _ensureLoadTarget(cabData, loadId) {
        if (!cabData.loads) cabData.loads = {};
        if (!cabData.loads[loadId]) cabData.loads[loadId] = {};
        return cabData.loads[loadId];
    },

    _atribuirMaterial(matId, loadId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};

        const sel = document.getElementById('bom_assign_cab_' + loadId + '_' + matId);
        const qtdInput = document.getElementById('bom_assign_qtd_' + loadId + '_' + matId);
        if (!sel || !qtdInput) return;
        const rawId = sel.value;
        const qtd = parseInt(qtdInput.value) || 1;
        if (!rawId) { app.toast('Selecione um armário.', 'warning'); return; }

        let cabId = rawId;
        let face = null;
        const pipeIdx = rawId.indexOf('|');
        if (pipeIdx > 0) { cabId = rawId.slice(0, pipeIdx); face = rawId.slice(pipeIdx + 1); }

        if (cabId === '__new__') {
            cabId = 'cab_' + Date.now();
            const nome = prompt('Nome do novo armário:');
            if (!nome) return;
            layoutConfig.cabinetAssignments[cabId] = { name: nome, loads: {}, faces: { front: { loads: {} }, rear: { loads: {} } } };
        }

        if (!layoutConfig.cabinetAssignments[cabId]) {
            layoutConfig.cabinetAssignments[cabId] = { name: cabId, loads: {}, faces: { front: { loads: {} }, rear: { loads: {} } } };
        }

        const initInLoads = (parent, lId, mId, addedQtd) => {
            if (!parent.loads) parent.loads = {};
            if (!parent.loads[lId]) parent.loads[lId] = {};
            if (!parent.loads[lId][mId]) parent.loads[lId][mId] = { qtd: 0 };
            parent.loads[lId][mId].qtd += addedQtd;
            if (parent.loads[lId][mId].xOffset === undefined) parent.loads[lId][mId].xOffset = null;
            if (parent.loads[lId][mId].zOffset === undefined) parent.loads[lId][mId].zOffset = null;
        };

        if (face && layoutConfig.cabinetAssignments[cabId].faces) {
            const faceObj = layoutConfig.cabinetAssignments[cabId].faces[face];
            if (faceObj) {
                initInLoads(faceObj, loadId, matId, qtd);
            }
        } else {
            initInLoads(layoutConfig.cabinetAssignments[cabId], loadId, matId, qtd);
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;

        this._recalcularLayout();
    },

    _atribuirCarga(loadId) {
        const sel = document.getElementById('bom_load_cab_' + loadId);
        if (!sel) return;
        const rawId = sel.value;
        if (!rawId) { app.toast('Selecione um armário.', 'warning'); return; }

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};

        let cabId = rawId;
        let face = null;
        const pipeIdx = rawId.indexOf('|');
        if (pipeIdx > 0) { cabId = rawId.slice(0, pipeIdx); face = rawId.slice(pipeIdx + 1); }

        if (cabId === '__new__') {
            cabId = 'cab_' + Date.now();
            const nome = prompt('Nome do novo armário:');
            if (!nome) return;
            layoutConfig.cabinetAssignments[cabId] = { name: nome, loads: {}, faces: { front: { loads: {} }, rear: { loads: {} } } };
        }
        if (!layoutConfig.cabinetAssignments[cabId]) {
            layoutConfig.cabinetAssignments[cabId] = { name: cabId, loads: {}, faces: { front: { loads: {} }, rear: { loads: {} } } };
        }

        const parent = face
            ? (layoutConfig.cabinetAssignments[cabId].faces[face] || (layoutConfig.cabinetAssignments[cabId].faces[face] = { loads: {} }))
            : layoutConfig.cabinetAssignments[cabId];
        if (!parent.loads) parent.loads = {};

        // Get the tree to know which materials belong to this load
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        const arvore = isAutomation ? this._geraArvoreAutomacao(eq) : this._geraArvoreMateriais(eq);
        const loadEntry = arvore[loadId];
        if (!loadEntry) return;

        // Allocate ALL materials directly in state, then single re-render
        for (const matId of Object.keys(loadEntry.materiais)) {
            const m = loadEntry.materiais[matId];
            const alocadoTotal = Object.values(m.alocado).reduce((s, v) => s + v, 0);
            const disp = m.qtdTotal - alocadoTotal;
            if (disp > 0) {
                if (!parent.loads[loadId]) parent.loads[loadId] = {};
                if (!parent.loads[loadId][matId]) parent.loads[loadId][matId] = { qtd: 0 };
                parent.loads[loadId][matId].qtd += disp;
                if (parent.loads[loadId][matId].xOffset === undefined) parent.loads[loadId][matId].xOffset = null;
                if (parent.loads[loadId][matId].zOffset === undefined) parent.loads[loadId][matId].zOffset = null;
            }
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;

        this._recalcularLayout();
    },

    _removerMaterial(cabId, matId, loadId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig;
        if (!layoutConfig?.cabinetAssignments) return;

        let realCabId = cabId;
        let face = null;
        const pipeIdx = cabId.indexOf('|');
        if (pipeIdx > 0) { realCabId = cabId.slice(0, pipeIdx); face = cabId.slice(pipeIdx + 1); }

        let cabData = layoutConfig.cabinetAssignments[realCabId];
        if (!cabData) return;

        // Remove from loads schema
        const removeFromLoads = (parent) => {
            if (!parent?.loads?.[loadId]?.[matId]) return false;
            delete parent.loads[loadId][matId];
            if (Object.keys(parent.loads[loadId]).length === 0) delete parent.loads[loadId];
            return true;
        };

        let removed = false;
        if (face) {
            const faceObj = cabData.faces?.[face];
            removed = removeFromLoads(faceObj);
        } else {
            removed = removeFromLoads(cabData);
        }

        if (!removed) return;

        // Clean up empty cabinets
        const hasAny = Object.keys(cabData.loads || {}).length > 0
            || Object.values(cabData.faces || {}).some(f =>
                Object.keys(f.loads || {}).length > 0);
        if (!hasAny) {
            delete layoutConfig.cabinetAssignments[realCabId];
        }
        if (Object.keys(layoutConfig.cabinetAssignments).length === 0) {
            delete layoutConfig.cabinetAssignments;
        }
        this._recalcularLayout();
    },

    _removerCarga(loadId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig;
        if (!layoutConfig?.cabinetAssignments) return;

        // Remove this loadId from all cabinets
        for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
            const removeKey = (parent) => {
                if (parent?.loads?.[loadId]) {
                    delete parent.loads[loadId];
                }
            };
            removeKey(cabData);
            for (const faceKey of ['front', 'rear']) {
                removeKey(cabData.faces?.[faceKey]);
            }
        }

        // Clean up empty cabinets
        for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
            const hasAny = Object.keys(cabData.loads || {}).length > 0
                || Object.values(cabData.faces || {}).some(f =>
                    Object.keys(f.loads || {}).length > 0);
            if (!hasAny) delete layoutConfig.cabinetAssignments[cabId];
        }
        if (Object.keys(layoutConfig.cabinetAssignments).length === 0) {
            delete layoutConfig.cabinetAssignments;
        }

        this._recalcularLayout();
    },

    _getLoadsAsFlat(parent) {
        if (!parent?.loads) return {};
        const flat = {};
        for (const [, mats] of Object.entries(parent.loads)) {
            for (const [matId, entry] of Object.entries(mats)) {
                if (!flat[matId]) flat[matId] = entry;
            }
        }
        return flat;
    },

    _resetarAlocacoes() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!confirm('Remover todas as alocações manuais e voltar ao agrupamento automático?')) return;
        if (eq.layoutConfig) delete eq.layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _resolveTarget(matId, loadId, cabId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return null;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) return null;
        const pipeIdx = cabId.indexOf('|');
        if (pipeIdx > 0) {
            const realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            return parent?.loads?.[loadId]?.[matId] || null;
        }
        const parent = layoutConfig.cabinetAssignments[cabId];
        return parent?.loads?.[loadId]?.[matId] || null;
    },

    _recalcularLayout() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        this._syncLayoutToEnclosures(eq);
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        if (this.activeSubTab === 'layout') {
            this._redrawLayoutCanvas();
            this._recarregarBOM();
        }
    },

    _syncLayoutToEnclosures(eq) {
        if (!eq || !eq.layoutConfig?.cabinetAssignments) return;
        const cabinets = eq.layoutConfig.cabinetAssignments;
        const cabIds = Object.keys(cabinets);
        if (cabIds.length === 0) {
            eq.enclosureItems = [];
            return;
        }
        const ip = eq.technical?.ip || 'IP-42';
        const color = eq.technical?.cor_externa || eq.technical?.cor || 'RAL 7035';
        eq.enclosureItems = cabIds.map((cabId, i) => {
            const cab = cabinets[cabId];
            return {
                col: cab.name || `C${i + 1}`,
                type: eq.type || '',
                dim: `${cab.height || 2200}x${cab.width || 800}x${cab.depth || 600}`,
                ip: ip,
                color: color,
                side: 'Ambos'
            };
        });
    },

    _recarregarBOM() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        const montagem = eq.technical?.montagem || 'Em Linha';
        const scrollContainer = document.querySelector('#form-proposta-tecnica > div');
        const savedScroll = scrollContainer ? scrollContainer.scrollTop : null;
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            const cabinets = result.cabinets || [];
            const arvore = this._geraArvoreAutomacao(eq);
            const bomHtml = this._renderBOMAlocacao(arvore, cabinets, montagem);
            const bomBody = document.getElementById('bom_body_automacao');
            if (bomBody) bomBody.innerHTML = bomHtml;
        } else {
            const isB2B = montagem === 'Back to Back';
            const result = isB2B ? this.suggestLayout(eq, 'front') : this.suggestLayout(eq);
            const cabinets = result.cabinets || [];
            const arvore = this._geraArvoreMateriais(eq);
            const bomHtml = this._renderBOMAlocacao(arvore, cabinets, montagem);
            const bomBody = document.getElementById('bom_body') || document.getElementById('bom_body_empty');
            if (bomBody) bomBody.innerHTML = bomHtml;
        }
        if (scrollContainer && savedScroll != null) {
            requestAnimationFrame(() => { scrollContainer.scrollTop = savedScroll; });
        }
    },

    _redrawLayoutCanvas() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            const showSide = eq.layoutConfig?.showSideView;
            const c = document.createElement('canvas');
            this._drawLayoutCanvas(c, result.cabinets);
            const img = document.getElementById('layout-canvas');
            if (img) img.src = c.toDataURL('image/png');
            const seg = eq.technical?.segregacao;
            if (seg === 'Forma 1' || seg === 'Forma 2a' || seg === 'Forma 2b') {
                const ce = document.createElement('canvas');
                this._drawLayoutCanvasExternal(ce, result.cabinets);
                const imgExt = document.getElementById('layout-canvas-external');
                if (imgExt) imgExt.src = ce.toDataURL('image/png');
            }
            if (showSide && result.cabinets.length > 0) {
                this._drawSideView(result.cabinets, 'side-view-container', 'layout-canvas-side', eq.layoutConfig?.sideViewCabinetIndex);
            }
            return;
        }
        const isB2B = (eq.technical?.montagem) === 'Back to Back';
        const showSide = eq.layoutConfig?.showSideView;
        if (isB2B) {
            const f = this.suggestLayout(eq, 'front');
            const r = this.suggestLayout(eq, 'rear');
            const cf = document.createElement('canvas');
            this._drawLayoutCanvas(cf, f.cabinets);
            const imgF = document.getElementById('layout-canvas-front');
            if (imgF) imgF.src = cf.toDataURL('image/png');
            const cr = document.createElement('canvas');
            this._drawLayoutCanvas(cr, r.cabinets);
            const imgR = document.getElementById('layout-canvas-rear');
            if (imgR) imgR.src = cr.toDataURL('image/png');
            const seg = eq.technical?.segregacao;
            if (seg === 'Forma 1' || seg === 'Forma 2a' || seg === 'Forma 2b') {
                const cfe = document.createElement('canvas');
                this._drawLayoutCanvasExternal(cfe, f.cabinets);
                const imgFE = document.getElementById('layout-canvas-external-front');
                if (imgFE) imgFE.src = cfe.toDataURL('image/png');
                const cre = document.createElement('canvas');
                this._drawLayoutCanvasExternal(cre, r.cabinets);
                const imgRE = document.getElementById('layout-canvas-external-rear');
                if (imgRE) imgRE.src = cre.toDataURL('image/png');
            }
            if (showSide && f.cabinets.length > 0) {
                this._drawSideView(f.cabinets, 'side-view-container-b2b', 'layout-canvas-side-b2b', eq.layoutConfig?.sideViewCabinetIndex, r.cabinets);
            }
        } else {
            const result = this.suggestLayout(eq);
            const c = document.createElement('canvas');
            this._drawLayoutCanvas(c, result.cabinets);
            const img = document.getElementById('layout-canvas');
            if (img) img.src = c.toDataURL('image/png');
            const seg = eq.technical?.segregacao;
            if (seg === 'Forma 1' || seg === 'Forma 2a' || seg === 'Forma 2b') {
                const ce = document.createElement('canvas');
                this._drawLayoutCanvasExternal(ce, result.cabinets);
                const imgExt = document.getElementById('layout-canvas-external');
                if (imgExt) imgExt.src = ce.toDataURL('image/png');
            }
            if (showSide && result.cabinets.length > 0) {
                this._drawSideView(result.cabinets, 'side-view-container', 'layout-canvas-side', eq.layoutConfig?.sideViewCabinetIndex);
            }
        }
    },

    _onChangeCcwArmario(blockCabId, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const parts = blockCabId ? blockCabId.split('|') : [];
        const cabId = parts[0];
        const cab = eq.layoutConfig?.cabinetAssignments?.[cabId];
        if (!cab) return;
        const ccw = parseInt(value, 10);
        if (!cab.layoutConfig) cab.layoutConfig = this._getDefaultLayoutConfig();
        cab.layoutConfig.colunaCabosWidth = ccw;
        cab.width = 600 + ccw;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); }
        this._redrawLayoutCanvas();
        // Update body text in config block
        const block = document.querySelector(`.cab-config-block[data-cab-id="${blockCabId}"]`);
        if (block) {
            const bodyDiv = block.querySelector('.cab-config-body > div');
            if (bodyDiv) {
                const infoDiv = bodyDiv.querySelector('div:last-child');
                if (infoDiv) {
                    const isEletropoll = eq.technical?.fabricante === 'Eletropoll';
                    infoDiv.textContent = isEletropoll ? `Eletropoll — ${cab.width - 400}mm (gavetas) + 400mm (coluna cabos) = ${cab.width}mm × 2300mm` : `KitFrame — 600mm (gavetas) + ${ccw}mm (coluna cabos) = ${600 + ccw}mm × 2300mm`;
                }
            }
        }
    },

    _onChangeGavetaMode(blockCabId, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const parts = blockCabId ? blockCabId.split('|') : [];
        const cabId = parts[0];
        const cab = eq.layoutConfig?.cabinetAssignments?.[cabId];
        if (!cab) return;
        if (!cab.layoutConfig) cab.layoutConfig = this._getDefaultLayoutConfig();
        cab.layoutConfig.gavetaMode = value;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); }
        this._redrawLayoutCanvas();
    },

    _onChangeExaustorArmario(blockCabId, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const parts = blockCabId ? blockCabId.split('|') : [];
        const cabId = parts[0];
        const cab = eq.layoutConfig?.cabinetAssignments?.[cabId];
        if (!cab) return;
        if (!cab.layoutConfig) cab.layoutConfig = this._getDefaultLayoutConfig();
        cab.layoutConfig.exaustor = !!value;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); }
        this._redrawLayoutCanvas();
    },

    _onChangeProfundidadeArmario(blockCabId, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const parts = blockCabId ? blockCabId.split('|') : [];
        const cabId = parts[0];
        const cab = eq.layoutConfig?.cabinetAssignments?.[cabId];
        if (!cab) return;
        cab.depth = parseInt(value, 10) || 600;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); }
        this._redrawLayoutCanvas();
    },

    _onChangeAutoChaparia(value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        eq.autoChaparia = !!value;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); }
        app.toast(`Inserção automática de chaparia ${eq.autoChaparia ? 'ativada' : 'desativada'}.`, 'info');
    },

    async _showReserveSetupDialog(cabinetReserves) {
        return new Promise((resolve) => {
            const existing = document.getElementById('_reserve_setup_dlg');
            if (existing) existing.remove();

            const dlg = document.createElement('div');
            dlg.id = '_reserve_setup_dlg';
            dlg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

            dlg.innerHTML = `
                <div style="background:#fff;border-radius:12px;padding:24px;max-width:560px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
                    <h3 style="margin:0 0 4px;color:#059669;font-size:16px;">📦 Personalizar Gavetas Reservas</h3>
                    <p style="font-size:13px;color:#475569;margin:0 0 16px;">Escolha a distribuição de gavetas reservas para cada armário:</p>
                    ${cabinetReserves.map(cr => `
                        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:12px;">
                            <div style="font-weight:600;font-size:14px;color:#166534;margin-bottom:6px;">${cr.cabName} — ${cr.space}mm disponível</div>
                            ${cr.options.map((opt, oi) => {
                                const label = opt.map(h => h + 'mm').join(' + ');
                                return `<label style="display:block;padding:4px 0;font-size:13px;color:#374151;cursor:pointer;">
                                    <input type="radio" name="reserve_${cr.cabIndex}" value="${oi}" ${oi === 0 ? 'checked' : ''} style="margin-right:6px;">
                                    ${label} (${opt.length} gaveta${opt.length > 1 ? 's' : ''})
                                </label>`;
                            }).join('')}
                        </div>
                    `).join('')}
                    <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e2e8f0;padding-top:16px;">
                        <button class="btn btn-sm btn-ghost" id="btn_skip_reserves" style="color:#64748b;">Pular, usar default</button>
                        <button class="btn btn-sm btn-primary" id="btn_apply_reserves" style="background:#059669;border-color:#059669;">✔ Aplicar</button>
                    </div>
                </div>`;

            document.body.appendChild(dlg);

            document.getElementById('btn_apply_reserves').onclick = () => {
                const selections = {};
                cabinetReserves.forEach(cr => {
                    const sel = document.querySelector(`input[name="reserve_${cr.cabIndex}"]:checked`);
                    if (sel) selections[cr.cabIndex] = parseInt(sel.value);
                });
                dlg.remove();
                resolve(selections);
            };

            document.getElementById('btn_skip_reserves').onclick = () => {
                dlg.remove();
                resolve(null);
            };
        });
    },

    async _onCriarArranjoOtimizado() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        eq.layoutConfig.cabinetAssignments = {};

        const isEletropollArranjo = eq.technical?.fabricante === 'Eletropoll';
        const tipoGavetaArranjo = eq.technical?.tipoGaveta || 'Fixo';
        const arrangement = this._rebalanceCabinets(this._distributeLoadsAcrossCabinets(eq.loads || [], eq.technical?.fabricante, tipoGavetaArranjo));
        const tipicos = store.getState().tipicos || [];
        const materiais = store.getState().materiais || [];
        const MAX_H = 1800;
        const defaultCCW = isEletropollArranjo ? 400 : 200;
        const cabWidth = isEletropollArranjo ? 1000 : (600 + defaultCCW);

        const cabEntries = [];
        for (let i = 0; i < arrangement.length; i++) {
            const group = arrangement[i];
            const cabId = 'cab_' + Date.now() + '_' + i;
            const cabName = 'Coluna ' + (i + 1).toString().padStart(2, '0');

            let widthArranjo = cabWidth;
            if (isEletropollArranjo) {
                let maxGW = 600;
                for (const carga of (group.loads || [])) {
                    if (!carga.tag) continue;
                    const epRes = this._getEletropollDrawerHeight(carga, tipoGavetaArranjo);
                    if (epRes && !epRes.consultar && epRes.width && epRes.width > maxGW) {
                        maxGW = epRes.width;
                    }
                }
                widthArranjo = maxGW + defaultCCW;
            }

            const cabEntry = {
                name: cabName,
                width: widthArranjo,
                height: 2300,
                depth: 600,
                loads: {},
                layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
            };
            cabEntry.layoutConfig.colunaCabosWidth = defaultCCW;

            for (const carga of group.loads) {
                if (!carga.tag) continue;
                if (!cabEntry.loads[carga.tag]) cabEntry.loads[carga.tag] = {};
                if (carga.typicalId) {
                    const typical = tipicos.find(t => t.id === carga.typicalId);
                    if (typical?.items) {
                        for (const item of typical.items) {
                            const material = materiais.find(m => m.id === item.materialId);
                            if (!material) continue;
                            const w = parseFloat(material.largura_mm) || 0;
                            const h = parseFloat(material.altura_mm) || 0;
                            const d = parseFloat(material.profundidade_mm) || 0;
                            if (w === 0 && h === 0 && d === 0) continue;
                            const matId = material.id;
                            if (!cabEntry.loads[carga.tag][matId]) cabEntry.loads[carga.tag][matId] = { qtd: 0 };
                            cabEntry.loads[carga.tag][matId].qtd += item.qtd || 1;
                        }
                    }
                }
            }

            cabEntries.push({ cabId, cabEntry, totalHeight: group.totalHeight });
        }

        // Collect reserve spaces for dialog
        const cabReserves = [];
        for (let i = 0; i < cabEntries.length; i++) {
            const { cabEntry, totalHeight } = cabEntries[i];
            const space = MAX_H - totalHeight;
            if (space >= 225) {
                cabReserves.push({
                    cabIndex: i,
                    cabName: cabEntry.name,
                    space,
                    options: this._getReserveOptions(space),
                });
            }
        }

        let selections = null;
        if (cabReserves.length > 0) {
            selections = await this._showReserveSetupDialog(cabReserves);
        }

        // Apply selections
        if (selections) {
            for (const cr of cabReserves) {
                const optIdx = selections[cr.cabIndex];
                if (optIdx !== undefined && cr.options[optIdx]) {
                    cabEntries[cr.cabIndex].cabEntry._reserveCombo = cr.options[optIdx];
                }
            }
        }

        for (const { cabId, cabEntry } of cabEntries) {
            eq.layoutConfig.cabinetAssignments[cabId] = cabEntry;
        }

        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Arranjo] store error:', e); }

        // Auto-insert chaparia if enabled — sempre com feedback de custo
        // (inserção muda o valor do equipamento; nada silencioso).
        if (eq.autoChaparia !== false) {
            const itens = this._gerarMateriaisChaparia(eq);
            if (itens && itens.length > 0) {
                eq.materials = [...(eq.materials || []).filter(m => m._origin !== 'chaparia'), ...itens];
                const custoChaparia = itens.reduce((s, i) => s + (i.custo || 0) * i.qtd, 0);
                app.toast(`${itens.length} itens de chaparia inseridos na LM (${app.formatCurrency(custoChaparia)}).`, 'info');
            }
        } else {
            app.toast('Auto Chaparia desligado — chaparia não incluída. Use "Gerar Chaparia" para revisar e inserir.', 'info');
        }

        this._redrawLayoutCanvas();
        this._showLayoutConfigPanel();
    },

    _showExcessLoadsDialog(excessLoads) {
        const existing = document.getElementById('_excess_loads_dlg');
        if (existing) existing.remove();

        const dlg = document.createElement('div');
        dlg.id = '_excess_loads_dlg';
        dlg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        dlg.innerHTML = `
            <div style="background:#fff;border-radius:12px;padding:24px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <h3 style="margin:0 0 8px;color:#dc2626;font-size:16px;">⚠️ Capacidade máxima atingida</h3>
                <p style="font-size:13px;color:#475569;margin:0 0 12px;">${excessLoads.length} carga(s) não puderam ser alocadas:</p>
                <div style="font-size:12px;color:#64748b;margin-bottom:16px;">
                    ${excessLoads.map(l => `<div style="padding:3px 0;">• ${l.tag} - ${l.desc || l.tag} (${this._getDrawerHeight(l, data?.equipments?.[this.activeEquipmentIndex]?.technical?.fabricante, data?.equipments?.[this.activeEquipmentIndex]?.technical?.tipoGaveta || 'Fixo')}mm)</div>`).join('')}
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e2e8f0;padding-top:16px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#_excess_loads_dlg').remove()" style="color:#64748b;">Cancelar</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._showLayoutConfigPanel();this.closest('#_excess_loads_dlg').remove()" style="gap:4px;">
                        ⚙️ Abrir Config Layout
                    </button>
                    <button class="btn btn-sm btn-primary" data-excess='${encodeURIComponent(JSON.stringify(excessLoads.map(l => ({ tag: l.tag, desc: l.desc || l.tag, power: l.power, current: l.current }))))}' onclick="window.propostaTecnicaModule._criarNovoArmarioParaExcedentes(JSON.parse(decodeURIComponent(this.dataset.excess)));this.closest('#_excess_loads_dlg').remove()" style="background:#059669;border-color:#059669;gap:4px;">
                        ➕ Criar Novo Armário
                    </button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _criarNovoArmarioParaExcedentes(excessLoads) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const seg = eq.technical?.segregacao || '';
        const isKF = this._isForma34EstruturaModular(seg, eq.technical?.fabricante);
        if (!isKF || !eq.layoutConfig?.cabinetAssignments) return;
        if (!excessLoads || excessLoads.length === 0) return;

        const ass = eq.layoutConfig.cabinetAssignments;
        const tagsToMove = new Set(excessLoads.map(l => l.tag).filter(Boolean));

        // Remove excess load tags from all existing cabinets to prevent duplication
        for (const cab of Object.values(ass)) {
            for (const faceKey of ['front', 'rear']) {
                const face = cab.faces?.[faceKey];
                if (face?.loads) {
                    for (const t of tagsToMove) delete face.loads[t];
                }
            }
            if (cab.loads) {
                for (const t of tagsToMove) delete cab.loads[t];
            }
        }

        // Create a new cabinet for the excess loads
        const cabId = 'cab_' + Date.now();
        const cabCount = Object.keys(ass).length + 1;
        const cabName = 'Coluna ' + cabCount.toString().padStart(2, '0');
        const defaultCCW = 200;
        const cabWidth = 600 + defaultCCW;

        const cabEntry = {
            name: cabName,
            width: cabWidth,
            height: 2300,
            depth: 600,
            loads: {},
            layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
        };
        cabEntry.layoutConfig.colunaCabosWidth = defaultCCW;

        for (const carga of excessLoads) {
            if (!carga.tag) continue;
            cabEntry.loads[carga.tag] = {};
        }

        ass[cabId] = cabEntry;

        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[NovoArmario] store error:', e); }

        this._redrawLayoutCanvas();
        this._showLayoutConfigPanel();
    },

    _toggleSideView() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isB2B = (eq.technical?.montagem) === 'Back to Back';
        const chk = document.getElementById(isB2B ? 'chk_side_view_b2b' : 'chk_side_view');
        if (!chk) return;
        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        eq.layoutConfig.showSideView = chk.checked;
        const container = document.getElementById(isB2B ? 'side-view-container-b2b' : 'side-view-container');
        if (container) container.style.display = chk.checked ? 'block' : 'none';
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        if (chk.checked) {
            if (eq.layoutConfig.sideViewCabinetIndex == null) eq.layoutConfig.sideViewCabinetIndex = -1;
            this._redrawLayoutCanvas();
        }
    },

    _onChangeSideViewCabinet(_isRear) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isB2B = (eq.technical?.montagem) === 'Back to Back';
        const selId = isB2B ? 'sel_side_view_cabinet_b2b' : 'sel_side_view_cabinet';
        const sel = document.getElementById(selId);
        if (!sel) return;
        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        eq.layoutConfig.sideViewCabinetIndex = parseInt(sel.value, 10);
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        this._redrawLayoutCanvas();
    },

    _setManualX(matId, loadId, cabId, instanceIdx, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        const pipeIdx = (cabId || '').indexOf('|');
        const baseCabId = pipeIdx > 0 ? cabId.slice(0, pipeIdx) : cabId;
        if (!layoutConfig.cabinetAssignments?.[baseCabId]) return;

        let target = null;
        let realCabId = baseCabId;
        if (pipeIdx > 0) {
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[baseCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || null;
        } else {
            const parent = layoutConfig.cabinetAssignments[baseCabId];
            target = parent?.loads?.[loadId]?.[matId] || null;
        }
        if (!target) return;

        let rawValue = value !== '' && value != null ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : null;

        if (rawValue != null && rawValue > 0 && matId) {
            const cabData = layoutConfig.cabinetAssignments[realCabId];
            const cabWidth = cabData?.width || 600;
            const cabCfg = cabData?.layoutConfig || {};
            const railLen = cabCfg.comprimentoTrilho || (cabWidth - (cabCfg.canaletaEsq || 0) - (cabCfg.canaletaDir || 0));
            const materiais = store.getState().materiais || [];
            const material = materiais.find(m => m.id === matId);
            if (material) {
                const iw = parseFloat(material.largura_mm) || 50;
                const gap = this._getGapTermico(cabCfg, material.categoria || '');
                const qtd = target.linhaSplit?.length
                    ? Math.max(...target.linhaSplit.map(s => s.qtd))
                    : (target.qtd || 1);
                const totalItemWidth = qtd * iw + Math.max(0, qtd - 1) * gap;
                const maxX = Math.max(0, railLen - totalItemWidth);
                if (rawValue > maxX) {
                    rawValue = Math.round(maxX);
                    if (typeof app?.toast === 'function') app.toast(`X ajustado para ${rawValue}mm (limite do trilho)`, 'info');
                }
            }
        }

        target.xOffset = rawValue;

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        const _idx = this.activeEquipmentIndex;
        const _eqs = [...(data.equipments || [])];
        _eqs[_idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: _eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        this._redrawLayoutCanvas();
    },

    _setManualZ(matId, loadId, cabId, instanceIdx, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        const pipeIdx = (cabId || '').indexOf('|');
        const baseCabId = pipeIdx > 0 ? cabId.slice(0, pipeIdx) : cabId;
        if (!layoutConfig.cabinetAssignments?.[baseCabId]) return;

        let target = null;
        let realCabId = baseCabId;
        let parent = null;
        if (pipeIdx > 0) {
            const face = cabId.slice(pipeIdx + 1);
            parent = layoutConfig.cabinetAssignments[baseCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || null;
        } else {
            parent = layoutConfig.cabinetAssignments[baseCabId];
            target = parent?.loads?.[loadId]?.[matId] || null;
        }
        if (!target) return;

        let rawValue = value !== '' && value != null ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : null;

        if (rawValue != null && rawValue > 0 && matId) {
            const rawDepth = parent?.depth || layoutConfig.cabinetAssignments[baseCabId]?.depth || 600;
            const cabDepth = rawDepth;
            const material = (store.getState().materiais || []).find(m => m.id === matId);
            if (material) {
                const id = parseFloat(material.profundidade_mm) || 50;
                const maxZ = Math.max(0, cabDepth - id);
                if (rawValue > maxZ) {
                    rawValue = Math.round(maxZ);
                    if (typeof app?.toast === 'function') app.toast(`Z ajustado para ${rawValue}mm (limite de profundidade do armário: ${cabDepth}mm)`, 'info');
                }
            }
        }

        target.zOffset = rawValue;

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        const _idx = this.activeEquipmentIndex;
        const _eqs = [...(data.equipments || [])];
        _eqs[_idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: _eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        this._redrawLayoutCanvas();
    },

    _setLinhaMaterial(matId, loadId, cabId, linhaId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments?.[cabId]) return;

        let realCabId = cabId;
        const pipeIdx = cabId.indexOf('|');
        let target = null;
        if (pipeIdx > 0) {
            realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || null;
        } else {
            const parent = layoutConfig.cabinetAssignments[cabId];
            target = parent?.loads?.[loadId]?.[matId] || null;
        }
        if (!target) return;

        target.linhaId = linhaId || undefined;

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setPortaMaterial(matId, loadId, cabId, porta) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments?.[cabId]) return;

        let realCabId = cabId;
        const pipeIdx = cabId.indexOf('|');
        let target = null;
        if (pipeIdx > 0) {
            realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || null;
        } else {
            const parent = layoutConfig.cabinetAssignments[cabId];
            target = parent?.loads?.[loadId]?.[matId] || null;
        }
        if (!target) return;

        target.porta = porta;
        if (!porta) {
            target.portaLinhaId = undefined;
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setPortaLinhaMaterial(matId, loadId, cabId, portaLinhaId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments?.[cabId]) return;

        let realCabId = cabId;
        const pipeIdx = cabId.indexOf('|');
        let target = null;
        if (pipeIdx > 0) {
            realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || null;
        } else {
            const parent = layoutConfig.cabinetAssignments[cabId];
            target = parent?.loads?.[loadId]?.[matId] || null;
        }
        if (!target) return;

        target.portaLinhaId = portaLinhaId || undefined;

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _saveEq() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        this._savedScrollTop = document.querySelector('#form-proposta-tecnica > div')?.scrollTop ?? null;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) {}
        if (this.activeSubTab === 'layout') this.renderSubTab();
    },

    _toggleSplitMode(matId, loadId, cabId) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target) return;

        if (target.linhaSplit && target.linhaSplit.length > 0) {
            const firstSplit = target.linhaSplit[0];
            target.linhaId = firstSplit?.linhaId || target.linhaId || undefined;
            delete target.linhaSplit;
        } else {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            const layoutConfig = eq?.layoutConfig || this._getDefaultLayoutConfig();
            const realCabId = cabId.includes('|') ? cabId.slice(0, cabId.indexOf('|')) : cabId;
            const cabLines = layoutConfig.cabinetAssignments?.[realCabId]?.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;
            const firstLinhaId = target.linhaId || cabLines[0]?.id || '';
            const other = cabLines.filter(l => l.id !== firstLinhaId);
            const qtd1 = Math.ceil(target.qtd / 2);
            const qtd2 = target.qtd - qtd1;
            target.linhaSplit = [{ linhaId: firstLinhaId, qtd: qtd1 }];
            if (other.length > 0 && qtd2 > 0) {
                target.linhaSplit.push({ linhaId: other[0].id, qtd: qtd2 });
            }
        }
        this._saveEq();
    },

    _addSplitEntry(matId, loadId, cabId) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target) return;
        if (!target.linhaSplit) target.linhaSplit = [];

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        const layoutConfig = eq?.layoutConfig || this._getDefaultLayoutConfig();
        const realCabId = cabId.includes('|') ? cabId.slice(0, cabId.indexOf('|')) : cabId;
        const cabLines = layoutConfig.cabinetAssignments?.[realCabId]?.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;
        const usedLines = target.linhaSplit.map(s => s.linhaId);
        const available = cabLines.filter(l => !usedLines.includes(l.id));
        const nextLine = available.length > 0 ? available[0].id : (cabLines[0]?.id || '');
        target.linhaSplit.push({ linhaId: nextLine, qtd: 0 });
        this._saveEq();
    },

    _removeSplitEntry(matId, loadId, cabId, index) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target || !target.linhaSplit) return;
        target.linhaSplit.splice(index, 1);
        if (target.linhaSplit.length === 0) delete target.linhaSplit;
        this._saveEq();
    },

    _updateSplitEntry(matId, loadId, cabId, index, field, value) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target || !target.linhaSplit) return;
        if (index < 0 || index >= target.linhaSplit.length) return;

        if (field === 'qtd') {
            target.linhaSplit[index].qtd = Math.max(0, parseInt(value) || 0);
        } else if (field === 'linhaId') {
            target.linhaSplit[index].linhaId = value || undefined;
        }
        this._saveEq();
    },

    _filtrarBOM() {
        const filter = (document.getElementById('bom_filter')?.value || '').toLowerCase();
        const items = document.querySelectorAll('#bom_tree > div.bom-load-section');
        items.forEach(div => {
            const header = div.querySelector('.bom-load-header');
            const text = header ? header.textContent.toLowerCase() : div.textContent.toLowerCase();
            div.style.display = text.includes(filter) ? '' : 'none';
        });
    },

    _getCategoryColor(category) {
        const cat = (category || '').toUpperCase();
        if (cat.includes('DISJUNTOR')) return '#ef4444';
        if (cat.includes('CONTATOR')) return '#3b82f6';
        if (cat.includes('INVERSOR') || cat.includes('SOFT-STARTER') || cat.includes('SOFT STARTER')) return '#f59e0b';
        if (cat.includes('RELÉ') || cat.includes('RELE')) return '#8b5cf6';
        if (cat.includes('BORNE')) return '#10b981';
        if (cat.includes('FONTE')) return '#ec4899';
        if (cat.includes('PLC') || cat.includes('MODULO') || cat.includes('MÓDULO')) return '#06b6d4';
        if (cat.includes('CABO')) return '#84cc16';
        return '#64748b';
    },

    _getDefaultDimension(category, dim) {
        const cat = (category || '').toUpperCase();
        const defaults = {
            'DISJUNTOR': { w: 36, h: 80 },
            'DISJUNTOR MOTOR': { w: 45, h: 90 },
            'CONTATOR': { w: 45, h: 80 },
            'INVERSOR': { w: 100, h: 200 },
            'SOFT-STARTER': { w: 70, h: 150 },
            'RELÉ': { w: 22, h: 80 },
            'RELE': { w: 22, h: 80 },
            'BORNE': { w: 6, h: 45 },
            'FONTE': { w: 60, h: 100 },
        };
        for (const [key, vals] of Object.entries(defaults)) {
            if (cat.includes(key)) return dim === 'w' ? vals.w : vals.h;
        }
        return dim === 'w' ? 50 : 80;
    },

    _layoutCabinetRows(cab) {
        const rows = [];
        const warnings = [];
        const layoutConfig = cab.layoutConfig || this._getDefaultLayoutConfig();
        const cabWidth = cab.width - layoutConfig.canaletaEsq - layoutConfig.canaletaDir;
        const railLen = (layoutConfig.comprimentoTrilho || 0) > 0 ? layoutConfig.comprimentoTrilho : cabWidth;
        const leftMargin = layoutConfig.canaletaEsq;
        const assignData = cab._assignData;
        const assignedSource = assignData && cab._face
            ? this._getLoadsAsFlat(assignData.faces?.[cab._face])
            : this._getLoadsAsFlat(assignData);


        const grouped = {};
        for (const linha of layoutConfig.linhas) {
            grouped[linha.id] = [];
        }
        grouped.__outros = [];

        const lineItemCount = {};
        for (const item of cab.items) {
            if (item._porta) continue;
            const linha = this._getLinhaParaItem(layoutConfig, item.category, item, lineItemCount);
            const key = linha ? linha.id : '__outros';
            grouped[key].push(item);
            if (linha) {
                lineItemCount[linha.id] = (lineItemCount[linha.id] || 0) + (item.qtd || 1);
            }
        }

        const getYC = l => l.yCentroTrilho ?? Math.round(((l.yInicio || 0) + (l.yFim || 0)) / 2);

        const packLinhaRow = (items, linhaObj) => {
            if (items.length === 0) return null;
            const yCentro = getYC(linhaObj);
            const trilhoAlt = layoutConfig.larguraTrilhoDIN || 35;

            const sorted = [...items].sort((a, b) => {
                const ha = a.h || this._getDefaultDimension(a.category, 'h');
                const hb = b.h || this._getDefaultDimension(b.category, 'h');
                if (hb !== ha) return hb - ha;
                const wa = a.w || this._getDefaultDimension(a.category, 'w');
                const wb = b.w || this._getDefaultDimension(b.category, 'w');
                return wb - wa;
            });

            const rowItems = [];
            let usedWidth = 0;
            let rowHeight = 0;

            for (const item of sorted) {
                const iw = item.w || this._getDefaultDimension(item.category, 'w');
                const ih = item.h || this._getDefaultDimension(item.category, 'h');
                const gap = this._getGapTermico(layoutConfig, item.category);
                const qtd = item.qtd || 1;


                for (let qi = 0; qi < qtd; qi++) {
                    if (rowItems.length > 0) usedWidth += gap;
                    rowItems.push({
                        desc: item.desc, qtd: 1,
                        x: usedWidth + leftMargin, y: 0, z: 0,
                        w: iw, h: ih, d: item.d || 0, color: item.color, category: item.category,
                        _matId: item._matId, _instanceIdx: qi, _zOffset: item._zOffset
                    });
                    usedWidth += iw;
                    rowHeight = Math.max(rowHeight, ih);
                }
            }

            // Check natural overflow BEFORE applying xOffset
            const railEnd = leftMargin + railLen;
            let overflow = false;
            for (const it of rowItems) {
                if (it.x + it.w - 0.01 > railEnd) { overflow = true; break; }
            }
            // Clamp natural overflow (items too wide to fit in rail)
            if (overflow) {
                const maxRight = Math.max(...rowItems.map(it => it.x + it.w));
                const excess = maxRight - railEnd;
                if (excess > 0) {
                    for (const it of rowItems) {
                        it.x = Math.max(leftMargin, it.x - excess);
                    }
                }
            }

            // Apply manual X offset AFTER clamping (user override is preserved)
            for (const it of rowItems) {
                if (it._matId && assignedSource[it._matId]?.xOffset != null) {
                    it.x += assignedSource[it._matId].xOffset;
                }
            }
            rowItems.sort((a, b) => a.x - b.x);

            // Check final overflow for warning only (do NOT clamp user's manual offset)
            overflow = false;
            for (const it of rowItems) {
                if (it.x + it.w - 0.01 > railEnd) { overflow = true; break; }
            }
            for (let i = 1; i < rowItems.length; i++) {
                if (rowItems[i].x + 0.01 < rowItems[i - 1].x + rowItems[i - 1].w) { overflow = true; break; }
            }

            for (const it of rowItems) {
                it.y = yCentro - (it.h || this._getDefaultDimension(it.category, 'h')) / 2;
            }

            return {
                row: {
                    y: yCentro - trilhoAlt / 2,
                    rowHeight: Math.max(rowHeight || 45, 30),
                    items: rowItems, usedWidth,
                    linha: linhaObj,
                    trilho: linhaObj.temTrilho !== false
                        ? { y: yCentro - trilhoAlt / 2, h: trilhoAlt, w: railLen, x: leftMargin }
                        : null
                },
                overflow
            };
        };

        for (const linha of layoutConfig.linhas) {
            const items = grouped[linha.id] || [];
            if (items.length === 0) continue;
            const result = packLinhaRow(items, linha);
            if (result) {
                result.row.linha = linha;
                rows.push(result.row);
                if (result.overflow) {
                    warnings.push(`${linha.nome}: largura insuficiente no trilho (${railLen}mm). Crie outra linha ou aumente a largura do armário.`);
                }
            }
        }

        const outros = grouped.__outros || [];
        if (outros.length > 0) {
            const lastLinha = layoutConfig.linhas[layoutConfig.linhas.length - 1];
            const yCentro = lastLinha ? getYC(lastLinha) + 100 : 900;
            const result = packLinhaRow(outros, { id: '__outros', nome: 'Outros', yCentroTrilho: yCentro });
            if (result) {
                result.row.linha = { id: '__outros', nome: 'Outros' };
                rows.push(result.row);
                if (result.overflow) {
                    warnings.push('Outros: largura insuficiente no trilho para itens não categorizados.');
                }
            }
        }

        // Detect vertical collisions between materials on different linhas
        const materialCollisions = this._detectMaterialCollisions(rows);
        if (materialCollisions.length > 0) {
            cab._collisions = materialCollisions;
            for (const c of materialCollisions) {
                warnings.push(`Conflito: "${c.itemA.desc}" (${c.linhaA}) e "${c.itemB.desc}" (${c.linhaB}) se sobrepõem.`);
            }
        } else {
            cab._collisions = [];
        }

        cab.warning = warnings.join(' ');
        return rows;
    },

    _layoutDoorRows(cab) {
        const doorItems = cab.doorItems || [];
        if (doorItems.length === 0) return [];
        const layoutConfig = cab.layoutConfig || this._getDefaultLayoutConfig();
        const doorLinhas = layoutConfig.doorLinhas || this._getDefaultLayoutConfig().doorLinhas;
        const doorW = Math.max(cab.width - 10, 50);
        const leftOffset = (cab.width - doorW) / 2;
        const rows = [];

        const grouped = {};
        for (const linha of doorLinhas) {
            grouped[linha.id] = [];
        }
        grouped.__outros = [];

        for (const item of doorItems) {
            const key = item._portaLinhaId && grouped[item._portaLinhaId] ? item._portaLinhaId : '__outros';
            grouped[key].push(item);
        }

        for (const linha of doorLinhas) {
            const items = grouped[linha.id] || [];
            if (items.length === 0) continue;
            const yCentro = linha.yCentro ?? linha.yCentroTrilho ?? 200;

            const sorted = [...items].sort((a, b) => {
                const ha = a.h || 50; const hb = b.h || 50;
                if (hb !== ha) return hb - ha;
                return (b.w || 50) - (a.w || 50);
            });

            const rowItems = [];
            let usedWidth = 0;
            let rowHeight = 0;

            for (const item of sorted) {
                const iw = item.w || 50;
                const ih = item.h || 50;
                const qtd = item.qtd || 1;

                for (let qi = 0; qi < qtd; qi++) {
                    if (rowItems.length > 0) usedWidth += 5;
                    rowItems.push({
                        desc: item.desc, qtd: 1,
                        x: usedWidth + leftOffset, y: 0,
                        w: iw, h: ih, color: item.color, category: item.category,
                        _matId: item._matId, _instanceIdx: qi, _porta: true
                    });
                    usedWidth += iw;
                    rowHeight = Math.max(rowHeight, ih);
                }
            }

            const doorEnd = leftOffset + doorW;
            let overflow = false;
            for (const it of rowItems) {
                if (it.x + it.w - 0.01 > doorEnd) { overflow = true; break; }
            }
            if (overflow) {
                const maxRight = Math.max(...rowItems.map(it => it.x + it.w));
                const excess = maxRight - doorEnd;
                if (excess > 0) {
                    for (const it of rowItems) {
                        it.x = Math.max(leftOffset, it.x - excess);
                    }
                }
            }

            for (const it of rowItems) {
                it.y = yCentro - (it.h || 50) / 2;
            }

            rows.push({
                y: yCentro - 20,
                rowHeight: Math.max(rowHeight, 40),
                items: rowItems,
                usedWidth,
                linha: linha
            });
        }

        const outros = grouped.__outros || [];
        if (outros.length > 0) {
            const lastLinha = doorLinhas[doorLinhas.length - 1];
            const yCentro = lastLinha ? (lastLinha.yCentro || 200) + 100 : 900;
            const sorted = [...outros].sort((a, b) => (b.w || 50) - (a.w || 50));
            const rowItems = [];
            let usedWidth = 0;
            let rowHeight = 0;
            for (const item of sorted) {
                const iw = item.w || 50; const ih = item.h || 50;
                const qtd = item.qtd || 1;
                for (let qi = 0; qi < qtd; qi++) {
                    if (rowItems.length > 0) usedWidth += 5;
                    rowItems.push({
                        desc: item.desc, qtd: 1,
                        x: usedWidth + leftOffset, y: 0,
                        w: iw, h: ih, color: item.color, category: item.category,
                        _matId: item._matId, _instanceIdx: qi, _porta: true
                    });
                    usedWidth += iw;
                    rowHeight = Math.max(rowHeight, ih);
                }
            }
            for (const it of rowItems) {
                it.y = yCentro - (it.h || 50) / 2;
            }
            rows.push({
                y: yCentro - 20,
                rowHeight: Math.max(rowHeight, 40),
                items: rowItems,
                usedWidth,
                linha: { id: '__outros', nome: 'Outros (Porta)' }
            });
        }

        return rows;
    },

    renderDSGroup(label, field, value, options) {
        const escaped = JSON.stringify(label).slice(1, -1);
        const hasOutro = options.includes('Outro');
        const normalOptions = hasOutro ? options.slice(0, -1) : options;
        const isOutro = value && !normalOptions.includes(value);
        const aiFilled = this._aiFieldsForCurrentEq?.has(field);
        const aiClass = aiFilled ? ' ai-filled' : '';
        const aiBadge = aiFilled ? '<span class="ai-label">IA</span>' : '';
        return `
            <div class="form-group ds-group" data-field="${field}">
                <label class="form-label">${escaped || label}${aiBadge}</label>
                <div style="display:flex;gap:8px;align-items:center;">
                    <select name="eq_${field}" class="form-control ds-select${aiClass}" style="flex:1;min-width:0;" onchange="app.propostaTecnica.handleDSSelect(this, '${field}')">
                        ${normalOptions.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        <option value="Outro" ${isOutro ? 'selected' : ''}>Outro</option>
                    </select>
                    <input type="text" name="eq_${field}_specify" class="form-control ds-specify" placeholder="Especifique" value="${isOutro ? value : ''}" style="flex:1;display:${isOutro ? 'block' : 'none'};" oninput="app.propostaTecnica.handleDSSelect(this, '${field}')">
                </div>
            </div>
        `;
    },

    handleDSSelect(select, field) {
        select.classList.remove('ai-filled');
        const label = select.closest('.ds-group')?.querySelector('.ai-label');
        if (label) label.remove();
        const state = store.getState();
        const p = state.activeTechnicalProposal;
        if (p && p._aiChanges && p._aiChanges.equipments && this.activeEquipmentIndex !== undefined) {
            const s = p._aiChanges.equipments[String(this.activeEquipmentIndex)];
            if (s) {
                if (s instanceof Set) s.delete(field);
                else delete s[field];
            }
        }
        const specify = select.closest('.ds-group').querySelector('.ds-specify');
        if (select.value === 'Outro') {
            specify.style.display = 'block';
            specify.focus();
        } else {
            specify.style.display = 'none';
            specify.value = '';
        }
    },






    renderLabor(eq) {

        if (eq.labor?.items) eq.labor.items = this.deduplicarLaborItems(eq.labor.items);
        const labor = eq.labor || { items: JSON.parse(JSON.stringify(DEFAULT_LABOR_ROLES)) };

        const laborRates = store.getState().settings?.laborRates || {};
        const composicoes = store.getState().composicoes || [];

        const totalHours = labor.items.reduce((sum, it) => sum + (it.hours || 0), 0);

        const totalCost = labor.items.reduce((sum, it) => {
            const rate = (it.hourlyRate || 0) || (laborRates[`${it.group}|${it.role}`] || laborRates[it.role] || 0);
            return sum + ((it.hours || 0) * rate);
        }, 0);

        const uniqueAreas = [...new Set(DEFAULT_LABOR_ROLES.map(d => d.group))];
        const hasAutoItems = labor.items.some(i => i.auto);
        const showDetalhe = eq._showDetalheComposicao;
        const detalhe = eq._composicaoDetalhada || [];

        const hasRegras = (store.getState().regrasDerivacao || []).length > 0;
        const hasComposicoes = composicoes.length > 0;
        const podeEstimar = hasRegras && hasComposicoes;

        return `

            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Mão de Obra Estimada: ${eq.tag}</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Horas de engenharia e montagem para este equipamento</div>

                    </div>

                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">

                        ${podeEstimar ? `
                            <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica.calcularMaoDeObraAuto()" style="background: #7c3aed; border-color: #7c3aed;">
                                <i class="ph ph-lightning"></i> Estimar
                            </button>
                            <button type="button" class="btn btn-sm btn-ghost" onclick="app.propostaTecnica.limparMaoDeObra()" style="color: #ef4444; padding: 4px 8px;" title="Limpar linhas automáticas">
                                <i class="ph ph-eraser"></i>
                            </button>
                        ` : `<span class="text-xs text-muted">Cadastre composições e regras para usar a estimativa automática.</span>`}
                        ${hasAutoItems && detalhe.length > 0 ? `
                            <button type="button" class="btn btn-sm btn-ghost" onclick="app.propostaTecnica.toggleDetalheComposicao()" style="color: #0891b2; padding: 4px 8px;">
                                <i class="ph ${showDetalhe ? 'ph-eye-slash' : 'ph-eye'}"></i> ${showDetalhe ? 'Ocultar' : 'Detalhar'}
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-sm btn-secondary" onclick="this.nextElementSibling.style.display='block'; this.style.display='none';">+ Adicionar Função</button>

                        <select style="display: none; font-size: 12px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="app.propostaTecnica.addLaborRow(this.value); this.style.display='none'; this.previousElementSibling.style.display=''; this.value='';">
                            <option value="">Selecione a Área...</option>
                            ${uniqueAreas.map(a => `<option value="${a}">${a}</option>`).join('')}
                        </select>

                    </div>

                </div>

                ${showDetalhe && detalhe.length > 0 ? `
                <div style="margin-bottom: 16px; padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
                    <h5 style="margin: 0 0 8px; font-size: 12px; color: #0369a1; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-list-bullets"></i> Composição Detalhada (baseada nas regras e composições)
                    </h5>
                    <div class="table-container" style="max-height: 200px; overflow-y: auto;">
                        <table style="font-size: 11px; border-collapse: collapse; width: 100%;">
                            <thead>
                                <tr style="background: #e0f2fe;">
                                    <th style="padding: 4px 6px; text-align: left;">Regra</th>
                                    <th style="padding: 4px 6px; text-align: left;">Composição</th>
                                    <th style="padding: 4px 6px; text-align: center;">Expressão</th>
                                    <th style="padding: 4px 6px; text-align: center;">Qtd</th>
                                    <th style="padding: 4px 6px; text-align: center;">Coef.</th>
                                    <th style="padding: 4px 6px; text-align: right;">HH</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detalhe.map(d => `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 6px; font-weight: 600;">${d.regra}</td>
                                        <td style="padding: 3px 6px;">[${d.composicao_codigo}] ${d.composicao_atividade}</td>
                                        <td style="padding: 3px 6px; font-family: monospace; text-align: center;">${d.expressao}</td>
                                        <td style="padding: 3px 6px; text-align: center;">${d.quantidade.toFixed(2)} ${d.unidade}</td>
                                        <td style="padding: 3px 6px; text-align: center;">${d.coeficiente_hh}h</td>
                                        <td style="padding: 3px 6px; text-align: right; font-weight: 600;">${d.hh.toFixed(2)}h</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto; background: white;">

                    <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                        <thead>

                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff;">

                                <th style="padding: 14px; text-align: left; width: 210px; color:#fff;">Área</th>

                                <th style="padding: 14px; text-align: left; color:#fff;">Função / Atividade</th>

                                <th style="padding: 14px; text-align: center; width: 100px; color:#fff;">Horas</th>

                                <th style="padding: 14px; text-align: right; width: 120px; color:#fff;">Valor/h (R$)</th>

                                <th style="padding: 14px; text-align: right; width: 140px; color:#fff;">Subtotal</th>

                            </tr>

                        </thead>

                        <tbody id="labor-body">

                            ${labor.items.map((it, i) => {
                                const isDefault = DEFAULT_LABOR_ROLES.some(d => d.group === it.group && d.role === it.role);
                                const roleReadonly = isDefault ? 'readonly' : '';
                                const defaultRate = laborRates[`${it.group}|${it.role}`] || laborRates[it.role] || 0;
                                const isOverridden = it.hourlyRate > 0 && it.hourlyRate !== defaultRate;
                                const effectiveRate = isOverridden ? it.hourlyRate : defaultRate;
                                const isAuto = !!it.auto;
                                const rowBg = isAuto ? '#f5f3ff' : (isOverridden ? '#eff6ff' : '');
                                return `
                                <tr class="labor-row" style="border-bottom: 1px solid #f1f5f9;${rowBg ? ` background: ${rowBg};` : ''}">
                                    <input type="hidden" name="labor_auto_${i}" value="${isAuto ? 'true' : ''}">

                                    <td style="padding: 12px;">

                                        <input type="text" name="labor_group_${i}" class="form-control" value="${it.group || ''}" readonly style="font-size: 12px; background: #f8fafc; cursor: default;">

                                    </td>

                                    <td style="padding: 12px; display: flex; align-items: center; gap: 4px;">
                                        <input type="text" name="labor_role_${i}" class="form-control" value="${it.role || ''}" style="font-weight: 600;" ${roleReadonly}>
                                        ${isAuto ? `<span style="font-size: 9px; background: #7c3aed; color: white; padding: 1px 5px; border-radius: 4px; white-space: nowrap;">auto</span>` : ''}
                                    </td>

                                    <td style="padding: 12px;"><input type="number" name="labor_hours_${i}" class="form-control" value="${it.hours || 0}" style="text-align: center;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

                                    <td style="padding: 12px; display: flex; align-items: center; gap: 4px; justify-content: flex-end;">
                                        <input type="text" name="labor_rate_${i}" class="form-control" value="${app.formatCurrency(effectiveRate).replace('R$', '').trim()}" style="text-align: right;" oninput="app.propostaTecnica.updateLaborTotals()" onblur="this.value=app.formatCurrencyRaw(app.parseCurrency(this.value))">
                                        ${isOverridden ? `<span title="Valor diferente do padrão: ${app.formatCurrency(defaultRate)}" style="font-size: 9px; background: #2563eb; color: white; padding: 1px 5px; border-radius: 4px; white-space: nowrap; cursor: help;">edit</span>` : ''}
                                    </td>

                                    <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e3a8a;">${app.formatCurrency((it.hours || 0) * effectiveRate)}</td>

                                </tr>
                            `}).join('')}

                        </tbody>

                        <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">

                            <tr>

                                <td colspan="2" style="padding: 14px; text-align: right; text-transform: uppercase; color: #64748b;">Totais do Equipamento</td>

                                <td id="labor-total-hours" style="padding: 14px; text-align: center; color: #1e3a8a;">${totalHours}h</td>

                                <td colspan="2" id="labor-total-cost" style="padding: 14px; text-align: right; color: #1e3a8a; font-size: 16px;">${app.formatCurrency(totalCost)}</td>

                            </tr>

                        </tfoot>

                    </table>

                </div>

            </div>

        `;

    },

    calcularMaoDeObraAuto() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const equipamentos = data.equipments || [];
        const idx = this.activeEquipmentIndex;
        const eq = equipamentos[idx];
        if (!eq) { app.toast('Selecione um equipamento.', 'warning'); return; }

        if (eq.labor?.items) eq.labor.items = this.deduplicarLaborItems(eq.labor.items);

        const result = window.autoMaoDeObra?.calcularMaoDeObraPorEquipamento(eq);
        if (!result || result.items.length === 0) {
            app.toast('Nenhuma regra aplicável para este equipamento. Verifique as regras de derivação.', 'info');
            return;
        }

        const autoKeys = new Set(result.items.map(i => `${i.group}|${i.role}`));
        const manuais = (eq.labor?.items || []).filter(i =>
            !autoKeys.has(`${i.group}|${i.role}`) &&
            (i.hours > 0 || i.hourlyRate > 0)
        );
        eq.labor = { items: [...manuais, ...result.items] };
        eq._composicaoDetalhada = result.composicaoDetalhada;
        eq._showDetalheComposicao = true;

        store.setState({ activeTechnicalProposal: data });
        this.renderSubTab();
        app.toast(`Mão de obra estimada: ${result.totalHoras.toFixed(1)}h (${result.items.length} funções)`, 'success');
    },

    limparMaoDeObra() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const equipamentos = data.equipments || [];
        const idx = this.activeEquipmentIndex;
        const eq = equipamentos[idx];
        if (!eq) return;

        eq.labor = { items: (eq.labor?.items || []).filter(i => !i.auto) };
        eq._composicaoDetalhada = [];
        eq._showDetalheComposicao = false;
        store.setState({ activeTechnicalProposal: data });
        this.renderSubTab();
        app.toast('Linhas automáticas removidas.', 'info');
    },

    toggleDetalheComposicao() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const idx = this.activeEquipmentIndex;
        const eq = (data.equipments || [])[idx];
        if (!eq) return;
        eq._showDetalheComposicao = !eq._showDetalheComposicao;
        this.renderSubTab();
    },

    renderSubTab() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        this.renderModal(data);
    },

    async calcularMaoDeObraTodosEquipamentos() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const equipments = data.equipments || [];
        if (equipments.length === 0) { app.toast('Nenhum equipamento na proposta.', 'warning'); return; }

        const hasRegras = (store.getState().regrasDerivacao || []).length > 0;
        if (!hasRegras) { app.toast('Cadastre regras de derivação primeiro.', 'info'); return; }

        let total = 0;
        let count = 0;

        equipments.forEach(eq => {
            if (eq.type === 'SEU') return;
            if (eq.labor?.items) eq.labor.items = this.deduplicarLaborItems(eq.labor.items);
            const result = window.autoMaoDeObra?.calcularMaoDeObraPorEquipamento(eq);
            if (result && result.items.length > 0) {
                const autoKeys = new Set(result.items.map(i => `${i.group}|${i.role}`));
                const manuais = (eq.labor?.items || []).filter(i =>
                    !autoKeys.has(`${i.group}|${i.role}`) &&
                    (i.hours > 0 || i.hourlyRate > 0)
                );
                eq.labor = { items: [...manuais, ...result.items] };
                eq._composicaoDetalhada = result.composicaoDetalhada;
                eq._showDetalheComposicao = false;
                total += result.totalHoras || 0;
                count++;
            }
        });

        store.setState({ activeTechnicalProposal: data });
        if (this.activeSubTab === 'labor') this.renderSubTab();

        app.toast(`Mão de obra estimada para ${count} equipamentos. Total: ${total.toFixed(1)}h`, count > 0 ? 'success' : 'info');
    },



    renderExpenses(eq) {

        const expenses = eq.expenses || JSON.parse(JSON.stringify(DEFAULT_EXPENSES));

        const total = expenses.reduce((sum, it) => sum + ((it.unit || 0) * (it.qtd || 0)), 0);



        return `

            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Despesas Logísticas e Extras: ${eq.tag}</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Custos adicionais relacionados a este equipamento (Frete, Diárias, etc.)</div>

                    </div>

                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addExpenseRow()">+ Adicionar Despesa</button>

                </div>



                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto; background: white;">

                    <table class="w-full" style="font-size: 12px; border-collapse: collapse;">

                        <thead>

                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff;">

                                <th style="padding: 14px; text-align: left; color:#fff;">Descrição da Despesa</th>

                                <th style="padding: 14px; text-align: center; width: 80px; color:#fff;">Qtd</th>

                                <th style="padding: 14px; text-align: right; width: 120px; color:#fff;">Unitário (R$)</th>

                                <th style="padding: 14px; text-align: right; width: 130px; color:#fff;">Subtotal</th>

                                <th style="padding: 14px; width: 60px; color:#fff;"></th>

                            </tr>

                        </thead>

                        <tbody id="expenses-body">

                            ${expenses.map((it, i) => `

                                <tr class="expense-row" style="border-bottom: 1px solid #f1f5f9;">

                                    <td style="padding: 10px;"><input type="text" name="exp_desc_${i}" class="form-control" value="${it.desc || ''}" style="font-weight: 600;"></td>

                                    <td style="padding: 10px;"><input type="number" name="exp_qtd_${i}" class="form-control" value="${it.qtd || 0}" style="text-align: center;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>

                                    <td style="padding: 10px;"><input type="text" name="exp_unit_${i}" class="form-control" value="${app.formatCurrency(it.unit || 0).replace('R$', '').trim()}" style="text-align: right;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>

                                    <td style="padding: 10px; text-align: right; font-weight: 700; color: #1e3a8a;">${app.formatCurrency((it.unit || 0) * (it.qtd || 0))}</td>

                                    <td style="padding: 10px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.updateExpenseTotals();"><i class="ph ph-trash"></i></button></td>

                                </tr>

                            `).join('')}

                        </tbody>

                        <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">

                            <tr>

                                <td colspan="3" style="padding: 14px; text-align: right; text-transform: uppercase; color: #64748b;">Custo Total de Despesas</td>

                                <td id="expense-total-cost" style="padding: 14px; text-align: right; color: #1e3a8a; font-size: 16px;">${app.formatCurrency(total)}</td>

                                <td></td>

                            </tr>

                        </tfoot>

                    </table>

                </div>

            </div>

        `;

    },



    renderMateriaisTab(eq) {
        const materiais = eq.materials || [];
        const total = materiais.reduce((sum, it) => sum + ((it.custo || 0) * (it.qtd || 0)), 0);

        return `
            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 960px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Lista de Materiais: ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Materiais do catálogo associados a este equipamento</div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addMaterialRow()">+ Adicionar Manual</button>
                        <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica.openAddEqMaterialModal()"><i class="ph ph-package"></i> Adicionar do Catálogo</button>
                    </div>

                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto; background: white;">

                    <table class="w-full" style="font-size: 12px; border-collapse: collapse;">

                        <thead>
                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff;">
                                <th style="padding: 10px; text-align: center; width: 60px;">Qtd</th>
                                <th style="padding: 10px; text-align: left;">Descrição</th>
                                <th style="padding: 10px; text-align: left; width: 120px;">Fabricante</th>
                                <th style="padding: 10px; text-align: left; width: 100px;">Modelo</th>
                                <th style="padding: 10px; text-align: left; width: 110px;">Cód. Fabricante</th>
                                <th style="padding: 10px; text-align: right; width: 100px;">Custo Unit. (R$)</th>
                                <th style="padding: 10px; text-align: right; width: 100px;">Subtotal (R$)</th>
                                <th style="padding: 10px; width: 50px;"></th>
                            </tr>
                        </thead>

                        <tbody id="materiais-body">

                            ${materiais.map((it, i) => `
                                <tr class="mat-row" style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 8px; text-align: center;">
                                        <input type="hidden" name="mat_materialId_${i}" value="${this._escapeHtml(it.materialId || '')}">
                                        <input type="number" name="mat_qtd_${i}" class="form-control" value="${it.qtd || 0}" min="0" step="1"
                                            style="width: 50px; padding: 4px; text-align: center;"
                                            oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_desc_${i}" class="form-control" value="${this._escapeHtml(it.descricao || '')}" style="font-weight: 600;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_fabricante_${i}" class="form-control" value="${this._escapeHtml(it.fabricante || '')}" style="font-size: 11px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_modelo_${i}" class="form-control" value="${this._escapeHtml(it.modelo || '')}" style="font-size: 11px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_codfab_${i}" class="form-control" value="${this._escapeHtml(it.codigoFabricante || '')}" style="font-family: monospace; font-size: 11px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_custo_${i}" class="form-control" value="${app.formatCurrency(it.custo || 0).replace('R$', '').trim()}"
                                            style="text-align: right;"
                                            oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                                    </td>
                                    <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e3a8a;" class="mat-subtotal-cell">
                                        ${app.formatCurrency((it.custo || 0) * (it.qtd || 0))}
                                    </td>
                                    <td style="padding: 8px; text-align: center;">
                                        <button type="button" class="btn-icon" style="color: #ef4444;"
                                            onclick="this.closest('tr').remove(); app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                                            <i class="ph ph-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}

                            ${materiais.length === 0 ? '<tr><td colspan="8" style="padding: 40px; text-align: center; color: #94a3b8;">Nenhum material associado. Clique em "Adicionar do Catálogo" para selecionar materiais ou "Adicionar Manual" para incluir manualmente.</td></tr>' : ''}

                        </tbody>

                        <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">
                            <tr>
                                <td colspan="6" style="padding: 14px; text-align: right; text-transform: uppercase; color: #64748b;">Custo Total de Materiais</td>
                                <td id="materiais-total-cost" style="padding: 14px; text-align: right; color: #1e3a8a; font-size: 16px;">${app.formatCurrency(total)}</td>
                                <td></td>
                            </tr>
                        </tfoot>

                    </table>

                </div>

            </div>
        `;
    },

    updateMaterialTotals() {
        const rows = document.querySelectorAll('.mat-row');
        let totalCost = 0;

        rows.forEach((row, i) => {
            const qtd = parseFloat(row.querySelector(`[name^="mat_qtd_"]`)?.value || 0);
            const unitStr = row.querySelector(`[name^="mat_custo_"]`)?.value || '0';
            const unit = parseFloat(unitStr.replace(/\./g, '').replace(',', '.'));
            const subtotal = qtd * unit;
            totalCost += subtotal;
            const subtotalCell = row.querySelector('.mat-subtotal-cell');
            if (subtotalCell) subtotalCell.textContent = app.formatCurrency(subtotal);
        });

        const totalCostEl = document.getElementById('materiais-total-cost');
        if (totalCostEl) totalCostEl.textContent = app.formatCurrency(totalCost);
    },

    addMaterialRow() {
        const body = document.getElementById('materiais-body');
        if (!body) return;
        const index = body.querySelectorAll('.mat-row').length;

        const row = document.createElement('tr');
        row.className = 'mat-row';
        row.style.borderBottom = '1px solid #f1f5f9';
        row.innerHTML = `
            <td style="padding: 8px; text-align: center;">
                <input type="hidden" name="mat_materialId_${index}" value="">
                <input type="number" name="mat_qtd_${index}" class="form-control" value="1" min="0" step="1"
                    style="width: 50px; padding: 4px; text-align: center;"
                    oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_desc_${index}" class="form-control" style="font-weight: 600;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_fabricante_${index}" class="form-control" style="font-size: 11px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_modelo_${index}" class="form-control" style="font-size: 11px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_codfab_${index}" class="form-control" style="font-family: monospace; font-size: 11px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_custo_${index}" class="form-control" value="0,00"
                    style="text-align: right;"
                    oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
            </td>
            <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e3a8a;" class="mat-subtotal-cell">R$ 0,00</td>
            <td style="padding: 8px; text-align: center;">
                <button type="button" class="btn-icon" style="color: #ef4444;"
                    onclick="this.closest('tr').remove(); app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        `;

        body.appendChild(row);
    },

    updateLaborTotals() {

        const rows = document.querySelectorAll('.labor-row');

        let totalHours = 0;

        let totalCost = 0;



        rows.forEach((row, i) => {

            const hours = parseFloat(row.querySelector(`[name^="labor_hours_"]`).value || 0);

            const rateStr = row.querySelector(`[name^="labor_rate_"]`).value || '0';

            const rate = parseFloat(rateStr.replace(/\./g, '').replace(',', '.'));

            

            const subtotal = hours * rate;

            totalHours += hours;

            totalCost += subtotal;



            const subtotalCell = row.cells[4];

            if (subtotalCell) subtotalCell.textContent = app.formatCurrency(subtotal);

        });



        const totalHoursEl = document.getElementById('labor-total-hours');

        const totalCostEl = document.getElementById('labor-total-cost');

        if (totalHoursEl) totalHoursEl.textContent = totalHours + 'h';

        if (totalCostEl) totalCostEl.textContent = app.formatCurrency(totalCost);

    },

    deduplicarLaborItems(items) {
        const map = new Map();
        (items || []).forEach(item => {
            const key = `${item.group || ''}|${item.role || ''}`;
            if (!key || key === '|') return;
            const existing = map.get(key);
            if (existing) {
                existing.hours = (existing.hours || 0) + (item.hours || 0);
                existing.hourlyRate = Math.max(existing.hourlyRate || 0, item.hourlyRate || 0);
                if (item.auto) existing.auto = true;
                if (item.composicaoDetalhe && item.composicaoDetalhe.length > 0) {
                    existing.composicaoDetalhe = item.composicaoDetalhe;
                }
            } else {
                map.set(key, { ...item });
            }
        });
        return Array.from(map.values());
    },



    updateExpenseTotals() {

        const rows = document.querySelectorAll('.expense-row');

        let totalCost = 0;



        rows.forEach((row, i) => {

            const qtd = parseFloat(row.querySelector(`[name^="exp_qtd_"]`).value || 0);

            const unitStr = row.querySelector(`[name^="exp_unit_"]`).value || '0';

            const unit = parseFloat(unitStr.replace(/\./g, '').replace(',', '.'));

            

            const subtotal = qtd * unit;

            totalCost += subtotal;



            const subtotalCell = row.cells[3];

            if (subtotalCell) subtotalCell.textContent = app.formatCurrency(subtotal);

        });



        const totalCostEl = document.getElementById('expense-total-cost');

        if (totalCostEl) totalCostEl.textContent = app.formatCurrency(totalCost);

    },



    addLaborRow(area) {

        if (!area) return;

        const body = document.getElementById('labor-body');

        if (!body) return;

        const rows = body.querySelectorAll('.labor-row');

        const newIndex = rows.length;

        const row = document.createElement('tr');

        row.className = 'labor-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `
            <input type="hidden" name="labor_auto_${newIndex}" value="">

            <td style="padding: 12px;">

                <input type="text" name="labor_group_${newIndex}" class="form-control" value="${area}" readonly style="font-size: 12px; background: #f8fafc; cursor: default;">

            </td>

            <td style="padding: 12px;"><input type="text" name="labor_role_${newIndex}" class="form-control" style="font-weight: 600;"></td>

            <td style="padding: 12px;"><input type="number" name="labor_hours_${newIndex}" class="form-control" value="0" style="text-align: center;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

            <td style="padding: 12px;"><input type="text" name="labor_rate_${newIndex}" class="form-control" value="0,00" style="text-align: right;" oninput="app.propostaTecnica.updateLaborTotals()" onblur="this.value=app.formatCurrencyRaw(app.parseCurrency(this.value))"></td>

            <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e3a8a;">R$ 0,00</td>

        `;

        let insertAfter = null;

        rows.forEach(r => {

            const g = r.querySelector('[name^="labor_group_"]');

            if (g && g.value === area) insertAfter = r;

        });

        if (insertAfter) {

            insertAfter.after(row);

        } else {

            body.appendChild(row);

        }

        this.updateLaborTotals();

    },



    addExpenseRow() {

        const body = document.getElementById('expenses-body');

        if (!body) return;

        const index = body.querySelectorAll('.expense-row').length;

        const row = document.createElement('tr');

        row.className = 'expense-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 10px;"><input type="text" name="exp_desc_${index}" class="form-control" style="font-weight: 600;"></td>

            <td style="padding: 10px;"><input type="number" name="exp_qtd_${index}" class="form-control" value="0" style="text-align: center;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>

            <td style="padding: 10px;"><input type="text" name="exp_unit_${index}" class="form-control" value="0,00" style="text-align: right;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>



            <td style="padding: 10px; text-align: right; font-weight: 700; color: #1e3a8a;">R$ 0,00</td>

            <td style="padding: 10px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.updateExpenseTotals();"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },

    addCustomNorm(eqId) {
        const existing = document.getElementById('modal-custom-norm');
        if (existing) existing.remove();
        const html = `
            <div id="modal-custom-norm" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 480px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">Inserir Norma Técnica</h3>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Nome da Norma</label>
                        <input type="text" id="custom-norm-label" class="form-control" placeholder="Ex: ABNT NBR IEC 60529">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label">Descrição da Norma</label>
                        <input type="text" id="custom-norm-desc" class="form-control" placeholder="Ex: Classificação do grau de proteção (IP)">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-custom-norm').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmCustomNorm(${eqId})">Adicionar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(() => document.getElementById('custom-norm-label')?.focus(), 100);
    },

    confirmCustomNorm(eqId) {
        const label = document.getElementById('custom-norm-label')?.value?.trim();
        const desc = document.getElementById('custom-norm-desc')?.value?.trim() || 'Norma personalizada';
        if (!label) { alert('Informe o nome da norma.'); return; }
        document.getElementById('modal-custom-norm')?.remove();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments.find(e => e.id === eqId);
        if (!eq) return;
        if (!eq.customNorms) eq.customNorms = [];
        const id = 'custom_norm_' + Date.now();
        eq.customNorms.push({ id, label, description: desc });
        if (!eq.norms) eq.norms = [];
        if (!eq.norms.includes(id)) eq.norms.push(id);
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'norms';
        this.renderModal(data);
    },

    removeCustomNorm(eqId, index) {
        const data = store.getState().activeTechnicalProposal;
        const eqIndex = data.equipments.findIndex(e => e.id === eqId);
        if (eqIndex === -1) return;
        const eq = data.equipments[eqIndex];
        if (!eq.customNorms) return;
        const removed = eq.customNorms.splice(index, 1)[0];
        if (removed && eq.norms) {
            eq.norms = eq.norms.filter(id => id !== removed.id);
        }
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'norms';
        this.activeEquipmentIndex = eqIndex;
        this.renderModal(data);
    },

    addCustomCharacteristic(eqId) {
        const existing = document.getElementById('modal-custom-characteristic');
        if (existing) existing.remove();
        const html = `
            <div id="modal-custom-characteristic" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 480px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">Inserir Característica</h3>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Nome da Característica</label>
                        <input type="text" id="custom-char-name" class="form-control" placeholder="Ex: Tensão de Isolamento">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label">Valor</label>
                        <input type="text" id="custom-char-value" class="form-control" placeholder="Ex: 1000V">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-custom-characteristic').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmCustomCharacteristic(${eqId})">Adicionar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(() => document.getElementById('custom-char-name')?.focus(), 100);
    },

    confirmCustomCharacteristic(eqId) {
        const name = document.getElementById('custom-char-name')?.value?.trim();
        const value = document.getElementById('custom-char-value')?.value?.trim();
        if (!name || !value) { alert('Preencha o nome e o valor da característica.'); return; }
        document.getElementById('modal-custom-characteristic')?.remove();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments.find(e => e.id === eqId);
        if (!eq) return;
        if (!eq.customCharacteristics) eq.customCharacteristics = [];
        const id = 'custom_char_' + Date.now();
        eq.customCharacteristics.push({ id, name, value });
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'technical';
        this.renderModal(data);
    },

    removeCustomCharacteristic(eqId, index) {
        const data = store.getState().activeTechnicalProposal;
        const eqIndex = data.equipments.findIndex(e => e.id === eqId);
        if (eqIndex === -1) return;
        const eq = data.equipments[eqIndex];
        if (!eq.customCharacteristics) return;
        eq.customCharacteristics.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'technical';
        this.activeEquipmentIndex = eqIndex;
        this.renderModal(data);
    },



    renderTabVendorList(data) {

        const _norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

        const compKeys = Object.keys(VENDOR_MAP);

        const _findCategory = comp => {
            const n = _norm(comp);
            const exact = compKeys.find(k => _norm(k) === n);
            if (exact) return exact;
            const words = comp.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
            for (const key of compKeys) {
                const keyWords = key.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
                for (const w of words)
                    for (const kw of keyWords)
                        if (w.includes(kw) || kw.includes(w)) return key;
            }
            return null;
        };

        const savedMap = {};
        const unmatched = [];
        if (data.vendorList && data.vendorList.length > 0) {
            data.vendorList.forEach(v => {
                if (!v.comp) return;
                const cat = _findCategory(v.comp);
                if (cat) savedMap[cat] = v;
                else unmatched.push(v);
            });
        }
        const vendors = compKeys.map(comp => {
            const saved = savedMap[comp];
            return saved ? { ...saved, comp } : {
                comp,
                brand: VENDOR_MAP[comp][0] || '',
                opt: '__PADRAO__',
                optEspecifique: ''
            };
        });
        unmatched.forEach(v => {
            vendors.push({ comp: v.comp, brand: v.brand || '', opt: v.opt || '__PADRAO__', optEspecifique: v.optEspecifique || '' });
        });
        console.log('[VendorList] data.vendorList:', data.vendorList);
        vendors.forEach(v => {
            const brands = VENDOR_MAP[v.comp];
            if (brands && v.brand && !brands.includes(v.brand)) {
                console.warn(`[VendorList] Brand "${v.brand}" n\u00e3o est\u00e1 em VENDOR_MAP["${v.comp}"]. Setando OUTRO.`);
                v.opt = '__OUTRO__';
                v.optEspecifique = v.brand;
            }
        });
        console.log('[VendorList] vendors final:', vendors.map(v => ({ comp: v.comp, brand: v.brand, opt: v.opt, optEspecifique: v.optEspecifique })));

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Vendor List / Lista de Fabricantes${data._aiChanges?.vendorList ? '<span class="ai-label">IA</span>' : ''}</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Definição de marcas homologadas para os componentes principais</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addVendorRow()">
                        <i class="ph ph-plus-circle"></i> Inserir Linha
                    </button>
                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto;" onchange="window.propostaTecnicaModule._clearAiVendorList()">

                    <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                        <thead>
                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #ffffff; font-size: 13px;">Componente / Material</th>
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #ffffff; font-size: 13px;">Fabricante Sugerido (Padrão)</th>
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #ffffff; font-size: 13px;">Alternativas Aceitáveis</th>
                                <th style="padding: 14px; width: 50px; color: #ffffff; font-size: 13px;">Ações</th>
                            </tr>
                        </thead>

                        <tbody id="vendor-body">
                            ${vendors.map((v, i) => {
                                const brands = VENDOR_MAP[v.comp] || [];
                                const isCustom = !brands.length;
                                const isOutro = v.opt === '__OUTRO__';
                                const isSimilar = v.opt === '__SIMILAR__';
                                const isPadrao = v.opt === '__PADRAO__';
                                const showEspecifique = isOutro;
                                return `
                                <tr class="vendor-row" style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px; font-weight: 600; color: #1e3a8a; font-size: 10px;">
                                        ${isCustom ? `
                                            <input type="text" name="ven_comp_${i}" class="form-control" style="font-size: 10px; font-weight: 600; color: #1e3a8a; width: 100%;" value="${v.comp}">
                                        ` : `
                                            ${v.comp}
                                        `}
                                    </td>
                                    <td style="padding: 12px;">
                                        ${brands.length > 0 ? `
                                            <select name="ven_brand_${i}" class="form-control" style="font-size: 10px; font-weight: 400;">
                                                ${brands.map(b => `<option value="${b}" ${b === v.brand ? 'selected' : ''}>${b}</option>`).join('')}
                                            </select>
                                        ` : `
                                            <input type="text" name="ven_brand_${i}" class="form-control" style="font-size: 10px; font-weight: 400;" value="${v.brand || ''}" placeholder="Fabricante">
                                        `}
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                                            <select name="ven_opt_${i}" class="form-control vendor-opt-select" style="flex: 1; font-size: 10px; font-weight: 400;" onchange="this.closest('tr').querySelector('.ven-especifique').style.display=this.value==='__OUTRO__'?'inline-block':'none'">
                                                <option value="__PADRAO__" ${isPadrao ? 'selected' : ''}>Padrão</option>
                                                <option value="__OUTRO__" ${isOutro ? 'selected' : ''}>Outro</option>
                                                <option value="__SIMILAR__" ${isSimilar ? 'selected' : ''}>Similar</option>
                                            </select>
                                            <input type="text" name="ven_opt_especifique_${i}" class="form-control ven-especifique" placeholder="Especifique..." style="display: ${showEspecifique ? 'inline-block' : 'none'}; width: 160px;" value="${v.optEspecifique || ''}">
                                        </div>
                                    </td>
                                    <td style="padding: 12px; text-align: center;">
                                        <button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 16px;"><i class="ph ph-trash"></i></button>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>

                    </table>

                </div>

            </div>

        `;

    },

    addVendorRow() {
        const body = document.getElementById('vendor-body');
        if (!body) return;
        const index = body.querySelectorAll('.vendor-row').length;
        const row = document.createElement('tr');
        row.className = 'vendor-row';
        row.style.borderBottom = '1px solid #f1f5f9';
        row.innerHTML = `
            <td style="padding: 12px; font-weight: 600; color: #1e3a8a; font-size: 10px;">
                <input type="text" name="ven_comp_${index}" class="form-control" style="font-size: 10px; font-weight: 600; color: #1e3a8a; width: 100%;" placeholder="Nome do componente">
            </td>
            <td style="padding: 12px;">
                <input type="text" name="ven_brand_${index}" class="form-control" style="font-size: 10px; font-weight: 400;" placeholder="Fabricante">
            </td>
            <td style="padding: 12px;">
                <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                    <select name="ven_opt_${index}" class="form-control vendor-opt-select" style="flex: 1; font-size: 10px; font-weight: 400;" onchange="this.closest('tr').querySelector('.ven-especifique').style.display=this.value==='__OUTRO__'?'inline-block':'none'">
                        <option value="__PADRAO__" selected>Padrão</option>
                        <option value="__OUTRO__">Outro</option>
                        <option value="__SIMILAR__">Similar</option>
                    </select>
                    <input type="text" name="ven_opt_especifique_${index}" class="form-control ven-especifique" placeholder="Especifique..." style="display: none; width: 160px;">
                </div>
            </td>
            <td style="padding: 12px; text-align: center;">
                <button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 16px;"><i class="ph ph-trash"></i></button>
            </td>
        `;
        body.appendChild(row);
    },

    async _saveVendorDefaults(vendors) {
        const customItems = vendors.filter(v => !VENDOR_MAP[v.comp]);
        if (customItems.length === 0) return;
        const state = store.getState();
        const existingDefaults = (() => {
            try { return JSON.parse(state.company?.vendorDefaults || '[]'); } catch (e) { return []; }
        })();
        const merged = [...existingDefaults];
        customItems.forEach(cv => {
            if (!merged.find(m => m.comp === cv.comp)) {
                merged.push({ comp: cv.comp, brand: cv.brand, opt: cv.opt, optEspecifique: cv.optEspecifique });
            }
        });
        try {
            await fetch('/api/settings/vendor-defaults', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorDefaults: merged })
            });
            const company = { ...state.company, vendorDefaults: JSON.stringify(merged) };
            store.setState({ company });
        } catch (e) {
            console.error('[VendorList] Erro ao salvar defaults:', e);
        }
    },

    renderTabRevisoes(data) {

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Controle de Revisões</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Histórico de versões da proposta técnica</div>
                    </div>

                    <button type="button" class="btn btn-sm btn-primary btn-add-revision" onclick="app.propostaTecnica.addRevisionRow()">+ Nova Revisão</button>

                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto;">

                <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                    <thead>

                        <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0;">

                            <th style="padding: 14px; width: 70px; color: #ffffff; font-size: 13px;">Nú</th>

                            <th style="padding: 14px; color: #ffffff; font-size: 13px;">Descrição</th>

                            <th style="padding: 14px; width: 70px; text-align: center; color: #ffffff; font-size: 13px;">Elab.</th>

                            <th style="padding: 14px; width: 70px; text-align: center; color: #ffffff; font-size: 13px;">Verif.</th>

                            <th style="padding: 14px; width: 70px; text-align: center; color: #ffffff; font-size: 13px;">Aprov.</th>

                            <th style="padding: 14px; width: 120px; text-align: center; color: #ffffff; font-size: 13px;">Data</th>

                            <th style="padding: 14px; width: 50px;"></th>

                        </tr>

                    </thead>

                    <tbody id="revisions-body">

                        ${(data.revisions || []).map((rev, index) => `

                            <tr class="revision-row" style="border-bottom: 1px solid #f1f5f9;">

                                <td style="padding: 12px;"><input type="text" name="rev_no_${index}" class="form-control" value="${rev.no || ''}" style="text-align: center; padding: 10px 4px;"></td>

                                <td style="padding: 12px;"><input type="text" name="rev_desc_${index}" class="form-control" value="${rev.desc || ''}"></td>

                                <td style="padding: 12px;"><select name="rev_elab_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions(rev.elab, true)}</select></td>

                                <td style="padding: 12px;"><select name="rev_verif_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions(rev.verif, true)}</select></td>

                                <td style="padding: 12px;"><select name="rev_aprov_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions(rev.aprov, true)}</select></td>

                                <td style="padding: 12px;"><input type="date" name="rev_data_${index}" class="form-control" value="${(() => {

                                    if(!rev.data) return '';

                                    if(rev.data.includes('/')) {

                                        const [d,m,y] = rev.data.split('/');

                                        return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;

                                    }

                                    return rev.data;

                                })()}" style="text-align: center; padding: 10px 8px;"></td>

                                <td style="padding: 12px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

                            </tr>

                        `).join('')}

                    </tbody>

                </table>
                </div>

            </div>

        `;

    },

    renderTabAssinaturas(data) {
        const sig = (n, label, defNome, defCargo, defTel, defCel, defEmail) => `
            <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:12px;border:1px solid var(--color-border);">
                <label style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                    <input type="checkbox" name="sig${n}_active" ${data['sig'+n+'_active'] !== false ? 'checked' : ''} style="width:16px;height:16px;">
                    <span style="font-size:11px;font-weight:600;">${label}</span>
                </label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <input type="text" name="sig${n}_nome" class="form-control" placeholder="Nome" value="${data['sig'+n+'_nome']||defNome}">
                    <input type="text" name="sig${n}_cargo" class="form-control" placeholder="Cargo" value="${data['sig'+n+'_cargo']||defCargo}">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:8px;">
                    <input type="text" name="sig${n}_tel" class="form-control" placeholder="Tel" value="${data['sig'+n+'_tel']||defTel}">
                    <input type="text" name="sig${n}_cel" class="form-control" placeholder="Cel" value="${data['sig'+n+'_cel']||defCel}">
                    <input type="text" name="sig${n}_email" class="form-control" placeholder="Email" value="${data['sig'+n+'_email']||defEmail}">
                </div>
            </div>`;
        return `<div style="padding:30px;max-width:900px;">
            ${sig(1,'Assinatura 1 (Consultor)','José Cirqueira','Consultor de Vendas','(16) 3945-2145','(16) 9 9793-2877','jose.cirqueira@minhaempresa.com.br')}
            ${sig(2,'Assinatura 2 (Gerente)','Leandro Pereira','Gerente Comercial','(16) 3945-2145','(16) 9 9713-3674','leandro.pereira@minhaempresa.com.br')}
            ${sig(3,'Assinatura 3 (Diretor)','Márcio Vaz','Diretor de Negócios','(16) 3945-2145','(16) 99730-6540','marcio.vaz@minhaempresa.com.br')}
        </div>`;
    },

    addScopeRow() {

        const body = document.getElementById('scope-body');

        if (!body) return;

        const index = body.querySelectorAll('.scope-row').length;

        const row = document.createElement('tr');

        row.className = 'scope-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 8px;"><input type="text" name="scope_desc_${index}" class="form-control"></td>

            <td style="padding: 8px; text-align: center;"><input type="checkbox" name="scope_empresa_${index}"></td>

            <td style="padding: 8px; text-align: center;"><input type="checkbox" name="scope_cli_${index}"></td>

            <td style="padding: 8px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },



    addRevisionRow() {

        const body = document.getElementById('revisions-body');

        if (!body) return;

        const index = body.querySelectorAll('.revision-row').length;

        const row = document.createElement('tr');

        row.className = 'revision-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 8px;"><input type="text" name="rev_no_${index}" class="form-control" value="${String(index).padStart(2, '0')}" style="text-align: center; padding: 10px 4px;"></td>

            <td style="padding: 8px;"><input type="text" name="rev_desc_${index}" class="form-control"></td>

            <td style="padding: 8px;"><select name="rev_elab_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>

            <td style="padding: 8px;"><select name="rev_verif_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>

            <td style="padding: 8px;"><select name="rev_aprov_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>

            <td style="padding: 8px;"><input type="date" name="rev_data_${index}" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="text-align: center; padding: 10px 8px;"></td>

            <td style="padding: 8px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },



    onVendorOptChange(index) {

        const row = document.querySelector(`.vendor-row [name="ven_opt_${index}"]`);
        if (!row) return;
        const tr = row.closest('tr');
        if (!tr) return;
        const espec = tr.querySelector(`[name="ven_opt_especifique_${index}"]`);
        if (espec) {
            espec.style.display = row.value === '__OUTRO__' ? 'inline-block' : 'none';
        }
    },

    addTextItemRow() {

        const list = document.getElementById('text-items-list');

        if (!list) return;

        const index = list.querySelectorAll('.text-item-row').length;

        const row = document.createElement('div');

        row.className = 'text-item-row';

        row.style.display = 'flex';

        row.style.gap = '12px';

        row.style.alignItems = 'center';

        row.innerHTML = `

            <div style="width: 30px; height: 30px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #64748b; flex-shrink: 0;">${index + 1}</div>

            <input type="text" name="text_item_${index}" class="form-control" style="flex: 1;">

            <button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('.text-item-row').remove()"><i class="ph ph-trash"></i></button>

        `;

        list.appendChild(row);

    },

    renderDeviations(eq) {
        const items = eq.deviations || [];
        const canEdit = store.canEdit();

        return `
            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Desvios / Comentários Técnicos: ${eq.tag || ''}</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Divergências entre a solicitação do cliente e a proposta ofertada</div>

                    </div>

                    ${canEdit ? `<button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule.addDeviationItem()">+ Adicionar Item</button>` : ''}

                </div>

                ${items.length === 0 ? `
                    <div style="padding: 40px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                        Clique em "+ Adicionar Item" para listar um desvio.
                    </div>
                ` : `
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;width:30px;">#</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">DOCUMENTO</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">SOLICITADO</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">DESVIO</th>
                                    ${canEdit ? `<th style="padding:10px 12px;text-align:center;font-weight:700;color:#475569;width:90px;">Ações</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((it, i) => {
                                    const editing = it._editing === true;
                                    const doc = (typeof it === 'string') ? '' : (it.documento || '');
                                    const sol = (typeof it === 'string') ? '' : (it.solicitado || '');
                                    const dev = (typeof it === 'string') ? it : (it.desvio || '');
                                    return `
                                        <tr style="border-bottom:1px solid #f1f5f9;" data-deviation-index="${i}">
                                            <td style="padding:8px 12px;color:#94a3b8;font-weight:600;">${i + 1}</td>
                                            <td style="padding:6px 8px;">
                                                <span class="dev-view-${i}" style="${editing ? 'display:none;' : ''}">${this._escapeHtml(doc) || '—'}</span>
                                                <input type="text" name="dev_documento_${i}" class="form-control" value="${this._escapeHtml(doc)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="DOC-...">
                                            </td>
                                            <td style="padding:6px 8px;">
                                                <span class="dev-view-${i}" style="${editing ? 'display:none;' : ''}">${this._escapeHtml(sol) || '—'}</span>
                                                <input type="text" name="dev_solicitado_${i}" class="form-control" value="${this._escapeHtml(sol)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="Cliente solicitou...">
                                            </td>
                                            <td style="padding:6px 8px;">
                                                <span class="dev-view-${i}" style="${editing ? 'display:none;' : ''}">${this._escapeHtml(dev) || '—'}</span>
                                                <input type="text" name="dev_desvio_${i}" class="form-control" value="${this._escapeHtml(dev)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="Descreva o desvio...">
                                            </td>
                                            ${canEdit ? `
                                                <td style="padding:6px 8px;text-align:center;white-space:nowrap;">
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.toggleDeviationEdit(${i})" title="${editing ? 'Confirmar' : 'Editar'}" style="color:var(--color-accent);background:#e8eddc;border:1px solid #d4e0c0;width:28px;height:28px;border-radius:4px;">
                                                        <i class="ph ${editing ? 'ph-check' : 'ph-pencil-simple'}"></i>
                                                    </button>
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.removeDeviationItem(${i})" title="Excluir" style="color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;width:28px;height:28px;border-radius:4px;margin-left:4px;">
                                                        <i class="ph ph-trash"></i>
                                                    </button>
                                                </td>
                                            ` : ''}
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}

            </div>
        `;
    },

    addDeviationItem() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq.deviations) eq.deviations = [];
        this._normalizeDeviations(eq);
        eq.deviations.push({ id: crypto.randomUUID(), documento: '', solicitado: '', desvio: '', _editing: true });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeDeviationItem(index) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        this._normalizeDeviations(eq);
        eq.deviations.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    toggleDeviationEdit(index) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        this._normalizeDeviations(eq);
        const it = eq.deviations[index];
        if (!it) return;

        if (it._editing) {
            const docInput = document.querySelector(`[name="dev_documento_${index}"]`);
            const solInput = document.querySelector(`[name="dev_solicitado_${index}"]`);
            const desInput = document.querySelector(`[name="dev_desvio_${index}"]`);
            if (docInput) it.documento = docInput.value;
            if (solInput) it.solicitado = solInput.value;
            if (desInput) it.desvio = desInput.value;
            it._editing = false;
        } else {
            it._editing = true;
        }

        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    _normalizeDeviations(eq) {
        if (!eq.deviations) { eq.deviations = []; return; }
        eq.deviations = eq.deviations.map(it => {
            if (typeof it === 'string') return { id: crypto.randomUUID(), documento: '', solicitado: '', desvio: it, _editing: false };
            if (!it.id) it.id = crypto.randomUUID();
            return it;
        });
    },

    renderProposalExclusions(data) {
        this._migrateExclusionsFromEquipment(data);
        const items = data.exclusions || [];
        const canEdit = store.canEdit();

        return `
            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Exclusões Técnicas da Proposta</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Itens e serviços não contemplados para esta proposta</div>

                    </div>

                    ${canEdit ? `<button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule.addExclusionItem()">+ Adicionar Item</button>` : ''}

                </div>

                ${items.length === 0 ? `
                    <div style="padding: 40px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                        Clique em "+ Adicionar Item" para listar uma exclusão.
                    </div>
                ` : `
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;width:30px;">#</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">EXCLUSÃO</th>
                                    ${canEdit ? `<th style="padding:10px 12px;text-align:center;font-weight:700;color:#475569;width:90px;">Ações</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((it, i) => {
                                    const editing = it._editing === true;
                                    const texto = (typeof it === 'string') ? it : (it.texto || '');
                                    return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:8px 12px;color:#94a3b8;font-weight:600;">${i + 1}</td>
                                            <td style="padding:6px 8px;">
                                                <span style="${editing ? 'display:none;' : ''}">${this._escapeHtml(texto) || '—'}</span>
                                                <input type="text" name="exc_texto_${i}" class="form-control" value="${this._escapeHtml(texto)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="Descreva a exclusão...">
                                            </td>
                                            ${canEdit ? `
                                                <td style="padding:6px 8px;text-align:center;white-space:nowrap;">
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.toggleExclusionEdit(${i})" title="${editing ? 'Confirmar' : 'Editar'}" style="color:var(--color-accent);background:#e8eddc;border:1px solid #d4e0c0;width:28px;height:28px;border-radius:4px;">
                                                        <i class="ph ${editing ? 'ph-check' : 'ph-pencil-simple'}"></i>
                                                    </button>
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.removeExclusionItem(${i})" title="Excluir" style="color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;width:28px;height:28px;border-radius:4px;margin-left:4px;">
                                                        <i class="ph ph-trash"></i>
                                                    </button>
                                                </td>
                                            ` : ''}
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}

            </div>
        `;
    },

    addExclusionItem() {
        this._captureExclusionsEdits();
        const data = store.getState().activeTechnicalProposal;
        if (!data.exclusions) data.exclusions = [];
        this._normalizeProposalExclusions(data);
        data.exclusions.push({ id: crypto.randomUUID(), texto: '', _editing: true });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeExclusionItem(index) {
        this._captureExclusionsEdits();
        const data = store.getState().activeTechnicalProposal;
        this._normalizeProposalExclusions(data);
        data.exclusions.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    toggleExclusionEdit(index) {
        const data = store.getState().activeTechnicalProposal;
        this._normalizeProposalExclusions(data);
        const it = data.exclusions[index];
        if (!it) return;

        if (it._editing) {
            const input = document.querySelector(`[name="exc_texto_${index}"]`);
            if (input) it.texto = input.value;
            it._editing = false;
        } else {
            it._editing = true;
        }

        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    _captureExclusionsEdits() {
        const data = store.getState().activeTechnicalProposal;
        this._normalizeProposalExclusions(data);
        (data.exclusions || []).forEach((it, i) => {
            if (it._editing) {
                const el = document.querySelector(`[name="exc_texto_${i}"]`);
                if (el) it.texto = el.value;
                it._editing = false;
            }
        });
        data.exclusions = (data.exclusions || []).map(({ _editing, ...rest }) => ({ id: rest.id || crypto.randomUUID(), ...rest }));
        store.setState({ activeTechnicalProposal: data });
    },

    _normalizeProposalExclusions(data) {
        if (!data.exclusions) { data.exclusions = []; return; }
        data.exclusions = data.exclusions.map(it => {
            if (typeof it === 'string') return { id: crypto.randomUUID(), texto: it, _editing: false };
            if (!it.id) it.id = crypto.randomUUID();
            return it;
        });
    },

    _migrateExclusionsFromEquipment(data) {
        if (data.exclusions && data.exclusions.length > 0) return;
        const eq = (data.equipments || [])[0];
        if (eq && eq.exclusions && eq.exclusions.length > 0) {
            data.exclusions = eq.exclusions.map(it =>
                typeof it === 'string' ? { id: crypto.randomUUID(), texto: it } : { id: it.id || crypto.randomUUID(), texto: it.texto || it.desvio || '' }
            );
        }
        (data.equipments || []).forEach(e => { if (e.exclusions) delete e.exclusions; });
    },


};
