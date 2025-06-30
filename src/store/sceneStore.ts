import { create } from 'zustand';
import * as THREE from 'three';

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
  showLightHelpers: boolean; // New setting for light helper visibility
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
  // New persistent mode settings
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
  // New placement state
  placementMode: boolean;
  pendingObject: {
    geometry: () => THREE.BufferGeometry | THREE.Group;
    name: string;
    color?: string;
  } | null;
  // Save state
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  // Camera state for zoom operations
  cameraTarget: THREE.Vector3;
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
  // Group management
  createGroup: (name: string, objectIds?: string[]) => void;
  removeGroup: (groupId: string) => void;
  addObjectToGroup: (objectId: string, groupId: string) => void;
  removeObjectFromGroup: (objectId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  toggleGroupLock: (groupId: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  moveObjectsToGroup: (objectIds: string[], groupId: string | null) => void;
  // New action functions
  undo: () => void;
  redo: () => void;
  duplicateObject: () => void;
  mirrorObject: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  // Enhanced placement functions
  startObjectPlacement: (objectDef: { geometry: () => THREE.BufferGeometry | THREE.Group; name: string; color?: string }) => void;
  placeObjectAt: (position: THREE.Vector3, rotation?: THREE.Euler | null) => void;
  cancelObjectPlacement: () => void;
  // Light management functions
  addLight: (type: 'directional' | 'point' | 'spot', position?: number[]) => void;
  removeLight: (lightId: string) => void;
  updateLight: (lightId: string, properties: Partial<Light>) => void;
  toggleLightVisibility: (lightId: string) => void;
  setSelectedLight: (light: Light | null) => void;
  // Helper functions
  isObjectLocked: (objectId: string) => boolean;
  canSelectObject: (object: THREE.Object3D) => boolean;
  saveToHistory: () => void;
  // Save functions
  markSaved: () => void;
  markUnsavedChanges: () => void;
  // Camera functions
  setCameraTarget: (target: THREE.Vector3) => void;
}

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

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  groups: [],
  lights: [],
  selectedLight: null,
  selectedObject: null,
  transformMode: null,
  editMode: null,
  cameraPerspective: 'perspective',
  cameraZoom: 1,
  sceneSettings: {
    backgroundColor: '#0f0f23',
    showGrid: true,
    gridSize: 10,
    gridDivisions: 10,
    hideAllMenus: false,
    showLightHelpers: true // Default to showing light helpers
  },
  // New persistent mode settings
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
  // New placement state
  placementMode: false,
  pendingObject: null,
  // Save state
  lastSaved: null,
  hasUnsavedChanges: false,
  // Camera state
  cameraTarget: new THREE.Vector3(0, 0, 0),

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
        object: undefined // Don't clone the THREE.js object
      }))))
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentState);

    // Limit history to 50 states
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
      
      // Save to history after adding
      setTimeout(() => get().saveToHistory(), 0);
      
      return { objects: newObjects };
    }),

  removeObject: (id) =>
    set((state) => {
      // Check if object is locked
      const objectToRemove = state.objects.find(obj => obj.id === id);
      if (objectToRemove?.locked) return state;

      // Check if object is in a locked group
      if (objectToRemove?.groupId) {
        const group = state.groups.find(g => g.id === objectToRemove.groupId);
        if (group?.locked) return state;
      }

      // Remove object from any group
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

      // Save to history after removing
      setTimeout(() => get().saveToHistory(), 0);

      return newState;
    }),

  setSelectedObject: (object) => 
    set((state) => {
      // Check if object can be selected (not locked)
      if (object && !get().canSelectObject(object)) {
        return state; // Don't change selection if object is locked
      }

      let newEditMode = state.editMode;
      let newTransformMode = state.transformMode;

      if (object) {
        // Apply persistent transform mode if set
        if (state.persistentTransformMode) {
          newTransformMode = state.persistentTransformMode;
        }

        // Apply persistent edit mode if set
        if (state.persistentEditMode) {
          newEditMode = state.persistentEditMode;
        } else {
          // Auto-enable vertex mode for sphere, cylinder, and cone only if no persistent mode is set
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
        // When deselecting, only clear modes if no persistent modes are set
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
    set((state) => {
      // Update both current and persistent transform mode
      return {
        transformMode: mode,
        persistentTransformMode: mode // Remember this choice for future selections
      };
    }),
  
  setEditMode: (mode) => 
    set((state) => {
      // If trying to set edge mode on unsupported geometry, prevent it
      if (mode === 'edge' && state.selectedObject instanceof THREE.Mesh) {
        const geometry = state.selectedObject.geometry;
        if (geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry ||
            geometry instanceof THREE.SphereGeometry) {
          return state; // Don't change the edit mode
        }
      }

      // Update both current and persistent edit mode
      return { 
        editMode: mode,
        persistentEditMode: mode // Remember this choice for future selections
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

      // Check if object is locked
      if (objectToToggle.locked) return state;

      // Check if object is in a locked group
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

      // Check if object is in a locked group
      if (objectToToggle.groupId) {
        const group = state.groups.find(g => g.id === objectToToggle.groupId);
        if (group?.locked) return state;
      }

      const updatedObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, locked: !obj.locked } : obj
      );
      
      const toggledObject = updatedObjects.find((obj) => obj.id === id);
      
      // Clear selection if selected object becomes locked
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

      // Check if object is locked
      if (objectToUpdate.locked) return state;

      // Check if object is in a locked group
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
        // Check if selected object is locked
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
        // Check if selected object is locked
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

      // Check if selected object is locked
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

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      // Update all overlapping vertices to the new position
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

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positionAttribute = geometry.attributes.position;
      const connectedVertices = new Set<number>();
      const edges: number[][] = [];

      // Find all overlapping vertices for each vertex in the edge
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

      // Get all overlapping vertices for both edge vertices
      const vertex1Overlapping = findOverlappingVertices(vertexIndices[0]);
      const vertex2Overlapping = findOverlappingVertices(vertexIndices[1]);

      // Add all overlapping vertices to connected set
      vertex1Overlapping.forEach(v => connectedVertices.add(v));
      vertex2Overlapping.forEach(v => connectedVertices.add(v));

      // Create edge pairs
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

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const offset = position.clone().sub(state.draggedEdge.midpoint);

      // Move all connected vertices by the offset
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

      // Check if selected object is locked
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

      // Check if selected object is locked
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

  // Group management functions
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

      // Update objects to be part of this group
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

      // Remove group reference from objects
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
      
      // Check if object is locked or target group is locked
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
      
      // Check if object is locked or group is locked
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

      // Update group visibility
      const updatedGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, visible: newVisibility } : g
      );

      // Update all objects in the group
      const updatedObjects = state.objects.map(obj =>
        group.objectIds.includes(obj.id) 
          ? { ...obj, visible: newVisibility }
          : obj
      );

      // Clear selection if selected object becomes invisible
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

      // Update group lock state
      const updatedGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, locked: newLockState } : g
      );

      // Clear selection if selected object is in a group that becomes locked
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
      // Check if any objects are locked
      const lockedObjects = objectIds.filter(id => {
        const obj = state.objects.find(o => o.id === id);
        return obj?.locked || (obj?.groupId && state.groups.find(g => g.id === obj.groupId)?.locked);
      });

      if (lockedObjects.length > 0) return state;

      // Check if target group is locked
      if (groupId) {
        const targetGroup = state.groups.find(g => g.id === groupId);
        if (targetGroup?.locked) return state;
      }

      // Remove objects from their current groups
      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(id => !objectIds.includes(id))
      }));

      // Add objects to the new group if specified
      const finalGroups = groupId 
        ? updatedGroups.map(group =>
            group.id === groupId
              ? { ...group, objectIds: [...group.objectIds, ...objectIds] }
              : group
          )
        : updatedGroups;

      // Update objects
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

  // New action functions
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
        selectedObject: null, // Clear selection on undo
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
        selectedObject: null, // Clear selection on redo
        selectedLight: null
      };
    }),

  duplicateObject: () =>
    set((state) => {
      if (!state.selectedObject) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (!selectedObj || get().isObjectLocked(selectedObj.id)) return state;

      const clonedObject = cloneObject(state.selectedObject);
      clonedObject.position.x += 1; // Offset the duplicate

      const newObject = {
        id: crypto.randomUUID(),
        object: clonedObject,
        name: `${selectedObj.name} Copy`,
        visible: true,
        locked: false,
        groupId: selectedObj.groupId
      };

      // Update group if object belongs to one
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

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (!selectedObj || get().isObjectLocked(selectedObj.id)) return state;

      // Mirror along X-axis
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

  // Enhanced placement functions
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

      // Check if it's a THREE.Group or THREE.BufferGeometry
      if (geometryOrGroup instanceof THREE.Group) {
        // It's already a complete group, use it directly
        object = geometryOrGroup;
      } else {
        // It's a BufferGeometry, create a mesh with material
        const material = new THREE.MeshStandardMaterial({ 
          color: state.pendingObject.color || '#44aa88' 
        });
        object = new THREE.Mesh(geometryOrGroup, material);
      }

      // Set position and rotation
      object.position.copy(position);
      if (rotation) {
        object.rotation.copy(rotation);
      }

      // Add to scene
      const newObjects = [...state.objects, { 
        id: crypto.randomUUID(), 
        object, 
        name: state.pendingObject.name, 
        visible: true, 
        locked: false 
      }];

      // Save to history after adding
      setTimeout(() => get().saveToHistory(), 0);

      // Apply persistent modes to the newly placed object
      let newTransformMode = state.persistentTransformMode;
      let newEditMode = state.persistentEditMode;

      // Auto-enable vertex mode for certain geometries if no persistent edit mode is set
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

  // Light management functions
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
          
          // Update the THREE.js light object
          if (updatedLight.object) {
            const threeLight = updatedLight.object;
            
            // Update common properties
            threeLight.intensity = updatedLight.intensity;
            threeLight.color.setStyle(updatedLight.color);
            threeLight.visible = updatedLight.visible;
            threeLight.castShadow = updatedLight.castShadow;
            threeLight.position.set(...updatedLight.position);
            
            // Update type-specific properties
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

      // Update the THREE.js object
      const light = updatedLights.find(l => l.id === lightId);
      if (light?.object) {
        light.object.visible = light.visible;
      }

      get().markUnsavedChanges();

      return { lights: updatedLights };
    }),

  setSelectedLight: (light) => set({ selectedLight: light }),

  // Helper functions
  isObjectLocked: (objectId) => {
    const state = get();
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return false;

    // Check if object itself is locked
    if (obj.locked) return true;

    // Check if object is in a locked group
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

  // Save functions
  markSaved: () => 
    set({
      lastSaved: new Date(),
      hasUnsavedChanges: false
    }),

  markUnsavedChanges: () =>
    set({
      hasUnsavedChanges: true
    }),

  // Camera functions
  setCameraTarget: (target) => 
    set({
      cameraTarget: target.clone()
    }),
}));