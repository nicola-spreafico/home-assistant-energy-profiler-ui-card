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
  await expect(card.locator('[data-group="cycles"]')).toBeVisible();
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
  await expect(card.locator('[data-group="running"]')).toHaveCount(0);
  await expect(card.locator('[data-group="standby"]')).toHaveCount(0);
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
