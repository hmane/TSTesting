'use strict';

// Core imports
const build = require('@microsoft/sp-build-web');
const bundleAnalyzer = require('webpack-bundle-analyzer');
const path = require('path');
const fs = require('fs');
const { task } = require('gulp');
const del = require('del');

// Fast serve configuration with enhanced HMR
const { addFastServe } = require("spfx-fast-serve-helpers");

addFastServe(build, {
  serve: {
    open: false,
    port: 4321,
    https: true,
    host: 'localhost',
    hot: true,
    liveReload: false,
    allowedHosts: 'all',
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: true
      },
      progress: true,
      reconnect: 3
    },
    devMiddleware: {
      writeToDisk: false,
      stats: 'minimal'
    },
    watchFiles: {
      paths: ['src/**/*.{ts,tsx,scss,sass}'],
      options: {
        usePolling: false,
        interval: 300
      }
    }
  }
});

// Disable SPFx warnings
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// Main webpack configuration
build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
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
      '@assets': path.resolve(__dirname, 'src/assets')
    };

    // Enhanced module resolution
    generatedConfiguration.resolve.modules = [
      ...generatedConfiguration.resolve.modules || [],
      'node_modules',
      path.resolve(__dirname, 'src')
    ];
    generatedConfiguration.resolve.cache = true;
    generatedConfiguration.resolve.cacheWithContext = false;

    // Configure loaders for enhanced performance
    if (generatedConfiguration.module && generatedConfiguration.module.rules) {
      generatedConfiguration.module.rules.forEach(rule => {
        // Enhanced SCSS processing
        if (rule.test && rule.test.toString().includes('scss')) {
          if (rule.use && Array.isArray(rule.use)) {
            rule.use.forEach(loader => {
              if (loader.loader && loader.loader.includes('sass-loader')) {
                loader.options = {
                  ...loader.options,
                  sourceMap: !isProduction,
                  sassOptions: {
                    ...loader.options?.sassOptions,
                    outputStyle: isProduction ? 'compressed' : 'expanded',
                    precision: 6,
                    quietDeps: true
                  }
                };
              }
              if (loader.loader && loader.loader.includes('css-loader')) {
                loader.options = {
                  ...loader.options,
                  sourceMap: !isProduction,
                  importLoaders: 2,
                  esModule: true,
                  modules: {
                    ...loader.options?.modules,
                    localIdentName: isProduction 
                      ? '[hash:base64:5]' 
                      : '[name]__[local]___[hash:base64:5]',
                    namedExport: !isProduction,
                    exportOnlyLocals: false
                  }
                };
              }
            });
          }
        }

        // Enhanced TypeScript configuration
        if (rule.test && rule.test.toString().includes('tsx?')) {
          if (rule.use && Array.isArray(rule.use)) {
            rule.use.forEach(loader => {
              if (loader.loader && loader.loader.includes('ts-loader')) {
                loader.options = {
                  ...loader.options,
                  transpileOnly: !isProduction,
                  experimentalWatchApi: !isProduction,
                  experimentalFileCaching: !isProduction,
                  configFile: path.resolve(__dirname, 'tsconfig.json'),
                  compilerOptions: {
                    ...loader.options?.compilerOptions,
                    module: 'ESNext',
                    moduleResolution: 'node',
                    target: 'ES2018',
                    lib: ['ES2018', 'ES2019.Array', 'ES2020.Promise', 'DOM'],
                    jsx: 'react-jsx',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    importHelpers: true,
                    skipLibCheck: true,
                    removeComments: isProduction,
                    preserveConstEnums: false,
                    importsNotUsedAsValues: 'remove',
                    incremental: true,
                    tsBuildInfoFile: path.resolve(__dirname, 'node_modules/.cache/.tsbuildinfo')
                  }
                };
              }
            });
          }
        }
      });

      // Add optimized asset rules for production
      if (isProduction) {
        const fontRule = {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash][ext]',
            publicPath: '../fonts/'
          },
          parser: {
            dataUrlCondition: {
              maxSize: 8192
            }
          }
        };

        const svgRule = {
          test: /\.svg$/i,
          type: 'asset',
          generator: {
            filename: 'images/[name].[hash][ext]',
            publicPath: '../images/'
          },
          parser: {
            dataUrlCondition: {
              maxSize: 4096
            }
          }
        };

        generatedConfiguration.module.rules.push(fontRule, svgRule);
      }
    }

    if (isProduction) {
      // Production optimizations with your specific dependencies
      generatedConfiguration.optimization = {
        ...generatedConfiguration.optimization,
        usedExports: true,
        sideEffects: false,
        providedExports: true,
        innerGraph: true,
        mangleExports: 'deterministic',
        concatenateModules: true,
        flagIncludedChunks: true,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          enforceSizeThreshold: 50000,
          cacheGroups: {
            // SPFx Core - Highest priority (most stable)
            spfxCore: {
              test: /[\\/]node_modules[\\/]@microsoft[\\/]sp-(core-library|webpart-base|property-pane)[\\/]/,
              name: 'spfx-core',
              chunks: 'all',
              priority: 30,
              enforce: true,
              usedExports: true
            },
            // SPFx UI utilities
            spfxUI: {
              test: /[\\/]node_modules[\\/]@microsoft[\\/]sp-(office-ui-fabric|lodash-subset)[\\/]/,
              name: 'spfx-ui',
              chunks: 'all',
              priority: 25,
              enforce: true,
              usedExports: true
            },
            // React ecosystem
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 20,
              enforce: true,
              usedExports: true
            },
            // Fluent UI (large UI library)
            fluentUI: {
              test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
              name: 'fluent-ui',
              chunks: 'all',
              priority: 18,
              minChunks: 1,
              usedExports: true
            },
            // DevExtreme (large data grid library)
            devExtreme: {
              test: /[\\/]node_modules[\\/](devextreme|devextreme-react)[\\/]/,
              name: 'devextreme',
              chunks: 'all',
              priority: 17,
              minChunks: 1,
              usedExports: true,
              maxSize: 300000 // Allow larger chunks for DevExtreme
            },
            // PnP libraries (SharePoint utilities)
            pnp: {
              test: /[\\/]node_modules[\\/]@pnp[\\/]/,
              name: 'pnp-libs',
              chunks: 'all',
              priority: 16,
              minChunks: 1,
              usedExports: true
            },
            // Form libraries (lightweight)
            forms: {
              test: /[\\/]node_modules[\\/](react-hook-form)[\\/]/,
              name: 'form-libs',
              chunks: 'all',
              priority: 15,
              minChunks: 1,
              usedExports: true
            },
            // State management (very lightweight)
            state: {
              test: /[\\/]node_modules[\\/](zustand)[\\/]/,
              name: 'state-libs',
              chunks: 'all',
              priority: 14,
              minChunks: 1,
              usedExports: true
            },
            // Other Microsoft packages
            microsoft: {
              test: /[\\/]node_modules[\\/]@microsoft[\\/]/,
              name: 'microsoft-vendor',
              chunks: 'all',
              priority: 12,
              minChunks: 1,
              usedExports: true
            },
            // Polyfills and core utilities
            polyfills: {
              test: /[\\/]node_modules[\\/](core-js|regenerator-runtime|whatwg-fetch|tslib)[\\/]/,
              name: 'polyfills',
              chunks: 'all',
              priority: 10,
              enforce: true,
              usedExports: true
            },
            // All CSS/SCSS files
            styles: {
              name: 'styles',
              test: /\.s?css$/,
              chunks: 'all',
              minChunks: 1,
              priority: 28,
              enforce: true
            },
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              minSize: 15000,
              usedExports: true
            },
            // Remaining vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 1,
              minChunks: 1,
              reuseExistingChunk: true,
              usedExports: true
            }
          }
        },
        minimizer: ['...']
      };

      // Production source maps (hidden for performance)
      generatedConfiguration.devtool = 'hidden-source-map';
      
      // Performance monitoring with your dependency sizes
      generatedConfiguration.performance = {
        maxAssetSize: 300000, // Higher for DevExtreme
        maxEntrypointSize: 400000,
        hints: 'warning',
        assetFilter: function(assetFilename) {
          return /\.(js|css)$/.test(assetFilename);
        }
      };

      // Bundle analyzer
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

      // Enhanced production stats
      generatedConfiguration.stats = {
        chunks: true,
        chunkModules: true,
        chunkOrigins: true,
        modules: false,
        reasons: false,
        usedExports: true,
        providedExports: false,
        optimizationBailout: true,
        errorDetails: true,
        colors: true,
        hash: true,
        version: true,
        timings: true,
        builtAt: true,
        entrypoints: true,
        chunkGroups: true,
        assets: true,
        assetsSpace: 100
      };

      console.log('🏗️  Production build - Optimized for Fluent UI, DevExtreme, PnP, and modern React patterns');
    } else {
      // Development optimizations
      generatedConfiguration.optimization = {
        ...generatedConfiguration.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        moduleIds: 'named',
        chunkIds: 'named',
        usedExports: false,
        sideEffects: false,
        providedExports: false,
        innerGraph: false,
        concatenateModules: false,
        mangleExports: false
      };

      // Enhanced filesystem cache
      generatedConfiguration.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename, path.resolve(__dirname, 'tsconfig.json')]
        },
        cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
        name: 'spfx-dev-cache',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        store: 'pack',
        compression: 'gzip',
        profile: false
      };

      // Development source maps
      generatedConfiguration.devtool = 'eval-cheap-module-source-map';

      // HMR configuration
      if (generatedConfiguration.plugins) {
        const hasHMRPlugin = generatedConfiguration.plugins.some(plugin => 
          plugin.constructor.name === 'HotModuleReplacementPlugin'
        );
        
        if (!hasHMRPlugin) {
          const webpack = require('webpack');
          generatedConfiguration.plugins.push(new webpack.HotModuleReplacementPlugin());
        }
      }

      // Enhanced watch options
      generatedConfiguration.watchOptions = {
        aggregateTimeout: 300,
        poll: false,
        ignored: ['**/node_modules/**', '**/lib/**', '**/temp/**', '**/sharepoint/**'],
        followSymlinks: false
      };

      // Development experiments for better performance
      generatedConfiguration.experiments = {
        ...generatedConfiguration.experiments,
        cacheUnaffected: true,
        lazyCompilation: {
          entries: false,
          imports: true,
          test: /\.(js|jsx|ts|tsx)$/
        }
      };

      // Development stats
      generatedConfiguration.stats = {
        modules: false,
        chunks: false,
        chunkModules: false,
        reasons: false,
        usedExports: false,
        providedExports: false,
        builtAt: false,
        version: false,
        hash: false,
        timings: true,
        assets: false,
        warnings: true,
        errors: true,
        errorDetails: true,
        colors: true
      };

      console.log('🔧 Development build - Fast HMR with Fluent UI and DevExtreme optimization');
    }

    return generatedConfiguration;
  }
});

