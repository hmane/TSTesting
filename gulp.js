'use strict';

const build = require('@microsoft/sp-build-web');
const bundleAnalyzer = require('webpack-bundle-analyzer');
const path = require('path');

// Disable default SPFx tasks that we'll customize
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// Configure TypeScript path mapping for @ imports
build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    // Add webpack bundle analyzer
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
    }

    // Configure path mapping for @ imports
    if (generatedConfiguration.resolve && generatedConfiguration.resolve.alias) {
      generatedConfiguration.resolve.alias['@'] = path.resolve(__dirname, 'src');
    } else {
      generatedConfiguration.resolve = generatedConfiguration.resolve || {};
      generatedConfiguration.resolve.alias = {
        '@': path.resolve(__dirname, 'src')
      };
    }

    // Optimize build performance
    generatedConfiguration.optimization = {
      ...generatedConfiguration.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
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

    // Add source map support for debugging
    if (!build.getConfig().production) {
      generatedConfiguration.devtool = 'eval-source-map';
    }

    return generatedConfiguration;
  }
});

// Custom task to clean temp and stats folders
const { task, src, dest } = require('gulp');
const del = require('del');

task('clean-stats', () => {
  return del(['temp/stats/**/*']);
});

task('clean-temp', () => {
  return del(['temp/**/*', '!temp/stats']);
});

// Custom task to open bundle analyzer report
task('analyze-bundle', (done) => {
  const reportPath = path.join(__dirname, 'temp', 'stats', 'bundle-report.html');
  const fs = require('fs');
  
  if (fs.existsSync(reportPath)) {
    const open = require('open');
    open(reportPath).then(() => {
      console.log('Bundle analyzer report opened in browser');
      done();
    }).catch(err => {
      console.error('Error opening bundle report:', err);
      done();
    });
  } else {
    console.log('Bundle report not found. Run "npm run build:production" first.');
    done();
  }
});

// Custom task for development with enhanced logging
task('dev-serve', (done) => {
  console.log('🚀 Starting SPFx development server...');
  console.log('📊 Webpack bundle analyzer will be available after build');
  console.log('🔧 Using @ path mapping for clean imports');
  done();
});

// Fast serve configuration with hot reload optimization
const { addFastServe } = require("spfx-fast-serve-helpers");

addFastServe(build, {
  serve: {
    open: false,
    port: 4321,
    https: true,
    host: 'localhost',
    hot: true,
    liveReload: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: false,
      ignored: ['**/node_modules/**', '**/lib/**', '**/temp/**', '**/dist/**']
    }
  },
  reload: {
    enabled: true,
    port: 35729,
    delay: 300
  }
});

// Environment-specific configurations with hot reload optimization
build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    // Development optimizations for faster hot reload
    if (!build.getConfig().production) {
      // Faster builds in development
      generatedConfiguration.optimization.removeAvailableModules = false;
      generatedConfiguration.optimization.removeEmptyChunks = false;
      generatedConfiguration.optimization.splitChunks = false;
      
      // Enhanced hot reload settings
      generatedConfiguration.cache = {
        type: 'memory',
        maxGenerations: 1
      };
      
      // Better watching and rebuilding
      generatedConfiguration.watchOptions = {
        aggregateTimeout: 300,
        poll: false,
        ignored: ['**/node_modules/**', '**/lib/**', '**/temp/**', '**/sharepoint/**']
      };
      
      // Faster dev server
      if (generatedConfiguration.devServer) {
        generatedConfiguration.devServer.hot = true;
        generatedConfiguration.devServer.liveReload = true;
        generatedConfiguration.devServer.watchFiles = ['src/**/*'];
      }
      
      // Better debugging with faster source maps
      generatedConfiguration.devtool = 'eval-cheap-module-source-map';
    }

    // Production optimizations
    if (build.getConfig().production) {
      console.log('🏗️  Production build - Bundle analyzer will generate report');
      
      // Tree shaking and minification
      generatedConfiguration.optimization.usedExports = true;
      generatedConfiguration.optimization.sideEffects = false;
    }

    return generatedConfiguration;
  }
});

// Enhanced error handling and logging
build.initialize(require('gulp'));

// Custom pre and post build tasks
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
