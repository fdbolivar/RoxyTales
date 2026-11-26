"""
Modular Character-Sprite & 3D Scene Composition Engine for RoxyTales.
- Generates ONLY the baby 3D character (Style #36) isolated on a clean studio background (1 API call total).
- Uses the 100% ORIGINAL Roxy official sprite ($0.00 API cost) unless the buyer uploads a custom pet photo
  (in which case ONLY the custom pet 3D character is generated separately).
- Composites the transparent 3D Baby Sprite + Original Roxy / 3D Pet Sprite across ALL 7 storybook pages
  with page-specific poses, grounded shadows, and lighting integration at $0.00 extra API cost.
"""

from collections import deque
import hashlib
import io
import logging
from math import sqrt
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

from backend.config import (
    DEFAULT_ROXY_IMAGE,
    GEMINI_API_KEY,
    LAYOUTS_24P,
    OFFICIAL_ROXY_SPRITE,
    RENDERS_DIR,
    ROXY_SCENE_MODE,
    ROXY_TEST_PREVIEW_MODE,
    SPRITES_DIR,
    TEST_BABY_RENDER_SOURCE,
    TEST_BABY_SPRITE,
)
from backend.db import get_cached_render, save_render_cache
from backend.model_router import ModelRouter

logger = logging.getLogger("roxytales.image_engine")

# Canonical Heirloom Holiday Outfit — locked identically across all generated baby sprites
CANONICAL_BABY_OUTFIT = (
    "a charming, adorable heirloom ivory-cream ribbed knit footed romper with delicate warm golden "
    "embroidered tiny stars across the chest, a soft ruby-crimson velvet Peter Pan collar and matching "
    "sleeve cuffs, and cozy matching ivory knitted booties"
)

# Style #36 — STRICTLY BABY ONLY (NO pet, NO tree, NO background scene, locked pure white #FFFFFF studio)
STYLE_36_BABY_ONLY_PROMPT = f"""
Modern 3D fairy tale storybook (RoxyTales). A modern 3D fairy tale storybook character illustration in high-end studio animation style: soft tactile clay-like render with velvet textures, friendly rounded geometry, chubby proportions, large sparkling eyes, glowing volumetric light, warm golden tones, and rich crimson accents on a 100% uniform pure solid white studio background (#FFFFFF).
Subject: ONLY ONE single baby protagonist ({{child_name}}, age {{child_age}}). Transform the uploaded baby reference photo into an adorable full-body standing/toddler 3D fairy tale animation character while faithfully preserving the baby's recognizable facial features, smile, eye shape, hair style/color, and skin tone.
MANDATORY OUTFIT (keep 100% consistent): The baby MUST wear {CANONICAL_BABY_OUTFIT}.
CRITICAL EXCLUSIONS & BACKGROUND LOCK: Generate ONLY the single baby centered vertically with generous pure white margin on all 4 sides. Strictly NO pets, NO dogs, NO cats, NO animals, NO Christmas tree, NO furniture, NO toys, NO text, NO watermarks, NO floor gradients, NO background scenery. The background MUST be pure flat solid white (#FFFFFF).
""".strip()

# Style #36 — STRICTLY PET ONLY (NO baby, NO human, NO background scene, locked pure white #FFFFFF studio)
STYLE_36_PET_ONLY_PROMPT = """
Modern 3D fairy tale storybook (RoxyTales). A modern 3D fairy tale storybook character illustration in high-end studio animation style: soft tactile clay-like render with plush velvet fur textures, friendly rounded geometry, chubby adorable proportions, large sparkling eyes, glowing volumetric light, warm golden tones, and a small rich crimson velvet festive bow on a 100% uniform pure solid white studio background (#FFFFFF).
Subject: ONLY ONE single companion pet ({pet_name}). Transform the uploaded pet reference photo into an adorable full-body 3D fairy tale animation character while faithfully preserving its exact species, breed, coat colors, markings, ear shape, and joyful expression.
CRITICAL EXCLUSIONS & BACKGROUND LOCK: Generate ONLY the single pet centered with generous pure white margin on all 4 sides. Strictly NO babies, NO humans, NO children, NO Christmas tree, NO furniture, NO text, NO watermarks, NO floor gradients, NO background scenery. The background MUST be pure flat solid white (#FFFFFF).
""".strip()

