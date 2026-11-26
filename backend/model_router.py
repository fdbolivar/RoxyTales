"""
Model Router for RoxyTales Engine (Option C: Scalable Cost-Optimized Adapter).
Encapsulates model selection, target resolutions, and model configuration parameters
so scaling from prototype to production requires only environment variable changes.
"""

from typing import Tuple
from backend.config import (
    ROXY_PREVIEW_MODEL,
    ROXY_FINAL_MODEL,
    PREVIEW_RESOLUTION,
    FINAL_RESOLUTION
)


class ModelRouter:
    """Routes requests to the appropriate generative model based on tier and configuration."""

    @staticmethod
    def get_tier_config(tier: str = "preview") -> Tuple[str, str, int]:
        """
        Returns (model_name, resolution_label, dimension_px).
        tier: 'preview' (fast 1K prototype) or 'final' (production 2K/4K)
        """
        if tier == "final":
            dimension = 2048 if FINAL_RESOLUTION == "2K" else (4096 if FINAL_RESOLUTION == "4K" else 1024)
            return ROXY_FINAL_MODEL, FINAL_RESOLUTION, dimension
        else:
            dimension = 1024 if PREVIEW_RESOLUTION == "1K" else 1024
            return ROXY_PREVIEW_MODEL, PREVIEW_RESOLUTION, dimension

    @staticmethod
    def get_aspect_ratio() -> str:
        """Returns the square 1:1 format required for 8x8" physical keepsake books."""
        return "1:1"
