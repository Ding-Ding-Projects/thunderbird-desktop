import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w):/, "$1:"));
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const html = read("index.html");
const css = read("styles.css");
const js = read("app.js");
const readme = read("README.md");
const checks = [
  ["index exists", fs.existsSync(path.join(root, "index.html"))],
  ["local app data source", html.includes('src="../../app-data.js"')],
  ["preview label", html.includes("PREVIEW · NOT THUNDERBIRD RUNTIME") && readme.includes("preview, not Thunderbird runtime")],
  ["all requested pages", ["mail", "settings", "changelog", "history", "notifications", "palette", "compose"].every(id => js.includes(`id: "${id}"`) || js.includes(`role=\"tabpanel\" aria-labelledby=\"tab-${id}\"`))],
  ["browser tab semantics", html.includes('role="tablist"') && js.includes('role="tab"') && js.includes("aria-selected")],
  ["keyboard paths", js.includes("ArrowRight") && js.includes('event.key.toLowerCase() === "k"') && js.includes('event.key.toLowerCase() === "f"')],
  ["visible status gap", html.includes("Runtime gap: visual only") && js.includes("no native mail process connected")],
  ["narrow layout CSS", css.includes("@media (max-width: 700px)") && css.includes("flex-basis: 100%")],
  ["focus CSS", css.includes(":focus-visible") && css.includes("prefers-reduced-motion")],
  ["no remote assets or fonts", !/(https?:|url\([^)]*https?:|@import)/i.test(`${html}\n${css}\n${js}`)],
  ["no upstream mail paths", !/(mail\/base|about3Pane|messenger\.xhtml)/i.test(`${html}\n${css}\n${js}`)],
  ["README boundary", readme.includes("does not import Thunderbird code") && readme.includes("does not launch a browser")],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
if (failed.length) process.exitCode = 1;
else console.log(`PASS ${checks.length} smoke checks`);
