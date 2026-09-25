const EN = {
  overview: "Overview", energy: "Energy", running: "Running", cycles: "Cycles", standby: "Standby",
  details: "Explore profile", close: "Close details", period: "Period", search: "Find a measurement",
  all: "All measurements", technical: "Technical helpers", power: "Power now", consumption: "Consumption",
  cost: "Consumption value", gridCost: "Grid cost", sources: "Energy sources", battery: "Battery",
  solar: "Solar", grid: "Grid", self: "Self", readiness: "Can I run a cycle?", now: "Ready now",
  cover: "Battery covers an average cycle", yes: "Yes", no: "Not yet", missing: "Not available",
  unknown: "Unknown", unavailable: "Unavailable", noData: "No entities found for this profile. Check the prefix and integration.",
  noResults: "No matching measurements.", registry: "Entity lookup is using names. If entities were renamed, add explicit overrides.",
  hourly: "This hour", daily: "Today", weekly: "This week", monthly: "This month",
  bimonthly: "This two-month period", quarterly: "This quarter", yearly: "This year", lifetime: "All time",
  estimate: "Estimates based on valid average cycles. Battery coverage does not reserve energy or account for other loads.",
  forecastNote: "Solar readiness uses the current house baseline and a complete forecast window for an average cycle.",
  no_suitable_window_in_forecast: "No suitable forecast window",
  forecast_unavailable: "Forecast unavailable", invalid_or_missing_cycle_or_load: "Waiting for valid cycle and house load data",
  cycles_energy_mean: "Average cycle energy", cycles_duration_mean: "Average cycle duration", cycles_cost_mean: "Average cycle cost", battery_not_charging: "Battery is not charging",
  invalid_or_missing_cycle_or_battery: "Waiting for valid cycle and battery data",
  already_available: "Ready now", charging: "Charging", off: "Off", on: "On", poweroff: "Off", poweron: "On",
  configured: "Configured profile", settings: "Card settings", prefix: "Profile prefix", name: "Display name (optional)",
  power_entity: "Power entity (optional)", language: "Language", auto: "Automatic", show_sources: "Show energy sources",
  show_readiness: "Show cycle readiness", show_technical: "Show technical helpers",
  battery_ready_for_average_cycle_at: "Battery ready at", solar_ready_for_average_cycle_at: "Solar ready at",
  battery_can_cover_average_cycle: "Battery covers an average cycle", power_max: "Peak power",
  status: "Status", standby_duration: "Current standby duration", running_energy: "Running energy",
  standby_energy: "Standby energy", from: "from", percentage: "share", mean: "average", completed: "last valid cycle",
  live: "in progress", duration: "duration", count: "count", savings: "savings", index: "index", advantage: "advantage",
  cycle: "cycle", validation: "validation", snapshot: "snapshot", start: "start", stop: "stop",
  costovertime: "cost per hour", summary: "summary", human: "", instant: "projected", attributes: "Entity attributes",
  extra: "More measurements", selectProfile: "Select a profile", sourcePeriod: "Energy-weighted shares for the selected period",
};
const IT = {
  overview: "Panoramica", energy: "Energia", running: "Funzionamento", cycles: "Cicli", standby: "Standby",
  details: "Esplora profilo", close: "Chiudi dettagli", period: "Periodo", search: "Cerca una misura",
  all: "Tutte le misure", technical: "Sensori tecnici", power: "Potenza attuale", consumption: "Consumo",
  cost: "Valore del consumo", gridCost: "Costo di rete", sources: "Origine dell’energia", battery: "Batteria",
  solar: "Solare", grid: "Rete", self: "Autoproduzione", readiness: "Posso avviare un ciclo?", now: "Pronta ora",
  cover: "La batteria copre un ciclo medio", yes: "Sì", no: "Non ancora", missing: "Non disponibile",
  unknown: "Sconosciuto", unavailable: "Non disponibile", noData: "Nessuna entità per questo profilo. Controlla prefisso e integrazione.",
  noResults: "Nessuna misura corrispondente.", registry: "Ricerca tramite nomi. Se hai rinominato le entità, configura gli override.",
  hourly: "Quest’ora", daily: "Oggi", weekly: "Questa settimana", monthly: "Questo mese",
  bimonthly: "Questo bimestre", quarterly: "Questo trimestre", yearly: "Quest’anno", lifetime: "Totale",
  estimate: "Stime basate sui cicli medi validi. La copertura della batteria non riserva energia e non considera gli altri carichi.",
  forecastNote: "La previsione solare usa il consumo attuale della casa e una finestra completa per un ciclo medio.",
  no_suitable_window_in_forecast: "Nessuna finestra solare adatta",
  forecast_unavailable: "Previsione non disponibile", invalid_or_missing_cycle_or_load: "In attesa di dati validi su cicli e carico domestico",
  cycles_energy_mean: "Energia media per ciclo", cycles_duration_mean: "Durata media del ciclo", cycles_cost_mean: "Costo medio per ciclo", battery_not_charging: "Batteria non in carica",
  invalid_or_missing_cycle_or_battery: "In attesa di dati validi su cicli e batteria",
  already_available: "Pronta ora", charging: "In carica", off: "Spento", on: "Acceso", poweroff: "Spento", poweron: "Acceso",
  configured: "Profilo configurato", settings: "Impostazioni card", prefix: "Prefisso del profilo", name: "Nome visualizzato (facoltativo)",
  power_entity: "Entità della potenza (facoltativa)", language: "Lingua", auto: "Automatica", show_sources: "Mostra origine energia",
  show_readiness: "Mostra disponibilità per un ciclo", show_technical: "Mostra sensori tecnici",
  battery_ready_for_average_cycle_at: "Batteria pronta alle", solar_ready_for_average_cycle_at: "Solare disponibile alle",
  battery_can_cover_average_cycle: "La batteria copre un ciclo medio", power_max: "Picco di potenza",
  status: "Stato", standby_duration: "Durata standby attuale", running_energy: "Energia in funzionamento",
  standby_energy: "Energia in standby", from: "da", percentage: "percentuale", mean: "media", completed: "ultimo ciclo valido",
  live: "in corso", duration: "durata", count: "conteggio", savings: "risparmio", index: "indice", advantage: "vantaggio",
  cycle: "ciclo", validation: "validazione", snapshot: "istantanea", start: "inizio", stop: "fine",
  costovertime: "costo orario", summary: "riepilogo", human: "", instant: "previsto", attributes: "Attributi dell’entità",
  extra: "Altre misure", selectProfile: "Seleziona un profilo", sourcePeriod: "Percentuali ponderate sull’energia del periodo selezionato",
};
export function language(config, hass) {
  const requested = config?.language === "auto" ? (hass?.locale?.language || hass?.language || "en") : config?.language;
  return requested?.startsWith("it") ? "it" : "en";
}
export function translate(key, lang) { return (lang === "it" ? IT : EN)[key] ?? EN[key] ?? key; }
export function metricLabel(key, lang) {
  const dict = lang === "it" ? IT : EN;
  if (dict[key]) return dict[key];
  const match = key.match(/^(?:(running|standby)_)?energy(.*?)_(hourly|daily|weekly|monthly|bimonthly|quarterly|yearly|lifetime)$/);
  if (match) {
    const [, group, metric, period] = match;
    const labels = lang === "it" ? {
      "": "Consumo", "_cost": "Valore del consumo", "_from_grid_cost": "Costo di rete",
      "_from_grid_savings": "Risparmio sulla rete", "_from_self_index": "Indice di autoproduzione",
      "_from_self_advantage": "Vantaggio di autoproduzione",
    } : {
      "": "Consumption", "_cost": "Consumption value", "_from_grid_cost": "Grid cost",
      "_from_grid_savings": "Grid savings", "_from_self_index": "Self-energy index",
      "_from_self_advantage": "Self-energy advantage",
    };
    let label = labels[metric];
    const source = metric.match(/^_from_(self|grid|solar|battery)(_percentage)?$/);
    if (source) label = (source[2] ? (lang === "it" ? "Quota · " : "Share · ") : (lang === "it" ? "Energia · " : "Energy · ")) + translate(source[1], lang);
    if (label) return (group ? translate(group, lang) + " · " : "") + label + " · " + translate(period, lang);
  }
  const result = key.split("_").map(token => dict[token] ?? EN[token] ?? token).filter(Boolean).join(" ");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
export function formatState(state, lang, timeZone) {
  if (!state) return translate("missing", lang);
  if (["unknown", "unavailable"].includes(state.state)) {
    const status = state.attributes?.status;
    return status && (IT[status] || EN[status]) ? translate(status, lang) : translate(state.state, lang);
  }
  if (state.attributes?.status === "already_available") return translate("now", lang);
  if (state.attributes?.device_class === "timestamp") {
    const date = new Date(state.state);
    if (Number.isFinite(date.getTime())) {
      const options = { dateStyle: "short", timeStyle: "short", ...(timeZone ? { timeZone } : {}) };
      try { return new Intl.DateTimeFormat(lang, options).format(date); } catch { return date.toLocaleString(lang); }
    }
  }
  const value = state.state === "" ? NaN : Number(state.state);
  if (Number.isFinite(value)) {
    const unit = state.attributes?.unit_of_measurement || "";
    const precision = unit === "%" || unit === "W" ? 1 : 2;
    return new Intl.NumberFormat(lang, { maximumFractionDigits: precision }).format(value) + (unit ? " " + unit : "");
  }
  return translate(state.state, lang);
}
