# Release runbook

**Статус:** Active operational procedure
**Owner:** Release operator
**Обновлено:** 15 августа 2026 г.

Этот runbook описывает выпуск и rollback static web-артефакта Decorium. Он использует build metadata и не требует profile export, localStorage, room state или browser device identifiers игрока.

## Перед публикацией

| Шаг | Действие | Expected evidence |
|---|---|---|
| 1 | Открыть pull request или подготовить push в `master`. | GitHub workflow **Release gate** запускается на PR и `master`. |
| 2 | Дождаться `npm ci`, `npm test`, `npm run build` и `npm audit --omit=dev --audit-level=high`. | Все CI steps зелёные. |
| 3 | Проверить `dist/release-manifest.json`. | `BuildInfo v1`, version, 40-character SHA, channel и timestamp. |
| 4 | Открыть retained artifact `decorium-web-release`. | Артефакт содержит `index.html`, `data/` и `release-manifest.json`. |
| 5 | Выполнить browser smoke в target hosting environment. | HUD показывает `v<version> · <channel> · <short SHA>`, а первый уровень загружается. |
| 6 | Продвинуть ровно проверенный каталог `dist`. | Runtime HUD revision совпадает с manifest artifact. |

Workflow использует Node.js 22, хранит artifact 14 дней и вызывает `node scripts/verify-release-artifact.mjs dist/release-manifest.json` до upload. Ручная публикация без этого набора evidence не является release.

## Диагностика и rollback

При сообщении о production regression запросите компактную HUD version string или copy non-sensitive release manifest. Разрешите short SHA в repository и откройте соответствующий CI artifact. Не используйте данные игрока для идентификации build.

Для rollback найдите последний зелёный `decorium-web-release` в пределах retention window, проверьте его release manifest командой ниже и опубликуйте **точное** содержимое сохранённого `dist`:

```bash
node scripts/verify-release-artifact.mjs <artifact>/release-manifest.json
```

После публикации повторите browser smoke и сравните HUD revision с restored manifest. Rollback завершён только когда CI evidence, manifest и runtime identity указывают на один build.

## Связанные документы

[Architecture overview](../architecture/overview.md) описывает BuildInfo и composition boundary. [Product roadmap](../product/roadmap.md) определяет будущую release observability work. Полная карта находится в [Documentation hub](../README.md).
