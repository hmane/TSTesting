# Zustand Store Architecture for SPFx v1.21.1

A comprehensive state management solution using Zustand for SharePoint Framework (SPFx) applications with TypeScript support.

## 📁 Project Structure

```
src/
├── components/
│   ├── AppInitializer.tsx           # Top-level app initializer
│   ├── RequestForm.tsx              # Main form component
│   └── shared/
├── stores/
│   ├── configStore.ts               # Configuration store (read-only)
│   ├── fieldChoicesStore.ts         # Field choices store (read-only)
│   └── requestFormStore.ts          # Request form store (CRUD)
├── hooks/
│   ├── useConfig.ts                 # Configuration custom hook
│   ├── useFieldChoices.ts           # Field choices custom hook
│   ├── useRequestForm.ts            # Request form custom hook
│   ├── useFormValidation.ts         # Form validation hook
│   ├── useFormActions.ts            # Form actions hook
│   └── index.ts                     # Export all hooks
├── models/
│   ├── Config.ts                    # Configuration types
│   ├── Request.ts                   # Request types
│   └── FieldChoices.ts              # Field choices types
└── services/
    └── sharePointService.ts         # PnP SP service layer
```

## 🚀 Installation

```bash
npm install zustand
```

## 📋 Types/Models

### models/Config.ts
```typescript
export interface Config {
  id: number;
  key: string;
  value: string;
}
```

### models/Request.ts
```typescript
export interface Request {
  Id: number;
  Title: string;
  Description?: string;
  Status: string;
  Priority: string;
  RequestType: string;
  RequestedBy: string;
  RequestedDate: Date;
  DueDate?: Date;
  Created: Date;
  Modified: Date;
  Author: any;
  Editor: any;
}

export interface NewRequest {
  Title: string;
  Description?: string;
  Status: string;
  Priority: string;
  RequestType: string;
  RequestedBy: string;
  RequestedDate: Date;
  DueDate?: Date;
}

export enum RequestStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  InProgress = 'In Progress',
  OnHold = 'On Hold',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export enum FormMode {
  New = 'New',
  Edit = 'Edit',
  View = 'View'
}
```

### models/FieldChoices.ts
```typescript
export interface FieldChoices {
  [fieldName: string]: string[];
}
```

## 🏪 Stores

### 1. Configuration Store (configStore.ts)
**Purpose:** Load and manage application configuration from SharePoint list

```typescript
// stores/configStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Config } from '../models/Config';

interface ConfigState {
  // State
  configs: Config[];
  configMap: Map<string, string>;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastLoadTime: number | null;
  
  // Actions
  loadConfigs: () => Promise<void>;
  reloadConfigs: () => Promise<void>;
  getConfigValue: (key: string) => string | undefined;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  configs: [],
  configMap: new Map<string, string>(),
  isLoading: false,
  isInitialized: false,
  error: null,
  lastLoadTime: null,
};

export const useConfigStore = create<ConfigState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadConfigs: async () => {
        const { isLoading } = get();
        if (isLoading) return;

        try {
          set({ isLoading: true, error: null });

          // TODO: Replace with your PnP SP logic
          // const items = await sp.web.lists.getByTitle("Configuration")
          //   .items.select("Id", "Key", "Value").get();
          // const configs = items.map(item => ({ id: item.Id, key: item.Key, value: item.Value }));

          const configs: Config[] = []; // Replace with actual fetch
          const configMap = new Map<string, string>();
          configs.forEach(config => configMap.set(config.key, config.value));

          set({
            configs,
            configMap,
            isLoading: false,
            isInitialized: true,
            lastLoadTime: Date.now()
          });
        } catch (error) {
          console.error('Failed to load configurations:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load configurations',
            isInitialized: false
          });
        }
      },

      reloadConfigs: async () => {
        set({ isInitialized: false });
        return get().loadConfigs();
      },

      getConfigValue: (key: string) => {
        const { configMap, isInitialized } = get();
        if (!isInitialized) {
          console.warn(`Attempting to get config '${key}' before store is initialized`);
          return undefined;
        }
        const value = configMap.get(key);
        if (value === undefined) {
          console.warn(`Configuration key '${key}' not found`);
        }
        return value;
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({ ...initialState, configMap: new Map<string, string>() });
      }
    }),
    { name: 'config-store' }
  )
);
```

### 2. Field Choices Store (fieldChoicesStore.ts)
**Purpose:** Load and manage dropdown/choice field options from SharePoint fields

