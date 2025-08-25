import {User} from '../../entities/User';

export interface CreateUserDTO {
    email: string;
    username: string;
    passwordHash: string;
    fullName?: string;
    avatarUrl?: string;
    role?: 'admin' | 'developer' | 'viewer';
}

export interface UpdateUserDTO {
    email?: string;
    username?: string;
    passwordHash?: string;
    fullName?: string;
    avatarUrl?: string;
    role?: 'admin' | 'developer' | 'viewer';
    isActive?: boolean;
}

export interface UserFilters {
    email?: string;
    username?: string;
    role?: 'admin' | 'developer' | 'viewer';
    isActive?: boolean;
    search?: string;
}

export interface IUserRepository {
    create(data: CreateUserDTO): Promise<User>;

    findById(id: string): Promise<User | null>;

    findByEmail(email: string): Promise<User | null>;

    findByUsername(username: string): Promise<User | null>;

    findAll(filters?: UserFilters): Promise<User[]>;

    update(id: string, data: UpdateUserDTO): Promise<User | null>;

    delete(id: string): Promise<boolean>;

    updateLastLogin(id: string): Promise<void>;

    activate(id: string): Promise<User | null>;

    deactivate(id: string): Promise<User | null>;
}