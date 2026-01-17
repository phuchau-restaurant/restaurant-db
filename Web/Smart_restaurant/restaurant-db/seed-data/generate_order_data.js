/**
 * Large-Scale Order Data Generator for Smart Restaurant
 * 
 * Generates CSV files for: orders, order_details, order_item_modifiers,
 * payments, reviews, dish_ratings, and updates tables with current_order_id
 * 
 * Usage: node generate_order_data.js
 * 
 * @requires Input CSVs in ./input/ folder
 * @outputs CSVs to ./output/ folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION - Modify as needed
// ============================================
const CONFIG = {
    // Tenant IDs (from actual database)
    TENANT_ID1: '019abac9-846f-75d0-8dfd-bcf9c9457866',
    TENANT_ID2: '019bc623-e4a5-735d-9dc7-a9a6b28ee557',

    // Orders config
    ORDERS_PER_DAY: 30,                           // Average orders per day per tenant
    DATE_START: '2025-01-17T00:00:00+07:00',      // Start date (timestamptz)
    DATE_END: '2026-01-17T23:59:59+07:00',        // End date (timestamptz)

    // Payment config  
    TAX_RATE: 5,                                   // 5%
    SERVICE_CHARGE_RATE: 0,                        // 0%

    // Order details config
    MIN_ITEMS_PER_ORDER: 1,
    MAX_ITEMS_PER_ORDER: 7,
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 5,

    // Status distribution (must sum to 100)
    STATUS_DISTRIBUTION: {
        Paid: 50,
        Served: 15,
        Completed: 10,
        Pending: 10,
        Approved: 5,
        Unsubmit: 5,
        Cancelled: 5
    },

    // Reviews config
    REVIEW_RATE: 0.25,                            // 25% of paid orders get reviews
    RATING_DISTRIBUTION: { 5: 40, 4: 35, 3: 15, 2: 7, 1: 3 },

    // Input/Output paths
    INPUT_DIR: './input',
    OUTPUT_DIR: './output'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset(arr, minCount, maxCount) {
    const count = randomInt(minCount, Math.min(maxCount, arr.length));
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function weightedRandomChoice(distribution) {
    const entries = Object.entries(distribution);
    const total = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    let random = Math.random() * total;

    for (const [value, weight] of entries) {
        random -= weight;
        if (random <= 0) return value;
    }
    return entries[0][0];
}

function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).filter(l => l.trim()).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i]?.trim() || '';
        });
        return obj;
    });
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

function toCSV(headers, data) {
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}

function formatTimestamp(date) {
    return date.toISOString().replace('T', ' ').replace('Z', '+00');
}

function randomTimeBetween(start, end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return new Date(startTime + Math.random() * (endTime - startTime));
}

function getItemStatusForOrderStatus(orderStatus) {
    switch (orderStatus) {
        case 'Unsubmit': return null;
        case 'Approved': return 'Pending';
        case 'Pending': return randomChoice(['Pending', 'Ready']);
        case 'Completed': return 'Ready';
        case 'Served': return 'Served';
        case 'Paid': return 'Served';
        case 'Cancelled': return 'Cancelled';
        default: return 'Pending';
    }
}

// ============================================
// LOAD INPUT DATA
// ============================================

console.log('📂 Loading input data...\n');

const inputDir = path.join(__dirname, CONFIG.INPUT_DIR);

// Load all required CSVs
const dishes = parseCSV(fs.readFileSync(path.join(inputDir, 'dishes.csv'), 'utf-8'));
const modifierOptions = parseCSV(fs.readFileSync(path.join(inputDir, 'modifier_options.csv'), 'utf-8'));
const menuModifierGroups = parseCSV(fs.readFileSync(path.join(inputDir, 'menu_item_modifier_groups.csv'), 'utf-8'));
const tableIds = parseCSV(fs.readFileSync(path.join(inputDir, 'table_id.csv'), 'utf-8'));
const waiterIds = parseCSV(fs.readFileSync(path.join(inputDir, 'waiter_id.csv'), 'utf-8'));
const customerIds = parseCSV(fs.readFileSync(path.join(inputDir, 'customer_id.csv'), 'utf-8'));
const tablesOriginal = parseCSV(fs.readFileSync(path.join(inputDir, 'tables.csv'), 'utf-8'));

// Group data by tenant
const dataByTenant = {};
for (const tenantId of [CONFIG.TENANT_ID1, CONFIG.TENANT_ID2]) {
    dataByTenant[tenantId] = {
        dishes: dishes.filter(d => d.tenant_id === tenantId),
        tables: tableIds.filter(t => t.tenant_id === tenantId).map(t => parseInt(t.id)),
        waiters: waiterIds.filter(w => w.tenant_id === tenantId).map(w => parseInt(w.id)),
        customers: customerIds.filter(c => c.tenant_id === tenantId).map(c => parseInt(c.id)),
    };
}

// Build dish -> modifier options map
const dishModifierMap = {};
for (const dmg of menuModifierGroups) {
    const dishId = parseInt(dmg.dish_id);
    const groupId = parseInt(dmg.group_id);

    if (!dishModifierMap[dishId]) {
        dishModifierMap[dishId] = [];
    }

    const groupOptions = modifierOptions.filter(opt => parseInt(opt.group_id) === groupId);
    dishModifierMap[dishId].push(...groupOptions.map(opt => ({
        ...opt,
        group_id: groupId,
        id: modifierOptions.indexOf(opt) + 1 // 1-indexed
    })));
}

console.log('📊 Data Summary:');
console.log(`   Tenant 1: ${dataByTenant[CONFIG.TENANT_ID1].dishes.length} dishes, ${dataByTenant[CONFIG.TENANT_ID1].tables.length} tables`);
console.log(`   Tenant 2: ${dataByTenant[CONFIG.TENANT_ID2].dishes.length} dishes, ${dataByTenant[CONFIG.TENANT_ID2].tables.length} tables`);
console.log('');

// ============================================
// GENERATE DATA
// ============================================

const orders = [];
const orderDetails = [];
const orderItemModifiers = [];
const payments = [];
const reviews = [];
const dishRatingsMap = {};

let orderId = 1;
let orderDetailId = 1;
let orderItemModifierId = 1;
let paymentId = 1;
let reviewId = 1;

const startDate = new Date(CONFIG.DATE_START);
const endDate = new Date(CONFIG.DATE_END);
const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
const totalOrdersPerTenant = totalDays * CONFIG.ORDERS_PER_DAY;

console.log(`📝 Generating ${totalOrdersPerTenant} orders per tenant (${totalDays} days × ${CONFIG.ORDERS_PER_DAY}/day)...\n`);

for (const tenantId of [CONFIG.TENANT_ID1, CONFIG.TENANT_ID2]) {
    const tenantData = dataByTenant[tenantId];
    const tenantName = tenantId === CONFIG.TENANT_ID1 ? 'Tenant 1' : 'Tenant 2';

    console.log(`🏪 Processing ${tenantName}...`);

    for (let i = 0; i < totalOrdersPerTenant; i++) {
        // Generate order timestamp
        const createdAt = randomTimeBetween(startDate, endDate);

        // Random status based on distribution
        const status = weightedRandomChoice(CONFIG.STATUS_DISTRIBUTION);

        // Select random table, waiter, customer
        const tableId = randomChoice(tenantData.tables);
        const waiterId = status === 'Unsubmit' ? null : randomChoice(tenantData.waiters);
        const customerId = Math.random() > 0.3 ? randomChoice(tenantData.customers) : null;

        // Generate order details
        const itemCount = randomInt(CONFIG.MIN_ITEMS_PER_ORDER, CONFIG.MAX_ITEMS_PER_ORDER);
        const selectedDishes = randomSubset(tenantData.dishes, itemCount, itemCount);

        let totalAmount = 0;
        const currentOrderDetails = [];
        const currentModifiers = [];

        for (const dish of selectedDishes) {
            const dishId = parseInt(dish.id || dishes.indexOf(dish) + 1);
            const quantity = randomInt(CONFIG.MIN_QUANTITY, CONFIG.MAX_QUANTITY);
            const unitPrice = parseFloat(dish.price) || 50000;

            // Get modifiers for this dish
            const availableModifiers = dishModifierMap[dishId] || [];
            let modifierTotal = 0;
            const selectedModifiers = [];

            if (availableModifiers.length > 0) {
                // Group modifiers by group_id
                const modifiersByGroup = {};
                for (const mod of availableModifiers) {
                    const gid = mod.group_id;
                    if (!modifiersByGroup[gid]) modifiersByGroup[gid] = [];
                    modifiersByGroup[gid].push(mod);
                }

                // Select one modifier per group (for single selection groups)
                for (const [groupId, groupMods] of Object.entries(modifiersByGroup)) {
                    if (Math.random() > 0.4) { // 60% chance to add modifier
                        const selectedMod = randomChoice(groupMods);
                        const priceAdj = parseFloat(selectedMod.price_adjustment) || 0;
                        modifierTotal += priceAdj;
                        selectedModifiers.push({
                            modifier_option_id: selectedMod.id,
                            option_name: selectedMod.name,
                            price_adjustment: priceAdj
                        });
                    }
                }
            }

            const itemTotal = (unitPrice + modifierTotal) * quantity;
            totalAmount += itemTotal;

            const orderDetail = {
                id: orderDetailId,
                tenant_id: tenantId,
                order_id: orderId,
                dish_id: dishId,
                quantity: quantity,
                unit_price: unitPrice,
                note: Math.random() > 0.85 ? 'Ít cay' : '',
                status: getItemStatusForOrderStatus(status)
            };

            currentOrderDetails.push(orderDetail);

            // Add modifiers for this detail
            for (const mod of selectedModifiers) {
                currentModifiers.push({
                    id: orderItemModifierId++,
                    order_detail_id: orderDetailId,
                    modifier_option_id: mod.modifier_option_id,
                    option_name: mod.option_name,
                    created_at: formatTimestamp(createdAt)
                });
            }

            orderDetailId++;
        }

        // Calculate completed_at for completed orders
        let completedAt = null;
        if (['Completed', 'Served', 'Paid'].includes(status)) {
            completedAt = new Date(createdAt.getTime() + randomInt(15, 90) * 60000);
        }

        // Create order
        const order = {
            id: orderId,
            tenant_id: tenantId,
            table_id: tableId,
            customer_id: customerId,
            waiter_id: waiterId,
            status: status,
            total_amount: Math.round(totalAmount * 100) / 100,
            prep_time_order: randomInt(10, 60),
            created_at: formatTimestamp(createdAt),
            completed_at: completedAt ? formatTimestamp(completedAt) : ''
        };

        orders.push(order);
        orderDetails.push(...currentOrderDetails);
        orderItemModifiers.push(...currentModifiers);

        // Create payment for Paid/Served/Completed
        if (['Paid', 'Served', 'Completed'].includes(status)) {
            const subtotal = totalAmount;
            const discountPercent = subtotal >= 1000000 ? 15 : (subtotal >= 500000 ? 10 : 0);
            const discountAmount = subtotal * discountPercent / 100;
            const afterDiscount = subtotal - discountAmount;
            const taxAmount = afterDiscount * CONFIG.TAX_RATE / 100;
            const serviceChargeAmount = afterDiscount * CONFIG.SERVICE_CHARGE_RATE / 100;
            const finalAmount = afterDiscount + taxAmount + serviceChargeAmount;

            const paidAt = completedAt || new Date(createdAt.getTime() + randomInt(30, 120) * 60000);

            const payment = {
                id: paymentId++,
                tenant_id: tenantId,
                order_id: orderId,
                amount: Math.round(finalAmount * 100) / 100,
                subtotal: Math.round(subtotal * 100) / 100,
                discount_percent: discountPercent,
                discount_amount: Math.round(discountAmount * 100) / 100,
                tax_rate: CONFIG.TAX_RATE,
                tax_amount: Math.round(taxAmount * 100) / 100,
                service_charge_rate: CONFIG.SERVICE_CHARGE_RATE,
                service_charge_amount: Math.round(serviceChargeAmount * 100) / 100,
                payment_method: randomChoice(['Cash', 'Card', 'E-Wallet']),
                paid_at: formatTimestamp(paidAt)
            };

            payments.push(payment);

            // Generate review for some paid orders
            if (status === 'Paid' && customerId && Math.random() < CONFIG.REVIEW_RATE) {
                const rating = parseInt(weightedRandomChoice(CONFIG.RATING_DISTRIBUTION));
                const reviewedDish = randomChoice(currentOrderDetails);

                const review = {
                    id: reviewId++,
                    customer_id: customerId,
                    dish_id: reviewedDish.dish_id,
                    order_id: orderId,
                    rating: rating,
                    comment: rating >= 4 ? randomChoice(['Món ăn ngon!', 'Tuyệt vời!', 'Sẽ quay lại', '']) : randomChoice(['Bình thường', 'Cần cải thiện', '']),
                    created_at: formatTimestamp(paidAt)
                };

                reviews.push(review);

                // Track for dish_ratings
                if (!dishRatingsMap[reviewedDish.dish_id]) {
                    dishRatingsMap[reviewedDish.dish_id] = { total: 0, count: 0, ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
                }
                dishRatingsMap[reviewedDish.dish_id].total += rating;
                dishRatingsMap[reviewedDish.dish_id].count++;
                dishRatingsMap[reviewedDish.dish_id].ratings[rating]++;
            }
        }

        orderId++;

        // Progress indicator
        if ((i + 1) % 5000 === 0) {
            console.log(`   Processed ${i + 1}/${totalOrdersPerTenant} orders...`);
        }
    }

    console.log(`   ✅ ${totalOrdersPerTenant} orders generated\n`);
}

// ============================================
// GENERATE DISH RATINGS
// ============================================

const dishRatings = [];
let dishRatingId = 1;

for (const dish of dishes) {
    const dishId = parseInt(dish.id || dishes.indexOf(dish) + 1);
    const stats = dishRatingsMap[dishId] || { total: 0, count: 0, ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

    dishRatings.push({
        id: dishRatingId++,
        dish_id: dishId,
        total_reviews: stats.count,
        average_rating: stats.count > 0 ? Math.round(stats.total / stats.count * 10) / 10 : 0,
        rating_1: stats.ratings[1] || 0,
        rating_2: stats.ratings[2] || 0,
        rating_3: stats.ratings[3] || 0,
        rating_4: stats.ratings[4] || 0,
        rating_5: stats.ratings[5] || 0
    });
}

// ============================================
// UPDATE TABLES WITH current_order_id
// ============================================

console.log('🪑 Updating tables with current_order_id...');

// Find active orders (status not in Paid, Cancelled)
const activeStatuses = ['Unsubmit', 'Approved', 'Pending', 'Completed', 'Served'];
const activeOrders = orders.filter(o => activeStatuses.includes(o.status));

// Group by table_id, get most recent per table
const ordersByTable = {};
for (const order of activeOrders) {
    const tableKey = `${order.tenant_id}_${order.table_id}`;
    if (!ordersByTable[tableKey] || new Date(order.created_at) > new Date(ordersByTable[tableKey].created_at)) {
        ordersByTable[tableKey] = order;
    }
}

// Update tables
const tablesUpdated = tablesOriginal.map((table, index) => {
    const tableId = index + 1; // 1-indexed
    const tenantId = table.tenant_id;
    const tableKey = `${tenantId}_${tableId}`;

    const activeOrder = ordersByTable[tableKey];

    return {
        ...table,
        current_order_id: activeOrder ? activeOrder.id : '',
        status: activeOrder ? 'Occupied' : table.status
    };
});

const tablesWithActiveOrders = tablesUpdated.filter(t => t.current_order_id).length;
console.log(`   ✅ ${tablesWithActiveOrders} tables have active orders\n`);

// ============================================
// WRITE OUTPUT FILES
// ============================================

console.log('💾 Writing output files...\n');

const outputDir = path.join(__dirname, CONFIG.OUTPUT_DIR);

// Orders
fs.writeFileSync(
    path.join(outputDir, 'orders.csv'),
    toCSV(['id', 'tenant_id', 'table_id', 'customer_id', 'waiter_id', 'status', 'total_amount', 'prep_time_order', 'created_at', 'completed_at'], orders)
);
console.log(`   ✅ orders.csv: ${orders.length} rows`);

// Order Details
fs.writeFileSync(
    path.join(outputDir, 'order_details.csv'),
    toCSV(['id', 'tenant_id', 'order_id', 'dish_id', 'quantity', 'unit_price', 'note', 'status'], orderDetails)
);
console.log(`   ✅ order_details.csv: ${orderDetails.length} rows`);

// Order Item Modifiers
fs.writeFileSync(
    path.join(outputDir, 'order_item_modifiers.csv'),
    toCSV(['id', 'order_detail_id', 'modifier_option_id', 'option_name', 'created_at'], orderItemModifiers)
);
console.log(`   ✅ order_item_modifiers.csv: ${orderItemModifiers.length} rows`);

// Payments
fs.writeFileSync(
    path.join(outputDir, 'payments.csv'),
    toCSV(['id', 'tenant_id', 'order_id', 'amount', 'subtotal', 'discount_percent', 'discount_amount', 'tax_rate', 'tax_amount', 'service_charge_rate', 'service_charge_amount', 'payment_method', 'paid_at'], payments)
);
console.log(`   ✅ payments.csv: ${payments.length} rows`);

// Reviews
fs.writeFileSync(
    path.join(outputDir, 'reviews.csv'),
    toCSV(['id', 'customer_id', 'dish_id', 'order_id', 'rating', 'comment', 'created_at'], reviews)
);
console.log(`   ✅ reviews.csv: ${reviews.length} rows`);

// Dish Ratings
fs.writeFileSync(
    path.join(outputDir, 'dish_ratings.csv'),
    toCSV(['id', 'dish_id', 'total_reviews', 'average_rating', 'rating_1', 'rating_2', 'rating_3', 'rating_4', 'rating_5'], dishRatings)
);
console.log(`   ✅ dish_ratings.csv: ${dishRatings.length} rows`);

// Tables Updated
const tableHeaders = Object.keys(tablesUpdated[0]);
fs.writeFileSync(
    path.join(outputDir, 'tables_updated.csv'),
    toCSV(tableHeaders, tablesUpdated)
);
console.log(`   ✅ tables_updated.csv: ${tablesUpdated.length} rows`);

// ============================================
// SUMMARY
// ============================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 Data generation completed successfully!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n📊 Summary:`);
console.log(`   • Orders: ${orders.length.toLocaleString()}`);
console.log(`   • Order Details: ${orderDetails.length.toLocaleString()}`);
console.log(`   • Order Item Modifiers: ${orderItemModifiers.length.toLocaleString()}`);
console.log(`   • Payments: ${payments.length.toLocaleString()}`);
console.log(`   • Reviews: ${reviews.length.toLocaleString()}`);
console.log(`   • Dish Ratings: ${dishRatings.length}`);
console.log(`   • Tables with Active Orders: ${tablesWithActiveOrders}`);
console.log(`\n📁 Output files saved to: ${outputDir}`);
console.log('\n💡 Import to Supabase in this order:');
console.log('   1. orders.csv');
console.log('   2. order_details.csv');
console.log('   3. order_item_modifiers.csv');
console.log('   4. payments.csv');
console.log('   5. reviews.csv');
console.log('   6. dish_ratings.csv');
console.log('   7. tables_updated.csv (use UPDATE, not INSERT)\n');
