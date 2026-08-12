export class JsonStyleCatalog {
  constructor(path = null) {
    this.path = path;
    this.cache = null;
    
    // Если path === null, используем встроенные данные
    if (path === null && window.DECORIUM_DATA?.styles) {
      this.cache = this._loadFromEmbedded();
    }
  }
  
  _loadFromEmbedded() {
    const allStyles = [];
    for (const [path, content] of Object.entries(window.DECORIUM_DATA.styles)) {
      if (path.endsWith('.json')) {
        allStyles.push(content);
      }
    }
    return allStyles;
  }
  
  setStyles(stylesData) {
    // Метод для прямой установки данных из EmbeddedDataLoader
    const allStyles = [];
    for (const [path, content] of Object.entries(stylesData)) {
      if (path.endsWith('.json')) {
        allStyles.push(content);
      }
    }
    this.cache = allStyles;
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
