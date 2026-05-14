import { useState, useEffect, useCallback, useRef } from 'react';
import { hasPin, isSessionActive, endSession } from './utils/crypto.js';
import { saveAudit, loadAudit, clearAudit, getLastSavedAt, getAllPhotos, getApiKey, setApiKey, generateId } from './utils/storage.js';
import { SetupScreen, LoginScreen } from './components/Auth.jsx';
import SiteTab from './components/SiteTab.jsx';
import EquipmentTab from './components/EquipmentTab.jsx';
import PhotosTab from './components/PhotosTab.jsx';
import SummaryTab from './components/SummaryTab.jsx';
import { Btn, Card } from './components/ui.jsx';

// ── Default state ─────────────────────────────────────────────────────────────

const newAmbientRow = () => ({ id: generateId(), time: '', dbt: '', wbt: '', rh: '', baro: '', wind: 'Calm', sky: 'Clear', initials: '' });

const DEFAULT_SITE = { refNo: '', plant: '', location: '', client: '', auditor: '', team: '', contact: '', date: new Date().toISOString().slice(0, 10), time: '', dbt: '', wbt: '', rh: '', baro: '', ambientLog: [newAmbientRow()] };

const DEFAULT_STATE = { site: DEFAULT_SITE, wcChillers: [], acChillers: [], pumps: [], towers: [], compressors: [], boilers: [] };

// ── Navigation tabs ───────────────────────────────────────────────────────────

const TABS = [
  { v: 'site',   l: 'Site',    icon: '🏭' },
  { v: 'equip',  l: 'Equipment', icon: '❄️' },
  { v: 'photos', l: 'Photos',  icon: '📷' },
  { v: 'summary',l: 'Summary', icon: '📊' },
];

// ── Auth gate ─────────────────────────────────────────────────────────────────

function AuthGate({ children }) {
  const [authState, setAuthState] = useState(() => {
    if (!hasPin()) return 'setup';
    if (isSessionActive()) return 'ok';
    return 'login';
  });

  if (authState === 'setup') return <SetupScreen onDone={() => setAuthState('ok')} />;
  if (authState === 'login') return <LoginScreen onSuccess={() => setAuthState('ok')} />;
  return children;
}

// ── Settings modal ────────────────────────────────────────────────────────────

function SettingsModal({ onClose }) {
  const [apiKey, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const save = () => { setApiKey(apiKey); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const lockApp = () => { endSession(); window.location.reload(); };
  const resetData = () => {
    clearAudit(); window.location.reload();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: 'var(--card)', width: '100%', borderRadius: '16px 16px 0 0', padding: '20px', paddingBottom: 'calc(20px + var(--safe-b))', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>⚙️ Settings</span>
          <button onClick={onClose} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: 'var(--text2)' }}>✕</button>
        </div>

        {/* API key */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Anthropic API Key (for photo OCR)</div>
          <input type="password" value={apiKey} onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-…" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--mono)', outline: 'none' }}
          />
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Required for 🔍 Extract buttons. Stored locally — never transmitted except to Anthropic API.</div>
          <Btn onClick={save} style={{ marginTop: 8, width: '100%' }}>{saved ? '✅ Saved' : 'Save API Key'}</Btn>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

        {/* App actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="ghost" full onClick={lockApp}>🔒 Lock app (back to PIN)</Btn>
          {confirmReset
            ? <div style={{ background: 'var(--red-lt)', padding: 12, borderRadius: 10, border: '1px solid var(--red-bd)' }}>
                <div style={{ fontSize: 13, color: 'var(--red-dk)', marginBottom: 10, fontWeight: 500 }}>⚠️ This deletes all audit data permanently.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="danger" full onClick={resetData}>Yes, delete all data</Btn>
                  <Btn variant="ghost" full onClick={() => setConfirmReset(false)}>Cancel</Btn>
                </div>
              </div>
            : <Btn variant="danger" full onClick={() => setConfirmReset(true)}>🗑️ Clear all audit data</Btn>
          }
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.7 }}>
          Enspar Chiller Plant Audit Tool v1.0<br />
          Built by Enspar Sustainability Pvt. Ltd.<br />
          Data stored locally on this device.
        </div>
      </div>
    </div>
  );
}

// ── Restore prompt ────────────────────────────────────────────────────────────

function RestorePrompt({ savedAt, onRestore, onNew }) {
  const date = new Date(savedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Card style={{ maxWidth: 380, width: '100%' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>📂</div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Resume previous audit?</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Saved audit found from {date}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn full onClick={onRestore}>Resume audit</Btn>
          <Btn full variant="secondary" onClick={onNew}>Start fresh (discard saved)</Btn>
        </div>
      </Card>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────

function MainApp() {
  const [state, setState] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tab, setTab] = useState('site');
  const [settings, setSettings] = useState(false);
  const [restorePrompt, setRestorePrompt] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);

  // Load photos from IndexedDB
  useEffect(() => {
    getAllPhotos().then(setPhotos).catch(console.error);
  }, []);

  // Check for saved audit
  useEffect(() => {
    const last = getLastSavedAt();
    if (last) {
      setRestorePrompt(last);
    } else {
      setState(DEFAULT_STATE);
    }
  }, []);

  // Auto-save on state change (debounced 2s)
  useEffect(() => {
    if (!state) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAudit(state);
      setSavedAt(Date.now());
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  const handleRestore = () => {
    const saved = loadAudit();
    setState(saved || DEFAULT_STATE);
    setRestorePrompt(null);
  };

  const handleNew = () => {
    clearAudit();
    setState(DEFAULT_STATE);
    setRestorePrompt(null);
  };

  if (!state && !restorePrompt) return null;

  const lastSavedStr = savedAt ? new Date(savedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'var(--primary)',
        paddingTop: 'calc(10px + var(--safe-t))', paddingBottom: 10, paddingLeft: 16, paddingRight: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.18)',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            ❄️ Chiller Audit
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            {state?.site?.plant || 'No site set'}{lastSavedStr ? ` · saved ${lastSavedStr}` : ''}
          </div>
        </div>
        <button onClick={() => setSettings(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0', paddingBottom: 'calc(var(--nav-h) + var(--safe-b) + 14px)', WebkitOverflowScrolling: 'touch' }}>
        {state && tab === 'site'   && <SiteTab site={state.site} onChange={s => setState(st => ({ ...st, site: s }))} />}
        {state && tab === 'equip'  && <EquipmentTab state={state} onChange={setState} allPhotos={photos} />}
        {state && tab === 'photos' && <PhotosTab photos={photos} setPhotos={setPhotos} />}
        {state && tab === 'summary'&& <SummaryTab state={state} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 640, background: 'var(--card)',
        borderTop: '1px solid var(--border)', display: 'flex',
        paddingBottom: 'var(--safe-b)', zIndex: 100, boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
      }}>
        {TABS.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 'var(--nav-h)', border: 'none', background: 'none', cursor: 'pointer',
            gap: 2, padding: '8px 4px',
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.v ? 700 : 400, color: tab === t.v ? 'var(--primary)' : 'var(--text2)', letterSpacing: '0.02em' }}>{t.l}</span>
            {tab === t.v && <span style={{ width: 20, height: 2, background: 'var(--primary)', borderRadius: 2, position: 'absolute', bottom: 'calc(var(--safe-b) + 2px)' }} />}
          </button>
        ))}
      </div>

      {/* Overlays */}
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
      {restorePrompt && <RestorePrompt savedAt={restorePrompt} onRestore={handleRestore} onNew={handleNew} />}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthGate>
      <MainApp />
    </AuthGate>
  );
}
