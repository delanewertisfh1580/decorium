export class JsonFeedbackCatalog {
  constructor(path = null) {
    this.path = path;
    this.cache = null;
    
    // Если path === null, используем встроенные данные
    if (path === null && window.DECORIUM_DATA?.feedback) {
      this.cache = this._loadFromEmbedded();
    }
  }
  
  _loadFromEmbedded() {
    const allFeedback = [];
    for (const [path, content] of Object.entries(window.DECORIUM_DATA.feedback)) {
      if (Array.isArray(content)) {
        allFeedback.push(...content);
      }
    }
    return allFeedback;
  }
  
  setFeedback(feedbackData) {
    // Метод для прямой установки данных из EmbeddedDataLoader
    const allFeedback = [];
    for (const [path, content] of Object.entries(feedbackData)) {
      if (Array.isArray(content)) {
        allFeedback.push(...content);
      }
    }
    this.cache = allFeedback;
  }

  async loadAllFeedback() {
    if (this.cache) return this.cache;
    const response = await fetch(this.path);
    if (!response.ok) throw new Error(`Failed to load feedback: ${response.status}`);
    this.cache = await response.json();
    return this.cache;
  }

  async getFeedbackById(feedbackId) {
    return (await this.loadAllFeedback()).find(item => item.id === feedbackId) ?? null;
  }

  async formatFeedback(feedbackId, values = {}) {
    const feedback = await this.getFeedbackById(feedbackId);
    if (!feedback) return null;
    return Object.entries(values).reduce(
      (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
      feedback.template
    );
  }

  async getEvaluationFeedback(stars, violations) {
    const feedback = await this.loadAllFeedback();
    const messages = [];
    const starFeedback = feedback.find(f => f.id === `stars-${stars}` || f.id === `evaluation-stars-${stars}`);
    if (starFeedback) messages.push(starFeedback.template);
    for (const v of violations) {
      const constraintFeedback = feedback.find(f => f.id === v.messageKey);
      if (constraintFeedback) messages.push(constraintFeedback.template);
    }
    return messages;
  }
}

export default JsonFeedbackCatalog;
