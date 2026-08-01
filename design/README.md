# `design/` — Material Mail 3-pane

This directory holds the design source for the Material Design 3 restyle of
Thunderbird's 3-pane, and the project documents that govern the work.

Integration target: **`main`**. Scope: **Windows only**.

> **Current source scope is a CSS-layer restyle plus a packaged Material Mail runtime preview.**
> The preview is the first rewrite vertical slice; it does not yet replace the upstream
> 3-pane or close the full shared feature contract. This wave ports the design-defined
> tab core, while grouping, the remaining tab searches, bulk-close, app-wide ownership,
> and new built-artifact captures remain open. Read `ROADMAP.md` before treating any
> source or test evidence as release sign-off.

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

- **`design/` is the authoritative source, not a generated approximation.** The current
  tree contains **162 files / 1,998,808 bytes**. Its primary snapshot,
  `Material Mail.dc.html`, is **140,780 bytes** with SHA-256
  `a334d745c32a7ab3d1c83a36061cab1017111af1064dd3b79d6a88afa6be45c1`.
  There is no project design ZIP because the complete tracked folder is kept directly in
  the repository; unrelated third-party fixture archives are not design evidence.
- **Seven stylesheets** implement the skin: `material-tokens.css` plus six section
  sheets, all in `mail/themes/shared/mail/`, packaged at `jar.inc.mn:121-127`, linked
  from `about3Pane.xhtml` (six) and `messenger.xhtml` (`m3-chrome.css` plus a second
  copy of the tokens, because custom properties do not cross the `<browser>` boundary).
- **Upstream mail behavior remains untouched.** `about3Pane.js` and `widgets/*.mjs`
  have never been modified. The separate project-owned preview now has its own local
  behavior modules for settings/data surfaces, regex, color translation, and the tab
  core; none of them replaces upstream account, folder, thread, or message behavior.
- **The parity contract is at 33 / 38**, with five boxes deliberately open.
  A tick certifies that the named upstream behaviour still *functions* against named
  selectors and specificity. It is **not** a visual sign-off.
- **The hardened release contract is green while the paired browser gate is red.**
  Installer run
  [30679344489](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30679344489)
  succeeded for exact source `9ea281a808891f92b09da944f6d9ffc504f39561` and
  published non-draft, non-prerelease release
  [`tb-155.0a1-b109`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b109),
  **Chicken Glutinous Rice Dumplings · 雞粒鹹水角 — Thunderbird 155.0a1
  (build 109)**, at `2026-08-01T02:25:55Z`. Release ID `363405305` carries
  exactly the 87,753,711-byte installer
  (asset `497441799`, node `RA_kwDOTmsgBs4dplwH`, SHA-256
  `91f69c2e83c913ff34856ecae5f465f2bcca68e2074f2ee95df03f49bf268a01`)
  and the 2,628,867-byte, 1254×1254 catalog PNG
  `hk-dish-0110-chicken-glutinous-rice-dumplings.png`
  (asset `497441798`, node `RA_kwDOTmsgBs4dplwG`, SHA-256
  `01874751d9cbe3b6ad1331988cc8f1af17f3ac3d78d60ae0b84d4c9c9f1c5b37`).
  Both the release tag and
  `refs/tags/dim-sum-code-names/chicken-glutinous-rice-dumplings` resolve to
  `9ea281a8`; the image comes from catalog commit
  `135dcef2be4da04dbe1682076c4a3db59defe5f0`. b109 remains intermediate
  because browser runs 30679351159 and 30679948708 failed. b108 and b107 remain
  preserved as earlier exact two-asset evidence; neither is UI sign-off.
- **Local authored verification for this wave is green:** preview/alignment verifiers,
  `12 / 12` preview smoke checks, `9 / 9` regex tests, `5 / 5` color tests,
  `6 / 6` language-model tests, and `4 / 4` tab-model tests. The packaged browser test
  now exercises pin persistence, keyboard reorder, plain/regex all-tabs search, focus
  return, and appearance hand-off; this comm-only checkout cannot execute that browser
  test without the CI Gecko build.
