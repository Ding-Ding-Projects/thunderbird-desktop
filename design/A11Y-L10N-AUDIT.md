# Accessibility & localization audit — 3-pane rewrite

**Status:** pre-rewrite baseline. This file is the checklist the Material Mail rewrite is graded
against for a11y and l10n. It is a companion to `REWRITE-CONTRACT.md` (feature parity) — that file
says *what must still work*, this one says *what must still be perceivable, operable and
translatable*.

**Rule of thumb for this document:** every ARIA attribute listed below is load-bearing until proven
otherwise. Dropping one is a regression even if the UI "looks fine", because the failure mode is
invisible to a sighted developer — a screen-reader user simply stops being told something.

**Sources audited**

| File | Why it matters here |
|---|---|
| `mail/base/content/about3Pane.xhtml` (773 lines) | the markup being replaced; static roles/aria/tabindex/l10n |
| `mail/base/content/quickFilterBar.inc.xhtml` (130) | `#include`d into the body — part of the same document |
| `mail/base/content/mailContext.inc.xhtml` (350) | `#include`d into the popupset |
| `mail/base/content/templates/messagePaneTemplate.inc.xhtml` (26) | `#include`d |
| `mail/base/content/templates/conversationViewTemplate.inc.xhtml` (34) | `#include`d; owns `role="list"`/`listitem` |
| `mail/base/content/widgets/search-bar.inc.xhtml` | shadow template for `<search-bar>` |
| `mail/base/content/widgets/tree-view.mjs` (3,138) | applies most thread-pane ARIA **at runtime** |
| `mail/base/content/widgets/listbox/tree-listbox-mixin.mjs` | applies folder-tree ARIA **at runtime** |
| `mail/base/content/widgets/folder-tree-row.mjs` | composes the folder row `aria-label` |
| `mail/base/content/widgets/treeview/thread-row.mjs`, `thread-card.mjs` | compose the message row `aria-label` |
| `mail/base/content/modules/ThreadPaneColumns.mjs` | the 4-way l10n id table per column |
| `mail/base/content/about3Pane.js` (7,115) | `aria-sort`, `aria-pressed`, dynamic Fluent |
| `design/Material Mail.dc.html`, `design/app-data.js` | the visual spec + its bilingual string model |

---

## Part A — Accessibility inventory (static markup)

### A1. Document level

| Line | Affordance | Notes |
|---|---|---|
| 16 | `<title id="about3PaneTitle">` | empty in markup; filled at runtime. Doubles as an l10n target (see D4) and as the `aria-labelledby` target for the thread tree (see B2). **This id is referenced from three places — do not rename it.** |
| 12–14 | `<html … lightweightthemes="true">` | theme plumbing, not a11y, but the `xmlns:xul` declaration is what lets `<xul:menu>` / `<xul:browser>` exist in this document at all. |
| 6 | `#filter substitution` | the file is preprocessed. Lines beginning `#` are **preprocessor comments, not XML comments** — including the reverse-tabindex note at lines 71–72. If the rewrite converts them to `<!-- -->` the meaning survives; if it deletes them the rationale is lost. |
| 20 | CSP `<meta>` | `style-src about: 'unsafe-inline'` — note this permits inline `<style>`/style attrs *today*, but the project rule is still **no `style=` attributes** in proposed markup. Do not use the CSP as a licence. |

### A2. Folder pane

| Line | Element | Affordance |
|---|---|---|
| 68 | `#folderPane` | `tabindex="-1"` — programmatically focusable container, **not** in the tab order. Needed so focus can be moved to the pane by command without inserting a tab stop. |
| 70 | `#folderPaneHeaderBar` | `hidden="hidden"` default; toggled by `folderPane.toggleHeader()`. |
| 73–77 | `#folderPaneMoreButton` | `data-l10n-id="folder-pane-more-menu-button"`, **`tabindex="3"`** |
| 78–83 | `#folderPaneWriteMessage` | `data-l10n-id="folder-pane-write-message-button"`, **`tabindex="2"`**, `disabled` |
| 84–89 | `#folderPaneGetMessages` | `data-l10n-id="folder-pane-get-messages-button"`, **`tabindex="1"`**, `disabled` |
| 91–95 | `#folderTree` | `is="tree-listbox"`, **`role="tree"`**, **`aria-multiselectable="true"`** |
| 96–107 | `#modeTemplate` | `li.unselectable`; mode button `data-l10n-id="folder-pane-mode-context-button"` + `tabindex="-1"` |
| 108–124 | `#folderTemplate` | three decorative `<img>` with **`alt=""`** (twisty-icon, new-icon, icon); `span.name` `tabindex="-1"`; status-icon button `hidden` |

**The reverse tabindex — read this before touching the header bar.**
`#folderPaneHeaderBar` is laid out `flex-direction: row-reverse` so the More button pins to the
inline-end edge. Because DOM order is therefore the *visual reverse*, the three buttons carry
explicit positive tabindexes 3 / 2 / 1 in DOM order so that keyboard order matches **visual**
left-to-right order (Get Messages → Write → More). This is a deliberate, documented exception to the
"never use positive tabindex" rule.

Two consequences the rewrite must respect:

1. Positive tabindexes are **document-global**. `1`, `2`, `3` here jump ahead of every `tabindex="0"`
   element in the whole 3-pane document. That is the current, shipped behaviour. If the rewrite
   changes the header to normal `row` order and drops the positive values, keyboard order changes
   globally — that is arguably an improvement, but it is a **behaviour change that must be called
   out explicitly, not slipped in**.
2. If `row-reverse` is kept, the positive tabindexes must be kept. Keeping `row-reverse` and
   dropping them silently reverses the header's keyboard order — a real regression, and one that no
   visual diff will catch.

**Preferred outcome:** the Material design's header does not need `row-reverse`. If the rewrite lays
the header out in natural DOM order and pins the More button with `margin-inline-start: auto`, all
three positive tabindexes can go away and the buttons become plain tab stops. Do this *deliberately*
and note it in the contract — do not leave `row-reverse` plus natural tabindex.

### A3. Thread pane

