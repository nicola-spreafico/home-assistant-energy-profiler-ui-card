
import { numeric, isTechnical } from "./model.js";

const PERIOD = /_(hourly|daily|weekly|monthly|bimonthly|quarterly|yearly|lifetime)$/;
export function describeMetric(key) {
  const period = key.match(PERIOD)?.[1] || null;
  let context = key.startsWith("running_") ? "running" : key.startsWith("standby_") ? "standby" : "total";
  if (key.startsWith("cycle_live_")) context = "live";
  if (key.startsWith("cycle_completed_")) context = "completed";
  if (key.startsWith("cycles_") && key.endsWith("_mean")) context = "mean";
  let category = "consumption";
  if (isTechnical(key)) category = "technical";
  else if (/^(battery_|solar_ready_)/.test(key)) category = "readiness";
  else if (/_(index|advantage)_/.test(key)) category = "performance";
  else if (/cost|savings/.test(key)) category = "money";
  else if (/from_(self|grid|solar|battery)/.test(key)) category = "sources";
  else if (/^cycles?_/.test(key)) category = "cycles";
  else if (/^power_|^status$|^running$|^standby$|standby_duration/.test(key)) category = "activity";
  return { key, category, context, period, projection: key.includes("_instant_") };
}

export function modeBreakdown(totalState, runningState, standbyState) {
  const total = numeric(totalState), running = numeric(runningState), standby = numeric(standbyState);
  if (total === null || total <= 0) return null;
  const parts = [];
  if (running !== null && running >= 0) parts.push({ channel: "running", value: running });
  if (standby !== null && standby >= 0) parts.push({ channel: "standby", value: standby });
  if (!parts.length) return null;
  const known = parts.reduce((sum, part) => sum + part.value, 0);
  // Do not normalize inconsistent measurements into apparently valid shares.
  if (known > total + Math.max(0.0001, total * 0.005)) return null;
  if (total - known > Math.max(0.0001, total * 0.005)) parts.push({ channel: "unassigned", value: total - known });
  return parts.map(part => ({ ...part, percentage: 100 * part.value / total }));
}

export function cycleProgress(elapsedState, meanState) {
  const elapsed = numeric(elapsedState), mean = numeric(meanState);
  if (elapsed === null || elapsed < 0 || mean === null || mean <= 0) return null;
  return { elapsed, mean, percentage: Math.min(100, elapsed / mean * 100), remaining: Math.max(0, mean - elapsed), overrun: elapsed > mean };
}

export function durationLabel(value, lang) {
  if (!Number.isFinite(value) || value < 0) return "—";
  const seconds = Math.round(value), hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60);
  if (hours) return hours + " h " + (minutes ? minutes + " min" : "");
  if (minutes) return minutes + " min";
  return seconds + (lang === "it" ? " s" : " s");
}

export function normalizeDailySeries(rows) {
  // Lean stores the period's value in state; sum is a cumulative LTS baseline.
  // Never use sum as a daily reading and never fill absent days with zero.
  const points = new Map();
  for (const row of rows || []) {
    const value = row.state === null || row.state === undefined || row.state === "" ? NaN : Number(row.state);
    const timestamp = typeof row.start === "number" ? row.start : Date.parse(row.start);
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(timestamp)) continue;
    points.set(timestamp, { timestamp, value });
  }
  return [...points.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export function historyRequest(entityId, now = Date.now()) {
  return {
    type: "recorder/statistics_during_period",
    start_time: new Date(now - 15 * 86400000).toISOString(),
    end_time: new Date(now).toISOString(),
    statistic_ids: [entityId], period: "day", types: ["state"],
  };
}

const historyCache = new WeakMap();
export function fetchDailyHistory(hass, entityId, { refresh = false } = {}) {
  const owner = hass.connection || hass;
  let cache = historyCache.get(owner);
  if (!cache) { cache = new Map(); historyCache.set(owner, cache); }
  const cached = cache.get(entityId);
  if (!refresh && cached && Date.now() - cached.time < 300000) return cached.promise;
  const promise = Promise.resolve().then(() => hass.callWS(historyRequest(entityId))).then(data => normalizeDailySeries(data[entityId]));
  cache.set(entityId, { time: Date.now(), promise });
  promise.catch(() => { if (cache.get(entityId)?.promise === promise) cache.delete(entityId); });
  return promise;
}
