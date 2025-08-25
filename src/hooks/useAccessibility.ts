import {useCallback, useEffect, useRef, useState} from 'react';

interface AccessibilityOptions {
    announceUpdates?: boolean;
    keyboardNavigation?: boolean;
    focusTrap?: boolean;
    skipLinks?: boolean;
    reducedMotion?: boolean;
    screenReaderMode?: boolean;
}

// Skip navigation links
export const SkipLinks = () => {
    return (
        <div className = "sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50 focus-within:p-2" >
        <a
            href = "#main-content"
    className = "bg-primary text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
        Skip
    to
    main
    content
    < /a>
    < a
    href = "#navigation"
    className = "bg-primary text-white px-4 py-2 rounded ml-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
        Skip
    to
    navigation
    < /a>
    < a
    href = "#search"
    className = "bg-primary text-white px-4 py-2 rounded ml-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
        Skip
    to
    search
    < /a>
    < /div>
)
    ;
};
};

// Live region for announcements
class AnnouncementManager {
    private liveRegion: HTMLElement | null = null;
    private queue: string[] = [];
    private isProcessing = false;

    constructor() {
        this.createLiveRegion();
    }

    private createLiveRegion() {
        if (typeof document === 'undefined') return;

        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'sr-only';
        this.liveRegion.id = 'aria-announcements';
        document.body.appendChild(this.liveRegion);
    }

    announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
        if (!this.liveRegion) this.createLiveRegion();

        this.queue.push(message);
        this.liveRegion?.setAttribute('aria-live', priority);

        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const message = this.queue.shift();

        if (message && this.liveRegion) {
            this.liveRegion.textContent = message;

            // Clear after announcement
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.liveRegion.textContent = '';

            // Process next
            await new Promise(resolve => setTimeout(resolve, 100));
            this.processQueue();
        }
    }

    destroy() {
        if (this.liveRegion) {
            document.body.removeChild(this.liveRegion);
            this.liveRegion = null;
        }
    }
}

const announcementManager = new AnnouncementManager();

// Accessibility hook
export const useAccessibility = (options: AccessibilityOptions = {}) => {
    const {
        announceUpdates = true,
        keyboardNavigation = true,
        focusTrap = false,
        skipLinks = true,
        reducedMotion = false,
        screenReaderMode = false
    } = options;

    const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Announce to screen readers
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (announceUpdates) {
            announcementManager.announce(message, priority);
        }
    }, [announceUpdates]);

    // Detect screen reader
    useEffect(() => {
        const detectScreenReader = () => {
            // Check for common screen reader indicators
            const indicators = [
                // NVDA
                window.navigator.userAgent.includes('NVDA'),
                // JAWS
                document.body.getAttribute('aria-hidden') === 'true',
                // VoiceOver
                window.navigator.userAgent.includes('VoiceOver'),
                // Check for aria-live regions being actively used
                document.querySelectorAll('[aria-live]').length > 0
            ];

            setIsScreenReaderActive(indicators.some(Boolean));
        };

        detectScreenReader();

        // Re-check periodically
        const interval = setInterval(detectScreenReader, 5000);
        return () => clearInterval(interval);
    }, []);

    // Detect reduced motion preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return {
        announce,
        isScreenReaderActive,
        prefersReducedMotion: prefersReducedMotion || reducedMotion,
        screenReaderMode: screenReaderMode || isScreenReaderActive
    };
};

