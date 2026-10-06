#!/usr/bin/env python3
"""Static image ad for Mustafa's sponsoring service (palette B) -> ads/  (feed 1080x1350 + story 1080x1920)"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_identity import *  # fonts, colours, bg(), chip(), glass(), wrap(), paste_mark()

OUTD = os.path.join(ROOT, "ads")


def rtl(d, x, y, t, font, fill):
    d.text((x, y), t, font=font, fill=fill, anchor="ra")


def ad(w, h, name):
    im = bg(w, h)
    d = ImageDraw.Draw(im)
    s = h / 1350 if h < 1500 else 1.0  # story keeps same layout, more air
    top = 80 if h < 1500 else 240
    pad = 80
    chip(d, pad, top, "META ADS  •  SPONSOR", F("Montserrat-Bold.ttf", 34), fg=WHITE, fill=GREEN)
    # headline (Arabic, right aligned)
    hf = TAJ(104)
    y = top + 120
    for ln in ["متجرك موجود", "وما يبيعش؟"]:
        rtl(d, w - pad, y, ln, hf, WHITE if "موجود" in ln else GREEN)
        y += 125
    sf = TAJ(46)
    y += 20
    for ln in ["نخدملك السبونسور على Meta", "ويجيبولك رسائل وطلبات حقيقية"]:
        rtl(d, w - pad, y, ln, sf, SOFT)
        y += 66
    # proof card
    cy = y + 30
    glass(im, [pad, cy, w - pad, cy + 300])
    d = ImageDraw.Draw(im)
    d.text((pad + 50, cy + 150), "0.27$", font=ANTON(140), fill=GREEN, anchor="lm")
    rtl(d, w - pad - 50, cy + 90, "للمحادثة الواحدة", TAJ(54), WHITE)
    rtl(d, w - pad - 50, cy + 160, "411 محادثة بـ 112$ فقط", TAJR(40), SOFT)
    rtl(d, w - pad - 50, cy + 222, "نتيجة حقيقية من حملة تاعي (Maximum)", TAJR(30), (130, 150, 185))
    # CTA button
    by = cy + 340
    d.rounded_rectangle([pad, by, w - pad, by + 120], radius=60, fill=GREEN)
    d.text((w / 2, by + 60), "WhatsApp  0550 20 54 64", font=F("Montserrat-Bold.ttf", 52), fill=WHITE, anchor="mm")
    rtl(d, w - pad, by + 150, "راسلني الآن وقولي شنو تبيع", TAJR(34), SOFT)
    # footer
    fy = h - 150 if h < 1500 else h - 300
    paste_mark(im, 130, (pad - 20, fy))
    d.text((pad + 125, fy + 65), "@kabli_ms", font=F("Montserrat-Bold.ttf", 40), fill=WHITE, anchor="lm")
    im.save(os.path.join(OUTD, name))


if __name__ == "__main__":
    os.makedirs(OUTD, exist_ok=True)
    ad(1080, 1350, "ad1_feed_1080x1350.png")
    ad(1080, 1920, "ad1_story_1080x1920.png")
    print(sorted(os.listdir(OUTD)))
