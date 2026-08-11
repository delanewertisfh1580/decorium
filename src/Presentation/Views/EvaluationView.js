export class EvaluationView {
  constructor(container) {
    this.container = container;
  }

  async init() {}

  render(result) {
    const feedback = Array.isArray(result.feedback) ? result.feedback : [result.feedback];
    const feedbackItems = feedback.filter(Boolean).map(message => `<li>${message}</li>`).join('');
    const violations = result.violations?.length
      ? `<p class="score-label">Нарушений: ${result.violations.length}</p>`
      : '<p class="score-label">Все ограничения соблюдены</p>';
    this.container.innerHTML = `
      <section class="evaluation-card panel">
        <button class="close" type="button" data-close>Закрыть</button>
        <h2>Результат расстановки</h2>
        <div class="stars">${'★'.repeat(result.stars)}${'☆'.repeat(5 - result.stars)}</div>
        <div class="evaluation-score">${Math.round(result.score * 100)} / 100</div>
        ${violations}
        <ul class="feedback">${feedbackItems}</ul>
      </section>
    `;
    this.container.querySelector('[data-close]').onclick = () => this.hide();
  }

  hide() { this.container.replaceChildren(); }
  destroy() { this.hide(); }
}
