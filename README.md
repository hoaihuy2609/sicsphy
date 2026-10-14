# ⚡ ScisPhy — Ngân Hàng Câu Hỏi & Đề Thi Vật Lý Thông Minh

Hệ thống quản lý câu hỏi, ma trận đề và xuất bản đề thi môn Vật lý chuẩn chương trình GDPT 2018 (Lớp 10, 11, 12) theo định dạng mới nhất của Bộ Giáo dục & Đào tạo 2025.

---

## 🚀 Tính Năng Cốt Lõi

1. **Ngân hàng câu hỏi Vật lý đa tầng**:
   - Phân cấp theo Khối 10, 11, 12 $\rightarrow$ Chương $\rightarrow$ Bài học $\rightarrow$ Dạng bài.
   - Phân loại 4 mức độ nhận thức: Nhận biết (Mức 1), Thông hiểu (Mức 2), Vận dụng (Mức 3), Vận dụng cao (Mức 4).
   - Chuẩn hóa 4 dạng thức câu hỏi mới của Bộ GD&ĐT 2025:
     - Trắc nghiệm nhiều lựa chọn (4 phương án A, B, C, D).
     - Trắc nghiệm Đúng/Sai (1 câu gồm 4 ý độc lập a, b, c, d).
     - Trắc nghiệm trả lời ngắn (Điền số kết quả).
     - Tự luận.

2. **Hỗ trợ công thức & Sơ đồ mạch điện**:
   - **KaTeX**: Render công thức Vật lý tốc độ cao ($F=ma$, $u=U_0\cos(\omega t)$).
   - **TikZ / Circuitikz**: Hỗ trợ mã nguồn TikZ render trực tiếp sang SVG vector sắc nét (sơ đồ mạch điện xoay chiều, đồ thị dao động, tia sáng quang học).

3. **Quản lý ma trận & Sinh đề thi**:
   - Ma trận 22 câu chuẩn cấu trúc đề thi tốt nghiệp THPT 2025.
   - Thuật toán kiểm tra chuẩn 70% (Nhận biết - Thông hiểu) / 30% (Vận dụng - Vận dụng cao) với sai số $\pm 5\%$.
   - Đo lường độ khó đề thi theo thời gian thực.

4. **Tích hợp kho lưu trữ phân tán**:
   - Tương thích lưu trữ qua Telegram Bot API + Cloudflare Worker CDN.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend & Backend**: Next.js 14 (App Router), TypeScript, TailwindCSS.
- **Cơ sở dữ liệu**: Prisma ORM (SQLite / PostgreSQL).
- **Công thức & Vector**: KaTeX, TikZJax WebAssembly.

---

## 💻 Cài Đặt & Chạy Cục Bộ

1. Cài đặt thư viện:
   ```bash
   npm install
   ```

2. Đồng bộ Database & Nạp dữ liệu mẫu:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

3. Khởi chạy máy chủ:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints

- `GET /api/taxonomy`: Lấy cây mục lục và thống kê số lượng câu hỏi.
- `GET /api/questions`: Lọc câu hỏi theo khối, chương, mức độ, dạng thức và từ khóa.
- `POST /api/questions`: Thêm mới câu hỏi vào ngân hàng.
