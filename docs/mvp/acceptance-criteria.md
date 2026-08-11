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
- Некорректные позиции возвращают понятную ошибку и не меняют состояние.
- Оценка строит `Vroom = average(Vitems)` по 16 полям.
- Для каждого ограничения вычисляется нарушение и severity.
- Итоговый score находится в диапазоне 0..1.
- Звёзды используют пороги 0.86 / 0.71 / 0.56 / 0.40.
- UI отображает score, звёзды, число предметов, violations и русские feedback-сообщения.

## Functional criteria

- [x] Один entrypoint `src/main.js`; inline bootstrap отсутствует.
- [x] Three.js renderer и OrbitControls инициализируются.
- [x] Выбор предмета из каталога работает.
- [x] Размещение, перемещение, поворот и удаление делегируются use cases.
- [x] Room bounds, collision и minimum gap проверяются в Domain.
- [x] Level и item catalog валидируются схемами.
- [x] Style constraints и weighted style score вычисляются в Domain/Application.
- [x] Star rating берётся из JSON scoring parameters.
- [x] Feedback маппится через messageKey в русский JSON-каталог.
- [x] «Начать заново» очищает in-memory состояние.

## Non-functional criteria

- [x] `npm test`: 17 файлов, 130 тестов проходят.
- [x] `npm run build` создаёт `dist/index.html`.
- [x] Domain/Application не используют browser APIs или nondeterministic calls.
- [x] Runtime не требует backend, аккаунта или env vars.

## Known MVP boundaries

Browser/WebGL smoke check и UX/performance testing на целевых устройствах остаются release-проверками, а не частью unit suite. Persistence, ergonomics, extra content и production observability — post-MVP.