- **The first hosted tab-wave browser result is red and useful.** Run
  [30666929947](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30666929947)
  recorded **222 passed / 7 failed / 13 TODO** and exposed missing dynamically
  injected controls plus an unsupported wait helper. The containing source makes
  those controls static, uses the supported helper, and moves all privileged
  preview persistence to Thunderbird profile preferences. A new exact-source run
  is required; the failed run is not recycled as proof of the repair.
- **Later exact-source gates stayed red and diagnostic until the current correction.** Source
  `e7a65d87622dbe85563fabde4b156b384b22de46` removed the Services crash, then
  release run [30670125511](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30670125511)
  stopped on 74 CSS and 169 JavaScript lint errors before Windows packaging.
  Browser run [30670142906](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30670142906)
  completed without a crash at **252 passed / 17 failed / 16 TODO** and exposed
  unsafe HTML-string history rendering plus an unsupported assertion method.
  The next source used safe DOM construction, literal text, a
  whitelisted notification class, a true `.mjs` regex launcher, and supported
  assertions. Its browser run
  [30672182192](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30672182192)
  reached **206 passed / 2 failed / 16 TODO with zero crashes**. The first timeout
  waited for a panel class that is created only after the launcher opens; the second
  reused an existing single-page tab and then awaited a load that could not recur.
  Evidence-only source `d69f5ba1f8f0b3fe6b68f0c017c386eb34b080f7` reproduced the
  same counts in run
  [30672895090](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30672895090),
  as expected because it changed documentation but no UI bytes.
  This containing source exposes an explicit eight-builder initialization signal,
  initializes late modules against `document.readyState`, opens both fixtures as
  fresh duplicate tabs, and adds equivalent 14-space color-module coverage. Exact
  source `431ed1a295abe19452a92a724fa5978418624a46` cleared both failures and ran all
  three authored files in
  [30674327226](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30674327226),
  which reached **279 passed / 3 failed / 15 TODO with zero crashes**. Its three
  counted failures came from constructed keyboard events that did not exercise the
  focused Ctrl+Shift+Arrow or Escape paths; two additional accessibility warnings
  clicked rebuilt History/Notification controls before their painted bounds existed.
  Exact source `e8ad89b2973cb3458e1ee894140594f86a0febd7` used `EventUtils` and added
  those paint waits. Run
  [30675469469](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30675469469)
  confirmed the paint repair—neither hidden-node warning recurred—but finished at
  **279 passed / 3 failed / 13 TODO with zero crashes** because parent-side
  `EventUtils` injection through the page window did not reliably target the intended
  inner controls. Exact source `67b142169d5c5f111bf447e8f27eaaab66c66209`
  ensured browser focus with `SimpleTest.promiseFocus(tab.browser)` and awaited
  `BrowserTestUtils.synthesizeKey(..., tab.browser)`, but run
  [30676627493](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30676627493)
  repeated the same counts and assertions: the intended controls still were not
  focused inside the content actor that synthesized the keys. Exact source
  `4b208822c1429b8fad1cac72b138753a399ad87f` then called `tab.browser.focus()`
  before each inner-control focus and key, and repaired the blank XUL launcher with
  Fluent `.label`, a collision-free `P` access key, and rendered label/access-key
  assertions. Browser run
  [30677978579](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30677978579)
  proved the launcher assertions but disproved focus as the injection repair: all
  three files resolved, started, and ended, yet the same reorder, Escape-dismissal,
  and focus-return failures remained. The exact result was **301 checks / 297
  expected / 4 unexpected; 282 passed / 3 failed / 13 TODO; 3 / 3 / 3 files
  resolved/started/ended; 0 crashes / 0 malformed results**. Artifact `8811350118`
  is 129,979 bytes with SHA-256
  `95f93fee19f7fd8d2ac67b7c48f6d81e8d0be6ae91ec18d8712e664273096bd1`.
  Exact source `9ea281a808891f92b09da944f6d9ffc504f39561` then moved the key
  path into the content actor, focused the actual control, asserted
  `content.document.activeElement`, and called `EventUtils.synthesizeKey(...,
  content)`. The authoritative Material-only run
  [30679948708](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30679948708)
  proved all six target/focus assertions and all three authored files, but repeated
  the same three behavior failures: **307 checks / 303 expected / 4 unexpected;
  288 passed / 3 failed / 13 TODO; 3 / 3 / 3 files resolved/started/ended; 0
  crashes / 0 malformed results**. Artifact `8811992073` is 129,914 bytes with
  SHA-256 `8bf9d754357a2663818539914e63df4b1916585656d4a4410d4c5f35a44320da`.
  Broad exact-source run
  [30679351159](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30679351159)
  independently recorded the same Material result inside its retained six-group
  matrix. The containing correction constructs and dispatches a bubbling,
  cancelable `KeyboardEvent` inside the same content actor that owns the focused
  node. Hosted verification of that correction remains pending; no failed run is
  recycled as proof.
