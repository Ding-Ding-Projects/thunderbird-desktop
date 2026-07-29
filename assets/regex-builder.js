/* Regex builder — required on every search surface by the project's global
 * instructions, and wired to the search bar rather than sitting off on its own.
 *
 * Engine: ECMAScript (RegExp), as implemented by the browser running this page.
 * Escaping and dialect are therefore JavaScript's, not PCRE's — no lookbehind
 * guarantees on older engines, \d is ASCII unless /u changes it, and named
 * groups use (?<name>...). The panel says so on screen; guessing the dialect is
 * how a pattern that "works" silently matches the wrong thing.
 *
 * Safety: patterns and samples are bounded and matching is capped. A browser
 * RegExp cannot be interrupted once started, so the only real defence against
 * catastrophic backtracking is to keep the input small and the match count
 * finite. Both are enforced below.
 */

export const LIMITS = {
  PATTERN: 512,     // characters
  SAMPLE: 20000,    // characters
  MATCHES: 500,     // results collected before we stop
};

const TOKENS = [
  { group: "Literals", items: [
    { label: "any char", ins: ".", hint: "matches any character except newline" },
    { label: "digit", ins: "\\d", hint: "0-9" },
    { label: "word", ins: "\\w", hint: "[A-Za-z0-9_]" },
    { label: "space", ins: "\\s", hint: "whitespace" },
    { label: "not digit", ins: "\\D", hint: "anything but 0-9" },
  ]},
  { group: "Character classes", items: [
    { label: "[abc]", ins: "[abc]", hint: "any one of a, b, c" },
    { label: "[^abc]", ins: "[^abc]", hint: "none of a, b, c" },
    { label: "[a-z]", ins: "[a-z]", hint: "range" },
  ]},
  { group: "Anchors", items: [
    { label: "start ^", ins: "^", hint: "start of string (or line with /m)" },
    { label: "end $", ins: "$", hint: "end of string (or line with /m)" },
    { label: "word bound", ins: "\\b", hint: "word boundary" },
  ]},
  { group: "Groups", items: [
    { label: "( )", ins: "()", hint: "capturing group", caret: -1 },
    { label: "(?: )", ins: "(?:)", hint: "non-capturing", caret: -1 },
    { label: "(?<n> )", ins: "(?<name>)", hint: "named capture", caret: -1 },
  ]},
  { group: "Alternation", items: [
    { label: "a|b", ins: "|", hint: "either side" },
  ]},
  { group: "Quantifiers", items: [
    { label: "*", ins: "*", hint: "0 or more" },
    { label: "+", ins: "+", hint: "1 or more" },
    { label: "?", ins: "?", hint: "0 or 1" },
    { label: "{n,m}", ins: "{1,3}", hint: "between n and m" },
    { label: "lazy *?", ins: "*?", hint: "as few as possible" },
  ]},
];

const FLAGS = [
  { f: "g", label: "global", hint: "find all matches" },
  { f: "i", label: "ignore case", hint: "case-insensitive" },
  { f: "m", label: "multiline", hint: "^ and $ match line boundaries" },
  { f: "s", label: "dotall", hint: ". also matches newline" },
  { f: "u", label: "unicode", hint: "unicode-aware escapes" },
];

/**
 * Safely compile and run a pattern.
 * Returns { ok, error, matches, groups, truncated }.
 */
export function safeMatch(pattern, flags, sample) {
  if (!pattern) return { ok: true, matches: [], groups: [], truncated: false };
  if (pattern.length > LIMITS.PATTERN) {
    return { ok: false, error: `Pattern exceeds ${LIMITS.PATTERN} characters.`, matches: [] };
  }
  const text = String(sample ?? "").slice(0, LIMITS.SAMPLE);

  let re;
  try {
    // Always compile with /g so we can iterate; the user's own g is redundant.
    re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (e) {
    return { ok: false, error: e.message, matches: [] };
  }

  const matches = [];
  let truncated = false;
  let guard = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    matches.push({
      text: m[0],
      index: m.index,
      groups: m.slice(1),
      named: m.groups ? { ...m.groups } : null,
    });
    // Zero-width matches would spin forever without this.
    if (m.index === re.lastIndex) re.lastIndex++;
    if (++guard >= LIMITS.MATCHES) { truncated = true; break; }
  }
  return { ok: true, matches, truncated };
}