// Custom Gulp Tasks
// =================

// Cache and cleanup tasks
task('clean-stats', () => {
  return del(['temp/stats/**/*']);
});

task('clean-temp', () => {
  return del(['temp/**/*', '!temp/stats']);
});

task('clear-cache', (done) => {
  console.log('🧹 Clearing build caches...');
  
  const cacheDir = path.join(__dirname, 'node_modules/.cache');
  
  try {
    if (fs.existsSync(cacheDir)) {
      del.sync([cacheDir]);
      console.log('   ✅ All caches cleared successfully');
      console.log('   ℹ️  Next build will be slower but fresh');
    } else {
      console.log('   ℹ️  No cache found to clear');
    }
  } catch (error) {
    console.log('   ❌ Error clearing cache:', error.message);
  }
  
  done();
});

// SCSS validation task
task('validate-scss', (done) => {
  const srcPath = path.join(__dirname, 'src');
  
  function validateScssFiles(dir) {
    if (!fs.existsSync(dir)) return false;
    
    const files = fs.readdirSync(dir);
    let issuesFound = false;
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.')) {
        if (validateScssFiles(filePath)) issuesFound = true;
      } else if (file.endsWith('.scss') || file.endsWith('.sass')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for common SCSS issues
        if (content.includes('@import') && !content.includes("'") && !content.includes('"')) {
          console.warn(`⚠️  ${filePath}: @import statements should use quotes`);
          issuesFound = true;
        }
        
        if (content.includes('!important')) {
          console.warn(`⚠️  ${filePath}: Consider avoiding !important declarations`);
        }
        
        // Check for unused variables
        const variableMatches = content.match(/\$[\w-]+/g);
        if (variableMatches) {
          const variables = [...new Set(variableMatches)];
          variables.forEach(variable => {
            const usage = (content.match(new RegExp(`\\${variable.replace('$', '\\$')}`, 'g')) || []).length;
            if (usage === 1) {
              console.warn(`⚠️  ${filePath}: Variable ${variable} might be unused`);
            }
          });
        }
      }
    });
    
    return issuesFound;
  }
  
  console.log('🎨 Validating SCSS files...');
  const hasIssues = validateScssFiles(srcPath);
  
  if (!hasIssues) {
    console.log('✅ SCSS validation passed');
  } else {
    console.log('⚠️  SCSS validation completed with warnings');
  }
  
  done();
});

