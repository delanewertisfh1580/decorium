# Changelog

Все изменения в Decorium документируются здесь.

## [Unreleased]

### MVP alignment

- Добавлен UI-VIS-001 Calm HUD: scene-first компоновка, компактный summary, горизонтальный inventory-dock, нижний action-dock, safe-area и reduced-motion адаптация.
- UI-VIS-002 убирает постоянные кнопки предмета из нижнего dock и переносит их в раскрываемый блок room summary справа сверху; contextual action popups сохранены.
- UI-VIS-004 сжимает HUD до scene-first состояния: каталог и рейтинг свернуты по умолчанию, дополнительные действия и справка скрыты под спойлерами, а status hints появляются только в контексте действия.
- UI-ROOM-002 добавляет процедурную living location: фасад, тротуар, дорогу, уличные маршруты людей/машин/животного и бытовые детали с отдыхающим котом в квартире.
- UI-ROOM-003 исправляет архитектуру комнаты: задняя стена получила оконный проём с прозрачным стеклом, а на левой стене появилась дверь с рамой и ручкой.
- UI-ROOM-004 разносит встроенные TV/bookshelf/mirror и добавляет presentation-only перемещение ambient fixtures и hit areas для тонких каталоговых предметов.
- UI-VIS-003 перерабатывает процедурные предметные визуалы: rich-detail builders, vase/clock profiles, selection halo и выразительный valid/invalid ghost feedback.
- UI-ROOM-005 перерабатывает живые анимации: gait рук/ног людей, четыре ноги и хвост животного, frame-rate independent колёса, TV content bars/scanlines/glow и единый deterministic animation contract.
- UI-ROOM-006 исправляет качество animation pass: естественный темп, видимые руки с кистями, разнообразный TV content layer и спокойный матовый пол без debug grid.
- A-007 добавляет data-driven composition completeness: одна мебель не может получить 5★, а причины незавершённости и успеха приходят из feedback JSON через Evaluation UI.
- INFRA-001 исправляет static hosting: Vite теперь публикует runtime JSON в `dist/data/`, поэтому Render Static Site не получает 404 при bootstrap.

- Исправлен единый runtime entrypoint: `index.html` импортирует `src/main.js`.
- Собран рабочий Three.js room flow с каталогом, placement/move/rotate/remove и evaluation UI.
- Контент выровнен на V2: 16 признаков, level-001, 16 доступных предметов, Scandinavian constraints, feedback и scoring JSON.
- Добавлены procedural Three.js builders, drag/drop, ghost-preview и базовые interaction-анимации.
- Пороги звёзд зафиксированы на 0.86 / 0.71 / 0.56 / 0.40.
- Use cases, repositories, DTO и Domain rules согласованы между собой.
- Удалён неиспользуемый legacy `src/config.js` от отдельного storage-box прототипа.
- README, MVP-документы и ADR обновлены под фактический код.
- Свободное overlap/stacking-размещение, уникальные instance IDs и позиция X/Y/Z исправляют замену предметов и блокирующее collision-поведение.
- Проверки: полный test suite и production build проходят.
- Добавлен data-driven presentation contract `data/visuals/item-visuals.json`; круглый журнальный столик теперь строится круглой процедурной моделью.
- Добавлен `SceneLifeSystem` с animated TV, локальными световыми акцентами, пылинками и бродящим питомцем; scene-side плашка «СВОБОДНЫЙ ПРОХОД» удалена, чтобы пояснения исходили из evaluation UI.
- Исправлена идентификация экземпляра предмета во всех дочерних mesh-частях, поэтому `R`/кнопка поворота применяются к выбранному объекту, включая повторно добавленные экземпляры.

## Текущие post-MVP кандидаты

- Browser smoke/performance hardening.
- Ergonomics scoring.
- Persistence and additional content.
- Progression, social features and optional external services.
