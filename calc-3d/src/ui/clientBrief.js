// =============================================================================
// ui/clientBrief.js — карточка брифа клиента: имя, тир, стиль, тон и пожелания
// (фразы клиента в персональном тоне — суффиксы-шаблоны из tone.js).
// DOM и стили создаются динамически — index.html не трогаем.
// =============================================================================

import { TONES } from '../level/tone.js';

/**
 * Показывает бриф клиента в левом верхнем углу под шапкой.
 * @param {{clientName: string, tier: string, styleLabel: string, toneKey: string, wishes: object[]}} data
 * @returns {{hide: ()=>void}}
 */
export function createClientBrief({ clientName, tier, styleLabel, toneKey, wishes }) {
    const tone = TONES[toneKey] || TONES.neutral;

    const root = document.createElement('div');
    root.id = 'client-brief';
    Object.assign(root.style, {
        position: 'fixed', top: '86px', left: '16px', zIndex: '540',
        maxWidth: '280px', padding: '12px 14px', borderRadius: '12px',
        background: 'rgba(30, 38, 48, 0.92)', color: '#e0e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, sans-serif', fontSize: '13px', lineHeight: '1.45'
    });

    const head = document.createElement('b');
    head.textContent = `${clientName} · ${tier}`;
    head.style.display = 'block';
    root.appendChild(head);

    const style = document.createElement('small');
    style.textContent = `Стиль: ${styleLabel} · тон: ${tone.label}`;
    style.style.display = 'block';
    style.style.opacity = '0.75';
    root.appendChild(style);

    if (Array.isArray(wishes) && wishes.length > 0) {
        const ul = document.createElement('ul');
        Object.assign(ul.style, { margin: '8px 0 0', padding: '0 0 0 16px' });
        for (const w of wishes) {
            const li = document.createElement('li');
            li.textContent = tone.wrap(w.text);
            li.style.margin = '4px 0';
            ul.appendChild(li);
        }
        root.appendChild(ul);
    }

    document.body.appendChild(root);

    // Мягко растворяем через 9 секунд — атмосфера таймкиллера важнее HUD.
    setTimeout(() => { root.style.opacity = '0'; root.style.transition = 'opacity 0.8s'; }, 9000);
    setTimeout(() => root.remove(), 10000);

    return { hide: () => root.remove() };
}