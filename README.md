# Wedding Invitation Template: Elegant Envelope

A self-contained, animated wedding invitation prototype that runs by opening `index.html` in any modern browser. No build step, no server required.

## Features

- **Envelope opening animation** — Flap lifts with spring easing, letter slides out
- **Scroll-triggered reveals** — Cover → Names → Date/Venue → Message → Gallery → Schedule → RSVP
- **Ambient effects** — Floating petals, sparkle bursts on hover
- **Photo gallery** — Lightbox with keyboard navigation
- **Schedule accordion** — Expandable event cards
- **RSVP form** — Client-side validation with submit animation
- **Full RTL support** — Works in Arabic (`dir="rtl"` on `<html>`)
- **Mobile-first responsive** — Fluid typography, breakpoints at 320/480/768/1024/1440px
- **Accessibility** — Semantic HTML, ARIA labels, focus states, `prefers-reduced-motion`
- **Performance** — CSS-first animations, `< 100KB` gzipped (excl. fonts)

## Quick Start

```bash
# Just open in browser — no server needed
# Double-click index.html or:
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or serve locally for testing:
```bash
python -m http.server 8000
# Then open http://localhost:8000
```

## Template Structure

```
template-01-elegant-envelope/
├── index.html        # Complete prototype (all placeholders as {{TOKEN}})
├── styles.css        # Template-specific styles
├── script.js         # Animation orchestration
└── assets/           # 28 SVG + 2 WebP assets
    ├── envelope-base.svg
    ├── envelope-flap.svg
    ├── wax-seal.svg
    ├── letter-paper.svg
    ├── petal-01.svg ... petal-05.svg
    ├── sparkle-particle.svg
    ├── floral-corner-tl.svg ... br.svg
    ├── divider-flourish.svg, divider-ornate.svg
    ├── icon-*.svg (14 icons)
    ├── cover-placeholder.webp (800×1200)
    └── gallery-placeholder.webp (400×400)
```

## Placeholders (for CMS Integration)

Replace these `{{TOKEN}}` values with your content:

| Token | Section | Example |
|-------|---------|---------|
| `{{COUPLE_NAMES}}` | Envelope flap, cover | `Emma & James` |
| `{{COUPLE_NAME_1}}` | Names section | `Emma` |
| `{{COUPLE_NAME_2}}` | Names section | `James` |
| `{{WEDDING_DATE}}` | Cover, date section | `Saturday, June 15, 2025` |
| `{{WEDDING_DATE_ISO}}` | `<time datetime="">` | `2025-06-15` |
| `{{WEDDING_TIME}}` | Date section | `4:00 PM` |
| `{{WEDDING_TIME_ISO}}` | `<time datetime="">` | `16:00` |
| `{{VENUE_NAME}}` | Cover, venue | `The Garden Pavilion` |
| `{{VENUE_ADDRESS}}` | Venue section | `Sonoma, California` |
| `{{INVITATION_TEXT}}` | Names section | `Together with their families...` |
| `{{PERSONAL_MESSAGE_P1}}` | Message section | `We are delighted to invite you...` |
| `{{PERSONAL_MESSAGE_P2}}` | Message section | `Your presence would mean the world...` |
| `{{GALLERY_TITLE}}` | Gallery section | `Our Journey` |
| `{{GALLERY_CAPTION_1}}` | Gallery item | `Engagement photo` |
| `{{SCHEDULE_TITLE}}` | Schedule section | `Celebration Schedule` |
| `{{RSVP_TITLE}}` | RSVP section | `Kindly Respond` |
| `{{RSVP_FORM}}` | RSVP section | *(your form HTML)* |
| `{{RSVP_SUBMIT_TEXT}}` | RSVP button | `Send RSVP` |
| `{{LOGO_MONOGRAM}}` | Wax seal | `<svg>...</svg>` |
| `{{FAVICON}}` | `<head>` | `/assets/favicon.ico` |

## RTL / Arabic Support

Add `dir="rtl"` and `lang="ar"` to `<html>`:

```html
<html lang="ar" dir="rtl" data-palette="warm">
```

All layouts, animations, and icons automatically mirror. Arabic fonts (Amiri, Noto Sans Arabic, Cairo) are included via self-hosted WOFF2.

## Palette Variants

Change `data-palette` on `<html>`:
- `data-palette="warm"` — Classic romance (default)
- `data-palette="cool"` — Modern elegance
- `data-palette="neutral"` — Timeless minimal

## Browser Support

- Chrome 90+, Firefox 88+, Safari 15+, Edge 90+
- iOS Safari 15+, Chrome Android 90+
- Requires: CSS Custom Properties, IntersectionObserver, ES6

## Performance

- Total size: ~45KB gzipped (excl. fonts)
- Lighthouse Mobile: Performance > 90
- 60fps on 5-year-old phones
- `prefers-reduced-motion`: Disables all animations instantly

## License

All assets are original. Fonts: SIL Open Font License (Google Fonts). Use freely in your platform.

---

**Delivered:** July 2026  
**Template ID:** `template-01-elegant-envelope`  
**Version:** 1.0.0