import Ajv from 'ajv';

/**
 * Infrastructure: StyleCatalog Implementation
 * Loads style definitions and constraints from JSON files.
 * Browser-compatible version using fetch API.
 */
export class JsonStyleCatalog {
  /**
   * @param {string} stylesPath - Path to the styles directory
   * @param {Object} styleSchema - JSON Schema for style validation
   */
  constructor(stylesPath, styleSchema = null) {
    this.stylesPath = stylesPath;
    this.styleSchema = styleSchema;
    this.ajv = styleSchema ? new Ajv() : null;
    this.styleValidate = styleSchema ? this.ajv.compile(styleSchema) : null;
    this.stylesCache = null;
  }

  /**
   * Load all styles
   * @returns {Promise<Array<Object>>} Array of style definitions
   */
  async loadAllStyles() {
    if (this.stylesCache) {
      return this.stylesCache;
    }

    try {
      const response = await fetch(`${this.stylesPath}/index.json`);
      
      if (!response.ok) {
        throw new Error('Failed to load styles index');
      }

      const indexData = await response.json();
      const styleIds = Array.isArray(indexData) ? indexData : indexData.styles || [];

      const styles = [];
      for (const styleId of styleIds) {
        const styleResponse = await fetch(`${this.stylesPath}/${styleId}.json`);
        if (styleResponse.ok) {
          const data = await styleResponse.json();
          
          if (this.styleValidate) {
            const valid = this.styleValidate(data);
            if (!valid) {
              const errors = this.styleValidate.errors.map(e => e.message).join(', ');
              throw new Error(`Style schema validation failed in ${styleId}: ${errors}`);
            }
          }
          styles.push(data);
        }
      }

      this.stylesCache = styles;
      return styles;
    } catch (error) {
      // Return empty array on error (graceful degradation)
      console.warn('Failed to load styles, using empty catalog:', error.message);
      this.stylesCache = [];
      return [];
    }
  }

  /**
   * Get a specific style by ID
   * @param {string} styleId
   * @returns {Promise<Object|null>} Style definition or null if not found
   */
  async getStyleById(styleId) {
    const styles = await this.loadAllStyles();
    return styles.find(style => style.id === styleId) || null;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.stylesCache = null;
  }
}

export default JsonStyleCatalog;