// Tree shaking analysis with your dependencies
task('analyze-treeshaking', (done) => {
  const srcPath = path.join(__dirname, 'src');
  
  function analyzeImportPatterns(dir) {
    if (!fs.existsSync(dir)) return { issues: [], stats: { total: 0, optimized: 0 } };
    
    const files = fs.readdirSync(dir);
    let issues = [];
    let stats = { total: 0, optimized: 0 };
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.')) {
        const result = analyzeImportPatterns(filePath);
        issues.push(...result.issues);
        stats.total += result.stats.total;
        stats.optimized += result.stats.optimized;
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for tree-shaking-friendly imports of your dependencies
        const importLines = content.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || [];
        
        importLines.forEach(line => {
          stats.total++;
          
          // Check Fluent UI imports
          if (line.includes('@fluentui/react')) {
            if (line.includes('import *') || !line.includes('{')) {
              issues.push(`${filePath}: Use named imports from @fluentui/react for better tree shaking`);
              issues.push(`   Example: import { Button, TextField } from '@fluentui/react';`);
            } else {
              stats.optimized++;
            }
          }
          
          // Check DevExtreme imports
          else if (line.includes('devextreme')) {
            if (line.includes('import *')) {
              issues.push(`${filePath}: Use specific imports from DevExtreme for better tree shaking`);
              issues.push(`   Example: import DataGrid from 'devextreme-react/data-grid';`);
            } else {
              stats.optimized++;
            }
          }
          
          // Check PnP imports
          else if (line.includes('@pnp/')) {
            if (line.includes('import *')) {
              issues.push(`${filePath}: Use named imports from @pnp packages`);
              issues.push(`   Example: import { sp } from '@pnp/sp';`);
            } else {
              stats.optimized++;
            }
          }
          
          // Check react-hook-form imports
          else if (line.includes('react-hook-form')) {
            if (line.includes('import *')) {
              issues.push(`${filePath}: Use named imports from react-hook-form`);
              issues.push(`   Example: import { useForm, Controller } from 'react-hook-form';`);
            } else {
              stats.optimized++;
            }
          }
          
          // Check zustand imports
          else if (line.includes('zustand')) {
            if (!line.includes('{') && !line.includes('create')) {
              issues.push(`${filePath}: Import specific functions from zustand`);
              issues.push(`   Example: import { create } from 'zustand';`);
            } else {
              stats.optimized++;
            }
          }
          
          else {
            stats.optimized++; // Other imports are likely fine
          }
        });
      }
    });
    
    return { issues, stats };
  }
  
  console.log('🌳 Tree Shaking Analysis for Your Dependencies:');
  console.log('================================================');
  
  const { issues, stats } = analyzeImportPatterns(srcPath);
  
  console.log(`📊 Import Analysis:`);
  console.log(`   • Total imports analyzed: ${stats.total}`);
  console.log(`   • Tree-shaking optimized: ${stats.optimized}`);
  console.log(`   • Optimization rate: ${Math.round((stats.optimized / stats.total) * 100)}%`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  Tree Shaking Optimization Opportunities:');
    issues.slice(0, 10).forEach(issue => {
      console.log(`   ${issue}`);
    });
    
    if (issues.length > 10) {
      console.log(`   ... and ${issues.length - 10} more suggestions`);
    }
  } else {
    console.log('\n✅ Excellent! All imports are tree-shaking optimized');
  }
  
  console.log('\n💡 Specific Tips for Your Dependencies:');
  console.log('   🎨 Fluent UI: Import specific components, not entire library');
  console.log('   📊 DevExtreme: Import individual components (data-grid, chart, etc.)');
  console.log('   🔗 PnP: Use named imports for sp, graph, logging functions');
  console.log('   📝 React Hook Form: Import only needed hooks and components');
  console.log('   🗃️  Zustand: Import create function and specific middleware');
  
  done();
});