```typescript
// stores/fieldChoicesStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FieldChoices } from '../models/FieldChoices';

interface FieldChoicesState {
  // State
  fieldChoices: FieldChoices;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastLoadTime: number | null;
  loadingFields: Set<string>;
  
  // Actions
  loadAllFieldChoices: () => Promise<void>;
  loadFieldChoices: (fieldName: string) => Promise<void>;
  getFieldChoices: (fieldName: string) => string[];
  hasFieldChoices: (fieldName: string) => boolean;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  fieldChoices: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  lastLoadTime: null,
  loadingFields: new Set<string>(),
};

export const useFieldChoicesStore = create<FieldChoicesState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadAllFieldChoices: async () => {
        const { isLoading } = get();
        if (isLoading) return;

        try {
          set({ isLoading: true, error: null });

          // TODO: Replace with your PnP SP logic
          // const list = sp.web.lists.getByTitle("Request");
          // const fields = await list.fields
          //   .filter("TypeAsString eq 'Choice' or TypeAsString eq 'MultiChoice'")
          //   .select("InternalName", "Choices").get();
          // const fieldChoices: FieldChoices = {};
          // fields.forEach(field => {
          //   fieldChoices[field.InternalName] = field.Choices || [];
          // });

          const fieldChoices: FieldChoices = {}; // Replace with actual fetch

          set({
            fieldChoices,
            isLoading: false,
            isInitialized: true,
            lastLoadTime: Date.now()
          });
        } catch (error) {
          console.error('Failed to load field choices:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load field choices',
            isInitialized: false
          });
        }
      },

      loadFieldChoices: async (fieldName: string) => {
        const { loadingFields, fieldChoices } = get();
        if (loadingFields.has(fieldName) || fieldChoices[fieldName]) return;

        try {
          set(state => ({
            loadingFields: new Set([...state.loadingFields, fieldName])
          }));

          // TODO: Replace with your PnP SP logic
          // const field = await sp.web.lists.getByTitle("Request")
          //   .fields.getByInternalNameOrTitle(fieldName)
          //   .select("Choices").get();
          // const choices = field.Choices || [];

          const choices: string[] = []; // Replace with actual fetch

          set(state => ({
            fieldChoices: { ...state.fieldChoices, [fieldName]: choices },
            loadingFields: new Set([...state.loadingFields].filter(f => f !== fieldName))
          }));
        } catch (error) {
          console.error(`Failed to load choices for field ${fieldName}:`, error);
          set(state => ({
            loadingFields: new Set([...state.loadingFields].filter(f => f !== fieldName)),
            error: error instanceof Error ? error.message : `Failed to load choices for ${fieldName}`
          }));
        }
      },

      getFieldChoices: (fieldName: string) => {
        const { fieldChoices, isInitialized } = get();
        if (!isInitialized) {
          console.warn(`Attempting to get field choices for '${fieldName}' before store is initialized`);
          return [];
        }
        const choices = fieldChoices[fieldName];
        if (!choices) {
          console.warn(`Field choices for '${fieldName}' not found. Available fields: ${Object.keys(fieldChoices).join(', ')}`);
          return [];
        }
        return choices;
      },

      hasFieldChoices: (fieldName: string) => {
        const { fieldChoices } = get();
        return fieldChoices[fieldName] !== undefined;
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({ ...initialState, loadingFields: new Set<string>() });
      }
    }),
    { name: 'field-choices-store' }
  )
);
```

### 3. Request Form Store (requestFormStore.ts)
**Purpose:** Manage request form data, validation, and CRUD operations

