// equipments.js (bloco 3/7) — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { store } from '../state.js';
import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from '../busbarCalculator.js';
import { deriveMaterials } from '../automacaoMateriais.js';
import { EMPRESA } from '../empresaConfig.js';
import { infraSubtotal, infraPrecoFinal } from '../infraPricing.js';
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './shared.js';

const app = window.app;
export const equipments = {
    renderTabEquipments(data, activeEq) {
        if (!activeEq) {
            return `<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;">
                <i class="ph ph-cpu" style="font-size:40px;display:block;margin-bottom:12px;"></i>
                <div style="font-size:16px;font-weight:600;color:#475569;margin-bottom:8px;">Nenhum equipamento cadastrado</div>
                <div style="margin-bottom:16px;color:#64748b;">Adicione um equipamento para come\u00e7ar a especifica\u00e7\u00e3o t\u00e9cnica.</div>
                <button type="button" class="btn btn-primary" onclick="app.propostaTecnica.addEquipment()" style="display:inline-flex;align-items:center;gap:6px;">
                    <i class="ph ph-plus"></i> Adicionar Equipamento
                </button>
            </div>`;
        }
        const eq = activeEq;
        const isMT = eq && eq.type === 'CUB-MT';
        const isTrMt = eq && eq.type === 'TR-MT';

        // Determine available sub-tabs based on equipment type
        const allSubTabs = ['technical', 'norms', 'loads', 'busbars', 'deviations', 'labor', 'expenses', 'calc_eletrico', 'calc_mecanico', 'layout'];
        const trMtSubTabs = ['technical', 'materiais', 'norms', 'deviations', 'expenses'];
        const eletrocentroSubTabs = ['technical', 'eletrocentro', 'materiais', 'norms', 'deviations', 'labor', 'expenses', 'calc_mecanico'];
        const seuSubTabs = ['technical', 'deviations', 'expenses'];
        const automationSubTabs = ['technical', 'norms', 'io_list', 'bom', 'deviations', 'labor', 'expenses', 'layout'];
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        const subTabs = isTrMt ? trMtSubTabs : (eq.type === 'SEU' ? seuSubTabs : (eq.type === 'ELETROCENTRO' ? eletrocentroSubTabs : (isAutomation ? automationSubTabs : allSubTabs)));

        if (!subTabs.includes(this.activeSubTab)) {
            this.activeSubTab = subTabs[0];
        }
        const subTab = this.activeSubTab;

        function getBadge(type) {
            const map = {
                'TR-MT':        { bg: '#fef3c7', color: '#92400e', label: 'TR-MT' },
                'SEU':          { bg: '#fefce8', color: '#78350f', label: 'SEU' },
                'CCM-BT':       { bg: '#dcfce7', color: '#166534', label: 'CCM-BT' },
                'QGBT':         { bg: '#dcfce7', color: '#166534', label: 'QGBT' },
                'CUB-MT':       { bg: '#fef3c7', color: '#92400e', label: 'CUB-MT' },
                'ELETROCENTRO': { bg: '#e0f2fe', color: '#075985', label: 'ELETROCENTRO' },
                'QTA':          { bg: '#dcfce7', color: '#166534', label: 'QTA' },
                'PLC':          { bg: '#ede9fe', color: '#5b21b6', label: 'PLC' },
                'BC':           { bg: '#fce7f3', color: '#9d174d', label: 'BC' },
                'REM':          { bg: '#ede9fe', color: '#5b21b6', label: 'REM' },
                'PNC':          { bg: '#dcfce7', color: '#166534', label: 'PNC' },
                'QDL':          { bg: '#dcfce7', color: '#166534', label: 'QDL' },
                'QDF':          { bg: '#dcfce7', color: '#166534', label: 'QDF' }
            };
            const m = map[type] || { bg: '#f1f5f9', color: '#64748b', label: type };
            return `<span style="background:${m.bg};color:${m.color};padding:4px 10px;border-radius:20px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap;">${m.label}</span>`;
        }

        // Sidebar HTML — hierarchical: SEUs as containers with children, then standalone items
        if (!this._seuExpanded) this._seuExpanded = new Set();
        const seuComponentIds = new Set();
        const seus = data.equipments.filter(e => e.type === 'SEU');
        seus.forEach(seu => {
            (seu.seu_components || []).forEach(id => seuComponentIds.add(String(id)));
        });

        let sidebarItemsHtml = '';
        // Render SEUs with their children
        seus.forEach((seu, si) => {
            const seuIdx = data.equipments.indexOf(seu);
            const seuActive = seuIdx === this.activeEquipmentIndex;
            const expanded = this._seuExpanded.has(seu.id);
            const comps = (seu.seu_components || [])
                .map(id => ({ id, eq: data.equipments.find(e => String(e.id) === String(id)) }))
                .filter(c => c.eq);
            const anyCompActive = comps.some(c => data.equipments.indexOf(c.eq) === this.activeEquipmentIndex);

            sidebarItemsHtml += `
                <div style="border-bottom: 1px solid ${anyCompActive ? '#f1f5f9' : 'transparent'};">
                    <div class="eq-item ${seuActive ? 'active' : ''}"
                         draggable="true"
                         ondragstart="event.dataTransfer.setData('text/plain',${seuIdx}); event.target.closest('.eq-item').classList.add('dragging')"
                         ondragend="event.target.closest('.eq-item').classList.remove('dragging')"
                         ondragover="event.preventDefault(); this.classList.add('drag-over')"
                         ondragleave="this.classList.remove('drag-over')"
                         ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveEquipment(parseInt(event.dataTransfer.getData('text/plain')),${seuIdx})"
                         onclick="window.propostaTecnicaModule.switchEquipment(${seuIdx})"
                         style="padding: 10px 12px; cursor: grab; display: flex; align-items: center; gap: 6px;
                                 font-weight: ${seuActive ? '700' : '500'};
                                 color: ${seuActive ? 'white' : '#475569'};
                                 border-left: 4px solid ${seuActive ? 'rgb(56, 86, 14)' : 'transparent'};
                                 background: ${seuActive ? 'var(--color-accent)' : 'transparent'};
                                transition: all 0.2s;">
                        <i class="ph ph-list" style="font-size: 14px; opacity: 0.3; cursor: grab; flex-shrink: 0;" title="Arrastar para reordenar"></i>
                        <span onclick="event.stopPropagation(); window.propostaTecnicaModule.toggleSeuExpand(${seu.id})"
                              style="cursor:pointer;font-size:10px;width:14px;text-align:center;flex-shrink:0;user-select:none;color:#94a3b8;">
                            ${expanded ? '▼' : '▶'}
                        </span>
                        <i class="ph ph-lightning-slash" style="font-size: 18px; opacity: ${seuActive ? '1' : '0.4'}; flex-shrink: 0; color: #92400e;"></i>
                        <div style="flex: 1; min-width: 0;">
                            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; font-weight: ${seuActive ? '700' : '600'};">
                                ${seu.tag || 'Sem TAG'}
                            </div>
                            <div style="margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                                ${getBadge(seu.type)}
                                ${seu.ufOrigem ? `<span style="background: #e0f2fe; color: #075985; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 9px;">${seu.ufOrigem}</span>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; gap: 2px; flex-shrink: 0;">
                            <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.renameEquipment(${seuIdx})"
                                    style="border: none; background: transparent; color: #64748b; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                    title="Editar TAG">
                                <i class="ph ph-pencil-simple" style="font-size: 14px;"></i>
                            </button>
                            <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.removeEquipment(${seuIdx})"
                                    style="border: none; background: transparent; color: #ef4444; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                    title="Excluir SEU">
                                <i class="ph ph-trash" style="font-size: 14px;"></i>
                            </button>
                        </div>
                    </div>
                    ${expanded ? comps.map(c => {
                        const compIdx = data.equipments.indexOf(c.eq);
                        const compActive = compIdx === this.activeEquipmentIndex;
                        return `
                            <div class="eq-item ${compActive ? 'active' : ''}"
                                 draggable="true"
                                 ondragstart="event.dataTransfer.setData('text/plain',${compIdx}); event.target.closest('.eq-item').classList.add('dragging')"
                                 ondragend="event.target.closest('.eq-item').classList.remove('dragging')"
                                 ondragover="event.preventDefault(); this.classList.add('drag-over')"
                                 ondragleave="this.classList.remove('drag-over')"
                                 ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveEquipment(parseInt(event.dataTransfer.getData('text/plain')),${compIdx})"
                                 onclick="window.propostaTecnicaModule.switchEquipment(${compIdx})"
                                 style="padding: 8px 12px 8px 36px; cursor: grab; display: flex; align-items: center; gap: 6px;
                                         font-weight: ${compActive ? '700' : '400'};
                                         color: ${compActive ? 'white' : '#64748b'};
                                         border-left: 4px solid ${compActive ? 'rgb(56, 86, 14)' : 'transparent'};
                                         background: ${compActive ? 'var(--color-accent)' : 'transparent'};
                                        font-size: 12px; transition: all 0.2s;">
                                <i class="ph ph-list" style="font-size: 12px; opacity: 0.25; cursor: grab; flex-shrink: 0;" title="Arrastar para reordenar"></i>
                                <i class="ph ph-dot" style="font-size: 14px; flex-shrink: 0; color: #94a3b8;"></i>
                                <div style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${c.eq.tag || 'Sem TAG'}
                                </div>
                                <span style="flex-shrink: 0; display: flex; align-items: center; gap: 4px;">
                                    ${c.eq.ufOrigem ? `<span style="background: #e0f2fe; color: #075985; padding: 1px 4px; border-radius: 3px; font-weight: 700; font-size: 8px;">${c.eq.ufOrigem}</span>` : ''}
                                    ${getBadge(c.eq.type)}
                                </span>
                            </div>
                        `;
                    }).join('') : ''}
                </div>
            `;
        });

        // Render standalone items (non-SEU, non-component)
        data.equipments.forEach((e, idx) => {
            if (e.type === 'SEU' || seuComponentIds.has(String(e.id))) return;
            const active = idx === this.activeEquipmentIndex;
            sidebarItemsHtml += `
                <div class="eq-item ${active ? 'active' : ''}"
                     draggable="true"
                     ondragstart="event.dataTransfer.setData('text/plain',${idx}); event.target.closest('.eq-item').classList.add('dragging')"
                     ondragend="event.target.closest('.eq-item').classList.remove('dragging')"
                     ondragover="event.preventDefault(); this.classList.add('drag-over')"
                     ondragleave="this.classList.remove('drag-over')"
                     ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveEquipment(parseInt(event.dataTransfer.getData('text/plain')),${idx})"
                     onclick="window.propostaTecnicaModule.switchEquipment(${idx})"
                     style="padding: 10px 12px; cursor: grab; display: flex; align-items: center; gap: 8px;
                             font-weight: ${active ? '700' : '500'};
                             color: ${active ? 'white' : '#475569'};
                             border-left: 4px solid ${active ? 'rgb(56, 86, 14)' : 'transparent'};
                             background: ${active ? 'var(--color-accent)' : 'transparent'};
                            transition: all 0.2s;">
                    <i class="ph ph-list" style="font-size: 14px; opacity: 0.3; cursor: grab; flex-shrink: 0;" title="Arrastar para reordenar"></i>
                    <i class="ph ph-cpu" style="font-size: 18px; opacity: ${active ? '1' : '0.4'}; flex-shrink: 0;"></i>
                    <div style="flex: 1; min-width: 0;">
                        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; font-weight: ${active ? '700' : '600'};">
                            ${e.tag || 'Sem TAG'}
                        </div>
                        <div style="margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                            ${getBadge(e.type)}
                            ${e.ufOrigem ? `<span style="background: #e0f2fe; color: #075985; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 9px;">${e.ufOrigem}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 2px; flex-shrink: 0;">
                        <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.renameEquipment(${idx})"
                                style="border: none; background: transparent; color: #64748b; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                title="Editar TAG">
                            <i class="ph ph-pencil-simple" style="font-size: 14px;"></i>
                        </button>
                        <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.removeEquipment(${idx})"
                                style="border: none; background: transparent; color: #ef4444; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                title="Excluir equipamento">
                            <i class="ph ph-trash" style="font-size: 14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        const sidebarHtml = `
            <div style="width: 260px; background: #f8fafc; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0;">
                <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">
                        <i class="ph ph-cpu" style="margin-right: 6px;"></i> Equipamentos
                    </h3>
                </div>
                <div style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; background: white;">
                    <button type="button" class="btn btn-primary" id="btn-add-equipment" onclick="app.propostaTecnica.addEquipment()" style="width: 100%; justify-content: center; gap: 6px; font-size: 12px;">
                        <i class="ph ph-plus-circle"></i> Acrescentar Novo Equipamento
                    </button>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 8px 0;">
                    ${sidebarItemsHtml}
                </div>
                <div style="padding: 8px 12px; border-top: 1px solid #e2e8f0; background: white; display: flex; flex-direction: column; gap: 6px;">
                    ${subTab === 'labor' ? `
                    <button type="button" class="btn btn-sm" onclick="app.propostaTecnica.calcularMaoDeObraTodosEquipamentos()" style="width: 100%; justify-content: center; gap: 6px; font-size: 11px; background: #7c3aed; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                        <i class="ph ph-lightning"></i> Estimar M.O. Todos Equip.
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Sub-tab navigation HTML
        const navHtml = `
            <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: white; overflow-x: auto; flex-shrink: 0;">
                ${subTabs.map(t => `
                    <button class="sub-tab-btn ${subTab === t ? 'active' : ''}"
                            onclick="window.propostaTecnicaModule.switchSubTab('${t}')"
                            style="padding: 12px 12px; font-size: 12px; font-weight: ${subTab === t ? '800' : '600'};
                                   color: ${subTab === t ? 'var(--color-accent)' : '#64748b'};
                                   border: none; background: ${subTab === t ? 'white' : 'transparent'};
                                   cursor: pointer; white-space: nowrap;
                                   border-bottom: 3px solid ${subTab === t ? 'var(--color-accent)' : 'transparent'};
                                   transition: all 0.2s;">
                         <i class="ph ${{
                            'technical': 'ph-notebook',
                            'norms': 'ph-book',
                            'loads': 'ph-list-checks',
                            'busbars': 'ph-lightning',
                            'exclusions': 'ph-x-circle',
                            'deviations': 'ph-warning',
                            'labor': 'ph-wrench',
                            'expenses': 'ph-currency-dollar',
                            'materiais': 'ph-package',
                            'eletrocentro': 'ph-buildings',
                            'calc_eletrico': 'ph-chart-bar',
                            'calc_mecanico': 'ph-gear-six',
                            'io_list': 'ph-plugs',
                            'bom': 'ph-list-bullets',
                            'layout': 'ph-frame-corners'
                        }[t] || 'ph-circle'}" style="margin-right: 6px;"></i>
                        ${this.getSubTabLabel(t, eq)}
                    </button>
                `).join('')}
            </div>
        `;

        // Sub-tab content
        let contentHtml = '';

        this._aiFieldsForCurrentEq = null;
        if (subTab === 'technical') {
            const ai = data._aiChanges;
            let eqSet = ai?.equipments?.[this.activeEquipmentIndex];
            if (eqSet && !(eqSet instanceof Set)) {
                eqSet = new Set(Object.keys(eqSet));
            }
            this._aiFieldsForCurrentEq = eqSet;

            const customCharacteristics = eq.customCharacteristics || [];

            contentHtml = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Ficha Técnica: ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Configure as características técnicas do equipamento</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addCustomCharacteristic(${eq.id})" style="white-space: nowrap;">+ Inserir Característica</button>
                </div>
                <div style="padding: 6px 24px; animation: fadeIn 0.3s ease;">

                        <input type="hidden" name="eq_tag" value="${eq.tag || ''}">
                        <input type="hidden" name="eq_type" value="${eq.type || ''}">

                        <div class="row" style="display: flex; gap: 16px; margin-bottom: 20px;">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">UF de Origem (Fornecedor)</label>
                                <select name="eq_ufOrigem" class="form-control">
                                    <option value="">Selecione...</option>
                                    ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf =>
                                        `<option value="${uf}" ${(eq.ufOrigem || store.getState().company?.uf || '') === uf ? 'selected' : ''}>${uf}</option>`
                                    ).join('')}
                                </select>
                                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">UF de fabricação/fornecimento do equipamento. Usado para cálculo de ICMS interestadual.</div>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">UF de Destino (Instalação)</label>
                                <input type="text" class="form-control" value="${data.uf || ''}" readonly style="background: #f1f5f9; color: #64748b;">
                                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Preenchido automaticamente dos dados gerais da proposta.</div>
                            </div>
                        </div>

                        ${eq.type === 'SEU' ? `
                            <div style="max-width: 600px;">
                                <div style="margin-bottom: 20px;">
                                    <label class="form-label">Tensão Primária</label>
                                    <select name="seu_tensao_primaria" class="form-control" onchange="app.propostaTecnica.toggleSeuTensaoOutro(this)">
                                        <option value="">Selecione...</option>
                                        ${['6,0kV', '6,9kV', '11,9kV', '13,8kV', '22kV', '34,5kV', 'Outro'].map(v =>
                                            `<option value="${v}" ${eq.technical?.tensao_primaria === v ? 'selected' : ''}>${v}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="form-group" id="seu_tensao_primaria_outro_wrap" style="margin-top:8px;${eq.technical?.tensao_primaria === 'Outro' || (!eq.technical?.tensao_primaria || !['6,0kV','6,9kV','11,9kV','13,8kV','22kV','34,5kV'].includes(eq.technical?.tensao_primaria)) ? '' : 'display:none'}">
                                        <input type="text" name="seu_tensao_primaria_outro" class="form-control" placeholder="Especifique a tensão..." value="${eq.technical?.tensao_primaria_outro || eq.technical?.tensao_primaria || ''}">
                                    </div>
                                </div>

                                <div style="margin-bottom: 16px;">
                                    <label class="form-label" style="font-weight:700;color:#1e3a8a;">Equipamentos da SEU</label>
                                    <div style="font-size:12px;color:#64748b;margin-bottom:8px;">${(eq.seu_components || []).length} equipamento(s) vinculado(s)</div>
                                    <div id="seu-components-container" style="border:1px solid #e2e8f0;border-radius:8px;padding:8px;max-height:260px;overflow-y:auto;">
                                        ${(() => {
                                            const comps = (eq.seu_components || []).map(id => data.equipments.find(e => String(e.id) === String(id))).filter(Boolean);
                                            if (comps.length === 0) return '<div style="padding:20px;text-align:center;color:#94a3b8;">Nenhum equipamento vinculado a esta SEU.</div>';
                                            return comps.map(ce => {
                                                const badge = (() => {
                                                    const map = {'TR-MT':{bg:'#fef3c7',color:'#92400e',l:'TR-MT'},'CCM-BT':{bg:'#dcfce7',color:'#166534',l:'CCM-BT'},'QGBT':{bg:'#dcfce7',color:'#166534',l:'QGBT'},'CUB-MT':{bg:'#fef3c7',color:'#92400e',l:'CUB-MT'},'ELETROCENTRO':{bg:'#e0f2fe',color:'#075985',l:'ELETROCENTRO'},'QTA':{bg:'#dcfce7',color:'#166534',l:'QTA'},'PLC':{bg:'#ede9fe',color:'#5b21b6',l:'PLC'},'BC':{bg:'#fce7f3',color:'#9d174d',l:'BC'},'REM':{bg:'#ede9fe',color:'#5b21b6',l:'REM'},'PNC':{bg:'#dcfce7',color:'#166534',l:'PNC'},'QDL':{bg:'#dcfce7',color:'#166534',l:'QDL'},'QDF':{bg:'#dcfce7',color:'#166534',l:'QDF'}};
                                                    const m = map[ce.type] || {bg:'#f1f5f9',color:'#64748b',l:ce.type};
                                                    return '<span style="background:'+m.bg+';color:'+m.color+';padding:2px 8px;border-radius:10px;font-weight:700;font-size:10px;">'+m.l+'</span>';
                                                })();
                                                return `
                                                    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;margin-bottom:4px;background:#f8fafc;">
                                                        <i class="ph ph-dot" style="font-size:14px;color:#94a3b8;flex-shrink:0;"></i>
                                                        <span style="flex:1;font-size:13px;font-weight:600;">${ce.tag}</span>
                                                        ${badge}
                                                        <button type="button" onclick="app.propostaTecnica.removeSeuComponent(${eq.id}, ${ce.id})" style="border:none;background:transparent;color:#ef4444;cursor:pointer;padding:2px;line-height:1;font-size:14px;" title="Remover da SEU"><i class="ph ph-x"></i></button>
                                                    </div>
                                                `;
                                            }).join('');
                                        })()}
                                    </div>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addSeuComponent(${eq.id})" style="margin-top:10px;"><i class="ph ph-plus"></i> Adicionar Componente</button>
                                    <button type="button" class="btn btn-sm" style="background:#dc2626;color:white;border:none;border-radius:4px;padding:6px 12px;font-size:11px;margin-top:10px;margin-left:8px;" onclick="app.propostaTecnica.undoSeu(${eq.id})"><i class="ph ph-x-circle"></i> Desfazer SEU</button>
                                </div>
                            </div>
                        ` : isMT ? `

                            ${this.renderDSGroup('Tensão Nominal', 'tensao', eq.technical?.tensao, ['4,16KV', '6,0KV', '6,9KV', '13,8KV'])}

                            ${this.renderDSGroup('Tensão Máxima', 'tensao_max', eq.technical?.tensao_max, ['7,2KV', '15KV', '17,5KV', '24,2KV'])}

                            ${this.renderDSGroup('Frequência', 'frequencia', eq.technical?.frequencia, ['60Hz', '50Hz'])}

                            ${this.renderDSGroup('Corrente Nominal', 'corrente_nominal', eq.technical?.corrente_nominal, ['630A', '1250A', '2000A', '2500A', '3150A', '4000A'])}

                            ${this.renderDSGroup('Icc (Curto-Circuito)', 'icc', eq.technical?.icc, ['16KA', '20KA', '25KA', '31,5KA', '40KA'])}

                            ${this.renderDSGroup('Icc Dinâmico (Icp)', 'icp', eq.technical?.icp, ['40KAp', '50KAp', '63KAp', '80KAp', '100KAp'])}

                            ${this.renderDSGroup('Nível Isolamento (NBI)', 'nbi', eq.technical?.nbi, ['60KV', '75KV', '95KV', '110KV', '125KV'])}

                            ${this.renderDSGroup('Tensão Suportável', 'suportabilidade', eq.technical?.suportabilidade, ['20KV', '28KV', '34KV', '38KV', '50KV'])}

                            ${this.renderDSGroup('Classificação Arco (IAC)', 'iac', eq.technical?.iac, ['IAC AFLR', 'IAC AFL', 'IAC A'])}

                            ${this.renderDSGroup('Corrente de Arco / Tempo', 'iac_tempo', eq.technical?.iac_tempo, ['16KA / 1s', '20KA / 1s', '25KA / 1s', '31,5KA / 1s'])}

                            ${this.renderDSGroup('Continuidade Perda (LSC)', 'lsc', eq.technical?.lsc, ['LSC2B', 'LSC2A', 'LSC1'])}

                            ${this.renderDSGroup('Classe de Partição', 'particao', eq.technical?.particao, ['PM', 'PI'])}

                            ${this.renderDSGroup('Altitude de Instalação', 'altitude', eq.technical?.altitude, ['1000m', '2000m', 'Outro'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP4X', 'IP54', 'IP55', 'IP65'])}

                            ${this.renderDSGroup('Cor da Pintura Externa', 'cor_externa', eq.technical?.cor_externa, ['RAL 7032', 'RAL 7035', 'Munsell N-6,5'])}

                            ${this.renderDSGroup('Monitoramento de Arco', 'monitoramento_arco_eq', eq.technical?.monitoramento_arco_eq, ['Vamp 121', 'Vamp 125', 'Vamp 321', 'Arctiq', 'Não'])}

                            ${this.renderDSGroup('Iluminação Interna', 'iluminacao', eq.technical?.iluminacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tomada de Serviço', 'tomada', eq.technical?.tomada, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Termostato', 'termostato', eq.technical?.termostato, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tratamento Barramento', 'barramento_tratamento', eq.technical?.barramento_tratamento, ['Cobre Nú', 'Termoretrátil', 'Prateado nas Conexões', 'Estanhado'])}

                            ${this._renderPainelTypeSelector(eq)}

                        ` : eq.type === 'TR-MT' ? `

                            ${this.renderDSGroup('Tipo', 'tipo', eq.technical?.tipo, ['Trifásico Seco', 'Outro'])}

                            ${this.renderDSGroup('Potência', 'potencia', eq.technical?.potencia, ['500kVA', '750kVA', '1000kVA', '1500kVA', '2000kVA', '2500kVA', '3000kVA', 'Outro'])}

                            ${this.renderDSGroup('Material do Enrolamento', 'enrolamento', eq.technical?.enrolamento, ['Alumínio', 'Cobre', 'Outro'])}

                            ${this.renderDSGroup('Tensão Primária', 'tensao_primaria', eq.technical?.tensao_primaria, ['6,0kV', '6,9kV', '11,9kV', '13,8kV', '22kV', '34,5kV', 'Outro'])}

                            ${this.renderDSGroup('Tensão Secundária', 'tensao_secundaria', eq.technical?.tensao_secundaria, ['220V', '380V', '440-254V', '480V', '690V', 'Outro'])}

                            ${this.renderDSGroup('Ligação Primária', 'ligacao_primaria', eq.technical?.ligacao_primaria, ['Triângulo Δ (delta)', 'Estrela Y', 'Zig-Zag', 'Outro'])}

                            ${this.renderDSGroup('Ligação Secundária', 'ligacao_secundaria', eq.technical?.ligacao_secundaria, ['Estrela Y', 'Triângulo Δ (delta)', 'Zig-Zag', 'Outro'])}

                            ${this.renderDSGroup('Grupo de Ligação', 'grupo_ligacao', eq.technical?.grupo_ligacao, ['Dyn1', 'Dyn11', 'Dd0', 'Yyn0', 'Yd1', 'Yd11', 'Outro'])}

                            ${this.renderDSGroup('Frequência', 'frequencia', eq.technical?.frequencia, ['60Hz', '50Hz'])}

                            ${this.renderDSGroup('Fator K', 'fator_k', eq.technical?.fator_k, ['1', '4', '7', '9', '13', '20', 'Outro'])}

                            ${this.renderDSGroup('Classe', 'classe', eq.technical?.classe, ['15kV', '24kV', '36kV', '72,5kV', 'Outro'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP-00', 'IP-21', 'IP-23', 'IP-44', 'IP-54', 'IP-55', 'Outro'])}

                            ${this.renderDSGroup('Classe de Temperatura', 'classe_temperatura', eq.technical?.classe_temperatura, ['F', 'H', 'B', 'A', 'Outro'])}

                            ${this.renderDSGroup('Instalação', 'instalacao', eq.technical?.instalacao, ['Abrigado', 'Ao Tempo', 'Outro'])}

                            ${this.renderDSGroup('Nível Básico de Impulso (NBI)', 'nbi', eq.technical?.nbi, ['60kV', '75kV', '95kV', '110kV', '125kV', '150kV', 'Outro'])}

                            ${this.renderDSGroup('Tipo de Resfriamento', 'resfriamento', eq.technical?.resfriamento, ['Ar Natural (ONAN)', 'Ar Forçado (ONAF)', 'Outro'])}

                            ${this.renderDSGroup('Acessórios', 'acessorios', eq.technical?.acessorios, ['Controlador de temperatura microprocessado com PT100', 'Comutador de Derivação (Tap)', 'Relé de Proteção Interna', 'Sensor de Temperatura', 'Painel de Comando', 'Outro'])}

                            ${this.renderDSGroup('Fabricante', 'fabricante', eq.technical?.fabricante, ['WEG', 'Tamura', 'Eaton', 'Siemens', 'ABB', 'Trafo', 'Outro'])}

                        ` : (eq.type === 'PLC' || eq.type === 'REM') ? `

                            ${this.renderDSGroup('Fabricante', 'fabricante', eq.technical?.fabricante, ['Allen-Bradley', 'Siemens', 'ABB', 'Schneider Electric', 'WEG', 'Phoenix Contact', 'Mitsubishi', 'Omron', 'Outro'])}

                            ${this.renderDSGroup('Tensão de Comando', 'comando', eq.technical?.comando, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte de Comando', 'comando_fonte', eq.technical?.comando_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Tensão Serv. Auxiliares', 'auxiliar', eq.technical?.auxiliar, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte Serv. Auxiliares', 'auxiliar_fonte', eq.technical?.auxiliar_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Tipo de Montagem', 'montagem', eq.technical?.montagem, ['Em Linha', 'Back to Back'])}

                            ${this.renderDSGroup('Local Instalação', 'instalacao', eq.technical?.instalacao, ['Abrigada', 'Tempo'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP20', 'IP42', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66'])}

                            ${this.renderDSGroup('Cor Pintura Externa', 'cor_externa', eq.technical?.cor_externa, ['RAL 7032', 'RAL 7035', 'Munsell N-6,5'])}

                            ${this.renderDSGroup('Espessura Pintura', 'camada_pintura', eq.technical?.camada_pintura, ['80 um', '90 um', '100 um'])}

                            ${this.renderDSGroup('Placas de Montagem', 'placa_montagem', eq.technical?.placa_montagem, ['RAL 2003', 'RAL 7032', 'Galvanizada'])}

                            ${this.renderDSGroup('Entrada de Cabos', 'entrada_cabos', eq.technical?.entrada_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Saída de Cabos', 'saida_cabos', eq.technical?.saida_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Acesso Frontal', 'acesso_frontal', eq.technical?.acesso_frontal, ['Fecho Borboleta', 'Fecho Yale', 'Fecho Cremona'])}

                            ${this.renderDSGroup('Acesso Traseiro', 'acesso_traseiro', eq.technical?.acesso_traseiro, ['Tampa Aparafusada', 'Porta Traseira'])}

                            ${this.renderDSGroup('Acesso Manutenção', 'acesso_manutencao', eq.technical?.acesso_manutencao, ['Frontal', 'Traseiro', 'Frontal e Traseiro'])}

                            ${this.renderDSGroup('Protocolo Comunicação', 'protocolo', eq.technical?.protocolo, ['Ethernet IP', 'Profinet', 'DeviceNet', 'Profibus DP', 'Modbus TCP', 'Modbus RTU', 'CANopen'])}

                            ${this.renderDSGroup('Cabo de Comunicação', 'cabo_comunicacao', eq.technical?.cabo_comunicacao, ['Patch Cord Profinet Cat5', 'Cabo pra DeviceNet', 'Cabo Profibus DP 1px22 Awg Lilas', 'Modbus TCP 1px22 Awg', 'Modbus RTU 1px22 Awg', 'Cabo Canopen Com Conector Rj45'])}

                            ${this.renderDSGroup('Forma de Segregação', 'segregacao', eq.technical?.segregacao, ['Forma 1', 'Caixa de Sobrepor', 'Outro'])}

                            ${this.renderDSGroup('Iluminação Interna', 'iluminacao', eq.technical?.iluminacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tomada de Serviço', 'tomada', eq.technical?.tomada, ['2P+T (10A)', '2P+T (20A)', 'Não'])}

                            ${this.renderDSGroup('Termostato / Desumid.', 'termostato', eq.technical?.termostato, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Ventilação Forçada', 'ventilacao', eq.technical?.ventilacao, ['Sim', 'Não'])}

                        `                         : eq.type === 'ELETROCENTRO' ? ``

                        : `

                            ${this.renderDSGroup('Tensão de Operação', 'tensao_operacao', eq.technical?.tensao_operacao, ['690V', '480V', '440V', '380V', '220V'])}

                            ${this.renderDSGroup('Sistema Elétrico', 'sistema_eletrico', eq.technical?.sistema_eletrico, ['Monofásico (1F+N+T)', 'Bifásico (2F+N+T)', 'Trifásico (3F+N+T)', 'Trifásico (3F+T)'])}

                            ${this.renderDSGroup('Corrente Nominal', 'corrente_nominal', eq.technical?.corrente_nominal, ['50A', '63A', '80A', '100A', '125A', '160A', '200A', '250A', '300A', '400A', '500A', '630A', '800A', '1000A', '1250A', '1500A', '1600A', '1800A', '2000A', '2500A', '3000A', '3200A', '4000A', '5000A', '6300A'])}

                            ${this.renderDSGroup('Tensão de Comando', 'comando', eq.technical?.comando, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte de Comando', 'comando_fonte', eq.technical?.comando_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Tensão Serv. Auxiliares', 'auxiliar', eq.technical?.auxiliar, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte Serv. Auxiliares', 'auxiliar_fonte', eq.technical?.auxiliar_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Frequência', 'frequencia', eq.technical?.frequencia, ['60Hz', '50Hz'])}

                            ${this.renderDSGroup('Capacidade Curto (Icc)', 'icc', eq.technical?.icc, ['10kA', '16kA', '25kA', '31,5kA', '35kA', '40kA', '50kA', '65kA', '85kA', '100kA'])}

                            ${this.renderDSGroup('Coordenação Proteção', 'coordenacao', eq.technical?.coordenacao, ['Tipo 1', 'Tipo 2'])}

                            ${this.renderDSGroup('Forma de Segregação', 'segregacao', eq.technical?.segregacao, ['Forma 1', 'Forma 2a', 'Forma 2b', 'Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'])}

                            ${this.renderDSGroup('Tipo de Execução', 'execucao', eq.technical?.execucao, ['Fixa', 'Extraível', 'Plug-in'])}

                            ${this.renderDSGroup('Fabricante', 'fabricante', eq.technical?.fabricante, ['Genérico', 'KitFrame', 'Eletropoll'])}

                            ${this._isForma34(eq.technical?.segregacao || '') && eq.technical?.fabricante === 'Eletropoll' ? this.renderDSGroup('Tipo de Gaveta', 'tipoGaveta', eq.technical?.tipoGaveta || 'Fixo', ['Fixo', 'Extraível']) : ''}

                            ${this.renderDSGroup('Tipo de Montagem', 'montagem', eq.technical?.montagem, ['Em Linha', 'Back to Back'])}

                            ${this.renderDSGroup('Local Instalação', 'instalacao', eq.technical?.instalacao, ['Abrigada', 'Tempo'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP20', 'IP42', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66'])}

                            ${this.renderDSGroup('Cor Pintura Externa', 'cor_externa', eq.technical?.cor_externa, ['RAL 7032', 'RAL 7035', 'Munsell N-6,5'])}

                            ${this.renderDSGroup('Espessura Pintura', 'camada_pintura', eq.technical?.camada_pintura, ['80 um', '90 um', '100 um'])}

                            ${this.renderDSGroup('Placas de Montagem', 'placa_montagem', eq.technical?.placa_montagem, ['RAL 2003', 'RAL 7032', 'Galvanizada'])}

                            ${this._renderPainelTypeSelector(eq)}

                            ${this._isForma34(eq.technical?.segregacao || '') && eq.technical?.fabricante === 'Eletropoll' ? '' : this.renderDSGroup('Altura do Painel (mm)', 'alturaPainel', eq.technical?.alturaPainel, ['1500', '1700', '1900', '2200'])}

                            ${this._isForma34(eq.technical?.segregacao || '') && eq.technical?.fabricante === 'Eletropoll' ? '' : this.renderDSGroup('Largura do Painel (mm)', 'larguraPainel', eq.technical?.larguraPainel, ['400', '600', '800', '1000', '1200'])}

                            ${this.renderDSGroup('Profundidade do Painel (mm)', 'profundidadePainel', eq.technical?.profundidadePainel, ['400', '600', '800', '1000', '1200'])}

                            ${this.renderDSGroup('Entrada de Cabos', 'entrada_cabos', eq.technical?.entrada_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Saída de Cabos', 'saida_cabos', eq.technical?.saida_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Acesso Frontal', 'acesso_frontal', eq.technical?.acesso_frontal, ['Fecho Borboleta', 'Fecho Yale', 'Fecho Cremona'])}

                            ${this.renderDSGroup('Acesso Traseiro', 'acesso_traseiro', eq.technical?.acesso_traseiro, ['Tampa Aparafusada', 'Porta Traseira'])}

                            ${this.renderDSGroup('Acesso Manutenção', 'acesso_manutencao', eq.technical?.acesso_manutencao, ['Frontal', 'Traseiro', 'Frontal e Traseiro'])}

                            ${this.renderDSGroup('Protocolo Comunicação', 'protocolo', eq.technical?.protocolo, ['Ethernet IP', 'Profinet', 'DeviceNet', 'Profibus DP', 'Modbus TCP', 'Modbus RTU', 'CANopen'])}

                            ${this.renderDSGroup('Cabo de Comunicação', 'cabo_comunicacao', eq.technical?.cabo_comunicacao, ['Patch Cord Profinet Cat5', 'Cabo pra DeviceNet', 'Cabo Profibus DP 1px22 Awg Lilas', 'Modbus TCP 1px22 Awg', 'Modbus RTU 1px22 Awg', 'Cabo Canopen Com Conector Rj45'])}

                            ${this.renderDSGroup('Monitor Arco Interno', 'arco_interno', eq.technical?.arco_interno, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Iluminação Interna', 'iluminacao', eq.technical?.iluminacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tomada de Serviço', 'tomada', eq.technical?.tomada, ['2P+T (10A)', '2P+T (20A)', 'Não'])}

                            ${this.renderDSGroup('Termostato / Desumid.', 'termostato', eq.technical?.termostato, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Ventilação Forçada', 'ventilacao', eq.technical?.ventilacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tratamento Barramento', 'barramento_tratamento', eq.technical?.barramento_tratamento, ['Cobre Nú', 'Totalmente Estanhado', 'Prateado nas Conexões', 'Pintado'])}

                            ${this.renderDSGroup('Isol. Termoretrátil', 'termoretratil', eq.technical?.termoretratil, ['Sim', 'Não'])}

                            <div class="form-group">

                                <label class="form-label">Norma de Ensaio</label>

                                <input type="text" name="eq_norma_teste" class="form-control" value="${eq.technical?.norma_teste || 'IEC 61439-1&2'}">

                            </div>

                        `}

                            ${customCharacteristics.length > 0 ? `
                                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e2e8f0;">
                                    <h5 style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 14px;">Características Adicionais</h5>
                                    ${customCharacteristics.map((cc, i) => `
                                        <div style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: white; margin-bottom: 8px; transition: all 0.2s;">
                                            <div style="flex: 1;">
                                                <div style="font-weight: 700; color: #1e3a8a; font-size: 13px;">${cc.name}</div>
                                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${cc.value}</div>
                                            </div>
                                            <button type="button" class="btn-icon" style="color: #ef4444; flex-shrink: 0;" onclick="app.propostaTecnica.removeCustomCharacteristic(${eq.id}, ${i})" title="Remover característica"><i class="ph ph-trash"></i></button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                    </div>

                    </div>

                </div>

            `;

        } else if (subTab === 'norms') {

            const customNorms = eq.customNorms || [];

            contentHtml = `

                <div style="max-width: 800px; animation: fadeIn 0.3s ease;">

                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                        <div>
                            <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Normas Técnicas Aplicáveis: ${eq.tag}${this._hasAiForEq('__norms') ? '<span class="ai-label">IA</span>' : ''}</h4>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Selecione as normas que regem o projeto deste equipamento</div>
                        </div>

                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addCustomNorm(${eq.id})" style="white-space: nowrap;">+ Inserir Norma Técnica</button>

                    </div>

                    <div style="margin-left: 10mm; display: grid; grid-template-columns: 1fr; gap: 12px;">

                        ${(eq.type === 'ELETROCENTRO' ? ELETROCENTRO_NORMS : COMMON_NORMS).map(n => `

                            <label style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${(eq.norms || []).includes(n.id) ? '#f0f9ff' : 'white'}; border-color: ${(eq.norms || []).includes(n.id) ? '#3b82f6' : '#e2e8f0'};">

                                <input type="checkbox" name="selectedNorms" value="${n.id}" ${(eq.norms || []).includes(n.id) ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #3b82f6;" onchange="window.propostaTecnicaModule.clearAiFieldForEq('__norms')">

                                <div>
                                    <div style="font-weight: 800; color: #1e3a8a; font-size: 14px;">${n.label}</div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${n.description}</div>
                                </div>

                            </label>

                        `).join('')}

                        ${customNorms.map((cn, i) => `

                            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid ${(eq.norms || []).includes(cn.id) ? '#3b82f6' : '#e2e8f0'}; border-radius: 12px; background: ${(eq.norms || []).includes(cn.id) ? '#f0f9ff' : 'white'}; transition: all 0.2s;">

                                <input type="checkbox" name="selectedNorms" value="${cn.id}" ${(eq.norms || []).includes(cn.id) ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #3b82f6;" onchange="window.propostaTecnicaModule.clearAiFieldForEq('__norms')">

                                <div style="flex: 1;">
                                    <div style="font-weight: 800; color: #1e3a8a; font-size: 14px;">${cn.label}</div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${cn.description || 'Norma personalizada'}</div>
                                </div>

                                <button type="button" class="btn-icon" style="color: #ef4444; flex-shrink: 0;" onclick="app.propostaTecnica.removeCustomNorm(${eq.id}, ${i})" title="Remover norma"><i class="ph ph-trash"></i></button>

                            </div>

                        `).join('')}

                    </div>

                </div>

            `;

        } else if (subTab === 'loads') {
            if (isTrMt || isAutomation) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const tipicos = store.getState().tipicos || [];
                const cubiculos = store.getState().cubiculos || [];
                const isLM = this.cargasSubView === 'lm';
                contentHtml = `
                    <div style="animation: fadeIn 0.3s ease;">

                        <!-- Internal Navigation (Toggle Edição vs LM) -->

                        <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">

                            <h4 style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">${isLM ? 'Lista de Materiais' : (eq && eq.type === 'CUB-MT' ? 'Lista de Cubículos' : 'Lista de Cargas')}${!isLM && this._hasAiForEq('__loads') ? '<span class="ai-label">IA</span>' : ''}</h4>

                            <div style="background: #f1f5f9; padding: 4px; border-radius: 8px; display: flex; gap: 4px;">

                                <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('edit')" style="font-size: 11px; padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; ${!isLM ? 'background: var(--color-accent); color: white; box-shadow: 0 1px 3px rgba(67,101,17,0.3);' : 'background: white; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.06);'}">

                                    <i class="ph ph-pencil-simple" style="margin-right: 4px;"></i> ${eq && eq.type === 'CUB-MT' ? 'Lista de Cubículos (Edição)' : 'Lista de Cargas (Edição)'}

                                </button>

                                <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('lm')" style="font-size: 11px; padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; ${isLM ? 'background: var(--color-accent); color: white; box-shadow: 0 1px 3px rgba(67,101,17,0.3);' : 'background: white; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.06);'}">

                                    <i class="ph ph-list-bullets" style="margin-right: 4px;"></i> Visualizar LM

                                </button>

                            </div>

                        </div>

                        <!-- Panel Selector Area -->

                        <div style="margin-bottom: 20px;">

                            <button type="button" class="btn btn-sm" style="background: #0284c7; color: white; border-radius: 20px; padding: 6px 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">

                                <i class="ph ph-stack" style="font-size: 16px;"></i> ${eq.tag || 'Painel Geral'}

                            </button>

                        </div>

                        ${isLM ? this.renderLoadsLM(eq) : `<div onchange="window.propostaTecnicaModule.clearAiFieldForEq('__loads')">${this.renderLoadsEdit(eq, eq && eq.type === 'CUB-MT' ? cubiculos : tipicos)}</div>`}

                    </div>
                `;
            }

        } else if (subTab === 'busbars') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const b = eq.busbars || { main: {}, branch: {}, ground: {} };
                contentHtml = `
                    <div style="animation: fadeIn 0.3s ease;">

                        <div style="margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                            <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Barramentos e Conexões: ${eq.tag}</h4>

                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Especificações de barramentos de cobre e proteção</div>

                        </div>

                        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">

                            <!-- Principal -->

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">

                                <h5 style="margin: 0 0 15px 0; color: #1e3a8a; font-weight: 800; font-size: 14px; text-transform: uppercase;">Barramento Principal (Horizontal)</h5>

                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">

                                    <div class="form-group"><label class="form-label">Material</label><input type="text" name="bus_main_mat" class="form-control" value="${b.main?.mat || 'Cobre Eletrolítico'}"></div>

                                    <div class="form-group"><label class="form-label">Dimensões / Seção</label><input type="text" name="bus_main_dim" class="form-control" value="${b.main?.dim || ''}" placeholder="Ex: 2x (80x10)mm"></div>

                                    <div class="form-group"><label class="form-label">Corrente (In)</label><input type="text" name="bus_main_inc" class="form-control" value="${b.main?.inc || ''}" placeholder="Ex: 2500A"></div>

                                    <div class="form-group"><label class="form-label">Peso Est. (kg)</label><input type="text" name="bus_main_weight" class="form-control" value="${b.main?.weight || ''}"></div>

                                </div>

                            </div>

                            <!-- Derivação -->

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">

                                <h5 style="margin: 0 0 15px 0; color: #1e3a8a; font-weight: 800; font-size: 14px; text-transform: uppercase;">Barramento de Derivação (Vertical)</h5>

                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">

                                    <div class="form-group"><label class="form-label">Material</label><input type="text" name="bus_branch_mat" class="form-control" value="${b.branch?.mat || 'Cobre Eletrolítico'}"></div>

                                    <div class="form-group"><label class="form-label">Dimensões / Seção</label><input type="text" name="bus_branch_dim" class="form-control" value="${b.branch?.dim || ''}"></div>

                                    <div class="form-group"><label class="form-label">Corrente (In)</label><input type="text" name="bus_branch_inc" class="form-control" value="${b.branch?.inc || ''}"></div>

                                    <div class="form-group"><label class="form-label">Peso Est. (kg)</label><input type="text" name="bus_branch_weight" class="form-control" value="${b.branch?.weight || ''}"></div>

                                </div>

                            </div>

                            <!-- Terra -->

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">

                                <h5 style="margin: 0 0 15px 0; color: #1e3a8a; font-weight: 800; font-size: 14px; text-transform: uppercase;">Barramento de Terra / Proteção (PE)</h5>

                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">

                                    <div class="form-group"><label class="form-label">Material</label><input type="text" name="bus_ground_mat" class="form-control" value="${b.ground?.mat || 'Cobre Eletrolítico'}"></div>

                                    <div class="form-group"><label class="form-label">Dimensões / Seção</label><input type="text" name="bus_ground_dim" class="form-control" value="${b.ground?.dim || ''}"></div>

                                    <div class="form-group"><label class="form-label">Peso Est. (kg)</label><input type="text" name="bus_ground_weight" class="form-control" value="${b.ground?.weight || ''}"></div>

                                </div>

                            </div>

                        </div>

                    </div>
                `;
            }

        } else if (subTab === 'deviations') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                contentHtml = this.renderDeviations(eq);
            }

        } else if (subTab === 'labor') {
            contentHtml = this.renderLabor(eq);

        } else if (subTab === 'expenses') {
            contentHtml = this.renderExpenses(eq);

        } else if (subTab === 'calc_eletrico') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const html = window.app?.calculosEletricos?.buildHtml(eq.tag);
                contentHtml = html || `<div style="padding:40px;text-align:center;color:#94a3b8;"><i class="ph ph-lightning" style="font-size:48px;opacity:0.2;"></i><br><br>Módulo de Cálculos Elétricos não disponível.</div>`;
            }

        } else if (subTab === 'calc_mecanico') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const html = window.app?.calculosMecanicos?.buildHtml(eq.tag);
                contentHtml = html || `<div style="padding:40px;text-align:center;color:#94a3b8;"><i class="ph ph-wrench" style="font-size:48px;opacity:0.2;"></i><br><br>Módulo de Cálculos Mecânicos não disponível.</div>`;
            }

        } else if (subTab === 'layout') {
            contentHtml = this.renderLayoutSuggester(eq);

        } else if (subTab === 'io_list') {
            contentHtml = `
                <div style="animation: fadeIn 0.3s ease;">
                    <div style="max-width: 800px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">Lista de I/O: ${eq.tag}</h4>
                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Configure os racks, módulos e canais de entrada/saída.</div>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="app.navigateTo('automacao-rede')" title="Gerar arquitetura de rede industrial com base nas I/Os configuradas">
                                <i class="ph ph-network"></i> Gerar Arquitetura de Rede
                            </button>
                        </div>
                    </div>
                    ${this.renderIOList(eq)}
                </div>
            `;

        } else if (subTab === 'bom') {
            contentHtml = `
                <div style="animation: fadeIn 0.3s ease;">
                    <div style="max-width: 800px; margin-bottom: 20px;">
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">Lista de Materiais (Automação): ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Materiais derivados da configuração de I/O.</div>
                    </div>
                    ${this.renderAutomationBOM(eq)}
                </div>
            `;

        } else if (subTab === 'eletrocentro') {
            contentHtml = this.renderEletrocentroTab(eq);

        } else if (subTab === 'materiais') {
            contentHtml = this.renderMateriaisTab(eq);

        } else {
            contentHtml = `<div style="text-align: center; padding: 40px; color: #94a3b8;"><i class="ph ph-hourglass-high" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i><br>Sub-aba "${this.getSubTabLabel(subTab, eq)}" em desenvolvimento para ${eq.tag}.</div>`;
        }

        return `
            <div style="display: flex; flex: 1; overflow: hidden;">
                ${sidebarHtml}
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    ${navHtml}
                    <div style="flex: 1; overflow-y: auto; padding: 0; background: #f1f5f9; scrollbar-gutter: stable;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderRestrictedTab(eq) {
        return `<div style="text-align: center; padding: 60px 40px; color: #94a3b8;">
            <i class="ph ph-prohibit" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
            <br>
            <div style="font-weight: 700; font-size: 16px; color: #64748b;">Sub-aba não disponível</div>
            <div style="font-size: 13px; margin-top: 6px;">Esta seção não se aplica ao equipamento ${eq.tag} (${eq.type}).</div>
        </div>`;
    },

    getSubTabLabel(subTab, eq) {
        const labels = {
            'technical': 'Ficha Técnica',
            'norms': 'Normas',
            'loads': eq && eq.type === 'CUB-MT' ? 'Cubículos' : 'Cargas',
            'busbars': 'Barramentos',
            'deviations': 'Desvios',
            'labor': 'Mão de Obra',
            'expenses': 'Despesas',
            'materiais': 'Lista de Materiais',
            'eletrocentro': 'Escopo',
            'calc_eletrico': 'Cálculos Elétricos',
            'calc_mecanico': 'Cálculos Mecânicos',
        'io_list': 'Lista de I/O',
        'bom': 'Lista de Materiais',
        'layout': 'Layout Sugerido'
        };
        return labels[subTab] || subTab;
    },

};
