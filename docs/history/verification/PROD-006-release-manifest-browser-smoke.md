# PROD-006 — Release manifest browser smoke test

**Дата:** 14 августа 2026 г.  
**Runtime:** локальный Vite development server

## Результат

После запуска game bootstrap первый authored level загрузился штатно. В нижней части HUD отобразилась compact support-safe release identity:

```text
Версия v1.0.0 · web · 10cffcc
```

Значение revision соответствует короткому префиксу generated build manifest. Панель не перекрыла 3D canvas или основные gameplay controls. Проверка browser console не показала ошибок: release manifest loading не нарушил startup flow.