```typescript
// stores/requestFormStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Request, NewRequest, RequestStatus, FormMode } from '../models/Request';

interface RequestFormState {
  // State
  currentRequest: Request | NewRequest | null;
  originalRequest: Request | NewRequest | null;
  formMode: FormMode;
  itemId: number | undefined;
  isLoading: boolean;
  isInitialized: boolean;
  isSaving: boolean;
  error: string | null;
  saveError: string | null;
  isDirty: boolean;
  lastSaveTime: number | null;
  
  // Actions
  initializeForm: (itemId?: number) => Promise<void>;
  loadRequest: (itemId: number) => Promise<void>;
  createNewRequest: () => void;
  updateField: <K extends keyof (Request | NewRequest)>(field: K, value: (Request | NewRequest)[K]) => void;
  updateFields: (fields: Partial<Request | NewRequest>) => void;
  checkIsDirty: () => boolean;
  saveAsDraft: () => Promise<boolean>;
  submitRequest: () => Promise<boolean>;
  cancelRequest: () => Promise<boolean>;
  holdRequest: () => Promise<boolean>;
  resetForm: () => void;
  clearErrors: () => void;
  
  // Utility methods
  getDefaultNewRequest: () => NewRequest;
  isNewRequest: () => boolean;
  canEdit: () => boolean;
  canSubmit: () => boolean;
  canCancel: () => boolean;
  canHold: () => boolean;
}

const getDefaultNewRequest = (): NewRequest => ({
  Title: '',
  Description: '',
  Status: RequestStatus.Draft,
  Priority: 'Medium',
  RequestType: '',
  RequestedBy: '', // TODO: Get from current user context
  RequestedDate: new Date(),
  DueDate: undefined,
});

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
const isEqual = (obj1: any, obj2: any): boolean => JSON.stringify(obj1) === JSON.stringify(obj2);

const initialState = {
  currentRequest: null,
  originalRequest: null,
  formMode: FormMode.New,
  itemId: undefined,
  isLoading: false,
  isInitialized: false,
  isSaving: false,
  error: null,
  saveError: null,
  isDirty: false,
  lastSaveTime: null,
};

export const useRequestFormStore = create<RequestFormState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeForm: async (itemId?: number) => {
        set({ 
          isLoading: true, 
          error: null, 
          itemId,
          formMode: itemId ? FormMode.Edit : FormMode.New 
        });

        try {
          if (itemId) {
            await get().loadRequest(itemId);
          } else {
            get().createNewRequest();
          }
          set({ isInitialized: true, isLoading: false });
        } catch (error) {
          console.error('Failed to initialize form:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize form',
            isInitialized: false
          });
        }
      },

      loadRequest: async (itemId: number) => {
        try {
          // TODO: Replace with your PnP SP logic
          // const item = await sp.web.lists.getByTitle("Request")
          //   .items.getById(itemId)
          //   .select("*", "Author/Title", "Editor/Title")
          //   .expand("Author", "Editor").get();
          // const request: Request = {
          //   Id: item.Id,
          //   Title: item.Title,
          //   Description: item.Description,
          //   Status: item.Status,
          //   Priority: item.Priority,
          //   RequestType: item.RequestType,
          //   RequestedBy: item.RequestedBy,
          //   RequestedDate: new Date(item.RequestedDate),
          //   DueDate: item.DueDate ? new Date(item.DueDate) : undefined,
          //   Created: new Date(item.Created),
          //   Modified: new Date(item.Modified),
          //   Author: item.Author,
          //   Editor: item.Editor
          // };

          const request: Request = {} as Request; // Replace with actual fetch
          const originalRequest = deepClone(request);

          set({
            currentRequest: request,
            originalRequest: originalRequest,
            formMode: FormMode.Edit,
            isDirty: false
          });
        } catch (error) {
          console.error(`Failed to load request ${itemId}:`, error);
          throw error;
        }
      },

      createNewRequest: () => {
        const newRequest = getDefaultNewRequest();
        const originalRequest = deepClone(newRequest);

        set({
          currentRequest: newRequest,
          originalRequest: originalRequest,
          formMode: FormMode.New,
          isDirty: false
        });
      },

      updateField: (field, value) => {
        const { currentRequest } = get();
        if (!currentRequest) return;

        const updatedRequest = { ...currentRequest, [field]: value };
        set({
          currentRequest: updatedRequest,
          isDirty: get().checkIsDirty()
        });
      },

      updateFields: (fields) => {
        const { currentRequest } = get();
        if (!currentRequest) return;

        const updatedRequest = { ...currentRequest, ...fields };
        set({
          currentRequest: updatedRequest,
          isDirty: get().checkIsDirty()
        });
      },

      checkIsDirty: () => {
        const { currentRequest, originalRequest } = get();
        if (!currentRequest || !originalRequest) return false;
        return !isEqual(currentRequest, originalRequest);
      },

      saveAsDraft: async () => {
        const { currentRequest, isNewRequest } = get();
        if (!currentRequest) return false;

        try {
          set({ isSaving: true, saveError: null });

          const requestToSave = { ...currentRequest, Status: RequestStatus.Draft };

          // TODO: Replace with your PnP SP logic
          // if (isNewRequest()) {
          //   const result = await sp.web.lists.getByTitle("Request").items.add(requestToSave);
          //   savedRequest = await sp.web.lists.getByTitle("Request").items.getById(result.data.Id).get();
          // } else {
          //   await sp.web.lists.getByTitle("Request").items.getById((requestToSave as Request).Id).update(requestToSave);
          //   savedRequest = await sp.web.lists.getByTitle("Request").items.getById((requestToSave as Request).Id).get();
          // }

          const savedRequest: Request = {} as Request; // Replace with actual save
          const originalRequest = deepClone(savedRequest);

          set({
            currentRequest: savedRequest,
            originalRequest: originalRequest,
            formMode: FormMode.Edit,
            isDirty: false,
            isSaving: false,
            lastSaveTime: Date.now(),
            itemId: savedRequest.Id
          });

          return true;
        } catch (error) {
          console.error('Failed to save as draft:', error);
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to save as draft'
          });
          return false;
        }
      },

      submitRequest: async () => {
        const { currentRequest, isNewRequest } = get();
        if (!currentRequest) return false;

        try {
          set({ isSaving: true, saveError: null });

          const requestToSave = { ...currentRequest, Status: RequestStatus.Submitted };

          // TODO: Same save logic as saveAsDraft but with different status
          const savedRequest: Request = {} as Request; // Replace with actual save
          const originalRequest = deepClone(savedRequest);

          set({
            currentRequest: savedRequest,
            originalRequest: originalRequest,
            formMode: FormMode.View,
            isDirty: false,
            isSaving: false,
            lastSaveTime: Date.now(),
            itemId: savedRequest.Id
          });

          return true;
        } catch (error) {
          console.error('Failed to submit request:', error);
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to submit request'
          });
          return false;
        }
      },

      cancelRequest: async () => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          const requestToSave = { ...currentRequest, Status: RequestStatus.Cancelled };

          // TODO: Replace with your PnP SP update logic
          // await sp.web.lists.getByTitle("Request").items.getById((requestToSave as Request).Id).update(requestToSave);
          // const updatedRequest = await sp.web.lists.getByTitle("Request").items.getById((requestToSave as Request).Id).get();

          const updatedRequest: Request = {} as Request; // Replace with actual update
          const originalRequest = deepClone(updatedRequest);

          set({
            currentRequest: updatedRequest,
            originalRequest: originalRequest,
            formMode: FormMode.View,
            isDirty: false,
            isSaving: false,
            lastSaveTime: Date.now()
          });

          return true;
        } catch (error) {
          console.error('Failed to cancel request:', error);
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to cancel request'
          });
          return false;
        }
      },

      holdRequest: async () => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          const requestToSave = { ...currentRequest, Status: RequestStatus.OnHold };

          // TODO: Same update logic as cancelRequest but with OnHold status
          const updatedRequest: Request = {} as Request; // Replace with actual update
          const originalRequest = deepClone(updatedRequest);

          set({
            currentRequest: updatedRequest,
            originalRequest: originalRequest,
            isDirty: false,
            isSaving: false,
            lastSaveTime: Date.now()
          });

          return true;
        } catch (error) {
          console.error('Failed to hold request:', error);
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to hold request'
          });
          return false;
        }
      },

      resetForm: () => {
        set({ ...initialState });
      },

      clearErrors: () => {
        set({ error: null, saveError: null });
      },

      // Utility methods
      getDefaultNewRequest: getDefaultNewRequest,

      isNewRequest: () => {
        const { formMode, currentRequest } = get();
        return formMode === FormMode.New || !currentRequest || !('Id' in currentRequest);
      },

      canEdit: () => {
        const { currentRequest, formMode } = get();
        if (!currentRequest) return false;
        if (formMode === FormMode.View) return false;
        
        // Business logic: can edit if Draft or OnHold
        if ('Status' in currentRequest) {
          return currentRequest.Status === RequestStatus.Draft || 
                 currentRequest.Status === RequestStatus.OnHold;
        }
        return true;
      },

      canSubmit: () => {
        const { currentRequest } = get();
        if (!currentRequest) return false;
        
        // Validation: check required fields
        const hasRequiredFields = currentRequest.Title && 
                                currentRequest.RequestType && 
                                currentRequest.Priority;
        
        if ('Status' in currentRequest) {
          return hasRequiredFields && 
                 (currentRequest.Status === RequestStatus.Draft || 
                  currentRequest.Status === RequestStatus.OnHold);
        }
        return hasRequiredFields;
      },

      canCancel: () => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;
        
        return (currentRequest as Request).Status === RequestStatus.Submitted || 
               (currentRequest as Request).Status === RequestStatus.InProgress;
      },

      canHold: () => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;
        
        return (currentRequest as Request).Status === RequestStatus.Submitted || 
               (currentRequest as Request).Status === RequestStatus.InProgress;
      }
    }),
    { name: 'request-form-store' }
  )
);
```