/** Escape a plain string so it can be used as a literal pattern. */
export function escapeLiteral(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mount a regex builder popover anchored to a search input.
 * onApply(pattern, flags) is called when the user commits.
 */
export function mountRegexBuilder({ anchor, input, onApply, getSample, escapeHtml }) {
  const panel = document.createElement("div");
  panel.className = "rb-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Regular expression builder");

  let flags = "gi";

  panel.innerHTML = `
    <div class="rb-head">
      <strong>Regex builder</strong>
      <span class="rb-engine">ECMAScript (browser <code>RegExp</code>)</span>
      <button type="button" class="btn text rb-close" aria-label="Close regex builder">Close</button>
    </div>
    <label class="lbl" for="rb-pattern">Pattern</label>
    <input id="rb-pattern" class="field rb-pattern" spellcheck="false" autocomplete="off"
           maxlength="${LIMITS.PATTERN}" placeholder="e.g. blocker\\s+#\\d+">
    <div class="rb-flags" role="group" aria-label="Flags"></div>
    <div class="rb-tokens"></div>
    <label class="lbl" for="rb-sample">Sample text (defaults to the current page content)</label>
    <textarea id="rb-sample" class="field rb-sample" rows="3" spellcheck="false"></textarea>
    <div class="rb-status" role="status" aria-live="polite"></div>
    <div class="rb-actions">
      <button type="button" class="btn rb-apply">Apply to search</button>
      <button type="button" class="btn outline rb-copy">Copy pattern</button>
    </div>`;

  const $ = sel => panel.querySelector(sel);
  const patternEl = $(".rb-pattern");
  const sampleEl = $(".rb-sample");
  const statusEl = $(".rb-status");

  // Flags
  const flagsBox = $(".rb-flags");
  for (const { f, label, hint } of FLAGS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn text rb-flag";
    b.textContent = `/${f}`;
    b.title = `${label} — ${hint}`;
    b.setAttribute("aria-pressed", String(flags.includes(f)));
    b.addEventListener("click", () => {
      flags = flags.includes(f) ? flags.replaceAll(f, "") : flags + f;
      b.setAttribute("aria-pressed", String(flags.includes(f)));
      run();
    });
    flagsBox.appendChild(b);
  }

  // Token palette
  const tokensBox = $(".rb-tokens");
  for (const { group, items } of TOKENS) {
    const g = document.createElement("div");
    g.className = "rb-group";
    g.innerHTML = `<span class="rb-group-name">${group}</span>`;
    for (const it of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn text rb-token";
      b.textContent = it.label;
      b.title = it.hint;
      b.addEventListener("click", () => {
        const start = patternEl.selectionStart ?? patternEl.value.length;
        const end = patternEl.selectionEnd ?? start;
        patternEl.value = patternEl.value.slice(0, start) + it.ins + patternEl.value.slice(end);
        const caret = start + it.ins.length + (it.caret ?? 0);
        patternEl.focus();
        patternEl.setSelectionRange(caret, caret);
        run();
      });
      g.appendChild(b);
    }
    tokensBox.appendChild(g);
  }

  function run() {
    const res = safeMatch(patternEl.value, flags, sampleEl.value);
    if (!res.ok) {
      statusEl.innerHTML = `<span class="rb-bad">Invalid: ${escapeHtml(res.error)}</span>`;
      return;
    }
    if (!patternEl.value) { statusEl.textContent = "Enter a pattern to see matches."; return; }
    const n = res.matches.length;
    if (!n) { statusEl.innerHTML = `<span class="rb-none">No matches.</span>`; return; }
    const preview = res.matches.slice(0, 8).map(m => {
      const g = m.named && Object.keys(m.named).length
        ? ` <span class="rb-grp">${escapeHtml(JSON.stringify(m.named))}</span>`
        : m.groups.length ? ` <span class="rb-grp">[${m.groups.map(x => escapeHtml(String(x ?? ""))).join(", ")}]</span>` : "";
      return `<code>${escapeHtml(m.text)}</code>${g}`;
    }).join(" ");
    statusEl.innerHTML =
      `<strong>${n}${res.truncated ? "+" : ""}</strong> match${n === 1 ? "" : "es"}` +
      `${res.truncated ? ` <span class="rb-none">(capped at ${LIMITS.MATCHES})</span>` : ""} ${preview}`;
  }

  patternEl.addEventListener("input", run);
  sampleEl.addEventListener("input", run);

  $(".rb-apply").addEventListener("click", () => {
    onApply(patternEl.value, flags);
    close();
  });
  $(".rb-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(patternEl.value);
      statusEl.textContent = "Pattern copied to clipboard.";
    } catch {
      statusEl.textContent = "Clipboard unavailable — select the pattern and copy manually.";
    }
  });
  $(".rb-close").addEventListener("click", close);

  panel.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
  });

  function open() {
    panel.hidden = false;
    anchor.setAttribute("aria-expanded", "true");
    patternEl.value = input.value;
    sampleEl.value = (getSample?.() ?? "").slice(0, LIMITS.SAMPLE);
    run();
    patternEl.focus();
  }
  function close() {
    panel.hidden = true;
    anchor.setAttribute("aria-expanded", "false");
    anchor.focus();
  }
  function toggle() { panel.hidden ? open() : close(); }

  anchor.setAttribute("aria-expanded", "false");
  anchor.addEventListener("click", toggle);

  return { panel, open, close, toggle };
}
