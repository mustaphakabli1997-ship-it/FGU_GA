#!/usr/bin/env python3
"""Visual identity pack for @kabli_ms e-commerce tips content -> assets/brand/identity/
   python3 tools/make_identity.py   (needs pillow, arabic-reshaper, python-bidi, cairosvg)"""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets/brand/identity")
def F(n, s):
    f = ImageFont.truetype(os.path.join(ROOT, "tools/fonts", n), s)
    if n.startswith("Montserrat"):
        f.set_variation_by_name("Bold")
    return f
ANTON = lambda s: F("Anton-Regular.ttf", s)
TAJ = lambda s: F("Tajawal-ExtraBold.ttf", s)
TAJR = lambda s: F("Tajawal-Bold.ttf", s)
NAVY, BLUE, GREEN, WHITE, INK, SOFT = (26, 54, 93), (49, 130, 206), (56, 161, 105), (255, 255, 255), (11, 25, 46), (169, 196, 232)
MARK = Image.open(os.path.join(ROOT, "assets/brand/logo_mark_transparent_white.png")).convert("RGBA")
MARKNAVY = Image.open(os.path.join(ROOT, "assets/brand/logo_mark_navy.png")).convert("RGBA")


def ar(t):
    return t  # Pillow+raqm already shapes and orders Arabic text; reshaping again would break it


def bg(w, h, top=NAVY, bottom=INK):
    im = Image.new("RGB", (w, h), top)
    px = ImageDraw.Draw(im)
    for y in range(h):
        k = y / h
        px.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * k) for i in range(3)))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([w * .35, -h * .15, w * 1.3, h * .45], fill=GREEN + (70,))
    im.paste(glow.filter(ImageFilter.GaussianBlur(120)), (0, 0), glow.filter(ImageFilter.GaussianBlur(120)))
    return im


def wrap(d, t, font, maxw):
    lines, cur = [], ""
    for w in t.split():
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=font) <= maxw:
            cur = trial
        else:
            lines.append(cur); cur = w
    return lines + [cur]


def glass(im, box, radius=36):
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rounded_rectangle(box, radius=radius, fill=(255, 255, 255, 22), outline=(80, 120, 170, 255), width=3)
    im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"))


def text_c(d, xy, t, font, fill, anchor="mm"):
    d.text(xy, t, font=font, fill=fill, anchor=anchor)


def chip(d, x, y, label, font, fg=NAVY, fill=GREEN, pad=26):
    w = d.textlength(label, font=font)
    d.rounded_rectangle([x, y, x + w + pad * 2, y + font.size + pad], radius=(font.size + pad) // 2, fill=fill)
    d.text((x + pad, y + (font.size + pad) / 2), label, font=font, fill=fg, anchor="lm")
    return x + w + pad * 2


def paste_mark(im, size, xy, src=MARK):
    m = src.resize((size, size), Image.LANCZOS)
    im.paste(m, xy, m)


def brand_board():
    W, H = 1920, 1080
    im = Image.new("RGB", (W, H), (245, 248, 252))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 760, H], fill=NAVY)
    paste_mark(im, 360, (200, 150))
    text_c(d, (380, 590), "KABLI_MS", ANTON(120), WHITE)
    d.rectangle([325, 660, 435, 670], fill=GREEN)
    text_c(d, (380, 730), "E-COMMERCE  •  SPONSOR  •  META ADS", F("Montserrat-Bold.ttf", 25), SOFT)
    text_c(d, (380, 900), ar("نصائح التجارة الإلكترونية"), TAJ(52), WHITE)
    text_c(d, (380, 970), ar("نتائج حقيقية، بلا تضخيم"), TAJR(34), SOFT)
    d.text((840, 90), "PALETTE", font=F("Montserrat-Bold.ttf", 30), fill=NAVY)
    sw = [("Midnight Blue", "#1A365D", NAVY, "الثقة · الخلفية"), ("Electric Blue", "#3182CE", BLUE, "التقنية · الروابط"),
          ("Growth Green", "#38A169", GREEN, "النتائج · المهمة"), ("White", "#FFFFFF", WHITE, "النص"), ("Ink", "#0B192E", INK, "الظلال")]
    for i, (n, h, c, use) in enumerate(sw):
        x = 840 + i * 205
        d.rounded_rectangle([x, 150, x + 185, 400], radius=26, fill=c, outline=(210, 220, 235), width=2)
        d.text((x + 12, 420), n, font=F("Montserrat-Bold.ttf", 21), fill=NAVY)
        d.text((x + 12, 452), h, font=F("Montserrat-Bold.ttf", 21), fill=(100, 116, 139))
        d.text((x + 12, 486), ar(use), font=TAJR(22), fill=(100, 116, 139))
    d.text((840, 580), "TYPOGRAPHY", font=F("Montserrat-Bold.ttf", 30), fill=NAVY)
    d.text((840, 640), "ANTON — HEADLINES & CAPTIONS", font=ANTON(64), fill=NAVY)
    d.text((840, 740), "Montserrat Bold — labels, numbers", font=F("Montserrat-Bold.ttf", 38), fill=NAVY)
    d.text((840, 810), ar("Tajawal — العناوين بالعربية"), font=TAJ(54), fill=NAVY)
    d.text((840, 920), "RULE: ONE accent word per phrase in Growth Green.", font=F("Montserrat-Bold.ttf", 26), fill=GREEN)
    d.text((840, 975), "Caption max 3 words · Hook in 2 seconds · CTA = WhatsApp", font=F("Montserrat-Bold.ttf", 26), fill=(100, 116, 139))
    im.save(os.path.join(OUT, "brand_board.png"))


