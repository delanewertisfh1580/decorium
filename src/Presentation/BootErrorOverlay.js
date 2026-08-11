/**
 * BootErrorOverlay — диагностический оверлей при ошибке инициализации
 * Presentation layer component
 */
export class BootErrorOverlay {
  /**
   * @param {HTMLElement} container - Контейнер для оверлея
   * @param {boolean} isDev - Режим разработки (показывать stack trace)
   */
  constructor(container, isDev = true) {
    this.container = container;
    this.isDev = isDev;
    this.element = null;
  }

  /**
   * Показать ошибку
   * @param {Error} error - Объект ошибки
   * @param {string} errorCode - Код ошибки для отображения
   */
  showError(error, errorCode = 'BOOT_UNKNOWN') {
    if (this.element) {
      this.element.remove();
    }

    this.element = document.createElement('div');
    Object.assign(this.element.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(18, 21, 27, 0.98)',
      color: '#e0e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      padding: '40px'
    });

    const errorTitle = document.createElement('h1');
    errorTitle.textContent = 'Не удалось запустить игру';
    errorTitle.style.cssText = 'font-size: 28px; margin-bottom: 16px; color: #ff6b6b;';

    const errorCodeEl = document.createElement('div');
    errorCodeEl.textContent = `Код ошибки: ${this.escapeHtml(errorCode)}`;
    errorCodeEl.style.cssText = 'font-size: 14px; color: #8a93a6; margin-bottom: 24px; font-family: monospace;';

    const errorMsg = document.createElement('div');
    errorMsg.textContent = this.escapeHtml(error.message || 'Неизвестная ошибка');
    errorMsg.style.cssText = 'font-size: 16px; margin-bottom: 16px; max-width: 600px; text-align: center;';

    this.element.appendChild(errorTitle);
    this.element.appendChild(errorCodeEl);
    this.element.appendChild(errorMsg);

    if (this.isDev && error.stack) {
      const stackEl = document.createElement('pre');
      stackEl.textContent = error.stack;
      stackEl.style.cssText = 'font-size: 12px; color: #5c6b7f; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; max-width: 800px; max-height: 300px; overflow: auto; margin-top: 24px;';
      this.element.appendChild(stackEl);
    }

    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = 'Перезагрузить';
    reloadBtn.style.cssText = 'margin-top: 32px; padding: 12px 32px; font-size: 16px; background: #0066FF; color: white; border: none; border-radius: 8px; cursor: pointer;';
    reloadBtn.onclick = () => location.reload();
    this.element.appendChild(reloadBtn);

    this.container.appendChild(this.element);
  }

  /**
   * Проверить видимость оверлея
   * @returns {boolean}
   */
  isVisible() {
    return this.element !== null;
  }

  /**
   * Скрыть оверлей
   */
  hide() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Экранировать HTML-символы
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export default BootErrorOverlay;
