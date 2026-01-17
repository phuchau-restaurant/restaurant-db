# BÁO CÁO TÀI LIỆU LOGIC NGHIỆP VỤ
# Hệ thống Smart Restaurant

**Ngày tạo:** 17/01/2026  
**Phiên bản:** 2.0  
**Người thực hiện:** Nguyễn Văn Bình Dương.

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Tổng quan Database Schema](#2-tổng-quan-database-schema)
3. [Orders - Đơn hàng](#3-orders---đơn-hàng)
4. [Order Details - Chi tiết đơn hàng](#4-order-details---chi-tiết-đơn-hàng)
5. [Modifier System - Hệ thống tùy chọn món](#5-modifier-system---hệ-thống-tùy-chọn-món)
6. [Payments - Thanh toán](#6-payments---thanh-toán)
7. [Tables - Bàn ăn](#7-tables---bàn-ăn)
8. [Hướng dẫn Seeding Data](#8-hướng-dẫn-seeding-data)
9. [Checklist Validation](#9-checklist-validation)

---

## 1. Giới thiệu

### 1.1 Mục đích tài liệu

Tài liệu này mô tả chi tiết logic nghiệp vụ của hệ thống Smart Restaurant, phục vụ cho việc:
- Data seeding một cách logic và hợp lệ
- Hiểu rõ các quy tắc ràng buộc giữa các bảng
- Đảm bảo tính nhất quán của dữ liệu

### 1.2 Phạm vi

Tập trung vào các bảng phức tạp có nhiều ràng buộc nghiệp vụ:
- `orders` - Đơn hàng
- `order_details` - Chi tiết đơn hàng
- `order_item_modifiers` - Modifier của từng món
- `payments` - Thanh toán
- `tables` - Bàn ăn
- `modifier_groups` / `modifier_options` - Hệ thống tùy chọn

---

## 2. Tổng quan Database Schema

### 2.1 Sơ đồ quan hệ chính

```
tenants (Nhà hàng)
    |
    +-- tables ---------> orders (current_order_id)
    |                        |
    +-- dishes               +-- order_details
    |      |                        |
    +-- modifier_groups             +-- order_item_modifiers
           |                               |
           +-- modifier_options -----------+
           |
           +-- menu_item_modifier_groups (liên kết dishes - groups)
```

### 2.2 Mối quan hệ giữa các bảng

| Bảng nguồn | Bảng đích | Quan hệ | Mô tả |
|------------|-----------|---------|-------|
| tenants | orders | 1:N | Một nhà hàng có nhiều đơn |
| tables | orders | 1:N | Một bàn có nhiều đơn (qua history) |
| tables | orders | 1:1 | current_order_id - đơn đang active |
| orders | order_details | 1:N | Một đơn có nhiều chi tiết |
| order_details | order_item_modifiers | 1:N | Một chi tiết có nhiều modifier |
| dishes | order_details | 1:N | Một món xuất hiện nhiều lần |
| modifier_options | order_item_modifiers | 1:N | Một option được chọn nhiều lần |
| orders | payments | 1:1 | Một đơn chỉ có một thanh toán |

---

## 3. Orders - Đơn hàng

### 3.1 Cấu trúc bảng orders

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| id | BIGSERIAL | ID tự tăng | PRIMARY KEY |
| tenant_id | UUID | ID nhà hàng | NOT NULL, FK |
| table_id | INTEGER | ID bàn đang order | FK |
| customer_id | INTEGER | ID khách hàng | NULLABLE, FK |
| waiter_id | INTEGER | ID nhân viên phục vụ | NULLABLE, FK |
| status | order_status | Trạng thái đơn | NOT NULL, ENUM |
| total_amount | NUMERIC(12,2) | Tổng tiền (chưa thuế/phí) | DEFAULT 0 |
| prep_time_order | INTEGER | Thời gian chuẩn bị (phút) | NULLABLE |
| created_at | TIMESTAMP | Thời điểm tạo đơn | DEFAULT NOW() |
| completed_at | TIMESTAMP | Thời điểm hoàn thành | NULLABLE |

### 3.2 Order Status - Vòng đời đơn hàng

```
[Tạo mới] --> Unsubmit --> Approved --> Pending --> Completed --> Served --> Paid
                |              |           |
                +--------------+-----------+-------> Cancelled
```

| Status | Mô tả | Điều kiện chuyển tiếp |
|--------|-------|----------------------|
| Unsubmit | Đơn mới tạo, chờ waiter xác nhận | Mặc định khi createOrder() |
| Approved | Waiter đã nhận đơn | Khi gán waiter_id lần đầu |
| Pending | Đang chờ bếp xử lý | Waiter xác nhận gửi bếp |
| Completed | Bếp đã hoàn thành tất cả món | Tất cả order_details.status = Ready |
| Served | Đã phục vụ lên bàn | Tất cả order_details.status = Served |
| Paid | Đã thanh toán | Sau khi tạo payment record |
| Cancelled | Đã hủy | Có thể hủy từ các trạng thái trước Paid |

### 3.3 Quy tắc nghiệp vụ Orders

1. **waiter_id logic:**
   - `NULL` khi status = Unsubmit
   - Có giá trị từ khi status = Approved trở đi

2. **completed_at logic:**
   - `NULL` khi status chưa đến Completed
   - Có giá trị khi status = Completed, Served, Paid

3. **total_amount calculation:**
   ```
   total_amount = SUM((unit_price + modifier_total) * quantity)
   
   Trong đó:
   - unit_price: Giá món từ bảng dishes
   - modifier_total: SUM(price_adjustment) của các modifier_options được chọn
   - quantity: Số lượng món trong order_detail
   ```

### 3.4 Ví dụ tính total_amount

| Order Detail | Món | Giá gốc | Modifier | Giá Modifier | Quantity | Subtotal |
|--------------|-----|---------|----------|--------------|----------|----------|
| 1 | Cơm tấm | 50,000 | Thêm Chả Trứng | 10,000 | 3 | 180,000 |
| 2 | Trà Đào | 35,000 | 50% Đá | 0 | 2 | 70,000 |
| **Total** | | | | | | **250,000** |

---

## 4. Order Details - Chi tiết đơn hàng

### 4.1 Cấu trúc bảng order_details

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| id | BIGSERIAL | ID tự tăng | PRIMARY KEY |
| tenant_id | UUID | ID nhà hàng | NOT NULL, FK |
| order_id | BIGINT | FK đến orders.id | NOT NULL, FK |
| dish_id | INTEGER | FK đến dishes.id | NOT NULL, FK |
| quantity | INTEGER | Số lượng | > 0 |
| unit_price | NUMERIC(12,2) | Giá gốc lúc đặt | NOT NULL |
| total_price | NUMERIC(12,2) | GENERATED: quantity * unit_price | COMPUTED |
| note | VARCHAR(255) | Ghi chú món | NULLABLE |
| status | item_status | Trạng thái món | ENUM |

### 4.2 Order Detail Status

| Status | Mô tả |
|--------|-------|
| NULL | Mới tạo, chưa gửi bếp |
| Pending | Đang chờ bếp làm |
| Ready | Bếp đã xong, chờ phục vụ |
| Served | Đã phục vụ lên bàn |
| Cancelled | Đã hủy |

### 4.3 Mapping Order Status --> Order Detail Status

| Order Status | Order Detail Status cho phép |
|--------------|------------------------------|
| Unsubmit | NULL |
| Approved | NULL hoặc Pending |
| Pending | Pending hoặc Ready |
| Completed | Ready |
| Served | Served |
| Paid | Served |
| Cancelled | Cancelled |

### 4.4 QUAN TRONG: Quy tắc gom nhóm Order Details

Mỗi **tổ hợp (dish + modifiers) khác nhau** sẽ tạo ra **1 order_detail riêng biệt**, KHÔNG phải theo từng món lẻ.

**Ví dụ:**

Khách đặt:
- 3 Cơm chiên có tiêu
- 7 Cơm chiên thường
- 1 Chai nước lạnh
- 1 Chai nước thường

**Kết quả: 4 order_details (KHÔNG PHẢI 12)**

| order_detail_id | dish_id | quantity | Mô tả |
|-----------------|---------|----------|-------|
| 1 | 5 (Cơm chiên) | 3 | Có modifier "Thêm Tiêu" |
| 2 | 5 (Cơm chiên) | 7 | Không có modifier |
| 3 | 10 (Chai nước) | 1 | Có modifier "Lạnh" |
| 4 | 10 (Chai nước) | 1 | Không có modifier |

**Quy tắc tổng quát:**
- 2 món giống nhau nhưng khác modifier = 2 order_details riêng
- 2 món giống nhau, cùng modifier = gộp quantity, 1 order_detail

---

## 5. Modifier System - Hệ thống tùy chọn món

### 5.1 Cấu trúc bảng modifier_groups

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| id | SERIAL | ID tự tăng |
| tenant_id | UUID | ID nhà hàng |
| name | VARCHAR(100) | Tên nhóm |
| selection_type | VARCHAR(20) | 'single' hoặc 'multiple' |
| is_required | BOOLEAN | Bắt buộc chọn hay không |
| min_selections | INTEGER | Số option tối thiểu |
| max_selections | INTEGER | Số option tối đa |
| display_order | INTEGER | Thứ tự hiển thị |

### 5.2 Danh sách 5 Modifier Groups chuẩn

| ID | Name | Selection Type | Is Required | Áp dụng cho |
|----|------|----------------|-------------|-------------|
| 1 | Mức Đá | single | false | Đồ uống có đá |
| 2 | Kích cỡ đồ pha chế | single | true | Trà, cà phê, sinh tố |
| 3 | Kích cỡ lẩu | single | true | Các món lẩu |
| 4 | Kích cỡ món khô | single | true | Cơm, bún, mì |
| 5 | Topping Thêm | multiple | false | Cơm tấm, bún, phở |

### 5.3 QUAN TRONG: Quy tắc giá theo loại món

Các group "Kích cỡ" tuy có option cùng tên (Size Nhỏ, Size Lớn), nhưng **giá khác nhau** tùy loại món:

**Group 1: Mức Đá**
| Option | Giá điều chỉnh |
|--------|----------------|
| 100% Đá | 0 |
| 50% Đá | 0 |
| Không đá | 0 |

**Group 2: Kích cỡ đồ pha chế** (Trà, cà phê)
| Option | Giá điều chỉnh |
|--------|----------------|
| Size Nhỏ | 0 |
| Size Lớn | +10,000 |
| Size Siêu Lớn | +15,000 |

**Group 3: Kích cỡ lẩu**
| Option | Giá điều chỉnh |
|--------|----------------|
| Size Nhỏ | 0 |
| Size Lớn | +100,000 |
| Size Siêu Lớn | +180,000 |

**Group 4: Kích cỡ món khô** (Cơm, bún, mì)
| Option | Giá điều chỉnh |
|--------|----------------|
| Size Nhỏ | 0 |
| Size Lớn | +20,000 |
| Size Siêu Lớn | +35,000 |

**Group 5: Topping Thêm**
| Option | Giá điều chỉnh |
|--------|----------------|
| Thêm Chả Trứng | +10,000 |
| Thêm Bì | +5,000 |
| Thêm Mỡ Hành | 0 |

### 5.4 Quy tắc liên kết món - modifier (menu_item_modifier_groups)

| Loại món | Modifier Groups cần gán |
|----------|-------------------------|
| Trà, cà phê, sinh tố | Mức Đá + Kích cỡ đồ pha chế |
| Lẩu | Kích cỡ lẩu |
| Cơm tấm | Kích cỡ món khô + Topping Thêm |
| Bún, Phở | Kích cỡ món khô + Topping Thêm |
| Món khai vị | Kích cỡ món khô (optional) |
| Bia, nước đóng chai | Không có modifier |

### 5.5 Cấu trúc bảng order_item_modifiers

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| id | BIGSERIAL | ID tự tăng |
| order_detail_id | BIGINT | FK đến order_details.id |
| modifier_option_id | INTEGER | FK đến modifier_options.id |
| option_name | TEXT | Tên option (snapshot) |
| created_at | TIMESTAMP | Thời điểm tạo |

**Lưu ý quan trọng:**
- Trường `option_name` lưu snapshot tên option tại thời điểm đặt
- Điều này đảm bảo nếu option bị sửa tên sau, đơn hàng cũ vẫn hiển thị đúng

### 5.6 Selection Type Logic

| Type | UI | Behavior |
|------|----|---------| 
| single | Radio button | Chỉ chọn được 1, click option khác sẽ thay thế |
| multiple | Checkbox | Chọn được nhiều, giới hạn bởi max_selections |

**Validation rules:**
- is_required = true: Phải chọn ít nhất min_selections option
- max_selections: Giới hạn số option tối đa được chọn
- Mặc định: min_selections = 0, max_selections = 1 (cho single)

---

## 6. Payments - Thanh toán

### 6.1 Cấu trúc bảng payments

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| id | SERIAL | ID tự tăng |
| tenant_id | UUID | ID nhà hàng |
| order_id | BIGINT | FK đến orders.id (UNIQUE) |
| amount | NUMERIC(12,2) | Tổng tiền cuối cùng |
| subtotal | NUMERIC(12,2) | Tiền gốc (trước giảm giá) |
| discount_percent | NUMERIC | % giảm giá |
| discount_amount | NUMERIC | Số tiền được giảm |
| tax_rate | NUMERIC | % thuế |
| tax_amount | NUMERIC | Số tiền thuế |
| service_charge_rate | NUMERIC | % phí dịch vụ |
| service_charge_amount | NUMERIC | Số tiền phí dịch vụ |
| payment_method | ENUM | Cash, Card, E-Wallet |
| paid_at | TIMESTAMP | Thời điểm thanh toán |

### 6.2 Công thức tính Payment

```
BƯỚC 1: Tính subtotal
subtotal = SUM((unit_price + modifier_prices) * quantity)
         = Lấy từ order_details + order_item_modifiers

BƯỚC 2: Áp dụng discount (TRƯỚC thuế)
discount_amount = subtotal * (discount_percent / 100)
after_discount = subtotal - discount_amount

BƯỚC 3: Tính thuế và phí (SAU discount)
tax_amount = after_discount * (tax_rate / 100)
service_charge_amount = after_discount * (service_charge_rate / 100)

BƯỚC 4: Tính tổng cuối
amount = after_discount + tax_amount + service_charge_amount
```

### 6.3 Ví dụ tính Payment

**Dữ liệu đầu vào:**
- subtotal = 500,000đ
- tax_rate = 10% (từ tenant settings)
- service_charge_rate = 5%
- discount_rules: Giảm 10% cho đơn từ 200,000đ

**Quá trình tính:**

| Bước | Giá trị |
|------|---------|
| subtotal | 500,000 |
| discount_percent | 10% |
| discount_amount | 50,000 |
| after_discount | 450,000 |
| tax_amount (10%) | 45,000 |
| service_charge (5%) | 22,500 |
| **amount (final)** | **517,500** |

### 6.4 Ràng buộc quan trọng

1. **UNIQUE constraint**: 1 Order chỉ có thể có 1 Payment (order_id là UNIQUE)
2. **Quy trình khi tạo Payment:**
   - Kiểm tra order chưa có payment
   - Lấy tax_rate, service_charge từ tenants settings
   - Áp dụng discount_rules nếu có
   - Tạo payment record
   - Cập nhật orders.status = 'Paid'
   - Cập nhật tables.current_order_id = NULL

---

## 7. Tables - Bàn ăn

### 7.1 Cấu trúc bảng tables

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| id | SERIAL | ID tự tăng |
| tenant_id | UUID | ID nhà hàng |
| table_number | VARCHAR(20) | Số/Tên bàn (unique per tenant) |
| capacity | INTEGER | Sức chứa (1-20 người) |
| location | ENUM | Indoor, Outdoor, Patio, VIP_Room |
| status | ENUM | Active, Inactive, Available, Occupied |
| is_vip | BOOLEAN | Bàn VIP |
| qr_token | VARCHAR(500) | Token QR code |
| current_order_id | BIGINT | FK đến orders.id (nullable) |

### 7.2 Table Status

| Status | Mô tả |
|--------|-------|
| Active | Bàn đang hoạt động (mặc định) |
| Inactive | Bàn tạm ngưng (bảo trì) |
| Available | Bàn trống, sẵn sàng đón khách |
| Occupied | Bàn đang có khách |

### 7.3 QUAN TRONG: Logic current_order_id

Đây là trường quan trọng để liên kết realtime giữa Tables và Orders:

| current_order_id | Ý nghĩa |
|------------------|---------|
| NULL | Bàn trống, không có order nào đang active |
| = order.id | Bàn đang có order active với ID đó |

**Khi nào UPDATE current_order_id:**

| Sự kiện | Giá trị mới |
|---------|-------------|
| Tạo order mới (createOrder) | = newOrder.id |
| Order status = Paid | = NULL |
| Order status = Cancelled | = NULL |
| Xóa order | = NULL |

### 7.4 Validation Rules

- Không thể xóa/deactivate bàn nếu current_order_id != NULL
- table_number phải unique trong cùng tenant
- capacity phải trong khoảng 1-20

---

## 8. Hướng dẫn Seeding Data

### 8.1 Thứ tự Seeding (Quan trọng!)

```
LAYER 0 (Có sẵn):
1. tenants
2. platform_users
3. categories
4. app_settings

LAYER 0.5 (Gen trước):
5. modifier_groups
6. modifier_options
7. dishes
8. menu_item_modifier_groups

LAYER 1 (Độc lập):
9. users
10. customers
11. tables

LAYER 2-5 (Phụ thuộc):
12. orders
13. order_details
14. order_item_modifiers
15. payments
16. reviews
17. dish_ratings
```

### 8.2 Ví dụ Seeding Hoàn Chỉnh

**Kịch bản:** Bàn A1 có 1 đơn hàng với:
- 3 Cơm chiên có tiêu (50,000đ + 5,000đ mỗi phần)
- 7 Cơm chiên thường (50,000đ mỗi phần)
- 1 Chai nước lạnh (15,000đ)
- 1 Chai nước thường (15,000đ)

```sql
-- Tenant ID = '019abac9-846f-75d0-8dfd-bcf9c9457866'
-- dish_id: Cơm chiên = 5, Chai nước = 10
-- modifier_option: Thêm Tiêu = 20 (price=5000), Lạnh = 25 (price=0)

-- 1. Tạo Order
INSERT INTO orders (tenant_id, table_id, status, total_amount, created_at)
VALUES (
    '019abac9-846f-75d0-8dfd-bcf9c9457866',
    1,
    'Pending',
    545000,  -- 3*(50000+5000) + 7*50000 + 1*15000 + 1*15000
    NOW()
) RETURNING id;
-- Gia su tra ve id = 100

-- 2. Update Table voi current_order_id
UPDATE tables SET current_order_id = 100 WHERE id = 1;

-- 3. Tao 4 Order Details
INSERT INTO order_details (tenant_id, order_id, dish_id, quantity, unit_price, status)
VALUES
    ('019abac9-846f-75d0-8dfd-bcf9c9457866', 100, 5, 3, 50000, 'Pending'),
    ('019abac9-846f-75d0-8dfd-bcf9c9457866', 100, 5, 7, 50000, 'Pending'),
    ('019abac9-846f-75d0-8dfd-bcf9c9457866', 100, 10, 1, 15000, 'Pending'),
    ('019abac9-846f-75d0-8dfd-bcf9c9457866', 100, 10, 1, 15000, 'Pending')
RETURNING id;
-- Gia su tra ve: 201, 202, 203, 204

-- 4. Tao Order Item Modifiers (chi cho detail co modifier)
INSERT INTO order_item_modifiers (order_detail_id, modifier_option_id, option_name)
VALUES
    (201, 20, 'Them Tieu'),  -- Com chien co tieu
    (203, 25, 'Lanh');       -- Chai nuoc lanh

-- 5. Neu don da thanh toan, tao Payment
INSERT INTO payments (
    tenant_id, order_id, amount, subtotal,
    tax_rate, tax_amount, discount_percent, discount_amount,
    payment_method, paid_at
)
VALUES (
    '019abac9-846f-75d0-8dfd-bcf9c9457866',
    100,
    599500,   -- amount sau thue
    545000,   -- subtotal
    10,       -- tax_rate 10%
    54500,    -- tax_amount
    0,        -- khong giam gia
    0,
    'Cash',
    NOW()
);

-- 6. Update order status
UPDATE orders SET status = 'Paid' WHERE id = 100;

-- 7. Clear current_order_id cua ban
UPDATE tables SET current_order_id = NULL WHERE id = 1;
```

---

## 9. Checklist Validation

Khi seeding data, hãy kiểm tra các điều kiện sau:

### 9.1 Orders

- [ ] total_amount = Tổng của (unit_price + modifier prices) * quantity của tất cả order_details
- [ ] waiter_id = NULL khi status = Unsubmit
- [ ] waiter_id != NULL khi status != Unsubmit
- [ ] completed_at = NULL khi status chưa đến Completed
- [ ] created_at < completed_at (nếu có)

### 9.2 Order Details

- [ ] Order_details được gom theo tổ hợp (dish + modifiers), không phải từng món lẻ
- [ ] status phù hợp với order.status (xem bảng mapping)
- [ ] quantity > 0
- [ ] unit_price = giá từ dishes tại thời điểm đặt

### 9.3 Order Item Modifiers

- [ ] Chỉ tạo cho order_details có modifier được chọn
- [ ] modifier_option_id thuộc group được gán cho dish đó (qua menu_item_modifier_groups)
- [ ] option_name được lưu (snapshot)

### 9.4 Payments

- [ ] amount = subtotal - discount + tax + service_charge
- [ ] order_id là UNIQUE (1 order = 1 payment)
- [ ] Chỉ tạo cho orders có status = Paid
- [ ] discount được áp dụng TRƯỚC thuế

### 9.5 Tables

- [ ] current_order_id = NULL nếu không có order active
- [ ] current_order_id = order.id nếu order đang Unsubmit/Approved/Pending/Completed/Served
- [ ] current_order_id = NULL khi order đã Paid hoặc Cancelled
- [ ] table_number unique trong cùng tenant

### 9.6 Modifiers

- [ ] Mỗi modifier_group có tenant_id đúng
- [ ] Mỗi modifier_option có group_id tồn tại
- [ ] Không có modifier_option trùng name trong cùng group
- [ ] Price_adjustment phù hợp theo loại món (đồ uống khác lẩu khác cơm)

---

## PHU LUC: Tenant IDs đang sử dụng

```
Tenant 1: 019abac9-846f-75d0-8dfd-bcf9c9457866 (Nha hang A)
Tenant 2: 019bc623-e4a5-735d-9dc7-a9a6b28ee557 (Nha hang B)
```

---

*Tài liệu được tạo từ phân tích source code `restaurant-staff` và `restaurant-customer` backends.*

*Cập nhật: 17/01/2026*
