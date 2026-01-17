-- ================================================================
-- SEED DATA CHO SMART RESTAURANT
-- 2 Tenants với đầy đủ categories, dishes, modifiers
-- ================================================================

-- 1. TENANTS
INSERT INTO tenants (id, name, slug, email, status, tax_rate, service_charge) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'Nhà hàng Phương Nam', 'phuong-nam', 'phuongnam@restaurant.vn', 'active', 5.00, 0.00),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'Quán ăn Bắc Bộ', 'bac-bo', 'bacbo@restaurant.vn', 'active', 8.00, 5.00);

-- 2. PLATFORM USERS (Super Admin) - Password: 123456
INSERT INTO platform_users (email, password_hash, role, name) VALUES
('superadmin@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC', 'super_admin', 'Super_Admin');

-- ================================================================
-- STAFF TEST ACCOUNTS - Password: 123456 for all
-- ================================================================

-- Tenant 1: Nhà hàng Phương Nam
INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'testadmin_tenant1@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC', 'Admin Test T1', 'Admin', true),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'testkitchen_tenant1@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC', 'Kitchen Test T1', 'Chef', true),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'testwaiter_tenant1@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC', 'Waiter Test T1', 'Waiter', true);

-- Tenant 2: Quán ăn Bắc Bộ
INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'testadmin_tenant2@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC', 'Admin Test T2', 'Admin', true),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'testkitchen_tenant2@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC', 'Kitchen Test T2', 'Chef', true),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'testwaiter_tenant2@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeRj/3Y1OXxqCdQMdy3NqFwBj0p/WKFOC', 'Waiter Test T2', 'Waiter', true);

-- ================================================================
-- TENANT 1: Nhà hàng Phương Nam
-- ================================================================

-- 3. CATEGORIES - Tenant 1
INSERT INTO categories (tenant_id, name, display_order, is_active, url_icon) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'Appetizers', 1, true, 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/fork_plate_white.svg'),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'Beverage', 2, true, 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/wine_bottle_white.svg'),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'Main course', 3, true, 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/kitchen-pack-steam.svg');

-- 4. DISHES - Tenant 1
INSERT INTO dishes (tenant_id, category_id, name, description, price, image_url, is_available, status, prep_time_minutes) VALUES
-- Appetizers (category_id sẽ là 1)
('019abac9-846f-75d0-8dfd-bcf9c9457801', 1, 'Gỏi lá cải', 'Gỏi lá cải giòn tan', 140000.00, 'https://thanhnien.mediacdn.vn/Uploaded/2014/saigonamthuc.thanhnien.com.vn/Pictures201408/Tan_Nhan/goicucai_TB.jpg', true, 'Available', 10),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 1, 'Soup cà chua hải sản', 'Soup nóng hổi', 100000.00, 'https://core.afg.vn/uploads/images/m%C3%B3n-khai-v%E1%BB%8B-Soup-c%C3%A0-chua-h%E1%BA%A3i-s%E1%BA%A3n.jpg', true, 'Available', 15),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 1, 'Soup bí đỏ', 'Soup bí đỏ kem tươi', 100000.00, 'https://core.afg.vn/uploads/images/m%C3%B3n-khai-v%E1%BB%8B-Soup-b%C3%AD-%C4%91%E1%BB%8F-min.jpg', true, 'Available', 15),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 1, 'Gỏi hoa chuối', 'Gỏi hoa chuối trộn', 100000.00, NULL, true, 'Available', 10),
-- Beverage (category_id sẽ là 2)
('019abac9-846f-75d0-8dfd-bcf9c9457801', 2, 'Beer Sài Gòn', 'Bia Sài Gòn lon 330ml', 30000.00, 'https://sabibeco.com/uploads/product/2020_03/bia-lon-saigon-lager.jpg', true, 'Available', 0),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 2, 'Aquafina', 'Nước tinh khiết 500ml', 20000.00, 'https://cdn.tgdd.vn/Products/Images/2563/79247/bhx/nuoc-tinh-khiet-aquafina-500ml-202407121618240191.jpg', true, 'Available', 0),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 2, 'Trà đào cam sả', 'Trà đào thơm mát', 35000.00, 'https://product.hstatic.net/200000791069/product/lord-50_5221e714bef5444aaab6759e2a219146_1024x1024.jpg', true, 'Available', 5),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 2, 'Beer Huda', 'Bia Huda lon 330ml', 30000.00, 'https://cdn.tgdd.vn/Products/Images/2282/113152/bhx/bia-huda-330ml-202309191327455945.jpg', true, 'Available', 0),
-- Main course (category_id sẽ là 3)
('019abac9-846f-75d0-8dfd-bcf9c9457801', 3, 'Cơm tấm Sài Gòn', 'Cơm tấm sườn bì chả', 55000.00, 'https://static.vinwonders.com/production/com-tam-sai-gon-banner.jpg', true, 'Available', 20),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 3, 'Cơm tấm Long Xuyên', 'Đặc sản Long Xuyên', 65000.00, 'https://thanhnien.mediacdn.vn/Uploaded/chinhan/2022_12_20/z3960180103026-bba7fc98fc811fd4ef3e5a32d418319a-2358.jpg', true, 'Available', 20),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 3, 'Lẩu hải sản', 'Lẩu hải sản tươi sống', 350000.00, 'https://bizweb.dktcdn.net/100/489/006/files/lau-hai-san-1.jpg?v=1697695078748', true, 'Available', 30),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 3, 'Cơm chiên dương châu', 'Cơm chiên thập cẩm', 60000.00, NULL, true, 'Available', 15);

