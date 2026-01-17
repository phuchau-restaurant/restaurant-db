# Seed Data Generator

Thư mục này chứa script và dữ liệu để tạo seed data số lượng lớn cho Smart Restaurant.

---

## Cấu trúc thư mục

```
seed-data/
├── README.md                 # File hướng dẫn này
├── generate_order_data.js    # Script chính để gen data
├── input/                    # Thư mục chứa file CSV đầu vào
│   ├── dishes.csv
│   ├── modifier_options.csv
│   ├── menu_item_modifier_groups.csv
│   ├── table_id.csv
│   ├── waiter_id.csv
│   ├── customer_id.csv
│   └── tables.csv
└── output/                   # Thư mục chứa file CSV đầu ra
    ├── orders.csv
    ├── order_details.csv
    ├── order_item_modifiers.csv
    ├── payments.csv
    ├── reviews.csv
    ├── dish_ratings.csv
    └── tables_updated.csv
```

---

## Yêu cầu

- **Node.js** v18+
- Các file CSV đầu vào trong thư mục `input/`

---

## Cách sử dụng

### 1. Chạy script

```bash
cd restaurant-db/seed-data
node generate_order_data.js
```

### 2. Kết quả

Script sẽ tạo ra 7 file CSV trong thư mục `output/`:

| File | Mô tả | Số dòng (mặc định) |
|------|-------|---------------------|
| `orders.csv` | Đơn hàng | ~21,960 |
| `order_details.csv` | Chi tiết đơn hàng | ~88,000 |
| `order_item_modifiers.csv` | Modifier của từng món | ~81,000 |
| `payments.csv` | Thanh toán | ~16,000 |
| `reviews.csv` | Đánh giá của khách | ~1,900 |
| `dish_ratings.csv` | Thống kê rating theo món | 68 |
| `tables_updated.csv` | Bảng tables với `current_order_id` | 60 |

---

## Cấu hình

Mở file `generate_order_data.js` và chỉnh sửa object `CONFIG` ở đầu file:

```javascript
const CONFIG = {
  // Tenant IDs (lấy từ database thực tế)
  TENANT_ID1: '019abac9-846f-75d0-8dfd-bcf9c9457866',
  TENANT_ID2: '019bc623-e4a5-735d-9dc7-a9a6b28ee557',
  
  // Số orders trung bình mỗi ngày cho mỗi tenant
  ORDERS_PER_DAY: 30,
  
  // Khoảng thời gian tạo orders (format timestamptz)
  DATE_START: '2025-01-17T00:00:00+07:00',
  DATE_END: '2026-01-17T23:59:59+07:00',
  
  // Thuế và phí dịch vụ (%)
  TAX_RATE: 5,
  SERVICE_CHARGE_RATE: 0,
  
  // Số món trong mỗi order
  MIN_ITEMS_PER_ORDER: 1,
  MAX_ITEMS_PER_ORDER: 7,
  
  // Phân bố trạng thái order (tổng = 100)
  STATUS_DISTRIBUTION: {
    Paid: 50,
    Served: 15,
    Completed: 10,
    Pending: 10,
    Approved: 5,
    Unsubmit: 5,
    Cancelled: 5
  },
  
  // Tỷ lệ order có review (0.25 = 25%)
  REVIEW_RATE: 0.25
};
```

---

## Logic quan trọng

### Order Status Flow

```
Unsubmit → Approved → Pending → Completed → Served → Paid
                ↓
            Cancelled
```

### Tính `total_amount`

```
total_amount = Σ (unit_price + modifier_prices) × quantity
```

### Tính Payment

```
subtotal = total_amount
discount = subtotal × discount_percent / 100
after_discount = subtotal - discount
tax = after_discount × tax_rate / 100
service = after_discount × service_charge_rate / 100
amount = after_discount + tax + service
```

### Discount Rules

| Điều kiện | Giảm giá |
|-----------|----------|
| subtotal >= 1,000,000đ | 15% |
| subtotal >= 500,000đ | 10% |
| subtotal < 500,000đ | 0% |

### Tables `current_order_id`

- Mỗi bàn chỉ có **tối đa 1 active order**
- Active order = status IN (`Unsubmit`, `Approved`, `Pending`, `Completed`, `Served`)
- Khi bàn có active order: `status = 'Occupied'`

---

## Import vào Supabase

### Thứ tự import (quan trọng!)

1. `orders.csv`
2. `order_details.csv`
3. `order_item_modifiers.csv`
4. `payments.csv`
5. `reviews.csv`
6. `dish_ratings.csv`
7. `tables_updated.csv` ⚠️ **Dùng UPDATE, KHÔNG dùng INSERT**

### Cách import

1. Vào **Supabase Dashboard**
2. Chọn **Table Editor**
3. Click vào bảng cần import
4. Click **Import data from CSV**
5. Chọn file CSV tương ứng

### Lưu ý với `tables_updated.csv`

File này dùng để **UPDATE** bảng `tables` hiện có, không phải INSERT mới. 
Bạn cần chạy SQL update hoặc xóa bảng tables cũ rồi import lại.

---

## Input files cần thiết

Trước khi chạy script, đảm bảo các file sau có trong thư mục `input/`:

| File | Mô tả | Cột quan trọng |
|------|-------|----------------|
| `dishes.csv` | Danh sách món ăn | `tenant_id`, `id`, `price` |
| `modifier_options.csv` | Tùy chọn modifier | `group_id`, `name`, `price_adjustment` |
| `menu_item_modifier_groups.csv` | Liên kết món-modifier | `dish_id`, `group_id` |
| `table_id.csv` | ID các bàn | `tenant_id`, `id` |
| `waiter_id.csv` | ID nhân viên phục vụ | `tenant_id`, `id` |
| `customer_id.csv` | ID khách hàng | `tenant_id`, `id` |
| `tables.csv` | Thông tin bàn đầy đủ | Tất cả cột |

---

## Troubleshooting

### Lỗi "Cannot find module"

```bash
# Đảm bảo đang ở đúng thư mục
cd restaurant-db/seed-data
```

### Lỗi "ENOENT: no such file"

Kiểm tra các file trong `input/` đã đầy đủ chưa.

### Muốn tạo ít dữ liệu hơn

Giảm `ORDERS_PER_DAY` hoặc thu hẹp khoảng `DATE_START` - `DATE_END`.

---

*Cập nhật: 17/01/2026*
