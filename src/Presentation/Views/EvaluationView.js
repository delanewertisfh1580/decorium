export class EvaluationView {
  constructor(container) {
    this.container = container;
  }

  async init() {}

  render(result) {
    const feedback = Array.isArray(result.feedback) ? result.feedback : [result.feedback];
    const feedbackItems = feedback.filter(Boolean).map(message => `<li>${message}</li>`).join('');
    const violations = result.violations?.length
      ? `<p class="score-label">${result.violations.length} подсказок для следующей попытки</p>`
      : '<p class="score-label success-note">Комната собрана гармонично</p>';
    this.container.innerHTML = `
      <section class="evaluation-card panel" aria-labelledby="evaluation-title">
        <button class="close" type="button" data-close aria-label="Закрыть результат">×</button>
        <span class="eyebrow">Итоги комнаты</span>
        <h2 id="evaluation-title">Результат расстановки</h2>
        <div class="evaluation-result-row">
          <div class="stars" aria-label="${result.stars} из 5 звёзд">${'★'.repeat(result.stars)}${'☆'.repeat(5 - result.stars)}</div>
          <div class="evaluation-score">${Math.round(result.score * 100)}<small>/100</small></div>
        </div>
        ${violations}
        <ul class="feedback">${feedbackItems}</ul>
      </section>
    `;
    this.container.querySelector('[data-close]').onclick = () => this.hide();
  }

  hide() { this.container.replaceChildren(); }
  destroy() { this.hide(); }
}
