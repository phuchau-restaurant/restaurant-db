# HƯỚNG DẪN PHÂN CHIA CÔNG VIỆC SEEDING DATA
# Hệ thống Smart Restaurant

**Ngày tạo:** 17/01/2026  
**Mục tiêu:** Phân chia task seeding data cho 3 người làm việc độc lập

---

## PHẦN 1: PHÂN TÍCH THỨ TỰ BẢNG

### 1.1 Bảng đã có sẵn data (Layer 0 - Không cần gen)

| STT | Bảng | Ghi chú |
|-----|------|---------|
| 1 | `app_settings` | Cấu hình ứng dụng |
| 2 | `categories` | Danh mục món ăn |
| 3 | `platform_users` | Super admin |
| 4 | `tenants` | Thông tin nhà hàng |

### 1.2 Bảng CẦN GEN TRƯỚC (Layer 0.5 - Gen và kiểm tra tính hợp lệ)

**QUAN TRỌNG:** Đây là nhóm dữ liệu nền tảng cần được gen và kiểm tra kỹ TRƯỚC khi 3 người bắt đầu làm việc.

| STT | Bảng | Phụ thuộc | Lưu ý quan trọng |
|-----|------|-----------|------------------|
| 1 | `modifier_groups` | tenant_id, category_id | 5 nhóm theo loại món (xem chi tiết bên dưới) |
| 2 | `modifier_options` | group_id | Cùng tên "Size Nhỏ/Lớn" nhưng giá khác theo group |
| 3 | `dishes` | tenant_id, category_id | Món ăn phải gán đúng category |
| 4 | `menu_item_modifier_groups` | dish_id, group_id | Liên kết món với modifier phù hợp |

#### Chi tiết về Modifier Groups (5 nhóm):

```
1. Mức Đá         - Áp dụng cho: đồ uống có đá
   - Selection: single, Required: false
   - Options: 100% Đá (0đ), 50% Đá (0đ), Không đá (0đ)

2. Kích cỡ pha chế - Áp dụng cho: trà, cà phê, sinh tố
   - Selection: single, Required: true
   - Options: Size Nhỏ (0đ), Size Lớn (+10,000đ), Size Siêu Lớn (+15,000đ)

3. Kích cỡ món     - Áp dụng cho: các món lẩu
   - Selection: single, Required: true
   - Options: Size Nhỏ (0đ), Size Lớn (+100,000đ), Size Siêu Lớn (+180,000đ)

4. Topping Thêm   - Áp dụng cho: cơm tấm, bún, phở
   - Selection: multiple, Required: false, Max: 5
   - Options: Thêm Chả Trứng (+10,000đ), Thêm Bì (+5,000đ), Thêm Mỡ Hành (0đ), ...
```

#### Quy tắc liên kết menu_item_modifier_groups:

| Loại món | Modifier Groups cần gán |
|----------|-------------------------|
| Trà, cà phê, sinh tố | Mức Đá + Kích cỡ đồ pha chế |
| Lẩu | Kích cỡ lẩu |
| Cơm tấm | Kích cỡ món khô + Topping Thêm |
| Bún, Phở | Kích cỡ món khô + Topping Thêm |
| Món khai vị (gỏi, soup) | Kích cỡ món khô (optional) |
| Bia, nước đóng chai | Không có modifier |

#### Checklist kiểm tra tính hợp lệ:
- [ ] Mỗi modifier_group có tenant_id đúng
- [ ] Mỗi modifier_option có group_id tồn tại
- [ ] Mỗi dish có category_id hợp lệ
- [ ] Mỗi menu_item_modifier_group có cặp (dish_id, group_id) hợp lệ
- [ ] Không có modifier_option trùng name trong cùng group
- [ ] Giá price_adjustment phù hợp với loại món

### 1.3 Bảng cần gen data - Xếp theo thứ tự phụ thuộc

