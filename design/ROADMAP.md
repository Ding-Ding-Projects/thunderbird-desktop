# Roadmap — Material Mail 3-pane

Status of the Material Mail 3-pane work as it is integrated into `main`, and what is left.

Read this with `REWRITE-CONTRACT.md` (the parity ledger), `INFRA.md` (build and CI)
and `A11Y-L10N-AUDIT.md` (what must not break). This file is the summary; those
three are the evidence.

---

## The one-sentence version

**This is a CSS-layer restyle of upstream Thunderbird's existing 3-pane, not a
rewrite of it. Windows CI has now built the artifact and run the browser suites;
the application gate is still red.**

Everything below follows from those two facts. The first is why the parity
contract can be at 33/38 without a line of behaviour code being written. The
second is why a static contract is not a release gate.

---

## What is done

### 1. The parity contract is at 33 / 38

`REWRITE-CONTRACT.md` records 33 boxes ticked and five deliberately open. The
five open boxes are not being hidden behind the earlier 38/38 static claim: they
need runtime, accessibility, or an explicit product decision.

**What a tick means, precisely:** the named upstream behaviour still *functions* —
no rule we added hides it, removes it from hit-testing, reparents it, mis-measures
it for the virtualiser, or out-ranks the mechanism that implements it. Each tick is
backed by a named file, selector, DOM element and specificity comparison.

**What a tick does not mean:** it is not a visual sign-off, and it is not a
statement that anyone has seen the feature work.

### 2. Eleven real defects were found and fixed by the proof requirement

Not by review-by-eyeball. Each was shipped by the restyle and caught only because
an agent was made to name the selector and the specificity. They are enumerated in
`REWRITE-CONTRACT.md` under "Regressions found and fixed while proving the ticks"
and "Regressions found and fixed by this pass". The headline ones:

| # | Defect | Why it mattered |
|---|---|---|
| 1 | Collapsed splitters kept an 8px dead gutter | Defeated the exact thing `about3Pane.css:176-186` documents its `display:none` as achieving |
| 2 | Quick-filter narrow-pane collapse was dead | Container queries add no specificity; five chips stayed on screen next to the overflow button that replaces them |
| 3 | Two `tree-view.mjs` row-height budget overruns | A 2px-tall overrun desynchronises `scrollTo`, `scrollToIndex` and hit-testing for every row below |
| 7 | `--m3-font-size` was a hard 14px | Severed the `UIFontSize` accessibility control for five surfaces; fixed at the token by moving to `1rem` |
| 8 | Column-picker override was dead (CSS Nesting trap) | 23-row popup rendered ~1130px and scrolled; rerouted through inherited custom properties |
| 9 | In-row keyboard cursor was invisible (~1.15:1) | `ArrowLeft`/`ArrowRight` cell navigation had no visible indicator at all |
| 10 | A premature `*/` swallowed a whole rule | The unread-dot recolour was silently dropped by the parser |

### 3. Windows installer CI builds and publishes releases

`.github/workflows/windows-installer.yml`, 672 lines, roughly a third of them
comments explaining why each line is the way it is. Nine separate blockers had to
be cleared before the first green run — they are enumerated in `HANDOFF.md`.

- Artifact build by default; `full` available via `workflow_dispatch`.
- Builds on `D:` (~147 GB measured) rather than `C:` (~33 GB measured).
- Every push publishes a real, non-draft, non-prerelease GitHub Release with the
  installer attached, tagged monotonically off `run_number` and code-named from a
  16-dish dim sum rotation.
- Every release states that it is an unofficial fork build.
- The previous successful run was on `fd3ce8c8f83`: [30501542153](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30501542153).
- The post-integration run on `6a507323779` failed at `vendored-rust-check`: [30605874503](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30605874503).
  Its log identified comm/Gecko Rust-manifest skew before compilation; the gitlink
  has since advanced from `ca6e9493686` to `079065d33b0b` and awaits the next
  installer run. No release was published by the failed run.
- The corrective run on `5ac44d5b58f` is verified green: [30606626311](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30606626311).
  It published non-draft release [`tb-155.0a1-b41-ham-sui-gok`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b41-ham-sui-gok)
  with `thunderbird-155.0a1.en-US.win64.installer.exe` attached.

### 4. Lint wiring is live and verified

`.github/workflows/lint-m3.yml` runs `./mach commlint -l stylelint` over
`m3-*.css` + `material-tokens.css` and `-l eslint` over `about3Pane.xhtml`.

