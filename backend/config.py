"""
Configuration module for RoxyTales AI Generation Engine.
Handles environment variables, model routing, storage paths, and template mappings.
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
RENDERS_DIR = STORAGE_DIR / "renders"
PDFS_DIR = STORAGE_DIR / "pdfs"
DB_PATH = STORAGE_DIR / "roxytales.db"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
RENDERS_DIR.mkdir(parents=True, exist_ok=True)
PDFS_DIR.mkdir(parents=True, exist_ok=True)

# Load local .env file securely into os.environ (without overriding existing OS env vars)
_ENV_FILE = BASE_DIR / ".env"
if _ENV_FILE.exists():
    for _line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _k, _v = _line.split("=", 1)
        _k, _v = _k.strip(), _v.strip().strip('"').strip("'")
        if _k and _k not in os.environ:
            os.environ[_k] = _v

# Google GenAI Settings
# Note: GEMINI_API_KEY is read exclusively from server environment
_RAW_GEMINI = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_API_KEY = "" if _RAW_GEMINI in ("", "tu_gemini_key_aqui") else _RAW_GEMINI

# Model Router Settings (Option C: Economical prototype scaling to pro models)
ROXY_PREVIEW_MODEL = os.environ.get("ROXY_PREVIEW_MODEL", "gemini-2.5-flash-image")
ROXY_FINAL_MODEL = os.environ.get("ROXY_FINAL_MODEL", "gemini-3-pro-image")

PREVIEW_RESOLUTION = os.environ.get("ROXY_PREVIEW_RESOLUTION", "1K")  # 1024x1024
FINAL_RESOLUTION = os.environ.get("ROXY_FINAL_RESOLUTION", "2K")      # 2048x2048

# Asset References
DEFAULT_ROXY_IMAGE = BASE_DIR / "RoxyCharacter.jpg"
OFFICIAL_ROXY_SPRITE = BASE_DIR / "assets" / "sprites" / "roxy_official_sprite.png"
TEST_BABY_RENDER_SOURCE = BASE_DIR / "assets" / "test_fixtures" / "baby_test_render_1K.jpg"
TEST_BABY_SPRITE = BASE_DIR / "assets" / "sprites" / "baby_test_sprite.png"
TEST_BABY_ORIGINAL = BASE_DIR / "assets" / "test_fixtures" / "baby_test_original.jpg"
IMPRINT_SEAL_PATH = BASE_DIR / "PublishingImprint" / "PublishingImprint.jpg"
SPRITES_DIR = STORAGE_DIR / "sprites"
SPRITES_DIR.mkdir(parents=True, exist_ok=True)

# Test/Preview Character Reference Lock:
# When true, uses baby_test_render_1K.jpg + roxy_official_sprite.png as the locked character references
# (avoids re-generating the baby character from scratch during testing).
ROXY_TEST_PREVIEW_MODE = os.environ.get("ROXY_TEST_PREVIEW_MODE", "true").lower() in ("1", "true", "yes")

# Scene Synthesis Mode:
#   "natural_ai"     -> Multi-reference GenAI natural 3D scene synthesis (characters naturally posed & lit in scene)
#   "fast_composite" -> Offline/zero-cost Pillow sprite compositing fallback
ROXY_SCENE_MODE = os.environ.get("ROXY_SCENE_MODE", "fast_composite").lower().strip()
STORY_LAYOUTS_24P_DIR = BASE_DIR / "assets" / "stories" / "my_first_christmas_24p" / "layouts"
LAYOUTS_24P = {p: STORY_LAYOUTS_24P_DIR / f"page_{p:02d}.jpg" for p in range(1, 25)}
STORY_BLUEPRINT_24P_PATH = BASE_DIR / "backend" / "story_blueprint_24p.json"

# Upload constraints
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# Server Test & Deferred Provider Flags
TEST_MODE = os.environ.get("TEST_MODE", "true").lower() in ("1", "true", "yes")
STRIPE_ENABLED = os.environ.get("STRIPE_ENABLED", "false").lower() in ("1", "true", "yes")
GELATO_ENABLED = os.environ.get("GELATO_ENABLED", "false").lower() in ("1", "true", "yes")

# Odoo 20 Enterprise Integration (Server-side only; resolved dynamically by code/name)
ODOO_URL = os.environ.get("ODOO_URL", "").rstrip("/")
_RAW_ODOO_KEY = os.environ.get("ODOO_API_KEY", "").strip()
ODOO_API_KEY = "" if _RAW_ODOO_KEY in ("", "tu_api_key_odoo_aqui") else _RAW_ODOO_KEY
ODOO_ENV = os.environ.get("ODOO_ENV", "sandbox").strip().lower()
ODOO_TEST_PREFIX = os.environ.get("ODOO_TEST_PREFIX", "[RT-SANDBOX]").strip()
ODOO_DOCUMENTS_FOLDER_NAME = os.environ.get("ODOO_DOCUMENTS_FOLDER_NAME", "RoxyTales Sandbox PDFs").strip()
ODOO_MAIL_TEMPLATE_NAME = os.environ.get(
    "ODOO_MAIL_TEMPLATE_NAME",
    "RoxyTales: Entrega Digital de Cuento Personalizado",
).strip()
ODOO_TIMEOUT_SECONDS = float(os.environ.get("ODOO_TIMEOUT_SECONDS", "35"))
