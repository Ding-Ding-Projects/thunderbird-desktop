# Appearance editor foundation · 外觀編輯器基礎

## Behavior

The packaged preview opens an anchored **Edit appearance** editor from a
target's context menu or Shift+F10. It targets cards, tabs, the app bar, and
search fields, applies live surface/text colors, radius, size, and weight, and
supports per-target and global reset. Overrides persist locally by stable target
key and the editor returns focus to the target when closed.

## Configuration

Overrides are stored under `mail.material.preview.appearance`. The editor now
mounts a continuous local HSL control, direct entry for named/HEX/HEX8/RGB/A,
HSL/A, HSV, HWB, CIELAB/LCH, OKLab/OKLCH, and CMYK, translated representations
with copy actions, an sRGB clipping warning, and a live surface/text contrast
readout. The DOM-free translator remains in `design/runtime/color/` and is
packaged as `materialColorTranslator.mjs`; no value leaves the local document.
Settings also exposes live accent seed, interface font, font scale, and font
weight controls using the design folder's local palette/font choices.

## Failure modes

- Invalid hex text is ignored without replacing the last valid color.
- Numeric values outside sRGB are clipped for display and explicitly reported;
  the source space and alpha are retained in the translated output.
- Clipboard denial leaves the representation visible and reports a non-blocking
  notification instead of blocking color editing.
- Storage failure leaves live edits usable for the session and reports a
  non-blocking status.
- Viewport-edge placement is clamped inside the window; the editor never blocks
  the underlying page.

## Security and privacy

Only local CSS custom-property overrides are persisted. No remote fonts, images,
analytics, account data, or network content are accessed.

## Accessibility and verification

The editor is a labelled dialog with keyboard-operable controls, visible focus,
context-menu and Shift+F10 entry paths, a local search field with its anchored
regex builder, and reset actions. Static checks, translator tests, and the
browser test prove the mounted control path; full every-element Word-depth
coverage, an eyedropper, and visual sign-off remain open.

## Related articles

- [Packaged Material preview](material-preview.md)
- [Changelog viewer](changelog-viewer.md)
- [Language and funny levels](language-tone.md)
