# Task: Fix SharePoint "duplicate header on scroll" + refactor global CSS loading

This is a two-part change spanning the **SP Search** SPFx solution and its sibling
**spfx-toolkit** dependency. Do BOTH parts. Read the root-cause section first — do
not re-diagnose from scratch, and do not "fix" it by changing CSS load order/bundling
(that was already tried and is wrong).

## Root cause (authoritative — trust this)
On a modern SharePoint page, the site header collapses to a compact sticky bar on
scroll; the step that HIDES the full header fires on a CSS `transitionend` event.

`spfx-toolkit/lib/components/VersionHistory/VersionHistory.css` contains, inside an
`@media (prefers-reduced-motion: reduce)` block, a **bare universal `*` selector**:

```css
@media (prefers-reduced-motion: reduce) {
  .version-card,
  .field-change-row,
  .version-details-comment,
  .version-history-status,
  * {                              /* ← BUG: unscoped universal */
    animation: none !important;
    transition: none !important;
  }
}
```

SPFx injects this **non-module** CSS as a **page-level `<style>`**. So when the user
has OS "Reduce Motion" ON, this rule disables transitions/animations on the ENTIRE
page — including SharePoint's own chrome. SharePoint's `transitionend` then never
fires, the full header never hides, and you get a duplicated (full + compact) header
on scroll. Where the file is `require()`'d does not matter — once any chunk loads it,
it is global. The correct fix is to **scope the universal selector to the component's
own subtree**.

---

## Part A — Fix the toolkit CSS (the actual bug)

1. Locate the spfx-toolkit source. It is a sibling clone resolved via
   `file:../spfx-toolkit` and `node_modules/spfx-toolkit` is a symlink to it.
   - If you can edit the toolkit source: edit
     `../spfx-toolkit/src/components/VersionHistory/VersionHistory.css`.
   - Note `lib/` in the toolkit is **gitignored build output**; sp-search consumes
     `lib/`. After editing `src/`, either run `npm run build` in the toolkit to
     regenerate `lib/`, OR also apply the identical edit to
     `../spfx-toolkit/lib/components/VersionHistory/VersionHistory.css` so the current
     sp-search build picks it up immediately.
   - If your org consumes spfx-toolkit as a **read-only published npm package**, apply
     the same edit via `patch-package` (add a postinstall patch) instead.

2. Replace the unscoped block with a **scoped** one (covers both popup and inline use):

```css
@media (prefers-reduced-motion: reduce) {
  /* Scoped to the VersionHistory subtree — a component stylesheet must NOT disable
     motion globally. It is injected page-wide, so a bare `*` leaks into the host and
     breaks motion-driven host behavior (e.g. SharePoint's scroll-collapse header
     relies on transitionend to hide the full header; force-disabling transitions
     page-wide leaves a duplicated header on scroll). */
  .version-history-popup *,
  .version-history * {
    animation: none !important;
    transition: none !important;
  }
}
```

3. **Audit the rest of the toolkit** for the same class of leak (other versions may
   have more). Grep every `*.css` under `../spfx-toolkit/src/components/` (and the
   `lib/` copies sp-search loads) for **page-global selectors inside any rule**, not
   just reduced-motion: a bare `*`, `html`, or `body` selector, or `*::before` /
   `*::after`. Any found in a vendored component stylesheet that gets injected globally
   must be scoped to that component's root. Report each one you scope.

---

## Part B — Refactor sp-search to load heavy CSS lazily (defense-in-depth + perf)

Goal: no web part **entrypoint** requires global third-party CSS. DevExtreme and
toolkit component CSS load only from the components that actually render those widgets.
This keeps initial bundles smaller AND ensures vendored global CSS can't load on a page
until the relevant widget mounts.

1. **Delete** any shared eager loader (e.g. `src/styles/loadSpfxToolkitStyles.ts`) and
   **create** `src/styles/loadDevExtremeStyles.ts`:

```ts
// DevExtreme ships global CSS. Load it only from components that render DevExtreme
// widgets so plain search webparts do not inject page-level CSS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('devextreme/dist/css/dx.common.css');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('devextreme/dist/css/dx.light.css');

export const devExtremeStylesLoaded: boolean = true;
```

