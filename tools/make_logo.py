#!/usr/bin/env python3
"""Mustafa / @kabli_ms logo: geometric K+M monogram with a rising green arrow. Outputs to assets/brand/."""
import os, cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "brand")
NAVY, BLUE, GREEN, WHITE = "#1A365D", "#3182CE", "#38A169", "#FFFFFF"

def mark(bg=True, fg=WHITE):
    sq = f'<rect width="512" height="512" rx="112" fill="{NAVY}"/>' if bg else ""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{sq}
  <g fill="none" stroke-linejoin="miter" stroke-linecap="butt">
    <path d="M128 392 V130" stroke="{fg}" stroke-width="40"/>
    <path d="M148 270 L262 392" stroke="{fg}" stroke-width="40"/>
    <path d="M148 262 L262 146" stroke="{GREEN}" stroke-width="40"/>
    <path d="M312 392 V176 L376 292 L440 176 V392" stroke="{fg}" stroke-width="40"/>
  </g>
  <polygon points="300,100 288,176 232,122" fill="{GREEN}"/>
</svg>"""

def save(svg, name, size=1024):
    open(os.path.join(OUT, name + ".svg"), "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=os.path.join(OUT, name + ".png"), output_width=size, output_height=size)

def main():
    os.makedirs(OUT, exist_ok=True)
    save(mark(True), "logo_mark_navy")               # profile picture / app icon
    save(mark(False, NAVY), "logo_mark_transparent_dark")   # for light backgrounds
    save(mark(False, WHITE), "logo_mark_transparent_white") # for dark/video backgrounds
    # horizontal lockup on navy: mark + name + tagline
    W, H = 1920, 640
    im = Image.new("RGB", (W, H), NAVY)
    m = Image.open(os.path.join(OUT, "logo_mark_transparent_white.png")).convert("RGBA").resize((420, 420))
    im.paste(m, (150, 110), m)
    d = ImageDraw.Draw(im)
    big = ImageFont.truetype(os.path.join(ROOT, "tools/fonts/Anton-Regular.ttf"), 190)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 46)
    d.text((640, 150), "KABLI_MS", font=big, fill=WHITE)
    d.rectangle([646, 392, 646 + 110, 402], fill=GREEN)
    d.text((646, 430), "E-COMMERCE  •  SPONSOR  •  META ADS", font=small, fill="#A9C4E8")
    im.save(os.path.join(OUT, "logo_horizontal_navy.png"))
    print("done:", sorted(os.listdir(OUT)))

if __name__ == "__main__":
    main()
