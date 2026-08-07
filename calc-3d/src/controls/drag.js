// =============================================================================
// controls/drag.js — управление: перетаскивание, hover, выбор, удаление.
// Фаза 3: DragControls (плоскость камеры → «ватность») заменён на собственный
// raycast-drag по плоскости пола Y=0: предмет следует за курсором 1:1.
// Публичный контракт сохранён: initControls({camera, domElement, orbit,
// manager, onSelect}); hover/drag-подсветка через setEmissive из factory.
// =============================================================================

import * as THREE from 'three';
import { setEmissive } from '../items/factory.js';

const CLICK_THRESHOLD_SQ = 25; // 5px — граница «клик vs перетаскивание»

/**
 * Инициализирует управление сценой.
 * @param {object} deps
 * @param {THREE.Camera} deps.camera
 * @param {HTMLElement} deps.domElement
 * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} deps.orbit
 * @param {object} deps.manager
 * @param {(id: number|null)=>void} [deps.onSelect]
 */
export function initControls({ camera, domElement, orbit, manager, onSelect }) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y=0
    const hitPoint = new THREE.Vector3();

    let hoveredId = null;
    let draggingId = null;
    let downX = 0, downY = 0;
    let moved = false;

    function setPointer(event) {
        const rect = domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /** id предмета под курсором или null */
    function pickItem(event) {
        setPointer(event);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(manager.getMeshes(), false);
        return hits.length > 0 ? hits[0].object.userData.id : null;
    }

    /** Точка пересечения луча с плоскостью пола (для drag). */
    function pickFloor(event) {
        setPointer(event);
        raycaster.setFromCamera(pointer, camera);
        return raycaster.ray.intersectPlane(floorPlane, hitPoint) ? hitPoint : null;
    }

    function setHover(id) {
        if (id === hoveredId) return;
        if (hoveredId !== null) {
            const prev = manager.getMeshById(hoveredId);
            if (prev) setEmissive(prev, 0);
        }
        hoveredId = id;
        if (id !== null && id !== draggingId) {
            const mesh = manager.getMeshById(id);
            if (mesh) setEmissive(mesh, 0.35);
        }
        domElement.style.cursor = id !== null ? 'grab' : 'default';
    }

    // --- Наведение (когда не тащим) ---
    domElement.addEventListener('pointermove', (event) => {
        if (draggingId !== null) {
            const p = pickFloor(event);
            if (p) manager.dragItem(draggingId, p.x, p.z);
            return;
        }
        if (event.buttons !== 0) return; // вращение камеры — не hover
        setHover(pickItem(event));
    });

    // --- Начало: хватаем предмет, если попали ---
    domElement.addEventListener('pointerdown', (event) => {
        downX = event.clientX;
        downY = event.clientY;
        moved = false;

        const id = pickItem(event);
        if (id === null) return;

        draggingId = id;
        orbit.enabled = false;
        manager.startDrag(id);
        const mesh = manager.getMeshById(id);
        if (mesh) setEmissive(mesh, 0.5);
        domElement.style.cursor = 'grabbing';
        document.body.classList.add('dragging');
        domElement.setPointerCapture(event.pointerId);
    });

    // --- Конец: drag или клик ---
    domElement.addEventListener('pointerup', (event) => {
        const dx = event.clientX - downX;
        const dy = event.clientY - downY;
        moved = dx * dx + dy * dy > CLICK_THRESHOLD_SQ;

        if (draggingId !== null) {
            const id = draggingId;
            draggingId = null;
            orbit.enabled = true;
            manager.endDrag(id);
            const mesh = manager.getMeshById(id);
            if (mesh) setEmissive(mesh, hoveredId === id ? 0.35 : 0);
            domElement.style.cursor = hoveredId !== null ? 'grab' : 'default';
            document.body.classList.remove('dragging');

            // Клик без сдвига — выбор предмета (открытие панели размеров)
            if (!moved && onSelect) onSelect(id);
            return;
        }

        // Клик в пустоту — снять выделение/панели
        if (!moved && onSelect) onSelect(null);
    });

    // --- Отмена (Esc / потеря фокуса) — мягко завершаем drag ---
    domElement.addEventListener('pointercancel', () => {
        if (draggingId !== null) {
            manager.endDrag(draggingId);
            draggingId = null;
            orbit.enabled = true;
            document.body.classList.remove('dragging');
        }
    });

    // --- Удаление двойным кликом ---
    domElement.addEventListener('dblclick', (event) => {
        const id = pickItem(event);
        if (id === null) return;
        manager.removeItem(id);
        setHover(null);
        if (onSelect) onSelect(null);
    });

    return {
        /** Текущий id под курсором (для отладки/UI). */
        getHoveredId: () => hoveredId,
        isDragging: () => draggingId !== null
    };
}