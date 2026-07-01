import { store } from './state.js';

/**
 * Orcamentos Module (Propostas)
 */

const OrcamentosModule = {
    init() {
        window.app.orcamentos = {
            create: this.create.bind(this),
            edit: this.edit.bind(this),
            addItem: this.addItem.bind(this),
            removeItem: this.removeItem.bind(this),
            save: this.save.bind(this),
            renderEditor: this.renderEditor.bind(this),
            closeEditor: this.closeEditor.bind(this),
            updateCalculations: this.updateCalculations.bind(this),
            closeEditor: this.closeEditor.bind(this),
            updateCalculations: this.updateCalculations.bind(this),
            print: this.print.bind(this),
            filterProposals: this.filterProposals.bind(this)
        };

        store.subscribe((state) => {
            const container = document.getElementById('view-orcamentos');
            if (container && !container.classList.contains('hidden-module')) {
                this.renderList(state.orcamentos);
            }
        });

        this.currentProposal = null;
    },

    render() { // Called by app.js navigateto
        // Search Header Injection
        const container = document.getElementById('view-orcamentos');
        if (container && !document.getElementById('orc-search-controls')) {
            const header = container.querySelector('.card-header');
            if (header) {
                const controls = document.createElement('div');
                controls.id = 'orc-search-controls';
                controls.style.display = 'flex';
                controls.style.gap = '10px';
                controls.style.marginBottom = '16px';
                controls.innerHTML = `
                    <input type="text" class="form-control" placeholder="Buscar por cliente, número ou obra..." style="width: 300px;" oninput="app.orcamentos.filterProposals()">
                    <select class="form-control" style="width: 200px;" onchange="app.orcamentos.filterProposals()" id="orc-filter-status">
                        <option value="">Todos Status</option>
                        <option value="OPEN">Em Aberto</option>
                        <option value="Em Elaboração">Em Elaboração</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Perdido">Perdido</option>
                    </select>
                `;
                // Insert after header, before list
                container.querySelector('.card').insertBefore(controls, container.querySelector('#view-orcamentos table') ? container.querySelector('#view-orcamentos table').parentElement : header.nextSibling);
            }
        }

        const state = store.getState();
        this.renderList(state.orcamentos);
    },

    filterProposals() {
        const query = document.querySelector('#orc-search-controls input').value.toLowerCase();
        const status = document.getElementById('orc-filter-status').value;

        const all = store.getState().orcamentos;
        const filtered = all.filter(p => {
            const matchQuery = !query ||
                (p.clienteName && p.clienteName.toLowerCase().includes(query)) ||
                (p.numero && p.numero.toLowerCase().includes(query)) ||
                (p.obra && p.obra.toLowerCase().includes(query));

            let matchStatus = true;
            if (status === 'OPEN') {
                matchStatus = p.status === 'Em Elaboração' || p.status === 'Enviado';
            } else if (status) {
                matchStatus = p.status === status;
            }

            return matchQuery && matchStatus;
        });

        this.renderList(filtered);
    },

    renderList(orcamentos) {
        const tbody = document.querySelector('#view-orcamentos tbody');
        if (!tbody) return;

        if (!orcamentos || orcamentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma proposta encontrada. Clique em "Nova Proposta".</td></tr>`;
            return;
        }

        const statusColors = {
            'Em Elaboração': 'status-gray',
            'Enviado': 'status-blue',
            'Aprovado': 'status-green',
            'Perdido': 'status-danger' // Need to define this CSS class if not exists, but fallback is fine
        };

        tbody.innerHTML = orcamentos.map(o => `
            <tr>
                <td style="font-weight: 600;">#${o.numero}</td>
                <td>${o.clienteName || o.clienteId}</td>
                <td>${o.obra || '-'}</td>
                <td style="font-weight: 600;">${app.formatCurrency(o.total || 0)}</td>
                <td><span class="status-badge ${statusColors[o.status] || 'status-gray'}">${o.status}</span></td>
                <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                    ${store.canEdit() ? `<button class="btn btn-ghost" onclick="app.orcamentos.edit('${o.id}')"><i class="ph ph-pencil-simple"></i></button>` : ''}
                    <button class="btn btn-ghost" onclick="app.orcamentos.print('${o.id}')"><i class="ph ph-printer"></i></button>
                </td>
            </tr>
        `).join('');
    },

    create() {
        const number = 'PROP-' + (new Date().getFullYear()) + '-' + (Math.floor(Math.random() * 1000)).toString().padStart(3, '0');

        this.currentProposal = {
            id: null,
            numero: number,
            clienteId: '',
            clienteName: '',
            obra: '',
            status: 'Em Elaboração',
            items: [],
            markupGlobal: 30, // %
            impostoGlobal: 18, // % simple average for MVP
            total: 0,
            subtotal: 0,
            // New Commercial Fields
            condicao_pagamento: 'Conta Entrega', // Default as per image
            condicao_parcela: '100%',
            condicao_faturamento: '30 ddl',
            prazo_entrega: '90 dias após o recebimento do pedido de compra',
            validade: '10 dias',
            ncm_imposto: 'Painel Elétrico de Baixa Tensão – NCM: 8537.1090',
            transporte: 'CIF, com entrega na USINA SÃO FRANCISCO S/A',
            despesas: 'Não se aplica a este fornecimento.'
        };
        this.renderEditor();
    },

    edit(id) {
        const p = store.getState().orcamentos.find(x => x.id === id);
        if (!p) return;
        this.currentProposal = JSON.parse(JSON.stringify(p));
        this.renderEditor();
    },

    renderEditor() {
        const state = this.currentProposal;
        const clientes = store.getState().clientes;
        const tipicos = store.getState().tipicos;

        const html = `
            <div id="modal-orcamento" class="modal-overlay">
                <div class="modal" style="width: 95vw; height: 95vh; max-width: 1400px; background: #f8fafc;">
                    <div class="modal-header" style="background: white;">
                        <div>
                            <h3 class="card-title">Orçamento: ${state.numero}</h3>
                            <div class="text-xs text-muted">Status: ${state.status}</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" onclick="app.orcamentos.closeEditor()">Fechar</button>
                            <button class="btn btn-primary" onclick="app.orcamentos.save()"><i class="ph ph-floppy-disk"></i> Salvar Orçamento</button>
                        </div>
                    </div>

                    <div class="modal-body" style="padding: 0; display: flex; height: 100%; overflow: hidden;">
                        
                        <!-- LEFT PANEL: DETAILS & CONFIG -->
                        <div style="width: 350px; padding: 20px; border-right: 1px solid var(--color-border); background: white; overflow-y: auto;">
                            <div class="form-group">
                                <label class="form-label">Cliente *</label>
                                <select id="orc-cliente" class="form-control" onchange="app.orcamentos.updateCalculations()">
                                    <option value="">Selecione...</option>
                                    ${clientes.map(c => `<option value="${c.id}" ${state.clienteId === c.id ? 'selected' : ''}>${c.razaoSocial}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Obra / Projeto</label>
                                <input type="text" id="orc-obra" class="form-control" value="${state.obra || ''}">
                            </div>
                            
                            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e2e8f0;">

                            <h4 class="text-sm font-bold">Resumo Comercial</h4>
                            <div class="card" style="padding: 15px; background: #f1f5f9; border: none;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span class="text-sm">Subtotal (Custo):</span>
                                    <span class="font-bold" id="orc-subtotal">R$ 0,00</span>
                                </div>
                                
                                <div class="form-group" style="margin-top: 10px;">
                                    <label class="form-label">Markup / Margem (%)</label>
                                    <input type="number" id="orc-markup" class="form-control" value="${state.markupGlobal}" onchange="app.orcamentos.updateCalculations()">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Impostos Est. (%)</label>
                                    <input type="number" id="orc-impostos" class="form-control" value="${state.impostoGlobal}" onchange="app.orcamentos.updateCalculations()">
                                </div>

                                    <span class="text-lg font-bold" style="color: var(--color-primary);" id="orc-total">R$ 0,00</span>
                                </div>
                            </div>

                            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e2e8f0;">

                            <h4 class="text-sm font-bold">Condições Comerciais</h4>
                            <div class="form-group">
                                <label class="form-label">Condição de Pagamento</label>
                                <div style="display: flex; gap: 5px;">
                                    <input type="text" id="orc-pgto-evento" class="form-control" placeholder="Evento (ex: Conta Entrega)" value="${state.condicao_pagamento || ''}">
                                    <input type="text" id="orc-pgto-parcela" class="form-control" placeholder="%" style="width: 60px;" value="${state.condicao_parcela || ''}">
                                    <input type="text" id="orc-pgto-fat" class="form-control" placeholder="Fat." style="width: 80px;" value="${state.condicao_faturamento || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Prazo de Entrega</label>
                                <input type="text" id="orc-prazo" class="form-control" value="${state.prazo_entrega || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Validade da Proposta</label>
                                <input type="text" id="orc-validade" class="form-control" value="${state.validade || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Info. Fiscal / NCM</label>
                                <input type="text" id="orc-ncm" class="form-control" value="${state.ncm_imposto || ''}">
                            </div>
                             <div class="form-group">
                                <label class="form-label">Transporte / Frete</label>
                                <input type="text" id="orc-transporte" class="form-control" value="${state.transporte || ''}">
                            </div>
                             <div class="form-group">
                                <label class="form-label">Despesas</label>
                                <input type="text" id="orc-despesas" class="form-control" value="${state.despesas || ''}">
                            </div>
                        </div>

                        <div style="flex: 1; padding: 20px; overflow-y: auto; background: #f8fafc;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                                <h4 class="text-sm font-bold">Itens do Painel / Materiais</h4>
                                <div style="display: flex; gap: 10px;">
                                    <!-- Add Typical -->
                                    <select class="form-control" style="width: 200px;" onchange="app.orcamentos.addItem('TIPICO', this.value); this.value='';">
                                        <option value="">+ Típico...</option>
                                        ${tipicos.map(t => `<option value="${t.id}">${t.nome} (${app.formatCurrency(t.custoTotal)})</option>`).join('')}
                                    </select>
                                    <!-- Add Material -->
                                    <select class="form-control" style="width: 200px;" onchange="app.orcamentos.addItem('MATERIAL', this.value); this.value='';">
                                        <option value="">+ Material Avulso...</option>
                                        ${store.getState().materiais ? store.getState().materiais.map(m => `<option value="${m.id}">${m.descricao} (${app.formatCurrency(m.custo || 0)})</option>`).join('') : ''}
                                    </select>
                                </div>
                            </div>

                            <div class="card" style="padding: 0; overflow: hidden;">
                                <table class="table" style="margin: 0;">
                                    <thead>
                                        <tr>
                                            <th style="padding-left: 20px;">Item / Descrição</th>
                                            <th style="width: 100px;">Qtd</th>
                                            <th style="width: 150px;">Custo Unit.</th>
                                            <th style="width: 150px;">Subtotal</th>
                                            <th style="width: 50px;"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="orc-items-body" style="background: white;">
                                        <!-- Items -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.renderProposalItems();
        this.updateCalculations();
    },

    addItem(type, id) {
        if (!id) return;

        let newItem = null;

        if (type === 'TIPICO') {
            const t = store.getState().tipicos.find(x => x.id === id);
            if (!t) return;
            newItem = {
                type: 'TIPICO',
                refId: t.id,
                name: t.nome,
                description: t.aplicacao || 'Típico de Partida',
                unitCost: t.custoTotal,
                qty: 1
            };
        } else if (type === 'MATERIAL') {
            const m = store.getState().materiais.find(x => x.id === id);
            if (!m) return;
            newItem = {
                type: 'MATERIAL',
                refId: m.id,
                name: m.descricao,
                description: `${m.fabricante} - ${m.codigoInterno || ''}`,
                unitCost: parseFloat(m.custo || 0),
                qty: 1
            };
        }

        if (newItem) {
            this.currentProposal.items.push(newItem);
            this.renderProposalItems();
            this.updateCalculations();
        }
    },

    removeItem(index) {
        this.currentProposal.items.splice(index, 1);
        this.renderProposalItems();
        this.updateCalculations();
    },

    renderProposalItems() {
        const tbody = document.getElementById('orc-items-body');
        if (!tbody) return;

        tbody.innerHTML = this.currentProposal.items.map((item, index) => {
            const subtotal = item.unitCost * item.qty;
            return `
                <tr>
                    <td style="padding-left: 20px;">
                        <div style="font-weight: 600;">${item.name}</div>
                        <div style="font-size: 11px; color: #64748b;">${item.description || 'Típico de Partida'}</div>
                    </td>
                    <td><input type="number" class="form-control" style="padding: 4px;" value="${item.qty}" onchange="app.orcamentos.updateQty(${index}, this.value)"></td>
                    <td>${app.formatCurrency(item.unitCost)}</td>
                    <td>${app.formatCurrency(subtotal)}</td>
                    <td>${store.canDelete() ? `<button class="btn btn-ghost text-danger" onclick="app.orcamentos.removeItem(${index})"><i class="ph ph-trash"></i></button>` : ''}</td>
                </tr>
            `;
        }).join('');

        // Helper
        window.app.orcamentos.updateQty = (idx, val) => {
            this.currentProposal.items[idx].qty = parseInt(val) || 1;
            this.updateCalculations();
            this.renderProposalItems(); // re-render needed? maybe just calc
        };
    },

    updateCalculations() {
        // Recalculate totals
        const itemsCost = this.currentProposal.items.reduce((acc, i) => acc + (i.unitCost * i.qty), 0);

        const markupPercent = parseFloat(document.getElementById('orc-markup').value) || 0;
        const taxPercent = parseFloat(document.getElementById('orc-impostos').value) || 0;

        // Logic: Cost + Markup = Sale Price (Net) -> + Taxes = Gross Price
        // Or: Cost / (1 - (Markup+Tax)/100)?
        // Simple Logic: Cost * (1 + Markup/100) * (1 + Tax/100)

        const withMarkup = itemsCost * (1 + (markupPercent / 100));
        const finalTotal = withMarkup * (1 + (taxPercent / 100));

        this.currentProposal.subtotal = itemsCost;
        this.currentProposal.total = finalTotal;
        this.currentProposal.markupGlobal = markupPercent;
        this.currentProposal.impostoGlobal = taxPercent;

        // Update UI
        document.getElementById('orc-subtotal').textContent = app.formatCurrency(itemsCost);
        document.getElementById('orc-total').textContent = app.formatCurrency(finalTotal);
    },

    save() {
        const clienteSelect = document.getElementById('orc-cliente');
        this.currentProposal.clienteId = clienteSelect.value;
        this.currentProposal.clienteName = clienteSelect.options[clienteSelect.selectedIndex]?.text || '';
        this.currentProposal.obra = document.getElementById('orc-obra').value;

        // Save Commercial Fields
        this.currentProposal.condicao_pagamento = document.getElementById('orc-pgto-evento').value;
        this.currentProposal.condicao_parcela = document.getElementById('orc-pgto-parcela').value;
        this.currentProposal.condicao_faturamento = document.getElementById('orc-pgto-fat').value;
        this.currentProposal.prazo_entrega = document.getElementById('orc-prazo').value;
        this.currentProposal.validade = document.getElementById('orc-validade').value;
        this.currentProposal.ncm_imposto = document.getElementById('orc-ncm').value;
        this.currentProposal.transporte = document.getElementById('orc-transporte').value;
        this.currentProposal.despesas = document.getElementById('orc-despesas').value;

        if (!this.currentProposal.clienteId) {
            window.app.toast("Selecione um cliente.", "error");
            return;
        }

        if (this.currentProposal.items.length === 0) {
            window.app.toast("Adicione pelo menos um item à proposta.", "warning");
            return;
        }

        if (this.currentProposal.id) {
            store.setState({
                orcamentos: store.getState().orcamentos.map(t => t.id === this.currentProposal.id ? this.currentProposal : t)
            });
        } else {
            this.currentProposal.id = crypto.randomUUID();
            this.currentProposal.createdAt = new Date();
            store.setState({
                orcamentos: [...store.getState().orcamentos, this.currentProposal]
            });
            store._syncCreate('orcamentos', this.currentProposal);
        }

        this.closeEditor();
        window.app.toast("Proposta salva com sucesso!", "success");
    },

    closeEditor() {
        const modal = document.getElementById('modal-orcamento');
        if (modal) modal.remove();
    },

    print(id) {
        const p = store.getState().orcamentos.find(x => x.id === id);
        if (!p) return;

        const cliente = store.getState().clientes.find(c => c.id === p.clienteId) || {};
        const today = new Date().toLocaleDateString('pt-BR');

        const printWindow = window.open('', '_blank');

        // Defaults if missing (legacy support)
        const payEvent = p.condicao_pagamento || 'Conta Entrega';
        const payParcel = p.condicao_parcela || '100%';
        const payFat = p.condicao_faturamento || '30 ddl';
        const deliveryTime = p.prazo_entrega || '90 dias após o recebimento do pedido';
        const validity = p.validade || '10 dias';
        const ncm = p.ncm_imposto || 'Painel Elétrico...';
        const transport = p.transporte || 'CIF...';
        const expenses = p.despesas || 'Não se aplica...';

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Proposta ${p.numero}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
                    body {
                        font-family: 'Open Sans', 'Segoe UI', sans-serif;
                        color: #1e293b;
                        line-height: 1.4;
                        margin: 0;
                        padding: 0;
                        background: #fff;
                        font-size: 10pt;
                    }
                    .print-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px;
                    }
                    @media print {
                        .print-container { width: 100%; max-width: none; padding: 0; margin: 1cm; }
                        .no-print { display: none; }
                        @page { margin: 1cm; }
                    }
                    
                    /* Header matching reference */
                    .header-grid {
                        display: grid;
                        grid-template-columns: auto 1fr auto;
                        gap: 20px;
                        align-items: center;
                        border-bottom: 2px solid #65a30d; /* Brand Green */
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .logo-section h1 { margin: 0; font-size: 18pt; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
                    .logo-section h1 span { color: #65a30d; }
                    .logo-section p { margin: 0; font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    
                    .address-section { font-size: 8pt; color: #64748b; text-align: center; line-height: 1.2; }
                    
                    .iso-badges { display: flex; gap: 5px; }
                    .iso-placeholder { width: 40px; height: 40px; background: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 6pt; text-align: center; color: #64748b; border: 1px dashed #94a3b8; }

                    /* Legal Text */
                    .legal-clause { font-size: 9pt; text-align: justify; margin-bottom: 20px; }

                    /* Section Titles */
                    .section-title { 
                        font-size: 10pt; 
                        font-weight: 700; 
                        color: #4d7c0f; /* Darker Green */
                        margin-top: 20px; 
                        margin-bottom: 8px;
                        text-transform: uppercase;
                    }

                    /* Tables */
                    .pay-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #1e293b; }
                    .pay-table th { background: #4d7c0f; color: white; padding: 6px; font-size: 9pt; text-transform: uppercase; border: 1px solid #1e293b; }
                    .pay-table td { padding: 6px; text-align: center; border: 1px solid #1e293b; font-size: 9pt; font-weight: 600; }

                    /* List Styles */
                    ul { padding-left: 20px; margin: 5px 0 15px; }
                    li { margin-bottom: 4px; font-size: 10pt; }

                    /* Footer */
                    .footer-bar {
                        height: 10px;
                        background: #4d7c0f;
                        margin-top: 40px;
                        border-top-left-radius: 10px;
                        border-bottom-right-radius: 10px;
                    }

                    /* Items Table (Simplified for space) */
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
                    .items-table th { border-bottom: 2px solid #ccc; text-align: left; padding: 4px; }
                    .items-table td { border-bottom: 1px solid #eee; padding: 4px; }
                    .totals-box { text-align: right; margin-top: 10px; font-size: 10pt; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <header class="header-grid">
                        <div class="logo-section">
                            <h1>Minha Empresa</h1>
                            <p>Tecnológicas Ltda</p>
                        </div>
                        <div class="address-section">
                            Av. Ângelo Magro, 98 - CEP 14.176-130<br>
                            Distrito Industrial II - Sertãozinho - SP<br>
                            Fone: +55 16 3945 2145 | www.minhaempresa.com.br
                        </div>
                        <div class="iso-badges">
                            <div class="iso-placeholder">ISO 9001</div>
                            <div class="iso-placeholder">ISO 14001</div>
                            <div class="iso-placeholder">ISO 45001</div>
                            <div class="iso-placeholder">SGS</div>
                        </div>
                    </header>

                    <div style="margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
                        <h2 style="margin: 0; font-size: 14pt; color: #1e293b;">Proposta Comercial #${p.numero}</h2>
                        <div style="font-size: 10pt; margin-top: 5px;">
                            <strong>Cliente:</strong> ${p.clienteName} | 
                            <strong>Obra/Ref:</strong> ${p.obra || 'N/A'}
                        </div>
                    </div>

                    <div class="legal-clause">
                        Quando devido, será destacada retenção de 1,5% (um e meio por cento) de Imposto de Renda,
                        ou seja, desde que o serviço contratado esteja compreendido no rol do Art. 647, parágrafo primeiro,
                        do Decreto nº 3.000 de 26/03/1999.
                    </div>

                    <!-- 4 - Pagamento -->
                    <div class="section-title">4 - CONDIÇÃO DE PAGAMENTO</div>
                    <table class="pay-table">
                        <thead>
                            <tr>
                                <th>EVENTOS DE PAGAMENTO</th>
                                <th>PARCELA</th>
                                <th>FATURAMENTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${payEvent}</td>
                                <td>${payParcel}</td>
                                <td>${payFat}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- 5 - Faturamento -->
                    <div class="section-title">5 - FORMA DE FATURAMENTO</div>
                    <ul>
                        <li>${ncm}</li>
                        <li>Serviço</li>
                    </ul>

                    <!-- 6 - Prazo -->
                    <div class="section-title">6 - PRAZO DE ENTREGA</div>
                    <ul>
                        <li><strong>${deliveryTime}</strong>;</li>
                    </ul>
                    <div class="legal-clause" style="font-size: 9pt;">
                        O prazo indicado é considerado para o recebimento dos materiais e montagem dos equipamentos.
                        O início da contagem do prazo de entrega será considerado a partir da data em que forem satisfeitas integralmente as seguintes condições:
                        <ul style="margin-top: 5px;">
                            <li>Assinatura do Contrato, tendo por base os parâmetros constantes nesta Proposta Comercial;</li>
                            <li>Recebimento pela Minha Empresa de toda a documentação técnica e elaborados pela CONTRATANTE;</li>
                            <li>Início dos trabalhos com a liberação da OS, acessos e demais itens de responsabilidade da CONTRATANTE.</li>
                        </ul>
                    </div>

                    <!-- 7 - Validade -->
                    <div class="section-title">7 - VALIDADE DA PROPOSTA</div>
                    <p style="margin: 5px 0 15px 20px;">
                        A presente proposta tem validade de <strong>${validity}</strong> a contar desta data.<br>
                        Caso o cliente emita o "aceite" após o prazo de validade, os preços apresentados estarão sujeitos a reajuste.
                    </p>

                    <!-- 8 - Data Base -->
                    <div class="section-title">8 - DATA BASE</div>
                    <p style="margin: 5px 0 15px 20px;">
                        A presente proposta tem data base <strong>${today}</strong>.
                    </p>

                    <!-- 9 - Despesas -->
                    <div class="section-title">9 - DESPESAS</div>
                    <p style="margin: 5px 0 15px 20px;">
                        ${expenses}
                    </p>

                    <!-- 10 - Transporte -->
                    <div class="section-title">10 - TRANSPORTE</div>
                    <p style="margin: 5px 0 15px 20px;">
                       ${transport}
                    </p>

                    <!-- Resumo Financeiro (Extra Section for context) -->
                    <div class="section-title" style="margin-top: 30px; border-top: 2px solid #ddd; padding-top: 10px;">RESUMO FINANCEIRO</div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Descrição Principal</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${p.items.map(i => `
                                <tr>
                                    <td>${i.qty}x ${i.name}</td>
                                    <td style="text-align: right;">${app.formatCurrency(i.unitCost * i.qty)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="totals-box">
                        <strong>TOTAL GERAL: ${app.formatCurrency(p.total)}</strong>
                    </div>

                    <div class="footer-bar"></div>
                    <div style="text-align: right; font-size: 8pt; color: #aaa; margin-top: 5px;">
                        Página 6 de 8 <!-- Mocked page number from image -->
                    </div>

                    <div class="no-print" style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; cursor: pointer; border-radius: 4px;">Imprimir / Salvar PDF</button>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }
};

window.orcamentosModule = OrcamentosModule;
OrcamentosModule.init();