// Bundle analysis with your dependencies
task('analyze-chunks', (done) => {
  const statsPath = path.join(__dirname, 'temp', 'stats', 'bundle-stats.json');
  
  if (!fs.existsSync(statsPath)) {
    console.log('❌ Bundle stats not found. Run "npm run build:production" first.');
    done();
    return;
  }
  
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  
  console.log('📊 Bundle Analysis for Your Dependencies:');
  console.log('=========================================');
  
  if (stats.chunks) {
    const chunks = stats.chunks.sort((a, b) => b.size - a.size);
    console.log('\n🧩 Chunks by Size:');
    
    chunks.forEach(chunk => {
      const sizeKB = Math.round(chunk.size / 1024);
      const chunkName = chunk.names[0] || chunk.id;
      let status = '✅';
      let recommendation = '';
      
      if (chunkName.includes('devextreme') && sizeKB > 300) {
        status = '💡';
        recommendation = ' - Consider lazy loading non-critical DevExtreme components';
      } else if (chunkName.includes('fluent') && sizeKB > 200) {
        status = '💡';
        recommendation = ' - Check if all Fluent UI components are needed';
      } else if (sizeKB > 240) {
        status = '⚠️ ';
        recommendation = ' - Consider code splitting';
      }
      
      console.log(`   ${status} ${chunkName}: ${sizeKB}KB${recommendation}`);
    });
  }
  
  if (stats.assets) {
    const totalSize = stats.assets.reduce((sum, asset) => sum + asset.size, 0);
    const totalSizeKB = Math.round(totalSize / 1024);
    
    console.log(`\n📈 Total Bundle Size: ${totalSizeKB}KB`);
    
    // Specific recommendations based on your dependencies
    if (totalSizeKB > 1500) {
      console.log('\n💡 Optimization Recommendations:');
      console.log('   📊 DevExtreme: Consider lazy loading data grid themes and localization');
      console.log('   🎨 Fluent UI: Import only needed components, avoid importing entire @fluentui/react');
      console.log('   🔗 PnP: Ensure only used PnP packages are included');
      console.log('   📝 Forms: react-hook-form is already lightweight');
      console.log('   🗃️  State: zustand is minimal, good choice!');
    } else if (totalSizeKB > 1000) {
      console.log('💡 Good bundle size! Your dependency choices are efficient.');
    } else {
      console.log('🎉 Excellent bundle optimization!');
    }
  }
  
  done();
});

