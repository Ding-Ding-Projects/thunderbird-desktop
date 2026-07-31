/* Material Mail runtime preview controls and local-first feature surfaces. */
"use strict";

const STORAGE_KEY = "mail.material.preview.settings";
const HISTORY_KEY = "mail.material.preview.history";
const NOTIFICATION_KEY = "mail.material.preview.notifications";
const DEFAULTS = Object.freeze({ theme: "light", density: "comfortable", language: "en", funnyEn: 2, funnyZh: 3, narrator: false, narratorLanguage: "en", dimsum: true, accent: "purple", fontFamily: "Segoe UI", fontScale: 100, fontWeight: 400, hasLaunched: false });
const ACCENTS = Object.freeze({ purple: ["#6750a4", "#eaddff", "#21005d"], blue: ["#415f91", "#d6e3ff", "#001b3e"], green: ["#386a20", "#b7e1a1", "#0b2003"], orange: ["#8b5000", "#ffddb4", "#2c1600"] });
const FUNNY_EN = Object.freeze(["", " Nice and tidy.", " The preference gremlin can take a tea break.", " The tiny settings drawer is doing a victory lap.", " The bits lined up like dim sum in a steamer."]);
const FUNNY_ZH = Object.freeze(["", " 整整齊齊。", " 個設定小精靈可以飲啖茶喇。", " 啲掣終於排隊，唔使再爭位。", " 成班設定好似點心咁乖乖入籠喇。"]);
const FEATURE_GUIDE = Object.freeze([
  { title: ["Material landing and documentation", "Material 入口同文件"], status: ["Partial · packaged guide", "部分 · 已打包指南"], summary: ["This page enumerates the design-folder feature articles and their current evidence boundary.", "呢頁列出 design folder 功能文章同目前證據界線。"], article: "design/features/runtime/README.md" },
  { title: ["Language modes and funny levels", "語言模式同幽默等級"], status: ["Preview wired", "預覽已接通"], summary: ["English, Hong Kong Cantonese, bilingual copy, and independent levels 1–5 stay local and fact-preserving.", "英文、香港廣東話、雙語文字同獨立 1–5 等級只留本機，事實保持清楚。"], article: "design/features/runtime/language-tone.md" },
  { title: ["Non-blocking notifications", "非阻塞通知"], status: ["Preview partial", "預覽部分完成"], summary: ["Notifications stack without blocking, retain dismissed history, and expose local filters.", "通知會疊放但唔阻塞，保留收起歷史，亦有本機篩選。"], article: "design/features/runtime/notification-centre.md" },
  { title: ["Dim-sum startup surprise", "啟動點心驚喜"], status: ["Preview partial", "預覽部分完成"], summary: ["A bundled local dish can appear once per eligible launch with a persisted opt-out.", "合資格啟動可以顯示一次本機點心，並有保存嘅停用設定。"], article: "design/features/runtime/dim-sum-surprise.md" },
  { title: ["Anchored regex builder", "貼住搜尋欄嘅正規表達式建立器"], status: ["Packaged foundation", "已打包基礎"], summary: ["Each preview search field keeps plain text as default and owns a bounded local builder.", "每個預覽搜尋欄預設純文字，並有自己嘅有界本機建立器。"], article: "design/features/runtime/regex-builder.md" },
  { title: ["Per-element appearance editor", "逐元素外觀編輯器"], status: ["Preview partial", "預覽部分完成"], summary: ["Context-menu and Shift+F10 editing persists local surface, text, shape, size, and weight overrides.", "右鍵選單同 Shift+F10 可以保存表面、文字、形狀、大小同字重覆寫。"], article: "design/features/runtime/appearance-editor.md" },
  { title: ["Continuous colour translator", "連續色彩轉換器"], status: ["Source wired · capture pending", "Source 已接通 · 等截圖"], summary: ["The picker translates named, HEX, RGB/A, HSL/A, HSV, HWB, Lab/LCH, OKLab/OKLCH, and CMYK locally.", "選色器本機轉換 named、HEX、RGB/A、HSL/A、HSV、HWB、Lab/LCH、OKLab/OKLCH 同 CMYK。"], article: "design/features/runtime/color-translator.md" },
  { title: ["Browser-style tabs", "瀏覽器式分頁"], status: ["Open gap", "未完成"], summary: ["Overflow, pinning, grouping, four tab searches, and safe bulk-close previews remain roadmap work.", "溢出、釘選、分組、四種分頁搜尋同安全批量關閉預覽仍喺路線圖。"], article: "design/GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md#gm-09" },
  { title: ["External editor integration", "外部編輯器整合"], status: ["Open gap", "未完成"], summary: ["Installed-editor discovery, selection, persistence, and graceful failure remain open.", "已安裝編輯器探索、選擇、保存同優雅失敗處理仍未完成。"], article: "design/GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md#gm-10" },
  { title: ["Git-backed local history", "Git 本機歷史"], status: ["Preview partial", "預覽部分完成"], summary: ["The preview records append-only local revisions; production snapshots for every owned record remain open.", "預覽記錄只加不改本機版本；每個擁有記錄嘅 production snapshot 仍未完成。"], article: "design/features/runtime/local-history.md" },
  { title: ["All-release changelog", "全版本更新記錄"], status: ["Preview partial", "預覽部分完成"], summary: ["Search, typed date filters, copy, and Markdown export work on local factual entries; release-data wiring remains open.", "本機事實記錄支援搜尋、輸入日期篩選、複製同 Markdown 匯出；release data 接駁仍未完成。"], article: "design/features/runtime/changelog-viewer.md" },
  { title: ["Serialized narrator", "串行旁白"], status: ["Preview partial", "預覽部分完成"], summary: ["Optional platform speech is off by default and serializes English/Cantonese lines with cooldown.", "平台語音預設關閉，串行播放英文/廣東話並有 cooldown。"], article: "design/features/runtime/narrator.md" },
  { title: ["Accessibility and localization", "無障礙同本地化"], status: ["Open sign-off", "等簽核"], summary: ["Focus, roles, contrast, reduced motion, CJK fallback, and narrow bilingual evidence still need full artifact sign-off.", "焦點、角色、對比度、減少動畫、CJK fallback 同窄身雙語證據仍要完整 artifact 簽核。"], article: "design/A11Y-L10N-AUDIT.md" },
  { title: ["Release and evidence discipline", "Release 同證據紀律"], status: ["Active", "進行中"], summary: ["Every source wave records exact SHA, tests, release state, and screenshot boundaries without promoting queued CI.", "每個 source wave 都記錄 exact SHA、測試、release 狀態同 screenshot 界線，唔會將排隊 CI 扮成功。"], article: "design/evidence/manifest.json" },
]);
const FEATURE_ARTICLES = Object.freeze({
  "design/features/runtime/README.md": {
    behavior: ["This category groups the packaged Material runtime slice and its foundational modules.", "呢個分類收集已打包嘅 Material runtime 部分同基礎模組。"],
    configuration: ["Each entry points at a bundled design article and keeps its status separate from the source path.", "每個項目都指向打包嘅 design 文章，狀態同來源路徑分開保留。"],
    failure: ["Static documentation, preview wiring, and built-artifact evidence are different boundaries; one cannot silently stand in for another.", "靜態文件、預覽接線同 built-artifact 證據係唔同界線，唔可以偷換概念。"],
    security: ["The guide reads bundled local data only; it does not fetch articles, account data, fonts, or analytics.", "指南只讀取打包本機資料；唔會抓文章、帳戶資料、字型或者 analytics。"],
    verification: ["Run the Material preview verifier and the focused module tests named by each article; runtime sign-off still needs the built artifact.", "要跑 Material 預覽驗證器同每篇文章列出嘅 focused module tests；runtime 簽核仍要 built artifact。"],
  },
  "design/features/runtime/language-tone.md": {
    behavior: ["English, playful Hong Kong Cantonese, and bilingual modes share the same facts while independent funny levels style the voice.", "英文、玩味香港廣東話同雙語模式保留同一套事實，獨立幽默等級只改語氣。"],
    configuration: ["Language and English/Cantonese levels are persisted in the local preview settings namespace.", "語言同英文／廣東話等級保存喺本機預覽設定 namespace。"],
    failure: ["Malformed storage or unknown values fall back to safe defaults instead of erasing a valid preference.", "儲存資料壞咗或者值唔識時會退返安全預設值，唔會抹走有效設定。"],
    security: ["Copy remains local and bilingual labels keep the factual Cantonese text available to assistive technology.", "文字留喺本機，雙語標籤亦保留事實清楚嘅廣東話畀輔助科技。"],
    verification: ["The DOM-free language model has its own tests; the preview verifier checks the mounted controls and disclosure.", "無 DOM 語言模型有自己嘅 tests；預覽驗證器檢查已掛載控制同披露文字。"],
  },
  "design/features/runtime/notification-centre.md": {
    behavior: ["Notifications stay non-blocking, stack in a reviewable list, and retain dismissed records.", "通知保持非阻塞、喺可重看清單疊放，並保留已收起記錄。"],
    configuration: ["The preview stores fixture notification state locally and offers all, unread, and dismissed filters.", "預覽將 fixture 通知狀態保存在本機，提供全部、未讀同已收起篩選。"],
    failure: ["Storage failure leaves the seeded stack visible; invalid search patterns produce no matches without blocking the page.", "儲存失敗會保留 seeded 清單；無效搜尋模式只顯示冇匹配，唔會阻塞頁面。"],
    security: ["Fixture copy and bounded local search never read accounts, messages, credentials, or network content.", "Fixture 文字同有界本機搜尋唔會讀取帳戶、郵件、憑證或者網絡內容。"],
    verification: ["Live counts, labelled filters, keyboard dismiss actions, and the adjacent regex builder are covered by the preview contract.", "即時數量、標籤篩選、鍵盤收起操作同旁邊嘅 regex builder 由預覽 contract 覆蓋。"],
  },
  "design/features/runtime/dim-sum-surprise.md": {
    behavior: ["An eligible launch gets a fresh 1% chance of one non-blocking local Classic har gow card, never on first launch.", "合資格啟動有新抽籤嘅 1% 機會顯示一次非阻塞本機經典蝦餃卡，首次啟動唔會出。"],
    configuration: ["The Settings opt-out is persisted, and the factual dish name stays unchanged by funny level.", "設定入面嘅停用選項會保存，真實點心名稱唔受幽默等級影響。"],
    failure: ["Missing storage suppresses the surprise rather than making startup depend on it; one launch cannot show it twice.", "儲存唔得時會收起驚喜，唔會令啟動依賴儲存；同一啟動唔會出兩次。"],
    security: ["The image is a bundled local catalog asset with no CDN, tracking, or network fallback.", "圖片係打包本機 catalog asset，冇 CDN、tracking 或網絡 fallback。"],
    verification: ["Static checks prove the local asset and launch boundary; deterministic built-artifact capture is still separate evidence.", "靜態檢查證明本機 asset 同啟動界線；deterministic built-artifact capture 仍係另一種證據。"],
  },
  "design/features/runtime/regex-builder.md": {
    behavior: ["Plain text stays the default; the adjacent builder offers guided tokens, raw patterns, flags, samples, matches, captures, copy, and export.", "純文字保持預設；旁邊嘅建立器提供引導符號、原始模式、旗標、範例、匹配、捕獲組、複製同匯出。"],
    configuration: ["The engine is ECMAScript RegExp with local bounds: 512-character patterns, 100,000-character samples, 64 captures, and 200 matches.", "引擎係 ECMAScript RegExp，有本機界線：模式 512 字、範例 100,000 字、64 個捕獲組、200 個匹配。"],
    failure: ["Invalid syntax or flags, oversized input, unsupported backreferences, nested quantifiers, no matches, and zero-width matches are reported safely.", "無效語法或旗標、過大輸入、不支援嘅 backreference、巢狀量詞、冇匹配同零寬匹配都會安全報告。"],
    security: ["Patterns and samples stay in the local document and are bounded before evaluation; exports are versioned JSON, never executable code.", "模式同範例留喺本機文件，評估前有界；匯出係有版本 JSON，唔係可執行程式碼。"],
    verification: ["The builder returns focus to its originating field, keeps each field's state separate, and is covered by the regex module tests.", "建立器會將焦點還返原本欄位，每個欄位狀態分開保存，並由 regex module tests 覆蓋。"],
  },
  "design/features/runtime/appearance-editor.md": {
    behavior: ["Context menu or Shift+F10 opens a non-blocking editor beside the selected card, tab, app bar, or search field.", "右鍵選單或者 Shift+F10 會喺選中嘅卡、分頁、app bar 或搜尋欄旁邊開非阻塞編輯器。"],
    configuration: ["Local stable target keys persist surface/text colours, radius, size, weight, accent seed, font, scale, and reset actions.", "本機 stable target key 保存表面／文字色、圓角、大小、字重、accent seed、字型、比例同重設操作。"],
    failure: ["Invalid colour text leaves the last valid value; viewport placement clamps inside the window and storage failure does not block live edits.", "無效顏色文字會保留上一次有效值；視窗邊緣會限制位置，儲存失敗都唔會阻塞即時編輯。"],
    security: ["Only local CSS overrides are persisted; the editor reads no remote fonts, images, analytics, account data, or network content.", "只保存本機 CSS 覆寫；編輯器唔會讀取遠端字型、圖片、analytics、帳戶資料或者網絡內容。"],
    verification: ["The labelled dialog, local search, anchored regex builder, reset controls, translator tests, and preview contract cover the mounted foundation.", "有標籤對話框、本機搜尋、貼住嘅 regex builder、重設控制、translator tests 同預覽 contract 覆蓋已掛載基礎。"],
  },
  "design/features/runtime/color-translator.md": {
    behavior: ["The appearance editor translates named colours, HEX/HEX8, RGB/A, HSL/A, HSV, HWB, CIELAB/LCH, OKLab/OKLCH, and CMYK locally.", "外觀編輯器本機轉換 named colour、HEX/HEX8、RGB/A、HSL/A、HSV、HWB、CIELAB/LCH、OKLab/OKLCH 同 CMYK。"],
    configuration: ["A continuous HSL control and direct entry drive the selected surface or text custom property; alpha and source space remain visible.", "連續 HSL 控制同直接輸入驅動選中嘅表面或文字 custom property；alpha 同來源色彩空間保持可見。"],
    failure: ["Invalid input keeps the last valid colour; out-of-sRGB values are labelled as clipped, not silently called in-gamut.", "無效輸入會保留上一次有效色；超出 sRGB 會標明 clipped，唔會靜靜叫佢 in-gamut。"],
    security: ["Conversion is bounded numeric work with no network, remote assets, analytics, or untrusted code evaluation.", "轉換係有界數值運算，冇網絡、遠端資產、analytics 或不受信任程式碼評估。"],
    verification: ["Run the color translator tests and Material preview verifier; the built-artifact picker capture remains a separate sign-off boundary.", "要跑 color translator tests 同 Material 預覽驗證器；built-artifact picker capture 仍係另一個簽核界線。"],
  },
  "design/GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md#gm-09": {
    behavior: ["The current preview exposes ordinary pages as browser-style tabs, but full overflow, pinning, grouping, and four-search behavior remain an open gap.", "目前預覽用瀏覽器式分頁展示普通頁面，但完整溢出、釘選、分組同四種搜尋仍係未完成缺口。"],
    configuration: ["The guide records the gap against the dated audit article instead of claiming the roadmap work is shipped.", "指南將缺口記錄喺有日期嘅 audit 文章，唔會扮路線圖工作已出貨。"],
    failure: ["A narrow strip or hidden group must not silently clip or lose tabs; those states still need implementation and evidence.", "窄分頁列或者收埋嘅 group 唔可以靜靜裁走或遺失分頁；呢啲狀態仍要實作同取證。"],
    security: ["This entry is local roadmap content and does not inspect tabs, page contents, or account data.", "呢個項目係本機路線圖內容，唔會檢查分頁、頁面內容或者帳戶資料。"],
    verification: ["Treat the status as an open gap until the full keyboard, accessibility, persistence, and narrow-layout contract has real artifact evidence.", "未有完整鍵盤、無障礙、保存同窄版 layout 嘅真實 artifact 證據前，狀態保持未完成。"],
  },
  "design/GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md#gm-10": {
    behavior: ["Installed-editor discovery, selection, persistence, and opening a folder or file remain an open integration gap.", "已安裝編輯器探索、選擇、保存同開啟資料夾或檔案仍係未完成整合缺口。"],
    configuration: ["The dated audit article is the local source of truth for the missing external-editor surface.", "有日期嘅 audit 文章係缺少外部編輯器介面嘅本機真相來源。"],
    failure: ["No editor found must degrade with a clear local message; silently dropping the chosen file or folder is not acceptable.", "搵唔到編輯器要清楚本機提示；靜靜丟低揀咗嘅檔案或資料夾係唔可以接受。"],
    security: ["The guide does not launch processes, inspect installed applications, or read project files.", "指南唔會啟動程序、檢查已安裝程式或者讀取 project files。"],
    verification: ["Keep this as an open gap until editor detection, persisted choice, keyboard access, and graceful failure are verified on the built app.", "要等 built app 驗證編輯器偵測、保存選擇、鍵盤操作同優雅失敗後，先可以移除未完成狀態。"],
  },
  "design/features/runtime/local-history.md": {
    behavior: ["History renders append-only local revisions, composes action/date/search filters, and records restore as a new revision.", "歷史顯示只加不改本機版本，組合 action／日期／搜尋篩選，還原亦會新增版本。"],
    configuration: ["Settings and history use separate local-storage namespaces, bounded to the newest 100 preview rows.", "設定同歷史用分開嘅 local-storage namespace，預覽歷史最多保留最新 100 行。"],
    failure: ["Unavailable storage keeps fixture rows usable, and a failed history write never fails the setting or restore operation.", "儲存唔得時 fixture 行仍可用，歷史寫入失敗亦唔會令設定或還原操作失敗。"],
    security: ["Preview rows are fixture descriptions only; production history must preserve encryption and stable authenticated-data binding.", "預覽行只係 fixture 描述；production history 必須保留加密同穩定 authenticated-data binding。"],
    verification: ["The browser contract covers seeded rows, derived filters, restore labeling, and export while the real Git-backed store remains open.", "browser contract 覆蓋 seeded rows、衍生篩選、還原標籤同匯出，真正 Git-backed store 仍未完成。"],
  },
  "design/features/runtime/changelog-viewer.md": {
    behavior: ["Changelog renders factual version/date/category entries with local search, date filters, copy, and Markdown export.", "更新記錄顯示事實版本／日期／類別項目，支援本機搜尋、日期篩選、複製同 Markdown 匯出。"],
    configuration: ["Entries are local data until release metadata is connected; export reflects the active search and date range.", "release metadata 未接駁前，項目係本機資料；匯出會跟足目前搜尋同日期範圍。"],
    failure: ["Invalid regex, empty filters, clipboard denial, and download failure remain honest non-blocking states.", "無效 regex、空結果篩選、剪貼簿拒絕同下載失敗都會保持誠實嘅非阻塞狀態。"],
    security: ["The viewer reads bundled release data only and exports the currently visible selection.", "檢視器只讀取打包 release data，匯出亦只包含目前可見選擇。"],
    verification: ["Search, live counts, labelled dates, and export are covered by the preview checks; final visual sign-off needs the packaged artifact.", "搜尋、即時數量、有標籤日期同匯出由預覽檢查覆蓋；最終視覺簽核要 packaged artifact。"],
  },
  "design/features/runtime/narrator.md": {
    behavior: ["The optional narrator is off by default, serializes English/Cantonese speech, replaces pending lines, and uses a cooldown.", "可選旁白預設關閉，串行播放英文／廣東話，替換排緊隊文字，並有 cooldown。"],
    configuration: ["Narrator opt-in and language are persisted locally; platform speech synthesis receives only locally rendered event text.", "旁白開關同語言保存喺本機；平台 speech synthesis 只收到本機顯示嘅事件文字。"],
    failure: ["Unavailable speech leaves visual notifications usable, and speech errors never block settings or notifications.", "語音不可用時視覺通知仍然可用，語音錯誤亦唔會阻塞設定或通知。"],
    security: ["No remote speech service or audio persistence is used by the preview foundation.", "預覽基礎唔會用遠端語音服務或者保存音訊。"],
    verification: ["Static checks cover queue and configuration boundaries; screen-reader ducking, quiet hours, and real voice selection remain open.", "靜態檢查覆蓋 queue 同設定界線；screen-reader ducking、quiet hours 同真實聲音選擇仍未完成。"],
  },
  "design/A11Y-L10N-AUDIT.md": {
    behavior: ["The audit tracks focus, roles, contrast, reduced motion, CJK fallback, and bilingual narrow-layout evidence for the preview.", "audit 追蹤預覽嘅焦點、角色、對比度、減少動畫、CJK fallback 同窄版雙語證據。"],
    configuration: ["English, Hong Kong Cantonese, and bilingual labels are selected through the persisted preview language mode.", "英文、香港廣東話同雙語標籤由保存嘅預覽語言模式選擇。"],
    failure: ["Static presence of a label or role does not prove usable focus order, contrast, or built-artifact rendering.", "靜態存在標籤或角色唔代表焦點順序、對比度或者 built-artifact rendering 一定好用。"],
    security: ["The audit is local evidence and does not transmit user content or collect telemetry.", "audit 係本機證據，唔會傳送用戶內容或者收集 telemetry。"],
    verification: ["Use the focused static checks plus keyboard and built-artifact captures before calling accessibility sign-off complete.", "完成無障礙簽核前，要用 focused static checks 加鍵盤同 built-artifact captures。"],
  },
  "design/evidence/manifest.json": {
    behavior: ["The evidence manifest records source SHA, tests, release state, screenshots, and explicit boundaries for each wave.", "evidence manifest 記錄每個 wave 嘅 source SHA、tests、release 狀態、截圖同清楚界線。"],
    configuration: ["The guide shows this manifest as a local source path; it does not convert queued or stale CI into a green result.", "指南將 manifest 當本機來源路徑；唔會將排緊隊或者過期 CI 變成綠燈結果。"],
    failure: ["A mismatched tag, source SHA, installer, or capture keeps the evidence boundary open until corrected.", "tag、source SHA、installer 或 capture 對唔上時，證據界線會保持未完成直到修正。"],
    security: ["The manifest contains verification metadata, not account content, credentials, or private runtime data.", "manifest 只含驗證 metadata，唔含帳戶內容、憑證或者私有 runtime data。"],
    verification: ["Read exact SHA and artifact state together; static contracts and queued workflows are not installer or runtime proof.", "要一齊睇 exact SHA 同 artifact 狀態；static contract 同排緊隊 workflow 唔係 installer 或 runtime 證據。"],
  },
});
const CHANGELOG = Object.freeze([
  { version: "155.0a1", date: "2026-07-31", tag: "Added", title: ["Evidence-first Material workspace", "以證據先行嘅 Material 工作區"], items: [["Packaged Material Mail preview with six browser-style pages.", "打包 Material Mail 預覽，提供六個瀏覽器式頁面。"], ["Persisted language, tone, appearance, narrator, and dim-sum controls.", "保存語言、語氣、外觀、旁白同點心控制。"]] },
  { version: "155.0a1", date: "2026-07-29", tag: "Verified", title: ["M3 evidence capture", "M3 證據擷取"], items: [["Recorded genuine hosted and headless captures with explicit boundaries.", "記錄真實 hosted 同 headless 擷取，清楚寫明驗證邊界。"]] },
  { version: "155.0a1", date: "2026-07-24", tag: "Added", title: ["Regex builder foundation", "正規表達式建立器基礎"], items: [["Added bounded local evaluation, guided tokens, flags, captures, copy, and export.", "加入有界本機評估、引導符號、旗標、捕獲組、複製同匯出。"]] },
]);
const HISTORY_SEED = Object.freeze([
  { id: "seed-3", date: "2026-07-31", action: "settings changed", title: ["Changed preview language to English", "將預覽語言改為英文"], detail: ["The selected language mode was persisted locally.", "已將選取嘅語言模式保存到本機。"] },
  { id: "seed-2", date: "2026-07-30", action: "created", title: ["Created Material Mail preview", "建立 Material Mail 預覽"], detail: ["The six-page preview was added to the packaged content surface.", "六頁預覽已加入打包內容頁面。"] },
  { id: "seed-1", date: "2026-07-29", action: "restored", title: ["Restored relaxed density", "還原寬鬆密度"], detail: ["Restoring is recorded as a new revision; history stays append-only.", "還原會記錄成新版本，歷史保持只加不改。"] },
]);
const NOTIFICATION_SEED = Object.freeze([
  { id: "installer", kind: "success", unread: false, title: ["Installer verified", "安裝檔已驗證"], detail: ["The current published build has a real downloadable installer.", "目前公開 build 有真實可下載安裝檔。"] },
  { id: "browser-proof", kind: "info", unread: true, title: ["Browser proof has a known boundary", "Browser 證據有已知邊界"], detail: ["The authored Material test is recorded separately from remaining legacy-suite failures.", "authored Material test 同其餘 legacy suite failure 分開記錄。"] },
  { id: "release-queue", kind: "warning", unread: true, title: ["Release workflow is queued", "Release workflow 排緊隊"], detail: ["The installer is public only when the release asset exists; queued CI is not called green.", "只有 release asset 存在先叫公開；排緊隊嘅 CI 唔會扮綠燈。"] },
]);
const APPEARANCE_KEY = "mail.material.preview.appearance";

