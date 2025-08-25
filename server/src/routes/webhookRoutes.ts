import {Router} from 'express';
import {param} from 'express-validator';
import {WebhookController} from '../controllers/WebhookController';
import {requestValidator} from '../middleware/requestValidator';

const router = Router();
const controller = new WebhookController();

// POST /api/webhooks/github/:projectId - GitHub webhook endpoint
router.post(
    '/github/:projectId',
    [param('projectId').isUUID()],
    requestValidator,
    controller.handleGitHub.bind(controller)
);

// POST /api/webhooks/docker/:projectId - Docker webhook endpoint
router.post(
    '/docker/:projectId',
    [param('projectId').isUUID()],
    requestValidator,
    controller.handleDocker.bind(controller)
);

// POST /api/webhooks/custom/:projectId - Custom webhook endpoint
router.post(
    '/custom/:projectId',
    [param('projectId').isUUID()],
    requestValidator,
    controller.handleCustom.bind(controller)
);

export default router;