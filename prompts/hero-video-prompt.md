# CC Hero Video — Generation Prompts

Use these prompts with Runway Gen-3 Alpha, Kling, or Luma Dream Machine to generate
the hero background video for the Crown and Compass homepage.

**Target file:** `public/hero-bg.mp4`
**Duration:** 4–8 seconds, seamless loop
**Aspect ratio:** 16:9 (landscape) or 3:2
**Resolution:** 1280×720 minimum, 1920×1080 preferred

---

## Runway Gen-3 Alpha

> A dark forest clearing at dusk. Warm amber and orange firelight glows softly from off-screen left, casting long shadows across mossy ground and dark tree trunks. Slow, deliberate camera pull-back, barely perceptible. Thin ground fog drifts at ankle level. No people, no faces, no movement except light and mist. Seamless loop-ready. Cinematic film grain. Near-black shadows, amber warmth, deep forest darkness. Color palette: #0f1117 shadows, #c9853a amber glow. Atmospheric, contemplative, masculine. Shot on 35mm.

---

## Kling (v1.5 or v1.6)

> Dark pine forest at dusk, amber firelight from off-frame, slow camera drift backward, ground-level fog, no people, seamless loop, cinematic grain, dark atmospheric mood, warm amber tones against near-black shadows, moody and still

---

## Luma Dream Machine

> Cinematic slow pull-back shot through dark forest clearing at dusk. Warm amber firelight visible off-screen, casting golden glow on dark tree bark and mossy ground. Thin fog at ground level. Completely still except for drifting mist and subtle light flicker. No people or animals. Film grain. Loop-ready. Palette: near black (#0f1117) and amber (#c9853a). Contemplative masculine atmosphere.

---

## Post-Processing Notes

After generating:
1. Trim to a clean loop point (start and end frame should match)
2. Compress with HandBrake or ffmpeg: `ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -an output.mp4`
3. Strip audio (`-an` flag above)
4. Target file size: under 8MB for web performance
5. Place at `public/hero-bg.mp4`

The site is built to gracefully fall back to the plain dark background if the file is absent.
The video plays at `opacity: 0.18` — subtle texture, not a distraction.
