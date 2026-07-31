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
  ]) {
    Assert.ok(page.getElementById(id), `${id} is present in the runtime feature surface`);
  }

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
