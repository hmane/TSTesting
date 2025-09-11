/**
 * src/context/environment/detector.ts
 * Enhanced environment detection for SPFx applications
 */

import { Environment, EnvironmentType } from '@microsoft/sp-core-library';
import type { LogLevel } from '@pnp/logging';
import type { BuildMode, CacheStrategy, EnvironmentConfig, EnvironmentName } from '../utils/types';

/**
 * Default environment detection patterns
 */
const DEFAULT_PATTERNS: EnvironmentConfig['patterns'] = {
  dev: ['debug', 'dev', 'localhost', 'workbench'],
  uat: ['uat', 'staging', 'test'],
  prod: [], // Everything else defaults to prod
};

/**
 * Detects the current build mode based on SPFx environment and URL patterns
 */
export function detectBuildMode(): BuildMode {
  try {
    // Check SPFx environment first
    if (Environment.type === EnvironmentType.Local) {
      return 'development';
    }

    if (Environment.type === EnvironmentType.Test) {
      return 'test';
    }

    // Check for debug manifests (spfx-fast-serve or local workbench)
    const searchParams = new URLSearchParams(window.location.search);
    const hasDebugManifests =
      searchParams.has('debugManifestsFile') || searchParams.get('loadSPFX') === 'true';

    if (hasDebugManifests) {
      return 'development';
    }

    // Check hostname and pathname for development indicators
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname.includes('localhost') ||
      pathname.includes('/_layouts/15/workbench.aspx')
    ) {
      return 'development';
    }

    // Default to production for hosted environments
    return 'production';
  } catch (error) {
    console.warn('Error detecting build mode:', error);
    return 'unknown';
  }
}

/**
 * Detects site environment based on URL patterns
 */
export function detectSiteEnvironment(
  webAbsoluteUrl: string,
  webServerRelativeUrl: string,
  patterns: EnvironmentConfig['patterns'] = DEFAULT_PATTERNS
): EnvironmentName {
  try {
    // Use server relative URL for pattern matching (more reliable)
    const path = webServerRelativeUrl || extractPathFromUrl(webAbsoluteUrl);
    const normalizedPath = path.toLowerCase().replace(/^\/+/, '');

    // Split path into segments for matching
    const segments = normalizedPath.split('/').filter(Boolean);
    const firstSegment = segments[0] || '';

    // Check dev patterns
    for (const pattern of patterns.dev) {
      if (
        firstSegment.startsWith(pattern.toLowerCase()) ||
        normalizedPath.includes(pattern.toLowerCase())
      ) {
        return 'dev';
      }
    }

    // Check UAT patterns
    for (const pattern of patterns.uat) {
      if (
        firstSegment.startsWith(pattern.toLowerCase()) ||
        normalizedPath.includes(pattern.toLowerCase())
      ) {
        return 'uat';
      }
    }

    // Default to production
    return 'prod';
  } catch (error) {
    console.warn('Error detecting site environment:', error);
    return 'prod';
  }
}

/**
 * Reads URL parameter overrides for development/debugging
 */
export function readUrlOverrides(): EnvironmentConfig['urlOverrides'] {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const overrides: EnvironmentConfig['urlOverrides'] = {};

    // Environment override
    const envParam = searchParams.get('spfx-env') || searchParams.get('env');
    if (envParam) {
      const env = envParam.toLowerCase();
      if (env === 'dev' || env === 'uat' || env === 'prod') {
        overrides.environment = env as EnvironmentName;
      }
    }

    // Log level override
    const logParam = searchParams.get('spfx-log') || searchParams.get('loglevel');
    if (logParam) {
      overrides.logLevel = parseLogLevel(logParam);
    }

    // Cache strategy override
    const cacheParam = searchParams.get('spfx-cache') || searchParams.get('cache');
    if (cacheParam) {
      const cache = cacheParam.toLowerCase();
      if (['none', 'short', 'long', 'pessimistic'].includes(cache)) {
        overrides.cacheStrategy = cache as CacheStrategy;
      }
    }

    // Debug mode override
    const debugParam = searchParams.get('spfx-debug') || searchParams.get('debug');
    if (debugParam !== null) {
      overrides.debug = debugParam !== '0' && debugParam !== 'false';
    }

    return Object.keys(overrides).length > 0 ? overrides : undefined;
  } catch (error) {
    console.warn('Error reading URL overrides:', error);
    return undefined;
  }
}

