# PROD-002 — Authored level selection and resumable session flow

**Статус:** Implemented  
**Дата:** 14 августа 2026 г.  
**Срез:** Domain → Application → Infrastructure → Presentation

## Пользовательский результат

Игрок видит каталог из трёх authored levels, выбирает уровень без перезагрузки страницы, а после перезапуска получает последний доступный уровень. Выбор сохраняется в versioned local profile и не зависит от Presentation state.

## Контракты

| Контракт | Ответственность |
|---|---|
| `LevelSummary` | Неизменяемое Domain-представление уровня для selector: `id`, `name`, `description`, `sortOrder`. |
| `LevelRepository.listLevels()` | Application port для перечисления authored summaries. |
| `data/levels/manifest.json` | Versioned (`schemaVersion: 1`) static catalog authorских уровней. |
| `ListAuthoredLevelsUseCase` | Валидирует summaries, предотвращает duplicate IDs и сортирует по author-defined order. |
| `SavePlayerProfileUseCase` | Сохраняет только `PlayerProfile` domain object через repository port. |
| `initializeLevelSelectForApp` | Восстанавливает доступный last session, загружает level, сохраняет новый выбор и переотрисовывает selector. |

## Сквозной путь

```text
manifest.json → JsonLevelRepository.listLevels()
  → ListAuthoredLevelsUseCase → LevelSummary[]
  → LevelSelectView → GameController.loadLevel()
  → PlayerProfile.withLastSession()
  → SavePlayerProfileUseCase → BrowserLocalPlayerProfileRepository
```

Если `lastSession.levelId` отсутствует в новом manifest, orchestration детерминированно выбирает первый level по sort order. Если manifest не загружен или пуст, bootstrap завершится ясной ошибкой вместо запуска неопределённой сессии.

## Curated content v1

| Порядок | ID | Уровень | Назначение |
|---:|---|---|---|
| 1 | `level-001` | Гостиная: Первые шаги | Вводный loop композиции. |
| 2 | `level-002` | Уютный уголок | Компактная зона отдыха: seating, surface, lighting. |
| 3 | `level-003` | Светлая студия | Большая комната с требованием storage. |

## TDD evidence

| Фаза | Красный тест | Зелёная реализация |
|---|---|---|
| Domain | `tests/Domain/Levels/LevelSummary.test.js` | `src/Domain/Levels/LevelSummary.js` |
| Application | `ListAuthoredLevelsUseCase.test.js`, `SavePlayerProfileUseCase.test.js` | Listing и save use cases |
| Infrastructure | `JsonLevelRepositoryListing.test.js`, `AuthoredLevelManifest.test.js` | Versioned manifest, static asset list, JSON adapter |
| Presentation | `LevelSelectView.test.js`, `initializeLevelSelectForApp.test.js`, `LevelSelectionBootstrapWiring.test.js` | Selector, bootstrap orchestration, HTML/CSS wiring |

## Acceptance criteria

- Manifest содержит три versioned authored-level entries; каждый published JSON входит в static build assets.
- Level selector показывает все authored levels и отмечает active level `aria-current="true"`.
- Выбор уровня загружает новый `RoomState` через существующий `LoadLevelUseCase`/`GameController` path.
- Last selected level сохраняется в `PlayerProfile` и восстанавливается при следующем bootstrap, пока ID существует в manifest.
- Full test suite, build, production dependency audit и browser smoke test проходят.

## Не входит

Main-menu screen, locked content, star history, rewards, progression, client tiers, economy, generated levels и cloud sync остаются предметом PROD-004 и следующих слайсов. В данном слайсе все три authored levels доступны намеренно.
