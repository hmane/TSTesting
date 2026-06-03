Fix a fast-serve build error consuming @pnp/spfx-controls-react@3.24 in this SPFx app.
Change ONLY config/fast-serve/webpack.extend.js. Do NOT touch gulpfile.js this round.

== WHY ==
@pnp/spfx-controls-react@3.24 ships `X.module.scss.css` (real CSS), and its controls do
`import './X.module.scss'`. Two things must happen:
(1) rewrite `./X.module.scss` -> `./X.module.scss.css` so it resolves;
(2) ensure ONLY ONE css loader chain processes it. spfx-fast-serve injects its OWN css rule that
also matches `.module.scss.css`; when two css rules stack, css-loader receives style-loader's JS and
throws "Module build failed ... Unknown word: import". Excluding fast-serve's rule is unreliable
(it's merged after our transform). So we rewrite the request to an INLINE loader chain prefixed with
"!!", which tells webpack to ignore all configured rules for that request -> no double-processing.

== ACTION ==
Replace the ENTIRE contents of config/fast-serve/webpack.extend.js with exactly this:

    const path = require('path');
    const webpack = require('webpack');
    const { applyToolkitWebpackFixes } = require('spfx-toolkit/build');

    const transformConfig = function (initialWebpackConfig) {
      const cfg = applyToolkitWebpackFixes(initialWebpackConfig, { consumerRoot: __dirname });

      // @pnp/spfx-controls-react 3.24+ ships `.module.scss.css` (real CSS, no `.module.scss.js`).
      // Rewrite its `.module.scss` imports to `.module.scss.css` and pin the loader chain inline.
      // The leading "!!" disables ALL configured rules for this request, so spfx-fast-serve's own
      // css rule cannot also process it (that double-processing is the "Unknown word: import" error).
      const pnpLib = path.resolve(__dirname, 'node_modules', '@pnp', 'spfx-controls-react', 'lib');
      const cssQuery = JSON.stringify({ modules: { localIdentName: '[local]' } });
      cfg.plugins = cfg.plugins || [];
      cfg.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/\.module\.scss$/, (resource) => {
          if (resource.context && resource.context.startsWith(pnpLib)) {
            resource.request = `!!style-loader!css-loader?${cssQuery}!${resource.request}.css`;
          }
        })
      );

      return cfg;
    };

    module.exports = { transformConfig };

This intentionally removes the previous workaround (the `.js`/`.css` NormalModuleReplacement plugins,
the `pnpScssExclude` exclude loop, and the pushed `{ test: /\.module\.scss\.css$/ ... }` rule) — the
inline "!!" chain replaces all of it. If you were also consuming a separate `spfx-component-library`
that needed a `.module.scss -> .js` rewrite, tell me before removing that specific plugin.

== VERIFY ==
- Delete temp/ and dist/ if present, then run `npm run serve`.
- Expected: no "Can't resolve .module.scss" and no "Unknown word: import" errors; @pnp controls
  (people picker, taxonomy picker, ManageAccess, field renderers) render styled.

Do NOT add a `sideEffects` field to package.json. Show me the full new file and the serve result.
If it STILL fails, add this line as the first statement inside transformConfig and share the file it writes:
  require('fs').writeFileSync(require('path').join(__dirname,'merged-rules.json'),
    JSON.stringify(initialWebpackConfig.module.rules,(k,v)=>v instanceof RegExp?v.toString():v,2));
