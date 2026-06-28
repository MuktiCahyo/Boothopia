import { useState, useEffect } from 'react';
import Home from './components/Home';
import Capture from './components/Capture';
import Review from './components/Review';
import FrameAdmin, { LoginScreen } from './components/FrameAdmin';
import { supabase } from './utils/supabaseClient';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'capture', 'review'
  const [photos, setPhotos] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase Auth session & listen for routing
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
    });

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#a1a1aa', fontFamily: 'Outfit' }}>
        Loading...
      </div>
    );
  }

  // Route: Admin Dashboard (Protected)
  if (currentPath === '/admin') {
    if (!session) {
      // Redirect to /login
      const timer = setTimeout(() => navigate('/login'), 0);
      return () => clearTimeout(timer);
    }
    return <FrameAdmin onExit={() => navigate('/')} />;
  }

  // Route: Login Screen
  if (currentPath === '/login') {
    if (session) {
      // Redirect to /admin
      const timer = setTimeout(() => navigate('/admin'), 0);
      return () => clearTimeout(timer);
    }
    return <LoginScreen onLogin={() => navigate('/admin')} onExit={() => navigate('/')} />;
  }

  // Route: Main App (root path '/')
  return (
    <div className="app-container">
      <div className="bg-gradient"></div>
      
      {currentView === 'home' && (
        <Home onStart={() => setCurrentView('capture')} />
      )}
      
      {currentView === 'capture' && (
        <Capture 
          onComplete={(capturedPhotos) => {
            setPhotos(capturedPhotos);
            setCurrentView('review');
          }}
          onCancel={() => setCurrentView('home')}
        />
      )}
      
      {currentView === 'review' && (
         <Review 
          photos={photos} 
          onRetake={() => {
            setPhotos([]);
            setCurrentView('capture');
          }}
          onHome={() => {
             setPhotos([]);
             setCurrentView('home');
          }}
        />
      )}
    </div>
  );
}

export default App;
