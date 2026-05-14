import { useState, useCallback } from 'react';
import { Card, SecH, Inp, Sel, Notes, CRow, Grid2, EquipBar, PhotoSlot, GalleryPicker, Btn } from './ui.jsx';
import { n, fmt, towerCalcs } from '../utils/calculations.js';
import { extractTowerNameplate } from '../utils/ocr.js';
import { generateId } from '../utils/storage.js';

export const newTower = (i = 0) => ({
  id: generateId(), tag: `CT-${i + 1}`,
  nameplate: { makeModel: '', capTR: '', fanKW: '', vfdFitted: 'No' },
  measured: { fanHz: '', cwEntering: '', cwLeaving: '', cwFlow: '', wbt: '', fanCurrent: '', measFanKW: '', driftVisible: 'No', fillCondition: 'Good', tds: '', remarks: '' },
  notes: '',
  photos: { nameplate: null }
});

export default function TowerSection({ towers, onChange, allPhotos }) {
  const [sel, setSel] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');
  const [gallery, setGallery] = useState(false);

  const ct = towers[sel];
  if (!ct) return null;

  const uNp = useCallback(k => v => onChange(towers.map((t, i) => i === sel ? { ...t, nameplate: { ...t.nameplate, [k]: v } } : t)), [towers, sel]);
  const uMd = useCallback(k => v => onChange(towers.map((t, i) => i === sel ? { ...t, measured: { ...t.measured, [k]: v } } : t)), [towers, sel]);
  const uD  = useCallback(k => v => onChange(towers.map((t, i) => i === sel ? { ...t, [k]: v } : t)), [towers, sel]);
  const setPhoto = id => onChange(towers.map((t, i) => i === sel ? { ...t, photos: { nameplate: id } } : t));

  const runOCR = async () => {
    const photo = allPhotos.find(p => p.id === ct.photos.nameplate);
    if (!photo) return;
    setOcrLoading(true); setOcrMsg('');
    try {
      const result = await extractTowerNameplate(photo.dataUrl, msg => setOcrMsg(msg));
      const populated = Object.entries(result).filter(([, v]) => v !== null && v !== '');
      if (!populated.length) { setOcrMsg('No values found.'); return; }
      const np = { ...ct.nameplate };
      populated.forEach(([k, v]) => { if (k in np) np[k] = String(v); });
      onChange(towers.map((t, i) => i === sel ? { ...t, nameplate: np } : t));
      setOcrMsg(`${populated.length} field${populated.length > 1 ? 's' : ''} populated — verify.`);
    } catch (e) { setOcrMsg(`⚠️ ${e.message}`); }
    finally { setOcrLoading(false); }
  };

  const c = towerCalcs(ct);
  const np = ct.nameplate, m = ct.measured;
  const hasVFD = np.vfdFitted === 'Yes';

  const apStatus = c.approach !== null
    ? c.approach < 2.0 ? 'good' : c.approach < 5.0 ? 'warn' : 'bad'
    : null;

  const effStatus = c.effectiveness !== null
    ? c.effectiveness > 0.70 ? 'good' : c.effectiveness > 0.60 ? 'warn' : 'bad'
    : null;

  return (
    <div>
      <EquipBar items={towers} sel={sel} setSel={setSel}
        onAdd={() => onChange([...towers, newTower(towers.length)])}
        onRemove={i => onChange(towers.filter((_, idx) => idx !== i))} />

      <Inp label="Equipment Tag" value={ct.tag} onChange={uD('tag')} placeholder="CT-1" />

      <Card>
        <SecH t="Photo" />
        {ocrMsg && <div style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-lt)', padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>{ocrMsg}</div>}
        <PhotoSlot photoId={ct.photos.nameplate} allPhotos={allPhotos} label="Nameplate / Tower"
          onAssign={() => setGallery(true)} onRemove={() => setPhoto(null)}
          onOCR={runOCR} ocrLoading={ocrLoading} />
        {!ct.photos.nameplate && <Btn variant="ghost" full small onClick={() => setGallery(true)}>📷 Assign from gallery</Btn>}
      </Card>

      {/* Nameplate */}
      <Card>
        <SecH t="Nameplate / OEM Data" />
        <Inp label="Make & Model" value={np.makeModel} onChange={uNp('makeModel')} />
        <Grid2>
          <Inp label="Rated Capacity" value={np.capTR} onChange={uNp('capTR')} unit="TR" type="number" />
          <Inp label="Fan Motor Rated Power" value={np.fanKW} onChange={uNp('fanKW')} unit="kW" type="number" />
          <Sel label="Fan VFD Fitted?" value={np.vfdFitted} onChange={uNp('vfdFitted')} options={[
            { v: 'Yes', l: 'Yes — VFD' }, { v: 'No', l: 'No — Fixed speed' }
          ]} />
        </Grid2>
      </Card>

      {/* Measured */}
      <Card>
        <SecH t="Field Measured Data" />
        {hasVFD && <Inp label="Fan VFD Frequency" value={m.fanHz} onChange={uMd('fanHz')} unit="Hz" type="number" />}
        <SecH t="Water Temperatures (°C)" />
        <Grid2>
          <Inp label="CW Entering (hot, from chiller)" value={m.cwEntering} onChange={uMd('cwEntering')} unit="°C" type="number" />
          <Inp label="CW Leaving (cold, to chiller)" value={m.cwLeaving} onChange={uMd('cwLeaving')} unit="°C" type="number" />
          <Inp label="CW Flow Rate" value={m.cwFlow} onChange={uMd('cwFlow')} unit="m³/hr" type="number" />
          <Inp label="Wet Bulb Temp (WBT)" value={m.wbt} onChange={uMd('wbt')} unit="°C" type="number"
            note="Measure at tower air inlet — critical for approach calculation" />
        </Grid2>
        <SecH t="Fan" />
        <Grid2>
          <Inp label="Fan Motor Current" value={m.fanCurrent} onChange={uMd('fanCurrent')} unit="A" type="number" />
          <Inp label="Measured Fan Power" value={m.measFanKW} onChange={uMd('measFanKW')} unit="kW" type="number" />
        </Grid2>
        <SecH t="Condition" />
        <Grid2>
          <Sel label="Drift Visible?" value={m.driftVisible} onChange={uMd('driftVisible')} options={[
            { v: 'No', l: 'No drift' }, { v: 'Minor', l: 'Minor drift' }, { v: 'Significant', l: 'Significant drift' }
          ]} />
          <Sel label="Fill Media Condition" value={m.fillCondition} onChange={uMd('fillCondition')} options={[
            { v: 'Good', l: 'Good — clean' }, { v: 'Minor scaling', l: 'Minor scaling' }, { v: 'Significant scaling', l: 'Significant scaling' }, { v: 'Damaged', l: 'Fill damaged/missing' }
          ]} />
        </Grid2>
        <Inp label="Basin TDS" value={m.tds} onChange={uMd('tds')} unit="ppm" type="number" note="Target <1500 ppm" />
        <Inp label="Remarks" value={m.remarks} onChange={uMd('remarks')} placeholder="Basin condition, make-up water, chemical dosing…" />
      </Card>

      {/* Calculated */}
      <Card style={{ background: 'var(--bg)' }}>
        <SecH t="Calculated Performance" />
        {hasVFD && c.fanSpeedRatio !== null && (
          <>
            <CRow label="Fan Speed Ratio" value={fmt(c.fanSpeedRatio, 3)} />
            <CRow label="Affinity — Predicted Fan Power" value={fmt(c.affinityFanPower, 1)} unit="kW" />
            {c.fanStatus && <CRow label="Fan VFD Status"
              value={c.fanStatus === 'good' ? '✅ Within affinity prediction' : c.fanStatus === 'bad' ? '❌ Over-consuming' : '⚠️ Check setpoint'}
              status={c.fanStatus} />}
          </>
        )}
        <CRow label="CW Range (Entering − Leaving)" value={fmt(c.range, 1)} unit="°C"
          status={c.range !== null ? (c.range >= 4 ? 'good' : 'warn') : null} />
        <CRow label="Approach (Leaving − WBT)" value={fmt(c.approach, 1)} unit="°C" status={apStatus}
          note="Target: < 2.5°C. Below 2°C = excellent" />
        <CRow label="Heat Rejection" value={fmt(c.heatRejKW, 0)} unit="kW" />
        <CRow label="Tower Effectiveness" value={c.effectiveness !== null ? fmt(c.effectiveness * 100, 1) : '—'} unit="%" status={effStatus} />
        {apStatus && (
          <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, textAlign: 'center', fontWeight: 600, fontSize: 13,
            background: apStatus === 'good' ? 'var(--green-lt)' : apStatus === 'warn' ? 'var(--amber-lt)' : 'var(--red-lt)',
            color: apStatus === 'good' ? 'var(--green-dk)' : apStatus === 'warn' ? 'var(--amber-dk)' : 'var(--red-dk)',
          }}>
            {apStatus === 'good' ? '✅ Excellent tower performance' : apStatus === 'warn' ? '⚠️ Approach elevated — check fill and spray' : '❌ High approach — major maintenance required'}
          </div>
        )}
      </Card>

      <Notes value={ct.notes} onChange={uD('notes')} placeholder="Basin condition, scale/biofouling, make-up water meter reading, chemical dosing…" />
      {gallery && <GalleryPicker photos={allPhotos} onSelect={p => { setPhoto(p.id); setGallery(false); }} onClose={() => setGallery(false)} />}
    </div>
  );
}
