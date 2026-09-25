import { PERIODS, GROUPS, normalizeConfig, entityIndex, getEntity, currentPower, sourceShares, validShares, numeric, availablePeriods, profilePrefixes, groupFor, isTechnical, escapeHtml as esc } from "./model.js";
import { language, translate, metricLabel, formatState } from "./localize.js";
import { styles } from "./styles.js";
import "./editor.js";

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

const ENERGY_METRICS = ["", "_cost", "_from_grid_cost", "_from_grid_savings", "_from_self", "_from_grid", "_from_solar", "_from_battery", "_from_self_percentage", "_from_grid_percentage", "_from_solar_percentage", "_from_battery_percentage", "_from_self_index", "_from_self_advantage"];
const CYCLE_METRICS = ["cycle_validation_status", "cycles_count_lifetime", "cycle_completed_start", "cycle_completed_stop", "cycle_completed_duration", "cycle_completed_energy", "cycle_completed_cost", "cycle_completed_from_self_percentage", "cycle_live_duration", "cycle_live_energy", "cycle_live_cost", "cycle_live_from_self_percentage", "cycles_energy_mean", "cycles_duration_mean", "cycles_cost_mean", "cycles_from_self_percentage_mean"];
const READINESS = ["battery_can_cover_average_cycle", "battery_ready_for_average_cycle_at", "solar_ready_for_average_cycle_at"];

export class EnergyProfilerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._registry = [];
    this._search = "";
    this.shadowRoot.innerHTML = `<style>${styles}</style>
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
    this.shadowRoot.querySelector(".panels").addEventListener("click", event => {
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
    if (cost.state) stats.push([this._t(gridCost.state ? "gridCost" : "cost"), this._value(cost.state)]);
    const mean = this._entity("cycles_energy_mean");
    if (mean.state) stats.push([metricLabel("cycles_energy_mean", this._lang), this._value(mean.state)]);
    const shares = this._config.show_sources ? sourceShares(this._config, this._hass.states, this._index, this._period) : [];
    const hasEntities = [...this._index.values()].some(id => this._hass.states[id]);
    const coverage = this._entity("battery_can_cover_average_cycle");
    this._replace(this.shadowRoot.querySelector(".compact"), `
      <div class="head"><div class="identity"><span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 10-13h-7z"/></svg></span>
      <div><span class="eyebrow">Energy Profiler</span><span class="title">${esc(this._title)}</span></div></div>
      ${status.state ? `<span class="status">${esc(this._value(status.state))}</span>` : ""}</div>
      ${hasEntities ? `<div class="stats">${stats.map(([label, value]) => `<div class="stat"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join("")}</div>`
        : `<p class="notice">${esc(this._t("noData"))}</p>`}
      ${this._sharesHtml(shares)}
      ${this._config.show_readiness && coverage.state ? `<div class="readiness">${esc(this._t("cover"))}: <strong>${esc(this._coverage(coverage.state))}</strong></div>` : ""}
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

  _row(key, showId = false) {
    const { id, state } = this._entity(key);
    if (!state) return "";
    const value = key === "battery_can_cover_average_cycle" ? this._coverage(state) : this._value(state);
    return `<button type="button" class="row" data-entity="${esc(id)}"><span class="label">${esc(metricLabel(key, this._lang))}${showId ? `<small>${esc(id)}</small>` : ""}</span><span class="value">${esc(value)}</span></button>`;
  }

  _curated(group) {
    let keys = [];
    if (group === "overview") keys = ["status", "power_max", "power_from_self", "power_from_grid", "power_from_solar", "power_from_battery"];
    if (["energy", "running", "standby"].includes(group)) {
      const base = group === "energy" ? "energy" : group + "_energy";
      keys = ENERGY_METRICS.map(metric => base + metric + "_" + this._period);
      if (this._period !== "lifetime") keys.push(base + "_lifetime");
      if (group !== "energy") keys.unshift(group);
      if (group === "standby") keys.push("standby_duration");
      if (group === "energy") {
        for (const period of PERIODS) keys.push("energy_cost_instant_" + period, "energy_cost_instant_from_grid_" + period);
      }
    }
    if (group === "cycles") {
      keys = [...CYCLE_METRICS, "cycles_count_" + this._period, "cycles_duration_" + this._period];
      if (this._config.show_readiness) keys.push(...READINESS);
    }
    return [...new Set(keys)].filter(key => this._exists(key));
  }

  _renderPanels() {
    if (!this._index) return;
    const host = this.shadowRoot.querySelector(".panels");
    const query = this._search.trim().toLocaleLowerCase(this._lang);
    let found = false;
    for (const group of GROUPS) {
      const allKeys = [...this._index.keys()].filter(key =>
        groupFor(key) === group && this._exists(key) &&
        (this._config.show_technical || !isTechnical(key)) &&
        (this._config.show_readiness || !READINESS.includes(key)));
      let keys = query ? allKeys.filter(key => [key, metricLabel(key, this._lang), this._index.get(key)]
        .some(value => value.toLocaleLowerCase(this._lang).includes(query))) : this._curated(group);
      if (query && !keys.length || !allKeys.length) {
        host.querySelector('[data-group="' + group + '"]')?.remove();
        continue;
      }
      found = true;
      let details = host.querySelector('[data-group="' + group + '"]');
      if (!details) {
        details = document.createElement("details");
        details.dataset.group = group;
        details.innerHTML = '<summary></summary><div class="panel"><div class="primary rows"></div><p class="note notice" hidden></p><details class="extra"><summary></summary><div class="rows"></div></details><details class="attributes"><summary></summary><pre></pre></details></div>';
        details.open = group === "energy" || Boolean(query);
        const next = [...host.children].find(child => GROUPS.indexOf(child.dataset.group) > GROUPS.indexOf(group));
        host.insertBefore(details, next || null);
      }
      if (query) details.open = true;
      details.querySelector("summary").textContent = this._t(group);
      this._replace(details.querySelector(".primary"), keys.map(key => this._row(key)).join(""));
      const remaining = allKeys.filter(key => !keys.includes(key)).sort();
      const extra = details.querySelector(".extra");
      extra.hidden = Boolean(query) || remaining.length === 0;
      extra.querySelector("summary").textContent = this._t("extra") + " (" + remaining.length + ")";
      this._replace(extra.querySelector(".rows"), remaining.map(key => this._row(key, true)).join(""));
      const note = details.querySelector(".note");
      note.hidden = group !== "cycles" || !this._config.show_readiness || !READINESS.some(key => this._exists(key));
      note.textContent = this._t("estimate") + (this._exists("solar_ready_for_average_cycle_at") ? " " + this._t("forecastNote") : "");
      const attrs = details.querySelector(".attributes");
      attrs.hidden = !this._config.show_technical;
      attrs.querySelector("summary").textContent = this._t("attributes");
      attrs.querySelector("pre").textContent = this._config.show_technical
        ? JSON.stringify(Object.fromEntries(allKeys.map(key => [this._index.get(key), this._entity(key).state.attributes])), null, 2) : "";
    }
    let empty = host.querySelector(".empty");
    if (!found && !empty) {
      empty = document.createElement("p");
      empty.className = "empty notice";
      host.append(empty);
    }
    if (empty) { empty.hidden = found; empty.textContent = this._t("noResults"); }
  }

  getCardSize() { return 4; }
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
