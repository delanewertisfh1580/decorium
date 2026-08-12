# Changelog

Все изменения в Decorium документируются здесь.

## [Unreleased]

### MVP alignment

- Исправлен единый runtime entrypoint: `index.html` импортирует `src/main.js`.
- Собран рабочий Three.js room flow с каталогом, placement/move/rotate/remove и evaluation UI.
- Контент выровнен на V2: 16 признаков, level-001, 16 доступных предметов, Scandinavian constraints, feedback и scoring JSON.
- Добавлены procedural Three.js builders, drag/drop, ghost-preview и базовые interaction-анимации.
- Пороги звёзд зафиксированы на 0.86 / 0.71 / 0.56 / 0.40.
- Use cases, repositories, DTO и Domain rules согласованы между собой.
- Удалён неиспользуемый legacy `src/config.js` от отдельного storage-box прототипа.
- README, MVP-документы и ADR обновлены под фактический код.
- Свободное overlap/stacking-размещение, уникальные instance IDs и позиция X/Y/Z исправляют замену предметов и блокирующее collision-поведение.
- Проверки: 134 теста проходят; production build проходит.
- Добавлен data-driven presentation contract `data/visuals/item-visuals.json`; круглый журнальный столик теперь строится круглой процедурной моделью.
- Добавлен `SceneLifeSystem` с animated TV, локальными световыми акцентами, пылинками, бродящим питомцем и визуальными подсказками проходов.
- Исправлена идентификация экземпляра предмета во всех дочерних mesh-частях, поэтому `R`/кнопка поворота применяются к выбранному объекту, включая повторно добавленные экземпляры.

## Текущие post-MVP кандидаты

- Browser smoke/performance hardening.
- Ergonomics scoring.
- Persistence and additional content.
- Progression, social features and optional external services.
