import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Interfaces
export interface IListItemFormUpdateValue {
  FieldName: string;
  FieldValue: string;
}

export interface IBatchOperation {
  listName: string;
  operationType: 'add' | 'update' | 'delete' | 'addValidateUpdateItemUsingPath' | 'validateUpdateListItem';
  itemId?: number;
  data?: any;
  formValues?: IListItemFormUpdateValue[];
  path?: string;
  eTag?: string;
}

export interface IOperationResult {
  operationType: string;
  listName: string;
  success: boolean;
  data?: any;
  error?: string;
  retryAttempts?: number;
  itemId?: number;
}

export interface IBatchError {
  listName: string;
  operationType: string;
  error: string;
  itemId?: number;
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
}

// List Operation Builder for Fluent API
class ListOperationBuilder {
  private listName: string;
  private operations: IBatchOperation[] = [];

  constructor(listName: string) {
    this.listName = listName;
  }

  /**
   * Add new item to list
   * @param data Key-value pairs for the new item
   */
  add(data: { [key: string]: any }): this {
    this.operations.push({
      listName: this.listName,
      operationType: 'add',
      data
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
      eTag
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
      eTag
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
      path
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
      formValues
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
      batchSize: 1000, // SharePoint default limit
      retryConfig: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        retryableErrors: ['timeout', 'network', '503', '502', '429']
      },
      ...config
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
        errors: []
      };
    }

    const result: IBatchResult = {
      success: true,
      totalOperations: this.operations.length,
      successfulOperations: 0,
      failedOperations: 0,
      results: [],
      errors: []
    };

    // Split operations into batches respecting SharePoint limits
    const batches = this.splitIntoBatches(this.operations);

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
            itemId: op.itemId
          });
        });
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
    const batchSize = this.config.batchSize || 1000;

    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }

    return batches;
  }

  private async executeBatch(operations: IBatchOperation[]): Promise<{ results: IOperationResult[], errors: IBatchError[] }> {
    const results: IOperationResult[] = [];
    const errors: IBatchError[] = [];

    const batch = this.sp.web.createBatch();

    const promises = operations.map(async (operation) => {
      return this.executeOperation(operation, batch);
    });

    try {
      await batch.execute();
      const operationResults = await Promise.allSettled(promises);
      
      operationResults.forEach((promiseResult, index) => {
        const operation = operations[index];
        
        if (promiseResult.status === 'fulfilled') {
          results.push({
            operationType: operation.operationType,
            listName: operation.listName,
            success: true,
            data: promiseResult.value,
            itemId: operation.itemId
          });
        } else {
          const errorMessage = promiseResult.reason instanceof Error 
            ? promiseResult.reason.message 
            : 'Unknown error';
          
          results.push({
            operationType: operation.operationType,
            listName: operation.listName,
            success: false,
            error: errorMessage,
            itemId: operation.itemId
          });

          errors.push({
            listName: operation.listName,
            operationType: operation.operationType,
            error: errorMessage,
            itemId: operation.itemId
          });
        }
      });
    } catch (batchError) {
      // Handle batch execution errors
      operations.forEach(operation => {
        const errorMessage = batchError instanceof Error 
          ? batchError.message 
          : 'Batch execution failed';
        
        results.push({
          operationType: operation.operationType,
          listName: operation.listName,
          success: false,
          error: errorMessage,
          itemId: operation.itemId
        });

        errors.push({
          listName: operation.listName,
          operationType: operation.operationType,
          error: errorMessage,
          itemId: operation.itemId
        });
      });
    }

    return { results, errors };
  }

  private async executeOperation(operation: IBatchOperation, batch: any): Promise<any> {
    const list = this.sp.web.lists.getByTitle(operation.listName);

    try {
      switch (operation.operationType) {
        case 'add':
          return await list.items.inBatch(batch).add(operation.data);

        case 'update':
          if (!operation.itemId) {
            throw new Error('Item ID required for update operation');
          }
          const updateArgs: any[] = [operation.data];
          if (operation.eTag) {
            updateArgs.push(operation.eTag);
          }
          return await list.items.getById(operation.itemId).inBatch(batch).update(...updateArgs);

        case 'delete':
          if (!operation.itemId) {
            throw new Error('Item ID required for delete operation');
          }
          const deleteArgs: any[] = [];
          if (operation.eTag) {
            deleteArgs.push(operation.eTag);
          }
          return await list.items.getById(operation.itemId).inBatch(batch).delete(...deleteArgs);

        case 'addValidateUpdateItemUsingPath':
          if (!operation.formValues || !operation.path) {
            throw new Error('Form values and path required for addValidateUpdateItemUsingPath');
          }
          return await list.inBatch(batch).addValidateUpdateItemUsingPath(operation.formValues, operation.path);

        case 'validateUpdateListItem':
          if (!operation.itemId || !operation.formValues) {
            throw new Error('Item ID and form values required for validateUpdateListItem');
          }
          return await list.items.getById(operation.itemId).inBatch(batch).validateUpdateListItem(operation.formValues);

        default:
          throw new Error(`Unsupported operation type: ${operation.operationType}`);
      }
    } catch (error) {
      if (this.config.retryConfig?.enabled && this.shouldRetry(error)) {
        return this.retryOperation(operation, batch);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (!this.config.retryConfig?.enabled) return false;
    
    const errorString = error?.message?.toLowerCase() || '';
    const retryableErrors = this.config.retryConfig.retryableErrors || [];
    
    return retryableErrors.some(retryableError => errorString.includes(retryableError.toLowerCase()));
  }

  private async retryOperation(operation: IBatchOperation, batch: any, attempt: number = 1): Promise<any> {
    const maxRetries = this.config.retryConfig?.maxRetries || 3;
    const retryDelay = this.config.retryConfig?.retryDelay || 1000;

    if (attempt > maxRetries) {
      throw new Error(`Operation failed after ${maxRetries} retry attempts`);
    }

    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));

    try {
      return await this.executeOperation(operation, batch);
    } catch (error) {
      if (this.shouldRetry(error)) {
        return this.retryOperation(operation, batch, attempt + 1);
      }
      throw error;
    }
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
