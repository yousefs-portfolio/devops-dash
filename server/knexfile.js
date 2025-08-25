import dotenv from 'dotenv';
dotenv.config();
const config = {
    development: {
        client: 'postgresql',
        connection: {
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432'),
            user: process.env.DATABASE_USER || 'devops_user',
            password: process.env.DATABASE_PASSWORD || 'devops_pass',
            database: process.env.DATABASE_NAME || 'devops_dashboard',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './src/database/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './src/database/seeds',
            extension: 'ts',
        },
    },
    test: {
        client: 'postgresql',
        connection: {
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432'),
            user: process.env.DATABASE_USER || 'devops_user',
            password: process.env.DATABASE_PASSWORD || 'devops_pass',
            database: process.env.DATABASE_NAME ? `${process.env.DATABASE_NAME}_test` : 'devops_dashboard_test',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './src/database/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './src/database/seeds',
            extension: 'ts',
        },
    },
    production: {
        client: 'postgresql',
        connection: {
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT || '5432'),
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: { rejectUnauthorized: false },
        },
        pool: {
            min: 2,
            max: 20,
        },
        migrations: {
            directory: './dist/database/migrations',
            extension: 'js',
        },
        seeds: {
            directory: './dist/database/seeds',
            extension: 'js',
        },
    },
};
export default config;
//# sourceMappingURL=knexfile.js.map