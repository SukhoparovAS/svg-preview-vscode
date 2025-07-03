const fs = require('fs');
const path = require('path');

/**
 * Рекурсивно ищет все SVG-файлы в папке и подпапках
 * @param {string} dir - Папка для поиска
 * @param {function} callback - Колбэк с результатом (массив файлов)
 * @param {string} [baseDir=dir] - Базовая папка для относительных путей
 * @param {Array} [results=[]] - Аккумулирующий массив
 */
function getAllSvgFiles(dir, callback, baseDir = dir, results = []) {
  fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      callback(results);
      return;
    }
    let pending = entries.length;
    if (!pending) {
      callback(results);
      return;
    }
    entries.forEach((entry) => {
      const absPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, absPath);
      if (entry.isDirectory()) {
        getAllSvgFiles(absPath, (res) => {
          results = res;
          if (!--pending) callback(results);
        }, baseDir, results);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".svg") {
        results.push({ name: entry.name, absPath, relPath });
        if (!--pending) callback(results);
      } else {
        if (!--pending) callback(results);
      }
    });
  });
}

module.exports = { getAllSvgFiles }; 