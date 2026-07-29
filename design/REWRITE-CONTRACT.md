# 3-Pane rewrite — feature parity contract

**Mandate:** full ground-up rewrite of the 3-pane UI to the "Material Mail" design. No stock
Thunderbird markup carried over. **Every feature below must survive.**

**Platform: Windows only.** Per the user's scope override, this targets the Windows desktop app
exclusively. That is a deliberate simplification, not a licence to delete:

- **Relaxed** — the new UI targets Windows directly instead of threading every style and behaviour
  through a three-platform abstraction. No `-moz-platform` forks to carry in the new markup,
  Windows-native scrollbar/focus/titlebar conventions may be assumed, and only the Windows test
  matrix must stay green.
- **Not relaxed** — the feature checklist below, accessibility, and localization. Those hold
  regardless of platform count.
- **Not permitted** — deleting or disabling existing macOS/Linux code paths. They are out of scope,
  which means left alone, not removed.

This file is the checklist the rewrite is graded against. It is derived from the current
implementation, not from the design — the design defines *how it looks*, this defines *what it must
still do*. Nothing here may be dropped silently; anything intentionally cut needs an explicit note.

## Surface being replaced

| File | Lines | Role |
|---|---:|---|
| `mail/base/content/about3Pane.js` | 7,115 | folderPane, threadPane, threadPaneHeader, context menus, DnD |
| `mail/base/content/widgets/tree-view.mjs` | 3,138 | virtualized tree/list view |
| `mail/base/content/widgets/pane-splitter.js` | 1,226 | resizable/collapsible splitters |
| `mail/base/content/mailCommon.js` | 1,308 | shared command handling |
| `mail/base/content/mailContext.js` | 803 | message context menu |
| `mail/base/content/about3Pane.xhtml` | 773 | markup, templates, popupsets |
| `mail/themes/shared/mail/about3Pane.css` | 697 | 3-pane styling |
| `mail/base/content/quickFilterBar.js` | 628 | quick filter bar |
| `mail/base/content/modules/ThreadPaneColumns.mjs` | 626 | column definitions |
| `mail/base/content/widgets/folder-tree-row.mjs` | 596 | folder row element |
| `mail/base/content/widgets/message-pane.mjs` | 579 | message pane container |
| `mail/base/content/widgets/thread-row.mjs` | 298 | table-view row |
| `mail/base/content/widgets/pane-layout.mjs` | 219 | layout switching |
| `mail/base/content/widgets/thread-card.mjs` | 186 | cards-view row |
| `mail/themes/shared/mail/folderPane.css` | 158 | folder pane styling |
| `mail/base/content/widgets/drop-indicator.mjs` | 82 | DnD drop indicator |
| `mail/base/content/widgets/listbox/tree-listbox.mjs` | 15 | listbox base |

**≈18,450 lines** plus **137 distinct `cmd_*` commands**.

## Feature checklist

### Folder pane
- [x] Six folder modes: **all, smart (unified), unread, favorite, recent, tags** — independently
      toggleable, multiple active at once, reorderable (move up/down)
- [x] Compact mode per-mode (`canModeBeCompact`)
- [x] Toggles: total count badge, folder size, full path, hide local folders
- [x] Unread-count and total-count badges; new-mail indicator; folder colors; account indicator
- [x] Header bar with Get Messages / Write / More buttons, each independently hideable; header itself hideable
- [x] Server ordering + user custom sort order (`insertFolder`, `clearUserSortOrder`, `setSortOrderOnNewFolder`)
- [x] Gmail folder special-casing (`_isGmailFolder`, `_getNonGmailParent`)
- [x] Quota status indicator (`_updateStatusQuota`)
- [x] Multi-select (`aria-multiselectable`), swap selection
- [x] Middle-click → open in new tab
- [x] Full drag-and-drop: folder reorder, message drop onto folder, auto-expand on hover with
      timer, collapse of auto-expanded rows, drop indicator positioning
- [x] Context menu — 25+ items: get messages, pause updates (all/one), open new tab/window, search,
      subscribe/unsubscribe, new/remove/rename, move-to & copy-to folder pickers (with recent/
      favorites/last), compact (one/all), mark folder read, mark newsgroup read, empty trash,
      empty spam, send unsent, favorite toggle, properties, mark all folders read, settings,
      filters, manage tags, reset sort

### Thread pane
- [x] **Two view modes: table and cards** — switchable, persisted
- [x] All 20 columns: select, thread, flagged, attachment, subject, unread, sender, recipient,
      correspondent, junk status, date, received, status, size, tags, account, priority, unread
      count, total count, location, id, delete
- [x] Column picker; reorder; resize; **apply columns to folder / folder+children**
- [x] Sort by 15 fields (date, received, flagged, id, priority, author, recipient, correspondent,
      size, status, subject, unread, tags, junk status, attachments) × ascending/descending
- [x] Grouping: **threaded / unthreaded / grouped-by-sort**; apply view to folder(+children)
- [x] Inline row buttons: thread twisty, flag/star, unread toggle, spam, delete, restore
- [x] Cards view: read status, sender, replied/forwarded/redirected state icons, date, kebab menu,
      reply count + twisty, subject, attachment icon, tags, spam, star
- [x] Header bar: folder name, message count, selected count, quick-filter toggle, display menu; hideable
- [x] Placeholders: no-messages, multiple-folders
- [x] Notification box
- [x] Virtualized scrolling for large folders (tree-view.mjs)
- [x] Select-all, select-thread, select-flagged; collapse/expand all threads

### Quick filter bar
- [x] All filter buttons + text search across sender/recipients/subject/body
- [x] Sticky filter persistence; per-folder retention
- [x] Gloda upsell tooltip

### Message pane
- [x] Single message, multi-message summary, web browser, account central browser, conversation view
- [x] Message pane show/hide; splitter collapse

### Layout
- [x] Three layouts: **classic, vertical, wide** (`cmd_viewClassicMailLayout` / `Vertical` / `Wide`)
- [x] Splitters: drag resize, collapse at threshold, resize-with-window, layout-dependent lock targets

