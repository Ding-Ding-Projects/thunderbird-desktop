/* Docs application: browser-style tabs, search wired to the regex builder,
 * language modes and per-language funny-level sliders.
 *
 * Global instructions this satisfies:
 *  - Content is presented as browser-style tabs, not one long scrolling page,
 *    with an overflow surface, pinning, reordering and a searchable tab list.
 *  - Every search bar provides direct access to the full regex builder,
 *    ANCHORED BESIDE the field it serves. Plain text is the default; regex is
 *    an explicit opt-in; query, pattern, flags and mode stay in sync.
 *  - Language modes (English / Cantonese / bilingual) and independent
 *    funny-level sliders, persisted.
 *  - Tabs are keyboard- and screen-reader-operable with roving focus.
 */

import { CATEGORIES, allDocs, REPO, BRANCH } from "./docs-data.js";
import { loadPrefs, savePrefs, applyTheme, t, tHtml, searchText, escapeHtml, LEVEL_NAMES } from "./i18n.js";
import { mountRegexBuilder, safeMatch, escapeLiteral } from "./regex-builder.js";

const TAB_KEY = "mm-tabs-v1";

let prefs = loadPrefs();
let query = "";
let regexMode = false;
let regexFlags = "gi";
let activeTab = CATEGORIES[0].id;
let tabState = loadTabs();

