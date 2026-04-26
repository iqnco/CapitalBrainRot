#!/usr/bin/env bash
set -euo pipefail

API_KEY="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"
OUT="/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/public/RankIcons"

declare -a NAMES=("brain_copper" "brain_bronze" "brain_silver" "brain_gold" "brain_platinum" "brain_emerald" "brain_diamond" "brain_champion")

declare -a PROMPTS=(
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is bright healthy pink, perfectly round and fresh, happy wide eyes, cheerful expression. Simple flat colors, pixelated style, white background."
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is mostly pink with one small brownish bruise spot on top, eyes slightly droopy and tired. Simple flat colors, pixelated style, white background."
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is pink with a noticeable greenish tinge and a couple of dark spots, eyes half-closed and weary, slight frown. Simple flat colors, pixelated style, white background."
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is half pink half green-yellow, visibly mushy on one side, sad droopy eyes, small frown, a tiny drip of slime. Simple flat colors, pixelated style, white background."
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is mostly sickly green with pink patches, mushy texture, very droopy sad eyes, green slime dripping from it, looking ill. Simple flat colors, pixelated style, white background."
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is almost entirely dark green and mushy, oozing slime, eyes going in different directions, mouth hanging open, barely holding together. Simple flat colors, pixelated style, white background."
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is deep dark green and black with rot, chunks falling off, slime everywhere, crossed-out X eyes, totally decomposed and falling apart. Simple flat colors, pixelated style, white background."
  "8-bit pixel art sprite of a cute little brain character with big round cartoon eyes and tiny stubby feet. The brain is completely black and dark purple with rot and slime, wearing a tiny gold pixel crown, chaotic glowing red eyes, fully destroyed and rotted but somehow triumphant. Simple flat colors, pixelated style, white background."
)

for i in "${!NAMES[@]}"; do
  NAME="${NAMES[$i]}"
  PROMPT="${PROMPTS[$i]}"
  echo "Generating $NAME (rank $((i+1))/8)..."

  RESPONSE=$(curl -s https://api.openai.com/v1/images/generations \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"gpt-image-1\",
      \"prompt\": $(echo "$PROMPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))'),
      \"n\": 1,
      \"size\": \"1024x1024\",
      \"output_format\": \"png\"
    }")

  # Try b64_json first, then url
  B64=$(echo "$RESPONSE" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["data"][0].get("b64_json",""))' 2>/dev/null || echo "")

  if [ -n "$B64" ]; then
    echo "$B64" | base64 --decode > "${OUT}/${NAME}.png"
    echo "  ✓ saved ${NAME}.png from b64"
  else
    URL=$(echo "$RESPONSE" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["data"][0].get("url",""))' 2>/dev/null || echo "")
    if [ -n "$URL" ]; then
      curl -s "$URL" -o "${OUT}/${NAME}.png"
      echo "  ✓ saved ${NAME}.png from url"
    else
      echo "  ✗ FAILED for $NAME"
      echo "$RESPONSE" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("error",d))' 2>/dev/null || echo "$RESPONSE"
    fi
  fi

  sleep 1
done

echo ""
echo "Done! Check /public/RankIcons/ for brain_*.png files"
