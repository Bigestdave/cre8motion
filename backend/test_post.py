import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000"

# Test variables
title = "Test Show"
premise = "Test Premise"
style = "polished 3D"
creative_direction = "colors: Pastel and warm tones lighting: Soft diffused texture_rules: Smooth clean"
negative_constraints = "Avoid photorealistic"

url = f"{BASE_URL}/api/shows/?title={urllib.parse.quote(title)}&premise={urllib.parse.quote(premise)}&animation_style={urllib.parse.quote(style)}&creative_direction={urllib.parse.quote(creative_direction)}&negative_constraints={urllib.parse.quote(negative_constraints)}"
print(f"URL: {url}")
req = urllib.request.Request(url, method="POST")
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode()
        print(f"Status: {resp.status}")
        print(f"Content: {content}")
        print(json.loads(content))
except Exception as e:
    print(f"Error: {e}")
