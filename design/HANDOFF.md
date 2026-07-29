# Handoff — Material Mail 3-pane

Everything a successor needs cold. Assume no memory of this project.

Companion documents: `ROADMAP.md` (what is done and what is not), `REWRITE-CONTRACT.md`
(the 38-box parity ledger and its evidence), `INFRA.md` (runners and pipeline),
`A11Y-L10N-AUDIT.md` (what must not break), `README.md` (the design snapshot).

---

## 0. The thirty-second briefing

- Branch: **`design-import/thunderbird-3pane`**. Never touch `main`. Never push upstream.
- This repo is the **comm tree only**. No `mach`, no `mozconfig`, no `mozilla/`. It has
  to sit at `comm/` inside a mozilla-central checkout to build anything.
- The work is a **CSS restyle** of upstream's 3-pane. Seven stylesheets, plus link
  elements and packaging entries. **`about3Pane.js` has never been modified** and that
  is the entire safety argument.
- Scope is **Windows only**. That does not relax parity, accessibility or localization,
  and macOS/Linux code paths must not be deleted.
- **Nothing has ever been built and launched.** Every proof is static.

---

## 1. Files, and who owns what

### Files this project added (the only things that could have broken anything)

| File | Loaded from |
|---|---|
| `mail/themes/shared/mail/material-tokens.css` | both `about3Pane.xhtml:39` and `messenger.xhtml:116` |
| `mail/themes/shared/mail/m3-layout.css` | `about3Pane.xhtml:54` |
| `mail/themes/shared/mail/m3-folder-pane.css` | `about3Pane.xhtml:55` |
| `mail/themes/shared/mail/m3-thread-pane.css` | `about3Pane.xhtml:56` |
| `mail/themes/shared/mail/m3-quick-filter.css` | `about3Pane.xhtml:57` |
| `mail/themes/shared/mail/m3-message-pane.css` | `about3Pane.xhtml:58` |
| `mail/themes/shared/mail/m3-chrome.css` | `messenger.xhtml:117` |
| `.github/workflows/windows-installer.yml` | — |
| `.github/workflows/lint-m3.yml` | — |
| `design/*.md` | — |

Packaging: `mail/themes/shared/jar.inc.mn:121-127`, one line per sheet.

Two facts about that table that are easy to get wrong:

- **`m3-chrome.css` is linked from `messenger.xhtml`, not `about3Pane.xhtml`.** Its
  targets (`#tabmail`, `#navigation-toolbox`, `#spacesToolbar`, `#PopupGlodaAutocomplete`,
  `in-app-notification-container`) have **zero** occurrences in `about3Pane.xhtml`.
  Loading it there would be 19,520 bytes of dead CSS.
- **`material-tokens.css` is linked twice, deliberately.** Custom properties do not
  cross the `<browser>` boundary, so `messenger.xhtml` needs its own copy or every
  `var(--m3-*)` in `m3-chrome.css` drops as invalid-at-computed-value-time.

### NEVER EDIT

| File | Why |
|---|---|
| **`mail/base/content/about3Pane.js`** | The behaviour layer. Its being unmodified is what makes "features survive by construction" a claim about evidence rather than about hope. Verify with `git log -1 --` on it: the last commit must be an upstream `Bug …` commit, not ours. |
| `mail/base/content/widgets/*.mjs` | Same. `tree-view.mjs`, `tree-listbox-mixin.mjs` and the row modules carry ~2/3 of the accessibility surface at runtime. |
| `mail/base/content/about3Pane.xhtml` | Frozen at **+23/-0** — link elements and XML comments only. |
| `mail/base/content/about3Pane.css` | Upstream's. The M3 sheets are written to *match* its specificity and win on source order, never to escalate past it. |
| `mail/themes/shared/jar.inc.mn` | Frozen at the seven packaging lines. |
| Repo root `README.md` | Upstream Thunderbird's, not ours. |
| `design/REWRITE-CONTRACT.md` | Only the ratify agent edits it. |

### Ownership under the parallel-agent workflow

One agent per file, no overlaps. If you are handed a task, **edit only the files
your task names** — other agents are working simultaneously and a stray edit
collides. All git operations (`add`/`commit`/`push`/`checkout`/`stash`) are done by
a single ratify agent; worker agents run read-only git at most.

