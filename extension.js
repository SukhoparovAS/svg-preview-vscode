const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { getWebviewContent } = require("./webviewTemplate");
const { getAllSvgFiles } = require("./fsUtils");

// === SVG Preview Settings ===
const SVG_ICON_SIZE = 60; // px
const SVG_ITEM_MIN_WIDTH = 32; // px
const SVG_GRID_GAP = 12; // px
const SVG_GRID_PADDING = 12; // px
// ===========================

/**
 * Активация расширения
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand("svgPreview.open", (uri) => {
    if (!uri) {
      vscode.window.showErrorMessage("No file or folder selected");
      return;
    }

    fs.stat(uri.fsPath, (err, stats) => {
      if (err) {
        vscode.window.showErrorMessage("Error accessing file or folder");
        return;
      }

      if (stats.isFile() && path.extname(uri.fsPath).toLowerCase() === ".svg") {
        // Открываем один SVG-файл
        fs.readFile(uri.fsPath, "utf8", (err, data) => {
          const panel = vscode.window.createWebviewPanel(
            "svgPreview",
            `SVG Preview: ${path.basename(uri.fsPath)}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
          );
          if (err) {
            panel.webview.html = `<h2>Error loading SVG</h2><pre>${err.message}</pre>`;
            return;
          }
          panel.webview.html = getWebviewContent([
            {
              name: path.basename(uri.fsPath),
              content: data,
              relPath: path.basename(uri.fsPath)
            },
          ]);
        });
      } else if (stats.isDirectory()) {
        // Рекурсивно ищем все SVG-файлы в папке и подпапках
        getAllSvgFiles(uri.fsPath, (svgFiles) => {
          if (svgFiles.length === 0) {
            vscode.window.showInformationMessage(
              "No SVG files found in this folder or its subfolders."
            );
            return;
          }
          // Читаем все SVG-файлы асинхронно
          Promise.all(svgFiles.map(fileObj =>
            fs.promises.readFile(fileObj.absPath, "utf8")
              .then(data => ({ name: fileObj.name, content: data, relPath: fileObj.relPath }))
              .catch(() => null)
          )).then(svgContents => {
            svgContents = svgContents.filter(Boolean);
            const panel = vscode.window.createWebviewPanel(
              "svgPreview",
              `SVG Preview: ${path.basename(uri.fsPath)}`,
              vscode.ViewColumn.One,
              { enableScripts: true }
            );
            panel.webview.html = getWebviewContent(svgContents);
          });
        });
      } else {
        vscode.window.showErrorMessage(
          "Please select an SVG file or a folder."
        );
      }
    });
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
