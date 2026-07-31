# `design/` — Material Mail 3-pane

This directory holds the design source for the Material Design 3 restyle of
Thunderbird's 3-pane, and the project documents that govern the work.

Integration target: **`main`**. Scope: **Windows only**.

> **Current shipped scope is a CSS-layer restyle of upstream's existing 3-pane, not a rewrite of it.**
> The requested full Material UI rewrite is tracked as the next implementation phase;
> this evidence page deliberately does not pretend that design-only surfaces already run.
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
- **CI is mixed:** lint run
  [30621742858](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30621742858)
  and Windows installer run
  [30621742853](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30621742853)
  are green for `067445d0f69`. They published the non-draft release
  [`tb-155.0a1-b52-dan-tat`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b52-dan-tat),
  whose downloaded package matches all seven Material sheets byte-for-byte. The
  current browser dispatch [30622859803](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30622859803)
  completed with static, chrome, and authored M3 groups passing. The 3-pane,
  widgets, and folder gates remain red at 92, 2, and 12 unexpected results;
  artifact `8790660197` contains the raw logs and genuine runtime screenshots.
- **Not done:** all eight `A11Y-L10N-AUDIT.md` F6 gates remain unchecked, manual
  visual sign-off is absent, and the markup rewrite itself has not started. See
  `ROADMAP.md` §"What is explicitly NOT done".

## Evidence coverage

The complete surface inventory is machine-readable in
[`evidence/manifest.json`](evidence/manifest.json). It is anchored to the exact
shipped Material source commit `e4867411c3aa81de4527d843913b966d0ef89c1c` and covers
both classes of surface from the audit:

- **Runtime-reachable:** the 3-pane shell and layouts; folder pane and its context
  menus; thread header/list and display, sort, and column menus; quick-filter bar
  and menus; message-pane shell and findbars; application chrome, tabs, all-tabs,
  tab-context, global-search and autocomplete popups; spaces/notifications; and
  existing upstream dialogs/windows reached from the 3-pane.
- **Design-only:** the Material Mail mail, settings, changelog, history, and
  notification pages; command palette; searchable tab overlay; tab context menu;
  compose dialog; anchored search/regex builder; and toast/dim-sum surfaces.

Every manifest entry records its source path, selector or component anchor,
command family, major states, and screenshot status. `screenshot: "missing"`
means there is no surface-specific capture committed or mapped here; the existing
`design/screenshots/mail-check.png` is retained as a `reference-only` asset and is
not evidence for current runtime coverage.

### Current CI evidence

Build 54 is the non-draft release
[`tb-155.0a1-b54-wu-gok`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b54-wu-gok),
published by the successful [Windows installer run 30625833498](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625833498)
with the installer from the exact source SHA above. The matching
[browser run 30625878368](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625878368)
completed with the packaged-CSS and chrome suites passing; the 3-pane, widgets,
folder-pane, and project-authored M3 gates failed. The M3 gate recorded 137 checks,
132 expected results, and 5 unexpected density-token results in
`testM3DensityTokensFollowLiveAttributes`. Its
[uploaded log artifact](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625878368/artifacts/8791840623)
contains run-level logs and failure screenshots. Five genuine captures are now
mapped in the manifest and committed below; they are diagnostic or gap evidence,
not visual sign-off.

| Capture | What it proves | Status |
|---|---|---|
| [`ci-m3-3pane-folder-list.png`](screenshots/runtime/ci-m3-3pane-folder-list.png) | Hosted 3-pane shell, folder pane, and thread list are present in the packaged app. | Failure-context only |
| [`ci-m3-3pane-message.png`](screenshots/runtime/ci-m3-3pane-message.png) | Hosted message-pane arrangement and Material chrome are present. | Failure-context only |
| [`ci-m3-shell-browser-chrome-overlay.png`](screenshots/runtime/ci-m3-shell-browser-chrome-overlay.png) | Spaces rail and application chrome are visible in the runtime fixture. | Failure-context only |
| [`ci-widgets-pane-splitter-failure.png`](screenshots/runtime/ci-widgets-pane-splitter-failure.png) | Splitter fixture and its diagnostic state were captured by the real browser job. | Diagnostic only |
| [`b54-account-setup-upstream.png`](screenshots/runtime/b54-account-setup-upstream.png) | The shipped artifact reaches upstream onboarding, which is not one of the owned M3 design surfaces. | Explicit gap |

