import express, {Application} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {errorHandler} from './middleware/errorHandler';
import {notFoundHandler} from './middleware/notFoundHandler';
import {rateLimiter} from './middleware/rateLimiter';
import {requestValidator} from './middleware/requestValidator';
import projectRoutes from './routes/projectRoutes';
import metricRoutes from './routes/metricRoutes';
import alertRoutes from './routes/alertRoutes';
import authRoutes from './routes/authRoutes';
import webhookRoutes from './routes/webhookRoutes';
import {testConnection} from './database/connection';

dotenv.config();

export class App {
    public app: Application;
    public server: any;
    public io: Server;
    private port: number;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || '3001', 10);
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeSocketIO();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security middleware
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            credentials: true,
            optionsSuccessStatus: 200,
        }));

        // Body parsing middleware
        this.app.use(express.json({limit: '10mb'}));
        this.app.use(express.urlencoded({extended: true, limit: '10mb'}));

        // Compression middleware
        this.app.use(compression());

        // Logging middleware
        if (process.env.NODE_ENV === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined'));
        }

        // Rate limiting
        this.app.use('/api/', rateLimiter);

        // Request validation
        this.app.use(requestValidator);

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        });
    }

    private initializeRoutes(): void {
        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/projects', projectRoutes);
        this.app.use('/api/metrics', metricRoutes);
        this.app.use('/api/alerts', alertRoutes);
        this.app.use('/api/webhooks', webhookRoutes);

        // API documentation route
        this.app.get('/api', (req, res) => {
            res.json({
                message: 'DevOps Dashboard API',
                version: '1.0.0',
                endpoints: {
                    auth: '/api/auth',
                    projects: '/api/projects',
                    metrics: '/api/metrics',
                    alerts: '/api/alerts',
                    webhooks: '/api/webhooks',
                    health: '/health',
                },
            });
        });
    }

    private initializeSocketIO(): void {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            // Join project-specific rooms
            socket.on('join-project', (projectId: string) => {
                socket.join(`project-${projectId}`);
                console.log(`Socket ${socket.id} joined project-${projectId}`);
            });

            // Leave project room
            socket.on('leave-project', (projectId: string) => {
                socket.leave(`project-${projectId}`);
                console.log(`Socket ${socket.id} left project-${projectId}`);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });

        // Attach io to app for use in controllers
        this.app.set('io', this.io);
    }

    private initializeErrorHandling(): void {
        // 404 handler
        this.app.use(notFoundHandler);

        // Global error handler
        this.app.use(errorHandler);
    }

    public async start(): Promise<void> {
        try {
            // Test database connection
            const dbConnected = await testConnection();
            if (!dbConnected) {
                console.warn('WARNING: Database connection failed. Running in limited mode.');
                console.warn('Some features may not work without database connection.');
            } else {
                console.log('Database connection successful');
            }

            // Start server regardless of database connection
            this.server.listen(this.port, () => {
                console.log(`Server is running on http://localhost:${this.port}`);
                console.log(`WebSocket server is ready for connections`);
                console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
                if (!dbConnected) {
                    console.log('Note: Database features are disabled');
                }
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    public getApp(): Application {
        return this.app;
    }

    public getIO(): Server {
        return this.io;
    }
}