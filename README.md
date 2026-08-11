# Decorium

Decorium — браузерная 3D-игра на Three.js о создании скандинавского интерьера. Игрок собирает комнату из предметов, перемещает и поворачивает их, а затем получает детерминированную стилевую оценку со звёздами и русской обратной связью.

## MVP сейчас

- Один уровень: `level-001` — гостиная 8 × 6 м.
- Один стиль: Scandinavian.
- Каталог V2: 33 предмета с вектором из 16 признаков; в уровне доступен набор из 8 предметов.
- Размещение, перемещение, вращение на 90° и удаление предметов.
- Проверка границ комнаты, пересечений и минимального зазора 0.9 м.
- Оценка по пяти стилевым ограничениям и отображение нарушений.
- Пять порогов рейтинга: 5★ ≥ 0.86, 4★ ≥ 0.71, 3★ ≥ 0.56, 2★ ≥ 0.40, иначе 1★.
- Three.js-сцена с OrbitControls, выбором предметов мышью и управлением с клавиатуры.
- JSON-контент с runtime-валидацией уровня и каталога предметов.

Эргономика, сохранения, прогрессия, экономика, мультиплеер, звук и дополнительные уровни находятся за пределами MVP.

## Требования

- Node.js 18+ и npm.
- Браузер с поддержкой WebGL.
- Внешние сервисы и environment variables не требуются.

## Запуск

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

Затем откройте адрес Vite, обычно `http://localhost:5173`.

Проверки:

```bash
npm test
npm run build
```

Production-сборка создаёт самодостаточный `dist/index.html` через `vite-plugin-singlefile`.

## Управление

1. Выберите предмет в библиотеке.
2. Кликните по полу комнаты, чтобы разместить его.
3. Кликните по предмету, затем по другой точке пола, чтобы переместить его.
4. Используйте `R` или «Повернуть», `Delete` или «Удалить».
5. Нажмите `E` или «Оценить», чтобы получить результат.
6. «Начать заново» очищает текущую сессию.

## Архитектура

Код разделён на слои DDD/Onion:

- `src/Domain` — сущности, value objects и правила комнаты/оценки без Three.js и HTTP.
- `src/Application` — use cases, DTO и порты.
- `src/Infrastructure` — JSON-загрузчики, AJV-валидация и in-memory repository.
- `src/Presentation` — Three.js-сцена, контроллер и UI.
- `data` — уровень, V2-каталог, стиль, ограничения, feedback и схемы.

Текущий entrypoint — `src/main.js`; старого inline bootstrap больше нет.

## Environment variables

Приложение не читает `process.env` или `import.meta.env`. API keys, база данных, авторизация и backend для MVP не нужны.

## Документация

- [MVP charter](docs/mvp/charter.md)
- [MVP scope](docs/mvp/scope.md)
- [Acceptance criteria](docs/mvp/acceptance-criteria.md)
- [Definition of Done](docs/mvp/definition-of-done.md)
- [Architecture overview](docs/architecture/overview.md)
- [System decomposition](docs/decomposition.md)