- **Broad browser verification is still mixed.** Run
  [30634411220](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30634411220)
  failed legacy suites while the authored Material/static groups passed. It is not
  evidence for this new tab source; a new exact-source run and genuine captures are required.
- **Not done:** all eight `A11Y-L10N-AUDIT.md` F6 gates remain unchecked, full app-wide
  feature wiring and manual visual sign-off are absent, and the upstream 3-pane remains
  behavior-compatible rather than fully replaced. See `ROADMAP.md` §"What is explicitly NOT done".

## Runtime Material vertical slice

The first packaged runtime slice is now present behind **Help → Open Material Mail
preview**. It is a real `contentTab` surface, not a screenshot or design-only
HTML file, and it is deliberately labelled **Design-backed preview** because it
does not yet replace Thunderbird's existing 3-pane behavior.

| Surface | Implementation | Current boundary |
|---|---|---|
| Mail | `mail/base/content/materialMail.xhtml` | Design-aligned three-column sample workspace; sample data only |
| Settings | Same page plus `materialMail.js` | Theme, density, language mode, independent funny levels, narrator/dim-sum toggles, Thunderbird profile-preference persistence |
| Changelog | Same page | Local release entries, search, anchored regex builder, date filters, copy, and Markdown export; release-data wiring remains open |
| History | Same page | Local append-only preview revisions, derived action filters, date/search filters, restore-as-new-revision, and export; production Git-backed record history remains open |
| Notifications | Same page | Non-blocking reviewable stack with search, anchored regex builder, all/unread/dismissed filters, and retained local dismissal state; app-wide event wiring remains open |
| Tools | Same page | Searchable 14-entry design-folder feature guide with its own regex builder plus command/regex/editor entry points; integrations remain open |
| Search | Anchored `RegexBuilder` from `design/runtime/regex/` | Eight independent builders are packaged for Mail, Settings, Changelog, History, Notifications, Tools, the appearance editor, and all-tabs discovery; upstream mail-content and application-wide search wiring remain open |
| Tabs | `materialMailTabs.mjs` plus `design/runtime/tabs/` | Persisted active/order/pins, stable pinned region, measured overflow, searchable all-tabs popover with an independent regex builder, drag/keyboard/context movement, and tab appearance hand-off; grouping, three additional search scopes, bulk-close, and built-artifact captures remain open |
| Appearance color | `materialMailColor.mjs` plus `design/runtime/color/color-translator.mjs` | Continuous local HSL controls, direct multi-space entry, translated copy rows, gamut/clipping status, and contrast readout; full Word-depth coverage remains open |

The surface follows the design folder's M3 tokens, density arms, rounded-card
anatomy, browser-style tabs, bilingual labels, keyboard tab movement, visible
focus, narrow layouts, and reduced-motion fallback. `design/verify-material-preview.py`
checks the page/panel inventory, localization IDs, packaging, persistence,
keyboard paths, local-only assets, and the regex-builder entry point.

This slice is intentionally an implementation step toward the full rewrite, not
a claim that every global-memory feature is complete. Capture it from the real
packaged application before promoting any state to visual sign-off.

Feature articles are indexed in [`features/runtime/README.md`](features/runtime/README.md).

## Evidence coverage

The complete surface inventory is machine-readable in
[`evidence/manifest.json`](evidence/manifest.json). Its `sourceCommit` is
deliberately `null`: a tracked manifest cannot contain its own final commit ID
without creating a self-reference. Resolve the commit that contains the manifest;
the exact pushed SHA and immutable CI/release verdict are recorded in rolling
Discussion #1. The manifest covers both classes of surface from the audit:

