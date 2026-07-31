# 3-Pane rewrite — feature parity contract

**Status: 33 / 38 boxes ticked** (2026-07-31 integration audit). Every unticked box
carries its own honest reason inline. Windows CI has built and launched the packaged
application, but the full application suites are not green.

**Mandate:** re-skin the 3-pane UI to the "Material Mail" design as a **CSS layer over upstream's
existing markup and behaviour**. **Every feature below must survive.**

> [!NOTE]
> **Corrected 2026-07-29.** This line used to read "full ground-up rewrite … No stock Thunderbird
> markup carried over", which `design/README.md` and `AGENTS.md` §6 both contradict and which the
> diff refutes outright: `git diff --stat upstream/main...HEAD -- mail/` is **12 files, 6,509
> insertions, zero
> deletions**, `mail/base/content/about3Pane.js` has never been modified, and the two upstream XHTML
> files gained nothing but `<link rel="stylesheet">` elements and comments. That untouched-behaviour
> fact is what every tick below actually rests on, so the mandate must not describe a rewrite that
> did not happen.

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

**≈18,450 lines** plus **167 distinct `cmd_*` commands**.

> Corrected 2026-07-29 by the reconciliation wave. The figure was **137** here and at the
> checklist box below, while this document's own later text established **167**. Two independent
> counts of `grep -rhoE '\bcmd_[A-Za-z0-9_]+' mail/base/content/ | sort -u` return **167**, and
> every entry was inspected for false positives. **137** is not reproducible by any scope; the
> nearest real numbers are 121 (`mainCommandSet.inc.xhtml` alone) and 132 (that plus the menubar).

## Feature checklist

### Folder pane
- [x] Six folder modes: **all, smart (unified), unread, favorite, recent, tags** — independently
      toggleable, multiple active at once, reorderable (move up/down)
- [x] Compact mode per-mode (`canModeBeCompact`)
- [x] Toggles: total count badge, folder size, full path, hide local folders
- [ ] Unread-count and total-count badges; new-mail indicator; folder colors; account indicator
      — **STILL UN-TICKED 2026-07-29 (second refutation).** The audit's named defect **is fixed**:
      the selected-row `--icon-color` now carries the guard and reads
      `:root:not([lwtheme]) #folderTree li.selected:not([data-folder-type], [data-server-type],
      [data-tag-key]) > .container > .icon` = (1,6,1), against `#folderTree .icon` (1,1,0) and the
      nntp/rss arms (1,2,2)/(1,3,3) — it wins with or without the guard, so the hand-off the old
      comment invented was never needed. The refuter then found a **different** live defect in the
      clause the box names: our `@media (prefers-contrast)` fallback handed **both** the unread and
      the new-mail badge arm `--folderpane-unread-count-background`, while `about3Pane.css:56`
      defines a separate `--folderpane-unread-new-count-background: ButtonShadow` and applies it at
      `:600` / `:611-614`. Ours out-ranked upstream on both arms — (1,5,1) vs (0,3,0) filled,
      (1,9,2) vs (0,7,1) collapsed — so in Windows High Contrast a folder with **new** mail was
      painted identically to one with merely **unread** mail. **Fixed in this wave** (two arms
      restated at matching weight, ordered after, still below the `.selected` arms). The box waits
      because that fix has had no adversarial pass, and two secondary findings stand: the
      `:not(…)` exclusion list does not cover selected newsgroup/RSS **subfolders** (their own `li`
      carries no `[data-server-type]`), and `.folder-size` (1,4,0) / `.twisty` (1,4,0) have no
      `prefers-contrast` **base** counterpart, only their `.selected` variants at (1,5,1).
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
- [x] All 22 columns (this line said "20" and then listed 22; `ThreadPaneColumns.mjs` has 22 `id:`
      entries and the `about3Pane.xhtml` row template emits 22 `<td data-column-name>` — text
      corrected 2026-07-29, no behaviour defect): select, thread, flagged, attachment, subject, unread, sender, recipient,
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
- [ ] **All 167 `cmd_*` commands** remain wired and correctly enabled/disabled
      — **STILL UN-TICKED 2026-07-29 (second refutation), on arithmetic, not on cascade.** Defect
      (a) is repaired: **167** is now reproducible three ways
      (`grep -rhoE '\bcmd_[A-Za-z0-9_]+' mail/base/content | sort -u | wc -l` = 167; 313 across
      `mail/`; chrome-document trigger counts 120 / 67 / 119 all verify exactly). Defect (b) is
      repaired too, and the refuter could not break the cascade half — it re-derived and **confirmed**
      both contests: `m3-thread-pane.css:454` `& > :is(menu, menuitem)` = (1,0,1) does out-rank
      `contextMenu.css:76-81`'s disabled arm (0,1,2) but declares a **disjoint** set (size, padding,
      radius, font-size — no `color`), so out-ranking is inert; and `widgets.css:58-60` `.button:disabled`
      (0,2,0) declares `opacity: 0.4` **and** `pointer-events: none`, and no M3 sheet declares
      `pointer-events` on a `.button` at all, so a disabled button is not a hit-test target and the
      unguarded `:hover` rules cannot match it. What refutes is the box's own enumeration: it claimed
      `mailContext._commands` = 31 and `_alwaysVisibleCommands` = 13, hence "52 id-mapped triggers".
      Counted from source: **30** (`mailContext.js`, entries 82-111) and **12** (`_alwaysVisibleCommands:`
      at **114**, entries 115-126), plus `folderPaneContextMenu._commands` = 8 → **50**, not 52; the
      cross-check `sed -n '78,132p' | grep -c cmd_` = **42** = 30 + 12. Three further evidence defects:
      the "`--button-*` grep returns only `--panel-*`" parenthetical is false (M3 repoints
      `--button-border-radius`, `--button-margin`, `--button-padding`,
      `--button-pressed-indicator-padding` — none a `*-disabled` variant, so the conclusion holds);
      the opacity census is 6 in the six sheets **plus 4 keyframe endpoints** in `material-tokens.css`;
      and `cmd_createAddressBook` is not trigger-less (`mailWindowOverlay.js:1738`, loaded by
      `messenger.xhtml:173`). A box revoked for a miscount cannot be re-ticked on evidence that
      miscounts. Re-tick when those five figures are corrected — the cascade argument is already
      independently reproduced.