## 🪝 Custom Hooks

### 1. useConfig Hook
**Purpose:** Enhanced configuration access with type conversion

```typescript
// hooks/useConfig.ts
import { useConfigStore } from '../stores/configStore';

export const useConfig = () => {
  const { 
    getConfigValue, 
    isInitialized, 
    isLoading, 
    error,
    lastLoadTime,
    loadConfigs 
  } = useConfigStore();
  
  return {
    // Core access methods
    getConfigValue,
    isInitialized,
    isLoading,
    error,
    lastLoadTime,
    reloadConfigs: loadConfigs,
    
    // Helper methods for type conversion with defaults
    getString: (key: string, defaultValue = '') => {
      const value = getConfigValue(key);
      return value !== undefined ? value : defaultValue;
    },
    
    getNumber: (key: string, defaultValue = 0) => {
      const value = getConfigValue(key);
      if (value === undefined) return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    
    getBoolean: (key: string, defaultValue = false) => {
      const value = getConfigValue(key);
      if (value === undefined) return defaultValue;
      return value.toLowerCase() === 'true';
    },
    
    getArray: (key: string, delimiter = ',', defaultValue: string[] = []) => {
      const value = getConfigValue(key);
      if (value === undefined) return defaultValue;
      return value.split(delimiter).map(item => item.trim()).filter(Boolean);
    },

    hasConfig: (key: string) => {
      return getConfigValue(key) !== undefined;
    },

    getJSON: <T>(key: string, defaultValue: T): T => {
      const value = getConfigValue(key);
      if (value === undefined) return defaultValue;
      try {
        return JSON.parse(value) as T;
      } catch {
        console.warn(`Failed to parse JSON config for key: ${key}`);
        return defaultValue;
      }
    }
  };
};
```

### 2. useFieldChoices Hook
**Purpose:** Enhanced field choices access with UI-ready formats

