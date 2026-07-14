import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_HEADER,
  contrast,
  exemptPairs,
  repoRoot,
  textPairs,
  uiPairs
} from "./contrast.mjs";

const REPO_NAME = "midas-visual-theme";
const PAGES_BASE_PATH = `/${REPO_NAME}/`;
const REPO_URL = `https://github.com/midas-network/${REPO_NAME}`;

const distDir = path.join(repoRoot, "dist");
const siteDir = path.join(repoRoot, "site");

function readDist(fileName) {
  return fs.readFileSync(path.join(distDir, fileName), "utf8");
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function tokenValue(tokens, mode, name) {
  return tokens[mode][name]?.$value;
}

function cssVariable(tokens, name) {
  return tokens.light[name]?.cssVariable || tokens.dark[name]?.cssVariable;
}

function tokenButton(tokens, name, label = name) {
  const light = tokenValue(tokens, "light", name);
  const dark = tokenValue(tokens, "dark", name) || light;
  const variable = cssVariable(tokens, name);
  return `<button class="swatch" type="button" data-token="${htmlEscape(name)}" data-light="${htmlEscape(light)}" data-dark="${htmlEscape(dark)}" title="Copy ${htmlEscape(name)}">
    <span class="chip" style="background: var(${htmlEscape(variable)});"></span>
    <span class="swatch-name">${htmlEscape(label)}</span>
    <span class="swatch-value">${htmlEscape(light)}</span>
  </button>`;
}

function swatchGrid(title, description, names, tokens) {
  return `<section class="panel">
    <div class="section-heading">
      <h2>${htmlEscape(title)}</h2>
      <p>${htmlEscape(description)}</p>
    </div>
    <div class="swatch-grid">
      ${names.map((name) => tokenButton(tokens, name)).join("\n")}
    </div>
  </section>`;
}

function contrastRows(tokens) {
  const rows = [];
  for (const mode of ["light", "dark"]) {
    for (const [kind, pairGroup] of [
      ["Text", textPairs],
      ["UI", uiPairs]
    ]) {
      for (const [name, foregroundPath, backgroundPath, threshold] of pairGroup) {
        const foreground = tokenValue(tokens, mode, foregroundPath);
        const background = tokenValue(tokens, mode, backgroundPath);
        const ratio = contrast(foreground, background);
        rows.push({ mode, kind, name, foreground, background, threshold, ratio });
      }
    }
  }
  return rows;
}

function passBadge(label, pass) {
  return `<span class="badge ${pass ? "pass" : "fail"}">${label} ${pass ? "pass" : "fail"}</span>`;
}

function contrastTable(tokens) {
  return `<section class="panel">
    <div class="section-heading">
      <h2>Contrast Gate</h2>
      <p>WCAG 2.x ratios are generated from the same function that fails the build on regression.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mode</th>
            <th>Pair</th>
            <th>Foreground</th>
            <th>Background</th>
            <th>Ratio</th>
            <th>Badges</th>
          </tr>
        </thead>
        <tbody>
          ${contrastRows(tokens)
            .map(
              (row) => `<tr>
                <td>${htmlEscape(row.mode)}</td>
                <td>${htmlEscape(row.name)}</td>
                <td><code>${htmlEscape(row.foreground)}</code></td>
                <td><code>${htmlEscape(row.background)}</code></td>
                <td>${row.ratio.toFixed(2)}:1</td>
                <td class="badges">
                  ${passBadge("AA", row.ratio >= 4.5)}
                  ${passBadge("AAA", row.ratio >= 7)}
                  ${passBadge("UI", row.ratio >= 3)}
                </td>
              </tr>`
            )
            .join("\n")}
        </tbody>
      </table>
    </div>
    <p class="note">Intentional non-gates: ${exemptPairs
      .map(([name]) => htmlEscape(name))
      .join(", ")}. These are decorative or data-viz furniture tokens; categorical fills must be paired with labels or patterns.</p>
  </section>`;
}

function chartDemo(tokens) {
  const labels = [
    ["Modeling", "midas.cat.1", 22],
    ["Vaccines", "midas.cat.2", 18],
    ["Mobility", "midas.cat.3", 14],
    ["Surveillance", "midas.cat.4", 16],
    ["Genomics", "midas.cat.5", 12],
    ["Other themes", "midas.cat.other", 18]
  ];
  let x = 0;
  const total = labels.reduce((sum, item) => sum + item[2], 0);
  const rects = labels
    .map(([label, tokenName, value]) => {
      const width = (value / total) * 680;
      const rect = `<rect x="${x.toFixed(2)}" y="20" width="${width.toFixed(2)}" height="56" fill="var(${cssVariable(tokens, tokenName)})"><title>${htmlEscape(label)}: ${value}%</title></rect>`;
      x += width;
      return rect;
    })
    .join("\n");
  const legend = labels
    .map(
      ([label, tokenName, value]) => `<li>
        <span class="legend-chip" style="background: var(${cssVariable(tokens, tokenName)});"></span>
        <span>${htmlEscape(label)} <strong>${value}%</strong></span>
      </li>`
    )
    .join("\n");

  return `<section class="panel">
    <div class="section-heading">
      <h2>Chart Demo</h2>
      <p>Categorical colours are shown with labels, so meaning is never conveyed by colour alone.</p>
    </div>
    <svg class="chart-demo" viewBox="0 0 680 96" role="img" aria-labelledby="chart-title chart-desc">
      <title id="chart-title">Stacked bar using MIDAS categorical colours</title>
      <desc id="chart-desc">A labeled stacked bar demonstrates categorical colour usage with a separate legend.</desc>
      ${rects}
      <line x1="0" y1="80" x2="680" y2="80" stroke="var(--chart-axis)" />
    </svg>
    <ul class="legend">${legend}</ul>
  </section>`;
}

function pageStyles() {
  return `
    * { box-sizing: border-box; }
    html { color-scheme: light dark; }
    body {
      margin: 0;
      background: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-sans);
      line-height: 1.5;
    }
    code { font-family: var(--font-mono); }
    a { color: var(--color-link); }
    a:hover { color: var(--color-link-hover); }
    .shell { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
    header {
      display: grid;
      gap: 16px;
      padding: 28px 0 22px;
      border-bottom: var(--border-hairline);
    }
    h1 { margin: 0; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.05; }
    h2 { margin: 0; font-size: 1.35rem; }
    p { margin: 0; }
    .lede { max-width: 760px; color: var(--color-text-muted); font-size: 1.1rem; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px 16px; color: var(--color-text-muted); font-size: 0.94rem; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .toggle {
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-pill);
      background: var(--color-surface);
      color: var(--color-text);
      padding: 8px 14px;
      cursor: pointer;
      font: inherit;
    }
    .toggle:focus-visible,
    .swatch:focus-visible {
      outline: 3px solid var(--color-focus-ring);
      outline-offset: 2px;
    }
    main { display: grid; gap: 22px; margin-top: 24px; }
    .panel {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      padding: 20px;
    }
    .section-heading { display: grid; gap: 4px; margin-bottom: 14px; }
    .section-heading p,
    .note { color: var(--color-text-muted); }
    .swatch-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(172px, 1fr));
      gap: 10px;
    }
    .swatch {
      display: grid;
      grid-template-columns: 42px 1fr;
      gap: 4px 10px;
      align-items: center;
      min-height: 64px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-alt);
      color: var(--color-text);
      padding: 10px;
      cursor: pointer;
      text-align: left;
      font: inherit;
    }
    .chip {
      grid-row: span 2;
      width: 42px;
      height: 42px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(0,0,0,0.16);
    }
    .swatch-name { font-weight: 700; font-size: 0.92rem; }
    .swatch-value { color: var(--color-text-muted); font-family: var(--font-mono); font-size: 0.86rem; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 880px; }
    th, td { padding: 9px 10px; border-bottom: 1px solid var(--color-border); text-align: left; vertical-align: top; }
    th { color: var(--color-text-muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge {
      display: inline-flex;
      border-radius: var(--radius-pill);
      padding: 2px 8px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .badge.pass { background: var(--color-success-bg); color: var(--color-success-text); }
    .badge.fail { background: var(--color-danger-bg); color: var(--color-danger-text); }
    .chart-demo { width: 100%; height: auto; border: 1px solid var(--chart-gridline); border-radius: var(--radius-sm); background: var(--chart-surface); }
    .legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
      margin: 14px 0 0;
      padding: 0;
      list-style: none;
    }
    .legend li { display: flex; gap: 8px; align-items: center; }
    .legend-chip { width: 16px; height: 16px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.16); }
    .toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 160ms ease, transform 160ms ease;
      background: var(--color-info-bg);
      color: var(--color-info-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      box-shadow: var(--shadow-md);
      pointer-events: none;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
  `;
}

function pageScript() {
  return `
    const root = document.documentElement;
    const toggle = document.querySelector('[data-theme-toggle]');
    const toast = document.querySelector('[data-toast]');

    function activeTheme() {
      return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function refreshSwatches() {
      const mode = activeTheme();
      document.querySelectorAll('.swatch').forEach((swatch) => {
        swatch.querySelector('.swatch-value').textContent = swatch.dataset[mode];
      });
      toggle.textContent = mode === 'dark' ? 'Use light theme' : 'Use dark theme';
      toggle.setAttribute('aria-pressed', String(mode === 'dark'));
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1400);
    }

    toggle.addEventListener('click', () => {
      root.setAttribute('data-theme', activeTheme() === 'dark' ? 'light' : 'dark');
      refreshSwatches();
    });

    document.querySelectorAll('.swatch').forEach((swatch) => {
      swatch.addEventListener('click', async () => {
        const mode = activeTheme();
        const value = swatch.dataset[mode];
        try {
          await navigator.clipboard.writeText(value);
          showToast('Copied ' + swatch.dataset.token + ' ' + value);
        } catch (_error) {
          showToast(swatch.dataset.token + ' ' + value);
        }
      });
    });

    refreshSwatches();
  `;
}

function buildPage() {
  const tokens = JSON.parse(readDist("tokens.resolved.json"));
  const themeCss = readDist("midas-theme.css");
  const generatedDate = new Date().toISOString();
  const groups = [
    swatchGrid(
      "Brand Blue",
      "Chrome, links, and primary action scale.",
      ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"].map(
        (step) => `midas.blue.${step}`
      ),
      tokens
    ),
    swatchGrid(
      "Teal",
      "Secondary and accent colours.",
      ["100", "400", "500", "600"].map((step) => `midas.teal.${step}`),
      tokens
    ),
    swatchGrid(
      "Cool Greys",
      "Neutral scale for surfaces, text, borders, and chart furniture.",
      ["0", "50", "100", "200", "300", "400", "450", "500", "600", "700", "800", "900"].map(
        (step) => `midas.grey.${step}`
      ),
      tokens
    ),
    swatchGrid(
      "Semantic Roles",
      "Application-facing colour roles. Apps should consume these names rather than raw hex.",
      Object.keys(tokens.light).filter((name) => name.startsWith("color.")),
      tokens
    ),
    swatchGrid(
      "Categorical",
      "Fixed order for charts. Assign by entity, never by rank; fold tails into cat-other.",
      [...Array.from({ length: 10 }, (_value, index) => `midas.cat.${index + 1}`), "midas.cat.other"],
      tokens
    ),
    swatchGrid(
      "Sequential",
      "Single-hue low-to-high ramp.",
      Array.from({ length: 7 }, (_value, index) => `midas.seq.${index + 1}`),
      tokens
    ),
    swatchGrid(
      "Diverging",
      "Orange to neutral midpoint to blue.",
      Array.from({ length: 7 }, (_value, index) => `midas.div.${index + 1}`),
      tokens
    )
  ];

  return `<!doctype html>
<!-- ${GENERATED_HEADER} -->
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MIDAS Visual Theme Tokens</title>
  <link rel="icon" href="data:,">
  <style>
${themeCss}
${pageStyles()}
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <h1>MIDAS Visual Theme Tokens</h1>
      <p class="lede">A shared, blue-based MIDAS theme emitted as CSS custom properties, SCSS variables, TypeScript exports, MUI theme options, and machine-readable JSON.</p>
      <div class="meta">
        <span>Generated ${htmlEscape(generatedDate)}</span>
        <span>License Apache-2.0</span>
        <span>Pages base <code>${htmlEscape(PAGES_BASE_PATH)}</code></span>
        <a href="${htmlEscape(REPO_URL)}">Repository</a>
        <a href="tokens.resolved.json">tokens.resolved.json</a>
        <a href="midas-theme.css">midas-theme.css</a>
      </div>
      <div class="toolbar">
        <button class="toggle" type="button" data-theme-toggle aria-pressed="false">Use dark theme</button>
      </div>
    </header>
    <main>
      ${groups.join("\n")}
      ${contrastTable(tokens)}
      ${chartDemo(tokens)}
    </main>
  </div>
  <div class="toast" data-toast role="status" aria-live="polite"></div>
  <script>
${pageScript()}
  </script>
</body>
</html>
`;
}

fs.mkdirSync(siteDir, { recursive: true });
fs.writeFileSync(path.join(siteDir, "index.html"), buildPage());
fs.copyFileSync(path.join(distDir, "tokens.resolved.json"), path.join(siteDir, "tokens.resolved.json"));
fs.copyFileSync(path.join(distDir, "midas-theme.css"), path.join(siteDir, "midas-theme.css"));
fs.copyFileSync(path.join(distDir, "mui-theme.ts"), path.join(siteDir, "mui-theme.ts"));

const llmsSource = path.join(repoRoot, "llms.txt");
if (fs.existsSync(llmsSource)) {
  fs.copyFileSync(llmsSource, path.join(siteDir, "llms.txt"));
}

console.log(`Wrote ${path.relative(repoRoot, path.join(siteDir, "index.html"))}`);
