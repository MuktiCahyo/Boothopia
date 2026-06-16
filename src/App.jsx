import { useState } from 'react';
import Home from './components/Home';
import Capture from './components/Capture';
import Review from './components/Review';
import FrameAdmin from './components/FrameAdmin';

// Detect ?admin=1 in the URL query string
const isAdminMode = new URLSearchParams(window.location.search).get('admin') === '1';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'capture', 'review'
  const [photos, setPhotos] = useState([]);

  // Admin mode: render the Frame Admin panel
  if (isAdminMode) {
    return <FrameAdmin onExit={() => window.location.href = '/'} />;
  }

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

