// =============================================================================
// Конфигурация Vite
// Задача: один самодостаточный UI-бандл плюс доступные runtime JSON-ассеты.
// =============================================================================
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { STATIC_DATA_FILES } from './src/Infrastructure/DataLoaders/staticDataAssets.js';

function staticDataAssetsPlugin() {
  let projectRoot;

  return {
    name: 'decorium-static-data-assets',
    apply: 'build',
    configResolved(config) {
      projectRoot = config.root;
    },
    generateBundle() {
      for (const relativePath of STATIC_DATA_FILES) {
        this.emitFile({
          type: 'asset',
          fileName: relativePath,
          source: readFileSync(resolve(projectRoot, relativePath), 'utf8')
        });
      }
    }
  };
}

export default defineConfig({
  // Относительный base, чтобы HTML и JSON работали на Render и в подпапке.
  base: './',
  plugins: [viteSingleFile(), staticDataAssetsPlugin()],
  build: {
    // Не понижаем современный синтаксис: код three.js остаётся как есть.
    target: 'esnext'
  }
});

export { STATIC_DATA_FILES, staticDataAssetsPlugin };