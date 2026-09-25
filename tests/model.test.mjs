import test from "node:test";
import assert from "node:assert/strict";
import { normalizeConfig, numeric, entityIndex, getEntity, currentPower, sourceShares, validShares, groupFor, availablePeriods, profilePrefixes, escapeHtml } from "../src/model.js";
import { formatState } from "../src/localize.js";
import { fixture } from "../demo/fixture.js";

test("invalid config is rejected before generating markup or IDs", () => {
  for (const prefix of ["", "<script>", "sensor.foo", "foo bar", null]) assert.throws(() => normalizeConfig({ prefix }));
  assert.throws(() => normalizeConfig({ prefix: "washer_em", entities: { energy_daily: "javascript:alert(1)" } }));
  assert.throws(() => normalizeConfig({ prefix: "washer_em", show_sources: "false" }));
  assert.throws(() => normalizeConfig({ prefix: "washer_em", period: "yesterday" }));
});
test("registry unique IDs resolve renamed entities and explicit overrides win", () => {
  const hass = fixture({ renamed: true });
  const config = normalizeConfig({ prefix: "dishwasher_em" });
  const index = entityIndex(config, hass.states, hass.demoRegistry);
  assert.equal(index.get("energy_daily"), "sensor.my_daily_consumption");
  assert.equal(getEntity(config, hass.states, index, "energy_daily").state.state, "1.8");
  const override = normalizeConfig({ prefix: "dishwasher_em", entities: { energy_daily: "sensor.explicit" } });
  assert.equal(entityIndex(override, hass.states, hass.demoRegistry).get("energy_daily"), "sensor.explicit");
  assert.deepEqual(availablePeriods(index, hass.states), ["daily", "monthly", "yearly", "lifetime"]);
});
test("power is self plus grid without double-counting solar and battery", () => {
  const hass = fixture();
  const config = normalizeConfig({ prefix: "dishwasher_em" });
  const index = entityIndex(config, hass.states);
  assert.equal(numeric(currentPower(config, hass.states, index).state), 1240);
  hass.states["sensor.dishwasher_em_power_from_self"].attributes.unit_of_measurement = "kW";
  hass.states["sensor.dishwasher_em_power_from_self"].state = "1.054";
  assert.equal(numeric(currentPower(config, hass.states, index).state), 1240);
  hass.states["sensor.dishwasher_em_power_from_grid"].state = "unavailable";
  assert.equal(currentPower(config, hass.states, index).state, undefined);
});
test("explicit unavailable power does not silently fall back to another reading", () => {
  const hass = fixture();
  const config = normalizeConfig({ prefix: "dishwasher_em", power_entity: "sensor.missing" });
  assert.equal(currentPower(config, hass.states, entityIndex(config, hass.states)).state, undefined);
});
test("basic profile does not invent sources or cycles", () => {
  const hass = fixture({ minimal: true });
  const config = normalizeConfig({ prefix: "dishwasher_em" });
  const index = entityIndex(config, hass.states);
  assert.deepEqual(sourceShares(config, hass.states, index, "daily"), []);
  assert.equal([...index.keys()].some(key => groupFor(key) === "cycles"), false);
});
test("shares use period energy percentages and never add self to solar plus battery", () => {
  const hass = fixture();
  const config = normalizeConfig({ prefix: "dishwasher_em" });
  const index = entityIndex(config, hass.states);
  const shares = sourceShares(config, hass.states, index, "daily");
  assert.deepEqual(shares.map(item => item.channel), ["solar", "battery", "grid"]);
  assert.equal(validShares(shares), true);
  shares[0].state.state = "unavailable";
  assert.equal(validShares(shares), false);
});
test("without both channel percentages the card uses self and grid", () => {
  const hass = fixture();
  delete hass.states["sensor.dishwasher_em_energy_from_battery_percentage_daily"];
  const config = normalizeConfig({ prefix: "dishwasher_em" });
  const shares = sourceShares(config, hass.states, entityIndex(config, hass.states), "daily");
  assert.deepEqual(shares.map(item => item.channel), ["self", "grid"]);
});
test("unknown, missing and zero remain distinct", () => {
  assert.equal(numeric({ state: "unknown" }), null);
  assert.equal(numeric({ state: "unavailable" }), null);
  assert.equal(numeric({ state: "0" }), 0);
  assert.equal(numeric({ state: "" }), null);
  assert.equal(numeric({ state: "NaN" }), null);
  assert.equal(formatState({ state: "unavailable", attributes: { status: "battery_not_charging" } }, "it"), "Batteria non in carica");
});
test("profiles do not suggest Running and Standby as new appliances", () => {
  const hass = fixture();
  assert.deepEqual(profilePrefixes(hass.states, hass.demoRegistry), ["dishwasher_em"]);
});
test("HTML from entity names or state attributes is escaped", () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});

test("forecast absence is explained using the integration status contract", async () => {
  const { formatState } = await import("../src/localize.js");
  assert.equal(formatState({ state: "unavailable", attributes: { status: "no_suitable_window_in_forecast" } }, "en"), "No suitable forecast window");
  assert.equal(formatState({ state: "unknown", attributes: { status: "forecast_unavailable" } }, "it"), "Previsione non disponibile");
});
