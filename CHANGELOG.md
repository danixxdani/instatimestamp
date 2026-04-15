# Changelog

All notable changes to InstaTimestamp will be documented in this file.

## [1.1.0] - 2026-04-15

### Added
- On/off toggle to show or hide timestamps on Instagram posts
- Timezone selector rebuilt as a single searchable combobox (search + dropdown combined)
- UTC fallback when browser timezone cannot be detected

### Changed
- Timezone changes now apply instantly to the page without a Save button
- Improved real-time sync between popup and Instagram tab via `chrome.tabs.sendMessage`

### Fixed
- Popup crash caused by removed Save button reference (`btnSave` null error)

---

## [1.0.0] - 2026-04-08

### Added
- Initial release
- Displays exact timestamp next to Instagram's relative times (e.g. "2h" → "Apr 8, 2026, 9:05:32 PM PST")
- 12-hour format with seconds and timezone abbreviation (PST, KST, etc.)
- 120+ timezone support with city/country search
- Popup UI with live clock preview of selected timezone
- 6 language support: English, Spanish, Portuguese, Korean, Japanese, Chinese
- Auto-detects browser/OS language with English fallback
- Auto-detects new posts as you scroll (Instagram SPA support)
- Buy Me a Coffee button linking to support page
