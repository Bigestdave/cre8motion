# cre8motion

Monorepo for the cre8motion hackathon project.

## Structure

| Folder | What it is |
|---|---|
| `landing/` | Marketing / landing page (React + Vite) |
| `frontend/` | The app UI (React + Vite + TypeScript) |
| `backend/` | API server (FastAPI + SQLAlchemy + Alembic) |

## Running locally

### Backend
```bash
cd backend
python -m venv venv
venv/Scripts/activate   # Windows (use source venv/bin/activate on mac/linux)
pip install -r requirements.txt
cp .env.example .env    # then fill in your keys
uvicorn app.main:app --reload
```

### Frontend (app)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Landing page
```bash
cd landing
npm install
npm run dev
```
