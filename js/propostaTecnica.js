import { store } from './state.js';

import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from './busbarCalculator.js';

import { deriveMaterials } from './automacaoMateriais.js';

import { EMPRESA } from './empresaConfig.js';

import { infraSubtotal, infraPrecoFinal } from './infraPricing.js';



const app = window.app;
import { COMMON_NORMS, ELETROCENTRO_NORMS, DEFAULT_LABOR_ROLES, DEFAULT_EXPENSES, VENDOR_MAP, DEFAULT_ELETROCENTRO_SCOPE, migrateEletrocentroScope, DEFAULT_EXCLUSIONS, makeDefaultExclusions, AUTPRO_SCOPE_ITEMS, PREMISSAS_IDS, PREMISSAS_LABELS, PREMISSAS_NUMBERS, DOCUMENTACAO_IDS, DOCUMENTACAO_LABELS, DOCUMENTACAO_ORDER, DOCUMENTACAO_SUB_MASTERS, FORNECIMENTO_IDS, FORNECIMENTO_ORDER, FORNECIMENTO_SUB_MASTERS, FORNECIMENTO_STATIC_SUB_ITEMS } from './propostaTecnica/shared.js';
import { core } from './propostaTecnica/core.js';
import { tabs } from './propostaTecnica/tabs.js';
import { equipments } from './propostaTecnica/equipments.js';
import { layout } from './propostaTecnica/layout.js';
import { bom } from './propostaTecnica/bom.js';
import { loadsIO } from './propostaTecnica/loadsIO.js';
import { editor } from './propostaTecnica/editor.js';

// Fase 6: modulo montado via Object.assign a partir dos 7 blocos em js/propostaTecnica/.
// O trecho final (infraestrutura + init + export) permanece verbatim abaixo.
const PropostaTecnicaModule = Object.assign({}, core, tabs, equipments, layout, bom, loadsIO, editor);




// ─── Infraestrutura Tab ───────────────────────────────────────────────

PropostaTecnicaModule._infraSubtotal = function(item, perda) {
    return infraSubtotal(item, perda);
};

PropostaTecnicaModule._infraPrecoFinal = function(item, perda) {
    return infraPrecoFinal(item, perda);
};

PropostaTecnicaModule._recalcInfraFooter = function() {
    const tbody = document.getElementById('infra-table-body');
    if (!tbody) return;
    const perdaEl = document.querySelector('[name="infra_perda"]');
    const perda = perdaEl ? app.parseCurrency(perdaEl.value) || 10 : 10;
    let totalCustoDireto = 0, totalPrecoFinal = 0;

    // Icms/IPI não possuem inputs na tabela → lê do item gravado (mesma fonte do documento)
    const _ptData = store.getState().activeTechnicalProposal;
    const _ptDisc = _ptData?.infraestrutura?.disciplinas.find(d => d.id === _ptData.infraestrutura.activeDisciplina);

    tbody.querySelectorAll('tr[data-infra-index]').forEach(row => {
        const i = parseInt(row.getAttribute('data-infra-index'));
        const g = (name) => {
            const el = row.querySelector(`[name="infra_${name}_${i}"]`);
            return el ? app.parseCurrency(el.value) || 0 : 0;
        };
        const qtd = g('qtd');
        const cu = g('custoUnitario');
        const hi = g('horasInstalacao');
        const vh = g('valorHora');
        const dif = parseFloat(row.querySelector(`[name="infra_dificuldade_${i}"]`)?.value) || 1.0;
        const desc = g('desconto');
        const markup = g('markup');
        const stored = _ptDisc?.itens?.[i];
        const item = {
            qtd, custoUnitario: cu, horasInstalacao: hi, valorHora: vh, dificuldade: dif,
            desconto: desc, markup,
            icms: stored?.icms || 0,
            ipi: stored?.ipi || 0
        };

        const custoDireto = PropostaTecnicaModule._infraSubtotal(item, perda);
        const pf = PropostaTecnicaModule._infraPrecoFinal(item, perda);

        const tds = row.querySelectorAll('td');
        const cellCount = tds.length;
        if (cellCount >= 3) {
            if (tds[cellCount - 3]) tds[cellCount - 3].textContent = app.formatCurrency(custoDireto);
            if (tds[cellCount - 2]) tds[cellCount - 2].textContent = app.formatCurrency(pf);
        }

        totalCustoDireto += custoDireto;
        totalPrecoFinal += pf;
    });

    const footer = document.getElementById('infra-footer-stats');
    if (footer) {
        const qty = tbody.querySelectorAll('tr[data-infra-index]').length;
        footer.innerHTML = `Itens: <strong>${qty}</strong>` +
            `<span style="margin:0 10px;color:#d1d5db;">|</span>` +
            `Custo Direto: <strong>${app.formatCurrency(totalCustoDireto)}</strong>` +
            `<span style="margin:0 10px;color:#d1d5db;">|</span>` +
            `<span style="font-size:14px;font-weight:700;color:#4d7c0f;">Pre\u00e7o Final: ${app.formatCurrency(totalPrecoFinal)}</span>`;
    }
};

const INFRA_PREFIX = {
    civil: 'CIV', eletrica: 'ELE', spda: 'ATE',
    mecanica: 'MEC', cabeamento: 'CAB', servicos: 'SER'
};

