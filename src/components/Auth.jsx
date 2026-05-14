import { useState, useRef, useEffect } from 'react';
import { hasPin, setPin, verifyPin, startSession } from '../utils/crypto.js';
import { Card, Btn } from './ui.jsx';

const HEADER = {
  background: 'var(--primary)', color: '#fff', padding: '24px 24px 20px',
  paddingTop: 'calc(24px + var(--safe-t))', textAlign: 'center',
};

function Screen({ children }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={HEADER}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>❄️</div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Enspar Chiller Audit</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>On-Site Utility Measurement Tool</div>
      </div>
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 420, margin: '0 auto', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}

// ── PIN digit input ────────────────────────────────────────────────────────────

function PinInput({ value, onChange, onSubmit }) {
  const inputs = [useRef(), useRef(), useRef(), useRef()];
  const digits = value.split('').concat(Array(4).fill('')).slice(0, 4);

  const handleKey = (i, e) => {
    const k = e.key;
    if (k >= '0' && k <= '9') {
      const next = digits.slice(); next[i] = k;
      const str = next.join('');
      onChange(str);
      if (i < 3) setTimeout(() => inputs[i + 1].current?.focus(), 10);
      if (str.length === 4) onSubmit(str);
    } else if (k === 'Backspace') {
      const next = digits.slice(); next[i] = '';
      if (digits[i] === '' && i > 0) {
        next[i - 1] = '';
        setTimeout(() => inputs[i - 1].current?.focus(), 10);
      }
      onChange(next.join(''));
    }
  };

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '24px 0' }}>
      {digits.map((d, i) => (
        <input key={i} ref={inputs[i]} type="password" inputMode="numeric" maxLength={1} value={d} onChange={() => {}}
          onKeyDown={e => handleKey(i, e)}
          onFocus={e => e.target.select()}
          style={{
            width: 56, height: 64, textAlign: 'center', fontSize: 28, fontFamily: 'var(--mono)',
            borderRadius: 12, border: `2px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
            background: d ? 'var(--primary-lt)' : 'var(--card)', color: 'var(--text)', outline: 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── Setup (first launch) ──────────────────────────────────────────────────────

export function SetupScreen({ onDone }) {
  const [step, setStep] = useState('set'); // 'set' | 'confirm'
  const [pin, setPin2] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSetPin = (p) => {
    if (p.length === 4) { setPin2(p); setConfirm(''); setStep('confirm'); setError(''); }
  };

  const handleConfirmPin = async (c) => {
    if (c.length === 4) {
      if (c !== pin) { setError('PINs do not match. Try again.'); setConfirm(''); setStep('set'); setPin2(''); return; }
      await setPin(pin);
      startSession();
      onDone();
    }
  };

  return (
    <Screen>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            {step === 'set' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {step === 'set' ? 'Protects audit data on this device' : 'Enter the same PIN again to confirm'}
          </div>
        </div>
        {step === 'set'
          ? <PinInput value={pin} onChange={setPin2} onSubmit={handleSetPin} />
          : <PinInput value={confirm} onChange={setConfirm} onSubmit={handleConfirmPin} />
        }
        {error && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', padding: '8px', background: 'var(--red-lt)', borderRadius: 6 }}>{error}</div>}
      </Card>
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
        PIN is hashed with SHA-256 and never transmitted.<br />Stored only on this device.
      </div>
    </Screen>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

export function LoginScreen({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const tryUnlock = async (p) => {
    if (p.length !== 4) return;
    const ok = await verifyPin(p);
    if (ok) { startSession(); onSuccess(); }
    else {
      setError('Incorrect PIN');
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <Screen>
      <Card style={shake ? { animation: 'none', border: '1.5px solid var(--red-bd)', background: 'var(--red-lt)' } : {}}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Enter PIN</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Tap digits to unlock</div>
        </div>
        <PinInput value={pin} onChange={setPin} onSubmit={tryUnlock} />
        {error && <div style={{ color: 'var(--red-dk)', fontSize: 13, textAlign: 'center', padding: '6px', background: 'var(--red-lt)', borderRadius: 6 }}>{error}</div>}
      </Card>
    </Screen>
  );
}
