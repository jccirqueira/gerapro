import { store } from './state.js';
import { SIEMENS_GROUP_MAP, detectGrupoColumn, getSiemensCategory } from './siemensGroupMap.js';

console.log('[Importacao] Module Loaded with Interactive Column Mapping.');

const MAPPABLE_FIELDS = [
    { key: 'codigoInterno', label: 'Código Interno', hint: 'codigo, código, code, pn, part number, referencia' },
    { key: 'codigoFabricante', label: 'Cód. Fabricante', hint: 'cod. fabricante, part number, mpn, modelo' },
    { key: 'descricao', label: 'Descrição *', required: true, hint: 'descri, description, especificação, nome, produto' },
    { key: 'custo', label: 'Custo (R$)', hint: 'custo, preco, preço, price, cost, valor, r$' },
    { key: 'fabricante', label: 'Fabricante', hint: 'fabricante, marca, manufacturer, brand' },
    { key: 'unidade', label: 'Unidade', hint: 'unidade, unit, un, und' },
    { key: 'categoria', label: 'Categoria', hint: 'categoria, category, tipo, família' },
    { key: 'ncm', label: 'NCM', hint: 'ncm' },
    { key: 'icms', label: 'ICMS (%)', hint: 'icms' },
    { key: 'ipi', label: 'IPI (%)', hint: 'ipi' },
    { key: 'ufFornecedor', label: 'UF Fornecedor', hint: 'uf, estado, state' },
    { key: 'grupoSiemens', label: 'Grupo Siemens', hint: 'grupo de material 2, grupo material 2, grupo siemens' },
    { key: 'area', label: 'Área', hint: 'area, área, setor, local, departamento' },
    { key: 'modelo', label: 'Modelo', hint: 'modelo, model' },
    { key: 'peso', label: 'Peso (kg)', hint: 'peso, weight, kg, massa' },
    { key: 'largura_mm', label: 'Largura (mm)', hint: 'largura, larg, largura mm, width, w' },
    { key: 'altura_mm', label: 'Altura (mm)', hint: 'altura, alt, altura mm, height, h' },
    { key: 'profundidade_mm', label: 'Profundidade (mm)', hint: 'profundidade, prof, profundidade mm, depth, d' }
];

const SIEMENS_PRESET_MAP = {
    '__EMPTY': 'codigoInterno',
    '__EMPTY_1': 'descricao',
    '__EMPTY_2': 'codigoInterno',
    '__EMPTY_3': 'grupoSiemens',
    '__EMPTY_4': 'ncm',
    '__EMPTY_7': 'unidade',
    '__EMPTY_8': 'custo'
};

let columnMapping = {};
let icmsInclusoChecked = false;

function detectIsSiemens(headers, sampleData) {
    if (headers.length > 0 && headers.every(h => /^__EMPTY(?:_\d+)?$/.test(h))) return true;

    let score = 0;

    const emptyCount = headers.filter(h => /^__EMPTY(?:_\d+)?$/.test(h)).length;
    const emptyRatio = headers.length > 0 ? emptyCount / headers.length : 0;
    if (emptyRatio >= 0.6) score += 3;
    else if (emptyCount > 0) score += 1;

    if (headers.some(h => String(h).toLowerCase().includes('lista de preços'))) score += 2;

    if (headers.some(h => /mlfb|grupo.*(?:material|siemens)|siemens/i.test(String(h)))) score += 2;

    if (sampleData && sampleData.length > 0) {
        const mlfbRegex = /\b\d[A-Z]{2}\d{4}[-]\w+\b/;
        const groupKeys = Object.keys(SIEMENS_GROUP_MAP);
        const groupRegex = new RegExp(`\\b(${groupKeys.join('|')})\\b`);
        let mlfbHits = 0, groupHits = 0;
        for (const row of sampleData) {
            if (mlfbHits >= 2 && groupHits >= 2) break;
            for (const val of Object.values(row)) {
                const s = String(val);
                if (mlfbHits < 2 && mlfbRegex.test(s)) mlfbHits++;
                if (groupHits < 2 && groupRegex.test(s)) groupHits++;
            }
        }
        if (mlfbHits >= 2) score += 3;
        if (groupHits >= 2) score += 2;
    }

    return score >= 4;
}

