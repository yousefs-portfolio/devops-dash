export type WebhookEventType =
    | 'push'
    | 'pull_request'
    | 'deployment'
    | 'release'
    | 'workflow_run'
    | 'image_push'
    | 'issue'
    | 'issue_comment';

export type WebhookStatus = 'pending' | 'processed' | 'failed' | 'skipped';
export type WebhookSource = 'github' | 'gitlab' | 'bitbucket' | 'dockerhub' | 'custom';

interface WebhookEventProps {
    id?: number;
    projectId: number;
    eventType: WebhookEventType;
    payload: any;
    source: WebhookSource;
    status: WebhookStatus;
    retryCount?: number;
    error?: string;
    processedAt?: Date;
    createdAt: Date;
}

export class WebhookEvent {
    public readonly id?: number;
    public readonly projectId: number;
    public readonly eventType: WebhookEventType;
    public readonly payload: any;
    public readonly source: WebhookSource;
    public status: WebhookStatus;
    public retryCount: number;
    public error?: string;
    public processedAt?: Date;
    public readonly createdAt: Date;
    public lastTriggered?: Date;

    private static readonly MAX_RETRIES = 3;
    private static readonly VALID_EVENT_TYPES: WebhookEventType[] = [
        'push', 'pull_request', 'deployment', 'release',
        'workflow_run', 'image_push', 'issue', 'issue_comment'
    ];
    private static readonly VALID_STATUSES: WebhookStatus[] = [
        'pending', 'processed', 'failed', 'skipped'
    ];
    private static readonly VALID_SOURCES: WebhookSource[] = [
        'github', 'gitlab', 'bitbucket', 'dockerhub', 'custom'
    ];

    constructor(props: WebhookEventProps) {
        this.validateProps(props);

        this.id = props.id;
        this.projectId = props.projectId;
        this.eventType = props.eventType;
        this.payload = props.payload;
        this.source = props.source;
        this.status = props.status;
        this.retryCount = props.retryCount || 0;
        this.error = props.error;
        this.processedAt = props.processedAt;
        this.createdAt = props.createdAt;
    }

    private validateProps(props: WebhookEventProps): void {
        if (!WebhookEvent.VALID_EVENT_TYPES.includes(props.eventType)) {
            throw new Error('Invalid webhook event type');
        }

        if (!WebhookEvent.VALID_STATUSES.includes(props.status)) {
            throw new Error('Invalid webhook event status');
        }

        if (!WebhookEvent.VALID_SOURCES.includes(props.source)) {
            throw new Error('Invalid webhook source');
        }
    }

    public markAsProcessed(): void {
        this.status = 'processed';
        this.processedAt = new Date();
        this.error = undefined;
    }

    public markAsFailed(error: string): void {
        this.status = 'failed';
        this.error = error;
        this.processedAt = new Date();
    }

    public retry(): void {
        if (this.retryCount >= WebhookEvent.MAX_RETRIES) {
            throw new Error('Maximum retry attempts exceeded');
        }

        this.status = 'pending';
        this.retryCount++;
        this.error = undefined;
        this.processedAt = undefined;
    }

    public parseGitHubPayload(): any {
        if (this.source !== 'github') {
            throw new Error('Not a GitHub webhook');
        }

        switch (this.eventType) {
            case 'push':
                return {
                    repository: this.payload.repository?.full_name,
                    branch: this.payload.ref?.replace('refs/heads/', ''),
                    commitCount: this.payload.commits?.length || 0,
                    pusher: this.payload.pusher?.name,
                };

            case 'pull_request':
                return {
                    action: this.payload.action,
                    prNumber: this.payload.pull_request?.number,
                    prTitle: this.payload.pull_request?.title,
                    author: this.payload.pull_request?.user?.login,
                    sourceBranch: this.payload.pull_request?.head?.ref,
                    targetBranch: this.payload.pull_request?.base?.ref,
                };

            case 'workflow_run':
                return {
                    workflowName: this.payload.workflow_run?.name,
                    conclusion: this.payload.workflow_run?.conclusion,
                    runNumber: this.payload.workflow_run?.run_number,
                    branch: this.payload.workflow_run?.head_branch,
                };

            default:
                return this.payload;
        }
    }

    public parseDockerPayload(): any {
        if (this.source !== 'dockerhub') {
            throw new Error('Not a Docker Hub webhook');
        }

        return {
            image: this.payload.repository?.repo_name,
            tag: this.payload.push_data?.tag,
            pushedAt: this.payload.push_data?.pushed_at,
            namespace: this.payload.repository?.namespace,
        };
    }

    public isValidPayload(): boolean {
        if (!this.payload || typeof this.payload !== 'object') {
            return false;
        }

        switch (this.eventType) {
            case 'push':
                return !!(this.payload.repository && this.payload.ref);

            case 'pull_request':
                return !!(this.payload.action && this.payload.pull_request);

            case 'workflow_run':
                return !!(this.payload.action && this.payload.workflow_run);

            case 'image_push':
                return !!(this.payload.push_data && this.payload.repository);

            default:
                return true;
        }
    }

    public isFromBranch(branch: string): boolean {
        if (this.eventType === 'push') {
            const ref = this.payload.ref;
            return ref === `refs/heads/${branch}`;
        }

        if (this.eventType === 'pull_request') {
            return this.payload.pull_request?.base?.ref === branch;
        }

        if (this.eventType === 'workflow_run') {
            return this.payload.workflow_run?.head_branch === branch;
        }

        return false;
    }

    public isSuccessful(): boolean {
        if (this.status !== 'processed') {
            return false;
        }

        if (this.eventType === 'workflow_run') {
            return this.payload.workflow_run?.conclusion === 'success';
        }

        if (this.eventType === 'deployment') {
            return this.payload.deployment?.status === 'success';
        }

        return true;
    }

    public needsProcessing(): boolean {
        return this.status === 'pending';
    }

    public toJSON(): any {
        return {
            id: this.id,
            projectId: this.projectId,
            eventType: this.eventType,
            payload: this.payload,
            source: this.source,
            status: this.status,
            retryCount: this.retryCount,
            error: this.error,
            processedAt: this.processedAt?.toISOString(),
            createdAt: this.createdAt.toISOString(),
        };
    }
}