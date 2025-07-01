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
  getObjects, 
  getGroups, 
  getLights, 
  getScenes,
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

  // Load project data when component mounts or project changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!user || !projectId) {
        setLoadingProject(false);
        return;
      }

      try {
        setLoadingProject(true);
        setLoadError(null);

        // Reset scene first
        resetScene();

        // Load all project data in parallel
        const [
          firestoreObjects,
          firestoreGroups,
          firestoreLights,
          firestoreScenes
        ] = await Promise.all([
          getObjects(user.uid, projectId),
          getGroups(user.uid, projectId),
          getLights(user.uid, projectId),
          getScenes(user.uid, projectId)
        ]);

        // Load scene settings if available (use the most recent scene)
        if (firestoreScenes.length > 0) {
          const latestScene = firestoreScenes[0]; // Already sorted by createdAt desc
          updateSceneSettings({
            backgroundColor: latestScene.backgroundColor,
            showGrid: latestScene.showGrid,
            gridSize: latestScene.gridSize,
            gridDivisions: latestScene.gridDivisions
          });
          setCameraPerspective(latestScene.cameraPerspective as any);
          // Note: cameraZoom would need to be added to the store if needed
        }

        // Load groups first (so objects can be assigned to them)
        const groupMap = new Map<string, string>(); // firestoreId -> storeId
        for (const firestoreGroup of firestoreGroups) {
          if (firestoreGroup.id) {
            const storeGroupId = crypto.randomUUID();
            groupMap.set(firestoreGroup.id, storeGroupId);
            
            createGroup(firestoreGroup.name, []);
            
            // Update the group with the correct properties
            const store = useSceneStore.getState();
            const createdGroup = store.groups.find(g => g.name === firestoreGroup.name);
            if (createdGroup) {
              // Update group properties
              store.groups = store.groups.map(g => 
                g.id === createdGroup.id 
                  ? {
                      ...g,
                      id: storeGroupId,
                      expanded: firestoreGroup.expanded,
                      visible: firestoreGroup.visible,
                      locked: firestoreGroup.locked
                    }
                  : g
              );
            }
          }
        }

        // Load objects
        const objectMap = new Map<string, string>(); // firestoreId -> storeId
        for (const firestoreObject of firestoreObjects) {
          if (firestoreObject.id) {
            const threeObject = firestoreToObject(firestoreObject);
            if (threeObject) {
              const storeObjectId = crypto.randomUUID();
              objectMap.set(firestoreObject.id, storeObjectId);
              
              addObject(threeObject, firestoreObject.name);
              
              // Update object properties
              const store = useSceneStore.getState();
              const addedObject = store.objects[store.objects.length - 1];
              if (addedObject) {
                store.objects = store.objects.map(obj => 
                  obj.id === addedObject.id 
                    ? {
                        ...obj,
                        id: storeObjectId,
                        visible: firestoreObject.visible,
                        locked: firestoreObject.locked,
                        groupId: firestoreObject.groupId ? groupMap.get(firestoreObject.groupId) : undefined
                      }
                    : obj
                );
              }
            }
          }
        }

        // Update group object IDs to match the new store IDs
        const store = useSceneStore.getState();
        store.groups = store.groups.map(group => {
          const originalGroup = firestoreGroups.find(fg => 
            groupMap.get(fg.id || '') === group.id
          );
          if (originalGroup) {
            const newObjectIds = originalGroup.objectIds
              .map(firestoreObjId => objectMap.get(firestoreObjId))
              .filter(Boolean) as string[];
            
            return {
              ...group,
              objectIds: newObjectIds
            };
          }
          return group;
        });

        // Load lights
        for (const firestoreLight of firestoreLights) {
          addLight(
            firestoreLight.type,
            firestoreLight.position
          );
          
          // Update light properties
          const store = useSceneStore.getState();
          const addedLight = store.lights[store.lights.length - 1];
          if (addedLight) {
            store.updateLight(addedLight.id, {
              name: firestoreLight.name,
              target: firestoreLight.target,
              intensity: firestoreLight.intensity,
              color: firestoreLight.color,
              visible: firestoreLight.visible,
              castShadow: firestoreLight.castShadow,
              distance: firestoreLight.distance,
              decay: firestoreLight.decay,
              angle: firestoreLight.angle,
              penumbra: firestoreLight.penumbra
            });
          }
        }

        console.log(`Loaded project data:`, {
          objects: firestoreObjects.length,
          groups: firestoreGroups.length,
          lights: firestoreLights.length,
          scenes: firestoreScenes.length
        });

      } catch (error) {
        console.error('Error loading project data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load project data');
      } finally {
        setLoadingProject(false);
      }
    };

    loadProjectData();
  }, [projectId, user?.uid, resetScene, updateSceneSettings, setCameraPerspective, addObject, createGroup, addLight]);

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

      // Save 3D scene data to cloud (using the scene store's save functionality)
      const { 
        objects: sceneObjects, 
        groups: sceneGroups, 
        lights: sceneLights, 
        sceneSettings: settings, 
        cameraPerspective, 
        cameraZoom 
      } = useSceneStore.getState();

      // Here we would save the scene data - for now just the metadata save
      // The actual scene saving logic would be integrated here

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
          <p className="text-white/70 text-lg">Loading project...</p>
          <p className="text-white/50 text-sm mt-2">{projectName}</p>
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
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Project</h2>
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
          disabled={saveStatus === 'saving' || !user || !projectId || !hasContent}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl shadow-black/20 border transition-all duration-200 font-medium ${
            saveStatus === 'saving'
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-wait'
              : saveStatus === 'saved'
                ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:scale-105'
                : saveStatus === 'error'
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:scale-105'
                  : !user || !projectId || !hasContent
                    ? 'bg-gray-600/20 border-gray-600/30 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1a1a1a] border-white/5 text-white/90 hover:bg-[#2a2a2a] hover:scale-105'
          }`}
          title={
            !user
              ? 'Sign in to save'
              : !projectId
                ? 'Select a project to save'
                : !hasContent 
                  ? 'No content to save' 
                  : saveStatus === 'saving' 
                    ? 'Saving project and scene data...' 
                    : 'Save project metadata and scene data to cloud'
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

      {/* Scene Info - Below last saved */}
      {hasContent && saveStatus === 'idle' && user && projectId && (
        <div className="absolute top-32 left-4 z-40">
          <div className="bg-[#1a1a1a]/90 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60">
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
        </div>
      )}

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