| Line | Element | Affordance |
|---|---|---|
| 132–134 | `.list-header-bar-container-start` | **`role="region"` + `aria-live="off"`** |
| 135 | `#threadPaneFolderName` | `<h2>` — a real heading, and the `aria-labelledby` target of the thread tree |
| 137–142 | `#threadPaneFolderCount`, `#threadPaneSelectedCount` | `hidden="hidden"`; filled by Fluent at runtime |
| 146–151 | `#threadPaneQuickFilterButton` | `data-l10n-id="quick-filter-button"` (`.title`) + inner `<span data-l10n-id="quick-filter-button-label">`. `aria-pressed` is added **at runtime** (about3Pane.js:4268) |
| 152–156 | `#threadPaneDisplayButton` | `data-l10n-id="thread-pane-header-display-button"` |
| 160 | `<tree-view id="threadTree" data-label-id="threadPaneFolderName">` | **`data-label-id` is how the tbody gets `aria-labelledby`** (tree-view.mjs:2917–2920). Drop this attribute and the message list becomes an unlabelled grid. |
| 161–168 | `slot[name=placeholders]` | both placeholders are Fluent-backed and `hidden` by default |

**`aria-live="off"` is intentional and must survive verbatim.** The folder-name / message-count /
selected-count region updates on every selection change and every count refresh. Declaring the
region and then explicitly muting it means assistive tech can navigate *to* it on demand without
being spammed on every arrow-key press. "Upgrading" it to `polite` is the single easiest way to make
this rewrite unusable with a screen reader — every keystroke in a 5,000-message folder would queue
an announcement. If the Material design wants a live count, it must be a **separate**, throttled
`aria-live="polite"` node, and the existing region must stay `off`.

### A4. Row templates (`#threadPaneRowTemplate`, `#threadPaneCardTemplate`)

Table row template (215–296), 22 `<td>` in fixed order, kept in sync with `ThreadPaneColumns.mjs`:

- Six inline buttons (`tree-button-thread`, `-flag`, `-unread`, `-spam`, `-delete`, `-restore`, plus
  the subject twisty) each carry **`aria-hidden="hidden"` + `tabindex="-1"`**.
- `.subject-line` carries `tabindex="-1"`.
- Every decorative `<img>` inside a button carries **`alt=""`**.
- The attachment `<img>` (235) is the exception — it is *informative* and carries
  `data-l10n-id="tree-list-view-row-attach"` (which supplies `.alt` and `.title`).
- Delete / restore buttons carry both `aria-hidden` **and** `data-l10n-id`
  (`tree-list-view-row-delete` / `-restore`) — the l10n supplies the `.title` tooltip for mouse users
  while ARIA hides them from the a11y tree.

Card template (297–348):

- `img.read-status` `alt=""`; three state icons (`replied`, `forwarded`, `redirected`) Fluent-backed
  via `threadpane-message-*`.
- Kebab button: `aria-hidden="hidden"` + `tabindex="-1"` + `data-l10n-id="threadpane-card-menu-button"`.
- Twisty, spam and star buttons: `aria-hidden="hidden"` + `tabindex="-1"`; spam additionally
  `data-l10n-id="tree-list-view-row-spam"`.
- `<thread-card-tags>` custom element.

**The `aria-hidden` + `tabindex="-1"` pairing is the core pattern of the message list and must be
reproduced exactly.** The rationale: the row itself carries a single composed `aria-label` describing
sender + date + subject + tags + flags (built in `thread-row.mjs` / `thread-card.mjs`, see B3). The
per-row buttons are *redundant duplicates* of information already in that label. Exposing them would
make every message announce six extra buttons — a ~7× increase in verbosity on a list that can hold
tens of thousands of rows. Any new decorative or duplicative control the Material design adds to a
row (avatar, chip, hover action, snooze button, …) **must** get the same treatment.

> ⚠️ **Latent bug — fix it deliberately, don't copy it blind.** All 11 occurrences are written
> `aria-hidden="hidden"`. Per ARIA, `aria-hidden` is a true/false attribute; `"hidden"` is not a
> valid token and formally maps to *undefined* (i.e. "not hidden"), so these buttons may be exposed
> today on some AT stacks despite the author's clear intent. The rewrite should emit
> **`aria-hidden="true"`**. Flag this as an intentional fix in the contract, and re-verify row
> verbosity with a screen reader afterwards — it is a real behaviour change, in the right direction.

### A5. Quick filter bar (`quickFilterBar.inc.xhtml`)

| Element | Affordance |
|---|---|
| `#qfb-sticky` | `is="toggle-button"` → `aria-pressed` managed by `quickFilterBar.js:28–39` |
| `#qfb-qs-textbox` | `<search-bar>` with **`aria-keyshortcuts="Control+Shift+K"`**, `data-l10n-id` + `data-l10n-attrs="label"` |
| placeholder `<span slot="placeholder">` | `quick-filter-bar-search-placeholder-with-key` — contains `<kbd>` markup **inside the Fluent value** |
| `.roving-group.button-group` ×2 | roving-tabindex groups; JS sets first child `tabIndex=0`, rest `-1`, arrow keys move focus (`quickFilterBar.js:138–187`) |
| 5 filter buttons + 4 text-scope buttons | all `is="toggle-button"` → `aria-pressed` |
| `#qfb-searching-throbber` | `alt=""` + `data-l10n-id="quick-filter-bar-searching"` (`.title` only) |
| `#qfb-results-label` | plain span, filled at runtime |
| search-bar shadow template | inner `<div aria-hidden="hidden">` wrapping the placeholder slot (same invalid-token issue as A4) |

**Two roving-tabindex groups must survive.** They are the reason the filter bar is one tab stop
rather than nine. Material chip rows are a natural fit — but a naive `<button>` row with default
tabindex turns one stop into nine.

### A6. Message pane / conversation view

`conversationViewTemplate.inc.xhtml` owns real ARIA that is easy to lose:

- `#mainConversation` → **`role="list"`**
- message template `<article role="listitem" aria-expanded="false">`
- browser-backed message template `<article role="listitem" aria-expanded="true">`
- `<time datetime="">` — machine-readable timestamp, distinct from the human-readable text
- `<h1 class="title">` in the conversation header

`messagePaneTemplate.inc.xhtml` contributes no ARIA but does contribute `autocompletepopup="PopupAutoComplete"`, which is why the `<panel … role="group">` at line 771–774 exists.

### A7. Popupset

- `#folderPaneContext` — 25 items (labels/accesskeys, see D3)
- `#folderPaneMoreContext`, `#folderPaneModeContext`, `#threadPaneDisplayContext`,
  `#folderPaneGetMessagesContext`, `#quickFilterButtonsContext` — all
  `class="no-accel-menupopup"`, `position="bottomleft topleft"`
