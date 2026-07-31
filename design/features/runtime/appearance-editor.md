# Appearance editor foundation · 外觀編輯器基礎

## Behavior

The packaged preview opens an anchored **Edit appearance** editor from a
target's context menu or Shift+F10. It targets cards, tabs, the app bar, and
search fields, applies live surface/text colors, radius, size, and weight, and
supports per-target and global reset. Overrides persist locally by stable target
key and the editor returns focus to the target when closed.

## Configuration

Overrides are stored under `mail.material.preview.appearance`. Native color
inputs are paired with bounded hex entry; the current foundation deliberately
does not claim the full Word-depth typography or multi-space color translator.

## Failure modes

- Invalid hex text is ignored without replacing the last valid color.
- Storage failure leaves live edits usable for the session and reports a
  non-blocking status.
- Viewport-edge placement is clamped inside the window; the editor never blocks
  the underlying page.

## Security and privacy

Only local CSS custom-property overrides are persisted. No remote fonts, images,
analytics, account data, or network content are accessed.

## Accessibility and verification

The editor is a labelled dialog with keyboard-operable controls, visible focus,
context-menu and Shift+F10 entry paths, and reset actions. Static checks and the
browser test prove the entry path; full every-element Word-depth coverage and
visual sign-off remain open.

## Related articles

- [Packaged Material preview](material-preview.md)
- [Changelog viewer](changelog-viewer.md)
- [Language and funny levels](language-tone.md)
