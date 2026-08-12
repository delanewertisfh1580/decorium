import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Функция для рекурсивного чтения всех JSON файлов
function readAllJsonFiles(dir, baseDir = dir) {
  const result = {};
  if (!fs.existsSync(dir)) return result;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result[entry.name] = readAllJsonFiles(fullPath, baseDir);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const relativePath = path.relative(baseDir, fullPath);
      result[relativePath] = JSON.parse(content);
    }
  }
  return result;
}

// Читаем все данные
const dataDir = path.join(rootDir, 'data');
const allData = readAllJsonFiles(dataDir);

// Преобразуем в JS объект для вставки
const dataConst = `window.DECORIUM_DATA = ${JSON.stringify(allData, null, 2)};`;

// Записываем во временный файл который будет импортирован
const outputPath = path.join(rootDir, 'src', 'embedded-data.js');
fs.writeFileSync(outputPath, dataConst, 'utf8');

console.log('✓ Данные встроены в src/embedded-data.js');
console.log(`  Всего файлов данных: ${Object.keys(allData.items || {}).length + Object.keys(allData.levels || {}).length + Object.keys(allData.schemas || {}).length}`);
