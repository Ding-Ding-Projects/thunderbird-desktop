/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Small, independent runtime smoke coverage for the Material Design 3 layer.
 *
 * This file intentionally does not share helpers or assertions with
 * browser_m3Accessibility.js. Its job is narrower: prove that the stylesheets
 * are attached to the real about:3pane document, that their custom properties
 * project through the live root attributes, that the lightweight-theme guard
 * stands down, and that one visible pane is actually painted by the CSS layer.
 *
 * No upstream markup or behavior is asserted here. A missing M3 sheet, token,
 * guard, density arm, or visible M3 selector is therefore a real failure of
 * this fork, not an upstream failure re-labelled as a TODO.
 */

const tabmail = document.getElementById("tabmail");
const about3Pane = tabmail.currentAbout3Pane;
const about3PaneDocument = about3Pane.document;
const root = about3PaneDocument.documentElement;

const M3_RUNTIME_SHEETS = [
  "chrome://messenger/skin/material-tokens.css",
  "chrome://messenger/skin/m3-layout.css",
  "chrome://messenger/skin/m3-folder-pane.css",
  "chrome://messenger/skin/m3-thread-pane.css",
  "chrome://messenger/skin/m3-quick-filter.css",
  "chrome://messenger/skin/m3-message-pane.css",
];

function nextFrame() {
  return new Promise(resolve => about3Pane.requestAnimationFrame(resolve));
}

function saveAttribute(name) {
  return root.hasAttribute(name) ? root.getAttribute(name) : null;
}

function restoreAttribute(name, value) {
  if (value === null) {
    root.removeAttribute(name);
  } else {
    root.setAttribute(name, value);
  }
}

function setAttributeOrRemove(name, value) {
  if (value === null) {
    root.removeAttribute(name);
  } else {
    root.setAttribute(name, value);
  }
}

add_setup(async function prepareVisible3Pane() {
  // Keep this test about the real three-pane document. This state change uses
  // upstream's public controller and does not edit or inspect its markup.
  about3Pane.restoreState({
    folderPaneVisible: true,
    messagePaneVisible: true,
  });
  await nextFrame();
});

add_task(async function testM3RuntimeSheetsAreLoadedInTheDocument() {
  const sheets = Array.from(about3PaneDocument.styleSheets);
  const hrefs = sheets.map(sheet => sheet.href);

  for (const href of M3_RUNTIME_SHEETS) {
    const sheet = sheets.find(candidate => candidate.href === href);
    Assert.ok(
      sheet,
      `${href} must be present in the live about:3pane document stylesheet list`
    );
    if (!sheet) {
      continue;
    }

    // href alone can be satisfied by a link that failed to parse. Reading the
    // same-origin CSSOM makes this an actual document-loading check.
    let ruleCount;
    try {
      ruleCount = sheet.cssRules.length;
    } catch (error) {
      Assert.ok(
        false,
        `${href} CSSOM should be readable in chrome: ${error.message}`
      );
      continue;
    }
    Assert.greater(ruleCount, 0, `${href} should contain parsed CSS rules`);
  }

  const stockIndex = hrefs.indexOf("chrome://messenger/skin/about3Pane.css");
  Assert.greater(stockIndex, -1, "about3Pane.css must be in the live document");
  Assert.less(
    hrefs.indexOf(M3_RUNTIME_SHEETS[0]),
    stockIndex,
    "material-tokens.css must load before about3Pane.css"
  );
  for (const href of M3_RUNTIME_SHEETS.slice(1)) {
    Assert.greater(
      hrefs.indexOf(href),
      stockIndex,
      `${href} must load after about3Pane.css`
    );
  }
});

add_task(async function testM3RuntimeTokenProjections() {
  const originalSeed = saveAttribute("data-m3-seed");
  const originalTheme = saveAttribute("data-m3-theme");

  try {
    const arms = [
      {
        seed: "blue",
        theme: "light",
        primary: "#0b57d0",
        surface: "#fef7ff",
      },
      {
        seed: "green",
        theme: "dark",
        primary: "#6dd58c",
        surface: "#141218",
      },
    ];

    for (const arm of arms) {
      root.setAttribute("data-m3-seed", arm.seed);
      root.setAttribute("data-m3-theme", arm.theme);
      await nextFrame();

      const style = about3Pane.getComputedStyle(root);
      Assert.equal(
        style.getPropertyValue("--m3-primary").trim(),
        arm.primary,
        `the ${arm.seed}/${arm.theme} root projection should select --m3-primary`
      );
      Assert.equal(
        style.getPropertyValue("--m3-surface").trim(),
        arm.surface,
        `the ${arm.seed}/${arm.theme} root projection should select --m3-surface`
      );
    }

    const threadPane = about3PaneDocument.getElementById("threadPane");
    Assert.ok(threadPane, "#threadPane must exist in the loaded 3-pane document");
    if (threadPane) {
      Assert.notEqual(
        about3Pane
          .getComputedStyle(threadPane)
          .getPropertyValue("--m3-tp-focus-ring")
          .trim(),
        "",
        "the thread-pane sheet should project its local derived token"
      );
    }
  } finally {
    restoreAttribute("data-m3-seed", originalSeed);
    restoreAttribute("data-m3-theme", originalTheme);
    await nextFrame();
  }
});

