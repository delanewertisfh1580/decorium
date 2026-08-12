# UI-ROOM-002 — Living Location

## Status
COMPLETED

## Requirement

Заменить пустую комнату в вакууме на живую локацию: дом должен читаться как часть улицы, по которой проходят люди, проезжают машины и пробегает животное. Интерьер должен иметь бытовые детали и больше одного питомца.

## Acceptance criteria

- [x] Вне комнаты видны фасад дома, дверь, освещённые окна, козырёк и уличные фонари.
- [x] Добавлены тротуар, бордюр, дорога и дорожная разметка.
- [x] Люди, машины и животное проходят по фиксированным маршрутам от начала до конца улицы.
- [x] Анимации маршрутов детерминированы фиксированными `speed` и `phase`; `Math.random` не используется.
- [x] Машины имеют колёса, фары и разные спокойные цветовые варианты.
- [x] В квартире добавлены картина, полка с книгами, кружка, лежанка и миски питомцев.
- [x] В интерьере присутствуют бродящий питомец и отдыхающий кот.
- [x] Слой локации не изменяет `RoomState`, scoring, constraints или placement rules.

## Presentation contract

`src/Presentation/Scene/locationLifeConfig.js` задаёт:

- обязательное окружение `facade / sidewalk / road`;
- пять фиксированных route descriptors;
- интерьерные детали и список питомцев.

`LocationEnvironmentSystem` отвечает только за процедурные Three.js-визуалы и анимацию. `SceneLifeSystem` остаётся фасадом живой сцены и делегирует ему обновление.

## TDD evidence

### Failing test

```text
Error: Cannot find module '../../src/Presentation/Scene/locationLifeConfig.js'
```

### Passing test

```text
npm test -- tests/Presentation/LocationLife.test.js
✓ 3 tests passed
```

```text
npm run build
✓ успешно
```

## Changed presentation files

- `src/Presentation/Scene/locationLifeConfig.js`;
- `src/Presentation/Scene/LocationEnvironmentSystem.js`;
- `src/Presentation/Scene/SceneLifeSystem.js`;
- `tests/Presentation/LocationLife.test.js`.

## Manual QA checklist

1. Открыть сцену и вывести камеру за заднюю стену — убедиться, что стена просвечивает и видны фасад, тротуар и дорога.
2. Наблюдать несколько циклов: два пешехода, две машины и животное должны двигаться слева направо от края до края.
3. Проверить анимацию ног пешеходов, вращение колёс, фары и прыжки животного.
4. Вернуть камеру внутрь квартиры и проверить картину, книги, кружку, лежанку, миски и отдыхающего кота.
5. Добавить/переместить предмет и убедиться, что уличный слой не влияет на размещение и оценку.

## Out of scope

Реальные 3D-модели, внешние ассеты, сеть, процедурная генерация уровня, звук и бизнес-логика не добавлялись.
