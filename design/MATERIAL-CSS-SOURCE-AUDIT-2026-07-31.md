# Material CSS source audit — 2026-07-31

Status: **read-only source audit; no CSS correction proven**

This note records a bounded comparison of the seven owned Material stylesheets
against `design/app-data.js` and `design/Material Mail.dc.html`. It deliberately
does not claim browser, Thunderbird runtime, pixel, or assistive-technology proof.

## Scope

Owned stylesheets audited:

- `mail/themes/shared/mail/material-tokens.css`
- `mail/themes/shared/mail/m3-layout.css`
- `mail/themes/shared/mail/m3-folder-pane.css`
- `mail/themes/shared/mail/m3-thread-pane.css`
- `mail/themes/shared/mail/m3-quick-filter.css`
- `mail/themes/shared/mail/m3-message-pane.css`
- `mail/themes/shared/mail/m3-chrome.css`

Inputs were limited to the two design sources named above and the existing
source-level verifier at `design/verify-material-alignment.py`. No behavior file,
markup file, upstream stylesheet, or generated artifact was edited.

## Evidence

`python design/verify-material-alignment.py` passed:

```text
Material alignment OK: 7 CSS files, 71 token colours, 3 density modes,
4 font families, load order, packaging, and theme safety.
```

An independent token comparison found:

- 24 unique `--m3-*` variables used by `Material Mail.dc.html`;
- 0 design variables missing from `material-tokens.css`;
- 0 mismatches between the design’s default hexadecimal fallbacks and the
  default token declarations;
- the three `DENSITY` modes and four `FONTS` families covered by the verifier;
- the design’s 224 total `--m3-*` references resolve to the shipped token layer.

The geometry differences are documented runtime translations, not unexplained
drift. `material-tokens.css` maps the design’s `compact` / `comfortable` /
`relaxed` vocabulary to Thunderbird’s live `uidensity` values, while the
section sheets keep virtualized list-row height separate from pointer-control
size. The design snapshot renders React-like `<x-dc>` content with inline
styles; Thunderbird exposes an upstream-owned XUL/XHTML DOM. A selector copied
from a design-only element would therefore be unproven and could be dead code.

## Decision

No additive CSS rule was justified by this source comparison. The palette,
token references, default fallbacks, density projections, font stacks, load
order, packaging, and theme-safety invariants are already covered by the
existing implementation and verifier. A real visual or interaction defect
would require separate built-artifact/runtime evidence before changing one of
the owned sheets.

## Verification boundary

This audit establishes source alignment only. It does not close the documented
runtime, visual, accessibility, localization, or upstream behavior gates.
