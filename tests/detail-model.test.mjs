
import test from "node:test";
import assert from "node:assert/strict";
import { describeMetric, modeBreakdown, cycleProgress, durationLabel, normalizeDailySeries, historyRequest, fetchDailyHistory } from "../src/detail-model.js";
const state = value => ({ state: String(value) });
test("measurement model separates accounting context, meaning and period", () => {
  assert.deepEqual(describeMetric("standby_energy_from_grid_cost_monthly"), { key: "standby_energy_from_grid_cost_monthly", context: "standby", category: "money", period: "monthly", projection: false });
  assert.equal(describeMetric("energy_from_self_index_daily").category, "performance");
  assert.equal(describeMetric("cycle_live_energy_from_battery").context, "live");
  assert.equal(describeMetric("cycles_energy_from_grid_mean").context, "mean");
  assert.equal(describeMetric("cycle_start_snapshot").category, "technical");
  assert.equal(describeMetric("energy_cost_instant_daily").projection, true);
});
test("mode chart retains unclassified energy instead of inflating known shares", () => {
  const result = modeBreakdown(state(10), state(7), state(1));
  assert.deepEqual(result.map(p => [p.channel, p.percentage]), [["running",70],["standby",10],["unassigned",20]]);
  assert.equal(modeBreakdown(state(10), state(11), state(1)), null);
  assert.equal(modeBreakdown(state(0), state(0), state(0)), null);
  assert.equal(modeBreakdown(state("unavailable"), state(0), state(0)), null);
});
test("cycle progress is bounded and overrun does not promise negative remaining time", () => {
  assert.deepEqual(cycleProgress(state(7200), state(5400)), { elapsed:7200, mean:5400, percentage:100, remaining:0, overrun:true });
  assert.equal(cycleProgress(state(10), state(0)), null);
  assert.equal(cycleProgress(state("unknown"), state(5400)), null);
  assert.equal(durationLabel(5480, "it"), "1 h 31 min");
});
test("Lean history uses state, not cumulative sum, preserving zero and missing dates", () => {
  const a=Date.parse("2026-01-01T00:00:00Z"), b=a+2*86400000;
  assert.deepEqual(normalizeDailySeries([{start:b,state:0,sum:900},{start:a,state:1.2,sum:898.8},{start:a+86400000,state:null,sum:899},{start:b+86400000,state:"unavailable"}]),
    [{ timestamp:a,value:1.2 },{ timestamp:b,value:0 }]);
});
test("daily history request is bounded and follows the resolved entity ID", () => {
  const now=Date.parse("2026-01-20T12:00:00Z"), request=historyRequest("sensor.renamed",now);
  assert.deepEqual(request.statistic_ids,["sensor.renamed"]);
  assert.deepEqual(request.types,["state"]);
  assert.equal(request.period,"day");
  assert.equal(Date.parse(request.end_time)-Date.parse(request.start_time),15*86400000);
});
test("history queries are shared and cached until explicitly refreshed", async () => {
  let calls=0;
  const hass={connection:{},callWS:async message=>{calls++;return {[message.statistic_ids[0]]:[{start:1000,state:1}]};}};
  const [a,b]=await Promise.all([fetchDailyHistory(hass,"sensor.test"),fetchDailyHistory(hass,"sensor.test")]);
  assert.equal(calls,1);assert.deepEqual(a,b);
  await fetchDailyHistory(hass,"sensor.test",{refresh:true});assert.equal(calls,2);
});
test("failed history reads can be retried without poisoning the shared cache", async () => {
  let calls=0;const hass={connection:{},callWS:async()=>{if(++calls===1)throw Error("denied");return {};}};
  await assert.rejects(fetchDailyHistory(hass,"sensor.test"));
  assert.deepEqual(await fetchDailyHistory(hass,"sensor.test"),[]);
  assert.equal(calls,2);
});
