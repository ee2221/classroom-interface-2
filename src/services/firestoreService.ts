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
  // Enhanced geometry data for complex shapes
  geometryData?: {
    type: string;
    vertices?: number[];
    indices?: number[];
    normals?: number[];
    uvs?: number[];
    parameters?: any;
  };
  // For group objects (like trees, hearts, etc.)
  children?: FirestoreObject[];
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

// Helper function to serialize THREE.Shape objects
const serializeShape = (shape: THREE.Shape): any => {
  try {
    // Use THREE.js built-in toJSON method if available
    if (typeof shape.toJSON === 'function') {
      return shape.toJSON();
    }
    
    // Fallback: extract basic shape data
    return {
      type: 'Shape',
      curves: shape.curves?.map(curve => {
        if (typeof curve.toJSON === 'function') {
          return curve.toJSON();
        }
        return { type: curve.type || 'UnknownCurve' };
      }) || [],
      holes: shape.holes?.map(hole => serializeShape(hole)) || []
    };
  } catch (error) {
    console.warn('Failed to serialize Shape object:', error);
    return { type: 'Shape', serialized: false };
  }
};

// Helper function to deserialize THREE.Shape objects
const deserializeShape = (shapeData: any): THREE.Shape => {
  try {
    // If it's a proper JSON representation, use THREE.js loader
    if (shapeData.curves && Array.isArray(shapeData.curves)) {
      const shape = new THREE.Shape();
      // Basic shape reconstruction - this is a simplified approach
      // For complex shapes, you might need more sophisticated deserialization
      return shape;
    }
    
    // Fallback: return empty shape
    return new THREE.Shape();
  } catch (error) {
    console.warn('Failed to deserialize Shape object:', error);
    return new THREE.Shape();
  }
};

// Helper function to serialize geometry parameters, handling THREE.Shape objects
const serializeGeometryParameters = (parameters: any): any => {
  if (!parameters) return parameters;
  
  const serialized = { ...parameters };
  
  // Handle shapes array in ShapeGeometry
  if (serialized.shapes && Array.isArray(serialized.shapes)) {
    serialized.shapes = serialized.shapes.map((shape: any) => {
      if (shape instanceof THREE.Shape) {
        return serializeShape(shape);
      }
      return shape;
    });
  }
  
  // Handle single shape in ShapeGeometry
  if (serialized.shape && serialized.shape instanceof THREE.Shape) {
    serialized.shape = serializeShape(serialized.shape);
  }
  
  return serialized;
};

// Helper function to deserialize geometry parameters, handling serialized Shape objects
const deserializeGeometryParameters = (parameters: any): any => {
  if (!parameters) return parameters;
  
  const deserialized = { ...parameters };
  
  // Handle shapes array in ShapeGeometry
  if (deserialized.shapes && Array.isArray(deserialized.shapes)) {
    deserialized.shapes = deserialized.shapes.map((shapeData: any) => {
      if (shapeData && typeof shapeData === 'object' && shapeData.type === 'Shape') {
        return deserializeShape(shapeData);
      }
      return shapeData;
    });
  }
  
  // Handle single shape in ShapeGeometry
  if (deserialized.shape && typeof deserialized.shape === 'object' && deserialized.shape.type === 'Shape') {
    deserialized.shape = deserializeShape(deserialized.shape);
  }
  
  return deserialized;
};

// Enhanced helper function to serialize geometry data
const serializeGeometry = (geometry: THREE.BufferGeometry): any => {
  const geometryData: any = {
    type: geometry.type
  };

  // Store vertex positions
  if (geometry.attributes.position) {
    geometryData.vertices = Array.from(geometry.attributes.position.array);
  }

  // Store indices if present
  if (geometry.index) {
    geometryData.indices = Array.from(geometry.index.array);
  }

  // Store normals if present
  if (geometry.attributes.normal) {
    geometryData.normals = Array.from(geometry.attributes.normal.array);
  }

  // Store UVs if present
  if (geometry.attributes.uv) {
    geometryData.uvs = Array.from(geometry.attributes.uv.array);
  }

  // Store geometry parameters for primitive shapes, handling THREE.Shape objects
  if ('parameters' in geometry) {
    geometryData.parameters = serializeGeometryParameters(geometry.parameters);
  }

  return geometryData;
};

