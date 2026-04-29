import openai
import base64
import io
from pathlib import Path
from PIL import Image

API_KEY = "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"

SOURCE = Path("/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/content/roman-ruins/source/roman ruins.jpg")
OUTPUT = Path("/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/public/regions/roman_ruins_map.png")

PROMPT = """Take this tourist map of the Colosseum and Roman Forum and redraw it as a flat illustrated map
that matches the style of a simplified Italian regions map: bold dark navy outlines, flat cartoon shapes,
no gradients, no shading.

Keep the exact same top-down layout and footprint of all structures — Colosseum oval on the right,
the long rectangular forum complex on the left, surrounding open areas — but render them as clean flat
illustrated shapes.

Remove every single text label, annotation, number, watermark, and icon from the image entirely.

Color palette to match the existing map theme:
- Ground/background: warm cream (#FFF9F0)
- Major stone structures (Colosseum, temples, basilicas): terracotta orange (#CE2B37 range)
- Forum floor / open plazas: olive green (#6B7C45 range)
- Surrounding grass/outer zones: muted teal (#2E6B6B range)
- Walls and building outlines: thick dark navy (#1A1A2E), bold cartoon style
- Paths and roads: warm sandy beige

Style: flat illustration, bold outlines, top-down aerial view, simplified clean shapes,
no text, no labels, no numbers, no watermarks. Match the vibe of a Duolingo-style illustrated map."""

client = openai.OpenAI(api_key=API_KEY)

# Convert JPG → PNG (API requires PNG)
img = Image.open(SOURCE).convert("RGBA")
png_buf = io.BytesIO()
img.save(png_buf, format="PNG")
png_buf.seek(0)

print("Sending to gpt-image-1...")

response = client.images.edit(
    model="gpt-image-1",
    image=("roman_ruins.png", png_buf, "image/png"),
    prompt=PROMPT,
    size="1024x1024",
    n=1,
)

item = response.data[0]

if hasattr(item, "b64_json") and item.b64_json:
    image_bytes = base64.b64decode(item.b64_json)
elif hasattr(item, "url") and item.url:
    import urllib.request
    with urllib.request.urlopen(item.url) as r:
        image_bytes = r.read()
else:
    raise RuntimeError(f"Unexpected response format: {item}")

OUTPUT.write_bytes(image_bytes)
print(f"Saved → {OUTPUT}")
