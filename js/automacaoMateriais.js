import { store } from './state.js';

const IO_MATERIAL_RULES = {
    DI: {
        '24VDC': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 1, categoria: 'Bornes' },
            { descricao: 'Borne Fusível 5x20 6A', qtdPorCanal: 1, categoria: 'Bornes Fusíveis' }
        ],
        '120VAC': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Borne Fusível 5x20 6A', qtdPorCanal: 1, categoria: 'Bornes Fusíveis' }
        ],
        '220VAC': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Borne Fusível 5x20 6A', qtdPorCanal: 1, categoria: 'Bornes Fusíveis' }
        ],
        _default: [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 1, categoria: 'Bornes' }
        ]
    },
    DO: {
        '24VDC': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 1, categoria: 'Bornes' }
        ],
        '120VAC': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 1, categoria: 'Bornes' },
            { descricao: 'Relé de Interface 24VDC', qtdPorCanal: 1, categoria: 'Relés' }
        ],
        '220VAC': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 1, categoria: 'Bornes' },
            { descricao: 'Relé de Interface 24VDC', qtdPorCanal: 1, categoria: 'Relés' }
        ],
        _relay: [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Relé de Interface 24VDC', qtdPorCanal: 1, categoria: 'Relés' }
        ],
        _default: [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 1, categoria: 'Bornes' }
        ]
    },
    AI: {
        '4-20mA': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo Instrumentação Blindado 1 par 1,5mm²', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ],
        '0-10V': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo Instrumentação Blindado 1 par 1,5mm²', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ],
        'RTD': [
            { descricao: 'Borne de Compensação RTD', qtdPorCanal: 3, categoria: 'Bornes' },
            { descricao: 'Cabo de Compensação PT100', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ],
        'TC-K': [
            { descricao: 'Borne de Compensação TC', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo de Compensação TC-K', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ],
        'TC-J': [
            { descricao: 'Borne de Compensação TC', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo de Compensação TC-J', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ],
        _default: [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo Instrumentação Blindado 1 par 1,5mm²', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ]
    },
    AO: {
        '4-20mA': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo Instrumentação Blindado 1 par 1,5mm²', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ],
        '0-10V': [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo Instrumentação Blindado 1 par 1,5mm²', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ],
        _default: [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo Instrumentação Blindado 1 par 1,5mm²', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ]
    },
    TC: {
        _default: [
            { descricao: 'Borne de Compensação TC', qtdPorCanal: 2, categoria: 'Bornes' },
            { descricao: 'Cabo de Compensação', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ]
    },
    RTD: {
        _default: [
            { descricao: 'Borne de Compensação RTD', qtdPorCanal: 3, categoria: 'Bornes' },
            { descricao: 'Cabo de Compensação PT100', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' }
        ]
    },
    COMM: {
        _default: [
            { descricao: 'Cabo de Rede CAT6', qtdPorCanal: 1, categoria: 'Cabos', unidade: 'm' },
            { descricao: 'Conector RJ45', qtdPorCanal: 2, categoria: 'Conectores' }
        ]
    },
    PS: {
        _default: [
            { descricao: 'Fonte Chaveada 24VDC', qtdPorCanal: 1, categoria: 'Fontes' }
        ]
    },
    CNT: {
        _default: [
            { descricao: 'Borne Passante 6mm²', qtdPorCanal: 1, categoria: 'Bornes' }
        ]
    }
};

const CABLE_ADDITIONAL_PER_RACK = [
    { descricao: 'Cabo de Comando 1,5mm² (azul)', qtd: 0, categoria: 'Cabos', unidade: 'm', _perSlot: true },
    { descricao: 'Eletroduto Corrugado 1"', qtd: 0, categoria: 'Eletrodutos', unidade: 'm', _perSlot: true },
    { descricao: 'Canaleta Perfurada 40x40mm', qtd: 0, categoria: 'Canaletas', unidade: 'm', _perSlot: true }
];

function findCatalogCandidates(descricao, categoria, limit) {
    limit = limit || 10;
    const materiais = store.getState().materiais || [];
    const keywords = descricao.toLowerCase().split(' ').filter(w => w.length > 2);

    const withScore = materiais.map(m => {
        let score = 0;
        if (categoria && m.categoria) {
            const catLower = categoria.toLowerCase();
            const mCatLower = m.categoria.toLowerCase();
            if (mCatLower.startsWith(catLower.slice(0, 5)) || mCatLower.includes(catLower.slice(0, 5))) {
                score += 10;
            }
        }
        const mDesc = (m.descricao || '').toLowerCase();
        const mCode = (m.codigoFabricante || '').toLowerCase();
        const matchedKw = keywords.filter(k => mDesc.includes(k) || mCode.includes(k));
        score += matchedKw.length * 5;
        return { material: m, score };
    });

    withScore.sort((a, b) => b.score - a.score);

    return withScore.filter(ws => ws.score > 0).slice(0, limit).map(ws => ws.material);
}

function matchMaterialFromCatalog(descricao, categoria) {
    const candidates = findCatalogCandidates(descricao, categoria, 1);
    return candidates[0] || null;
}

function matchRackField(fieldValue) {
    if (!fieldValue || !fieldValue.trim()) return null;
    const materiais = store.getState().materiais || [];
    const val = fieldValue.trim().toLowerCase();

    const candidates = materiais.filter(m => {
        const desc = (m.descricao || '').toLowerCase();
        const code = (m.codigoFabricante || '').toLowerCase();
        return desc.includes(val) || code.includes(val);
    });

    candidates.sort((a, b) => {
        const aDesc = (a.descricao || '').toLowerCase();
        const bDesc = (b.descricao || '').toLowerCase();
        const aCode = (a.codigoFabricante || '').toLowerCase();
        const bCode = (b.codigoFabricante || '').toLowerCase();
        const aScore = (aCode === val || aDesc === val) ? 3 : (aDesc.startsWith(val) || aCode.startsWith(val)) ? 2 : 1;
        const bScore = (bCode === val || bDesc === val) ? 3 : (bDesc.startsWith(val) || bCode.startsWith(val)) ? 2 : 1;
        return bScore - aScore;
    });

    return candidates[0] || null;
}

function deriveMaterials(ioList) {
    const racks = ioList?.racks || [];
    const overrides = ioList?.materialOverrides || {};
    const items = [];

    function addItem(descricao, qtd, categoria, unidade, material) {
        if (!qtd || qtd <= 0) return;
        const existing = items.find(i => i.descricao === descricao && i.categoria === categoria);
        if (existing) {
            existing.qtd += qtd;
        } else {
            items.push({
                descricao,
                qtd,
                categoria,
                unidade: unidade || 'un',
                material: material || null,
                materialId: material ? material.id : null,
                codigoFabricante: material ? (material.codigoFabricante || '') : '',
                fabricante: material ? (material.fabricante || '') : '',
                custoUnitario: material ? (parseFloat(material.custo) || 0) : 0,
                icms: material ? (parseFloat(material.icms) || 0) : 0,
                ipi: material ? (parseFloat(material.ipi) || 0) : 0,
                pis: material ? (parseFloat(material.pis) || 0) : 0,
                cofins: material ? (parseFloat(material.cofins) || 0) : 0
            });
        }
    }

    for (const rack of racks) {
        const tryMatch = (field, fallbackDesc, categoria) => {
            if (field) {
                const mat = matchRackField(field);
                if (mat) {
                    addItem(mat.descricao, 1, categoria, 'un', mat);
                } else {
                    addItem(fallbackDesc + ' (' + field + ')', 1, categoria, 'un');
                }
            } else {
                addItem(fallbackDesc, 1, categoria, 'un');
            }
        };

        tryMatch(rack.backplane, 'Rack / Backplane', 'Estrutura');
        tryMatch(rack.cpu, 'CPU', 'Estrutura');
        tryMatch(rack.powerSupply, 'Fonte de Alimentação do Rack', 'Fontes');

        for (const base of CABLE_ADDITIONAL_PER_RACK) {
            const totalSlots = (rack.slots || []).length;
            if (totalSlots > 0) {
                addItem(base.descricao, totalSlots * 2, base.categoria, base.unidade);
            }
        }

        for (const slot of (rack.slots || [])) {
            const moduleType = (slot.moduleType || '').toUpperCase();
            const signalType = slot.signalType || '';
            const channels = slot.channels || [];
            const activeChannels = channels.filter(ch => ch.status !== 'unused');
            const totalCh = activeChannels.length || parseInt(slot.totalChannels) || 1;

            const ioTypicals = ioList?.ioTypicals || {};
            const typical = ioTypicals[moduleType];

            if (typical) {
                const cableMap = {
                    'standard': { desc: 'Cabo de Comando 1,5mm²', cat: 'Cabos', un: 'm' },
                    'shielded': { desc: 'Cabo Instrumentação Blindado 1 par 1,5mm²', cat: 'Cabos', un: 'm' },
                    'shielded-twisted-pair': { desc: 'Cabo Instrumentação Blindado 1 par 1,5mm²', cat: 'Cabos', un: 'm' },
                    'compensation-TC': { desc: 'Cabo de Compensação TC-K', cat: 'Cabos', un: 'm' },
                    'compensation-RTD': { desc: 'Cabo de Compensação PT100', cat: 'Cabos', un: 'm' },
                    'multi-conductor': { desc: 'Cabo Multiplexado', cat: 'Cabos', un: 'm' }
                };
                if (typical.terminalBlocks > 0) addItem('Borne Passante 6mm²', typical.terminalBlocks * totalCh, 'Bornes');
                if (typical.fuseTerminal) addItem('Borne Fusível 5x20 6A', totalCh, 'Bornes Fusíveis');
                if (typical.relayTerminal) addItem('Relé de Interface 24VDC', totalCh, 'Relés');
                if (typical.surgeProtector) addItem('Protetor de Surto', totalCh, 'Bornes');
                const cable = cableMap[typical.cableType] || cableMap['standard'];
                addItem(cable.desc, totalCh, cable.cat, cable.un);
            } else {
                const typeRules = IO_MATERIAL_RULES[moduleType];
                if (!typeRules) continue;

                let signalRules = typeRules[signalType];
                if (!signalRules && signalType.toLowerCase().includes('relay')) {
                    signalRules = typeRules._relay;
                }
                if (!signalRules) signalRules = typeRules._default;

                for (const rule of signalRules) {
                    const qtd = rule.qtdPorCanal * totalCh;
                    addItem(rule.descricao, qtd, rule.categoria, rule.unidade || 'un');
                }
            }
        }
    }

    for (const item of items) {
        const key = item.descricao + '|' + item.categoria;
        const overrideId = overrides[key];

        if (overrideId) {
            const materiais = store.getState().materiais || [];
            const mat = materiais.find(m => m.id === overrideId);
            if (mat) {
                item.materialId = mat.id;
                item.codigoFabricante = mat.codigoFabricante || '';
                item.fabricante = mat.fabricante || '';
                item.custoUnitario = parseFloat(mat.custo) || 0;
                item.icms = parseFloat(mat.icms) || 0;
                item.ipi = parseFloat(mat.ipi) || 0;
                item.pis = parseFloat(mat.pis) || 0;
                item.cofins = parseFloat(mat.cofins) || 0;
            }
        } else if (!item.materialId) {
            const matched = matchMaterialFromCatalog(item.descricao, item.categoria);
            if (matched) {
                item.materialId = matched.id;
                item.codigoFabricante = matched.codigoFabricante || '';
                item.fabricante = matched.fabricante || '';
                item.custoUnitario = parseFloat(matched.custo) || 0;
                item.icms = parseFloat(matched.icms) || 0;
                item.ipi = parseFloat(matched.ipi) || 0;
                item.pis = parseFloat(matched.pis) || 0;
                item.cofins = parseFloat(matched.cofins) || 0;
            }
        }

        item._key = key;
        item.candidates = findCatalogCandidates(item.descricao, item.categoria, 10);
    }

    items.sort((a, b) => {
        const catOrder = ['Estrutura', 'Fontes', 'Bornes', 'Bornes Fusíveis', 'Relés', 'Cabos', 'Eletrodutos', 'Canaletas', 'Conectores'];
        const aCat = catOrder.indexOf(a.categoria);
        const bCat = catOrder.indexOf(b.categoria);
        if (aCat !== bCat) return aCat - bCat;
        return a.descricao.localeCompare(b.descricao);
    });

    const total = items.reduce((sum, i) => sum + (i.custoUnitario * i.qtd), 0);

    return { items, total };
}

export { deriveMaterials };
