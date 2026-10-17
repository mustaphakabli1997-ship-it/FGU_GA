#!/usr/bin/env python3
"""Punch-in zooms on a talking-head source (the "jump-cut zoom" transition): the frame switches between zoom levels
at given SOURCE times (cuts and emphasis words). The crop keeps the head (anchored at 30 % from the top).
  python3 tools/punch_zoom.py in.mov out.mov '[[0,1.0],[1.16,1.08],[4.11,1.0]]'
"""
import json, subprocess, sys

src, out, sched = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
fps = float(eval(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                                  "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()))
w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                 "-of", "csv=p=0:s=x", src], capture_output=True, text=True).stdout.strip().split("x"))
t = f"(in/{fps})"
z = str(sched[-1][1])
for (a, za), (b, _) in reversed(list(zip(sched, sched[1:]))):
    z = f"if(lt({t},{b}),{za},{z})"
z = f"if(lt({t},{sched[0][0]}),1,{z})"
vf = f"zoompan=z='{z}':d=1:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*0.3':s={w}x{h}:fps={fps}"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                "-pix_fmt", "yuv420p", "-c:a", "copy", out], check=True)
print("OK ->", out)