```
Layer 0.5 (GEN TRƯỚC - cần kiểm tra kỹ):
┌─────────────────┐   ┌─────────────────┐   ┌─────────────┐   ┌─────────────────────┐
│ modifier_groups │ → │modifier_options │   │   dishes    │ → │menu_item_modifier_  │
│ (tenant_id)     │   │ (group_id)      │   │ (tenant_id, │   │groups (dish_id,     │
│                 │   │                 │   │  category)  │   │ group_id)           │
└─────────────────┘   └─────────────────┘   └─────────────┘   └─────────────────────┘

Layer 1 (ĐỘC LẬP - chỉ cần tenant_id, dishes đã có từ Layer 0.5):
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   users     │   │  customers  │   │   tables    │   │menu_item_   │
│             │   │             │   │             │   │photos       │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘

Layer 2 (Phụ thuộc Layer 1):
┌─────────────────────────────────────────────────────────────────┐
│                           orders                                │
│     (cần: tenant_id, table_id, customer_id, waiter_id)          │
└─────────────────────────────────────────────────────────────────┘

Layer 3 (Phụ thuộc Layer 2):
┌─────────────────────┐   ┌─────────────────────┐
│    order_details    │   │      payments       │
│ (cần: order_id,     │   │ (cần: order_id)     │
│  dish_id)           │   │                     │
└─────────────────────┘   └─────────────────────┘

Layer 4 (Phụ thuộc Layer 3):
┌─────────────────────┐
│ order_item_modifiers│
│ (cần: order_detail_ │
│  id, modifier_      │
│  option_id)         │
└─────────────────────┘

Layer 5 (Phụ thuộc nhiều bảng):
┌─────────────────────┐   ┌─────────────────────┐
│      reviews        │   │    dish_ratings     │
│ (cần: customer_id,  │   │ (aggregate từ       │
│  dish_id, order_id) │   │  reviews)           │
└─────────────────────┘   └─────────────────────┘
```

### 1.4 Bảng độc lập (có thể gen song song sau khi Layer 0.5 hoàn thành)

| STT | Bảng | Phụ thuộc | Lý do độc lập |
|-----|------|-----------|---------------|
| 1 | `users` | tenant_id | Chỉ cần tenant đã có sẵn |
| 2 | `customers` | tenant_id | Chỉ cần tenant đã có sẵn |
| 3 | `tables` | tenant_id | Chỉ cần tenant đã có sẵn |
| 4 | `menu_item_photos` | dish_id | Dishes đã gen từ Layer 0.5 |

---

## PHẦN 2: PHÂN CHIA TASK CHO 3 NGƯỜI

### Nguyên tắc phân chia:
1. Mỗi người làm việc trên các bảng KHÔNG phụ thuộc lẫn nhau
2. Dữ liệu output của người này là input của người khác
3. **OUTPUT là file .js gen ra file .csv** - KHÔNG được tự import vào database
4. File .csv sẽ được review và import thủ công qua Supabase Dashboard

### Quy tắc đặt tên file:
```
Thư mục: restaurant-db/seed-data/
├── person1/
│   ├── generate_menu_data.js      # Script gen data
│   ├── modifier_groups.csv        # Output
│   ├── modifier_options.csv
│   ├── dishes.csv
│   └── menu_item_modifier_groups.csv
├── person2/
│   ├── generate_base_data.js
│   ├── users.csv
│   ├── customers.csv
│   └── tables.csv
└── person3/
    ├── generate_order_data.js
    ├── orders.csv
    ├── order_details.csv
    ├── order_item_modifiers.csv
    ├── payments.csv
    ├── reviews.csv
    └── dish_ratings.csv
```

---

## NGUOI 1: Nguyễn Phúc Hậu - MENU DATA (Layer 0.5)

### Bảng được giao:
1. `modifier_groups` - Nhóm modifier
2. `modifier_options` - Options trong mỗi group
3. `dishes` - Món ăn
4. `menu_item_modifier_groups` - Liên kết món-modifier
5. `menu_item_photos` - Ảnh món (optional - dùng giao diện để thêm cho dễ)

### Công việc cụ thể:

#### 1.1 Bảng `modifier_groups`
- **Số lượng:** 5 groups/tenant (10 tổng cộng cho 2 tenants)

