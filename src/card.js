import { normalizeConfig, entityIndex, getEntity, currentPower, sourceShares, validShares, numeric, availablePeriods, profilePrefixes, escapeHtml as esc } from "./model.js";
import { language, translate, metricLabel, formatState } from "./localize.js";
import { styles } from "./styles.js";
import "./editor.js";
import { renderDetail } from "./detail-view.js";
import { detailStyles } from "./detail-styles.js";
import { fetchDailyHistory } from "./detail-model.js";

const registryRequests = new WeakMap();
function registryFor(hass) {
  const owner = hass.connection || hass;
  let request = registryRequests.get(owner);
  if (!request) {
    request = hass.callWS({ type: "config/entity_registry/list" });
    registryRequests.set(owner, request);
    request.catch(() => registryRequests.delete(owner));
  }
  return request;
}


export class EnergyProfilerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._registry = [];
    this._search = "";
    this._detailTab = "summary";
    this.shadowRoot.innerHTML = `<style>${styles}${detailStyles}</style>
      <article class="card"><button type="button" class="launch" aria-haspopup="dialog"><div class="compact"></div></button></article>
      <dialog aria-labelledby="ep-title">
        <header class="dialog-head">
          <div class="head"><div><span class="eyebrow">Energy Profiler</span><h2 id="ep-title"></h2></div>
          <button type="button" class="close" autofocus>×</button></div>
          <div class="toolbar"><label class="period-label"><span></span><select class="period"></select></label>
          <label class="search-label"><span></span><input class="search" type="search"></label></div>
        </header>
        <div class="dialog-body"><p class="registry-notice notice" hidden></p><div class="panels"></div></div>
      </dialog>`;
    this._dialog = this.shadowRoot.querySelector("dialog");
    this.shadowRoot.querySelector(".launch").addEventListener("click", () => this.openDetails());
    this.shadowRoot.querySelector(".close").addEventListener("click", () => this._dialog.close());
    this._dialog.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this._dialog.close();
      }
    });
    this._dialog.addEventListener("click", event => {
      if (event.target === this._dialog) {
        const r = this._dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) this._dialog.close();
      }
    });
    this._dialog.addEventListener("close", () => {
      if (this.isConnected) this.shadowRoot.querySelector(".launch").focus();
    });
    this.shadowRoot.querySelector(".period").addEventListener("change", event => {
      this._requestedPeriod = event.target.value;
      this._render();
    });
    this.shadowRoot.querySelector(".search").addEventListener("input", event => {
      this._search = event.target.value;
      this._renderPanels();
    });
    this.shadowRoot.querySelector(".panels").addEventListener("keydown", event => {
      const button = event.target.closest(".detail-nav button");
      if (!button || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const buttons = [...this.shadowRoot.querySelectorAll(".detail-nav button")];
      const index = buttons.indexOf(button);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[next].click();
      this.shadowRoot.querySelector('.detail-nav button[data-tab="' + buttons[next].dataset.tab + '"]')?.focus();
    });
    this.shadowRoot.querySelector(".panels").addEventListener("click", event => {
      const tab = event.target.closest("button[data-tab]");
      if (tab) {
        this._detailTab = tab.dataset.tab;
        this._search = "";
        this.shadowRoot.querySelector(".search").value = "";
        this._renderPanels();
        this.shadowRoot.querySelector(".dialog-body").scrollTo({ top: 0 });
        return;
      }
      if (event.target.closest("[data-refresh-history]")) {
        this._ensureHistory(true);
        this._renderPanels();
        return;
      }
      const row = event.target.closest("button[data-entity]");
      if (!row) return;
      const entityId = row.dataset.entity;
      this._dialog.close();
      // Let the browser release modal focus before HA opens its own entity dialog.
      requestAnimationFrame(() => this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId }, bubbles: true, composed: true,
      })));
    });
  }

  setConfig(config) {
    this._config = normalizeConfig(config);
    this._historyTicket = (this._historyTicket || 0) + 1;
    this._historyKey = undefined;
    this._history = undefined;
    this._requestedPeriod = this._config.period;
    this._render();
  }
  set hass(hass) {
    this._hass = hass;
    this._loadRegistry();
    this._render();
  }
  get hass() { return this._hass; }
  connectedCallback() { this._loadRegistry(); this._render(); }
  disconnectedCallback() {
    if (this._dialog.open) this._dialog.close();
    this._registryUnsubscribe?.();
    this._registryUnsubscribe = undefined;
    this._registryOwner = undefined;
    this._historyTicket = (this._historyTicket || 0) + 1;
    this._historyKey = undefined;
    this._generation = (this._generation || 0) + 1;
  }

  _loadRegistry() {
    const hass = this._hass;
    if (!this.isConnected || !hass?.callWS) return;
    const owner = hass.connection || hass;
    if (this._registryOwner === owner) return;
    this._registryUnsubscribe?.();
    this._registryUnsubscribe = undefined;
    this._registryOwner = owner;
    const generation = this._generation = (this._generation || 0) + 1;
    const refresh = () => {
      registryFor(hass).then(entries => {
        if (this._generation !== generation) return;
        this._registry = entries;
        this._registryFailed = false;
        this._render();
      }).catch(() => {
        if (this._generation !== generation) return;
        this._registryFailed = true;
        this._render();
      });
    };
    refresh();
    if (hass.connection?.subscribeEvents) {
      hass.connection.subscribeEvents(() => {
        registryRequests.delete(owner);
        refresh();
      }, "entity_registry_updated").then(unsubscribe => {
        if (this._generation !== generation || !this.isConnected) unsubscribe();
        else this._registryUnsubscribe = unsubscribe;
      }).catch(() => { /* State-name fallback remains available for restricted users. */ });
    }
  }

  _t(key) { return translate(key, this._lang); }
  _entity(key) { return getEntity(this._config, this._hass.states || {}, this._index, key); }
  _value(state) { return formatState(state, this._lang, this._hass?.config?.time_zone); }
  _exists(key) { return Boolean(this._entity(key).state); }
  _replace(node, html) { if (node._epHtml !== html) { node.innerHTML = html; node._epHtml = html; } }

  _render() {
    if (!this._config || !this._hass) return;
    this._lang = language(this._config, this._hass);
    this._index = entityIndex(this._config, this._hass.states, this._registry);
    this._title = this._config.name || this._config.prefix.replace(/_/g, " ");
    const periods = availablePeriods(this._index, this._hass.states);
    this._period = periods.includes(this._requestedPeriod) ? this._requestedPeriod : periods[0] || this._requestedPeriod;
    const select = this.shadowRoot.querySelector(".period");
    this._replace(select, (periods.length ? periods : [this._period]).map(period =>
      `<option value="${period}">${esc(this._t(period))}</option>`).join(""));
    select.value = this._period;
    this.shadowRoot.querySelector("#ep-title").textContent = this._title;
    this.shadowRoot.querySelector(".close").setAttribute("aria-label", this._t("close"));
    this.shadowRoot.querySelector(".launch").setAttribute("aria-label", this._title + " · " + this._t("details"));
    this.shadowRoot.querySelector(".period-label span").textContent = this._t("period");
    this.shadowRoot.querySelector(".search-label span").textContent = this._t("search");
    this.shadowRoot.querySelector(".search").placeholder = this._t("search");
    const notice = this.shadowRoot.querySelector(".registry-notice");
    notice.hidden = !this._registryFailed;
    notice.textContent = this._t("registry");

    const power = currentPower(this._config, this._hass.states, this._index);
    const energy = this._entity("energy_" + this._period);
    const gridCost = this._entity("energy_from_grid_cost_" + this._period);
    const cost = gridCost.state ? gridCost : this._entity("energy_cost_" + this._period);
    const status = this._entity("status");
    const stats = [[this._t("power"), this._value(power.state)], [this._t("consumption"), this._value(energy.state)]];
    const secondary = [];
    if (cost.state) secondary.push([this._t(gridCost.state ? "gridCost" : "cost"), this._value(cost.state)]);
    const mean = this._entity("cycles_energy_mean");
    if (mean.state) secondary.push([this._t("cycleCompact"), this._value(mean.state)]);
    const shares = this._config.show_sources ? sourceShares(this._config, this._hass.states, this._index, this._period) : [];
    const hasEntities = [...this._index.values()].some(id => this._hass.states[id]);
    const coverage = this._entity("battery_can_cover_average_cycle");
    this._replace(this.shadowRoot.querySelector(".compact"), `
      <div class="head"><div class="identity"><span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 10-13h-7z"/></svg></span>
      <div><span class="eyebrow">Energy Profiler</span><span class="title">${esc(this._title)}</span></div></div>
      ${status.state ? `<span class="status">${esc(this._value(status.state))}</span>` : ""}</div>
      ${hasEntities ? `<div class="stats">${stats.map(([label, value]) => `<div class="stat"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join("")}</div>`
        : `<p class="notice">${esc(this._t("noData"))}</p>`}
      ${hasEntities && secondary.length ? `<div class="secondary-stats">${secondary.map(([label, value]) => `<span><small>${esc(label)}</small><strong>${esc(value)}</strong></span>`).join("")}</div>` : ""}
      ${this._sharesHtml(shares)}
      ${this._config.show_readiness && coverage.state ? `<div class="readiness">${esc(this._t("coverCompact"))}: <strong>${esc(this._coverage(coverage.state))}</strong></div>` : ""}
      <div class="foot"><span>${esc(this._t(this._period))}</span><span>${esc(this._t("details"))} →</span></div>`);
    if (this._dialog.open) this._renderPanels();
  }

  _coverage(state) {
    return state?.state === "on" ? this._t("yes") : state?.state === "off" ? this._t("no") : this._value(state);
  }

  _sharesHtml(shares) {
    if (!shares.length) return "";
    return `<div class="source-heading" title="${esc(this._t("sourcePeriod"))}">${esc(this._t("sources"))} · ${esc(this._t(this._period))}</div>
      ${validShares(shares) ? `<div class="strip" aria-hidden="true">${shares.map(item => `<span class="${item.channel}" style="width:${numeric(item.state)}%"></span>`).join("")}</div>` : ""}
      <div class="legend">${shares.map(item => `<span><i class="dot ${item.channel}" aria-hidden="true"></i>${esc(this._t(item.channel))} ${esc(this._value(item.state))}</span>`).join("")}</div>`;
  }

  openDetails() {
    if (!this._config || !this._hass) return;
    this._renderPanels();
    if (!this._dialog.open) this._dialog.showModal();
  }

  _ensureHistory(refresh = false) {
    const entity = this._entity("energy_daily");
    if (!entity.state || !this._hass.callWS) {
      this._history = { status: "unsupported", points: [] };
      return;
    }
    const owner = this._hass.connection || this._hass;
    const key = this._config.prefix + "|" + entity.id;
    if (!refresh && this._historyKey === key && this._historyOwner === owner && Date.now() - this._historyTime < 300000) return;
    this._historyKey = key;
    this._historyOwner = owner;
    this._historyTime = Date.now();
    const ticket = this._historyTicket = (this._historyTicket || 0) + 1;
    this._history = { status: "loading", points: [] };
    fetchDailyHistory(this._hass, entity.id, { refresh }).then(points => {
      if (ticket !== this._historyTicket || !this.isConnected) return;
      this._history = { status: "ready", points };
      if (this._dialog.open) this._renderPanels();
    }).catch(() => {
      if (ticket !== this._historyTicket || !this.isConnected) return;
      this._history = { status: "error", points: [] };
      if (this._dialog.open) this._renderPanels();
    });
  }

  _renderPanels() {
    if (!this._index) return;
    if (!this._search && ["summary", "energy"].includes(this._detailTab)) this._ensureHistory();
    renderDetail(this);
  }

  getCardSize() { return 3; }
  getGridOptions() { return { columns: 12, min_columns: 6 }; }
  static getConfigElement() { return document.createElement("energy-profiler-card-editor"); }
  static getStubConfig(hass) { return { prefix: profilePrefixes(hass?.states)[0] || "dishwasher_em", period: "daily" }; }
}

if (!customElements.get("energy-profiler-card")) customElements.define("energy-profiler-card", EnergyProfilerCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "energy-profiler-card"))
  window.customCards.push({
    type: "energy-profiler-card", name: "Energy Profiler", preview: true,
    description: "Appliance energy, sources, cycles and readiness in one contextual card.",
    documentationURL: "https://github.com/nicola-spreafico/home-assistant-energy-profiler-ui-card",
  });