```typescript
// hooks/useFieldChoices.ts
import { useFieldChoicesStore } from '../stores/fieldChoicesStore';

export const useFieldChoices = () => {
  const { 
    getFieldChoices, 
    hasFieldChoices, 
    loadFieldChoices, 
    isInitialized, 
    isLoading,
    error 
  } = useFieldChoicesStore();
  
  return {
    // Core methods
    getFieldChoices,
    hasFieldChoices,
    loadFieldChoices,
    isInitialized,
    isLoading,
    error,
    
    // Helper for Fluent UI Dropdown options
    getDropdownOptions: (fieldName: string, includeEmpty = false) => {
      const choices = getFieldChoices(fieldName);
      const options = choices.map(choice => ({
        key: choice,
        text: choice,
        value: choice
      }));

      if (includeEmpty) {
        return [{ key: '', text: 'Select...', value: '' }, ...options];
      }
      return options;
    },

    // Helper for React Hook Form / HTML select options
    getSelectOptions: (fieldName: string, includeEmpty = true) => {
      const choices = getFieldChoices(fieldName);
      const options = choices.map(choice => ({
        label: choice,
        value: choice
      }));

      if (includeEmpty) {
        return [{ label: 'Select...', value: '' }, ...options];
      }
      return options;
    },

    // Helper for radio button options
    getRadioOptions: (fieldName: string) => {
      const choices = getFieldChoices(fieldName);
      return choices.map(choice => ({
        key: choice,
        text: choice,
        value: choice
      }));
    },

    // Get choices as simple string array
    getChoicesArray: (fieldName: string) => {
      return getFieldChoices(fieldName);
    },

    // Check if field has specific choice
    hasChoice: (fieldName: string, choice: string) => {
      const choices = getFieldChoices(fieldName);
      return choices.includes(choice);
    },

    // Get first choice (useful for defaults)
    getFirstChoice: (fieldName: string) => {
      const choices = getFieldChoices(fieldName);
      return choices.length > 0 ? choices[0] : undefined;
    }
  };
};
```, includeEmpty?: boolean): Array<{label: string, value: string}>
getRadioOptions(fieldName: string): Array<{key: string, text: string, value: string}>
getChoicesArray(fieldName: string): string[]
hasChoice(fieldName: string, choice: string): boolean
getFirstChoice(fieldName: string): string | undefined
```

### 3. useRequestForm Hook
**Purpose:** Enhanced form management with validation and helpers

```typescript
// hooks/useRequestForm.ts
import { useRequestFormStore, Request, NewRequest, FormMode } from '../stores/requestFormStore';

