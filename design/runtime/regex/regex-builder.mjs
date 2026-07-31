/**
 * Anchored, reusable JavaScript RegExp builder.
 *
 * This module deliberately has no Thunderbird imports. It can be mounted beside
 * any search field in a browser document and keeps the builder state local to
 * that field.
 */

export const DIALECT = "JavaScript RegExp (ECMAScript)";

export const LIMITS = Object.freeze({
  maxPatternLength: 512,
  maxSampleLength: 100_000,
  maxMatches: 200,
  maxMatchTextLength: 10_000,
  maxCaptureGroups: 64,
  maxEvaluationMs: 50,
});

const FLAG_ORDER = "dgimsuvy";

export const FLAGS = Object.freeze([
  { value: "d", en: "Indices", zh: "索引位置" },
  { value: "g", en: "Global", zh: "全部匹配" },
  { value: "i", en: "Ignore case", zh: "忽略大小寫" },
  { value: "m", en: "Multiline", zh: "多行" },
  { value: "s", en: "Dot matches newline", zh: "點號匹配換行" },
  { value: "u", en: "Unicode", zh: "Unicode" },
  { value: "v", en: "Unicode sets", zh: "Unicode 集合" },
  { value: "y", en: "Sticky", zh: "黏性匹配" },
]);

export const GUIDED_TOKENS = Object.freeze([
  { id: "literal", snippet: "literal", insert: "text", en: "Literal", zh: "字面文字" },
  { id: "class", snippet: "[abc]", insert: "[abc]", en: "Character class", zh: "字符類別" },
  { id: "digit", snippet: "\\d", insert: "\\d", en: "Digit", zh: "數字" },
  { id: "word", snippet: "\\w", insert: "\\w", en: "Word character", zh: "文字字符" },
  { id: "start", snippet: "^", insert: "^", en: "Start anchor", zh: "開頭錨點" },
  { id: "end", snippet: "$", insert: "$", en: "End anchor", zh: "結尾錨點" },
  { id: "group", snippet: "(…)", insert: "(text)", en: "Capture group", zh: "捕獲組" },
  { id: "named-group", snippet: "(?<name>…)", insert: "(?<name>text)", en: "Named group", zh: "命名組" },
  { id: "alternate", snippet: "a|b", insert: "a|b", en: "Alternation", zh: "選擇" },
  { id: "optional", snippet: "?", insert: "?", en: "Optional", zh: "可選" },
  { id: "one-or-more", snippet: "+", insert: "+", en: "One or more", zh: "一個或以上" },
  { id: "zero-or-more", snippet: "*", insert: "*", en: "Zero or more", zh: "零個或以上" },
  { id: "range", snippet: "{1,3}", insert: "{1,3}", en: "Bounded quantifier", zh: "有界量詞" },
]);

export const LABELS = Object.freeze({
  title: { en: "Regular expression builder", zh: "正規表達式建立器" },
  plain: { en: "Plain text", zh: "純文字" },
  regex: { en: "Regular expression", zh: "正規表達式" },
  pattern: { en: "Raw pattern", zh: "原始模式" },
  flags: { en: "Flags", zh: "旗標" },
  guided: { en: "Guided tokens", zh: "引導式符號" },
  sample: { en: "Sample text", zh: "範例文字" },
  validation: { en: "Validation", zh: "驗證" },
  matches: { en: "Matches and capture groups", zh: "匹配及捕獲組" },
  copy: { en: "Copy", zh: "複製" },
  export: { en: "Export", zh: "匯出" },
  apply: { en: "Use in search", zh: "套用到搜尋" },
  close: { en: "Close", zh: "關閉" },
  plainDefault: { en: "Plain text is the default.", zh: "預設使用純文字。" },
  noMatch: { en: "No matches in the sample text.", zh: "範例文字中沒有匹配。" },
  evaluating: { en: "Evaluating locally…", zh: "正在本機評估…" },
  copied: { en: "Builder state copied.", zh: "建立器狀態已複製。" },
  exported: { en: "Builder state exported.", zh: "建立器狀態已匯出。" },
});

function text(value) {
  return value == null ? "" : String(value);
}
function truncate(value, limit) {
  const source = text(value);
  return source.length <= limit ? source : source.slice(0, limit);
}

