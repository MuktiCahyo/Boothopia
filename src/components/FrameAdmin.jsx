import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Save, LogOut, CheckCircle, AlertCircle, RotateCcw, Check, Zap, ChevronRight } from 'lucide-react';
import { loadConfigs, saveConfigs } from '../utils/configLoader';
import { supabase } from '../utils/supabaseClient';

const EMPTY_SLOTS = [];
const FRAME_LIST = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25]
  .map(n => `/frame/Template vol 6 20k/Trip - ${n}.png`);

const PHOTO_ASPECT = 4 / 3; // w:h landscape
const slotHPercent = (w) => w / PHOTO_ASPECT / 3; // e.g. w=80 → 20%

const defaultSlots = (count, w) => {
  const h = slotHPercent(w);                              // slot height in %
  const freeSpace = 100 - count * h;                      // remaining vertical %
  const gap = count > 1 ? freeSpace / (count + 1) : 0;     // distributed spacing
  const list = [];
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? (100 - h) / 2 : gap + i * (h + gap);
    list.push({ x: parseFloat(((100 - w) / 2).toFixed(2)), y: parseFloat(y.toFixed(2)), w, rotate: 0 });
  }
  return list;
};

// ─── Login Screen (Named Export) ──────────────────────────────────────────────
export const LoginScreen = ({ onLogin, onExit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (verifying) return;
    setVerifying(true);
    setErr('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (data?.session) {
        onLogin();
      }
    } catch (error) {
      setErr(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', fontFamily: 'Outfit, sans-serif', padding: '1rem', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 400, height: 400, top: '-10%', left: '-5%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, bottom: '-5%', right: '5%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '2.5rem 2rem', width: '100%', maxWidth: 400, backdropFilter: 'blur(20px)', boxSizing: 'border-box', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: '0 0 0.5rem 0' }}>Admin Portal</h2>
          <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>Log in to manage Boothopia templates and settings</p>
        </div>

        {err && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', color: '#ef4444', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem', fontWeight: 600 }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@boothopia.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={verifying}
            style={{ width: '100%', padding: '0.8rem', background: '#6366f1', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: 700, cursor: verifying ? 'default' : 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: verifying ? 0.7 : 1 }}
          >
            {verifying ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={onExit}
          style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#a1a1aa', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}
        >
          <LogOut size={16} /> Back to Booth
        </button>
      </div>
    </div>
  );
};

// ─── Whats New Editor Component ──────────────────────────────────────────────
const WhatsNewEditor = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIcon, setNewIcon] = useState('🆕');
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('whats_new')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data) setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Delete all current
      await supabase.from('whats_new').delete().neq('id', 0);
      // 2. Insert new list
      const toInsert = items.map(item => ({ icon: item.icon, text: item.text }));
      if (toInsert.length > 0) {
        const { data, error } = await supabase.from('whats_new').insert(toInsert).select();
        if (!error && data) {
          setItems(data);
        }
      }
      alert('Announcements saved successfully!');
    } catch (err) {
      alert('Failed to save: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDelete = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    const newItem = {
      id: Date.now(),
      icon: newIcon,
      text: newText.trim()
    };
    setItems(prev => [...prev, newItem]);
    setNewText('');
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
        Loading announcements...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 550, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.75rem 2rem', boxSizing: 'border-box' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} style={{ color: '#f59e0b' }} /> Manage Announcements
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <input
                value={item.icon}
                onChange={e => handleUpdate(item.id, 'icon', e.target.value)}
                style={{ width: 40, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.3rem', textAlign: 'center', fontSize: '1rem', outline: 'none' }}
              />
              <input
                value={item.text}
                onChange={e => handleUpdate(item.id, 'text', e.target.value)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.85rem', outline: 'none' }}
              />
              <button
                onClick={() => handleDelete(item.id)}
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.3rem', color: '#ef4444', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Delete
              </button>
            </div>
          ))}
          
          {items.length === 0 && (
            <div style={{ textAlign: 'center', color: '#52525b', fontSize: '0.85rem', padding: '2rem 1rem' }}>No announcements found. Add one below!</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
          <input
            value={newIcon}
            onChange={e => setNewIcon(e.target.value)}
            placeholder="🆕"
            style={{ width: 40, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '0.3rem', color: 'white', padding: '0.3rem', textAlign: 'center', fontSize: '1rem', outline: 'none' }}
          />
          <input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="New feature announcement..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '0.3rem', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.85rem', outline: 'none' }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: '0.35rem 0.75rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.3rem', color: '#818cf8', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Add
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', padding: '0.75rem', background: '#22c55e', border: 'none', borderRadius: '0.4rem', color: 'white', fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
        >
          {saving ? 'Saving...' : <><Save size={16} /> Save Announcements</>}
        </button>
      </div>
    </div>
  );
};

// ─── Draggable Slot on Frame Preview ─────────────────────────────────────────
const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ec4899'];

const SlotBox = ({ slot, index, containerRef, isSelected, onSelect, onChange }) => {
  const elRef = useRef(null);
  const col = COLORS[index % COLORS.length];

  const startDrag = (e) => {
    if (e.target.dataset.handle) return;
    e.preventDefault();
    onSelect();
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
        border: isSelected ? `3px solid white` : `3px solid ${col}`, background: `${col}55`, cursor: 'grab',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: 13, userSelect: 'none',
        boxSizing: 'border-box', borderRadius: 3,
        transform: `rotate(${slot.rotate || 0}deg)`,
        boxShadow: isSelected 
          ? `0 0 15px ${col}, 0 0 0 3px white, 0 4px 12px rgba(0,0,0,0.8)` 
          : `0 0 0 2px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)`,
        zIndex: isSelected ? 10 : 2,
        opacity: isSelected ? 1 : 0.75,
      }}>
      📷 P{index + 1}
      {/* Rotate handle — top right */}
      <div data-handle="r" onMouseDown={startRotate} title="Drag to rotate"
        style={handleStyle({ top: -10, right: -10, cursor: 'crosshair', borderRadius: '50%' })}>↻</div>
    </div>
  );
};