It uses `commlint`, not `lint`, because only `commlint` inserts `comm/tools/lint`
into mozlint's `config_paths` and thereby makes comm's `.stylelintrc.js` win over
Firefox's. It has no `|| true` and no `continue-on-error`, it fails if the glob
matches zero files, and it carries a self-test that lints a deliberately broken
file and fails the job if stylelint reports it clean. The self-test passed, while
the real CSS lint failed on the pre-Gecko-bump main run because the six M3 sheets
were reported as needing Prettier formatting: [30501542141](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30501542141).
The current post-integration lint is verified green: [30605874495](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30605874495).

The lint workflow also runs `design/verify-material-alignment.py`. That gate
checks the design palette, all three density modes, the four local-first font
stacks, both document load orders, the seven packaging entries, balanced CSS,
and the lightweight-theme boundary. It is a source-drift gate, not browser
rendering evidence; the runtime and F6 gaps below remain open.

### 5. The behaviour layer is provably untouched

`mail/base/content/about3Pane.js` and `mail/base/content/widgets/*.mjs` have never
been modified on this branch. This is the load-bearing fact behind "features
survive by construction". It has been re-verified at every ratification with
`git status --porcelain`.

The markup delta is `about3Pane.xhtml` **+23/-0** and `messenger.xhtml` **+9/-0** —
every added line a `<link rel="stylesheet">` or an XML comment, zero deleted lines,
zero `style=` attributes.

### 6. Runtime evidence exists, and it is not green

The Windows browser workflow built and executed the packaged application. The
current full dispatch on merged `main` [`30608322422`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30608322422)
(`ce9b30d1aa6`) passed the static packaged-CSS, chrome, and project-authored M3
groups. Its actual failure gates were: 3-pane `92` unexpected results with a
truncated `17 resolved / 14 finished` run, widgets `2` unexpected results from
the pane-splitter timeout, and folder `12` unexpected results. The extracted
artifact records folder-mode/account-central state mismatches, pane-splitter
accessibility handling, stored pane-width restoration, and folder-pane
mode/count tests; preference-leak records are separate harness noise.
The older run [30538853820](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30538853820)
showed the same failure families. This repetition makes them real runtime gaps,
but does not by itself attribute them to the M3 CSS; no unexpected result was
reported by the current static, chrome, or M3 groups.
The no-M3 experiment [30499955896](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30499955896)
also failed, so it did not exonerate or isolate the restyle. No box is promoted
from static evidence based on these failures.

A fresh dispatch against the current pushed SHA `ba782707848` reached the same
runtime surface in [30613526616](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30613526616).
Setup, build, harness self-test, static packaged-CSS, chrome, and the
project-authored M3 group passed; M3 recorded **98 passed / 0 failed / 13 TODO**
and zero unexpected results. The 3-pane gate recorded **92 unexpected** with
`17 resolved / 14 finished`, widgets recorded **2 unexpected**, and folder
recorded **12 unexpected**. The uploaded raw logs show the same stored-pane-width,
folder-tree/mode, pane-splitter, and folder-header families, so the current SHA
confirms the runtime gap without attributing it to the M3 CSS. The installer
run [30612253410](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30612253410)
was still running at this checkpoint; no release is claimed for `ba782707848`.

---

## What is explicitly NOT done

These are not caveats. They are open work, and the contract being green does not
touch any of them.

### A. Manual visual and interaction sign-off is still missing

CI has built and launched a headless test application, but no manual Windows
installation and click-through has been recorded. The automated application gate
is also red, so the skin remains unapproved for release.

Not yet observed by anybody, in any form:

- The skin rendering at all, in any layout, theme, seed or density.
- `layout-classic` and `layout-wide`. The design covers exactly one arrangement,
  matching `layout-vertical`; the other two are styled only by inheritance and have
  never been looked at deliberately.
- The four accent seeds, `forced-colors`, and folder colours in a running build.
- Any interaction: drag-and-drop, the 25-item folder context menu, the column
  picker popup at its new ~780px height, sticky quick-filter persistence.

Treat the untested visual combinations and failed suites as open. A green static
contract or installer build is not a substitute for a passing application run.

### B. The F6 screen-reader gate cannot be closed statically — at all

`A11Y-L10N-AUDIT.md` §F6 lists eight verification gates. **None of them are
checked**, and the first one is structurally unclosable by static analysis:

> `_setRowAriaAttributes` returns only when both `Services.appinfo.accessibilityEnabled`
> and `Cu.isInAutomation` are false (`tree-view.mjs:1110`). The automated profile
> sets `Cu.isInAutomation`, so runtime tests can observe the attributes; a real
> NVDA/Narrator pass is still separate evidence.

There is no grep, no selector audit and no specificity argument that can observe
those attributes. It needs NVDA or Narrator attached to a running build. This is
also risk #7 in the audit's ranked list: threading semantics will pass every
non-AT test while being completely broken.

