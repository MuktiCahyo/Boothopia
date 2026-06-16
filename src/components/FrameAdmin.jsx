import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Save, LogOut, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { loadConfigs, saveConfigs, clearCache } from '../utils/configLoader';

const FRAME_LIST = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25]
  .map(n => `/frame/Template vol 6 20k/Trip - ${n}.png`);

const ADMIN_PIN = '240820';
const PHOTO_ASPECT = 4 / 3; // w:h landscape
// Frame strip is 1:3 (w:h). So slot height % of frame = slotWidth% / PHOTO_ASPECT / 3
const slotHPercent = (w) => w / PHOTO_ASPECT / 3; // e.g. w=80 → 20%

const defaultSlots = (count, w) => {
  const h = slotHPercent(w);                              // slot height in %
  const freeSpace = 100 - count * h;                      // remaining vertical %
  const gap = freeSpace / (count + 1);                    // even spacing
  return Array.from({ length: count }, (_, i) => ({
    x: (100 - w) / 2,                                     // horizontally centered
    y: parseFloat((gap + i * (h + gap)).toFixed(2)),
    w,
  }));
};

// ─── PIN ─────────────────────────────────────────────────────────────────────
const PinScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (pin === ADMIN_PIN) onUnlock();
    else { setErr(true); setPin(''); setTimeout(() => setErr(false), 1400); }
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '3rem 2rem', width: 300, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem' }}>🔐</div>
        <h2 style={{ color: '#fafafa', margin: '0.5rem 0' }}>Admin Panel</h2>
        <input type="password" maxLength={6} value={pin} placeholder="PIN" autoFocus
          onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ width: '100%', padding: '0.75rem', fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: `1px solid ${err ? '#ef4444' : 'rgba(255,255,255,0.2)'}`, borderRadius: '0.5rem', color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
        {err && <p style={{ color: '#ef4444', margin: '0 0 0.5rem' }}>Incorrect PIN</p>}
        <button onClick={submit} style={{ width: '100%', padding: '0.75rem', background: '#6366f1', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Unlock</button>
      </div>
    </div>
  );
};

// ─── Draggable Slot on Frame Preview ─────────────────────────────────────────
const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ec4899'];

