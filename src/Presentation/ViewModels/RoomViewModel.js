export class RoomViewModel {
  constructor(level) {
    this.level = level;
    this._selectedItemId = null;
  }

  get id() { return this.level.roomId; }
  get name() { return this.level.name; }
  get width() { return this.level.roomState.width; }
  get height() { return this.level.roomState.depth; }
  get roomState() { return this.level.roomState; }
  get placedItems() { return this.level.roomState.getItems(); }
  get availableItems() { return this.level.availableItems; }
  get selectedItemId() { return this._selectedItemId; }

  selectItem(itemId) { this._selectedItemId = itemId; }
  clearSelection() { this._selectedItemId = null; }
  getItemById(itemId) { return this.level.availableItems.find(item => item.id === itemId) ?? null; }
}
