#!/usr/bin/env python3
"""Mustafa reel editor: silence cut -> 1080x1920 -> light grade -> subtitles -> brand end card.

Usage:
  python3 tools/edit_reel.py videos/reel2.mov [--srt subs.srt] [--no-silence-cut] [--no-endcard]
Output: videos/<name>_v1.mp4  (use --out to change)

Subtitles come from an .srt written from Mustafa's script (timings relative to the ORIGINAL
video unless --srt-after-cut is passed). Brand colors / contacts live in BRAND below.
"""
import argparse, os, re, subprocess, sys, tempfile

BRAND = dict(navy="0F172A", blue="1B2A4A", green="FF6B2C",  # palette B: navy + signal orange (key "green" = accent colour)
             whatsapp="0550 20 54 64", handle="@kabli_ms",
             cta="راسلني على واتساب")
FONT = "Anton"  # bold condensed caption font (OFL), in tools/fonts; Arabic falls back to DejaVu Sans
FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
ACCENT = BRAND["green"]
TEXT_COLOR = "FFFFFF"  # words wrapped as *word* in the .srt get this colour
W, H, ENDCARD_SECS = 1080, 1920, 3.0
# warm golden/orange look + soft vignette (style reference: nazih_motivation reels)
GRADES = {
    "warm": "eq=contrast=1.12:saturation=1.2:brightness=-0.02,colorbalance=rs=0.05:gs=0.01:bs=-0.07:rm=0.06:bm=-0.05:rh=0.04:bh=-0.04,vignette=PI/5",
    "none": "null",   # keep his original colours/filter untouched
    "natural": "eq=contrast=1.06:saturation=1.1",
    # skin-friendly: light denoise, highlights rolled off (bright sunroof light on the face), less red in skin, soft vignette
    "pro": "hqdn3d=2:1:3:3,curves=master='0/0 0.25/0.22 0.6/0.6 0.85/0.81 1/0.94',colorbalance=rm=-0.04:bm=0.02:rh=-0.05:bh=0.03,eq=contrast=1.1:saturation=1.08,vignette=PI/6",
    "cinema": "eq=contrast=1.15:saturation=1.05:brightness=-0.03,colorbalance=rs=-0.06:gs=0.0:bs=0.07:rh=0.07:gh=0.01:bh=-0.06,vignette=PI/4.5",   # teal shadows / orange highlights
    "bright": "eq=contrast=1.04:saturation=1.25:brightness=0.04,colorbalance=rm=0.02:bm=-0.02",   # clean, fresh, social look
}


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, text=True, **kw)


def probe_duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "csv=p=0", path], capture_output=True).stdout
    return float(out.strip())


