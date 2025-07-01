import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as THREE from 'three';

// Types for Firestore data
export interface FirestoreObject {
  id?: string;
  userId?: string;
  projectId?: string; // Keep for compatibility but make optional
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  groupId?: string;
  geometryParams?: any;
  materialParams?: any;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreGroup {
  id?: string;
  userId?: string;
  projectId?: string; // Keep for compatibility but make optional
  name: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  objectIds: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreLight {
  id?: string;
  userId?: string;
  projectId?: string; // Keep for compatibility but make optional
  name: string;
  type: 'directional' | 'point' | 'spot';
  position: number[];
  target: number[];
  intensity: number;
  color: string;
  visible: boolean;
  castShadow: boolean;
  distance: number;
  decay: number;
  angle: number;
  penumbra: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreScene {
  id?: string;
  userId?: string;
  projectId?: string; // Keep for compatibility but make optional
  name: string;
  description?: string;
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  gridDivisions: number;
  cameraPerspective: string;
  cameraZoom: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection names - now shared across all projects for a user
const getSharedCollectionName = (type: string) => `shared_${type}`;

// Helper function to convert THREE.js object to Firestore format
export const objectToFirestore = (object: THREE.Object3D, name: string, id?: string, userId?: string, projectId?: string): FirestoreObject => {
  const firestoreObj: FirestoreObject = {
    name,
    type: object.type,
    position: {
      x: object.position.x,
      y: object.position.y,
      z: object.position.z
    },
    rotation: {
      x: object.rotation.x,
      y: object.rotation.y,
      z: object.rotation.z
    },
    scale: {
      x: object.scale.x,
      y: object.scale.y,
      z: object.scale.z
    },
    color: '#44aa88', // Default color
    opacity: 1,
    visible: object.visible,
    locked: false,
    updatedAt: serverTimestamp()
  };

  // Add userId if provided (required for shared access)
  if (userId) {
    firestoreObj.userId = userId;
  }
  // Keep projectId for compatibility but it's not used for filtering
  if (projectId) {
    firestoreObj.projectId = projectId;
  }

  if (id) {
    firestoreObj.id = id;
  } else {
    firestoreObj.createdAt = serverTimestamp();
  }

  // Extract material properties if it's a mesh
  if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
    firestoreObj.color = '#' + object.material.color.getHexString();
    firestoreObj.opacity = object.material.opacity;
    
    firestoreObj.materialParams = {
      transparent: object.material.transparent,
      metalness: object.material.metalness,
      roughness: object.material.roughness
    };
  }

  // Extract geometry parameters with default values to prevent undefined
  if (object instanceof THREE.Mesh) {
    const geometry = object.geometry;
    if (geometry instanceof THREE.BoxGeometry) {
      firestoreObj.geometryParams = {
        width: geometry.parameters.width ?? 1,
        height: geometry.parameters.height ?? 1,
        depth: geometry.parameters.depth ?? 1
      };
    } else if (geometry instanceof THREE.SphereGeometry) {
      firestoreObj.geometryParams = {
        radius: geometry.parameters.radius ?? 0.5,
        widthSegments: geometry.parameters.widthSegments ?? 32,
        heightSegments: geometry.parameters.heightSegments ?? 16
      };
    } else if (geometry instanceof THREE.CylinderGeometry) {
      firestoreObj.geometryParams = {
        radiusTop: geometry.parameters.radiusTop ?? 0.5,
        radiusBottom: geometry.parameters.radiusBottom ?? 0.5,
        height: geometry.parameters.height ?? 1,
        radialSegments: geometry.parameters.radialSegments ?? 32
      };
    } else if (geometry instanceof THREE.ConeGeometry) {
      firestoreObj.geometryParams = {
        radius: geometry.parameters.radius ?? 0.5,
        height: geometry.parameters.height ?? 1,
        radialSegments: geometry.parameters.radialSegments ?? 32
      };
    }
  }

  return firestoreObj;
};

// Helper function to convert Firestore data back to THREE.js object
export const firestoreToObject = (data: FirestoreObject): THREE.Object3D | null => {
  let object: THREE.Object3D | null = null;

  // Create geometry based on type and parameters
  if (data.type === 'Mesh' && data.geometryParams) {
    let geometry: THREE.BufferGeometry;
    
    if (data.geometryParams.width !== undefined) {
      // Box geometry
      geometry = new THREE.BoxGeometry(
        data.geometryParams.width,
        data.geometryParams.height,
        data.geometryParams.depth
      );
    } else if (data.geometryParams.radius !== undefined && data.geometryParams.widthSegments !== undefined) {
      // Sphere geometry
      geometry = new THREE.SphereGeometry(
        data.geometryParams.radius,
        data.geometryParams.widthSegments,
        data.geometryParams.heightSegments
      );
    } else if (data.geometryParams.radiusTop !== undefined) {
      // Cylinder geometry
      geometry = new THREE.CylinderGeometry(
        data.geometryParams.radiusTop,
        data.geometryParams.radiusBottom,
        data.geometryParams.height,
        data.geometryParams.radialSegments
      );
    } else if (data.geometryParams.radius !== undefined && data.geometryParams.radialSegments !== undefined) {
      // Cone geometry
      geometry = new THREE.ConeGeometry(
        data.geometryParams.radius,
        data.geometryParams.height,
        data.geometryParams.radialSegments
      );
    } else {
      // Default to box
      geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      transparent: data.opacity < 1,
      opacity: data.opacity,
      ...data.materialParams
    });

    object = new THREE.Mesh(geometry, material);
  }

  if (object) {
    // Set transform properties
    object.position.set(data.position.x, data.position.y, data.position.z);
    object.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    object.scale.set(data.scale.x, data.scale.y, data.scale.z);
    object.visible = data.visible;
  }

  return object;
};

// Object CRUD operations with shared database access
export const saveObject = async (objectData: FirestoreObject, userId: string, projectId?: string): Promise<string> => {
  try {
    const dataWithIds = { ...objectData, userId };
    // Keep projectId for compatibility but use shared collection
    if (projectId) {
      dataWithIds.projectId = projectId;
    }
    const collectionName = getSharedCollectionName('objects');
    const docRef = await addDoc(collection(db, collectionName), dataWithIds);
    return docRef.id;
  } catch (error) {
    console.error('Error saving object:', error);
    throw error;
  }
};

export const updateObject = async (id: string, objectData: Partial<FirestoreObject>, userId: string, projectId?: string): Promise<void> => {
  try {
    const collectionName = getSharedCollectionName('objects');
    const objectRef = doc(db, collectionName, id);
    const updateData: any = {
      ...objectData,
      userId,
      updatedAt: serverTimestamp()
    };
    if (projectId) {
      updateData.projectId = projectId;
    }
    await updateDoc(objectRef, updateData);
  } catch (error) {
    console.error('Error updating object:', error);
    throw error;
  }
};

export const deleteObject = async (id: string, projectId?: string): Promise<void> => {
  try {
    const collectionName = getSharedCollectionName('objects');
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
};

export const getObjects = async (userId: string, projectId?: string): Promise<FirestoreObject[]> => {
  try {
    const collectionName = getSharedCollectionName('objects');
    // Only filter by userId - remove orderBy to avoid index requirement
    const q = query(
      collection(db, collectionName), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const objects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreObject));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    objects.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    return objects;
  } catch (error) {
    console.error('Error getting objects:', error);
    throw error;
  }
};

export const getObject = async (id: string, projectId?: string): Promise<FirestoreObject | null> => {
  try {
    const collectionName = getSharedCollectionName('objects');
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as FirestoreObject;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting object:', error);
    throw error;
  }
};

// Group CRUD operations with shared database access
export const saveGroup = async (groupData: FirestoreGroup, userId: string, projectId?: string): Promise<string> => {
  try {
    const dataWithIds = { ...groupData, userId };
    if (projectId) {
      dataWithIds.projectId = projectId;
    }
    const collectionName = getSharedCollectionName('groups');
    const docRef = await addDoc(collection(db, collectionName), dataWithIds);
    return docRef.id;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
};

export const updateGroup = async (id: string, groupData: Partial<FirestoreGroup>, userId: string, projectId?: string): Promise<void> => {
  try {
    const collectionName = getSharedCollectionName('groups');
    const groupRef = doc(db, collectionName, id);
    const updateData: any = {
      ...groupData,
      userId,
      updatedAt: serverTimestamp()
    };
    if (projectId) {
      updateData.projectId = projectId;
    }
    await updateDoc(groupRef, updateData);
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

export const deleteGroup = async (id: string, projectId?: string): Promise<void> => {
  try {
    const collectionName = getSharedCollectionName('groups');
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

export const getGroups = async (userId: string, projectId?: string): Promise<FirestoreGroup[]> => {
  try {
    const collectionName = getSharedCollectionName('groups');
    // Only filter by userId - remove orderBy to avoid index requirement
    const q = query(
      collection(db, collectionName), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const groups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreGroup));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    groups.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    return groups;
  } catch (error) {
    console.error('Error getting groups:', error);
    throw error;
  }
};

// Light CRUD operations with shared database access
export const saveLight = async (lightData: FirestoreLight, userId: string, projectId?: string): Promise<string> => {
  try {
    const dataWithIds = { ...lightData, userId };
    if (projectId) {
      dataWithIds.projectId = projectId;
    }
    const collectionName = getSharedCollectionName('lights');
    const docRef = await addDoc(collection(db, collectionName), dataWithIds);
    return docRef.id;
  } catch (error) {
    console.error('Error saving light:', error);
    throw error;
  }
};

export const updateLight = async (id: string, lightData: Partial<FirestoreLight>, userId: string, projectId?: string): Promise<void> => {
  try {
    const collectionName = getSharedCollectionName('lights');
    const lightRef = doc(db, collectionName, id);
    const updateData: any = {
      ...lightData,
      userId,
      updatedAt: serverTimestamp()
    };
    if (projectId) {
      updateData.projectId = projectId;
    }
    await updateDoc(lightRef, updateData);
  } catch (error) {
    console.error('Error updating light:', error);
    throw error;
  }
};

export const deleteLight = async (id: string, projectId?: string): Promise<void> => {
  try {
    const collectionName = getSharedCollectionName('lights');
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error('Error deleting light:', error);
    throw error;
  }
};

export const getLights = async (userId: string, projectId?: string): Promise<FirestoreLight[]> => {
  try {
    const collectionName = getSharedCollectionName('lights');
    // Only filter by userId - remove orderBy to avoid index requirement
    const q = query(
      collection(db, collectionName), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const lights = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreLight));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    lights.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    return lights;
  } catch (error) {
    console.error('Error getting lights:', error);
    throw error;
  }
};

// Scene CRUD operations with shared database access
export const saveScene = async (sceneData: FirestoreScene, userId: string, projectId?: string): Promise<string> => {
  try {
    const dataWithIds = { ...sceneData, userId };
    if (projectId) {
      dataWithIds.projectId = projectId;
    }
    const collectionName = getSharedCollectionName('scenes');
    const docRef = await addDoc(collection(db, collectionName), dataWithIds);
    return docRef.id;
  } catch (error) {
    console.error('Error saving scene:', error);
    throw error;
  }
};

export const updateScene = async (id: string, sceneData: Partial<FirestoreScene>, userId: string, projectId?: string): Promise<void> => {
  try {
    const collectionName = getSharedCollectionName('scenes');
    const sceneRef = doc(db, collectionName, id);
    const updateData: any = {
      ...sceneData,
      userId,
      updatedAt: serverTimestamp()
    };
    if (projectId) {
      updateData.projectId = projectId;
    }
    await updateDoc(sceneRef, updateData);
  } catch (error) {
    console.error('Error updating scene:', error);
    throw error;
  }
};

export const getScenes = async (userId: string, projectId?: string): Promise<FirestoreScene[]> => {
  try {
    const collectionName = getSharedCollectionName('scenes');
    // Only filter by userId - remove orderBy to avoid index requirement
    const q = query(
      collection(db, collectionName), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const scenes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreScene));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    scenes.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    return scenes;
  } catch (error) {
    console.error('Error getting scenes:', error);
    throw error;
  }
};

// Real-time listeners with shared database access
export const subscribeToObjects = (userId: string, projectId: string, callback: (objects: FirestoreObject[]) => void) => {
  const collectionName = getSharedCollectionName('objects');
  // Only filter by userId for shared access - remove orderBy to avoid index requirement
  const q = query(
    collection(db, collectionName), 
    where('userId', '==', userId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const objects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreObject));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    objects.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    callback(objects);
  });
};

export const subscribeToGroups = (userId: string, projectId: string, callback: (groups: FirestoreGroup[]) => void) => {
  const collectionName = getSharedCollectionName('groups');
  // Only filter by userId for shared access - remove orderBy to avoid index requirement
  const q = query(
    collection(db, collectionName), 
    where('userId', '==', userId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const groups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreGroup));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    groups.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    callback(groups);
  });
};

