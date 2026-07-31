# Material Mail local runtime preview

This is a self-contained HTML/CSS/JS preview of the Material Mail design. It is explicitly a **preview, not Thunderbird runtime**: it does not import Thunderbird code, edit `mail/`, call a native command, send mail, persist settings, or connect to a server.

The preview uses the design sources of truth:

- `design/Material Mail.dc.html` — page and interaction structure.
- `design/app-data.js` — M3 seeds, labels, density values, tabs, folders, messages, dim sum catalog, and changelog entries.

## Run locally

From the repository root, use any local static server. Python is sufficient:

```powershell
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/design/runtime/preview/`. No network assets or fonts are requested; `app-data.js` is loaded from this repository.

## Included surfaces

The browser-style tab strip exposes Mail, Settings, Changelog, History, Notifications, Command Palette, and Compose. The preview includes keyboard focus rings, roving tab focus with arrow/Home/End keys, `Ctrl/Cmd+K` for the command palette, `Ctrl/Cmd+F` for mail search, responsive narrow layouts, a local status/gap indicator, and local-only toast feedback.

The runtime gap is deliberately visible in the header and page footers. A green status dot means the preview loaded its local design data; it does not mean a Thunderbird process is running.

## Smoke test

Run the dependency-free static smoke test from the repository root:

```powershell
node design/runtime/preview/smoke-test.mjs
```

It checks the local files, required pages, source-data references, accessibility hooks, responsive CSS, and absence of remote asset/font URLs. It does not launch a browser or claim pixel/runtime proof.