def reel_cover():
    W, H = 1080, 1920
    im = bg(W, H)
    d = ImageDraw.Draw(im)
    chip(d, 80, 150, "TIP E-COMMERCE", F("Montserrat-Bold.ttf", 38), fg=WHITE, fill=GREEN)
    for i, (t, c) in enumerate([("3 AKHTA2", WHITE), ("TOUSSAR", GREEN), ("L SPONSOR", WHITE)]):
        d.text((80, 360 + i * 280), t, font=ANTON(222), fill=c)
    d.text((80, 1330), ar("3 أخطاء تحرق ميزانية الإعلان تاعك"), font=TAJ(60), fill=SOFT)
    d.line([(80, 1500), (1000, 1500)], fill=(70, 100, 140), width=3)
    paste_mark(im, 230, (60, 1540))
    d.text((300, 1640), "@kabli_ms", font=F("Montserrat-Bold.ttf", 56), fill=WHITE, anchor="lm")
    d.text((300, 1710), "WhatsApp 0550 20 54 64", font=F("Montserrat-Bold.ttf", 36), fill=SOFT, anchor="lm")
    im.save(os.path.join(OUT, "reel_cover_template.png"))


def tip_post(n=1, title="ZID L BUDGET B 20% KOL YOMEIN", sub="ما تكبّرش الميزانية دفعة وحدة، وراقب السعر في كل مرة.", name="tip_post_template.png"):
    W, H = 1080, 1350
    im = bg(W, H)
    d = ImageDraw.Draw(im)
    chip(d, 80, 90, "TIP", F("Montserrat-Bold.ttf", 40), fg=WHITE, fill=GREEN)
    d.text((300, 118), f"#{n}", font=ANTON(120), fill=GREEN, anchor="lm")
    tf = ANTON(130)
    y = 270
    for ln in wrap(d, title.upper(), tf, 920):
        d.text((80, y), ln, font=tf, fill=WHITE)
        y += 150
    glass(im, [80, 760, 1000, 1040])
    d = ImageDraw.Draw(im)
    y = 830
    for ln in wrap(d, sub, TAJ(50), 820):
        d.text((540, y), ln, font=TAJ(50), fill=WHITE, anchor="mm")
        y += 78
    paste_mark(im, 150, (60, 1130))
    d.text((220, 1195), "@kabli_ms", font=F("Montserrat-Bold.ttf", 44), fill=WHITE, anchor="lm")
    d.text((1000, 1195), "SWIPE  →", font=F("Montserrat-Bold.ttf", 34), fill=GREEN, anchor="rm")
    im.save(os.path.join(OUT, name))


def icon(kind, d, cx, cy, s, col):
    w = max(8, s // 11)
    if kind == "tips":      # lightbulb
        d.ellipse([cx - s * .32, cy - s * .5, cx + s * .32, cy + s * .14], outline=col, width=w)
        d.rectangle([cx - s * .16, cy + s * .2, cx + s * .16, cy + s * .28], fill=col)
        d.rectangle([cx - s * .1, cy + s * .34, cx + s * .1, cy + s * .4], fill=col)
    elif kind == "ads":     # megaphone
        d.polygon([(cx - s * .4, cy - s * .12), (cx - s * .1, cy - s * .12), (cx + s * .38, cy - s * .42), (cx + s * .38, cy + s * .42), (cx - s * .1, cy + s * .12), (cx - s * .4, cy + s * .12)], outline=col, width=w)
        d.rectangle([cx - s * .32, cy + s * .12, cx - s * .16, cy + s * .42], outline=col, width=w)
    elif kind == "store":   # cart
        d.line([(cx - s * .5, cy - s * .38), (cx - s * .32, cy - s * .38), (cx - s * .15, cy + s * .2), (cx + s * .36, cy + s * .2), (cx + s * .46, cy - s * .2), (cx - s * .27, cy - s * .2)], fill=col, width=w, joint="curve")
        for x in (cx - s * .08, cx + s * .3):
            d.ellipse([x - s * .08, cy + s * .3, x + s * .08, cy + s * .46], fill=col)
    elif kind == "results": # chart + arrow
        for i, h in enumerate((.2, .35, .55)):
            x = cx - s * .42 + i * s * .3
            d.rectangle([x, cy + s * .4 - s * h, x + s * .2, cy + s * .4], fill=col)
        d.line([(cx - s * .45, cy - s * .05), (cx - s * .05, cy - s * .3), (cx + s * .15, cy - s * .15), (cx + s * .46, cy - s * .48)], fill=GREEN, width=w, joint="curve")
        d.polygon([(cx + s * .5, cy - s * .52), (cx + s * .3, cy - s * .5), (cx + s * .48, cy - s * .32)], fill=GREEN)


def highlights():
    items = [("tips", "NASA2E7"), ("ads", "SPONSOR"), ("store", "MATJER"), ("results", "NATA2IJ")]
    for kind, label in items:
        im = Image.new("RGB", (1080, 1080), NAVY)
        d = ImageDraw.Draw(im)
        d.ellipse([40, 40, 1040, 1040], fill=NAVY, outline=GREEN, width=14)
        icon(kind, d, 540, 480, 430, WHITE)
        d.text((540, 840), label, font=ANTON(120), fill=WHITE, anchor="mm")
        im.save(os.path.join(OUT, f"highlight_{kind}.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    brand_board(); reel_cover(); tip_post(); highlights()
    print(sorted(os.listdir(OUT)))