function autoDetectMapping(headers) {
    const mapping = {};
    const taxWords = ['icms', 'pis', 'cofins', 'ipi'];
    const priceKeywords = MAPPABLE_FIELDS.find(f => f.key === 'custo').hint.split(', ').map(k => k.toLowerCase().trim());
    headers.forEach(h => {
        const hl = h.toLowerCase().trim();
        for (const field of MAPPABLE_FIELDS) {
            if (field.key === 'custo') {
                const hasTaxWord = taxWords.some(t => hl.includes(t));
                const hasPriceWord = priceKeywords.some(k => hl.includes(k));
                if (hasTaxWord && !hasPriceWord) continue;
            }

            const keywords = field.hint.split(', ').map(k => k.toLowerCase().trim());
            if (keywords.some(k => hl.includes(k))) {
                if (!mapping[field.key]) {
                    mapping[field.key] = h;
                }
                break;
            }
        }
    });
    return mapping;
}

const ImportacaoModule = {
    init() {
        try {
            this.cacheDOM();
            this.bindEvents();
            this.renderSessions();
            this.renderCleanupTools();
            this._unsubscribe = store.subscribe(() => {
                this.renderCleanupTools();
                this.renderSessions();
            });
        } catch (err) {
            console.error('[Importacao] Init Error:', err);
        }
    },

    destroy() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
    },

    cacheDOM() {
        this.dom = {
            fileInput: document.getElementById('file-import'),
            previewSection: document.getElementById('import-preview'),
            previewTable: document.getElementById('table-import-preview'),
            btnProcess: document.getElementById('btn-process-import')
        };
        if (this.dom.fileInput) {
            this.dom.fileInput.setAttribute('accept', '.csv, .xlsx, .xls');
        }
    },

    bindEvents() {
        if (!this.dom.fileInput || !this.dom.btnProcess) {
            console.warn('[Importacao] Elements missing!');
            return;
        }
        this.dom.fileInput.onchange = (e) => this.handleFileSelect(e);
        this.dom.btnProcess.onclick = () => this.process();
    },

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);

        if (isExcel) {
            reader.onload = (evt) => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                    this.parsedData = json;
                    this.render(json);
                } catch (err) {
                    console.error('[Importacao] Excel Parse Error:', err);
                    window.app.toast("Erro ao ler Excel. Verifique se o arquivo não está corrompido.", "error");
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (evt) => {
                this.parsedData = this.parse(evt.target.result);
                this.render(this.parsedData);
            };
            reader.readAsText(file);
        }
    },

    parse(csv) {
        const lines = csv.split('\n').filter(l => l.trim());
        if (!lines.length) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        return lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj = {};
            if (vals.length === headers.length) {
                headers.forEach((h, i) => obj[h] = vals[i]);
                return obj;
            }
            return null;
        }).filter(item => item !== null);
    },

    render(data) {
        this.dom.previewSection.style.display = 'block';
        const tbody = this.dom.previewTable.querySelector('tbody');
        const thead = this.dom.previewTable.querySelector('thead');
        if (!data || !data.length) {
            tbody.innerHTML = '<tr><td colspan="100%">Nenhum dado válido encontrado.</td></tr>';
            return;
        }

        const headers = Object.keys(data[0]);
        this._lastHeaders = headers;
        const priceCols = headers.filter(h =>
            ['preco', 'preço', 'custo', 'price', 'cost', 'valor', 'r$'].some(k => h.toLowerCase().includes(k))
        );

        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tbody.innerHTML = data.slice(0, 5).map(r => `<tr>${headers.map(h => {
            let v = r[h];
            if (priceCols.includes(h) && v !== '' && v !== null && v !== undefined) {
                const num = this._parseNumber(v);
                if (!isNaN(num)) v = app.formatCurrencyRaw ? app.formatCurrencyRaw(num) : num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
            return `<td>${v}</td>`;
        }).join('')}</tr>`).join('');

        const isSiemens = detectIsSiemens(headers, data.slice(0, 10));
        this._isSiemens = isSiemens;
        columnMapping = {};

        if (isSiemens) {
            const siemensUsed = new Set();
            MAPPABLE_FIELDS.forEach(f => {
                const col = Object.keys(SIEMENS_PRESET_MAP).find(c =>
                    headers.includes(c) && SIEMENS_PRESET_MAP[c] === f.key && !siemensUsed.has(f.key)
                );
                if (col) {
                    columnMapping[f.key] = col;
                    siemensUsed.add(f.key);
                }
            });
        } else {
            columnMapping = autoDetectMapping(headers);
        }

        this.renderMapping(headers, isSiemens);
    },

    renderMapping(headers, isSiemens) {
        let container = document.getElementById('import-mapping-panel');
        if (!container) {
            container = document.createElement('div');
            container.id = 'import-mapping-panel';
            this.dom.previewSection.appendChild(container);
        }

        const hasEmptyCols = headers.some(h => /^__EMPTY(?:_\d+)?$/.test(h));
        const siemensBtn = isSiemens ? `
            <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="font-weight: 700; color: rgb(207, 12, 48); font-size: 13px; background: #fef2f2; padding: 4px 10px; border-radius: 4px;">
                    ⚡ Planilha Siemens detectada
                </span>
                <button class="btn btn-sm" id="btn-preset-siemens" style="background: var(--color-accent); color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer;">
                    <i class="ph ph-arrows-clockwise"></i> Reaplicar Mapeamento Siemens
                </button>
            </div>
        ` : (hasEmptyCols ? `
            <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <button class="btn btn-sm" id="btn-force-siemens" style="background: rgb(207, 12, 48); color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    <i class="ph ph-lightning"></i> Forçar Mapeamento Siemens
                </button>
                <span style="font-size: 11px; color: #94a3b8;">
                    <i class="ph ph-info"></i> Colunas __EMPTY detectadas — pode ser uma planilha Siemens não reconhecida automaticamente.
                </span>
            </div>
        ` : '');

        container.innerHTML = `
            <div class="card" style="padding: 16px; margin-top: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 700;">
                        <i class="ph ph-arrows-left-right" style="margin-right: 6px;"></i> Mapeamento de Colunas
                    </h4>
                    <span style="font-size: 11px; color: #94a3b8;">
                        <i class="ph ph-check-circle" style="color: var(--color-accent);"></i>
                        ${MAPPABLE_FIELDS.filter(f => columnMapping[f.key]).length} / ${MAPPABLE_FIELDS.length} campos
                    </span>
                </div>
                ${siemensBtn}
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;">
                    ${MAPPABLE_FIELDS.map(f => {
                        const selected = columnMapping[f.key] || '';
                        const isAuto = selected && (
                            isSiemens
                        );
                        const isMissingRequired = f.required && !selected;
                        return `
                            <div class="form-group" style="margin: 0; ${isMissingRequired ? 'background: #fef2f2; border-radius: 6px; padding: 6px; border: 1px solid #fecaca;' : ''}">
                                <label style="font-size: 11px; font-weight: 600; color: ${isMissingRequired ? '#dc2626' : '#475569'}; display: flex; align-items: center; gap: 4px;">
                                    ${f.label} ${f.required ? '<span style="color: rgb(207, 12, 48);">*</span>' : ''}
                                    ${selected ? '<span style="font-size: 10px; color: var(--color-accent);">✓</span>' : ''}
                                    ${isMissingRequired ? '<span style="font-size: 10px; color: #dc2626; margin-left: auto;">⚠ obrigatório</span>' : ''}
                                </label>
                                <select class="form-control mapping-select" data-field="${f.key}" style="font-size: 12px; padding: 4px 8px; height: auto; margin-top: 2px; ${isMissingRequired ? 'border-color: #f87171;' : ''}">
                                    <option value="">— Ignorar —</option>
                                    ${headers.map(h => `
                                        <option value="${h}" ${h === selected ? 'selected' : ''}>${h}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                        <input type="checkbox" id="chk-icms-incluso" ${icmsInclusoChecked ? 'checked' : ''}>
                        <span><strong>Pre\u00e7o com ICMS incluso</strong> — o valor do custo informado j\u00e1 inclui ICMS. Marque para deduzir o ICMS automaticamente: <code>custo = custo \u00f7 (1 + ICMS%)</code></span>
                    </label>
                </div>
                <div style="margin-top: 12px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                    <i class="ph ph-info"></i>
                    A Descrição é obrigatória. A importação usa <strong>Código Interno</strong> ou <strong>Cód. Fabricante</strong> para identificar materiais existentes (atualiza) ou criar novos.
                </div>
            </div>
        `;

        const chk = document.getElementById('chk-icms-incluso');
        if (chk) {
            chk.addEventListener('change', () => { icmsInclusoChecked = chk.checked; });
        }

        if (isSiemens) {
            const btn = document.getElementById('btn-preset-siemens');
            if (btn) {
                btn.onclick = () => this.applySiemensPreset(headers);
            }
        } else if (hasEmptyCols) {
            const btn = document.getElementById('btn-force-siemens');
            if (btn) {
                btn.onclick = () => {
                    this.applySiemensPreset(headers);
                    this._isSiemens = true;
                    this.renderMapping(headers, true);
                    window.app.toast("Mapeamento Siemens aplicado manualmente.", "success");
                };
            }
        }

        container.querySelectorAll('.mapping-select').forEach(sel => {
            sel.addEventListener('change', () => {
                columnMapping[sel.dataset.field] = sel.value;
                const count = MAPPABLE_FIELDS.filter(f => columnMapping[f.key]).length;
                const badge = container.querySelector('h4 + span');
                if (badge) {
                    badge.innerHTML = `<i class="ph ph-check-circle" style="color: var(--color-accent);"></i> ${count} / ${MAPPABLE_FIELDS.length} campos`;
                }
            });
        });
    },

    applySiemensPreset(headers) {
        const siemensUsed = new Set();
        MAPPABLE_FIELDS.forEach(f => {
            const col = Object.keys(SIEMENS_PRESET_MAP).find(c =>
                headers.includes(c) && SIEMENS_PRESET_MAP[c] === f.key && !siemensUsed.has(f.key)
            );
            if (col) {
                columnMapping[f.key] = col;
                siemensUsed.add(f.key);
            } else {
                columnMapping[f.key] = '';
            }
        });

        const selects = document.querySelectorAll('.mapping-select');
        selects.forEach(sel => {
            const field = sel.dataset.field;
            if (columnMapping[field]) {
                sel.value = columnMapping[field];
            } else {
                sel.value = '';
            }
        });

        const badge = document.querySelector('#import-mapping-panel h4 + span');
        if (badge) {
            const count = MAPPABLE_FIELDS.filter(f => columnMapping[f.key]).length;
            badge.innerHTML = `<i class="ph ph-check-circle" style="color: var(--color-accent);"></i> ${count} / ${MAPPABLE_FIELDS.length} campos`;
        }

        window.app.toast("Mapeamento Siemens reaplicado.", "success");
    },

    async process() {
        if (!this.parsedData || this.parsedData.length === 0) {
            window.app.toast("Nenhum dado para importar.", "warning");
            return;
        }

        if (!columnMapping.descricao) {
            window.app.toast(
                'A coluna "Descrição" não está mapeada. Selecione qual coluna do arquivo contém a descrição do material no painel de Mapeamento.',
                "error"
            );
            return;
        }

        let successCount = 0;
        let semDescricao = 0;
        const mapping = { ...columnMapping };
        const newMaterials = this.parsedData.map(r => {
            const getVal = (field) => {
                const col = mapping[field];
                return col && r[col] !== undefined ? r[col] : null;
            };

            const desc = getVal('descricao');
            if (!desc || !String(desc).trim()) return null;

            successCount++;
            const rawCode = getVal('codigoInterno');

            const item = {
                id: crypto.randomUUID(),
                codigoInterno: rawCode ? String(rawCode).trim() : 'IMP-' + Math.floor(Math.random() * 100000),
                codigoFabricante: getVal('codigoFabricante') ? String(getVal('codigoFabricante')).trim() : '',
                descricao: String(desc).trim(),
                custo: this._parseNumber(getVal('custo') ?? 0),
                fabricante: (() => {
                    const explicit = getVal('fabricante');
                    if (explicit) return String(explicit).trim();
                    if (mapping.grupoSiemens) return 'Siemens';
                    return '';
                })(),
                unidade: getVal('unidade') ? String(getVal('unidade')).trim() : 'un',
                categoria: (() => {
                    const explicit = getVal('categoria');
                    if (explicit) return String(explicit).trim();
                    const grupo = getVal('grupoSiemens');
                    if (grupo) {
                        const mapped = getSiemensCategory(grupo);
                        if (mapped) return mapped;
                    }
                    return 'Outros';
                })(),
                ncm: getVal('ncm') ? String(getVal('ncm')).trim() : '',
                area: getVal('area') ? String(getVal('area')).trim() : '',
                modelo: getVal('modelo') ? String(getVal('modelo')).trim() : '',
                icms: (() => {
                    const raw = getVal('icms');
                    if (raw === null || raw === '') return 0;
                    let v = this._parseNumber(String(raw).replace('%', ''));
                    if (isNaN(v)) return 0;
                    if (typeof raw === 'number' && raw <= 1 && v <= 1) v *= 100;
                    return v;
                })(),
                ipi: (() => {
                    const raw = getVal('ipi');
                    if (raw === null || raw === '') return 0;
                    let v = this._parseNumber(String(raw).replace('%', ''));
                    if (isNaN(v)) return 0;
                    if (typeof raw === 'number' && raw <= 1 && v <= 1) v *= 100;
                    return v;
                })(),
                ufFornecedor: getVal('ufFornecedor') ? String(getVal('ufFornecedor')).trim().toUpperCase().substring(0, 2) : '',
                grupoSiemens: getVal('grupoSiemens') ? String(getVal('grupoSiemens')).trim() : '',
                peso: this._parseNumber(getVal('peso')) || 0,
                largura_mm: this._parseNumber(getVal('largura_mm')) || 0,
                altura_mm: this._parseNumber(getVal('altura_mm')) || 0,
                profundidade_mm: this._parseNumber(getVal('profundidade_mm')) || 0,
                markup: 0,
                createdAt: new Date()
            };
            if (icmsInclusoChecked && item.icms > 0) {
                item.custo = item.custo / (1 + item.icms / 100);
            }
            return item;
        }).filter(i => {
            if (i === null) semDescricao++;
            return i !== null;
        });
        alert(`Diagnóstico da importação:\n\nTotal de linhas lidas: ${this.parsedData.length}\nCom descrição: ${newMaterials.length}\nSem descrição: ${semDescricao}\n\nSe o número "Sem descrição" estiver muito alto, a coluna mapeada como "Descrição" pode estar errada.`);

        if (successCount > 0) {
            const btn = this.dom.btnProcess;
            if (btn) { btn.disabled = true; btn.textContent = 'Importando...'; }

            try {
                const token = store.getState().auth?.token;
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`${store._getServerUrl()}/api/materiais/import-bulk`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ items: newMaterials })
                });
                const result = await res.json();

                if (!result.success) {
                    window.app.toast('Erro: ' + (result.error || 'falha no servidor'), 'error');
                    if (btn) { btn.disabled = false; btn.textContent = 'Processar Importação'; }
                    return;
                }

                const { addedIds, updatedIds, snapshots } = result;

                // Atualiza store in-memory
                const currentMaterials = store.getState().materiais || [];
                const materialsMap = new Map();
                currentMaterials.forEach(m => {
                    const code = (m.codigoInterno || m.codigoFabricante || '').toLowerCase().trim();
                    if (code) materialsMap.set(code, m);
                });

                newMaterials.forEach(item => {
                    const code = (item.codigoInterno || item.codigoFabricante || '').toLowerCase().trim();
                    const existing = materialsMap.get(code);
                    if (existing) {
                        Object.assign(existing, item, { id: existing.id, createdAt: existing.createdAt, lastUpdateTitle: 'Atualização via Importação' });
                    } else {
                        currentMaterials.push(item);
                    }
                });

                store.setState({ materiais: [...currentMaterials] });

                // ── Record import session for undo ──
                if (addedIds.length > 0 || updatedIds.length > 0) {
                    store.recordImportSession({
                        id: 'import-' + Date.now(),
                        type: 'full',
                        title: `Importação ${new Date().toLocaleString()}`,
                        addedIds,
                        snapshots,
                        timestamp: new Date().toISOString()
                    });
                }

                let msg = '';
                if (addedIds.length > 0) msg += `${addedIds.length} novos itens adicionados. `;
                if (updatedIds.length > 0) msg += `${updatedIds.length} itens existentes atualizados.`;

                window.app.toast(msg || "Importação concluída sem alterações.", "success");
            } catch (err) {
                console.error('[Import] Erro no bulk import:', err);
                window.app.toast('Erro de conexão com o servidor.', 'error');
            }

            if (btn) { btn.disabled = false; btn.textContent = 'Processar Importação'; }
            this.dom.previewSection.style.display = 'none';
            this.dom.fileInput.value = '';
            this.parsedData = null;
            columnMapping = {};

            this.renderSessions();
        } else {
            window.app.toast("Nenhum item válido encontrado. A coluna Descrição é obrigatória.", "error");
        }
    },

    renderSessions() {
        const sessions = store.getImportSessions();
        let container = document.getElementById('import-sessions-panel');
        if (!container) {
            container = document.createElement('div');
            container.id = 'import-sessions-panel';
            const fileArea = this.dom.fileInput?.parentElement;
            if (fileArea) {
                const uploadArea = fileArea.parentElement;
                uploadArea.parentElement.insertBefore(container, uploadArea.nextSibling);
            }
        }

        if (sessions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="card" style="padding: 16px; margin-top: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 700;">
                        <i class="ph ph-clock-counter-clockwise"></i> Importações Recentes
                    </h4>
                    <span style="font-size: 11px; color: #94a3b8;">${sessions.length} sessão(ões)</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${sessions.map(s => {
                        const added = s.addedIds?.length || 0;
                        const modified = Object.keys(s.snapshots || {}).length;
                        const parts = [];
                        if (added > 0) parts.push(`${added} novo(s)`);
                        if (modified > 0) parts.push(`${modified} atualizado(s)`);
                        return `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; font-size: 13px; color: #1e293b;">${s.title}</div>
                                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${parts.join(', ') || 'Sem alterações'}</div>
                                </div>
                                <button type="button" class="btn btn-sm btn-outline" style="color: #ef4444; border-color: #fecaca; font-size: 11px; padding: 4px 12px; white-space: nowrap;"
                                    onclick="(async()=>{
                                        if (!confirm('Desfazer esta importação? Os materiais adicionados serão removidos e os atualizados voltarão ao estado anterior.')) return;
                                        const btn = this;
                                        btn.disabled = true; btn.textContent = 'Desfazendo...';
                                        const result = await store.undoImport('${s.id}');
                                        if (result === 'ok') { window.app.toast('Importação desfeita!', 'success'); }
                                        else if (result === 'partial') { window.app.toast('Desfeito parcialmente.', 'warning'); }
                                        else if (result === 'not-found') { window.app.toast('Sessão expirada.', 'error'); }
                                        ImportacaoModule.renderSessions();
                                    })()">
                                    <i class="ph ph-arrow-counter-clockwise"></i> Desfazer
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderCleanupTools() {
        const materiais = store.getState().materiais || [];
        const fabricantes = [...new Set(materiais.map(m => m.fabricante).filter(f => f && f.toString().trim()))].sort();
        let container = document.getElementById('import-cleanup-panel');
        if (!container) {
            container = document.createElement('div');
            container.id = 'import-cleanup-panel';
            const sessionsPanel = document.getElementById('import-sessions-panel');
            const ref = sessionsPanel || this.dom.previewSection;
            if (ref && ref.parentElement) {
                ref.parentElement.insertBefore(container, ref.nextSibling);
            } else {
                const fileArea = this.dom.fileInput?.parentElement;
                if (fileArea) {
                    const uploadArea = fileArea.parentElement;
                    uploadArea.parentElement.insertBefore(container, uploadArea.nextSibling);
                }
            }
        }

        container.style.display = 'block';
        const selectedFab = container.dataset.selectedFab || '';
        const count = selectedFab ? materiais.filter(m => m.fabricante === selectedFab).length : 0;
        container.innerHTML = `
            <div class="card" style="padding: 16px; margin-top: 16px; border: 1px solid #fecaca;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #dc2626;">
                        <i class="ph ph-eraser"></i> Limpar Materiais por Fabricante
                    </h4>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <select id="cleanup-fabricante-select" class="form-control" style="width: 240px; font-size: 13px; padding: 6px 10px;"
                        onchange="ImportacaoModule._onCleanupFabChange(this.value)">
                        <option value="">— Selecione um fabricante —</option>
                        ${fabricantes.map(f => `
                            <option value="${f}" ${f === selectedFab ? 'selected' : ''}>${f}</option>
                        `).join('')}
                    </select>
                    ${selectedFab ? `
                        <span style="font-size: 13px; color: #64748b;">
                            <strong>${count}</strong> material(is) encontrado(s)
                        </span>
                        <button type="button" class="btn btn-sm" style="background: #dc2626; color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;"
                            onclick="ImportacaoModule.cleanupByFabricante('${selectedFab}')">
                            <i class="ph ph-trash"></i> Limpar ${count} material(is)
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    _onCleanupFabChange(fabricante) {
        const container = document.getElementById('import-cleanup-panel');
        if (container) {
            container.dataset.selectedFab = fabricante;
        }
        this.renderCleanupTools();
    },

    async cleanupByFabricante(fabricante) {
        if (!fabricante) return;
        const materiais = store.getState().materiais || [];
        const toDelete = materiais.filter(m => m.fabricante === fabricante);
        if (toDelete.length === 0) {
            window.app.toast(`Nenhum material encontrado para ${fabricante}.`, 'info');
            return;
        }
        if (!confirm(`Remover TODOS os ${toDelete.length} materiais do fabricante "${fabricante}"?\n\nEsta ação não pode ser desfeita.`)) return;
        window.app.toast(`Removendo ${toDelete.length} materiais...`, 'info');
        let success = 0;
        let fail = 0;
        for (const m of toDelete) {
            const ok = await store.deleteMaterial(m.id);
            if (ok) success++; else fail++;
        }
        if (fail > 0) {
            window.app.toast(`${success} removido(s), ${fail} falha(s).`, 'warning');
        } else {
            window.app.toast(`${success} materiais de "${fabricante}" removidos!`, 'success');
        }
        const container = document.getElementById('import-cleanup-panel');
        if (container) {
            container.dataset.selectedFab = '';
        }
        this.renderCleanupTools();
        this.renderSessions();
    },

    _parseNumber(val) {
        if (val === null || val === undefined || val === '') return NaN;
        if (typeof val === 'number') return val;
        let str = String(val).trim().replace(/[R$\s]/g, '');
        if (!str) return NaN;
        const hasComma = str.includes(',');
        const hasDot = str.includes('.');
        if (hasComma && hasDot) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else if (hasComma && !hasDot) {
            str = str.replace(',', '.');
        } else if (!hasComma && hasDot) {
            const dots = str.match(/\./g);
            if (dots && dots.length > 1) {
                const lastIdx = str.lastIndexOf('.');
                str = str.substring(0, lastIdx).replace(/\./g, '') + '.' + str.substring(lastIdx + 1);
            }
        }
        const num = parseFloat(str);
        return isNaN(num) || !isFinite(num) ? NaN : num;
    },

    toTitleCase(str) {
        if (!str) return '';
        return str.toString().toLowerCase().split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }
};

window.ImportacaoModule = ImportacaoModule;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ImportacaoModule.init());
} else {
    ImportacaoModule.init();
}
