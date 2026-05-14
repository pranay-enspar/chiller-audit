import { useState, useRef } from 'react';
import { Card, SecH, Btn, FileUploadBtn } from './ui.jsx';
import { savePhoto, deletePhoto, generateId } from '../utils/storage.js';

export default function PhotosTab({ photos, setPhotos }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const camRef = useRef(null);

  const processFiles = async files => {
    setLoading(true);
    const added = [];
    for (const file of files) {
      try {
        const dataUrl = await readFile(file);
        const photo = {
          id: generateId(),
          name: file.name || `Photo_${Date.now()}`,
          dataUrl,
          timestamp: Date.now(),
          size: file.size
        };
        await savePhoto(photo);
        added.push(photo);
      } catch (e) { console.error('Failed to save photo', e); }
    }
    setPhotos(prev => [...prev, ...added]);
    setLoading(false);
  };

  const remove = async id => {
    await deletePhoto(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  const totalMB = (photos.reduce((s, p) => s + (p.size || 0), 0) / 1024 / 1024).toFixed(1);

  return (
    <div>
      {/* Upload area */}
      <Card>
        <SecH t="Upload Photos" />
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {/* Camera capture (mobile) */}
          <FileUploadBtn onFiles={processFiles} accept="image/*" multiple>
            <div style={{
              flex: 1, height: 80, borderRadius: 10, border: '2px dashed var(--primary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'var(--primary-lt)', cursor: 'pointer', gap: 4
            }}>
              <span style={{ fontSize: 26 }}>📷</span>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Camera / Files</span>
            </div>
          </FileUploadBtn>
        </div>
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', color: 'var(--primary)', fontSize: 13 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Processing photos…
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{photos.length} photo{photos.length !== 1 ? 's' : ''} · {totalMB} MB</div>
      </Card>

      {/* Grid */}
      {photos.length === 0
        ? <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🖼️</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No photos yet</div>
            <div style={{ fontSize: 13 }}>Upload photos above. Then assign them to equipment in the Equipment tab using the 📷 Assign button.</div>
          </div>
        : <>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
              Tap a photo to preview. Assign photos to equipment from the Equipment tab.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={p.dataUrl} alt={p.name} onClick={() => setPreview(p)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                  <button onClick={() => remove(p.id)} style={{
                    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                  }}>✕</button>
                </div>
              ))}
            </div>
          </>
      }

      {/* Preview overlay */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={preview.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
          <div style={{ marginTop: 10, color: '#fff', fontSize: 12, opacity: 0.7 }}>{preview.name}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Btn variant="danger" small onClick={e => { e.stopPropagation(); remove(preview.id); }}>Delete</Btn>
            <Btn variant="ghost" small onClick={() => setPreview(null)} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }}>Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}