// Enhanced helper function to deserialize geometry data
const deserializeGeometry = (geometryData: any): THREE.BufferGeometry => {
  let geometry: THREE.BufferGeometry;

  // Try to recreate primitive geometries first
  if (geometryData.parameters) {
    const params = deserializeGeometryParameters(geometryData.parameters);
    
    switch (geometryData.type) {
      case 'BoxGeometry':
        geometry = new THREE.BoxGeometry(
          params.width || 1,
          params.height || 1,
          params.depth || 1
        );
        break;
      case 'SphereGeometry':
        geometry = new THREE.SphereGeometry(
          params.radius || 0.5,
          params.widthSegments || 32,
          params.heightSegments || 16
        );
        break;
      case 'CylinderGeometry':
        geometry = new THREE.CylinderGeometry(
          params.radiusTop || 0.5,
          params.radiusBottom || 0.5,
          params.height || 1,
          params.radialSegments || 32
        );
        break;
      case 'ConeGeometry':
        geometry = new THREE.ConeGeometry(
          params.radius || 0.5,
          params.height || 1,
          params.radialSegments || 32
        );
        break;
      case 'PlaneGeometry':
        geometry = new THREE.PlaneGeometry(
          params.width || 1,
          params.height || 1,
          params.widthSegments || 1,
          params.heightSegments || 1
        );
        break;
      case 'TorusGeometry':
        geometry = new THREE.TorusGeometry(
          params.radius || 1,
          params.tube || 0.4,
          params.radialSegments || 8,
          params.tubularSegments || 6
        );
        break;
      case 'ShapeGeometry':
        // Handle ShapeGeometry with deserialized shapes
        if (params.shapes && Array.isArray(params.shapes)) {
          geometry = new THREE.ShapeGeometry(params.shapes, params.curveSegments || 12);
        } else if (params.shape) {
          geometry = new THREE.ShapeGeometry(params.shape, params.curveSegments || 12);
        } else {
          // Fallback to a simple shape
          const fallbackShape = new THREE.Shape();
          fallbackShape.moveTo(0, 0);
          fallbackShape.lineTo(1, 0);
          fallbackShape.lineTo(1, 1);
          fallbackShape.lineTo(0, 1);
          fallbackShape.lineTo(0, 0);
          geometry = new THREE.ShapeGeometry(fallbackShape);
        }
        break;
      default:
        geometry = new THREE.BufferGeometry();
        break;
    }
  } else {
    // Create custom geometry from vertex data
    geometry = new THREE.BufferGeometry();
  }

  // Apply custom vertex data if available (for complex shapes)
  if (geometryData.vertices) {
    const vertices = new Float32Array(geometryData.vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  }

  if (geometryData.indices) {
    const indices = new Uint16Array(geometryData.indices);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  if (geometryData.normals) {
    const normals = new Float32Array(geometryData.normals);
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  } else if (geometryData.vertices) {
    // Compute normals if not provided
    geometry.computeVertexNormals();
  }

  if (geometryData.uvs) {
    const uvs = new Float32Array(geometryData.uvs);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }

  return geometry;
};

// Enhanced helper function to serialize a complete object (including groups)
const serializeObject = (object: THREE.Object3D): any => {
  const objectData: any = {
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
    visible: object.visible
  };

  if (object instanceof THREE.Mesh) {
    // Serialize geometry
    objectData.geometryData = serializeGeometry(object.geometry);
    
    // Serialize material
    if (object.material instanceof THREE.MeshStandardMaterial) {
      objectData.materialParams = {
        color: '#' + object.material.color.getHexString(),
        opacity: object.material.opacity,
        transparent: object.material.transparent,
        metalness: object.material.metalness,
        roughness: object.material.roughness
      };
    }
  } else if (object instanceof THREE.Group) {
    // Serialize all children for group objects
    objectData.children = object.children.map(child => serializeObject(child));
  }

  return objectData;
};

// Enhanced helper function to deserialize a complete object
const deserializeObject = (objectData: any): THREE.Object3D => {
  let object: THREE.Object3D;

  if (objectData.type === 'Mesh' && objectData.geometryData) {
    // Recreate mesh with preserved geometry
    const geometry = deserializeGeometry(objectData.geometryData);
    
    // Recreate material
    const materialParams = objectData.materialParams || {
      color: '#44aa88',
      opacity: 1,
      transparent: false,
      metalness: 0.1,
      roughness: 0.7
    };
    
    const material = new THREE.MeshStandardMaterial(materialParams);
    object = new THREE.Mesh(geometry, material);
  } else if (objectData.type === 'Group' && objectData.children) {
    // Recreate group with all children
    object = new THREE.Group();
    
    objectData.children.forEach((childData: any) => {
      const child = deserializeObject(childData);
      object.add(child);
    });
  } else {
    // Fallback to basic object
    console.warn('Unknown object type or missing data, creating fallback:', objectData.type);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#44aa88' });
    object = new THREE.Mesh(geometry, material);
  }

  // Apply transform properties
  object.position.set(
    objectData.position?.x || 0,
    objectData.position?.y || 0,
    objectData.position?.z || 0
  );
  object.rotation.set(
    objectData.rotation?.x || 0,
    objectData.rotation?.y || 0,
    objectData.rotation?.z || 0
  );
  object.scale.set(
    objectData.scale?.x || 1,
    objectData.scale?.y || 1,
    objectData.scale?.z || 1
  );
  object.visible = objectData.visible !== false;

  return object;
};

// Enhanced helper function to convert THREE.js object to Firestore format
export const objectToFirestore = (object: THREE.Object3D, name: string, id?: string): FirestoreObject => {
  console.log('Converting THREE.js object to Firestore:', name, object.type);
  
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

  // Enhanced serialization for all object types
  if (object instanceof THREE.Mesh) {
    // Serialize complete geometry data
    firestoreObj.geometryData = serializeGeometry(object.geometry);
    
    // Extract material properties
    if (object.material instanceof THREE.MeshStandardMaterial) {
      firestoreObj.color = '#' + object.material.color.getHexString();
      firestoreObj.opacity = object.material.opacity;
      
      firestoreObj.materialParams = {
        transparent: object.material.transparent,
        metalness: object.material.metalness,
        roughness: object.material.roughness
      };
    }

    // Keep legacy geometryParams for backward compatibility, with proper Shape serialization
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
    } else if (geometry instanceof THREE.ShapeGeometry) {
      // Handle ShapeGeometry with proper Shape serialization
      firestoreObj.geometryParams = serializeGeometryParameters(geometry.parameters);
    }
  } else if (object instanceof THREE.Group) {
    // Serialize all children for complex objects like trees, hearts, etc.
    firestoreObj.children = object.children.map(child => {
      const childData = serializeObject(child);
      return {
        ...childData,
        name: child.name || 'Child Object',
        id: crypto.randomUUID()
      } as FirestoreObject;
    });
  }

  console.log('Converted to Firestore object:', firestoreObj);
  return firestoreObj;
};

// Enhanced helper function to convert Firestore data back to THREE.js object
export const firestoreToObject = (data: FirestoreObject): THREE.Object3D | null => {
  console.log('Converting Firestore object to THREE.js:', data.name, data.type);
  
  let object: THREE.Object3D | null = null;

  try {
    if (data.type === 'Group' && data.children) {
      // Recreate group objects (like trees, hearts, etc.)
      console.log('Recreating group object with', data.children.length, 'children');
      object = new THREE.Group();
      
      data.children.forEach((childData, index) => {
        try {
          const child = deserializeObject(childData);
          if (child) {
            child.name = childData.name || `Child ${index}`;
            object!.add(child);
          }
        } catch (error) {
          console.error('Error recreating child object:', error, childData);
        }
      });
    } else if (data.type === 'Mesh') {
      // Try to recreate from enhanced geometry data first
      if (data.geometryData) {
        console.log('Recreating mesh from geometry data:', data.geometryData.type);
        const geometry = deserializeGeometry(data.geometryData);
        
        // Create material
        const materialParams = {
          color: data.color || '#44aa88',
          transparent: data.opacity < 1,
          opacity: data.opacity || 1,
          metalness: 0.1,
          roughness: 0.7,
          ...(data.materialParams || {})
        };

        const material = new THREE.MeshStandardMaterial(materialParams);
        object = new THREE.Mesh(geometry, material);
      } else if (data.geometryParams) {
        // Fallback to legacy geometry params with Shape deserialization
        console.log('Recreating mesh from legacy geometry params');
        let geometry: THREE.BufferGeometry;
        
        if (data.geometryParams.width !== undefined) {
          geometry = new THREE.BoxGeometry(
            data.geometryParams.width,
            data.geometryParams.height,
            data.geometryParams.depth
          );
        } else if (data.geometryParams.radius !== undefined && data.geometryParams.widthSegments !== undefined) {
          geometry = new THREE.SphereGeometry(
            data.geometryParams.radius,
            data.geometryParams.widthSegments,
            data.geometryParams.heightSegments
          );
        } else if (data.geometryParams.radiusTop !== undefined) {
          geometry = new THREE.CylinderGeometry(
            data.geometryParams.radiusTop,
            data.geometryParams.radiusBottom,
            data.geometryParams.height,
            data.geometryParams.radialSegments
          );
        } else if (data.geometryParams.radius !== undefined && data.geometryParams.radialSegments !== undefined) {
          geometry = new THREE.ConeGeometry(
            data.geometryParams.radius,
            data.geometryParams.height,
            data.geometryParams.radialSegments
          );
        } else if (data.geometryParams.shapes || data.geometryParams.shape) {
          // Handle ShapeGeometry with deserialized shapes
          const deserializedParams = deserializeGeometryParameters(data.geometryParams);
          if (deserializedParams.shapes && Array.isArray(deserializedParams.shapes)) {
            geometry = new THREE.ShapeGeometry(deserializedParams.shapes, deserializedParams.curveSegments || 12);
          } else if (deserializedParams.shape) {
            geometry = new THREE.ShapeGeometry(deserializedParams.shape, deserializedParams.curveSegments || 12);
          } else {
            // Fallback shape
            const fallbackShape = new THREE.Shape();
            fallbackShape.moveTo(0, 0);
            fallbackShape.lineTo(1, 0);
            fallbackShape.lineTo(1, 1);
            fallbackShape.lineTo(0, 1);
            fallbackShape.lineTo(0, 0);
            geometry = new THREE.ShapeGeometry(fallbackShape);
          }
        } else {
          geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        const material = new THREE.MeshStandardMaterial({
          color: data.color || '#44aa88',
          transparent: data.opacity < 1,
          opacity: data.opacity || 1,
          ...data.materialParams
        });

        object = new THREE.Mesh(geometry, material);
      } else {
        console.warn('No geometry data found, creating default box');
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: data.color || '#44aa88' });
        object = new THREE.Mesh(geometry, material);
      }
    } else {
      console.warn('Unknown object type, creating default box:', data.type);
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: data.color || '#44aa88' });
      object = new THREE.Mesh(geometry, material);
    }

    if (object) {
      // Set transform properties
      object.position.set(
        data.position?.x || 0, 
        data.position?.y || 0, 
        data.position?.z || 0
      );
      object.rotation.set(
        data.rotation?.x || 0, 
        data.rotation?.y || 0, 
        data.rotation?.z || 0
      );
      object.scale.set(
        data.scale?.x || 1, 
        data.scale?.y || 1, 
        data.scale?.z || 1
      );
      object.visible = data.visible !== false;
      object.name = data.name;
      
      console.log('Successfully recreated object:', data.name, object.type);
    }
  } catch (error) {
    console.error('Error converting Firestore object to THREE.js:', error, data);
    // Create fallback object
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#ff0000' }); // Red to indicate error
    object = new THREE.Mesh(geometry, material);
    object.name = data.name + ' (Error)';
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