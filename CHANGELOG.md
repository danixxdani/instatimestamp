# Changelog

All notable changes to InstaTimestamp will be documented in this file.

## [1.1.1] - 2026-10-15

### Changed
- Store name and short description rewritten in all 6 languages to include search keywords ("exact time", "post date") and lead with the user benefit
- Short description now mentions that no data is collected
- New app icon (gradient clock), replacing the Instagram-style gradient icon; 16px version has thickened strokes for toolbar legibility
- Popup header now shows the new logo instead of the ⏰ emoji on an Instagram-style gradient

### Added
- `store-listing/` with the Chrome Web Store detailed description for each language, ready to paste into the developer dashboard

---

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