def keep_segments(path, noise="-32dB", min_sil=0.35, pad=0.08):
    dur = probe_duration(path)
    err = subprocess.run(["ffmpeg", "-i", path, "-af",
                          f"silencedetect=n={noise}:d={min_sil}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    segs, cur = [], 0.0
    for i, s in enumerate(starts):
        if s - cur > 0.15:
            segs.append((max(0, cur - pad), min(dur, s + pad)))
        cur = ends[i] if i < len(ends) else dur
    if dur - cur > 0.15:
        segs.append((max(0, cur - pad), dur))
    return segs or [(0, dur)], dur


TAG_RE = re.compile(r"\[(sparks|flash|leak|money|broll|icon|shake|ding|circle|arrow|notif)(?::([^\]]+))?\]", re.I)
EMOJI_RE = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27bf]")


def srt_to_events(srt_text, offset_map=None):
    ev = []
    for blk in re.split(r"\n\s*\n", srt_text.strip()):
        lines = blk.strip().splitlines()
        m = next((re.match(r"(\d+):(\d+):(\d+)[,.](\d+) --> (\d+):(\d+):(\d+)[,.](\d+)", l)
                  for l in lines if "-->" in l), None)
        if not m:
            continue
        g = list(map(int, m.groups()))
        a = g[0]*3600 + g[1]*60 + g[2] + g[3]/1000
        b = g[4]*3600 + g[5]*60 + g[6] + g[7]/1000
        text = " ".join(l for l in lines if "-->" not in l and not l.strip().isdigit())
        tags = [(m.group(1).lower(), (m.group(2) or "").strip()) for m in TAG_RE.finditer(text)]
        text = TAG_RE.sub("", text)
        emojis = EMOJI_RE.findall(text)  # libass can't draw colour emoji: strip from text, overlay as PNG instead
        text = re.sub(r"\s+", " ", EMOJI_RE.sub("", text).replace("\ufe0f", "")).strip()
        ev.append((a, b, text, emojis, tags))
    return ev


def remap(t, segs):
    """Map original timeline -> cut timeline."""
    acc = 0.0
    for a, b in segs:
        if t <= b:
            return acc + max(0, t - a)
        acc += b - a
    return acc


def ass_ts(t):
    h, m, s = int(t//3600), int(t % 3600//60), t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def bgr(hexrgb):  # ASS colour is BGR
    return f"&H00{hexrgb[4:6]}{hexrgb[2:4]}{hexrgb[0:2]}"


POP = r"{\\fscx85\\fscy85\\t(0,110,\\fscx100\\fscy100)}"


def style_text(t):
    """UPPERCASE Latin, pop-in animation, *word* -> accent colour. Arabic gets a font with Arabic glyphs."""
    arabic = bool(re.search(r"[\u0600-\u06ff]", t))
    base = r"{\fnDejaVu Sans\b1\fs104\fsp0\c&H00FFFFFF&\fscx100\fscy100}" if arabic else r"{\r}"
    t = t if arabic else (t.upper() if re.search(r"[A-Za-z]", t) else t)
    t = re.sub(r"\*([^*]+)\*", lambda m: f"{{\\c{bgr(ACCENT)}&}}{m.group(1)}{base}", t)
    return POP + (base if arabic else "") + t


def build_ass(events, total, with_endcard, tagline=""):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Sub,{FONT},128,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,2,0,1,5,3,2,80,200,700,1
Style: CardBig,{FONT},70,{bgr(BRAND['green'])},&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1
Style: CardSmall,{FONT},64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    lines = [f"Dialogue: 0,{ass_ts(a)},{ass_ts(b)},Sub,,0,0,0,,{style_text(t)}" for a, b, t, *_ in events if t and not ARABIC_RE.search(t)]
    if with_endcard:
        s, e = ass_ts(total), ass_ts(total + ENDCARD_SECS)
        lines += [
            f"Dialogue: 0,{s},{e},CardSmall,,0,0,0,,{{\\pos({W//2},{H//2-260})}}{BRAND['cta']}",
            f"Dialogue: 0,{s},{e},CardBig,,0,0,0,,{{\\pos({W//2},{H//2-60})}}WhatsApp: {BRAND['whatsapp']}",
            f"Dialogue: 0,{s},{e},CardSmall,,0,0,0,,{{\\pos({W//2},{H//2+140})}}Instagram: {BRAND['handle']}",
        ]
        if tagline:
            lines.append(f"Dialogue: 0,{s},{e},CardBig,,0,0,0,,{{\\pos({W//2},{H//2-480})\\fs80\\c&H00FFFFFF&}}{tagline}")
    return head + "\n".join(lines) + "\n"


ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
ALIASES = {"sparks": "sparks_orange", "flash": "flash_white", "leak": "light_leak", "money": "money_rain"}


def find_asset(kind, name):
    """User files (assets/sparks|broll|icons) win over generated ones (assets/_generated)."""
    name = ALIASES.get(name, name) if kind != "icon" else name
    dirs = [os.path.join(ASSETS, d) for d in ("sparks", "broll", "icons", "_generated")]
    for attempt in (0, 1):
        for d in dirs:
            if os.path.isdir(d):
                for f in sorted(os.listdir(d)):
                    if os.path.splitext(f)[0] == name:
                        return os.path.join(d, f)
        if attempt == 0:
            tools_dir = os.path.dirname(os.path.abspath(__file__))
            run([sys.executable, os.path.join(tools_dir, "broll3d.py" if name.endswith("3d") else "gen_assets.py")])
    sys.exit(f"asset '{name}' not found in assets/ (tag [{kind}:{name}])")


def make_sfx(tmp):
    """Tiny synthetic sound effects (no downloads): whoosh (filtered noise sweep) and pop."""
    out = {}
    specs = {
        "whoosh": ["-f", "lavfi", "-i", "anoisesrc=d=0.35:c=pink:a=0.8",
                   "-af", "highpass=f=400,lowpass=f=3500,afade=t=in:d=0.12,afade=t=out:st=0.15:d=0.2,volume=0.9"],
        "pop": ["-f", "lavfi", "-i", "sine=f=900:d=0.12",
                "-af", "afade=t=out:st=0.02:d=0.1,volume=0.8"],
        "click": ["-f", "lavfi", "-i", "anoisesrc=d=0.04:c=white:a=0.6",
                  "-af", "highpass=f=2500,afade=t=out:st=0.005:d=0.035,volume=0.7"],
        "ding": ["-f", "lavfi", "-i", "sine=f=1318:d=0.6", "-f", "lavfi", "-i", "sine=f=1975:d=0.6",
                 "-filter_complex", "[0][1]amix=inputs=2,afade=t=out:st=0.01:d=0.58,volume=0.9"],
        "boom": ["-f", "lavfi", "-i", "sine=f=55:d=0.7",
                 "-af", "vibrato=f=6:d=0.3,afade=t=out:st=0.05:d=0.65,volume=1.6"],
    }
    for name, args in specs.items():
        path = os.path.join(tmp, name + ".wav")
        run(["ffmpeg", "-v", "error", "-y", *args, "-ar", "48000", "-ac", "2", path])
        out[name] = path
    return out


ARABIC_RE = re.compile(r"[\u0600-\u06ff]")


def render_caption_png(text, path, font_file, size=106, maxw=860):
    """Arabic caption as an image (Pillow+raqm shapes Arabic correctly with any font). *word* = accent colour."""
    from PIL import Image, ImageDraw, ImageFont
    f = ImageFont.truetype(os.path.join(FONTS_DIR, font_file), size)
    words = [(w.strip("*"), w.startswith("*") or w.endswith("*")) for w in re.sub(r"\*([^*]+)\*", lambda m: "*" + m.group(1).replace(" ", "*\u00a0*") + "*", text).split()]
    words = [(w.replace("*", "").replace("\u00a0", " "), acc) for w, acc in words]
    tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    space = tmp.textlength(" ", font=f)
    lines, cur, curw = [], [], 0
    for w, acc in words:
        ww = tmp.textlength(w, font=f)
        if cur and curw + space + ww > maxw:
            lines.append((cur, curw)); cur, curw = [], 0
        cur.append((w, acc, ww)); curw += (space if len(cur) > 1 else 0) + ww
    if cur: lines.append((cur, curw))
    lh = int(size * 1.35)
    W2, H2 = maxw + 80, lh * len(lines) + 40
    im = Image.new("RGBA", (W2, H2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    accent = "#" + ACCENT
    for li, (ws, lw) in enumerate(lines):
        x = W2 / 2 + lw / 2          # right edge: Arabic reads right -> left
        y = 20 + li * lh + lh / 2
        for w, acc, ww in ws:
            d.text((x, y), w, font=f, fill=accent if acc else "#" + TEXT_COLOR, anchor="rm",
                   stroke_width=max(4, size // 16), stroke_fill="#000000",
                   direction="rtl" if ARABIC_RE.search(w) else "ltr")
            x -= ww + space
    im.save(path)
    return W2, H2


def render_hook_png(text, path, font_file):
    """Hook card: huge text, accent words orange, on a rounded navy plate."""
    from PIL import Image, ImageDraw
    cap = os.path.join(os.path.dirname(path), "hook_txt.png")
    if ARABIC_RE.search(text):
        cw, ch = render_caption_png(text, cap, font_file, size=104, maxw=800)
    else:
        from PIL import ImageFont
        f = ImageFont.truetype(os.path.join(FONTS_DIR, "Anton-Regular.ttf"), 150)
        parts = re.split(r"(\*[^*]+\*)", text.upper())
        d0 = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
        tw = sum(d0.textlength(p.strip("*"), font=f) for p in parts)
        cw, ch = int(tw) + 80, 230
        im0 = Image.new("RGBA", (cw, ch), (0, 0, 0, 0)); d = ImageDraw.Draw(im0); x = 40
        for p in parts:
            acc = p.startswith("*"); p = p.strip("*")
            d.text((x, ch / 2), p, font=f, fill="#" + ACCENT if acc else "#FFFFFF", anchor="lm", stroke_width=6, stroke_fill="#000000")
            x += d.textlength(p, font=f)
        im0.save(cap)
    txt = Image.open(cap)
    pad = 14
    im = Image.new("RGBA", (txt.width + pad * 2, txt.height + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=48, fill=(15, 23, 42, 215), outline=(255, 107, 44, 255), width=6)
    im.alpha_composite(txt, (pad, pad))
    im.save(path)
    return im.size


def unmap(t, segs):
    """Cut timeline -> source timeline."""
    acc = 0.0
    for a, b in segs:
        if t <= acc + (b - a):
            return a + (t - acc)
        acc += b - a
    return segs[-1][1]


def find_face(src, t_src):
    """Face centre and radius (in the 1080x1920 output frame) at source time t_src, or None. Needs opencv."""
    try:
        import cv2
        cv2.CascadeClassifier
    except (ImportError, AttributeError):   # pip install "opencv-python-headless<5"
        return None
    png = tempfile.mktemp(suffix=".png")
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t_src:.2f}", "-i", src, "-frames:v", "1", "-vf",
         f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}", png])
    img = cv2.imread(png, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = casc.detectMultiScale(img, 1.1, 6, minSize=(160, 160))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return int(x + w / 2), int(y + h / 2), int(max(w, h) * 0.75)


def caption_y(a, segs, ea, chh, tags):
    """Top y of a caption image: just BELOW his face if there is room, else just ABOVE it, never on the face.
    Face found with opencv at the cue's start; b-roll cues (face hidden) and no-face frames use the default spot."""
    cards = a.layout == "cards"
    default = int(H * (0.52 if cards else 0.60)) - chh // 2
    if any(kd == "broll" for kd, _ in tags):
        return default
    face = find_face(a.src, unmap(ea + 0.1, segs))
    if not face:
        return default
    fx, fy, fr = face
    if cards:   # content is shrunk into the card: map face coords to the final frame
        sc = CARD_W / W
        fy, fr = CARD_Y + fy * sc, fr * sc
        top_lim, bot_lim = CARD_Y + 30, CARD_Y + CARD_H - 520 - 20   # stay above the small face card
    else:
        top_lim, bot_lim = int(H * 0.12), int(H * 0.80)              # IG top bar / bottom caption area
    gap = 25
    below = int(fy + fr + gap)
    if below + chh <= bot_lim:
        return below
    above = int(fy - fr - gap - chh)
    if above >= top_lim:
        return above
    return max(top_lim, min(default, bot_lim - chh))


def render_circle_mov(path, r=230, n=14):
    """Hand-drawn style ring that draws itself in ~0.45 s (alpha .mov)."""
    from PIL import Image, ImageDraw
    d = os.path.join(os.path.dirname(path), "circ_frames"); os.makedirs(d, exist_ok=True)
    S = 2 * r + 40
    for i in range(n):
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
        end = -100 + 380 * min(1, (i + 1) / (n - 3))
        dr.arc([20, 20, S - 20, S - 20], start=-100, end=end, fill="#000000", width=20)
        dr.arc([20, 20, S - 20, S - 20], start=-100, end=end, fill="#FF2D2D", width=13)
        im.save(f"{d}/{i:03d}.png")
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", f"{d}/%03d.png", "-c:v", "qtrle", "-pix_fmt", "argb", path])
    return S


def render_arrow_png(path):
    """Thick red arrow pointing up-left (its tip is the image's top-left corner)."""
    from PIL import Image, ImageDraw
    im = Image.new("RGBA", (260, 260), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = [(8, 8), (120, 30), (88, 62), (240, 214), (214, 240), (62, 88), (30, 120)]
    d.polygon(pts, fill="#FF2D2D", outline="#000000", width=6)
    im.save(path)


def render_notif_png(text, path):
    """WhatsApp-like push notification banner."""
    from PIL import Image, ImageDraw, ImageFont
    w, h = 900, 170
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=40, fill=(245, 245, 247, 245))
    d.rounded_rectangle([28, 35, 128, 135], radius=24, fill=(37, 211, 102))
    d.ellipse([52, 59, 104, 111], outline=(255, 255, 255), width=7)
    fl = ImageFont.truetype(os.path.join(FONTS_DIR, "Montserrat-Bold.ttf"), 30)
    try: fl.set_variation_by_name("Bold")
    except Exception: pass
    d.text((150, 52), "WhatsApp", font=fl, fill=(60, 60, 67), anchor="lm")
    d.text((w - 30, 52), "now", font=fl, fill=(140, 140, 150), anchor="rm")
    fa = ImageFont.truetype(os.path.join(FONTS_DIR, "Lalezar-Regular.ttf"), 44)
    d.text((w - 30, 115), text, font=fa, fill=(20, 20, 25), anchor="rm", direction="rtl" if ARABIC_RE.search(text) else None)
    im.save(path)


CARD_W, CARD_H, CARD_Y = 800, 1422, 250


def render_card_assets(tmp):
    """Light grid paper with soft window-light shadows, card mask, card shadow, pip mask."""
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    bg = Image.new("RGB", (W, H), (240, 240, 236))
    d = ImageDraw.Draw(bg)
    for x in range(0, W, 72):
        d.line([(x, 0), (x, H)], fill=(222, 222, 218), width=2)
    for y in range(0, H, 72):
        d.line([(0, y), (W, y)], fill=(222, 222, 218), width=2)
    sh = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(sh)
    for i in range(4):   # window frame bars falling diagonally
        x0 = -300 + i * 330
        sd.polygon([(x0, 0), (x0 + 60, 0), (x0 + 760, H), (x0 + 700, H)], fill=120)
    sd.polygon([(-200, 520), (W + 200, 260), (W + 200, 320), (-200, 580)], fill=120)
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    bg = Image.composite(Image.new("RGB", (W, H), (150, 150, 146)), bg, sh.point(lambda v: int(v * 0.85)))
    d = ImageDraw.Draw(bg)
    fa = ImageFont.truetype(os.path.join(FONTS_DIR, "Anton-Regular.ttf"), 420)
    d.text((40, H - 40), "#", font=fa, fill=(25, 25, 25), anchor="ls")
    for i in range(42):    # barcode decoration
        if (i * 7) % 5 < 3:
            d.rectangle([W - 300 + i * 6, H - 150, W - 300 + i * 6 + (2 if i % 3 else 4), H - 70], fill=(30, 30, 30))
    bgp = os.path.join(tmp, "cards_bg.png"); bg.save(bgp)

    def rounded(w, h, r, path):
        m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255); m.save(path)
    mask = os.path.join(tmp, "card_mask.png"); rounded(CARD_W, CARD_H, 46, mask)
    pipm = os.path.join(tmp, "pip_mask.png"); rounded(360, 480, 34, pipm)
    pb = Image.new("RGBA", (384, 504), (0, 0, 0, 0))
    ImageDraw.Draw(pb).rounded_rectangle([0, 0, 383, 503], radius=44, fill=(255, 255, 255, 255))
    pbs = Image.new("RGBA", (444, 564), (0, 0, 0, 0)); ImageDraw.Draw(pbs).rounded_rectangle([30, 40, 414, 544], radius=44, fill=(0, 0, 0, 110))
    pbs = pbs.filter(ImageFilter.GaussianBlur(16)); pbs.alpha_composite(pb, (30, 30))
    pbs.save(os.path.join(tmp, "pip_border.png"))
    shp = Image.new("RGBA", (CARD_W + 160, CARD_H + 160), (0, 0, 0, 0))
    ImageDraw.Draw(shp).rounded_rectangle([80, 95, CARD_W + 80, CARD_H + 95], radius=46, fill=(0, 0, 0, 120))
    shp = shp.filter(ImageFilter.GaussianBlur(30)); shadow = os.path.join(tmp, "card_shadow.png"); shp.save(shadow)
    return bgp, mask, pipm, shadow


ICON_COLORS = {"🔥": ((255, 140, 40), (230, 60, 20)), "🚨": ((255, 90, 90), (200, 20, 40)),
               "💸": ((90, 220, 140), (20, 150, 80)), "💰": ((255, 210, 80), (220, 150, 20)),
               "✅": ((90, 220, 140), (20, 150, 80)), "❌": ((250, 250, 252), (185, 190, 205)),
               "🤝": ((255, 210, 80), (220, 150, 20)), "👇": ((120, 170, 255), (40, 90, 220))}


def render_icon3d_mov(ch, path, secs=2.0, size=200):
    """Modern 3D icon: glossy badge with thickness, specular highlight, soft shadow; the emoji sits on it.
    Pops in with overshoot, then floats and wobbles in 3D (Y-rotation squash). Alpha .mov (qtrle)."""
    from PIL import Image, ImageDraw, ImageFilter
    import math
    top, bot = ICON_COLORS.get(ch, ((255, 140, 80), (255, 107, 44)))
    S = int(size * 1.6)
    # static parts drawn once at 2x for smooth edges
    R = size // 2
    base = Image.new("RGBA", (S * 2, S * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(base)
    cx, cy, r = S, S - 12, R * 2
    for i in range(22, 0, -1):          # thickness (extrusion) below the face
        k = 0.55 + 0.02 * (22 - i)
        d.ellipse([cx - r, cy - r + i * 2, cx + r, cy + r + i * 2], fill=tuple(int(c * k) for c in bot) + (255,))
    face = Image.new("RGBA", base.size, (0, 0, 0, 0)); fd = ImageDraw.Draw(face)
    for i in range(r, 0, -2):           # radial gradient face
        t = i / r
        col = tuple(int(top[j] * (1 - t * 0.55) + bot[j] * t * 0.55) for j in range(3))
        fd.ellipse([cx - i, cy - i, cx + i, cy + i], fill=col + (255,))
    base.alpha_composite(face)
    hl = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse([cx - r * 0.62, cy - r * 0.86, cx + r * 0.62, cy - r * 0.18], fill=(255, 255, 255, 120))
    base.alpha_composite(hl.filter(ImageFilter.GaussianBlur(10)))
    rim = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(rim).ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 150), width=6)
    base.alpha_composite(rim)
    em = Image.open(path.replace(".mov", "_flat.png")).convert("RGBA")
    em = em.resize((int(r * 1.1), int(r * 1.1 * em.height / em.width)), Image.LANCZOS)
    esh = Image.new("RGBA", base.size, (0, 0, 0, 0))
    esh.paste((0, 0, 0, 110), (cx - em.width // 2 + 6, cy - em.height // 2 + 12), em)
    base.alpha_composite(esh.filter(ImageFilter.GaussianBlur(6)))
    base.alpha_composite(em, (cx - em.width // 2, cy - em.height // 2))
    badge = base.resize((S, S), Image.LANCZOS)
    d = os.path.join(os.path.dirname(path), os.path.basename(path) + "_f"); os.makedirs(d, exist_ok=True)
    n = int(secs * 30)
    for f in range(n):
        t = f / 30
        pop = 1 + 2.70158 * (min(t / 0.35, 1) - 1) ** 3 + 1.70158 * (min(t / 0.35, 1) - 1) ** 2   # back-out
        ang = 0.35 * math.sin(t * 3.2) * min(1, t / 0.35)
        sx, sy = max(0.05, pop * (0.82 + 0.18 * math.cos(ang))), max(0.05, pop)
        bob = 10 * math.sin(t * 4)
        fr = Image.new("RGBA", (S, S + 40), (0, 0, 0, 0))
        shd = Image.new("RGBA", fr.size, (0, 0, 0, 0))
        w2 = int(S * 0.5 * sx)
        ImageDraw.Draw(shd).ellipse([S // 2 - w2 // 2, S - 18, S // 2 + w2 // 2, S + 6], fill=(0, 0, 0, int(90 * min(1, pop))))
        fr.alpha_composite(shd.filter(ImageFilter.GaussianBlur(8)))
        b = badge.resize((max(1, int(S * sx)), max(1, int(S * sy))), Image.LANCZOS)
        fr.alpha_composite(b, ((S - b.width) // 2, int((S - b.height) / 2 - 20 + bob)))
        fr.save(f"{d}/{f:03d}.png")
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", f"{d}/%03d.png", "-c:v", "qtrle", "-pix_fmt", "argb", path])
    return S, S + 40


def render_emoji(ch, path, size=230):
    from PIL import Image, ImageDraw, ImageFont
    f = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
    im = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox())
    im = im.resize((size, int(size * im.height / im.width)), Image.LANCZOS)
    im.save(path)


BEATS = []
HOOK = False


def zoom_expr(events, segs, total, k=0.45):
    """Alternating punch zoom-OUT (1.14 -> 1.0) and slow push-IN (1.0 -> 1.10), restarted at each caption / cut."""
    pts = sorted({round(a, 2) for a, *_ in events if a < total}
                 | {round(sum(b - x for x, b in segs[:i]), 2) for i in range(1, len(segs))})
    if not pts:
        pts = [round(i * 3.0, 2) for i in range(int(total // 3) + 1)]
    if BEATS:  # snap each punch to the nearest music beat when it is close (beat sync)
        pts = sorted({min(BEATS, key=lambda b: abs(b - p)) if min(abs(b - p) for b in BEATS) < 0.15 else p for p in pts})
    if pts[0] > 0.05:
        pts.insert(0, 0.0)
    terms = []
    for i, t0 in enumerate(pts):
        t1 = pts[i + 1] if i + 1 < len(pts) else total
        if i % 2 == 0:   # punch out (the very first one is strong: hook)
            kk = max(k, 1.3) if i == 0 and HOOK else k
            terms.append(f"between(t\\,{t0}\\,{t1})*(1+{0.14*kk:.3f}*max(0\\,1-(t-{t0})/0.6))")
        else:            # push in
            terms.append(f"between(t\\,{t0}\\,{t1})*(1+{0.10*k:.3f}*min(1\\,(t-{t0})/{max(t1 - t0, 0.3):.2f}))")
    return "(" + "+".join(terms) + ")"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--srt")
    ap.add_argument("--srt-after-cut", action="store_true")
    ap.add_argument("--no-silence-cut", action="store_true")
    ap.add_argument("--no-endcard", action="store_true")
    ap.add_argument("--no-zoom", action="store_true")
    ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--layout", choices=["full", "cards"], default="cards", help="cards = After-Effects style: video in a rounded card on a light grid background with window shadows + a small face card")
    ap.add_argument("--keywords-only", action="store_true", help="show only the *starred* key words, big, instead of full sentences")
    ap.add_argument("--accent", default="", help="hex colour for key words, e.g. FFD60A (yellow); default = brand orange")
    ap.add_argument("--text-color", default="FFFFFF", help="hex colour for the other words")
    ap.add_argument("--hook", default="", help="big hook text shown 0-2.6s (top safe zone) with flash + impact sound; *word* = accent")
    ap.add_argument("--music", default="", help="'beat' = generated royalty-free beat, or a path to your own audio file")
    ap.add_argument("--bpm", type=float, default=100)
    ap.add_argument("--zoom-mode", choices=["intro", "all"], default="intro", help="intro = ONE zoom-out at the start only (Mustafa's choice); all = a zoom on every caption")
    ap.add_argument("--zoom", type=float, default=0.45, help="zoom strength: 1 = strong punch, 0.45 = soft (default), 0 = none")
    ap.add_argument("--ar-font", default="Lalezar-Regular.ttf", help="Arabic caption font file in tools/fonts (drawn as images, any font works)")
    ap.add_argument("--no-bar", action="store_true")
    ap.add_argument("--tagline", default="")
    ap.add_argument("--no-emoji", action="store_true")
    ap.add_argument("--grade", choices=["warm", "natural", "cinema", "bright", "pro", "none"], default="pro")
    ap.add_argument("--out")
    a = ap.parse_args()

    out = a.out or re.sub(r"\.[^.]+$", "", a.src) + "_v1.mp4"
    segs, dur = ([(0, probe_duration(a.src))], None) if a.no_silence_cut else keep_segments(a.src)
    total = sum(b - x for x, b in segs)

    events = []
    if a.srt:
        raw = srt_to_events(open(a.srt, encoding="utf-8").read())
        events = raw if a.srt_after_cut or a.no_silence_cut else [
            (remap(s, segs), remap(e, segs), t, em, tg) for s, e, t, em, tg in raw]
    global ACCENT, TEXT_COLOR
    if a.accent:
        ACCENT = a.accent.lstrip("#").upper()
    TEXT_COLOR = a.text_color.lstrip("#").upper()
    if a.keywords_only:   # keep only the *key words* of each cue (cue with none -> no caption)
        events = [(ea, eb, " ".join(f"*{m}*" for m in re.findall(r"\*([^*]+)\*", t)), em, tg) for ea, eb, t, em, tg in events]
    tmp = tempfile.mkdtemp()
    ass = os.path.join(tmp, "s.ass")
    ass_events = [(ea, eb, "", em, tg) for ea, eb, t, em, tg in events] if a.keywords_only else events  # keywords: all drawn as images
    open(ass, "w", encoding="utf-8").write(build_ass(ass_events, total, not a.no_endcard, a.tagline))

    n = len(segs)
    parts = []
    for i, (x, y) in enumerate(segs):
        parts.append(f"[0:v]trim={x:.3f}:{y:.3f},setpts=PTS-STARTPTS[v{i}];"
                     f"[0:a]atrim={x:.3f}:{y:.3f},asetpts=PTS-STARTPTS[a{i}]")
    cat = "".join(f"[v{i}][a{i}]" for i in range(n))
    fc = ";".join(parts) + f";{cat}concat=n={n}:v=1:a=1[vc][ac];"
    global BEATS, HOOK
    HOOK = bool(a.hook)
    if a.music:
        BEATS = [i * 60 / a.bpm for i in range(int(total * a.bpm / 60) + 2)]
    if a.zoom_mode == "intro" and not a.no_zoom:
        zexpr = "(1+0.16*max(0\\,1-t/0.8))"   # single zoom-out over the first 0.8 s, then static
        zoom = f"scale=w='trunc({W}*{zexpr}/2)*2':h='trunc({H}*{zexpr}/2)*2':eval=frame,crop={W}:{H},"
    else:
      zoom = ("" if a.no_zoom else
            f"scale=w='trunc({W}*{zoom_expr(events, segs, total, a.zoom)}/2)*2':h='trunc({H}*{zoom_expr(events, segs, total, a.zoom)}/2)*2':eval=frame,crop={W}:{H},")
    shakes = [ea for (ea, eb, _t, _em, tg) in events for kd, _ in tg if kd == "shake"] + ([0.0] if a.hook else [])
    if shakes:
        sx = "+".join(f"between(t,{t0:.2f},{t0 + 0.25:.2f})*12*sin(75*(t-{t0:.2f}))*(1-(t-{t0:.2f})/0.25)" for t0 in shakes)
        sy = "+".join(f"between(t,{t0:.2f},{t0 + 0.25:.2f})*8*cos(63*(t-{t0:.2f}))*(1-(t-{t0:.2f})/0.25)" for t0 in shakes)
        zoom += f"scale={int(W * 1.03) // 2 * 2}:{int(H * 1.03) // 2 * 2},crop={W}:{H}:x='(iw-{W})/2+{sx}':y='(ih-{H})/2+{sy}',"
    fc += (f"[vc]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{zoom}"
           f"{GRADES[a.grade]},unsharp=5:5:0.4,fps=30"
           + ("" if a.no_bar else f",drawbox=x=0:y=0:w='iw*t/{total:.2f}':h=12:color=0x{BRAND['green']}@1:t=fill")
           + "[vm0];"
           f"[ac]loudnorm=I=-14:TP=-1.5,aresample=48000[am0];")

    extra_inputs, cur, k, n_in = [], "vm0", 0, 1
    if a.layout == "cards":
        fc += "[vm0]split[vm0a][pipraw];"
        cur = "vm0a"

    # effect tags from the .srt: sparks / flash / leak / money / broll:NAME / icon:NAME
    for (ea, eb, _t, _em, tags) in events:
        for kind, arg in tags:
            if kind in ("shake", "ding"):
                continue   # handled by the camera / sound passes
            if kind == "circle":
                r0 = 230
                if arg:
                    cx, cy = (int(v) for v in arg.split(","))
                else:   # follow the face: detect it at the moment the circle appears
                    face = find_face(a.src, unmap(ea + 0.15, segs))
                    cx, cy, r0 = face if face else (W // 2 - 20, int(H * 0.43), 230)
                mov = os.path.join(tmp, f"circle{k}.mov"); S0 = render_circle_mov(mov, r=r0)
                extra_inputs += ["-i", mov]
                fc += (f"[{n_in}:v]format=rgba,setpts=PTS-STARTPTS+{ea:.2f}/TB[fx{k}];"
                       f"[{cur}][fx{k}]overlay=x={cx - S0 // 2}:y={cy - S0 // 2}:eof_action=repeat:enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
            elif kind == "arrow":
                cx, cy = (int(v) for v in arg.split(",")) if arg else (W // 2 + 120, int(H * 0.40))
                png = os.path.join(tmp, f"arrow{k}.png"); render_arrow_png(png)
                extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", png]
                bob = f"18*abs(sin(8*(t-{ea:.2f})))"
                fc += (f"[{n_in}:v]format=rgba[fx{k}];"
                       f"[{cur}][fx{k}]overlay=x='{cx}+{bob}':y='{cy}+{bob}':enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
            elif kind == "notif":
                png = os.path.join(tmp, f"notif{k}.png"); render_notif_png(arg or "رسالة جديدة", png)
                extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", png]
                y = f"{int(H * 0.06)}-260*(1-min(1,(t-{ea:.2f})/0.22))"
                fc += (f"[{n_in}:v]format=rgba[fx{k}];"
                       f"[{cur}][fx{k}]overlay=x=(W-w)/2:y='{y}':enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
            elif kind in ("sparks", "flash", "leak", "money", "broll"):
                path = find_asset("broll" if kind == "broll" else kind, arg if kind == "broll" else kind)
                extra_inputs += ["-i", path]
                cut = f",trim=duration={max(eb - ea, 0.4):.2f}" if kind == "broll" else ""
                # b-roll enters with a fast whip (slides in from the right in 0.12 s)
                xpos = f"x='W*max(0,1-(t-{ea:.2f})/0.12)':" if kind == "broll" else ""
                fc += (f"[{n_in}:v]format=rgba,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}{cut},"
                       f"setpts=PTS-STARTPTS+{ea:.2f}/TB[fx{k}];"
                       f"[{cur}][fx{k}]overlay={xpos}eof_action=pass:repeatlast=0[ov{k}];")
            else:  # icon: PNG, placed like an emoji
                path = find_asset("icon", arg)
                extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", path]
                fc += (f"[{n_in}:v]format=rgba,scale=230:-1,fade=t=in:st={ea:.2f}:d=0.12:alpha=1[fx{k}];"
                       f"[{cur}][fx{k}]overlay=x='(W-w)/2':y='{int(H * 0.11)}':enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
            cur, k, n_in = f"ov{k}", k + 1, n_in + 1

    # CARDS layout: shrink the finished content into a rounded card on the grid background, + a small face card
    if a.layout == "cards":
        bgp, maskp, pipm, shadowp = render_card_assets(tmp)
        cx0 = (W - CARD_W) // 2
        ent = f"(1-min(1,t/0.5))*(1-min(1,t/0.5))*(1-min(1,t/0.5))"     # ease-out entry
        extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", bgp, "-loop", "1", "-t", f"{total:.2f}", "-i", maskp,
                         "-loop", "1", "-t", f"{total:.2f}", "-i", shadowp, "-loop", "1", "-t", f"{total:.2f}", "-i", pipm,
                         "-loop", "1", "-t", f"{total:.2f}", "-i", os.path.join(tmp, "pip_border.png")]
        ib, im_, ish, ip, ipb = n_in, n_in + 1, n_in + 2, n_in + 3, n_in + 4
        n_in += 5
        face = find_face(a.src, unmap(1.2, segs)) or (W // 2, int(H * 0.40), 260)
        fx, fy, fr = face
        cw_, ch_ = 600, 800
        x0c = min(max(fx - cw_ // 2, 0), W - cw_); y0c = min(max(fy - int(ch_ * 0.42), 0), H - ch_)
        fc += (f"[{cur}]null[cardsrc];[pipraw]null[pipsrc];"
               f"[cardsrc]scale={CARD_W}:{CARD_H},format=rgba[cs];[{im_}:v]format=gray,scale={CARD_W}:{CARD_H}[cm];[cs][cm]alphamerge[card];"
               f"[pipsrc]crop={cw_}:{ch_}:{x0c}:{y0c},scale=360:480,format=rgba[ps];[{ip}:v]format=gray[pm];[ps][pm]alphamerge[pipc];"
               f"[{ib}:v]format=rgba[bgc];"
               f"[bgc][{ish}:v]overlay=x={cx0 - 80}:y='{CARD_Y - 80}+{H}*{ent}'[bgs];"
               f"[bgs][card]overlay=x={cx0}:y='{CARD_Y}+{H}*{ent}'[withcard];"
               f"[withcard][{ipb}:v]overlay=x='40-30-500*(1-min(1,(t-1.0)/0.35))':y={CARD_Y + CARD_H - 520 - 42}:enable='gte(t,1.0)'[wpb];"
               f"[wpb][pipc]overlay=x='40-500*(1-min(1,(t-1.0)/0.35))':y={CARD_Y + CARD_H - 520}:enable='gte(t,1.0)'[cardsout];")
        cur = "cardsout"

    # caption images + positions (above/below the face) computed once, used by emoji and captions
    caps = {}
    for i_ev, (ea, eb, t, _em, _tg) in enumerate(events):
        if t and (ARABIC_RE.search(t) or a.keywords_only):
            png = os.path.join(tmp, f"capimg{i_ev}.png")
            cw, chh = render_caption_png(t, png, a.ar_font, size=150 if a.keywords_only else 106)
            caps[i_ev] = (png, cw, chh, caption_y(a, segs, ea, chh, _tg))

    # colour emoji: rendered to PNG and overlaid near the top (clear of the face and the caption) with a small slide-down
    if not a.no_emoji:
        cache = {}
        for i_ev, (ea, eb, _t, ems, _tg) in enumerate(events):
            for j, ch in enumerate(ems[:2]):
                if ch not in cache:
                    mov = os.path.join(tmp, f"e{len(cache)}.mov")
                    render_emoji(ch, mov.replace(".mov", "_flat.png"), size=230)
                    cache[ch] = (mov, render_icon3d_mov(ch, mov))
                mov, (iw_, ih_) = cache[ch]
                extra_inputs += ["-i", mov]
                n_em = len(ems[:2])
                if i_ev in caps:   # right next to the caption (its image is centred at W/2-60), never on the face
                    _p, cw, chh, yc = caps[i_ev]
                    right = (W - cw) // 2 - 60 + cw - 40
                    x = f"{min(right + j * (iw_ - 40), W - iw_ + 30)}"
                    y = f"{yc + chh // 2 - ih_ // 2}"
                else:
                    x = f"(W-w)/2+({j}-{(n_em - 1) / 2})*{iw_}"
                    y = f"{int(H * 0.11)}"
                fc += (f"[{n_in}:v]format=rgba,setpts=PTS-STARTPTS+{ea:.2f}/TB[em{k}];"
                       f"[{cur}][em{k}]overlay=x='{x}':y='{y}':eof_action=repeat:enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
                cur, k, n_in = f"ov{k}", k + 1, n_in + 1
    # HOOK: big text card in the top safe zone for the first 2.6 s, flash at 0
    if a.hook:
        hp = os.path.join(tmp, "hook.png")
        hw, hh = render_hook_png(a.hook, hp, a.ar_font)
        extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", hp]
        y = f"{int(H * 0.075)}-60*(1-min(1,t/0.2))"
        fc += (f"[{n_in}:v]format=rgba,fade=t=out:st=2.4:d=0.25:alpha=1[hk];"
               f"[{cur}][hk]overlay=x=(W-w)/2-30:y='{y}':enable='between(t,0,2.65)'[ovhk];")
        cur, n_in = "ovhk", n_in + 1
        extra_inputs += ["-i", find_asset("flash", "flash")]
        fc += (f"[{n_in}:v]format=rgba,scale={W}:{H}[hfl];[{cur}][hfl]overlay=eof_action=pass:repeatlast=0[ovhf];")
        cur, n_in = "ovhf", n_in + 1

    # Arabic captions as images, on top of everything, slide-up + fade-in
    for i_ev, (ea, eb, t, _em, _tg) in enumerate(events):
        if i_ev in caps:
            png, cw, chh, yc = caps[i_ev]   # above or below his face, wherever there is room
            extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", png]
            y = f"{yc}+28*(1-min(1,(t-{ea:.2f})/0.15))"
            fc += (f"[{n_in}:v]format=rgba,fade=t=in:st={ea:.2f}:d=0.1:alpha=1[cp{k}];"
                   f"[{cur}][cp{k}]overlay=x=(W-w)/2-60:y='{y}':enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
            cur, k, n_in = f"ov{k}", k + 1, n_in + 1
    fc += f"[{cur}]null[vm];"

    # sound effects: whoosh on every caption change, pop when an emoji / effect tag appears
    if a.no_sfx:
        fc += "[am0]anull[am];"
    else:
        sfx = make_sfx(tmp)
        mix, n_mix = ["[am0]"], 1
        VOL = {"click": 0.22, "whoosh": 0.25, "pop": 0.38, "ding": 0.28, "boom": 0.8}
        whoosh_used = False   # Mustafa: whoosh must not repeat -> once per reel
        for i, (ea, eb, _t, ems, tags) in enumerate(events):
            kinds = {kd for kd, _ in tags}
            plan = ["click"] if "*" in _t else []
            if kinds & {"broll"} and not whoosh_used:
                plan.append("whoosh"); whoosh_used = True
            if ems or kinds & {"sparks", "icon", "circle", "arrow", "notif", "leak"}: plan.append("pop")
            if kinds & {"ding", "flash", "money"}: plan.append("ding")
            if "shake" in kinds: plan.append("boom")
            for kind in plan:
                extra_inputs += ["-i", sfx[kind]]
                ms = int(max(ea - 0.03, 0) * 1000)
                vol = VOL[kind]
                fc += f"[{n_in}:a]adelay={ms}|{ms},volume={vol}[sf{n_in}];"
                mix.append(f"[sf{n_in}]")
                n_in += 1
        if a.hook:
            boom = os.path.join(tmp, "boom.wav")
            run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=55:d=0.7", "-af",
                 "vibrato=f=6:d=0.3,afade=t=out:st=0.05:d=0.65,volume=1.6", "-ar", "48000", "-ac", "2", boom])
            extra_inputs += ["-i", boom]
            fc += f"[{n_in}:a]anull[sfboom];"; mix.append("[sfboom]"); n_in += 1
        if a.music:
            mpath = a.music
            if a.music == "beat":
                mpath = os.path.join(tmp, "beat.wav")
                run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_beat.py"), mpath, f"{total + 0.5:.2f}", str(a.bpm)])
            extra_inputs += ["-i", mpath]
            fc += f"[{n_in}:a]atrim=0:{total:.2f},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=0.16,afade=t=out:st={max(total - 0.6, 0):.2f}:d=0.6[mus];"
            mix.append("[mus]"); n_in += 1
        fc += "".join(mix) + f"amix=inputs={len(mix)}:duration=first:normalize=0,alimiter=limit=0.95[am];"
    if a.no_endcard:
        fc += f"[vm]subtitles={ass}:fontsdir={FONTS_DIR}[vout];[am]anull[aout]"
    else:
        fc += (f"color=c=0x{BRAND['navy']}:s={W}x{H}:d={ENDCARD_SECS}:r=30[card];"
               f"anullsrc=r=48000:cl=stereo,atrim=0:{ENDCARD_SECS}[csil];"
               f"[vm][card]concat=n=2:v=1:a=0[vv];[am][csil]concat=n=2:v=0:a=1[aout];"
               f"[vv]subtitles={ass}:fontsdir={FONTS_DIR}[vout]")
    run(["ffmpeg", "-v", "error", "-y", "-i", a.src, *extra_inputs, "-filter_complex", fc,
         "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-crf", "21",
         "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
         "-movflags", "+faststart", out])
    print(f"OK -> {out}  (kept {total:.1f}s of {sum(b-x for x,b in segs):.1f}s segments, {n} segment(s))")


if __name__ == "__main__":
    sys.exit(main())