PropostaTecnicaModule._infraAtividadesPadrao = {
    eletrica: [
        'Montagem de eletrocalha perfurada (aço galvanizado ou inox)',
        'Montagem de leito para cabos tipo escada (aço ou alumínio)',
        'Fabricação e instalação de suportes para eletrocalha',
        'Instalação de tampa cega para eletrocalha',
        'Montagem de conexões (curva, T, redução, luva) em eletrocalha',
        'Instalação de separadores internos em eletrocalha',
        'Selagem corta-fogo em passagem de eletrocalha entre ambientes',
        'Montagem de eletroduto de aço carbono galvanizado (roscado)',
        'Montagem de eletroduto de PVC rígido (roscável ou soldável)',
        'Instalação de eletroduto corrugado embutido em alvenaria',
        'Fabricação e instalação de suportes para eletroduto',
        'Montagem de conduletes (C, LB, LR, LL, T)',
        'Instalação de caixas de passagem metálicas ou de PVC',
        'Ensaio de estanqueidade em eletroduto enterrado',
        'Lançamento de cabos de cobre PP/EPR/PVC (baixa tensão)',
        'Lançamento de cabos de média tensão (6,6 kV a 35 kV)',
        'Lançamento de cabos de controle e instrumentação blindados',
        'Identificação e anilhamento de cabos',
        'Teste de isolação (megôhmetro) em cabos instalados',
        'Crimpagem de terminais de compressão (ilhos, pino, olhal)',
        'Montagem de conectores de emenda e derivação',
        'Montagem de malha de terra funcional interna',
        'Instalação de haste de terra (copperweld / aço cobreado)',
        'Solda exotérmica em conexões de aterramento',
        'Instalação de barra de equalização de potencial',
        'Montagem de quadro de distribuição (QDC / QDF)',
        'Instalação de dispositivo de proteção contra surto (DPS)',
        'Instalação de disjuntor geral e fusíveis',
        'Fornecimento e montagem de suporte para banco de baterias',
        'Instalação de bandeja para roteamento de cabos em sala elétrica',
        'Pintura de piso e sinalização de área elétrica',
        'Montagem de iluminação de emergência na sala elétrica',
        'Teste de continuidade e funcional geral do sistema',
        'Lançamento de cabo de potência 2x1,5mm²',
        'Lançamento de cabo de potência 2x2,5mm²',
        'Lançamento de cabo de potência 3x1,5mm²',
        'Lançamento de cabo de potência 3x2,5mm²',
        'Lançamento de cabo de potência 3x4mm²',
        'Lançamento de cabo de potência 3x6mm²',
        'Lançamento de cabo de potência 3x10mm²',
        'Lançamento de cabo de potência 3x16mm²',
        'Lançamento de cabo de potência 3x25mm²',
        'Lançamento de cabo de potência 3x35mm²',
        'Lançamento de cabo de potência 3x50mm²',
        'Lançamento de cabo de potência 4x4mm²',
        'Lançamento de cabo de potência 4x6mm²',
        'Lançamento de cabo de potência 4x10mm²',
        'Lançamento de cabo de potência 4x16mm²',
        'Lançamento de cabo de potência 4x25mm²',
        'Lançamento de cabo de potência 4x35mm²',
        'Lançamento de cabo de potência 4x50mm²',
        'Lançamento de cabo de potência 3x1,5mm² + 1x1,5mm²',
        'Lançamento de cabo de potência 3x2,5mm² + 1x2,5mm²',
        'Lançamento de cabo de potência 3x4mm² + 1x4mm²',
        'Lançamento de cabo de potência 3x6mm² + 1x4mm²',
        'Lançamento de cabo de potência 3x10mm² + 1x6mm²',
        'Lançamento de cabo de potência 3x16mm² + 1x10mm²',
        'Lançamento de cabo de potência 3x25mm² + 1x16mm²',
        'Lançamento de cabo de potência 3x35mm² + 1x16mm²',
        'Lançamento de cabo de potência 3x50mm² + 1x25mm²',
        'Lançamento de cabo de potência 3x70mm² + 1x35mm²',
        'Lançamento de cabo de potência 3x95mm² + 1x50mm²',
        'Lançamento de cabo de potência 3x120mm² + 1x70mm²',
        'Lançamento de cabo de potência 3x150mm² + 1x95mm²',
        'Lançamento de cabo de potência 3x185mm² + 1x95mm²',
        'Lançamento de cabo de potência 3x240mm² + 1x120mm²',
        'Lançamento de cabo de potência 1x16mm² (fase/neutro/terra)',
        'Lançamento de cabo de potência 1x25mm² (fase/neutro/terra)',
        'Lançamento de cabo de potência 1x35mm² (fase/neutro/terra)',
        'Lançamento de cabo de potência 1x50mm² (fase)',
        'Lançamento de cabo de potência 1x70mm² (fase)',
        'Lançamento de cabo de potência 1x95mm² (fase)',
        'Lançamento de cabo de potência 1x120mm² (fase)',
        'Lançamento de cabo de potência 1x150mm² (fase)',
        'Lançamento de cabo de potência 1x185mm² (fase)',
        'Lançamento de cabo de potência 1x240mm² (fase)'
    ],
    civil: [
        'Execução de regularização de base para assentamento de equipamentos',
        'Execução de contrapiso armado para sala elétrica / data center',
        'Execução de piso elevado (técnico) para data center',
        'Execução de canaleta subterrânea para passagem de cabos',
        'Execução de baldrame e fundação para abrigo elétrico',
        'Execução de alvenaria em blocos de concreto para fechamento de casa elétrica',
        'Execução de chapisco, reboco e emboço em paredes internas',
        'Aplicação de pintura epóxi em paredes e pisos de sala elétrica',
        'Execução de impermeabilização em lajes e áreas molhadas',
        'Execução de cobertura metálica para abrigo de equipamentos',
        'Instalação de porta corta-fogo',
        'Fabricação e montagem de estrutura metálica para suporte de painéis',
        'Execução de dreno e canaleta para captação de água pluvial',
        'Execução de passeio externo e vias de acesso',
        'Execução de sinalização horizontal e vertical de área industrial',
        'Instalação de bancada de granito/mármore em sala de manutenção',
        'Execução de revestimento cerâmico em paredes',
        'Fornecimento e instalação de forro de PVC ou mineral',
        'Execução de regularização e nivelamento de piso para assentamento de racks',
        'Execução de soleira e peitoril em granito'
    ],
    spda: [
        'Instalação de captor tipo Franklin (haste com esfera)',
        'Instalação de captor tipo eletromagnético (ionizante)',
        'Montagem de suporte para captor em estrutura metálica',
        'Lançamento de cabo de descida em cobre nú 35mm²',
        'Lançamento de cabo de descida em cobre nú 50mm²',
        'Fixação de cabo de descida com isolador de porcelana',
        'Execução de conexão de descida ao anel de aterramento (solda exotérmica)',
        'Instalação de caixa de inspeção de aterramento',
        'Montagem de anel de aterramento em cobre nú 50mm²',
        'Execução de malha de terra com cabo de cobre nú',
        'Instalação de haste de aterramento tipo copperweld (5/8" x 3m)',
        'Execução de abertura e fechamento de vala para anel de aterramento',
        'Execução de medição de resistência de aterramento (método dos 62%)',
        'Instalação de equalizador de potencial em SPDA',
        'Fixação de suporte para cabos em laje e fachada',
        'Execução de passagem de cabo SPDA por eletroduto embutido',
        'Execução de selagem corta-fogo em penetração de SPDA',
        'Execução de teste de continuidade elétrica do sistema SPDA',
        'Elaboração de laudo técnico de medição de aterramento',
        'Execução de sinalização de área de risco de descarga atmosférica'
    ],
    mecanica: [
        'Montagem de chiller condensado a ar',
        'Montagem de chiller condensado a água',
        'Instalação de fan coil tipo cassete',
        'Instalação de fan coil de teto (tubulação oculta)',
        'Montagem de condensadora split (VRF / VRV)',
        'Montagem de evaporadora split cassete (VRF / VRV)',
        'Montagem de evaporadora split de parede (VRF / VRV)',
        'Instalação de unidade manipuladora de ar (AHU)',
        'Montagem de exaustor centrífugo',
        'Montagem de exaustor axial de parede',
        'Instalação de veneziana de exaustão com dampers',
        'Montagem de compressor de ar comprimido (parafuso / pistão)',
        'Instalação de secador frigorífico para ar comprimido',
        'Montagem de filtro coalescente para ar comprimido',
        'Execução de rede de distribuição de ar comprimido em aço galvanizado',
        'Montagem de dreno automático em ponto baixo da rede',
        'Instalação de pressostato e válvula de alívio',
        'Montagem de bomba centrífuga para circulação de água gelada',
        'Montagem de bomba de pressurização de rede hidráulica',
        'Instalação de vaso de expansão para sistema de água gelada',
        'Execução de isolamento térmico em tubulação de água gelada',
        'Execução de teste de estanqueidade em circuito hidráulico',
        'Execução de partida e comissionamento de sistema de climatização',
        'Fornecimento e instalação de dutos de ar condicionado',
        'Instalação de grelha e difusor de insuflamento'
    ],
    cabeamento: [
        'Lançamento de cabo UTP Cat.6A blindado',
        'Lançamento de cabo UTP Cat.6 não blindado',
        'Lançamento de cabo de fibra óptica monomodo (SM)',
        'Lançamento de cabo de fibra óptica multimodo (MM)',
        'Execução de emenda de fibra óptica por fusão',
        'Montagem de conector LC / SC em fibra óptica',
        'Execução de teste de atenuação em fibra óptica (OTDR)',
        'Montagem de patch panel 1U / 2U (48 portas)',
        'Montagem de organizador horizontal de cabos',
        'Instalação de rack fechado 42U (19")',
        'Instalação de rack aberto para DIO (distribuidor interno óptico)',
        'Montagem de DIO (distribuidor interno óptico)',
        'Lançamento de cabo coaxial RG-6 / RG-11',
        'Instalação de tomada RJ-45 fêmea (keystone)',
        'Execução de teste de certificação de cabos metálicos (Fluke DSX)',
        'Execução de identificação e etiquetagem de cabos e portas',
        'Montagem de guia de cabos (cable manager) vertical',
        'Execução de aterramento de rack e infraestrutura de telecom',
        'Instalação de saída de ar para ventilação de rack',
        'Execução de organização e amarração de cabos com velcro'
    ],
    servicos: [
        'Execução de levantamento técnico em campo para infraestrutura',
        'Elaboração de projeto executivo de infraestrutura elétrica e mecânica',
        'Fornecimento de mão de obra técnica especializada em infraestrutura',
        'Execução de supervisão técnica de instalação de infraestrutura',
        'Execução de comissionamento e teste funcional de sistemas de infraestrutura',
        'Elaboração de relatório técnico (ART / TRT) de infraestrutura',
        'Execução de treinamento operacional in loco (8h) para sistemas instalados',
        'Execução de gerenciamento de obra de infraestrutura',
        'Execução de mobilização e desmobilização de equipe técnica',
        'Execução de transporte de materiais e equipamentos para obra',
        'Locação de equipamentos de teste e medição',
        'Fornecimento de serviço de garantia estendida (12 meses) para sistemas',
        'Fornecimento de painel elétrico montado e testado em fábrica',
        'Execução de serviço de engenharia para adequação de layout',
        'Elaboração de as built de infraestrutura instalada'
    ]
};

