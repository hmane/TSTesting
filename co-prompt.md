We need to fix a production/runtime issue in this SPFx solution that uses spfx-toolkit.

Problem:
The deployed form customizer crashes after data loads with:

DevExtreme E1012 - Editing type 'selection' with the name 'default' is unsupported

This is not the earlier fast-serve SCSS issue and not the @microsoft/sp-lodash-subset CSP issue. Web parts and field customizers work; only the form customizer fails.

Likely cause:
A DevExtreme SelectBox/TagBox/List path is being rendered in the form customizer, probably through spfx-toolkit fields such as SPLookupField/TagBox with showSelectionControls=true. DevExtreme creates an internal List using list_light, but the List selection decorator registration is missing in the optimized/deployed bundle. DevExtreme registers that via:

devextreme/ui/list/modules/selection

Because DevExtreme marks many subpath packages as sideEffects=false, a side-effect-only static import may be dropped in production. We need an app-side runtime bootstrap that forces this module to execute before the form customizer renders.

Task:
1. Find the form customizer entry point and/or its top-level React component.
2. Add a local bootstrap file, for example:
   src/runtime/ensureDevExtremeListSelection.ts

   It should be idempotent and use runtime require, not a side-effect-only import:

   let ensured = false;

   export function ensureDevExtremeListSelection(): void {
     if (ensured) return;
     // DevExtreme SelectBox/TagBox internal List selection decorator registration.
     // Required for optimized SPFx form-customizer bundles.
     require('devextreme/ui/list/modules/selection');
     ensured = true;
   }

   If TypeScript complains about require, use:
   declare const require: any;

3. Call ensureDevExtremeListSelection() before rendering the form customizer UI, ideally at the top of the form customizer entry module before ReactDOM.render or before the root component mounts.

4. If this form customizer uses DevExtreme controls, also confirm DevExtreme theme CSS is imported once globally:
   import 'devextreme/dist/css/dx.light.css';

5. Do not add broad webpack aliases, resolve.symlinks changes, or package.json sideEffects changes for this issue.
6. Do not change gulpfile or fast-serve config for this production E1012 issue unless absolutely necessary.

Verification:
- Clean build the SPFx solution.
- Run the same release/package/deploy path that reproduced the issue.
- Confirm the form customizer no longer throws E1012.
- Confirm web parts and field customizers still work.
- Report exactly which files changed and why.