function loadTabs() {
  const base = CATEGORIES.map(c => ({ id: c.id, pinned: false }));
  try {
    const raw = localStorage.getItem(TAB_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    // Reconcile with current categories: keep saved order, drop unknown, append new.
    const known = new Set(base.map(b => b.id));
    const kept = saved.filter(s => known.has(s.id)).map(s => ({ id: s.id, pinned: !!s.pinned }));
    for (const b of base) if (!kept.some(k => k.id === b.id)) kept.push(b);
    return kept;
  } catch { return base; }
}
function saveTabs() {
  try { localStorage.setItem(TAB_KEY, JSON.stringify(tabState)); } catch { /* non-fatal */ }
}

function orderedTabs() {
  // Pinned first, otherwise saved order.
  return [...tabState].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
}
const catById = id => CATEGORIES.find(c => c.id === id);

/* ---------------------------------------------------------------- search */

function matcher() {
  if (!query.trim()) return null;
  if (regexMode) {
    const probe = safeMatch(query, regexFlags, "");
    if (!probe.ok) return { invalid: true, error: probe.error };
    let re;
    try { re = new RegExp(query, regexFlags.replace("g", "")); } catch { return { invalid: true, error: "invalid" }; }
    return { test: s => re.test(s) };
  }
  const needle = query.toLowerCase();
  return { test: s => s.toLowerCase().includes(needle) };
}

function docText(d) {
  const parts = [searchText(d.title)];
  for (const b of d.body || []) {
    if (b.p) parts.push(searchText(b.p));
    if (b.h) parts.push(searchText(b.h));
    if (b.callout) parts.push(searchText(b.callout.text));
    if (b.list) for (const li of b.list) parts.push(searchText(li));
    if (b.table) {
      for (const h of b.table.head) parts.push(searchText(h));
      for (const row of b.table.rows) for (const cell of row) parts.push(searchText(cell));
    }
  }
  for (const f of d.failures || []) { parts.push(searchText(f.t)); parts.push(searchText(f.d)); }
  if (d.security) parts.push(searchText(d.security));
  if (d.verify) parts.push(searchText(d.verify));
  return parts.join(" ");
}

/* ---------------------------------------------------------------- render */

function renderTabs() {
  const strip = document.getElementById("tabstrip");
  strip.innerHTML = "";
  for (const ts of orderedTabs()) {
    const c = catById(ts.id);
    if (!c) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (ts.id === activeTab ? " active" : "");
    b.setAttribute("role", "tab");
    b.id = `tab-${c.id}`;
    b.setAttribute("aria-selected", String(ts.id === activeTab));
    b.setAttribute("aria-controls", "tabpanel");
    b.tabIndex = ts.id === activeTab ? 0 : -1;   // roving focus
    b.innerHTML =
      `<span aria-hidden="true">${c.icon}</span> <span>${tHtml(c.name, prefs)}</span>` +
      (ts.pinned ? ` <span class="pin" title="Pinned" aria-label="Pinned">📌</span>` : "");
    b.addEventListener("click", () => { activeTab = c.id; render(); });
    b.addEventListener("contextmenu", e => { e.preventDefault(); togglePin(c.id); });
    b.addEventListener("keydown", e => onTabKey(e, c.id));
    strip.appendChild(b);
  }
}

function onTabKey(e, id) {
  const list = orderedTabs().map(t => t.id);
  const i = list.indexOf(id);
  let next = null;
  if (e.key === "ArrowRight") next = list[(i + 1) % list.length];
  else if (e.key === "ArrowLeft") next = list[(i - 1 + list.length) % list.length];
  else if (e.key === "Home") next = list[0];
  else if (e.key === "End") next = list[list.length - 1];
  else if (e.key === "p" && e.altKey) { togglePin(id); return; }
  else if (e.key === "[" ) { moveTab(id, -1); return; }
  else if (e.key === "]" ) { moveTab(id, 1); return; }
  if (next) {
    e.preventDefault();
    activeTab = next;
    render();
    document.getElementById(`tab-${next}`)?.focus();
  }
}

function togglePin(id) {
  const t = tabState.find(x => x.id === id);
  if (!t) return;
  t.pinned = !t.pinned;
  saveTabs(); render();
  notify(t.pinned
    ? { en: "Tab pinned.", zh: "分頁釘住咗。" }
    : { en: "Tab unpinned.", zh: "分頁解除釘住。" });
}

function moveTab(id, dir) {
  const i = tabState.findIndex(x => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= tabState.length) return;
  [tabState[i], tabState[j]] = [tabState[j], tabState[i]];
  saveTabs(); render();
  document.getElementById(`tab-${id}`)?.focus();
}

function renderPanel() {
  const panel = document.getElementById("tabpanel");
  const c = catById(activeTab);
  panel.setAttribute("aria-labelledby", `tab-${activeTab}`);

  const m = matcher();
  if (m?.invalid) {
    panel.innerHTML = `<div class="card"><div class="callout warn">
      <strong>Invalid pattern.</strong> ${escapeHtml(m.error || "")} — showing everything instead.
      <div class="secondary zh" lang="zh-HK">個 pattern 唔啱,暫時顯示全部。</div></div></div>`;
    return;
  }

  const docs = c.docs.filter(d => !m || m.test(docText(d)));
  const hidden = c.docs.length - docs.length;

  let html = `<div class="cat-head">
      <h2>${c.icon} ${tHtml(c.name, prefs)}</h2>
      <p class="muted">${tHtml(c.blurb, prefs)}</p>
    </div>`;

  if (!docs.length) {
    html += `<div class="card"><p><strong>${escapeHtml(t({ en: "Nothing matches that search.", zh: "冇嘢符合搜尋。" }, prefs))}</strong></p>
      <p class="muted">${escapeHtml(t({ en: "Try fewer characters, or switch off regex mode.", zh: "試下打少幾個字,或者閂咗 regex。" }, prefs))}</p></div>`;
  }

  for (const d of docs) {
    html += `<article class="card doc" id="doc-${escapeHtml(d.id)}">
      <h2>${tHtml(d.title, prefs)}</h2>${renderBody(d.body)}`;
    if (d.failures?.length) {
      html += `<h3>${escapeHtml(t({ en: "Failure modes", zh: "會點衰" }, prefs))}</h3><div class="scroll"><table><tbody>`;
      for (const f of d.failures) {
        html += `<tr><th style="white-space:nowrap">${tHtml(f.t, prefs)}</th><td>${tHtml(f.d, prefs)}</td></tr>`;
      }
      html += `</tbody></table></div>`;
    }
    if (d.security) {
      html += `<h3>${escapeHtml(t({ en: "Security", zh: "保安" }, prefs))}</h3>
        <div class="callout warn">${tHtml(d.security, prefs)}</div>`;
    }
    if (d.verify) {
      html += `<h3>${escapeHtml(t({ en: "Verification", zh: "點樣驗證" }, prefs))}</h3>
        <div class="callout">${tHtml(d.verify, prefs)}</div>`;
    }
    html += `</article>`;
  }

  if (hidden > 0) {
    html += `<p class="muted small">${hidden} ${escapeHtml(t({ en: "entry hidden by the current search.", zh: "項因為搜尋而收埋咗。" }, prefs))}</p>`;
  }
  panel.innerHTML = html;
}

function renderBody(body) {
  let h = "";
  for (const b of body || []) {
    if (b.h) h += `<h3>${tHtml(b.h, prefs)}</h3>`;
    if (b.p) h += `<p>${tHtml(b.p, prefs)}</p>`;
    if (b.list) {
      h += `<ul>` + b.list.map(li => `<li>${tHtml(li, prefs)}</li>`).join("") + `</ul>`;
    }
    if (b.callout) {
      h += `<div class="callout ${b.callout.kind === "warn" ? "warn" : "note"}">${tHtml(b.callout.text, prefs)}</div>`;
    }
    if (b.table) {
      h += `<div class="scroll"><table><thead><tr>` +
        b.table.head.map(x => `<th>${tHtml(x, prefs)}</th>`).join("") +
        `</tr></thead><tbody>` +
        b.table.rows.map(r => `<tr>` + r.map((cell, i) =>
          i === 0 ? `<th>${tHtml(cell, prefs)}</th>` : `<td>${tHtml(cell, prefs)}</td>`).join("") + `</tr>`).join("") +
        `</tbody></table></div>`;
    }
  }
  return h;
}

/* --------------------------------------------------------- notifications */

function notify(msg) {
  // Non-blocking, corner-anchored, auto-dismissing. Never a modal dialog.
  const host = document.getElementById("snackbars");
  const el = document.createElement("div");
  el.className = "snack";
  el.setAttribute("role", "status");
  el.innerHTML = tHtml(msg, prefs);
  host.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 200); }, 3200);
}

