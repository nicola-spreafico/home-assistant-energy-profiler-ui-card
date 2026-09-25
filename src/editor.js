import { PERIODS, profilePrefixes, escapeHtml as esc } from "./model.js";
import { language, translate } from "./localize.js";

export class EnergyProfilerCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const update = event => {
      const input = event.target;
      if (!input.name || (event.type === "input" && !["prefix", "name", "power_entity"].includes(input.name))) return;
      const config = { ...this._config, [input.name]: input.type === "checkbox" ? input.checked : input.value.trim() };
      if (["name", "power_entity"].includes(input.name) && !config[input.name]) delete config[input.name];
      this._config = config;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      if (input.name === "language") this._render();
    };
    this.shadowRoot.addEventListener("change", update);
    this.shadowRoot.addEventListener("input", update);
  }
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) {
    this._hass = hass;
    const prefixes = profilePrefixes(hass.states);
    const signature = JSON.stringify(prefixes);
    if (signature !== this._profileSignature) { this._profileSignature = signature; this._prefixes = prefixes; this._render(); }
  }
  _render() {
    if (!this._config) return;
    const lang = language(this._config.language ? this._config : { language: "auto" }, this._hass);
    const t = key => translate(key, lang);
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color);font:inherit}
      label{display:block;margin:14px 0;font:inherit}input,select{display:block;box-sizing:border-box;width:100%;padding:10px;margin-top:6px;border:1px solid var(--divider-color,#aaa);border-radius:8px;color:inherit;background:var(--card-background-color,#fff);font:inherit}
      input[type=checkbox]{display:inline-block;width:auto;margin-right:8px}p{font-size:13px;color:var(--secondary-text-color)}
    </style>
    ${["prefix", "name", "power_entity"].map(key => `<label>${esc(t(key))}<input name="${key}" value="${esc(this._config[key] || "")}" ${key === "prefix" ? 'list="profiles" required' : ""}></label>`).join("")}
    <datalist id="profiles">${(this._prefixes || []).map(prefix => `<option value="${esc(prefix)}"></option>`).join("")}</datalist>
    <label>${esc(t("period"))}<select name="period">${PERIODS.map(period => `<option value="${period}" ${(this._config.period || "daily") === period ? "selected" : ""}>${esc(t(period))}</option>`).join("")}</select></label>
    <label>${esc(t("language"))}<select name="language">${["auto", "en", "it"].map(value => `<option value="${value}" ${(this._config.language || "auto") === value ? "selected" : ""}>${value === "auto" ? esc(t("auto")) : value === "en" ? "English" : "Italiano"}</option>`).join("")}</select></label>
    ${["show_sources", "show_readiness", "show_technical"].map(key => `<label><input name="${key}" type="checkbox" ${(this._config[key] ?? (key !== "show_technical")) ? "checked" : ""}>${esc(t(key))}</label>`).join("")}`;
  }
}
if (!customElements.get("energy-profiler-card-editor")) customElements.define("energy-profiler-card-editor", EnergyProfilerCardEditor);
