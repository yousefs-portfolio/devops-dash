import React, {useState, useCallback, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    Settings,
    Maximize2,
    Minimize2,
    RefreshCw,
    Download,
    Calendar,
    Clock,
    Grid,
    List,
    HardDrive,
    Package,
    AlertCircle
} from 'lucide-react';
import {BentoGrid, BentoItem} from './layout/BentoGrid';
import {MetricCard} from './widgets/MetricCard';
import {GlassCard} from './ui/GlassCard';
import {RealtimeLineChart} from './charts/RealtimeLineChart';
import {GaugeChart} from './charts/GaugeChart';
import {HeatMap, ActivityCalendar} from './charts/HeatMap';
import {EnhancedPipelineVisualization} from './charts/EnhancedPipelineVisualization';
import type {Pipeline} from './charts/EnhancedPipelineVisualization';
import {useWebSocket} from '../hooks/useWebSocket';
import {useAlertUpdates} from '../hooks/useWebSocket';
import {format, subDays} from 'date-fns';

function clsx(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

interface TimeRange {
    label: string;
    value: string;
    start: Date;
    end: Date;
}

interface DashboardWidget {
    id: string;
    type: 'metric' | 'chart' | 'gauge' | 'heatmap' | 'pipeline' | 'alerts' | 'activity';
    title: string;
    gridSpan: { cols: number; rows: number };
    config: any;
    refreshInterval?: number;
}

export const EnhancedDashboard: React.FC = () => {
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
        label: 'Last 24 Hours',
        value: '24h',
        start: subDays(new Date(), 1),
        end: new Date(),
    });

    const [refreshRate, setRefreshRate] = useState(30000); // 30 seconds
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
    const [customizationMode, setCustomizationMode] = useState(false);

    const {state: wsState} = useWebSocket();
    const alertUpdates = useAlertUpdates();

    // Time range options
    const timeRanges: TimeRange[] = [
        {label: 'Last Hour', value: '1h', start: subDays(new Date(), 1 / 24), end: new Date()},
        {label: 'Last 24 Hours', value: '24h', start: subDays(new Date(), 1), end: new Date()},
        {label: 'Last 7 Days', value: '7d', start: subDays(new Date(), 7), end: new Date()},
        {label: 'Last 30 Days', value: '30d', start: subDays(new Date(), 30), end: new Date()},
    ];

    // Widget definitions
    const [widgets] = useState<DashboardWidget[]>([
        {
            id: 'cpu-gauge',
            type: 'gauge',
            title: 'CPU Usage',
            gridSpan: {cols: 2, rows: 1},
            config: {
                metricKey: 'cpu',
                thresholds: {warning: 70, critical: 90},
            },
        },
        {
            id: 'memory-gauge',
            type: 'gauge',
            title: 'Memory Usage',
            gridSpan: {cols: 2, rows: 1},
            config: {
                metricKey: 'memory',
                thresholds: {warning: 75, critical: 90},
            },
        },
        {
            id: 'network-chart',
            type: 'chart',
            title: 'Network I/O',
            gridSpan: {cols: 4, rows: 2},
            config: {
                metricKey: 'network',
                unit: 'MB/s',
            },
        },
        {
            id: 'requests-chart',
            type: 'chart',
            title: 'API Requests',
            gridSpan: {cols: 4, rows: 2},
            config: {
                metricKey: 'requests',
                unit: 'req/s',
            },
        },
        {
            id: 'deployment-pipeline',
            type: 'pipeline',
            title: 'Latest Deployment',
            gridSpan: {cols: 6, rows: 2},
            config: {},
        },
        {
            id: 'activity-heatmap',
            type: 'heatmap',
            title: 'System Activity',
            gridSpan: {cols: 6, rows: 2},
            config: {
                colorScheme: 'blue',
            },
        },
        {
            id: 'disk-metric',
            type: 'metric',
            title: 'Disk Usage',
            gridSpan: {cols: 2, rows: 1},
            config: {
                icon: <HardDrive size={20}/>,
                unit: 'GB',
            },
        },
        {
            id: 'uptime-metric',
            type: 'metric',
            title: 'Uptime',
            gridSpan: {cols: 2, rows: 1},
            config: {
                icon: <Clock size={20}/>,
                unit: '%',
            },
        },
        {
            id: 'containers-metric',
            type: 'metric',
            title: 'Containers',
            gridSpan: {cols: 2, rows: 1},
            config: {
                icon: <Package size={20}/>,
            },
        },
        {
            id: 'alerts-widget',
            type: 'alerts',
            title: 'Recent Alerts',
            gridSpan: {cols: 3, rows: 2},
            config: {},
        },
        {
            id: 'security-score',
            type: 'gauge',
            title: 'Security Score',
            gridSpan: {cols: 2, rows: 1},
            config: {
                metricKey: 'security',
                max: 100,
                color: 'success',
            },
        },
        {
            id: 'performance-score',
            type: 'gauge',
            title: 'Performance',
            gridSpan: {cols: 2, rows: 1},
            config: {
                metricKey: 'performance',
                max: 100,
                thresholds: {warning: 60, critical: 40},
            },
        },
    ]);

    // Mock data generators
    const generateMockPipeline = (): Pipeline => ({
        id: Math.random().toString(36).substr(2, 9),
        name: 'Production Deploy',
        branch: 'main',
        commit: 'a1b2c3d4',
        author: 'John Doe',
        message: 'feat: Add new dashboard features',
        status: 'running',
        trigger: 'push',
        startTime: new Date(),
        stages: [
            {id: '1', name: 'Build', status: 'success', duration: 45000, progress: 100},
            {id: '2', name: 'Test', status: 'success', duration: 120000, progress: 100},
            {id: '3', name: 'Security Scan', status: 'running', progress: 65},
            {id: '4', name: 'Deploy', status: 'pending'},
            {id: '5', name: 'Verify', status: 'pending'},
        ],
    });

    const generateHeatmapData = () => {
        const data = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                data.push({
                    day,
                    hour,
                    value: Math.random() * 100,
                });
            }
        }
        return data;
    };

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            // Trigger refresh for all widgets
            console.log('Auto-refreshing dashboard...');
        }, refreshRate);

        return () => clearInterval(interval);
    }, [refreshRate]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        handleManualRefresh();
                        break;
                    case 'f':
                        e.preventDefault();
                        setIsFullscreen(!isFullscreen);
                        break;
                    case 'e':
                        e.preventDefault();
                        handleExport();
                        break;
                    case 'g':
                        e.preventDefault();
                        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isFullscreen, viewMode]);

    const handleManualRefresh = useCallback(() => {
        console.log('Manual refresh triggered');
        // Implement refresh logic
    }, []);

    const handleExport = useCallback(() => {
        // Export dashboard data
        const exportData = {
            timestamp: new Date().toISOString(),
            timeRange: selectedTimeRange,
            widgets: widgets.map(w => ({id: w.id, title: w.title})),
            // Add more data as needed
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [selectedTimeRange, widgets]);

    const renderWidget = (widget: DashboardWidget) => {
        switch (widget.type) {
            case 'gauge':
                return (
                    <GaugeChart
                        value={Math.random() * 100}
                        label={widget.title}
                        size="md"
                        {...widget.config}
                    />
                );

            case 'chart':
                return (
                    <RealtimeLineChart
                        title={widget.title}
                        height={200}
                        {...widget.config}
                    />
                );

            case 'pipeline':
                return (
                    <EnhancedPipelineVisualization
                        pipeline={generateMockPipeline()}
                        compact
                        realtime
                    />
                );

            case 'heatmap':
                return (
                    <HeatMap
                        data={generateHeatmapData()}
                        title={widget.title}
                        showLabels
                        {...widget.config}
                    />
                );

            case 'metric':
                return (
                    <MetricCard
                        title={widget.title}
                        value={Math.round(Math.random() * 100)}
                        change={Math.round((Math.random() - 0.5) * 40)}
                        sparklineData={Array.from({length: 8}, () => Math.random() * 100)}
                        {...widget.config}
                    />
                );

            case 'alerts':
                return (
                    <div className="space-y-2">
                        {alertUpdates.slice(0, 5).map((alert, index) => (
                            <motion.div
                                key={alert.id}
                                initial={{opacity: 0, x: -20}}
                                animate={{opacity: 1, x: 0}}
                                transition={{delay: index * 0.1}}
                                className="p-3 bg-dark-100/50 rounded-lg border border-white/5"
                            >
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={16} className={
                                        alert.severity === 'critical' ? 'text-critical' :
                                            alert.severity === 'high' ? 'text-warning' :
                                                'text-info'
                                    }/>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{alert.title}</p>
                                        <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {format(alert.timestamp, 'HH:mm:ss')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {alertUpdates.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-8">No recent alerts</p>
                        )}
                    </div>
                );

            case 'activity':
                return (
                    <ActivityCalendar
                        data={Array.from({length: 365}, (_, i) => ({
                            date: subDays(new Date(), i),
                            count: Math.floor(Math.random() * 50),
                        }))}
                        year={new Date().getFullYear()}
                    />
                );

            default:
                return <div>Unknown widget type</div>;
        }
    };

    return (
        <div className={clsx(
            'min-h-screen bg-true-black text-white',
            isFullscreen && 'fixed inset-0 z-50'
        )}>
            {/* Header Controls */}
            <div className="sticky top-0 z-10 bg-dark-200/80 backdrop-blur-lg border-b border-white/5">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-info to-purple-500 bg-clip-text text-transparent">
                                DevOps Dashboard
                            </h1>

                            {/* Connection Status */}
                            <div className="flex items-center gap-2">
                                <div className={clsx(
                                    'w-2 h-2 rounded-full',
                                    wsState.connected ? 'bg-success animate-pulse' : 'bg-gray-500'
                                )}/>
                                <span className="text-xs text-gray-400">
                  {wsState.connected ? 'Live' : 'Disconnected'}
                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Time Range Selector */}
                            <div className="flex items-center gap-2 bg-dark-100 rounded-lg p-1">
                                <Calendar size={16} className="text-gray-400 ml-2"/>
                                {timeRanges.map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => setSelectedTimeRange(range)}
                                        className={clsx(
                                            'px-3 py-1 rounded text-sm transition-colors',
                                            selectedTimeRange.value === range.value
                                                ? 'bg-info text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                        )}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>

                            {/* Refresh Controls */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={refreshRate}
                                    onChange={(e) => setRefreshRate(Number(e.target.value))}
                                    className="bg-dark-100 text-sm px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-info"
                                >
                                    <option value={10000}>10s</option>
                                    <option value={30000}>30s</option>
                                    <option value={60000}>1m</option>
                                    <option value={300000}>5m</option>
                                </select>

                                <button
                                    onClick={handleManualRefresh}
                                    className="p-2 rounded-lg bg-dark-100 hover:bg-white/10 transition-colors"
                                    title="Refresh (Cmd+R)"
                                >
                                    <RefreshCw size={16}/>
                                </button>
                            </div>

                            {/* View Controls */}
                            <div className="flex items-center gap-1 bg-dark-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={clsx(
                                        'p-1.5 rounded transition-colors',
                                        viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    <Grid size={16}/>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={clsx(
                                        'p-1.5 rounded transition-colors',
                                        viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    <List size={16}/>
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <button
                                onClick={() => setCustomizationMode(!customizationMode)}
                                className={clsx(
                                    'p-2 rounded-lg transition-colors',
                                    customizationMode ? 'bg-info text-white' : 'bg-dark-100 hover:bg-white/10'
                                )}
                                title="Customize Dashboard"
                            >
                                <Settings size={16}/>
                            </button>

                            <button
                                onClick={handleExport}
                                className="p-2 rounded-lg bg-dark-100 hover:bg-white/10 transition-colors"
                                title="Export (Cmd+E)"
                            >
                                <Download size={16}/>
                            </button>

                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-2 rounded-lg bg-dark-100 hover:bg-white/10 transition-colors"
                                title="Fullscreen (Cmd+F)"
                            >
                                {isFullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6">
                {viewMode === 'grid' ? (
                    <BentoGrid className="gap-4">
                        {widgets.map((widget) => (
                            <BentoItem
                                key={widget.id}
                                colSpan={widget.gridSpan.cols as 1 | 2 | 3 | 4 | 5 | 6}
                                rowSpan={widget.gridSpan.rows as 1 | 2 | 3}
                                className={clsx(
                                    customizationMode && 'cursor-move hover:ring-2 hover:ring-info',
                                    selectedWidgets.includes(widget.id) && 'ring-2 ring-info'
                                )}
                            >
                                <div
                                    className="h-full"
                                    onClick={() => {
                                        if (customizationMode) {
                                            setSelectedWidgets(prev =>
                                                prev.includes(widget.id)
                                                    ? prev.filter(id => id !== widget.id)
                                                    : [...prev, widget.id]
                                            );
                                        }
                                    }}
                                >
                                    <GlassCard className="h-full">
                                        {renderWidget(widget)}
                                    </GlassCard>
                                </div>
                            </BentoItem>
                        ))}
                    </BentoGrid>
                ) : (
                    <div className="space-y-4">
                        {widgets.map((widget) => (
                            <motion.div
                                key={widget.id}
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                className={clsx(
                                    customizationMode && 'cursor-move hover:ring-2 hover:ring-info',
                                    selectedWidgets.includes(widget.id) && 'ring-2 ring-info'
                                )}
                            >
                                <GlassCard>
                                    {renderWidget(widget)}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Customization Panel */}
            <AnimatePresence>
                {customizationMode && (
                    <motion.div
                        initial={{x: 300, opacity: 0}}
                        animate={{x: 0, opacity: 1}}
                        exit={{x: 300, opacity: 0}}
                        className="fixed right-0 top-0 h-full w-80 bg-dark-200/95 backdrop-blur-lg border-l border-white/10 p-6 overflow-y-auto z-40"
                    >
                        <h2 className="text-lg font-semibold mb-4">Customize Dashboard</h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Selected Widgets</h3>
                                {selectedWidgets.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedWidgets.map(id => {
                                            const widget = widgets.find(w => w.id === id);
                                            return widget ? (
                                                <div key={id} className="p-2 bg-dark-100 rounded-lg text-sm">
                                                    {widget.title}
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Select widgets to customize</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Widget Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        className="w-full px-3 py-2 bg-dark-100 rounded-lg text-sm hover:bg-white/10 transition-colors text-left">
                                        Edit Selected
                                    </button>
                                    <button
                                        className="w-full px-3 py-2 bg-dark-100 rounded-lg text-sm hover:bg-white/10 transition-colors text-left">
                                        Duplicate Selected
                                    </button>
                                    <button
                                        className="w-full px-3 py-2 bg-dark-100 rounded-lg text-sm hover:bg-white/10 transition-colors text-left text-critical">
                                        Remove Selected
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Add Widget</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Metric', 'Chart', 'Gauge', 'Pipeline', 'Heatmap', 'Alerts'].map(type => (
                                        <button
                                            key={type}
                                            className="px-3 py-2 bg-dark-100 rounded-lg text-sm hover:bg-white/10 transition-colors"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10">
                            <button
                                onClick={() => setCustomizationMode(false)}
                                className="w-full px-4 py-2 bg-info rounded-lg font-medium hover:bg-info/80 transition-colors"
                            >
                                Done Customizing
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};