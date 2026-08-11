#!/usr/bin/env node

/**
 * Pre-build проверка: гарантирует, что src/main.js существует перед сборкой.
 * Это предотвращает сборку устаревшего/битого кода.
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const mainPath = join(rootDir, 'src', 'main.js');

if (!existsSync(mainPath)) {
    console.error('❌ ОШИБКА: src/main.js не найден!');
    console.error('   Без главного файла сборки build невозможен.');
    console.error('   Проверьте, что исходники находятся в src/.');
    process.exit(1);
}

console.log('✓ src/main.js найден, продолжаем сборку...');
