import {Router} from 'express';
import {body, param, query} from 'express-validator';
import {ProjectController} from '../controllers/ProjectController';
import {requestValidator} from '../middleware/requestValidator';

const router = Router();
const controller = new ProjectController();

// GET /api/projects - Get all projects
router.get(
    '/',
    [
        query('status').optional().isIn(['active', 'inactive', 'archived']),
        query('search').optional().isString(),
    ],
    requestValidator,
    controller.getAll.bind(controller)
);

// GET /api/projects/:id - Get project by ID
router.get(
    '/:id',
    [param('id').isUUID()],
    requestValidator,
    controller.getById.bind(controller)
);

// POST /api/projects - Create new project
router.post(
    '/',
    [
        body('name').isString().notEmpty().isLength({max: 255}),
        body('description').optional().isString(),
        body('githubRepo').optional().isURL(),
        body('dockerImage').optional().isString(),
        body('status').optional().isIn(['active', 'inactive', 'archived']),
        body('environment').optional().isIn(['development', 'staging', 'production']),
    ],
    requestValidator,
    controller.create.bind(controller)
);

// PUT /api/projects/:id - Update project
router.put(
    '/:id',
    [
        param('id').isUUID(),
        body('name').optional().isString().notEmpty().isLength({max: 255}),
        body('description').optional().isString(),
        body('githubRepo').optional().isURL(),
        body('dockerImage').optional().isString(),
        body('status').optional().isIn(['active', 'inactive', 'archived']),
        body('environment').optional().isIn(['development', 'staging', 'production']),
    ],
    requestValidator,
    controller.update.bind(controller)
);

// DELETE /api/projects/:id - Delete project
router.delete(
    '/:id',
    [param('id').isUUID()],
    requestValidator,
    controller.delete.bind(controller)
);

// GET /api/projects/:id/metrics - Get project metrics
router.get(
    '/:id/metrics',
    [
        param('id').isUUID(),
        query('type').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    requestValidator,
    controller.getMetrics.bind(controller)
);

// GET /api/projects/:id/alerts - Get project alerts
router.get(
    '/:id/alerts',
    [
        param('id').isUUID(),
        query('status').optional().isIn(['active', 'inactive', 'acknowledged', 'resolved']),
    ],
    requestValidator,
    controller.getAlerts.bind(controller)
);

export default router;