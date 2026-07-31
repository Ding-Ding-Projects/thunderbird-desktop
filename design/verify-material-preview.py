"""Static contract checks for the packaged Material Mail preview surface."""

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "mail/base/content/materialMail.xhtml"
SCRIPT = ROOT / "mail/base/content/materialMail.js"
TABS_SCRIPT = ROOT / "mail/base/content/materialMailTabs.mjs"
TAB_MODEL = ROOT / "design/runtime/tabs/tab-model.mjs"
COLOR_SCRIPT = ROOT / "mail/base/content/materialMailColor.mjs"
COLOR_TRANSLATOR = ROOT / "design/runtime/color/color-translator.mjs"
LAUNCHER = ROOT / "mail/base/content/materialMailLauncher.js"
REGEX_LAUNCHER = ROOT / "mail/base/content/materialMailRegex.js"
STYLE = ROOT / "mail/themes/shared/mail/material-mail.css"
DIMSUM = ROOT / "mail/themes/shared/mail/material-dimsum-har-gow.png"
FTL = ROOT / "mail/locales/en-US/messenger/materialMail.ftl"
JAR = ROOT / "mail/base/jar.mn"
SKIN_JAR = ROOT / "mail/themes/shared/jar.inc.mn"


def fail(message):
    print(f"Material preview FAILED: {message}", file=sys.stderr)
    raise SystemExit(1)


for path in (
    PAGE,
    SCRIPT,
    TABS_SCRIPT,
    TAB_MODEL,
    COLOR_SCRIPT,
    COLOR_TRANSLATOR,
    LAUNCHER,
    REGEX_LAUNCHER,
    STYLE,
    FTL,
    DIMSUM,
    JAR,
    SKIN_JAR,
):
    if not path.is_file():
        fail(f"missing {path.relative_to(ROOT)}")

page = PAGE.read_text(encoding="utf-8")
script = SCRIPT.read_text(encoding="utf-8")
tabs_script = TABS_SCRIPT.read_text(encoding="utf-8")
tab_model = TAB_MODEL.read_text(encoding="utf-8")
style = STYLE.read_text(encoding="utf-8")
ftl = FTL.read_text(encoding="utf-8")
jar = JAR.read_text(encoding="utf-8")
skin_jar = SKIN_JAR.read_text(encoding="utf-8")

if re.search(
    r"https?://(?!www\.w3\.org)|//cdn\.|fonts\.google",
    page + script + tabs_script + tab_model + style + ftl,
    re.I,
):
    fail("remote asset or font URL found")

tab_ids = re.findall(r'id="(mm-tab-[^"]+)"[^>]+role="tab"', page)
panel_ids = re.findall(r'id="(mm-page-[^"]+)"[^>]+role="tabpanel"', page)
expected_pages = {"mail", "settings", "changelog", "history", "notifications", "tools"}
if {value.removeprefix("mm-tab-") for value in tab_ids} != expected_pages:
    fail(f"tab set is not complete: {tab_ids}")
if {value.removeprefix("mm-page-") for value in panel_ids} != expected_pages:
    fail(f"tabpanel set is not complete: {panel_ids}")
if page.count('role="tablist"') != 1 or page.count('aria-selected="true"') != 1:
    fail("tablist/selected-tab contract is incomplete")
for required in ("mm-theme", "mm-density", "mm-language", "mm-funny-en", "mm-funny-zh", "mm-narrator", "mm-dimsum"):
    if f'id="{required}"' not in page:
        fail(f"missing settings control {required}")
for required in ("compact", "comfortable", "relaxed"):
    if f'value="{required}"' not in page:
        fail(f"missing density arm {required}")
for required in (
    "mm-tab-strip",
    "mm-pinned-tabs",
    "mm-regular-tabs",
    "mm-tab-overflow",
    "mm-tab-overflow-count",
    "mm-tab-popover",
    "mm-tab-popover-close",
    "mm-tab-search",
    "mm-tab-search-regex-open",
    "mm-tab-search-regex-panel",
    "mm-tab-search-count",
    "mm-tab-search-results",
    "mm-tab-context-menu",
    "mm-tab-menu-pin",
    "mm-tab-menu-move-left",
    "mm-tab-menu-move-right",
    "mm-tab-menu-appearance",
    "mm-settings-search",
    "mm-changelog-search",
    "mm-history-search",
    "mm-notifications-search",
    "mm-notifications-filter",
    "mm-changelog-from",
    "mm-changelog-to",
    "mm-history-from",
    "mm-history-to",
    "mm-changelog-export",
    "mm-history-export",
    "mm-appearance-editor",
    "mm-appearance-surface",
    "mm-appearance-text",
    "mm-appearance-radius",
    "mm-appearance-font-size",
    "mm-appearance-weight",
    "mm-narrator-language",
    "mm-appearance-search",
    "mm-color-picker",
    "mm-color-space",
    "mm-color-space-entry",
    "mm-color-representations",
    "mm-feature-details",
    "mm-feature-details-title",
    "mm-feature-details-close",
    "mm-feature-details-body",
):
    if f'id="{required}"' not in page:
        fail(f"missing runtime feature control {required}")
for required in (
    "Services.prefs",
    "getStringPref",
    "setStringPref",
    "mail.material.preview.settings",
    "mail.material.preview.history",
    "mail.material.preview.notifications",
    "mail.material.preview.appearance",
):
    if required not in script:
        fail("runtime state is not persisted in Thunderbird profile preferences")
