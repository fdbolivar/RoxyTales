"""
ReportLab PDF Composition & Prepress Engine for RoxyTales.
Generates millimeter-accurate, 300 DPI print-ready 24-page PDFs with 3.0 mm bleed,
parametric spine wrap covers, embedded Unicode TrueType fonts, dynamic text
overlay (zero GenAI re-invocations), and Page 24 official dedication parchment.
"""

import io
import json
import logging
import os
import platform
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from PIL import Image, ImageOps
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from backend.config import (
    BASE_DIR,
    IMPRINT_SEAL_PATH,
    LAYOUTS_24P,
    PDFS_DIR,
    RENDERS_DIR,
    STORY_BLUEPRINT_24P_PATH,
)
from backend.print_specs import (
    BookPrintSpec,
    EditionType,
    TARGET_DPI,
    audit_image_dpi,
    build_print_spec,
    mm_to_pt,
    mm_to_px,
)

logger = logging.getLogger("roxytales.pdf_engine")

# Brand Editorial Palette (Hex)
COLOR_IVORY = colors.HexColor("#FAF8F5")
COLOR_PARCHMENT = colors.HexColor("#FBF7EE")
COLOR_INK = colors.HexColor("#1A1715")
COLOR_CHARCOAL = colors.HexColor("#3D3835")
COLOR_CRIMSON = colors.HexColor("#991B1B")
COLOR_GOLD = colors.HexColor("#C28E3A")
COLOR_GOLD_LIGHT = colors.HexColor("#D4A359")
COLOR_NIGHT = colors.HexColor("#0F1730")
COLOR_CREAM_TEXT = colors.HexColor("#FDFBF7")


def load_story_blueprint_24p() -> Dict[int, Dict[str, Any]]:
    """Loads the 24-page story & keepsake blueprint synchronized from config.js."""
    if not STORY_BLUEPRINT_24P_PATH.exists():
        logger.warning(f"Missing 24p blueprint JSON at {STORY_BLUEPRINT_24P_PATH}")
        return {}
    raw_list = json.loads(STORY_BLUEPRINT_24P_PATH.read_text(encoding="utf-8"))
    return {int(item["pageNumber"]): item for item in raw_list if "pageNumber" in item}


def parse_age_months(age_label: str) -> int:
    """Extracts approximate age in months from a label like '10 meses' or '1 year'."""
    text = str(age_label or "").lower()
    match = re.search(r"\d+", text)
    if not match:
        return 10
    val = int(match.group(0))
    if any(unit in text for unit in ("año", "ano", "year", "yr")):
        return val * 12
    return val


def age_stage_key(age_months: int) -> str:
    if age_months <= 6:
        return "0_6"
    if age_months <= 12:
        return "7_12"
    return "13_24"


def interpolate_story_tokens(template_str: str, ctx: Dict[str, str]) -> str:
    """Interpolates both snake_case and camelCase story tokens without throwing on missing keys."""
    if not template_str:
        return ""
    result = str(template_str)
    for k, v in ctx.items():
        result = result.replace(f"{{{k}}}", str(v))
    return result


STORY_BLUEPRINT_24P: Dict[int, Dict[str, Any]] = load_story_blueprint_24p()


class EditorialFontRegistry:
    """Cross-platform TrueType font registration with full Spanish/English UTF-8 support."""

    _registered: bool = False
    serif_regular: str = "Helvetica"
    serif_bold: str = "Helvetica-Bold"
    serif_italic: str = "Helvetica-Oblique"
    sans_regular: str = "Helvetica"
    sans_bold: str = "Helvetica-Bold"

    @classmethod
    def ensure_registered(cls) -> Dict[str, str]:
        if cls._registered:
            return cls.get_fonts()

        search_dirs = cls._get_system_font_dirs()

        cls.serif_regular = cls._register_first_found(
            "RoxySans",
            ["segoeui.ttf", "calibri.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf", "arial.ttf"],
            search_dirs,
            fallback="Helvetica",
        )
        cls.serif_bold = cls._register_first_found(
            "RoxySansBold",
            ["segoeuib.ttf", "calibrib.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf", "arialbd.ttf"],
            search_dirs,
            fallback="Helvetica-Bold",
        )
        cls.serif_italic = cls._register_first_found(
            "RoxySansItalic",
            ["segoeuii.ttf", "calibrii.ttf", "DejaVuSans-Oblique.ttf", "LiberationSans-Italic.ttf", "ariali.ttf"],
            search_dirs,
            fallback="Helvetica-Oblique",
        )
        cls.sans_regular = cls._register_first_found(
            "RoxySans",
            ["segoeui.ttf", "calibri.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf", "arial.ttf"],
            search_dirs,
            fallback="Helvetica",
        )
        cls.sans_bold = cls._register_first_found(
            "RoxySansBold",
            ["segoeuib.ttf", "calibrib.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf", "arialbd.ttf"],
            search_dirs,
            fallback="Helvetica-Bold",
        )

        cls._registered = True
        return cls.get_fonts()

    @classmethod
    def get_fonts(cls) -> Dict[str, str]:
        return {
            "serif_regular": cls.serif_regular,
            "serif_bold": cls.serif_bold,
            "serif_italic": cls.serif_italic,
            "sans_regular": cls.sans_regular,
            "sans_bold": cls.sans_bold,
        }

    @staticmethod
    def _get_system_font_dirs() -> List[Path]:
        dirs: List[Path] = [BASE_DIR / "assets" / "fonts"]
        sys_name = platform.system().lower()
        if sys_name == "windows":
            win_dir = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"
            dirs.append(win_dir)
        elif sys_name == "darwin":
            dirs.extend([
                Path("/System/Library/Fonts/Supplemental"),
                Path("/Library/Fonts"),
                Path.home() / "Library" / "Fonts",
            ])
        else:
            dirs.extend([
                Path("/usr/share/fonts/truetype/dejavu"),
                Path("/usr/share/fonts/truetype/liberation"),
                Path("/usr/share/fonts/truetype"),
                Path("/usr/local/share/fonts"),
            ])
        return [d for d in dirs if d.exists()]

    @staticmethod
    def _register_first_found(
        alias: str,
        filenames: List[str],
        search_dirs: List[Path],
        fallback: str,
    ) -> str:
        if alias in pdfmetrics.getRegisteredFontNames():
            return alias
        for d in search_dirs:
            for fname in filenames:
                candidate = d / fname
                if candidate.exists():
                    try:
                        pdfmetrics.registerFont(TTFont(alias, str(candidate)))
                        logger.info(f"Registered TTF font '{alias}' from {candidate.name}")
                        return alias
                    except Exception as exc:
                        logger.warning(f"Could not register font {candidate}: {exc}")
        logger.warning(f"TTF font not found for {alias}; falling back to built-in {fallback}")
        return fallback


