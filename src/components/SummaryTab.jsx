import { useState } from 'react';
import { Card, SecH, Inp, Btn, Badge, KpiTile } from './ui.jsx';
import { n, fmt, fmtPct, wcCalcs, acCalcs, pumpCalcs, towerCalcs, compCalcs, boilerCalcs, plantSummary } from '../utils/calculations.js';
import { getSuggestions } from '../utils/suggestions.js';
import { generateReport } from '../utils/export.js';

// ── Default assumptions (editable) ───────────────────────────────────────────
const DEFAULT_ASSUMPTIONS = { tariff: 9, hours: 8760, wcTarget: 0.55, carbonFactor: 0.82, auxPerTR: 0.10 };

export default function SummaryTab({ state }) {
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState('');

  const uA = k => v => setAssumptions(a => ({ ...a, [k]: v }));

  const { wcChillers = [], acChillers = [], pumps = [], towers = [], compressors = [], boilers = [] } = state;
  const s = plantSummary(wcChillers, acChillers, pumps, towers, compressors, boilers);
  const findings = getSuggestions(state);
  const highCount = findings.filter(f => f.sev === 'HIGH').length;
  const medCount = findings.filter(f => f.sev === 'MEDIUM').length;
  const goodCount = findings.filter(f => f.sev === 'GOOD').length;

  // AC → WC energy savings
  const acRunning = acChillers.filter(c => c.running === 'Y');
  const acAvgKwtr = acRunning.length > 0 && s.acLoad > 0 ? (acRunning.reduce((sum, c) => { const v = acCalcs(c); return sum + (n(c.measured.powerKW) || 0); }, 0) / s.acLoad) : null;
  const wcTargetTotal = n(assumptions.wcTarget);
  const auxPerTR = n(assumptions.auxPerTR);
  const tariff = n(assumptions.tariff);
  const hours = n(assumptions.hours);
  const carbon = n(assumptions.carbonFactor);

  let acsavKwtr = null, acsavKWH = null, acsavLakhRs = null, acsavCO2 = null;
  if (s.acLoad > 0 && acAvgKwtr && wcTargetTotal && tariff && hours && carbon) {
    acsavKwtr = acAvgKwtr - (wcTargetTotal + (auxPerTR || 0));
    acsavKWH = Math.max(0, acsavKwtr) * s.acLoad * hours;
    acsavLakhRs = (acsavKWH * tariff) / 100000;
    acsavCO2 = (acsavKWH * carbon) / 1000; // tonnes CO2/yr
  }

  const doExport = async () => {
    setExporting(true); setExportErr('');
    try {
      generateReport({ ...state, assumptions });
    } catch (e) {
      setExportErr(e.message || 'Export failed');
    }
    setExporting(false);
  };

  const hasAny = wcChillers.length || acChillers.length || pumps.length || towers.length || compressors.length || boilers.length;

  return (
    <div>
      {/* Export button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Btn full onClick={doExport} disabled={exporting || !hasAny}>
          {exporting ? '⏳ Generating…' : '📥 Export to Excel'}
        </Btn>
      </div>
      {exportErr && <div style={{ fontSize: 12, color: 'var(--red-dk)', background: 'var(--red-lt)', padding: '8px 10px', borderRadius: 6, marginBottom: 10 }}>{exportErr}</div>}

      {/* Findings summary bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {highCount > 0 && <div style={{ flex: 1, padding: '10px 12px', background: 'var(--red-lt)', borderRadius: 10, textAlign: 'center', border: '1px solid var(--red-bd)' }}>
          <div style={{ fontSize: 20, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--red-dk)' }}>{highCount}</div>
          <div style={{ fontSize: 10, color: 'var(--red-dk)', fontWeight: 600 }}>HIGH</div>
        </div>}
        {medCount > 0 && <div style={{ flex: 1, padding: '10px 12px', background: 'var(--amber-lt)', borderRadius: 10, textAlign: 'center', border: '1px solid var(--amber-bd)' }}>
          <div style={{ fontSize: 20, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--amber-dk)' }}>{medCount}</div>
          <div style={{ fontSize: 10, color: 'var(--amber-dk)', fontWeight: 600 }}>MEDIUM</div>
        </div>}
        {goodCount > 0 && <div style={{ flex: 1, padding: '10px 12px', background: 'var(--green-lt)', borderRadius: 10, textAlign: 'center', border: '1px solid var(--green-bd)' }}>
          <div style={{ fontSize: 20, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green-dk)' }}>{goodCount}</div>
          <div style={{ fontSize: 10, color: 'var(--green-dk)', fontWeight: 600 }}>GOOD</div>
        </div>}
      </div>

      {!hasAny && (
        <Card><div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div>Fill in Site + Equipment data to see the analysis.</div>
        </div></Card>
      )}

      {/* Plant KPIs */}
      {hasAny && <>
        <Card>
          <SecH t="Plant KPI Summary" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <KpiTile label="Total Plant Load" value={s.totalTR > 0 ? fmt(s.totalTR, 0) : '—'} unit="TR" />
            <KpiTile label="Total Plant Power" value={s.totalKW > 0 ? fmt(s.totalKW, 0) : '—'} unit="kW" />
            <KpiTile label="Plant COP" value={s.pCOP !== null ? fmt(s.pCOP, 2) : '—'}
              status={s.pCOP !== null ? (s.pCOP > 3.5 ? 'good' : s.pCOP > 2.5 ? 'warn' : 'bad') : null} />
            <KpiTile label="Plant kW/TR" value={s.pKWT !== null ? fmt(s.pKWT, 3) : '—'} unit="kW/TR"
              status={s.pKWT !== null ? (s.pKWT < 0.7 ? 'good' : s.pKWT < 0.9 ? 'warn' : 'bad') : null} />
            <KpiTile label="Chiller kW/TR" value={s.chKWT !== null ? fmt(s.chKWT, 3) : '—'} unit="kW/TR" />
            <KpiTile label="Aux Power (pumps/fans)" value={s.totalAuxKW > 0 ? fmt(s.totalAuxKW, 0) : '—'} unit="kW" />
          </div>
        </Card>

        {/* Chiller matrix */}
        {(wcChillers.length > 0 || acChillers.length > 0) && (
          <Card>
            <SecH t="Chiller Performance Matrix" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 480 }}>
                <thead>
                  <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                    {['Tag', 'Type', 'Run?', 'Load (TR)', 'kW', 'kW/TR', 'COP', 'vs OEM', 'Status'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wcChillers.map((ch, i) => {
                    const c = wcCalcs(ch);
                    const st = c.perfStatus;
                    return (
                      <tr key={ch.id} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{ch.tag}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>WC</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{ch.running === 'Y' ? '✅' : '⛔'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmt(c.coolTR, 0)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{n(ch.measured.powerKW) ? fmt(n(ch.measured.powerKW), 0) : '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmt(c.kwtr, 3)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmt(c.cop, 2)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--mono)', color: c.copRatio !== null ? (c.copRatio > 0.9 ? 'var(--green-dk)' : c.copRatio > 0.75 ? 'var(--amber-dk)' : 'var(--red-dk)') : 'var(--text2)' }}>
                          {c.copRatio !== null ? fmt(c.copRatio * 100, 0) + '%' : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 14 }}>
                          {st === 'good' ? '✅' : st === 'warn' ? '⚠️' : st === 'bad' ? '❌' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {acChillers.map((ch, i) => {
                    const c = acCalcs(ch);
                    return (
                      <tr key={ch.id} style={{ background: (wcChillers.length + i) % 2 === 0 ? 'var(--bg)' : 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{ch.tag}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>AC</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{ch.running === 'Y' ? '✅' : '⛔'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmt(c.coolTR, 0)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{n(ch.measured.powerKW) ? fmt(n(ch.measured.powerKW), 0) : '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmt(c.kwtr, 3)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmt(c.cop, 2)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--mono)', color: c.copRatio !== null ? (c.copRatio > 0.9 ? 'var(--green-dk)' : c.copRatio > 0.75 ? 'var(--amber-dk)' : 'var(--red-dk)') : 'var(--text2)' }}>
                          {c.copRatio !== null ? fmt(c.copRatio * 100, 0) + '%' : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 14 }}>
                          {c.perfStatus === 'good' ? '✅' : c.perfStatus === 'warn' ? '⚠️' : c.perfStatus === 'bad' ? '❌' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* AC → WC Analysis */}
        {acChillers.length > 0 && (
          <Card>
            <SecH t="AC → WC Chiller Replacement Analysis" />
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>
              Air-cooled chillers typically consume 1.0–1.2 kW/TR vs 0.5–0.6 kW/TR for water-cooled units.
              Replace or supplement AC plant with WC for significant energy and carbon savings.
            </div>

            {/* Assumptions */}
            <SecH t="Analysis Assumptions (editable)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <Inp label="Electricity Tariff" value={assumptions.tariff} onChange={uA('tariff')} unit="₹/kWh" type="number" />
              <Inp label="Annual Operating Hours" value={assumptions.hours} onChange={uA('hours')} unit="hrs/yr" type="number" />
              <Inp label="Target WC kW/TR" value={assumptions.wcTarget} onChange={uA('wcTarget')} unit="kW/TR" type="number" note="New WC chiller full-load" />
              <Inp label="Auxiliary per TR (pumps/fans)" value={assumptions.auxPerTR} onChange={uA('auxPerTR')} unit="kW/TR" type="number" note="CWP + CT fan allowance" />
              <Inp label="Grid Carbon Factor" value={assumptions.carbonFactor} onChange={uA('carbonFactor')} unit="kgCO₂/kWh" type="number" />
            </div>

            {/* Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <KpiTile label="AC Running Load" value={s.acLoad > 0 ? fmt(s.acLoad, 0) : '—'} unit="TR" />
              <KpiTile label="WC Spare Capacity" value={fmt(s.wcSpare, 0)} unit="TR" status={s.wcSpare >= s.acLoad ? 'good' : s.wcSpare > 0 ? 'warn' : 'bad'} />
              {acAvgKwtr && <KpiTile label="AC Avg kW/TR (actual)" value={fmt(acAvgKwtr, 3)} unit="kW/TR" />}
              {acsavKwtr !== null && <KpiTile label="Energy Saving Rate" value={fmt(acsavKwtr, 3)} unit="kW/TR" status={acsavKwtr > 0 ? 'good' : 'info'} />}
              {acsavKWH !== null && <KpiTile label="Annual Energy Saving" value={fmt(acsavKWH / 1000, 0)} unit="MWh/yr" />}
              {acsavLakhRs !== null && <KpiTile label="Annual Cost Saving" value={`₹${fmt(acsavLakhRs, 1)}L`} unit="per year" status={acsavLakhRs > 10 ? 'good' : 'warn'} />}
              {acsavCO2 !== null && <KpiTile label="Carbon Saving" value={fmt(acsavCO2, 0)} unit="tCO₂/yr" status="good" />}
            </div>
            {s.wcSpare >= s.acLoad && s.acLoad > 0 && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--green-lt)', borderRadius: 8, border: '1px solid var(--green-bd)', fontSize: 13, color: 'var(--green-dk)', fontWeight: 500 }}>
                ✅ Sufficient WC spare capacity exists to absorb the full AC load — migration study recommended.
              </div>
            )}
          </Card>
        )}

        {/* Pump summary */}
        {pumps.length > 0 && (
          <Card>
            <SecH t="Pump Efficiency Summary" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Tag', 'Service', 'VFD', 'Diff Head (m)', 'Hyd Eff', 'VFD Status'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pumps.map((pp, i) => {
                    const c = pumpCalcs(pp);
                    return (
                      <tr key={pp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{pp.tag}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--text2)' }}>{pp.service}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{pp.nameplate.vfdFitted === 'Yes' ? '✅' : '—'}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)', textAlign: 'right' }}>{fmt(c.diffHead, 1)}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)', textAlign: 'right',
                          color: c.hydEff ? (c.hydEff > 0.65 ? 'var(--green-dk)' : c.hydEff > 0.5 ? 'var(--amber-dk)' : 'var(--red-dk)') : 'inherit' }}>
                          {c.hydEff ? fmt(c.hydEff * 100, 1) + '%' : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {c.vfdStatus === 'good' ? '✅' : c.vfdStatus === 'bad' ? '❌' : c.vfdStatus === 'warn' ? '⚠️' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tower summary */}
        {towers.length > 0 && (
          <Card>
            <SecH t="Cooling Tower Summary" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Tag', 'Range (°C)', 'Approach (°C)', 'Effectiveness', 'Status'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {towers.map((ct, i) => {
                    const c = towerCalcs(ct);
                    const st = c.approach !== null ? (c.approach < 2 ? 'good' : c.approach < 5 ? 'warn' : 'bad') : null;
                    return (
                      <tr key={ct.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{ct.tag}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)', textAlign: 'right' }}>{fmt(c.range, 1)}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)', textAlign: 'right',
                          color: st === 'good' ? 'var(--green-dk)' : st === 'warn' ? 'var(--amber-dk)' : st === 'bad' ? 'var(--red-dk)' : 'inherit' }}>
                          {fmt(c.approach, 1)}
                        </td>
                        <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)', textAlign: 'right' }}>
                          {c.effectiveness ? fmt(c.effectiveness * 100, 1) + '%' : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {st === 'good' ? '✅' : st === 'warn' ? '⚠️' : st === 'bad' ? '❌' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Boiler summary */}
        {boilers.length > 0 && (
          <Card>
            <SecH t="Boiler Combustion Summary" />
            {boilers.map(bl => {
              const c = boilerCalcs(bl);
              return (
                <div key={bl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{bl.tag}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{c.combEff ? fmt(c.combEff * 100, 1) + '%' : '—'}</span>
                    <span style={{ fontSize: 14 }}>{c.status === 'good' ? '✅' : c.status === 'warn' ? '⚠️' : c.status === 'bad' ? '❌' : '—'}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* Findings & Recommendations */}
        <Card>
          <SecH t={`Findings & Recommendations (${findings.length})`} />
          {findings.length === 0
            ? <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text2)', fontSize: 13 }}>No findings generated — fill in equipment data first.</div>
            : findings.map((f, i) => (
              <div key={i} style={{ marginBottom: 10, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                  <Badge sev={f.sev} />
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{f.eq}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: f.action ? 6 : 0 }}>{f.detail}</div>
                {f.action && (
                  <div style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-lt)', padding: '6px 10px', borderRadius: 6, lineHeight: 1.5 }}>
                    <strong>Action:</strong> {f.action}
                  </div>
                )}
              </div>
            ))
          }
        </Card>

        {/* Re-export at bottom */}
        <Btn full onClick={doExport} disabled={exporting} style={{ marginTop: 4 }}>
          {exporting ? '⏳ Generating…' : '📥 Export Full Report to Excel'}
        </Btn>
        <div style={{ height: 8 }} />
      </>}
    </div>
  );
}
