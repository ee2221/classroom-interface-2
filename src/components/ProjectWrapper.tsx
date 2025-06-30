import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Cloud, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
import { useSceneStore } from '../store/sceneStore';
import { useFirestoreScene } from '../hooks/useFirestore';
import { 
  saveObject, 
  saveGroup, 
  saveLight, 
  saveScene,
  objectToFirestore,
  FirestoreGroup,
  FirestoreLight,
  FirestoreScene
} from '../services/firestoreService';

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
  const { 
    sceneSettings, 
    objects, 
    groups, 
    lights, 
    resetScene,
    cameraPerspective, 
    cameraZoom 
  } = useSceneStore();
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize Firestore integration for this project
  const {
    objects: firestoreObjects,
    groups: firestoreGroups,
    lights: firestoreLights,
    loading: firestoreLoading,
    error: firestoreError,
    addObject: addFirestoreObject,
    updateObject: updateFirestoreObject,
    removeObject: removeFirestoreObject,
    addGroup: addFirestoreGroup,
    updateGroup: updateFirestoreGroup,
    removeGroup: removeFirestoreGroup,
    addLight: addFirestoreLight,
    updateLight: updateFirestoreLight,
    removeLight: removeFirestoreLight
  } = useFirestoreScene(user?.uid, projectId);

  // Load project data when component mounts
  useEffect(() => {
    if (firestoreObjects.length > 0 || firestoreGroups.length > 0 || firestoreLights.length > 0) {
      // Load data into scene store
      // This would require additional methods in the scene store to load from Firestore
      console.log('Loading project data:', {
        objects: firestoreObjects.length,
        groups: firestoreGroups.length,
        lights: firestoreLights.length
      });
    }
  }, [firestoreObjects, firestoreGroups, firestoreLights]);

  // Reset scene when project changes
  useEffect(() => {
    resetScene();
  }, [projectId, resetScene]);

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

  const handleSave = async () => {
    if (!user || !projectId || saveStatus === 'saving') return;

    setSaveStatus('saving');

    try {
      // Save all objects to cloud
      const objectPromises = objects.map(async (obj) => {
        const firestoreData = objectToFirestore(obj.object, obj.name, undefined, user.uid, projectId);
        firestoreData.visible = obj.visible;
        firestoreData.locked = obj.locked;
        // Only add groupId if it's defined
        if (obj.groupId !== undefined) {
          firestoreData.groupId = obj.groupId;
        }
        return await saveObject(firestoreData, user.uid, projectId);
      });

      // Save all groups to cloud
      const groupPromises = groups.map(async (group) => {
        const firestoreGroup: FirestoreGroup = {
          name: group.name,
          expanded: group.expanded,
          visible: group.visible,
          locked: group.locked,
          objectIds: group.objectIds
        };
        return await saveGroup(firestoreGroup, user.uid, projectId);
      });

      // Save all lights to cloud
      const lightPromises = lights.map(async (light) => {
        const firestoreLight: FirestoreLight = {
          name: light.name,
          type: light.type,
          position: light.position,
          target: light.target,
          intensity: light.intensity,
          color: light.color,
          visible: light.visible,
          castShadow: light.castShadow,
          distance: light.distance,
          decay: light.decay,
          angle: light.angle,
          penumbra: light.penumbra
        };
        return await saveLight(firestoreLight, user.uid, projectId);
      });

      // Save scene settings to cloud
      const sceneData: FirestoreScene = {
        name: `Scene ${new Date().toLocaleString()}`,
        description: 'Auto-saved scene',
        backgroundColor: sceneSettings.backgroundColor,
        showGrid: sceneSettings.showGrid,
        gridSize: sceneSettings.gridSize,
        gridDivisions: sceneSettings.gridDivisions,
        cameraPerspective,
        cameraZoom
      };
      const scenePromise = saveScene(sceneData, user.uid, projectId);

      // Update project metadata
      const metadataPromise = updateDoc(doc(db, 'projects', projectId), {
        updatedAt: serverTimestamp(),
        objectCount: objects.length,
        lastOpened: serverTimestamp()
      });

      // Wait for all saves to complete
      await Promise.all([
        ...objectPromises,
        ...groupPromises,
        ...lightPromises,
        scenePromise,
        metadataPromise
      ]);

      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);

    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">Saved!</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">Error</span>
          </>
        );
      default:
        return (
          <>
            <Cloud className="w-5 h-5" />
            <Save className="w-4 h-4" />
            <span className="text-sm font-medium">Save Project</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl shadow-black/20 border transition-all duration-200 font-medium";
    
    switch (saveStatus) {
      case 'saving':
        return `${baseStyles} bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-wait`;
      case 'saved':
        return `${baseStyles} bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:scale-105 active:scale-95`;
      case 'error':
        return `${baseStyles} bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:scale-105 active:scale-95`;
      default:
        return `${baseStyles} bg-[#1a1a1a] border-white/5 text-white/90 hover:bg-[#2a2a2a] hover:scale-105 active:scale-95`;
    }
  };

  const isDisabled = saveStatus === 'saving' || !user || !projectId;
  const hasContent = objects.length > 0 || groups.length > 0 || lights.length > 0;

  if (firestoreLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading project...</p>
          <p className="text-white/50 text-sm mt-2">Project ID: {projectId.slice(-8)}</p>
        </div>
      </div>
    );
  }

  if (firestoreError) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Project</h2>
          <p className="text-red-400 mb-4">{firestoreError}</p>
          <button
            onClick={onBackToClassroom}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Back to Classroom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* Project Header */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={onBackToClassroom}
            className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 transition-all duration-200 hover:scale-105"
            title="Back to Classroom"
          >
            <ArrowLeft className="w-5 h-5 text-white/90" />
            <span className="text-white/90 font-medium hidden sm:block">Classroom</span>
          </button>

          {/* Project Info */}
          <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold text-white/90">{projectName}</h1>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>{objects.length} objects</span>
                  <span>•</span>
                  <span>{groups.length} groups</span>
                  <span>•</span>
                  <span>{lights.length} lights</span>
                  <span>•</span>
                  <span className="text-blue-400 font-mono">DB: {projectId.slice(-6)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hide Interface Button */}
          <HideInterfaceButton />

          {/* Combined Save Button - positioned next to settings area */}
          <button
            onClick={handleSave}
            disabled={isDisabled || !hasContent}
            className={getButtonStyles()}
            title={
              !user
                ? 'Sign in to save'
                : !projectId
                  ? 'Select a project to save'
                  : !hasContent 
                    ? 'No content to save' 
                    : saveStatus === 'saving' 
                      ? 'Saving project and 3D scene data...' 
                      : 'Save project metadata and 3D scene to cloud'
            }
          >
            {getSaveButtonContent()}
          </button>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5">
              <div className="text-xs text-white/60">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Scene Info */}
          {hasContent && saveStatus === 'idle' && user && projectId && (
            <div className="bg-[#1a1a1a]/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60">
              <div className="flex items-center gap-4">
                {objects.length > 0 && (
                  <span>{objects.length} object{objects.length !== 1 ? 's' : ''}</span>
                )}
                {groups.length > 0 && (
                  <span>{groups.length} group{groups.length !== 1 ? 's' : ''}</span>
                )}
                {lights.length > 0 && (
                  <span>{lights.length} light{lights.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          )}
        </div>
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
      
      {/* Settings panel is always visible */}
      <SettingsPanel />
    </div>
  );
};

export default ProjectWrapper;