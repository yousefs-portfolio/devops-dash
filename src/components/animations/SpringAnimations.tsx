import {motion, MotionProps, Variants} from 'framer-motion';
import React from 'react';

// Spring configurations
export const springConfigs = {
    gentle: {type: 'spring', stiffness: 100, damping: 15},
    bouncy: {type: 'spring', stiffness: 400, damping: 10},
    stiff: {type: 'spring', stiffness: 700, damping: 30},
    smooth: {type: 'spring', stiffness: 260, damping: 20},
    slow: {type: 'spring', stiffness: 50, damping: 20},
};

// GPU-accelerated transforms only
export const gpuOptimizedTransforms = {
    scale: true,
    rotate: true,
    x: true,
    y: true,
    z: true,
    opacity: true,
};

// Hover animations
export const hoverVariants: Variants = {
    initial: {scale: 1},
    hover: {
        scale: 1.05,
        transition: springConfigs.gentle,
    },
    tap: {
        scale: 0.95,
        transition: springConfigs.stiff,
    },
};

// Card flip animation
export const cardFlipVariants: Variants = {
    front: {
        rotateY: 0,
        transition: springConfigs.smooth,
    },
    back: {
        rotateY: 180,
        transition: springConfigs.smooth,
    },
};

// Stagger children animation
export const staggerContainerVariants: Variants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

export const staggerItemVariants: Variants = {
    hidden: {opacity: 0, y: 20},
    visible: {
        opacity: 1,
        y: 0,
        transition: springConfigs.gentle,
    },
};

// Pulse animation for live indicators
export const pulseVariants: Variants = {
    pulse: {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Slide in animations
export const slideInVariants: Variants = {
    hidden: {x: -100, opacity: 0},
    visible: {
        x: 0,
        opacity: 1,
        transition: springConfigs.smooth,
    },
    exit: {
        x: 100,
        opacity: 0,
        transition: springConfigs.smooth,
    },
};

// Metric update animation
export const metricUpdateVariants: Variants = {
    initial: {scale: 1, color: '#ffffff'},
    update: {
        scale: [1, 1.1, 1],
        color: ['#ffffff', '#00D4FF', '#ffffff'],
        transition: {
            duration: 0.6,
            ease: 'easeOut',
        },
    },
};

// Components with spring animations

interface AnimatedCardProps extends MotionProps {
    children: React.ReactNode;
    className?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({children, className, ...props}) => {
    return (
        <motion.div
            className={className}
            variants={hoverVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            style={{transformStyle: 'preserve-3d'}}
            {...props}
        >
            {children}
        </motion.div>
    );
};

interface AnimatedListProps {
    children: React.ReactNode;
    className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({children, className}) => {
    return (
        <motion.div
            className={className}
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
        >
            {React.Children.map(children, (child, index) => (
                <motion.div key={index} variants={staggerItemVariants}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
};

interface AnimatedMetricProps {
    value: number | string;
    label: string;
    className?: string;
}

export const AnimatedMetric: React.FC<AnimatedMetricProps> = ({value, label, className}) => {
    const [previousValue, setPreviousValue] = React.useState(value);

    React.useEffect(() => {
        if (value !== previousValue) {
            setPreviousValue(value);
        }
    }, [value, previousValue]);

    return (
        <motion.div
            className={className}
            animate={value !== previousValue ? 'update' : 'initial'}
            variants={metricUpdateVariants}
        >
            <motion.div
                key={value}
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 20}}
                transition={springConfigs.gentle}
            >
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-gray-400">{label}</div>
            </motion.div>
        </motion.div>
    );
};

// Haptic feedback patterns (for mobile)
export const hapticPatterns = {
    light: {duration: 10},
    medium: {duration: 20},
    heavy: {duration: 30},
    success: {pattern: [0, 10, 20, 30]},
    warning: {pattern: [0, 20, 40, 20]},
    error: {pattern: [0, 50, 100, 50]},
};

// Trigger haptic feedback (requires Vibration API)
export const triggerHaptic = (pattern: keyof typeof hapticPatterns) => {
    if ('vibrate' in navigator) {
        const config = hapticPatterns[pattern];
        if ('pattern' in config) {
            navigator.vibrate(config.pattern);
        } else {
            navigator.vibrate(config.duration);
        }
    }
};

// 60fps scroll animation hook
export const useScrollAnimation = (threshold = 0.1) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {threshold}
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    return {ref, isVisible};
};

// Smooth scroll with spring physics
export const smoothScrollTo = (element: string | HTMLElement, offset = 0) => {
    const target = typeof element === 'string' ? document.querySelector(element) : element;

    if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
        });
    }
};