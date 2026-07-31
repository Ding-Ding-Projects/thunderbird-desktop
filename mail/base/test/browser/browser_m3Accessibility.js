/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Runtime accessibility coverage for the Material Design 3 restyle of
 * about:3pane.
 *
 * WHY THIS FILE EXISTS
 *
 * The M3 work is a CSS layer over upstream's existing 3-pane DOM. Every
 * "feature survives" claim in design/REWRITE-CONTRACT.md is a static
 * argument: selector, specificity, cascade, source order. Three things in
 * the accessibility box cannot be settled that way, at all, ever:
 *
 *   1. `aria-level` / `aria-setsize` / `aria-posinset` / `aria-rowindex` do
 *      not exist in the DOM at parse time. tree-view.mjs writes them in
 *      `_setRowAriaAttributes()`, which begins:
 *
 *        if (!Services.appinfo.accessibilityEnabled && !Cu.isInAutomation) {
 *          return;
 *        }
 *
 *      (mail/base/content/widgets/tree-view.mjs:1109-1114.) No amount of
 *      reading about3Pane.xhtml will show you those attributes, because
 *      nothing puts them there until that guard opens.
 *
 *   2. Whether a focus ring is *visible* is a computed-style question.
 *      "This selector out-ranks that one" is a claim about the cascade;
 *      "the user can see where focus is" is a claim about resolved colour,
 *      resolved width, and resolved alpha. `color-mix()` and `var()` chains
 *      only resolve at computed-value time.
 *
 *   3. Contrast ratios. The M3 palette retints selected rows, count pills
 *      and header text. Whether the result clears WCAG is arithmetic on
 *      resolved colours, which is exactly what axe-core measures and
 *      exactly what no grep can.
 *
 * So this file asserts those three at runtime, in a real profile, with the
 * M3 sheets loaded.
 *
 * ON THE AUTOMATION ESCAPE HATCH
 *
 * design/A11Y-L10N-AUDIT.md (~line 707) records the short-circuit above as
 * "you cannot test this without a screen reader". That is true of a static
 * pass and true of a normal user profile, but the guard has a second
 * disjunct the audit did not account for: `!Cu.isInAutomation`. Mochitest
 * profiles set
 *   security.turn_off_all_security_so_that_viruses_can_take_over_this_computer
 * to true (vendor/gecko/testing/profiles/common/user.js:58), and that pref
 * is the entire input to `xpc::IsInAutomation()`
 * (vendor/gecko/js/xpconnect/src/xpcpublic.h:862-868). So in a browser-chrome
 * test `Cu.isInAutomation` is true, the guard opens, and the threading
 * attributes really are assertable. `checkA11yPrecondition()` below verifies
 * that rather than assuming it, and marks the block `todo` if it ever stops
 * holding — a skip that shows up in the log, not a silent pass.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * It is not a screen-reader test. It asserts that the accessibility
 * *contract* in the DOM and the computed style is intact. It does not assert
 * that NVDA or JAWS announces anything in particular, and no automated test
 * in this tree can.
 */

const { MessageGenerator } = ChromeUtils.importESModule(
  "resource://testing-common/mailnews/MessageGenerator.sys.mjs"
);
const { ensure_cards_view, ensure_table_view } = ChromeUtils.importESModule(
  "resource://testing-common/MailViewHelpers.sys.mjs"
);
const { assertNoAxeViolations, formatAxeViolations, runAxeInWindow } =
  ChromeUtils.importESModule(
    "resource://testing-common/mail/AxeHelpers.sys.mjs"
  );

const tabmail = document.getElementById("tabmail");
const about3Pane = tabmail.currentAbout3Pane;
const { threadPane, threadTree } = about3Pane;

/**
 * The sheets about3Pane.xhtml links for the M3 restyle, in the source order
 * the cascade depends on. material-tokens.css must come before
 * about3Pane.css; the five section sheets must come after it.
 */
const M3_SHEETS = [
  "chrome://messenger/skin/material-tokens.css",
  "chrome://messenger/skin/m3-layout.css",
  "chrome://messenger/skin/m3-folder-pane.css",
  "chrome://messenger/skin/m3-thread-pane.css",
  "chrome://messenger/skin/m3-quick-filter.css",
  "chrome://messenger/skin/m3-message-pane.css",
];

let rootFolder, testFolder, emptyFolder;

