/**
 * Infrastructure: SchemaLoader
 * Loads JSON Schema definitions for validation.
 * Browser-compatible version using fetch API.
 */
export class SchemaLoader {
  /**
   * Load level schema from schemas directory
   * @returns {Promise<Object>} The level schema object
   */
  static async loadLevelSchema() {
    try {
      const response = await fetch('./data/schemas/level.schema.json');
      
      if (!response.ok) {
        if (response.status === 404) {
          // Return a minimal default schema if file not found
          console.warn('Level schema not found, using default schema');
          return {
            type: 'object',
            properties: {
              id: { type: 'string' },
              roomId: { type: 'string' },
              items: { type: 'array' },
              constraints: { type: 'array' },
              styleId: { type: 'string' }
            },
            required: ['id', 'roomId']
          };
        }
        throw new Error(`Failed to load schema: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        // Return default schema on network errors
        console.warn('Network error loading schema, using default schema');
        return {
          type: 'object',
          properties: {
            id: { type: 'string' },
            roomId: { type: 'string' },
            items: { type: 'array' },
            constraints: { type: 'array' },
            styleId: { type: 'string' }
          },
          required: ['id', 'roomId']
        };
      }
      throw error;
    }
  }

  /**
   * Load a specific schema by name
   * @param {string} schemaName - Name of the schema file (without .json)
   * @returns {Promise<Object>} The schema object
   */
  static async loadSchema(schemaName) {
    const response = await fetch(`./data/schemas/${schemaName}.schema.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to load schema ${schemaName}: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export default SchemaLoader;
