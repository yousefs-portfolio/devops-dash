import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { motion } from 'framer-motion';
import muiTheme from '../styles/theme';
import { Sidebar } from './layout/Sidebar';
import { BentoGrid, BentoItem } from './layout/BentoGrid';
import { MetricCard } from './widgets/MetricCard';
import { GlassCard } from './ui/GlassCard';
import { CircularProgress } from './ui/CircularProgress';
import {
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  GitBranch,
  Package,
  Shield,
  Activity,
  Server,
  Zap,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Mock data for demonstration
  const metrics = {
    cpu: { value: 68, change: 12 },
    memory: { value: 4.2, change: -5 },
    network: { value: 152, change: 23 },
    uptime: { value: 99.98, change: 0.02 },
    deployments: { value: 24, change: 20 },
    containers: { value: 18, change: -10 },
    security: { value: 98, change: 2 },
    requests: { value: '1.2M', change: 15 },
  };
  
  const sparklineData = [65, 70, 68, 72, 69, 74, 70, 68];
  
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="flex h-screen bg-true-black">
        <Sidebar
          selectedItem={selectedSection}
          onItemSelect={setSelectedSection}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-info to-purple-500 bg-clip-text text-transparent">
                DevOps Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Real-time monitoring and analytics for your infrastructure
              </p>
            </motion.div>
            
            {/* Metrics Grid */}
            <BentoGrid className="mb-8">
              <BentoItem colSpan={2}>
                <MetricCard
                  title="CPU Usage"
                  value={metrics.cpu.value}
                  unit="%"
                  change={metrics.cpu.change}
                  changeLabel="vs last hour"
                  icon={<Cpu size={20} />}
                  status="warning"
                  sparklineData={sparklineData}
                />
              </BentoItem>
              
              <BentoItem colSpan={2}>
                <MetricCard
                  title="Memory"
                  value={metrics.memory.value}
                  unit="GB"
                  change={metrics.memory.change}
                  changeLabel="vs last hour"
                  icon={<HardDrive size={20} />}
                  status="success"
                  sparklineData={sparklineData.map(v => v * 0.8)}
                />
              </BentoItem>
              
              <BentoItem colSpan={2}>
                <MetricCard
                  title="Network I/O"
                  value={metrics.network.value}
                  unit="MB/s"
                  change={metrics.network.change}
                  changeLabel="vs last hour"
                  icon={<Wifi size={20} />}
                  status="info"
                  sparklineData={sparklineData.map(v => v * 1.5)}
                />
              </BentoItem>
              
              <BentoItem>
                <MetricCard
                  title="Uptime"
                  value={metrics.uptime.value}
                  unit="%"
                  change={metrics.uptime.change}
                  icon={<Clock size={20} />}
                  status="success"
                />
              </BentoItem>
              
              <BentoItem>
                <MetricCard
                  title="Deployments"
                  value={metrics.deployments.value}
                  change={metrics.deployments.change}
                  changeLabel="today"
                  icon={<GitBranch size={20} />}
                  status="info"
                />
              </BentoItem>
              
              <BentoItem>
                <MetricCard
                  title="Containers"
                  value={metrics.containers.value}
                  change={metrics.containers.change}
                  icon={<Package size={20} />}
                  status="warning"
                />
              </BentoItem>
              
              <BentoItem>
                <MetricCard
                  title="Security Score"
                  value={metrics.security.value}
                  unit="/100"
                  change={metrics.security.change}
                  icon={<Shield size={20} />}
                  status="success"
                />
              </BentoItem>
              
              <BentoItem colSpan={2}>
                <MetricCard
                  title="API Requests"
                  value={metrics.requests.value}
                  change={metrics.requests.change}
                  changeLabel="vs yesterday"
                  icon={<Activity size={20} />}
                  status="info"
                  sparklineData={sparklineData.map(v => v * 2)}
                />
              </BentoItem>
            </BentoGrid>
            
            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <GlassCard className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Server className="mr-2" size={24} />
                  System Performance
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <CircularProgress
                      value={68}
                      color="warning"
                      label="CPU"
                      size="md"
                    />
                  </div>
                  <div className="text-center">
                    <CircularProgress
                      value={42}
                      color="success"
                      label="Memory"
                      size="md"
                    />
                  </div>
                  <div className="text-center">
                    <CircularProgress
                      value={85}
                      color="critical"
                      label="Disk"
                      size="md"
                    />
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Zap className="mr-2" size={24} />
                  Quick Stats
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Users</span>
                    <span className="font-mono font-semibold">1,234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Response Time</span>
                    <span className="font-mono font-semibold">124ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Error Rate</span>
                    <span className="font-mono font-semibold text-success">0.02%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Throughput</span>
                    <span className="font-mono font-semibold">8.4k/s</span>
                  </div>
                </div>
              </GlassCard>
            </div>
            
            {/* Recent Activity */}
            <GlassCard>
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Activity className="mr-2" size={24} />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {[
                  { type: 'deployment', message: 'Deployed api-service v2.3.1 to production', time: '5 min ago', status: 'success' },
                  { type: 'alert', message: 'High CPU usage detected on node-03', time: '12 min ago', status: 'warning' },
                  { type: 'security', message: 'Security scan completed successfully', time: '1 hour ago', status: 'success' },
                  { type: 'error', message: 'Database connection timeout on replica-02', time: '2 hours ago', status: 'critical' },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className={clsx(
                      'w-2 h-2 rounded-full mt-2',
                      activity.status === 'success' && 'bg-success',
                      activity.status === 'warning' && 'bg-warning',
                      activity.status === 'critical' && 'bg-critical'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

function clsx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}