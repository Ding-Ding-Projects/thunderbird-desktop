# `design/` — Material Mail 3-pane

This directory holds the design source for the Material Design 3 restyle of
Thunderbird's 3-pane, and the project documents that govern the work.

Integration target: **`main`**. Scope: **Windows only**.

> **This is a CSS-layer restyle of upstream's existing 3-pane, not a rewrite of it.**
> Windows CI has built and launched the packaged test application, but the 3-pane,
> widgets, and folder suites remain red. Read `ROADMAP.md` before treating static
> contract evidence as release sign-off.

---

## Start here

| Document | What it is |
|---|---|
| **`ROADMAP.md`** | What is done, what is explicitly not done, and what a next phase would need. Read first. |
| **`HANDOFF.md`** | Everything a successor needs cold: nine installer blockers plus one browser-test blocker, the two cascade rules, file ownership, what must never be edited, and standing caveats. |
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
- **The parity contract is at 33 / 38**, with five boxes deliberately open.
  A tick certifies that the named upstream behaviour still *functions* against named
  selectors and specificity. It is **not** a visual sign-off.
- **CI is mixed:** lint is green on `5ac44d5b58f`, and the installer is green on
  `30606626311`, which published a non-draft Windows installer release. The latest
  browser run still failed the 3-pane/widgets/folder suites while the static, chrome,
  and project-authored M3 suites passed.
- **Not done:** all eight `A11Y-L10N-AUDIT.md` F6 gates remain unchecked, manual
  visual sign-off is absent, and the markup rewrite itself has not started. See
  `ROADMAP.md` §"What is explicitly NOT done".

## Design-to-shipped verification

The design folder is the source of truth for Material values. The shipped CSS is
checked against `app-data.js` and the `Material Mail.dc.html` snapshot, with any
Thunderbird-specific translation recorded instead of silently drifting:

| Design source | Shipped implementation | Current result |
|---|---|---|
| `SEEDS` and `NEUTRALS` in `app-data.js` | `material-tokens.css` palette and neutral tokens | Exact light/dark purple, blue, green, orange, and neutral values are present. |
| `DENSITY` in `app-data.js` | `--m3-row-padding`, `--m3-row-padding-inline`, `--m3-gap`, `--m3-control-height`, and `--m3-avatar-size` | Compact, comfortable, and relaxed values match the design; the thread row also consumes a logical inline inset for RTL correctness. |
| M3 shape, type scale, elevation, and motion in the snapshot | Token definitions plus the six section sheets | Applied where the existing XUL/XHTML DOM exposes the required component; unsupported design-only markup remains tracked below. |
| Design typography (`Roboto`, `Roboto Flex`, `Noto Sans HK`) | Local-first/system fallback stacks in `material-tokens.css` | Intentional translation: Thunderbird cannot fetch Google Fonts at startup, so the design names are retained while local or platform CJK-safe faces are used. |

The snapshot is React/`<x-dc>` visual specification rather than embeddable
Thunderbird markup. Its message body, toast stack, command palette, pinned-tab
strip, and other design-only component structure therefore remain markup-phase
work in `ROADMAP.md`; CSS is not used to claim those surfaces already exist.
`font-variant-caps: all-small-caps` is used where the design requests casing so
the localized Fluent accessible name remains factual, and the separate
28/36/48px list-row budget preserves Thunderbird virtualization while the
design density values control the surrounding Material rhythm.

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