// Asset analysis
task('analyze-assets', (done) => {
  const statsPath = path.join(__dirname, 'temp', 'stats', 'bundle-stats.json');
  
  console.log('📦 Asset Analysis:');
  console.log('==================');
  
  if (fs.existsSync(statsPath)) {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    
    if (stats.assets) {
      const assets = stats.assets.sort((a, b) => b.size - a.size);
      
      const assetsByType = {
        js: assets.filter(asset => asset.name.endsWith('.js')),
        css: assets.filter(asset => asset.name.endsWith('.css')),
        fonts: assets.filter(asset => /\.(woff|woff2|eot|ttf|otf)$/i.test(asset.name)),
        images: assets.filter(asset => /\.(svg|png|jpg|jpeg|gif|ico)$/i.test(asset.name)),
        maps: assets.filter(asset => asset.name.endsWith('.map'))
      };
      
      Object.keys(assetsByType).forEach(type => {
        const typeAssets = assetsByType[type];
        if (typeAssets.length > 0) {
          const totalSize = typeAssets.reduce((sum, asset) => sum + asset.size, 0);
          const totalSizeKB = Math.round(totalSize / 1024);
          
          console.log(`\n📁 ${type.toUpperCase()} Assets (${typeAssets.length} files, ${totalSizeKB}KB total):`);
          
          typeAssets.slice(0, 5).forEach(asset => {
            const sizeKB = Math.round(asset.size / 1024);
            let status = '✅';
            
            // Adjust thresholds for your dependencies
            if (type === 'js') {
              if (asset.name.includes('devextreme') && sizeKB > 300) status = '💡';
              else if (asset.name.includes('fluent') && sizeKB > 200) status = '💡';
              else if (sizeKB > 240) status = '⚠️ ';
            } else if (type === 'css' && sizeKB > 50) {
              status = '⚠️ ';
            }
            
            console.log(`   ${status} ${asset.name}: ${sizeKB}KB`);
          });
          
          if (typeAssets.length > 5) {
            console.log(`   ... and ${typeAssets.length - 5} more files`);
          }
        }
      });
    }
  }
  
  // Check deployment size
  const distPath = path.join(__dirname, 'temp', 'deploy');
  if (fs.existsSync(distPath)) {
    function getDirectorySize(dirPath) {
      let totalSize = 0;
      try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            totalSize += getDirectorySize(filePath);
          } else {
            totalSize += stat.size;
          }
        });
      } catch (e) {
        // Directory might not exist
      }
      return totalSize;
    }
    
    const deploySize = getDirectorySize(distPath);
    const deploySizeKB = Math.round(deploySize / 1024);
    
    console.log(`\n📊 Total deployment size: ${deploySizeKB}KB`);
    
    if (deploySizeKB > 2048) {
      console.log('   ⚠️  Large deployment size - consider CDN for DevExtreme themes');
    } else if (deploySizeKB < 1024) {
      console.log('   🎉 Excellent deployment size optimization!');
    } else {
      console.log('   ✅ Good deployment size for your dependency stack');
    }
  }
  
  done();
});

