# ADR-007: Feedback Message Mapping

## Status
Accepted — implemented

## Decision

Feedback строится детерминированно по цепочке:

```text
Violation.messageKey → data/feedback/scandinavian-feedback.json → template → rendered Russian text
```

Каждое constraint JSON содержит `messageKey`. `JsonFeedbackCatalog.getEvaluationFeedback()` подставляет `{threshold}` и `{value}`, добавляет `success-excellent`/`success-good` для хороших результатов и `tip-more-items`, если сообщений нет.

## Canonical format

```json
{
  "id": "scand-wood-low",
  "category": "violation",
  "template": "Слишком мало дерева... {threshold} ... {value}.",
  "severity": "high"
}
```

## Consequences

Сообщения контролируются дизайнерами и не требуют LLM/API. Новая constraint должна иметь соответствующий message entry либо безопасно отображаться без динамического текста. Localization и advanced prioritization — post-MVP.
