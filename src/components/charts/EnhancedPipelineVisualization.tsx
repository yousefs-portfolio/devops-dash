import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    GitBranch,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Pause,
    RotateCw,
    ChevronRight,
    Activity,
    Zap,
    Shield,
    Server
} from 'lucide-react';
import {formatDistanceToNow} from 'date-fns';

import {useWebSocket} from '../../hooks/useWebSocket';

function clsx(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

export type PipelineStage = {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    progress?: number;
    logs?: string[];
    metrics?: {
        tests?: { passed: number; failed: number; skipped: number };
        coverage?: number;
        performance?: { score: number; metrics: Record<string, number> };
    };
    artifacts?: Array<{ name: string; size: number; url: string }>;
};

export type Pipeline = {
    id: string;
    name: string;
    branch: string;
    commit: string;
    author: string;
    message: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
    stages: PipelineStage[];
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    trigger: 'manual' | 'push' | 'schedule' | 'api';
};

interface EnhancedPipelineVisualizationProps {
    pipeline: Pipeline;
    onStageClick?: (stage: PipelineStage) => void;
    onRetry?: (pipelineId: string) => void;
    onCancel?: (pipelineId: string) => void;
    showDetails?: boolean;
    compact?: boolean;
    realtime?: boolean;
}

export const EnhancedPipelineVisualization: React.FC<EnhancedPipelineVisualizationProps> = ({
                                                                                                pipeline,
                                                                                                onStageClick,
                                                                                                onRetry,
                                                                                                onCancel,
                                                                                                showDetails = true,
                                                                                                compact = false,
                                                                                                realtime = false,
                                                                                            }) => {
    const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
    const [realtimePipeline, setRealtimePipeline] = useState(pipeline);
    const {on, off, state} = useWebSocket();

    // Subscribe to real-time updates
    useEffect(() => {
        if (!realtime || !state.connected) {
            setRealtimePipeline(pipeline);
            return;
        }

        const handlePipelineUpdate = (update: any) => {
            if (update.pipelineId === pipeline.id) {
                setRealtimePipeline(prev => ({
                    ...prev,
                    ...update.data,
                }));
            }
        };

        on('pipeline:update', handlePipelineUpdate);

        return () => {
            off('pipeline:update', handlePipelineUpdate);
        };
    }, [state.connected, pipeline, realtime, on, off]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'text-success border-success bg-success/10';
            case 'failed':
                return 'text-critical border-critical bg-critical/10';
            case 'running':
                return 'text-info border-info bg-info/10';
            case 'pending':
                return 'text-gray-400 border-gray-400 bg-gray-400/10';
            case 'skipped':
                return 'text-gray-500 border-gray-500 bg-gray-500/10';
            case 'cancelled':
                return 'text-warning border-warning bg-warning/10';
            default:
                return 'text-gray-400 border-gray-400 bg-gray-400/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle size={16}/>;
            case 'failed':
                return <XCircle size={16}/>;
            case 'running':
                return <Activity size={16} className="animate-pulse"/>;
            case 'pending':
                return <Clock size={16}/>;
            case 'skipped':
                return <ChevronRight size={16}/>;
            case 'cancelled':
                return <AlertCircle size={16}/>;
            default:
                return <Clock size={16}/>;
        }
    };

    const getStageIcon = (stageName: string) => {
        const name = stageName.toLowerCase();
        if (name.includes('build')) return <Package size={16}/>;
        if (name.includes('test')) return <Shield size={16}/>;
        if (name.includes('deploy')) return <Server size={16}/>;
        if (name.includes('security')) return <Shield size={16}/>;
        if (name.includes('performance')) return <Zap size={16}/>;
        return <Activity size={16}/>;
    };

    const calculateProgress = () => {
        const completed = realtimePipeline.stages.filter(
            s => ['success', 'failed', 'skipped', 'cancelled'].includes(s.status)
        ).length;
        return (completed / realtimePipeline.stages.length) * 100;
    };

    if (compact) {
        return (
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={clsx('p-2 rounded-lg', getStatusColor(realtimePipeline.status))}>
                            {getStatusIcon(realtimePipeline.status)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{realtimePipeline.name}</span>
                                <span className="text-xs text-gray-500">#{realtimePipeline.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <GitBranch size={12}/>
                                <span>{realtimePipeline.branch}</span>
                                <span>•</span>
                                <span>{realtimePipeline.commit.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>

                    {realtimePipeline.status === 'running' && (
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-400">
                                {Math.round(calculateProgress())}%
                            </div>
                            <div className="w-24 h-1 bg-dark-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-info"
                                    initial={{width: 0}}
                                    animate={{width: `${calculateProgress()}%`}}
                                    transition={{duration: 0.5}}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {realtimePipeline.stages.map((stage, index) => (
                        <React.Fragment key={stage.id}>
                            <motion.div
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                transition={{delay: index * 0.05}}
                                className={clsx(
                                    'flex-1 h-2 rounded-full',
                                    stage.status === 'success' && 'bg-success',
                                    stage.status === 'failed' && 'bg-critical',
                                    stage.status === 'running' && 'bg-info animate-pulse',
                                    stage.status === 'pending' && 'bg-gray-600',
                                    stage.status === 'skipped' && 'bg-gray-700',
                                    stage.status === 'cancelled' && 'bg-warning'
                                )}
                                title={`${stage.name}: ${stage.status}`}
                            />
                            {index < realtimePipeline.stages.length - 1 && (
                                <div className="w-1 h-0.5 bg-gray-600"/>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-white/5">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className={clsx('p-2 rounded-lg', getStatusColor(realtimePipeline.status))}>
                                {getStatusIcon(realtimePipeline.status)}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    {realtimePipeline.name}
                                    <span className="text-sm text-gray-500">#{realtimePipeline.id.slice(0, 8)}</span>
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                    <div className="flex items-center gap-1">
                                        <GitBranch size={14}/>
                                        <span>{realtimePipeline.branch}</span>
                                    </div>
                                    <span>{realtimePipeline.commit.slice(0, 8)}</span>
                                    <span>by {realtimePipeline.author}</span>
                                    {realtimePipeline.startTime && (
                                        <span>{formatDistanceToNow(realtimePipeline.startTime, {addSuffix: true})}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {realtimePipeline.message && (
                            <p className="text-sm text-gray-300 pl-11">{realtimePipeline.message}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {realtimePipeline.status === 'running' && onCancel && (
                            <button
                                onClick={() => onCancel(realtimePipeline.id)}
                                className="p-2 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                            >
                                <Pause size={16}/>
                            </button>
                        )}
                        {realtimePipeline.status === 'failed' && onRetry && (
                            <button
                                onClick={() => onRetry(realtimePipeline.id)}
                                className="p-2 rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors"
                            >
                                <RotateCw size={16}/>
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                {realtimePipeline.status === 'running' && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(calculateProgress())}%</span>
                        </div>
                        <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-info to-purple-500"
                                initial={{width: 0}}
                                animate={{width: `${calculateProgress()}%`}}
                                transition={{duration: 0.5}}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Stages */}
            <div className="p-6">
                <div className="relative">
                    {/* Connection line */}
                    <div
                        className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent"/>

                    <div className="space-y-4">
                        {realtimePipeline.stages.map((stage, index) => (
                            <motion.div
                                key={stage.id}
                                initial={{opacity: 0, x: -20}}
                                animate={{opacity: 1, x: 0}}
                                transition={{delay: index * 0.1}}
                                className={clsx(
                                    'relative flex items-start gap-4 p-4 rounded-lg',
                                    'hover:bg-white/5 transition-all cursor-pointer',
                                    selectedStage?.id === stage.id && 'bg-white/5'
                                )}
                                onClick={() => {
                                    setSelectedStage(stage);
                                    onStageClick?.(stage);
                                }}
                            >
                                {/* Stage icon */}
                                <div className={clsx(
                                    'relative z-10 p-3 rounded-lg border-2',
                                    getStatusColor(stage.status)
                                )}>
                                    {stage.status === 'running' ? (
                                        <motion.div
                                            animate={{rotate: 360}}
                                            transition={{duration: 2, repeat: Infinity, ease: 'linear'}}
                                        >
                                            {getStageIcon(stage.name)}
                                        </motion.div>
                                    ) : (
                                        getStageIcon(stage.name)
                                    )}
                                </div>

                                {/* Stage details */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">{stage.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            {stage.duration && (
                                                <span>{Math.round(stage.duration / 1000)}s</span>
                                            )}
                                            {stage.status === 'running' && stage.progress && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-16 h-1 bg-dark-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-info"
                                                            style={{width: `${stage.progress}%`}}
                                                        />
                                                    </div>
                                                    <span>{stage.progress}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stage metrics */}
                                    {showDetails && stage.metrics && (
                                        <div className="mt-2 flex items-center gap-4 text-xs">
                                            {stage.metrics.tests && (
                                                <div className="flex items-center gap-2">
                                                    <Shield size={12} className="text-gray-400"/>
                                                    <span
                                                        className="text-success">{stage.metrics.tests.passed} passed</span>
                                                    {stage.metrics.tests.failed > 0 && (
                                                        <span
                                                            className="text-critical">{stage.metrics.tests.failed} failed</span>
                                                    )}
                                                </div>
                                            )}
                                            {stage.metrics.coverage !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400">Coverage:</span>
                                                    <span
                                                        className={stage.metrics.coverage >= 80 ? 'text-success' : 'text-warning'}>
                            {stage.metrics.coverage}%
                          </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Stage artifacts */}
                                    {showDetails && stage.artifacts && stage.artifacts.length > 0 && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Package size={12} className="text-gray-400"/>
                                            <span className="text-xs text-gray-400">
                        {stage.artifacts.length} artifacts
                      </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stage details panel */}
            <AnimatePresence>
                {selectedStage && showDetails && (
                    <motion.div
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        className="border-t border-white/5 overflow-hidden"
                    >
                        <div className="p-6 space-y-4">
                            <h4 className="font-semibold">Stage Details: {selectedStage.name}</h4>

                            {selectedStage.logs && selectedStage.logs.length > 0 && (
                                <div className="bg-dark-100 rounded-lg p-4">
                                    <h5 className="text-sm font-semibold mb-2">Logs</h5>
                                    <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
                    {selectedStage.logs.slice(-10).join('\n')}
                  </pre>
                                </div>
                            )}

                            {selectedStage.artifacts && selectedStage.artifacts.length > 0 && (
                                <div>
                                    <h5 className="text-sm font-semibold mb-2">Artifacts</h5>
                                    <div className="space-y-2">
                                        {selectedStage.artifacts.map((artifact, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-dark-100 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Package size={14} className="text-gray-400"/>
                                                    <span className="text-sm">{artifact.name}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">
                          {(artifact.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};