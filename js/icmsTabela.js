export const INTERNAL_RATES = {
    AC: 17, AL: 17, AM: 18, AP: 17, BA: 18, CE: 18, DF: 18, ES: 17,
    GO: 17, MA: 18, MG: 18, MS: 17, MT: 17, PA: 17, PB: 18, PE: 18,
    PI: 18, PR: 18, RJ: 20, RN: 18, RO: 17, RR: 17, RS: 17, SC: 17,
    SE: 18, SP: 18, TO: 17
};

// Estados do Sul/Sudeste cujas SAÍDAS são sempre a 12% (Res. Senado 22/1989).
// O ES não entra aqui: suas saídas seguem a regra das demais regiões (7% para S/SE).
const ORIGIN_ALWAYS_12 = new Set(['SP', 'RJ', 'MG', 'PR', 'RS', 'SC']);

// Destinos que disparam a alíquota de 7% para origens fora do Sul/Sudeste.
const DEST_FOR_7 = new Set(['SP', 'RJ', 'MG', 'ES', 'PR', 'RS', 'SC']);

export function getIcmsRate(origem, destino) {
    if (!origem || !destino) return null;
    const o = origem.toUpperCase().trim();
    const d = destino.toUpperCase().trim();
    if (!INTERNAL_RATES[o] || !INTERNAL_RATES[d]) return null;

    // Operação interna → alíquota estadual do próprio estado
    if (o === d) return INTERNAL_RATES[o];

    // Saída de SP/RJ/MG/PR/RS/SC → sempre 12% (qualquer destino)
    if (ORIGIN_ALWAYS_12.has(o)) return 12;

    // Origem fora do Sul/Sudeste (inclui ES) com destino no Sul/Sudeste → 7%
    if (DEST_FOR_7.has(d)) return 7;

    // Demais operações interestaduais (ex.: BA → AM) → 12%
    return 12;
}

export const UF_LIST = Object.keys(INTERNAL_RATES).sort();
