export interface UserEntity {
    id: string;
    email: string;
    username: string;
    password_hash: string;
    full_name?: string;
    avatar_url?: string;
    role: 'admin' | 'developer' | 'viewer';
    is_active: boolean;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export class User {
    public readonly id: string;
    public email: string;
    public username: string;
    public password_hash: string;
    public full_name?: string;
    public avatar_url?: string;
    public role: 'admin' | 'developer' | 'viewer';
    public is_active: boolean;
    public last_login_at?: Date;
    public readonly created_at: Date;
    public readonly updated_at: Date;

    constructor(entity: UserEntity) {
        this.id = entity.id;
        this.email = entity.email;
        this.username = entity.username;
        this.password_hash = entity.password_hash;
        this.full_name = entity.full_name;
        this.avatar_url = entity.avatar_url;
        this.role = entity.role;
        this.is_active = entity.is_active;
        this.last_login_at = entity.last_login_at;
        this.created_at = entity.created_at;
        this.updated_at = entity.updated_at;
    }

    toJSON(): Omit<UserEntity, 'password_hash'> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {password_hash, ...publicData} = this;
        return publicData as Omit<UserEntity, 'password_hash'>;
    }

    hasRole(requiredRole: 'admin' | 'developer' | 'viewer'): boolean {
        const roleHierarchy = {
            admin: 3,
            developer: 2,
            viewer: 1,
        };
        return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
    }

    canEdit(): boolean {
        return this.hasRole('developer');
    }

    canDelete(): boolean {
        return this.role === 'admin';
    }

    updateLastLogin(): void {
        this.last_login_at = new Date();
    }
}