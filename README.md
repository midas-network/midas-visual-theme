# MIDAS Visual Theme

MIDAS Visual Theme is the shared design-token package for MIDAS visual applications. The source of truth is DTCG JSON in `tokens/`; Style Dictionary generates CSS, SCSS, TypeScript, MUI theme options, resolved JSON, and a static documentation site.

The package name is `@midasnetwork/tokens`. If that npm scope is unavailable at publish time, publish as `midas-design-tokens` and update the install examples.

The MIDAS Discover deploy repository also consumes this repository as a git
submodule. Its `scripts/sync-theme.sh` build step copies
`dist/midas-theme.css` into the static frontend projects, so generated `dist/`
artifacts are part of this repository's committed interface.

## Install

```bash
npm i @midasnetwork/tokens
```

## Consume

CSS custom properties:

```css
@import "@midasnetwork/tokens/css";

.button {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
```

SCSS variables and dark-mode mixin:

```scss
@use "@midasnetwork/tokens/scss" as midas;

.card {
  border-radius: midas.$radius-md;
  box-shadow: midas.$shadow-sm;
}

[data-theme="dark"] {
  @include midas.midas-theme-dark;
}
```

TypeScript or JavaScript:

```ts
import { tokens } from "@midasnetwork/tokens";

const primary = tokens.light.color.primary;
const darkSurface = tokens.dark.color.surface;
```

MUI:

```ts
import { createMidasLightTheme } from "@midasnetwork/tokens/mui";

export const theme = createMidasLightTheme();
```

The MUI export augments `palette.chart` with the MIDAS categorical palette for chart integrations.

## Edit Tokens

Edit `tokens/primitive.json`, `tokens/semantic.json`, or `tokens/modes/dark.json`. Do not hand-edit generated files in `dist/` or `site/`.

```bash
npm run build
npm run docs
```

`npm run build` runs Style Dictionary and then the WCAG contrast gate. A token change that drops a gated pair below threshold fails the build with the pair name and ratio.

## Accessibility

The theme is AA verified for the gated text pairs and UI contrast pairs in both light and dark modes. The contrast gate uses WCAG 2.x relative luminance and contrast-ratio math.

Some visual tokens are intentionally recessive and are not numeric contrast gates: decorative borders, chart gridlines, chart axes, and categorical fills against a surface. This is deliberate: WCAG 1.4.11 does not require decorative divider contrast, and data-viz furniture should stay quieter than the data. Categorical colours must never be the only carrier of meaning; pair them with labels, text, icons, or patterns.

## Theme Rules

- The theme is blue-based.
- Red appears only in semantic danger tokens.
- Apps consume semantic roles such as `--color-primary`, `--color-surface`, and `--chart-ink-muted`.
- Categorical colours are assigned by entity, never by rank. Past slot 10, fold the tail into `--midas-cat-other`.

## Generated Artifacts

- `dist/midas-theme.css`
- `dist/midas-theme.scss`
- `dist/tokens.ts`
- `dist/mui-theme.ts`
- `dist/tokens.resolved.json`
- `site/index.html`
- `site/tokens.resolved.json`
- `site/midas-theme.css`
- `site/mui-theme.ts`

The docs site is purpose-built static HTML. It has no analytics, telemetry, or tracking.

## Agent Surface

`llms.txt` is included for IDE coding agents and other repository-aware tools. It is not primarily for general search crawlers. See `AGENTS.md` for edit rules and versioning guidance.

## Future Component Tier

The current repository has two token tiers: `primitive` and `semantic`. A future `component` tier would live under `tokens/component.json` once shared components exist. Storybook would slot in at that point as a component documentation surface; for v0.1, the generated static site is enough.

## Development

```bash
npm ci
npm run build
npm run docs
npm run test:contrast
```

GitHub Pages deploys `site/` on pushes to `main`. The release workflow publishes on `v*` tags and requires an `NPM_TOKEN` repository secret.
