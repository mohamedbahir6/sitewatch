# 🛡️ SiteWatch — PPE Compliance & Video Analysis

**Every missing hardhat, caught on frame one.**

SiteWatch is a local-first video analysis platform that automatically detects Personal Protective Equipment (PPE) compliance on industrial and construction site footage using a custom-trained YOLO model, and supports general-purpose video analysis powered by Google Gemini.

---

## ✨ Features

- **PPE Detection** — Upload site footage and get frame-by-frame detection of hardhats, vests, gloves, and other safety gear using a custom-trained YOLOv8 model.
- **General Video Analysis** — Analyze any video (not just PPE) using the Gemini File API for open-ended, natural-language insights.
- **Compliance Trends** — Track PPE compliance rates across multiple uploads over time with interactive charts.
- **AI Chat Assistant** — Ask natural-language questions about an analyzed video using a Retrieval-Augmented Generation (RAG) chatbot.
- **PDF Reports** — Export a professional compliance report for any analyzed video.
- **Local-first** — Detection runs on your own machine with your own model weights; your video data never leaves your system.

---

## 🧱 Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide Icons
**Backend:** FastAPI, SQLite, Ultralytics YOLO, OpenCV, ReportLab, ChromaDB
**AI:** Google Gemini (`google-generativeai`, `google-genai`) for general analysis and the RAG chatbot

---

## 📁 Project Structure
---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key (for General Analysis & the AI chatbot)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (for email verification)

### 1. Clone the repo
```bash
git clone https://github.com/mohamedbahir6/sitewatch.git
cd sitewatch
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your own values:
```bash
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Then run the backend:
```bash
python app.py
```
Backend runs at `http://localhost:8000`

### 3. Frontend setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## 🖥️ How to Use

1. **Sign up / Log in** — Create an account from the landing page (email verification via Gmail SMTP).
2. **Upload a video** — On the Upload page, drag and drop a video (`MP4`, `MOV`, `AVI`) of site footage.
3. **View the dashboard** — Once analysis finishes, see detected violations, compliance %, and an annotated video with bounding boxes.
4. **Ask the AI assistant** — Use the chatbot on the dashboard to ask questions about the specific video's results.
5. **Check Trends** — See compliance rates across all your past uploads over time.
6. **Try General Analysis** — Upload any video for open-ended, Gemini-powered insights beyond PPE detection.
7. **Export a report** — Download a PDF summary of any analyzed video.

---

## 🔒 Notes

- Detection runs locally using your own YOLO weights — no video data is sent anywhere except the specific frames/videos you choose to send to Gemini for General Analysis or the chat assistant.
- Never commit your `.env` file — it contains your API keys and email credentials.

---

## 📌 Status

Built as a personal project to explore computer-vision-based safety compliance monitoring, combining a custom-trained detection model with LLM-powered analysis and RAG.