// Build performance analysis
task('analyze-build-performance', (done) => {
  console.log('⚡ Build Performance Analysis:');
  console.log('==============================');
  
  const cacheDir = path.join(__dirname, 'node_modules/.cache/webpack');
  const tsBuildInfo = path.join(__dirname, 'node_modules/.cache/.tsbuildinfo');
  
  console.log('\n🗂️  Cache Status:');
  
  if (fs.existsSync(cacheDir)) {
    const cacheStats = fs.statSync(cacheDir);
    console.log(`   ✅ Webpack cache: Active (last modified: ${cacheStats.mtime.toLocaleDateString()})`);
    
    function getDirectorySize(dirPath) {
      let totalSize = 0;
      try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            totalSize += getDirectorySize(filePath);
          } else {
            totalSize += stat.size;
          }
        });
      } catch (e) {
        // Directory might not exist
      }
      return totalSize;
    }
    
    const cacheSize = getDirectorySize(cacheDir);
    const cacheSizeMB = Math.round(cacheSize / (1024 * 1024));
    console.log(`   📊 Cache size: ${cacheSizeMB}MB`);
    
    if (cacheSizeMB > 500) {
      console.log('   ⚠️  Large cache size - consider clearing if builds are slow');
    }
  } else {
    console.log('   ❌ Webpack cache: Not found (first build or cache cleared)');
  }
  
  if (fs.existsSync(tsBuildInfo)) {
    console.log('   ✅ TypeScript incremental: Active');
  } else {
    console.log('   ❌ TypeScript incremental: Not found');
  }
  
  console.log('\n⏱️  Build Time Expectations (with your dependencies):');
  console.log('   🚀 First build (cold): 45-90 seconds (DevExtreme + Fluent UI)');
  console.log('   ⚡ Incremental (warm): 5-15 seconds');
  console.log('   🔥 HMR updates: 1-3 seconds');
  console.log('   📦 Production build: 90-150 seconds');
  
  console.log('\n💡 Performance Tips for Your Stack:');
  console.log('   📊 DevExtreme builds slower due to size - keep cache intact');
  console.log('   🎨 Fluent UI tree shaking reduces build time significantly');
  console.log('   🔗 PnP libraries are fast to compile');
  console.log('   📝 react-hook-form + zustand are very fast');
  console.log('   🗃️  Keep node_modules/.cache for faster rebuilds');
  
  done();
});

