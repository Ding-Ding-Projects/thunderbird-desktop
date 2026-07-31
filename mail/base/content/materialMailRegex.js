import { RegexBuilder } from "chrome://messenger/content/materialRegexBuilder.mjs";

function mountRegex({ inputId, anchorId, panelId, key, scope }) {
  const input = document.getElementById(inputId);
  const anchor = document.getElementById(anchorId);
  const panel = document.getElementById(panelId);
  if (!input || !anchor || !panel) return;
  new RegexBuilder({
    anchor,
    input,
    panel,
    scope,
    onApply: state => window.mmSetRegexState?.(key, state),
    onStatus: message => {
      const toast = document.getElementById("mm-toast");
      if (!toast) return;
      toast.textContent = `${message.en} · ${message.zh}`;
      toast.hidden = false;
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  mountRegex({ inputId: "mm-mail-search", anchorId: "mm-regex-open", panelId: "mm-regex-panel", key: "mail", scope: "Applies to this mail search field · 套用到此郵件搜尋欄" });
  mountRegex({ inputId: "mm-settings-search", anchorId: "mm-settings-regex-open", panelId: "mm-settings-regex-panel", key: "settings", scope: "Applies to this settings search field · 套用到此設定搜尋欄" });
  mountRegex({ inputId: "mm-changelog-search", anchorId: "mm-changelog-regex-open", panelId: "mm-changelog-regex-panel", key: "changelog", scope: "Applies to this changelog search field · 套用到此更新記錄搜尋欄" });
  mountRegex({ inputId: "mm-history-search", anchorId: "mm-history-regex-open", panelId: "mm-history-regex-panel", key: "history", scope: "Applies to this history search field · 套用到此歷史搜尋欄" });
  mountRegex({ inputId: "mm-notifications-search", anchorId: "mm-notifications-regex-open", panelId: "mm-notifications-regex-panel", key: "notifications", scope: "Applies to this notifications search field · 套用到此通知搜尋欄" });
});
