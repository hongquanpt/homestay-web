# 🏡 Hệ Thống Quản Lý & Đặt Phòng Homestay (Homestay Booking & Management System)

Hệ thống quản lý và đặt phòng Homestay trực tuyến hiện đại, được xây dựng tối ưu cho trải nghiệm người dùng cuối và quy trình vận hành tự động của chủ homestay. Hệ thống tích hợp đặt phòng linh hoạt theo khung giờ/ngày/qua đêm, thanh toán tự động VietQR (PayOS), tự động gửi thông tin nhận phòng/mật khẩu cửa qua Email, và bảng điều khiển quản trị toàn diện.

---

## 🚀 Tính Năng Nổi Bật

### 📲 Cho Khách Hàng (Client)
- **Đặt phòng linh hoạt**: Hỗ trợ nhiều gói thời gian (Trưa, Chơi chiều, Tối, Qua đêm, Theo ngày, Theo giờ) với tính toán giá và phụ thu/giảm giá tự động theo ngày trong tuần.
- **Thanh toán tự động 24/7**: Tích hợp cổng thanh toán VietQR (PayOS). Đơn hàng tự động xác nhận ngay sau khi khách chuyển khoản thành công.
- **Dịch vụ & Tiện ích đi kèm**: Đặt thêm nước uống, đồ ăn, trang trí phòng kèm đơn đặt.
- **Mã giảm giá & Chương trình tặng quà**: Tự động áp dụng voucher, quà tặng theo điều kiện đơn hàng.
- **Bảo mật & Tự động hóa**: Tự động gửi Email xác nhận kèm địa chỉ chi tiết, sơ đồ, mật khẩu cửa, mật khẩu Wifi sau khi thanh toán thành công.

### 🛡️ Cho Quản Trị Viên (Admin & Staff)
- **Phân quyền người dùng (RBAC)**: Quản lý tài khoản với các vai trò Super Admin, Lễ tân, Kế toán, Marketing.
- **Quản lý Chi nhánh & Phòng**: Quản lý danh sách chi nhánh, loại phòng, giá linh hoạt, tiện ích, mật khẩu truy cập phòng.
- **Quản lý Đặt phòng (Bookings)**: Theo dõi trạng thái đơn hàng (Chờ thanh toán, Đã thanh toán, Đã gửi Email, Checked-in, Completed, Cancelled).
- **Thống kê & Báo cáo**: Biểu đồ doanh thu, số lượng đơn hàng, công suất phòng trực quan.
- **Hệ thống An ninh & Phòng chống Spam**: Quản lý Blacklist (IP, Số điện thoại, Email), ghi nhận Audit Logs và Visitor Logs.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend / Backend**: Next.js 16 (App Router), React 19, TypeScript
- **UI & Styling**: Tailwind CSS v4, Motion (Framer Motion), Lucide React, SweetAlert2, Swiper
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js
- **Thanh toán (Payment Gateway)**: PayOS Integration (`@payos/node` - VietQR)
- **Gửi Email**: Nodemailer (SMTP Server)
- **Quản lý Process & Server**: PM2, Nginx, Cloudflare DNS & Security WAF

---

## 📁 Cấu Trúc Dự Án

```text
homestay-web/
├── prisma/
│   ├── schema.prisma         # Định nghĩa Data Model (User, Room, Booking, Payment...)
│   └── seed_demo.ts          # Seed dữ liệu mẫu ban đầu
├── public/                   # Tài nguyên tĩnh (Hình ảnh, Logo, Banner)
├── src/
│   ├── app/                  # Next.js App Router (Pages, API Routes, Layouts)
│   ├── components/           # Component UI (Client & Server components)
│   └── lib/                  # Utility, Prisma client, PayOS config, Mailer...
├── .env                      # File cấu hình biến môi trường
├── next.config.ts            # Cấu hình Next.js
├── package.json              # Khai báo dependency & npm scripts
└── README.md                 # Tài liệu hướng dẫn sử dụng & triển khai
```

---

## 💻 Hướng Dẫn Cài Đặt Tại Local (Development)

### Yêu Cầu Tiền Đề
- **Node.js**: `>= 20.x`
- **npm** hoặc **yarn/pnpm**
- **PostgreSQL Database** (hoặc Supabase / Neon / PostgreSQL chạy local)

### Các Bước Cài Đặt

1. **Clone repository và di chuyển vào thư mục dự án:**
   ```bash
   git clone <REPOSITORY_URL>
   cd homestay-web
   ```

