import { useState, useCallback } from 'react';
import { Card, SecH, Inp, Sel, Notes, CRow, Grid2, EquipBar, PhotoSlot, GalleryPicker, Btn } from './ui.jsx';
import { n, fmt, compCalcs } from '../utils/calculations.js';
import { generateId } from '../utils/storage.js';

export const newCompressor = (i = 0) => ({
  id: generateId(), tag: `AC-COMP-${i + 1}`,
  nameplate: { makeModel: '', ratedCap: '', ratedDischP: '', ratedKW: '', vfdFitted: 'No' },
  measured: { hz: '', inletP: '', dischP: '', measFlow: '', measKW: '', current: '', dischTemp: '', networkDrop: '', dryerRunning: 'Yes', dryerDewpoint: '', autoDrainOK: 'Yes', remarks: '' },
  notes: '',
  photos: { nameplate: null }
});

export default function CompressorSection({ compressors, onChange, allPhotos }) {
  const [sel, setSel] = useState(0);
  const [gallery, setGallery] = useState(false);

  const cp = compressors[sel];
  if (!cp) return null;

  const uNp = useCallback(k => v => onChange(compressors.map((c, i) => i === sel ? { ...c, nameplate: { ...c.nameplate, [k]: v } } : c)), [compressors, sel]);
  const uMd = useCallback(k => v => onChange(compressors.map((c, i) => i === sel ? { ...c, measured: { ...c.measured, [k]: v } } : c)), [compressors, sel]);
  const uD  = useCallback(k => v => onChange(compressors.map((c, i) => i === sel ? { ...c, [k]: v } : c)), [compressors, sel]);
  const setPhoto = id => onChange(compressors.map((c, i) => i === sel ? { ...c, photos: { nameplate: id } } : c));

  const c = compCalcs(cp);
  const np = cp.nameplate, m = cp.measured;
  const hasVFD = np.vfdFitted === 'Yes';

  const statusStyle = s => ({
    background: s === 'good' ? 'var(--green-lt)' : s === 'warn' ? 'var(--amber-lt)' : 'var(--red-lt)',
    color: s === 'good' ? 'var(--green-dk)' : s === 'warn' ? 'var(--amber-dk)' : 'var(--red-dk)',
  });

  return (
    <div>
      <EquipBar items={compressors} sel={sel} setSel={setSel}
        onAdd={() => onChange([...compressors, newCompressor(compressors.length)])}
        onRemove={i => onChange(compressors.filter((_, idx) => idx !== i))} />

      <Inp label="Equipment Tag" value={cp.tag} onChange={uD('tag')} placeholder="COMP-1" />

      <Card>
        <SecH t="Photo" />
        <PhotoSlot photoId={cp.photos.nameplate} allPhotos={allPhotos} label="Nameplate"
          onAssign={() => setGallery(true)} onRemove={() => setPhoto(null)} />
        {!cp.photos.nameplate && <Btn variant="ghost" full small onClick={() => setGallery(true)}>📷 Assign from gallery</Btn>}
      </Card>

      {/* Nameplate */}
      <Card>
        <SecH t="Nameplate / OEM Data" />
        <Inp label="Make & Model" value={np.makeModel} onChange={uNp('makeModel')} />
        <Grid2>
          <Inp label="Rated Capacity (FAD)" value={np.ratedCap} onChange={uNp('ratedCap')} unit="m³/min" type="number" note="Free Air Delivery at rated conditions" />
          <Inp label="Rated Discharge Pressure" value={np.ratedDischP} onChange={uNp('ratedDischP')} unit="bar g" type="number" />
          <Inp label="Rated Motor Power" value={np.ratedKW} onChange={uNp('ratedKW')} unit="kW" type="number" />
          <Sel label="VFD Fitted?" value={np.vfdFitted} onChange={uNp('vfdFitted')} options={[
            { v: 'Yes', l: 'Yes — VFD' }, { v: 'No', l: 'No — Fixed speed' }
          ]} />
        </Grid2>
        {n(np.ratedKW) && n(np.ratedCap) && (
          <div style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Rated Specific Power</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
              {fmt(n(np.ratedKW)/n(np.ratedCap), 2)} <span style={{ fontSize: 11, fontWeight: 400 }}>kW/m³/min</span>
            </div>
          </div>
        )}
      </Card>

      {/* Measured */}
      <Card>
        <SecH t="Field Measured Data" />
        {hasVFD && <Inp label="VFD Operating Frequency" value={m.hz} onChange={uMd('hz')} unit="Hz" type="number" />}
        <Grid2>
          <Inp label="Inlet Pressure" value={m.inletP} onChange={uMd('inletP')} unit="bar g" type="number" />
          <Inp label="Discharge Pressure" value={m.dischP} onChange={uMd('dischP')} unit="bar g" type="number" />
          <Inp label="Measured Flow (FAD)" value={m.measFlow} onChange={uMd('measFlow')} unit="m³/min" type="number" />
          <Inp label="Measured Power" value={m.measKW} onChange={uMd('measKW')} unit="kW" type="number" />
          <Inp label="Motor Current" value={m.current} onChange={uMd('current')} unit="A" type="number" />
          <Inp label="Discharge Temp" value={m.dischTemp} onChange={uMd('dischTemp')} unit="°C" type="number" />
        </Grid2>
        <Inp label="Network Pressure Drop (header to end user)" value={m.networkDrop} onChange={uMd('networkDrop')} unit="bar" type="number" note="Target < 0.5 bar. Higher indicates leaks or undersized pipework." />
        <SecH t="Dryer" />
        <Grid2>
          <Sel label="Dryer Running?" value={m.dryerRunning} onChange={uMd('dryerRunning')} options={[
            { v: 'Yes', l: 'Yes' }, { v: 'No', l: 'No' }, { v: 'N/A', l: 'N/A' }
          ]} />
          <Inp label="Dryer Dewpoint" value={m.dryerDewpoint} onChange={uMd('dryerDewpoint')} unit="°C" type="number" note="Target ≤ +3°C PDP" />
          <Sel label="Auto-drains OK?" value={m.autoDrainOK} onChange={uMd('autoDrainOK')} options={[
            { v: 'Yes', l: 'Yes — working' }, { v: 'No', l: 'No — failed' }, { v: 'Manual', l: 'Manual only' }
          ]} />
        </Grid2>
        <Inp label="Remarks" value={m.remarks} onChange={uMd('remarks')} placeholder="Oil carry-over, noise, leaks, vibration…" />
      </Card>

      {/* Calculated */}
      <Card style={{ background: 'var(--bg)' }}>
        <SecH t="Calculated Performance" />
        {hasVFD && c.speedRatio !== null && (
          <>
            <CRow label="Speed Ratio" value={fmt(c.speedRatio, 3)} />
            <CRow label="Affinity — Predicted Power" value={fmt(c.predPower, 1)} unit="kW" />
            {c.powerDev !== null && <CRow label="Power vs Affinity" value={fmt(c.powerDev * 100, 1)} unit="%" status={Math.abs(c.powerDev) < 0.15 ? 'good' : c.powerDev > 0.15 ? 'bad' : 'warn'} />}
          </>
        )}
        <CRow label="Actual Specific Power" value={fmt(c.actualSpecPwr, 2)} unit="kW/m³/min"
          status={c.specPwrDev !== null ? (c.specPwrDev < 0.1 ? 'good' : c.specPwrDev < 0.2 ? 'warn' : 'bad') : null} />
        <CRow label="Specific Power Deviation" value={c.specPwrDev !== null ? fmt(c.specPwrDev * 100, 1) : '—'} unit="%"
          status={c.specPwrDev !== null ? (c.specPwrDev < 0.1 ? 'good' : c.specPwrDev < 0.2 ? 'warn' : 'bad') : null} />
        {c.status && (
          <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, textAlign: 'center', fontWeight: 600, fontSize: 13, ...statusStyle(c.status) }}>
            {c.status === 'good' ? '✅ Operating within efficiency target' : c.status === 'warn' ? '⚠️ Efficiency marginal — check leaks/pressure' : '❌ Action required — significant waste'}
          </div>
        )}
      </Card>

      <Notes value={cp.notes} onChange={uD('notes')} placeholder="Leak survey findings, oil condition, filter status…" />
      {gallery && <GalleryPicker photos={allPhotos} onSelect={p => { setPhoto(p.id); setGallery(false); }} onClose={() => setGallery(false)} />}
    </div>
  );
}
