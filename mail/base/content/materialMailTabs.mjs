import {
  activateTab,
  describeTabs,
  isTabPinned,
  moveTab,
  moveTabBefore,
  normalizeTabState,
  renderedTabOrder,
  selectVisibleTabs,
  toggleTabPinned,
} from "chrome://messenger/content/materialTabModel.mjs";
import { validatePattern } from "chrome://messenger/content/materialRegexBuilder.mjs";

// Thunderbird chrome modules receive the privileged Services global. The
// equivalent Firefox-style module URL is not packaged in this application.
const PREF_NAME = "mail.material.preview.tabs";
const DEFAULT_PINNED = ["mail"];
const MAX_SEARCH_LENGTH = 512;

function setL10n(element, id, args) {
  if (!element) {
    return;
  }
  if (document.l10n?.setAttributes) {
    document.l10n.setAttributes(element, id, args);
  } else {
    element.dataset.l10nId = id;
  }
}

function text(value) {
  return value == null ? "" : String(value);
}

function nextFrame(callback) {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 0);
}

function cancelFrame(handle) {
  if (handle == null) {
    return;
  }
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(handle);
  } else {
    clearTimeout(handle);
  }
}

export class MaterialMailTabsController {
  constructor(root = document) {
    this.root = root;
    this.strip = root.getElementById("mm-tab-strip");
    this.pinnedContainer = root.getElementById("mm-pinned-tabs");
    this.regularContainer = root.getElementById("mm-regular-tabs");
    this.overflowButton = root.getElementById("mm-tab-overflow");
    this.overflowCount = root.getElementById("mm-tab-overflow-count");
    this.popover = root.getElementById("mm-tab-popover");
    this.popoverClose = root.getElementById("mm-tab-popover-close");
    this.searchInput = root.getElementById("mm-tab-search");
    this.searchCount = root.getElementById("mm-tab-search-count");
    this.searchResults = root.getElementById("mm-tab-search-results");
    this.contextMenu = root.getElementById("mm-tab-context-menu");
    this.contextPinLabel = root.getElementById("mm-tab-menu-pin-label");
    this.contextMoveLeft = root.getElementById("mm-tab-menu-move-left");
    this.contextMoveRight = root.getElementById("mm-tab-menu-move-right");

    this.tabs = [...root.querySelectorAll(".mm-tab[data-page]")];
    this.tabById = new Map(this.tabs.map(tab => [tab.dataset.page, tab]));
    this.tabRecords = this.tabs.map(tab => ({
      id: tab.dataset.page,
      label: this.tabLabel(tab),
      icon: tab.dataset.tabIcon || "",
    }));

    const initiallySelected = this.tabs.find(
      tab => tab.getAttribute("aria-selected") === "true"
    );
    this.state = normalizeTabState(this.readState(), this.tabRecords, {
      defaultActive: initiallySelected?.dataset.page,
      defaultPinned: DEFAULT_PINNED,
    });
    this.visibility = selectVisibleTabs(this.state);
    this.searchState = { mode: "plain", query: "", pattern: "", flags: "" };
    this.draggedId = null;
    this.contextTab = null;
    this.contextReturnFocus = null;
    this.popoverReturnFocus = null;
    this.measureHandle = null;
    this.resizeObserver = null;
    this.prefObserver = null;
  }

  isReady() {
    return Boolean(
      this.strip &&
      this.pinnedContainer &&
      this.regularContainer &&
      this.overflowButton &&
      this.popover &&
      this.searchInput &&
      this.searchResults &&
      this.contextMenu &&
      this.tabs.length
    );
  }

  tabLabel(tab) {
    return (
      tab?.getAttribute("aria-label") ||
      tab?.textContent?.trim() ||
      tab?.dataset.page ||
      ""
    );
  }

  refreshTabRecords() {
    this.tabRecords = this.tabs.map(tab => ({
      id: tab.dataset.page,
      label: this.tabLabel(tab),
      icon: tab.dataset.tabIcon || "",
    }));
  }