**Danh sách 5 groups:**
| ID | Name | Selection Type | Is Required | Min | Max |
|----|------|----------------|-------------|-----|-----|
| 1 | Mức Đá | single | false | 0 | 1 |
| 2 | Kích cỡ đồ pha chế | single | true | 1 | 1 |
| 3 | Kích cỡ lẩu | single | true | 1 | 1 |
| 4 | Kích cỡ món khô | single | true | 1 | 1 |
| 5 | Topping Thêm | multiple | false | 0 | 5 |

#### 1.2 Bảng `modifier_options`
- **Số lượng:** ~15 options/tenant

**Chi tiết giá theo group:**
```
Mức Đá (group 1):
  - 100% Đá: 0đ
  - 50% Đá: 0đ
  - Không đá: 0đ

Kích cỡ đồ pha chế (group 2):
  - Size Nhỏ: 0đ
  - Size Lớn: +10,000đ
  - Size Siêu Lớn: +15,000đ

Kích cỡ lẩu (group 3):
  - Size Nhỏ: 0đ
  - Size Lớn: +100,000đ
  - Size Siêu Lớn: +180,000đ

Kích cỡ món khô (group 4):
  - Size Nhỏ: 0đ
  - Size Lớn: +20,000đ
  - Size Siêu Lớn: +35,000đ

Topping Thêm (group 5):
  - Thêm Chả Trứng: +10,000đ
  - Thêm Bì: +5,000đ
  - Thêm Mỡ Hành: 0đ
```

#### 1.3 Bảng `dishes`
- **Số lượng:** 30-50 dishes/tenant
- **Phân bố theo category:** đều cho các loại

**Lưu ý quan trọng:**
- `price`: giá cơ bản (chưa bao gồm modifier)
- `prep_time_minutes`: 5-30 phút tùy món
- `status`: Available, Unavailable, Hidden
- `is_recommended`: true cho 20% món

#### 1.4 Bảng `menu_item_modifier_groups`
- Liên kết theo quy tắc đã định (xem Phần 1.2)

### CODE MẪU NGƯỜI 1:
```javascript
// generate_menu_data.js
const fs = require('fs');

const TENANT_IDS = [
  '019abac9-846f-75d0-8dfd-bcf9c9457866', //đã config dựa theo database thực
  '019bc623-e4a5-735d-9dc7-a9a6b28ee557' 
];

// Helper: Convert array to CSV
function toCSV(headers, data) {
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      return val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// Generate modifier_groups
function generateModifierGroups() {
  const groups = [];
  let id = 1;
  
  for (const tenantId of TENANT_IDS) {
    groups.push(
      { id: id++, tenant_id: tenantId, name: 'Mức Đá', selection_type: 'single', is_required: false, min_selections: 0, max_selections: 1 },
      // ... thêm các groups khác
    );
  }
  
  return groups;
}

// Main
const modifierGroups = generateModifierGroups();
fs.writeFileSync('modifier_groups.csv', toCSV(['id', 'tenant_id', 'name', 'selection_type', 'is_required', 'min_selections', 'max_selections'], modifierGroups));

console.log('Generated modifier_groups.csv');
```

### OUTPUT NGUOI 1:
- `modifier_groups.csv` (~10 rows)
- `modifier_options.csv` (~30 rows)
- `dishes.csv` (~80 rows)
- `menu_item_modifier_groups.csv` (~150 rows)

**Gửi cho Người 2 & 3:** File dishes.csv (để lấy dish_id, price, category)

---

## NGUOI 2: Phạm Quang Vinh - BASE DATA (Layer 1)

### Bảng được giao:
1. `users` - Nhân viên nhà hàng
2. `customers` - Khách hàng
3. `tables` - Bàn ăn

### Yêu cầu từ Người 1:
- File `dishes.csv` để lấy dish_id cho menu_item_photos

### Công việc cụ thể:

#### 2.1 Bảng `users`
- **Số lượng:** 20 users/tenant (40 tổng cộng)
- **Phân bố role:**
  - Admin: 2 users
  - Waiter: 10 users
  - Chef: 8 users

