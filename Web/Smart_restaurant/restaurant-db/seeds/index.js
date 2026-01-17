/**
 * Knex Seed File
 * Chạy dữ liệu mẫu theo thứ tự đúng Business Logic
 * Hỗ trợ 2 tenants
 * 
 * Usage: npm run seed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    CONFIG,
    generateCustomers,
    generateStaff,
    generateTables,
    generateOrder,
    generateReviews,
    generateDishRatings,
    randomChoice,
    randomInt
} from './helpers/dataGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seed(knex) {
    console.log('🌱 Running seed data for Smart Restaurant...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const TENANT_IDS = [CONFIG.TENANT_ID1, CONFIG.TENANT_ID2];

    try {
        // ============================================
        // STEP 1: Run base seed.sql
        // ============================================
        console.log('📄 Step 1: Running base seed.sql...');
        const seedSqlPath = path.join(__dirname, '..', 'seed-by-sql', 'seed.sql');

        if (fs.existsSync(seedSqlPath)) {
            const seedSql = fs.readFileSync(seedSqlPath, 'utf-8');

            // Split by semicolon and clean up each statement
            const statements = seedSql
                .split(';')
                .map(s => {
                    // Remove comment lines from each statement
                    const lines = s.split('\n')
                        .filter(line => !line.trim().startsWith('--'))
                        .join('\n')
                        .trim();
                    return lines;
                })
                .filter(s => s.length > 10 && s.toUpperCase().startsWith('INSERT'));

            let successCount = 0;
            let errorCount = 0;

            console.log(`   📦 Found ${statements.length} INSERT statements...`);

            for (const statement of statements) {
                try {
                    await knex.raw(statement);
                    successCount++;
                } catch (err) {
                    errorCount++;
                    if (err.message.includes('duplicate key')) {
                        // Silent for duplicates
                    } else {
                        console.log(`   ⚠️ SQL Error: ${err.message.substring(0, 150)}`);
                        console.log(`      Statement: ${statement.substring(0, 80)}...`);
                    }
                }
            }
            console.log(`   ✅ Base data: ${successCount} succeeded, ${errorCount} skipped/failed\n`);
        } else {
            console.log('   ⚠️ seed.sql not found, skipping base data\n');
        }

        // Process each tenant
        for (const tenantId of TENANT_IDS) {
            console.log(`\n🏪 Processing Tenant: ${tenantId.substring(0, 30)}...`);
            console.log('───────────────────────────────────────────────────────\n');

            // ============================================
            // STEP 2: Generate Staff (Users)
            // ============================================
            console.log('👥 Step 2: Generating staff...');
            const staffData = generateStaff(tenantId);
            const insertedStaff = [];

            for (const staff of staffData) {
                try {
                    const [inserted] = await knex('users')
                        .insert(staff)
                        .onConflict(['tenant_id', 'email'])
                        .ignore()
                        .returning('*');
                    if (inserted) insertedStaff.push(inserted);
                } catch (err) {
                    // Get existing if insert failed
                    const existing = await knex('users')
                        .where({ tenant_id: tenantId, email: staff.email })
                        .first();
                    if (existing) insertedStaff.push(existing);
                }
            }

            // Fetch all staff for this tenant
            const allStaff = await knex('users').where({ tenant_id: tenantId });
            console.log(`   ✅ ${allStaff.length} staff members\n`);

            // ============================================
            // STEP 3: Generate Customers
            // ============================================
            console.log('🧑‍🤝‍🧑 Step 3: Generating customers...');
            const customerData = generateCustomers(tenantId);

            for (const customer of customerData) {
                try {
                    await knex('customers')
                        .insert(customer)
                        .onConflict(['tenant_id', 'phone_number'])
                        .ignore();
                } catch (err) { /* ignore */ }
            }

            const allCustomers = await knex('customers').where({ tenant_id: tenantId });
            console.log(`   ✅ ${allCustomers.length} customers\n`);

            // ============================================
            // STEP 4: Generate Tables
            // ============================================
            console.log('🪑 Step 4: Generating tables...');
            const tableData = generateTables(tenantId);

            for (const table of tableData) {
                try {
                    await knex('tables')
                        .insert(table)
                        .onConflict(['tenant_id', 'table_number'])
                        .ignore();
                } catch (err) { /* ignore */ }
            }

            const allTables = await knex('tables').where({ tenant_id: tenantId });
            console.log(`   ✅ ${allTables.length} tables\n`);

            // ============================================
            // STEP 5: Fetch context for order generation
            // ============================================
            console.log('📊 Step 5: Fetching context data...');

            const [dishes, modifierGroups, modifierOptions] = await Promise.all([
                knex('dishes').where({ tenant_id: tenantId }),
                knex('modifier_groups').where({ tenant_id: tenantId }),
                knex('modifier_options')
            ]);

            // Build dish -> modifier options map
            const dishModifierGroupsRaw = await knex('menu_item_modifier_groups')
                .whereIn('dish_id', dishes.map(d => d.id));

            const dishModifierMap = {};
            for (const dmg of dishModifierGroupsRaw) {
                const groupOptions = modifierOptions.filter(opt => opt.group_id === dmg.group_id);
                dishModifierMap[dmg.dish_id] = [...(dishModifierMap[dmg.dish_id] || []), ...groupOptions];
            }

            console.log(`   📌 ${dishes.length} dishes, ${allTables.length} tables, ${allCustomers.length} customers\n`);

            // ============================================
            // STEP 6: Generate Orders
            // ============================================
            console.log('📝 Step 6: Generating orders...');

            // Safety check: Skip order generation if no dishes or tables
            if (dishes.length === 0 || allTables.length === 0) {
                console.log('   ⚠️ Skipping orders: No dishes or tables found for this tenant');
                console.log('   💡 Check if seed.sql base data was inserted correctly\n');
                continue; // Skip to next tenant
            }

            const context = {
                dishes,
                modifierOptions,
                dishModifierMap,
                tables: allTables,
                customers: allCustomers,
                staff: allStaff
            };

            const ordersCount = CONFIG.ORDERS_COUNT;
            let ordersCreated = 0;
            let paymentsCreated = 0;
            const createdOrders = [];

            for (let i = 0; i < ordersCount; i++) {
                const orderBundle = generateOrder(context, tenantId);
                const { order, orderDetails, payment, shouldUpdateTable } = orderBundle;

                // Insert order
                try {
                    const [insertedOrder] = await knex('orders')
                        .insert({
                            tenant_id: order.tenant_id,
                            table_id: order.table_id,
                            customer_id: order.customer_id,
                            waiter_id: order.waiter_id,
                            status: order.status,
                            total_amount: order.total_amount,
                            prep_time_order: order.prep_time_order,
                            created_at: order.created_at,
                            completed_at: order.completed_at
                        })
                        .returning('*');

                    const orderId = insertedOrder.id;
                    createdOrders.push(insertedOrder);
                    ordersCreated++;

                    // Insert order details
                    for (const detail of orderDetails) {
                        const [insertedDetail] = await knex('order_details')
                            .insert({
                                tenant_id: tenantId,
                                order_id: orderId,
                                dish_id: detail.dish_id,
                                quantity: detail.quantity,
                                unit_price: detail.unit_price,
                                note: detail.note,
                                status: detail.status
                            })
                            .returning('*');

                        // Insert modifiers
                        for (const modifier of detail.modifiers) {
                            await knex('order_item_modifiers').insert({
                                order_detail_id: insertedDetail.id,
                                modifier_option_id: modifier.modifier_option_id,
                                option_name: modifier.option_name
                            });
                        }
                    }

                    // Insert payment if exists
                    if (payment) {
                        await knex('payments').insert({
                            tenant_id: tenantId,
                            order_id: orderId,
                            amount: payment.amount,
                            subtotal: payment.subtotal,
                            tax_rate: payment.taxRate,
                            tax_amount: payment.taxAmount,
                            service_charge_rate: payment.serviceChargeRate,
                            service_charge_amount: payment.serviceChargeAmount,
                            discount_percent: payment.discountPercent,
                            discount_amount: payment.discountAmount,
                            payment_method: payment.payment_method,
                            payment_status: payment.payment_status,
                            paid_at: payment.paid_at
                        });
                        paymentsCreated++;
                    }

                    // Update table if needed
                    if (shouldUpdateTable && order.table_id) {
                        const currentTable = allTables.find(t => t.id === order.table_id);
                        if (currentTable && !currentTable.current_order_id) {
                            await knex('tables')
                                .where({ id: order.table_id })
                                .update({ current_order_id: orderId, status: 'Occupied' });
                            currentTable.current_order_id = orderId;
                        }
                    }
                } catch (err) {
                    console.log(`   ⚠️ Order error: ${err.message.substring(0, 50)}`);
                }
            }

            console.log(`   ✅ ${ordersCreated} orders, ${paymentsCreated} payments\n`);

            // ============================================
            // STEP 7: Generate Reviews
            // ============================================
            console.log('⭐ Step 7: Generating reviews...');

            const reviewsData = generateReviews(allCustomers, dishes, createdOrders, CONFIG.REVIEWS_COUNT);
            let reviewsCreated = 0;

            for (const review of reviewsData) {
                if (review.customer_id && review.dish_id) {
                    try {
                        await knex('reviews').insert({
                            customer_id: review.customer_id,
                            dish_id: review.dish_id,
                            order_id: review.order_id,
                            rating: review.rating,
                            comment: review.comment
                        });
                        reviewsCreated++;
                    } catch (err) { /* ignore */ }
                }
            }

            console.log(`   ✅ ${reviewsCreated} reviews\n`);

            // ============================================
            // STEP 8: Generate Dish Ratings (aggregate)
            // ============================================
            console.log('📊 Step 8: Generating dish ratings...');

            const allReviews = await knex('reviews')
                .whereIn('dish_id', dishes.map(d => d.id));

            const dishRatingsData = generateDishRatings(dishes, allReviews);
            let ratingsCreated = 0;

            for (const rating of dishRatingsData) {
                try {
                    // Check if exists
                    const existing = await knex('dish_ratings').where({ dish_id: rating.dish_id }).first();
                    if (existing) {
                        await knex('dish_ratings').where({ dish_id: rating.dish_id }).update(rating);
                    } else {
                        await knex('dish_ratings').insert(rating);
                    }
                    ratingsCreated++;
                } catch (err) { /* ignore */ }
            }

            console.log(`   ✅ ${ratingsCreated} dish ratings\n`);
        }

        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Seed completed successfully for both tenants!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Show summary
        const summary = await Promise.all([
            knex('tenants').count('* as count').first(),
            knex('users').count('* as count').first(),
            knex('customers').count('* as count').first(),
            knex('tables').count('* as count').first(),
            knex('orders').count('* as count').first(),
            knex('payments').count('* as count').first(),
            knex('reviews').count('* as count').first()
        ]);

        console.log('📊 Database Summary:');
        console.log(`   • Tenants: ${summary[0].count}`);
        console.log(`   • Staff: ${summary[1].count}`);
        console.log(`   • Customers: ${summary[2].count}`);
        console.log(`   • Tables: ${summary[3].count}`);
        console.log(`   • Orders: ${summary[4].count}`);
        console.log(`   • Payments: ${summary[5].count}`);
        console.log(`   • Reviews: ${summary[6].count}`);
        console.log('');

    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        throw error;
    }
}