-- 5. MODIFIER GROUPS - Tenant 1
INSERT INTO modifier_groups (tenant_id, name, selection_type, is_required, min_selections, max_selections, display_order) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'Mức Đá', 'single', false, 0, 1, 1),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'Topping Thêm', 'multiple', false, 0, 5, 2),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'Kích cỡ', 'single', true, 1, 1, 3);

-- 6. MODIFIER OPTIONS - Tenant 1
-- Giả sử modifier_groups IDs: 1, 2, 3
INSERT INTO modifier_options (group_id, name, price_adjustment, is_active) VALUES
-- Group 1: Mức Đá
(1, '100% Đá', 0, true),
(1, '50% Đá', 0, true),
(1, 'Không đá', 0, true),
-- Group 2: Topping Thêm
(2, 'Thêm Chả Trứng', 10000, true),
(2, 'Thêm Bì', 5000, true),
(2, 'Thêm Mỡ Hành', 0, true),
(2, 'Thêm Cơm Thêm', 5000, true),
-- Group 3: Kích cỡ
(3, 'Size Nhỏ', 0, true),
(3, 'Size Lớn', 20000, true),
(3, 'Size Siêu Lớn', 35000, true);

-- 7. MENU_ITEM_MODIFIER_GROUPS - Tenant 1
-- Map món ăn với nhóm modifier
INSERT INTO menu_item_modifier_groups (dish_id, group_id) VALUES
(7, 1),  -- Trà đào cam sả -> Mức đá
(9, 2),  -- Cơm tấm Sài Gòn -> Topping
(10, 2), -- Cơm tấm Long Xuyên -> Topping
(2, 3),  -- Soup cà chua -> Size
(3, 3);  -- Soup bí đỏ -> Size

-- ================================================================
-- TENANT 2: Quán ăn Bắc Bộ
-- ================================================================

-- 8. CATEGORIES - Tenant 2
INSERT INTO categories (tenant_id, name, display_order, is_active, url_icon) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'Khai vị', 1, true, 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/salad%20(1).png'),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'Đồ uống', 2, true, 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/tea_cup_black.svg'),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'Món chính', 3, true, 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/dinner.png');

-- 9. DISHES - Tenant 2
-- Category IDs cho tenant 2: 4, 5, 6
INSERT INTO dishes (tenant_id, category_id, name, description, price, image_url, is_available, status, prep_time_minutes) VALUES
-- Khai vị (category 4)
('019abac9-846f-75d0-8dfd-bcf9c9457802', 4, 'Nem rán', 'Nem rán giòn rụm', 80000.00, NULL, true, 'Available', 15),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 4, 'Chả giò', 'Chả giò chiên giòn', 70000.00, NULL, true, 'Available', 15),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 4, 'Nộm bò khô', 'Nộm đu đủ bò khô', 90000.00, NULL, true, 'Available', 10),
-- Đồ uống (category 5)
('019abac9-846f-75d0-8dfd-bcf9c9457802', 5, 'Trà sen', 'Trà sen thanh mát', 25000.00, NULL, true, 'Available', 5),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 5, 'Nước mía', 'Nước mía tươi ép', 20000.00, NULL, true, 'Available', 3),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 5, 'Bia Hà Nội', 'Bia Hà Nội lon', 28000.00, NULL, true, 'Available', 0),
-- Món chính (category 6)
('019abac9-846f-75d0-8dfd-bcf9c9457802', 6, 'Phở bò', 'Phở bò Hà Nội', 55000.00, NULL, true, 'Available', 15),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 6, 'Bún chả', 'Bún chả Hà Nội', 50000.00, NULL, true, 'Available', 20),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 6, 'Bún bò Huế', 'Bún bò cay nồng', 60000.00, NULL, true, 'Available', 20),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 6, 'Cơm rang dưa bò', 'Cơm rang đặc biệt', 55000.00, NULL, true, 'Available', 15);

