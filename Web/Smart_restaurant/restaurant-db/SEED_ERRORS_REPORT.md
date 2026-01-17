# Báo cáo Lỗi & Giải pháp - npm run seed

Tổng hợp tất cả các lỗi gặp phải trong quá trình chạy seed và cách khắc phục.

---

## Lỗi 1: Knex chạy file helper như seed file

### Triệu chứng
```
Invalid seed file: C:\...\seeds\dataGenerator.js must have a seed function
```

### Nguyên nhân
- Knex tự động quét **tất cả file `.js`** trong thư mục `seeds/`
- File `dataGenerator.js` chỉ là helper functions, không phải seed file
- Knex yêu cầu mỗi file trong `seeds/` phải có `export async function seed(knex)`

### Giải pháp
```
Di chuyển: seeds/dataGenerator.js → seeds/helpers/dataGenerator.js
```

Sau đó cập nhật import trong `index.js`:
```javascript
// Cũ
} from './dataGenerator.js';

// Mới
} from './helpers/dataGenerator.js';
```

### Bài học
> **Quy tắc Knex**: Chỉ đặt các file seed thực sự trong `seeds/`. Các helper/utilities nên đặt trong thư mục con.

---

## Lỗi 2: UUID không hợp lệ

### Triệu chứng
```
invalid input syntax for type uuid: "019abac9-846f-75d0-8dfd-bccdefault_1"
```

### Nguyên nhân
- UUID phải là chuỗi hex 32 ký tự (chỉ gồm 0-9 và a-f)
- `bccdefault_1` chứa ký tự không hợp lệ: `d`, `e`, `u`, `l`, `t`, `_`, `1`
- PostgreSQL từ chối parse chuỗi này thành UUID

### Giải pháp
Thay đổi Tenant IDs thành UUID hợp lệ:

| Cũ (không hợp lệ) | Mới (hợp lệ) |
|-------------------|--------------|
| `019abac9-846f-75d0-8dfd-bccdefault_1` | `019abac9-846f-75d0-8dfd-bcf9c9457801` |
| `019abac9-846f-75d0-8dfd-bccdefault_2` | `019abac9-846f-75d0-8dfd-bcf9c9457802` |

Files cần sửa:
- `seeds/helpers/dataGenerator.js` (CONFIG)
- `seed-by-sql/seed.sql` (tất cả INSERT statements)

### Bài học
> **UUID Format**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` với x thuộc {0-9, a-f}. Không có chữ cái khác hoặc ký tự đặc biệt.

---

## Lỗi 3: Đường dẫn file seed.sql sai

### Triệu chứng
```
seed.sql not found, skipping base data
```

### Nguyên nhân
Script đang tìm file ở đường dẫn sai:
```javascript
path.join(__dirname, '..', 'seed', 'seed.sql')  // Tìm trong thư mục "seed"
```

Nhưng thực tế file nằm ở:
```
restaurant-db/seed-by-sql/seed.sql
```

### Giải pháp
```javascript
// Cũ
const seedSqlPath = path.join(__dirname, '..', 'seed', 'seed.sql');

// Mới
const seedSqlPath = path.join(__dirname, '..', 'seed-by-sql', 'seed.sql');
```

### Bài học
> **Kiểm tra đường dẫn**: Luôn verify đường dẫn file bằng cách `ls` hoặc kiểm tra trong file explorer trước khi code.

---

## Lỗi 4: SQL Parser không xử lý comments

### Triệu chứng
```
Step 1: Running base seed.sql...
Base data: 0 statements succeeded, 0 skipped/failed
```

### Nguyên nhân
Logic split SQL:
```javascript
seedSql.split(';')
  .filter(s => !s.startsWith('--'))  // Không hoạt động
```

Vấn đề: Mỗi SQL statement có comments ở đầu:
```sql
-- 1. TENANTS
INSERT INTO tenants ...
```

Sau khi split bằng `;`, statement trông như:
```
"-- 1. TENANTS\nINSERT INTO tenants ..."
```

Vì bắt đầu bằng `--`, nó bị filter bỏ hoàn toàn!

### Giải pháp
Loại bỏ comment lines **từ bên trong** mỗi statement:
```javascript
const statements = seedSql
    .split(';')
    .map(s => {
        // Loại bỏ comment lines khỏi mỗi statement
        const lines = s.split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .trim();
        return lines;
    })
    .filter(s => s.length > 10 && s.toUpperCase().startsWith('INSERT'));
```

### Bài học
> **SQL Parsing phức tạp**: Khi parse SQL thủ công, cần xử lý:
> - Multi-line statements
> - Comments (`--`, `/* */`)
> - Strings có chứa `;`
> 
> Nên dùng thư viện SQL parser chuyên dụng nếu có thể.

---

## Lỗi 5: Crash khi không có dữ liệu context

### Triệu chứng
```
Cannot read properties of undefined (reading 'price')
```

### Nguyên nhân
Hàm `generateOrder()` cố gắng truy cập:
```javascript
const dish = randomChoice(dishes);  // dishes = [] (rỗng)
const unitPrice = parseFloat(dish.price);  // dish = undefined → CRASH!
```

Do Step 1 không insert dữ liệu thành công, nên `dishes = []`.

### Giải pháp
Thêm kiểm tra an toàn trước khi generate orders:
```javascript
if (dishes.length === 0 || allTables.length === 0) {
    console.log('Skipping orders: No dishes or tables found for this tenant');
    console.log('Check if seed.sql base data was inserted correctly');
    continue; // Skip to next tenant
}
```

### Bài học
> **Defensive Programming**: Luôn validate input data trước khi sử dụng, đặc biệt khi dữ liệu đến từ database hoặc bước trước đó.

---

## Tổng kết

| # | Lỗi | Root Cause | Files bị ảnh hưởng |
|---|-----|------------|-------------------|
| 1 | Knex chạy helper file | Cấu trúc thư mục sai | `seeds/dataGenerator.js` |
| 2 | UUID không hợp lệ | Syntax error trong data | `dataGenerator.js`, `seed.sql` |
| 3 | Đường dẫn file sai | Typo trong code | `seeds/index.js` |
| 4 | SQL parser lỗi | Logic xử lý comments | `seeds/index.js` |
| 5 | Runtime crash | Thiếu validation | `seeds/index.js` |

---

## Checklist Phòng tránh

Khi làm việc với Knex Seed:

- [ ] Chỉ đặt file seed (có `export function seed`) trong `seeds/`
- [ ] Đặt helpers/utils vào `seeds/helpers/` hoặc folder riêng
- [ ] Kiểm tra UUID format: chỉ hex characters (0-9, a-f)
- [ ] Verify đường dẫn file trước khi code
- [ ] Khi parse SQL thủ công, xử lý comments cẩn thận
- [ ] Thêm validation/safety checks cho data từ database
- [ ] Test seed với database trống để phát hiện lỗi sớm

---

*Ngày tạo: 17/01/2026*
