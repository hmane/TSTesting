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