- [ ] **Keyboard navigation** throughout; correct tabindex order (note the deliberate reverse
      tabindex in the folder pane header for `row-reverse`)
      — **STILL UN-TICKED 2026-07-29 (second refutation).** The audit's named defect is genuinely
      repaired and the refuter reproduced the repair arm by arm: all 13 restated arms of the
      `@media (forced-colors)` group in `m3-thread-pane.css` are **character-identical** to their
      bases, so each pair TIES — (2,3,1), (2,2,0)×2, (2,3,2), (2,4,0), (2,6,2), (2,3,2), (2,3,1),
      (2,5,1), **(2,4,1)** (element column is `tbody` alone — the file's own table now reads (2,4,1)),
      (2,3,1) — and the block wins on source order; the ground-aware correction at (2,7,2) / (2,6,1) /
      (2,6,3) / (2,6,2) beats every arm it corrects on weight. Three new grounds refute. **(i) Four
      focus rings ARE theme-conditional**, which a line-grep of `:focus-visible` cannot see because
      the guard sits on the **nesting ancestor**: `m3-chrome.css:151` `.tabmail-tab:focus-visible`
      (0,4,0), `:244` `button.tab-close-button:focus-visible` (0,4,1), `:331` `#alltabs-button:focus-visible`
      (1,3,0) and `:479` `.spaces-toolbar-button:focus-visible:not(:hover)` (0,5,0) sit inside
      `:root:not([lwtheme])` blocks opening at `:120`, `:120`, `:276`, `:462`. For a lightweight-theme
      user the first three degrade to a UA/toolkit `auto` ring — `tabmail.css` has **no**
      `:focus-visible` rule at all, so the fallback is `ua.css:189`'s 1px, and `#alltabs-button` falls
      to `toolbarbutton.css:13`'s `:where(:focus-visible)` at (0,0,1). This is the over-guarding
      failure §3 of `AGENTS.md` names, and `AGENTS.md` §3 asserts the opposite as *verified*: that
      claim is a raw-grep artifact and must be corrected there too. **(ii)** The selector group under
      review has **15** selectors, not 14 — the unenumerated one is
      `#threadPane #threadTree tr.current > td > .card-container` at (2,2,2), which restates no base
      and loses to the card ring at (2,6,2) (benign: nothing sets `outline-style` on an unfocused
      current row, so its `outline-color` paints nothing). **(iii)** "Throughout" is unproven:
      `m3-chrome.css` has **no `@media (forced-colors)` block at all**, and the message pane's only
      ring, `m3-message-pane.css:231` (1,3,0), cannot cross the `<browser id="messageBrowser">`
      boundary into `about:message` any more than a custom property can. Re-tick after the four
      chrome rings are split (geometry unguarded, colour guarded) or lifted out of the guard, the
      15th selector is accounted for, and the rings are observed in Windows High Contrast.
- [ ] **Accessibility**: `role="tree"`, `aria-multiselectable`, `aria-live` regions, `aria-hidden`
      on decorative buttons, screen-reader labels on every control
      — **STILL UN-TICKED 2026-07-29 (second refutation).** Three things moved and none of them is
      a tick. **(1) The revocation's own premise was too strong and is corrected.**
      `tree-view.mjs:1109` is `if (!Services.appinfo.accessibilityEnabled && !Cu.isInAutomation)`;
      `Cu.isInAutomation` is true iff `security.turn_off_all_security_so_that_viruses_can_take_over_this_computer`
      is set (`xpcpublic.h:862-868`), which `vendor/gecko/testing/profiles/common/user.js:58` sets for
      every mochitest profile. `aria-level` / `-setsize` / `-posinset` / `-rowindex` therefore **are**
      assertable from a browser-chrome test. `design/A11Y-L10N-AUDIT.md` F6 gate 1 has been corrected
      accordingly. **(2) A real registered test now exists**:
      `mail/base/test/browser/browser_m3Accessibility.js` (998 lines), registered in
      `mail/base/test/browser/browser2.toml:38` and picked up by
      `.github/workflows/browser-tests-m3.yml` (its `m3` group discovers `browser_m3*.js`). It asserts
      the container roles, the threading semantics above in both row modes, `aria-live="off"` verbatim
      across selection churn, spacer `aria-hidden="true"`, `tabindex="-1"` on every decorative row
      button, three focus rings by **computed** style (alpha > 0, width ≥ 2px), and hard-asserts zero
      axe `color-contrast` violations over the live 3-pane using the already-vendored
      `third_party/axe-core` via `mail/test/browser/shared-modules/AxeHelpers.sys.mjs`. **It has never
      been executed** — there is no build in this checkout and the workflow has never run — so it is a
      written test, not a passed one, and it is worth **nothing** as evidence until it is green.
      **(3) The static half is not exhaustive either.** `m3-folder-pane.css:288` declares
      `text-transform: uppercase` at (1,2,1), unguarded and **uncontested** (upstream's own rule for
      that element, `about3Pane.css:464-471`, declares no `text-transform`), on `.mode-name` — and
      `tree-listbox-mixin.mjs:469-475` gives **every** descendant `li` `role="treeitem"`, `.unselectable`
      included, so that is a treeitem whose accessible name comes from that text. Gecko exposes the
      transformed text: `vendor/gecko/accessible/tests/mochitest/text/test_gettext.html:69-76` asserts
      `"HELLO MY FRIEND"` for a `text-transform: uppercase` node. The in-file comment "visual casing
      only — the string still comes from Fluent" is half true: the Fluent id is untouched, the
      accessible text is not. Also standing: all 11 decorative buttons are `aria-hidden="hidden"`, an
      invalid value (`ARIAMap.cpp:1637-1643` compares against `true` case-sensitively), so they are
      **not** hidden from AT at all — upstream markup we may not edit — and three of our own comments
      (`m3-thread-pane.css:19`, `:732`, `:995`) repeat that false premise. All eight F6 gates in
      `design/A11Y-L10N-AUDIT.md` remain `- [ ]`. Re-tick only when the test has run green **and** a
      live NVDA or Narrator pass has been heard — never on static evidence, and never on a test that
      has only been written.
- [x] **Localization**: every string via Fluent (`data-l10n-id`) or DTD entity — no hardcoded text.
      Existing `.ftl` files: about3Pane, treeView, messenger, calendar, textActions, findbar
- [ ] **Theming**: light/dark, `lightweightthemes="true"`, `colors.css` variables, folder colors
      — **STILL UN-TICKED 2026-07-29 (second refutation).** The audit's named defect is **fixed and
      the fix independently re-derived**: `m3-thread-pane.css:582` now declares only
      `border-width: 1px; border-style: solid` at (2,3,2) — **no colour** — while the colour moved to
      the guarded `:642` at (2,4,0). Without a theme (2,4,0) beats `tree-listbox.css` (0,3,1)/(0,4,1)
      on the id column and cards stay flat; with a theme `:642` does not match, `:582`'s values are
      byte-identical to `:307`'s shorthand, and `var(--tree-card-border)` paints unopposed. The
      `prefers-contrast` restore at `:1161` is (2,4,2), unguarded, and ties (2,4,0) on ids and classes
      while taking the element column 2-0 — so the "deletes a high-contrast affordance" objection is
      answered too. What refutes now is the **folder-colours** clause, on a cascade rule that is
      simply false: the box argued "an inline author declaration outranks every selector-matched
      author rule regardless of specificity". CSS Cascade sorts **origin and importance before
      element-attached styles**, so an author `!important` declaration beats a `style` attribute set
      with `setProperty(name, value)` (two arguments → normal priority,
      `folder-tree-row.mjs:259`). The M3 layer has exactly two `--icon-color` `!important`
      declarations and the box listed both without connecting them to its own argument:
      **`m3-folder-pane.css:546`** paints `--icon-color: var(--m3-error) !important` at (1,4,1),
      **unguarded**, beating upstream's `about3Pane.css:271` (1,3,1) `!important` — while its own
      guarded sibling at `:527` stands down under a theme and lets `--color-text-critical` paint the
      name. A themed profile with a broken-TLS folder therefore gets **two different reds on one
      row**: icon `#b3261e` (M3), name `#dc2626` (upstream). The prescribed fix is one prefix →
      (1,6,1) `!important`, which still beats (1,3,1) with no theme and hands back to
      `--color-text-critical` with one. **Not applied here** — it decides M3's red versus the theme's
      red, which is a design call to make on the record, not a ratifier's edit. And
      **`#folderTree li.selected > .container > .icon { --icon-color: currentColor !important }`**
      (`m3-folder-pane.css:928` today, inside `@media (prefers-contrast)` but **outside** the guard
      block) is broader than upstream's equivalent `about3Pane.css:419-422`, which requires
      `#folderTree:focus-within`; in the themed, not-focus-within case its stated premise
      ("unreadable on the high-contrast selection fill") is false, because our fill is guarded and
      upstream sets `--treeitem-background-selected: transparent` under `prefers-contrast`
      (`about3Pane.css:57`) — there **is** no fill, so we overwrite the user's folder colour for
      nothing. Re-tick when both `!important` rules are decided on the record. (Search by selector:
      line numbers in this file are historical.)
- [x] **CSP**: the existing `Content-Security-Policy` meta must remain satisfiable.
      The policy is **per-directive**, not a union — `about3Pane.xhtml:20` is
      `style-src about: 'unsafe-inline'; img-src moz-icon: chrome: moz-src: data:`. Note `style-src`
      has no `chrome:` and `img-src` has no `about:`. (Wording tightened 2026-07-29: this line
      previously quoted the union of the two lists, which would clear a genuine `img-src`
      violation.) The added CSS fetches exactly one scheme, `chrome:`, via exactly two `url()`
      tokens (`m3-quick-filter.css:668` and `:820`, both `content:` on `#qfb-searching-throbber`,
      both `img-src` loads where `chrome:` is explicitly listed). Zero `@import`, zero `@font-face`.
      ⚠️ The design loads Google Fonts from `fonts.googleapis.com` / `fonts.gstatic.com` — this is
      **blocked by CSP and unacceptable in Thunderbird** (remote fetch at startup, privacy leak).
      Fonts must be vendored locally or swapped for system fonts. **Deliberately not ported**; the
      families survive as local-name fallbacks only, and the remote `<link>` appears nowhere outside
      comments at `material-tokens.css:20-21,28`.
- [x] Session/state persistence: active modes, compact, column layout, sort, view mode, splitter
      sizes, quick-filter state
      — **RE-TICKED 2026-07-29.** The named defect is fixed and the fix survived a dedicated
      adversarial pass that returned **UPHELD**. `m3-layout.css:86-88` now reads **17em / 54em /
      36em**, so the defaults track `mail.uifontsize` the way `about3Pane.css:75-77`'s do:
      `about3Pane.js:169` calls `UIFontSize.registerWindow(window)`, `UIFontSize.sys.mjs:195-198`
      writes an inline px `font-size` onto `documentElement` (and `removeProperty` on the default
      path), and `em` on `body` resolves against it. `grep -nE 'Splitter-(width|height):\s*[0-9.]+px'`
      across the six sheets is **empty** — no px default survives. Both sides of the only cascade
      contest re-derived: ours `body#paneLayout` = **(1,0,1)**, upstream `body` = **(0,0,1)**, and
      both are only defaults because `pane-splitter.js` `#setSize` writes the restored value
      **inline** on `parentNode`, which beats every author-normal stylesheet rule by origin.
      Restored column widths arrive the same way (`tree-view.mjs:2189` / `:2865`, inline
      `--<colId>Splitter-width` and `width: var(...)` on the same `<th>`), and **no JS anywhere parses
      the em**: `grep -n getComputedStyle` over `pane-splitter.js` and `about3Pane.js` is empty,
      persistence stores `getBoundingClientRect()` numbers, and `browser_paneSplitterGaps.js` reads
      the **inline** value only. The strongest link was strengthened, not assumed: `activeModes` is
      `Array.from(folderTree.children, li => li.dataset.mode)` (`about3Pane.js:2134-2136`) with
      `mode.container.remove()` on toggle-off (`:2224`), so it round-trips through DOM child
      membership, and `m3-folder-pane.css` declares **zero** `display:`; compact round-trips through
      a content attribute (`toggleAttribute` at `:2079`, `hasAttribute` at `:2089`) which CSS cannot
      write; quick-filter visibility round-trips through `quickFilterBar.js:439`'s `.hidden` and our
      rule is `#quick-filter-bar:not([hidden])`. Column-header widths cannot drift on our typography
      because `tree-listbox.css:320` sets `table-layout: fixed` and `:494-501` gives the header button
      `overflow: hidden; text-overflow: ellipsis; min-inline-size: auto`. The column-picker
      workaround the first pass **refused** is also confirmed correct: `& > :is(menu, menuitem)` under
      the list `#threadPaneDisplayContext, #menu_threadPaneSortPopup, .menupopup-column-picker`
      resolves to **(1,0,1)** (`&` takes the list's most specific member even when matching via the
      class), against the rejected flat form `.menupopup-column-picker > :is(menu, menuitem)` at
      **(0,1,1)**. ⚠️ **The tick certifies mechanism, not observation.** `17em` = 272px at a 16px root
      versus upstream's `18em` = 288px is a deliberate divergence in the *unpersisted default only*
      (no test asserts a numeric default width), and the priority runtime check is: clear XULStore,
      raise `mail.uifontsize`, confirm `#folderPane`'s never-dragged width scales, then stops moving
      once dragged.

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

**M3 section stylesheets — packaged and loaded** (6 files, 218,230 bytes; seven M3/token files total 232,884 bytes)

Six section sheets written against the tokens above are now registered in
`mail/themes/shared/jar.inc.mn` and linked from the two documents that actually
contain the elements they target:

| File | Bytes | Rule blocks | Loaded from |
|---|---:|---:|---|
| `m3-layout.css` | 18,210 | 21 | `about3Pane.xhtml` |
| `m3-folder-pane.css` | 55,386 | 108 | `about3Pane.xhtml` |
| `m3-thread-pane.css` | 64,367 | 154 | `about3Pane.xhtml` |
| `m3-quick-filter.css` | 39,537 | 76 | `about3Pane.xhtml` |
| `m3-message-pane.css` | 14,344 | 9 | `about3Pane.xhtml` |
| `m3-chrome.css` | 26,386 | 74 | `messenger.xhtml` |

Verified before landing: braces and parens balance in all six; no `@import`, no
remote font fetch, no inline `style=`, no new user-visible strings. Four actual
`!important` declarations remain: two in `m3-folder-pane.css` and two forced-colors
system-colour declarations in `m3-quick-filter.css`, each matching an upstream
important rule or accessibility fallback.

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

1. **CI has built and launched the packaged application, but no manual visual
   sign-off exists and the application gate is red.** The latest run passed setup,
   build, static packaged CSS, chrome, and the authored M3 suite, but failed the
   3-pane, widgets, and folder suites. Treat untested combinations as open until
   a passing run and manual coverage exist for layouts, themes, seeds, and density.
2. **The density scale is wired statically but not runtime-approved.**
   `material-tokens.css` maps both `data-m3-density` and Thunderbird's live
   `uidensity` attribute, and the owned row inset uses a logical inline token.
   Runtime coverage across all three density values is still unverified, while
   `about3Pane.js#densityChange` keeps separate row-height constants. Do not tick
   the related parity box until a passing Windows run measures the actual rows.
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

> [!NOTE]
> The ratification prose below is a historical audit trail from 2026-07-29. Its
> old counts and "not built" wording are preserved for provenance; the current
> state is the 2026-07-31 integration audit near the end of this document.

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

> **Historical snapshot notice:** the ratification prose in this section records
> earlier 2026-07-29 audit states. The current 2026-07-31 state is the integration
> audit and verification block below; phrases such as “nothing on this branch has
> been built” describe that earlier snapshot, not the current CI evidence.

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
`_setRowAriaAttributes` short-circuits only when `Services.appinfo.accessibilityEnabled` **and** `Cu.isInAutomation` are BOTH false (`tree-view.mjs:1110`);
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
no `@import` and no `@font-face`.

> **Guard counts corrected 2026-07-29.** This paragraph previously read
> "layout 15 · folder-pane 61 · thread-pane 42 · quick-filter 25 · message-pane 10 ·
> chrome 11 · tokens 0" and presented those as mechanically verified. They are
> `grep -c lwtheme` — a **raw substring count that includes comment prose**, so every
> sentence in a doctrine comment explaining the guard was counted as a guard. The real
> count of `:root:not([lwtheme])` occurrences in **selector position**, comment-stripped,
> reproduced independently three times this wave:
>
> | Sheet | `grep -c lwtheme` | Actual guarded selectors | Braces |
> |---|---:|---:|---:|
> | `m3-layout.css` | 15 | **11** | 21/21 |
> | `m3-folder-pane.css` | 61 | **56** | 100/100 |
> | `m3-thread-pane.css` | 43 | **30** | 152/152 |
> | `m3-quick-filter.css` | 25 | **21** | 76/76 |
> | `m3-message-pane.css` | 10 | **3** | 9/9 |
> | `m3-chrome.css` | 11 | **9** | 68/68 |
> | `material-tokens.css` | 0 | **0** | 34/34 |
> | **Total** | | **130** | |
>
> This is a **measurement bug in the documentation, not a CSS defect** — the guards are
> real and correctly spelled. Note the table at the top of this section reports a *third*
> set of numbers again (10/60/23/22/4), matching neither. Quote only the middle column.

**Running total: 32 / 38.**

> [!WARNING]
> **A complete contract is not a working application.** Every proof on this branch
> is *static* — selector, specificity, cascade and source reading against the JS
> that consumes it. **Nothing here has been built or launched.** The installer CI
> is green and ships a real 85,207,651-byte artifact, but nobody has run it and
> clicked through the 3-pane. Open item 1 stands, and the audit's F6 screen-reader
> gate cannot be closed statically at all, because `_setRowAriaAttributes`
> short-circuits only when `Services.appinfo.accessibilityEnabled` **and** `Cu.isInAutomation` are BOTH false (`tree-view.mjs:1110`).
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

### 2026-07-29 — independent audit mega-wave, then adversarial refutation. **38 / 38 → 32 / 38.**

Eleven audit agents re-derived every box from primary sources with a standing instruction to
treat a previous agent's tick as a claim to be tested, not a fact to inherit. One adversarial
refuter then attacked both the upheld ticks and the challenges, verifying against the tree, the
vendored Gecko source and the live GitHub API. This entry is the reconciliation.

**Reconciliation rule applied:** a box stays ticked only if it was never challenged, or its
challenge was dismissed by the refuter, **or the defect it names was fixed and the fix verified
this wave.** A surviving, unfixed challenge un-ticks the box. Six did.

#### Six ticks REVOKED

| Box | Why it failed |
|---|---|
| Folder pane — badges / new-mail / **folder colors** / account indicator | `m3-folder-pane.css:397` paints `--icon-color: var(--m3-on-secondary-container)` on the selected row **unguarded**, over a theme's own selection fill. Its defence — "calibrated against about3Pane.css's own specificity" — is false: (1,4,1) vs (1,1,0). Unfixed; guarding it is a design decision, not an auditor's. |
| **All `cmd_*` commands** | Box said **137**; the real count is **167**. Its proof, "blast radius exactly 4", is a markup-only `grep` of `about3Pane.xhtml` and misses `#threadTree`'s delegated `dblclick`/`auxclick` → 3 commands, `.tree-button-more` → `#mailContext`'s 45, and ~163 chrome triggers reached by inherited font/colour. A second proof ("zero `position`/`z-index`") is also false. |
| **Keyboard navigation** | `m3-thread-pane.css:1177-1179`'s forced-colors focus group is **entirely dead** — (1,2,0) against two-ID competitors — while its comment claims it "already out-ranks" them. Its `display:` inventory was 21 (raw) vs **12** (real). No affordance lost today; the tick was simply not earned. |
| **Accessibility** | Scope, not defect. `_setRowAriaAttributes` short-circuits only when `Services.appinfo.accessibilityEnabled` **and** `Cu.isInAutomation` are BOTH false (`tree-view.mjs:1110`), so threading semantics are **unobservable statically** but ARE observable under mochitest, which sets `Cu.isInAutomation` — run 30495583685 resolved real `aria-level` / `aria-rowindex` / `aria-setsize` values. All eight F6 gates in `A11Y-L10N-AUDIT.md:704-717` are still `- [ ]`. Never tick this on static evidence. |
| **Theming** | `m3-thread-pane.css:547`'s unguarded `border: 1px solid transparent` at (2,3,2) out-ranks `tree-listbox.css:307` (0,3,1), so a theme can never paint thread-card border colours. Unfixed on purpose: the obvious fix reaches (2,5,2) and defeats the `prefers-contrast` rule at (2,4,2). |
| **Session/state persistence** | `m3-layout.css:67-69` pins splitter defaults to 272/864/576 **px**, replacing upstream's 18/54/36 **em**. `UIFontSize.sys.mjs:194-198` writes an inline px `font-size` on `documentElement`, so em tracked `mail.uifontsize` and px does not. For a never-dragged pane the setting restores and stops changing appearance — this box's own definition of a real regression. |

#### Four challenges DISMISSED by the refuter

1. **"Both roving chip rows lost their `aria-pressed` cue under forced-colors."** False for the
   text-scope row: `m3-quick-filter.css:504-537` gives its chips an **unguarded** `::before` that
   grows 0px → 16px with `--icon-check` when pressed — a *shape* cue, and `url()` background-images
   are honoured under forced-colors per `servo/.../cascade.rs`. Overstated for the filter chips
   above 999px too. Re-scoped to `#qfb-sticky` and to `.quickFilterButtons` **below** 999px, both
   genuine. **The fix stays** — it was right, its justification was too broad.
2. **"`m3-thread-pane.css:1111` is unguarded, flagged for the thread-pane owner"** — reported by
   *three* separate agents. It was **already fixed in this same wave**; the selector now carries the
   (2,5,0) form. Three reports pointed the next wave at a ghost. Struck.
3. **Quick-filter's specificity figures for the `#qfb-sticky` pressed fills** — neither the comment's
   (1,6,0) nor the agent's proposed (2,2,0); it is **(2,3,0)**. No functional consequence (the block
   is `!important`), but do not quote onward.
