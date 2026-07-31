/* Material Mail's anchored, field-specific regex-builder launchers. */
import { RegexBuilder } from "chrome://messenger/content/materialRegexBuilder.mjs";

function mountRegex({ inputId, anchorId, panelId, key, scope }) {
  const input = document.getElementById(inputId);
  const anchor = document.getElementById(anchorId);
  const panel = document.getElementById(panelId);
  if (!input || !anchor || !panel) {
    return false;
  }
  new RegexBuilder({
    anchor,
    input,
    panel,
    scope,
    onApply: state => window.mmSetRegexState?.(key, state),
    onStatus: message => {
      const toast = document.getElementById("mm-toast");
      if (!toast) {
        return;
      }
      toast.textContent = `${message.en} · ${message.zh}`;
      toast.hidden = false;
    },
  });
  return true;
}

const REGEX_TARGETS = Object.freeze([
  {
    inputId: "mm-mail-search",
    anchorId: "mm-regex-open",
    panelId: "mm-regex-panel",
    key: "mail",
    scope: "Applies to this mail search field · 套用到此郵件搜尋欄",
  },
  {
    inputId: "mm-settings-search",
    anchorId: "mm-settings-regex-open",
    panelId: "mm-settings-regex-panel",
    key: "settings",
    scope: "Applies to this settings search field · 套用到此設定搜尋欄",
  },
  {
    inputId: "mm-changelog-search",
    anchorId: "mm-changelog-regex-open",
    panelId: "mm-changelog-regex-panel",
    key: "changelog",
    scope: "Applies to this changelog search field · 套用到此更新記錄搜尋欄",
  },
  {
    inputId: "mm-history-search",
    anchorId: "mm-history-regex-open",
    panelId: "mm-history-regex-panel",
    key: "history",
    scope: "Applies to this history search field · 套用到此歷史搜尋欄",
  },
  {
    inputId: "mm-notifications-search",
    anchorId: "mm-notifications-regex-open",
    panelId: "mm-notifications-regex-panel",
    key: "notifications",
    scope: "Applies to this notifications search field · 套用到此通知搜尋欄",
  },
  {
    inputId: "mm-appearance-search",
    anchorId: "mm-appearance-regex-open",
    panelId: "mm-appearance-regex-panel",
    key: "appearance",
    scope: "Applies to this appearance editor · 套用到此外觀編輯器",
  },
  {
    inputId: "mm-tools-search",
    anchorId: "mm-tools-regex-open",
    panelId: "mm-tools-regex-panel",
    key: "tools",
    scope: "Applies to this feature guide · 套用到此功能指南",
  },
  {
    inputId: "mm-tab-search",
    anchorId: "mm-tab-search-regex-open",
    panelId: "mm-tab-search-regex-panel",
    key: "tabs",
    scope:
      "Searches every Material Mail tab in this window · 搜尋呢個視窗入面全部 Material Mail 分頁",
  },
]);

export function initMaterialMailRegex() {
  if (window.mmMaterialMailRegex) {
    return window.mmMaterialMailRegex;
  }
  const mounted = REGEX_TARGETS.reduce(
    (count, target) => count + Number(mountRegex(target)),
    0
  );
  window.mmMaterialMailRegex = Object.freeze({ mounted });
  return window.mmMaterialMailRegex;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMaterialMailRegex, {
    once: true,
  });
} else {
  initMaterialMailRegex();
}
