```
// hooks/useRequestForm.ts
import { useCallback } from 'react';
import { useRequestFormStore } from '../stores/requestFormStore';
import { Request, NewRequest, RequestStatus } from '../models/Request';

export const useRequestForm = () => {
  const store = useRequestFormStore();

  // Enhanced field helpers
  const getFieldValue = useCallback(<K extends keyof (Request | NewRequest)>(field: K) => {
    return store.currentRequest?.[field];
  }, [store.currentRequest]);

  const setFieldValue = useCallback(<K extends keyof (Request | NewRequest)>(
    field: K, 
    value: (Request | NewRequest)[K]
  ) => {
    store.updateField(field, value);
  }, [store.updateField]);

  // Field requirements based on status and access
  const isFieldRequired = useCallback((field: keyof (Request | NewRequest)) => {
    const { requestAccess, currentRequest } = store;
    
    // Core required fields
    const alwaysRequired = ['Title', 'RequestTitle', 'RequestType', 'Purpose', 'SubmissionType', 'SubmissionItem', 'TargetReturnDate', 'ReviewAudience'];
    if (alwaysRequired.includes(field as string)) return true;

    // Conditional requirements based on other field values
    if (field === 'RushRational' && currentRequest?.IsRushRequest) return true;
    
    // Status-based requirements
    if ('Status' in (currentRequest || {}) && currentRequest) {
      const request = currentRequest as Request;
      
      switch (request.Status) {
        case RequestStatus.LegalIntake:
          if (field === 'Attorney' && requestAccess.isLegalAdmin) return true;
          break;
        case RequestStatus.InReview:
          if (field === 'LegalReviewOutcome' && requestAccess.isAttorney) return true;
          if (field === 'LegalReviewNotes' && requestAccess.isAttorney) return true;
          if (field === 'ComplianceReviewOutcome' && requestAccess.isComplianceUser) return true;
          if (field === 'ComplianceReviewNotes' && requestAccess.isComplianceUser) return true;
          break;
        case RequestStatus.Closeout:
          if (field === 'TrackingId') return true;
          break;
      }
    }

    return false;
  }, [store]);

  const isFieldEnabled = useCallback((field: keyof (Request | NewRequest)) => {
    const { requestAccess } = store;
    
    // Check if user can edit overall
    if (!store.canEdit()) return false;
    
    // Field-specific logic based on sections
    const fieldSectionMap = {
      // Request Info fields
      'Title': 'enableRequestInfo',
      'RequestTitle': 'enableRequestInfo',
      'Department': 'enableRequestInfo',
      'RequestType': 'enableRequestInfo',
      'Purpose': 'enableRequestInfo',
      'SubmissionType': 'enableRequestInfo',
      'SubmissionItem': 'enableRequestInfo',
      'DistributionMethod': 'enableRequestInfo',
      'TargetReturnDate': 'enableRequestInfo',
      'IsRushRequest': 'enableRequestInfo',
      'RushRational': 'enableRequestInfo',
      'ReviewAudience': 'enableRequestInfo',
      'PriorSubmissions': 'enableRequestInfo',
      'PriorSubmissionNotes': 'enableRequestInfo',
      'DateOfFirstUse': 'enableRequestInfo',
      'AdditionalParty': 'enableRequestInfo',
      
      // Legal Intake fields
      'Attorney': 'enableLegalIntake',
      'AttorneyAssignNotes': 'enableLegalIntake',
      
      // Legal Review fields
      'LegalReviewOutcome': 'enableLegalReview',
      'LegalReviewNotes': 'enableLegalReview',
      
      // Compliance Review fields
      'ComplianceReviewOutcome': 'enableComplianceReview',
      'ComplianceReviewNotes': 'enableComplianceReview',
      'IsForesideReviewRequired': 'enableComplianceReview',
      'IsRetailUse': 'enableComplianceReview',
      
      // Closeout fields
      'TrackingId': 'enableCloseout'
    };

    const sectionKey = fieldSectionMap[field as keyof typeof fieldSectionMap];
    if (sectionKey) {
      return requestAccess[sectionKey as keyof typeof requestAccess] as boolean;
    }
    
    // Special cases for fields that are always disabled
    const alwaysDisabled = ['Department', 'RequestType']; // Auto-populated or set during creation
    if (alwaysDisabled.includes(field as string)) return false;
    
    return true;
  }, [store]);

  // Form state helpers
  const isReadOnly = useCallback(() => {
    return !store.canEdit();
  }, [store]);

  const hasUnsavedChanges = useCallback(() => {
    return store.isDirty;
  }, [store.isDirty]);

  // Action helpers with business logic
  const canPerformAction = useCallback((action: string) => {
    return store.canPerformAction(action);
  }, [store]);

  // Enhanced save with validation check
  const saveWithValidation = useCallback(async () => {
    // Basic client-side validation before save
    const requiredFields = ['Title', 'RequestTitle', 'Purpose'];
    const missingFields = requiredFields.filter(field => 
      !store.currentRequest?.[field as keyof (Request | NewRequest)]
    );
    
    if (missingFields.length > 0) {
      console.warn('Missing required fields:', missingFields);
      // Still allow saving as draft with warnings
    }
    
    return await store.saveAsDraft();
  }, [store]);

  // Enhanced submit with full validation
  const submitWithValidation = useCallback(async () => {
    // Full validation before submit
    const requiredFields = ['Title', 'RequestTitle', 'RequestType', 'Purpose', 'SubmissionType', 'SubmissionItem', 'TargetReturnDate', 'ReviewAudience'];
    const missingFields = requiredFields.filter(field => 
      !store.currentRequest?.[field as keyof (Request | NewRequest)]
    );
    
    if (missingFields.length > 0) {
      console.error('Cannot submit - missing required fields:', missingFields);
      return false;
    }

    // Check rush request rationale
    if (store.currentRequest?.IsRushRequest && !store.currentRequest?.RushRational?.trim()) {
      console.error('Rush rationale is required for expedited requests');
      return false;
    }

    // Check at least one approval
    const hasApprovals = store.currentRequest?.RequireCommunicationApproval ||
                        store.currentRequest?.PortfolioApprovalDate ||
                        store.currentRequest?.ResearchAnalystApprovalDate ||
                        store.currentRequest?.SMEApprovalDate ||
                        store.currentRequest?.PerformanceReviewApprovalDate ||
                        store.currentRequest?.OtherApprovalDate;

    if (!hasApprovals) {
      console.error('At least one approval is required');
      return false;
    }
    
    return await store.submitRequest();
  }, [store]);

  // Status helpers
  const getStatusColor = useCallback(() => {
    const request = store.currentRequest;
    if (!request || !('Status' in request)) return '#000000';
    
    const statusColors: { [key: string]: string } = {
      [RequestStatus.Draft]: '#757575',
      [RequestStatus.LegalIntake]: '#2196F3',
      [RequestStatus.AssignAttorney]: '#FF9800',
      [RequestStatus.InReview]: '#FF9800',
      [RequestStatus.Closeout]: '#4CAF50',
      [RequestStatus.Completed]: '#4CAF50',
      [RequestStatus.Cancelled]: '#F44336',
      [RequestStatus.OnHold]: '#FF5722'
    };
    
    return statusColors[(request as Request).Status] || '#000000';
  }, [store.currentRequest]);

  const getDisplayValue = useCallback((field: keyof (Request | NewRequest)) => {
    const value = store.currentRequest?.[field];
    if (!value && value !== 0) return '';
    
    // Format date fields
    const dateFields = ['RequestedDate', 'DueDate', 'DateOfFirstUse', 'Created', 'Modified'];
    if (dateFields.includes(field as string)) {
      return new Date(value as Date).toLocaleDateString();
    }
    
    // Format datetime fields
    const dateTimeFields = ['Created', 'Modified'];
    if (dateTimeFields.includes(field as string)) {
      return new Date(value as Date).toLocaleString();
    }
    
    // Format array fields
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    
    // Format user fields
    if (typeof value === 'object' && value !== null && 'title' in value) {
      return (value as any).title || (value as any).Title || 'Unknown User';
    }
    
    return value.toString();
  }, [store.currentRequest]);

  // Rush request helpers
  const isRushRequest = useCallback(() => {
    return store.currentRequest?.IsRushRequest || false;
  }, [store.currentRequest]);

  const getRushReason = useCallback(() => {
    return store.currentRequest?.RushRational || '';
  }, [store.currentRequest]);

  // Form mode helpers
  const isNewRequest = useCallback(() => {
    return store.isNewRequest();
  }, [store]);

  const isEditMode = useCallback(() => {
    return store.canEdit() && store.formMode !== 'View';
  }, [store]);

  const getFormProgress = useCallback(() => {
    if (!store.currentRequest) return 0;
    
    const requiredFields = ['Title', 'RequestTitle', 'Purpose', 'SubmissionType', 'SubmissionItem', 'TargetReturnDate', 'ReviewAudience'];
    const completedFields = requiredFields.filter(field => 
      store.currentRequest?.[field as keyof (Request | NewRequest)]
    );
    
    return (completedFields.length / requiredFields.length) * 100;
  }, [store.currentRequest]);

  return {
    // Store properties and methods
    ...store,
    
    // Enhanced field helpers
    getFieldValue,
    setFieldValue,
    isFieldRequired,
    isFieldEnabled,
    
    // Form state helpers
    isReadOnly,
    hasUnsavedChanges,
    canPerformAction,
    isNewRequest,
    isEditMode,
    
    // Enhanced actions
    saveWithValidation,
    submitWithValidation,
    
    // Display helpers
    getStatusColor,
    getDisplayValue,
    getFormProgress,
    
    // Rush request helpers
    isRushRequest,
    getRushReason,
  };
};

// hooks/useFormValidation.ts
import { useState, useCallback } from 'react';
import { useRequestForm } from './useRequestForm';
import { Request, NewRequest, RequestStatus } from '../models/Request';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string[]>;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

export const useFormValidation = () => {
  const requestForm = useRequestForm();
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    fieldErrors: {}
  });

  // Field-level validation for React Hook Form
  const getFieldRules = useCallback((fieldName: keyof (Request | NewRequest)) => {
    const rules: any = {};

    switch (fieldName) {
      case 'Title':
        rules.required = 'Request ID is required';
        rules.maxLength = { value: 255, message: 'Request ID cannot exceed 255 characters' };
        break;

      case 'RequestTitle':
        rules.required = 'Request title is required';
        rules.minLength = { value: 3, message: 'Request title must be at least 3 characters' };
        rules.maxLength = { value: 255, message: 'Request title cannot exceed 255 characters' };
        break;

      case 'RequestType':
        rules.required = 'Request type is required';
        break;

      case 'Purpose':
        rules.required = 'Purpose is required';
        rules.minLength = { value: 10, message: 'Purpose must be at least 10 characters' };
        break;

      case 'SubmissionType':
        rules.required = 'Submission type is required';
        break;

      case 'SubmissionItem':
        rules.required = 'Submission item is required';
        break;

      case 'TargetReturnDate':
        rules.required = 'Target return date is required';
        rules.validate = {
          notPast: (value: Date) => 
            value >= new Date() || 'Target return date cannot be in the past'
        };
        break;

      case 'RushRational':
        if (requestForm.isRushRequest()) {
          rules.required = 'Rush rationale is required for expedited requests';
          rules.minLength = { value: 10, message: 'Rush rationale must be detailed (minimum 10 characters)' };
        }
        break;

      case 'ReviewAudience':
        rules.required = 'Review audience is required';
        break;

      case 'DateOfFirstUse':
        rules.validate = {
          afterToday: (value?: Date) => 
            !value || value >= new Date() || 'Date of first use cannot be in the past'
        };
        break;

      case 'DueDate':
        rules.validate = {
          afterRequestedDate: (value?: Date) => {
            if (!value) return true;
            const requestedDate = requestForm.getFieldValue('RequestedDate');
            return !requestedDate || value >= requestedDate || 'Due date cannot be before requested date';
          }
        };
        break;

      // Legal fields
      case 'Attorney':
        if (requestForm.requestAccess.enableLegalIntake && requestForm.requestAccess.isLegalAdmin) {
          rules.required = 'Attorney assignment is required';
        }
        break;

      case 'AttorneyAssignNotes':
        if (requestForm.requestAccess.enableLegalIntake && requestForm.requestAccess.isLegalAdmin) {
          rules.minLength = { value: 5, message: 'Please provide assignment notes' };
        }
        break;

      case 'LegalReviewOutcome':
        if (requestForm.requestAccess.enableLegalReview && requestForm.requestAccess.isAttorney) {
          rules.required = 'Legal review outcome is required';
        }
        break;

      case 'LegalReviewNotes':
        if (requestForm.requestAccess.enableLegalReview && requestForm.requestAccess.isAttorney) {
          rules.required = 'Legal review notes are required';
          rules.minLength = { value: 10, message: 'Please provide detailed review notes' };
        }
        break;

      case 'ComplianceReviewOutcome':
        if (requestForm.requestAccess.enableComplianceReview && requestForm.requestAccess.isComplianceUser) {
          rules.required = 'Compliance review outcome is required';
        }
        break;

      case 'ComplianceReviewNotes':
        if (requestForm.requestAccess.enableComplianceReview && requestForm.requestAccess.isComplianceUser) {
          rules.required = 'Compliance review notes are required';
          rules.minLength = { value: 10, message: 'Please provide detailed review notes' };
        }
        break;

      case 'TrackingId':
        if (requestForm.requestAccess.enableCloseout) {
          rules.required = 'Tracking ID is required for closeout';
          rules.pattern = {
            value: /^[A-Z]{3}-\d{4}-\d{3}$/,
            message: 'Tracking ID must be in format: ABC-2024-001'
          };
        }
        break;

      // Approval date fields
      case 'CommunicationApprovalDate':
        if (requestForm.getFieldValue('RequireCommunicationApproval')) {
          rules.required = 'Communication approval date is required';
          rules.validate = {
            notFuture: (value: Date) => 
              value <= new Date() || 'Approval date cannot be in the future'
          };
        }
        break;

      case 'CommunicationApprover':
        if (requestForm.getFieldValue('RequireCommunicationApproval')) {
          rules.required = 'Communication approver is required';
        }
        break;
    }

    return rules;
  }, [requestForm]);

  // Single field validation
  const validateField = useCallback((
    fieldName: keyof (Request | NewRequest), 
    value: any
  ): FieldValidationResult => {
    const errors: string[] = [];
    const rules = getFieldRules(fieldName);

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(typeof rules.required === 'string' ? rules.required : `${fieldName} is required`);
    }

    // Skip other validations if empty and not required
    if (!value) {
      return { isValid: errors.length === 0, errors };
    }

    // Length validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength.value) {
        errors.push(rules.minLength.message);
      }
      if (rules.maxLength && value.length > rules.maxLength.value) {
        errors.push(rules.maxLength.message);
      }
      if (rules.pattern && !rules.pattern.value.test(value)) {
        errors.push(rules.pattern.message);
      }
    }

    // Custom validations
    if (rules.validate && value) {
      Object.values(rules.validate).forEach((validator: any) => {
        const result = validator(value);
        if (typeof result === 'string') {
          errors.push(result);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [getFieldRules]);

  // Business logic validation
  const validateRequest = useCallback((request?: Request | NewRequest): ValidationResult => {
    const dataToValidate = request || requestForm.currentRequest;
    if (!dataToValidated) {
      return {
        isValid: false,
        errors: ['No request data'],
        warnings: [],
        fieldErrors: {}
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Core field validation
    const coreFields: (keyof (Request | NewRequest))[] = [
      'Title', 'RequestTitle', 'RequestType', 'Purpose', 'SubmissionType', 
      'SubmissionItem', 'TargetReturnDate', 'ReviewAudience'
    ];

    coreFields.forEach(field => {
      const fieldResult = validateField(field, dataToValidated[field]);
      if (!fieldResult.isValid) {
        fieldErrors[field as string] = fieldResult.errors;
        errors.push(...fieldResult.errors);
      }
    });

    // Rush request validation
    if (dataToValidated.IsRushRequest) {
      const rushResult = validateField('RushRational', dataToValidated.RushRational);
      if (!rushResult.isValid) {
        fieldErrors.RushRational = rushResult.errors;
        errors.push(...rushResult.errors);
      }
    }

    // Approval validation - at least one approval required
    const hasApprovals = dataToValidated.RequireCommunicationApproval ||
                        dataToValidated.PortfolioApprovalDate ||
                        dataToValidated.ResearchAnalystApprovalDate ||
                        dataToValidated.SMEApprovalDate ||
                        dataToValidated.PerformanceReviewApprovalDate ||
                        dataToValidated.OtherApprovalDate;

    if (!hasApprovals) {
      errors.push('At least one approval is required');
      fieldErrors.approvals = ['At least one approval is required'];
    }

    // Validate each selected approval has complete information
    if (dataToValidated.RequireCommunicationApproval) {
      if (!dataToValidated.CommunicationApprovalDate) {
        errors.push('Communication approval date is required');
        fieldErrors.CommunicationApprovalDate = ['Approval date is required'];
      }
      if (!dataToValidated.CommunicationApprover) {
        errors.push('Communication approver is required');
        fieldErrors.CommunicationApprover = ['Approver is required'];
      }
    }

    // Date logic validation
    if (dataToValidated.DueDate && dataToValidated.RequestedDate) {
      if (new Date(dataToValidated.DueDate) < new Date(dataToValidated.RequestedDate)) {
        errors.push('Due date cannot be before requested date');
        fieldErrors.DueDate = ['Due date cannot be before requested date'];
      }
    }

    // Status-specific validation
    if ('Status' in dataToValidated) {
      const typedRequest = dataToValidated as Request;
      
      switch (typedRequest.Status) {
        case RequestStatus.LegalIntake:
          if (!typedRequest.Attorney && requestForm.requestAccess.isLegalAdmin) {
            errors.push('Attorney assignment is required');
            fieldErrors.Attorney = ['Attorney assignment is required'];
          }
          break;
          
        case RequestStatus.InReview:
          if (requestForm.requestAccess.isAttorney && !typedRequest.LegalReviewOutcome) {
            errors.push('Legal review outcome is required');
            fieldErrors.LegalReviewOutcome = ['Legal review outcome is required'];
          }
          if (requestForm.requestAccess.isComplianceUser && !typedRequest.ComplianceReviewOutcome) {
            errors.push('Compliance review outcome is required');
            fieldErrors.ComplianceReviewOutcome = ['Compliance review outcome is required'];
          }
          break;
          
        case RequestStatus.Closeout:
          if (!typedRequest.TrackingId) {
            errors.push('Tracking ID is required for closeout');
            fieldErrors.TrackingId = ['Tracking ID is required for closeout'];
          }
          break;
      }
    }

    // Business warnings
    if (dataToValidated.TargetReturnDate) {
      const daysUntilTarget = Math.ceil(
        (new Date(dataToValidated.TargetReturnDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilTarget < 3) {
        warnings.push('Very tight timeline - consider extending target return date');
      }
    }

    if (dataToValidated.Priority === 'High' && !dataToValidated.DueDate) {
      warnings.push('High priority requests should have a due date');
    }

    // Check for missing documents for approvals
    // TODO: Add document validation when document upload is implemented
    if (hasApprovals) {
      warnings.push('Ensure all approval documents are uploaded before submitting');
    }

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldErrors
    };

    setValidationState(result);
    return result;
  }, [requestForm, validateField]);

  // Validation for specific actions
  const validateForSubmission = useCallback(() => {
    const result = validateRequest();
    
    // Additional submission checks
    if (result.isValid && requestForm.currentRequest) {
      const additionalErrors: string[] = [];
      
      // Check if rush request logic is properly handled
      if (requestForm.isRushRequest() && !requestForm.getRushReason().trim()) {
        additionalErrors.push('Rush rationale is required for expedited processing');
      }
      
      // Check approval documentation
      // TODO: Add approval document validation when document upload is implemented
      
      if (additionalErrors.length > 0) {
        return {
          ...result,
          isValid: false,
          errors: [...result.errors, ...additionalErrors]
        };
      }
    }
    
    return result;
  }, [validateRequest, requestForm]);

  const validateForSave = useCallback(() => {
    // More lenient validation for saving drafts
    const result = validateRequest();
    
    // Allow saving with warnings but not errors
    return {
      ...result,
      isValid: result.errors.length === 0 // Warnings are OK for saves
    };
  }, [validateRequest]);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {}
    });
  }, []);

  const validateSpecificFields = useCallback((fieldNames: (keyof (Request | NewRequest))[]) => {
    if (!requestForm.currentRequest) return { isValid: true, errors: [], fieldErrors: {} };
    
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};
    
    fieldNames.forEach(fieldName => {
      const fieldResult = validateField(fieldName, requestForm.currentRequest![fieldName]);
      if (!fieldResult.isValid) {
        fieldErrors[fieldName as string] = fieldResult.errors;
        errors.push(...fieldResult.errors);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }, [validateField, requestForm.currentRequest]);

  return {
    // Validation methods
    validateField,
    validateRequest,
    validateForSubmission,
    validateForSave,
    validateSpecificFields,
    getFieldRules,
    clearValidation,
    
    // Validation state
    validationState,
    isFormValid: validationState.isValid,
    hasErrors: validationState.errors.length > 0,
    hasWarnings: validationState.warnings.length > 0,
    fieldErrors: validationState.fieldErrors,
    
    // Helper methods
    getFieldErrors: (fieldName: string) => validationState.fieldErrors[fieldName] || [],
    hasFieldErrors: (fieldName: string) => !!validationState.fieldErrors[fieldName]?.length,
    getErrorCount: () => validationState.errors.length,
    getWarningCount: () => validationState.warnings.length,
  };
};

```
