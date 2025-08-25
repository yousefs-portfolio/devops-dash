import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    AlertTriangle,
    Bell,
    Plus,
    X,
    Save,
    TestTube,
    Info,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import {cn} from '@/utils/cn';

interface AlertRule {
    id?: string;
    name: string;
    description: string;
    metricType: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
    threshold: number | string;
    severity: 'critical' | 'warning' | 'info';
    enabled: boolean;
    cooldownMinutes?: number;
    notificationChannels: string[];
    tags?: string[];
}

interface AlertRuleBuilderProps {
    initialRule?: AlertRule;
    onSave: (rule: AlertRule) => void;
    onCancel: () => void;
    availableMetrics?: string[];
    availableChannels?: { id: string; name: string; type: string }[];
}

export const AlertRuleBuilder: React.FC<AlertRuleBuilderProps> = ({
                                                                      initialRule,
                                                                      onSave,
                                                                      onCancel,
                                                                      availableMetrics = ['cpu', 'memory', 'disk', 'network', 'response_time', 'error_rate'],
                                                                      availableChannels = [
                                                                          {id: '1', name: 'Email', type: 'email'},
                                                                          {id: '2', name: 'Slack', type: 'slack'},
                                                                          {
                                                                              id: '3',
                                                                              name: 'PagerDuty',
                                                                              type: 'pagerduty'
                                                                          },
                                                                          {id: '4', name: 'Webhook', type: 'webhook'},
                                                                      ],
                                                                  }) => {
    const [rule, setRule] = useState<AlertRule>(initialRule || {
        name: '',
        description: '',
        metricType: 'cpu',
        condition: 'greater_than',
        threshold: 80,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: [],
        tags: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);

    const validateRule = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!rule.name.trim()) {
            newErrors.name = 'Alert name is required';
        }

        if (!rule.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (rule.threshold === '' || rule.threshold === undefined) {
            newErrors.threshold = 'Threshold value is required';
        }

        if (rule.notificationChannels.length === 0) {
            newErrors.channels = 'At least one notification channel is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateRule()) {
            onSave(rule);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);

        // Simulate testing the alert rule
        setTimeout(() => {
            setIsTesting(false);
            setTestResult(Math.random() > 0.3 ? 'success' : 'failure');
        }, 2000);
    };

    const severityIcons = {
        critical: <AlertCircle className="text-red-500" size={20}/>,
        warning: <AlertTriangle className="text-yellow-500" size={20}/>,
        info: <Info className="text-blue-500" size={20}/>,
    };

    const severityColors = {
        critical: 'border-red-500 bg-red-500/10',
        warning: 'border-yellow-500 bg-yellow-500/10',
        info: 'border-blue-500 bg-blue-500/10',
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-neutral-900 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Bell size={24}/>
                    {initialRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
                </h2>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                    <X size={20} className="text-neutral-400"/>
                </button>
            </div>

            <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Basic Information</h3>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Alert Name *
                        </label>
                        <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => setRule({...rule, name: e.target.value})}
                            className={cn(
                                'w-full px-4 py-2 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2',
                                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-neutral-700 focus:ring-blue-500'
                            )}
                            placeholder="e.g., High CPU Usage Alert"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={rule.description}
                            onChange={(e) => setRule({...rule, description: e.target.value})}
                            className={cn(
                                'w-full px-4 py-2 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2',
                                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-neutral-700 focus:ring-blue-500'
                            )}
                            rows={3}
                            placeholder="Describe when this alert should trigger..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                        )}
                    </div>
                </div>

                {/* Condition Configuration */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Alert Condition</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Metric Type
                            </label>
                            <select
                                value={rule.metricType}
                                onChange={(e) => setRule({...rule, metricType: e.target.value})}
                                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {availableMetrics.map((metric) => (
                                    <option key={metric} value={metric}>
                                        {metric.charAt(0).toUpperCase() + metric.slice(1).replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Condition
                            </label>
                            <select
                                value={rule.condition}
                                onChange={(e) => setRule({...rule, condition: e.target.value as any})}
                                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="greater_than">Greater than</option>
                                <option value="less_than">Less than</option>
                                <option value="equals">Equals</option>
                                <option value="not_equals">Not equals</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Threshold *
                            </label>
                            <input
                                type="number"
                                value={rule.threshold}
                                onChange={(e) => setRule({...rule, threshold: parseFloat(e.target.value)})}
                                className={cn(
                                    'w-full px-4 py-2 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2',
                                    errors.threshold ? 'border-red-500 focus:ring-red-500' : 'border-neutral-700 focus:ring-blue-500'
                                )}
                                placeholder="e.g., 80"
                            />
                            {errors.threshold && (
                                <p className="mt-1 text-sm text-red-500">{errors.threshold}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Severity and Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Severity & Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Severity Level
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['critical', 'warning', 'info'] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setRule({...rule, severity: level})}
                                        className={cn(
                                            'px-3 py-2 border rounded-lg flex items-center justify-center gap-2 transition-all',
                                            rule.severity === level
                                                ? severityColors[level] + ' border-opacity-100'
                                                : 'border-neutral-700 hover:border-neutral-600'
                                        )}
                                    >
                                        {severityIcons[level]}
                                        <span className="text-sm capitalize text-white">{level}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Cooldown Period (minutes)
                            </label>
                            <input
                                type="number"
                                value={rule.cooldownMinutes}
                                onChange={(e) => setRule({...rule, cooldownMinutes: parseInt(e.target.value)})}
                                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="5"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) => setRule({...rule, enabled: e.target.checked})}
                                className="w-4 h-4 bg-neutral-800 border-neutral-700 rounded text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-neutral-300">Enable this alert rule</span>
                        </label>
                    </div>
                </div>

                {/* Notification Channels */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Notification Channels *</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableChannels.map((channel) => (
                            <label
                                key={channel.id}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all',
                                    rule.notificationChannels.includes(channel.id)
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-neutral-700 hover:border-neutral-600'
                                )}
                            >
                                <input
                                    type="checkbox"
                                    checked={rule.notificationChannels.includes(channel.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setRule({
                                                ...rule,
                                                notificationChannels: [...rule.notificationChannels, channel.id],
                                            });
                                        } else {
                                            setRule({
                                                ...rule,
                                                notificationChannels: rule.notificationChannels.filter(id => id !== channel.id),
                                            });
                                        }
                                    }}
                                    className="sr-only"
                                />
                                <span className="text-white">{channel.name}</span>
                            </label>
                        ))}
                    </div>
                    {errors.channels && (
                        <p className="text-sm text-red-500">{errors.channels}</p>
                    )}
                </div>

                {/* Test Result */}
                <AnimatePresence>
                    {testResult && (
                        <motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                            className={cn(
                                'p-4 rounded-lg border flex items-center gap-3',
                                testResult === 'success'
                                    ? 'bg-green-500/10 border-green-500'
                                    : 'bg-red-500/10 border-red-500'
                            )}
                        >
                            {testResult === 'success' ? (
                                <>
                                    <CheckCircle className="text-green-500" size={20}/>
                                    <span className="text-green-400">Alert rule test successful! The rule is configured correctly.</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="text-red-500" size={20}/>
                                    <span className="text-red-400">Alert rule test failed. Please check your configuration.</span>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                    <button
                        onClick={handleTest}
                        disabled={isTesting}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TestTube size={18}/>
                        {isTesting ? 'Testing...' : 'Test Rule'}
                    </button>

                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Save size={18}/>
                        Save Rule
                    </button>
                </div>
            </div>
        </div>
    );
};