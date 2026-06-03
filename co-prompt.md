We need a regression/root-cause analysis, not an immediate broad fix.

Context:
This SPFx solution consumes `spfx-toolkit`. Before recent toolkit package-hygiene/build changes, the app mostly worked. The original issue was only that `@pnp/spfx-controls-react` styles were missing in debug/fast-serve. Now a deployed/release form customizer fails with:

Loading the script "https://relative-path.invalid/@microsoft/sp-lodash-subset.js" violates CSP
Could not load <form-customizer> in require. Script error for "@microsoft/sp-lodash-subset"

This is not a CSS issue. It means the form customizer bundle has `@microsoft/sp-lodash-subset` in its AMD/runtime external dependency list.

Goal:
Find the actual source of `@microsoft/sp-lodash-subset` in the form customizer bundle and explain whether it comes from:
- direct app source import,
- `spfx-toolkit` barrel imports pulling too much,
- `@pnp/spfx-controls-react`,
- SPFx build externals/config,
- or something else.

Do not start by replacing lodash or adding shims. First prove the dependency path.

Tasks:

1. Inspect form customizer source imports.
   Run:
   rg -n "from ['\"]spfx-toolkit|from ['\"]@pnp/spfx-controls-react|@microsoft/sp-lodash-subset|@microsoft/sp-loader|SPComponentLoader|devextreme|SPLookupField|SPChoiceField|SPUserField|SPTaxonomyField|GroupUsersPicker" src/extensions src/components src/services src/hooks

2. Identify every toolkit import used by the failing form customizer path.
   Specifically flag imports from broad/barrel paths:
   - `spfx-toolkit`
   - `spfx-toolkit/components`
   - `spfx-toolkit/lib/components`
   - `spfx-toolkit/lib/components/spFields`
   - `spfx-toolkit/lib/components/spForm`
   - `spfx-toolkit/lib/utilities`

   Compare against exact deep imports such as:
   - `spfx-toolkit/lib/components/spFields/SPChoiceField`
   - `spfx-toolkit/lib/components/spFields/SPTextField`
   - `spfx-toolkit/lib/utilities/context`

3. Build the release bundle and inspect the generated form customizer JS.
   Run the project’s release build, then:
   rg -n "@microsoft/sp-lodash-subset|relative-path.invalid|@pnp/spfx-controls-react|PeoplePicker|ModernTaxonomyPicker|ListItemPicker|LivePersona|FileTypeIcon|RichText" lib dist temp release

4. In the generated form customizer JS, inspect the AMD `define([...])` dependency array.
   Answer:
   - Is `@microsoft/sp-lodash-subset` listed there?
   - Which form customizer bundle file contains it?
   - Which module inside the bundle references it?
   Use bundle/source-map/sourceURL comments if present to trace it back.

5. Check package/build config.
   Inspect:
   - package.json dependencies and sideEffects
   - gulpfile.js webpack modifications
   - config/config.json bundle entrypoints
   - config/serve.json only for debug context

   Do not assume fast-serve is the cause because this also happens in deployed/release.

6. Compare with known-good `/Users/hemantmane/Development/legal-workflow`.
   Use it only for comparison. Note:
   - legal-workflow avoids `SPLookupField`
   - it mostly uses `SPChoiceField` checkbox mode for multi-choice
   - it has custom gulp webpack config, but do not blindly copy that config
   - it uses `spfx-toolkit` as `file:../spfx-toolkit`, so generated release assets may include local toolkit changes and are not clean historical proof

7. Hypothesis to test:
   CJS/eager toolkit barrels may be pulling PnP-control modules into the form customizer initial bundle. If the app imports from `spfx-toolkit/lib/components/spFields` or `spfx-toolkit/lib/components/spForm`, try a minimal experiment:
   - switch only the failing form customizer path to exact deep imports
   - rebuild release
   - check whether `@microsoft/sp-lodash-subset` disappears from the generated form customizer bundle

   Example:
   Replace:
   import { SPChoiceField, SPTextField } from 'spfx-toolkit/lib/components/spFields';

   With exact imports, if available:
   import { SPChoiceField } from 'spfx-toolkit/lib/components/spFields/SPChoiceField';
   import { SPTextField } from 'spfx-toolkit/lib/components/spFields/SPTextField';

   Do not change behavior or UI yet. This is a diagnostic experiment.

8. Report findings before implementing any permanent fix:
   - direct source of `@microsoft/sp-lodash-subset`
   - exact import chain if found
   - whether broad toolkit barrels are involved
   - whether `@pnp/spfx-controls-react` is pulled into the initial form customizer bundle
   - whether release bundle still lists `@microsoft/sp-lodash-subset` in AMD `define([...])`
   - recommended minimal fix

Important constraints:
- Do not solve by replacing lodash blindly.
- Do not add package.json `sideEffects` hacks unless evidence points there.
- Do not copy legal-workflow gulpfile wholesale.
- Do not add broad webpack aliases/dedupe changes as first response.
- The goal is to reduce accidental imports and fix the true dependency path.
