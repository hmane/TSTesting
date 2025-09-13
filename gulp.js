'use strict';

// Core imports
const build = require('@microsoft/sp-build-web');
const bundleAnalyzer = require('webpack-bundle-analyzer');
const path = require('path');
const fs = require('fs');
const { task } = require('gulp');
const del = require('del');

// Fast serve configuration - let it handle HMR automatically
const { addFastServe } = require('spfx-fast-serve-helpers');

addFastServe(build, {
  serve: {
    open: false,
    port: 4321,
    https: true,
  },
});

// Disable SPFx warnings
build.addSuppression(/Warning - \[sass\]/g);
build.addSuppression(/Warning - lint.*/g);

// Main webpack configuration
build.configureWebpack.mergeConfig({
  additionalConfiguration: generatedConfiguration => {
    const isProduction = build.getConfig().production;

    // Configure path aliases to match tsconfig.json
    generatedConfiguration.resolve = generatedConfiguration.resolve || {};
    generatedConfiguration.resolve.alias = {
      ...generatedConfiguration.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    };

    // Enhanced module resolution
    generatedConfiguration.resolve.modules = [
      ...(generatedConfiguration.resolve.modules || []),
      'node_modules',
      path.resolve(__dirname, 'src'),
    ];
    generatedConfiguration.resolve.cache = true;

    if (isProduction) {
      // Production optimizations
      generatedConfiguration.optimization = {
        ...generatedConfiguration.optimization,
        usedExports: true,
        sideEffects: false,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // SPFx Core - Highest priority
            spfxCore: {
              test: /[\\/]node_modules[\\/]@microsoft[\\/]sp-(core-library|webpart-base|property-pane)[\\/]/,
              name: 'spfx-core',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // React ecosystem
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Fluent UI
            fluentUI: {
              test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
              name: 'fluent-ui',
              chunks: 'all',
              priority: 18,
            },
            // DevExtreme
            devExtreme: {
              test: /[\\/]node_modules[\\/](devextreme|devextreme-react)[\\/]/,
              name: 'devextreme',
              chunks: 'all',
              priority: 17,
              maxSize: 300000,
            },
            // PnP libraries
            pnp: {
              test: /[\\/]node_modules[\\/]@pnp[\\/]/,
              name: 'pnp-libs',
              chunks: 'all',
              priority: 16,
            },
            // Form and state libraries
            forms: {
              test: /[\\/]node_modules[\\/](react-hook-form)[\\/]/,
              name: 'form-libs',
              chunks: 'all',
              priority: 15,
            },
            state: {
              test: /[\\/]node_modules[\\/](zustand)[\\/]/,
              name: 'state-libs',
              chunks: 'all',
              priority: 14,
            },
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              minSize: 15000,
            },
            // Remaining vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 1,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Production source maps
      generatedConfiguration.devtool = 'hidden-source-map';

      // Bundle analyzer
      generatedConfiguration.plugins.push(
        new bundleAnalyzer.BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: path.join(__dirname, 'temp', 'stats', 'bundle-report.html'),
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: path.join(__dirname, 'temp', 'stats', 'bundle-stats.json'),
          logLevel: 'warn',
        })
      );

      console.log('🏗️  Production build - Optimized for your dependency stack');
    } else {
      // Development optimizations - keep it simple
      generatedConfiguration.optimization = {
        ...generatedConfiguration.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
        splitChunks: false, // Disable code splitting in dev for faster builds
      };

      // Filesystem cache for faster rebuilds
      generatedConfiguration.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename, path.resolve(__dirname, 'tsconfig.json')],
        },
        cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
        name: 'spfx-dev-cache',
      };

      // Development source maps
      generatedConfiguration.devtool = 'eval-cheap-module-source-map';

      console.log('🔧 Development build - Fast compilation with filesystem cache');
    }

    return generatedConfiguration;
  },
});

// Utility tasks
task('clean-cache', done => {
  console.log('🧹 Clearing build caches...');
  const cacheDir = path.join(__dirname, 'node_modules/.cache');

  if (fs.existsSync(cacheDir)) {
    del.sync([cacheDir]);
    console.log('✅ Cache cleared successfully');
  } else {
    console.log('ℹ️  No cache found');
  }
  done();
});

task('analyze-bundle', done => {
  const reportPath = path.join(__dirname, 'temp', 'stats', 'bundle-report.html');

  if (fs.existsSync(reportPath)) {
    try {
      const open = require('open');
      open(reportPath)
        .then(() => {
          console.log('📊 Bundle analyzer opened');
          done();
        })
        .catch(() => {
          console.log(`📊 Bundle report: ${reportPath}`);
          done();
        });
    } catch {
      console.log(`📊 Bundle report: ${reportPath}`);
      done();
    }
  } else {
    console.log('❌ Run production build first');
    done();
  }
});

// Initialize build
build.initialize(require('gulp'));
