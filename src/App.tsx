import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import ActionsToolbar from './components/ActionsToolbar';
import LayersPanel from './components/LayersPanel';
import ObjectProperties from './components/ObjectProperties';
import EditControls from './components/EditControls';
import CameraPerspectivePanel from './components/CameraPerspectivePanel';
import LightingPanel from './components/LightingPanel';
import SettingsPanel, { HideInterfaceButton } from './components/SettingsPanel';
import SaveButton from './components/SaveButton';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import { useSceneStore } from './store/sceneStore';

function App() {
  const { sceneSettings } = useSceneStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Show auth modal if no user is signed in
      if (!user) {
        setShowAuthModal(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    setUser(null);
    setShowAuthModal(true);
  };

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="w-full h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <Scene />
      
      {/* Top Left Controls - Arranged horizontally */}
      <div className="fixed top-4 left-4 flex items-center gap-4 z-50">
        {/* Hide Interface Button */}
        <HideInterfaceButton />
        
        {/* Save Button - When user is authenticated */}
        {user && <SaveButton user={user} />}
        
        {/* User Profile - When user is authenticated */}
        {user && <UserProfile user={user} onSignOut={handleSignOut} />}
      </div>
      
      {/* Conditionally render UI panels based on hideAllMenus setting */}
      {!sceneSettings.hideAllMenus && (
        <>
          <ActionsToolbar />
          <Toolbar />
          <LayersPanel />
          <ObjectProperties />
          <EditControls />
          <CameraPerspectivePanel />
          <LightingPanel />
        </>
      )}
      
      {/* Settings panel is always visible */}
      <SettingsPanel />
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;