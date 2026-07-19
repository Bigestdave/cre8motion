import urllib.request
import json
import time

BASE_URL = "http://localhost:8000"

def post(path, query=""):
    req = urllib.request.Request(f"{BASE_URL}{path}{query}", method="POST")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

print("1. Creating Show...")
show_resp = post("/api/shows/", "?title=Fruitful%20Secrets")
show_id = show_resp["id"]
print(f"Created Show ID: {show_id}")

print("\n2. Creating Episode with Script...")
script_text = urllib.parse.quote("A miniature city built from cardboard and bottle caps comes alive at night. A cardboard train rolls slowly by, dotted with tiny lights that illuminate the path ahead.")
ep_resp = post("/api/episodes/", f"?show_id={show_id}&title=Episode%201%20-%20Cardboard%20Dreams&script={script_text}")
episode_id = ep_resp["id"]
print(f"Created Episode ID: {episode_id}")

print("\n3. Starting Production...")
prod_resp = post(f"/api/productions/{episode_id}")
prod_id = prod_resp["production_id"]
print(prod_resp)

print("\n4. Waiting for workflow to progress...")
# Poll for status. Video generation takes around 1-2 minutes.
for i in range(40):
    time.sleep(5)
    status = get(f"/api/productions/{prod_id}")
    print(f"[{i*5}s] Current Stage: {status.get('current_stage')} | Status: {status.get('status')}")
    if status.get("current_stage") == "FINAL REVIEW":
        print("\nWorkflow completed successfully!")
        break
    if status.get("status") == "failed":
        print(f"\nWorkflow failed: {status.get('failure_reason')}")
        break
