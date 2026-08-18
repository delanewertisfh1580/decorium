# DOC-HOTFIX-003 — Project truth consolidation

**Статус:** Completed
**Дата:** 18 августа 2026 г.

## Проблема

Public root `README.md` описывал уже superseded baseline: catalog V3, style/ergonomics aggregate `70% / 30%` и `ClientBrief` как future foundation. Active runtime, напротив, использует V4 item catalog, `ClientBrief v2` и deterministic three-channel score `0.5 / 0.2 / 0.3`. `CHANGELOG.md` одновременно утверждал, что root README уже актуален. Это создавало competing project truths для разработчика и content author.[1] [2]

## Поставка

| Артефакт | Изменение |
|---|---|
| Root `README.md` | Rewritten as concise active entry point: current product loop, V4/V2 contracts, exact three-channel formula, semantic catalog result, real floor-placement limit, verified commands and canonical links. |
| `CHANGELOG.md` | `Unreleased` records shipped ClientBrief V2, three-channel scoring/Explanation V2 and catalog V4 without rewriting dated `1.0.0` history. |
| `data/README.md` | New lifecycle guide distinguishes active runtime data from retained historical versions and defines safe version-bump/retirement workflow. |
| Documentation guard | New red→green public-state contract prevents V3, `70% / 30%` and future-tense ClientBrief claims from returning to root README. |

## Explicit non-goals

1. Historical ADR and slice reports were not rewritten: they preserve decisions and verified evidence at their own dates.
2. No content version was deleted, moved or silently promoted; lifecycle guide makes the active runtime manifest explicit.
3. No Domain, Application, Infrastructure or Presentation runtime behavior changed.
4. No ADR was added because ownership and architecture decisions remain unchanged.

## Verification

| Gate | Evidence |
|---|---|
| TDD | `tests/guards/documentation.test.js` initially failed on missing V2/V4 public truth; passed after documentation changes. |
| Navigation | Local Markdown link guard covers root README plus `docs/**`. |
| Build/release | Standard full test, build, audit and whitespace gates run before publication. |

## References

[1]: ../../README.md "Active public entry point"
[2]: ../../src/Infrastructure/DataLoaders/staticDataAssets.js "Active runtime data authority"
[3]: ../../data/README.md "Data lifecycle guide"
[4]: ../README.md "Documentation hub"
