import React, {memo, useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {TrendingUp, TrendingDown, AlertTriangle, Info, Check} from 'lucide-react';
import {useCountAnimation, useScrollAnimation} from '../hooks/useAnimations';

interface MetricChange {
    value: number;
    previousValue: number;
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
    isGood: boolean;
}

interface AnomalyData {
    timestamp: Date;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PredictionData {
    timestamp: Date;
    predictedValue: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
}

// Animated metric transition component
export const AnimatedMetricCard = memo(({
                                            title,
                                            value,
                                            previousValue,
                                            unit = '',
                                            format = 'number',
                                            goodDirection = 'up'
                                        }: {
    title: string;
    value: number;
    previousValue: number;
    unit?: string;
    format?: 'number' | 'percentage' | 'bytes' | 'time';
    goodDirection?: 'up' | 'down';
}) => {
    const animatedValue = useCountAnimation(value, 1000, previousValue);
    const percentageChange = ((value - previousValue) / previousValue) * 100;
    const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable';
    const isPositive = goodDirection === 'up' ? trend === 'up' : trend === 'down';

    const formatValue = (val: number) => {
        switch (format) {
            case 'percentage':
                return `${val.toFixed(1)}%`;
            case 'bytes':
                const units = ['B', 'KB', 'MB', 'GB', 'TB'];
                let unitIndex = 0;
                let formattedVal = val;
                while (formattedVal >= 1024 && unitIndex < units.length - 1) {
                    formattedVal /= 1024;
                    unitIndex++;
                }
                return `${formattedVal.toFixed(2)} ${units[unitIndex]}`;
            case 'time':
                if (val < 1000) return `${val}ms`;
                if (val < 60000) return `${(val / 1000).toFixed(1)}s`;
                return `${(val / 60000).toFixed(1)}m`;
            default:
                return val.toLocaleString();
        }
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5}}
            className="bg-surface rounded-lg p-6 border border-border"
        >
            <h3 className="text-sm font-medium text-textSecondary mb-2">{title}</h3>

            <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text">
            {formatValue(animatedValue)}
          </span>
                    {unit && <span className="text-lg text-textSecondary">{unit}</span>}
                </div>

                {trend !== 'stable' && (
                    <motion.div
                        initial={{scale: 0}}
                        animate={{scale: 1}}
                        transition={{delay: 0.5, type: 'spring'}}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                            isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                        {trend === 'up' ? (
                            <TrendingUp className="w-4 h-4"/>
                        ) : (
                            <TrendingDown className="w-4 h-4"/>
                        )}
                        <span className="text-sm font-medium">
              {Math.abs(percentageChange).toFixed(1)}%
            </span>
                    </motion.div>
                )}
            </div>

            <div className="mt-4 h-1 bg-border rounded-full overflow-hidden">
                <motion.div
                    initial={{width: 0}}
                    animate={{width: `${(animatedValue / Math.max(value, previousValue)) * 100}%`}}
                    transition={{duration: 1, ease: 'easeOut'}}
                    className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                />
            </div>
        </motion.div>
    );
});