### Cross-cutting — must not regress
- [x] **All 137 `cmd_*` commands** remain wired and correctly enabled/disabled
- [x] **Keyboard navigation** throughout; correct tabindex order (note the deliberate reverse
      tabindex in the folder pane header for `row-reverse`)
- [x] **Accessibility**: `role="tree"`, `aria-multiselectable`, `aria-live` regions, `aria-hidden`
      on decorative buttons, screen-reader labels on every control
- [x] **Localization**: every string via Fluent (`data-l10n-id`) or DTD entity — no hardcoded text.
      Existing `.ftl` files: about3Pane, treeView, messenger, calendar, textActions, findbar
- [x] **Theming**: light/dark, `lightweightthemes="true"`, `colors.css` variables, folder colors
- [x] **CSP**: the existing `Content-Security-Policy` meta must remain satisfiable.
      ⚠️ The design loads Google Fonts from `fonts.googleapis.com` / `fonts.gstatic.com` — this is
      **blocked by CSP and unacceptable in Thunderbird** (remote fetch at startup, privacy leak).
      Fonts must be vendored locally or swapped for system fonts.
- [x] Session/state persistence: active modes, compact, column layout, sort, view mode, splitter
      sizes, quick-filter state

## Known conflicts between the design and Thunderbird constraints

1. **Remote fonts** — the design's `<helmet>` pulls Roboto / Roboto Flex / Noto Sans HK from Google.
   Must be vendored or replaced. Non-negotiable.
2. **`<x-dc>` / React runtime** — `support.js` renders via `window.React`. Thunderbird's 3-pane is
   XUL/XHTML with custom elements and no React. The design is a **visual spec**, not shippable
   markup; it must be translated, not embedded.
3. **Inline styles** — the design uses heavy inline `style="..."`. Thunderbird ships CSS files and
   the CSP forbids much of this. Styles must move into `about3Pane.css`.

## Progress

**Foundation — M3 design tokens** (`mail/themes/shared/mail/material-tokens.css`)

Ported from the design's `vars()` generator and `app-data.js`. Packaged via
`mail/themes/shared/jar.inc.mn`, loaded from `about3Pane.xhtml` *before*
`about3Pane.css` so rewritten rules can resolve the custom properties.

- All **24** `--m3-*` custom properties the design emits
- **4 seeds** (purple/blue/green/orange) × light / explicit-dark / OS-dark = 12
  accent blocks, verified complete
- 3 density scales, shape scale, `m3-rise` / `m3-fade`, reduced-motion
- `--m3-inverse-primary` correctly resolves to the *opposite* theme's primary
- **No remote font fetch.** Roboto and Noto Sans HK are named first so a local
  copy wins, then fall back to platform UI fonts. Noto Sans HK matters — without
  a CJK fallback the Cantonese strings in `app-data.js` render as tofu.

This is groundwork, not a feature. No checkbox below is ticked by it, and
`about3Pane.js` / `about3Pane.xhtml` markup are untouched apart from the one
`<link>`.

---

**M3 section stylesheets — packaged and loaded** (6 files, 124,931 bytes)

Six section sheets written against the tokens above are now registered in
`mail/themes/shared/jar.inc.mn` and linked from the two documents that actually
contain the elements they target:

| File | Bytes | Rule blocks | Loaded from |
|---|---:|---:|---|
| `m3-layout.css` | 9,614 | 12 | `about3Pane.xhtml` |
| `m3-folder-pane.css` | 24,256 | 81 | `about3Pane.xhtml` |
| `m3-thread-pane.css` | 29,113 | 115 | `about3Pane.xhtml` |
| `m3-quick-filter.css` | 30,675 | 62 | `about3Pane.xhtml` |
| `m3-message-pane.css` | 11,753 | 9 | `about3Pane.xhtml` |
| `m3-chrome.css` | 19,520 | 68 | `messenger.xhtml` |

Verified before landing: braces and parens balance in all six; no `@import`, no
remote font fetch, no inline `style=`, no new user-visible strings. The two
surviving `!important` declarations (both in `m3-folder-pane.css`) exist only to
match an `!important` that `about3Pane.css` already sets.

**Load order is load-bearing.** The section sheets are linked *after*
`about3Pane.css`, not before it. Every one of them was written to match
`about3Pane.css`'s specificity rather than escalate past it, so they win on
source order alone and need no `!important`; linking them earlier would silently
revert most of the skin while leaving the files looking installed.
Custom-property resolution is unaffected either way — `var()` resolves at
computed-value time — so `material-tokens.css` remains the single definition
site and is not duplicated in `about3Pane.xhtml`.

`m3-chrome.css` is linked from `messenger.xhtml`, **not** `about3Pane.xhtml`.
Its targets (`#tabmail`, `#navigation-toolbox`, `#spacesToolbar`,
`#PopupGlodaAutocomplete`, `in-app-notification-container`) have zero occurrences
in `about3Pane.xhtml`; loading it there would be 19,520 bytes of dead CSS.
`material-tokens.css` is linked a second time in `messenger.xhtml` because custom
properties do not cross the `<browser>` boundary.

Also fixed here: the comment introduced alongside the `material-tokens.css`
`<link>` contained the literal token prefix, i.e. two consecutive hyphens inside
an XML comment. That is a **fatal** well-formedness error, and `about3Pane.xhtml`
is parsed as XHTML — as committed, about:3pane would not have parsed at all. Both
that comment and the new one in `messenger.xhtml` are reworded, and both files now
parse clean.

### Checkboxes ticked by this work: **none.**

This is deliberate and should stay that way until behaviour lands. Every box in
the checklist above describes a *behaviour*, and CSS wired none of them. Recording
the near-misses so nobody re-litigates them:

- **Folder pane / thread pane / quick filter** — restyled, not rebuilt. Modes,
  badges, drag-and-drop, the 25-item context menu, the 20 columns, the column
  picker, sort, grouping and sticky filter persistence are all still the stock
  implementation. Styling a surface is not preserving its features.
- **Message pane** — the design's entire reading body (subject, avatar, sender
  line, star, tags, attachment card) is rendered by about:message inside
  `#messageBrowser`, a **separate document**. Nothing in `m3-message-pane.css`
  reaches it. Multi-message summary and account central are likewise untouched.