- `#qfb-text-search-upsell` `<tooltip>` — line 1 Fluent, line 2 filled at runtime with the user's text
- `#PopupAutoComplete` — `role="group"`, `noautofocus="noautofocus"`

XUL `<menupopup>`/`<menuitem>` map to platform menu accessibles for free. **If the Material design
replaces any of these with HTML popovers, the rewrite must hand-implement `role="menu"` /
`role="menuitem"` / `role="menuitemcheckbox"` / `role="menuitemradio"`, `aria-checked`,
`aria-haspopup`, focus trapping, type-ahead, Escape-to-close and accesskey handling.** The design
does exactly this (`role="menu"` + `role="menuitem"` only — no checked state, no radio semantics, no
`aria-haspopup`) and is therefore **not** a sufficient spec here. The safest path by far is to keep
the XUL popups and restyle them.

---

## Part B — Accessibility applied at runtime (the invisible half)

Roughly two-thirds of the a11y surface never appears in `about3Pane.xhtml`. A rewrite that only reads
the markup will silently delete all of it.

### B1. Folder tree — `tree-listbox-mixin.mjs`

| Line | Behaviour |
|---|---|
| 123–135 | reads `role` off the host (`tree` or `listbox`, anything else throws), sets `is="tree-listbox"`, `tabIndex = 0` |
| 114 | `aria-multiselectable` read back from the attribute |
| 341, 683, 700 | maintains **`aria-activedescendant`** on the container, pointing at the focused row's `id` |
| 475 | every descendant row gets `role="treeitem"` (or `option`) |
| 482–490 | `aria-expanded` set on rows with children, removed on leaves |
| 492, 679, 696 | `aria-selected` maintained per row |
| 497 | nested `<ul>` gets **`role="group"`** |
| 766, 788 | `aria-expanded` flipped on collapse/expand |
| 192 | comment: *"Overflowing elements with tabindex=-1 steal focus. Grab it back."* — a real, previously-fixed focus bug |

**Focus model:** the folder tree is a **single tab stop** (`tabIndex=0` on the `<ul>`) driving
`aria-activedescendant`. Rows are **not** individually focusable. A Material rewrite that makes each
folder row a real `<button>` (as the design does) converts one tab stop into N and breaks the
`aria-activedescendant` contract entirely.

### B2. Thread tree — `tree-view.mjs`

| Line | Behaviour |
|---|---|
| 2912–2920 | tbody: `tabIndex=0`, **`role="treegrid"`**, **`aria-multiselectable="true"`**, `aria-labelledby` from `data-label-id` |
| 2277 | thead `<tr>`: **`role="toolbar"`** — "Roving tabindex is used" |
| 2638–2646 | `updateRovingTab()` — first visible header button `tabIndex=0`, rest `-1` |
| 2653–2689 | Arrow-Left/Right roving, **RTL-aware** (`document.dir == "rtl"` flips the direction) |
| 2747 | column-picker button `tabIndex=-1`, Fluent `tree-list-view-column-picker` |
| 2766–2773 | per column: `l10n.a11y` → the `<th>`, `l10n.header` → the button |
| 3011–3017 | each row: `role="row"` (treegrid) or `"option"` (listbox), `id = "<listId>-row<N>"` |
| 3025–3027 | `aria-expanded` on thread containers only |
| 3041–3043 | each visible cell: `role="gridcell"` |
| 3061–3066 | select checkbox `<img>` Fluent-swapped `tree-list-view-row-select` ⇄ `-deselect` |
| 3088–3092 | `aria-selected` mirrored onto the row **and every `<td>`** |
| 1109–1156 | `_setRowAriaAttributes()` — `aria-rowindex`, **`aria-level`**, **`aria-setsize`**, **`aria-posinset`** |
| 423, 442, 1729, 1769–1782 | **`ariaActiveDescendantElement`** on the tbody |
| 1969 | select-all header button `aria-checked` |
| 2065, 2076 | top/bottom virtualization spacers `ariaHidden = "true"` |
| 5807–5814 (about3Pane.js) | **`aria-sort`** = `ascending`/`descending`, exactly one header at a time |
| 4268 (about3Pane.js) | `#threadPaneQuickFilterButton` `aria-pressed` |

Two things here are easy to miss and expensive to lose:

- **`aria-level` / `aria-setsize` / `aria-posinset`** are what make a *threaded* message list
  navigable ("level 3, 2 of 7"). Without them a threaded view is an undifferentiated flat list. Note
  the computation is skipped only when `Services.appinfo.accessibilityEnabled` AND `Cu.isInAutomation` are both false (`tree-view.mjs:1110`) — i.e. **you
  will not notice it is broken unless you test with a screen reader actually running.**
- **Virtualization spacers must stay `aria-hidden="true"`.** They are the empty `<tbody>` elements
  that reserve scroll height for the ~50,000 rows not currently in the DOM. Un-hidden, they appear to
  AT as enormous empty table sections.

### B3. Composed row labels

Each row/card gets **one** `aria-label` assembled from Fluent fragments:

- `folder-tree-row.mjs:548–593` — full folder name + `folder-pane-unread-aria-label` +
  `folder-pane-total-aria-label` + folder size, **debounced 50 ms** (`#ariaUpdateTimeout`) so rapid
  count churn does not thrash the a11y tree. Preserve the debounce.
- `thread-row.mjs:59–243` — sender/date/subject/tags plus `threadpane-flagged-cell-label`,
  `-spam-cell-label`, `-read-cell-label`, `-unread-cell-label`, `-attachments-cell-label`; each cell
  additionally gets `column.l10n.cell`.
- `thread-card.mjs:59–176` — same idea for cards view, plus `threadpane-replies` (a plural).

**These composed labels are the entire reason the per-row buttons can be `aria-hidden`.** If the
rewrite changes row structure it must re-derive the label, not just re-style the row.

### B4. Complete tabindex map (baseline)