add_setup(async function () {
  const generator = new MessageGenerator();

  const account = MailServices.accounts.createLocalMailAccount();
  account.addIdentity(MailServices.accounts.createIdentity());
  rootFolder = account.incomingServer.rootFolder.QueryInterface(
    Ci.nsIMsgLocalMailFolder
  );

  // Threaded on purpose: aria-level is only interesting when the list has a
  // hierarchy to describe.
  testFolder = rootFolder
    .createLocalSubfolder("m3Accessibility")
    .QueryInterface(Ci.nsIMsgLocalMailFolder);
  testFolder.addMessageBatch(
    generator
      .makeMessages({ count: 25, msgsPerThread: 5 })
      .map(message => message.toMessageString())
  );

  // A folder with no messages, so the thread list can be focused with no
  // `tr.current` in it. That is the only state in which the M3 list-level
  // focus ring is the visible indicator.
  emptyFolder = rootFolder
    .createLocalSubfolder("m3AccessibilityEmpty")
    .QueryInterface(Ci.nsIMsgLocalMailFolder);

  about3Pane.restoreState({
    folderPaneVisible: true,
    messagePaneVisible: true,
  });
  about3Pane.displayFolder(testFolder.URI);
  goDoCommand("cmd_expandAllThreads");
  await ensure_table_view(document);
  await new Promise(about3Pane.requestAnimationFrame);

  registerCleanupFunction(async () => {
    await ensure_cards_view(document);
    MailServices.accounts.removeAccount(account, false);
  });
});

/**
 * Parse a computed colour into an alpha value.
 *
 * getComputedStyle resolves color-mix() and var() chains down to an
 * rgb()/rgba() literal, so this is enough to tell "painted" from
 * "transparent" — which is the difference between a focus ring a keyboard
 * user can see and one they cannot.
 *
 * @param {string} value A resolved CSS colour.
 *
 * @returns {number} Alpha in the range 0-1, or 1 when no alpha is present.
 */
function alphaOf(value) {
  if (!value || value == "transparent") {
    return 0;
  }
  const match = /^rgba?\(([^)]*)\)$/.exec(value.trim());
  if (!match) {
    // Something other than rgb()/rgba() (a system colour under
    // forced-colors, for instance). Treat it as painted; the width and
    // style assertions still have to hold.
    return 1;
  }
  const parts = match[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
}

/**
 * Assert that an element resolves to an outline a sighted keyboard user can
 * actually see.
 *
 * This is the assertion static analysis cannot make. A rule can win the
 * cascade and still paint nothing, because `outline-color` may resolve
 * through a color-mix() to alpha 0, or `outline-style` may resolve to
 * `none` from a competitor the specificity arithmetic did not account for.
 *
 * @param {Element} element Element expected to carry a focus indicator.
 * @param {string} label Human-readable name for assertion messages.
 * @param {number} [minWidth=1] Minimum acceptable outline width, in px.
 */
function assertVisibleOutline(element, label, minWidth = 1) {
  const style = about3Pane.getComputedStyle(element);
  const width = parseFloat(style.outlineWidth);
  const alpha = alphaOf(style.outlineColor);

  Assert.notEqual(
    style.outlineStyle,
    "none",
    `${label} should resolve a drawn outline-style, got ${style.outlineStyle}`
  );
  Assert.greaterOrEqual(
    width,
    minWidth,
    `${label} should resolve outline-width >= ${minWidth}px, got ` +
      `${style.outlineWidth}`
  );
  Assert.greater(
    alpha,
    0,
    `${label} should resolve a non-transparent outline-color, got ` +
      `${style.outlineColor}`
  );
  info(
    `${label}: outline ${style.outlineWidth} ${style.outlineStyle} ` +
      `${style.outlineColor} offset ${style.outlineOffset}`
  );
}

/**
 * Check whether the row a11y attributes are being written at all.
 *
 * `_setRowAriaAttributes()` returns early unless the accessibility service
 * is running or we are in automation. Reading the same condition the widget
 * reads is the only honest way to decide whether an absent `aria-level` is
 * a bug or a documented no-op.
 *
 * @returns {boolean} True when the threading attributes should be present.
 */
function checkA11yPrecondition() {
  const a11yEnabled = Services.appinfo.accessibilityEnabled;
  const inAutomation = Cu.isInAutomation;
  info(
    `accessibilityEnabled=${a11yEnabled} isInAutomation=${inAutomation} ` +
      `(tree-view.mjs:1110 opens when either is true)`
  );
  return a11yEnabled || inAutomation;
}

/**
 * The test is worthless if the M3 sheets are not loaded — every assertion
 * below would pass against stock Thunderbird and prove nothing about this
 * fork. Fail loudly instead.
 */
