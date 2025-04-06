const fs = require('fs');
const path = require('path');

// Обеспечиваем существование директории renderer
const rendererDir = path.join(__dirname, 'dist', 'renderer');
if (!fs.existsSync(rendererDir)) {
  fs.mkdirSync(rendererDir, { recursive: true });
  console.log('Создана директория dist/renderer');
}

// Копируем HTML файл
const sourceHtml = path.join(__dirname, 'src', 'renderer', 'index.html');
const destHtml = path.join(rendererDir, 'index.html');

try {
  const htmlContent = fs.readFileSync(sourceHtml, 'utf8');
  fs.writeFileSync(destHtml, htmlContent);
  console.log('HTML файл успешно скопирован в dist/renderer/index.html');
} catch (error) {
  console.error('Ошибка при копировании HTML файла:', error);
  process.exit(1);
}