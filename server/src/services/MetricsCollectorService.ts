import cron from 'node-cron';
import {ProjectRepository} from '../repositories/ProjectRepository';
import {GitHubService} from './GitHubService';
import {DockerService} from './DockerService';
import {Server} from 'socket.io';

export class MetricsCollectorService {
    private projectRepo: ProjectRepository;
    private githubService: GitHubService;
    private dockerService: DockerService;
    private io: Server | null = null;
    private collectionTasks: Map<string, cron.ScheduledTask> = new Map();

    constructor(io?: Server) {
        this.projectRepo = new ProjectRepository();
        this.githubService = new GitHubService();
        this.dockerService = new DockerService();
        this.io = io || null;
    }

    async startCollecting(projectId: string, interval = '*/5 * * * *'): Promise<void> {
        // Stop existing task if any
        this.stopCollecting(projectId);

        // Create new scheduled task
        const task = cron.schedule(interval, async () => {
            await this.collectMetricsForProject(projectId);
        });

        this.collectionTasks.set(projectId, task);
        task.start();

        console.log(`Started metrics collection for project ${projectId} with interval: ${interval}`);
    }

    stopCollecting(projectId: string): void {
        const task = this.collectionTasks.get(projectId);
        if (task) {
            task.stop();
            this.collectionTasks.delete(projectId);
            console.log(`Stopped metrics collection for project ${projectId}`);
        }
    }

    async collectMetricsForProject(projectId: string): Promise<void> {
        try {
            const project = await this.projectRepo.findById(projectId);
            if (!project) {
                console.error(`Project ${projectId} not found`);
                return;
            }

            const collectionPromises: Promise<void>[] = [];

            // Collect GitHub metrics if configured
            if (project.github_repo) {
                const match = project.github_repo.match(/github\.com\/([^\/]+)\/([^\/]+)/);
                if (match) {
                    const [, owner, repo] = match;
                    collectionPromises.push(
                        this.githubService.collectAndStoreMetrics(projectId, owner, repo)
                            .catch(err => console.error(`GitHub metrics collection failed for ${projectId}:`, err))
                    );
                }
            }

            // Collect Docker metrics if configured
            if (project.docker_image) {
                // Try to find running container with this image
                try {
                    const containers = await this.dockerService.listContainers();
                    const container = containers.find(c => c.image.includes(project.docker_image!));

                    if (container) {
                        collectionPromises.push(
                            this.dockerService.collectAndStoreMetrics(projectId, container.id)
                                .catch(err => console.error(`Docker metrics collection failed for ${projectId}:`, err))
                        );
                    }
                } catch (err) {
                    console.error(`Failed to list Docker containers for ${projectId}:`, err);
                }
            }

            // Wait for all collections to complete
            await Promise.all(collectionPromises);

            // Emit real-time update if WebSocket is available
            if (this.io) {
                this.io.to(`project-${projectId}`).emit('metrics:updated', {
                    projectId,
                    timestamp: new Date(),
                });
            }

            console.log(`Metrics collection completed for project ${projectId}`);
        } catch (error) {
            console.error(`Failed to collect metrics for project ${projectId}:`, error);
        }
    }

    async startAllActiveProjects(): Promise<void> {
        try {
            const projects = await this.projectRepo.findAll({status: 'active'});

            for (const project of projects) {
                if (project.settings?.monitoring_enabled) {
                    await this.startCollecting(project.id);
                }
            }

            console.log(`Started metrics collection for ${projects.length} active projects`);
        } catch (error) {
            console.error('Failed to start metrics collection for active projects:', error);
        }
    }

    stopAll(): void {
        this.collectionTasks.forEach((task, projectId) => {
            task.stop();
            console.log(`Stopped metrics collection for project ${projectId}`);
        });
        this.collectionTasks.clear();
    }

    getActiveCollectors(): string[] {
        return Array.from(this.collectionTasks.keys());
    }
}