add_task(async function testM3SheetsAreActuallyLoaded() {
  const hrefs = Array.from(
    about3Pane.document.styleSheets,
    sheet => sheet.href
  );
  for (const href of M3_SHEETS) {
    Assert.ok(
      hrefs.includes(href),
      `${href} should be linked into about:3pane — without it this whole ` +
        `file is testing stock Thunderbird`
    );
  }

  // Source order is load-bearing: the section sheets deliberately match
  // about3Pane.css's specificity instead of escalating past it, so they win
  // on order alone. If about3Pane.css ever sorts after them, most of the
  // skin silently reverts and the focus-ring assertions below start
  // measuring upstream's rings, not ours.
  const stockIndex = hrefs.indexOf("chrome://messenger/skin/about3Pane.css");
  Assert.greater(stockIndex, -1, "about3Pane.css should be linked");
  Assert.less(
    hrefs.indexOf("chrome://messenger/skin/material-tokens.css"),
    stockIndex,
    "material-tokens.css must load before about3Pane.css"
  );
  for (const href of M3_SHEETS.slice(1)) {
    Assert.greater(
      hrefs.indexOf(href),
      stockIndex,
      `${href} must load after about3Pane.css`
    );
  }

  // And prove the tokens resolve, not merely that the file is attached.
  // material-tokens.css defines the --m3-* palette on :root.
  const rootStyle = about3Pane.getComputedStyle(
    about3Pane.document.documentElement
  );
  for (const token of ["--m3-primary", "--m3-outline"]) {
    Assert.notEqual(
      rootStyle.getPropertyValue(token).trim(),
      "",
      `${token} should resolve on the about:3pane root`
    );
  }

  // --m3-tp-focus-ring is NOT a root token: m3-thread-pane.css declares its
  // local derived values on #threadPane, not on :root. Custom properties do
  // inherit, so it is readable from any descendant of #threadPane but is
  // absent on the document root. Reading it in the right place is the point —
  // the focus-ring assertions later in this file depend on it resolving.
  const threadPaneStyle = about3Pane.getComputedStyle(
    about3Pane.document.getElementById("threadPane")
  );
  Assert.notEqual(
    threadPaneStyle.getPropertyValue("--m3-tp-focus-ring").trim(),
    "",
    "--m3-tp-focus-ring should resolve on #threadPane"
  );
});

/**
 * The design density axis must survive the translation to Thunderbird's live
 * `uidensity` attribute. The design snapshot also names the same arms with
 * `data-m3-density`; keeping both projections working makes the source gate
 * and the runtime gate test the same contract instead of two similar-looking
 * values that can drift independently.
 */
add_task(async function testM3DensityTokensFollowLiveAttributes() {
  const root = about3Pane.document.documentElement;
  const originalUidensity = root.getAttribute("uidensity");
  const originalDensity = root.getAttribute("data-m3-density");
  const arms = [
    {
      name: "default",
      uidensity: null,
      density: null,
      row: "12px 8px 12px 16px",
      inline: "16px 8px",
      gap: "2px",
      control: "48px",
      avatar: "40px",
    },
    {
      name: "compact via uidensity",
      uidensity: "compact",
      density: null,
      row: "8px 8px 8px 12px",
      inline: "12px 8px",
      gap: "1px",
      control: "40px",
      avatar: "32px",
    },
    {
      name: "touch via uidensity",
      uidensity: "touch",
      density: null,
      row: "16px 12px 16px 20px",
      inline: "20px 12px",
      gap: "4px",
      control: "56px",
      avatar: "44px",
    },
    {
      name: "compact via design vocabulary",
      uidensity: null,
      density: "compact",
      row: "8px 8px 8px 12px",
      inline: "12px 8px",
      gap: "1px",
      control: "40px",
      avatar: "32px",
    },
    {
      name: "relaxed via design vocabulary",
      uidensity: null,
      density: "relaxed",
      row: "16px 12px 16px 20px",
      inline: "20px 12px",
      gap: "4px",
      control: "56px",
      avatar: "44px",
    },
  ];

  try {
    for (const arm of arms) {
      if (arm.uidensity === null) {
        root.removeAttribute("uidensity");
      } else {
        root.setAttribute("uidensity", arm.uidensity);
      }
      if (arm.density === null) {
        root.removeAttribute("data-m3-density");
      } else {
        root.setAttribute("data-m3-density", arm.density);
      }

      await new Promise(resolve => about3Pane.requestAnimationFrame(resolve));
      const style = about3Pane.getComputedStyle(root);
      for (const [token, expected] of Object.entries({
        "--m3-row-padding": arm.row,
        "--m3-row-padding-inline": arm.inline,
        "--m3-gap": arm.gap,
        "--m3-control-size": arm.control,
        "--m3-avatar-size": arm.avatar,
      })) {
        Assert.equal(
          style.getPropertyValue(token).trim(),
          expected,
          `${token} should resolve to ${expected} in ${arm.name}`
        );
      }
    }
  } finally {
    if (originalUidensity === null) {
      root.removeAttribute("uidensity");
    } else {
      root.setAttribute("uidensity", originalUidensity);
    }
    if (originalDensity === null) {
      root.removeAttribute("data-m3-density");
    } else {
      root.setAttribute("data-m3-density", originalDensity);
    }
    await new Promise(resolve => about3Pane.requestAnimationFrame(resolve));
  }
});

/**
 * The folder tree's ARIA container contract.
 *
 * `role="tree"` is not decoration here: tree-listbox-mixin.mjs:125-134
 * switches on it and *throws a RangeError* on anything other than "tree" or
 * "listbox". So a regression that dropped the role would not degrade
 * quietly, it would break the widget — which is worth asserting precisely
 * because it means the reverse is also true, and the role is load-bearing
 * for behaviour as well as for assistive technology.
 */
