// =============================================================================
// game/evaluator.js — запуск оценки. Шаг Г: wishes клиента влияют на scoring
// (доп. ограничения поверх стиля/эргономики, штраф по GDD exp(-λ·penalty))
// и попадают в violations для обратной связи. Per-room оценка Шага В сохранена.
// =============================================================================

import { evaluateRoom, scoreToStars, LAMBDA } from '../domain/scoring.js';
import { FEATURE_INDEX } from '../domain/features.js';
import { ROOM_LABELS } from '../level/bsp.js';

export const TYPE_TO_CATALOG_ID = {
    box: 'table_scandi',
    sofa: 'sofa_scandi',
    bike: 'lamp_industrial',
    fridge: 'media_panel',
    shelf: 'shelf_scandi'
};

function emptyResult(itemCount) {
    return {
        totalScore: 0, stars: 0, styleScore: 0, ergonomicsScore: 0,
        roomVector: null, groupScores: {}, violations: [],
        itemCount, empty: true, perRoom: [], wishes: []
    };
}

/** Штраф по feature-wish: маргин невыполнения относительно вектора комнаты. */
function featureWishMargin(wish, roomVector) {
    const idx = FEATURE_INDEX[wish.feature];
    if (idx === undefined || !roomVector) return 0;
    const v = roomVector[idx];
    if (typeof v !== 'number') return 0;
    if (wish.op === '>=') return Math.max(0, wish.thr - v);
    if (wish.op === '<=') return Math.max(0, v - wish.thr);
    return Math.max(0, Math.abs(v - wish.thr) - 0.05); // '==' с допуском
}

/** Штраф по rule-wish 'passage': попарные зазоры между предметами комнаты. */
function passageWishMargin(itemsInRoom, thr) {
    let margin = 0;
    for (let i = 0; i < itemsInRoom.length; i++) {
        for (let j = i + 1; j < itemsInRoom.length; j++) {
            const a = itemsInRoom[i], b = itemsInRoom[j];
            const ra = Math.max(a.w, a.d) / 2;
            const rb = Math.max(b.w, b.d) / 2;
            const gap = Math.hypot(a.x - b.x, a.z - b.z) - (ra + rb);
            if (gap < thr) margin += (thr - gap);
        }
    }
    return Math.min(1.5, margin * 0.3);
}

/**
 * Полная оценка дизайна: per-room (Шаг В) + wishes клиента (Шаг Г).
 * @param {{getItems: Function, getMeshes: Function, virtualBox: object}} deps
 * @param {string} styleId (может быть персональным id из variation.js)
 * @param {object[]} [wishes] пожелания клиента из TaskContract
 */
export function runEvaluation(deps, styleId, wishes = []) {
    const items = deps.getItems();
    const vb = deps.virtualBox;
    if (!items || items.length === 0) return emptyResult(0);

    const rooms = (vb && typeof vb.getRooms === 'function') ? vb.getRooms() : null;

    let base;
    if (!rooms || rooms.length < 2) {
        const cur = vb.getCur();
        const bounds = {
            minX: -cur.w / 2, maxX: cur.w / 2,
            minZ: -cur.d / 2, maxZ: cur.d / 2,
            minY: 0, maxY: cur.h
        };
        base = { ...evaluateRoom(items, styleId, bounds), perRoom: [] };
    } else {
        const active = vb.getActiveRoom();
        const perRoom = [];
        const violations = [];
        let areaSum = 0, wTotal = 0, wStyle = 0, wErgo = 0;
        let vecAcc = null;
        const groupAcc = {};

        for (const r of rooms) {
            const inRoom = items.filter((it) => vb.roomAt(it.x, it.z) === r.id);
            const cx = r.x - active.x;
            const cz = r.z - active.z;
            const bounds = {
                minX: cx - r.w / 2, maxX: cx + r.w / 2,
                minZ: cz - r.d / 2, maxZ: cz + r.d / 2,
                minY: 0, maxY: 3
            };
            const res = evaluateRoom(inRoom, styleId, bounds);
            const label = ROOM_LABELS[r.type] || r.type;

            perRoom.push({
                roomId: r.id, label,
                stars: res.empty ? 0 : res.stars,
                totalScore: res.empty ? 0 : res.totalScore,
                empty: res.empty
            });
            res.violations.forEach((v) => violations.push({ ...v, room: label }));

            if (!res.empty) {
                const area = r.w * r.d;
                areaSum += area;
                wTotal += res.totalScore * area;
                wStyle += res.styleScore * area;
                wErgo += res.ergonomicsScore * area;
                if (res.roomVector) {
                    if (!vecAcc) vecAcc = res.roomVector.map((v) => v * area);
                    else vecAcc = vecAcc.map((v, i) => v + res.roomVector[i] * area);
                }
                for (const [k, v] of Object.entries(res.groupScores || {})) {
                    groupAcc[k] = (groupAcc[k] || 0) + v * area;
                }
            }
        }

        if (areaSum === 0) return { ...emptyResult(items.length), perRoom };

        const groupScores = {};
        for (const [k, v] of Object.entries(groupAcc)) groupScores[k] = v / areaSum;

        base = {
            totalScore: wTotal / areaSum,
            stars: scoreToStars(wTotal / areaSum),
            styleScore: wStyle / areaSum,
            ergonomicsScore: wErgo / areaSum,
            roomVector: vecAcc ? vecAcc.map((v) => v / areaSum) : null,
            groupScores,
            violations,
            itemCount: items.length,
            empty: false,
            perRoom
        };
    }

    // --- Wishes клиента (Шаг Г): доп. штрафы по GDD exp(-λ·penalty) ---
    let pStyle = 0, pErgo = 0;
    const wishReport = [];

    for (const wish of wishes) {
        let margin = 0;
        if (typeof wish.feature === 'string') {
            margin = featureWishMargin(wish, base.roomVector);
            pStyle += margin * (wish.weight || 1);
        } else if (wish.rule === 'passage') {
            margin = passageWishMargin(items, wish.thr);
            pErgo += margin * (wish.weight || 1);
        }
        const satisfied = margin <= 1e-6;
        wishReport.push({ text: wish.text, satisfied, margin });
        if (!satisfied) {
            base.violations.push({
                group: 'Пожелания клиента',
                text: wish.text,
                penalty: margin
            });
        }
    }

    const styleAdj = base.styleScore * Math.exp(-LAMBDA * pStyle);
    const ergoAdj = base.ergonomicsScore * Math.exp(-LAMBDA * pErgo);
    const totalScore = 0.7 * styleAdj + 0.3 * ergoAdj;

    return {
        ...base,
        styleScore: styleAdj,
        ergonomicsScore: ergoAdj,
        totalScore,
        stars: scoreToStars(totalScore),
        wishes: wishReport
    };
}