/* Documentation content.
 *
 * Categorized per the project's global instructions: every feature gets its own
 * entry under a category, and each category carries an index. Each entry
 * documents behaviour, configuration, failure modes, security considerations
 * and verification — not just a description.
 *
 * Strings are either plain (facts, identifiers, commands — identical at every
 * funny level) or { en: [l1..l5], zh: [l1..l5] } where the LEVEL CHANGES VOICE
 * AND NEVER FACTS. Every variant names the same commit, file and outcome.
 */

export const REPO = "https://github.com/Ding-Ding-Projects/thunderbird-desktop";
export const BRANCH = "design-import/thunderbird-3pane";

export const CATEGORIES = [
  {
    id: "overview",
    icon: "🏠",
    name: { en: "Overview", zh: "總覽" },
    blurb: {
      en: [
        "Project scope, platform target and current status.",
        "Project scope, platform target and current status.",
        "What this is, what it runs on, and where it has got to.",
        "What we are building, on what, and how far along it actually is.",
        "The what, the where, and the honest how-far — no progress bars that lie.",
      ],
      zh: [
        "專案範圍、目標平台同目前狀態。",
        "專案範圍、目標平台同目前狀態。",
        "做緊乜、喺邊度行、而家去到邊。",
        "我哋整緊乜嘢、喺咩平台、同埋老實講去到邊。",
        "做乜、喺邊、去到邊 —— 唔會有講大話嘅進度條。",
      ],
    },
    docs: [
      {
        id: "what-is-this",
        title: { en: "What this project is", zh: "呢個專案係乜" },
        body: [
          { p: {
            en: [
              "A full ground-up rewrite of Thunderbird's 3-pane interface to Material Design 3, carried out on an unofficial fork.",
              "A full ground-up rewrite of Thunderbird's 3-pane interface to Material Design 3, carried out on an unofficial fork.",
              "A ground-up rewrite of Thunderbird's 3-pane UI to Material Design 3. Unofficial fork, no stock markup kept.",
              "We are rebuilding Thunderbird's 3-pane UI from scratch in Material Design 3. Nothing of the old markup survives — but every feature does.",
              "Total teardown of Thunderbird's 3-pane UI, rebuilt in Material Design 3. The old markup does not get to come. Every single feature does.",
            ],
            zh: [
              "喺一個非官方 fork 上面,將 Thunderbird 三欄介面完全重寫做 Material Design 3。",
              "喺一個非官方 fork 上面,將 Thunderbird 三欄介面完全重寫做 Material Design 3。",
              "由零開始重寫 Thunderbird 三欄介面做 Material Design 3,舊 markup 唔留。",
              "我哋將 Thunderbird 三欄介面拆晒重砌做 Material Design 3。舊 markup 一件都唔留,但係功能一個都唔少。",
              "成個三欄介面拆到淨返地基,再用 Material Design 3 砌返。舊 markup 冇得跟車,功能就一個都唔准走。",
            ],
          }},
          { h: { en: "Two rules that shape everything", zh: "兩條規矩決定晒一切" } },
          { list: [
            { en: "No stock markup is carried over. The rewrite is genuine, not a reskin.",
              zh: "舊 markup 一件都唔留。係真重寫,唔係換膚。" },
            { en: "Every existing feature must survive. ~18,450 lines and 137 cmd_* commands are in scope, and a checkbox is only ticked when the feature is genuinely wired.",
              zh: "所有現有功能都要保住。~18,450 行同 137 個 cmd_* 指令全部喺範圍內,真係駁通咗先剔。" },
          ]},
          { callout: { kind: "warn", text: {
            en: "Unofficial fork. Not affiliated with, endorsed by, or released by MZLA Technologies Corporation. Builds published here are not official Thunderbird releases.",
            zh: "非官方 fork,唔關 MZLA / Thunderbird 團隊事。呢度出嘅 build 唔係官方 Thunderbird。",
          }}},
          { h: { en: "Platform scope", zh: "平台範圍" } },
          { p: {
            en: "Windows only. This relaxes cross-platform abstraction — the new markup targets Windows directly instead of threading every style through a three-platform fork. It does not relax feature parity, accessibility or localization, and it does not permit deleting the macOS or Linux code paths. Out of scope means left alone, not removed.",
            zh: "淨係做 Windows。咁樣可以慳返唔使一個 style 分三個平台寫,但係功能、無障礙、翻譯就一樣都唔准少,亦都唔准刪 Mac / Linux 嘅碼 —— 唔做同剷咗佢係兩回事。",
          }},
        ],
        verify: {
          en: "Scope is recorded in design/REWRITE-CONTRACT.md, which is the checklist the rewrite is graded against.",
          zh: "範圍寫喺 design/REWRITE-CONTRACT.md,個 checklist 就係評分標準。",
        },
      },
      {
        id: "status",
        title: { en: "Current status", zh: "目前狀態" },
        body: [
          { table: {
            head: [{ en: "Area", zh: "範疇" }, { en: "State", zh: "狀態" }],
            rows: [
              [{ en: "Design", zh: "設計" }, "complete — a334d745c32a7ab3, 140,780 bytes"],
              [{ en: "M3 token layer", zh: "M3 色彩變數層" }, "landed — material-tokens.css"],
              [{ en: "Section stylesheets", zh: "各段樣式" }, { en: "six landed — 3,219 lines", zh: "六個做起咗 —— 3,219 行" }],
              [{ en: "Feature parity", zh: "功能對等" }, { en: "verification in progress — a box is ticked only with named evidence", zh: "驗證緊 —— 要有實證先剔得" }],
              [{ en: "Windows installer CI", zh: "Windows 安裝檔 CI" }, { en: "green — tb-155.0a1-b18-char-siu-bao, 81 MB", zh: "綠燈 —— tb-155.0a1-b18-char-siu-bao,81 MB" }],
            ],
          }},
          { p: {
            en: [
              "Progress is reported against evidence. A build is not described as green until it is green, and a feature is not described as preserved until it is wired.",
              "Progress is reported against evidence. A build is not called green until it is green, and a feature is not called preserved until it is wired.",
              "We report what is, not what we hope. Green means green; preserved means wired.",
              "No optimistic rounding. A build is green when it is green, not when it looks like it is about to be.",
              "Nothing here is rounded up. A build is green when it is green — not when it is nearly green, not when it deserves to be green.",
            ],
            zh: [
              "進度講證據。未綠就唔會叫綠,未駁通就唔會叫保住咗。",
              "進度講證據。未綠就唔會叫綠,未駁通就唔會叫保住咗。",
              "有咩講咩。綠就係綠,駁通咗先算保住。",
              "唔會四捨五入。綠燈就係綠燈,唔係「就快綠」。",
              "一律唔許灌水。綠就係綠,唔係「差少少」,亦唔係「應該綠㗎喎」。",
            ],
          }},
        ],
        verify: {
          en: "Live status is in the rolling Discussion, updated on every push and CI verdict.",
          zh: "即時狀態喺 Discussion 度,每次 push 同 CI 出結果都會更新。",
        },
      },
    ],
  },

  {
    id: "design-sync",
    icon: "🎨",
    name: { en: "Design sync", zh: "設計同步" },
    blurb: {
      en: "How the design is mirrored into the repo and when implementation is allowed to start.",
      zh: "設計點樣鏡像入 repo,同埋幾時先准開始寫碼。",
    },
    docs: [
      {
        id: "the-gate",
        title: { en: "The implementation gate", zh: "開工閘門" },
        body: [
          { p: {
            en: "A 10-minute loop watches the design project. It refuses to write implementation code until the design is demonstrably finished — because implementing a half-written design churns the repository for nothing.",
            zh: "每 10 分鐘睇一次設計。設計未真係寫完就唔准落碼 —— 照住半成品嚟寫,寫完又要拆,做嚟都嘥氣。",
          }},
          { h: { en: "The four conditions", zh: "四個條件" } },
          { list: [
            { en: "(a) The document is byte-identical across two consecutive checks, so the author has demonstrably stopped writing.",
              zh: "(a) 連續兩次檢查完全一樣,即係作者真係停咗手。" },
            { en: "(b) <x-dc> is opened and closed and the body is substantial — not a skeleton.",
              zh: "(b) <x-dc> 開好收好,入面有真嘢,唔係得個殼。" },
            { en: "(c) No TODO, WIP, lorem or placeholder markers.",
              zh: "(c) 冇 TODO、WIP、lorem 呢啲未做完嘅記號。" },
            { en: "(d) It actually covers the folder pane, the message list and the reading pane — not one fragment.",
              zh: "(d) 真係包含資料夾欄、郵件列表同閱讀窗,唔係得一忽。" },
          ]},
          { h: { en: "Failure modes seen in practice", zh: "實際撞過嘅問題" } },
          { list: [
            { en: "A rename in flight returns HTTP 404 for a path that list_files just listed. Re-list rather than concluding the file is gone.",
              zh: "改名改到一半,啱啱先列出嘅檔案會回 404。要再列一次,唔好當佢冇咗。" },
            { en: "A naive 'placeholder' text search counts HTML placeholder= attributes and CSS ::placeholder as unfinished work. Check TODO/WIP/lorem specifically.",
              zh: "求其搵 placeholder 會連 HTML 屬性同 CSS 都當成未做完。要專登搵 TODO/WIP/lorem。" },
            { en: "Checking for Thunderbird's vocabulary in a design that uses its own reports false incompleteness. Check the design's terms.",
              zh: "攞 Thunderbird 嘅字眼去搵一份用自己術語嘅設計,一定搵唔到。要用返佢自己啲字。" },
          ]},
        ],
        security: {
          en: "The mirror deliberately excludes uploads/**, which in this project contained an unrelated repository including raw .git internals. Vendoring another repository's git objects into this one is not a sync, it is an accident.",
          zh: "鏡像刻意唔要 uploads/**,嗰度有另一個 repo 連埋 .git 內部檔。將人哋嘅 git object 搬入嚟唔叫同步,叫意外。",
        },
        verify: {
          en: "The gate opened only when the design hashed identically from two independent sources: two API fetches twenty minutes apart, and a full export supplied separately. Three matching hashes of a334d745c32a7ab3.",
          zh: "兩個唔同來源三次 hash 一模一樣 (a334d745c32a7ab3) 先開閘:相隔二十分鐘嘅兩次 API 抓取,加上另外畀嘅完整匯出。",
        },
      },
    ],
  },

  {
    id: "rewrite",
    icon: "🧱",
    name: { en: "The rewrite", zh: "重寫" },
    blurb: { en: "Design tokens, the parity contract, and the constraints the design must yield to.", zh: "色彩變數、對等契約,同埋設計要讓步嘅地方。" },
    docs: [
      {
        id: "tokens",
        title: { en: "Material Design 3 token layer", zh: "M3 變數層" },
        body: [
          { p: {
            en: "The design generates 24 CSS custom properties at runtime from a vars() function and applies them as an inline style attribute. Thunderbird's Content-Security-Policy restricts inline styling and there is no React in the tree, so the tokens ship as a static stylesheet instead: mail/themes/shared/mail/material-tokens.css.",
            zh: "設計原本用 vars() 即場整 24 個 CSS 變數,再塞落 inline style。Thunderbird 個 CSP 唔畀咁玩,樹入面亦都冇 React,所以改成靜態 stylesheet:mail/themes/shared/mail/material-tokens.css。",
          }},
          { h: { en: "Coverage", zh: "覆蓋範圍" } },
          { list: [
            { en: "All 24 --m3-* properties the design emits.", zh: "設計會出嘅 24 個 --m3-* 變數,全部有。" },
            { en: "Four accent seeds (purple, blue, green, orange) across light, explicit dark and OS dark — twelve accent blocks, verified complete.", zh: "四隻主色 × 淺色/指定深色/跟系統深色 = 十二組,個個齊料。" },
            { en: "Three density scales, the shape scale, m3-rise / m3-fade, and reduced-motion handling.", zh: "三種密度、圓角尺度、m3-rise / m3-fade,同埋減少動態效果。" },
          ]},
          { callout: { kind: "note", text: {
            en: "--m3-inverse-primary resolves to the opposite theme's primary. It is the token most easily got wrong, because a wrong value still looks plausible.",
            zh: "--m3-inverse-primary 要攞「另一個主題」嘅 primary。呢個最易寫錯,因為寫錯都仲係好似啱咁。",
          }}},
        ],
        security: {
          en: "The design's Google Fonts <link> is deliberately not ported. It is blocked by the existing CSP, leaks a request to a third party on every launch, and delays first paint. Roboto and Noto Sans HK are named first so a locally installed copy wins, then the platform UI font. Noto Sans HK is not decoration: every string has a Cantonese counterpart, and without a CJK-capable fallback the entire second language renders as tofu.",
          zh: "設計嗰條 Google Fonts link 刻意唔搬過嚟:CSP 封殺、每次開機都漏一個 request 去第三方、仲拖慢首次繪製。Roboto 同 Noto Sans HK 排頭位,本機有就用,冇就用系統字型。Noto Sans HK 唔係靚仔嚟 —— 每句都有廣東話,冇 CJK fallback 就成排豆腐。",
        },
        verify: {
          en: "Checked mechanically: 24/24 tokens present, 12 accent blocks found and none partial, braces balanced, and no fonts.googleapis.com reference in the CSS itself (it appears only in the comment explaining why it is absent).",
          zh: "用程式查過:24 個變數齊、12 組主色冇一組漏、括號平衡、CSS 本身冇 fonts.googleapis.com(只喺註解度出現,解釋點解唔用)。",
        },
      },
      {
        id: "constraints",
        title: { en: "Where the design must yield", zh: "設計要讓步嘅地方" },
        body: [
          { p: { en: "Three places the design cannot ship as authored. These are not style preferences.", zh: "三個地方唔可以照抄。呢啲唔係「唔啱睇」嘅問題。" }},
          { list: [
            { en: "Remote fonts — CSP-blocked, a privacy leak and a startup cost. Vendor locally or use system fonts.",
              zh: "外部字型 —— CSP 封殺、漏私隱、拖慢開機。要本地化或者用系統字型。" },
            { en: "The <x-dc> / React runtime — Thunderbird's 3-pane is XUL/XHTML custom elements. The design is a visual spec to translate, never markup to embed.",
              zh: "<x-dc> / React —— Thunderbird 用嘅係 XUL/XHTML custom element。設計係參考圖,唔係可以直接貼落去嘅碼。" },
            { en: "Heavy inline style= — must move into stylesheets; the CSP restricts inline styling.",
              zh: "大量 inline style= —— 要搬入 stylesheet,CSP 限制 inline。" },
          ]},
        ],
        verify: { en: "Recorded in design/REWRITE-CONTRACT.md under 'Known conflicts'.", zh: "寫喺 design/REWRITE-CONTRACT.md 嘅 Known conflicts 度。" },
      },
    ],
  },

  {
    id: "build",
    icon: "🏗️",
    name: { en: "Build & CI", zh: "建置同 CI" },
    blurb: { en: "How the Windows installer is built, and every blocker hit so far.", zh: "Windows 安裝檔點砌,同埋撞過嘅每一個關卡。" },
    docs: [
      {
        id: "pipeline",
        title: { en: "Windows installer pipeline", zh: "Windows 安裝檔流程" },
        body: [
          { p: {
            en: "This repository is the comm tree only — no mach, no mozconfig, no mozilla/ directory. It cannot build by itself. Per its own README it must sit at comm/ inside a mozilla-central checkout, so the workflow obtains gecko and assembles gecko/comm before invoking mach.",
            zh: "呢個 repo 淨係得 comm 一半,冇 mach、冇 mozconfig、冇 mozilla/ 資料夾,自己一個砌唔到。跟佢自己個 README,要擺入 mozilla-central 個 comm/ 度,所以流程會攞 gecko 落嚟,砌好 gecko/comm 先行 mach。",
          }},
          { h: { en: "Build modes", zh: "建置模式" } },
          { table: {
            head: [{ en: "Mode", zh: "模式" }, { en: "Cost", zh: "成本" }, { en: "When", zh: "幾時用" }],
            rows: [
              ["artifact", { en: "~10 GB, minutes", zh: "約 10 GB,幾分鐘" }, { en: "default — frontend-only changes (.js/.xhtml/.css/.mjs)", zh: "預設 —— 淨係改前端檔" }],
              ["full", { en: "~45 GB, hours", zh: "約 45 GB,幾個鐘" }, { en: "required if a change touches C++ or Rust", zh: "改到 C++ 或 Rust 就一定要用" }],
            ],
          }},
          { callout: { kind: "note", text: {
            en: "Public repositories get unlimited standard-runner minutes and free release storage — but minutes were never the constraint. Unlimited time does not make the disk bigger. Measured on a real run: C: 33 GB free, D: 147 GB. Builds run on D:.",
            zh: "公開 repo 有無限分鐘同免費 release 儲存,但問題從來都唔係時間。時間再多都變唔大個碟。實測:C: 得 33GB,D: 有 147GB,所以喺 D: 度砌。",
          }}},
        ],
        failures: [
          { t: "MAX_PATH", d: { en: "mozilla-central carries web-platform test paths past Windows' 260-character limit; the clone half-finishes and dies. Fixed with core.longpaths and LongPathsEnabled before anything clones.", zh: "mozilla-central 有啲路徑長過 Windows 260 字上限,clone 做到一半就散。要喺 clone 之前開 core.longpaths 同 LongPathsEnabled。" }},
          { t: { en: "Wrong disk premise", zh: "搞錯咗個碟" }, d: { en: "The documented 14 GB figure does not describe this runner image. Measuring beat trusting the manual.", zh: "文件寫 14GB,但同呢部 runner 唔啱。自己量過好過信文件。" }},
          { t: { en: "Self-cancelling releases", zh: "自己取消自己個 release" }, d: { en: "concurrency cancel-in-progress killed the run a push was meant to produce a release from. Worse, cancel-in-progress:false is not enough — a QUEUED run is superseded whenever a newer one joins the group. The group had to go entirely.", zh: "concurrency 將啱啱 push 嗰個 run 殺咗,連 release 都冇。仲有:設 false 都唔夠,排緊隊嗰個一有新 run 入嚟照被取代。最後要成個 group 拆走。" }},
          { t: { en: "Submodule gitdir", zh: "Submodule 個 gitdir" }, d: { en: "A submodule's .git is a FILE holding a RELATIVE gitdir: pointer. Move the tree and every git command in it dies with 'not a git repository: (NULL)'. Read the revision before moving, delete the dangling pointer after.", zh: "Submodule 個 .git 係檔案,入面條路係相對阿爸個 repo。一搬走就成個 git 死埋。要搬之前先讀 revision,搬完刪咗嗰個斷咗嘅 .git。" }},
          { t: "MozillaBuild", d: { en: "mach hard-asserts on MozillaBuild at C:\\mozilla-build. A catch-22: bootstrap installs dependencies, but bootstrap runs via mach, and mach will not start without it. Install it first, silently, from Mozilla's FTP.", zh: "mach 硬性要 C:\\mozilla-build。死結:bootstrap 負責裝嘢,但 bootstrap 要 mach 行,而 mach 冇佢就唔開機。所以要最頭靜靜哋裝好佢。" }},
        ],
        verify: {
          en: "Every fix is confirmed from the runner log, not assumed. core.longpaths=true and the MozillaBuild install both appear as successful steps. As of writing there is still no green build and no published installer.",
          zh: "每個修正都係睇 runner log 確認,唔係估。core.longpaths=true 同 MozillaBuild 安裝都見到成功。寫呢刻仲係未綠過,亦未出過 installer。",
        },
      },
      {
        id: "releases",
        title: { en: "Releases", zh: "發佈" },
        body: [
          { p: {
            en: "Every push publishes a real release — not a draft, not a prerelease — with the built installer attached. Tags are monotonic off the workflow run number so no release is ever recycled or overwritten.",
            zh: "每次 push 都出一個真 release,唔係草稿唔係預覽,連埋砌好嘅 installer。Tag 跟 run number 遞增,唔會重用或者覆蓋。",
          }},
          { p: {
            en: "Releases are code-named after dim sum, cycled by run number: har gow, siu mai, char siu bao, cheung fun, dan tat, lo mai gai, wu gok, fung zaau, pai gwat, ham sui gok, ma lai go, lin yung bao, pei daan sou, zaa leung, dau fu fa, no mai chi.",
            zh: "Release 跟點心名排隊出:蝦餃、燒賣、叉燒包、腸粉、蛋撻、糯米雞、芋角、鳳爪、豉汁排骨、鹹水角、馬拉糕、蓮蓉包、皮蛋酥、炸兩、豆腐花、糯米糍。",
          }},
        ],
        security: {
          en: "Every release states on its face that it is an unofficial fork build and not an official Thunderbird release. The token chain is RELEASE_TOKEN, then ORG_TOKEN, then the ephemeral workflow token; none is ever printed or logged.",
          zh: "每個 release 都寫明係非官方 fork build,唔係官方 Thunderbird。Token 順序係 RELEASE_TOKEN → ORG_TOKEN → workflow token,一律唔會印出嚟或者寫入 log。",
        },
      },
    ],
  },

  {
    id: "infra",
    icon: "🖥️",
    name: { en: "Infrastructure", zh: "基礎設施" },
    blurb: { en: "Runners, and the one that yields the machine to Minecraft players.", zh: "Runner,同埋嗰個一有人打機就讓路嘅。" },
    docs: [
      {
        id: "runners",
        title: { en: "Runners", zh: "Runner" },
        body: [
          { table: {
            head: [{ en: "Runner", zh: "Runner" }, { en: "Arch / OS", zh: "架構 / 系統" }, { en: "Builds the installer?", zh: "砌到 installer?" }],
            rows: [
              ["windows-latest (GitHub)", "x86_64 Windows", { en: "yes — this is the one", zh: "得 —— 就係佢" }],
              ["fowshan-x64 (self-hosted)", "x86_64 Linux", { en: "no", zh: "唔得" }],
              ["super-arm64 (self-hosted)", "aarch64 Linux", { en: "no", zh: "唔得" }],
            ],
          }},
          { callout: { kind: "warn", text: {
            en: "Neither self-hosted runner runs Windows, so neither can build a Windows installer. Cores and disk do not turn Linux into Windows. They exist for lint, tests and Linux work.",
            zh: "兩個自建 runner 都係 Linux,砌唔到 Windows installer。核心幾多、碟幾大都好,Linux 變唔到做 Windows。佢哋係做 lint、測試同 Linux 嘢。",
          }}},
        ],
        security: {
          en: "This repository is public, and a self-hosted runner on a public repository is a known attack path: anyone who can cause a workflow to run can execute code on the machine. The installer workflow triggers only on push to protected branch patterns and workflow_dispatch, both requiring write access. A pull_request trigger on a self-hosted job would let any fork PR run arbitrary code on the box, alongside unrelated workloads. Never add one.",
          zh: "呢個 repo 係公開嘅,喺公開 repo 上面掛自建 runner 係known 攻擊路徑:邊個可以觸發 workflow 就可以喺部機行碼。而家淨係 push 去指定 branch 同 workflow_dispatch 先觸發,兩樣都要寫入權限。千祈唔好喺自建 runner 嗰啲 job 加 pull_request 觸發 —— 咁樣任何 fork PR 都可以喺部機行任意碼,隔籬仲有其他人嘅服務。",
        },
      },
      {
        id: "pause-guard",
        title: { en: "Minecraft-aware pause guard", zh: "打機自動讓路" },
        body: [
          { p: {
            en: "The x86_64 runner is a guest on a box that belongs to a Minecraft server and eight other containers. A supervisor reads the live player count every minute over rcon and yields the machine to players.",
            zh: "嗰部 x86_64 機本身係 Minecraft server 加另外八個 container 嘅地頭,CI runner 只係寄住。每分鐘用 rcon 數吓幾多人上線,有人就讓路。",
          }},
          { table: {
            head: [{ en: "Condition", zh: "情況" }, { en: "Action", zh: "動作" }],
            rows: [
              [{ en: "Players online", zh: "有人上線" }, { en: "pause the runner — the game always wins", zh: "暫停 runner —— 打機大晒" }],
              [{ en: "Server empty", zh: "冇人" }, { en: "resume building", zh: "繼續砌" }],
              [{ en: "Minecraft not running", zh: "Minecraft 冇開" }, { en: "resume — nobody to disturb", zh: "繼續 —— 冇人好嘈" }],
              [{ en: "rcon unreadable", zh: "rcon 讀唔到" }, { en: "pause — cannot prove it is safe", zh: "暫停 —— 證明唔到安全就當唔安全" }],
            ],
          }},
          { p: {
            en: "It uses docker pause rather than stop, so an in-flight build is frozen and continues from exactly where it stopped once the server empties, instead of being thrown away.",
            zh: "用 docker pause 唔用 stop,砌到一半嗰啲嘢雪住,人走咗接住砌,唔使由頭嚟過。",
          }},
        ],
        failures: [
          { t: { en: "Long pauses lose the job", zh: "停太耐會失去個 job" }, d: { en: "GitHub will eventually time the job out or drop the paused runner's connection. The guard protects the game server, not the build. If players are on for hours, expect to re-run.", zh: "停太耐 GitHub 會 timeout 或者斷線。個 guard 保護嘅係遊戲,唔係 build。如果玩幾個鐘,個 job 要重跑。" }},
          { t: { en: "Limits silently discarded", zh: "資源上限被靜靜哋忽略" }, d: { en: "On the Raspberry Pi runner, Docker reported that the kernel does not support memory limit capabilities, so the configured cpu and memory caps are not in effect.", zh: "喺 Raspberry Pi 嗰部,Docker 講明個 kernel 唔支援記憶體上限,即係設咗嘅 cpu / memory 限制其實冇生效。" }},
        ],
        verify: {
          en: "Verified end-to-end at deploy: the runner was force-paused with zero players online, and the guard detected the empty server and resumed it, logging 'RESUME (server empty)'.",
          zh: "部署嗰陣實測過:冇人上線嗰陣夾硬 pause 個 runner,個 guard 見到冇人就自動 resume,log 寫住 RESUME (server empty)。",
        },
      },
    ],
  },
];

export function allDocs() {
  const out = [];
  for (const c of CATEGORIES) for (const d of c.docs) out.push({ ...d, cat: c });
  return out;
}
