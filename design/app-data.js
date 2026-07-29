/* Static data for Material Mail. Loaded from the DC helmet; no build step. */
window.MM_DATA = (function () {
  const SEEDS = {
    purple: {
      light: { primary: "#6750A4", onPrimary: "#FFFFFF", pc: "#EADDFF", onPc: "#21005D", sc: "#E8DEF8", onSc: "#1D192B", tc: "#FFD8E4", onTc: "#31111D" },
      dark: { primary: "#D0BCFF", onPrimary: "#381E72", pc: "#4F378B", onPc: "#EADDFF", sc: "#4A4458", onSc: "#E8DEF8", tc: "#633B48", onTc: "#FFD8E4" },
    },
    blue: {
      light: { primary: "#0B57D0", onPrimary: "#FFFFFF", pc: "#D3E3FD", onPc: "#041E49", sc: "#DBE2F9", onSc: "#131C2B", tc: "#C2E7FF", onTc: "#001D35" },
      dark: { primary: "#A8C7FA", onPrimary: "#062E6F", pc: "#0842A0", onPc: "#D3E3FD", sc: "#3F4759", onSc: "#DBE2F9", tc: "#004A77", onTc: "#C2E7FF" },
    },
    green: {
      light: { primary: "#146C2E", onPrimary: "#FFFFFF", pc: "#C4EED0", onPc: "#072711", sc: "#DCE5DC", onSc: "#131F14", tc: "#CFE7EC", onTc: "#051F23" },
      dark: { primary: "#6DD58C", onPrimary: "#0A3818", pc: "#0F5223", onPc: "#C4EED0", sc: "#3F4A3F", onSc: "#DCE5DC", tc: "#334B4F", onTc: "#CFE7EC" },
    },
    orange: {
      light: { primary: "#8C4A00", onPrimary: "#FFFFFF", pc: "#FFDCC2", onPc: "#2E1500", sc: "#F5DFD0", onSc: "#241A12", tc: "#FFDEA6", onTc: "#261A00" },
      dark: { primary: "#FFB77C", onPrimary: "#4A2500", pc: "#6A3600", onPc: "#FFDCC2", sc: "#53443A", onSc: "#F5DFD0", tc: "#584400", onTc: "#FFDEA6" },
    },
  };

  const NEUTRALS = {
    light: { surface: "#FEF7FF", s1: "#FFFFFF", s2: "#F7F2FA", s3: "#F3EDF7", s4: "#ECE6F0", s5: "#E6E0E9", onSurface: "#1D1B20", onSurfaceVariant: "#49454F", outline: "#79747E", outlineVariant: "#CAC4D0", inverse: "#322F35", onInverse: "#F5EFF7", error: "#B3261E", errorContainer: "#F9DEDC", onErrorContainer: "#410E0B" },
    dark: { surface: "#141218", s1: "#0F0D13", s2: "#1D1B20", s3: "#211F26", s4: "#2B2930", s5: "#36343B", onSurface: "#E6E0E9", onSurfaceVariant: "#CAC4D0", outline: "#938F99", outlineVariant: "#49454F", inverse: "#E6E0E9", onInverse: "#322F35", error: "#F2B8B5", errorContainer: "#8C1D18", onErrorContainer: "#F9DEDC" },
  };

  const FONTS = {
    roboto: "Roboto, 'Roboto Flex', system-ui, sans-serif",
    notohk: "'Noto Sans HK', Roboto, system-ui, sans-serif",
    system: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
  };

  const DENSITY = {
    compact: { row: "8px 8px 8px 12px", gap: 1, control: 40, avatar: 32 },
    comfortable: { row: "12px 8px 12px 16px", gap: 2, control: 48, avatar: 40 },
    relaxed: { row: "16px 12px 16px 20px", gap: 4, control: 56, avatar: 44 },
  };

  const FOLDERS = [
    { key: "inbox", icon: "inbox", color: "#6750A4" },
    { key: "drafts", icon: "draft", color: "#7D5260" },
    { key: "sent", icon: "sent", color: "#386A20" },
    { key: "archive", icon: "archive", color: "#8C4A00" },
    { key: "spam", icon: "spam", color: "#B3261E" },
    { key: "trash", icon: "trash", color: "#49454F" },
  ];

  const LABELS = [{ key: "Team", dot: "#6750A4" }, { key: "Invoices", dot: "#386A20" }];

  const TABS = [
    { id: "mail", icon: "mail" },
    { id: "settings", icon: "settings" },
    { id: "changelog", icon: "features" },
    { id: "history", icon: "clock" },
    { id: "notifications", icon: "info" },
  ];

  const DIMSUM = [
    { slug: "har-gow", en: "Shrimp dumpling", zh: "蝦餃" },
    { slug: "siu-mai", en: "Pork siu mai", zh: "燒賣" },
    { slug: "char-siu-bao", en: "BBQ pork bun", zh: "叉燒包" },
    { slug: "cheung-fun", en: "Rice noodle roll", zh: "腸粉" },
    { slug: "lo-mai-gai", en: "Sticky rice in lotus leaf", zh: "糯米雞" },
    { slug: "dan-tat", en: "Egg tart", zh: "蛋撻" },
  ];

  const LABEL_COPY = {
    appTitle: { en: "Material Mail", zh: "Material 郵件" },
    mail: { en: "Mail", zh: "郵件" },
    settings: { en: "Settings", zh: "設定" },
    changelog: { en: "Changelog", zh: "更新記錄" },
    history: { en: "Version history", zh: "版本記錄" },
    notifications: { en: "Notifications", zh: "通知中心" },
    inbox: { en: "Inbox", zh: "收件匣" },
    drafts: { en: "Drafts", zh: "草稿" },
    sent: { en: "Sent", zh: "寄件備份" },
    archive: { en: "Archive", zh: "存檔" },
    spam: { en: "Spam", zh: "垃圾郵件" },
    trash: { en: "Trash", zh: "垃圾桶" },
    labels: { en: "Labels", zh: "標籤" },
    folders: { en: "Folders", zh: "資料夾" },
    compose: { en: "Compose", zh: "寫郵件" },
    reply: { en: "Reply", zh: "回覆" },
    replyAll: { en: "Reply all", zh: "全部回覆" },
    forward: { en: "Forward", zh: "轉寄" },
    star: { en: "Star", zh: "星標" },
    close: { en: "Close", zh: "關閉" },
    clear: { en: "Clear", zh: "清除" },
    cancel: { en: "Cancel", zh: "取消" },
    discard: { en: "Discard", zh: "唔要" },
    send: { en: "Send", zh: "寄出" },
    saveDraft: { en: "Save draft", zh: "存草稿" },
    to: { en: "To", zh: "收件人" },
    subject: { en: "Subject", zh: "主旨" },
    message: { en: "Message", zh: "內容" },
    download: { en: "Download", zh: "下載" },
    sort: { en: "Sort", zh: "排序" },
    dismiss: { en: "Dismiss", zh: "唔睇" },
    searchMail: { en: "Search all mail", zh: "搜尋所有郵件" },
    filterList: { en: "Filter this list", zh: "篩選此列表" },
    filterFolders: { en: "Filter folders", zh: "篩選資料夾" },
    searchSettings: { en: "Search settings", zh: "搜尋設定" },
    searchChangelog: { en: "Search changelog", zh: "搜尋更新記錄" },
    searchHistory: { en: "Search revisions", zh: "搜尋版本" },
    searchNotifications: { en: "Search notifications", zh: "搜尋通知" },
    searchTabs: { en: "Search tabs", zh: "搜尋分頁" },
    commandPalette: { en: "Command palette", zh: "指令面板" },
    typeCommand: { en: "Type a command", zh: "輸入指令" },
    moreTabs: { en: "Hidden tab", zh: "隱藏分頁" },
    regexToggle: { en: "Use regular expression", zh: "用正則表達式" },
    openBuilder: { en: "Open regex builder", zh: "開 Regex 產生器" },
    openInEditor: { en: "Open in external editor", zh: "用外部編輯器開" },
    pin: { en: "Pin tab", zh: "釘住分頁" },
    unpin: { en: "Unpin tab", zh: "解除釘住" },
    moveLeft: { en: "Move left", zh: "移左邊" },
    moveRight: { en: "Move right", zh: "移右邊" },
    newest: { en: "Newest first", zh: "最新排先" },
    oldest: { en: "Oldest first", zh: "最舊排先" },
    bySender: { en: "By sender", zh: "按寄件人" },
    unreadFirst: { en: "Unread first", zh: "未讀排先" },
    all: { en: "All", zh: "全部" },
    unread: { en: "Unread", zh: "未讀" },
    starred: { en: "Starred", zh: "有星" },
    hasAttachment: { en: "Has attachment", zh: "有附件" },
    markUnread: { en: "Mark unread", zh: "標為未讀" },
    markSpam: { en: "Mark as spam", zh: "標為垃圾" },
    delete: { en: "Delete", zh: "刪除" },
    print: { en: "Print", zh: "列印" },
    undo: { en: "Undo", zh: "還原" },
    navigate: { en: "navigate", zh: "移動" },
    run: { en: "run", zh: "執行" },
    pickMessage: { en: "Select a message to read it here.", zh: "揀封郵件，就會喺呢邊打開。" },
    appearance: { en: "Appearance", zh: "外觀" },
    languageHumour: { en: "Language and humour", zh: "語言與幽默" },
    narrator: { en: "Spoken narrator", zh: "語音旁白" },
    delight: { en: "Delight", zh: "小驚喜" },
    editorGroup: { en: "External editor", zh: "外部編輯器" },
    historyGroup: { en: "Version history", zh: "版本記錄" },
    accountGroup: { en: "Account", zh: "帳戶" },
    theme: { en: "Theme", zh: "主題" },
    accent: { en: "Accent colour", zh: "強調色" },
    density: { en: "Density", zh: "密度" },
    fontFamily: { en: "Interface font", zh: "介面字體" },
    fontSize: { en: "Font size", zh: "字體大小" },
    fontWeight: { en: "Font weight", zh: "字重" },
    languageMode: { en: "Language mode", zh: "語言模式" },
    funEn: { en: "Funny level — English", zh: "幽默程度 — 英文" },
    funZh: { en: "Funny level — Cantonese", zh: "幽默程度 — 廣東話" },
    livePreview: { en: "Live preview", zh: "即時預覽" },
    narratorOn: { en: "Speak app events", zh: "朗讀應用事件" },
    narratorLang: { en: "Narrated language", zh: "旁白語言" },
    dimsumSetting: { en: "Dim sum surprise", zh: "點心驚喜" },
    dimsumPreview: { en: "Show one now", zh: "即刻睇一個" },
    editorChoice: { en: "Preferred editor", zh: "首選編輯器" },
    editorCustom: { en: "Custom command", zh: "自訂指令" },
    retention: { en: "Revisions kept", zh: "保留版本數" },
    exportHistory: { en: "Export history", zh: "匯出記錄" },
    accountAddress: { en: "Address shown in the header", zh: "標題顯示嘅地址" },
    light: { en: "Light", zh: "淺色" },
    dark: { en: "Dark", zh: "深色" },
    english: { en: "English", zh: "英文" },
    cantonese: { en: "Cantonese", zh: "廣東話" },
    both: { en: "Both", zh: "雙語" },
    compactD: { en: "Compact", zh: "緊密" },
    comfortableD: { en: "Comfortable", zh: "舒適" },
    relaxedD: { en: "Relaxed", zh: "寬鬆" },
    restore: { en: "Restore this revision", zh: "還原此版本" },
    field: { en: "Field", zh: "欄位" },
    before: { en: "Before", zh: "之前" },
    after: { en: "After", zh: "之後" },
    rename: { en: "Revision label", zh: "版本標籤" },
    from: { en: "From", zh: "由" },
    dateTo: { en: "To", zh: "至" },
    copy: { en: "Copy", zh: "複製" },
    exportMd: { en: "Export Markdown", zh: "匯出 Markdown" },
    clearAll: { en: "Clear all", zh: "全部清除" },
  };

  const MSG_COPY = {
    sent: {
      en: ["Message sent.", "Message sent.", "Sent — off it goes.", "Sent! Your words are now somebody else's inbox problem.", "WHOOSH 🚀 Sent. No take-backs, hope you spelled their name right."],
      zh: ["郵件已寄出。", "郵件已寄出。", "寄咗啦，飛咗出去 ✈️", "寄咗！你嘅字現在係人哋收件匣嘅問題 😄", "咻—— 🚀 寄咗！收唔返嘅，希望你冇打錯人個名 😂"],
    },
    draftSaved: {
      en: ["Draft saved.", "Draft saved.", "Draft parked in Drafts.", "Draft saved — future you can panic about it later.", "Draft saved 🗂️ It will sit in Drafts forever, like the other 47."],
      zh: ["草稿已儲存。", "草稿已儲存。", "草稿擺咗入 Drafts。", "草稿存咗，留返俾未來嘅你頭痛 😅", "草稿存咗 🗂️ 同其他四十七封一齊喺 Drafts 養老 😂"],
    },
    archived: {
      en: ["Moved to Archive.", "Moved to Archive.", "Archived — out of sight.", "Archived. Gone, but findable, like good leftovers.", "Archived 📦 Filed where nobody ever looks again."],
      zh: ["已移去存檔。", "已移去存檔。", "存檔咗，唔見咗喺眼前。", "存檔咗，唔係唔見，係擺埋一邊 🍱", "存檔咗 📦 放去冇人再望嘅角落 😂"],
    },
    spammed: {
      en: ["Marked as spam.", "Marked as spam.", "Marked as spam — bye.", "Spam! Straight to the naughty folder.", "SPAM 🚫 Reported, judged, binned."],
      zh: ["已標為垃圾郵件。", "已標為垃圾郵件。", "標為垃圾，拜拜。", "垃圾！直接掉入頑皮資料夾 😤", "垃圾郵件 🚫 舉報、判罪、掉入垃圾格 😂"],
    },
    deleted: {
      en: ["Moved to Trash.", "Moved to Trash.", "In the Trash now.", "Deleted. It is in Trash sulking.", "Deleted 🗑️ Sitting in Trash, plotting its comeback."],
      zh: ["已移去垃圾桶。", "已移去垃圾桶。", "掉咗入垃圾桶。", "刪咗，喺垃圾桶生悶氣 😾", "刪咗 🗑️ 喺垃圾桶度計劃返嚟 😂"],
    },
    markedUnread: {
      en: ["Marked as unread.", "Marked as unread.", "Marked unread — read it later.", "Unread again. Nice try, past you.", "Unread! 🙈 Pretending you never saw it. We support this."],
      zh: ["已標為未讀。", "已標為未讀。", "標為未讀，遲啲再睇。", "又變未讀，當冇睇過 😆", "未讀！🙈 假裝冇睇過，我們支持你 😂"],
    },
    restored: {
      en: ["Revision restored, and the restore itself was recorded.", "Revision restored, and the restore itself was recorded.", "Restored — and history kept the old state too.", "Restored. Time travel, no paradox: the previous state is still in history.", "Restored ⏪ And yes, this restore is itself undoable. History is append-only."],
      zh: ["已還原版本，而次還原本身都記錄咗。", "已還原版本，而次還原本身都記錄咗。", "還原咗，舊狀態都仲留喺記錄。", "還原咗，時光機冇壞：舊狀態仲喺記錄度 ⏪", "還原咗 ⏪ 而且次還原都可以再還原，記錄只加不減 😂"],
    },
    settingSaved: {
      en: ["Setting saved.", "Setting saved.", "Saved that setting.", "Saved — it will stick around after a restart.", "Saved ✅ Locked in, remembered, no restart amnesia."],
      zh: ["設定已儲存。", "設定已儲存。", "設定存咗。", "存咗，重開都仲記得 ✅", "存咗 ✅ 記住晒，重開都唔會失憶 😂"],
    },
    noEditor: {
      en: ["No external editor can be launched from a browser. The command was copied to your clipboard instead.", "No external editor can be launched from a browser. The command was copied to your clipboard instead.", "Browsers cannot launch editors — the command is on your clipboard.", "A web page cannot start your editor, so the command is on your clipboard. Paste it in a terminal.", "Nope 🙃 a browser cannot boot your editor. Command copied — paste it in a terminal."],
      zh: ["瀏覽器開唔到外部編輯器，指令已複製到剪貼簿。", "瀏覽器開唔到外部編輯器，指令已複製到剪貼簿。", "瀏覽器開唔到編輯器，指令已複製。", "網頁開唔到你部編輯器，指令幫你複製咗，去 terminal 貼啦。", "唔得呀 🙃 瀏覽器開唔到編輯器，指令已複製，去 terminal 貼 😂"],
    },
    copied: {
      en: ["Copied to clipboard.", "Copied to clipboard.", "Copied.", "Copied — go paste it somewhere useful.", "Copied 📋 Now paste it before you forget."],
      zh: ["已複製到剪貼簿。", "已複製到剪貼簿。", "複製咗。", "複製咗，快啲去貼 📋", "複製咗 📋 趁未忘記快啲貼 😂"],
    },
    exported: {
      en: ["Export downloaded.", "Export downloaded.", "Export saved to your downloads.", "Exported — check your downloads folder.", "Exported 💾 It is in Downloads with the other 200 files."],
      zh: ["匯出檔已下載。", "匯出檔已下載。", "匯出檔存咗喺下載夾。", "匯出咗，去下載夾睇睇 💾", "匯出咗 💾 同其他二百個檔一齊喺下載夾 😂"],
    },
    regexBad: {
      en: ["That pattern is not valid, so plain text was searched instead.", "That pattern is not valid, so plain text was searched instead.", "Invalid pattern — searched as plain text.", "That regex does not compile, so plain text it is.", "That regex exploded 💥 Searched as plain text instead."],
      zh: ["個 pattern 唔正確，改用純文字搜尋。", "個 pattern 唔正確，改用純文字搜尋。", "Pattern 唔啱，用純文字搵。", "個 regex 編譯唔到，唯有用純文字。", "個 regex 爆咗 💥 改用純文字搵 😂"],
    },
    emptyList: {
      en: ["Nothing here.", "Nothing here.", "Nothing here yet.", "Empty. Enjoy the silence.", "Completely empty 🍃 Inbox zero, or a broken filter. You decide."],
      zh: ["冇嘢喺呢邊。", "冇嘢喺呢邊。", "暫時冇嘢。", "空空如也，享受下安靜 🍃", "完全空 🍃 係 inbox zero，定係 filter 壞咗？你決定 😂"],
    },
    noMatch: {
      en: ["Nothing matches that search.", "Nothing matches that search.", "No matches for that search.", "No matches — try fewer letters.", "Zero matches 🔍 Either nothing matches, or that regex is very picky."],
      zh: ["冇嘢符合搜尋。", "冇嘢符合搜尋。", "搵唔到符合嘅嘢。", "冇結果，試下打少幾個字 🔍", "零結果 🔍 冇嘢符合，或者你個 regex 太揀擇 😂"],
    },
    dimsum: {
      en: ["A dim sum appeared for no reason at all.", "A dim sum appeared for no reason at all.", "Surprise dim sum!", "Surprise! A dim sum wandered in.", "SURPRISE DIM SUM 🥟 No reason, no agenda. Enjoy it."],
      zh: ["有一味點心無理由出現。", "有一味點心無理由出現。", "驚喜點心！", "驚喜！有味點心行入嚟 🥟", "驚喜點心 🥟 無理由出現，開心就好 😂"],
    },
    replyDiscarded: {
      en: ["Reply discarded.", "Reply discarded.", "Reply thrown away.", "Reply discarded — nothing was sent.", "Reply binned 🗑️ Nothing was sent, nobody saw it."],
      zh: ["回覆已丟棄。", "回覆已丟棄。", "回覆掉咗。", "回覆丟棄咗，冇寄出去。", "回覆掉咗 🗑️ 冇寄出，冇人見到 😂"],
    },
  };

  const CHANGELOG = [
    { version: "8.2.0", date: "2026-07-24", tag: "current", sections: [
      { kind: "added", items: ["Command palette on Ctrl/Cmd+K covering every action, setting and tab.", "Regex builder as an anchored popover on every search and filter bar.", "Ctrl/Cmd+F focuses the search bar of the surface you are looking at."] },
      { kind: "changed", items: ["Reply, reply all and forward now open inline under the message instead of a modal dialog.", "Tab strip gained pinning, drag reordering and a searchable tab list."] },
    ] },
    { version: "8.1.3", date: "2026-07-10", tag: "", sections: [
      { kind: "fixed", items: ["Archive can be undone from the snackbar; the undo no longer disappears after two seconds.", "Long localised labels no longer clip in the folder drawer at 200% display scale."] },
      { kind: "security", items: ["Regex evaluation is bounded (pattern length, sample size, match count) to protect against catastrophic backtracking."] },
    ] },
    { version: "8.1.0", date: "2026-06-28", tag: "", sections: [
      { kind: "added", items: ["Version history for messages and settings, with diff and restore.", "Notification centre keeps every dismissed toast."] },
      { kind: "changed", items: ["Full Material Design 3 pass: tokens, shape, elevation and motion."] },
    ] },
    { version: "8.0.2", date: "2026-06-06", tag: "", sections: [
      { kind: "fixed", items: ["Unread counts recalculated when a message is moved between folders."] },
    ] },
    { version: "8.0.0", date: "2026-05-20", tag: "", sections: [
      { kind: "added", items: ["Language modes: English, Cantonese and bilingual, with independent funny-level sliders.", "Spoken narrator, off by default, serialized so utterances never overlap."] },
      { kind: "changed", items: ["Message list rebuilt on M3 list items with tonal selection."] },
    ] },
    { version: "7.9.1", date: "2026-04-30", tag: "", sections: [
      { kind: "fixed", items: ["Keyboard focus ring visible on every interactive element in dark theme."] },
    ] },
    { version: "7.9.0", date: "2026-04-11", tag: "", sections: [
      { kind: "added", items: ["Appearance controls: theme, accent seed, density and interface font with live preview."] },
      { kind: "fixed", items: ["Dim sum surprise no longer appears during first run or an error path."] },
    ] },
    { version: "7.8.0", date: "2026-03-19", tag: "", sections: [
      { kind: "added", items: ["Changelog viewer with date filtering, search and Markdown export."] },
    ] },
  ];

  const MESSAGES = [
    { id: 1, folder: "inbox", name: "Dana Whitfield", email: "dana.whitfield@northmeridian.io", to: "me, Priya Raman, Tobias Lang", subject: "Q3 rollout plan — review before Thursday", ts: 1440, time: "10:42", fullDate: "Mon 27 Jul, 10:42", unread: true, starred: true, label: "Team", attach: { name: "rollout-plan-v4.pdf", size: "PDF · 248 KB" }, body: ["Hi team,", "Attached is the fourth pass at the Q3 rollout plan. The two open questions from Monday are resolved: staging cutover moves to the 14th, and we keep the legacy importer available for one extra release.", "Please leave comments before Thursday noon so I can hand a final version to support.", "— Dana"] },
    { id: 2, folder: "inbox", name: "Priya Raman", email: "priya@northmeridian.io", to: "me", subject: "Re: staging cutover window", ts: 1400, time: "09:58", fullDate: "Mon 27 Jul, 09:58", unread: true, starred: false, label: "Team", body: ["The 14th works for infra. We will need a 30 minute read-only window at 21:00 UTC.", "I will book the maintenance banner once you confirm."] },
    { id: 3, folder: "inbox", name: "Build service", email: "build@northmeridian.io", to: "engineering@northmeridian.io", subject: "Nightly build 8241 succeeded", ts: 1300, time: "06:15", fullDate: "Mon 27 Jul, 06:15", unread: true, starred: false, body: ["All 1,284 tests passed in 11m 42s.", "Artifacts are retained for 14 days."] },
    { id: 4, folder: "inbox", name: "Tobias Lang", email: "tobias.lang@northmeridian.io", to: "me, Dana Whitfield", subject: "Notes from the support sync", ts: 1100, time: "Mon 17:20", fullDate: "Sun 26 Jul, 17:20", unread: false, starred: false, label: "Team", attach: { name: "support-sync-notes.md", size: "Markdown · 12 KB" }, body: ["Three themes came up: importer confusion, slow first sync on large mailboxes, and the missing undo on archive.", "The last one is a two-line fix, I can take it this week."] },
    { id: 5, folder: "inbox", name: "Maren Sørensen", email: "maren@ferrywood.co", to: "me", subject: "Draft copy for the release note", ts: 1000, time: "Mon 11:04", fullDate: "Sun 26 Jul, 11:04", unread: false, starred: false, body: ["First pass below. I kept it to four sentences per section and cut the feature list to the three things people asked for.", "Tell me if the tone is too dry."] },
    { id: 6, folder: "inbox", name: "Ferrywood Accounts", email: "accounts@ferrywood.co", to: "me", subject: "Invoice 20261-A is ready", ts: 900, time: "Sun 20:31", fullDate: "Sat 25 Jul, 20:31", unread: false, starred: false, label: "Invoices", attach: { name: "invoice-20261-A.pdf", size: "PDF · 96 KB" }, body: ["Your invoice for July is attached. Payment is due in 21 days.", "Thanks for working with us."] },
    { id: 7, folder: "inbox", name: "Yusuf Adeyemi", email: "yusuf@northmeridian.io", to: "me", subject: "Re: legacy importer deprecation", ts: 800, time: "Sat 14:47", fullDate: "Sat 25 Jul, 14:47", unread: false, starred: true, body: ["One more release is fine, but let us put a banner in the importer so nobody starts a new migration with it."] },
    { id: 8, folder: "inbox", name: "Calendar", email: "calendar@northmeridian.io", to: "me", subject: "Invitation: retro — Thursday 15:00", ts: 700, time: "Fri 08:02", fullDate: "Fri 24 Jul, 08:02", unread: false, starred: false, body: ["Retro for the 8.1 cycle. Thursday 15:00–15:45, room Aurora, video link in the description."] },
    { id: 9, folder: "inbox", name: "Ines Cardoso", email: "ines@northmeridian.io", to: "localisation@northmeridian.io", subject: "Localisation strings for 8.2", ts: 600, time: "24 Jul", fullDate: "Thu 23 Jul, 16:20", unread: false, starred: false, label: "Team", body: ["Strings are frozen. 19 locales are complete, 4 are above 90%.", "Please avoid touching the compose screen copy until the freeze lifts."] },
    { id: 10, folder: "inbox", name: "Ops digest", email: "ops-digest@northmeridian.io", to: "me", subject: "Weekly reliability summary", ts: 500, time: "23 Jul", fullDate: "Wed 22 Jul, 07:00", unread: false, starred: false, body: ["Availability 99.98%. One incident, 6 minutes, caused by a bad cache deploy.", "Full write-up is in the incident log."] },
    { id: 11, folder: "sent", name: "Me", email: "maya.osei@northmeridian.io", to: "Dana Whitfield", subject: "Re: Q3 rollout plan — review before Thursday", ts: 1450, time: "11:05", fullDate: "Mon 27 Jul, 11:05", unread: false, starred: false, body: ["Reading it now. One question on the importer banner — do we ship it in 8.1 or wait?"] },
    { id: 12, folder: "sent", name: "Me", email: "maya.osei@northmeridian.io", to: "support@northmeridian.io", subject: "Undo on archive — shipping this week", ts: 1200, time: "Mon 09:12", fullDate: "Sun 26 Jul, 09:12", unread: false, starred: false, body: ["Tobias is picking it up. It will be in the Thursday build."] },
    { id: 13, folder: "drafts", name: "Me", email: "maya.osei@northmeridian.io", to: "engineering@northmeridian.io", subject: "8.2 planning — agenda draft", ts: 1350, time: "Mon 08:40", fullDate: "Mon 27 Jul, 08:40", unread: false, starred: false, body: ["Three topics: sync performance, importer retirement, and the mobile handoff."] },
    { id: 14, folder: "archive", name: "Lars Petersen", email: "lars@ferrywood.co", to: "me", subject: "Contract renewal signed", ts: 400, time: "18 Jul", fullDate: "Fri 17 Jul, 13:11", unread: false, starred: false, label: "Invoices", body: ["Countersigned copy attached for your records. Same terms, 12 months."] },
    { id: 15, folder: "spam", name: "Winner Notification", email: "no-reply@prize-claim.example", to: "me", subject: "You have been selected!!", ts: 300, time: "16 Jul", fullDate: "Wed 15 Jul, 02:44", unread: true, starred: false, body: ["Claim your reward within 24 hours."] },
    { id: 16, folder: "trash", name: "Newsletter", email: "news@example.com", to: "me", subject: "10 productivity tips you already knew", ts: 200, time: "12 Jul", fullDate: "Sat 11 Jul, 09:00", unread: false, starred: false, body: ["Tip one: make a list."] },
  ];

  return { SEEDS, NEUTRALS, FONTS, DENSITY, FOLDERS, LABELS, TABS, DIMSUM, LABEL_COPY, MSG_COPY, CHANGELOG, MESSAGES };
})();