add_task(async function testM3RuntimeDensityArms() {
  const originalUidensity = saveAttribute("uidensity");
  const originalDensity = saveAttribute("data-m3-density");

  const arms = [
    {
      name: "comfortable default",
      uidensity: null,
      density: null,
      gap: "2px",
      listRow: "36px",
    },
    {
      name: "compact Thunderbird attribute",
      uidensity: "compact",
      density: null,
      gap: "1px",
      listRow: "28px",
    },
    {
      name: "relaxed Thunderbird attribute",
      uidensity: "touch",
      density: null,
      gap: "4px",
      listRow: "48px",
    },
    {
      name: "compact design attribute",
      uidensity: null,
      density: "compact",
      gap: "1px",
      listRow: "28px",
    },
    {
      name: "relaxed design attribute",
      uidensity: null,
      density: "relaxed",
      gap: "4px",
      listRow: "48px",
    },
  ];

  try {
    for (const arm of arms) {
      setAttributeOrRemove("uidensity", arm.uidensity);
      setAttributeOrRemove("data-m3-density", arm.density);
      await nextFrame();

      const style = about3Pane.getComputedStyle(root);
      Assert.equal(
        style.getPropertyValue("--m3-gap").trim(),
        arm.gap,
        `--m3-gap should project the ${arm.name} density arm`
      );
      Assert.equal(
        style.getPropertyValue("--m3-list-row").trim(),
        arm.listRow,
        `--m3-list-row should project the ${arm.name} density arm`
      );
    }
  } finally {
    restoreAttribute("uidensity", originalUidensity);
    restoreAttribute("data-m3-density", originalDensity);
    await nextFrame();
  }
});

add_task(async function testM3RuntimeLightweightThemeBoundary() {
  const originalTheme = saveAttribute("data-m3-theme");
  const originalSeed = saveAttribute("data-m3-seed");
  const originalLwtheme = saveAttribute("lwtheme");
  const originalSidebarBackground = root.style.getPropertyValue(
    "--sidebar-background"
  );
  const originalSidebarPriority = root.style.getPropertyPriority(
    "--sidebar-background"
  );
  const folderPane = about3PaneDocument.getElementById("folderPane");

  Assert.ok(folderPane, "#folderPane must exist before testing the theme guard");
  if (!folderPane) {
    return;
  }

  const themeBackground = "rgb(17, 34, 51)";
  try {
    root.setAttribute("data-m3-seed", "purple");
    root.setAttribute("data-m3-theme", "light");
    root.style.setProperty("--sidebar-background", themeBackground);
    root.removeAttribute("lwtheme");
    await nextFrame();

    const m3Background = about3Pane.getComputedStyle(folderPane).backgroundColor;
    Assert.equal(
      m3Background,
      "rgb(254, 247, 255)",
      "without lwtheme, #folderPane should receive the M3 surface"
    );
    Assert.notEqual(
      m3Background,
      themeBackground,
      "the control value must not masquerade as a theme while lwtheme is absent"
    );

    root.setAttribute("lwtheme", "true");
    await nextFrame();
    Assert.equal(
      about3Pane.getComputedStyle(folderPane).backgroundColor,
      themeBackground,
      "with lwtheme, the M3 pane fill must stand down for the theme surface"
    );
  } finally {
    restoreAttribute("data-m3-seed", originalSeed);
    restoreAttribute("data-m3-theme", originalTheme);
    restoreAttribute("lwtheme", originalLwtheme);
    if (originalSidebarBackground) {
      root.style.setProperty(
        "--sidebar-background",
        originalSidebarBackground,
        originalSidebarPriority
      );
    } else {
      root.style.removeProperty("--sidebar-background");
    }
    await nextFrame();
  }
});

add_task(async function testM3RuntimeVisibleThreePaneSelector() {
  const folderPane = about3PaneDocument.getElementById("folderPane");
  Assert.ok(folderPane, "#folderPane must be present in about:3pane");
  if (!folderPane) {
    return;
  }

  Assert.ok(
    BrowserTestUtils.isVisible(folderPane),
    "#folderPane should be visible in the restored three-pane layout"
  );

  const style = about3Pane.getComputedStyle(folderPane);
  Assert.greater(
    parseFloat(style.borderStartStartRadius),
    0,
    "the visible #folderPane should receive the M3 rounded-corner selector"
  );
  Assert.notEqual(
    style.backgroundColor,
    "transparent",
    "the visible #folderPane should resolve a painted surface"
  );
});