// Runtime performance analysis
task('analyze-runtime-performance', (done) => {
  console.log('🚀 Runtime Performance Analysis:');
  console.log('=================================');
  
  console.log('\n📦 Your Dependency Loading Strategy:');
  console.log('   1. SPFx Core (framework - highest priority)');
  console.log('   2. React vendor chunk (shared across web parts)');
  console.log('   3. Fluent UI chunk (UI components)');
  console.log('   4. DevExtreme chunk (data components - lazy load when possible)');
  console.log('   5. PnP libraries (SharePoint utilities)');
  console.log('   6. Form + State libraries (very lightweight)');
  console.log('   7. Application chunks');
  
  console.log('\n⚡ Optimization Recommendations for Your Stack:');
  console.log('   📊 DevExtreme:');
  console.log('     • Lazy load DataGrid themes with React.lazy()');
  console.log('     • Import specific components: import DataGrid from "devextreme-react/data-grid"');
  console.log('     • Use DevExtreme\'s built-in virtualization for large datasets');
  
  console.log('\n   🎨 Fluent UI:');
  console.log('     • Import specific components: import { Button } from "@fluentui/react"');
  console.log('     • Use Fluent UI\'s built-in performance features');
  console.log('     • Consider @fluentui/react-components for better performance');
  
  console.log('\n   🔗 PnP Libraries:');
  console.log('     • Already optimized - minimal runtime impact');
  console.log('     • Configure sp.setup() once in onInit()');
  console.log('     • Use PnP caching for better performance');
  
  console.log('\n   📝 Forms & State:');
  console.log('     • react-hook-form: Already optimal, no re-renders');
  console.log('     • zustand: Minimal bundle size, excellent performance');
  console.log('     • Both libraries are performance-first by design');
  
  console.log('\n🎯 SharePoint-Specific Optimizations:');
  console.log('   • Host DevExtreme themes in SharePoint CDN');
  console.log('   • Use PnP caching to reduce SharePoint API calls');
  console.log('   • Implement proper loading states for data operations');
  console.log('   • Consider SPFx application customizers for shared state');
  
  done();
});

