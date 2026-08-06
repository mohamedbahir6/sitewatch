# SiteWatch — PPE Compliance Analysis

Upload floor-camera video → your trained YOLO model flags Hardhat / Mask / Safety
Vest violations → professional dashboard with charts + an AI assistant you can
ask questions about the footage.

Built for your dataset classes:
`Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person, Safety Cone, Safety Vest, machinery, vehicle`

```
ppe-detection-app/
├── backend/          FastAPI + Ultralytics YOLO inference
│   ├── app.py
│   ├── detect.py
│   ├── requirements.txt
│   ├── .env.example
│   └── models/best.pt   ← put your trained weights here
└── frontend/          React + Vite + Tailwind dashboard
```

## 1. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

mkdir models
# copy your trained best.pt into backend/models/best.pt

copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux
```

Edit `backend/.env`:
- `PPE_MODEL_WEIGHTS` — path to `best.pt` (defaults to `./models/best.pt`)
- `ANTHROPIC_API_KEY` — only needed if you want the AI chat assistant on the
  dashboard to work. Get one at https://console.anthropic.com — without it,
  everything else (upload, detection, dashboard, charts) still works fine.

Run it:
```bash
python app.py
```
Backend runs at `http://localhost:8000`. Check `http://localhost:8000/api/health`
— it tells you if your weights file was found.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. It proxies `/api` calls to the backend automatically
(see `vite.config.js`), so both servers must be running.

## 3. Using it

1. Drop a video on the upload screen.
2. It uploads, then detection runs frame-by-frame (progress bar shown).
3. Dashboard shows:
   - Annotated video with live bounding boxes
   - Overall compliance %, total violations, peak headcount, frames analyzed
   - Compliant vs. violation bars per PPE category
   - Violations-over-time chart (spot exactly when compliance broke down)
   - Raw per-class detection counts
   - Floating "Safety Assistant" — ask things like *"when did the first
     violation happen?"* or *"is this site compliant overall?"* — it answers
     grounded strictly in that video's analysis report.

## Performance notes

- `PPE_FRAME_SKIP` in `.env` controls how many frames are actually run through
  the model (2 = every other frame). Raise it for faster processing on long
  videos, lower it (1) for maximum smoothness/accuracy.
- No GPU required, but detection is much faster with CUDA available — Ultralytics
  will use it automatically if `torch` detects a compatible GPU.
- Violation logic uses your dataset's own `NO-Hardhat` / `NO-Mask` /
  `NO-Safety Vest` classes directly — no extra box-overlap heuristics needed.

## Extending

- **Multiple videos / history:** results are already saved per `video_id` under
  `backend/storage/results/` — add a `/api/videos` list endpoint + a sidebar to
  browse past reports.
- **Real vector RAG across many videos:** the current assistant grounds itself
  in a single video's JSON report (passed straight into the prompt — simplest
  correct approach for one document). If you later want cross-video search,
  embed each report and swap the flat JSON context in `app.py`'s `/api/chat`
  for a vector similarity lookup.
- **Mobile app:** the dashboard is fully responsive and works in any mobile
  browser as-is. For a native app, the same `backend/app.py` API can be
  reused — no changes needed there.
