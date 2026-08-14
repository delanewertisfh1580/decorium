# UI-ROOM-006 — Animation & Surface Polish

## Status
COMPLETED

## Context

Первый animation pass был технически рабочим, но визуально слишком быстрым и однообразным: люди перебирали ногами, руки терялись в силуэте, TV выглядел как набор полос, а пол — как debug grid. Этот слайс исправляет presentation quality без изменения игрового цикла.

## Acceptance criteria

- [x] Частота шага людей снижена до естественного темпа `1.8 Hz`; животное использует отдельный темп `2.8 Hz`.
- [x] Руки людей находятся по бокам корпуса, имеют отдельный pivot и видимые кисти.
- [x] Амплитуды ног, рук, bounce и хвоста ограничены профилем gait.
- [x] TV получил три движущихся content blocks, orb accent, content bars, scanlines и glow.
- [x] Пол комнаты больше не использует `THREE.GridHelper` и отображается как спокойная матовая тёплая поверхность.
- [x] Детерминированные pure contracts покрывают natural tempo, arm presence, TV content diversity и отсутствие grid.
- [x] Domain, Application, placement, scoring и RoomState не изменялись.

## Implementation

`lifeAnimationConfig.js` обновлён с frame-friendly профилями: частота gait отделена от амплитуды, а TV motion теперь возвращает `contentOffsets` наряду с bars/scanline/glow.

`LocationEnvironmentSystem` создаёт руки как отдельные группы с рукавом и кистью, поэтому вращение происходит вокруг плеча и силуэт читается с камеры. `SceneLifeSystem` применяет content offsets к экранным блокам и орбу.

`roomSurfaceConfig.js` задаёт data-driven контракт `matte-warm`; `RoomView` больше не создаёт debug grid.

## Tests

```text
npm test -- tests/Presentation/LifeAnimations.test.js tests/Presentation/RoomSurface.test.js
✓ 2 files, 5 tests passed
```

```text
npm test
✓ 31 файлов, 175 тестов

npm run build
✓ production build passed
```

Сгенерированный `dist/index.html` восстановлен после проверки.

## Manual QA checklist

1. Проверить, что человек делает спокойный шаг, руки читаются отдельно от корпуса и двигаются в противофазе ногам.
2. Проверить, что животное не дёргается и не перебирает лапами слишком быстро.
3. Проверить, что телевизор меняет композицию, а не только яркость полос.
4. Проверить, что пол визуально спокойный, матовый и не содержит регулярной сетки.
