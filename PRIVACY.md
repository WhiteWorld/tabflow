# Privacy Policy — TabFlow

**Last updated:** February 23, 2026

## Overview

TabFlow is a browser extension that manages your tabs locally. We do not collect, store, or transmit any personal data.

## Data Storage

All data is stored locally on your device using `chrome.storage.local`:

- **Rules** you create (site domain + timing configuration)
- **Stashed tabs** (URL and title of auto-closed tabs, kept for 7 days)
- **Settings** (language preference, stash expiry duration)
- **Runtime state** (active tab timers and managed tab metadata)

No data is sent to any server owned or operated by the developer.

## Permissions

| Permission | Purpose |
|---|---|
| `tabs` | Read tab URLs and titles to match rules, display tab lists, and restore stashed tabs |
| `alarms` | Schedule tab auto-close timers (required for Manifest V3 Service Workers) |
| `storage` | Persist rules, stashed tabs, and settings locally across browser sessions |

## Optional AI Feature

TabFlow includes an **optional** AI tab analysis feature that is **disabled by default**. If you choose to enable it:

- Tab titles and domain names (not full URLs or page content) are sent to your chosen AI provider (Anthropic Claude or DeepSeek)
- You provide your own API key, which is stored locally on your device
- No data passes through any intermediary server — requests go directly from your browser to the AI provider
- Refer to [Anthropic's Privacy Policy](https://www.anthropic.com/privacy) or [DeepSeek's Privacy Policy](https://www.deepseek.com/privacy) for how they handle API requests

## Third Parties

TabFlow does not use analytics, telemetry, crash reporting, or any third-party tracking services.

## Children's Privacy

TabFlow does not knowingly collect any data from children under the age of 13.

## Changes

If this policy is updated, the new version will be posted in this repository with an updated date.

## Contact

If you have questions about this policy, please open an issue at [github.com/WhiteWorld/tabflow](https://github.com/WhiteWorld/tabflow/issues).