**Lưu ý quan trọng:**
- Password mặc định: `123456`
- Password hash (bcrypt salt 10): `$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC`
- Email phải unique trong cùng tenant
- `is_active = true`

#### 2.2 Bảng `customers`
- **Số lượng:** 50 customers/tenant (100 tổng cộng)

**Lưu ý quan trọng:**
- Phone number phải unique trong cùng tenant
- loyalty_points: random 0-1000

#### 2.3 Bảng `tables`
- **Số lượng:** 30 tables/tenant (60 tổng cộng)
- **Phân bố:**
  - VIP: 5 bàn (capacity 6-10, location: VIP_Room)
  - Indoor: 15 bàn (capacity 2-6)
  - Outdoor: 5 bàn (capacity 2-4)
  - Patio: 5 bàn (capacity 4-6)

### CODE MẪU NGƯỜI 2:
```javascript
// generate_base_data.js
const fs = require('fs');
const crypto = require('crypto');

const TENANT_IDS = [
  '019abac9-846f-75d0-8dfd-bcf9c9457801',
  '019abac9-846f-75d0-8dfd-bcf9c9457802'
];

const PASSWORD_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC';

const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đỗ', 'Bùi'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Minh', 'Quang', 'Thu', 'Hoàng', 'Thanh'];
const LAST_NAMES = ['An', 'Bình', 'Cường', 'Dũng', 'Hà', 'Huy', 'Lan', 'Mai'];

function randomName() {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${MIDDLE_NAMES[Math.floor(Math.random() * MIDDLE_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

function randomPhone() {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '099'];
  return prefixes[Math.floor(Math.random() * prefixes.length)] + Math.random().toString().slice(2, 9);
}

// Generate users
function generateUsers() {
  const users = [];
  let id = 1;
  
  for (const tenantId of TENANT_IDS) {
    // 2 Admins
    for (let i = 0; i < 2; i++) {
      users.push({
        id: id++,
        tenant_id: tenantId,
        email: `admin${i + 1}@restaurant${tenantId.slice(-2)}.vn`,
        password_hash: PASSWORD_HASH,
        full_name: randomName(),
        role: 'Admin',
        is_active: true,
        phone_number: randomPhone()
      });
    }
    // 10 Waiters, 8 Chefs...
  }
  
  return users;
}

// Main
const users = generateUsers();
fs.writeFileSync('users.csv', toCSV([...], users));
console.log('Generated users.csv');
```

### OUTPUT NGUOI 2:
- `users.csv` (40 rows)
- `customers.csv` (100 rows)
- `tables.csv` (60 rows)
- `menu_item_photos.csv` (optional)

**Gửi cho Người 3:** 
- File `users.csv` (để lấy waiter user_id)
- File `customers.csv` (để lấy customer_id)
- File `tables.csv` (để lấy table_id)

---

## NGUOI 3: Nguyễn Văn Bình Dương - ORDER & TRANSACTION DATA (Layer 2, 3, 4, 5)

### Bảng được giao:
1. `orders` - Đơn hàng (Layer 2)
2. `order_details` - Chi tiết đơn hàng (Layer 3)
3. `order_item_modifiers` - Modifier của món (Layer 4)
4. `payments` - Thanh toán (Layer 3)
5. `reviews` - Đánh giá (Layer 5)
6. `dish_ratings` - Thống kê đánh giá (Layer 5)

### Yêu cầu từ Người 1 & 2:
- `dishes.csv` - để lấy dish_id, price, modifier groups
- `modifier_options.csv` - để lấy option_id, price_adjustment
- `menu_item_modifier_groups.csv` - để biết dish nào có modifier nào
- `users.csv` - để lấy waiter user_id
- `customers.csv` - để lấy customer_id
- `tables.csv` - để lấy table_id

### Công việc cụ thể:

#### 3.1 Bảng `orders`
- **Số lượng:** 100 orders/tenant (200 tổng cộng)
- **Phân bố status:**
  - Paid: 50%
  - Served: 15%
  - Completed: 10%
  - Pending: 10%
  - Approved: 5%
  - Unsubmit: 5%
  - Cancelled: 5%

#### 3.2 Bảng `order_details`
- **Số lượng:** 3-7 items/order (~1000 rows)

