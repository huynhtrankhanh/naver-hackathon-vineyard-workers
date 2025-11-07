# 🚀 [Tên Dự án] - Hackathon Naver Cloud

**Tên nhóm:** `naver-hackathon-vineyard-workers`

## 🎯 Vấn đề & Giải pháp

- **Vấn đề:** Quản lý chi tiêu thủ công rất nhàm chán, tốn thời gian, dễ quên và dễ nhập sai số liệu.
- **Giải pháp:** Xây dựng một ứng dụng "AI-first", nơi người dùng có thể nhập chi tiêu bằng cách:
  1.  **Quét hóa đơn** (dùng Naver OCR).
  2.  **Nói bằng giọng nói** (dùng Naver Speech-to-Text).
  3.  Nhờ **AI lập kế hoạch** tiết kiệm (dùng Naver Clovax LLM).

## 🛠️ Công nghệ (Tech Stack)

- **Frontend:** Next.js (App Router), React, MUI
- **Backend:** Next.js (Pages Router API Routes)
- **Database:** MongoDB (thông qua Mongoose)
- **Xác thực:** NextAuth.js (v4)
- **AI:** Naver Cloud (Clovax, OCR, STT)

## 🏃 Hướng dẫn Cài đặt (Getting Started)

Đây là hướng dẫn để chạy dự án trên máy local.

1.  **Clone dự án:**

    ```bash
    git clone [https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers.git]
    cd naver-hackathon-vineyard-workers
    ```

2.  **Cài đặt thư viện:**

    ```bash
    npm install
    ```

3.  **Tạo file Môi trường (`.env.local`):**
    - Tạo một file mới ở thư mục gốc tên là `.env.local`.
    - Copy nội dung dưới đây vào:

    ```.env.local
    # Database
    MONGODB_URI=mongodb+srv://...

    # NextAuth (Bắt buộc)
    NEXTAUTH_SECRET=DAY_LA_MOT_CHUOI_BI_MAT_NGAY_NHIEN_BAT_KY
    NEXTAUTH_URL=http://localhost:3000

    # Naver AI Keys (Sẽ thêm sau)
    # NAVER_CLIENT_ID=
    # NAVER_CLIENT_SECRET=
    ```

4.  **Chạy dự án:**
    ```bash
    npm run dev
    ```
    Mở `http://localhost:3000` trên trình duyệt của bạn.

---

## 📚 Tài liệu API (Cho Frontend)

Đây là các API backend đã sẵn sàng

**URL Cơ sở:** `http://localhost:3000`

### 1. Xác thực (Authentication)

Chúng ta dùng **NextAuth.js**, vì vậy các bạn **KHÔNG** gọi `fetch` đến API đăng nhập. Hãy dùng các hàm client của nó.

#### Cài đặt (Bắt buộc)

Toàn bộ ứng dụng đã được bọc trong `<Providers>` (`app/layout.tsx`), vì vậy các bạn có thể dùng `useSession()` ở bất cứ đâu.

#### Đăng ký (Register)

Đây là API duy nhất các bạn gọi `fetch` trong phần auth.

- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword123"
  }
  ```
- **Phản hồi (Success 201):** `{ "message": "Tạo tài khoản thành công" }`
- **Phản hồi (Lỗi 409):** `{ "message": "Email đã tồn tại" }`

#### Đăng nhập (Login)

- **Hàm (Function):** `import { signIn } from 'next-auth/react'`
- **Cách gọi:**

  ```javascript
  const result = await signIn('credentials', {
    redirect: false, // Quan trọng: không chuyển trang
    email: emailFromState,
    password: passwordFromState,
  })

  if (result.ok) {
    // Đăng nhập thành công
    // router.push('/dashboard')
  } else {
    // Đăng nhập thất bại
    // alert(result.error)
  }
  ```

#### Đăng xuất (Logout)

- **Hàm (Function):** `import { signOut } from 'next-auth/react'`
- **Cách gọi:** `await signOut({ redirect: true, callbackUrl: '/login' })`

#### Lấy thông tin User (Session)

- **Hook:** `import { useSession } from 'next-auth/react'`
- **Cách dùng:**

  ```javascript
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <p>Loading...</p>
  }

  if (status === 'authenticated') {
    // session.user.email
    return <p>Signed in as {session.user.email}</p>
  }
  ```

### 2. Chi tiêu (Transactions)

Tất cả các API này đều **được bảo vệ**. Các bạn phải gửi "cookie" (NextAuth tự động làm khi bạn gọi `fetch`). Nếu không đăng nhập, các bạn sẽ nhận được lỗi `401 Unauthorized`.

#### Lấy (GET) toàn bộ chi tiêu

- **Method:** `GET`
- **Endpoint:** `/api/transactions`
- **Body:** Không có
- **Phản hồi (Success 200):**
  ```json
  [
    {
      "_id": "654b...",
      "amount": 75000,
      "category": "Ăn uống",
      "date": "2025-11-07T06:30:00.000Z",
      "type": "expense",
      "note": "Cà phê với bạn",
      "user": "654a...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
  ```

#### Tạo (POST) chi tiêu mới

- **Method:** `POST`
- **Endpoint:** `/api/transactions`
- **Body (JSON):**
  ```json
  {
    "amount": 75000,
    "category": "Ăn uống",
    "date": "2025-11-08T10:00:00.000Z",
    "type": "expense",
    "note": "Cà phê"
  }
  ```
- **Phản hồi (Success 201):** Object chi tiêu vừa được tạo (giống cấu trúc của `GET`).

#### Cập nhật (PUT) một chi tiêu

- **Method:** `PUT`
- **Endpoint:** `/api/transactions/[id]`
  - (Thay `[id]` bằng `_id` của chi tiêu, ví dụ: `/api/transactions/654b...`)
- **Body (JSON):** Gửi các trường bạn muốn cập nhật.
  ```json
  {
    "amount": 80000,
    "note": "Cà phê + Bánh"
  }
  ```
- **Phản hồi (Success 200):** Object chi tiêu _sau khi_ đã cập nhật.

#### Xóa (DELETE) một chi tiêu

- **Method:** `DELETE`
- **Endpoint:** `/api/transactions/[id]`
  - (Ví dụ: `/api/transactions/654b...`)
- **Body:** Không có
- **Phản hồi (Success 200):** `{ "message": "Xóa thành công" }`

### 3. API AI (Chưa làm - TODO)

- `POST /api/ai/ocr-extract`: Nhận file ảnh, trả về JSON.
- `POST /api/ai/speech-to-text`: Nhận file âm thanh, trả về text.
- `POST /api/ai/generate-plan`: Nhận prompt, trả về kế hoạch.
