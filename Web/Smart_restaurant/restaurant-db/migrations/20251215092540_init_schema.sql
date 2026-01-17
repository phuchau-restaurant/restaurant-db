-- ================================================================
-- PHẦN 0: CẤU HÌNH EXTENSIONS & ENUMS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Enums Definition
CREATE TYPE dish_status AS ENUM ('Available', 'Unavailable', 'Sold_out');

CREATE TYPE item_status AS ENUM ('Pending', 'Ready', 'Served', 'Cancelled');

CREATE TYPE table_location AS ENUM ('Indoor', 'Outdoor', 'Patio', 'VIP_Room');

CREATE TYPE table_status AS ENUM ('Active', 'Inactive', 'Available', 'Occupied');

CREATE TYPE order_status AS ENUM ('Unsubmit', 'Approved', 'Pending', 'Completed', 'Served', 'Paid', 'Cancelled');

-- 2. UUID v7 Generator Function
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  ts_bytes BYTEA;
  uuid_bytes BYTEA;
BEGIN
  -- 48-bit Unix timestamp (ms)
  ts_bytes := decode(lpad(to_hex(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint), 12, '0'), 'hex');
  -- Random base
  uuid_bytes := gen_random_bytes(16);
  -- Inject timestamp
  uuid_bytes := overlay(uuid_bytes placing ts_bytes from 1 for 6);
  -- Version = 7
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  -- Variant = RFC 4122
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;

-- ================================================================
-- PHẦN 1: GLOBAL / SYSTEM TABLES
-- ================================================================

CREATE TABLE tenants ( -- Nhà hàng
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    owner_email VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    subscription_plan VARCHAR(20) DEFAULT 'basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE platform_users ( -- Super Admins
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'super_admin'
);

CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(50) NOT NULL,
    value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false
);

-- ================================================================
-- PHẦN 2: TENANT RESOURCES (Users & Customers)
-- ================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'waiter',
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT users_email_tenant_unique UNIQUE (tenant_id, email)
);

-- [ADDED] Bảng Customers (Mang từ schema cũ sang)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    full_name VARCHAR(100),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- PHẦN 3: MENU MANAGEMENT (Categories, Dishes, Photos, Modifiers)
-- ================================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    url_icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE dishes (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    
    -- [MERGED] Các trường quan trọng cho bài tập
    status dish_status DEFAULT 'Available',
    prep_time_minutes INTEGER DEFAULT 0 CHECK (prep_time_minutes >= 0 AND prep_time_minutes <= 240),
    is_chef_recommended BOOLEAN DEFAULT FALSE,
    
    is_available BOOLEAN DEFAULT true, -- Có thể giữ hoặc bỏ nếu đã dùng status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- [ADDED] Bảng Photos (Mang từ schema cũ sang)
CREATE TABLE menu_item_photos (
    id SERIAL PRIMARY KEY,
    dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- [ADDED] Bảng Modifier Groups
CREATE TABLE modifier_groups (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    selection_type VARCHAR(20) NOT NULL CHECK (selection_type IN ('single', 'multiple')),
    is_required BOOLEAN DEFAULT false,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- [ADDED] Bảng Modifier Options
CREATE TABLE modifier_options (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(12, 2) DEFAULT 0 CHECK (price_adjustment >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- [ADDED] Bảng liên kết Many-to-Many giữa Dish và Modifier Group
CREATE TABLE menu_item_modifier_groups (
    dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (dish_id, group_id)
);

-- ================================================================
-- PHẦN 4: OPERATIONS (Tables, Orders, Payments)
-- ================================================================

CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 4 CHECK (capacity > 0 AND capacity <= 20),
    location table_location DEFAULT 'Indoor',
    is_vip BOOLEAN DEFAULT false,
    qr_token VARCHAR(500),
    status table_status DEFAULT 'Active',
    qr_token_created_at TIMESTAMP,
    description VARCHAR(80), -- [FIXED] Đã thêm dấu phẩy trước dòng này
    current_order_id BIGINT, -- Sẽ add FK sau
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tables_tenant_number_unique UNIQUE (tenant_id, table_number) -- [ADDED] Đảm bảo số bàn ko trùng trong 1 quán
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL, -- [ADDED] Link với Customer
    status order_status DEFAULT 'Unsubmit',
    total_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE order_details (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id INTEGER REFERENCES dishes(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED, -- Giữ tính năng hay này
    note VARCHAR(255),
    status item_status DEFAULT 'Pending'
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id BIGINT UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- ================================================================
-- PHẦN 5: BỔ SUNG RÀNG BUỘC & INDEXING
-- ================================================================

-- 5.1 [CRITICAL] Fix Circular Dependency
ALTER TABLE tables
ADD CONSTRAINT fk_tables_current_order
FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- 5.2 Indexes for Performance
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_tables_tenant ON tables(tenant_id);
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_dishes_tenant ON dishes(tenant_id);
CREATE INDEX idx_modifier_groups_tenant ON modifier_groups(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_order_details_tenant ON order_details(tenant_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);

CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE INDEX idx_modifier_options_group ON modifier_options(group_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_order_details_order ON order_details(order_id);
