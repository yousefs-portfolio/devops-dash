import React from 'react';
import {motion} from 'framer-motion';

// Since we'll use Framer Motion for now, we'll create similar animations
// These can be replaced with actual Lottie files later

interface AnimationProps {
    size?: number;
    color?: string;
}

export const LoadingSpinner: React.FC<AnimationProps> = ({size = 50, color = '#00D4FF'}) => {
    return (
        <motion.div
            style={{
                width: size,
                height: size,
                border: `3px solid ${color}20`,
                borderTop: `3px solid ${color}`,
                borderRadius: '50%',
            }}
            animate={{rotate: 360}}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
            }}
        />
    );
};

export const PulseLoader: React.FC<AnimationProps> = ({size = 40, color = '#8B5CF6'}) => {
    return (
        <div style={{display: 'flex', gap: '8px'}}>
            {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                    key={i}
                    style={{
                        width: size / 3,
                        height: size,
                        backgroundColor: color,
                        borderRadius: '4px',
                    }}
                    animate={{
                        scaleY: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

export const SuccessCheckmark: React.FC<AnimationProps> = ({size = 50, color = '#39FF14'}) => {
    return (
        <motion.svg width={size} height={size} viewBox="0 0 50 50">
            <motion.circle
                cx="25"
                cy="25"
                r="20"
                stroke={color}
                strokeWidth="3"
                fill="none"
                initial={{pathLength: 0}}
                animate={{pathLength: 1}}
                transition={{duration: 0.5, ease: 'easeOut'}}
            />
            <motion.path
                d="M15 25 L22 32 L35 18"
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{pathLength: 0}}
                animate={{pathLength: 1}}
                transition={{duration: 0.3, delay: 0.5, ease: 'easeOut'}}
            />
        </motion.svg>
    );
};

export const ErrorCross: React.FC<AnimationProps> = ({size = 50, color = '#FF0040'}) => {
    return (
        <motion.svg width={size} height={size} viewBox="0 0 50 50">
            <motion.circle
                cx="25"
                cy="25"
                r="20"
                stroke={color}
                strokeWidth="3"
                fill="none"
                initial={{pathLength: 0}}
                animate={{pathLength: 1}}
                transition={{duration: 0.5, ease: 'easeOut'}}
            />
            <motion.g
                initial={{scale: 0, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                transition={{duration: 0.3, delay: 0.5, ease: 'easeOut'}}
            >
                <path d="M18 18 L32 32" stroke={color} strokeWidth="3" strokeLinecap="round"/>
                <path d="M32 18 L18 32" stroke={color} strokeWidth="3" strokeLinecap="round"/>
            </motion.g>
        </motion.svg>
    );
};

export const DataSync: React.FC<AnimationProps> = ({size = 60, color = '#00D4FF'}) => {
    return (
        <div style={{position: 'relative', width: size, height: size}}>
            <motion.div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: `2px solid ${color}`,
                    borderRadius: '50%',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.5, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    top: '25%',
                    left: '25%',
                    width: '50%',
                    height: '50%',
                    backgroundColor: color,
                    borderRadius: '50%',
                }}
                animate={{
                    scale: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
};

export const NetworkActivity: React.FC<AnimationProps> = ({size = 80, color = '#8B5CF6'}) => {
    const nodes = [
        {x: 40, y: 20},
        {x: 20, y: 60},
        {x: 60, y: 60},
    ];

    return (
        <svg width={size} height={size} viewBox="0 0 80 80">
            {/* Connections */}
            <motion.path
                d="M40 20 L20 60 L60 60 Z"
                stroke={color}
                strokeWidth="1"
                fill="none"
                initial={{pathLength: 0}}
                animate={{pathLength: 1}}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            {/* Nodes */}
            {nodes.map((node, i) => (
                <motion.circle
                    key={i}
                    cx={node.x}
                    cy={node.y}
                    r="8"
                    fill={color}
                    initial={{scale: 0.5, opacity: 0}}
                    animate={{scale: [0.5, 1, 0.5], opacity: [0, 1, 0]}}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </svg>
    );
};

// Export all animations
export const LottieAnimations = {
    LoadingSpinner,
    PulseLoader,
    SuccessCheckmark,
    ErrorCross,
    DataSync,
    NetworkActivity,
};