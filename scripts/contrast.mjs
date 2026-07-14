import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, "..");

export const GENERATED_HEADER =
  "GENERATED — do not edit. Edit tokens/ and run npm run build.";

export const textPairs = [
  ["text/bg", "color.text", "color.bg", 4.5],
  ["text/surface", "color.text", "color.surface", 4.5],
  ["text/surface-alt", "color.text", "color.surface-alt", 4.5],
  ["text-muted/bg", "color.text-muted", "color.bg", 4.5],
  ["text-muted/surface", "color.text-muted", "color.surface", 4.5],
  ["link/surface", "color.link", "color.surface", 4.5],
  ["primary-contrast/primary", "color.primary-contrast", "color.primary", 4.5],
  ["danger-text/danger-bg", "color.danger-text", "color.danger-bg", 4.5],
  ["warning-text/warning-bg", "color.warning-text", "color.warning-bg", 4.5],
  ["success-text/success-bg", "color.success-text", "color.success-bg", 4.5],
  ["info-text/info-bg", "color.info-text", "color.info-bg", 4.5]
];

export const uiPairs = [
  ["focus-ring/surface", "color.focus-ring", "color.surface", 3],
  ["focus-ring/bg", "color.focus-ring", "color.bg", 3],
  ["header-accent/surface", "color.header-accent", "color.surface", 3],
  ["border-strong/surface", "color.border-strong", "color.surface", 3]
];

// WCAG 1.4.11 does not require contrast for decorative dividers, and
// intentionally recessive gridlines/axes are correct data-viz practice.
// Categorical distinctness is governed by WCAG 1.4.1: never use colour alone.
export const exemptPairs = [
  ["border/surface", "color.border", "color.surface"],
  ["chart-gridline/surface", "chart.gridline", "chart.surface"],
  ["chart-axis/surface", "chart.axis", "chart.surface"],
  ["categorical fills/surface", "midas.cat.1", "chart.surface"]
];

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

export function isToken(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "$value")
  );
}

export function deepMerge(...objects) {
  const result = {};

  for (const object of objects) {
    for (const [key, value] of Object.entries(object || {})) {
      const current = result[key];
      const canMerge =
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !isToken(value) &&
        current &&
        typeof current === "object" &&
        !Array.isArray(current) &&
        !isToken(current);

      result[key] = canMerge ? deepMerge(current, value) : clone(value);
    }
  }

  return result;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function flattenTokens(tree, prefix = [], out = []) {
  if (isToken(tree)) {
    out.push({
      path: prefix,
      name: prefix.join("."),
      cssVariable: toCssVariable(prefix),
      token: tree
    });
    return out;
  }

  for (const [key, value] of Object.entries(tree || {})) {
    flattenTokens(value, [...prefix, key], out);
  }

  return out;
}

export function getByPath(tree, tokenPath) {
  const parts = Array.isArray(tokenPath) ? tokenPath : tokenPath.split(".");
  let current = tree;
  for (const part of parts) {
    current = current?.[part];
  }
  return current;
}

export function toCssVariable(tokenPath) {
  return `--${tokenPath.join("-")}`;
}

export function toScssVariable(tokenPath) {
  return `$${tokenPath.join("-")}`;
}

export function resolveValue(value, root, stack = []) {
  if (typeof value !== "string") return value;

  const exactReference = /^\{([^}]+)\}$/.exec(value);
  if (exactReference) {
    return resolveReference(exactReference[1], root, stack);
  }

  return value.replace(/\{([^}]+)\}/g, (_match, reference) =>
    String(resolveReference(reference, root, stack))
  );
}

export function resolveReference(reference, root, stack = []) {
  if (stack.includes(reference)) {
    throw new Error(`Circular token reference: ${[...stack, reference].join(" -> ")}`);
  }

  const token = getByPath(root, reference);
  if (!isToken(token)) {
    throw new Error(`Unable to resolve token reference: ${reference}`);
  }

  return resolveValue(token.$value, root, [...stack, reference]);
}

export function resolveTree(tree, root = tree) {
  if (isToken(tree)) {
    return {
      ...tree,
      $value: resolveValue(tree.$value, root)
    };
  }

  const resolved = {};
  for (const [key, value] of Object.entries(tree || {})) {
    resolved[key] = resolveTree(value, root);
  }
  return resolved;
}

export function valuesTree(resolvedTree) {
  if (isToken(resolvedTree)) return resolvedTree.$value;

  const out = {};
  for (const [key, value] of Object.entries(resolvedTree || {})) {
    out[key] = valuesTree(value);
  }
  return out;
}

export function loadTokenState() {
  const primitive = readJson("tokens/primitive.json");
  const semantic = readJson("tokens/semantic.json");
  const darkOverridesRaw = readJson("tokens/modes/dark.json");

  const lightRaw = deepMerge(primitive, semantic);
  const darkRaw = deepMerge(lightRaw, darkOverridesRaw);
  const light = resolveTree(lightRaw, lightRaw);
  const dark = resolveTree(darkRaw, darkRaw);
  const darkOverrides = resolveOverrides(darkOverridesRaw, darkRaw);

  return {
    primitive,
    semantic,
    darkOverridesRaw,
    lightRaw,
    darkRaw,
    light,
    dark,
    darkOverrides,
    lightTokens: flattenTokens(light),
    darkTokens: flattenTokens(dark),
    darkOverrideTokens: flattenTokens(darkOverrides)
  };
}

function resolveOverrides(overrides, root) {
  if (isToken(overrides)) {
    return {
      ...overrides,
      $value: resolveValue(overrides.$value, root)
    };
  }

  const out = {};
  for (const [key, value] of Object.entries(overrides || {})) {
    out[key] = resolveOverrides(value, root);
  }
  return out;
}

