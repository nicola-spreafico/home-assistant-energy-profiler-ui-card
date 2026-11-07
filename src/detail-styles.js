
export const detailStyles = `
dialog { width:min(1060px,calc(100vw - 40px)); height:min(900px,92dvh); max-height:92dvh; overflow:hidden; }
dialog[open] { display:flex; flex-direction:column; }
.dialog-head { position:relative; padding:22px 28px 18px; flex-shrink:0; }
.dialog-head .eyebrow { color:var(--ep-accent); }
.dialog-head h2 { font-size:26px; letter-spacing:-.03em; }
.toolbar { grid-template-columns:minmax(140px,200px) 1fr; }
.dialog-body { min-height:0; overflow:auto; padding:0; background:color-mix(in srgb,var(--ep-bg) 96%,var(--ep-muted)); }
.registry-notice { margin:12px 28px; }
.detail-nav { display:flex; gap:5px; padding:12px 28px; position:sticky; top:0; z-index:2; background:var(--ep-bg); border-bottom:1px solid var(--ep-line); overflow-x:auto; scrollbar-width:thin; }
.detail-nav button { border:0; background:transparent; padding:10px 15px; border-radius:10px; white-space:nowrap; font-size:13px; font-weight:600; color:var(--ep-muted); min-height:40px; }
.detail-nav button.selected { background:color-mix(in srgb,var(--ep-accent) 12%,transparent); color:var(--ep-accent); }
.detail-nav button:hover { background:color-mix(in srgb,var(--ep-accent) 7%,transparent); }
.detail-content { padding:24px 28px 32px; }
.detail-content h3 { margin:0; font-size:15px; font-weight:650; letter-spacing:-.015em; }
.detail-content p { line-height:1.6; }
.detail-hero { display:flex; align-items:center; justify-content:space-between; gap:24px; padding:4px 0 28px; }
.detail-hero > div:first-child { min-width:0; flex:1; }
.metric-link { border:0; padding:0; background:transparent; text-align:inherit; color:inherit; border-radius:6px; }
.metric-link:hover { color:var(--ep-accent); }
.hero-number { display:block; font-size:clamp(28px,5vw,48px); font-weight:650; line-height:1.25; letter-spacing:-.055em; overflow-wrap:anywhere; }
.hero-caption { display:block; font-size:13px; color:var(--ep-muted); margin-top:6px; }
.hero-side { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px; max-width:50%; }
.hero-side .detail-kpi { padding:0; background:transparent; }
.detail-kpi { display:block; text-align:start; padding:16px; border-radius:12px; background:color-mix(in srgb,var(--ep-muted) 5%,transparent); min-width:0; }
.detail-kpi small { display:block; font-size:12px; font-weight:400; color:var(--ep-muted); line-height:1.4; }
.detail-kpi strong { display:block; font-size:22px; line-height:1.4; font-weight:600; margin-top:6px; letter-spacing:-.025em; overflow-wrap:anywhere; }
.kpi-hint { font-size:11px; color:var(--ep-muted); }
.kpi-grid,.window-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; }
.window-grid .detail-kpi strong { font-size:19px; }
.detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; align-items:stretch; }
.detail-panel { padding:22px; border:1px solid var(--ep-line); border-radius:16px; background:var(--ep-bg); margin-bottom:18px; min-width:0; }
.detail-grid > .detail-panel { margin-bottom:18px; }
.section-heading { margin-bottom:20px; }
.section-heading p { color:var(--ep-muted); margin:6px 0 0; font-size:12px; max-width:70ch; }
.source-layout { display:flex; gap:20px; align-items:center; }
.donut-wrap { position:relative; width:148px; flex:0 0 148px; }
.donut-wrap svg { display:block; width:100%; }
.donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; pointer-events:none; }
.donut-center strong { font-size:25px; letter-spacing:-.04em; }
.donut-center small { font-size:9px; color:var(--ep-muted); margin-top:2px; }
.source-values { flex:1; min-width:0; display:grid; gap:17px; }
.source-item { display:grid; grid-template-columns:8px minmax(0,1fr) auto; align-items:center; gap:5px 7px; font-size:12px; }
.source-item i { width:7px; height:7px; border-radius:50%; }
.source-pct { font-weight:650; text-align:right; }
.source-energy { grid-column:2 / -1; color:var(--ep-muted); font-size:11px; }
.detail-empty { padding:16px; color:var(--ep-muted); font-size:13px; background:color-mix(in srgb,var(--ep-muted) 5%,transparent); border-radius:10px; margin:12px 0; }
.bar-list { display:grid; gap:17px; }
.bar-item > div:first-child { display:flex; justify-content:space-between; gap:16px; font-size:12px; margin-bottom:8px; }
.bar-item strong { font-weight:600; }
.bar-track { height:7px; background:color-mix(in srgb,var(--ep-muted) 10%,transparent); overflow:hidden; border-radius:8px; }
.bar-track > span { display:block; height:100%; border-radius:8px; }
.mode-table { margin-top:22px; }
.live-summary { display:flex; align-items:center; gap:20px; font-size:11px; color:var(--ep-muted); margin:0 0 22px; padding:14px 16px; background:var(--ep-bg); border:1px solid var(--ep-line); border-radius:12px; flex-wrap:wrap; }
.live-summary strong { color:var(--primary-text-color,#172b35); font-weight:600; margin-left:8px; }
.live-label { color:var(--ep-accent); font-weight:600; }
.live-summary .status { margin-left:auto; }
.mode-strip { display:flex; height:12px; overflow:hidden; border-radius:6px; margin-bottom:22px; }
.money-kpis { margin-top:20px; }
.money-kpis .detail-kpi { padding:12px; }
.money-kpis .detail-kpi strong { font-size:18px; }
.history-chart { display:block; width:100%; max-height:240px; overflow:visible; }
.history-chart text { fill:var(--ep-muted); font-size:10px; font-family:inherit; }
.chart-grid { stroke:var(--ep-line); stroke-dasharray:3 4; }
.chart-foot { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-top:12px; color:var(--ep-muted); font-size:11px; line-height:1.5; }
.text-action { border:0; padding:8px 0; color:var(--ep-accent); background:transparent; font-size:12px; font-weight:600; white-space:nowrap; }
.chart-values { border:0; margin-top:12px; }
.chart-values summary { font-size:11px; color:var(--ep-muted); font-weight:400; padding:8px 0; }
table { border-collapse:collapse; width:100%; font-size:12px; font-variant-numeric:tabular-nums; }
th,td { border-bottom:1px solid var(--ep-line); padding:12px 10px; text-align:right; }
th:first-child,td:first-child { text-align:left; }
thead th { color:var(--ep-muted); font-size:11px; font-weight:500; background:color-mix(in srgb,var(--ep-muted) 4%,transparent); }
tbody th { font-weight:500; }
table .metric-link { min-height:30px; }
.comparison-scroll { overflow-x:auto; }
.comparison { min-width:390px; }
.comparison td { white-space:nowrap; }
.cycle-live { padding:22px; border-radius:16px; background:var(--ep-bg); border:1px solid var(--ep-line); margin-bottom:18px; }
.cycle-live.active { border-color:color-mix(in srgb,var(--ep-accent) 30%,var(--ep-line)); background:color-mix(in srgb,var(--ep-accent) 4%,var(--ep-bg)); }
.detail-panel .cycle-live { border:0; padding:0; margin:0; background:transparent; }
.cycle-live-top { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
.cycle-live-top h3 { flex:1; }
.pulse { height:8px; width:8px; border-radius:50%; background:var(--ep-muted); flex-shrink:0; }
.active .pulse { background:var(--ep-accent); box-shadow:0 0 0 4px color-mix(in srgb,var(--ep-accent) 12%,transparent); }
.cycle-live .kpi-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
.cycle-live .detail-kpi { padding:10px 0; background:transparent; }
.cycle-live .detail-kpi strong { font-size:20px; }
.cycle-progress { height:7px; border-radius:7px; background:var(--ep-line); overflow:hidden; margin-top:16px; }
.cycle-progress span { display:block; height:100%; background:var(--ep-accent); }
.progress-caption { font-size:12px; font-weight:600; margin:10px 0 0; }
.fine-print { font-size:12px; line-height:1.6; color:var(--ep-muted); }
.cycle-average { margin-bottom:22px; }
.cycle-average .detail-kpi { border:1px solid var(--ep-line); background:var(--ep-bg); }
.validation { display:flex; justify-content:space-between; gap:20px; font-size:12px; padding:16px; border-radius:12px; background:var(--ep-bg); border:1px solid var(--ep-line); }
.validation strong { font-weight:600; }
.planning-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(225px,1fr)); gap:14px; }
.planning-card { padding:18px; border:1px solid var(--ep-line); border-radius:14px; background:var(--ep-bg); min-width:0; }
.planning-icon { display:grid; place-items:center; height:34px; width:34px; border-radius:10px; color:var(--ep-accent); background:color-mix(in srgb,var(--ep-accent) 10%,transparent); font-size:13px; font-weight:650; margin-bottom:18px; }
.sun-tone { color:#a87805; background:#d9a21a18; }
.planning-card h3 { font-size:13px; line-height:1.5; }
.planning-card p { font-size:11px; color:var(--ep-muted); margin:16px 0 0; }
.planning-answer,.planning-time { display:block; font-size:21px; font-weight:600; margin-top:12px; line-height:1.4; overflow-wrap:anywhere; }
.planning-answer.positive { color:var(--ep-accent); }
.battery-gauge { height:10px; border-radius:5px; background:var(--ep-line); overflow:hidden; margin-top:20px; }
.battery-gauge span { height:100%; display:block; background:var(--ep-accent); }
.battery-values { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; font-size:10px; color:var(--ep-muted); }
.battery-values strong { display:block; font-size:13px; color:var(--primary-text-color,#172b35); margin-top:4px; }
.insight-grid { display:grid; grid-template-columns:1.3fr 1fr; gap:32px; }
.insight-grid .detail-kpi { background:transparent; padding:0; }
.insight-grid .detail-kpi strong { font-size:40px; }
.benchmark-track { margin-top:26px; height:8px; background:var(--ep-line); border-radius:5px; position:relative; }
.benchmark-track span { position:absolute; width:14px; height:14px; border-radius:50%; background:var(--ep-accent); top:-3px; transform:translateX(-50%); }
.benchmark-track i { position:absolute; width:2px; height:18px; top:-5px; background:var(--ep-muted); }
.benchmark-label { margin-top:12px; font-size:10px; color:var(--ep-muted); }
.measurement-section { background:var(--ep-bg); border:1px solid var(--ep-line); border-radius:14px; overflow:hidden; margin-top:18px; }
.measurement-section > h3 { padding:16px; border-bottom:1px solid var(--ep-line); display:flex; align-items:center; justify-content:space-between; }
.measurement-section h3 > span { color:var(--ep-muted); font-size:11px; font-weight:400; }
.measurement-row { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:13px 16px; border-bottom:1px solid var(--ep-line); font-size:12px; }
.measurement-row:last-child { border-bottom:0; }
.measurement-row > div { min-width:0; display:flex; align-items:flex-start; flex-direction:column; gap:4px; }
.context-chip { font-size:9px; color:var(--ep-muted); letter-spacing:.05em; text-transform:uppercase; }
.measurement-row .metric-link { font-weight:600; white-space:nowrap; min-height:32px; }
.measurement-row small { word-break:break-all; color:var(--ep-muted); font-size:9px; }
@media(max-width:760px) {
 .detail-grid { grid-template-columns:1fr; gap:0; }
 .detail-hero { align-items:flex-start; }
 .hero-side { grid-template-columns:1fr; gap:12px; }
 .hero-side .detail-kpi strong { font-size:18px; }
 .planning-grid { grid-template-columns:1fr; }
 .insight-grid { grid-template-columns:1fr; gap:28px; }
}
@media(max-width:540px) {
 dialog { width:100%; max-width:100%; height:96dvh; max-height:96dvh; margin:auto 0 0; }
 .dialog-head { padding:18px 18px 14px; }
 .dialog-head h2 { font-size:23px; }
 .toolbar { grid-template-columns:110px 1fr; gap:10px; margin-top:14px; }
 .toolbar input,.toolbar select { font-size:12px; padding:9px; }
 .toolbar label { font-size:10px; }
 .detail-nav { padding:10px 14px; gap:2px; }
 .detail-nav button { padding:8px 12px; font-size:12px; }
 .detail-content { padding:20px 14px 28px; }
 .detail-panel { padding:18px; border-radius:14px; }
 .detail-hero { gap:16px; }
 .hero-side { max-width:42%; }
 .detail-kpi strong { font-size:19px; }
 .source-layout { gap:14px; }
 .donut-wrap { width:124px; flex-basis:124px; }
 .donut-center strong { font-size:23px; }
 .kpi-grid,.window-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
 .cycle-live { padding:18px; }
 .cycle-live .detail-kpi strong { font-size:17px; }
 .cycle-live-top .status { display:none; }
 .chart-foot { align-items:flex-start; }
 .measurement-row { padding:12px; gap:10px; }
}
`;