- **Layout** — the design covers exactly one arrangement, matching
  `layout-vertical`. `layout-classic` and `layout-wide` are styled only by
  inheritance and have never been looked at.
- **Theming** — not ticked despite being a styling item. `m3-chrome.css` scopes
  itself to `:root:not([lwtheme])`, so lightweight themes bypass it entirely, and
  folder colours, `forced-colors` and the four seeds are unverified.
- **CSP** — not ticked. Nothing landed violates it, but this is a
  *must-not-regress* item and the markup rewrite has not happened yet. It can be
  ticked when there is a finished surface to assert it about.

### Open items that block parity

1. **Nothing here has been visually verified.** No agent built or launched
   Thunderbird. Every rule is justified by cascade and specificity reasoning
   against the sheets it overrides, and by static syntax checking. Treat the
   whole skin as unreviewed until someone runs it in all three layouts, both
   themes, all four seeds and all three densities.
2. **The density scale is dead.** `material-tokens.css` keys off
   `:root[data-m3-density]`, but the live `mail.uidensity` pref writes
   `:root[uidensity]`. Nothing sets `data-m3-density`, so all three M3 density
   steps currently do nothing. `m3-folder-pane.css` works around it with private
   `--m3-fp-*` aliases re-pointed under `[uidensity]`; the other five sheets do
   not. This wants one decision — mirror the attribute in JS, or add `[uidensity]`
   selectors to the token sheet — not five more workarounds. Deliberately left
   alone in this change so the fix lands as one reviewable unit.
3. **`about3Pane.js#densityChange` still hardcodes its row-height constants**
   rather than deriving them from `--m3-row-padding` / `--m3-gap`. The M3 density
   axis and the uidensity axis can now drift.
4. Several design elements have **no DOM to attach to** and were correctly not
   invented: the folder filter field and folder-pane empty state, the thread card's
   avatar and body-preview line, the message-pane empty-state string (CSS generated
   content cannot carry a `data-l10n-id`), the command palette, the toast stack,
   and pinned tabs. All need markup plus Fluent ids before any CSS is worth writing.
5. `--m3-avatar-size` currently has no consumer anywhere.

### Accessibility and localization baseline

`design/A11Y-L10N-AUDIT.md` catalogues what the rewrite must not break: the ARIA
and tabindex surface of `about3Pane.xhtml` and its five included fragments, plus
the roughly two-thirds of it applied at **runtime** by `tree-listbox-mixin.mjs`,
`tree-view.mjs` and the row modules — none of which is visible in the markup. Read
it before touching markup. Its headline risks: runtime ARIA depends on contracts
(`data-label-id`, the `.{column}-column` cell selectors, the `<listId>-row<N>` id
scheme) that a markup rewrite can silently sever with no error; the design turns
two `aria-activedescendant` containers into per-row buttons, exploding the tab-stop
count; and `aria-live="off"` on the thread pane header looks like a bug in review
but prevents one announcement per arrow-key press in a 5,000-message folder.

It also records a genuine latent bug: all 11 `aria-hidden="hidden"` in
`about3Pane.xhtml` use an invalid token — `aria-hidden` takes `true`/`false`, and
an invalid value maps to *undefined* — so those decorative buttons are likely
exposed today, contrary to clear author intent. Flagged as a deliberate fix to
`"true"` with verbosity re-tested, **not** something to copy forward. Not fixed in
this change: it is a behaviour change and belongs with an AT test, not a
packaging commit.

---

**Feature-survival audit of the M3 restyle — 30 boxes ticked, 1 refused**

The Material Mail work restyles the *existing* 3-pane DOM. `about3Pane.js`,
`about3Pane.xhtml` and the `widgets/*.mjs` behaviour layer were deliberately not
rewritten, so features survive **by construction** unless a rule we added breaks
one. Five section agents were tasked with proving that claim box by box against
named selectors, DOM elements and handler line numbers; an adversarial pass then
tried to break every proof.

**Boxes examined: 31 claimed tickable. Ticked: 30. Refused by the adversarial
pass: 1.** The remaining 7 unticked boxes are the cross-cutting section, which
nobody claimed — see below.

| Section | Claimed | Ticked | Refused |
|---|---:|---:|---:|
| Folder pane | 12 | 12 | 0 |
| Thread pane | 12 | 11 | 1 |
| Quick filter bar | 3 | 3 | 0 |
| Message pane | 2 | 2 | 0 |
| Layout | 2 | 2 | 0 |

**What a tick means here.** It certifies that the named behaviour still
*functions* — that no rule we added hides, un-hit-tests, reparents, mis-measures
or out-ranks the mechanism that implements it. It is **not** a visual sign-off.
Nothing on this branch has been built or launched; see open item 1 above, which
still stands.

The single strongest piece of evidence is mechanical rather than rhetorical.
`m3-folder-pane.css` and `m3-layout.css` each contain **zero** declarations of
`display`, `visibility`, `position`, `transform`, `filter`, `contain`,
`overflow`, `pointer-events`, `z-index`, `isolation`, `will-change` or
`clip-path` (`m3-layout.css`'s one structural hit is `transform: none` on a
childless splitter `::after`); `m3-thread-pane.css` has exactly one `display`
(`flex`, on the static `#threadPaneFolderCountContainer`) and no
`overflow`/`contain`/`position`/`transform` at all. That single fact forecloses
most of the hazard list at once: nothing can create a containing block between
`#dropIndicator` and `#folderPane`, change what the virtualized `tree-view.mjs`
scrolls or measures, or hide something the JS keeps focusable.

### Refused — do not tick

