# Build & CI infrastructure

## Runners

| Runner class | Arch / OS | Can build the Windows installer? |
|---|---|---|
| GitHub-hosted `windows-latest` | x86_64 **Windows** | ✅ **Yes** — this is the one that ships installers |
| Optional self-hosted Linux runner | x86_64 **Linux** | ❌ Not natively |
| Optional self-hosted ARM runner | aarch64 **Linux** | ❌ No |

> [!IMPORTANT]
> **The Windows installer is built on GitHub-hosted `windows-latest`, and that is
> the right place for it.** The available self-hosted runner classes use Linux. A Linux host
> cannot produce a Windows installer without a full cross-compilation toolchain,
> and no amount of extra cores or disk changes that. The self-hosted runners exist
> for lint, tests, and Linux work — not to replace the Windows builder.

### Self-hosted runner boundaries

Self-hosted capacity is optional and point-in-time. Before routing any work there,
re-check reachability, architecture, available CPU, memory and disk, cgroup enforcement,
and unrelated workloads through the private host inventory. Do not copy those private
details into this public repository.

- Use self-hosted Linux runners only for platform-independent lint, JavaScript/JSON
  checks, or other work that explicitly supports their architecture.
- This repository has no root `package.json`, and `eslint.config.mjs` imports
  `eslint-plugin-mozilla` from the Gecko tree, so lint still needs the registered Gecko
  checkout or submodule available.
- Keep workloads resource-bounded and yield to unrelated host workloads. If an in-flight
  job is paused for too long, GitHub may time it out or drop the runner connection.
- Register ephemeral runners with short-lived registration tokens rather than storing a
  long-lived personal access token on the host.

#### Security — read before adding triggers

This repository is **public**, and a self-hosted runner on a public repo is a
known attack path: anyone who can cause a workflow to run can execute code on the
box.

The installer workflow triggers only on `push` to `main` / `design-import/**` and
on `workflow_dispatch`, all of which require write access — so it is not currently
exploitable by an outside contributor.

> [!CAUTION]
> **Never add a `pull_request` trigger to a job that targets `self-hosted`.**
> That single line would let any fork PR run arbitrary code on the private host and
> endanger unrelated workloads.

## Windows installer pipeline

`.github/workflows/windows-installer.yml`

This repo is the **comm tree only** — no `mach`, no `mozconfig`, no `mozilla/`. Per
`README.md` it must sit at `comm/` inside a mozilla-central checkout, so the
workflow obtains gecko (pinned `vendor/gecko` submodule when registered, otherwise
mozilla-central tip) and assembles `gecko/comm` before invoking `mach`.

- **Mode:** `artifact` by default — the rewrite touches only `.js/.xhtml/.css/.mjs`,
  which is exactly what artifact builds are for. ~10 GB, minutes.
  `full` is available via `workflow_dispatch` and is **required** if a change ever
  touches C++ or Rust.
- **Why not full by default:** a full build needs ~45 GB; a hosted runner has ~14 GB
  before cleanup. Public repos get unlimited minutes, but minutes were never the
  constraint — unlimited time does not make the disk bigger. The 14 GB SSD and the
  6-hour job cap are platform limits, not billing ones.
- **MAX_PATH:** mozilla-central carries web-platform test paths past Windows'
  260-char limit. The workflow sets `core.longpaths` and `LongPathsEnabled` before
  anything clones; without it the checkout half-finishes and dies.
- **Releases:** every push publishes a real release — not a draft, not a
  prerelease — with the built installer attached, tagged monotonically off
  `run_number` so nothing is ever recycled, and code-named after a dim sum dish
  (16 in rotation: har gow, siu mai, char siu bao, cheung fun, dan tat, lo mai gai,
  wu gok, fung zaau, pai gwat, ham sui gok, ma lai go, lin yung bao, pei daan sou,
  zaa leung, dau fu fa, no mai chi).
- Every release states plainly that it is an **unofficial fork build**, not
  official Mozilla Thunderbird.
