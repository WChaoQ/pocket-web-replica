# Pocket Web Replica

An independent, mobile-first front-end study of the archived Pocket Android app's screen structure and interactions. The current scope is deliberately limited to **UI and interaction**; it does not implement real Pocket services, sign-in, syncing, article extraction, or persistence.

## Preview

This is a dependency-free static website. Open `index.html` locally, or enable GitHub Pages in Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

## Current prototype

- Android-like status area and bottom navigation (Home, Saves, Settings)
- Saves list with sample articles, filtering, search, sort, favorites, archive and tag panels
- Add-link and add-note sheets using in-memory demo state
- Reader view with sample article text, reading controls, font-size controls and theme toggle
- Settings screen with appearance, reading and import/export preview interactions
- Responsive phone-first layout and desktop device frame

All changes are in-memory and reset on refresh. Article copy is placeholder text and image thumbnails load from Unsplash.

## Source reference and fidelity

The implementation was informed by the public [Pocket/pocket-android repository](https://github.com/Pocket/pocket-android), especially:

- `Pocket/src/main/res/layout/activity_main.xml` — main container and three bottom navigation destinations
- `Pocket/src/main/res/values/dimensions.xml` — including the 63dp bottom navigation height and save-thumbnail dimensions
- `Pocket/src/main/java/com/pocket/app/list/MyListFragment.kt` — saves list, search, add, filter and item menus
- `Pocket/src/main/assets/html/article-mobile.html` — original reader WebView shell and reader assets

The upstream Android app is archived. A browser cannot render Android XML widgets directly, so this project recreates their visual intent and interactions in HTML/CSS/JavaScript rather than embedding Android layouts. **Pixel-perfect parity is not yet verified**; that requires side-by-side screenshots from the original app on the same viewport/device.

## License and attribution

Pocket Android is published under the Mozilla Public License 2.0; see the upstream repository's [LICENSE](https://github.com/Pocket/pocket-android/blob/main/LICENSE). This prototype is an independent web implementation and does not bundle the original Android source, fonts, or image assets. Pocket is a trademark of its respective owner; this repository is not affiliated with Mozilla or Pocket.
