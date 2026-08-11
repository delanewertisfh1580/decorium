# Changelog

Все изменения в Decorium документируются здесь.

## [Unreleased]

### MVP alignment

- Исправлен единый runtime entrypoint: `index.html` импортирует `src/main.js`.
- Собран рабочий Three.js room flow с каталогом, placement/move/rotate/remove и evaluation UI.
- Контент выровнен на V2: 16 признаков, level-001, Scandinavian constraints, feedback и scoring JSON.
- Пороги звёзд зафиксированы на 0.86 / 0.71 / 0.56 / 0.40.
- Use cases, repositories, DTO и Domain rules согласованы между собой.
- Удалён неиспользуемый legacy `src/config.js` от отдельного storage-box прототипа.
- README, MVP-документы и ADR обновлены под фактический код.
- Проверки: 130 тестов проходят; production build проходит.

## Текущие post-MVP кандидаты

- Browser smoke/performance hardening.
- Ergonomics scoring.
- Persistence and additional content.
- Progression, social features and optional external services.
