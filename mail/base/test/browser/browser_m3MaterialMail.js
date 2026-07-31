/* Browser coverage for the packaged Material Mail runtime vertical slice. */

const MATERIAL_MAIL_URL = "chrome://messenger/content/materialMail.xhtml";
const MATERIAL_MAIL_TAB_PREF = "mail.material.preview.tabs";
const MATERIAL_MAIL_PREFS = [
  "mail.material.preview.settings",
  "mail.material.preview.history",
  "mail.material.preview.notifications",
  "mail.material.preview.appearance",
  MATERIAL_MAIL_TAB_PREF,
];

function waitForPaint(win) {
  return new Promise(resolve => {
    win.requestAnimationFrame(() => win.requestAnimationFrame(resolve));
  });
}

add_task(async function testMaterialMailPreviewSurface() {
  const previousPrefs = new Map();
  for (const name of MATERIAL_MAIL_PREFS) {
    const hadUserValue = Services.prefs.prefHasUserValue(name);
    previousPrefs.set(
      name,
      hadUserValue ? Services.prefs.getStringPref(name) : null
    );
    if (hadUserValue) {
      Services.prefs.clearUserPref(name);
    }
  }
  registerCleanupFunction(() => {
    for (const [name, value] of previousPrefs) {
      if (value === null) {
        if (Services.prefs.prefHasUserValue(name)) {
          Services.prefs.clearUserPref(name);
        }
      } else {
        Services.prefs.setStringPref(name, value);
      }
    }
  });

  const tabmail = document.getElementById("tabmail");
  const tab = tabmail.openTab("contentTab", {
    url: MATERIAL_MAIL_URL,
    linkHandler: "single-page",
    duplicate: true,
  });
  await BrowserTestUtils.browserLoaded(tab.browser, false, MATERIAL_MAIL_URL);
  registerCleanupFunction(() => tabmail.closeTab(tab));

  const page = tab.browser.contentDocument;
  Assert.equal(
    page.querySelectorAll('[role="tab"]').length,
    6,
    "the packaged preview exposes all six design pages"
  );
  Assert.equal(
    page.querySelectorAll('[role="tabpanel"]').length,
    6,
    "each preview tab has a corresponding panel"
  );
  Assert.ok(
    page.getElementById("mm-regex-open"),
    "the mail search exposes an anchored regex-builder trigger"
  );
  for (const id of [
    "mm-theme",
    "mm-density",
    "mm-language",
    "mm-funny-en",
    "mm-funny-zh",
    "mm-narrator",
    "mm-dimsum",
  ]) {
    Assert.ok(page.getElementById(id), `${id} is present in Settings`);
  }
  for (const id of [
    "mm-tab-strip",
    "mm-pinned-tabs",
    "mm-regular-tabs",
    "mm-tab-overflow",
    "mm-tab-overflow-count",
    "mm-tab-popover",
    "mm-tab-search",
    "mm-tab-search-regex-open",
    "mm-tab-search-count",
    "mm-tab-search-results",
    "mm-tab-context-menu",
    "mm-settings-search",
    "mm-changelog-search",
    "mm-history-search",
    "mm-notifications-search",
    "mm-notifications-filter",
    "mm-changelog-from",
    "mm-changelog-to",
    "mm-history-from",
    "mm-history-to",
    "mm-changelog-export",
    "mm-history-export",
    "mm-appearance-editor",
    "mm-appearance-surface",
    "mm-appearance-text",
    "mm-appearance-radius",
    "mm-appearance-font-size",
    "mm-appearance-weight",
    "mm-narrator-language",
    "mm-accent",
    "mm-font-family",
    "mm-font-scale",
    "mm-font-weight",
    "mm-appearance-search",
    "mm-color-picker",
    "mm-color-hue",
    "mm-color-saturation",
    "mm-color-lightness",
    "mm-color-space",
    "mm-color-space-entry",
    "mm-color-representations",
    "mm-tools-search",
    "mm-guide-list",
  ]) {
    Assert.ok(
      page.getElementById(id),
      `${id} is present in the runtime feature surface`
    );
  }

  await TestUtils.waitForCondition(
    () => page.defaultView.mmMaterialMailTabs,
    "the packaged Material tab controller initializes"
  );
  await TestUtils.waitForCondition(
    () => page.defaultView.mmMaterialMailRegex?.mounted === 8,
    "all eight packaged regex builders initialize"
  );
  await TestUtils.waitForCondition(
    () => page.defaultView.mmMaterialMailColor?.spaces === 14,
    "the packaged color translator initializes"
  );
  Assert.equal(
    page.querySelectorAll("#mm-color-space option").length,
    14,
    "all supported color spaces are mounted"
  );
  const tabController = page.defaultView.mmMaterialMailTabs;
  let tabSnapshot = tabController.snapshot();
  Assert.equal(
    tabSnapshot.state.order.length,
    6,
    "all six built-in tabs enter persisted state"
  );
  Assert.ok(
    tabSnapshot.state.pinned.includes("mail"),
    "Mail starts in the stable pinned region"
  );
  Assert.equal(
    page.getElementById("mm-tab-search-results").getAttribute("role"),
    "list",
    "the composite all-tabs result uses list semantics"
  );

  const settingsTab = page.getElementById("mm-tab-settings");
  const settingsWasPinned = tabSnapshot.state.pinned.includes("settings");
  settingsTab.dispatchEvent(
    new page.defaultView.MouseEvent("contextmenu", {
      bubbles: true,
      clientX: 48,
      clientY: 96,
    })
  );
  Assert.ok(
    !page.getElementById("mm-tab-context-menu").hidden,
    "right-click opens tab actions"
  );
  await waitForPaint(page.defaultView);
  page.getElementById("mm-tab-menu-pin").click();
  tabSnapshot = tabController.snapshot();
  Assert.equal(
    tabSnapshot.state.pinned.includes("settings"),
    !settingsWasPinned,
    "the tab action toggles the dedicated pinned region"
  );
  const persistedTabs = JSON.parse(
    Services.prefs.getStringPref(MATERIAL_MAIL_TAB_PREF)
  );
  Assert.deepEqual(
    persistedTabs.order,
    tabSnapshot.state.order,
    "tab order is written to the versioned profile preference"
  );
  settingsTab.dispatchEvent(
    new page.defaultView.MouseEvent("contextmenu", {
      bubbles: true,
      clientX: 48,
      clientY: 96,
    })
  );
  await waitForPaint(page.defaultView);
  page.getElementById("mm-tab-menu-pin").click();
  Assert.equal(
    tabController.snapshot().state.pinned.includes("settings"),
    settingsWasPinned,
    "the pin action is reversible"
  );

  tabSnapshot = tabController.snapshot();
  const regularBefore = tabSnapshot.state.order.filter(
    id => !tabSnapshot.state.pinned.includes(id)
  );
  Assert.greaterOrEqual(
    regularBefore.length,
    2,
    "ordinary tabs expose a reorder pair"
  );
  const movingTab = page.getElementById(`mm-tab-${regularBefore[0]}`);
  movingTab.dispatchEvent(
    new page.defaultView.KeyboardEvent("keydown", {
      bubbles: true,
      ctrlKey: true,
      shiftKey: true,
      key: "ArrowRight",
    })
  );
  let regularAfter = tabController
    .snapshot()
    .state.order.filter(
      id => !tabController.snapshot().state.pinned.includes(id)
    );
  Assert.deepEqual(
    regularAfter.slice(0, 2),
    [regularBefore[1], regularBefore[0]],
    "Ctrl+Shift+ArrowRight reorders within the ordinary region"
  );
  movingTab.dispatchEvent(
    new page.defaultView.KeyboardEvent("keydown", {
      bubbles: true,
      ctrlKey: true,
      shiftKey: true,
      key: "ArrowLeft",
    })
  );
  regularAfter = tabController
    .snapshot()
    .state.order.filter(
      id => !tabController.snapshot().state.pinned.includes(id)
    );
  Assert.deepEqual(
    regularAfter,
    regularBefore,
    "the keyboard reorder can be reversed"
  );

  const overflowButton = page.getElementById("mm-tab-overflow");
  overflowButton.click();
  await waitForPaint(page.defaultView);
  Assert.ok(
    !page.getElementById("mm-tab-popover").hidden,
    "all-tabs search opens at its anchor"
  );
  Assert.equal(
    page.querySelectorAll("#mm-tab-search-results [role=listitem]").length,
    6,
    "all visible, hidden, and pinned tabs remain discoverable"
  );
  const tabSearch = page.getElementById("mm-tab-search");
  tabSearch.value = "Tools";
  tabSearch.dispatchEvent(
    new page.defaultView.Event("input", { bubbles: true })
  );
  Assert.equal(
    page.querySelectorAll("#mm-tab-search-results [role=listitem]").length,
    1,
    "the all-tabs field filters its own local labels"
  );
  page.defaultView.mmSetRegexState("tabs", {
    mode: "regex",
    pattern: "^(Mail|Tools)",
    flags: "i",
  });
  Assert.equal(
    page.querySelectorAll("#mm-tab-search-results [role=listitem]").length,
    2,
    "the adjacent regex builder state filters the same tab catalogue"
  );
  page.defaultView.mmSetRegexState("tabs", {
    mode: "regex",
    pattern: "^(a+)+$",
    flags: "",
  });
  Assert.equal(
    page.querySelectorAll("#mm-tab-search-results [role=listitem]").length,
    0,
    "unsafe nested quantifiers are rejected before tab labels are evaluated"
  );
  page.dispatchEvent(
    new page.defaultView.KeyboardEvent("keydown", {
      bubbles: true,
      key: "Escape",
    })
  );
  await new Promise(resolve => page.defaultView.requestAnimationFrame(resolve));
  Assert.ok(
    page.getElementById("mm-tab-popover").hidden,
    "Escape dismisses all-tabs search"
  );
  Assert.equal(
    page.activeElement,
    overflowButton,
    "dismissal returns focus to the anchor"
  );

  settingsTab.dispatchEvent(
    new page.defaultView.MouseEvent("contextmenu", {
      bubbles: true,
      shiftKey: true,
      clientX: 48,
      clientY: 96,
    })
  );
  Assert.ok(
    !page.getElementById("mm-appearance-editor").hidden,
    "Shift+right-click hands the exact tab to its anchored appearance editor"
  );
  page.getElementById("mm-appearance-close").click();

  page.getElementById("mm-tab-settings").click();
  Assert.ok(
    !page.getElementById("mm-page-settings").hidden,
    "Settings becomes the visible tabpanel"
  );
  const density = page.getElementById("mm-density");
  density.value = "relaxed";
  density.dispatchEvent(
    new page.defaultView.Event("change", { bubbles: true })
  );
  Assert.equal(
    page.documentElement.dataset.density,
    "relaxed",
    "density changes apply immediately"
  );
  const language = page.getElementById("mm-language");
  language.value = "both";
  language.dispatchEvent(
    new page.defaultView.Event("change", { bubbles: true })
  );
  const funnyPreview = page.getElementById("mm-funny-preview");
  const neutralPreview = funnyPreview.textContent;
  const funnyEnglish = page.getElementById("mm-funny-en");
  funnyEnglish.value = "5";
  funnyEnglish.dispatchEvent(
    new page.defaultView.Event("input", { bubbles: true })
  );
  Assert.notEqual(
    funnyPreview.textContent,
    neutralPreview,
    "English funny level changes rendered copy"
  );
  const englishFunnyPreview = funnyPreview.textContent;
  const funnyCantonese = page.getElementById("mm-funny-zh");
  funnyCantonese.value = "5";
  funnyCantonese.dispatchEvent(
    new page.defaultView.Event("input", { bubbles: true })
  );
  Assert.notEqual(
    funnyPreview.textContent,
    englishFunnyPreview,
    "Cantonese funny level changes rendered copy"
  );
  const persistedSettings = JSON.parse(
    Services.prefs.getStringPref("mail.material.preview.settings")
  );
  Assert.equal(
    persistedSettings.density,
    "relaxed",
    "density persists in the profile"
  );
  Assert.equal(
    persistedSettings.language,
    "both",
    "language mode persists in the profile"
  );
  Assert.equal(
    persistedSettings.funnyEn,
    5,
    "English funny level persists independently"
  );
  Assert.equal(
    persistedSettings.funnyZh,
    5,
    "Cantonese funny level persists independently"
  );

  page.getElementById("mm-tab-tools").click();
  Assert.greaterOrEqual(
    page.getElementById("mm-guide-list").querySelectorAll("article").length,
    14,
    "Tools exposes the full design-folder feature guide"
  );
  const guideSearch = page.getElementById("mm-tools-search");
  guideSearch.value = "tabs";
  guideSearch.dispatchEvent(
    new page.defaultView.Event("input", { bubbles: true })
  );
  Assert.equal(
    page.getElementById("mm-guide-list").querySelectorAll("article").length,
    1,
    "Feature guide search filters its own local catalogue"
  );
  guideSearch.value = "";
  guideSearch.dispatchEvent(
    new page.defaultView.Event("input", { bubbles: true })
  );
  await waitForPaint(page.defaultView);
  const guideButton = page.querySelector("#mm-guide-list .mm-guide-read");
  guideButton.click();
  Assert.ok(
    !page.getElementById("mm-feature-details").hidden,
    "A guide result opens its anchored article surface"
  );
  Assert.equal(
    page.querySelectorAll("#mm-feature-details-body section").length,
    5,
    "Each guide article renders all five documented contract sections"
  );
  page.getElementById("mm-feature-details-close").click();
  const guideRegexPanel = page.getElementById("mm-tools-regex-panel");
  const guideRegexLauncher = page.getElementById("mm-tools-regex-open");
  Assert.equal(
    guideRegexLauncher.getAttribute("aria-haspopup"),
    "dialog",
    "the packaged regex launcher module mounts the Tools builder"
  );
  guideRegexLauncher.click();
  await TestUtils.waitForCondition(
    () =>
      guideRegexPanel.classList.contains("regex-builder-panel") &&
      guideRegexPanel.querySelector("[data-regex-pattern]"),
    "the Tools builder renders after its mounted launcher opens it"
  );
  Assert.ok(
    !guideRegexPanel.hidden,
    "The Tools regex builder opens at its field"
  );
  Assert.ok(
    guideRegexPanel.querySelector("[data-regex-pattern]"),
    "The mounted builder exposes its synchronized pattern editor"
  );
  guideRegexPanel.querySelector(".regex-builder-close").click();

  page.getElementById("mm-tab-changelog").click();
  Assert.greaterOrEqual(
    page.getElementById("mm-changelog-list").querySelectorAll("article").length,
    3,
    "Changelog renders all recorded release entries"
  );
  const changelogSearch = page.getElementById("mm-changelog-search");
  changelogSearch.value = "Regex";
  changelogSearch.dispatchEvent(
    new page.defaultView.Event("input", { bubbles: true })
  );
  Assert.equal(
    page.getElementById("mm-changelog-list").querySelectorAll("article").length,
    1,
    "Changelog search composes with the local release data"
  );

  page.getElementById("mm-tab-history").click();
  Assert.greaterOrEqual(
    page
      .getElementById("mm-history-actions")
      .querySelectorAll("input[type=checkbox]").length,
    3,
    "History derives action filters from recorded revisions"
  );
  Assert.greaterOrEqual(
    page.getElementById("mm-history-list").querySelectorAll("article").length,
    3,
    "History renders append-only revisions"
  );
  const historyBeforeRestore = JSON.parse(
    Services.prefs.getStringPref("mail.material.preview.history")
  ).length;
  page.querySelector("[data-history-restore]").click();
  const restoredHistory = JSON.parse(
    Services.prefs.getStringPref("mail.material.preview.history")
  );
  Assert.equal(
    restoredHistory.length,
    historyBeforeRestore + 1,
    "Restoring a revision appends a new persisted history record"
  );
  Assert.equal(
    restoredHistory[0].action,
    "restored",
    "The appended revision records the real restore action"
  );

  page.getElementById("mm-tab-notifications").click();
  Assert.greaterOrEqual(
    page.getElementById("mm-notification-list").querySelectorAll("article")
      .length,
    3,
    "Notifications renders a reviewable stack"
  );
  page.getElementById("mm-notifications-filter").value = "unread";
  page
    .getElementById("mm-notifications-filter")
    .dispatchEvent(new page.defaultView.Event("change", { bubbles: true }));
  Assert.equal(
    page.getElementById("mm-notification-list").querySelectorAll("article")
      .length,
    2,
    "Notifications filter exposes unread records"
  );
  page.querySelector("[data-notification-dismiss]").click();
  Assert.equal(
    page.getElementById("mm-notification-list").querySelectorAll("article")
      .length,
    1,
    "Dismissing an unread notification updates the active filtered view"
  );
  Assert.ok(
    JSON.parse(
      Services.prefs.getStringPref("mail.material.preview.notifications")
    ).some(row => row.dismissed),
    "Notification dismissal persists while retaining the record"
  );

  const appearanceTarget = page.querySelector(".mm-card");
  appearanceTarget.dispatchEvent(
    new page.defaultView.MouseEvent("contextmenu", {
      bubbles: true,
      clientX: 40,
      clientY: 40,
    })
  );
  Assert.ok(
    !page.getElementById("mm-appearance-editor").hidden,
    "Context menu opens the anchored appearance editor"
  );
  Assert.greaterOrEqual(
    page.getElementById("mm-color-space").options.length,
    14,
    "Appearance editor exposes all required color spaces"
  );
  page.getElementById("mm-color-hue").value = "120";
  page
    .getElementById("mm-color-hue")
    .dispatchEvent(new page.defaultView.Event("input", { bubbles: true }));
  Assert.ok(
    /^#/.test(page.getElementById("mm-appearance-surface-text").value),
    "Continuous color control writes a local hex value"
  );
  const firstRepresentation = page.querySelector(
    "#mm-color-representations .mm-color-representation"
  );
  Assert.equal(
    firstRepresentation.querySelector("code").textContent,
    firstRepresentation.querySelector("[data-color-copy]").dataset.colorCopy,
    "Color representations keep displayed and copy values synchronized"
  );
  const persistedAppearance = JSON.parse(
    Services.prefs.getStringPref("mail.material.preview.appearance")
  );
  Assert.ok(
    Object.keys(persistedAppearance).length,
    "appearance overrides persist in the Thunderbird profile"
  );
});

