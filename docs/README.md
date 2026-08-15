# Документация Decorium

Этот каталог содержит **актуальную документацию production-версии** игры. Если документ не находится в разделах ниже, он не является текущим источником продуктовых или технических правил.

> **Правило чтения:** начинайте с этого файла. `README.md` репозитория отвечает на вопрос «как запустить и проверить проект», а этот hub — «где находится актуальный контракт и зачем он нужен».

## Быстрый маршрут

| Цель | Читать |
|---|---|
| Запустить, собрать или проверить игру | [README репозитория](../README.md) |
| Понять текущий продукт и игровой цикл | [Product overview](product/overview.md) |
| Выбрать следующую работу | [Production roadmap](product/roadmap.md) |
| Понять границы слоёв и поток данных | [Architecture overview](architecture/overview.md) |
| Изменить JSON-контент, предметы, уровни или scoring rules | [Content model](systems/content-model.md) |
| Выпустить или откатить web-артефакт | [Release runbook](operations/release-runbook.md) |

## Актуальные разделы

### Продукт

[Product overview](product/overview.md) фиксирует shipped gameplay, кампанию, scoring и критерии «что является игрой сейчас». [Production roadmap](product/roadmap.md) содержит только незавершённые production-направления и правила TDD-слайсов.

### Архитектура

[Architecture overview](architecture/overview.md) — единый active reference по Clean Architecture, composition root, data flow и архитектурным инвариантам. Детальные решения не дублируются здесь: они живут в ADR.

### Контент и геймплей

[Content model](systems/content-model.md) описывает versioned JSON contracts: item catalog V3, authored levels, scoring, semantic interaction profiles и functional-layout rules. Он является единственным current reference для content authors.

### Операции

[Release runbook](operations/release-runbook.md) определяет выпуск, проверку и rollback статической web-сборки. Процедура использует release manifest и не требует персональных данных игрока.

### Delivery evidence

[Slice reports](slices/) фиксируют завершённые вертикальные поставки: scope, contracts, acceptance evidence и non-goals. Последний отчёт — [PROD-017: asset-backed PBR room composition pack](slices/PROD-017-room-composition-pbr-asset-pack.md). Эти отчёты являются evidence delivery, но текущие product и technical правила по-прежнему поддерживаются в разделах выше.

### ADR

[ADR index](adr/README.md) хранит короткие неизменяемые записи ключевых решений. ADR не переписываются ради текущей картины: при изменении решения добавляется новый ADR, а актуальная операционная картина поддерживается в разделах выше.

### История

[History index](history/README.md) содержит MVP-charter, завершённые slice reports, smoke evidence, первоначальные proposals и прежние планы. Эти файлы сохранены для трассируемости, но **не должны использоваться как source of truth** для текущего кода или новой работы. Исторический каталог намеренно не дублирует active navigation.

## Правила поддержания документации

| Изменение | Обязательное обновление |
|---|---|
| Новый пользовательский capability | `product/overview.md`; при наличии следующей работы — `product/roadmap.md` |
| Новый или изменённый Domain/content contract | `systems/content-model.md`; schema; при архитектурном решении — новый ADR |
| Изменение слоёв, dependency direction или composition root | `architecture/overview.md` и, при необходимости, ADR |
| Изменение release процесса | `operations/release-runbook.md` |
| Завершённый крупный vertical slice | Отчёт в `slices/`; актуальные product/architecture guides обновляются только по затронутым contracts |

Ссылки в current документах должны быть относительными, а исторические материалы должны явно маркироваться как historical. Перед merge документационные guards, `npm test` и проверка ссылок являются обязательными.