let settings = { ...DEFAULTS };
let historyRecords = [];
let notificationRecords = [];
let notificationFilter = "all";
let appearanceOverrides = {};
let appearanceTarget = null;
let narratorQueue = [];
let narratorBusy = false;
let narratorLastAt = 0;
function ensureSettingsCustomization() {
  if (document.getElementById("mm-accent")) return;
  const host = document.querySelector(".mm-settings-grid");
  const card = document.createElement("section");
  card.className = "mm-card mm-settings-card mm-appearance-controls";
  card.dataset.settingsSurface = "accent seed font family scale weight";
  card.innerHTML = `<h3 data-l10n-id="material-mail-appearance-customization">Live typography and seed</h3><label><span data-l10n-id="material-mail-accent">Accent seed</span><select id="mm-accent"><option value="purple" data-l10n-id="material-mail-accent-purple">Purple</option><option value="blue" data-l10n-id="material-mail-accent-blue">Blue</option><option value="green" data-l10n-id="material-mail-accent-green">Green</option><option value="orange" data-l10n-id="material-mail-accent-orange">Orange</option></select></label><label><span data-l10n-id="material-mail-font-family">Interface font</span><select id="mm-font-family"><option value="Segoe UI">Segoe UI</option><option value="Cascadia Code">Cascadia Code</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option></select></label><label><span data-l10n-id="material-mail-font-scale">Font scale</span><input id="mm-font-scale" type="range" min="90" max="125" value="100" /><output id="mm-font-scale-value">100%</output></label><label><span data-l10n-id="material-mail-font-weight">Font weight</span><input id="mm-font-weight" type="range" min="400" max="700" step="100" value="400" /><output id="mm-font-weight-value">400</output></label>`;
  host.append(card);
  const funnyPreview = document.createElement("p");
  funnyPreview.id = "mm-funny-preview";
  funnyPreview.className = "mm-supporting";
  funnyPreview.setAttribute("aria-live", "polite");
  funnyPreview.textContent = "Settings saved.";
  card.append(funnyPreview);
  document.l10n?.translateFragment?.(card);
}
function ensureToolsGuide() {
  if (document.getElementById("mm-tools-search")) return;
  const page = document.getElementById("mm-page-tools");
  const anchor = page?.querySelector(".mm-tools-card");
  if (!page || !anchor) return;
  const guide = document.createElement("section");
  guide.className = "mm-card mm-guide-card";
  guide.dataset.settingsSurface = "landing documentation feature guide roadmap evidence";
  guide.innerHTML = `<div class="mm-card-heading"><div><h3 data-l10n-id="material-mail-guide-heading">Feature guide</h3><p class="mm-supporting" data-l10n-id="material-mail-guide-note">Design-folder index with honest runtime boundaries.</p></div><span class="mm-filter-chip" id="mm-guide-count"></span></div><div class="mm-search-row mm-page-search-row"><label class="mm-search-field" for="mm-tools-search"><span aria-hidden="true">⌕</span><input id="mm-tools-search" type="search" data-l10n-id="material-mail-search-guide-placeholder" placeholder="Search the feature guide" /><button class="mm-tonal-button mm-regex-button" id="mm-tools-regex-open" type="button" data-l10n-id="material-mail-regex-builder">Regex builder</button></label><div id="mm-tools-regex-panel" hidden="hidden"></div></div><div id="mm-guide-list" class="mm-guide-list" aria-live="polite"></div>`;
  page.insertBefore(guide, anchor);
  document.l10n?.translateFragment?.(guide);
}
const searchState = Object.create(null);
const historyActionSelection = new Set();

