import { useState } from 'react';
import { SubTabBar } from './ui.jsx';
import WCChillerSection, { newWCChiller } from './WCChillerSection.jsx';
import ACChillerSection, { newACChiller } from './ACChillerSection.jsx';
import PumpSection, { newPump } from './PumpSection.jsx';
import TowerSection, { newTower } from './TowerSection.jsx';
import CompressorSection, { newCompressor } from './CompressorSection.jsx';
import BoilerSection, { newBoiler } from './BoilerSection.jsx';

const TABS = [
  { v: 'wc',   l: '❄️ WC Chillers' },
  { v: 'ac',   l: '🌡️ AC Chillers' },
  { v: 'pump', l: '💧 Pumps' },
  { v: 'tower',l: '🌬️ Towers' },
  { v: 'comp', l: '🔧 Compressors' },
  { v: 'boiler',l: '🔥 Boilers' },
];

export default function EquipmentTab({ state, onChange, allPhotos }) {
  const [tab, setTab] = useState('wc');
  const { wcChillers, acChillers, pumps, towers, compressors, boilers } = state;

  const upd = key => arr => onChange({ ...state, [key]: arr });

  // Counts for tab badge
  const counts = {
    wc:    wcChillers.length,
    ac:    acChillers.length,
    pump:  pumps.length,
    tower: towers.length,
    comp:  compressors.length,
    boiler: boilers.length,
  };

  const tabsWithCount = TABS.map(t => ({
    ...t,
    l: `${t.l} ${counts[t.v] > 0 ? `(${counts[t.v]})` : ''}`
  }));

  return (
    <div>
      <SubTabBar tabs={tabsWithCount} active={tab} onChange={setTab} />

      {tab === 'wc' && (
        wcChillers.length === 0
          ? <EmptyState label="Water-Cooled Chiller" onAdd={() => { upd('wcChillers')([newWCChiller(0)]); }} />
          : <WCChillerSection chillers={wcChillers} onChange={upd('wcChillers')} allPhotos={allPhotos} />
      )}

      {tab === 'ac' && (
        acChillers.length === 0
          ? <EmptyState label="Air-Cooled Chiller" onAdd={() => { upd('acChillers')([newACChiller(0)]); }} />
          : <ACChillerSection chillers={acChillers} onChange={upd('acChillers')} allPhotos={allPhotos} />
      )}

      {tab === 'pump' && (
        pumps.length === 0
          ? <EmptyState label="Pump" onAdd={() => { upd('pumps')([newPump(0)]); }} />
          : <PumpSection pumps={pumps} onChange={upd('pumps')} allPhotos={allPhotos} />
      )}

      {tab === 'tower' && (
        towers.length === 0
          ? <EmptyState label="Cooling Tower" onAdd={() => { upd('towers')([newTower(0)]); }} />
          : <TowerSection towers={towers} onChange={upd('towers')} allPhotos={allPhotos} />
      )}

      {tab === 'comp' && (
        compressors.length === 0
          ? <EmptyState label="Air Compressor" onAdd={() => { upd('compressors')([newCompressor(0)]); }} />
          : <CompressorSection compressors={compressors} onChange={upd('compressors')} allPhotos={allPhotos} />
      )}

      {tab === 'boiler' && (
        boilers.length === 0
          ? <EmptyState label="Boiler" onAdd={() => { upd('boilers')([newBoiler(0)]); }} />
          : <BoilerSection boilers={boilers} onChange={upd('boilers')} allPhotos={allPhotos} />
      )}
    </div>
  );
}

function EmptyState({ label, onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>➕</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No {label} yet</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Add equipment to start capturing data</div>
      <button onClick={onAdd} style={{
        padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none',
        borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}>+ Add {label}</button>
    </div>
  );
}