`design/ROADMAP.md`, `design/HANDOFF.md` and `design/README.md` are the operations
surface and are owned together.

---

## 2. The nine CI blockers, and their fixes

Nine independent things had to be cleared before the Windows installer workflow
went green. Each cost at least one red run. They are recorded here in the order a
build hits them, with the workflow line that fixes each — every one is also
commented in place in `.github/workflows/windows-installer.yml`.

### 1. MAX_PATH — the gecko clone dies half-finished

mozilla-central carries web-platform test paths well past Windows' 260-character
limit. Without a fix the clone dies partway with a wall of `Filename too long` and
leaves a half-checked-out tree that fails much later and confusingly.

**Fix** (`:125-134`, the *first* step, before anything clones): `git config --system
core.longpaths true` **and** the `LongPathsEnabled` DWORD in the registry. Both.

### 2. `MOZ_AUTOMATION=1` — is not a "be quiet, I'm CI" flag

It is the Taskcluster contract. Off Taskcluster it breaks the build in four
independent places:

1. `comm/build/moz.configure/gecko_source.configure` — `comm_source_repo` and
   `gecko_source_repo` call `die()` when `MOZ_AUTOMATION` is set and
   `COMM_HEAD_REPOSITORY` / `GECKO_HEAD_REPOSITORY` are absent. Hard configure
   failure: *"Unable to determine COMM source repository."*
2. mozilla `build/moz.configure/init.configure` — `vcs_checkout_type` raises
   `FatalCheckError("unable to resolve VCS type; must run from a source checkout
   when MOZ_AUTOMATION is set")`.
3. mozilla `build/moz.configure/bootstrap.configure` — `bootstrap_default` returns
   False under automation because Taskcluster is expected to supply
   `MOZ_FETCHES_DIR`. Nothing supplies it here, so nsis, 7zz and upx are never
   fetched and packaging dies at the installer step, *after* the build is paid for.
4. `toolkit/mozapps/installer/windows/nsis/makensis.mk` — sets `USE_UPX := --use-upx`
   on `$(UPX)$(MOZ_AUTOMATION)`, forcing upx on merely because automation is claimed,
   even when configure found no upx. `exe_7z_archive.py` then execs a missing binary.

**Fix** (`:84-109`): never set it. The one thing it bought was silencing mach's
desktop notifications and the Defender-exclusion UAC prompt — `MOZ_NOSPAM: '1'`
covers the first (`mozbuild/base.py` checks both) and `bootstrap --no-system-changes`
covers the second.

### 3. The mozconfig at the default path gets silently replaced with Firefox's

`mach bootstrap` ends in `_output_mozconfig()`. If a mozconfig exists at
`$topsrcdir/mozconfig` it calls `_check_default_mozconfig_mismatch()`, sees
`"browser" != "comm_mail"`, and asks *"Do you want to overwrite the config?"* —
and mozboot's `prompt_yesno` **returns True unconditionally when non-interactive**.
The comm/mail artifact mozconfig is replaced with an empty one, and six hours later
you have built, and shipped, Firefox.

**Fix** (`:111-122`): keep the mozconfig **off** the default path and point
`MOZCONFIG: D:\gecko\mozconfig-ci` at it. `find_mozconfig()` honours `$MOZCONFIG`
first, and the mismatch path is only reached when the default path exists. Must be
a literal — GitHub does not expand `env` into `env`.

### 4. MozillaBuild is absent, and mach will not start without it

`AssertionError: MozillaBuild was not found at "C:\mozilla-build".` It is not on
hosted runner images, and `mach bootstrap` cannot install it because mach refuses to
start without it — a deadlock.

**Fix** (`:337-350`): install it first, from Mozilla's own FTP, NSIS silent
(`/S`, and `/D` must be last and unquoted). Then export `MOZILLABUILD`, which matters
beyond the assertion: `build/mach_initialize.py::_maybe_activate_mozillabuild_environment`
prepends msys2 tools to `PATH` (this is what supplies a usable `make`, `sh`), and
`mozboot/bootstrap.py` dispatches on it — with it set you get `MozillaBuildBootstrapper`,
without it `WindowsBootstrapper`.

### 5. Moving a gecko submodule breaks two relative pointers, one after the other

