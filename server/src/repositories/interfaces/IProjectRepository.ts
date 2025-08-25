import {Project} from '../../entities/Project';

export interface CreateProjectDTO {
    name: string;
    description?: string;
    githubRepo?: string;
    dockerImage?: string;
    status?: 'active' | 'inactive' | 'archived';
    settings?: Record<string, unknown>;
    webhookConfig?: Record<string, unknown>;
    deploymentUrl?: string;
    environment?: string;
    createdBy?: string;
}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {
    id: string;
}

export interface ProjectFilters {
    status?: 'active' | 'inactive' | 'archived';
    createdBy?: string;
    search?: string;
}

export interface IProjectRepository {
    create(data: CreateProjectDTO): Promise<Project>;

    findById(id: string): Promise<Project | null>;

    findAll(filters?: ProjectFilters): Promise<Project[]>;

    update(data: UpdateProjectDTO): Promise<Project | null>;

    delete(id: string): Promise<boolean>;

    findByName(name: string): Promise<Project | null>;

    count(filters?: ProjectFilters): Promise<number>;
}