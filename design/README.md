# `design/` — Material Mail 3-pane

This directory holds the design source for the Material Design 3 restyle of
Thunderbird's 3-pane, and the project documents that govern the work.

Branch: **`design-import/thunderbird-3pane`**. Scope: **Windows only**.

> **This is a CSS-layer restyle of upstream's existing 3-pane, not a rewrite of it,
> and nothing on this branch has ever been built and launched.** Read `ROADMAP.md`
> before drawing any conclusion from the fact that `REWRITE-CONTRACT.md` shows
> 38 / 38 ticked.

---

## Start here

| Document | What it is |
|---|---|
| **`ROADMAP.md`** | What is done, what is explicitly not done, and what a next phase would need. Read first. |
| **`HANDOFF.md`** | Everything a successor needs cold: the nine CI blockers and their fixes, the two cascade rules, file ownership, what must never be edited, standing caveats. |
| **`REWRITE-CONTRACT.md`** | The 38-box feature-parity ledger, its evidence, and the eleven regressions the proof requirement caught. |
| **`A11Y-L10N-AUDIT.md`** | What the rewrite must not break — the ARIA/tabindex surface, the ~2/3 of it applied at runtime and invisible in the markup, the full l10n inventory, and the F6 verification gates. |
| **`INFRA.md`** | Runners, the Windows installer pipeline, and why the self-hosted boxes cannot build it. |

## Current state, in brief

- **Seven stylesheets** implement the skin: `material-tokens.css` plus six section
  sheets, all in `mail/themes/shared/mail/`, packaged at `jar.inc.mn:121-127`, linked
  from `about3Pane.xhtml` (six) and `messenger.xhtml` (`m3-chrome.css` plus a second
  copy of the tokens, because custom properties do not cross the `<browser>` boundary).
- **The behaviour layer is untouched.** `about3Pane.js` and `widgets/*.mjs` have never
  been modified. The markup delta is `about3Pane.xhtml` +23/-0 and `messenger.xhtml`
  +9/-0 — link elements and XML comments only, zero deletions, zero `style=`.
- **The parity contract is at 38 / 38**, established over four ratification passes.
  A tick certifies that the named upstream behaviour still *functions* against named
  selectors and specificity. It is **not** a visual sign-off.
- **Both CI workflows are reported green** — the Windows installer (which publishes a
  real release per push) and the M3 lint job (whose "prove the linter fails on a
  known-bad file" self-test passes, so it is known to be able to go red).
- **Not done:** nothing built and launched; all eight `A11Y-L10N-AUDIT.md` F6 gates
  unchecked, one of them structurally unclosable by static analysis; the markup
  rewrite itself has not started. See `ROADMAP.md` §"What is explicitly NOT done".

---

## The design snapshot

Mirror of the Claude Design project that the restyle is drawn from.

- **Project:** `bd7bc9a9-157e-47c9-8139-7d561c4a1cd3`
- **Source:** https://claude.ai/design/p/bd7bc9a9-157e-47c9-8139-7d561c4a1cd3
- **First snapshot:** 2026-07-28. Refreshed since; the document is complete.

| Path | Notes |
|---|---|
| `Material Mail.dc.html` | The design document — **complete, ~141 KB**. Superseded the earlier `Thunderbird 3-Pane (current).dc.html`. |
| `SearchField.dc.html`, `RegexBuilder.dc.html` | Component documents from the same project. |
| `support.js` | dc-runtime (generated from `dc-runtime/src/*.ts`); parses `<x-dc>`, binds props, renders via React. |
| `app-data.js` | The design's sample data, including the bilingual and CJK strings. |
| `icons/*.svg` | **92** icons. 16×16 unless noted; `*-xs`/`*-sm` are 12×12, `normal-inbox` and `spaces-*` are 20×20. |
| `assets/dimsum/*.svg` | 6 dim sum glyphs, matching the release code-name rotation. |
| `screenshots/mail-check.png` | Reference capture. |
| `.thumbnail` | WebP preview card. Renders the **pre-rename** design — the only surviving image of it. |

> **The design snapshot is a visual spec, not shippable markup.** It renders through
> React and `<x-dc>`; Thunderbird's 3-pane is XUL/XHTML with custom elements and no
> React. It also uses heavy inline `style=` and pulls Roboto / Roboto Flex / Noto Sans
> HK from Google Fonts in its `<helmet>` — remote fetch at startup is a privacy leak,
> is blocked by Thunderbird's CSP, and is non-negotiable. Fonts must be vendored or
> swapped for system fonts. The shipped `material-tokens.css` already does the latter:
> Roboto and Noto Sans HK are *named* first so a local copy wins, then it falls back to
> platform UI fonts. Noto Sans HK matters — without a CJK fallback the Cantonese
> strings in `app-data.js` render as tofu.

### Refreshing the snapshot

Files are pulled with the `DesignSync` tool (`get_file` per path, `list_files` to
enumerate). Note that `get_file` returns HTTP 404 for a path `list_files` just listed
while a rename is in flight — re-run `list_files` rather than assuming the file is gone.

---

## Rules for anyone editing here

- **Never edit `mail/base/content/about3Pane.js`.** Its being unmodified is the whole
  safety argument. Same for `widgets/*.mjs`, `about3Pane.xhtml`, `about3Pane.css` and
  `jar.inc.mn`.
- The repository root `README.md` is **upstream Thunderbird's**, not this project's.
  Do not edit it.
- `REWRITE-CONTRACT.md` is edited only by the ratify agent.
- No remote fonts. No inline `style=`. Every user-visible string via a Fluent
  `data-l10n-id` or a DTD entity.
- Windows-only scope does **not** relax parity, accessibility or localization, and
  macOS/Linux code paths must not be deleted.

The two cascade rules that have already caused real bugs — the `:root:not([lwtheme])`
guard, and the fact that it adds (0,2,0) while a media query adds none — are in
`HANDOFF.md` §3. Read that section before touching any colour rule.
