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
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as THREE from 'three';

// Types for Firestore data - now stored within a single project document
export interface FirestoreObject {
  id?: string;
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
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  gridDivisions: number;
  cameraPerspective: string;
  cameraZoom: number;
  showLightHelpers: boolean;
  hideAllMenus: boolean;
}

// Complete project document structure
export interface ProjectDocument {
  id?: string;
  userId: string;
  name: string;
  description: string;
  thumbnail?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastOpened?: Timestamp;
  isStarred: boolean;
  color: string;
  tags: string[];
  template?: string;
  
  // Scene data stored directly in the project document
  sceneData: {
    objects: FirestoreObject[];
    groups: FirestoreGroup[];
    lights: FirestoreLight[];
    settings: FirestoreScene;
  };
}

// Helper function to convert THREE.js object to Firestore format
export const objectToFirestore = (object: THREE.Object3D, name: string, id?: string): FirestoreObject => {
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
    updatedAt: Timestamp.now()
  };

  if (id) {
    firestoreObj.id = id;
  } else {
    firestoreObj.createdAt = Timestamp.now();
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

// Create a new project document with initial scene data
export const createProject = async (
  userId: string,
  name: string,
  description: string = '',
  color: string = '#3b82f6',
  template: string = 'blank'
): Promise<string> => {
  try {
    const initialSceneData = {
      objects: [],
      groups: [],
      lights: [],
      settings: {
        backgroundColor: '#0f0f23',
        showGrid: true,
        gridSize: 10,
        gridDivisions: 10,
        cameraPerspective: 'perspective',
        cameraZoom: 1,
        showLightHelpers: true,
        hideAllMenus: false
      }
    };

    const projectData: Omit<ProjectDocument, 'id'> = {
      userId,
      name: name.trim(),
      description: description.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isStarred: false,
      color,
      tags: [template],
      template,
      sceneData: initialSceneData
    };

    const docRef = await addDoc(collection(db, 'projects'), projectData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Get a single project document
export const getProject = async (projectId: string): Promise<ProjectDocument | null> => {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ProjectDocument;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

// Update project metadata (name, description, etc.)
export const updateProjectMetadata = async (
  projectId: string,
  updates: Partial<Omit<ProjectDocument, 'id' | 'userId' | 'sceneData' | 'createdAt'>>
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project metadata:', error);
    throw error;
  }
};

// Save complete scene data to project document
export const saveSceneToProject = async (
  projectId: string,
  sceneData: {
    objects: FirestoreObject[];
    groups: FirestoreGroup[];
    lights: FirestoreLight[];
    settings: FirestoreScene;
  }
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      sceneData,
      updatedAt: serverTimestamp(),
      lastOpened: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving scene to project:', error);
    throw error;
  }
};

// Add object to project's scene data
export const addObjectToProject = async (
  projectId: string,
  objectData: FirestoreObject
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const newObject = {
      ...objectData,
      id: crypto.randomUUID(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const updatedObjects = [...project.sceneData.objects, newObject];
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.objects': updatedObjects,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding object to project:', error);
    throw error;
  }
};

// Update object in project's scene data
export const updateObjectInProject = async (
  projectId: string,
  objectId: string,
  objectData: Partial<FirestoreObject>
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedObjects = project.sceneData.objects.map(obj =>
      obj.id === objectId 
        ? { ...obj, ...objectData, updatedAt: Timestamp.now() }
        : obj
    );
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.objects': updatedObjects,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating object in project:', error);
    throw error;
  }
};

// Remove object from project's scene data
export const removeObjectFromProject = async (
  projectId: string,
  objectId: string
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedObjects = project.sceneData.objects.filter(obj => obj.id !== objectId);
    
    // Also remove from any groups
    const updatedGroups = project.sceneData.groups.map(group => ({
      ...group,
      objectIds: group.objectIds.filter(id => id !== objectId)
    }));
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.objects': updatedObjects,
      'sceneData.groups': updatedGroups,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing object from project:', error);
    throw error;
  }
};

// Add group to project's scene data
export const addGroupToProject = async (
  projectId: string,
  groupData: FirestoreGroup
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const newGroup = {
      ...groupData,
      id: crypto.randomUUID(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const updatedGroups = [...project.sceneData.groups, newGroup];
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.groups': updatedGroups,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding group to project:', error);
    throw error;
  }
};