4. **Folder-pane's "the guard count is 60, not 61"** — directionally right, still wrong. 60 is the
   raw count including a comment occurrence. The real figure for that sheet is **56**.

#### Five regressions found and fixed, all verified clean by the refuter

Every one is the *same family* the brief predicted — a `@media` fallback that loses to the guarded
rule it exists to undo — but with a variant nobody had named: the fallback selector is **shorter**
than its competitor because the guarded rule carries extra state pseudo-classes, so "just add the
prefix" does not fix it.

- **forced-colors, folder selection.** The M3 fill ships as three selectors; the fallback listed one.
  A selected folder row in a *focused* tree lost its Windows High Contrast highlight entirely.
- **prefers-contrast, Write button.** Fallback (1,2,0) against (1,4,0)/(1,5,0) hover and press, so
  the button snapped back to the M3 fill and a hardcoded `rgba(0,0,0,.15)` shadow on hover. The
  file's own comment claimed the opposite.
- **prefers-contrast, drop target.** Fallback missed the `:focus-within` (1,6,1) arm.
- **prefers-contrast, collapsed-parent unread badge.** (1,5,1) fallback against (1,8,2)/(1,9,2), so
  M3 purple stayed painted on the system selection fill — out-ranking upstream's own inversion.
- **forced-colors, thread cards.** `color: inherit` at (2,2,0) against (2,5,0), leaving card
  sender/subject/date as CanvasText over the SelectedItem fill. A plain guard reaches only (2,4,0)
  and still loses — which is exactly why three previous passes missed it.

