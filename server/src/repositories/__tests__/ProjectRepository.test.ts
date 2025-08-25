import {ProjectRepository} from '../ProjectRepository';
import {db} from '../../database/connection';
import {CreateProjectDTO, UpdateProjectDTO} from '../interfaces/IProjectRepository';
import {Project} from '../../entities/Project';

describe('ProjectRepository', () => {
    let repository: ProjectRepository;

    beforeAll(async () => {
        // Run migrations for test database
        await db.migrate.latest();
    });

    beforeEach(async () => {
        repository = new ProjectRepository();
        // Clean up database before each test
        await db('projects').del();
        await db('users').del();
    });

    afterAll(async () => {
        await db.destroy();
    });

    describe('create', () => {
        it('should create a new project', async () => {
            const projectData: CreateProjectDTO = {
                name: 'Test Project',
                description: 'Test Description',
                githubRepo: 'https://github.com/test/repo',
                dockerImage: 'test/image:latest',
                status: 'active',
                environment: 'production',
            };

            const project = await repository.create(projectData);

            expect(project).toBeDefined();
            expect(project.id).toBeDefined();
            expect(project.name).toBe(projectData.name);
            expect(project.description).toBe(projectData.description);
            expect(project.githubRepo).toBe(projectData.githubRepo);
            expect(project.status).toBe(projectData.status);
        });

        it('should create project with default values', async () => {
            const projectData: CreateProjectDTO = {
                name: 'Minimal Project',
            };

            const project = await repository.create(projectData);

            expect(project).toBeDefined();
            expect(project.name).toBe(projectData.name);
            expect(project.status).toBe('active');
            expect(project.environment).toBe('production');
        });
    });

    describe('findById', () => {
        it('should find project by id', async () => {
            const created = await repository.create({name: 'Find Me'});
            const found = await repository.findById(created.id);

            expect(found).toBeDefined();
            expect(found?.id).toBe(created.id);
            expect(found?.name).toBe('Find Me');
        });

        it('should return null for non-existent id', async () => {
            const found = await repository.findById('non-existent-id');
            expect(found).toBeNull();
        });
    });

    describe('findAll', () => {
        beforeEach(async () => {
            await repository.create({name: 'Project 1', status: 'active'});
            await repository.create({name: 'Project 2', status: 'inactive'});
            await repository.create({name: 'Project 3', status: 'active'});
            await repository.create({name: 'Archived Project', status: 'archived'});
        });

        it('should return all projects', async () => {
            const projects = await repository.findAll();
            expect(projects).toHaveLength(4);
        });

        it('should filter by status', async () => {
            const activeProjects = await repository.findAll({status: 'active'});
            expect(activeProjects).toHaveLength(2);
            expect(activeProjects.every(p => p.status === 'active')).toBe(true);
        });

        it('should search by name', async () => {
            const projects = await repository.findAll({search: 'Project'});
            expect(projects).toHaveLength(4);
        });
    });

    describe('update', () => {
        it('should update existing project', async () => {
            const created = await repository.create({name: 'Original Name'});

            const updateData: UpdateProjectDTO = {
                id: created.id,
                name: 'Updated Name',
                description: 'New Description',
                status: 'inactive',
            };

            const updated = await repository.update(updateData);

            expect(updated).toBeDefined();
            expect(updated?.name).toBe('Updated Name');
            expect(updated?.description).toBe('New Description');
            expect(updated?.status).toBe('inactive');
        });

        it('should return null for non-existent project', async () => {
            const updated = await repository.update({
                id: 'non-existent',
                name: 'New Name',
            });

            expect(updated).toBeNull();
        });
    });

    describe('delete', () => {
        it('should delete existing project', async () => {
            const created = await repository.create({name: 'To Delete'});
            const deleted = await repository.delete(created.id);

            expect(deleted).toBe(true);

            const found = await repository.findById(created.id);
            expect(found).toBeNull();
        });

        it('should return false for non-existent project', async () => {
            const deleted = await repository.delete('non-existent');
            expect(deleted).toBe(false);
        });
    });

    describe('findByName', () => {
        it('should find project by name', async () => {
            await repository.create({name: 'Unique Name'});
            const found = await repository.findByName('Unique Name');

            expect(found).toBeDefined();
            expect(found?.name).toBe('Unique Name');
        });

        it('should return null for non-existent name', async () => {
            const found = await repository.findByName('Non Existent');
            expect(found).toBeNull();
        });
    });

    describe('count', () => {
        beforeEach(async () => {
            await repository.create({name: 'Project 1', status: 'active'});
            await repository.create({name: 'Project 2', status: 'active'});
            await repository.create({name: 'Project 3', status: 'inactive'});
        });

        it('should count all projects', async () => {
            const count = await repository.count();
            expect(count).toBe(3);
        });

        it('should count with filters', async () => {
            const count = await repository.count({status: 'active'});
            expect(count).toBe(2);
        });
    });
});