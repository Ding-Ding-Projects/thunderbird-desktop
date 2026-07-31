import { RegexBuilder } from "chrome://messenger/content/materialRegexBuilder.mjs";

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("mm-mail-search");
  const anchor = document.getElementById("mm-regex-open");
  const panel = document.getElementById("mm-regex-panel");
  new RegexBuilder({
    anchor,
    input,
    panel,
    scope: "Applies to this mail search field · 套用到此郵件搜尋欄",
    onStatus: message => {
      const toast = document.getElementById("mm-toast");
      toast.textContent = `${message.en} · ${message.zh}`;
      toast.hidden = false;
    },
  });
});