| Value | Where | Purpose |
|---|---|---|
| `-1` | `#folderPane` (68) | programmatic focus target, not a tab stop |
| `1` | `#folderPaneGetMessages` (88) | reverse-order header (see A2) |
| `2` | `#folderPaneWriteMessage` (82) | reverse-order header |
| `3` | `#folderPaneMoreButton` (77) | reverse-order header |
| `-1` | mode-context button (103), `span.name` (116) | inside a single-tab-stop tree |
| `-1` | 7 row-template buttons + `.subject-line` (222–294) | aria-hidden duplicates |
| `-1` | 4 card-template buttons (315–341) | aria-hidden duplicates |
| `0` | `<ul#folderTree>` (runtime, mixin:135) | the folder tree's *only* tab stop |
| `0` | thread `<tbody>` (runtime, tree-view:2912) | the message list's *only* tab stop |
| `-1` | every thread row (runtime, tree-view:2959) | rows are not tab stops |
| `0`/`-1` | thread header buttons (runtime, tree-view:2638) | roving group |
| `-1` | column-picker button (runtime, tree-view:2747) | reachable via roving group only |
| `0`/`-1` | 2 quick-filter roving groups (runtime, quickFilterBar.js:138) | roving groups |

**Net tab stops across the whole 3-pane: single digits.** A naive Material rewrite where every chip,
folder row, avatar and hover action is a plain focusable `<button>` produces hundreds. That is the
single most likely keyboard regression in this project.

---

## Part C — Localization inventory

### C1. Fluent bundles linked (lines 40–45)

```
calendar/calendar.ftl
messenger/about3Pane.ftl
messenger/treeView.ftl
messenger/messenger.ftl
toolkit/global/textActions.ftl
toolkit/main-window/findbar.ftl
```

Plus `messenger/certError.ftl`, injected lazily at runtime via
`MozXULElement.insertFTLIfNeeded` (about3Pane.js:1821 area) for the TLS-error folder status icon.
**All seven must remain linked.** Removing one produces empty labels only in the code path that uses
it — often a rare error path that no smoke test hits.

### C2. `data-l10n-id` in markup

`about3Pane.xhtml`: **56 occurrences, 52 unique ids.** All 52 verified to resolve today:
41 → `about3Pane.ftl`, 7 → `messenger.ftl`, 4 → `treeView.ftl`.

<details><summary>Full list (id → backing file)</summary>

| id | file |
|---|---|
| `apply-columns-to-menu` | about3Pane.ftl |
| `apply-current-view-to-folder` | about3Pane.ftl |
| `apply-current-view-to-folder-children` | about3Pane.ftl |
| `apply-current-view-to-menu` | about3Pane.ftl |
| `folder-context-empty-spam` | messenger.ftl |
| `folder-pane-context-compact` (+`data-l10n-args='{"count":1}'`) | about3Pane.ftl |
| `folder-pane-context-compact-all` | about3Pane.ftl |
| `folder-pane-context-mark-folder-read` (+`data-l10n-args='{"count":1}'`) | about3Pane.ftl |
| `folder-pane-context-reset-sort` | about3Pane.ftl |
| `folder-pane-get-all-messages-menuitem` | about3Pane.ftl |
| `folder-pane-get-messages-button` | about3Pane.ftl |
| `folder-pane-header-context-hide` | about3Pane.ftl |
| `folder-pane-header-context-toggle-get-messages` | about3Pane.ftl |
| `folder-pane-header-context-toggle-new-message` | about3Pane.ftl |
| `folder-pane-header-folder-modes` | about3Pane.ftl |
| `folder-pane-header-hide-local-folders` | about3Pane.ftl |
| `folder-pane-header-toggle-folder-size` | about3Pane.ftl |
| `folder-pane-header-toggle-full-path` | about3Pane.ftl |
| `folder-pane-mode-context-button` | about3Pane.ftl |
| `folder-pane-mode-context-toggle-compact-mode` (×2) | about3Pane.ftl |
| `folder-pane-mode-move-down` | about3Pane.ftl |
| `folder-pane-mode-move-up` | about3Pane.ftl |
| `folder-pane-more-menu-button` | about3Pane.ftl |
| `folder-pane-show-total-toggle` | about3Pane.ftl |
| `folder-pane-write-message-button` | about3Pane.ftl |
| `menu-copy-to` | messenger.ftl |
| `menu-move-to` | messenger.ftl |
| `message-list-placeholder-multiple-folders` | about3Pane.ftl |
| `message-list-placeholder-no-messages` | about3Pane.ftl |
| `quick-filter-bar-gloda-upsell-line1` | about3Pane.ftl |
| `quick-filter-button` | about3Pane.ftl |
| `quick-filter-button-label` | about3Pane.ftl |
| `show-all-folders-label` | messenger.ftl |
| `show-favorite-folders-label` | messenger.ftl |
| `show-recent-folders-label` | messenger.ftl |
| `show-smart-folders-label` | messenger.ftl |
| `show-tags-folders-label` | messenger.ftl |
| `show-unread-folders-label` | messenger.ftl |
| `sort-by-spam-status` | messenger.ftl |
| `tags-manage` | messenger.ftl |
| `thread-pane-header-context-cards-view` | about3Pane.ftl |
| `thread-pane-header-context-hide` | about3Pane.ftl |
| `thread-pane-header-context-table-view` | about3Pane.ftl |
| `thread-pane-header-display-button` | about3Pane.ftl |
| `threadpane-card-menu-button` | about3Pane.ftl |
| `threadpane-message-forwarded` | about3Pane.ftl |
| `threadpane-message-redirected` | about3Pane.ftl |
| `threadpane-message-replied` | about3Pane.ftl |
| `tree-list-view-row-attach` (×2) | treeView.ftl |
| `tree-list-view-row-delete` | treeView.ftl |
| `tree-list-view-row-restore` | treeView.ftl |
| `tree-list-view-row-spam` | treeView.ftl |

</details>

`quickFilterBar.inc.xhtml`: 24 ids, all in `about3Pane.ftl`.
`mailContext.inc.xhtml`: 33 ids across `messenger.ftl`, `calendar.ftl`, `textActions.ftl`.

**Attribute-scoped values matter.** Several ids supply only `.title` (`quick-filter-button`,
`folder-pane-get-messages-button`, `thread-pane-header-display-button`), several only `.label`
(menuitems), several both `.alt` **and** `.title` (`tree-list-view-row-*`,
`threadpane-message-*`), and one supplies value + `.title` together
(`folder-pane-write-message-button`). Retargeting an id to a different element type silently drops
whichever attributes that element does not support — with **no console error**. Check the `.ftl`
before reusing an id.

### C3. DTD entities

