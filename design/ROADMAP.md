# Roadmap — Material Mail 3-pane

Status of the `design-import/thunderbird-3pane` branch, and what is left.

Read this with `REWRITE-CONTRACT.md` (the parity ledger), `INFRA.md` (build and CI)
and `A11Y-L10N-AUDIT.md` (what must not break). This file is the summary; those
three are the evidence.

---

## The one-sentence version

**This is a CSS-layer restyle of upstream Thunderbird's existing 3-pane, not a
rewrite of it — and nothing on this branch has ever been built and launched by a
human or an agent.**

Everything below follows from those two facts. The first is why the parity
contract can be at 38/38 without a line of behaviour code being written. The
second is why 38/38 is not a release gate.

---

## What is done

### 1. The parity contract is at 38 / 38

`REWRITE-CONTRACT.md` records every box as ticked. The ticks were produced in four
waves — a section pass (30 of 31), a cross-cutting pass (7 of 8), a lightweight-theme
guard pass, and a fallback-prefix pass that closed the last box (Theming).

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

### 3. Windows installer CI is green and publishes releases

`.github/workflows/windows-installer.yml`, 672 lines, roughly a third of them
comments explaining why each line is the way it is. Nine separate blockers had to
be cleared before the first green run — they are enumerated in `HANDOFF.md`.

- Artifact build by default; `full` available via `workflow_dispatch`.
- Builds on `D:` (~147 GB measured) rather than `C:` (~33 GB measured).
- Every push publishes a real, non-draft, non-prerelease GitHub Release with the
  installer attached, tagged monotonically off `run_number` and code-named from a
  16-dish dim sum rotation.
- Every release states that it is an unofficial fork build.

### 4. Lint CI is green, including its own self-test

`.github/workflows/lint-m3.yml` runs `./mach commlint -l stylelint` over
`m3-*.css` + `material-tokens.css` and `-l eslint` over `about3Pane.xhtml`.

It uses `commlint`, not `lint`, because only `commlint` inserts `comm/tools/lint`
into mozlint's `config_paths` and thereby makes comm's `.stylelintrc.js` win over
Firefox's. It has no `|| true` and no `continue-on-error`, it fails if the glob
matches zero files, and it carries a self-test that lints a deliberately broken
file and fails the job if stylelint reports it clean. That self-test passes, so
the job is known to be capable of going red rather than merely observed green.

### 5. The behaviour layer is provably untouched

`mail/base/content/about3Pane.js` and `mail/base/content/widgets/*.mjs` have never
been modified on this branch. This is the load-bearing fact behind "features
survive by construction". It has been re-verified at every ratification with
`git status --porcelain`.

The markup delta is `about3Pane.xhtml` **+23/-0** and `messenger.xhtml` **+9/-0** —
every added line a `<link rel="stylesheet">` or an XML comment, zero deleted lines,
zero `style=` attributes.

---

## What is explicitly NOT done

These are not caveats. They are open work, and the contract being green does not
touch any of them.

### A. Nothing has been built and launched. Not once.

Every proof on this branch is *static*: selector, specificity, cascade and source
reading against the JS that consumes it. The installer CI produces a real artifact,
but **no one has installed it and clicked through the 3-pane.**

Not yet observed by anybody, in any form:

- The skin rendering at all, in any layout, theme, seed or density.
- `layout-classic` and `layout-wide`. The design covers exactly one arrangement,
  matching `layout-vertical`; the other two are styled only by inheritance and have
  never been looked at deliberately.
- The four accent seeds, `forced-colors`, and folder colours in a running build.
- Any interaction: drag-and-drop, the 25-item folder context menu, the column
  picker popup at its new ~780px height, sticky quick-filter persistence.

Treat the whole skin as unreviewed. A green contract is not a substitute for
running the application.

### B. The F6 screen-reader gate cannot be closed statically — at all

`A11Y-L10N-AUDIT.md` §F6 lists eight verification gates. **None of them are
checked**, and the first one is structurally unclosable by static analysis:

