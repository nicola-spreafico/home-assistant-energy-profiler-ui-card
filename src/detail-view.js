
import { PERIODS, sourceShares, validShares, numeric, currentPower, escapeHtml as esc } from "./model.js";
import { metricLabel } from "./localize.js";
import { describeMetric, modeBreakdown, cycleProgress, durationLabel } from "./detail-model.js";
import { detailText } from "./detail-localize.js";

const ICONS = {
  battery: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="16" height="12" rx="2"/><path d="M21 10v4M11 8l-3 5h4l-1 3"/></svg>',
  solar: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></svg>',
};
const COLORS = { solar: "#d9a21a", battery: "#7e8ee5", grid: "#8ba1ad", self: "#269f92", running: "#269f92", standby: "#b69a70", unassigned: "#aebbc2" };
const TABS = ["summary", "energy", "cycles", "plan", "standby", "insights", "measurements"];
const CATEGORIES = ["consumption", "sources", "money", "cycles", "readiness", "performance", "activity", "technical"];
export function renderDetail(card) {
  const t = key => detailText(key, card._lang), e = key => card._entity(key), exists = key => card._exists(key);
  const value = key => /duration/.test(key) && numeric(e(key).state) !== null
    ? durationLabel(numeric(e(key).state), card._lang) : card._value(e(key).state);
  const p = card._period, suffix = key => key + "_" + p;
  const hasCycles = [...card._index.keys()].some(key => /^cycle/.test(key) && exists(key));
  const hasPlan = card._config.show_readiness && ["battery_can_cover_average_cycle", "battery_ready_for_average_cycle_at", "solar_ready_for_average_cycle_at"].some(exists);
  const hasStandby = [...card._index.keys()].some(key => key.startsWith("standby") && exists(key));
  const hasInsights = ["energy_from_self_index", "energy_from_self_advantage"].some(key => exists(suffix(key)));
  const tabs = TABS.filter(tab => tab !== "cycles" || hasCycles).filter(tab => tab !== "plan" || hasPlan).filter(tab => tab !== "standby" || hasStandby).filter(tab => tab !== "insights" || hasInsights);
  if (!tabs.includes(card._detailTab)) card._detailTab = "summary";
  const query = card._search.trim().toLocaleLowerCase(card._lang);
  const action = (key, label, className = "") => exists(key) ? `<button type="button" class="metric-link ${className}" data-entity="${esc(e(key).id)}">${label}</button>` : "";
  const kpi = (key, label, hint = "") => exists(key) ? action(key, `<small>${esc(label)}</small><strong>${esc(value(key))}</strong>${hint ? `<span class="kpi-hint">${esc(hint)}</span>` : ""}`, "detail-kpi") : "";
  const heading = (title, note = "") => `<div class="section-heading"><h3>${esc(t(title))}</h3>${note ? `<p>${esc(t(note))}</p>` : ""}</div>`;
  const panel = (title, note, content, cls = "") => content && content.replace(/<[^>]*>/g, "").trim() ? `<section class="detail-panel ${cls}">${heading(title, note)}${content}</section>` : "";
  const jump = (tab, text) => `<button type="button" class="text-action" data-tab="${tab}">${esc(t(text))}<span aria-hidden="true"> ↗</span></button>`;
  const info = text => `<p class="detail-empty">${esc(t(text))}</p>`;

  function sources(base = "energy") {
    if (!card._config.show_sources) return "";
    const shares = sourceShares(card._config, card._hass.states, card._index, p).map(item => ({
      ...item, ...e(item.key.replace(/^energy/, base)),
    })).filter(item => item.state);
    if (!shares.length) return "";
    const valid = validShares(shares);
    let offset = 0;
    const arcs = valid ? shares.map(item => {
      const part = numeric(item.state);
      const arc = `<circle cx="60" cy="60" r="45" pathLength="100" fill="none" stroke="${COLORS[item.channel]}" stroke-width="12" stroke-dasharray="${part} ${100 - part}" stroke-dashoffset="${-offset}" transform="rotate(-90 60 60)"/>`;
      offset += part; return arc;
    }).join("") : "";
    const center = numeric(e(base + "_from_self_percentage_" + p).state);
    return `<div class="source-layout">
      <div class="donut-wrap"><svg viewBox="0 0 120 120" role="img" aria-label="${esc(t("sourcesTitle"))}">
        <circle cx="60" cy="60" r="45" fill="none" stroke="var(--ep-line)" stroke-width="12"/>${arcs}
      </svg><div class="donut-center"><strong>${valid && center !== null ? esc(new Intl.NumberFormat(card._lang, { maximumFractionDigits: 0 }).format(center)) + "%" : "—"}</strong><small>${esc(t("selfShare"))}</small></div></div>
      <div class="source-values">${shares.map(item => {
        const energyKey = base + "_from_" + item.channel + "_" + p;
        return `<div class="source-item"><i style="background:${COLORS[item.channel]}" aria-hidden="true"></i><span>${esc(t(item.channel))}</span>
          ${action(item.key, esc(card._value(item.state)), "source-pct")}
          ${exists(energyKey) ? action(energyKey, esc(value(energyKey)), "source-energy") : ""}</div>`;
      }).join("")}</div></div>${!valid ? info("splitEmpty") : ""}`;
  }

  function horizontal(parts, unit = "kWh") {
    const max = Math.max(...parts.map(part => part.value ?? 0), 0);
    return `<div class="bar-list">${parts.map(part => `<div class="bar-item">
      <div><span>${esc(t(part.label || part.channel))}</span><strong>${part.value === null ? "—" : esc(new Intl.NumberFormat(card._lang, { maximumFractionDigits: 2 }).format(part.value)) + " " + esc(unit)}</strong></div>
      <div class="bar-track" aria-hidden="true"><span style="width:${max > 0 && part.value !== null ? Math.max(0, part.value / max * 100) : 0}%;background:${COLORS[part.channel] || "var(--ep-accent)"}"></span></div>
    </div>`).join("")}</div>`;
  }

  function modes() {
    if (!exists(suffix("running_energy")) && !exists(suffix("standby_energy"))) return "";
    const parts = modeBreakdown(e(suffix("energy")).state, e(suffix("running_energy")).state, e(suffix("standby_energy")).state);
    return (parts ? `<div class="mode-strip" aria-hidden="true">${parts.map(part => `<span style="width:${part.percentage}%;background:${COLORS[part.channel]}"></span>`).join("")}</div>` +
      horizontal(parts) : `<div class="kpi-grid">${kpi(suffix("running_energy"), t("running"))}${kpi(suffix("standby_energy"), t("standby"))}</div>`) + modeTable();
  }

  function modeTable() {
    return `<div class="comparison-scroll mode-table"><table class="comparison"><thead><tr><th>${esc(t("context"))}</th><th>${esc(t("consumption"))}</th><th>${esc(t("gridCost"))}</th><th>${esc(t("selfShare"))}</th></tr></thead><tbody>${[["total", "energy"], ["running", "running_energy"], ["standby", "standby_energy"]].filter(([,base]) => exists(suffix(base))).map(([label,base]) => `<tr><th scope="row">${esc(t(label))}</th>${[base,base+"_from_grid_cost",base+"_from_self_percentage"].map(metric => `<td>${action(suffix(metric),esc(value(suffix(metric)))) || "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function money(base = "energy") {
    const paidKey = base + "_from_grid_cost_" + p, savedKey = base + "_from_grid_savings_" + p, totalKey = base + "_cost_" + p;
    if (![paidKey, savedKey, totalKey].some(exists)) return "";
    const parts = [
      { channel: "grid", label: "paid", value: numeric(e(paidKey).state) },
      { channel: "self", label: "avoided", value: numeric(e(savedKey).state) },
    ].filter((_, i) => exists(i ? savedKey : paidKey));
    return (parts.length ? horizontal(parts, e(paidKey).state?.attributes?.unit_of_measurement || e(savedKey).state?.attributes?.unit_of_measurement || "€") : "") +
      `<div class="kpi-grid money-kpis">${kpi(paidKey, t("paid"))}${kpi(savedKey, t("avoided"))}${kpi(totalKey, t("valuation"))}</div>`;
  }

  function history() {
    const h = card._history || { status: "idle", points: [] };
    let content;
    if (h.status !== "ready") content = info(h.status === "error" ? "historyUnavailable" : h.status === "unsupported" ? "historyNoMeter" : "loading");
    else if (!h.points.length) content = info("historyEmpty");
    else {
      const chartWidth = Math.max(280, Math.min(640, (card._dialog.clientWidth || 726) - 86));
      const points = h.points, max = Math.max(...points.map(point => point.value), 0), left = 42, right = chartWidth - 20, top = 22, bottom = 160;
      const start = points[0].timestamp, span = Math.max(86400000, points.at(-1).timestamp - start + 86400000);
      const width = Math.max(2, Math.min(30, (right - left) * 86400000 / span * .65));
      const date = stamp => new Intl.DateTimeFormat(card._lang, { day: "numeric", month: "short", timeZone: card._hass.config?.time_zone || "UTC" }).format(stamp);
      const fmt = number => new Intl.NumberFormat(card._lang, { maximumFractionDigits: 2 }).format(number);
      content = `<svg class="history-chart" viewBox="0 0 ${chartWidth} 205" role="img" aria-label="${esc(t("historyTitle"))}">
        ${[0, .5, 1].map(fraction => `<line x1="${left}" y1="${bottom - fraction * (bottom - top)}" x2="${right}" y2="${bottom - fraction * (bottom - top)}" class="chart-grid"/><text x="33" y="${bottom - fraction * (bottom - top) + 4}" text-anchor="end">${esc(fmt(max * fraction))}</text>`).join("")}
        <text x="${left}" y="12">kWh</text>
        ${points.map(point => { const x = left + (point.timestamp - start + 43200000) / span * (right - left); const height = max > 0 ? point.value / max * (bottom - top) : 0;
          return `<rect x="${x - width / 2}" y="${bottom - height}" width="${width}" height="${point.value === 0 ? 0 : Math.max(1, height)}" rx="3" fill="var(--ep-accent)"><title>${esc(date(point.timestamp))}: ${esc(fmt(point.value))} kWh</title></rect>`; }).join("")}
        ${[...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])].map(i => `<text x="${left + (points[i].timestamp - start + 43200000) / span * (right - left)}" y="185" text-anchor="middle">${esc(date(points[i].timestamp))}</text>`).join("")}
      </svg>
      <details class="chart-values" data-disclosure="history"><summary>${esc(t("historyTable"))}</summary><table><thead><tr><th>${esc(t("date"))}</th><th>kWh</th></tr></thead><tbody>${points.map(point => `<tr><td>${esc(date(point.timestamp))}</td><td>${esc(fmt(point.value))}</td></tr>`).join("")}</tbody></table></details>`;
    }
    return panel("historyTitle", "historyRange", `<div class="chart-content" aria-live="polite">${content}</div><div class="chart-foot"><span>${esc(t("historyNote"))}</span><button type="button" class="text-action" data-refresh-history>${esc(t("refresh"))}</button></div>`);
  }

  function cycleLive() {
    if (!hasCycles) return "";
    const runningState = e("running").state?.state;
    const running = runningState === "on";
    const known = ["on", "off"].includes(runningState);
    const progress = running ? cycleProgress(e("cycle_live_duration").state, e("cycles_duration_mean").state) : null;
    return `<div class="cycle-live ${running ? "active" : ""}">
      <div class="cycle-live-top"><span class="pulse" aria-hidden="true"></span><h3>${esc(t(running ? "currentCycle" : known ? "idleCycle" : "noReadings"))}</h3>${exists("status") ? `<span class="status">${esc(value("status"))}</span>` : ""}</div>
      ${running ? `<div class="kpi-grid">${kpi("cycle_live_energy", t("consumption"))}${kpi("cycle_live_duration", t("elapsed"))}${kpi("cycle_live_cost", t("cost"))}</div>` : ""}
      ${progress ? `<div class="cycle-progress" role="meter" aria-label="${esc(t("elapsed"))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress.percentage)}"><span style="width:${progress.percentage}%"></span></div>
      <p class="progress-caption">${esc(t(progress.overrun ? "longer" : "remaining"))}${!progress.overrun ? ": " + esc(durationLabel(progress.remaining, card._lang)) : ""}</p><p class="fine-print">${esc(t("progressNote"))}</p>` : ""}
    </div>`;
  }

  function cycleComparison() {
    const rows = [
      ["consumption", "cycle_live_energy", "cycle_completed_energy", "cycles_energy_mean"],
      ["duration", "cycle_live_duration", "cycle_completed_duration", "cycles_duration_mean"],
      ["cost", "cycle_live_cost", "cycle_completed_cost", "cycles_cost_mean"],
      ["gridCost", "cycle_live_cost_from_grid", "cycle_completed_energy_from_grid_cost", "cycles_energy_from_grid_cost_mean"],
      ["selfShare", "cycle_live_from_self_percentage", "cycle_completed_from_self_percentage", "cycles_from_self_percentage_mean"],
      ["solar", "cycle_live_energy_from_solar", "cycle_completed_energy_from_solar", "cycles_energy_from_solar_mean"],
      ["battery", "cycle_live_energy_from_battery", "cycle_completed_energy_from_battery", "cycles_energy_from_battery_mean"],
      ["grid", "cycle_live_energy_from_grid", "cycle_completed_energy_from_grid", "cycles_energy_from_grid_mean"],
      ["savings", "cycle_live_savings_from_grid", "cycle_completed_energy_from_grid_savings", "cycles_energy_from_grid_savings_mean"],
    ].filter(row => row.slice(1).some(exists));
    return `<div class="comparison-scroll"><table class="comparison"><thead><tr><th>${esc(t("metric"))}</th><th>${esc(t("live"))}</th><th>${esc(t("completed"))}</th><th>${esc(t("mean"))}</th></tr></thead>
      <tbody>${rows.map(([label, ...keys]) => `<tr><th scope="row">${esc(t(label))}</th>${keys.map((key, i) => `<td>${i === 0 && e("running").state?.state !== "on" ? "—" : action(key, esc(value(key))) || "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function plan() {
    if (!hasPlan) return "";
    const coverage = e("battery_can_cover_average_cycle").state, attrs = coverage?.attributes || {};
    const batteryAttrs = e("battery_ready_for_average_cycle_at").state?.attributes || {};
    const available = attrs.battery_available_energy_kwh ?? batteryAttrs.battery_available_energy_kwh;
    const demand = attrs.average_cycle_energy_kwh ?? batteryAttrs.average_cycle_energy_kwh ?? numeric(e("cycles_energy_mean").state);
    const gauge = Number.isFinite(available) && available >= 0 && Number.isFinite(demand) && demand > 0
      ? `<div class="battery-gauge" aria-hidden="true"><span style="width:${Math.min(100, available / demand * 100)}%"></span></div><div class="battery-values"><span>${esc(t("batteryStored"))}<strong>${esc(card._value({ state: String(available), attributes: { unit_of_measurement: "kWh" } }))}</strong></span><span>${esc(t("required"))}<strong>${esc(value("cycles_energy_mean"))}</strong></span></div>` : "";
    const coverageHtml = coverage ? `<article class="planning-card"><span class="planning-icon" aria-hidden="true">${ICONS.battery}</span><h3>${esc(t("batteryQuestion"))}</h3><strong class="planning-answer ${coverage.state === "on" ? "positive" : ""}">${esc(coverage.state === "on" ? t("ready") : coverage.state === "off" ? t("notReady") : card._value(coverage))}</strong>${gauge}<p>${esc(t("batteryNote"))}</p></article>` : "";
    return `<div class="planning-grid">${coverageHtml}${["battery_ready_for_average_cycle_at", "solar_ready_for_average_cycle_at"].filter(exists).map((key, i) => `<article class="planning-card"><span class="planning-icon ${key.startsWith("solar") ? "sun-tone" : ""}" aria-hidden="true">${ICONS[key.startsWith("solar") ? "solar" : "battery"]}</span><h3>${esc(t(key.startsWith("solar") ? "solarAt" : "batteryAt"))}</h3>${action(key, esc(value(key)), "planning-time")}<p>${esc(t(key.startsWith("solar") ? "solarNote" : "batteryNote"))}</p></article>`).join("")}</div>`;
  }

  function insights() {
    const key = suffix("energy_from_self_index"), n = numeric(e(key).state);
    const advantage = suffix("energy_from_self_advantage");
    return panel("performanceTitle", "", `<div class="insight-grid"><article><span class="eyebrow">${esc(t("indexTitle"))}</span>${kpi(key, t("selfShare"))}
      ${n !== null && n >= 0 ? `<div class="benchmark-track" aria-hidden="true"><span style="left:${Math.min(100, n / Math.max(2, n) * 100)}%"></span><i style="left:${100 / Math.max(2, n)}%"></i></div><div class="benchmark-label">1× · ${esc(t("benchmark"))}</div>` : ""}<p class="fine-print">${esc(t("indexNote"))}</p></article>
      <article>${kpi(advantage, t("advantageTitle"))}<p class="fine-print">${esc(t("advantageNote"))}</p></article></div>`);
  }

  function windows() {
    return panel("periodTotals", "periodTotalsNote", `<div class="window-grid">${PERIODS.filter(period => period !== "lifetime" && exists("energy_" + period)).map(period => kpi("energy_" + period, card._t(period))).join("")}${kpi("energy_lifetime", t("lifetime"))}</div>`);
  }

  function measurements() {
    const groups = new Map();
    for (const key of card._index.keys()) {
      if (!exists(key)) continue;
      const metadata = describeMetric(key);
      if (metadata.category === "technical" && !card._config.show_technical) continue;
      if (metadata.category === "readiness" && !card._config.show_readiness) continue;
      if (!query && metadata.period && ![p, "lifetime"].includes(metadata.period) && !metadata.projection) continue;
      const text = [key, metricLabel(key, card._lang), e(key).id, t(metadata.category + "Group")].join(" ").toLocaleLowerCase(card._lang);
      if (query && !text.includes(query)) continue;
      if (!groups.has(metadata.category)) groups.set(metadata.category, []);
      groups.get(metadata.category).push({ key, ...metadata });
    }
    return `<p class="fine-print">${esc(t("measurementHint"))}</p>` + (groups.size ? CATEGORIES.filter(category => groups.has(category)).map(category =>
      `<section class="measurement-section" data-category="${category}"><h3>${esc(t(category + "Group"))}<span>${groups.get(category).length}</span></h3><div class="measurement-list">${groups.get(category).sort((a,b) => a.context.localeCompare(b.context) || a.key.localeCompare(b.key)).map(item =>
        `<div class="measurement-row"><div><span class="context-chip">${esc(t(item.context))}</span><span>${esc(metricLabel(item.key, card._lang))}</span>${card._config.show_technical ? `<small>${esc(e(item.key).id)}</small>` : ""}</div>${action(item.key, esc(value(item.key)))}</div>`).join("")}</div></section>`
    ).join("") : info("noSearch"));
  }

  const power = currentPower(card._config, card._hass.states, card._index);
  const liveSummary = `<div class="live-summary"><span class="live-label">${esc(t("liveNow"))}</span><span>${esc(card._t("power"))}<strong>${esc(card._value(power.state))}</strong></span>${exists("power_max") ? `<span>${esc(card._t("power_max"))}<strong>${esc(value("power_max"))}</strong></span>` : ""}${exists("status") ? `<span class="status">${esc(value("status"))}</span>` : ""}</div>`;
  const hero = `<div class="detail-hero"><div><span class="eyebrow">${esc(card._t(p))}</span>${action(suffix("energy"), `<span class="hero-number">${esc(value(suffix("energy")))}</span><span class="hero-caption">${esc(t("periodEnergy"))}</span>`)}</div><div class="hero-side">${kpi(suffix("energy_from_grid_cost"), t("gridCost"))}${kpi(suffix("energy_from_self_percentage"), t("selfShare"))}</div></div>`;
  let content;
  if (query || card._detailTab === "measurements") content = measurements();
  else if (card._detailTab === "summary") content = hero + liveSummary + `<div class="detail-grid">${panel("sourcesTitle", "sourceNote", sources())}${hasCycles ? panel("activity", "", cycleLive() + jump("cycles", "seeCycles")) : panel("activity", "", `<div class="kpi-grid">${kpi("power_max", card._t("power_max"))}</div>`)}</div>` + history() + (hasPlan ? panel("readinessTitle", "", plan()) : "");
  else if (card._detailTab === "energy") content = hero + history() + `<div class="detail-grid">${panel("sourcesTitle", "sourceNote", sources())}${panel("moneyTitle", "moneyNote", money())}</div>` +
    panel("modesTitle", "modeNote", modes()) + panel("projections", "projectionsNote", `<div class="window-grid">${PERIODS.filter(period => exists("energy_cost_instant_" + period)).map(period => kpi("energy_cost_instant_" + period, card._t(period))).join("")}</div>`) + windows();
  else if (card._detailTab === "cycles") content = cycleLive() + `<div class="kpi-grid cycle-average">${kpi("cycles_energy_mean", t("typicalEnergy"))}${kpi("cycles_duration_mean", t("typicalDuration"))}${kpi("cycles_cost_mean", t("typicalCost"))}${kpi("cycles_count_lifetime", t("validCycles"))}</div>` +
    (numeric(e("cycles_energy_mean").state) === null ? info("noCycleData") : "") +
    panel("cycleComparison", "comparisonNote", cycleComparison()) +
    panel("cycleBoundaries", "", `<div class="kpi-grid">${kpi("cycle_completed_start", t("started"))}${kpi("cycle_completed_stop", t("finished"))}${kpi(suffix("cycles_count"), t("periodCycles"))}${kpi(suffix("cycles_duration"), t("duration"))}</div>`) +
    (exists("cycle_validation_status") ? `<div class="validation"><span>${esc(t("lastAttempt"))}</span><strong>${esc(t(e("cycle_validation_status").state.state))}</strong></div>` : "");
  else if (card._detailTab === "plan") content = panel("readinessTitle", "", plan());
  else if (card._detailTab === "standby") content = panel("standbyTitle", "standbyNote", `<div class="kpi-grid">${kpi(suffix("standby_energy"), t("consumption"))}${kpi("standby_duration", t("standbyTime"))}${kpi(suffix("standby_energy_from_self_percentage"), t("selfShare"))}</div>`) + panel("modesTitle", "modeNote", modes()) + `<div class="detail-grid">${panel("sourcesTitle", "sourceNote", sources("standby_energy"))}${panel("moneyTitle", "moneyNote", money("standby_energy"))}</div>`;
  else content = insights();

  const html = `<nav class="detail-nav" aria-label="${esc(t("detailsHint"))}">${tabs.map(tab => `<button type="button" data-tab="${tab}" class="${!query && card._detailTab === tab ? "selected" : ""}" aria-pressed="${!query && card._detailTab === tab}">${esc(t(tab))}</button>`).join("")}</nav>
    <div class="detail-content" data-active-topic="${query ? "search" : card._detailTab}">${content}</div>`;
  const host = card.shadowRoot.querySelector(".panels");
  const disclosures = [...host.querySelectorAll("details[open][data-disclosure]")].map(node => node.dataset.disclosure);
  const active = card.shadowRoot.activeElement;
  const focusedTab = active?.dataset?.tab;
  const focusedEntity = active?.dataset?.entity;
  const focusedRefresh = active?.hasAttribute?.("data-refresh-history");
  card._replace(host, html);
  for (const node of host.querySelectorAll("details[data-disclosure]")) if (disclosures.includes(node.dataset.disclosure)) node.open = true;
  if (active && !active.isConnected) {
    const replacement = focusedRefresh ? host.querySelector("[data-refresh-history]") : [...host.querySelectorAll(focusedTab ? "[data-tab]" : "[data-entity]")].find(node => focusedTab ? node.dataset.tab === focusedTab : node.dataset.entity === focusedEntity);
    replacement?.focus({ preventScroll: true });
  }
}
