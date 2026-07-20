from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import artifacts, artwork, characters, episodes, events, productions, shows, shots
from app.core.config import settings
from app.core.storage import ARTIFACTS_DIR

app = FastAPI(title=settings.PROJECT_NAME)

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


@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