function text(value) { return value == null ? "" : String(value); }
function escapeHtml(value) { return text(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function pick(pair) {
  if (settings.language === "zh") return pair[1];
  if (settings.language === "both") return `${pair[0]} · ${pair[1]}`;
  return pair[0];
}
function tone(pair) {
  const enLevel = Math.max(1, Math.min(5, Number(settings.funnyEn) || 1));
  const zhLevel = Math.max(1, Math.min(5, Number(settings.funnyZh) || 1));
  const english = `${pair[0]}${FUNNY_EN[enLevel - 1]}`;
  const cantonese = `${pair[1]}${FUNNY_ZH[zhLevel - 1]}`;
  if (settings.language === "zh") return cantonese;
  if (settings.language === "both") return `${english} · ${cantonese}`;
  return english;
}
function drainNarrator() {
  if (narratorBusy || !narratorQueue.length || !settings.narrator || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  narratorBusy = true;
  const pair = narratorQueue.shift();
  const lines = settings.narratorLanguage === "zh" ? [[pair[1], "zh-HK"]] : settings.narratorLanguage === "both" ? [[pair[0], "en-US"], [pair[1], "zh-HK"]] : [[pair[0], "en-US"]];
  const speakNext = () => { const next = lines.shift(); if (!next) { narratorBusy = false; drainNarrator(); return; } const utterance = new SpeechSynthesisUtterance(next[0]); utterance.lang = next[1]; utterance.onend = speakNext; utterance.onerror = speakNext; window.speechSynthesis.speak(utterance); };
  speakNext();
}
function speakPair(pair) {
  if (!settings.narrator || Date.now() - narratorLastAt < 1200 || !window.speechSynthesis) return;
  narratorLastAt = Date.now(); narratorQueue = [pair]; drainNarrator();
}
function readSettings() {
  try { settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch (error) { console.warn("Material preview preferences unavailable", error); }
}
function readHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null");
    historyRecords = Array.isArray(stored) && stored.length ? stored : [...HISTORY_SEED];
  } catch (error) { historyRecords = [...HISTORY_SEED]; }
  for (const action of new Set(historyRecords.map(row => row.action))) historyActionSelection.add(action);
}
function readNotifications() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "null");
    notificationRecords = Array.isArray(stored) && stored.length ? stored : [...NOTIFICATION_SEED];
  } catch (error) { notificationRecords = [...NOTIFICATION_SEED]; }
}
function readAppearance() { try { appearanceOverrides = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || "{}"); } catch (error) { appearanceOverrides = {}; } }
function saveAppearance() { try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearanceOverrides)); } catch (error) { showToast("Appearance could not be persisted locally."); } }
function saveNotifications() { try { localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notificationRecords)); } catch (error) { /* Notification history remains usable. */ } }
function saveHistory() { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRecords.slice(0, 100))); } catch (error) { /* History never blocks the user operation. */ } }
function recordRevision(action, title, detail) {
  const next = { id: `revision-${Date.now()}`, date: new Date().toISOString().slice(0, 10), action, title, detail };
  historyRecords.unshift(next);
  historyActionSelection.add(action);
  saveHistory();
  renderHistoryActions();
  renderHistory();
  renderNotifications();
}
function saveSettings(reason = null) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (error) { showToast("Preferences could not be persisted locally."); }
  if (reason) recordRevision("settings changed", reason, ["The setting change was recorded locally.", "設定變更已記錄到本機。"]);
}
function showToast(message) {
  const toast = document.getElementById("mm-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toast.hidden = true), 3500);
  speakPair([message, message]);
}
function applySettings() {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.density = settings.density;
  document.documentElement.dataset.language = settings.language;
  const accent = ACCENTS[settings.accent] || ACCENTS.purple;
  document.documentElement.style.setProperty("--mm-primary", accent[0]);
  document.documentElement.style.setProperty("--mm-primary-container", accent[1]);
  document.documentElement.style.setProperty("--mm-on-primary-container", accent[2]);
  document.documentElement.style.setProperty("--m3-font-family", settings.fontFamily || "Segoe UI");
  document.documentElement.style.fontSize = `${settings.fontScale || 100}%`;
  document.documentElement.style.setProperty("--mm-font-weight", settings.fontWeight || 400);
  for (const [id, value] of [["mm-theme", settings.theme], ["mm-density", settings.density], ["mm-language", settings.language], ["mm-funny-en", settings.funnyEn], ["mm-funny-zh", settings.funnyZh]]) document.getElementById(id).value = value;
  for (const [id, value] of [["mm-funny-en-value", settings.funnyEn], ["mm-funny-zh-value", settings.funnyZh]]) { document.getElementById(id).value = value; document.getElementById(id).textContent = value; }
  document.getElementById("mm-narrator").checked = settings.narrator;
  document.getElementById("mm-dimsum").checked = settings.dimsum;
  document.getElementById("mm-narrator-language").value = settings.narratorLanguage;
  document.getElementById("mm-accent").value = settings.accent || "purple";
  document.getElementById("mm-font-family").value = settings.fontFamily || "Segoe UI";
  document.getElementById("mm-font-scale").value = settings.fontScale || 100;
  document.getElementById("mm-font-scale-value").textContent = `${settings.fontScale || 100}%`;
  document.getElementById("mm-font-weight").value = settings.fontWeight || 400;
  document.getElementById("mm-font-weight-value").textContent = settings.fontWeight || 400;
  const funnyPreview = document.getElementById("mm-funny-preview");
  if (funnyPreview) funnyPreview.textContent = tone(["Settings saved.", "設定已儲存。"]);
  document.querySelectorAll(".mm-secondary").forEach(node => (node.hidden = settings.language === "en"));
  filterSettings();
  renderChangelog();
  renderHistory();
  renderGuide();
}
function bindSettings() {
  const bind = (id, key, transform = value => value, reason = null) => {
    for (const eventName of ["input", "change"]) document.getElementById(id).addEventListener(eventName, event => { const next = transform(event.target.value); if (settings[key] === next) return; settings[key] = next; saveSettings(reason || [`${key} changed`, `${key} 已變更`]); applySettings(); });
  };
  bind("mm-theme", "theme", value => value, ["Changed preview theme", "改變預覽主題"]);
  bind("mm-density", "density", value => value, ["Changed preview density", "改變預覽密度"]);
  bind("mm-language", "language", value => value, ["Changed preview language", "改變預覽語言"]);
  bind("mm-funny-en", "funnyEn", Number, ["Changed English funny level", "改變英文幽默等級"]);
  bind("mm-funny-zh", "funnyZh", Number, ["Changed Cantonese funny level", "改變廣東話幽默等級"]);
  bind("mm-narrator-language", "narratorLanguage", value => value, ["Changed narrator language", "改變旁白語言"]);
  bind("mm-accent", "accent", value => value, ["Changed accent seed", "改變強調色種子"]);
  bind("mm-font-family", "fontFamily", value => value, ["Changed interface font", "改變介面字體"]);
  bind("mm-font-scale", "fontScale", Number, ["Changed font scale", "改變字體比例"]);
  bind("mm-font-weight", "fontWeight", Number, ["Changed font weight", "改變字重"]);
  for (const [id, key, reason] of [["mm-narrator", "narrator", ["Changed narrator preference", "改變旁白偏好"]], ["mm-dimsum", "dimsum", ["Changed dim-sum preference", "改變點心偏好"]]]) document.getElementById(id).addEventListener("change", event => { settings[key] = event.target.checked; saveSettings(reason); applySettings(); if (key === "narrator" && settings.narrator) speakPair(["Narrator enabled", "旁白已啟用"]); });
  document.getElementById("mm-reset").addEventListener("click", () => { settings = { ...DEFAULTS }; saveSettings(["Reset preview preferences", "重設預覽偏好"]); applySettings(); showToast("Preview preferences reset · 預覽偏好已重設"); });
  document.getElementById("mm-theme-toggle").addEventListener("click", () => { settings.theme = settings.theme === "light" ? "dark" : "light"; saveSettings(["Toggled preview theme", "切換預覽主題"]); applySettings(); });
}
function selectPage(page) {
  document.querySelectorAll(".mm-tab").forEach(tab => { const selected = tab.dataset.page === page; tab.classList.toggle("is-selected", selected); tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1; });
  document.querySelectorAll(".mm-page").forEach(panel => { const selected = panel.id === `mm-page-${page}`; panel.classList.toggle("is-visible", selected); panel.hidden = !selected; });
}
function bindTabs() {
  const tabs = [...document.querySelectorAll(".mm-tab")];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectPage(tab.dataset.page));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus(); selectPage(tabs[next].dataset.page);
    });
  });
}
function setSearch(id, state) { searchState[id] = { mode: state.mode === "regex" ? "regex" : "plain", query: text(state.query), pattern: text(state.pattern), flags: text(state.flags) }; }
function searchMatches(id, haystack) {
  const state = searchState[id] || { mode: "plain", query: "" };
  const query = state.mode === "regex" ? state.pattern : state.query;
  if (!query) return true;
  if (query.length > 512) return false;
  if (state.mode === "regex") { try { return new RegExp(query, state.flags).test(haystack); } catch (error) { return false; } }
  return haystack.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}
