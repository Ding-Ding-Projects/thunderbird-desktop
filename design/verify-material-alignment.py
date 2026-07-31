#!/usr/bin/env python3
"""Verify that the shipped Material layer still follows the design source.

This is intentionally a small source-level gate. It does not claim that a
browser has rendered the skin correctly; browser and assistive-technology
gates remain separate runtime evidence. It does make source drift fail early
when a token, load-order link, packaging entry, or CSS safety invariant moves.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design"
CSS_ROOT = ROOT / "mail" / "themes" / "shared" / "mail"
TOKEN_FILE = CSS_ROOT / "material-tokens.css"
JAR_FILE = ROOT / "mail" / "themes" / "shared" / "jar.inc.mn"
ABOUT_FILE = ROOT / "mail" / "base" / "content" / "about3Pane.xhtml"
MESSENGER_FILE = ROOT / "mail" / "base" / "content" / "messenger.xhtml"

M3_FILES = (
    "material-tokens.css",
    "m3-layout.css",
    "m3-folder-pane.css",
    "m3-thread-pane.css",
    "m3-quick-filter.css",
    "m3-message-pane.css",
    "m3-chrome.css",
)


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def read(path: Path) -> str:
    if not path.is_file():
        fail(f"required file is missing: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def section(source: str, start: str, end: str) -> str:
    try:
        return source[source.index(start) : source.index(end)]
    except ValueError:
        fail(f"design/app-data.js is missing section markers {start!r} and {end!r}")


def normalise_colour(value: str) -> str:
    value = value.lower()
    if len(value) == 4:
        return "#" + "".join(character * 2 for character in value[1:])
    return value


def assert_contains(haystack: str, needle: str, label: str) -> None:
    if needle not in haystack:
        fail(f"{label} is missing: {needle}")


def uncomment(source: str) -> str:
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.DOTALL)
    return re.sub(r"//[^\n]*", "", source)


def assert_balanced_braces(path: Path) -> None:
    source = uncomment(read(path))
    if source.count("{") != source.count("}"):
        fail(
            f"{path.relative_to(ROOT)} has unbalanced braces: "
            f"{source.count('{')} opening / {source.count('}')} closing"
        )


def main() -> None:
    app_data = read(DESIGN / "app-data.js")
    tokens = read(TOKEN_FILE)

    for filename in M3_FILES:
        assert_balanced_braces(CSS_ROOT / filename)

    # Every design palette value must survive into the static token layer.
    # CSS's three-digit shorthand is normalised so #FFFFFF and #fff compare
    # as the same colour without forcing a spelling convention on either file.
    token_colours = {
        normalise_colour(value)
        for value in re.findall(r"#[0-9a-fA-F]{3,8}", tokens)
    }
    for label, start, end in (
        ("SEEDS", "const SEEDS", "const NEUTRALS"),
        ("NEUTRALS", "const NEUTRALS", "const FONTS"),
    ):
        values = {
            normalise_colour(value)
            for value in re.findall(r"#[0-9a-fA-F]{6,8}", section(app_data, start, end))
        }
        missing = sorted(value for value in values if value not in token_colours)
        if missing:
            fail(f"{label} values missing from material-tokens.css: {', '.join(missing)}")

    # DENSITY is data, not a comment copied by hand. Check all three modes and
    # their logical inline-inset projection in the shipped tokens.
    density = section(app_data, "const DENSITY", "const FOLDERS")
    density_rows = re.findall(
        r"\s+(compact|comfortable|relaxed):\s*"
        r"\{\s*row:\s*\"([^\"]+)\",\s*gap:\s*(\d+),\s*"
        r"control:\s*(\d+),\s*avatar:\s*(\d+)\s*\}",
        density,
    )
    if len(density_rows) != 3:
        fail(f"expected three parseable DENSITY modes, found {len(density_rows)}")
    for mode, row, gap, control, avatar in density_rows:
        row_values = row.split()
        if len(row_values) != 4:
            fail(f"DENSITY.{mode}.row must contain four CSS lengths: {row}")
        inline = f"{row_values[3]} {row_values[1]}"
        expected = (
            f"--m3-row-padding: {row};",
            f"--m3-row-padding-inline: {inline};",
            f"--m3-gap: {gap}px;",
            f"--m3-control-size: {control}px;",
            f"--m3-avatar-size: {avatar}px;",
        )
        for needle in expected:
            assert_contains(tokens, needle, f"DENSITY.{mode} projection")

    # The design's named stacks remain available, while the runtime layer must
    # not reintroduce its remote font load.
    fonts = section(app_data, "const FONTS", "const DENSITY")
    for family in ("Roboto", "Noto Sans HK", "system-ui", "Georgia"):
        assert_contains(tokens, family, f"design font family {family!r}")
        assert_contains(fonts, family, f"app-data.js font family {family!r}")
    if re.search(r"fonts\.(?:googleapis|gstatic)\.com", uncomment(tokens), re.IGNORECASE):
        fail("runtime token CSS contains a remote Google Fonts URL")

    # The two documents are separate chrome roots; each must receive its own
    # token sheet and preserve the load-bearing section-sheet order.
    about_links = re.findall(r'<link\s+rel="stylesheet"\s+href="([^"]+)"', read(ABOUT_FILE))
    expected_about = [
        "chrome://messenger/skin/material-tokens.css",
        "chrome://messenger/skin/about3Pane.css",
        "chrome://messenger/skin/m3-layout.css",
        "chrome://messenger/skin/m3-folder-pane.css",
        "chrome://messenger/skin/m3-thread-pane.css",
        "chrome://messenger/skin/m3-quick-filter.css",
        "chrome://messenger/skin/m3-message-pane.css",
    ]
    if not all(link in about_links for link in expected_about):
        fail("about3Pane.xhtml is missing one or more required Material stylesheet links")
    if [about_links.index(link) for link in expected_about] != sorted(
        about_links.index(link) for link in expected_about
    ):
        fail("about3Pane.xhtml Material stylesheet load order changed")

    messenger_links = re.findall(
        r'<link\s+rel="stylesheet"\s+href="([^"]+)"', read(MESSENGER_FILE)
    )
    expected_messenger = [
        "chrome://messenger/skin/material-tokens.css",
        "chrome://messenger/skin/m3-chrome.css",
    ]
    if not all(link in messenger_links for link in expected_messenger):
        fail("messenger.xhtml is missing its Material token/chrome stylesheet links")
    if [messenger_links.index(link) for link in expected_messenger] != sorted(
        messenger_links.index(link) for link in expected_messenger
    ):
        fail("messenger.xhtml Material stylesheet load order changed")

    jar = read(JAR_FILE)
    for filename in M3_FILES:
        assert_contains(jar, f"skin/classic/messenger/{filename}", f"jar packaging entry {filename}")

    # Theme safety: no positive lwtheme selector may bypass the lightweight
    # theme boundary, and the token-definition file remains guard-free.
    for filename in M3_FILES:
        source = uncomment(read(CSS_ROOT / filename))
        if re.search(r":root\[lwtheme\b", source):
            fail(f"{filename} contains a positive [lwtheme] selector")
    if ":root:not([lwtheme])" in uncomment(tokens):
        fail("material-tokens.css guards token definitions; definitions must stay theme-neutral")

    print(
        "Material alignment OK: "
        f"{len(M3_FILES)} CSS files, {len(token_colours)} token colours, "
        "3 density modes, 4 font families, load order, packaging, and theme safety."
    )


if __name__ == "__main__":
    main()
