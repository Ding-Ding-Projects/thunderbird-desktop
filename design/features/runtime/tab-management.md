# Browser-style tab core · 瀏覽器式分頁核心

## Behavior

The packaged Material Mail preview ports the tab behavior defined in
`design/Material Mail.dc.html` into the runtime content page. The six built-in
pages keep a persisted active tab and order, pinned pages occupy a stable compact
region, and ordinary pages are measured against the available strip width rather
than silently clipped. Any page that does not fit remains available from an
anchored **All tabs** surface.

The all-tabs surface searches visible, overflowed, and pinned pages. Plain text
is the default and the field owns an independent anchored regex builder. Results
identify pin and overflow state, support keyboard activation, and expose the
same pin action without losing the active query. Tabs can also be reordered by
dragging, by the context menu, or with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+arrow.
Normal right-click opens tab actions; Shift+right-click opens the existing
anchored appearance editor directly.

This is the design-defined tab core, not the complete global tab contract.
Grouping, searches for each group and group name, a cross-window master search,
and safe containing/not-containing bulk-close previews remain explicit work.

## Configuration

The runtime stores a versioned JSON record in Thunderbird's profile preferences
under `mail.material.preview.tabs`. It contains only the active page id, ordered
built-in ids, and pinned ids. Loading normalizes that record against the current
built-in page inventory: unknown ids are dropped, missing ids are restored in
their default order, duplicates are removed, and an invalid active id falls back
to Mail. A preference observer keeps another open preview synchronized without
depending on `chrome://` page storage.

Tab labels and page content remain local. The feature adds no account access,
mail-server calls, remote fonts, remote images, analytics, or third-party code.

## Failure modes

- Invalid or unavailable profile preferences fall back to the complete default
  page order.
- A stale stored page id is discarded without hiding a current built-in page.
- A narrow strip moves ordinary tabs to the overflow list; pinned tabs remain in
  their dedicated, horizontally reachable region and keep their full accessible
  name even when their visual label is compact.
- Invalid regex syntax produces no activation side effect and remains owned by
  the bounded regex-builder status surface.
- Escape closes the all-tabs surface or context menu and returns focus to the
  control that opened it.
- Reordering never changes the tab-to-panel `aria-controls` relationship.

## Security and privacy

Tab search evaluates bounded local visible labels only. It does not inspect page
contents, hidden message data, accounts, credentials, files, or network content.
Persisted profile data contains built-in page ids, not user mail or browsing
history.

## Accessibility and verification

The strip keeps `tablist`/`tab`/`tabpanel` semantics and roving focus in rendered
order. Pinned compact tabs retain full accessible labels, menu items are keyboard
operable, focus return is explicit, focus indicators remain visible, and reduced
motion inherits the preview-wide fallback. Narrow widths, bilingual labels, and
200% text scale must keep the pinned region and overflow control reachable.

Verification is split deliberately:

- `node --test design/runtime/tabs/tab-model.test.mjs` covers persisted-state
  normalization, moves, pins, and visible/overflow selection.
- `python design/verify-material-preview.py` checks packaging, DOM hooks,
  localization, independent regex wiring, and the preference contract.
- `browser_m3MaterialMail.js` exercises the packaged tab, popover, pin, move,
  context-menu, and focus paths.
- Built-artifact captures for pinned, overflow, searched overflow, regex, and
  context-menu states remain required before visual sign-off.

## Suggested articles

- [Anchored regex builder](regex-builder.md)
- [Appearance editor foundation](appearance-editor.md)
- [Packaged Material preview](material-preview.md)
- [Accessibility and localization audit](../../A11Y-L10N-AUDIT.md)
