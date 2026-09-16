from pathlib import Path
from math import hypot

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = PROJECT_ROOT / "public" / "assets" / "icons"
SOURCE_PATH = ICONS_DIR / "Logo.png"

BRAND_BACKGROUND = (244, 248, 239, 255)
BRAND_GREEN = (46, 111, 70)


def recolor_outer_border(source: Image.Image) -> Image.Image:
    """Replace the dark circular outline while preserving the logo artwork."""
    image = source.convert("RGBA")
    pixels = image.load()
    center_x = (image.width - 1) / 2
    center_y = (image.height - 1) / 2
    outer_border_start = min(image.size) * 0.445

    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0 or hypot(x - center_x, y - center_y) < outer_border_start:
                continue

            if max(red, green, blue) < 170:
                pixels[x, y] = (*BRAND_GREEN, alpha)

    return image


def compose_icon(source: Image.Image, content_scale: float) -> Image.Image:
    canvas = Image.new("RGBA", source.size, BRAND_BACKGROUND)

    if content_scale == 1:
        artwork = source
    else:
        artwork_size = tuple(round(dimension * content_scale) for dimension in source.size)
        artwork = source.resize(artwork_size, Image.Resampling.LANCZOS)

    position = (
        (canvas.width - artwork.width) // 2,
        (canvas.height - artwork.height) // 2,
    )
    canvas.alpha_composite(artwork, position)
    return canvas


def save_icon(image: Image.Image, filename: str, size: int) -> None:
    output = image.resize((size, size), Image.Resampling.LANCZOS).convert("RGB")
    output.save(ICONS_DIR / filename, format="PNG", optimize=True)


def main() -> None:
    source = recolor_outer_border(Image.open(SOURCE_PATH))
    regular_icon = compose_icon(source, content_scale=1)
    maskable_icon = compose_icon(source, content_scale=0.84)

    save_icon(regular_icon, "zenith-icon-180-v6.png", 180)
    save_icon(regular_icon, "zenith-icon-192-v6.png", 192)
    save_icon(regular_icon, "zenith-icon-512-v6.png", 512)
    save_icon(maskable_icon, "zenith-icon-maskable-192-v6.png", 192)
    save_icon(maskable_icon, "zenith-icon-maskable-512-v6.png", 512)


if __name__ == "__main__":
    main()
