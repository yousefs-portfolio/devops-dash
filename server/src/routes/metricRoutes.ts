import {Router} from 'express';
import {body, query} from 'express-validator';
import {MetricController} from '../controllers/MetricController';
import {requestValidator} from '../middleware/requestValidator';

const router = Router();
const controller = new MetricController();

// POST /api/metrics - Create new metric
router.post(
    '/',
    [
        body('projectId').isUUID(),
        body('type').isString().notEmpty(),
        body('value').isNumeric(),
        body('unit').optional().isString(),
        body('timestamp').optional().isISO8601(),
        body('tags').optional().isArray(),
    ],
    requestValidator,
    controller.create.bind(controller)
);

// POST /api/metrics/batch - Create multiple metrics
router.post(
    '/batch',
    [
        body('metrics').isArray(),
        body('metrics.*.projectId').isUUID(),
        body('metrics.*.type').isString().notEmpty(),
        body('metrics.*.value').isNumeric(),
    ],
    requestValidator,
    controller.createBatch.bind(controller)
);

// GET /api/metrics - Get metrics with filters
router.get(
    '/',
    [
        query('projectId').optional().isUUID(),
        query('type').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('limit').optional().isInt({min: 1, max: 1000}),
    ],
    requestValidator,
    controller.getAll.bind(controller)
);

// GET /api/metrics/aggregate - Get aggregated metrics
router.get(
    '/aggregate',
    [
        query('projectId').isUUID(),
        query('type').isString(),
        query('startDate').isISO8601(),
        query('endDate').isISO8601(),
    ],
    requestValidator,
    controller.getAggregated.bind(controller)
);

// GET /api/metrics/timeseries - Get time series data
router.get(
    '/timeseries',
    [
        query('projectId').isUUID(),
        query('type').isString(),
        query('startDate').isISO8601(),
        query('endDate').isISO8601(),
        query('interval').optional().isString(),
    ],
    requestValidator,
    controller.getTimeSeries.bind(controller)
);

// DELETE /api/metrics/old - Delete old metrics
router.delete(
    '/old',
    [
        query('beforeDate').isISO8601(),
    ],
    requestValidator,
    controller.deleteOld.bind(controller)
);

export default router;