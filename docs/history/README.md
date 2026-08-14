# Historical documentation

Этот каталог содержит сохранённые документы предыдущих этапов Decorium. Они полезны для аудита решений и археологии проекта, но **не являются актуальным source of truth**. Для текущего продукта, архитектуры, content authoring и releases используйте [Documentation hub](../README.md).

| Каталог / файл | Содержимое | Как использовать |
|---|---|---|
| `mvp/` | Первоначальные charter, scope, risks и definition of done. | Только как historical baseline; их MVP границы заменены production baseline. |
| `mvp-decomposition.md` | Предыдущая MVP декомпозиция. | История ранних contracts; не описывает Catalog V3, progression или ergonomics. |
| `slices/` | Завершённые vertical slice reports, включая PROD и UI work. | Evidence реализованной работы; не повторяет active guides. |
| `verification/` | Browser smoke records и hotfix evidence. | Трассируемость прошлых release checks. |
| `proposals/` | Проектные предложения, предшествовавшие implementation. | Использовать для контекста решения, не как live specification. |
| `architecture-layers-mvp.md` | Ранняя layer summary. | Заменена [active architecture overview](../architecture/overview.md). |
| `item-catalog-mvp.md` | Предыдущий V2 catalog description. | Заменён [current content model](../systems/content-model.md). |
| `production-backlog-2026-08-13.md` | Исходный production backlog. | Выполненные и изменённые направления заменены [current roadmap](../product/roadmap.md). |

Historical files intentionally retain their original wording, even where it no longer matches production code. Если с ними нужна работа, добавляйте явную historical annotation или новый active document — не переписывайте историю так, чтобы потерять traceability.
