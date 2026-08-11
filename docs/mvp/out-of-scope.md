# Decorium MVP Out of Scope

Следующие возможности сознательно не входят в рабочий MVP:

- **Эргономика:** проходы, доступность, расстояния и отдельный ergo score.
- **Persistence:** сохранения, профиль, история попыток, синхронизация.
- **Content expansion:** дополнительные комнаты, уровни, стили и UGC.
- **Meta/economy:** валюта, магазин, прогрессия, достижения, лидерборды.
- **Social/backend:** аккаунты, multiplayer, публикация комнат, cloud API.
- **Presentation polish:** аудио, particles, post-processing, advanced animations, настройки графики.
- **Platform expansion:** mobile/touch, VR/AR, consoles.
- **Services:** analytics, crash reporting, remote config, LLM personalization, payments.
- **Localization/accessibility:** дополнительные языки, RTL, screen readers, alternate controls.

MVP работает автономно в браузере: JSON-контент поставляется вместе со статическим приложением, env vars и внешние сервисы не нужны.

## Post-MVP порядок

1. Browser UX/performance hardening.
2. Ergonomics и более богатая spatial model.
3. Сохранения и дополнительные комнаты/стили.
4. Meta-системы и внешние сервисы при подтверждённой игровой гипотезе.