function bilingual(label, className = "") {
  const wrapper = document.createElement("span");
  wrapper.className = className;
  const primary = document.createElement("span");
  primary.textContent = label.en;
  const secondary = document.createElement("span");
  secondary.className = "regex-builder-zh";
  secondary.lang = "zh-HK";
  secondary.textContent = ` · ${label.zh}`;
  wrapper.append(primary, secondary);
  return wrapper;
}

export function escapeLiteral(value) {
  return text(value).replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&");
}

export function normalizeFlags(flags = "") {
  const source = text(flags);
  const seen = new Set();
  for (const flag of source) {
    if (!FLAG_ORDER.includes(flag)) throw new Error(`Unsupported JavaScript RegExp flag: ${flag}`);
    if (seen.has(flag)) throw new Error(`Duplicate JavaScript RegExp flag: ${flag}`);
    seen.add(flag);
  }
  return [...FLAG_ORDER].filter((flag) => seen.has(flag)).join("");
}

function hasQuantifier(source) {
  let escaped = false;
  let inClass = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "[") inClass = true;
    if (char === "]") inClass = false;
    if (!inClass && (char === "*" || char === "+" || char === "?" || char === "{")) return true;
  }
  return false;
}

function hasNestedQuantifier(source) {
  const groups = [];
  let escaped = false;
  let inClass = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "[") {
      inClass = true;
      continue;
    }
    if (char === "]") {
      inClass = false;
      continue;
    }
    if (inClass) continue;
    if (char === "(") {
      groups.push(i);
      continue;
    }
    if (char === ")" && groups.length) {
      const start = groups.pop();
      let end = i + 1;
      while (end < source.length && source[end] === "?") end += 1;
      const outerQuantified = source[end] === "*" || source[end] === "+" || source[end] === "?" || source[end] === "{";
      if (outerQuantified && hasQuantifier(source.slice(start + 1, i))) return true;
    }
  }
  return false;
}

export function safetyIssue(pattern, limits = LIMITS) {
  const source = text(pattern);
  if (source.length > limits.maxPatternLength) return `Pattern exceeds ${limits.maxPatternLength} characters.`;
  if (/\\(?:\d+|k<[^>]+>)/.test(source)) {
    return "Backreferences are disabled because they can make evaluation disproportionately expensive.";
  }
  if (hasNestedQuantifier(source)) {
    return "Nested quantifiers are disabled because they can trigger catastrophic backtracking.";
  }
  return "";
}

export function countCaptureGroups(pattern) {
  let count = 0;
  let escaped = false;
  let inClass = false;
  for (let i = 0; i < text(pattern).length; i += 1) {
    const char = pattern[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "[") inClass = true;
    if (char === "]") inClass = false;
    if (!inClass && char === "(" && pattern[i + 1] !== "?" ) count += 1;
    if (!inClass && char === "(" && pattern.slice(i, i + 4) === "(?<" && pattern[i + 3] !== "=") count += 1;
  }
  return count;
}

export function validatePattern(pattern, flags = "", limits = LIMITS) {
  const source = text(pattern);
  let normalizedFlags;
  try {
    normalizedFlags = normalizeFlags(flags);
  } catch (error) {
    return { ok: false, error: error.message, regex: null, flags: "" };
  }
  const issue = safetyIssue(source, limits);
  if (issue) return { ok: false, error: issue, regex: null, flags: normalizedFlags };
  if (countCaptureGroups(source) > limits.maxCaptureGroups) {
    return { ok: false, error: `Pattern exceeds the ${limits.maxCaptureGroups}-group capture limit.`, regex: null, flags: normalizedFlags };
  }
  try {
    const regex = new RegExp(source, normalizedFlags);
    return { ok: true, error: "", regex, flags: normalizedFlags };
  } catch (error) {
    return { ok: false, error: error.message, regex: null, flags: normalizedFlags };
  }
}

