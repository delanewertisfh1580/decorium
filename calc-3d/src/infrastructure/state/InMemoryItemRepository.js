// =============================================================================
// infrastructure/state/InMemoryItemRepository.js — Repository-адаптер.
// Мост между DDD-слоем (Item/Placement/FeatureVector) и legacy state.js.
// raw-методы — для UI-адаптеров, ожидающих сырые записи (sizePanel, dashboard).
// =============================================================================

import { getItems, getItem, addItem, updateItem, removeItem, clear } from '../../domain/state.js';
import { Item } from '../../domain/entities/Item.js';
import { Placement } from '../../domain/value-objects/Placement.js';
import { FeatureVector } from '../../domain/value-objects/FeatureVector.js';
import { getItemFeaturesVector } from '../../domain/itemCatalog.js';

export class InMemoryItemRepository {
    /** Все предметы как Item-сущности. @returns {Item[]} */
    getAll() {
        return getItems().map((record) => this._toEntity(record));
    }

    /** Предмет по id как Item-сущность. @returns {Item|null} */
    getById(id) {
        const record = getItem(id);
        return record ? this._toEntity(record) : null;
    }

    /** Сырые записи (для легаси-UI). @returns {object[]} */
    getAllRaw() {
        return getItems();
    }

    /** Сырая запись по id (для легаси-UI). @returns {object|null} */
    getRaw(id) {
        return getItem(id);
    }

    /**
     * Сохранить Item (создать или обновить).
     * @param {Item} item
     * @returns {Item}
     */
    save(item) {
        if (!(item instanceof Item)) {
            throw new Error('save: аргумент должен быть Item');
        }
        const record = this._toRecord(item);
        if (item.id) {
            updateItem(item.id, record);
            return item;
        }
        const saved = addItem(record);
        return this._toEntity(saved);
    }

    /**
     * Массовый перенос всех предметов (смена активной комнаты).
     * @param {number} dx
     * @param {number} dz
     */
    shiftAll(dx, dz) {
        for (const record of getItems()) {
            updateItem(record.id, { x: record.x + dx, z: record.z + dz });
        }
    }

    /** @param {number|string} id */
    delete(id) {
        const record = removeItem(id);
        return record ? this._toEntity(record) : null;
    }

    clear() {
        clear();
    }

    /** @private */
    _toEntity(record) {
        return new Item({
            id: record.id,
            type: record.type,
            placement: new Placement({
                x: record.x, y: record.y, z: record.z,
                w: record.w, d: record.d, h: record.h
            }),
            features: new FeatureVector(getItemFeaturesVector(record)),
            catalogId: record.type
        });
    }

    /** @private */
    _toRecord(item) {
        return {
            id: item.id,
            type: item.type,
            x: item.placement.x,
            y: item.placement.y,
            z: item.placement.z,
            w: item.placement.w,
            d: item.placement.d,
            h: item.placement.h,
            volume: item.placement.volume
        };
    }
}