add_task(async function testFolderTreeContainerRoles() {
  const folderTree = about3Pane.folderTree;

  Assert.equal(
    folderTree.getAttribute("role"),
    "tree",
    "#folderTree should expose role=tree"
  );
  Assert.equal(
    folderTree.getAttribute("aria-multiselectable"),
    "true",
    "#folderTree should expose aria-multiselectable=true"
  );
  Assert.ok(
    folderTree.isTree,
    "tree-listbox-mixin should have read role=tree back into isTree"
  );

  // Rows and groups, written by tree-listbox-mixin.mjs:475 and :497. These
  // are what make role=tree well-formed, and they only exist after
  // domChanged() has run — i.e. at runtime.
  const rows = folderTree.querySelectorAll("li");
  Assert.greater(rows.length, 0, "the folder tree should have rows");
  for (const row of rows) {
    Assert.equal(
      row.getAttribute("role"),
      "treeitem",
      `${row.id || "row"} should expose role=treeitem`
    );
    // _initRows writes aria-selected on every row (line 492). In an
    // aria-multiselectable tree it is what distinguishes "in the selection"
    // from "merely the cursor", so its absence would collapse the two states
    // that m3-folder-pane.css goes out of its way to draw differently.
    Assert.ok(
      ["true", "false"].includes(row.getAttribute("aria-selected")),
      `${row.id || "row"} should expose a boolean aria-selected, got ` +
        `${row.getAttribute("aria-selected")}`
    );
  }

  // The M3 sheets must not have removed the tree from the layout. A pane
  // that computes to display:none is invisible to the a11y tree as well as
  // to the eye, and no static reading of the sheets would reveal it.
  const treeStyle = about3Pane.getComputedStyle(folderTree);
  Assert.notEqual(
    treeStyle.display,
    "none",
    "#folderTree should still be laid out with the M3 sheets loaded"
  );
  Assert.greater(
    folderTree.getBoundingClientRect().height,
    0,
    "#folderTree should have a non-zero height"
  );
});

/**
 * The message list's ARIA container contract.
 *
 * TreeViewTableBody.connectedCallback (tree-view.mjs:2907-2921) sets
 * role=treegrid and aria-multiselectable on the tbody at *runtime*. They
 * are nowhere in about3Pane.xhtml, so this is another attribute a static
 * pass cannot see.
 */
add_task(async function testThreadTreeContainerRoles() {
  const body = threadTree.table.body;

  Assert.equal(
    body.getAttribute("role"),
    "treegrid",
    "the thread list tbody should expose role=treegrid"
  );
  Assert.equal(
    body.getAttribute("aria-multiselectable"),
    "true",
    "the thread list tbody should expose aria-multiselectable=true"
  );
  Assert.equal(
    body.tabIndex,
    0,
    "the thread list tbody should be in the tab order"
  );

  const bodyStyle = about3Pane.getComputedStyle(body);
  Assert.notEqual(
    bodyStyle.display,
    "none",
    "the thread list tbody should still be laid out"
  );
});

/**
 * `aria-live="off"` on the thread pane header region must survive verbatim.
 *
 * design/A11Y-L10N-AUDIT.md is explicit that "off" is deliberate: the
 * folder name and the message counts rewrite themselves constantly during
 * scrolling, sorting and selection, and a polite live region there would
 * turn the header into a firehose. "Fixing" it to `polite` is listed in the
 * audit as a predicted regression (~line 730).
 *
 * The value is static in about3Pane.xhtml:154, so reading the file proves
 * the initial state. What it cannot prove is that nothing rewrites the
 * attribute while the pane is in use — so this re-reads it after the
 * selection churn that drives the count updates.
 */
add_task(async function testThreadPaneHeaderLiveRegionStaysOff() {
  const region = about3Pane.document.querySelector(
    "#threadPaneHeaderBar > .list-header-bar-container-start"
  );
  Assert.ok(region, "the thread pane header region should exist");

  Assert.equal(
    region.getAttribute("role"),
    "region",
    "the header region should expose role=region"
  );
  Assert.equal(
    region.getAttribute("aria-live"),
    "off",
    "the header region should expose aria-live=off before interaction"
  );

  // Churn the counts: single select, multi select, clear.
  threadTree.selectedIndex = 1;
  await new Promise(about3Pane.requestAnimationFrame);
  threadTree.selectedIndices = [1, 2, 3];
  await new Promise(about3Pane.requestAnimationFrame);

  Assert.equal(
    region.getAttribute("aria-live"),
    "off",
    "the header region should still expose aria-live=off after a multi-select"
  );
  Assert.equal(
    region.getAttribute("role"),
    "region",
    "the header region should still expose role=region after a multi-select"
  );

  // The selected-count pill is the element the audit flagged as having been
  // painted invisible once already (it lost SelectedItem/SelectedItemText
  // under forced-colors). Assert it is both present and visible, and that
  // its resolved foreground and background are not the same colour — the
  // failure mode that regression produced.
  // about3Pane.js:4345-4355 unhides the pill only once two or more messages
  // are selected, and it does so from a selection listener rather than
  // synchronously, so wait for it rather than racing it. A timeout here is a
  // real failure, not a skip.
  const pill = about3Pane.document.getElementById("threadPaneSelectedCount");
  await TestUtils.waitForCondition(
    () => !pill.hidden,
    "the selected-count pill should appear for a multi-selection"
  );
  const pillStyle = about3Pane.getComputedStyle(pill);
  Assert.notEqual(
    pillStyle.display,
    "none",
    "the selected-count pill should be laid out"
  );
  Assert.notEqual(
    pillStyle.color,
    pillStyle.backgroundColor,
    "the selected-count pill's text and background must not resolve to the " +
      `same colour (both ${pillStyle.color})`
  );
  info(
    `#threadPaneSelectedCount: color ${pillStyle.color} on ` +
      `${pillStyle.backgroundColor}`
  );

  threadTree.selectedIndex = 0;
  await new Promise(about3Pane.requestAnimationFrame);
});

