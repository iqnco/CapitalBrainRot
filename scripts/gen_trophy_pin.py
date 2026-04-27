"""Generate a clean trophy pin image for the Skibidi Toilet Bowl map pin."""
import base64
import os
from pathlib import Path
from openai import OpenAI

API_KEY = os.environ.get("OPENAI_API_KEY", "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")
client = OpenAI(api_key=API_KEY)

OUT = Path("/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/public/ui")
OUT.mkdir(exist_ok=True)

dst = OUT / "skibidi_trophy.png"

print("[GEN] skibidi_trophy.png ...", end=" ", flush=True)

response = client.images.generate(
    model="gpt-image-1",
    prompt=(
        "A single classic sports trophy cup icon on a fully transparent background. "
        "The trophy has the following proportions: tall and elegant, roughly 1:1.3 width-to-height ratio. "
        "The cup portion takes up the top 55% of the image. "
        "Two gracefully curved handles arc outward from the upper sides of the cup — they are thick, bold, and clearly visible, extending well outside the cup body. "
        "Below the cup, a short narrow cylindrical stem connects to a wide flat rectangular base with a slight taper. "
        "Style: clean vector illustration outline. "
        "Color: rich gold (#D4A017) body with a subtle inner highlight sheen, deep purple (#4C1D95) shadow areas on the interior of the cup for depth, thin dark outline. "
        "The shape is crisp and iconic — like a classic World Cup or UEFA Champions League trophy silhouette. "
        "No text, no background, no decorations — just the clean trophy shape. "
        "Transparent background. Center the trophy in the image with generous padding so handles are fully visible and not clipped."
    ),
    background="transparent",
    size="1024x1024",
)

out_bytes = base64.b64decode(response.data[0].b64_json)
dst.write_bytes(out_bytes)
print(f"✓ saved {dst}")