# Page-by-page NATURAL unified 3D scene action & interaction prompts across 24p scene spreads
SCENE_STORY_PROMPTS: Dict[int, Dict[str, Any]] = {
    1: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "Front Cover hero scene: The baby sits naturally and happily on a thick, plush ivory fleece rug "
            "right beside the companion pet, gently resting one tiny hand near the pet's fluffy side. Both look "
            "forward with warm, joyful smiles. Behind them glows a softly lit Christmas tree decorated with warm "
            "golden glass globes, twinkling fairy lights, crimson velvet ribbons, and wrapped keepsake gifts."
        ),
        "lighting": "Warm golden volumetric holiday lighting, soft shallow depth-of-field bokeh, natural grounded shadows on the fluffy rug.",
        "top_zone": "Keep the upper 32% of the square frame clean, softly illuminated, and uncluttered (warm cream ambient wall/soft bokeh) for title typography.",
    },
    3: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "The baby sits comfortably on the cozy fleece rug reaching one chubby hand playfully toward a glowing "
            "golden Christmas ornament hanging from a low pine branch, eyes wide with wonder. Right beside the baby, "
            "the companion pet tilts its head affectionately watching the shimmering golden globe."
        ),
        "lighting": "Magical warm golden rim-light from the glowing ornament reflecting softly in their large sparkling eyes.",
        "top_zone": "Keep the upper 30% clean and soft for story text overlay.",
    },
    5: {
        "show_baby": False,
        "show_pet": True,
        "action": (
            "Charming focal portrait of ONLY the companion pet (NO baby in this page). The pet sits proudly on the "
            "plush ivory rug beside a small crimson velvet gift box tied with a golden ribbon and tiny jingle bell, "
            "tail happily raised, looking up with a joyful affectionate smile."
        ),
        "lighting": "Warm storybook studio key light with soft golden bokeh tree lights behind.",
        "top_zone": "Keep the upper 30% clean and bright for story text overlay.",
    },
    7: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "Sensory pine discovery scene beside low snow-dusted emerald Christmas tree branches. The baby gently touches "
            "a soft pine bough with curious wonder while the companion pet sits warmly beside the baby looking affectionately."
        ),
        "lighting": "Soft warm daylight balanced with glowing amber tree fairy lights.",
        "top_zone": "Keep the upper 28% clean and soft for story text overlay.",
    },
    9: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "Playful peek-a-boo surprise box scene on the ivory rug surrounded by glowing golden starlight sparkles. "
            "The baby laughs joyfully reaching toward an open cream-and-gold holiday gift box while the companion pet sits "
            "attentively right beside the box."
        ),
        "lighting": "Warm golden holiday sparkles rising gently from the gift box with bright joyful studio light.",
        "top_zone": "Keep the upper 30% clean and uncluttered for story text overlay.",
    },
    11: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "Heartwarming hug scene by the glowing stone fireplace hearth and Christmas tree. The baby wraps both "
            "chubby arms around the companion pet in a tender, joyful cuddle on the fluffy ivory rug, both beaming warmly."
        ),
        "lighting": "Rich warm amber firelight glow with soft velvety shadows and twinkling golden tree lights.",
        "top_zone": "Keep the upper 28% clean and soft for story text overlay.",
    },
    13: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "Sunlit holiday living room scene on the wide cream wool rug beside wrapped gifts and knitted stockings. "
            "The baby sits beaming excitedly alongside the companion pet ready to explore the festive surprises."
        ),
        "lighting": "Bright cozy morning sunlight mixed with warm festive fairy lights.",
        "top_zone": "Keep the upper 30% clean and uncluttered for story text overlay.",
    },
    15: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "Cozy Christmas Eve corner beside a frosted window glowing softly with quiet snowfall outside. The baby and "
            "the companion pet sit side by side gazing calmly toward the magical winter evening."
        ),
        "lighting": "Soft golden indoor lamp warmth contrasted with serene silver-blue winter twilight outside.",
        "top_zone": "Keep the upper 30% clean and uncluttered for story text overlay.",
    },
    17: {
        "show_baby": True,
        "show_pet": True,
        "action": (
            "Peaceful starry winter night lullaby scene beside a cozy nursery window showing soft moonlight and "
            "twinkling golden stars. The baby rests peacefully on a cloud-soft cream knit quilt with gentle sleepy eyes, "
            "while the companion pet curls snugly right next to the baby keeping watch."
        ),
        "lighting": "Soft midnight-blue moonlight balanced with warm golden fairy lights and gentle cozy shadows.",
        "top_zone": "Keep the upper 32% deep starry night sky clean and uncluttered for light cream story text.",
    },
}

