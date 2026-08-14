# ADR-008 — Versioned local player profile as the offline-first boundary

**Статус:** Accepted  
**Дата:** 14 августа 2026 г.

## Контекст

Production roadmap требует долговременный профиль до появления progression, authored level selection, cloud sync или монетизации. MVP хранил только состояние комнаты в памяти и не имел постоянного пользовательского контракта.

## Решение

Вводится `PlayerProfile v1` как immutable domain value object. Все данные профиля имеют `schemaVersion`. Browser-local storage реализуется только в `BrowserLocalPlayerProfileRepository`; Application использует repository и factory ports; Presentation получает результат use case и отображает его без доступа к storage.

В v1 поддерживается миграция legacy schema version 0. Повреждённые, невалидные или неподдерживаемые данные удаляются, после чего Application создаёт чистый v1-profile. Игровые правила не используют profile timestamps как недетерминированный источник.

## Последствия

- Следующие слайсы могут хранить progress, settings и last session в `PlayerProfile` без связывания с Web Storage.
- Cloud sync позднее должен реализовать тот же repository contract, а не менять Domain/Application.
- Передача profile в runtime не раскрывает internal ID в UI или telemetry.
- Реальные аккаунты и покупки требуют отдельных ADR и серверной authoritative boundary.
- Если browser storage полностью недоступен, этот базовый adapter пока сообщает persistence error; graceful in-memory session fallback является отдельным explicit production improvement, а не скрытой подменой storage.

## Альтернативы

1. **Хранить raw JSON в GameController.** Отклонено: это смешивает UI, persistence и migration.
2. **Добавить account/backend сразу.** Отклонено: увеличивает privacy, security и operational scope до проверки core loop.
3. **Использовать `Date` и `localStorage` в Domain/Application.** Отклонено: нарушает Onion Architecture и существующий nondeterminism guard.