  readState() {
    try {
      const saved = JSON.parse(Services.prefs.getStringPref(PREF_NAME, "null"));
      if (!saved || typeof saved !== "object") {
        return null;
      }
      return {
        active: saved.active ?? saved.tab,
        order: saved.order ?? saved.tabOrder,
        pinned: saved.pinned,
      };
    } catch {
      return null;
    }
  }

  saveState() {
    try {
      Services.prefs.setStringPref(PREF_NAME, JSON.stringify(this.state));
    } catch {
      // Tab interaction remains usable if the profile preference is unavailable.
    }
  }

  init() {
    if (!this.isReady()) {
      return false;
    }

    for (const tab of this.tabs) {
      this.bindTab(tab);
    }
    this.bindStrip();
    this.bindPopover();
    this.bindContextMenu();
    this.bindDocument();
    this.searchResults.setAttribute("role", "list");

    this.renderRegions();
    this.select(this.state.active, { focus: false, persist: false });
    this.scheduleMeasure();

    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
      this.resizeObserver.observe(this.strip);
      this.resizeObserver.observe(this.regularContainer);
    }
    window.addEventListener("resize", () => {
      this.positionPopover();
      this.scheduleMeasure();
    });
    this.prefObserver = {
      observe: (_subject, _topic, preferenceName) => {
        if (preferenceName !== PREF_NAME) {
          return;
        }
        const nextState = normalizeTabState(this.readState(), this.tabRecords, {
          defaultActive: this.state.active,
          defaultPinned: DEFAULT_PINNED,
        });
        if (JSON.stringify(nextState) === JSON.stringify(this.state)) {
          return;
        }
        this.state = nextState;
        this.renderRegions();
        this.select(this.state.active, { focus: false, persist: false });
        this.scheduleMeasure();
      },
    };
    Services.prefs.addObserver(PREF_NAME, this.prefObserver);
    window.addEventListener(
      "unload",
      () => Services.prefs.removeObserver(PREF_NAME, this.prefObserver),
      { once: true }
    );

