from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import artifacts, artwork, characters, episodes, events, productions, shows, shots
from app.core.config import settings
from app.core.storage import ARTIFACTS_DIR
from app.db import init_and_seed_db

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
def on_startup():
    init_and_seed_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shows.router)
app.include_router(productions.router)
app.include_router(episodes.router)
app.include_router(characters.router)
app.include_router(shots.router)
app.include_router(artifacts.router)
app.include_router(artwork.router)
app.include_router(events.router)
app.mount("/media", StaticFiles(directory=ARTIFACTS_DIR), name="media")


# Accept HEAD too so free uptime pingers (UptimeRobot, cron-job.org) that
# default to HEAD keep the Render backend awake without a 405.
@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
