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
- UI отображает score, звёзды, число предметов, violations и русские feedback-сообщения.

## Functional criteria

- [x] Один entrypoint `src/main.js`; inline bootstrap отсутствует.
- [x] Three.js renderer и OrbitControls инициализируются.
- [x] Выбор предмета из каталога работает.
- [x] Drag-and-drop с ghost-preview и pointer capture реализован.
- [x] Data-driven visual profiles отделяют форму/материал предмета от Domain-контракта; круглый журнальный столик строится цилиндрической моделью.
- [x] Процедурные визуальные builders различают основные типы предметов.
- [x] Живая сцена содержит animated TV screen, локальные light accents, питомца и нарративные маркеры свободного прохода.
- [x] Размещение, перемещение, поворот и удаление сопровождаются короткими анимациями.
- [x] Размещение, перемещение, поворот и удаление делегируются use cases.
- [x] Room bounds проверяются в Domain; collision и minimum gap не блокируют творческое размещение.
- [x] Level и item catalog валидируются схемами.
- [x] Style constraints и weighted style score вычисляются в Domain/Application.
- [x] Star rating берётся из JSON scoring parameters.
- [x] Feedback маппится через messageKey в русский JSON-каталог.
- [x] «Начать заново» очищает in-memory состояние.

## Non-functional criteria

- [x] `npm test`: 17 файлов, 134 теста проходят.
- [x] `npm run build` создаёт `dist/index.html`.
- [x] Domain/Application не используют browser APIs или nondeterministic calls.
- [x] Runtime не требует backend, аккаунта или env vars.

## Known MVP boundaries

Browser/WebGL smoke check и UX/performance testing на целевых устройствах остаются release-проверками, а не частью unit suite. Визуальные ergonomics hints присутствуют как нарративный слой, но persistence, числовой ergonomics score, extra content и production observability — post-MVP.
