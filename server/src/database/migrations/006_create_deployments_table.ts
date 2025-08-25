import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('deployments', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.string('version', 100).notNullable();
        table.string('commit_sha', 100);
        table.string('branch', 100);
        table.enum('status', ['pending', 'in_progress', 'success', 'failed', 'rolled_back']).notNullable();
        table.enum('environment', ['development', 'staging', 'production']).notNullable();
        table.uuid('deployed_by').references('id').inTable('users').onDelete('SET NULL');
        table.jsonb('metadata').defaultTo('{}');
        table.text('logs');
        table.timestamp('started_at').notNullable();
        table.timestamp('completed_at');
        table.integer('duration_seconds');
        table.timestamps(true, true);

        // Indexes
        table.index(['project_id', 'status']);
        table.index(['project_id', 'environment']);
        table.index(['status']);
        table.index(['started_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('deployments');
}