/**
 * Generates a correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `spfx-${timestamp}-${random}`;
}

/**
 * Creates environment badge information for UI display
 */
export function createEnvironmentBadge(
  environment: EnvironmentName,
  buildMode: BuildMode
): {
  text: string;
  color: string;
  tooltip: string;
  cssClass: string;
} {
  const isProdBuild = buildMode === 'production';

  switch (environment) {
    case 'dev':
      return {
        text: 'DEV',
        color: '#7C3AED', // Purple
        tooltip: `${isProdBuild ? 'Production' : 'Development'} build on DEV environment`,
        cssClass: 'spfx-env-dev',
      };

    case 'uat':
      return {
        text: 'UAT',
        color: '#F59E0B', // Amber
        tooltip: `${isProdBuild ? 'Production' : 'Development'} build on UAT environment`,
        cssClass: 'spfx-env-uat',
      };

    case 'prod':
    default:
      return {
        text: 'PROD',
        color: isProdBuild ? '#10B981' : '#6B7280', // Green for prod build, gray for dev build
        tooltip: `${isProdBuild ? 'Production' : 'Development'} build on PRODUCTION environment`,
        cssClass: isProdBuild ? 'spfx-env-prod' : 'spfx-env-prod-dev',
      };
  }
}

/**
 * Validates environment configuration
 */
export function validateEnvironmentConfig(config: Partial<EnvironmentConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.patterns) {
    const { dev, uat, prod } = config.patterns;

    if (!Array.isArray(dev)) {
      errors.push('Environment patterns.dev must be an array');
    }

    if (!Array.isArray(uat)) {
      errors.push('Environment patterns.uat must be an array');
    }

    if (!Array.isArray(prod)) {
      errors.push('Environment patterns.prod must be an array');
    }

    // Check for overlapping patterns
    if (Array.isArray(dev) && Array.isArray(uat)) {
      const overlap = dev.filter(pattern => uat.includes(pattern));
      if (overlap.length > 0) {
        warnings.push(`Overlapping patterns between dev and uat: ${overlap.join(', ')}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper functions

/**
 * Parses log level from string parameter
 */
function parseLogLevel(value: string): LogLevel | undefined {
  if (!value) return undefined;

  // Try numeric value first
  const numericLevel = Number(value);
  if (Number.isInteger(numericLevel) && numericLevel >= 0 && numericLevel <= 4) {
    return numericLevel as LogLevel;
  }

  // Try string values
  switch (value.toLowerCase()) {
    case 'verbose':
      return 0; // LogLevel.Verbose
    case 'info':
      return 1; // LogLevel.Info
    case 'warn':
    case 'warning':
      return 2; // LogLevel.Warning
    case 'error':
      return 3; // LogLevel.Error
    default:
      return undefined;
  }
}

/**
 * Extracts pathname from absolute URL
 */
function extractPathFromUrl(absoluteUrl: string): string {
  try {
    const url = new URL(absoluteUrl);
    return url.pathname;
  } catch {
    // Fallback: try to extract path manually
    const match = absoluteUrl.match(/https?:\/\/[^/]+(.*)$/);
    return match ? match[1] : '/';
  }
}

/**
 * Determines if current environment should use production-level logging
 */
export function shouldUseProductionLogging(
  environment: EnvironmentName,
  buildMode: BuildMode
): boolean {
  return environment === 'prod' || buildMode === 'production';
}

/**
 * Gets default log level based on environment and build mode
 */
export function getDefaultLogLevel(environment: EnvironmentName, buildMode: BuildMode): LogLevel {
  if (shouldUseProductionLogging(environment, buildMode)) {
    return 2; // LogLevel.Warning - only warnings and errors in production
  }

  return 1; // LogLevel.Info - info, warnings, and errors in development
}

/**
 * Gets default cache strategy based on environment
 */
export function getDefaultCacheStrategy(environment: EnvironmentName): CacheStrategy {
  switch (environment) {
    case 'dev':
      return 'none'; // No caching in development for fresh data
    case 'uat':
      return 'short'; // Short caching in UAT for testing
    case 'prod':
    default:
      return 'short'; // Short caching by default in production
  }
}