class RoxyPDFLayoutEngine:
    """
    Precision ReportLab PDF Engine for RoxyTales.
    Produces:
      1. Interior PDF (24 pages, 300 DPI, 3.0 mm bleed, safe margins, Page 24 parchment dedication)
      2. Full-Wrap Cover PDF (back + parametric spine + front + 3.0 mm bleed + alignment marks)
    """

    def __init__(self):
        self.fonts = EditorialFontRegistry.ensure_registered()

    def generate_book_pdfs(
        self,
        job_id: str,
        edition: EditionType = "hardcover",
        trim_preset: str = "8x8_in",
        language: str = "es",
        child_name: str = "Liam",
        age_label: str = "10 meses",
        pet_name: str = "Roxy",
        pet_sound: str = "Guau, guau",
        dedication_text: str = "Que la magia de tu primera Navidad brille siempre en tu corazón.",
        sender_signature: str = "Mamá y Papá",
        custom_year: str = "2026",
        is_sample: bool = True,
        include_crop_marks: bool = True,
        rendered_pages: Optional[Dict[int, str]] = None,
        custom_page_texts: Optional[Dict[int, str]] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrates generation of both Interior PDF and Full-Wrap Cover PDF.
        Never calls GenAI APIs; reuses existing rendered images or safe template fallbacks.
        """
        spec = build_print_spec(edition=edition, trim_preset=trim_preset, page_count=24)
        warnings: List[str] = []
        page_audits: Dict[str, Any] = {}

        # Resolve image paths for pages 1..23 (using rendered cache URLs if provided, else 24p layout asset)
        resolved_paths: Dict[int, Path] = {}
        for p_num in range(1, 24):
            resolved_path, warn = self._resolve_page_image_path(p_num, rendered_pages or {})
            resolved_paths[p_num] = resolved_path
            if warn:
                warnings.append(warn)

        slug = f"roxytales_{self._safe_slug(child_name)}_{edition}_{'draft' if is_sample else 'print'}_{job_id[:8]}"
        interior_filename = f"{slug}_interior.pdf"
        cover_filename = f"{slug}_cover.pdf"
        interior_path = PDFS_DIR / interior_filename
        cover_path = PDFS_DIR / cover_filename

        # 1. Build Interior PDF (Pages 1 to 24)
        self._build_interior_pdf(
            output_path=interior_path,
            spec=spec,
            resolved_paths=resolved_paths,
            language=language,
            child_name=child_name,
            age_label=age_label,
            pet_name=pet_name,
            pet_sound=pet_sound,
            dedication_text=dedication_text,
            sender_signature=sender_signature,
            custom_year=custom_year,
            is_sample=is_sample,
            include_crop_marks=include_crop_marks,
            custom_page_texts=custom_page_texts or {},
            warnings=warnings,
            page_audits=page_audits,
        )

        # 2. Build Full-Wrap Cover PDF (Back + Spine + Front + 3 mm Bleed)
        self._build_cover_pdf(
            output_path=cover_path,
            spec=spec,
            front_art_path=resolved_paths[1],
            language=language,
            child_name=child_name,
            age_label=age_label,
            pet_name=pet_name,
            custom_year=custom_year,
            is_sample=is_sample,
            include_crop_marks=include_crop_marks,
            warnings=warnings,
        )

        interior_size_kb = round(interior_path.stat().st_size / 1024.0, 1)
        cover_size_kb = round(cover_path.stat().st_size / 1024.0, 1)

        prepress_report = {
            "spec": spec.to_dict(),
            "fonts_embedded": self.fonts,
            "interior_file": {
                "filename": interior_filename,
                "url": f"/storage/pdfs/{interior_filename}",
                "size_kb": interior_size_kb,
                "pages": 24,
            },
            "cover_file": {
                "filename": cover_filename,
                "url": f"/storage/pdfs/{cover_filename}",
                "size_kb": cover_size_kb,
                "pages": 1,
                "spine_mm": spec.cover.spine_mm,
            },
            "page_audits": page_audits,
            "warnings": warnings,
            "is_sample": is_sample,
        }

        return {
            "interior_pdf_url": f"/storage/pdfs/{interior_filename}",
            "cover_pdf_url": f"/storage/pdfs/{cover_filename}",
            "interior_path": str(interior_path),
            "cover_path": str(cover_path),
            "prepress_report": prepress_report,
        }

    def _resolve_page_image_path(
        self,
        page_number: int,
        rendered_pages: Dict[int, str],
    ) -> Tuple[Path, Optional[str]]:
        """Maps a frontend render URL (/storage/renders/...) or filename to a verified local Path."""
        raw_ref = rendered_pages.get(page_number) or rendered_pages.get(str(page_number))  # type: ignore[arg-type]
        if raw_ref:
            filename = Path(str(raw_ref).split("?")[0]).name
            candidate = RENDERS_DIR / filename
            if candidate.exists() and candidate.is_file():
                return candidate, None

        template = LAYOUTS_24P.get(page_number, LAYOUTS_24P[1])
        if template.exists():
            warn = None
            if page_number == 1 and raw_ref:
                warn = f"Página {page_number}: ilustración personalizada no hallada en disco; se usó plantilla maestra."
            return template, warn

        raise FileNotFoundError(f"No se encontró ilustración ni plantilla base para la página {page_number}.")

    def _prepare_print_image(
        self,
        img_path: Path,
        target_w_mm: float,
        target_h_mm: float,
        dpi: int = TARGET_DPI,
        jpeg_quality: int = 90,
    ) -> Tuple[ImageReader, Dict[str, Any]]:
        """Validates, audits effective DPI, and normalizes image to exact target 300 DPI pixel canvas."""
        with Image.open(img_path) as raw_img:
            raw_img.load()
            audit = audit_image_dpi(raw_img.width, raw_img.height, target_w_mm, target_h_mm)
            rgb_img = raw_img.convert("RGB")
            target_px = (mm_to_px(target_w_mm, dpi), mm_to_px(target_h_mm, dpi))
            if rgb_img.size != target_px:
                rgb_img = ImageOps.fit(rgb_img, target_px, Image.Resampling.LANCZOS)

            buf = io.BytesIO()
            rgb_img.save(buf, format="JPEG", quality=jpeg_quality, dpi=(dpi, dpi), optimize=True)
            buf.seek(0)
            return ImageReader(buf), audit

    def _build_interior_pdf(
        self,
        output_path: Path,
        spec: BookPrintSpec,
        resolved_paths: Dict[int, Path],
        language: str,
        child_name: str,
        age_label: str,
        pet_name: str,
        pet_sound: str,
        dedication_text: str,
        sender_signature: str,
        custom_year: str,
        is_sample: bool,
        include_crop_marks: bool,
        custom_page_texts: Dict[int, str],
        warnings: List[str],
        page_audits: Dict[str, Any],
    ):
        ig = spec.interior
        c = canvas.Canvas(str(output_path), pagesize=(ig.page_width_pt, ig.page_height_pt))
        c.setTitle(f"RoxyTales - {child_name} & {pet_name} ({spec.edition.title()})")
        c.setAuthor("RoxyTales Publishing Imprint")
        c.setSubject("8x8 Keepsake Illustrated Storybook - 300 DPI Prepress Interior")

        lang_key = "en" if str(language).lower().startswith("en") else "es"
        render_dpi = 220 if is_sample else TARGET_DPI  # Crisp high-res; 300 DPI exact on print orders
        stage_key = age_stage_key(parse_age_months(age_label))
        gift_giver_default = "Mommy and Daddy" if lang_key == "en" else "Mamá y Papá"
        token_ctx = {
            "child_name": child_name,
            "childName": child_name,
            "pet_name": pet_name,
            "petName": pet_name,
            "pet_sound": pet_sound,
            "petSound": pet_sound,
            "age_label": age_label,
            "ageLabel": age_label,
            "custom_year": custom_year,
            "customYear": custom_year,
            "gift_giver_label": gift_giver_default,
            "giftGiverLabel": gift_giver_default,
            "ageStamp": "",
        }

        # Unified loop for Pages 1 to 23: Full-bleed illustrations + upper editorial typography banner
        for p_num in range(1, 24):
            page_meta = STORY_BLUEPRINT_24P.get(p_num, {})
            img_reader, audit = self._prepare_print_image(
                resolved_paths[p_num],
                target_w_mm=ig.page_width_mm,
                target_h_mm=ig.page_height_mm,
                dpi=render_dpi,
                jpeg_quality=86 if is_sample else 92,
            )
            page_audits[f"page_{p_num}"] = audit
            if audit["warning"]:
                warnings.append(f"Página {p_num}: {audit['warning']}")

            # 1. Full-bleed background illustration from (0, 0) to (page_width_pt, page_height_pt)
            c.drawImage(
                img_reader,
                0,
                0,
                width=ig.page_width_pt,
                height=ig.page_height_pt,
                preserveAspectRatio=False,
                mask="auto",
            )

            # 2. Resolve page title & optional keepsake subtext (zero blank pages even on direct API calls)
            raw_override = (custom_page_texts or {}).get(p_num) or (custom_page_texts or {}).get(str(p_num), "")  # type: ignore[arg-type]
            if raw_override:
                override_parts = [p.strip() for p in str(raw_override).split("\n") if p.strip()]
                title_raw = override_parts[0] if override_parts else ""
                sub_raw = " ".join(override_parts[1:]) if len(override_parts) > 1 else ""
            else:
                variants = page_meta.get("ageVariants") or {}
                variant_entry = variants.get(stage_key) or variants.get("7_12") or {}
                title_raw = variant_entry.get(lang_key) or (
                    page_meta.get("textTemplateEn") if lang_key == "en" else page_meta.get("textTemplateEs")
                ) or ""
                sub_raw = (page_meta.get("subtextEn") if lang_key == "en" else page_meta.get("subtextEs")) or ""

            title_str = interpolate_story_tokens(title_raw, token_ctx)
            sub_str = interpolate_story_tokens(sub_raw, token_ctx)

            # 3. Translucent editorial typography banner inside upper safe zone
            is_dark = bool(page_meta.get("isDarkPage", False) or p_num in (16, 17))
            banner_pad_x = mm_to_pt(4.0)
            banner_w = ig.safe_width_pt - (2.0 * banner_pad_x)
            banner_x = ig.safe_x_min_pt + banner_pad_x
            banner_top_y = ig.safe_y_min_pt + ig.safe_height_pt - mm_to_pt(3.0)

            if title_str or sub_str:
                title_font_sz = 18.0 if p_num == 1 else 15.0
                title_lead = title_font_sz * 1.26
                sub_font_sz = 9.5
                sub_lead = 13.0

                t_lines = simpleSplit(title_str, self.fonts["serif_bold"], title_font_sz, banner_w - mm_to_pt(12.0)) if title_str else []
                s_lines = simpleSplit(sub_str, self.fonts["serif_regular"], sub_font_sz, banner_w - mm_to_pt(14.0)) if sub_str else []

                top_pad = mm_to_pt(5.5)
                bottom_pad = mm_to_pt(10.5 if p_num == 1 else 5.5)
                gap_sub = mm_to_pt(2.0) if (t_lines and s_lines) else 0.0
                text_block_h = (len(t_lines) * title_lead) + gap_sub + (len(s_lines) * sub_lead)
                min_banner_h = mm_to_pt(35.0 if p_num == 1 else (30.0 if s_lines else 24.0))
                banner_h = min(ig.safe_height_pt * 0.44, max(min_banner_h, top_pad + text_block_h + bottom_pad))
                banner_y = banner_top_y - banner_h

                c.saveState()
                if is_dark:
                    c.setFillColorRGB(0.06, 0.09, 0.19, alpha=0.72)
                    c.setStrokeColorRGB(1.0, 1.0, 1.0, alpha=0.25)
                    title_color = COLOR_CREAM_TEXT
                    sub_color = COLOR_CREAM_TEXT
                else:
                    c.setFillColorRGB(0.99, 0.98, 0.96, alpha=0.86)
                    c.setStrokeColorRGB(0.76, 0.56, 0.23, alpha=0.35)
                    title_color = COLOR_INK
                    sub_color = COLOR_CHARCOAL

                c.setLineWidth(0.75)
                c.roundRect(banner_x, banner_y, banner_w, banner_h, radius=mm_to_pt(4.0), fill=1, stroke=1)

                center_x = ig.page_width_pt / 2.0
                pill_reserve = mm_to_pt(6.5) if p_num == 1 else 0.0
                cursor_y = banner_y + ((banner_h + pill_reserve + text_block_h) / 2.0) - (title_font_sz * 0.85)

                c.setFillColor(title_color)
                c.setFont(self.fonts["serif_bold"], title_font_sz)
                for line in t_lines:
                    c.drawCentredString(center_x, cursor_y, line)
                    cursor_y -= title_lead

                if s_lines:
                    cursor_y -= gap_sub
                    c.setFillColor(sub_color)
                    c.setFont(self.fonts["serif_regular"], sub_font_sz)
                    for sline in s_lines:
                        c.drawCentredString(center_x, cursor_y, sline)
                        cursor_y -= sub_lead

                # Page 1 crimson age badge pill
                if p_num == 1:
                    pill_text = (
                        f"{age_label.upper()}  ·  EDICIÓN 8×8\""
                        if lang_key == "es"
                        else f"{age_label.upper()}  ·  8×8\" EDITION"
                    )
                    c.setFont(self.fonts["sans_bold"], 8.0)
                    pill_w = pdfmetrics.stringWidth(pill_text, self.fonts["sans_bold"], 8.0) + mm_to_pt(8.0)
                    pill_h = mm_to_pt(5.5)
                    pill_x = center_x - pill_w / 2.0
                    pill_y = banner_y + mm_to_pt(3.0)
                    c.setFillColor(COLOR_CRIMSON)
                    c.roundRect(pill_x, pill_y, pill_w, pill_h, radius=pill_h / 2.0, fill=1, stroke=0)
                    c.setFillColor(colors.white)
                    c.drawCentredString(center_x, pill_y + mm_to_pt(1.75), pill_text)
                c.restoreState()

            # 4. Bottom folio (Pages 2 to 23 only, small serif)
            self._draw_page_folio(c, ig, child_name, pet_name, p_num, is_dark=is_dark)

            # 5. Optional sample watermark & trim marks
            if is_sample:
                self._draw_sample_watermark(c, ig.page_width_pt, ig.page_height_pt, lang_key)
            if include_crop_marks and ig.bleed_mm > 0:
                self._draw_interior_crop_marks(c, ig)

            c.showPage()

        # Page 24: Official Dedication Parchment & RoxyTales Publishing Imprint Seal (no page number)
        self._draw_page_24_dedication(
            c=c,
            spec=spec,
            language=lang_key,
            child_name=child_name,
            dedication_text=dedication_text,
            sender_signature=sender_signature,
            custom_year=custom_year,
            is_sample=is_sample,
            include_crop_marks=include_crop_marks,
        )
        c.showPage()
        c.save()

    def _draw_page_24_dedication(
        self,
        c: canvas.Canvas,
        spec: BookPrintSpec,
        language: str,
        child_name: str,
        dedication_text: str,
        sender_signature: str,
        custom_year: str,
        is_sample: bool,
        include_crop_marks: bool,
    ):
        ig = spec.interior
        center_x = ig.page_width_pt / 2.0

        # Full-bleed warm parchment ground
        c.saveState()
        c.setFillColor(COLOR_PARCHMENT)
        c.rect(0, 0, ig.page_width_pt, ig.page_height_pt, fill=1, stroke=0)

        # Double ornamental gold frame inside safe zone
        outer_margin = mm_to_pt(ig.bleed_mm + ig.safe_margin_mm)
        inner_margin = mm_to_pt(ig.bleed_mm + ig.safe_margin_mm + 2.5)
        c.setStrokeColor(COLOR_GOLD)
        c.setLineWidth(1.0)
        c.roundRect(
            outer_margin,
            outer_margin,
            ig.page_width_pt - 2.0 * outer_margin,
            ig.page_height_pt - 2.0 * outer_margin,
            radius=mm_to_pt(3.0),
            fill=0,
            stroke=1,
        )
        c.setStrokeColor(COLOR_GOLD_LIGHT)
        c.setLineWidth(0.5)
        c.roundRect(
            inner_margin,
            inner_margin,
            ig.page_width_pt - 2.0 * inner_margin,
            ig.page_height_pt - 2.0 * inner_margin,
            radius=mm_to_pt(2.0),
            fill=0,
            stroke=1,
        )
        c.restoreState()

        # Upper third: Official Publishing Imprint Medallion Seal
        seal_diam = mm_to_pt(40.0)
        seal_y = ig.page_height_pt - mm_to_pt(ig.bleed_mm + ig.safe_margin_mm + 12.0) - seal_diam
        seal_x = center_x - seal_diam / 2.0

        c.saveState()
        # Subtle gold ring around seal
        c.setFillColor(colors.white)
        c.setStrokeColor(COLOR_GOLD)
        c.setLineWidth(1.5)
        c.circle(center_x, seal_y + seal_diam / 2.0, seal_diam / 2.0 + mm_to_pt(1.5), fill=1, stroke=1)

        if IMPRINT_SEAL_PATH.exists():
            # Circular clip for the medallion image
            clip_path = c.beginPath()
            clip_path.circle(center_x, seal_y + seal_diam / 2.0, seal_diam / 2.0)
            c.clipPath(clip_path, stroke=0, fill=0)
            c.drawImage(
                str(IMPRINT_SEAL_PATH),
                seal_x,
                seal_y,
                width=seal_diam,
                height=seal_diam,
                preserveAspectRatio=True,
                anchor="c",
                mask="auto",
            )
        c.restoreState()

        # Edition subtitle under medallion
        c.saveState()
        c.setFillColor(COLOR_GOLD)
        c.setFont(self.fonts["sans_bold"], 8.0)
        c.drawCentredString(center_x, seal_y - mm_to_pt(6.0), 'OFFICIAL KEEPSAKE EDITION  ·  8×8"')

        # Lower 60%: Centered Dedication Card
        card_w = ig.safe_width_pt - mm_to_pt(16.0)
        card_h = mm_to_pt(96.0)
        card_x = center_x - card_w / 2.0
        card_y = mm_to_pt(ig.bleed_mm + ig.safe_margin_mm + 16.0)

        c.setFillColorRGB(1.0, 1.0, 1.0, alpha=0.72)
        c.setStrokeColorRGB(0.76, 0.56, 0.23, alpha=0.30)
        c.setLineWidth(0.75)
        c.roundRect(card_x, card_y, card_w, card_h, radius=mm_to_pt(4.0), fill=1, stroke=1)

        header_line = (
            f"With eternal love, for {child_name}."
            if language == "en"
            else f"Con amor eterno, para {child_name}."
        )
        date_line = f"DECEMBER {custom_year}" if language == "en" else f"DICIEMBRE {custom_year}"

        y_cursor = card_y + card_h - mm_to_pt(14.0)
        c.setFillColor(COLOR_CHARCOAL)
        c.setFont(self.fonts["serif_bold"], 15.0)
        c.drawCentredString(center_x, y_cursor, header_line)

        y_cursor -= mm_to_pt(7.0)
        c.setFillColor(COLOR_GOLD)
        c.setFont(self.fonts["sans_bold"], 8.5)
        c.drawCentredString(center_x, y_cursor, date_line)

        # Dedication quote wrapped cleanly
        y_cursor -= mm_to_pt(12.0)
        quote_str = f"“{dedication_text.strip()}”"
        quote_font_size = 12.5
        quote_lines = simpleSplit(quote_str, self.fonts["serif_italic"], quote_font_size, card_w - mm_to_pt(18.0))
        c.setFillColor(COLOR_CHARCOAL)
        c.setFont(self.fonts["serif_italic"], quote_font_size)
        for q_line in quote_lines[:8]:
            c.drawCentredString(center_x, y_cursor, q_line)
            y_cursor -= quote_font_size * 1.45

        # Signature
        sig_y = max(card_y + mm_to_pt(10.0), y_cursor - mm_to_pt(4.0))
        c.setFillColor(COLOR_CRIMSON)
        c.setFont(self.fonts["serif_bold"], 13.0)
        c.drawCentredString(center_x, sig_y, f"— {sender_signature}")

        # Bottom editorial imprint (Page 24 has no page number)
        folio_y = mm_to_pt(ig.bleed_mm + ig.safe_margin_mm + 5.0)
        c.setFillColor(COLOR_GOLD)
        c.setFont(self.fonts["sans_regular"], 7.5)
        c.drawCentredString(center_x, folio_y, "RoxyTales Publishing Imprint")
        c.restoreState()

        if is_sample:
            self._draw_sample_watermark(c, ig.page_width_pt, ig.page_height_pt, language)
        if include_crop_marks and ig.bleed_mm > 0:
            self._draw_interior_crop_marks(c, ig)

    def _build_cover_pdf(
        self,
        output_path: Path,
        spec: BookPrintSpec,
        front_art_path: Path,
        language: str,
        child_name: str,
        age_label: str,
        pet_name: str,
        custom_year: str,
        is_sample: bool,
        include_crop_marks: bool,
        warnings: List[str],
    ):
        cg = spec.cover
        lang_key = "en" if str(language).lower().startswith("en") else "es"
        render_dpi = 220 if is_sample else TARGET_DPI

        c = canvas.Canvas(str(output_path), pagesize=(cg.total_width_pt, cg.total_height_pt))
        c.setTitle(f"RoxyTales Cover Wrap - {child_name} ({cg.edition.title()}, Spine {cg.spine_mm}mm)")
        c.setAuthor("RoxyTales Publishing Imprint")
        c.setSubject(f"Full Wrap Cover Spread: Back + Spine ({cg.spine_mm}mm) + Front + {cg.bleed_mm}mm Bleed")

        # 1. Full-bleed warm ivory wrap background
        c.saveState()
        c.setFillColor(COLOR_IVORY)
        c.rect(0, 0, cg.total_width_pt, cg.total_height_pt, fill=1, stroke=0)
        c.restoreState()

        # 2. FRONT COVER PANEL (Right side: from front_x_pt to right edge including outer bleed)
        front_bleed_w_mm = cg.trim_width_mm + cg.bleed_mm
        front_bleed_w_pt = cg.panel_width_pt + mm_to_pt(cg.bleed_mm)
        front_reader, front_audit = self._prepare_print_image(
            front_art_path,
            target_w_mm=front_bleed_w_mm,
            target_h_mm=cg.total_height_mm,
            dpi=render_dpi,
            jpeg_quality=88 if is_sample else 93,
        )
        if front_audit["warning"]:
            warnings.append(f"Cubierta (Portada): {front_audit['warning']}")

        c.drawImage(
            front_reader,
            cg.front_x_pt,
            0,
            width=front_bleed_w_pt,
            height=cg.total_height_pt,
            preserveAspectRatio=False,
            mask="auto",
        )

        # Front Cover Title Banner (centered within trimmed front panel)
        front_center_x = cg.front_x_pt + (cg.panel_width_pt / 2.0)
        front_banner_w = cg.panel_width_pt - mm_to_pt(2.0 * cg.safe_margin_mm + 10.0)
        front_banner_h = mm_to_pt(40.0)
        front_banner_x = front_center_x - front_banner_w / 2.0
        front_banner_y = cg.total_height_pt - mm_to_pt(cg.bleed_mm + cg.safe_margin_mm + 6.0) - front_banner_h

        c.saveState()
        c.setFillColorRGB(0.99, 0.98, 0.96, alpha=0.86)
        c.setStrokeColorRGB(0.76, 0.56, 0.23, alpha=0.45)
        c.setLineWidth(0.9)
        c.roundRect(front_banner_x, front_banner_y, front_banner_w, front_banner_h, radius=mm_to_pt(4.0), fill=1, stroke=1)

        title_str = (
            f"My First Christmas with {child_name} and {pet_name}!"
            if lang_key == "en"
            else f"¡Mi Primera Navidad con {child_name} y {pet_name}!"
        )
        title_lines = simpleSplit(title_str, self.fonts["serif_bold"], 19.0, front_banner_w - mm_to_pt(12.0))
        c.setFillColor(COLOR_INK)
        c.setFont(self.fonts["serif_bold"], 19.0)
        start_y = front_banner_y + front_banner_h - mm_to_pt(12.5)
        for idx, line in enumerate(title_lines[:2]):
            c.drawCentredString(front_center_x, start_y - idx * 23.0, line)

        # Edition pill on front cover
        pill_lbl = f"{age_label.upper()}  ·  ROXYTALES {custom_year}"
        c.setFont(self.fonts["sans_bold"], 8.0)
        pw = pdfmetrics.stringWidth(pill_lbl, self.fonts["sans_bold"], 8.0) + mm_to_pt(9.0)
        ph = mm_to_pt(5.5)
        c.setFillColor(COLOR_CRIMSON)
        c.roundRect(front_center_x - pw / 2.0, front_banner_y + mm_to_pt(3.5), pw, ph, radius=ph / 2.0, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.drawCentredString(front_center_x, front_banner_y + mm_to_pt(5.2), pill_lbl)
        c.restoreState()

        # 3. SPINE PANEL (if spine_mm > 0)
        if cg.spine_mm > 0:
            c.saveState()
            c.setFillColor(COLOR_CRIMSON)
            c.rect(cg.spine_x_pt, 0, cg.spine_width_pt, cg.total_height_pt, fill=1, stroke=0)

            # Subtle gold hairline rules flanking the spine
            c.setStrokeColor(COLOR_GOLD_LIGHT)
            c.setLineWidth(0.6)
            c.line(cg.spine_x_pt + 0.5, 0, cg.spine_x_pt + 0.5, cg.total_height_pt)
            c.line(cg.front_x_pt - 0.5, 0, cg.front_x_pt - 0.5, cg.total_height_pt)

            # Vertical rotated spine title when spine width >= 4.0 mm
            if cg.spine_mm >= 4.0:
                spine_center_x = cg.spine_x_pt + cg.spine_width_pt / 2.0
                spine_center_y = cg.total_height_pt / 2.0
                c.translate(spine_center_x, spine_center_y)
                c.rotate(-90)
                spine_font_sz = min(8.5, max(5.5, cg.spine_mm * 1.15))
                c.setFillColor(COLOR_CREAM_TEXT)
                c.setFont(self.fonts["serif_bold"], spine_font_sz)
                c.drawCentredString(0, -spine_font_sz * 0.32, f"{child_name} & {pet_name}  ·  RoxyTales {custom_year}")
            c.restoreState()

        # 4. BACK COVER PANEL (Left side: back_x_pt to spine_x_pt)
        back_center_x = cg.back_x_pt + (cg.panel_width_pt / 2.0)
        back_margin_pt = mm_to_pt(cg.safe_margin_mm + 4.0)
        c.saveState()
        c.setStrokeColor(COLOR_GOLD)
        c.setLineWidth(0.9)
        c.roundRect(
            cg.back_x_pt + back_margin_pt,
            mm_to_pt(cg.bleed_mm) + back_margin_pt,
            cg.panel_width_pt - 2.0 * back_margin_pt,
            cg.panel_height_pt - 2.0 * back_margin_pt,
            radius=mm_to_pt(3.0),
            fill=0,
            stroke=1,
        )

        # Back cover Publishing Imprint medallion
        seal_d = mm_to_pt(34.0)
        seal_y = cg.total_height_pt * 0.54
        if IMPRINT_SEAL_PATH.exists():
            c.saveState()
            cp = c.beginPath()
            cp.circle(back_center_x, seal_y + seal_d / 2.0, seal_d / 2.0)
            c.clipPath(cp, stroke=0, fill=0)
            c.drawImage(
                str(IMPRINT_SEAL_PATH),
                back_center_x - seal_d / 2.0,
                seal_y,
                width=seal_d,
                height=seal_d,
                preserveAspectRatio=True,
                anchor="c",
                mask="auto",
            )
            c.restoreState()

        blurb = (
            f"A bespoke heirloom keepsake crafted especially for {child_name} and {pet_name}. "
            f"Printed on archival 170 gsm silk paper to be treasured for generations."
            if lang_key == "en"
            else f"Una edición de colección creada especialmente para {child_name} y {pet_name}. "
                 f"Impresa en papel seda de archivo de 170 g/m² para atesorar por generaciones."
        )
        blurb_lines = simpleSplit(blurb, self.fonts["serif_italic"], 10.5, cg.panel_width_pt - mm_to_pt(42.0))
        c.setFillColor(COLOR_CHARCOAL)
        c.setFont(self.fonts["serif_italic"], 10.5)
        by = seal_y - mm_to_pt(12.0)
        for line in blurb_lines:
            c.drawCentredString(back_center_x, by, line)
            by -= 15.0

        c.setFillColor(COLOR_GOLD)
        c.setFont(self.fonts["sans_bold"], 8.0)
        c.drawCentredString(
            back_center_x,
            mm_to_pt(cg.bleed_mm + cg.safe_margin_mm + 10.0),
            f"ROXYTALES PUBLISHING  ·  {cg.edition.upper()} EDITION  ·  {custom_year}",
        )
        c.restoreState()

        # 5. Prepress fold/crop marks & optional draft watermark
        if is_sample:
            self._draw_sample_watermark(c, cg.total_width_pt, cg.total_height_pt, lang_key)
        if include_crop_marks and cg.bleed_mm > 0:
            self._draw_cover_prepress_marks(c, cg)

        c.showPage()
        c.save()

    def _draw_page_folio(
        self,
        c: canvas.Canvas,
        ig,
        child_name: str,
        pet_name: str,
        page_number: int,
        is_dark: bool,
    ):
        """Draws small serif footer numbering strictly on interior pages 2..23 (omitted on Pages 1 & 24)."""
        if page_number <= 1 or page_number >= 24:
            return
        c.saveState()
        folio_y = ig.safe_y_min_pt + mm_to_pt(2.0)
        c.setFont(self.fonts["serif_regular"], 8.5)
        c.setFillColor(COLOR_CREAM_TEXT if is_dark else colors.HexColor("#786F66"))
        c.drawString(ig.safe_x_min_pt + mm_to_pt(2.0), folio_y, f"{child_name} & {pet_name}")
        c.drawRightString(
            ig.safe_x_min_pt + ig.safe_width_pt - mm_to_pt(2.0),
            folio_y,
            f"{page_number} / 24",
        )
        c.restoreState()

    def _draw_sample_watermark(self, c: canvas.Canvas, width_pt: float, height_pt: float, lang_key: str):
        label = (
            "COMPLIMENTARY DIGITAL PREVIEW · ROXYTALES"
            if lang_key == "en"
            else "MUESTRA DIGITAL DE CORTESÍA · ROXYTALES"
        )
        c.saveState()
        font_name = self.fonts["sans_bold"]
        font_size = 7.0
        text_w = pdfmetrics.stringWidth(label, font_name, font_size)
        pill_w = text_w + mm_to_pt(8.0)
        pill_h = mm_to_pt(4.8)
        pill_x = (width_pt - pill_w) / 2.0
        pill_y = mm_to_pt(5.5)
        c.setFillColorRGB(0.98, 0.96, 0.93, alpha=0.82)
        c.setStrokeColorRGB(0.10, 0.09, 0.08, alpha=0.20)
        c.setLineWidth(0.5)
        c.roundRect(pill_x, pill_y, pill_w, pill_h, radius=pill_h / 2.0, fill=1, stroke=1)
        c.setFillColorRGB(0.10, 0.09, 0.08, alpha=0.45)
        c.setFont(font_name, font_size)
        c.drawCentredString(width_pt / 2.0, pill_y + mm_to_pt(1.5), label)
        c.restoreState()

    @staticmethod
    def _draw_interior_crop_marks(c: canvas.Canvas, ig):
        """Draws hairline trim crop marks strictly inside the 3 mm bleed zone."""
        b = mm_to_pt(ig.bleed_mm)
        w = ig.page_width_pt
        h = ig.page_height_pt
        mark = mm_to_pt(min(2.2, ig.bleed_mm - 0.5))

        c.saveState()
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.35)
        # Bottom-left
        c.line(0, b, mark, b)
        c.line(b, 0, b, mark)
        # Bottom-right
        c.line(w - mark, b, w, b)
        c.line(w - b, 0, w - b, mark)
        # Top-left
        c.line(0, h - b, mark, h - b)
        c.line(b, h - mark, b, h)
        # Top-right
        c.line(w - mark, h - b, w, h - b)
        c.line(w - b, h - mark, w - b, h)
        c.restoreState()

    @staticmethod
    def _draw_cover_prepress_marks(c: canvas.Canvas, cg):
        """Draws trim crop marks and spine hinge fold marks strictly inside the 3 mm bleed zone."""
        b = mm_to_pt(cg.bleed_mm)
        w = cg.total_width_pt
        h = cg.total_height_pt
        mark = mm_to_pt(min(2.2, cg.bleed_mm - 0.5))

        c.saveState()
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.35)
        # Outer trim corners
        c.line(0, b, mark, b)
        c.line(b, 0, b, mark)
        c.line(w - mark, b, w, b)
        c.line(w - b, 0, w - b, mark)
        c.line(0, h - b, mark, h - b)
        c.line(b, h - mark, b, h)
        c.line(w - mark, h - b, w, h - b)
        c.line(w - b, h - mark, w - b, h)

        # Spine fold alignment guides (dashed cyan/magenta prepress ticks in bleed margin)
        if cg.spine_mm > 0:
            c.setStrokeColor(colors.HexColor("#0284C7"))
            c.setDash(2, 1)
            for fold_x in (cg.spine_x_pt, cg.front_x_pt):
                c.line(fold_x, 0, fold_x, mark)
                c.line(fold_x, h - mark, fold_x, h)
        c.restoreState()

    @staticmethod
    def _safe_slug(text: str) -> str:
        cleaned = "".join(ch for ch in (text or "book").lower() if ch.isalnum())
        return cleaned[:18] or "book"


# Singleton PDF layout engine
pdf_layout_engine = RoxyPDFLayoutEngine()
