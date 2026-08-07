// =============================================================================
// application/DecoriumApp.js — композиционный корень домена.
// Не импортирует three/DOM: пространство инжектится интерфейсом spaceProvider.
// =============================================================================

import { StyleScorer } from '../domain/services/StyleScorer.js';
import { ErgonomicsScorer } from '../domain/services/ErgonomicsScorer.js';
import { StyleRepository } from '../domain/repositories/StyleRepository.js';
import { InMemoryItemRepository } from '../infrastructure/state/InMemoryItemRepository.js';
import { EvaluationService } from './EvaluationService.js';

/**
 * Фабрика приложения: production-реализации по умолчанию, всё подменяемо.
 * @param {object} [deps]
 * @param {object} [deps.itemRepository]
 * @param {object} [deps.styleRepository]
 * @param {object} [deps.styleScorer]
 * @param {object} [deps.ergonomicsScorer]
 * @param {object} [deps.evaluationService]
 * @param {object} [deps.spaceProvider] getBounds/getRooms/getActiveRoom/roomAt
 */
export function createDecoriumApp({
    itemRepository,
    styleRepository,
    styleScorer,
    ergonomicsScorer,
    evaluationService,
    spaceProvider = null
} = {}) {
    const _itemRepo = itemRepository || new InMemoryItemRepository();
    const _styleRepo = styleRepository || new StyleRepository();
    const _styleScorer = styleScorer || new StyleScorer();
    const _ergoScorer = ergonomicsScorer || new ErgonomicsScorer();
    const _evalService = evaluationService || new EvaluationService({
        itemRepository: _itemRepo,
        styleRepository: _styleRepo,
        styleScorer: _styleScorer,
        ergonomicsScorer: _ergoScorer
    });

    return {
        /** Репозиторий предметов. */
        items: _itemRepo,
        /** Репозиторий стилей. */
        styles: _styleRepo,
        /** Application-сервис оценки. */
        evaluation: _evalService,

        /**
         * Полная оценка текущего дизайна (пространство — из spaceProvider).
         * @param {{styleId?: string, wishes?: object[], useAreaWeights?: boolean}} [params]
         */
        evaluate({ styleId, wishes = [], useAreaWeights = false } = {}) {
            const sp = spaceProvider;
            const rooms = sp && typeof sp.getRooms === 'function' ? sp.getRooms() : null;
            const active = sp && typeof sp.getActiveRoom === 'function' ? sp.getActiveRoom() : null;
            const bounds = sp && typeof sp.getBounds === 'function' ? sp.getBounds() : null;
            const roomAt = sp && typeof sp.roomAt === 'function' ? (x, z) => sp.roomAt(x, z) : null;

            return _evalService.evaluate({
                styleId: styleId || _styleRepo.getDefaultId(),
                wishes,
                bounds,
                rooms: rooms && rooms.length > 1 ? rooms : null,
                roomAt,
                active,
                useAreaWeights
            });
        },

        /**
         * Массовый перенос агрегатов Item (смена активной комнаты).
         * @param {number} dx
         * @param {number} dz
         */
        relocateAllItems(dx, dz) {
            _itemRepo.shiftAll(dx, dz);
        },

        /** Человекочитаемое имя стиля. @param {string} id */
        styleLabel(id) {
            const def = _styleRepo.getById(id);
            return def ? def.name : id;
        },

        /** Список стилей для UI. */
        styleList() {
            return _styleRepo.listForUI();
        }
    };
}