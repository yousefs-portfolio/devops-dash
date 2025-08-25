import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('projects', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 255).notNullable();
        table.text('description');
        table.string('github_repo', 500);
        table.string('docker_image', 500);
        table.enum('status', ['active', 'inactive', 'archived']).defaultTo('active');
        table.jsonb('settings').defaultTo('{}');
        table.jsonb('webhook_config').defaultTo('{}');
        table.string('deployment_url', 500);
        table.string('environment', 100).defaultTo('production');
        table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
        table.timestamps(true, true);

        // Indexes
        table.index(['name']);
        table.index(['status']);
        table.index(['created_at']);
        table.index(['created_by']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('projects');
}