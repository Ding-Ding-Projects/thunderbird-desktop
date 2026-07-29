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
- [ ] Six folder modes: **all, smart (unified), unread, favorite, recent, tags** — independently
      toggleable, multiple active at once, reorderable (move up/down)
- [ ] Compact mode per-mode (`canModeBeCompact`)
- [ ] Toggles: total count badge, folder size, full path, hide local folders
- [ ] Unread-count and total-count badges; new-mail indicator; folder colors; account indicator
- [ ] Header bar with Get Messages / Write / More buttons, each independently hideable; header itself hideable
- [ ] Server ordering + user custom sort order (`insertFolder`, `clearUserSortOrder`, `setSortOrderOnNewFolder`)
- [ ] Gmail folder special-casing (`_isGmailFolder`, `_getNonGmailParent`)
- [ ] Quota status indicator (`_updateStatusQuota`)
- [ ] Multi-select (`aria-multiselectable`), swap selection
- [ ] Middle-click → open in new tab
- [ ] Full drag-and-drop: folder reorder, message drop onto folder, auto-expand on hover with
      timer, collapse of auto-expanded rows, drop indicator positioning
- [ ] Context menu — 25+ items: get messages, pause updates (all/one), open new tab/window, search,
      subscribe/unsubscribe, new/remove/rename, move-to & copy-to folder pickers (with recent/
      favorites/last), compact (one/all), mark folder read, mark newsgroup read, empty trash,
      empty spam, send unsent, favorite toggle, properties, mark all folders read, settings,
      filters, manage tags, reset sort

### Thread pane
- [ ] **Two view modes: table and cards** — switchable, persisted
- [ ] All 20 columns: select, thread, flagged, attachment, subject, unread, sender, recipient,
      correspondent, junk status, date, received, status, size, tags, account, priority, unread
      count, total count, location, id, delete
- [ ] Column picker; reorder; resize; **apply columns to folder / folder+children**
- [ ] Sort by 15 fields (date, received, flagged, id, priority, author, recipient, correspondent,
      size, status, subject, unread, tags, junk status, attachments) × ascending/descending
- [ ] Grouping: **threaded / unthreaded / grouped-by-sort**; apply view to folder(+children)
- [ ] Inline row buttons: thread twisty, flag/star, unread toggle, spam, delete, restore
- [ ] Cards view: read status, sender, replied/forwarded/redirected state icons, date, kebab menu,
      reply count + twisty, subject, attachment icon, tags, spam, star
- [ ] Header bar: folder name, message count, selected count, quick-filter toggle, display menu; hideable
- [ ] Placeholders: no-messages, multiple-folders
- [ ] Notification box
- [ ] Virtualized scrolling for large folders (tree-view.mjs)
- [ ] Select-all, select-thread, select-flagged; collapse/expand all threads

### Quick filter bar
- [ ] All filter buttons + text search across sender/recipients/subject/body
- [ ] Sticky filter persistence; per-folder retention
- [ ] Gloda upsell tooltip

### Message pane
- [ ] Single message, multi-message summary, web browser, account central browser, conversation view
- [ ] Message pane show/hide; splitter collapse

### Layout
- [ ] Three layouts: **classic, vertical, wide** (`cmd_viewClassicMailLayout` / `Vertical` / `Wide`)
- [ ] Splitters: drag resize, collapse at threshold, resize-with-window, layout-dependent lock targets

### Cross-cutting — must not regress
- [ ] **All 137 `cmd_*` commands** remain wired and correctly enabled/disabled
- [ ] **Keyboard navigation** throughout; correct tabindex order (note the deliberate reverse
      tabindex in the folder pane header for `row-reverse`)
- [ ] **Accessibility**: `role="tree"`, `aria-multiselectable`, `aria-live` regions, `aria-hidden`
      on decorative buttons, screen-reader labels on every control
- [ ] **Localization**: every string via Fluent (`data-l10n-id`) or DTD entity — no hardcoded text.
      Existing `.ftl` files: about3Pane, treeView, messenger, calendar, textActions, findbar
- [ ] **Theming**: light/dark, `lightweightthemes="true"`, `colors.css` variables, folder colors
- [ ] **CSP**: the existing `Content-Security-Policy` meta must remain satisfiable.
      ⚠️ The design loads Google Fonts from `fonts.googleapis.com` / `fonts.gstatic.com` — this is
      **blocked by CSP and unacceptable in Thunderbird** (remote fetch at startup, privacy leak).
      Fonts must be vendored locally or swapped for system fonts.
- [ ] Session/state persistence: active modes, compact, column layout, sort, view mode, splitter
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

## Verification

A rewrite is not "done" until every box above is ticked. Minimum gates:
- `./mach lint` clean on all touched files
- `./mach test mail/base/test/browser/browser_*3pane*` and the folder-tree / thread-tree suites pass
- Manual pass over each of the three layouts in both light and dark themes