// ─── Main Admin (Default Export) ──────────────────────────────────────────────
const FrameAdmin = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState('frames'); // 'frames' or 'news'
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [frame, setFrame] = useState('');
  const [dbFrames, setDbFrames] = useState([]);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const uploadFileInputRef = useRef(null);
  const uploadFolderInputRef = useRef(null);

  const [count, setCount] = useState(3);
  const [width, setWidth] = useState(78);
  const [rotate, setRotate] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState(new Set(['all']));
  const [previewBg, setPreviewBg] = useState('#888888');
  const [saved, setSaved] = useState(false);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const label = f => {
    if (!f) return '';
    try {
      const decoded = decodeURIComponent(f);
      const parts = decoded.split('/storage/v1/object/public/frames/');
      if (parts.length === 2) {
        const path = parts[1];
        const pathParts = path.split('/');
        const fileName = pathParts.pop();
        const cleanedFileName = fileName.replace(/^\d+-[a-z0-9]+-/, '').replace('.png', '');
        if (pathParts.length > 0) {
          return `${pathParts.join('/')}/${cleanedFileName}`;
        }
        return cleanedFileName;
      }
      return decoded.split('/').pop().replace('.png', '');
    } catch {
      return f.split('/').pop().replace('.png', '');
    }
  };

  const allFrames = useMemo(() => [...FRAME_LIST, ...dbFrames], [dbFrames]);

  // Load configs and dynamic frames on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const merged = await loadConfigs();
        setConfigs(merged);
        
        const { data: framesData, error: framesError } = await supabase
          .from('frames')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (!framesError && framesData) {
          setDbFrames(framesData.map(f => f.image_url));
        }
      } catch (err) {
        console.error("Failed to load initial admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Sync initial frame selection
  useEffect(() => {
    if (allFrames.length > 0 && (!frame || !allFrames.includes(frame))) {
      const timer = setTimeout(() => {
        setFrame(allFrames[0]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [allFrames, frame]);

  const handleFrameUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filter only PNG files
    const pngFiles = files.filter(file => {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      return isPng;
    });

    if (pngFiles.length === 0) {
      alert('Hanya berkas gambar format PNG (.png) yang didukung.');
      e.target.value = null;
      return;
    }

    setUploadingFrame(true);
    let successCount = 0;
    let errors = [];

    try {
      const uploadPromises = pngFiles.map(async (file) => {
        try {
          const fileExt = 'png';
          const cleanName = file.name.replace(/\.png$/i, '');
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `templates/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('frames')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('frames')
            .getPublicUrl(filePath);

          const { data: insertData, error: dbError } = await supabase
            .from('frames')
            .insert([{ name: cleanName, image_url: publicUrl }])
            .select();

          if (dbError) throw dbError;

          if (insertData && insertData.length > 0) {
            successCount++;
            return insertData[0].image_url;
          }
        } catch (err) {
          errors.push(`${file.name}: ${err.message || err}`);
        }
        return null;
      });

      const results = await Promise.all(uploadPromises);
      const newlyAddedUrls = results.filter(Boolean);

      if (newlyAddedUrls.length > 0) {
        setDbFrames(prev => [...prev, ...newlyAddedUrls]);
        setFrame(newlyAddedUrls[newlyAddedUrls.length - 1]);
      }

      if (errors.length > 0) {
        alert(`Berhasil mengunggah ${successCount} bingkai.\nGagal mengunggah beberapa bingkai:\n${errors.join('\n')}`);
      } else {
        alert(`Berhasil mengunggah ${successCount} bingkai PNG!`);
      }
    } catch (err) {
      alert(`Terjadi kesalahan sistem saat mengunggah: ${err.message || err}`);
    } finally {
      setUploadingFrame(false);
      e.target.value = null;
    }
  };

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pngFiles = files.filter(file => {
      return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    });

    if (pngFiles.length === 0) {
      alert('Tidak ditemukan berkas gambar PNG (.png) di dalam folder tersebut.');
      e.target.value = null;
      return;
    }

    setUploadingFrame(true);
    let successCount = 0;
    let errors = [];

    try {
      const uploadPromises = pngFiles.map(async (file) => {
        try {
          const relativePath = file.webkitRelativePath || file.name;
          const cleanName = relativePath.replace(/\.png$/i, '');
          
          const pathParts = relativePath.split('/');
          const fileName = pathParts.pop();
          const folderPath = pathParts.join('/');
          
          const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${fileName}`;
          const filePath = folderPath ? `${folderPath}/${uniqueFileName}` : `templates/${uniqueFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('frames')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('frames')
            .getPublicUrl(filePath);

          const { data: insertData, error: dbError } = await supabase
            .from('frames')
            .insert([{ name: cleanName, image_url: publicUrl }])
            .select();

          if (dbError) throw dbError;

          if (insertData && insertData.length > 0) {
            successCount++;
            return insertData[0].image_url;
          }
        } catch (err) {
          errors.push(`${file.name}: ${err.message || err}`);
        }
        return null;
      });

      const results = await Promise.all(uploadPromises);
      const newlyAddedUrls = results.filter(Boolean);

      if (newlyAddedUrls.length > 0) {
        setDbFrames(prev => [...prev, ...newlyAddedUrls]);
        setFrame(newlyAddedUrls[newlyAddedUrls.length - 1]);
      }

      if (errors.length > 0) {
        alert(`Berhasil mengunggah ${successCount} bingkai dari folder.\nGagal mengunggah beberapa berkas:\n${errors.join('\n')}`);
      } else {
        alert(`Berhasil mengunggah folder: ${successCount} bingkai PNG berhasil diunggah!`);
      }
    } catch (err) {
      alert(`Terjadi kesalahan sistem saat mengunggah folder: ${err.message || err}`);
    } finally {
      setUploadingFrame(false);
      e.target.value = null;
    }
  };

  const slots = configs[frame]?.slots || EMPTY_SLOTS;
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

  // Event handlers to update slots layout directly from input controls
  const handleWidthChange = useCallback((newVal) => {
    setWidth(newVal);
    if (slots.length === 0) return;
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i)
        ? { ...s, w: newVal, x: parseFloat(((100 - newVal) / 2).toFixed(2)) }
        : s
    );
    setSlots(updated);
  }, [slots, targetedIndices, setSlots]);

  const handleRotateChange = useCallback((newVal) => {
    setRotate(newVal);
    if (slots.length === 0) return;
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i) ? { ...s, rotate: newVal } : s
    );
    setSlots(updated);
  }, [slots, targetedIndices, setSlots]);

  // Magnet: snap targeted slots to horizontal center
  const snapCenter = () => {
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i) ? { ...s, x: parseFloat(((100 - s.w) / 2).toFixed(2)) } : s
    );
    setSlots(updated);
  };

  const snapRotation0 = () => {
    const updated = slots.map((s, i) =>
      targetedIndices.includes(i) ? { ...s, rotate: 0 } : s
    );
    setSlots(updated);
  };

  // Keyboard arrow nudge event handler
  useEffect(() => {
    if (activeTab !== 'frames' || targetedIndices.length === 0 || slots.length === 0) return;

    const handleKeyDown = (e) => {
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (!isArrow) return;
      
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      e.preventDefault();

      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 1.0 : 0.1;

      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;

      const updated = slots.map((s, i) => {
        if (targetedIndices.includes(i)) {
          const nx = Math.max(0, Math.min(100 - s.w, s.x + dx));
          const ny = Math.max(0, Math.min(100 - slotHPercent(s.w), s.y + dy));
          return { ...s, x: parseFloat(nx.toFixed(2)), y: parseFloat(ny.toFixed(2)) };
        }
        return s;
      });

      setSlots(updated);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, targetedIndices, slots, setSlots]);

  const handleDeleteFrame = async (frameUrl) => {
    if (!confirm(`Are you sure you want to delete the frame template "${label(frameUrl)}"?`)) return;

    try {
      // 1. Delete from Supabase Storage
      const urlParts = frameUrl.split('/storage/v1/object/public/frames/');
      if (urlParts.length === 2) {
        const storagePath = decodeURIComponent(urlParts[1]);
        const { error: storageError } = await supabase.storage
          .from('frames')
          .remove([storagePath]);
        if (storageError) console.error("Error removing file from storage:", storageError);
      }

      // 2. Delete from database
      const { error: dbError } = await supabase
        .from('frames')
        .delete()
        .eq('image_url', frameUrl);

      if (dbError) throw dbError;

      // 3. Remove configs entry
      const remainingConfigs = { ...configs };
      delete remainingConfigs[frameUrl];
      await saveConfigs(remainingConfigs);
      setConfigs(remainingConfigs);

      // 4. Update UI
      setDbFrames(prev => prev.filter(f => f !== frameUrl));
      if (frame === frameUrl) {
        setFrame('');
      }

      alert('Bingkai berhasil dihapus!');
    } catch (err) {
      alert(`Gagal menghapus bingkai: ${err.message || err}`);
    }
  };

  const updateSlotField = (slotIndex, field, value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updated = slots.map((s, i) => i === slotIndex ? { ...s, [field]: num } : s);
    setSlots(updated);
  };

  const save = async () => {
    await saveConfigs(configs);
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
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleExit = async () => {
    await supabase.auth.signOut();
    onExit();
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#a1a1aa', fontFamily: 'Outfit' }}>Loading dashboard…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: 'Outfit,sans-serif', color: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>⚙️ Admin Panel</span>
          <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.4rem', padding: '0.2rem' }}>
            <button
              onClick={() => setActiveTab('frames')}
              style={{ padding: '0.3rem 0.6rem', background: activeTab === 'frames' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '0.3rem', color: activeTab === 'frames' ? 'white' : '#a1a1aa', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
            >
              Frame Templates
            </button>
            <button
              onClick={() => setActiveTab('news')}
              style={{ padding: '0.3rem 0.6rem', background: activeTab === 'news' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '0.3rem', color: activeTab === 'news' ? 'white' : '#a1a1aa', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
            >
              Announcements
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'frames' && (
            <>
              <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={importJson} />
              <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.4rem', color: '#a1a1aa', cursor: 'pointer', fontSize: '0.8rem' }}>Import JSON</button>
              <button onClick={exportJson} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.4rem', color: '#a1a1aa', cursor: 'pointer', fontSize: '0.8rem' }}>Export JSON</button>
              <button onClick={save} style={{ padding: '0.4rem 0.8rem', background: saved ? '#22c55e' : '#6366f1', border: 'none', borderRadius: '0.4rem', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                {saved ? <><CheckCircle size={14} />Saved!</> : <><Save size={14} />Save All</>}
              </button>
            </>
          )}
          <button onClick={handleExit} style={{ padding: '0.4rem 0.8rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.4rem', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <LogOut size={14} /> Log Out & Exit
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activeTab === 'news' ? (
          <WhatsNewEditor />
        ) : (
          <>
            {/* Frame list */}
            <div style={{ width: 160, borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="file" accept="image/png" multiple style={{ display: 'none' }} ref={uploadFileInputRef} onChange={handleFrameUpload} />
                <input type="file" webkitdirectory="" directory="" style={{ display: 'none' }} ref={uploadFolderInputRef} onChange={handleFolderUpload} />
                <button 
                  onClick={() => uploadFileInputRef.current?.click()} 
                  disabled={uploadingFrame}
                  style={{ width: '100%', padding: '0.5rem', background: '#22c55e', border: 'none', borderRadius: '0.35rem', color: 'white', fontWeight: 700, cursor: uploadingFrame ? 'default' : 'pointer', fontSize: '0.75rem' }}
                >
                  {uploadingFrame ? 'Uploading...' : '+ Upload Files'}
                </button>
                <button 
                  onClick={() => uploadFolderInputRef.current?.click()} 
                  disabled={uploadingFrame}
                  style={{ width: '100%', padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: '0.35rem', color: 'white', fontWeight: 700, cursor: uploadingFrame ? 'default' : 'pointer', fontSize: '0.75rem' }}
                >
                  {uploadingFrame ? 'Uploading...' : '+ Upload Folder'}
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {allFrames.map(f => {
                  const ok = configs[f]?.slots?.length > 0;
                  const isDynamic = dbFrames.includes(f);
                  return (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '0.5rem', background: frame === f ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                      <button onClick={() => setFrame(f)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.75rem', background: 'transparent', border: 'none', borderLeft: frame === f ? '3px solid #6366f1' : '3px solid transparent', color: frame === f ? '#fafafa' : '#71717a', cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem', fontFamily: 'Outfit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ok ? <CheckCircle size={12} color="#22c55e" /> : <AlertCircle size={12} color="#52525b" />}
                        {label(f)}
                      </button>
                      {isDynamic && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFrame(f);
                          }}
                          title="Delete Frame Template"
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', opacity: 0.7 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
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
                      isSelected={selectedSlots.has(i)}
                      onSelect={() => setSelectedSlots(new Set([i]))}
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
                        onChange={e => handleWidthChange(Math.min(150, Math.max(10, Number(e.target.value))))}
                        style={{ width: 54, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.2rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }} />
                      <span style={{ color: '#52525b', fontSize: '0.8rem' }}>%</span>
                      <button onClick={snapCenter} title="Snap to center" style={{ padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.3rem', color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>⊕ Center</button>
                    </div>
                  </label>
                  <input type="range" min="10" max="150" step="1" value={width} onChange={e => handleWidthChange(Number(e.target.value))} style={{ width: '100%' }} />
                </div>

                {/* Rotate */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>
                    Rotation
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input type="number" min="-180" max="180" value={rotate}
                        onChange={e => handleRotateChange(Math.min(180, Math.max(-180, Number(e.target.value))))}
                        style={{ width: 54, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.2rem 0.4rem', fontSize: '0.8rem', textAlign: 'center' }} />
                      <span style={{ color: '#52525b', fontSize: '0.8rem' }}>°</span>
                      <button onClick={snapRotation0} title="Snap to 0°" style={{ padding: '0.2rem 0.5rem', background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '0.3rem', color: '#f97316', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>⊕ 0°</button>
                    </div>
                  </label>
                  <input type="range" min="-180" max="180" step="1" value={rotate}
                    onChange={e => { const v = Number(e.target.value); handleRotateChange(Math.abs(v) <= 5 ? 0 : v); }}
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
          </>
        )}
      </div>
    </div>
  );
};

export default FrameAdmin;
