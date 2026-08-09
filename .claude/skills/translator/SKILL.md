---
name: translator
description: Use whenever public-site copy is added, changed, or removed, when adding/removing a site language, or when the user mentions translation, localization, i18n, Telugu/Hindi/Tamil/Kannada, or "the site in <language>". Any edit to web/src/i18n/* or to visible text in web/src/pages/Site.jsx or web/src/pages/site/* must follow this skill.
---

# Localization workflow

The public site is multilingual; the staff portal is English only. All site copy
lives in one dictionary per language under `web/src/i18n/`:

- `en.js` — **the source of truth.** Every other file mirrors its shape exactly.
- `te.js` (తెలుగు), `hi.js` (हिन्दी), `ta.js` (தமிழ்), `kn.js` (ಕನ್ನಡ).
- `index.jsx` — provider, `useT()`/`useLocale()`, `LANGS`, lazy `LOADERS` map,
  language detection (saved choice → device language → English).

Components never contain literal site copy; they call `useT()` and read
`L.section.key`. Icons stay out of dictionaries — icon arrays in
`web/src/pages/site/content.js` (`EVENT_ICONS`, `TIMING_ICONS`, `STEP_ICONS`)
pair positionally with the text arrays in the dictionaries.

## Changing or adding copy

1. Edit `en.js` first.
2. Apply the same change to **all** of `te.js`, `hi.js`, `ta.js`, `kn.js` —
   never leave a locale behind; the runtime falls back to English silently and
   the page becomes a mix of languages.
3. Verify: `cd web && node scripts/i18n-check.mjs` must print "All locales in
   sync". Run it before every commit that touches `web/src/i18n/`.

## Translation style

- Register: spoken, respectful (మీరు / आप / நீங்கள் / ನೀವು), the way a local
  coaching institute talks — not textbook-formal, not slangy.
- Keep in Latin script: exam and programme names (they are official titles),
  acronyms (SSC, PET, PMT, CEE, RPF, RRB, GD, UPI), "MSR", and all numerals
  and times (5:30, 1600 m, 94%).
- Programme card **names** are never translated; their descriptions live in
  `programmes.courses`, keyed by the exact English course name. Unknown names
  (new courses from the portal) fall back to the API's English description —
  when a course is added in the seed/portal, add its description to every
  dictionary.
- Headline split: `hero.h1a` + highlighted `hero.h1b` exist so word order can
  differ per language. Non-breaking spaces (U+00A0) inside h1b stop awkward
  line breaks — preserve them.
- Match the English meaning, not the English word order. Shorter is better on
  buttons (`actions.*`): they must fit a phone-width button in one line.

## Adding a language

1. Create `web/src/i18n/<code>.js` translating every key of `en.js` (same
   shape — the checker enforces it).
2. In `index.jsx`: add `{ code, label }` to `LANGS` (label in the language's
   own script) and a loader to `LOADERS`. Detection then picks it up
   automatically from the device language.
3. Run `node scripts/i18n-check.mjs` (add the code to its `LOCALES` list
   first), then build with `VITE_DEMO=1 npm run build:demo` and eyeball the
   page in that language — Indic scripts render via system fonts (the display
   font only covers Latin), so check headlines don't overflow.

## Never

- Never hardcode visitor-facing strings in site components.
- Never load webfonts from a CDN for a new script — system fonts render all
  Indic scripts; the bundle stays self-contained.
- Never translate the staff portal, `content.js` contact data, or anything
  under `web/src/pages/` outside the public site.
