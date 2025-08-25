import {db} from '../database/connection';
import {User} from '../entities/User';
import {CreateUserDTO, IUserRepository, UpdateUserDTO, UserFilters,} from './interfaces/IUserRepository';

export class UserRepository implements IUserRepository {
    private table = 'users';

    async create(data: CreateUserDTO): Promise<User> {
        const [created] = await db(this.table)
            .insert({
                email: data.email,
                username: data.username,
                password_hash: data.passwordHash,
                full_name: data.fullName,
                avatar_url: data.avatarUrl,
                role: data.role || 'viewer',
                is_active: true,
            })
            .returning('*');

        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<User | null> {
        const result = await db(this.table).where({id}).first();
        return result ? this.mapToEntity(result) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await db(this.table).where({email}).first();
        return result ? this.mapToEntity(result) : null;
    }

    async findByUsername(username: string): Promise<User | null> {
        const result = await db(this.table).where({username}).first();
        return result ? this.mapToEntity(result) : null;
    }

    async findAll(filters?: UserFilters): Promise<User[]> {
        let query = db(this.table);

        if (filters) {
            if (filters.email) {
                query = query.where({email: filters.email});
            }
            if (filters.username) {
                query = query.where({username: filters.username});
            }
            if (filters.role) {
                query = query.where({role: filters.role});
            }
            if (filters.isActive !== undefined) {
                query = query.where({is_active: filters.isActive});
            }
            if (filters.search) {
                query = query.where(function () {
                    this.where('email', 'ilike', `%${filters.search}%`)
                        .orWhere('username', 'ilike', `%${filters.search}%`)
                        .orWhere('full_name', 'ilike', `%${filters.search}%`);
                });
            }
        }

        const results = await query.orderBy('created_at', 'desc');
        return results.map(this.mapToEntity);
    }

    async update(id: string, data: UpdateUserDTO): Promise<User | null> {
        const updateData: Record<string, unknown> = {};

        if (data.email !== undefined) updateData.email = data.email;
        if (data.username !== undefined) updateData.username = data.username;
        if (data.passwordHash !== undefined) updateData.password_hash = data.passwordHash;
        if (data.fullName !== undefined) updateData.full_name = data.fullName;
        if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;

        updateData.updated_at = new Date();

        const [updated] = await db(this.table)
            .where({id})
            .update(updateData)
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    async delete(id: string): Promise<boolean> {
        const deleted = await db(this.table).where({id}).delete();
        return deleted > 0;
    }

    async updateLastLogin(id: string): Promise<void> {
        await db(this.table)
            .where({id})
            .update({
                last_login_at: new Date(),
                updated_at: new Date(),
            });
    }

    async activate(id: string): Promise<User | null> {
        const [updated] = await db(this.table)
            .where({id})
            .update({
                is_active: true,
                updated_at: new Date(),
            })
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    async deactivate(id: string): Promise<User | null> {
        const [updated] = await db(this.table)
            .where({id})
            .update({
                is_active: false,
                updated_at: new Date(),
            })
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    private mapToEntity(row: Record<string, unknown>): User {
        return new User({
            id: row.id,
            email: row.email,
            username: row.username,
            password_hash: row.password_hash,
            full_name: row.full_name,
            avatar_url: row.avatar_url,
            role: row.role,
            is_active: row.is_active,
            last_login_at: row.last_login_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        });
    }
}