/* ------------------------------------------------------------- settings */

function renderSettings() {
  const box = document.getElementById("settings");
  box.innerHTML = `
    <div class="set-row">
      <label class="lbl" for="set-lang">${escapeHtml(t({ en: "Language mode", zh: "語言模式" }, prefs))}</label>
      <select id="set-lang" class="field">
        <option value="en">English</option>
        <option value="zh">廣東話</option>
        <option value="both">Bilingual · 雙語</option>
      </select>
    </div>
    <div class="set-row">
      <label class="lbl" for="set-theme">${escapeHtml(t({ en: "Theme", zh: "主題" }, prefs))}</label>
      <select id="set-theme" class="field">
        <option value="auto">${escapeHtml(t({ en: "Follow system", zh: "跟系統" }, prefs))}</option>
        <option value="light">${escapeHtml(t({ en: "Light", zh: "淺色" }, prefs))}</option>
        <option value="dark">${escapeHtml(t({ en: "Dark", zh: "深色" }, prefs))}</option>
      </select>
    </div>
    <div class="set-row">
      <label class="lbl" for="set-fun-en">${escapeHtml(t({ en: "Funny level — English", zh: "幽默程度 — 英文" }, prefs))}:
        <strong id="fun-en-name">${LEVEL_NAMES.en[prefs.funEn - 1]}</strong></label>
      <input type="range" id="set-fun-en" min="1" max="5" step="1" value="${prefs.funEn}">
    </div>
    <div class="set-row">
      <label class="lbl" for="set-fun-zh">${escapeHtml(t({ en: "Funny level — Cantonese", zh: "幽默程度 — 廣東話" }, prefs))}:
        <strong id="fun-zh-name" class="zh" lang="zh-HK">${LEVEL_NAMES.zh[prefs.funZh - 1]}</strong></label>
      <input type="range" id="set-fun-zh" min="1" max="5" step="1" value="${prefs.funZh}">
    </div>
    <p class="muted small">${escapeHtml(t({
      en: "The funny level styles every message on this site, including warnings and errors. It changes voice, never facts — commits, file names and outcomes stay exact at every level.",
      zh: "幽默程度會影響呢個網站所有文字,包括警告同錯誤。佢只係改語氣,唔會改事實 —— commit、檔案名、結果每一級都一樣準確。",
    }, prefs))}</p>`;

  const lang = box.querySelector("#set-lang"); lang.value = prefs.lang;
  const theme = box.querySelector("#set-theme"); theme.value = prefs.theme;

  lang.addEventListener("change", () => { prefs.lang = lang.value; persist(); render(); });
  theme.addEventListener("change", () => { prefs.theme = theme.value; applyTheme(prefs.theme); persist(); render(); });
  box.querySelector("#set-fun-en").addEventListener("input", e => {
    prefs.funEn = Number(e.target.value); persist(); render();
    document.getElementById("set-fun-en")?.focus();
  });
  box.querySelector("#set-fun-zh").addEventListener("input", e => {
    prefs.funZh = Number(e.target.value); persist(); render();
    document.getElementById("set-fun-zh")?.focus();
  });
}

