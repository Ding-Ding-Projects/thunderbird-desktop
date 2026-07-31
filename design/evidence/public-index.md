# Material Mail evidence index

Publication source for the Material Mail Pages/wiki evidence surface. This file
is deliberately commit-pinned and does not claim that a branch, Pages site, or
wiki publication is current.

## Evidence anchor

- Audited source baseline: [`e4867411c3a`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/tree/e4867411c3aa81de4527d843913b966d0ef89c1c)
- Complete machine-readable inventory: [`manifest.json`](manifest.json)
- Local explanation: [`design/README.md`](../README.md)
- Repository source delta: CSS plus stylesheet links/comments only; upstream behavior and markup were not changed by this evidence task.
- Publication status: **not pushed by this task**. No verified Pages URL or wiki URL is recorded in the checkout, so none is invented here.

## Build and browser evidence

| Evidence | Exact record |
|---|---|
| Windows release | [`tb-155.0a1-b54-wu-gok`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/releases/tag/tb-155.0a1-b54-wu-gok), non-draft, published 2026-07-31 11:23Z; Windows installer asset present |
| Installer build | [Windows installer run 30625833498](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625833498), source `e4867411c3aa81de4527d843913b966d0ef89c1c`, passed |
| Browser run | [Browser run 30625878368](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625878368), source `e4867411c3aa81de4527d843913b966d0ef89c1c`, failed |
| Browser artifact | [m3-browser-test-logs, artifact 8791840623](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30625878368/artifacts/8791840623); run-level logs/failure captures, not surface-mapped evidence |
| Suite result | Packaged CSS: passed; chrome: passed; 3-pane, widgets, folder-pane: failed; authored M3: 137 checks, 132 expected, 5 unexpected density-token results |

## Surface coverage

`Screenshot: missing` is intentional and factual: no surface-specific capture is
committed or mapped for that row. The existing
[`design/screenshots/mail-check.png`](../screenshots/mail-check.png) remains a
reference asset only.

### Runtime-reachable surfaces

