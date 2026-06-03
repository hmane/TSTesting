fast-serve can't resolve @pnp/spfx-controls-react@3.24's `./X.module.scss` (3.24 ships `.module.scss.css`;
SPFx's normal build resolves it but fast-serve doesn't). Add ONLY a scss rewrite to webpack.extend.js.
This is a fast-serve + @pnp quirk, NOT spfx-toolkit related. Do not add any aliasing/symlinks/sp-lodash config.

Replace the ENTIRE contents of config/fast-serve/webpack.extend.js with exactly:

    const path = require('path');
    const webpack = require('webpack');

    const webpackConfig = {};

    const transformConfig = function (initialWebpackConfig) {
      const cfg = initialWebpackConfig;

      // @pnp/spfx-controls-react 3.24+ ships `.module.scss.css` (real CSS); its controls import
      // `./X.module.scss`. fast-serve's webpack can't resolve that to the shipped `.css`. Rewrite it,
      // pinned to an inline loader chain (leading "!!") so fast-serve's own css-loader doesn't ALSO
      // process it (double pass = "Unknown word: import").
      const pnpLib = path.join(
        path.dirname(require.resolve('@pnp/spfx-controls-react/package.json', { paths: [__dirname] })),
        'lib'
      );
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

Then run `npm run serve`. Expected: no "Can't resolve .module.scss" errors, all components load, @pnp
controls render styled.
