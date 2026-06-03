The fast-serve crash "Merging undefined is not supported" is because config/fast-serve/webpack.extend.js
no longer exports `webpackConfig`. spfx-fast-serve does merge(generatedConfig, webpackConfig) BEFORE
calling transformConfig, so `webpackConfig` must exist (an empty object is fine).

Replace the ENTIRE contents of config/fast-serve/webpack.extend.js with exactly this:

    const path = require('path');
    const webpack = require('webpack');
    const { applyToolkitWebpackFixes } = require('spfx-toolkit/build');

    // Required by spfx-fast-serve: it runs merge(generatedConfig, webpackConfig) before transformConfig.
    // If webpackConfig is undefined it throws "Merging undefined is not supported".
    const webpackConfig = {};

    const transformConfig = function (initialWebpackConfig) {
      const cfg = applyToolkitWebpackFixes(initialWebpackConfig, { consumerRoot: __dirname });

      // @pnp/spfx-controls-react 3.24+ ships `.module.scss.css` (real CSS). Rewrite its `.module.scss`
      // imports to `.module.scss.css` and pin the loader chain inline with a leading "!!" so NO other
      // configured rule (incl. fast-serve's own css-loader) also processes it -> avoids the double
      // css-loader "Unknown word: import" error.
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

    module.exports = { webpackConfig, transformConfig };

Then run `npm run serve` again and report the full output.