A submodule worktree has two:

1. the worktree's `.git` **file** → `gitdir: ../../.git/modules/…`
2. that gitdir's `core.worktree` → `../../../../vendor/gecko`

Fixing (1) by relocating the gitdir just exposes (2): `fatal: cannot chdir to
'../../../../vendor/gecko'`. Both observed on real runs.

**Fix** (`:204-250`): fetch the pinned gecko revision **directly into `$GECKO_DIR`**.
Nothing is moved, so there is no pointer to break. The pinned SHA lives in this
repo's tree as a gitlink entry, readable with `git ls-tree HEAD vendor/gecko` even at
depth 1, and GitHub permits fetching an exact commit — so a shallow pinned fetch
needs no history and no branch.

**gecko must remain a real git checkout.** This is not cosmetic:

- `init.configure`'s `vcs_checkout_type()` is a plain `os.path.exists(topsrcdir/.git)`
  test. No `.git`, and `VCS_CHECKOUT_TYPE` and `GIT` never reach substs.
- Without `GIT`, `mozbuild/base.py` falls back to `SrcRepository`,
  `artifact_commands.py` sets `git=None` and `hg=None`, and
  `artifacts.py::_get_recent_public_revisions()` then calls `run_hg()` with
  `self._hg = None` → `TypeError`, mid-build.
- `bootstrap.configure` shells out to `mach taskgraph tasks` for toolchains. No repo,
  no taskgraph, no nsis/7zz, no installer.

### 6. `C:` is too small; build on `D:`

Measured on a real run: `C:` has ~33 GB free, `D:` has ~147 GB. The documented
"14 GB SSD" figure understates the image badly.

**Fix** (`:82`): `GECKO_DIR: D:\gecko`, and everything downstream uses
`$env:GECKO_DIR\obj-tb`.

**Caveat with teeth:** `D:` on an Azure-backed hosted runner is the temporary/resource
disk. It is persistent for the lifetime of the VM, which is the lifetime of *this job*.
It does **not** survive into a second job — if this workflow ever grows a `needs:`,
that job will not see `D:\gecko` and everything it wants must be uploaded as an
artifact first.

### 7. The concurrency group ate queued releases

`cancel-in-progress: false` is not enough. It only protects the run already
executing. A run sitting **QUEUED** in a group is superseded whenever a newer run
joins that group — so with builds this long and pushes this frequent, intermediate
commits silently lost their release. **Observed twice.**

**Fix** (`:54-63`): declare **no concurrency group at all** on the installer workflow.
The requirement is a release for every push, so every push gets its own independent
run and they queue naturally. (The lint workflow *does* have a group, scoped to a
name nothing else uses — superseding an in-flight lint run is fine, it produces no
artefact that can be lost, and the installer declares no group so it cannot be a
member of the lint one.)

### 8. Compiler options passed to a build with no compiler

`--enable-artifact-builds` implies `--disable-compile-environment` (mozilla
moz.configure `imply_disable_compile_environment`). `--enable-optimize` and its
neighbours live behind the compile environment, so configure rejects them outright:
`InvalidOptionError: --enable-optimize is not available in this configuration`.

Observed on a real run — and it fails at *configure*, after bootstrap has already
downloaded the toolchains, so the cost is paid before the error appears.

**Fix** (`:393-404`): emit those flags into the mozconfig **only** for a `full` build.

### 9. The installer is not where `package-name.mk` implies

The old assumption was `dist/install/sea/`, from `package-name.mk`'s `PKG_INST_PATH`.
It cost a run: the build and the packaging both succeeded and the locate step then
threw, looking one directory too deep. Verified from a real run, the file is at:

    D:\gecko\obj-tb\dist\thunderbird-155.0a1.en-US.win64.installer.exe

**Fix** (`:552-575`): search `dist/` recursively, **excluding `maintenanceservice_installer.exe`**
— a different, much smaller installer that also matches `*installer.exe` and sits in
`dist/bin` and `dist/thunderbird` — and fall back to the historical location before
giving up.

Related, same family: there is **no `mach build installer` target** in current
mozilla-central. On Windows the NSIS installer is a side effect of `make package`:
`packager.mk`'s `make-package` rule runs `$(MAKE) -C windows ZIP_IN=$(PACKAGE) installer`
when `OS_ARCH=WINNT` and `MOZ_PKG_FORMAT=ZIP`, and `comm/mail/installer/windows/Makefile.in`
supplies that target through `makensis.mk`.

