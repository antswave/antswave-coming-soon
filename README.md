# Ants Wave — Coming Soon

[![Check & Deploy](https://github.com/antswave/antswave-coming-soon/actions/workflows/deploy.yml/badge.svg)](https://github.com/antswave/antswave-coming-soon/actions/workflows/deploy.yml)

An animated "Coming Soon" landing page for **Ants Wave**, with a live countdown to launch on **1 December 2026**.

**Live site:** https://antswave.com/

![Ants Wave coming soon page](screenshots/preview.png)

## Features

- Live countdown (days, hours, minutes, seconds) and a progress bar to launch day
- Ink background with a subtle grid, stars and shooting stars
- A canvas "ant wave": thousands of tiny ants moving together as one wave
- Wandering ants that leave trails and carry food back to their nest
- Click or tap anywhere to drop food for the ants
- Story captions that play through the Ants Wave message
- Bengali tagline (আসছে খুব শীঘ্রই) and a responsive layout for mobile and desktop
- Favicon set (SVG with dark-mode variant, ICO, Apple touch icon), web manifest and Open Graph / Twitter preview image
- Respects `prefers-reduced-motion`

## Brand

Follows the Ants Wave brand guideline (v1.1 colour update).

| Token | Hex | Use |
| --- | --- | --- |
| Ant Amber | `#FFB020` | Primary: wave, buttons, highlights |
| Colony Violet | `#2A0560` | Secondary: ant and wordmark on light backgrounds |
| Tide Teal | `#0E7490` / `#3CC0D8` | Supporting accent |
| Ink | `#14101F` | Dark background |
| neutral/800 | `#241F33` | Dark surfaces |

- Text on amber is Ink, never white. Amber text is used on Ink only.
- No violet or gradient backgrounds.
- Headings: Anek Latin. Body: Hind Siliguri. Bangla headings: Anek Bangla.
- Logo: the reversed horizontal lockup on dark backgrounds (`images/logo-horizontal-reversed.svg`).

## Tech stack

- HTML5 and vanilla JavaScript (no build step)
- [Tailwind CSS](https://tailwindcss.com/) via CDN, plus custom CSS in `css/style.css`
- Fonts: Anek Latin, Anek Bangla and Hind Siliguri (Google Fonts)

## Project structure

```
.
├── index.html                  # Page markup
├── favicon.ico                 # Fallback favicon
├── site.webmanifest            # Web app manifest
├── css/style.css               # Custom styles and animations
├── js/script.js                # Countdown, ants, wave canvas and captions
├── images/                     # Logo, favicons, OG image and other assets
├── screenshots/preview.png     # README screenshot
└── .github/workflows/deploy.yml
```

## Run locally

No install needed. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` in a browser.

## Deployment

The site deploys to GitHub Pages automatically through GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

1. **Check** runs on every push and pull request to `main`:
   - lints HTML with HTMLHint
   - checks JavaScript syntax with `node --check`
   - confirms that every local asset referenced in `index.html` exists
2. **Deploy** runs only after the checks pass, and only on pushes to `main` (pull requests are checked but never deployed).

You can also start a deploy by hand from the **Actions** tab ("Run workflow").

To change the launch date, update the target date in `js/script.js` and the "Launch" label in `index.html`.

## License

© 2026 Ants Wave. All rights reserved.