The other seven F6 gates are equally unmet: keyboard-only pass in all three
layouts, tab-stop count recorded before and after, `./mach test
mail/base/test/browser/browser_*3pane*`, a `zh-HK` run for CJK clipping, an RTL
(`ar`/`he`) run, `./mach lint` over any touched `.ftl`, and the attribute-level
reconciliation diff.

### C. The markup rewrite itself has not happened

This is worth stating plainly because the contract's title says "rewrite":

**No markup has been rewritten. The design has not been implemented as markup.**

What exists is seven stylesheets that restyle upstream's DOM. The consequences:

- **The message pane reading body is not touched at all.** The design's subject,
  avatar, sender line, star, tags and attachment card are rendered by about:message
  inside `#messageBrowser` — a **separate document** that links no M3 sheet.
  Nothing in `m3-message-pane.css` reaches it. Multi-message summary and account
  central are likewise untouched.
- **Several design elements have no DOM to attach to** and were correctly not
  invented: the folder filter field, the folder-pane empty state, the thread card's
  avatar and body-preview line, the message-pane empty-state string (CSS generated
  content cannot carry a `data-l10n-id`), the command palette, the toast stack, and
  pinned tabs. Each needs markup *plus* Fluent ids before any CSS is worth writing.
- **`--m3-avatar-size` has no consumer anywhere** — a token waiting for markup.
- The design's own conflicts with Thunderbird are unresolved because they were never
  reached: remote Google Fonts (blocked by CSP, non-negotiable), the `<x-dc>`/React
  runtime (a visual spec, not shippable markup), and heavy inline `style=`.

### D. Known unfixed defects

| Defect | Where | Severity |
|---|---|---|
| Runtime density/row budget can drift | `about3Pane.js#densityChange` still owns row-height constants independently of the CSS tokens | Needs behavior-layer design decision; this branch does not edit that file |
| `aria-hidden="hidden"` is an invalid token — 11 occurrences in `about3Pane.xhtml`. Invalid maps to *undefined*, so those decorative buttons are likely exposed today | upstream markup, pre-existing | Pre-existing upstream bug. Fix to `"true"` deliberately, with verbosity re-tested — do **not** copy forward |
| `about3Pane.js#densityChange` hardcodes its row-height constants instead of deriving them from `--m3-row-padding` / `--m3-gap` | `about3Pane.js` (must not be edited on this branch) | The M3 density axis and the uidensity axis can drift |
| The CSS-Nesting specificity trap is a live pattern, not a one-off | any nesting under a comma-list parent containing an id | Audit before adding more nesting |

### E. Documentation accuracy — historical figures are retained, current counts are measured

The contract contains historical guard-count tables from earlier passes. They are
not current-tree measurements after the logical-inset and theme-safety fixes.
Comment-stripped current selector counts are **11 · 59 · 31 · 21 · 3 · 9 · 0**
for layout, folder-pane, thread-pane, quick-filter, message-pane, chrome, and tokens.

Re-measured for this roadmap, three different numbers exist per sheet:

| Sheet | Contract figure (`lwtheme` tokens, comments included) | `:root:not([lwtheme])` strings, comments included | **Actual guard selectors, comments stripped** |
|---|---:|---:|---:|
| `m3-layout.css` | 15 | 12 | **11** |
| `m3-folder-pane.css` | 67 | 65 | **59** |
| `m3-thread-pane.css` | 44 | 38 | **31** |
| `m3-quick-filter.css` | 25 | 22 | **21** |
| `m3-message-pane.css` | 11 | 7 | **3** |
| `m3-chrome.css` | 15 | 13 | **9** |
| `material-tokens.css` | 0 | 0 | **0** |

These raw columns include explanatory comments; only the final column is the
selector count used for current reasoning.
Historical raw figures counted the bare string `lwtheme` including explanatory
comment prose. The current guards are real and correctly spelled; the table above
is the only current count to use.
Braces balance comment-stripped at 21/21, 108/108, 154/154, 76/76, 9/9, 74/74,
and 34/34, and **zero** positive `:root[lwtheme` selectors survive in any sheet.

---

## What a next phase would need

Ordered by dependency. Phase 1 gates everything after it.

### Phase 1 — Make the automated run green, then run it manually. (Blocks all other phases.)

The artifact has now been launched by CI, but the application suites still fail.
First reproduce and isolate the 3-pane/widgets/folder failures on a fresh run; then
install the verified artifact on a real Windows machine and open the 3-pane.

Minimum first sitting:

1. All three layouts (`cmd_viewClassicMailLayout` / `Vertical` / `Wide`).
2. Light and dark.
3. All four accent seeds, all three densities — the density axis was only recently
   wired to `[uidensity]`, which is what Thunderbird actually writes, and has never
   been observed working.
4. Install a third-party lightweight theme and confirm the 3-pane content stands
   down. This is the entire point of the 119-ish guard occurrences and it has never
   been seen.
