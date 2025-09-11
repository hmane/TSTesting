/**
 * src/context/logging/performance.ts
 * Performance tracking and metrics collection for SPFx operations
 */

import type { PerformanceMetric, PerformanceTracker } from '../utils/types';

/**
 * Performance tracker implementation with automatic metrics collection
 */
export class SPFxPerformanceTracker implements PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics: number;
  private readonly enabledCategories: Set<string>;

  constructor(
    options: {
      maxMetrics?: number;
      enabledCategories?: string[];
    } = {}
  ) {
    this.maxMetrics = options.maxMetrics ?? 1000;
    this.enabledCategories = new Set(
      options.enabledCategories ?? ['sp-query', 'http-request', 'operation']
    );
  }

  /**
   * Starts a performance operation timer
   */
  startOperation(
    name: string,
    category: string = 'operation'
  ): (success?: boolean, details?: any) => PerformanceMetric {
    if (!this.enabledCategories.has(category)) {
      // Return no-op function if category is disabled
      return (success: boolean = true, details?: any): PerformanceMetric => ({
        name,
        duration: 0,
        success,
        timestamp: Date.now(),
        category: category as any,
        details,
      });
    }

    const startTime = performance.now();
    const startTimestamp = Date.now();

    return (success: boolean = true, details?: any): PerformanceMetric => {
      const duration = performance.now() - startTime;
      const metric: PerformanceMetric = {
        name,
        duration,
        success,
        timestamp: startTimestamp,
        category: category as any,
        details,
      };

      this.recordMetric(metric);
      return metric;
    };
  }

  /**
   * Records a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabledCategories.has(metric.category)) {
      return;
    }

    this.metrics.push(metric);

    // Keep only the most recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Gets metrics since a specific timestamp
   */
  getMetrics(since?: number): PerformanceMetric[] {
    if (since === undefined) {
      return [...this.metrics];
    }

    return this.metrics.filter(metric => metric.timestamp >= since);
  }

  /**
   * Clears all collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Tracks a SharePoint query operation
   */
  async trackSpQuery<T>(operation: () => Promise<T>, queryName?: string): Promise<T> {
    const name = queryName || 'SP Query';
    const endTimer = this.startOperation(name, 'sp-query');

    try {
      const result = await operation();
      endTimer(true, { type: 'success' });
      return result;
    } catch (error) {
      endTimer(false, {
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Tracks an HTTP request operation
   */
  async trackHttpRequest<T>(operation: () => Promise<T>, requestName?: string): Promise<T> {
    const name = requestName || 'HTTP Request';
    const endTimer = this.startOperation(name, 'http-request');

    try {
      const result = await operation();
      endTimer(true, { type: 'success' });
      return result;
    } catch (error) {
      endTimer(false, {
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Gets performance statistics for analysis
   */
  getStatistics(
    category?: string,
    since?: number
  ): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    successRate: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
  } {
    let metrics = this.getMetrics(since);

    if (category) {
      metrics = metrics.filter(m => m.category === category);
    }

    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        successRate: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
      };
    }

    const successful = metrics.filter(m => m.success);
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      totalOperations: metrics.length,
      successfulOperations: successful.length,
      failedOperations: metrics.length - successful.length,
      successRate: successful.length / metrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[p95Index] || 0,
    };
  }

  /**
   * Gets slow operations (above threshold)
   */
  getSlowOperations(thresholdMs: number = 1000, since?: number): PerformanceMetric[] {
    return this.getMetrics(since).filter(metric => metric.duration > thresholdMs);
  }

  /**
   * Gets failed operations
   */
  getFailedOperations(since?: number): PerformanceMetric[] {
    return this.getMetrics(since).filter(metric => !metric.success);
  }

  /**
   * Enables or disables tracking for specific categories
   */
  setCategoryEnabled(category: string, enabled: boolean): void {
    if (enabled) {
      this.enabledCategories.add(category);
    } else {
      this.enabledCategories.delete(category);
    }
  }

  /**
   * Gets current configuration
   */
  getConfig(): {
    maxMetrics: number;
    enabledCategories: string[];
    currentMetricsCount: number;
  } {
    return {
      maxMetrics: this.maxMetrics,
      enabledCategories: Array.from(this.enabledCategories),
      currentMetricsCount: this.metrics.length,
    };
  }
}

/**
 * Utility functions for performance analysis
 */
export class PerformanceAnalyzer {
  /**
   * Analyzes performance trends over time
   */
  static analyzeTrends(
    metrics: PerformanceMetric[],
    windowMs: number = 60000
  ): {
    timeWindow: string;
    averageDuration: number;
    requestCount: number;
    errorRate: number;
  }[] {
    if (metrics.length === 0) return [];

    const sortedMetrics = metrics.sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sortedMetrics[0].timestamp;
    const endTime = sortedMetrics[sortedMetrics.length - 1].timestamp;

    const windows: Array<{
      timeWindow: string;
      averageDuration: number;
      requestCount: number;
      errorRate: number;
    }> = [];

    for (let windowStart = startTime; windowStart < endTime; windowStart += windowMs) {
      const windowEnd = windowStart + windowMs;
      const windowMetrics = sortedMetrics.filter(
        m => m.timestamp >= windowStart && m.timestamp < windowEnd
      );

      if (windowMetrics.length > 0) {
        const errors = windowMetrics.filter(m => !m.success).length;
        windows.push({
          timeWindow: new Date(windowStart).toISOString(),
          averageDuration:
            windowMetrics.reduce((sum, m) => sum + m.duration, 0) / windowMetrics.length,
          requestCount: windowMetrics.length,
          errorRate: errors / windowMetrics.length,
        });
      }
    }

    return windows;
  }

  /**
   * Identifies performance bottlenecks
   */
  static identifyBottlenecks(metrics: PerformanceMetric[]): {
    operation: string;
    category: string;
    averageDuration: number;
    callCount: number;
    errorRate: number;
  }[] {
    const operationGroups = new Map<string, PerformanceMetric[]>();

    metrics.forEach(metric => {
      const key = `${metric.category}:${metric.name}`;
      if (!operationGroups.has(key)) {
        operationGroups.set(key, []);
      }
      operationGroups.get(key)!.push(metric);
    });

    const bottlenecks = Array.from(operationGroups.entries()).map(([key, groupMetrics]) => {
      const [category, operation] = key.split(':');
      const errors = groupMetrics.filter(m => !m.success).length;

      return {
        operation,
        category,
        averageDuration: groupMetrics.reduce((sum, m) => sum + m.duration, 0) / groupMetrics.length,
        callCount: groupMetrics.length,
        errorRate: errors / groupMetrics.length,
      };
    });

    // Sort by average duration (slowest first)
    return bottlenecks.sort((a, b) => b.averageDuration - a.averageDuration);
  }

  /**
   * Generates a performance summary report
   */
  static generateSummary(metrics: PerformanceMetric[]): {
    totalOperations: number;
    timespan: { start: string; end: string };
    categories: { [category: string]: { count: number; avgDuration: number; errorRate: number } };
    topSlowOperations: { name: string; category: string; duration: number }[];
    recommendations: string[];
  } {
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        timespan: { start: '', end: '' },
        categories: {},
        topSlowOperations: [],
        recommendations: ['No performance data available'],
      };
    }

    const sortedByTime = metrics.sort((a, b) => a.timestamp - b.timestamp);
    const sortedByDuration = metrics.sort((a, b) => b.duration - a.duration);

    const categories: {
      [category: string]: { count: number; avgDuration: number; errorRate: number };
    } = {};

    metrics.forEach(metric => {
      if (!categories[metric.category]) {
        categories[metric.category] = { count: 0, avgDuration: 0, errorRate: 0 };
      }
      categories[metric.category].count++;
    });

    Object.keys(categories).forEach(category => {
      const categoryMetrics = metrics.filter(m => m.category === category);
      const errors = categoryMetrics.filter(m => !m.success).length;

      categories[category].avgDuration =
        categoryMetrics.reduce((sum, m) => sum + m.duration, 0) / categoryMetrics.length;
      categories[category].errorRate = errors / categoryMetrics.length;
    });

    const recommendations: string[] = [];
    const slowOps = sortedByDuration.slice(0, 5);

    if (slowOps.some(op => op.duration > 5000)) {
      recommendations.push('Consider optimizing queries over 5 seconds');
    }

    if (categories['sp-query']?.errorRate > 0.05) {
      recommendations.push('High SharePoint query error rate detected');
    }

    if (categories['http-request']?.errorRate > 0.1) {
      recommendations.push('High HTTP request error rate detected');
    }

    return {
      totalOperations: metrics.length,
      timespan: {
        start: new Date(sortedByTime[0].timestamp).toISOString(),
        end: new Date(sortedByTime[sortedByTime.length - 1].timestamp).toISOString(),
      },
      categories,
      topSlowOperations: slowOps.map(op => ({
        name: op.name,
        category: op.category,
        duration: op.duration,
      })),
      recommendations,
    };
  }
}