Plus two of the opposite shape, which matter just as much:

- **Over-guarding, `m3-layout.css`.** `border-width: 0` was unguarded but the `prefers-contrast`
  hairline that restored it was guarded, so **installing a lightweight theme deleted the only pane
  boundary in high contrast**. Split: width unguarded, colour guarded.
- **A missing fallback, `m3-quick-filter.css`.** The only section sheet with *neither* a
  `prefers-contrast` nor a `forced-colors` block. Three waves hunting a fallback that *loses* never
  looked for one that does not exist. `#qfb-sticky`'s pressed state measured **1.17:1** in the
  default light path — a WCAG 1.4.11 failure with no accessibility setting enabled.

#### Evidence falsified without changing an outcome

Recorded so it is not inherited a fourth time. `[hidden]` authority is upstream's
`:where([hidden]) { display: none !important }` (`global-shared.css:118`), **not** our restatement —
two agents built ticks on a mechanism that is not the operative one. `lazy-findbar` is **not**
`display: contents`; no stylesheet in the tree gives it that, though the conclusion survives because
an unopened one has no children. And the single most repeated methodological error of the wave:
**counting with `grep -c` without stripping comments**, which produced wrong guard counts in three
documents, a wrong `display:` inventory, and a wrong brace count.

#### What 32 / 38 means