function persist() { savePrefs(prefs); }

/* ------------------------------------------------------------------ init */

function render() { renderTabs(); renderPanel(); renderSettings(); }

function init() {
  applyTheme(prefs.theme);

  const searchEl = document.getElementById("search");
  const regexBtn = document.getElementById("regex-toggle");
  const builderBtn = document.getElementById("regex-builder-btn");

  searchEl.addEventListener("input", () => { query = searchEl.value; renderPanel(); });

  regexBtn.addEventListener("click", () => {
    regexMode = !regexMode;
    regexBtn.setAttribute("aria-pressed", String(regexMode));
    // Bidirectional sync: switching INTO regex escapes the plain query so the
    // same text keeps matching instead of silently becoming a pattern.
    if (regexMode && query && !/[\\^$.*+?()[\]{}|]/.test(query)) {
      searchEl.value = escapeLiteral(query);
      query = searchEl.value;
    }
    renderPanel();
    notify(regexMode
      ? { en: "Regex mode on.", zh: "Regex 模式開咗。" }
      : { en: "Plain text search.", zh: "純文字搜尋。" });
  });

  // The builder is ANCHORED BESIDE this search bar, per the global instructions.
  const rb = mountRegexBuilder({
    anchor: builderBtn,
    input: searchEl,
    escapeHtml,
    getSample: () => allDocs().map(docText).join("\n"),
    onApply: (pattern, flags) => {
      searchEl.value = pattern;
      query = pattern;
      regexFlags = flags;
      regexMode = true;
      regexBtn.setAttribute("aria-pressed", "true");
      renderPanel();
      notify({ en: "Pattern applied to search.", zh: "Pattern 套咗落搜尋度。" });
    },
  });
  document.getElementById("search-anchor").appendChild(rb.panel);

  // Ctrl/Cmd+F focuses the search bar of the surface you are looking at.
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault(); searchEl.focus(); searchEl.select();
    }
  });

  // Searchable tab list.
  const tabFilter = document.getElementById("tab-filter");
  tabFilter.addEventListener("input", () => {
    const q = tabFilter.value.toLowerCase();
    for (const ts of tabState) {
      const c = catById(ts.id);
      const hit = !q || searchText(c.name).toLowerCase().includes(q) || searchText(c.blurb).toLowerCase().includes(q);
      const el = document.getElementById(`tab-${ts.id}`);
      if (el) el.style.display = hit ? "" : "none";
    }
  });

  render();
}

document.addEventListener("DOMContentLoaded", init);
