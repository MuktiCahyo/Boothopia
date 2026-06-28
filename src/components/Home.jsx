import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Star, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

// ── Editable What's New entry (stored in localStorage) ──────────────────────
const LS_NEWS_KEY = 'boothopia_whats_new';

const DEFAULT_NEWS = [
  { id: 1, icon: '✨', text: 'HD photo capture with camera support' },
  { id: 2, icon: '🖼️', text: 'New frame templates for your strip' },
  { id: 3, icon: '🎨', text: 'Film grain, lens flare & vintage filters added' },
];

// ── Floating orb ─────────────────────────────────────────────────────────────
function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none', ...style }} />;
}

// ── Feature badge ────────────────────────────────────────────────────────────
function FeatureBadge({ icon, label, delay = 0 }) {
  const IconComponent = icon;
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
      <IconComponent size={13} style={{ color: '#818cf8' }} />
      {label}
    </div>
  );
}

// ── What's New panel (Read-Only) ─────────────────────────────────────────────
function WhatsNew() {
  const [items, setItems] = useState([]);

  // Fetch news from Supabase on mount
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('whats_new')
          .select('id, icon, text')
          .order('id', { ascending: true });
        
        if (!error && data && data.length > 0) {
          setItems(data);
        } else {
          const localNews = JSON.parse(localStorage.getItem(LS_NEWS_KEY));
          setItems(Array.isArray(localNews) && localNews.length > 0 ? localNews : DEFAULT_NEWS);
        }
      } catch {
        const localNews = JSON.parse(localStorage.getItem(LS_NEWS_KEY));
        setItems(Array.isArray(localNews) && localNews.length > 0 ? localNews : DEFAULT_NEWS);
      }
    };
    fetchNews();
  }, []);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default', userSelect: 'none' }}>
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
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: '0.83rem', color: '#d4d4d8', lineHeight: 1.5 }}>{item.text}</span>
            <ChevronRight size={13} style={{ color: '#52525b', flexShrink: 0, marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Home component ──────────────────────────────────────────────────────
const Home = ({ onStart }) => {
  const [hovered, setHovered] = useState(false);

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
