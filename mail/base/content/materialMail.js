/* Material Mail runtime preview controls and local-first feature surfaces. */
"use strict";

const STORAGE_KEY = "mail.material.preview.settings";
const HISTORY_KEY = "mail.material.preview.history";
const NOTIFICATION_KEY = "mail.material.preview.notifications";
const DEFAULTS = Object.freeze({ theme: "light", density: "comfortable", language: "en", funnyEn: 2, funnyZh: 3, narrator: false, narratorLanguage: "en", dimsum: true, accent: "purple", fontFamily: "Segoe UI", fontScale: 100, fontWeight: 400, hasLaunched: false });
const ACCENTS = Object.freeze({ purple: ["#6750a4", "#eaddff", "#21005d"], blue: ["#415f91", "#d6e3ff", "#001b3e"], green: ["#386a20", "#b7e1a1", "#0b2003"], orange: ["#8b5000", "#ffddb4", "#2c1600"] });
const CHANGELOG = Object.freeze([
  { version: "155.0a1", date: "2026-07-31", tag: "Added", title: ["Evidence-first Material workspace", "以證據先行嘅 Material 工作區"], items: [["Packaged Material Mail preview with six browser-style pages.", "打包 Material Mail 預覽，提供六個瀏覽器式頁面。"], ["Persisted language, tone, appearance, narrator, and dim-sum controls.", "保存語言、語氣、外觀、旁白同點心控制。"]] },
  { version: "155.0a1", date: "2026-07-29", tag: "Verified", title: ["M3 evidence capture", "M3 證據擷取"], items: [["Recorded genuine hosted and headless captures with explicit boundaries.", "記錄真實 hosted 同 headless 擷取，清楚寫明驗證邊界。"]] },
  { version: "155.0a1", date: "2026-07-24", tag: "Added", title: ["Regex builder foundation", "正規表達式建立器基礎"], items: [["Added bounded local evaluation, guided tokens, flags, captures, copy, and export.", "加入有界本機評估、引導符號、旗標、捕獲組、複製同匯出。"]] },
]);
const HISTORY_SEED = Object.freeze([
  { id: "seed-3", date: "2026-07-31", action: "settings changed", title: ["Changed preview language to English", "將預覽語言改為英文"], detail: ["The selected language mode was persisted locally.", "已將選取嘅語言模式保存到本機。"] },
  { id: "seed-2", date: "2026-07-30", action: "created", title: ["Created Material Mail preview", "建立 Material Mail 預覽"], detail: ["The six-page preview was added to the packaged content surface.", "六頁預覽已加入打包內容頁面。"] },
  { id: "seed-1", date: "2026-07-29", action: "restored", title: ["Restored relaxed density", "還原寬鬆密度"], detail: ["Restoring is recorded as a new revision; history stays append-only.", "還原會記錄成新版本，歷史保持只加不改。"] },
]);
const NOTIFICATION_SEED = Object.freeze([
  { id: "installer", kind: "success", unread: false, title: ["Installer verified", "安裝檔已驗證"], detail: ["The current published build has a real downloadable installer.", "目前公開 build 有真實可下載安裝檔。"] },
  { id: "browser-proof", kind: "info", unread: true, title: ["Browser proof has a known boundary", "Browser 證據有已知邊界"], detail: ["The authored Material test is recorded separately from remaining legacy-suite failures.", "authored Material test 同其餘 legacy suite failure 分開記錄。"] },
  { id: "release-queue", kind: "warning", unread: true, title: ["Release workflow is queued", "Release workflow 排緊隊"], detail: ["The installer is public only when the release asset exists; queued CI is not called green.", "只有 release asset 存在先叫公開；排緊隊嘅 CI 唔會扮綠燈。"] },
]);
const APPEARANCE_KEY = "mail.material.preview.appearance";