### Three more that cost runs but are not on the list of nine

- **`fetch-depth: 500`, not `1`** (`:187-199`). An artifact build of comm/mail resolves
  its prebuilt binaries against the **comm** history: `artifact_commands.py` does
  `topsrcdir = substs.get("commtopsrcdir", topsrcdir)`, and `artifacts.py` then runs
  `git rev-list --topo-order --max-count=500` there. At depth 1 the only revision on
  offer is this fork's own tip, which comm-central CI has never built, and `mach
  artifact install` aborts with *"Could not find any candidate pushheads"*. 500 matches
  `NUM_REVISIONS_TO_QUERY` exactly.
- **The failure-log upload pointed at `C:\gecko`** (`:660`), which stopped being the
  build location at fix #6. Every failed run uploaded an empty artifact.
- **The lint workflow explained itself into a YAML syntax error** — a comment broke
  the parse. Fixed in `79bcc6fbd88`.

### Four unresolved risks — read before debugging the next red run

Documented in place at `.github/workflows/windows-installer.yml:476-523`. They could
not be verified without a live run, so they are documented rather than guessed at.

1. **Artifact lookup may be keyed on Mercurial changesets, not git.** `TaskCache.artifacts`
   builds the index namespace `comm.v2.comm-central.shippable.revision.<REV>.thunderbird.win64-opt`.
   For a git checkout with no git-cinnabar metadata (ours), `<REV>` is a raw git SHA.
   If comm is still hg-primary for indexing, every lookup 404s — and the failure reads
   *"Could not find any candidate pushheads"*, which **looks like a fetch-depth problem
   and is not one. Increasing fetch-depth will not help.** Escape hatches, all settable
   as job env: `MOZ_ARTIFACT_TASK_WIN64_OPT=<taskId>` (preferred — needs no revision
   mapping), `MOZ_ARTIFACT_URL=<url>`, `MOZ_ARTIFACT_REVISION=<rev>`.
2. **This fork's SHAs must actually match comm-central's.** The walk only succeeds if
   recent ancestors of HEAD are byte-identical to commits comm-central CI built. Same
   escape hatches.
3. **Toolchain bootstrap depends on taskgraph generation succeeding.** If taskgraph
   cannot derive parameters from a depth-1 detached-HEAD gecko clone, it raises, the
   exception is swallowed into a log warning, and nsis/7zz/upx are quietly not fetched.
   The Configure step turns that silence into an explicit `::warning::` — if you see it,
   **the fix is a deeper gecko clone, not more mozconfig flags.**
4. **Artifact/source skew between comm and gecko.** A comm/mail artifact build layers
   this frontend over binaries built against whatever mozilla-central revision
   comm-central pinned at that time; `vendor/gecko` pins its own. Shows up as missing
   chrome or XPT/interface errors **at runtime, not as a build failure**. Fix: move
   `vendor/gecko` to the revision in comm's `.gecko_rev.yml`.

---

## 3. The two cascade rules. Both have already caused real bugs here.

### Rule 1 — colour rules are guarded with `:root:not([lwtheme])`

When a user installs a lightweight (third-party) theme, `LightweightThemeConsumer`
sets `[lwtheme]` on `documentElement` and `ThemeVariableMap.sys.mjs` writes that
theme's colours into custom properties. **The user's theme must win.**

Originally `m3-chrome.css` guarded its colour rules and the five content sheets
guarded nothing — so the chrome stood down for a user's theme and the 3-pane content
did not. That was the last unticked box (Theming) for two whole passes.

**What is guarded:** every colour-bearing declaration — `background-color`, `color`,
`border-color`, colour-only custom-property remaps like `--tree-card-*` / `--listbox-*`
/ `--tree-view-*` (that block is not a token definition; it is how the sheet paints
every row).

**What must stay UNGUARDED, and this is equally load-bearing:**

- Every `:focus-visible` outline, and the two keyboard-cursor rings that are not
  literally `:focus-visible` (`tr.card-layout.current`, `tr.table-layout.current`).
  **Accessibility must never depend on which theme is installed.**
- Icon `fill` / `stroke` / `-moz-context-properties`, including the folder-colour
  `--icon-color` path, which `folder-tree-row.mjs:259` writes inline.
- `background-image` that carries an icon glyph rather than a surface.
- `content:`.
- `border-width` / `border-style` / `border-radius` — kept outside the guard in all
  three shorthand decompositions, so a theme cannot un-round a pane card or collapse
  the splitter's grow indicator. And `border: 1px solid transparent`, which is the
  absence of paint and is load-bearing for `ThreadCard.ROW_HEIGHT`.
- The `opacity` family, all layout, sizing, typography and motion, and local metric
  custom properties.
- **Custom-property *definitions*.** `material-tokens.css` carries **zero** guards, by
  design. Guarding a definition only makes its guarded consumers resolve to nothing.

### Rule 2 — THE TRAP: the guard adds (0,2,0). A media query adds none.

This is the single most repeated bug on this branch. Read it twice.

`:root:not([lwtheme])` contributes **(0,2,0)** of specificity. `@media (prefers-contrast)`,
`@media (forced-colors)` and `@container` contribute **zero**.

So when a base colour rule was raised by the guard and its accessibility fallback was
not, the fallback stopped winning on **source order** and started losing on
**specificity** — silently, to the very rule it exists to undo.

**Three such regressions were found and fixed**, all with the same one-line fix
(prefix the fallback with the same guard, restoring the equal-specificity /
source-order win):

| Sheet | Fallback | Failure it caused |
|---|---|---|
| `m3-layout.css` | `@media (prefers-contrast)` splitter hairline | `border-color: transparent` from the (1,2,0) guard beat `var(--m3-outline)` from the (1,1,0) fallback — a 1px invisible border costing 2px of content box |
| `m3-thread-pane.css` | the whole `@media (forced-colors)` block, 12 selector lines | `#threadPaneSelectedCount` lost `SelectedItem`/`SelectedItemText`, so the "N selected" pill went indistinguishable from the header bar in High Contrast; `thread-card-tags[tags]` lost `background-color: transparent` to a forced `color-mix()`, painting an opaque box over the row |
| `m3-message-pane.css` | `@media (prefers-contrast)` findbar divider | (1,0,1) fallback could no longer restore `--m3-outline` over the (1,2,1) guard |

