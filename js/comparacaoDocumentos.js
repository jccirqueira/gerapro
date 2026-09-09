import { store } from './state.js';

function _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

const ComparacaoDocumentosModule = {
    _documents: [],
    _extractedItems: [],
    _multiConfig: null,
    _multiResults: null,
    _mode: 'upload',
    _proposalId: null,
    _aggStatusFilter: null,
    _multiStatusFilter: null,
    _dirtyItems: null,
    _rematchPairs: null,

    init() {
        this._injectPrintCss();
        window.app.comparacaoDocumentos = {
            render: this.render.bind(this),
            open: this.open.bind(this),
            close: this.close.bind(this),
            openFromToolbar: this.openFromToolbar.bind(this),
            _addUploadSlot: this._addUploadSlot.bind(this),
            _handleSlotFile: this._handleSlotFile.bind(this),
            _startComparison: this._startComparison.bind(this),
            _checkUploadReady: this._checkUploadReady.bind(this),
            _exportXlsx: this._exportXlsx.bind(this),
            _saveSession: this._saveSession.bind(this),
            _toggleFilter: this._toggleFilter.bind(this),
            _runFromGroup: this._runFromGroup.bind(this),
            _backToGroup: this._backToGroup.bind(this),
            _aggSort: this._aggSort.bind(this),
            _aggSearchChange: this._aggSearchChange.bind(this),
            _aggToggleAll: this._aggToggleAll.bind(this),
            _aggExcludeSelected: this._aggExcludeSelected.bind(this),
            _aggResetExcluded: this._aggResetExcluded.bind(this),
            _aggSetPreco: this._aggSetPreco.bind(this),
            _multiSearchChange: this._multiSearchChange.bind(this),
            _multiToggleAll: this._multiToggleAll.bind(this),
            _multiExcludeSelected: this._multiExcludeSelected.bind(this),
            _multiResetExcluded: this._multiResetExcluded.bind(this),
            _multiSortToggle: this._multiSortToggle.bind(this),
            _showSessionHistory: this._showSessionHistory.bind(this),
            _restoreSession: this._restoreSession.bind(this),
            _aggFilterByStatus: this._aggFilterByStatus.bind(this),
            _multiFilterByStatus: this._multiFilterByStatus.bind(this),
            _updateAggQtd: this._updateAggQtd.bind(this),
            _updateMultiQtd: this._updateMultiQtd.bind(this),
            _openRematch: this._openRematch.bind(this),
            _doRematch: this._doRematch.bind(this),
            _exportCsv: this._exportCsv.bind(this),
            _exportPdf: this._exportPdf.bind(this)
        };
        window.comparacaoDocumentosModule = ComparacaoDocumentosModule;
    },

    _injectPrintCss() {
        const id = 'comp-print-css';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            @media print {
                body * { visibility: hidden; }
                #view-comparacao-documentos, #view-comparacao-documentos * { visibility: visible; }
                #view-comparacao-documentos { position: absolute; left: 0; top: 0; width: 100%; }
                .module-header-sticky { display: none !important; }
                .btn, button { display: none !important; }
                input { display: none !important; }
                #comparacao-body { padding: 0 !important; overflow: visible !important; }
                table { font-size: 10px !important; }
                th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .comp-diff-equal { opacity: 0.4 !important; }
            }
        `;
        document.head.appendChild(style);
        window.addEventListener('beforeprint', () => this._saveCache());
    },

    render() {
        this._documents = [];
        this._extractedItems = [];
        this._multiConfig = null;
        this._multiResults = null;
        this._mode = 'upload';
        this._proposalId = null;
        this._searchTerms = '';
        this._prices = new Map();
        this._defaultPreco = 0;
        this._aggSortBy = '';
        this._aggSortDir = 'asc';
        this._aggSearch = '';
        this._aggExcluded = new Set();
        this._multiSearch = '';
        this._multiExcluded = new Set();
        this._multiSortDir = 'asc';
        this._renderUpload();
    },

    open() {
        if (window.app && window.app.navigateTo) {
            window.app.navigateTo('comparacao-documentos');
        }
    },

    openFromToolbar() {
        const proposal = store.getState().activeTechnicalProposal;
        if (proposal) this._proposalId = proposal.id;
        this.open();
    },

    close() {
        if (window.app && window.app.navigateTo) {
            window.app.navigateTo('dashboard');
        }
    },

    _getContainerHtml(bodyContent) {
        return `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: white; margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; flex-shrink: 0;">
                    <div>
                        <h3 style="margin:0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                            <i class="ph ph-git-diff"></i> Comparar Documentos
                        </h3>
                        <div id="comp-page-subtitle" style="font-size:11px;opacity:0.8;margin-top:2px;">Compare quantitativos entre documentos técnicos</div>
                    </div>
                    <button type="button" class="btn btn-ghost" onclick="app.comparacaoDocumentos.close()" style="padding:4px 8px;color:white;border-color:rgba(255,255,255,0.3);"><i class="ph ph-x"></i></button>
                </div>
                <div id="comparacao-body" style="flex:1;overflow-y:auto;padding:24px;">
                    ${bodyContent}
                </div>
            </div>
        `;
    },

    _renderIntoView(html) {
        const container = document.getElementById('view-comparacao-documentos');
        if (container) container.innerHTML = html;
    },

    _renderUpload() {
        this._renderIntoView(this._getContainerHtml(`
            <div id="comparacao-upload-list" style="max-width:960px;margin:0 auto;">
                <div style="display:flex;gap:8px;margin-bottom:16px;">
                    <button class="btn btn-outline" onclick="app.comparacaoDocumentos._addUploadSlot()" style="flex:1;padding:12px;border:2px dashed #cbd5e1;background:#f8fafc;">
                        <i class="ph ph-plus-circle"></i> Adicionar Documento
                    </button>
                    <button class="btn btn-outline" onclick="app.comparacaoDocumentos._showSessionHistory()" style="padding:12px 16px;border:2px dashed #cbd5e1;background:#f8fafc;white-space:nowrap;">
                        <i class="ph ph-clock-counter-clockwise"></i> Histórico
                    </button>
                </div>
                <div id="comparacao-slots"></div>
            </div>
            <div style="max-width:960px;margin:24px auto 0;padding:16px 20px;border:1px solid #e2e8f0;border-radius:8px;background:#fafbfc;">
                <label style="font-weight:600;font-size:13px;color:#1e293b;display:block;margin-bottom:4px;">
                    <i class="ph ph-funnel"></i> Termos para busca <span style="font-weight:400;color:#94a3b8;">(opcional)</span>
                </label>
                <p style="font-size:11px;color:#64748b;margin:0 0 8px;">Informe os itens que a IA deve procurar. Ex: eletrocalha, cabo, condulete, eletroduto</p>
                <textarea id="comp-search-terms"
                          style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;resize:vertical;min-height:56px;font-family:inherit;"
                          placeholder="Ex: Eletrocalha, Cabo de Cobre, Condulete, Eletroduto, Bandeja, Leito..."></textarea>
            </div>
            <div style="max-width:960px;margin:24px auto 0;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e2e8f0;padding-top:16px;">
                <button class="btn btn-cancel" onclick="app.comparacaoDocumentos.close()">Cancelar</button>
                <button class="btn btn-primary" onclick="app.comparacaoDocumentos._startComparison()" id="btn-compare-start" disabled>
                    <i class="ph ph-arrow-circle-right"></i> Extrair e Configurar
                </button>
            </div>
        `));
        this._addUploadSlot();
        this._addUploadSlot();
    },

    _addUploadSlot() {
        const slots = document.getElementById('comparacao-slots');
        if (!slots) return;
        const idx = slots.children.length;
        const slot = document.createElement('div');
        slot.className = 'comp-slot';
        slot.style.cssText = 'border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;background:#fafbfc;';
        slot.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:600;font-size:13px;color:#1e293b;">
                    <i class="ph ph-file"></i> <span class="comp-slot-title">${idx === 0 ? 'Documento de Referência' : 'Documento para Comparar ' + idx}</span>
                </span>
                ${idx >= 2 ? `<button class="btn btn-ghost btn-sm" onclick="this.closest('.comp-slot').remove();app.comparacaoDocumentos._checkUploadReady();" style="color:#ef4444;"><i class="ph ph-trash"></i></button>` : ''}
            </div>
            <div style="display:flex;gap:12px;align-items:center;">
                <div style="flex:1;">
                    <label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;">Arquivo (PDF, XLSX, DOCX)</label>
                    <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv" 
                           onchange="app.comparacaoDocumentos._handleSlotFile(this, ${idx})"
                           style="font-size:13px;width:100%;">
                    <input type="hidden" class="comp-file-data" value="">
                    <input type="hidden" class="comp-file-name" value="">
                    <input type="hidden" class="comp-sheet-names" value="">
                    <input type="hidden" class="comp-selected-sheets" value="">
                </div>
                <div style="flex:1;">
                    <label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;">Rótulo (ex: Proposta do Cliente)</label>
                    <input type="text" class="comp-file-label" placeholder="Ex: Orçamento Fornecedor" 
                           style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;"
                           oninput="app.comparacaoDocumentos._checkUploadReady()">
                </div>
            </div>
            <div class="comp-sheet-selector" style="display:none;margin-top:8px;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <i class="ph ph-table" style="font-size:12px;color:#475569;"></i>
                    <span style="font-size:11px;font-weight:600;color:#475569;">Abas da planilha:</span>
                    <span style="margin-left:auto;">
                        <a href="#" onclick="event.preventDefault();var c=this.closest('.comp-sheet-selector').querySelectorAll('.comp-sheet-cb');c.forEach(function(cb){cb.checked=true;cb.dispatchEvent(new Event('change'))});" style="font-size:10px;color:#3b82f6;text-decoration:none;">Todas</a>
                        <span style="color:#cbd5e1;font-size:10px;"> | </span>
                        <a href="#" onclick="event.preventDefault();var c=this.closest('.comp-sheet-selector').querySelectorAll('.comp-sheet-cb');c.forEach(function(cb){cb.checked=false;cb.dispatchEvent(new Event('change'))});" style="font-size:10px;color:#64748b;text-decoration:none;">Nenhuma</a>
                    </span>
                </div>
                <div class="comp-sheet-checkboxes" style="display:flex;flex-wrap:wrap;gap:4px 12px;"></div>
            </div>
            <div class="comp-file-status" style="font-size:11px;color:#94a3b8;margin-top:6px;"></div>
        `;
        slots.appendChild(slot);
        this._checkUploadReady();
    },

    _handleSlotFile(input, idx) {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
            window.app.toast('Arquivo muito grande. Máximo 15MB.', 'error');
            return;
        }
        const slot = input.closest('.comp-slot');
        const statusEl = slot.querySelector('.comp-file-status');
        statusEl.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Lendo arquivo...';
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result;
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            slot.querySelector('.comp-file-data').value = base64;
            slot.querySelector('.comp-file-name').value = file.name;
            if (isExcel && typeof XLSX !== 'undefined') {
                this._detectExcelSheets(slot, arrayBuffer);
            }
            const titleEl = slot.querySelector('.comp-slot-title');
            if (titleEl) titleEl.textContent = file.name;
            statusEl.innerHTML = `<span style="color:#16a34a;"><i class="ph ph-check-circle"></i> ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)</span>`;
            this._checkUploadReady();
        };
        reader.onerror = () => {
            statusEl.innerHTML = '<span style="color:#ef4444;">Erro ao ler arquivo</span>';
        };
        reader.readAsArrayBuffer(file);
    },

    _detectExcelSheets(slot, arrayBuffer) {
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const sheetNames = workbook.SheetNames;
        const sheetNamesInput = slot.querySelector('.comp-sheet-names');
        const selectedSheetsInput = slot.querySelector('.comp-selected-sheets');
        const sheetSelectorDiv = slot.querySelector('.comp-sheet-selector');
        const checkboxesDiv = slot.querySelector('.comp-sheet-checkboxes');
        if (!checkboxesDiv) return;
        if (sheetNamesInput) sheetNamesInput.value = JSON.stringify(sheetNames);
        if (sheetNames.length < 2) {
            if (selectedSheetsInput) selectedSheetsInput.value = '';
            if (sheetSelectorDiv) sheetSelectorDiv.style.display = 'none';
            return;
        }
        checkboxesDiv.innerHTML = sheetNames.map((name, i) => `
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:2px 4px;border-radius:4px;background:#ffffff;border:1px solid #e2e8f0;">
                <input type="checkbox" class="comp-sheet-cb" value="${name.replace(/"/g, '&quot;')}" checked
                       style="accent-color:#3b82f6;width:13px;height:13px;">
                <span style="white-space:nowrap;">${this._esc(name)}</span>
            </label>
        `).join('');
        const updateSelected = () => {
            const checked = checkboxesDiv.querySelectorAll('.comp-sheet-cb:checked');
            const selected = Array.from(checked).map(c => c.value);
            if (selectedSheetsInput) selectedSheetsInput.value = JSON.stringify(selected);
            this._checkUploadReady();
        };
        checkboxesDiv.querySelectorAll('.comp-sheet-cb').forEach(cb => {
            cb.addEventListener('change', updateSelected);
        });
        if (selectedSheetsInput) selectedSheetsInput.value = JSON.stringify(sheetNames);
        sheetSelectorDiv.style.display = 'block';
    },

    _checkUploadReady() {
        const slots = document.querySelectorAll('#comparacao-slots > div');
        const btn = document.getElementById('btn-compare-start');
        if (!btn) return;
        let ready = 0;
        slots.forEach(s => {
            const data = s.querySelector('.comp-file-data')?.value;
            const label = s.querySelector('.comp-file-label')?.value;
            if (data && label) ready++;
        });
        btn.disabled = ready < 2;
    },

    async _startComparison() {
        const slots = document.querySelectorAll('#comparacao-slots > div');
        const documents = [];
        slots.forEach((s) => {
            const data = s.querySelector('.comp-file-data')?.value;
            const label = s.querySelector('.comp-file-label')?.value;
            const name = s.querySelector('.comp-file-name')?.value;
            const selectedSheetsVal = s.querySelector('.comp-selected-sheets')?.value;
            if (data && label) {
                const doc = { content: data, filename: name || 'documento', label };
                if (selectedSheetsVal) {
                    try {
                        const parsed = JSON.parse(selectedSheetsVal);
                        if (Array.isArray(parsed) && parsed.length > 0) doc.selectedSheets = parsed;
                    } catch (e) {}
                }
                documents.push(doc);
            }
        });
        if (documents.length < 2) {
            window.app.toast('Selecione pelo menos 2 documentos com rótulos.', 'warning');
            return;
        }
        const searchTermsInput = document.getElementById('comp-search-terms');
        this._searchTerms = searchTermsInput ? searchTermsInput.value.trim() : '';
        this._documents = documents;
        this._renderLoading('Enviando documentos para extração...');
        try {
            const result = await store.compareDocuments(documents, this._searchTerms);
            if (!result.success) {
                this._renderError(result.error || 'Erro ao processar documentos');
                return;
            }
            this._extractedItems = result.results || [];
            const hasError = this._extractedItems.some(r => r.error);
            if (hasError) {
                const errors = this._extractedItems.filter(r => r.error).map(r => `${r.label}: ${r.error}`).join('<br>');
                this._renderError(`Falha na extração de alguns documentos:<br>${errors}`);
                return;
            }
            this._mode = 'group';
            this._renderGroupConfig();
        } catch (err) {
            this._renderError(err.message);
        }
    },

    _renderLoading(message) {
        const subtitle = document.getElementById('comp-page-subtitle');
        if (subtitle) subtitle.textContent = 'Extraindo itens com IA...';
        this._renderIntoView(this._getContainerHtml(`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
                <i class="ph ph-spinner ph-spin" style="font-size:48px;color:#16a34a;"></i>
                <p style="margin-top:16px;font-weight:600;color:#1e293b;">${message}</p>
                <p style="font-size:12px;color:#94a3b8;">Extraindo itens com IA dos documentos...</p>
            </div>
        `));
    },

    _renderError(message) {
        const subtitle = document.getElementById('comp-page-subtitle');
        if (subtitle) subtitle.textContent = 'Erro na extração';
        this._renderIntoView(this._getContainerHtml(`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
                <i class="ph ph-warning-circle" style="font-size:48px;color:#ef4444;"></i>
                <p style="margin-top:16px;font-weight:600;color:#dc2626;">Erro</p>
                <p style="font-size:13px;color:#64748b;">${message}</p>
                <button class="btn btn-secondary" style="margin-top:16px;" onclick="app.comparacaoDocumentos._backToUpload()">Tentar novamente</button>
            </div>
        `));
    },

    _renderGroupConfig() {
        const docs = this._extractedItems;
        const subtitle = document.getElementById('comp-page-subtitle');
        if (subtitle) subtitle.textContent = 'Configurar comparação';
        this._renderIntoView(this._getContainerHtml(`
            <div style="max-width:960px;margin:0 auto;">

                <div style="margin-bottom:24px;">
                    <h4 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1e293b;"><i class="ph ph-gear"></i> Configurar Comparação</h4>
                    <p style="margin:0;font-size:12px;color:#64748b;">Defina o documento de referência e quais serão comparados</p>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">

                    <div style="border:2px solid #16a34a;border-radius:10px;padding:20px;background:#f0fdf4;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
                            <span style="background:#16a34a;color:white;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;">REF</span>
                            <span style="font-weight:700;font-size:14px;color:#166534;">Documento de Referência</span>
                            <span style="margin-left:auto;font-size:11px;color:#166534;font-weight:600;" id="comp-ref-count">0 itens</span>
                        </div>
                        <div id="comp-ref-list" style="display:flex;flex-direction:column;gap:8px;">
                            ${docs.map((d, i) => `
                                <label style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #bbf7d0;border-radius:8px;background:white;cursor:pointer;${i === 0 ? 'border-color:#16a34a;background:#f0fdf4;' : ''}">
                                    <input type="radio" name="comp-ref" value="${i}" ${i === 0 ? 'checked' : ''} 
                                           style="accent-color:#16a34a;width:18px;height:18px;">
                                    <span style="flex:1;font-weight:600;font-size:13px;color:#1e293b;">
                                        ${this._esc(d.label)}
                                        <span style="display:block;font-size:10px;color:#64748b;font-weight:400;margin-top:1px;">${this._esc(d.filename)}</span>
                                    </span>
                                    <span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px;">${(d.items||[]).length} itens</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div style="border:2px solid #3b82f6;border-radius:10px;padding:20px;background:#eff6ff;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
                            <span style="background:#3b82f6;color:white;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;">COMP</span>
                            <span style="font-weight:700;font-size:14px;color:#1e40af;">Documentos para Comparar</span>
                            <span style="margin-left:auto;font-size:11px;color:#1e40af;font-weight:600;" id="comp-cmp-count">0 itens</span>
                        </div>
                        <div id="comp-cmp-list" style="display:flex;flex-direction:column;gap:8px;">
                            ${docs.map((d, i) => `
                                <label style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #bfdbfe;border-radius:8px;background:white;cursor:pointer;${i !== 0 ? 'border-color:#3b82f6;' : 'opacity:0.5;'}">
                                    <input type="checkbox" class="comp-cmp-cb" value="${i}" ${i !== 0 ? 'checked' : ''} 
                                           ${i === 0 ? 'disabled' : ''}
                                           style="accent-color:#3b82f6;width:18px;height:18px;">
                                    <span style="flex:1;font-weight:600;font-size:13px;color:#1e293b;">
                                        ${this._esc(d.label)}
                                        <span style="display:block;font-size:10px;color:#64748b;font-weight:400;margin-top:1px;">${this._esc(d.filename)}</span>
                                    </span>
                                    <span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px;">${(d.items||[]).length} itens</span>
                                </label>
                            `).join('')}
                        </div>
                        <div style="margin-top:12px;padding:10px;border:1px dashed #bfdbfe;border-radius:6px;font-size:12px;color:#1e40af;background:#f8faff;text-align:center;">
                            <i class="ph ph-info"></i> 
                            Itens de múltiplos documentos comparados são <strong>mesclados automaticamente</strong> (dedup fuzzy)
                        </div>
                    </div>

                </div>

                <div style="margin-bottom:24px;padding:16px 20px;border:1px solid #e2e8f0;border-radius:8px;background:#fafbfc;">
                    <div style="font-weight:600;font-size:13px;color:#1e293b;margin-bottom:12px;">
                        <i class="ph ph-eye"></i> Modo de Visualização
                    </div>
                    <div style="display:flex;gap:24px;">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 16px;border:2px solid #3b82f6;border-radius:8px;background:#eff6ff;flex:1;" id="comp-view-individual">
                            <input type="radio" name="comp-view-mode" value="individual" checked
                                   style="accent-color:#3b82f6;width:18px;height:18px;">
                            <div>
                                <div style="font-weight:600;font-size:13px;color:#1e40af;">Individual</div>
                                <div style="font-size:11px;color:#64748b;margin-top:2px;">Tabela única com colunas para cada documento comparado<br>
                                <small style="color:#3b82f6;">✓ Ideal: 1 referência vs N documentos independentes</small></div>
                            </div>
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 16px;border:2px solid #e2e8f0;border-radius:8px;flex:1;" id="comp-view-aggregate">
                            <input type="radio" name="comp-view-mode" value="aggregate"
                                   style="accent-color:#8b5cf6;width:18px;height:18px;">
                            <div>
                                <div style="font-weight:600;font-size:13px;color:#1e293b;">Agregado</div>
                                <div style="font-size:11px;color:#64748b;margin-top:2px;">Documentos comparados são mesclados em um só<br>
                                <small style="color:#8b5cf6;">✓ Ideal: documentação do cliente fracionada em vários arquivos</small></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e2e8f0;padding-top:16px;">
                    <button class="btn btn-cancel" onclick="app.comparacaoDocumentos._backToUpload()">← Upload</button>
                    <button class="btn btn-primary" onclick="app.comparacaoDocumentos._runFromGroup()" id="btn-comp-run" disabled>
                        <i class="ph ph-arrow-circle-right"></i> Comparar
                    </button>
                </div>
            </div>
        `));
        this._setupGroupEvents();
    },

    _setupGroupEvents() {
        const update = () => {
            const btn = document.getElementById('btn-comp-run');
            if (!btn) return;
            const checked = document.querySelectorAll('.comp-cmp-cb:checked').length;
            btn.disabled = checked < 1;
            const refItems = document.getElementById('comp-ref-count');
            const cmpItems = document.getElementById('comp-cmp-count');
            if (refItems) {
                const selected = document.querySelector('input[name="comp-ref"]:checked');
                if (selected) {
                    const idx = parseInt(selected.value);
                    const doc = this._extractedItems[idx];
                    refItems.textContent = (doc ? doc.items.length : 0) + ' itens';
                }
            }
            if (cmpItems) {
                let total = 0;
                let count = 0;
                document.querySelectorAll('.comp-cmp-cb:checked').forEach(cb => {
                    const idx = parseInt(cb.value);
                    const doc = this._extractedItems[idx];
                    if (doc) { total += (doc.items || []).length; count++; }
                });
                cmpItems.textContent = total + ' itens (' + count + ' docs)';
            }
        };
        document.querySelectorAll('input[name="comp-ref"]').forEach(r => r.addEventListener('change', update));
        document.querySelectorAll('.comp-cmp-cb').forEach(cb => cb.addEventListener('change', update));
        document.querySelectorAll('input[name="comp-view-mode"]').forEach(r => {
            r.addEventListener('change', () => {
                const labels = document.querySelectorAll('[id^="comp-view-"]');
                labels.forEach(l => {
                    const radio = l.querySelector('input[type="radio"]');
                    if (radio && radio.checked) {
                        l.style.borderColor = radio.value === 'individual' ? '#3b82f6' : '#8b5cf6';
                        l.style.background = radio.value === 'individual' ? '#eff6ff' : '#f5f3ff';
                    } else {
                        l.style.borderColor = '#e2e8f0';
                        l.style.background = '#fafbfc';
                    }
                });
            });
            if (r.checked) r.dispatchEvent(new Event('change'));
        });
        update();
    },

    _backToUpload() {
        this._mode = 'upload';
        this._renderUpload();
    },

    async _runFromGroup() {
        const refRadio = document.querySelector('input[name="comp-ref"]:checked');
        if (!refRadio) { window.app.toast('Selecione um documento de referência.', 'warning'); return; }
        const refIdx = parseInt(refRadio.value);
        const compareCbs = document.querySelectorAll('.comp-cmp-cb:checked');
        const compareIndices = Array.from(compareCbs).map(cb => parseInt(cb.value));
        if (compareIndices.length === 0) { window.app.toast('Selecione ao menos 1 documento para comparar.', 'warning'); return; }

        const viewMode = document.querySelector('input[name="comp-view-mode"]:checked')?.value || 'individual';
        this._multiConfig = { refIdx, compareIndices, viewMode };
        this._renderLoading('Processando comparação...');

        try {
            const refDoc = this._extractedItems[refIdx];
            const compareDocs = compareIndices.map(i => this._extractedItems[i]);

            if (viewMode === 'individual') {
                const pairs = [];
                for (const cd of compareDocs) {
                    const matches = suggestMatching(refDoc.items || [], cd.items || []);
                    const results = calculateDiff(matches);
                    pairs.push({ label: cd.label, filename: cd.filename, items: cd.items || [], matches, results });
                }
                this._multiResults = {
                    refDoc: { label: refDoc.label, filename: refDoc.filename, items: refDoc.items || [] },
                    compareDocs: pairs,
                    viewMode: 'individual'
                };
            } else {
                const mergedItems = mergeItems(compareDocs);
                const matches = suggestMatching(refDoc.items || [], mergedItems);
                const results = calculateDiff(matches);
                this._multiResults = {
                    refDoc: { label: refDoc.label, filename: refDoc.filename, items: refDoc.items || [] },
                    compareDocs: [{ label: 'Merge (' + compareDocs.map(d => d.label).join(', ') + ')', filename: compareDocs.map(d => d.filename).join('; '), items: mergedItems, matches, results }],
                    mergedLabel: compareDocs.map(d => d.label).join(' + '),
                    viewMode: 'aggregate'
                };
            }

            this._mode = 'result';
            this._renderResult();
        } catch (err) {
            this._renderError(err.message);
        }
    },

    _backToGroup() {
        if (this._multiConfig) {
            this._mode = 'group';
            this._renderGroupConfig();
        } else {
            this._renderUpload();
        }
    },

    _renderResult() {
        if (this._multiResults.viewMode === 'individual') {
            this._renderMultiMatchResult();
        } else {
            this._renderAggregateResult();
        }
    },

    _renderMultiMatchResult() {
        const { refDoc, compareDocs } = this._multiResults;
        const totalPairs = compareDocs.length;

        const allResults = compareDocs.flatMap(p => p.results);
        const totalExcedente = allResults.filter(r => r.status === 'excedente').length;
        const totalFaltante = allResults.filter(r => r.status === 'faltante').length;
        const totalOk = allResults.filter(r => r.status === 'ok').length;
        const totalApenasRef = allResults.filter(r => r.status === 'apenas_documento').length;
        const totalApenasDoc = allResults.filter(r => r.status === 'apenas_levantamento').length;

        const subtitle = document.getElementById('comp-page-subtitle');
        if (subtitle) subtitle.textContent = `${refDoc.label} vs ${compareDocs.map(d => d.label).join(', ')}`;

        let unifiedRows = computeUnifiedTable(refDoc.items || [], compareDocs);
        let { rows, orphanRows } = unifiedRows;
        this._multiSearch = this._multiSearch || '';
        this._multiExcluded = this._multiExcluded || new Set();
        this._multiSortDir = this._multiSortDir || 'asc';

        let filtered = rows.filter((_, i) => !this._multiExcluded.has(i));
        if (this._multiStatusFilter) {
            const sf = this._multiStatusFilter;
            filtered = filtered.filter(r => {
                if (sf === 'apenas_documento') return r.comparisons.length === 0;
                if (sf === 'apenas_levantamento') return false;
                return r.comparisons.some(c => c.status === sf);
            });
            if (sf === 'apenas_levantamento') filtered = [];
        }
        if (this._multiSearch) {
            const q = this._multiSearch.toLowerCase();
            filtered = filtered.filter(r => (r.descricao || '').toLowerCase().includes(q));
        }
        if (this._multiSortDir) {
            filtered.sort((a, b) => {
                const va = (a.descricao || '').toLowerCase();
                const vb = (b.descricao || '').toLowerCase();
                return this._multiSortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
            });
        }

        const pairHeaders = compareDocs.map((cd, pi) => `
            <th style="padding:6px 4px;text-align:center;border-bottom:2px solid #e2e8f0;background:#f1f5f9;position:sticky;top:0;font-size:11px;white-space:nowrap;border-right:1px solid #e2e8f0;">
                <span style="background:#3b82f6;color:white;padding:1px 5px;border-radius:4px;font-size:9px;font-weight:700;">Doc ${pi + 1}</span>
                <span style="display:block;font-size:9px;color:#64748b;font-weight:400;margin-top:1px;">${this._esc(cd.label).substring(0, 20)}</span>
                <span style="display:block;font-size:8px;color:#94a3b8;font-weight:400;margin-top:0;">${this._esc(cd.filename).substring(0, 25)}</span>
                <span style="display:block;font-size:10px;color:#1e293b;font-weight:600;margin-top:2px;">Qtd</span>
            </th>
            <th style="padding:6px 4px;text-align:center;border-bottom:2px solid #e2e8f0;background:#f1f5f9;position:sticky;top:0;font-size:11px;white-space:nowrap;${pi < compareDocs.length - 1 ? 'border-right:2px solid #cbd5e1;' : ''}">
                <span style="color:#64748b;font-weight:400;font-size:10px;">Dif. (Ref - Doc ${pi + 1})</span>
            </th>
        `).join('');

        const rowsHtml = filtered.map((row, ri) => {
            const origIdx = rows.indexOf(row);
            const bestScore = Math.max(...row.comparisons.map(c => c.matchScore || 0), 0);
            const msColor = bestScore >= 0.8 ? '#16a34a' : bestScore >= 0.5 ? '#f59e0b' : '#ef4444';
            const anyUnWarn = row.comparisons.some(c => c.unMismatch);
            const unWarnHtml = anyUnWarn ? ` <i class="ph ph-warning" style="color:#f59e0b;font-size:10px;" title="Unidade diferente em um dos documentos"></i>` : '';
            const cells = compareDocs.map((cd, pi) => {
                const comp = row.comparisons.find(c => c.pairIndex === pi);
                const lastPair = pi === compareDocs.length - 1;
                if (!comp || comp.qtd === null) {
                    return `<td style="padding:6px 4px;text-align:center;color:#cbd5e1;font-size:11px;${!lastPair ? 'border-right:2px solid #e2e8f0;' : ''}">—</td>
                            <td style="padding:6px 4px;text-align:center;color:#cbd5e1;font-size:11px;">—</td>`;
                }
                const diff = comp.diff;
                const diffClass = diff > 0 ? 'color:#f59e0b;' : diff < 0 ? 'color:#ef4444;' : 'color:#16a34a;';
                const diffSign = diff > 0 ? '+' : '';
                return `<td style="padding:6px 4px;text-align:center;font-weight:600;font-size:12px;${!lastPair ? 'border-right:1px solid #e2e8f0;' : ''}">
                    <input type="number" value="${comp.qtd}" step="0.01" min="0"
                           onchange="app.comparacaoDocumentos._updateMultiQtd(${origIdx},${pi},this.value)"
                           style="width:52px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;font-family:inherit;text-align:center;background:white;outline:none;">
                </td>
                        <td style="padding:6px 4px;text-align:center;font-weight:700;font-size:12px;${diffClass}">${diffSign}${diff}</td>`;
            }).join('');
            return `<tr style="border-bottom:1px solid #f1f5f9;" data-multi-idx="${origIdx}">
                <td style="padding:6px 4px;text-align:center;"><input type="checkbox" class="comp-multi-excl-cb" value="${origIdx}" style="accent-color:#64748b;"></td>
                <td style="padding:6px 8px;font-weight:600;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${this._esc(row.descricao)}">${this._esc(row.descricao)}</td>
                <td style="padding:6px 4px;text-align:center;color:#94a3b8;font-size:11px;white-space:nowrap;">${row.un}${unWarnHtml}</td>
                <td style="padding:6px 4px;text-align:center;">
                    ${bestScore > 0 ? `<span style="display:inline-block;background:${msColor};color:white;padding:1px 5px;border-radius:6px;font-size:9px;font-weight:600;">${Math.round(bestScore * 100)}%</span>` : '<span style="color:#cbd5e1;font-size:9px;">—</span>'}
                </td>
                <td style="padding:6px 8px;text-align:center;font-weight:700;font-size:13px;background:#f0fdf4;border-right:2px solid #cbd5e1;">
                    <input type="number" value="${row.refQtd}" step="0.01" min="0"
                           onchange="app.comparacaoDocumentos._updateMultiQtd(${origIdx},-1,this.value)"
                           style="width:52px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;font-family:inherit;text-align:center;background:white;outline:none;">
                </td>
                ${cells}
            </tr>`;
        }).join('');

        const colCount = 5 + totalPairs * 2;
        const orphansHtml = orphanRows.length > 0 ? `
            <tr style="background:#f8fafc;"><td colspan="${colCount}" style="padding:8px;font-weight:600;font-size:12px;color:#64748b;border-bottom:1px solid #e2e8f0;">
                <i class="ph ph-warning"></i> Itens que aparecem apenas nos documentos comparados (não na referência)
            </td></tr>
            ${orphanRows.map((row, ri) => {
                const cells = compareDocs.map((cd, pi) => {
                    const comp = row.comparisons.find(c => c.pairIndex === pi);
                    const lastPair = pi === compareDocs.length - 1;
                    if (!comp || comp.qtd === null) return `<td style="padding:6px 4px;text-align:center;color:#cbd5e1;${!lastPair ? 'border-right:2px solid #e2e8f0;' : ''}">—</td><td style="padding:6px 4px;text-align:center;"></td>`;
                    return `<td style="padding:6px 4px;text-align:center;font-weight:600;font-size:12px;color:#3b82f6;${!lastPair ? 'border-right:2px solid #e2e8f0;' : ''}">${comp.qtd}</td>
                            <td style="padding:6px 4px;text-align:center;font-size:11px;color:#3b82f6;">só aqui</td>`;
                }).join('');
                return `<tr style="border-bottom:1px solid #f1f5f9;opacity:0.8;">
                    <td style="padding:6px 4px;"></td>
                    <td style="padding:6px 8px;font-size:12px;font-style:italic;color:#64748b;">${this._esc(row.descricao)}</td>
                    <td style="padding:6px 4px;text-align:center;color:#94a3b8;font-size:11px;">${row.un}</td>
                    <td style="padding:6px 4px;text-align:center;"><span style="color:#cbd5e1;font-size:9px;">—</span></td>
                    <td style="padding:6px 8px;text-align:center;color:#cbd5e1;">—</td>
                    ${cells}
                </tr>`;
            }).join('')}
        ` : '';

        this._renderIntoView(this._getContainerHtml(`
            <div style="display:flex;flex-direction:column;height:100%;">
                <div style="display:flex;gap:16px;margin-bottom:16px;align-items:stretch;flex-shrink:0;">
                    <div style="flex:1;min-width:0;">
                ${this._renderSummaryCards(totalOk, totalExcedente, totalFaltante, totalApenasRef, totalApenasDoc, 'multi')}
                    </div>
                    <div style="width:280px;flex-shrink:0;display:flex;align-items:center;">
                        <canvas id="comp-multi-chart" width="280" height="100" style="width:280px;height:100px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;"></canvas>
                    </div>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;flex-shrink:0;">
                    <div style="margin-left:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <span style="font-size:11px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:4px;">
                            <i class="ph ph-file-text"></i> Ref: <strong>${this._esc(refDoc.label)}</strong>
                        </span>
                        <span style="font-size:11px;color:#64748b;">
                            vs ${totalPairs} doc${totalPairs > 1 ? 's' : ''}
                        </span>
                        <input type="number" id="comp-multi-preco" placeholder="Preço unit. (R$)" value="${this._defaultPreco || ''}" step="0.01" min="0"
                               onchange="app.comparacaoDocumentos._aggSetPreco(this.value);app.comparacaoDocumentos._renderMultiMatchResult();"
                               style="width:130px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:11px;font-family:inherit;outline:none;">
                        <button class="btn btn-outline btn-sm" onclick="app.comparacaoDocumentos._exportXlsx()" style="font-size:12px;">
                            <i class="ph ph-file-xls"></i> XLSX
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="app.comparacaoDocumentos._exportCsv()" style="font-size:12px;">
                            <i class="ph ph-file-csv"></i> CSV
                        </button>
                            <button class="btn btn-outline btn-sm" onclick="app.comparacaoDocumentos._exportPdf()" style="font-size:12px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                        <button class="btn btn-primary btn-sm" onclick="app.comparacaoDocumentos._saveSession()" style="font-size:12px;">
                            <i class="ph ph-floppy-disk"></i> Salvar Sessão
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos._backToGroup()" style="font-size:12px;">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                    </div>
                </div>

                <div style="flex:1;min-height:0;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-shrink:0;gap:8px;flex-wrap:wrap;">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
                            <i class="ph ph-magnifying-glass" style="color:#94a3b8;font-size:14px;"></i>
                            <input type="text" id="comp-multi-search" placeholder="Buscar na tabela..." value="${this._esc(this._multiSearch)}"
                                   oninput="app.comparacaoDocumentos._multiSearchChange(this.value)"
                                   style="flex:1;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;font-family:inherit;outline:none;">
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos._multiExcludeSelected()" style="font-size:11px;color:#ef4444;${this._multiExcluded.size > 0 ? '' : 'opacity:0.4;'}" id="comp-multi-excluir-btn">
                                <i class="ph ph-eye-slash"></i> Excluir selecionados
                            </button>
                            ${this._multiExcluded.size > 0 ? `<button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos._multiResetExcluded()" style="font-size:11px;color:#3b82f6;"><i class="ph ph-undo"></i> Restaurar (${this._multiExcluded.size})</button>` : ''}
                        </div>
                    </div>
                    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;flex:1;display:flex;flex-direction:column;">
                        <div style="overflow:auto;flex:1;">
                            <table style="width:100%;font-size:12px;border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#f1f5f9;position:sticky;top:0;z-index:1;">
                                        <th style="padding:6px 4px;text-align:center;border-bottom:2px solid #e2e8f0;width:28px;">
                                            <input type="checkbox" onchange="app.comparacaoDocumentos._multiToggleAll(this)">
                                        </th>
                                        <th style="padding:8px 8px;text-align:left;border-bottom:2px solid #e2e8f0;white-space:nowrap;cursor:pointer;" onclick="app.comparacaoDocumentos._multiSortToggle()">Descrição ${this._multiSortDir ? (this._multiSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                                        <th style="padding:8px 4px;text-align:center;border-bottom:2px solid #e2e8f0;width:36px;">UN</th>
                                        <th style="padding:8px 4px;text-align:center;border-bottom:2px solid #e2e8f0;width:44px;">Match</th>
                                        <th style="padding:6px 8px;text-align:center;border-bottom:2px solid #e2e8f0;background:#f0fdf4;position:sticky;top:0;white-space:nowrap;border-right:2px solid #cbd5e1;">
                                            <span style="background:#16a34a;color:white;padding:1px 5px;border-radius:4px;font-size:9px;font-weight:700;">Ref</span>
                                            <span style="display:block;font-size:9px;color:#64748b;font-weight:400;margin-top:1px;">${this._esc(refDoc.label).substring(0, 20)}</span>
                                            <span style="display:block;font-size:8px;color:#94a3b8;font-weight:400;margin-top:0;">${this._esc(refDoc.filename).substring(0, 25)}</span>
                                            <span style="display:block;font-size:10px;color:#166534;font-weight:600;margin-top:2px;">Qtd</span>
                                        </th>
                                        ${pairHeaders}
                                    </tr>
                                </thead>
                                <tbody id="comp-multi-tbody">
                                    ${rowsHtml}
                                    ${orphansHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `));
        this._drawChart('comp-multi-chart', totalOk, totalExcedente, totalFaltante, totalApenasRef, totalApenasDoc);
    },

    _renderAggregateResult() {
        const { refDoc, compareDocs } = this._multiResults;
        const pair = compareDocs[0];
        let results = pair.results;
        this._aggSortBy = this._aggSortBy || '';
        this._aggSortDir = this._aggSortDir || 'asc';
        this._aggSearch = this._aggSearch || '';
        this._aggExcluded = this._aggExcluded || new Set();

        let filtered = results.filter((_, i) => !this._aggExcluded.has(i));
        if (this._aggStatusFilter) {
            filtered = filtered.filter(r => r.status === this._aggStatusFilter);
        }
        if (this._aggSearch) {
            const q = this._aggSearch.toLowerCase();
            filtered = filtered.filter(r => (r.descricao || '').toLowerCase().includes(q));
        }
        if (this._aggSortBy) {
            filtered.sort((a, b) => {
                let va, vb;
                switch (this._aggSortBy) {
                    case 'desc': va = (a.descricao || '').toLowerCase(); vb = (b.descricao || '').toLowerCase(); break;
                    case 'un': va = (a.unidade || '').toLowerCase(); vb = (b.unidade || '').toLowerCase(); break;
                    case 'ref': va = a.qtd_documento || 0; vb = b.qtd_documento || 0; break;
                    case 'doc': va = a.qtd_levantamento || 0; vb = b.qtd_levantamento || 0; break;
                    case 'dif': va = a.diferenca || 0; vb = b.diferenca || 0; break;
                    case 'pct': va = a.percentual || 0; vb = b.percentual || 0; break;
                    case 'status': va = a.status || ''; vb = b.status || ''; break;
                    case 'match': va = a.match_score || 0; vb = b.match_score || 0; break;
                    default: return 0;
                }
                if (va < vb) return this._aggSortDir === 'asc' ? -1 : 1;
                if (va > vb) return this._aggSortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const totalExcedente = results.filter(r => r.status === 'excedente').length;
        const totalFaltante = results.filter(r => r.status === 'faltante').length;
        const totalOk = results.filter(r => r.status === 'ok').length;
        const totalApenasRef = results.filter(r => r.status === 'apenas_documento').length;
        const totalApenasDoc = results.filter(r => r.status === 'apenas_levantamento').length;

        const subtitle = document.getElementById('comp-page-subtitle');
        if (subtitle) subtitle.textContent = `${refDoc.label} vs ${pair.label}`;

        const sortIcon = (col) => {
            if (this._aggSortBy !== col) return '';
            return this._aggSortDir === 'asc' ? ' ▲' : ' ▼';
        };

        this._renderIntoView(this._getContainerHtml(`
            <div style="display:flex;flex-direction:column;height:100%;">
                <div style="display:flex;gap:16px;margin-bottom:16px;align-items:stretch;flex-shrink:0;">
                    <div style="flex:1;min-width:0;">
                ${this._renderSummaryCards(totalOk, totalExcedente, totalFaltante, totalApenasRef, totalApenasDoc, 'agg')}
                    </div>
                    <div style="width:280px;flex-shrink:0;display:flex;align-items:center;">
                        <canvas id="comp-agg-chart" width="280" height="100" style="width:280px;height:100px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;"></canvas>
                    </div>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;flex-shrink:0;">
                    <div style="margin-left:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <span style="font-size:11px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:4px;">
                            <i class="ph ph-file-text"></i> Ref: <strong>${this._esc(refDoc.label)}</strong>
                        </span>
                        <span style="font-size:11px;color:#64748b;background:#eff6ff;padding:4px 10px;border-radius:4px;">
                            <i class="ph ph-files"></i> vs <strong>${this._esc(pair.label)}</strong>
                        </span>
                        <input type="number" id="comp-agg-preco" placeholder="Preço unit. (R$)" value="${this._defaultPreco || ''}" step="0.01" min="0"
                               onchange="app.comparacaoDocumentos._aggSetPreco(this.value)"
                               style="width:130px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:11px;font-family:inherit;outline:none;">
                        <button class="btn btn-outline btn-sm" onclick="app.comparacaoDocumentos._exportXlsx()" style="font-size:12px;">
                            <i class="ph ph-file-xls"></i> XLSX
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="app.comparacaoDocumentos._exportCsv()" style="font-size:12px;">
                            <i class="ph ph-file-csv"></i> CSV
                        </button>
                            <button class="btn btn-outline btn-sm" onclick="app.comparacaoDocumentos._exportPdf()" style="font-size:12px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                        <button class="btn btn-primary btn-sm" onclick="app.comparacaoDocumentos._saveSession()" style="font-size:12px;">
                            <i class="ph ph-floppy-disk"></i> Salvar Sessão
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos._backToGroup()" style="font-size:12px;">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                    </div>
                </div>

                <div style="flex:1;min-height:0;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-shrink:0;gap:8px;flex-wrap:wrap;">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
                            <i class="ph ph-magnifying-glass" style="color:#94a3b8;font-size:14px;"></i>
                            <input type="text" id="comp-agg-search" placeholder="Buscar na tabela..." value="${this._esc(this._aggSearch)}"
                                   oninput="app.comparacaoDocumentos._aggSearchChange(this.value)"
                                   style="flex:1;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;font-family:inherit;outline:none;">
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer;">
                                <input type="checkbox" id="comp-show-all" checked onchange="app.comparacaoDocumentos._toggleFilter()">
                                Mostrar apenas diferenças
                            </label>
                            <button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos._aggExcludeSelected()" style="font-size:11px;color:#ef4444;${this._aggExcluded.size > 0 ? '' : 'opacity:0.4;'}" id="comp-agg-excluir-btn">
                                <i class="ph ph-eye-slash"></i> Excluir selecionados
                            </button>
                            ${this._aggExcluded.size > 0 ? `<button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos._aggResetExcluded()" style="font-size:11px;color:#3b82f6;"><i class="ph ph-undo"></i> Restaurar (${this._aggExcluded.size})</button>` : ''}
                        </div>
                    </div>
                    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;flex:1;display:flex;flex-direction:column;">
                        <div id="comp-diff-table" style="overflow:auto;flex:1;">
                            <table style="width:100%;font-size:12px;border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#f1f5f9;position:sticky;top:0;">
                                        <th style="padding:6px 4px;text-align:center;border-bottom:2px solid #e2e8f0;width:28px;">
                                            <input type="checkbox" onchange="app.comparacaoDocumentos._aggToggleAll(this)">
                                        </th>
                                        <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;cursor:pointer;white-space:nowrap;" onclick="app.comparacaoDocumentos._aggSort('desc')">Descrição<span style="color:#3b82f6;font-size:10px;">${sortIcon('desc')}</span></th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;cursor:pointer;width:36px;" onclick="app.comparacaoDocumentos._aggSort('un')">UN<span style="color:#3b82f6;font-size:10px;">${sortIcon('un')}</span></th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;background:#f0fdf4;cursor:pointer;" onclick="app.comparacaoDocumentos._aggSort('ref')">
                                            <span>${this._esc(refDoc.label)}</span>
                                            <span style="display:block;font-size:10px;color:#94a3b8;font-weight:400;">${this._esc(refDoc.filename).substring(0, 30)}</span>
                                            <span style="color:#3b82f6;font-size:10px;">${sortIcon('ref')}</span>
                                        </th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;background:#eff6ff;cursor:pointer;" onclick="app.comparacaoDocumentos._aggSort('doc')">
                                            <span>${this._esc(pair.label)}</span>
                                            <span style="display:block;font-size:10px;color:#94a3b8;font-weight:400;">${this._esc(pair.filename).substring(0, 30)}</span>
                                            <span style="color:#3b82f6;font-size:10px;">${sortIcon('doc')}</span>
                                        </th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;cursor:pointer;" onclick="app.comparacaoDocumentos._aggSort('dif')">Diferença<span style="color:#3b82f6;font-size:10px;">${sortIcon('dif')}</span></th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;cursor:pointer;" onclick="app.comparacaoDocumentos._aggSort('pct')">%<span style="color:#3b82f6;font-size:10px;">${sortIcon('pct')}</span></th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;cursor:pointer;" onclick="app.comparacaoDocumentos._aggSort('status')">Status<span style="color:#3b82f6;font-size:10px;">${sortIcon('status')}</span></th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;cursor:pointer;width:60px;" onclick="app.comparacaoDocumentos._aggSort('match')">Match<span style="color:#3b82f6;font-size:10px;">${sortIcon('match')}</span></th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;width:72px;">Preço (R$)</th>
                                        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;width:88px;">Dif. Total (R$)</th>
                                    </tr>
                                </thead>
                                <tbody id="comp-diff-tbody">
                                    ${filtered.map((r, i) => this._renderAggDiffRow(r, results.indexOf(r))).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `));
        this._toggleFilter();
        this._drawChart('comp-agg-chart', totalOk, totalExcedente, totalFaltante, totalApenasRef, totalApenasDoc);
    },

    _renderAggDiffRow(r, i) {
        const statusColor = {
            'ok': '#16a34a', 'excedente': '#f59e0b', 'faltante': '#ef4444',
            'apenas_documento': '#3b82f6', 'apenas_levantamento': '#8b5cf6'
        };
        const statusLabel = {
            'ok': 'Igual', 'excedente': 'Excedente', 'faltante': 'Faltante',
            'apenas_documento': 'Só Ref', 'apenas_levantamento': 'Só Doc'
        };
        const diff = r.diferenca || 0;
        const diffClass = diff > 0 ? 'color:#f59e0b;' : diff < 0 ? 'color:#ef4444;' : 'color:#16a34a;';
        const isEqual = r.status === 'ok';
        const ms = r.match_score || 0;
        const msColor = ms >= 0.8 ? '#16a34a' : ms >= 0.5 ? '#f59e0b' : '#ef4444';
        const unWarn = r.un_mismatch ? '<i class="ph ph-warning" style="color:#f59e0b;" title="Unidade diferente"></i>' : '';
        const preco = this._getItemPreco(r.descricao);
        const difTotal = diff * preco;
        const difTotalClass = difTotal > 0 ? 'color:#f59e0b;' : difTotal < 0 ? 'color:#ef4444;' : 'color:#16a34a;';
        const rematchBtn = ms < 0.5 && (r.status === 'apenas_documento' || r.status === 'apenas_levantamento')
            ? `<button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos._openRematch(${i})" style="font-size:9px;padding:1px 4px;color:#3b82f6;" title="Vincular manualmente"><i class="ph ph-link"></i></button>`
            : '';
        return `<tr style="border-bottom:1px solid #f1f5f9;${isEqual ? 'opacity:0.5;' : ''}" class="comp-diff-row ${isEqual ? 'comp-diff-equal' : ''}" data-status="${r.status || ''}">
            <td style="padding:6px 4px;text-align:center;"><input type="checkbox" class="comp-excl-cb" value="${i}" style="accent-color:#64748b;"></td>
            <td style="padding:6px 8px;font-weight:600;font-size:12px;">${this._esc(r.descricao)}${rematchBtn}</td>
            <td style="padding:6px 8px;text-align:center;color:#94a3b8;">${r.unidade || 'un'} ${unWarn}</td>
            <td style="padding:6px 8px;text-align:center;font-weight:600;background:#f0fdf4;">
                <input type="number" value="${r.qtd_documento || 0}" step="0.01" min="0"
                       onchange="app.comparacaoDocumentos._updateAggQtd(${i},'doc',this.value)"
                       style="width:60px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;font-family:inherit;text-align:center;background:white;outline:none;">
            </td>
            <td style="padding:6px 8px;text-align:center;font-weight:600;background:#eff6ff;">
                <input type="number" value="${r.qtd_levantamento || 0}" step="0.01" min="0"
                       onchange="app.comparacaoDocumentos._updateAggQtd(${i},'lev',this.value)"
                       style="width:60px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;font-family:inherit;text-align:center;background:white;outline:none;">
            </td>
            <td style="padding:6px 8px;text-align:center;font-weight:700;${diffClass}">${diff > 0 ? '+' : ''}${diff}</td>
            <td style="padding:6px 8px;text-align:center;">${r.percentual || 0}%</td>
            <td style="padding:6px 8px;text-align:center;">
                <span style="background:${statusColor[r.status] || '#94a3b8'};color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;">
                    ${statusLabel[r.status] || r.status}
                </span>
            </td>
            <td style="padding:6px 8px;text-align:center;">
                ${r.matched ? `<span style="background:${msColor};color:white;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:600;">${Math.round(ms * 100)}%</span>` : '<span style="color:#94a3b8;font-size:10px;">—</span>'}
            </td>
            <td style="padding:6px 8px;text-align:center;font-size:11px;">${preco > 0 ? preco.toFixed(2) : '<span style="color:#cbd5e1;">—</span>'}</td>
            <td style="padding:6px 8px;text-align:center;font-weight:600;font-size:12px;${difTotalClass}">${difTotal !== 0 ? (difTotal > 0 ? '+' : '') + difTotal.toFixed(2) : '<span style="color:#94a3b8;">0,00</span>'}</td>
        </tr>`;
    },

    _toggleFilter() {
        const showAll = document.getElementById('comp-show-all')?.checked;
        const statusFilter = this._aggStatusFilter || this._multiStatusFilter;
        document.querySelectorAll('.comp-diff-row').forEach(row => {
            const isEqual = row.classList.contains('comp-diff-equal');
            let show = showAll || !isEqual;
            if (statusFilter && show) {
                const rowStatus = row.getAttribute('data-status');
                show = rowStatus === statusFilter;
            }
            row.style.display = show ? '' : 'none';
        });
    },

    _aggSort(col) {
        if (this._aggSortBy === col) {
            this._aggSortDir = this._aggSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this._aggSortBy = col;
            this._aggSortDir = 'asc';
        }
        this._renderAggregateResult();
    },

    _aggSearchChange(val) {
        this._aggSearch = val;
        this._renderAggregateResult();
    },

    _aggToggleAll(master) {
        document.querySelectorAll('.comp-excl-cb').forEach(cb => cb.checked = master.checked);
    },

    _aggExcludeSelected() {
        document.querySelectorAll('.comp-excl-cb:checked').forEach(cb => {
            this._aggExcluded.add(parseInt(cb.value));
        });
        this._renderAggregateResult();
    },

    _aggResetExcluded() {
        this._aggExcluded.clear();
        this._renderAggregateResult();
    },

    _multiSearchChange(val) {
        this._multiSearch = val;
        this._renderMultiMatchResult();
    },

    _multiToggleAll(master) {
        document.querySelectorAll('.comp-multi-excl-cb').forEach(cb => cb.checked = master.checked);
    },

    _multiExcludeSelected() {
        document.querySelectorAll('.comp-multi-excl-cb:checked').forEach(cb => {
            this._multiExcluded.add(parseInt(cb.value));
        });
        this._renderMultiMatchResult();
    },

    _multiResetExcluded() {
        this._multiExcluded.clear();
        this._renderMultiMatchResult();
    },

    _multiSortToggle() {
        this._multiSortDir = this._multiSortDir === 'asc' ? 'desc' : 'asc';
        this._renderMultiMatchResult();
    },

    _getItemPreco(descricao) {
        if (this._prices && this._prices.has(descricao)) return this._prices.get(descricao);
        return this._defaultPreco || 0;
    },

    _aggSetPreco(val) {
        this._defaultPreco = parseFloat(val) || 0;
        this._renderAggregateResult();
    },

    async _exportXlsx() {
        try {
            const mr = this._multiResults;
            if (mr) {
                const allResults = mr.compareDocs.flatMap(p => p.results);
                const allDocs = [
                    { label: mr.refDoc.label, filename: mr.refDoc.filename, items: mr.refDoc.items },
                    ...mr.compareDocs.map(p => ({ label: p.label, filename: p.filename, items: p.items }))
                ];
                await store.exportComparisonXlsx(allResults, allDocs, mr);
                window.app.toast('Relatório exportado com sucesso!', 'success');
            } else {
                window.app.toast('Nenhum resultado para exportar.', 'warning');
            }
        } catch (err) {
            window.app.toast('Erro ao exportar: ' + err.message, 'error');
        }
    },

    async _exportPdf() {
        try {
            const mr = this._multiResults;
            if (!mr) { window.app.toast('Nenhum resultado para exportar.', 'warning'); return; }
            const allResults = mr.compareDocs.flatMap(p => p.results);
            const allDocs = [
                { label: mr.refDoc.label, filename: mr.refDoc.filename, items: mr.refDoc.items },
                ...mr.compareDocs.map(p => ({ label: p.label, filename: p.filename, items: p.items }))
            ];
            const token = store.getState().auth?.token;
            if (!token) { window.app.toast('Não autenticado.', 'error'); return; }
            const serverUrl = store._getServerUrl ? store._getServerUrl() : '';
            const res = await fetch(`${serverUrl}/api/export-comparison-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: allResults, documents: allDocs, multiResults: mr })
            });
            if (!res.ok) {
                let errMsg = 'Erro ao exportar PDF';
                try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
                throw new Error(errMsg);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Comparacao_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            window.app.toast('PDF exportado com sucesso!', 'success');
        } catch (err) {
            window.app.toast('Erro ao exportar PDF: ' + err.message, 'error');
        }
    },

    async _saveSession() {
        const proposal = store.getState().activeTechnicalProposal;
        try {
            const mr = this._multiResults;
            if (!mr) { window.app.toast('Nada para salvar.', 'warning'); return; }
            const session = {
                id: _uuid(),
                proposal_id: proposal?.id || '',
                nome: `Comparação: ${mr.refDoc.label} vs ${mr.compareDocs.map(d => d.label).join(', ')}`,
                documentos_json: JSON.stringify({
                    refDoc: { label: mr.refDoc.label, filename: mr.refDoc.filename },
                    compareDocs: mr.compareDocs.map(d => ({ label: d.label, filename: d.filename })),
                    viewMode: mr.viewMode
                }),
                status: 'completed',
                results: mr.compareDocs.flatMap(p => p.results.map(r => ({ ...r, id: _uuid(), pair_label: p.label })))
            };
            await store.saveComparisonSession(session);
            window.app.toast('Sessão de comparação salva com sucesso!', 'success');
        } catch (err) {
            window.app.toast('Erro ao salvar: ' + err.message, 'error');
        }
    },

    async _showSessionHistory() {
        const sessions = await store.fetchComparisonSessions(this._proposalId);
        if (!sessions || sessions.length === 0) {
            window.app.toast('Nenhuma sessão salva encontrada.', 'info');
            return;
        }
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:12px;width:640px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:15px;font-weight:700;"><i class="ph ph-clock-counter-clockwise"></i> Histórico de Sessões</h3>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('#comp-session-overlay').remove()" style="font-size:18px;padding:4px 8px;">&times;</button>
                </div>
                <div style="padding:12px 20px;">
                    ${sessions.map(s => `
                        <div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._esc(s.nome)}</div>
                                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                                    ${s.created_at ? new Date(s.created_at).toLocaleString('pt-BR') : ''}
                                    ${s.results ? ` &middot; ${s.results.length} itens` : ''}
                                </div>
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;">
                                <button class="btn btn-primary btn-sm" onclick="app.comparacaoDocumentos._restoreSession('${s.id}');this.closest('#comp-session-overlay').remove()" style="font-size:11px;">
                                    <i class="ph ph-upload"></i> Restaurar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        overlay.id = 'comp-session-overlay';
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    },

    async _restoreSession(id) {
        try {
            const session = await store.getComparisonSession(id);
            if (!session) { window.app.toast('Sessão não encontrada.', 'error'); return; }
            const docInfo = JSON.parse(session.documentos_json || '{}');
            const refDoc = docInfo.refDoc;
            const compareDocs = docInfo.compareDocs;
            const results = session.results || [];
            if (!compareDocs || compareDocs.length === 0) { window.app.toast('Sessão inválida.', 'error'); return; }
            const resultsByLabel = {};
            results.forEach(r => { const label = r.pair_label || ''; if (!resultsByLabel[label]) resultsByLabel[label] = []; resultsByLabel[label].push(r); });
            this._multiResults = {
                refDoc: { label: refDoc?.label || 'Referência', filename: refDoc?.filename || '', items: [] },
                compareDocs: compareDocs.map(cd => ({
                    label: cd.label,
                    filename: cd.filename || '',
                    results: resultsByLabel[cd.label] || []
                })),
                viewMode: docInfo.viewMode || 'aggregate'
            };
            this._mode = 'result';
            this._aggExcluded = new Set();
            this._multiExcluded = new Set();
            this._aggSearch = '';
            this._multiSearch = '';
            if (this._multiResults.viewMode === 'individual') {
                this._renderMultiMatchResult();
            } else {
                this._renderAggregateResult();
            }
            window.app.toast('Sessão restaurada com sucesso!', 'success');
        } catch (err) {
            window.app.toast('Erro ao restaurar: ' + err.message, 'error');
        }
    },

    _drawChart(canvasId, ok, excedente, faltante, apenasRef, apenasDoc) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const data = [
            { label: 'OK', value: ok, color: '#16a34a' },
            { label: 'Excedente', value: excedente, color: '#f59e0b' },
            { label: 'Faltante', value: faltante, color: '#ef4444' },
            { label: 'Só Ref', value: apenasRef, color: '#3b82f6' },
            { label: 'Só Docs', value: apenasDoc, color: '#8b5cf6' }
        ];
        const total = data.reduce((s, d) => s + d.value, 0);
        if (total === 0) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum item', w / 2, h / 2 + 4);
            return;
        }
        const barArea = { x: 10, y: 6, w: w - 110, h: h - 8 };
        const barH = 12;
        const gap = 3;
        const startY = barArea.y + (barArea.h - data.length * (barH + gap)) / 2;
        const maxVal = Math.max(...data.map(d => d.value), 1);
        data.forEach((d, i) => {
            const by = startY + i * (barH + gap);
            const bw = Math.max(4, (d.value / maxVal) * barArea.w);
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.roundRect(barArea.x, by, bw, barH, 3);
            ctx.fill();
            ctx.fillStyle = '#475569';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(d.label, barArea.x + barArea.w + 8, by + barH - 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(String(d.value), barArea.x + barArea.w, by + barH - 2);
        });
    },

    _renderSummaryCards(ok, excedente, faltante, apenasRef, apenasDoc, prefix) {
        const activeFilter = prefix === 'agg' ? this._aggStatusFilter : this._multiStatusFilter;
        const makeCard = (label, value, status, bg, border, color, txtColor) => {
            const active = activeFilter === status;
            return `<div onclick="app.comparacaoDocumentos.${prefix === 'agg' ? '_aggFilterByStatus' : '_multiFilterByStatus'}('${status}')"
                        style="background:${active ? color : bg};border:${active ? '2px solid ' + color : '1px solid ' + border};border-radius:8px;padding:8px 14px;text-align:center;cursor:pointer;transition:all 0.15s;${active ? 'box-shadow:0 0 0 2px ' + color + '40;' : ''}"
                        title="Clique para filtrar">
                        <div style="font-size:20px;font-weight:700;color:${active ? 'white' : color};">${value}</div>
                        <div style="font-size:11px;color:${active ? 'rgba(255,255,255,0.9)' : txtColor};">${label}</div>
                    </div>`;
        };
        return `<div style="flex:1;min-width:0;">
                    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
                        ${makeCard('OK', ok, 'ok', '#f0fdf4', '#bbf7d0', '#16a34a', '#166534')}
                        ${makeCard('Excedente', excedente, 'excedente', '#fefce8', '#fde68a', '#f59e0b', '#92400e')}
                        ${makeCard('Faltante', faltante, 'faltante', '#fef2f2', '#fecaca', '#ef4444', '#991b1b')}
                        ${makeCard('Só Ref', apenasRef, 'apenas_documento', '#eff6ff', '#bfdbfe', '#3b82f6', '#1e40af')}
                        ${makeCard('Só Docs', apenasDoc, 'apenas_levantamento', '#f5f3ff', '#ddd6fe', '#8b5cf6', '#5b21b6')}
                        ${activeFilter ? `<button class="btn btn-ghost btn-sm" onclick="app.comparacaoDocumentos.${prefix === 'agg' ? '_aggFilterByStatus' : '_multiFilterByStatus'}(null)" style="font-size:10px;color:#64748b;padding:4px 6px;" title="Limpar filtro"><i class="ph ph-x"></i></button>` : ''}
                    </div>
                </div>`;
    },

    _aggFilterByStatus(status) {
        this._aggStatusFilter = status === this._aggStatusFilter ? null : status;
        this._renderAggregateResult();
    },

    _multiFilterByStatus(status) {
        this._multiStatusFilter = status === this._multiStatusFilter ? null : status;
        this._renderMultiMatchResult();
    },

    _updateAggQtd(idx, field, val) {
        const pair = this._multiResults.compareDocs[0];
        const r = pair.results[idx];
        if (!r) return;
        const v = parseFloat(val) || 0;
        if (field === 'doc') r.qtd_documento = v;
        else if (field === 'lev') r.qtd_levantamento = v;
        r.diferenca = (r.qtd_levantamento || 0) - (r.qtd_documento || 0);
        r.percentual = r.qtd_documento ? Math.round((r.diferenca / r.qtd_documento) * 100) : 0;
        this._saveCache();
        this._renderAggregateResult();
    },

    _updateMultiQtd(origIdx, pi, val) {
        const unifiedRows = computeUnifiedTable(this._multiResults.refDoc.items || [], this._multiResults.compareDocs);
        const row = unifiedRows.rows[origIdx];
        if (!row) return;
        const v = parseFloat(val) || 0;
        if (pi < 0) {
            row.refQtd = v;
        } else {
            const comp = row.comparisons.find(c => c.pairIndex === pi);
            if (comp) {
                comp.qtd = v;
                comp.diff = (comp.qtd || 0) - (row.refQtd || 0);
            }
        }
        const compareDoc = pi >= 0 ? this._multiResults.compareDocs[pi] : null;
        if (compareDoc) {
            const result = compareDoc.results[origIdx];
            if (result) {
                const actualQtd = v;
                result.qtd_levantamento = actualQtd;
                result.diferenca = (result.qtd_levantamento || 0) - (result.qtd_documento || 0);
            }
        }
        if (pi < 0) {
            this._multiResults.compareDocs.forEach(cd => {
                const result = cd.results[origIdx];
                if (result) {
                    result.qtd_documento = v;
                    result.diferenca = (result.qtd_levantamento || 0) - (result.qtd_documento || 0);
                }
            });
        }
        this._saveCache();
        this._renderMultiMatchResult();
    },

    _openRematch(idx) {
        const pair = this._multiResults.compareDocs[0];
        const unpaired = pair.results.filter(r => r.status === 'apenas_levantamento');
        if (unpaired.length === 0) {
            window.app.toast('Nenhum item órfão disponível para vincular.', 'info');
            return;
        }
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:12px;width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:15px;font-weight:700;"><i class="ph ph-link"></i> Vincular Item</h3>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('#comp-rematch-overlay').remove()" style="font-size:18px;padding:4px 8px;">&times;</button>
                </div>
                <div style="padding:16px 20px;">
                    <p style="font-size:12px;color:#475569;margin:0 0 12px;">Selecione o item do documento comparado para vincular a <strong>${this._esc(pair.results[idx]?.descricao || '')}</strong>:</p>
                    ${unpaired.map((r, i) => `
                        <div style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:#fafbfc;"
                             onclick="app.comparacaoDocumentos._doRematch(${idx},${pair.results.indexOf(r)});this.closest('#comp-rematch-overlay').remove()">
                            <div>
                                <div style="font-weight:600;font-size:12px;">${this._esc(r.descricao)}</div>
                                <div style="font-size:11px;color:#94a3b8;">${r.unidade || 'un'} · qtd: ${r.qtd_levantamento || 0}</div>
                            </div>
                            <i class="ph ph-arrow-circle-right" style="color:#3b82f6;font-size:18px;"></i>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        overlay.id = 'comp-rematch-overlay';
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    },

    _doRematch(refIdx, orphanIdx) {
        const pair = this._multiResults.compareDocs[0];
        const refItem = pair.results[refIdx];
        const orphanItem = pair.results[orphanIdx];
        if (!refItem || !orphanItem) return;
        refItem.qtd_levantamento = orphanItem.qtd_levantamento || 0;
        refItem.unidade = orphanItem.unidade || refItem.unidade;
        refItem.diferenca = (refItem.qtd_levantamento || 0) - (refItem.qtd_documento || 0);
        refItem.percentual = refItem.qtd_documento ? Math.round((refItem.diferenca / refItem.qtd_documento) * 100) : 0;
        if (refItem.diferenca > 0) refItem.status = 'excedente';
        else if (refItem.diferenca < 0) refItem.status = 'faltante';
        else refItem.status = 'ok';
        refItem.matched = true;
        refItem.match_score = 1;
        pair.results.splice(orphanIdx, 1);
        window.app.toast('Itens vinculados manualmente!', 'success');
        this._saveCache();
        this._renderAggregateResult();
    },

    _exportCsv() {
        const mr = this._multiResults;
        if (!mr) { window.app.toast('Nada para exportar.', 'warning'); return; }
        const pair = mr.compareDocs[0];
        const results = pair.results;
        let csv = '\uFEFF"Descrição";"UN";"Ref";"Doc";"Diferença";"%";"Status";"Match";"Preço (R$)";"Dif. Total (R$)"\n';
        results.forEach(r => {
            const diff = r.diferenca || 0;
            const preco = this._getItemPreco(r.descricao);
            const difTotal = diff * preco;
            const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
            csv += [
                esc(r.descricao), esc(r.unidade || 'un'), r.qtd_documento || 0, r.qtd_levantamento || 0,
                diff, r.percentual || 0, esc(r.status || ''), r.match_score ? (r.match_score * 100).toFixed(0) + '%' : '',
                preco.toFixed(2), difTotal.toFixed(2)
            ].join(';') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'comparacao.csv'; a.click();
        URL.revokeObjectURL(url);
        window.app.toast('CSV exportado!', 'success');
    },

    _saveCache() {
        try {
            const mr = this._multiResults;
            if (mr) localStorage.setItem('comp_last_session', JSON.stringify({
                multiResults: mr,
                defaultPreco: this._defaultPreco,
                timestamp: Date.now()
            }));
        } catch (e) {}
    },

    _loadCache() {
        try {
            const raw = localStorage.getItem('comp_last_session');
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data.multiResults || !data.timestamp) return false;
            if (Date.now() - data.timestamp > 86400000) { localStorage.removeItem('comp_last_session'); return false; }
            this._multiResults = data.multiResults;
            this._defaultPreco = data.defaultPreco || 0;
            this._mode = 'result';
            this._aggExcluded = new Set();
            this._multiExcluded = new Set();
            this._aggSearch = '';
            this._multiSearch = '';
            return true;
        } catch (e) { return false; }
    },

    render() {
        this._documents = [];
        this._extractedItems = [];
        this._multiConfig = null;
        this._multiResults = null;
        this._mode = 'upload';
        this._proposalId = null;
        this._searchTerms = '';
        this._prices = new Map();
        this._defaultPreco = 0;
        this._aggSortBy = '';
        this._aggSortDir = 'asc';
        this._aggSearch = '';
        this._aggExcluded = new Set();
        this._aggStatusFilter = null;
        this._multiSearch = '';
        this._multiExcluded = new Set();
        this._multiSortDir = 'asc';
        this._multiStatusFilter = null;
        if (this._loadCache()) {
            if (this._multiResults.viewMode === 'individual') {
                this._renderMultiMatchResult();
            } else {
                this._renderAggregateResult();
            }
            return;
        }
        this._renderUpload();
    },

    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
};

function extractCableSpec(desc) {
    if (!desc) return null;
    const s = String(desc).toLowerCase().replace(/\s+/g, ' ').trim();
    const accessoryTerms = /\b(terminal|conector|luva|emenda|pino|ilha|plug|soquete)\b/i;
    if (accessoryTerms.test(s)) return null;
    const secaoMatch = s.match(/(\d+[,.]?\d*)\s*mm[²2]/i);
    const secao = secaoMatch ? parseFloat(secaoMatch[1].replace(',', '.')) : null;
    const material = /cobre/i.test(s) ? 'cobre' : /aluminio|alumínio/i.test(s) ? 'aluminio' : null;
    const multCond = s.match(/(\d+)\s*x\s*(\d+[,.]?\d*)\s*mm/i);
    const nConds = multCond ? parseInt(multCond[1]) : (s.match(/multipolar|singelo/i) ? (/(\d+)\s*x\s*\d+/i.test(s) ? parseInt(s.match(/(\d+)\s*x\s*\d+/i)[1]) : 1) : null);
    const tensaoMatch = s.match(/(\d+[,.]?\d*)\s*\/\s*(\d+)\s*kv/i);
    const tensao = tensaoMatch ? `${tensaoMatch[1].replace(',', '.')}/${tensaoMatch[2]}kV` : null;
    const caboTipo = s.match(/(\d+)x(\d+)\/c#([\d,]+)/i);
    if (caboTipo) {
        return { secao: parseFloat(caboTipo[3].replace(',', '.')), material: 'cobre', nConds: parseInt(caboTipo[2]), tensao: null };
    }
    return { secao, material, nConds, tensao };
}

function cableSpecScore(descA, descB) {
    const sa = extractCableSpec(descA);
    const sb = extractCableSpec(descB);
    if (!sa || !sb) return 0;
    let score = 0;
    if (sa.secao && sb.secao) {
        const ratio = Math.abs(sa.secao - sb.secao) / Math.max(sa.secao, sb.secao);
        if (ratio <= 0.1) score += 0.5;
    }
    if (sa.material && sb.material && sa.material === sb.material) score += 0.3;
    if (sa.nConds != null && sb.nConds != null) {
        if (sa.nConds !== sb.nConds) return 0;
        score += 0.15;
    }
    if (sa.tensao && sb.tensao && sa.tensao === sb.tensao) score += 0.15;
    return Math.min(score, 1);
}

function codeScore(a, b) {
    if (!a || !b) return 0;
    const na = String(a).toLowerCase().trim();
    const nb = String(b).toLowerCase().trim();
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) return 0.6;
    return 0;
}

function unitPenalty(unA, unB) {
    if (!unA || !unB) return 0;
    const na = String(unA).toLowerCase().trim();
    const nb = String(unB).toLowerCase().trim();
    if (na === nb) return 0;
    const equivalentes = { 'm': ['metros', 'metro'], 'un': ['unidade', 'und', 'pc', 'pç', 'unid'], 'kg': ['quilograma', 'quilo'], 'm2': ['m²', 'metro2'], 'm3': ['m³', 'metro3'] };
    for (const [canon, vars] of Object.entries(equivalentes)) {
        if ((na === canon || vars.includes(na)) && (nb === canon || vars.includes(nb))) return 0;
    }
    return -0.3;
}

function suggestMatching(itemsA, itemsB) {
    const matches = [];
    const usedB = new Set();

    function normalize(s) {
        if (!s) return '';
        return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ');
    }

    function textScore(a, b) {
        const na = normalize(a);
        const nb = normalize(b);
        const aWords = na.split(/\s+/).filter(w => w.length > 2);
        const bWords = nb.split(/\s+/).filter(w => w.length > 2);
        if (aWords.length === 0 || bWords.length === 0) return 0;
        let hits = 0;
        for (const w of aWords) {
            if (bWords.some(bw => bw.includes(w) || w.includes(bw))) hits++;
        }
        return hits / Math.max(aWords.length, bWords.length);
    }

    function isCableItem(item) {
        const spec = extractCableSpec(item.descricao);
        return !!(spec && spec.secao);
    }

    function multiFieldScore(a, b) {
        const descA = a.descricao || '';
        const descB = b.descricao || '';
        const aIsCable = isCableItem(a);
        const bIsCable = isCableItem(b);

        let descScore;
        if (aIsCable && bIsCable) {
            descScore = cableSpecScore(descA, descB);
        } else if (!aIsCable && !bIsCable) {
            descScore = textScore(descA, descB);
        } else {
            descScore = 0;
        }

        const codScore = codeScore(a.codigo, b.codigo);
        const unPen = unitPenalty(a.un, b.un);

        return {
            total: descScore * 0.6 + codScore * 0.4 + unPen,
            descScore,
            codScore,
            unMismatch: unPen < 0
        };
    }

    for (let i = 0; i < itemsA.length; i++) {
        const a = itemsA[i];
        if (!a.descricao) continue;
        let bestResult = null;
        let bestJ = -1;
        for (let j = 0; j < itemsB.length; j++) {
            if (usedB.has(j)) continue;
            const b = itemsB[j];
            if (!b.descricao) continue;
            const r = multiFieldScore(a, b);
            if (!bestResult || r.total > bestResult.total) {
                bestResult = r;
                bestJ = j;
            }
        }
        const threshold = 0.3;
        if (bestJ >= 0 && bestResult && bestResult.total >= threshold) {
            usedB.add(bestJ);
            matches.push({
                itemA: itemsA[i],
                itemB: itemsB[bestJ],
                score: Math.round(Math.max(0, bestResult.total) * 100) / 100,
                matched: true,
                unMismatch: bestResult.unMismatch
            });
        } else {
            matches.push({
                itemA: itemsA[i],
                itemB: null,
                score: 0,
                matched: false,
                unMismatch: false
            });
        }
    }

    for (let j = 0; j < itemsB.length; j++) {
        if (!usedB.has(j)) {
            matches.push({
                itemA: null,
                itemB: itemsB[j],
                score: 0,
                matched: false,
                unMismatch: false
            });
        }
    }

    return matches;
}

function calculateDiff(matches) {
    return matches.map(m => {
        if (!m.itemA && !m.itemB) return null;
        const qtdDoc = m.itemA?.qtd || 0;
        const qtdLev = m.itemB?.qtd || 0;
        const diff = qtdDoc - qtdLev;
        const pct = qtdLev > 0 ? Math.round((diff / qtdLev) * 10000) / 100 : (diff !== 0 ? (diff > 0 ? 100 : -100) : 0);
        let status = 'ok';
        if (!m.itemB) status = 'apenas_documento';
        else if (!m.itemA) status = 'apenas_levantamento';
        else if (diff > 0) status = 'excedente';
        else if (diff < 0) status = 'faltante';
        return {
            descricao: m.itemA?.descricao || m.itemB?.descricao || '',
            unidade: m.itemA?.un || m.itemB?.un || 'un',
            qtd_documento: qtdDoc,
            qtd_levantamento: qtdLev,
            diferenca: diff,
            percentual: pct,
            status,
            matched: m.matched !== false,
            match_score: m.score || 0,
            un_match: m.itemA && m.itemB ? (m.itemA.un || '') === (m.itemB.un || '') : true,
            un_mismatch: m.unMismatch || false
        };
    }).filter(Boolean);
}

function mergeItems(docs) {
    const merged = [];

    function normalize(s) {
        if (!s) return '';
        return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ');
    }

    function fuzzyScore(a, b) {
        const na = normalize(a);
        const nb = normalize(b);
        const aWords = na.split(/\s+/).filter(w => w.length > 2);
        const bWords = nb.split(/\s+/).filter(w => w.length > 2);
        if (aWords.length === 0 || bWords.length === 0) return 0;
        let hits = 0;
        for (const w of aWords) {
            if (bWords.some(bw => bw.includes(w) || w.includes(bw))) hits++;
        }
        return hits / Math.max(aWords.length, bWords.length);
    }

    for (const doc of docs) {
        for (const item of doc.items) {
            if (!item.descricao) {
                merged.push({ descricao: item.codigo || 'Item sem descrição', codigo: item.codigo || '', qtd: item.qtd || 0, un: item.un || 'un', _sources: [doc.label] });
                continue;
            }
            let found = false;
            for (const existing of merged) {
                if (existing.descricao && fuzzyScore(item.descricao, existing.descricao) >= 0.7) {
                    existing.qtd = (existing.qtd || 0) + (item.qtd || 0);
                    existing._sources = existing._sources || [];
                    if (!existing._sources.includes(doc.label)) existing._sources.push(doc.label);
                    found = true;
                    break;
                }
            }
            if (!found) {
                merged.push({ descricao: item.descricao, codigo: item.codigo || '', qtd: item.qtd || 0, un: item.un || 'un', _sources: [doc.label] });
            }
        }
    }

    return merged;
}

function computeUnifiedTable(refItems, compareDocs) {
    const rows = [];
    const seenOrphans = new Set();

    for (const refItem of refItems) {
        const desc = refItem.descricao || refItem.codigo || '';
        if (!desc) continue;
        const comparisons = compareDocs.map((cd, pi) => {
            const match = cd.matches.find(m => m.itemA && (m.itemA === refItem || m.itemA.descricao === desc));
            if (match && match.itemB) {
                const qtd = match.itemB.qtd || 0;
                const refQtd = refItem.qtd || 0;
                return {
                    label: cd.label,
                    pairIndex: pi,
                    qtd,
                    diff: refQtd - qtd,
                    pct: qtd > 0 ? Math.round(((refQtd - qtd) / qtd) * 10000) / 100 : (refQtd !== qtd ? (refQtd > qtd ? 100 : -100) : 0),
                    matchScore: match.score || 0,
                    unMismatch: match.unMismatch || false
                };
            }
            return { label: cd.label, pairIndex: pi, qtd: null, diff: null, pct: null, matchScore: 0, unMismatch: false };
        });
        rows.push({
            descricao: desc,
            un: refItem.un || 'un',
            refQtd: refItem.qtd || 0,
            comparisons
        });
    }

    const orphanRows = [];
    for (const cd of compareDocs) {
        for (const match of cd.matches) {
            if (!match.itemA && match.itemB) {
                const key = match.itemB.descricao || match.itemB.codigo || '';
                if (seenOrphans.has(key)) continue;
                seenOrphans.add(key);
                const comparisons = compareDocs.map((ocd, opi) => {
                    if (ocd === cd) {
                        return { label: ocd.label, pairIndex: opi, qtd: match.itemB.qtd || 0, diff: null, pct: null };
                    }
                    return { label: ocd.label, pairIndex: opi, qtd: null, diff: null, pct: null };
                });
                orphanRows.push({
                    descricao: match.itemB.descricao || match.itemB.codigo || '',
                    un: match.itemB.un || 'un',
                    refQtd: null,
                    comparisons,
                    _isOrphan: true
                });
            }
        }
    }

    return { rows, orphanRows };
}

ComparacaoDocumentosModule.init();
