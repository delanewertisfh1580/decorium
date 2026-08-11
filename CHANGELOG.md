# Changelog

Все изменения в проекте Decorium документируются в этом файле.

Формат дат: ГГГГ-ММ-ДД.

## [Не выпущено]

### S-F4 — Документация (2025-01-XX)
- **Добавлено**:
  - `docs/decomposition.md` — полная декомпозиция проекта на системы и подсистемы (разделы 1–9)
  - `CHANGELOG.md` — история изменений проекта
- **Исправлено**:
  - Тесты `tests/guards/documentation.test.js` теперь проходят успешно
- **Соответствие DoD**:
  - ✅ Все файлы записаны на диск
  - ✅ Тесты green
  - ✅ Коммит создан и запушен

---

## [v1.0-mvp] — 2025-01-XX

### S2 — Item Catalog v2 (2025-01-XX)
- **Добавлено**:
  - `src/Domain/Items/FeatureVector.js` — класс FeatureVector с 16 полями
  - `data/items/` — миграция каталога предметов (≥30 предметов)
  - `data/schemas/item.v2.json` — схема валидации предметов
  - `src/Infrastructure/Catalog/CatalogValidator.js` — валидатор каталога
- **Изменено**:
  - `src/Domain/Items/Item.js` — обновлена структура (dimensions вместо metadata)
  - Тесты обновлены для соответствия новой структуре
- **Соответствие DoD**:
  - ✅ FeatureVector = 16 полей
  - ✅ Item + dimensions{x,z} + price
  - ✅ CatalogValidator реализован
  - ✅ Миграция данных выполнена

### S1 — Project Structure (2025-01-XX)
- **Добавлено**:
  - Базовая структура проекта (src/, tests/, data/, docs/)
  - Настройка Vite, Vitest, ESLint
  - Initial commit структуры репозитория

### S0 — Initial Setup (2025-01-XX)
- **Добавлено**:
  - Инициализация Git репозитория
  - Базовый package.json
  - .gitignore

---

## Примечания

- Версии форматируются по SemVer: MAJOR.MINOR.PATCH
- MVP версия: v1.0-mvp
- Текущая фаза разработки: Фаза 2 (слайсы S2–S14)
