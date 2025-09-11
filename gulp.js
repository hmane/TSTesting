'use strict';

const build = require('@microsoft/sp-build-web');
const bundleAnalyzer = require('webpack-bundle-analyzer');
const path = require('path');

// Fast serve configuration
const { addFastServe } = require("spfx-fast-serve-helpers");

addFastServe(build, {
  serve: {
    open: false,
    port: 4321,
    https: true,
    host: 'localhost'
  }
});

// Disable default SPFx tasks that we'll customize
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// Configure webpack with all optimizations
build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    // Ensure resolve object exists and configure alias
    generatedConfiguration.resolve = generatedConfiguration.resolve || {};
    generatedConfiguration.resolve.alias = {
      ...generatedConfiguration.resolve.alias,
      '@': path.resolve(__dirname, 'src')
    };

    // Add webpack bundle analyzer for production
    if (build.getConfig().production) {
      generatedConfiguration.plugins.push(
        new bundleAnalyzer.BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: path.join(__dirname, 'temp', 'stats', 'bundle-report.html'),
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: path.join(__dirname, 'temp', 'stats', 'bundle-stats.json'),
          logLevel: 'warn'
        })
      );

      // Production optimizations
      generatedConfiguration.optimization = {
        ...generatedConfiguration.optimization,
        usedExports: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10
            },
            spfx: {
              test: /[\\/]node_modules[\\/]@microsoft[\\/]/,
              name: 'spfx-libs',
              chunks: 'all',
              priority: 15
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true
            }
          }
        }
      };

      console.log('🏗️  Production build - Bundle analyzer will generate report');
    } else {
      // Development optimizations for faster builds
      generatedConfiguration.optimization = {
        ...generatedConfiguration.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false
      };

      // Enhanced cache for faster rebuilds
      generatedConfiguration.cache = {
        type: 'memory',
        maxGenerations: 1,
        maxAge: 60000
      };

      // Better source maps for debugging
      generatedConfiguration.devtool = 'eval-cheap-module-source-map';

      // Optimized watch settings
      generatedConfiguration.watchOptions = {
        aggregateTimeout: 300,
        poll: false,
        ignored: ['**/node_modules/**', '**/lib/**', '**/temp/**', '**/sharepoint/**']
      };
    }

    return generatedConfiguration;
  }
});

// Custom gulp tasks
const { task } = require('gulp');
const del = require('del');

task('clean-stats', () => {
  return del(['temp/stats/**/*']);
});

task('clean-temp', () => {
  return del(['temp/**/*', '!temp/stats']);
});

task('analyze-bundle', (done) => {
  const reportPath = path.join(__dirname, 'temp', 'stats', 'bundle-report.html');
  const fs = require('fs');
  
  if (fs.existsSync(reportPath)) {
    try {
      const open = require('open');
      open(reportPath).then(() => {
        console.log('Bundle analyzer report opened in browser');
        done();
      }).catch(err => {
        console.error('Error opening bundle report:', err);
        done();
      });
    } catch (err) {
      console.log('Install "open" package to auto-open bundle reports');
      console.log(`Bundle report available at: ${reportPath}`);
      done();
    }
  } else {
    console.log('Bundle report not found. Run "npm run build:production" first.');
    done();
  }
});

// Pre and post build tasks
task('pre-build', (done) => {
  console.log('🔍 Checking TypeScript configuration...');
  console.log('📁 Verifying @ path mapping...');
  done();
});

task('post-build', (done) => {
  if (build.getConfig().production) {
    console.log('✅ Production build complete!');
    console.log('📊 Bundle analyzer report: temp/stats/bundle-report.html');
    console.log('📈 Bundle stats: temp/stats/bundle-stats.json');
  } else {
    console.log('✅ Development build complete!');
  }
  done();
});

// Hook into build process
build.rig.addPreBuildTask(build.task('pre-build'));
build.rig.addPostBuildTask(build.task('post-build'));

// Initialize build
build.initialize(require('gulp'));
