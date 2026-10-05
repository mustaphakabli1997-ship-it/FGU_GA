# Instructions for Claude (Mustafa's reels workspace)

Start of every session:
1. Read `profile/mustafa.md` (who he is, tone, brand colors, contacts, audience, offer).
2. Reply in Algerian Darija (Arabic script), short and practical. Mustafa is a beginner in video editing: explain what you did in simple words.

Editing a reel (Mustafa uploads to `videos/`, sometimes on `main` — check `git fetch origin main` and pull the file from there):
1. `ffprobe` the file and look at a contact sheet of frames before deciding anything.
2. Ask for / write the subtitle script as an `.srt` (mixed Darija + French, no emoji — they render as boxes).
3. Run: `python3 tools/edit_reel.py videos/reelN.mov --srt subs.srt`
   - cuts silences, 1080x1920, light grade, loudness -14 LUFS, big subtitles, navy end card with WhatsApp + @kabli_ms.
   - Flags: `--no-silence-cut`, `--no-endcard`, `--srt-after-cut`, `--out`.
4. Check frames of the output (subtitle position/readability, end card) before delivering.
5. Commit to the current branch with the output at `videos/reelN_vX.mp4`; tell him the branch + path and how to download it (GitHub app/website, raw file).

Limits to remember: no audio listening / no speech-to-text installed, so subtitles come from his script; source quality is not improved by upscaling; no CapCut access.