Six boxes are now honest about what nobody has evidence for. Four of the six are *documentation and
cascade* defects rather than broken features — the feature very probably works; the proof did not.
Two (`folder colors`, `Theming`) name live unguarded rules that a themed user would actually see.

And the standing caveat is unchanged, twelve waves in: **nothing on this branch has been built or
launched.** A contract that went *down* under audit is worth more than one that stayed at 38.

### 2026-07-29 — repair wave, then a second adversarial refutation. **32 / 38 → 33 / 38.**

The six revoked boxes were each re-proved by a dedicated agent working from primary sources, then
each proof was attacked by its own dedicated refuter. **Five refuters returned REFUTED. One returned
UPHELD.** One box is ticked. That ratio is the honest yield of a wave that landed 404 insertions of
repairs (`a6abec8`) plus a gecko pin bump (`37499c1`) — the repairs were real, the *proofs* of them
mostly were not yet.

**Ratification rule applied, stricter than last wave's:** a box is re-ticked only if its proof
carried worked specificity arithmetic for **both sides** of every cascade claim **and** its refuter
returned UPHELD. A REFUTED verdict un-ticks, even when the audit's originally-named defect is fixed.
Four of the five refusals below are of exactly that shape: the named defect **is** repaired, and a
*different* defect or a miscount was found in the proof of the repair.

