// tabs.js (bloco 2/7) — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { store } from '../state.js';
import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from '../busbarCalculator.js';
import { deriveMaterials } from '../automacaoMateriais.js';
import { EMPRESA } from '../empresaConfig.js';
import { infraSubtotal, infraPrecoFinal } from '../infraPricing.js';
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './shared.js';

const app = window.app;
export const tabs = {
    renderTabGeral(data) {
        const aiGeral = new Set(data._aiChanges?.geral || []);
        const isAi = (f) => aiGeral.has(f);
        const isAUTPRO = store.getState().company?.folderName?.startsWith('AUT_');

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Dados Gerais da Proposta</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Informações do cliente e detalhes do projeto</div>
                    </div>
                </div>

                <div class="form-group">

                    <label class="form-label">Cliente${isAi('cliente') ? '<span class="ai-label">IA</span>' : ''}</label>

                    <select name="cliente" id="pt_cliente" class="form-control${isAi('cliente') ? ' ai-filled' : ''}" onchange="app.propostaTecnica.handleClientChange(this.value)">

                        <option value="" disabled ${!data.cliente ? 'selected' : ''}>Selecione um cliente...</option>

                        ${(store.getState().clientes || []).map(c => `

                            <option value="${c.razaoSocial}" ${data.cliente === c.razaoSocial ? 'selected' : ''}>${c.razaoSocial}</option>

                        `).join('')}

                    </select>

                    <div style="margin-top: 5px; font-size: 12px;">

                        <a href="#" onclick="window.returnTo = 'proposta-tecnica'; app.navigateTo('clientes'); return false;" style="color: #3b82f6;">+ Gerenciar Clientes</a>

                    </div>

                </div>

                ${isAUTPRO ? `
                <div class="form-group" style="margin-top: 16px;">

                    <label class="form-label">Unidade do Cliente</label>

                    <select name="unidade_cliente" id="pt_unidade_cliente" class="form-control" onchange="app.propostaTecnica.handleUnidadeChange(this.value)">

                        <option value="">Selecione uma unidade...</option>

                    </select>

                    <div style="margin-top: 5px; font-size: 12px; color: #94a3b8;">
                        Unidade cadastrada no cliente &mdash; selecione o cliente primeiro se a lista estiver vazia
                    </div>

                </div>
                ` : ''}

                <div class="grid-form" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: ${isAUTPRO ? '16px' : '20px'};">

                    <div class="form-group">

                        <label class="form-label">Código da Proposta</label>

                        <div style="display: flex; gap: 8px;">

                            <input type="text" id="pt-prop-codigo" name="codigo" class="form-control" value="${data.codigo || (() => {
                                const ptcFolder = String(window.app.currentPtc?.folder || '');
                                const newMatch = ptcFolder.match(/^(\d{8,10})/);
                                const oldMatch = ptcFolder.match(/PTC-\d{4}-\d+/i);
                                const basePtc = newMatch ? newMatch[1] : (oldMatch ? oldMatch[0].toUpperCase() : (window.app.currentPtcInfo?.ptcNumber || 'PTC-0000-0000'));
                                return `${basePtc}-PT${data.customCodigoSuffix || '_R00'}`;
                            })()}" readonly style="background-color: #f1f5f9; font-weight: 500;">

                            <button type="button" class="btn btn-secondary" title="Editar Código" onclick="const el = document.getElementById('pt-prop-codigo'); el.removeAttribute('readonly'); el.style.backgroundColor = 'white'; el.focus();">

                                <i class="ph ph-pencil-simple"></i>

                            </button>

                        </div>

                    </div>

                    <div class="form-group">

                        <label class="form-label">Data de Emissão${isAi('data_emissao') ? '<span class="ai-label">IA</span>' : ''}</label>

                        <input type="date" name="data_emissao" class="form-control${isAi('data_emissao') ? ' ai-filled' : ''}" value="${data.data_emissao || new Date().toISOString().split('T')[0]}" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">

                    </div>

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Aos Cuidados (A/C)</label>

                        <div id="pt_contact_container">

                            <select name="aos_cuidados" id="pt_aos_cuidados" class="form-control" onchange="app.propostaTecnica.handleContactSelection(this.value)">

                                <option value="">Selecione um cliente primeiro...</option>

                                ${data.cliente ? this.getContactOptionsHTML(data.cliente, data.aos_cuidados) : ''}

                            </select>

                        </div>

                    </div>

                    <div class="form-group">

                        <label class="form-label">E-mail</label>

                        <input type="email" name="email" id="pt_email" class="form-control" value="${data.email || ''}" placeholder="email@exemplo.com" readonly style="background: #f1f5f9; cursor: not-allowed;">

                    </div>

                    <div class="form-group">

                        <label class="form-label">Telefone Fixo</label>

                        <input type="text" name="telefone" id="pt_telefone" class="form-control" value="${data.telefone || ''}" placeholder="(00) 00000-0000" readonly style="background: #f1f5f9; cursor: not-allowed;">

                    </div>

                    <div class="form-group">

                        <label class="form-label">Celular</label>

                        <input type="text" name="celular" id="pt_celular" class="form-control" value="${data.celular || ''}" placeholder="(00) 00000-0000" readonly style="background: #f1f5f9; cursor: not-allowed;">

                    </div>

                </div>



                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Nome do Projeto / Título${isAi('projeto') ? '<span class="ai-label">IA</span>' : ''}</label>

                        <input type="text" name="projeto" class="form-control${isAi('projeto') ? ' ai-filled' : ''}" value="${data.projeto || (window.app.currentPtc ? window.app.currentPtc.title : '')}" placeholder="Ex: Painel Elétrico de Baixa Tensão - 440V" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">

                </div>



                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Referência / Subtítulo</label>

                    <input type="text" name="referencia" class="form-control" value="${data.referencia || ''}" placeholder="Ex: CCM para Projeto Aumento do Mix de Açúcar">

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Objeto do Fornecimento${isAi('objeto') ? '<span class="ai-label">IA</span>' : ''}</label>

                        <input type="text" name="objeto" class="form-control${isAi('objeto') ? ' ai-filled' : ''}" value="${data.objeto || 'FORNECIMENTO DE PAIN�?�?�IS EL�?�?�TRICOS'}" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">

                    </div>

                    <div id="client-docs-section" class="form-group" style="margin-top:12px;${!data.clientDocuments?.length ? 'display:none' : ''}">
                        <label style="font-weight:600;font-size:13px;color:#1e293b;display:block;margin-bottom:6px;">
                            <i class="ph ph-files"></i> Documentos Recebidos do Cliente
                        </label>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;">
                            ${(data.clientDocuments || []).map(d =>
                                `<span style="display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;border:1px solid #e2e8f0;padding:4px 10px;border-radius:6px;font-size:12px;color:#334155;">
                                    <i class="ph ph-file"></i>
                                    ${d.nome}
                                </span>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="row" style="display: flex; gap: 12px;">
                        <div class="form-group" style="flex: 2;">
                            <label class="form-label">Cidade${isAi('cidade') ? '<span class="ai-label">IA</span>' : ''}</label>
                            <input type="text" name="cidade" id="pt_cidade" class="form-control${isAi('cidade') ? ' ai-filled' : ''}" value="${data.cidade || ''}" placeholder="Ex: Sertãozinho" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">UF${isAi('uf') ? '<span class="ai-label">IA</span>' : ''}</label>
                            <select name="uf" id="pt_uf" class="form-control${isAi('uf') ? ' ai-filled' : ''}" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">
                                <option value="">Selecione...</option>
                                ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf =>
                                    `<option value="${uf}" ${data.uf === uf ? 'selected' : ''}>${uf}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <input type="hidden" name="localizacao" id="pt_localizacao" value="${data.localizacao || ''}">

                    <div class="form-group">
                        <label class="form-label">Engenheiro Responsável</label>
                        <select name="engenheiroResponsavel" class="form-control" data-user-select>
                            ${this._userOptions(data.engenheiroResponsavel)}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Vendedor</label>
                        <select name="vendedor" class="form-control">
                            <option value="">Selecione...</option>
                            ${(() => {
                                const list = store.getState().vendedores || [];
                                const current = data.vendedor || '';
                                const exists = list.some(v => v.nome === current);
                                let html = '';
                                if (current && !exists) {
                                    html += `<option value="${this._escapeHtml(current)}" selected>${this._escapeHtml(current)}</option>`;
                                }
                                html += list.map(v => `<option value="${this._escapeHtml(v.nome)}"${v.nome === current ? ' selected' : ''}>${this._escapeHtml(v.nome)}</option>`).join('');
                                return html;
                            })()}
                        </select>
                    </div>

                </div>



                <!-- Image Uploads Row -->

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">

                    <!-- Company Header Logo -->

                    <div class="form-group">

                        <label class="form-label">Cabeçalho (Logo)</label>

                        <div style="display: flex; flex-direction: column; gap: 10px;">

                            <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-upload-simple"></i> Alterar Header

                                <input type="file" id="pt_logo_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaTecnica.handleLogoUpload(this)">

                            </label>

                            <div id="pt_logo_preview_container" style="display: ${data.logo_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="pt_logo_preview" src="${data.logo_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px;">

                                <input type="hidden" id="pt_logo_base64" name="logo_base64" value="${data.logo_base64 || ''}">

                            </div>

                        </div>

                    </div>



                    <!-- Client Logo -->

                    <div class="form-group">

                        <label class="form-label">Logo do Cliente (Centro)</label>

                        <div style="display: flex; flex-direction: column; gap: 10px;">

                            <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-user-circle"></i> Escolher Logo Cliente

                                <input type="file" id="pt_client_logo_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaTecnica.handleClientLogoUpload(this)">

                            </label>

                            <div id="pt_client_logo_preview_container" style="display: ${data.client_logo_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="pt_client_logo_preview" src="${data.client_logo_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px;">

                                <input type="hidden" id="pt_client_logo_base64" name="client_logo_base64" value="${data.client_logo_base64 || ''}">
                                <div style="margin-top: 8px;">
                                    <button type="button" class="btn btn-sm btn-danger" onclick="app.propostaTecnica.removeClientLogo()">
                                        <i class="ph ph-trash"></i> Remover Logo
                                    </button>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>



                <!-- Watermark Upload -->

                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Marca D'água (Fundo)</label>

                    <div style="display: flex; flex-direction: column; gap: 10px;">

                        <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-image"></i> Escolher Marca D'água

                                <input type="file" id="pt_watermark_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaTecnica.handleWatermarkUpload(this)">

                            </label>

                            <div id="pt_watermark_preview_container" style="display: ${data.watermark_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="pt_watermark_preview" src="${data.watermark_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px; opacity: 0.5;">

                                <input type="hidden" id="pt_watermark_base64" name="watermark_base64" value="${data.watermark_base64 || ''}">

                    </div>

                </div>

            `;

    },

    renderTabEscopo(data) {
        const items = data.scopeItems || [];
        const autoItems = items.filter(it => it.auto);
        const manualItems = items.filter(it => !it.auto);
        const equipItems = autoItems.filter(it => !it.isInfra);
        const infraItems = autoItems.filter(it => it.isInfra);

        return `
            <div style="padding: 40px; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.3s ease;">

                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Escopo do Fornecimento</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                            Itens que compõem o escopo técnico-comercial da proposta
                            <span style="display: inline-flex; align-items: center; gap: 6px; margin-left: 12px;">
                                <span style="display: inline-block; width: 10px; height: 10px; background: #f0f9ff; border: 1px solid #93c5fd; border-radius: 3px;"></span> PTC
                                <span style="display: inline-block; width: 10px; height: 10px; background: #fefce8; border: 1px solid #fde68a; border-radius: 3px;"></span> Cliente
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.syncScopeFromProposal()" style="white-space: nowrap;">
                            <i class="ph ph-arrows-clockwise"></i> Sincronizar Proposta
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addScopeItem()" style="white-space: nowrap;">
                            <i class="ph ph-plus"></i> Adicionar Item
                        </button>
                    </div>
                </div>

                ${equipItems.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h5 style="font-size: 13px; color: #475569; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-cpu" style="font-size: 16px;"></i> Itens do Equipamento
                        </h5>
                        ${equipItems.map((item, i) => `
                            <div class="scope-row" data-auto="1" data-equip-tag="${item.equipTag || ''}" ${item.isSeu ? 'data-is-seu="1"' : ''} ${item.isSeuComp ? 'data-is-seu-comp="1" data-parent-seu="' + (item.parentSeu || '') + '"' : ''}
                                 style="display: flex; align-items: center; gap: 12px; padding: ${item.isSeuComp ? '10px 12px 10px 36px' : '12px'}; background: ${item.isSeu ? '#fffbeb' : (item.isSeuComp ? '#f8fafc' : '#f8fafc')}; border: 1px solid ${item.isSeu ? '#fde68a' : '#e2e8f0'}; border-left: 4px solid ${item.isSeu ? '#f59e0b' : (item.isSeuComp ? '#fde68a' : 'transparent')}; border-radius: 8px; margin-bottom: 4px;">
                                <i class="ph ${item.isSeu ? 'ph-lightning-slash' : (item.isSeuComp ? 'ph-dot' : 'ph-cpu')}" style="color: ${item.isSeu ? '#92400e' : '#94a3b8'}; font-size: 16px; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <input type="text" name="scope_desc" class="form-control" value="${item.desc}" style="background: #f1f5f9; cursor: default;${item.isSeu ? ' font-weight:700;color:#92400e;' : ''}" readonly>
                                </div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_empresa" ${item.minhaEmpresa ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    PTC
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_cli" ${item.cli ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #f59e0b;">
                                    Cliente
                                </label>
                                <span style="font-size: 10px; background: ${item.isSeu ? '#fef3c7' : '#e2e8f0'}; color: ${item.isSeu ? '#92400e' : '#64748b'}; padding: 2px 8px; border-radius: 10px; white-space: nowrap;">${item.equipTag || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${infraItems.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h5 style="font-size: 13px; color: #475569; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-toolbox" style="font-size: 16px;"></i> Itens da Infraestrutura
                        </h5>
                        ${infraItems.map(item => `
                            <div class="scope-row" data-auto="1" data-is-infra="1"
                                 style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; margin-bottom: 4px;">
                                <i class="ph ph-toolbox" style="color: #16a34a; font-size: 16px; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <input type="text" name="scope_desc" class="form-control" value="${item.desc}" style="background: #f0fdf4; cursor: default; font-weight:700;color:#166534;" readonly>
                                </div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_empresa" ${item.minhaEmpresa ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    PTC
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_cli" ${item.cli ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #f59e0b;">
                                    Cliente
                                </label>
                                <span style="font-size: 10px; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; white-space: nowrap;">INFRA</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div>
                    <h5 style="font-size: 13px; color: #475569; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-pencil-simple" style="font-size: 16px;"></i> Itens Adicionais
                    </h5>
                    ${manualItems.length === 0 && autoItems.length === 0 ? `
                        <div style="padding: 40px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                            <i class="ph ph-list-dashes" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
                            <br>Nenhum item de escopo cadastrado.
                            <br>Clique em "Sincronizar Proposta" ou "Adicionar Item".
                        </div>
                    ` : manualItems.length === 0 ? `
                        <div style="padding: 20px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 8px;">
                            Clique em "Adicionar Item" para incluir itens manuais.
                        </div>
                    ` : `
                        ${manualItems.map((item, i) => `
                            <div class="scope-row" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
                                <i class="ph ph-list-bullets" style="color: #94a3b8; font-size: 16px; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <input type="text" name="scope_desc" class="form-control" value="${item.desc}" placeholder="Descreva o item do escopo...">
                                </div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_empresa" ${item.minhaEmpresa ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    PTC
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_cli" ${item.cli ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #f59e0b;">
                                    Cliente
                                </label>
                                <button type="button" class="btn-icon" style="color: #ef4444; flex-shrink: 0;" onclick="app.propostaTecnica.removeScopeItem(${i})" title="Remover item"><i class="ph ph-trash"></i></button>
                            </div>
                        `).join('')}
                    `}
                </div>

            </div>
        `;
    },

    renderTabEscopoAUTPRO(data) {
        if (!data.autproScope || data.autproScope.length === 0) {
            data.autproScope = AUTPRO_SCOPE_ITEMS.map(item => ({
                id: item.id,
                desc: item.desc,
                incluso: false
            }));
        }

        // Merge missing items into existing proposals
        AUTPRO_SCOPE_ITEMS.forEach(ref => {
            if (!data.autproScope.find(i => i.id === ref.id)) {
                data.autproScope.push({ id: ref.id, desc: ref.desc, incluso: false });
            }
        });

        const items = data.autproScope;
        const allCount = items.length;
        const checkedCount = items.filter(it => it.incluso).length;

        const premissasItems = items.filter(it => PREMISSAS_IDS.includes(it.id));
        const premissasChecked = premissasItems.filter(it => it.incluso).length;

        const docItems = items.filter(it => DOCUMENTACAO_IDS.includes(it.id));
        const docChecked = docItems.filter(it => it.incluso).length;

        const otherItems = items.filter(it => !PREMISSAS_IDS.includes(it.id) && !DOCUMENTACAO_IDS.includes(it.id));

        function renderSubItems(parentId) {
            const subIds = DOCUMENTACAO_SUB_MASTERS[parentId] || [];
            return subIds.map(subId => {
                const sub = items.find(i => i.id === subId);
                if (!sub) return '';
                return `
                    <label class="autpro-row" data-autpro-id="${sub.id}"
                           style="display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 44px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.15s; margin-left: 0px;">
                        <input type="checkbox" ${sub.incluso ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6; flex-shrink: 0;">
                        <span style="font-size: 13px; color: #334155; line-height: 1.3;">${DOCUMENTACAO_LABELS[sub.id] || sub.desc}</span>
                    </label>
                `;
            }).join('');
        }

        function renderSubMaster(sectionId) {
            const label = DOCUMENTACAO_LABELS[sectionId] || '';
            const subIds = DOCUMENTACAO_SUB_MASTERS[sectionId] || [];
            const subChecked = subIds.filter(id => items.find(i => i.id === id)?.incluso).length;
            return `
                <div style="margin-bottom: 4px;">
                    <label class="autpro-row documentacao-sub-master" data-autpro-id="${sectionId}"
                           style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <input type="checkbox" ${items.find(i => i.id === sectionId)?.incluso ? 'checked' : ''}
                               onchange="app.propostaTecnica.toggleDocumentacaoSub('${sectionId}', this.checked)"
                               style="width: 16px; height: 16px; accent-color: #3b82f6; flex-shrink: 0;">
                        <span style="font-size: 13px; color: #1e293b; flex: 1;">${label}</span>
                        <span style="font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 10px;">${subChecked}/${subIds.length}</span>
                    </label>
                    ${renderSubItems(sectionId)}
                </div>
            `;
        }

        function renderSimpleDocItem(sectionId) {
            const item = items.find(i => i.id === sectionId);
            if (!item) return '';
            return `
                <label class="autpro-row" data-autpro-id="${item.id}"
                       style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.15s;">
                    <input type="checkbox" ${item.incluso ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6; flex-shrink: 0;">
                    <span style="font-size: 13px; color: #334155; line-height: 1.3;">${DOCUMENTACAO_LABELS[item.id] || item.desc}</span>
                </label>
            `;
        }

        return `
            <div style="padding: 40px; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.3s ease;">

                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Escopo AUTPRO</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                            Itens do escopo de fornecimento AUTPRO &mdash; marque os itens aplicáveis
                            <span style="margin-left: 12px; background: #eff6ff; color: #1e3a8a; padding: 2px 10px; border-radius: 10px; font-weight: 600;">
                                ${checkedCount}/${allCount} selecionados
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Seção 5: PREMISSAS DA PROPOSTA -->
                <div class="premissas-container" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #fafafa;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                        <h5 style="margin: 0; font-size: 14px; color: #1e3a8a; font-weight: 700; flex: 1;">5. PREMISSAS DA PROPOSTA</h5>
                        <span style="font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 10px; border-radius: 10px;">${premissasChecked}/${premissasItems.length}</span>
                        <label style="font-size: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer; color: #475569;">
                            <input type="checkbox" ${premissasChecked === premissasItems.length ? 'checked' : ''}
                                   onchange="app.propostaTecnica.togglePremissas(this.checked)" style="width: 14px; height: 14px;">
                            Marcar/Desmarcar Todos
                        </label>
                    </div>
                    ${premissasItems.map(item => `
                        <label class="autpro-row" data-autpro-id="${item.id}"
                               style="display: flex; align-items: center; gap: 10px; padding: 6px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; transition: all 0.15s; margin-bottom: 3px;">
                            <input type="checkbox" ${item.incluso ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6; flex-shrink: 0;">
                            <span style="font-size: 13px; color: #334155; line-height: 1.3;">${PREMISSAS_LABELS[item.id] || item.desc}</span>
                        </label>
                    `).join('')}
                </div>

                <!-- Seção 7: DOCUMENTAÇÃO DE ENGENHARIA -->
                <div class="documentacao-container" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #fafafa;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                        <h5 style="margin: 0; font-size: 14px; color: #1e3a8a; font-weight: 700; flex: 1;">7. DOCUMENTAÇÃO DE ENGENHARIA</h5>
                        <span style="font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 10px; border-radius: 10px;">${docChecked}/${docItems.filter(i => i.id !== 'autpro_71').length}</span>
                        <label style="font-size: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer; color: #475569;">
                            <input type="checkbox" ${docItems.filter(i => i.id !== 'autpro_71').every(i => i.incluso) ? 'checked' : ''}
                                   onchange="app.propostaTecnica.toggleDocumentacao(this.checked)" style="width: 14px; height: 14px;">
                            Marcar/Desmarcar Todos
                        </label>
                    </div>
                    ${DOCUMENTACAO_ORDER.map(id => {
                        if (DOCUMENTACAO_SUB_MASTERS[id]) {
                            return renderSubMaster(id);
                        }
                        return renderSimpleDocItem(id);
                    }).join('')}
                </div>

                <!-- Outros Itens -->
                <div style="margin-bottom: 24px;">
                    <h5 style="margin: 0 0 12px 0; font-size: 14px; color: #475569; font-weight: 700;">Outros Itens</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 4px;">
                        ${otherItems.map(item => `
                            <label class="autpro-row" data-autpro-id="${item.id}"
                                   style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.15s;">
                                <input type="checkbox" ${item.incluso ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6; flex-shrink: 0;">
                                <span style="font-size: 13px; color: #334155; line-height: 1.3;">${item.desc}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

            </div>
        `;
    },

    togglePremissas(checked) {
        const data = store.getState().activeTechnicalProposal;
        if (!data || !data.autproScope) return;
        data.autproScope.forEach(item => {
            if (PREMISSAS_IDS.includes(item.id)) {
                item.incluso = !!checked;
            }
        });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    toggleDocumentacao(checked) {
        const data = store.getState().activeTechnicalProposal;
        if (!data || !data.autproScope) return;
        data.autproScope.forEach(item => {
            if (DOCUMENTACAO_IDS.includes(item.id)) {
                item.incluso = !!checked;
            }
        });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    toggleDocumentacaoSub(masterId, checked) {
        const data = store.getState().activeTechnicalProposal;
        if (!data || !data.autproScope) return;
        const subIds = DOCUMENTACAO_SUB_MASTERS[masterId] || [];
        data.autproScope.forEach(item => {
            if (subIds.includes(item.id)) {
                item.incluso = !!checked;
            }
        });
        // Also toggle the master itself
        const master = data.autproScope.find(i => i.id === masterId);
        if (master) master.incluso = !!checked;
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    syncScopeFromProposal() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;

        const manualItems = (data.scopeItems || []).filter(it => !it.auto);

        // Coletar IDs de componentes de SEU
        const seuComponentIds = new Set();
        (data.equipments || []).filter(e => e.type === 'SEU').forEach(seu => {
            (seu.seu_components || []).forEach(id => seuComponentIds.add(String(id)));
        });

        const autoItems = [];

        // Itens de equipamentos
        (data.equipments || []).forEach(eq => {
            if (eq.type === 'SEU') {
                // Item container da SEU
                autoItems.push({
                    desc: `Subestação ${eq.tag} — ${(eq.seu_components || []).length} equipamento(s)`,
                    minhaEmpresa: false,
                    cli: false,
                    auto: true,
                    equipTag: eq.tag,
                    isSeu: true,
                    isSeuComp: false,
                    parentSeu: ''
                });
                // Itens dos componentes
                (eq.seu_components || []).forEach(compId => {
                    const comp = data.equipments.find(e => String(e.id) === String(compId));
                    if (comp) {
                        autoItems.push({
                            desc: `Fornecimento de ${comp.tag} - ${comp.type}`,
                            minhaEmpresa: false,
                            cli: false,
                            auto: true,
                            equipTag: comp.tag,
                            isSeu: false,
                            isSeuComp: true,
                            parentSeu: eq.tag
                        });
                    }
                });
            } else if (!seuComponentIds.has(String(eq.id))) {
                // Equipamento avulso (não pertence a nenhuma SEU)
                autoItems.push({
                    desc: `Fornecimento de - ${eq.tag}`,
                    minhaEmpresa: false,
                    cli: false,
                    auto: true,
                    equipTag: eq.tag,
                    isSeu: false,
                    isSeuComp: false,
                    parentSeu: ''
                });
            }
        });

        // Itens de infraestrutura (resumo por disciplina)
        const disciplinas = data.infraestrutura?.disciplinas || [];
        disciplinas.forEach(disc => {
            const itemCount = (disc.itens || []).length;
            if (itemCount > 0) {
                autoItems.push({
                    desc: `${disc.nome} — ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`,
                    minhaEmpresa: true,
                    cli: false,
                    auto: true,
                    equipTag: '',
                    isInfra: true,
                    infraDisciplina: disc.id
                });
            }
        });

        data.scopeItems = [...autoItems, ...manualItems];
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);

        const eqCount = autoItems.filter(it => !it.isInfra).length;
        const infraCount = autoItems.filter(it => it.isInfra).length;
        const parts = [];
        if (eqCount > 0) parts.push(`${eqCount} ${eqCount === 1 ? 'item' : 'itens'} de equipamento`);
        if (infraCount > 0) parts.push(`${infraCount} ${infraCount === 1 ? 'disciplina' : 'disciplinas'} de infraestrutura`);
        app.toast(`Escopo sincronizado: ${parts.join(', ') || 'nenhum item'}.`, 'success');
    },

    addScopeItem() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        if (!data.scopeItems) data.scopeItems = [];

        data.scopeItems.push({
            desc: '',
            minhaEmpresa: false,
            cli: false,
            auto: false,
            equipTag: ''
        });

        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeScopeItem(index) {
        const data = store.getState().activeTechnicalProposal;
        if (!data || !data.scopeItems) return;

        const manualItems = data.scopeItems.filter(it => !it.auto);
        if (index < 0 || index >= manualItems.length) return;

        const removed = manualItems[index];
        const allItems = data.scopeItems;
        const idx = allItems.indexOf(removed);
        if (idx !== -1) {
            allItems.splice(idx, 1);
        }

        data.scopeItems = allItems;
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },



};
