import * as XLSX from 'xlsx';
import { n, fmt, wcCalcs, acCalcs, pumpCalcs, towerCalcs, compCalcs, boilerCalcs, plantSummary } from './calculations.js';
import { getSuggestions } from './suggestions.js';

const BRAND = 'ENSPAR SUSTAINABILITY PVT. LTD.  ·  On-Site Utility Audit  ·  Measurement Data Capture';

function ws(data) { return XLSX.utils.aoa_to_sheet(data); }
function addSheet(wb, sheetData, name) { XLSX.utils.book_append_sheet(wb, ws(sheetData), name); }

// ── Site Log ─────────────────────────────────────────────────────────────────

function buildSiteSheet(site) {
  const rows = [
    [BRAND],
    ['Site Log & Ambient Conditions   |   Section A'],
    [],
    ['Audit Reference No.', site.refNo || ''],
    ['Plant Name & Location', `${site.plant || ''} — ${site.location || ''}`],
    ['Client / Organisation', site.client || ''],
    ['Lead Auditor', site.auditor || ''],
    ['Audit Team', site.team || ''],
    ['Customer Contact', site.contact || ''],
    ['Audit Date', site.date || ''],
    [],
    ['B. Ambient Conditions Log'],
    ['Time', 'Dry Bulb (°C)', 'Wet Bulb (°C)', 'Relative Humidity (%)', 'Barometric Pressure (mbar)', 'Wind', 'Sky', 'Initials'],
    ...(site.ambientLog || []).map(r => [r.time, r.dbt, r.wbt, r.rh, r.baro, r.wind, r.sky, r.initials])
  ];
  return rows;
}

// ── WC Chillers ───────────────────────────────────────────────────────────────

function buildWCSheet(chillers) {
  const rows = [
    [BRAND],
    ['Water-Cooled Chillers – OEM vs Field Measured   |   Section C1'],
    ['Blue = OEM/Nameplate     Yellow = Field measured     Green = Auto-calculated'],
    [],
    ['PART 1 – OEM / NAMEPLATE DATA'],
    ['Tag', 'Make & Model', 'Rated Cap (TR)', 'Rated Power (kW)', 'Rated COP', 'OEM kW/TR', 'CHW Supply (°C)', 'CHW Return (°C)', 'CHW Flow (m³/hr)', 'CW Entering (°C)', 'CW Leaving (°C)', 'CW Flow (m³/hr)', 'Refrigerant', 'Year of Mfg', 'IPLV Notes'],
    ...chillers.map(c => {
      const np = c.nameplate;
      const kwtr = (n(np.ratedKW) && n(np.capTR)) ? (n(np.ratedKW) / n(np.capTR)).toFixed(3) : '';
      return [c.tag, np.makeModel, np.capTR, np.ratedKW, np.ratedCOP, kwtr, np.chwst, np.chwrt, np.chwFlow, np.cwEntering, np.cwLeaving, np.cwFlow, np.refrigerant, np.yearMfg, np.iplvNotes];
    }),
    [],
    ['PART 2 – FIELD MEASURED DATA'],
    ['Tag', 'Running?', 'Time', 'CHW Supply (°C)', 'CHW Return (°C)', 'CHW ΔT', 'CHW Flow (m³/hr)', 'Load (TR)', 'Load (kW)', 'CW Entering (°C)', 'CW Leaving (°C)', 'CW ΔT', 'CW Flow (m³/hr)', 'Power (kW)', 'Actual COP', 'Actual kW/TR', '% Loading', 'COP Ratio (%)', 'kW/TR Dev (%)', 'Status', 'Current (A)', 'Vibration (mm/s)', 'Fault Codes', 'Initials', 'Remarks'],
    ...chillers.map(c => {
      const m = c.measured;
      const cv = wcCalcs(c);
      return [c.tag, c.running, m.time, m.chwst, m.chwrt, fmt(cv.chwDt, 1), m.chwFlow,
        fmt(cv.coolTR, 1), fmt(cv.coolKW, 0), m.cwEntering, m.cwLeaving, fmt(cv.cwDt, 1),
        m.cwFlow, m.powerKW, fmt(cv.cop, 2), fmt(cv.kwtr, 3), cv.pctLoad ? (cv.pctLoad * 100).toFixed(1) + '%' : '—',
        cv.copRatio ? (cv.copRatio * 100).toFixed(1) + '%' : '—',
        cv.kwtrDev ? (cv.kwtrDev * 100).toFixed(1) + '%' : '—',
        cv.perfStatus === 'good' ? '✅ Good' : cv.perfStatus === 'warn' ? '⚠️ Degraded' : cv.perfStatus === 'bad' ? '❌ Poor' : '—',
        m.current, m.vibration, m.faultCodes, m.initials, m.remarks];
    })
  ];
  return rows;
}

