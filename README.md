# TabFlow

Smart tab lifecycle manager for Chrome — auto-close inactive tabs and recover them anytime.

## Features

**Auto-close tabs by rule**
- Set per-site rules: close after inactive time or total open duration
- Subdomains auto-matched (e.g. `reddit.com` covers `old.reddit.com`)
- Human Activity Guard: delays close if you just interacted with the tab
- Protected domains whitelist overrides all rules

**Always recoverable**
- Every auto-closed tab is saved to Past (stash) for 7/14/30 days
- Restore single tabs or entire groups with one click
- 5-second undo window after auto-close

**Popup (Now / Soon / Past)**
- **Now** — all open tabs; auto-groups by domain when 10+ tabs
- **Soon** — tabs with active countdowns, sorted by urgency, live timers
- **Past** — stashed tabs, grouped by time (today, yesterday, this week...)
- Search across all views
- Intent-based quick rule creation: "Just browsing" / "I'll come back" / "Important"

**Options page**
- Welcome onboarding + Quick Setup with presets (Social, Video, Shopping)
- Full rule CRUD with live preview of matching tabs
- Settings: language, stash expiry, protected domains
- Backup & restore (JSON export/import)

**i18n**
- English and 简体中文, auto-detected from browser language

## Tech Stack

- TypeScript (strict) + React 18 + Tailwind CSS
- Vite + CRXJS (Chrome MV3)
- Chrome Storage API (local) + Chrome Alarms API

## Quick Start

```bash
npm install
npm run build
```

Load into Chrome: `chrome://extensions` → Developer mode → Load unpacked → select `dist/`

Dev mode with hot reload:

```bash
npm run dev
```

## Project Structure

```
src/
├── background/     # Service Worker: rule engine, alarm manager, stash manager
├── popup/          # Popup UI: tabs, components, hooks
├── options/        # Settings, onboarding wizard, rule management
└── shared/         # Types, storage, i18n, constants
_locales/
├── en/messages.json
└── zh_CN/messages.json
```

## Docs

- [`docs/architecture.md`](docs/architecture.md) — Architecture: data models, components, core flows
- [`docs/tabflow-ui-gallery.jsx`](docs/tabflow-ui-gallery.jsx) — UI prototype, run standalone to preview all screens
- [`docs/tabflow-dev-spec.md`](docs/tabflow-dev-spec.md) — Original spec (historical reference)

## Privacy

TabFlow stores all data locally. No data is collected or transmitted. See [PRIVACY.md](PRIVACY.md).

## License

[MIT](LICENSE)
