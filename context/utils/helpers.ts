/**
 * src/context/utils/helpers.ts
 * Helper utilities for context initialization and validation (No Application Insights)
 */

import { LogLevel } from '@pnp/logging';
import { Context } from '../context-manager';
import type { ContextInitOptions } from './types';

/**
 * Quick start helper for common scenarios
 */
export class QuickStart {
  /**
   * Minimal setup for simple SPFx components
   */
  static async simple(context: any, componentName: string) {
    return Context.initialize(context, {
      componentName,
      logging: {
        level: LogLevel.Info,
        enablePerformanceMetrics: false,
      },
      features: {
        enableDevTools: true,
        enableUrlOverrides: true,
      },
    });
  }

  /**
   * Production-ready setup
   */
  static async production(context: any, componentName: string) {
    return Context.initialize(context, {
      componentName,
      logging: {
        level: LogLevel.Warning, // Minimal logging in production
        enablePerformanceMetrics: true,
        productionSampling: 0.1, // 10% sampling
      },
      caching: {
        defaultStrategy: 'short',
      },
      http: {
        timeoutMs: 30000,
        retries: 3,
        maxConcurrent: 6,
      },
      features: {
        enableDevTools: false,
        enableUrlOverrides: false,
        enableRequestDeduplication: true,
      },
    });
  }

  /**
   * Development setup with verbose logging
   */
  static async development(context: any, componentName: string) {
    return Context.initialize(context, {
      componentName,
      logging: {
        level: LogLevel.Verbose,
        enablePerformanceMetrics: true,
        enableDiagnostics: true,
        productionSampling: 1.0, // No sampling in dev
      },
      caching: {
        defaultStrategy: 'none', // No caching in development
      },
      http: {
        timeoutMs: 60000, // Longer timeout for debugging
        retries: 1, // Fewer retries for faster feedback
      },
      features: {
        enableDevTools: true,
        enableUrlOverrides: true,
      },
    });
  }

  /**
   * Teams app optimized setup
   */
  static async teams(context: any, componentName: string) {
    return Context.initialize(context, {
      componentName,
      logging: {
        level: LogLevel.Info,
        enablePerformanceMetrics: true,
      },
      caching: {
        defaultStrategy: 'short',
        shortTtlMs: 2 * 60 * 1000, // 2 minutes for Teams
      },
      http: {
        timeoutMs: 20000, // Shorter timeout for Teams
        maxConcurrent: 4, // Lower concurrency for Teams
      },
    });
  }
}

/**
 * Validation helpers
 */
export class ContextValidation {
  /**
   * Validates context initialization options
   */
  static validateOptions(options: ContextInitOptions): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate component name
    if (options.componentName && typeof options.componentName !== 'string') {
      errors.push('componentName must be a string');
    }

    // Validate logging options
    if (options.logging) {
      if (
        options.logging.level !== undefined &&
        (options.logging.level < 0 || options.logging.level > 4)
      ) {
        errors.push('logging.level must be between 0-4');
      }

      if (
        options.logging.productionSampling !== undefined &&
        (options.logging.productionSampling < 0 || options.logging.productionSampling > 1)
      ) {
        errors.push('logging.productionSampling must be between 0-1');
      }
    }

    // Validate HTTP options
    if (options.http) {
      if (options.http.timeoutMs !== undefined && options.http.timeoutMs < 1000) {
        warnings.push('http.timeoutMs less than 1 second may cause issues');
      }

      if (options.http.maxConcurrent !== undefined && options.http.maxConcurrent > 20) {
        warnings.push('http.maxConcurrent above 20 may overwhelm SharePoint');
      }
    }

    // Validate telemetry - Reserved for future use
    if (options.telemetry && Object.keys(options.telemetry).length > 0) {
      warnings.push('Telemetry configuration provided but not currently supported');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Checks if the current environment is suitable for the utility
   */
  static checkEnvironment(): {
    isSupported: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for SPFx environment
    if (typeof window === 'undefined') {
      issues.push('Browser environment required');
    }

    // Check for required APIs
    if (typeof fetch === 'undefined') {
      issues.push('Fetch API not supported');
    }

    if (typeof Promise === 'undefined') {
      issues.push('Promise not supported');
    }

    if (typeof URLSearchParams === 'undefined') {
      issues.push('URLSearchParams not supported');
    }

    // Check localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch {
      recommendations.push('localStorage not available - caching will be limited');
    }

    // Check console availability
    if (typeof console === 'undefined') {
      recommendations.push('Console not available - logging will be limited');
    }

    return {
      isSupported: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
