# PROD-004 — Campaign progression and persisted level completion

**Статус:** Implemented  
**Дата:** 14 августа 2026 г.  
**Срез:** Domain → Application → Infrastructure → Presentation → Composition root

## Пользовательский результат

Авторские уровни теперь образуют последовательную кампанию. Новый профиль начинает с доступного `level-001`; выполнение уровня на его authored target открывает следующий уровень. Экран выбора показывает недоступные задания в disabled-состоянии, объясняет prerequisite и выводит лучший сохранённый результат в звёздах. После успешной оценки completion сохраняется в local player profile и доступен при следующем запуске.

> **Правило:** Presentation передаёт факты оценки в Application. Решение о том, является ли попытка completion, и сохранение progress принадлежат application/domain contract, а не UI.

## Контракты

| Контракт | Ответственность |
|---|---|
| `PlayerProfile` schema v2 | Хранит immutable `progress.completedLevels[levelId]` с `bestStars` и `completedAt`; сохраняет максимум звёзд. |
| Repository migration `v0 → v1 → v2` | Восстанавливает legacy local data в schema-versioned profile без browser API в Domain. |
| `LevelSummary.prerequisiteLevelId` | Декларирует граф campaign в authored manifest. |
| `ProgressionPolicy` | Чисто и детерминированно вычисляет `isUnlocked`, prerequisite и best-stars по catalog + profile. |
| `GetCampaignLevelsUseCase` | Соединяет authored listing с Domain policy и возвращает availability DTO. |
| `RecordLevelCompletionUseCase` | Сравнивает полученные stars с authored `targetScore`, применяет `recordLevelCompletion()` и сохраняет profile. |
| `initializeLevelSelectForApp` | Запрашивает campaign для переданного profile и возобновляет только unlocked session. |
| `LevelSelectView` | Отображает availability data; не рассчитывает unlock или score. |

## Authoring model

Prerequisite является частью versioned authored manifest. Текущая campaign намеренно линейна и полностью описана данными:

```json
[
  { "id": "level-001", "prerequisiteLevelId": null },
  { "id": "level-002", "prerequisiteLevelId": "level-001" },
  { "id": "level-003", "prerequisiteLevelId": "level-002" }
]
```

`ProgressionPolicy` не зависит от порядка JSON, storage или Presentation. Для каждого level она использует completion prerequisite: уровень доступен, если prerequisite отсутствует либо его `bestStars` не ниже authored `targetScore` prerequisite. Availability DTO переносит вычисленный `bestStars`, поэтому View отображает progress без обращения к profile или повторного применения policy.

## Runtime flow

| Этап | Поток данных | Граница ответственности |
|---|---|---|
| Bootstrap | `PlayerProfile` → `GetCampaignLevelsUseCase` → selector | Application рассчитывает campaign availability. |
| Resume | saved `lastSession` → unlocked campaign item | Bootstrap выбирает только уже вычисленный unlocked item. |
| Evaluation | `EvaluateRoomUseCase` → `{ stars }` → `RecordLevelCompletionUseCase` | Controller передаёт authored facts; Application принимает completion decision. |
| Persistence | updated `PlayerProfile` → `SavePlayerProfileUseCase` → local repository | Infrastructure сохраняет domain object без progression rules. |
| Re-render | availability DTO → `LevelSelectView` | View показывает stars/locked state и не изменяет progress. |

Если progress persistence неуспешен, результат оценки остаётся видимым игроку; controller сообщает, что прогресс не сохранён. Это не делает итоговую оценку зависимой от local storage availability.

## TDD evidence

| Фаза | Красный тест | Зелёная реализация |
|---|---|---|
| Domain | `PlayerProfileProgression.test.js`, `ProgressionPolicy.test.js` | Profile v2 completion state и чистая prerequisite policy. |
| Application | `GetCampaignLevelsUseCase.test.js`, `RecordLevelCompletionUseCase.test.js` | Availability DTO и completion persistence workflow. |
| Infrastructure/content | `BrowserLocalPlayerProfileRepository.test.js`, `MvpContent.test.js` | v0/v1 migration и authored prerequisite chain. |
| Presentation | `LevelSelectProgression.test.js`, `initializeLevelSelectForApp.test.js`, `GameControllerCompletion.test.js` | Locked selector, safe resume и delegation evaluation facts. |
| Composition root | `ProgressionWiring.test.js` | Policy/use cases инъецированы в runtime bootstrap. |

## Acceptance criteria

- `progress.completedLevels` является schema-versioned persisted contract и не допускает mutable/invalid completion data.
- Закрытый уровень невозможно выбрать через selector или восстановить как session fallback.
- Лучший результат не уменьшается при повторных completion.
- Completion policy не дублируется в View или controller.
- Содержимое manifest определяет prerequisites, а infrastructure не содержит unlock rules.
- Runtime создаёт `ProgressionPolicy`, campaign use case и completion use case в одном composition root.

## Не входит

Ветка prerequisite graph, optional objectives, economy, rewards, cloud sync, account merge, server-side anti-cheat, live ops telemetry и UI-анимации unlock остаются самостоятельными future slices. Текущая модель намеренно не интерпретирует completion timestamp как ordering rule и не вводит скрытую зависимость от сетевого времени.
