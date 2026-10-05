#!/usr/bin/env python3
"""Speech timing helper: python3 tools/transcribe.py videos/reel2.mov > subs/reel2_draft.txt
Needs: pip install faster-whisper. Whisper's Algerian Darija text is unreliable, so use it for TIMINGS
(when each phrase starts/ends) and have Mustafa type/correct the words."""
import sys
from faster_whisper import WhisperModel

m = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = m.transcribe(sys.argv[1], language="ar", word_timestamps=True, vad_filter=True)
ts = lambda t: f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(t%1*1000):03d}"
for i, s in enumerate(segs, 1):
    print(f"{i}\n{ts(s.start)} --> {ts(s.end)}\n[auto, probably wrong] {s.text.strip()}\nWRITE HERE: \n")
