import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Clock, Hash, MousePointer, FlipHorizontal, Settings, Video, RefreshCcw, Check, ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, maxWidth = '100px' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div 
        onClick={() => setOpen(!open)}
        className="input"
        style={{
          width: 'auto', padding: '0.35rem 0.6rem', minWidth: '60px', maxWidth,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
          cursor: 'pointer', userSelect: 'none'
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
           {selectedOption?.label}
        </span>
        <ChevronDown size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, 
          marginBottom: '0.5rem', minWidth: '100%',
          background: '#18181b', // Solid dark background
          border: '1px solid var(--border)', borderRadius: '8px',
          padding: '0.25rem', zIndex: 50,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', gap: '2px',
          maxHeight: '200px', overflowY: 'auto'
        }}>
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => { onChange({ target: { value: opt.value } }); setOpen(false); }}
              style={{
                padding: '0.5rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                background: String(value) === String(opt.value) ? 'var(--primary)' : 'transparent',
                color: 'white',
                fontSize: '0.85rem', transition: 'background 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => { if (String(value) !== String(opt.value)) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={e => { if (String(value) !== String(opt.value)) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Capture = ({ onComplete, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  
  // Settings
  const [shotsCount, setShotsCount] = useState(4);
  const [delaySecs, setDelaySecs] = useState(5);
  const [captureMode, setCaptureMode] = useState('auto'); // 'auto' | 'manual'
  const [isFlipped, setIsFlipped] = useState(true);
  
  // Device Selection
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');

  // flow states: 'idle' | 'countdown' | 'manual-ready' | 'flash' | 'preview-decision' | 'done'
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(0);
  const [decisionCountdown, setDecisionCountdown] = useState(5);
  const [photos, setPhotos] = useState([]);
  const [pendingPhoto, setPendingPhoto] = useState(null);

  // Fetch devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = mediaDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDevice) {
           setSelectedDevice(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Could not enumerate devices", err);
      }
    };
    getDevices();
  }, []);

  // Initialize camera stream
  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      try {
        // Stop Old Stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        const isPortrait = window.innerHeight > window.innerWidth;
        const constraints = {
          video: { 
            width: { ideal: isPortrait ? 2160 : 3840 }, 
            height: { ideal: isPortrait ? 3840 : 2160 },
            deviceId: selectedDevice ? { exact: selectedDevice } : undefined
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (active) setError('Could not access camera. Please allow permissions.');
      }
    };

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedDevice]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const videoRatio = video.videoWidth / video.videoHeight;
    const targetRatio = 4 / 3;
    
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (videoRatio > targetRatio) {
       // Video is wider than 4:3
       sourceWidth = video.videoHeight * targetRatio;
       sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
       // Video is taller than 4:3
       sourceHeight = video.videoWidth / targetRatio;
       sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw and mirror conditionally
    if (isFlipped) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    
    // Output as high-quality JPEG (0.97 is visually lossless but 5-10x smaller than PNG)
    // This keeps memory safe on iOS Safari which has strict limits
    return canvas.toDataURL('image/jpeg', 0.97);
  }, [isFlipped]);

  // Main capture loop
  useEffect(() => {
    if (status === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setStatus('flash');
      }
    } else if (status === 'flash') {
      const photo = takePhoto();
      
      const flashTimer = setTimeout(() => {
        setPendingPhoto(photo);
        setStatus('preview-decision');
      }, 150);
      return () => clearTimeout(flashTimer);
    }
  }, [status, countdown, takePhoto, delaySecs, shotsCount, onComplete, captureMode]);

  const handleRetake = () => {
    setPendingPhoto(null);
    if (captureMode === 'auto') {
      setCountdown(delaySecs);
      setStatus('countdown');
    } else {
      setStatus('manual-ready');
    }
  };

  const handleAccept = useCallback(() => {
    setPhotos(prev => {
      const newPhotos = [...prev, pendingPhoto];
      setPendingPhoto(null);
      if (newPhotos.length >= shotsCount) {
         setStatus('done');
         setTimeout(() => onComplete(newPhotos), 500);
      } else {
        if (captureMode === 'auto') {
           setCountdown(delaySecs);
           setStatus('countdown');
        } else {
           setStatus('manual-ready');
        }
      }
      return newPhotos;
    });
  }, [pendingPhoto, shotsCount, captureMode, delaySecs, onComplete]);

  // Auto-continue timer for preview decision
  useEffect(() => {
    if (status === 'preview-decision') {
      if (decisionCountdown > 0) {
        const timer = setTimeout(() => setDecisionCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleAccept();
      }
    } else {
      setDecisionCountdown(5);
    }
  }, [status, decisionCountdown, handleAccept]);

  const startPhotoshoot = () => {
    if (!hasPermission) return;
    setPhotos([]);
    if (captureMode === 'auto') {
       setCountdown(delaySecs);
       setStatus('countdown');
    } else {
       setStatus('manual-ready');
    }
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onCancel();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Top Bar Settings */}
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-secondary btn-icon" onClick={handleCancel}>
          <X size={24} />
        </button>
      </div>

      {/* Main Camera Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '1rem' }}>
        {error ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={() => {
              // Bypass camera for environments like Playwright WebKit that don't support Windows webcams
              const sample = "/backgrounds/mobil1.jpg";
              onComplete(Array(shotsCount).fill(sample));
            }}>
               Bypass Camera (Use Sample Photos)
            </button>
          </div>
        ) : (
           <>
             <div style={{ position: 'relative', width: '100%', maxWidth: '800px', aspectRatio: '4/3', maxHeight: '70vh', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'black', margin: '0 auto' }}>
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 muted 
                 style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isFlipped ? 'scaleX(-1)' : 'none' }}
               />
               <canvas ref={canvasRef} style={{ display: 'none' }} />

               {/* UI Overlays */}
               {status === 'idle' && hasPermission && (
                 <div style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                   <button className="btn btn-primary" onClick={startPhotoshoot} style={{ borderRadius: '999px', padding: '1rem 3rem', fontSize: '1.25rem' }}>
                      <Camera size={24} />
                      <span>Start Frame</span>
                   </button>
                 </div>
               )}

               {status === 'manual-ready' && (
                 <div style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                   <button className="btn btn-primary" onClick={() => setStatus('flash')} style={{ borderRadius: '999px', padding: '1.5rem', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.6)' }}>
                      <Camera size={36} />
                   </button>
                 </div>
               )}

               {status === 'countdown' && (
                  <div className="countdown-overlay" key={countdown}>
                    {countdown}
                  </div>
               )}

               {(status !== 'idle') && (
                 <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 'bold', zIndex: 30 }}>
                   Photo {Math.min(photos.length + 1, shotsCount)} of {shotsCount}
                 </div>
               )}

               {status === 'preview-decision' && pendingPhoto && (
                 <div style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: 'black', display: 'flex', flexDirection: 'column' }}>
                   <img src={pendingPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <div style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                     <button className="btn btn-secondary" onClick={handleRetake} style={{ borderRadius: '999px', padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <RefreshCcw size={20} />
                        Retake
                     </button>
                     <button className="btn btn-primary" onClick={handleAccept} style={{ borderRadius: '999px', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                        <Check size={20} />
                        Continue ({decisionCountdown}s)
                     </button>
                   </div>
                 </div>
               )}

               {/* Stack preview at bottom */}
               {(status !== 'idle' && photos.length > 0) && (
                 <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                   {photos.map((p, i) => (
                     <div key={i} style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '2px solid white' }}>
                       <img src={p} alt={`shot ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Bottom Settings Menu */}
             {status === 'idle' && (
               <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                 <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.5rem 1rem' }}>
                   
                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                     <Video size={16} />
                     <CustomSelect 
                       maxWidth="150px"
                       value={selectedDevice} 
                       onChange={e => setSelectedDevice(e.target.value)}
                       options={devices.map((device, i) => ({ value: device.deviceId, label: device.label || `Camera ${i + 1}` }))}
                     />
                   </label>

                   <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.5rem' }}></div>

                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                     <Hash size={16} /> Photos
                     <CustomSelect 
                       value={shotsCount} 
                       onChange={e => setShotsCount(Number(e.target.value))}
                       options={[{value: 1, label: '1'}, {value: 3, label: '3'}, {value: 4, label: '4'}, {value: 6, label: '6'}]}
                     />
                   </label>

                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                     {captureMode === 'auto' ? <Clock size={16} /> : <MousePointer size={16} />}
                     Mode
                     <CustomSelect 
                       value={captureMode} 
                       onChange={e => setCaptureMode(e.target.value)}
                       options={[{value: 'auto', label: 'Auto'}, {value: 'manual', label: 'Manual'}]}
                     />
                   </label>

                   {captureMode === 'auto' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        Interval
                        <CustomSelect 
                          value={delaySecs} 
                          onChange={e => setDelaySecs(Number(e.target.value))}
                          options={[{value: 3, label: '3s'}, {value: 5, label: '5s'}, {value: 10, label: '10s'}, {value: 15, label: '15s'}, {value: 20, label: '20s'}]}
                        />
                      </label>
                   )}

                   <button 
                     className={`btn ${isFlipped ? 'btn-primary' : 'btn-secondary'}`} 
                     style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                     onClick={() => setIsFlipped(!isFlipped)}
                   >
                     <FlipHorizontal size={16} /> Mirror
                   </button>

                 </div>
               </div>
             )}
           </>
        )}
      </div>

      {/* Flash Effect */}
      <div className={`flash-overlay ${status === 'flash' ? 'flash-active' : ''}`}></div>
    </div>
  );
};

export default Capture;