`about3Pane.xhtml` references **77 entities (76 unique)**, all from
`chrome://messenger/locale/messenger.dtd` via the internal subset at lines 8–11. All 76 verified
present. `folderContextPauseUpdates.accesskey` is deliberately reused for both the "pause all" and
"pause one" items.

- **Folder pane context (36):** `folderContextGetMessages`, `folderContextPauseAllUpdates`,
  `folderContextPauseUpdates`, `folderContextOpenNewTab`, `folderContextOpenInNewWindow`,
  `folderContextSearchForMessages`, `folderContextSubscribe`, `folderContextUnsubscribe`,
  `folderContextNew`, `folderContextRemove`, `folderContextRename`,
  `folderContextMarkNewsgroupRead`, `folderContextEmptyTrash`,
  `folderContextSendUnsentMessages`, `folderContextFavoriteFolder`, `folderContextProperties2`,
  `folderContextMarkAllFoldersRead` (label only), `folderContextSettings2`, `filtersCmd2`
  — each `.label` + `.accesskey` except where noted.
- **Sort menu (40):** `sortMenu`, `sortByDateCmd`, `sortByReceivedCmd`, `sortByStarCmd`,
  `sortByOrderReceivedCmd`, `sortByPriorityCmd`, `sortByFromCmd`, `sortByRecipientCmd`,
  `sortByCorrespondentCmd`, `sortBySizeCmd`, `sortByStatusCmd`, `sortBySubjectCmd`,
  `sortByUnreadCmd`, `sortByTagsCmd`, `sortByAttachmentsCmd`, `sortAscending`, `sortDescending`,
  `sortThreaded`, `sortUnthreaded`, `groupBySort` — each `.label` + `.accesskey`.
  (`sortByJunkStatus` is the one sort item already migrated to Fluent: `sort-by-spam-status`.)

`mailContext.inc.xhtml` adds 71 more entity references from the same DTD.

**Every `.accesskey` is a localization artifact.** Localizers choose accesskeys per language so they
match a letter actually present in the translated label. Silently dropping accesskeys — very easy
when converting XUL menus to Material list items — removes keyboard menu operation in every locale.

**Do not opportunistically migrate DTD → Fluent as part of this rewrite.** It is a separate,
tracked upstream effort (there is an explicit TODO to that effect at about3Pane.xhtml:434–439 for
`folderPaneContext-markNewsgroupAllRead`). Mixing a markup rewrite with a string migration makes
both un-reviewable and orphans translations in every locale.

### C4. Runtime-formatted strings

| Site | id(s) | Notes |
|---|---|---|
| about3Pane.js:398–410 | `folder-pane-context-mark-folder-read`, `folder-pane-context-compact`, `menu-file-compact` | `{count}` plural, recomputed per menu opening; the third targets **`top.window.document`** |
| about3Pane.js:1821 | `event.detail.errorString` + `errorArgs` | dynamic id from `certError.ftl`, lazily injected |
| about3Pane.js:2236 | `folder-pane-mode-header-${modeName}` | **id built by string concatenation** — six variants, invisible to static extraction tools |
| about3Pane.js:2846 | `message-list-placeholder-multiple-folders` | applied to `<title>`; `document.title=""` first, `data-l10n-id` removed on single-select (2865). The presence/absence of `data-l10n-id` **is the state flag.** |
| about3Pane.js:3003 | `quota-panel-percent-used` | cross-document into `top.window` |
| about3Pane.js:4328, 4350 | `thread-pane-folder-message-count`, `thread-pane-folder-selected-count` | plurals |
| about3Pane.js:5830, 5933 | `apply-current-{columns,view}-to-folder[-with-children]-message` + `apply-changes-to-folder-title` | `formatValues` for confirm dialogs |
| tree-view.mjs:2319, 2353, 2745, 2767, 2770, 3061 | column menuitem / restore-default / picker / a11y / header / select-checkbox | |
| thread-row / thread-card / folder-tree-row | ~20 ids (see B3) | |
| ThreadPaneColumns.mjs | **84 ids** — 21 columns × `{a11y, header, menuitem, cell}` | see C5 |

### C5. Column l10n contract (84 ids — the largest single block)

Every column in `ThreadPaneColumns.mjs` declares four Fluent ids:

| key | applied to | by |
|---|---|---|
| `a11y` | the `<th>` (as `aria-label`) | tree-view.mjs:2767 |
| `header` | the header `<button>` (label + `.title`) | tree-view.mjs:2770 |
| `menuitem` | the column-picker `<menuitem>` | tree-view.mjs:2319 |
| `cell` | each `<td>` in every row (`aria-label` + `.title`, often with `{$title}`) | thread-row.mjs |

Columns: `select, thread, flagged, attachment, subject, unread(button), sender, recipient,
correspondent, spam, date, received, status, size, tags, account, priority, unread, total, location,
id, delete`.

