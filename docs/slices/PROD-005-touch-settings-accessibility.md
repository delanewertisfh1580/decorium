# PROD-005 — Touch interaction, player settings and accessibility

**Статус:** Implemented  
**Дата:** 14 августа 2026 г.  
**Срез:** Domain → Application → Infrastructure → Presentation → runtime renderer

## Пользовательский результат

Игрок может настроить игру без keyboard-only пути: включить reduced motion, выбрать крупный масштаб интерфейса и режим производительности. Настройки сохраняются в локальном profile и немедленно применяются к HUD и 3D renderer. На touch-устройстве действия поднятия/опускания выбранного предмета и возврата камеры доступны обычными кнопками; pointer input принимает primary touch независимо от mouse-specific значения `button`.

> **Правило:** View формирует только plain settings request. Validation, versioning и persistence принадлежат Domain/Application; применённым runtime state становится только profile, возвращённый persistence workflow.

## Versioned contracts

| Контракт | Ответственность |
|---|---|
| `PlayerSettings` | Immutable Domain value object: `reducedMotion`, `uiScale`, `qualityTier`. |
| `PlayerProfile v3` | Содержит полный serializable `settings` object и сохраняет предыдущий campaign progress. |
| Repository migration `v0 → v1 → v2 → v3` | Дополняет legacy profiles стандартными `uiScale`/`qualityTier`, не теряя last session или completion facts. |
| `UpdatePlayerSettingsUseCase` | Merges request с текущими settings, валидирует через Domain и сохраняет новый profile. |
| `INPUT_INTENT_VERSION = 2` | Единый vocabulary keyboard и touch-toolbar actions. |
| `rendererSettingsFor(qualityTier)` | Детерминированно адаптирует pixel-ratio cap и shadows для Three.js adapter. |

## Settings model

```json
{
  "reducedMotion": false,
  "uiScale": "standard",
  "qualityTier": "balanced"
}
```

`uiScale` принимает `standard` или `large`; крупный режим повышает touch minimum до 52 px через CSS variable override. `qualityTier` принимает `balanced` или `performance`. Balanced сохраняет cap `2` и shadows; performance использует cap `1` и отключает shadows. Значения являются profile preferences, а не входами score/progression/economy.

## Runtime flow

| Этап | Поток | Граница |
|---|---|---|
| Startup | restored `PlayerProfile v3` → settings bootstrap | Presentation применяет datasets и вызывает controller adapter. |
| Player action | native form → `UpdatePlayerSettingsUseCase` | UI не валидирует и не пишет в storage. |
| Persistence | updated profile → `SavePlayerProfileUseCase` → local repository | Infrastructure сериализует Domain profile. |
| Render | `GameController.setPlayerSettings()` → `RoomView.setRenderSettings()` | Renderer получает quality/reduced-motion adapter values. |
| Session selection | current controller profile → `withLastSession()` | Новые settings не теряются при subsequent level selection. |

## Touch and keyboard parity

| Возможность | Keyboard path | Touch/UI path |
|---|---|---|
| Повернуть предмет | `R` / `Q` | Контекстная кнопка «Повернуть». |
| Поднять/опустить предмет | `PageUp` / `PageDown` | Контекстные кнопки «Поднять» / «Опустить». |
| Вернуть камеру | `Home` | Overflow-кнопка «Вернуть камеру». |
| Отмена и удаление | `Esc` / `Delete` | Existing contextual controls. |
| Размещение/перемещение | Pointer interaction | Primary touch accepted explicitly. |

Все toolbar actions dispatch уже существующие `InputIntent`; game rules не дублируются в View. `isPrimaryInteractionPointer()` отделяет touch semantics от mouse button semantics, поэтому touch pointer без mouse button сохраняет gameplay path.

## TDD evidence

| Фаза | Красный тест | Зелёная реализация |
|---|---|---|
| Domain | `PlayerSettings.test.js`, `PlayerProfileSettings.test.js` | Immutable settings и schema v3 profile. |
| Application | `UpdatePlayerSettingsUseCase.test.js` | Validation, merge и profile persistence workflow. |
| Infrastructure | `BrowserLocalPlayerProfileSettingsMigration.test.js` | Safe v2 → v3 migration and persistence. |
| Presentation | `PlayerSettingsView.test.js`, `initializePlayerSettingsForApp.test.js` | Semantic controls, persisted request и runtime datasets. |
| Input/runtime | `PointerInput.test.js`, `InputIntentVersion.test.js`, `ToolbarTouchActions.test.js`, `RoomRenderSettings.test.js` | Touch semantics, action parity и renderer adapter. |
| Regression | `initializeLevelSelectForApp.test.js` | Session save preserves newest controller profile settings. |

## Acceptance criteria

- Profile settings имеют schema version через `PlayerProfile v3`; v0/v1/v2 data мигрирует к v3.
- Невалидные settings отклоняются до persistence и не изменяют текущий profile.
- Уменьшение motion делает RoomView animations immediate, а renderer quality tier меняет только adapter configuration.
- Touch и keyboard используют общий InputIntent vocabulary для elevation и camera reset actions.
- Critical keyboard-only actions имеют semantic, 44px-minimum touch controls.
- Выбор уровня после изменения settings сохраняет актуальный controller profile, а не устаревший bootstrap snapshot.

## Не входит

Custom key remapping, screen-reader spatial narration, haptic feedback, gesture tutorials, adaptive auto-quality profiling, device GPU benchmark и platform-native accessibility adapters остаются самостоятельными future slices. Settings не являются account/cloud data и не влияют на score, completion или unlocked campaign state.
