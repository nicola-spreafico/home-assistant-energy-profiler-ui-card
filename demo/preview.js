import "../dist/home-assistant-energy-profiler-ui-card.js";
import { fixture } from "./fixture.js";
const full = document.querySelector("#full");
const basic = document.querySelector("#basic");
const params = new URLSearchParams(location.search);
const lang = params.get("lang") === "it" ? "it" : "en";
if (params.get("theme") === "dark") document.documentElement.classList.add("dark");
full.setConfig({ type: "custom:energy-profiler-card", prefix: "dishwasher_em", name: "Dishwasher", language: lang });
basic.setConfig({ type: "custom:energy-profiler-card", prefix: "dishwasher_em", name: "Washing machine", power_entity: "sensor.dishwasher_power", language: lang });
full.hass = fixture({ renamed: true });
basic.hass = fixture({ minimal: true });
document.querySelector("#theme").onclick = () => document.documentElement.classList.toggle("dark");
document.querySelector("#language").onclick = () => {
  const next = full._config.language === "it" ? "en" : "it";
  full.setConfig({ ...full._config, language: next });
  basic.setConfig({ ...basic._config, language: next });
};
let unavailable = false;
document.querySelector("#availability").onclick = () => {
  unavailable = !unavailable;
  full.hass = fixture({ unavailable, renamed: true });
};
document.querySelector("#update").onclick = () => {
  const hass = full.hass;
  const id = "sensor.my_daily_consumption";
  full.hass = { ...hass, states: { ...hass.states, [id]: { ...hass.states[id], state: String(Number(hass.states[id].state) + .1) } } };
};
document.addEventListener("hass-more-info", event => {
  document.querySelector("#event").textContent = "Entity selected: " + event.detail.entityId;
  window.lastEntity = event.detail.entityId;
});
window.demoReady = true;
