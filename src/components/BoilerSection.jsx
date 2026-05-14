import { useState, useCallback } from 'react';
import { Card, SecH, Inp, Sel, Notes, CRow, Grid2, EquipBar, PhotoSlot, GalleryPicker, RunningToggle, Btn } from './ui.jsx';
import { n, fmt, boilerCalcs } from '../utils/calculations.js';
import { generateId } from '../utils/storage.js';

export const newBoiler = (i = 0) => ({
  id: generateId(), tag: `BLR-${i + 1}`,
  nameplate: { makeModel: '', ratedCap: '', ratedPressure: '', ratedEff: '', fuelType: 'Natural Gas' },
  measured: { running: 'Y', steamPressure: '', steamFlow: '', feedWaterTemp: '', steamTemp: '', flueGasTemp: '', ambientTemp: '', o2: '', co2: '', co: '', fuelFlow: '', fuelUnit: 'Nm³/hr', condensateReturn: '', steamTrapSurvey: 'Not done', remarks: '' },
  notes: '',
  photos: { nameplate: null }
});

export default function BoilerSection({ boilers, onChange, allPhotos }) {
  const [sel, setSel] = useState(0);
  const [gallery, setGallery] = useState(false);

  const bl = boilers[sel];
  if (!bl) return null;

  const uNp = useCallback(k => v => onChange(boilers.map((b, i) => i === sel ? { ...b, nameplate: { ...b.nameplate, [k]: v } } : b)), [boilers, sel]);
  const uMd = useCallback(k => v => onChange(boilers.map((b, i) => i === sel ? { ...b, measured: { ...b.measured, [k]: v } } : b)), [boilers, sel]);
  const uD  = useCallback(k => v => onChange(boilers.map((b, i) => i === sel ? { ...b, [k]: v } : b)), [boilers, sel]);
  const setPhoto = id => onChange(boilers.map((b, i) => i === sel ? { ...b, photos: { nameplate: id } } : b));

  const c = boilerCalcs(bl);
  const np = bl.nameplate, m = bl.measured;

  const st = c.status;
  const statusStyle = {
    background: st === 'good' ? 'var(--green-lt)' : st === 'warn' ? 'var(--amber-lt)' : 'var(--red-lt)',
    color: st === 'good' ? 'var(--green-dk)' : st === 'warn' ? 'var(--amber-dk)' : 'var(--red-dk)',
  };

  return (
    <div>
      <EquipBar items={boilers} sel={sel} setSel={setSel}
        onAdd={() => onChange([...boilers, newBoiler(boilers.length)])}
        onRemove={i => onChange(boilers.filter((_, idx) => idx !== i))} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
        <Inp label="Equipment Tag" value={bl.tag} onChange={uD('tag')} placeholder="BLR-1" />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Status</div>
          <RunningToggle value={m.running} onChange={uMd('running')} />
        </div>
      </div>

      <Card>
        <SecH t="Photo" />
        <PhotoSlot photoId={bl.photos.nameplate} allPhotos={allPhotos} label="Nameplate"
          onAssign={() => setGallery(true)} onRemove={() => setPhoto(null)} />
        {!bl.photos.nameplate && <Btn variant="ghost" full small onClick={() => setGallery(true)}>📷 Assign from gallery</Btn>}
      </Card>

      {/* Nameplate */}
      <Card>
        <SecH t="Nameplate / Design Data" />
        <Inp label="Make & Model" value={np.makeModel} onChange={uNp('makeModel')} />
        <Grid2>
          <Inp label="Rated Capacity" value={np.ratedCap} onChange={uNp('ratedCap')} unit="TPH / kW" note="TPH for steam, kW for hot water" />
          <Inp label="Rated Pressure" value={np.ratedPressure} onChange={uNp('ratedPressure')} unit="bar g" type="number" />
          <Inp label="Rated Efficiency" value={np.ratedEff} onChange={uNp('ratedEff')} unit="%" type="number" />
          <Sel label="Fuel Type" value={np.fuelType} onChange={uNp('fuelType')} options={[
            { v: 'Natural Gas', l: 'Natural Gas' }, { v: 'LPG', l: 'LPG' },
            { v: 'Fuel Oil HSD', l: 'Fuel Oil (HSD)' }, { v: 'Fuel Oil FO', l: 'Fuel Oil (FO)' },
            { v: 'Coal', l: 'Coal' }, { v: 'Biomass', l: 'Biomass' }, { v: 'Other', l: 'Other' }
          ]} />
        </Grid2>
      </Card>

      {/* Measured — Steam */}
      <Card>
        <SecH t="Steam Operating Data" />
        <Grid2>
          <Inp label="Steam Pressure (measured)" value={m.steamPressure} onChange={uMd('steamPressure')} unit="bar g" type="number" />
          <Inp label="Steam Flow Rate" value={m.steamFlow} onChange={uMd('steamFlow')} unit="TPH" type="number" />
          <Inp label="Feed Water Temperature" value={m.feedWaterTemp} onChange={uMd('feedWaterTemp')} unit="°C" type="number" />
          <Inp label="Steam Temperature" value={m.steamTemp} onChange={uMd('steamTemp')} unit="°C" type="number" />
        </Grid2>
        {c.pctLoad !== null && (
          <div style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>% Loading</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
              {fmt(c.pctLoad * 100, 1)}%
            </div>
          </div>
        )}
      </Card>

      {/* Measured — Flue gas */}
      <Card>
        <SecH t="Flue Gas Analysis" />
        <Grid2>
          <Inp label="Flue Gas Temperature" value={m.flueGasTemp} onChange={uMd('flueGasTemp')} unit="°C" type="number" />
          <Inp label="Ambient Air Temperature" value={m.ambientTemp} onChange={uMd('ambientTemp')} unit="°C" type="number" />
          <Inp label="O₂ in Flue Gas" value={m.o2} onChange={uMd('o2')} unit="%" type="number"
            note="Target 2–4% for gas, 3–5% for oil" />
          <Inp label="CO₂ in Flue Gas" value={m.co2} onChange={uMd('co2')} unit="%" type="number" />
          <Inp label="CO in Flue Gas" value={m.co} onChange={uMd('co')} unit="ppm" type="number"
            note="⚠️ Alarm > 100 ppm — incomplete combustion" />
        </Grid2>
      </Card>

      {/* Measured — Fuel & steam traps */}
      <Card>
        <SecH t="Fuel Consumption & Steam System" />
        <Grid2>
          <Inp label="Fuel Flow" value={m.fuelFlow} onChange={uMd('fuelFlow')} type="number" />
          <Sel label="Fuel Unit" value={m.fuelUnit} onChange={uMd('fuelUnit')} options={[
            { v: 'Nm³/hr', l: 'Nm³/hr (gas)' }, { v: 'kg/hr', l: 'kg/hr (oil/LPG)' }, { v: 'TPH', l: 'TPH (coal)' }
          ]} />
          <Inp label="Condensate Return %" value={m.condensateReturn} onChange={uMd('condensateReturn')} unit="%" type="number"
            note="Target >70%. Low return = water/energy waste" />
          <Sel label="Steam Trap Survey" value={m.steamTrapSurvey} onChange={uMd('steamTrapSurvey')} options={[
            { v: 'Not done', l: 'Not done' }, { v: 'Done — all OK', l: 'Done — all OK' },
            { v: 'Done — some failed', l: 'Done — failures found' }, { v: 'Due', l: 'Due for survey' }
          ]} />
        </Grid2>
        <Inp label="Remarks" value={m.remarks} onChange={uMd('remarks')} placeholder="Flame condition, scale, insulation gaps, condensate return issues…" />
      </Card>

      {/* Calculated */}
      <Card style={{ background: 'var(--bg)' }}>
        <SecH t="Calculated Performance" />
        {c.excessFlue !== null && <CRow label="Excess Flue Gas Temperature" value={fmt(c.excessFlue, 0)} unit="°C"
          status={c.excessFlue < 150 ? 'good' : c.excessFlue < 250 ? 'warn' : 'bad'} />}
        <CRow label="Combustion Efficiency" value={c.combEff !== null ? fmt(c.combEff * 100, 1) : '—'} unit="%"
          status={c.status} />
        <CRow label="Stack Loss" value={c.stackLoss !== null ? fmt(c.stackLoss * 100, 1) : '—'} unit="%"
          status={c.status ? (c.status === 'good' ? 'good' : c.status === 'warn' ? 'warn' : 'bad') : null} />
        {n(m.co) > 100 && (
          <CRow label="⚠️ CO ALERT" value={`${m.co} ppm — investigate immediately`} status="bad" />
        )}
        {c.status && (
          <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, textAlign: 'center', fontWeight: 600, fontSize: 13, ...statusStyle }}>
            {c.status === 'good' ? '✅ Good combustion efficiency (>88%)' : c.status === 'warn' ? '⚠️ Tune burner — efficiency 82–88%' : '❌ Poor combustion — service required (<82%)'}
          </div>
        )}
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--blue-lt)', borderRadius: 6, fontSize: 11, color: 'var(--blue)' }}>
          Formula: Comb. Eff = 1 − 0.0068 × O₂% ÷ (21 − CO₂%) [Siegert formula variant]
        </div>
      </Card>

      <Notes value={bl.notes} onChange={uD('notes')} placeholder="Flame condition, insulation, scale, general observations…" />
      {gallery && <GalleryPicker photos={allPhotos} onSelect={p => { setPhoto(p.id); setGallery(false); }} onClose={() => setGallery(false)} />}
    </div>
  );
}