PropostaTecnicaModule._infraDescricaoInput = function(i, item, disc) {
    const listName = 'infra-sugestoes-' + disc.id;
    const atividades = PropostaTecnicaModule._infraAtividadesPadrao[disc.id];
    const val = PropostaTecnicaModule._escapeHtml(item.descricao || '');
    if (atividades) {
        const opts = atividades.map(a => `<option value="${PropostaTecnicaModule._escapeHtml(a)}">`).join('');
        return `<input type="text" name="infra_descricao_${i}" class="form-control" value="${val}" list="${listName}" style="width:200px;font-size:11px;padding:6px 4px;"><datalist id="${listName}">${opts}</datalist>`;
    }
    return `<input type="text" name="infra_descricao_${i}" class="form-control" value="${val}" style="width:200px;font-size:11px;padding:6px 4px;">`;
};

PropostaTecnicaModule.renderTabInfraestrutura = function(data) {
    const infra = data.infraestrutura;
    if (infra.activeDisciplina === 'custos') {
        return PropostaTecnicaModule.renderTabelaCustosUnitarios(data);
    }
    const disc = infra.disciplinas.find(d => d.id === infra.activeDisciplina) || infra.disciplinas[0];
    if (!disc) return '<div style="padding:30px;">Nenhuma disciplina encontrada.</div>';

    const totalItensGeral = infra.disciplinas.reduce((s, d) => s + d.itens.length, 0);
    const sidebar = infra.disciplinas.map(d => `
        <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('${d.id}')"
            style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:${d.id === infra.activeDisciplina ? 'var(--color-accent)' : 'transparent'};color:${d.id === infra.activeDisciplina ? '#fff' : '#374151'};font-size:12px;font-weight:${d.id === infra.activeDisciplina ? '600' : '400'};cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
            <i class="ph ${d.icone}" style="font-size:16px;"></i>
            <span>${PropostaTecnicaModule._escapeHtml(d.nome)}</span>
            <span style="margin-left:auto;background:${d.id === infra.activeDisciplina ? 'rgba(255,255,255,0.2)' : '#e5e7eb'};padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${d.itens.length}</span>
        </button>
    `).join('<div style="margin:2px 0;"></div>') +
    '<div style="border-top:1px solid #e2e8f0;margin:6px 0;"></div>' +
    `<button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('custos')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-currency-circle-dollar" style="font-size:16px;"></i>
        <span>Custos Unit\u00e1rios</span>
    </button>`;

    let tableRows = '';
    if (disc.itens.length === 0) {
        tableRows = `<tr><td colspan="13" style="padding:40px;text-align:center;color:#94a3b8;font-size:13px;">
            <i class="ph ph-package" style="font-size:32px;display:block;margin-bottom:8px;"></i>
            Nenhum item cadastrado. Use "Cat\u00e1logo" para buscar do banco ou "Adicionar Item" para incluir manualmente.
        </td></tr>`;
    } else {
        disc.itens.forEach((item, i) => {
            const bgCor = item.materialId ? '#f0fdf4' : '#e0f2fe';
            tableRows += `<tr style="border-bottom:1px solid #f1f5f9;" data-infra-index="${i}">
                <td style="padding:4px;"><input type="text" name="infra_codigo_${i}" class="form-control" value="${PropostaTecnicaModule._escapeHtml(item.codigo || '')}" style="width:80px;font-size:11px;padding:6px 4px;background:${bgCor};border-left:3px solid ${item.materialId ? '#16a34a' : '#2563eb'};"></td>
                <td style="padding:4px;">${PropostaTecnicaModule._infraDescricaoInput(i, item, disc)}</td>
                <td style="padding:4px;"><input type="text" name="infra_qtd_${i}" class="form-control" value="${item.qtd || 0}" style="width:60px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_un_${i}" class="form-control" value="${PropostaTecnicaModule._escapeHtml(item.un || '')}" style="width:50px;font-size:11px;padding:6px 4px;"></td>
                <td style="padding:4px;"><input type="text" name="infra_custoUnitario_${i}" class="form-control" value="${item.custoUnitario || 0}" style="width:100px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_horasInstalacao_${i}" class="form-control" value="${item.horasInstalacao || 0}" style="width:60px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_valorHora_${i}" class="form-control" value="${item.valorHora || 0}" style="width:80px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;">
                    <select name="infra_dificuldade_${i}" class="form-control" style="width:115px;font-size:11px;padding:4px;" onchange="window.propostaTecnicaModule._recalcInfraFooter()">
                        <option value="1.0" ${(item.dificuldade||1.0)===1.0?'selected':''}>Normal (1.0x)</option>
                        <option value="1.5" ${(item.dificuldade||1.0)===1.5?'selected':''}>Elevado (1.5x)</option>
                        <option value="2.5" ${(item.dificuldade||1.0)===2.5?'selected':''}>Cr\u00edtico (2.5x)</option>
                    </select>
                </td>
                <td style="padding:4px;"><input type="text" name="infra_desconto_${i}" class="form-control" value="${item.desconto || 0}" style="width:50px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_markup_${i}" class="form-control" value="${item.markup || 0}" style="width:50px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;text-align:right;font-size:12px;font-weight:600;color:#1e293b;">${app.formatCurrency(PropostaTecnicaModule._infraSubtotal(item, disc.perda))}</td>
                <td style="padding:4px;text-align:right;font-size:12px;font-weight:700;color:#4d7c0f;">${app.formatCurrency(PropostaTecnicaModule._infraPrecoFinal(item, disc.perda))}</td>
                <td style="padding:4px;text-align:center;white-space:nowrap;">
                    <button type="button" onclick="window.propostaTecnicaModule.deleteInfraItem(${i})" class="btn-icon" style="color:#ef4444;border:none;background:none;cursor:pointer;padding:4px;" title="Excluir"><i class="ph ph-trash"></i></button>
                </td>
            </tr>`;
        });
    }

    const totalGeral = disc.itens.reduce((s, item) => {
        const perda = disc.perda ?? 10;
        return s + PropostaTecnicaModule._infraSubtotal(item, perda);
    }, 0);
    const totalPrecoFinal = disc.itens.reduce((s, item) => {
        return s + PropostaTecnicaModule._infraPrecoFinal(item, disc.perda);
    }, 0);

    return `<div style="display:flex;gap:16px;padding:20px;height:100%;overflow:hidden;">
        <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;overflow-y:auto;">
            ${sidebar}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-shrink:0;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">
                    <i class="ph ${disc.icone}" style="margin-right:6px;"></i>
                    ${PropostaTecnicaModule._escapeHtml(disc.nome)}
                </h3>
                <div style="display:flex;align-items:center;gap:10px;">
                    <label style="font-size:11px;color:#475569;display:flex;align-items:center;gap:4px;">
                        Perda:
                        <input type="text" name="infra_perda" class="form-control" value="${disc.perda ?? 10}" style="width:55px;font-size:11px;padding:4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()">
                        <span style="font-size:10px;">%</span>
                    </label>
                    <button type="button" onclick="app.propostaTecnica.openAddInfraMaterialModal()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-package"></i> Cat\u00e1logo
                    </button>
                    <button type="button" onclick="window.propostaTecnicaModule.addInfraItem()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-plus"></i> Adicionar Item
                    </button>
                </div>
            </div>
            <div style="display:flex;gap:16px;margin-bottom:8px;flex-shrink:0;font-size:11px;color:#475569;">
                <span style="display:flex;align-items:center;gap:4px;">
                    <span style="display:inline-block;width:12px;height:12px;background:#e0f2fe;border-left:3px solid #2563eb;border-radius:2px;"></span>
                    Servi\u00e7o
                </span>
                <span style="display:flex;align-items:center;gap:4px;">
                    <span style="display:inline-block;width:12px;height:12px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:2px;"></span>
                    Material (Cat\u00e1logo)
                </span>
            </div>
            <div style="overflow:auto;border:1px solid #e2e8f0;border-radius:8px;background:white;flex:1;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;position:sticky;top:0;z-index:1;">
                            <th style="padding:8px 4px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Código</th>
                            <th style="padding:8px 4px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Descrição</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Qtd</th>
                            <th style="padding:8px 4px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">UN</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Custo Unit.</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">H Inst</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Valor Hora</th>
                            <th style="padding:8px 4px;text-align:center;font-weight:600;color:#475569;white-space:nowrap;">Dificuldade</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Desc %</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Markup %</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Subtotal</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#4d7c0f;white-space:nowrap;">Preço Final</th>
                            <th style="padding:8px 4px;text-align:center;font-weight:600;color:#475569;white-space:nowrap;width:50px;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="infra-table-body">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:8px;padding:10px 16px;background:white;border:1px solid #e2e8f0;border-radius:8px;flex-shrink:0;">
                <div id="infra-footer-stats" style="text-align:right;font-size:12px;">
                    <span style="color:#64748b;">Itens: <strong>${disc.itens.length}</strong></span>
                    <span style="margin:0 10px;color:#d1d5db;">|</span>
                    <span style="color:#64748b;">Custo Direto: <strong>${app.formatCurrency(totalGeral)}</strong></span>
                    <span style="margin:0 10px;color:#d1d5db;">|</span>
                    <span style="font-size:14px;font-weight:700;color:#4d7c0f;">Preço Final: ${app.formatCurrency(totalPrecoFinal)}</span>
                </div>
            </div>
        </div>
    </div>`;
    setTimeout(PropostaTecnicaModule._recalcInfraFooter, 0);
};

