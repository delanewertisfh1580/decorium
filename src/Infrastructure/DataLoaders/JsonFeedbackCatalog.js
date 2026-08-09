import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Infrastructure: FeedbackCatalog Implementation
 * Loads feedback message templates from JSON files.
 */
class JsonFeedbackCatalog {
  /**
   * @param {string} dataDir - Path to the feedback directory
   * @param {Object} schema - JSON Schema for feedback validation
   */
  constructor(dataDir, schema) {
    this.dataDir = dataDir;
    this.schema = schema;
    this.ajv = new Ajv();
    this.validate = this.ajv.compile(schema);
    this.feedbackCache = null;
  }

  /**
   * Load all feedback templates
   * @returns {Promise<Array<Object>>} Array of feedback definitions
   */
  async loadAllFeedback() {
    if (this.feedbackCache) {
      return this.feedbackCache;
    }

    const feedback = [];
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.dataDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Handle both array and single object formats
      const feedbackArray = Array.isArray(data) ? data : [data];

      for (const item of feedbackArray) {
        const valid = this.validate(item);
        if (!valid) {
          const errors = this.validate.errors.map(e => e.message).join(', ');
          throw new Error(`Feedback schema validation failed in ${file}: ${errors}`);
        }
        feedback.push(item);
      }
    }

    this.feedbackCache = feedback;
    return feedback;
  }

  /**
   * Get a specific feedback template by ID
   * @param {string} feedbackId
   * @returns {Promise<Object|null>} Feedback definition or null if not found
   */
  async getFeedbackById(feedbackId) {
    const feedback = await this.loadAllFeedback();
    return feedback.find(f => f.id === feedbackId) || null;
  }

  /**
   * Get feedback templates by category
   * @param {string} category - 'violation', 'success', or 'tip'
   * @returns {Promise<Array<Object>>} Array of feedback templates
   */
  async getFeedbackByCategory(category) {
    const feedback = await this.loadAllFeedback();
    return feedback.filter(f => f.category === category);
  }

  /**
   * Format a feedback template with values
   * @param {string} feedbackId
   * @param {Object} values - Key-value pairs to substitute in template
   * @returns {Promise<string|null>} Formatted message or null if not found
   */
  async formatFeedback(feedbackId, values = {}) {
    const feedback = await this.getFeedbackById(feedbackId);
    if (!feedback) {
      return null;
    }

    let template = feedback.template;
    for (const [key, value] of Object.entries(values)) {
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return template;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.feedbackCache = null;
  }
}

export default JsonFeedbackCatalog;