# Standardized, consistent proportions for offline/fast fallback composition across 24p scenes:
PAGE_LAYOUTS: Dict[int, Dict[str, Any]] = {
    1: {
        "show_baby": True, "baby_cx": 0.37, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": False,
        "show_pet": True,  "pet_cx": 0.66,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": False,
        "night_mode": False,
    },
    3: {
        "show_baby": True, "baby_cx": 0.63, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": True,
        "show_pet": True,  "pet_cx": 0.34,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": False,
        "night_mode": False,
    },
    5: {
        "show_baby": False, "baby_cx": 0.50, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": False,
        "show_pet": True,   "pet_cx": 0.50,  "pet_bottom_y": 0.905,  "pet_h": 0.44,  "pet_flip": False,
        "night_mode": False,
    },
    7: {
        "show_baby": True, "baby_cx": 0.37, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": False,
        "show_pet": True,  "pet_cx": 0.66,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": False,
        "night_mode": False,
    },
    9: {
        "show_baby": True, "baby_cx": 0.63, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": True,
        "show_pet": True,  "pet_cx": 0.34,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": False,
        "night_mode": False,
    },
    11: {
        "show_baby": True, "baby_cx": 0.37, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": False,
        "show_pet": True,  "pet_cx": 0.66,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": True,
        "night_mode": False,
    },
    13: {
        "show_baby": True, "baby_cx": 0.37, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": False,
        "show_pet": True,  "pet_cx": 0.66,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": False,
        "night_mode": False,
    },
    15: {
        "show_baby": True, "baby_cx": 0.63, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": True,
        "show_pet": True,  "pet_cx": 0.34,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": False,
        "night_mode": False,
    },
    17: {
        "show_baby": True, "baby_cx": 0.37, "baby_bottom_y": 0.905, "baby_h": 0.44, "baby_flip": False,
        "show_pet": True,  "pet_cx": 0.66,  "pet_bottom_y": 0.905,  "pet_h": 0.32,  "pet_flip": True,
        "night_mode": True,
    },
}