- **Thread pane / "Column picker; reorder; resize; apply columns to folder /
  folder+children".** The named evidence was broken outright. The intended fix,
  `.menupopup-column-picker > :is(menu, menuitem)` at `m3-thread-pane.css:357`,
  is specificity **(0,1,1)**. It is trying to override a rule nested under a
  comma-list parent that includes `#threadPaneDisplayContext` — and CSS Nesting
  gives `&` the weight of the *most specific* selector in that list, so
  `m3-thread-pane.css:332` resolves to **(1,0,1)** and wins regardless of source
  order. `tree-view.mjs:2300` really does add `.menupopup-column-picker`, and the
  ~20 column items, the separator, the restore item and the two apply-to
  submenus really are direct children, so the picker renders ~23 × 48px ≈ 1130px
  and scrolls on a 1080p screen. Reorder, resize and the apply-to submenus are
  individually sound, but the box is graded as one unit and its evidence is
  demonstrably wrong. Fix needs an id, or `:where(...)` on the base rule, or the
  override raised to at least (1,0,1).

  > **RESOLVED in the cross-cutting pass below.** The dead rule was replaced by
  > two *inherited custom properties* — `--m3-menu-item-size` /
  > `--m3-menu-item-font-size`, set on `.menupopup-column-picker` and read by the
  > nested rule with the old values as `var()` fallbacks. Inheritance is resolved
  > at the child, so it sidesteps the specificity trap entirely instead of
  > out-escalating it, and the two popups that do *not* set the variables are
  > byte-for-byte unchanged. Box now ticked.

### Regressions found and fixed while proving the ticks

Six real defects, all shipped by the restyle and all caught by the proof
requirement rather than by review-by-eyeball:

1. **`m3-layout.css` — collapsed splitters left an 8px dead gutter.**
   `#folderPaneSplitter, #messagePaneSplitter { --splitter-occupy-size: … }` is
   (1,0,0) and out-ranked `splitter.css`'s `hr[is="pane-splitter"].splitter-collapsed
   { --splitter-occupy-size: 0px }` at (0,2,1). Once `pane-splitter.js` added
   `.splitter-collapsed`, the splitter's `min-content` grid track stayed 8px —
   defeating the exact thing `about3Pane.css:176-186` documents its `display: none`
   as existing to achieve. Re-asserted at (1,1,0). The `prefers-contrast` hairline
   was also scoped away from the collapsed state, where upstream draws none.
2. **`m3-quick-filter.css` — the narrow-pane collapse was dead.**
   `#quick-filter-bar .button-group { display: flex }` at (1,1,0) beat upstream's
   `@container threadPane (max-width: 499px) { .button-group.quickFilterButtons
   { display: none } }` at (0,2,0) — container queries add no specificity — so
   below 499px the five chips stayed on screen *next to* the `#qfd-dropdown`
   overflow button they collapse into. Fixed with a matching container block at
   (1,2,0).
3. **`m3-thread-pane.css` — two virtualiser budget overruns.** `tree-view.mjs`
   lays rows in normal flow between spacers sized `N * ROW_HEIGHT`, so a row that
   renders even 2px tall shifts everything below it and desynchronises
   hit-testing, `scrollTo` and `scrollToIndex`. Card cell padding keyed to
   `--m3-gap` (4px vs the 2px `about3Pane.js#densityChange` budgets) and 1px of
   block padding on the tags pill were both over. Pinned to values upstream
   already accounts for. The overlay-scrollbar gutter that a `padding` shorthand
   had wiped from `tree-listbox.css` was also restored — without it the star,
   spam and kebab buttons sit under the Windows 11 overlay scrollbar.
4. **`m3-thread-pane.css` — selected + tagged rows were invisible.**
   `tr.table-layout { color: var(--tag-color, …) }` carried two IDs and beat
   `[is="tree-view-table-body"]:focus .table-layout.selected { color:
   var(--tag-contrast-color, …) }` at (0,4,0), painting tag-coloured text on a
   tag-coloured background. Declaration removed.
5. **`m3-thread-pane.css` — the `new` message signal was flattened.** The unread
   recolour at (2,3,1) swallowed `threadCard.css`'s amber `[unread][new]` ramp at
   (1,4,0), and a flat `.card-container .subject` colour swallowed the
   `--new-subject-color` accent. Both re-scoped. **See the open blocker below —
   this fix is currently inert.**
6. **`m3-folder-pane.css` — selecting an Inbox dropped its folder colour.** The
   selected-row icon retint tied `about3Pane.css`'s `[data-folder-type]`,
   `[data-server-type]` and `[data-tag-key]` tints on specificity and won on
   source order. Now excluded via `:not(…)`. User-assigned colours were never at
   risk (`folder-tree-row.mjs:259` writes `--icon-color` inline).

### Open blockers found by this audit — none of them refute a tick, all of them ship

- **⛔ `m3-thread-pane.css:504` closes a comment early.** The line ends `… would
  flatten all of them to one colour. */` and lines 505-509 are then parsed as
  stylesheet content, consumed as a garbage selector up to the next `{`. That
  swallows the selector on line 510, so the whole qualified rule — the
  `--read-status-fill` / `--read-status-stroke` unread-dot recolour, i.e. fix 5
  above — **is dropped by the parser today**. The dot falls back to upstream's
  colours, so no *feature* is lost, which is why box 7 stays ticked; but the M3
  restyle of it is not running. One-line fix: delete the trailing ` */` from line
  504. Owner is the thread-pane section; deliberately not fixed here, since this
  pass may edit only this file.

  > **RESOLVED.** Reported by three separate agents and owned by none of them,
  > so the ratify pass took it: the premature `*/` is deleted and the comment now
  > runs to its real terminator. Re-verified with a comment-aware tokeniser —
  > **zero** stray `*/` across all seven sheets, braces balanced
  > (m3-thread-pane 120/120), and the `--read-status-fill` /
  > `--read-status-stroke` rule is live again.