export const subscribeToLights = (userId: string, projectId: string, callback: (lights: FirestoreLight[]) => void) => {
  const collectionName = getSharedCollectionName('lights');
  // Only filter by userId for shared access - remove orderBy to avoid index requirement
  const q = query(
    collection(db, collectionName), 
    where('userId', '==', userId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const lights = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreLight));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    lights.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    callback(lights);
  });
};

export const subscribeToScenes = (userId: string, projectId: string, callback: (scenes: FirestoreScene[]) => void) => {
  const collectionName = getSharedCollectionName('scenes');
  // Only filter by userId for shared access - remove orderBy to avoid index requirement
  const q = query(
    collection(db, collectionName), 
    where('userId', '==', userId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const scenes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreScene));
    
    // Sort in memory by createdAt if available, otherwise by document ID
    scenes.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return (b.id || '').localeCompare(a.id || '');
    });
    
    callback(scenes);
  });
};

// Batch operations for better performance
export const saveObjectsBatch = async (objects: FirestoreObject[], userId: string, projectId?: string): Promise<void> => {
  try {
    const batch = [];
    for (const obj of objects) {
      batch.push(saveObject(obj, userId, projectId));
    }
    await Promise.all(batch);
  } catch (error) {
    console.error('Error saving objects batch:', error);
    throw error;
  }
};

export const deleteObjectsBatch = async (ids: string[], projectId?: string): Promise<void> => {
  try {
    const batch = [];
    for (const id of ids) {
      batch.push(deleteObject(id, projectId));
    }
    await Promise.all(batch);
  } catch (error) {
    console.error('Error deleting objects batch:', error);
    throw error;
  }
};

// User data cleanup function - deletes all user data across shared collections
export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    const collections = ['objects', 'groups', 'lights', 'scenes'];
    const deletePromises = [];

    for (const collectionType of collections) {
      const collectionName = getSharedCollectionName(collectionType);
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.docs.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
      });
    }

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
};