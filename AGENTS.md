# Agent Rules

This repository is generated from DTCG token source files.

- Edit `tokens/` only for token value changes. Do not hand-edit `dist/` or `site/`.
- Run `npm run build` before committing; it runs Style Dictionary and the WCAG contrast gate.
- Run `npm run docs` when `site/` needs to be refreshed.
- Renaming or removing a CSS variable is a breaking change and requires a major version bump.
- Adding a token is a minor version bump.
- Changing a colour value while keeping names stable is a patch version bump if the contrast gate remains green.
- Keep the theme blue-based. Red appears only in semantic danger tokens.
- Apps consume `--color-*`, package exports, or chart palettes. They should not copy raw hex values.
- Categorical colours are assigned by entity, never by rank, and must be paired with a label, icon, pattern, or text.
