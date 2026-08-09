import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Infrastructure: StyleCatalog Implementation
 * Loads style definitions and constraints from JSON files.
 */
class JsonStyleCatalog {
  /**
   * @param {string} stylesDir - Path to the styles directory
   * @param {string} constraintsDir - Path to the constraints directory
   * @param {Object} styleSchema - JSON Schema for style validation
   * @param {Object} constraintSchema - JSON Schema for constraint validation
   */
  constructor(stylesDir, constraintsDir, styleSchema, constraintSchema) {
    this.stylesDir = stylesDir;
    this.constraintsDir = constraintsDir;
    this.styleSchema = styleSchema;
    this.constraintSchema = constraintSchema;
    this.ajv = new Ajv();
    this.styleValidate = this.ajv.compile(styleSchema);
    this.constraintValidate = this.ajv.compile(constraintSchema);
    this.stylesCache = null;
    this.constraintsCache = null;
  }

  /**
   * Load all styles
   * @returns {Promise<Array<Object>>} Array of style definitions
   */
  async loadAllStyles() {
    if (this.stylesCache) {
      return this.stylesCache;
    }

    const styles = [];
    const files = fs.readdirSync(this.stylesDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.stylesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const valid = this.styleValidate(data);
      if (!valid) {
        const errors = this.styleValidate.errors.map(e => e.message).join(', ');
        throw new Error(`Style schema validation failed in ${file}: ${errors}`);
      }
      styles.push(data);
    }

    this.stylesCache = styles;
    return styles;
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
   * Load all constraints
   * @returns {Promise<Array<Object>>} Array of constraint definitions
   */
  async loadAllConstraints() {
    if (this.constraintsCache) {
      return this.constraintsCache;
    }

    const constraints = [];
    const files = fs.readdirSync(this.constraintsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.constraintsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Handle both array and single object formats
      const constraintsArray = Array.isArray(data) ? data : [data];

      for (const constraint of constraintsArray) {
        const valid = this.constraintValidate(constraint);
        if (!valid) {
          const errors = this.constraintValidate.errors.map(e => e.message).join(', ');
          throw new Error(`Constraint schema validation failed in ${file}: ${errors}`);
        }
        constraints.push(constraint);
      }
    }

    this.constraintsCache = constraints;
    return constraints;
  }

  /**
   * Get constraints for a specific style
   * @param {string} styleId
   * @returns {Promise<Array<Object>>} Array of constraints for the style
   */
  async getConstraintsByStyleId(styleId) {
    const constraints = await this.loadAllConstraints();
    return constraints.filter(c => c.styleId === styleId);
  }

  /**
   * Clear caches (useful for testing)
   */
  clearCache() {
    this.stylesCache = null;
    this.constraintsCache = null;
  }
}

export default JsonStyleCatalog;
