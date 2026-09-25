export const PERIODS = ["hourly", "daily", "weekly", "monthly", "bimonthly", "quarterly", "yearly", "lifetime"];
export const GROUPS = ["overview", "energy", "running", "cycles", "standby"];
const BINARY = new Set(["running", "standby", "battery_can_cover_average_cycle"]);
const INVALID = new Set(["unknown", "unavailable", "none", ""]);

export function normalizeConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Card configuration must be an object.");
  if (typeof config.prefix !== "string" || !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(config.prefix))
    throw new Error("Set prefix to the entity prefix, including its suffix (for example dishwasher_em).");
  const result = { period: "daily", language: "auto", show_sources: true, show_readiness: true, show_technical: false, ...config };
  if (!PERIODS.includes(result.period)) throw new Error("Unsupported period.");
  if (!["auto", "en", "it"].includes(result.language)) throw new Error("Language must be auto, en or it.");
  for (const key of ["show_sources", "show_readiness", "show_technical"])
    if (typeof result[key] !== "boolean") throw new Error(key + " must be true or false.");
  for (const key of ["name", "power_entity"])
    if (result[key] !== undefined && typeof result[key] !== "string") throw new Error(key + " must be a string.");
  const entityPattern = /^(sensor|binary_sensor)\.[a-z0-9_]+$/;
  if (result.power_entity && !/^sensor\.[a-z0-9_]+$/.test(result.power_entity)) throw new Error("power_entity must be a sensor entity ID.");
  if (result.entities !== undefined && (!result.entities || typeof result.entities !== "object" || Array.isArray(result.entities)))
    throw new Error("entities must map metric suffixes to entity IDs.");
  for (const [key, value] of Object.entries(result.entities || {}))
    if (!/^[a-z0-9_]+$/.test(key) || typeof value !== "string" || !entityPattern.test(value))
      throw new Error("Invalid entity override: " + key);
  return result;
}

export function numeric(state) {
  if (!state || INVALID.has(state.state) || state.state == null) return null;
  const value = Number(state.state);
  return Number.isFinite(value) ? value : null;
}

export function groupFor(key) {
  if (key === "status" || key.startsWith("power_")) return "overview";
  if (key === "running" || key.startsWith("running_energy_")) return "running";
  if (key === "standby" || key.startsWith("standby_")) return "standby";
  if (/^(cycles?_|battery_(can_cover|ready)_|solar_ready_)/.test(key)) return "cycles";
  if (key.startsWith("energy_")) return "energy";
  return null;
}

export function isTechnical(key) {
  return key.endsWith("_snapshot") || /_(daily|weekly|monthly|hourly|bimonthly|quarterly|yearly)_live$/.test(key);
}

export function entityIndex(config, states = {}, registry = []) {
  const index = new Map();
  const base = config.prefix + "_";
  for (const id of Object.keys(states)) {
    const [domain, slug] = id.split(".");
    if (!["sensor", "binary_sensor"].includes(domain) || !slug?.startsWith(base)) continue;
    const key = slug.slice(base.length);
    if (groupFor(key)) index.set(key, id);
  }
  // The registry's stable unique_id takes precedence over generated entity IDs.
  // This keeps the card attached to entities that the user renamed in HA.
  for (const entry of registry) {
    if (entry.platform !== "energy_profiler" || !entry.unique_id?.startsWith(base)) continue;
    const key = entry.unique_id.slice(base.length);
    if (groupFor(key)) {
      index.delete(key);
      if (!entry.disabled_by) index.set(key, entry.entity_id);
    }
  }
  for (const [key, id] of Object.entries(config.entities || {})) index.set(key, id);
  return index;
}

export function getEntity(config, states, index, key) {
  const id = index.get(key) || config.entities?.[key] ||
    (BINARY.has(key) ? "binary_sensor." : "sensor.") + config.prefix + "_" + key;
  return { key, id, state: states[id] };
}

export function availablePeriods(index, states) {
  return PERIODS.filter(period => {
    const id = index.get("energy_" + period);
    return id && states[id];
  });
}

export function profilePrefixes(states = {}, registry = []) {
  const prefixes = new Set();
  for (const state of Object.values(states)) {
    if (Array.isArray(state.attributes?.devices))
      for (const prefix of state.attributes.devices)
        if (typeof prefix === "string" && /^[a-z0-9_]+$/.test(prefix)) prefixes.add(prefix);
  }
  for (const entry of registry) {
    if (entry.platform === "energy_profiler" && entry.unique_id?.endsWith("_energy_lifetime") &&
      !/_(running|standby)_energy_lifetime$/.test(entry.unique_id)) {
      prefixes.add(entry.unique_id.slice(0, -"_energy_lifetime".length));
    }
  }
  // Without registry access, only suggest anchors which have a matching peak sensor.
  for (const id of Object.keys(states)) {
    if (!id.startsWith("sensor.") || !id.endsWith("_energy_lifetime")) continue;
    const prefix = id.slice(7, -"_energy_lifetime".length);
    if (states["sensor." + prefix + "_power_max"]) prefixes.add(prefix);
  }
  return [...prefixes].sort();
}

export function currentPower(config, states, index) {
  if (config.power_entity) return { id: config.power_entity, state: states[config.power_entity], derived: false };
  const self = getEntity(config, states, index, "power_from_self");
  const grid = getEntity(config, states, index, "power_from_grid");
  const watts = entity => {
    const value = numeric(entity.state);
    const unit = entity.state?.attributes?.unit_of_measurement;
    return value === null ? null : unit === "kW" ? value * 1000 : unit === "W" ? value : null;
  };
  const a = watts(self), b = watts(grid);
  return {
    derived: true,
    state: a !== null && b !== null ? { state: String(a + b), attributes: { unit_of_measurement: "W" } } : undefined,
  };
}

export function sourceShares(config, states, index, period) {
  const exists = key => index.has(key) || Boolean(states["sensor." + config.prefix + "_" + key]);
  const solar = "energy_from_solar_percentage_" + period;
  const battery = "energy_from_battery_percentage_" + period;
  const channels = exists(solar) && exists(battery) ? ["solar", "battery", "grid"] : ["self", "grid"];
  return channels.map(channel => ({
    channel,
    ...getEntity(config, states, index, "energy_from_" + channel + "_percentage_" + period),
  })).filter(item => index.has(item.key) || item.state);
}

export function validShares(shares) {
  const values = shares.map(item => numeric(item.state));
  return values.length >= 2 && values.every(value => value !== null && value >= 0 && value <= 100) &&
    Math.abs(values.reduce((a, b) => a + b, 0) - 100) < 1.5;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
