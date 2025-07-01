import { create } from 'zustand';
import * as THREE from 'three';
import { FirestoreObject, FirestoreGroup, FirestoreLight, FirestoreScene } from '../services/firestoreService';

type EditMode = 'vertex' | 'edge' | null;
type CameraPerspective = 'perspective' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

interface Light {
  id: string;
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
  object?: THREE.Light;
}

interface Group {
  id: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  objectIds: string[];
}

interface SceneSettings {
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  gridDivisions: number;
  hideAllMenus: boolean;
  showLightHelpers: boolean;
}

interface HistoryState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
  }>;
  groups: Group[];
  lights: Light[];
}

interface SceneState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
  }>;
  groups: Group[];
  lights: Light[];
  selectedLight: Light | null;
  selectedObject: THREE.Object3D | null;
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  editMode: EditMode;
  cameraPerspective: CameraPerspective;
  cameraZoom: number;
  sceneSettings: SceneSettings;
  persistentTransformMode: 'translate' | 'rotate' | 'scale' | null;
  persistentEditMode: EditMode;
  selectedElements: {
    vertices: number[];
    edges: number[];
    faces: number[];
  };
  draggedVertex: {
    indices: number[];
    position: THREE.Vector3;
    initialPosition: THREE.Vector3;
  } | null;
  draggedEdge: {
    indices: number[][];
    positions: THREE.Vector3[];
    initialPositions: THREE.Vector3[];
    connectedVertices: Set<number>;
    midpoint: THREE.Vector3;
  } | null;
  isDraggingEdge: boolean;
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  placementMode: boolean;
  pendingObject: {
    geometry: () => THREE.BufferGeometry | THREE.Group;
    name: string;
    color?: string;
  } | null;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  cameraTarget: THREE.Vector3;
  
  // All the existing methods...
  addObject: (object: THREE.Object3D, name: string) => void;
  removeObject: (id: string) => void;
  setSelectedObject: (object: THREE.Object3D | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => void;
  setEditMode: (mode: EditMode) => void;
  setCameraPerspective: (perspective: CameraPerspective) => void;
  updateSceneSettings: (settings: Partial<SceneSettings>) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  updateObjectName: (id: string, name: string) => void;
  updateObjectProperties: () => void;
  updateObjectColor: (color: string) => void;
  updateObjectOpacity: (opacity: number) => void;
  setSelectedElements: (type: 'vertices' | 'edges' | 'faces', indices: number[]) => void;
  startVertexDrag: (index: number, position: THREE.Vector3) => void;
  updateVertexDrag: (position: THREE.Vector3) => void;
  endVertexDrag: () => void;
  startEdgeDrag: (vertexIndices: number[], positions: THREE.Vector3[], midpoint: THREE.Vector3) => void;
  updateEdgeDrag: (position: THREE.Vector3) => void;
  endEdgeDrag: () => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
  updateCylinderVertices: (vertexCount: number) => void;
  updateSphereVertices: (vertexCount: number) => void;
  createGroup: (name: string, objectIds?: string[]) => void;
  removeGroup: (groupId: string) => void;
  addObjectToGroup: (objectId: string, groupId: string) => void;
  removeObjectFromGroup: (objectId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  toggleGroupLock: (groupId: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  moveObjectsToGroup: (objectIds: string[], groupId: string | null) => void;
  undo: () => void;
  redo: () => void;
  duplicateObject: () => void;
  mirrorObject: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  startObjectPlacement: (objectDef: { geometry: () => THREE.BufferGeometry | THREE.Group; name: string; color?: string }) => void;
  placeObjectAt: (position: THREE.Vector3, rotation?: THREE.Euler | null) => void;
  cancelObjectPlacement: () => void;
  addLight: (type: 'directional' | 'point' | 'spot', position?: number[]) => void;
  removeLight: (lightId: string) => void;
  updateLight: (lightId: string, properties: Partial<Light>) => void;
  toggleLightVisibility: (lightId: string) => void;
  setSelectedLight: (light: Light | null) => void;
  isObjectLocked: (objectId: string) => boolean;
  canSelectObject: (object: THREE.Object3D) => boolean;
  saveToHistory: () => void;
  markSaved: () => void;
  markUnsavedChanges: () => void;
  setCameraTarget: (target: THREE.Vector3) => void;
  
  // New functions for project integration
  resetScene: () => void;
  loadSceneFromProject: (sceneData: {
    objects: FirestoreObject[];
    groups: FirestoreGroup[];
    lights: FirestoreLight[];
    settings: FirestoreScene;
  }) => void;
}

const initialState = {
  objects: [],
  groups: [],
  lights: [],
  selectedLight: null,
  selectedObject: null,
  transformMode: null,
  editMode: null,
  cameraPerspective: 'perspective' as CameraPerspective,
  cameraZoom: 1,
  sceneSettings: {
    backgroundColor: '#0f0f23',
    showGrid: true,
    gridSize: 10,
    gridDivisions: 10,
    hideAllMenus: false,
    showLightHelpers: true
  },
  persistentTransformMode: null,
  persistentEditMode: null,
  selectedElements: {
    vertices: [],
    edges: [],
    faces: [],
  },
  draggedVertex: null,
  draggedEdge: null,
  isDraggingEdge: false,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  placementMode: false,
  pendingObject: null,
  lastSaved: null,
  hasUnsavedChanges: false,
  cameraTarget: new THREE.Vector3(0, 0, 0),
};

const cloneObject = (obj: THREE.Object3D): THREE.Object3D => {
  if (obj instanceof THREE.Mesh) {
    const clonedGeometry = obj.geometry.clone();
    const clonedMaterial = obj.material instanceof Array 
      ? obj.material.map(mat => mat.clone())
      : obj.material.clone();
    const clonedMesh = new THREE.Mesh(clonedGeometry, clonedMaterial);
    
    clonedMesh.position.copy(obj.position);
    clonedMesh.rotation.copy(obj.rotation);
    clonedMesh.scale.copy(obj.scale);
    
    return clonedMesh;
  }
  return obj.clone();
};

const createLight = (type: 'directional' | 'point' | 'spot', position: number[], target: number[] = [0, 0, 0]): THREE.Light => {
  let light: THREE.Light;
  
  switch (type) {
    case 'directional':
      light = new THREE.DirectionalLight('#ffffff', 1);
      light.position.set(...position);
      (light as THREE.DirectionalLight).target.position.set(...target);
      break;
    case 'point':
      light = new THREE.PointLight('#ffffff', 1, 0, 2);
      light.position.set(...position);
      break;
    case 'spot':
      light = new THREE.SpotLight('#ffffff', 1, 0, Math.PI / 3, 0, 2);
      light.position.set(...position);
      (light as THREE.SpotLight).target.position.set(...target);
      break;
    default:
      light = new THREE.PointLight('#ffffff', 1);
      light.position.set(...position);
  }
  
  light.castShadow = true;
  return light;
};

// Helper function to convert Firestore data back to THREE.js object
const firestoreToObject = (data: FirestoreObject): THREE.Object3D | null => {
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

export const useSceneStore = create<SceneState>((set, get) => ({
  ...initialState,

  // Reset function to clear all scene data when switching projects
  resetScene: () => set(initialState),

  // Load scene data from project document
  loadSceneFromProject: (sceneData) => {
    // Convert Firestore objects to THREE.js objects
    const threeObjects = sceneData.objects.map(firestoreObj => {
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

    // Convert Firestore lights to scene lights
    const sceneLights = sceneData.lights.map(firestoreLight => ({
      ...firestoreLight,
      object: createLight(firestoreLight.type, firestoreLight.position, firestoreLight.target)
    }));

    set({
      objects: threeObjects,
      groups: sceneData.groups,
      lights: sceneLights,
      sceneSettings: {
        ...get().sceneSettings,
        ...sceneData.settings
      },
      cameraPerspective: (sceneData.settings.cameraPerspective as CameraPerspective) || 'perspective',
      cameraZoom: sceneData.settings.cameraZoom || 1
    });
  },

  updateSceneSettings: (settings) =>
    set((state) => {
      get().markUnsavedChanges();
      return {
        sceneSettings: { ...state.sceneSettings, ...settings }
      };
    }),

  saveToHistory: () => {
    const state = get();
    const currentState: HistoryState = {
      objects: state.objects.map(obj => ({
        ...obj,
        object: cloneObject(obj.object)
      })),
      groups: JSON.parse(JSON.stringify(state.groups)),
      lights: JSON.parse(JSON.stringify(state.lights.map(light => ({
        ...light,
        object: undefined
      }))))
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentState);

    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false
    });
    
    get().markUnsavedChanges();
  },

  addObject: (object, name) =>
    set((state) => {
      const newObjects = [...state.objects, { id: crypto.randomUUID(), object, name, visible: true, locked: false }];
      
      setTimeout(() => get().saveToHistory(), 0);
      
      return { objects: newObjects };
    }),

  removeObject: (id) =>
    set((state) => {
      const objectToRemove = state.objects.find(obj => obj.id === id);
      if (objectToRemove?.locked) return state;

      if (objectToRemove?.groupId) {
        const group = state.groups.find(g => g.id === objectToRemove.groupId);
        if (group?.locked) return state;
      }

      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(objId => objId !== id)
      }));

      const newState = {
        objects: state.objects.filter((obj) => obj.id !== id),
        groups: updatedGroups,
        selectedObject: state.objects.find((obj) => obj.id === id)?.object === state.selectedObject
          ? null
          : state.selectedObject,
      };

      setTimeout(() => get().saveToHistory(), 0);

      return newState;
    }),

  setSelectedObject: (object) => 
    set((state) => {
      if (object && !get().canSelectObject(object)) {
        return state;
      }

      let newEditMode = state.editMode;
      let newTransformMode = state.transformMode;

      if (object) {
        if (state.persistentTransformMode) {
          newTransformMode = state.persistentTransformMode;
        }

        if (state.persistentEditMode) {
          newEditMode = state.persistentEditMode;
        } else {
          if (object instanceof THREE.Mesh) {
            const geometry = object.geometry;
            if (geometry instanceof THREE.SphereGeometry ||
                geometry instanceof THREE.CylinderGeometry ||
                geometry instanceof THREE.ConeGeometry) {
              newEditMode = 'vertex';
            }
          }
        }
      } else {
        if (!state.persistentEditMode) {
          newEditMode = null;
        }
        if (!state.persistentTransformMode) {
          newTransformMode = null;
        }
      }
      
      return { 
        selectedObject: object,
        editMode: newEditMode,
        transformMode: newTransformMode
      };
    }),

  setTransformMode: (mode) => 
    set((state) => ({
      transformMode: mode,
      persistentTransformMode: mode
    })),
  
  setEditMode: (mode) => 
    set((state) => {
      if (mode === 'edge' && state.selectedObject instanceof THREE.Mesh) {
        const geometry = state.selectedObject.geometry;
        if (geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry ||
            geometry instanceof THREE.SphereGeometry) {
          return state;
        }
      }

      return { 
        editMode: mode,
        persistentEditMode: mode
      };
    }),

  setCameraPerspective: (perspective) => {
    get().markUnsavedChanges();
    set({ cameraPerspective: perspective });
  },

  toggleVisibility: (id) =>
    set((state) => {
      const objectToToggle = state.objects.find(obj => obj.id === id);
      if (!objectToToggle) return state;

      if (objectToToggle.locked) return state;

      if (objectToToggle.groupId) {
        const group = state.groups.find(g => g.id === objectToToggle.groupId);
        if (group?.locked) return state;
      }

      const updatedObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, visible: !obj.visible } : obj
      );
      
      const toggledObject = updatedObjects.find((obj) => obj.id === id);
      
      const newSelectedObject = (toggledObject && !toggledObject.visible && toggledObject.object === state.selectedObject)
        ? null
        : state.selectedObject;

      get().markUnsavedChanges();

      return {
        objects: updatedObjects,
        selectedObject: newSelectedObject,
      };
    }),

  toggleLock: (id) =>
    set((state) => {
      const objectToToggle = state.objects.find(obj => obj.id === id);
      if (!objectToToggle) return state;

      if (objectToToggle.groupId) {
        const group = state.groups.find(g => g.id === objectToToggle.groupId);
        if (group?.locked) return state;
      }

      const updatedObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, locked: !obj.locked } : obj
      );
      
      const toggledObject = updatedObjects.find((obj) => obj.id === id);
      
      const newSelectedObject = (toggledObject && toggledObject.locked && toggledObject.object === state.selectedObject)
        ? null
        : state.selectedObject;

      get().markUnsavedChanges();

      return {
        objects: updatedObjects,
        selectedObject: newSelectedObject,
      };
    }),

  updateObjectName: (id, name) =>
    set((state) => {
      const objectToUpdate = state.objects.find(obj => obj.id === id);
      if (!objectToUpdate) return state;

      if (objectToUpdate.locked) return state;

      if (objectToUpdate.groupId) {
        const group = state.groups.find(g => g.id === objectToUpdate.groupId);
        if (group?.locked) return state;
      }

      get().markUnsavedChanges();

      return {
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, name } : obj
        ),
      };
    }),

  updateObjectProperties: () => {
    get().markUnsavedChanges();
    set((state) => ({ ...state }));
  },

  updateObjectColor: (color) => 
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
        if (get().isObjectLocked(selectedObj?.id || '')) return state;

        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.color.setStyle(color);
        material.needsUpdate = true;
        
        get().markUnsavedChanges();
      }
      return state;
    }),

  updateObjectOpacity: (opacity) =>
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
        if (get().isObjectLocked(selectedObj?.id || '')) return state;

        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.needsUpdate = true;
        
        get().markUnsavedChanges();
      }
      return state;
    }),

  setSelectedElements: (type, indices) =>
    set((state) => ({
      selectedElements: {
        ...state.selectedElements,
        [type]: indices,
      },
    })),

  startVertexDrag: (index, position) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const overlappingIndices = [];
      const selectedPos = new THREE.Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index)
      );

      for (let i = 0; i < positions.count; i++) {
        const pos = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        if (pos.distanceTo(selectedPos) < 0.0001) {
          overlappingIndices.push(i);
        }
      }

      return {
        draggedVertex: {
          indices: overlappingIndices,
          position: position.clone(),
          initialPosition: position.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          vertices: overlappingIndices
        }
      };
    }),

  updateVertexDrag: (position) =>
    set((state) => {
      if (!state.draggedVertex || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      state.draggedVertex.indices.forEach(index => {
        positions.setXYZ(
          index,
          position.x,
          position.y,
          position.z
        );
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedVertex: {
          ...state.draggedVertex,
          position: position.clone()
        }
      };
    }),

  endVertexDrag: () => {
    get().saveToHistory();
    set({ draggedVertex: null });
  },

  startEdgeDrag: (vertexIndices, positions, midpoint) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positionAttribute = geometry.attributes.position;
      const connectedVertices = new Set<number>();
      const edges: number[][] = [];

      const findOverlappingVertices = (targetIndex: number) => {
        const targetPos = new THREE.Vector3(
          positionAttribute.getX(targetIndex),
          positionAttribute.getY(targetIndex),
          positionAttribute.getZ(targetIndex)
        );

        const overlapping = [targetIndex];
        for (let i = 0; i < positionAttribute.count; i++) {
          if (i === targetIndex) continue;

          const pos = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
          );

          if (pos.distanceTo(targetPos) < 0.0001) {
            overlapping.push(i);
          }
        }
        return overlapping;
      };

      const vertex1Overlapping = findOverlappingVertices(vertexIndices[0]);
      const vertex2Overlapping = findOverlappingVertices(vertexIndices[1]);

      vertex1Overlapping.forEach(v => connectedVertices.add(v));
      vertex2Overlapping.forEach(v => connectedVertices.add(v));

      vertex1Overlapping.forEach(v1 => {
        vertex2Overlapping.forEach(v2 => {
          edges.push([v1, v2]);
        });
      });

      return {
        draggedEdge: {
          indices: edges,
          positions: positions,
          initialPositions: positions.map(p => p.clone()),
          connectedVertices,
          midpoint: midpoint.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          edges: Array.from(connectedVertices)
        }
      };
    }),

  updateEdgeDrag: (position) =>
    set((state) => {
      if (!state.draggedEdge || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const offset = position.clone().sub(state.draggedEdge.midpoint);

      state.draggedEdge.connectedVertices.forEach(vertexIndex => {
        const currentPos = new THREE.Vector3(
          positions.getX(vertexIndex),
          positions.getY(vertexIndex),
          positions.getZ(vertexIndex)
        );
        const newPos = currentPos.add(offset);
        positions.setXYZ(vertexIndex, newPos.x, newPos.y, newPos.z);
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedEdge: {
          ...state.draggedEdge,
          midpoint: position.clone()
        }
      };
    }),

  endEdgeDrag: () => {
    get().saveToHistory();
    set({ draggedEdge: null });
  },

  setIsDraggingEdge: (isDragging) => set({ isDraggingEdge: isDragging }),

  updateCylinderVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.CylinderGeometry)) {
        return state;
      }

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.CylinderGeometry(
        oldGeometry.parameters.radiusTop,
        oldGeometry.parameters.radiusBottom,
        oldGeometry.parameters.height,
        vertexCount,
        oldGeometry.parameters.heightSegments,
        oldGeometry.parameters.openEnded,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      get().saveToHistory();

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  updateSphereVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.SphereGeometry)) {
        return state;
      }

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.SphereGeometry(
        oldGeometry.parameters.radius,
        vertexCount,
        vertexCount / 2,
        oldGeometry.parameters.phiStart,
        oldGeometry.parameters.phiLength,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      get().saveToHistory();

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  createGroup: (name, objectIds = []) =>
    set((state) => {
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name,
        expanded: true,
        visible: true,
        locked: false,
        objectIds: [...objectIds]
      };

      const updatedObjects = state.objects.map(obj => 
        objectIds.includes(obj.id) 
          ? { ...obj, groupId: newGroup.id }
          : obj
      );

      get().saveToHistory();

      return {
        groups: [...state.groups, newGroup],
        objects: updatedObjects
      };
    }),

  removeGroup: (groupId) =>
    set((state) => {
      const groupToRemove = state.groups.find(g => g.id === groupId);
      if (groupToRemove?.locked) return state;

      const updatedObjects = state.objects.map(obj => 
        obj.groupId === groupId 
          ? { ...obj, groupId: undefined }
          : obj
      );

      get().saveToHistory();

      return {
        groups: state.groups.filter(group => group.id !== groupId),
        objects: updatedObjects
      };
    }),

  addObjectToGroup: (objectId, groupId) =>
    set((state) => {
      const objectToMove = state.objects.find(obj => obj.id === objectId);
      const targetGroup = state.groups.find(g => g.id === groupId);
      
      if (objectToMove?.locked || targetGroup?.locked) return state;

      const updatedObjects = state.objects.map(obj =>
        obj.id === objectId ? { ...obj, groupId } : obj
      );

      const updatedGroups = state.groups.map(group =>
        group.id === groupId 
          ? { ...group, objectIds: [...group.objectIds, objectId] }
          : group
      );

      get().markUnsavedChanges();

      return {
        objects: updatedObjects,
        groups: updatedGroups
      };
    }),

  removeObjectFromGroup: (objectId) =>
    set((state) => {
      const obj = state.objects.find(o => o.id === objectId);
      if (!obj?.groupId) return state;

      const group = state.groups.find(g => g.id === obj.groupId);
      
      if (obj.locked || group?.locked) return state;

      const updatedObjects = state.objects.map(o =>
        o.id === objectId ? { ...o, groupId: undefined } : o
      );

      const updatedGroups = state.groups.map(group =>
        group.id === obj.groupId
          ? { ...group, objectIds: group.objectIds.filter(id => id !== objectId) }
          : group
      );

      get().markUnsavedChanges();

      return {
        objects: updatedObjects,
        groups: updatedGroups
      };
    }),

  toggleGroupExpanded: (groupId) =>
    set((state) => ({
      groups: state.groups.map(group =>
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    })),

  toggleGroupVisibility: (groupId) =>
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group || group.locked) return state;

      const newVisibility = !group.visible;

      const updatedGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, visible: newVisibility } : g
      );

      const updatedObjects = state.objects.map(obj =>
        group.objectIds.includes(obj.id) 
          ? { ...obj, visible: newVisibility }
          : obj
      );

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      const newSelectedObject = (selectedObj && group.objectIds.includes(selectedObj.id) && !newVisibility)
        ? null
        : state.selectedObject;

      get().markUnsavedChanges();

      return {
        groups: updatedGroups,
        objects: updatedObjects,
        selectedObject: newSelectedObject
      };
    }),

  toggleGroupLock: (groupId) =>
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      const newLockState = !group.locked;

      const updatedGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, locked: newLockState } : g
      );

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      const newSelectedObject = (selectedObj && group.objectIds.includes(selectedObj.id) && newLockState)
        ? null
        : state.selectedObject;

      get().markUnsavedChanges();

      return {
        groups: updatedGroups,
        selectedObject: newSelectedObject
      };
    }),

  updateGroupName: (groupId, name) =>
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (group?.locked) return state;

      get().markUnsavedChanges();

      return {
        groups: state.groups.map(group =>
          group.id === groupId ? { ...group, name } : group
        )
      };
    }),

  moveObjectsToGroup: (objectIds, groupId) =>
    set((state) => {
      const lockedObjects = objectIds.filter(id => {
        const obj = state.objects.find(o => o.id === id);
        return obj?.locked || (obj?.groupId && state.groups.find(g => g.id === obj.groupId)?.locked);
      });

      if (lockedObjects.length > 0) return state;

      if (groupId) {
        const targetGroup = state.groups.find(g => g.id === groupId);
        if (targetGroup?.locked) return state;
      }

      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(id => !objectIds.includes(id))
      }));

      const finalGroups = groupId 
        ? updatedGroups.map(group =>
            group.id === groupId
              ? { ...group, objectIds: [...group.objectIds, ...objectIds] }
              : group
          )
        : updatedGroups;

      const updatedObjects = state.objects.map(obj =>
        objectIds.includes(obj.id) 
          ? { ...obj, groupId }
          : obj
      );

      get().markUnsavedChanges();

      return {
        groups: finalGroups,
        objects: updatedObjects
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const previousState = state.history[state.historyIndex - 1];
      
      return {
        ...state,
        objects: previousState.objects,
        groups: previousState.groups,
        lights: previousState.lights.map(light => ({
          ...light,
          object: createLight(light.type, light.position, light.target)
        })),
        historyIndex: state.historyIndex - 1,
        canUndo: state.historyIndex - 1 > 0,
        canRedo: true,
        selectedObject: null,
        selectedLight: null
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const nextState = state.history[state.historyIndex + 1];
      
      return {
        ...state,
        objects: nextState.objects,
        groups: nextState.groups,
        lights: nextState.lights.map(light => ({
          ...light,
          object: createLight(light.type, light.position, light.target)
        })),
        historyIndex: state.historyIndex + 1,
        canUndo: true,
        canRedo: state.historyIndex + 1 < state.history.length - 1,
        selectedObject: null,
        selectedLight: null
      };
    }),

  duplicateObject: () =>
    set((state) => {
      if (!state.selectedObject) return state;

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (!selectedObj || get().isObjectLocked(selectedObj.id)) return state;

      const clonedObject = cloneObject(state.selectedObject);
      clonedObject.position.x += 1;

      const newObject = {
        id: crypto.randomUUID(),
        object: clonedObject,
        name: `${selectedObj.name} Copy`,
        visible: true,
        locked: false,
        groupId: selectedObj.groupId
      };

      let updatedGroups = state.groups;
      if (selectedObj.groupId) {
        updatedGroups = state.groups.map(group =>
          group.id === selectedObj.groupId
            ? { ...group, objectIds: [...group.objectIds, newObject.id] }
            : group
        );
      }

      get().saveToHistory();

      return {
        objects: [...state.objects, newObject],
        groups: updatedGroups,
        selectedObject: clonedObject
      };
    }),

  mirrorObject: () =>
    set((state) => {
      if (!state.selectedObject) return state;

      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (!selectedObj || get().isObjectLocked(selectedObj.id)) return state;

      state.selectedObject.scale.x *= -1;

      get().saveToHistory();

      return state;
    }),

  zoomIn: () =>
    set((state) => {
      get().markUnsavedChanges();
      return {
        cameraZoom: Math.min(state.cameraZoom * 1.2, 5)
      };
    }),

  zoomOut: () =>
    set((state) => {
      get().markUnsavedChanges();
      return {
        cameraZoom: Math.max(state.cameraZoom / 1.2, 0.1)
      };
    }),

  startObjectPlacement: (objectDef) =>
    set({
      placementMode: true,
      pendingObject: objectDef,
      selectedObject: null,
      transformMode: null,
      editMode: null
    }),

  placeObjectAt: (position, rotation = null) =>
    set((state) => {
      if (!state.pendingObject) return state;

      const geometryOrGroup = state.pendingObject.geometry();
      let object: THREE.Object3D;

      if (geometryOrGroup instanceof THREE.Group) {
        object = geometryOrGroup;
      } else {
        const material = new THREE.MeshStandardMaterial({ 
          color: state.pendingObject.color || '#44aa88' 
        });
        object = new THREE.Mesh(geometryOrGroup, material);
      }

      object.position.copy(position);
      if (rotation) {
        object.rotation.copy(rotation);
      }

      const newObjects = [...state.objects, { 
        id: crypto.randomUUID(), 
        object, 
        name: state.pendingObject.name, 
        visible: true, 
        locked: false 
      }];

      setTimeout(() => get().saveToHistory(), 0);

      let newTransformMode = state.persistentTransformMode;
      let newEditMode = state.persistentEditMode;

      if (!state.persistentEditMode && object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        if (geometry instanceof THREE.SphereGeometry ||
            geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry) {
          newEditMode = 'vertex';
        }
      }

      return {
        objects: newObjects,
        placementMode: false,
        pendingObject: null,
        selectedObject: object,
        transformMode: newTransformMode,
        editMode: newEditMode
      };
    }),

  cancelObjectPlacement: () =>
    set({
      placementMode: false,
      pendingObject: null
    }),

  addLight: (type, position = [2, 2, 2]) =>
    set((state) => {
      const lightCount = state.lights.filter(l => l.type === type).length;
      const newLight: Light = {
        id: crypto.randomUUID(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Light ${lightCount + 1}`,
        type,
        position: [...position],
        target: [0, 0, 0],
        intensity: 1,
        color: '#ffffff',
        visible: true,
        castShadow: true,
        distance: type === 'directional' ? 0 : 10,
        decay: 2,
        angle: Math.PI / 3,
        penumbra: 0,
        object: createLight(type, position, [0, 0, 0])
      };

      get().saveToHistory();

      return {
        lights: [...state.lights, newLight],
        selectedLight: newLight
      };
    }),

  removeLight: (lightId) =>
    set((state) => {
      const updatedLights = state.lights.filter(light => light.id !== lightId);
      
      get().saveToHistory();

      return {
        lights: updatedLights,
        selectedLight: state.selectedLight?.id === lightId ? null : state.selectedLight
      };
    }),

  updateLight: (lightId, properties) =>
    set((state) => {
      const updatedLights = state.lights.map(light => {
        if (light.id === lightId) {
          const updatedLight = { ...light, ...properties };
          
          if (updatedLight.object) {
            const threeLight = updatedLight.object;
            
            threeLight.intensity = updatedLight.intensity;
            threeLight.color.setStyle(updatedLight.color);
            threeLight.visible = updatedLight.visible;
            threeLight.castShadow = updatedLight.castShadow;
            threeLight.position.set(...updatedLight.position);
            
            if (updatedLight.type === 'directional' && threeLight instanceof THREE.DirectionalLight) {
              threeLight.target.position.set(...updatedLight.target);
            } else if (updatedLight.type === 'point' && threeLight instanceof THREE.PointLight) {
              threeLight.distance = updatedLight.distance;
              threeLight.decay = updatedLight.decay;
            } else if (updatedLight.type === 'spot' && threeLight instanceof THREE.SpotLight) {
              threeLight.target.position.set(...updatedLight.target);
              threeLight.distance = updatedLight.distance;
              threeLight.decay = updatedLight.decay;
              threeLight.angle = updatedLight.angle;
              threeLight.penumbra = updatedLight.penumbra;
            }
          }
          
          return updatedLight;
        }
        return light;
      });

      get().markUnsavedChanges();

      return {
        lights: updatedLights,
        selectedLight: state.selectedLight?.id === lightId 
          ? updatedLights.find(l => l.id === lightId) || null
          : state.selectedLight
      };
    }),

  toggleLightVisibility: (lightId) =>
    set((state) => {
      const updatedLights = state.lights.map(light =>
        light.id === lightId ? { ...light, visible: !light.visible } : light
      );

      const light = updatedLights.find(l => l.id === lightId);
      if (light?.object) {
        light.object.visible = light.visible;
      }

      get().markUnsavedChanges();

      return { lights: updatedLights };
    }),

  setSelectedLight: (light) => set({ selectedLight: light }),

  isObjectLocked: (objectId) => {
    const state = get();
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return false;

    if (obj.locked) return true;

    if (obj.groupId) {
      const group = state.groups.find(g => g.id === obj.groupId);
      return group?.locked || false;
    }

    return false;
  },

  canSelectObject: (object) => {
    const state = get();
    const obj = state.objects.find(o => o.object === object);
    return obj ? !get().isObjectLocked(obj.id) : true;
  },

  markSaved: () => 
    set({
      lastSaved: new Date(),
      hasUnsavedChanges: false
    }),

  markUnsavedChanges: () =>
    set({
      hasUnsavedChanges: true
    }),

  setCameraTarget: (target) => 
    set({
      cameraTarget: target.clone()
    }),
}));