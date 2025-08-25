import {useState, useEffect, useCallback, useRef} from 'react';

interface TouchGesture {
    type: 'swipe' | 'pinch' | 'tap' | 'long-press';
    direction?: 'left' | 'right' | 'up' | 'down';
    scale?: number;
    distance?: number;
}

interface PWAInstallPrompt {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Mobile detection and features
export const useMobileDetection = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [screenOrientation, setScreenOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const userAgent = navigator.userAgent.toLowerCase();

            // Check if touch device
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsTouchDevice(hasTouch);

            // Check screen size
            const mobile = width < 768;
            const tablet = width >= 768 && width < 1024;

            setIsMobile(mobile);
            setIsTablet(tablet);

            // Determine device type
            if (mobile || /mobile|android|iphone/i.test(userAgent)) {
                setDeviceType('mobile');
            } else if (tablet || /ipad|tablet/i.test(userAgent)) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }

            // Check orientation
            setScreenOrientation(width > height ? 'landscape' : 'portrait');
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        window.addEventListener('orientationchange', checkDevice);

        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('orientationchange', checkDevice);
        };
    }, []);

    return {
        isMobile,
        isTablet,
        isTouchDevice,
        screenOrientation,
        deviceType,
        isSmallScreen: isMobile,
        isMediumScreen: isTablet,
        isLargeScreen: !isMobile && !isTablet
    };
};

// Touch gestures hook
export const useTouchGestures = (
    elementRef: React.RefObject<HTMLElement>,
    handlers: {
        onSwipeLeft?: () => void;
        onSwipeRight?: () => void;
        onSwipeUp?: () => void;
        onSwipeDown?: () => void;
        onPinchIn?: (scale: number) => void;
        onPinchOut?: (scale: number) => void;
        onTap?: () => void;
        onDoubleTap?: () => void;
        onLongPress?: () => void;
    }
) => {
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const lastTapRef = useRef<number>(0);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialPinchDistance = useRef<number | null>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                touchStartRef.current = {
                    x: touch.clientX,
                    y: touch.clientY,
                    time: Date.now()
                };

                // Start long press timer
                if (handlers.onLongPress) {
                    longPressTimerRef.current = setTimeout(() => {
                        handlers.onLongPress?.();
                    }, 500);
                }
            } else if (e.touches.length === 2) {
                // Handle pinch start
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                initialPinchDistance.current = distance;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            // Cancel long press on move
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }

            if (e.touches.length === 2 && initialPinchDistance.current) {
                // Handle pinch
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                const scale = distance / initialPinchDistance.current;

                if (scale > 1.1 && handlers.onPinchOut) {
                    handlers.onPinchOut(scale);
                } else if (scale < 0.9 && handlers.onPinchIn) {
                    handlers.onPinchIn(scale);
                }
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            // Cancel long press
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }

            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            touchEndRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };

            const deltaX = touchEndRef.current.x - touchStartRef.current.x;
            const deltaY = touchEndRef.current.y - touchStartRef.current.y;
            const deltaTime = touchEndRef.current.time - touchStartRef.current.time;
            const distance = Math.hypot(deltaX, deltaY);

            // Detect tap
            if (distance < 10 && deltaTime < 200) {
                const now = Date.now();

                // Check for double tap
                if (now - lastTapRef.current < 300 && handlers.onDoubleTap) {
                    handlers.onDoubleTap();
                    lastTapRef.current = 0;
                } else {
                    handlers.onTap?.();
                    lastTapRef.current = now;
                }
            }

            // Detect swipe
            else if (distance > 50 && deltaTime < 500) {
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);

                if (absX > absY) {
                    // Horizontal swipe
                    if (deltaX > 0 && handlers.onSwipeRight) {
                        handlers.onSwipeRight();
                    } else if (deltaX < 0 && handlers.onSwipeLeft) {
                        handlers.onSwipeLeft();
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0 && handlers.onSwipeDown) {
                        handlers.onSwipeDown();
                    } else if (deltaY < 0 && handlers.onSwipeUp) {
                        handlers.onSwipeUp();
                    }
                }
            }

            // Reset
            touchStartRef.current = null;
            initialPinchDistance.current = null;
        };

        element.addEventListener('touchstart', handleTouchStart, {passive: true});
        element.addEventListener('touchmove', handleTouchMove, {passive: true});
        element.addEventListener('touchend', handleTouchEnd, {passive: true});

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);

            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, [elementRef, handlers]);
};

// PWA installation hook
export const usePWA = () => {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

    useEffect(() => {
        // Check if already installed
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isInstalled = (navigator as any).standalone || isStandalone;
            setIsInstalled(isInstalled);
        };

        checkInstalled();

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as any);
            setIsInstallable(true);
        };

        // Listen for successful installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setInstallPrompt(null);
        };

        // Network status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setIsUpdateAvailable(true);
                            }
                        });
                    }
                });
            });
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const install = useCallback(async () => {
        if (!installPrompt) return false;

        try {
            await installPrompt.prompt();
            const {outcome} = await installPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
                setIsInstallable(false);
                setInstallPrompt(null);
                return true;
            }

            return false;
        } catch (error) {
            console.error('PWA installation failed:', error);
            return false;
        }
    }, [installPrompt]);

    const updateApp = useCallback(() => {
        if (isUpdateAvailable && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
                // Optionally reload the page
                window.location.reload();
            });
        }
    }, [isUpdateAvailable]);

    return {
        isInstallable,
        isInstalled,
        isOnline,
        isUpdateAvailable,
        install,
        updateApp
    };
};

// Mobile navigation drawer hook
export const useMobileDrawer = (initialOpen = false) => {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [isAnimating, setIsAnimating] = useState(false);
    const drawerRef = useRef<HTMLElement>(null);

    const open = useCallback(() => {
        setIsAnimating(true);
        setIsOpen(true);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        setTimeout(() => setIsAnimating(false), 300);
    }, []);

    const close = useCallback(() => {
        setIsAnimating(true);
        setIsOpen(false);

        // Restore body scroll
        document.body.style.overflow = '';

        setTimeout(() => setIsAnimating(false), 300);
    }, []);

    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }, [isOpen, open, close]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, close]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                close();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, close]);

    // Handle swipe gestures
    useTouchGestures(drawerRef, {
        onSwipeLeft: close,
        onSwipeRight: open
    });

    return {
        isOpen,
        isAnimating,
        open,
        close,
        toggle,
        drawerRef
    };
};

// Responsive breakpoints hook
export const useResponsive = () => {
    const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

    useEffect(() => {
        const getBreakpoint = () => {
            const width = window.innerWidth;

            if (width < 640) return 'xs';
            if (width < 768) return 'sm';
            if (width < 1024) return 'md';
            if (width < 1280) return 'lg';
            if (width < 1536) return 'xl';
            return '2xl';
        };

        const handleResize = () => {
            setBreakpoint(getBreakpoint());
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        breakpoint,
        isXs: breakpoint === 'xs',
        isSm: breakpoint === 'sm',
        isMd: breakpoint === 'md',
        isLg: breakpoint === 'lg',
        isXl: breakpoint === 'xl',
        is2xl: breakpoint === '2xl',
        isMobile: ['xs', 'sm'].includes(breakpoint),
        isTablet: breakpoint === 'md',
        isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
        isBelow: (bp: typeof breakpoint) => {
            const order = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
            return order.indexOf(breakpoint) < order.indexOf(bp);
        },
        isAbove: (bp: typeof breakpoint) => {
            const order = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
            return order.indexOf(breakpoint) > order.indexOf(bp);
        }
    };
};