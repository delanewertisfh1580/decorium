# PROD-001 — Versioned local player profile

**Статус:** Implemented  
**Дата:** 14 августа 2026 г.  
**Срез:** Domain → Application → Infrastructure → Presentation

## Пользовательский результат

При первом запуске Decorium создаёт локальный профиль. При последующих запусках этот профиль восстанавливается, а в интерфейсе отображается спокойный доступный статус. Повреждённые или поддерживаемые legacy-данные не попадают в Domain: они восстанавливаются безопасно либо мигрируют в актуальный контракт.

## Контракт

`PlayerProfile v1` — неизменяемый доменный объект:

```text
{
  schemaVersion: 1,
  profileId: string,
  createdAt: ISO-8601 string,
  updatedAt: ISO-8601 string,
  displayName: string | null,
  settings: { reducedMotion: boolean },
  lastSession: { levelId: string | null }
}
```

Domain принимает ID и timestamp как значения; он не зависит от `Date`, `crypto`, `localStorage`, DOM или Three.js. `BrowserPlayerProfileFactory` создаёт эти значения только на Infrastructure boundary. `BrowserLocalPlayerProfileRepository` отвечает за browser storage, JSON serialization, schema migration и corruption recovery.

## Сквозной путь

```text
window.localStorage
  → BrowserLocalPlayerProfileRepository
  → LoadPlayerProfileUseCase
  → loadPlayerProfileForApp
  → ProfileStatusView + #app[data-reduced-motion]
```

`schemaVersion: 0` мигрирует в v1 из полей `reducedMotion` и `lastLevelId`. Любой невалидный JSON, неподдерживаемая версия или нарушение `PlayerProfile` приводит к удалению повреждённой записи и статусу `recovered`; bootstrap затем создаёт новый валидный профиль.

## TDD evidence

| Фаза | Красный тест | Зелёная реализация |
|---|---|---|
| Domain | `tests/Domain/Profile/PlayerProfile.test.js` | `src/Domain/Profile/PlayerProfile.js` |
| Application | `tests/Application/UseCases/LoadPlayerProfileUseCase.test.js` | `src/Application/UseCases/LoadPlayerProfileUseCase.js` |
| Infrastructure | `tests/Infrastructure/BrowserLocalPlayerProfileRepository.test.js`, `BrowserPlayerProfileFactory.test.js` | Browser storage repository, v0→v1 migration, browser factory |
| Presentation | `tests/Presentation/ProfileStatusView.test.js`, `loadPlayerProfileForApp.test.js`, `PlayerProfileBootstrapWiring.test.js` | Status view, bootstrap integration, accessible shell container |

## Acceptance criteria

- Отсутствующий profile создаётся и сохраняется как v1.
- Валидный profile восстанавливается без перезаписи.
- Поддерживаемый v0 profile мигрирует и перезаписывается в v1.
- Повреждённые или contract-invalid данные удаляются, а игра продолжает bootstrap с новым profile.
- Профильный статус доступен через `aria-live="polite"` и не раскрывает `profileId`.
- Сохранённая настройка `reducedMotion` применяется к корню приложения.
- Guard `no-nondeterminism` продолжает запрещать browser/time API в Domain и Application.
- Browser smoke test зафиксирован в `docs/production/verification/PROD-001-browser-smoke.md`.

## Явно не входит

Cloud sync, accounts, identity provider, PII, session resume, level selection, progression, transaction history и удалённая telemetry не являются частью этого слайса. `lastSession.levelId` зарезервирован в стабильном v1-контракте и будет использоваться в PROD-002.