**Mapping status:**
| Order Status | Order Detail Status |
|--------------|---------------------|
| Unsubmit | NULL |
| Approved | Pending |
| Pending | Pending/Ready |
| Completed | Ready |
| Served | Served |
| Paid | Served |
| Cancelled | Cancelled |

#### 3.3 Bảng `order_item_modifiers`
- Chỉ tạo cho order_details có modifier
- Lưu `option_name` (snapshot)

#### 3.4 Bảng `payments`
- Chỉ tạo cho orders có status = Paid
- **1 order = 1 payment**

**Công thức tính:**
```
subtotal = SUM((unit_price + modifier_prices) * quantity)
discount_amount = subtotal * (discount_percent / 100)
after_discount = subtotal - discount_amount
tax_amount = after_discount * (tax_rate / 100)
service_charge_amount = after_discount * (service_charge_rate / 100)
amount = after_discount + tax_amount + service_charge_amount
```

#### 3.5 Bảng `reviews`
- **Số lượng:** 80 reviews/tenant
- **Điều kiện:** Chỉ khách đã order món đó mới được review
- rating: 1-5 (phân bố: 5 sao 40%, 4 sao 35%, 3 sao 15%, 2 sao 7%, 1 sao 3%)

#### 3.6 Bảng `dish_ratings`
- Aggregate từ reviews
- Tính: average_rating, total_reviews, rating_1 đến rating_5

### CODE MẪU NGƯỜI 3:
```javascript
// generate_order_data.js
const fs = require('fs');

// Load data từ Người 1 & 2
const dishes = parseCSV(fs.readFileSync('../person1/dishes.csv', 'utf-8'));
const modifierOptions = parseCSV(fs.readFileSync('../person1/modifier_options.csv', 'utf-8'));
const menuModifierGroups = parseCSV(fs.readFileSync('../person1/menu_item_modifier_groups.csv', 'utf-8'));
const users = parseCSV(fs.readFileSync('../person2/users.csv', 'utf-8'));
const customers = parseCSV(fs.readFileSync('../person2/customers.csv', 'utf-8'));
const tables = parseCSV(fs.readFileSync('../person2/tables.csv', 'utf-8'));

// Helper: Parse CSV
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim());
    return obj;
  });
}

// Filter waiters only
const waiters = users.filter(u => u.role === 'Waiter');

// Generate orders
function generateOrders() {
  const orders = [];
  const ORDER_STATUSES = ['Unsubmit', 'Approved', 'Pending', 'Completed', 'Served', 'Paid', 'Cancelled'];
  const STATUS_WEIGHTS = [5, 5, 10, 10, 15, 50, 5]; // percentages
  
  // ... logic gen orders
  
  return orders;
}

// Main
const orders = generateOrders();
fs.writeFileSync('orders.csv', toCSV([...], orders));

// Generate order_details, order_item_modifiers, payments, reviews, dish_ratings...
```

### OUTPUT NGUOI 3:
- `orders.csv` (200 rows)
- `order_details.csv` (~1000 rows)
- `order_item_modifiers.csv` (~600 rows)
- `payments.csv` (~100 rows)
- `reviews.csv` (160 rows)
- `dish_ratings.csv` (~80 rows)

---

## PHẦN 3: QUY TRÌNH THỰC HIỆN

### Bước 1: Người 1 làm trước (Layer 0.5)
1. Viết `generate_menu_data.js`
2. Chạy: `node generate_menu_data.js`
3. Output: 4 file .csv
4. Review & commit

### Bước 2: Người 2 làm song song hoặc sau Người 1 (Layer 1)
1. Nhận `dishes.csv` từ Người 1 (nếu cần cho photos)
2. Viết `generate_base_data.js`
3. Chạy: `node generate_base_data.js`
4. Output: 3-4 file .csv
5. Review & commit

### Bước 3: Người 3 làm sau cùng (Layer 2-5)
1. Nhận tất cả .csv từ Người 1 & 2
2. Viết `generate_order_data.js`
3. Chạy: `node generate_order_data.js`
4. Output: 6 file .csv
5. Review & commit

