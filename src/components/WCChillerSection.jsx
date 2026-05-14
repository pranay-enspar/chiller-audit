import { useState, useCallback } from 'react';
import { Card, SecH, Inp, Sel, Notes, CRow, Grid2, Grid3, EquipBar, PhotoSlot, GalleryPicker, RunningToggle, OcrMsg, Btn } from './ui.jsx';
import { n, fmt, wcCalcs } from '../utils/calculations.js';
import { extractChillerNameplate, extractCPMReadings } from '../utils/ocr.js';
import { generateId } from '../utils/storage.js';

export const newWCChiller = (i = 0) => ({
  id: generateId(), tag: `WC-CH${i + 1}`, running: 'Y',
  nameplate: { makeModel: '', capTR: '', ratedKW: '', ratedCOP: '', chwst: '', chwrt: '', chwFlow: '', cwEntering: '', cwLeaving: '', cwFlow: '', refrigerant: '', yearMfg: '', iplvNotes: '' },
  measured: { time: '', chwst: '', chwrt: '', chwFlow: '', cwEntering: '', cwLeaving: '', cwFlow: '', powerKW: '', current: '', vibration: '', faultCodes: '', initials: '', remarks: '' },
  notes: '',
  photos: { nameplate: null, cpm: null }
});

export default function WCChillerSection({ chillers, onChange, allPhotos }) {
  const [sel, setSel] = useState(0);
  const [ocrState, setOcrState] = useState({});
  const [ocrMsg, setOcrMsg] = useState('');
  const [gallery, setGallery] = useState(null);

  const ch = chillers[sel];
  if (!ch) return null;

  const uNp = useCallback(k => v => onChange(chillers.map((c, i) => i === sel ? { ...c, nameplate: { ...c.nameplate, [k]: v } } : c)), [chillers, sel]);
  const uMd = useCallback(k => v => onChange(chillers.map((c, i) => i === sel ? { ...c, measured: { ...c.measured, [k]: v } } : c)), [chillers, sel]);
  const uD  = useCallback(k => v => onChange(chillers.map((c, i) => i === sel ? { ...c, [k]: v } : c)), [chillers, sel]);
  const setPhoto = (slot, id) => onChange(chillers.map((c, i) => i === sel ? { ...c, photos: { ...c.photos, [slot]: id } } : c));

  const runOCR = async (slot, extractor) => {
    const photo = allPhotos.find(p => p.id === ch.photos[slot]);
    if (!photo) return;
    setOcrState(s => ({ ...s, [slot]: true }));
    setOcrMsg('');
    try {
      const result = await extractor(photo.dataUrl, msg => setOcrMsg(msg));
      const populated = Object.entries(result).filter(([, v]) => v !== null && v !== '');
      if (!populated.length) { setOcrMsg('No readable values found — enter manually.'); return; }

      if (slot === 'nameplate') {
        const np = { ...ch.nameplate };
        populated.forEach(([k, v]) => { if (k in np) np[k] = String(v); });
        onChange(chillers.map((c, i) => i === sel ? { ...c, nameplate: np } : c));
      } else if (slot === 'cpm') {
        const m = { ...ch.measured };
        const map = { chwst: 'chwst', chwrt: 'chwrt', chwFlow: 'chwFlow', cwEntering: 'cwEntering', cwLeaving: 'cwLeaving', powerKW: 'powerKW', current: 'current', faultCodes: 'faultCodes' };
        populated.forEach(([k, v]) => { if (map[k]) m[map[k]] = String(v); });
        onChange(chillers.map((c, i) => i === sel ? { ...c, measured: m } : c));
      }
      setOcrMsg(`${populated.length} field${populated.length > 1 ? 's' : ''} populated — verify all values.`);
    } catch (e) {
      setOcrMsg(`⚠️ ${e.message}`);
    } finally {
      setOcrState(s => ({ ...s, [slot]: false }));
    }
  };

  const c = wcCalcs(ch);
  const np = ch.nameplate, m = ch.measured;

  return (
    <div>
      <EquipBar items={chillers} sel={sel} setSel={setSel}
        onAdd={() => onChange([...chillers, newWCChiller(chillers.length)])}
        onRemove={i => onChange(chillers.filter((_, idx) => idx !== i))} />

      {/* Tag & running */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
        <Inp label="Equipment Tag" value={ch.tag} onChange={uD('tag')} placeholder="WC-CH1" />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Status</div>
          <RunningToggle value={ch.running} onChange={uD('running')} />
        </div>
      </div>

      {/* Photos */}
      <Card>
        <SecH t="Photos" />
        <OcrMsg msg={ocrMsg} />
        <Grid2>
          <div>
            <PhotoSlot photoId={ch.photos.nameplate} allPhotos={allPhotos} label="Nameplate"
              onAssign={() => setGallery('nameplate')} onRemove={() => setPhoto('nameplate', null)}
              onOCR={p => runOCR('nameplate', extractChillerNameplate)} ocrLoading={ocrState.nameplate} />
            {!ch.photos.nameplate && <Btn variant="ghost" full small onClick={() => setGallery('nameplate')}>📷 Assign from gallery</Btn>}
          </div>
          <div>
            <PhotoSlot photoId={ch.photos.cpm} allPhotos={allPhotos} label="CPM / Panel"
              onAssign={() => setGallery('cpm')} onRemove={() => setPhoto('cpm', null)}
              onOCR={p => runOCR('cpm', extractCPMReadings)} ocrLoading={ocrState.cpm} />
            {!ch.photos.cpm && <Btn variant="ghost" full small onClick={() => setGallery('cpm')}>📷 Assign from gallery</Btn>}
          </div>
        </Grid2>
      </Card>

      {/* Nameplate */}
      <Card>
        <SecH t="Nameplate / OEM Data" />
        <Inp label="Make & Model" value={np.makeModel} onChange={uNp('makeModel')} />
        <Grid2>
          <Inp label="Rated Capacity" value={np.capTR} onChange={uNp('capTR')} unit="TR" type="number" />
          <Inp label="Rated Power" value={np.ratedKW} onChange={uNp('ratedKW')} unit="kW" type="number" />
          <Inp label="Rated COP" value={np.ratedCOP} onChange={uNp('ratedCOP')} type="number" />
          <Inp label="Refrigerant" value={np.refrigerant} onChange={uNp('refrigerant')} placeholder="R-134a" />
          <Inp label="Year Mfg." value={np.yearMfg} onChange={uNp('yearMfg')} placeholder="2018" />
        </Grid2>
        <SecH t="Design Temperatures" />
        <Grid2>
          <Inp label="CHW Supply (design)" value={np.chwst} onChange={uNp('chwst')} unit="°C" type="number" placeholder="7" />
          <Inp label="CHW Return (design)" value={np.chwrt} onChange={uNp('chwrt')} unit="°C" type="number" placeholder="12" />
          <Inp label="CHW Flow (design)" value={np.chwFlow} onChange={uNp('chwFlow')} unit="m³/hr" type="number" />
          <Inp label="CW Entering (design)" value={np.cwEntering} onChange={uNp('cwEntering')} unit="°C" type="number" placeholder="30" />
          <Inp label="CW Leaving (design)" value={np.cwLeaving} onChange={uNp('cwLeaving')} unit="°C" type="number" placeholder="35" />
          <Inp label="CW Flow (design)" value={np.cwFlow} onChange={uNp('cwFlow')} unit="m³/hr" type="number" />
        </Grid2>
        <Inp label="IPLV / Part-load Notes" value={np.iplvNotes} onChange={uNp('iplvNotes')} placeholder="IPLV, NPLV data if available" />
      </Card>

      {/* Measured */}
      <Card>
        <SecH t="Field Measured Data" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Inp label="Time of Reading" value={m.time} onChange={uMd('time')} type="time" />
          <Inp label="Initials" value={m.initials} onChange={uMd('initials')} placeholder="AB" />
        </div>
        <SecH t="CHW Side" />
        <Grid2>
          <Inp label="CHW Supply Temp" value={m.chwst} onChange={uMd('chwst')} unit="°C" type="number" />
          <Inp label="CHW Return Temp" value={m.chwrt} onChange={uMd('chwrt')} unit="°C" type="number" />
          <Inp label="CHW Flow Rate" value={m.chwFlow} onChange={uMd('chwFlow')} unit="m³/hr" type="number" />
        </Grid2>
        <SecH t="CW Side" />
        <Grid2>
          <Inp label="CW Entering (from tower)" value={m.cwEntering} onChange={uMd('cwEntering')} unit="°C" type="number" />
          <Inp label="CW Leaving (to tower)" value={m.cwLeaving} onChange={uMd('cwLeaving')} unit="°C" type="number" />
          <Inp label="CW Flow Rate" value={m.cwFlow} onChange={uMd('cwFlow')} unit="m³/hr" type="number" />
        </Grid2>
        <SecH t="Electrical" />
        <Inp label="Compressor Power Input" value={m.powerKW} onChange={uMd('powerKW')} unit="kW" type="number" />
        <Grid2>
          <Inp label="Motor Current" value={m.current} onChange={uMd('current')} unit="A" type="number" />
          <Inp label="Vibration" value={m.vibration} onChange={uMd('vibration')} unit="mm/s" type="number" />
        </Grid2>
        <Inp label="Fault Codes" value={m.faultCodes} onChange={uMd('faultCodes')} placeholder="e.g. E01, none" />
        <Inp label="Remarks" value={m.remarks} onChange={uMd('remarks')} placeholder="Observations" />
      </Card>

      {/* Calculated */}
      <Card style={{ background: 'var(--bg)' }}>
        <SecH t="Calculated Performance" />
        {n(np.ratedKW) && n(np.capTR) && <CRow label="OEM kW/TR" value={fmt(n(np.ratedKW)/n(np.capTR), 3)} unit="kW/TR" />}
        <CRow label="CHW ΔT" value={fmt(c.chwDt, 1)} unit="°C"
          status={c.chwDt !== null ? (c.chwDt >= 4.5 ? 'good' : c.chwDt >= 3 ? 'warn' : 'bad') : null} />
        <CRow label="Cooling Load" value={fmt(c.coolTR, 1)} unit="TR" />
        <CRow label="Cooling Load" value={fmt(c.coolKW, 0)} unit="kW" />
        <CRow label="% of Rated Capacity" value={c.pctLoad !== null ? fmt(c.pctLoad * 100, 1) : '—'} unit="%"
          status={c.pctLoad !== null ? (c.pctLoad > 0.65 ? 'good' : c.pctLoad > 0.4 ? 'warn' : 'bad') : null} />
        <CRow label="Condenser Water ΔT" value={fmt(c.cwDt, 1)} unit="°C" />
        <CRow label="Actual COP" value={fmt(c.cop, 2)}
          status={c.copRatio !== null ? (c.copRatio > 0.9 ? 'good' : c.copRatio > 0.75 ? 'warn' : 'bad') : null} />
        <CRow label="Actual kW/TR" value={fmt(c.kwtr, 3)} unit="kW/TR"
          status={c.kwtrDev !== null ? (c.kwtrDev < 0.05 ? 'good' : c.kwtrDev < 0.15 ? 'warn' : 'bad') : null} />
        <CRow label="COP vs OEM" value={c.copRatio !== null ? fmt(c.copRatio * 100, 1) : '—'} unit="%"
          status={c.copRatio !== null ? (c.copRatio > 0.9 ? 'good' : c.copRatio > 0.75 ? 'warn' : 'bad') : null} />
        <CRow label="kW/TR Deviation" value={c.kwtrDev !== null ? fmt(c.kwtrDev * 100, 1) : '—'} unit="%"
          status={c.kwtrDev !== null ? (c.kwtrDev < 0.05 ? 'good' : c.kwtrDev < 0.15 ? 'warn' : 'bad') : null} />
        {c.perfStatus && (
          <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, textAlign: 'center', fontWeight: 600, fontSize: 13,
            background: c.perfStatus === 'good' ? 'var(--green-lt)' : c.perfStatus === 'warn' ? 'var(--amber-lt)' : 'var(--red-lt)',
            color: c.perfStatus === 'good' ? 'var(--green-dk)' : c.perfStatus === 'warn' ? 'var(--amber-dk)' : 'var(--red-dk)',
          }}>
            {c.perfStatus === 'good' ? '✅ Good — within specification' : c.perfStatus === 'warn' ? '⚠️ Degraded — check fouling/refrigerant' : '❌ Poor — immediate action required'}
          </div>
        )}
      </Card>

      <Notes value={ch.notes} onChange={uD('notes')} placeholder="General condition, unusual sounds, visual observations…" />

      {gallery && <GalleryPicker photos={allPhotos} onSelect={p => { setPhoto(gallery, p.id); setGallery(null); }} onClose={() => setGallery(null)} />}
    </div>
  );
}
