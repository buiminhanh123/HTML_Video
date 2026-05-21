# ▶ HTML Video — AI-Powered Video Slide Generator

<p align="center">
  <strong>Tự động tạo video slide chuyên nghiệp từ file audio bằng AI</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Remotion-4.0-5B21B6?logo=remotion&logoColor=white" alt="Remotion 4" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini_AI-API-4285F4?logo=google&logoColor=white" alt="Gemini AI" />
</p>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Demo](#-demo)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [Kiến trúc](#-kiến-trúc)
- [Slide Types](#-slide-types)
- [Cấu hình](#-cấu-hình)
- [API & Export](#-api--export)
- [Công nghệ](#-công-nghệ)

---

## 🎯 Giới thiệu

**HTML Video** là một ứng dụng web cho phép tạo video slide (TikTok, YouTube Shorts, Instagram Reels) hoàn toàn tự động từ file audio. Ứng dụng sử dụng **Gemini AI** để transcribe audio thành text, sau đó tự động sinh ra các slide với animation chuyên nghiệp và export thành file MP4.

### Quy trình hoạt động

```
🎙 Audio File → 🤖 Gemini AI Transcribe → 📝 SRT Segments → 🎬 Auto-generate Slides → 🎥 Export MP4
```

---

## ✨ Tính năng

### 🤖 AI Auto Transcribe & Generate
- Upload file audio (WAV, MP3, M4A, OGG, WEBM, MP4, FLAC)
- Tự động transcribe bằng Gemini AI với timestamp chính xác (~50ms)
- Auto-fallback qua nhiều model: `Gemini 2.5 Flash` → `Gemini 2.5 Flash Lite` → `Gemini 3 Flash` → `Gemini 3.1 Flash Lite`
- Tự động phân chia nội dung thành các slide phù hợp

### 🎨 Visual Editor
- **Slide Panel**: Thêm, xóa, sắp xếp, duplicate slide bằng drag & drop
- **Preview Panel**: Xem trước video realtime với Remotion Player
- **Timeline**: Điều chỉnh timing của từng slide trên timeline trực quan
- **Property Editor**: Chỉnh sửa text, icon, duration cho từng slide

### 🎬 Video Export
- Render video MP4 chất lượng cao (1080x1920, 30fps)
- Server-side rendering với Remotion + FFmpeg
- Hiển thị progress bar realtime trong quá trình render
- Hỗ trợ audio sync khi export

### 📋 Import / Export Data
- **Paste JSON**: Paste trực tiếp JSON slides từ bất kỳ nguồn nào
- **Import JSON**: Load project từ file `.json`
- **Save JSON**: Export project dưới dạng JSON để chỉnh sửa sau
- **Import Audio**: Thêm nhạc nền / audio voiceover

### 🎨 Branding & Theming
- **15 màu accent** tùy chọn (Orange, Emerald, Purple, Blue, ...)
- **2 theme**: Dark mode & Light mode
- Custom username hiển thị trên slide
- Persistent settings (lưu vào localStorage)

---

## 🚀 Cài đặt

### Yêu cầu

- **Node.js** >= 18
- **npm** >= 9
- **Gemini API Key** (lấy tại [Google AI Studio](https://aistudio.google.com/apikey))

### Bước 1: Clone repository

```bash
git clone https://github.com/buiminhanh123/HTML_Video.git
cd HTML_Video/app
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Chạy ứng dụng

```bash
# Terminal 1: Chạy frontend dev server
npm run dev

# Terminal 2: Chạy render server (cần cho export MP4)
node server/render.mjs
```

- **Frontend**: http://localhost:5173
- **Render Server**: http://localhost:3001

### Bước 4: Cấu hình API Key

1. Mở ứng dụng trên trình duyệt
2. Click nút **⚙️ Settings** trên top bar
3. Nhập **Gemini API Key**
4. Chọn model ưa thích (mặc định: Gemini 2.5 Flash)

---

## 📖 Sử dụng

### Cách 1: Auto Transcribe (Khuyến nghị)

1. Click **🎙 Auto** trên top bar
2. Chọn file audio (WAV, MP3, MP4, ...)
3. Click **🚀 Transcribe & Generate**
4. Chờ AI xử lý → Slides tự động được tạo
5. Chỉnh sửa nội dung trong editor
6. Click **🎬 Export MP4** để render video

### Cách 2: Tạo thủ công

1. Sử dụng nút **+ Add Slide** để thêm slide mới
2. Chọn loại slide: Title, List, Grid, Tag, Outro
3. Chỉnh sửa nội dung, icon, timing
4. Import audio nếu cần
5. Export MP4

### Cách 3: Import JSON

1. Click **📄 JSON** để import từ file
2. Hoặc click **📋 Paste** để paste JSON trực tiếp
3. Chỉnh sửa và export

---

## 🏗 Kiến trúc

```
HTML_Video/
├── app/                          # Main application
│   ├── src/
│   │   ├── App.tsx               # Main app component + modals
│   │   ├── components/
│   │   │   ├── PreviewPanel.tsx   # Remotion Player preview
│   │   │   ├── PropertyPanel.tsx  # Slide property editor
│   │   │   ├── SlidePanelV2.tsx   # Slide list + drag & drop
│   │   │   ├── Timeline.tsx       # Timeline editor
│   │   │   ├── SettingsModal.tsx  # API key settings
│   │   │   └── TranscribeModal.tsx # AI transcription UI
│   │   ├── lib/
│   │   │   ├── store.ts          # Zustand state management
│   │   │   ├── types.ts          # TypeScript interfaces
│   │   │   ├── constants.ts      # Colors, dimensions, presets
│   │   │   ├── gemini.ts         # Gemini API client
│   │   │   └── icons.tsx         # Smart icon picker
│   │   ├── remotion/
│   │   │   ├── Video.tsx         # Main Remotion composition
│   │   │   ├── Root.tsx          # Remotion root
│   │   │   ├── components/       # Shared visual components
│   │   │   │   ├── Background.tsx
│   │   │   │   ├── BulletCard.tsx
│   │   │   │   ├── GridCard.tsx
│   │   │   │   └── SlideHeader.tsx
│   │   │   └── scenes/           # Individual slide scenes
│   │   │       ├── TitleScene.tsx
│   │   │       ├── ListScene.tsx
│   │   │       ├── GridScene.tsx
│   │   │       ├── TagScene.tsx
│   │   │       └── OutroScene.tsx
│   │   └── styles/
│   │       └── index.css         # Global styles
│   ├── server/
│   │   └── render.mjs            # Express render server
│   ├── scripts/
│   │   ├── transcribe.mjs        # CLI transcription script
│   │   └── transcribe-gemini.mjs # Gemini CLI transcription
│   └── output/                   # Rendered video output
├── .gitignore
└── README.md
```

---

## 🎭 Slide Types

| Type | Mô tả | Thành phần |
|------|--------|------------|
| **Title** | Slide mở đầu | Icon, tiêu đề (accent highlight), danh sách bullet |
| **List** | Slide danh sách | Icon, tiêu đề, 3-5 bullet items với icon riêng |
| **Grid** | Slide lưới 2x2 | Icon, tiêu đề, 4 card items dạng grid |
| **Tag** | Slide hashtag | Icon, tiêu đề, subtitle, danh sách tag màu sắc |
| **Outro** | Slide kết thúc | Platform icon (TikTok/YouTube/Instagram), username |

### JSON Slide Format

```json
{
  "id": "slide_1",
  "type": "list",
  "durationInFrames": 300,
  "icon": "🔥",
  "title": "Tốc Độ",
  "titleAccent": "Phản Hồi",
  "bullets": [
    {
      "icon": "⚡",
      "text": "Trả lời nhanh hơn ",
      "boldText": "gấp 2 lần so với phiên bản trước"
    }
  ]
}
```

---

## ⚙ Cấu hình

### Video Settings

| Thuộc tính | Giá trị mặc định | Mô tả |
|-----------|-------------------|--------|
| `width` | 1080 | Chiều rộng video (px) |
| `height` | 1920 | Chiều cao video (px) |
| `fps` | 30 | Frames per second |
| `DEFAULT_SLIDE_DURATION` | 300 frames (10s) | Thời lượng mặc định mỗi slide |
| `TITLE_SLIDE_DURATION` | 270 frames (9s) | Thời lượng slide Title |
| `OUTRO_SLIDE_DURATION` | 150 frames (5s) | Thời lượng slide Outro |

### Branding

| Thuộc tính | Mặc định | Mô tả |
|-----------|----------|--------|
| `username` | `escbasexyz` | Username hiển thị |
| `accentColor` | `#f26522` (Orange) | Màu chủ đạo |
| `theme` | `dark` | Giao diện (dark/light) |

---

## 📡 API & Export

### Render Server Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/render` | Render video từ project JSON → trả về MP4 |
| `GET` | `/api/progress` | Kiểm tra tiến trình render (0-1) |
| `GET` | `/api/health` | Health check server |

### Render Request Example

```bash
curl -X POST http://localhost:3001/api/render \
  -H "Content-Type: application/json" \
  -d @project.json \
  --output video.mp4
```

---

## 🛠 Công nghệ

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **React** | 19 | UI framework |
| **TypeScript** | 6 | Type safety |
| **Vite** | 8 | Build tool & dev server |
| **Remotion** | 4.0 | Programmatic video rendering |
| **Zustand** | 5 | State management |
| **Gemini AI** | API v1beta | Audio transcription |
| **Express** | 5 | Render server backend |
| **FFmpeg** | static | Video encoding |
| **Lucide React** | 1.11 | Icon library |

---

## 📄 License

MIT License — sử dụng tự do cho mục đích cá nhân và thương mại.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/buiminhanh123">buiminhanh123</a>
</p>