/**
 * Decorative in-row buttons.
 *
 * The whole reason the per-row buttons can be hidden from assistive
 * technology is that the row itself carries a composed label. The pairing
 * that makes that safe is `aria-hidden` + `tabindex="-1"` — hidden from the
 * a11y tree, and unreachable by keyboard so a screen-reader user can never
 * land on something that is not announced.
 *
 * The M3 sheets restyle every one of these buttons. Two failure modes:
 * making one keyboard-reachable (breaking the pairing), or hiding one
 * outright (deleting a mouse affordance). Both are runtime facts.
 */
add_task(async function testDecorativeRowButtons() {
  await ensure_table_view(document);
  await new Promise(about3Pane.requestAnimationFrame);

  const row = threadTree.getRowAtIndex(0);
  Assert.ok(row, "row 0 should be in the buffer");

  const buttons = row.querySelectorAll("button[aria-hidden]");
  Assert.greater(
    buttons.length,
    0,
    "the table row template should contribute aria-hidden buttons"
  );
  info(`table row 0 has ${buttons.length} aria-hidden buttons`);

  for (const button of buttons) {
    const name = button.className || "button";
    Assert.equal(
      button.tabIndex,
      -1,
      `${name} is aria-hidden so it must not be keyboard reachable`
    );

    // Known upstream defect, recorded as A4 in design/A11Y-L10N-AUDIT.md:
    // the markup writes aria-hidden="hidden". Per ARIA the attribute takes
    // true/false; "hidden" is not a valid token, so it does not actually
    // hide anything. This is upstream's markup in about3Pane.xhtml and
    // AGENTS.md forbids this fork from editing that file, so it is recorded
    // as todo rather than asserted — a green run must not imply this is
    // fixed.
    todo_is(
      button.getAttribute("aria-hidden"),
      "true",
      `${name} should use aria-hidden="true" — "hidden" is not a valid ` +
        `ARIA token (audit A4, upstream markup, not ours to change)`
    );
  }

  // Cards view has its own four decorative buttons, styled by a different
  // block of m3-thread-pane.css.
  await ensure_cards_view(document);
  await new Promise(about3Pane.requestAnimationFrame);

  const card = threadTree.getRowAtIndex(0);
  const cardButtons = card.querySelectorAll("button[aria-hidden]");
  Assert.greater(
    cardButtons.length,
    0,
    "the card row template should contribute aria-hidden buttons"
  );
  info(`card row 0 has ${cardButtons.length} aria-hidden buttons`);

  for (const button of cardButtons) {
    const name = button.className || "button";
    Assert.equal(
      button.tabIndex,
      -1,
      `${name} is aria-hidden so it must not be keyboard reachable`
    );
    todo_is(
      button.getAttribute("aria-hidden"),
      "true",
      `${name} should use aria-hidden="true" (audit A4, upstream markup)`
    );
  }

  await ensure_table_view(document);
  await new Promise(about3Pane.requestAnimationFrame);
});

/**
 * Threading semantics on message rows.
 *
 * THIS IS THE ASSERTION THE REVOKED BOX NEEDED.
 *
 * `aria-level`, `aria-setsize`, `aria-posinset` and `aria-rowindex` are
 * what make a threaded message list navigable with a screen reader, and
 * they are written by `_setRowAriaAttributes()` — which returns early
 * unless the accessibility service is running or `Cu.isInAutomation`. There
 * is no static reading of any file in this tree that can show these
 * attributes on a row, because nothing writes them until that guard opens.
 *
 * The precondition is checked, not assumed. If it ever stops holding the
 * block reports `todo` and says why, rather than passing on an empty loop.
 */