-- 10. MODIFIER GROUPS - Tenant 2
INSERT INTO modifier_groups (tenant_id, name, selection_type, is_required, min_selections, max_selections, display_order) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'Độ cay', 'single', false, 0, 1, 1),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'Thêm topping', 'multiple', false, 0, 3, 2);

-- 11. MODIFIER OPTIONS - Tenant 2
-- Groups 4, 5
INSERT INTO modifier_options (group_id, name, price_adjustment, is_active) VALUES
-- Group 4: Độ cay
(4, 'Không cay', 0, true),
(4, 'Ít cay', 0, true),
(4, 'Cay vừa', 0, true),
(4, 'Cay nhiều', 0, true),
-- Group 5: Thêm topping
(5, 'Thêm thịt', 15000, true),
(5, 'Thêm trứng', 8000, true),
(5, 'Thêm rau', 5000, true);

-- 12. MENU_ITEM_MODIFIER_GROUPS - Tenant 2
INSERT INTO menu_item_modifier_groups (dish_id, group_id) VALUES
(19, 4), -- Phở bò -> Độ cay
(20, 4), -- Bún chả -> Độ cay
(21, 4), -- Bún bò Huế -> Độ cay
(19, 5), -- Phở bò -> Thêm topping
(20, 5), -- Bún chả -> Thêm topping
(21, 5); -- Bún bò Huế -> Thêm topping

-- ================================================================
-- APP SETTINGS CHO CẢ 2 TENANTS
-- ================================================================

-- App Settings - Tenant 1
INSERT INTO app_settings (tenant_id, key, value, value_type, category, description, is_system) VALUES
-- Icons danh mục
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'icon_Appetizers', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/fork_plate_white.svg', 'string', 'icon Danh mục món', 'Icon nĩa dĩa', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'icon_Beverage', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/wine_bottle_white.svg', 'string', 'icon Danh mục món', 'Icon ly rượu', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'icon_Main_course', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/kitchen-pack-steam.svg', 'string', 'icon Danh mục món', 'Icon bát to', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'icon_All', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/menu_fork_white.svg', 'string', 'icon Danh mục món', 'Icon tất cả', false),
-- Avatars
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'avatar_1', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt1.svg', 'string', 'avatar', 'Avatar mẫu 1', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'avatar_2', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt2.svg', 'string', 'avatar', 'Avatar mẫu 2', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'avatar_3', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt3.svg', 'string', 'avatar', 'Avatar mẫu 3', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'avatar_4', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt4.svg', 'string', 'avatar', 'Avatar mẫu 4', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'avatar_5', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt5.svg', 'string', 'avatar', 'Avatar mẫu 5', false),
('019abac9-846f-75d0-8dfd-bcf9c9457801', 'avatar_6', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt6.svg', 'string', 'avatar', 'Avatar mẫu 6', false);

-- App Settings - Tenant 2
INSERT INTO app_settings (tenant_id, key, value, value_type, category, description, is_system) VALUES
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'icon_Khai_vi', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/salad%20(1).png', 'string', 'icon Danh mục món', 'Icon salad', false),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'icon_Do_uong', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/tea_cup_black.svg', 'string', 'icon Danh mục món', 'Icon ly trà', false),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'icon_Mon_chinh', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/dinner.png', 'string', 'icon Danh mục món', 'Icon nồi', false),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'icon_All', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/menu_fork_white.svg', 'string', 'icon Danh mục món', 'Icon tất cả', false),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'avatar_1', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt1.svg', 'string', 'avatar', 'Avatar mẫu 1', false),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'avatar_2', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt2.svg', 'string', 'avatar', 'Avatar mẫu 2', false),
('019abac9-846f-75d0-8dfd-bcf9c9457802', 'avatar_3', 'https://eertxcqtdinpujxukdss.supabase.co/storage/v1/object/public/imageBucket/avt3.svg', 'string', 'avatar', 'Avatar mẫu 3', false);