#### One tick restored

| Box | What earned it |
|---|---|
| **Session/state persistence** | `m3-layout.css:86-88` respelt **272px / 864px / 576px** as **17em / 54em / 36em**, so the never-dragged defaults track `mail.uifontsize` again. UPHELD after attack, and *strengthened*: `activeModes` round-trips through DOM child membership (`about3Pane.js:2134-2136` / `:2224`) rather than attributes, `table-layout: fixed` (`tree-listbox.css:320`) means our header typography cannot drift a stored column width, and no JS anywhere in the path calls `getComputedStyle`. The refuter also closed the column-picker box the very first parity pass **refused**: `& > :is(menu, menuitem)` really is (1,0,1) against the rejected flat form's (0,1,1). |

#### Five refusals, and the ground each one died on

| Box | The refuter's ground |
|---|---|
| Folder pane — badges / new-mail / folder colors / account indicator | Named defect fixed (the selected-row `--icon-color` is guarded, (1,6,1) vs (1,1,0)/(1,2,2)/(1,3,3)). **New defect**: our `prefers-contrast` fallback handed the `.new-messages` badge the plain-unread token, out-ranking upstream's `ButtonShadow` arm (1,5,1) vs (0,3,0) and (1,9,2) vs (0,7,1) — new mail looked exactly like old unread mail in Windows High Contrast. **Fixed in this commit**; unticked because that fix has had no adversarial pass. |
| All 167 `cmd_*` commands | Cascade half **survived every attack** and was independently reproduced (the (1,0,1) menuitem rule out-ranks `contextMenu.css`'s (0,1,2) disabled arm but declares a *disjoint* set; `widgets.css:58-60`'s `pointer-events: none` is uncontested by any M3 sheet). Killed on arithmetic: the tables it said it enumerated are **30 / 12 / 8 = 50**, not 31 / 13 / 8 = 52, and "52" propagates four times. A box revoked for a miscount cannot be re-ticked on evidence that miscounts. |
| Keyboard navigation | Named defect fixed — all 13 restated forced-colors arms verbatim-tie their bases. **New defect**: **four focus rings ARE theme-conditional** (`m3-chrome.css:151`, `:244`, `:331`, `:479`), invisible to a line-grep because the guard sits on the nesting ancestor. `AGENTS.md` §3 asserts the opposite as *verified* and must be corrected. Plus the group under review has **15** selectors, not 14, and `m3-chrome.css` has no `forced-colors` block at all. |
| Accessibility | A real test now exists and is registered — but **has never been run**, and a tick on a written test is a tick on nothing. The static half also turned out non-exhaustive: `text-transform: uppercase` on `.mode-name` (1,2,1), unguarded and uncontested, **changes the accessible text** of a `role="treeitem"` (`test_gettext.html:69-76` proves Gecko exposes the transform). |
| Theming | Named defect fixed and re-derived (the card border shorthand is colourless at (2,3,2); the colour moved to the guarded (2,4,0); the `prefers-contrast` restore at (2,4,2) still wins). Killed on a **false cascade rule**: "inline outranks every selector-matched rule regardless of specificity" ignores that origin/importance sorts *before* element-attached styles — so the two `--icon-color` `!important` declarations it listed but never inspected do beat the user's folder colour, and one of them paints an M3 red where its own guarded sibling stands down. |

