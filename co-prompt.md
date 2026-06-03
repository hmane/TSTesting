GOAL: Make this SPFx app consume the local `spfx-toolkit` as a normal FLAT package (packed tarball,
not npm link) and REMOVE every toolkit/npm-link webpack & gulp workaround, returning the app to a stock
SPFx configuration. Background: all the recent webpack.extend.js / gulpfile / sideEffects customizations
were workarounds for consuming the toolkit via `npm link` (nested duplicate copies + resolve.symlinks=false).
A flat install gives a single deduped copy of every dependency, so NONE of those workarounds are needed —
they actively cause errors (broke @microsoft/sp-lodash-subset/lib/index exports-map imports, etc.).

---------------------------------------------------------------------------------------------
STEP 0 — (DONE BY THE DEVELOPER, not you): in the spfx-toolkit clone, run `npm run build && npm pack`
to produce spfx-toolkit-<version>.tgz. The developer will give you that tarball's full path as <TGZ_PATH>.
---------------------------------------------------------------------------------------------

STEP 1 — Replace the linked toolkit with the packed tarball (flat install):
  npm rm spfx-toolkit
  rmdir /s /q node_modules\spfx-toolkit        2>nul   (ensure no leftover symlink/folder)
  npm install "<TGZ_PATH>"
  Verify it is a REAL folder, not a symlink/junction:
  cmd /c "dir node_modules\spfx-toolkit"               (must NOT show <SYMLINKD> or <JUNCTION>)

STEP 2 — Reset config/fast-serve/webpack.extend.js to the stock fast-serve default.
  Replace the ENTIRE file contents with exactly:

    const webpackConfig = {};
    module.exports = { webpackConfig };

  Remove ALL of the following if present: applyToolkitWebpackFixes / require('spfx-toolkit/build'),
  every cfg.resolve.alias entry for '@pnp/spfx-controls-react', '@microsoft/sp-lodash-subset',
  '@microsoft/sp-core-library', 'devextreme', etc., every NormalModuleReplacementPlugin handling
  '.module.scss' or '.module.scss.css', the pnpScssExclude loop, and any pushed
  `{ test: /\.module\.scss(\.css)?$/ ... }` rule. None are needed for a flat install.

STEP 3 — Reset gulpfile.js (remove the toolkit/npm-link workarounds; KEEP unrelated config).
  PREFERRED METHOD (if gulpfile.js is in git): restore it to the commit BEFORE the spfx-toolkit npm-link
  integration was added. Find that commit and show me the diff before applying:
    git log --oneline -- gulpfile.js
    git diff <that-commit> HEAD -- gulpfile.js
  Then restore: git checkout <that-commit> -- gulpfile.js   (only if the diff is solely the workarounds).

  FALLBACK METHOD (no clean git point): manually remove ONLY these workaround blocks:
    - the `sharedDependencyAliases` entries added for the linked toolkit:
        '@pnp/spfx-controls-react', '@microsoft/sp-lodash-subset', and 'devextreme'
        — REMOVE these entries. (If `devextreme` aliasing predates the toolkit and was a deliberate
          bundle optimization, keep it and tell me; otherwise remove it.)
    - any NormalModuleReplacementPlugin(/\.module\.scss$/...) that appends '.js' or '.css'
    - the `pnpScssExclude` regex + the loop that adds it to sp-css-loader rule excludes
    - the pushed rule `{ test: /\.module\.scss\.css$/, include: @pnp/spfx-controls-react, ... }`
  KEEP everything unrelated — in particular KEEP any `webpack.IgnorePlugin` entries for
  devextreme/moment locale, and any configuration that is not about spfx-toolkit or @pnp scss/aliases.

STEP 4 — Clean package.json `sideEffects`.
  Remove any entries that point into node_modules (e.g. "**/node_modules/@pnp/**",
  "**/node_modules/spfx-toolkit/...", "**/node_modules/devextreme/..."). A consuming app's sideEffects
  cannot control a dependency's tree-shaking, so those are inert and were added as a workaround.
  KEEP only entries describing THIS app's own side-effectful files (e.g. "**/*.css", "**/*.scss",
  and any of the app's own prototype-extending utilities like src/utilities/Array.ts). If the array
  ends up containing nothing but the app's own files, that's correct. Show me the before/after.

STEP 5 — Verify with stock serve (handles @pnp scss natively; no surgery needed):
  gulp clean
  gulp serve --nobrowser
  Confirm ALL of:
    - clean build, no "Module not found" / "Unknown word" / "Merging undefined" errors
    - web parts, field customizers, AND the form customizer (engagement-request-form-customizer) all load
    - @pnp controls (people picker, taxonomy picker, ManageAccess) render styled
    - browser console has NO "relative-path.invalid/@microsoft/sp-lodash-subset" error

GUARDRAILS:
  - Do NOT add back any spfx-toolkit-specific webpack config, resolve.alias, NormalModuleReplacementPlugin,
    or sideEffects entry. The toolkit must work as a plain flat dependency with zero build config.
  - Do NOT use `npm link` or a `file:` / bare local-folder install for spfx-toolkit (those symlink and
    reintroduce the problems). Only the packed tarball (or `npm install <folder> --install-links`).

DELIVERABLES: show me (1) the final webpack.extend.js, (2) the gulpfile.js diff, (3) the sideEffects
before/after, and (4) the `gulp serve` result.
