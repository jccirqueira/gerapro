export const INTERNAL_RATES = {
    AC: 17, AL: 17, AM: 18, AP: 17, BA: 18, CE: 18, DF: 18, ES: 17,
    GO: 17, MA: 18, MG: 18, MS: 17, MT: 17, PA: 17, PB: 18, PE: 18,
    PI: 18, PR: 18, RJ: 20, RN: 18, RO: 17, RR: 17, RS: 17, SC: 17,
    SE: 18, SP: 18, TO: 17
};

const SUL_SUDESTE = new Set(['SP', 'RJ', 'MG', 'ES', 'PR', 'RS', 'SC']);

export function getIcmsRate(origem, destino) {
    if (!origem || !destino) return null;
    const o = origem.toUpperCase().trim();
    const d = destino.toUpperCase().trim();
    if (!INTERNAL_RATES[o] || !INTERNAL_RATES[d]) return null;

    if (o === d) return INTERNAL_RATES[o];

    const oSulSudeste = SUL_SUDESTE.has(o);
    const dSulSudeste = SUL_SUDESTE.has(d);

    if (oSulSudeste && dSulSudeste) return 12;
    if (oSulSudeste && !dSulSudeste) return 7;
    if (!oSulSudeste) return 12;

    return 12;
}

export const UF_LIST = Object.keys(INTERNAL_RATES).sort();
