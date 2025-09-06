import { SPFI } from '@pnp/sp';
import '@pnp/sp/batching';
import '@pnp/sp/items';
import '@pnp/sp/lists';
import '@pnp/sp/webs';

// Interfaces (keeping your existing ones with minor additions)
export interface IListItemFormUpdateValue {
  FieldName: string;
  FieldValue: string;
}

export interface IBatchOperation {
  listName: string;
  operationType:
    | 'add'
    | 'update'
    | 'delete'
    | 'addValidateUpdateItemUsingPath'
    | 'validateUpdateListItem';
  itemId?: number;
  data?: any;
  formValues?: IListItemFormUpdateValue[];
  path?: string;
  eTag?: string;
  operationId?: string;
}

export interface IOperationResult {
  operationType: string;
  listName: string;
  success: boolean;
  data?: any;
  error?: string;
  retryAttempts?: number;
  itemId?: number;
  operationId?: string;
}

export interface IBatchError {
  listName: string;
  operationType: string;
  error: string;
  itemId?: number;
  operationId?: string;
}

export interface IBatchResult {
  success: boolean;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  results: IOperationResult[];
  errors: IBatchError[];
}

export interface IRetryConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  retryableErrors: string[];
}

export interface IBatchBuilderConfig {
  retryConfig?: IRetryConfig;
  batchSize?: number;
  enableConcurrency?: boolean;
}

// Internal interface for tracking batch operations
interface IBatchedOperationTracker {
  operation: IBatchOperation;
  resultContainer: { result?: any; error?: any };
}

// List Operation Builder
class ListOperationBuilder {
  private listName: string;
  private operations: IBatchOperation[] = [];
  private operationCounter = 0;

  constructor(listName: string) {
    this.listName = listName;
  }

  private generateOperationId(): string {
    return `${this.listName}_${this.operationCounter++}_${Date.now()}`;
  }

  /**
   * Add new item to list
   * @param data Key-value pairs for the new item
   */
  add(data: { [key: string]: any }): this {
    this.operations.push({
      listName: this.listName,
      operationType: 'add',
      data,
      operationId: this.generateOperationId(),
    });
    return this;
  }

  /**
   * Update existing item
   * @param itemId ID of item to update
   * @param data Key-value pairs to update
   * @param eTag Optional eTag for concurrency control
   */
  update(itemId: number, data: { [key: string]: any }, eTag?: string): this {
    this.operations.push({
      listName: this.listName,
      operationType: 'update',
      itemId,
      data,
      eTag,
      operationId: this.generateOperationId(),
    });
    return this;
  }

  /**
   * Delete item
   * @param itemId ID of item to delete
   * @param eTag Optional eTag for concurrency control
   */
  delete(itemId: number, eTag?: string): this {
    this.operations.push({
      listName: this.listName,
      operationType: 'delete',
      itemId,
      eTag,
      operationId: this.generateOperationId(),
    });
    return this;
  }

  /**
   * Add item with validation using path
   * @param formValues Array of field name/value pairs for validation
   * @param path Path for the item creation
   */
  addValidateUpdateItemUsingPath(formValues: IListItemFormUpdateValue[], path: string): this {
    this.operations.push({
      listName: this.listName,
      operationType: 'addValidateUpdateItemUsingPath',
      formValues,
      path,
      operationId: this.generateOperationId(),
    });
    return this;
  }

  /**
   * Update item with validation
   * @param itemId ID of item to update
   * @param formValues Array of field name/value pairs for validation
   */
  validateUpdateListItem(itemId: number, formValues: IListItemFormUpdateValue[]): this {
    this.operations.push({
      listName: this.listName,
      operationType: 'validateUpdateListItem',
      itemId,
      formValues,
      operationId: this.generateOperationId(),
    });
    return this;
  }

  getOperations(): IBatchOperation[] {
    return this.operations;
  }
}

// Main Batch Builder
export class BatchBuilder {
  private sp: SPFI;
  private operations: IBatchOperation[] = [];
  private config: IBatchBuilderConfig;
  private currentListBuilder?: ListOperationBuilder;