- **Runtime-reachable:** the 3-pane shell and layouts; folder pane and its context
  menus; thread header/list and display, sort, and column menus; quick-filter bar
  and menus; message-pane shell and findbars; application chrome, tabs, all-tabs,
  tab-context, global-search and autocomplete popups; spaces/notifications; and
  existing upstream dialogs/windows reached from the 3-pane.
- **Packaged preview:** the Material Mail mail, settings, changelog, history, and
  notification pages; command/regex/editor entry points; and the anchored search/regex builder.
- **Still design-only or open:** the full landing/documentation site, tab grouping and the
  remaining search/bulk-close scopes, compose dialog, toast/dim-sum app-wide behavior, and
  full application feature wiring. The design-defined tab-search and context-menu core is now
  packaged source with capture pending rather than design-only markup.

Every manifest entry records its source path, selector or component anchor,
command family, major states, and screenshot status. `screenshot: "missing"`
means there is no surface-specific capture committed or mapped here; the existing
`design/screenshots/mail-check.png` is retained as a `reference-only` asset and is
not evidence for current runtime coverage.

### Current CI evidence

The verified pre-wave exact-source release is
[`tb-155.0a1-b98-char-siu-bao`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b98-char-siu-bao),
published by installer run [30644045825](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30644045825)
from `77fe409183e580db6dd59ef2e65d093864a4f241`. Its real installer is
87,755,233 bytes with SHA-256
`e57e8abce22183fb4a345398be52e20ae95835a3fee63c4bee98c4b6232d7a81`; the tag
resolves exactly to that source. Lint
[30644045867](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30644045867)
is green. The release has no catalog PNG and repeats an earlier code name, so it
does not satisfy the repaired release contract. Browser run
[30634411220](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30634411220)
completed red because the broad legacy suites remain red, but the corrected authored Material
suite passed **186 / 0 failed / 13 TODO** with zero unexpected results. Its [uploaded log artifact](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30634411220/artifacts/8795330528)
contains the exact suite evidence. Five diagnostic captures plus seven genuine b66 headless captures are mapped
in the manifest and committed below; none is a full visual sign-off.

| Capture | What it proves | Status |
|---|---|---|
| [`ci-m3-3pane-folder-list.png`](screenshots/runtime/ci-m3-3pane-folder-list.png) | Hosted 3-pane shell, folder pane, and thread list are present in the packaged app. | Failure-context only |
| [`ci-m3-3pane-message.png`](screenshots/runtime/ci-m3-3pane-message.png) | Hosted message-pane arrangement and Material chrome are present. | Failure-context only |
| [`ci-m3-shell-browser-chrome-overlay.png`](screenshots/runtime/ci-m3-shell-browser-chrome-overlay.png) | Spaces rail and application chrome are visible in the runtime fixture. | Failure-context only |
| [`ci-widgets-pane-splitter-failure.png`](screenshots/runtime/ci-widgets-pane-splitter-failure.png) | Splitter fixture and its diagnostic state were captured by the real browser job. | Diagnostic only |
| [`b54-account-setup-upstream.png`](screenshots/runtime/b54-account-setup-upstream.png) | The shipped artifact reaches upstream onboarding, which is not one of the owned M3 design surfaces. | Explicit gap |
| [`b66-material-mail.png`](screenshots/runtime/b66-material-mail.png) | Real b66 Material Mail Mail tab with three-column workspace, search, and browser-style tabs. | Headless runtime capture |
| [`b66-material-settings.png`](screenshots/runtime/b66-material-settings.png) | Real b66 Settings tab with theme, density, language, funny levels, narrator, dim-sum, and reset controls. | Headless runtime capture |
| [`b66-material-changelog.png`](screenshots/runtime/b66-material-changelog.png) | Real b66 factual changelog tab. | Headless runtime capture |
| [`b66-material-history.png`](screenshots/runtime/b66-material-history.png) | Real b66 honest local-history boundary state. | Headless runtime capture |
| [`b66-material-notifications.png`](screenshots/runtime/b66-material-notifications.png) | Real b66 notification centre sample stack; the later c863 copy correction is noted in the manifest. | Headless runtime capture |
| [`b66-material-tools.png`](screenshots/runtime/b66-material-tools.png) | Real b66 Tools tab with command palette, regex, and external-editor entry points. | Headless runtime capture |
| [`b66-material-regex-builder.png`](screenshots/runtime/b66-material-regex-builder.png) | Real b66 anchored bilingual regex builder beside the Mail search field. | Headless runtime capture |

