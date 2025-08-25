import {Knex} from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries (careful in production!)
    await knex('users').del();

    // Hash passwords for test users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const devPassword = await bcrypt.hash('dev123', 10);
    const viewerPassword = await bcrypt.hash('viewer123', 10);

    // Insert seed entries
    await knex('users').insert([
        {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'admin@devops.local',
            username: 'admin',
            password_hash: adminPassword,
            full_name: 'Admin User',
            role: 'admin',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440002',
            email: 'developer@devops.local',
            username: 'developer',
            password_hash: devPassword,
            full_name: 'Developer User',
            role: 'developer',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440003',
            email: 'viewer@devops.local',
            username: 'viewer',
            password_hash: viewerPassword,
            full_name: 'Viewer User',
            role: 'viewer',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
    ]);

    console.log('Users seeded successfully');
    console.log('Test accounts created:');
    console.log('  Admin: admin@devops.local / admin123');
    console.log('  Developer: developer@devops.local / dev123');
    console.log('  Viewer: viewer@devops.local / viewer123');
}