/**
 * View для отображения результатов оценки.
 * 
 * @implements {import('./IView.js').IView}
 */
export class EvaluationView {
    /**
     * @param {HTMLElement} container 
     */
    constructor(container) {
        this._container = container;
        this._isVisible = false;
    }

    async init() {
        this._container.innerHTML = `
            <div id="evaluation-panel" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border:2px solid #333;z-index:1000;">
                <h2>Результаты оценки</h2>
                <div id="stars" style="font-size:48px;color:#FFC107;"></div>
                <div id="score" style="font-size:24px;margin:10px 0;"></div>
                <div id="feedback" style="text-align:left;margin:10px 0;"></div>
                <button id="btn-close" style="padding:10px 20px;margin-top:10px;">Закрыть</button>
            </div>
        `;

        document.getElementById('btn-close').onclick = () => this.hide();
    }

    /**
     * @param {import('../ViewModels/EvaluationViewModel.js').EvaluationViewModel} viewModel 
     */
    render(viewModel) {
        if (!viewModel.isVisible) {
            this.hide();
            return;
        }

        const panel = document.getElementById('evaluation-panel');
        const starsDiv = document.getElementById('stars');
        const scoreDiv = document.getElementById('score');
        const feedbackDiv = document.getElementById('feedback');

        starsDiv.textContent = '★'.repeat(viewModel.stars) + '☆'.repeat(5 - viewModel.stars);
        scoreDiv.textContent = `Счет: ${viewModel.score} / ${viewModel.maxScore}`;
        feedbackDiv.innerHTML = viewModel.feedback.map(f => `<p>• ${f}</p>`).join('');
        
        panel.style.display = 'block';
        this._isVisible = true;
    }

    destroy() {
        this._container.innerHTML = '';
    }

    hide() {
        const panel = document.getElementById('evaluation-panel');
        if (panel) panel.style.display = 'none';
        this._isVisible = false;
    }

    show() {
        const panel = document.getElementById('evaluation-panel');
        if (panel) panel.style.display = 'block';
        this._isVisible = true;
    }
}
