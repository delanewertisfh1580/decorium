# PROD-005 browser smoke test

**Дата:** 14 августа 2026 г.  
**Локальная сборка:** Vite development server, `http://localhost:5174/`

## Наблюдаемый результат

Smoke test подтвердил загрузку 3D-комнаты, profile status, authored campaign selector и новой settings panel. Панель доступна через нативный `details/summary` disclosure и содержит checkbox reduced motion, UI-scale select, quality-tier select и кнопку сохранения. Все controls отображаются в мобильно-ориентированном HUD без перекрытия canvas.

Контекстные действия выбранного предмета включают touch-equivalent **Поднять**, **Опустить**, **Повернуть**, **Удалить** и **Отменить**. В overflow toolbar также видна кнопка **Вернуть камеру**, заменяющая keyboard-only path `Home`.

## Проверенные acceptance points

| Область | Результат |
|---|---|
| 3D room boot | Loaded successfully. |
| Settings controls | Visible, semantic и раскрываются интерактивно. |
| Touch action parity | Raise/lower/rotate/delete/undo и camera reset имеют button controls. |
| Campaign HUD | Active authored level доступен; locked levels остаются disabled. |
| Scene-first layout | Settings panel компактна и оставляет canvas видимым. |

## Interactive preference check

В settings panel были выбраны **Крупный** UI scale и **Производительность** quality tier. Нативные select controls приняли оба значения и сохранили readable touch-sized panel geometry до submit. Следующий browser step сохраняет этот request через application use case и проверяет applied runtime state.

После submit settings panel свернулась после re-render. Проверка runtime state подтвердила точное совпадение applied и persisted values:

```json
{
  "app": { "reducedMotion": "false", "uiScale": "large", "qualityTier": "performance" },
  "profile": { "reducedMotion": false, "uiScale": "large", "qualityTier": "performance" }
}
```

Следовательно, путь **settings form → `UpdatePlayerSettingsUseCase` → local profile repository → controller/runtime datasets** работает end-to-end.
