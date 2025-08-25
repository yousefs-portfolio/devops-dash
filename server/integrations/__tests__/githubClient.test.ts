import {GitHubClient} from '../GitHubClient';
import {Octokit} from '@octokit/rest';

// Mock Octokit
jest.mock('@octokit/rest');

describe('GitHubClient', () => {
    let client: GitHubClient;
    let mockOctokit: jest.Mocked<Octokit>;

    beforeEach(() => {
        mockOctokit = {
            repos: {
                get: jest.fn(),
                listCommits: jest.fn(),
                listPullRequests: jest.fn(),
                listReleases: jest.fn(),
                getContent: jest.fn(),
            },
            issues: {
                listForRepo: jest.fn(),
                get: jest.fn(),
            },
            actions: {
                listWorkflowRuns: jest.fn(),
                listWorkflowRunsForRepo: jest.fn(),
                getWorkflowRun: jest.fn(),
            },
            pulls: {
                list: jest.fn(),
                get: jest.fn(),
            },
        } as any;

        (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit);
        client = new GitHubClient('test-token');
    });

    describe('fetchRepositoryMetrics', () => {
        it('should fetch repository metrics', async () => {
            mockOctokit.repos.get.mockResolvedValue({
                data: {
                    stargazers_count: 100,
                    forks_count: 50,
                    open_issues_count: 10,
                    watchers_count: 75,
                    size: 1024,
                    language: 'TypeScript',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-08-25T00:00:00Z',
                },
            } as any);

            const metrics = await client.fetchRepositoryMetrics('owner', 'repo');

            expect(metrics).toEqual({
                stars: 100,
                forks: 50,
                openIssues: 10,
                watchers: 75,
                size: 1024,
                language: 'TypeScript',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-08-25T00:00:00Z',
            });

            expect(mockOctokit.repos.get).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
            });
        });

        it('should handle API errors', async () => {
            mockOctokit.repos.get.mockRejectedValue(new Error('API Error'));

            await expect(client.fetchRepositoryMetrics('owner', 'repo'))
                .rejects.toThrow('Failed to fetch repository metrics: API Error');
        });
    });

    describe('fetchWorkflowRuns', () => {
        it('should fetch workflow runs', async () => {
            mockOctokit.actions.listWorkflowRunsForRepo.mockResolvedValue({
                data: {
                    workflow_runs: [
                        {
                            id: 1,
                            name: 'CI',
                            status: 'completed',
                            conclusion: 'success',
                            created_at: '2024-08-25T10:00:00Z',
                            updated_at: '2024-08-25T10:30:00Z',
                            run_number: 42,
                            event: 'push',
                            head_branch: 'main',
                            head_sha: 'abc123',
                            html_url: 'https://github.com/owner/repo/runs/1',
                        },
                        {
                            id: 2,
                            name: 'Deploy',
                            status: 'in_progress',
                            conclusion: null,
                            created_at: '2024-08-25T11:00:00Z',
                            updated_at: '2024-08-25T11:05:00Z',
                            run_number: 43,
                            event: 'workflow_dispatch',
                            head_branch: 'main',
                            head_sha: 'def456',
                            html_url: 'https://github.com/owner/repo/runs/2',
                        },
                    ],
                },
            } as any);

            const runs = await client.fetchWorkflowRuns('owner', 'repo');

            expect(runs).toHaveLength(2);
            expect(runs[0]).toEqual({
                id: 1,
                name: 'CI',
                status: 'completed',
                conclusion: 'success',
                createdAt: '2024-08-25T10:00:00Z',
                updatedAt: '2024-08-25T10:30:00Z',
                runNumber: 42,
                event: 'push',
                branch: 'main',
                commit: 'abc123',
                url: 'https://github.com/owner/repo/runs/1',
            });

            expect(mockOctokit.actions.listWorkflowRunsForRepo).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                per_page: 10,
            });
        });

        it('should filter by branch', async () => {
            mockOctokit.actions.listWorkflowRunsForRepo.mockResolvedValue({
                data: {workflow_runs: []},
            } as any);

            await client.fetchWorkflowRuns('owner', 'repo', {branch: 'develop'});

            expect(mockOctokit.actions.listWorkflowRunsForRepo).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                branch: 'develop',
                per_page: 10,
            });
        });

        it('should filter by status', async () => {
            mockOctokit.actions.listWorkflowRunsForRepo.mockResolvedValue({
                data: {workflow_runs: []},
            } as any);

            await client.fetchWorkflowRuns('owner', 'repo', {status: 'in_progress'});

            expect(mockOctokit.actions.listWorkflowRunsForRepo).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                status: 'in_progress',
                per_page: 10,
            });
        });

        it('should limit results', async () => {
            mockOctokit.actions.listWorkflowRunsForRepo.mockResolvedValue({
                data: {workflow_runs: []},
            } as any);

            await client.fetchWorkflowRuns('owner', 'repo', {limit: 5});

            expect(mockOctokit.actions.listWorkflowRunsForRepo).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                per_page: 5,
            });
        });
    });

    describe('fetchPullRequests', () => {
        it('should fetch pull requests', async () => {
            mockOctokit.pulls.list.mockResolvedValue({
                data: [
                    {
                        number: 123,
                        title: 'Add new feature',
                        state: 'open',
                        user: {login: 'developer'},
                        created_at: '2024-08-24T10:00:00Z',
                        updated_at: '2024-08-25T10:00:00Z',
                        head: {ref: 'feature-branch'},
                        base: {ref: 'main'},
                        html_url: 'https://github.com/owner/repo/pull/123',
                        draft: false,
                        merged: false,
                        mergeable: true,
                        additions: 100,
                        deletions: 50,
                        changed_files: 5,
                    },
                ],
            } as any);

            const prs = await client.fetchPullRequests('owner', 'repo');

            expect(prs).toHaveLength(1);
            expect(prs[0]).toEqual({
                number: 123,
                title: 'Add new feature',
                state: 'open',
                author: 'developer',
                createdAt: '2024-08-24T10:00:00Z',
                updatedAt: '2024-08-25T10:00:00Z',
                sourceBranch: 'feature-branch',
                targetBranch: 'main',
                url: 'https://github.com/owner/repo/pull/123',
                isDraft: false,
                isMerged: false,
                mergeable: true,
                additions: 100,
                deletions: 50,
                changedFiles: 5,
            });
        });

        it('should filter by state', async () => {
            mockOctokit.pulls.list.mockResolvedValue({data: []} as any);

            await client.fetchPullRequests('owner', 'repo', {state: 'closed'});

            expect(mockOctokit.pulls.list).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                state: 'closed',
                per_page: 30,
            });
        });
    });

    describe('fetchIssues', () => {
        it('should fetch issues', async () => {
            mockOctokit.issues.listForRepo.mockResolvedValue({
                data: [
                    {
                        number: 456,
                        title: 'Bug: Application crashes',
                        state: 'open',
                        user: {login: 'user1'},
                        labels: [{name: 'bug'}, {name: 'critical'}],
                        assignees: [{login: 'developer1'}],
                        created_at: '2024-08-20T10:00:00Z',
                        updated_at: '2024-08-25T10:00:00Z',
                        comments: 5,
                        html_url: 'https://github.com/owner/repo/issues/456',
                    },
                ],
            } as any);

            const issues = await client.fetchIssues('owner', 'repo');

            expect(issues).toHaveLength(1);
            expect(issues[0]).toEqual({
                number: 456,
                title: 'Bug: Application crashes',
                state: 'open',
                author: 'user1',
                labels: ['bug', 'critical'],
                assignees: ['developer1'],
                createdAt: '2024-08-20T10:00:00Z',
                updatedAt: '2024-08-25T10:00:00Z',
                comments: 5,
                url: 'https://github.com/owner/repo/issues/456',
            });
        });

        it('should filter by labels', async () => {
            mockOctokit.issues.listForRepo.mockResolvedValue({data: []} as any);

            await client.fetchIssues('owner', 'repo', {labels: ['bug', 'urgent']});

            expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                labels: 'bug,urgent',
                per_page: 30,
            });
        });
    });

    describe('fetchCommits', () => {
        it('should fetch commits', async () => {
            mockOctokit.repos.listCommits.mockResolvedValue({
                data: [
                    {
                        sha: 'abc123',
                        commit: {
                            message: 'Fix critical bug',
                            author: {
                                name: 'John Doe',
                                email: 'john@example.com',
                                date: '2024-08-25T10:00:00Z',
                            },
                        },
                        html_url: 'https://github.com/owner/repo/commit/abc123',
                    },
                ],
            } as any);

            const commits = await client.fetchCommits('owner', 'repo');

            expect(commits).toHaveLength(1);
            expect(commits[0]).toEqual({
                sha: 'abc123',
                message: 'Fix critical bug',
                author: 'John Doe',
                email: 'john@example.com',
                date: '2024-08-25T10:00:00Z',
                url: 'https://github.com/owner/repo/commit/abc123',
            });
        });

        it('should filter by branch', async () => {
            mockOctokit.repos.listCommits.mockResolvedValue({data: []} as any);

            await client.fetchCommits('owner', 'repo', {branch: 'develop'});

            expect(mockOctokit.repos.listCommits).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                sha: 'develop',
                per_page: 30,
            });
        });

        it('should filter by date range', async () => {
            mockOctokit.repos.listCommits.mockResolvedValue({data: []} as any);

            await client.fetchCommits('owner', 'repo', {
                since: '2024-08-01T00:00:00Z',
                until: '2024-08-31T23:59:59Z',
            });

            expect(mockOctokit.repos.listCommits).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                since: '2024-08-01T00:00:00Z',
                until: '2024-08-31T23:59:59Z',
                per_page: 30,
            });
        });
    });

    describe('fetchReleases', () => {
        it('should fetch releases', async () => {
            mockOctokit.repos.listReleases.mockResolvedValue({
                data: [
                    {
                        id: 1,
                        tag_name: 'v1.0.0',
                        name: 'Version 1.0.0',
                        body: 'Initial release',
                        draft: false,
                        prerelease: false,
                        created_at: '2024-08-01T10:00:00Z',
                        published_at: '2024-08-01T12:00:00Z',
                        html_url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
                        author: {login: 'maintainer'},
                    },
                ],
            } as any);

            const releases = await client.fetchReleases('owner', 'repo');

            expect(releases).toHaveLength(1);
            expect(releases[0]).toEqual({
                id: 1,
                tagName: 'v1.0.0',
                name: 'Version 1.0.0',
                body: 'Initial release',
                isDraft: false,
                isPrerelease: false,
                createdAt: '2024-08-01T10:00:00Z',
                publishedAt: '2024-08-01T12:00:00Z',
                url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
                author: 'maintainer',
            });
        });
    });
});