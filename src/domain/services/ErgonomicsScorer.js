// =============================================================================
// domain/services/ErgonomicsScorer.js — Domain Service оценки эргономики.
// Работает строго с типизированными Placement (никаких адаптеров-угадаек).
// Три правила GDD: проходы ≥ 0.9 м, соотношение высот, баланс (сетка 3×3).
// score = exp(-λ·totalPenalty) — та же штрафная модель, что и у стиля.
// =============================================================================

import { LAMBDA } from '../scoringRules.js';

/** Минимальный проход между предметами, м (~36″ из GDD). */
export const MIN_PASSAGE = 0.9;

export class ErgonomicsScorer {
    /**
     * @param {object} [opts]
     * @param {number} [opts.lambda] крутизна штрафной экспоненты
     * @param {number} [opts.minPassage] минимальный зазор между кромками, м
     * @param {number} [opts.heightTolerance] допуск «столик выше сиденья», м
     * @param {number} [opts.balanceGrid] размер сетки баланса
     * @param {number} [opts.balanceVarianceThreshold] порог нормированной дисперсии
     */
    constructor({
        lambda = LAMBDA,
        minPassage = MIN_PASSAGE,
        heightTolerance = 0.05,
        balanceGrid = 3,
        balanceVarianceThreshold = 0.5
    } = {}) {
        this.lambda = lambda;
        this.minPassage = minPassage;
        this.heightTolerance = heightTolerance;
        this.balanceGrid = balanceGrid;
        this.balanceVarianceThreshold = balanceVarianceThreshold;
    }

    /**
     * Полная оценка эргономики для Item-сущностей.
     * @param {import('../entities/Item.js').Item[]} items
     * @param {{minX:number,maxX:number,minZ:number,maxZ:number}|null} bounds
     * @returns {{score:number, totalPenalty:number, violations:Array, checks:object, bounds:object}}
     */
    score(items, bounds = null) {
        if (!items || items.length === 0) {
            return { score: 1, totalPenalty: 0, violations: [], checks: {}, bounds };
        }

        const b = bounds || this._computeBounds(items);
        const passages = this._checkPassages(items);
        const heights = this._checkHeightRatios(items);
        const balance = this._checkBalance(items, b);

        const totalPenalty = passages.penalty + heights.penalty + balance.penalty;

        return {
            score: Math.exp(-this.lambda * totalPenalty),
            totalPenalty: +totalPenalty.toFixed(3),
            violations: [...passages.violations, ...heights.violations, ...balance.violations],
            checks: { passage: passages, height_ratio: heights, balance },
            bounds: b
        };
    }

    /** Консервативный «радиус» предмета для расчёта зазоров. */
    _radius(placement) {
        return Math.max(placement.w, placement.d) / 2;
    }

    /** Правило 1: проходы. Зазор между кромками предметов ≥ minPassage. */
    _checkPassages(items) {
        const violations = [];
        let penalty = 0;

        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const a = items[i].placement;
                const b = items[j].placement;

                const clearance = a.distanceTo(b) - (this._radius(a) + this._radius(b));
                if (clearance < this.minPassage) {
                    const deficit = this.minPassage - clearance;
                    penalty += deficit;
                    violations.push({
                        type: 'ergonomics',
                        rule: 'passage',
                        items: [items[i].id, items[j].id],
                        clearance: +clearance.toFixed(2),
                        required: this.minPassage,
                        deficit: +deficit.toFixed(2)
                    });
                }
            }
        }

        return { penalty, violations };
    }

    /** Правило 2: кофейный столик не выше сиденья дивана (в зоне пары). */
    _checkHeightRatios(items) {
        const violations = [];
        let penalty = 0;

        const sofas = items.filter((i) => i.type === 'sofa');
        const tables = items.filter((i) => i.type === 'box');

        for (const table of tables) {
            for (const sofa of sofas) {
                if (table.placement.distanceTo(sofa.placement) > 1.5) continue;

                const seatHeight = sofa.placement.h * 0.4; // сиденье ≈ 40% высоты дивана
                const excess = table.placement.h - seatHeight - this.heightTolerance;
                if (excess > 0) {
                    penalty += excess * 2;
                    violations.push({
                        type: 'ergonomics',
                        rule: 'height_ratio',
                        items: [table.id, sofa.id],
                        tableHeight: +table.placement.h.toFixed(2),
                        seatHeight: +seatHeight.toFixed(2),
                        deficit: +excess.toFixed(2)
                    });
                }
            }
        }

        return { penalty, violations };
    }

    /** Правило 3: баланс визуального веса по сетке N×N. */
    _checkBalance(items, bounds) {
        if (items.length < 3 || !bounds) return { penalty: 0, violations: [] };

        const n = this.balanceGrid;
        const cells = new Array(n * n).fill(0);
        const spanX = (bounds.maxX - bounds.minX) || 1;
        const spanZ = (bounds.maxZ - bounds.minZ) || 1;

        for (const item of items) {
            const p = item.placement;
            const cx = Math.min(n - 1, Math.max(0, Math.floor(((p.x - bounds.minX) / spanX) * n)));
            const cz = Math.min(n - 1, Math.max(0, Math.floor(((p.z - bounds.minZ) / spanZ) * n)));
            cells[cz * n + cx] += p.footprintArea;
        }

        const mean = cells.reduce((s, v) => s + v, 0) / cells.length;
        if (mean <= 0) return { penalty: 0, violations: [] };

        const variance = cells.reduce((s, v) => s + (v - mean) ** 2, 0) / cells.length;
        const normalized = variance / (mean * mean);

        if (normalized > this.balanceVarianceThreshold) {
            const deficit = normalized - this.balanceVarianceThreshold;
            return {
                penalty: deficit * 0.5,
                violations: [{
                    type: 'ergonomics',
                    rule: 'balance',
                    variance: +normalized.toFixed(2),
                    threshold: this.balanceVarianceThreshold
                }]
            };
        }

        return { penalty: 0, violations: [] };
    }

    /** Автограницы по предметам (если bounds не передан). */
    _computeBounds(items) {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const item of items) {
            const p = item.placement;
            const r = this._radius(p);
            minX = Math.min(minX, p.x - r);
            maxX = Math.max(maxX, p.x + r);
            minZ = Math.min(minZ, p.z - r);
            maxZ = Math.max(maxZ, p.z + r);
        }
        const m = 0.5;
        return { minX: minX - m, maxX: maxX + m, minZ: minZ - m, maxZ: maxZ + m };
    }
}