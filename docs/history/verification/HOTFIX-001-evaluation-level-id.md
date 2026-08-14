# HOTFIX-001 — Evaluation completion level identifier

**Дата:** 14 августа 2026 г.

## Incident

`GameController._onEvaluate()` передавал `this.level.id` в `RecordLevelCompletionUseCase`. Runtime level является `LevelDTO`, чьё canonical поле называется `levelId`; `id` отсутствует. При достижении completion path в Domain попадало `undefined`, и `PlayerProfile.recordLevelCompletion()` выбрасывал ошибку о пустом level ID.

## Fix

Controller передаёт `this.level.levelId`. Regression test теперь использует настоящий `LevelDTO` field contract и проверяет обе ветки evaluation completion delegation.

## Browser smoke

На локальной hotfix build была нажата кнопка **«Оценить»** для первого authored level. Evaluation завершилась результатом `0/100`, показала modal feedback и dashboard score, без console exception `PlayerProfile completion levelId must be a non-empty string`.

Высокий-score completion branch подтверждён автоматическим `GameControllerCompletion.test.js`: controller передаёт `levelId: 'level-001'` в `RecordLevelCompletionUseCase`, а use case сохраняет completion через profile repository boundary.

## Повторная публикационная верификация

После публикации `master` повторно проверены remote revision, полный regression suite, production build и audit. В browser runtime первый уровень снова оценён через кнопку **«Оценить»**: dashboard обновился до `0`, открылся result modal `0/100`, а ошибка о пустом `completion levelId` не появилась.