#### Regressions found and fixed by this pass

1. **The new-mail badge handed back the wrong token under high contrast** (`m3-folder-pane.css`).
   `about3Pane.css` defines two tokens in the same `@media (prefers-contrast)` block —
   `--folderpane-unread-count-background` and `--folderpane-unread-new-count-background: ButtonShadow`
   (`:56`) — and applies them separately at `:600` and `:611-614`. Our fallback gave both arms the
   first one and out-ranked upstream on both: **(1,5,1) vs (0,3,0)** filled, **(1,9,2) vs (0,7,1)**
   collapsed/outlined. In Windows High Contrast with no theme installed — the exact configuration the
   guarded block exists to serve — a folder with **new** mail was indistinguishable from one with
   merely **unread** mail, even though our own base rules distinguish them
   (`--m3-primary-container` vs `--m3-primary`). Fixed by restating the two `.new-messages` arms at
   matching weight, ordered after their competitors and still below the `.selected` arms at
   (1,9,2)/(1,10,2). Zero declarations changed on any existing rule; guard counts unmoved.
2. **Three false in-file comments corrected** (comment-only, no declaration touched). The
   `.menupopup-column-picker` comment claimed `--m3-font-size` "resolves to an absolute
   `calc(14px * 100 / 100)`" citing `material-tokens.css:41-42`; the real definition is
   `material-tokens.css:60`, `calc(1rem * var(--m3-font-scale) / 100)` — root-relative, already
   tracking the pref, and lines 41-42 are prose. And three comments in `m3-thread-pane.css` described
   the decorative row buttons as `aria-hidden`; upstream spells it `aria-hidden="hidden"` in all **11**
   places (`about3Pane.xhtml:241-360`) and `ARIAMap.cpp:1637-1643` compares against `true`
   case-sensitively, so those buttons are **not** hidden from AT. Upstream's markup, not ours to fix —
   but ours to stop repeating.
3. Earlier in the wave, and verified by the refuters rather than taken on report: the
   `m3-folder-pane.css` forced-colors ring comment replaced "already out-ranks" with the six-arm
   **tie table** that is actually true, and the `m3-thread-pane.css` specificity table corrected
   `.button-flat` from (2,4,2) to **(2,4,1)** (the element column is `tbody` alone).

#### Prescribed fixes deliberately NOT applied, with the arithmetic, awaiting direction

Each is a design or scope decision, not a ratifier's edit, and each is a one- or few-line change:

1. **`m3-folder-pane.css:546`** — `--icon-color: var(--m3-error) !important` at (1,4,1), unguarded,
   beating upstream's (1,3,1) `!important` under a theme, while its guarded sibling `:527` stands
   down. Two different reds on one row (`#b3261e` icon / `#dc2626` name). Prefixing reaches
   (1,6,1) and still wins with no theme. **Decides M3's red versus the theme's.**
2. **`m3-folder-pane.css:928`** — `--icon-color: currentColor !important`, broader than upstream's
   `:focus-within`-scoped `about3Pane.css:419-422`, on a premise that is false in the themed,
   unfocused case. **Decides whether we overwrite a user's folder colour with no fill behind it.**
3. **The four guarded chrome focus rings** (`m3-chrome.css:151`, `:244`, `:331`, `:479`) — split the
   `outline` shorthand (geometry unguarded, colour guarded) or lift the rings out of the guard, so a
   lightweight-theme user stops falling back to `ua.css:189`'s 1px `auto` ring. **The highest-value
   accessibility fix on the board**, and it also requires correcting `AGENTS.md` §3, which states as
   *verified* that zero focus rings carry the guard.
4. **The five `cmd_*` figures** (31→30, 13→12, line 116→114, 52→50 in four places, and the
   `--button-*` / opacity-census / `cmd_createAddressBook` corrections). Pure arithmetic; the
   cascade argument behind that box is already reproduced twice.

