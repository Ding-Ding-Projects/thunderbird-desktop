# Handoff — Material Mail 3-pane

Everything a successor needs cold. Assume no memory of this project.

Companion documents: `ROADMAP.md` (what is done and what is not), `REWRITE-CONTRACT.md`
(the 38-box parity ledger and its evidence), `INFRA.md` (runners and pipeline),
`A11Y-L10N-AUDIT.md` (what must not break), `README.md` (the design snapshot).

> [!NOTE]
> **Runtime vertical slice — 2026-07-31.** `main` now contains a packaged
> `chrome://messenger/content/materialMail.xhtml` content tab opened from Help →
> Open Material Mail preview. It provides the design-folder Mail/Settings/
> Changelog/History/Notifications/Tools pages, local preview preferences, and an
> anchored regex builder. The page is explicitly labelled a preview: it does not
> replace upstream mail behavior, and it is not visual sign-off until a real
> packaged capture is made. Verify the slice with `python design\verify-material-preview.py`
> plus the i18n/regex Node suites.

> [!IMPORTANT]
> **Current integration status — 2026-07-31.** The source/runtime baseline for this
> handoff update is `e4867411c3aa81de4527d843913b966d0ef89c1c` on `main`, pushed
> to `origin`; the upstream check is **63 ahead / 0 behind**. The Gecko gitlink is
> `fdd583cd5a10d051053acda8b760c3bd5d800034`. The documentation commit that records
> this baseline follows it, so `e486741…` is the exact source SHA under discussion.
> Lint [30625833503](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625833503)
> and installer [30625833498](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625833498)
> are verified green. Release
> [`tb-155.0a1-b54-wu-gok`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b54-wu-gok)
> is non-draft/non-prerelease, contains the real Windows installer
> `thunderbird-155.0a1.en-US.win64.installer.exe`, and was built from that exact SHA.
>
> The current b54 runtime observation is bounded: the onboarding/start page remains
> upstream Thunderbird UI, while the same b54 package contains the seven Material
> 3-pane stylesheet/token files. This is a packaging/surface-boundary finding, not
> evidence that the start page is supposed to be Material, and not evidence that any
> other non-3-pane surface is covered. The current exact-SHA browser dispatch
> [30625878368](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625878368)
> completed **failed** after setup/build. Its packaged-CSS static suite passed `1/1`
> with zero unexpected results and chrome passed with zero unexpected results; the
> 3-pane, widgets, folder, and authored M3 gates remained open with respectively
> `92`, `2`, `12`, and `5` unexpected results. The authored M3 suite recorded
> `119 passed / 4 failed / 13 TODO`; artifact `8791840623` contains the raw logs.
> These results do not promote a parity, accessibility, layout, or visual sign-off.

> [!NOTE]
> **Prior current-source browser checkpoint — 2026-07-31.** Dispatch
> [30617422725](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30617422725)
> built and launched the application from `143a01dc6c1`. The harness self-test,
> static packaged-CSS group, chrome group, and project-authored M3 group passed;
> the M3 group recorded **98 passed / 0 failed / 13 TODO** with zero unexpected
> results. The 3-pane group failed with **92 unexpected results** and a truncated
> `17 resolved / 14 finished` gate, widgets failed with **2** unexpected results,
> and folder failed with **12**. The artifact records the same stored-pane-width,
> folder-tree/mode, pane-splitter, and folder-header failure families already
> seen in earlier runs. This is current runtime evidence, not a green parity
> sign-off. The current release proof is b54 above, and the browser result is
> recorded in the current integration block with artifact `8790660197`.

---

## 0. The thirty-second briefing

- Branch: **`main`**, pushed to `origin`. Never push upstream; the old
  `design-import/thunderbird-3pane` name below is historical.
- This repo is the **comm tree only**. No `mach`, no `mozconfig`, no `mozilla/`. It has
  to sit at `comm/` inside a mozilla-central checkout to build anything.
- The work is a **CSS restyle** of upstream's 3-pane. Seven stylesheets, plus link
  elements and packaging entries. **`about3Pane.js` has never been modified** and that
  is the entire safety argument.
- Scope is **Windows only**. That does not relax parity, accessibility or localization,
  and macOS/Linux code paths must not be deleted.
- ~~**Nothing has ever been built and launched.** Every proof is static.~~
  **NO LONGER TRUE — this is the single most important change since the last handoff.
  See §0.1.**

---

## 0.1 Historical runtime snapshot — 2026-07-29 (superseded by the current block above)

**The browser tests ran. This project is no longer static-proof-only.** For the whole of its
life until today every claim here rested on reading selectors and computing specificity.
There is now runtime evidence, and it is **not green**.

