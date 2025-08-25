import {WebhookEvent} from '../entities/WebhookEvent';

describe('WebhookEvent Entity', () => {
    describe('constructor', () => {
        it('should create a valid webhook event', () => {
            const payload = {
                repository: 'org/test-repo',
                action: 'push',
                ref: 'refs/heads/main',
                commits: [
                    {
                        id: 'abc123',
                        message: 'Update README',
                        author: {name: 'John Doe', email: 'john@example.com'},
                    },
                ],
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: payload,
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            expect(event.id).toBe(1);
            expect(event.eventType).toBe('push');
            expect(event.payload).toEqual(payload);
            expect(event.status).toBe('pending');
        });

        it('should throw error for invalid event type', () => {
            expect(() => {
                new WebhookEvent({
                    id: 1,
                    projectId: 1,
                    eventType: 'invalid' as any,
                    payload: {},
                    source: 'github',
                    status: 'pending',
                    createdAt: new Date(),
                });
            }).toThrow('Invalid webhook event type');
        });

        it('should throw error for invalid status', () => {
            expect(() => {
                new WebhookEvent({
                    id: 1,
                    projectId: 1,
                    eventType: 'push',
                    payload: {},
                    source: 'github',
                    status: 'invalid' as any,
                    createdAt: new Date(),
                });
            }).toThrow('Invalid webhook event status');
        });

        it('should throw error for invalid source', () => {
            expect(() => {
                new WebhookEvent({
                    id: 1,
                    projectId: 1,
                    eventType: 'push',
                    payload: {},
                    source: 'invalid' as any,
                    status: 'pending',
                    createdAt: new Date(),
                });
            }).toThrow('Invalid webhook source');
        });
    });

    describe('status management', () => {
        let event: WebhookEvent;

        beforeEach(() => {
            event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: {test: 'data'},
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });
        });

        it('should process event successfully', () => {
            event.markAsProcessed();
            expect(event.status).toBe('processed');
            expect(event.processedAt).toBeDefined();
        });

        it('should mark event as failed', () => {
            const error = 'Connection timeout';
            event.markAsFailed(error);
            expect(event.status).toBe('failed');
            expect(event.error).toBe(error);
            expect(event.processedAt).toBeDefined();
        });

        it('should retry event', () => {
            event.markAsFailed('First error');
            expect(event.retryCount).toBe(0);

            event.retry();
            expect(event.status).toBe('pending');
            expect(event.retryCount).toBe(1);
            expect(event.error).toBeUndefined();
        });

        it('should not retry if max retries exceeded', () => {
            event.retryCount = 3;
            expect(() => event.retry()).toThrow('Maximum retry attempts exceeded');
        });
    });

    describe('payload parsing', () => {
        it('should parse GitHub push event', () => {
            const payload = {
                repository: {full_name: 'org/repo'},
                ref: 'refs/heads/main',
                commits: [
                    {id: '123', message: 'Fix bug'},
                    {id: '456', message: 'Add feature'},
                ],
                pusher: {name: 'developer'},
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: payload,
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            const parsed = event.parseGitHubPayload();
            expect(parsed.repository).toBe('org/repo');
            expect(parsed.branch).toBe('main');
            expect(parsed.commitCount).toBe(2);
            expect(parsed.pusher).toBe('developer');
        });

        it('should parse GitHub pull request event', () => {
            const payload = {
                action: 'opened',
                pull_request: {
                    number: 42,
                    title: 'Add new feature',
                    state: 'open',
                    user: {login: 'contributor'},
                    head: {ref: 'feature-branch'},
                    base: {ref: 'main'},
                },
                repository: {full_name: 'org/repo'},
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'pull_request',
                payload: payload,
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            const parsed = event.parseGitHubPayload();
            expect(parsed.action).toBe('opened');
            expect(parsed.prNumber).toBe(42);
            expect(parsed.prTitle).toBe('Add new feature');
            expect(parsed.author).toBe('contributor');
        });

        it('should parse GitHub workflow run event', () => {
            const payload = {
                action: 'completed',
                workflow_run: {
                    id: 123456,
                    name: 'CI Pipeline',
                    status: 'completed',
                    conclusion: 'success',
                    run_number: 42,
                    head_branch: 'main',
                },
                repository: {full_name: 'org/repo'},
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'workflow_run',
                payload: payload,
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            const parsed = event.parseGitHubPayload();
            expect(parsed.workflowName).toBe('CI Pipeline');
            expect(parsed.conclusion).toBe('success');
            expect(parsed.runNumber).toBe(42);
        });

        it('should parse Docker Hub webhook', () => {
            const payload = {
                push_data: {
                    tag: 'latest',
                    pushed_at: 1234567890,
                },
                repository: {
                    name: 'myapp',
                    namespace: 'org',
                    repo_name: 'org/myapp',
                },
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'image_push',
                payload: payload,
                source: 'dockerhub',
                status: 'pending',
                createdAt: new Date(),
            });

            const parsed = event.parseDockerPayload();
            expect(parsed.image).toBe('org/myapp');
            expect(parsed.tag).toBe('latest');
            expect(parsed.pushedAt).toBe(1234567890);
        });
    });

    describe('validation', () => {
        it('should validate required payload fields for push events', () => {
            const validPayload = {
                repository: {full_name: 'org/repo'},
                ref: 'refs/heads/main',
                commits: [],
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: validPayload,
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            expect(event.isValidPayload()).toBe(true);
        });

        it('should invalidate missing required fields', () => {
            const invalidPayload = {
                repository: {full_name: 'org/repo'},
                // missing ref
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: invalidPayload,
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            expect(event.isValidPayload()).toBe(false);
        });
    });

    describe('filtering and querying', () => {
        it('should check if event is from specific branch', () => {
            const payload = {
                ref: 'refs/heads/main',
            };

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: payload,
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            expect(event.isFromBranch('main')).toBe(true);
            expect(event.isFromBranch('develop')).toBe(false);
        });

        it('should check if event is successful', () => {
            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'workflow_run',
                payload: {
                    workflow_run: {
                        conclusion: 'success',
                    },
                },
                source: 'github',
                status: 'processed',
                createdAt: new Date(),
            });

            expect(event.isSuccessful()).toBe(true);
        });

        it('should check if event needs processing', () => {
            const pendingEvent = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: {},
                source: 'github',
                status: 'pending',
                createdAt: new Date(),
            });

            expect(pendingEvent.needsProcessing()).toBe(true);

            pendingEvent.markAsProcessed();
            expect(pendingEvent.needsProcessing()).toBe(false);
        });
    });

    describe('serialization', () => {
        it('should convert to JSON', () => {
            const now = new Date();
            const payload = {test: 'data'};

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: payload,
                source: 'github',
                status: 'pending',
                createdAt: now,
            });

            const json = event.toJSON();
            expect(json).toEqual({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: payload,
                source: 'github',
                status: 'pending',
                retryCount: 0,
                error: undefined,
                processedAt: undefined,
                createdAt: now.toISOString(),
            });
        });

        it('should include processed fields when processed', () => {
            const now = new Date();
            const processedTime = new Date();

            const event = new WebhookEvent({
                id: 1,
                projectId: 1,
                eventType: 'push',
                payload: {},
                source: 'github',
                status: 'pending',
                createdAt: now,
            });

            event.markAsProcessed();
            const json = event.toJSON();

            expect(json.status).toBe('processed');
            expect(json.processedAt).toBeDefined();
        });
    });
});