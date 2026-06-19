# Task: Fix collapsible Card leaving a phantom band under the header when collapsed

Symptom: in the SP Search **Filters** web part, collapsed filter-group cards show a
small empty content band under the header instead of collapsing to just the header.

Do BOTH parts. Read the root cause first — do not re-diagnose, and do not chase it as
a CSS-only / `:has()` / header-padding issue.

## Root cause (authoritative)
The spfx-toolkit `Card` component stamps the size config's `minHeight` as an **inline
style on the card root** (`.spfx-card`). In `Card`'s `cardStyle` memo it spreads the
WHOLE size object onto the root style:

```js
const cardStyle = useMemo(() => {
  const sizeConfig = SIZE_CONFIG[size];     // regular → { ..., minHeight: '56px', ... }
  return { ...sizeConfig, /* ...theme, ...style */ };
}, [...]);
```

`SIZE_CONFIG.regular.minHeight` is `'56px'`, so the root gets inline `min-height: 56px`.
Because it's an INLINE style on the root, it forces the whole card to ≥56px even when
collapsed (header ≈48px + content 0 → padded up to 56px = the phantom band). No
stylesheet rule beats an inline style without `!important`. The blind `...sizeConfig`
spread is also sloppy (it dumps non-CSS keys like `headerPadding`/`contentPadding`,
which React drops; only `minHeight`/`fontSize`/`width` actually leak).

Two defects: (1) the root min-height must NOT apply to a collapsed collapsible card;
(2) stop spreading the whole size object.

## Part A — Fix the toolkit Card (root cause)

Locate spfx-toolkit. It is a sibling clone resolved via `file:../spfx-toolkit`, and
`node_modules/spfx-toolkit` is a symlink to it; `lib/` there is **gitignored** build
output (sp-search consumes `lib/`).
- If you can edit the toolkit source: edit
  `../spfx-toolkit/src/components/Card/components/Card.tsx`. Then run `npm run build`
  in the toolkit to regenerate `lib/`, OR apply the identical change to
  `../spfx-toolkit/lib/components/Card/components/Card.js` so the current sp-search
  build picks it up immediately.
- If your org consumes spfx-toolkit as a **read-only npm package**, apply the change
  via `patch-package` instead.

In the `cardStyle` memo, replace the `...sizeConfig` spread so the size min-height is
applied ONLY when the card is expanded, and only real CSS props are set. Use the
already-in-scope expanded flag (in this codebase it's `effectiveIsExpanded`, defined a
few lines above as `isMaximized || isExpanded` — verify the exact name and add it to
the memo's dependency array):

```js
const cardStyle = useMemo(() => {
  const sizeConfig = SIZE_CONFIG[size];
  return {
    fontSize: sizeConfig.fontSize,
    ...(sizeConfig.width ? { width: sizeConfig.width } : {}),
    // A collapsed collapsible card must be free to shrink to its header — only pin
    // the size min-height while expanded. Previously `...sizeConfig` stamped e.g.
    // 56px on collapsed cards, leaving a phantom band under the header.
    ...(effectiveIsExpanded ? { minHeight: sizeConfig.minHeight } : {}),
    ...(theme?.backgroundColor && { backgroundColor: theme.backgroundColor }),
    ...(theme?.borderColor && { borderColor: theme.borderColor }),
    ...(theme?.textColor && { color: theme.textColor }),
    ...(highlightColor &&
      isHighlighted && {
        borderColor: highlightColor,
        boxShadow: `0 0 0 2px ${highlightColor}33`,
      }),
    ...style,
  };
}, [size, effectiveIsExpanded, theme, highlightColor, isHighlighted, style]);
```

Constraints: do not change `SIZE_CONFIG`; do not change expanded-card behavior
(expanded cards must still get the size min-height); keep `fontSize`/`width` working.

## Part B — Consumer override in sp-search (immediate, zero-risk)

In `src/webparts/spSearchFilters/components/SpSearchFilters.module.scss`, inside the
`.filterGroupCard` rule, add:

```scss
// The toolkit Card stamps the size min-height (e.g. 56px) as an inline style on the
// root, which stops a collapsed group from shrinking to its header. Override it.
// Expanded groups exceed this height, so they are unaffected.
min-height: 0 !important;
```

This works even before the toolkit rebuild and is harmless once Part A lands.

## Verification
1. Build sp-search (`npm run build`) — succeeds.
2. In the Filters web part, collapse a filter group → the card shrinks to just the
   header (no empty band below it). Expand it → content shows normally.
3. Confirm OTHER spfx-toolkit Card consumers (non-collapsible cards, accordion cards,
   maximized cards) still render at their expected size — expanded cards must keep the
   size min-height.

## Commit
- spfx-toolkit: commit the `src/.../Card.tsx` change (`lib/` is gitignored — rebuilt,
  not committed). If you used patch-package, commit the generated patch.
- sp-search: commit the `.filterGroupCard { min-height: 0 !important }` override.
