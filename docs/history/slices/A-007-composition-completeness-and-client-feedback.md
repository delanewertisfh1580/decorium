# A-007 — Composition Completeness & Client Feedback

## Status
COMPLETED

## Problem

Style vectors alone can reward an isolated object. A single chair may match Scandinavian material and color thresholds while the living-room design brief remains unsolved. The 3D scene also must not explain evaluation decisions through permanent labels: those explanations belong to the evaluation client UI.

## Implemented contract

`data/levels/level-001.json` now defines the level brief declaratively:

```json
{
  "compositionRules": {
    "minItems": 4,
    "requiredRoles": ["seating", "surface", "lighting"]
  }
}
```

`CompositionEvaluator` maps catalog types to design roles and adds weighted evaluation violations when the brief is incomplete:

- `sofa`/`chair` → `seating`;
- `table` → `surface`;
- `lighting` → `lighting`;
- `storage` → `storage`;
- `decor` → `decor`.

This does not block overlap, stacking, placement or experimentation. It only affects the result of `EvaluateRoomUseCase`. A single chair therefore cannot receive five stars; it receives composition feedback from `data/feedback/scandinavian-feedback.json` and a reduced score.

## Client-owned feedback

Removed from `SceneLifeSystem`:

- permanent `СВОБОДНЫЙ ПРОХОД` sprite;
- explanatory route markers used as a gameplay verdict.

The scene may remain atmospheric and animated, but all success/error/recommendation explanations are rendered by `EvaluationView` from the feedback catalog. A success message is shown only when there are no evaluation violations.

## Verification

- composition evaluator regression tests cover one chair and a minimal complete living-room composition;
- scene source regression test prevents explanatory passage labels from returning;
- level JSON is validated by the existing AJV schema;
- existing placement freedom and style scoring remain intact.
