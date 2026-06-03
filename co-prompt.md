Review the `sideEffects` array in this app's package.json. It should describe only THIS app's own
side-effectful files, never dependencies in node_modules (a dependency's tree-shaking is governed by
its OWN package.json `sideEffects`, so node_modules entries here are inert).

First confirm which file this is (the app's package.json vs a library's). Then:

KEEP these (app's own side-effectful files):
  - "**/*.css", "**/*.scss", "**/*.scss.js"   (style files — don't let them be tree-shaken)
  - "**/src/utilities/Array.ts", "**/src/utilities/String.ts",
    "**/lib/utilities/Array.js", "**/lib/utilities/String.js"
    BUT FIRST verify these files actually have side effects (e.g. they extend Array.prototype /
    String.prototype or run code on import). If they're just pure exports, they don't belong here
    either. If they DO mutate prototypes, keep them — removing them could break runtime behavior.

REMOVE these (inert — they cannot affect how those dependencies are bundled):
  - "**/node_modules/@pnp/**"
  - "**/node_modules/spfx-toolkit/lib/..."  (any node_modules/spfx-toolkit entry)
  - "**/node_modules/devextreme/dist/..."   (any node_modules/devextreme entry)

After editing, run `npm run serve` AND `gulp bundle --ship` (or `npm run build`) and confirm:
  - no new build errors
  - toolkit/PnP/DevExtreme styles still render
  - the app's prototype-extending utilities still work at runtime
Show me the before/after diff of the sideEffects array. Do NOT remove the kept entries.
