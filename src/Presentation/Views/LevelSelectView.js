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
          ${levels.map(level => {
            const isUnlocked = level.isUnlocked !== false;
            const isActive = isUnlocked && level.id === activeLevelId;
            const progress = Number.isInteger(level.bestStars)
              ? `<small class="level-select-progress">Лучший результат: ${level.bestStars}★</small>`
              : '';
            const lockHint = !isUnlocked
              ? `<small class="level-select-lock">Открывается после ${level.prerequisiteLevelId}</small>`
              : '';
            return `
              <button
                class="level-select-item${isActive ? ' is-active' : ''}${!isUnlocked ? ' is-locked' : ''}"
                type="button"
                data-level-id="${level.id}"
                role="listitem"
                ${isActive ? 'aria-current="true"' : ''}
                ${!isUnlocked ? 'disabled aria-disabled="true"' : ''}
              >
                <span>${level.name}</span>
                <small>${level.description}</small>
                ${progress}
                ${lockHint}
              </button>
            `;
          }).join('')}
        </div>
      </details>
    `;

    for (const button of this.container.querySelectorAll('[data-level-id]')) {
      button.addEventListener('click', () => {
        if (!button.disabled) this.onLevelSelected(button.dataset.levelId);
      });
    }
  }
}

export default LevelSelectView;
