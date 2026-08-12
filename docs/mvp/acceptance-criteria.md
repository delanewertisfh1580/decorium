# Decorium MVP Acceptance Criteria

## Canonical scenario

### Given

- Загружен `level-001`.
- Загружен V2-каталог с 16 признаками.
- Загружен Scandinavian и пять его ограничений.
- Комната начинается пустой.

### When

- Игрок выбирает предмет и кликает по полу.
- Игрок выбирает размещённый предмет и кликает по другой точке.
- Игрок вращает или удаляет предмет.
- Игрок нажимает «Оценить».

### Then

- Предмет появляется в Three.js-сцене.
- Позиции внутри комнаты принимаются свободно: пересечения и наложения разрешены; только выход за границы возвращает понятную ошибку.
- Оценка строит `Vroom = average(Vitems)` по 16 полям.
- Для каждого ограничения вычисляется нарушение и severity.
- Итоговый score находится в диапазоне 0..1.
- Звёзды используют пороги 0.86 / 0.71 / 0.56 / 0.40.
- Composition requirements уровня применяются к оценке: одна мебель не считается решённой композицией; для `level-001` требуются минимум 4 предмета и роли seating/surface/lighting.
- UI отображает score, звёзды, число предметов, composition/style violations и русские feedback-сообщения из JSON-каталога.

## Functional criteria

- [x] Один entrypoint `src/main.js`; inline bootstrap отсутствует.
- [x] Three.js renderer и OrbitControls инициализируются.
- [x] Выбор предмета из каталога работает.
- [x] Drag-and-drop с ghost-preview и pointer capture реализован.
- [x] Camera distance limits и динамическая прозрачность ближайших стен работают в Presentation.
- [x] Ghost-preview вращается на `R/Q` до placement и сохраняет rotation после размещения.
- [x] ПКМ отменяет selected item/ghost placement и не открывает context menu.
- [x] Data-driven visual profiles отделяют форму/материал предмета от Domain-контракта; процедурные builders дают rich-detail модели всем shape profiles, включая настоящий круглый журнальный столик, vase и clock.
- [x] Процедурные визуальные builders различают основные типы предметов.
- [x] Пол комнаты использует спокойную матовую поверхность без debug grid.
- [x] Живая сцена содержит animated TV screen, локальные light accents и питомцев; постоянные поясняющие verdict-плашки отсутствуют.
- [x] Живые сущности используют детерминированные gait-анимации естественного темпа: отдельные руки/ноги людей, четыре ноги и хвост животного, а TV имеет content blocks, bars, scanlines и glow.
- [x] Размещение, перемещение, поворот и удаление сопровождаются короткими анимациями.
- [x] Размещение, перемещение, поворот и удаление делегируются use cases.
- [x] Keyboard и toolbar actions проходят через единый Presentation `InputIntent` dispatch.
- [x] `Z`/Undo отменяет последнее успешное placement, move, rotate или delete.
- [x] Room bounds проверяются в Domain; collision и minimum gap не блокируют творческое размещение.
- [x] Level и item catalog валидируются схемами.
- [x] Style constraints, composition requirements и weighted score вычисляются в Domain/Application.
- [x] Star rating берётся из JSON scoring parameters.
- [x] Feedback маппится через messageKey в русский JSON-каталог.
- [x] «Начать заново» очищает in-memory состояние.
- [x] HUD остаётся scene-first: каталог, summary и action-dock не перекрывают центр комнаты.
- [x] Inventory отображается компактной горизонтальной лентой с прокруткой.
- [x] Toolbar сохраняет rotate/delete/undo/clear/evaluate callbacks в компактном action-dock.
- [x] Узкий viewport использует нижние thumb-friendly зоны и safe-area отступы.
- [x] Evaluation overlay остаётся читаемым и закрываемым без изменения evaluation contract.

## Non-functional criteria

- [x] `npm test`: автоматический suite проходит, включая UI-VIS-001 HUD contract.
- [x] `npm run build` создаёт `dist/index.html`.
- [x] Domain/Application не используют browser APIs или nondeterministic calls.
- [x] Runtime не требует backend, аккаунта или env vars.

## Known MVP boundaries

Browser/WebGL smoke check и UX/performance testing на целевых устройствах остаются release-проверками, а не частью unit suite. Визуальные ergonomics hints присутствуют как нарративный слой, но persistence, числовой ergonomics score, extra content и production observability — post-MVP.
