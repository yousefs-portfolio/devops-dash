import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('metrics', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.enum('type', [
            'cpu_usage',
            'memory_usage',
            'disk_usage',
            'network_in',
            'network_out',
            'response_time',
            'error_rate',
            'uptime',
            'deployment_frequency',
            'lead_time',
            'mttr',
            'change_failure_rate',
            'custom'
        ]).notNullable();
        table.decimal('value', 20, 6).notNullable();
        table.string('unit', 50);
        table.jsonb('metadata').defaultTo('{}');
        table.jsonb('tags').defaultTo('[]');
        table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
        table.timestamps(true, true);

        // Indexes for efficient querying
        table.index(['project_id', 'type', 'timestamp']);
        table.index(['project_id', 'timestamp']);
        table.index(['type', 'timestamp']);
        table.index(['timestamp']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('metrics');
}