function filterSettings() {
  const query = searchState.settings?.query || "";
  document.querySelectorAll("[data-settings-surface]").forEach(surface => { surface.hidden = Boolean(query) && !searchMatches("settings", `${surface.dataset.settingsSurface} ${surface.textContent}`); });
}
function filterAppearance() {
  const query = searchState.appearance?.query || "";
  const editor = document.getElementById("mm-appearance-editor");
  editor?.querySelectorAll("label, .mm-color-picker").forEach(surface => { surface.hidden = Boolean(query) && !searchMatches("appearance", surface.textContent); });
}
let guideDetailsAnchor = null;
function positionGuideDetails() {
  const surface = document.getElementById("mm-feature-details");
  if (!surface || surface.hidden || !guideDetailsAnchor?.isConnected) return;
  const anchor = guideDetailsAnchor.getBoundingClientRect();
  const margin = 12;
  const gap = 8;
  const width = surface.getBoundingClientRect().width;
  const height = surface.getBoundingClientRect().height;
  const left = Math.max(margin, Math.min(anchor.left, innerWidth - width - margin));
  const below = anchor.bottom + gap;
  const top = below + height <= innerHeight - margin ? below : Math.max(margin, anchor.top - height - gap);
  surface.style.left = `${left}px`;
  surface.style.top = `${top}px`;
}
function closeGuideDetails(returnFocus = true) {
  const surface = document.getElementById("mm-feature-details");
  if (!surface || surface.hidden) return;
  const target = guideDetailsAnchor;
  surface.hidden = true;
  guideDetailsAnchor = null;
  if (returnFocus && target?.isConnected) target.focus();
}
function openGuideDetails(index, anchor) {
  const feature = FEATURE_GUIDE[Number(index)];
  const article = feature && FEATURE_ARTICLES[feature.article];
  const surface = document.getElementById("mm-feature-details");
  if (!feature || !article || !surface) return;
  guideDetailsAnchor = anchor;
  document.getElementById("mm-feature-details-title").textContent = tone(feature.title);
  document.getElementById("mm-feature-details-status").textContent = pick(feature.status);
  document.getElementById("mm-feature-details-path").textContent = feature.article;
  document.getElementById("mm-feature-details-body").innerHTML = Object.entries(article).map(([key, body]) => {
    const heading = { behavior: ["Behavior", "行為"], configuration: ["Configuration", "設定"], failure: ["Failure modes", "失效情況"], security: ["Security and privacy", "安全同私隱"], verification: ["Verification", "驗證"] }[key];
    return `<section><h3>${escapeHtml(pick(heading))}</h3><p>${escapeHtml(tone(body))}</p></section>`;
  }).join("");
  surface.hidden = false;
  surface.focus();
  requestAnimationFrame(positionGuideDetails);
}
function bindGuideDetails() {
  const surface = document.getElementById("mm-feature-details");
  if (!surface) return;
  document.getElementById("mm-feature-details-close").addEventListener("click", () => closeGuideDetails());
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !surface.hidden && surface.contains(event.target)) {
      event.preventDefault();
      closeGuideDetails();
    }
  });
  window.addEventListener("resize", positionGuideDetails);
  window.addEventListener("scroll", positionGuideDetails, true);
}
function renderGuide() {
  const list = document.getElementById("mm-guide-list");
  if (!list) return;
  closeGuideDetails(false);
  const rows = FEATURE_GUIDE.filter(feature => searchMatches("tools", `${feature.title.join(" ")} ${feature.status.join(" ")} ${feature.summary.join(" ")} ${feature.article}`));
  list.innerHTML = rows.length ? rows.map(feature => { const index = FEATURE_GUIDE.indexOf(feature); return `<article class="mm-guide-entry"><header><h4>${escapeHtml(tone(feature.title))}</h4><span class="mm-filter-chip">${escapeHtml(pick(feature.status))}</span></header><p>${escapeHtml(tone(feature.summary))}</p><code>${escapeHtml(feature.article)}</code><button class="mm-text-button mm-guide-read" type="button" data-guide-article="${index}" aria-label="${escapeHtml(tone([`Read article: ${feature.title[0]}`, `閱讀文章：${feature.title[1]}`]))}">${escapeHtml(pick(["Read article", "閱讀文章"]))}</button></article>`; }).join("") : `<div class="mm-empty-state mm-no-results"><span class="mm-empty-icon" aria-hidden="true">⌕</span><p>${escapeHtml(tone(["No matching guide entries", "搵唔到相符指南項目"]))}</p></div>`;
  list.querySelectorAll("[data-guide-article]").forEach(button => button.addEventListener("click", () => openGuideDetails(button.dataset.guideArticle, button)));
  const count = document.getElementById("mm-guide-count");
  if (count) count.textContent = `${rows.length} / ${FEATURE_GUIDE.length}`;
}
function filterTools() { renderGuide(); }
function dateInRange(date, from, to) { return (!from || date >= from) && (!to || date <= to); }
function changelogRows() {
  const from = document.getElementById("mm-changelog-from").value;
  const to = document.getElementById("mm-changelog-to").value;
  return CHANGELOG.filter(entry => dateInRange(entry.date, from, to) && searchMatches("changelog", `${entry.version} ${entry.date} ${entry.tag} ${entry.title.join(" ")} ${entry.items.flat().join(" ")}`));
}
function renderChangelog() {
  const list = document.getElementById("mm-changelog-list");
  if (!list) return;
  const rows = changelogRows();
  list.innerHTML = rows.length ? rows.map(entry => `<article class="mm-card mm-entry"><header class="mm-entry-header"><div><div class="mm-entry-meta">${escapeHtml(entry.version)} · ${escapeHtml(entry.date)}</div><h3>${escapeHtml(tone(entry.title))}</h3></div><span class="mm-filter-chip">${escapeHtml(entry.tag)}</span></header><ul>${entry.items.map(item => `<li>${escapeHtml(tone(item))}</li>`).join("")}</ul></article>`).join("") : `<div class="mm-card mm-empty-state mm-no-results"><span class="mm-empty-icon" aria-hidden="true">⌕</span><h3>${escapeHtml(tone(["No matching releases", "搵唔到相符版本"]))}</h3><p>${escapeHtml(tone(["Adjust the date range or search text.", "調整日期範圍或者搜尋文字。"]))}</p></div>`;
  document.getElementById("mm-changelog-count").value = `${rows.length} release${rows.length === 1 ? "" : "s"} · ${rows.length} 個版本`;
}
function changelogText(rows = changelogRows()) { return rows.map(entry => [`v${entry.version} · ${entry.date}`, tone(entry.title), ...entry.items.map(tone)].join("\n")).join("\n\n"); }
function historyRows() {
  const from = document.getElementById("mm-history-from").value;
  const to = document.getElementById("mm-history-to").value;
  return historyRecords.filter(row => historyActionSelection.has(row.action) && dateInRange(row.date, from, to) && searchMatches("history", `${row.date} ${row.action} ${row.title.join(" ")} ${row.detail.join(" ")}`));
}
function notificationRows() {
  return notificationRecords.filter(row => (notificationFilter === "all" || (notificationFilter === "unread" && row.unread) || (notificationFilter === "dismissed" && row.dismissed)) && searchMatches("notifications", `${row.title.join(" ")} ${row.detail.join(" ")}`));
}
function renderNotifications() {
  const list = document.getElementById("mm-notification-list");
  if (!list) return;
  const rows = notificationRows();
  list.innerHTML = rows.length ? rows.map(row => `<article class="mm-card mm-notification mm-notification-${escapeHtml(row.kind)}${row.dismissed ? " is-dismissed" : ""}"><span class="mm-notification-icon" aria-hidden="true">${row.kind === "success" ? "✓" : row.kind === "warning" ? "!" : "i"}</span><div><h3>${escapeHtml(tone(row.title))}</h3><p>${escapeHtml(tone(row.detail))}</p>${row.dismissed ? `<small class="mm-notification-state">${escapeHtml(tone(["Dismissed; retained in notification history.", "已收起；仍保留喺通知歷史。 "]))}</small>` : ""}</div>${row.dismissed ? "" : `<button class="mm-icon-button" type="button" data-notification-dismiss="${escapeHtml(row.id)}" data-l10n-id="material-mail-dismiss">×</button>`}</article>`).join("") : `<div class="mm-card mm-empty-state mm-no-results"><span class="mm-empty-icon" aria-hidden="true">i</span><h3>${escapeHtml(tone(["No matching notifications", "搵唔到相符通知"]))}</h3><p>${escapeHtml(tone(["Dismissed messages remain reviewable under Dismissed.", "收起咗嘅訊息仍然可以喺「已收起」度睇返。 "]))}</p></div>`;
  document.getElementById("mm-notification-count").value = `${rows.length} notification${rows.length === 1 ? "" : "s"} · ${rows.length} 個通知`;
  list.querySelectorAll("[data-notification-dismiss]").forEach(button => button.addEventListener("click", () => { const row = notificationRecords.find(item => item.id === button.dataset.notificationDismiss); if (!row) return; row.dismissed = true; row.unread = false; saveNotifications(); renderNotifications(); showToast("Notification dismissed and retained · 通知已收起但保留"); }));
}
function renderHistoryActions() {
  const container = document.getElementById("mm-history-actions");
  if (!container) return;
  const counts = new Map();
  historyRecords.forEach(row => counts.set(row.action, (counts.get(row.action) || 0) + 1));
  container.innerHTML = [...counts].sort().map(([action, count]) => `<label class="mm-action-option"><input type="checkbox" data-history-action="${escapeHtml(action)}" ${historyActionSelection.has(action) ? "checked" : ""} /><span>${escapeHtml(action)} (${count})</span></label>`).join("");
  container.querySelectorAll("[data-history-action]").forEach(input => input.addEventListener("change", event => { const action = event.target.dataset.historyAction; event.target.checked ? historyActionSelection.add(action) : historyActionSelection.delete(action); renderHistory(); }));
}
function renderHistory() {
  const list = document.getElementById("mm-history-list");
  if (!list) return;
  const rows = historyRows();
  list.innerHTML = rows.length ? rows.map(row => `<article class="mm-card mm-entry mm-history-row"><div class="mm-history-icon" aria-hidden="true">↺</div><div><div class="mm-entry-meta">${escapeHtml(row.date)} · ${escapeHtml(row.action)}</div><h3>${escapeHtml(tone(row.title))}</h3><p>${escapeHtml(tone(row.detail))}</p></div><button class="mm-text-button" type="button" data-history-restore="${escapeHtml(row.id)}" data-l10n-id="material-mail-restore">Restore</button></article>`).join("") : `<div class="mm-card mm-empty-state mm-no-results"><span class="mm-empty-icon" aria-hidden="true">◷</span><h3>${escapeHtml(tone(["No matching revisions", "搵唔到相符版本"]))}</h3><p>${escapeHtml(tone(["The active filters returned no history records.", "目前篩選冇搵到歷史記錄。 "]))}</p></div>`;
  document.getElementById("mm-history-count").value = `${rows.length} revision${rows.length === 1 ? "" : "s"} · ${rows.length} 個版本`;
  list.querySelectorAll("[data-history-restore]").forEach(button => button.addEventListener("click", () => { recordRevision("restored", ["Restored a preview revision", "還原預覽版本"], ["The restore was recorded as a new append-only revision.", "還原已記錄成新嘅只加不改版本。"]); showToast("Revision restored and recorded · 版本已還原並記錄"); }));
}
function downloadText(filename, content, type = "text/plain") { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
async function copyText(content, message) { try { await navigator.clipboard.writeText(content); showToast(message); } catch (error) { showToast("Clipboard permission unavailable · 剪貼簿權限不可用"); } }
function bindDataSurfaces() {
  for (const [id, key, render] of [["mm-settings-search", "settings", filterSettings], ["mm-changelog-search", "changelog", renderChangelog], ["mm-history-search", "history", renderHistory], ["mm-notifications-search", "notifications", renderNotifications], ["mm-appearance-search", "appearance", filterAppearance], ["mm-tools-search", "tools", filterTools]]) { const input = document.getElementById(id); setSearch(key, { mode: "plain", query: "" }); input.addEventListener("input", () => { setSearch(key, { mode: "plain", query: input.value }); render(); }); }
  for (const id of ["mm-changelog-from", "mm-changelog-to", "mm-history-from", "mm-history-to"]) document.getElementById(id).addEventListener("change", () => id.startsWith("mm-changelog") ? renderChangelog() : renderHistory());
  document.getElementById("mm-changelog-preset").addEventListener("change", event => { const latest = CHANGELOG[0].date; const now = new Date(); const today = now.toISOString().slice(0, 10); const month = `${today.slice(0, 7)}-01`; const from = document.getElementById("mm-changelog-from"); const to = document.getElementById("mm-changelog-to"); if (event.target.value === "all") { from.value = ""; to.value = ""; } else if (event.target.value === "latest") { from.value = latest; to.value = latest; } else { from.value = month; to.value = today; } renderChangelog(); });
  document.getElementById("mm-changelog-copy").addEventListener("click", () => copyText(changelogText(), "Changelog copied · 更新記錄已複製"));
  document.getElementById("mm-changelog-export").addEventListener("click", () => { downloadText("material-mail-changelog.md", `# Material Mail changelog\n\n${changelogText()}\n`, "text/markdown"); showToast("Changelog exported · 更新記錄已匯出"); });
  document.getElementById("mm-history-export").addEventListener("click", () => { const content = historyRows().map(row => `${row.date} · ${row.action}\n${tone(row.title)}\n${tone(row.detail)}`).join("\n\n"); downloadText("material-mail-history.txt", `Material Mail local history\n\n${content}\n`); showToast("History exported · 歷史已匯出"); });
  document.getElementById("mm-notifications-filter").addEventListener("change", event => { notificationFilter = event.target.value; renderNotifications(); });
  renderHistoryActions();
  renderGuide();
}
function maybeShowDimsum() {
  if (!settings.dimsum || !settings.hasLaunched || Math.random() >= 0.01) return;
  const surprise = document.getElementById("mm-dimsum-surprise");
  surprise.hidden = false;
  document.getElementById("mm-dimsum-dismiss").addEventListener("click", () => { surprise.hidden = true; });
}
function appearanceKey(target) {
  if (!target.dataset.appearanceKey) target.dataset.appearanceKey = target.id || `element-${[...document.querySelectorAll(".mm-card, .mm-tab, .mm-appbar, .mm-search-field")].indexOf(target)}`;
  return target.dataset.appearanceKey;
}
function hexFromCss(value, fallback) { const match = text(value).match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i); if (match) return `#${[match[1], match[2], match[3]].map(part => Number(part).toString(16).padStart(2, "0")).join("")}`; return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function applyAppearance(target) {
  const value = appearanceOverrides[appearanceKey(target)];
  if (!value) return;
  for (const [name, cssValue] of Object.entries(value)) target.style.setProperty(name, cssValue);
}
function applyAllAppearance() { document.querySelectorAll(".mm-card, .mm-tab, .mm-appbar, .mm-search-field").forEach(applyAppearance); }
function openAppearance(target, x = 24, y = 24) {
  appearanceTarget = target;
  target.classList.add("mm-appearance-target");
  const key = appearanceKey(target);
  const value = appearanceOverrides[key] || {};
  const computed = getComputedStyle(target);
  const surface = hexFromCss(value["--mm-custom-bg"] || computed.backgroundColor, "#f3edf7");
  const foreground = hexFromCss(value["--mm-custom-fg"] || computed.color, "#1d1b20");
  document.getElementById("mm-appearance-target").textContent = `${target.id || target.className} · ${key}`;
  document.getElementById("mm-appearance-surface").value = surface; document.getElementById("mm-appearance-surface-text").value = surface;
  document.getElementById("mm-appearance-text").value = foreground; document.getElementById("mm-appearance-text-text").value = foreground;
  document.getElementById("mm-appearance-radius").value = value["--mm-custom-radius"]?.replace("px", "") || 16;
  document.getElementById("mm-appearance-font-size").value = value["--mm-custom-size"]?.replace("px", "") || 14;
  document.getElementById("mm-appearance-weight").value = value["--mm-custom-weight"] || 400;
  document.getElementById("mm-appearance-radius-value").textContent = `${document.getElementById("mm-appearance-radius").value}px`;
  document.getElementById("mm-appearance-font-size-value").textContent = `${document.getElementById("mm-appearance-font-size").value}px`;
  const editor = document.getElementById("mm-appearance-editor"); editor.hidden = false; editor.style.left = `${Math.max(12, Math.min(x, innerWidth - 360))}px`; editor.style.top = `${Math.max(12, Math.min(y, innerHeight - 520))}px`; window.mmAppearanceTarget = target; document.dispatchEvent(new CustomEvent("mm-appearance-opened", { detail: { target } }));
  document.getElementById("mm-appearance-surface").focus();
}
function updateAppearance(name, value, textId = null) { if (!appearanceTarget) return; const key = appearanceKey(appearanceTarget); appearanceOverrides[key] = { ...(appearanceOverrides[key] || {}), [name]: value }; appearanceTarget.style.setProperty(name, value); saveAppearance(); if (textId) document.getElementById(textId).value = value; }
window.mmUpdateAppearanceColor = (role, value) => updateAppearance(role === "text" ? "--mm-custom-fg" : "--mm-custom-bg", value);
function bindAppearance() {
  const editor = document.getElementById("mm-appearance-editor");
  document.addEventListener("contextmenu", event => { const target = event.target.closest(".mm-card, .mm-tab, .mm-appbar, .mm-search-field"); if (!target || editor.contains(target)) return; event.preventDefault(); openAppearance(target, event.clientX, event.clientY); });
  document.addEventListener("keydown", event => { if (event.key !== "F10" || !event.shiftKey) return; const target = event.target.closest?.(".mm-card, .mm-tab, .mm-appbar, .mm-search-field"); if (!target) return; event.preventDefault(); const rect = target.getBoundingClientRect(); openAppearance(target, rect.left, rect.bottom + 8); });
  document.getElementById("mm-appearance-close").addEventListener("click", () => { editor.hidden = true; appearanceTarget?.focus?.(); window.mmAppearanceTarget = null; });
  for (const [id, name, textId] of [["mm-appearance-surface", "--mm-custom-bg", "mm-appearance-surface-text"], ["mm-appearance-text", "--mm-custom-fg", "mm-appearance-text-text"]]) document.getElementById(id).addEventListener("input", event => { updateAppearance(name, event.target.value); document.getElementById(textId).value = event.target.value; });
  for (const [id, name, output] of [["mm-appearance-radius", "--mm-custom-radius", "mm-appearance-radius-value"], ["mm-appearance-font-size", "--mm-custom-size", "mm-appearance-font-size-value"]]) document.getElementById(id).addEventListener("input", event => { updateAppearance(name, `${event.target.value}px`); document.getElementById(output).textContent = `${event.target.value}px`; });
  document.getElementById("mm-appearance-weight").addEventListener("change", event => updateAppearance("--mm-custom-weight", event.target.value));
  for (const [id, colorId, name] of [["mm-appearance-surface-text", "mm-appearance-surface", "--mm-custom-bg"], ["mm-appearance-text-text", "mm-appearance-text", "--mm-custom-fg"]]) document.getElementById(id).addEventListener("change", event => { if (!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(event.target.value)) return; document.getElementById(colorId).value = event.target.value.slice(0, 7); updateAppearance(name, event.target.value); });
  document.getElementById("mm-appearance-reset").addEventListener("click", () => { if (!appearanceTarget) return; const key = appearanceKey(appearanceTarget); delete appearanceOverrides[key]; for (const name of ["--mm-custom-bg", "--mm-custom-fg", "--mm-custom-radius", "--mm-custom-size", "--mm-custom-weight"]) appearanceTarget.style.removeProperty(name); saveAppearance(); openAppearance(appearanceTarget); showToast("Element appearance reset · 元素外觀已重設"); });
  document.getElementById("mm-appearance-reset-all").addEventListener("click", () => { appearanceOverrides = {}; document.querySelectorAll(".mm-card, .mm-tab, .mm-appbar, .mm-search-field").forEach(target => { for (const name of ["--mm-custom-bg", "--mm-custom-fg", "--mm-custom-radius", "--mm-custom-size", "--mm-custom-weight"]) target.style.removeProperty(name); }); saveAppearance(); editor.hidden = true; showToast("All appearance overrides reset · 所有外觀覆寫已重設"); });
  applyAllAppearance();
}
window.mmSetRegexState = (key, state) => { setSearch(key, state); if (key === "settings") filterSettings(); if (key === "appearance") filterAppearance(); if (key === "tools") filterTools(); if (key === "changelog") renderChangelog(); if (key === "history") renderHistory(); if (key === "notifications") renderNotifications(); };
window.mmSearchState = searchState;

document.addEventListener("DOMContentLoaded", () => { readSettings(); readHistory(); readNotifications(); readAppearance(); ensureSettingsCustomization(); ensureToolsGuide(); bindTabs(); bindSettings(); bindDataSurfaces(); bindGuideDetails(); bindAppearance(); applySettings(); const firstLaunch = !settings.hasLaunched; settings.hasLaunched = true; if (firstLaunch) saveSettings(); else maybeShowDimsum(); });
