// ─── Cálculos unificados de Infraestrutura ─────────────────────────────
// Fonte ÚNICA da fórmula de custo e preço final da aba Infraestrutura.
// Importado por propostaTecnica.js (UI, rodapé e documento da proposta)
// e por precificacao.js (total consolidado) — evita três números
// diferentes para o mesmo item.
//
// Fórmulas:
//   custoDireto  = qtd × (1 + perda%) × custoUnitário + horas × valorHora × dificuldade
//   precoBase    = custoDireto / (1 − (ICMS% + markup%)/100)   ← gross-up "por dentro"
//   precoFinal   = precoBase × (1 − desconto%/100) × (1 + IPI%/100)
//                  (desconto abate o preço; IPI é cobrado por fora, sobre o valor já descontado)

export function infraSubtotal(item, perda) {
    const p = (perda === undefined || perda === null) ? 10 : perda;
    const material = (item.qtd || 0) * (1 + p / 100) * (item.custoUnitario || 0);
    const maoObra = (item.horasInstalacao || 0) * (item.valorHora || 0) * (item.dificuldade || 1.0);
    return material + maoObra;
}

export function infraPrecoFinal(item, perda) {
    const custoDireto = infraSubtotal(item, perda);
    const fator = 1 - (((item.icms || 0) + (item.markup || 0)) / 100);
    const precoBase = fator > 0 ? custoDireto / fator : custoDireto;
    const desconto = Math.min(Math.max(Number(item.desconto) || 0, 0), 100);
    const ipi = Math.max(Number(item.ipi) || 0, 0);
    return precoBase * (1 - desconto / 100) * (1 + ipi / 100);
}
