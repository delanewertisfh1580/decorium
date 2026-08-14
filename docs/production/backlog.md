# Decorium — production backlog и правила вертикальных TDD-слайсов

**Статус:** Active  
**Дата:** 13 августа 2026 г.  
**Назначение:** заменить MVP-порядок работ последовательностью production-слайсов с устойчивыми контрактами.

## Рабочее правило

Каждый слайс должен давать игроку или команде один законченный результат и проходить через необходимые слои: **Domain → Application → Infrastructure → Presentation**. Исключение допускается только для явно инфраструктурных release-guards; они не могут подменять продуктовый слайс или блокировать его поставку без причины.

Работа каждого слайса ведётся в следующем порядке:

1. Зафиксировать пользовательский результат, границы и versioned contract.
2. Написать падающие тесты Domain и Application, затем integration/contract test Infrastructure и user-visible acceptance test Presentation.
3. Реализовать минимальный путь, необходимый для прохождения тестов; не добавлять будущие подсистемы «про запас».
4. Запустить полный test suite, build, dependency/security checks и browser smoke test затронутого сценария.
5. Обновить ADR, system documentation, content schemas и release notes в том же изменении.

> Слайс считается завершённым только тогда, когда его публичный контракт документирован, автоматические тесты зелёные, путь наблюдаем игроком или оператором, а последующие слайсы используют контракт без знания деталей реализации.

## Порядок слайсов

| ID | Вертикальный результат | Сквозной контракт | Минимальный Definition of Done |
|---|---|---|---|
| **PROD-001** | Игрок получает устойчивый локальный профиль, который создаётся, валидируется, мигрирует и сохраняется между перезагрузками. | `PlayerProfile v1`, `PlayerProfileRepository`, `LoadPlayerProfile`, `SavePlayerProfile` | Default/malformed/old profile корректно обрабатываются; resume state виден в UI; данные не нарушают Domain. |
| **PROD-002** | Игрок видит главное меню и выбирает authored level; жизненный цикл сессии явно управляется. | `GameSessionState`, `LevelAvailability`, `StartLevel` | Переход menu → level → results → menu воспроизводим и покрыт E2E. |
| **PROD-003** | Игрок получает полную объяснимую оценку style + ergonomics. | `SpatialFacts`, `ErgonomicsViolation`, `EvaluationResult v2` | Golden rooms доказывают проходы, доступ, масштаб и aggregation 0.7/0.3. |
| **PROD-004** | Игрок проходит curated campaign, открывает уровни и видит свой прогресс. | `LevelDefinition v2`, `ProgressionPolicy`, `UnlockResult` | Несколько уровней, unlock rules и reload-safe progress. |
| **PROD-005** | Игрок комфортно играет на touch-устройствах и настраивает интерфейс. | `InputIntent v2`, `PlayerSettings`, `SettingsRepository` | Touch/keyboard paths, reduced motion, UI scale, quality tier и accessibility tests. |
| **PROD-006** | Команда выпускает измеримую и откатываемую web/PWA-версию. | `BuildInfo`, telemetry/crash ports, release manifest | CI, dependency scan, browser E2E, visual/performance budgets, privacy-safe telemetry и runbook. |
| **PROD-007** | В продукт добавляется ограниченная, контролируемая персонализация и content pipeline. | `ContentVersion`, `SeededGenerationRequest`, compiled-artifact validator | Content validation, replayable seed, curated-first workflow; без runtime LLM-score. |
| **PROD-008** | Готов mobile-native release candidate. | Platform adapters, Capacitor packaging boundary | Реальные device acceptance tests, offline behavior, packaging and store-readiness checklist. |

## Первый выполняемый слайс — PROD-001

### Пользовательский результат

При первом запуске игра создаёт профиль игрока. При последующих перезагрузках профиль восстанавливается безопасно. Если сохранение повреждено или относится к поддерживаемой старой версии, игрок не теряет доступ к игре: система восстанавливает валидное состояние и фиксирует диагностическую причину, не позволяя повреждённым данным войти в Domain.

### Границы

`PROD-001` включает базовый профиль, schema version, миграционный конвейер, browser-local persistence adapter, application use cases, bootstrap integration и компактный UI-индикатор состояния профиля. Слайс **не** включает аккаунты, cloud sync, прогрессию, валюты, уровни, персональные данные или удалённую телеметрию.

### Контракт v1

```text
PlayerProfile {
  schemaVersion: 1,
  profileId: string,
  createdAt: string,
  updatedAt: string,
  displayName: string | null,
  settings: {
    reducedMotion: boolean
  },
  lastSession: {
    levelId: string | null
  }
}
```

Время является данными профиля, а не источником игровой логики. `profileId` генерируется на инфраструктурной границе и передаётся в Domain как значение. Domain не обращается к `localStorage`, `Date`, DOM или генератору случайных чисел.

### TDD-матрица

| Слой | Сначала тест | Затем минимальная реализация |
|---|---|---|
| Domain | `PlayerProfile` создаёт/валидирует v1 и отвергает некорректные состояния. | Value object + invariants. |
| Application | Load создаёт default при отсутствии данных; Save обновляет approved profile. | Use cases через repository port. |
| Infrastructure | localStorage adapter serializes, validates, migrates/recovers without throwing. | Repository + parser/migration boundary. |
| Presentation | bootstrap показывает profile status и применяет `reducedMotion` без хранения логики UI в Domain. | Controller/view integration. |
| Acceptance | reload сохраняет profile ID и выбранный accessibility preference. | Browser smoke/E2E path. |

### Quality gates каждого слайса

`npm test`, `npm run build`, production dependency audit, назначенный contract test и browser smoke test обязательны. До PROD-006 эти gates запускаются локально; в PROD-006 становятся CI workflow и release policy.

## Неподлежащие нарушению архитектурные ограничения

1. UI не вычисляет score, progression или economy.
2. Domain не зависит от Three.js, browser API, JSON, storage, network или runtime LLM.
3. Infrastructure не содержит правил score, progression и unlocks.
4. Любой persisted/content contract содержит schema version и validator.
5. Любое детерминированное игровое решение должно быть воспроизводимым из сохранённых входов.
6. Telemetry и future AI не могут изменять результат оценки или правила игры.
7. Настоящие платежи не добавляются без server-authoritative transaction ledger и receipt validation.

## Отслеживание решений

| Решение | Статус | Влияние на PROD-001 |
|---|---|---|
| Первый release channel — web/PWA | Proposed | Использовать browser-local persistence; не связывать Domain с платформой. |
| Mobile native — Capacitor после device gate | Proposed | Не включать Capacitor в ранний persistence contract. |
| Offline-first без account/cloud в v1 | Accepted for initial slice | Профиль хранится локально и имеет миграцию. |
| AI — offline compiled artifacts, не runtime judge | Accepted | Не входит в профиль v1. |
| Real-money monetization | Deferred | Не входит в profile/economy boundary первого слайса. |

## References

- [Production strategy](../../decorium_production_strategy_2026-08-13.md)
- [Target decomposition](../decomposition.md)
- [MVP architecture baseline](../architecture/overview.md)
