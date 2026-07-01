import { store } from './state.js';

const CAMPOS_CLIENTES = [
    { key: 'razaoSocial', label: 'Razão Social', required: true },
    { key: 'nomeFantasia', label: 'Nome Fantasia', required: false },
    { key: 'cnpj', label: 'CNPJ', required: true },
    { key: 'segmento', label: 'Segmento', required: false },
    { key: 'cnae', label: 'CNAE', required: false },
    { key: 'inscricaoEstadual', label: 'Inscrição Estadual', required: false },
    { key: 'inscricaoMunicipal', label: 'Inscrição Municipal', required: false },
    { key: 'cep', label: 'CEP', required: false },
    { key: 'logradouro', label: 'Logradouro', required: false },
    { key: 'numero', label: 'Número', required: false },
    { key: 'bairro', label: 'Bairro', required: false },
    { key: 'cidade', label: 'Cidade', required: false },
    { key: 'estado', label: 'Estado (UF)', required: false },
    { key: 'contatoNome', label: 'Contato', required: false },
    { key: 'contatoCargo', label: 'Cargo', required: false },
    { key: 'email', label: 'E-mail', required: false },
    { key: 'telefone', label: 'Telefone', required: false },
    { key: 'observacoes', label: 'Observações', required: false }
];

const CAMPOS_FORNECEDORES = CAMPOS_CLIENTES;

const ENTITY_CONFIG = {
    clientes: {
        label: 'Clientes',
        labelSingular: 'cliente',
        campos: CAMPOS_CLIENTES,
        storeData: () => store.getState().clientes || [],
        addMethod: (obj) => store.addClient(obj),
        updateMethod: (id, obj) => store.updateClient(id, obj)
    },
    fornecedores: {
        label: 'Fornecedores',
        labelSingular: 'fornecedor',
        campos: CAMPOS_FORNECEDORES,
        storeData: () => store.getState().fornecedores || [],
        addMethod: (obj) => store.addFornecedor(obj),
        updateMethod: (id, obj) => store.updateFornecedor(id, obj)
    }
};

const _escapeCSV = v => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};

const _formatCNPJ = v => {
    if (!v) return '';
    const d = v.replace(/\D/g, '');
    if (d.length === 14) {
        return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
    }
    return v;
};

const _stripCNPJ = v => {
    if (!v) return '';
    return v.replace(/\D/g, '');
};

const _parseCSV = (text) => {
    text = text.replace(/^\uFEFF/, '');
    const firstLine = text.split('\n')[0];
    const comma = (firstLine.match(/,/g) || []).length;
    const semicolon = (firstLine.match(/;/g) || []).length;
    const delim = semicolon >= comma ? ';' : ',';

    const lines = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === '\r') {
                continue;
            } else if (ch === '\n') {
                lines.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    if (current) lines.push(current);

    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(delim).map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).filter(l => l.trim()).map(l => {
        const vals = l.split(delim).map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
    });
    return { headers, rows };
};

const _detectMapping = (headers, campos) => {
    const map = {};
    const synonyms = {
        'razao social': ['razaoSocial', 'razaosocial', 'razao_social', 'nome', 'empresa'],
        'nome fantasia': ['nomeFantasia', 'nomefantasia', 'nome_fantasia', 'fantasia'],
        'cnpj': ['cnpj', 'cpf', 'cnpj_cpf', 'documento', 'doc'],
        'segmento': ['segmento', 'setor', 'ramo', 'tipo'],
        'cnae': ['cnae', 'cnae_fiscal'],
        'inscricao estadual': ['inscricaoEstadual', 'inscricao_estadual', 'ie', 'inscricaoestadual'],
        'inscricao municipal': ['inscricaoMunicipal', 'inscricao_municipal', 'im', 'inscricaomunicipal'],
        'cep': ['cep', 'codigo_postal', 'postal'],
        'logradouro': ['logradouro', 'endereco', 'rua', 'avenida', 'av'],
        'numero': ['numero', 'número', 'num', 'nro'],
        'bairro': ['bairro', 'distrito'],
        'cidade': ['cidade', 'localidade', 'municipio'],
        'estado': ['estado', 'uf', 'sigla_uf', 'estado_uf'],
        'contato': ['contatoNome', 'contato', 'contatonome', 'contato_nome', 'nome_contato', 'responsavel'],
        'cargo': ['contatoCargo', 'cargo', 'cargocontato', 'cargo_contato'],
        'email': ['email', 'e-mail', 'e_mail', 'correio', 'mail'],
        'telefone': ['telefone', 'tel', 'phone', 'celular', 'cel', 'whatsapp'],
        'observacoes': ['observacoes', 'obs', 'observacao', 'anotacoes', 'notas']
    };

    campos.forEach(c => {
        const lowerLabel = c.label.toLowerCase();
        const syns = synonyms[lowerLabel] || [c.key, c.label];
        let found = null;
        let bestScore = 0;
        for (const h of headers) {
            const hl = h.toLowerCase().trim();
            for (const s of syns) {
                const sl = s.toLowerCase().trim();
                if (hl === sl) { found = h; bestScore = 99; break; }
                if (hl.includes(sl) || sl.includes(hl)) {
                    if (sl.length > bestScore) { found = h; bestScore = sl.length; }
                }
            }
            if (bestScore === 99) break;
        }
        map[c.key] = found;
    });
    return map;
};

