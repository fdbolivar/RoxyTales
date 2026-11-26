"""
Prepress Specifications & Parametric Geometry for RoxyTales (ReportLab).
Defines millimeter-accurate print dimensions, 3.0 mm bleed, parametric spine width
by edition (hardcover, softcover, digital), safe text zones, and 300 DPI auditing.
"""

from dataclasses import dataclass, asdict
from math import ceil
from typing import Dict, Any, Literal, Tuple
from reportlab.lib.units import mm as RL_MM

# Exact unit conversion constants
MM_TO_PT: float = float(RL_MM)  # 2.8346456692913386 pt per mm
MM_PER_INCH: float = 25.4
TARGET_DPI: int = 300
MIN_ACCEPTABLE_DPI: int = 150

# Standard RoxyTales prepress constants
DEFAULT_BLEED_MM: float = 3.0
DEFAULT_SAFE_MARGIN_MM: float = 6.0
DEFAULT_PAGE_COUNT: int = 8
DEFAULT_PAPER_GSM: int = 170
DEFAULT_PAPER_CALIPER_MM: float = 0.155  # 170 gsm Silk coated stock (~0.155 mm/leaf)
HARDCOVER_BOARD_MM: float = 2.0          # 2.0 mm greyboard per cover panel
HARDCOVER_HINGE_ALLOWANCE_MM: float = 1.5

TRIM_PRESETS_MM: Dict[str, Tuple[float, float]] = {
    "8x8_in": (203.2, 203.2),      # Standard US/Gelato 8x8 inch square
    "200x200_mm": (200.0, 200.0),  # Metric EU 200x200 mm square
}

EditionType = Literal["hardcover", "softcover", "digital"]


def mm_to_pt(value_mm: float) -> float:
    """Converts millimeters to exact ReportLab points (1 mm = 2.834645669... pt)."""
    return value_mm * MM_TO_PT


def mm_to_px(value_mm: float, dpi: int = TARGET_DPI) -> int:
    """Calculates required integer pixels for a given physical millimeter span at target DPI."""
    return int(ceil((value_mm / MM_PER_INCH) * dpi))


def compute_spine_mm(
    edition: EditionType,
    page_count: int = DEFAULT_PAGE_COUNT,
    paper_caliper_mm: float = DEFAULT_PAPER_CALIPER_MM,
    board_thickness_mm: float = HARDCOVER_BOARD_MM,
) -> float:
    """
    Parametric spine width calculation in millimeters:
      - digital:   0.0 mm (no physical binding)
      - softcover: leaves * caliper + adhesive tolerance (min 2.5 mm)
      - hardcover: leaves * caliper + 2 * board_thickness + hinge allowance (min 6.0 mm)
    """
    edition_norm = (edition or "hardcover").lower().strip()
    leaves = max(1, page_count) / 2.0
    text_block_mm = leaves * paper_caliper_mm

    if edition_norm == "digital":
        return 0.0
    if edition_norm == "softcover":
        return round(max(2.5, text_block_mm + 0.6), 2)
    # Default: hardcover
    return round(max(6.0, text_block_mm + (2.0 * board_thickness_mm) + HARDCOVER_HINGE_ALLOWANCE_MM), 2)


@dataclass(frozen=True)
class InteriorGeometry:
    trim_width_mm: float
    trim_height_mm: float
    bleed_mm: float
    safe_margin_mm: float
    page_width_mm: float
    page_height_mm: float
    page_width_pt: float
    page_height_pt: float
    safe_x_min_pt: float
    safe_y_min_pt: float
    safe_width_pt: float
    safe_height_pt: float
    required_px_300dpi: Tuple[int, int]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class CoverGeometry:
    edition: str
    trim_width_mm: float
    trim_height_mm: float
    bleed_mm: float
    spine_mm: float
    safe_margin_mm: float
    total_width_mm: float
    total_height_mm: float
    total_width_pt: float
    total_height_pt: float
    back_x_mm: float
    spine_x_mm: float
    front_x_mm: float
    back_x_pt: float
    spine_x_pt: float
    front_x_pt: float
    panel_width_pt: float
    spine_width_pt: float
    panel_height_pt: float
    required_px_300dpi: Tuple[int, int]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class BookPrintSpec:
    edition: str
    trim_preset: str
    page_count: int
    paper_gsm: int
    target_dpi: int
    interior: InteriorGeometry
    cover: CoverGeometry

    def to_dict(self) -> Dict[str, Any]:
        return {
            "edition": self.edition,
            "trim_preset": self.trim_preset,
            "page_count": self.page_count,
            "paper_gsm": self.paper_gsm,
            "target_dpi": self.target_dpi,
            "interior": self.interior.to_dict(),
            "cover": self.cover.to_dict(),
        }


