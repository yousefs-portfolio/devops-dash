import React, {useMemo} from 'react';
import {motion} from 'framer-motion';
import {colors} from '../../styles/theme';

interface GaugeChartProps {
    value: number; // 0-100
    max?: number;
    min?: number;
    label?: string;
    unit?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'success' | 'warning' | 'critical' | 'info';
    showValue?: boolean;
    showTicks?: boolean;
    animate?: boolean;
    thresholds?: {
        critical?: number;
        warning?: number;
    };
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
                                                          value,
                                                          max = 100,
                                                          min = 0,
                                                          label,
                                                          unit = '%',
                                                          size = 'md',
                                                          color,
                                                          showValue = true,
                                                          showTicks = true,
                                                          animate = true,
                                                          thresholds,
                                                      }) => {
    const dimensions = {
        sm: {width: 120, height: 120, strokeWidth: 8},
        md: {width: 160, height: 160, strokeWidth: 10},
        lg: {width: 200, height: 200, strokeWidth: 12},
        xl: {width: 240, height: 240, strokeWidth: 14},
    };

    const {width, height, strokeWidth} = dimensions[size];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = (Math.min(width, height) - strokeWidth * 2) / 2;

    // Gauge starts at -135° and ends at 135° (270° total)
    const startAngle = -135;
    const endAngle = 135;
    const totalAngle = endAngle - startAngle;

    // Normalize value to 0-100 range
    const normalizedValue = ((value - min) / (max - min)) * 100;
    const clampedValue = Math.max(0, Math.min(100, normalizedValue));

    // Calculate the angle for the current value
    const valueAngle = startAngle + (clampedValue / 100) * totalAngle;

    // Determine color based on thresholds or prop
    const getColor = () => {
        if (color) {
            return colors.accent[color];
        }
        if (thresholds) {
            if (thresholds.critical && clampedValue >= thresholds.critical) {
                return colors.accent.critical;
            }
            if (thresholds.warning && clampedValue >= thresholds.warning) {
                return colors.accent.warning;
            }
        }
        return colors.accent.success;
    };

    const gaugeColor = getColor();

    // Convert polar coordinates to cartesian
    const polarToCartesian = (angle: number) => {
        const angleInRadians = ((angle - 90) * Math.PI) / 180;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    };

    // Create the arc path
    const createArcPath = (start: number, end: number) => {
        const startPoint = polarToCartesian(start);
        const endPoint = polarToCartesian(end);
        const largeArcFlag = end - start <= 180 ? 0 : 1;

        return [
            'M',
            startPoint.x,
            startPoint.y,
            'A',
            radius,
            radius,
            0,
            largeArcFlag,
            1,
            endPoint.x,
            endPoint.y,
        ].join(' ');
    };

    // Background arc path
    const backgroundPath = createArcPath(startAngle, endAngle);

    // Value arc path
    const valuePath = createArcPath(startAngle, valueAngle);

    // Create tick marks
    const ticks = useMemo(() => {
        if (!showTicks) return [];

        const tickCount = 11; // 0, 10, 20, ..., 100
        const tickLength = 8;
        const tickAngles = [];

        for (let i = 0; i < tickCount; i++) {
            const angle = startAngle + (i / (tickCount - 1)) * totalAngle;
            const innerPoint = polarToCartesian(angle);
            const outerRadius = radius - tickLength;
            const angleInRadians = ((angle - 90) * Math.PI) / 180;
            const outerPoint = {
                x: centerX + outerRadius * Math.cos(angleInRadians),
                y: centerY + outerRadius * Math.sin(angleInRadians),
            };

            tickAngles.push({
                x1: innerPoint.x,
                y1: innerPoint.y,
                x2: outerPoint.x,
                y2: outerPoint.y,
                value: Math.round((i / (tickCount - 1)) * 100),
            });
        }

        return tickAngles;
    }, [showTicks, startAngle, radius, centerX, centerY, totalAngle]);

    // Needle position
    const needleLength = radius - 10;
    const needleAngleInRadians = ((valueAngle - 90) * Math.PI) / 180;
    const needleEnd = {
        x: centerX + needleLength * Math.cos(needleAngleInRadians),
        y: centerY + needleLength * Math.sin(needleAngleInRadians),
    };

    return (
        <div className="flex flex-col items-center">
            <svg width={width} height={height} className="overflow-visible">
                {/* Background arc */}
                <path
                    d={backgroundPath}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`gauge-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gaugeColor} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={gaugeColor} stopOpacity={1}/>
                    </linearGradient>
                </defs>

                {/* Value arc */}
                <motion.path
                    d={valuePath}
                    fill="none"
                    stroke={`url(#gauge-gradient-${label})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={animate ? {pathLength: 0} : {pathLength: 1}}
                    animate={{pathLength: 1}}
                    transition={{duration: 1.5, ease: 'easeOut'}}
                />

                {/* Tick marks */}
                {ticks.map((tick, index) => (
                    <line
                        key={index}
                        x1={tick.x1}
                        y1={tick.y1}
                        x2={tick.x2}
                        y2={tick.y2}
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth={1}
                    />
                ))}

                {/* Needle */}
                <motion.line
                    x1={centerX}
                    y1={centerY}
                    x2={needleEnd.x}
                    y2={needleEnd.y}
                    stroke={gaugeColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    initial={animate ? {rotate: startAngle} : {rotate: valueAngle}}
                    animate={{rotate: valueAngle}}
                    transition={{duration: 1.5, ease: 'easeOut'}}
                    style={{transformOrigin: `${centerX}px ${centerY}px`}}
                />

                {/* Center circle */}
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={4}
                    fill={gaugeColor}
                />

                {/* Value text */}
                {showValue && (
                    <text
                        x={centerX}
                        y={centerY + radius / 3}
                        textAnchor="middle"
                        className="fill-white"
                        style={{
                            fontSize: size === 'sm' ? '18px' : size === 'md' ? '24px' : size === 'lg' ? '28px' : '32px',
                            fontWeight: 'bold',
                            fontFamily: 'JetBrains Mono, monospace',
                        }}
                    >
                        {Math.round(value)}
                        <tspan
                            style={{
                                fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : size === 'lg' ? '16px' : '18px',
                                fill: 'rgba(255, 255, 255, 0.7)',
                            }}
                        >
                            {unit}
                        </tspan>
                    </text>
                )}
            </svg>

            {/* Label */}
            {label && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.5}}
                    className="mt-2 text-center"
                >
                    <span className="text-sm text-gray-400">{label}</span>
                </motion.div>
            )}
        </div>
    );
};