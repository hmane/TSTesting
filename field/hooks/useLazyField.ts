import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyFieldOptions {
	lazy: boolean;
	threshold?: number;
	rootMargin?: string;
	onLoad?: () => void;
}

interface UseLazyFieldReturn {
	isVisible: boolean;
	isManuallyLoaded: boolean;
	manualLoad: () => void;
	fieldRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for lazy loading field content using Intersection Observer
 * Loads content when field comes into viewport or manually triggered
 */
export const useLazyField = ({
	lazy,
	threshold = 0.1,
	rootMargin = '50px',
	onLoad,
}: UseLazyFieldOptions): UseLazyFieldReturn => {
	const [isVisible, setIsVisible] = useState(!lazy);
	const [isManuallyLoaded, setIsManuallyLoaded] = useState(false);
	const fieldRef = useRef<HTMLDivElement>(null);

	// Manual load function
	const manualLoad = useCallback(() => {
		if (!isVisible && !isManuallyLoaded) {
			setIsVisible(true);
			setIsManuallyLoaded(true);
			onLoad?.();
		}
	}, [isVisible, isManuallyLoaded, onLoad]);

	// Intersection Observer effect
	useEffect(() => {
		if (!lazy || isManuallyLoaded || isVisible) {
			return;
		}

		const currentRef = fieldRef.current;
		if (!currentRef) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					onLoad?.();
					observer.disconnect(); // Load once, never unload for performance
				}
			},
			{
				threshold,
				rootMargin,
			}
		);

		observer.observe(currentRef);

		return () => {
			observer.disconnect();
		};
	}, [lazy, threshold, rootMargin, isManuallyLoaded, isVisible, onLoad]);

	return {
		isVisible: isVisible || isManuallyLoaded,
		isManuallyLoaded,
		manualLoad,
		fieldRef,
	};
};