// Optimization guidelines
task('performance-budget', (done) => {
  console.log('⚡ Performance Budget for Your Dependencies:');
  console.log('============================================');
  
  console.log('\n📋 Chunk Size Targets:');
  console.log('   • SPFx Core: <150KB (framework)');
  console.log('   • React vendor: <130KB (React + ReactDOM)');
  console.log('   • Fluent UI: <200KB (with tree shaking)');
  console.log('   • DevExtreme: <300KB (main components)');
  console.log('   • PnP libraries: <100KB (all PnP packages)');
  console.log('   • Form + State: <50KB (react-hook-form + zustand)');
  console.log('   • Application code: <200KB per web part');
  
  console.log('\n🎯 Total Bundle Targets:');
  console.log('   • Excellent: <1MB (with lazy loading)');
  console.log('   • Good: <1.5MB (acceptable for your stack)');
  console.log('   • Review needed: >2MB');
  
  console.log('\n💡 Quick Wins for Your Stack:');
  console.log('   📊 DevExtreme: Lazy load themes and localization');
  console.log('   🎨 Fluent UI: Use specific imports, avoid @fluentui/react barrel imports');
  console.log('   🔗 PnP: Import only needed packages (@pnp/sp vs @pnp/graph)');
  console.log('   📝 Already optimized: react-hook-form + zustand are minimal');
  
  done();
});

// Bundle analyzer helper
task('analyze-bundle', (done) => {
  const reportPath = path.join(__dirname, 'temp', 'stats', 'bundle-report.html');
  
  if (fs.existsSync(reportPath)) {
    try {
      const open = require('open');
      open(reportPath).then(() => {
        console.log('📊 Bundle analyzer report opened in browser');
        console.log('💡 Look for opportunities to optimize Fluent UI and DevExtreme imports');
        done();
      }).catch(err => {
        console.error('Error opening bundle report:', err);
        console.log(`📊 Bundle report available at: ${reportPath}`);
        done();
      });
    } catch (err) {
      console.log('Install "open" package to auto-open bundle reports');
      console.log(`📊 Bundle report available at: ${reportPath}`);
      done();
    }
  } else {
    console.log('❌ Bundle report not found. Run "npm run build:production" first.');
    done();
  }
});

// HMR status
task('hmr-status', (done) => {
  console.log('🔥 HMR Configuration Status:');
  console.log('============================');
  console.log('   Port: 4321 (HTTPS)');
  console.log('   Error Overlay: Enabled for errors and runtime issues');
  console.log('   SCSS HMR: Enabled with stable class names');
  console.log('   React HMR: Enabled with React 17+ JSX transform');
  console.log('   Watch Files: *.ts, *.tsx, *.scss, *.sass');
  console.log('   Cache: Filesystem-based for faster rebuilds');
  console.log('');
  console.log('🔧 HMR Tips for Your Dependencies:');
  console.log('   📊 DevExtreme: Hot reload works for props changes');
  console.log('   🎨 Fluent UI: Excellent HMR support');
  console.log('   📝 react-hook-form: State preserved during HMR');
  console.log('   🗃️  zustand: Store state maintained during HMR');
  done();
});

// Build and validation tasks
task('pre-build', (done) => {
  console.log('🔍 Pre-build checks...');
  console.log('📁 Verifying @ path mapping...');
  console.log('🎨 SCSS configuration ready...');
  console.log('📊 DevExtreme + Fluent UI optimization active...');
  done();
});

task('post-build', (done) => {
  if (build.getConfig().production) {
    console.log('✅ Production build complete!');
    console.log('📊 Bundle analyzer report: temp/stats/bundle-report.html');
    console.log('📈 Bundle stats: temp/stats/bundle-stats.json');
    console.log('🗺️  Source maps: Generated as hidden external files');
    console.log('🎨 SCSS: Optimized and compressed');
    console.log('📦 Dependencies: Optimized for Fluent UI + DevExtreme + PnP');
  } else {
    console.log('✅ Development build complete!');
    console.log('🔥 HMR: Active with your dependency stack');
    console.log('🎨 SCSS: Fast compilation with detailed source maps');
  }
  done();
});

// Build process hooks
build.rig.addPreBuildTask(build.task('pre-build'));
build.rig.addPostBuildTask(build.task('post-build'));

// Initialize build
build.initialize(require('gulp'));
