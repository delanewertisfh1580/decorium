export class SchemaLoader {
  static async load(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load schema: ${path}`);
    return response.json();
  }

  static async loadLevelSchema() {
    return this.load('./data/schemas/level.v2.schema.json');
  }

  static async loadClientBriefSchema() {
    return this.load('./data/briefs/client-brief.v2.schema.json');
  }

  static async loadStyleConstraintCatalogSchema() {
    return this.load('./data/styles/style-constraint-catalog.v1.schema.json');
  }

  static async loadItemSchema() {
    return this.load('./data/items/item.v5.schema.json');
  }

  static async loadPresentationEnvironmentSchema() {
    return this.load('./data/presentation/environment-profile.v3.schema.json');
  }

  static async loadInteriorRecipeSchema() {
    return this.load('./data/interior/interior-recipe.v1.schema.json');
  }

  static async loadSurfaceFinishSchema() {
    return this.load('./data/interior/surface-finish.v1.schema.json');
  }

  static async loadProgressionRewardSchema() {
    return this.load('./data/progression/reward-catalog.v1.schema.json');
  }
}

export default SchemaLoader;