| Surface | Exact source anchors | Commands / state family | Screenshot |
|---|---|---|---|
| 3-pane shell and layouts | [`about3Pane.xhtml#L87`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/about3Pane.xhtml#L87); [`m3-layout.css#L112`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-layout.css#L112) | Classic/vertical/wide; pane visibility; splitter resize/collapse; stored widths | **Missing** |
| Folder pane | [`about3Pane.xhtml#L88`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/about3Pane.xhtml#L88); [`m3-folder-pane.css#L110`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-folder-pane.css#L110) | Folder modes; selection/current/unread/new/TLS/busy/collapsed; drag/drop; folder commands | **Missing** |
| Folder context/mode menus | [`about3Pane.xhtml#L386`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/about3Pane.xhtml#L386); [`m3-folder-pane.css#L745`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-folder-pane.css#L745) | Context, mode, header toggles, move/copy, get-all-messages | **Missing** |
| Thread header and list | [`about3Pane.xhtml#L150`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/about3Pane.xhtml#L150); [`m3-thread-pane.css#L241`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-thread-pane.css#L241) | Table/cards; selected/current/unread/new/dummy; sorting, grouping, row actions; empty states | **Missing** |
| Thread display/sort/column menus | [`about3Pane.xhtml#L626`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/about3Pane.xhtml#L626); [`m3-thread-pane.css#L440`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-thread-pane.css#L440) | View choice; 15-field sort; threaded/grouped modes; column picker/apply | **Missing** |
| Quick-filter bar | [`quickFilterBar.inc.xhtml#L6`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/quickFilterBar.inc.xhtml#L6); [`m3-quick-filter.css#L66`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-quick-filter.css#L66) | Hidden/visible/sticky; text and field filters; pressed/searching/no-results; tags/upsell | **Missing** |
| Quick-filter menus | [`quickFilterBar.inc.xhtml#L78`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/quickFilterBar.inc.xhtml#L78); [`m3-quick-filter.css#L785`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-quick-filter.css#L785) | Any/all/none tag mode; filter-button context | **Missing** |
| Message-pane shell/findbars | [`messagePaneTemplate.inc.xhtml#L5`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/templates/messagePaneTemplate.inc.xhtml#L5); [`m3-message-pane.css#L66`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-message-pane.css#L66) | No selection; single/multi message; web/account/conversation; findbar visible/hidden | **Missing** |
| Application chrome and tabs | [`messenger.xhtml#L503`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/messenger.xhtml#L503); [`m3-chrome.css#L71`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-chrome.css#L71) | Selected/unselected/hover/focus/title-changed/loading; tab overflow and close affordance | **Missing** |
| All-tabs/tab-context/search popups | [`messenger.xhtml#L404`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/messenger.xhtml#L404); [`m3-chrome.css#L349`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-chrome.css#L349) | All-tabs list; tab context; global-search autocomplete; selected result | **Missing** |
| Spaces toolbar and notifications | [`messenger.xhtml#L677`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/messenger.xhtml#L677); [`m3-chrome.css#L459`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/themes/shared/mail/m3-chrome.css#L459) | Active/inactive spaces; badges; focus; in-app notification | **Missing** |
| Existing upstream dialogs/windows | [`mainCommandSet.inc.xhtml#L13`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/mainCommandSet.inc.xhtml#L13); [`mailCommon.js#L90`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/mail/base/content/mailCommon.js#L90) | Compose, properties, search, filters, subscribe, feed/account/calendar/chat dialogs | **Missing** |

### Design-only surfaces

| Surface | Exact source anchor | State family | Screenshot |
|---|---|---|---|
| Material Mail mail page | [`Material Mail.dc.html#L31`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L31) | Drawer, searches, sort, filters, rows, detail, attachments, inline reply, empty/no-match | **Missing** |
| Settings page | [`Material Mail.dc.html#L309`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L309) | Appearance, language/humour, narrator, dim sum, editor, history, account, live preview | **Missing** |
| Changelog page | [`Material Mail.dc.html#L370`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L370) | Search/regex, typed dates, calendar/range/presets, invalid/no-match, copy/export | **Missing** |
| Version-history page | [`Material Mail.dc.html#L451`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L451) | Revision search/list, selected diff, rename, restore-as-new-revision, export | **Missing** |
| Notification centre | [`Material Mail.dc.html#L520`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L520) | All/success/info/warning filters, rows, empty/no-match, clear-all | **Missing** |
| Command palette | [`Material Mail.dc.html#L558`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L558) | Ctrl/Cmd+K, grouped commands, keyboard selection, empty result, escape | **Missing** |
| Searchable tab overlay | [`Material Mail.dc.html#L586`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L586) | Hidden-tab search, regex, pin/unpin, empty result, reorder context | **Missing** |
| Design tab context menu | [`Material Mail.dc.html#L611`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L611) | Pin/unpin, move left/right, target/dismissed | **Missing** |
| Design compose dialog | [`Material Mail.dc.html#L624`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L624) | Empty/edited form, save draft, cancel, send | **Missing** |
| Anchored regex builder | [`SearchField.dc.html#L21`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/SearchField.dc.html#L21); [`RegexBuilder.dc.html#L10`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/RegexBuilder.dc.html#L10) | Plain/regex, valid/invalid, no-match, zero-width, captures, capped results | **Missing** |
| Toast stack and dim-sum surprise | [`Material Mail.dc.html#L654`](https://github.com/Ding-Ding-Projects/thunderbird-desktop/blob/e4867411c3aa81de4527d843913b966d0ef89c1c/design/Material%20Mail.dc.html#L654) | Success/info/warning, undo/dismiss, notification history, 1% startup, preview | **Missing** |

## Publication handoff

This source is ready for a later Pages/wiki publisher to consume, but it is not a
publication result. Before publishing, preserve the commit-pinned source links,
replace no `missing` status without a genuine surface capture, and record the
actual Pages/wiki destination in a later integration change.
