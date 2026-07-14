import {
  GENERATED_HEADER,
  buildResolvedArtifact,
  loadTokenState,
  toCssVariable,
  toScssVariable,
  valuesTree
} from "../scripts/contrast.mjs";

const cssHeader = `/* ${GENERATED_HEADER} */`;
const slashHeader = `// ${GENERATED_HEADER}`;

function declarations(tokens) {
  return tokens.map(({ path, token }) => `  ${toCssVariable(path)}: ${token.$value};`).join("\n");
}

function cssBlock(selector, tokens) {
  return `${selector} {\n${declarations(tokens)}\n}`;
}

function formatCss() {
  const state = loadTokenState();
  const darkDeclarations = declarations(state.darkOverrideTokens);

  return [
    cssHeader,
    cssBlock(":root", state.lightTokens),
    cssBlock('[data-theme="dark"]', state.darkOverrideTokens),
    "@media (prefers-color-scheme: dark) {",
    "  :root:not([data-theme=\"light\"]) {",
    darkDeclarations
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
    "  }",
    "}",
    ""
  ].join("\n\n");
}

function formatScss() {
  const state = loadTokenState();
  const lightVariables = state.lightTokens
    .map(({ path, token }) => `${toScssVariable(path)}: ${token.$value} !default;`)
    .join("\n");
  const darkMap = state.darkOverrideTokens
    .map(({ path, token }) => `  "${path.join("-")}": ${token.$value}`)
    .join(",\n");
  const darkMixin = state.darkOverrideTokens
    .map(({ path }) => `  ${toCssVariable(path)}: #{map.get($midas-theme-dark, "${path.join("-")}")};`)
    .join("\n");

  return [
    slashHeader,
    '@use "sass:map";',
    "",
    lightVariables,
    "",
    "$midas-theme-dark: (",
    darkMap,
    ") !default;",
    "",
    "@mixin midas-theme-dark {",
    darkMixin,
    "}",
    ""
  ].join("\n");
}

function formatTokensTs() {
  const state = loadTokenState();
  const light = valuesTree(state.light);
  const dark = valuesTree(state.darkOverrides);
  const cssVariables = Object.fromEntries(
    state.lightTokens.map(({ name, cssVariable }) => [name, cssVariable])
  );

  return [
    slashHeader,
    "",
    "export const tokens = {",
    `  light: ${indentJson(light, 2)},`,
    `  dark: ${indentJson(dark, 2)},`,
    `  cssVariables: ${indentJson(cssVariables, 2)}`,
    "} as const;",
    "",
    "export const light = tokens.light;",
    "export const dark = tokens.dark;",
    "export const cssVariables = tokens.cssVariables;",
    "",
    "export type MidasTokens = typeof tokens;",
    "export type MidasLightTokens = typeof light;",
    "export type MidasDarkOverrides = typeof dark;",
    ""
  ].join("\n");
}

function formatMuiThemeTs() {
  const state = loadTokenState();
  const light = valuesTree(state.light);
  const dark = valuesTree(state.dark);
  const lightChart = chartPalette(light);
  const darkChart = chartPalette(dark);

  return [
    slashHeader,
    "",
    "import { createTheme } from \"@mui/material/styles\";",
    "import type { Theme, ThemeOptions } from \"@mui/material/styles\";",
    "",
    "declare module \"@mui/material/styles\" {",
    "  interface Palette {",
    "    chart: string[];",
    "  }",
    "  interface PaletteOptions {",
    "    chart?: string[];",
    "  }",
    "}",
    "",
    `export const midasCategoricalPalette = ${indentJson(lightChart, 0)} as const;`,
    `export const midasDarkCategoricalPalette = ${indentJson(darkChart, 0)} as const;`,
    "",
    `export const midasLightTheme: ThemeOptions = ${indentJson(muiTheme("light", light, lightChart), 0)};`,
    "",
    `export const midasDarkTheme: ThemeOptions = ${indentJson(muiTheme("dark", dark, darkChart), 0)};`,
    "",
    "export function createMidasLightTheme(options: ThemeOptions = {}): Theme {",
    "  return createTheme(midasLightTheme, options);",
    "}",
    "",
    "export function createMidasDarkTheme(options: ThemeOptions = {}): Theme {",
    "  return createTheme(midasDarkTheme, options);",
    "}",
    ""
  ].join("\n");
}

function chartPalette(values) {
  const chart = Array.from({ length: 10 }, (_value, index) => values.midas.cat[String(index + 1)]);
  chart.push(values.midas.cat.other);
  return chart;
}

function muiTheme(mode, values, chart) {
  return {
    palette: {
      mode,
      primary: {
        main: values.color.primary,
        contrastText: values.color["primary-contrast"]
      },
      secondary: {
        main: values.color.secondary,
        contrastText: values.color["text-inverse"]
      },
      background: {
        default: values.color.bg,
        paper: values.color.surface
      },
      text: {
        primary: values.color.text,
        secondary: values.color["text-muted"]
      },
      error: {
        main: values.color.danger,
        contrastText: values.color["danger-text"]
      },
      warning: {
        main: values.color.warning,
        contrastText: values.color["warning-text"]
      },
      success: {
        main: values.color.success,
        contrastText: values.color["success-text"]
      },
      info: {
        main: values.color.info,
        contrastText: values.color["info-text"]
      },
      chart
    },
    typography: {
      fontFamily: values.font.sans
    },
    shape: {
      borderRadius: Number.parseInt(values.radius.md, 10)
    }
  };
}

function formatResolvedJson() {
  return JSON.stringify({ "$comment": GENERATED_HEADER, ...buildResolvedArtifact() }, null, 2) + "\n";
}

function indentJson(value, spaces) {
  return JSON.stringify(value, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${" ".repeat(spaces)}${line}`))
    .join("\n");
}

export default {
  usesDtcg: true,
  source: ["tokens/primitive.json", "tokens/semantic.json"],
  hooks: {
    transforms: {
      "midas/name-preserve-path": {
        type: "name",
        transform: (token) => token.path.join("-")
      }
    },
    formats: {
      "midas/css": formatCss,
      "midas/scss": formatScss,
      "midas/tokens-ts": formatTokensTs,
      "midas/mui-theme-ts": formatMuiThemeTs,
      "midas/resolved-json": formatResolvedJson
    }
  },
  platforms: {
    dist: {
      buildPath: "dist/",
      transforms: ["midas/name-preserve-path"],
      files: [
        {
          destination: "midas-theme.css",
          format: "midas/css"
        },
        {
          destination: "midas-theme.scss",
          format: "midas/scss"
        },
        {
          destination: "tokens.ts",
          format: "midas/tokens-ts"
        },
        {
          destination: "mui-theme.ts",
          format: "midas/mui-theme-ts"
        },
        {
          destination: "tokens.resolved.json",
          format: "midas/resolved-json"
        }
      ]
    }
  }
};