5. Turn on Windows High Contrast and confirm the splitter hairline, the "N selected"
   pill, the tag host and the findbar divider all survive.

Everything found here is a real bug; everything not found here is still unknown.

### Phase 2 — Close the A11Y-L10N-AUDIT F6 gates

Needs a running build and real AT. In order of value:

1. **NVDA and/or Narrator on Windows** — not an inspector. This is the only way to
   observe the runtime ARIA layer at all.
2. **Tab-stop count, recorded before and after.** The audit's risk #2 is tab-stop
   explosion; the restyle should not have moved this number at all, and the
   before/after record is what proves it.
3. **`zh-HK` run** — the design ships bilingual strings and CJK; confirm nothing
   clips badges, truncates folder names or breaks row height.
4. **RTL run (`ar`/`he`)** — confirm the logical row inset and column-header
   arrow-key direction both flip correctly.
5. **`./mach test mail/base/test/browser/browser_*3pane*`** plus the folder-tree and
   thread-tree suites.

### Phase 3 — Decide what the skin is actually for

An honest fork: the current work is a *skin*, and a skin is a legitimate finished
product. Deciding it is one is a valid outcome and closes the project.

If instead the goal remains the design as drawn, then Phase 4.

### Phase 4 — The markup rewrite (only if Phase 3 says so)

This is where `about3Pane.js` and the widget layer stop being untouchable, and where
"features survive by construction" stops being true. Everything in
`A11Y-L10N-AUDIT.md` Parts B and G exists for this phase and should be read *first*,
not consulted afterwards.

The four hard preconditions:

1. **Preserve the runtime ARIA contracts.** ~2/3 of the accessibility surface is
   applied at runtime by `tree-view.mjs`, `tree-listbox-mixin.mjs` and the row
   modules, and depends on `data-label-id`, the `.{column}-column` cell selectors and
   the `<listId>-row<N>` id scheme. Break one and every attribute in Part B silently
   stops being applied, with no error.
2. **Do not follow the design's tab-stop model.** It makes every folder row, chip and
   hover action a plain `<button>`. The baseline is single-digit tab stops via two
   `aria-activedescendant` containers plus three roving groups.
3. **Do not "fix" `aria-live="off"` to `polite`** on the thread pane header. It looks
   like an improvement in review and is catastrophic in use — one announcement per
   arrow-key press in a 5,000-message folder.
4. **Do not half-change the reverse tabindex.** Keeping `row-reverse` while dropping
   the positive tabindexes silently reverses header keyboard order, and no visual
   diff catches it.

Plus the four design/Thunderbird conflicts that must be settled before any markup
lands: vendor or drop the Google Fonts; translate the `<x-dc>` React spec rather than
embed it; no inline styles; every new string via a Fluent `data-l10n-id`, with the
~55 localizer-chosen accesskeys preserved when XUL menus become Material list items.

### Phase 5 — Platform scope

The rewrite is scoped **Windows only** by `6a3ba612860`. That scope does not relax
parity, accessibility or localization, and macOS/Linux code paths must not be
deleted. Widening the scope is a separate decision that needs its own build matrix.

---

## Verification evidence for this file

Claims here were re-derived rather than inherited. Method, so a successor can
repeat or refute it:

| Claim | How it was checked |
|---|---|
| Guard counts (§E) | `grep -o` for `lwtheme` and for `:root:not([lwtheme])`, then a comment-stripping pass (`re.sub(r'/\*.*?\*/', '', s, flags=re.S)`) over all seven sheets |
| Brace balance | Same comment-stripped pass, counting `{` and `}` |
| Zero positive `[lwtheme]` selectors | `re.findall(r':root\[lwtheme', stripped)` — 0 in all seven |
| Density axis is wired to what Thunderbird writes | `material-tokens.css:110-138` carries both `:root[data-m3-density="…"]` and `:root[uidensity="compact"|"touch"]`, plus logical inline insets |
| Stylesheet links and packaging | `grep` over `about3Pane.xhtml` (:39, :54-58), `messenger.xhtml` (:116-117), `jar.inc.mn` (:121-127) — 7 files packaged, 7 linked |
| Media-query inventory | `grep -n "@media"` across all seven sheets — 27 occurrences, 6 of which are `prefers-contrast` / `forced-colors` fallbacks and are the trap surface |
| F6 gates unmet | `A11Y-L10N-AUDIT.md:704-717` — all eight boxes are `- [ ]` |

**External state this file reports but could not verify from the repository:**
CI run colour, the release count and their byte sizes, and self-hosted runner
health. Those are GitHub-side and host-side facts. They are recorded here as
reported to this pass, not as observed by it. Anyone relying on them should check
the Actions tab and the Releases page directly.
