/**
 * Busbar Calculator Module
 * Data and logic for copper busbar sizing.
 */

export const BUSBAR_DATA = [
    { dim: "12 x 3", section: 36, nude: 130, painted: 150, weight: 0.32 },
    { dim: "15 x 3", section: 45, nude: 160, painted: 185, weight: 0.40 },
    { dim: "20 x 3", section: 60, nude: 210, painted: 240, weight: 0.53 },
    { dim: "20 x 5", section: 100, nude: 280, painted: 320, weight: 0.89 },
    { dim: "25 x 3", section: 75, nude: 260, painted: 300, weight: 0.67 },
    { dim: "25 x 5", section: 125, nude: 340, painted: 390, weight: 1.11 },
    { dim: "30 x 5", section: 150, nude: 400, painted: 460, weight: 1.34 },
    { dim: "30 x 10", section: 300, nude: 580, painted: 660, weight: 2.67 },
    { dim: "40 x 5", section: 200, nude: 520, painted: 600, weight: 1.78 },
    { dim: "40 x 10", section: 400, nude: 730, painted: 840, weight: 3.56 },
    { dim: "50 x 5", section: 250, nude: 630, painted: 720, weight: 2.23 },
    { dim: "50 x 10", section: 500, nude: 880, painted: 1000, weight: 4.45 },
    { dim: "60 x 10", section: 600, nude: 1020, painted: 1170, weight: 5.34 },
    { dim: "80 x 10", section: 800, nude: 1300, painted: 1490, weight: 7.12 },
    { dim: "100 x 10", section: 1000, nude: 1580, painted: 1800, weight: 8.90 }
];

export const MULTI_BAR_DATA = [
    { dim: "20 x 5", nude: 280, painted: 320, multi: { 2: 480, 3: 650 }, weight: 0.89 },
    { dim: "30 x 5", nude: 400, painted: 460, multi: { 2: 680, 3: 900 }, weight: 1.34 },
    { dim: "40 x 5", nude: 520, painted: 600, multi: { 2: 880, 3: 1150 }, weight: 1.78 },
    { dim: "50 x 5", nude: 630, painted: 720, multi: { 2: 1050, 3: 1380 }, weight: 2.23 },
    { dim: "50 x 10", nude: 880, painted: 1000, multi: { 2: 1450, 3: 1900 }, weight: 4.45 },
    { dim: "80 x 10", nude: 1300, painted: 1490, multi: { 2: 2100, 3: 2700 }, weight: 7.12 },
    { dim: "100 x 10", nude: 1580, painted: 1800, multi: { 2: 2500, 3: 3200 }, weight: 8.90 }
];

export function calculateBusbar(requiredAmps, isPainted, barsPerPhase = 1) {
    const factor = isPainted ? "painted" : "nude";
    
    if (barsPerPhase === 1) {
        // Search in single bar data
        const options = BUSBAR_DATA.filter(b => b[factor] >= requiredAmps);
        return options.length > 0 ? options[0] : null;
    } else {
        // Search in multi bar data
        const options = MULTI_BAR_DATA.filter(b => {
            const capacity = b.multi[barsPerPhase];
            // Adjust capacity if painted (approx +20% if not specified in table, but let's use nude as base for multi table if not given)
            // The user table for multi only gives one value. Let's assume it's for nude.
            const finalCapacity = isPainted ? capacity * 1.2 : capacity;
            return finalCapacity >= requiredAmps;
        });
        
        if (options.length > 0) {
            const best = options[0];
            return {
                ...best,
                capacity: isPainted ? best.multi[barsPerPhase] * 1.2 : best.multi[barsPerPhase]
            };
        }
        return null;
    }
}
