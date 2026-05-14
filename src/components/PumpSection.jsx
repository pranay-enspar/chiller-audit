import { useState, useCallback } from 'react';
import { Card, SecH, Inp, Sel, Notes, CRow, Grid2, EquipBar, PhotoSlot, GalleryPicker, Btn } from './ui.jsx';
import { n, fmt, pumpCalcs } from '../utils/calculations.js';
import { extractPumpNameplate } from '../utils/ocr.js';
import { generateId } from '../utils/storage.js';

export const newPump = (i = 0) => ({
  id: generateId(), tag: `PP-${i + 1}`, service: 'CHWP',
  nameplate: { makeModel: '', ratedFlow: '', ratedHead: '', ratedKW: '', ratedRPM: '', ratedEff: '', vfdFitted: 'No' },
  measured: { hz: '', inletP: '', outletP: '', measFlow: '', measKW: '', current: '', remarks: '' },
  notes: '',
  photos: { nameplate: null }
});

export default function PumpSection({ pumps, onChange, allPhotos }) {
  const [sel, setSel] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');
  const [gallery, setGallery] = useState(false);

  const pp = pumps[sel];
  if (!pp) return null;

  const uNp = useCallback(k => v => onChange(pumps.map((p, i) => i === sel ? { ...p, nameplate: { ...p.nameplate, [k]: v } } : p)), [pumps, sel]);
  const uMd = useCallback(k => v => onChange(pumps.map((p, i) => i === sel ? { ...p, measured: { ...p.measured, [k]: v } } : p)), [pumps, sel]);
  const uD  = useCallback(k => v => onChange(pumps.map((p, i) => i === sel ? { ...p, [k]: v } : p)), [pumps, sel]);
  const setPhoto = id => onChange(pumps.map((p, i) => i === sel ? { ...p, photos: { nameplate: id } } : p));

  const runOCR = async () => {
    const photo = allPhotos.find(p => p.id === pp.photos.nameplate);
    if (!photo) return;
    setOcrLoading(true); setOcrMsg('');
    try {
      const result = await extractPumpNameplate(photo.dataUrl, msg => setOcrMsg(msg));
      const populated = Object.entries(result).filter(([, v]) => v !== null && v !== '');
      if (!populated.length) { setOcrMsg('No values found.'); return; }
      const np = { ...pp.nameplate };
      populated.forEach(([k, v]) => { if (k in np) np[k] = String(v); });
      onChange(pumps.map((p, i) => i === sel ? { ...p, nameplate: np } : p));
      setOcrMsg(`${populated.length} field${populated.length > 1 ? 's' : ''} populated — verify.`);
    } catch (e) { setOcrMsg(`⚠️ ${e.message}`); }
    finally { setOcrLoading(false); }
  };

  const c = pumpCalcs(pp);
  const np = pp.nameplate, m = pp.measured;
  const hasVFD = np.vfdFitted === 'Yes';

  return (
    <div>
      <EquipBar items={pumps} sel={sel} setSel={setSel}
        onAdd={() => onChange([...pumps, newPump(pumps.length)])}
        onRemove={i => onChange(pumps.filter((_, idx) => idx !== i))} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
        <Inp label="Equipment Tag" value={pp.tag} onChange={uD('tag')} placeholder="PP-1" />
        <Sel label="Service" value={pp.service} onChange={uD('service')} options={[
          { v: 'CHWP', l: 'CHW Primary' }, { v: 'CHWSP', l: 'CHW Secondary' },
          { v: 'CWP', l: 'Condenser Water' }, { v: 'HWP', l: 'Hot Water' }, { v: 'Other', l: 'Other' }
        ]} />
      </div>

      {/* Photo */}
      <Card>
        <SecH t="Photo" />
        {ocrMsg && <div style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-lt)', padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>{ocrMsg}</div>}
        <PhotoSlot photoId={pp.photos.nameplate} allPhotos={allPhotos} label="Nameplate"
          onAssign={() => setGallery(true)} onRemove={() => setPhoto(null)}
          onOCR={runOCR} ocrLoading={ocrLoading} />
        {!pp.photos.nameplate && <Btn variant="ghost" full small onClick={() => setGallery(true)}>📷 Assign from gallery</Btn>}
      </Card>

      {/* Nameplate */}
      <Card>
        <SecH t="Nameplate / OEM Data" />
        <Inp label="Make & Model" value={np.makeModel} onChange={uNp('makeModel')} />
        <Grid2>
          <Inp label="Rated Flow" value={np.ratedFlow} onChange={uNp('ratedFlow')} unit="m³/hr" type="number" />
          <Inp label="Rated Head" value={np.ratedHead} onChange={uNp('ratedHead')} unit="m WC" type="number" />
          <Inp label="Rated Power" value={np.ratedKW} onChange={uNp('ratedKW')} unit="kW" type="number" />
          <Inp label="Rated Speed" value={np.ratedRPM} onChange={uNp('ratedRPM')} unit="RPM" type="number" />
          <Inp label="Rated Efficiency" value={np.ratedEff} onChange={uNp('ratedEff')} unit="%" type="number" />
          <Sel label="VFD Fitted?" value={np.vfdFitted} onChange={uNp('vfdFitted')} options={[
            { v: 'Yes', l: 'Yes — VFD' }, { v: 'No', l: 'No — Fixed speed' }
          ]} />
        </Grid2>
      </Card>

      {/* Measured */}
      <Card>
        <SecH t="Field Measured Data" />
        {hasVFD && <Inp label="VFD Operating Frequency" value={m.hz} onChange={uMd('hz')} unit="Hz" type="number"
          note="50 Hz = 100% speed. Speed Ratio = Hz ÷ 50" />}
        <SecH t="Pressure" />
        <Grid2>
          <Inp label="Inlet Pressure" value={m.inletP} onChange={uMd('inletP')} unit="bar g" type="number" />
          <Inp label="Outlet Pressure" value={m.outletP} onChange={uMd('outletP')} unit="bar g" type="number" />
        </Grid2>
        <Inp label="Measured Flow" value={m.measFlow} onChange={uMd('measFlow')} unit="m³/hr" type="number" note="From energy meter, ultrasonic flow meter, or BTU meter" />
        <Grid2>
          <Inp label="Measured Power" value={m.measKW} onChange={uMd('measKW')} unit="kW" type="number" />
          <Inp label="Motor Current" value={m.current} onChange={uMd('current')} unit="A" type="number" />
        </Grid2>
        <Inp label="Remarks" value={m.remarks} onChange={uMd('remarks')} placeholder="Noise, vibration, bearing condition…" />
      </Card>

      {/* Calculated */}
      <Card style={{ background: 'var(--bg)' }}>
        <SecH t="Calculated Performance" />
        {hasVFD && c.speedRatio !== null && (
          <>
            <CRow label="Speed Ratio (N/N₀)" value={fmt(c.speedRatio, 3)} />
            <CRow label="Affinity — Predicted Flow" value={fmt(c.predFlow, 1)} unit="m³/hr" />
            <CRow label="Affinity — Predicted Head" value={fmt(c.predHead, 1)} unit="m WC" />
            <CRow label="Affinity — Predicted Power" value={fmt(c.predPower, 1)} unit="kW" />
          </>
        )}
        <CRow label="Differential Head (measured)" value={fmt(c.diffHead, 1)} unit="m WC" />
        {hasVFD && c.flowDev !== null && <CRow label="Flow vs Affinity Prediction" value={fmt(c.flowDev * 100, 1)} unit="%" status={Math.abs(c.flowDev) < 0.15 ? 'good' : 'warn'} />}
        {hasVFD && c.headDev !== null && <CRow label="Head vs Affinity Prediction" value={fmt(c.headDev * 100, 1)} unit="%" status={Math.abs(c.headDev) < 0.15 ? 'good' : 'warn'} />}
        {hasVFD && c.powerDev !== null && <CRow label="Power vs Affinity Prediction" value={fmt(c.powerDev * 100, 1)} unit="%" status={c.vfdStatus === 'good' ? 'good' : c.vfdStatus === 'warn' ? 'warn' : 'bad'} />}
        <CRow label="Hydraulic Efficiency" value={c.hydEff !== null ? fmt(c.hydEff * 100, 1) : '—'} unit="%"
          status={c.hydEff !== null ? (c.hydEff > 0.65 ? 'good' : c.hydEff > 0.50 ? 'warn' : 'bad') : null} />
        {c.vfdStatus && (
          <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, textAlign: 'center', fontWeight: 600, fontSize: 13,
            background: c.vfdStatus === 'good' ? 'var(--green-lt)' : c.vfdStatus === 'warn' ? 'var(--amber-lt)' : 'var(--red-lt)',
            color: c.vfdStatus === 'good' ? 'var(--green-dk)' : c.vfdStatus === 'warn' ? 'var(--amber-dk)' : 'var(--red-dk)',
          }}>
            {c.vfdStatus === 'good' ? '✅ VFD affinity law compliant' : c.vfdStatus === 'bad' ? '❌ Over-consuming — check system resistance' : '⚠️ Under-consuming — check setpoint'}
          </div>
        )}
      </Card>

      <Notes value={pp.notes} onChange={uD('notes')} placeholder="Bearing condition, seal leaks, noise, general observations…" />
      {gallery && <GalleryPicker photos={allPhotos} onSelect={p => { setPhoto(p.id); setGallery(false); }} onClose={() => setGallery(false)} />}
    </div>
  );
}
