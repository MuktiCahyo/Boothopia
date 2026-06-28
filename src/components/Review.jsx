import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCcw, Home as HomeIcon, Palette, Upload, Sliders, Type, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { loadConfigs } from '../utils/configLoader';
import { supabase } from '../utils/supabaseClient';

const FilteredPhoto = ({ src, filters, roundness, aspectRatio = 4/3 }) => {
  const [dataUrl, setDataUrl] = useState(src);

  useEffect(() => {
    let active = true;
    const img = new Image();
    // Do NOT set crossOrigin for data URIs, it breaks Safari!
    img.onload = () => {
      if (!active) return;
      
      const targetRatio = aspectRatio;
      const imgRatio = img.width / img.height;
      
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let sourceX = 0;
      let sourceY = 0;

      if (imgRatio > targetRatio) {
         sourceWidth = img.height * targetRatio;
         sourceX = (img.width - sourceWidth) / 2;
      } else {
         sourceHeight = img.width / targetRatio;
         sourceY = (img.height - sourceHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.filter = filters;
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      setDataUrl(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = src;
    
    return () => { active = false; };
  }, [src, filters, aspectRatio]);

  return (
    <div style={{ 
        width: '100%', 
        aspectRatio: `${aspectRatio}`, 
        backgroundColor: 'transparent', 
        borderRadius: `${roundness}rem`,
        overflow: 'hidden'
      }}>
      <img src={dataUrl} alt="shot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
};

// Free-form draggable photo used when a frame is active
const DraggablePhoto = ({ src, filters, aspectRatio = 4/3, roundness, transform, onChange, isSelected, onSelect, isDownloading }) => {
  const [bakedSrc, setBakedSrc] = useState(src);
  const elRef = useRef(null);

  useEffect(() => {
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      const r = aspectRatio;
      const ir = img.width / img.height;
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (ir > r) { sw = img.height * r; sx = (img.width - sw) / 2; }
      else { sh = img.width / r; sy = (img.height - sh) / 2; }
      const c = document.createElement('canvas');
      c.width = sw; c.height = sh;
      const ctx = c.getContext('2d');
      ctx.filter = filters;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      setBakedSrc(c.toDataURL('image/jpeg', 0.95));
    };
    img.src = src;
    return () => { active = false; };
  }, [src, filters, aspectRatio]);

  const { x, y, w, rotate } = transform;

  const startDrag = (e) => {
    if (e.target.dataset.handle) return;
    e.preventDefault();
    onSelect();
    const parent = elRef.current?.parentElement;
    if (!parent) return;
    const pw = parent.offsetWidth;
    const ph = parent.offsetHeight;
    const sx = e.clientX, sy = e.clientY, ox = x, oy = y;
    const onMove = (ev) => onChange({ ...transform, x: ox + ((ev.clientX - sx) / pw * 100), y: oy + ((ev.clientY - sy) / ph * 100) });
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    const parent = elRef.current?.parentElement;
    if (!parent) return;
    const pw = parent.offsetWidth;
    const sx = e.clientX, ow = w;
    const onMove = (ev) => onChange({ ...transform, w: Math.max(5, ow + ((ev.clientX - sx) / pw * 100)) });
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startRotate = (e) => {
    e.preventDefault(); e.stopPropagation();
    const rect = elRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const onMove = (ev) => onChange({ ...transform, rotate: Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90 });
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const dot = (extra) => ({
    position: 'absolute', zIndex: 50, cursor: 'pointer',
    display: isSelected && !isDownloading ? 'flex' : 'none',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: 'white',
    userSelect: 'none', ...extra
  });

  // Snap to horizontal center of the strip container
  const snapCenter = (e) => {
    e.preventDefault();
    onChange({ ...transform, x: (100 - w) / 2 });
  };

  return (
    <div ref={elRef} data-photo="true" onMouseDown={startDrag} onClick={onSelect} onDoubleClick={snapCenter}
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, aspectRatio: `${aspectRatio}`,
        transform: `rotate(${rotate}deg)`, cursor: 'move', userSelect: 'none',
        outline: isSelected && !isDownloading ? '2px dashed #6366f1' : 'none',
        outlineOffset: 2,
        // Selected: pop above frame + multiply blend to composite with cutouts
        // Unselected: sit silently behind the frame
        zIndex: isSelected ? 25 : 15,
        mixBlendMode: isSelected ? 'multiply' : 'normal',
        borderRadius: `${roundness}rem`, overflow: 'hidden',
      }}
    >
      <img src={bakedSrc} alt="shot" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
      {/* Rotate handle — blue circle, TOP RIGHT corner */}
      <div data-handle="r" onMouseDown={startRotate} title="Rotate"
        style={dot({ top: -10, right: -10, width: 22, height: 22, background: '#3b82f6', border: '2px solid white', borderRadius: '50%' })}>↻</div>
      {/* Resize handle — orange square, BOTTOM RIGHT corner */}
      <div data-handle="s" onMouseDown={startResize} title="Resize"
        style={dot({ bottom: -10, right: -10, width: 22, height: 22, background: '#f97316', border: '2px solid white', borderRadius: 4 })}>⤡</div>
      {/* Snap hint */}
      {isSelected && !isDownloading && (
        <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#a1a1aa', whiteSpace: 'nowrap', pointerEvents: 'none' }}>dbl-click to center</div>
      )}
    </div>
  );
};

const STATIC_FRAMES = [
  null,
  ...[1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25].map(n => `/frame/Template vol 6 20k/Trip - ${n}.png`)
];

const PRESET_BGS = [
  { type: 'color', value: '#09090b', thumb: '#09090b' },
  { type: 'color', value: '#ffffff', thumb: '#ffffff' },
  { type: 'color', value: '#fee2e2', thumb: '#fee2e2' },
  { type: 'color', value: '#e0e7ff', thumb: '#e0e7ff' },
  { type: 'gradient', value: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', thumb: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { type: 'gradient', value: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', thumb: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)' },
  { type: 'image', value: '/backgrounds/bg-blobs.svg', thumb: 'url(/backgrounds/bg-blobs.svg)' },
  { type: 'image', value: '/backgrounds/bg-night.svg', thumb: 'url(/backgrounds/bg-night.svg)' },
  { type: 'image', value: '/backgrounds/mobil1.jpg', thumb: 'url(/backgrounds/mobil1.jpg)' },
  { type: 'image', value: '/backgrounds/mobil2.jpg', thumb: 'url(/backgrounds/mobil2.jpg)' }
];

const Review = ({ photos, onRetake, onHome }) => {
  const stripRef = useRef(null);
  const fileInputRef = useRef(null);

  
  // Customization State
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgImage, setBgImage] = useState(null);
  const [caption, setCaption] = useState('Boothopia');
  const [fontColor, setFontColor] = useState('#000000');
  const [paddingX, setPaddingX] = useState('2');
  const [paddingY, setPaddingY] = useState('2');
  const [roundness, setRoundness] = useState('0.5');
  const [photoGap, setPhotoGap] = useState('0.75');
  const photoAspect = 1.33;
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [photoTransforms, setPhotoTransforms] = useState([]);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(null);
  const [frameConfigs, setFrameConfigs] = useState({});
  const [stripWidth, setStripWidth] = useState(300);

  // Supabase dynamic frames
  const [dbFrames, setDbFrames] = useState([]);
  const [canShare] = useState(() => !!(typeof navigator !== 'undefined' && navigator.share && navigator.canShare));

  // Fetch dynamic frames on mount
  useEffect(() => {
    const fetchDynamicFrames = async () => {
      try {
        const { data, error } = await supabase
          .from('frames')
          .select('image_url')
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setDbFrames(data.map(f => f.image_url));
        }
      } catch (err) {
        console.error('Failed to fetch dynamic frames:', err);
      }
    };
    fetchDynamicFrames();
  }, []);

  const allFrames = [...STATIC_FRAMES, ...dbFrames];

  // Track strip width for dynamic layout scaling (especially on mobile)
  useEffect(() => {
    if (!stripRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setStripWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(stripRef.current);
    return () => observer.disconnect();
  }, []);

  // Load frame configs from server + localStorage merge on mount
  useEffect(() => {
    loadConfigs().then(merged => {
      setFrameConfigs(merged);
    });
  }, []);

  // Initialize transforms whenever frame is selected or photo count changes
  useEffect(() => {
    if (!selectedFrame) {
      if (photoTransforms.length > 0) {
        const timer = setTimeout(() => setPhotoTransforms([]), 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    const applyTransforms = () => {
      const container = stripRef.current;
      if (!container) return;
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;
      if (!cw || !ch) return; // layout not ready yet, skip

      const slotConfig = frameConfigs[selectedFrame]?.slots;

      if (slotConfig && slotConfig.length > 0) {
        // ✨ AUTO-FIT: place photos precisely using saved slot config
        const transforms = photos.map((_, i) => {
          const slot = slotConfig[i % slotConfig.length];
          return {
            x: slot.x,
            y: slot.y,
            w: slot.w,
            rotate: slot.rotate || 0,
          };
        });
        setPhotoTransforms(transforms);
      } else {
        // Fallback: evenly distribute manually (pure percentages)
        const photoW = 75; // 75%
        const photoH_pct_w = photoW / photoAspect;
        const parentAspect = photos.length === 6 ? 2/3 : 1/3;
        const photoH_pct_h = photoH_pct_w * parentAspect;
        
        const totalH_pct_h = photoH_pct_h * photos.length;
        const totalGap = (100 - totalH_pct_h) / (photos.length + 1);
        
        const transforms = photos.map((_, i) => ({
          x: (100 - photoW) / 2,
          y: totalGap + i * (photoH_pct_h + totalGap),
          w: photoW,
          rotate: 0,
        }));
        setPhotoTransforms(transforms);
      }
      setSelectedPhotoIdx(null);
    };

    // Use rAF to wait for CSS layout to settle before reading px dimensions
    const raf = requestAnimationFrame(applyTransforms);
    return () => cancelAnimationFrame(raf);
  }, [selectedFrame, photos, frameConfigs, photoTransforms.length]);

  // Filter Intensities (0-100)
  const [grayscaleInt, setGrayscaleInt] = useState(0);
  const [softInt, setSoftInt] = useState(0);
  const [retroInt, setRetroInt] = useState(0);
  const [vintageInt, setVintageInt] = useState(0);
  const [grainInt, setGrainInt] = useState(0);
  const [flareInt, setFlareInt] = useState(0);
  const [coolInt, setCoolInt] = useState(0);

  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('options'); // 'options' | 'filters'

  const applyPreset = (preset) => {
    setGrayscaleInt(0);
    setSoftInt(0);
    setRetroInt(0);
    setVintageInt(0);
    setGrainInt(0);
    setFlareInt(0);
    setCoolInt(0);

    if (preset === 'bw') {
      setGrayscaleInt(100);
      setRetroInt(20);
    } else if (preset === 'vintage') {
      setVintageInt(60);
      setRetroInt(30);
      setGrainInt(15);
    } else if (preset === 'cool') {
      setCoolInt(60);
      setRetroInt(10);
    } else if (preset === 'warm') {
      setVintageInt(30);
      setFlareInt(30);
      setSoftInt(10);
    }
  };

  const handleShare = async () => {
    if (!stripRef.current || isDownloading) return;
    setIsDownloading(true);
    
    try {
      const currentWidth = stripRef.current.offsetWidth;
      let exportScale = 1200 / currentWidth;
      if (exportScale < 3) exportScale = 3;

      const canvas = await html2canvas(stripRef.current, {
        scale: exportScale,
        useCORS: true,
        backgroundColor: bgColor,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          setIsDownloading(false);
          return;
        }

        const file = new File([blob], `photobooth-${Date.now()}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Photo Strip',
              text: 'Look at my photo strip from Boothopia!',
            });
          } catch (shareErr) {
            console.log('Share action closed/cancelled:', shareErr);
          }
        } else {
          alert('Sharing is not supported on this device. Standard download will start.');
          const localUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = file.name;
          link.href = localUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setIsDownloading(false);
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Failed to share strip:', err);
      setIsDownloading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  const handleDownload = async () => {
    if (!stripRef.current || isDownloading) return;
    setIsDownloading(true);
    
    try {
      const currentWidth = stripRef.current.offsetWidth;
      // Guarantee a minimum of 1200px physical width for the output image
      // (1200x3600 is 4.3 Megapixels, very high quality for a photo strip, safe for iOS limit)
      let exportScale = 1200 / currentWidth;
      
      // Ensure we always have at least 3x scaling for sharp text, even on large desktop monitors
      if (exportScale < 3) exportScale = 3;

      const canvas = await html2canvas(stripRef.current, {
        scale: exportScale, // Dynamic Ultra-HD export
        useCORS: true,
        backgroundColor: bgColor,
      });
      
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          setIsDownloading(false);
          return;
        }

        // Standard browser download trigger (runs immediately for better UX)
        const localUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `photobooth-${Date.now()}.png`;
        link.href = localUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(localUrl);

        setIsDownloading(false);
        alert('HD strip downloaded successfully!');
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Failed to capture strip:', err);
      setIsDownloading(false);
    }
  };

  // Compile CSS filters for the inner content
  const cssFilters = `
    grayscale(${grayscaleInt}%) 
    blur(${softInt * 0.02}px) 
    brightness(${100 + softInt * 0.15}%) 
    contrast(${100 + retroInt * 0.25 - softInt * 0.1}%) 
    saturate(${100 - retroInt * 0.5 - vintageInt * 0.3 - coolInt * 0.3}%)
    sepia(${vintageInt + coolInt}%)
    hue-rotate(${coolInt * 1.8}deg)
  `;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-secondary btn-icon" onClick={onHome} title="Go Home">
          <HomeIcon size={20} />
        </button>
        <div style={{ fontWeight: 600, fontSize: '1.2rem', fontFamily: 'Outfit' }}>Customize Strip</div>
        <button className="btn btn-primary btn-icon" onClick={handleDownload} disabled={isDownloading} title="Download">
          <Download size={20} />
        </button>
      </div>

      <div className="responsive-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Strip Viewer Area */}
        <div className="preview-area" 
             onMouseDown={(e) => {
               if (!e.target.closest('[data-photo]')) {
                 setSelectedPhotoIdx(null);
               }
             }}
             style={{ flex: 1, overflow: 'hidden', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--background)' }}>
          <div 
            ref={stripRef}
            style={{ 
              backgroundColor: bgColor,
              backgroundImage: bgImage && bgImage.startsWith('linear') ? bgImage : (bgImage ? `url(${bgImage})` : 'none'),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              height: '100%',
              maxWidth: '100%',
              aspectRatio: photos.length === 6 ? '2/3' : '1/3',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Frame mode: each photo is independently draggable/resizable/rotatable */}
            {selectedFrame ? (
              photos.map((p, idx) => (
                photoTransforms[idx] ? (
                  <DraggablePhoto
                    key={idx}
                    src={p}
                    filters={cssFilters}
                    roundness={roundness}
                    aspectRatio={Number(photoAspect)}
                    transform={photoTransforms[idx]}
                    isSelected={selectedPhotoIdx === idx}
                    isDownloading={isDownloading}
                    onSelect={() => setSelectedPhotoIdx(idx)}
                    onChange={(t) => setPhotoTransforms(prev => prev.map((pt, i) => i === idx ? t : pt))}
                  />
                ) : null
              ))
            ) : (
              /* Normal grid layout when no frame */
              <div style={{
                display: 'grid',
                gridTemplateColumns: photos.length === 6 ? '1fr 1fr' : '1fr',
                gap: `${photoGap * 0.06 * stripWidth}px`,
                padding: `${paddingY * 0.06 * stripWidth}px ${paddingX * 0.06 * stripWidth}px ${(Number(paddingY) * 0.06 + 0.12) * stripWidth}px`,
                boxSizing: 'border-box',
              }}>
                {photos.map((p, idx) => (
                  <FilteredPhoto key={idx} src={p} filters={cssFilters} roundness={roundness} aspectRatio={Number(photoAspect)} />
                ))}
              </div>
            )}
            
            {caption && !selectedFrame && (
               <div style={{ position: 'absolute', bottom: `${0.05 * stripWidth}px`, left: 0, right: 0, textAlign: 'center', color: fontColor, fontFamily: 'Outfit', fontSize: `${0.075 * stripWidth}px`, fontWeight: '600', zIndex: 5 }}>
                 {caption}
               </div>
            )}

            {/* Frame Overlay - solid on top; selected photos handle their own multiply compositing */}
            {selectedFrame && (
              <img 
                src={selectedFrame} 
                alt="Frame Overlay" 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'fill', 
                  zIndex: 20, 
                  pointerEvents: 'none',
                }} 
              />
            )}

            {/* Overlays for heavy visual effects bounds mapping to HTML canvas natively */}
            {grainInt > 0 && (
              <div style={{
                 position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
                 backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                 opacity: grainInt / 100,
                 mixBlendMode: 'overlay'
              }}/>
            )}

            {flareInt > 0 && (
              <div style={{
                 position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 11,
                 background: 'radial-gradient(circle at 75% 25%, rgba(255,255,255,0.9) 0%, rgba(255,200,100,0.5) 20%, transparent 60%)',
                 opacity: flareInt / 100,
                 mixBlendMode: 'screen'
              }}/>
            )}
           
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="glass-panel sidebar-panel" style={{ width: '340px', borderRight: 'none', borderTop: 'none', borderBottom: 'none', borderRadius: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
          {/* Tab Selection */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button 
              style={{ flex: 1, padding: '1rem', background: activeTab === 'options' ? 'var(--surface)' : 'transparent', border: 'none', color: activeTab === 'options' ? 'white' : '#a1a1aa', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => setActiveTab('options')}
            ><Palette size={18} /> Options</button>
            <button 
              style={{ flex: 1, padding: '1rem', background: activeTab === 'filters' ? 'var(--surface)' : 'transparent', border: 'none', color: activeTab === 'filters' ? 'white' : '#a1a1aa', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => setActiveTab('filters')}
            ><Sliders size={18} /> Filters</button>
            <button 
              style={{ flex: 1, padding: '1rem', background: activeTab === 'frames' ? 'var(--surface)' : 'transparent', border: 'none', color: activeTab === 'frames' ? 'white' : '#a1a1aa', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => setActiveTab('frames')}
            ><Upload size={18} /> Frames</button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minHeight: 0 }}>
            
            {activeTab === 'options' && (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#a1a1aa' }}>Filter Presets</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => applyPreset('original')} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>Original</button>
                    <button className="btn btn-secondary" onClick={() => applyPreset('bw')} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>B&W</button>
                    <button className="btn btn-secondary" onClick={() => applyPreset('vintage')} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>Vintage</button>
                    <button className="btn btn-secondary" onClick={() => applyPreset('cool')} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>Cool Blue</button>
                    <button className="btn btn-secondary" onClick={() => applyPreset('warm')} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>Warm Glow</button>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#a1a1aa' }}>Background</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {PRESET_BGS.map((bg, i) => (
                      <div 
                        key={i}
                        className={`color-swatch ${(bg.type === 'color' && bgColor === bg.value && !bgImage) || ((bg.type === 'gradient' || bg.type === 'image') && bgImage === bg.value) ? 'active' : ''}`}
                        style={{ background: bg.thumb, backgroundSize: 'cover' }}
                        onClick={() => {
                           if (bg.type === 'color') {
                              setBgColor(bg.value);
                              setBgImage(null);
                              if (bg.value === '#09090b') setFontColor('#ffffff');
                              else setFontColor('#000000');
                           } else {
                              setBgImage(bg.value);
                           }
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setBgImage(null); }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center', width: '100%', pointerEvents: 'none' }}>
                         <Palette size={14} /> Custom BG Color
                      </button>
                    </div>

                    <div>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center', width: '100%' }} onClick={() => fileInputRef.current.click()}>
                         <Upload size={14} /> Upload BG Image
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#a1a1aa' }}>
                    Caption text
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', pointerEvents: 'none' }}>
                        <Type size={12} /> Color
                      </button>
                    </div>
                  </label>
                  <input className="input" type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Boothopia" />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#a1a1aa', fontWeight: '600' }}>Frame Calibration</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#a1a1aa' }}>
                        <span>Horizontal Padding (Left/Right)</span>
                      </div>
                      <input type="range" min="0" max="6" step="0.1" value={paddingX} onChange={e => setPaddingX(e.target.value)} style={{ width: '100%' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#a1a1aa' }}>
                        <span>Vertical Padding (Top/Bottom)</span>
                      </div>
                      <input type="range" min="0" max="6" step="0.1" value={paddingY} onChange={e => setPaddingY(e.target.value)} style={{ width: '100%' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#a1a1aa' }}>
                        <span>Photo Gap (Spacing)</span>
                      </div>
                      <input type="range" min="0" max="3" step="0.05" value={photoGap} onChange={e => setPhotoGap(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#a1a1aa' }}>
                        <span>Photo Roundness</span>
                      </div>
                      <input type="range" min="0" max="2" step="0.1" value={roundness} onChange={e => setRoundness(e.target.value)} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'frames' && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#6366f1', background: 'rgba(99,102,241,0.1)', borderRadius: '0.4rem', padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
                  💡 Drag photos to align with holes. <span style={{color:'#3b82f6', fontWeight:700}}>🔵 Blue circle</span> = Rotate. <span style={{color:'#f97316', fontWeight:700}}>🟠 Orange square</span> = Resize. Double-click a photo to snap it to center.
                </div>
                {/* Removed auto-fit status messages as requested */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {allFrames.map((fr, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedFrame(fr)}
                      style={{ 
                        aspectRatio: '1/3', 
                        backgroundColor: fr === null ? 'var(--surface)' : 'transparent', 
                        backgroundImage: fr ? `url("${fr}")` : 'none', 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center', 
                        border: selectedFrame === fr ? '2px solid var(--primary)' : '2px solid transparent', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingBottom: '4px',
                        color: '#a1a1aa',
                        fontSize: '0.8rem',
                        position: 'relative',
                      }}
                    >
                      {fr === null && "None"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'filters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>
                    Grayscale Intensity <span>{grayscaleInt}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={grayscaleInt} onChange={e => setGrayscaleInt(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>
                    Soft Filter Intensity <span>{softInt}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={softInt} onChange={e => setSoftInt(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>
                    Retro Filter Intensity <span>{retroInt}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={retroInt} onChange={e => setRetroInt(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>
                    Vintage (Sepia) Intensity <span>{vintageInt}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={vintageInt} onChange={e => setVintageInt(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>
                    Cool Blue Intensity <span>{coolInt}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={coolInt} onChange={e => setCoolInt(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>
                    Film Grain Intensity <span>{grainInt}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={grainInt} onChange={e => setGrainInt(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#a1a1aa' }}>
                    Lens Flare Intensity <span>{flareInt}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={flareInt} onChange={e => setFlareInt(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>
            )}

          </div>

          {/* Action Row (Pinned to bottom) */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? 'Saving...' : 'Download HD Strip'}
              {!isDownloading && <Download size={18} />}
            </button>
            {canShare && (
              <button className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }} 
                onClick={handleShare} disabled={isDownloading}>
                <Share2 size={16} /> Share Photo Strip
              </button>
            )}
            <button className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem' }} onClick={onRetake}>
              <RefreshCcw size={16} /> Retake Photos
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Review;
