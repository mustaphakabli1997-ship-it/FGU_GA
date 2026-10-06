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
ACCENT = BRAND["green"]  # words wrapped as *word* in the .srt get this colour
W, H, ENDCARD_SECS = 1080, 1920, 3.0
# warm golden/orange look + soft vignette (style reference: nazih_motivation reels)
GRADES = {
    "warm": "eq=contrast=1.12:saturation=1.2:brightness=-0.02,colorbalance=rs=0.05:gs=0.01:bs=-0.07:rm=0.06:bm=-0.05:rh=0.04:bh=-0.04,vignette=PI/5",
    "natural": "eq=contrast=1.06:saturation=1.1",
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


TAG_RE = re.compile(r"\[(sparks|flash|leak|money|broll|icon)(?::([^\]]+))?\]", re.I)
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
    base = r"{\fnDejaVu Sans\b1\fs88\fsp0\c&H00FFFFFF&\fscx100\fscy100}" if arabic else r"{\r}"
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
Style: Sub,{FONT},138,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,2,0,1,5,3,2,80,80,640,1
Style: CardBig,{FONT},70,{bgr(BRAND['green'])},&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1
Style: CardSmall,{FONT},64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    lines = [f"Dialogue: 0,{ass_ts(a)},{ass_ts(b)},Sub,,0,0,0,,{style_text(t)}" for a, b, t, *_ in events if t]
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
        if attempt == 0 and not os.path.isdir(os.path.join(ASSETS, "_generated")):
            run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "gen_assets.py")])
    sys.exit(f"asset '{name}' not found in assets/ (tag [{kind}:{name}])")


def make_sfx(tmp):
    """Tiny synthetic sound effects (no downloads): whoosh (filtered noise sweep) and pop."""
    out = {}
    specs = {
        "whoosh": ["-f", "lavfi", "-i", "anoisesrc=d=0.35:c=pink:a=0.8",
                   "-af", "highpass=f=400,lowpass=f=3500,afade=t=in:d=0.12,afade=t=out:st=0.15:d=0.2,volume=0.9"],
        "pop": ["-f", "lavfi", "-i", "sine=f=900:d=0.12",
                "-af", "afade=t=out:st=0.02:d=0.1,volume=0.8"],
    }
    for name, args in specs.items():
        path = os.path.join(tmp, name + ".wav")
        run(["ffmpeg", "-v", "error", "-y", *args, "-ar", "48000", "-ac", "2", path])
        out[name] = path
    return out


def render_emoji(ch, path, size=230):
    from PIL import Image, ImageDraw, ImageFont
    f = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
    im = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox())
    im = im.resize((size, int(size * im.height / im.width)), Image.LANCZOS)
    im.save(path)


