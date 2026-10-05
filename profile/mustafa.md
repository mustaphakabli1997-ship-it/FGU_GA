# Mustafa — profile & reels brief

## Who
- Mustafa, e-commerce content creator + digital services (Birkhadem, Algiers).
- Instagram link: https://www.instagram.com/kabli_ms
- Instagram handle (confirmed by Mustafa, matches the link): @kabli_ms
- Phone: 0799858948
- WhatsApp: 0550205464
- Services: Meta Ads, e-commerce store ops (Shopify, Foorweb, Builddz, YouCan), digital support.
- Goal: grow his own brand and get better at editing Reels. Claude acts as his Reels editing + content copilot.

## Language
- User writes in Algerian Darija (Arabic script). Reply in Darija, short and practical.
- On-screen text language for reels: to confirm per reel (Darija / French / mix).

## Tone of voice
- Professional but friendly, direct, practical, results-driven, trustworthy.
- Keywords: growth, performance, conversions, sales, tech support, stability, real results.
- Avoid: exaggeration/hype, unexplained jargon, stiffness.
- Terms to keep consistent: Meta Ads, ROAS, Foorweb, Builddz, Shopify, Landing Pages.

## Brand colors (use for text overlays, lower-thirds, end cards)
- Midnight Blue #1A365D — trust
- Electric Blue #3182CE — tech/activity
- Growth Green #38A169 — results/profits

## Reel structure (default)
- 0-3s hook (number / problem / result), 3-10s problem or story, 10-22s solution in 3 points with on-screen text, last 5-8s CTA.
- Fast cuts (1-2s), big subtitles (most watch muted), light zoom on key words, quiet music under voice.
- Export: 1080x1920, H.264, ~-14 LUFS audio.

## Workflow
- Videos uploaded to videos/ in this repo; Claude edits with FFmpeg and gives cut-by-cut plans for CapCut.
- Source in videos/reelN.*, outputs as videos/reelN_vX.mp4.

## Audience & offer (confirmed)
- Audience: beginner online merchants.
- Offer: Meta Ads + store creation for beginners.
- Footage: Mustafa talks to camera (talking-head).
- Language: mix (Darija + French) for speech and on-screen text.

## Content identity (confirmed by Mustafa)
- Mustafa talks about e-commerce and gives practical e-commerce tips (not only selling services).
- All his content and Reels editing must keep the SAME consistent style (same tone, colors, subtitle look, end card, pacing) so the account feels recognisable.
- He wants to keep improving himself: Claude should explain each editing choice in simple words, suggest one improvement per reel, and track what he learns.
- Note: the old perfume unboxing video (reel1) was only a test, not his niche.

## Niche & service (clarified by Mustafa)
- Niche: advising online merchants (e-commerce) and running their sponsoring ("sponsor" / paid ads on Meta) for them.
- His core service = sponsoring (Meta Ads management for merchants). In Algerian usage "sponsor/صبونصور" means paid ads.
- Audience = online merchants (beginners). Content = tips on e-commerce + ads, with the sponsoring service as the call to action.
- Use his word "sponsor / سبونسور" in on-screen text and CTAs, alongside "Meta Ads".

## Caption & color style (reference: @nazih_motivation reels, chosen by Mustafa — take the technique, not a copy)
- Captions: huge bold condensed font (Anton), UPPERCASE for Latin/Arabizi Darija ("TKUN FL CLAN TA3I"), centered, lower-middle of the frame (~60-65% height), 2-3 short lines, max ~4 words per screen.
- Key word of each phrase gets an accent colour (brand Growth Green #38A169) and is slightly bigger; pop-in animation (small scale-up, 0.1s).
- Arabic captions: DejaVu Sans Bold, no letter spacing (spacing breaks Arabic joining), same position, accent word coloured.
- Emoji: write them in the .srt (e.g. `... 🔥`); the tool strips them from the text and overlays them as colour PNGs near the top of the frame (clear of face and caption), max 2 per caption.
- Zoom: alternating punch zoom-OUT (1.14x -> 1.0 in 0.6s) and slow push-IN (1.0 -> 1.10) restarted at every caption / jump cut. Disable with `--no-zoom`; emoji with `--no-emoji`.
- Colour grade: warm golden/orange, a bit more contrast + saturation, soft dark vignette (face lit, edges dark). Option `--grade natural` if the footage is already warm.
- Extras seen in the reference (to add later when assets exist): light-leak/transition flashes on punchy moments, falling-money overlay for money topics, cutout face over blurred warm background.
- Tool: `python3 tools/edit_reel.py videos/reelN.mov --srt subs.srt` — mark accent words with *stars* in the .srt (e.g. `SPONSOR MA YJIBLEK *TLABAT*`).

## Style reference #2 (screen recording of a second reel, `videos/1005 (2).mov` on main, 18s, 640x480)
- Same creator style: talking head in front of a **green screen / neon-green background**, subject centred, big caption in the lower-middle.
- Captions: one or two words at a time (SALEM, ARWAH, NHOTEK, YBDA, 3ID RASSEK, SUIVI-MOI, 1 MIN), huge white bold with soft glow; emphasis words get an effect (red text, glowing green text, text sitting behind the hand/body).
- B-roll inserts for 1-2 s to illustrate words: newspaper "DAILY MAIL" clip, red/city clip, small icons (speaker, mail) next to the word.
- Punchy moments: close face zoom with orange spark/fire particles, flashes, quick zoom in/out every phrase.
- Takeaway for Mustafa's reels: very short caption chunks (1-3 words), more B-roll/icons per sentence, a glow on captions, sparks/flash on the key claim.

## Effects toolkit (built by Claude, no downloads needed)
- Tags go at the end of a cue in the .srt: `[sparks]` orange sparks, `[flash]` white flash, `[leak]` warm light leak, `[money]` falling dollars, `[broll:growth_chart]` full-frame b-roll clip for the cue, `[icon:NAME]` PNG icon from assets/icons.
- Generated assets live in `assets/_generated/` (git-ignored; rebuilt automatically or with `python3 tools/gen_assets.py`).
- Mustafa's own files go in `assets/sparks/`, `assets/broll/`, `assets/icons/` (uploaded via GitHub on `main`); file name = tag name, and his files win over generated ones. Only use royalty-free sources (Pexels, Pixabay, Mixkit, CapCut library).
- Example cue: `00:00:02,600 --> 00:00:05,500` / `MASHI MOSHKIL FL *META* 🔥 [flash]`
