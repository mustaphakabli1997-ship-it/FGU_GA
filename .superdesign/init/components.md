# Shared UI components

Plain static site (single `index.html`): Tailwind via CDN (`cdn.tailwindcss.com`), iconify-icon web component for icons, vanilla JS. There is **no shared component directory** and no component library (no React/Vue/shadcn).

Reusable patterns are inline in `/index.html` (see `pages.md` for the full source):
- Pill button (dark): `px-6 py-3 rounded-full text-sm font-medium bg-[#1A1A1A] text-white hover:scale-105`
- Pill input: `bg-white border border-[#C4A78F]/50 rounded-full px-6 py-3 text-sm`
- Collection card: rounded-3xl, aspect-[4/5], pink (`#F8DDE3`) or linen (`.linen`) variant, number badge, round icon button
- Logo badge: pink circle, script "Melina" (Allura) + spaced "MODE" (Montserrat) + beige underline, heart icon
