import {Octokit} from '@octokit/rest';
import {MetricRepository} from '../repositories/MetricRepository';
import {MetricType} from '../entities/Metric';

export interface GitHubRepoMetrics {
    stars: number;
    forks: number;
    openIssues: number;
    openPullRequests: number;
    watchers: number;
    size: number;
    language: string | null;
    defaultBranch: string;
    lastPushAt: Date | null;
}

export interface GitHubWorkflowRun {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    createdAt: Date;
    updatedAt: Date;
    runNumber: number;
    event: string;
    branch: string;
}

export class GitHubService {
    private octokit: Octokit;
    private metricRepo: MetricRepository;

    constructor(token?: string) {
        this.octokit = new Octokit({
            auth: token || process.env.GITHUB_TOKEN,
        });
        this.metricRepo = new MetricRepository();
    }

    async getRepositoryMetrics(owner: string, repo: string): Promise<GitHubRepoMetrics> {
        try {
            const {data: repoData} = await this.octokit.repos.get({owner, repo});

            // Get open pull requests count
            const {data: pullRequests} = await this.octokit.pulls.list({
                owner,
                repo,
                state: 'open',
                per_page: 1,
            });

            return {
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                openIssues: repoData.open_issues_count,
                openPullRequests: pullRequests.length,
                watchers: repoData.watchers_count,
                size: repoData.size,
                language: repoData.language,
                defaultBranch: repoData.default_branch,
                lastPushAt: repoData.pushed_at ? new Date(repoData.pushed_at) : null,
            };
        } catch (error) {
            console.error('Failed to fetch GitHub repository metrics:', error);
            throw error;
        }
    }

    async getWorkflowRuns(owner: string, repo: string, limit = 10): Promise<GitHubWorkflowRun[]> {
        try {
            const {data} = await this.octokit.actions.listWorkflowRunsForRepo({
                owner,
                repo,
                per_page: limit,
            });

            return data.workflow_runs.map(run => ({
                id: run.id,
                name: run.name || 'Unknown',
                status: run.status || 'unknown',
                conclusion: run.conclusion,
                createdAt: new Date(run.created_at),
                updatedAt: new Date(run.updated_at),
                runNumber: run.run_number,
                event: run.event,
                branch: run.head_branch || 'unknown',
            }));
        } catch (error) {
            console.error('Failed to fetch GitHub workflow runs:', error);
            throw error;
        }
    }

    async getCommitActivity(owner: string, repo: string): Promise<number[]> {
        try {
            const {data} = await this.octokit.repos.getCommitActivityStats({
                owner,
                repo,
            });

            if (!data || data.length === 0) {
                return [];
            }

            // Return last 52 weeks of commit counts
            return data.map(week => week.total);
        } catch (error) {
            console.error('Failed to fetch GitHub commit activity:', error);
            throw error;
        }
    }

    async getContributors(owner: string, repo: string, limit = 10): Promise<any[]> {
        try {
            const {data} = await this.octokit.repos.listContributors({
                owner,
                repo,
                per_page: limit,
            });

            return data.map(contributor => ({
                login: contributor.login,
                avatarUrl: contributor.avatar_url,
                contributions: contributor.contributions,
                profileUrl: contributor.html_url,
            }));
        } catch (error) {
            console.error('Failed to fetch GitHub contributors:', error);
            throw error;
        }
    }

    async getLatestRelease(owner: string, repo: string): Promise<any> {
        try {
            const {data} = await this.octokit.repos.getLatestRelease({
                owner,
                repo,
            });

            return {
                tagName: data.tag_name,
                name: data.name,
                publishedAt: new Date(data.published_at),
                author: data.author?.login,
                downloadUrl: data.html_url,
            };
        } catch (error: any) {
            if (error.status === 404) {
                return null; // No releases found
            }
            console.error('Failed to fetch GitHub latest release:', error);
            throw error;
        }
    }

    async collectAndStoreMetrics(projectId: string, owner: string, repo: string): Promise<void> {
        try {
            const metrics = await this.getRepositoryMetrics(owner, repo);

            // Store metrics in database
            const metricsToStore = [
                {projectId, type: 'github_stars' as MetricType, value: metrics.stars},
                {projectId, type: 'github_forks' as MetricType, value: metrics.forks},
                {projectId, type: 'github_issues' as MetricType, value: metrics.openIssues},
                {projectId, type: 'github_prs' as MetricType, value: metrics.openPullRequests},
            ];

            await this.metricRepo.createBatch(metricsToStore);
            console.log(`GitHub metrics collected for project ${projectId}`);
        } catch (error) {
            console.error(`Failed to collect GitHub metrics for project ${projectId}:`, error);
            throw error;
        }
    }
}