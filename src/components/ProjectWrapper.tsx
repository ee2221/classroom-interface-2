import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Cloud, AlertCircle, Loader2 } from 'lucide-react';
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
import { useProject } from '../hooks/useFirestore';
import { 
  updateProjectMetadata,
  saveSceneToProject,
  objectToFirestore
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
  const { sceneSettings, objects, groups, lights, resetScene, loadSceneFromProject } = useSceneStore();
  const { project, loading, error } = useProject(projectId);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasLoadedProject, setHasLoadedProject] = useState(false);

  // Load project data into scene store when project loads (only once)
  useEffect(() => {
    if (project && project.sceneData && !hasLoadedProject) {
      console.log('Loading project data into scene:', {
        objects: project.sceneData.objects?.length || 0,
        groups: project.sceneData.groups?.length || 0,
        lights: project.sceneData.lights?.length || 0
      });
      
      // Load scene data into the store
      loadSceneFromProject(project.sceneData);
      setHasLoadedProject(true);
    }
  }, [project, hasLoadedProject, loadSceneFromProject]);

  // Reset scene when project ID changes (switching projects)
  useEffect(() => {
    console.log('Project ID changed, resetting scene for:', projectId);
    resetScene();
    setHasLoadedProject(false);
    setLastSaved(null);
    setSaveStatus('idle');
  }, [projectId, resetScene]);

  const handleUnifiedSave = async () => {
    if (!projectId || !user || saveStatus === 'saving') return;

    try {
      setSaveStatus('saving');
      console.log('Saving scene data:', {
        objects: objects.length,
        groups: groups.length,
        lights: lights.length
      });
      
      // Update project metadata
      await updateProjectMetadata(projectId, {
        lastOpened: new Date() as any
      });

      // Convert current scene state to Firestore format
      const sceneData = {
        objects: objects.map(obj => {
          const firestoreObj = objectToFirestore(obj.object, obj.name, obj.id);
          // Preserve additional properties
          firestoreObj.visible = obj.visible;
          firestoreObj.locked = obj.locked;
          if (obj.groupId) {
            firestoreObj.groupId = obj.groupId;
          }
          return firestoreObj;
        }),
        groups: groups.map(group => ({
          id: group.id,
          name: group.name,
          expanded: group.expanded,
          visible: group.visible,
          locked: group.locked,
          objectIds: group.objectIds
        })),
        lights: lights.map(light => ({
          id: light.id,
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
        })),
        settings: {
          backgroundColor: sceneSettings.backgroundColor,
          showGrid: sceneSettings.showGrid,
          gridSize: sceneSettings.gridSize,
          gridDivisions: sceneSettings.gridDivisions,
          cameraPerspective: useSceneStore.getState().cameraPerspective,
          cameraZoom: useSceneStore.getState().cameraZoom,
          showLightHelpers: sceneSettings.showLightHelpers,
          hideAllMenus: sceneSettings.hideAllMenus
        }
      };

      console.log('Saving scene data to project:', sceneData);
      await saveSceneToProject(projectId, sceneData);

      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Mark as saved in the scene store
      useSceneStore.getState().markSaved();
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Auto-save functionality - only save metadata, not scene data
  useEffect(() => {
    const autoSave = async () => {
      if (!projectId || !user || saveStatus === 'saving') return;

      try {
        // Only update last opened timestamp for auto-save
        await updateProjectMetadata(projectId, {
          lastOpened: new Date() as any
        });
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    };

    // Auto-save metadata every 60 seconds
    const interval = setInterval(() => {
      if (hasLoadedProject) {
        autoSave();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [projectId, user, hasLoadedProject, saveStatus]);

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

  if (loading) {
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

  if (error) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Project</h2>
          <p className="text-red-400 mb-4">{error}</p>
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
      {/* Top Left Button Bar - Horizontal Layout */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        {/* Unified Save Button */}
        <button
          onClick={handleUnifiedSave}
          disabled={saveStatus === 'saving' || !user || !projectId || !hasLoadedProject}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl shadow-black/20 border transition-all duration-200 font-medium ${
            saveStatus === 'saving'
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-wait'
              : saveStatus === 'saved'
                ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:scale-105'
                : saveStatus === 'error'
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:scale-105'
                  : !user || !projectId || !hasLoadedProject
                    ? 'bg-gray-600/20 border-gray-600/30 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1a1a1a] border-white/5 text-white/90 hover:bg-[#2a2a2a] hover:scale-105'
          }`}
          title={
            !user
              ? 'Sign in to save'
              : !projectId
                ? 'Select a project to save'
                : !hasLoadedProject
                  ? 'Loading project...'
                  : saveStatus === 'saving' 
                    ? 'Saving project and scene data...' 
                    : 'Save project metadata and scene data'
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
      {hasContent && saveStatus === 'idle' && user && projectId && hasLoadedProject && (
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

      {/* Loading indicator for project data */}
      {!hasLoadedProject && !loading && (
        <div className="absolute top-32 left-4 z-40">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span>Loading scene data...</span>
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