add_task(async function testMessageRowThreadingSemantics() {
  if (!checkA11yPrecondition()) {
    todo(
      false,
      "Row a11y attributes are not being written: neither " +
        "Services.appinfo.accessibilityEnabled nor Cu.isInAutomation is " +
        "true, so tree-view.mjs:1110 short-circuits. This assertion cannot " +
        "run in this configuration and is NOT passing."
    );
    return;
  }

  await ensure_table_view(document);
  goDoCommand("cmd_expandAllThreads");
  await new Promise(about3Pane.requestAnimationFrame);

  // makeMessages({ count: 25, msgsPerThread: 5 }) with all threads expanded
  // puts thread roots at 0, 5, 10, 15, 20 and their replies in between —
  // the same layout browser_threads.js asserts in its own setup.
  const root = threadTree.getRowAtIndex(0);
  const child = threadTree.getRowAtIndex(1);
  Assert.ok(root && child, "rows 0 and 1 should be in the buffer");

  Assert.equal(
    root.getAttribute("aria-level"),
    "1",
    "an expanded thread root should be at aria-level 1"
  );
  Assert.equal(
    child.getAttribute("aria-level"),
    "2",
    "a reply inside an expanded thread should be at aria-level 2"
  );

  Assert.equal(
    root.getAttribute("aria-rowindex"),
    "1",
    "row 0 should expose aria-rowindex 1 (1-based)"
  );
  Assert.equal(
    child.getAttribute("aria-rowindex"),
    "2",
    "row 1 should expose aria-rowindex 2"
  );

  for (const [label, element] of [
    ["thread root", root],
    ["thread reply", child],
  ]) {
    for (const attribute of ["aria-setsize", "aria-posinset"]) {
      const value = element.getAttribute(attribute);
      Assert.ok(
        value !== null && Number(value) > 0,
        `${label} should expose a positive ${attribute}, got ${value}`
      );
    }
  }

  Assert.equal(
    root.getAttribute("role"),
    "row",
    "rows inside a treegrid should expose role=row"
  );

  // The restyle must not have flattened the hierarchy it is drawing. A
  // collapsed thread has to say so.
  goDoCommand("cmd_collapseAllThreads");
  await new Promise(about3Pane.requestAnimationFrame);
  const collapsed = threadTree.getRowAtIndex(0);
  Assert.equal(
    collapsed.getAttribute("aria-expanded"),
    "false",
    "a collapsed thread root should expose aria-expanded=false"
  );

  goDoCommand("cmd_expandAllThreads");
  await new Promise(about3Pane.requestAnimationFrame);
  Assert.equal(
    threadTree.getRowAtIndex(0).getAttribute("aria-expanded"),
    "true",
    "an expanded thread root should expose aria-expanded=true"
  );
});

/**
 * Virtualization spacers must stay out of the accessibility tree.
 *
 * The spacer tbodies exist only to hold scroll height for rows that are not
 * rendered. If they are announced, a screen reader user hears empty rows.
 * Their height changes on every scroll, so this is a runtime property.
 */
add_task(async function testVirtualizationSpacers() {
  const { spacerTop, spacerBottom } = threadTree.table;
  for (const [label, spacer] of [
    ["spacerTop", spacerTop],
    ["spacerBottom", spacerBottom],
  ]) {
    Assert.ok(spacer, `${label} should exist`);
    // A spacer that is announced is a spacer that reads as an empty row.
    // tree-view.mjs:2065 and :2077 set `ariaHidden = "true"` on these — note
    // that unlike the row-template buttons these correctly use the valid
    // "true" token, so this one is asserted rather than left todo.
    Assert.equal(
      spacer.getAttribute("aria-hidden"),
      "true",
      `${label} should carry aria-hidden="true"`
    );
  }
});

/**
 * The keyboard cursor must be visible in the folder pane.
 *
 * `#folderTree li.current > .container` is where the M3 sheets draw the
 * folder-pane cursor. The arithmetic, re-derived rather than taken from the
 * comment above the rule:
 *
 *   M3        #folderTree li.current > .container
 *             ids 1 (#folderTree)
 *             classes 2 (.current, .container)
 *             types 1 (li)                                    -> (1,2,1)
 *
 *   upstream  #folderTree:focus-visible { outline: none }
 *             (about3Pane.css:240, nested inside #folderTree)
 *             ids 1, pseudo-class 1, types 0                  -> (1,1,0)
 *
 * The two do not even collide — `outline` is not inherited, so upstream's
 * `outline: none` on the *container* cannot reach a descendant `.container`
 * — but M3 also out-ranks it (1,2,1) > (1,1,0) if it ever did. What neither
 * number tells you is whether the resolved colour is visible: the guarded
 * declaration is `outline-color: color-mix(in srgb, var(--m3-primary) 45%,
 * transparent)`, and a color-mix against `transparent` is exactly how a
 * ring ends up drawn at alpha 0. Only computed style can settle that.
 *
 * Note the M3 rule keys on `:focus-within`, not `:focus-visible`, so a
 * programmatic focus() is enough and there is no keyboard-modality
 * flakiness here.
 */