  constructor(sp: SPFI, config: IBatchBuilderConfig = {}) {
    this.sp = sp;
    this.config = {
      batchSize: 100,
      enableConcurrency: false,
      retryConfig: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        retryableErrors: ['timeout', 'network', '503', '502', '429', 'throttled'],
      },
      ...config,
    };
  }

  /**
   * Start operations on a specific list
   * @param listName Title of the SharePoint list
   */
  list(listName: string): ListOperationBuilder {
    // Add previous list operations if any
    if (this.currentListBuilder) {
      this.operations.push(...this.currentListBuilder.getOperations());
    }

    // Create new list builder
    this.currentListBuilder = new ListOperationBuilder(listName);
    return this.currentListBuilder;
  }

  /**
   * Execute all batched operations
   */
  async execute(): Promise<IBatchResult> {
    // Add current list operations
    if (this.currentListBuilder) {
      this.operations.push(...this.currentListBuilder.getOperations());
    }

    if (this.operations.length === 0) {
      return {
        success: true,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        results: [],
        errors: [],
      };
    }

    const result: IBatchResult = {
      success: true,
      totalOperations: this.operations.length,
      successfulOperations: 0,
      failedOperations: 0,
      results: [],
      errors: [],
    };

    // Split operations into batches respecting SharePoint limits
    const batches = this.splitIntoBatches(this.operations);

    // Execute batches sequentially or with limited concurrency
    if (this.config.enableConcurrency) {
      const batchPromises = batches.map(batch => this.executeBatch(batch));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((batchResult, index) => {
        if (batchResult.status === 'fulfilled') {
          result.results.push(...batchResult.value.results);
          result.errors.push(...batchResult.value.errors);
        } else {
          // Handle batch-level failures
          const batch = batches[index];
          batch.forEach(op => {
            result.errors.push({
              listName: op.listName,
              operationType: op.operationType,
              error: batchResult.reason?.message || 'Batch execution failed',
              itemId: op.itemId,
              operationId: op.operationId,
            });
          });
        }
      });
    } else {
      // Sequential execution for better reliability
      for (const batch of batches) {
        try {
          const batchResult = await this.executeBatch(batch);
          result.results.push(...batchResult.results);
          result.errors.push(...batchResult.errors);
        } catch (error) {
          // Handle batch-level errors
          batch.forEach(op => {
            result.errors.push({
              listName: op.listName,
              operationType: op.operationType,
              error: error instanceof Error ? error.message : 'Unknown batch error',
              itemId: op.itemId,
              operationId: op.operationId,
            });
          });
        }
      }
    }

    // Calculate final statistics
    result.successfulOperations = result.results.filter(r => r.success).length;
    result.failedOperations = result.results.filter(r => !r.success).length;
    result.success = result.failedOperations === 0;

    // Clear operations for reuse
    this.operations = [];
    this.currentListBuilder = undefined;

    return result;
  }

  private splitIntoBatches(operations: IBatchOperation[]): IBatchOperation[][] {
    const batches: IBatchOperation[][] = [];
    const batchSize = this.config.batchSize || 100;

    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }

    return batches;
  }

  private async executeBatch(
    operations: IBatchOperation[]
  ): Promise<{ results: IOperationResult[]; errors: IBatchError[] }> {
    const results: IOperationResult[] = [];
    const errors: IBatchError[] = [];

    try {
      // Create batched SP instance using the correct PnP.js v3+ pattern
      const [batchedSP, execute] = this.sp.batched();
      const operationTrackers: IBatchedOperationTracker[] = [];

      // Add all operations to batch using .then() syntax
      for (const operation of operations) {
        try {
          const tracker: IBatchedOperationTracker = {
            operation,
            resultContainer: {},
          };

          this.addOperationToBatch(operation, batchedSP, tracker.resultContainer);
          operationTrackers.push(tracker);
        } catch (error) {
          // Handle immediate errors (like validation failures)
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to add operation to batch';
          results.push({
            operationType: operation.operationType,
            listName: operation.listName,
            success: false,
            error: errorMessage,
            itemId: operation.itemId,
            operationId: operation.operationId,
          });
          errors.push({
            listName: operation.listName,
            operationType: operation.operationType,
            error: errorMessage,
            itemId: operation.itemId,
            operationId: operation.operationId,
          });
        }
      }

      // Execute the entire batch
      await execute();

      // Process results after batch execution
      for (const tracker of operationTrackers) {
        const { operation, resultContainer } = tracker;

        if (resultContainer.error) {
          const errorMessage =
            resultContainer.error instanceof Error
              ? resultContainer.error.message
              : 'Operation failed';

          results.push({
            operationType: operation.operationType,
            listName: operation.listName,
            success: false,
            error: errorMessage,
            itemId: operation.itemId,
            operationId: operation.operationId,
          });

          errors.push({
            listName: operation.listName,
            operationType: operation.operationType,
            error: errorMessage,
            itemId: operation.itemId,
            operationId: operation.operationId,
          });
        } else {
          results.push({
            operationType: operation.operationType,
            listName: operation.listName,
            success: true,
            data: resultContainer.result,
            itemId: operation.itemId,
            operationId: operation.operationId,
          });
        }
      }
    } catch (batchError) {
      // Handle batch execution errors
      const batchErrorMessage =
        batchError instanceof Error ? batchError.message : 'Batch execution failed';

      for (const operation of operations) {
        results.push({
          operationType: operation.operationType,
          listName: operation.listName,
          success: false,
          error: batchErrorMessage,
          itemId: operation.itemId,
          operationId: operation.operationId,
        });

        errors.push({
          listName: operation.listName,
          operationType: operation.operationType,
          error: batchErrorMessage,
          itemId: operation.itemId,
          operationId: operation.operationId,
        });
      }
    }

    return { results, errors };
  }

  private addOperationToBatch(
    operation: IBatchOperation,
    batchedSP: SPFI,
    resultContainer: { result?: any; error?: any }
  ): void {
    const list = batchedSP.web.lists.getByTitle(operation.listName);

    switch (operation.operationType) {
      case 'add': {
        if (!operation.data) {
          throw new Error('Data required for add operation');
        }
        list.items.add(operation.data).then(
          result => {
            resultContainer.result = result;
          },
          error => {
            resultContainer.error = error;
          }
        );
        break;
      }

      case 'update': {
        if (!operation.itemId || !operation.data) {
          throw new Error('Item ID and data required for update operation');
        }
        const updatePromise = operation.eTag
          ? list.items.getById(operation.itemId).update(operation.data, operation.eTag)
          : list.items.getById(operation.itemId).update(operation.data);

        updatePromise.then(
          result => {
            resultContainer.result = result;
          },
          error => {
            resultContainer.error = error;
          }
        );
        break;
      }

      case 'delete': {
        if (!operation.itemId) {
          throw new Error('Item ID required for delete operation');
        }
        const deletePromise = operation.eTag
          ? list.items.getById(operation.itemId).delete(operation.eTag)
          : list.items.getById(operation.itemId).delete();

        deletePromise.then(
          result => {
            resultContainer.result = result;
          },
          error => {
            resultContainer.error = error;
          }
        );
        break;
      }

      case 'addValidateUpdateItemUsingPath': {
        if (!operation.formValues || !operation.path) {
          throw new Error('Form values and path required for addValidateUpdateItemUsingPath');
        }
        list.addValidateUpdateItemUsingPath(operation.formValues, operation.path).then(
          result => {
            resultContainer.result = result;
          },
          error => {
            resultContainer.error = error;
          }
        );
        break;
      }

      case 'validateUpdateListItem': {
        if (!operation.itemId || !operation.formValues) {
          throw new Error('Item ID and form values required for validateUpdateListItem');
        }
        list.items
          .getById(operation.itemId)
          .validateUpdateListItem(operation.formValues)
          .then(
            result => {
              resultContainer.result = result;
            },
            error => {
              resultContainer.error = error;
            }
          );
        break;
      }

      default:
        throw new Error(`Unsupported operation type: ${operation.operationType}`);
    }
  }

  private shouldRetry(error: any): boolean {
    if (!this.config.retryConfig?.enabled) return false;

    const errorString = error?.message?.toLowerCase() || '';
    const retryableErrors = this.config.retryConfig.retryableErrors || [];

    return retryableErrors.some(retryableError =>
      errorString.includes(retryableError.toLowerCase())
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): IBatchBuilderConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<IBatchBuilderConfig>): this {
    this.config = { ...this.config, ...config };
    return this;
  }
}

/**
 * Factory function to create a new batch builder
 * @param sp PnP.js SP instance
 * @param config Optional configuration
 */
export function createBatchBuilder(sp: SPFI, config?: IBatchBuilderConfig): BatchBuilder {
  return new BatchBuilder(sp, config);
}
