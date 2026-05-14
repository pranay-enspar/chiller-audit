import { useRef } from 'react';
import { generateId } from '../utils/storage.js';

// ── Colour maps ───────────────────────────────────────────────────────────────

export const STATUS = {
  good: { bg: 'var(--green-lt)',  text: 'var(--green-dk)',  border: 'var(--green-bd)'  },
  warn: { bg: 'var(--amber-lt)', text: 'var(--amber-dk)', border: 'var(--amber-bd)' },
  bad:  { bg: 'var(--red-lt)',   text: 'var(--red-dk)',   border: 'var(--red-bd)'   },
  info: { bg: 'var(--blue-lt)',  text: 'var(--blue)',     border: 'var(--blue-bd)'  },
};

export const SEV_COLOR = {
  HIGH:   STATUS.bad,
  MEDIUM: STATUS.warn,
  LOW:    STATUS.info,
  GOOD:   STATUS.good,
  INFO:   { bg: '#F4F3EF', text: 'var(--text2)', border: 'var(--border)' },
};

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({ children, style, flat }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: flat ? 'none' : '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      boxShadow: flat ? 'none' : 'var(--shadow)',
      marginBottom: 12,
      ...style
    }}>{children}</div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

export function SecH({ t, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t}</div>
      {action}
    </div>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────

export function Inp({ label, value, onChange, unit, type = 'text', placeholder = '', note, wide, aiField }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, letterSpacing: '0.02em' }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '—'}
          style={{
            flex: 1, minWidth: 0, fontSize: 15, fontFamily: type === 'number' ? 'var(--mono)' : 'var(--font)',
            padding: '0 10px', height: 44, borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${aiField ? 'var(--primary-bd)' : 'var(--border)'}`,
            background: aiField ? 'var(--primary-lt)' : 'var(--card)',
            color: 'var(--text)', outline: 'none', WebkitAppearance: 'none', appearance: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-lt)'; }}
          onBlur={e => { e.target.style.borderColor = aiField ? 'var(--primary-bd)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
        {unit && <span style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', minWidth: 30, textAlign: 'right' }}>{unit}</span>}
      </div>
      {note && <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 3 }}>{note}</div>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

export function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>}
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={{
        width: '100%', fontSize: 14, height: 44, borderRadius: 'var(--radius-sm)',
        border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)',
        padding: '0 10px', outline: 'none', fontFamily: 'var(--font)',
      }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────

export function Notes({ value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Field Notes</div>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder || 'Observations…'}
        style={{ width: '100%', fontSize: 14, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', padding: '10px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font)', lineHeight: 1.5, outline: 'none' }}
        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
      />
    </div>
  );
}

// ── Calculated result row ─────────────────────────────────────────────────────

export function CRow({ label, value, unit, status, indent }) {
  const c = status ? STATUS[status] : null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 10px', marginBottom: 4, borderRadius: 6,
      background: c ? c.bg : 'var(--bg)',
      border: `1px solid ${c ? c.border : 'transparent'}`,
      marginLeft: indent ? 12 : 0,
    }}>
      <span style={{ fontSize: 12, color: c ? c.text : 'var(--text2)', fontWeight: 400 }}>{label}</span>
      <span style={{ fontSize: 15, fontFamily: 'var(--mono)', fontWeight: 600, color: c ? c.text : 'var(--text)' }}>
        {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 3, opacity: 0.8 }}>{unit}</span>}
      </span>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({ sev }) {
  const c = SEV_COLOR[sev] || SEV_COLOR.INFO;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 999, background: c.bg, color: c.text, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{sev}</span>
  );
}

// ── Equipment pill selector ───────────────────────────────────────────────────

export function EquipPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', fontSize: 13, borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
      border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
      background: active ? 'var(--primary)' : 'var(--card)',
      color: active ? '#fff' : 'var(--text)', fontWeight: active ? 600 : 400, height: 38,
    }}>{label}</button>
  );
}

// ── Sub-tab bar ───────────────────────────────────────────────────────────────

export function SubTabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 14, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
      {tabs.map(t => (
        <button key={t.v} onClick={() => onChange(t.v)} style={{
          padding: '8px 14px', fontSize: 13, fontWeight: active === t.v ? 600 : 400,
          borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          background: active === t.v ? 'var(--primary-lt)' : 'transparent',
          color: active === t.v ? 'var(--primary)' : 'var(--text2)',
        }}>{t.l}</button>
      ))}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────

export function Btn({ children, onClick, variant = 'primary', small, full, style: extra, disabled }) {
  const v = {
    primary:   { background: 'var(--primary)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--card)', color: 'var(--primary)', border: '1.5px solid var(--primary)' },
    danger:    { background: 'var(--red-lt)', color: 'var(--red-dk)', border: '1.5px solid var(--red-bd)' },
    ghost:     { background: 'transparent', color: 'var(--text2)', border: '1.5px solid var(--border)' },
    success:   { background: 'var(--green-lt)', color: 'var(--green-dk)', border: '1.5px solid var(--green-bd)' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v[variant],
      padding: small ? '5px 12px' : '10px 18px',
      fontSize: small ? 12 : 14, fontWeight: 500,
      borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
      width: full ? '100%' : 'auto', opacity: disabled ? 0.5 : 1,
      fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      ...extra
    }}>{children}</button>
  );
}

// ── Grid helpers ──────────────────────────────────────────────────────────────

export function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>{children}</div>;
}

export function Grid3({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>{children}</div>;
}

// ── Photo slot (gallery-assign) ────────────────────────────────────────────────

export function PhotoSlot({ photoId, allPhotos, onAssign, onRemove, label, onOCR, ocrLoading }) {
  const photo = allPhotos.find(p => p.id === photoId);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>{label}</div>
      {photo ? (
        <div style={{ border: '1.5px solid var(--primary-bd)', borderRadius: 8, overflow: 'hidden' }}>
          <img src={photo.dataUrl} alt="" style={{ width: '100%', maxHeight: 130, objectFit: 'cover', display: 'block' }} />
          <div style={{ display: 'flex', gap: 6, padding: 6, background: 'var(--primary-lt)' }}>
            {onOCR && <Btn small variant="secondary" onClick={() => onOCR(photo.dataUrl)} disabled={ocrLoading} style={{ flex: 1 }}>{ocrLoading ? '⏳ Reading…' : '🔍 Extract'}</Btn>}
            <Btn small variant="ghost" onClick={onRemove}>✕</Btn>
          </div>
        </div>
      ) : (
        <div style={{ height: 60, border: '1.5px dashed var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 12 }}>
          Assign from gallery ↗
        </div>
      )}
    </div>
  );
}

// ── Gallery picker overlay ────────────────────────────────────────────────────

export function GalleryPicker({ photos, onSelect, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--card)', flex: 1, overflowY: 'auto', borderRadius: '16px 16px 0 0', marginTop: 40 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
          <span style={{ fontWeight: 600 }}>Choose from gallery</span>
          <button onClick={onClose} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: '4px 8px' }}>✕</button>
        </div>
        {photos.length === 0
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}><div style={{ fontSize: 36, marginBottom: 8 }}>📷</div><div>No photos yet — go to the Photos tab to upload.</div></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
              {photos.map(p => (
                <button key={p.id} onClick={() => onSelect(p)} style={{ border: 'none', padding: 0, cursor: 'pointer', background: 'none', aspectRatio: '1', overflow: 'hidden' }}>
                  <img src={p.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ── Running toggle ────────────────────────────────────────────────────────────

export function RunningToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {['Y', 'N'].map(v => (
        <button key={v} onClick={() => onChange(v)} style={{
          flex: 1, height: 38, borderRadius: 8, border: '1.5px solid',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          borderColor: value === v ? (v === 'Y' ? 'var(--green-bd)' : 'var(--red-bd)') : 'var(--border)',
          background: value === v ? (v === 'Y' ? 'var(--green-lt)' : 'var(--red-lt)') : 'var(--card)',
          color: value === v ? (v === 'Y' ? 'var(--green-dk)' : 'var(--red-dk)') : 'var(--text2)',
        }}>{v === 'Y' ? '✅ Running' : '⛔ Stopped'}</button>
      ))}
    </div>
  );
}

// ── KPI tile ──────────────────────────────────────────────────────────────────

export function KpiTile({ label, value, unit, status, wide }) {
  const c = status ? STATUS[status] : null;
  return (
    <div style={{
      padding: '12px 10px',
      background: c ? c.bg : 'var(--card)',
      borderRadius: 'var(--radius)',
      border: `1px solid ${c ? c.border : 'var(--border)'}`,
      boxShadow: 'var(--shadow)',
      gridColumn: wide ? 'span 2' : undefined,
    }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: c ? c.text : 'var(--text2)', lineHeight: 1.2, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontFamily: 'var(--mono)', fontWeight: 700, color: c ? c.text : 'var(--text)', lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ fontSize: 10, color: c ? c.text : 'var(--text2)', marginTop: 2, opacity: 0.8 }}>{unit}</div>}
    </div>
  );
}

// ── Add / Remove equipment bar ────────────────────────────────────────────────

export function EquipBar({ items, sel, setSel, onAdd, onRemove, newItem }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 2, alignItems: 'center', WebkitOverflowScrolling: 'touch' }}>
      {items.map((item, i) => (
        <EquipPill key={item.id} label={item.tag || `#${i+1}`} active={i === sel} onClick={() => setSel(i)} />
      ))}
      <button onClick={() => { onAdd(); setSel(items.length); }} style={{ padding: '7px 12px', fontSize: 12, borderRadius: 999, border: '1.5px dashed var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0, height: 38 }}>+ Add</button>
      {items.length > 1 && (
        <button onClick={() => { onRemove(sel); setSel(Math.max(0, sel - 1)); }} style={{ padding: '7px 12px', fontSize: 12, borderRadius: 999, border: '1.5px solid var(--red-bd)', background: 'var(--red-lt)', cursor: 'pointer', color: 'var(--red-dk)', whiteSpace: 'nowrap', flexShrink: 0, height: 38 }}>Remove</button>
      )}
    </div>
  );
}

// ── File uploader (for photos tab) ────────────────────────────────────────────

export function FileUploadBtn({ onFiles, multiple, accept, children }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept || 'image/*'} multiple={multiple} onChange={e => { onFiles(Array.from(e.target.files)); e.target.value = ''; }} style={{ display: 'none' }} />
      <div onClick={() => ref.current?.click()} style={{ cursor: 'pointer' }}>{children}</div>
    </>
  );
}

// ── OCR message bar ───────────────────────────────────────────────────────────

export function OcrMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-lt)', padding: '8px 10px', borderRadius: 6, marginBottom: 10, border: '1px solid var(--primary-bd)' }}>{msg}</div>
  );
}