def zoom_expr(events, segs, total):
    """Alternating punch zoom-OUT (1.14 -> 1.0) and slow push-IN (1.0 -> 1.10), restarted at each caption / cut."""
    pts = sorted({round(a, 2) for a, *_ in events if a < total}
                 | {round(sum(b - x for x, b in segs[:i]), 2) for i in range(1, len(segs))})
    if not pts:
        pts = [round(i * 3.0, 2) for i in range(int(total // 3) + 1)]
    if pts[0] > 0.05:
        pts.insert(0, 0.0)
    terms = []
    for i, t0 in enumerate(pts):
        t1 = pts[i + 1] if i + 1 < len(pts) else total
        if i % 2 == 0:   # punch out
            terms.append(f"between(t\\,{t0}\\,{t1})*(1+0.14*max(0\\,1-(t-{t0})/0.6))")
        else:            # push in
            terms.append(f"between(t\\,{t0}\\,{t1})*(1+0.10*min(1\\,(t-{t0})/{max(t1 - t0, 0.3):.2f}))")
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
    ap.add_argument("--no-bar", action="store_true")
    ap.add_argument("--tagline", default="")
    ap.add_argument("--no-emoji", action="store_true")
    ap.add_argument("--grade", choices=["warm", "natural"], default="warm")
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
    tmp = tempfile.mkdtemp()
    ass = os.path.join(tmp, "s.ass")
    open(ass, "w", encoding="utf-8").write(build_ass(events, total, not a.no_endcard, a.tagline))

    n = len(segs)
    parts = []
    for i, (x, y) in enumerate(segs):
        parts.append(f"[0:v]trim={x:.3f}:{y:.3f},setpts=PTS-STARTPTS[v{i}];"
                     f"[0:a]atrim={x:.3f}:{y:.3f},asetpts=PTS-STARTPTS[a{i}]")
    cat = "".join(f"[v{i}][a{i}]" for i in range(n))
    fc = ";".join(parts) + f";{cat}concat=n={n}:v=1:a=1[vc][ac];"
    zoom = ("" if a.no_zoom else
            f"scale=w='trunc({W}*{zoom_expr(events, segs, total)}/2)*2':h='trunc({H}*{zoom_expr(events, segs, total)}/2)*2':eval=frame,crop={W}:{H},")
    fc += (f"[vc]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{zoom}"
           f"{GRADES[a.grade]},unsharp=5:5:0.5,fps=30"
           + ("" if a.no_bar else f",drawbox=x=0:y=0:w='iw*t/{total:.2f}':h=12:color=0x{BRAND['green']}@1:t=fill")
           + "[vm0];"
           f"[ac]loudnorm=I=-14:TP=-1.5,aresample=48000[am0];")

    extra_inputs, cur, k, n_in = [], "vm0", 0, 1

    # effect tags from the .srt: sparks / flash / leak / money / broll:NAME / icon:NAME
    for (ea, eb, _t, _em, tags) in events:
        for kind, arg in tags:
            if kind in ("sparks", "flash", "leak", "money", "broll"):
                path = find_asset("broll" if kind == "broll" else kind, arg if kind == "broll" else kind)
                extra_inputs += ["-i", path]
                cut = f",trim=duration={max(eb - ea, 0.4):.2f}" if kind == "broll" else ""
                fc += (f"[{n_in}:v]format=rgba,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}{cut},"
                       f"setpts=PTS-STARTPTS+{ea:.2f}/TB[fx{k}];"
                       f"[{cur}][fx{k}]overlay=eof_action=pass:repeatlast=0[ov{k}];")
            else:  # icon: PNG, placed like an emoji
                path = find_asset("icon", arg)
                extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", path]
                fc += (f"[{n_in}:v]format=rgba,scale=230:-1,fade=t=in:st={ea:.2f}:d=0.12:alpha=1[fx{k}];"
                       f"[{cur}][fx{k}]overlay=x='(W-w)/2':y='{int(H * 0.09)}':enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
            cur, k, n_in = f"ov{k}", k + 1, n_in + 1

    # colour emoji: rendered to PNG and overlaid near the top (clear of the face and the caption) with a small slide-down
    if not a.no_emoji:
        cache = {}
        for (ea, eb, _t, ems, _tg) in events:
            for j, ch in enumerate(ems[:2]):
                if ch not in cache:
                    cache[ch] = os.path.join(tmp, f"e{len(cache)}.png")
                    render_emoji(ch, cache[ch])
                extra_inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", cache[ch]]
                n_em = len(ems[:2])
                x = f"(W-w)/2+({j}-{(n_em - 1) / 2})*260"
                y = f"{int(H * 0.09)}-50*(1-min(1,(t-{ea:.2f})/0.18))"
                fc += (f"[{n_in}:v]format=rgba,fade=t=in:st={ea:.2f}:d=0.12:alpha=1[em{k}];"
                       f"[{cur}][em{k}]overlay=x='{x}':y='{y}':enable='between(t,{ea:.2f},{eb:.2f})'[ov{k}];")
                cur, k, n_in = f"ov{k}", k + 1, n_in + 1
    fc += f"[{cur}]null[vm];"

    # sound effects: whoosh on every caption change, pop when an emoji / effect tag appears
    if a.no_sfx:
        fc += "[am0]anull[am];"
    else:
        sfx = make_sfx(tmp)
        mix, n_mix = ["[am0]"], 1
        for i, (ea, eb, _t, ems, tags) in enumerate(events):
            for kind in (["whoosh"] + (["pop"] if (ems or tags) else [])):
                extra_inputs += ["-i", sfx[kind]]
                ms = int(max(ea - 0.03, 0) * 1000)
                vol = 0.30 if kind == "whoosh" else 0.45
                fc += f"[{n_in}:a]adelay={ms}|{ms},volume={vol}[sf{n_in}];"
                mix.append(f"[sf{n_in}]")
                n_in += 1
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
