// =============================================================================
// game/evaluator.js — запуск оценки. Шаг В: при мультикомнатности оценка
// считается по каждой комнате и собирается средневзвешенным по площадям
// (useAreaWeights по GDD). Формулы ядра (0.7/0.3, exp(-1.5·penalty), шкала
// звёзд) не меняются — делегируем evaluateRoom.
// =============================================================================

import { evaluateRoom, scoreToStars } from '../domain/scoring.js';
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
        itemCount, empty: true, perRoom: []
    };
}

/**
 * Полная оценка дизайна. Если virtualBox предоставляет getRooms() и комнат
 * больше одной — оцениваем каждую комнату отдельно, итог взвешиваем по площади.
 * @param {{getItems: Function, getMeshes: Function, virtualBox: object}} deps
 * @param {string} styleId
 */
export function runEvaluation(deps, styleId) {
    const items = deps.getItems();
    const vb = deps.virtualBox;
    if (!items || items.length === 0) return emptyResult(0);

    const rooms = (vb && typeof vb.getRooms === 'function') ? vb.getRooms() : null;

    if (!rooms || rooms.length < 2) {
        const cur = vb.getCur();
        const bounds = {
            minX: -cur.w / 2, maxX: cur.w / 2,
            minZ: -cur.d / 2, maxZ: cur.d / 2,
            minY: 0, maxY: cur.h
        };
        const res = evaluateRoom(items, styleId, bounds);
        return { ...res, perRoom: [] };
    }

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
            roomId: r.id,
            label,
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

    const totalScore = wTotal / areaSum;
    const groupScores = {};
    for (const [k, v] of Object.entries(groupAcc)) groupScores[k] = v / areaSum;

    return {
        totalScore,
        stars: scoreToStars(totalScore),
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