import {Router} from 'express';
import {body, param, query} from 'express-validator';
import {AlertController} from '../controllers/AlertController';
import {requestValidator} from '../middleware/requestValidator';
import {authenticateToken} from '../../middleware/auth';

const router = Router();
const controller = new AlertController();

// GET /api/alerts - Get all alerts
router.get(
    '/',
    [
        query('projectId').optional().isUUID(),
        query('status').optional().isIn(['active', 'inactive', 'acknowledged', 'resolved']),
        query('severity').optional().isIn(['critical', 'high', 'medium', 'low', 'info']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    requestValidator,
    controller.getAll.bind(controller)
);

// GET /api/alerts/:id - Get alert by ID
router.get(
    '/:id',
    [param('id').isUUID()],
    requestValidator,
    controller.getById.bind(controller)
);

// POST /api/alerts - Create new alert
router.post(
    '/',
    [
        body('projectId').isUUID(),
        body('name').isString().notEmpty(),
        body('description').optional().isString(),
        body('severity').isIn(['critical', 'high', 'medium', 'low', 'info']),
        body('metricType').isString().notEmpty(),
        body('condition').isIn(['greater_than', 'less_than', 'equals', 'not_equals']),
        body('threshold').isNumeric(),
        body('durationSeconds').optional().isInt({min: 1}),
        body('notificationChannels').optional().isArray(),
    ],
    requestValidator,
    controller.create.bind(controller)
);

// PUT /api/alerts/:id - Update alert
router.put(
    '/:id',
    [
        param('id').isUUID(),
        body('name').optional().isString().notEmpty(),
        body('description').optional().isString(),
        body('severity').optional().isIn(['critical', 'high', 'medium', 'low', 'info']),
        body('status').optional().isIn(['active', 'inactive', 'acknowledged', 'resolved']),
        body('threshold').optional().isNumeric(),
    ],
    requestValidator,
    controller.update.bind(controller)
);

// POST /api/alerts/:id/acknowledge - Acknowledge alert (requires authentication)
router.post(
    '/:id/acknowledge',
    authenticateToken,
    [param('id').isUUID()],
    requestValidator,
    controller.acknowledge.bind(controller)
);

// POST /api/alerts/:id/resolve - Resolve alert
router.post(
    '/:id/resolve',
    [param('id').isUUID()],
    requestValidator,
    controller.resolve.bind(controller)
);

// DELETE /api/alerts/:id - Delete alert
router.delete(
    '/:id',
    [param('id').isUUID()],
    requestValidator,
    controller.delete.bind(controller)
);

// GET /api/alerts/stats - Get alert statistics
router.get(
    '/stats',
    [
        query('projectId').optional().isUUID(),
    ],
    requestValidator,
    controller.getStats.bind(controller)
);

export default router;