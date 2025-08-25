import {Project} from '../entities/Project';

describe('Project Entity', () => {
    describe('constructor', () => {
        it('should create a valid project', () => {
            const project = new Project({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'org/test-project',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(project.id).toBe(1);
            expect(project.name).toBe('Test Project');
            expect(project.status).toBe('active');
        });

        it('should throw error for invalid name', () => {
            expect(() => {
                new Project({
                    id: 1,
                    name: '',
                    description: 'A test project',
                    githubRepo: 'org/test-project',
                    dockerImage: 'org/test:latest',
                    status: 'active',
                    createdBy: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }).toThrow('Project name is required');
        });

        it('should throw error for invalid status', () => {
            expect(() => {
                new Project({
                    id: 1,
                    name: 'Test Project',
                    description: 'A test project',
                    githubRepo: 'org/test-project',
                    dockerImage: 'org/test:latest',
                    status: 'invalid' as any,
                    createdBy: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }).toThrow('Invalid project status');
        });
    });

    describe('validation', () => {
        it('should validate GitHub repo format', () => {
            const project = new Project({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'org/test-project',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(project.isValidGithubRepo()).toBe(true);
        });

        it('should return false for invalid GitHub repo format', () => {
            const project = new Project({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'invalid-repo',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(project.isValidGithubRepo()).toBe(false);
        });

        it('should validate Docker image format', () => {
            const project = new Project({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'org/test-project',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(project.isValidDockerImage()).toBe(true);
        });
    });

    describe('status management', () => {
        it('should update status to maintenance', () => {
            const project = new Project({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'org/test-project',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            project.setStatus('maintenance');
            expect(project.status).toBe('maintenance');
            expect(project.updatedAt.getTime()).toBeGreaterThan(project.createdAt.getTime());
        });

        it('should check if project is active', () => {
            const project = new Project({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'org/test-project',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(project.isActive()).toBe(true);

            project.setStatus('archived');
            expect(project.isActive()).toBe(false);
        });
    });

    describe('serialization', () => {
        it('should convert to JSON', () => {
            const now = new Date();
            const project = new Project({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'org/test-project',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: now,
                updatedAt: now,
            });

            const json = project.toJSON();
            expect(json).toEqual({
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                githubRepo: 'org/test-project',
                dockerImage: 'org/test:latest',
                status: 'active',
                createdBy: 1,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            });
        });
    });
});