# PROD-023 — Client-priority and multi-style evaluator

**Статус:** Completed
**Дата:** 17 августа 2026 г.
**Связанный ADR:** [ADR-030 — Client-priority and multi-style scoring](../adr/adr-030-client-priority-multi-style-scoring.md)

## Цель

PROD-023 превращает authored требования клиента из частично активных данных в реальные входы production-оценки. Игрок может увидеть, как primary/secondary/accent стили, личные пожелания заказчика и эргономика независимо влияют на итог, а результат объясняет не только правило, но и канал, целевой стиль либо конкретный запрос клиента.[1] [2]

> **Граница слайса:** Presentation получает immutable evaluation result и рендерит supplied score/facts/labels. Она не вычисляет weighted fit, occupancy, density, priority satisfaction, counterfactual recovery, star cap, completion или progression.

## Поставленный пользовательский результат

| Ситуация | Результат для игрока |
|---|---|
| Brief смешивает стили | Result panel показывает отдельные target rows с authored label, role и score для каждого target. |
| Клиент ценит функциональный сценарий | Невыполненный `functional-scenario` priority снижает отдельный канал «Запросы клиента» и показывает authored correction. |
| Клиент предпочитает компактную или открытую комнату | Fixed-grid occupancy supplies reproducible free-area evidence; client priority applies the authored density/empty-space rule. |
| Игрок исправляет одну проблему | Explanation V2 сообщает exact recovery в channel/total score, stars и completion effect, а не приблизительную долю штрафа. |
| Brief/профиль содержит ошибочную ссылку | Loading fails deterministically instead of guessing a similarly named style. |
| Legacy fixture/evaluation path | V1 parameters and absent `evaluationSpec` retain their existing behavior; V2 activates only with its explicit immutable spec. |

## Versioned contracts and evaluation

`ClientBrief v2` requires an explicit `rule` for each priority. The shipped rule kinds are `functional-scenario`, which references a hydrated required scenario, and `spatial-preferences`, which consumes authored density/empty-space policy. `style-constraint-catalog.v1` provides exact profile IDs, labels and constraints for Scandinavian, Japandi and Eclectic targets; `JsonConstraintCatalog` has no prefix heuristic.[3] [4]

| Contract | Version and owner | PROD-023 behavior |
|---|---|---|
| Client brief catalog/schema | V2; `data/briefs` + Infrastructure validation | Three shipped briefs carry explicit priority rules and style targets. |
| Style constraint catalog/schema | V1; `data/styles` + Infrastructure adapter | Exact immutable profile lookup transports constraints and label into `evaluationSpec`. |
| Evaluation spec | Runtime schema version 1; Application DTO | Frozen targets, priority rules, spatial preferences, composition, ergonomics and completion inputs reproduce V2 evaluation. |
| Scoring parameters/schema | V2; `data/scoring` + Domain validation | Declares `0.5/0.2/0.3` channel weights, `0.75/0.25` style blend, grid size and density profiles. |
| Explanation | Runtime schema version 2; Application → Presentation | Adds priority identity and V2 multi-channel exact impacts while retaining V1 rendering compatibility. |
| Runtime static inventory | Infrastructure deployment manifest | Publishes all active V2 brief and multi-style JSON contracts to `dist/data`. |

The calculation is deterministic and has three channels:

> `Style = 0.75 × weightedTargetFit + 0.25 × composition`
> `Client priorities = normalized weighted satisfaction`
> `Total = 0.5 × style + 0.2 × client priorities + 0.3 × ergonomics`

Composition is scored exactly once. The occupancy profiler marks each covered `0.1 m` floor cell once even if item footprints overlap, which keeps free-space measurement stable and prevents double-counting.[5] [6]

## Vertical implementation

