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
- Never use emoji inside burned subtitles (render as boxes).
- Colour grade: warm golden/orange, a bit more contrast + saturation, soft dark vignette (face lit, edges dark). Option `--grade natural` if the footage is already warm.
- Extras seen in the reference (to add later when assets exist): light-leak/transition flashes on punchy moments, falling-money overlay for money topics, cutout face over blurred warm background.
- Tool: `python3 tools/edit_reel.py videos/reelN.mov --srt subs.srt` — mark accent words with *stars* in the .srt (e.g. `SPONSOR MA YJIBLEK *TLABAT*`).
