import Redis from 'ioredis';
import {promisify} from 'util';

// Redis client configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};

// Create Redis client
export const redisClient = new Redis(redisConfig);

// Create pub/sub clients
export const publisher = new Redis(redisConfig);
export const subscriber = new Redis(redisConfig);

// Handle Redis connection events
redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis client error:', err);
});

subscriber.on('connect', () => {
    console.log('✅ Redis subscriber connected');
});

publisher.on('connect', () => {
    console.log('✅ Redis publisher connected');
});

// Cache utility functions
export class CacheService {
    private static DEFAULT_TTL = 3600; // 1 hour in seconds

    /**
     * Get value from cache
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache with optional TTL
     */
    static async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await redisClient.setex(key, ttl, serialized);
            } else {
                await redisClient.setex(key, this.DEFAULT_TTL, serialized);
            }
            return true;
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    static async delete(key: string): Promise<boolean> {
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    static async deletePattern(pattern: string): Promise<number> {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                return await redisClient.del(...keys);
            }
            return 0;
        } catch (error) {
            console.error(`Cache delete pattern error for ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    static async exists(key: string): Promise<boolean> {
        try {
            const result = await redisClient.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Set expiration time for a key
     */
    static async expire(key: string, seconds: number): Promise<boolean> {
        try {
            const result = await redisClient.expire(key, seconds);
            return result === 1;
        } catch (error) {
            console.error(`Cache expire error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Increment a counter
     */
    static async increment(key: string, amount: number = 1): Promise<number> {
        try {
            return await redisClient.incrby(key, amount);
        } catch (error) {
            console.error(`Cache increment error for key ${key}:`, error);
            return 0;
        }
    }

    /**
     * Get or set cache (cache-aside pattern)
     */
    static async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // If not in cache, call factory function
        const value = await factory();

        // Store in cache
        await this.set(key, value, ttl);

        return value;
    }

    /**
     * Clear all cache (use with caution!)
     */
    static async flush(): Promise<void> {
        try {
            await redisClient.flushdb();
            console.log('Cache flushed');
        } catch (error) {
            console.error('Cache flush error:', error);
        }
    }
}

// Pub/Sub utility functions
export class PubSubService {
    /**
     * Publish message to a channel
     */
    static async publish(channel: string, message: any): Promise<number> {
        try {
            const serialized = JSON.stringify(message);
            return await publisher.publish(channel, serialized);
        } catch (error) {
            console.error(`Publish error for channel ${channel}:`, error);
            return 0;
        }
    }

    /**
     * Subscribe to a channel
     */
    static subscribe(channel: string, callback: (message: any) => void): void {
        subscriber.subscribe(channel);
        subscriber.on('message', (ch, message) => {
            if (ch === channel) {
                try {
                    const parsed = JSON.parse(message);
                    callback(parsed);
                } catch (error) {
                    console.error(`Subscribe parse error for channel ${channel}:`, error);
                }
            }
        });
    }

    /**
     * Unsubscribe from a channel
     */
    static unsubscribe(channel: string): void {
        subscriber.unsubscribe(channel);
    }
}

// Session storage using Redis
export class SessionService {
    private static SESSION_PREFIX = 'session:';
    private static SESSION_TTL = 86400; // 24 hours

    /**
     * Create a session
     */
    static async create(sessionId: string, data: any): Promise<boolean> {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        return await CacheService.set(key, data, this.SESSION_TTL);
    }

    /**
     * Get session data
     */
    static async get(sessionId: string): Promise<any> {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        return await CacheService.get(key);
    }

    /**
     * Update session data
     */
    static async update(sessionId: string, data: any): Promise<boolean> {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        const current = await this.get(sessionId);
        if (current) {
            const updated = {...current, ...data};
            return await CacheService.set(key, updated, this.SESSION_TTL);
        }
        return false;
    }

    /**
     * Delete a session
     */
    static async destroy(sessionId: string): Promise<boolean> {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        return await CacheService.delete(key);
    }

    /**
     * Extend session TTL
     */
    static async touch(sessionId: string): Promise<boolean> {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        return await CacheService.expire(key, this.SESSION_TTL);
    }
}

// Rate limiting using Redis
export class RateLimiter {
    /**
     * Check rate limit
     */
    static async checkLimit(
        identifier: string,
        maxRequests: number,
        windowSeconds: number
    ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
        const key = `rate_limit:${identifier}`;
        const current = await CacheService.increment(key);

        if (current === 1) {
            await CacheService.expire(key, windowSeconds);
        }

        const ttl = await redisClient.ttl(key);
        const resetAt = new Date(Date.now() + ttl * 1000);

        return {
            allowed: current <= maxRequests,
            remaining: Math.max(0, maxRequests - current),
            resetAt,
        };
    }
}

// Export everything
export default {
    redisClient,
    publisher,
    subscriber,
    CacheService,
    PubSubService,
    SessionService,
    RateLimiter,
};