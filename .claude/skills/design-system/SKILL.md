---
name: design-system
description: Use before writing or changing any UI in web/ — new pages, components, styling, colours, icons, charts, loading states, or animations. Trigger phrases include "add a page", "new screen", "style this", "add an icon", "add a chart", "change the colors", or any edit to files under web/src/pages/ or web/src/components.jsx.
---

# MSR UI guardrails

These rules are why the app looks like one product (CLAUDE.md §5).

## Colour — tokens only
Use the palettes defined in `web/tailwind.config.js`:
- `msr` (navy brand, 50–950), `saffron` (accent, use sparingly), `ink` (warm neutral text/surfaces).
- Chart/status colours are separate and validated for colour-blindness: `series-1` `#2a78d6`, `series-2` `#eb6834`, `good`, `warn`, `critical`.
- **Never** use raw Tailwind palette colours (`slate-*`, `blue-*`, `gray-*`…) — they will look off. (`Badge`'s internal `CHIP`/`DOT` maps in `components.jsx` are the one grandfathered exception; do not copy that pattern into new code.)

## Components before markup
Reach for the exports of `web/src/components.jsx` before hand-rolling anything: `PageHead`, `Stat`, `Badge`, `Segmented`, `Modal`, `Field`, `Loading`, `Empty` (plus `ToastProvider`/`useToast`). A new page is `PageHead` + `Segmented` (if tabbed) + cards. Use the CSS classes from `web/src/index.css`: `.card`, `.btn-primary/.btn-accent/.btn-ghost/.btn-quiet/.btn-danger`, `.input`, `.label`, `.pill`, `.th`/`.td`, `.seg`, `.skeleton`.

## Icons
Icons come **only** from `web/src/icons.jsx`, which re-exports official Lucide icons (lucide.dev) from the `lucide-react` package through a shared `wrap()` helper that fixes one stroke weight (1.75) and one default size. Pages never import from `lucide-react` directly. To add an icon, import the Lucide component at the top of `icons.jsx` and add one `export const IconX = wrap(LucideName);` line. The only non-Lucide SVG is the `Logo` mark. **Never** paste ad-hoc SVG into a page and **never** use emoji in the UI.

## Touch
`.btn` is min 44px tall (`min-h-[2.75rem]` in `index.css`) — this app is used outdoors at 5:30 AM on a phone. Keep every tap target at least that. `Modal` is a bottom sheet on phones, dialog on desktop.

## Loading
Skeletons, not spinners: `<Loading rows={n} />` (or `kind="stats"` for the tile grid). The page keeps its shape while it loads. `Spinner` exists only for in-button busy states.

## Charts — hand-built SVG only
Charts live in `web/src/charts.jsx` (`TrendLine`, `Columns`, `Spark`, `HeatStrip`). Recharts was removed (~100KB gzipped, fought the spec) — do not add a chart library. Rules for a new chart: 2px lines, hairline solid grid, end markers ≥8px ringed in the surface colour, bars capped at 28px with a 4px rounded cap, no legend for a single series, text in `ink` tokens (never the series colour), hover tooltip by default.

## Status is never colour alone
Use `Badge` — it pairs a coloured dot with the status word. Never signal a state with colour only.

## Motion
- Respect `prefers-reduced-motion`: `index.css` globally kills animation durations under `@media (prefers-reduced-motion: reduce)`. Never add JS-driven animation that bypasses this.
- Use the existing reveal utilities: `animate-fade-up` (the entrance/reveal keyframe in `tailwind.config.js`, `.28s cubic-bezier(.22,1,.36,1)`) for content appearing — see `Empty`, `Modal`, toasts. Stagger by applying it per item, not by inventing new keyframes.
- `.skeleton` uses the `shimmer` animation; don't restyle it.
- Keep interactions subtle: `active:scale-[.985]` on buttons, `card-hover` shadow lift. Nothing bouncy.
