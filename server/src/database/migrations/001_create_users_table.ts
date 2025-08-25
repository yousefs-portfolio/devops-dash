import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email', 255).notNullable().unique();
        table.string('username', 100).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table.string('full_name', 255);
        table.string('avatar_url', 500);
        table.enum('role', ['admin', 'developer', 'viewer']).defaultTo('viewer');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('last_login_at');
        table.timestamps(true, true);

        // Indexes
        table.index(['email']);
        table.index(['username']);
        table.index(['created_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('users');
}