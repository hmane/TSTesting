We need to fix a deployed SPFx form customizer runtime failure:

Loading the script "https://relative-path.invalid/@microsoft/sp-lodash-subset.js" violates CSP
Could not load <form-customizer> in require. Script error for "@microsoft/sp-lodash-subset"

This is not a CSS/styling issue and not fast-serve-only. It happens in the deployed/release form customizer because the bundle declares @microsoft/sp-lodash-subset as an AMD external dependency, and the SharePoint list form host resolves it to relative-path.invalid.

Tasks:
1. Search source/config for any direct runtime import of @microsoft/sp-lodash-subset:
   rg -n "@microsoft/sp-lodash-subset|@microsoft/sp-loader|SPComponentLoader|escape\\(" src package.json gulpfile.js config

2. If there is a direct import like:
   import { escape } from '@microsoft/sp-lodash-subset';
   remove it and replace with a local helper or native code. Do not import @microsoft/sp-lodash-subset anywhere in src.

3. Build the release bundle and verify whether the generated JS still contains @microsoft/sp-lodash-subset:
   npm run release
   rg -n "@microsoft/sp-lodash-subset" lib dist temp release

4. If the built bundle still contains @microsoft/sp-lodash-subset after source cleanup, identify which dependency pulls it in. Likely candidates:
   - @pnp/spfx-controls-react
   - an older local/file-linked spfx-toolkit build
   - any component importing PnP controls

5. If it comes from dependency code, add an app-local shim and force webpack to bundle it:
   - create src/shims/spLodashSubsetShim.ts
   - implement only the functions actually needed by the dependency, or use lodash equivalents
   - update gulpfile webpack config with NormalModuleReplacementPlugin or alias for '@microsoft/sp-lodash-subset' to the compiled shim
   - verify the final deployed bundle no longer has @microsoft/sp-lodash-subset in its AMD define dependency list.

6. Do not solve this with CSS imports, DevExtreme CSS, sideEffects changes, or fast-serve-only config. The success criterion is:
   - deployed form customizer JS does not request https://relative-path.invalid/@microsoft/sp-lodash-subset.js
   - form customizer loads in production
   - web parts and field customizers still work

Report:
- exact source of the @microsoft/sp-lodash-subset dependency
- files changed
- release build result
- whether the built bundle still references @microsoft/sp-lodash-subset
