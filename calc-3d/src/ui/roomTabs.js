// =============================================================================
// ui/roomTabs.js — плавающие табы комнат с per-room звёздами.
// DOM создаётся динамически, стили инлайнятся — index.html не трогаем.
// =============================================================================

import { ROOM_LABELS } from '../level/bsp.js';

/**
 * Панель переключения комнат.
 * @param {{rooms: object[], onSelect: (id: string)=>void}} deps
 * @returns {{setScores: (perRoom: object[])=>void, setActive: (id: string)=>void, hide: ()=>void}}
 */
export function createRoomTabs({ rooms, onSelect }) {
    const root = document.createElement('div');
    root.id = 'room-tabs';
    Object.assign(root.style, {
        position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '8px', zIndex: '550', padding: '6px 8px',
        background: 'rgba(30, 38, 48, 0.88)', borderRadius: '12px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)', fontFamily: 'system-ui, sans-serif'
    });
    document.body.appendChild(root);

    const buttons = new Map();

    for (const r of rooms) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.room = r.id;
        Object.assign(btn.style, {
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9px',
            padding: '6px 12px', cursor: 'pointer', color: '#e0e8f0',
            background: 'transparent', fontSize: '13px', lineHeight: '1.2',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
        });
        const label = document.createElement('b');
        label.textContent = ROOM_LABELS[r.type] || r.type;
        const stars = document.createElement('small');
        stars.textContent = '—';
        stars.style.color = '#f2c94c';
        btn.appendChild(label);
        btn.appendChild(stars);
        btn.addEventListener('click', () => onSelect(r.id));
        root.appendChild(btn);
        buttons.set(r.id, { btn, stars });
    }

    function setActive(id) {
        for (const [rid, entry] of buttons) {
            entry.btn.style.background = rid === id ? 'rgba(80, 180, 140, 0.35)' : 'transparent';
            entry.btn.style.borderColor = rid === id ? '#50b48c' : 'rgba(255,255,255,0.15)';
        }
    }

    return {
        setActive,
        setScores(perRoom) {
            if (!Array.isArray(perRoom)) return;
            for (const pr of perRoom) {
                const entry = buttons.get(pr.roomId);
                if (!entry) continue;
                entry.stars.textContent = pr.empty ? '—' : '★'.repeat(Math.max(1, pr.stars));
            }
        },
        hide() { root.style.display = 'none'; }
    };
}