/**
 * Data Generator for Smart Restaurant
 * Tạo dữ liệu mẫu hợp lý theo Business_Logic.md
 * 
 * @requires Edit CONFIG section below before running
 */

// ============================================
// CONFIG - THAY ĐỔI THEO NHU CẦU
// ============================================
export const CONFIG = {
    // Tenant IDs (đã seed từ seed.sql) - UUID hợp lệ
    TENANT_ID1: '019abac9-846f-75d0-8dfd-bcf9c9457866', //đã config dựa theo database thực
    TENANT_ID2: '019bc623-e4a5-735d-9dc7-a9a6b28ee557',

    // Legacy - để tương thích
    get TENANT_ID() { return this.TENANT_ID1; },

    // Số lượng dữ liệu cần tạo (cho mỗi tenant)
    ORDERS_COUNT: 15,           // Số orders
    CUSTOMERS_COUNT: 8,         // Số customers  
    STAFF_COUNT: 4,             // Số nhân viên (waiter/chef/admin)
    TABLES_COUNT: 12,           // Số bàn
    REVIEWS_COUNT: 15,          // Số reviews

    // Cài đặt thanh toán (từ tenant settings)
    TAX_RATE: 5.00,             // % thuế
    SERVICE_CHARGE_RATE: 0.00,  // % phí dịch vụ
    DISCOUNT_RULES: [
        { min_order: 500000, discount_percent: 10 },
        { min_order: 1000000, discount_percent: 15 }
    ]
};

// ============================================
// STATIC DATA - Platform Users, App Settings
// ============================================

/**
 * Default password for all seeded users: 123456
 * Bcrypt hash with salt 10
 */
export const DEFAULT_PASSWORD_HASH = '$2b$10$l0qOmn3cEmCq5Z.DO/pzPu47Gk15IK7iVVsU4oMiXHtd8sqelAPge';

/**
 * Platform Users (Super Admin)
 * Password: 123456
 */
export const PLATFORM_USERS = [
    {
        email: 'superadmin@gmail.com',
        password_hash: DEFAULT_PASSWORD_HASH,
        role: 'super_admin',
        name: 'Super_Admin'
    }
];

/**
 * App Settings cho tenant 1
 */