const _validateRow = (row, mapping, campos, entityType, existingList) => {
    const errors = [];
    const data = {};

    campos.forEach(c => {
        const header = mapping[c.key];
        if (header) {
            data[c.key] = row[header] || '';
        } else {
            data[c.key] = '';
        }
    });

    if (!data.razaoSocial || !data.razaoSocial.trim()) {
        errors.push('Razão Social é obrigatória');
    }

    const cnpjLimpo = _stripCNPJ(data.cnpj);
    if (!cnpjLimpo) {
        errors.push('CNPJ é obrigatório');
    } else if (cnpjLimpo.length !== 14) {
        errors.push(`CNPJ inválido (${cnpjLimpo.length} dígitos, esperado 14)`);
    }

    if (data.estado && data.estado.length !== 2) {
        errors.push('Estado/UF deve ter 2 caracteres');
    }

    let duplicate = null;
    if (cnpjLimpo) {
        duplicate = existingList.find(e => _stripCNPJ(e.cnpj) === cnpjLimpo);
    }
    if (!duplicate && data.razaoSocial) {
        duplicate = existingList.find(e => e.razaoSocial?.toLowerCase() === data.razaoSocial.trim().toLowerCase());
    }

    const status = errors.length === 0 ? (duplicate ? 'duplicate' : 'valid') : 'error';
    return { data, errors, status, duplicate };
};

const _gerarRelatorioErros = (resultados) => {
    const linhas = resultados
        .filter(r => r.status === 'error')
        .map((r, i) => {
            const linha = i + 2;
            return `Linha ${linha};${_escapeCSV(r.data.razaoSocial || '')};${_escapeCSV(r.data.cnpj || '')};${_escapeCSV(r.errors.join('; '))}`;
        });
    if (linhas.length === 0) return null;
    const header = 'Linha;Razão Social;CNPJ;Erros';
    return '\uFEFF' + header + '\n' + linhas.join('\n');
};

