/**
 * Интерфейс для View компонентов.
 * Определяет контракт между Controller и отображением.
 * 
 * @interface IView
 */
export class IView {
    /**
     * Инициализация View
     * @returns {Promise<void>}
     */
    async init() { throw new Error('Not implemented'); }

    /**
     * Отрисовка View
     */
    render() { throw new Error('Not implemented'); }

    /**
     * Очистка ресурсов
     */
    destroy() { throw new Error('Not implemented'); }
}