export const useRequestForm = () => {
  const store = useRequestFormStore();
  
  return {
    // All store methods and properties
    ...store,
    
    // Additional helper methods
    getFieldValue: <K extends keyof (Request | NewRequest)>(field: K) => {
      return store.currentRequest?.[field];
    },

    setFieldValue: <K extends keyof (Request | NewRequest)>(
      field: K, 
      value: (Request | NewRequest)[K]
    ) => {
      store.updateField(field, value);
    },

    isFieldRequired: (field: keyof (Request | NewRequest)) => {
      // Business rules for required fields
      const requiredFields = ['Title', 'RequestType', 'Priority', 'RequestedDate'];
      return requiredFields.includes(field as string);
    },

    validateForm: () => {
      const request = store.currentRequest;
      if (!request) return { isValid: false, errors: ['No request data'] };

      const errors: string[] = [];
      
      // Required field validation
      if (!request.Title?.trim()) errors.push('Title is required');
      if (!request.RequestType) errors.push('Request Type is required');
      if (!request.Priority) errors.push('Priority is required');
      if (!request.RequestedDate) errors.push('Requested Date is required');

      // Business rule validation
      if (request.DueDate && request.RequestedDate) {
        if (new Date(request.DueDate) < new Date(request.RequestedDate)) {
          errors.push('Due date cannot be before requested date');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },

    getDisplayValue: (field: keyof (Request | NewRequest)) => {
      const value = store.currentRequest?.[field];
      if (!value) return '';
      
      // Format date fields for display
      if (field === 'RequestedDate' || field === 'DueDate') {
        return new Date(value as Date).toLocaleDateString();
      }
      
      if (field === 'Created' || field === 'Modified') {
        return new Date(value as Date).toLocaleString();
      }
      
      return value.toString();
    },

    // Form state helpers
    hasUnsavedChanges: () => store.isDirty,
    isReadOnly: () => store.formMode === FormMode.View || !store.canEdit(),
    isNewForm: () => store.isNewRequest(),
    isEditForm: () => store.formMode === FormMode.Edit,
    isViewForm: () => store.formMode === FormMode.View,

    // Status helpers
    getStatusColor: () => {
      const request = store.currentRequest;
      if (!request || !('Status' in request)) return '#000000';
      
      const statusColors: { [key: string]: string } = {
        'Draft': '#757575',
        'Submitted': '#2196F3',
        'In Progress': '#FF9800',
        'On Hold': '#FF5722',
        'Completed': '#4CAF50',
        'Cancelled': '#F44336'
      };
      
      return statusColors[(request as Request).Status] || '#000000';
    },

    // Action helpers with confirmation
    saveWithConfirmation: async (showConfirmation = false) => {
      if (showConfirmation && !confirm('Save as draft?')) return false;
      return await store.saveAsDraft();
    },

    submitWithConfirmation: async (showConfirmation = true) => {
      if (showConfirmation && !confirm('Submit this request?')) return false;
      return await store.submitRequest();
    },

    cancelWithConfirmation: async (showConfirmation = true) => {
      if (showConfirmation && !confirm('Cancel this request? This action cannot be undone.')) return false;
      return await store.cancelRequest();
    },

    holdWithConfirmation: async (showConfirmation = true) => {
      if (showConfirmation && !confirm('Put this request on hold?')) return false;
      return await store.holdRequest();
    }
  };
};
```

### 4. useFormValidation Hook
**Purpose:** Specialized hook for form validation

```typescript
// hooks/useFormValidation.ts
import { useState } from 'react';
import { useRequestForm } from './useRequestForm';
import { Request, NewRequest } from '../models/Request';

export const useFormValidation = () => {
  const { currentRequest, validateForm } = useRequestForm();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const validateField = (field: keyof (Request | NewRequest), value: any) => {
    const errors: string[] = [];
    
    switch (field) {
      case 'Title':
        if (!value || !value.trim()) {
          errors.push('Title is required');
        } else if (value.length > 255) {
          errors.push('Title cannot exceed 255 characters');
        }
        break;
        
      case 'RequestType':
        if (!value) errors.push('Request Type is required');
        break;
        
      case 'Priority':
        if (!value) errors.push('Priority is required');
        break;
        
      case 'RequestedDate':
        if (!value) {
          errors.push('Requested Date is required');
        } else if (new Date(value) > new Date()) {
          errors.push('Requested Date cannot be in the future');
        }
        break;
        
      case 'DueDate':
        if (value && currentRequest?.RequestedDate) {
          if (new Date(value) < new Date(currentRequest.RequestedDate)) {
            errors.push('Due Date cannot be before Requested Date');
          }
        }
        break;
    }
    
    return errors;
  };
  
  const validateAllFields = () => {
    const result = validateForm();
    setValidationErrors(result.errors);
    return result;
  };
  
  return {
    validateField,
    validateAllFields,
    validationErrors,
    clearValidationErrors: () => setValidationErrors([]),
    hasValidationErrors: validationErrors.length > 0
  };
};
```

### 5. useFormActions Hook
**Purpose:** Specialized hook for form actions with business logic

```typescript
// hooks/useFormActions.ts
import { useRequestForm } from './useRequestForm';
import { useConfig } from './useConfig';

export const useFormActions = () => {
  const requestForm = useRequestForm();
  const config = useConfig();
  
  // Get configuration for confirmations
  const requireSaveConfirmation = config.getBoolean('RequireSaveConfirmation', false);
  const requireSubmitConfirmation = config.getBoolean('RequireSubmitConfirmation', true);
  const requireCancelConfirmation = config.getBoolean('RequireCancelConfirmation', true);
  
  const actions = {
    save: () => requestForm.saveWithConfirmation(requireSaveConfirmation),
    submit: () => requestForm.submitWithConfirmation(requireSubmitConfirmation),
    cancel: () => requestForm.cancelWithConfirmation(requireCancelConfirmation),
    hold: () => requestForm.holdWithConfirmation(true),
    
    // Bulk actions
    saveAndContinue: async () => {
      const success = await actions.save();
      if (success) {
        // TODO: Navigate to next form or show success message
        console.log('Saved successfully, continuing...');
      }
      return success;
    },
    
    saveAndClose: async () => {
      const success = await actions.save();
      if (success) {
        // TODO: Close form or navigate away
        console.log('Saved successfully, closing...');
      }
      return success;
    }
  };
  
  return {
    ...actions,
    canPerformAction: (action: keyof typeof actions) => {
      switch (action) {
        case 'save':
          return requestForm.canEdit() && requestForm.isDirty;
        case 'submit':
          return requestForm.canSubmit();
        case 'cancel':
          return requestForm.canCancel();
        case 'hold':
          return requestForm.canHold();
        default:
          return false;
      }
    }
  };
};
```

### 6. Hooks Index File
```typescript
// hooks/index.ts
export * from './useConfig';
export * from './useFieldChoices';
export * from './useRequestForm';
export * from './useFormValidation';
export * from './useFormActions';
```

## 🔧 Implementation Examples

### 1. App Initializer (Top-Level Component)
```typescript
// components/AppInitializer.tsx
import React from 'react';
import { useConfigStore } from '../stores/configStore';
import { useFieldChoicesStore } from '../stores/fieldChoicesStore';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const configStore = useConfigStore();
  const fieldChoicesStore = useFieldChoicesStore();

  React.useEffect(() => {
    const initializeStores = async () => {
      // Load both stores in parallel
      const promises = [];
      
      if (!configStore.isInitialized && !configStore.isLoading) {
        promises.push(configStore.loadConfigs());
      }
      
      if (!fieldChoicesStore.isInitialized && !fieldChoicesStore.isLoading) {
        promises.push(fieldChoicesStore.loadAllFieldChoices());
      }
      
      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }
    };

    initializeStores();
  }, []);

  const isLoading = configStore.isLoading || fieldChoicesStore.isLoading;
  const hasErrors = configStore.error || fieldChoicesStore.error;
  const isInitialized = configStore.isInitialized && fieldChoicesStore.isInitialized;

  if (isLoading) {
    return <div>Loading application data...</div>;
  }

  if (hasErrors) {
    return (
      <div style={{ color: 'red' }}>
        <h3>Application Initialization Error</h3>
        {configStore.error && <p>Config Error: {configStore.error}</p>}
        {fieldChoicesStore.error && <p>Field Choices Error: {fieldChoicesStore.error}</p>}
        <button onClick={() => {
          configStore.loadConfigs();
          fieldChoicesStore.loadAllFieldChoices();
        }}>
          Retry Initialization
        </button>
      </div>
    );
  }

  if (isInitialized) {
    return <>{children}</>;
  }

  return <div>Initializing application...</div>;
};

