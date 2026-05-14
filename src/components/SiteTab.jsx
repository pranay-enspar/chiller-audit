import { Card, SecH, Inp, Sel, Btn } from './ui.jsx';
import { generateId } from '../utils/storage.js';

const newAmbientRow = () => ({ id: generateId(), time: '', dbt: '', wbt: '', rh: '', baro: '', wind: 'Calm', sky: 'Clear', initials: '' });

export default function SiteTab({ site, onChange }) {
  const u = k => v => onChange({ ...site, [k]: v });
  const uLog = (i, k) => v => {
    const log = site.ambientLog.map((r, idx) => idx === i ? { ...r, [k]: v } : r);
    onChange({ ...site, ambientLog: log });
  };
  const addRow = () => onChange({ ...site, ambientLog: [...site.ambientLog, newAmbientRow()] });
  const removeRow = i => onChange({ ...site, ambientLog: site.ambientLog.filter((_, idx) => idx !== i) });

  const wbDep = (parseFloat(site.dbt) && parseFloat(site.wbt)) ? (parseFloat(site.dbt) - parseFloat(site.wbt)).toFixed(1) : null;

  return (
    <div>
      {/* Audit details */}
      <Card>
        <SecH t="Audit Details" />
        <Inp label="Audit Reference No." value={site.refNo} onChange={u('refNo')} placeholder="e.g. ENS-AUD-2025-001" />
        <Inp label="Plant Name & Location" value={site.plant} onChange={u('plant')} placeholder="Plant name, city" />
        <Inp label="Client / Organisation" value={site.client} onChange={u('client')} />
        <Inp label="Lead Auditor" value={site.auditor} onChange={u('auditor')} />
        <Inp label="Audit Team Members" value={site.team} onChange={u('team')} placeholder="Names" />
        <Inp label="Customer Contact on Site" value={site.contact} onChange={u('contact')} placeholder="Name & mobile" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Inp label="Date" value={site.date} onChange={u('date')} type="date" />
          <Inp label="Start Time" value={site.time} onChange={u('time')} type="time" />
        </div>
      </Card>

      {/* Single ambient snapshot (for calculations) */}
      <Card>
        <SecH t="Ambient Conditions (for calculations)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Inp label="Dry Bulb (DBT)" value={site.dbt} onChange={u('dbt')} unit="°C" type="number" placeholder="35.0" />
          <Inp label="Wet Bulb (WBT)" value={site.wbt} onChange={u('wbt')} unit="°C" type="number" placeholder="27.0" />
          <Inp label="Relative Humidity" value={site.rh} onChange={u('rh')} unit="%" type="number" placeholder="65" />
          <Inp label="Barometric Pressure" value={site.baro} onChange={u('baro')} unit="mbar" type="number" placeholder="1013" />
        </div>
        {wbDep && (
          <div style={{ marginTop: 6, padding: '10px 12px', background: 'var(--primary-lt)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--primary)' }}>WBT Depression</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--primary)' }}>{wbDep} °C</span>
          </div>
        )}
      </Card>

      {/* Multi-reading ambient log */}
      <Card>
        <SecH t="Ambient Conditions Log (every 2 hrs)" action={
          <Btn small variant="secondary" onClick={addRow}>+ Reading</Btn>
        } />
        {site.ambientLog.length === 0
          ? <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', padding: '12px 0' }}>No readings yet — tap + Reading to add.</div>
          : site.ambientLog.map((row, i) => (
            <div key={row.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', paddingTop: i > 0 ? 12 : 0, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>Reading {i + 1}</span>
                {site.ambientLog.length > 0 && (
                  <button onClick={() => removeRow(i)} style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Remove</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Inp label="Time" value={row.time} onChange={uLog(i, 'time')} type="time" />
                <Inp label="Initials" value={row.initials} onChange={uLog(i, 'initials')} placeholder="AB" />
                <Inp label="DBT (°C)" value={row.dbt} onChange={uLog(i, 'dbt')} type="number" unit="°C" />
                <Inp label="WBT (°C)" value={row.wbt} onChange={uLog(i, 'wbt')} type="number" unit="°C" />
                <Inp label="RH (%)" value={row.rh} onChange={uLog(i, 'rh')} type="number" unit="%" />
                <Inp label="Pressure (mbar)" value={row.baro} onChange={uLog(i, 'baro')} type="number" unit="mbar" />
                <Sel label="Wind" value={row.wind} onChange={uLog(i, 'wind')} options={[
                  { v: 'Calm', l: 'Calm' }, { v: 'Light', l: 'Light' }, { v: 'Moderate', l: 'Moderate' }, { v: 'Strong', l: 'Strong' }
                ]} />
                <Sel label="Sky" value={row.sky} onChange={uLog(i, 'sky')} options={[
                  { v: 'Clear', l: 'Clear' }, { v: 'Partly Cloudy', l: 'Partly Cloudy' }, { v: 'Overcast', l: 'Overcast' }
                ]} />
              </div>
            </div>
          ))}
      </Card>
    </div>
  );
}
