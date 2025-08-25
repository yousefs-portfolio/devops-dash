import {useEffect, useRef, useState, useCallback} from 'react';
import {useInView} from 'react-intersection-observer';

// Spring physics animation
interface SpringConfig {
    tension?: number;
    friction?: number;
    mass?: number;
    velocity?: number;
}

export const useSpring = (
    value: number,
    config: SpringConfig = {}
) => {
    const {
        tension = 170,
        friction = 26,
        mass = 1,
        velocity = 0
    } = config;

    const [springValue, setSpringValue] = useState(value);
    const rafRef = useRef<number>();
    const currentRef = useRef(value);
    const velocityRef = useRef(velocity);

    useEffect(() => {
        const animate = () => {
            const distance = value - currentRef.current;
            const springForce = distance * tension;
            const dampingForce = -velocityRef.current * friction;
            const acceleration = (springForce + dampingForce) / mass;

            velocityRef.current += acceleration * (1 / 60);
            currentRef.current += velocityRef.current * (1 / 60);

            if (Math.abs(distance) < 0.001 && Math.abs(velocityRef.current) < 0.001) {
                currentRef.current = value;
                velocityRef.current = 0;
                setSpringValue(value);
            } else {
                setSpringValue(currentRef.current);
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [value, tension, friction, mass]);

    return springValue;
};

// Scroll-triggered animations
export const useScrollAnimation = (
    threshold = 0.1,
    triggerOnce = false
) => {
    const [hasAnimated, setHasAnimated] = useState(false);
    const {ref, inView} = useInView({
        threshold,
        triggerOnce
    });

    const isVisible = inView && (!triggerOnce || !hasAnimated);

    useEffect(() => {
        if (inView && !hasAnimated) {
            setHasAnimated(true);
        }
    }, [inView, hasAnimated]);

    return {ref, isVisible};
};

// Parallax effect hook
export const useParallax = (speed = 0.5) => {
    const [offset, setOffset] = useState(0);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!elementRef.current) return;

            const rect = elementRef.current.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const windowCenter = window.innerHeight / 2;
            const distance = centerY - windowCenter;

            setOffset(distance * speed);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, {passive: true});

        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return {ref: elementRef, offset};
};

// Hover effects
export const useHoverEffect = (
    enabled = true
) => {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({x: 0, y: 0});
    const elementRef = useRef<HTMLElement>(null);

    const handleMouseEnter = useCallback(() => {
        if (enabled) setIsHovered(true);
    }, [enabled]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setPosition({x: 0, y: 0});
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!enabled || !elementRef.current) return;

        const rect = elementRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        setPosition({x, y});
    }, [enabled]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mousemove', handleMouseMove);

        return () => {
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
            element.removeEventListener('mousemove', handleMouseMove);
        };
    }, [handleMouseEnter, handleMouseLeave, handleMouseMove]);

    return {
        ref: elementRef,
        isHovered,
        position,
        transform: `perspective(1000px) rotateX(${position.y * 10}deg) rotateY(${position.x * 10}deg)`,
        scale: isHovered ? 1.05 : 1
    };
};

// Loading animations
export const useLoadingAnimation = (
    isLoading: boolean,
    delay = 0
) => {
    const [showLoading, setShowLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (isLoading) {
            timeoutRef.current = setTimeout(() => {
                setShowLoading(true);
            }, delay);
        } else {
            setShowLoading(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isLoading, delay]);

    return showLoading;
};

// Success/Error animations
export const useStatusAnimation = () => {
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
    const timeoutRef = useRef<NodeJS.Timeout>();

    const triggerSuccess = useCallback((duration = 2000) => {
        setStatus('success');
        timeoutRef.current = setTimeout(() => {
            setStatus('idle');
        }, duration);
    }, []);

    const triggerError = useCallback((duration = 3000) => {
        setStatus('error');
        timeoutRef.current = setTimeout(() => {
            setStatus('idle');
        }, duration);
    }, []);

    const triggerLoading = useCallback(() => {
        setStatus('loading');
    }, []);

    const reset = useCallback(() => {
        setStatus('idle');
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        status,
        triggerSuccess,
        triggerError,
        triggerLoading,
        reset,
        isSuccess: status === 'success',
        isError: status === 'error',
        isLoading: status === 'loading',
        isIdle: status === 'idle'
    };
};

// Stagger animation for lists
export const useStaggerAnimation = (
    items: any[],
    delay = 50
) => {
    const [visibleItems, setVisibleItems] = useState<number[]>([]);
    const {ref, inView} = useInView({threshold: 0.1, triggerOnce: true});

    useEffect(() => {
        if (!inView) return;

        const timeouts: NodeJS.Timeout[] = [];

        items.forEach((_, index) => {
            const timeout = setTimeout(() => {
                setVisibleItems(prev => [...prev, index]);
            }, index * delay);

            timeouts.push(timeout);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [items, delay, inView]);

    return {
        ref,
        isItemVisible: (index: number) => visibleItems.includes(index)
    };
};

// Typewriter effect
export const useTypewriter = (
    text: string,
    speed = 50,
    startDelay = 0
) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        let startTimeout: NodeJS.Timeout;

        const type = () => {
            setIsTyping(true);
            let index = 0;

            const typeChar = () => {
                if (index < text.length) {
                    setDisplayText(text.slice(0, index + 1));
                    index++;
                    timeout = setTimeout(typeChar, speed);
                } else {
                    setIsTyping(false);
                }
            };

            typeChar();
        };

        if (startDelay > 0) {
            startTimeout = setTimeout(type, startDelay);
        } else {
            type();
        }

        return () => {
            clearTimeout(timeout);
            clearTimeout(startTimeout);
        };
    }, [text, speed, startDelay]);

    return {displayText, isTyping};
};

// Count animation
export const useCountAnimation = (
    endValue: number,
    duration = 1000,
    startValue = 0
) => {
    const [count, setCount] = useState(startValue);
    const rafRef = useRef<number>();
    const startTimeRef = useRef<number>();

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;

            setCount(Math.round(currentValue));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [endValue, duration, startValue]);

    return count;
};

// Pulse animation
export const usePulse = (
    active = true,
    interval = 1000
) => {
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
        if (!active) {
            setIsPulsing(false);
            return;
        }

        const pulseInterval = setInterval(() => {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 200);
        }, interval);

        return () => clearInterval(pulseInterval);
    }, [active, interval]);

    return isPulsing;
};

// GPU-accelerated transitions
export const useGPUTransition = (
    property: 'opacity' | 'transform' | 'filter',
    duration = 300,
    easing = 'ease-out'
) => {
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!elementRef.current) return;

        const element = elementRef.current;
        element.style.willChange = property;
        element.style.transition = `${property} ${duration}ms ${easing}`;

        return () => {
            element.style.willChange = 'auto';
        };
    }, [property, duration, easing]);

    return elementRef;
};