// ── AC Chillers ───────────────────────────────────────────────────────────────

function buildACSheet(chillers) {
  const rows = [
    [BRAND],
    ['Air-Cooled Chillers – OEM vs Field Measured   |   Section C2'],
    ['Blue = OEM/Nameplate     Yellow = Field measured     Green = Auto-calculated'],
    [],
    ['PART 1 – OEM / NAMEPLATE DATA'],
    ['Tag', 'Make & Model', 'Rated Cap (TR)', 'Rated Power (kW)', 'Rated COP', 'OEM kW/TR', 'CHW Supply (°C)', 'CHW Return (°C)', 'CHW Flow (m³/hr)', 'Design Ambient (°C)', 'No. Compressors', 'Comp Type', 'Refrigerant', 'Year of Mfg', 'IPLV Notes'],
    ...chillers.map(c => {
      const np = c.nameplate;
      const kwtr = (n(np.ratedKW) && n(np.capTR)) ? (n(np.ratedKW) / n(np.capTR)).toFixed(3) : '';
      return [c.tag, np.makeModel, np.capTR, np.ratedKW, np.ratedCOP, kwtr, np.chwst, np.chwrt, np.chwFlow, np.designAmbient, np.numCompressors, np.compType, np.refrigerant, np.yearMfg, np.iplvNotes];
    }),
    [],
    ['PART 2 – FIELD MEASURED DATA'],
    ['Tag', 'Running?', 'Time', 'Ambient DB (°C)', 'CHW Supply (°C)', 'CHW Return (°C)', 'CHW ΔT', 'CHW Flow (m³/hr)', 'Load (TR)', 'Load (kW)', 'Derating Factor', 'Power (kW)', 'Actual COP', 'Actual kW/TR', '% Loading', 'COP Ratio (%)', 'Ambient-Corr COP', 'Status', 'Coil Condition', 'Current (A)', 'Initials', 'Remarks'],
    ...chillers.map(c => {
      const m = c.measured;
      const cv = acCalcs(c);
      return [c.tag, c.running, m.time, m.ambientDB, m.chwst, m.chwrt, fmt(cv.chwDt, 1), m.chwFlow,
        fmt(cv.coolTR, 1), fmt(cv.coolKW, 0), cv.derating ? cv.derating.toFixed(3) : '—',
        m.powerKW, fmt(cv.cop, 2), fmt(cv.kwtr, 3), cv.pctLoad ? (cv.pctLoad * 100).toFixed(1) + '%' : '—',
        cv.copRatio ? (cv.copRatio * 100).toFixed(1) + '%' : '—', fmt(cv.corrCOP, 2),
        cv.perfStatus === 'good' ? '✅ Good' : cv.perfStatus === 'warn' ? '⚠️ Degraded' : cv.perfStatus === 'bad' ? '❌ Poor' : '—',
        m.coilCondition, m.current, m.initials, m.remarks];
    })
  ];
  return rows;
}

// ── Pumps ─────────────────────────────────────────────────────────────────────

