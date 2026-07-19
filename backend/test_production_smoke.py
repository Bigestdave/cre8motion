from fastapi.testclient import TestClient

from app.core.config import settings

settings.DEMO_MODE = True

from app.main import app

client = TestClient(app)


def main() -> None:
    show = client.post(
        "/api/shows/",
        json={"title": "Production Smoke Show", "premise": "Validate the local production pipeline."},
    )
    assert show.status_code == 200, show.text

    episode = client.post(
        "/api/episodes/",
        json={
            "show_id": show.json()["id"],
            "title": "Pipeline Validation Episode",
            "idea": "A local production must complete each stage.",
            "duration_seconds": 30,
        },
    )
    assert episode.status_code == 200, episode.text

    production = client.post(f"/api/productions/{episode.json()['id']}")
    assert production.status_code == 200, production.text
    production_id = production.json()["production_id"]

    run = client.get(f"/api/productions/{production_id}")
    assert run.status_code == 200, run.text
    assert run.json()["current_stage"] == "READY_FOR_REVIEW", run.json()
    assert run.json()["status"] == "needs_review", run.json()

    shots = client.get(f"/api/productions/{production_id}/shots")
    assert shots.status_code == 200, shots.text
    assert len(shots.json()) == 6, shots.json()
    assert all(shot["approved_keyframe_artifact_id"] for shot in shots.json()), shots.json()
    assert all(shot["approved_video_artifact_id"] for shot in shots.json()), shots.json()

    artifacts = client.get(f"/api/productions/{production_id}/artifacts")
    assert artifacts.status_code == 200, artifacts.text
    assert len(artifacts.json()) >= 18, artifacts.json()

    events = client.get(f"/api/productions/{production_id}/events")
    assert events.status_code == 200, events.text
    assert any(event["event_type"] == "production_completed" for event in events.json()), events.json()

    print("Production pipeline smoke test passed")


if __name__ == "__main__":
    main()
