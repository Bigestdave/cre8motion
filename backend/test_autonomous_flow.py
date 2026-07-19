import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000"

def post(path, query=""):
    req = urllib.request.Request(f"{BASE_URL}{path}{query}", method="POST")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

print("1. Generating Show Proposal Draft...")
genre = urllib.parse.quote("relationship drama")
style = urllib.parse.quote("polished 3D")
tone = urllib.parse.quote("dramatic with comedic justice")
audience = urllib.parse.quote("global short-form viewers")
proposal = post("/api/shows/proposal", f"?genre={genre}&animation_style={style}&tone={tone}&target_audience={audience}&default_duration_seconds=45&idea_seed=Surprise%20me")
print(json.dumps(proposal, indent=2))

# Extract info
title = proposal.get("title", "Autonomous Show")
premise = proposal.get("premise", "AI premise")
visual_style = proposal.get("visual_style", {})
creative_direction = visual_style.get("creative_direction", "cinematic")
if isinstance(creative_direction, dict):
    creative_direction = " ".join(f"{k}: {v}" for k, v in creative_direction.items())
negative_constraints = visual_style.get("negative_prompt", "low quality")
if isinstance(negative_constraints, dict):
    negative_constraints = " ".join(f"{k}: {v}" for k, v in negative_constraints.items())

print("\n2. Approving Show Proposal (Creating Show)...")
show_resp = post("/api/shows/", f"?title={urllib.parse.quote(title)}&premise={urllib.parse.quote(premise)}&animation_style={urllib.parse.quote(style)}&creative_direction={urllib.parse.quote(creative_direction)}&negative_constraints={urllib.parse.quote(negative_constraints)}")
show_id = show_resp["id"]
print(f"Created Show ID: {show_id}")

# Create characters
print("\n3. Creating Show Characters...")
for char in proposal.get("characters", []):
    char_name = char.get("name", "Name")
    char_desc = char.get("canonical_description", "Description")
    c_resp = post(f"/api/shows/{show_id}/characters", f"?name={urllib.parse.quote(char_name)}&canonical_description={urllib.parse.quote(char_desc)}")
    print(f"Created Character: {c_resp.get('name')} (ID: {c_resp.get('id')})")

print("\n4. Generating Autonomous Episode Draft & Script...")
ep_draft = post(f"/api/shows/{show_id}/episodes/draft", "?idea_seed=Betrayal%20and%20reversal&duration_seconds=45")
print(json.dumps(ep_draft, indent=2))

ep_title = ep_draft.get("title", "Episode 1")
ep_idea = ep_draft.get("idea", "Plot")
ep_script = ep_draft.get("script", "Scene script")

print("\n5. Creating Episode from Draft...")
ep_resp = post("/api/episodes/", f"?show_id={show_id}&title={urllib.parse.quote(ep_title)}&idea={urllib.parse.quote(ep_idea)}&script={urllib.parse.quote(ep_script)}")
episode_id = ep_resp["id"]
print(f"Created Episode ID: {episode_id}")

print("\n6. Starting Production Run...")
prod_resp = post(f"/api/productions/{episode_id}")
prod_id = prod_resp["production_id"]
print(prod_resp)
