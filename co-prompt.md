Replace the ENTIRE contents of config/fast-serve/webpack.extend.js with exactly this. The change from
last time: locate @pnp/spfx-controls-react/lib via require.resolve (the previous hardcoded path was wrong
because __dirname is the fast-serve folder, not the project root, so the rewrite never fired).

    const path = require('path');
    const webpack = require('webpack');
    const { applyToolkitWebpackFixes } = require('spfx-toolkit/build');

    // Required by spfx-fast-serve (it merges this before transformConfig).
    const webpackConfig = {};

    const transformConfig = function (initialWebpackConfig) {
      const cfg = applyToolkitWebpackFixes(initialWebpackConfig, { consumerRoot: __dirname });

      // Locate the ACTUAL @pnp/spfx-controls-react/lib by walking up from this config folder to the
      // project's node_modules. Do NOT hardcode a relative path: __dirname here is the fast-serve dir.
      const pnpLib = path.join(
        path.dirname(require.resolve('@pnp/spfx-controls-react/package.json', { paths: [__dirname] })),
        'lib'
      );
      console.log('[toolkit-fix] @pnp controls lib =', pnpLib); // verify this points at project node_modules

      // @pnp/spfx-controls-react 3.24+ ships `.module.scss.css` (real CSS). Rewrite its `.module.scss`
      // imports to `.module.scss.css`, pinned to an inline loader chain (leading "!!") so NO other
      // configured rule — including fast-serve's own css-loader — also processes it (that double pass is
      // the "Unknown word: import" error).
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

    module.exports = { webpackConfig, transformConfig };

Run `npm run serve` and paste the output. Note the line that prints "[toolkit-fix] @pnp controls lib =" —
it should point at C:\Projects\VECM\VendorManagementApp\node_modules\@pnp\spfx-controls-react\lib.
