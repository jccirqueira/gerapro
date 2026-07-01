import { store } from './state.js';

const ComposicoesModule = {
    init() {
        window.app.composicoes = {
            render: this.render.bind(this),
            resetView: this.resetView.bind(this),
            openNewModal: this.openNewModal.bind(this),
            edit: this.edit.bind(this),
            remove: this.remove.bind(this),
            save: this.save.bind(this),
            closeModal: this.closeModal.bind(this),
            filtrar: this.filtrar.bind(this),
            importarCSV: this.importarCSV.bind(this),
            handleImportFile: this.handleImportFile.bind(this),
            processarImportacao: this.processarImportacao.bind(this)
        };

        this.viewMode = 'list';
        this.currentFilter = { query: '', grupo: '', area: '' };

        store.subscribe((state) => {
            if (this.viewMode === 'list') {
                const container = document.getElementById('view-composicoes');
                if (container && !container.classList.contains('hidden-module')) {
                    this.renderList(state.composicoes);
                }
            }
        });
    },

    resetView() {
        this.viewMode = 'list';
    },

    getBaseHTML() {
        const grupos = ['Estrutura', 'Elétrica', 'Montagem', 'Testes', 'Projeto', 'Automação', 'Pintura', 'Expedição'];
        return `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-wrench"></i> Composições de Mão de Obra
                        </h2>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Catálogo de atividades com coeficientes de horas-homem</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${store.canEdit() ? `
                            <button class="btn btn-sm btn-ghost" onclick="app.composicoes.importarCSV()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
                                <i class="ph ph-file-csv"></i> Importar
                            </button>
                            <button class="btn btn-sm btn-ghost" onclick="app.composicoes.openNewModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
                                <i class="ph ph-plus"></i> Nova Composição
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div style="position: relative; flex: 1; min-width: 250px;">
                            <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            <input type="text" class="form-control" placeholder="Buscar por atividade, código ou profissional..." style="padding-left: 38px;" oninput="app.composicoes.filtrar()">
                        </div>
                        <select class="form-control" style="width: 180px;" onchange="app.composicoes.filtrar()" id="comp-filtro-grupo">
                            <option value="">Todos os Grupos</option>
                            ${grupos.map(g => `<option value="${g}">${g}</option>`).join('')}
                        </select>
                        <select class="form-control" style="width: 180px;" onchange="app.composicoes.filtrar()" id="comp-filtro-area">
                            <option value="">Todas as Áreas</option>
                            <option value="Engenharia">Engenharia</option>
                            <option value="Montagem">Montagem</option>
                        </select>
                        <button class="btn btn-secondary btn-sm" onclick="app.composicoes.filtrar(true)">Limpar</button>
                    </div>

                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-container">
                            <table id="composicoes-table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Atividade</th>
                                        <th>Unid.</th>
                                        <th>Grupo</th>
                                        <th>Profissional</th>
                                        <th>Coef. HH</th>
                                        <th>Área</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    render() {
        if (this.viewMode === 'form' || this.viewMode === 'import') return;
        const container = document.getElementById('view-composicoes');
        if (!container) return;
        container.innerHTML = this.getBaseHTML();
        this.renderList(store.getState().composicoes);
    },

    renderList(composicoes) {
        const tbody = document.querySelector('#composicoes-table tbody');
        if (!tbody) return;

        if (!composicoes || composicoes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma composição cadastrada. Clique em "Nova Composição" para começar.</td></tr>`;
            return;
        }

        const { query, grupo, area } = this.currentFilter;
        const filtered = composicoes.filter(c => {
            const matchQuery = !query ||
                (c.atividade && c.atividade.toLowerCase().includes(query)) ||
                (c.codigo && c.codigo.toLowerCase().includes(query)) ||
                (c.categoria_profissional && c.categoria_profissional.toLowerCase().includes(query));
            const matchGrupo = !grupo || c.grupo === grupo;
            const matchArea = !area || c.area_alocacao === area;
            return matchQuery && matchGrupo && matchArea;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma composição encontrada com os filtros atuais.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(c => `
            <tr>
                <td><span style="font-family: monospace; font-weight: 600;">${c.codigo || '-'}</span></td>
                <td>
                    <div style="font-weight: 500;">${c.atividade || '-'}</div>
                    <div class="text-xs text-muted">${c.unidade || ''}</div>
                </td>
                <td>${c.unidade || '-'}</td>
                <td><span class="status-badge" style="background: #e0f2fe; color: #0369a1;">${c.grupo || '-'}</span></td>
                <td>${c.categoria_profissional || '-'}</td>
                <td style="font-weight: 700; color: var(--color-primary);">${(c.coeficiente_hh || 0).toFixed(2)} h</td>
                <td><span class="status-badge" style="background: ${c.area_alocacao === 'Engenharia' ? '#fef3c7' : '#dcfce7'}; color: ${c.area_alocacao === 'Engenharia' ? '#92400e' : '#15803d'};">${c.area_alocacao || '-'}</span></td>
                <td>
                    ${store.canEdit() ? `<button class="btn btn-ghost" style="padding: 4px;" onclick="app.composicoes.edit('${c.id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>` : ''}
                    ${store.canDelete() ? `<button class="btn btn-ghost" style="padding: 4px; color: var(--color-danger);" onclick="app.composicoes.remove('${c.id}')" title="Excluir"><i class="ph ph-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    filtrar(clear = false) {
        if (clear) {
            this.currentFilter = { query: '', grupo: '', area: '' };
            const input = document.querySelector('#composicoes-table').closest('div').parentElement?.querySelector('input');
            if (input) input.value = '';
            document.getElementById('comp-filtro-grupo').value = '';
            document.getElementById('comp-filtro-area').value = '';
        } else {
            const input = document.querySelector('#composicoes-table').closest('div').parentElement?.parentElement?.querySelector('input');
            this.currentFilter = {
                query: input?.value?.toLowerCase() || '',
                grupo: document.getElementById('comp-filtro-grupo')?.value || '',
                area: document.getElementById('comp-filtro-area')?.value || ''
            };
        }
        this.renderList(store.getState().composicoes);
    },

    openNewModal() {
        this.viewMode = 'form';
        this.render();
        this.renderModal();
    },

    edit(id) {
        const item = store.getState().composicoes.find(c => c.id === id);
        if (item) {
            this.viewMode = 'form';
            this.render();
            this.renderModal(item);
        }
    },

    closeModal() {
        this.viewMode = 'list';
        this.render();
    },

    renderModal(data = {}) {
        const isEdit = !!data.id;
        const grupos = ['Estrutura', 'Elétrica', 'Montagem', 'Testes', 'Projeto', 'Automação', 'Pintura', 'Expedição'];
        const profissionais = ['Montador', 'Eletricista', 'Barramentista', 'Técnico', 'Projetista', 'Engenheiro', 'Auxiliar', 'Pintor'];
        const unidades = ['un', 'm', 'kg', 'h', 'ponto', 'conjunto', 'metro'];

        const html = `
            <div id="form-composicao-container" class="fade-in" style="background: white; min-height: 100%; display: flex; flex-direction: column;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <div>
                            <button class="btn btn-ghost" onclick="app.composicoes.closeModal()" style="margin-right: 10px; padding: 4px 8px;">
                                <i class="ph ph-arrow-left"></i> Voltar
                            </button>
                            <h3 class="card-title" style="display: inline-block;">${isEdit ? 'Editar Composição' : 'Nova Composição'}</h3>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-cancel" onclick="app.composicoes.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="app.composicoes.save()"><i class="ph ph-check"></i> ${isEdit ? 'Atualizar' : 'Salvar'}</button>
                        </div>
                    </div>

                    <div style="padding: 20px; flex: 1; overflow-y: auto;">
                        <form id="form-composicao">
                            <input type="hidden" name="id" value="${data.id || ''}">

                            <div class="row" style="display: flex; gap: 16px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Código</label>
                                    <input type="text" name="codigo" class="form-control" value="${data.codigo || ''}" placeholder="Ex: C001">
                                </div>
                                <div class="form-group" style="flex: 2;">
                                    <label class="form-label">Atividade *</label>
                                    <input type="text" name="atividade" class="form-control" value="${data.atividade || ''}" placeholder="Ex: Montagem de barramento de cobre" required>
                                </div>
                            </div>

                            <div class="row" style="display: flex; gap: 16px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Unidade</label>
                                    <select name="unidade" class="form-control">
                                        ${unidades.map(u => `<option value="${u}" ${data.unidade === u ? 'selected' : ''}>${u}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Grupo</label>
                                    <select name="grupo" class="form-control">
                                        <option value="">Selecione...</option>
                                        ${grupos.map(g => `<option value="${g}" ${data.grupo === g ? 'selected' : ''}>${g}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Profissional</label>
                                    <select name="categoria_profissional" class="form-control">
                                        <option value="">Selecione...</option>
                                        ${profissionais.map(p => `<option value="${p}" ${data.categoria_profissional === p ? 'selected' : ''}>${p}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="row" style="display: flex; gap: 16px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Coeficiente HH *</label>
                                    <input type="number" step="0.01" name="coeficiente_hh" class="form-control" value="${data.coeficiente_hh || ''}" placeholder="Horas por unidade">
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">Área de Alocação</label>
                                    <select name="area_alocacao" class="form-control">
                                        <option value="">Selecione...</option>
                                        <option value="Engenharia" ${data.area_alocacao === 'Engenharia' ? 'selected' : ''}>Engenharia</option>
                                        <option value="Montagem" ${data.area_alocacao === 'Montagem' ? 'selected' : ''}>Montagem</option>
                                    </select>
                                </div>
                            </div>

                            <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <h4 style="margin: 0 0 12px; font-size: 13px; color: #475569; font-weight: 700;">Fatores de Complexidade</h4>
                                <div class="row" style="display: flex; gap: 16px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Simples (fator)</label>
                                        <input type="number" step="0.01" name="fator_simples" class="form-control" value="${data.fator_simples ?? '0.8'}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Médio (fator)</label>
                                        <input type="number" step="0.01" name="fator_medio" class="form-control" value="${data.fator_medio ?? '1.0'}">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">Complexo (fator)</label>
                                        <input type="number" step="0.01" name="fator_complexo" class="form-control" value="${data.fator_complexo ?? '1.3'}">
                                    </div>
                                </div>
                                <div class="text-xs text-muted" style="margin-top: 8px;">Multiplicadores aplicados ao coeficiente HH base conforme a complexidade do equipamento.</div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('view-composicoes');
        if (container) container.innerHTML = html;
    },

    async save() {
        const form = document.getElementById('form-composicao');
        if (!form) return;

        const formData = new FormData(form);
        const obj = {};
        for (const [key, val] of formData.entries()) {
            obj[key] = val;
        }

        if (!obj.atividade) {
            app.toast('A atividade é obrigatória.', 'error');
            return;
        }
        if (!obj.coeficiente_hh || parseFloat(obj.coeficiente_hh) <= 0) {
            app.toast('O coeficiente HH deve ser maior que zero.', 'error');
            return;
        }

        obj.coeficiente_hh = parseFloat(obj.coeficiente_hh) || 0;
        obj.fator_simples = parseFloat(obj.fator_simples) || 0.8;
        obj.fator_medio = parseFloat(obj.fator_medio) || 1.0;
        obj.fator_complexo = parseFloat(obj.fator_complexo) || 1.3;

        let ok;
        if (obj.id) {
            ok = await store.updateComposicao(obj.id, obj);
        } else {
            delete obj.id;
            ok = await store.addComposicao(obj);
        }

        if (!ok) {
            app.toast('Erro ao salvar. Verifique se o servidor está rodando.', 'error');
            return;
        }

        this.closeModal();
        app.toast('Composição salva com sucesso!', 'success');
    },

    async remove(id) {
        if (await window.app.confirm('Remover esta composição?')) {
            const ok = await store.deleteComposicao(id);
            if (!ok) {
                window.app.toast('Erro ao remover. Verifique se o servidor está rodando.', 'error');
                return;
            }
            window.app.toast('Composição removida.', 'info');
        }
    },

    // --- Importação CSV/Excel ---

    importarCSV() {
        this.viewMode = 'import';
        this.render();
        const container = document.getElementById('view-composicoes');
        if (!container) return;

        container.innerHTML = `
            <div style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px;">
                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">
                    <div>
                        <button class="btn btn-ghost" onclick="app.composicoes.render()" style="margin-right: 10px; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 4px 12px;">
                            <i class="ph ph-arrow-left"></i> Voltar
                        </button>
                        <span style="font-size: 20px; font-weight: 800;">Importar Composições</span>
                    </div>
                </div>

                <div style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 40px; text-align: center; margin-bottom: 24px;">
                        <i class="ph ph-file-csv" style="font-size: 48px; color: #94a3b8; margin-bottom: 16px;"></i>
                        <h4 style="margin: 0; color: var(--color-accent); font-weight: 700;">Importar Planilha de Composições</h4>
                        <p class="text-xs text-muted" style="margin: 8px 0 16px;">Formatos: .csv, .xlsx, .xls</p>
                        <p class="text-xs text-muted" style="margin-bottom: 16px;">Colunas esperadas: <b>codigo</b>, <b>atividade</b>, <b>unidade</b>, <b>grupo</b>, <b>categoria_profissional</b>, <b>coeficiente_hh</b>, <b>area_alocacao</b></p>
                        <label class="btn btn-secondary" style="background: var(--color-accent); color: white; border: none; padding: 10px 24px; cursor: pointer;">
                            Escolher Arquivo
                            <input type="file" id="comp-file-import" accept=".csv, .xlsx, .xls" style="display: none;" onchange="app.composicoes.handleImportFile(event)">
                        </label>
                    </div>
                    <div id="comp-import-preview" style="display: none;"></div>
                </div>
            </div>
        `;
    },

    handleImportFile(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                let rows = [];

                if (file.name.endsWith('.csv')) {
                    rows = this.parseCSV(data);
                } else {
                    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(sheet);
                    rows = json.map(r => ({
                        codigo: String(r.codigo || r.Codigo || r.CÓDIGO || r.Cod || ''),
                        atividade: String(r.atividade || r.Atividade || r.ATIVIDADE || r.Descricao || r.Descrição || ''),
                        unidade: String(r.unidade || r.Unidade || r.UNIDADE || r.Unid || ''),
                        grupo: String(r.grupo || r.Grupo || r.GRUPO || ''),
                        categoria_profissional: String(r.categoria_profissional || r.Categoria_Profissional || r.PROFISSIONAL || r.Profissional || ''),
                        coeficiente_hh: parseFloat(r.coeficiente_hh || r.Coeficiente_HH || r.HH || r.coeficiente || 0) || 0,
                        area_alocacao: String(r.area_alocacao || r.Area_Alocacao || r.ÁREA || r.Area || '')
                    }));
                }

                this.previewImport(rows);
            } catch (err) {
                console.error(err);
                app.toast('Erro ao ler arquivo: ' + err.message, 'error');
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    },

    parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
        const colMap = {};
        headers.forEach((h, i) => {
            if (h.includes('cod') || h === 'codigo') colMap.codigo = i;
            else if (h.includes('ativ') || h === 'atividade') colMap.atividade = i;
            else if (h.includes('unid') || h === 'unidade') colMap.unidade = i;
            else if (h.includes('grupo')) colMap.grupo = i;
            else if (h.includes('prof') || h.includes('categ')) colMap.categoria_profissional = i;
            else if (h.includes('coef') || h.includes('hh')) colMap.coeficiente_hh = i;
            else if (h.includes('area') || h.includes('aloc')) colMap.area_alocacao = i;
        });

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
            if (vals.length < 2) continue;
            rows.push({
                codigo: colMap.codigo !== undefined ? vals[colMap.codigo] : '',
                atividade: colMap.atividade !== undefined ? vals[colMap.atividade] : '',
                unidade: colMap.unidade !== undefined ? vals[colMap.unidade] : '',
                grupo: colMap.grupo !== undefined ? vals[colMap.grupo] : '',
                categoria_profissional: colMap.categoria_profissional !== undefined ? vals[colMap.categoria_profissional] : '',
                coeficiente_hh: parseFloat((colMap.coeficiente_hh !== undefined ? vals[colMap.coeficiente_hh] : '0').replace(',', '.')) || 0,
                area_alocacao: colMap.area_alocacao !== undefined ? vals[colMap.area_alocacao] : ''
            });
        }
        return rows;
    },

    previewImport(rows) {
        const container = document.getElementById('comp-import-preview');
        if (!container) return;

        container.style.display = 'block';
        container.innerHTML = `
            <div class="card" style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h4 style="margin: 0; font-size: 15px; color: var(--color-primary);">
                        <i class="ph ph-eye"></i> Pré-visualização (${rows.length} linhas)
                    </h4>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-cancel" onclick="app.composicoes.importarCSV()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.composicoes.processarImportacao()">
                            <i class="ph ph-check"></i> Importar ${rows.length} Composições
                        </button>
                    </div>
                </div>
                <div class="table-container" style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <table style="font-size: 12px;">
                        <thead style="background: #f1f5f9; position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 8px;">Código</th>
                                <th style="padding: 8px;">Atividade</th>
                                <th style="padding: 8px;">Unid.</th>
                                <th style="padding: 8px;">Grupo</th>
                                <th style="padding: 8px;">Profissional</th>
                                <th style="padding: 8px;">HH</th>
                                <th style="padding: 8px;">Área</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 6px; font-family: monospace;">${r.codigo || '-'}</td>
                                    <td style="padding: 6px;">${r.atividade || '-'}</td>
                                    <td style="padding: 6px;">${r.unidade || '-'}</td>
                                    <td style="padding: 6px;">${r.grupo || '-'}</td>
                                    <td style="padding: 6px;">${r.categoria_profissional || '-'}</td>
                                    <td style="padding: 6px; font-weight: 600;">${r.coeficiente_hh}</td>
                                    <td style="padding: 6px;">${r.area_alocacao || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this._importRows = rows;
    },

    async processarImportacao() {
        const rows = this._importRows || [];
        if (rows.length === 0) {
            app.toast('Nenhuma linha para importar.', 'warning');
            return;
        }

        let imported = 0;
        let skipped = 0;

        for (const row of rows) {
            if (!row.atividade || row.coeficiente_hh <= 0) {
                skipped++;
                continue;
            }
            const existing = (store.getState().composicoes || []).find(c =>
                c.codigo === row.codigo && c.codigo
            );
            if (existing) {
                skipped++;
                continue;
            }
            await store.addComposicao({
                codigo: row.codigo || '',
                atividade: row.atividade,
                unidade: row.unidade || 'un',
                grupo: row.grupo || 'Elétrica',
                categoria_profissional: row.categoria_profissional || 'Eletricista',
                coeficiente_hh: row.coeficiente_hh,
                fator_simples: 0.8,
                fator_medio: 1.0,
                fator_complexo: 1.3,
                area_alocacao: row.area_alocacao || 'Montagem'
            });
            imported++;
        }

        this._importRows = null;
        app.toast(`Importação concluída! ${imported} importadas, ${skipped} ignoradas.`, 'success');
        this.render();
    }
};

window.composicoesModule = ComposicoesModule;
ComposicoesModule.init();