// ─── Infraestrutura — Resumo Consolidado ──────────────────────────

PropostaTecnicaModule.renderResumoInfraestrutura = function(data) {
    const infra = data.infraestrutura;

    const discData = infra.disciplinas.map(disc => {
        const perda = disc.perda ?? 10;
        let custoMaterial = 0, custoMO = 0, precoFinal = 0;
        disc.itens.forEach(item => {
            custoMaterial += (item.qtd || 0) * (1 + perda / 100) * (item.custoUnitario || 0);
            custoMO += (item.horasInstalacao || 0) * (item.valorHora || 0) * (item.dificuldade || 1.0);
            precoFinal += PropostaTecnicaModule._infraPrecoFinal(item, perda);
        });
        return {
            id: disc.id, nome: disc.nome, icone: disc.icone,
            qtdItens: disc.itens.length, custoMaterial, custoMO,
            subtotal: custoMaterial + custoMO, precoFinal
        };
    });

    const totalGeral = discData.reduce((s, d) => s + d.subtotal, 0);
    const totalPrecoFinal = discData.reduce((s, d) => s + d.precoFinal, 0);
    const totalItens = discData.reduce((s, d) => s + d.qtdItens, 0);
    const totalMaterial = discData.reduce((s, d) => s + d.custoMaterial, 0);
    const totalMO = discData.reduce((s, d) => s + d.custoMO, 0);

    const sidebar = infra.disciplinas.map(d => `
        <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('${d.id}')"
            style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
            <i class="ph ${d.icone}" style="font-size:16px;"></i>
            <span>${PropostaTecnicaModule._escapeHtml(d.nome)}</span>
            <span style="margin-left:auto;background:#e5e7eb;padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${d.itens.length}</span>
        </button>
    `).join('<div style="margin:2px 0;"></div>') +
    '<div style="border-top:1px solid #e2e8f0;margin:6px 0;"></div>' +
    `<button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('resumo')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:var(--color-accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-chart-bar" style="font-size:16px;"></i>
        <span>Resumo</span>
        <span style="margin-left:auto;background:rgba(255,255,255,0.2);padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${totalItens}</span>
    </button>
    <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('custos')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-currency-circle-dollar" style="font-size:16px;"></i>
        <span>Custos Unit\u00e1rios</span>
    </button>`;

    const cardsHtml = discData.filter(dd => dd.qtdItens > 0).map(dd => `
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <i class="ph ${dd.icone}" style="font-size:20px;color:var(--color-accent);"></i>
                <h4 style="margin:0;font-size:13px;font-weight:600;color:#1e293b;">${PropostaTecnicaModule._escapeHtml(dd.nome)}</h4>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                <div style="color:#64748b;">Itens:</div>
                <div style="text-align:right;font-weight:600;color:#1e293b;">${dd.qtdItens}</div>
                <div style="color:#64748b;">Custo Material:</div>
                <div style="text-align:right;font-weight:600;color:#1e293b;">${app.formatCurrency(dd.custoMaterial)}</div>
                <div style="color:#64748b;">M\u00e3o de Obra:</div>
                <div style="text-align:right;font-weight:600;color:#1e293b;">${app.formatCurrency(dd.custoMO)}</div>
                <div style="border-top:1px solid #e2e8f0;padding-top:6px;color:#1e293b;font-weight:700;">Custo Direto:</div>
                <div style="border-top:1px solid #e2e8f0;padding-top:6px;text-align:right;font-weight:700;color:#1e293b;font-size:13px;">${app.formatCurrency(dd.subtotal)}</div>
                <div style="color:#4d7c0f;font-weight:700;">Pre\u00e7o Final:</div>
                <div style="text-align:right;font-weight:700;color:#4d7c0f;font-size:13px;">${app.formatCurrency(dd.precoFinal)}</div>
            </div>
        </div>
    `).join('');

    const temItens = totalItens > 0;

    return `<div style="display:flex;gap:16px;padding:20px;height:100%;overflow:hidden;">
        <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;overflow-y:auto;">
            ${sidebar}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-shrink:0;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">
                    <i class="ph ph-chart-bar" style="margin-right:6px;"></i>
                    Resumo da Infraestrutura
                </h3>
                <div style="display:flex;gap:8px;">
                    <button type="button" onclick="window.propostaTecnicaModule.exportInfraCSV()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-file-csv"></i> CSV
                    </button>
                    <button type="button" onclick="window.propostaTecnicaModule.exportInfraXLSX()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-file-xls"></i> XLSX
                    </button>
                    <button type="button" onclick="window.propostaTecnicaModule.printInfraResumo()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-printer"></i> Imprimir
                    </button>
                </div>
            </div>
            <div style="overflow-y:auto;flex:1;">
                ${temItens ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-bottom:16px;">
                    ${cardsHtml}
                </div>
                <div style="background:white;border:2px solid var(--color-accent);border-radius:8px;padding:16px;display:flex;align-items:center;justify-content:space-between;">
                    <div style="font-size:12px;color:#64748b;">
                        Itens: <strong>${totalItens}</strong>
                        <span style="margin:0 10px;color:#d1d5db;">|</span>
                        Custo Material: <strong>${app.formatCurrency(totalMaterial)}</strong>
                        <span style="margin:0 10px;color:#d1d5db;">|</span>
                        M\u00e3o de Obra: <strong>${app.formatCurrency(totalMO)}</strong>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px;color:#475569;">Custo Direto Total: <strong>${app.formatCurrency(totalGeral)}</strong></div>
                        <div style="font-size:18px;font-weight:700;color:var(--color-accent);">Pre\u00e7o Final Total: ${app.formatCurrency(totalPrecoFinal)}</div>
                    </div>
                </div>
                ` : '<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;"><i class="ph ph-package" style="font-size:32px;display:block;margin-bottom:8px;"></i>Nenhum item cadastrado na Infraestrutura.</div>'}
            </div>
        </div>
    </div>`;
};

PropostaTecnicaModule.printInfraResumo = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;

    const infra = data.infraestrutura;
    const discData = infra.disciplinas.map(disc => {
        const perda = disc.perda ?? 10;
        let custoMaterial = 0, custoMO = 0, precoFinal = 0;
        disc.itens.forEach(item => {
            custoMaterial += (item.qtd || 0) * (1 + perda / 100) * (item.custoUnitario || 0);
            custoMO += (item.horasInstalacao || 0) * (item.valorHora || 0) * (item.dificuldade || 1.0);
            precoFinal += PropostaTecnicaModule._infraPrecoFinal(item, perda);
        });
        return { nome: disc.nome, qtdItens: disc.itens.length, custoMaterial, custoMO, subtotal: custoMaterial + custoMO, precoFinal };
    });

    const totalGeral = discData.reduce((s, d) => s + d.subtotal, 0);
    const totalPrecoFinal = discData.reduce((s, d) => s + d.precoFinal, 0);
    const totalMaterial = discData.reduce((s, d) => s + d.custoMaterial, 0);
    const totalMO = discData.reduce((s, d) => s + d.custoMO, 0);
    const rows = discData.filter(d => d.qtdItens > 0).map(d => `
        <tr>
            <td style="padding:6px;border:1px solid #ccc;">${PropostaTecnicaModule._escapeHtml(d.nome)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:center;">${d.qtdItens}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;">${app.formatCurrency(d.custoMaterial)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;">${app.formatCurrency(d.custoMO)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;">${app.formatCurrency(d.subtotal)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;font-weight:700;color:#4d7c0f;">${app.formatCurrency(d.precoFinal)}</td>
        </tr>
    `).join('');

    const projeto = data.nomeProjeto || 'Proposta Técnica';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Resumo Infraestrutura - ${PropostaTecnicaModule._escapeHtml(projeto)}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
                body { font-family: 'Open Sans', sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 11pt; }
                @media print { @page { margin: 1.5cm; } body { padding: 0; } }
                h1 { font-size: 16pt; color: var(--color-accent); border-bottom: 2px solid var(--color-accent); padding-bottom: 8px; }
                h2 { font-size: 13pt; color: #1e293b; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                th { background: var(--color-accent); color: white; padding: 8px; text-align: left; font-size: 10pt; }
                td { padding: 6px; border: 1px solid #ccc; font-size: 10pt; }
                .total-row { background: #f0fdf4; font-weight: 700; }
                .footer { margin-top: 30px; font-size: 9pt; color: #64748b; text-align: center; }
            </style>
        </head>
        <body>
            <h1>Resumo da Infraestrutura</h1>
            <p style="color:#64748b;font-size:10pt;">Projeto: ${PropostaTecnicaModule._escapeHtml(projeto)}</p>
            <table>
                <thead>
                    <tr>
                        <th>Disciplina</th>
                        <th style="text-align:center;">Itens</th>
                        <th style="text-align:right;">Custo Material</th>
                        <th style="text-align:right;">M\u00e3o de Obra</th>
                        <th style="text-align:right;">Subtotal</th>
                        <th style="text-align:right;">Pre\u00e7o Final</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="total-row">
                        <td colspan="2" style="text-align:right;"><strong>Totais</strong></td>
                        <td style="text-align:right;">${app.formatCurrency(totalMaterial)}</td>
                        <td style="text-align:right;">${app.formatCurrency(totalMO)}</td>
                        <td style="text-align:right;">${app.formatCurrency(totalGeral)}</td>
                        <td style="text-align:right;font-size:12pt;color:#4d7c0f;">${app.formatCurrency(totalPrecoFinal)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | GeraPro</div>
            <script>
                window.onload = function() { window.print(); window.close(); };
            <\\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// ─── Infraestrutura — Export CSV / XLSX ────────────────────────────

PropostaTecnicaModule.exportInfraCSV = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const infra = data.infraestrutura;
    const projeto = data.nomeProjeto || 'proposta';
    const BOM = '\uFEFF';
    const headers = ['Disciplina','Código','Descrição','Qtd','UN','Custo Unit.','H Inst','Valor Hora','Dificuldade','Desc%','Markup%','Subtotal','Preço Final'];
    const rows = [];
    infra.disciplinas.forEach(disc => {
        const perda = disc.perda ?? 10;
        disc.itens.forEach(item => {
            const sub = PropostaTecnicaModule._infraSubtotal(item, perda);
            const pf = PropostaTecnicaModule._infraPrecoFinal(item, perda);
            const difLabel = item.dificuldade === 1.5 ? 'Elevado' : item.dificuldade === 2.5 ? 'Crítico' : 'Normal';
            rows.push([
                disc.nome, item.codigo || '', item.descricao || '', item.qtd || 0,
                item.un || '', item.custoUnitario || 0, item.horasInstalacao || 0,
                item.valorHora || 0, difLabel, item.desconto || 0,
                item.markup || 0, sub.toFixed(2), pf.toFixed(2)
            ]);
        });
    });
    if (rows.length === 0) { window.app.toast?.('Nenhum item para exportar.', 'warning'); return; }
    const csv = BOM + [headers, ...rows].map(r => r.join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Infraestrutura_${projeto.replace(/[^a-zA-Z0-9]/g,'_')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    window.app.toast?.('CSV exportado com sucesso!', 'success');
};

PropostaTecnicaModule.exportInfraXLSX = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const infra = data.infraestrutura;
    const projeto = data.nomeProjeto || 'proposta';
    if (typeof XLSX === 'undefined') { window.app.toast?.('Biblioteca XLSX não disponível.', 'error'); return; }

    const headers = ['Disciplina','Código','Descrição','Qtd','UN','Custo Unit.','H Inst','Dificuldade','ICMS%','IPI%','Desc%','Markup%','Subtotal','Preço Final'];
    const rows = [];
    infra.disciplinas.forEach(disc => {
        const perda = disc.perda ?? 10;
        disc.itens.forEach(item => {
            const sub = PropostaTecnicaModule._infraSubtotal(item, perda);
            const pf = PropostaTecnicaModule._infraPrecoFinal(item, perda);
            const difLabel = item.dificuldade === 1.5 ? 'Elevado' : item.dificuldade === 2.5 ? 'Crítico' : 'Normal';
            rows.push([
                disc.nome, item.codigo || '', item.descricao || '', item.qtd || 0,
                item.un || '', item.custoUnitario || 0, item.horasInstalacao || 0,
                difLabel, item.icms || 0, item.ipi || 0, item.desconto || 0,
                item.markup || 0, sub, pf
            ]);
        });
    });
    if (rows.length === 0) { window.app.toast?.('Nenhum item para exportar.', 'warning'); return; }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((_, i) => ({ wch: i === 2 ? 40 : i === 1 || i === 7 ? 14 : 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Infraestrutura');
    XLSX.writeFile(wb, `Infraestrutura_${projeto.replace(/[^a-zA-Z0-9]/g,'_')}.xlsx`);
    window.app.toast?.('XLSX exportado com sucesso!', 'success');
};

// ─── Infraestrutura — Tabela de Custos Unitários ──────────────────

PropostaTecnicaModule.renderTabelaCustosUnitarios = function(data) {
    const infra = data.infraestrutura;
    const totalItensGeral = infra.disciplinas.reduce((s, d) => s + d.itens.length, 0);

    const sidebar = infra.disciplinas.map(d => `
        <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('${d.id}')"
            style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
            <i class="ph ${d.icone}" style="font-size:16px;"></i>
            <span>${PropostaTecnicaModule._escapeHtml(d.nome)}</span>
            <span style="margin-left:auto;background:#e5e7eb;padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${d.itens.length}</span>
        </button>
    `).join('<div style="margin:2px 0;"></div>') +
    '<div style="border-top:1px solid #e2e8f0;margin:6px 0;"></div>' +
    `<button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('custos')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:var(--color-accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-currency-circle-dollar" style="font-size:16px;"></i>
        <span>Custos Unit\u00e1rios</span>
    </button>`;

    const allItems = [];
    infra.disciplinas.forEach(disc => {
        disc.itens.forEach(item => {
            allItems.push({ disciplina: disc.nome, discId: disc.id, item, perda: disc.perda ?? 10 });
        });
    });

    const temItens = allItems.length > 0;

    const tableRows = temItens ? allItems.map(r => `
        <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:6px;font-size:11px;color:#475569;">${PropostaTecnicaModule._escapeHtml(r.disciplina)}</td>
            <td style="padding:6px;font-size:11px;font-family:monospace;">${PropostaTecnicaModule._escapeHtml(r.item.codigo || '')}</td>
            <td style="padding:6px;font-size:11px;">${PropostaTecnicaModule._escapeHtml(r.item.descricao || '')}</td>
            <td style="padding:6px;font-size:11px;text-align:right;font-weight:600;">${app.formatCurrency(r.item.custoUnitario || 0)}</td>
        </tr>
    `).join('') : '';

    return `<div style="display:flex;gap:16px;padding:20px;height:100%;overflow:hidden;">
        <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;overflow-y:auto;">
            ${sidebar}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-shrink:0;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">
                    <i class="ph ph-currency-circle-dollar" style="margin-right:6px;"></i>
                    Custos Unit\u00e1rios
                </h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <label style="font-size:11px;color:#475569;display:flex;align-items:center;gap:4px;">
                        \u00cdndice de Reajuste:
                        <input type="text" id="infra-indice-reajuste" class="form-control" value="0" style="width:70px;font-size:11px;padding:4px;text-align:right;">
                        <span style="font-size:10px;">%</span>
                    </label>
                    <button type="button" onclick="window.propostaTecnicaModule.aplicarReajusteInfra()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-check"></i> Aplicar Reajuste
                    </button>
                </div>
            </div>
            <div style="overflow:auto;border:1px solid #e2e8f0;border-radius:8px;background:white;flex:1;">
                ${temItens ? `
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;position:sticky;top:0;z-index:1;">
                            <th style="padding:8px 6px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Disciplina</th>
                            <th style="padding:8px 6px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">C\u00f3digo</th>
                            <th style="padding:8px 6px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Descri\u00e7\u00e3o</th>
                            <th style="padding:8px 6px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Custo Unit\u00e1rio</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                ` : '<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;"><i class="ph ph-package" style="font-size:32px;display:block;margin-bottom:8px;"></i>Nenhum item cadastrado.</div>'}
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:8px;padding:8px 16px;background:white;border:1px solid #e2e8f0;border-radius:8px;flex-shrink:0;">
                <span style="font-size:11px;color:#64748b;">Total de itens: <strong>${allItems.length}</strong></span>
            </div>
        </div>
    </div>`;
};

PropostaTecnicaModule.aplicarReajusteInfra = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const indiceEl = document.getElementById('infra-indice-reajuste');
    if (!indiceEl) return;
    const indice = parseFloat(indiceEl.value.replace(',', '.'));
    if (isNaN(indice) || indice === 0) {
        window.app.toast?.('Informe um \u00edndice de reajuste diferente de zero.', 'warning');
        return;
    }
    let totalItems = 0;
    data.infraestrutura.disciplinas.forEach(d => { totalItems += d.itens.length; });
    if (totalItems === 0) {
        window.app.toast?.('Nenhum item para reajustar.', 'warning');
        return;
    }
    if (!confirm(`Aplicar reajuste de ${indice}% em todos os ${totalItems} itens?`)) return;
    const fator = 1 + indice / 100;
    data.infraestrutura.disciplinas.forEach(disc => {
        disc.itens.forEach(item => {
            item.custoUnitario = (item.custoUnitario || 0) * fator;
        });
    });
    store.setState({ activeTechnicalProposal: data });
    window.app.toast?.(`Reajuste de ${indice}% aplicado a ${totalItems} itens!`, 'success');
    PropostaTecnicaModule.renderModal(data);
};

PropostaTecnicaModule.switchDisciplina = function(disciplinaId) {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    PropostaTecnicaModule.captureInfraData();
    data.infraestrutura.activeDisciplina = disciplinaId;
    store.setState({ activeTechnicalProposal: data });
    PropostaTecnicaModule.renderModal(data);
};

PropostaTecnicaModule.addInfraItem = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;
    PropostaTecnicaModule.captureInfraData();
    const prefix = INFRA_PREFIX[disc.id] || 'INF';
    disc.itens.push({
            codigo: `${prefix}-${String(disc.itens.length + 1).padStart(3, '0')}`,
            descricao: '',
            qtd: 1,
            un: 'un',
            custoUnitario: 0,
            horasInstalacao: 0,
            valorHora: 0,
            dificuldade: 1.0,
            desconto: 0,
            markup: 0,
            fornecedor: '',
            prazo: '',
            categoria: '',
            materialId: ''
        });
    store.setState({ activeTechnicalProposal: data });
    PropostaTecnicaModule.renderModal(data);
};

PropostaTecnicaModule.deleteInfraItem = function(index) {
    if (!confirm('Excluir este item?')) return;
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc || !disc.itens[index]) return;
    PropostaTecnicaModule.captureInfraData();
    disc.itens.splice(index, 1);
    store.setState({ activeTechnicalProposal: data });
    PropostaTecnicaModule.renderModal(data);
};

// ─── Infraestrutura — Catálogo de Materiais ─────────────────────────

PropostaTecnicaModule.openAddInfraMaterialModal = function() {
    const existing = document.getElementById('modal-add-infra-material');
    if (existing) existing.remove();
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-add-infra-material';
    modal.innerHTML = `
        <div class="modal" style="width:1152px;max-width:90vw;">
            <div class="modal-header" style="background:var(--color-accent);color:white;">
                <h3>Adicionar Material — ${PropostaTecnicaModule._escapeHtml(disc.nome)}</h3>
                <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
            </div>
            <div class="modal-body">
                <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                    <select id="aim-manufacturer" class="form-control" style="width:200px;" onchange="app.propostaTecnica._renderAddInfraMaterialList()">
                        <option value="">Todos os Fabricantes</option>
                    </select>
                    <input type="text" id="aim-filter-model" class="form-control" placeholder="Filtrar descri\u00e7\u00e3o..." oninput="app.propostaTecnica._renderAddInfraMaterialList()">
                    <input type="text" id="aim-filter-code" class="form-control" placeholder="Filtrar c\u00f3digo..." oninput="app.propostaTecnica._renderAddInfraMaterialList()">
                    <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;white-space:nowrap;cursor:pointer;color:#f59e0b;">
                        <input type="checkbox" id="aim-filter-favoritos" onchange="app.propostaTecnica._renderAddInfraMaterialList()"> \u2b50 Favoritos
                    </label>
                </div>
                <div style="max-height:400px;overflow-y:auto;border:1px solid var(--color-border);border-radius:4px;">
                    <table class="w-full" style="font-size:13px;">
                        <thead><tr style="background:#f1f5f9;">
                            <th style="padding:10px;">DESCRI\u00c7\u00c3O</th>
                            <th style="padding:10px;width:120px;">MODELO</th>
                            <th style="padding:10px;width:130px;">C\u00d3D. FAB.</th>
                            <th style="padding:10px;width:110px;">FABRICANTE</th>
                            <th style="padding:10px;width:100px;text-align:right;">UNIT. (R$)</th>
                            <th style="padding:10px;width:60px;text-align:center;">QTD</th>
                            <th style="padding:10px;width:50px;"></th>
                        </tr></thead>
                        <tbody id="aim-items-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                    Materiais adicionados ser\u00e3o vinculados \u00e0 disciplina <b>${PropostaTecnicaModule._escapeHtml(disc.nome)}</b>
                </span>
                <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn btn-primary" onclick="app.propostaTecnica._confirmAddInfraMaterial()" style="">
                    <i class="ph ph-check"></i> Conclu\u00eddo
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    PropostaTecnicaModule._populateInfraMaterialManufacturers(modal);
    PropostaTecnicaModule._renderAddInfraMaterialList();
};

PropostaTecnicaModule._populateInfraMaterialManufacturers = function(modal) {
    const all = store.getState().materiais || [];
    const unique = [...new Set(all.map(m => m.fabricante).filter(Boolean))].sort();
    const sel = modal.querySelector('#aim-manufacturer');
    if (sel) {
        unique.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            sel.appendChild(opt);
        });
    }
};

PropostaTecnicaModule._renderAddInfraMaterialList = function() {
    const modal = document.getElementById('modal-add-infra-material');
    if (!modal) return;
    const manufacturer = modal.querySelector('#aim-manufacturer')?.value || '';
    const filterModel  = (modal.querySelector('#aim-filter-model')?.value || '').toLowerCase();
    const filterCode   = (modal.querySelector('#aim-filter-code')?.value || '').toLowerCase();
    const favoritosOnly = modal.querySelector('#aim-filter-favoritos')?.checked || false;
    const tbody = modal.querySelector('#aim-items-body');
    if (!tbody) return;

    const hasActiveFilter = manufacturer || favoritosOnly || filterModel.length >= 3 || filterCode.length >= 3;

    if (!hasActiveFilter) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;font-size:13px;">' +
            '<i class="ph ph-magnifying-glass" style="font-size:28px;display:block;margin-bottom:8px;"></i>' +
            'Digite ao menos 3 caracteres para buscar, selecione um fabricante ou marque "Favoritos".' +
            '</td></tr>';
        return;
    }

    const all = store.getState().materiais || [];
    const filtered = all.filter(m => {
        if (favoritosOnly && !m.favorito) return false;
        if (manufacturer && m.fabricante !== manufacturer) return false;
        if (filterModel && !(m.descricao || '').toLowerCase().includes(filterModel)) return false;
        if (filterCode && !(m.codigoFabricante || '').toLowerCase().includes(filterCode)) return false;
        return true;
    });

    const MAX = 200;
    const showItems = filtered.slice(0, MAX);
    const total = filtered.length;

    if (showItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum material encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = showItems.map(m => {
        const desc = PropostaTecnicaModule._escapeHtml(m.descricao || '');
        const modelo = PropostaTecnicaModule._escapeHtml(m.modelo || '-');
        const codFab = PropostaTecnicaModule._escapeHtml(m.codigoFabricante || '-');
        const fab = PropostaTecnicaModule._escapeHtml(m.fabricante || '-');
        const un = PropostaTecnicaModule._escapeHtml(m.unidade || 'un');
        return `<tr>
            <td style="padding:8px 10px;">${desc}</td>
            <td style="padding:8px 10px;">${modelo}</td>
            <td style="padding:8px 10px;font-family:monospace;">${codFab}</td>
            <td style="padding:8px 10px;">${fab}</td>
            <td style="padding:8px 10px;text-align:right;">${app.formatCurrency(m.custo || 0)}</td>
            <td style="padding:8px 10px;text-align:center;">
                <input type="number" class="form-control" value="1" min="1"
                    style="width:50px;padding:4px;text-align:center;height:28px;"
                    data-material-id="${m.id}"
                    data-custo="${m.custo}"
                    data-descricao="${desc}"
                    data-fabricante="${fab}"
                    data-codfab="${codFab}"
                    data-modelo="${modelo}"
                    data-unidade="${un}">
            </td>
            <td style="padding:8px 10px;text-align:center;">
                <button class="btn btn-xs btn-primary" onclick="app.propostaTecnica._addInfraMaterialSingleItem(this)"
                    style="font-size:11px;padding:4px 10px;">
                    <i class="ph ph-plus"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    if (total > MAX) {
        tbody.innerHTML += '<tr><td colspan="7" style="text-align:center;padding:10px;color:#64748b;font-size:12px;">' +
            'Mostrando ' + MAX + ' de ' + total + ' resultados. Refine a busca para maior precis\u00e3o.' +
            '</td></tr>';
    }
};

PropostaTecnicaModule._addInfraMaterialSingleItem = async function(btn) {
    const row = btn.closest('tr');
    const qtdInput = row.querySelector('input[type="number"]');
    const qtd = parseInt(qtdInput?.value) || 1;
    const materialId = qtdInput?.dataset?.materialId;
    if (!materialId) return;

    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;

    PropostaTecnicaModule.captureInfraData();

    const existing = disc.itens.find(item => item.materialId === materialId);
    if (existing) {
        console.log('existing item found, incrementing qtd');
        existing.qtd = (existing.qtd || 0) + qtd;
    } else {
        disc.itens.push({
            codigo: `MAT-${String(disc.itens.length + 1).padStart(3, '0')}`,
            descricao: qtdInput.dataset.descricao || '',
            qtd: qtd,
            un: qtdInput.dataset.unidade || 'un',
            custoUnitario: parseFloat(qtdInput.dataset.custo) || 0,
            horasInstalacao: 0,
            valorHora: 0,
            dificuldade: 1.0,
            desconto: 0,
            markup: 0,
            fornecedor: qtdInput.dataset.fabricante || '',
            prazo: '',
            categoria: '',
            materialId: materialId
        });
    }

    store.setState({ activeTechnicalProposal: data });
    window.app.toast?.('Material adicionado \u00e0 disciplina!', 'success');
    await PropostaTecnicaModule.renderModal(data);
    PropostaTecnicaModule.openAddInfraMaterialModal();
};

PropostaTecnicaModule._confirmAddInfraMaterial = async function() {
    document.getElementById('modal-add-infra-material')?.remove();
    const data = store.getState().activeTechnicalProposal;
    if (data) {
        await PropostaTecnicaModule.renderModal(data);
    }
    window.app.toast?.('Materiais vinculados \u00e0 disciplina!', 'success');
};

PropostaTecnicaModule.captureInfraData = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const tbody = document.getElementById('infra-table-body');
    if (!tbody) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;
    const rows = tbody.querySelectorAll('tr[data-infra-index]');
    rows.forEach(row => {
        const i = parseInt(row.getAttribute('data-infra-index'));
        if (isNaN(i) || i >= disc.itens.length) return;
        const g = (name) => {
            const el = row.querySelector(`[name="infra_${name}_${i}"]`);
            if (!el) return undefined;
            return el.value;
        };
        const gn = (name) => {
            const val = g(name);
            if (val === undefined || val === '') return undefined;
            const parsed = app.parseCurrency(val);
            return isNaN(parsed) ? 0 : parsed;
        };
        const sv = (name) => { const v = g(name); if (v !== undefined) disc.itens[i][name] = v; };
        const sn = (name) => { const v = gn(name); if (v !== undefined) disc.itens[i][name] = v; };
        sv('codigo');
        sv('descricao');
        sn('qtd');
        sv('un');
        sn('custoUnitario');
        sn('horasInstalacao');
        sn('valorHora');
        sn('dificuldade');
        sn('desconto');
        sn('markup');
        sv('fornecedor');
        sv('prazo');
        sv('categoria');
    });
    // Capture perda from discipline header
    const perdaEl = document.querySelector('[name="infra_perda"]');
    if (perdaEl) {
        const perdaVal = app.parseCurrency(perdaEl.value);
        disc.perda = isNaN(perdaVal) ? 10 : perdaVal;
    }
    store.setState({ activeTechnicalProposal: data });
};


PropostaTecnicaModule.init();

export { PropostaTecnicaModule };





