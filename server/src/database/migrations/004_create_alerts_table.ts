import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('alerts', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.string('name', 255).notNullable();
        table.text('description');
        table.enum('severity', ['critical', 'high', 'medium', 'low', 'info']).notNullable();
        table.enum('status', ['active', 'inactive', 'acknowledged', 'resolved']).defaultTo('active');
        table.string('metric_type', 100).notNullable();
        table.enum('condition', ['greater_than', 'less_than', 'equals', 'not_equals']).notNullable();
        table.decimal('threshold', 20, 6).notNullable();
        table.integer('duration_seconds').defaultTo(60);
        table.jsonb('notification_channels').defaultTo('[]');
        table.jsonb('metadata').defaultTo('{}');
        table.timestamp('triggered_at');
        table.timestamp('acknowledged_at');
        table.timestamp('resolved_at');
        table.uuid('acknowledged_by').references('id').inTable('users').onDelete('SET NULL');
        table.timestamps(true, true);

        // Indexes
        table.index(['project_id', 'status']);
        table.index(['status']);
        table.index(['severity']);
        table.index(['triggered_at']);
        table.index(['created_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('alerts');
}