// Comparison visualization
export const ComparisonVisualization = memo(({
                                                 items,
                                                 metric,
                                                 title
                                             }: {
    items: Array<{ name: string; value: number; color?: string }>;
    metric: string;
    title: string;
}) => {
    const {ref, isVisible} = useScrollAnimation();
    const maxValue = Math.max(...items.map(item => item.value));

    return (
        <div ref={ref} className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-text mb-4">{title}</h3>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={item.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-textSecondary">{item.name}</span>
                            <span className="text-sm font-bold text-text">{item.value.toLocaleString()} {metric}</span>
                        </div>

                        <div className="h-8 bg-border/50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{width: 0}}
                                animate={isVisible ? {width: `${(item.value / maxValue) * 100}%`} : {}}
                                transition={{duration: 1, delay: index * 0.1, ease: 'easeOut'}}
                                className="h-full rounded-full relative"
                                style={{backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)`}}
                            >
                                <motion.div
                                    initial={{opacity: 0}}
                                    animate={{opacity: [0, 1, 0]}}
                                    transition={{duration: 2, repeat: Infinity, delay: index * 0.1}}
                                    className="absolute inset-0 bg-white/20 rounded-full"
                                />
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// Trend highlighting
export const TrendHighlight = memo(({
                                        data,
                                        threshold,
                                        title
                                    }: {
    data: Array<{ timestamp: Date; value: number }>;
    threshold: number;
    title: string;
}) => {
    const trendDirection = data.length >= 2
        ? data[data.length - 1].value > data[0].value ? 'up' : 'down'
        : 'stable';

    const exceedsThreshold = data.some(d => d.value > threshold);

    return (
        <motion.div
            initial={{opacity: 0, scale: 0.95}}
            whileInView={{opacity: 1, scale: 1}}
            viewport={{once: true}}
            className={`bg-surface rounded-lg p-6 border-2 ${
                exceedsThreshold ? 'border-warning' : 'border-border'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">{title}</h3>
                {exceedsThreshold && (
                    <motion.div
                        animate={{scale: [1, 1.2, 1]}}
                        transition={{duration: 2, repeat: Infinity}}
                        className="flex items-center gap-2 text-warning"
                    >
                        <AlertTriangle className="w-5 h-5"/>
                        <span className="text-sm font-medium">Above threshold</span>
                    </motion.div>
                )}
            </div>

            <div className="relative h-32">
                <svg className="w-full h-full">
                    <defs>
                        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={trendDirection === 'up' ? '#10b981' : '#ef4444'}
                                  stopOpacity="0.8"/>
                            <stop offset="100%" stopColor={trendDirection === 'up' ? '#10b981' : '#ef4444'}
                                  stopOpacity="0"/>
                        </linearGradient>
                    </defs>

                    <motion.path
                        initial={{pathLength: 0}}
                        animate={{pathLength: 1}}
                        transition={{duration: 2, ease: 'easeInOut'}}
                        d={`M ${data.map((d, i) => `${(i / (data.length - 1)) * 100}%,${100 - (d.value / Math.max(...data.map(p => p.value))) * 100}%`).join(' L ')}`}
                        stroke={trendDirection === 'up' ? '#10b981' : '#ef4444'}
                        strokeWidth="2"
                        fill="none"
                    />

                    <motion.path
                        initial={{opacity: 0}}
                        animate={{opacity: 0.3}}
                        transition={{delay: 0.5}}
                        d={`M ${data.map((d, i) => `${(i / (data.length - 1)) * 100}%,${100 - (d.value / Math.max(...data.map(p => p.value))) * 100}%`).join(' L ')} L 100%,100% L 0%,100% Z`}
                        fill="url(#trendGradient)"
                    />

                    {/* Threshold line */}
                    <motion.line
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 1}}
                        x1="0%"
                        y1={`${100 - (threshold / Math.max(...data.map(d => d.value))) * 100}%`}
                        x2="100%"
                        y2={`${100 - (threshold / Math.max(...data.map(d => d.value))) * 100}%`}
                        stroke="#fbbf24"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                </svg>
            </div>
        </motion.div>
    );
});