function buildPumpSheet(pumps) {
  const rows = [
    [BRAND],
    ['Pumps – Operating Data & VFD Affinity Law Verification   |   Section D'],
    ['AFFINITY LAWS: Flow ∝ N  |  Head ∝ N²  |  Power ∝ N³'],
    [],
    ['Tag', 'Service', 'Make & Model', 'Rated Flow (m³/hr)', 'Rated Head (m WC)', 'Rated Power (kW)', 'Rated RPM', 'Rated Eff (%)', 'VFD?', 'Meas Hz', 'Speed Ratio', 'Inlet P (bar g)', 'Outlet P (bar g)', 'Diff Head (m WC)', 'Meas Flow (m³/hr)', 'Meas Power (kW)', 'Current (A)', 'Pred Flow', 'Pred Head', 'Pred Power', 'Flow Dev (%)', 'Head Dev (%)', 'Power Dev (%)', 'Hyd Eff (%)', 'VFD Status', 'Remarks'],
    ...pumps.map(p => {
      const np = p.nameplate, m = p.measured;
      const c = pumpCalcs(p);
      return [p.tag, p.service, np.makeModel, np.ratedFlow, np.ratedHead, np.ratedKW, np.ratedRPM, np.ratedEff,
        np.vfdFitted, m.hz, c.speedRatio ? c.speedRatio.toFixed(3) : '—',
        m.inletP, m.outletP, fmt(c.diffHead, 1), m.measFlow, m.measKW, m.current,
        fmt(c.predFlow, 1), fmt(c.predHead, 1), fmt(c.predPower, 1),
        c.flowDev ? (c.flowDev * 100).toFixed(1) + '%' : '—',
        c.headDev ? (c.headDev * 100).toFixed(1) + '%' : '—',
        c.powerDev ? (c.powerDev * 100).toFixed(1) + '%' : '—',
        c.hydEff ? (c.hydEff * 100).toFixed(1) + '%' : '—',
        c.vfdStatus === 'good' ? '✅ OK' : c.vfdStatus === 'bad' ? '❌ Over-consuming' : c.vfdStatus === 'warn' ? '⚠️ Check setpoint' : '—',
        m.remarks];
    })
  ];
  return rows;
}

// ── Cooling Towers ────────────────────────────────────────────────────────────

function buildTowerSheet(towers) {
  const rows = [
    [BRAND],
    ['Cooling Towers – Operating Data & Fan VFD Check   |   Section E'],
    [],
    ['Tag', 'Make & Model', 'Rated Cap (TR)', 'Fan kW', 'VFD?', 'Meas Hz', 'Fan Speed Ratio', 'Affinity Fan kW', 'CW Entering (°C)', 'CW Leaving (°C)', 'CW Range (°C)', 'WBT (°C)', 'Approach (°C)', 'CW Flow (m³/hr)', 'Heat Rej (kW)', 'Fan Current (A)', 'Meas Fan kW', 'Effectiveness (%)', 'Fan Status', 'Drift?', 'Fill Condition', 'TDS (ppm)', 'Remarks'],
    ...towers.map(ct => {
      const np = ct.nameplate, m = ct.measured;
      const c = towerCalcs(ct);
      return [ct.tag, np.makeModel, np.capTR, np.fanKW, np.vfdFitted, m.fanHz,
        c.fanSpeedRatio ? c.fanSpeedRatio.toFixed(3) : '—', fmt(c.affinityFanPower, 1),
        m.cwEntering, m.cwLeaving, fmt(c.range, 1), m.wbt, fmt(c.approach, 1),
        m.cwFlow, fmt(c.heatRejKW, 0), m.fanCurrent, m.measFanKW,
        c.effectiveness ? (c.effectiveness * 100).toFixed(1) + '%' : '—',
        c.fanStatus === 'good' ? '✅ OK' : c.fanStatus === 'bad' ? '❌ Over-consuming' : c.fanStatus === 'warn' ? '⚠️ Check' : '—',
        m.driftVisible, m.fillCondition, m.tds, m.remarks];
    })
  ];
  return rows;
}

// ── Compressors ───────────────────────────────────────────────────────────────

