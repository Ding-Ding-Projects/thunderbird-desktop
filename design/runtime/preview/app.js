/* Local Material Mail preview only. It does not connect to Thunderbird runtime code. */
(function () {
  "use strict";

  const DATA = window.MM_DATA;
  if (!DATA) throw new Error("MM_DATA did not load; serve this preview from the repository root.");

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const root = document.documentElement;
  const main = $("#preview-main");
  const tabs = $("#tab-list");
  const status = $("#status-copy");
  const toasts = $("#toast-region");
  const label = key => DATA.LABEL_COPY[key] || { en: key, zh: key };
  const copy = (key, mode = state.language) => {
    const item = label(key);
    if (mode === "cantonese") return item.zh;
    if (mode === "both") return `${item.en} · ${item.zh}`;
    return item.en;
  };
  const message = (key, mode = state.language, level = state.funnyEnglish) => {
    const item = DATA.MSG_COPY[key];
    if (!item) return key;
    const index = Math.max(0, Math.min(4, Number(level) - 1));
    if (mode === "cantonese") return item.zh[index];
    if (mode === "both") return `${item.en[index]} · ${item.zh[index]}`;
    return item.en[index];
  };

  const pageMeta = [
    ...DATA.TABS.map(item => ({ id: item.id, icon: item.icon, utility: false })),
    { id: "palette", icon: "⌘", utility: true, title: "Command Palette", titleZh: "指令面板" },
    { id: "compose", icon: "✎", utility: true, title: "Compose", titleZh: "寫郵件" },
  ];
  const defaultState = {
    page: "mail",
    folder: "inbox",
    messageId: 1,
    query: "",
    theme: "light",
    seed: "purple",
    density: "comfortable",
    language: "both",
    funnyEnglish: 3,
    funnyCantonese: 3,
    commandQuery: "",
    paletteIndex: 0,
    compose: { to: "", subject: "", body: "" },
    selectedNotice: "",
  };
  const state = { ...defaultState };

  const seeded = () => DATA.SEEDS[state.seed]?.[state.theme] || DATA.SEEDS.purple.light;
  const initials = name => name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const pageTitle = meta => meta.title || label(meta.id).en;
  const pageTitleZh = meta => meta.titleZh || label(meta.id).zh;
  const bilingual = (en, zh = en) => state.language === "cantonese" ? zh : state.language === "both" ? `${en} · ${zh}` : en;

  function applyTheme() {
    const palette = seeded();
    root.dataset.theme = state.theme;
    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--on-primary", palette.onPrimary);
    root.style.setProperty("--primary-container", palette.pc);
    root.style.setProperty("--on-primary-container", palette.onPc);
    root.style.setProperty("--secondary-container", palette.sc);
    root.style.setProperty("--on-secondary-container", palette.onSc);
    root.style.setProperty("--tertiary-container", palette.tc);
    root.style.setProperty("--on-tertiary-container", palette.onTc);
    const density = DATA.DENSITY[state.density] || DATA.DENSITY.comfortable;
    root.style.setProperty("--control-size", density.control + "px");
    root.style.setProperty("--row-gap", density.gap * 4 + "px");
    root.style.fontFamily = DATA.FONTS[state.font] || DATA.FONTS.system;
    root.style.fontSize = `${state.fontScale || 100}%`;
    $("#theme-toggle").textContent = state.theme === "dark" ? "☀" : "☾";
    $("#theme-toggle").setAttribute("aria-label", state.theme === "dark" ? "Use light theme" : "Use dark theme");
  }

  function renderTabs() {
    tabs.innerHTML = pageMeta.map((meta, index) => `<button class="tab-button${meta.utility ? " utility" : ""}" id="tab-${meta.id}" role="tab" type="button" tabindex="${state.page === meta.id ? "0" : "-1"}" aria-selected="${state.page === meta.id}" aria-controls="preview-page" data-page="${meta.id}">
      <span class="tab-icon" aria-hidden="true">${esc(meta.icon.slice(0, 1).toUpperCase())}</span><span>${esc(bilingual(pageTitle(meta), pageTitleZh(meta)))}</span>
    </button>`).join("");
    $$("[role=tab]", tabs).forEach(tab => tab.addEventListener("click", () => setPage(tab.dataset.page)));
    tabs.addEventListener("keydown", onTabKeydown, { once: true });
  }

  function onTabKeydown(event) {
    const tabNodes = $$('[role="tab"]', tabs);
    const current = tabNodes.indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (event.key === "ArrowRight" || (event.ctrlKey && event.key === "Tab")) next = (current + 1) % tabNodes.length;
    if (event.key === "ArrowLeft" || (event.ctrlKey && event.shiftKey && event.key === "Tab")) next = (current - 1 + tabNodes.length) % tabNodes.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabNodes.length - 1;
    if (next !== current) { event.preventDefault(); tabNodes[next].focus(); setPage(tabNodes[next].dataset.page); }
  }

  function setPage(page, focus = false) {
    if (!pageMeta.some(item => item.id === page)) page = "mail";
    state.page = page;
    renderTabs();
    renderPage();
    status.textContent = `Design data loaded locally · ${pageTitle(pageMeta.find(item => item.id === page))} page · no native mail process connected.`;
    if (focus) main.focus();
  }

  function searchField(id, placeholder, value, onInput, extra = "") {
    return `<label class="search-field" for="${id}"><span aria-hidden="true">⌕</span><input id="${id}" type="search" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(value)}" aria-label="${esc(placeholder)}" data-search="${id}">${extra}</label>`;
  }

  function mailPage() {
    const folder = DATA.FOLDERS.find(item => item.key === state.folder) || DATA.FOLDERS[0];
    const messages = DATA.MESSAGES.filter(item => item.folder === folder.key);
    const query = state.query.trim().toLocaleLowerCase();
    const shown = messages.filter(item => !query || `${item.name} ${item.subject} ${item.email} ${item.body.join(" ")}`.toLocaleLowerCase().includes(query));
    const selected = DATA.MESSAGES.find(item => item.id === state.messageId) || shown[0] || messages[0];
    if (selected) state.messageId = selected.id;
    const folderButtons = DATA.FOLDERS.map(item => {
      const count = DATA.MESSAGES.filter(mail => mail.folder === item.key && mail.unread).length;
      return `<button class="folder-button" type="button" aria-current="${item.key === folder.key ? "page" : "false"}" data-folder="${item.key}"><span class="folder-icon" aria-hidden="true">${item.icon.slice(0, 1).toUpperCase()}</span><span>${esc(bilingual(label(item.key).en, label(item.key).zh))}</span>${count ? `<span class="folder-count">${count}</span>` : ""}</button>`;
    }).join("");
    const rows = shown.map(item => `<button class="message-row${item.unread ? " unread" : ""}" type="button" aria-current="${item.id === state.messageId}" data-message="${item.id}"><span class="message-avatar" aria-hidden="true">${initials(item.name)}</span><span class="message-copy"><strong>${esc(item.name)}</strong><span>${esc(item.subject)}</span></span><span class="message-time">${esc(item.time)}</span></button>`).join("");
    const detail = selected ? `<div class="message-meta"><span>${esc(selected.fullDate)}</span>${selected.label ? `<span class="tag">${esc(selected.label)}</span>` : ""}${selected.attach ? `<span class="tag">Attachment</span>` : ""}</div><div class="message-detail-copy">${selected.body.map(line => `<p>${esc(line)}</p>`).join("")}</div>${selected.attach ? `<div class="attachment"><span class="attachment-icon" aria-hidden="true">▧</span><div><strong>${esc(selected.attach.name)}</strong><br><span class="date-label">${esc(selected.attach.size)}</span></div><button class="text-button" type="button" data-toast="Attachment preview is design-only.">Preview</button></div>` : ""}<div class="button-row"><button class="tonal-button" type="button" data-compose="reply">${esc(copy("reply"))}</button><button class="text-button" type="button" data-toast="Archive is simulated in this preview.">Archive</button></div>` : `<div class="empty-state"><div><h3>${esc(bilingual("No message selected", "未揀郵件"))}</h3><p>${esc(copy("pickMessage"))}</p></div></div>`;
    return `<section class="page" id="preview-page" role="tabpanel" aria-labelledby="tab-mail"><div class="page-heading"><div><span class="eyebrow-label">3-pane mail workspace</span><h2>${esc(bilingual(label("mail").en, label("mail").zh))}</h2><p>${esc(bilingual("A local rendering of the Material Mail design snapshot.", "Material Mail design snapshot 嘅本地預覽。"))}</p></div><div class="button-row"><button class="button" type="button" data-page="compose">✎ ${esc(copy("compose"))}</button><button class="text-button" type="button" data-page="palette">⌘K ${esc(copy("commandPalette"))}</button></div></div><div class="mail-layout"><aside class="surface-card folder-pane" aria-label="Folders"><h3>${esc(copy("folders"))}</h3><div class="folder-group-label">${esc(copy("folders"))}</div>${folderButtons}<div class="folder-group-label">${esc(copy("labels"))}</div>${DATA.LABELS.map(item => `<button class="folder-button" type="button" data-toast="Label filtering is represented in the design preview."><span class="folder-icon" style="color:${item.dot}" aria-hidden="true">●</span><span>${esc(item.key)}</span></button>`).join("")}</aside><section class="surface-card mail-center" aria-label="${esc(bilingual("Message list", "郵件列表"))}">${searchField("mail-search", copy("searchMail"), state.query, "", `<button class="clear-search" type="button" aria-label="${esc(copy("clear"))}" data-clear-search>×</button>`)}<div class="section-heading"><h3>${esc(bilingual(label(folder.key).en, label(folder.key).zh))}</h3><span class="date-label">${shown.length} / ${messages.length}</span></div><div class="message-list" role="listbox" aria-label="${esc(bilingual("Messages", "郵件"))}" tabindex="0">${rows || `<div class="empty-state"><p>${esc(message("noMatch"))}</p></div>`}</div></section><article class="surface-card mail-detail" aria-label="${esc(bilingual("Message detail", "郵件內容"))}">${selected ? `<div class="section-heading"><div><span class="eyebrow-label">${esc(selected.email)}</span><h3>${esc(selected.subject)}</h3></div><span aria-label="Starred">${selected.starred ? "★" : "☆"}</span></div>${detail}` : detail}</article></div><div class="preview-footer"><span>Visible gap: native Thunderbird folders, messages, and commands are not connected.</span><span>Data source: <code>design/app-data.js</code></span></div></section>`;
  }

  function settingsPage() {
    const settings = [
      ["theme", "theme", `<select id="setting-theme" aria-label="${esc(copy("theme"))}"><option value="light" ${state.theme === "light" ? "selected" : ""}>${esc(copy("light"))}</option><option value="dark" ${state.theme === "dark" ? "selected" : ""}>${esc(copy("dark"))}</option></select>`],
      ["accent", "accent", `<select id="setting-seed" aria-label="${esc(copy("accent"))}">${["purple", "blue", "green", "orange"].map(seed => `<option value="${seed}" ${state.seed === seed ? "selected" : ""}>${seed}</option>`).join("")}</select>`],
      ["density", "density", `<select id="setting-density" aria-label="${esc(copy("density"))}">${["compact", "comfortable", "relaxed"].map(density => `<option value="${density}" ${state.density === density ? "selected" : ""}>${esc(label(density === "compact" ? "compactD" : density === "relaxed" ? "relaxedD" : "comfortableD").en)}</option>`).join("")}</select>`],
      ["languageMode", "languageMode", `<select id="setting-language" aria-label="${esc(copy("languageMode"))}"><option value="english" ${state.language === "english" ? "selected" : ""}>${esc(copy("english"))}</option><option value="cantonese" ${state.language === "cantonese" ? "selected" : ""}>${esc(copy("cantonese"))}</option><option value="both" ${state.language === "both" ? "selected" : ""}>${esc(copy("both"))}</option></select>`],
      ["funEn", "funEn", `<input id="setting-fun-en" type="range" min="1" max="5" value="${state.funnyEnglish}" aria-label="${esc(copy("funEn"))}"><output for="setting-fun-en">${state.funnyEnglish}/5</output>`],
      ["funZh", "funZh", `<input id="setting-fun-zh" type="range" min="1" max="5" value="${state.funnyCantonese}" aria-label="${esc(copy("funZh"))}"><output for="setting-fun-zh">${state.funnyCantonese}/5</output>`],
      ["fontFamily", "fontFamily", `<select id="setting-font" aria-label="${esc(copy("fontFamily"))}">${Object.keys(DATA.FONTS).map(font => `<option value="${font}">${font}</option>`).join("")}</select>`],
      ["fontSize", "fontSize", `<input id="setting-font-size" type="range" min="90" max="125" value="100" aria-label="${esc(copy("fontSize"))}"><output for="setting-font-size">100%</output>`],
    ];
    const rows = settings.map(([key, labelKey, control]) => `<div class="settings-row"><div class="settings-copy"><strong>${esc(copy(labelKey))}</strong><span>${esc(settingDescription(key))}</span></div><div class="settings-control">${control}</div></div>`).join("");
    return `<section class="page" id="preview-page" role="tabpanel" aria-labelledby="tab-settings"><div class="page-heading"><div><span class="eyebrow-label">Customisation surface</span><h2>${esc(copy("settings"))}</h2><p>${esc(bilingual("Controls are local and reset when this preview reloads.", "呢啲控制只係本地，重新載入預覽就會重設。"))}</p></div>${searchField("settings-search", copy("searchSettings"), "", "", "")}</div><div class="settings-grid"><section class="surface-card settings-card"><div class="section-heading"><h3>${esc(copy("appearance"))}</h3><span class="tag">Live preview</span></div>${rows}<div class="settings-row"><div class="settings-copy"><strong>${esc(copy("narratorOn"))}</strong><span>${esc(bilingual("Optional and off in this preview.", "可選功能，呢個預覽預設關閉。"))}</span></div><div class="settings-control"><input id="setting-narrator" type="checkbox" aria-label="${esc(copy("narratorOn"))}"></div></div><div class="settings-row"><div class="settings-copy"><strong>${esc(copy("dimsumSetting"))}</strong><span>${esc(bilingual("One local catalog item can appear as a non-blocking delight.", "可以顯示一味本地點心目錄嘅小驚喜。"))}</span></div><div class="settings-control"><button class="tonal-button" type="button" data-dimsum>${esc(copy("dimsumPreview"))}</button></div></div></section><aside class="surface-card card-pad"><div class="preview-swatch"><div><strong>${esc(bilingual("Aa Preview", "Aa 預覽"))}</strong><span>${esc(bilingual("Typography, theme, density and language are visible here.", "字體、主題、密度同語言會喺呢度即時反映。"))}</span></div></div><p class="date-label" style="margin:16px 0 0">${esc(bilingual("Design-only gap: no preference is persisted to Thunderbird.", "只係 design gap：設定唔會寫入 Thunderbird。"))}</p></aside></div></section>`;
  }

  function settingDescription(key) {
    return ({ theme: "Light and dark surfaces for this preview.", accent: "M3 seed colour used by local tokens.", density: "Row height and list spacing.", languageMode: "English, Cantonese, or compact bilingual copy.", funEn: "Voice styling only; facts remain unchanged.", funZh: "語氣可以變，事實唔會變。", fontFamily: "Uses a system-installed fallback only.", fontSize: "Preview scale, not a document setting." })[key] || "Local design control.";
  }

  function changelogPage() {
    const query = state.query.toLocaleLowerCase();
    const releases = DATA.CHANGELOG.filter(item => !query || JSON.stringify(item).toLocaleLowerCase().includes(query));
    return `<section class="page" id="preview-page" role="tabpanel" aria-labelledby="tab-changelog"><div class="page-heading"><div><span class="eyebrow-label">Release notes</span><h2>${esc(copy("changelog"))}</h2><p>${esc(bilingual("Every entry is from the local design data.", "所有記錄都嚟自本地 design data。"))}</p></div><div class="button-row"><button class="tonal-button" type="button" data-toast="Markdown export is simulated in this preview.">${esc(copy("exportMd"))}</button><button class="text-button" type="button" data-toast="Current changelog copied locally.">${esc(copy("copy"))}</button></div></div><div class="surface-card card-pad"><div class="search-toolbar">${searchField("changelog-search", copy("searchChangelog"), state.query, "", `<button class="clear-search" type="button" aria-label="${esc(copy("clear"))}" data-clear-search>×</button>`)}<button class="filter-chip" type="button" data-toast="Calendar range filtering is represented by the design snapshot.">${esc(bilingual("Date range", "日期範圍"))}</button></div><div class="timeline">${releases.map(release => `<article class="release-card surface-card"><header><h3>v${esc(release.version)}</h3><span class="date-label">${esc(release.date)}</span></header>${release.sections.map(section => `<div><span class="kind-label">${esc(section.kind)}</span><ul>${section.items.map(item => `<li>${esc(item)}</li>`).join("")}</ul></div>`).join("")}</article>`).join("") || `<div class="empty-state"><p>${esc(message("noMatch"))}</p></div>`}</div></div></section>`;
  }

  function historyPage() {
    const revisions = [
      ["✦", "Starred a message", "Message 1 · 2026-07-27 10:42", "mail"],
      ["⚙", "Changed setting: theme", "light → dark · 2026-07-26 18:03", "setting"],
      ["↶", "Restored revision", "Restore recorded as a new revision · 2026-07-25 09:14", "restore"],
    ];
    return `<section class="page" id="preview-page" role="tabpanel" aria-labelledby="tab-history"><div class="page-heading"><div><span class="eyebrow-label">Append-only local record</span><h2>${esc(copy("history"))}</h2><p>${esc(bilingual("Restoring creates another revision; history is never rewritten.", "還原會新增版本，記錄唔會被改寫。"))}</p></div><button class="tonal-button" type="button" data-toast="History export is simulated in this preview.">${esc(copy("exportHistory"))}</button></div><div class="surface-card card-pad"><div class="search-toolbar">${searchField("history-search", copy("searchHistory"), state.query, "", `<button class="clear-search" type="button" aria-label="${esc(copy("clear"))}" data-clear-search>×</button>`)}<span class="tag">3 revisions</span></div><div class="revision-list">${revisions.map(row => `<article class="revision-row surface-card"><span class="revision-kind" aria-hidden="true">${row[0]}</span><div class="revision-copy"><strong>${esc(bilingual(row[1], row[1]))}</strong><span>${esc(row[2])}</span></div><div class="button-row"><button class="text-button" type="button" data-toast="Diff view is design-only.">${esc(bilingual("Diff", "比較"))}</button><button class="text-button" type="button" data-toast="Restore is design-only; no data is changed.">${esc(copy("restore"))}</button></div></article>`).join("")}</div></div></section>`;
  }

  function notificationsPage() {
    const notices = [
      ["✓", "success", "Message sent.", "Today · 11:05"],
      ["!", "warning", "No external editor can be launched from a browser.", "Yesterday · 16:20"],
      ["↶", "success", "Archive can be undone from the snackbar.", "2026-07-24 · 09:12"],
    ];
    const query = state.query.toLocaleLowerCase();
    const shown = notices.filter(row => !query || row.join(" ").toLocaleLowerCase().includes(query));
    return `<section class="page" id="preview-page" role="tabpanel" aria-labelledby="tab-notifications"><div class="page-heading"><div><span class="eyebrow-label">Reviewable non-blocking messages</span><h2>${esc(copy("notifications"))}</h2><p>${esc(bilingual("Dismissed toasts stay reviewable here.", "收埋咗嘅 toast 仍然可以喺呢度睇返。"))}</p></div><button class="text-button" type="button" data-toast="Clear all is design-only in this preview.">${esc(copy("clearAll"))}</button></div><div class="surface-card card-pad"><div class="search-toolbar">${searchField("notifications-search", copy("searchNotifications"), state.query, "", `<button class="clear-search" type="button" aria-label="${esc(copy("clear"))}" data-clear-search>×</button>`)}<button class="filter-chip" type="button" aria-pressed="false">${esc(bilingual("All", "全部"))}</button><button class="filter-chip" type="button" aria-pressed="false">${esc(bilingual("Unread", "未讀"))}</button></div><div class="notification-list">${shown.map(row => `<article class="notification-row ${row[1]} surface-card"><span class="notification-kind" aria-hidden="true">${row[0]}</span><div class="notification-copy"><strong>${esc(row[2])}</strong><span>${esc(row[3])}</span></div><button class="text-button" type="button" data-toast="Notification dismissed locally.">${esc(copy("dismiss"))}</button></article>`).join("") || `<div class="empty-state"><p>${esc(message("noMatch"))}</p></div>`}</div></div></section>`;
  }

  function palettePage() {
    const commands = [
      ["✎", copy("compose"), "Mail", "Enter"], ["▣", copy("settings"), "Navigate", ""], ["⌕", copy("searchMail"), "Tools", "Ctrl+F"], ["↺", copy("history"), "Navigate", ""], ["☼", copy("theme"), "View", ""], ["⇩", copy("exportHistory"), "Tools", ""],
    ];
    const query = state.commandQuery.toLocaleLowerCase();
    const shown = commands.filter(row => !query || row.join(" ").toLocaleLowerCase().includes(query));
    return `<section class="page" id="preview-page" role="tabpanel" aria-labelledby="tab-palette"><div class="page-heading"><div><span class="eyebrow-label">Keyboard-first navigation</span><h2>${esc(copy("commandPalette"))}</h2><p>${esc(bilingual("Try Ctrl/Cmd+K, then use arrows and Enter.", "Ctrl/Cmd+K 撳入去，再用方向鍵同 Enter。"))}</p></div><kbd>Esc</kbd></div><div class="utility-layout"><section class="surface-card command-panel"><div class="search-toolbar">${searchField("command-search", copy("typeCommand"), state.commandQuery, "", `<button class="clear-search" type="button" aria-label="${esc(copy("clear"))}" data-clear-command>×</button>`)}</div><div class="command-list" role="listbox" aria-label="${esc(copy("commandPalette"))}">${shown.map((row, index) => `<button class="command-row" type="button" role="option" aria-selected="${index === state.paletteIndex}" data-command="${esc(row[1])}"><span class="command-icon" aria-hidden="true">${row[0]}</span><span class="command-copy"><strong>${esc(row[1])}</strong><span>${esc(row[2])}</span></span>${row[3] ? `<kbd>${esc(row[3])}</kbd>` : ""}</button>`).join("") || `<div class="empty-state"><p>${esc(message("noMatch"))}</p></div>`}</div><div class="preview-footer"><span>↑ ↓ ${esc(copy("navigate"))}</span><span>↵ ${esc(copy("run"))}</span><span>Esc ${esc(copy("close"))}</span></div></section><aside class="surface-card card-pad"><h3>${esc(bilingual("Visible gap", "清楚 gap"))}</h3><p class="date-label">${esc(bilingual("Commands change this preview page only. They do not invoke Thunderbird commands.", "指令只會改呢個預覽頁，唔會呼叫 Thunderbird 指令。"))}</p></aside></div></section>`;
  }

  function composePage() {
    return `<section class="page" id="preview-page" role="tabpanel" aria-labelledby="tab-compose"><div class="page-heading"><div><span class="eyebrow-label">Compose surface</span><h2>${esc(copy("compose"))}</h2><p>${esc(bilingual("A local form modelled on the design snapshot.", "照住 design snapshot 做嘅本地表格。"))}</p></div><span class="gap-chip">No send connection</span></div><form class="surface-card compose-panel" id="compose-form"><div class="form-grid"><div class="form-field"><label for="compose-to">${esc(copy("to"))}</label><input id="compose-to" name="to" type="email" placeholder="name@example.com" value="${esc(state.compose.to)}"></div><div class="form-field"><label for="compose-subject">${esc(copy("subject"))}</label><input id="compose-subject" name="subject" type="text" value="${esc(state.compose.subject)}"></div><div class="form-field"><label for="compose-body">${esc(copy("message"))}</label><textarea id="compose-body" name="body">${esc(state.compose.body)}</textarea></div></div><div class="compose-actions"><button class="text-button" type="button" data-page="mail">${esc(copy("cancel"))}</button><button class="tonal-button" type="button" data-compose-save>${esc(copy("saveDraft"))}</button><button class="button" type="submit">${esc(copy("send"))}</button></div><p class="date-label" style="margin:16px 0 0">${esc(bilingual("Preview only: send and save produce local status messages.", "只係預覽：寄出同存草稿只會顯示本地狀態。"))}</p></form></section>`;
  }

  function renderPage() {
    const renderers = { mail: mailPage, settings: settingsPage, changelog: changelogPage, history: historyPage, notifications: notificationsPage, palette: palettePage, compose: composePage };
    main.innerHTML = renderers[state.page]();
    bindPageEvents();
    applyTheme();
  }

  function bindPageEvents() {
    $$('[data-page]').forEach(button => button.addEventListener("click", () => setPage(button.dataset.page)));
    $$('[data-folder]').forEach(button => button.addEventListener("click", () => { state.folder = button.dataset.folder; state.messageId = DATA.MESSAGES.find(item => item.folder === state.folder)?.id || state.messageId; renderPage(); }));
    $$('[data-message]').forEach(button => button.addEventListener("click", () => { state.messageId = Number(button.dataset.message); renderPage(); }));
    $$('[data-toast]').forEach(button => button.addEventListener("click", () => showToast(button.dataset.toast)));
    const search = $("[data-search]");
    if (search) search.addEventListener("input", event => { state.query = event.target.value; renderPage(); const field = $("[data-search]"); field?.focus(); field?.setSelectionRange(state.query.length, state.query.length); });
    $("[data-clear-search]")?.addEventListener("click", () => { state.query = ""; renderPage(); $("[data-search]")?.focus(); });
    $("[data-clear-command]")?.addEventListener("click", () => { state.commandQuery = ""; renderPage(); $("#command-search")?.focus(); });
    $("#command-search")?.addEventListener("input", event => { state.commandQuery = event.target.value; state.paletteIndex = 0; renderPage(); $("#command-search")?.focus(); });
    $$('[data-command]').forEach(button => button.addEventListener("click", () => runCommand(button.dataset.command)));
    $("[data-compose-save]")?.addEventListener("click", () => { updateComposeState(); showToast(message("draftSaved")); });
    $("#compose-form")?.addEventListener("submit", event => { event.preventDefault(); updateComposeState(); showToast(message("sent")); setPage("mail"); });
    $$('[data-dimsum]').forEach(button => button.addEventListener("click", () => { const item = DATA.DIMSUM[0]; showToast(`${item.en} · ${item.zh}`, message("dimsum")); }));
    $("#setting-theme")?.addEventListener("change", event => { state.theme = event.target.value; applyTheme(); showToast(message("settingSaved")); });
    $("#setting-seed")?.addEventListener("change", event => { state.seed = event.target.value; applyTheme(); showToast(message("settingSaved")); });
    $("#setting-density")?.addEventListener("change", event => { state.density = event.target.value; applyTheme(); showToast(message("settingSaved")); });
    $("#setting-language")?.addEventListener("change", event => { state.language = event.target.value; renderTabs(); renderPage(); });
    $("#setting-fun-en")?.addEventListener("input", event => { state.funnyEnglish = event.target.value; event.target.nextElementSibling.value = `${event.target.value}/5`; });
    $("#setting-fun-zh")?.addEventListener("input", event => { state.funnyCantonese = event.target.value; event.target.nextElementSibling.value = `${event.target.value}/5`; });
    $("#setting-font")?.addEventListener("change", event => { state.font = event.target.value; applyTheme(); });
    $("#setting-font-size")?.addEventListener("input", event => { state.fontScale = event.target.value; root.style.fontSize = `${event.target.value}%`; event.target.nextElementSibling.value = `${event.target.value}%`; });
  }

  function updateComposeState() {
    state.compose.to = $("#compose-to")?.value || "";
    state.compose.subject = $("#compose-subject")?.value || "";
    state.compose.body = $("#compose-body")?.value || "";
  }

  function runCommand(command) {
    const lower = command.toLocaleLowerCase();
    if (lower.includes("compose")) return setPage("compose");
    if (lower.includes("settings")) return setPage("settings");
    if (lower.includes("history")) return setPage("history");
    if (lower.includes("search")) { setPage("mail"); setTimeout(() => $("#mail-search")?.focus(), 0); return; }
    if (lower.includes("theme")) { state.theme = state.theme === "dark" ? "light" : "dark"; applyTheme(); showToast(message("settingSaved")); }
  }

  function showToast(body, title = "Local preview") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span aria-hidden="true">●</span><div><strong>${esc(title)}</strong><span>${esc(body)}</span></div><button type="button" aria-label="Dismiss">×</button>`;
    $("button", toast).addEventListener("click", () => toast.remove());
    toasts.append(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  $("#theme-toggle").addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; applyTheme(); });
  $("#more-tabs").addEventListener("click", () => { const current = pageMeta.findIndex(item => item.id === state.page); setPage(pageMeta[(current + 1) % pageMeta.length].id); });
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPage("palette"); setTimeout(() => $("#command-search")?.focus(), 0); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") { event.preventDefault(); setPage("mail"); setTimeout(() => $("#mail-search")?.focus(), 0); }
    if (event.key === "Escape" && state.page === "palette") setPage("mail");
  });

  renderTabs();
  renderPage();
  showToast(bilingual("Local preview ready · no Thunderbird runtime connected.", "本地預覽準備好 · 未連接 Thunderbird runtime。"));
})();