// Anomaly detection UI
export const AnomalyDetection = memo(({
                                          anomalies,
                                          title
                                      }: {
    anomalies: AnomalyData[];
    title: string;
}) => {
    const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyData | null>(null);

    const severityColors = {
        low: 'text-blue-400 bg-blue-500/20',
        medium: 'text-yellow-400 bg-yellow-500/20',
        high: 'text-orange-400 bg-orange-500/20',
        critical: 'text-red-400 bg-red-500/20'
    };

    return (
        <div className="bg-surface rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">{title}</h3>
                <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-sm font-medium">
          {anomalies.length} anomalies detected
        </span>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {anomalies.map((anomaly, index) => (
                        <motion.div
                            key={anomaly.timestamp.getTime()}
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: 20}}
                            transition={{delay: index * 0.05}}
                            onClick={() => setSelectedAnomaly(anomaly)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                selectedAnomaly === anomaly
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[anomaly.severity]}`}>
                                        {anomaly.severity.toUpperCase()}
                                    </div>
                                    <span className="text-sm text-textSecondary">
                    {anomaly.timestamp.toLocaleTimeString()}
                  </span>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-medium text-text">
                                        {anomaly.value.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-textSecondary">
                                        Expected: {anomaly.expectedValue.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {selectedAnomaly === anomaly && (
                                <motion.div
                                    initial={{height: 0}}
                                    animate={{height: 'auto'}}
                                    className="mt-3 pt-3 border-t border-border"
                                >
                                    <p className="text-sm text-textSecondary">
                                        Deviation: <span
                                        className="font-medium text-warning">{anomaly.deviation.toFixed(1)}%</span> from
                                        expected value
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
});

// Predictive visualization
export const PredictiveVisualization = memo(({
                                                 predictions,
                                                 actual,
                                                 title
                                             }: {
    predictions: PredictionData[];
    actual: Array<{ timestamp: Date; value: number }>;
    title: string;
}) => {
    const {ref, isVisible} = useScrollAnimation();

    return (
        <div ref={ref} className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-text mb-4">{title}</h3>

            <div className="relative h-48">
                <svg className="w-full h-full">
                    <defs>
                        <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                        </linearGradient>
                    </defs>

                    {/* Confidence interval */}
                    {isVisible && (
                        <motion.path
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{duration: 1}}
                            d={`M ${predictions.map((p, i) => `${(i / (predictions.length - 1)) * 100}%,${100 - (p.upperBound / Math.max(...predictions.map(pred => pred.upperBound))) * 100}%`).join(' L ')} 
                  L ${predictions.map((p, i) => `${((predictions.length - 1 - i) / (predictions.length - 1)) * 100}%,${100 - (predictions[predictions.length - 1 - i].lowerBound / Math.max(...predictions.map(pred => pred.upperBound))) * 100}%`).join(' L ')} Z`}
                            fill="url(#confidenceGradient)"
                        />
                    )}

                    {/* Actual values */}
                    <motion.path
                        initial={{pathLength: 0}}
                        animate={isVisible ? {pathLength: 1} : {}}
                        transition={{duration: 1.5}}
                        d={`M ${actual.map((a, i) => `${(i / (actual.length - 1)) * 50}%,${100 - (a.value / Math.max(...actual.map(v => v.value), ...predictions.map(p => p.upperBound))) * 100}%`).join(' L ')}`}
                        stroke="#00d4ff"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* Predicted values */}
                    <motion.path
                        initial={{pathLength: 0}}
                        animate={isVisible ? {pathLength: 1} : {}}
                        transition={{duration: 1.5, delay: 0.5}}
                        d={`M 50%,${100 - (actual[actual.length - 1].value / Math.max(...actual.map(v => v.value), ...predictions.map(p => p.upperBound))) * 100}% L ${predictions.map((p, i) => `${50 + ((i + 1) / predictions.length) * 50}%,${100 - (p.predictedValue / Math.max(...predictions.map(pred => pred.upperBound))) * 100}%`).join(' L ')}`}
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        fill="none"
                    />
                </svg>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"/>
                    <span className="text-sm text-textSecondary">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-secondary rounded-full"/>
                    <span className="text-sm text-textSecondary">Predicted</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-secondary/30 rounded-full"/>
                    <span className="text-sm text-textSecondary">Confidence</span>
                </div>
            </div>
        </div>
    );
});

// Executive summary view
export const ExecutiveSummary = memo(({
                                          metrics,
                                          period
                                      }: {
    metrics: {
        uptime: number;
        incidents: number;
        deployments: number;
        leadTime: number;
        mttr: number;
        changeFailureRate: number;
    };
    period: string;
}) => {
    const scoreCards = [
        {
            label: 'Uptime',
            value: metrics.uptime,
            format: 'percentage',
            target: 99.9,
            unit: '%',
            icon: Check,
            color: metrics.uptime >= 99.9 ? 'text-green-400' : 'text-yellow-400'
        },
        {
            label: 'Incidents',
            value: metrics.incidents,
            format: 'number',
            target: 5,
            unit: '',
            icon: AlertTriangle,
            color: metrics.incidents <= 5 ? 'text-green-400' : 'text-red-400',
            inverse: true
        },
        {
            label: 'Deployments',
            value: metrics.deployments,
            format: 'number',
            target: 20,
            unit: '',
            icon: TrendingUp,
            color: metrics.deployments >= 20 ? 'text-green-400' : 'text-yellow-400'
        },
        {
            label: 'Lead Time',
            value: metrics.leadTime,
            format: 'time',
            target: 24,
            unit: 'hrs',
            icon: Info,
            color: metrics.leadTime <= 24 ? 'text-green-400' : 'text-yellow-400',
            inverse: true
        }
    ];

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            className="bg-surface rounded-lg p-8 border border-border"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text">Executive Summary</h2>
                <span className="text-sm text-textSecondary">{period}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {scoreCards.map((card, index) => {
                    const Icon = card.icon;
                    const progress = card.inverse
                        ? (card.target / card.value) * 100
                        : (card.value / card.target) * 100;

                    return (
                        <motion.div
                            key={card.label}
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: index * 0.1}}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <Icon className={`w-5 h-5 ${card.color}`}/>
                                <span className="text-xs text-textSecondary">Target: {card.target}{card.unit}</span>
                            </div>

                            <div>
                                <div className="text-2xl font-bold text-text">
                                    {card.format === 'percentage' ? `${card.value.toFixed(1)}%` : card.value}
                                </div>
                                <div className="text-sm text-textSecondary">{card.label}</div>
                            </div>

                            <div className="h-2 bg-border rounded-full overflow-hidden">
                                <motion.div
                                    initial={{width: 0}}
                                    animate={{width: `${Math.min(progress, 100)}%`}}
                                    transition={{duration: 1, delay: index * 0.1}}
                                    className={`h-full rounded-full ${
                                        progress >= 100 ? 'bg-green-500' : progress >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{delay: 0.5}}
                className="mt-6 pt-6 border-t border-border"
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-textSecondary">MTTR</span>
                        <div className="text-xl font-semibold text-text">{metrics.mttr} minutes</div>
                    </div>
                    <div>
                        <span className="text-sm text-textSecondary">Change Failure Rate</span>
                        <div className="text-xl font-semibold text-text">{metrics.changeFailureRate.toFixed(1)}%</div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
});