// Update group in project's scene data
export const updateGroupInProject = async (
  projectId: string,
  groupId: string,
  groupData: Partial<FirestoreGroup>
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedGroups = project.sceneData.groups.map(group =>
      group.id === groupId 
        ? { ...group, ...groupData, updatedAt: Timestamp.now() }
        : group
    );
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.groups': updatedGroups,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating group in project:', error);
    throw error;
  }
};

// Remove group from project's scene data
export const removeGroupFromProject = async (
  projectId: string,
  groupId: string
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedGroups = project.sceneData.groups.filter(group => group.id !== groupId);
    
    // Remove groupId from objects that were in this group
    const updatedObjects = project.sceneData.objects.map(obj =>
      obj.groupId === groupId ? { ...obj, groupId: undefined } : obj
    );
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.groups': updatedGroups,
      'sceneData.objects': updatedObjects,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing group from project:', error);
    throw error;
  }
};

// Add light to project's scene data
export const addLightToProject = async (
  projectId: string,
  lightData: FirestoreLight
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const newLight = {
      ...lightData,
      id: crypto.randomUUID(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const updatedLights = [...project.sceneData.lights, newLight];
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.lights': updatedLights,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding light to project:', error);
    throw error;
  }
};

// Update light in project's scene data
export const updateLightInProject = async (
  projectId: string,
  lightId: string,
  lightData: Partial<FirestoreLight>
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedLights = project.sceneData.lights.map(light =>
      light.id === lightId 
        ? { ...light, ...lightData, updatedAt: Timestamp.now() }
        : light
    );
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.lights': updatedLights,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating light in project:', error);
    throw error;
  }
};

// Remove light from project's scene data
export const removeLightFromProject = async (
  projectId: string,
  lightId: string
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedLights = project.sceneData.lights.filter(light => light.id !== lightId);
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.lights': updatedLights,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing light from project:', error);
    throw error;
  }
};

// Update scene settings in project
export const updateSceneSettingsInProject = async (
  projectId: string,
  settings: Partial<FirestoreScene>
): Promise<void> => {
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedSettings = {
      ...project.sceneData.settings,
      ...settings
    };
    
    await updateDoc(doc(db, 'projects', projectId), {
      'sceneData.settings': updatedSettings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating scene settings in project:', error);
    throw error;
  }
};

// Get all projects for a user
export const getUserProjects = async (userId: string): Promise<ProjectDocument[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProjectDocument));
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
};

// Delete a project completely
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Real-time listener for a single project
export const subscribeToProject = (
  projectId: string, 
  callback: (project: ProjectDocument | null) => void
) => {
  const projectRef = doc(db, 'projects', projectId);
  
  return onSnapshot(projectRef, (docSnap) => {
    if (docSnap.exists()) {
      const project = {
        id: docSnap.id,
        ...docSnap.data()
      } as ProjectDocument;
      callback(project);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in project subscription:', error);
    callback(null);
  });
};

// Real-time listener for user's projects list
export const subscribeToUserProjects = (
  userId: string,
  callback: (projects: ProjectDocument[]) => void
) => {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProjectDocument));
    callback(projects);
  }, (error) => {
    console.error('Error in user projects subscription:', error);
    callback([]);
  });
};

// Legacy compatibility functions (deprecated - use project-specific functions instead)
export const saveObject = async (objectData: FirestoreObject, userId: string, projectId: string): Promise<string> => {
  console.warn('saveObject is deprecated. Use addObjectToProject instead.');
  await addObjectToProject(projectId, objectData);
  return objectData.id || '';
};

export const saveGroup = async (groupData: FirestoreGroup, userId: string, projectId: string): Promise<string> => {
  console.warn('saveGroup is deprecated. Use addGroupToProject instead.');
  await addGroupToProject(projectId, groupData);
  return groupData.id || '';
};

export const saveLight = async (lightData: FirestoreLight, userId: string, projectId: string): Promise<string> => {
  console.warn('saveLight is deprecated. Use addLightToProject instead.');
  await addLightToProject(projectId, lightData);
  return lightData.id || '';
};

export const saveScene = async (sceneData: any, userId: string, projectId: string): Promise<string> => {
  console.warn('saveScene is deprecated. Use saveSceneToProject instead.');
  // Convert old scene format to new format if needed
  const newSceneData = {
    objects: [],
    groups: [],
    lights: [],
    settings: sceneData
  };
  await saveSceneToProject(projectId, newSceneData);
  return projectId;
};