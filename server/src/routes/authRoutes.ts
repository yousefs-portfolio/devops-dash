import {Router} from 'express';
import {body} from 'express-validator';
import {AuthController} from '../controllers/AuthController';
import {requestValidator} from '../middleware/requestValidator';
import {authRateLimiter} from '../middleware/rateLimiter';
import {authenticateToken} from '../../middleware/auth';

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
        body('emailOrUsername').isString().notEmpty(),
        body('password').isString().notEmpty(),
    ],
    requestValidator,
    controller.login.bind(controller)
);

// POST /api/auth/logout - Logout user
router.post('/logout', controller.logout.bind(controller));

// POST /api/auth/refresh - Refresh token
router.post(
    '/refresh',
    [
        body('refreshToken').isString().notEmpty(),
    ],
    requestValidator,
    controller.refresh.bind(controller)
);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticateToken, controller.getCurrentUser.bind(controller));

// POST /api/auth/change-password - Change password (requires authentication)
router.post(
    '/change-password',
    authenticateToken,
    [
        body('oldPassword').isString().notEmpty(),
        body('newPassword').isString().isLength({min: 8}),
    ],
    requestValidator,
    controller.changePassword.bind(controller)
);

// POST /api/auth/reset-password - Request password reset
router.post(
    '/reset-password',
    authRateLimiter,
    [
        body('email').isEmail().normalizeEmail(),
    ],
    requestValidator,
    controller.resetPassword.bind(controller)
);

// POST /api/auth/reset-password/confirm - Confirm password reset
router.post(
    '/reset-password/confirm',
    authRateLimiter,
    [
        body('token').isString().notEmpty(),
        body('newPassword').isString().isLength({min: 8}),
    ],
    requestValidator,
    controller.confirmPasswordReset.bind(controller)
);

export default router;