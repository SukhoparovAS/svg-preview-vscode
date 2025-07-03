/**
 * Возвращает HTML для webview предпросмотра SVG
 * @param {Array<{name: string, content: string, relPath: string}>} svgArray
 * @returns {string}
 */
function getWebviewContent(svgArray) {
  // Группируем по папкам
  const path = require('path');
  const groups = {};
  svgArray.forEach(svg => {
    const folder = svg.relPath.includes(path.sep)
      ? svg.relPath.slice(0, svg.relPath.lastIndexOf(path.sep) + 1)
      : './';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(svg);
  });

  // Настройки по умолчанию (дублируются из extension.js)
  const SVG_ICON_SIZE = 60;
  const SVG_ITEM_MIN_WIDTH = 32;
  const SVG_GRID_GAP = 12;
  const SVG_GRID_PADDING = 12;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SVG Preview</title>
      <style>
        body { background: #222; color: #fff; margin: 0; font-family: sans-serif; }
        .svg-controls {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 18px 32px 6px 32px;
          background: #23272e;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1.5px solid #333a;
          box-shadow: 0 2px 8px #0002;
          border-radius: 0 0 16px 16px;
        }
        .svg-controls label {
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .svg-controls select {
          margin-left: 6px;
          padding: 6px 18px 6px 10px;
          border-radius: 8px;
          border: 1.5px solid #444;
          background: #23272e;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 4px #0001;
        }
        .svg-controls select:focus, .svg-controls select:hover {
          border: 1.5px solid #ffb300;
          box-shadow: 0 2px 8px #ffb30033;
        }
        .svg-controls input[type='color'] {
          margin-left: 6px;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 1px 4px #0002;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .svg-controls input[type='color']:hover, .svg-controls input[type='color']:focus {
          box-shadow: 0 2px 8px #ffb30055;
        }
        .svg-controls input[type='range'] {
          width: 100px;
        }
        .svg-controls input[type='range']::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          background: #444;
          border-radius: 5px;
        }
        .svg-controls input[type='range']::-webkit-slider-thumb {
          width: 16px;
          height: 16px;
          background: #ffb300;
          border-radius: 50%;
          border: 2px solid #222;
          margin-top: -4px;
        }
        .svg-controls input[type='range']::-moz-range-track {
          width: 100%;
          height: 8px;
          background: #444;
          border-radius: 5px;
        }
        .svg-controls input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #ffb300;
          border-radius: 50%;
          border: 2px solid #222;
          margin-top: -4px;
        }
        .svg-group { margin-bottom: 32px; }
        .svg-group-title {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 12px 0;
          color: #ffb300;
          background: linear-gradient(90deg, #23272e 80%, #ffb30022 100%);
          padding: 8px 20px 8px 16px;
          border-radius: 10px 24px 24px 10px;
          box-shadow: 0 2px 8px #0002;
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 6px solid #ffb300;
          letter-spacing: 0.5px;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .svg-folder-icon {
          font-size: 18px;
          margin-right: 6px;
        }
        .svg-list { display: flex; flex-wrap: wrap; gap: ${SVG_GRID_GAP}px; padding: ${SVG_GRID_PADDING}px; }
        .svg-item { background: #fff; color: #000; border-radius: 8px; box-shadow: 0 2px 8px #0003; padding: 6px; display: flex; flex-direction: column; align-items: center; min-width: ${SVG_ITEM_MIN_WIDTH}px; }
        .svg-box {
          width: ${SVG_ICON_SIZE}px;
          height: ${SVG_ICON_SIZE}px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid #bbb;
          border-radius: 6px;
          position: relative;
          background: var(--svg-bg, #f0f0f0);
          color: #000;
        }
        .svg-box svg {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain;
          display: block;
        }
        .svg-tooltip {
          display: none;
          position: fixed;
          background: #333;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 9999;
          pointer-events: none;
          max-width: 400px;
          white-space: pre;
        }
        .svg-copied {
          position: fixed;
          left: 50%;
          top: 30px;
          transform: translateX(-50%);
          background: #4caf50;
          color: #fff;
          padding: 8px 20px;
          border-radius: 6px;
          font-size: 15px;
          z-index: 10000;
          box-shadow: 0 2px 8px #0005;
          opacity: 0.95;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="svg-controls">
        <label>
          Background:
          <select id="bg-type">
            <option value="stripes">Stripes</option>
            <option value="solid">Solid</option>
            <option value="none">None</option>
          </select>
        </label>
        <label>
          Color:
          <input type="color" id="bg-color" value="#f0f0f0">
        </label>
        <label>
          Size:
          <input type="range" id="icon-size" min="32" max="200" value="${SVG_ICON_SIZE}" style="vertical-align:middle;">
          <span id="icon-size-value">${SVG_ICON_SIZE}</span>px
        </label>
      </div>
      ${Object.entries(groups).map(([folder, svgs]) => `
        <div class="svg-group">
          <div class="svg-group-title"><span class="svg-folder-icon">📁</span>${folder}</div>
          <div class="svg-list">
            ${svgs.map(svg => `
              <div class="svg-item">
                <div class="svg-box" data-tooltip="${svg.name}" data-relpath="${svg.relPath}">${svg.content}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <div id="svg-tooltip" class="svg-tooltip"></div>
      <div id="svg-copied" class="svg-copied">Path copied!</div>
      <script>
        const tooltip = document.getElementById('svg-tooltip');
        const copied = document.getElementById('svg-copied');
        const bgType = document.getElementById('bg-type');
        const bgColor = document.getElementById('bg-color');
        const svgBoxes = document.querySelectorAll('.svg-box[data-tooltip]');
        const iconSizeSlider = document.getElementById('icon-size');
        const iconSizeValue = document.getElementById('icon-size-value');

        function updateIconSize() {
          const size = iconSizeSlider.value;
          iconSizeValue.textContent = size;
          document.querySelectorAll('.svg-box[data-tooltip]').forEach(box => {
            box.style.width = size + 'px';
            box.style.height = size + 'px';
            const svg = box.querySelector('svg');
            if (svg) {
              let width = svg.getAttribute('width');
              let height = svg.getAttribute('height');
              svg.removeAttribute('width');
              svg.removeAttribute('height');
              if (!svg.hasAttribute('viewBox')) {
                width = width || 100;
                height = height || 100;
                svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
              }
              svg.innerHTML = svg.innerHTML
                .replace(/fill=['\"]inherit['\"]/gi, 'fill="currentColor"')
                .replace(/stroke=['\"]inherit['\"]/gi, 'stroke="currentColor"')
                .replace(/style=['\"][^'\"]*fill:\s*inherit;?[^'\"]*['\"]/gi, function(match) {
                  return match.replace(/fill:\s*inherit;?/gi, 'fill:currentColor;');
                })
                .replace(/style=['\"][^'\"]*stroke:\s*inherit;?[^'\"]*['\"]/gi, function(match) {
                  return match.replace(/stroke:\s*inherit;?/gi, 'stroke:currentColor;');
                });
            }
          });
        }

        function updateBackground() {
          let color = bgColor.value;
          let type = bgType.value;
          let bg = '';
          if (type === 'stripes') {
            bg = 'repeating-linear-gradient(135deg, ' + color + ' 0 10px, #fff 10px 20px)';
          } else if (type === 'solid') {
            bg = color;
          } else {
            bg = 'transparent';
          }
          document.querySelectorAll('.svg-box[data-tooltip]').forEach(box => {
            box.style.background = bg;
          });
        }

        function saveSettings() {
          localStorage.setItem('svgPreview_bgType', bgType.value);
          localStorage.setItem('svgPreview_bgColor', bgColor.value);
          localStorage.setItem('svgPreview_iconSize', iconSizeSlider.value);
        }
        function loadSettings() {
          const bgTypeVal = localStorage.getItem('svgPreview_bgType');
          const bgColorVal = localStorage.getItem('svgPreview_bgColor');
          const iconSizeVal = localStorage.getItem('svgPreview_iconSize');
          if (bgTypeVal) bgType.value = bgTypeVal;
          if (bgColorVal) bgColor.value = bgColorVal;
          if (iconSizeVal) iconSizeSlider.value = iconSizeVal;
        }

        loadSettings();
        updateBackground();
        updateIconSize();

        bgType.addEventListener('change', () => { updateBackground(); saveSettings(); });
        bgColor.addEventListener('input', () => { updateBackground(); saveSettings(); });
        iconSizeSlider.addEventListener('input', () => { updateIconSize(); saveSettings(); });

        svgBoxes.forEach(el => {
          el.addEventListener('mouseenter', e => {
            tooltip.textContent = el.getAttribute('data-tooltip');
            tooltip.style.display = 'block';
          });
          el.addEventListener('mousemove', e => {
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
          });
          el.addEventListener('mouseleave', e => {
            tooltip.style.display = 'none';
          });
          el.addEventListener('click', e => {
            const relPath = el.getAttribute('data-relpath');
            if (relPath) {
              navigator.clipboard.writeText(relPath).then(() => {
                copied.style.display = 'block';
                setTimeout(() => { copied.style.display = 'none'; }, 1200);
              });
            }
          });
        });
      </script>
    </body>
    </html>
  `;
}

module.exports = { getWebviewContent }; 