function buildCompSheet(compressors) {
  const rows = [
    [BRAND],
    ['Air Compressors – Operating Data & VFD Efficiency   |   Section F'],
    [],
    ['Tag', 'Make & Model', 'Rated Cap (m³/min)', 'Rated Disch P (bar g)', 'Rated kW', 'Rated Spec Pwr', 'VFD?', 'Meas Hz', 'Speed Ratio', 'Pred Power', 'Inlet P (bar g)', 'Disch P (bar g)', 'Meas Flow (m³/min)', 'Meas Power (kW)', 'Current (A)', 'Disch Temp (°C)', 'Network Drop (bar)', 'Actual Spec Pwr', 'Spec Pwr Dev (%)', 'Power Dev (%)', 'Dryer?', 'Dewpoint (°C)', 'Auto-drain OK?', 'Status', 'Remarks'],
    ...compressors.map(cp => {
      const np = cp.nameplate, m = cp.measured;
      const c = compCalcs(cp);
      return [cp.tag, np.makeModel, np.ratedCap, np.ratedDischP, np.ratedKW, fmt(c.ratedSpecPwr, 2),
        np.vfdFitted, m.hz, c.speedRatio ? c.speedRatio.toFixed(3) : '—', fmt(c.predPower, 1),
        m.inletP, m.dischP, m.measFlow, m.measKW, m.current, m.dischTemp, m.networkDrop,
        fmt(c.actualSpecPwr, 2),
        c.specPwrDev ? (c.specPwrDev * 100).toFixed(1) + '%' : '—',
        c.powerDev ? (c.powerDev * 100).toFixed(1) + '%' : '—',
        m.dryerRunning, m.dryerDewpoint, m.autoDrainOK,
        c.status === 'good' ? '✅ OK' : c.status === 'warn' ? '⚠️ Check' : c.status === 'bad' ? '❌ Action required' : '—',
        m.remarks];
    })
  ];
  return rows;
}

// ── Boilers ───────────────────────────────────────────────────────────────────

function buildBoilerSheet(boilers) {
  const rows = [
    [BRAND],
    ['Boilers & Steam Generators – Operating Data   |   Section G'],
    [],
    ['Tag', 'Make & Model', 'Rated Cap (TPH/kW)', 'Rated Press (bar g)', 'Rated Eff (%)', 'Fuel', 'Running?', 'Steam Press (bar g)', 'Steam Flow (TPH)', '% Loading', 'Feed Water Temp (°C)', 'Steam Temp (°C)', 'Flue Gas Temp (°C)', 'Ambient Temp (°C)', 'Excess Flue Temp', 'O₂ (%)', 'CO₂ (%)', 'CO (ppm)', 'Comb Eff (%)', 'Stack Loss (%)', 'Fuel Flow', 'Fuel Unit', 'Condensate Return (%)', 'Steam Trap Done?', 'Status', 'Remarks'],
    ...boilers.map(bl => {
      const np = bl.nameplate, m = bl.measured;
      const c = boilerCalcs(bl);
      return [bl.tag, np.makeModel, np.ratedCap, np.ratedPressure, np.ratedEff, np.fuelType,
        m.running, m.steamPressure, m.steamFlow, c.pctLoad ? (c.pctLoad * 100).toFixed(1) + '%' : '—',
        m.feedWaterTemp, m.steamTemp, m.flueGasTemp, m.ambientTemp, fmt(c.excessFlue, 0),
        m.o2, m.co2, m.co, c.combEff ? (c.combEff * 100).toFixed(1) + '%' : '—',
        c.stackLoss ? (c.stackLoss * 100).toFixed(1) + '%' : '—',
        m.fuelFlow, m.fuelUnit, m.condensateReturn, m.steamTrapSurvey,
        c.status === 'good' ? '✅ Good' : c.status === 'warn' ? '⚠️ Tune burner' : c.status === 'bad' ? '❌ Service required' : '—',
        m.remarks];
    })
  ];
  return rows;
}

// ── Plant Analysis ────────────────────────────────────────────────────────────

