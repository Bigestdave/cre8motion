#!/bin/bash
# Seed the deployed cre8motion backend with demo data so the app looks like an active studio.
# Usage: bash seed_demo.sh [API_BASE]   (default: https://cre8motion.onrender.com/api)
set -e
API="${1:-https://cre8motion.onrender.com/api}"
IMGDIR="$(cd "$(dirname "$0")/../frontend/src/imports" && pwd)"

jqget() { python -c "import sys,json;print(json.load(sys.stdin)$1)"; }

echo "== Show 1: Fruitful Secrets =="
SHOW1=$(curl -sf -X POST "$API/shows/" -H "Content-Type: application/json" -d '{
  "title": "Fruitful Secrets",
  "premise": "A curious child, Lumi, spends several evenings with a quiet grandparent in an old countryside house, uncovering family secrets.",
  "default_duration_seconds": 45,
  "animation_style": "Cinematic Stylized 3D",
  "creative_direction": "Warm volumetric sunbeam lighting, high-contrast wood textures, vertical 9:16 safe framing.",
  "negative_constraints": "photorealistic, text, watermark, low quality"
}')
SHOW1_ID=$(echo "$SHOW1" | jqget "['id']")
echo "show1: $SHOW1_ID"

C1=$(curl -sf -X POST "$API/shows/$SHOW1_ID/characters" -H "Content-Type: application/json" -d '{
  "name": "Lumi",
  "canonical_description": "Young girl with curly hair bun, overalls, and big curious eyes."
}' | jqget "['id']")
C2=$(curl -sf -X POST "$API/shows/$SHOW1_ID/characters" -H "Content-Type: application/json" -d '{
  "name": "Grandparent",
  "canonical_description": "Grey-haired, knit sweater, quiet, defensive expressions."
}' | jqget "['id']")
echo "characters: $C1, $C2"

echo "== Uploading character reference images =="
curl -sf -X POST "$API/characters/$C1/references?reference_type=front_view" \
  -F "file=@$IMGDIR/image-4.png;type=image/png" >/dev/null && echo "Lumi ref uploaded"
curl -sf -X POST "$API/characters/$C2/references?reference_type=front_view" \
  -F "file=@$IMGDIR/image-2.png;type=image/png" >/dev/null && echo "Grandparent ref uploaded"

echo "== Episodes for Fruitful Secrets =="
for ep in \
  '{"title": "The Locked Drawer", "idea": "Lumi finds a locked drawer in the study and trades chores for clues about the key."}' \
  '{"title": "The Orchard Photograph", "idea": "A faded photograph shows the orchard before the fire nobody talks about."}' \
  '{"title": "The Family Recipe", "idea": "A glued-shut page in the family recipe book finally comes loose."}'; do
  BODY=$(echo "$ep" | python -c "import sys,json;d=json.load(sys.stdin);d['show_id']='$SHOW1_ID';d['duration_seconds']=45;print(json.dumps(d))")
  EP_ID=$(curl -sf -X POST "$API/episodes/" -H "Content-Type: application/json" -d "$BODY" | jqget "['id']")
  echo "episode: $EP_ID"
done

echo "== Show 2: The Impossible Vault =="
SHOW2=$(curl -sf -X POST "$API/shows/" -H "Content-Type: application/json" -d '{
  "title": "The Impossible Vault",
  "premise": "Three broke animal workers discover that the billionaire Bulldog keeps a supernatural golden coin inside an absurdly protected skyscraper vault.",
  "default_duration_seconds": 45,
  "animation_style": "Cinematic Stylized 3D",
  "creative_direction": "Cinematic volumetric lighting, vertical 9:16 safe cropping, rich but desaturated primary styling colors.",
  "negative_constraints": "photorealistic, text, watermark, low quality"
}')
SHOW2_ID=$(echo "$SHOW2" | jqget "['id']")
echo "show2: $SHOW2_ID"

for ch in \
  '{"name": "Niko", "canonical_description": "Burnt orange jacket, narrow calculating eyes, clever fox mastermind planner."}' \
  '{"name": "Bruno", "canonical_description": "Deep blue janitor uniform, large bear paws, muscle and emotional heart."}' \
  '{"name": "Piper", "canonical_description": "Yellow accents, reflective glasses, bird-like rapid head movements, infiltrator."}'; do
  CH_ID=$(curl -sf -X POST "$API/shows/$SHOW2_ID/characters" -H "Content-Type: application/json" -d "$ch" | jqget "['id']")
  echo "character: $CH_ID"
done

BODY=$(python -c "import json;print(json.dumps({'show_id':'$SHOW2_ID','title':'The Laser Hallway','duration_seconds':45,'idea':'The crew must cross a hallway of moving lasers to reach the golden keycard under a glass dome.'}))")
EP_ID=$(curl -sf -X POST "$API/episodes/" -H "Content-Type: application/json" -d "$BODY" | jqget "['id']")
echo "episode: $EP_ID"

echo "== Done. Verify: =="
curl -s "$API/shows/" | python -m json.tool | head -40