At that snapshot, `HEAD` was `48cc94017df` on `design-import/thunderbird-3pane`,
pushed and level with the then-current `upstream/main`. The contract was 33 / 38,
and the mail delta was measured before later upstream merges and the current CSS
translation. Use the current integration block above for HEAD, upstream drift,
guard counts, file sizes, and CI verdicts.

### The test results, honestly

| Suite | Verdict |
|---|---|
| harness self-test (asserts a failure IS reported) | ✅ so the suite is **not** vacuous in that respect |
| `static` — `browser_parsable_css` over the **packaged** M3 sheets | ✅ **success** — our CSS parses in a real build |
| `chrome` — spaces toolbar, tabmail | ✅ success |
| project-authored M3 tests | ✅ **98 passed / 0 unexpected**; 13 TODO entries are expected upstream-compatibility cases |
| `3-pane` — thread tree, folder tree, pane focus, findbar | ❌ failure |
| `widgets` — tree-view, pane-splitter, thread-card tags | ❌ failure |
| `folder pane`, folder modes, quick filter | ❌ failure |

**8535 assertions PASSED. 67 unexpected failures, reducing to 8 root causes, of which exactly
ONE is ours.**

> [!CAUTION]
> **Corrected 2026-07-29.** An earlier version of this section said "128 real failures across 25
> distinct sites". That was wrong, and wrong in a way that changes conclusions, so it is corrected
> rather than footnoted. The right metric is mozlog entries carrying the `expected` key
> (= TEST-UNEXPECTED-FAIL): **67**, not 128. Three separate noise classes have to come out first:
> pref-leak `changed preference:` entries (**24**), our own `todo_is`/`todo` (**12**), and — the one
> that fooled me — **57** `handleEvent() was unable to perform a11y checks on hidden node` entries
> emitted by mochitest's own `AccessibilityUtils` **without** an `expected` key, i.e. the harness
> declares them expected itself.
>
> So the claim that `browser_paneSplitter.js` "failed 59 times" was false. The widgets suite has
> **two** unexpected entries, and the 57-count must never be quoted as failures again.

| suite | PASS | unexpected | gate |
|---|--:|--:|---|
| 3pane | 2468 | **53** | FAIL |
| widgets | 4967 | **2** | FAIL |
| folder | 909 | **12** | FAIL |
| chrome | 806 | 0 | PASS |
| m3 (ours) | 98 | **0** | PASS |
| static | 1 | 0 | PASS |

`browser_parsable_css.js` reported *All the styles (478) loaded without errors* — no CSS parse
error anywhere in the tree.

**Real coverage loss to know about:** after a TIMEOUT the runner abandons the rest of that
process's queue, so **six files never started at all** — `browser_threadTreeSelection.js`,
`browser_threadTreeSorting.js`, `browser_threads.js`, `browser_threadCardTags.js`,
`browser_treeListbox.js`, `browser_treeView.js`. Zero assertions from any of them, and they are
exactly the thread-pane/tree-view files. Fixing R1 should recover them.

**The failures are deterministic, not flaky.** Runs `30495583685` (`4bc02b0`) and `30498533920`
(`6548235`, after merging 4 upstream commits) produced **byte-identical** failure sets: 128 and
128, zero fixed, zero new. Do not spend time on a flakiness theory.

### Both questions are now ANSWERED — and one of them against me

**1. Are those failures ours?** **Exactly one root cause is: R1, and it is confirmed.**

**R1 — our folder-row pitch makes low folder rows unclickable.** `m3-folder-pane.css` set a row's
`min-block-size` from `--m3-control-size` (**48px**) plus 2px margin either side = **52px pitch**,
against upstream's **26px** (`--list-item-min-height`, `tree-listbox.css:8`). At exactly **2.00x**
upstream's vertical budget a 12-row two-mode folder tree overflows a 768px-tall desktop, so
`synthesizeMouseAtCenter` on a low row lands outside `#folderTree`'s scrollport, `_onClick` never
runs, and `testUnreadFoldersAutoRemovalWithSelection` times out after 50 tries. The pitch was
**measured off the failure screenshot** (rows at y = 153, 205, 257 … exactly 52px apart, with a
scrollbar thumb already present at 11 rows), not assumed. That one cause accounts for **47 of the
53** unexpected 3pane failures — the other 46 are cleanup that never ran because the task aborted.

**FIXED** in this commit: row height now has its own token, `--m3-list-row`
(28px compact / **36px** comfortable / 48px touch), decoupled from `--m3-control-size`, which stays
at 48px because *that* is a pointer target and a list row is not. Additive block metrics halved
(168px → 84px of fixed air across five mode sections). **Not yet re-verified by a run** — dispatch
the suite and confirm 47 → 0 before ticking anything.

