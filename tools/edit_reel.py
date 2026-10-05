#!/usr/bin/env python3
"""Mustafa reel editor: silence cut -> 1080x1920 -> light grade -> subtitles -> brand end card.

Usage:
  python3 tools/edit_reel.py videos/reel2.mov [--srt subs.srt] [--no-silence-cut] [--no-endcard]
Output: videos/<name>_v1.mp4  (use --out to change)

Subtitles come from an .srt written from Mustafa's script (timings relative to the ORIGINAL
video unless --srt-after-cut is passed). Brand colors / contacts live in BRAND below.
"""
import argparse, os, re, subprocess, sys, tempfile

BRAND = dict(navy="1A365D", blue="3182CE", green="38A169",
             whatsapp="0550 20 54 64", handle="@kabli_ms",
             cta="راسلني على واتساب")
FONT = "DejaVu Sans"  # has Arabic glyphs; swap for Cairo/Tajawal if installed
W, H, ENDCARD_SECS = 1080, 1920, 3.0


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
        text = re.sub(r"[\U00010000-\U0010ffff\u2600-\u27bf\ufe0f]", "", text).strip()  # emoji render as boxes
        ev.append((a, b, text))
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


def build_ass(events, total, with_endcard):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Sub,{FONT},72,&H00FFFFFF,&H00FFFFFF,{bgr(BRAND['navy'])},&H80000000,1,0,0,0,100,100,0,0,1,6,2,2,70,70,520,1
Style: CardBig,{FONT},70,{bgr(BRAND['green'])},&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1
Style: CardSmall,{FONT},64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    lines = [f"Dialogue: 0,{ass_ts(a)},{ass_ts(b)},Sub,,0,0,0,,{t}" for a, b, t in events]
    if with_endcard:
        s, e = ass_ts(total), ass_ts(total + ENDCARD_SECS)
        lines += [
            f"Dialogue: 0,{s},{e},CardSmall,,0,0,0,,{{\\pos({W//2},{H//2-260})}}{BRAND['cta']}",
            f"Dialogue: 0,{s},{e},CardBig,,0,0,0,,{{\\pos({W//2},{H//2-60})}}WhatsApp: {BRAND['whatsapp']}",
            f"Dialogue: 0,{s},{e},CardSmall,,0,0,0,,{{\\pos({W//2},{H//2+140})}}Instagram: {BRAND['handle']}",
        ]
    return head + "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--srt")
    ap.add_argument("--srt-after-cut", action="store_true")
    ap.add_argument("--no-silence-cut", action="store_true")
    ap.add_argument("--no-endcard", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args()

    out = a.out or re.sub(r"\.[^.]+$", "", a.src) + "_v1.mp4"
    segs, dur = ([(0, probe_duration(a.src))], None) if a.no_silence_cut else keep_segments(a.src)
    total = sum(b - x for x, b in segs)

    events = []
    if a.srt:
        raw = srt_to_events(open(a.srt, encoding="utf-8").read())
        events = raw if a.srt_after_cut or a.no_silence_cut else [
            (remap(s, segs), remap(e, segs), t) for s, e, t in raw]
    tmp = tempfile.mkdtemp()
    ass = os.path.join(tmp, "s.ass")
    open(ass, "w", encoding="utf-8").write(build_ass(events, total, not a.no_endcard))

    n = len(segs)
    parts = []
    for i, (x, y) in enumerate(segs):
        parts.append(f"[0:v]trim={x:.3f}:{y:.3f},setpts=PTS-STARTPTS[v{i}];"
                     f"[0:a]atrim={x:.3f}:{y:.3f},asetpts=PTS-STARTPTS[a{i}]")
    cat = "".join(f"[v{i}][a{i}]" for i in range(n))
    fc = ";".join(parts) + f";{cat}concat=n={n}:v=1:a=1[vc][ac];"
    fc += (f"[vc]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
           f"eq=contrast=1.06:saturation=1.1,unsharp=5:5:0.5,fps=30[vm];"
           f"[ac]loudnorm=I=-14:TP=-1.5,aresample=48000[am];")
    if a.no_endcard:
        fc += f"[vm]subtitles={ass}[vout];[am]anull[aout]"
    else:
        fc += (f"color=c=0x{BRAND['navy']}:s={W}x{H}:d={ENDCARD_SECS}:r=30[card];"
               f"anullsrc=r=48000:cl=stereo,atrim=0:{ENDCARD_SECS}[csil];"
               f"[vm][card]concat=n=2:v=1:a=0[vv];[am][csil]concat=n=2:v=0:a=1[aout];"
               f"[vv]subtitles={ass}[vout]")
    run(["ffmpeg", "-v", "error", "-y", "-i", a.src, "-filter_complex", fc,
         "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-crf", "21",
         "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
         "-movflags", "+faststart", out])
    print(f"OK -> {out}  (kept {total:.1f}s of {sum(b-x for x,b in segs):.1f}s segments, {n} segment(s))")


if __name__ == "__main__":
    sys.exit(main())
