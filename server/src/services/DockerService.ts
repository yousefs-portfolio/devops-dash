import Docker from 'dockerode';
import {MetricRepository} from '../repositories/MetricRepository';
import {MetricType} from '../entities/Metric';

export interface ContainerStats {
    id: string;
    name: string;
    image: string;
    status: string;
    state: string;
    cpuPercent: number;
    memoryUsageMB: number;
    memoryLimitMB: number;
    memoryPercent: number;
    networkRxMB: number;
    networkTxMB: number;
    blockRead: number;
    blockWrite: number;
    pids: number;
}

export interface ContainerInfo {
    id: string;
    name: string;
    image: string;
    status: string;
    state: string;
    created: Date;
    ports: Array<{ PrivatePort: number; PublicPort?: number; Type: string }>;
    labels: Record<string, string>;
}

export class DockerService {
    private docker: Docker;
    private metricRepo: MetricRepository;

    constructor() {
        this.docker = new Docker({
            socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
        });
        this.metricRepo = new MetricRepository();
    }

    async listContainers(all = false): Promise<ContainerInfo[]> {
        try {
            const containers = await this.docker.listContainers({all});

            return containers.map(container => ({
                id: container.Id,
                name: container.Names[0]?.replace('/', '') || 'unknown',
                image: container.Image,
                status: container.Status,
                state: container.State,
                created: new Date(container.Created * 1000),
                ports: container.Ports,
                labels: container.Labels,
            }));
        } catch (error) {
            console.error('Failed to list Docker containers:', error);
            throw error;
        }
    }

    async getContainerStats(containerId: string): Promise<ContainerStats> {
        try {
            const container = await this.docker.getContainer(containerId);
            const stats = await container.stats({stream: false});
            const info = await container.inspect();

            // Calculate CPU percentage
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

            // Calculate memory usage
            const memoryUsageMB = stats.memory_stats.usage / (1024 * 1024);
            const memoryLimitMB = stats.memory_stats.limit / (1024 * 1024);
            const memoryPercent = (stats.memory_stats.usage / stats.memory_stats.limit) * 100;

            // Calculate network I/O
            let networkRxMB = 0;
            let networkTxMB = 0;
            if (stats.networks) {
                Object.values(stats.networks).forEach((network: { rx_bytes: number; tx_bytes: number }) => {
                    networkRxMB += network.rx_bytes / (1024 * 1024);
                    networkTxMB += network.tx_bytes / (1024 * 1024);
                });
            }

            return {
                id: info.Id,
                name: info.Name.replace('/', ''),
                image: info.Config.Image,
                status: info.State.Status,
                state: info.State.Running ? 'running' : 'stopped',
                cpuPercent: isNaN(cpuPercent) ? 0 : cpuPercent,
                memoryUsageMB,
                memoryLimitMB,
                memoryPercent: isNaN(memoryPercent) ? 0 : memoryPercent,
                networkRxMB,
                networkTxMB,
                blockRead: stats.blkio_stats?.io_service_bytes_recursive?.find((item: {
                    op: string;
                    value: number
                }) => item.op === 'Read')?.value || 0,
                blockWrite: stats.blkio_stats?.io_service_bytes_recursive?.find((item: {
                    op: string;
                    value: number
                }) => item.op === 'Write')?.value || 0,
                pids: stats.pids_stats?.current || 0,
            };
        } catch (error) {
            console.error('Failed to get container stats:', error);
            throw error;
        }
    }

    async getContainerLogs(containerId: string, tail = 100): Promise<string> {
        try {
            const container = await this.docker.getContainer(containerId);
            const stream = await container.logs({
                stdout: true,
                stderr: true,
                tail,
                timestamps: true,
            });

            return stream.toString();
        } catch (error) {
            console.error('Failed to get container logs:', error);
            throw error;
        }
    }

    async restartContainer(containerId: string): Promise<void> {
        try {
            const container = await this.docker.getContainer(containerId);
            await container.restart();
            console.log(`Container ${containerId} restarted successfully`);
        } catch (error) {
            console.error('Failed to restart container:', error);
            throw error;
        }
    }

    async stopContainer(containerId: string): Promise<void> {
        try {
            const container = await this.docker.getContainer(containerId);
            await container.stop();
            console.log(`Container ${containerId} stopped successfully`);
        } catch (error) {
            console.error('Failed to stop container:', error);
            throw error;
        }
    }

    async startContainer(containerId: string): Promise<void> {
        try {
            const container = await this.docker.getContainer(containerId);
            await container.start();
            console.log(`Container ${containerId} started successfully`);
        } catch (error) {
            console.error('Failed to start container:', error);
            throw error;
        }
    }

    async pullImage(imageName: string): Promise<void> {
        try {
            const stream = await this.docker.pull(imageName);

            return new Promise((resolve, reject) => {
                this.docker.modem.followProgress(stream, (err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`Image ${imageName} pulled successfully`);
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error('Failed to pull Docker image:', error);
            throw error;
        }
    }

    async collectAndStoreMetrics(projectId: string, containerId: string): Promise<void> {
        try {
            const stats = await this.getContainerStats(containerId);

            // Store metrics in database
            const metricsToStore = [
                {projectId, type: 'cpu_usage' as MetricType, value: stats.cpuPercent, unit: 'percent'},
                {projectId, type: 'memory_usage' as MetricType, value: stats.memoryUsageMB, unit: 'MB'},
                {projectId, type: 'memory_percent' as MetricType, value: stats.memoryPercent, unit: 'percent'},
                {projectId, type: 'network_rx' as MetricType, value: stats.networkRxMB, unit: 'MB'},
                {projectId, type: 'network_tx' as MetricType, value: stats.networkTxMB, unit: 'MB'},
            ];

            await this.metricRepo.createBatch(metricsToStore);
            console.log(`Docker metrics collected for project ${projectId}`);
        } catch (error) {
            console.error(`Failed to collect Docker metrics for project ${projectId}:`, error);
            throw error;
        }
    }

    async getSystemInfo(): Promise<{
        containers: number;
        containersRunning: number;
        containersPaused: number;
        containersStopped: number;
        images: number;
        driverStatus: Array<string[]>;
        systemStatus: Array<string[]>;
        dockerVersion: string;
        serverVersion: string;
    }> {
        try {
            const info = await this.docker.info();

            return {
                containers: info.Containers,
                containersRunning: info.ContainersRunning,
                containersPaused: info.ContainersPaused,
                containersStopped: info.ContainersStopped,
                images: info.Images,
                serverVersion: info.ServerVersion,
                memTotal: info.MemTotal / (1024 * 1024 * 1024), // Convert to GB
                cpus: info.NCPU,
                operatingSystem: info.OperatingSystem,
                kernelVersion: info.KernelVersion,
            };
        } catch (error) {
            console.error('Failed to get Docker system info:', error);
            throw error;
        }
    }
}