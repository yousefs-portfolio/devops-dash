import React, {useEffect, useState} from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine,
} from 'recharts';
import {format} from 'date-fns';
import {motion} from 'framer-motion';
import {colors} from '../../styles/theme';
import {useWebSocket} from '../../hooks/useWebSocket';
import {Activity, TrendingUp, TrendingDown} from 'lucide-react';

interface DataPoint {
    timestamp: Date;
    value: number;

    [key: string]: any;
}

interface RealtimeLineChartProps {
    metricKey: string;
    projectId?: string;
    title?: string;
    unit?: string;
    maxDataPoints?: number;
    refreshInterval?: number;
    height?: number;
    showStats?: boolean;
    showTrend?: boolean;
    thresholds?: {
        warning?: number;
        critical?: number;
    };
    gradient?: boolean;
    color?: 'success' | 'warning' | 'critical' | 'info';
}

export const RealtimeLineChart: React.FC<RealtimeLineChartProps> = ({
                                                                        metricKey,
                                                                        projectId,
                                                                        title,
                                                                        unit = '',
                                                                        maxDataPoints = 50,
                                                                        refreshInterval = 1000,
                                                                        height = 300,
                                                                        showStats = true,
                                                                        showTrend = true,
                                                                        thresholds,
                                                                        gradient = true,
                                                                        color = 'info',
                                                                    }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [stats, setStats] = useState({
        current: 0,
        min: 0,
        max: 0,
        avg: 0,
        trend: 0,
    });
    const {on, off, state} = useWebSocket();

    // Generate mock data for demonstration
    useEffect(() => {
        const generateMockData = () => {
            const newPoint: DataPoint = {
                timestamp: new Date(),
                value: Math.random() * 100,
                // Add some variability based on metric type
                ...(metricKey === 'cpu' && {value: 50 + Math.random() * 40}),
                ...(metricKey === 'memory' && {value: 30 + Math.random() * 50}),
                ...(metricKey === 'network' && {value: Math.random() * 200}),
                ...(metricKey === 'requests' && {value: 800 + Math.random() * 400}),
            };

            setData(prevData => {
                const newData = [...prevData, newPoint];
                // Keep only the last maxDataPoints
                if (newData.length > maxDataPoints) {
                    newData.shift();
                }

                // Calculate stats
                const values = newData.map(d => d.value);
                const current = values[values.length - 1] || 0;
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;

                // Calculate trend (compare last 10 points to previous 10)
                let trend = 0;
                if (values.length >= 20) {
                    const recent = values.slice(-10);
                    const previous = values.slice(-20, -10);
                    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
                    trend = ((recentAvg - previousAvg) / previousAvg) * 100;
                }

                setStats({current, min, max, avg, trend});

                return newData;
            });
        };

        // Initial data
        for (let i = 0; i < 20; i++) {
            generateMockData();
        }

        // Set up interval for mock data
        const interval = setInterval(generateMockData, refreshInterval);

        return () => clearInterval(interval);
    }, [metricKey, maxDataPoints, refreshInterval]);

    // Subscribe to real WebSocket updates when available
    useEffect(() => {
        if (!state.connected) return;

        const handleMetricUpdate = (update: any) => {
            if (update.metric === metricKey && (!projectId || update.projectId === projectId)) {
                const newPoint: DataPoint = {
                    timestamp: new Date(update.timestamp),
                    value: update.value,
                };

                setData(prevData => {
                    const newData = [...prevData, newPoint];
                    if (newData.length > maxDataPoints) {
                        newData.shift();
                    }
                    return newData;
                });
            }
        };

        on('metric:update', handleMetricUpdate);

        return () => {
            off('metric:update', handleMetricUpdate);
        };
    }, [state.connected, metricKey, projectId, maxDataPoints, on, off]);

    const lineColor = thresholds?.critical && stats.current >= thresholds.critical
        ? colors.accent.critical
        : thresholds?.warning && stats.current >= thresholds.warning
            ? colors.accent.warning
            : colors.accent[color];

    const formatXAxis = (value: any) => {
        if (value instanceof Date || !isNaN(Date.parse(value))) {
            return format(new Date(value), 'HH:mm:ss');
        }
        return value;
    };

    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
        return value.toFixed(0);
    };

    const CustomTooltip = ({active, payload, label}: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-200/95 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">
                        {format(new Date(label), 'HH:mm:ss')}
                    </p>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{backgroundColor: lineColor}}
                        />
                        <span className="text-sm text-white">
              <span className="font-mono font-semibold">
                {payload[0].value.toFixed(1)}
              </span>
                            {unit && <span className="text-gray-400 ml-1">{unit}</span>}
            </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            {/* Header with title and stats */}
            {(title || showStats) && (
                <div className="flex items-start justify-between">
                    {title && (
                        <div className="flex items-center gap-2">
                            <Activity size={20} className="text-gray-400"/>
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                            {state.connected && (
                                <motion.div
                                    animate={{scale: [1, 1.2, 1]}}
                                    transition={{duration: 2, repeat: Infinity}}
                                    className="w-2 h-2 rounded-full bg-success"
                                />
                            )}
                        </div>
                    )}

                    {showStats && (
                        <div className="flex items-center gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Current: </span>
                                <span className="font-mono font-semibold" style={{color: lineColor}}>
                  {stats.current.toFixed(1)}{unit}
                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Avg: </span>
                                <span className="font-mono text-gray-300">
                  {stats.avg.toFixed(1)}{unit}
                </span>
                            </div>
                            {showTrend && stats.trend !== 0 && (
                                <div className="flex items-center gap-1">
                                    {stats.trend > 0 ? (
                                        <TrendingUp size={16} className="text-warning"/>
                                    ) : (
                                        <TrendingDown size={16} className="text-success"/>
                                    )}
                                    <span className={stats.trend > 0 ? 'text-warning' : 'text-success'}>
                    {Math.abs(stats.trend).toFixed(1)}%
                  </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Chart */}
            <div className="relative">
                <ResponsiveContainer width="100%" height={height}>
                    <AreaChart data={data} margin={{top: 5, right: 5, left: 5, bottom: 5}}>
                        <defs>
                            <linearGradient id={`realtime-gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255, 255, 255, 0.05)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatXAxis}
                            stroke="rgba(255, 255, 255, 0.3)"
                            tick={{fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11}}
                            axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}}
                        />

                        <YAxis
                            tickFormatter={formatYAxis}
                            stroke="rgba(255, 255, 255, 0.3)"
                            tick={{fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11}}
                            axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}}
                            domain={['dataMin - 5', 'dataMax + 5']}
                        />

                        <Tooltip content={<CustomTooltip/>}/>

                        {/* Threshold lines */}
                        {thresholds?.warning && (
                            <ReferenceLine
                                y={thresholds.warning}
                                stroke={colors.accent.warning}
                                strokeDasharray="5 5"
                                strokeOpacity={0.5}
                                label={{value: 'Warning', fill: colors.accent.warning, fontSize: 10}}
                            />
                        )}

                        {thresholds?.critical && (
                            <ReferenceLine
                                y={thresholds.critical}
                                stroke={colors.accent.critical}
                                strokeDasharray="5 5"
                                strokeOpacity={0.5}
                                label={{value: 'Critical', fill: colors.accent.critical, fontSize: 10}}
                            />
                        )}

                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={lineColor}
                            strokeWidth={2}
                            fill={gradient ? `url(#realtime-gradient-${metricKey})` : 'transparent'}
                            animationDuration={0} // Disable animation for real-time updates
                            dot={false}
                            activeDot={{r: 4, fill: lineColor}}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Min/Max indicators */}
                <div className="absolute top-2 right-2 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Max:</span>
                        <span className="font-mono text-gray-400">{stats.max.toFixed(1)}{unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Min:</span>
                        <span className="font-mono text-gray-400">{stats.min.toFixed(1)}{unit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};