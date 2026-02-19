# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TabFlow is a Chrome Manifest V3 extension for intelligent tab lifecycle management. It auto-closes inactive or long-running tabs while saving them to a recoverable "stash". The project is in specification phase — `docs/tabflow-dev-spec.md` is the authoritative source of truth for all implementation decisions.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Frontend**: React 18 + Tailwind CSS
- **Build**: Vite + CRXJS Chrome extension plugin
- **Storage**: Chrome Storage API (local only — no sync in MVP)
- **Timing**: Chrome Alarms API (Service Worker-safe)

## Commands

Once implemented, the standard workflow will be:

```bash
npm install        # Install dependencies
npm run dev        # Dev build with hot reload (load dist/ in chrome://extensions)
npm run build      # Production build
```

To test: Go to `chrome://extensions` → Enable Developer mode → Load unpacked → select `dist/`

## Architecture

```
Background Service Worker (persistent state via chrome.storage.local)
├── Rule Engine       — matches tabs to rules by domain + trigger type
├── Alarm Manager     — fires closures at scheduled times
└── Stash Manager     — saves closed tabs, 7-day expiry, undo support

Popup (380×580px)
├── Now   — all open tabs
├── Soon  — tabs with active countdowns
└── Past  — stashed (recoverable) tabs

Options Page
├── Welcome wizard (first install onboarding)
├── Rule CRUD
└── Settings (language, stash expiry, AI provider/key)

AI Module (optional)
├── Claude Haiku provider
└── DeepSeek provider
```

### Key Design Decisions

- **All runtime state in `chrome.storage.local`** — never in memory, because Service Workers can sleep
- **Human Activity Guard**: Delays auto-close by 1 minute if user interacted within the last 15 seconds
- **Inactive detection**: Multi-signal via `chrome.tabs.onActivated` + `windows.onFocusChanged`
- **Undo**: 5-second window via badge + popup banner (no host permissions required in MVP)
- **Rule names are auto-generated** as `"domain · Xmin"` — no manual naming
- **Protected domains whitelist** overrides all rules
- **AI tab clustering**: Groups 100+ tabs by domain before sending to LLM to avoid token explosion
- **Rule trigger types**: `inactive` (user hasn't viewed the tab) or `openDuration` (total open time)
- **Rule action**: `closeStash` only in MVP (close and save to stash)

## Source Layout (planned)

```
src/
├── background/     # Service Worker: rule-engine.ts, alarm-manager.ts, stash-manager.ts
├── popup/          # Popup UI components and hooks
├── options/        # Settings page and onboarding wizard
├── ai/             # provider.ts (abstract), claude-provider.ts, deepseek-provider.ts
└── shared/         # types.ts, storage.ts, constants.ts, i18n.ts
_locales/
├── en/messages.json
└── zh_CN/messages.json
```

## Reference Docs

- **`docs/tabflow-dev-spec.md`** — complete spec: data models, flow diagrams, UI specs, storage structure, Manifest V3 config
- **`docs/tabflow-ui-gallery.jsx`** — full UI prototype (18 screens, dark theme, green accent `#3CE882`); run standalone to preview all screens
