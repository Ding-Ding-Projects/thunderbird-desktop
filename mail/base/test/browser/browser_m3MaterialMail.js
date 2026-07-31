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
});
