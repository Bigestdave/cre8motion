from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def main() -> None:
    health = client.get("/health")
    assert health.status_code == 200, health.text

    show = client.post(
        "/api/shows/",
        json={
            "title": "Contract Test Show",
            "premise": "A concise API contract smoke test.",
            "animation_style": "Polished 3D",
            "creative_direction": "Warm cinematic lighting",
        },
    )
    assert show.status_code == 200, show.text
    show_id = show.json()["id"]

    character = client.post(
        f"/api/shows/{show_id}/characters",
        json={"name": "Lumi", "canonical_description": "A bright, expressive hero."},
    )
    assert character.status_code == 200, character.text

    episode = client.post(
        "/api/episodes/",
        json={
            "show_id": show_id,
            "title": "The First Clue",
            "idea": "Lumi discovers a mysterious signal.",
            "duration_seconds": 45,
        },
    )
    assert episode.status_code == 200, episode.text
    episode_payload = episode.json()
    assert episode_payload["episode_number"] == 1, episode_payload
    assert episode_payload["base_continuity_version"] == 1, episode_payload

    print("API contract smoke test passed")


if __name__ == "__main__":
    main()
