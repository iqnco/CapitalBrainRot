#!/bin/bash

API_KEY="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"
CHARS_DIR="/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/public/Characters"
OUT_DIR="$CHARS_DIR/8bit"
mkdir -p "$OUT_DIR"

generate() {
  local NAME="$1"
  local FILE="$2"
  local DESC="$3"
  local OUT="$OUT_DIR/$NAME.png"

  if [ -f "$OUT" ]; then
    echo "[SKIP] $NAME already exists"
    return
  fi

  local SRC="$CHARS_DIR/$FILE"
  if [ ! -f "$SRC" ]; then
    echo "[MISSING] $FILE"
    return
  fi

  echo "[GEN] $NAME ..."

  # Convert to PNG first using sips (built-in macOS)
  local TMP_PNG="/tmp/cbr_${NAME}.png"
  sips -s format png "$SRC" --out "$TMP_PNG" > /dev/null 2>&1

  local PROMPT="Recreate this character as a retro 8-bit pixel art game sprite. Transparent background. Chunky square pixels, bold black outlines, limited NES-style color palette, clear front-facing silhouette. The character: $DESC"

  # Try image edit endpoint first (passes the actual image)
  RESPONSE=$(curl -s https://api.openai.com/v1/images/edits \
    -H "Authorization: Bearer $API_KEY" \
    -F model="gpt-image-1" \
    -F "image[]=@$TMP_PNG;type=image/png" \
    -F "prompt=$PROMPT" \
    -F background="transparent" \
    -F size="1024x1024")

  B64=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['b64_json'])" 2>/dev/null)

  if [ -n "$B64" ]; then
    echo "$B64" | base64 --decode > "$OUT"
    echo "  ✓ Saved $NAME.png (from image)"
  else
    echo "  Edit failed, trying text-only generation..."
    echo "  Response: $(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message','unknown'))" 2>/dev/null)"

    RESPONSE2=$(curl -s https://api.openai.com/v1/images/generations \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"model\": \"gpt-image-1\",
        \"prompt\": $(echo "$PROMPT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))"),
        \"background\": \"transparent\",
        \"size\": \"1024x1024\"
      }")

    B64_2=$(echo "$RESPONSE2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['b64_json'])" 2>/dev/null)

    if [ -n "$B64_2" ]; then
      echo "$B64_2" | base64 --decode > "$OUT"
      echo "  ✓ Saved $NAME.png (text-only)"
    else
      echo "  ✗ FAILED: $(echo "$RESPONSE2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message','?'))" 2>/dev/null)"
    fi
  fi

  rm -f "$TMP_PNG"
  sleep 3
}

generate "tralalero" "Tralalero.jpg" \
  "A grey shark with white belly walking upright on a beach wearing bright blue running sneakers on its lower fins. Toothy grin, ocean waves behind it."

generate "bombardilocrocodilo" "bombardilocrocodilo.avif" \
  "A green crocodile whose body is fused with a WW2 military bomber aircraft with propeller engines on its sides and wings. Flying through the sky."

generate "bombardinigusini" "bombardinigusini.jpeg" \
  "A white domestic goose fused with a grey WW2 bomber airplane with four large propeller engines on its wings. Orange beak, webbed feet, flying over stormy dark ocean waves."

generate "capuccinoasesino" "capuccinoasesino.webp" \
  "A black-and-white takeaway coffee cup character with cartoon angry eyes, Naruto ninja headband with leaf symbol, holding two crossed samurai katanas, standing on short legs with small boots."

generate "tungtungsahur" "tungtung sahur.webp" \
  "A tall cylindrical wooden log with a creepy smiling human face (big round eyes, wide grin), standing on two thin bare human legs, holding a wooden baseball bat."

generate "lirililarila" "lirililarila.webp" \
  "An elephant head and grey upper body on top of a green saguaro cactus body with ridges, wearing large brown leather Birkenstock sandals at the bottom. Tusks visible."

generate "brrprrpatapim" "prr prr patapim.png" \
  "A bizarre creature with a large human-like face covered in green moss and bark, very long droopy nose, body made of tree roots and vines, two enormous flat human feet at the bottom."

generate "trippitroppi" "trippi troppi troppa tripa.webp" \
  "An orange tabby cat face on a shrimp body with many orange crustacean legs, long antennae, a shrimp tail at the back, and cat whiskers and ears."

generate "chimpanzinibananini" "chimpanzinibananini.jpeg" \
  "A chimpanzee with bright green fur and reddish-pink face emerging from inside a large peeled yellow banana as if the banana peel is its shell. Jungle background."

generate "lavacasaturnosaturnita" "lavacasaturnosaturnita.webp" \
  "Planet Saturn (grey sphere with planetary rings around equator) but with a black-and-white dairy cow head with horns on top, and two realistic human legs and bare feet at the bottom with grey ankle cuffs."

echo ""
echo "All done! Check $OUT_DIR"
