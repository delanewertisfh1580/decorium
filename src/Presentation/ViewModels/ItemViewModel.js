/**
 * ViewModel для предмета в интерфейсе.
 * Отвечает за отображение данных предмета в UI (каталог, комната).
 * 
 * @class ItemViewModel
 */
export class ItemViewModel {
    /**
     * @param {import('../Domain/Items/Item.js').Item} item 
     */
    constructor(item) {
        this._item = item;
        this._isSelected = false;
        this._isPlaced = false;
    }

    get id() { return this._item.id; }
    get name() { return this._item.name; }
    get typeId() { return this._item.typeId; }
    get styleId() { return this._item.styleId; }
    get price() { return this._item.price; }
    get imageKey() { return this._item.imageKey; }
    
    // Для размещенных предметов
    get position() { return this._item.position; }
    get rotation() { return this._item.rotation; }

    get isSelected() { return this._isSelected; }
    get isPlaced() { return this._isPlaced; }

    select() { this._isSelected = true; }
    deselect() { this._isSelected = false; }
    markAsPlaced() { this._isPlaced = true; }
    markAsRemoved() { this._isPlaced = false; this._isSelected = false; }

    /**
     * Обновляет данные из доменного объекта (например, после перемещения)
     * @param {import('../Domain/Items/Item.js').Item} updatedItem 
     */
    update(updatedItem) {
        this._item = updatedItem;
    }
}
