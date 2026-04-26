import base64
import io
import time
from pathlib import Path

import pillow_avif  # noqa — registers AVIF support
from PIL import Image
from openai import OpenAI

API_KEY = "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"

client = OpenAI(api_key=API_KEY)

CHARS_DIR = Path("/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/public/Characters")
OUT_DIR = CHARS_DIR / "8bit"
OUT_DIR.mkdir(exist_ok=True)

CHARACTERS = [
    {
        "file": "Tralalero.jpg",
        "name": "tralalero",
        "desc": (
            "A grey shark with a white belly walking upright on a sunny beach on its lower fins, "
            "which are wearing bright blue running sneakers. Ocean waves behind it. "
            "The shark has a toothy grin and walks confidently."
        ),
    },
    {
        "file": "bombardilocrocodilo.avif",
        "name": "bombardilocrocodilo",
        "desc": (
            "A green crocodile whose body is fused with a World War II military bomber aircraft. "
            "It has propeller engines on its limbs/sides and bomber wings. It flies through the sky."
        ),
    },
    {
        "file": "bombardinigusini.jpeg",
        "name": "bombardinigusini",
        "desc": (
            "A white domestic goose whose body is fused with a grey WW2 military bomber airplane. "
            "It has four large propeller engines on its wings, an orange beak, webbed feet, "
            "and flies dramatically over dark stormy ocean waves."
        ),
    },
    {
        "file": "capuccinoasesino.webp",
        "name": "capuccinoasesino",
        "desc": (
            "A black-and-white takeaway coffee cup with cartoon angry eyes, wearing a Naruto ninja "
            "headband with a Konoha leaf symbol, holding two samurai katana swords crossed in front, "
            "standing on two short legs with small round boots."
        ),
    },
    {
        "file": "tungtung sahur.webp",
        "name": "tungtungsahur",
        "desc": (
            "A tall cylindrical wooden log or stick with a creepy smiling human face (big round eyes, "
            "wide grin), standing upright on two thin bare human legs with bare feet, "
            "holding a wooden baseball bat."
        ),
    },
    {
        "file": "lirililarila.webp",
        "name": "lirililarila",
        "desc": (
            "An African elephant head and grey upper body sitting atop a large green saguaro cactus body "
            "with ridges. The cactus bottom wears a pair of large brown leather Birkenstock sandals "
            "with buckles. Tusks visible."
        ),
    },
    {
        "file": "prr prr patapim.png",
        "name": "brrprrpatapim",
        "desc": (
            "A bizarre creature: a large human-like face covered in green moss and tree bark, "
            "with a very long droopy nose, small beady eyes, a body made entirely of intertwined "
            "tree roots and vines, and two enormous flat human feet at the bottom."
        ),
    },
    {
        "file": "trippi troppi troppa tripa.webp",
        "name": "trippitroppi",
        "desc": (
            "An orange tabby cat face and head merged onto a shrimp or lobster body. "
            "It has many orange crustacean legs along its segmented body, long antennae from its head, "
            "a shrimp tail at the back, and cat whiskers and ears."
        ),
    },
    {
        "file": "chimpanzinibananini.jpeg",
        "name": "chimpanzinibananini",
        "desc": (
            "A chimpanzee or gorilla with bright green fur and a reddish-pink face, emerging from "
            "inside a large peeled yellow banana as if the banana peel is its body or shell. "
            "Set against a lush jungle background."
        ),
    },
    {
        "file": "lavacasaturnosaturnita.webp",
        "name": "lavacasaturnosaturnita",
        "desc": (
            "A planet Saturn — a grey sphere with iconic planetary rings around its equator — "
            "but with a black-and-white dairy cow head with horns sticking out the top, "
            "and two realistic human legs and large bare feet at the bottom wearing grey ankle cuffs."
        ),
    },
]

PROMPT = (
    "Recreate this character as a retro 8-bit pixel art game sprite. "
    "Transparent background. Use chunky square pixels, bold black outlines, "
    "a limited NES-style color palette. Clear readable silhouette, front-facing or slight 3/4 view. "
    "The character: {desc}"
)

def to_png_bytes(path: Path) -> bytes:
    img = Image.open(path).convert("RGBA")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()

for char in CHARACTERS:
    src = CHARS_DIR / char["file"]
    dst = OUT_DIR / f"{char['name']}.png"

    if dst.exists():
        print(f"[SKIP] {char['name']} already done")
        continue

    if not src.exists():
        print(f"[MISSING] {char['file']}")
        continue

    print(f"[GEN] {char['name']} ...", end=" ", flush=True)
    try:
        png_bytes = to_png_bytes(src)

        response = client.images.edit(
            model="gpt-image-1",
            image=("image.png", io.BytesIO(png_bytes), "image/png"),
            prompt=PROMPT.format(desc=char["desc"]),
            background="transparent",
            size="1024x1024",
        )

        out_bytes = base64.b64decode(response.data[0].b64_json)
        dst.write_bytes(out_bytes)
        print(f"✓ saved {dst.name}")

    except Exception as e:
        print(f"✗ FAILED — {e}")
        # Fallback: generate from text description only
        print(f"  → trying text-only fallback...", end=" ", flush=True)
        try:
            response = client.images.generate(
                model="gpt-image-1",
                prompt=PROMPT.format(desc=char["desc"]),
                background="transparent",
                size="1024x1024",
            )
            out_bytes = base64.b64decode(response.data[0].b64_json)
            dst.write_bytes(out_bytes)
            print(f"✓ saved {dst.name} (text-only)")
        except Exception as e2:
            print(f"✗ ALSO FAILED — {e2}")

    time.sleep(3)

print("\nAll done!")
