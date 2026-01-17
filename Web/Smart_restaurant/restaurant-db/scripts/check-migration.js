/**
 * Check Migration Status Script
 * Kiểm tra database có cần migrate không
 * 
 * Usage: npm run db:check
 * Exit codes:
 *   0 - Database is up to date
 *   1 - Migrations pending
 *   2 - Error occurred
 */

import 'dotenv/config';
import knex from 'knex';
import config from '../knexfile.js';

async function checkMigrationStatus() {
    const db = knex(config);

    try {
        console.log('🔍 Checking database migration status...\n');

        // Test connection
        await db.raw('SELECT 1');
        console.log('✅ Database connection successful\n');

        // Get migration status
        const [completed, pending] = await db.migrate.list();

        if (pending.length === 0) {
            console.log('✨ Database is up to date!');
            console.log(`   Total migrations run: ${completed.length}`);
            await db.destroy();
            process.exit(0);
        } else {
            console.log('⚠️  Pending migrations found:\n');
            pending.forEach((migration, index) => {
                console.log(`   ${index + 1}. ${migration}`);
            });
            console.log(`\n📋 Summary:`);
            console.log(`   - Completed: ${completed.length}`);
            console.log(`   - Pending: ${pending.length}`);
            console.log(`\n💡 Run 'npm run migrate' to apply pending migrations.`);
            await db.destroy();
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error checking migration status:', error.message);

        if (error.message.includes('connect')) {
            console.log('\n💡 Tips:');
            console.log('   1. Check DATABASE_URL in .env file');
            console.log('   2. Ensure Supabase project is active');
            console.log('   3. Verify network connection');
        }

        await db.destroy();
        process.exit(2);
    }
}

checkMigrationStatus();
