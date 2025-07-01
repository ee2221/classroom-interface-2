import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Cloud, AlertCircle, Loader2 } from 'lucide-react';
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
import { 
  subscribeToObjects, 
  subscribeToGroups, 
  subscribeToLights, 
  subscribeToScenes,
  firestoreToObject,
  FirestoreObject,
  FirestoreGroup,
  FirestoreLight,
  FirestoreScene
} from '../services/firestoreService';
import * as THREE from 'three';

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
    updateSceneSettings,
    setCameraPerspective,
    addObject,
    createGroup,
    addLight
  } = useSceneStore();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Real-time data loading with Firestore listeners - now using shared database
  useEffect(() => {
    if (!user) {
      setLoadingProject(false);
      return;
    }

    let objectsUnsubscribe: (() => void) | null = null;
    let groupsUnsubscribe: (() => void) | null = null;
    let lightsUnsubscribe: (() => void) | null = null;
    let scenesUnsubscribe: (() => void) | null = null;

    const setupRealtimeListeners = async () => {
      try {
        setLoadingProject(true);
        setLoadError(null);

        // Reset scene first
        resetScene();

        // Set up real-time listeners for all data types - shared across projects
        objectsUnsubscribe = subscribeToObjects(user.uid, projectId, (firestoreObjects) => {
          console.log('Received shared objects update:', firestoreObjects.length);
          
          // Clear existing objects and reload from Firestore
          const store = useSceneStore.getState();
          
          // Convert Firestore objects to THREE.js objects
          const newObjects = firestoreObjects.map(firestoreObject => {
            if (firestoreObject.id) {
              const threeObject = firestoreToObject(firestoreObject);
              if (threeObject) {
                return {
                  id: firestoreObject.id,
                  object: threeObject,
                  name: firestoreObject.name,
                  visible: firestoreObject.visible,
                  locked: firestoreObject.locked,
                  groupId: firestoreObject.groupId
                };
              }
            }
            return null;
          }).filter(Boolean) as Array<{
            id: string;
            object: THREE.Object3D;
            name: string;
            visible: boolean;
            locked: boolean;
            groupId?: string;
          }>;

          // Update the store directly
          store.objects = newObjects;
          
          if (!dataLoaded) {
            setDataLoaded(true);
            setLoadingProject(false);
          }
        });

        groupsUnsubscribe = subscribeToGroups(user.uid, projectId, (firestoreGroups) => {
          console.log('Received shared groups update:', firestoreGroups.length);
          
          const store = useSceneStore.getState();
          
          // Convert Firestore groups to store groups
          const newGroups = firestoreGroups.map(firestoreGroup => ({
            id: firestoreGroup.id || crypto.randomUUID(),
            name: firestoreGroup.name,
            expanded: firestoreGroup.expanded,
            visible: firestoreGroup.visible,
            locked: firestoreGroup.locked,
            objectIds: firestoreGroup.objectIds
          }));

          // Update the store directly
          store.groups = newGroups;
        });

        lightsUnsubscribe = subscribeToLights(user.uid, projectId, (firestoreLights) => {
          console.log('Received shared lights update:', firestoreLights.length);
          
          const store = useSceneStore.getState();
          
          // Convert Firestore lights to store lights
          const newLights = firestoreLights.map(firestoreLight => {
            // Create the THREE.js light object
            let lightObject: THREE.Light;
            
            switch (firestoreLight.type) {
              case 'directional':
                lightObject = new THREE.DirectionalLight(firestoreLight.color, firestoreLight.intensity);
                lightObject.position.set(...firestoreLight.position);
                (lightObject as THREE.DirectionalLight).target.position.set(...firestoreLight.target);
                break;
              case 'point':
                lightObject = new THREE.PointLight(firestoreLight.color, firestoreLight.intensity, firestoreLight.distance, firestoreLight.decay);
                lightObject.position.set(...firestoreLight.position);
                break;
              case 'spot':
                lightObject = new THREE.SpotLight(firestoreLight.color, firestoreLight.intensity, firestoreLight.distance, firestoreLight.angle, firestoreLight.penumbra, firestoreLight.decay);
                lightObject.position.set(...firestoreLight.position);
                (lightObject as THREE.SpotLight).target.position.set(...firestoreLight.target);
                break;
              default:
                lightObject = new THREE.PointLight(firestoreLight.color, firestoreLight.intensity);
                lightObject.position.set(...firestoreLight.position);
            }
            
            lightObject.castShadow = firestoreLight.castShadow;
            lightObject.visible = firestoreLight.visible;

            return {
              id: firestoreLight.id || crypto.randomUUID(),
              name: firestoreLight.name,
              type: firestoreLight.type,
              position: firestoreLight.position,
              target: firestoreLight.target,
              intensity: firestoreLight.intensity,
              color: firestoreLight.color,
              visible: firestoreLight.visible,
              castShadow: firestoreLight.castShadow,
              distance: firestoreLight.distance,
              decay: firestoreLight.decay,
              angle: firestoreLight.angle,
              penumbra: firestoreLight.penumbra,
              object: lightObject
            };
          });

          // Update the store directly
          store.lights = newLights;
        });

        // Optional: Load scene settings - shared across projects
        scenesUnsubscribe = subscribeToScenes(user.uid, projectId, (firestoreScenes) => {
          if (firestoreScenes.length > 0) {
            const latestScene = firestoreScenes[0]; // Already sorted by createdAt desc
            updateSceneSettings({
              backgroundColor: latestScene.backgroundColor,
              showGrid: latestScene.showGrid,
              gridSize: latestScene.gridSize,
              gridDivisions: latestScene.gridDivisions
            });
            setCameraPerspective(latestScene.cameraPerspective as any);
          }
        });

      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load shared database');
        setLoadingProject(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup function
    return () => {
      if (objectsUnsubscribe) objectsUnsubscribe();
      if (groupsUnsubscribe) groupsUnsubscribe();
      if (lightsUnsubscribe) lightsUnsubscribe();
      if (scenesUnsubscribe) scenesUnsubscribe();
    };
  }, [user?.uid, resetScene, updateSceneSettings, setCameraPerspective]);

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

  const handleUnifiedSave = async () => {
    if (!projectId || !user || saveStatus === 'saving') return;

    try {
      setSaveStatus('saving');
      
      // Save project metadata
      await updateDoc(doc(db, 'projects', projectId), {
        updatedAt: serverTimestamp(),
        objectCount: objects.length,
        lastOpened: serverTimestamp()
      });

      // Note: 3D scene data is automatically saved to shared database via real-time listeners
      // No additional save action needed since all changes are immediately persisted

      setSaveStatus('saved');
      setLastSaved(new Date());
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
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
            <Cloud className="w-3 h-3" />
            <span>Save</span>
          </>
        );
    }
  };

  const hasContent = objects.length > 0 || groups.length > 0 || lights.length > 0;

  // Show loading screen while loading project data
  if (loadingProject) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading shared database...</p>
          <p className="text-white/50 text-sm mt-2">{projectName}</p>
          <p className="text-white/40 text-xs mt-1">All projects share the same objects and scenes</p>
        </div>
      </div>
    );
  }

  // Show error screen if loading failed
  if (loadError) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Shared Database</h2>
          <p className="text-red-400 mb-4">{loadError}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onBackToClassroom}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Back to Classroom
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* Top Left Button Bar - Horizontal Layout */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        {/* Unified Save Button */}
        <button
          onClick={handleUnifiedSave}
          disabled={saveStatus === 'saving' || !user || !projectId}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl shadow-black/20 border transition-all duration-200 font-medium ${
            saveStatus === 'saving'
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-wait'
              : saveStatus === 'saved'
                ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:scale-105'
                : saveStatus === 'error'
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:scale-105'
                  : !user || !projectId
                    ? 'bg-gray-600/20 border-gray-600/30 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1a1a1a] border-white/5 text-white/90 hover:bg-[#2a2a2a] hover:scale-105'
          }`}
          title={
            !user
              ? 'Sign in to save'
              : !projectId
                ? 'Select a project to save'
                : saveStatus === 'saving' 
                  ? 'Saving project metadata...' 
                  : 'Save project metadata (3D data auto-saves to shared database)'
          }
        >
          {getSaveButtonContent()}
        </button>

        {/* Back Button */}
        <button
          onClick={onBackToClassroom}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 transition-all duration-200 hover:scale-105"
          title="Back to Classroom"
        >
          <ArrowLeft className="w-5 h-5 text-white/90" />
          <span className="text-white/90 font-medium hidden sm:block">Classroom</span>
        </button>

        {/* Hide Interface Button */}
        <HideInterfaceButton />
      </div>

      {/* Last Saved Info - Below button bar */}
      {lastSaved && (
        <div className="absolute top-20 left-4 z-40">
          <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-white/5">
            <div className="text-xs text-white/60">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Shared Database Info - Below last saved */}
      <div className="absolute top-32 left-4 z-40">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs">
          <div className="text-blue-400 font-medium mb-1">Shared Database Active</div>
          <div className="text-white/60">
            {hasContent ? (
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
            ) : (
              'All projects access the same 3D objects and scenes'
            )}
          </div>
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
      
      {/* Settings panel is always visible and will show project name */}
      <SettingsPanel projectName={projectName} />
    </div>
  );
};

export default ProjectWrapper;