add_task(async function testPersistedMarkupLikeValuesStayLiteral() {
  const hostileHistory = '<img id="mm-injected-history" src="x">';
  const hostileNotification = '<img id="mm-injected-notification" src="x">';
  const hostileAction = 'created"][data-injected="true';
  Services.prefs.setStringPref(
    "mail.material.preview.settings",
    JSON.stringify({
      language: "en",
      funnyEn: 1,
      funnyZh: 1,
      hasLaunched: true,
    })
  );
  Services.prefs.setStringPref(
    "mail.material.preview.history",
    JSON.stringify([
      {
        id: "hostile-history",
        date: "2026-07-31",
        action: hostileAction,
        title: [hostileHistory, hostileHistory],
        detail: [hostileHistory, hostileHistory],
      },
    ])
  );
  Services.prefs.setStringPref(
    "mail.material.preview.notifications",
    JSON.stringify([
      {
        id: "hostile-notification",
        kind: 'warning injected" class="mm-injected',
        unread: true,
        title: [hostileNotification, hostileNotification],
        detail: [hostileNotification, hostileNotification],
      },
    ])
  );

  const tabmail = document.getElementById("tabmail");
  const tab = tabmail.openTab("contentTab", {
    url: MATERIAL_MAIL_URL,
    linkHandler: "single-page",
    duplicate: true,
  });
  await BrowserTestUtils.browserLoaded(tab.browser, false, MATERIAL_MAIL_URL);
  registerCleanupFunction(() => tabmail.closeTab(tab));

  const page = tab.browser.contentDocument;
  await TestUtils.waitForCondition(
    () => page.defaultView.mmMaterialMailTabs,
    "the hostile-value fixture initializes the packaged runtime"
  );
  page.getElementById("mm-tab-history").click();
  Assert.ok(
    page.getElementById("mm-history-list").textContent.includes(hostileHistory),
    "Persisted markup-like history values render as literal text"
  );
  Assert.ok(
    !page.getElementById("mm-injected-history"),
    "Persisted history text cannot inject an element"
  );
  Assert.equal(
    page.querySelector("#mm-history-actions input").dataset.historyAction,
    hostileAction,
    "History action values with selector punctuation remain intact"
  );

  page.getElementById("mm-tab-notifications").click();
  page.getElementById("mm-notifications-filter").value = "all";
  page
    .getElementById("mm-notifications-filter")
    .dispatchEvent(new page.defaultView.Event("change", { bubbles: true }));
  const notification = page.querySelector("#mm-notification-list article");
  Assert.ok(
    notification.textContent.includes(hostileNotification),
    "Persisted markup-like notification values render as literal text"
  );
  Assert.ok(
    !page.getElementById("mm-injected-notification"),
    "Persisted notification text cannot inject an element"
  );
  Assert.ok(
    notification.classList.contains("mm-notification-info"),
    "Unknown persisted notification kinds fall back to the whitelisted info class"
  );
});
