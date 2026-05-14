import { n, fmt, wcCalcs, acCalcs, pumpCalcs, towerCalcs, compCalcs, boilerCalcs } from './calculations.js';

const HIGH = 'HIGH', MED = 'MEDIUM', LOW = 'LOW', GOOD = 'GOOD', INFO = 'INFO';
const SEV_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, GOOD: 3, INFO: 4 };

export function getSuggestions(state) {
  const { wcChillers = [], acChillers = [], pumps = [], towers = [], compressors = [], boilers = [], site = {} } = state;
  const findings = [];

  const add = (sev, eq, title, detail, action = null) => findings.push({ sev, eq, title, detail, action });

  // ── WC Chillers ────────────────────────────────────────────────────────────
  wcChillers.forEach(ch => {
    const tag = ch.tag || 'WC Chiller';
    const c = wcCalcs(ch);

    if (c.copRatio !== null) {
      if (c.copRatio < 0.75) add(HIGH, tag, 'COP critically below OEM rating',
        `Actual COP is ${fmt(c.copRatio * 100, 0)}% of rated. Likely fouled heat exchangers, refrigerant degradation, or oil contamination.`,
        'Inspect evaporator/condenser tubes. Check refrigerant charge, subcooling, and oil level. Consider tube brushing.');
      else if (c.copRatio < 0.90) add(MED, tag, 'COP below OEM rating',
        `COP is ${fmt(c.copRatio * 100, 0)}% of OEM. Performance is degraded; monitor for worsening trend.`,
        'Schedule tube cleaning. Check refrigerant charge and non-condensable gases.');
      else add(GOOD, tag, 'COP within specification',
        `COP ratio is ${fmt(c.copRatio * 100, 0)}% — performing to OEM specification.`);
    }

    if (c.chwDt !== null) {
      if (c.chwDt < 4.0) add(HIGH, tag, 'Low CHW ΔT syndrome',
        `CHW ΔT is ${fmt(c.chwDt, 1)}°C (target 5–6°C). Excess flow or poor distribution wastes pump energy and limits chiller efficiency.`,
        'Balance secondary circuits. Inspect 3-way valve bypass operation. Verify flow setpoint. Check for short-circuiting.');
      else if (c.chwDt >= 5.0 && c.chwDt <= 7.0) add(GOOD, tag, 'CHW ΔT is healthy',
        `CHW ΔT of ${fmt(c.chwDt, 1)}°C is within the ideal 5–7°C range — good hydronic balance.`);
      else if (c.chwDt > 8.0) add(MED, tag, 'CHW ΔT higher than expected',
        `CHW ΔT of ${fmt(c.chwDt, 1)}°C may indicate low flow or scaling on evaporator plates.`,
        'Verify CHW flow measurement. Check evaporator pressure drop and tube cleanliness.');
    }

    if (c.kwtr !== null && n(ch.nameplate.kwtrRated)) {
      const dev = c.kwtrDev;
      if (dev !== null && dev > 0.15) add(HIGH, tag, 'kW/TR significantly above OEM',
        `Actual kW/TR is ${fmt(c.kwtr, 3)} vs OEM ${fmt(n(ch.nameplate.kwtrRated), 3)} — ${fmt(dev * 100, 0)}% deviation. Excess energy consumption.`,
        'Investigate COP degradation root cause. Check condenser approach temperature and refrigerant superheat.');
    }

    if (c.pctLoad !== null && c.pctLoad < 0.50 && ch.running === 'Y') {
      add(LOW, tag, 'Chiller under-utilised (<50% load)',
        `Running at only ${fmt(c.pctLoad * 100, 0)}% of rated capacity. Staging another unit off may improve part-load efficiency.`,
        'Evaluate staging: if total load < 80% of one chiller, consider operating single unit. Check sequencing logic.');
    }

    // Approach temperatures (if data available — requires refrigerant pressures for evap saturation temp)
    // We check cwDt as indicator
    if (c.cwDt !== null && c.cwDt > 6.0) add(MED, tag, 'High condenser water ΔT',
      `CW ΔT of ${fmt(c.cwDt, 1)}°C is elevated. May indicate low CW flow or high heat rejection load.`,
      'Verify CW flow rate. Check tower performance and CW pump operation.');
  });

  // ── AC Chillers ────────────────────────────────────────────────────────────
  acChillers.forEach(ch => {
    const tag = ch.tag || 'AC Chiller';
    const c = acCalcs(ch);

    if (c.copRatio !== null) {
      if (c.copRatio < 0.75) add(HIGH, tag, 'COP critically below OEM rating',
        `Actual COP is ${fmt(c.copRatio * 100, 0)}% of rated. Condenser coil fouling or refrigerant issues likely.`,
        'Clean condenser coils (chemically or mechanically). Check refrigerant charge and superheat.');
      else if (c.copRatio < 0.90) add(MED, tag, 'COP below OEM rating',
        `COP ratio ${fmt(c.copRatio * 100, 0)}%. Schedule coil cleaning.`);
      else add(GOOD, tag, 'COP within specification', `COP ratio ${fmt(c.copRatio * 100, 0)}% — performing well.`);
    }

    if (c.chwDt !== null && c.chwDt < 4.0) add(HIGH, tag, 'Low CHW ΔT syndrome',
      `CHW ΔT of ${fmt(c.chwDt, 1)}°C is too low. Excess chilled water flow.`,
      'Balance secondary hydronic circuits. Inspect control valves.');

    if (c.derating !== null && c.derating < 0.90) add(INFO, tag, 'Ambient derating applied',
      `Ambient temperature is above OEM design point. Capacity derated by ${fmt((1 - c.derating) * 100, 1)}%. Ambient-corrected COP: ${fmt(c.corrCOP, 2)}.`);

    // AC→WC opportunity flag
    if (c.pctLoad !== null && n(ch.nameplate.kwtrRated)) add(INFO, tag, 'Air-cooled: evaluate WC replacement',
      `AC chillers typically operate at 1.0–1.2 kW/TR vs 0.5–0.6 kW/TR for water-cooled. See Replacement Analysis in Summary tab.`);
  });

  // ── Pumps ──────────────────────────────────────────────────────────────────
  pumps.forEach(pp => {
    const tag = pp.tag || 'Pump';
    const c = pumpCalcs(pp);

    if (c.hydEff !== null) {
      if (c.hydEff < 0.50) add(HIGH, tag, 'Very low hydraulic efficiency',
        `Wire-to-water efficiency is ${fmt(c.hydEff * 100, 1)}% (target ≥65%). Excessive energy waste.`,
        'Check pump curve vs operating point. Impeller may be worn or oversized. Consider pump replacement or trimming impeller.');
      else if (c.hydEff < 0.65) add(MED, tag, 'Hydraulic efficiency below benchmark',
        `Efficiency ${fmt(c.hydEff * 100, 1)}% (target 65–75%). Marginal performance.`,
        'Verify operating point on pump curve. Check for recirculation or bypass flow.');
      else add(GOOD, tag, 'Hydraulic efficiency acceptable',
        `Wire-to-water efficiency ${fmt(c.hydEff * 100, 1)}% — within acceptable range.`);
    }

    if (pp.nameplate.vfdFitted === 'Yes' && c.powerDev !== null) {
      if (c.vfdStatus === 'bad') add(HIGH, tag, 'Pump over-consuming vs VFD affinity law',
        `Measured power is ${fmt(c.powerDev * 100, 0)}% above affinity law prediction at current Hz. Possible throttling, system resistance issues, or oversized pump.`,
        'Check for partially closed isolation valves. Review system curve. Consider reducing pressure setpoint.');
      else if (c.vfdStatus === 'warn') add(LOW, tag, 'VFD pump under-consuming — verify setpoint',
        `Power is below affinity prediction. Check Hz setpoint, sensor calibration, and minimum speed limits.`);
      else if (c.vfdStatus === 'good') add(GOOD, tag, 'VFD operating within affinity law',
        `Pump power tracks affinity law within ±15% — VFD energy saving confirmed.`);
    }

    if (pp.nameplate.vfdFitted !== 'Yes' && n(pp.measured.measKW) && n(pp.nameplate.ratedKW)) {
      const loadFraction = n(pp.measured.measKW) / n(pp.nameplate.ratedKW);
      if (loadFraction > 0.85) add(LOW, tag, 'Fixed-speed pump running near full load — consider VFD',
        `Pump runs at ${fmt(loadFraction * 100, 0)}% of rated power. A VFD could save 20–40% if flow varies seasonally.`,
        'Conduct VFD feasibility study. Typical payback: 1–3 years for HVAC pumps.');
    }
  });

  // ── Cooling Towers ────────────────────────────────────────────────────────
  towers.forEach(ct => {
    const tag = ct.tag || 'Cooling Tower';
    const c = towerCalcs(ct);

    if (c.approach !== null) {
      if (c.approach > 5.0) add(HIGH, tag, 'High tower approach temperature',
        `Approach of ${fmt(c.approach, 1)}°C vs target ≤2.5°C. Degraded cooling increases chiller condenser entering temp, raising kW/TR.`,
        'Inspect fill media for scaling/fouling. Check nozzle spray pattern. Verify fan operation and blade pitch.');
      else if (c.approach > 2.5) add(MED, tag, 'Tower approach above design',
        `Approach of ${fmt(c.approach, 1)}°C. Check fill condition and water distribution.`);
      else add(GOOD, tag, 'Tower approach within design', `Approach ${fmt(c.approach, 1)}°C — good tower performance.`);
    }

    if (c.effectiveness !== null) {
      if (c.effectiveness < 0.60) add(HIGH, tag, 'Low cooling tower effectiveness',
        `CT effectiveness is ${fmt(c.effectiveness * 100, 1)}% (target ≥70%). Significant degradation in heat rejection.`,
        'Full inspection of fill, basin, drift eliminators, and fan. Chemical treatment review.');
      else if (c.effectiveness < 0.70) add(MED, tag, 'Cooling tower effectiveness marginal',
        `Effectiveness ${fmt(c.effectiveness * 100, 1)}% — schedule maintenance.`);
      else add(GOOD, tag, 'Cooling tower effectiveness good', `Effectiveness ${fmt(c.effectiveness * 100, 1)}% — operating well.`);
    }

    if (ct.nameplate.vfdFitted === 'Yes' && c.fanStatus !== null) {
      if (c.fanStatus === 'bad') add(MED, tag, 'Fan over-consuming vs affinity prediction',
        'Fan motor draws more than affinity law predicts. Check blade pitch, debris on fan, or duct resistance.');
      else if (c.fanStatus === 'good') add(GOOD, tag, 'Tower fan VFD affinity law compliant',
        'Fan power tracks affinity law — VFD energy saving confirmed.');
    }

    if (ct.measured.tds && n(ct.measured.tds) > 1500) add(MED, tag, 'High condenser water TDS',
      `TDS of ${ct.measured.tds} ppm exceeds 1500 ppm threshold. Risk of scaling on condenser tubes.`,
      'Review blowdown frequency. Check chemical dosing programme. Inspect condenser tubes.');
  });

  // ── Air Compressors ────────────────────────────────────────────────────────
  compressors.forEach(cp => {
    const tag = cp.tag || 'Compressor';
    const c = compCalcs(cp);

    if (c.specPwrDev !== null) {
      if (c.specPwrDev > 0.20) add(HIGH, tag, 'Specific power significantly above rated',
        `Actual ${fmt(c.actualSpecPwr, 2)} kW/m³/min vs rated ${fmt(c.ratedSpecPwr, 2)} — ${fmt(c.specPwrDev * 100, 0)}% worse. High energy waste.`,
        'Check for system leaks (conduct leak survey). Verify discharge pressure setpoint is not too high. Check inlet filter.');
      else if (c.specPwrDev > 0.10) add(MED, tag, 'Specific power above rated',
        `Specific power ${fmt(c.specPwrDev * 100, 0)}% above rating. Check pressure setpoint and inlet conditions.`);
      else add(GOOD, tag, 'Compressor specific power within target',
        `Specific power ${fmt(c.actualSpecPwr, 2)} kW/m³/min — within 10% of rated.`);
    }

    if (cp.measured.dryerDewpoint && n(cp.measured.dryerDewpoint) > 10) add(MED, tag, 'High dryer dewpoint',
      `Dewpoint of ${cp.measured.dryerDewpoint}°C is elevated. Moisture in compressed air can cause equipment damage.`,
      'Check dryer refrigerant charge. Clean dryer heat exchanger. Verify auto-drain operation.');

    if (cp.measured.networkDrop && n(cp.measured.networkDrop) > 0.5) add(MED, tag, 'High compressed air distribution pressure drop',
      `Network pressure drop ${cp.measured.networkDrop} bar exceeds 0.5 bar. Indicates leaks or undersized pipework.`,
      'Conduct compressed air leak survey. Prioritise finding and fixing leaks (typical: 20–30% of compressed air is lost to leaks).');
  });

  // ── Boilers ────────────────────────────────────────────────────────────────
  boilers.forEach(bl => {
    const tag = bl.tag || 'Boiler';
    const c = boilerCalcs(bl);

    if (c.combEff !== null) {
      if (c.combEff < 0.82) add(HIGH, tag, 'Poor combustion efficiency',
        `Combustion efficiency ${fmt(c.combEff * 100, 1)}% (target >88%). Stack loss of ${fmt(c.stackLoss * 100, 1)}%.`,
        'Service burner. Adjust air-fuel ratio. Check for excess air — target O2: 2–4% for natural gas. Inspect heat transfer surfaces for soot.');
      else if (c.combEff < 0.88) add(MED, tag, 'Combustion efficiency below target',
        `Efficiency ${fmt(c.combEff * 100, 1)}%. Tune burner and excess air.`);
      else add(GOOD, tag, 'Combustion efficiency good',
        `Combustion efficiency ${fmt(c.combEff * 100, 1)}% — above 88% target.`);
    }

    if (n(bl.measured.o2) > 6) add(MED, tag, 'High excess air (O₂ > 6%)',
      `Flue gas O₂ of ${bl.measured.o2}% indicates high excess air, reducing combustion efficiency.`,
      'Tune burner to reduce excess air. Target O₂: 2–4% for natural gas, 3–5% for fuel oil.');

    if (n(bl.measured.co) > 100) add(HIGH, tag, 'Elevated CO in flue gas',
      `CO of ${bl.measured.co} ppm indicates incomplete combustion — safety and efficiency risk.`,
      'Immediate burner inspection. Check air supply and fuel pressure. Do not operate until investigated.');

    if (bl.measured.condensateReturn && n(bl.measured.condensateReturn) < 70) add(MED, tag, 'Low condensate return rate',
      `Condensate return of ${bl.measured.condensateReturn}% is below 70% target. Energy and water waste.`,
      'Survey steam traps. Repair leaking traps and condensate lines. Investigate non-return points.');
  });

  // ── Cross-system ───────────────────────────────────────────────────────────
  const hasAC = acChillers.some(c => c.running === 'Y');
  const hasWC = wcChillers.some(c => c.running === 'Y');

  if (hasAC && hasWC) {
    const acLoad = acChillers.filter(c => c.running === 'Y').reduce((s, c) => {
      const v = acCalcs(c); return s + (v.coolTR || 0);
    }, 0);
    const wcInstalled = wcChillers.reduce((s, c) => s + (n(c.nameplate.capTR) || 0), 0);
    const wcLoad = wcChillers.filter(c => c.running === 'Y').reduce((s, c) => {
      const v = wcCalcs(c); return s + (v.coolTR || 0);
    }, 0);
    const spare = wcInstalled - wcLoad;

    if (spare >= acLoad && acLoad > 0) add(HIGH, 'Plant',
      `AC load (${fmt(acLoad, 0)} TR) can be fully absorbed by existing WC plant`,
      `WC chillers have ${fmt(spare, 0)} TR spare capacity. Shifting AC load to WC could save significant energy (AC ~1.0–1.2 kW/TR vs WC ~0.5–0.6 kW/TR).`,
      'Conduct full AC→WC migration study. Verify CHW piping connections and control strategy.');
    else if (spare > 0 && acLoad > 0) add(MED, 'Plant',
      `Partial AC→WC load migration possible (${fmt(spare, 0)} TR spare)`,
      `${fmt(spare, 0)} TR of WC spare capacity could absorb part of the AC load (${fmt(acLoad, 0)} TR running).`,
      'Evaluate partial load transfer. Review piping connections and control sequencing.');
  }

  return findings.sort((a, b) => (SEV_ORDER[a.sev] ?? 5) - (SEV_ORDER[b.sev] ?? 5));
}
