/**
 * ConsoleLogger — базовый логгер для Observability
 * Infrastructure layer adapter
 */
export class ConsoleLogger {
  /**
   * @param {Object} options - Опции логгера
   * @param {boolean} options.includeTimestamp - Включать метку времени
   * @param {string} options.prefix - Префикс для логов
   */
  constructor(options = {}) {
    this.includeTimestamp = options.includeTimestamp ?? false;
    this.prefix = options.prefix || '';
  }

  /**
   * Логировать информационное сообщение
   * @param {string} message
   * @param {...any} args
   */
  info(message, ...args) {
    console.log(this._format('INFO', message), ...args);
  }

  /**
   * Логировать предупреждение
   * @param {string} message
   * @param {...any} args
   */
  warn(message, ...args) {
    console.warn(this._format('WARN', message), ...args);
  }

  /**
   * Логировать ошибку
   * @param {string} message
   * @param {...any} args
   */
  error(message, ...args) {
    console.error(this._format('ERROR', message), ...args);
  }

  /**
   * Логировать отладочное сообщение
   * @param {string} message
   * @param {...any} args
   */
  debug(message, ...args) {
    if (this.includeTimestamp) {
      console.debug(this._format('DEBUG', message), ...args);
    }
  }

  /**
   * Форматировать сообщение
   * @param {string} level
   * @param {string} message
   * @returns {string}
   */
  _format(level, message) {
    const timestamp = this.includeTimestamp ? `[${new Date().toISOString()}] ` : '';
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `${timestamp}${level}${prefix}${message}`;
  }
}

export default ConsoleLogger;
