import Ajv from 'ajv';

/**
 * Infrastructure: FeedbackCatalog Implementation
 * Loads feedback message templates from JSON files.
 * Browser-compatible version using fetch API.
 */
export class JsonFeedbackCatalog {
  /**
   * @param {string} dataPath - Path to the feedback directory
   * @param {Object} schema - JSON Schema for feedback validation
   */
  constructor(dataPath, schema = null) {
    this.dataPath = dataPath;
    this.schema = schema;
    this.ajv = schema ? new Ajv() : null;
    this.validate = schema ? this.ajv.compile(schema) : null;
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

    try {
      const response = await fetch(`${this.dataPath}/index.json`);
      
      if (!response.ok) {
        throw new Error('Failed to load feedback index');
      }

      const indexData = await response.json();
      const feedbackIds = Array.isArray(indexData) ? indexData : indexData.feedback || [];

      const feedback = [];
      for (const feedbackId of feedbackIds) {
        const itemResponse = await fetch(`${this.dataPath}/${feedbackId}.json`);
        if (itemResponse.ok) {
          const data = await itemResponse.json();
          const itemsArray = Array.isArray(data) ? data : [data];

          for (const item of itemsArray) {
            if (this.validate) {
              const valid = this.validate(item);
              if (!valid) {
                const errors = this.validate.errors.map(e => e.message).join(', ');
                throw new Error(`Feedback schema validation failed for ${feedbackId}: ${errors}`);
              }
            }
            feedback.push(item);
          }
        }
      }

      this.feedbackCache = feedback;
      return feedback;
    } catch (error) {
      // Return empty array on error (graceful degradation)
      console.warn('Failed to load feedback, using empty catalog:', error.message);
      this.feedbackCache = [];
      return [];
    }
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