function advanceStringIndex(source, index, unicode) {
  if (!unicode || index + 1 >= source.length) return index + 1;
  const first = source.charCodeAt(index);
  const second = source.charCodeAt(index + 1);
  return first >= 0xd800 && first <= 0xdbff && second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

function matchRecord(match, limits) {
  const groups = Array.from(match).slice(1, limits.maxCaptureGroups + 1);
  const namedGroups = match.groups ? Object.fromEntries(Object.entries(match.groups).slice(0, limits.maxCaptureGroups)) : {};
  return {
    text: truncate(match[0], limits.maxMatchTextLength),
    index: match.index ?? 0,
    groups,
    namedGroups,
    indices: match.indices ?? null,
  };
}

export function evaluateRegexSync(pattern, flags, sampleText, limits = LIMITS) {
  const sample = truncate(sampleText, limits.maxSampleLength);
  const validation = validatePattern(pattern, flags, limits);
  if (!validation.ok) return { ok: false, error: validation.error, matches: [], capped: false, timedOut: false, truncated: sample.length !== text(sampleText).length };
  const effectiveFlags = validation.flags.includes("g") ? validation.flags : `${validation.flags}g`;
  const regex = new RegExp(text(pattern), effectiveFlags);
  const matches = [];
  const started = performance.now();
  let capped = false;
  let timedOut = false;
  while (matches.length < limits.maxMatches) {
    if (performance.now() - started > limits.maxEvaluationMs) {
      timedOut = true;
      break;
    }
    const before = regex.lastIndex;
    const match = regex.exec(sample);
    if (!match) break;
    matches.push(matchRecord(match, limits));
    if (match[0] === "" && regex.lastIndex <= before) regex.lastIndex = advanceStringIndex(sample, before, validation.flags.includes("u") || validation.flags.includes("v"));
  }
  if (matches.length >= limits.maxMatches && regex.lastIndex <= sample.length) capped = true;
  return { ok: true, error: "", matches, capped, timedOut, truncated: sample.length !== text(sampleText).length, execution: "main-thread-guarded" };
}

export function evaluatePlainSync(query, sampleText, limits = LIMITS) {
  const source = truncate(sampleText, limits.maxSampleLength);
  const needle = truncate(query, limits.maxPatternLength);
  if (!needle) return { ok: true, error: "", matches: [], capped: false, timedOut: false, truncated: source.length !== text(sampleText).length, execution: "literal" };
  const matches = [];
  let index = source.indexOf(needle);
  while (index !== -1 && matches.length < limits.maxMatches) {
    matches.push({ text: needle, index, groups: [], namedGroups: {}, indices: null });
    index = source.indexOf(needle, index + Math.max(needle.length, 1));
  }
  return { ok: true, error: "", matches, capped: matches.length >= limits.maxMatches && index !== -1, timedOut: false, truncated: source.length !== text(sampleText).length, execution: "literal" };
}

export function evaluateSync({ mode = "plain", query = "", pattern = "", flags = "", sampleText = "" } = {}, limits = LIMITS) {
  return mode === "regex" ? evaluateRegexSync(pattern, flags, sampleText, limits) : evaluatePlainSync(query, sampleText, limits);
}

function workerSource() {
  return `self.onmessage = ({ data }) => {
    const started = performance.now();
    try {
      const regex = new RegExp(data.pattern, data.flags.includes("g") ? data.flags : data.flags + "g");
      const matches = [];
      let timedOut = false;
      while (matches.length < data.maxMatches) {
        if (performance.now() - started > data.timeoutMs) { timedOut = true; break; }
        const before = regex.lastIndex;
        const match = regex.exec(data.sampleText);
        if (!match) break;
        matches.push({ text: match[0].slice(0, data.maxMatchTextLength), index: match.index || 0, groups: Array.from(match).slice(1, data.maxCaptureGroups + 1), namedGroups: match.groups || {}, indices: match.indices || null });
        if (match[0] === "" && regex.lastIndex <= before) regex.lastIndex = before + 1;
      }
      self.postMessage({ ok: true, error: "", matches, capped: matches.length >= data.maxMatches, timedOut });
    } catch (error) { self.postMessage({ ok: false, error: error.message, matches: [], capped: false, timedOut: false }); }
  };`;
}

export async function evaluateBounded(state, limits = LIMITS) {
  const normalizedState = {
    ...state,
    pattern: truncate(state?.pattern, limits.maxPatternLength),
    query: truncate(state?.query, limits.maxPatternLength),
    sampleText: truncate(state?.sampleText, limits.maxSampleLength),
  };
  const preflight = normalizedState.mode === "regex" ? validatePattern(normalizedState.pattern, normalizedState.flags, limits) : { ok: true, error: "" };
  if (!preflight.ok) return { ok: false, error: preflight.error, matches: [], capped: false, timedOut: false, execution: "preflight-rejected" };
  if (normalizedState.mode !== "regex" || typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") return evaluateSync(normalizedState, limits);

  const url = URL.createObjectURL(new Blob([workerSource()], { type: "text/javascript" }));
  const worker = new Worker(url);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ ...result, execution: "worker" });
    };
    const timeout = setTimeout(() => finish({ ok: false, error: "Evaluation exceeded the time limit.", matches: [], capped: false, timedOut: true }), limits.maxEvaluationMs + 25);
    worker.onmessage = ({ data }) => finish(data);
    worker.onerror = () => finish({ ok: false, error: "The evaluation worker failed.", matches: [], capped: false, timedOut: false });
    worker.postMessage({
      pattern: normalizedState.pattern,
      flags: preflight.flags,
      sampleText: normalizedState.sampleText,
      maxMatches: limits.maxMatches,
      maxMatchTextLength: limits.maxMatchTextLength,
      maxCaptureGroups: limits.maxCaptureGroups,
      timeoutMs: limits.maxEvaluationMs,
    });
  });
}