const SlotBox = ({ slot, index, containerRef, onChange }) => {
  const elRef = useRef(null);
  const col = COLORS[index % COLORS.length];

  const startDrag = (e) => {
    if (e.target.dataset.handle) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ox = slot.x, oy = slot.y;
    const move = (ev) => {
      const nx = Math.max(0, Math.min(100 - slot.w, ox + (ev.clientX - sx) / rect.width * 100));
      const ny = Math.max(0, Math.min(100 - slotHPercent(slot.w), oy + (ev.clientY - sy) / rect.height * 100));
      onChange({ ...slot, x: parseFloat(nx.toFixed(2)), y: parseFloat(ny.toFixed(2)) });
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const startRotate = (e) => {
    e.preventDefault(); e.stopPropagation();
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const move = (ev) => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90;
      onChange({ ...slot, rotate: parseFloat(angle.toFixed(1)) });
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleStyle = (extra) => ({
    position: 'absolute', width: 18, height: 18, border: '2px solid white',
    borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white',
    userSelect: 'none', zIndex: 10, background: col, ...extra
  });

  return (
    <div ref={elRef} onMouseDown={startDrag}
      style={{
        position: 'absolute', left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, aspectRatio: `${PHOTO_ASPECT}`,
        border: `3px solid ${col}`, background: `${col}55`, cursor: 'grab',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: 13, userSelect: 'none',
        boxSizing: 'border-box', borderRadius: 3,
        transform: `rotate(${slot.rotate || 0}deg)`,
        boxShadow: `0 0 0 2px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)`,
      }}>
      📷 P{index + 1}
      {/* Rotate handle — top right */}
      <div data-handle="r" onMouseDown={startRotate} title="Drag to rotate"
        style={handleStyle({ top: -10, right: -10, cursor: 'crosshair', borderRadius: '50%' })}>↻</div>
    </div>
  );
};

// ─── Main Admin ───────────────────────────────────────────────────────────────
const FrameAdmin = ({ onExit }) => {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [frame, setFrame] = useState(FRAME_LIST[0]);
  const [count, setCount] = useState(3);
  const [width, setWidth] = useState(78);
  const [rotate, setRotate] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState(new Set(['all']));
  const [previewBg, setPreviewBg] = useState('#888888');
  const [saved, setSaved] = useState(false);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const label = f => f.split('/').pop().replace('.png', '');

  // Load configs on mount (server file + localStorage merge)
  useEffect(() => {
    loadConfigs().then(merged => {
      setConfigs(merged);
      setLoading(false);
    });
  }, []);

  const slots = configs[frame]?.slots || [];
  const hasConfig = slots.length > 0;

  // Which slot indices are currently targeted
  const targetedIndices = selectedSlots.has('all')
    ? slots.map((_, i) => i)
    : [...selectedSlots].filter(i => i < slots.length);

  const toggleSlot = (key) => {
    if (key === 'all') { setSelectedSlots(new Set(['all'])); return; }
    const next = new Set(selectedSlots);
    next.delete('all');
    if (next.has(key)) next.delete(key); else next.add(key);
    if (next.size === 0) next.add('all');
    setSelectedSlots(next);
  };

  const isActive = (key) => selectedSlots.has(key);

  const setSlots = useCallback((s) => {
    setConfigs(p => ({ ...p, [frame]: { slots: s } }));
    setSaved(false);
  }, [frame]);

  const reset = () => { setSlots(defaultSlots(count, width)); setSelectedSlots(new Set(['all'])); };

  // Update width of targeted slots in real-time
  useEffect(() => {
    if (slots.length === 0) return;
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i)
        ? { ...s, w: width, x: (100 - width) / 2 }
        : s
    );
    const changed = updated.some((s, i) => s.w !== slots[i].w);
    if (changed) setSlots(updated);
  }, [width]);

  // Update rotate of targeted slots in real-time
  useEffect(() => {
    if (slots.length === 0) return;
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i) ? { ...s, rotate } : s
    );
    const changed = updated.some((s, i) => (s.rotate || 0) !== (slots[i].rotate || 0));
    if (changed) setSlots(updated);
  }, [rotate]);

  // Magnet: snap targeted slots to horizontal center
  const snapCenter = () => {
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i) ? { ...s, x: parseFloat(((100 - s.w) / 2).toFixed(2)) } : s
    );
    setSlots(updated);
  };

  // Magnet: snap targeted slot rotation to 0°
  const snapRotation0 = () => {
    setRotate(0);
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i) ? { ...s, rotate: 0 } : s
    );
    setSlots(updated);
  };

  // Update a single slot field directly (for custom number inputs)
  const updateSlotField = (idx, field, val) => {
    setSlots(slots.map((s, i) => i === idx ? { ...s, [field]: parseFloat(val) || 0 } : s));
  };

  const save = () => {
    saveConfigs(configs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(configs, null, 2)], { type: 'application/json' }));
    a.download = 'configs.json'; a.click();
  };

  const importJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed && typeof parsed === 'object') {
          setConfigs(parsed);
          setSaved(false);
          alert('Config imported! Click "Save All" to commit changes.\n\nTip: to make this permanent for ALL devices, replace /public/frame/configs.json with this file and redeploy.');
        } else {
          alert('Invalid config format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#a1a1aa', fontFamily: 'Outfit' }}>Loading config…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: 'Outfit,sans-serif', color: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>⚙️ Frame Admin</span>
          <span style={{ color: '#52525b', fontSize: '0.8rem', marginLeft: '0.75rem' }}>Drag photo boxes over the frame holes</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={importJson} />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.4rem', color: '#a1a1aa', cursor: 'pointer', fontSize: '0.8rem' }}>Import JSON</button>
          <button onClick={exportJson} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.4rem', color: '#a1a1aa', cursor: 'pointer', fontSize: '0.8rem' }}>Export JSON</button>
          <button onClick={save} style={{ padding: '0.4rem 0.8rem', background: saved ? '#22c55e' : '#6366f1', border: 'none', borderRadius: '0.4rem', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            {saved ? <><CheckCircle size={14} />Saved!</> : <><Save size={14} />Save All</>}
          </button>
          <button onClick={onExit} style={{ padding: '0.4rem 0.8rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.4rem', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <LogOut size={14} /> Exit
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Frame list */}
        <div style={{ width: 160, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', flexShrink: 0 }}>
          {FRAME_LIST.map(f => {
            const ok = configs[f]?.slots?.length > 0;
            return (
              <button key={f} onClick={() => setFrame(f)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', padding: '0.55rem 0.75rem', background: frame === f ? 'rgba(99,102,241,0.15)' : 'transparent', border: 'none', borderLeft: frame === f ? '3px solid #6366f1' : '3px solid transparent', color: frame === f ? '#fafafa' : '#71717a', cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem', fontFamily: 'Outfit' }}>
                {ok ? <CheckCircle size={12} color="#22c55e" /> : <AlertCircle size={12} color="#52525b" />}
                {label(f)}
              </button>
            );
          })}
        </div>

        {/* Editor area */}
        <div style={{ flex: 1, display: 'flex', gap: '1.5rem', padding: '1.5rem', overflowY: 'auto', alignItems: 'flex-start' }}>
          {/* Frame preview */}
          <div style={{ flexShrink: 0, width: 220 }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                <strong style={{ color: 'white' }}>{label(frame)}</strong>
                {hasConfig
                  ? <span style={{ marginLeft: '0.5rem', color: '#22c55e', fontSize: '0.75rem' }}>✓ Configured</span>
                  : <span style={{ marginLeft: '0.5rem', color: '#f97316', fontSize: '0.75rem' }}>⚠ Not set</span>}
              </span>
              {/* BG color picker */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: '#a1a1aa' }} title="Preview background color">
                🎨
                <input type="color" value={previewBg} onChange={e => setPreviewBg(e.target.value)}
                  style={{ width: 20, height: 20, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
              </label>
            </div>
            <div ref={containerRef}
              style={{ position: 'relative', width: '100%', aspectRatio: '1/3', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', background: `${previewBg} url("${frame}") center/cover` }}>
              {slots.map((slot, i) => (
                <SlotBox key={i} index={i} slot={slot} containerRef={containerRef}
                  onChange={s => setSlots(slots.map((sl, si) => si === i ? s : sl))} />
              ))}
              {slots.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', fontSize: '0.8rem', color: '#a1a1aa', textAlign: 'center', padding: '1rem' }}>
                  Click "Apply Layout" to add photo boxes
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ flex: 1, maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem' }}>Configure Slots</h3>

            {/* Count */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>Number of Photos</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setCount(n)}
                    style={{ flex: 1, padding: '0.6rem', background: count === n ? '#6366f1' : 'rgba(255,255,255,0.07)', border: count === n ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot selector */}
            {slots.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>Apply Changes To</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => toggleSlot('all')}
                    style={{ padding: '0.4rem 0.8rem', background: isActive('all') ? 'white' : 'rgba(255,255,255,0.07)', border: isActive('all') ? 'none' : '1px solid rgba(255,255,255,0.15)', borderRadius: '0.4rem', color: isActive('all') ? '#09090b' : 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                    All
                  </button>
                  {slots.map((_, i) => (
                    <button key={i} onClick={() => toggleSlot(i)}
                      style={{ padding: '0.4rem 0.8rem', background: isActive(i) ? COLORS[i % 4] : 'rgba(255,255,255,0.07)', border: isActive(i) ? 'none' : `1px solid ${COLORS[i % 4]}55`, borderRadius: '0.4rem', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                      P{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Width */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>
                Photo Width
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="number" min="10" max="150" value={width}
                    onChange={e => setWidth(Math.min(150, Math.max(10, Number(e.target.value))))}
                    style={{ width: 54, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.2rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }} />
                  <span style={{ color: '#52525b', fontSize: '0.8rem' }}>%</span>
                  <button onClick={snapCenter} title="Snap to center" style={{ padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.3rem', color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>⊕ Center</button>
                </div>
              </label>
              <input type="range" min="10" max="150" step="1" value={width} onChange={e => setWidth(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Rotate */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>
                Rotation
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="number" min="-180" max="180" value={rotate}
                    onChange={e => setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))}
                    style={{ width: 54, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.2rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }} />
                  <span style={{ color: '#52525b', fontSize: '0.8rem' }}>°</span>
                  <button onClick={snapRotation0} title="Snap to 0°" style={{ padding: '0.2rem 0.5rem', background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '0.3rem', color: '#f97316', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>⊕ 0°</button>
                </div>
              </label>
              <input type="range" min="-180" max="180" step="1" value={rotate}
                onChange={e => { const v = Number(e.target.value); setRotate(Math.abs(v) <= 5 ? 0 : v); }}
                style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#52525b', marginTop: '0.2rem' }}>
                <span>-180°</span><span style={{ color: '#f97316' }}>0° ⊕</span><span>180°</span>
              </div>
            </div>

            {/* Apply */}
            <button onClick={reset}
              style={{ width: '100%', padding: '0.75rem', background: '#6366f1', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <RotateCcw size={16} /> Apply Layout to Frame
            </button>

            <p style={{ fontSize: '0.78rem', color: '#52525b', marginBottom: '1.5rem' }}>
              After applying, drag the colored boxes on the preview to align them with the frame cutout holes.
            </p>

            {/* Slot status — editable */}
            {slots.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0 0 0.75rem', fontWeight: 600 }}>Fine-tune Positions</p>
                {slots.map((s, i) => (
                  <div key={i} style={{ marginBottom: '0.6rem', paddingBottom: '0.6rem', borderBottom: i < slots.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: COLORS[i % 4], fontWeight: 700, fontSize: '0.85rem', minWidth: 24 }}>P{i + 1}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.35rem' }}>
                      {[
                        { label: 'X %', field: 'x', min: 0, max: 100 },
                        { label: 'Y %', field: 'y', min: 0, max: 100 },
                        { label: 'W %', field: 'w', min: 10, max: 150 },
                        { label: 'R °', field: 'rotate', min: -180, max: 180 },
                      ].map(({ label: lbl, field, min, max }) => (
                        <div key={field}>
                          <div style={{ fontSize: '0.65rem', color: '#52525b', marginBottom: '0.15rem', textTransform: 'uppercase' }}>{lbl}</div>
                          <input type="number" min={min} max={max} step="0.1"
                            value={parseFloat((s[field] || 0).toFixed(1))}
                            onChange={e => updateSlotField(i, field, e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: `1px solid ${COLORS[i % 4]}44`, borderRadius: '0.3rem', color: 'white', padding: '0.25rem 0.35rem', fontSize: '0.78rem', textAlign: 'center', boxSizing: 'border-box' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const FrameAdminRoot = ({ onExit }) => {
  const [ok, setOk] = useState(false);
  return ok ? <FrameAdmin onExit={onExit} /> : <PinScreen onUnlock={() => setOk(true)} />;
};
export default FrameAdminRoot;
