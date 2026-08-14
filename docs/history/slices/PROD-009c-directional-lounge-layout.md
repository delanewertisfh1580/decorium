# PROD-009c — Directional lounge layout: sofa, television and coffee table

**Статус:** Implemented
**Дата:** 14 августа 2026 г.
**Срез:** Domain → Application → Infrastructure content → Three.js Presentation

## Пользовательский результат

Гостиная теперь распознаёт не только близость мебели, но и направление сценария отдыха. В `level-002` игрок получает explicit телевизор как `view-target`. Диван засчитывается только тогда, когда его declared front axis направлена к телевизору в authored distance range. Журнальный столик засчитывается только перед диваном, а не за его спинкой.

Ошибочная расстановка создаёт existing ergonomics violation и влияет на existing ergonomics sub-score. Feedback catalog даёт конкретное действие: **повернуть диван к телевизору** или **поставить журнальный столик перед диваном**. UI показывает эти data-driven messages в existing evaluation card; Presentation не вычисляет ни orientation, ни score.

## Directional rule contract

`FunctionalLayoutRule v1` retains the existing `adjacency` kind and adds a separate `front-adjacency` kind. Directional rules retain semantic selectors, partner minimum, distance interval, weight and feedback key; additionally they require `maxAngleDegrees` in the interval `(0, 90]`.

```json
{
  "schemaVersion": 1,
  "id": "lounge-seat-faces-view-target",
  "kind": "front-adjacency",
  "anchorSelector": { "affordance": "lounge-seat" },
  "partnerSelector": { "affordance": "view-target" },
  "minPartners": 1,
  "distance": { "min": 1, "max": 4 },
  "maxAngleDegrees": 30,
  "weight": 1.3,
  "messageKey": "functional-lounge-faces-view-target"
}
```

| Rule field | Deterministic meaning |
|---|---|
| `anchorSelector` | Item whose orientation is evaluated. For the lounge rules it is a `lounge-seat`. |
| `partnerSelector` | Required target or surface selected by an explicit affordance. |
| `distance` | Footprint edge-to-edge interval in metres. |
| `maxAngleDegrees` | Maximum deviation of the anchor front vector from the vector to the partner centre. |
| `minPartners` | Minimum number of one-to-one consumed matching partners for each anchor. |

The evaluator rotates the profile's local `frontAxis` by the placed item's cardinal room rotation, computes the centre-vector angle with the candidate partner and accepts it only when it lies inside the authored cone. Profiles without a front axis cannot satisfy a directional rule. This guarantees that an un-oriented item cannot accidentally pass a sofa-facing policy.

> `front-adjacency` is not an item-name heuristic. It is a typed, versioned authored relation; the evaluator receives only RoomState transforms, Item interaction profiles and level rules.

## Authored TV asset

`tv-001` is a new catalog V3 item of type `media`, sized `1.6 × 0.3` metres and explicitly marked `view-target`. Its profile declares `negativeZ` front axis so semantic orientation is stored with the item rather than inferred from the display name or Three.js mesh.

The visual profile maps the item to a dedicated `television` shape. The procedural Three.js renderer creates a frame, emissive screen, highlight, neck, stand and indicator; it retains the existing selection-halo and item-part contracts. No score code uses renderer geometry.

## Level-002 lounge scenario

| Authored relation | Anchor | Partner | Distance | Angle | Feedback key |
|---|---|---|---:|---:|---|
| Sofa faces TV | `lounge-seat` | `view-target` | 1.0–4.0 m | 30° | `functional-lounge-faces-view-target` |
| Coffee table in front | `lounge-seat` | `coffee-surface` | 0.1–0.6 m | 30° | `functional-coffee-surface-in-front-of-lounge-seat` |

`tv-001` is available only in `level-002`, which already supplies a lounge sofa and coffee surface. The schema allows `front-adjacency` only when its angle is explicitly supplied. This preserves strict content validation while avoiding impossible rules in levels without a view target.

## TDD evidence

| Phase | Red test | Green implementation |
|---|---|---|
| Directional rule contract | extended `FunctionalLayoutRule.test.js` | `front-adjacency` and required bounded `maxAngleDegrees`. |
| Sofa orientation | extended `FunctionalLayoutEvaluator.test.js` | Rotated local front-axis angle test against the view target. |
| Coffee-table placement | extended `FunctionalLayoutEvaluator.test.js` | Same typed directional rule evaluated against `coffee-surface`. |
| TV content | `ViewTargetScenarioContent.test.js` | `tv-001`, level-002 rules, level schema and V3 catalog type. |
| TV renderer | extended `ItemVisualFactory.test.js` | Explicit visual profile and dedicated television shape. |
| Feedback | extended `FunctionalFeedbackContent.test.js` | Actionable authored messages for both directional violations. |

## Acceptance criteria

- A sofa faces the television only if its front axis is inside the authored 30° cone.
- Rotating the same sofa away from the television creates a functional violation.
- A coffee surface only satisfies the lounge scenario in front of the sofa and within its authored range.
- The TV exists as explicit versioned catalog data with `view-target`, not as a name-based special case.
- Every directional rule is schema-valid, typed in Domain and evaluated through the existing ergonomics score/feedback path.
- Television rendering is a dedicated content-driven Three.js visual and does not participate in gameplay scoring.

## Не входит

This slice does not add pathfinding, camera line-of-sight occlusion, wall-mounted fixture placement, automatic furniture rotation, or multi-target media zones. It also does not require the TV to face the sofa: current policy evaluates the user's sofa orientation, which is the requested user-facing failure mode. Bidirectional orientation is a distinct future authored rule if needed.