add_task(async function testFolderPaneKeyboardCursorIsVisible() {
  const folderTree = about3Pane.folderTree;
  folderTree.focus();
  await new Promise(about3Pane.requestAnimationFrame);

  const current = folderTree.querySelector("li.current");
  Assert.ok(current, "the folder tree should have a current row when focused");

  const container = current.querySelector(":scope > .container");
  Assert.ok(container, "the current folder row should have a .container");

  Assert.ok(
    folderTree.matches(":focus-within"),
    "the folder tree should match :focus-within, which is what the M3 " +
      "cursor rule keys on"
  );

  // minWidth 2: m3-folder-pane.css draws this cursor at outline-width 2px.
  assertVisibleOutline(container, "focused folder tree current row", 2);

  // The ring is inset (-2px) because #folderPane has `contain: strict` and
  // would clip an outset ring at the pane edge. An outset offset here means
  // the ring is being drawn outside the clip and is invisible in practice.
  const offset = parseFloat(
    about3Pane.getComputedStyle(container).outlineOffset
  );
  Assert.lessOrEqual(
    offset,
    0,
    `the folder cursor ring must be inset to survive #folderPane's clip, ` +
      `got outline-offset ${offset}px`
  );
});

/**
 * The keyboard cursor must be visible in the message list, table view.
 *
 * Re-derived arithmetic for the pair that actually competes here:
 *
 *   M3        #threadPane #threadTree[rows="thread-row"]
 *               [is="tree-view-table-body"]:is(:focus, :focus-within)
 *               > tr.table-layout.current
 *             ids 2 (#threadPane, #threadTree)
 *             class-column 5 ([rows="thread-row"], [is="..."],
 *               :is(:focus,:focus-within), .table-layout, .current)
 *             types 1 (tr)                                    -> (2,5,1)
 *
 *   upstream  [is="tree-view-table-body"]:is(:focus, :focus-within)
 *               > .table-layout.current:not(.selected)
 *             (tree-listbox.css:188-199)
 *             ids 0
 *             class-column 5 ([is="..."], :is(...), .table-layout,
 *               .current, :not(.selected) taking its argument's weight)
 *             types 0                                          -> (0,5,1)
 *
 * (2,5,1) beats (0,5,1) on the id column, so the M3 ring wins. That is a
 * cascade claim and it is checkable by hand. Whether the ring is *visible*
 * is not: `outline: 2px solid var(--m3-primary)` depends on --m3-primary
 * resolving, which depends on material-tokens.css being linked into this
 * document and on no theme having stood the seed down.
 */
add_task(async function testThreadPaneKeyboardCursorIsVisible() {
  await ensure_table_view(document);
  about3Pane.displayFolder(testFolder.URI);
  await new Promise(about3Pane.requestAnimationFrame);

  const body = threadTree.table.body;
  body.focus();
  // An arrow key both establishes a current row and puts the widget in
  // keyboard modality, which is what the list-level ring below needs.
  EventUtils.synthesizeKey("KEY_ArrowDown", {}, about3Pane);
  await new Promise(about3Pane.requestAnimationFrame);

  const current = body.querySelector("tr.current");
  Assert.ok(
    current,
    "the thread list should have a current row after ArrowDown"
  );
  Assert.ok(
    current.classList.contains("table-layout"),
    "the current row should be in table layout"
  );
  Assert.ok(
    body.matches(":focus, :focus-within"),
    "the thread list tbody should be focused"
  );

  // minWidth 2: the table-row cursor is 2px, not the design's 3px, because a
  // 3px inset ring would cover the single line of row text.
  assertVisibleOutline(current, "focused thread list current row", 2);
});

/**
 * The list-level focus ring, for the state where there is no current row.
 *
 * tree-listbox.css:155-158 sets `[is="tree-view-table-body"]:focus {
 * outline: none }` at (0,2,0), on the reasoning that the current row shows
 * focus instead. In an empty folder there is no current row, so without a
 * replacement, keyboard focus in the message list is invisible. M3 restores
 * it at
 *
 *   #threadPane #threadTree [is="tree-view-table-body"]:focus-visible
 *     :not(:has(> tr.current))
 *
 *   ids 2; class column 3 ([is="..."], :focus-visible, and
 *   :not(:has(> tr.current)) contributing its argument's weight — :has()
 *   takes its own argument's weight, `tr.current` = (0,1,1) — so 1 class
 *   and 1 type from the :not); types 1 (the tr inside :has)
 *                                                            -> (2,3,1)
 *
 * (2,3,1) beats (0,2,0) comfortably. But this rule keys on
 * `:focus-visible`, which Gecko only matches under keyboard modality, and
 * modality is not something a test can assert into existence. So the
 * precondition is checked with `matches(":focus-visible")` and reported as
 * `todo` if it did not latch — never silently skipped.
 */
add_task(async function testEmptyThreadListFocusRing() {
  await ensure_table_view(document);
  about3Pane.displayFolder(emptyFolder.URI);
  await new Promise(about3Pane.requestAnimationFrame);

  const body = threadTree.table.body;
  Assert.equal(
    body.querySelectorAll("tr.current").length,
    0,
    "an empty folder should leave the thread list with no current row"
  );

  // Tab establishes keyboard modality, then focus the list directly.
  EventUtils.synthesizeKey("KEY_Tab", {}, about3Pane);
  body.focus();
  await new Promise(about3Pane.requestAnimationFrame);

  if (!body.matches(":focus-visible")) {
    todo(
      false,
      "Could not establish :focus-visible on the thread list tbody in this " +
        "run, so the M3 list-level focus ring could not be measured. This " +
        "assertion did NOT pass; Gecko's focus-visible heuristic depends on " +
        "input modality, which a test cannot force."
    );
  } else {
    Assert.ok(
      body.matches(":not(:has(> tr.current))"),
      "the M3 list ring's :not(:has(> tr.current)) guard should match"
    );
    // The list ring is --m3-tp-focus-ring, 3px; 2 is a floor, not an
    // equality, so a density change cannot make this brittle.
    assertVisibleOutline(body, "focused empty thread list", 2);
  }

  about3Pane.displayFolder(testFolder.URI);
  await new Promise(about3Pane.requestAnimationFrame);
});

