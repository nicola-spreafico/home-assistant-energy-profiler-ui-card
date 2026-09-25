export const styles = `
:host { display:block; color:var(--primary-text-color,#172b35); font-family:var(--paper-font-body1_-_font-family,system-ui,sans-serif); --ep-accent:var(--primary-color,#007d79); --ep-muted:var(--secondary-text-color,#607580); --ep-line:var(--divider-color,#dfe8e9); --ep-bg:var(--card-background-color,#fff); }
* { box-sizing:border-box; }
button,input,select { font:inherit; color:inherit; }
button { cursor:pointer; }
button:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible { outline:3px solid var(--ep-accent); outline-offset:3px; }
.card { border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--ep-line)); border-radius:var(--ha-card-border-radius,20px); background:var(--ep-bg); box-shadow:var(--ha-card-box-shadow,0 4px 22px #123b4510); overflow:hidden; }
.launch { display:block; width:100%; padding:22px; border:0; text-align:start; background:none; }
.launch:hover { background:color-mix(in srgb,var(--ep-accent) 4%,transparent); }
.head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.identity { display:flex; align-items:center; gap:12px; min-width:0; }
.mark { display:grid; place-items:center; width:42px; height:42px; flex-shrink:0; border-radius:14px; background:color-mix(in srgb,var(--ep-accent) 12%,transparent); color:var(--ep-accent); font-size:26px; }
.title { font-size:18px; font-weight:650; overflow-wrap:anywhere; }
.eyebrow { display:block; color:var(--ep-muted); font-size:11px; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px; }
.status { border:1px solid var(--ep-line); border-radius:20px; padding:5px 10px; font-size:12px; white-space:nowrap; }
.stats { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px 14px; margin:24px 0; }
.stat small { display:block; color:var(--ep-muted); font-size:12px; margin-bottom:5px; }
.stat strong { font-weight:600; font-size:clamp(18px,4vw,24px); overflow-wrap:anywhere; }
.strip { display:flex; width:100%; height:7px; border-radius:6px; overflow:hidden; background:var(--ep-line); margin:12px 0; }
.solar { background:#e2aa22; } .battery { background:#7792e5; } .grid { background:#9aaeb8; } .self { background:#29a99b; }
.legend { display:flex; flex-wrap:wrap; gap:8px 16px; font-size:12px; color:var(--ep-muted); }
.legend span { display:flex; align-items:center; gap:5px; }
.dot { width:7px; height:7px; display:inline-block; border-radius:50%; }
.source-heading { color:var(--ep-muted); font-size:12px; }
.readiness { margin-top:18px; padding-top:14px; border-top:1px solid var(--ep-line); font-size:13px; }
.foot { margin-top:18px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--ep-accent); }
.notice { color:var(--ep-muted); line-height:1.6; font-size:13px; }
dialog { color:inherit; background:var(--ep-bg); width:min(760px,calc(100vw - 32px)); max-height:calc(100dvh - 40px); padding:0; border:1px solid var(--ep-line); border-radius:24px; box-shadow:0 28px 100px #0005; overflow:auto; overscroll-behavior:contain; }
dialog::backdrop { background:#0b202d99; backdrop-filter:blur(4px); }
.dialog-head { position:sticky; top:0; z-index:2; background:var(--ep-bg); padding:22px 24px 16px; border-bottom:1px solid var(--ep-line); }
h2 { font-size:22px; margin:0; overflow-wrap:anywhere; }
.close { border:1px solid var(--ep-line); background:transparent; border-radius:50%; width:38px; height:38px; font-size:22px; flex-shrink:0; }
.toolbar { display:grid; grid-template-columns:1fr 1.4fr; gap:12px; margin-top:18px; }
label { display:block; font-size:12px; color:var(--ep-muted); }
input,select { margin-top:5px; width:100%; border:1px solid var(--ep-line); border-radius:9px; background:var(--ep-bg); padding:10px; min-height:42px; }
.dialog-body { padding:8px 24px 24px; }
details { border-bottom:1px solid var(--ep-line); }
summary { cursor:pointer; font-weight:600; padding:18px 0; }
.panel { padding-bottom:16px; }
.rows { display:grid; gap:2px; }
.row { display:flex; align-items:center; justify-content:space-between; gap:18px; width:100%; border:0; background:none; text-align:start; border-radius:7px; padding:10px 8px; min-height:44px; }
.row:hover { background:color-mix(in srgb,var(--ep-accent) 7%,transparent); }
.row .label { font-size:13px; overflow-wrap:anywhere; }
.row .value { font-size:14px; font-weight:600; text-align:end; overflow-wrap:anywhere; }
.row small { display:block; font-size:10px; color:var(--ep-muted); margin-top:4px; word-break:break-all; }
.attributes { margin:8px 0; }
.attributes summary { font-size:12px; }
pre { white-space:pre-wrap; overflow-wrap:anywhere; font-size:11px; max-height:220px; overflow:auto; color:var(--ep-muted); }
[hidden] { display:none!important; }
@media(max-width:540px) {
  dialog { width:100%; max-width:100%; max-height:94dvh; margin:auto 0 0; border-radius:22px 22px 0 0; }
  .dialog-head { padding:18px 16px 12px; } .dialog-body { padding:4px 16px 24px; }
  .launch { padding:18px; } .toolbar { grid-template-columns:1fr; gap:8px; }
  .title { font-size:16px; } .status { max-width:110px; white-space:normal; text-align:center; }
}
@media(prefers-reduced-motion:no-preference) { dialog[open] { animation:appear .16s ease-out; } @keyframes appear { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } }
`;
