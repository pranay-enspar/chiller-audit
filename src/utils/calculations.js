// All calculations match Enspar On-Site Audit Excel formulas exactly.
// Units: temperatures °C, flow m³/hr, pressure bar g, power kW, capacity TR/kW

export const n = v => { const x = parseFloat(v); return isNaN(x) ? null : x; };
export const pct = v => v !== null ? v * 100 : null;
export const fmt = (v, d = 2) => (v === null || v === undefined || isNaN(v)) ? '—' : Number(v).toFixed(d);
export const fmtPct = (v, d = 1) => v !== null ? fmt(v * 100, d) + '%' : '—';

// ── WC Chiller ───────────────────────────────────────────────────────────────
// Matches: ❄️ WC Chillers sheet, Part 1 & 2 formulas

export function wcCalcs(ch) {
  const np = ch.nameplate;
  const m  = ch.measured;

  // Nameplate derived
  const oemKwtr = (n(np.ratedKW) !== null && n(np.capTR)) ? n(np.ratedKW) / n(np.capTR) : null;

  // CHW side — Q × ΔT × 1.1611 / 3.517 = TR  (m³/hr × °C × specific heat factor)
  const chwDt   = (n(m.chwrt) !== null && n(m.chwst) !== null) ? n(m.chwrt) - n(m.chwst) : null;
  const coolTR  = (n(m.chwFlow) !== null && chwDt !== null)    ? n(m.chwFlow) * chwDt * 1.1611 / 3.517 : null;
  const coolKW  = coolTR !== null ? coolTR * 3.517 : null;

  // Condenser side
  const cwDt    = (n(m.cwLeaving) !== null && n(m.cwEntering) !== null) ? n(m.cwLeaving) - n(m.cwEntering) : null;

  // Performance
  const cop       = (coolKW !== null && n(m.powerKW)) ? coolKW / n(m.powerKW) : null;
  const kwtr      = (n(m.powerKW) !== null && coolTR && coolTR > 0) ? n(m.powerKW) / coolTR : null;
  const pctLoad   = (coolTR !== null && n(np.capTR)) ? coolTR / n(np.capTR) : null;
  const copRatio  = (cop !== null && n(np.ratedCOP)) ? cop / n(np.ratedCOP) : null;
  const kwtrDev   = (kwtr !== null && oemKwtr !== null) ? (kwtr - oemKwtr) / oemKwtr : null;

  // Traffic light: > 0.9 good, > 0.75 warn, else bad
  const perfStatus = copRatio !== null
    ? copRatio > 0.9 ? 'good' : copRatio > 0.75 ? 'warn' : 'bad'
    : null;

  return { oemKwtr, chwDt, coolTR, coolKW, cwDt, cop, kwtr, pctLoad, copRatio, kwtrDev, perfStatus };
}

// ── AC Chiller ───────────────────────────────────────────────────────────────
// Matches: ❄️ AC Chillers sheet — includes ambient derating factor

export function acCalcs(ch) {
  const np = ch.nameplate;
  const m  = ch.measured;

  const oemKwtr = (n(np.ratedKW) !== null && n(np.capTR)) ? n(np.ratedKW) / n(np.capTR) : null;

  const chwDt  = (n(m.chwrt) !== null && n(m.chwst) !== null) ? n(m.chwrt) - n(m.chwst) : null;
  const coolTR = (n(m.chwFlow) !== null && chwDt !== null)    ? n(m.chwFlow) * chwDt * 1.1611 / 3.517 : null;
  const coolKW = coolTR !== null ? coolTR * 3.517 : null;

  // Derating: 0.8% per °C above design ambient
  const derating = (n(m.ambientDB) !== null && n(np.designAmbient) !== null)
    ? 1 - Math.max(0, n(m.ambientDB) - n(np.designAmbient)) * 0.008
    : null;

  const cop          = (coolKW !== null && n(m.powerKW)) ? coolKW / n(m.powerKW) : null;
  const kwtr         = (n(m.powerKW) !== null && coolTR && coolTR > 0) ? n(m.powerKW) / coolTR : null;
  const pctLoad      = (coolTR !== null && n(np.capTR)) ? coolTR / n(np.capTR) : null;
  const copRatio     = (cop !== null && n(np.ratedCOP)) ? cop / n(np.ratedCOP) : null;
  const corrCOP      = (cop !== null && derating && derating > 0) ? cop / derating : null;
  const kwtrDev      = (kwtr !== null && oemKwtr !== null) ? (kwtr - oemKwtr) / oemKwtr : null;

  const perfStatus = copRatio !== null
    ? copRatio > 0.9 ? 'good' : copRatio > 0.75 ? 'warn' : 'bad'
    : null;

  return { oemKwtr, chwDt, coolTR, coolKW, derating, cop, kwtr, pctLoad, copRatio, corrCOP, kwtrDev, perfStatus };
}

