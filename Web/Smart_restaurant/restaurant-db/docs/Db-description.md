# MÔ TẢ CHI TIẾT CÁC BẢNG TRONG DATABASE
# Hệ thống Smart Restaurant

**Ngày tạo:** 18/01/2026  
**Tổng số bảng:** 17 bảng (không tính bảng Knex migrations)

---

## MỤC LỤC

1. [Core System Tables](#1-core-system-tables) - Các bảng hệ thống lõi
2. [Menu & Product Catalog](#2-menu--product-catalog) - Quản lý thực đơn và sản phẩm
3. [Order & Operation](#3-order--operation) - Quản lý đơn hàng và vận hành

---

## 1. CORE SYSTEM TABLES

Các bảng nền tảng của hệ thống, quản lý multi-tenancy, người dùng và cấu hình.

### 1.1 Bảng `tenants` - Thông tin nhà hàng

Lưu trữ thông tin của từng nhà hàng trong hệ thống multi-tenant.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v7() | ID duy nhất của nhà hàng, tự sinh UUID v7 |
| name | VARCHAR | NOT NULL | Tên nhà hàng |
| slug | VARCHAR | NOT NULL, UNIQUE | Đường dẫn URL thân thiện (vd: "nha-hang-phuong-nam") |
| email | VARCHAR | NOT NULL | Email liên hệ của nhà hàng |
| status | VARCHAR | DEFAULT 'active' | Trạng thái: 'active', 'inactive', 'suspended' |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời điểm tạo |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời điểm cập nhật gần nhất |
| logo_url | TEXT | - | URL logo nhà hàng |
| address | TEXT | - | Địa chỉ nhà hàng |
| phone | VARCHAR | - | Số điện thoại liên hệ |
| tax_rate | NUMERIC | DEFAULT 5.00 | Thuế suất mặc định (%) |
| service_charge | NUMERIC | DEFAULT 0.00 | Phí dịch vụ mặc định (%) |
| discount_rules | JSONB | DEFAULT '[]' | Quy tắc giảm giá dạng JSON array |
| qr_payment | TEXT | - | Thông tin QR thanh toán (MoMo, VNPay...) |

---

### 1.2 Bảng `platform_users` - Quản trị viên hệ thống

Lưu trữ tài khoản Super Admin quản lý toàn bộ platform.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| email | VARCHAR | NOT NULL, UNIQUE | Email đăng nhập, phải duy nhất |
| password_hash | VARCHAR | NOT NULL | Mật khẩu đã hash (bcrypt) |
| name | VARCHAR | - | Tên hiển thị |
| role | VARCHAR | DEFAULT 'super_admin' | Vai trò: 'super_admin' |
| refresh_token_hash | TEXT | - | Hash của refresh token |
| refresh_token_expires | TIMESTAMP WITH TIME ZONE | - | Thời điểm hết hạn refresh token |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời điểm tạo |
| updated_at | TIMESTAMP | - | Thời điểm cập nhật |

---

### 1.3 Bảng `users` - Nhân viên nhà hàng

Lưu trữ thông tin nhân viên của từng nhà hàng (Admin, Waiter, Chef).

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| email | VARCHAR | NOT NULL | Email đăng nhập (unique trong tenant) |
| password_hash | VARCHAR | NOT NULL | Mật khẩu đã hash (bcrypt) |
| full_name | VARCHAR | - | Họ tên đầy đủ |
| role | VARCHAR | NOT NULL, DEFAULT 'waiter' | Vai trò: 'Admin', 'Waiter', 'Chef' |
| is_active | BOOLEAN | DEFAULT true | Trạng thái hoạt động |
| refresh_token_hash | TEXT | - | Hash của refresh token |
| refresh_token_expires | TIMESTAMP WITH TIME ZONE | - | Thời điểm hết hạn refresh token |
| phone_number | TEXT | - | Số điện thoại |
| date_of_birth | DATE | - | Ngày sinh |
| hometown | TEXT | - | Quê quán |
| avatar_url | TEXT | - | URL ảnh đại diện |
| avatar_type | VARCHAR | DEFAULT 'default' | Loại avatar: 'default', 'custom', 'google' |

---

### 1.4 Bảng `customers` - Khách hàng

Lưu trữ thông tin khách hàng đã đăng ký tài khoản.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| phone_number | VARCHAR | - | Số điện thoại (unique trong tenant) |
| full_name | VARCHAR | - | Họ tên khách hàng |
| email | TEXT | - | Email (dùng cho đăng nhập) |
| password | TEXT | - | Mật khẩu đã hash |
| loyalty_points | INTEGER | DEFAULT 0 | Điểm tích lũy |
| is_active | BOOLEAN | DEFAULT true | Trạng thái hoạt động |
| google_id | TEXT | - | ID Google (đăng nhập OAuth) |
| avatar | TEXT | - | URL ảnh đại diện |

---

### 1.5 Bảng `app_settings` - Cấu hình ứng dụng

Lưu trữ các cấu hình tùy chỉnh của từng nhà hàng.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| key | VARCHAR | NOT NULL | Khóa cấu hình (vd: 'currency', 'language') |
| value | TEXT | NOT NULL | Giá trị cấu hình |
| value_type | VARCHAR | NOT NULL | Kiểu dữ liệu: 'string', 'number', 'boolean', 'json' |
| category | VARCHAR | NOT NULL | Nhóm cấu hình: 'general', 'display', 'payment' |
| description | TEXT | - | Mô tả cấu hình |
| is_system | BOOLEAN | NOT NULL, DEFAULT false | Cấu hình hệ thống (không cho sửa) |

---

### 1.6 Bảng `tables` - Bàn ăn

Lưu trữ thông tin các bàn trong nhà hàng.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| table_number | VARCHAR | NOT NULL | Số/Tên bàn (unique trong tenant) |
| capacity | INTEGER | DEFAULT 4, CHECK (1-20) | Sức chứa (số người) |
| location | ENUM (table_location) | DEFAULT 'Indoor' | Vị trí: 'Indoor', 'Outdoor', 'Patio', 'VIP_Room' |
| status | ENUM (table_status) | DEFAULT 'Available' | Trạng thái: 'Active', 'Inactive', 'Available', 'Occupied' |
| is_vip | BOOLEAN | NOT NULL, DEFAULT false | Bàn VIP |
| description | VARCHAR | - | Mô tả thêm về bàn |
| qr_token | VARCHAR | - | Token trong QR code |
| qr_token_created_at | TIMESTAMP | - | Thời điểm tạo QR token |
| current_order_id | BIGINT | FK → orders(id) | ID đơn hàng đang active tại bàn |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời điểm cập nhật |

---

## 2. MENU & PRODUCT CATALOG

Các bảng quản lý thực đơn, món ăn và tùy chọn modifier.

### 2.1 Bảng `categories` - Danh mục món ăn

Phân loại các món ăn theo nhóm.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| name | VARCHAR | NOT NULL | Tên danh mục (vd: "Món khai vị", "Đồ uống") |
| description | TEXT | - | Mô tả danh mục |
| display_order | INTEGER | DEFAULT 0 | Thứ tự hiển thị trên menu |
| is_active | BOOLEAN | DEFAULT true | Trạng thái hiển thị |
| url_icon | TEXT | - | URL icon/hình ảnh danh mục |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời điểm tạo |
| updated_at | TIMESTAMP WITH TIME ZONE | - | Thời điểm cập nhật |

---

### 2.2 Bảng `dishes` - Món ăn

Thông tin chi tiết các món ăn trong thực đơn.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| category_id | INTEGER | FK → categories(id) | Liên kết đến danh mục |
| name | VARCHAR | NOT NULL | Tên món ăn |
| description | TEXT | - | Mô tả món ăn |
| price | NUMERIC | NOT NULL | Giá bán (VNĐ) |
| image_url | TEXT | - | URL hình ảnh chính |
| is_available | BOOLEAN | DEFAULT true | Còn phục vụ hay không |
| status | ENUM (dish_status) | DEFAULT 'Available' | Trạng thái: 'Available', 'Unavailable', 'Hidden' |
| prep_time_minutes | INTEGER | DEFAULT 0, CHECK (0-240) | Thời gian chuẩn bị (phút) |
| is_recommended | BOOLEAN | - | Món được đề xuất |
| order_count | BIGINT | - | Số lần được đặt (thống kê) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời điểm tạo |
| updated_at | TIMESTAMP WITH TIME ZONE | - | Thời điểm cập nhật |

---

### 2.3 Bảng `menu_item_photos` - Ảnh món ăn

Lưu trữ nhiều ảnh cho một món ăn.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| dish_id | INTEGER | FK → dishes(id) | Liên kết đến món ăn |
| url | TEXT | NOT NULL | URL hình ảnh |
| is_primary | BOOLEAN | DEFAULT false | Ảnh chính (hiển thị trên menu) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo |

---

### 2.4 Bảng `modifier_groups` - Nhóm tùy chọn

Định nghĩa các nhóm tùy chọn cho món ăn (Size, Topping, Mức đá...).

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| name | VARCHAR | NOT NULL | Tên nhóm (vd: "Mức Đá", "Kích cỡ") |
| selection_type | VARCHAR | NOT NULL, CHECK ('single', 'multiple') | Kiểu chọn: 'single' (radio), 'multiple' (checkbox) |
| is_required | BOOLEAN | DEFAULT false | Bắt buộc phải chọn |
| min_selections | INTEGER | DEFAULT 0 | Số option tối thiểu phải chọn |
| max_selections | INTEGER | DEFAULT 0 | Số option tối đa được chọn (0 = không giới hạn) |
| display_order | INTEGER | DEFAULT 0 | Thứ tự hiển thị |
| is_active | BOOLEAN | DEFAULT true | Trạng thái hoạt động |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Thời điểm cập nhật |

---

### 2.5 Bảng `modifier_options` - Tùy chọn chi tiết

Các lựa chọn cụ thể trong mỗi nhóm modifier.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| group_id | INTEGER | NOT NULL, FK → modifier_groups(id) | Liên kết đến nhóm modifier |
| name | VARCHAR | NOT NULL | Tên option (vd: "Size Lớn", "Thêm Chả") |
| price_adjustment | NUMERIC | DEFAULT 0, CHECK (>= 0) | Giá cộng thêm (VNĐ) |
| is_active | BOOLEAN | DEFAULT true | Trạng thái hoạt động |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo |

---

### 2.6 Bảng `menu_item_modifier_groups` - Liên kết món-modifier

Bảng trung gian xác định món nào có thể dùng group modifier nào.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| dish_id | INTEGER | NOT NULL, FK → dishes(id), PK | Liên kết đến món ăn |
| group_id | INTEGER | NOT NULL, FK → modifier_groups(id), PK | Liên kết đến nhóm modifier |

**Ghi chú:** Primary Key là composite key (dish_id, group_id).

---

### 2.7 Bảng `reviews` - Đánh giá món ăn

Lưu trữ đánh giá của khách hàng về món ăn.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | BIGINT | PRIMARY KEY, IDENTITY | ID tự sinh |
| customer_id | INTEGER | NOT NULL, FK → customers(id) | Khách hàng đánh giá |
| dish_id | INTEGER | FK → dishes(id) | Món ăn được đánh giá |
| order_id | BIGINT | - | Đơn hàng liên quan (để verify đã mua) |
| rating | SMALLINT | - | Số sao (1-5) |
| comment | TEXT | - | Nhận xét |
| created_at | TIMESTAMP | - | Thời điểm đánh giá |

---

### 2.8 Bảng `dish_ratings` - Thống kê đánh giá

Bảng aggregate lưu thống kê đánh giá của mỗi món.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | BIGINT | PRIMARY KEY, IDENTITY | ID tự sinh |
| dish_id | INTEGER | NOT NULL, FK → dishes(id) | Liên kết đến món ăn |
| total_reviews | BIGINT | - | Tổng số lượt đánh giá |
| average_rating | REAL | - | Điểm trung bình (1.0 - 5.0) |
| rating_1 | SMALLINT | - | Số lượt 1 sao |
| rating_2 | SMALLINT | - | Số lượt 2 sao |
| rating_3 | SMALLINT | - | Số lượt 3 sao |
| rating_4 | SMALLINT | - | Số lượt 4 sao |
| rating_5 | SMALLINT | - | Số lượt 5 sao |

---

## 3. ORDER & OPERATION

Các bảng quản lý đơn hàng, thanh toán và quy trình vận hành.

### 3.1 Bảng `orders` - Đơn hàng

Thông tin tổng quan về mỗi đơn hàng.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | BIGINT | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| table_id | INTEGER | FK → tables(id) | Bàn đặt món |
| customer_id | INTEGER | FK → customers(id) | Khách hàng (nullable nếu khách vãng lai) |
| waiter_id | INTEGER | FK → users(id) | Nhân viên phục vụ |
| status | ENUM (order_status) | DEFAULT 'Unsubmit' | Trạng thái đơn (xem bảng trạng thái) |
| total_amount | NUMERIC | DEFAULT 0 | Tổng tiền món (chưa thuế/phí) |
| prep_time_order | INTEGER | DEFAULT 0 | Thời gian chuẩn bị ước tính (phút) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời điểm tạo đơn |
| completed_at | TIMESTAMP WITH TIME ZONE | - | Thời điểm hoàn thành |

**Các giá trị status:**
- `Unsubmit`: Đơn mới tạo, chờ xác nhận
- `Approved`: Waiter đã nhận đơn
- `Pending`: Đang chờ bếp xử lý
- `Completed`: Bếp đã hoàn thành
- `Served`: Đã phục vụ lên bàn
- `Paid`: Đã thanh toán
- `Cancelled`: Đã hủy

---

### 3.2 Bảng `order_details` - Chi tiết đơn hàng

Từng món trong đơn hàng (gom nhóm theo dish + modifiers).

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | BIGINT | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| order_id | BIGINT | NOT NULL, FK → orders(id) | Liên kết đến đơn hàng |
| dish_id | INTEGER | FK → dishes(id) | Liên kết đến món ăn |
| quantity | INTEGER | NOT NULL, CHECK (> 0) | Số lượng |
| unit_price | NUMERIC | NOT NULL | Giá đơn vị tại thời điểm đặt |
| total_price | NUMERIC | GENERATED (quantity * unit_price) | Thành tiền (không tính modifier) |
| note | VARCHAR | - | Ghi chú cho món (vd: "Ít cay") |
| status | ENUM (item_status) | - | Trạng thái: 'Pending', 'Ready', 'Served', 'Cancelled' |

**Ghi chú quan trọng:** 
- Mỗi tổ hợp (dish + modifiers) tạo 1 order_detail riêng
- Cùng món, khác modifier = 2 order_details khác nhau

---

### 3.3 Bảng `order_item_modifiers` - Modifier đã chọn

Lưu các modifier option đã được chọn cho mỗi order_detail.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | BIGINT | PRIMARY KEY, IDENTITY | ID tự sinh |
| order_detail_id | BIGINT | FK → order_details(id) | Liên kết đến chi tiết đơn |
| modifier_option_id | INTEGER | FK → modifier_options(id) | Liên kết đến option đã chọn |
| option_name | TEXT | - | Tên option (snapshot tại thời điểm đặt) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Thời điểm tạo |

**Ghi chú:** `option_name` lưu snapshot để đảm bảo hiển thị đúng dù option bị sửa sau đó.

---

### 3.4 Bảng `payments` - Thanh toán

Thông tin thanh toán cho mỗi đơn hàng.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|------------|--------------|-----------|---------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | ID tự tăng |
| tenant_id | UUID | NOT NULL, FK → tenants(id) | Liên kết đến nhà hàng |
| order_id | BIGINT | UNIQUE, FK → orders(id) | Liên kết đến đơn hàng (1 order = 1 payment) |
| subtotal | NUMERIC | DEFAULT 0 | Tiền gốc (tổng giá món + modifiers) |
| discount_percent | NUMERIC | DEFAULT 0 | Phần trăm giảm giá |
| discount_amount | NUMERIC | DEFAULT 0 | Số tiền được giảm |
| tax_rate | NUMERIC | DEFAULT 0 | Thuế suất (%) |
| tax_amount | NUMERIC | DEFAULT 0 | Số tiền thuế |
| service_charge_rate | NUMERIC | DEFAULT 0 | Phí dịch vụ (%) |
| service_charge_amount | NUMERIC | DEFAULT 0 | Số tiền phí dịch vụ |
| amount | NUMERIC | NOT NULL | Tổng tiền cuối cùng (sau giảm giá, thuế, phí) |
| payment_method | ENUM (payment_method_enum) | DEFAULT 'Cash' | Phương thức: 'Cash', 'Card', 'E-Wallet' |
| transaction_id | TEXT | - | Mã giao dịch (nếu thanh toán online) |
| paid_at | TIMESTAMP WITH TIME ZONE | - | Thời điểm thanh toán |

**Công thức tính amount:**
```
discount_amount = subtotal × (discount_percent / 100)
after_discount = subtotal - discount_amount
tax_amount = after_discount × (tax_rate / 100)
service_charge_amount = after_discount × (service_charge_rate / 100)
amount = after_discount + tax_amount + service_charge_amount
```

---

## PHỤ LỤC: DANH SÁCH ENUM TYPES

### A. dish_status
- `Available` - Còn phục vụ
- `Unavailable` - Hết món
- `Hidden` - Ẩn khỏi menu

### B. table_status
- `Active` - Bàn đang hoạt động
- `Inactive` - Bàn tạm ngưng
- `Available` - Bàn trống
- `Occupied` - Bàn có khách

### C. table_location
- `Indoor` - Trong nhà
- `Outdoor` - Ngoài trời
- `Patio` - Sân hiên
- `VIP_Room` - Phòng VIP

### D. order_status
- `Unsubmit` - Chờ xác nhận
- `Approved` - Đã nhận đơn
- `Pending` - Đang chế biến
- `Completed` - Đã hoàn thành
- `Served` - Đã phục vụ
- `Paid` - Đã thanh toán
- `Cancelled` - Đã hủy

### E. item_status (order_details)
- `Pending` - Đang chờ
- `Ready` - Đã sẵn sàng
- `Served` - Đã phục vụ
- `Cancelled` - Đã hủy

### F. payment_method_enum
- `Cash` - Tiền mặt
- `Card` - Thẻ
- `E-Wallet` - Ví điện tử

---

## PHỤ LỤC: SƠ ĐỒ QUAN HỆ

```
                              ┌─────────────────┐
                              │    tenants      │
                              │    (1 nhà hàng) │
                              └────────┬────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
   ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
   │    users    │              │  categories │              │   tables    │
   │  (nhân viên)│              │ (danh mục)  │              │   (bàn)     │
   └──────┬──────┘              └──────┬──────┘              └──────┬──────┘
          │                            │                            │
          │                            ▼                            │
          │                     ┌─────────────┐                     │
          │                     │   dishes    │◄────────────────────┼──┐
          │                     │  (món ăn)   │                     │  │
          │                     └──────┬──────┘                     │  │
          │                            │                            │  │
          │     ┌──────────────────────┼──────────────────────┐     │  │
          │     │                      │                      │     │  │
          │     ▼                      ▼                      ▼     │  │
          │ ┌─────────┐         ┌─────────────┐         ┌─────────┐ │  │
          │ │ photos  │         │  modifier_  │         │ reviews │ │  │
          │ └─────────┘         │   groups    │         └─────────┘ │  │
          │                     └──────┬──────┘                     │  │
          │                            │                            │  │
          │                            ▼                            │  │
          │                     ┌─────────────┐                     │  │
          │                     │  modifier_  │                     │  │
          │                     │   options   │                     │  │
          │                     └──────┬──────┘                     │  │
          │                            │                            │  │
          ▼                            ▼                            ▼  │
   ┌──────────────────────────────────────────────────────────────────┐│
   │                           orders                                  ││
   │            (đơn hàng - kết nối waiter, table, customer)          ││
   └──────────────────────────────┬───────────────────────────────────┘│
                                  │                                    │
                    ┌─────────────┴─────────────┐                      │
                    ▼                           ▼                      │
             ┌─────────────┐             ┌─────────────┐               │
             │order_details│             │  payments   │               │
             │(chi tiết đơn)│             │(thanh toán) │               │
             └──────┬──────┘             └─────────────┘               │
                    │                                                  │
                    ▼                                                  │
             ┌─────────────┐                                           │
             │order_item_  │◄──────────────────────────────────────────┘
             │ modifiers   │
             └─────────────┘
```

---

*Tài liệu mô tả chi tiết 17 bảng trong database Smart Restaurant.*

*Cập nhật: 18/01/2026*
