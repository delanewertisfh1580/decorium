import Ajv from 'ajv';
import InteriorGenerationRecipe from '../../Domain/Rooms/InteriorGenerationRecipe.js';

export class JsonInteriorRecipeRepository {
  constructor(catalogPath = './data/interior/interior-recipes.v1.json', schema = null) {
    this.catalogPath = catalogPath;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.catalogPromise = null;
  }

  async getById(recipeId) {
    if (typeof recipeId !== 'string' || recipeId.trim() === '') return null;
    const catalog = await this._loadCatalog();
    const raw = catalog.recipes.find(recipe => recipe.id === recipeId) ?? null;
    return raw ? new InteriorGenerationRecipe(raw) : null;
  }

  async _loadCatalog() {
    if (!this.catalogPromise) this.catalogPromise = this._fetchCatalog();
    return this.catalogPromise;
  }

  async _fetchCatalog() {
    const response = await fetch(this.catalogPath);
    if (!response.ok) throw new Error(`Failed to load interior recipe catalog: ${response.status}`);
    const catalog = await response.json();
    if (this.validate && !this.validate(catalog)) {
      const errors = this.validate.errors?.map(error => error.message).join(', ');
      throw new Error(`Interior recipe schema validation failed: ${errors}`);
    }
    return catalog;
  }
}

export default JsonInteriorRecipeRepository;
