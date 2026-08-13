# cre8motion 🎬

**An AI Showrunner that autonomously produces short animated drama episodes — from a one-line premise to a finished, assembled video — built on Qwen Cloud.**

**Live demo:** https://cre8motion.vercel.app  
**API:** https://cre8motion.onrender.com/health  

Built for the Global AI Hackathon with Qwen Cloud — **Track 2: AI Showrunner**.

---

## System Architecture

![Cre8Motion System Architecture](docs/architecture.png)

A continuity-aware AI showrunner orchestrated by a **17-stage production state machine** on Qwen Cloud.

### Architecture Flowchart (Mermaid)

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend — React/Vite on Vercel"]
        UI[App UI + Landing]
    end

    subgraph API["⚙️ Backend — FastAPI on Render (Docker)"]
        REST[REST API]
        ORCH[Production Orchestrator<br/>17-stage state machine]
        QC[QC & Retry Loop]
        ASM[Assembly - ffmpeg]
        DB[(SQLite + Alembic)]
        MEDIA[/media artifacts/]
    end

    subgraph QWEN["🧠 Qwen Cloud (DashScope API)"]
        QMAX["qwen-max<br/>script, plan, shot list,<br/>failure diagnosis"]
        QVL["qwen3-vl-plus<br/>storyboard / keyframe /<br/>video-frame QC"]
        QIMG["qwen-image-plus<br/>poster key art"]
        WAN["wan2.2 / wan2.5<br/>keyframes & storyboards"]
        HH["happyhorse-1.1 t2v / i2v<br/>shot video generation"]
    end

    UI -- "/api/* (Vercel rewrite proxy)" --> REST
    REST --> ORCH
    ORCH --> QMAX
    ORCH --> QIMG
    ORCH --> WAN
    ORCH --> HH
    QC --> QVL
    QVL -- "defect report" --> QMAX
    ORCH <--> DB
    ORCH --> QC
    QC --> ASM
    ASM --> MEDIA
    HH -- "fetches keyframes via PUBLIC_API_BASE_URL" --> MEDIA
```

### 17-Stage Production Pipeline

```text
01 INPUT ──> 02 PLAN ──> 03 VALIDATE ──> 04 REF RES ──> 05 SHOT PLAN
                                                             │
10 VIDEO GEN <── 09 KEYFRAME QC <── 08 KEYFRAME GEN <── 07 STORYBOARD QC <── 06 STORYBOARD GEN
    │
11 VIDEO QC ──> 12 AUDIO GEN ──> 13 ASSEMBLY (FFMPEG) ──> 14 FINAL QC ──> 15 REVIEW ──> 16 SETUP PAYOUT ──> 17 PAYOUT DONE
```

### The Agentic Loop (what makes it a Showrunner, not a generator)

The orchestrator (`backend/app/services/orchestrator.py`) drives a validated state machine:

`NORMALIZING_INPUT → PLANNING → PLAN_VALIDATION → REFERENCE_RESOLUTION → SHOT_PLANNING → STORYBOARD_GENERATION → STORYBOARD_QC → KEYFRAME_GENERATION → KEYFRAME_QC → VIDEO_GENERATION → VIDEO_QC → AUDIO_GENERATION → ASSEMBLY → FINAL_QC → READY_FOR_REVIEW`

* **Adversarial QC Gates (Stages 07, 09, 11, 14):** Visual quality control at every milestone. After each generation stage, **qwen3-vl-plus** inspects the output against the shot spec (composition, character consistency, continuity locks). Failures are sent to **qwen-max** for diagnosis, which rewrites the prompt for a targeted retry — an autonomous generate → critique → repair loop at every stage of production.
* **Silent-Story Rules Enforced:** Objective in 8s · Flaw-driven complications · Object → Eyeline → Reaction → Action · Setup before payoff · Must work muted.

---

## What it does

You give cre8motion a show premise and characters. Its autonomous production pipeline then handles the entire creation process the way a real studio would — writing, planning, storyboarding, shooting, quality control, and editing — with no human in the loop (though you can pause and review at every stage):

1. **Script & episode planning** — story beats, pacing, and a full shot list
2. **Storyboards** — one frame per shot to lock composition
3. **Keyframes** — high-quality character-consistent stills
4. **Video generation** — each shot animated from its keyframe
5. **Automated QC** — a vision model reviews every artifact and triggers targeted retries with diagnosed fixes
6. **Audio & assembly** — sound cues and final episode stitching (`ffmpeg`)

---

## Qwen Cloud usage (proof for judges)

Every decision in the pipeline is a Qwen Cloud model call via the DashScope API (`dashscope-intl.aliyuncs.com`). All integration lives in **[`backend/app/providers/qwen.py`](backend/app/providers/qwen.py)**.

| Model | Purpose & Role |
|---|---|
| **`qwen-max`** | Scripts, Bibles, Shot lists, Ideation, Failure diagnosis, Prompt repair |
| **`qwen3-vl-plus`** | Visual QC (Storyboards, Keyframes, Video frames), Continuity locks |
| **`qwen-image-plus`** | Poster key art at show creation |
| **`wan2.2` / `wan2.5` / `wan2.7`** | Character sheets, Storyboards, Keyframes (9:16) |
| **`HappyHorse 1.1` (t2v / i2v)** | Shot video generation (animates each approved keyframe via signed artifact URLs) |

| Provider class | Model | Role |
|---|---|---|
| `QwenReasoningProvider` | `qwen-max` | Scripts, episode plans, shot lists, show proposals, failure diagnosis |
| `QwenVisionProvider` | `qwen3-vl-plus` | Automated QC of storyboards, keyframes, and video frames |
| `QwenImageProvider` | `qwen-image-2.0`, `wan2.7-image-pro` | Storyboards and keyframes |
| `QwenVideoProvider` | `happyhorse-1.1-t2v / -i2v` | Text-to-video and image-to-video shot generation |
| `QwenAudioProvider` | — | Audio cue generation |

---

## Repository structure

| Folder | What it is |
|---|---|
| `frontend/` | React + Vite + TypeScript app (landing page + production workspace on Vercel) |
| `backend/` | FastAPI + SQLAlchemy + Alembic API and 17-stage state machine orchestrator (Docker on Render) |
| `docs/` | System architecture diagrams and technical documentation |
| `landing/` | Earlier standalone landing page (superseded — kept for reference) |

---

## Running locally

### Backend
```bash
cd backend
python -m venv venv
venv/Scripts/activate   # Windows (source venv/bin/activate on mac/linux)
pip install -r requirements.txt
cp .env.example .env    # add your QWEN_API_KEY
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env    # defaults point at http://localhost:8000/api
npm run dev
```

Set `DEMO_MODE=true` in the backend `.env` to run the full pipeline with deterministic local planning and placeholder media (no API costs).

---

## Deployment

- **Frontend** → Vercel (root: `frontend/`; `vercel.json` proxies `/api` and `/media` to the backend)
- **Backend** → Render, Docker (`backend/Dockerfile` runs Alembic migrations on boot)
- Required backend env vars: `QWEN_API_KEY`, `PUBLIC_API_BASE_URL`, `FRONTEND_ORIGINS`

---

## License

[MIT](LICENSE)
