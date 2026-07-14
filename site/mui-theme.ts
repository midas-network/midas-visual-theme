// GENERATED — do not edit. Edit tokens/ and run npm run build.

import { createTheme } from "@mui/material/styles";
import type { Theme, ThemeOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    chart: string[];
  }
  interface PaletteOptions {
    chart?: string[];
  }
}

export const midasCategoricalPalette = [
  "#205487",
  "#e69f00",
  "#1f9d8b",
  "#cc6677",
  "#56b4e9",
  "#9467bd",
  "#5b9e3f",
  "#d55e00",
  "#cc79a7",
  "#b08c3e",
  "#6b7885"
] as const;
export const midasDarkCategoricalPalette = [
  "#5187be",
  "#e69f00",
  "#1f9d8b",
  "#cc6677",
  "#56b4e9",
  "#9467bd",
  "#5b9e3f",
  "#d55e00",
  "#cc79a7",
  "#b08c3e",
  "#8a97a5"
] as const;

export const midasLightTheme: ThemeOptions = {
  "palette": {
    "mode": "light",
    "primary": {
      "main": "#205487",
      "contrastText": "#ffffff"
    },
    "secondary": {
      "main": "#14958a",
      "contrastText": "#ffffff"
    },
    "background": {
      "default": "#f6f8fa",
      "paper": "#ffffff"
    },
    "text": {
      "primary": "#12161b",
      "secondary": "#616d79"
    },
    "error": {
      "main": "#c1352c",
      "contrastText": "#7a1f19"
    },
    "warning": {
      "main": "#b26a00",
      "contrastText": "#7a4900"
    },
    "success": {
      "main": "#1f7a4d",
      "contrastText": "#14543a"
    },
    "info": {
      "main": "#205487",
      "contrastText": "#17406a"
    },
    "chart": [
      "#205487",
      "#e69f00",
      "#1f9d8b",
      "#cc6677",
      "#56b4e9",
      "#9467bd",
      "#5b9e3f",
      "#d55e00",
      "#cc79a7",
      "#b08c3e",
      "#6b7885"
    ]
  },
  "typography": {
    "fontFamily": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
  },
  "shape": {
    "borderRadius": 8
  }
};

export const midasDarkTheme: ThemeOptions = {
  "palette": {
    "mode": "dark",
    "primary": {
      "main": "#4e8bc0",
      "contrastText": "#08131f"
    },
    "secondary": {
      "main": "#2bb6a3",
      "contrastText": "#08131f"
    },
    "background": {
      "default": "#0c1a2b",
      "paper": "#12263c"
    },
    "text": {
      "primary": "#e7edf3",
      "secondary": "#9fb2c4"
    },
    "error": {
      "main": "#e06a60",
      "contrastText": "#f2b8b2"
    },
    "warning": {
      "main": "#e0a34a",
      "contrastText": "#f2d3a0"
    },
    "success": {
      "main": "#4fb07d",
      "contrastText": "#a8dcc0"
    },
    "info": {
      "main": "#4e8bc0",
      "contrastText": "#a6c6e2"
    },
    "chart": [
      "#5187be",
      "#e69f00",
      "#1f9d8b",
      "#cc6677",
      "#56b4e9",
      "#9467bd",
      "#5b9e3f",
      "#d55e00",
      "#cc79a7",
      "#b08c3e",
      "#8a97a5"
    ]
  },
  "typography": {
    "fontFamily": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
  },
  "shape": {
    "borderRadius": 8
  }
};

export function createMidasLightTheme(options: ThemeOptions = {}): Theme {
  return createTheme(midasLightTheme, options);
}

export function createMidasDarkTheme(options: ThemeOptions = {}): Theme {
  return createTheme(midasDarkTheme, options);
}
