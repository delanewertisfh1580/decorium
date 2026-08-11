export class JsonStyleCatalog {
  constructor(path = './data/styles/scandinavian.json') {
    this.path = path;
    this.cache = null;
  }

  async loadAllStyles() {
    if (this.cache) return this.cache;
    const response = await fetch(this.path);
    if (!response.ok) throw new Error(`Failed to load style: ${response.status}`);
    this.cache = [await response.json()];
    return this.cache;
  }

  async getStyleById(styleId) {
    return (await this.loadAllStyles()).find(style => style.id === styleId) ?? null;
  }
}

export default JsonStyleCatalog;
