import React, { useState } from 'react';
import { Save, Cloud, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
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

interface SaveButtonProps {
  user: any;
}

const SaveButton: React.FC<SaveButtonProps> = ({ user }) => {
  const { 
    objects, 
    groups, 
    lights, 
    sceneSettings, 
    cameraPerspective, 
    cameraZoom 
  } = useSceneStore();
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    if (!user) {
      setSaveStatus('error');
      setSaveMessage('Please sign in to save');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('Saving to cloud...');

    try {
      // Save all objects
      const objectPromises = objects.map(async (obj) => {
        const firestoreData = objectToFirestore(obj.object, obj.name, undefined, user.uid);
        firestoreData.visible = obj.visible;
        firestoreData.locked = obj.locked;
        // Only add groupId if it's defined
        if (obj.groupId !== undefined) {
          firestoreData.groupId = obj.groupId;
        }
        return await saveObject(firestoreData, user.uid);
      });

      // Save all groups
      const groupPromises = groups.map(async (group) => {
        const firestoreGroup: FirestoreGroup = {
          name: group.name,
          expanded: group.expanded,
          visible: group.visible,
          locked: group.locked,
          objectIds: group.objectIds
        };
        return await saveGroup(firestoreGroup, user.uid);
      });

      // Save all lights
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
        return await saveLight(firestoreLight, user.uid);
      });

      // Save scene settings
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
      const scenePromise = saveScene(sceneData, user.uid);

      // Wait for all saves to complete
      await Promise.all([
        ...objectPromises,
        ...groupPromises,
        ...lightPromises,
        scenePromise
      ]);

      setSaveStatus('success');
      setSaveMessage(`Saved ${objects.length} objects, ${groups.length} groups, ${lights.length} lights`);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save to cloud');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </>
        );
      case 'success':
        return (
          <>
            <Check className="w-5 h-5 text-green-400" />
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
            <span className="text-sm font-medium">Save to Cloud</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl shadow-black/20 border transition-all duration-200 font-medium";
    
    switch (saveStatus) {
      case 'saving':
        return `${baseStyles} bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-wait`;
      case 'success':
        return `${baseStyles} bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:scale-105 active:scale-95`;
      case 'error':
        return `${baseStyles} bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:scale-105 active:scale-95`;
      default:
        return `${baseStyles} bg-[#1a1a1a] border-white/5 text-white/90 hover:bg-[#2a2a2a] hover:scale-105 active:scale-95`;
    }
  };

  const isDisabled = saveStatus === 'saving' || !user;
  const hasContent = objects.length > 0 || groups.length > 0 || lights.length > 0;

  return (
    <div className="relative">
      <div className="flex flex-col items-start gap-2">
        <button
          onClick={handleSave}
          disabled={isDisabled || !hasContent}
          className={getButtonStyles()}
          title={
            !user
              ? 'Sign in to save'
              : !hasContent 
                ? 'No content to save' 
                : saveStatus === 'saving' 
                  ? 'Saving to Firebase...' 
                  : 'Save current scene to Firebase'
          }
        >
          {getButtonContent()}
        </button>
        
        {/* Status Message */}
        {saveMessage && (
          <div className={`px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
            saveStatus === 'success' 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : saveStatus === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
          }`}>
            {saveMessage}
          </div>
        )}
        
        {/* Scene Info */}
        {hasContent && saveStatus === 'idle' && user && (
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
        )}
      </div>
    </div>
  );
};

export default SaveButton;