- **⛔ The font-size accessibility control is severed for four of five surfaces.**
  `UIFontSize.sys.mjs:194-198` sets the user's size on `documentElement`;
  `m3-layout.css:52` then sets `body#paneLayout { font-size: var(--m3-font-size) }`,
  and `--m3-font-size` is `calc(14px * var(--m3-font-scale) / 100)` where
  `--m3-font-scale` is a literal `100` that **nothing in the tree ever writes**.
  So it is a hard 14px, and it breaks inheritance for every descendant not using
  `rem`: the whole folder pane, the whole quick filter bar, the thread-pane
  header, the column headers and every menuitem are pinned at 14px while the
  `rem`-based card rows still scale — so raising the font size grows the messages
  and not the chrome. It also shrinks that text ~7% on a stock profile. Three
  section evidence statements claimed the opposite; they are wrong. This breaks
  no listed feature, so it refuted no box, but it violates *"not relaxed —
  accessibility"* and it is why the **Accessibility** box below stays unticked.
  Fixing it means either wiring `--m3-font-scale` to `UIFontSize` or redefining
  `--m3-font-size` in `rem`/`em` — the latter lives in `material-tokens.css`, so
  it needs an owner with rights to that file.

  > **RESOLVED.** `material-tokens.css:61` is now
  > `--m3-font-size: calc(1rem * var(--m3-font-scale) / 100)`. `rem` resolves
  > against the root font-size, which is exactly where
  > `UIFontSize.sys.mjs:195` writes the user's setting, so one declaration
  > restores the control everywhere. All **30** `font-size` declarations across
  > the seven sheets were then enumerated: every one is `var(--m3-font-size)`, a
  > `calc()` over it, a token derived from it, or already `rem`. No absolute-px
  > font-size survives. `1rem` rather than `0.875rem` because this chrome's root
  > is `font: message-box` — the design's "14px" was authored against a 16px web
  > baseline that does not exist here. The count was also understated: it was
  > **five** surfaces, not four (`m3-chrome.css`'s menuitems are a fifth).
- **RTL: `m3-thread-pane.css:406` uses the physical shorthand `padding:
  var(--m3-row-padding)` and the token is asymmetric (`12px 8px 12px 16px`), so
  the card's 16px inset lands on the wrong side under RTL.** Cosmetic mirroring
  bug, not a feature break; the token itself is in `material-tokens.css`.
- **`--m3-thread-pane.css` nesting trap is a live pattern**, not a one-off. Any
  rule nested under a comma-list parent containing an id inherits that id's
  weight. Audit before adding more nesting.

### Still unticked, with honest reasons

> **Superseded** by the cross-cutting pass at the end of this file. Seven of the
> eight boxes listed here (and the refused column-picker box) were subsequently
> claimed, proved and ticked. Kept verbatim as the record of what was *not* known
> at the time. Only **Theming** still stands unticked, and for a different and
> better-named reason than the one below.

All 7 remaining boxes are in **Cross-cutting — must not regress**. No section
agent claimed any of them, and this pass will not tick a box nobody proved.

- **All 137 `cmd_*` commands** — not claimed. The command tables live in
  `about3Pane.js` / `mailCommon.js` / `mailContext.js`, untouched, so they very
  probably hold; "probably" is not evidence and nobody enumerated them.
- **Keyboard navigation / tabindex** — partially evidenced only. The folder pane
  proved its `row-reverse` 3/2/1 exception survives and that no `:focus-visible`
  is suppressed anywhere; nobody walked the full tab order, and the audit's
  warning that the design explodes the tab-stop count is unaddressed.
- **Accessibility** — blocked outright by the `--m3-font-scale` finding above.
  Also still carrying the pre-existing `aria-hidden="hidden"` invalid-token bug
  (11 occurrences) recorded earlier in this file.
- **Localization** — no new user-visible strings were added by any of the six
  sheets, which is necessary but not sufficient. The RTL padding bug above is an
  active l10n defect, and the message-pane empty state still has no Fluent id.
- **Theming** — unchanged from the previous entry. `m3-chrome.css` scopes itself
  to `:root:not([lwtheme])`, so lightweight themes bypass it; the four seeds,
  `forced-colors` and folder colours are unverified in a running build.
- **CSP** — nothing landed violates it, but this is a must-not-regress item and
  there is still no finished surface to assert it about.
- **Session/state persistence** — the individual mechanisms were each proved not
  to be styleable (mode order and compact read from DOM/XULStore; splitter sizes
  are inline custom properties that out-rank ours; quick-filter state is
  XULStore + `aria-pressed`). But the box names seven persisted things at once
  and column layout is entangled with the refused column-picker box, so it stays
  open until that one closes.

### Also landing here

`.github/workflows/lint-m3.yml` — a `Lint (Material Mail)` job running
`./mach commlint -l stylelint` over `m3-*.css` + `material-tokens.css` and
`-l eslint` over `about3Pane.xhtml`. It uses `commlint`, not `lint`, because only
`commlint` inserts `comm/tools/lint` into mozlint's `config_paths` and thereby
makes comm's `.stylelintrc.js` win over Firefox's. It has no `|| true` and no
`continue-on-error`, fails if the glob matches zero files, and carries a
self-test that lints a deliberately broken file and fails the job if stylelint
reports it clean. **It will be red on its first run** — the comment bug above is
a real `CssSyntaxError`. That is the job doing its job. Its `mach commlint`
invocation has never been executed end-to-end; the first CI run is the real test.

> **Update:** the `CssSyntaxError` it was expected to catch is now fixed (see the
> resolved blocker above), so the first run is no longer *predicted* red. It has
> still never been executed end-to-end, so the first run remains the real test.

---

**Cross-cutting audit — 37 of 38 boxes ticked, 1 refused on its own evidence**

The eight boxes nobody had claimed were each assigned to an agent, proved against
named selectors and handler line numbers, then attacked by an adversarial pass
that re-ran every grep and re-read every cited line independently. Seven held.
One did not, and is not ticked.

| Box | Verdict |
|---|---|
| Column picker / reorder / resize / apply-to-folder | ✅ ticked (previous refusal resolved) |
| All `cmd_*` commands | ✅ ticked |
| Keyboard navigation / tabindex | ✅ ticked |
| Accessibility | ✅ ticked |
| Localization | ✅ ticked |
| CSP | ✅ ticked |
| Session/state persistence | ✅ ticked |
| **Theming** | ❌ **refused — see below** |

**Running total: 37 / 38.**

#### What this pass actually proved

The strongest results are enumerations, not arguments.

- **The command count in this file was wrong.** `grep -rhoE '\bcmd_[A-Za-z0-9_]+'
  mail/base/content | sort -u` returns **167** distinct tokens, not the 137 this
  contract has claimed since line 44. Of those, **155** have a locatable DOM
  trigger; the other 12 are JS-only dispatch strings that CSS cannot reach by
  definition. Every trigger was parsed out of every `.xhtml` — 173 `menuitem`,
  117 `key`, 16 `toolbarbutton`, 6 `menu`, 3 `menupopup`, 2 `button`, carrying
  **198** distinct ids and **13** distinct classes — and cross-referenced against
  all seven sheets. Exactly two ids (`#threadPaneQuickFilterButton`,
  `#menu_threadPaneSortPopup`), three classes (all scoped under `#threadPane` or
  `#quick-filter-bar`; no bare `.button` rule exists anywhere) and one ancestor
  (`#threadPaneDisplayContext`) match. The adversarial pass found one trigger the
  section agent missed — `mailContext.inc.xhtml:345`'s `observes="cmd_print"` —
  so the reachable surface is **5** commands, not 4. The other 162 are out of
  reach because `aboutMessage.xhtml`, `messageWindow.xhtml`, `SearchDialog.xhtml`,
  `viewSource.xhtml`, `customizeToolbar.xhtml`, `commonDialog.xhtml` and
  `glodaFacetViewWrapper.xhtml` link no M3 sheet at all, and `messenger.xhtml`'s
  only M3 sheet reaches the menubar's 120 bindings through a `background-color`
  and one *inherited* `color`.
- **Property census across all seven sheets**, re-run independently: `content:` —
  7 declarations, of which **zero** carry a non-empty quoted string (so no CSS
  can invent a user-visible string, which is the whole localization box);
  `display: none` — 3, all either a decorative tab underline or a verbatim
  restatement of upstream's own hiding; `pointer-events: none` — 1, on a
  `::before`; `visibility` — 0; `contain` — 0; `outline: none|0` — 0; `@import`,
  `@font-face`, remote URL — 0. Only two `url()` tokens exist and both are
  `chrome://messenger/skin/icons/*.svg`, which the CSP's `img-src chrome:`
  covers. No hex colour literal survives outside `material-tokens.css`.
- **The markup is inert.** `about3Pane.xhtml` is `+23/-0` and `messenger.xhtml`
  is `+9/-0` against `main` — every added line a `<link rel="stylesheet">` or an
  XML comment, **zero** deleted lines, **zero** `style=` attributes. That single
  diffstat discharges most of the accessibility and localization boxes outright:
  all 18 `tabindex` attributes, `role="tree"` (:112), `aria-multiselectable`
  (:115), `role="region" aria-live="off"` (:152-154), all 11 `aria-hidden`, all
  six `rel="localization"` links and the internal DTD subset are byte-identical.
  The runtime ARIA layer (`tree-view.mjs`, `tree-listbox-mixin.mjs`, the row
  modules) does not appear in the diffstat at all.
- **Persistence rides on inline styles we cannot out-rank.** Splitter sizes land
  as custom properties on `<body id="paneLayout">` (`pane-splitter.js:880`);
  column widths land on the `th` twice over (`tree-view.mjs:2190`, `:2865`).
  Inline beats any stylesheet by origin, so the M3 defaults are defaults only.
  `.collapsed-by-splitter` appears in the M3 set **only in comments** — zero
  rules.

#### Regressions found and fixed by this pass

Four more real defects, on top of the six above.

7. **`material-tokens.css` — the font-size accessibility control was severed.**
   The blocker recorded above, now fixed at the token: one declaration changed
   from `calc(14px * …)` to `calc(1rem * …)`. Five surfaces — folder pane, quick
   filter bar, thread-pane header, column headers, every menuitem — were pinned
   at 14px while the `rem`-based card rows still scaled, so raising the UI font
   size grew the messages and not the chrome.
8. **`m3-thread-pane.css` — the column picker's own override was dead.** The
   CSS-Nesting specificity trap this file warned about, caught in the act:
   `.menupopup-column-picker > :is(menu, menuitem)` at (0,1,1) could never beat
   the nested `& > :is(menu, menuitem)` at (1,0,1). Every picker item rendered at
   the full 48px, so a 23-row popup stood ~1130px tall and scrolled on any
   display under ~1200px — precisely the failure its own comment claimed to
   prevent. Rerouted through inherited custom properties; popup now ~780px.
9. **`m3-thread-pane.css` — the in-row keyboard cursor was invisible.**
   `tree-listbox.css:551` paints `td.current-cell` with a dashed
   `--selected-item-text-color`, i.e. white, which was legible on upstream's
   accent-filled selected row. Retinting selected rows to
   `--m3-secondary-container` (`#e8def8`) dropped that to ~1.15:1. Because
   arrow-keying *selects* the row it lands on, the selected state is the normal
   state — so `ArrowLeft`/`ArrowRight` cell navigation had **no** visible
   indicator at all. Fixed with a colour-only `outline-color` override, guarded
   `@media not (forced-colors)`.
10. **`m3-thread-pane.css` — the premature `*/`.** Fixed here, by the ratify
    pass, after three agents reported it and none owned it. See above.

#### Still unticked — one box, one honest reason

- **Theming.** Five of its six claims are proven with named evidence: light/dark
  switches correctly (both built-in themes are `inApp: true` in
  `BuiltInThemeConfig.sys.mjs`, so they set `color_scheme` without setting
  `lwtheme`, and `material-tokens.css` keys its dark branch off
  `prefers-color-scheme` — the same signal `about3Pane.css:21-25` already uses in
  that document); all 12 seed × theme blocks resolve, specificity-checked against
  every competing selector; `colors.css` is untouched at `:root` (the only four
  `--color-*` declarations are element-scoped to `conversation-view`); the
  `lightweightthemes="true"` feeds are written inline on `documentElement` by
  `ThemeVariableMap.sys.mjs` and no M3 sheet redeclares any of them; folder
  colours survive because `m3-folder-pane.css:356` declares only three *size*
  properties on `#folderTree .icon`, leaving `content`,
  `-moz-context-properties`, `fill`, `stroke` and the inline `--icon-color` in
  force. **The sixth claim fails.** An installed third-party lightweight theme is
  visibly overridden across the 3-pane content: `m3-layout.css:81-82`
  `#folderPane { background-color: var(--m3-surface) }` ties `about3Pane.css:128`
  `var(--sidebar-background)` at (1,0,0) and wins on source order, and the same
  holds for the header bar, thread pane, message pane and gutter. `m3-chrome.css`
  guards its equivalents with `:root:not([lwtheme])` **eight** times (lines 71,
  120, 276, 352, 407, 462, 512, 536); the five content sheets guard nothing. So
  the chrome stands down for a user's theme and the content does not. The
  attribute and its variables still function — the palette simply stops at the
  `<browser>` boundary. Fixing it means guarding every colour-bearing rule in
  five sheets, which is a re-architecture of the skin, not a minimum regression
  fix. **Reported, not attempted, not ticked.**

#### What a tick still does not mean

Unchanged from the previous entry and worth repeating, because eleven fixes have
not moved it: **nothing on this branch has been built or launched.** Every proof
above is static — selector, specificity, cascade and source reading against the
JS that consumes it. Open item 1 stands. Specifically still open: the audit's F6
screen-reader gate cannot be closed statically, because
`_setRowAriaAttributes` short-circuits unless `Services.appinfo.accessibilityEnabled`;
and `about3Pane.js` was verified **unmodified** by `git status --porcelain`
throughout, which is what makes "features survive by construction" true rather
than hopeful.

---

**Lightweight-theme guard pass — the five content sheets — still 37 / 38, Theming still refused**

The single refusal above named one cause: `m3-chrome.css` guards its colour-bearing
rules with `:root:not([lwtheme])` **eight** times (lines 71, 120, 276, 352, 407,
462, 512, 536) and the five content sheets guarded **nothing**, so an installed
third-party lightweight theme painted the chrome and was overridden across the
3-pane content. Five agents applied that guard, one sheet each; an adversarial
pass then re-derived every specificity pair.

**The under-guarding is fixed. The box is still not ticked, because fixing it
introduced three over-guarding regressions of a new shape.**

| Sheet | Rules guarded | Rules split | Guard occurrences |
|---|---:|---:|---:|
| `m3-layout.css` | 7 | 7 | 10 |
| `m3-folder-pane.css` | 52 | 17 | 60 |
| `m3-thread-pane.css` | 18 | 15 | 23 |
| `m3-quick-filter.css` | 21 | 16 | 22 |
| `m3-message-pane.css` | 2 | 0 | 4 |
| **Total** | **100** | **55** | **119** |

Rule counts include rules guarded by inheritance from a guarded nesting parent;
the occurrence column is the literal count of the guard string and is the number
that was checked mechanically. Where a rule mixed both kinds, the layout half
stays unguarded and the colour half follows immediately after it, so source order
relative to neighbours is unchanged.

#### Verified mechanically by the ratify pass, not taken on report

- Braces balance with comments stripped in all five: **20/20, 98/98, 152/152,
  74/74, 9/9**. Final depth 0, never negative.
- All **119** guards spell the selector identically as `:root:not([lwtheme])`.
  Zero malformed variants — no `:root[lwtheme]`, no `:not(lwtheme)`, no dropped
  bracket.
- **Zero** positive-`[lwtheme]` selectors survive in any content sheet. The three
  greps that hit are comment prose (`m3-thread-pane.css:251`,
  `m3-quick-filter.css:125`, `m3-message-pane.css:205`), confirmed by re-running
  comment-stripped.
- `git status --porcelain` lists exactly the five assigned sheets. `about3Pane.js`,
  `about3Pane.xhtml`, `about3Pane.css`, `jar.inc.mn`, `material-tokens.css` and
  `m3-chrome.css` are all **unmodified**.

#### What was deliberately left unguarded, and why

The exemption list is the same in every sheet and was audited for over-reach:
every `:focus-visible` outline and the two keyboard-cursor rings that are not
literally `:focus-visible` (`tr.card-layout.current`, `tr.table-layout.current`) —
accessibility must never depend on which theme is installed; icon `fill`/`stroke`
and `-moz-context-properties`, including the folder-colour `--icon-color` path,
which `folder-tree-row.mjs:259` writes inline; `background-image` that carries an
icon glyph rather than a surface; `content:`; `border-width`/`border-style`/
`border-radius`, kept outside the guard in all three shorthand decompositions so a
theme cannot un-round a pane card or collapse the splitter's grow indicator;
`border: 1px solid transparent`, which is the absence of paint and is load-bearing
for `ThreadCard.ROW_HEIGHT`; the `opacity` family; all layout, sizing, typography
and motion; and local metric custom properties. Custom-property **definitions**
were not guarded anywhere — `material-tokens.css` was not touched, and the
`--m3-fp-*`, `--m3-tp-*`, `--m3-qfb-*` and pane-sizing locals stay unguarded
because guarding a definition only makes its guarded consumers resolve to nothing.

The one judgement call worth flagging: `m3-thread-pane.css`'s `--tree-card-*` /
`--listbox-*` / `--tree-view-*` remap **was** guarded, correctly. That block is not
a token definition — it is how the sheet paints every row, by re-pointing variables
`tree-listbox.css` and `threadCard.css` consume — so it is the same case as
`m3-chrome.css:462`'s already-guarded `--spaces-bg-color`.

#### Still refused — three over-guarding regressions, all the same shape

The guard adds (0,2,0). Every accessibility fallback that used to tie its base
rule and win on **source order** now loses on **specificity**, because the base
rule was raised and the fallback was not. A media query contributes no
specificity, so `@media (prefers-contrast)` and `@media (forced-colors)` did not
move with it.

1. **`m3-layout.css` — the high-contrast splitter hairline is now invisible.**
   `:root:not([lwtheme]) #folderPaneSplitter` (1,2,0) sets
   `border-color: transparent`; `@media (prefers-contrast)
   #folderPaneSplitter:not(.splitter-collapsed)` (1,1,0) sets
   `border-color: var(--m3-outline)`. With no theme and `prefers-contrast` on, the
   splitter takes `border-width: 1px` from the fallback and `transparent` from the
   guard — a 1px invisible border that costs 2px of content box for nothing.
   The guard rule's own comment asserts the contrast block "is the only place the
   border regains a width" and is "deliberately NOT guarded"; that reasoning is
   exactly backwards, and the comment is now false.
2. **`m3-thread-pane.css` — the whole `@media (forced-colors)` block (1077-1120)
   is out-specified by the rules it exists to undo**, across eight selector
   groups. Most degrade quietly because the UA's forced-colors adjustment
   re-forces the losing token anyway. Two do not, because a *system colour* is
   preserved in forced-colors mode and a token is not: `#threadPaneSelectedCount`
   (2,0,0) loses `SelectedItem`/`SelectedItemText` to the guarded (2,2,0) rule at
   :315, so the "N selected" pill goes indistinguishable from the header bar in
   High Contrast; and `thread-card-tags[tags]` loses `background-color: transparent`
   to a `color-mix()` that *is* forced, so the tag host paints an opaque box over
   the row.
3. **`m3-message-pane.css` — the high-contrast findbar divider is defeated.**
   `:root:not([lwtheme]) #messagePane findbar` (1,2,1) holds
   `--m3-outline-variant`; `@media (prefers-contrast) #messagePane findbar`
   (1,0,1) can no longer restore `--m3-outline`.

All three take the same one-line fix, and the precedent is already in this tree:
`m3-chrome.css:511-512` prefixes its own contrast fallback with the guard, and
`m3-folder-pane.css` did the same to its `prefers-contrast` and two of three
`forced-colors` rules for precisely this reason — reviewed and cleared, because
with the prefix each pair is equal-specificity and the fallback wins on source
order as it always did, and under `[lwtheme]` the M3 fills have already stood
down while `about3Pane.css` (contrast variables at 18-57, rules at 404-410,
419-425, 441-445) and `list-container.css` (forced-colors at 6-24, 112-115,
127-129) run their own fallbacks. The correct fix in the other three sheets is
that same prefix; the focus-ring groups must stay unprefixed, since the rings
they override are themselves unguarded.

**Not fixed in that pass by design.** The ratify agent grades, it does not
re-cut the work it is grading. Recorded above as the whole of what remained
between this branch and 38/38.

#### Resolved — the three over-guards are fixed, Theming is ticked

All three took the one-line fix the review prescribed: prefix the accessibility
fallback with the same guard as the rule it overrides, so the pair is
equal-specificity again and the fallback wins on source order exactly as it did
before the guard existed.

| Sheet | Fallback | Fix |
|---|---|---|
| `m3-layout.css` | `@media (prefers-contrast)` splitter hairline | both selectors prefixed |
| `m3-thread-pane.css` | `@media (forced-colors)` block | 12 selector lines prefixed |
| `m3-message-pane.css` | `@media (prefers-contrast)` findbar divider | prefixed |

**Deliberately still unprefixed**, and verified so:

- The `forced-colors` **focus-ring group** in `m3-thread-pane.css` (`:focus-visible`
  and `tr.current > td > .card-container`). The rings it overrides are themselves
  unguarded, so it already out-ranks them, and a high-contrast focus ring must
  never depend on whether a theme is installed.
- `m3-folder-pane.css`'s six `forced-colors` focus selectors, for the same reason,
  and its `prefers-contrast` `--icon-color: currentColor !important` rule —
  `!important` needs no specificity help.
- `m3-thread-pane.css`'s `@media (prefers-contrast)` block (selected card border,
  selected row outline). Checked and left alone deliberately: both use
  `currentColor`, no guarded rule sets those properties on those selectors, and
  prefixing them would *remove* a high-contrast affordance whenever a theme is
  installed — over-guarding of exactly the shape this section is about.
