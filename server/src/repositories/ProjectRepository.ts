import {db} from '../database/connection';
import {Project, ProjectEntity} from '../entities/Project';
import {
    IProjectRepository,
    CreateProjectDTO,
    UpdateProjectDTO,
    ProjectFilters,
} from './interfaces/IProjectRepository';

export class ProjectRepository implements IProjectRepository {
    private table = 'projects';

    async create(data: CreateProjectDTO): Promise<Project> {
        const [created] = await db(this.table)
            .insert({
                name: data.name,
                description: data.description,
                github_repo: data.githubRepo,
                docker_image: data.dockerImage,
                status: data.status || 'active',
                settings: JSON.stringify(data.settings || {}),
                webhook_config: JSON.stringify(data.webhookConfig || {}),
                deployment_url: data.deploymentUrl,
                environment: data.environment || 'production',
                created_by: data.createdBy,
            })
            .returning('*');

        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Project | null> {
        const result = await db(this.table).where({id}).first();
        return result ? this.mapToEntity(result) : null;
    }

    async findAll(filters?: ProjectFilters): Promise<Project[]> {
        let query = db(this.table);

        if (filters) {
            if (filters.status) {
                query = query.where({status: filters.status});
            }
            if (filters.createdBy) {
                query = query.where({created_by: filters.createdBy});
            }
            if (filters.search) {
                query = query.where(function () {
                    this.where('name', 'ilike', `%${filters.search}%`)
                        .orWhere('description', 'ilike', `%${filters.search}%`);
                });
            }
        }

        const results = await query.orderBy('created_at', 'desc');
        return results.map(this.mapToEntity);
    }

    async update(data: UpdateProjectDTO): Promise<Project | null> {
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.githubRepo !== undefined) updateData.github_repo = data.githubRepo;
        if (data.dockerImage !== undefined) updateData.docker_image = data.dockerImage;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);
        if (data.webhookConfig !== undefined) updateData.webhook_config = JSON.stringify(data.webhookConfig);
        if (data.deploymentUrl !== undefined) updateData.deployment_url = data.deploymentUrl;
        if (data.environment !== undefined) updateData.environment = data.environment;

        updateData.updated_at = new Date();

        const [updated] = await db(this.table)
            .where({id: data.id})
            .update(updateData)
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    async delete(id: string): Promise<boolean> {
        const deleted = await db(this.table).where({id}).del();
        return deleted > 0;
    }

    async findByName(name: string): Promise<Project | null> {
        const result = await db(this.table).where({name}).first();
        return result ? this.mapToEntity(result) : null;
    }

    async count(filters?: ProjectFilters): Promise<number> {
        let query = db(this.table);

        if (filters) {
            if (filters.status) {
                query = query.where({status: filters.status});
            }
            if (filters.createdBy) {
                query = query.where({created_by: filters.createdBy});
            }
            if (filters.search) {
                query = query.where(function () {
                    this.where('name', 'ilike', `%${filters.search}%`)
                        .orWhere('description', 'ilike', `%${filters.search}%`);
                });
            }
        }

        const [{count}] = await query.count('* as count');
        return parseInt(count as string, 10);
    }

    private mapToEntity(row: any): Project {
        const settings = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings;
        const webhookConfig = typeof row.webhook_config === 'string' ? JSON.parse(row.webhook_config) : row.webhook_config;

        return new ProjectEntity({
            id: row.id,
            name: row.name,
            description: row.description,
            repository_url: row.deployment_url,
            github_repo: row.github_repo,
            docker_image: row.docker_image,
            environment: row.environment || 'production',
            status: row.status || 'active',
            health_status: 'unknown',
            created_at: row.created_at,
            updated_at: row.updated_at,
            webhook_secret: webhookConfig?.secret,
            settings: settings,
        });
    }
}