The distinction between `a11y` and `header` is deliberate: the visible header may be an **icon only**
(select, thread, flagged, attachment, spam, unread-button, delete), so `header` supplies a tooltip
like *"Sort by star"* while `a11y` supplies the accessible name *"Starred"*. **Collapsing these two
into one string leaves seven columns with either no accessible name or a nonsense one** ("Sort by
star" as a column name).

Also note `.ftl` plurals that must not be flattened: `thread-pane-folder-message-count`,
`thread-pane-folder-selected-count`, `folder-pane-unread-aria-label`,
`folder-pane-total-aria-label`, `threadpane-replies`, `quick-filter-bar-results`,
`folder-pane-context-compact`, `folder-pane-context-mark-folder-read`, and the **nested**
`threadpane-sort-header-unread-count` (plural inside plural, with `<span>` markup in the value).

---

## Part D — What the design provides, and what it does not

Measured over all 140,780 bytes of `design/Material Mail.dc.html`:

| | count |
|---|---|
| `role=` | **11** (`status`×2, `menuitem`×2, `menu`×2, `dialog`×2, `tabpanel`, `tablist`, `tab`, `switch`, `option`, `listbox`, `group`) |
| `aria-*` | **19** (`aria-label`×13, `aria-selected`×2, `aria-pressed`, `aria-modal`, `aria-live`, `aria-checked`) |
| `tabindex` | **1** (`tabindex="0"` on the message list container, line 154) |
| `alt=` on decorative images | **0** — icons are `<span>` + CSS `mask`, so they are invisible to AT by construction |

Baseline Thunderbird, by contrast, applies **~30 distinct ARIA attribute kinds** across markup and
runtime, and 12 distinct tabindex assignments.

**Where the design is genuinely useful as an a11y spec:**

- Line 154: message list = `role="listbox"` + `aria-label` + `tabindex="0"` on the container, rows
  `role="option"` + `aria-selected`. Structurally the right shape (single tab stop + labelled
  container), just the wrong role for Thunderbird — TB needs **`treegrid`** for a multi-column,
  threaded, expandable list. Keep the shape, keep TB's roles.
- Line 345: `role="switch"` + `aria-checked` on toggles.
- Line 329–331: `role="group"` + `aria-label` around a segmented button set, `aria-pressed` per
  segment.
- Line 654: `aria-live="polite"` region for toasts, with `role="status"` per toast — a correct
  pattern, and a good template for any *new* live region.
- Every interactive element has a `style-focus` outline. The design takes visible focus seriously;
  port that intent to `:focus-visible` rules in `about3Pane.css`.

**Where the design is actively dangerous if followed literally:**

1. **Folder drawer has no tree semantics at all** (lines 94–113). It is an `<aside aria-label>`
   containing N plain `<button>`s. Baseline requires `role="tree"`, `aria-multiselectable="true"`,
   `role="treeitem"`, `role="group"` on nested lists, `aria-expanded`, `aria-selected`,
   `aria-activedescendant`, `aria-level` — **none present**. Following the design here deletes the
   entire accessible structure of the folder pane and multiplies tab stops by N.
2. **Message rows are flat `role="option"`.** No `aria-level` / `-setsize` / `-posinset`, no
   `aria-expanded` for threads, no `gridcell`. Threading becomes imperceptible.
3. **No column header semantics.** The design has a sort *menu*, not a sortable header row — so
   nothing maps to `role="toolbar"` + roving tabindex + `aria-sort`. All of that must be carried over
   from the existing implementation, not from the design.
4. **Menus lack checked/radio state.** `role="menu"`/`menuitem` only — no `menuitemcheckbox`,
   `menuitemradio`, `aria-checked`, or `aria-haspopup`. TB's folder-mode and sort menus are
   fundamentally checkbox/radio menus.
5. **No accesskeys anywhere.** Not one. TB has ~55 in this document alone.
6. **`title` used as the sole accessible name** on many icon buttons (theme toggle, tab-list,
   palette). `title` is unreliable as an accessible name and invisible to touch and keyboard users.
   Use `data-l10n-id` supplying `.title` **and** an accessible name.
7. **Inline `style=` everywhere** — barred by project rule regardless of CSP.
8. **Remote Google Fonts** in the `<helmet>` — already flagged in `REWRITE-CONTRACT.md`, already
   solved by `material-tokens.css`. Do not reintroduce.

---

## Part E — Bilingual strings and "funny levels" vs Fluent (honest assessment)

### What the design actually implements

`design/app-data.js` ships two string tables and `Material Mail.dc.html:790–804` resolves them:

- **`LABEL_COPY`** — 111 keys, each `{ en, zh }`. Resolution:
  `lang === "en" ? en : lang === "zh" ? zh : en + " · " + zh`.
- **`MSG_COPY`** — 17 keys, each `{ en: [5 strings], zh: [5 strings] }`, indexed by
  `funEn` / `funZh` (1–5, independent per language). Resolution:
  `lang === "both" ? en + " / " + zh : …`.

Three orthogonal prefs: `lang ∈ {en, zh, both}`, `funEn ∈ 1..5`, `funZh ∈ 1..5`.
Level 1 and level 2 are identical in all 17 entries — so the real ladder is 4 rungs, declared as 5.
Also `speak()` (line 818–828) narrates with `lang="en-US"` / `"zh-HK"`.

### How much of this maps onto Fluent

**Maps cleanly — do this:**

- **The Cantonese translations themselves.** `zh-HK` is a first-class Thunderbird locale. Every
  `LABEL_COPY[key].zh` is just the `zh-HK` translation of that key. Fluent handles this natively,
  correctly, and better than the design does (proper `lang`/`dir` propagation, plural rules,
  bidi isolation). **No new mechanism needed.**
- **The five-level tone ladder within one language.** Fluent selectors can branch on a variable:

  ```ftl
  # $level (Number) — humour level, 1 (plain) to 5 (maximum)
  mm-message-sent = { $level ->
      [5] WHOOSH 🚀 Sent. No take-backs, hope you spelled their name right.
      [4] Sent! Your words are now somebody else's inbox problem.
      [3] Sent — off it goes.
     *[other] Message sent.
  }
  ```

  This is legal Fluent and each locale can choose its own number of rungs, which is exactly right —
  humour does not translate rung-for-rung. But see the cost analysis below.
- **Per-language humour levels.** `funEn` and `funZh` are the *same pref* observed in different
  locales. One pref, `mail.ui.humour_level`, read into `$level`. Two prefs are only needed for
  bilingual mode, which is the part that does not map (below).

**Does not map — and should not be forced:**

- **`lang: "both"` (concatenating EN + Cantonese into one string).** Fluent resolves **one locale
  per bundle**. There is no supported way to ask a `Localization` for "the en-US value and the zh-HK
  value of this id, glued with `·`". You could instantiate a second `Localization` over `["zh-HK"]`
  and concatenate manually, but the result is a string containing two languages under a single
  `lang` attribute. That is a **genuine accessibility regression**: a screen reader announces the
  whole node in one voice, so Cantonese gets read with English phonemes, or vice versa. It also
  breaks `dir` inheritance, font fallback per script, and hyphenation.

  If bilingual display is genuinely wanted, the correct implementation is **two sibling elements
  with explicit `lang` attributes**, not one concatenated string:

  ```html
  <span class="mm-bilingual">
    <span lang="en" data-l10n-id="…"></span>
    <span lang="zh-HK" data-l10n-id="…"></span>
  </span>
  ```

  driven by two `Localization` instances. That is a real feature with real cost — it is **not** a
  free consequence of adopting the design.
- **Emoji embedded in string values** (🚀 🗂️ 📦 🚫 🗑️ 🙈 ⏪ ✅ 📋 💾 💥 🍃 🔍 🥟 😂 😄 😅 😆 😾 😤 🙃).
  Fluent stores them fine. The problems are downstream: screen readers announce emoji by CLDR name
  in the *UI* locale, so a Cantonese string containing 😂 may be announced with an English emoji
  name; emoji-only affirmations (`✅`, `🚫`) carrying meaning are invisible to AT unless
  accompanied by text; and they are a font-coverage risk. Text must never depend on an emoji to
  carry meaning.
- **Applying humour to error and warning text.** The design's own setting description says the
  slider *"Styles every message, errors and warnings included — the facts never change."* Level 5 of
  `regexBad` is *"That regex exploded 💥"*; of `noEditor`, *"Nope 🙃"*. For a mail client this is a
  bad idea on its own merits: error text is what users paste into support requests and what
  screen-reader users rely on to understand a failure. **Recommendation: if a humour level ships at
  all, exclude error, warning, security and destructive-confirmation strings from it.**

### Honest bottom line

The bilingual/funny-level system is a **design-toy feature, not a Thunderbird feature.** All 17
`MSG_COPY` keys are toast copy for actions (`sent`, `draftSaved`, `archived`, `spammed`, `deleted`,
`markedUnread`, `copied`, `exported`, …). Thunderbird's 3-pane has **no toast/snackbar system at
all** — it has `notificationbox` (`#threadPaneNotificationBox`, line 349) and status text. So there
is currently **nothing in the 3-pane for these strings to attach to**.

The cost, stated plainly:

- 17 keys × 4 distinct rungs = **68 new Fluent messages** minimum, for strings that today have zero
  call sites in the 3-pane.
- Every one must be translated into **every Thunderbird locale** (~65 shipping locales), not just
  en-US and zh-HK. Humour does not survive machine translation, and localizers are volunteers.
- Pontoon shows all four rungs as required strings; there is no "this variant is optional" concept.
  Expect them to sit untranslated and fall back to en-US indefinitely, which is *worse* than not
  having the feature.

**Recommendation for the rewrite:**

1. **In scope, no cost:** use the Cantonese strings as a QA fixture — set the locale to `zh-HK`, use
   `LABEL_COPY[*].zh` as expected values, and verify no layout breaks with CJK text. That is
   genuinely valuable: it exercises `--m3-font-notohk`, line-height, badge widths and ellipsis
   behaviour. **Do not ship them as a bundle.**
2. **Out of scope, document as cut:** `lang: "both"` bilingual concatenation. Record it in
   `REWRITE-CONTRACT.md` as an explicit, reasoned cut, with the two-element `lang`-tagged approach
   noted as the correct design if it is ever revisited.
3. **Deferred, needs its own decision:** humour levels. If pursued, it goes in a follow-up with (a) a
   real notification surface to attach to, (b) a `*[other]` default that is the plain string so
   untranslated locales degrade to serious, (c) errors/warnings excluded, (d) l10n team sign-off on
   the string-count increase before a single `.ftl` line lands.
4. **Never:** hardcoding any of these strings into markup or JS to "get the look". Every string in
   the rewrite goes through Fluent or an existing DTD entity — no exceptions, including strings that
   are "obviously English" like the app title.

---

## Part F — The checklist

### F1. Roles — must exist in the rewritten UI

- [ ] `role="tree"` on the folder tree container (`#folderTree`)
- [ ] `aria-multiselectable="true"` on the folder tree container
- [ ] `role="treeitem"` on every folder row (runtime, mixin:475)
- [ ] `role="group"` on every nested folder `<ul>` (runtime, mixin:497)
- [ ] `role="treegrid"` on the message-list `<tbody>` (runtime, tree-view:2914)
- [ ] `aria-multiselectable="true"` on the message-list `<tbody>`
- [ ] `role="row"` on message rows / `role="option"` in listbox mode (runtime, tree-view:3011)
- [ ] `role="gridcell"` on every visible cell (runtime, tree-view:3042)
- [ ] `role="toolbar"` on the column-header `<tr>` (runtime, tree-view:2277)
- [ ] `role="region"` on the thread-pane header start container
- [ ] `role="list"` on `#mainConversation`, `role="listitem"` on conversation articles
- [ ] `role="group"` on `#PopupAutoComplete`
- [ ] If any XUL menupopup is replaced by HTML: `role="menu"` + `menuitem` /
      `menuitemcheckbox` / `menuitemradio` + `aria-checked` + `aria-haspopup` + focus trap +
      Escape + type-ahead + accesskeys, all hand-implemented

### F2. ARIA state and relationships

- [ ] `aria-live="off"` preserved **verbatim** on `.list-header-bar-container-start`
- [ ] `data-label-id="threadPaneFolderName"` preserved on `<tree-view>` → `aria-labelledby`
- [ ] `aria-activedescendant` maintained on both the folder tree and the message list
- [ ] `aria-selected` on folder rows, message rows, **and every `<td>`**
- [ ] `aria-expanded` on folder rows with children and on thread containers (absent on leaves)
- [ ] `aria-level` / `aria-setsize` / `aria-posinset` / `aria-rowindex` on message rows
- [ ] `aria-sort` on exactly one column header at a time (`ascending`/`descending`)
- [ ] `aria-checked` on the select-all header button
- [ ] `aria-pressed` on `#threadPaneQuickFilterButton` and all 10 `is="toggle-button"` filter buttons
- [ ] `aria-keyshortcuts="Control+Shift+K"` on the quick-filter search bar
- [ ] `aria-hidden="true"` on virtualization spacers
- [ ] `aria-hidden="true"` (**not `"hidden"`** — see A4) on all 11 decorative row/card buttons and
      on any new decorative control the Material design introduces
- [ ] `alt=""` on every decorative `<img>`; `data-l10n-id` (supplying `.alt`) on every informative one
- [ ] `<time datetime="">` retained in the conversation view

### F3. Focus and keyboard

- [ ] `#folderPane` keeps `tabindex="-1"` (focusable, not a tab stop)
- [ ] Folder tree = **one** tab stop (`tabIndex=0` on the container, rows `-1`)
- [ ] Message list = **one** tab stop (`tabIndex=0` on `<tbody>`, rows `-1`)
- [ ] Column headers = one roving-tabindex group, Arrow-Left/Right, **RTL-aware**
- [ ] Quick filter bar = two roving-tabindex groups, first child `0`, rest `-1`
- [ ] Column-picker button `tabindex="-1"` (reached via the roving group)
- [ ] All 11 row/card template buttons + `.subject-line` + `span.name` keep `tabindex="-1"`
- [ ] **Folder pane header keyboard order matches visual order.** Either keep `row-reverse` **and**
      tabindex 3/2/1, or switch to natural order **and** drop the positive values — and say which
      in the contract. Never `row-reverse` with natural tabindex.
- [ ] Total tab stops in the 3-pane stays in single digits — count them and record the number
- [ ] Visible `:focus-visible` indicator on every interactive element, both themes (port the
      design's `style-focus` intent into `about3Pane.css`)
- [ ] The "overflowing elements with `tabindex=-1` steal focus" workaround (mixin:192) survives

### F4. Composed accessible names

- [ ] Folder rows: name + unread + total + size, via `folder-pane-unread-aria-label` /
      `folder-pane-total-aria-label`, **50 ms debounce retained**
- [ ] Message rows: sender + date + subject + tags + flag/spam/read/attachment labels
- [ ] Cards: same, plus `threadpane-replies`
- [ ] Every cell keeps its `column.l10n.cell` label
- [ ] Any new row affordance is folded into the composed label, **not** exposed as a separate control

### F5. Localization

- [ ] All 7 Fluent bundles still linked (6 in `<head>` + lazy `certError.ftl`)
- [ ] All 52 unique `data-l10n-id`s from `about3Pane.xhtml` still present (or explicitly retired
      with a note)
- [ ] All 24 quick-filter-bar ids present
- [ ] All 33 `mailContext.inc.xhtml` ids present
- [ ] All 76 DTD entities still referenced, **including every `.accesskey`**
- [ ] All 84 column ids wired, with `a11y` and `header` kept **distinct**
- [ ] `data-l10n-args='{"count": 1}'` preserved on the two compact/mark-read menu items
- [ ] Runtime ids preserved: the `folder-pane-mode-header-${modeName}` concatenation (6 variants),
      the `<title>` `data-l10n-id` presence-as-state-flag, both `top.window` cross-document calls
      (`menu-file-compact`, `quota-panel-percent-used`)
- [ ] All plurals preserved unflattened, including the nested
      `threadpane-sort-header-unread-count`
- [ ] **Zero hardcoded user-visible strings.** No literal text in markup, no string literals in JS
      reaching `textContent` / `title` / `aria-label` / `alt` / `placeholder` / `value`
- [ ] No id retargeted to an element type that cannot take its attributes (silent failure)
- [ ] No DTD → Fluent migration performed as part of this rewrite
- [ ] Design strings (`LABEL_COPY`, `MSG_COPY`, dim sum names, changelog text, sample messages,
      "Material Mail", "Workspaces") appear **nowhere** in shipped code
- [ ] `--m3-font-notohk` still first in the CJK stack; **no remote font fetch**

### F6. Verification gates

- [ ] Manual pass with a real screen reader on Windows (NVDA and/or Narrator) — not an inspector.
      **Correction 2026-07-29:** the guard has a **second disjunct** this document missed.
      `tree-view.mjs:1109` is `if (!Services.appinfo.accessibilityEnabled && !Cu.isInAutomation)`,
      and `Cu.isInAutomation` is true whenever
      `security.turn_off_all_security_so_that_viruses_can_take_over_this_computer` is set
      (`vendor/gecko/js/xpconnect/src/xpcpublic.h:862-868` reads only `mTurnOffAllSecurityPref`),
      which `vendor/gecko/testing/profiles/common/user.js:58` sets for **every** mochitest profile.
      So level/setsize/posinset **are** assertable from a browser-chrome test — they are absent in
      an ordinary user profile without AT, and unobservable to static analysis, but not
      untestable. `mail/base/test/browser/browser_m3Accessibility.js` asserts them. This gate
      remains open for what a test genuinely cannot do: hear what NVDA or Narrator *says*.
- [ ] Keyboard-only pass: reach every control, operate every menu, in all three layouts
- [ ] Tab-stop count recorded before and after; any increase justified
- [ ] `./mach test mail/base/test/browser/browser_*3pane*` plus folder-tree / thread-tree suites
- [ ] Run under `zh-HK` and confirm CJK strings do not clip badges, truncate folder names, or break
      row height
- [ ] Run under an RTL locale (`ar` / `he`) and confirm column-header arrow-key direction flips
- [ ] `./mach lint` clean, including any `.ftl` touched
- [ ] Diff `about3Pane.xhtml` old vs new for `aria-`, `role=`, `tabindex=`, `data-l10n-id`, `&…;`
      and reconcile every removal against this document

---

## Part G — Top risks, ranked

1. **Runtime ARIA is invisible to a markup-only rewrite.** ~2/3 of the a11y surface lives in
   `tree-view.mjs`, `tree-listbox-mixin.mjs` and the row modules. Replace the markup without
   preserving those contracts (`data-label-id`, class names, cell `.{column}-column` selectors, row
   `id` scheme `<listId>-row<N>`) and every attribute in Part B silently stops being applied.
2. **Tab-stop explosion.** The design makes every folder row, chip and hover action a plain
   `<button>`. Baseline is single-digit tab stops via two `aria-activedescendant` containers plus
   three roving groups. Following the design literally makes the 3-pane keyboard-hostile.
3. **The `aria-live="off"` region gets "fixed" to `polite`.** Looks like an improvement in review,
   is catastrophic in use — an announcement per arrow-key press.
4. **The reverse tabindex gets half-changed.** `row-reverse` kept, positive tabindexes dropped →
   header keyboard order silently reverses. No visual diff catches it.
5. **`a11y` and `header` column strings get merged.** Seven icon-only columns lose their accessible
   name or get "Sort by star" as a column name.
6. **Accesskeys dropped when XUL menus become Material list items.** ~55 in this document, all
   localizer-chosen, all invisible in an English-only smoke test.
7. **Threading semantics lost.** `aria-level`/`setsize`/`posinset`/`aria-expanded` are guarded by
   `accessibilityEnabled` and will pass every non-AT test while being completely broken.
8. **Design strings leak in.** "Material Mail", "Workspaces", dim sum names, `MSG_COPY` toasts —
   hardcoded once "just to see the layout", never removed.
9. **Bilingual concatenation shipped as a string.** Two languages in one node with one `lang`
   attribute — a real regression dressed as a feature.
10. **`aria-hidden="hidden"` propagated forward.** An invalid token copied into new markup; fix it to
    `"true"` deliberately and re-test verbosity.