// Focus management hook
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
    const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
    const currentFocusIndex = useRef(0);

    // Find all focusable elements
    useEffect(() => {
        if (!containerRef.current) return;

        const updateFocusableElements = () => {
            const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
            const elements = Array.from(containerRef.current?.querySelectorAll(selector) || []) as HTMLElement[];
            setFocusableElements(elements);
        };

        updateFocusableElements();

        // Use MutationObserver to track DOM changes
        const observer = new MutationObserver(updateFocusableElements);
        observer.observe(containerRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'tabindex']
        });

        return () => observer.disconnect();
    }, [containerRef]);

    // Focus first element
    const focusFirst = useCallback(() => {
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
            currentFocusIndex.current = 0;
        }
    }, [focusableElements]);

    // Focus last element
    const focusLast = useCallback(() => {
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
            currentFocusIndex.current = focusableElements.length - 1;
        }
    }, [focusableElements]);

    // Focus next element
    const focusNext = useCallback(() => {
        if (focusableElements.length === 0) return;

        currentFocusIndex.current = (currentFocusIndex.current + 1) % focusableElements.length;
        focusableElements[currentFocusIndex.current].focus();
    }, [focusableElements]);

    // Focus previous element
    const focusPrevious = useCallback(() => {
        if (focusableElements.length === 0) return;

        currentFocusIndex.current = currentFocusIndex.current === 0
            ? focusableElements.length - 1
            : currentFocusIndex.current - 1;
        focusableElements[currentFocusIndex.current].focus();
    }, [focusableElements]);

    // Trap focus within container
    const trapFocus = useCallback((e: KeyboardEvent) => {
        if (e.key !== 'Tab' || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }, [focusableElements]);

    return {
        focusableElements,
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        trapFocus
    };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (options: {
    onEscape?: () => void;
    onEnter?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
    onPageUp?: () => void;
    onPageDown?: () => void;
    enabled?: boolean;
} = {}) => {
    const {enabled = true} = options;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const handlers: Record<string, (() => void) | undefined> = {
                'Escape': options.onEscape,
                'Enter': options.onEnter,
                'ArrowUp': options.onArrowUp,
                'ArrowDown': options.onArrowDown,
                'ArrowLeft': options.onArrowLeft,
                'ArrowRight': options.onArrowRight,
                'Home': options.onHome,
                'End': options.onEnd,
                'PageUp': options.onPageUp,
                'PageDown': options.onPageDown,
            };

            const handler = handlers[e.key];
            if (handler) {
                e.preventDefault();
                handler();
            }

            // Global keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k': // Search
                        e.preventDefault();
                        document.getElementById('search')?.focus();
                        break;
                    case '/': // Help
                        e.preventDefault();
                        document.getElementById('help-button')?.click();
                        break;
                    case 'm': // Menu
                        e.preventDefault();
                        document.getElementById('menu-button')?.click();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, options]);
};

// ARIA helpers
export const ariaLabel = (label: string) => ({'aria-label': label});
export const ariaDescribedBy = (id: string) => ({'aria-describedby': id});
export const ariaLabelledBy = (id: string) => ({'aria-labelledby': id});
export const ariaExpanded = (expanded: boolean) => ({'aria-expanded': expanded});
export const ariaSelected = (selected: boolean) => ({'aria-selected': selected});
export const ariaChecked = (checked: boolean) => ({'aria-checked': checked});
export const ariaDisabled = (disabled: boolean) => ({'aria-disabled': disabled});
export const ariaHidden = (hidden: boolean) => ({'aria-hidden': hidden});
export const ariaLive = (type: 'polite' | 'assertive' | 'off' = 'polite') => ({'aria-live': type});
export const ariaRole = (role: string) => ({role});

// Voice control support (experimental)
export const useVoiceControl = (commands: Record<string, () => void>) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const WindowWithSpeech = window as Window & {
            SpeechRecognition?: typeof SpeechRecognition;
            webkitSpeechRecognition?: typeof SpeechRecognition;
        };

        const SpeechRecognitionClass = WindowWithSpeech.SpeechRecognition || WindowWithSpeech.webkitSpeechRecognition;
        if (!SpeechRecognitionClass) return;

        const recognition = new SpeechRecognitionClass();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();
            setTranscript(transcript);

            if (event.results[current].isFinal) {
                // Check for commands
                Object.entries(commands).forEach(([command, action]) => {
                    if (transcript.includes(command.toLowerCase())) {
                        action();
                    }
                });
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [commands]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        toggleListening
    };
};