# Build & CI infrastructure

## Runners

| Runner | Arch / OS | Can build the Windows installer? |
|---|---|---|
| GitHub-hosted `windows-latest` | x86_64 **Windows** | ✅ **Yes** — this is the one that ships installers |
| `fowshan-x64` (self-hosted, `.193`) | x86_64 **Linux** | ❌ Not natively — see below |
| `super-arm64` (self-hosted, `.232`) | aarch64 **Linux** | ❌ No |

> [!IMPORTANT]
> **The Windows installer is built on GitHub-hosted `windows-latest`, and that is
> the right place for it.** Neither self-hosted box runs Windows. A Linux host
> cannot produce a Windows installer without a full cross-compilation toolchain,
> and no amount of extra cores or disk changes that. The self-hosted runners exist
> for lint, tests, and Linux work — not to replace the Windows builder.

### `fowshan-x64` — self-hosted, `docker@192.168.50.193`

Deployed as `gh-runner-fowshan` via Docker Compose in `~/gh-runner-tb/`.
Labels: `self-hosted, Linux, X64, fowshan, build`.

Live readings at deploy time (2026-07-29): x86_64, 14 cores, 31 GiB RAM
(20 GiB available), 664 GiB free of 906 GiB, load 0.44.

**This box belongs to HeapAndyville** — 9 containers including a healthy Minecraft
server, a reverse proxy on 80/443, Bluemap, Portainer and Uptime Kuma. The build
runner is a guest here and behaves like one:

- Compose caps it at `cpus: 10` and `mem_limit: 16g`, leaving headroom.
- A supervisor yields the whole box to players (below).

#### Minecraft-aware pause guard

`~/gh-runner-tb/mc-pause-guard.sh`, run every minute from the `docker` user's
crontab (installed alongside the existing HeapAndyville backup job, not over it).

It reads the live player count via `docker exec heapandyville-minecraft rcon-cli list`
and:

| Condition | Action |
|---|---|
| Players online | `docker pause` the runner — **the game always wins** |
| Server empty | `docker unpause` — building resumes |
| Minecraft container not running | unpause — nobody to disturb |
| Server up but rcon unreadable | **pause** — cannot prove it is safe, so assume it is not |

`docker pause` is deliberate: it *freezes* an in-flight build and continues from
exactly where it stopped once the server empties, rather than throwing the work
away and starting over.

Verified end-to-end at deploy: the runner was force-paused with 0 players online,
the guard detected the empty server and resumed it, logging
`RESUME (server empty)` to `~/gh-runner-tb/guard.log`.

> [!WARNING]
> A build frozen for a very long time can still be lost: GitHub will eventually
> time the job out or drop the runner's connection while it is paused. The guard
> protects the game server, not the build. If players are on for hours, expect that
> job to need re-running.

### `super-arm64` — self-hosted, `docker@192.168.50.232`

Deployed as `gh-runner-thunderbird` via Docker Compose in `~/gh-runner-thunderbird/`.
Labels: `self-hosted, Linux, ARM64, super, lint`.

Live host readings at deploy time (2026-07-29):

- Raspberry Pi 5 (`6.18.34+rpt-rpi-2712`), **aarch64**, Debian
- 4 cores, 15 GiB RAM, 420 GiB free of 459 GiB
- Docker 29.6.1

> [!WARNING]
> **This runner cannot build the Windows installer.** It is the wrong architecture
> (aarch64, not x86_64) *and* the wrong OS (Linux, not Windows). Windows installer
> jobs must stay on GitHub-hosted `windows-latest`. Nothing about a bigger disk
> changes this — cross-building a Windows Thunderbird installer from ARM64 Linux is
> not a supported Mozilla configuration.

What it is genuinely useful for: lint, JS/JSON checks, and other
platform-independent work. Note that this repo has no root `package.json` and its
`eslint.config.mjs` imports `eslint-plugin-mozilla` from the gecko tree, so even
lint needs `vendor/gecko` present.

**The address moves.** It answers on `192.168.50.232`, and sometimes `.233`
(`HOST_INVENTORY.md` records `super` as `.233`). Re-check reachability before
assuming either. Registration is per-repo, so an address change does not
de-register the runner.

#### Things that bit us, recorded so they don't again

- **Resource limits were silently discarded.** Compose sets `cpus: 3.0` /
  `memory: 8G`, but the Pi kernel reports *"your kernel does not support memory
  limit capabilities or the cgroup is not mounted"*. The limits are **not in
  effect**, so a heavy job can contend with `line5-web` and `line5-tunnel`, which
  own this box. Do not schedule long builds here without watching those.
- **Registration token, not a PAT.** The runner registered with a short-lived
  token, deliberately, so no long-lived credential sits on the host. If the
  container is ever recreated after that token expires, mint a fresh one:
  `gh api -X POST repos/Ding-Ding-Projects/thunderbird-desktop/actions/runners/registration-token`

#### Security — read before adding triggers

This repository is **public**, and a self-hosted runner on a public repo is a
known attack path: anyone who can cause a workflow to run can execute code on the
box.

The installer workflow triggers only on `push` to `main` / `design-import/**` and
on `workflow_dispatch`, all of which require write access — so it is not currently
exploitable by an outside contributor.

> [!CAUTION]
> **Never add a `pull_request` trigger to a job that targets `self-hosted`.**
> That single line would let any fork PR run arbitrary code on the Pi, alongside
> the unrelated `line5` workloads.

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