The remaining seven causes are upstream, environment or undetermined. The two "stored width"
timeouts are **grid clamping at 976px on a 1024px runner**, not a persistence defect — the same
restore code returned **640px to the pixel** at 1537px in the same file, and
`browser_paneSplitterGaps.js` passed 27/27. **The session/state-persistence tick is NOT revoked.**
Amendment required though: our splitters occupy **8px vs upstream's 1px** (+7px each, +14px total),
so a marginal restore can clamp on our layer where it would not upstream. The comment at
`m3-layout.css:184-186` claimed this was "an improvement, not a regression" by comparing against
the 5px *hit area* instead of the 1px *occupy size* — corrected in this commit.

Older evidence, kept because the reasoning is still useful:

- *Toward upstream's*: incoming upstream commit `fb6114783cc` is **"Bug 2056142 — Fix bct1
  failures part 1 — Handle virtual tree a11y click checks"**, which matches the exact text of
  the worst cluster (`browser_paneSplitter.js`, **59** failures, "handleEvent() was unable to
  perform a11y checks on hidden node ... tagName: html"). Upstream is mid-way through fixing
  its own browser-chrome breakage. Note "part 1" — the rest has not landed.
- *Toward ours*: `browser_folderPaneVisibility.js` and `browser_messagePaneVisibility.js` both
  time out on **"the pane should reach the stored width — timed out after 50 tries"**. A test
  polling for a **width** that never arrives is the classic CSS-regression signature, and we
  style the splitters. If those two are ours, the **session/state persistence** box — ticked on
  the argument that splitter sizes are inline custom properties that out-rank our rules — is
  **void** and must be revoked.

> [!IMPORTANT]
> **A decisive experiment is in flight: run `30499955896` on branch `experiment/no-m3-css`
> (commit `3ea83aad517`).** That branch is `HEAD` with **only** the eight `<link>` elements this
> project added removed — 6 from `about3Pane.xhtml`, 2 from `messenger.xhtml` — so no M3 rule
> applies while DOM, JS and manifests stay byte-identical. **Read its result first, before
> theorising:**
> - same 25 sites still fail ⇒ the restyle is **exonerated by construction**;
> - failures vanish ⇒ they are **ours**, and the contract must record it.
>
> ```bash
> gh run view 30499955896 --repo Ding-Ding-Projects/thunderbird-desktop --json conclusion,jobs
> ```
>
> The branch is a **throwaway — never merge it.** Delete it once the answer is recorded.
> It was built with `git hash-object` / `update-index` / `write-tree` / `commit-tree` /
> `update-ref` against an isolated `GIT_INDEX_FILE`, so this working tree was never checked
> out — the same discipline `gh-pages` uses, and for the same reason.

**2. Can our own suite's "success" ever be trusted?** **Yes — the gate was right and I was wrong.**
The 13 entries are `todo_is`/`todo`, i.e. **declared expected failures**, so they carry no
`expected` key and the suite genuinely had **0** unexpected failures. There is one real gate hole,
but it is a different one: **empty discovery exits 0**, so a suite that discovers no tests passes.
Close that. Original (incorrect) alarm preserved below for the reasoning trail: `m3.raw.json` records **13** `test_status`
FAIL entries in `browser_m3Accessibility.js` (subtest `testDecorativeRowButtons`), each of the
form *`button-flat tree-button-thread should use aria-hidden="true" — "hidden" is not a valid
ARIA token (audit A4, upstream markup, not ours to change)`* — and the workflow reported that
step **`success`**. Either the gate is tolerating real failures, or those assertions are written
as expected-failures. **This matters because the accessibility box is supposed to close on a
green run of exactly this suite**, so if the gate passes a failing suite, a green verdict from it
proves nothing. Worse, the assertion asserts a **known-broken upstream** behaviour (the
pre-existing `aria-hidden="hidden"` invalid-token bug, 11 occurrences, recorded in
`A11Y-L10N-AUDIT.md` as **A4**), so it can *never* go green against unmodified upstream markup.
Decide whether it should instead assert the invalid token is *present*, be marked `todo`, or be
scoped to nodes we own.

Also still to verify: **does the test enable accessibility at all?** `aria-level` does not exist
until a screen reader runs, because `_setRowAriaAttributes` short-circuits unless
`Services.appinfo.accessibilityEnabled` **or** `Cu.isInAutomation`.
**ANSWERED, and the premise was wrong:** `tree-view.mjs:1110` is
`if (!Services.appinfo.accessibilityEnabled && !Cu.isInAutomation) return`, so it proceeds when
**either** holds, and mochitest sets `Cu.isInAutomation`. Run 30495583685 resolved real values —
`aria-level "1"`/`"2"`, `aria-rowindex`, `aria-setsize`/`aria-posinset`, `aria-expanded`,
`role="row"` — so **the assertions are not vacuous.** The long-repeated claim that these are
unobservable without a screen reader is false for automation.

### Where the logs are

Both runs' artefacts are downloaded, including **four `mozilla-test-fail-screenshot_*.png`** —
the first images of this restyle actually running, which nobody has yet described:

```
<scratchpad>/testlogs/m3-browser-test-logs/          # run 30495583685, pre-merge
<scratchpad>/testlogs-merged/m3-browser-test-logs/   # run 30498533920, post-merge
```

They are mozlog JSONL — one JSON object per line with an `action` field. Parse with python;
`grep` will mislead you. Re-download with
`gh run download <id> --repo Ding-Ding-Projects/thunderbird-desktop --dir <path>`.

### Work that was in flight and is NOT finished

- A **triage wave** (`wf_3b162655-6b6`) was running when this handoff was written: three
  per-suite triage agents, a result-gate auditor, and a synthesiser. Its verdict has not been
  read or acted on. Journal:
  `.claude/projects/…/subagents/workflows/wf_3b162655-6b6/journal.jsonl`.
- An earlier wave (`wf_a3fb50ee-5d6`) was **killed mid-flight** when the process exited. Its
  phase-1 output was salvaged, verified by hand and committed as `5413799559b`; phases 2-5
  never ran. Resume with
  `Workflow({scriptPath: …/material-mail-five-boxes-wf_a3fb50ee-5d6.js, resumeFromRunId: "wf_a3fb50ee-5d6"})`
  if you want those five boxes attacked again.
- `design/REWRITE-CONTRACT.md` has **not** been updated with anything from the test run. No box
  should move until the `experiment/no-m3-css` result is in.

### Two process lessons worth more than the code

1. **Do not commit a wave's output before its completion notification arrives.** Doing so split
   one wave across three commits, put two agents in `m3-thread-pane.css` simultaneously, and the
   extra push is what cancelled the first browser-test run. Now written up as §5.8 of `AGENTS.md`.
2. **A cancelling concurrency group is only safe when the run's output is disposable.** That is
   CI blocker #10 below, and it was introduced in a file whose own comment was correctly
   reasoning about the identical blocker #3 four lines above.

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

## 2. The CI blockers, and their fixes

> [!WARNING]
> **Blockers 1-9 below are fixed. Blocker #10 is listed at the end of this section and was
> fixed in `65482350c23` / `48cc94017df`.** It is the reason the browser tests could never
> finish, and it is the same shape as #7 (the concurrency group that ate queued releases).

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

### 10. A cancelling concurrency group meant the browser tests could never finish

`browser-tests-m3.yml` triggered on every push to `design-import/**` while declaring
`cancel-in-progress: true` — but the job needs a **full** build and carries
`timeout-minutes: 330`, and this project's own rules mandate pushing frequently. Every run was
superseded minutes in.

Proof: run `30495182348` on `f85b5d7` was **cancelled** 6m33s into `Bootstrap build
environment`, five seconds after the push of `4bc02b0` started run #2. Fifteen steps had
succeeded; Configure, Build and all six suites were skipped.

The comment defending the group argued that *"cancelling an in-flight test run is safe: unlike
the installer it produces no artefact anyone needs"* — four lines below a correct explanation of
blocker #7. It is the same bug, written while looking straight at the write-up of the same bug.
The artefact **is** what someone needs: the accessibility box cannot close on static proof, so a
green run of this suite is the only evidence that can ever tick it.

Fixed by removing the `push` and `pull_request` triggers and the concurrency block entirely,
leaving `workflow_dispatch` plus a nightly cron. **Verified empirically:** run #3 survived two
pushes that landed during it, and no duplicate run spawned.

**Caveat that NO LONGER APPLIES (kept because the mechanism is worth knowing):** the nightly cron could not fire while this workflow lived only on the working branch. `main` was fast-forwarded to `4f23a444d0e` on explicit user direction on 2026-07-29, so the cron is now **live**. The mechanism still binds, though: the cron runs **`main`'s** copy of the workflow, so letting `main` fall behind makes it inert again. Historic wording follows. GitHub runs scheduled workflows only
from the default branch, and this workflow exists only on `design-import/thunderbird-3pane`
(`git ls-tree origin/main -- .github/workflows/` is empty). It is labelled inert in the file.
`workflow_dispatch` *does* work from a non-default branch, contrary to folklore — verified:
`gh workflow run browser-tests-m3.yml --ref design-import/thunderbird-3pane -f suite=all`
returned run `30498533920`. So **the suite runs only when someone dispatches it.**

The general rule: **a cancelling group is only safe when the run's output is genuinely
disposable.** Ask what depends on the output, not what the job is called.

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

- Focus-ring geometry must stay available regardless of theme. The four chrome
  rings split their unguarded `outline-style`, `outline-width`, and
  `outline-offset` from their guarded palette colour; the thread and folder
  forced-colors focus groups and the two keyboard-cursor rings that are not
  literally `:focus-visible` (`tr.card-layout.current`, `tr.table-layout.current`)
  remain unguarded. **Accessibility must never depend on which theme is installed.**
- Icon `fill` / `stroke` / `-moz-context-properties` geometry remains unguarded,
  while palette-bearing icon colours are guarded when they compete with a theme;
  in particular the TLS `--icon-color` override is guarded even though it retains
  `!important`, and the folder-colour path written by `folder-tree-row.mjs:259`
  remains a separate inline-data path.
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

Four actual `!important` declarations survive in the current tree: two in
`m3-folder-pane.css` and two system-colour declarations in `m3-quick-filter.css`.
Each is an explicit upstream-important or forced-colors accessibility match.

Custom-property resolution is unaffected by order — `var()` resolves at
computed-value time — which is why `material-tokens.css` remains the single
definition site.

---

## 5. Standing caveats — every one of these is still true

1. **CI has built and launched the application, but the application gate is red.**
   The latest run passed setup/build, static packaged CSS, chrome, and the authored
   M3 suite, but failed the 3-pane, widgets, and folder suites. A green installer
   build or static contract is not a working application.
2. **The F6 screen-reader gate cannot be closed statically.** `_setRowAriaAttributes`
   returns only when both `Services.appinfo.accessibilityEnabled` and
   `Cu.isInAutomation` are false. Mochitest automation can therefore observe the
   runtime attributes; a real NVDA/Narrator pass is still required. All eight F6
   gates in `A11Y-L10N-AUDIT.md:704-717` are unchecked.
3. **The markup rewrite has not happened.** The message pane reading body lives in
   about:message inside `#messageBrowser`, a separate document that links no M3 sheet;
   `layout-classic` and `layout-wide` are styled only by inheritance; the folder filter
   field, empty states, avatar, body-preview line, command palette, toast stack and
   pinned tabs have no DOM and were correctly not invented.
4. **The documented RTL inset bug is fixed in the current integration.** The M3
   tokens now expose a logical inline inset and `m3-thread-pane.css` consumes it.
   RTL runtime coverage remains an open F6 gate, so this is not yet a visual sign-off.
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
7. **Guard counts must be measured from the current tree, not copied from history.**
   The current comment-stripped selector counts are **11 · 59 · 31 · 21 · 3 · 9**
   for layout, folder-pane, thread-pane, quick-filter, message-pane, and chrome;
   tokens remain 0. There are zero positive `:root[lwtheme]` selectors and each
   sheet's comment-stripped braces balance. These are source measurements, not
   runtime theme sign-off.
8. **The command enumeration is corrected but remains a runtime gate.** The current
   source count is **167** distinct `cmd_*` names; the contract must not revive the
   historical 137 figure. Wiring and enabled/disabled behavior still need the
   application suite before this box can be ticked.
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

The design-to-shipped source gate is runnable from the repository root:

```powershell
python design/verify-material-alignment.py
```

It checks the design palette, density projections, local-first font stacks,
stylesheet load order, packaging entries, balanced CSS, and theme-safety
invariants. A pass is static evidence only; it does not replace browser,
keyboard, or NVDA/Narrator evidence.

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
- **Release and artifact state.** The current verified release is
  `tb-155.0a1-b54-wu-gok`, built from `e4867411c3aa81de4527d843913b966d0ef89c1c`
  by installer run `30625833498`. Check the Releases page for the live asset and
  digest; per-build sizes remain intentionally external state.
- **Self-hosted runner health**, addresses (`super` answers on `.232` and sometimes
  `.233`) and the Minecraft pause guard's current behaviour. Host-side facts; see
  `INFRA.md` and re-check reachability before assuming either address.
- **Manual installer coverage.** The b54 runtime observation reached the upstream
  onboarding/start page while the packaged Material 3-pane sheets were present. This
  does not close manual installation, 3-pane interaction, accessibility, localization,
  or visual sign-off; all those unknowns remain open.