export const APP_SETTINGS_TENANT1 = [
    // Icon Danh mục món
    { key: 'Appetizers', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/fork_plate_white.svg', value_type: 'string', category: 'icon Danh mục món', description: 'Icon nĩa dĩa', is_system: false },
    { key: 'Beverage', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/wine_bottle_white.svg', value_type: 'string', category: 'icon Danh mục món', description: 'Icon ly rượu + chai', is_system: false },
    { key: 'Main course', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/kitchen-pack-steam.svg', value_type: 'string', category: 'icon Danh mục món', description: 'Icon bát to', is_system: false },
    { key: 'All', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/menu_fork_white.svg', value_type: 'string', category: 'icon Danh mục món', description: 'Icon hiển thị tất cả món', is_system: false },

    // Avatar mẫu cho khách hàng
    { key: 'customer1', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt1.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 1', is_system: false },
    { key: 'customer2', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt2.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 2', is_system: false },
    { key: 'customer3', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt3.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 3', is_system: false },
    { key: 'customer4', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt4.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 4', is_system: false },
    { key: 'customer5', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt5.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 5', is_system: false },
    { key: 'customer6', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt6.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 6', is_system: false },

    // Location của bàn
    { key: 'location_indoor', value: 'Indoor', value_type: 'string', category: 'Location', description: 'Vị trí bàn trong nhà', is_system: false },
    { key: 'location_outdoor', value: 'Outdoor', value_type: 'string', category: 'Location', description: 'Vị trí bàn ngoài trời', is_system: false },
    { key: 'location_patio', value: 'Patio', value_type: 'string', category: 'Location', description: 'Vị trí bàn sân thượng', is_system: false },
    { key: 'location_vip', value: 'VIP_Room', value_type: 'string', category: 'Location', description: 'Phòng VIP', is_system: false },
];

/**
 * App Settings cho tenant 2 (với một số thay đổi nhỏ)
 */
export const APP_SETTINGS_TENANT2 = [
    // Icon Danh mục món - dùng icon khác
    { key: 'Appetizers', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/salad%20(1).png', value_type: 'string', category: 'icon Danh mục món', description: 'Icon dĩa salad', is_system: false },
    { key: 'Beverage', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/tea_cup_black.svg', value_type: 'string', category: 'icon Danh mục món', description: 'Icon ly trà', is_system: false },
    { key: 'Main course', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/dinner.png', value_type: 'string', category: 'icon Danh mục món', description: 'Icon nồi', is_system: false },
    { key: 'All', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/menu_fork_white.svg', value_type: 'string', category: 'icon Danh mục món', description: 'Icon hiển thị tất cả món', is_system: false },

    // Avatar mẫu
    { key: 'customer1', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt1.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 1', is_system: false },
    { key: 'customer2', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt2.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 2', is_system: false },
    { key: 'customer3', value: 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt3.svg', value_type: 'string', category: 'avatar', description: 'Avatar mẫu 3', is_system: false },

    // Location
    { key: 'location_indoor', value: 'Indoor', value_type: 'string', category: 'Location', description: 'Vị trí bàn trong nhà', is_system: false },
    { key: 'location_outdoor', value: 'Outdoor', value_type: 'string', category: 'Location', description: 'Vị trí bàn ngoài trời', is_system: false },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function randomSubset(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

export function generatePhone() {
    const prefixes = ['090', '091', '093', '094', '096', '097', '098', '099', '086', '088'];
    return randomChoice(prefixes) + String(randomInt(1000000, 9999999));
}

export function generateEmail(name) {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
    const cleanName = name.toLowerCase().replace(/\s+/g, '.').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `${cleanName}${randomInt(1, 999)}@${randomChoice(domains)}`;
}

export function calculateDiscount(subtotal, rules) {
    let discountPercent = 0;
    for (const rule of rules) {
        if (subtotal >= rule.min_order && rule.discount_percent > discountPercent) {
            discountPercent = rule.discount_percent;
        }
    }
    return discountPercent;
}

export function calculatePayment(subtotal, config = CONFIG) {
    const discountPercent = calculateDiscount(subtotal, config.DISCOUNT_RULES);
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (config.TAX_RATE / 100);
    const serviceChargeAmount = afterDiscount * (config.SERVICE_CHARGE_RATE / 100);
    const amount = afterDiscount + taxAmount + serviceChargeAmount;

    return {
        subtotal,
        discountPercent,
        discountAmount,
        taxRate: config.TAX_RATE,
        taxAmount,
        serviceChargeRate: config.SERVICE_CHARGE_RATE,
        serviceChargeAmount,
        amount
    };
}

function weightedRandomChoice(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [_, w]) => sum + w, 0);
    let random = Math.random() * total;
    for (const [key, weight] of entries) {
        random -= weight;
        if (random <= 0) return key;
    }
    return entries[0][0];
}

function randomPastDate(daysAgo) {
    const now = new Date();
    const pastMs = now.getTime() - randomInt(0, daysAgo * 24 * 60 * 60 * 1000);
    return new Date(pastMs);
}

// ============================================
// STATUS ENUMS
// ============================================

export const OrderStatuses = ['Unsubmit', 'Approved', 'Pending', 'Completed', 'Served', 'Paid', 'Cancelled'];
export const ItemStatuses = ['Pending', 'Ready', 'Served', 'Cancelled'];
export const TableStatuses = ['Active', 'Inactive', 'Available', 'Occupied'];
export const TableLocations = ['Indoor', 'Outdoor', 'Patio', 'VIP_Room'];
export const PaymentMethods = ['Cash', 'Card', 'E-Wallet'];

export function getCompatibleItemStatus(orderStatus) {
    switch (orderStatus) {
        case 'Unsubmit':
        case 'Approved':
            return null;
        case 'Pending':
            return randomChoice(['Pending', 'Ready']);
        case 'Completed':
            return 'Ready';
        case 'Served':
        case 'Paid':
            return 'Served';
        case 'Cancelled':
            return 'Cancelled';
        default:
            return 'Pending';
    }
}

export function shouldTableHaveCurrentOrder(orderStatus) {
    return ['Unsubmit', 'Approved', 'Pending', 'Completed', 'Served'].includes(orderStatus);
}

// ============================================
// DATA TEMPLATES
// ============================================

export const SAMPLE_NAMES = [
    'Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Cường',
    'Phạm Minh Đức', 'Hoàng Thu Hà', 'Vũ Quang Huy',
    'Đỗ Thị Lan', 'Bùi Văn Minh', 'Ngô Thị Nga',
    'Dương Văn Phong', 'Lý Thị Quỳnh', 'Mai Văn Sơn'
];

export const SAMPLE_STAFF = [
    { name: 'Nguyễn Văn Tú', role: 'Admin' },
    { name: 'Trần Minh Khang', role: 'Waiter' },
    { name: 'Lê Thị Mai', role: 'Waiter' },
    { name: 'Phạm Hoàng Long', role: 'Chef' },
    { name: 'Vũ Thanh Tùng', role: 'Chef' }
];

export const SAMPLE_REVIEWS = [
    'Món ăn ngon, phục vụ tốt!',
    'Giá hơi cao nhưng chất lượng OK',
    'Sẽ quay lại lần sau',
    'Đồ ăn ngon, không gian đẹp',
    'Phục vụ hơi chậm',
    'Món này ngon lắm, đáng thử!',
    'Tuyệt vời! Highly recommend',
    'Bình thường thôi',
    'Rất hài lòng',
    'Phần ăn hơi ít',
    null, null, null // Some reviews without comment
];

// ============================================
// GENERATOR FUNCTIONS
// ============================================

export function generateCustomers(tenantId, count = CONFIG.CUSTOMERS_COUNT) {
    const customers = [];
    for (let i = 0; i < count; i++) {
        const name = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
        customers.push({
            tenant_id: tenantId,
            full_name: name,
            phone_number: generatePhone(),
            email: generateEmail(name),
            loyalty_points: randomInt(0, 500),
            is_active: true
        });
    }
    return customers;
}

export function generateStaff(tenantId, count = CONFIG.STAFF_COUNT) {
    const staff = [];
    for (let i = 0; i < count; i++) {
        const template = SAMPLE_STAFF[i % SAMPLE_STAFF.length];
        staff.push({
            tenant_id: tenantId,
            email: generateEmail(template.name),
            password_hash: DEFAULT_PASSWORD_HASH, // Password: 123456
            full_name: template.name,
            role: template.role,
            is_active: true,
            phone_number: generatePhone()
        });
    }
    return staff;
}

export function generateTables(tenantId, count = CONFIG.TABLES_COUNT) {
    const tables = [];
    for (let i = 0; i < count; i++) {
        const isVip = i < 2;
        tables.push({
            tenant_id: tenantId,
            table_number: isVip ? `VIP${i + 1}` : `A${i - 1}`,
            capacity: isVip ? randomInt(6, 10) : randomInt(2, 6),
            location: isVip ? 'VIP_Room' : randomChoice(['Indoor', 'Outdoor', 'Patio']),
            status: 'Available',
            is_vip: isVip,
            current_order_id: null
        });
    }
    return tables;
}

export function generateOrder(context, tenantId) {
    const { dishes, modifierOptions, dishModifierMap, tables, customers, staff } = context;

    const statusWeights = {
        'Paid': 40,
        'Served': 15,
        'Completed': 10,
        'Pending': 15,
        'Approved': 5,
        'Unsubmit': 10,
        'Cancelled': 5
    };

    const orderStatus = weightedRandomChoice(statusWeights);
    const table = randomChoice(tables);
    const customer = randomChoice(customers);
    const waiter = staff.find(s => s.role === 'Waiter') || staff[0];
    const assignedWaiterId = ['Unsubmit'].includes(orderStatus) ? null : waiter?.id;

    const detailCount = randomInt(1, 5);
    const orderDetails = [];
    let totalAmount = 0;

    for (let i = 0; i < detailCount; i++) {
        const dish = randomChoice(dishes);
        const quantity = randomInt(1, 4);
        const unitPrice = parseFloat(dish.price);
        const availableModifiers = dishModifierMap[dish.id] || [];
        const selectedModifiers = randomSubset(availableModifiers, randomInt(0, Math.min(3, availableModifiers.length)));
        const modifierTotal = selectedModifiers.reduce((sum, m) => sum + parseFloat(m.price_adjustment || 0), 0);
        const itemTotal = (unitPrice + modifierTotal) * quantity;
        totalAmount += itemTotal;

        orderDetails.push({
            dish_id: dish.id,
            dish_name: dish.name,
            quantity,
            unit_price: unitPrice,
            note: randomInt(1, 10) > 7 ? 'Ít cay' : null,
            status: getCompatibleItemStatus(orderStatus),
            modifiers: selectedModifiers.map(m => ({
                modifier_option_id: m.id,
                option_name: m.name
            }))
        });
    }

    let payment = null;
    if (orderStatus === 'Paid') {
        const paymentCalc = calculatePayment(totalAmount);
        payment = {
            ...paymentCalc,
            payment_method: randomChoice(PaymentMethods),
            payment_status: 'completed',
            paid_at: new Date().toISOString()
        };
    }

    const createdAt = randomPastDate(30);
    const completedAt = ['Completed', 'Served', 'Paid'].includes(orderStatus)
        ? new Date(createdAt.getTime() + randomInt(15, 60) * 60000).toISOString()
        : null;

    return {
        order: {
            tenant_id: tenantId,
            table_id: table?.id,
            table_number: table?.table_number,
            customer_id: customer?.id || null,
            waiter_id: assignedWaiterId,
            status: orderStatus,
            total_amount: totalAmount,
            prep_time_order: randomInt(10, 45),
            created_at: createdAt.toISOString(),
            completed_at: completedAt
        },
        orderDetails,
        payment,
        shouldUpdateTable: shouldTableHaveCurrentOrder(orderStatus)
    };
}

export function generateReviews(customers, dishes, orders, count = CONFIG.REVIEWS_COUNT) {
    const reviews = [];
    for (let i = 0; i < count; i++) {
        const customer = randomChoice(customers);
        const dish = randomChoice(dishes);
        const order = orders.length > 0 ? randomChoice(orders) : null;

        reviews.push({
            customer_id: customer?.id,
            dish_id: dish?.id,
            order_id: order?.id || null,
            rating: randomInt(3, 5), // Mostly positive reviews
            comment: randomChoice(SAMPLE_REVIEWS)
        });
    }
    return reviews;
}

export function generateDishRatings(dishes, reviews) {
    const ratingsByDish = {};

    // Aggregate reviews by dish
    for (const review of reviews) {
        if (!review.dish_id) continue;
        if (!ratingsByDish[review.dish_id]) {
            ratingsByDish[review.dish_id] = { total: 0, count: 0, ratings: [0, 0, 0, 0, 0] };
        }
        ratingsByDish[review.dish_id].total += review.rating;
        ratingsByDish[review.dish_id].count++;
        ratingsByDish[review.dish_id].ratings[review.rating - 1]++;
    }

    // Generate dish_ratings records
    return dishes.map(dish => {
        const stats = ratingsByDish[dish.id] || { total: 0, count: 0, ratings: [0, 0, 0, 0, 0] };
        return {
            dish_id: dish.id,
            total_reviews: stats.count,
            average_rating: stats.count > 0 ? (stats.total / stats.count).toFixed(1) : 0,
            rating_1: stats.ratings[0],
            rating_2: stats.ratings[1],
            rating_3: stats.ratings[2],
            rating_4: stats.ratings[3],
            rating_5: stats.ratings[4]
        };
    });
}

// ============================================
// EXPORTS
// ============================================

export default {
    CONFIG,
    PLATFORM_USERS,
    APP_SETTINGS_TENANT1,
    APP_SETTINGS_TENANT2,
    generateCustomers,
    generateStaff,
    generateTables,
    generateOrder,
    generateReviews,
    generateDishRatings,
    calculatePayment,
    randomInt,
    randomChoice
};