| Layer | Delivered responsibility |
|---|---|
| Domain | Validates ClientBrief V2 priority rules; independently scores multiple style targets; profiles occupancy; evaluates spatial preference and client priorities; aggregates three channels; calculates exact V2 counterfactual impacts. |
| Application | Hydrates exact profile labels/constraints into immutable `evaluationSpec`; selects V2 evaluation only for that spec; produces `scoreBreakdown` and explanation V2. |
| Infrastructure | Validates and loads V2 brief/catalog contracts; resolves exact profile IDs; ships authored Japandi/Eclectic and priority remediations; publishes active runtime JSON. |
| Presentation | Forwards `evaluationSpec`; renders third channel, target breakdown and client-priority provenance; preserves no-policy pure-view boundary. |

## TDD and verification evidence

| Contract | Red behaviour | Green evidence |
|---|---|---|
| Multi-style targets | No independent weighted multi-target result existed. | `MultiStyleEvaluator.test.js` verifies deterministic target score, normalized fit and preserved authored label. |
| Profile identity | Catalog only exposed constraints and could drop display label. | `JsonStyleConstraintCatalog.test.js` verifies exact immutable profile lookup, label and unknown-ID null result. |
| V2 hydration | Evaluation spec could not carry authored style label. | `LoadLevelClientBrief.test.js` verifies frozen targets with constraints and labels. |
| Client priorities/spatial requests | Client-only preferences were inert data. | `ClientPriorityEvaluator`, `SpatialPreferenceEvaluator` and `RoomOccupancyProfile` Domain tests cover rule kinds and fixed-grid semantics. |
| Three-channel aggregate | Existing production fixture expected obsolete 70/30 input. | `ThreeChannelScoreAggregator.test.js` and V2 scoring-content contract verify authored `0.5/0.2/0.3` weights. |
| Explanation V2 | Result panel could not render a third channel, target rows or priority provenance. | `EvaluationViewErgonomics.test.js` verifies supplied three-channel rendering and pure client-priority explanation card. |
| Runtime packaging | Initial build omitted V2 brief/catalog JSON from `dist`. | `StaticDataAssets.test.js` and build verification prove all four active V2 runtime files are emitted. |

Full release verification passed after the packaging correction: `npm test` — **151 files / 464 tests**, `npm run build` — successful Vite production build with `client-brief.v2.schema.json`, `client-briefs.v2.json`, `style-constraint-catalog.v1.schema.json` and `style-constraint-catalog.v1.json` verified in `dist`; `npm audit --omit=dev --audit-level=high` — **0 vulnerabilities**; and `git diff --check` — clean.

## Limits and non-goals

1. PROD-023 does not introduce a global style taxonomy, mix-compatibility matrix or automatic style inference. Each target is explicit authored content.
2. It does not alter `ScorecardCalibrationPolicy`, star thresholds, critical-rule semantics, persistence or progression ownership.
3. It does not derive spatial semantics from visual geometry, item names or UI categories; PROD-024 owns complete semantic catalog coverage.
4. It does not change level topology or presentation environments; V2 client policy is hydrated into evaluation without making scenes a scoring input.
5. It does not persist explanation or score breakdown history in `PlayerProfile`; they remain reproducible runtime DTOs.

## References

[1]: ../../src/Application/UseCases/EvaluateRoomUseCase.js "V2 three-channel evaluation path"
[2]: ../../src/Application/Services/MultiChannelEvaluationExplanationAssembler.js "Explanation V2 assembly"
[3]: ../../data/briefs/client-brief.v2.schema.json "ClientBrief V2 schema"
[4]: ../../data/styles/style-constraint-catalog.v1.schema.json "Style constraint catalog schema"
[5]: ../../src/Domain/Scoring/ThreeChannelScoreAggregator.js "Three-channel aggregate"
[6]: ../../src/Domain/Scoring/RoomOccupancyProfile.js "Fixed-grid occupancy profile"
[7]: ../../src/Infrastructure/DataLoaders/staticDataAssets.js "Runtime V2 asset inventory"
[8]: ../adr/adr-030-client-priority-multi-style-scoring.md "ADR-030"