#### Mechanically verified by this ratify pass, not taken on report

- Guard counts, **comments stripped** (`perl -0777 -pe 's{/\*.*?\*/}{}gs'` then `grep -c`), working
  tree at commit time: `m3-layout` **11** · `m3-folder-pane` **57** · `m3-thread-pane` **31** ·
  `m3-quick-filter` **21** · `m3-message-pane` **3** · `m3-chrome` **9** · `material-tokens` **0** —
  total **132**. The 148 still printed in `AGENTS.md` and earlier in this file is a raw `grep -c`
  that counted doctrine prose as guards. `material-tokens.css` stays at zero: definitions are not
  paint. The badge fix added no guard string — both new rules sit inside an existing guard block.
- `git status --porcelain -- mail/base/content/about3Pane.js` → **empty**, and
  `git diff --stat upstream/main...HEAD -- mail/base/content/about3Pane.js` → **empty**. The
  behaviour layer is still untouched, which is still the entire safety argument.
- `git diff --shortstat upstream/main...HEAD -- mail/` → **12 files, 6,509 insertions,
  zero deletions** in the current integration baseline.
- Braces balanced comment-stripped in `m3-folder-pane.css` (105/105) after the edit.
- Prettier 3.8.1 (`vendor/gecko/.prettierrc.js`, CSS `printWidth: 160`) `--check` clean over all six
  `m3-*.css`, `material-tokens.css` **and** the new `browser_m3Accessibility.js`, which needed
  `--write` before it was.
- Upstream drift, after a real `git fetch upstream`: **33 ahead / 1 behind**; the one incoming commit
  is `dce3a592428` "Bumping Thunderbird l10n changesets", and
  `git log --oneline --name-status HEAD..upstream/main -- mail/base/content/ mail/themes/` is
  **empty** — harmless per the triage rule, merged in this wave.
- `gh issue list --repo Ding-Ding-Projects/agent-global-memory --state open` → **zero open issues**,
  scanned at the start and again before finishing.

#### Test and CI infrastructure landed

- `mail/base/test/browser/browser_m3Accessibility.js` — 998 lines, 12 tasks, registered at
  `mail/base/test/browser/browser2.toml:38`. Anti-vacuity guard first (it fails if the six M3 sheets
  are not actually in `document.styleSheets` in the right cascade order), then container roles,
  threading semantics in both row modes, `aria-live="off"` verbatim across selection churn,
  virtualization spacers, three focus rings by **computed** style, and a hard assert of zero axe
  `color-contrast` violations over the live 3-pane. `aria-valid-attr-value` and the full ruleset are
  `todo`, not asserted, because they would be permanently red for upstream's
  `aria-hidden="hidden"` — a test that enshrines a bug is worse than no test.
- `.github/workflows/browser-tests-m3.yml` — 1198 lines, `windows-latest`, artifact build with
  `--enable-tests`, six test groups covering 58 files, four independent failure gates including a
  mozlog result gate self-tested against five synthetic streams and a real end-to-end harness
  self-test that appends `Assert.ok(false)` to a registered test and fails unless both mochitest and
  the gate catch it. Its `m3` group discovers `browser_m3*.js` by glob, so the new test is picked up.
- **Neither has ever executed.** No build exists in this checkout. The standing caveat is unchanged,
  thirteen waves in: **nothing on this branch has been built or launched.** Writing the test moved
  the accessibility box's runtime half from *impossible* to *pending*. Pending is not a tick.

#### What 33 / 38 means

One box moved, and it moved because its defect was fixed *and* the fix withstood attack. The other
five are now unticked for **better** reasons than they were yesterday: four of them have their
originally-named defect repaired and stand refused over a fresher, smaller thing — a miscount, a
guarded focus ring, a stale comment, an unrun test. That is what convergence looks like when the
grader is adversarial. The two boxes with live rules a user would actually see are still
`folder colors` and `Theming`, and both now have a one-line prescribed fix and named arithmetic
waiting on one design decision each.

## 2026-07-31 integration audit

This audit corrected the current-state claims without changing historical entries:

- `material-tokens.css` now has explicit logical inline row-inset tokens for the
  default, compact, and touch density arms; `m3-thread-pane.css` consumes them,
  removing the documented physical RTL shorthand.
- The folder mode label uses font casing rather than `text-transform`, so the
  localized accessible name is not rewritten by CSS. TLS icon colour is guarded
  for lightweight themes, and the high-contrast selected-row focus correction is
  scoped to `#folderTree:focus-within` like upstream.
- The four M3 chrome focus rings split unguarded geometry from guarded palette
  colour; installing a lightweight theme no longer removes the ring geometry.
- Windows run [30538853820](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30538853820)
  passed setup/build, static CSS, chrome, and the authored M3 suite, but failed
  the 3-pane, widgets, and folder suites. The no-M3 experiment [30499955896](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30499955896)
  also failed. These results do not justify ticking any remaining box.
- The latest lint run [30501542141](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30501542141)
  passed its self-test and failed the real CSS formatting check; the next run
  must verify the merged Gecko pin and current files. That next lint run is now
  green at [30605874495](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30605874495).
- Installer run [30605874503](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30605874503)
  reached the build and failed its vendored-Rust consistency check because
  `vendor/gecko` was still `ca6e9493686`; the corrective pin is
  `079065d33b0b`. Corrective run [30606626311](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30606626311)
  is verified green and published non-draft release
  [`tb-155.0a1-b41-ham-sui-gok`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b41-ham-sui-gok)
  with the Windows installer attached.

## Verification

A rewrite is not "done" until every box above is ticked. Minimum gates:
- `./mach lint` clean on all touched files
- `./mach test mail/base/test/browser/browser_*3pane*` and the folder-tree / thread-tree suites pass
- Manual pass over each of the three layouts in both light and dark themes