export default AppInitializer;
```

### 2. Request Form Component
```typescript
// components/RequestForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { useConfig } from '../hooks/useConfig';
import { useFieldChoices } from '../hooks/useFieldChoices';
import { useRequestForm } from '../hooks/useRequestForm';
import { NewRequest, Request } from '../models/Request';

interface RequestFormProps {
  itemId?: number;
  onSaveSuccess?: () => void;
  onSubmitSuccess?: () => void;
}

const RequestForm: React.FC<RequestFormProps> = ({ 
  itemId, 
  onSaveSuccess, 
  onSubmitSuccess 
}) => {
  const config = useConfig();
  const fieldChoices = useFieldChoices();
  const requestForm = useRequestForm();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<NewRequest | Request>();

  // Initialize form
  React.useEffect(() => {
    requestForm.initializeForm(itemId);
  }, [itemId]);

  // Sync form values with store
  React.useEffect(() => {
    if (requestForm.currentRequest) {
      Object.entries(requestForm.currentRequest).forEach(([key, value]) => {
        setValue(key as keyof (NewRequest | Request), value);
      });
    }
  }, [requestForm.currentRequest, setValue]);

  // Watch form changes and update store
  const watchedValues = watch();
  React.useEffect(() => {
    if (requestForm.currentRequest && watchedValues) {
      const hasChanges = Object.entries(watchedValues).some(([key, value]) => {
        return requestForm.currentRequest![key as keyof (NewRequest | Request)] !== value;
      });

      if (hasChanges) {
        requestForm.updateFields(watchedValues);
      }
    }
  }, [watchedValues]);

  // Get configuration values
  const appTitle = config.getString('AppTitle', 'Request Form');
  const maxRetries = config.getNumber('MaxRetries', 3);
  const enableValidation = config.getBoolean('EnableValidation', true);

  // Get field choices for dropdowns
  const priorityOptions = fieldChoices.getSelectOptions('Priority');
  const requestTypeOptions = fieldChoices.getSelectOptions('RequestType');
  const statusOptions = fieldChoices.getSelectOptions('Status');

  const handleSaveAsDraft = async () => {
    const success = await requestForm.saveAsDraft();
    if (success && onSaveSuccess) {
      onSaveSuccess();
    }
  };

  const handleSubmitRequest = async () => {
    const success = await requestForm.submitRequest();
    if (success && onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  if (requestForm.isLoading) {
    return <div>Loading request...</div>;
  }

  if (requestForm.error) {
    return (
      <div style={{ color: 'red' }}>
        Error: {requestForm.error}
        <button onClick={() => requestForm.clearErrors()}>Clear Error</button>
      </div>
    );
  }

  return (
    <div>
      <h1>{appTitle}</h1>
      
      <form>
        {/* Title Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Title *</label>
          <input
            {...register('Title', { required: 'Title is required' })}
            disabled={requestForm.isReadOnly()}
          />
          {errors.Title && <span style={{ color: 'red' }}>{errors.Title.message}</span>}
        </div>

        {/* Description Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Description</label>
          <textarea
            {...register('Description')}
            disabled={requestForm.isReadOnly()}
          />
        </div>

        {/* Request Type Dropdown */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Request Type *</label>
          <select
            {...register('RequestType', { required: 'Request Type is required' })}
            disabled={requestForm.isReadOnly()}
          >
            {requestTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.RequestType && <span style={{ color: 'red' }}>{errors.RequestType.message}</span>}
        </div>

        {/* Priority Dropdown */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Priority *</label>
          <select
            {...register('Priority', { required: 'Priority is required' })}
            disabled={requestForm.isReadOnly()}
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.Priority && <span style={{ color: 'red' }}>{errors.Priority.message}</span>}
        </div>

        {/* Dates */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Requested Date *</label>
          <input
            type="date"
            {...register('RequestedDate', { required: 'Requested Date is required' })}
            disabled={requestForm.isReadOnly()}
          />
          {errors.RequestedDate && <span style={{ color: 'red' }}>{errors.RequestedDate.message}</span>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Due Date</label>
          <input
            type="date"
            {...register('DueDate')}
            disabled={requestForm.isReadOnly()}
          />
        </div>

        {/* Status (for existing requests) */}
        {!requestForm.isNewRequest() && (
          <div style={{ marginBottom: '1rem' }}>
            <label>Status</label>
            <select
              {...register('Status')}
              disabled={true} // Status controlled by actions
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form Status Display */}
        <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: '#f5f5f5' }}>
          <div>Form Mode: {requestForm.formMode}</div>
          <div>Has Changes: {requestForm.isDirty ? 'Yes' : 'No'}</div>
          <div>Can Edit: {requestForm.canEdit() ? 'Yes' : 'No'}</div>
          <div>Can Submit: {requestForm.canSubmit() ? 'Yes' : 'No'}</div>
          {requestForm.lastSaveTime && (
            <div>Last Saved: {new Date(requestForm.lastSaveTime).toLocaleString()}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
          {requestForm.canEdit() && (
            <>
              <button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={requestForm.isSaving || !requestForm.isDirty}
              >
                {requestForm.isSaving ? 'Saving...' : 'Save as Draft'}
              </button>

              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={requestForm.isSaving || !requestForm.canSubmit()}
              >
                {requestForm.isSaving ? 'Submitting...' : 'Submit Request'}
              </button>
            </>
          )}

          {requestForm.canCancel() && (
            <button
              type="button"
              onClick={() => requestForm.cancelRequest()}
              disabled={requestForm.isSaving}
              style={{ backgroundColor: '#d32f2f', color: 'white' }}
            >
              {requestForm.isSaving ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}

          {requestForm.canHold() && (
            <button
              type="button"
              onClick={() => requestForm.holdRequest()}
              disabled={requestForm.isSaving}
              style={{ backgroundColor: '#ff9800', color: 'white' }}
            >
              {requestForm.isSaving ? 'Updating...' : 'Put on Hold'}
            </button>
          )}

          <button
            type="button"
            onClick={() => requestForm.resetForm()}
            style={{ backgroundColor: '#757575', color: 'white' }}
          >
            Reset Form
          </button>
        </div>

        {/* Error Display */}
        {requestForm.saveError && (
          <div style={{ color: 'red', marginTop: '1rem' }}>
            Save Error: {requestForm.saveError}
            <button onClick={() => requestForm.clearErrors()}>Clear</button>
          </div>
        )}
      </form>
    </div>
  );
};

export default RequestForm;
```

### 3. Main SPFx Form Customizer Integration
```typescript
// RequestFormCustomizer.tsx
import React from 'react';
import AppInitializer from './components/AppInitializer';
import RequestForm from './components/RequestForm';

interface RequestFormCustomizerProps {
  itemId?: number; // From SPFx context
}

const RequestFormCustomizer: React.FC<RequestFormCustomizerProps> = ({ itemId }) => {
  const handleSaveSuccess = () => {
    console.log('Request saved successfully');
    // Add notification, redirect, etc.
  };

  const handleSubmitSuccess = () => {
    console.log('Request submitted successfully');
    // Add notification, redirect, etc.
  };

  return (
    <AppInitializer>
      <div style={{ padding: '20px' }}>
        <RequestForm
          itemId={itemId}
          onSaveSuccess={handleSaveSuccess}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </AppInitializer>
  );
};

export default RequestFormCustomizer;
```

## 📖 Usage Patterns

### Configuration Access
```typescript
const MyComponent = () => {
  const config = useConfig();
  
  const apiUrl = config.getString('ApiBaseUrl', 'https://default.com');
  const timeout = config.getNumber('RequestTimeout', 5000);
  const enableFeature = config.getBoolean('EnableAdvancedFeatures', false);
  const allowedRoles = config.getArray('AllowedRoles', ',', ['User']);
  
  return <div>API: {apiUrl}</div>;
};
```

### Field Choices Access
```typescript
const DropdownComponent = () => {
  const fieldChoices = useFieldChoices();
  
  const priorityOptions = fieldChoices.getSelectOptions('Priority');
  const statusOptions = fieldChoices.getDropdownOptions('Status', true);
  
  return (
    <select>
      {priorityOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
```

### Form Management
```typescript
const FormComponent = () => {
  const requestForm = useRequestForm();
  
  React.useEffect(() => {
    // Initialize form (new or edit based on itemId)
    requestForm.initializeForm(itemId);
  }, [itemId]);
  
  const handleFieldChange = (field: string, value: any) => {
    requestForm.updateField(field, value);
  };
  
  const handleSave = async () => {
    if (requestForm.canEdit()) {
      const success = await requestForm.saveAsDraft();
      if (success) {
        console.log('Saved!');
      }
    }
  };
  
  return (
    <div>
      <input 
        value={requestForm.getFieldValue('Title') || ''}
        onChange={(e) => handleFieldChange('Title', e.target.value)}
        disabled={requestForm.isReadOnly()}
      />
      
      <button 
        onClick={handleSave}
        disabled={!requestForm.canEdit() || requestForm.isSaving}
      >
        {requestForm.isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};
```

## 🔍 Key Benefits

1. **Parallel Loading** - Config and Field Choices load simultaneously
2. **Type Safety** - Full TypeScript support throughout
3. **Automatic State Management** - Dirty checking, loading states, error handling
4. **Business Logic Enforcement** - Built-in validation and permission checking
5. **Developer Experience** - Redux DevTools integration, custom hooks
6. **Performance** - Optimized with Maps for quick lookups
7. **Flexibility** - Easy to extend and customize for specific needs

## 🚨 Important Notes

- Replace placeholder PnP SP logic in stores with your actual SharePoint operations
- Customize validation rules in `useRequestForm` hook based on your business requirements
- Add proper error boundaries around your components
- Consider adding persistence middleware if you need to survive page refreshes
- Ensure proper security validation on the SharePoint side

## 🎯 Next Steps

1. Implement your PnP SP service layer
2. Add proper error boundaries
3. Customize validation rules
4. Add any additional business logic
5. Implement proper logging
6. Add unit tests for stores and hooks
7. Consider adding persistence middleware for offline scenarios
