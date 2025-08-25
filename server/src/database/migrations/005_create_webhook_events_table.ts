import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('webhook_events', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.enum('source', ['github', 'gitlab', 'bitbucket', 'jenkins', 'circleci', 'custom']).notNullable();
        table.string('event_type', 100).notNullable();
        table.jsonb('payload').notNullable();
        table.jsonb('headers').defaultTo('{}');
        table.enum('status', ['pending', 'processed', 'failed']).defaultTo('pending');
        table.text('error_message');
        table.integer('retry_count').defaultTo(0);
        table.timestamp('processed_at');
        table.timestamps(true, true);

        // Indexes
        table.index(['project_id', 'status']);
        table.index(['source', 'event_type']);
        table.index(['status']);
        table.index(['created_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('webhook_events');
}