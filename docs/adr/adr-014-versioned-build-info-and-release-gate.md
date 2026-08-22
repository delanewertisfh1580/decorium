# ADR-014 — Versioned BuildInfo and retained CI release artifacts

**Статус:** Accepted  
**Дата:** 14 августа 2026 г.

## Контекст

До PROD-006 web bundle не содержал authoritative runtime identity. Support не мог однозначно сопоставить пользовательский screenshot или runtime error с source revision. Локальные quality gates существовали, но не были versioned CI policy и не оставляли проверенный rollback artifact.

Release metadata не должна становиться gameplay dependency: timestamp, revision и channel не могут влиять на score, progression или deterministic room evaluation. Также release diagnostics не должны собирать игрока, profile, device fingerprint или gameplay events.

## Решение

Вводится `BuildInfo v1` как immutable operational release value в `src/Operations/Release`. Генератор создаёт `release-manifest.json` до Vite bundle из package version, Git SHA, channel и timestamp. Environment overrides позволяют CI зафиксировать release inputs детерминированно; manifest валидируется operational contract как при runtime load, так и перед сохранением CI artifact.

Runtime manifest загружается через Infrastructure repository и Application use case. Presentation показывает только version, channel и short revision. Ошибка fetch/validation возвращается как controlled unavailable state и не блокирует game bootstrap.

GitHub Actions release gate выполняет locked install, tests, build, artifact manifest validation и production dependency audit для pull request и `master`. Успешный `dist` хранится 14 дней как `decorium-web-release` artifact.

## Последствия

| Область | Последствие |
|---|---|
| Release diagnosis | Любой production bundle сам сообщает source correlation metadata. |
| Rollback | CI хранит exact tested artifact ограниченный retention period. |
| Privacy | Manifest не несёт player или telemetry data. |
| Architecture | Build metadata остаётся outside Domain gameplay decisions; operational release module валидирует contract независимо от game Domain. |
| Resilience | Manifest failure не препятствует launch игры. |

## Альтернативы

1. **Показывать package version непосредственно из Presentation code.** Отклонено: runtime не получает source revision и нет portable artifact contract.
2. **Не генерировать manifest, а полагаться на GitHub UI.** Отклонено: игрок и support не всегда имеют доступ к UI, а downloaded artifact не содержит self-identification.
3. **Сохранять revision в player profile.** Отклонено: build identity не является player state; это создало бы ненужные migration/persistence coupling.
4. **Показывать full SHA и timestamp в HUD.** Отклонено: недостаточно компактно для gameplay UI; full metadata остаётся в manifest artifact.
5. **Публиковать artifact без validation.** Отклонено: rollback asset должен проходить ровно тот content contract, что и runtime metadata.
