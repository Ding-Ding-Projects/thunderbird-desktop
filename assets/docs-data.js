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
              "A Material Design 3 CSS-layer restyle of Thunderbird's existing 3-pane, carried out on an unofficial fork.",
              "A Material Design 3 CSS-layer restyle of Thunderbird's existing 3-pane, carried out on an unofficial fork.",
              "The shipped scope is a Material Design 3 skin over upstream behavior; the full runtime rewrite is tracked separately.",
              "The design snapshot names the target pages and components, but Thunderbird runtime markup and behavior still have to be added.",
              "The purple jacket is shipped; the whole wardrobe is still on the roadmap.",
            ],
            zh: [
              "喺一個非官方 fork 上面,將 Thunderbird 現有三欄介面加上 Material Design 3 CSS 外皮。",
              "喺一個非官方 fork 上面,將 Thunderbird 現有三欄介面加上 Material Design 3 CSS 外皮。",
              "而家出貨範圍係 Material Design 3 skin；完整 runtime 重寫另外追蹤。",
              "設計 snapshot 寫晒目標 pages 同 components,但 Thunderbird runtime markup 同行為仲要落地。",
              "紫色外套已經出街,成套衫仲喺 roadmap 度排隊。",
            ],
          }},
          { h: { en: "Two rules that shape everything", zh: "兩條規矩決定晒一切" } },
          { list: [
            { en: "No stock markup is carried over. The rewrite is genuine, not a reskin.",
              zh: "舊 markup 一件都唔留。係真重寫,唔係換膚。" },
            { en: "Every existing feature must survive. ~18,450 lines and 167 cmd_* commands are in scope, and a checkbox is only ticked when the feature is genuinely wired.",
              zh: "所有現有功能都要保住。~18,450 行同 167 個 cmd_* 指令全部喺範圍內,真係駁通咗先剔。" },
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
              [{ en: "Section stylesheets", zh: "各段樣式" }, { en: "six landed — 4,062 lines across the six m3-*.css files", zh: "六個做起咗 —— 六個 m3-*.css 合共 4,062 行" }],
              [{ en: "Feature parity", zh: "功能對等" }, { en: "33 / 38 static contract boxes currently ticked; visual sign-off remains open", zh: "靜態契約而家剔咗 33 / 38 格；視覺 sign-off 仲未開" }],
              [{ en: "Windows installer CI", zh: "Windows 安裝檔 CI" }, { en: "green — build 59, tb-155.0a1-b59-lin-yung-bao, 85,317,666 bytes", zh: "綠燈 —— build 59, tb-155.0a1-b59-lin-yung-bao,85,317,666 bytes" }],
              [{ en: "Lint CI", zh: "Lint CI" }, { en: "green — stylelint + eslint, and its known-bad-file self-test passes", zh: "綠燈 —— stylelint + eslint,連「攞壞檔案考自己」嗰個自我測試都過到" }],
              [{ en: "Run-time verification", zh: "實機驗證" }, { en: "partial — genuine hosted captures and a local headless capture exist; final browser run is still being verified", zh: "部分完成 —— 有真 hosted capture 同本機 headless capture；final browser run 仲驗緊" }],
            ],
          }},
          { callout: { kind: "warn", text: {
            en: "The static contract is currently 33 / 38. The b59 installer is real; the final browser run is still being verified. Repository screenshots are labelled as evidence, diagnostics, or explicit gaps; none are silently promoted to visual sign-off.",
            zh: "靜態契約而家係 33 / 38。b59 installer 係真嘅；final browser run 仲驗緊。repo 截圖會標明係證據、診斷定明確 gap,唔會偷換成視覺 sign-off。",
          }}},
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
          en: "Contract state is read from design/REWRITE-CONTRACT.md (33 of 38); installer state is read from the published b59 release; lint state is read from the successful pushed run; browser state remains running or red until its actual verdict. The rolling Discussion records the exact evidence.",
          zh: "契約狀態係睇 design/REWRITE-CONTRACT.md(33 格剔咗 38 格);installer 狀態係睇已出嘅 b59 release;lint 狀態係睇成功嘅 pushed run;browser 狀態要等真實 verdict,唔會估。Rolling Discussion 會記低每份證據。",
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
      {
        id: "lwtheme-guard",
        title: { en: "The lightweight-theme guard, and the specificity trap under it", zh: "lwtheme 護欄,同埋下面嗰個特異度陷阱" },
        body: [
          { p: {
            en: [
              "Thunderbird supports lightweight themes. When one is installed, the root element carries an lwtheme attribute and the theme supplies its own colours. Every colour rule the rewrite adds is therefore written as :root:not([lwtheme]) { ... }, so an installed theme wins and the M3 palette applies only when no theme is present.",
              "Thunderbird supports lightweight themes. With one installed the root element carries an lwtheme attribute and the theme supplies its own colours, so every colour rule the rewrite adds is written as :root:not([lwtheme]) { ... }. The theme wins; the M3 palette applies only when no theme is present.",
              "Thunderbird lets users install lightweight themes. When one is on, the root element gets an lwtheme attribute. So every colour rule we add is wrapped in :root:not([lwtheme]) — the user's theme wins, and our palette only shows up when there is no theme to argue with.",
              "Users can install lightweight themes, and when they do the root element gets an lwtheme attribute. Every colour rule we add sits inside :root:not([lwtheme]), which is a polite way of saying: if the user picked a theme, we shut up.",
              "Install a lightweight theme and the root element grows an lwtheme attribute. Every colour we paint hides behind :root:not([lwtheme]) — the user's theme is the boss, and our palette only speaks when nobody else is in the room.",
            ],
            zh: [
              "Thunderbird 支援輕量主題。裝咗之後根元素會有 lwtheme 屬性,顏色由主題話事。所以重寫加嘅每一條顏色規則都寫成 :root:not([lwtheme]) { ... },有主題就主題贏,冇主題先用 M3 色盤。",
              "Thunderbird 支援輕量主題。裝咗之後根元素會有 lwtheme 屬性,顏色由主題出。所以我哋加嘅每條顏色規則都包住 :root:not([lwtheme]):主題贏,冇主題先輪到 M3 色盤。",
              "用家可以裝輕量主題,一裝根元素就有 lwtheme 屬性。所以我哋每條顏色規則都收埋喺 :root:not([lwtheme]) 入面 —— 人哋揀咗主題,我哋就唔出聲。",
              "用家裝咗輕量主題,根元素就會多咗個 lwtheme 屬性。我哋每條顏色都匿喺 :root:not([lwtheme]) 後面,講白啲即係:你揀咗主題,我哋收聲。",
              "一裝輕量主題,根元素即刻長出個 lwtheme 屬性。我哋啲顏色全部匿喺 :root:not([lwtheme]) 後面 —— 主題大晒,冇人喺度我哋先敢開聲。",
            ],
          }},
          { h: { en: "The trap: a media query adds no specificity", zh: "陷阱:media query 一分特異度都唔加" } },
          { p: {
            en: "Adding :not([lwtheme]) to :root raises a rule's specificity by (0,2,0) — one for the attribute selector, one for the negated simple selector inside it. Wrapping a rule in @media adds nothing at all; a media query is a condition, not a selector. So the moment the base rules were guarded, every accessibility fallback that existed to override them — @media (prefers-contrast) and @media (forced-colors) — was outranked by the very rules it was written to undo, while still looking completely correct in the source.",
            zh: "喺 :root 加 :not([lwtheme]) 會令條規則特異度升 (0,2,0):屬性選擇器一分,入面被否定嗰個簡單選擇器一分。但係用 @media 包住就一分都唔加 —— media query 係條件,唔係選擇器。所以基本規則一加咗護欄,啲本來用嚟蓋過佢哋嘅無障礙 fallback(@media (prefers-contrast) 同 @media (forced-colors))即刻打唔贏自己要蓋嘅嗰啲規則,但係睇個 source 又完全似係啱嘅。",
          }},
          { h: { en: "Failure modes actually observed", zh: "真係撞過嘅出事情況" } },
          { list: [
            { en: "Most losses degrade quietly, because the user agent's own forced-colors adjustment re-forces the losing token anyway — which is exactly what makes the bug hard to notice.",
              zh: "大部分打輸咗都靜靜雞冇乜表徵,因為瀏覽器引擎自己嗰套 forced-colors 調整照樣會夾硬改返個 token —— 咁就正正係最難察覺嗰種 bug。" },
            { en: "Two did not degrade quietly, because a system colour survives forced-colors and a token does not. #threadPaneSelectedCount lost SelectedItem / SelectedItemText, so the 'N selected' pill became indistinguishable from the header bar behind it.",
              zh: "有兩個唔係靜靜雞,因為系統色捱得過 forced-colors,而 token 捱唔過。#threadPaneSelectedCount 輸咗 SelectedItem / SelectedItemText,個「已選 N 封」標記同後面條標題列變到一模一樣,睇唔到。" },
            { en: "thread-card-tags[tags] lost background-color: transparent to a color-mix() that IS forced, painting an opaque box over the row.",
              zh: "thread-card-tags[tags] 嗰句 background-color: transparent 輸咗畀一個真係會被 forced 嘅 color-mix(),結果喺成行上面糊咗個唔透明嘅方格。" },
            { en: "Over-guarding is a bug of exactly the same size. Focus rings, !important rules and fallbacks that have no guarded competitor must stay UNPREFIXED — guard the keyboard focus ring and installing a theme silently deletes an accessibility affordance.",
              zh: "包過龍一樣係 bug,而且一樣咁大。焦點框、!important、同埋根本冇對手要蓋嘅 fallback 一定唔可以加護欄 —— 你包住個鍵盤焦點框,人哋一裝主題就靜靜哋冇咗個無障礙功能。" },
          ]},
          { callout: { kind: "note", text: {
            en: "The rule of thumb the files follow: guard what a theme should be allowed to replace (colour), never guard what a theme must not be allowed to remove (focus rings, forced-colors and prefers-contrast fallbacks that have no guarded competitor). Every prefixed block in the tree carries a comment saying which guarded rule it exists to out-rank.",
            zh: "啲檔案跟嘅原則:主題有權換嘅嘢(顏色)先加護欄;主題唔准剷走嘅嘢(焦點框,同埋冇對手要蓋嘅 forced-colors / prefers-contrast fallback)一律唔加。樹入面每一個加咗護欄嘅 block 都寫低咗佢係為咗贏邊條有護欄嘅規則而存在。",
          }}},
        ],
        security: {
          en: "This is an accessibility-integrity issue, not a cosmetic one. Both directions of the mistake are silent: an under-guarded fallback loses to its own base rule, and an over-guarded focus ring vanishes the moment a theme is installed. Neither throws, neither logs, and neither is visible in the default configuration a developer usually looks at — no theme installed, no high-contrast mode on.",
          zh: "呢個係無障礙嘅完整性問題,唔係靚唔靚嘅問題。兩邊做錯都唔會出聲:護欄唔夠嗰個會打唔贏自己要蓋嘅規則,包過龍嗰個一裝主題就冇咗個焦點框。兩樣都唔會拋錯、唔會寫 log,而且喺開發者平時嗰個預設環境(冇裝主題、冇開高對比)根本睇唔到。",
        },
        verify: {
          en: "Counted per file, comment-stripped and in selector position: m3-layout 11 guards, m3-folder-pane 56, m3-thread-pane 30, m3-quick-filter 21, m3-message-pane 3, m3-chrome 9, material-tokens 0 (by design — the token layer defines the palette rather than applying it). This page previously published 15 / 61 / 42 / 25 / 10 / 11, which was grep -c lwtheme — a raw substring count that also caught every sentence of the comments explaining the guards. The guards were always real and correctly spelled; only the arithmetic was wrong. An earlier wave found and fixed three fallbacks that lost to the rule they existed to undo; the 2026-07-29 audit found five more, plus two of the opposite shape — one over-guarded fallback where installing a theme deleted the only pane boundary in high contrast, and one sheet with no contrast fallback at all, where a toggle button's pressed state measured 1.17:1 in the default light path. The surviving prefixed blocks, such as the forced-colors block in m3-folder-pane.css and the prefers-contrast block in m3-chrome.css, each open with :root:not([lwtheme]) inside the @media and a comment naming the rules they override.",
          zh: "逐個檔案數過,剝走註釋、淨計 selector 位置:m3-layout 11 個護欄、m3-folder-pane 56、m3-thread-pane 30、m3-quick-filter 21、m3-message-pane 3、m3-chrome 9、material-tokens 0(故意嘅 —— token 層係定義色盤,唔係塗色)。呢版之前寫住 15 / 61 / 42 / 25 / 10 / 11,嗰個係 grep -c lwtheme —— 純粹數字串,連註釋入面解釋緊護欄嗰啲句子都當咗係護欄。護欄本身一直冇事、寫得啱,係把算盤唔啱。之前一個 wave 搵到三個「輸咗畀佢想撤銷嗰條 rule」嘅 fallback 並且改咗;2026-07-29 嗰次審計再搵到五個,另外仲有兩個相反方向嘅 —— 一個護欄加過龍,裝咗主題就會剷走高對比度下唯一嘅分隔線;另一個係成個檔案根本冇 contrast fallback,一個 toggle 掣撳咗之後對比度得 1.17:1。其餘加咗護欄嗰啲,例如 m3-folder-pane.css 嘅 forced-colors block 同 m3-chrome.css 嘅 prefers-contrast block,都係喺 @media 入面即刻寫 :root:not([lwtheme]),仲有註解寫明佢要蓋邊啲規則。",
        },
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
          en: "Every fix is confirmed from the runner log, not assumed. core.longpaths=true and the MozillaBuild install both appear as successful steps. The pipeline is now green and has published seven releases with a real installer attached; the newest is tb-155.0a1-b24-pai-gwat at 85,211,580 bytes. Green means the installer was produced and uploaded — it does not mean anyone has installed and launched it.",
          zh: "每個修正都係睇 runner log 確認,唔係估。core.longpaths=true 同 MozillaBuild 安裝都見到成功。而家條 pipeline 綠咗,已經出咗七個 release,個個都連埋真 installer,最新係 tb-155.0a1-b24-pai-gwat,85,211,580 bytes。不過綠嘅意思係「砌到同上載到」,唔等於有人裝過同開過。",
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
        verify: {
          en: "Seven releases published so far, the newest being tb-155.0a1-b24-pai-gwat — 🍖 pai gwat, black-bean spare ribs — with an 85,211,580-byte installer attached.",
          zh: "到而家出咗七個 release,最新係 tb-155.0a1-b24-pai-gwat(🍖 豉汁排骨),連住一個 85,211,580 bytes 嘅 installer。",
        },
      },
      {
        id: "lint",
        title: { en: "The lint workflow", zh: "Lint workflow" },
        body: [
          { p: {
            en: [
              "A second workflow, .github/workflows/lint-m3.yml, runs stylelint over the six m3-*.css files and material-tokens.css, and eslint over about3Pane.xhtml. It is deliberately separate from the installer workflow: it shares no job, no needs:, no concurrency group and no permissions, so it cannot make the installer fail, cancel it, or change what it publishes.",
              "A second workflow, .github/workflows/lint-m3.yml, runs stylelint over the six m3-*.css files plus material-tokens.css, and eslint over about3Pane.xhtml. It is deliberately separate from the installer: no shared job, no needs:, no shared concurrency group, no shared permissions — it cannot break, cancel or alter a release.",
              "lint-m3.yml lints the seven CSS files the rewrite adds, plus about3Pane.xhtml through eslint. It is kept well away from the installer workflow — no shared job, no shared concurrency, no shared permissions — so a lint problem can never cost you a release.",
              "lint-m3.yml checks the seven stylesheets we added and runs eslint on about3Pane.xhtml. It lives at arm's length from the installer on purpose: no shared job, no shared concurrency group, no shared permissions. Lint may complain; it may not take the release down with it.",
              "lint-m3.yml is the workflow that reads our seven stylesheets back to us, plus eslint on about3Pane.xhtml. It is kept in a separate room from the installer — nothing shared, not a job, not a concurrency group, not a permission — so it can grumble all it likes without ever costing a release.",
            ],
            zh: [
              "第二個 workflow,.github/workflows/lint-m3.yml,用 stylelint 檢查六個 m3-*.css 同 material-tokens.css,再用 eslint 檢查 about3Pane.xhtml。佢刻意同 installer workflow 完全分開:唔共用 job、唔用 needs:、唔同一個 concurrency group、權限亦唔同,所以佢冇可能搞垮、取消、或者改到 installer 出嘅嘢。",
              "第二個 workflow .github/workflows/lint-m3.yml 用 stylelint 睇六個 m3-*.css 加 material-tokens.css,再用 eslint 睇 about3Pane.xhtml。佢同 installer 刻意分家:冇共用 job、冇 needs:、冇同一個 concurrency group、權限都唔同,所以整唔停亦改唔到 release。",
              "lint-m3.yml 負責 lint 重寫加嘅七個 CSS 檔,同埋用 eslint 睇 about3Pane.xhtml。佢同 installer workflow 隔到好開 —— 冇共用 job、冇共用 concurrency、冇共用權限 —— lint 出事都唔會累到你冇 release。",
              "lint-m3.yml 專門睇我哋加嘅七個 stylesheet,再 eslint 一下 about3Pane.xhtml。佢同 installer 特登保持距離:job、concurrency group、權限一律唔共用。Lint 可以喺度嘈,但唔准拖冧個 release。",
              "lint-m3.yml 就係嗰個會將我哋七個 stylesheet 逐隻讀返出嚟嘅 workflow,順手 eslint 埋 about3Pane.xhtml。佢同 installer 分房瞓 —— job、concurrency group、權限一樣都唔共用 —— 佢想點嘈都得,總之唔准整冇個 release。",
            ],
          }},
          { h: { en: "Why it needs gecko at all", zh: "點解 lint 都要攞 gecko" } },
          { p: {
            en: "This repository is the comm tree only: no mach, no mozlint, no node_modules. The linter configuration that governs these files lives here (comm/.stylelintrc.js, comm/eslint.config.mjs, comm/tools/lint/*.yml) but the machinery that reads it lives in mozilla-central. So the workflow fetches the same pinned gecko revision the installer uses, assembles gecko/comm, and runs ./mach commlint. `mach commlint`, not `mach lint` — commlint is what inserts comm/tools/lint into mozlint's config paths, and plain `mach lint` would silently apply Firefox's rules instead.",
            zh: "呢個 repo 淨係得 comm 一半:冇 mach、冇 mozlint、冇 node_modules。管住呢啲檔案嘅 linter 設定係喺呢度(comm/.stylelintrc.js、comm/eslint.config.mjs、comm/tools/lint/*.yml),但係讀嗰啲設定嘅機器喺 mozilla-central。所以個 workflow 會攞同 installer 一樣嗰個釘死咗嘅 gecko revision,砌好 gecko/comm,再行 ./mach commlint。要用 commlint,唔係 mach lint —— commlint 先會將 comm/tools/lint 塞入 mozlint 嘅設定路徑,行 mach lint 會靜靜哋用咗 Firefox 嗰套規則。",
          }},
          { h: { en: "It proves it is actually checking something", zh: "佢會證明自己真係有喺度檢查" } },
          { p: {
            en: "A green lint run means nothing on its own: it is indistinguishable from a run where mozlint skipped every path or the setup failed open. So before the real lint, the job writes a file containing `colour: red` — not a CSS property, and comm/.stylelintrc.js enables property-no-unknown explicitly — lints it, and fails the job if stylelint passes it. There is a matching check on the input side: if the m3-*.css glob matches nothing, the job errors out rather than going green over an empty set.",
            zh: "Lint 綠燈本身講明唔到嘢:同「mozlint 咩路徑都冇 lint 過」或者「setup 靜靜哋掛咗」睇落一模一樣。所以喺真正 lint 之前,個 job 會寫一個含住 colour: red 嘅檔案 —— colour 唔係 CSS 屬性,而 comm/.stylelintrc.js 特登開咗 property-no-unknown —— 拎去 lint,如果 stylelint 竟然話佢過到,個 job 就當失敗。入口嗰邊都有同款檢查:如果 m3-*.css 個 glob 一個都夾唔到,個 job 會報錯,唔會對住個空集合扮綠。",
          }},
        ],
        failures: [
          { t: { en: "Empty expression in a run-script comment", zh: "註解入面嗰個空 expression" },
            d: { en: "A comment inside a `run:` block explained why the step expands the glob in bash instead of through a workflow expression — and spelled the expression syntax out literally to do so. GitHub evaluates workflow expressions ANYWHERE in the file, including inside run-script comments, and an empty one is invalid, so the workflow was rejected by the parser before a single step ran. The comment describing why the step avoids expressions was the thing that broke it. It now describes the braces in words and never writes them.",
              zh: "有段喺 run: 入面嘅註解,解釋緊點解要喺 bash 度展開個 glob 而唔用 workflow expression,順手就將 expression 嘅寫法原原本本打咗出嚟。但係 GitHub 喺成個檔案任何位都會計 expression,連 run script 嘅註解都計,而空嘅 expression 係無效嘅,結果個 workflow 未行過一步就被 parser 拒絕。搞到出事嘅,正正就係嗰段解釋「點解唔用 expression」嘅註解。而家佢淨係用文字講嗰對括號,唔會真係打出嚟。" }},
          { t: { en: "A green run that checked nothing", zh: "check 咗等於冇 check 嘅綠燈" },
            d: { en: "Guarded against rather than suffered: without the self-test and the empty-glob check, a rename of the m3-*.css files would leave the job passing over zero files. Both failures now abort the job with an ::error:: annotation.", zh: "呢個係防住而唔係撞過:冇咗自我測試同空 glob 檢查,一旦 m3-*.css 改咗名,個 job 就會對住零個檔案照樣過。而家兩種情況都會用 ::error:: 標註直接終止個 job。" }},
          { t: { en: "Bare mach in the self-test", zh: "自我測試度淨係寫 mach" },
            d: { en: "GitHub runs run: blocks under bash -e, so invoking mach bare in the self-test would abort the step the moment it failed — which is the exact outcome the self-test is trying to observe — and would look like the self-test itself was broken. It is invoked as `|| rc=$?` so the non-zero exit can be read and asserted on.", zh: "GitHub 行 run: 係用 bash -e,所以喺自我測試度直接寫 mach,佢一失敗成個 step 即刻死 —— 而失敗正正就係自我測試想睇到嘅結果 —— 表面睇落仲會似係自我測試自己壞咗。所以要寫成 || rc=$?,咁先讀到個非零 exit code 再去判斷。" }},
        ],
        security: {
          en: "permissions: contents: read, and nothing else. The installer workflow needs contents: write to publish releases; this one must never be able to write anything. It also runs on GitHub-hosted ubuntu-latest rather than a self-hosted runner — it has a pull_request trigger, and a pull_request trigger on a self-hosted runner in a public repository would let any fork PR execute arbitrary code on that machine.",
          zh: "權限淨係 contents: read,冇第二樣。Installer 要 contents: write 先出到 release,呢個就一定唔准寫得到任何嘢。佢亦都係行 GitHub 自己嘅 ubuntu-latest,唔行自建 runner —— 因為佢有 pull_request 觸發,而喺公開 repo 度將 pull_request 觸發駁上自建 runner,等於任何 fork PR 都可以喺部機行任意碼。",
        },
        verify: {
          en: "The workflow is green, and the self-test step passes on its own terms: mach commlint exits non-zero on the known-bad file, which is what the step demands before it will let the run continue. eslint over about3Pane.xhtml currently reports nothing — its 19 <script> elements are all src-only, so that step is a regression guard against a future inline script rather than a source of present findings.",
          zh: "個 workflow 綠燈,而自我測試嗰步亦都以佢自己嘅標準過到:mach commlint 對住嗰個壞檔案出非零 exit code,而咁樣先係嗰步准許個 run 繼續嘅條件。about3Pane.xhtml 嗰邊 eslint 而家一個問題都冇報 —— 佢入面 19 個 <script> 全部淨係 src,所以嗰步係防住將來有人加 inline script,唔係而家有嘢要執。",
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
