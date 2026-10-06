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

## Content message (Mustafa, reel2 "work with your face")
- In this era, to sell you must work with your FACE: videos of people holding the product in hand, talking about it and selling it, so people trust them.
- Captions for reel2 are key phrases paraphrased from his summary (subs/reel2.srt), not word-for-word; whisper cannot transcribe Algerian Darija reliably, so Mustafa types the words (tools/transcribe.py only gives timings).

## Editing upgrades (reel2 v3)
- Captions cut to 1-3 words each (~1.5-2s), accent word green; splitting a phrase gives a faster rhythm.
- Auto SFX: soft whoosh on every caption change, pop when an emoji/effect appears (`--no-sfx` to disable). Green progress bar on top (`--no-bar`).
- End card tagline via `--tagline "BACH NAS DIR FIK ETHIQA"` (used when the trust line doesn't fit in the video).
- Command: `python3 tools/edit_reel.py videos/reel2.mov --srt subs/reel2_v3.srt --tagline "..." --out videos/reel2_final_v3.mp4`
- Next ideas: royalty-free background music under the voice, B-roll of products/stores, stronger hook in the first 2 seconds.

## Meta Ads campaign snapshot (Mustafa's own results, 2026-10-06, usable as proof content)
- Ad set "Publication Instagram: حاب تزيد مبيعاتك وتجيب..." (objective: conversations by message), all-time: 411 conversations, 0.27 USD per conversation, 112.76 USD spent, daily budget 5 USD, reach 46,785, impressions 94,623 (~2 views per person).
- Conversations are not sales: always track conversations -> orders -> delivered, and quote the real cost per order.
- Budget advice given: raise ~20% every 2-3 days (not +50% at once), don't edit audience/creative of a winning ad, add a second ad with a new hook instead, answer messages within 5 minutes, switch creative if frequency > 3, merge similar ad sets.
- Reel idea (reel3): hook "411 زبون بـ 112$ 👀", screen recording of the results with 0.27$ circled in green, 3 points (audience, creative, small budget), CTA to WhatsApp for sponsoring. Never show client names, payment details or ad account IDs.

## Hook library (from Mustafa's brief; use in the first 2-3 seconds, Darija/French mix)
- Problem & solution: "تحرق البادجت في السبونسور بلا مبيعات؟ هذا هو الحل" / "راك تخسر في Facebook Ads؟ شوف هذه الطريقة".
- Shock / myth-busting: "تخدم متجرين في نفس الوقت = غلط يضيع أرباحك" / "كل ما تعرفه على الـ Pixel غلط".
- Numbers / proof: "411 زبون بـ 112$" / "من 0 لأول 100 طلبية في أسبوع" (only with real numbers).
- Curiosity gap: "السر لي يخلي الكليان يكمل الشراء" / "3 أخطاء تدمر متجرك على Foorweb أو Builddz".
- Niche call-out: "إذا راك تخدم E-commerce في الجزائر، الفيديو هذا ليك" / "لكل صاحب صفحة ودروبشيبر، اسمع مليح".
- Script table format for a new reel: seconds | on-screen text hook | voiceover | visuals/B-roll/transitions | SFX. Typical length 30-45 s.
- B-roll ideas: screen recordings of Meta Ads Manager, Foorweb / Builddz dashboards, zoom-in on key buttons.

## Open points to confirm with Mustafa
- Handle: confirmed link is @kabli_ms, but his latest brief wrote "kabli.ms" — keep @kabli_ms unless he says otherwise.
- Palette: brief suggested Royal Blue / Emerald / Charcoal / White (more modern); current tool uses Midnight Blue #1A365D / Electric Blue #3182CE / Growth Green #38A169. Waiting for his choice.
- Fonts: brief suggests Cairo/Tajawal for Arabic, Montserrat/Inter for Latin; current captions use Anton (Latin) and DejaVu Sans Bold (Arabic).
- Logo idea: geometric K+M monogram with a rising arrow (not made yet).

## Logo (made by Claude, `python3 tools/make_logo.py` -> assets/brand/)
- Geometric K+M monogram, green rising arrow as the K's upper arm, on Midnight Blue. Files: logo_mark_navy (profile pic), logo_mark_transparent_dark / _white (overlays), logo_horizontal_navy (banner), SVG sources.
- Canva logo candidate 1 saved to his account (design DAHXMVIM1B8, edit: https://www.canva.com/d/Oao8dSbZ2n4UWh2), exported as assets/brand/logo_canva_v1.png. Reads "MK" with some merged-letter artifacts; 3 other candidates not saved yet.

## Visual identity pack for e-commerce tips (tools/make_identity.py -> assets/brand/identity/)
- brand_board.png (palette, fonts, rules), reel_cover_template.png (1080x1920), tip_post_template.png (1080x1350), highlight_{tips,ads,store,results}.png (IG highlight covers).
- Fonts in tools/fonts: Anton (Latin headlines/captions), Montserrat Bold (labels), Tajawal ExtraBold/Bold (Arabic). Pillow+raqm shapes Arabic itself: do NOT use arabic-reshaper/bidi.
- Rules: one green accent word per phrase, caption max 3 words, hook in 2 seconds, CTA = WhatsApp 0550 20 54 64, handle @kabli_ms, K+M mark bottom-left.
- Canva: 4 tip-post candidates generated (not saved yet): _rXdS_rJ-gyblqT, hYZZQ2jVaOQ9_nl, OZ25760xbuiCkT9, t0aEF9vkqn9Y43U (canva.com/d/...).
