# FoodieGen - AI Marketing Video Generator for Foodies

**FoodieGen** là ứng dụng desktop giúp tự động hóa quy trình tạo video marketing chuyên nghiệp cho ngành ẩm thực. Kết hợp nhiều mô hình AI video thế hệ mới, FoodieGen cho phép biến ảnh sản phẩm và ý tưởng thô thành video cinematic chất lượng cao chỉ trong vài phút.

> **[Tải xuống ứng dụng tại đây.](https://github.com/BlankBire/FoodieGen/releases/download/v0.1.0/FoodieGenSetup.exe)**

---

## Tính năng nổi bật

### Video AI đa mô hình
Chọn một trong bốn quy trình tạo video tùy nhu cầu:

| Quy trình | Video AI | Kịch bản |
|---|---|---|
| Runway + AI tạo kịch bản | Gen-4 Turbo (I2V) · Gen-4.5 (T2V/I2V) | Google Gemini tự sinh |
| Runway + Kịch bản thủ công | Gen-4 Turbo (I2V) · Gen-4.5 (T2V/I2V) | Nhập tay / có sẵn |
| Google Veo 3 Fast | Veo 3 Fast Generate | Google Gemini tự sinh |
| Kling AI | Kling AI V3 | Google Gemini tự sinh |

### Image-to-Video với ảnh sản phẩm mẫu
Upload ảnh sản phẩm → Gen-4 Turbo giữ nguyên hình dạng, pattern embossed, màu sắc, và thương hiệu từ ảnh gốc vào video. Hỗ trợ mọi tỉ lệ ảnh đầu vào (tự động mirror-fill để fill đúng khung 9:16 hoặc 16:9 mà không crop sản phẩm). Gen4.5 mạnh về độ sáng tạo nhân vật chính và phác thảo bối cảnh.

### Nhân vật đa dạng
8 loại nhân vật dựng sẵn + tùy chỉnh tự do:
- Nam đầu bếp tận tâm
- Nữ nhân viên tư vấn sành điệu
- Food Reviewer năng động
- Bạn trẻ sành ăn (Vlogger)
- Chủ quán hiếu khách
- Mẹ đảm đang nội trợ
- Nhân vật 3D hoạt hình (Pixar/Disney style)
- Tùy chỉnh nhân vật...

### Tùy biến nội dung toàn diện
- **9 phong cách hình ảnh**: Cinematic, Golden Hour, Close-Up, Dreamy, Vibrant, Minimal, Rustic, Luxury, Vintage
- **9 tone nội dung**: Kích thích, Sang trọng, Cảm xúc, Bán hàng, Viral, Review, Giáo dục, Kể chuyện, Hài hước
- **8 cảm xúc chủ đạo**: Vui tươi, Sang trọng, Ấm cúng, Phấn khích, Bình yên, Mãnh liệt, Bí ẩn, Tươi mới
- **Bối cảnh địa điểm**: Tại cửa hàng, Trung tâm thương mại, Nhà bếp hiện đại, Quầy thực phẩm, Ngoài trời

### Giọng đọc tiếng Việt tự nhiên (FPT.AI)
6 giọng đọc Nam/Nữ đại diện 3 miền Bắc - Trung - Nam, điều chỉnh được tốc độ đọc.

### Kiến trúc Standalone
- Chạy hoàn toàn offline sau khi cài đặt (trừ các API call)
- Database SQLite cục bộ, dữ liệu dự án không rời khỏi máy
- Hỗ trợ quản lý draft, xem lại lịch sử video

---

## Công nghệ sử dụng

- **Frontend**: Next.js 15, React, Vanilla CSS
- **Backend (Sidecar)**: Next.js Standalone Server
- **Desktop Shell**: Electron
- **Database**: SQLite & Prisma ORM
- **Image Processing**: Sharp (mirror-fill, format normalization)
- **Video Processing**: FFmpeg (multi-clip stitching, audio merge)
- **AI kịch bản**: Google Gemini (`gemini-3.1-flash-lite-preview`)
- **AI video**: RunwayML Gen-4 Turbo, RunwayML Gen-4.5, Kling AI V3, Google Veo 3 Fast
- **AI giọng đọc**: FPT.AI TTS v5

---

## Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js v18 trở lên
- Windows 10/11

### Triển khai môi trường lập trình

1. **Clone dự án**:
   ```bash
   git clone https://github.com/BlankBire/FoodieGen.git
   cd FoodieGen
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   ```bash
   cp src/api/.env.example src/api/.env
   ```
   Mở `src/api/.env` và điền các API Key cần thiết. Các API Key còn lại (Runway, Kling, FPT.AI) được nhập trực tiếp trong giao diện **Cài đặt** của ứng dụng.

4. **Chạy ở chế độ Development**:
   ```bash
   npm run electron:dev
   ```

---

## Đóng gói ứng dụng

```bash
npm run electron:build
```

File cài đặt xuất ra tại `dist/FoodieGen Setup x.x.x.exe`. Bản build đã tích hợp sẵn FFmpeg, Prisma engine, và quy trình tự khởi tạo database khi cài lần đầu.

---

## Cấu trúc dự án

```
├── electron/           # Electron Main & Preload process
├── src/
│   ├── api/            # Backend Next.js Standalone (API routes, Prisma, FFmpeg)
│   │   ├── app/api/    # Endpoints: generate/content, generate/video, media
│   │   ├── lib/        # Constants (characters, voices, styles)
│   │   └── prisma/     # SQLite schema & seed
│   └── web/            # Frontend Next.js (UI, components)
├── scripts/            # Build optimization & binary scripts
├── bin/                # FFmpeg binary (Windows)
└── package.json        # Monorepo config & build scripts
```

---

## Đóng góp

Mọi ý kiến đóng góp hoặc báo lỗi vui lòng mở Issue hoặc gửi Pull Request.

---

## Giấy phép

Dự án này thuộc sở hữu của **BlankBire**. Vui lòng liên hệ tác giả trước khi sử dụng cho mục đích thương mại.