The corrected density expectations are now `4px` / `56px` for relaxed mode,
matching `design/app-data.js`; the next browser dispatch must rerun the M3 gate
before this evidence can become green. The previous b54 raw result was **119
passed / 4 failed / 13 TODO**, with the four failures in
`testM3DensityTokensFollowLiveAttributes`.

This evidence update changes documentation only. It does not touch upstream
behavior or markup, and it is not a visual sign-off or a claim that the design-only
surfaces exist in the desktop runtime.

## Global-memory feature gap audit

The refreshed shared instructions require a complete Material Design 3 product,
not only a skin over the existing 3-pane. The current branch does not yet ship
the following design-folder surfaces or their required behavior:

| Requirement family | Current state | Implementation needed |
|---|---|---|
| Material landing page and in-app documentation | Design-only snapshot | Add a real local landing/documentation surface that enumerates every feature and links to detailed articles. |
| English / playful HK Cantonese / bilingual modes | Existing Thunderbird localization only | Add persisted mode selection and compact bilingual rendering for the new Material surfaces. |
| Independent funny-level sliders | Missing | Add persisted English and Cantonese levels 1–5 and apply them to all user-facing copy without changing facts. |
| Notifications and notification history | Upstream notifications only | Add non-blocking toast stack plus a reviewable centre/history. |
| Dim-sum startup delight | Design glyphs only | Bundle approved local assets, add the one-percent non-blocking launch draw, setting, alt text, and release-code-name display. |
| Anchored regex builder | Design component only | Implement the full local builder and bind an independent instance to every search field. |
| Appearance editor and infinite color translator | Token CSS only | Add per-element anchored editing, Word-depth typography, color-space translation, persistence, presets, import/export, and reset. |
| Browser-style tabs | Existing Thunderbird tabs, no design parity | Add overflow, reorder, pinning, grouping, four tab searches, and safe bulk-close actions. |
| External editor integration | Not present in the Material layer | Add editor discovery, selection, persistence, and graceful failure. |
| Local Git-backed history | Not present in the Material layer | Snapshot every user-managed record and setting, with diff, restore-as-new-revision, retention, and export. |
| In-app changelog viewer | Design-only page | Add all-release entries, date/calendar filtering, regex search, copy, and export. |
| TTS narrator | Not present | Optional off-by-default serialized English/Cantonese narrator with accessibility and quiet-hours rules. |

This matrix is an implementation ledger, not a completion claim. The CSS-only
release remains useful evidence for the existing 3-pane shell, while the rewrite
phase must add the missing runtime markup and behavior and then recapture every
dialog, feature, page, menu, state, and accessibility mode from the real artifact.
See [`GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md`](GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md)
for the verification-oriented checklist.

## Design-to-shipped verification

The design folder is the source of truth for Material values. The shipped CSS is
checked against `app-data.js` and the `Material Mail.dc.html` snapshot, with any
Thunderbird-specific translation recorded instead of silently drifting:
`verify-material-alignment.py` runs in the Material lint workflow and fails when
palette values, density projections, font families, stylesheet load order,
packaging entries, or theme-safety invariants drift from that source.

| Design source | Shipped implementation | Current result |
|---|---|---|
| `SEEDS` and `NEUTRALS` in `app-data.js` | `material-tokens.css` palette and neutral tokens | Exact light/dark purple, blue, green, orange, and neutral values are present. |
| `DENSITY` in `app-data.js` | `--m3-row-padding`, `--m3-row-padding-inline`, `--m3-gap`, `--m3-control-size`, and `--m3-avatar-size` | Compact, comfortable, and relaxed values match the design; the thread row also consumes a logical inline inset for RTL correctness. |
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