const _downloadBlob = (content, filename, type = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const _today = () => new Date().toISOString().split('T')[0];

const ImportacaoCadastros = {
    downloadModelo(entityType) {
        const config = ENTITY_CONFIG[entityType];
        if (!config) return;
        const campos = config.campos;
        const header = campos.map(c => _escapeCSV(c.label)).join(';');
        const example = {};
        campos.forEach(c => {
            switch (c.key) {
                case 'razaoSocial': example[c.key] = 'Exemplo da Silva Ltda'; break;
                case 'nomeFantasia': example[c.key] = 'Exemplo Comércio'; break;
                case 'cnpj': example[c.key] = '00.000.000/0001-00'; break;
                case 'segmento': example[c.key] = 'Indústria Geral'; break;
                case 'cnae': example[c.key] = '0000-0/00'; break;
                case 'inscricaoEstadual': example[c.key] = '000.000.000.000'; break;
                case 'cep': example[c.key] = '00000-000'; break;
                case 'logradouro': example[c.key] = 'Rua Exemplo'; break;
                case 'numero': example[c.key] = '100'; break;
                case 'bairro': example[c.key] = 'Centro'; break;
                case 'cidade': example[c.key] = 'São Paulo'; break;
                case 'estado': example[c.key] = 'SP'; break;
                case 'contatoNome': example[c.key] = 'João Silva'; break;
                case 'contatoCargo': example[c.key] = 'Gerente'; break;
                case 'email': example[c.key] = 'joao@exemplo.com.br'; break;
                case 'telefone': example[c.key] = '(11) 99999-0000'; break;
                default: example[c.key] = '';
            }
        });
        const line = campos.map(c => _escapeCSV(example[c.key])).join(';');
        const csv = '\uFEFF' + header + '\n' + line + '\n';
        _downloadBlob(csv, `modelo_${entityType}.csv`);
        app.toast(`Modelo CSV para ${config.label} baixado.`, 'success');
    },

    exportarCSV(entityType) {
        const config = ENTITY_CONFIG[entityType];
        if (!config) return;
        const list = config.storeData();
        const campos = config.campos;

        if (list.length === 0) {
            app.toast(`Nenhum ${config.labelSingular} para exportar.`, 'info');
            return;
        }

        const header = campos.map(c => _escapeCSV(c.label)).join(';');
        const rows = list.map(item => {
            return campos.map(c => {
                let val = item[c.key];
                if (c.key === 'cnpj') val = _formatCNPJ(val);
                return _escapeCSV(val ?? '');
            }).join(';');
        });
        const csv = '\uFEFF' + header + '\n' + rows.join('\n') + '\n';
        _downloadBlob(csv, `${entityType}_${_today()}.csv`);
        app.toast(`${list.length} ${config.labelSingular}(es) exportados.`, 'success');
    },

    abrirImportacaoModal(entityType) {
        const config = ENTITY_CONFIG[entityType];
        if (!config) return;

        const existing = document.getElementById('modal-importacao-cadastro');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'modal-importacao-cadastro';
        overlay.className = 'modal-overlay';

        let parsedRows = [];
        let headers = [];
        let mapping = {};
        let resultados = [];
        const campos = config.campos;

        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); width: 900px; max-width: 95vw; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; z-index: 10000;';
        modal._importStep = 1;

        const body = document.createElement('div');
        body.style.cssText = 'flex: 1; overflow-y: auto;';
        modal.appendChild(body);

        const footer = document.createElement('div');
        footer.style.cssText = 'padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;';
        modal.appendChild(footer);

        const renderStep = () => {
            const s = modal._importStep;
            let html = '';
            if (s === 1) html = this._renderUploadStep(config, campos, entityType);
            else if (s === 2) html = this._renderMappingStep(config, campos, headers, mapping);
            else if (s === 3) html = this._renderPreviewStep(config, campos, mapping, parsedRows, resultados);
            else if (s === 4) html = this._renderImportStep(config, entityType, resultados);
            else if (s === 5) html = this._renderResultStep(config, resultados);
            body.innerHTML = html;
        };

        const atualizarBotoes = () => {
            const s = modal._importStep;
            footer.innerHTML = '';
            const left = document.createElement('div');
            const right = document.createElement('div');

            const btnCancelar = document.createElement('button');
            btnCancelar.className = 'btn btn-cancel';
            btnCancelar.textContent = 'Cancelar';
            btnCancelar.onclick = () => overlay.remove();
            left.appendChild(btnCancelar);

            if (s > 1 && s < 5) {
                const btnVoltar = document.createElement('button');
                btnVoltar.className = 'btn btn-secondary';
                btnVoltar.textContent = 'Voltar';
                btnVoltar.style.marginRight = '8px';
                btnVoltar.onclick = () => { modal._importStep--; renderStep(); atualizarBotoes(); };
                right.appendChild(btnVoltar);
            }

            if (s === 2) {
                const requiredOk = campos.filter(c => c.required).every(c => mapping[c.key]);
                const btnAvancar = document.createElement('button');
                btnAvancar.className = 'btn btn-primary';
                btnAvancar.textContent = 'Avançar';
                btnAvancar.style.background = requiredOk ? '#16a34a' : '#94a3b8';
                btnAvancar.disabled = !requiredOk;
                btnAvancar.onclick = () => {
                    body.querySelectorAll('[data-map-key]').forEach(sel => {
                        mapping[sel.dataset.mapKey] = sel.value || null;
                    });
                    resultados = parsedRows.map(row => _validateRow(row, mapping, campos, entityType, config.storeData()));
                    modal._importStep = 3;
                    renderStep();
                    atualizarBotoes();
                };
                right.appendChild(btnAvancar);
            } else if (s === 3) {
                const validCount = resultados.filter(r => r.status === 'valid').length;
                const btnImportar = document.createElement('button');
                btnImportar.className = 'btn btn-primary';
                btnImportar.textContent = `Importar ${validCount} registro(s)`;
                btnImportar.style.background = validCount > 0 ? '#16a34a' : '#94a3b8';
                btnImportar.disabled = validCount === 0;
                btnImportar.onclick = () => { modal._importStep = 4; renderStep(); atualizarBotoes(); this._executarImportacao(entityType, resultados, config, modal); };
                right.appendChild(btnImportar);
            } else if (s === 5) {
                const temErros = resultados.some(r => r.status === 'error');
                if (temErros) {
                    const btnBaixar = document.createElement('button');
                    btnBaixar.className = 'btn btn-secondary';
                    btnBaixar.textContent = 'Baixar Relatório de Erros';
                    btnBaixar.style.marginRight = '8px';
                    btnBaixar.onclick = () => {
                        const csv = _gerarRelatorioErros(resultados);
                        if (csv) _downloadBlob(csv, `erros_${entityType}_${_today()}.csv`);
                        else app.toast('Nenhum erro para relatar.', 'info');
                    };
                    right.appendChild(btnBaixar);
                }
                const btnFechar = document.createElement('button');
                btnFechar.className = 'btn btn-primary';
                btnFechar.textContent = 'Fechar';
                btnFechar.onclick = () => { overlay.remove(); if (window.app[entityType]?.renderList) window.app[entityType].renderList(config.storeData()); };
                right.appendChild(btnFechar);
            }

            footer.appendChild(left);
            footer.appendChild(right);
        };

        renderStep();
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        atualizarBotoes();
        this._attachFileHandler(config, campos, parsedRows, headers, mapping, body, renderStep, atualizarBotoes, modal);
    },

    _renderUploadStep(config, campos, entityType) {
        return `
            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Importar ${config.label}</h3>
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">Etapa 1 de 4</span>
                </div>
                <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Selecione um arquivo CSV ou Excel (.xlsx) preenchido conforme o modelo. Cada linha deve conter os dados de um ${config.labelSingular}.</p>

                <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.importacaoCadastros.downloadModelo('${entityType}')" style="display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-download-simple"></i> Baixar Modelo CSV
                    </button>
                </div>

                <div id="import-dropzone" style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center; background: #f8fafc; cursor: pointer; transition: all 0.2s;">
                    <i class="ph ph-file-csv" style="font-size: 48px; color: #94a3b8;"></i>
                    <p style="font-size: 14px; color: #475569; margin: 12px 0 4px;"><strong>Clique para selecionar</strong> ou arraste o arquivo aqui</p>
                    <p style="font-size: 11px; color: #94a3b8;">Formatos aceitos: .csv, .xlsx, .xls</p>
                    <input type="file" id="import-file-input" accept=".csv,.xlsx,.xls" style="display: none;">
                </div>

                <div id="import-file-info" style="display: none; margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-check-circle" style="color: #16a34a; font-size: 20px;"></i>
                        <span id="import-file-name" style="font-weight: 600;"></span>
                    </div>
                    <div style="margin-top: 4px; font-size: 12px; color: #475569;">
                        <span id="import-file-rows"></span> linhas · <span id="import-file-cols"></span> colunas
                    </div>
                </div>

                <div id="import-error-info" style="display: none; margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; font-size: 13px;"></div>
            </div>
        `;
    },

    _attachFileHandler(config, campos, parsedRows, headers, mapping, body, renderStep, atualizarBotoes, modal) {
        setTimeout(() => {
            const dropzone = body.querySelector('#import-dropzone');
            const fileInput = body.querySelector('#import-file-input');
            const fileInfo = body.querySelector('#import-file-info');
            const fileNameEl = body.querySelector('#import-file-name');
            const fileRowsEl = body.querySelector('#import-file-rows');
            const fileColsEl = body.querySelector('#import-file-cols');
            const errorInfo = body.querySelector('#import-error-info');

            const irParaMapping = () => {
                modal._importStep = 2;
                body.innerHTML = ImportacaoCadastros._renderMappingStep(config, campos, headers, mapping);
                renderStep();
                atualizarBotoes();
            };

            const processFile = (file) => {
                const ext = file.name.split('.').pop().toLowerCase();
                errorInfo.style.display = 'none';

                const onParsed = () => {
                    fileNameEl.textContent = file.name;
                    fileRowsEl.textContent = parsedRows.length;
                    fileColsEl.textContent = headers.length;
                    fileInfo.style.display = 'block';
                    setTimeout(irParaMapping, 300);
                };

                if (ext === 'csv') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const result = _parseCSV(e.target.result);
                            if (result.rows.length === 0) {
                                errorInfo.textContent = 'O arquivo CSV está vazio ou não possui dados.';
                                errorInfo.style.display = 'block';
                                return;
                            }
                            parsedRows.length = 0;
                            parsedRows.push(...result.rows);
                            headers.length = 0;
                            headers.push(...result.headers);
                            mapping = _detectMapping(headers, campos);
                            onParsed();
                        } catch (err) {
                            errorInfo.textContent = 'Erro ao ler o arquivo: ' + err.message;
                            errorInfo.style.display = 'block';
                        }
                    };
                    reader.readAsText(file);
                } else if (ext === 'xlsx' || ext === 'xls') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const wb = XLSX.read(e.target.result, { type: 'array' });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
                            if (json.length === 0) {
                                errorInfo.textContent = 'A planilha está vazia ou não possui dados.';
                                errorInfo.style.display = 'block';
                                return;
                            }
                            const xlsxHeaders = Object.keys(json[0]);
                            headers.length = 0;
                            headers.push(...xlsxHeaders);
                            parsedRows.length = 0;
                            parsedRows.push(...json);
                            mapping = _detectMapping(headers, campos);
                            onParsed();
                        } catch (err) {
                            errorInfo.textContent = 'Erro ao ler a planilha: ' + err.message;
                            errorInfo.style.display = 'block';
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    errorInfo.textContent = 'Formato não suportado. Use .csv, .xlsx ou .xls.';
                    errorInfo.style.display = 'block';
                }
            };

            if (dropzone) {
                dropzone.onclick = () => fileInput.click();
                if (fileInput) fileInput.onchange = () => { if (fileInput.files[0]) processFile(fileInput.files[0]); };
                dropzone.ondragover = (e) => { e.preventDefault(); dropzone.style.borderColor = '#16a34a'; dropzone.style.background = '#f0fdf4'; };
                dropzone.ondragleave = () => { dropzone.style.borderColor = '#cbd5e1'; dropzone.style.background = '#f8fafc'; };
                dropzone.ondrop = (e) => { e.preventDefault(); dropzone.style.borderColor = '#cbd5e1'; dropzone.style.background = '#f8fafc'; if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
            }
        }, 0);
    },

    _renderMappingStep(config, campos, headers, mapping) {
        const requiredOk = campos.filter(c => c.required).every(c => mapping[c.key]);
        return `
            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Mapear Colunas</h3>
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">Etapa 2 de 4</span>
                </div>
                <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Confira se as colunas foram detectadas corretamente. Campos obrigatórios marcados com <span style="color: #dc2626;">*</span>.</p>

                <div style="background: ${requiredOk ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${requiredOk ? '#bbf7d0' : '#fecaca'}; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ${requiredOk ? 'ph-check-circle' : 'ph-warning-circle'}" style="color: ${requiredOk ? '#16a34a' : '#dc2626'}; font-size: 16px;"></i>
                    <span>${requiredOk ? 'Todos os campos obrigatórios mapeados.' : 'Preencha o mapeamento de todos os campos obrigatórios (*) para continuar.'}</span>
                </div>

                <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Campo no Sistema</th>
                                <th style="padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Coluna no Arquivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${campos.map(c => {
                                const detected = mapping[c.key];
                                return `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 10px 12px; font-weight: ${c.required ? '600' : '400'};">
                                            ${c.required ? '<span style="color: #dc2626;">*</span> ' : ''}${c.label}
                                        </td>
                                        <td style="padding: 10px 12px;">
                                            <select data-map-key="${c.key}" style="width: 100%; padding: 6px 8px; border: 1px solid ${detected ? '#cbd5e1' : '#fecaca'}; border-radius: 4px; font-size: 12px; background: white;">
                                                <option value="">— Ignorar —</option>
                                                ${headers.map(h => `<option value="${h}" ${detected === h ? 'selected' : ''}>${h}</option>`).join('')}
                                            </select>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    _attachMappingHandlers(container, campos, mapping, headers) {
        // Mapping selects are already rendered with correct values
    },

    _renderPreviewStep(config, campos, mapping, parsedRows, resultados) {
        const previewRows = parsedRows.slice(0, 10);
        const validCount = resultados.filter(r => r.status === 'valid').length;
        const errorCount = resultados.filter(r => r.status === 'error').length;
        const dupCount = resultados.filter(r => r.status === 'duplicate').length;
        const total = resultados.length;

        const mapeados = campos.filter(c => mapping[c.key]).map(c => mapping[c.key]);

        return `
            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Pré-visualizar Dados</h3>
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">Etapa 3 de 4</span>
                </div>

                <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                    <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #16a34a;">${validCount}</div>
                        <div style="font-size: 11px; color: #166534;">Válidos</div>
                    </div>
                    <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${errorCount}</div>
                        <div style="font-size: 11px; color: #991b1b;">Com Erro</div>
                    </div>
                    <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #d97706;">${dupCount}</div>
                        <div style="font-size: 11px; color: #92400e;">Duplicatas</div>
                    </div>
                    <div style="flex: 1; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #475569;">${total}</div>
                        <div style="font-size: 11px; color: #64748b;">Total</div>
                    </div>
                </div>

                <p style="color: #64748b; font-size: 12px; margin-bottom: 8px;">Mostrando as primeiras ${previewRows.length} de ${total} linha(s).</p>

                <div style="max-height: 350px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #f1f5f9; position: sticky; top: 0;">
                                <th style="padding: 8px 10px; text-align: left; white-space: nowrap;">#</th>
                                <th style="padding: 8px 10px; text-align: left; white-space: nowrap;">Status</th>
                                ${mapeados.map(h => `<th style="padding: 8px 10px; text-align: left; white-space: nowrap;">${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${resultados.slice(0, 10).map((r, i) => {
                                const statusIcon = r.status === 'valid' ? '✅' : (r.status === 'duplicate' ? '⚠️' : '❌');
                                const statusLabel = r.status === 'valid' ? 'OK' : (r.status === 'duplicate' ? 'Duplicata' : 'Erro');
                                const bgColor = r.status === 'valid' ? '' : (r.status === 'duplicate' ? '#fffbeb' : '#fef2f2');
                                return `
                                    <tr style="border-bottom: 1px solid #f1f5f9; background: ${bgColor};">
                                        <td style="padding: 8px 10px;">${i + 1}</td>
                                        <td style="padding: 8px 10px;" title="${r.errors.join(', ')}">${statusIcon} ${statusLabel}</td>
                                        ${mapeados.map(h => `<td style="padding: 8px 10px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${_escapeCSV(previewRows[i]?.[h] || '')}</td>`).join('')}
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    _renderImportStep(config, entityType, resultados) {
        return `
            <div style="padding: 40px 24px; text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Importando ${config.label}</h3>
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">Etapa 4 de 4</span>
                </div>
                <div style="margin: 40px 0;">
                    <i class="ph ph-spinner ph-spin" style="font-size: 48px; color: #16a34a;"></i>
                </div>
                <p style="color: #475569; font-size: 14px;">Importando dados, aguarde...</p>
                <div style="max-width: 400px; margin: 16px auto;">
                    <div style="background: #e2e8f0; border-radius: 8px; height: 8px; overflow: hidden;">
                        <div id="import-progress-bar" style="background: #16a34a; height: 100%; width: 0%; transition: width 0.3s;"></div>
                    </div>
                </div>
                <p id="import-progress-text" style="color: #94a3b8; font-size: 12px;">0 de ${resultados.filter(r => r.status === 'valid' || r.status === 'duplicate').length} registros</p>
            </div>
        `;
    },

    async _executarImportacao(entityType, resultados, config, modal) {
        const validos = resultados.filter(r => r.status === 'valid' || r.status === 'duplicate');
        let imported = 0;
        let skipped = 0;
        let updated = 0;

        const body = modal.querySelector('div:first-child');
        const bar = body?.querySelector('#import-progress-bar');
        const text = body?.querySelector('#import-progress-text');

        for (let i = 0; i < validos.length; i++) {
            const r = validos[i];
            const obj = {
                id: crypto.randomUUID(),
                ...r.data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (entityType === 'clientes') {
                const contato = {
                    nome: obj.contatoNome || '',
                    cargo: obj.contatoCargo || '',
                    email: obj.email || '',
                    telefone: obj.telefone || ''
                };
                obj.contatos = [contato];
            }

            let ok;
            if (r.status === 'duplicate' && r.duplicate) {
                ok = await config.updateMethod(r.duplicate.id, obj);
                if (ok) updated++;
                else skipped++;
            } else {
                ok = await config.addMethod(obj);
                if (ok) imported++;
                else skipped++;
            }

            if (bar) bar.style.width = `${((i + 1) / validos.length * 100).toFixed(0)}%`;
            if (text) text.textContent = `${i + 1} de ${validos.length} registros`;
        }

        modal._importStep = 5;
        if (body) body.innerHTML = ImportacaoCadastros._renderResultStep(config, resultados, { imported, updated, skipped });
        const footer = modal.querySelector('div:last-child');
        if (footer) {
            footer.innerHTML = '';
            const left = document.createElement('div');
            const right = document.createElement('div');
            if (resultados.some(r => r.status === 'error')) {
                const btnBaixar = document.createElement('button');
                btnBaixar.className = 'btn btn-secondary';
                btnBaixar.textContent = 'Baixar Relatório de Erros';
                btnBaixar.style.marginRight = '8px';
                btnBaixar.onclick = () => {
                    const csv = _gerarRelatorioErros(resultados);
                    if (csv) _downloadBlob(csv, `erros_${entityType}_${_today()}.csv`);
                    else app.toast('Nenhum erro para relatar.', 'info');
                };
                right.appendChild(btnBaixar);
            }
            const btnFechar = document.createElement('button');
            btnFechar.className = 'btn btn-primary';
            btnFechar.textContent = 'Fechar';
            btnFechar.onclick = () => {
                const overlay = document.getElementById('modal-importacao-cadastro');
                if (overlay) overlay.remove();
                if (window.app[entityType]?.renderList) window.app[entityType].renderList(config.storeData());
            };
            right.appendChild(btnFechar);
            footer.appendChild(left);
            footer.appendChild(right);
        }
    },

    _renderResultStep(config, resultados, stats) {
        stats = stats || {};
        const imported = stats.imported || 0;
        const updated = stats.updated || 0;
        const skipped = stats.skipped || 0;
        const errorCount = resultados.filter(r => r.status === 'error').length;
        const dupCount = resultados.filter(r => r.status === 'duplicate').length;

        return `
            <div style="padding: 40px 24px; text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Importação Concluída</h3>
                </div>
                <div style="margin: 24px 0;">
                    <i class="ph ph-check-circle" style="font-size: 64px; color: #16a34a;"></i>
                </div>

                <div style="display: flex; gap: 16px; max-width: 600px; margin: 0 auto 24px;">
                    <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #16a34a;">${imported + updated}</div>
                        <div style="font-size: 12px; color: #166534;">Importados/Atualizados</div>
                        ${updated > 0 ? `<div style="font-size: 10px; color: #166534;">${updated} atualizados</div>` : ''}
                    </div>
                    <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #dc2626;">${errorCount}</div>
                        <div style="font-size: 12px; color: #991b1b;">Com Erro</div>
                    </div>
                    <div style="flex: 1; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #64748b;">${skipped + (dupCount - updated)}</div>
                        <div style="font-size: 12px; color: #64748b;">Ignorados</div>
                    </div>
                </div>

                ${errorCount > 0 ? `<p style="color: #64748b; font-size: 13px;">Use o botão "Baixar Relatório de Erros" para ver os detalhes.</p>` : ''}
            </div>
        `;
    }
};

window.importacaoCadastros = ImportacaoCadastros;
