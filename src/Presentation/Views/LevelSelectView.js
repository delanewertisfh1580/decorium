export class LevelSelectView {
  constructor(container, onLevelSelected) {
    if (!container) throw new Error('LevelSelectView: container is required.');
    if (typeof onLevelSelected !== 'function') throw new Error('LevelSelectView: onLevelSelected is required.');
    this.container = container;
    this.onLevelSelected = onLevelSelected;
  }

  render(levels, activeLevelId) {
    if (!Array.isArray(levels)) throw new Error('LevelSelectView: levels must be an array.');

    this.container.innerHTML = `
      <details class="level-select" data-level-select>
        <summary class="level-select-toggle" aria-label="Открыть выбор уровня">
          <span class="level-select-icon" aria-hidden="true">⌂</span>
          <span class="level-select-copy"><b>Уровень</b><small>${levels.length} задания</small></span>
          <span class="level-select-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="level-select-list" role="list">
          ${levels.map(level => `
            <button
              class="level-select-item${level.id === activeLevelId ? ' is-active' : ''}"
              type="button"
              data-level-id="${level.id}"
              role="listitem"
              ${level.id === activeLevelId ? 'aria-current="true"' : ''}
            >
              <span>${level.name}</span>
              <small>${level.description}</small>
            </button>
          `).join('')}
        </div>
      </details>
    `;

    for (const button of this.container.querySelectorAll('[data-level-id]')) {
      button.addEventListener('click', () => this.onLevelSelected(button.dataset.levelId));
    }
  }
}

export default LevelSelectView;
