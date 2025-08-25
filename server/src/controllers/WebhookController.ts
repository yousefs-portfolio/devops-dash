import {Request, Response, NextFunction} from 'express';
import {Server} from 'socket.io';

export class WebhookController {
    async handleGitHub(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.params.projectId;
            const event = req.headers['x-github-event'];
            const payload = req.body;

            console.log(`GitHub webhook received for project ${projectId}:`, event);

            // Process GitHub webhook based on event type
            const io = req.app.get('io') as Server;

            switch (event) {
                case 'push':
                    io.to(`project-${projectId}`).emit('github:push', {
                        projectId,
                        repository: payload.repository?.name,
                        branch: payload.ref?.replace('refs/heads/', ''),
                        commits: payload.commits?.length || 0,
                        pusher: payload.pusher?.name,
                    });
                    break;

                case 'pull_request':
                    io.to(`project-${projectId}`).emit('github:pull_request', {
                        projectId,
                        action: payload.action,
                        number: payload.pull_request?.number,
                        title: payload.pull_request?.title,
                        user: payload.pull_request?.user?.login,
                    });
                    break;

                case 'workflow_run':
                    io.to(`project-${projectId}`).emit('github:workflow', {
                        projectId,
                        name: payload.workflow_run?.name,
                        status: payload.workflow_run?.status,
                        conclusion: payload.workflow_run?.conclusion,
                    });
                    break;
            }

            res.status(200).json({message: 'Webhook processed'});
        } catch (error) {
            next(error);
        }
    }

    async handleDocker(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.params.projectId;
            const payload = req.body;

            console.log(`Docker webhook received for project ${projectId}`);

            // Process Docker webhook
            const io = req.app.get('io') as Server;
            io.to(`project-${projectId}`).emit('docker:update', {
                projectId,
                ...payload,
            });

            res.status(200).json({message: 'Webhook processed'});
        } catch (error) {
            next(error);
        }
    }

    async handleCustom(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.params.projectId;
            const payload = req.body;

            console.log(`Custom webhook received for project ${projectId}`);

            // Process custom webhook
            const io = req.app.get('io') as Server;
            io.to(`project-${projectId}`).emit('webhook:custom', {
                projectId,
                ...payload,
            });

            res.status(200).json({message: 'Webhook processed'});
        } catch (error) {
            next(error);
        }
    }
}