# HOTFIX-002 — Campaign unlock refresh after completion

**Дата:** 14 августа 2026 г.

## Cause

`RecordLevelCompletionUseCase` корректно записывал `progress.completedLevels` только когда result достигал authored `targetScore`. Для `level-001` target равен **3 звёздам**. Однако `initializeLevelSelectForApp` запрашивал campaign availability один раз при bootstrap и затем продолжал рендерить этот stale campaign snapshot. После успешного completion `GameController` обновлял profile, но selector не получал updated profile для повторного вызова `GetCampaignLevelsUseCase`.

## Fix

Selector bootstrap получил async `refresh(updatedProfile)` API. Он повторно запрашивает campaign availability, сохраняет active level, повторно рендерит `LevelSelectView` и снимает disabled state у newly unlocked level. `GameController` теперь уведомляет completion profile listener только после успешной persistence с `didComplete: true`; composition root связывает этот listener с selector `refresh`.

## Completion criterion

Размещение предметов само по себе не означает completion. Первый уровень засчитывается при результате не ниже **3★**. Authored composition contract также требует минимум 4 предмета и roles `seating`, `surface`, `lighting`; эргономические правила остаются частью итоговой оценки.

## Regression proof

Автоматический regression test создаёт profile с completion `level-001`, вызывает selector refresh и подтверждает, что `level-002` меняется с `disabled` на unlocked. Controller test подтверждает передачу saved profile в refresh listener только после persisted completion. Full suite, build и production dependency audit прошли после исправления.
