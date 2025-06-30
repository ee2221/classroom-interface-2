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

// Hook for managing objects with Firestore
export const useFirestoreObjects = (userId: string | null) => {
  const [objects, setObjects] = useState<FirestoreObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setObjects([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToObjects(userId, (firestoreObjects) => {
      setObjects(firestoreObjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addObject = async (object: THREE.Object3D, name: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const firestoreData = objectToFirestore(object, name, undefined, userId);
      await saveObject(firestoreData, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add object');
      throw err;
    }
  };

  const updateObjectData = async (id: string, object: THREE.Object3D, name: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const firestoreData = objectToFirestore(object, name, id, userId);
      await updateObject(id, firestoreData, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update object');
      throw err;
    }
  };

  const removeObject = async (id: string) => {
    try {
      await deleteObject(id);
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

// Hook for managing groups with Firestore
export const useFirestoreGroups = (userId: string | null) => {
  const [groups, setGroups] = useState<FirestoreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToGroups(userId, (firestoreGroups) => {
      setGroups(firestoreGroups);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addGroup = async (groupData: Omit<FirestoreGroup, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await saveGroup({
        ...groupData,
        createdAt: undefined,
        updatedAt: undefined
      }, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add group');
      throw err;
    }
  };

  const updateGroupData = async (id: string, groupData: Partial<FirestoreGroup>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await updateGroup(id, groupData, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    }
  };

  const removeGroup = async (id: string) => {
    try {
      await deleteGroup(id);
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

// Hook for managing lights with Firestore
export const useFirestoreLights = (userId: string | null) => {
  const [lights, setLights] = useState<FirestoreLight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLights([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToLights(userId, (firestoreLights) => {
      setLights(firestoreLights);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addLight = async (lightData: Omit<FirestoreLight, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await saveLight({
        ...lightData,
        createdAt: undefined,
        updatedAt: undefined
      }, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add light');
      throw err;
    }
  };

  const updateLightData = async (id: string, lightData: Partial<FirestoreLight>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await updateLight(id, lightData, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update light');
      throw err;
    }
  };

  const removeLight = async (id: string) => {
    try {
      await deleteLight(id);
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

// Combined hook for easier integration
export const useFirestoreScene = (userId: string | null) => {
  const objectsHook = useFirestoreObjects(userId);
  const groupsHook = useFirestoreGroups(userId);
  const lightsHook = useFirestoreLights(userId);
  
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