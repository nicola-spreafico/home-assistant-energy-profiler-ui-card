import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.demoReady);
});
test("opens, keeps live updates in the modal and restores focus after Escape", async ({ page }) => {
  const card = page.locator("#full");
  await expect(card.locator(".compact")).toContainText("1.8 kWh");
  await card.locator(".launch").click();
  await expect(card.locator("dialog")).toBeVisible();
  await card.locator(".period").selectOption("monthly");
  await expect(card.locator(".compact")).toContainText("21.6 kWh");
  await card.locator(".search").fill("battery");
  await expect(card.locator('[data-category="readiness"]')).toBeVisible();
  await page.evaluate(() => {
    const card = document.querySelector("#full");
    card.hass = { ...card.hass, states: { ...card.hass.states } };
  });
  await expect(card.locator(".search")).toHaveValue("battery");
  await page.keyboard.press("Escape");
  await expect(card.locator("dialog")).not.toBeVisible();
  await expect(card.locator(".launch")).toBeFocused();
});
test("basic profile hides unsupported families, sources and readiness", async ({ page }) => {
  const card = page.locator("#basic");
  await expect(card.locator(".source-heading")).toHaveCount(0);
  await expect(card.locator(".readiness")).toHaveCount(0);
  await card.locator(".launch").click();
  await expect(card.locator('[data-group="cycles"]')).toHaveCount(0);
  await expect(card.locator('button[data-tab="plan"]')).toHaveCount(0);
  await expect(card.locator('button[data-tab="standby"]')).toHaveCount(0);
});
test("measurement click emits HA more-info with a renamed entity ID", async ({ page }) => {
  const card = page.locator("#full");
  await card.locator(".launch").click();
  await card.locator('[data-entity="sensor.my_daily_consumption"]').click();
  await expect(card.locator("dialog")).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.lastEntity)).toBe("sensor.my_daily_consumption");
});
test("unavailable values remain explicit and do not draw a misleading source bar", async ({ page }) => {
  await page.locator("#availability").click();
  const card = page.locator("#full");
  await expect(card.locator(".compact")).toContainText("Unavailable");
  await expect(card.locator(".strip")).toHaveCount(0);
  await expect(card.locator(".readiness")).not.toContainText("Not yet");
});
test("no horizontal overflow, supports theme and Italian locale", async ({ page }) => {
  await page.locator("#theme").click();
  await page.locator("#language").click();
  const card = page.locator("#full");
  await expect(card.locator(".compact")).toContainText("Esplora profilo");
  await card.locator(".launch").click();
  const box = await card.locator("dialog").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  expect(await card.locator("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
test("untrusted strings render as text", async ({ page }) => {
  const card = page.locator("#full");
  await page.evaluate(() => {
    const card = document.querySelector("#full");
    card.setConfig({ ...card._config, name: '<img src=x onerror="window.pwned=true">' });
  });
  await expect(card.locator(".title")).toContainText("<img");
  await expect(card.locator("img")).toHaveCount(0);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
});
test("editor preserves YAML entity overrides when updating a visible option", async ({ page }) => {
  await page.evaluate(() => {
    const editor = document.createElement("energy-profiler-card-editor");
    document.body.append(editor);
    editor.setConfig({ type: "custom:energy-profiler-card", prefix: "dishwasher_em", entities: { energy_daily: "sensor.special" } });
    editor.hass = document.querySelector("#full").hass;
    editor.addEventListener("config-changed", event => window.editorConfig = event.detail.config);
  });
  const input = page.locator("energy-profiler-card-editor input[name=name]");
  await input.fill("New name");
  await input.blur();
  expect(await page.evaluate(() => window.editorConfig.entities.energy_daily)).toBe("sensor.special");
});

test("registry rejection falls back to explicit entity overrides", async ({ page }) => {
  await page.evaluate(() => {
    const card = document.querySelector("#full");
    card.setConfig({ prefix: "dishwasher_em", entities: { energy_daily: "sensor.my_daily_consumption" } });
    card.hass = { ...card.hass, connection: {}, callWS: async () => { throw new Error("unauthorized"); } };
  });
  const card = page.locator("#full");
  await expect(card.locator(".compact")).toContainText("1.8 kWh");
  await card.locator(".launch").click();
  await expect(card.locator(".registry-notice")).toBeVisible();
  await expect(card.locator('[data-entity="sensor.my_daily_consumption"]')).toBeVisible();
});
test("modal traps focus, closes with its button and can be opened again", async ({ page }) => {
  const card = page.locator("#full");
  await card.locator(".launch").click();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    expect(await card.evaluate(el => el.shadowRoot.querySelector("dialog").contains(el.shadowRoot.activeElement))).toBe(true);
  }
  await card.locator(".close").click();
  await expect(card.locator(".launch")).toBeFocused();
  await card.locator(".launch").click();
  await expect(card.locator("dialog")).toBeVisible();
});
test("captures the demo and mobile dialog", async ({ page }, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath("summary.png"), fullPage: true });
  await page.locator("#full .launch").click();
  await page.screenshot({ path: testInfo.outputPath("details.png") });
});

test("detail is a topic dashboard, with charts and no automatic sensor dump", async ({page}) => {
  const card=page.locator("#full");
  await card.locator(".launch").click();
  await expect(card.locator(".detail-content")).toHaveAttribute("data-active-topic","summary");
  await expect(card.locator(".donut-wrap svg")).toBeVisible();
  await expect(card.locator(".history-chart")).toBeVisible();
  await expect(card.locator(".measurement-list")).toHaveCount(0);
  await card.locator('.detail-nav [data-tab="cycles"]').click();
  await expect(card.locator(".comparison")).toBeVisible();
  await expect(card.locator(".comparison thead")).toContainText("Last completed");
  await expect(card.locator(".comparison")).toContainText("1 h 31 min");
  await expect(card.locator(".cycle-progress")).toHaveAttribute("aria-valuenow","50");
  await expect(card.locator(".history-chart")).toHaveCount(0);
});
test("each topic stays readable on mobile with optional features isolated", async ({page},testInfo) => {
  const card=page.locator("#full");
  await card.locator(".launch").click();
  for(const tab of ["energy","cycles","plan","standby","insights","measurements"]){
    await card.locator('.detail-nav [data-tab="'+tab+'"]').click();
    await expect(card.locator(".detail-content")).toHaveAttribute("data-active-topic",tab);
    expect(await card.locator(".dialog-body").evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    if(["energy","cycles","plan"].includes(tab))await page.screenshot({path:testInfo.outputPath(tab+".png")});
  }
});
test("missing history and recorder denial show distinct recovery states", async ({page}) => {
  const card=page.locator("#full");
  await page.evaluate(()=>{
    const card=document.querySelector("#full"),original=card.hass;
    card.hass={...original,connection:{},callWS:async msg=>msg.type==="config/entity_registry/list"?original.demoRegistry:{}};
  });
  await card.locator(".launch").click();
  await expect(card.locator(".chart-content")).toContainText("No daily statistics yet");
  await page.evaluate(()=>{
    const card=document.querySelector("#full"),original=card.hass;
    card.hass={...original,connection:{},callWS:async msg=>{if(msg.type==="config/entity_registry/list")return original.demoRegistry;throw Error("denied");}};
  });
  await expect(card.locator(".chart-content")).toContainText("could not be loaded");
  await expect(card.locator(".hero-number")).toContainText("1.8");
});
test("search groups by semantic type and technical helpers stay opt-in", async ({page}) => {
  const card=page.locator("#full");
  await card.locator(".launch").click();
  await card.locator(".search").fill("snapshot");
  await expect(card.locator(".detail-content")).toContainText("No matching measurements");
  await page.evaluate(()=>{
    const card=document.querySelector("#full");card.setConfig({...card._config,show_technical:true});
  });
  await expect(card.locator('[data-category="technical"]')).toContainText("snapshot");
  await card.locator('.detail-nav [data-tab="energy"]').click();
  await expect(card.locator(".search")).toHaveValue("");
  await expect(card.locator(".detail-content")).toHaveAttribute("data-active-topic","energy");
});
test("statistics are requested only when the detail opens and follow registry renames", async ({page}) => {
  await page.evaluate(()=>{
    const card=document.querySelector("#full"),hass=card.hass;window.statisticsRequests=[];
    card.hass={...hass,connection:{},callWS:async message=>{
      if(message.type==="recorder/statistics_during_period")window.statisticsRequests.push(message);
      return hass.callWS(message);
    }};
  });
  expect(await page.evaluate(()=>window.statisticsRequests.length)).toBe(0);
  const card=page.locator("#full");
  await card.locator(".launch").click();
  await expect(card.locator(".history-chart")).toBeVisible();
  expect(await page.evaluate(()=>window.statisticsRequests[0].statistic_ids)).toEqual(["sensor.my_daily_consumption"]);
  await page.evaluate(()=>{const card=document.querySelector("#full");card.hass={...card.hass};});
  expect(await page.evaluate(()=>window.statisticsRequests.length)).toBe(1);
});

test("unknown running state never claims that the appliance is idle", async ({page}) => {
  await page.evaluate(()=>{
    const card=document.querySelector("#full"),id="binary_sensor.dishwasher_em_running";
    card.hass={...card.hass,states:{...card.hass.states,[id]:{...card.hass.states[id],state:"unavailable"}}};
  });
  const card=page.locator("#full");
  await card.locator(".launch").click();
  await card.locator('.detail-nav [data-tab="cycles"]').click();
  await expect(card.locator(".cycle-live h3")).toHaveText("Waiting for readings");
  await expect(card.locator(".cycle-progress")).toHaveCount(0);
});
test("topic keyboard navigation and dark Italian presentation", async ({page},testInfo) => {
  await page.locator("#theme").click();
  await page.locator("#language").click();
  const card=page.locator("#full");
  await card.locator(".launch").click();
  await card.locator('.detail-nav [data-tab="summary"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(card.locator(".detail-content")).toHaveAttribute("data-active-topic","energy");
  await expect(card.locator('.detail-nav [data-tab="energy"]')).toBeFocused();
  await expect(card.locator(".history-chart")).toBeVisible();
  await expect(card.locator(".detail-content")).toContainText("Andamento dei consumi");
  await page.screenshot({path:testInfo.outputPath("dark-italian-energy.png")});
});