def build_print_spec(
    edition: EditionType = "hardcover",
    trim_preset: str = "8x8_in",
    page_count: int = DEFAULT_PAGE_COUNT,
    bleed_mm: float = DEFAULT_BLEED_MM,
    safe_margin_mm: float = DEFAULT_SAFE_MARGIN_MM,
    paper_gsm: int = DEFAULT_PAPER_GSM,
) -> BookPrintSpec:
    """Constructs the complete immutable prepress geometry for interior and full-wrap cover PDFs."""
    trim_w, trim_h = TRIM_PRESETS_MM.get(trim_preset, TRIM_PRESETS_MM["8x8_in"])
    spine_mm = compute_spine_mm(edition=edition, page_count=page_count)

    # Interior geometry (single square page + 3 mm bleed on all 4 sides)
    int_w_mm = round(trim_w + 2.0 * bleed_mm, 3)
    int_h_mm = round(trim_h + 2.0 * bleed_mm, 3)
    safe_offset_mm = bleed_mm + safe_margin_mm

    interior = InteriorGeometry(
        trim_width_mm=trim_w,
        trim_height_mm=trim_h,
        bleed_mm=bleed_mm,
        safe_margin_mm=safe_margin_mm,
        page_width_mm=int_w_mm,
        page_height_mm=int_h_mm,
        page_width_pt=mm_to_pt(int_w_mm),
        page_height_pt=mm_to_pt(int_h_mm),
        safe_x_min_pt=mm_to_pt(safe_offset_mm),
        safe_y_min_pt=mm_to_pt(safe_offset_mm),
        safe_width_pt=mm_to_pt(trim_w - 2.0 * safe_margin_mm),
        safe_height_pt=mm_to_pt(trim_h - 2.0 * safe_margin_mm),
        required_px_300dpi=(mm_to_px(int_w_mm, TARGET_DPI), mm_to_px(int_h_mm, TARGET_DPI)),
    )

    # Cover spread geometry: [bleed | back | spine | front | bleed]
    cov_w_mm = round((2.0 * bleed_mm) + (2.0 * trim_w) + spine_mm, 3)
    cov_h_mm = round((2.0 * bleed_mm) + trim_h, 3)
    back_x_mm = bleed_mm
    spine_x_mm = round(bleed_mm + trim_w, 3)
    front_x_mm = round(bleed_mm + trim_w + spine_mm, 3)

    cover = CoverGeometry(
        edition=edition,
        trim_width_mm=trim_w,
        trim_height_mm=trim_h,
        bleed_mm=bleed_mm,
        spine_mm=spine_mm,
        safe_margin_mm=safe_margin_mm,
        total_width_mm=cov_w_mm,
        total_height_mm=cov_h_mm,
        total_width_pt=mm_to_pt(cov_w_mm),
        total_height_pt=mm_to_pt(cov_h_mm),
        back_x_mm=back_x_mm,
        spine_x_mm=spine_x_mm,
        front_x_mm=front_x_mm,
        back_x_pt=mm_to_pt(back_x_mm),
        spine_x_pt=mm_to_pt(spine_x_mm),
        front_x_pt=mm_to_pt(front_x_mm),
        panel_width_pt=mm_to_pt(trim_w),
        spine_width_pt=mm_to_pt(spine_mm),
        panel_height_pt=mm_to_pt(trim_h),
        required_px_300dpi=(mm_to_px(cov_w_mm, TARGET_DPI), mm_to_px(cov_h_mm, TARGET_DPI)),
    )

    return BookPrintSpec(
        edition=edition,
        trim_preset=trim_preset,
        page_count=page_count,
        paper_gsm=paper_gsm,
        target_dpi=TARGET_DPI,
        interior=interior,
        cover=cover,
    )


def audit_image_dpi(
    width_px: int,
    height_px: int,
    target_width_mm: float,
    target_height_mm: float,
) -> Dict[str, Any]:
    """Audits source image pixel dimensions against target physical mm at 300 DPI."""
    dpi_x = width_px / (target_width_mm / MM_PER_INCH)
    dpi_y = height_px / (target_height_mm / MM_PER_INCH)
    effective_dpi = round(min(dpi_x, dpi_y), 1)
    meets_300 = effective_dpi >= (TARGET_DPI - 1.0)

    warning = None
    if effective_dpi < MIN_ACCEPTABLE_DPI:
        warning = (
            f"Resolución baja ({effective_dpi} DPI efectivos; recomendado {TARGET_DPI} DPI). "
            f"Se normalizó a 300 DPI mediante remuestreo Lanczos."
        )
    elif not meets_300:
        warning = (
            f"Resolución de vista previa ({effective_dpi} DPI efectivos). "
            f"Se normalizó a {TARGET_DPI} DPI para impresión."
        )

    return {
        "source_px": [width_px, height_px],
        "effective_dpi": effective_dpi,
        "meets_300_dpi": meets_300,
        "warning": warning,
    }
