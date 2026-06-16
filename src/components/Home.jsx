import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, Star, Zap, Check, X, ChevronRight } from 'lucide-react';

// ── Editable What's New entry (stored in localStorage) ──────────────────────
const LS_NEWS_KEY = 'boothopia_whats_new';
const ADMIN_PIN = '240820';

const DEFAULT_NEWS = [
  { id: 1, icon: '✨', text: 'HD photo capture with camera support' },
  { id: 2, icon: '🖼️', text: 'New frame templates for your strip' },
  { id: 3, icon: '🎨', text: 'Film grain, lens flare & vintage filters added' },
];

function loadNews() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_NEWS_KEY));
    return Array.isArray(d) && d.length > 0 ? d : DEFAULT_NEWS;
  } catch { return DEFAULT_NEWS; }
}

// ── Floating orb ─────────────────────────────────────────────────────────────
function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none', ...style }} />;
}

// ── Feature badge ────────────────────────────────────────────────────────────
function FeatureBadge({ icon: Icon, label, delay = 0 }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        animationDelay: `${delay}s`,
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '999px',
        padding: '0.35rem 0.85rem',
        fontSize: '0.8rem',
        color: '#a1a1aa',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Icon size={13} style={{ color: '#818cf8' }} />
      {label}
    </div>
  );
}

// ── What's New panel ─────────────────────────────────────────────────────────
function WhatsNew() {
  const [items, setItems] = useState(loadNews);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [newText, setNewText] = useState('');
  const [newIcon, setNewIcon] = useState('🆕');
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);

  // Triple-click on the title to open the hidden admin PIN prompt
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const handleTitleClick = () => {
    clickCountRef.current += 1;
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 600);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      setPinPrompt(true); setPinValue(''); setPinError(false);
    }
  };

  const submitPin = () => {
    if (pinValue === ADMIN_PIN) {
      setPinPrompt(false);
      setDraft(items.map(i => ({ ...i })));
      setEditing(true);
    } else {
      setPinError(true);
      setPinValue('');
      setTimeout(() => setPinError(false), 1400);
    }
  };
  const cancelPin = () => { setPinPrompt(false); setPinValue(''); };
  const cancelEdit = () => setEditing(false);
  const saveEdit = () => {
    setItems(draft);
    localStorage.setItem(LS_NEWS_KEY, JSON.stringify(draft));
    setEditing(false);
  };
  const updateDraft = (id, field, val) =>
    setDraft(d => d.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeDraft = (id) => setDraft(d => d.filter(i => i.id !== id));
  const addItem = () => {
    if (!newText.trim()) return;
    setDraft(d => [...d, { id: Date.now(), icon: newIcon, text: newText.trim() }]);
    setNewText(''); setNewIcon('🆕');
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        animationDelay: '0.5s',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        width: '100%',
        backdropFilter: 'blur(12px)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        {/* Triple-click on this title to reveal admin edit */}
        <div
          onClick={handleTitleClick}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default', userSelect: 'none' }}
        >
          <Zap size={15} style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fafafa', fontFamily: 'Outfit' }}>
            What's New
          </span>
          <span style={{
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '999px', padding: '0.1rem 0.5rem',
            fontSize: '0.65rem', color: '#818cf8', fontWeight: 700,
          }}>
            LATEST
          </span>
        </div>

        {/* Inline PIN prompt — only appears after triple-click */}
        {pinPrompt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <input
              autoFocus
              type="password"
              maxLength={8}
              value={pinValue}
              onChange={e => setPinValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitPin(); if (e.key === 'Escape') cancelPin(); }}
              placeholder="PIN"
              style={{
                width: 70, padding: '0.25rem 0.5rem',
                background: pinError ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${pinError ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '0.35rem', color: 'white',
                fontSize: '0.8rem', textAlign: 'center', letterSpacing: '0.2em',
                transition: 'border-color 0.2s',
              }}
            />
            <button onClick={submitPin} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.35rem', color: '#818cf8', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>OK</button>
            <button onClick={cancelPin} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', display: 'flex', padding: '0.2rem' }}><X size={14} /></button>
          </div>
        )}

        {/* Save/Cancel only appear in edit mode */}
        {editing && !pinPrompt && (
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={saveEdit} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.35rem', color: '#22c55e', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Check size={12} /> Save
            </button>
            <button onClick={cancelEdit} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.35rem', color: '#ef4444', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <X size={12} /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {(!editing ? items : draft).map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {editing ? (
              <>
                <input
                  value={item.icon}
                  onChange={e => updateDraft(item.id, 'icon', e.target.value)}
                  style={{ width: 36, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.2rem', textAlign: 'center', fontSize: '1rem' }}
                />
                <input
                  value={item.text}
                  onChange={e => updateDraft(item.id, 'text', e.target.value)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.3rem', color: 'white', padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                />
                <button onClick={() => removeDraft(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '0.83rem', color: '#d4d4d8', lineHeight: 1.5 }}>{item.text}</span>
                <ChevronRight size={13} style={{ color: '#52525b', flexShrink: 0, marginLeft: 'auto' }} />
              </>
            )}
          </div>
        ))}

        {/* Add new item in edit mode */}
        {editing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <input
              value={newIcon}
              onChange={e => setNewIcon(e.target.value)}
              style={{ width: 36, background: 'rgba(255,255,255,0.07)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '0.3rem', color: 'white', padding: '0.2rem', textAlign: 'center', fontSize: '1rem' }}
            />
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Add announcement..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '0.3rem', color: 'white', padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
            />
            <button onClick={addItem} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.35rem', color: '#818cf8', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
              + Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Home component ──────────────────────────────────────────────────────
const Home = ({ onStart }) => {
  const [hovered, setHovered] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem 1.5rem', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient orbs */}
      <FloatingOrb style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />
      <FloatingOrb style={{ width: 300, height: 300, bottom: '-5%', right: '5%', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' }} />
      <FloatingOrb style={{ width: 200, height: 200, top: '40%', right: '20%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />

      {/* ── TOP: Empty Space (or Future Logo) ── */}
      <div style={{ width: '100%', flexShrink: 0 }}></div>

      {/* ── CENTER: Hero + Button ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>

        {/* Hero text */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s', textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            fontFamily: 'Outfit',
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 45%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.05,
            letterSpacing: '-1px',
            marginBottom: '0.75rem',
          }}>
            Boothopia
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '1.05rem', maxWidth: '360px', lineHeight: 1.6 }}>
            Studio-quality photo strips, crafted in seconds.
          </p>
        </div>

        {/* Feature badges */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <FeatureBadge icon={Sparkles} label="HD Capture" delay={0.25} />
          <FeatureBadge icon={Star} label="Premium Frames" delay={0.3} />
          <FeatureBadge icon={Zap} label="Instant Download" delay={0.35} />
        </div>

        {/* CTA Button */}
        <button
          className="btn btn-primary animate-fade-in"
          style={{
            animationDelay: '0.4s',
            padding: '1.1rem 3rem',
            fontSize: '1.15rem',
            fontWeight: 700,
            borderRadius: '999px',
            background: hovered
              ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: hovered
              ? '0 8px 30px rgba(99,102,241,0.6), 0 0 60px rgba(139,92,246,0.2)'
              : '0 4px 20px rgba(99,102,241,0.4)',
            transform: hovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onStart}
        >
          <Camera size={22} />
          Start Photoshoot
        </button>

      </div>

      {/* ── BOTTOM: What's New ── */}
      <div style={{ width: '100%', maxWidth: '520px', flexShrink: 0 }}>
        <WhatsNew />
      </div>

    </div>
  );
};

export default Home;