def compute_cache_key(page_number: int, baby_hash: str, pet_hash: str, model_id: str, resolution: str) -> str:
    """Calculates SHA-256 hash across template, baby hash, pet hash, model, resolution, and scene mode."""
    mode_tag = f"{'test_ref' if ROXY_TEST_PREVIEW_MODE else 'live_ref'}_{ROXY_SCENE_MODE}"
    raw = f"v6_24p|{mode_tag}|page:{page_number}|baby:{baby_hash}|pet:{pet_hash}|model:{model_id}|res:{resolution}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def compute_sprite_cache_key(kind: str, photo_hash: str, model_id: str) -> str:
    """Calculates SHA-256 hash for an isolated character sprite (baby or pet)."""
    raw = f"v2_char_sprite|kind:{kind}|photo:{photo_hash}|model:{model_id}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def extract_transparent_sprite(raw_img: Image.Image, out_path: Path, tol: float = 24.0) -> Path:
    """
    Removes a clean light studio background using border-seeded Euclidean flood-fill
    so interior white highlights (eyes, teeth, fur, knitwear) remain 100% intact.
    """
    img = raw_img.convert("RGBA")
    w, h = img.size
    px = img.load()

    corners = [px[3, 3][:3], px[w - 4, 3][:3], px[3, h - 4][:3], px[w - 4, h - 4][:3]]
    bg_r = sum(c[0] for c in corners) / 4.0
    bg_g = sum(c[1] for c in corners) / 4.0
    bg_b = sum(c[2] for c in corners) / 4.0

    def is_bg(r: int, g: int, b: int) -> bool:
        dr, dg, db = r - bg_r, g - bg_g, b - bg_b
        return sqrt(dr * dr + dg * dg + db * db) <= tol

    visited = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))

    # Also seed enclosed pure studio-white pockets in lower 32% (e.g., between ankles/legs)
    lower_y_start = int(h * 0.68)
    for y in range(lower_y_start, h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if r >= 238 and g >= 238 and b >= 238 and abs(r - g) <= 8 and abs(g - b) <= 8:
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))

    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if not visited[idx]:
                    r, g, b, _ = px[nx, ny]
                    if is_bg(r, g, b):
                        visited[idx] = 1
                        q.append((nx, ny))

    mask = Image.new("L", (w, h), 255)
    mpx = mask.load()
    for y in range(h):
        row_off = y * w
        for x in range(w):
            if visited[row_off + x]:
                mpx[x, y] = 0

    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    img.putalpha(mask)

    bbox = img.getbbox()
    if bbox:
        pad = 10
        img = img.crop((
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        ))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG", optimize=True)
    return out_path


