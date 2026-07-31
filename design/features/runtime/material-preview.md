# Packaged Material preview · 已封裝 Material 預覽

## Behavior

Help → **Open Material Mail preview** opens a local `contentTab` at
`chrome://messenger/content/materialMail.xhtml`. The page presents Mail,
Settings, Changelog, History, Notifications, and Tools as browser-style tabs.
Settings update theme, density, language mode, independent English/Cantonese
funny levels, narrator opt-in, and dim-sum opt-in immediately and persist in the
preview's local storage namespace. Changelog now has local search, date filters,
copy, and Markdown export; History has local search, derived action filters,
date filters, append-only restore records, and export. The independent funny
levels alter fact-preserving copy in these surfaces, notifications, empty states,
and exports.

## Configuration

The page links the shared Material token sheet and `material-mail.css`. Density
maps to the design folder's compact, comfortable, and relaxed arms. The preview
is local-only and does not fetch fonts, images, analytics, or network content.

## Failure modes

- If local storage is unavailable, defaults remain usable and a non-blocking toast
  reports that persistence was unavailable.
- If a tab target is unavailable, the current page remains visible; tab state does
  not alter the upstream mail tab.
- History uses clearly labelled fixture/local preview revisions until the full
  Git-backed record-history implementation exists; it does not claim production
  record coverage.
- Runtime browser or packaging failure keeps the surface a preview and cannot be
  promoted to visual sign-off by static checks alone.

## Security and privacy

Preferences stay in local storage. The page uses a restrictive chrome CSP and
local packaged assets only. Sample mail names and copy are fixture data; no
account, message, credential, or network data is read.

## Accessibility and verification

Tabs use `tablist`/`tab`/`tabpanel` semantics with roving focus and arrow/Home/End
keyboard paths. Focus rings, reduced motion, 600px and 900px layout breakpoints,
and bilingual secondary labels are included. Verify with:

```powershell
python design\verify-material-preview.py
node --check mail\base\content\materialMail.js
```

A real packaged capture is still required for final visual sign-off.

## Related articles

- [Anchored regex builder](regex-builder.md)
- [Language and funny levels](language-tone.md)
- [Global-memory gap audit](../../GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md)
