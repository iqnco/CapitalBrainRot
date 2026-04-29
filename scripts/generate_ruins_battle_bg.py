import openai
import base64
from pathlib import Path

API_KEY = "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"
OUTPUT = Path("/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/public/regions/roman_ruins_battle.png")

PROMPT = """A landscape battle arena background for a Duolingo-style quiz game, set inside the ancient Roman Colosseum.

The scene is viewed from ground level inside the arena floor. The iconic oval Colosseum walls rise up on all sides with their famous arched tiers — warm stone, terracotta and amber tones. Late afternoon golden light pours in from above. The sandy arena floor is flat in the foreground where the battle takes place. Some ancient columns and rubble are scattered to the sides.

Style: flat illustrated cartoon, bold dark outlines, no people or characters visible, warm color palette matching Italian brainrot aesthetic:
- Sandy/cream arena floor in foreground
- Terracotta and burnt orange stone walls
- Warm golden sky visible above the walls
- Muted olive green and teal accents on distant vegetation
- Dark navy/charcoal outlines, bold cartoon style
- Atmospheric dust haze for depth
- Aspect ratio: landscape (1536 wide × 1024 tall)

No text, no HUD, no UI elements — pure background scene only."""

client = openai.OpenAI(api_key=API_KEY)

print("Generating Roman Ruins battle background...")

response = client.images.generate(
    model="gpt-image-1",
    prompt=PROMPT,
    size="1536x1024",
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
    raise RuntimeError(f"Unexpected response: {item}")

OUTPUT.write_bytes(image_bytes)
print(f"Saved → {OUTPUT}")
