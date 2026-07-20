#!/bin/bash
# Seed the deployed cre8motion backend with demo data so the app looks like an active studio.
# Usage: bash seed_demo.sh [API_BASE]   (default: https://cre8motion.onrender.com/api)
set -e
API="${1:-https://cre8motion.onrender.com/api}"
IMGDIR="$(cd "$(dirname "$0")/../frontend/src/imports" && pwd)"

jqget() { python -c "import sys,json;print(json.load(sys.stdin)$1)"; }

echo "== Show 1 (flagship): Fruitful Secrets =="
SHOW1=$(curl -sf -X POST "$API/shows/" -H "Content-Type: application/json" -d '{
  "title": "Fruitful Secrets",
  "premise": "A curious child, Lumi, spends evenings with a quiet grandparent in an old countryside house. Each episode she finds an object tied to a hidden family history — and the grandparent conceals the truth not with words, but with expressions, gestures, and locked things.",
  "default_duration_seconds": 45,
  "animation_style": "Cinematic Stylized 3D",
  "creative_direction": "Warm volumetric sunbeam lighting, high-contrast wood textures, vertical 9:16 safe framing. Every clue is a physical object: photographs, music boxes, necklaces, keys.",
  "negative_constraints": "photorealistic, text, watermark, low quality, dialogue, lip-sync"
}')
SHOW1_ID=$(echo "$SHOW1" | jqget "['id']")
echo "show1: $SHOW1_ID"

C1=$(curl -sf -X POST "$API/shows/$SHOW1_ID/characters" -H "Content-Type: application/json" -d '{
  "name": "Lumi",
  "canonical_description": "Young girl, curly hair bun, overalls, big curious eyes. Signature behavior: tilts her head when she notices a clue. Signature object: a small pocket magnifier."
}' | jqget "['id']")
C2=$(curl -sf -X POST "$API/shows/$SHOW1_ID/characters" -H "Content-Type: application/json" -d '{
  "name": "Grandparent",
  "canonical_description": "Grey-haired, knit sweater, quiet defensive expressions. Signature behavior: touches their locket when a secret is close. Signature object: a ring of old keys."
}' | jqget "['id']")
C3=$(curl -sf -X POST "$API/shows/$SHOW1_ID/characters" -H "Content-Type: application/json" -d '{
  "name": "The Visitor",
  "canonical_description": "Tall figure in a weathered coat, kind tired eyes, wears a pendant with the same symbol as the music box. Moves slowly, always seen first as a silhouette or reflection."
}' | jqget "['id']")
echo "characters: $C1, $C2, $C3"

echo "== Uploading character reference images =="
curl -sf -X POST "$API/characters/$C1/references?reference_type=front_view" \
  -F "file=@$IMGDIR/image-4.png;type=image/png" -o /dev/null && echo "Lumi ref uploaded"
curl -sf -X POST "$API/characters/$C2/references?reference_type=front_view" \
  -F "file=@$IMGDIR/image-2.png;type=image/png" -o /dev/null && echo "Grandparent ref uploaded"

echo "== Season 1 episodes (each opens a question the next answers) =="
for ep in \
  '{"title": "The Gift", "idea": "The grandparent gives Lumi an old music box. When Lumi opens it, the grandparent sees the symbol inside and quickly closes the lid. Question opened: why is the symbol frightening?"}' \
  '{"title": "The Message", "idea": "Lumi discovers a folded photograph hidden beneath the music-box lining. One face has been torn away. Question opened: who was removed from the photograph?"}' \
  '{"title": "The Visitor", "idea": "A stranger arrives at the garden gate wearing the same symbol as the music box. The grandparent sends them away — then secretly watches them leave. Question opened: why does the grandparent recognize the visitor?"}' \
  '{"title": "The Moon Necklace", "idea": "Lumi finds a moon-shaped necklace under the kitchen table. When she offers it to the grandparent, the visitor’s reflection appears in the window. Someone has been inside the house."}'; do
  BODY=$(echo "$ep" | python -c "import sys,json;d=json.load(sys.stdin);d['show_id']='$SHOW1_ID';d['duration_seconds']=45;print(json.dumps(d))")
  EP_ID=$(curl -sf -X POST "$API/episodes/" -H "Content-Type: application/json" -d "$BODY" | jqget "['id']")
  echo "episode: $EP_ID"
done

echo "== Show 2: The Lucky Wallet =="
SHOW2=$(curl -sf -X POST "$API/shows/" -H "Content-Type: application/json" -d '{
  "title": "The Lucky Wallet",
  "premise": "A broke delivery rider finds a wallet that produces money whenever they act selfishly — and empties whenever they help someone. Every episode is one delivery, one temptation, and one visible moral choice.",
  "default_duration_seconds": 45,
  "animation_style": "Cinematic Stylized 3D",
  "creative_direction": "Rain-slick neon city, warm gold glow reserved for the wallet money, cool blue-grey streets. The wallet is always the most saturated object in frame.",
  "negative_constraints": "photorealistic, text, watermark, low quality, dialogue, lip-sync"
}')
SHOW2_ID=$(echo "$SHOW2" | jqget "['id']")
echo "show2: $SHOW2_ID"

C4=$(curl -sf -X POST "$API/shows/$SHOW2_ID/characters" -H "Content-Type: application/json" -d '{
  "name": "Remy",
  "canonical_description": "Wiry delivery rider, patched red windbreaker, tired hopeful eyes, courier bag with a broken buckle. Signature behavior: weighs the wallet in one hand before every decision."
}' | jqget "['id']")
C5=$(curl -sf -X POST "$API/shows/$SHOW2_ID/characters" -H "Content-Type: application/json" -d '{
  "name": "The Wallet",
  "canonical_description": "Worn brown leather wallet with a faint gold seam that glows when it fills. Its clasp opens by itself when temptation is near. The most saturated object in every frame."
}' | jqget "['id']")
echo "characters: $C4, $C5"

BODY=$(python -c "import json;print(json.dumps({'show_id':'$SHOW2_ID','title':'The First Find','duration_seconds':45,'idea':'Remy finds the wallet in the rain beside a crashed bicycle. Returning a dropped banknote to a stranger makes the wallet visibly lighter — keeping one makes it heavier. Remy notices, and the clasp clicks open on its own.'}))")
EP_ID=$(curl -sf -X POST "$API/episodes/" -H "Content-Type: application/json" -d "$BODY" | jqget "['id']")
echo "episode: $EP_ID"

echo "== Done. Verify: =="
curl -s "$API/shows/" | python -m json.tool | head -40
