import React, {useMemo} from 'react';
import {motion} from 'framer-motion';
import {colors} from '../../styles/theme';

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: 'success' | 'warning' | 'critical' | 'info';
    showArea?: boolean;
    showDots?: boolean;
    animate?: boolean;
    strokeWidth?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
                                                        data,
                                                        width = 100,
                                                        height = 30,
                                                        color = 'info',
                                                        showArea = false,
                                                        showDots = false,
                                                        animate = true,
                                                        strokeWidth = 2,
                                                    }) => {
    const lineColor = colors.accent[color];

    const {path, areaPath, dots} = useMemo(() => {
        if (data.length < 2) {
            return {path: '', areaPath: '', dots: []};
        }

        const padding = 2;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Find min and max values for scaling
        const minValue = Math.min(...data);
        const maxValue = Math.max(...data);
        const valueRange = maxValue - minValue || 1;

        // Calculate points
        const points = data.map((value, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
            return {x, y, value};
        });

        // Create smooth curve path using bezier curves
        const createPath = (points: { x: number; y: number }[]) => {
            let path = `M ${points[0].x} ${points[0].y}`;

            // Create smooth curve using quadratic bezier
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                const cpx = (prev.x + curr.x) / 2;
                const cpy = (prev.y + curr.y) / 2;

                if (i === 1) {
                    path += ` Q ${cpx} ${prev.y} ${cpx} ${cpy}`;
                } else if (i === points.length - 1) {
                    path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
                } else {
                    path += ` Q ${cpx} ${cpy} ${cpx} ${cpy}`;
                }
            }

            return path;
        };

        const linePath = createPath(points);

        // Create area path
        let areaPath = '';
        if (showArea) {
            areaPath = linePath + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
        }

        return {
            path: linePath,
            areaPath,
            dots: showDots ? points : [],
        };
    }, [data, width, height, showArea, showDots]);

    // Calculate trend indicator
    const trend = useMemo(() => {
        if (data.length < 2) return 'neutral';
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.05) return 'up';
        if (secondAvg < firstAvg * 0.95) return 'down';
        return 'neutral';
    }, [data]);

    return (
        <div className="relative inline-block">
            <svg
                width={width}
                height={height}
                className="overflow-visible"
                style={{display: 'block'}}
            >
                {/* Gradient definitions */}
                <defs>
                    <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={lineColor} stopOpacity={0.3}/>
                        <stop offset="100%" stopColor={lineColor} stopOpacity={0.05}/>
                    </linearGradient>
                </defs>

                {/* Area */}
                {showArea && areaPath && (
                    <motion.path
                        d={areaPath}
                        fill={`url(#sparkline-gradient-${color})`}
                        initial={animate ? {opacity: 0} : {opacity: 1}}
                        animate={{opacity: 1}}
                        transition={{duration: 0.5}}
                    />
                )}

                {/* Line */}
                <motion.path
                    d={path}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={animate ? {pathLength: 0, opacity: 0} : {pathLength: 1, opacity: 1}}
                    animate={{pathLength: 1, opacity: 1}}
                    transition={{
                        pathLength: {duration: 1, ease: 'easeOut'},
                        opacity: {duration: 0.3}
                    }}
                />

                {/* Dots */}
                {dots.map((dot, index) => (
                    <motion.circle
                        key={index}
                        cx={dot.x}
                        cy={dot.y}
                        r={2}
                        fill={lineColor}
                        initial={animate ? {scale: 0, opacity: 0} : {scale: 1, opacity: 1}}
                        animate={{scale: 1, opacity: 1}}
                        transition={{
                            delay: animate ? 0.5 + index * 0.05 : 0,
                            duration: 0.3,
                            ease: 'easeOut'
                        }}
                    />
                ))}

                {/* Last value highlight */}
                {data.length > 0 && (
                    <motion.circle
                        cx={width - 2}
                        cy={height - 2 - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 4)}
                        r={3}
                        fill={lineColor}
                        initial={animate ? {scale: 0} : {scale: 1}}
                        animate={{scale: [1, 1.5, 1]}}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: 'easeInOut'
                        }}
                    />
                )}
            </svg>

            {/* Trend indicator */}
            {trend !== 'neutral' && (
                <motion.div
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{delay: 0.5}}
                    className="absolute -top-1 -right-1"
                >
                    <svg width="12" height="12">
                        {trend === 'up' ? (
                            <path
                                d="M 6 2 L 10 8 L 2 8 Z"
                                fill={colors.accent.success}
                                opacity={0.8}
                            />
                        ) : (
                            <path
                                d="M 6 10 L 10 4 L 2 4 Z"
                                fill={colors.accent.critical}
                                opacity={0.8}
                            />
                        )}
                    </svg>
                </motion.div>
            )}
        </div>
    );
};