import { store } from './state.js';

function getCampoEquipamento(eq, campo) {
    if (!campo) return undefined;
    if (campo.includes('.')) {
        const parts = campo.split('.');
        let val = eq;
        for (const p of parts) {
            if (val && typeof val === 'object') val = val[p];
            else return undefined;
        }
        return val;
    }
    const map = {
        num_disjuntores: eq.num_disjuntores || (eq.cargas ? eq.cargas.filter(c => c.tipo === 'disjuntor').length : 0),
        correnteNominal: eq.correnteNominal || 0,
        tensao: eq.tensao || '',
        icc: eq.icc || '',
        ip: eq.ip || '',
        tipo: eq.type || eq.tipo || '',
        tag: eq.tag || '',
        protocolo: eq.protocolo || '',
        forma: eq.forma || '',
        instalacao: eq.instalacao || '',
        'cargas.length': (eq.cargas && Array.isArray(eq.cargas) ? eq.cargas.length : (eq.loads && Array.isArray(eq.loads) ? eq.loads.length : 0))
    };
    return map[campo] !== undefined ? map[campo] : eq[campo];
}

function avaliarCondicoes(condicoes, eq) {
    if (!condicoes || condicoes.length === 0) return true;
    return condicoes.every(c => {
        const valorEq = getCampoEquipamento(eq, c.campo);
        const valorCond = c.valor;
        switch (c.operador) {
            case '==': return String(valorEq ?? '') === String(valorCond);
            case '!=': return String(valorEq ?? '') !== String(valorCond);
            case '>': return parseFloat(valorEq ?? 0) > parseFloat(valorCond);
            case '>=': return parseFloat(valorEq ?? 0) >= parseFloat(valorCond);
            case '<': return parseFloat(valorEq ?? 0) < parseFloat(valorCond);
            case '<=': return parseFloat(valorEq ?? 0) <= parseFloat(valorCond);
            case 'exists': return valorEq !== undefined && valorEq !== null && valorEq !== '';
            case 'length>': return (typeof valorEq === 'number' ? valorEq : (valorEq?.length ?? 0)) > parseInt(valorCond);
            case 'length=': return (typeof valorEq === 'number' ? valorEq : (valorEq?.length ?? 0)) === parseInt(valorCond);
            default: return true;
        }
    });
}

function calcularQuantidade(expressao, eq) {
    if (!expressao && expressao !== 0) return 0;
    const expr = String(expressao).trim();
    if (!isNaN(parseFloat(expr))) return parseFloat(expr);
    const resolvido = expr.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, campo) => {
        const val = getCampoEquipamento(eq, campo);
        return val !== undefined && val !== null ? String(val) : '0';
    });
    try {
        const result = Function('"use strict"; return (' + resolvido + ')')();
        return typeof result === 'number' && !isNaN(result) ? Math.max(0, result) : 0;
    } catch { return 0; }
}

function mapearGrupoParaArea(grupo) {
    const engGrupos = ['Projeto', 'Automação'];
    if (engGrupos.includes(grupo)) return 'Engenharia';
    return 'Montagem';
}

export function calcularMaoDeObraPorEquipamento(eq) {
    const composicoes = store.getState().composicoes || [];
    const regras = store.getState().regrasDerivacao || [];
    const regrasAtivas = regras.filter(r => r.regra_ativa !== 0);

    const regrasAplicaveis = regrasAtivas.filter(r => {
        if (!r.tipo_equipamento || r.tipo_equipamento === '*') return true;
        const eqType = eq.type || eq.tipo || '';
        return r.tipo_equipamento === eqType;
    });

    const sortedRegras = [...regrasAplicaveis].sort((a, b) => (a.prioridade || 0) - (b.prioridade || 0));

    const resultado = { items: [], composicaoDetalhada: [] };

    for (const regra of sortedRegras) {
        let condicoes;
        try {
            condicoes = typeof regra.condicoes === 'string' ? JSON.parse(regra.condicoes) : (regra.condicoes || []);
        } catch { condicoes = []; }

        if (!avaliarCondicoes(condicoes, eq)) continue;

        let acoes;
        try {
            acoes = typeof regra.acoes === 'string' ? JSON.parse(regra.acoes) : (regra.acoes || []);
        } catch { acoes = []; }

        for (const acao of acoes) {
            const comp = composicoes.find(c => c.id === acao.composicao_id);
            if (!comp) continue;

            const qtd = calcularQuantidade(acao.quantidade, eq);
            if (qtd <= 0) continue;

            const hh = qtd * (comp.coeficiente_hh || 0);
            const area = comp.area_alocacao || mapearGrupoParaArea(comp.grupo || '');

            resultado.composicaoDetalhada.push({
                regra: regra.nome || 'Regra',
                composicao_codigo: comp.codigo,
                composicao_atividade: comp.atividade,
                composicao_grupo: comp.grupo,
                categoria_profissional: comp.categoria_profissional || 'Geral',
                area_alocacao: area,
                quantidade: qtd,
                unidade: comp.unidade,
                coeficiente_hh: comp.coeficiente_hh,
                hh: hh,
                expressao: acao.quantidade
            });

            const key = comp.categoria_profissional || 'Geral';
            const existing = resultado.items.find(i => i.role === key && i.group === area);
            if (existing) {
                existing.hours += hh;
            } else {
                resultado.items.push({
                    group: area,
                    role: key,
                    hours: hh,
                    hourlyRate: 0,
                    auto: true,
                    composicaoDetalhe: []
                });
            }
        }
    }

    resultado.items.forEach(item => {
        item.composicaoDetalhe = resultado.composicaoDetalhada.filter(d =>
            d.categoria_profissional === item.role && d.area_alocacao === item.group
        );
    });

    resultado.totalHoras = resultado.items.reduce((s, i) => s + i.hours, 0);
    return resultado;
}

export function calcularMaoDeObraProposta(equipamentos) {
    const resultados = {};
    let totalGeral = 0;
    (equipamentos || []).forEach(eq => {
        const tag = eq.tag || eq.id || 'desconhecido';
        const res = calcularMaoDeObraPorEquipamento(eq);
        resultados[tag] = res;
        totalGeral += res.totalHoras || 0;
    });
    return { porEquipamento: resultados, totalGeral };
}

export function agregarMaoDeObra(equipamentos) {
    const porFuncao = {};
    (equipamentos || []).forEach(eq => {
        const labor = eq.labor || {};
        (labor.items || []).forEach(item => {
            const key = `${item.group || 'Geral'}|${item.role || 'Geral'}`;
            if (!porFuncao[key]) {
                porFuncao[key] = { group: item.group || 'Geral', role: item.role || 'Geral', hours: 0, hourlyRate: item.hourlyRate || 0 };
            }
            porFuncao[key].hours += (item.hours || 0);
            if (!porFuncao[key].hourlyRate && item.hourlyRate) porFuncao[key].hourlyRate = item.hourlyRate;
        });
    });
    return Object.values(porFuncao);
}

window.autoMaoDeObra = {
    calcularMaoDeObraPorEquipamento,
    calcularMaoDeObraProposta,
    agregarMaoDeObra
};