let settings = { ...DEFAULTS };
let historyRecords = [];
let notificationRecords = [];
let notificationFilter = "all";
let appearanceOverrides = {};
let appearanceTarget = null;
let narratorQueue = [];
let narratorBusy = false;
let narratorLastAt = 0;
function ensureSettingsCustomization() {
  if (document.getElementById("mm-accent")) return;
  const host = document.querySelector(".mm-settings-grid");
  const card = document.createElement("section");
  card.className = "mm-card mm-settings-card mm-appearance-controls";
  card.dataset.settingsSurface = "accent seed font family scale weight";
  card.innerHTML = `<h3 data-l10n-id="material-mail-appearance-customization">Live typography and seed</h3><label><span data-l10n-id="material-mail-accent">Accent seed</span><select id="mm-accent"><option value="purple" data-l10n-id="material-mail-accent-purple">Purple</option><option value="blue" data-l10n-id="material-mail-accent-blue">Blue</option><option value="green" data-l10n-id="material-mail-accent-green">Green</option><option value="orange" data-l10n-id="material-mail-accent-orange">Orange</option></select></label><label><span data-l10n-id="material-mail-font-family">Interface font</span><select id="mm-font-family"><option value="Segoe UI">Segoe UI</option><option value="Cascadia Code">Cascadia Code</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option></select></label><label><span data-l10n-id="material-mail-font-scale">Font scale</span><input id="mm-font-scale" type="range" min="90" max="125" value="100" /><output id="mm-font-scale-value">100%</output></label><label><span data-l10n-id="material-mail-font-weight">Font weight</span><input id="mm-font-weight" type="range" min="400" max="700" step="100" value="400" /><output id="mm-font-weight-value">400</output></label>`;
  host.append(card);
  document.l10n?.translateFragment?.(card);
}
const searchState = Object.create(null);
const historyActionSelection = new Set();

