import { useState, useEffect } from 'react';
import {
  ProjectDocument,
  FirestoreObject,
  FirestoreGroup,
  FirestoreLight,
  FirestoreScene,
  subscribeToProject,
  subscribeToUserProjects,
  getProject,
  addObjectToProject,
  updateObjectInProject,
  removeObjectFromProject,
  addGroupToProject,
  updateGroupInProject,
  removeGroupFromProject,
  addLightToProject,
  updateLightInProject,
  removeLightFromProject,
  updateSceneSettingsInProject,
  saveSceneToProject,
  objectToFirestore,
  firestoreToObject
} from '../services/firestoreService';
import * as THREE from 'three';

// Hook for managing a single project document
export const useProject = (projectId: string | null) => {
  const [project, setProject] = useState<ProjectDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToProject(projectId, (projectData) => {
      setProject(projectData);
      setLoading(false);
      if (!projectData) {
        setError('Project not found');
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  // Helper functions for scene data manipulation
  const addObject = async (object: THREE.Object3D, name: string) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      const firestoreData = objectToFirestore(object, name);
      await addObjectToProject(projectId, firestoreData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add object');
      throw err;
    }
  };

  const updateObject = async (objectId: string, object: THREE.Object3D, name: string) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      const firestoreData = objectToFirestore(object, name, objectId);
      await updateObjectInProject(projectId, objectId, firestoreData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update object');
      throw err;
    }
  };

  const removeObject = async (objectId: string) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await removeObjectFromProject(projectId, objectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove object');
      throw err;
    }
  };

  const addGroup = async (groupData: Omit<FirestoreGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await addGroupToProject(projectId, groupData as FirestoreGroup);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add group');
      throw err;
    }
  };

  const updateGroup = async (groupId: string, groupData: Partial<FirestoreGroup>) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await updateGroupInProject(projectId, groupId, groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    }
  };

  const removeGroup = async (groupId: string) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await removeGroupFromProject(projectId, groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove group');
      throw err;
    }
  };

  const addLight = async (lightData: Omit<FirestoreLight, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await addLightToProject(projectId, lightData as FirestoreLight);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add light');
      throw err;
    }
  };

  const updateLight = async (lightId: string, lightData: Partial<FirestoreLight>) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await updateLightInProject(projectId, lightId, lightData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update light');
      throw err;
    }
  };

  const removeLight = async (lightId: string) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await removeLightFromProject(projectId, lightId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove light');
      throw err;
    }
  };

  const updateSceneSettings = async (settings: Partial<FirestoreScene>) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await updateSceneSettingsInProject(projectId, settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scene settings');
      throw err;
    }
  };

  const saveCompleteScene = async (sceneData: {
    objects: FirestoreObject[];
    groups: FirestoreGroup[];
    lights: FirestoreLight[];
    settings: FirestoreScene;
  }) => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      await saveSceneToProject(projectId, sceneData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scene');
      throw err;
    }
  };

  return {
    project,
    loading,
    error,
    
    // Scene data accessors
    objects: project?.sceneData?.objects || [],
    groups: project?.sceneData?.groups || [],
    lights: project?.sceneData?.lights || [],
    sceneSettings: project?.sceneData?.settings || {
      backgroundColor: '#0f0f23',
      showGrid: true,
      gridSize: 10,
      gridDivisions: 10,
      cameraPerspective: 'perspective',
      cameraZoom: 1,
      showLightHelpers: true,
      hideAllMenus: false
    },
    
    // Scene manipulation functions
    addObject,
    updateObject,
    removeObject,
    addGroup,
    updateGroup,
    removeGroup,
    addLight,
    updateLight,
    removeLight,
    updateSceneSettings,
    saveCompleteScene
  };
};

// Hook for managing user's projects list
export const useUserProjects = (userId: string | null) => {
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserProjects(userId, (projectsData) => {
      setProjects(projectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    projects,
    loading,
    error
  };
};

// Hook for converting Firestore objects to THREE.js objects
export const useThreeObjects = (firestoreObjects: FirestoreObject[]) => {
  const [threeObjects, setThreeObjects] = useState<Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
  }>>([]);

  useEffect(() => {
    const convertedObjects = firestoreObjects.map(firestoreObj => {
      const threeObject = firestoreToObject(firestoreObj);
      if (threeObject && firestoreObj.id) {
        return {
          id: firestoreObj.id,
          object: threeObject,
          name: firestoreObj.name,
          visible: firestoreObj.visible,
          locked: firestoreObj.locked,
          groupId: firestoreObj.groupId
        };
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

    setThreeObjects(convertedObjects);
  }, [firestoreObjects]);

  return threeObjects;
};

// Legacy compatibility hook (deprecated)
export const useFirestoreScene = (userId: string | null, projectId: string | null) => {
  console.warn('useFirestoreScene is deprecated. Use useProject instead.');
  
  const projectHook = useProject(projectId);
  const threeObjects = useThreeObjects(projectHook.objects);

  return {
    // Objects
    objects: threeObjects,
    firestoreObjects: projectHook.objects,
    addObject: projectHook.addObject,
    updateObject: projectHook.updateObject,
    removeObject: projectHook.removeObject,
    
    // Groups
    groups: projectHook.groups,
    addGroup: projectHook.addGroup,
    updateGroup: projectHook.updateGroup,
    removeGroup: projectHook.removeGroup,
    
    // Lights
    lights: projectHook.lights,
    addLight: projectHook.addLight,
    updateLight: projectHook.updateLight,
    removeLight: projectHook.removeLight,
    
    // Status
    loading: projectHook.loading,
    error: projectHook.error
  };
};