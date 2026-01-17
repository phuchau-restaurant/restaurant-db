# Hướng dẫn Database Migration - Smart Restaurant

Tài liệu này hướng dẫn cách **khởi tạo schema database (migration)** và **tạo dữ liệu mẫu (seeding)** cho hệ thống.

---
## Quick Start

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo file .env
copy .env.example .env
# Sau đó sửa [YOUR-PASSWORD] và [Supabase-PROJECT-ID] trong .env

# 3. Kiểm tra trạng thái migration
npm run db:check

# 4. Chạy migration + seed
npm run migrate
npm run seed
```

---

## Yêu cầu Tiên quyết

### Công cụ

- **Node.js** v18+ 
- **Supabase Project** (đã có sẵn connection string)

### Biến môi trường

Tạo file `.env` từ template:

```bash
copy .env.example .env
```

Nội dung `.env`:

```env
# Supabase Session Pooler Connection String
# Lấy từ: Supabase Dashboard → Project Settings → Database → Session pooler
# Lấy Project ID: Vào Supabase -> Tạo project ->Project Dashboard-> Project Settings -> General -> Tìm header General settings Có Project Name và ID
DATABASE_URL=DATABASE_URL=postgresql://postgres.[Supabase-Project-ID]:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

```

> **Quan trọng**: Dùng **Session Pooler** (không phải Direct Connection) để tương thích IPv4.

---

## Migration Commands

| Command | Mô tả |
|---------|-------|
| `npm run migrate` | Chạy tất cả migrations chưa apply |
| `npm run migrate:rollback` | Rollback batch migration cuối |
| `npm run migrate:rollback:all` | Rollback tất cả migrations - xóa tất cả các bảng|
| `npm run migrate:status` | Xem trạng thái migrations |
| `npm run db:check` | Kiểm tra có cần migrate không (custom script) |

### Kiểm tra trước khi chạy

```bash
npm run db:check
```

Output khi cần migrate:
```
Pending migrations found:

   1. 001_extensions_functions.js
   2. 002_enums.js
   3. 003_system_tables.js
   ...

Run 'npm run migrate' to apply pending migrations.
```

### Chạy migration

```bash
npm run migrate
```

Output thành công:
```
Batch 1 run: 6 migrations
```

---

## Seeding Commands

| Command | Mô tả |
|---------|-------|
| `npm run seed` | Chạy seed data đầy đủ |
| `npm run db:reset` | Reset toàn bộ: rollback → migrate → seed |

### Chạy seed

```bash
npm run seed
```

Seed sẽ tự động tạo:

- **Tenants** (nhà hàng mẫu)
- **Categories** (danh mục món)
- **Dishes** (món ăn với giá)
- **Modifier Groups/Options** (topping, size,...)
- **Staff** (Admin, Waiter, Chef)
- **Customers** (khách hàng mẫu)
- **Tables** (bàn ăn)
- **Orders** (đơn hàng với nhiều trạng thái)
- **Order Details** (chi tiết món với modifiers)
- **Payments** (thanh toán)
- **Reviews** (đánh giá món ăn)
- **Dish Ratings** (thống kê rating)

### Thông tin đăng nhập mặc định

**Password cho tất cả tài khoản: `123456`**

#### Platform Admin
| Email | Password |
|-------|----------|
| superadmin@gmail.com | `123456` |

#### Tenant 1: Nhà hàng Phương Nam
| Role | Email | Password |
|------|-------|----------|
| Admin | testadmin_tenant1@gmail.com | `123456` |
| Kitchen (Chef) | testkitchen_tenant1@gmail.com | `123456` |
| Waiter | testwaiter_tenant1@gmail.com | `123456` |

#### Tenant 2: Quán ăn Bắc Bộ
| Role | Email | Password |
|------|-------|----------|
| Admin | testadmin_tenant2@gmail.com | `123456` |
| Kitchen (Chef) | testkitchen_tenant2@gmail.com | `123456` |
| Waiter | testwaiter_tenant2@gmail.com | `123456` |

> **Note**: Tất cả tài khoản đều sử dụng password `123456` (bcrypt hash với salt 10).

---

## Cấu trúc Files

```
restaurant-db/
├── package.json          # Dependencies & scripts
├── knexfile.js           # Cấu hình Knex
├── .env                  # Connection string (tự tạo)
├── .env.example          # Template
│
├── migrations/
│   └── knex/             # Knex migration files
│       ├── 001_extensions_functions.js
│       ├── 002_enums.js
│       ├── 003_system_tables.js
│       ├── 004_resource_tables.js
│       ├── 005_business_tables.js
│       └── 006_constraints_indexes.js
│
├── seeds/
│   ├── index.js          # Main seed runner
│   └── dataGenerator.js  # Logic sinh dữ liệu
│
├── seed/
│   └── seed.sql          # Base data (categories, dishes,...)
│
└── scripts/
    └── check-migration.js # Script kiểm tra migration
