# PROD-006 — Versioned release manifest and CI release gate

**Статус:** Implemented  
**Дата:** 14 августа 2026 г.  
**Срез:** Domain → Application → Infrastructure → Presentation → build → CI

## Пользовательский и операционный результат

Каждая web-сборка получает компактную, versioned release identity. Игрок или support видит версию, release channel и короткую revision непосредственно в HUD, а команда получает тот же manifest в production artifact. Pull request и обновление `master` проходят единый release gate: locked dependency install, полный test suite, build, validation generated manifest, production dependency audit и сохранение готового к rollback `dist` artifact.

> **Правило:** release identity — это metadata build, а не игровой вход. Она не содержит profile, player behavior, room state, score или telemetry data и не может влиять на gameplay outcome.

## BuildInfo v1 contract

```json
{
  "schemaVersion": 1,
  "application": "decorium",
  "releaseVersion": "1.0.0",
  "sourceRevision": "40-character lowercase Git SHA",
  "channel": "web",
  "builtAt": "ISO-8601 timestamp"
}
```

| Поле | Инвариант | Назначение |
|---|---|---|
| `schemaVersion` | Равно `1` | Явная эволюция persisted/build contract. |
| `application` | Равно `decorium` | Защита от ошибочного manifest другого приложения. |
| `releaseVersion` | SemVer | Support-facing version identity. |
| `sourceRevision` | 40-символьный Git SHA | Воспроизводимое сопоставление bundle с source revision. |
| `channel` | `web` или `pwa` | Release target; PWA подготовлен контрактом, но не включён этим слайсом. |
| `builtAt` | ISO timestamp | Build diagnostic, не gameplay time input. |

## Сквозной поток

| Этап | Компонент | Ответственность |
|---|---|---|
| Generation | `scripts/generate-release-manifest.mjs` | Создаёт `public/release-manifest.json` из package version, Git SHA и controlled environment overrides. |
| Domain | `BuildInfo` | Валидирует immutable manifest v1 без browser/runtime dependencies. |
| Infrastructure | `JsonReleaseManifestRepository` | Fetches JSON и превращает только валидные данные в `BuildInfo`. |
| Application | `GetBuildInfoUseCase` | Возвращает controlled `BUILD_INFO_UNAVAILABLE` без leak деталей adapter failure. |
| Presentation | `ReleaseInfoView` + bootstrap | Показывает support-safe `vX · channel · shortSHA`; unavailable manifest не блокирует игру. |
| Build/CI | `npm run build`, `verify-release-artifact.mjs`, release gate | Помещает manifest в `dist`, повторно валидирует его и сохраняет rollback artifact. |

## Release gate

Workflow `.github/workflows/release-gate.yml` запускается для pull requests, `master` updates и ручного trigger. Он использует Node 22, `npm ci`, `npm test`, `npm run build`, artifact manifest validation и `npm audit --omit=dev --audit-level=high`.

После успешной проверки `dist` сохраняется как `decorium-web-release` на 14 дней. Artifact является управляемой точкой rollback: он содержит single-file web bundle и тот же `release-manifest.json`, которым идентифицируется revision.

## TDD evidence

| Boundary | Tests |
|---|---|
| Domain invariant | `BuildInfo.test.js` |
| Application error boundary | `GetBuildInfoUseCase.test.js` |
| JSON adapter | `JsonReleaseManifestRepository.test.js` |
| Deterministic build generation | `GenerateReleaseManifest.test.js` |
| Presentation view/bootstrap | `ReleaseInfoView.test.js`, `initializeReleaseInfoForApp.test.js` |
| Composition root | `ReleaseInfoWiring.test.js` |
| CI policy | `ReleaseCiWorkflow.test.js` |
| Browser acceptance | `docs/history/verification/PROD-006-release-manifest-browser-smoke.md` |

## Scope boundary

Этот completed release slice создаёт trustworthy identity and release guard. Он не добавляет telemetry transport, PWA service worker, browser E2E runner, visual-diff service, automated performance regression harness, error-reporting vendor или deployment provider. Эти элементы остаются следующими независимыми PROD-006 sub-slices и должны использовать `BuildInfo` как public release correlation contract.