export function serializeState(state) {
  return JSON.stringify({
    format: "material-mail-regex-builder",
    version: 1,
    engine: DIALECT,
    mode: state.mode === "regex" ? "regex" : "plain",
    query: truncate(state.query, LIMITS.maxPatternLength),
    pattern: truncate(state.pattern, LIMITS.maxPatternLength),
    flags: normalizeFlags(state.flags || ""),
    sampleText: truncate(state.sampleText, LIMITS.maxSampleLength),
  }, null, 2);
}

export function parseState(serialized) {
  const data = JSON.parse(text(serialized));
  if (data.format !== "material-mail-regex-builder" || data.version !== 1 || data.engine !== DIALECT) throw new Error("Unsupported regex builder export.");
  const flags = normalizeFlags(data.flags || "");
  const state = {
    mode: data.mode === "regex" ? "regex" : "plain",
    query: truncate(data.query, LIMITS.maxPatternLength),
    pattern: truncate(data.pattern, LIMITS.maxPatternLength),
    flags,
    sampleText: truncate(data.sampleText, LIMITS.maxSampleLength),
  };
  if (state.mode === "regex") {
    const validation = validatePattern(state.pattern, state.flags);
    if (!validation.ok) throw new Error(validation.error);
  }
  return state;
}

function button(label, className = "") {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.append(bilingual(label));
  return element;
}

function fieldLabel(label, control) {
  const element = document.createElement("label");
  element.className = "regex-builder-field-label";
  element.append(bilingual(label));
  element.append(control);
  return element;
}

export class RegexBuilder {
  constructor({ anchor, input, panel, scope = "Applies to this search field · 套用到此搜尋欄", initialState = {}, onApply = () => {}, onStatus = () => {} } = {}) {
    if (!anchor || !input || !panel) throw new TypeError("RegexBuilder needs an anchor, input, and panel element.");
    this.anchor = anchor;
    this.input = input;
    this.panel = panel;
    this.scope = scope;
    this.onApply = onApply;
    this.onStatus = onStatus;
    this.state = {
      mode: initialState.mode === "regex" ? "regex" : "plain",
      query: initialState.query ?? input.value ?? "",
      pattern: initialState.pattern ?? "",
      flags: initialState.flags ?? "gi",
      sampleText: initialState.sampleText ?? "Invoice #20261 arrived, receipt 4471 is attached.",
    };
    this.renderVersion = 0;
    this.handleDocumentKeydown = (event) => {
      if (event.key === "Escape" && !this.panel.hidden) this.close();
    };
    this.handleViewportChange = () => { if (!this.panel.hidden) this.position(); };
    anchor.setAttribute("aria-haspopup", "dialog");
    anchor.setAttribute("aria-expanded", "false");
    anchor.addEventListener("click", () => this.toggle());
    input.addEventListener("input", () => {
      if (this.state.mode === "plain") this.state.query = input.value;
      else this.state.pattern = input.value;
      if (!this.panel.hidden) this.renderResults();
    });
  }

  getState() { return { ...this.state }; }

  toggle() { this.panel.hidden ? this.open() : this.close(); }

