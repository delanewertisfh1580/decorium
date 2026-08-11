export class ItemViewModel {
  constructor(item) {
    this.item = item;
    this.isSelected = false;
  }

  get id() { return this.item.id; }
  get name() { return this.item.name; }
  get typeId() { return this.item.type; }
  get price() { return this.item.price; }
  get dimensions() { return this.item.dimensions; }
  get featureVector() { return this.item.featureVector; }
  select() { this.isSelected = true; }
  deselect() { this.isSelected = false; }
}
