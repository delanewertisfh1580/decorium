# PROD-010 — Authored level presentation profiles

**Статус:** Completed
**Дата:** 15 августа 2026 г.
**Связанное решение:** [ADR-016](../adr/adr-016-authored-presentation-environment-profiles.md)

## Пользовательский результат

Каждый shipped level теперь несёт собственную authored presentation identity. Первая гостиная остаётся тёплой стартовой сценой с resting cat, второй уровень представляет более камерный городской media corner, а третий — светлую студию. Игрок видит различия в палитре поверхностей, openings, освещении, exterior, ambient décor, camera framing и dashboard subtitle. Это устраняет прежний эффект «одного и того же дома» при разных задачах, не превращая визуальную сцену в источник gameplay rules.

> `presentationEnvironment` — presentation-only input. Он не участвует в style score, ergonomics, functional-layout evaluation, progression или economy.

| Уровень | Profile ID | Визуальная роль | Profile-owned ambient elements |
|---|---|---|---|
| `level-001` | `warm-starter-living` | Тёплая стартовая гостиная с residential exterior | Mirror, bookshelf, resting cat, bed and bowls |
| `level-002` | `urban-media-corner` | Тёмный, но читаемый городской media corner | Accent wall art and low bookshelf; no ambient television or cat |
| `level-003` | `bright-studio` | Светлая daylight studio с courtyard context | Studio planter and gallery shelf; no ambient television or cat |

## Versioned content contract

Добавлен `environment-profiles.v1.json` с корневой `schemaVersion: 1` и отдельной `schemaVersion: 1` на каждом profile. Строгая schema закрывает vocabulary для floor, wall, opening, camera, lighting, exterior и scene-life presets. Каждый level contract теперь требует `presentationProfileId`, поэтому published authored level не может незаметно получить generic room fallback.

Content loader регистрирует schema и catalog как static assets. `JsonPresentationEnvironmentRepository` валидирует catalog через AJV, кэширует данные и возвращает immutable profile. `LoadLevelUseCase` разрешает `presentationProfileId` через Application port и гидратирует результат в `LevelDTO.presentationEnvironment`; неизвестный identifier возвращается как data error до появления room view.

| Слой | Изменение | Граница ответственности |
|---|---|---|
| Content | Versioned profile catalog, strict schema, required level reference | Authoring выражает visual intent декларативно. |
| Infrastructure | Validated cached JSON repository and schema loader | Загружает и validates data; не вводит score или unlock policy. |
| Application | `PresentationEnvironmentRepository`, `LoadLevelUseCase`, `LevelDTO` hydration | Соединяет authored reference и presentation DTO. |
| Presentation | Pure resolver, RoomView, SceneLifeSystem, LocationEnvironmentSystem and controller wiring | Рендерит deterministic scene plan without feeding gameplay evaluators. |

## Presentation runtime

`resolveEnvironmentProfilePlan()` является pure deterministic resolver. Он принимает только hydrated authored profile, выбирает известные presets и создаёт frozen plan. План передаётся в `RoomView` перед первым render. Rebuild происходит также при изменении profile ID, поэтому level switching не оставляет lights, geometry или scene-life от предыдущего уровня.

`RoomView` получает profile-derived floor and wall surfaces, openings, camera home и light registry. `SceneLifeSystem` и `LocationEnvironmentSystem` требуют `environmentPlan` явно: ambient cat, movable mirror/bookshelf, profile decor, exterior materials, route density и floating motes принадлежат profile. Global television builder удалён; television остаётся только player-placeable catalog item и может появиться в комнате исключительно через room state.

Для `media-dusk` добавлен отдельный legibility contract. Профиль остаётся заметно темнее starter room, но имеет достаточный fill, key и warm lighting для visual clarity на performance tier. Этот contract защищает authored intent от возвращения к почти неразличимой тёмной сцене.

## Product framing

Document shell теперь использует title `Decorium`, нейтральную description и label `Interior Design Game`. Dashboard показывает subtitle active authored profile вместо статической Scandinavian-only метки. Historical MVP content и starter scenario могут по-прежнему упоминать Scandinavian, но shell и active presentation больше не утверждают, что это product canon.

## Verification evidence

Red/green tests покрывают level/profile contracts, repository validation, loader registration, DTO hydration and unknown identifiers, composition-root wiring, pure plan resolution, profile scene ownership, fixture interaction, room/controller hand-off, labels и media-dusk legibility. Full regression and production build выполняются как финальный gate перед publication.

Manual browser smoke выполнил isolated local progression workflow: уровни 002–003 были временно unlocked только в browser local storage, все три profile были открыты и визуально проверены, затем исходный local player profile был восстановлен. Smoke подтвердил distinct warm, media-dusk and daylight scenes; resting cat только на level 001; отсутствие baked-in television на levels 001 and 003; profile-specific HUD title/subtitle; и нейтральный product shell.

## Non-goals и продолжение

PROD-010 не меняет catalog taxonomy, search, scroll continuity, furniture asset quality, cat behavior system, scoring, functional rules, progression или client-brief semantics. Следующий утверждённый slice — **PROD-011: persistent structured catalog**, который добавит category tabs, search и сохранение scroll/selection continuity после placement, не смешивая эту UX-работу с profile presentation delivery.
