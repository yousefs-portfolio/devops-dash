import {Router} from 'express';
import {body} from 'express-validator';
import {AuthController} from '../controllers/AuthController';
import {requestValidator} from '../middleware/requestValidator';
import {authRateLimiter} from '../middleware/rateLimiter';

const router = Router();
const controller = new AuthController();

// POST /api/auth/register - Register new user
router.post(
    '/register',
    authRateLimiter,
    [
        body('email').isEmail().normalizeEmail(),
        body('username').isString().isLength({min: 3, max: 30}),
        body('password').isString().isLength({min: 8}),
        body('fullName').optional().isString(),
    ],
    requestValidator,
    controller.register.bind(controller)
);

// POST /api/auth/login - Login user
router.post(
    '/login',
    authRateLimiter,
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isString(),
    ],
    requestValidator,
    controller.login.bind(controller)
);

// POST /api/auth/logout - Logout user
router.post('/logout', controller.logout.bind(controller));

// POST /api/auth/refresh - Refresh token
router.post('/refresh', controller.refresh.bind(controller));

// GET /api/auth/me - Get current user
router.get('/me', controller.getCurrentUser.bind(controller));

export default router;