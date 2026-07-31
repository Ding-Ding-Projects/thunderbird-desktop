/* Material Mail preview controls. The preview is local-first and does not
 * alter Thunderbird's existing mail behavior layer. */
"use strict";

const STORAGE_KEY = "mail.material.preview.settings";
const DEFAULTS = Object.freeze({ theme: "light", density: "comfortable", language: "en", funnyEn: 2, funnyZh: 3, narrator: false, dimsum: true });
let settings = { ...DEFAULTS };

function readSettings() {
  try { settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch (error) { console.warn("Material preview preferences unavailable", error); }
}

function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (error) { showToast("Preferences could not be persisted locally."); }
}

function showToast(message) {
  const toast = document.getElementById("mm-toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toast.hidden = true), 3500);
}

function applySettings() {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.density = settings.density;
  document.documentElement.dataset.language = settings.language;
  for (const [id, value] of [["mm-theme", settings.theme], ["mm-density", settings.density], ["mm-language", settings.language], ["mm-funny-en", settings.funnyEn], ["mm-funny-zh", settings.funnyZh]]) document.getElementById(id).value = value;
  for (const [id, value] of [["mm-funny-en-value", settings.funnyEn], ["mm-funny-zh-value", settings.funnyZh]]) { document.getElementById(id).value = value; document.getElementById(id).textContent = value; }
  document.getElementById("mm-narrator").checked = settings.narrator;
  document.getElementById("mm-dimsum").checked = settings.dimsum;
  document.querySelectorAll(".mm-secondary").forEach(node => (node.hidden = settings.language === "en"));
}

function bindSettings() {
  const bind = (id, key, transform = value => value) => {
    for (const eventName of ["input", "change"]) document.getElementById(id).addEventListener(eventName, event => { settings[key] = transform(event.target.value); saveSettings(); applySettings(); });
  };
  bind("mm-theme", "theme"); bind("mm-density", "density"); bind("mm-language", "language"); bind("mm-funny-en", "funnyEn", Number); bind("mm-funny-zh", "funnyZh", Number);
  for (const [id, key] of [["mm-narrator", "narrator"], ["mm-dimsum", "dimsum"]]) document.getElementById(id).addEventListener("change", event => { settings[key] = event.target.checked; saveSettings(); });
  document.getElementById("mm-reset").addEventListener("click", () => { settings = { ...DEFAULTS }; saveSettings(); applySettings(); showToast("Preview preferences reset."); });
  document.getElementById("mm-theme-toggle").addEventListener("click", () => { settings.theme = settings.theme === "light" ? "dark" : "light"; saveSettings(); applySettings(); });
}

function selectPage(page) {
  document.querySelectorAll(".mm-tab").forEach(tab => { const selected = tab.dataset.page === page; tab.classList.toggle("is-selected", selected); tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1; });
  document.querySelectorAll(".mm-page").forEach(panel => { const selected = panel.id === `mm-page-${page}`; panel.classList.toggle("is-visible", selected); panel.hidden = !selected; });
}

function bindTabs() {
  const tabs = [...document.querySelectorAll(".mm-tab")];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectPage(tab.dataset.page));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus(); selectPage(tabs[next].dataset.page);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => { readSettings(); bindTabs(); bindSettings(); applySettings(); });
