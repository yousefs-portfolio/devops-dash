import knex from 'knex';
import knexConfig from '../../knexfile';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
    throw new Error(`No database configuration found for environment: ${environment}`);
}

export const db = knex(config);

// Test database connection
export async function testConnection(): Promise<boolean> {
    try {
        await db.raw('SELECT 1');
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
    await db.destroy();
    console.log('Database connection closed');
}