export const INTERNAL_RATES = {
    AC: 17, AL: 17, AM: 18, AP: 17, BA: 18, CE: 18, DF: 18, ES: 17,
    GO: 17, MA: 18, MG: 18, MS: 17, MT: 17, PA: 17, PB: 18, PE: 18,
    PI: 18, PR: 18, RJ: 20, RN: 18, RO: 17, RR: 17, RS: 17, SC: 17,
    SE: 18, SP: 18, TO: 17
};

// Estados do Sul/Sudeste que seguem a regra geral de 12% nas operações
// interestaduais entre as Regiões Sul e Sudeste (Res. Senado 22/1989).
const SUL_SUDESTE = new Set(['SP', 'RJ', 'MG', 'PR', 'RS', 'SC']);

// Regra interestadual (Res. Senado 22/1989):
//   • Interna → alíquota interna do próprio estado.
//   • Sul/Sudeste (sem ES) → 12% para o resto do Sul/Sudeste; 7% para
//     Norte/Nordeste/Centro-Oeste e para o Espírito Santo.
//   • ES → 7% em todas as saídas interestaduais.
//   • Norte/Nordeste/Centro-Oeste → 12%, exceto 7% para o Espírito Santo.
export function getIcmsRate(origem, destino) {
    if (!origem || !destino) return null;
    const o = origem.toUpperCase().trim();
    const d = destino.toUpperCase().trim();
    if (!INTERNAL_RATES[o] || !INTERNAL_RATES[d]) return null;

    // Operação interna → alíquota estadual do próprio estado
    if (o === d) return INTERNAL_RATES[o];

    // Saída de SP/RJ/MG/PR/RS/SC → 12% para o Sul/Sudeste; 7% para N/NE/CO e ES
    if (SUL_SUDESTE.has(o)) return SUL_SUDESTE.has(d) ? 12 : 7;

    // Saída do Espírito Santo → 7% para qualquer destino interestadual
    if (o === 'ES') return 7;

    // Saída do Norte/Nordeste/Centro-Oeste → 12%, exceto destino Espírito Santo (7%)
    return d === 'ES' ? 7 : 12;
}

export const UF_LIST = Object.keys(INTERNAL_RATES).sort();