function text(value) { return value == null ? "" : String(value); }
function escapeHtml(value) { return text(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function pick(pair) {
  if (settings.language === "zh") return pair[1];
  if (settings.language === "both") return `${pair[0]} · ${pair[1]}`;
  return pair[0];
}
function drainNarrator() {
  if (narratorBusy || !narratorQueue.length || !settings.narrator || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  narratorBusy = true;
  const pair = narratorQueue.shift();
  const lines = settings.narratorLanguage === "zh" ? [[pair[1], "zh-HK"]] : settings.narratorLanguage === "both" ? [[pair[0], "en-US"], [pair[1], "zh-HK"]] : [[pair[0], "en-US"]];
  const speakNext = () => { const next = lines.shift(); if (!next) { narratorBusy = false; drainNarrator(); return; } const utterance = new SpeechSynthesisUtterance(next[0]); utterance.lang = next[1]; utterance.onend = speakNext; utterance.onerror = speakNext; window.speechSynthesis.speak(utterance); };
  speakNext();
}
function speakPair(pair) {
  if (!settings.narrator || Date.now() - narratorLastAt < 1200 || !window.speechSynthesis) return;
  narratorLastAt = Date.now(); narratorQueue = [pair]; drainNarrator();
}
function readSettings() {
  try { settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch (error) { console.warn("Material preview preferences unavailable", error); }
}
function readHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null");
    historyRecords = Array.isArray(stored) && stored.length ? stored : [...HISTORY_SEED];
  } catch (error) { historyRecords = [...HISTORY_SEED]; }
  for (const action of new Set(historyRecords.map(row => row.action))) historyActionSelection.add(action);
}
function readNotifications() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "null");
    notificationRecords = Array.isArray(stored) && stored.length ? stored : [...NOTIFICATION_SEED];
  } catch (error) { notificationRecords = [...NOTIFICATION_SEED]; }
}
function readAppearance() { try { appearanceOverrides = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || "{}"); } catch (error) { appearanceOverrides = {}; } }
function saveAppearance() { try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearanceOverrides)); } catch (error) { showToast("Appearance could not be persisted locally."); } }
function saveNotifications() { try { localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notificationRecords)); } catch (error) { /* Notification history remains usable. */ } }
function saveHistory() { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRecords.slice(0, 100))); } catch (error) { /* History never blocks the user operation. */ } }
function recordRevision(action, title, detail) {
  const next = { id: `revision-${Date.now()}`, date: new Date().toISOString().slice(0, 10), action, title, detail };
  historyRecords.unshift(next);
  historyActionSelection.add(action);
  saveHistory();
  renderHistoryActions();
  renderHistory();
  renderNotifications();
}
function saveSettings(reason = null) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (error) { showToast("Preferences could not be persisted locally."); }
  if (reason) recordRevision("settings changed", reason, ["The setting change was recorded locally.", "設定變更已記錄到本機。"]);
}
function showToast(message) {
  const toast = document.getElementById("mm-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toast.hidden = true), 3500);
  speakPair([message, message]);
}
function applySettings() {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.density = settings.density;
  document.documentElement.dataset.language = settings.language;
  const accent = ACCENTS[settings.accent] || ACCENTS.purple;
  document.documentElement.style.setProperty("--mm-primary", accent[0]);
  document.documentElement.style.setProperty("--mm-primary-container", accent[1]);
  document.documentElement.style.setProperty("--mm-on-primary-container", accent[2]);
  document.documentElement.style.setProperty("--m3-font-family", settings.fontFamily || "Segoe UI");
  document.documentElement.style.fontSize = `${settings.fontScale || 100}%`;
  document.documentElement.style.setProperty("--mm-font-weight", settings.fontWeight || 400);
  for (const [id, value] of [["mm-theme", settings.theme], ["mm-density", settings.density], ["mm-language", settings.language], ["mm-funny-en", settings.funnyEn], ["mm-funny-zh", settings.funnyZh]]) document.getElementById(id).value = value;
  for (const [id, value] of [["mm-funny-en-value", settings.funnyEn], ["mm-funny-zh-value", settings.funnyZh]]) { document.getElementById(id).value = value; document.getElementById(id).textContent = value; }
  document.getElementById("mm-narrator").checked = settings.narrator;
  document.getElementById("mm-dimsum").checked = settings.dimsum;
  document.getElementById("mm-narrator-language").value = settings.narratorLanguage;
  document.getElementById("mm-accent").value = settings.accent || "purple";
  document.getElementById("mm-font-family").value = settings.fontFamily || "Segoe UI";
  document.getElementById("mm-font-scale").value = settings.fontScale || 100;
  document.getElementById("mm-font-scale-value").textContent = `${settings.fontScale || 100}%`;
  document.getElementById("mm-font-weight").value = settings.fontWeight || 400;
  document.getElementById("mm-font-weight-value").textContent = settings.fontWeight || 400;
  document.querySelectorAll(".mm-secondary").forEach(node => (node.hidden = settings.language === "en"));
  filterSettings();
  renderChangelog();
  renderHistory();
}
function bindSettings() {
  const bind = (id, key, transform = value => value, reason = null) => {
    for (const eventName of ["input", "change"]) document.getElementById(id).addEventListener(eventName, event => { const next = transform(event.target.value); if (settings[key] === next) return; settings[key] = next; saveSettings(reason || [`${key} changed`, `${key} 已變更`]); applySettings(); });
  };
  bind("mm-theme", "theme", value => value, ["Changed preview theme", "改變預覽主題"]);
  bind("mm-density", "density", value => value, ["Changed preview density", "改變預覽密度"]);
  bind("mm-language", "language", value => value, ["Changed preview language", "改變預覽語言"]);
  bind("mm-funny-en", "funnyEn", Number, ["Changed English funny level", "改變英文幽默等級"]);
  bind("mm-funny-zh", "funnyZh", Number, ["Changed Cantonese funny level", "改變廣東話幽默等級"]);
  bind("mm-narrator-language", "narratorLanguage", value => value, ["Changed narrator language", "改變旁白語言"]);
  bind("mm-accent", "accent", value => value, ["Changed accent seed", "改變強調色種子"]);
  bind("mm-font-family", "fontFamily", value => value, ["Changed interface font", "改變介面字體"]);
  bind("mm-font-scale", "fontScale", Number, ["Changed font scale", "改變字體比例"]);
  bind("mm-font-weight", "fontWeight", Number, ["Changed font weight", "改變字重"]);
  for (const [id, key, reason] of [["mm-narrator", "narrator", ["Changed narrator preference", "改變旁白偏好"]], ["mm-dimsum", "dimsum", ["Changed dim-sum preference", "改變點心偏好"]]]) document.getElementById(id).addEventListener("change", event => { settings[key] = event.target.checked; saveSettings(reason); applySettings(); if (key === "narrator" && settings.narrator) speakPair(["Narrator enabled", "旁白已啟用"]); });
  document.getElementById("mm-reset").addEventListener("click", () => { settings = { ...DEFAULTS }; saveSettings(["Reset preview preferences", "重設預覽偏好"]); applySettings(); showToast("Preview preferences reset · 預覽偏好已重設"); });
  document.getElementById("mm-theme-toggle").addEventListener("click", () => { settings.theme = settings.theme === "light" ? "dark" : "light"; saveSettings(["Toggled preview theme", "切換預覽主題"]); applySettings(); });
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
function setSearch(id, state) { searchState[id] = { mode: state.mode === "regex" ? "regex" : "plain", query: text(state.query), pattern: text(state.pattern), flags: text(state.flags) }; }
function searchMatches(id, haystack) {
  const state = searchState[id] || { mode: "plain", query: "" };
  const query = state.mode === "regex" ? state.pattern : state.query;
  if (!query) return true;
  if (query.length > 512) return false;
  if (state.mode === "regex") { try { return new RegExp(query, state.flags).test(haystack); } catch (error) { return false; } }
  return haystack.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}
function filterSettings() {
  const query = searchState.settings?.query || "";
  document.querySelectorAll("[data-settings-surface]").forEach(surface => { surface.hidden = Boolean(query) && !searchMatches("settings", `${surface.dataset.settingsSurface} ${surface.textContent}`); });
}
function dateInRange(date, from, to) { return (!from || date >= from) && (!to || date <= to); }
function changelogRows() {
  const from = document.getElementById("mm-changelog-from").value;
  const to = document.getElementById("mm-changelog-to").value;
  return CHANGELOG.filter(entry => dateInRange(entry.date, from, to) && searchMatches("changelog", `${entry.version} ${entry.date} ${entry.tag} ${entry.title.join(" ")} ${entry.items.flat().join(" ")}`));
}
function renderChangelog() {
  const list = document.getElementById("mm-changelog-list");
  if (!list) return;
  const rows = changelogRows();
  list.innerHTML = rows.length ? rows.map(entry => `<article class="mm-card mm-entry"><header class="mm-entry-header"><div><div class="mm-entry-meta">${escapeHtml(entry.version)} · ${escapeHtml(entry.date)}</div><h3>${escapeHtml(pick(entry.title))}</h3></div><span class="mm-filter-chip">${escapeHtml(entry.tag)}</span></header><ul>${entry.items.map(item => `<li>${escapeHtml(pick(item))}</li>`).join("")}</ul></article>`).join("") : `<div class="mm-card mm-empty-state mm-no-results"><span class="mm-empty-icon" aria-hidden="true">⌕</span><h3>${escapeHtml(pick(["No matching releases", "搵唔到相符版本"]))}</h3><p>${escapeHtml(pick(["Adjust the date range or search text.", "調整日期範圍或者搜尋文字。"]))}</p></div>`;
  document.getElementById("mm-changelog-count").value = `${rows.length} release${rows.length === 1 ? "" : "s"} · ${rows.length} 個版本`;
}
function changelogText(rows = changelogRows()) { return rows.map(entry => [`v${entry.version} · ${entry.date}`, pick(entry.title), ...entry.items.map(pick)].join("\n")).join("\n\n"); }
function historyRows() {
  const from = document.getElementById("mm-history-from").value;
  const to = document.getElementById("mm-history-to").value;
  return historyRecords.filter(row => historyActionSelection.has(row.action) && dateInRange(row.date, from, to) && searchMatches("history", `${row.date} ${row.action} ${row.title.join(" ")} ${row.detail.join(" ")}`));
}
function notificationRows() {
  return notificationRecords.filter(row => (notificationFilter === "all" || (notificationFilter === "unread" && row.unread) || (notificationFilter === "dismissed" && row.dismissed)) && searchMatches("notifications", `${row.title.join(" ")} ${row.detail.join(" ")}`));
}
function renderNotifications() {
  const list = document.getElementById("mm-notification-list");
  if (!list) return;
  const rows = notificationRows();
  list.innerHTML = rows.length ? rows.map(row => `<article class="mm-card mm-notification mm-notification-${escapeHtml(row.kind)}${row.dismissed ? " is-dismissed" : ""}"><span class="mm-notification-icon" aria-hidden="true">${row.kind === "success" ? "✓" : row.kind === "warning" ? "!" : "i"}</span><div><h3>${escapeHtml(pick(row.title))}</h3><p>${escapeHtml(pick(row.detail))}</p>${row.dismissed ? `<small class="mm-notification-state">${escapeHtml(pick(["Dismissed; retained in notification history.", "已收起；仍保留喺通知歷史。 "]))}</small>` : ""}</div>${row.dismissed ? "" : `<button class="mm-icon-button" type="button" data-notification-dismiss="${escapeHtml(row.id)}" data-l10n-id="material-mail-dismiss">×</button>`}</article>`).join("") : `<div class="mm-card mm-empty-state mm-no-results"><span class="mm-empty-icon" aria-hidden="true">i</span><h3>${escapeHtml(pick(["No matching notifications", "搵唔到相符通知"]))}</h3><p>${escapeHtml(pick(["Dismissed messages remain reviewable under Dismissed.", "收起咗嘅訊息仍然可以喺「已收起」度睇返。 "]))}</p></div>`;
  document.getElementById("mm-notification-count").value = `${rows.length} notification${rows.length === 1 ? "" : "s"} · ${rows.length} 個通知`;
  list.querySelectorAll("[data-notification-dismiss]").forEach(button => button.addEventListener("click", () => { const row = notificationRecords.find(item => item.id === button.dataset.notificationDismiss); if (!row) return; row.dismissed = true; row.unread = false; saveNotifications(); renderNotifications(); showToast("Notification dismissed and retained · 通知已收起但保留"); }));
}
function renderHistoryActions() {
  const container = document.getElementById("mm-history-actions");
  if (!container) return;
  const counts = new Map();
  historyRecords.forEach(row => counts.set(row.action, (counts.get(row.action) || 0) + 1));
  container.innerHTML = [...counts].sort().map(([action, count]) => `<label class="mm-action-option"><input type="checkbox" data-history-action="${escapeHtml(action)}" ${historyActionSelection.has(action) ? "checked" : ""} /><span>${escapeHtml(action)} (${count})</span></label>`).join("");
  container.querySelectorAll("[data-history-action]").forEach(input => input.addEventListener("change", event => { const action = event.target.dataset.historyAction; event.target.checked ? historyActionSelection.add(action) : historyActionSelection.delete(action); renderHistory(); }));
}
function renderHistory() {
  const list = document.getElementById("mm-history-list");
  if (!list) return;
  const rows = historyRows();
  list.innerHTML = rows.length ? rows.map(row => `<article class="mm-card mm-entry mm-history-row"><div class="mm-history-icon" aria-hidden="true">↺</div><div><div class="mm-entry-meta">${escapeHtml(row.date)} · ${escapeHtml(row.action)}</div><h3>${escapeHtml(pick(row.title))}</h3><p>${escapeHtml(pick(row.detail))}</p></div><button class="mm-text-button" type="button" data-history-restore="${escapeHtml(row.id)}" data-l10n-id="material-mail-restore">Restore</button></article>`).join("") : `<div class="mm-card mm-empty-state mm-no-results"><span class="mm-empty-icon" aria-hidden="true">◷</span><h3>${escapeHtml(pick(["No matching revisions", "搵唔到相符版本"]))}</h3><p>${escapeHtml(pick(["The active filters returned no history records.", "目前篩選冇搵到歷史記錄。 "]))}</p></div>`;
  document.getElementById("mm-history-count").value = `${rows.length} revision${rows.length === 1 ? "" : "s"} · ${rows.length} 個版本`;
  list.querySelectorAll("[data-history-restore]").forEach(button => button.addEventListener("click", () => { recordRevision("restored", ["Restored a preview revision", "還原預覽版本"], ["The restore was recorded as a new append-only revision.", "還原已記錄成新嘅只加不改版本。"]); showToast("Revision restored and recorded · 版本已還原並記錄"); }));
}
function downloadText(filename, content, type = "text/plain") { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
async function copyText(content, message) { try { await navigator.clipboard.writeText(content); showToast(message); } catch (error) { showToast("Clipboard permission unavailable · 剪貼簿權限不可用"); } }
function bindDataSurfaces() {
  for (const [id, key, render] of [["mm-settings-search", "settings", filterSettings], ["mm-changelog-search", "changelog", renderChangelog], ["mm-history-search", "history", renderHistory], ["mm-notifications-search", "notifications", renderNotifications]]) { const input = document.getElementById(id); setSearch(key, { mode: "plain", query: "" }); input.addEventListener("input", () => { setSearch(key, { mode: "plain", query: input.value }); render(); }); }
  for (const id of ["mm-changelog-from", "mm-changelog-to", "mm-history-from", "mm-history-to"]) document.getElementById(id).addEventListener("change", () => id.startsWith("mm-changelog") ? renderChangelog() : renderHistory());
  document.getElementById("mm-changelog-preset").addEventListener("change", event => { const latest = CHANGELOG[0].date; const now = new Date(); const today = now.toISOString().slice(0, 10); const month = `${today.slice(0, 7)}-01`; const from = document.getElementById("mm-changelog-from"); const to = document.getElementById("mm-changelog-to"); if (event.target.value === "all") { from.value = ""; to.value = ""; } else if (event.target.value === "latest") { from.value = latest; to.value = latest; } else { from.value = month; to.value = today; } renderChangelog(); });
  document.getElementById("mm-changelog-copy").addEventListener("click", () => copyText(changelogText(), "Changelog copied · 更新記錄已複製"));
  document.getElementById("mm-changelog-export").addEventListener("click", () => { downloadText("material-mail-changelog.md", `# Material Mail changelog\n\n${changelogText()}\n`, "text/markdown"); showToast("Changelog exported · 更新記錄已匯出"); });
  document.getElementById("mm-history-export").addEventListener("click", () => { const content = historyRows().map(row => `${row.date} · ${row.action}\n${pick(row.title)}\n${pick(row.detail)}`).join("\n\n"); downloadText("material-mail-history.txt", `Material Mail local history\n\n${content}\n`); showToast("History exported · 歷史已匯出"); });
  document.getElementById("mm-notifications-filter").addEventListener("change", event => { notificationFilter = event.target.value; renderNotifications(); });
  renderHistoryActions();
}
function maybeShowDimsum() {
  if (!settings.dimsum || !settings.hasLaunched || Math.random() >= 0.01) return;
  const surprise = document.getElementById("mm-dimsum-surprise");
  surprise.hidden = false;
  document.getElementById("mm-dimsum-dismiss").addEventListener("click", () => { surprise.hidden = true; });
}
function appearanceKey(target) {
  if (!target.dataset.appearanceKey) target.dataset.appearanceKey = target.id || `element-${[...document.querySelectorAll(".mm-card, .mm-tab, .mm-appbar, .mm-search-field")].indexOf(target)}`;
  return target.dataset.appearanceKey;
}
function hexFromCss(value, fallback) { const match = text(value).match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i); if (match) return `#${[match[1], match[2], match[3]].map(part => Number(part).toString(16).padStart(2, "0")).join("")}`; return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function applyAppearance(target) {
  const value = appearanceOverrides[appearanceKey(target)];
  if (!value) return;
  for (const [name, cssValue] of Object.entries(value)) target.style.setProperty(name, cssValue);
}
function applyAllAppearance() { document.querySelectorAll(".mm-card, .mm-tab, .mm-appbar, .mm-search-field").forEach(applyAppearance); }
function openAppearance(target, x = 24, y = 24) {
  appearanceTarget = target;
  target.classList.add("mm-appearance-target");
  const key = appearanceKey(target);
  const value = appearanceOverrides[key] || {};
  const computed = getComputedStyle(target);
  const surface = hexFromCss(value["--mm-custom-bg"] || computed.backgroundColor, "#f3edf7");
  const foreground = hexFromCss(value["--mm-custom-fg"] || computed.color, "#1d1b20");
  document.getElementById("mm-appearance-target").textContent = `${target.id || target.className} · ${key}`;
  document.getElementById("mm-appearance-surface").value = surface; document.getElementById("mm-appearance-surface-text").value = surface;
  document.getElementById("mm-appearance-text").value = foreground; document.getElementById("mm-appearance-text-text").value = foreground;
  document.getElementById("mm-appearance-radius").value = value["--mm-custom-radius"]?.replace("px", "") || 16;
  document.getElementById("mm-appearance-font-size").value = value["--mm-custom-size"]?.replace("px", "") || 14;
  document.getElementById("mm-appearance-weight").value = value["--mm-custom-weight"] || 400;
  document.getElementById("mm-appearance-radius-value").textContent = `${document.getElementById("mm-appearance-radius").value}px`;
  document.getElementById("mm-appearance-font-size-value").textContent = `${document.getElementById("mm-appearance-font-size").value}px`;
  const editor = document.getElementById("mm-appearance-editor"); editor.hidden = false; editor.style.left = `${Math.max(12, Math.min(x, innerWidth - 360))}px`; editor.style.top = `${Math.max(12, Math.min(y, innerHeight - 520))}px`;
  document.getElementById("mm-appearance-surface").focus();
}
function updateAppearance(name, value, textId = null) { if (!appearanceTarget) return; const key = appearanceKey(appearanceTarget); appearanceOverrides[key] = { ...(appearanceOverrides[key] || {}), [name]: value }; appearanceTarget.style.setProperty(name, value); saveAppearance(); if (textId) document.getElementById(textId).value = value; }
function bindAppearance() {
  const editor = document.getElementById("mm-appearance-editor");
  document.addEventListener("contextmenu", event => { const target = event.target.closest(".mm-card, .mm-tab, .mm-appbar, .mm-search-field"); if (!target || editor.contains(target)) return; event.preventDefault(); openAppearance(target, event.clientX, event.clientY); });
  document.addEventListener("keydown", event => { if (event.key !== "F10" || !event.shiftKey) return; const target = event.target.closest?.(".mm-card, .mm-tab, .mm-appbar, .mm-search-field"); if (!target) return; event.preventDefault(); const rect = target.getBoundingClientRect(); openAppearance(target, rect.left, rect.bottom + 8); });
  document.getElementById("mm-appearance-close").addEventListener("click", () => { editor.hidden = true; appearanceTarget?.focus?.(); });
  for (const [id, name, textId] of [["mm-appearance-surface", "--mm-custom-bg", "mm-appearance-surface-text"], ["mm-appearance-text", "--mm-custom-fg", "mm-appearance-text-text"]]) document.getElementById(id).addEventListener("input", event => { updateAppearance(name, event.target.value); document.getElementById(textId).value = event.target.value; });
  for (const [id, name, output] of [["mm-appearance-radius", "--mm-custom-radius", "mm-appearance-radius-value"], ["mm-appearance-font-size", "--mm-custom-size", "mm-appearance-font-size-value"]]) document.getElementById(id).addEventListener("input", event => { updateAppearance(name, `${event.target.value}px`); document.getElementById(output).textContent = `${event.target.value}px`; });
  document.getElementById("mm-appearance-weight").addEventListener("change", event => updateAppearance("--mm-custom-weight", event.target.value));
  for (const [id, colorId, name] of [["mm-appearance-surface-text", "mm-appearance-surface", "--mm-custom-bg"], ["mm-appearance-text-text", "mm-appearance-text", "--mm-custom-fg"]]) document.getElementById(id).addEventListener("change", event => { if (!/^#[0-9a-f]{6}$/i.test(event.target.value)) return; document.getElementById(colorId).value = event.target.value; updateAppearance(name, event.target.value); });
  document.getElementById("mm-appearance-reset").addEventListener("click", () => { if (!appearanceTarget) return; const key = appearanceKey(appearanceTarget); delete appearanceOverrides[key]; for (const name of ["--mm-custom-bg", "--mm-custom-fg", "--mm-custom-radius", "--mm-custom-size", "--mm-custom-weight"]) appearanceTarget.style.removeProperty(name); saveAppearance(); openAppearance(appearanceTarget); showToast("Element appearance reset · 元素外觀已重設"); });
  document.getElementById("mm-appearance-reset-all").addEventListener("click", () => { appearanceOverrides = {}; document.querySelectorAll(".mm-card, .mm-tab, .mm-appbar, .mm-search-field").forEach(target => { for (const name of ["--mm-custom-bg", "--mm-custom-fg", "--mm-custom-radius", "--mm-custom-size", "--mm-custom-weight"]) target.style.removeProperty(name); }); saveAppearance(); editor.hidden = true; showToast("All appearance overrides reset · 所有外觀覆寫已重設"); });
  applyAllAppearance();
}
window.mmSetRegexState = (key, state) => { setSearch(key, state); if (key === "settings") filterSettings(); if (key === "changelog") renderChangelog(); if (key === "history") renderHistory(); if (key === "notifications") renderNotifications(); };
window.mmSearchState = searchState;

document.addEventListener("DOMContentLoaded", () => { readSettings(); readHistory(); readNotifications(); readAppearance(); ensureSettingsCustomization(); bindTabs(); bindSettings(); bindDataSurfaces(); bindAppearance(); applySettings(); const firstLaunch = !settings.hasLaunched; settings.hasLaunched = true; if (firstLaunch) saveSettings(); else maybeShowDimsum(); });
