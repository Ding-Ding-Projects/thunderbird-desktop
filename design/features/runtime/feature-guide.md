# Material feature guide · Material 功能指南

## Behavior

The packaged Tools page now inserts a local, searchable catalogue of the
design-folder feature articles. It enumerates the current Material runtime
slice, each open global-memory family, its honest status, and the repository
article path. Search is plain text by default and has an independent anchored
regex builder. Each result now has a **Read article** action that opens the
corresponding bundled article summary in an anchored, non-modal details surface.
The surface renders Behavior, Configuration, Failure modes, Security and
privacy, and Verification sections from local bilingual data drawn from the
articles below `design/features/runtime/` (with the existing dated audit paths
retained for open gaps). Existing command-palette, regex, and external-editor
entry rows remain below the guide.

## Configuration

The catalogue is the `FEATURE_GUIDE` data in `mail/base/content/materialMail.js`.
It is intentionally local and data-driven; each entry has bilingual title,
status, factual summary, article path, and a local five-section article payload.
Opening an article does not navigate away or clear `searchState.tools`, so the
active query and regex mode remain available when the details surface closes.
The surface is mounted only inside the packaged Material preview and does not
alter Thunderbird's upstream 3-pane behavior.

## Failure modes

- An empty or unmatched query shows an honest no-match state without hiding the
  existing Tools entry points.
- An invalid regex returns no matches through the shared bounded builder and
  cannot run unbounded evaluation.
- A documentation path is displayed as source evidence; the guide does not
  pretend that an open status is a shipped feature.
- If a local article payload is missing, its row remains searchable and the
  guide does not attempt a network fetch.

## Security and privacy

The guide reads only bundled static data and does not fetch documents, fonts,
analytics, account data, or network content. Search and regex evaluation stay
local and bounded.

## Accessibility and verification

The feature list uses headings, status chips, live result counts, keyboard
reachable search and **Read article** controls, visible focus, bilingual
summaries, and the same reduced-motion/CJK-safe styles as the preview. The
details surface has a labelled non-modal dialog role, a keyboard-operable close
button, Escape dismissal, viewport-edge clamping, and focus return to the exact
guide result that opened it. Verify with:

```powershell
python design/verify-material-preview.py
node --check mail/base/content/materialMail.js
```

The browser contract asserts all 14 guide entries and a local `tabs` search;
focused static checks should additionally confirm the 14 article payload paths,
the anchored details IDs, Escape handling, and unchanged `searchState.tools`.
Built-artifact screenshot coverage remains pending for the current source wave.
