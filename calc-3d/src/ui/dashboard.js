// =============================================================================
// ui/dashboard.js — дашборд метрик качества дизайна (Decorium).
// Чистый UI-адаптер: НЕ импортирует оценочную логику. Оценка и список стилей
// приходят через инъекцию (deps.evaluate / deps.styleList) из main.js.
// Обновляется ТОЛЬКО по изменению состава — не в render-цикле.
// =============================================================================

import './dashboard.css';

/**
 * @param {object} deps
 * @param {(styleId: string)=>object} deps.evaluate — возвращает результат оценки
 * @param {()=>Array<{id:string,name:string,icon:string}>} deps.styleList
 */
export function initDashboard(deps) {
    const el = {
        styleSelect: document.getElementById('q-style-select'),
        stars: document.getElementById('q-stars'),
        total: document.getElementById('q-total'),
        styleVal: document.getElementById('q-style-val'),
        styleBar: document.getElementById('q-style-bar'),
        ergoVal: document.getElementById('q-ergo-val'),
        ergoBar: document.getElementById('q-ergo-bar'),
        gColor: document.getElementById('q-g-color'),
        gMaterials: document.getElementById('q-g-materials'),
        gGeometry: document.getElementById('q-g-geometry'),
        gStructure: document.getElementById('q-g-structure'),
        violCount: document.getElementById('q-viol-count'),
        violText: document.getElementById('q-viol-text'),
        count: document.getElementById('m-count'),
        loader: document.getElementById('loader'),
        hint: document.getElementById('hint')
    };

    const list = deps.styleList();
    let currentStyleId = list[0] ? list[0].id : 'scandinavian';
    let hintDimmed = false;

    // --- Селектор стиля клиента (из инъектированного списка) ---
    for (const s of list) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.icon} ${s.name}`;
        el.styleSelect.appendChild(opt);
    }
    el.styleSelect.value = currentStyleId;
    el.styleSelect.addEventListener('change', (e) => {
        currentStyleId = e.target.value;
        refresh();
    });

    // --- Мобильное раскрытие дашборда по тапу ---
    const root = document.querySelector('.dashboard');
    root.addEventListener('click', (event) => {
        if (!window.matchMedia('(max-width: 860px)').matches) return;
        if (event.target.closest('button, a, select')) return;
        root.classList.toggle('open');
    });

    function setBar(barEl, valEl, value) {
        const pct = Math.round((value || 0) * 100);
        valEl.textContent = `${pct}%`;
        barEl.style.width = `${pct}%`;
        barEl.classList.toggle('hot', pct < 40);
    }

    function renderEmpty() {
        el.count.textContent = '0';
        el.stars.textContent = '☆☆☆☆☆';
        el.stars.className = 'q-stars';
        el.total.textContent = '— / 100';
        setBar(el.styleBar, el.styleVal, 0);
        setBar(el.ergoBar, el.ergoVal, 0);
        el.gColor.textContent = '—';
        el.gMaterials.textContent = '—';
        el.gGeometry.textContent = '—';
        el.gStructure.textContent = '—';
        el.violCount.textContent = '0';
        el.violText.textContent = 'Добавьте предметы, чтобы увидеть оценку.';
        el.violText.className = 'q-viol-text';
    }

    function render(result) {
        el.count.textContent = String(result.itemCount);

        if (result.empty) { renderEmpty(); return; }

        el.stars.textContent = '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars);
        el.stars.className =
            'q-stars' +
            (result.stars >= 4 ? ' q-stars--good' : result.stars <= 2 ? ' q-stars--bad' : '');
        el.total.textContent = `${Math.round(result.totalScore * 100)} / 100`;

        setBar(el.styleBar, el.styleVal, result.styleScore);
        setBar(el.ergoBar, el.ergoVal, result.ergonomicsScore);

        const g = result.groupScores || {};
        el.gColor.textContent = `${Math.round((g['Цвет'] ?? 0) * 100)}%`;
        el.gMaterials.textContent = `${Math.round((g['Материалы'] ?? 0) * 100)}%`;
        el.gGeometry.textContent = `${Math.round((g['Геометрия'] ?? 0) * 100)}%`;
        el.gStructure.textContent = `${Math.round((g['Структура'] ?? 0) * 100)}%`;

        const problems = result.violations.length;
        el.violCount.textContent = String(problems);
        if (problems === 0) {
            el.violText.textContent = 'Нет нарушений — отличная работа!';
            el.violText.className = 'q-viol-text q-viol-text--ok';
        } else {
            el.violText.textContent = 'Есть нарушения — нажмите «Оценить дизайн» для деталей.';
            el.violText.className = 'q-viol-text';
        }
    }

    function refresh() {
        const result = deps.evaluate(currentStyleId);
        render(result);
        return result;
    }

    function hideLoader() {
        el.loader.classList.add('hide');
        if (!hintDimmed) {
            hintDimmed = true;
            setTimeout(() => el.hint.classList.add('dim'), 9000);
        }
    }

    renderEmpty();

    return {
        update: () => refresh(),
        hideLoader,
        getCurrentStyle: () => currentStyleId
    };
}