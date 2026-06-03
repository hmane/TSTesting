Audit this SPFx solution for correct use of the `spfx-toolkit` package.

Authoritative rules: node_modules/spfx-toolkit/docs/AI-Assistant-Guide.md
Authoritative import paths: node_modules/spfx-toolkit/docs/Importing-Components.md
Read both first. Do NOT edit any files yet — this is a read-only audit. Report findings, then wait for my approval before changing anything.

Check every rule below across all of src/ (and config/ + package.json). For each, search the actual code and report PASS / FAIL with concrete file:line evidence.

1. ROOT IMPORTS — flag any `from 'spfx-toolkit'` (bare root). Must use subpaths.
   grep: import .* from ['"]spfx-toolkit['"]
2. HEAVY COMPONENTS VIA BARREL — flag any heavy component imported from 'spfx-toolkit/components'
   (Comments, spForm, spFields, SPDynamicForm, VersionHistory, ManageAccess,
   SPListItemAttachments, GroupUsersPicker, userAccess, SPSiteSelector). They MUST use deep subpaths.
3. FLUENT UI BARREL — flag `from '@fluentui/react'` (bare). Must be `@fluentui/react/lib/<X>`.
4. SPCONTEXT INIT — confirm `await SPContext.smart(...)` runs in each web part's onInit() BEFORE render().
   Flag any toolkit component/hook used in a web part whose onInit never inits SPContext.
5. PEER DEPS — cross-check package.json against the §3 matrix for every toolkit feature actually used
   (Comments→react-mentions, DevExtreme features→devextreme(+css), spForm→react-hook-form+zustand,
   ManageAccess/PnP pickers→@pnp/spfx-controls-react). Flag missing ones.
6. pnpImports — find every raw `SPContext.sp...`/`spCached`/`spPessimistic` call in OUR code. For each,
   verify the matching `spfx-toolkit/utilities/context/pnpImports/<key>` is imported once at that web part's
   entry. Flag raw PnP chains with no augmentation loaded (runtime risk: ".lists is not a function").
7. sideEffects TRAP — inspect package.json. Flag ANY `sideEffects` field added to fix styling; it must be
   absent (SPFx default). Note if `sideEffects: false` risks dropping our own pnpImports/DevExtreme CSS imports.
8. DEVEXTREME CSS — if any DevExtreme-backed feature is used, confirm `import 'devextreme/dist/css/dx.light.css'`
   exists exactly once globally.
9. STABLE HOOK REFS — flag data hooks (useListItems, useSPPagedQuery, etc.) passed a freshly-created sp or an
   inline options object literal each render (should be SPContext.sp + memoized options).
10. WEBPACK/LINK — flag any manual webpack alias/scss/NormalModuleReplacement hacks for spfx-toolkit. These
    belong ONLY in a npm-link debug config via `applyToolkitWebpackFixes` from 'spfx-toolkit/build', never in prod.

OUTPUT: a markdown table — Rule # | Status (PASS/FAIL) | file:line | What's wrong | Suggested fix.
List PASS rows too (so I know they were checked). After the table, give a short prioritized fix list
(blocking runtime issues first, then bundle-size, then style). Then STOP and ask before editing.




===================================


Apply fixes for rules 1, 2, and 6 from the audit only. Use exact import paths copied from
node_modules/spfx-toolkit/docs/Importing-Components.md. Don't touch package.json sideEffects.
Show me the diff per file; don't run any build.
===================================






Fix a fast-serve build error caused by @pnp/spfx-controls-react CSS double-processing when consuming the `spfx-toolkit` package via npm link.

== SYMPTOM ==
`npm run serve` fails with, for several @pnp controls (dragDropFiles, errorMessage, etc.):
  ERROR in ./node_modules/@pnp/spfx-controls-react/lib/controls/.../X.module.scss.css
  Module build failed (from .../spfx-fast-serve-helpers/node_modules/css-loader/dist/cjs.js):
  SyntaxError ... Unknown word
  > import API from "!.../style-loader/dist/runtime/injectStylesIntoStyleTag.js";

== ROOT CAUSE ==
1. This app has @pnp/spfx-controls-react@3.24.x, which ships `X.module.scss.css` (real CSS).
   The spfx-toolkit package was built against @pnp/spfx-controls-react@3.22 (ships `X.module.scss.js`).
2. `applyToolkitWebpackFixes` (from spfx-toolkit/build) aliases @pnp/spfx-controls-react to the app's
   3.24 copy by default. That forces the toolkit's controls onto the app's 3.24 `.module.scss.css`.
3. Two css rules then match `X.module.scss.css`: a custom rule we added AND spfx-fast-serve's own
   injected css rule. They stack, so css-loader receives style-loader's JS output -> "Unknown word: import".
4. Our custom exclude loop can't disable fast-serve's rule (it's merged after transformConfig runs).

== FIX (do this; it removes the conflict at the source) ==
Stop aliasing @pnp/spfx-controls-react. Let the toolkit use its OWN nested 3.22 copy, which the helper's
built-in `.module.scss -> .module.scss.js` rewrite already handles. Then delete all the home-grown
`.module.scss.css` rule surgery — it's no longer needed.

STEP 1 — Replace the entire `transformConfig` in `config/fast-serve/webpack.extend.js` with:

    const { applyToolkitWebpackFixes, DEFAULT_ALIAS_PEERS } = require('spfx-toolkit/build');

    const transformConfig = function (initialWebpackConfig) {
      return applyToolkitWebpackFixes(initialWebpackConfig, {
        consumerRoot: __dirname,
        // App has @pnp/spfx-controls-react 3.24 (.module.scss.css); toolkit built against 3.22
        // (.module.scss.js). Aliasing forces the toolkit's controls onto the app's 3.24 copy and
        // triggers .module.scss.css double-processing. Excluding it lets the toolkit use its nested
        // 3.22 copy, which the helper's .module.scss -> .js rewrite handles.
        aliasPeers: DEFAULT_ALIAS_PEERS.filter((p) => p !== '@pnp/spfx-controls-react'),
      });
    };

    module.exports = { transformConfig };

STEP 2 — In `config/fast-serve/webpack.extend.js`, DELETE everything related to the old workaround:
  - the `componentLibPath` / `pnpControlsLibPath` constants
  - both `NormalModuleReplacementPlugin(/\.module\.scss$/, ...)` pushes (the `.js` and `.css` ones)
  - the `pnpScssExclude` / `probeFile` exclude loop over `module.rules`
  - the pushed rule `{ test: /\.module\.scss\.css$/, include: @pnp/spfx-controls-react, use: [...] }`
  Keep only the code shown in STEP 1.

STEP 3 — In `gulpfile.js`, REMOVE the equivalent @pnp `.module.scss.css` workaround blocks applied to
`generatedConfiguration`:
  - the `pnpScssExclude` loop that adds excludes to `sp-css-loader` rules
  - the `NormalModuleReplacementPlugin(/\.module\.scss$/, ...)` that appends `.css`
  - the pushed `{ test: /\.module\.scss\.css$/, include: @pnp/spfx-controls-react, ... }` rule
  Leave any UNRELATED config intact (e.g. devextreme/moment `IgnorePlugin` entries — keep those).
  With the toolkit on its nested 3.22 copy, the stock SPFx sp-css-loader handles its control CSS.

STEP 4 — Verify:
  - Delete `temp/` and `dist/` build output if present.
  - Run `npm run serve`. The `X.module.scss.css` "Unknown word" errors should be gone and @pnp
    controls (people picker, taxonomy picker, ManageAccess) should render styled.

Do NOT add a `sideEffects` field to package.json, and do NOT reintroduce the deleted webpack rules.
Show me the diff for both files before/after and confirm the serve build is clean. If the error persists,
add this one diagnostic line at the top of transformConfig and share `merged-rules.json`:

    require('fs').writeFileSync(require('path').join(__dirname,'merged-rules.json'),
      JSON.stringify(initialWebpackConfig.module.rules,(k,v)=>v instanceof RegExp?v.toString():v,2));
