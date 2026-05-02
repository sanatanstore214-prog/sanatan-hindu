import os
import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from config import IMAGE_WIDTH, IMAGE_HEIGHT, CATEGORY_COLORS
from utils.logger import get_logger

logger = get_logger("DesignAgent")

OUTPUT_PATH = "/tmp/ig_post.jpg"


class DesignAgent:
    def __init__(self):
        self._font_cache = {}

    def _get_font(self, size: int, bold: bool = False) -> ImageFont.ImageFont:
        key = (size, bold)
        if key in self._font_cache:
            return self._font_cache[key]

        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else
            "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        ]
        font = None
        for path in font_paths:
            if os.path.exists(path):
                try:
                    font = ImageFont.truetype(path, size)
                    break
                except Exception:
                    continue
        if font is None:
            font = ImageFont.load_default()

        self._font_cache[key] = font
        return font

    def _draw_gradient_bg(self, draw: ImageDraw.Draw, bg_color: tuple, accent: tuple):
        """Draw dark gradient background with subtle radial glow."""
        for y in range(IMAGE_HEIGHT):
            ratio = y / IMAGE_HEIGHT
            r = int(bg_color[0] + (accent[0] - bg_color[0]) * ratio * 0.08)
            g = int(bg_color[1] + (accent[1] - bg_color[1]) * ratio * 0.08)
            b = int(bg_color[2] + (accent[2] - bg_color[2]) * ratio * 0.08)
            draw.line([(0, y), (IMAGE_WIDTH, y)], fill=(r, g, b))

    def _draw_decorative_lines(self, draw: ImageDraw.Draw, accent: tuple):
        """Add geometric accent lines for professional look."""
        # Top bar
        draw.rectangle([(0, 0), (IMAGE_WIDTH, 8)], fill=accent)
        # Bottom bar
        draw.rectangle([(0, IMAGE_HEIGHT - 8), (IMAGE_WIDTH, IMAGE_HEIGHT)], fill=accent)
        # Left accent bar
        draw.rectangle([(0, 0), (6, IMAGE_HEIGHT)], fill=(*accent, 180))
        # Right accent bar
        draw.rectangle([(IMAGE_WIDTH - 6, 0), (IMAGE_WIDTH, IMAGE_HEIGHT)], fill=(*accent, 180))
        # Diagonal accent line (top-left to middle)
        draw.line([(0, 200), (200, 0)], fill=(*accent, 60), width=2)
        draw.line([(IMAGE_WIDTH, 200), (IMAGE_WIDTH - 200, 0)], fill=(*accent, 60), width=2)

    def _draw_tag(self, draw: ImageDraw.Draw, text: str, x: int, y: int, accent: tuple):
        """Draw a pill-shaped label/tag."""
        font = self._get_font(28)
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0] + 40
        h = bbox[3] - bbox[1] + 20
        draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=accent)
        draw.text((x + 20, y + 10), text, font=font, fill=(255, 255, 255))
        return w

    def _wrap_text(self, text: str, max_chars: int) -> list:
        return textwrap.wrap(text, width=max_chars)

    def create_ad_image(self, product: dict, content: dict) -> str:
        """Create professional 1080x1080 ad image. Returns saved file path."""
        logger.info(f"Ad image bana raha hoon: {product.get('product_name')}")

        category = product.get("category", "default")
        theme = CATEGORY_COLORS.get(category, CATEGORY_COLORS["default"])
        bg = theme["bg"]
        accent = theme["accent"]
        text_color = theme["text"]

        img = Image.new("RGB", (IMAGE_WIDTH, IMAGE_HEIGHT), color=bg)
        draw = ImageDraw.Draw(img, "RGBA")

        # Background gradient
        self._draw_gradient_bg(draw, bg, accent)

        # Decorative borders
        self._draw_decorative_lines(draw, accent)

        # --- Top section: TRENDING tag + brand ---
        y_cursor = 60
        tag_w = self._draw_tag(draw, "🔥 TRENDING TODAY", 60, y_cursor, accent)
        y_cursor += 80

        # Brand name (small)
        brand = product.get("brand", "").upper()
        if brand:
            font_brand = self._get_font(32)
            draw.text((60, y_cursor), brand, font=font_brand, fill=(*accent, 200))
            y_cursor += 50

        # --- Main product name (large, wrapped) ---
        product_name = product.get("product_name", "Health Product")
        font_title = self._get_font(72, bold=True)
        lines = self._wrap_text(product_name, 16)
        for line in lines[:3]:
            draw.text((60, y_cursor), line, font=font_title, fill=text_color)
            y_cursor += 85
        y_cursor += 20

        # --- Divider line ---
        draw.line([(60, y_cursor), (IMAGE_WIDTH - 60, y_cursor)], fill=(*accent, 150), width=3)
        y_cursor += 30

        # --- Benefits (3 bullet points) ---
        benefits = product.get("key_benefits", [])[:3]
        font_benefit = self._get_font(38)
        for benefit in benefits:
            draw.text((60, y_cursor), f"✓  {benefit}", font=font_benefit, fill=text_color)
            y_cursor += 55
        y_cursor += 20

        # --- Price badge ---
        price = product.get("price_range", "")
        if price:
            font_price = self._get_font(44, bold=True)
            price_text = f"💰 {price}"
            draw.text((60, y_cursor), price_text, font=font_price, fill=accent)
            y_cursor += 70

        # --- Why trending ---
        why = product.get("why_trending", "")
        if why and y_cursor < IMAGE_HEIGHT - 200:
            font_why = self._get_font(32)
            why_lines = self._wrap_text(why, 40)
            for line in why_lines[:2]:
                draw.text((60, y_cursor), line, font=font_why, fill=(*text_color, 180))
                y_cursor += 42

        # --- CTA button at bottom ---
        cta_y = IMAGE_HEIGHT - 140
        cta_text = "LINK BIO MEIN HAI 👇"
        font_cta = self._get_font(46, bold=True)
        cta_bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
        cta_w = cta_bbox[2] - cta_bbox[0]
        cta_x = (IMAGE_WIDTH - cta_w - 80) // 2
        draw.rounded_rectangle(
            [cta_x, cta_y, cta_x + cta_w + 80, cta_y + 70],
            radius=35,
            fill=accent,
        )
        draw.text((cta_x + 40, cta_y + 12), cta_text, font=font_cta, fill=(10, 10, 10))

        # --- Watermark ---
        font_wm = self._get_font(26)
        draw.text((IMAGE_WIDTH - 300, IMAGE_HEIGHT - 40), "@health_fitness_store", font=font_wm, fill=(*text_color, 100))

        img.save(OUTPUT_PATH, "JPEG", quality=95)
        logger.info(f"Image saved: {OUTPUT_PATH}")
        return OUTPUT_PATH
