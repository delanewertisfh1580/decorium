# Главное меню, кампании и бесконечные заказы

## Цель

Навигация игры разделяет два строго разных типа сессий. **Кампания** состоит из authored уровней, сохраняет проект комнаты по профилю и уровню, выдаёт progression rewards и открывает следующие задания. **Бесконечный заказ** создаётся детерминированно по seed из authored blueprint, использует тот же каталог, renderer и evaluation pipeline, но не записывает campaign completion и не может выдавать campaign rewards.

> Генерация не создаёт скрытые scene props. Базовый интерьер бесконечного заказа составляется только из catalog instances и player-owned surface slots.

| Понятие | Кампания | Бесконечный заказ |
| --- | --- | --- |
| Идентичность | Authored `levelId` | `endless-{seed}` run ID |
| Источник задания | V2 level JSON + V3 client brief + interior recipe | V1 endless blueprint + seed |
| Сохранение дизайна | Durable по `profileId + levelId` | Только активная memory session |
| Reset | Authored recipe baseline | Seed-deterministic generated baseline |
| Completion | Сохраняет best stars, unlocks, reward grants | Публикует run result и endless statistics; не меняет campaign unlock graph |
| Visual ownership | Catalog items and surface slots | Catalog items and surface slots |

## Navigation states

`MainMenuCoordinator` является presentation-only state machine. Он не загружает repositories и не применяет progression policy самостоятельно.

| State | Доступные действия | Результат |
| --- | --- | --- |
| `home` | Продолжить, Кампания, Бесконечный заказ | Переключает menu screen либо запускает application command |
| `campaign` | Выбор authored уровня, Назад | Запрашивает campaign summaries и запускает выбранный unlocked level |
| `endless` | Новый заказ, тот же seed, Назад | Запускает generated run command; при retry повторно materializes тот же seed |
| `playing` | Открыть меню, сменить режим | HUD активен; текущая room session сохраняет mode metadata |

`Продолжить` доступно только для последней authored campaign сессии, остающейся unlocked. Это предотвращает попытку восстановить ephemeral endless run после перезапуска браузера.

## Generation boundary

`GenerateEndlessLevelUseCase` — application entry point. Он принимает `{ seed, profile }`, получает unlock-aware catalog items, style constraint profiles, presentation environment and surface finishes, затем вызывает pure `EndlessLevelGenerator` domain service. Generator:

1. Выбирает blueprint и room dimensions с seeded PRNG.
2. Выбирает только base variants и surface finishes, уже доступные текущему profile.
3. Собирает solvable required-affordance item pool до materialization.
4. Создаёт typed V3 `ClientBrief`, `EvaluationSpec`, `InteriorGenerationRecipe` и V2 `RoomState` baseline.
5. Возвращает `LevelDTO` с `mode: 'endless'`, run metadata и generated baseline.

Неудача хотя бы одного validation step возвращается typed failure. Никакой UI code не генерирует scoring rules, unlocks или room state.

## Session and persistence

`StartEndlessSessionUseCase` сохраняет generated `RoomState` в runtime repository и регистрирует immutable **ephemeral baseline**. `ScopedRoomRepository` получает отдельный `registerEphemeral(roomId, baseline)` API; он обеспечивает reset, но не добавляет persistence scope и поэтому никогда не вызывает `BrowserLocalRoomDesignRepository`.

`EvaluationCoordinator` получает `sessionMode` из loaded `LevelDTO`. Для `campaign` он сохраняет completion по существующему use case. Для `endless` он вызывает отдельный `RecordEndlessRunUseCase`, который сохраняет только bounded aggregated stats в profile. Campaign level completion, reward IDs и unlock inventory не изменяются.

## Generated content safety

Blueprints являются versioned static data. Каждый blueprint должен задавать supported style target, required affordances, room-size range, composition policy и optional functional scenario. Static validation сопоставляет every affordance-derived `composition-missing-${affordance}` message key с authored feedback catalog, так что generated violation нельзя вывести без remediation.

The game must retain deterministic replay: identical seed, blueprint catalog version, unlocked base content and scoring policy create the same level metadata and baseline room state.
