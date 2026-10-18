/* Garment illustrations used until a product has real photos.
   Every garment is drawn in a 400x480 box and tinted from one hex colour.
   Shading/seams are colour-agnostic overlays (see the sprite in index.html). */
(function () {
  'use strict';

  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const parse = (hex) => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const toHex = (rgb) => `#${rgb.map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
  const mix = (hex, target, t) => {
    const a = parse(hex);
    const b = parse(target);
    return toHex(a.map((v, i) => v + (b[i] - v) * t));
  };
  const luminance = (hex) => {
    const [r, g, b] = parse(hex).map((v) => v / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const ORANGE = '#ff4d00';

  function palette(hex) {
    const lum = luminance(hex);
    const isOrange = Math.abs(parse(hex)[0] - 255) < 30 && parse(hex)[2] < 60;
    return {
      // near-black garments are lifted slightly so they stay readable on dark stages
      base: lum < 0.06 ? mix(hex, '#ffffff', 0.08) : hex,
      dark: mix(hex, '#000000', 0.38),
      light: mix(hex, '#ffffff', 0.16),
      // seams & stitching: light on dark garments, dark on light ones
      seam: lum > 0.55 ? 'rgba(0,0,0,.30)' : 'rgba(0,0,0,.55)',
      stitch: lum > 0.55 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.22)',
      accent: isOrange ? '#ffffff' : ORANGE,
      mark: lum > 0.5 ? 'sk-mark-dark' : 'sk-mark',
    };
  }

  // A filled silhouette with shared shading on top.
  const body = (d, fill) =>
    `<path d="${d}" fill="${fill}"/><path d="${d}" fill="url(#sk-shade)" stroke="rgba(255,255,255,.2)" stroke-width="1.2" stroke-linejoin="round"/>`;
  const line = (d, stroke, w = 2, extra = '') =>
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const mark = (p, x, y, w) =>
    `<use href="#${p.mark}" x="${x}" y="${y}" width="${w}" height="${(w * 508) / 808}"/>`;

  const SHAPES = {
    tshirt(p) {
      const d = 'M160 58 L98 80 Q84 85 76 100 L34 168 Q30 176 38 181 L76 202 Q84 205 88 198 L112 158 L116 408 Q116 420 128 420 L272 420 Q284 420 284 408 L288 158 L312 198 Q316 205 324 202 L362 181 Q370 176 366 168 L324 100 Q316 85 302 80 L240 58 Q200 96 160 58 Z';
      return [
        body(d, p.base),
        line('M98 80 L112 158 M302 80 L288 158', p.seam, 2),
        line('M160 58 Q200 100 240 58', p.dark, 11),
        line('M160 58 Q200 100 240 58', p.stitch, 1.5, 'stroke-dasharray="4 4" transform="translate(0,7)"'),
        line('M118 402 L282 402', p.stitch, 1.5, 'stroke-dasharray="5 4"'),
        line('M50 176 L80 190', p.stitch, 1.5, 'stroke-dasharray="4 4"'),
        line('M350 176 L320 190', p.stitch, 1.5, 'stroke-dasharray="4 4"'),
        mark(p, 226, 118, 44),
        `<rect x="262" y="404" width="22" height="16" fill="${p.accent}"/>`,
      ].join('');
    },

    polo(p) {
      const d = 'M162 56 L98 80 Q84 85 76 100 L34 168 Q30 176 38 181 L76 202 Q84 205 88 198 L112 158 L116 408 Q116 420 128 420 L272 420 Q284 420 284 408 L288 158 L312 198 Q316 205 324 202 L362 181 Q370 176 366 168 L324 100 Q316 85 302 80 L238 56 Q200 78 162 56 Z';
      return [
        body(d, p.base),
        line('M98 80 L112 158 M302 80 L288 158', p.seam, 2),
        // collar
        `<path d="M162 56 L142 92 L184 116 L200 84 Z" fill="${p.dark}"/><path d="M238 56 L258 92 L216 116 L200 84 Z" fill="${p.dark}"/>`,
        `<path d="M162 56 L142 92 L184 116 L200 84 Z M238 56 L258 92 L216 116 L200 84 Z" fill="url(#sk-shade)"/>`,
        line('M200 84 L200 190', p.seam, 2),
        '<circle cx="200" cy="130" r="3.4" fill="rgba(255,255,255,.55)"/><circle cx="200" cy="162" r="3.4" fill="rgba(255,255,255,.55)"/>',
        line('M50 176 L80 190 M350 176 L320 190', p.accent, 4),
        line('M118 402 L282 402', p.stitch, 1.5, 'stroke-dasharray="5 4"'),
        mark(p, 232, 138, 36),
      ].join('');
    },

    hoodie(p) {
      const d = 'M150 76 L100 94 Q78 102 68 132 L40 300 Q38 312 48 316 L86 322 Q96 323 99 312 L118 204 L118 410 Q118 424 132 424 L268 424 Q282 424 282 410 L282 204 L301 312 Q304 323 314 322 L352 316 Q362 312 360 300 L332 132 Q322 102 300 94 L250 76 Z';
      return [
        body(d, p.base),
        // hood
        `<path d="M142 80 Q144 18 200 14 Q256 18 258 80 Q240 112 200 118 Q160 112 142 80 Z" fill="${p.dark}"/>`,
        `<path d="M142 80 Q144 18 200 14 Q256 18 258 80 Q240 112 200 118 Q160 112 142 80 Z" fill="url(#sk-shade)"/>`,
        '<path d="M162 76 Q200 108 238 76 Q234 40 200 36 Q166 40 162 76 Z" fill="rgba(0,0,0,.6)"/>',
        line('M184 112 L180 186 M216 112 L220 186', '#e6e6e8', 3),
        '<circle cx="180" cy="190" r="4" fill="#e6e6e8"/><circle cx="220" cy="190" r="4" fill="#e6e6e8"/>',
        // pocket + ribs
        line('M142 304 L258 304 L276 380 L124 380 Z', p.seam, 2),
        line('M142 304 L124 380 M258 304 L276 380', p.stitch, 1.5, 'stroke-dasharray="4 4"'),
        line('M118 406 L282 406', p.seam, 3),
        line('M44 304 L90 312 M356 304 L310 312', p.seam, 3),
        line('M104 98 L118 204 M296 98 L282 204', p.seam, 2),
        line('M60 150 L48 296', p.accent, 4),
        mark(p, 232, 134, 40),
      ].join('');
    },

    sweat(p) {
      const d = 'M162 60 L100 82 Q78 90 68 122 L42 300 Q40 312 50 316 L88 322 Q98 323 101 312 L120 196 L120 408 Q120 422 134 422 L266 422 Q280 422 280 408 L280 196 L299 312 Q302 323 312 322 L350 316 Q360 312 358 300 L332 122 Q322 90 300 82 L238 60 Q200 100 162 60 Z';
      return [
        body(d, p.base),
        line('M162 60 Q200 104 238 60', p.dark, 13),
        line('M168 64 Q200 98 232 64', p.stitch, 1.5, 'stroke-dasharray="3 3"'),
        line('M120 404 L280 404', p.seam, 3),
        line('M46 304 L92 312 M354 304 L308 312', p.seam, 3),
        line('M104 88 L120 196 M296 88 L280 196', p.seam, 2),
        line('M62 140 L50 296', p.accent, 4),
        mark(p, 226, 124, 44),
      ].join('');
    },

    knit(p) {
      const d = 'M162 60 L100 82 Q78 90 68 122 L42 300 Q40 312 50 316 L88 322 Q98 323 101 312 L120 196 L120 396 Q120 410 134 410 L266 410 Q280 410 280 396 L280 196 L299 312 Q302 323 312 322 L350 316 Q360 312 358 300 L332 122 Q322 90 300 82 L238 60 Q200 100 162 60 Z';
      const cable = (x) => line(`M${x} 130 q14 14 0 28 q-14 14 0 28 q14 14 0 28 q-14 14 0 28 q14 14 0 28 q-14 14 0 28 q14 14 0 28`, p.stitch, 2.4);
      const ribs = (x1, x2, y, h) => {
        let out = '';
        for (let x = x1; x <= x2; x += 8) out += `<path d="M${x} ${y} v${h}" stroke="${p.seam}" stroke-width="2"/>`;
        return out;
      };
      return [
        body(d, p.base),
        line('M162 60 Q200 104 238 60', p.dark, 13),
        // vertical ribbing: hem + cuffs
        ribs(122, 278, 380, 30),
        ribs(54, 96, 300, 18),
        ribs(306, 348, 300, 18),
        // cable panel
        cable(172), cable(200), cable(228),
        line('M150 120 L150 372 M250 120 L250 372', p.seam, 2),
        line('M104 88 L120 196 M296 88 L280 196', p.seam, 2),
        `<rect x="256" y="392" width="24" height="5" fill="${p.accent}"/>`,
      ].join('');
    },

    jacket(p) {
      const d = 'M158 56 L100 80 Q78 90 68 124 L42 308 Q40 320 50 322 L88 328 Q98 329 101 318 L120 206 L120 410 Q120 422 134 422 L266 422 Q280 422 280 410 L280 206 L299 318 Q302 329 312 328 L350 322 Q360 320 358 308 L332 124 Q322 90 300 80 L242 56 Z';
      return [
        body(d, p.base),
        // stand-up collar
        `<path d="M158 56 L156 28 Q200 44 244 28 L242 56 Q200 82 158 56 Z" fill="${p.dark}"/><path d="M158 56 L156 28 Q200 44 244 28 L242 56 Q200 82 158 56 Z" fill="url(#sk-shade)"/>`,
        // zip
        line('M200 82 L200 420', '#d6d8dc', 3),
        line('M200 82 L200 420', 'rgba(0,0,0,.35)', 1, 'stroke-dasharray="3 5"'),
        '<rect x="193" y="84" width="14" height="22" rx="3" fill="#d6d8dc"/>',
        // pockets
        line('M140 330 L172 330 M228 330 L260 330', p.seam, 3),
        line('M104 88 L120 206 M296 88 L280 206', p.seam, 2),
        line('M120 408 L280 408', p.seam, 3),
        // sleeve stripes
        line('M70 132 L46 304', p.accent, 5),
        line('M330 132 L354 304', p.accent, 5),
        mark(p, 226, 122, 40),
      ].join('');
    },

    jogger(p) {
      const d = 'M108 40 L292 40 L300 120 Q306 250 288 372 L288 410 Q288 424 274 424 L238 424 Q226 424 224 410 L208 176 Q200 156 192 176 L176 410 Q174 424 162 424 L126 424 Q112 424 112 410 L112 372 Q94 250 100 120 Z';
      return [
        body(d, p.base),
        `<path d="M108 40 L292 40 L294 78 L106 78 Z" fill="${p.dark}"/><path d="M108 40 L292 40 L294 78 L106 78 Z" fill="url(#sk-shade)"/>`,
        line('M186 78 Q176 112 170 142 M214 78 Q224 112 230 142', '#e6e6e8', 3),
        '<circle cx="170" cy="146" r="4" fill="#e6e6e8"/><circle cx="230" cy="146" r="4" fill="#e6e6e8"/>',
        line('M200 78 L200 172', p.seam, 2),
        // cuffs
        `<path d="M112 392 L176 392 L176 424 L112 424 Z M224 392 L288 392 L288 424 L224 424 Z" fill="${p.dark}"/>`,
        line('M104 96 Q99 250 114 385', p.accent, 5),
        line('M296 96 Q301 250 286 385', p.accent, 5),
        line('M124 90 L146 130 M276 90 L254 130', p.stitch, 1.5, 'stroke-dasharray="4 4"'),
        mark(p, 244, 92, 28),
      ].join('');
    },

    pants(p) {
      const d = 'M108 40 L292 40 L304 124 Q312 260 308 410 Q308 424 294 424 L232 424 Q220 424 218 410 L208 176 Q200 156 192 176 L182 410 Q180 424 168 424 L106 424 Q92 424 92 410 Q88 260 96 124 Z';
      return [
        body(d, p.base),
        `<path d="M108 40 L292 40 L294 78 L106 78 Z" fill="${p.dark}"/><path d="M108 40 L292 40 L294 78 L106 78 Z" fill="url(#sk-shade)"/>`,
        line('M186 78 Q176 112 170 142 M214 78 Q224 112 230 142', '#e6e6e8', 3),
        line('M200 78 L200 172', p.seam, 2),
        line('M100 96 Q94 250 98 404', p.accent, 5),
        line('M300 96 Q306 250 302 404', p.accent, 5),
        line('M96 404 L180 404 M220 404 L304 404', p.stitch, 1.5, 'stroke-dasharray="5 4"'),
        mark(p, 244, 92, 28),
      ].join('');
    },

    shorts(p) {
      const d = 'M108 110 L292 110 L304 150 L324 330 Q326 346 310 348 L234 352 Q222 352 218 338 L204 238 Q200 222 196 238 L182 338 Q178 352 166 352 L90 348 Q74 346 76 330 L96 150 Z';
      return [
        body(d, p.base),
        `<path d="M108 110 L292 110 L296 148 L104 148 Z" fill="${p.dark}"/><path d="M108 110 L292 110 L296 148 L104 148 Z" fill="url(#sk-shade)"/>`,
        line('M188 148 Q180 172 176 196 M212 148 Q220 172 224 196', '#e6e6e8', 3),
        line('M200 148 L200 232', p.seam, 2),
        line('M100 162 L84 326', p.accent, 6),
        line('M300 162 L316 326', p.accent, 6),
        line('M80 332 L178 336 M222 336 L320 332', p.stitch, 1.5, 'stroke-dasharray="5 4"'),
        mark(p, 240, 156, 30),
      ].join('');
    },

    cap(p) {
      const dome = 'M96 284 Q92 118 200 106 Q308 118 304 284 Z';
      const brim = 'M92 280 Q200 304 308 280 L330 304 Q200 346 70 304 Z';
      return [
        body(dome, p.base),
        body(brim, p.dark),
        line('M200 108 L200 284 M146 124 Q130 200 140 284 M254 124 Q270 200 260 284', p.seam, 2),
        '<circle cx="200" cy="108" r="9" fill="rgba(0,0,0,.45)"/>',
        line('M94 268 Q200 302 306 268', p.accent, 5),
        mark(p, 164, 168, 72),
        line('M78 302 Q200 336 322 302', p.stitch, 1.5, 'stroke-dasharray="5 4"'),
      ].join('');
    },

    bag(p) {
      const d = 'M64 236 Q64 196 108 196 L292 196 Q336 196 336 236 L336 348 Q336 384 300 384 L100 384 Q64 384 64 348 Z';
      return [
        line('M120 196 Q120 118 200 118 Q280 118 280 196', p.dark, 14),
        line('M120 196 Q120 118 200 118 Q280 118 280 196', p.stitch, 1.5, 'stroke-dasharray="4 4"'),
        body(d, p.base),
        line('M64 262 L336 262', p.seam, 3),
        line('M200 196 L200 262', p.seam, 2),
        `<rect x="104" y="296" width="92" height="60" rx="8" fill="${p.dark}"/><rect x="104" y="296" width="92" height="60" rx="8" fill="url(#sk-shade)"/>`,
        line('M64 332 L104 332 M296 332 L336 332', p.accent, 6),
        mark(p, 226, 304, 70),
      ].join('');
    },

    socks(p) {
      const sock = (dx, dy, fill, rot) => `<g transform="translate(${dx} ${dy}) rotate(${rot} 200 240)">
        ${body('M156 70 L238 70 L238 262 Q238 292 266 304 L322 328 Q352 344 342 384 L326 410 Q308 426 276 414 L150 364 Q124 350 130 318 Z', fill)}
        <path d="M156 70 L238 70 L238 100 L156 100 Z" fill="rgba(255,255,255,.18)"/>
        ${line('M156 82 L238 82 M156 94 L238 94', 'rgba(0,0,0,.4)', 2)}
        <path d="M262 304 L322 328 Q352 344 342 384 L326 410 Q320 416 312 416 L300 330 Z" fill="${p.accent}" opacity=".9"/>
      </g>`;
      return sock(-34, 10, p.dark, -6) + sock(34, 0, p.base, 4);
    },
  };

  // Jacket + jogger shown together.
  SHAPES.ensemble = (p) => `
    <g transform="translate(34 4) scale(.74)">${SHAPES.jacket(p)}</g>
    <g transform="translate(150 196) scale(.66)">${SHAPES.jogger(p)}</g>`;

  const kinds = Object.keys(SHAPES);

  /** Inner SVG markup (no <svg> wrapper). */
  function garment(kind, hex) {
    const p = palette(/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#17181a');
    return (SHAPES[kinds.includes(kind) ? kind : 'tshirt'])(p);
  }

  /** Complete <svg> element, ready to drop into a card/gallery. */
  function art(kind, hex) {
    return `<svg class="art" viewBox="0 0 400 480" role="img" aria-hidden="true" focusable="false">
      <ellipse cx="200" cy="452" rx="130" ry="12" fill="rgba(0,0,0,.45)"/>
      ${garment(kind, hex)}
    </svg>`;
  }

  window.SK_ART = { art, garment, kinds };
})();
