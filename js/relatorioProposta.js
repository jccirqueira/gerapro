const app = window.app;

function _fmt(val) {
    if (val === 0 || val === '0') return 'R$ 0,00';
    if (!val) return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(num)) return String(val);
    return 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const RelatorioProposta = {

    async gerarRelatorio(ptcFolder, revisionFolder) {
        try {
            if (!ptcFolder && window.app && window.app.currentPtc) {
                ptcFolder = window.app.currentPtc.folder;
                revisionFolder = revisionFolder || window.app.currentPtc.revision || '0';
            }
            if (!ptcFolder) {
                window.app.toast('Nenhuma proposta ativa para gerar relatório.', 'warning');
                return;
            }
            revisionFolder = revisionFolder || '0';
            window.app.toast('Gerando relatório...', 'info');
            const _tkREL = store.getState().auth?.token;
            const _hREL = _tkREL ? { 'Authorization': 'Bearer ' + _tkREL } : {};
            const [tecRes, comRes] = await Promise.all([
                fetch(`/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=PropostaTecnica.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hREL }),
                fetch(`/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=PropostaComercial.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hREL })
            ]);

            const tecData = tecRes.ok ? await tecRes.json().catch(() => ({})) : {};
            const comData = comRes.ok ? await comRes.json().catch(() => ({})) : {};

            let precData = {};
            const precRes = await fetch(`/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=Precificacao_Map.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hREL });
            const precResult = precRes.ok ? await precRes.json().catch(() => ({})) : {};
            if (precResult && !precResult.error) precData = precResult;

            this._abrirJanela(this._buildHTML(tecData, comData, precData));
        } catch (e) {
            console.error('[Relatorio] Erro:', e);
            app.toast('Erro ao gerar relatório: ' + e.message, 'error');
        }
    },

    _buildHTML(tecData, comData, precData) {
        const p = tecData || {};
        const c = comData || {};
        const equipments = p.equipments || [];
        const precMap = precData || {};
        const sec = window.relatorioPropostasModule?.reportSections || {};
        const _s = (name) => sec[name] !== false;

        const projeto = p.projeto || c.projeto || 'Sem Título';
        const cliente = p.cliente || c.cliente || 'N/A';
        const codigo = p.codigo || c.codigo || '';
        const objeto = p.objeto || c.objeto || '';
        const localizacao = p.localizacao || c.localizacao || [p.cidade, p.uf].filter(Boolean).join('/') || [c.cidade, c.uf].filter(Boolean).join('/') || '';
        const ufDestino = p.uf || c.uf || (() => { const l = localizacao; const s = l.includes('/') ? '/' : '-'; const ps = l.split(s); return ps.length > 1 ? ps.pop().trim().toUpperCase() : ''; })();
        const dataEmissao = p.data_emissao || c.data_emissao || new Date().toLocaleDateString('pt-BR');
        const contato = p.aos_cuidados || c.aos_cuidados || '';
        const email = p.email || c.email || '';
        const telefone = p.telefone || c.telefone || '';

        const logo = c.logo_base64 || p.logo_base64 || '';
        const clientLogo = c.client_logo_base64 || p.client_logo_base64 || '';

        const revisions = p.revisions || [];
        const scopeItems = p.scopeItems || [];
        const proposalExclusions = p.exclusions || [];
        const vendorList = p.vendorList || [];

        const pagtoEvts = c.pagamento_eventos || [];
        if (!pagtoEvts.length && (c.pgto_evento || c.pgto_parcela || c.pgto_fat)) {
            pagtoEvts.push({ percentual: c.pgto_parcela || '', descricao: c.pgto_fat || '' });
        }
        const condicoes = {
            pagamento_eventos: pagtoEvts,
            pgto_evento: c.pgto_evento || '',
            pgto_parcela: c.pgto_parcela || '',
            pgto_fat: c.pgto_fat || '',
            faturamento_ncm: c.faturamento_ncm || '',
            prazo_entrega: c.prazo_entrega || '',
            validade: c.validade || '',
            data_base: c.data_base || '',
            despesas: c.despesas || '',
            transporte: c.transporte || '',
            condicoes: c.condicoes || ''
        };

        const signatarios = [
            { nome: c.sig1_nome, cargo: c.sig1_cargo, tel: c.sig1_tel, cel: c.sig1_cel, email: c.sig1_email },
            { nome: c.sig2_nome, cargo: c.sig2_cargo, tel: c.sig2_tel, cel: c.sig2_cel, email: c.sig2_email },
            { nome: c.sig3_nome, cargo: c.sig3_cargo, tel: c.sig3_tel, cel: c.sig3_cel, email: c.sig3_email }
        ].filter(s => s.nome);

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório da Proposta - ${this._escapeHtml(projeto)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; padding: 40px; }
        .page { max-width: 1100px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: var(--color-accent); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 24px; font-weight: 800; }
        .header .sub { font-size: 14px; opacity: 0.85; margin-top: 4px; }
        .header .codigo { font-size: 12px; opacity: 0.7; }
        .logos { display: flex; gap: 20px; align-items: center; }
        .logos img { max-height: 60px; max-width: 140px; border-radius: 8px; }
        .section { padding: 30px 40px; border-bottom: 1px solid #e2e8f0; }
        .section:last-of-type { border-bottom: none; }
        .section-title { font-size: 18px; font-weight: 800; color: #1e3a8a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .field { margin-bottom: 8px; }
        .field-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; }
        .field-value { font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
        th { background: var(--color-accent); color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
        tr:hover td { background: #f8fafc; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-yellow { background: #fef3c7; color: #92400e; }
        .card-eq { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .card-eq h3 { color: #1e3a8a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .card-eq .tag-type { font-size: 11px; font-weight: 400; color: #64748b; }
        .sub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
        .sub-grid .field { background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #f1f5f9; }
        .norms-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .norms-list span { background: #eff6ff; color: #1e40af; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .footer { background: #1e293b; color: #94a3b8; padding: 20px 40px; text-align: center; font-size: 12px; }
        .footer a { color: var(--color-accent); text-decoration: none; }
        .print-btn { position: fixed; bottom: 30px; right: 30px; z-index: 100; }
        .print-btn button { background: #1e3a8a; color: white; border: none; padding: 14px 28px; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .print-btn button:hover { transform: scale(1.05); }
        .total-row td { font-weight: 800; background: #fef3c7; color: #92400e; }
        .assinatura-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
        .vazio { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }
        @media print {
            body { background: white; padding: 0; }
            .page { box-shadow: none; border-radius: 0; }
            .print-btn { display: none; }
            .section { page-break-inside: avoid; }
            .card-eq { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="print-btn"><button onclick="window.print()"><i class="ph ph-printer"></i> Imprimir / PDF</button></div>

    <div class="page">

        <!-- HEADER -->
        <div class="header">
            <div>
                <h1>${this._escapeHtml(projeto)}</h1>
                <div class="sub">${this._escapeHtml(objeto)}</div>
                <div class="codigo">${this._escapeHtml(codigo)}</div>
            </div>
            ${_s('logos') ? `
            <div class="logos">
                ${logo ? `<img src="${logo}" alt="Logo" style="background:white;padding:4px;">` : ''}
                ${clientLogo ? `<img src="${clientLogo}" alt="Logo Cliente" style="background:white;padding:4px;">` : ''}
            </div>` : ''}
        </div>

        ${_s('dadosGerais') ? `
        <!-- 1. DADOS GERAIS -->
        <div class="section">
            <div class="section-title"><i class="ph ph-identification-card"></i> Dados Gerais</div>
            <div class="grid-2">
                <div class="field"><div class="field-label">Cliente</div><div class="field-value">${this._escapeHtml(cliente)}</div></div>
                <div class="field"><div class="field-label">Localização</div><div class="field-value">${this._escapeHtml(localizacao)}</div></div>
                <div class="field"><div class="field-label">Contato</div><div class="field-value">${this._escapeHtml(contato)}</div></div>
                <div class="field"><div class="field-label">E-mail</div><div class="field-value">${this._escapeHtml(email)}</div></div>
                <div class="field"><div class="field-label">Telefone</div><div class="field-value">${this._escapeHtml(telefone)}</div></div>
                <div class="field"><div class="field-label">Data de Emissão</div><div class="field-value">${this._escapeHtml(dataEmissao)}</div></div>
            </div>
        </div>` : ''}

        ${_s('escopo') ? `
        <!-- 2. ESCOPO -->
        <div class="section">
            <div class="section-title"><i class="ph ph-list-checks"></i> Escopo de Fornecimento</div>
            ${scopeItems.length > 0 ? `
            <table>
                <thead><tr><th>#</th><th>Descrição</th><th style="width:60px;text-align:center">PTC</th><th style="width:60px;text-align:center">Cliente</th></tr></thead>
                <tbody>
                    ${scopeItems.map((item, i) => `
                        <tr>
                            <td style="width:40px;color:#94a3b8;">${i + 1}</td>
                            <td>${this._escapeHtml(item.desc)} ${item.auto ? '<span class="badge badge-green" style="margin-left:8px;">Auto</span>' : ''}</td>
                            <td style="text-align:center">${item.minhaEmpresa ? '<i class="ph ph-check" style="color:#16a34a;"></i>' : '<i class="ph ph-minus" style="color:#cbd5e1;"></i>'}</td>
                            <td style="text-align:center">${item.cli ? '<i class="ph ph-check" style="color:#16a34a;"></i>' : '<i class="ph ph-minus" style="color:#cbd5e1;"></i>'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>` : '<div class="vazio">Nenhum item de escopo cadastrado.</div>'}
        </div>` : ''}

        ${_s('equipamentos') ? `
        <!-- 3. EQUIPAMENTOS -->
        <div class="section">
            <div class="section-title"><i class="ph ph-cpu"></i> Equipamentos (${equipments.length})</div>

            ${equipments.length === 0 ? '<div class="vazio">Nenhum equipamento cadastrado.</div>' : equipments.map((eq, idx) => {
                const t = eq.technical || {};
                const NORM_LABELS = {
                    nbr_iec_61439: 'ABNT NBR IEC 61439-1 e 2',
                    nbr_iec_62271: 'ABNT NBR IEC 62271-200',
                    nr10: 'NR-10',
                    nr12: 'NR-12',
                    nbr14039: 'ABNT NBR 14039',
                    nbr_iec_60529: 'ABNT NBR IEC 60529'
                };
                const norms = (eq.norms || []).map(id => NORM_LABELS[id] || id);
                const customNorms = eq.customNorms || [];
                const loads = eq.loads || [];
                const enclosureItems = eq.enclosureItems || [];
                const busbars = eq.busbars || {};
                const deviations = eq.deviations || [];
                const labor = eq.labor || {};
                const laborItems = labor.items || [];
                const expenses = eq.expenses || [];
                const precEq = precMap[eq.tag] || {};

                return `
                <div class="card-eq">
                    <h3>
                        <span class="badge badge-blue">${idx + 1}</span>
                        ${this._escapeHtml(eq.tag)}
                        <span class="tag-type">— ${this._escapeHtml(eq.type)}</span>
                    </h3>

                    ${_s('fichaTecnica') && Object.keys(t).length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Ficha Técnica</div>
                        <div class="sub-grid">
                            ${Object.entries(t).map(([key, val]) => val ? `
                                <div class="field"><div class="field-label">${this._escapeHtml(key)}</div><div class="field-value">${this._escapeHtml(String(val))}</div></div>
                            ` : '').join('')}
                        </div>
                    </div>` : ''}

                    ${_s('normas') && (norms.length > 0 || customNorms.length > 0) ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Normas Aplicáveis</div>
                        <div class="norms-list">
                            ${norms.map(n => `<span>${this._escapeHtml(n)}</span>`).join('')}
                            ${customNorms.map(cn => `<span style="background:#fef3c7;color:#92400e;">${this._escapeHtml(cn.label)}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    ${_s('cargas') && loads.length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Cargas (${loads.length})</div>
                        <table>
                            <thead><tr><th>Tag</th><th>Descrição</th><th>Potência</th><th>Tensão</th><th>Corrente</th></tr></thead>
                            <tbody>
                                ${loads.map(ld => `<tr><td>${this._escapeHtml(ld.tag || '')}</td><td>${this._escapeHtml(ld.desc || '')}</td><td>${this._escapeHtml(ld.power || '')}</td><td>${this._escapeHtml(ld.tensao || '')}</td><td>${this._escapeHtml(ld.current || '')}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>` : ''}

                    ${_s('chaparia') && enclosureItems.length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Chaparia (${enclosureItems.length})</div>
                        <table>
                            <thead><tr><th>Col.</th><th>Tipo</th><th>Dimensão</th><th>IP</th><th>Cor</th></tr></thead>
                            <tbody>
                                ${enclosureItems.map(en => `<tr><td>${this._escapeHtml(en.col || '')}</td><td>${this._escapeHtml(en.type || '')}</td><td>${this._escapeHtml(en.dim || '')}</td><td>${this._escapeHtml(en.ip || '')}</td><td>${this._escapeHtml(en.color || '')}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>` : ''}

                    ${_s('barramentos') && (busbars.main || busbars.branch || busbars.ground) ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Barramentos</div>
                        <div class="sub-grid">
                            ${busbars.main ? `<div class="field"><div class="field-label">Principal</div><div class="field-value">${this._escapeHtml(busbars.main.mat)} ${this._escapeHtml(busbars.main.dim)} (${busbars.main.inc || ''})</div></div>` : ''}
                            ${busbars.branch ? `<div class="field"><div class="field-label">Derivação</div><div class="field-value">${this._escapeHtml(busbars.branch.mat)} ${this._escapeHtml(busbars.branch.dim)} (${busbars.branch.inc || ''})</div></div>` : ''}
                            ${busbars.ground ? `<div class="field"><div class="field-label">Terra</div><div class="field-value">${this._escapeHtml(busbars.ground.mat)} ${this._escapeHtml(busbars.ground.dim)}</div></div>` : ''}
                        </div>
                    </div>` : ''}

                    ${_s('exclusionsDeviations') && deviations.length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;margin-bottom:6px;">Desvios</div>
                        <ul style="margin-left:20px;font-size:13px;color:#475569;">
                            ${deviations.map(dv => {
                                if (typeof dv === 'string') return `<li>${this._escapeHtml(dv)}</li>`;
                                const parts = [];
                                if (dv.documento) parts.push(`<strong>${this._escapeHtml(dv.documento)}</strong>`);
                                if (dv.solicitado) parts.push(`Solicitado: ${this._escapeHtml(dv.solicitado)}`);
                                if (dv.desvio) parts.push(this._escapeHtml(dv.desvio));
                                return `<li>${parts.join(' — ')}</li>`;
                            }).join('')}
                        </ul>
                    </div>` : ''}

                    ${_s('maoDeObra') && laborItems.length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Mão de Obra (${laborItems.reduce((s, li) => s + (li.hours || 0), 0)}h)</div>
                        <table>
                            <thead><tr><th>Função</th><th>Horas</th><th>Valor/h</th><th>Total</th></tr></thead>
                            <tbody>
                                ${laborItems.map(li => `<tr><td>${this._escapeHtml(li.role || '')}</td><td>${li.hours || 0}h</td><td>${_fmt(li.hourlyRate || 0)}</td><td>${_fmt((li.hours || 0) * (li.hourlyRate || 0))}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>` : ''}

                    ${_s('despesas') && expenses.length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Despesas</div>
                        <table>
                            <thead><tr><th>Descrição</th><th>Qtd</th><th>Unitário</th><th>Subtotal</th></tr></thead>
                            <tbody>
                                ${expenses.map(ex => `<tr><td>${this._escapeHtml(ex.desc || '')}</td><td>${ex.qtd || 0}</td><td>${_fmt(ex.unit || 0)}</td><td>${_fmt((ex.unit || 0) * (ex.qtd || 0))}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>` : ''}

                    ${_s('precificacao') && precEq.ipi !== undefined ? `
                    <div style="margin-bottom:0;">
                        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Precificação</div>
                        <div class="sub-grid">
                            ${precEq.businessType ? `<div class="field"><div class="field-label">Tipo</div><div class="field-value">${this._escapeHtml(precEq.businessType)}</div></div>` : ''}
                            ${eq.ufOrigem ? `<div class="field"><div class="field-label">UF Origem</div><div class="field-value">${this._escapeHtml(eq.ufOrigem)}</div></div>` : ''}
                            ${ufDestino ? `<div class="field"><div class="field-label">UF Destino</div><div class="field-value">${this._escapeHtml(ufDestino)}</div></div>` : ''}
                            ${precEq.icms !== undefined ? `<div class="field"><div class="field-label">ICMS</div><div class="field-value">${precEq.icms}%</div></div>` : ''}
                            ${precEq.ipi !== undefined ? `<div class="field"><div class="field-label">IPI</div><div class="field-value">${precEq.ipiIsento ? 'Isento' : precEq.ipi + '%'}</div></div>` : ''}
                            ${precEq.margemIdeal ? `<div class="field"><div class="field-label">Margem Ideal</div><div class="field-value">${precEq.margemIdeal}%</div></div>` : ''}
                        </div>
                    </div>` : ''}
                </div>`;
            }).join('')}
        </div>` : ''}

        ${_s('exclusionsDeviations') && (proposalExclusions.length > 0) ? `
        <!-- EXCLUSÕES DA PROPOSTA -->
        <div class="section">
            <div class="section-title"><i class="ph ph-x-circle"></i> Exclusões Técnicas (${proposalExclusions.length})</div>
            <ul style="margin-left:20px;font-size:13px;color:#475569;">
                ${proposalExclusions.map(ex => {
                    if (typeof ex === 'string') return `<li>${this._escapeHtml(ex)}</li>`;
                    return `<li>${this._escapeHtml(ex.texto || '')}</li>`;
                }).join('')}
            </ul>
        </div>` : ''}

        ${_s('vendorList') ? `
        <!-- 4. VENDOR LIST -->
        <div class="section">
            <div class="section-title"><i class="ph ph-buildings"></i> Vendor List</div>
            ${vendorList.length > 0 ? `
            <table>
                <thead><tr><th>Componente</th><th>Fabricante</th><th>Alternativa</th></tr></thead>
                <tbody>
                    ${vendorList.map(v => `<tr><td>${this._escapeHtml(v.comp || '')}</td><td>${this._escapeHtml(v.brand || '')}</td><td>${this._escapeHtml(v.opt || '')}${v.optEspecifique ? ' — ' + this._escapeHtml(v.optEspecifique) : ''}</td></tr>`).join('')}
                </tbody>
            </table>` : '<div class="vazio">Nenhum fornecedor cadastrado.</div>'}
        </div>` : ''}

        ${_s('revisoes') ? `
        <!-- 5. REVISÕES -->
        <div class="section">
            <div class="section-title"><i class="ph ph-clock-counter-clockwise"></i> Revisões</div>
            ${revisions.length > 0 ? `
            <table>
                <thead><tr><th>Rev.</th><th>Descrição</th><th>Elab.</th><th>Verif.</th><th>Aprov.</th><th>Data</th></tr></thead>
                <tbody>
                    ${revisions.map(r => `<tr><td>${this._escapeHtml(r.no || '')}</td><td>${this._escapeHtml(r.desc || '')}</td><td>${this._escapeHtml(r.elab || '')}</td><td>${this._escapeHtml(r.verif || '')}</td><td>${this._escapeHtml(r.aprov || '')}</td><td>${this._escapeHtml(r.data || '')}</td></tr>`).join('')}
                </tbody>
            </table>` : '<div class="vazio">Nenhuma revisão cadastrada.</div>'}
        </div>` : ''}

        ${_s('condicoesComerciais') ? `
        <!-- 6. CONDIÇÕES COMERCIAIS -->
        <div class="section">
            <div class="section-title"><i class="ph ph-handshake"></i> Condições Comerciais</div>
            <div class="grid-2">
                <div class="field"><div class="field-label">Condição de Pagamento</div><div class="field-value">${condicoes.pagamento_eventos && condicoes.pagamento_eventos.length > 0 ? `
                    <table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:4px;">
                        <thead><tr style="background:#f1f5f9;"><th style="padding:6px 8px;text-align:left;">Evento</th><th style="padding:6px 8px;text-align:left;width:80px;">%</th><th style="padding:6px 8px;text-align:left;">Descrição</th></tr></thead>
                        <tbody>${condicoes.pagamento_eventos.map((ev, i) => `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px 8px;font-weight:600;">${i+1}° EVENTO DE PAGAMENTO</td><td style="padding:6px 8px;">${this._escapeHtml(ev.percentual||'')}</td><td style="padding:6px 8px;">${this._escapeHtml(ev.descricao||'')}</td></tr>`).join('')}</tbody>
                    </table>` : `${this._escapeHtml(condicoes.pgto_evento)} — ${this._escapeHtml(condicoes.pgto_parcela)} (${this._escapeHtml(condicoes.pgto_fat)})`}</div></div>
                <div class="field"><div class="field-label">Classificação Fiscal (NCM)</div><div class="field-value">${this._escapeHtml(condicoes.faturamento_ncm)}</div></div>
                <div class="field"><div class="field-label">Prazo de Entrega</div><div class="field-value">${this._escapeHtml(condicoes.prazo_entrega)}</div></div>
                <div class="field"><div class="field-label">Validade / Data Base</div><div class="field-value">${this._escapeHtml(condicoes.validade)} / ${this._escapeHtml(condicoes.data_base)}</div></div>
                <div class="field"><div class="field-label">Despesas</div><div class="field-value">${this._escapeHtml(condicoes.despesas)}</div></div>
                <div class="field"><div class="field-label">Transporte</div><div class="field-value">${this._escapeHtml(condicoes.transporte)}</div></div>
            </div>
            ${condicoes.condicoes ? `<div style="margin-top:12px;"><div class="field-label">Observações</div><div style="margin-top:4px;font-size:13px;color:#475569;background:#f8fafc;padding:12px;border-radius:8px;">${this._escapeHtml(condicoes.condicoes)}</div></div>` : ''}
        </div>` : ''}

        ${_s('assinaturas') ? `
        <!-- 7. ASSINATURAS -->
        ${signatarios.length > 0 ? `
        <div class="section">
            <div class="section-title"><i class="ph ph-signature"></i> Assinaturas</div>
            <div style="display:grid;grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                ${signatarios.map(s => `
                    <div class="assinatura-card">
                        <div style="font-weight:800;color:#1e3a8a;font-size:15px;">${this._escapeHtml(s.nome)}</div>
                        <div style="font-size:12px;color:#64748b;margin-top:2px;">${this._escapeHtml(s.cargo)}</div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:8px;">
                            ${s.tel ? `<div>Tel: ${this._escapeHtml(s.tel)}</div>` : ''}
                            ${s.cel ? `<div>Cel: ${this._escapeHtml(s.cel)}</div>` : ''}
                            ${s.email ? `<div>${this._escapeHtml(s.email)}</div>` : ''}
                        </div>
                        <div style="margin-top:16px;padding-top:12px;border-top:1px dashed #e2e8f0;font-size:11px;color:#94a3b8;">____________________________</div>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}` : ''}

        <!-- FOOTER -->
        <div class="footer">
            Relatório gerado automaticamente pelo GeraPro &mdash; ${new Date().toLocaleString('pt-BR')}
        </div>

    </div>

    <script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>
</body>
</html>`;
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    _abrirJanela(html) {
        const w = window.open('', '_blank');
        if (!w) {
            app.toast('Permita pop-ups para abrir o relatório.', 'warning');
            return;
        }
        w.document.write(html);
        w.document.close();
    }
};

window.relatorioProposta = RelatorioProposta;