export function tokenMap(tokens) {
  return new Map(tokens.map((token) => [token.name, token]));
}

export function buildResolvedArtifact() {
  const state = loadTokenState();
  const light = entriesForArtifact(state.lightTokens);
  const dark = entriesForArtifact(state.darkTokens);
  const darkOverrides = entriesForArtifact(state.darkOverrideTokens);

  return {
    "$schema": "https://design-tokens.github.io/community-group/format/",
    "name": "@midasnetwork/tokens",
    "version": "0.1.0",
    "description": "MIDAS visual theme tokens resolved from DTCG source files.",
    "light": Object.fromEntries(light),
    "dark": Object.fromEntries(dark),
    "darkOverrides": Object.fromEntries(darkOverrides),
    "contrast": {
      "gatedTextPairs": textPairs.map(([name, foreground, background, threshold]) => ({
        name,
        foreground,
        background,
        threshold
      })),
      "gatedUiPairs": uiPairs.map(([name, foreground, background, threshold]) => ({
        name,
        foreground,
        background,
        threshold
      })),
      "intentionalExemptions": exemptPairs.map(([name, foreground, background]) => ({
        name,
        foreground,
        background,
        reason:
          "Decorative dividers, recessive chart furniture, and categorical fills are not numeric contrast gates; pair colour with labels or patterns."
      }))
    }
  };
}

function entriesForArtifact(tokens) {
  return tokens.map(({ name, cssVariable, token }) => [
    name,
    {
      "$value": token.$value,
      "$type": token.$type,
      "$description": token.$description,
      "cssVariable": cssVariable
    }
  ]);
}

export function getResolvedHex(modeMap, tokenPath) {
  const token = modeMap.get(tokenPath);
  if (!token) throw new Error(`Missing token for contrast pair: ${tokenPath}`);

  const value = token.token.$value;
  if (typeof value !== "string" || !value.startsWith("#")) {
    throw new Error(`Token ${tokenPath} does not resolve to a hex colour: ${value}`);
  }
  return value;
}

export function contrast(hex1, hex2) {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  const normalized = hex.trim().replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }

  return {
    r: parseInt(expanded.slice(0, 2), 16) / 255,
    g: parseInt(expanded.slice(2, 4), 16) / 255,
    b: parseInt(expanded.slice(4, 6), 16) / 255
  };
}

function relativeLuminance({ r, g, b }) {
  return [r, g, b]
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    )
    .reduce(
      (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
      0
    );
}

export function evaluateContrastGate() {
  const state = loadTokenState();
  const modes = {
    light: tokenMap(state.lightTokens),
    dark: tokenMap(state.darkTokens)
  };
  const gatedPairs = [
    ...textPairs.map((pair) => ["text", ...pair]),
    ...uiPairs.map((pair) => ["ui", ...pair])
  ];
  const rows = [];
  const failures = [];

  for (const [modeName, modeMap] of Object.entries(modes)) {
    for (const [kind, name, foregroundPath, backgroundPath, threshold] of gatedPairs) {
      const foreground = getResolvedHex(modeMap, foregroundPath);
      const background = getResolvedHex(modeMap, backgroundPath);
      const ratio = contrast(foreground, background);
      const pass = ratio >= threshold;
      const row = {
        mode: modeName,
        kind,
        pair: name,
        foreground,
        background,
        ratio,
        threshold,
        pass
      };
      rows.push(row);
      if (!pass) failures.push(row);
    }

    assertExemptionsPresent(modeName, modeMap);
  }

  return { rows, failures };
}

function assertExemptionsPresent(modeName, modeMap) {
  const categoricalPaths = [
    ...Array.from({ length: 10 }, (_value, index) => `midas.cat.${index + 1}`),
    "midas.cat.other"
  ];
  const paths = [
    ...exemptPairs.flatMap(([_name, foreground, background]) => [foreground, background]),
    ...categoricalPaths
  ];

  for (const tokenPath of paths) {
    if (!modeMap.has(tokenPath)) {
      throw new Error(`Missing exempt token in ${modeName} mode: ${tokenPath}`);
    }
  }
}

function printContrastTable({ rows, failures }) {
  const columns = ["Mode", "Kind", "Pair", "FG", "BG", "Ratio", "Threshold", "Pass"];
  const printableRows = rows.map((row) => [
    row.mode,
    row.kind,
    row.pair,
    row.foreground,
    row.background,
    row.ratio.toFixed(2),
    row.threshold.toFixed(1),
    row.pass ? "yes" : "NO"
  ]);
  const widths = columns.map((column, index) =>
    Math.max(column.length, ...printableRows.map((row) => row[index].length))
  );
  const formatRow = (row) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  console.log(formatRow(columns));
  console.log(formatRow(widths.map((width) => "-".repeat(width))));
  for (const row of printableRows) console.log(formatRow(row));

  console.log("\nIntentional exemptions (presence asserted, not contrast-gated):");
  for (const [name, foreground, background] of exemptPairs) {
    console.log(`- ${name}: ${foreground} on ${background}`);
  }

  if (failures.length > 0) {
    console.error("\nContrast gate failed:");
    for (const failure of failures) {
      console.error(
        `- ${failure.mode} ${failure.pair}: ${failure.ratio.toFixed(2)} < ${failure.threshold.toFixed(1)}`
      );
    }
  }
}

function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === __filename;
}

if (isMain()) {
  const result = evaluateContrastGate();
  printContrastTable(result);
  if (result.failures.length > 0) process.exitCode = 1;
}