- `material-tokens.css` carries **zero** guards. Custom-property *definitions* are
  not colour application; guarding them would break every consumer.

Verified mechanically: all seven M3 sheets balance braces, contain no remote URL,
no `@import` and no `@font-face`, and the guard counts are
layout 15 · folder-pane 61 · thread-pane 42 · quick-filter 25 · message-pane 10 ·
chrome 11 · tokens 0.

**Running total: 38 / 38.**

> [!WARNING]
> **A complete contract is not a working application.** Every proof on this branch
> is *static* — selector, specificity, cascade and source reading against the JS
> that consumes it. **Nothing here has been built or launched.** The installer CI
> is green and ships a real 85,207,651-byte artifact, but nobody has run it and
> clicked through the 3-pane. Open item 1 stands, and the audit's F6 screen-reader
> gate cannot be closed statically at all, because `_setRowAriaAttributes`
> short-circuits unless `Services.appinfo.accessibilityEnabled`.
>
> `mail/base/content/about3Pane.js` was verified **unmodified** by
> `git status --porcelain` at every ratification. That is what makes "features
> survive by construction" a claim about evidence rather than about hope.

#### One deletion, recorded because it is not a guard

`m3-thread-pane.css` **deleted** rather than guarded:

    :root[lwtheme][lwt-tree] #threadPane > #threadPaneHeaderBar.list-header-bar {
      background-color: transparent;
      color: var(--m3-on-surface);
    }

This is the only declaration loss across all five sheets; every other delta is a
guard, a split, or a `border`/`outline` shorthand decomposed into longhands. The
rationale holds — that rule applied an M3 colour *precisely when* a theme is
installed, which is this bug in miniature, and with the fill above it now guarded
there is no M3 surface left for it to protect — but it is a deletion, outside the
letter of the brief, and is flagged here rather than buried.

#### Running total: **37 / 38**, unchanged

Theming stays unticked. Its sixth claim moved from "no guard at all" to "guarded,
but the guard defeats three accessibility fallbacks", which is progress on the
same box and not a tick. The other five claims are unaffected and still hold.

And the standing caveat has not moved a millimetre, eleven fixes and one guard
pass later: **nothing on this branch has been built or launched.** Every proof
here is static — selector, specificity, cascade and source reading. Open item 1
stands. A green contract would not be a substitute for running the application,
and this contract is not even green.

## Verification

A rewrite is not "done" until every box above is ticked. Minimum gates:
- `./mach lint` clean on all touched files
- `./mach test mail/base/test/browser/browser_*3pane*` and the folder-tree / thread-tree suites pass
- Manual pass over each of the three layouts in both light and dark themes
