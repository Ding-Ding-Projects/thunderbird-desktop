"""Static contract checks for the packaged Material Mail preview surface."""

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "mail/base/content/materialMail.xhtml"
SCRIPT = ROOT / "mail/base/content/materialMail.js"
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


for path in (PAGE, SCRIPT, LAUNCHER, REGEX_LAUNCHER, STYLE, FTL, DIMSUM):
    if not path.is_file():
        fail(f"missing {path.relative_to(ROOT)}")

page = PAGE.read_text(encoding="utf-8")
script = SCRIPT.read_text(encoding="utf-8")
style = STYLE.read_text(encoding="utf-8")
ftl = FTL.read_text(encoding="utf-8")
jar = JAR.read_text(encoding="utf-8")
skin_jar = SKIN_JAR.read_text(encoding="utf-8")

if re.search(r"https?://(?!www\.w3\.org)|//cdn\.|fonts\.google", page + script + style + ftl, re.I):
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
):
    if f'id="{required}"' not in page:
        fail(f"missing runtime feature control {required}")
if "localStorage" not in script or "mail.material.preview.settings" not in script:
    fail("preferences are not persisted locally")
for required in ("CHANGELOG", "renderChangelog", "renderHistory", "renderNotifications", "downloadText", "historyActionSelection", "bindAppearance", "contextmenu", "mm-appearance-reset-all", "narratorQueue", "speechSynthesis", "ensureSettingsCustomization", "ACCENTS", "mm-font-scale"):
    if required not in script:
        fail(f"runtime feature implementation is incomplete: {required}")
if "ArrowLeft" not in script or "ArrowRight" not in script:
    fail("keyboard tab movement is missing")
if "prefers-reduced-motion" not in style:
    fail("reduced-motion fallback is missing")
if "mm-dimsum-surprise" not in page or "Math.random()" not in script or "hasLaunched" not in script:
    fail("one-percent dim-sum startup contract is incomplete")

ftl_ids = set(re.findall(r"^([a-z0-9-]+)\s*=", ftl, re.MULTILINE))
page_ids = set(re.findall(r'data-l10n-id="([^"]+)"', page))
missing = sorted(page_ids - ftl_ids)
if missing:
    fail(f"page localization ids missing from en-US FTL: {missing}")
if "materialMail.xhtml" not in jar or "materialMail.js" not in jar or "materialMailRegex.js" not in jar or "materialRegexBuilder.mjs" not in jar or "material-mail.css" not in skin_jar or "material-mail-regex.css" not in skin_jar or "material-dimsum-har-gow.png" not in skin_jar:
    fail("jar packaging entries are incomplete")

print(f"Material preview OK: {len(tab_ids)} tabs, {len(panel_ids)} panels, {len(page_ids)} localized ids, local persistence, keyboard navigation, reduced motion, and packaging.")