2. **Cài đặt thư viện (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`):**
   Tạo file `.env` tại thư mục gốc với các thông số:
   ```env
   # Database Connection
   DATABASE_URL="postgresql://user:password@localhost:5432/homestay_db?schema=public"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key"

   # PayOS Payment Gateway
   PAYOS_CLIENT_ID="your-payos-client-id"
   PAYOS_API_KEY="your-payos-api-key"
   PAYOS_CHECKSUM_KEY="your-payos-checksum-key"

   # SMTP Mailer Config
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM="Homestay Booking <your-email@gmail.com>"
   ```

4. **Đồng bộ Database & Khởi tạo dữ liệu mẫu (Seed Data):**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Khởi chạy môi trường phát triển (Dev Server):**
   ```bash
   npm run dev
   ```
   Truy cập giao diện tại: `http://localhost:3000`

---

## 🌐 Hướng Dẫn Triển Khai Chi Tiết Lên VPS Mới Hoàn Toàn (Từ Con Số 0)

Sơ đồ kiến trúc triển khai:
```text
[ Người dùng ] 
      │
      ▼
[ Cloudflare ] (DNS + WAF + SSL Proxy + Anti-DDoS)
      │ (HTTPS / Encrypted)
      ▼
[ Nginx Reverse Proxy ] (VPS Port 80/443)
      │ (Proxy Pass 127.0.0.1:3000)
      ▼
[ PM2 Process Manager ] (Next.js Node Server Port 3000)
      │
      ▼
[ PostgreSQL Database ] (Localhost Port 5432)
```

---

### Bước 1: Chuẩn Bị & Cập Nhật VPS (Ubuntu 22.04 / 24.04 LTS)

Truy cập VPS của bạn qua SSH:
```bash
ssh root@IP_VPS_CỦA_BẠN
```

Cập nhật danh sách gói và nâng cấp hệ điều hành:
```bash
sudo apt update && sudo apt upgrade -y
```

Cài đặt các công cụ cơ bản cần thiết:
```bash
sudo apt install -y curl git build-essential ufw
```

---

### Bước 2: Cài Đặt Nginx & Node.js & PM2

1. **Cài đặt Nginx (Web Server / Reverse Proxy):**
   ```bash
   sudo apt install -y nginx
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

2. **Cài đặt Node.js LTS (v20):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   node -v # Kiểm tra phiên bản (phải là v20.x.x)
   ```

3. **Cài đặt PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

---

### Bước 3: Cài Đặt & Cấu Hình PostgreSQL

1. **Cài đặt PostgreSQL:**
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   sudo systemctl enable postgresql
   sudo systemctl start postgresql
   ```

2. **Tạo Database và User cho ứng dụng:**
   Đăng nhập vào tài khoản mặc định của Postgres:
   ```bash
   sudo -u postgres psql
   ```
   Chạy các lệnh SQL sau trong Terminal Postgres (thay `homestay_db`, `homestay_user`, `mat_khau_bao_mat` bằng tên và mật khẩu của bạn):
   ```sql
   CREATE DATABASE homestay_db;
   CREATE USER homestay_user WITH ENCRYPTED PASSWORD 'mat_khau_bao_mat';
   GRANT ALL PRIVILEGES ON DATABASE homestay_db TO homestay_user;
   ALTER DATABASE homestay_db OWNER TO homestay_user;
   \q
   ```
   *Lưu ý: Nhớ ghi lại chuỗi kết nối Database để dùng ở Bước 4:*
   `postgresql://homestay_user:mat_khau_bao_mat@localhost:5432/homestay_db?schema=public`

---

### Bước 4: Triển Khai Source Code & Build App

1. **Tạo thư mục và Clone mã nguồn:**
   ```bash
   sudo mkdir -p /var/www
   sudo chown -R $USER:$USER /var/www
   cd /var/www
   git clone <REPOSITORY_URL> homestay-web
   cd homestay-web
   ```

2. **Cài đặt các thư viện Node.js:**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường (.env):**
   ```bash
   cp .env.example .env
   nano .env
   ```
   Cấu hình các thông số quan trọng trong `.env`:
   ```env
   # Database URL vừa tạo ở Bước 3
   DATABASE_URL="postgresql://homestay_user:mat_khau_bao_mat@localhost:5432/homestay_db?schema=public"

   # Domain chính thức của website
   NEXTAUTH_URL="https://yourdomain.com"
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"

   # Secret sinh tự động (Có thể dùng: openssl rand -base64 32)
   NEXTAUTH_SECRET="chuoi_bi_mat_cua_ban"
   ```

4. **Khởi tạo Database Schema (Prisma):**
   ```bash
   npx prisma generate
   npx prisma db push
   # Tùy chọn: Chạy dữ liệu mẫu ban đầu
   # tsx prisma/seed_facilities.ts
   ```

5. **Build ứng dụng Next.js cho Production:**
   ```bash
   npm run build
   ```

---

### Bước 5: Chạy Ứng Dụng Bằng PM2

1. **Khởi chạy ứng dụng:**
   ```bash
   pm2 start npm --name "homestay-web" -- start
   ```

2. **Cài đặt cho PM2 tự động chạy khi khởi động lại VPS:**
   ```bash
   pm2 startup
   # Copy và chạy dòng lệnh cấu hình mà PM2 in ra màn hình.
   pm2 save
   ```

3. **Kiểm tra trạng thái:**
   ```bash
   pm2 status
   # Đảm bảo app "homestay-web" đang có trạng thái online màu xanh lá.
   ```

---

### Bước 6: Cấu Hình Nginx Reverse Proxy

1. **Tạo file cấu hình Virtual Host:**
   ```bash
   sudo nano /etc/nginx/sites-available/homestay
   ```

2. **Dán nội dung cấu hình sau (Nhớ thay `yourdomain.com` bằng tên miền thực tế):**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       # Giới hạn kích thước upload ảnh/tệp lên 20MB
       client_max_body_size 20M;

       # Bật nén Gzip để tải trang nhanh hơn
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

       # Nếu dùng Cloudflare, lấy IP thật của người dùng
       real_ip_header CF-Connecting-IP;
       # set_real_ip_from ... (Thêm dải IP của Cloudflare nếu cần thiết)

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Kích hoạt cấu hình & Khởi động lại Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/homestay /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Bước 7: Cấu Hình Domain & Bảo Mật Cloudflare

1. **Trỏ tên miền (DNS) - Bắt buộc:**
   - Đăng nhập Cloudflare -> **DNS**.
   - Thêm bản ghi `A`, Name `@`, IPv4 `IP_VPS_CỦA_BẠN`, bật đám mây màu cam 🟠 (Proxied).
   - Thêm bản ghi `CNAME`, Name `www`, Target `@`, bật đám mây màu cam 🟠.
   *(Việc bật đám mây cam giúp ẩn IP thực của VPS và tự động kích hoạt bảo vệ chống DDoS Layer 3/4 của Cloudflare).*

2. **Cấu hình SSL/TLS (Mã hóa HTTPS):**
   - Chọn mục **SSL/TLS -> Overview**.
   - Thiết lập thành **Flexible** (nếu Nginx đang dùng HTTP Port 80) hoặc **Full**. Cloudflare sẽ tự động cấp chứng chỉ HTTPS cho website của bạn.

3. **Tối ưu Bảo mật WAF & Chống DDoS (Layer 7):**
   - **Security Level**: Hiện tại Cloudflare đã tự động hóa mức độ bảo mật (mặc định là *'always protected'*). Bạn không cần (và không thể) chọn thủ công High/Medium như trước đây nữa.
   - Truy cập **Security -> Settings**:
     + Đảm bảo đã bật **Browser Integrity Check** (On) để chặn các truy cập từ script/bot xấu.
     + Tại phần **Configurations** (ngay bên dưới), bạn có thể bật **I'm under attack mode** nếu website đang bị tấn công ồ ạt gây chậm/sập.
   - Truy cập **Security -> Bots**: Bật **Bot Fight Mode**.
   - Truy cập **Security -> WAF -> Rate Limiting rules**: (Khuyến nghị) Tạo rule giới hạn truy cập cho các API nhạy cảm (như `/api/auth`, `/api/payment`) để chống brute-force và spam.

5. **Bảo mật máy chủ VPS (Chống Bypass Cloudflare):**
   - Để ngăn chặn hacker tìm ra IP thật của VPS và tấn công trực tiếp (bỏ qua Cloudflare), bạn nên dùng tường lửa `ufw` trên VPS để **chỉ cho phép traffic từ các dải IP của Cloudflare** truy cập vào cổng 80/443. (Bạn có thể tra cứu "Cloudflare IP ranges" để áp dụng cho `ufw`).

---

## 🔄 Quy Trình Cập Nhật Code (Maintenance)

Mỗi khi bạn đẩy (push) mã nguồn mới lên Github, hãy đăng nhập VPS và chạy lệnh sau để cập nhật website:

```bash
cd /var/www/homestay-web
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart homestay-web
```

---

## 📜 Giấy Phép & Bảo Trì

- **Bảo trì & Phát triển**: Đội ngũ kỹ thuật Homestay
- **Hỗ trợ kỹ thuật**: Vui lòng tạo Issue trên Repository hoặc liên hệ Quản trị viên hệ thống.