Source after b66 adds Changelog/History filters and export, retained Notifications,
catalog-backed dim-sum startup, an anchored appearance editor, a mounted continuous
color translator, funny-level-driven copy, serialized narration, and now the
design-defined tab core. Every newer surface remains explicitly `capture-pending`
in [`design/evidence/manifest.json`](evidence/manifest.json) until an exact-source
installer is launched and captured. Source checks are not substituted for screenshots;
the next run and release verdict is recorded in rolling Discussion #1 after it exists.

The corrected density expectations are now `4px` / `56px` for relaxed mode,
matching `design/app-data.js`. The corrected authored suite result is **186 passed / 0 failed /
13 TODO** with zero unexpected results. The broad legacy suite failures remain an explicit runtime boundary.

This source wave changes only project-owned preview behavior, tests, styles, docs,
and the release gate; it does not touch upstream mail behavior or markup. It is not
a visual sign-off or a claim that the remaining design-only surfaces exist in the
desktop runtime.

## Global-memory feature gap audit

The refreshed shared instructions require a complete Material Design 3 product,
not only a skin over the existing 3-pane. The current branch does not yet ship
the following design-folder surfaces or their required behavior:

| Requirement family | Current state | Implementation needed |
|---|---|---|
| Material landing page and in-app documentation | GitHub Pages exists and the packaged Tools page exposes a searchable 14-article guide; the full site/app customization contract remains open | Bring both surfaces to the complete per-feature, tab, search, appearance, and built-artifact evidence contract. |
| English / playful HK Cantonese / bilingual modes | Packaged preview persists all three modes and renders bilingual factual feature data; application-wide ownership remains open | Extend compact bilingual rendering and tested fallback behavior to every Thunderbird-owned Material surface. |
| Independent funny-level sliders | Packaged runtime persists both levels and applies fact-preserving variants to preview messages, entries, notifications, empty states, and exports | Wire the same tone policy into all Thunderbird app-wide events/errors and obtain built-artifact captures. |
| Notifications and notification history | Packaged preview provides a retained searchable/filterable review centre and non-blocking toast foundation | Wire all application event categories into the stack and capture the built artifact. |
| Dim-sum startup delight | Packaged Classic har gow local image, first-run suppression, opt-out, and 1% non-blocking draw | Add the full catalog rotation, release-code-name display, and deterministic built-artifact capture. |
| Anchored regex builder | Tested local builder is packaged independently beside eight preview search fields, including all-tabs discovery | Bind the same full builder to every remaining application, settings, tab-group, and bulk-action search field. |
| Appearance editor and infinite color translator | Packaged anchored editor plus persisted typography foundation and mounted local multi-space translator with clipping/contrast readout | Add every-element coverage, Word-depth typography, eyedropper, presets, import/export, and reset depth. |
| Browser-style tabs | Packaged preview now wires the design-defined persisted order/pin core, measured overflow, all-tabs search/regex, drag/keyboard/context movement, and appearance hand-off | Add grouping, the remaining three discovery-search scopes, safe bulk-close actions, app-wide ownership, and built-artifact captures. |
| External editor integration | Not present in the Material layer | Add editor discovery, selection, persistence, and graceful failure. |
| Local Git-backed history | Packaged preview has append-only local revision records with text/action/date filtering and restore-as-new-event behavior | Add the isolated Git-backed store for every user-managed record and setting, with diff, retention, pruning, and export. |
| In-app changelog viewer | Packaged preview has factual entries, typed date filters, independent regex search, copy, and Markdown export | Wire every real release and the advanced calendar picker, then capture the built artifact. |
| TTS narrator | Packaged off-by-default English/Cantonese/Both selector and serialized platform speech queue foundation | Add natural HK voice selection, screen-reader ducking, quiet-hours, and full event-category wiring. |

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