    document.l10n?.ready?.then(() => {
      this.refreshTabRecords();
      this.renderResults();
      this.scheduleMeasure();
    });
    return true;
  }

  bindTab(tab) {
    tab.draggable = true;
    tab.addEventListener("click", () => {
      this.closeContextMenu(false);
      this.closePopover(false);
      this.select(tab.dataset.page, { focus: false });
    });
    tab.addEventListener("keydown", event => this.onTabKeyDown(event, tab));
    tab.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();
      if (event.shiftKey) {
        this.closeContextMenu(false);
        this.emitAppearance(tab, event.clientX, event.clientY);
        return;
      }
      this.openContextMenu(tab, event.clientX, event.clientY);
    });
    tab.addEventListener("dragstart", event => {
      this.draggedId = tab.dataset.page;
      tab.classList.add("is-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", this.draggedId);
      }
    });
    tab.addEventListener("dragover", event => {
      const source = this.draggedId;
      if (!source || source === tab.dataset.page) {
        return;
      }
      if (
        isTabPinned(this.state, source) !==
        isTabPinned(this.state, tab.dataset.page)
      ) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });
    tab.addEventListener("drop", event => {
      event.preventDefault();
      const source =
        this.draggedId || event.dataTransfer?.getData("text/plain");
      if (!source || source === tab.dataset.page) {
        return;
      }
      const next = moveTabBefore(this.state, source, tab.dataset.page);
      this.commit(next, { focusId: source });
    });
    tab.addEventListener("dragend", () => {
      this.draggedId = null;
      for (const candidate of this.tabs) {
        candidate.classList.remove("is-dragging");
      }
    });
  }

  bindStrip() {
    this.strip.addEventListener("keydown", event => {
      if (
        !event.ctrlKey ||
        !event.shiftKey ||
        !["ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        return;
      }
      const tab = event.target.closest?.(".mm-tab[data-page]");
      if (!tab) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const direction = this.visualDirection(event.key);
      this.commit(moveTab(this.state, tab.dataset.page, direction), {
        focusId: tab.dataset.page,
      });
    });
  }

  bindPopover() {
    this.overflowButton.addEventListener("click", () => {
      if (this.popover.hidden) {
        this.openPopover();
      } else {
        this.closePopover(true);
      }
    });
    this.popoverClose?.addEventListener("click", () => this.closePopover(true));
    this.searchInput.addEventListener("input", () => {
      if (this.searchState.mode === "regex") {
        this.searchState = {
          ...this.searchState,
          pattern: this.searchInput.value,
        };
      } else {
        this.searchState = {
          mode: "plain",
          query: this.searchInput.value,
          pattern: "",
          flags: "",
        };
      }
      this.renderResults();
    });
    this.searchResults.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }
      const options = [
        ...this.searchResults.querySelectorAll(".mm-tab-result-main"),
      ];
      if (!options.length) {
        return;
      }
      event.preventDefault();
      const current = options.indexOf(
        event.target.closest?.(".mm-tab-result-main")
      );
      let next;
      if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = options.length - 1;
      } else {
        next =
          (Math.max(0, current) +
            (event.key === "ArrowDown" ? 1 : -1) +
            options.length) %
          options.length;
      }
      options[next].focus();
    });
  }

  bindContextMenu() {
    this.contextMenu.addEventListener("click", event => {
      const item = event.target.closest?.("[data-tab-action]");
      if (!item || item.disabled || !this.contextTab) {
        return;
      }
      const id = this.contextTab.dataset.page;
      const action = item.dataset.tabAction;
      if (action === "pin") {
        this.commit(toggleTabPinned(this.state, id), { focusId: id });
      } else if (action === "move-left") {
        this.commit(
          moveTab(this.state, id, this.visualDirection("ArrowLeft")),
          {
            focusId: id,
          }
        );
      } else if (action === "move-right") {
        this.commit(
          moveTab(this.state, id, this.visualDirection("ArrowRight")),
          {
            focusId: id,
          }
        );
      } else if (action === "appearance") {
        const rect = this.contextTab.getBoundingClientRect();
        this.emitAppearance(this.contextTab, rect.left, rect.bottom + 8);
      }
      this.closeContextMenu(false);
    });
    this.contextMenu.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }
      const items = [
        ...this.contextMenu.querySelectorAll(
          '[role="menuitem"]:not(:disabled)'
        ),
      ];
      if (!items.length) {
        return;
      }
      event.preventDefault();
      const current = items.indexOf(document.activeElement);
      let next;
      if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = items.length - 1;
      } else {
        next =
          (Math.max(0, current) +
            (event.key === "ArrowDown" ? 1 : -1) +
            items.length) %
          items.length;
      }
      items[next].focus();
    });
  }

  bindDocument() {
    document.addEventListener("mm-tab-search-state", event => {
      const supplied = event.detail?.state ?? event.detail ?? {};
      this.searchState = {
        mode: supplied.mode === "regex" ? "regex" : "plain",
        query: text(supplied.query).slice(0, MAX_SEARCH_LENGTH),
        pattern: text(supplied.pattern).slice(0, MAX_SEARCH_LENGTH),
        flags: text(supplied.flags),
      };
      const value =
        this.searchState.mode === "regex"
          ? this.searchState.pattern
          : this.searchState.query;
      if (this.searchInput.value !== value) {
        this.searchInput.value = value;
      }
      this.renderResults();
    });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") {
        return;
      }
      if (!this.contextMenu.hidden) {
        event.preventDefault();
        this.closeContextMenu(true);
      } else if (!this.popover.hidden) {
        event.preventDefault();
        this.closePopover(true);
      }
    });
    document.addEventListener("pointerdown", event => {
      if (
        !this.contextMenu.hidden &&
        !this.contextMenu.contains(event.target) &&
        !event.target.closest?.(".mm-tab[data-page]")
      ) {
        this.closeContextMenu(false);
      }
      if (
        !this.popover.hidden &&
        !this.popover.contains(event.target) &&
        event.target !== this.overflowButton &&
        !this.overflowButton.contains(event.target)
      ) {
        this.closePopover(false);
      }
    });
  }

  visualDirection(key) {
    const rtl = getComputedStyle(this.strip).direction === "rtl";
    if (key === "ArrowRight") {
      return rtl ? -1 : 1;
    }
    return rtl ? 1 : -1;
  }

  onTabKeyDown(event, tab) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    if (event.ctrlKey && event.shiftKey) {
      return;
    }
    const order = this.visibility.visible;
    if (!order.length) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const current = Math.max(0, order.indexOf(tab.dataset.page));
    let next;
    if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = order.length - 1;
    } else {
      next =
        (current + this.visualDirection(event.key) + order.length) %
        order.length;
    }
    this.select(order[next], { focus: true });
  }

  select(id, { focus: shouldFocus = false, persist = true } = {}) {
    if (!this.tabById.has(id)) {
      return;
    }
    this.state = activateTab(this.state, id);
    if (persist) {
      this.saveState();
    }
    window.mmSelectPage?.(id);
    this.applyTabSelection();
    this.scheduleMeasure();
    this.renderResults();
    if (shouldFocus) {
      nextFrame(() => this.tabById.get(id)?.focus());
    }
  }

  commit(nextState, { focusId = null } = {}) {
    this.state = normalizeTabState(nextState, this.tabRecords, {
      defaultActive: this.state.active,
      defaultPinned: DEFAULT_PINNED,
    });
    this.saveState();
    this.renderRegions();
    window.mmSelectPage?.(this.state.active);
    this.applyTabSelection();
    this.closeContextMenu(false);
    this.scheduleMeasure();
    this.renderResults();
    if (focusId) {
      nextFrame(() => this.tabById.get(focusId)?.focus());
    }
  }

  renderRegions() {
    const order = renderedTabOrder(this.state);
    for (const id of order) {
      const tab = this.tabById.get(id);
      if (!tab) {
        continue;
      }
      const pinned = isTabPinned(this.state, id);
      tab.classList.toggle("is-pinned", pinned);
      tab.dataset.pinned = String(pinned);
      tab.title = this.tabLabel(tab);
      (pinned ? this.pinnedContainer : this.regularContainer).append(tab);
      if (pinned) {
        tab.classList.remove("is-overflowed");
      }
    }
    this.applyTabSelection();
  }

  applyTabSelection() {
    for (const tab of this.tabs) {
      const active = tab.dataset.page === this.state.active;
      const visible = !tab.classList.contains("is-overflowed");
      tab.classList.toggle("is-selected", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active && visible ? 0 : -1;
    }
  }

  scheduleMeasure() {
    cancelFrame(this.measureHandle);
    this.measureHandle = nextFrame(() => {
      this.measureHandle = null;
      this.measureOverflow();
    });
  }

  measureOverflow() {
    const regularTabs = this.state.order
      .filter(id => !isTabPinned(this.state, id))
      .map(id => this.tabById.get(id))
      .filter(Boolean);
    for (const tab of regularTabs) {
      tab.classList.remove("is-overflowed");
    }

    const availableWidth =
      this.regularContainer.clientWidth ||
      this.regularContainer.getBoundingClientRect().width;
    const widths = Object.fromEntries(
      regularTabs.map(tab => [
        tab.dataset.page,
        tab.getBoundingClientRect().width || tab.scrollWidth || 148,
      ])
    );
    const styles = getComputedStyle(this.regularContainer);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    this.visibility = selectVisibleTabs(this.state, {
      availableWidth:
        availableWidth > 0 ? availableWidth : Number.POSITIVE_INFINITY,
      widths,
      gap,
    });

    const hidden = new Set(this.visibility.hidden);
    for (const tab of regularTabs) {
      tab.classList.toggle("is-overflowed", hidden.has(tab.dataset.page));
    }
    this.overflowButton.classList.toggle("has-overflow", hidden.size > 0);
    this.overflowButton.dataset.hiddenCount = String(hidden.size);
    this.overflowCount.textContent = hidden.size ? String(hidden.size) : "";
    this.applyTabSelection();
    this.renderResults();
  }

  tabMatches(record) {
    const source = `${record.label} ${record.id} ${record.pinned ? "pinned" : ""} ${
      record.hidden ? "hidden overflow" : "visible"
    }`;
    const query =
      this.searchState.mode === "regex"
        ? this.searchState.pattern
        : this.searchState.query;
    if (!query) {
      return true;
    }
    if (query.length > MAX_SEARCH_LENGTH) {
      return false;
    }
    if (this.searchState.mode === "regex") {
      const validation = validatePattern(query, this.searchState.flags);
      return validation.ok && validation.regex.test(source);
    }
    return source.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  }

  renderResults() {
    if (!this.searchResults) {
      return;
    }
    this.refreshTabRecords();
    const records = describeTabs(
      this.state,
      this.tabRecords,
      this.visibility
    ).filter(record => this.tabMatches(record));
    this.searchResults.replaceChildren();

    for (const record of records) {
      const row = document.createElement("div");
      row.className = "mm-tab-result";
      row.dataset.page = record.id;
      row.setAttribute("role", "listitem");
      row.classList.toggle("is-active", record.active);
      row.classList.toggle("is-pinned", record.pinned);
      row.classList.toggle("is-hidden-tab", record.hidden);
      row.classList.toggle("is-visible-tab", !record.hidden);
      if (record.active) {
        row.setAttribute("aria-current", "page");
      }

      const main = document.createElement("button");
      main.type = "button";
      main.className = "mm-tab-result-main";
      main.title = record.label;

      const label = document.createElement("strong");
      label.textContent = record.label;
      main.append(label);

      const meta = document.createElement("span");
      meta.className = "mm-tab-result-meta";
      if (record.pinned) {
        const pinned = document.createElement("span");
        pinned.textContent = "Pinned";
        setL10n(pinned, "material-mail-tab-pinned");
        meta.append(pinned);
      }
      const visibility = document.createElement("span");
      visibility.textContent = record.hidden ? "In overflow" : "Visible";
      setL10n(
        visibility,
        record.hidden ? "material-mail-tab-hidden" : "material-mail-tab-visible"
      );
      meta.append(visibility);
      main.append(meta);
      main.addEventListener("click", () => {
        this.select(record.id, { focus: false });
        this.closePopover(false);
        nextFrame(() => this.tabById.get(record.id)?.focus());
      });

      const actions = document.createElement("span");
      actions.className = "mm-tab-result-actions";
      const pin = document.createElement("button");
      pin.type = "button";
      pin.textContent = record.pinned ? "Unpin tab" : "Pin tab";
      setL10n(
        pin,
        record.pinned ? "material-mail-tab-unpin" : "material-mail-tab-pin"
      );
      pin.addEventListener("click", event => {
        event.stopPropagation();
        this.commit(toggleTabPinned(this.state, record.id));
        nextFrame(() =>
          this.searchResults
            .querySelector(
              `.mm-tab-result[data-page="${CSS.escape(record.id)}"] .mm-tab-result-actions button`
            )
            ?.focus()
        );
      });
      actions.append(pin);
      row.append(main, actions);
      this.searchResults.append(row);
    }

    const fallback = `${records.length} tabs`;
    this.searchCount.textContent = fallback;
    setL10n(this.searchCount, "material-mail-tab-results", {
      count: records.length,
    });
  }

  openPopover() {
    this.closeContextMenu(false);
    this.popoverReturnFocus = this.overflowButton;
    this.popover.hidden = false;
    this.overflowButton.setAttribute("aria-expanded", "true");
    this.positionPopover();
    this.renderResults();
    nextFrame(() => this.searchInput.focus());
  }

  closePopover(returnFocus) {
    if (this.popover.hidden) {
      return;
    }
    this.popover.hidden = true;
    this.overflowButton.setAttribute("aria-expanded", "false");
    if (returnFocus) {
      const target = this.popoverReturnFocus?.isConnected
        ? this.popoverReturnFocus
        : this.overflowButton;
      nextFrame(() => target.focus?.());
    }
    this.popoverReturnFocus = null;
  }

  positionPopover() {
    if (this.popover.hidden) {
      return;
    }
    const rect = this.overflowButton.getBoundingClientRect();
    const rtl = getComputedStyle(this.strip).direction === "rtl";
    const inlineEnd = rtl ? rect.left : window.innerWidth - rect.right;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    this.popover.style.setProperty(
      "--mm-tab-popover-inline-end",
      `${Math.max(8, inlineEnd)}px`
    );
    if (below < 320 && above > below) {
      this.popover.dataset.placement = "above";
      this.popover.style.setProperty(
        "--mm-tab-popover-bottom",
        `${Math.max(8, window.innerHeight - rect.top + 8)}px`
      );
    } else {
      delete this.popover.dataset.placement;
      this.popover.style.setProperty(
        "--mm-tab-popover-y",
        `${rect.bottom + 8}px`
      );
    }
  }

  openContextMenu(tab, x, y) {
    this.closePopover(false);
    this.contextTab = tab;
    this.contextReturnFocus = tab;
    const rtl = getComputedStyle(this.strip).direction === "rtl";
    this.contextMenu.style.setProperty(
      "--mm-tab-context-x",
      `${Math.max(8, rtl ? window.innerWidth - x : x)}px`
    );
    this.contextMenu.style.setProperty(
      "--mm-tab-context-y",
      `${Math.max(8, y)}px`
    );
    this.updateContextMenu();
    this.contextMenu.hidden = false;
    nextFrame(() =>
      this.contextMenu
        .querySelector('[role="menuitem"]:not(:disabled)')
        ?.focus()
    );
  }

  closeContextMenu(returnFocus) {
    if (this.contextMenu.hidden) {
      return;
    }
    this.contextMenu.hidden = true;
    const target = this.contextReturnFocus;
    this.contextTab = null;
    this.contextReturnFocus = null;
    if (returnFocus && target?.isConnected) {
      nextFrame(() => target.focus());
    }
  }

  updateContextMenu() {
    if (!this.contextTab) {
      return;
    }
    const id = this.contextTab.dataset.page;
    const pinned = isTabPinned(this.state, id);
    this.contextPinLabel.textContent = pinned ? "Unpin tab" : "Pin tab";
    setL10n(
      this.contextPinLabel,
      pinned ? "material-mail-tab-unpin" : "material-mail-tab-pin"
    );
    const peers = this.state.order.filter(
      tabId => isTabPinned(this.state, tabId) === pinned
    );
    const index = peers.indexOf(id);
    const leftIndex = index + this.visualDirection("ArrowLeft");
    const rightIndex = index + this.visualDirection("ArrowRight");
    this.contextMoveLeft.disabled = leftIndex < 0 || leftIndex >= peers.length;
    this.contextMoveLeft.setAttribute(
      "aria-disabled",
      String(leftIndex < 0 || leftIndex >= peers.length)
    );
    this.contextMoveRight.disabled =
      rightIndex < 0 || rightIndex >= peers.length;
    this.contextMoveRight.setAttribute(
      "aria-disabled",
      String(rightIndex < 0 || rightIndex >= peers.length)
    );
  }

  emitAppearance(tab, x, y) {
    tab.dispatchEvent(
      new CustomEvent("mm-tab-edit-appearance", {
        bubbles: true,
        detail: { target: tab, page: tab.dataset.page, x, y },
      })
    );
  }

  snapshot() {
    return {
      state: {
        ...this.state,
        order: [...this.state.order],
        pinned: [...this.state.pinned],
      },
      visibility: {
        ...this.visibility,
        visible: [...this.visibility.visible],
        hidden: [...this.visibility.hidden],
      },
      searchState: { ...this.searchState },
    };
  }
}

export function initMaterialMailTabs(root = document) {
  if (window.mmMaterialMailTabs) {
    return window.mmMaterialMailTabs;
  }
  const controller = new MaterialMailTabsController(root);
  if (!controller.init()) {
    return null;
  }
  window.mmMaterialMailTabs = controller;
  return controller;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initMaterialMailTabs(), {
    once: true,
  });
} else {
  initMaterialMailTabs();
}
