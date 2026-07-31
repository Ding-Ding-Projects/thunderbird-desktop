# Changelog viewer · 更新記錄檢視器

## Behavior

The packaged Material Mail Changelog tab renders recorded release entries with
version, date, category, and factual change text. Its own search field has an
adjacent anchored regex builder; plain text is the default and regex mode is
explicit. Date filtering composes with search, and the viewer has typed ISO date
inputs, latest-release and month presets, copy, and Markdown export.

## Configuration

Entries are local data in `materialMail.js` until release metadata is connected.
Export reflects the active search and date range. The language mode selects
English, Hong Kong Cantonese, or both for rendered entry copy.

## Failure modes

- Invalid regex input returns no matches rather than evaluating an unsafe pattern;
  the shared builder enforces length, capture, and evaluation bounds.
- An empty result names the active filter adjustment instead of pretending the
  release history is empty.
- Clipboard and download failures produce a non-blocking status and preserve
  the visible entries.

## Security and privacy

The viewer reads bundled release data and evaluates searches locally. It does not
fetch release notes, fonts, images, analytics, or account data. Export contains
only the currently visible changelog selection.

## Accessibility and verification

Search and regex controls are keyboard reachable, the result count is an
`aria-live` output, date controls have visible labels, and the entry list keeps
actions outside the blocking-dialog path. Verify the static contract and
packaged browser test before calling this runtime sign-off.

## Related articles

- [Anchored regex builder](regex-builder.md)
- [Local history surface](local-history.md)
- [Language and funny levels](language-tone.md)
