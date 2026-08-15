# ADR-025 — ClientBrief as the source of design requirements

**Статус:** Accepted

**Дата:** 15 августа 2026 г.

**Продолжает:** [ADR-015 — Functional layout graph](adr-015-functional-layout-graph.md) and [ADR-024 — Asset-backed room compositions](adr-024-room-composition-asset-backed-environment.md)

## Контекст

Production audit established that level JSON mixed two fundamentally different concerns: room topology/inventory/presentation and evaluation policy. A level carried a global `styleId`, completion stars, composition and ergonomics rules even though the same room should evaluate differently for different client intent. This made a client brief only a future product narrative, not a deterministic source of gameplay requirements.

A universal clearance or style policy is insufficient for the product direction. One client may prefer an intimate room with less mandatory gap and discouraged empty space; another may require an open, accessible studio. More advanced briefs must permit controlled style mixing and personal priorities without using runtime heuristics or an opaque AI judge.

## Решение

A versioned `ClientBrief v1` is now the required evaluation-policy reference of every playable level. Level content owns room topology, item availability, initial placement and presentation profile only. Client brief content owns client identity, style targets, priorities, spatial preferences and evaluation policy.

| Contract area | Decision |
|---|---|
| Level reference | `clientBriefId` is required by the level schema. A missing/unresolved/cross-level brief fails level loading. |
| Brief identity | Each brief has `schemaVersion`, stable ID, bound `levelId` and stable client identity. |
| Style policy | One primary target and optional secondary/accent targets have deterministic weights that sum to one. |
| Client policy | Priorities and spatial preferences are versioned data, not UI settings or global scoring constants. |
| Current policy migration | Style lookup, completion threshold, composition and ergonomics inputs are derived from `brief.evaluationPolicy`. Duplicate level-side fields are rejected by schema. |
| Runtime boundary | Infrastructure validates/fetches data; Domain validates immutable values; Application hydrates it; Presentation displays it only. |
| Reproducibility | The fully authored brief is a stable input to a level evaluation. Future dynamic generation must persist the resolved brief or its complete source inputs. |

> A brief is not a decorative title. It is the reviewable deterministic policy for why a room is being designed and how later channels must evaluate it.

## Consequences

| Area | Consequence |
|---|---|
| Product framing | Players see a named client, brief and priorities before evaluating a room. |
| Current evaluation | Existing single-style/composition/ergonomics evaluation remains stable, but its policy source is now the brief. |
| Future client variation | Density, clearance multiplier and empty-space preference are represented without prematurely applying a hidden formula. |
| Style mixing | Briefs can author weighted primary/secondary/accent targets now; a later evaluator slice must activate them deterministically and visibly. |
| Content authoring | A new level requires a corresponding schema-valid brief and one-to-one level binding. |
| Safety | No default client, fallback policy or Presentation-side interpretation is permitted when a brief reference is absent. |

## Rejected alternatives

1. **Keep brief text separate from level rule JSON.** Rejected because client wishes would remain non-binding copy rather than deterministic gameplay input.
2. **Put client preference switches in UI settings.** Rejected because a player must not choose the client’s requirements or alter score policy outside authored data.
3. **Immediately activate all new fields with generic heuristics.** Rejected because `clearanceMultiplier`, empty-space preference and style mixing each need their own red contracts, acceptance matrix and explainable feedback.
4. **Generate a random brief at runtime without persisting inputs.** Rejected because a result must be reproducible from saved/authored data; non-deterministic generation cannot decide gameplay policy.
5. **Infer style intent from visual meshes or item names.** Rejected because semantics must remain declared content and visual assets must not become game rules.
6. **Let Infrastructure aggregate or score client priorities.** Rejected because Infrastructure loads data; deterministic policy interpretation belongs to Domain/Application.

## Follow-up

The next corrective slice introduces spatial item classification and evaluates its first client-specific spatial preference through explicit rule contracts. Subsequent slices add required functional scenario anchors, score caps/completion gates, explainable evaluation and weighted multi-style/client-priority scoring. Every new channel consumes `ClientBrief` data and must refuse unversioned level/UI fallbacks.

## References

[1]: ../../data/briefs/client-brief.v1.schema.json "ClientBrief v1 schema"
[2]: ../../data/schemas/level.schema.json "Topology-only level schema"
[3]: ../../src/Domain/Briefs/ClientBrief.js "ClientBrief Domain value"
[4]: ../../src/Application/UseCases/LoadLevelUseCase.js "Policy hydration"
[5]: ../slices/PROD-018-client-brief-source-foundation.md "PROD-018 delivery report"
[6]: adr-015-functional-layout-graph.md "ADR-015"
