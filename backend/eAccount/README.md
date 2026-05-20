# eAccount - Quản lý Tài khoản và Phân quyền

## 1. Tổng quan Dự án
Microservice **eAccount** là thành phần cốt lõi trong việc phụ trách security: chịu trách nhiệm quản lý danh tính người dùng (Identity), hồ sơ nhân viên (Profile), Quyền hạn (Permissions) và cung cấp các dịch vụ xác thực nội bộ cho các Services khác (eForm, eFlow, eRequest).

---

## 2. Công nghệ và Hạ tầng 
Dự án được xây dựng trên nền tảng hiện đại, kế thừa từ JHipster:

- **Ngôn ngữ & Framework chính**:
  - **Java 21**: Tối ưu hóa hiệu năng và tính năng ngôn ngữ mới nhất.
  - **Spring Boot 3.3.5**: Framework nền tảng cho Microservices.
  - **JHipster 8.7.2**: Khung nền tảng quản trị tiên tiến.
- **Cơ sở dữ liệu & Lưu trữ**:
  - **MySQL**: Hệ quản trị CSDL quan hệ chính (xampp).
  - **Liquibase**: Quản lý phiên bản và cấu trúc database.
- **Bảo mật & API**:
  - **Spring Security (JWT)**: Bảo mật phân tán qua JSON Web Token.
- **Hạ tầng & Build**:
  - **Maven**: Công cụ quản lý build project.
  - **S3**: Quản lý ảnh avatar.                                          
  - **Docker**: Đóng gói ứng dụng dưới dạng Container.

---

## 3. Thiết kế Cơ sở dữ liệu 

### 3.1. Thực thể `User` 
- Quản lý các thông tin cốt lõi: `email`, `password_hash`, `activated`.

### 3.2. Thực thể `UserProfile` 
- **Mối quan hệ**: One-to-One với `User`.
- **Thông tin chi tiết**: `phone`, `dob`, `gender`, `position`, `job`, `department`, `avatar`.

### 3.3. Thực thể `UserToken`
- Quản lý trạng thái đăng nhập và thu hồi quyền truy cập (`token_str`, `expiry_date`, `is_revoked`).

### 3.4. Thực thể "Permission"
Quyền được thiết kế theo mô hình **Âm (-1) / Dương (1-5)**:
- **-1**: Quyền quản lý cá nhân.
- **1**: Quản lý nhân sự.
- **2**: Quyền hồ sơ.
- **3**: Quyền luồng.
- **4**: Quản lý tài khoản.
- **5**: Quản lý truy cập.

---

## 4. Kiến trúc Tầng Service

1. **PermissionManagementService**: Quản lý logic đồng bộ quyền.
2. **AccountManagementService**: Xử lý tạo nhân viên mới, sinh mật khẩu và xóa tài khoản có kiểm tra thẩm quyền.
3. **AuthInterService & TokenManagementService**: Cung cấp dịch vụ xác thực nội bộ và quản lý vòng đời Token.
4. **UserProfileService**: Quản lý hồ sơ cá nhân và tích hợp lưu trữ.

---

## 5. Các nhóm API

### 5.1. Nhóm Tài khoản
- `POST /api/account/profile`: Tạo mới/Cập nhật nhân sự.
- `POST /api/management/account/search`: Tìm kiếm user.
- `POST /api/management/account/delete`: Xóa tài khoản.

### 5.2. Nhóm Quyền
- `GET /api/permissions/system-roles`: Danh sách quyền hệ thống.
- `POST /api/permissions/sync`: Đồng bộ hóa danh sách quyền.
- `POST /api/permissions/search-user-roles`: Xem quyền của user.

### 5.3. Nhóm Tương tác
- `POST /api/internal/auth/generate-token`: Tạo token nội bộ.
- `POST /api/internal/auth/validate-token`: Validate token.
- `POST /api/internal/permissions/check-access`: Kiểm tra quyền truy cập.
...............................

---

