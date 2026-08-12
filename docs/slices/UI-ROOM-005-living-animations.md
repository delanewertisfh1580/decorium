# UI-ROOM-005 — Living Animations

## Status
COMPLETED

## Requirement

Переработать анимации живой локации: ходьба животных и людей должна читаться как шаг, телевизор — как работающий экран, а движение по улице — оставаться плавным и стабильным независимо от частоты кадров.

## Acceptance criteria

- [x] У людей появились синхронные движения ног и рук, лёгкий body-bob и разворот по направлению маршрута.
- [x] Уличное животное использует отдельный более быстрый gait: четыре ноги, bounce и анимированный хвост.
- [x] Люди и животное проходят маршрут от края до края по детерминированным `speed`/`phase`.
- [x] Машины двигаются с frame-rate independent вращением колёс и разворачиваются для обратных маршрутов.
- [x] Телевизор имеет несколько анимационных слоёв: контентные полосы, перемещающиеся scanlines, изменение свечения экрана и локального blue light.
- [x] Все вычисления движения вынесены в чистые функции `lifeAnimationConfig.js`; `Math.random` и timers для игровой логики не используются.
- [x] Анимационный слой остаётся Presentation-only и не изменяет `RoomState`, placement, scoring или constraints.

## Implementation

`src/Presentation/Scene/lifeAnimationConfig.js` — единый контракт профилей gait и television. Он предоставляет:

- `getGaitPose(seconds, phase, kind)` для pedestrian/animal;
- `getRouteMotion(seconds, route)` для циклического маршрута и направления;
- `getTelevisionMotion(seconds)` для screen frame, bar offsets, scanline и glow.

`LocationEnvironmentSystem` применяет эти значения к конечностям, рукам, хвосту, положению сущности, ориентации и колёсам. `SceneLifeSystem` применяет TV motion к экрану, content bars, scanlines и `PointLight`.

## TDD evidence

```text
npm test -- tests/Presentation/LifeAnimations.test.js tests/Presentation/LocationLife.test.js
✓ 2 files, 6 tests passed

npm run build
✓ production build passed
```

## Manual QA checklist

1. Наблюдать минимум два цикла улицы: у людей должны чередоваться ноги и руки, а тело — слегка пружинить.
2. Проверить животное: четыре ноги должны двигаться попарно, хвост — менять положение, корпус — мягко подпрыгивать.
3. Проверить проезд машин на слабом и сильном FPS: скорость маршрута не должна зависеть от количества кадров, колёса вращаются непрерывно.
4. Навести камеру на телевизор: экран должен менять кадр, по нему должна проходить scanline, а локальное свечение — мягко пульсировать.
5. Проверить `prefers-reduced-motion`: DOM/UI transitions сокращаются, WebGL ambient animation остаётся частью scene presentation и не затрагивает gameplay state.

## Out of scope

Звук телевизора, аудио шагов/двигателей, skeletal animation, внешние GLTF-ассеты и изменение игровых правил не входят в этот слайс.