// ── Pump + VFD ────────────────────────────────────────────────────────────────
// Matches: 💧 Pumps + VFD sheet — affinity law verification

export function pumpCalcs(pp) {
  const np = pp.nameplate;
  const m  = pp.measured;

  // Speed ratio (Hz → fraction of rated 50 Hz)
  const speedRatio = n(m.hz) !== null ? n(m.hz) / 50 : null;

  // Differential head: (bar g) → m WC × 10.197
  const diffHead = (n(m.outletP) !== null && n(m.inletP) !== null)
    ? (n(m.outletP) - n(m.inletP)) * 10.197
    : null;

  // Affinity law predictions
  const predFlow  = (speedRatio !== null && n(np.ratedFlow)) ? n(np.ratedFlow) * speedRatio : null;
  const predHead  = (speedRatio !== null && n(np.ratedHead)) ? n(np.ratedHead) * speedRatio ** 2 : null;
  const predPower = (speedRatio !== null && n(np.ratedKW))   ? n(np.ratedKW) * speedRatio ** 3 : null;

  // Deviations
  const flowDev  = (n(m.measFlow) !== null && predFlow && predFlow > 0)   ? (n(m.measFlow) - predFlow) / predFlow : null;
  const headDev  = (diffHead !== null && predHead && predHead > 0)         ? (diffHead - predHead) / predHead : null;
  const powerDev = (n(m.measKW) !== null && predPower && predPower > 0)   ? (n(m.measKW) - predPower) / predPower : null;

  // Hydraulic efficiency: Q(m³/hr)×H(m) / (367.2 × P(kW))
  const hydEff = (n(m.measFlow) && diffHead !== null && n(m.measKW) && n(m.measKW) > 0)
    ? (n(m.measFlow) * diffHead) / (367.2 * n(m.measKW))
    : null;

  // VFD status
  let vfdStatus = null;
  if (np.vfdFitted === 'Yes' && powerDev !== null) {
    vfdStatus = Math.abs(powerDev) < 0.15 ? 'good' : powerDev > 0.15 ? 'bad' : 'warn';
  }

  return { speedRatio, diffHead, predFlow, predHead, predPower, flowDev, headDev, powerDev, hydEff, vfdStatus };
}

// ── Cooling Tower ─────────────────────────────────────────────────────────────
// Matches: 🌬️ Cooling Towers sheet

export function towerCalcs(ct) {
  const np = ct.nameplate;
  const m  = ct.measured;
  const wbt = n(m.wbt);

  const fanSpeedRatio   = n(m.fanHz) !== null ? n(m.fanHz) / 50 : null;
  const affinityFanPower = (fanSpeedRatio !== null && n(np.fanKW)) ? n(np.fanKW) * fanSpeedRatio ** 3 : null;

  // CW range = entering (hot) - leaving (cold)
  const range      = (n(m.cwEntering) !== null && n(m.cwLeaving) !== null) ? n(m.cwEntering) - n(m.cwLeaving) : null;
  // Approach = leaving (cold) - WBT
  const approach   = (n(m.cwLeaving) !== null && wbt !== null) ? n(m.cwLeaving) - wbt : null;
  // Heat rejection kW
  const heatRejKW  = (n(m.cwFlow) !== null && range !== null) ? n(m.cwFlow) * range * 1.1611 : null;
  // Effectiveness = range / (range + approach)
  const effectiveness = (range !== null && approach !== null && (range + approach) > 0)
    ? range / (range + approach)
    : null;

  // Fan VFD status
  let fanStatus = null;
  if (np.vfdFitted === 'Yes' && n(m.measFanKW) !== null && affinityFanPower !== null) {
    const dev = (n(m.measFanKW) - affinityFanPower) / affinityFanPower;
    fanStatus = Math.abs(dev) < 0.15 ? 'good' : dev > 0.15 ? 'bad' : 'warn';
  }

  return { fanSpeedRatio, affinityFanPower, range, approach, heatRejKW, effectiveness, fanStatus };
}

// ── Air Compressor ────────────────────────────────────────────────────────────
// Matches: 🔧 Air Compressors sheet

