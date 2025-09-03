import type { 
	FieldRegistration, 
	ValidationResult, 
	FieldValidationMap, 
	FieldValidationState 
} from '../Field.types';
import { 
	findFieldElements, 
	scanElementValidation, 
	extractErrorMessage, 
	focusFirstElement, 
	scrollToElement 
} from '../utils/fieldUtils';

/**
 * Global focus and validation controller for Field components
 * Singleton pattern for centralized field management
 */
class FocusController {
	private static instance: FocusController;
	private fields = new Map<string, FieldRegistration>();

	private constructor() {}

	static getInstance(): FocusController {
		if (!FocusController.instance) {
			FocusController.instance = new FocusController();
		}
		return FocusController.instance;
	}

	// Core registration methods
	registerField(id: string, registration: FieldRegistration): void {
		this.fields.set(id, registration);
	}

	unregisterField(id: string): void {
		this.fields.delete(id);
	}

	// Focus management methods
	focusField(id: string): boolean {
		const field = this.fields.get(id);
		if (field && field.focusFn) {
			try {
				return field.focusFn();
			} catch (error) {
				console.warn(`Failed to focus field ${id}:`, error);
				return false;
			}
		}
		return false;
	}

	scrollToField(id: string): boolean {
		const field = this.fields.get(id);
		if (field && field.scrollFn) {
			try {
				return field.scrollFn();
			} catch (error) {
				console.warn(`Failed to scroll to field ${id}:`, error);
				return false;
			}
		}
		return false;
	}

	// Navigation methods
	focusNextField(currentId: string): boolean {
		const fieldIds = Array.from(this.fields.keys());
		const currentIndex = fieldIds.indexOf(currentId);
		
		if (currentIndex !== -1 && currentIndex < fieldIds.length - 1) {
			const nextFieldId = fieldIds[currentIndex + 1];
			return this.focusField(nextFieldId);
		}
		
		return false;
	}

	focusPreviousField(currentId: string): boolean {
		const fieldIds = Array.from(this.fields.keys());
		const currentIndex = fieldIds.indexOf(currentId);
		
		if (currentIndex > 0) {
			const previousFieldId = fieldIds[currentIndex - 1];
			return this.focusField(previousFieldId);
		}
		
		return false;
	}

	focusFirstField(): boolean {
		const fieldIds = Array.from(this.fields.keys());
		if (fieldIds.length > 0) {
			return this.focusField(fieldIds[0]);
		}
		return false;
	}

	focusLastField(): boolean {
		const fieldIds = Array.from(this.fields.keys());
		if (fieldIds.length > 0) {
			return this.focusField(fieldIds[fieldIds.length - 1]);
		}
		return false;
	}

	// Validation scanning methods
	scanFieldValidation(rootElement?: HTMLElement): FieldValidationMap {
		const fields = new Map<string, FieldValidationState>();
		const fieldElements = findFieldElements(rootElement);
		
		fieldElements.forEach(fieldEl => {
			const fieldId = fieldEl.getAttribute('data-field-id');
			if (!fieldId) return;
			
			const validation = scanElementValidation(fieldEl);
			const error = extractErrorMessage(fieldEl) || validation.error;
			
			fields.set(fieldId, {
				...validation,
				error: error || 'Validation failed'
			});
		});
		
		return fields;
	}

	validateAllFields(container?: HTMLElement): ValidationResult {
		const fieldStates = this.scanFieldValidation(container);
		const errors: { [fieldId: string]: string } = {};
		
		fieldStates.forEach((state, fieldId) => {
			if (!state.isValid) {
				errors[fieldId] = state.error;
			}
		});
		
		return {
			isValid: Object.keys(errors).length === 0,
			errors,
			fieldCount: fieldStates.size
		};
	}

	getFieldErrors(container?: HTMLElement): { [fieldId: string]: string } {
		const validation = this.validateAllFields(container);
		return validation.errors;
	}

	// Focus first invalid field
	focusFirstInvalidField(container?: HTMLElement): boolean {
		const fieldStates = this.scanFieldValidation(container);
		
		for (const [fieldId, state] of fieldStates) {
			if (!state.isValid) {
				return this.focusField(fieldId);
			}
		}
		
		return false;
	}

	// Batch operations
	focusFieldsInSequence(fieldIds: string[], delay: number = 100): Promise<boolean[]> {
		return new Promise((resolve) => {
			const results: boolean[] = [];
			let index = 0;

			const focusNext = () => {
				if (index < fieldIds.length) {
					const result = this.focusField(fieldIds[index]);
					results.push(result);
					index++;
					setTimeout(focusNext, delay);
				} else {
					resolve(results);
				}
			};

			focusNext();
		});
	}

	scrollToFieldsInSequence(fieldIds: string[], delay: number = 500): Promise<boolean[]> {
		return new Promise((resolve) => {
			const results: boolean[] = [];
			let index = 0;

			const scrollNext = () => {
				if (index < fieldIds.length) {
					const result = this.scrollToField(fieldIds[index]);
					results.push(result);
					index++;
					setTimeout(scrollNext, delay);
				} else {
					resolve(results);
				}
			};

			scrollNext();
		});
	}

	// Utility methods
	getAllFields(): string[] {
		return Array.from(this.fields.keys());
	}

	isFieldRegistered(fieldId: string): boolean {
		return this.fields.has(fieldId);
	}

	getRegisteredFieldCount(): number {
		return this.fields.size;
	}

	clearAllFields(): void {
		this.fields.clear();
	}

	// Get validation statistics
	getValidationStats(container?: HTMLElement): {
		totalFields: number;
		validFields: number;
		invalidFields: number;
		validationSources: { [source: string]: number };
	} {
		const fieldStates = this.scanFieldValidation(container);
		const stats = {
			totalFields: fieldStates.size,
			validFields: 0,
			invalidFields: 0,
			validationSources: {} as { [source: string]: number }
		};

		fieldStates.forEach((state) => {
			if (state.isValid) {
				stats.validFields++;
			} else {
				stats.invalidFields++;
			}

			// Count validation sources
			stats.validationSources[state.source] = 
				(stats.validationSources[state.source] || 0) + 1;
		});

		return stats;
	}
}

// Export singleton instance
export const focusController = FocusController.getInstance();
