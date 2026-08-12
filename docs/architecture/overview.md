# Decorium Architecture Overview

## Status
Implemented MVP baseline

## Purpose

Документ описывает фактическую архитектуру Decorium: браузерного Vite-приложения с Three.js-презентацией и чистым Domain/Application ядром.

## Stack

- JavaScript ES modules
- Vite 5
- Three.js 0.160
- AJV 8 для JSON Schema
- Vitest 4
- JSON static content

## Dependency direction

```text
Presentation → Application → Domain ← Infrastructure
```

`src/main.js` является composition root: он загружает схемы/контент и передаёт конкретные Infrastructure-адаптеры в Application use cases. Domain не импортирует Three.js, AJV, DOM или сеть.

## Layers

### Domain (`src/Domain`)

`Item`, `FeatureVector`, `RoomBounds`, `RoomState`, `LinearConstraint`, `Violation`, `ConstraintEvaluator`, `StyleScorer` и `StarRatingPolicy`. Здесь находятся правила 16-полевых векторов, размещения, коллизий, зазоров и оценки.

### Application (`src/Application`)

`LoadLevelUseCase`, `PlaceItemUseCase`, `MoveItemUseCase`, `RotateItemUseCase`, `RemoveItemUseCase`, `EvaluateRoomUseCase`, DTO и порты. Use cases оркестрируют Domain и возвращают результат, пригодный для UI.

### Infrastructure (`src/Infrastructure`)

`JsonItemCatalog`, `JsonLevelRepository`, `JsonConstraintCatalog`, `JsonStyleCatalog`, `JsonFeedbackCatalog`, `SchemaLoader`, `JsonScoringParametersLoader`, `staticDataAssets.js` и `InMemoryRoomRepository`. Все browser fetch-вызовы находятся здесь или в composition root; `staticDataAssets.js` фиксирует JSON, которые Vite должен публиковать рядом с HTML.

### Presentation (`src/Presentation`)

`GameController`, view models, `RoomView`, `ItemCatalogView`, `ToolbarView` и `EvaluationView`. `RoomView` создаёт Three.js-сцену, камеры, свет, стены и box-меши; UI не считает score.

## Runtime data flow

```text
JSON → Infrastructure loaders → Domain entities
User input → GameController → Application use case → RoomState
Confirm → EvaluateRoomUseCase → constraints → style score → stars → feedback UI
```

## MVP boundaries

В runtime включены один уровень, Scandinavian, V2 catalog, локальная in-memory сессия и style-only scoring. Ergonomics, persistence, meta-game и external services являются post-MVP.

## Verification

```bash
npm test
npm run build
```

Unit/architecture guards проверяют детерминизм и отсутствие запрещённых зависимостей. Build проверяет `src/main.js`, создаёт inline `dist/index.html` и публикует runtime JSON в `dist/data/` для статических хостингов.
