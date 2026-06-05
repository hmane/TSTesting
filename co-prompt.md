We are changing the package’s public import contract.

Because `spfx-toolkit` has a `package.json` `exports` map, Node and bundlers no longer allow consumers to import arbitrary files from the package just because they exist in `lib/`. Every supported public path must be listed in `exports`. That is why paths like `spfx-toolkit/lib/utilities/batchBuilder`, direct CSS imports, and `spfx-toolkit/package.json` were failing even though some of those files were present after build.

The first change exposes package metadata:

```json
"./package.json": "./package.json"
```

Why: some tooling calls `require.resolve("spfx-toolkit/package.json")`. Without this export, Node throws `ERR_PACKAGE_PATH_NOT_EXPORTED`.

The second change restores a stable legacy deep import:

```json
"./lib/utilities/batchBuilder": {
  "types": "./lib/utilities/batchBuilder/index.d.ts",
  "import": "./lib/utilities/batchBuilder/index.js",
  "require": "./lib/utilities/batchBuilder/index.js"
}
```

Why: consumers already import `spfx-toolkit/lib/utilities/batchBuilder`. The existing wildcard export was not enough for this folder-style path because Node needs a concrete mapping to `index.js` and `index.d.ts`.

The third change allows shipped CSS files to be imported directly:

```json
"./lib/*.css": "./lib/*.css"
```

Why: the build already copies CSS into `lib`, but the exports map blocked consumers from importing paths like:

```ts
import "spfx-toolkit/lib/components/VersionHistory/VersionHistory.css";
```

The fourth change prevents the build helper from treating `./package.json` as a directory-style proxy export:

```js
if (exportKey === '.' || exportKey === './package.json' || exportKey === './lib/*') {
  return;
}
```

Why: this repo generates compatibility proxy folders from export entries. `./package.json` is just a file export, so it should not get a generated proxy package.

The regression test locks this down:

```js
assert.doesNotThrow(() => require.resolve("spfx-toolkit/package.json"));
assert.doesNotThrow(() => require.resolve("spfx-toolkit/lib/utilities/batchBuilder"));
assert.doesNotThrow(() => require.resolve("spfx-toolkit/lib/components/VersionHistory/VersionHistory.css"));
assert.doesNotThrow(() => require.resolve("spfx-toolkit/utilities/context/pnpImports/core"));
```

Why: this catches future changes that accidentally remove or break these public paths.

In short: we are not changing runtime behavior of the toolkit components. We are fixing what package paths consumers are allowed to resolve.
