# ADR-007: Feedback Message Mapping

## Status
Accepted

## Date
2024-01-01

## Owner
Qwen Studio Engineering Team

## Title
Использовать маппинг нарушений на ID сообщений вместо динамической генерации обратной связи

## Context
Игрок должен получать понятную обратную связь о том, как улучшить расстановку.

Подходы к генерации обратной связи:
1. **Динамическая генерация** (LLM или шаблоны с подстановкой) - гибко, но сложно
2. **Маппинг на предустановленные сообщения** - проще, детерминированно, контролируем качество

Для MVP выбран подход с маппингом на ID сообщений.

## Decision
Использовать маппинг: `Violation → MessageId → LocalizedMessage`

### Архитектура

```
Constraint Violation
        ↓
Violation Type + Feature
        ↓
Message ID (string)
        ↓
Message Repository
        ↓
Localized Message (ru/en/etc.)
```

### Пример

**Нарушение:**
```typescript
{
  constraintType: 'style',
  feature: 'wood_share',
  operator: '>=',
  threshold: 0.6,
  actualValue: 0.4,
  penalty: 0.2
}
```

**Маппинг:**
```typescript
const feedbackMap = {
  'style.wood_share.low': 'msg_scandi_wood_low',
  'style.lightcolorshare.low': 'msg_scandi_light_low',
  'style.form_simplicity.low': 'msg_scandi_form_complex'
};
```

**Сообщение в репозитории:**
```json
{
  "id": "msg_scandi_wood_low",
  "title": "Мало дерева",
  "description": "Добавьте больше предметов из дерева для соответствия скандинавскому стилю.",
  "suggestion": "Попробуйте добавить деревянный стул, шкаф или столик."
}
```

### Структура данных

**Feedback Messages JSON:**
```json
{
  "messages": [
    {
      "id": "msg_scandi_wood_low",
      "tags": ["scandinavian", "wood", "materials"],
      "title": {
        "ru": "Мало дерева",
        "en": "Not enough wood"
      },
      "description": {
        "ru": "Добавьте больше предметов из дерева для соответствия скандинавскому стилю.",
        "en": "Add more wooden items to match the Scandinavian style."
      },
      "suggestion": {
        "ru": "Попробуйте добавить деревянный стул, шкаф или столик.",
        "en": "Try adding a wooden chair, cabinet, or small table."
      }
    }
  ]
}
```

### Implementation

```typescript
// Domain/Evaluation/Violation.ts
export class Violation {
  constructor(
    public readonly feature: string,
    public readonly operator: string,
    public readonly threshold: number,
    public readonly actualValue: number
  ) {}
}

// Application/Ports/IFeedbackRepository.ts
export interface IFeedbackRepository {
  getMessage(messageId: string, locale?: string): FeedbackMessage;
  getMessages(messageIds: string[], locale?: string): FeedbackMessage[];
}

// Domain/Scoring/FeedbackMapper.ts
export class FeedbackMapper {
  private static mapping: Record<string, string> = {
    'wood_share:>=': 'msg_wood_low',
    'lightcolorshare:>=': 'msg_light_colors_low',
    'form_simplicity:>=': 'msg_form_too_complex'
  };

  static getMessageId(violation: Violation): string {
    const key = `${violation.feature}:${violation.operator}`;
    return this.mapping[key] || 'msg_generic_improvement';
  }
}
```

## Consequences

### Positive
- Полный контроль над качеством сообщений
- Детерминированная обратная связь (легко тестировать)
- Поддержка локализации через message repository
- Простота добавления новых сообщений
- Можно A/B тестировать разные сообщения

### Negative
- Требуется вручную создавать сообщения для каждого типа нарушения
- Меньше гибкости чем LLM генерация
- Нужно обновлять маппинг при добавлении новых признаков

### Neutral
- Сообщения хранятся отдельно от кода (JSON)
- Дизайнеры могут редактировать тексты без изменения кода

## Message Categories

### Style Violations
- `msg_wood_low` - мало дерева
- `msg_metal_high` - слишком много металла
- `msg_glass_high` - слишком много стекла
- `msg_light_colors_low` - недостаточно светлых цветов
- `msg_warm_palette_low` - недостаточно тёплых тонов
- `msg_form_too_complex` - слишком сложные формы

### Ergonomics Violations (post-MVP)
- `msg_no_walkway` - нет прохода
- `msg_blocked_access` - заблокирован доступ
- `msg_too_close` - предметы слишком близко
- `msg_too_far` - предметы слишком далеко

### Generic Messages
- `msg_generic_improvement` - общее сообщение об улучшении
- `msg_perfect` - идеальная расстановка
- `msg_try_again` - попробуйте ещё раз

## Testing

```typescript
describe('FeedbackMapper', () => {
  it('maps wood_share violation to correct message', () => {
    // Arrange
    const violation = new Violation('wood_share', '>=', 0.6, 0.4);
    
    // Act
    const messageId = FeedbackMapper.getMessageId(violation);
    
    // Assert
    expect(messageId).toBe('msg_wood_low');
  });
  
  it('returns generic message for unknown violations', () => {
    // Arrange
    const violation = new Violation('unknown_feature', '>=', 0.5, 0.3);
    
    // Act
    const messageId = FeedbackMapper.getMessageId(violation);
    
    // Assert
    expect(messageId).toBe('msg_generic_improvement');
  });
});
```

## Post-MVP Enhancements

1. **Приоритизация сообщений** - показывать только топ-3 наиболее важных нарушения
2. **Персонализация тона** - более дружеский/строгий стиль
3. **Визуальные подсказки** - подсветка проблемных зон в комнате
4. **LLM генерация** - динамическая генерация на основе контекста

## Related Documents
- [[Feedback System]](../systems/feedback.md)
- [[MVP Acceptance Criteria]](../mvp/acceptance-criteria.md)
- [[ADR-003: JSON Content Pipeline]](./adr-003-json-content-pipeline.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 1.0 | Qwen Studio | Initial ADR |