**Look for a fourth.** There are 27 `@media` blocks across the seven sheets; the
`prefers-contrast` / `forced-colors` ones are the trap surface:
`m3-layout.css:260`, `m3-folder-pane.css:732` and `:806`, `m3-thread-pane.css:89`,
`:150`, `:217`, `:1066`, `:1077`, `m3-message-pane.css:228`, `m3-chrome.css:259`
and `:511`.

**But over-guarding is equally a bug.** A prefix on a fallback that has no guarded
competitor *removes* an accessibility affordance the moment a theme is installed.
Deliberately unprefixed, and verified so:

- `m3-thread-pane.css`'s `forced-colors` **focus-ring group** (`:focus-visible`,
  `tr.current > td > .card-container`) — the rings it overrides are themselves
  unguarded, so it already out-ranks them.
- `m3-folder-pane.css`'s six `forced-colors` focus selectors, same reason, and its
  `prefers-contrast` `--icon-color: currentColor !important` — `!important` needs no
  specificity help.
- `m3-thread-pane.css`'s `@media (prefers-contrast)` block (selected card border,
  selected row outline). Both use `currentColor`, no guarded rule sets those
  properties on those selectors, and prefixing them would delete a high-contrast
  affordance whenever a theme is installed.

### A third cascade trap, for completeness: CSS Nesting inherits the *most specific* parent

A rule nested under a comma-list parent that includes an id inherits **that id's
weight**. `m3-thread-pane.css`'s column-picker override was (0,1,1) and could never
beat a nested `& > :is(menu, menuitem)` that resolved to (1,0,1) because
`#threadPaneDisplayContext` was in the parent list. Every picker item rendered at the
full 48px, so a 23-row popup stood ~1130px tall and scrolled on any display under
~1200px — precisely the failure its own comment claimed to prevent.