export function compCalcs(cp) {
  const np = cp.nameplate;
  const m  = cp.measured;

  const ratedSpecPwr  = (n(np.ratedKW) !== null && n(np.ratedCap)) ? n(np.ratedKW) / n(np.ratedCap) : null;
  const speedRatio    = n(m.hz) !== null ? n(m.hz) / 50 : null;
  const predPower     = (speedRatio !== null && n(np.ratedKW))   ? n(np.ratedKW) * speedRatio ** 3 : null;
  const actualSpecPwr = (n(m.measKW) !== null && n(m.measFlow) && n(m.measFlow) > 0) ? n(m.measKW) / n(m.measFlow) : null;
  const specPwrDev    = (actualSpecPwr !== null && ratedSpecPwr) ? (actualSpecPwr - ratedSpecPwr) / ratedSpecPwr : null;
  const powerDev      = (n(m.measKW) !== null && predPower && predPower > 0) ? (n(m.measKW) - predPower) / predPower : null;

  let status = null;
  if (np.vfdFitted === 'Yes' && powerDev !== null) {
    if (Math.abs(powerDev) < 0.15) status = (specPwrDev !== null && Math.abs(specPwrDev) < 0.1) ? 'good' : 'warn';
    else status = powerDev > 0.15 ? 'bad' : 'warn';
  } else if (specPwrDev !== null) {
    status = specPwrDev < 0.1 ? 'good' : specPwrDev < 0.2 ? 'warn' : 'bad';
  }

  return { ratedSpecPwr, speedRatio, predPower, actualSpecPwr, specPwrDev, powerDev, status };
}

// ── Boiler ────────────────────────────────────────────────────────────────────
// Matches: 🔥 Boilers sheet — Siegert formula variant for combustion efficiency

export function boilerCalcs(bl) {
  const np = bl.nameplate;
  const m  = bl.measured;

  const pctLoad     = (n(m.steamFlow) !== null && n(np.ratedCap)) ? n(m.steamFlow) / n(np.ratedCap) : null;
  const excessFlue  = (n(m.flueGasTemp) !== null && n(m.ambientTemp) !== null) ? n(m.flueGasTemp) - n(m.ambientTemp) : null;

  // Combustion efficiency (Siegert): 1 - 0.0068 × O2% / (21 - CO2%)
  const combEff  = (n(m.o2) !== null && n(m.co2) !== null && (21 - n(m.co2)) > 0)
    ? 1 - 0.0068 * n(m.o2) / (21 - n(m.co2))
    : null;
  const stackLoss = combEff !== null ? 1 - combEff : null;

  const status = combEff !== null
    ? combEff > 0.88 ? 'good' : combEff > 0.82 ? 'warn' : 'bad'
    : null;

  return { pctLoad, excessFlue, combEff, stackLoss, status };
}

// ── Plant Summary ─────────────────────────────────────────────────────────────

export function plantSummary(wcChillers, acChillers, pumps, towers, compressors, boilers) {
  let totalWcTR = 0, totalAcTR = 0, totalChKW = 0, totalAuxKW = 0;

  wcChillers.filter(c => c.running === 'Y').forEach(c => {
    const v = wcCalcs(c);
    if (v.coolTR)   totalWcTR  += v.coolTR;
    if (n(c.measured.powerKW)) totalChKW += n(c.measured.powerKW);
  });

  acChillers.filter(c => c.running === 'Y').forEach(c => {
    const v = acCalcs(c);
    if (v.coolTR)   totalAcTR  += v.coolTR;
    if (n(c.measured.powerKW)) totalChKW += n(c.measured.powerKW);
  });

  pumps.forEach(p => { if (n(p.measured.measKW)) totalAuxKW += n(p.measured.measKW); });
  towers.forEach(t => { if (n(t.measured.measFanKW)) totalAuxKW += n(t.measured.measFanKW); });
  compressors.forEach(c => { if (n(c.measured.measKW)) totalAuxKW += n(c.measured.measKW); });

  const totalTR  = totalWcTR + totalAcTR;
  const totalKW  = totalChKW + totalAuxKW;
  const plantKW  = totalKW;
  const pCOP     = (totalKW > 0 && totalTR > 0) ? (totalTR * 3.517) / totalKW : null;
  const pKWT     = (totalTR > 0 && totalKW > 0) ? totalKW / totalTR : null;
  const chKWT    = (totalTR > 0 && totalChKW > 0) ? totalChKW / totalTR : null;

  // AC → WC replacement opportunity
  const wcInstalledTR = wcChillers.reduce((s, c) => s + (n(c.nameplate.capTR) || 0), 0);
  const wcSpare = Math.max(0, wcInstalledTR - totalWcTR);
  const acLoad  = totalAcTR;

  return { totalWcTR, totalAcTR, totalTR, totalChKW, totalAuxKW, totalKW, plantKW, pCOP, pKWT, chKWT, wcInstalledTR, wcSpare, acLoad };
}
