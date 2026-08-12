// Загрузчик данных из встроенного объекта DECORIUM_DATA
export class EmbeddedDataLoader {
  static getData() {
    if (!window.DECORIUM_DATA) {
      throw new Error('DECORIUM_DATA не найден. Убедитесь, что embedded-data.js импортирован.');
    }
    return window.DECORIUM_DATA;
  }

  static async loadSchema(schemaName) {
    const data = this.getData();
    const schemaPath = `schemas/${schemaName}`;
    if (data.schemas && data.schemas[schemaPath]) {
      return data.schemas[schemaPath];
    }
    throw new Error(`Схема ${schemaName} не найдена`);
  }

  static async loadLevelSchema() {
    return this.loadSchema('level.schema.json');
  }

  static async loadItemSchema() {
    return this.loadSchema('item.v2.schema.json');
  }

  static async loadScoringParameters() {
    const data = this.getData();
    const path = 'scoring/scoring-parameters.json';
    if (data.scoring && data.scoring[path]) {
      return data.scoring[path];
    }
    throw new Error(`Параметры оценки не найдены`);
  }

  static async loadLevel(levelId) {
    const data = this.getData();
    const levelPath = `levels/${levelId}.json`;
    if (data.levels && data.levels[levelPath]) {
      return data.levels[levelPath];
    }
    throw new Error(`Уровень ${levelId} не найден`);
  }

  static async loadAllItems() {
    const data = this.getData();
    const items = {};
    for (const [path, content] of Object.entries(data.items || {})) {
      items[path] = content;
    }
    return items;
  }

  static async loadAllConstraints() {
    const data = this.getData();
    const constraints = {};
    for (const [path, content] of Object.entries(data.constraints || {})) {
      constraints[path] = content;
    }
    return constraints;
  }

  static async loadAllStyles() {
    const data = this.getData();
    const styles = {};
    for (const [path, content] of Object.entries(data.styles || {})) {
      styles[path] = content;
    }
    return styles;
  }

  static async loadAllFeedback() {
    const data = this.getData();
    const feedback = {};
    for (const [path, content] of Object.entries(data.feedback || {})) {
      feedback[path] = content;
    }
    return feedback;
  }
}

export default EmbeddedDataLoader;
