/**
 * View для панели инструментов.
 * Кнопки действий: удалить, повернуть, оценить.
 * 
 * @implements {import('./IView.js').IView}
 */
export class ToolbarView {
    /**
     * @param {HTMLElement} container 
     * @param {Object} callbacks 
     * @param {Function} callbacks.onDelete - Удалить предмет
     * @param {Function} callbacks.onRotate - Повернуть предмет
     * @param {Function} callbacks.onEvaluate - Оценить комнату
     */
    constructor(container, callbacks) {
        this._container = container;
        this._callbacks = callbacks;
    }

    async init() {
        this._container.innerHTML = `
            <div id="toolbar" style="display:flex;gap:10px;padding:10px;background:#f5f5f5;">
                <button id="btn-delete" disabled>Удалить (Del)</button>
                <button id="btn-rotate" disabled>Повернуть (R)</button>
                <button id="btn-evaluate">Оценить (E)</button>
            </div>
        `;

        document.getElementById('btn-delete').onclick = () => this._callbacks.onDelete();
        document.getElementById('btn-rotate').onclick = () => this._callbacks.onRotate();
        document.getElementById('btn-evaluate').onclick = () => this._callbacks.onEvaluate();
    }

    render() {
        // Обновление состояния кнопок происходит извне
    }

    destroy() {
        this._container.innerHTML = '';
    }

    /**
     * Включает/выключает кнопки удаления и поворота
     * @param {boolean} hasSelection 
     */
    setSelectionState(hasSelection) {
        const deleteBtn = document.getElementById('btn-delete');
        const rotateBtn = document.getElementById('btn-rotate');
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
        if (rotateBtn) rotateBtn.disabled = !hasSelection;
    }

    /**
     * Показывает результат оценки
     * @param {number} stars 
     * @param {string[]} feedback 
     */
    showEvaluation(stars, feedback) {
        alert(`Оценка: ${stars} звезд\n\n${feedback.join('\n')}`);
    }
}