class RoxyImageEngine:
    """Handles separate baby/pet 3D sprite synthesis, official Roxy reuse, and 7-page scene composition."""

    def __init__(self):
        self._client = None
        if GEMINI_API_KEY:
            try:
                from google import genai
                self._client = genai.Client(api_key=GEMINI_API_KEY)
                logger.info("Google GenAI client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}. Fallback engine active.")

    def _get_or_create_character_sprite(
        self,
        kind: str,  # "baby" | "pet"
        photo_path: Optional[Path],
        photo_hash: str,
        name: str,
        age: int,
        model_name: str,
    ) -> Tuple[Optional[Path], str]:
        """
        Generates (or retrieves from SHA-256 cache) an isolated transparent 3D sprite
        for ONLY the baby OR ONLY a custom pet. Never mixes both in the same GenAI call.
        """
        # Use default baby sprite ONLY when no user photo was uploaded or default fixture hash is requested
        if kind == "baby" and (
            photo_path is None
            or not photo_path.exists()
            or photo_hash in ("default_baby", "default_baby_sprite")
        ):
            if TEST_BABY_SPRITE.exists():
                return TEST_BABY_SPRITE, "test-fixture-baby-1k"
            if TEST_BABY_RENDER_SOURCE.exists():
                extract_transparent_sprite(Image.open(TEST_BABY_RENDER_SOURCE), TEST_BABY_SPRITE, tol=16.0)
                return TEST_BABY_SPRITE, "test-fixture-baby-1k"

        # Official original Roxy: NEVER invoke GenAI, ONLY when using default Roxy or no custom pet photo uploaded
        if kind == "pet" and (
            photo_path is None
            or not photo_path.exists()
            or photo_hash in ("default_roxy", "official_roxy_shih_tzu")
            or (photo_path.resolve() == DEFAULT_ROXY_IMAGE.resolve())
        ):
            if OFFICIAL_ROXY_SPRITE.exists():
                return OFFICIAL_ROXY_SPRITE, "official-roxy-original"
            if DEFAULT_ROXY_IMAGE.exists():
                extract_transparent_sprite(Image.open(DEFAULT_ROXY_IMAGE), OFFICIAL_ROXY_SPRITE, tol=14.0)
                return OFFICIAL_ROXY_SPRITE, "official-roxy-original"
            return None, "missing-roxy"

        if not photo_path or not photo_path.exists():
            return None, "no-photo"

        use_genai_sprite = self._client is not None and (
            not ROXY_TEST_PREVIEW_MODE or ROXY_SCENE_MODE == "natural_ai"
        )
        sprite_key = compute_sprite_cache_key(kind, photo_hash, model_name)
        cached = get_cached_render(sprite_key)
        if cached:
            is_fallback = cached["model_used"] == "roxy-artistic-composite-engine"
            if not (is_fallback and use_genai_sprite):
                cached_path = Path(cached["output_path"])
                if cached_path.exists():
                    logger.info(f"Sprite cache hit ({kind}): {cached_path.name} [{cached['model_used']}]")
                    return cached_path, cached["model_used"]

        sprite_out = SPRITES_DIR / f"{kind}_sprite_{sprite_key[:16]}.png"
        model_used = "roxy-artistic-composite-engine"

        # 1. Try Google GenAI SDK to generate ONLY this single isolated character
        if use_genai_sprite:
            try:
                generated_img = self._call_genai_single_character(
                    kind=kind,
                    photo_path=photo_path,
                    name=name,
                    age=age,
                    model_name=model_name,
                )
                if generated_img is not None:
                    extract_transparent_sprite(generated_img, sprite_out, tol=24.0)
                    model_used = model_name
                    save_render_cache(
                        cache_key=sprite_key,
                        template_id=0 if kind == "baby" else -1,
                        model_used=model_used,
                        resolution="1K",
                        output_path=str(sprite_out),
                    )
                    return sprite_out, model_used
            except Exception as exc:
                logger.error(f"GenAI single-character ({kind}) call failed: {exc}. Using medallion sprite fallback.")

        # 2. Resilient fallback: circular gold-framed portrait medallion sprite
        self._build_medallion_sprite(photo_path, sprite_out, is_pet=(kind == "pet"))
        save_render_cache(
            cache_key=sprite_key,
            template_id=0 if kind == "baby" else -1,
            model_used=model_used,
            resolution="1K",
            output_path=str(sprite_out),
        )
        return sprite_out, model_used

    def _call_genai_single_character(
        self,
        kind: str,
        photo_path: Path,
        name: str,
        age: int,
        model_name: str,
    ) -> Optional[Image.Image]:
        """Invokes Google GenAI with ONLY ONE character photo (either baby OR pet, never both)."""
        from google.genai import types

        if kind == "baby":
            prompt_text = STYLE_36_BABY_ONLY_PROMPT.format(child_name=name, child_age=age)
            ref_label = "Reference photo of the baby protagonist (transform ONLY this baby into a 3D storybook character on a plain off-white studio background, NO pets, NO scenery):"
        else:
            prompt_text = STYLE_36_PET_ONLY_PROMPT.format(pet_name=name)
            ref_label = "Reference photo of the companion pet (transform ONLY this pet into a 3D storybook character on a plain off-white studio background, NO humans, NO scenery):"

        contents = [prompt_text, ref_label, Image.open(photo_path).convert("RGB")]
        config_kwargs: Dict[str, Any] = {
            "response_modalities": ["IMAGE"],
            "temperature": 0.6,
        }
        if hasattr(types, "ImageConfig"):
            config_kwargs["image_config"] = types.ImageConfig(aspect_ratio="1:1")

        response = self._client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        if response.candidates:
            for part in response.candidates[0].content.parts:
                inline = getattr(part, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    return Image.open(io.BytesIO(inline.data)).convert("RGB")
        return None

    @staticmethod
    def _build_medallion_sprite(photo_path: Path, out_path: Path, is_pet: bool = False):
        """Creates a crisp circular gold/crimson framed portrait medallion PNG as offline fallback."""
        size = 540
        ring = 14
        canvas_img = Image.new("RGBA", (size + 2 * ring, size + 2 * ring), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas_img)
        ring_fill = (153, 27, 27, 240) if is_pet else (212, 163, 89, 240)
        draw.ellipse((2, 2, size + 2 * ring - 2, size + 2 * ring - 2), fill=ring_fill, outline=(245, 229, 201, 255), width=4)

        opened_raw = ImageOps.exif_transpose(Image.open(photo_path))
        raw = ImageOps.fit(opened_raw.convert("RGB"), (size, size), Image.Resampling.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).ellipse((4, 4, size - 4, size - 4), fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(1.2))
        canvas_img.paste(raw, (ring, ring), mask)

        out_path.parent.mkdir(parents=True, exist_ok=True)
        canvas_img.save(out_path, "PNG", optimize=True)

    def _call_genai_natural_scene(
        self,
        page_number: int,
        baby_ref_path: Optional[Path],
        pet_ref_path: Optional[Path],
        child_name: str,
        pet_name: str,
        model_name: str,
        dimension_px: int,
        output_path: Path,
    ) -> bool:
        """
        Generates a 100% NATURAL, unified 3D storybook scene (NO pasted-sticker look)
        using the locked separate Baby reference + Original Roxy (or locked Pet reference).
        """
        from google.genai import types

        scene_meta = SCENE_STORY_PROMPTS.get(page_number, SCENE_STORY_PROMPTS[1])
        prompt_text = (
            "Modern 3D fairy tale storybook (RoxyTales). A modern 3D fairy tale storybook illustration in "
            "high-end studio animation style (Pixar/DreamWorks quality): soft tactile clay-like render with "
            "velvet textures, friendly rounded geometry, chubby proportions, large sparkling eyes, glowing "
            "volumetric light, warm golden tones, and rich crimson accents.\n"
            f"SCENE & NATURAL INTERACTION (Page {page_number}): {scene_meta['action']}\n"
            f"LIGHTING & DEPTH: {scene_meta['lighting']}\n"
            f"COMPOSITION & TYPOGRAPHY RESERVE: Perfectly square 1:1 format. {scene_meta['top_zone']} "
            "Strictly NO text, NO letters, NO words, NO watermarks anywhere in the image.\n"
            "STRICT CHARACTER CONSISTENCY LOCKS:\n"
            "- If a Baby Character Reference image is provided: You MUST keep the EXACT same 3D baby face, "
            "hair, eye color, skin tone, AND the EXACT same outfit/romper color and design shown in the Baby "
            "Character Reference image. Do NOT change the baby's clothes!\n"
            "- If a Companion Pet Reference image is provided: You MUST keep the EXACT same dog/pet breed, "
            "honey-gold and white fur markings, fluffy topknot ponytail, big expressive brown eyes, and signature "
            "ruby-crimson velvet bow shown in the Companion Pet Reference image.\n"
            "- Integrate the character(s) NATURALLY into the 3D environment with realistic poses, genuine "
            "interaction, soft floor contact shadows, and unified volumetric lighting — NEVER like flat cut-outs pasted on a background."
        )

        contents: list = [prompt_text]
        if scene_meta["show_baby"] and baby_ref_path and baby_ref_path.exists():
            contents.append(
                f"LOCKED BABY CHARACTER REFERENCE ({child_name}) — preserve exact 3D face, hair, and EXACT outfit:"
            )
            contents.append(Image.open(baby_ref_path).convert("RGB"))

        if scene_meta["show_pet"] and pet_ref_path and pet_ref_path.exists():
            contents.append(
                f"LOCKED ORIGINAL COMPANION PET REFERENCE ({pet_name}) — preserve exact fur markings, face, topknot, and crimson bow:"
            )
            contents.append(Image.open(pet_ref_path).convert("RGB"))

        template_path = LAYOUTS_24P.get(page_number, LAYOUTS_24P[1])
        if template_path.exists():
            contents.append("SCENE COLOR PALETTE & SETTING MOOD REFERENCE (integrate characters naturally into this warm environment):")
            contents.append(Image.open(template_path).convert("RGB"))

        config_kwargs: Dict[str, Any] = {
            "response_modalities": ["IMAGE"],
            "temperature": 0.55,
        }
        if hasattr(types, "ImageConfig"):
            config_kwargs["image_config"] = types.ImageConfig(aspect_ratio="1:1")

        response = self._client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        if response.candidates:
            for part in response.candidates[0].content.parts:
                inline = getattr(part, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    gen_img = Image.open(io.BytesIO(inline.data)).convert("RGB")
                    if gen_img.size != (dimension_px, dimension_px):
                        gen_img = ImageOps.fit(gen_img, (dimension_px, dimension_px), Image.Resampling.LANCZOS)
                    gen_img.save(str(output_path), "JPEG", quality=93, optimize=True)
                    return True
        return False

    def render_page(
        self,
        page_number: int,
        baby_photo_path: Optional[Path],
        baby_photo_hash: str,
        pet_photo_path: Optional[Path],
        pet_photo_hash: str,
        child_name: str = "Liam",
        child_age: int = 10,
        pet_name: str = "Roxy",
        tier: str = "preview",
        force_fast_composite: bool = False,
    ) -> Tuple[str, bool, str]:
        """
        Renders a storybook page (1..7):
          1. Obtains separately locked Baby Reference + Original Roxy (or separate Pet Reference).
          2. In 'natural_ai' mode (default), synthesizes a 100% natural, unified 3D scene via GenAI
             preserving exact character identity, outfit, and lighting cohesion.
          3. Falls back cleanly to fast local sprite compositing if offline or force_fast_composite=True.
        """
        model_name, res_label, dimension_px = ModelRouter.get_tier_config(tier)
        cache_key = compute_cache_key(page_number, baby_photo_hash, pet_photo_hash, model_name, res_label)

        # 1. Check SHA-256 composed page cache (skip fallback cache if real natural_ai is active)
        cached = get_cached_render(cache_key)
        if cached:
            is_fallback = cached["model_used"] in ("roxy-artistic-composite-engine", "fast-local-composite")
            if force_fast_composite or not (is_fallback and ROXY_SCENE_MODE == "natural_ai" and self._client is not None):
                out_path = Path(cached["output_path"])
                if out_path.exists():
                    logger.info(f"Page cache hit (P{page_number}): {out_path.name} [{cached['model_used']}]")
                    return f"/storage/renders/{out_path.name}", True, cached["model_used"]

        # 2. Obtain SEPARATE Baby Reference (in test mode: baby_test_render_1K.jpg; in live mode: 1-call isolated baby)
        baby_sprite_path, baby_model = self._get_or_create_character_sprite(
            kind="baby",
            photo_path=baby_photo_path,
            photo_hash=baby_photo_hash,
            name=child_name,
            age=child_age,
            model_name=model_name,
        )
        # For natural AI reference, prefer crisp test studio portrait ONLY when no user baby photo was uploaded
        is_default_baby = (
            baby_photo_path is None
            or not baby_photo_path.exists()
            or baby_photo_hash in ("default_baby", "default_baby_sprite")
        )
        baby_ref_for_ai = (
            TEST_BABY_RENDER_SOURCE
            if (is_default_baby and TEST_BABY_RENDER_SOURCE.exists())
            else baby_sprite_path
        )

        # 3. Obtain SEPARATE Pet Reference (100% original Roxy at $0 cost, or separate GenAI custom pet)
        pet_sprite_path, pet_model = self._get_or_create_character_sprite(
            kind="pet",
            photo_path=pet_photo_path,
            photo_hash=pet_photo_hash,
            name=pet_name,
            age=child_age,
            model_name=model_name,
        )
        pet_ref_for_ai = (
            DEFAULT_ROXY_IMAGE
            if (pet_sprite_path == OFFICIAL_ROXY_SPRITE and DEFAULT_ROXY_IMAGE.exists())
            else pet_sprite_path
        )

        output_filename = f"render_{cache_key[:16]}_{res_label}.jpg"
        output_filepath = RENDERS_DIR / output_filename

        # 4. Natural Unified 3D Scene Synthesis via Google GenAI
        natural_ok = False
        if not force_fast_composite and ROXY_SCENE_MODE == "natural_ai" and self._client is not None:
            try:
                natural_ok = self._call_genai_natural_scene(
                    page_number=page_number,
                    baby_ref_path=baby_ref_for_ai,
                    pet_ref_path=pet_ref_for_ai,
                    child_name=child_name,
                    pet_name=pet_name,
                    model_name=model_name,
                    dimension_px=dimension_px,
                    output_path=output_filepath,
                )
            except Exception as exc:
                logger.error(f"Natural AI scene synthesis (P{page_number}) failed: {exc}. Falling back to local composite.")

        if natural_ok:
            reported_model = model_name
        else:
            # 5. Resilient fast local sprite composite fallback ($0.00 cost)
            self._compose_scene_with_sprites(
                page_number=page_number,
                baby_sprite_path=baby_sprite_path,
                pet_sprite_path=pet_sprite_path,
                dimension_px=dimension_px,
                output_path=output_filepath,
            )
            reported_model = "fast-local-composite"

        save_render_cache(
            cache_key=cache_key,
            template_id=page_number,
            model_used=reported_model,
            resolution=res_label,
            output_path=str(output_filepath),
        )
        return f"/storage/renders/{output_filename}", False, reported_model

    def _compose_scene_with_sprites(
        self,
        page_number: int,
        baby_sprite_path: Optional[Path],
        pet_sprite_path: Optional[Path],
        dimension_px: int,
        output_path: Path,
    ):
        """Composites the transparent 3D character sprites onto the official 3D storybook scene."""
        layout = PAGE_LAYOUTS.get(page_number, PAGE_LAYOUTS[1])
        template_file = LAYOUTS_24P.get(page_number, LAYOUTS_24P[1])

        if template_file.exists():
            base = Image.open(template_file).convert("RGBA")
            base = ImageOps.fit(base, (dimension_px, dimension_px), Image.Resampling.LANCZOS)
        else:
            base = Image.new("RGBA", (dimension_px, dimension_px), (250, 248, 245, 255))

        def place_sprite(sprite_path: Path, cx_frac: float, bottom_y_frac: float, h_frac: float, flip: bool):
            sp = Image.open(sprite_path).convert("RGBA")
            if flip:
                sp = ImageOps.mirror(sp)

            target_h = int(dimension_px * h_frac)
            aspect = sp.width / max(1, sp.height)
            target_w = int(target_h * aspect)
            sp = sp.resize((target_w, target_h), Image.Resampling.LANCZOS)

            # Subtle moonlit tint on Page 4 (night scene) so characters blend naturally
            if layout["night_mode"]:
                r, g, b, a = sp.split()
                r = ImageEnhance.Brightness(r).enhance(0.84)
                g = ImageEnhance.Brightness(g).enhance(0.88)
                b = ImageEnhance.Brightness(b).enhance(1.02)
                sp = Image.merge("RGBA", (r, g, b, a))

            paste_x = int(dimension_px * cx_frac - target_w / 2.0)
            paste_y = int(dimension_px * bottom_y_frac - target_h)

            # Soft grounded elliptical contact shadow under character
            shadow_layer = Image.new("RGBA", (dimension_px, dimension_px), (0, 0, 0, 0))
            sh_w = int(target_w * 0.72)
            sh_h = max(12, int(target_h * 0.09))
            sh_x0 = int(dimension_px * cx_frac - sh_w / 2.0)
            sh_y0 = int(dimension_px * bottom_y_frac - sh_h * 0.65)
            ImageDraw.Draw(shadow_layer).ellipse(
                (sh_x0, sh_y0, sh_x0 + sh_w, sh_y0 + sh_h),
                fill=(28, 18, 12, 85),
            )
            shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=max(6, dimension_px // 90)))
            base.alpha_composite(shadow_layer)
            base.alpha_composite(sp, (paste_x, paste_y))

        if layout["show_baby"] and baby_sprite_path and baby_sprite_path.exists():
            place_sprite(
                baby_sprite_path,
                layout["baby_cx"],
                layout["baby_bottom_y"],
                layout["baby_h"],
                layout["baby_flip"],
            )

        if layout["show_pet"] and pet_sprite_path and pet_sprite_path.exists():
            place_sprite(
                pet_sprite_path,
                layout["pet_cx"],
                layout["pet_bottom_y"],
                layout["pet_h"],
                layout["pet_flip"],
            )

        final_rgb = base.convert("RGB")
        final_rgb.save(str(output_path), "JPEG", quality=93, optimize=True)


# Singleton engine instance
image_engine = RoxyImageEngine()
