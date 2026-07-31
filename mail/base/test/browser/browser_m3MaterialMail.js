/* Browser coverage for the packaged Material Mail runtime vertical slice. */

const MATERIAL_MAIL_URL = "chrome://messenger/content/materialMail.xhtml";

add_task(async function testMaterialMailPreviewSurface() {
  const tabmail = document.getElementById("tabmail");
  const tab = tabmail.openTab("contentTab", {
    url: MATERIAL_MAIL_URL,
    linkHandler: "single-page",
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
    Assert.ok(page.getElementById(id), `${id} is present in the runtime feature surface`);
  }

  await BrowserTestUtils.waitForCondition(
    () => page.defaultView.mmMaterialMailTabs,
    "the packaged Material tab controller initializes"
  );
  const tabController = page.defaultView.mmMaterialMailTabs;
  let tabSnapshot = tabController.snapshot();
  Assert.equal(tabSnapshot.state.order.length, 6, "all six built-in tabs enter persisted state");
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
  Assert.ok(!page.getElementById("mm-tab-context-menu").hidden, "right-click opens tab actions");
  page.getElementById("mm-tab-menu-pin").click();
  tabSnapshot = tabController.snapshot();
  Assert.equal(
    tabSnapshot.state.pinned.includes("settings"),
    !settingsWasPinned,
    "the tab action toggles the dedicated pinned region"
  );
  const persistedTabs = JSON.parse(
    page.defaultView.localStorage.getItem("mail.material.preview.tabs")
  );
  Assert.deepEqual(
    persistedTabs.order,
    tabSnapshot.state.order,
    "tab order is written to the versioned local record"
  );
  settingsTab.dispatchEvent(
    new page.defaultView.MouseEvent("contextmenu", {
      bubbles: true,
      clientX: 48,
      clientY: 96,
    })
  );
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
  Assert.greaterOrEqual(regularBefore.length, 2, "ordinary tabs expose a reorder pair");
  const movingTab = page.getElementById(`mm-tab-${regularBefore[0]}`);
  movingTab.dispatchEvent(
    new page.defaultView.KeyboardEvent("keydown", {
      bubbles: true,
      ctrlKey: true,
      shiftKey: true,
      key: "ArrowRight",
    })
  );
  let regularAfter = tabController.snapshot().state.order.filter(
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
  regularAfter = tabController.snapshot().state.order.filter(
    id => !tabController.snapshot().state.pinned.includes(id)
  );
  Assert.deepEqual(regularAfter, regularBefore, "the keyboard reorder can be reversed");

  const overflowButton = page.getElementById("mm-tab-overflow");
  overflowButton.click();
  await new Promise(resolve => page.defaultView.requestAnimationFrame(resolve));
  Assert.ok(!page.getElementById("mm-tab-popover").hidden, "all-tabs search opens at its anchor");
  Assert.equal(
    page.querySelectorAll("#mm-tab-search-results [role=listitem]").length,
    6,
    "all visible, hidden, and pinned tabs remain discoverable"
  );
  const tabSearch = page.getElementById("mm-tab-search");
  tabSearch.value = "Tools";
  tabSearch.dispatchEvent(new page.defaultView.Event("input", { bubbles: true }));
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
    new page.defaultView.KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
  );
  await new Promise(resolve => page.defaultView.requestAnimationFrame(resolve));
  Assert.ok(page.getElementById("mm-tab-popover").hidden, "Escape dismisses all-tabs search");
  Assert.equal(page.activeElement, overflowButton, "dismissal returns focus to the anchor");

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
  density.dispatchEvent(new page.defaultView.Event("change", { bubbles: true }));
  Assert.equal(
    page.documentElement.dataset.density,
    "relaxed",
    "density changes apply immediately"
  );
  const language = page.getElementById("mm-language");
  language.value = "both";
  language.dispatchEvent(new page.defaultView.Event("change", { bubbles: true }));
  const funnyPreview = page.getElementById("mm-funny-preview");
  const neutralPreview = funnyPreview.textContent;
  const funnyEnglish = page.getElementById("mm-funny-en");
  funnyEnglish.value = "5";
  funnyEnglish.dispatchEvent(new page.defaultView.Event("input", { bubbles: true }));
  Assert.notEqual(funnyPreview.textContent, neutralPreview, "English funny level changes rendered copy");
  const englishFunnyPreview = funnyPreview.textContent;
  const funnyCantonese = page.getElementById("mm-funny-zh");
  funnyCantonese.value = "5";
  funnyCantonese.dispatchEvent(new page.defaultView.Event("input", { bubbles: true }));
  Assert.notEqual(funnyPreview.textContent, englishFunnyPreview, "Cantonese funny level changes rendered copy");

  page.getElementById("mm-tab-tools").click();
  Assert.ok(
    page.getElementById("mm-guide-list").querySelectorAll("article").length >= 14,
    "Tools exposes the full design-folder feature guide"
  );
  const guideSearch = page.getElementById("mm-tools-search");
  guideSearch.value = "tabs";
  guideSearch.dispatchEvent(new page.defaultView.Event("input", { bubbles: true }));
  Assert.equal(
    page.getElementById("mm-guide-list").querySelectorAll("article").length,
    1,
    "Feature guide search filters its own local catalogue"
  );

  page.getElementById("mm-tab-changelog").click();
  Assert.ok(
    page.getElementById("mm-changelog-list").querySelectorAll("article").length >= 3,
    "Changelog renders all recorded release entries"
  );
  const changelogSearch = page.getElementById("mm-changelog-search");
  changelogSearch.value = "Regex";
  changelogSearch.dispatchEvent(new page.defaultView.Event("input", { bubbles: true }));
  Assert.equal(
    page.getElementById("mm-changelog-list").querySelectorAll("article").length,
    1,
    "Changelog search composes with the local release data"
  );

  page.getElementById("mm-tab-history").click();
  Assert.ok(
    page.getElementById("mm-history-actions").querySelectorAll("input[type=checkbox]").length >= 3,
    "History derives action filters from recorded revisions"
  );
  Assert.ok(
    page.getElementById("mm-history-list").querySelectorAll("article").length >= 3,
    "History renders append-only revisions"
  );

  page.getElementById("mm-tab-notifications").click();
  Assert.ok(
    page.getElementById("mm-notification-list").querySelectorAll("article").length >= 3,
    "Notifications renders a reviewable stack"
  );
  page.getElementById("mm-notifications-filter").value = "unread";
  page.getElementById("mm-notifications-filter").dispatchEvent(new page.defaultView.Event("change", { bubbles: true }));
  Assert.equal(
    page.getElementById("mm-notification-list").querySelectorAll("article").length,
    2,
    "Notifications filter exposes unread records"
  );

  const appearanceTarget = page.querySelector(".mm-card");
  appearanceTarget.dispatchEvent(new page.defaultView.MouseEvent("contextmenu", { bubbles: true, clientX: 40, clientY: 40 }));
  Assert.ok(
    !page.getElementById("mm-appearance-editor").hidden,
    "Context menu opens the anchored appearance editor"
  );
  Assert.ok(
    page.getElementById("mm-color-space").options.length >= 14,
    "Appearance editor exposes all required color spaces"
  );
  page.getElementById("mm-color-hue").value = "120";
  page.getElementById("mm-color-hue").dispatchEvent(new page.defaultView.Event("input", { bubbles: true }));
  Assert.match(
    page.getElementById("mm-appearance-surface-text").value,
    /^#/,
    "Continuous color control writes a local hex value"
  );
});
