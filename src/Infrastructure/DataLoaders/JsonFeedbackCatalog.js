export class JsonFeedbackCatalog {
  constructor(path = './data/feedback/scandinavian-feedback.json') {
    this.path = path;
    this.cache = null;
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

    for (const violation of violations) {
      const message = feedback.find(item => item.id === violation.messageKey);
      if (message) {
        messages.push(message.template
          .replaceAll('{threshold}', violation.threshold.toFixed(2))
          .replaceAll('{value}', violation.actualValue.toFixed(2)));
      }
    }

    const successId = violations.length === 0
      ? (stars >= 5 ? 'success-excellent' : stars >= 3 ? 'success-good' : null)
      : null;
    const success = successId ? feedback.find(item => item.id === successId) : null;
    if (success) messages.unshift(success.template);
    if (messages.length === 0) {
      const tip = feedback.find(item => item.id === 'tip-more-items');
      if (tip) messages.push(tip.template);
    }
    return messages;
  }
}

export default JsonFeedbackCatalog;
