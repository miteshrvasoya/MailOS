"""
Gmail Label Color Utility

Provides:
- Gmail-compatible color palette (official predefined colors)
- Random color generation from palette
- Text color contrast calculation for readability
- Reusable functions for the label creation flow
"""

import random
import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


# ─── Gmail Official Color Palette ────────────────────────────────
# Gmail only allows specific predefined hex values for label colors.
# https://developers.google.com/gmail/api/reference/rest/v1/users.labels
# These are the officially supported background/text color pairs.

GMAIL_LABEL_COLORS = [
    # ── Berry / Red / Pink ──
    {"backgroundColor": "#ac2b37", "textColor": "#ffffff"},
    {"backgroundColor": "#cc3a21", "textColor": "#ffffff"},
    {"backgroundColor": "#e07798", "textColor": "#ffffff"},
    {"backgroundColor": "#f691b2", "textColor": "#000000"},
    {"backgroundColor": "#fb4c2f", "textColor": "#ffffff"},
    {"backgroundColor": "#fbd3e0", "textColor": "#000000"},
    # ── Orange / Yellow ──
    {"backgroundColor": "#e66100", "textColor": "#ffffff"},
    {"backgroundColor": "#ffa15c", "textColor": "#000000"},
    {"backgroundColor": "#ffad46", "textColor": "#000000"},
    {"backgroundColor": "#ffc8af", "textColor": "#000000"},
    {"backgroundColor": "#ffd6a2", "textColor": "#000000"},
    {"backgroundColor": "#fbe983", "textColor": "#000000"},
    # ── Green ──
    {"backgroundColor": "#0d3b44", "textColor": "#ffffff"},
    {"backgroundColor": "#076239", "textColor": "#ffffff"},
    {"backgroundColor": "#149e60", "textColor": "#ffffff"},
    {"backgroundColor": "#16a765", "textColor": "#ffffff"},
    {"backgroundColor": "#43d692", "textColor": "#000000"},
    {"backgroundColor": "#a2dcc1", "textColor": "#000000"},
    {"backgroundColor": "#b9e4d0", "textColor": "#000000"},
    # ── Teal / Cyan ──
    {"backgroundColor": "#0b4f30", "textColor": "#ffffff"},
    {"backgroundColor": "#04502e", "textColor": "#ffffff"},
    {"backgroundColor": "#2a9c68", "textColor": "#ffffff"},
    {"backgroundColor": "#44b984", "textColor": "#000000"},
    {"backgroundColor": "#98d7e4", "textColor": "#000000"},
    {"backgroundColor": "#a0eac9", "textColor": "#000000"},
    # ── Blue ──
    {"backgroundColor": "#094228", "textColor": "#ffffff"},
    {"backgroundColor": "#285bac", "textColor": "#ffffff"},
    {"backgroundColor": "#2da2bb", "textColor": "#ffffff"},
    {"backgroundColor": "#3dc789", "textColor": "#000000"},
    {"backgroundColor": "#4986e7", "textColor": "#ffffff"},
    {"backgroundColor": "#6d9eeb", "textColor": "#000000"},
    {"backgroundColor": "#a4c2f4", "textColor": "#000000"},
    {"backgroundColor": "#b6cff5", "textColor": "#000000"},
    {"backgroundColor": "#c9daf8", "textColor": "#000000"},
    # ── Purple / Indigo ──
    {"backgroundColor": "#653e9b", "textColor": "#ffffff"},
    {"backgroundColor": "#8e63ce", "textColor": "#ffffff"},
    {"backgroundColor": "#b694e8", "textColor": "#000000"},
    {"backgroundColor": "#b99aff", "textColor": "#000000"},
    {"backgroundColor": "#cca6ac", "textColor": "#000000"},
    {"backgroundColor": "#d0bcf1", "textColor": "#000000"},
    {"backgroundColor": "#e4d7f5", "textColor": "#000000"},
    # ── Gray / Neutral ──
    {"backgroundColor": "#434343", "textColor": "#ffffff"},
    {"backgroundColor": "#666666", "textColor": "#ffffff"},
    {"backgroundColor": "#999999", "textColor": "#ffffff"},
    {"backgroundColor": "#b3b3b3", "textColor": "#000000"},
    {"backgroundColor": "#cccccc", "textColor": "#000000"},
    {"backgroundColor": "#e3d7ff", "textColor": "#000000"},
    {"backgroundColor": "#ebdbde", "textColor": "#000000"},
    {"backgroundColor": "#efa093", "textColor": "#000000"},
    {"backgroundColor": "#efefef", "textColor": "#000000"},
    {"backgroundColor": "#f2b2a8", "textColor": "#000000"},
    {"backgroundColor": "#f7a7c0", "textColor": "#000000"},
    {"backgroundColor": "#fcdee8", "textColor": "#000000"},
]

# Subset of vibrant, visually appealing colors (skip very dark/gray/muted ones)
VIBRANT_COLORS = [c for c in GMAIL_LABEL_COLORS if c["backgroundColor"] not in {
    "#434343", "#666666", "#999999", "#b3b3b3", "#cccccc", "#efefef",
    "#0d3b44", "#0b4f30", "#04502e", "#094228",
}]

# Track recently used colors within a session to avoid consecutive repeats
_recent_colors: list[str] = []
_MAX_RECENT = 8


def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_readable_text_color(background_color: str) -> str:
    """
    Determine readable text color (#000000 or #ffffff) for a given background.
    Uses the W3C brightness formula.
    """
    try:
        r, g, b = _hex_to_rgb(background_color)
        brightness = (r * 299 + g * 587 + b * 114) / 1000
        return "#000000" if brightness > 128 else "#ffffff"
    except Exception:
        return "#000000"


def generate_random_label_color() -> Dict[str, str]:
    """
    Generate a random Gmail-compatible label color.
    Returns {"backgroundColor": "#hex", "textColor": "#hex"}.
    Avoids consecutive duplicates within a session.
    """
    global _recent_colors

    # Filter out recently used colors
    available = [c for c in VIBRANT_COLORS if c["backgroundColor"] not in _recent_colors]
    if not available:
        # Reset if all vibrant colors exhausted
        _recent_colors.clear()
        available = VIBRANT_COLORS

    chosen = random.choice(available)

    # Track recent
    _recent_colors.append(chosen["backgroundColor"])
    if len(_recent_colors) > _MAX_RECENT:
        _recent_colors.pop(0)

    return {
        "backgroundColor": chosen["backgroundColor"],
        "textColor": chosen["textColor"],
    }


def get_label_color_body() -> Optional[Dict[str, str]]:
    """
    Generate a color object suitable for Gmail API label creation/update.
    Returns None if generation fails (fallback: create label without color).
    """
    try:
        return generate_random_label_color()
    except Exception as e:
        logger.warning(f"Label color generation failed, skipping color: {e}")
        return None
