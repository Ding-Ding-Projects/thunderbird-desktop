# AGENTS.md — Material Mail (Thunderbird 3-pane restyle)

> [!IMPORTANT]
> **Standing rule, every task, no exceptions: check `upstream` for updates at the start of
> your work and again before you finish.** Not once per session, not only when asked. The
> procedure is [§1](#1-always-check-upstream--the-standing-rule-of-this-repository) and it is
> the first section of this file on purpose. If you read nothing else here, read that.

> [!NOTE]
> This file is **subordinate to** `vendor/agent-global-memory/memory/SHARED_INSTRUCTIONS.md`.
> Where the two differ, the global instructions win and this file is the thing that needs
> fixing. Nothing below is an exemption from them — see [§5.1](#51-global-instructions-live-in-a-submodule-and-they-change-under-you).

## What this repository is

A **fork of Thunderbird, comm tree only**. There is no `mach`, no `mozconfig` and no
`mozilla/` directory at the root — the root `README.md` says it plainly: the Firefox
repository holds the platform code and "The Thunderbird repository is added as a
subdirectory `comm/` under Firefox." **Nothing here builds on its own** (see
[Build, CI and releases](#4-build-ci-and-releases)).

The work on this branch is a **Material Design 3 restyle of the 3-pane, implemented as a
CSS layer over upstream's existing behaviour**. It is not a behaviour rewrite. The whole
diff against upstream inside `mail/` is **10 files, 4325 insertions, 0 deletions**, and
`mail/base/content/about3Pane.js` has never been modified. That untouched-behaviour fact
is the entire safety argument for claiming features survive the restyle — everything in
[§2](#2-what-must-never-be-edited-and-what-we-own) exists to protect it.

- Working branch: **`design-import/thunderbird-3pane`**, tracking
  `origin/design-import/thunderbird-3pane`.
- `origin` = `https://github.com/Ding-Ding-Projects/thunderbird-desktop.git` — the fork,
  the **only** remote you ever push to.
- `upstream` = `https://github.com/thunderbird/thunderbird-desktop.git` — Thunderbird's
  own repo, read-only in practice.

---

## 1. Always check upstream — the standing rule of this repository

**Check upstream at the start of every task, and check it again before you finish.** Not
once per session. Not only when someone asks. This fork carries a restyle sitting on top of
live upstream code, so upstream moves underneath you while you work — including security
fixes.

A note on permissions before you start: `git fetch` mutates remote-tracking refs, so it
counts as a writing command. Run it when your task permits writes. If you are under a
read-only constraint, do the drift check against the refs you already have and say so in
your report.

### Step 1 — measure the drift

`git fetch upstream` updates remote-tracking refs only; it does not touch your working tree
or your commits.

```bash
git fetch upstream

# One line, both directions: <ahead>  <behind>
git rev-list --left-right --count HEAD...upstream/main
# 28    2

# Reversed, if you prefer behind-first: <behind>  <ahead>
git rev-list --left-right --count upstream/main...HEAD
# 2     28

# Or separately, named
git rev-list --count HEAD..upstream/main    # how far BEHIND we are  -> 2
git rev-list --count upstream/main..HEAD    # how far AHEAD we are   -> 28
```

**Being a couple of commits behind while dozens ahead is normal.** At the time this file
was written the branch was exactly **2 behind / 28 ahead**. That is ordinary drift from a
fast-moving upstream — and it is exactly why the check is *routine* rather than occasional.
The number is only ever small because somebody keeps looking. Stop looking and it becomes a
hundred.

### Step 2 — see what is actually coming

```bash
git log --oneline HEAD..upstream/main
git diff --stat HEAD...upstream/main
```

Real output from the check above:

```
4052beee763 Bug 1878375 - Synchronize vendored Rust libraries with mozilla-central. r=darktrojan
78c418c8eba No Bug - Bumping Thunderbird l10n changesets r=release a=l10n-bump DONTBUILD
```

Those land in `rust/`, `third_party/rust/` and `mail/locales/l10n-changesets.json`. Nothing
near the restyle.

### Step 3 — judge whether it collides

The fork's footprint on Thunderbird's own tree is small and known. Get it fresh rather than
trusting the list in [§2](#2-what-must-never-be-edited-and-what-we-own):

```bash
git diff --name-only upstream/main...HEAD
```

**Triage rule:**

- **Harmless — merge without ceremony.** Anything under `mail/test/`, `taskcluster/`,
  `rust/`, `third_party/`, `mail/locales/`, or l10n changeset bumps. These cannot reach the
  restyle.
- **Needs real attention — read the diff before merging.** Anything under
  `mail/base/content/` or `mail/themes/`. Upstream restructuring a widget, renaming an id,
  or adding its own `<link>` to `about3Pane.xhtml` will silently break M3 rules that match
  on those selectors, and CSS fails *quietly* — no error, just the wrong pixels.

The sharpest single command for that judgement:

```bash
git log --oneline --name-status HEAD..upstream/main -- mail/base/content/ mail/themes/
```

**Empty output means no collision.** That is what it printed for the two pending commits
above. Non-empty output means read every line before you merge, and re-check the M3 sheets
that target the changed selectors afterwards.

### Step 4 — merge policy

- **Merge, never rebase.** `git merge upstream/main` into the working branch. This branch is
  published to `origin`; rebasing rewrites history that other people and other agent
  sessions already have. The existing history does this correctly — `c65853c4ebf` is a
  genuine two-parent merge commit (parents `d6057327f7b` and `529a6e5bdd1`).
- **Collision-check before merging**, not after. Step 3 is cheap; untangling a bad merge
  inside seven interdependent stylesheets is not.
- **Never `git push upstream`**, on any branch, for any reason. A push URL is configured
  because git sets one by default — that is not permission. Push to `origin` only.
- Never merge in the other direction (this branch into `upstream/main`). Not ours to do.
- Never merge onto a dirty tree. Multiple workflows run against this working tree
  concurrently; check `git status` first.

### Why this matters: a security fix already came through this way

Not hypothetical. **Bug 2058766** ("Port bug 1974213: Don't allow `file:` and `jar:` schemes
in `Services.scriptloader.loadSubScript`") landed upstream as `4cbc431318f` and reached this
fork through merge commit `c65853c4ebf` — "Merge upstream: security fix for loadSubScript
schemes". Confirm it yourself:

```bash
git show --stat --oneline c65853c4ebf
git merge-base --is-ancestor 4cbc431318f HEAD && echo "security fix is in"
```

(The comm-side diff of `4cbc431318f` is small — 2 lines in
`mailnews/jsaccount/test/unit/head_jsaccount.js`; the actual scheme-blocking enforcement is
the ported mozilla-central bug 1974213. The point stands: **a fork that drifts is a fork
running known-vulnerable code.** The restyle is cosmetic; what it drifts away from is not.)

### Worked example: the full check-and-merge

```bash
# 0. Know where you stand. Never merge on top of a dirty tree.
git status
git rev-parse --abbrev-ref HEAD          # expect design-import/thunderbird-3pane

# 1. Refresh remote-tracking refs (safe; touches no files)
git fetch upstream

# 2. Measure
git rev-list --left-right --count HEAD...upstream/main
# 28    2      -> 28 ahead, 2 behind. Behind is non-zero: act.

# 3. Read what is incoming
git log --oneline HEAD..upstream/main

# 4. Collision check — the only question that matters
git log --oneline --name-status HEAD..upstream/main -- mail/base/content/ mail/themes/
# (empty)  -> no collision, safe to merge

# 5. Merge (never rebase)
git merge upstream/main

# 6. Prove the safety invariant still holds
git diff --stat upstream/main...HEAD -- mail/base/content/about3Pane.js
# (empty) -> about3Pane.js still untouched, as it must be

# 7. Confirm we are level, then push to origin only
git rev-list --count HEAD..upstream/main   # 0
git push origin design-import/thunderbird-3pane
```

If step 4 had produced output, stop and read those diffs before step 5 — and after merging,
re-verify that the M3 sheets touching the changed selectors still apply.

Both remotes carry the same release branches (`main`, `beta`, `release`,
`esr115/128/140/153`). The one that matters here is `upstream/main`.

---

## 2. What must never be edited, and what we own

Every claim that a feature "still works" rests on one verifiable fact: the behaviour layer
has never been touched. Confirm it rather than trusting this file —

```
$ git log -1 --format='%h %an %ad %s' --date=short -- mail/base/content/about3Pane.js
aa1b1768004 welpy-cw 2026-07-13 Bug 2049110 - Make nsIMsgFolder.firstNewMessage infallible. r=mkmelin
```

An upstream `Bug NNNN` commit by an upstream author. No commit from this project appears in
that file's history, and the same is true of the widget layer:

```
$ git log -1 --format='%h %an %s' -- mail/base/content/widgets
7cbc9214073 Toby Pilling Bug 1735630 - Add a configurable default address book ... r=aleca
```

The whole diff against upstream is additive. This is the most useful command in the repo,
and it should keep looking like this:

```
$ git diff --stat upstream/main...HEAD -- mail/
 mail/base/content/about3Pane.xhtml          |   23 +
 mail/base/content/messenger.xhtml           |    9 +
 mail/themes/shared/jar.inc.mn               |    7 +
 mail/themes/shared/mail/m3-chrome.css       |  542 +++++
 mail/themes/shared/mail/m3-folder-pane.css  |  832 +++++
 mail/themes/shared/mail/m3-layout.css       |  298 +++
 mail/themes/shared/mail/m3-message-pane.css |  247 +++
 mail/themes/shared/mail/m3-quick-filter.css |  839 +++++
 mail/themes/shared/mail/m3-thread-pane.css  | 1148 +++++
 mail/themes/shared/mail/material-tokens.css |  380 +++
 10 files changed, 4325 insertions(+)
```

Ten files, **4325 insertions and zero deletions**. Three are upstream files we append to;
seven are files we created. If a `-` ever appears in that stat, you have started rewriting
Thunderbird instead of restyling it.

### Never edit

| Path | Why |
|---|---|
| `mail/base/content/about3Pane.js` | The behaviour layer. Its being untouched *is* the feature-parity argument. Editing it forfeits the argument and turns every upstream merge into a conflict in the hardest file in the tree. |
| `mail/base/content/widgets/*.mjs` | Same reason: `tree-view-table*`, `thread-card*`, `pane-splitter` and friends are the DOM the M3 sheets style. Change the DOM and the selectors become fiction. |
| `mail/themes/shared/mail/about3Pane.css` | Upstream-owned and in fact **completely unmodified** — last touched by `1a1058a4a2b Richard Marti Bug 2052833`, with zero project commits. The M3 sheets override it from a later stylesheet, never by editing it. |
| `README.md` (repository root) | Upstream Thunderbird's build README (`42a0d03efec Corey Bryant Bug 2049881`). Project documentation lives in `design/`, not here. |
| Everything else under `mail/`, `calendar/`, `vendor/gecko` | Not ours. Merge surface. |

`mail/themes/shared/jar.inc.mn` is upstream-owned but **append-only**: our seven packaging
lines are at lines 121-127, in the alphabetical block next to `about3Pane.css`. Add a line;
never reorder or delete one. Note the path — it is `mail/themes/shared/jar.inc.mn`. There is
no `mail/themes/shared/mail/jar.inc.mn`.

### What we do own

- `mail/themes/shared/mail/material-tokens.css` — the sole definition site for the M3 custom
  properties. Definitions only; it paints nothing.
- The six `m3-*.css` sheets: `m3-layout.css`, `m3-folder-pane.css`, `m3-thread-pane.css`,
  `m3-quick-filter.css`, `m3-message-pane.css`, `m3-chrome.css`.
- The `<link rel="stylesheet">` blocks added to `mail/base/content/about3Pane.xhtml`
  (lines 35-58: tokens at 39, the five content sheets at 54-58) and
  `mail/base/content/messenger.xhtml` (lines 110-117: tokens at 116, `m3-chrome.css` at 117). Those two files' entire delta is `<link>`
  elements and comments — nothing else. `material-tokens.css` is deliberately linked in
  **both**: they are separate documents and custom properties do not cross the browser
  boundary.
- Our seven lines in `mail/themes/shared/jar.inc.mn`.
- Everything under `design/` — `REWRITE-CONTRACT.md`, `HANDOFF.md`, `ROADMAP.md`,
  `INFRA.md`, `A11Y-L10N-AUDIT.md`, `README.md`, the `.dc.html` design snapshots, assets,
  icons, screenshots, `app-data.js`, `support.js`.
- `.github/workflows/` — `lint-m3.yml` and `windows-installer.yml`.
- Fork-only plumbing: `.gitmodules`, `vendor/gecko` (a gitlink), `vendor/agent-global-memory`
  (a submodule).

### Load order is load-bearing

In `about3Pane.xhtml` the order is: `material-tokens.css`, then **`about3Pane.css`**, then
the five M3 content sheets. The M3 sheets load *after* upstream's on purpose. Each
deliberately **matches** `about3Pane.css`'s specificity rather than escalating past it, so it
wins on source order alone and needs no `!important`. Load them earlier and most of the skin
silently reverts. In `messenger.xhtml`, tokens + `m3-chrome.css` go last for the same reason,
so M3 beats `tabmail.css` / `spacesToolbar.css` / `messenger.css` on ties.

Across all six sheets there are only **15 lines mentioning `!important`, of which just 4 are
actual declarations** (`m3-folder-pane.css:514`, `:836`; `m3-quick-filter.css:879`, `:880`).
The rest are explanatory comments. That ratio is the point. If you reach for `!important`,
you have almost certainly put your rule in the wrong file, or the wrong place in it.

---

## 3. The two cascade rules

### Rule 1 — colour-bearing rules stand down for lightweight themes

Every rule that **paints a colour** is prefixed with `:root:not([lwtheme])`, so an installed
lightweight theme wins and the M3 palette gets out of its way. Rules that set geometry, shape,
motion, focus outlines or accessibility fallbacks are *not* guarded — a theme must never be
able to move the furniture or delete a focus ring.

Counts **as committed at `682f4508c2c`** (the HEAD when this file was written), from
`grep -c ':root:not(\[lwtheme\])'` — lines carrying the guard, so a line with two guarded
selectors counts once. Line totals match the insertion counts in
[§2](#2-what-must-never-be-edited-and-what-we-own) exactly, because these are new files:

| Sheet | Lines with the guard | Total lines |
|---|---:|---:|
| `material-tokens.css` | **0** | 380 |
| `m3-chrome.css` | 11 | 542 |
| `m3-folder-pane.css` | 60 | 832 |
| `m3-layout.css` | 13 | 298 |
| `m3-message-pane.css` | 6 | 247 |
| `m3-quick-filter.css` | 22 | 839 |
| `m3-thread-pane.css` | 36 | 1148 |
| **Total** | **148** | |

> [!IMPORTANT]
> **These are *lines containing the guard string*, which is not the same as guarded selectors.**
> The reconciliation wave of 2026-07-29 established that every published guard count in this
> project — here, in `REWRITE-CONTRACT.md`, and on the Pages site — was measured **without
> stripping comments**, so each sentence of a doctrine comment explaining the guard was counted
> as a guard. Comment-stripped, in *selector position*, reproduced independently three times:
> `m3-layout` **11** · `m3-folder-pane` **56** · `m3-thread-pane` **30** · `m3-quick-filter` **21**
> · `m3-message-pane` **3** · `m3-chrome` **9** · `material-tokens` **0** — total **130**, not 148.
> The guards themselves are real and correctly spelled; only the arithmetic was wrong. See the
> corrected table in `design/REWRITE-CONTRACT.md`.

> [!WARNING]
> **Re-count; do not cite this table.** Multiple workflows edit these sheets concurrently, so a
> `grep -c` against the *working tree* will not match a `grep -c` against HEAD whenever an
> uncommitted edit is in flight — that was already true while this file was being written
> (working tree read 12 / 37 for `m3-layout` / `m3-thread-pane` against HEAD's 13 / 36; the
> total happened to stay 148). Read the number you need with the command, from the tree state
> you actually mean, and say which one you measured.

`material-tokens.css` keeps **zero** guards deliberately: *definitions are not paint*. A token
that is defined but never applied costs nothing under a theme, and guarding the definitions
would break every consumer, guarded or not.

### Rule 2 — the guard adds (0,2,0), and a media query adds nothing

`:root:not([lwtheme])` is one pseudo-class plus one attribute selector: **+(0,2,0)**.
An `@media` block contributes **zero** specificity to the rules inside it.

Put those together and you get the trap this project already fell into. Guard a base rule and
it climbs by (0,2,0). The `@media (prefers-contrast)` or `@media (forced-colors)` rule whose
entire job is to *undo* that base rule does **not** climb. A pair that used to tie and be
settled by source order now loses outright — and the loser is always the accessibility
fallback.

Three such regressions were introduced by commit `0ef3689c9ac` (which added the guards) and
fixed by `0b8c2349cf2`:

1. **`m3-layout.css`** — the high-contrast splitter hairline. The guarded base kept
   `border-color: transparent` while the fallback kept `border-width: 1px`: an invisible 1px
   border eating 2px of content box for nothing. Two selectors prefixed.
2. **`m3-message-pane.css`** — the findbar divider. Base became
   `:root:not([lwtheme]) #messagePane findbar` (1,2,1); the fallback `#messagePane findbar`
   (1,0,1) could no longer restore `--m3-outline`. One selector prefixed.
3. **`m3-thread-pane.css`** — the whole `@media (forced-colors)` block was out-specified by
   the rules it exists to undo. Most losses degraded quietly, because the UA's forced-colors
   adjustment re-forces the token anyway — but **a system colour survives forced-colors and a
   token does not**, so two did real damage: `#threadPaneSelectedCount` lost
   `SelectedItem`/`SelectedItemText` (the "N selected" pill became invisible against the
   header) and `thread-card-tags[tags]` lost `background-color: transparent` to a
   `color-mix()` that *is* forced, painting an opaque box over the row. Twelve selector lines
   prefixed.

The fix is never `!important`. It is to give the fallback **the same guard**, so the pair is
equal-specificity again and source order decides — exactly as it did before the guard existed.
`m3-chrome.css:511` had it right from the start and is the precedent to copy.

Note the sharpest case in `m3-thread-pane.css`: for the card text a plain guard was still not
enough. Its real competitor is a *nested* rule expanding to (2,5,0), so the fallback had to
gain `[rows="thread-card"]` and `.card-container` as well to reach (2,5,0) and win on order.
Prefixing is the usual answer, not an automatic one — **count both sides**.

### The fourth failure mode: the fallback that wins and hands back the wrong value

Three shapes of broken fallback were known before: the fallback **loses** on specificity, the
fallback is **shorter** than the rule it undoes, and the fallback was **never written**. There is a
fourth, and it is the hardest to see because everything about it looks correct — the rule exists,
carries the right guard, and *wins* its cascade fight. It just hands back the wrong token.

Upstream `about3Pane.css:52-56` defines **two** distinct tokens inside one
`@media (prefers-contrast)` block, and applies them to different states:

| arm | upstream token | applied at |
|---|---|---|
| `.unread` | `--folderpane-unread-count-background` | `about3Pane.css:594-597` |
| `.new-messages` | `--folderpane-unread-new-count-background` = **`ButtonShadow`** | `about3Pane.css:599-601`, `:611-614` |

Our fallbacks gave **both** arms the plain-unread token in a single rule:

```
ours     :root:not([lwtheme]) #folderTree li.new-messages > .container > .unread-count
         a=1  b=1+1+1+1+1=5  c=1                                          -> (1,5,1)
upstream .new-messages > .container > :is(.unread-count)
         a=0  b=3  c=0                                                    -> (0,3,0)
```

`(1,5,1)` beats `(0,3,0)` on `a`, so **`ButtonShadow` never applies** — and the collapsed/outlined
arm repeats it, ours (1,9,2) against upstream's (0,7,1). In Windows High Contrast with no theme
installed, a folder with **new** mail is painted identically to one with merely **unread** mail:
exactly the defect this box was revoked for, reintroduced one token deeper. Upstream picked a
*system* colour deliberately, because a system colour survives forced-colors rewriting and a token
does not.

**The check this adds to step 4 of the checklist:** having found the `@media` counterpart, do not
stop at "it exists and it wins." Read what it *assigns*. If upstream splits a state into two tokens,
the fallback must split too. A single rule covering two arms is the tell.

The in-file comment claimed "only the palette hands back" — true of the mechanism, false of the
value. Comments asserting a cascade outcome are exactly what the audit was created to distrust.

### The mirror-image bug: over-guarding

Adding the guard where there is nothing to match it is just as destructive, and it fails
silently in the one configuration nobody tests: theme installed *and* high contrast on. These
stay **unprefixed**, and the code says so in comments:

- **Every focus ring.** Verified: of all `focus-visible` lines across the six sheets, **zero**
  carry the guard. The rings they override are themselves unguarded, so they already out-rank
  them — and a high-contrast focus ring must never depend on which theme someone installed.
- **`!important` rules.** They need no specificity help. All four unprefixed on purpose:
  `m3-folder-pane.css:836` (`--icon-color: currentColor !important`),
  `m3-folder-pane.css:514` (the TLS-error `--icon-color`, pinned to `about3Pane.css`'s own
  `!important` specificity — a guard would break that pinning, and the comment above it says
  so), and `m3-quick-filter.css:879-880`.
- **Fallbacks with no guarded competitor.** The `@media (prefers-contrast)` block at
  `m3-thread-pane.css:1066` uses `currentColor` and overrides nothing of ours. Prefixing it
  would have *deleted* a high-contrast affordance for theme users rather than saved one.

Under-guarding hides the theme. Over-guarding hides the accessibility fallback. Both are
one-line mistakes and neither shows up in a normal screenshot.

### Checklist before you touch any colour rule

1. **Upstream check first** ([§1](#1-always-check-upstream--the-standing-rule-of-this-repository)).
   A colour fix written against a stale `about3Pane.css` can be dead on arrival.
2. **Is the rule I am adding upstream's or mine?** If the answer involves editing
   `about3Pane.js`, a `widgets/*.mjs`, `about3Pane.css`, or the root `README.md` — stop. Solve
   it from an `m3-*.css` sheet instead.
3. **Does this declaration paint a colour?** (`color`, `background*`, `border-color`, `fill`,
   `stroke`, `outline-color`, an `--m3-*` applied as a colour.)
   - Yes → prefix `:root:not([lwtheme])`.
   - No (size, shape, spacing, motion, focus outline geometry) → leave it unprefixed.
   - Is it an `--m3-*` **definition** in `material-tokens.css`? → never guard it.
4. **Does the rule have an `@media (prefers-contrast)` / `(forced-colors)` /
   `(prefers-reduced-motion)` counterpart anywhere in the file?** Search for it. If a
   counterpart exists to undo a rule you just guarded, guard the counterpart too.
5. **Compute both specificities; do not eyeball them.** Guard = +(0,2,0). Media query = +0.
   `:not(...)` contributes its *argument's* weight. Nested `&` rules expand to the full
   ancestor chain — that is how the card-text competitor reached (2,5,0). If the fallback does
   not now **tie or exceed** its competitor, add selector weight until it does; do not reach
   for `!important`.
6. **Before adding a guard, ask what it competes with.** If the rule it overrides is unguarded,
   or the rule is `!important`, or it has no competitor at all — leave it unprefixed and write
   a one-line comment saying why. Every deliberate omission in these sheets is already
   commented; match that.
7. **Never use `!important` to win an M3-vs-upstream fight.** The sheets load after
   `about3Pane.css` precisely so you do not have to.
8. **Re-run the counts.** `grep -c ':root:not(\[lwtheme\])' m3-*.css material-tokens.css` and
   `git diff --stat upstream/main...HEAD -- mail/`. Tokens must stay at 0 guards; the diffstat
   must stay 0 deletions.
9. **Let CI check the syntax.** `.github/workflows/lint-m3.yml` runs
   `mach commlint -l stylelint` over `m3-*.css` + `material-tokens.css` and `-l eslint` over
   `about3Pane.xhtml`, and self-tests by linting a deliberately broken file first, so a green
   run means something. It cannot check specificity — that is step 5, and it is yours.

---

## 4. Build, CI and releases

### The tree must be assembled before it can build

Since this is comm only, `.github/workflows/windows-installer.yml` assembles the tree on
every push:

1. Reads the pinned gecko SHA out of this repo's tree with `git ls-tree HEAD vendor/gecko`
   (a gitlink — currently `ca6e9493686b3e5ed1cddb8d3a3974068463df71`, pointing at
   `https://github.com/mozilla-firefox/firefox.git` per `.gitmodules`). The live log for
   build 24 prints the same revision, so gitlink and built revision match.
2. Fetches that exact commit `--depth 1` **directly into `D:\gecko`**.
3. Moves this checkout in as `D:\gecko\comm`, then runs `mach bootstrap` → `mach configure`
   → `mach build` → `mach package` from `D:\gecko`.

The pinned gecko revision is a second, independent thing that drifts — separate from the
upstream-comm drift in [§1](#1-always-check-upstream--the-standing-rule-of-this-repository).

`.github/workflows/lint-m3.yml` does the same assembly on `ubuntu-latest` for lint only.
comm's linter *config* lives here (`.stylelintrc.js`, `eslint.config.mjs`, `tools/lint/*.yml`)
but the machinery that reads it lives in mozilla-central. It runs
`./mach commlint -l stylelint …` / `-l eslint …`, **never plain `./mach lint`**, because
`commlint` is what inserts `comm/tools/lint` into mozlint's config paths — plain `mach lint`
would silently apply *Firefox's* rules.

### Build modes: artifact (default) vs full

| | artifact | full |
|---|---|---|
| Trigger | default on every push | `workflow_dispatch` → `build_mode: full` |
| Disk | ~10 GB (workflow's own figure; **measured ~20 GB of D:** on run 24) | ~45 GB (`FULL_NEEDS_GB = 45` in the workflow) |
| Time | minutes (measured: **15m26s** end-to-end on run 24) | hours (workflow's claim; never observed) |
| Correct for | CSS-layer / frontend-only changes | any change touching **C++ or Rust** |

Artifact mode is right for this project: prebuilt binaries are downloaded and only the
frontend is compiled and packaged. **All 24 installer runs to date were artifact mode** (all
24 were `push`-triggered). Full mode has never actually been exercised — treat its first run
as unproven.

Two mozconfig lines are mode-dependent and must stay that way: `--enable-artifact-builds`
implies `--disable-compile-environment`, and `--enable-optimize` / `--disable-debug` are only
legal *without* it.

### The runner is much bigger than the docs claim — measure, don't assume

The header comment in `windows-installer.yml` (line 15) still says a hosted runner has
"~14 GB before cleanup". **That figure is wrong for this image**, and the workflow's own
`env:` block (lines 72-74) already contradicts it. Measured directly from the log of run
`30472573986` (build 24):

```
Disk space (before)      Disk space (after)
C     33.50              C     32.40
D    147.00              D    127.00
```

C: ~33 GB free, D: ~147 GB free, and an artifact build consumes ~20 GB of D:. That is why
`GECKO_DIR=D:\gecko`, `MOZBUILD_STATE_PATH=D:\mozbuild` and `MOZCONFIG=D:\gecko\mozconfig-ci`
— **builds run on D:**, and D: is roomy enough for a full build with room to spare. The
"Reclaim disk space" step skips itself whenever the build drive has ≥60 GB free, because
deleting the toolcache costs ~4.5 minutes and buys nothing here.

The rule to carry forward: **measure before concluding a runner is too small.** The
`Disk space (before)` step exists so the number is in every log.

Easy trap: D: on an Azure-backed hosted runner is the temporary resource disk. It lives as
long as the VM, i.e. as long as *this job*. If the workflow ever grows a second job via
`needs:`, that job will not see `D:\gecko` and everything it wants must be uploaded as an
artifact first.

### Release policy: every successful push ships a real release

`gh release list --repo Ding-Ding-Projects/thunderbird-desktop` — **7 releases**, one per
successful installer run, `b18` through `b24`. Runs 1-17 failed or were cancelled (1, 2 and 4
cancelled) while the nine blockers below were being fixed; 18-24 are all green.

Latest observed:

```
🍖 Pai Gwat · 豉汁排骨 — Thunderbird 155.0a1 (build 24)   tb-155.0a1-b24-pai-gwat   Latest
  asset: thunderbird-155.0a1.en-US.win64.installer.exe
  size:  85,211,580 bytes (81.3 MB)   published 2026-07-29T17:05:42Z
  isDraft: false   isPrerelease: false
```

The policy, all of it enforced in the "Publish release" step:

- `gh release create … --latest`, with **no `--draft` and no `--prerelease`**. Every push
  ships a real, immediately visible release.
- The built installer is attached as the release asset.
- Tag is `tb-<version>-b<run_number>-<dish>`, e.g. `tb-155.0a1-b24-pai-gwat`. `run_number` is
  monotonic, so tags never collide or recycle.
- The code name is a dim sum dish, chosen deterministically as `$dimsum[run_number % 16]`
  from a 16-entry table. (Check: 18 % 16 = 2 → `char-siu-bao`; 24 % 16 = 8 → `pai-gwat`. Both
  match the published tags.)
- Release notes carry a `> [!WARNING]` making clear this is **not** an official Mozilla
  Thunderbird build.
- Token order is `secrets.RELEASE_TOKEN || secrets.ORG_TOKEN || secrets.GITHUB_TOKEN`.

Version comes from `mail/config/version_display.txt` (currently `155.0a1`; `version.txt`
agrees). The installer is located at `obj-tb\dist\*installer.exe`.

### The CI blockers already hit — do not reintroduce any of them

Each was a real red run. **Blockers 1-9 are fixed and each names its commit. Blocker 10 is OPEN** —
it has no fix SHA, and it is listed here because it is diagnosed, not because it is solved.

1. **MAX_PATH on the gecko clone** — mozilla-central has web-platform-test paths over 260
   chars; without `git config --system core.longpaths true` + `LongPathsEnabled=1` the clone
   dies mid-way with "Filename too long". (`3db33863a46`)
2. **The wrong disk premise** — building on C: on a "14 GB" assumption; C: has ~33 GB, D: has
   ~147 GB, and the build belongs on D:. (`2d913d8ab79`)
3. **Concurrency cancelling its own releases** — `cancel-in-progress: false` only protects the
   *running* job; a **QUEUED** run is superseded the moment a newer run joins the group, so
   intermediate commits silently lost their release (observed twice). The group was removed
   **entirely** — the installer workflow deliberately has no `concurrency:` block.
   (`1e075957971`)
4. **The submodule `.git` is a FILE with a RELATIVE gitdir** — `gitdir: ../../.git/modules/…`,
   so moving the worktree breaks it. (`c5f9083a97b`)
5. **MozillaBuild is not on hosted runners, and bootstrap runs via mach** — mach hard-asserts
   `MozillaBuild was not found at "C:\mozilla-build"`, so bootstrap can never install it;
   MozillaBuild must be installed first, silently, from Mozilla's FTP. (`d6057327f7b`)
6. **`MOZ_AUTOMATION=1` is the Taskcluster contract, not a quiet-CI flag** — off Taskcluster
   it breaks the build in four independent places (comm's `gecko_source.configure` die();
   `vcs_checkout_type` FatalCheckError; `bootstrap_default` returning False so nsis/7zz/upx
   are never fetched; `makensis.mk` forcing `--use-upx` on a upx that does not exist).
   `MOZ_NOSPAM=1` plus `bootstrap --no-system-changes` buy back the only two things it was
   providing. (`c6dcef0997b`)
7. **`core.worktree` is the SECOND relative pointer** — fixing the `.git` file only exposes
   `fatal: cannot chdir to '../../../../vendor/gecko'`. The fix is to fetch gecko straight to
   its destination so neither pointer exists. (`e37d4c1cf51`)
8. **`--enable-optimize` is invalid under `--disable-compile-environment`** —
   `InvalidOptionError: --enable-optimize is not available in this configuration`, and it
   fails at *configure*, after bootstrap has already paid for the toolchain downloads. It is
   full-build-only. (`510854322ff`)
9. **The installer is at `dist/*.installer.exe`, not `dist/install/`** — the old
   `dist/install/sea/` assumption came from `package-name.mk`'s `PKG_INST_PATH` and cost a run
   where build and packaging both succeeded. Real path, verified in the log:
   `D:\gecko\obj-tb\dist\thunderbird-155.0a1.en-US.win64.installer.exe`. Filter out
   `maintenanceservice_installer.exe`, which also matches `*installer.exe`. (`35feb3666a1`)

10. **A cancelling concurrency group on the browser-test job means it can never finish** — the
    same shape as blocker #3, and it went in *despite* a comment in the same file reasoning about
    blocker #3. `browser-tests-m3.yml` triggered on every push to `design-import/**` while
    declaring `concurrency: {group: m3-browser-tests-${github.ref}, cancel-in-progress: true}`, but
    the job needs a **full** build (`timeout-minutes: 330`) and this project pushes every few
    minutes by mandate. Proof: run `30495182348` on `f85b5d7` was **cancelled** 6m33s in at
    `Bootstrap build environment`, five seconds after the push of `4bc02b0` started run #2. Fifteen
    steps succeeded; Configure, Build and all six suites were skipped. **The suite has never
    reached a single assertion.**

    The file's comment defended the group with *"cancelling an in-flight test run is safe: unlike
    the installer it produces no artefact anyone needs."* That is wrong here, and the reason is
    specific: the **accessibility** box in `design/REWRITE-CONTRACT.md` cannot close on static
    proof — `aria-level` does not exist until a screen reader runs, because
    `_setRowAriaAttributes` short-circuits only when `Services.appinfo.accessibilityEnabled` **and** `Cu.isInAutomation` are BOTH false (`tree-view.mjs:1110`) — so a
    green browser-test run is the *only* thing that can ever tick it. This run's artefact **is**
    the evidence. A hours-long test job does not belong on a push trigger in a repository whose
    own rules demand frequent pushes; it belongs on `workflow_dispatch` plus a `schedule`.

    Generalise it: **a cancelling group is only safe when the run's output is genuinely
    disposable.** Ask what depends on the output before adding one, not what the job is called.

Two more standing traps: `fetch-depth: 500` on the comm checkout is load-bearing (artifact
resolution walks *comm* history for a revision comm-central actually built — depth 1 gives
"Could not find any candidate pushheads"), and the mozconfig deliberately lives at
`D:\gecko\mozconfig-ci` rather than `$topsrcdir/mozconfig`, because `mach bootstrap`'s
non-interactive `prompt_yesno` returns True unconditionally and would silently overwrite the
comm/mail mozconfig with a Firefox one.

### The lint workflow's own trap: expressions in comments

**GitHub evaluates workflow expressions ANYWHERE in the file — including inside the comments
of a `run:` script — and an empty expression is a parse error.** The lint workflow's stylelint
step once carried a comment explaining that it expands its glob in the shell *rather than
through a workflow expression*, and spelled the `${{ }}` syntax out literally with nothing
between the braces. The YAML was valid (`yaml.safe_load` parsed it happily); GitHub rejected
the whole file. **Four lint runs carry the signature** — `30467222783`, `30469657951`,
`30471306496`, `30471621713` — each with **0s duration** (`createdAt` equal to `updatedAt`) and
the workflow name rendered as the raw path `.github/workflows/lint-m3.yml` instead of
`Lint (Material Mail)`; `gh run view` says *"This run likely failed because of a workflow file
issue."* Fixed in `79bcc6fbd88` — the comment now describes expressions in words and warns you
not to write the braces. Do not write them.

For the same reason, **a YAML linter passing is not evidence a workflow file is valid.**

Lint history for context: the first genuinely green lint run is `30472573860` (3m16s). The
3m15s failure (`30471809096`) was a real stylelint finding at the
"stylelint - m3-*.css and material-tokens.css" step, not a parse error — the two are easy to
confuse and the duration tells them apart (**0s = the file never parsed**).

The lint job is also self-checking: it writes a file containing `colour: red` and fails the
job if `mach commlint -l stylelint` returns 0 on it (lint-m3.yml lines 204-234). A green run
that lints nothing is worse than no lint job.

### Runners: prefer GitHub-hosted

`gh api repos/Ding-Ding-Projects/thunderbird-desktop/actions/runners`:

```
fowshan-x64   Linux  offline   [self-hosted, Linux, X64,   fowshan, build]
super-arm64   Linux  online    [self-hosted, Linux, ARM64, super,   lint]
```

**Both self-hosted runners are Linux, so neither can build a Windows installer** — regardless
of the `build` label on `fowshan-x64`, and one of them is offline anyway. The installer job
runs on `windows-latest` (`timeout-minutes: 355`, just under GitHub's 6h job cap); the lint
job runs on `ubuntu-latest` (`timeout-minutes: 45`) because stylelint and eslint are node
programs reading the same rc files on any OS. Keep both on hosted runners unless someone adds
a Windows self-hosted machine with ~45 GB free for full builds.

### Commands that actually work here

```bash
gh run list  --repo Ding-Ding-Projects/thunderbird-desktop --limit 8
gh run list  --repo Ding-Ding-Projects/thunderbird-desktop --workflow=windows-installer.yml \
             --limit 30 --json number,conclusion,createdAt
gh release list --repo Ding-Ding-Projects/thunderbird-desktop
gh release view tb-155.0a1-b24-pai-gwat --repo Ding-Ding-Projects/thunderbird-desktop \
             --json tagName,isDraft,isPrerelease,publishedAt,assets
gh run view <run-id> --repo Ding-Ding-Projects/thunderbird-desktop --log   # disk, mode, paths
gh api repos/Ding-Ding-Projects/thunderbird-desktop/actions/runners
git ls-tree HEAD vendor/gecko                                             # the pinned gecko SHA
```

`gh run list --json` uses `number`, **not** `runNumber`, and `gh release view --json` has no
`isLatest` field. Both are easy wrong guesses that error out.

---

## 5. Working conventions

### 5.1 Global instructions live in a submodule, and they change under you

`vendor/agent-global-memory` is a **git submodule**, declared in `.gitmodules` with url
`https://github.com/Ding-Ding-Projects/agent-global-memory.git`. It carries the user-level
defaults this project inherits. Read
`vendor/agent-global-memory/memory/SHARED_INSTRUCTIONS.md` — it is the source for most of this
section, and it is 51,307 bytes, so read the headings you need rather than skimming the whole
thing and remembering none of it.

**Issues on `Ding-Ding-Projects/agent-global-memory` are the user's channel for changing those
instructions.** An issue there is not a bug report about someone else's code — it is an
instruction amendment addressed to you. Per `SHARED_INSTRUCTIONS.md` §"GitHub issue triage",
an instruction issue is read, implemented in `memory/SHARED_INSTRUCTIONS.md`, committed,
pushed, and answered with the exact commit before it is closed.

**Re-scan those issues periodically — not once.** The rule is explicit (line 89: "not once at
the start and not only at the end") and binds *every* agent and sub-agent regardless of what it
was spawned to do: a CSS agent, a lint agent, a docs agent. Re-scan at each natural
checkpoint — after a push, after CI reports, when a work item completes, when a sub-agent
returns, and whenever a long stretch has passed without one. An orchestrator must pass this
duty explicitly into every sub-agent's instructions rather than assume it is inherited. A
re-scan that finds nothing is recorded in one line and costs nothing; a skipped re-scan is how
a whole fleet spends hours building to superseded rules. A new instruction found mid-task
applies to the work **in flight**, including redoing work it invalidates.

Read-only scan command that works here (currently returns zero open issues):

```sh
gh issue list --repo Ding-Ding-Projects/agent-global-memory --state open
```

**This section is a pointer, not a substitute.** `SHARED_INSTRUCTIONS.md` carries obligations
that §5 does not restate, and it wins on every point:

| Global obligation | State here |
|---|---|
| "Every task that changes a repository ends with the work merged into the default branch and pushed" | **Unresolved.** `HEAD` is **30 commits ahead of `origin/main`**; of the 28 commits ahead of `upstream/main`, exactly one (`b5330388a96`, the submodule add) is also on `origin/main` — the restyle itself lives only on `design-import/thunderbird-3pane`. [§7](#7-before-you-finish--checklist) says "push to `origin` only, on this branch" — that is about *which remote*, and is **not** a licence to skip the merge-to-default-branch rule. Do not merge to `main` on your own initiative either: raise it and get direction. |
| One `Announcements` (or `Show and tell`) changelog Discussion **per build/release**, pinned | Not done — Discussion #1 is the rolling-progress thread ([§5.5](#55-the-rolling-progress-discussion)) and is the only Discussion in the repo. |
| GitHub Projects item, moved through `In Progress` → `Done` | Not verified by this file. Check live before assuming either way. |
| Keep `README.md`, categorized docs, `ROADMAP.md`, `HANDOFF.md` accurate; update wiki and Pages every project-changing task | Applies to `design/README.md`, `design/ROADMAP.md`, `design/HANDOFF.md` — **not** the root `README.md`, which is upstream's build README ([§2](#2-what-must-never-be-edited-and-what-we-own)). |

Read the file rather than trusting this table; it is a summary of a 51 KB document written at
one moment in time.

> [!WARNING]
> **Known provenance mismatch — do not paper over it.** The submodule's own `AGENTS.md`
> authorizes its auto-install contract *only* when the canonical origin is
> `https://github.com/codingmachineedge/agent-global-memory.git`, but this checkout's actual
> origin (`git -C vendor/agent-global-memory remote -v`) is
> `https://github.com/Ding-Ding-Projects/agent-global-memory.git`. Its own guard clause says:
> do not bypass, show the issue, get user direction. This is recorded as an open blocker on
> Discussion #1. Reading the instructions is fine and required; running the installer under an
> unrecognised provenance is not.

### 5.2 Commit messages are bilingual, and funny about the code

Every commit here carries a precise English subject, an English body with actual wit in it,
and a Cantonese (`粵:`) section saying the same thing in playful Hong Kong style. Both
languages carry the humour — the English body is not a dry changelog sitting next to a playful
Cantonese one.

- **Roast the code, never a person.** No blaming a contributor, an author, or a previous
  agent. No self-deprecation that muddies what actually happened.
- **Humour styles the telling, never the facts.** The subject line stays a precise, scannable
  summary — someone reading `git log` must learn what changed without decoding a joke. SHAs,
  line numbers, file names, rule counts and test counts stay exact in *both* languages. A
  message that is funny but leaves the reader unsure what changed is a broken commit message.
- Commits end with the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.

Current state: **25 of the 28 commits ahead of `upstream/main` carry a `粵:` section**; the
three that do not are the three oldest (`b5330388a96`, `f54b8a4e603`, `12768ce4581`), from
before the convention was applied here. Read one in full before writing your first —
`0b8c2349cf2` is a good model:

```sh
git log -1 --format='%B' 0b8c2349cf2
```

Its subject is `Guard the accessibility fallbacks too; contract reaches 38/38`; its body names
the specificity arithmetic, the exact selector counts fixed (twelve, two, one), what was
deliberately left alone and why — and *then* lands the joke.

### 5.3 Evidence discipline — how a box gets ticked

`design/REWRITE-CONTRACT.md` is a 38-box feature-parity ledger, and it is graded, not
narrated.

- **A box is ticked only with named evidence**: the file, the selector, the DOM target or
  handler the behaviour actually runs through, and the argument for why the styling *cannot*
  break it. "Looks fine", "should be OK" and "probably holds" are not evidence — the contract
  says so in as many words about keyboard navigation (*"'probably' is not evidence and nobody
  enumerated them"*).
- **Ticks are adversarially refuted before they stand.** The established pattern is section
  agents claiming boxes with named evidence, then a separate adversarial pass trying to break
  each proof. On the first parity pass, 31 boxes were claimed, **30 ticked and 1 refused** —
  the column-picker box, whose named fix — `.menupopup-column-picker > :is(menu, menuitem)`,
  recorded then as `m3-thread-pane.css:357` — was specificity (0,1,1) against a nested rule
  resolving to (1,0,1), and therefore dead. That refusal is recorded in the file under
  **"Refused — do not tick"**, alongside its later resolution. (The *line number* has since
  moved: `.menupopup-column-picker` rules now sit around 425/464/491/511. Line citations in the
  contract are historical — search for the selector, never `sed -n` the recorded line.)
- **Un-ticking on review is a correct outcome, not a failure.** Theming stayed unticked across
  multiple passes for a stated reason. Recording a refusal, and recording *why*, is the
  product.
- The proof requirement is what finds bugs. Eleven real restyle regressions were caught by
  demanding evidence rather than by review-by-eyeball.
- **The strongest evidence is mechanical, not rhetorical**: brace balance counted with
  comments stripped, guard strings counted literally (the contract records 119 occurrences all
  spelled identically as `:root:not([lwtheme])`; today's per-file `grep -c` gives 148 *lines*
  carrying the guard — different units, different moments, so re-count rather than trusting
  either), `git status --porcelain` naming exactly the assigned files.
- **What a tick means, and does not.** It certifies that the named upstream behaviour still
  *functions* — that no rule added here hides, un-hit-tests, reparents, mis-measures or
  out-ranks the mechanism implementing it. It is **not** a visual sign-off and **not** a
  runtime sign-off.

The load-bearing fact behind all of it is the untouched `about3Pane.js` in
[§2](#2-what-must-never-be-edited-and-what-we-own). If you ever touch that file, every tick in
the contract is void until re-derived.

### 5.4 Reporting honesty

- **A build is not called green until it is green.** Report the run link immediately, label
  the state `running`, `failed` or `verified`, and record the real outcome when it lands.
  Never predict a success.
- **A feature is not called preserved until it is wired.** Restyling a surface is not
  preserving its features — the contract ticked *zero* boxes for the stylesheet-landing
  commits and says explicitly that this "is deliberate and should stay that way until
  behaviour lands."
- **Static proof is not a running application.** Every proof in the contract is static:
  selector, specificity, cascade and source reading against the JS that consumes it. Nothing
  on this branch has been built and launched. Some gates *cannot* close statically — the
  audit's F6 screen-reader gate is one, because `_setRowAriaAttributes` short-circuits unless
  `Services.appinfo.accessibilityEnabled` **or** `Cu.isInAutomation` (`tree-view.mjs:1110` — see
the correction below). Say so; do not launder it into a pass.
- The same honesty rule applies to issue and Discussion comments: rich formatting decorates
  the facts, it never softens a failure or implies an unproven success.

### 5.5 The rolling progress Discussion

**[Discussion #1](https://github.com/Ding-Ding-Projects/thunderbird-desktop/discussions/1)** —
*"🎨 Material Mail — Thunderbird 3-Pane full rewrite (rolling progress)"*, category
**General**, open, **9 comments** as of this writing — is the project's running record. Every
push, decision, blocker, root cause established, sub-agent dispatched or returned, and CI
verdict gets **a comment on that thread**. Not a new thread per milestone, and not a rewrite
of the opening post (it may keep a short current-status pointer only).

Post **frequently**. A reader checking the thread should be able to follow the work in near
real time. Batch only genuinely trivial mechanical steps; an over-documented thread costs a
scroll, an under-documented one leaves the user guessing what an agent did for hours.

Comments are richly formatted and bilingual: heading hierarchy, tables for anything
enumerable, `<details><summary>` for long evidence, GitHub alerts (`> [!NOTE]`,
`> [!WARNING]`, `> [!IMPORTANT]`), shields.io badges, code fences with language tags.
**GitHub strips `<style>`, `style=` and `<script>`** — do not write CSS into a comment; get
the look from the permitted HTML subset and badge images. Exact SHAs, file paths, line numbers
and counts stay exact in both languages, and every claim carries its honest verification
state. Never paste secrets into the thread.

Read-only inspection:

```sh
gh api graphql -f query='{repository(owner:"Ding-Ding-Projects",name:"thunderbird-desktop"){discussions(first:5){nodes{number title category{name} comments{totalCount}}}}}'
```

### 5.6 GitHub Pages is published with plumbing, never a checkout

The Pages site lives on the **`gh-pages`** branch — currently three commits (`fec93b1a045`,
`6c776929ba7`, `8849d4a9ac4`) holding `index.html`, `docs.html`, `assets/` and `.nojekyll`.
There is **no Pages workflow**; `.github/workflows/` contains only `lint-m3.yml` and
`windows-installer.yml`, so Pages is published by the agent, from this same clone.

That is exactly why it must be done with **git plumbing** — `git hash-object -w`,
`git mktree` / `git update-index`, `git commit-tree`, `git update-ref` — or with an isolated
index via a separate `GIT_INDEX_FILE`. **Never `git checkout gh-pages`, never `git stash`,
never a temporary worktree inside this tree.** Multiple workflows run against this working
tree concurrently; switching branches under a running wave corrupts its work and can destroy
uncommitted edits it has not yet committed.

How to check the convention has been honoured:

```sh
git reflog show gh-pages     # all three entries have EMPTY messages -> update-ref, not commit/checkout
git reflog show HEAD | grep gh-pages   # no matches in 31 entries -> never checked out here
git worktree list            # exactly one worktree, on design-import/thunderbird-3pane
```

A `git commit` writes `commit: <subject>` into the reflog and a `git checkout` writes
`checkout: moving from …`. Empty reflog messages on all three `gh-pages` commits are the
signature of `update-ref`. (The exact publish incantation is not recorded anywhere in the
repo — there is no publish script. The plumbing verbs above are the prescribed convention;
the reflog and worktree checks are the evidence a checkout was not used.)

### 5.7 Windows-only scope — what it relaxes and what it does not

Per the user's scope override (recorded in `SHARED_INSTRUCTIONS.md` and restated at the top of
`design/REWRITE-CONTRACT.md`), this work targets the **Windows desktop app exclusively**.

| | |
|---|---|
| **Relaxed** | Target Windows directly instead of threading every style through a three-platform abstraction. No `-moz-platform` forks to carry in new markup; Windows-native scrollbar/focus/titlebar conventions may be assumed; only the Windows test matrix must stay green. |
| **Not relaxed** | The feature-parity checklist, **accessibility**, and **localization**. These hold regardless of platform count. Every string still goes through Fluent (`data-l10n-id`) or a DTD entity — no hardcoded text. |
| **Not permitted** | Deleting or disabling existing macOS/Linux code paths. Out of scope means **left alone**, not removed. |

The distinction is load-bearing in practice: the accessibility half is what keeps the
`Accessibility` box honest, and the guard pass in [§3](#3-the-two-cascade-rules) had to be
redone precisely because guarding colour rules broke the `@media (prefers-contrast)` /
`(forced-colors)` fallbacks that exist to undo them.

### 5.8 Never commit a wave's output before the wave has actually returned

If you orchestrate sub-agents, wait for the completion notification before staging anything they
produced. Committing a wave's files while the wave is still running has already cost this project
real work:

- A wave's own ratifier committed `fc2ea74120c` and merged upstream as `4bc02b085dd` *after* its
  files had been committed as `f85b5d786f0`, splitting one wave across three commits.
- That extra push is what triggered browser-test run #2, whose concurrency group cancelled run #1
  five seconds later — blocker #10 above. **The cancelled run was the evidence the accessibility
  box needed.**
- Two agents briefly held `m3-thread-pane.css` at the same time.

A finished-looking working tree is not a finished wave. `git status` going quiet means the agent
currently holding a file has stopped writing to it, not that the wave is done.

Two related habits that prevent the same class of damage: **assign each file a single owner per
phase** and say so in the prompt (the sheets are interdependent and two concurrent editors produce
plausible nonsense), and have agents **report** defects in files they do not own rather than edit
them. A wave that found a real bug and declined to fix it in someone else's file did the right
thing.

---

## 6. Known stale text elsewhere in the tree

Verified contradictions found while writing this file. None were edited here — fix them in a
commit that is allowed to touch those files, and do not take the stale side as truth
meanwhile.

| Where | What is stale |
|---|---|
| `.github/workflows/windows-installer.yml` line 15 | Header comment still claims "~14 GB before cleanup"; the measured figures (and its own `env:` block) say C: ~33 GB, D: ~147 GB. |
| `.github/workflows/windows-installer.yml`, "Package installer" step comment | Still says output lands in `dist/install/sea/*.installer.exe` — the exact wrong premise blocker #9 fixed. The "Locate installer" step immediately below is correct. |
| `design/REWRITE-CONTRACT.md`, opening paragraph | Still says "full ground-up rewrite … No stock Thunderbird markup carried over." `design/README.md` corrects this: what was built is a CSS-layer restyle over upstream markup. The README's framing is the accurate one. |

**Retracted:** an earlier draft of this section accused the `@media (prefers-contrast)` comment
in `m3-layout.css` of miscomputing a specificity. It does not. Re-derived by hand: the
`border-color: transparent` rule it names is `:root:not([lwtheme]) #folderPaneSplitter`, which
really is (1,2,0); the fallback `:root:not([lwtheme]) #folderPaneSplitter:not(.splitter-collapsed)`
really does land at (1,3,0); and the unguarded `#folderPaneSplitter:not(.splitter-collapsed)`
really is (1,1,0). Every number in that comment is right. Left here as a worked reminder that a
specificity claim gets recomputed against the actual selector before it is called wrong.

---

## 7. Before you finish — checklist

1. **Re-check upstream.** Upstream may have moved while you worked; a branch that was level
   when you started is not necessarily level when you finish. Redo
   [§1 steps 1-2](#step-1--measure-the-drift), and if `HEAD..upstream/main` is non-zero, do
   steps 3-4 before you call the work done.
2. **Re-scan the agent-global-memory issues** —
   `gh issue list --repo Ding-Ding-Projects/agent-global-memory --state open`. A new
   instruction applies to the work in flight, including redoing what it invalidates. Record
   the scan in one line even when it finds nothing.
3. **Prove the invariant.** `git diff --stat upstream/main...HEAD -- mail/base/content/about3Pane.js`
   must be empty, and `git diff --stat upstream/main...HEAD -- mail/` must still show **zero
   deletions**.
4. **Re-run the guard counts** if you touched CSS
   (`grep -c ':root:not(\[lwtheme\])' m3-*.css material-tokens.css`); `material-tokens.css`
   must stay at 0.
5. **Push to `origin` only**, on `design-import/thunderbird-3pane`. Never to `upstream`.
6. **Post to [Discussion #1](https://github.com/Ding-Ding-Projects/thunderbird-desktop/discussions/1)**
   — what you did, the SHAs, the CI run link, and the honest state of every claim
   (`running` / `failed` / `verified`). A build is not green until it is green.