The fix was **not** to escalate. It was to reroute through *inherited custom
properties* (`--m3-menu-item-size`, `--m3-menu-item-font-size`) set on
`.menupopup-column-picker` and read by the nested rule with the old values as `var()`
fallbacks. Inheritance resolves at the child, so it sidesteps the specificity contest
entirely, and the two popups that do not set the variables are byte-for-byte
unchanged. **This is the pattern to reach for.**

**Audit before adding any more nesting.** This is a live pattern, not a one-off.

---

## 4. Load order is load-bearing

The six section sheets are linked **after** `about3Pane.css`, never before. Each was
written to *match* `about3Pane.css`'s specificity rather than escalate past it, so
they win on source order alone and need no `!important`. Linking them earlier would
silently revert most of the skin while leaving the files looking installed.

Only two `!important` declarations survive anywhere, both in `m3-folder-pane.css`,
and both exist only to match an `!important` that `about3Pane.css` already sets.

Custom-property resolution is unaffected by order — `var()` resolves at
computed-value time — which is why `material-tokens.css` remains the single
definition site.

---

## 5. Standing caveats — every one of these is still true

1. **Nothing has been built and launched.** Not once, by anyone. Every proof is
   static: selector, specificity, cascade and source reading against the JS that
   consumes it. Eleven fixes and four ratification passes have not moved this.
   A green contract is not a working application.
2. **The F6 screen-reader gate cannot be closed statically.** `_setRowAriaAttributes`
   short-circuits unless `Services.appinfo.accessibilityEnabled`, so `aria-level` /
   `aria-setsize` / `aria-posinset` are literally absent from the DOM until AT is
   running. No grep can observe them. All eight F6 gates in `A11Y-L10N-AUDIT.md:704-717`
   are unchecked.
3. **The markup rewrite has not happened.** The message pane reading body lives in
   about:message inside `#messageBrowser`, a separate document that links no M3 sheet;
   `layout-classic` and `layout-wide` are styled only by inheritance; the folder filter
   field, empty states, avatar, body-preview line, command palette, toast stack and
   pinned tabs have no DOM and were correctly not invented.
4. **A known RTL bug ships.** `m3-thread-pane.css:406` uses the physical shorthand
   `padding: var(--m3-row-padding)` over an asymmetric token (`12px 8px 12px 16px`),
   so the card's 16px inset lands on the wrong side under RTL.
5. **A pre-existing upstream bug ships.** All 11 `aria-hidden="hidden"` in
   `about3Pane.xhtml` use an invalid token — `aria-hidden` takes `true`/`false`, and an
   invalid value maps to *undefined*, so those decorative buttons are likely exposed
   today, contrary to clear author intent. Fix it to `"true"` **deliberately**, with
   verbosity re-tested. Do not copy it forward into new markup.
6. **One declaration was deleted rather than guarded**, and is flagged rather than
   buried: `m3-thread-pane.css`'s `:root[lwtheme][lwt-tree] #threadPane > #threadPaneHeaderBar.list-header-bar`
   block. It applied an M3 colour *precisely when* a theme is installed — the bug in
   miniature — and with the fill above it now guarded there is no M3 surface left for
   it to protect. It is still the only declaration loss across all five content sheets.
7. **The contract's guard counts are overstated.** `REWRITE-CONTRACT.md`'s closing
   figures (layout 15 · folder-pane 61 · thread-pane 42 · quick-filter 25 ·
   message-pane 10 · chrome 11) count the bare string `lwtheme` including comment
   prose. Comment-stripped, the real guard-selector counts are **11 · 56 · 30 · 21 ·
   3 · 9**, tokens 0. The guards are real and correctly spelled — this is a
   measurement bug in the documentation, not a defect in the CSS. The same
   paragraph's brace-balance figures (20/20, 98/98, 152/152, 74/74, 9/9) and its
   "zero positive `[lwtheme]` selectors" claim both re-verify exactly.
8. **The command count in the contract's checklist header is wrong.** It says 137
   `cmd_*` commands; `grep -rhoE '\bcmd_[A-Za-z0-9_]+' mail/base/content | sort -u`
   returns **167**. Of those, 155 have a locatable DOM trigger, and exactly **5** are
   reachable by any M3 selector at all.
