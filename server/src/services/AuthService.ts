import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {UserRepository} from '../repositories/UserRepository';
import {User} from '../entities/User';

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    fullName?: string;
}

export interface LoginData {
    emailOrUsername: string;
    password: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
    username: string;
    role: 'admin' | 'developer' | 'viewer';
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AuthResponse {
    user: Omit<User, 'password_hash'>;
    tokens: TokenResponse;
}

export class AuthService {
    private userRepo: UserRepository;
    private jwtSecret: string;
    private jwtExpiresIn: string;
    private jwtRefreshExpiresIn: string;
    private saltRounds: number = 10;

    constructor() {
        this.userRepo = new UserRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
        this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

        if (this.jwtSecret === 'default-secret-key' && process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET must be set in production environment');
        }
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        // Validate input
        await this.validateRegistration(data);

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, this.saltRounds);

        // Create user
        const user = await this.userRepo.create({
            email: data.email.toLowerCase(),
            username: data.username.toLowerCase(),
            passwordHash,
            fullName: data.fullName,
        });

        // Update last login
        await this.userRepo.updateLastLogin(user.id);

        // Generate tokens
        const tokens = this.generateTokens(user);

        return {
            user: user.toJSON(),
            tokens,
        };
    }

    async login(data: LoginData): Promise<AuthResponse> {
        const {emailOrUsername, password} = data;

        // Find user by email or username
        let user: User | null = null;

        if (emailOrUsername.includes('@')) {
            user = await this.userRepo.findByEmail(emailOrUsername.toLowerCase());
        } else {
            user = await this.userRepo.findByUsername(emailOrUsername.toLowerCase());
        }

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('Account is deactivated. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await this.userRepo.updateLastLogin(user.id);

        // Generate tokens
        const tokens = this.generateTokens(user);

        return {
            user: user.toJSON(),
            tokens,
        };
    }

    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        try {
            // Verify refresh token
            const payload = jwt.verify(refreshToken, this.jwtSecret) as TokenPayload & { type: string };

            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // Get user
            const user = await this.userRepo.findById(payload.userId);
            if (!user || !user.is_active) {
                throw new Error('User not found or inactive');
            }

            // Generate new tokens
            return this.generateTokens(user);
        } catch {
            throw new Error('Invalid refresh token');
        }
    }

    async verifyToken(token: string): Promise<TokenPayload> {
        try {
            const payload = jwt.verify(token, this.jwtSecret) as TokenPayload & { type: string };

            if (payload.type !== 'access') {
                throw new Error('Invalid token type');
            }

            return {
                userId: payload.userId,
                email: payload.email,
                username: payload.username,
                role: payload.role,
            };
        } catch {
            throw new Error('Invalid access token');
        }
    }

    async getCurrentUser(userId: string): Promise<Omit<User, 'password_hash'>> {
        const user = await this.userRepo.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }

        return user.toJSON();
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepo.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

        // Update password
        await this.userRepo.update(userId, {passwordHash});
    }

    async resetPassword(email: string): Promise<string> {
        const user = await this.userRepo.findByEmail(email.toLowerCase());

        if (!user) {
            // Don't reveal if email exists
            return 'If the email exists, a reset link has been sent';
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            {userId: user.id, type: 'password-reset'},
            this.jwtSecret,
            {expiresIn: '1h'}
        );

        // In production, send email with reset link
        // For now, return the token (should be sent via email)
        return resetToken;
    }

    async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
        try {
            // Verify reset token
            const payload = jwt.verify(resetToken, this.jwtSecret) as { userId: string; type: string };

            if (payload.type !== 'password-reset') {
                throw new Error('Invalid token type');
            }

            // Validate new password
            if (newPassword.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

            // Update password
            await this.userRepo.update(payload.userId, {passwordHash});
        } catch {
            throw new Error('Invalid or expired reset token');
        }
    }

    private generateTokens(user: User): TokenResponse {
        const payload: TokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        };

        // Generate access token
        const accessToken = jwt.sign(
            {...payload, type: 'access'},
            this.jwtSecret,
            {expiresIn: this.jwtExpiresIn}
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            {...payload, type: 'refresh'},
            this.jwtSecret,
            {expiresIn: this.jwtRefreshExpiresIn}
        );

        // Calculate expiration time in seconds
        const expiresIn = this.parseExpiresIn(this.jwtExpiresIn);

        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }

    private parseExpiresIn(expiresIn: string): number {
        const match = expiresIn.match(/^(\d+)([dhms])$/);
        if (!match) return 3600; // Default 1 hour

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'd':
                return value * 86400;
            case 'h':
                return value * 3600;
            case 'm':
                return value * 60;
            case 's':
                return value;
            default:
                return 3600;
        }
    }

    private async validateRegistration(data: RegisterData): Promise<void> {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Invalid email format');
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernameRegex.test(data.username)) {
            throw new Error('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens');
        }

        // Validate password strength
        if (data.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Check if email already exists
        const existingEmail = await this.userRepo.findByEmail(data.email.toLowerCase());
        if (existingEmail) {
            throw new Error('Email already registered');
        }

        // Check if username already exists
        const existingUsername = await this.userRepo.findByUsername(data.username.toLowerCase());
        if (existingUsername) {
            throw new Error('Username already taken');
        }
    }
}