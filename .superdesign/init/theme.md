# Theme — Melina Mode

## Summary
- Colors: pink `#F8DDE3` (blush, hero badge/cards) · black `#1A1A1A` (text, primary buttons) · beige `#C4A78F` (accents, linen card) · white `#FFFFFF` · cream page bg `#FAF8F3`; badge border `#E7BFC8`.
- Fonts: Allura (script, headings/logo "Melina"), Montserrat 300–600 (body, "MODE" with wide tracking 0.35em).
- Radius: pill (`rounded-full`) for buttons/inputs, `rounded-3xl` for cards. Shadows soft (`shadow-xl`).
- Motion: scroll reveal (translateY 30px, 0.8s), card parallax, soft float on blobs, hero fade on scroll.
- Style: light, feminine, quiet-luxury fashion; linen texture; no dark mode.
- Tailwind via CDN, no config file.

## Raw CSS (index.html <style>)
```css
        :root {
            --pink: #F8DDE3;
            --black: #1A1A1A;
            --beige: #C4A78F;
            --white: #FFFFFF;
            --cream: #FAF8F3;
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background-color: var(--cream);
            color: var(--black);
            margin: 0;
            overflow-x: hidden;
        }

        .font-script { font-family: 'Allura', cursive; }

        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.active { opacity: 1; transform: translateY(0); }

        @keyframes float-soft {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
        }
        .animate-float { animation: float-soft 9s ease-in-out infinite; }

        .parallax-card-up { transform: translateY(var(--scroll-offset-up, 0px)); }
        .parallax-card-down { transform: translateY(var(--scroll-offset-down, 0px)); }

        /* Nav sits on the video banner: light text until scrolled */
        #main-nav:not(.scrolled) a:not(#nav-cta-link) { color: #fff; }

        .linen {
            background-color: #C4A78F;
            background-image:
                repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 3px),
                repeating-linear-gradient(90deg, rgba(0,0,0,.04) 0 1px, transparent 1px 3px);
        }
    ```
