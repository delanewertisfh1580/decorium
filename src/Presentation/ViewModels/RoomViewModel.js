/**
 * ViewModel для комнаты и размещенных предметов.
 * Содержит состояние комнаты для отображения в UI.
 * 
 * @class RoomViewModel
 */
export class RoomViewModel {
    constructor(roomState) {
        this._roomState = roomState;
        this._selectedItemId = null;
    }

    get id() { return this._roomState.id; }
    get name() { return this._roomState.levelName; }
    get width() { return this._roomState.width; }
    get height() { return this._roomState.height; }
    get placedItems() { return this._roomState.placedItems; }
    
    get selectedItemId() { return this._selectedItemId; }
    
    /**
     * @param {string} itemId 
     */
    selectItem(itemId) {
        this._selectedItemId = itemId;
    }

    clearSelection() {
        this._selectedItemId = null;
    }

    /**
     * Получает данные предмета по ID
     * @param {string} itemId 
     * @returns {import('../Domain/Items/Item.js').Item|null}
     */
    getItemById(itemId) {
        return this._roomState.getItemById(itemId);
    }
}