9. **The self-hosted runners cannot build the Windows installer.** `fowshan-x64` is
   Linux/x86_64 and `super-arm64` is a Raspberry Pi 5 on Linux/aarch64 — wrong OS, and
   in the second case wrong architecture too. The installer belongs on GitHub-hosted
   `windows-latest`. No amount of extra cores or disk changes this. See `INFRA.md`.
10. **This repository is public, and self-hosted runners on public repos are an
    attack path.** **Never add a `pull_request` trigger to a job targeting
    `self-hosted`.** That one line lets any fork PR run arbitrary code on the Pi,
    alongside the unrelated `line5` workloads that own the box.
11. **`super-arm64`'s resource limits are not in effect.** Compose sets `cpus: 3.0` /
    `memory: 8G`, but the Pi kernel reports *"your kernel does not support memory limit
    capabilities or the cgroup is not mounted"*. A heavy job can contend with
    `line5-web` and `line5-tunnel`.
12. **`fowshan-x64` pauses for Minecraft players.** A `docker pause` freezes an
    in-flight build rather than discarding it — but GitHub will eventually time the job
    out or drop the runner connection while paused. If players are on for hours, expect
    that job to need re-running.

---

## 6. Working rules for agents on this branch

- Only edit the files your task explicitly assigns you. Others work in parallel.
- Do not run any **writing** git command. One ratify agent does all git.
- Windows-only scope. Does **not** relax parity, accessibility or localization. Do not
  delete macOS/Linux code paths.
- No remote fonts. No inline `style=` attributes. Every string via a Fluent
  `data-l10n-id` or a DTD entity.
- Re-scan open issues on `Ding-Ding-Projects/agent-global-memory` periodically — that
  repo is the user's channel for changing the global instructions, and a new issue
  applies to work already in flight.
- Default posture on any previous agent's tick is **doubt**. A tick is a claim to be
  tested, not a fact to inherit. Finding a bad tick is the most valuable thing an
  audit can do.
- **Evidence means:** the file, the selector, the DOM element or attribute, and why
  the styling cannot break the behaviour. *"Looks fine"*, *"no reason it would break"*
  and *"CSS cannot affect JS"* are **not** evidence.

---

## 7. Quick verification commands

Read-only. Safe to run at any time.

    # The safety argument. Must show an upstream "Bug …" commit, not one of ours.
    git log -1 -- mail/base/content/about3Pane.js

    # Real guard-selector counts (comment-stripped) and brace balance.
    python -c "import re,glob
    for f in sorted(glob.glob('mail/themes/shared/mail/m3-*.css'))+['mail/themes/shared/mail/material-tokens.css']:
        s=re.sub(r'/\*.*?\*/','',open(f,encoding='utf-8').read(),flags=re.S)
        print(f, 'guards=',len(re.findall(re.escape(':root:not([lwtheme])'),s)),
                 'positive=',len(re.findall(r':root\[lwtheme',s)),
                 'braces=',s.count('{'),s.count('}'))"

    # The trap surface: every accessibility fallback that could be out-specified.
    grep -n "@media (prefers-contrast)\|@media (forced-colors)" mail/themes/shared/mail/m3-*.css

    # Nothing may fetch remotely, import, or embed a font.
    grep -n "@import\|@font-face\|url(http" mail/themes/shared/mail/m3-*.css mail/themes/shared/mail/material-tokens.css

    # Packaging and links must stay in step: 7 sheets, 7 jar lines.
    grep -n "m3-\|material-tokens" mail/themes/shared/jar.inc.mn

---

## 8. External state this document reports but cannot verify from the repository

Recorded honestly, because a successor will otherwise treat them as checked:

- **CI run colour.** The installer and lint workflows are reported green. That is a
  GitHub Actions fact; check the Actions tab.
- **Release count and artifact sizes.** Six releases are reported, the latest
  `tb-155.0a1-b23-fung-zaau` at 85,220,811 bytes. Note that `REWRITE-CONTRACT.md`
  records 85,207,651 bytes for an earlier one — the figures are per-build and drift.
  Check the Releases page.
- **Self-hosted runner health**, addresses (`super` answers on `.232` and sometimes
  `.233`) and the Minecraft pause guard's current behaviour. Host-side facts; see
  `INFRA.md` and re-check reachability before assuming either address.
- **Whether the built installer runs at all.** Nobody has installed one. See caveat 1.
