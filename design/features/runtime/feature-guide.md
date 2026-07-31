# Material feature guide · Material 功能指南

## Behavior

The packaged Tools page now inserts a local, searchable catalogue of the
design-folder feature articles. It enumerates the current Material runtime
slice, each open global-memory family, its honest status, and the repository
article path. Search is plain text by default and has an independent anchored
regex builder. Existing command-palette, regex, and external-editor entry rows
remain below the guide.

## Configuration

The catalogue is the `FEATURE_GUIDE` data in `mail/base/content/materialMail.js`.
It is intentionally local and data-driven; each entry has bilingual title,
status, factual summary, and a `design/` article path. The guide is mounted only
inside the packaged Material preview and does not alter Thunderbird's upstream
3-pane behavior.

## Failure modes

- An empty or unmatched query shows an honest no-match state without hiding the
  existing Tools entry points.
- An invalid regex returns no matches through the shared bounded builder and
  cannot run unbounded evaluation.
- A documentation path is displayed as source evidence; the guide does not
  pretend that an open status is a shipped feature.

## Security and privacy

The guide reads only bundled static data and does not fetch documents, fonts,
analytics, account data, or network content. Search and regex evaluation stay
local and bounded.

## Accessibility and verification

The feature list uses headings, status chips, live result counts, keyboard
reachable search controls, visible focus, bilingual summaries, and the same
reduced-motion/CJK-safe styles as the preview. Verify with:

```powershell
python design/verify-material-preview.py
node --check mail/base/content/materialMail.js
```

The browser contract asserts all 14 guide entries and a local `tabs` search;
built-artifact screenshot coverage remains pending for the current source wave.