2. **Remove** all global CSS `require()`s and the old toolkit-styles import from every
   web part **entrypoint** (`src/webparts/*/Sp*WebPart.ts`). Specifically remove the
   `require('devextreme/dist/css/dx.common.css')` / `dx.light.css` lines and any
   `import { spfxToolkitStylesLoaded } ...` + `_ensureStyles` lines. Verify with:
   `grep -rn "dist/css/dx\.\|loadSpfxToolkitStyles" src/webparts/*/Sp*WebPart.ts`
   → must return nothing.

3. **Add CSS at the component level** where the widget/toolkit component renders:

   - **DevExtreme widget components** — add the side-effect import near the top and
     reference it so it is not tree-shaken away:
     ```ts
     import { devExtremeStylesLoaded } from '../../../styles/loadDevExtremeStyles';
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
     const _ensureDevExtremeStyles = devExtremeStylesLoaded;
     ```
     Apply to every component that renders a DevExtreme widget. In this repo that is:
     `spSearchResults/components/DataGridContent.tsx` (DataGrid),
     `spSearchFilters/components/TagBoxFilter.tsx`,
     `spSearchFilters/components/DateRangeFilter.tsx`,
     `spSearchFilters/components/SliderFilter.tsx`,
     `spSearchFilters/components/TaxonomyTreeFilter.tsx`,
     `spSearchFilters/components/VisualFilterBuilder.tsx`,
     `spSearchBox/components/QueryBuilder.tsx`.
     (Discover the full set with `grep -rln "devextreme-react" src/webparts`.)

   - **Toolkit component CSS** — require directly in the consuming component:
     - `card.css` in `spSearchFilters/components/FilterGroup.tsx` (and any other
       spfx-toolkit `Card` consumer):
       `require('spfx-toolkit/lib/components/Card/card.css');`
     - `UserPersona.css` in each `UserPersona` consumer
       (`renderCell.tsx`, `ListLayout.tsx`, `ResultDetailPanel.tsx`,
       `DocumentTitleHoverCard.tsx`).
     - `VersionHistory.css` **lazily**, inside the dynamic-import thunk in
       `spSearchResults/components/LazyVersionHistory.ts`, so it only loads when the
       version-history panel opens:
       ```ts
       // eslint-disable-next-line @typescript-eslint/no-require-imports
       require('spfx-toolkit/lib/components/VersionHistory/VersionHistory.css');
       return import(/* webpackChunkName: 'VersionHistory' */ 'spfx-toolkit/lib/components/VersionHistory')
         .then(m => ({ default: m.VersionHistory as unknown as React.ComponentType<Record<string, unknown>> }));
       ```
     (Discover toolkit CSS consumers with
     `grep -rln "spfx-toolkit/lib/components" src/webparts`.)

4. Every `require('...css')` needs `// eslint-disable-next-line @typescript-eslint/no-require-imports`
   on the line above it.

---

## Part C — Regression guardrail

Add/update a test (`tests/a11y/reducedMotionScoping.test.ts`) that fails if a global
leak is reintroduced. It must check BOTH:
- sp-search `src/**/*.module.scss` — no `*,` / `*::before` / `*::after` as a selector
  inside any `@media (prefers-reduced-motion: reduce)` block.
- **the vendored toolkit CSS that ships to the page** — scan
  `node_modules/spfx-toolkit/lib/**/*.css` and fail if any rule uses a bare `*`,
  `html`, or `body` page-global selector (this is what would have caught the real bug).
Keep the test dependency-free (use `fs`/`path` only).

Also add a one-line entry to `docs/known-issues.md` (or the repo's changelog)
recording the root cause and the scoping fix.

---

## Verification (must all pass)
1. `grep -rn "prefers-reduced-motion" ../spfx-toolkit/src ../spfx-toolkit/lib` and
   confirm no block contains a bare `*`/`html`/`body` selector.
2. `grep -rn "dist/css/dx\." src/webparts/*/Sp*WebPart.ts` → empty.
3. `npm run build` (sp-search) succeeds.
4. `npm test` succeeds, including the new reduced-motion guardrail.
5. **Manual:** enable OS "Reduce Motion", deploy, open a page with a search web part,
   scroll down — the SharePoint header must collapse to a single compact bar (no
   duplicate). Open the result detail panel → Version History and confirm it still
   renders styled.

## Commit
- In **spfx-toolkit**: commit the scoped `src/.../VersionHistory.css` change (and any
  other selectors you scoped). `lib/` is gitignored — do not commit it; it is rebuilt.
- In **sp-search**: commit the entrypoint cleanup, `loadDevExtremeStyles.ts`, the
  component-level CSS requires, and the guardrail test, as one logical change.
