import { store } from './state.js';

const ImportacaoETModule = {
    _extractedData: null,
    _activeTab: 'geral',
    _applySelections: {},

    init() {
        window.app.importacaoET = {
            open: this.open.bind(this),
            close: this.close.bind(this),
            switchTab: this.switchTab.bind(this),
            applyAll: this.applyAll.bind(this),
            applySelected: this.applySelected.bind(this),
            _handleFileSelect: this._handleFileSelect.bind(this),
            _handleDrop: this._handleDrop.bind(this),
            _applySelections: this._applySelections
        };
    },

    open() {
        this._extractedData = null;
        this._activeTab = 'geral';
        this._applySelections = { geral: true, equipments: true, loads: true, normas: true, vendorList: true, infraestrutura: true };
        this._renderUpload();
    },

    close() {
        const overlay = document.getElementById('import-et-overlay');
        if (overlay) overlay.remove();
    },

    _renderUpload() {
        const existing = document.getElementById('import-et-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'import-et-overlay';
        overlay.className = 'import-et-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = (e) => { if (e.target === overlay) this.close(); };

        overlay.innerHTML = `
            <div class="import-et-modal" style="background:white;border-radius:12px;width:540px;max-width:90vw;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <div>
                        <h3 style="margin:0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                            <i class="ph ph-robot"></i> Importar de Documento (IA)
                        </h3>
                        <div style="font-size:11px;color:#64748b;margin-top:2px;">PDF, Word ou Excel — extração automática</div>
                    </div>
                    <button type="button" class="btn btn-ghost" onclick="app.importacaoET.close()" style="padding:4px 8px;"><i class="ph ph-x"></i></button>
                </div>

                <div id="import-et-body" style="flex:1;overflow-y:auto;padding:24px;">
                    <div id="import-et-upload-area" style="border:2px dashed #cbd5e1;border-radius:12px;padding:40px 20px;text-align:center;cursor:pointer;transition:border-color 0.2s;background:#f8fafc;"
                         onclick="document.getElementById('import-et-file-input').click()"
                         ondragover="this.style.borderColor='var(--color-accent)';this.style.background='#f0fdf4';event.preventDefault();"
                         ondragleave="this.style.borderColor='#cbd5e1';this.style.background='#f8fafc';"
                         ondrop="event.preventDefault();app.importacaoET._handleDrop(event);">
                        <i class="ph ph-cloud-arrow-up" style="font-size:48px;color:var(--color-accent);"></i>
                        <p style="margin:12px 0 4px;font-weight:600;color:#1e293b;">Clique ou arraste o arquivo</p>
                        <p style="font-size:12px;color:#94a3b8;">PDF, DOCX, XLSX — máx 10MB</p>
                        <input type="file" id="import-et-file-input" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv" style="display:none;"
                               onchange="app.importacaoET._handleFileSelect(event)">
                    </div>

                    <div id="import-et-details" style="margin-top:16px;font-size:11px;color:#94a3b8;text-align:center;">
                        ${this._getProviderBadge()}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) this._processFile(file);
    },

    _handleDrop(event) {
        const file = event.dataTransfer.files[0];
        if (file) this._processFile(file);
    },

    async _processFile(file) {
        if (file.size > 10 * 1024 * 1024) {
            window.app.toast('Arquivo muito grande. Máximo 10MB.', 'error');
            return;
        }

        const body = document.getElementById('import-et-body');
        if (!body) return;

        body.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
                <i class="ph ph-spinner ph-spin" style="font-size:48px;color:#16a34a;"></i>
                <p style="margin-top:16px;font-weight:600;color:#1e293b;">Analisando ${file.name}...</p>
                <div style="margin-top:12px;font-size:13px;color:#64748b;line-height:1.6;">
                    <span id="import-et-step">Extraindo texto do documento...</span>
                </div>
                <div style="margin-top:12px;font-size:11px;color:#94a3b8;">
                    A primeira análise pode levar de 3 a 8 minutos enquanto o modelo de IA carrega.
                    <br>Análises seguintes serão mais rápidas (~1 min).
                </div>
            </div>
        `;

        try {
            const stepEl = document.getElementById('import-et-step');
            stepEl.textContent = 'Extraindo texto do documento...';
            const base64 = await this._readFileAsBase64(file);

            stepEl.textContent = 'Consultando IA para extrair dados técnicos...';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 660000);
            const res = await fetch('http://localhost:8082/api/import-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    content: base64,
                    mimeType: file.type
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const result = await res.json();

            if (!result.success) {
                body.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;">
                        <i class="ph ph-warning-circle" style="font-size:48px;color:#ef4444;"></i>
                        <p style="margin-top:16px;font-weight:600;color:#dc2626;">Erro na importação</p>
                        <p style="font-size:13px;color:#64748b;margin-top:8px;">${result.error || 'Erro desconhecido'}</p>
                        <button class="btn btn-secondary" style="margin-top:16px;" onclick="app.importacaoET.open()">Tentar novamente</button>
                    </div>
                `;
                return;
            }

            if (result.data._error) {
                const isConnectionError = result.data._error.includes('indisponível') || result.data._error.includes('ECONNREFUSED') || result.data._error.includes('não configurada');
                body.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;">
                        <i class="ph ph-${isConnectionError ? 'plugs' : 'clock'}" style="font-size:48px;color:#${isConnectionError ? 'ef4444' : 'f59e0b'};"></i>
                        <p style="margin-top:16px;font-weight:600;color:#${isConnectionError ? 'dc2626' : 'd97706'};">${isConnectionError ? 'IA indisponível' : 'Erro na IA'}</p>
                        <p style="font-size:13px;color:#64748b;margin-top:8px;">${result.data._error}</p>
                        <div style="margin-top:12px;font-size:11px;color:#94a3b8;">
                            ${isConnectionError ? 'Verifique as configurações de IA em <b>Ajustes</b> ou tente novamente mais tarde.' : 'Dica: A segunda tentativa costuma ser mais rápida pois o modelo já estará carregado em memória.'}
                        </div>
                        <button class="btn btn-secondary" style="margin-top:16px;" onclick="app.importacaoET.open()">Tentar novamente</button>
                    </div>
                `;
                return;
            }

            this._extractedData = result.data;
            this._renderPreview();

        } catch (err) {
            console.error('[ImportacaoET] Error:', err);
            const isTimeout = err.name === 'AbortError';
            body.innerHTML = `
                <div style="text-align:center;padding:40px 20px;">
                    <i class="ph ph-${isTimeout ? 'clock' : 'plugs'}" style="font-size:48px;color:#${isTimeout ? 'f59e0b' : 'ef4444'};"></i>
                    <p style="margin-top:16px;font-weight:600;color:#${isTimeout ? 'd97706' : 'dc2626'};">${isTimeout ? 'Tempo esgotado' : 'Erro de conexão'}</p>
                    <p style="font-size:13px;color:#64748b;margin-top:8px;">${isTimeout ? 'A IA está demorando mais que 11 minutos para responder. Tente novamente — a segunda tentativa costuma ser mais rápida.' : 'Verifique se o servidor está rodando em localhost:8082 e se o provedor de IA está acessível.'}</p>
                    <p style="font-size:11px;color:#94a3b8;">${err.message}</p>
                    <button class="btn btn-secondary" style="margin-top:16px;" onclick="app.importacaoET.open()">Tentar novamente</button>
                </div>
            `;
        }
    },

    _readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    _renderPreview() {
        const data = this._extractedData;
        if (!data) return;

        const body = document.getElementById('import-et-body');
        if (!body) return;

        const geral = data.geral || {};
        const equipments = data.equipments || [];
        const loads = data.loads || [];
        const normas = data.normas || [];
        const vendorList = data.vendorList || [];
        const infra = data.infraestrutura || { disciplinas: [] };

        const tabBtn = (id, label, count) => `
            <button class="import-et-tab-btn ${this._activeTab === id ? 'active' : ''}"
                    onclick="app.importacaoET.switchTab('${id}')"
                    style="padding:10px 16px;border:none;background:transparent;font-weight:${this._activeTab===id?'700':'600'};font-size:12px;cursor:pointer;color:${this._activeTab===id?'var(--color-accent)':'#64748b'};border-bottom:2px solid ${this._activeTab===id?'var(--color-accent)':'transparent'};white-space:nowrap;">
                ${label} ${count ? `(${count})` : ''}
            </button>`;

        const checkbox = (section) => `
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;white-space:nowrap;">
                <input type="checkbox" ${this._applySelections[section] ? 'checked' : ''}
                       onchange="app.importacaoET._applySelections['${section}'] = this.checked">
                Aplicar esta seção
            </label>`;

        body.innerHTML = `
            <div style="display:flex;flex-direction:column;height:100%;">
                <div style="display:flex;border-bottom:1px solid #e2e8f0;overflow-x:auto;flex-shrink:0;">
                    ${tabBtn('geral', 'Dados Gerais')}
                    ${tabBtn('equipments', 'Equipamentos', equipments.length)}
                    ${tabBtn('loads', 'Cargas', loads.length)}
                    ${tabBtn('normas', 'Normas', normas.length)}
                    ${tabBtn('vendorList', 'Vendor List', vendorList.length)}
                    ${tabBtn('infraestrutura', 'Infraestrutura', infra.disciplinas.reduce((s, d) => s + (d.itens?.length || 0), 0))}
                </div>

                <div id="import-et-tab-content" style="flex:1;overflow-y:auto;padding:16px 0;">
                    ${this._renderTabContent(data)}
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;border-top:1px solid #e2e8f0;flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        ${checkbox(this._activeTab)}
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-cancel" onclick="app.importacaoET.close()" style="font-size:12px;">Cancelar</button>
                        <button class="btn btn-outline" onclick="app.importacaoET.applySelected()" style="font-size:12px;">Aplicar Selecionados</button>
                        <button class="btn btn-primary" onclick="app.importacaoET.applyAll()" style="font-size:12px;">Aplicar Tudo</button>
                    </div>
                </div>
            </div>
        `;
    },

    switchTab(tab) {
        this._activeTab = tab;
        this._renderPreview();
    },

    _renderTabContent(data) {
        const tab = this._activeTab;

        if (tab === 'geral') {
            const g = data.geral || {};
            const fields = [
                ['Cliente', g.cliente],
                ['Projeto', g.projeto],
                ['Localização', g.localizacao],
                ['Objeto', g.objeto],
                ['Data', g.data]
            ];
            const anyData = fields.some(([_, v]) => v);
            if (!anyData) return '<div style="text-align:center;padding:30px;color:#94a3b8;">Nenhum dado geral extraído.</div>';
            return `
                <table style="width:100%;font-size:13px;border-collapse:collapse;">
                    ${fields.filter(([_, v]) => v).map(([label, val]) => `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:8px 0;color:#64748b;width:140px;">${label}</td>
                            <td style="padding:8px 0;font-weight:600;">${this._esc(val)}</td>
                        </tr>
                    `).join('')}
                </table>`;
        }

        if (tab === 'equipments') {
            const eqs = data.equipments || [];
            if (eqs.length === 0) return '<div style="text-align:center;padding:30px;color:#94a3b8;">Nenhum equipamento extraído.</div>';
            return eqs.map((eq, i) => {
                const fields = [
                    ['TAG', eq.tag], ['Tipo', eq.type], ['Tensão', eq.tensao ? `${eq.tensao}V` : ''],
                    ['ICC', eq.icc ? `${eq.icc}kA` : ''], ['IP', eq.ip], ['Corrente Nom.', eq.correnteNominal ? `${eq.correnteNominal}A` : ''],
                    ['Frequência', eq.frequencia ? `${eq.frequencia}Hz` : ''], ['Protocolo', eq.protocolo],
                    ['Cor', eq.cor], ['Forma', eq.forma]
                ].filter(([_, v]) => v);
                if (fields.length === 0) return '';
                return `
                    <div style="margin-bottom:16px;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
                        <div style="font-weight:700;color:#1e3a8a;margin-bottom:8px;font-size:14px;">Equipamento ${i+1}</div>
                        <table style="width:100%;font-size:13px;border-collapse:collapse;">
                            ${fields.map(([label, val]) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:4px 0;color:#64748b;width:140px;">${label}</td>
                                    <td style="padding:4px 0;font-weight:600;">${this._esc(val)}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>`;
            }).join('');
        }

        if (tab === 'loads') {
            const loads = data.loads || [];
            if (loads.length === 0) return '<div style="text-align:center;padding:30px;color:#94a3b8;">Nenhuma carga extraída.</div>';
            return `
                <div style="overflow-x:auto;">
                    <table style="width:100%;font-size:12px;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                                <th style="padding:8px;text-align:left;">#</th>
                                <th style="padding:8px;text-align:left;">Descrição</th>
                                <th style="padding:8px;text-align:center;">CV</th>
                                <th style="padding:8px;text-align:center;">Partida</th>
                                <th style="padding:8px;text-align:left;">Painel</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${loads.map((ld, i) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:6px 8px;color:#94a3b8;">${i+1}</td>
                                    <td style="padding:6px 8px;font-weight:600;">${this._esc(ld.descricao || ld.tag || '')}</td>
                                    <td style="padding:6px 8px;text-align:center;">${ld.potenciaCV || ''}</td>
                                    <td style="padding:6px 8px;text-align:center;font-weight:600;color:#16a34a;">${ld.tipoPartida || ''}</td>
                                    <td style="padding:6px 8px;">${this._esc(ld.painel || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        if (tab === 'normas') {
            const n = data.normas || [];
            if (n.length === 0) return '<div style="text-align:center;padding:30px;color:#94a3b8;">Nenhuma norma extraída.</div>';
            return `
                <ul style="margin:0;padding:0 0 0 20px;font-size:13px;">
                    ${n.map(norma => `<li style="padding:4px 0;font-weight:600;">${this._esc(norma)}</li>`).join('')}
                </ul>`;
        }

        if (tab === 'vendorList') {
            const vl = data.vendorList || [];
            if (vl.length === 0) return '<div style="text-align:center;padding:30px;color:#94a3b8;">Nenhum vendor extraído.</div>';
            return `
                <div style="overflow-x:auto;">
                    <table style="width:100%;font-size:12px;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                                <th style="padding:8px;text-align:left;width:30px;">#</th>
                                <th style="padding:8px;text-align:left;">Componente</th>
                                <th style="padding:8px;text-align:left;">Fabricante</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vl.map((v, i) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:6px 8px;color:#94a3b8;">${i+1}</td>
                                    <td style="padding:6px 8px;font-weight:600;">${this._esc(v.componente || '')}</td>
                                    <td style="padding:6px 8px;">${this._esc(v.fabricante || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        if (tab === 'infraestrutura') {
            const disciplinas = data.infraestrutura?.disciplinas || [];
            if (disciplinas.every(d => !d.itens?.length)) {
                return '<div style="text-align:center;padding:30px;color:#94a3b8;">Nenhum item de infraestrutura extra\u00eddo.</div>';
            }
            const disciplinaNome = { civil: 'Obra Civil', eletrica: 'Infraestrutura El\u00e9trica', spda: 'SPDA / Aterramento', mecanica: 'Infraestrutura Mec\u00e2nica', cabeamento: 'Cabeamento Estruturado', servicos: 'Servi\u00e7os' };
            return disciplinas.filter(d => d.itens?.length).map(disc => `
                <div style="margin-bottom:16px;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
                    <div style="font-weight:700;color:#1e3a8a;margin-bottom:8px;font-size:14px;">
                        ${this._esc(disciplinaNome[disc.id] || disc.id)} (${disc.itens.length} item(ns))
                    </div>
                    <table style="width:100%;font-size:12px;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                                <th style="padding:6px 8px;text-align:left;">C\u00f3digo</th>
                                <th style="padding:6px 8px;text-align:left;">Descri\u00e7\u00e3o</th>
                                <th style="padding:6px 8px;text-align:center;">Qtd</th>
                                <th style="padding:6px 8px;text-align:left;">UN</th>
                                <th style="padding:6px 8px;text-align:right;">Custo Unit.</th>
                                <th style="padding:6px 8px;text-align:right;">H Inst</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${disc.itens.map(item => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:6px 8px;">${this._esc(item.codigo || '-')}</td>
                                    <td style="padding:6px 8px;font-weight:600;">${this._esc(item.descricao || '')}</td>
                                    <td style="padding:6px 8px;text-align:center;">${item.qtd || 0}</td>
                                    <td style="padding:6px 8px;">${this._esc(item.un || 'un')}</td>
                                    <td style="padding:6px 8px;text-align:right;">R$ ${(item.custoUnitario || 0).toFixed(2)}</td>
                                    <td style="padding:6px 8px;text-align:right;">${item.horasInstalacao || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('');
        }

        return '';
    },

    applyAll() {
        if (!this._extractedData) return;
        this._applyDataToProposal(true);
    },

    applySelected() {
        if (!this._extractedData) return;
        this._applyDataToProposal(false);
    },

    _applyDataToProposal(applyAll) {
        const data = this._extractedData;
        const proposal = store.getState().activeTechnicalProposal;
        if (!proposal) {
            window.app.toast('Abra uma Proposta Técnica antes de importar.', 'warning');
            this.close();
            return;
        }

        let applied = [];
        const aiChanges = { geral: [], equipments: {}, timestamp: new Date().toISOString() };

        const s = (key) => applyAll || this._applySelections[key];

        if (s('geral') && data.geral) {
            const g = data.geral;
            if (g.cliente) { proposal.cliente = g.cliente; aiChanges.geral.push('cliente'); }
            if (g.projeto) { proposal.projeto = g.projeto; aiChanges.geral.push('projeto'); }
            if (g.localizacao) {
                proposal.localizacao = g.localizacao;
                aiChanges.geral.push('localizacao');
                const sep = g.localizacao.includes('/') ? '/' : '-';
                const parts = g.localizacao.split(sep);
                if (parts.length >= 2) {
                    proposal.cidade = parts.slice(0, -1).join(sep).trim();
                    proposal.uf = parts[parts.length - 1].trim().toUpperCase();
                    aiChanges.geral.push('cidade');
                    aiChanges.geral.push('uf');
                }
            }
            if (g.objeto) { proposal.objeto = g.objeto; aiChanges.geral.push('objeto'); }
            if (g.data) { proposal.data_emissao = g.data; aiChanges.geral.push('data_emissao'); }
            applied.push('Dados Gerais');
        }

        if (s('equipments') && data.equipments && data.equipments.length > 0) {
            const eq = proposal.equipments?.[this.activeEquipmentIndex || 0];
            if (eq) {
                const aiTechFields = new Set();
                const src = data.equipments[0];
                if (src.tag) { eq.tag = src.tag; aiTechFields.add('tag'); }
                if (src.type) { eq.type = this._mapEquipmentType(src.type); aiTechFields.add('type'); }
                if (src.tensao) { eq.technical.tensao_operacao = this._normalizeField(src.tensao, ['690V', '480V', '440V', '380V', '220V']); aiTechFields.add('tensao_operacao'); }
                if (src.icc) { eq.technical.icc = String(src.icc).replace('.', ',').replace(/[kKaA]/g, '') + 'kA'; aiTechFields.add('icc'); }
                if (src.ip) { eq.technical.ip = 'IP-' + String(src.ip).replace(/[iIpP-]/g, ''); aiTechFields.add('ip'); }
                if (src.correnteNominal) { eq.technical.corrente_nominal = String(src.correnteNominal).replace('.', ',') + 'A'; aiTechFields.add('corrente_nominal'); }
                if (src.frequencia) { eq.technical.frequencia = String(src.frequencia).replace(/[hHzZ]/g, '') + 'Hz'; aiTechFields.add('frequencia'); }
                if (src.protocolo) {
                    const p = this._norm(src.protocolo);
                    const protocoloMap = {
                        'ethernetip': 'Ethernet IP',
                        'ethernet/ip': 'Ethernet IP',
                        'profinet': 'Profinet',
                        'devicenet': 'DeviceNet',
                        'profibusdp': 'Profibus DP',
                        'modbustcp': 'Modbus TCP',
                        'modbusrtu': 'Modbus RTU',
                        'canopen': 'CANopen',
                    };
                    eq.technical.protocolo = protocoloMap[p] || src.protocolo;
                    aiTechFields.add('protocolo');
                }
                if (src.cor) {
                    const m = String(src.cor).match(/(ral\s*\d+)/i);
                    eq.technical.cor = m ? 'RAL ' + m[1].replace(/\D/g, '') : src.cor;
                    aiTechFields.add('cor_externa');
                }
                if (src.forma) { eq.technical.segregacao = this._normalizeField(src.forma, ['Forma 1', 'Forma 2a', 'Forma 2b', 'Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b']); aiTechFields.add('segregacao'); }
                if (src.montagem) { eq.technical.montagem = this._normalizeField(src.montagem, ['Em Linha', 'Back to Back']); aiTechFields.add('montagem'); }
                const fieldMappings = [
                    ['instalacao', 'instalacao', ['Abrigada', 'Tempo']],
                    ['camadaPintura', 'camada_pintura', ['80 um', '90 um', '100 um']],
                    ['placaMontagem', 'placa_montagem', ['RAL 2003', 'RAL 7032', 'Galvanizada']],
                    ['entradaCabos', 'entrada_cabos', ['Inferior', 'Superior', 'Lateral']],
                    ['saidaCabos', 'saida_cabos', ['Inferior', 'Superior', 'Lateral']],
                    ['acessoFrontal', 'acesso_frontal', ['Fecho Borboleta', 'Fecho Yale', 'Fecho Cremona']],
                    ['acessoTraseiro', 'acesso_traseiro', ['Tampa Aparafusada', 'Porta Traseira']],
                    ['acessoManutencao', 'acesso_manutencao', ['Frontal', 'Traseiro', 'Frontal e Traseiro']],
                    ['caboComunicacao', 'cabo_comunicacao', ['Patch Cord Profinet Cat5', 'Cabo pra DeviceNet', 'Cabo Profibus DP 1px22 Awg Lilas', 'Modbus TCP 1px22 Awg', 'Modbus RTU 1px22 Awg', 'Cabo Canopen Com Conector Rj45']],
                    ['arcoInterno', 'arco_interno', ['Sim', 'Não']],
                    ['iluminacao', 'iluminacao', ['Sim', 'Não']],
                    ['tomada', 'tomada', ['2P+T (10A)', '2P+T (20A)', 'Não']],
                    ['termostato', 'termostato', ['Sim', 'Não']],
                    ['ventilacao', 'ventilacao', ['Sim', 'Não']],
                    ['barramentoTratamento', 'barramento_tratamento', ['Cobre Nú', 'Totalmente Estanhado', 'Prateado nas Conexões', 'Pintado']],
                    ['termoretratil', 'termoretratil', ['Sim', 'Não']],
                    ['comandoFonte', 'comando_fonte', ['Interna', 'Externa']],
                    ['auxiliar', 'auxiliar', ['220Vca', '110Vca', '125Vcc', '24Vcc']],
                    ['auxiliarFonte', 'auxiliar_fonte', ['Interna', 'Externa']],
                ];
                fieldMappings.forEach(([srcKey, destKey, options]) => {
                    if (src[srcKey]) { eq.technical[destKey] = this._normalizeField(src[srcKey], options); aiTechFields.add(destKey); }
                });
                aiChanges.equipments[this.activeEquipmentIndex || 0] = aiTechFields;
                applied.push(`${data.equipments.length} equipamento(s)`);
            }
        }

        if (s('loads') && data.loads && data.loads.length > 0) {
            const eq = proposal.equipments?.[this.activeEquipmentIndex || 0];
            if (eq) {
                if (!eq.loads) eq.loads = [];
                const tipoPartidaMap = {
                    'if': 'IF', 'inversor': 'IF', 'inversordefrequencia': 'IF',
                    'ss': 'SS', 'softstarter': 'SS', 'softstart': 'SS',
                    'pd': 'PD', 'direta': 'PD', 'partidadireta': 'PD',
                    'pdr': 'PDR', 'partidadiretareversora': 'PDR',
                    'et': 'ET', 'estrelatriangulo': 'ET',
                    'al': 'AL', 'alimentador': 'AL',
                    'eg': 'EG', 'entradageral': 'EG',
                    'me': 'ME', 'medicao': 'ME',
                    'cs': 'CS', 'comando': 'CS', 'comandoesinalizacao': 'CS',
                    'sa': 'SA', 'servicosauxiliares': 'SA',
                    'bc': 'BC', 'bancodecapacitores': 'BC',
                    'pnmt': 'PNMT', 'cubiculomt': 'PNMT',
                };
                data.loads.forEach((ld, i) => {
                    const tipoNorm = this._norm(ld.tipoPartida || '');
                    eq.loads.push({
                        tag: (ld.tag && !/^M\d+$/.test(ld.tag)) ? ld.tag : `M${eq.loads.length + i + 1}`,
                        desc: ld.descricao || ld.tag || '',
                        power: String(ld.potenciaCV || ''),
                        tensao: ld.tensao || '380',
                        regime: 'S1',
                        type: tipoPartidaMap[tipoNorm] || ld.tipoPartida || ''
                    });
                });
                const aiIdxL = this.activeEquipmentIndex || 0;
                if (!aiChanges.equipments[aiIdxL]) aiChanges.equipments[aiIdxL] = new Set();
                aiChanges.equipments[aiIdxL].add('__loads');
                applied.push(`${data.loads.length} carga(s)`);
            }
        }

        if (s('normas') && data.normas && data.normas.length > 0) {
            const eq = proposal.equipments?.[this.activeEquipmentIndex || 0];
            if (eq) {
                const NORM_MAP = {
                    'nbr5410': 'nbr5410',
                    'nr10': 'nr10',
                    'nr12': 'nr12',
                    'nbr_iec_60529': 'nbr_iec_60529',
                    'nbr_iec_62208': 'nbr_iec_62208',
                    'nbr_iec_61439': 'nbr_iec_61439',
                };

                const clean = s => this._norm(s);

                const normByClean = Object.fromEntries(
                    Object.keys(NORM_MAP).map(k => [clean(k), NORM_MAP[k]])
                );

                const normByNumber = {};
                Object.keys(NORM_MAP).forEach(k => {
                    const m = k.match(/\d+/);
                    if (m) normByNumber[m[0]] = NORM_MAP[k];
                });

                const mapped = new Set(eq.norms || []);
                if (!eq.customNorms) eq.customNorms = [];

                data.normas.forEach((n, idx) => {
                    const c = clean(n);
                    if (!c) return;

                    let found = null;

                    if (normByClean[c]) found = normByClean[c];

                    if (!found) {
                        const k = Object.keys(normByClean).find(k => c.includes(k));
                        if (k) found = normByClean[k];
                    }

                    if (!found) {
                        const k = Object.keys(normByClean).find(k => k.includes(c));
                        if (k) found = normByClean[k];
                    }

                    if (!found) {
                        const num = n.match(/\d+/)?.[0];
                        if (num && normByNumber[num]) found = normByNumber[num];
                    }

                    if (found) {
                        mapped.add(found);
                    } else {
                        const id = 'custom_norm_ia_' + Date.now() + '_' + idx;
                        eq.customNorms.push({ id, label: n.trim(), description: 'Extraído via IA' });
                        mapped.add(id);
                    }
                });

                eq.norms = [...mapped];
                const aiIdxN = this.activeEquipmentIndex || 0;
                if (!aiChanges.equipments[aiIdxN]) aiChanges.equipments[aiIdxN] = new Set();
                aiChanges.equipments[aiIdxN].add('__norms');
                applied.push(`${mapped.size} norma(s)`);
            }
        }

        if (s('vendorList') && data.vendorList && data.vendorList.length > 0) {
            if (!proposal.vendorList) proposal.vendorList = [];
            console.log('[_applyData] AI vendorList:', JSON.stringify(data.vendorList));
            console.log('[_applyData] Existing proposal.vendorList:', JSON.stringify(proposal.vendorList));
            data.vendorList.forEach(v => {
                if (v.componente && v.fabricante) {
                    const p = this._parseFabricante(v.fabricante);
                    const exists = this._findVendorMatch(v.componente, proposal.vendorList);
                    if (exists) {
                        console.log(`[_applyData] UPDATING comp="${exists.comp}" brand ${exists.brand} -> ${p.brand}, opt=${p.opt}`);
                        exists.brand = p.brand;
                        exists.opt = p.opt;
                        exists.optEspecifique = p.optEspecifique;
                    } else {
                        console.log(`[_applyData] PUSHING new comp="${v.componente}" brand="${p.brand}"`);
                        proposal.vendorList.push({
                            comp: v.componente,
                            brand: p.brand,
                            opt: p.opt,
                            optEspecifique: p.optEspecifique
                        });
                    }
                }
            });
            aiChanges.vendorList = true;
            applied.push(`${data.vendorList.length} vendor(s)`);
        }

        if (s('infraestrutura') && data.infraestrutura?.disciplinas) {
            if (!proposal.infraestrutura) {
                proposal.infraestrutura = {
                    activeDisciplina: 'civil',
                    disciplinas: [
                        { id: 'civil', nome: 'Obra Civil', icone: 'ph-buildings', itens: [] },
                        { id: 'eletrica', nome: 'Infraestrutura El\u00e9trica', icone: 'ph-lightning', itens: [] },
                        { id: 'spda', nome: 'SPDA / Aterramento', icone: 'ph-lightning-slash', itens: [] },
                        { id: 'mecanica', nome: 'Infraestrutura Mec\u00e2nica', icone: 'ph-fan', itens: [] },
                        { id: 'cabeamento', nome: 'Cabeamento Estruturado', icone: 'ph-network', itens: [] },
                        { id: 'servicos', nome: 'Servi\u00e7os', icone: 'ph-wrench', itens: [] }
                    ]
                };
            }
            let totalInfra = 0;
            data.infraestrutura.disciplinas.forEach(discAI => {
                if (!discAI.itens?.length) return;
                const disc = proposal.infraestrutura.disciplinas.find(d => d.id === discAI.id);
                if (!disc) return;
                discAI.itens.forEach(item => {
                    if (item.descricao) {
                        disc.itens.push({
                            codigo: item.codigo || `INF-${String(disc.itens.length + 1).padStart(3, '0')}`,
                            descricao: item.descricao,
                            qtd: item.qtd || 1,
                            un: item.un || 'un',
                            custoUnitario: item.custoUnitario || 0,
                            horasInstalacao: item.horasInstalacao || 0,
                            dificuldade: 1.0,
                            icms: 0, ipi: 0, desconto: 0, markup: 0,
                            fornecedor: '', prazo: '', categoria: '',
                            materialId: ''
                        });
                        totalInfra++;
                    }
                });
            });
            if (totalInfra > 0) {
                applied.push(`${totalInfra} item(ns) de infraestrutura`);
            }
        }

        proposal._aiChanges = aiChanges;
        store.setState({ activeTechnicalProposal: proposal });

        // Export Excel with extracted data (fire and forget)
        this._exportExcel(data).catch(err => {
            console.error('[ImportacaoET] Excel export error:', err);
        });

        this.close();

        if (applied.length > 0) {
            window.app.toast(`Importado: ${applied.join(', ')}.`, 'success');
            if (window.propostaTecnicaModule) {
                window.propostaTecnicaModule.renderModal(proposal);
            }
        } else {
            window.app.toast('Nenhum dado selecionado para aplicar.', 'warning');
        }
    },

    async _exportExcel(data) {
        try {
            const res = await fetch('http://localhost:8082/api/export-ai-extraction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                console.error('[ImportacaoET] Export failed:', res.statusText);
                return;
            }

            const blob = await res.blob();
            const clientName = (data.geral?.cliente || 'documento').replace(/[^a-zA-Z0-9]/g, '_') || 'documento';
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Extracao_IA_${clientName}_${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[ImportacaoET] Excel export error:', err);
        }
    },

    _norm(s) {
        if (!s) return '';
        return String(s)
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    },

    _parseFabricante(str) {
        if (!str) return { brand: '', opt: '__PADRAO__', optEspecifique: '' };
        const parts = String(str).split(/\s*\/\s*/).filter(Boolean);
        const brand = parts[0] || '';
        if (parts.length <= 1) return { brand, opt: '__PADRAO__', optEspecifique: '' };
        const rest = parts.slice(1);
        const last = rest[rest.length - 1];
        if (this._norm(last) === 'similar') {
            const alt = rest.slice(0, -1);
            return { brand, opt: '__SIMILAR__', optEspecifique: alt.length > 0 ? alt.join(' / ') : '' };
        }
        return { brand, opt: '__OUTRO__', optEspecifique: parts.join(' / ') };
    },

    _normalizeField(val, options) {
        if (!val || !options) return val || '';
        const n = this._norm(val);
        const match = options.find(o => {
            const on = this._norm(o);
            return on.includes(n) || n.includes(on);
        });
        return match || val;
    },

    _findVendorMatch(aiComp, existingList) {
        const normAI = this._norm(aiComp);
        const exact = existingList.find(x => x.comp && this._norm(x.comp) === normAI);
        if (exact) return exact;
        const aiWords = aiComp.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
        if (aiWords.length === 0) return null;
        return existingList.find(x => {
            if (!x.comp) return false;
            const keyWords = x.comp.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
            return aiWords.every(w =>
                keyWords.some(kw => w.includes(kw) || kw.includes(w))
            );
        });
    },

    _mapEquipmentType(type) {
        const t = this._norm(type);
        if (t.includes('ccm')) return 'CCM-BT';
        if (t.includes('qgbt')) return 'QGBT';
        if (t.includes('cub') || t.includes('mt')) return 'CUB-MT';
        if (t.includes('eletrocentro')) return 'ELETROCENTRO';
        if (t.includes('trmt') || t.includes('transformador')) return 'TR-MT';
        if (t.includes('seu')) return 'SEU';
        if (t.includes('qta')) return 'QTA';
        if (t.includes('plc')) return 'PLC';
        if (t.includes('bc') || t.includes('capacitor')) return 'BC';
        return 'CCM-BT';
    },

    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    _getProviderBadge() {
        const ai = store.getState().aiSettings || {};
        const provider = ai.provider || 'ollama';

        if (provider === 'openai') {
            const model = ai.model || 'gpt-4o-mini';
            return `<span style="color:#10b981;">Powered by OpenAI</span> — <span style="color:#64748b;">${model}</span> <span style="font-size:10px;color:#94a3b8;">(documentos processados via API)</span>`;
        }

        const model = ai.model || 'qwen2.5:14b';
        return `<span style="color:#16a34a;">Powered by Ollama</span> — <span style="color:#64748b;">${model}</span> <span style="font-size:10px;color:#94a3b8;">(processamento local, seguro)</span>`;
    }
};

window.importacaoETModule = ImportacaoETModule;
ImportacaoETModule.init();
