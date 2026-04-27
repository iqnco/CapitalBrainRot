"""Generate Mr.Skib 8-bit sprite and Skibidi Toilet Bowl bathroom background."""
import base64
import io
import os
from pathlib import Path
from PIL import Image
from openai import OpenAI

API_KEY = os.environ.get("OPENAI_API_KEY", "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")
client = OpenAI(api_key=API_KEY)

PROJECT = Path("/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot")
CHARS_8BIT = PROJECT / "public/Characters/8bit"
REGIONS    = PROJECT / "public/regions"

def to_png_bytes(path: Path) -> bytes:
    img = Image.open(path).convert("RGBA")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


# ── 1. Mr.Skib 8-bit evil sprite ─────────────────────────────────────────────
mrskib_src = PROJECT / "public/Characters/Mr.Skib.png"
mrskib_dst = CHARS_8BIT / "mrskib.png"

if mrskib_dst.exists():
    print("[SKIP] mrskib.png already exists")
else:
    print("[GEN] mrskib.png ...", end=" ", flush=True)
    try:
        png_bytes = to_png_bytes(mrskib_src)
        response = client.images.edit(
            model="gpt-image-1",
            image=("mr_skib.png", io.BytesIO(png_bytes), "image/png"),
            prompt=(
                "Recreate this character as a retro 8-bit pixel art game sprite villain boss. "
                "The character is a sinister evil version: glowing red demonic eyes, menacing grin, "
                "dark shadowy aura with purple/green energy crackling around the edges, "
                "dramatic villain pose. Keep the recognizable silhouette of the reference character. "
                "Style: chunky square pixels, bold black outlines, limited NES-style color palette "
                "with dark purples, blood reds, and sickly greens for the evil aura. "
                "Transparent background. Front-facing sprite, full body visible, very dramatic and intimidating."
            ),
            background="transparent",
            size="1024x1024",
        )
        out_bytes = base64.b64decode(response.data[0].b64_json)
        mrskib_dst.write_bytes(out_bytes)
        print(f"✓ saved mrskib.png")
    except Exception as e:
        print(f"✗ FAILED — {e}")


# ── 2. Skibidi bathroom battle background ─────────────────────────────────────
bathroom_dst = REGIONS / "skibidi_bathroom.png"

if bathroom_dst.exists():
    print("[SKIP] skibidi_bathroom.png already exists")
else:
    print("[GEN] skibidi_bathroom.png ...", end=" ", flush=True)
    try:
        response = client.images.generate(
            model="gpt-image-1",
            prompt=(
                "A retro 8-bit pixel art battle scene background of a grimy menacing public restroom. "
                "Rows of porcelain toilets with lids open, tiled walls with cracks and graffiti, "
                "flickering fluorescent ceiling lights casting sickly green glow, "
                "wet reflective floor tiles, dark moody atmosphere. "
                "Evil red glowing eyes peer from inside one of the open toilet bowls. "
                "Style: classic NES/SNES era pixel art, 16-color palette, dramatic lighting with deep shadows. "
                "Landscape orientation, suitable as a game battle arena background. "
                "Foreground is clear for character sprites. Highly stylized and dramatic."
            ),
            size="1536x1024",
        )
        out_bytes = base64.b64decode(response.data[0].b64_json)
        bathroom_dst.write_bytes(out_bytes)
        print(f"✓ saved skibidi_bathroom.png")
    except Exception as e:
        print(f"✗ FAILED — {e}")

print("\nDone!")
