"use strict";

function openMaterialMailPreview() {
  const tabmail = document.getElementById("tabmail");
  if (!tabmail) {
    return;
  }
  const url = "chrome://messenger/content/materialMail.xhtml";
  const existing = tabmail.tabInfo.find(
    tab => tab.browser?.currentURI?.spec === url
  );
  if (existing) {
    tabmail.switchToTab(existing);
    return;
  }
  tabmail.openTab("contentTab", { url, linkHandler: "single-page" });
}