  open() {
    this.panel.hidden = false;
    this.anchor.setAttribute("aria-expanded", "true");
    this.render();
    document.addEventListener("keydown", this.handleDocumentKeydown);
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange, true);
    this.position();
    this.panel.querySelector("[data-regex-pattern]")?.focus();
  }

  close() {
    this.panel.hidden = true;
    this.anchor.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", this.handleDocumentKeydown);
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    this.anchor.focus();
  }

  position() {
    const rect = this.anchor.getBoundingClientRect();
    const panelWidth = Math.min(560, window.innerWidth - 24);
    const panelHeight = Math.min(this.panel.scrollHeight || 640, window.innerHeight - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - panelWidth - 12));
    const top = rect.bottom + panelHeight + 12 <= window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - panelHeight - 8);
    Object.assign(this.panel.style, { position: "fixed", left: `${left}px`, top: `${top}px`, maxWidth: `${panelWidth}px`, maxHeight: `${panelHeight}px` });
  }

  setMode(mode) {
    this.state.mode = mode === "regex" ? "regex" : "plain";
    if (this.state.mode === "plain") this.input.value = this.state.query;
    else {
      if (!this.state.pattern) this.state.pattern = escapeLiteral(this.state.query);
      this.input.value = this.state.pattern;
    }
    this.render();
  }

  insertToken(token) {
    const pattern = this.panel.querySelector("[data-regex-pattern]");
    const insertion = token.id === "literal" ? escapeLiteral(this.input.value || "text") : token.insert;
    if (!pattern) {
      this.state.pattern += insertion;
      return;
    }
    const start = pattern.selectionStart ?? pattern.value.length;
    const end = pattern.selectionEnd ?? start;
    this.state.pattern = `${pattern.value.slice(0, start)}${insertion}${pattern.value.slice(end)}`;
    this.render();
    const next = this.panel.querySelector("[data-regex-pattern]");
    next.focus();
    next.setSelectionRange(start + insertion.length, start + insertion.length);
  }

  render() {
    this.panel.replaceChildren();
    this.panel.className = "regex-builder-panel";
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-label", `${LABELS.title.en} · ${LABELS.title.zh}`);

    const header = document.createElement("header");
    header.className = "regex-builder-header";
    header.append(bilingual(LABELS.title, "regex-builder-title"));
    const close = button(LABELS.close, "regex-builder-close");
    close.setAttribute("aria-label", `${LABELS.close.en} · ${LABELS.close.zh}`);
    close.addEventListener("click", () => this.close());
    header.append(close);
    this.panel.append(header);

    const scope = document.createElement("p");
    scope.className = "regex-builder-scope";
    scope.textContent = this.scope;
    this.panel.append(scope);

    const modes = document.createElement("div");
    modes.className = "regex-builder-modes";
    for (const [mode, label] of [["plain", LABELS.plain], ["regex", LABELS.regex]]) {
      const modeButton = button(label, "regex-builder-mode");
      modeButton.ariaPressed = String(this.state.mode === mode);
      modeButton.classList.toggle("is-selected", this.state.mode === mode);
      modeButton.addEventListener("click", () => this.setMode(mode));
      modes.append(modeButton);
    }
    this.panel.append(modes);

    const pattern = document.createElement("textarea");
    pattern.rows = 2;
    pattern.value = this.state.mode === "regex" ? this.state.pattern : this.state.query;
    pattern.dataset.regexPattern = "";
    pattern.spellcheck = false;
    pattern.addEventListener("input", () => {
      if (this.state.mode === "regex") this.state.pattern = pattern.value;
      else { this.state.query = pattern.value; this.input.value = pattern.value; }
      this.renderResults();
    });
    this.panel.append(fieldLabel(this.state.mode === "regex" ? LABELS.pattern : LABELS.plain, pattern));

    if (this.state.mode === "regex") {
      const flags = document.createElement("div");
      flags.className = "regex-builder-flags";
      flags.append(bilingual(LABELS.flags, "regex-builder-section-title"));
      for (const flag of FLAGS) {
        const flagButton = document.createElement("button");
        flagButton.type = "button";
        flagButton.className = "regex-builder-flag";
        flagButton.ariaPressed = String(this.state.flags.includes(flag.value));
        flagButton.title = `${flag.en} · ${flag.zh}`;
        flagButton.textContent = flag.value;
        flagButton.addEventListener("click", () => {
          const next = this.state.flags.includes(flag.value) ? this.state.flags.replace(flag.value, "") : `${this.state.flags}${flag.value}`;
          try { this.state.flags = normalizeFlags(next); } catch { return; }
          this.render();
        });
        flags.append(flagButton);
      }
      this.panel.append(flags);

      const guided = document.createElement("div");
      guided.className = "regex-builder-guided";
      guided.append(bilingual(LABELS.guided, "regex-builder-section-title"));
      for (const token of GUIDED_TOKENS) {
        const tokenButton = button({ en: token.snippet, zh: token.zh }, "regex-builder-token");
        tokenButton.title = `${token.en} · ${token.zh}`;
        tokenButton.addEventListener("click", () => this.insertToken(token));
        guided.append(tokenButton);
      }
      this.panel.append(guided);
    }

    const sample = document.createElement("textarea");
    sample.rows = 4;
    sample.value = this.state.sampleText;
    sample.dataset.regexSample = "";
    sample.addEventListener("input", () => { this.state.sampleText = sample.value; this.renderResults(); });
    this.panel.append(fieldLabel(LABELS.sample, sample));

    const validation = document.createElement("section");
    validation.dataset.regexResults = "";
    this.panel.append(validation);
    this.renderResults();

    const actions = document.createElement("div");
    actions.className = "regex-builder-actions";
    const copy = button(LABELS.copy, "regex-builder-action");
    copy.addEventListener("click", async () => {
      const payload = serializeState(this.state);
      try { await navigator.clipboard.writeText(payload); this.onStatus(LABELS.copied); } catch { this.onStatus({ en: "Clipboard permission was not available.", zh: "剪貼簿權限不可用。" }); }
    });
    const exportButton = button(LABELS.export, "regex-builder-action");
    exportButton.addEventListener("click", () => {
      const blob = new Blob([serializeState(this.state)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "regex-builder-state.json";
      link.click();
      URL.revokeObjectURL(url);
      this.onStatus(LABELS.exported);
    });
    const apply = button(LABELS.apply, "regex-builder-apply");
    apply.addEventListener("click", () => { this.input.value = this.state.mode === "regex" ? this.state.pattern : this.state.query; this.onApply(this.getState()); this.close(); });
    actions.append(copy, exportButton, apply);
    this.panel.append(actions);

    const note = document.createElement("p");
    note.className = "regex-builder-note";
    note.textContent = `${DIALECT} · ${this.state.mode === "plain" ? LABELS.plainDefault.en : `Pattern ≤ ${LIMITS.maxPatternLength} chars; sample ≤ ${LIMITS.maxSampleLength} chars; ${LIMITS.maxMatches} matches max.`}`;
    this.panel.append(note);
  }

  async renderResults() {
    const results = this.panel.querySelector("[data-regex-results]");
    if (!results) return;
    const version = ++this.renderVersion;
    results.replaceChildren();
    const status = document.createElement("p");
    status.className = "regex-builder-validation";
    status.append(bilingual(LABELS.evaluating));
    results.append(status);
    const result = await evaluateBounded(this.state);
    if (version !== this.renderVersion) return;
    results.replaceChildren();
    const validation = document.createElement("p");
    validation.className = `regex-builder-validation ${result.ok ? "is-valid" : "is-invalid"}`;
    validation.textContent = result.ok ? `${LABELS.validation.en} · ${LABELS.validation.zh}: valid` : `${LABELS.validation.en} · ${LABELS.validation.zh}: ${result.error}`;
    results.append(validation);
    if (!result.ok) return;
    const heading = document.createElement("h3");
    heading.textContent = `${LABELS.matches.en} · ${LABELS.matches.zh} (${result.matches.length}${result.capped ? "+" : ""})`;
    results.append(heading);
    if (!result.matches.length) {
      const empty = document.createElement("p");
      empty.textContent = `${LABELS.noMatch.en} · ${LABELS.noMatch.zh}`;
      results.append(empty);
      return;
    }
    const list = document.createElement("ol");
    list.className = "regex-builder-match-list";
    for (const match of result.matches.slice(0, 12)) {
      const item = document.createElement("li");
      item.textContent = `${JSON.stringify(match.text)} @ ${match.index}`;
      if (match.groups.length || Object.keys(match.namedGroups).length) {
        const groups = document.createElement("small");
        groups.textContent = ` groups: ${JSON.stringify({ numbered: match.groups, named: match.namedGroups })}`;
        item.append(groups);
      }
      list.append(item);
    }
    results.append(list);
  }
}