if "localStorage" in script:
    fail("privileged runtime state must not use unavailable chrome-page localStorage")
for required in ("Services.prefs", "getStringPref", "setStringPref", "mail.material.preview.tabs"):
    if required not in tabs_script:
        fail("tab order, pinning, and active state are not persisted in a profile preference")
if "localStorage" in tabs_script:
    fail("privileged tab state must not use unavailable chrome-page localStorage")
for source_name, source in (
    ("materialMail.js", script),
    ("materialMailTabs.mjs", tabs_script),
):
    if "Services.sys.mjs" in source:
        fail(
            f"{source_name} imports an unpackaged Services resource instead of using "
            "Thunderbird's privileged Services global"
        )
for required in ("CHANGELOG", "FEATURE_GUIDE", "FEATURE_ARTICLES", "renderChangelog", "renderHistory", "renderNotifications", "renderGuide", "openGuideDetails", "closeGuideDetails", "bindGuideDetails", "guideDetailsAnchor", "data-guide-article", "downloadText", "historyActionSelection", "bindAppearance", "contextmenu", "mm-appearance-reset-all", "narratorQueue", "speechSynthesis", "ensureSettingsCustomization", "ensureToolsGuide", "ACCENTS", "FUNNY_EN", "FUNNY_ZH", "function tone", "mm-funny-preview", "mm-tools-search", "mm-font-scale"):
    if required not in script:
        fail(f"runtime feature implementation is incomplete: {required}")
for required in (
    "normalizeTabState",
    "selectVisibleTabs",
    "ResizeObserver",
    "dragstart",
    "drop",
    "contextmenu",
    "mm-tab-search-state",
    "mm-tab-edit-appearance",
    "renderResults",
    "positionPopover",
    "MAX_SEARCH_LENGTH",
):
    if required not in tabs_script:
        fail(f"tab runtime implementation is incomplete: {required}")
if "materialRegexBuilder.mjs" not in tabs_script or "validatePattern" not in tabs_script:
    fail("tab search bypasses the bounded regex preflight")
for required in (
    "normalizeTabState",
    "renderedTabOrder",
    "moveTab",
    "moveTabBefore",
    "selectVisibleTabs",
    "describeTabs",
):
    if f"function {required}" not in tab_model:
        fail(f"pure tab model is incomplete: {required}")
if "ArrowLeft" not in tabs_script or "ArrowRight" not in tabs_script:
    fail("keyboard tab movement is missing")
if 'id="mm-tab-search-results" role="list"' not in page or re.search(
    r'id="mm-tab-search-results"[^>]+role="listbox"', page
):
    fail("all-tabs results must use a composite-action-safe list pattern")
if "prefers-reduced-motion" not in style:
    fail("reduced-motion fallback is missing")
if "mm-dimsum-surprise" not in page or "Math.random()" not in script or "hasLaunched" not in script:
    fail("one-percent dim-sum startup contract is incomplete")

ftl_ids = set(re.findall(r"^([a-z0-9-]+)\s*=", ftl, re.MULTILINE))
page_ids = set(re.findall(r'data-l10n-id="([^"]+)"', page))
missing = sorted(page_ids - ftl_ids)
if missing:
    fail(f"page localization ids missing from en-US FTL: {missing}")
for required in (
    "material-mail-tab-pin",
    "material-mail-tab-unpin",
    "material-mail-tab-move-left",
    "material-mail-tab-move-right",
    "material-mail-tab-edit-appearance",
    "material-mail-tab-pinned",
    "material-mail-tab-visible",
    "material-mail-tab-hidden",
    "material-mail-tab-results",
):
    if required not in ftl_ids:
        fail(f"dynamic tab localization id missing from en-US FTL: {required}")
if "materialMail.xhtml" not in jar or "materialMail.js" not in jar or "materialMailTabs.mjs" not in jar or "materialTabModel.mjs" not in jar or "materialMailColor.mjs" not in jar or "materialColorTranslator.mjs" not in jar or "materialMailRegex.js" not in jar or "materialRegexBuilder.mjs" not in jar or "material-mail.css" not in skin_jar or "material-mail-regex.css" not in skin_jar or "material-dimsum-har-gow.png" not in skin_jar:
    fail("jar packaging entries are incomplete")
if "mm-tab-search" not in REGEX_LAUNCHER.read_text(encoding="utf-8"):
    fail("all-tabs search is not wired to its independent regex builder")
if "import { hslToRgb, translateColor }" not in COLOR_SCRIPT.read_text(encoding="utf-8") or "mm-color-picker" not in page or "mm-appearance-search" not in page:
    fail("continuous colour picker surface is incomplete")
guide_articles = re.findall(r'^  "([^"]+)": \{', script, re.MULTILINE)
if len(guide_articles) < 14:
    fail(f"feature guide article payloads are incomplete: {len(guide_articles)}")
for required in ("behavior", "configuration", "failure", "security", "verification"):
    if script.count(f"{required}:") < 14:
        fail(f"feature guide article section is incomplete: {required}")

print(f"Material preview OK: {len(tab_ids)} tabs, {len(panel_ids)} panels, {len(page_ids)} localized ids, {len(guide_articles)} local article payloads, persisted pin/order state, measured overflow, all-tabs search, keyboard navigation, reduced motion, and packaging.")