> `_setRowAriaAttributes` **short-circuits unless `Services.appinfo.accessibilityEnabled`**,
> so `aria-level` / `aria-setsize` / `aria-posinset` are *literally absent* from the
> DOM until an assistive technology is actually running.

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
| RTL: `padding: var(--m3-row-padding)` is a physical shorthand over an asymmetric token (`12px 8px 12px 16px`), so the card's 16px inset lands on the wrong side | `m3-thread-pane.css:406`; token in `material-tokens.css` | Cosmetic mirroring, active l10n defect |
| `aria-hidden="hidden"` is an invalid token — 11 occurrences in `about3Pane.xhtml`. Invalid maps to *undefined*, so those decorative buttons are likely exposed today | upstream markup, pre-existing | Pre-existing upstream bug. Fix to `"true"` deliberately, with verbosity re-tested — do **not** copy forward |
| `about3Pane.js#densityChange` hardcodes its row-height constants instead of deriving them from `--m3-row-padding` / `--m3-gap` | `about3Pane.js` (must not be edited on this branch) | The M3 density axis and the uidensity axis can drift |
| The CSS-Nesting specificity trap is a live pattern, not a one-off | any nesting under a comma-list parent containing an id | Audit before adding more nesting |

### E. Documentation accuracy — one figure in the contract is overstated

`REWRITE-CONTRACT.md` closes with "guard counts are layout 15 · folder-pane 61 ·
thread-pane 42 · quick-filter 25 · message-pane 10 · chrome 11 · tokens 0", and
presents them as mechanically verified.

Re-measured for this roadmap, three different numbers exist per sheet:

| Sheet | Contract figure (`lwtheme` tokens, comments included) | `:root:not([lwtheme])` strings, comments included | **Actual guard selectors, comments stripped** |
|---|---:|---:|---:|
| `m3-layout.css` | 15 | 13 | **11** |
| `m3-folder-pane.css` | 61 | 60 | **56** |
| `m3-thread-pane.css` | 36* | 36 | **30** |
| `m3-quick-filter.css` | 25 | 22 | **21** |
| `m3-message-pane.css` | 10 | 6 | **3** |
| `m3-chrome.css` | 11 | 11 | **9** |
| `material-tokens.css` | 0 | 0 | **0** |

\* the contract says 42 for thread-pane; a raw `lwtheme` token count returns 42 and
a `:root:not([lwtheme])` string count returns 36.

**This is a measurement bug in the documentation, not a defect in the CSS.** The
contract's figure counts the bare string `lwtheme` including its many appearances
in explanatory comment prose. The guards themselves are real and correctly spelled.

Two claims in the same paragraph *do* check out exactly, re-verified independently:
braces balance comment-stripped at 20/20, 98/98, 152/152, 74/74, 9/9 (plus chrome
68/68 and tokens 34/34), and **zero** positive `:root[lwtheme` selectors survive in
any sheet.

---

## What a next phase would need

Ordered by dependency. Phase 1 gates everything after it.

### Phase 1 — Run it. (Blocks all other phases.)

Install a release artifact on a real Windows machine and open the 3-pane. Nothing
in the next four phases is meaningful until somebody has seen the skin render once.

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
4. **RTL run (`ar`/`he`)** — will surface the known `m3-thread-pane.css:406`
   physical-shorthand bug, and should also confirm column-header arrow-key direction
   flips.
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
| Density axis is wired to what Thunderbird writes | `material-tokens.css:98-107` carries both `:root[data-m3-density="…"]` and `:root[uidensity="compact"|"touch"]` |
| Stylesheet links and packaging | `grep` over `about3Pane.xhtml` (:39, :54-58), `messenger.xhtml` (:116-117), `jar.inc.mn` (:121-127) — 7 files packaged, 7 linked |
| Media-query inventory | `grep -n "@media"` across all seven sheets — 27 occurrences, 6 of which are `prefers-contrast` / `forced-colors` fallbacks and are the trap surface |
| F6 gates unmet | `A11Y-L10N-AUDIT.md:704-717` — all eight boxes are `- [ ]` |

**External state this file reports but could not verify from the repository:**
CI run colour, the release count and their byte sizes, and self-hosted runner
health. Those are GitHub-side and host-side facts. They are recorded here as
reported to this pass, not as observed by it. Anyone relying on them should check
the Actions tab and the Releases page directly.
