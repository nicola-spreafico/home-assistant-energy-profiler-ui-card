export function fixture({ minimal = false, unavailable = false, renamed = false } = {}) {
  const prefix = "dishwasher_em";
  const states = {};
  const registry = [];
  const add = (key, value, unit, attributes = {}) => {
    const binary = ["running", "standby", "battery_can_cover_average_cycle"].includes(key);
    const standard = (binary ? "binary_sensor." : "sensor.") + prefix + "_" + key;
    const id = renamed && key === "energy_daily" ? "sensor.my_daily_consumption" : standard;
    states[id] = { entity_id: id, state: unavailable ? "unavailable" : String(value), attributes: { ...(unit ? { unit_of_measurement: unit } : {}), ...attributes } };
    registry.push({ entity_id: id, unique_id: prefix + "_" + key, platform: "energy_profiler", disabled_by: null });
  };
  add("power_max", 2140, "W");
  for (const [period, scale] of [["daily", 1], ["monthly", 12], ["yearly", 118], ["lifetime", 270]]) {
    for (const [base, factor] of [["energy", 1], ["running_energy", .95], ["standby_energy", .05]]) {
      if (minimal && base !== "energy") continue;
      const kwh = 1.8 * scale * factor;
      add(base + "_" + period, kwh, "kWh");
      if (minimal) continue;
      add(base + "_cost_" + period, kwh * .3, "€");
      add(base + "_from_grid_cost_" + period, kwh * .3 * .15, "€");
      add(base + "_from_grid_savings_" + period, kwh * .3 * .85, "€");
      for (const [source, fraction] of [["solar", .65], ["battery", .2], ["grid", .15], ["self", .85]]) {
        add(base + "_from_" + source + "_" + period, kwh * fraction, "kWh");
        add(base + "_from_" + source + "_percentage_" + period, fraction * 100, "%");
      }
    }
    if (!minimal) {
      add("energy_from_self_index_" + period, 1.23, "×");
      add("energy_from_self_advantage_" + period, .28 * scale, "kWh");
      add("cycles_count_" + period, Math.ceil(scale), undefined);
      add("cycles_duration_" + period, 5400 * scale, "s");
    }
  }
  if (!minimal) {
    add("status", "running");
    add("running", "on");
    add("standby", "off");
    add("standby_duration", 0, "s");
    add("power_from_self", 1054, "W");
    add("power_from_grid", 186, "W");
    add("power_from_solar", 806, "W");
    add("power_from_battery", 248, "W");
    add("cycle_validation_status", "valid");
    add("cycles_count_lifetime", 127);
    add("cycles_energy_mean", 1.28, "kWh");
    add("cycles_duration_mean", 5400, "s");
    add("cycles_cost_mean", .38, "€");
    add("cycle_live_energy", .64, "kWh");
    add("cycle_live_duration", 2700, "s");
    add("cycle_live_cost", .19, "€");
    add("cycle_completed_energy", 1.31, "kWh");
    add("cycle_completed_duration", 5480, "s");
    add("cycle_completed_cost", .39, "€");
    add("cycle_start_snapshot", "2026-09-25T10:00:00Z", undefined, { initial_energy: 300 });
    add("energy_from_self_percentage_daily_live", 85, "%");
    add("battery_can_cover_average_cycle", "on", undefined, { average_cycle_energy_kwh: 1.28, battery_available_energy_kwh: 4.7 });
    add("battery_ready_for_average_cycle_at", "2026-09-25T10:30:00Z", undefined, { device_class: "timestamp", status: "already_available" });
    add("solar_ready_for_average_cycle_at", "2026-09-26T10:00:00Z", undefined, { device_class: "timestamp" });
  }
  states["sensor.energy_profiler_configuration"] = {
    entity_id: "sensor.energy_profiler_configuration", state: "1", attributes: { devices: [prefix] },
  };
  states["sensor.dishwasher_power"] = { entity_id: "sensor.dishwasher_power", state: unavailable ? "unavailable" : "1240", attributes: { unit_of_measurement: "W" } };
  const listeners = new Set();
  const connection = {
    subscribeEvents: async callback => { listeners.add(callback); return () => listeners.delete(callback); },
  };
  return {
    states, locale: { language: "en" }, config: { time_zone: "Europe/Rome" }, connection,
    callWS: async message => {
      if (message.type === "config/entity_registry/list") return registry;
      throw new Error("Unsupported demo request");
    },
    demoRegistry: registry,
    demoRegistryChanged: () => listeners.forEach(callback => callback({ event_type: "entity_registry_updated" })),
  };
}