### Bước 4: Import vào database
```
[KHÔNG TỰ ĐỘNG IMPORT]
1. Tất cả .csv được review bởi nhóm
2. Import thủ công qua Supabase Dashboard > Table Editor > Import CSV
3. Import theo thứ tự:
   - modifier_groups → modifier_options
   - dishes → menu_item_modifier_groups
   - users, customers, tables
   - orders → order_details → order_item_modifiers
   - payments, reviews → dish_ratings
```

### Sơ đồ phụ thuộc:
```
[Người 1: Layer 0.5]
    │
    ├──→ dishes.csv ──────────────→ [Người 2: Layer 1]
    │                                        │
    ├── modifier_options.csv                 │
    ├── menu_item_modifier_groups.csv        │
    │                                        │
    └────────────────────────────────────────┼──→ [Người 3: Layer 2-5]
                                             │
                              users.csv ─────┤
                              customers.csv ─┤
                              tables.csv ────┘
```

---

## PHẦN 4: LƯU Ý CHUNG

### 4.1 Tenant IDs đang sử dụng
```
Tenant 1: 019abac9-846f-75d0-8dfd-bcf9c9457801 (Nhà hàng Phương Nam)
Tenant 2: 019abac9-846f-75d0-8dfd-bcf9c9457802 (Quán ăn Bắc Bộ)
```

### 4.2 Modifier Groups đã có
| ID | Name | Selection Type | Is Required |
|----|------|----------------|-------------|
| 1 | Mức Đá | single | false |
| 2 | Kích cỡ đồ pha chế | single | true |
| 3 | Kích cỡ lẩu | single | true |
| 4 | Kích cỡ món khô | single | true |
| 5 | Topping Thêm | multiple | false |

### 4.3 Modifier Options mẫu
```
-- Mức Đá (group_id = 1)
(1, '100% Đá', 0), (1, '50% Đá', 0), (1, 'Không đá', 0)

-- Kích cỡ đồ pha chế (group_id = 2) - cho trà, cà phê
(2, 'Size Nhỏ', 0), (2, 'Size Lớn', 10000), (2, 'Size Siêu Lớn', 15000)

-- Kích cỡ lẩu (group_id = 3)
(3, 'Size Nhỏ', 0), (3, 'Size Lớn', 100000), (3, 'Size Siêu Lớn', 180000)

-- Kích cỡ món khô (group_id = 4) - cơm, bún
(4, 'Size Nhỏ', 0), (4, 'Size Lớn', 20000), (4, 'Size Siêu Lớn', 35000)

-- Topping Thêm (group_id = 5)
(5, 'Thêm Chả Trứng', 10000), (5, 'Thêm Bì', 5000), (5, 'Thêm Mỡ Hành', 0)
```

### 4.4 Order Status Flow
```
Unsubmit → Approved → Pending → Completed → Served → Paid
                ↓
            Cancelled
```

### 4.5 Checklist trước khi submit
- [ ] Kiểm tra tenant_id đúng
- [ ] Kiểm tra foreign keys tồn tại
- [ ] Kiểm tra unique constraints không bị vi phạm
- [ ] Kiểm tra status hợp lệ (dùng đúng enum)
- [ ] Tính toán total_amount/amount đúng công thức

---

## PHẦN 5: TOOLS HỖ TRỢ

### Tạo tên tiếng Việt random
```javascript
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đỗ', 'Bùi'];
const middleNames = ['Văn', 'Thị', 'Minh', 'Quang', 'Thu', 'Hoàng', 'Thanh'];
const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hà', 'Huy', 'Lan', 'Mai'];
```

### Tạo số điện thoại VN
```javascript
const prefixes = ['090', '091', '093', '094', '096', '097', '098', '099', '086', '088'];
const phone = prefix + Math.random().toString().slice(2, 9); // 7 digits
```

### Tính hash password (Node.js)
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('123456', 10);
// Result: $2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC
```

---

*Tài liệu này đảm bảo 3 người có thể làm việc song song tối đa, chỉ cần sync IDs giữa các giai đoạn.*
