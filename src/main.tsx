import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SplashScreen } from './components/common/SplashScreen.tsx';
import './index.css';

function Root() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {/* App renders underneath; becomes visible once splash fades out */}
      <App />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
