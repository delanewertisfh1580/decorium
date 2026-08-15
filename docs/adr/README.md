# Architecture decision records

ADR фиксируют решения, которые изменили архитектурные границы или публичные contracts Decorium. Записи неизменяемы: если решение пересматривается, создаётся новый ADR со ссылкой на заменяемое решение.

| Группа | ADR | Решение |
|---|---|---|
| Foundations | [001](adr-001-onion-architecture.md), [002](adr-002-domain-without-threejs.md), [003](adr-003-json-content-pipeline.md) | Clean Architecture, чистый Domain и JSON content boundary. |
| Evaluation | [004](adr-004-style-only-scoring-for-mvp.md), [005](adr-005-deterministic-test-data.md), [006](adr-006-star-rating-thresholds.md), [007](adr-007-feedback-message-mapping.md) | Ранняя scoring baseline, deterministic fixtures, stars и feedback mapping. |
| Player and campaign | [008](adr-008-versioned-local-player-profile.md), [009](adr-009-authored-level-manifest-and-session-selection.md), [012](adr-012-campaign-progression-policy.md), [013](adr-013-versioned-player-settings-and-touch-parity.md) | Local profile, level selection, progression и player settings. |
| Ergonomics | [010](adr-010-ergonomics-clearance-scoring.md), [011](adr-011-authored-passage-zones.md), [015](adr-015-functional-layout-graph.md) | Clearance, passage zones и semantic functional layout graph. |
| Delivery | [014](adr-014-versioned-build-info-and-release-gate.md) | Build identity, release manifest и CI gate. |
| Presentation | [016](adr-016-authored-presentation-environment-profiles.md), [017](adr-017-presentation-catalog-context.md), [018](adr-018-data-driven-furniture-visual-families.md), [019](adr-019-asset-backed-furniture-presentation.md) | Versioned scene profiles, catalog continuity, furniture families and resilient GLB prefab delivery, all isolated from gameplay. |

Для текущей operational картины сначала прочитайте [Architecture overview](../architecture/overview.md), затем используйте ADR как rationale. Historical MVP wording в ранних ADR может описывать исходную мотивацию, а не текущий product scope.
