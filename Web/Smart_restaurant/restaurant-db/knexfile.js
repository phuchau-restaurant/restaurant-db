/**
 * Knex Configuration for Smart Restaurant Database
 * Sử dụng Session Pooler để hỗ trợ IPv4 với Supabase Free Tier
 */
import 'dotenv/config';

/** @type {import('knex').Knex.Config} */
export default {
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }  // Bắt buộc cho Supabase Pooler
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        directory: './migrations/knex',
        tableName: 'knex_migrations',
        extension: 'js'
    },
    seeds: {
        directory: './seeds'
    }
};
