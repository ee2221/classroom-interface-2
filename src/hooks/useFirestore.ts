import { useState, useEffect } from 'react';
import {
  FirestoreObject,
  FirestoreGroup,
  FirestoreLight,
  FirestoreScene,
  subscribeToObjects,
  subscribeToGroups,
  subscribeToLights,
  saveObject,
  updateObject,
  deleteObject,
  saveGroup,
  updateGroup,
  deleteGroup,
  saveLight,
  updateLight,
  deleteLight,
  objectToFirestore,
  firestoreToObject
} from '../services/firestoreService';
import * as THREE from 'three';

// Hook for managing objects with Firestore (project-scoped)
export const useFirestoreObjects = (userId: string | null, projectId: string | null) => {
  const [objects, setObjects] = useState<FirestoreObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !projectId) {
      setObjects([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToObjects(userId, projectId, (firestoreObjects) => {
      setObjects(firestoreObjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, projectId]);

  const addObject = async (object: THREE.Object3D, name: string) => {
    if (!userId || !projectId) throw new Error('User not authenticated or project not selected');
    
    try {
      const firestoreData = objectToFirestore(object, name, undefined, userId, projectId);
      await saveObject(firestoreData, userId, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add object');
      throw err;
    }
  };

  const updateObjectData = async (id: string, object: THREE.Object3D, name: string) => {
    if (!userId || !projectId) throw new Error('User not authenticated or project not selected');
    
    try {
      const firestoreData = objectToFirestore(object, name, id, userId, projectId);
      await updateObject(id, firestoreData, userId, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update object');
      throw err;
    }
  };

  const removeObject = async (id: string) => {
    if (!projectId) throw new Error('Project not selected');
    
    try {
      await deleteObject(id, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove object');
      throw err;
    }
  };

  return {
    objects,
    loading,
    error,
    addObject,
    updateObject: updateObjectData,
    removeObject
  };
};

// Hook for managing groups with Firestore (project-scoped)
export const useFirestoreGroups = (userId: string | null, projectId: string | null) => {
  const [groups, setGroups] = useState<FirestoreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !projectId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToGroups(userId, projectId, (firestoreGroups) => {
      setGroups(firestoreGroups);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, projectId]);

  const addGroup = async (groupData: Omit<FirestoreGroup, 'id' | 'userId' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId || !projectId) throw new Error('User not authenticated or project not selected');
    
    try {
      await saveGroup({
        ...groupData,
        createdAt: undefined,
        updatedAt: undefined
      }, userId, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add group');
      throw err;
    }
  };

  const updateGroupData = async (id: string, groupData: Partial<FirestoreGroup>) => {
    if (!userId || !projectId) throw new Error('User not authenticated or project not selected');
    
    try {
      await updateGroup(id, groupData, userId, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    }
  };

  const removeGroup = async (id: string) => {
    if (!projectId) throw new Error('Project not selected');
    
    try {
      await deleteGroup(id, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove group');
      throw err;
    }
  };

  return {
    groups,
    loading,
    error,
    addGroup,
    updateGroup: updateGroupData,
    removeGroup
  };
};

// Hook for managing lights with Firestore (project-scoped)
export const useFirestoreLights = (userId: string | null, projectId: string | null) => {
  const [lights, setLights] = useState<FirestoreLight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !projectId) {
      setLights([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToLights(userId, projectId, (firestoreLights) => {
      setLights(firestoreLights);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, projectId]);

  const addLight = async (lightData: Omit<FirestoreLight, 'id' | 'userId' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId || !projectId) throw new Error('User not authenticated or project not selected');
    
    try {
      await saveLight({
        ...lightData,
        createdAt: undefined,
        updatedAt: undefined
      }, userId, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add light');
      throw err;
    }
  };

  const updateLightData = async (id: string, lightData: Partial<FirestoreLight>) => {
    if (!userId || !projectId) throw new Error('User not authenticated or project not selected');
    
    try {
      await updateLight(id, lightData, userId, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update light');
      throw err;
    }
  };

  const removeLight = async (id: string) => {
    if (!projectId) throw new Error('Project not selected');
    
    try {
      await deleteLight(id, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove light');
      throw err;
    }
  };

  return {
    lights,
    loading,
    error,
    addLight,
    updateLight: updateLightData,
    removeLight
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

// Combined hook for easier integration (project-scoped)
export const useFirestoreScene = (userId: string | null, projectId: string | null) => {
  const objectsHook = useFirestoreObjects(userId, projectId);
  const groupsHook = useFirestoreGroups(userId, projectId);
  const lightsHook = useFirestoreLights(userId, projectId);
  
  const threeObjects = useThreeObjects(objectsHook.objects);

  const loading = objectsHook.loading || groupsHook.loading || lightsHook.loading;
  const error = objectsHook.error || groupsHook.error || lightsHook.error;

  return {
    // Objects
    objects: threeObjects,
    firestoreObjects: objectsHook.objects,
    addObject: objectsHook.addObject,
    updateObject: objectsHook.updateObject,
    removeObject: objectsHook.removeObject,
    
    // Groups
    groups: groupsHook.groups,
    addGroup: groupsHook.addGroup,
    updateGroup: groupsHook.updateGroup,
    removeGroup: groupsHook.removeGroup,
    
    // Lights
    lights: lightsHook.lights,
    addLight: lightsHook.addLight,
    updateLight: lightsHook.updateLight,
    removeLight: lightsHook.removeLight,
    
    // Status
    loading,
    error
  };
};