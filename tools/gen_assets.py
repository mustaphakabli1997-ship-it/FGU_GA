#!/usr/bin/env python3
"""Generate the effect assets used by edit_reel.py (no downloads needed).

  python3 tools/gen_assets.py

Creates in assets/_generated/ (git-ignored, auto-created by edit_reel.py when missing; 540x960 @30fps; alpha ones are QuickTime 'qtrle' with transparency):
  assets/_generated/sparks_orange.mov   rising orange sparks
  assets/_generated/flash_white.mov     0.3s white flash
  assets/_generated/light_leak.mov      warm orange light leak sweep
  assets/_generated/money_rain.mov      falling dollar bills
  assets/_generated/growth_chart.mp4     animated growth chart in brand colours (opaque)
Put your own files in assets/sparks, assets/broll, assets/icons (they win over generated ones) and reference them from the .srt.
"""
import math, os, random, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS, SW, SH = 30, 540, 960          # drawn at half size, upscaled by ffmpeg
random.seed(7)


def encode(frames_dir, out, alpha=True):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    vf = "scale=trunc(iw/2)*2:trunc(ih/2)*2"  # files stay 540x960; edit_reel.py scales them to 1080x1920
    if alpha:
        cmd = ["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{frames_dir}/%04d.png",
               "-vf", vf + ",format=argb", "-c:v", "qtrle", out]
    else:
        cmd = ["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{frames_dir}/%04d.png",
               "-vf", vf + ",format=yuv420p", "-c:v", "libx264", "-crf", "20", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    print("wrote", os.path.relpath(out, ROOT), f"{os.path.getsize(out)/1e6:.1f}MB")


def sparks(n_secs=1.2):
    d = tempfile.mkdtemp()
    parts = [dict(x=random.uniform(0, SW), y=random.uniform(SH * .55, SH * 1.05),
                  vx=random.uniform(-40, 40), vy=random.uniform(-520, -180),
                  r=random.uniform(2, 6), life=random.uniform(.5, 1.2), delay=random.uniform(0, .35))
             for _ in range(140)]
    for f in range(int(n_secs * FPS)):
        t = f / FPS
        im = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
        dr = ImageDraw.Draw(im)
        for p in parts:
            a = t - p["delay"]
            if a < 0 or a > p["life"]:
                continue
            x = p["x"] + p["vx"] * a
            y = p["y"] + p["vy"] * a + 120 * a * a
            k = 1 - a / p["life"]
            r = p["r"] * (0.5 + k)
            col = (255, int(120 + 100 * k), int(20 + 60 * k), int(255 * k))
            dr.line([(x, y), (x - p["vx"] * .03, y - p["vy"] * .03)], fill=col, width=max(1, int(r)))
            dr.ellipse([x - r, y - r, x + r, y + r], fill=col)
        glow = im.filter(ImageFilter.GaussianBlur(5))
        Image.alpha_composite(glow, im).save(f"{d}/{f+1:04d}.png")
    return d


def flash(n_secs=0.3):
    d = tempfile.mkdtemp()
    n = int(n_secs * FPS)
    for f in range(n):
        a = int(230 * (1 - f / n) ** 1.6)
        Image.new("RGBA", (SW, SH), (255, 255, 255, a)).save(f"{d}/{f+1:04d}.png")
    return d


def light_leak(n_secs=0.9):
    d = tempfile.mkdtemp()
    n = int(n_secs * FPS)
    for f in range(n):
        t = f / (n - 1)
        env = math.sin(math.pi * t) ** 1.5
        im = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
        dr = ImageDraw.Draw(im)
        cx = -150 + t * (SW + 300)
        dr.ellipse([cx - 260, -200, cx + 260, SH * 0.75], fill=(255, 140, 30, int(190 * env)))
        dr.ellipse([cx - 120, SH * .1, cx + 120, SH * .55], fill=(255, 220, 120, int(150 * env)))
        im.filter(ImageFilter.GaussianBlur(70)).save(f"{d}/{f+1:04d}.png")
    return d


def money_rain(n_secs=2.0):
    d = tempfile.mkdtemp()
    font = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
    base = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
    ImageDraw.Draw(base).text((0, 0), "💵", font=font, embedded_color=True)
    base = base.crop(base.getbbox())
    bills = [dict(x=random.uniform(0, SW), y0=random.uniform(-SH * .6, 0), v=random.uniform(380, 620),
                  s=random.uniform(.5, 1.0), rot=random.uniform(-40, 40), spin=random.uniform(-90, 90))
             for _ in range(22)]
    for f in range(int(n_secs * FPS)):
        t = f / FPS
        im = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
        for b in bills:
            sz = int(base.width * b["s"])
            bi = base.resize((sz, int(sz * base.height / base.width))).rotate(b["rot"] + b["spin"] * t, expand=True)
            im.alpha_composite(bi, (int(b["x"] - bi.width / 2), int(b["y0"] + b["v"] * t)) if
                               0 <= b["x"] - bi.width / 2 < SW - bi.width and 0 <= b["y0"] + b["v"] * t < SH - bi.height
                               else (SW, SH)) if False else None
            x, y = int(b["x"] - bi.width / 2), int(b["y0"] + b["v"] * t)
            if -bi.width < x < SW and -bi.height < y < SH:
                tmp = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
                tmp.paste(bi, (x, y), bi)
                im = Image.alpha_composite(im, tmp)
        im.save(f"{d}/{f+1:04d}.png")
    return d


def growth_chart(n_secs=2.6):
    d = tempfile.mkdtemp()
    navy, blue, green = (15, 23, 42), (27, 42, 74), (255, 107, 44)
    font = ImageFont.truetype(os.path.join(ROOT, "tools/fonts/Anton-Regular.ttf"), 62)
    big = ImageFont.truetype(os.path.join(ROOT, "tools/fonts/Anton-Regular.ttf"), 110)
    pts = [0.05, .12, .1, .22, .3, .28, .45, .6, .58, .8, .95]
    n = int(n_secs * FPS)
    L, R, T, B = 50, SW - 50, 330, 640
    for f in range(n):
        t = min(1, (f / (n - 1)) * 1.15)
        e = 1 - (1 - t) ** 3
        im = Image.new("RGB", (SW, SH), navy)
        dr = ImageDraw.Draw(im)
        dr.text((SW / 2, 120), "ROAS", font=font, fill=(255, 255, 255), anchor="mm")
        for g in range(5):
            y = T + g * (B - T) / 4
            dr.line([(L, y), (R, y)], fill=(60, 90, 130), width=1)
        k = e * (len(pts) - 1)
        i = int(k)
        xy = [(L + j * (R - L) / (len(pts) - 1), B - pts[j] * (B - T)) for j in range(i + 1)]
        if i < len(pts) - 1:
            fr = k - i
            x0, y0 = xy[-1]
            x1 = L + (i + 1) * (R - L) / (len(pts) - 1)
            y1 = B - pts[i + 1] * (B - T)
            xy.append((x0 + (x1 - x0) * fr, y0 + (y1 - y0) * fr))
        if len(xy) > 1:
            dr.line(xy, fill=green, width=9, joint="curve")
        ex, ey = xy[-1]
        dr.ellipse([ex - 13, ey - 13, ex + 13, ey + 13], fill=(255, 255, 255), outline=green, width=5)
        dr.text((SW / 2, 760), f"x{1 + 4.2 * e:.1f}", font=big, fill=green, anchor="mm")
        im.save(f"{d}/{f+1:04d}.png")
    return d


def main():
    jobs = [("assets/_generated/sparks_orange.mov", sparks, True), ("assets/_generated/flash_white.mov", flash, True),
            ("assets/_generated/light_leak.mov", light_leak, True), ("assets/_generated/money_rain.mov", money_rain, True),
            ("assets/_generated/growth_chart.mp4", growth_chart, False)]
    for rel, fn, alpha in jobs:
        d = fn()
        encode(d, os.path.join(ROOT, rel), alpha)
        shutil.rmtree(d, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