/**
 * axe-core over the live 3-pane.
 *
 * This is the part of the accessibility box that only a running application
 * can close. `color-contrast` resolves every foreground against every
 * effective background and does the WCAG arithmetic — on the M3 palette, at
 * the current density, with the current seed. No selector audit can produce
 * that number.
 *
 * Rule selection is deliberate and narrow:
 *
 *  - `color-contrast` is asserted. It is the rule the M3 restyle owns
 *    outright: material-tokens.css picks every colour in the 3-pane, and
 *    m3-thread-pane.css section 1 retints selected rows away from the
 *    accent fill upstream assumed. If the palette is illegible, that is
 *    this project's bug and nobody else's.
 *
 *  - Everything else is reported, not asserted. The rest of the ruleset
 *    grades upstream's markup, which AGENTS.md forbids this fork from
 *    editing: `aria-valid-attr-value` will flag the eleven
 *    `aria-hidden="hidden"` buttons (audit A4), and asserting on it would
 *    make this test permanently red for a defect we are not allowed to fix
 *    here. Logging it keeps it visible without laundering it into a pass or
 *    into a false failure.
 */
add_task(async function testAxeColorContrastOverThe3Pane() {
  await ensure_table_view(document);
  about3Pane.displayFolder(testFolder.URI);
  threadTree.selectedIndex = 1;
  await new Promise(about3Pane.requestAnimationFrame);

  let results;
  try {
    results = await runAxeInWindow(about3Pane, {
      axeOptions: {
        runOnly: { type: "rule", values: ["color-contrast"] },
      },
    });
  } catch (error) {
    // Do not swallow this. If axe cannot be injected the contrast coverage
    // is not running, and a green run would be a lie.
    Assert.ok(
      false,
      `axe-core could not run against about:3pane: ${error.message}\n` +
        `${error.stack}`
    );
    return;
  }

  if (results.skipped) {
    // AxeHelpers disables itself on debug/ASAN/TSAN/ccov builds, where the
    // run is too slow to be useful. Say so out loud.
    todo(
      false,
      `axe checks were skipped for this build (${results.skippedReason}); ` +
        `contrast was NOT verified in this run`
    );
    return;
  }

  info(
    `axe color-contrast: ${results.passes.length} passes, ` +
      `${results.violations.length} violations, ` +
      `${results.incomplete.length} incomplete`
  );
  // `incomplete` is axe declining to judge (usually a background it could
  // not resolve). It is not a pass, so surface it rather than letting
  // assertNoAxeViolations' silence imply coverage.
  for (const item of results.incomplete) {
    info(
      `axe could not judge ${item.id} on ` +
        `${item.nodes.map(node => node.target.join(", ")).join("; ")}`
    );
  }

  assertNoAxeViolations(
    results,
    "the M3 3-pane palette should meet WCAG contrast"
  );
});

/**
 * Full axe sweep, reported only.
 *
 * See the rule-selection note on the previous task for why this does not
 * assert. It exists so that a regression in any other axe rule is visible
 * in the log the moment it lands, and so that the A4 `aria-hidden="hidden"`
 * defect keeps showing up until somebody is allowed to fix it upstream.
 */
add_task(async function testAxeFullSweepReportOnly() {
  await ensure_table_view(document);
  await new Promise(about3Pane.requestAnimationFrame);

  let results;
  try {
    results = await runAxeInWindow(about3Pane, {
      axeOptions: {
        // The 3-pane is an application chrome document, not a web page. It
        // legitimately has no <main> and no page-level landmark structure.
        rules: {
          "landmark-one-main": { enabled: false },
          region: { enabled: false },
        },
      },
    });
  } catch (error) {
    todo(false, `full axe sweep could not run: ${error.message}`);
    return;
  }

  if (results.skipped) {
    todo(false, `full axe sweep skipped (${results.skippedReason})`);
    return;
  }

  info(
    `axe full sweep: ${results.passes.length} passes, ` +
      `${results.violations.length} violations`
  );
  if (results.violations.length) {
    const formatted = formatAxeViolations(results.violations);
    info(`axe findings (report only, not asserted):\n${formatted}`);
  }
  todo_is(
    results.violations.length,
    0,
    "the 3-pane should eventually be clean under the full axe ruleset — " +
      "currently blocked on upstream markup this fork must not edit " +
      "(audit A4)"
  );
});
