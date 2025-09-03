import { useCallback } from 'react';
import { focusController } from '../controller/FocusController';
import type { ValidationResult } from '../Field.types';

interface UseFieldFocusReturn {
	// Focus management
	focusField: (id: string) => boolean;
	scrollToField: (id: string) => boolean;
	focusNextField: (currentId: string) => boolean;
	focusPreviousField: (currentId: string) => boolean;
	focusFirstField: () => boolean;
	focusLastField: () => boolean;
	
	// Validation and error handling
	validateAllFields: (container?: HTMLElement) => ValidationResult;
	getFieldErrors: (container?: HTMLElement) => { [fieldId: string]: string };
	focusFirstInvalidField: (container?: HTMLElement) => boolean;
	
	// Utility methods
	getAllFields: () => string[];
	isFieldRegistered: (fieldId: string) => boolean;
	getRegisteredFieldCount: () => number;
	
	// Batch operations
	focusFieldsInSequence: (fieldIds: string[], delay?: number) => Promise<boolean[]>;
	scrollToFieldsInSequence: (fieldIds: string[], delay?: number) => Promise<boolean[]>;
	
	// Statistics
	getValidationStats: (container?: HTMLElement) => {
		totalFields: number;
		validFields: number;
		invalidFields: number;
		validationSources: { [source: string]: number };
	};
}

/**
 * Hook for field focus and validation management
 * Provides access to global focus controller functionality
 */
export const useFieldFocus = (): UseFieldFocusReturn => {
	// Focus management methods
	const focusField = useCallback((id: string): boolean => {
		return focusController.focusField(id);
	}, []);

	const scrollToField = useCallback((id: string): boolean => {
		return focusController.scrollToField(id);
	}, []);

	const focusNextField = useCallback((currentId: string): boolean => {
		return focusController.focusNextField(currentId);
	}, []);

	const focusPreviousField = useCallback((currentId: string): boolean => {
		return focusController.focusPreviousField(currentId);
	}, []);

	const focusFirstField = useCallback((): boolean => {
		return focusController.focusFirstField();
	}, []);

	const focusLastField = useCallback((): boolean => {
		return focusController.focusLastField();
	}, []);

	// Validation methods
	const validateAllFields = useCallback((container?: HTMLElement): ValidationResult => {
		return focusController.validateAllFields(container);
	}, []);

	const getFieldErrors = useCallback((container?: HTMLElement): { [fieldId: string]: string } => {
		return focusController.getFieldErrors(container);
	}, []);

	const focusFirstInvalidField = useCallback((container?: HTMLElement): boolean => {
		return focusController.focusFirstInvalidField(container);
	}, []);

	// Utility methods
	const getAllFields = useCallback((): string[] => {
		return focusController.getAllFields();
	}, []);

	const isFieldRegistered = useCallback((fieldId: string): boolean => {
		return focusController.isFieldRegistered(fieldId);
	}, []);

	const getRegisteredFieldCount = useCallback((): number => {
		return focusController.getRegisteredFieldCount();
	}, []);

	// Batch operations
	const focusFieldsInSequence = useCallback(
		(fieldIds: string[], delay?: number): Promise<boolean[]> => {
			return focusController.focusFieldsInSequence(fieldIds, delay);
		}, 
		[]
	);

	const scrollToFieldsInSequence = useCallback(
		(fieldIds: string[], delay?: number): Promise<boolean[]> => {
			return focusController.scrollToFieldsInSequence(fieldIds, delay);
		}, 
		[]
	);

	// Statistics
	const getValidationStats = useCallback((container?: HTMLElement) => {
		return focusController.getValidationStats(container);
	}, []);

	return {
		// Focus management
		focusField,
		scrollToField,
		focusNextField,
		focusPreviousField,
		focusFirstField,
		focusLastField,
		
		// Validation and error handling
		validateAllFields,
		getFieldErrors,
		focusFirstInvalidField,
		
		// Utility methods
		getAllFields,
		isFieldRegistered,
		getRegisteredFieldCount,
		
		// Batch operations
		focusFieldsInSequence,
		scrollToFieldsInSequence,
		
		// Statistics
		getValidationStats,
	};
};
