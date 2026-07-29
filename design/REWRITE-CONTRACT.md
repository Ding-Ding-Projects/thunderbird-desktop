# 3-Pane rewrite — feature parity contract

**Mandate:** full ground-up rewrite of the 3-pane UI to the "Material Mail" design. No stock
Thunderbird markup carried over. **Every feature below must survive.**

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

## Verification

A rewrite is not "done" until every box above is ticked. Minimum gates:
- `./mach lint` clean on all touched files
- `./mach test mail/base/test/browser/browser_*3pane*` and the folder-tree / thread-tree suites pass
- Manual pass over each of the three layouts in both light and dark themes