```

---

## Tùy chỉnh Seed Data

Mở file `seeds/dataGenerator.js` và chỉnh CONFIG:

```javascript
export const CONFIG = {
  // 2 Tenant IDs (đã seed từ seed.sql)
  TENANT_ID1: '019abac9-846f-75d0-8dfd-bccdefault_1', // Nhà hàng Phương Nam
  TENANT_ID2: '019abac9-846f-75d0-8dfd-bccdefault_2', // Quán ăn Bắc Bộ
  
  // Số lượng dữ liệu cần tạo (cho mỗi tenant)
  ORDERS_COUNT: 15,           // Số orders
  CUSTOMERS_COUNT: 8,         // Số customers  
  STAFF_COUNT: 4,             // Số nhân viên
  TABLES_COUNT: 12,           // Số bàn
  REVIEWS_COUNT: 15,          // Số reviews
  
  // Cài đặt thanh toán
  TAX_RATE: 5.00,             // % thuế
  SERVICE_CHARGE_RATE: 0.00,  // % phí dịch vụ
  DISCOUNT_RULES: [
    { min_order: 500000, discount_percent: 10 },
    { min_order: 1000000, discount_percent: 15 }
  ]
};
```

### Thông tin 2 Tenants mẫu

| Tenant | ID | Name | Tax | Service Charge |
|--------|-----|------|-----|----------------|
| 1 | `bccdefault_1` | Nhà hàng Phương Nam | 5% | 0% |
| 2 | `bccdefault_2` | Quán ăn Bắc Bộ | 8% | 5% |


---

## Workflow Reset Database

Khi cần xóa toàn bộ và tạo lại:

```bash
npm run db:reset
```

Hoặc thủ công:

```bash
npm run migrate:rollback:all  # Xóa tất cả tables
npm run migrate               # Tạo lại tables
npm run seed                  # Seed data
```

---

## Troubleshooting

### Lỗi "connect ETIMEDOUT"

**Nguyên nhân**: Mạng không hỗ trợ IPv6 và đang dùng Direct Connection.

**Giải pháp**: Dùng Session Pooler URL thay vì Direct Connection.

### Lỗi "relation does not exist"

**Nguyên nhân**: Chưa chạy migration trước khi seed.

**Giải pháp**:
```bash
npm run migrate
npm run seed
```

### Lỗi "duplicate key value violates unique constraint"

**Nguyên nhân**: Seed đã chạy trước đó.

**Giải pháp**: Reset database hoặc bỏ qua (seed đã check duplicate).

---

## Kiểm tra sau khi hoàn thành

### Supabase Dashboard

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project → **Table Editor**
3. Kiểm tra các bảng có dữ liệu

### Test uuid_generate_v7

```sql
-- Chạy trong SQL Editor
SELECT uuid_generate_v7();
-- Kết quả: UUID dạng 01... (timestamp-based)
```

### Test ENUM types

```sql
SELECT enum_range(NULL::order_status);
-- Kết quả: {Unsubmit,Approved,Pending,Completed,Served,Paid,Cancelled}
```

---

*Cập nhật: 17/01/2026*