export class SchemaLoader {
  static async load(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load schema: ${path}`);
    return response.json();
  }

  static async loadLevelSchema() {
    return this.load('./data/schemas/level.schema.json');
  }

  static async loadClientBriefSchema() {
    return this.load('./data/briefs/client-brief.v2.schema.json');
  }

  static async loadStyleConstraintCatalogSchema() {
    return this.load('./data/styles/style-constraint-catalog.v1.schema.json');
  }

  static async loadItemSchema() {
    return this.load('./data/items/item.v3.schema.json');
  }

  static async loadPresentationEnvironmentSchema() {
    return this.load('./data/presentation/environment-profile.v2.schema.json');
  }
}

export default SchemaLoader;