function buildAnalysisSheet(state) {
  const { wcChillers = [], acChillers = [], pumps = [], towers = [], compressors = [], boilers = [] } = state;
  const s = plantSummary(wcChillers, acChillers, pumps, towers, compressors, boilers);

  const rows = [
    [BRAND],
    ['Chiller Plant Performance Analysis   |   Section C3'],
    [],
    ['ASSUMPTIONS'],
    ['Annual Operating Hours (hrs/yr)', 8760],
    ['Electricity Tariff (₹/kWh)', 9],
    ['WC Target kW/TR', 0.55],
    ['India Grid Carbon Factor (kgCO₂/kWh)', 0.82],
    [],
    ['PLANT SUMMARY'],
    ['Metric', 'Value', 'Unit'],
    ['Total WC Chiller Running Load', fmt(s.totalWcTR, 1), 'TR'],
    ['Total AC Chiller Running Load', fmt(s.totalAcTR, 1), 'TR'],
    ['Total Plant Cooling Load', fmt(s.totalTR, 1), 'TR'],
    ['Total Chiller Power', fmt(s.totalChKW, 0), 'kW'],
    ['Total Auxiliary Power (pumps/fans)', fmt(s.totalAuxKW, 0), 'kW'],
    ['Total Plant Power', fmt(s.totalKW, 0), 'kW'],
    ['Plant COP', fmt(s.pCOP, 2), ''],
    ['Chiller kW/TR', fmt(s.chKWT, 3), 'kW/TR'],
    ['Plant kW/TR', fmt(s.pKWT, 3), 'kW/TR'],
    [],
    ['AC → WC REPLACEMENT OPPORTUNITY'],
    ['WC Installed Capacity', fmt(s.wcInstalledTR, 0), 'TR'],
    ['WC Running Load', fmt(s.totalWcTR, 0), 'TR'],
    ['WC Spare Capacity', fmt(s.wcSpare, 0), 'TR'],
    ['AC Running Load', fmt(s.acLoad, 0), 'TR'],
  ];

  if (s.acLoad > 0 && n(state.assumptions?.tariff) !== null) {
    const tariff = n(state.assumptions?.tariff) || 9;
    const hrs = n(state.assumptions?.hours) || 8760;
    const wcTarget = n(state.assumptions?.wcTarget) || 0.55;
    const acKwtr = s.acLoad > 0 && s.totalChKW > 0 ? s.totalChKW / s.totalTR : 1.05;
    const acEnergy = s.acLoad * acKwtr * hrs * tariff;
    const wcEnergy = s.acLoad * wcTarget * hrs * tariff;
    const savings = acEnergy - wcEnergy;
    const carbon = savings / tariff * 0.82;

    rows.push([]);
    rows.push(['Estimated Annual Energy Saving', fmt(savings / 100000, 2), 'Lakh ₹/yr']);
    rows.push(['Estimated Carbon Saving', fmt(carbon, 0), 'kgCO₂/yr']);
  }

  return rows;
}

// ── Findings ──────────────────────────────────────────────────────────────────

function buildFindingsSheet(state) {
  const findings = getSuggestions(state);
  const rows = [
    [BRAND],
    ['Findings & Recommendations'],
    [],
    ['Severity', 'Equipment', 'Finding', 'Detail', 'Recommended Action'],
    ...findings.map(f => [f.sev, f.eq, f.title, f.detail, f.action || ''])
  ];
  return rows;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateReport(state) {
  const { site = {}, wcChillers = [], acChillers = [], pumps = [], towers = [], compressors = [], boilers = [] } = state;

  const wb = XLSX.utils.book_new();

  addSheet(wb, buildSiteSheet(site), '📋 Site Log');
  if (wcChillers.length) addSheet(wb, buildWCSheet(wcChillers), '❄️ WC Chillers');
  if (acChillers.length) addSheet(wb, buildACSheet(acChillers), '❄️ AC Chillers');
  addSheet(wb, buildAnalysisSheet(state), '📊 Chiller Analysis');
  if (pumps.length) addSheet(wb, buildPumpSheet(pumps), '💧 Pumps + VFD');
  if (towers.length) addSheet(wb, buildTowerSheet(towers), '🌬️ Cooling Towers');
  if (compressors.length) addSheet(wb, buildCompSheet(compressors), '🔧 Air Compressors');
  if (boilers.length) addSheet(wb, buildBoilerSheet(boilers), '🔥 Boilers');
  addSheet(wb, buildFindingsSheet(state), '🔍 Findings');

  const date = site.date ? site.date.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g,'');
  const plant = (site.plant || 'Audit').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Enspar_Audit_${plant}_${date}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
