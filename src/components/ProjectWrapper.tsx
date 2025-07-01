import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Cloud, AlertCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import Scene from './Scene';
import Toolbar from './Toolbar';
import ActionsToolbar from './ActionsToolbar';
import LayersPanel from './LayersPanel';
import ObjectProperties from './ObjectProperties';
import EditControls from './EditControls';
import CameraPerspectivePanel from './CameraPerspectivePanel';
import LightingPanel from './LightingPanel';
import SettingsPanel, { HideInterfaceButton } from './SettingsPanel';
import SaveButton from './SaveButton';
import { useSceneStore } from '../store/sceneStore';

interface ProjectWrapperProps {
  projectId: string;
  projectName: string;
  user: any;
  onBackToClassroom: () => void;
}

const ProjectWrapper: React.FC<ProjectWrapperProps> = ({ 
  projectId, 
  projectName, 
  user, 
  onBackToClassroom 
}) => {
  const { sceneSettings, objects, groups, lights } = useSceneStore();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (!projectId || !user) return;

      try {
        setSaveStatus('saving');
        
        // Update project metadata
        await updateDoc(doc(db, 'projects', projectId), {
          updatedAt: serverTimestamp(),
          objectCount: objects.length,
          lastOpened: serverTimestamp()
        });

        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };

    // Auto-save every 30 seconds if there are changes
    const interval = setInterval(() => {
      if (objects.length > 0 || groups.length > 0 || lights.length > 0) {
        autoSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId, user, objects.length, groups.length, lights.length]);

  const handleManualSave = async () => {
    if (!projectId || !user || saveStatus === 'saving') return;

    try {
      setSaveStatus('saving');
      
      await updateDoc(doc(db, 'projects', projectId), {
        updatedAt: serverTimestamp(),
        objectCount: objects.length,
        lastOpened: serverTimestamp()
      });

      setSaveStatus('saved');
      setLastSaved(new Date());
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <Cloud className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Saved</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400">Error</span>
          </>
        );
      default:
        return (
          <>
            <Save className="w-4 h-4" />
            <span>Save</span>
          </>
        );
    }
  };

  return (
    <div className="w-full h-screen relative">
      {/* Save Button - Top Left */}
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
        {/* Manual Save Button */}
        <button
          onClick={handleManualSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl shadow-black/20 border transition-all duration-200 font-medium ${
            saveStatus === 'saving'
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-wait'
              : saveStatus === 'saved'
                ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30'
                : saveStatus === 'error'
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                  : 'bg-[#1a1a1a] border-white/5 text-white/90 hover:bg-[#2a2a2a] hover:scale-105'
          }`}
          title="Save project metadata"
        >
          {getSaveButtonContent()}
        </button>

        {/* Cloud Save Button */}
        <SaveButton user={user} projectId={projectId} />

        {lastSaved && (
          <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-xl shadow-2xl shadow-black/20 p-2 border border-white/5">
            <div className="text-xs text-white/60 text-center">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Back Button - Top Left, below save buttons */}
      <div className="absolute top-4 left-4 z-40" style={{ marginTop: '140px' }}>
        <button
          onClick={onBackToClassroom}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 transition-all duration-200 hover:scale-105"
          title="Back to Classroom"
        >
          <ArrowLeft className="w-5 h-5 text-white/90" />
          <span className="text-white/90 font-medium hidden sm:block">Classroom</span>
        </button>
      </div>

      {/* Hide Interface Button - Top Left, below back button */}
      <div className="absolute top-4 left-4 z-40" style={{ marginTop: '200px' }}>
        <HideInterfaceButton />
      </div>

      {/* 3D Scene */}
      <Scene />
      
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
      
      {/* Settings panel is always visible and will show project name */}
      <SettingsPanel projectName={projectName} />
    </div>
  );
};

export default ProjectWrapper;