import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid } from '@react-three/drei';
import { useSceneStore } from '../store/sceneStore';
import LightHelpers from './LightHelpers';
import * as THREE from 'three';

const VertexCoordinates = ({ position, onPositionChange }) => {
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (position) {
      setLocalPosition({
        x: parseFloat(position.x.toFixed(3)),
        y: parseFloat(position.y.toFixed(3)),
        z: parseFloat(position.z.toFixed(3))
      });
    }
  }, [position]);

  if (!position) return null;

  const handleChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newLocalPosition = { ...localPosition, [axis]: numValue };
    setLocalPosition(newLocalPosition);
    
    const newPosition = new THREE.Vector3(
      newLocalPosition.x,
      newLocalPosition.y,
      newLocalPosition.z
    );
    onPositionChange(newPosition);
  };

  const handleKeyDown = (e: React.KeyboardEvent, axis: 'x' | 'y' | 'z') => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="absolute right-4 bottom-4 bg-black/90 text-white p-4 rounded-lg font-mono border border-white/20">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-white/70">Vertex Position</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="w-8 text-sm font-medium">X:</label>
          <input
            type="number"
            value={localPosition.x}
            onChange={(e) => handleChange('x', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'x')}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-gray-700"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-8 text-sm font-medium">Y:</label>
          <input
            type="number"
            value={localPosition.y}
            onChange={(e) => handleChange('y', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'y')}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-gray-700"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-8 text-sm font-medium">Z:</label>
          <input
            type="number"
            value={localPosition.z}
            onChange={(e) => handleChange('z', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'z')}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-gray-700"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
};

const EdgeCoordinates = ({ position, onPositionChange }) => {
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (position) {
      setLocalPosition({
        x: parseFloat(position.x.toFixed(3)),
        y: parseFloat(position.y.toFixed(3)),
        z: parseFloat(position.z.toFixed(3))
      });
    }
  }, [position]);

  if (!position) return null;

  const handleChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newLocalPosition = { ...localPosition, [axis]: numValue };
    setLocalPosition(newLocalPosition);
    
    const newPosition = new THREE.Vector3(
      newLocalPosition.x,
      newLocalPosition.y,
      newLocalPosition.z
    );
    onPositionChange(newPosition);
  };

  const handleKeyDown = (e: React.KeyboardEvent, axis: 'x' | 'y' | 'z') => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="absolute right-4 bottom-4 bg-black/90 text-white p-4 rounded-lg font-mono border border-white/20">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-white/70">Edge Midpoint</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="w-8 text-sm font-medium">X:</label>
          <input
            type="number"
            value={localPosition.x}
            onChange={(e) => handleChange('x', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'x')}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-gray-700"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-8 text-sm font-medium">Y:</label>
          <input
            type="number"
            value={localPosition.y}
            onChange={(e) => handleChange('y', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'y')}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-gray-700"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-8 text-sm font-medium">Z:</label>
          <input
            type="number"
            value={localPosition.z}
            onChange={(e) => handleChange('z', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'z')}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-gray-700"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
};

const VertexCountSelector = () => {
  const { selectedObject, updateCylinderVertices, updateSphereVertices, isObjectLocked } = useSceneStore();

  if (!(selectedObject instanceof THREE.Mesh)) {
    return null;
  }

  // Check if object is locked
  const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === selectedObject);
  if (selectedObj && isObjectLocked(selectedObj.id)) {
    return null;
  }

  const isCylinder = selectedObject.geometry instanceof THREE.CylinderGeometry;
  const isSphere = selectedObject.geometry instanceof THREE.SphereGeometry;

  if (!isCylinder && !isSphere) {
    return null;
  }

  let currentVertexCount;
  let options;
  let onChange;

  if (isCylinder) {
    currentVertexCount = selectedObject.geometry.parameters.radialSegments;
    options = [
      { value: 32, label: '32 Vertices' },
      { value: 16, label: '16 Vertices' },
      { value: 8, label: '8 Vertices' }
    ];
    onChange = updateCylinderVertices;
  } else {
    currentVertexCount = selectedObject.geometry.parameters.widthSegments;
    options = [
      { value: 64, label: '64 Vertices' },
      { value: 32, label: '32 Vertices' },
      { value: 16, label: '16 Vertices' },
      { value: 8, label: '8 Vertices' }
    ];
    onChange = updateSphereVertices;
  }

  return (
    <div className="absolute left-1/2 top-20 -translate-x-1/2 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 border border-white/5 z-10">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-white/90">Vertex Count:</label>
        <select
          className="bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-blue-500/50 min-w-32"
          onChange={(e) => onChange(parseInt(e.target.value))}
          value={currentVertexCount}
        >
          {options.map(({ value, label }) => (
            <option key={value} value={value} className="bg-[#2a2a2a] text-white/90">
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const VertexPoints = ({ geometry, object }) => {
  const { editMode, selectedElements, startVertexDrag, isObjectLocked } = useSceneStore();
  const positions = geometry.attributes.position;
  const vertices = [];
  const worldMatrix = object.matrixWorld;
  
  // Check if object is locked
  const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === object);
  const objectLocked = selectedObj ? isObjectLocked(selectedObj.id) : false;
  
  for (let i = 0; i < positions.count; i++) {
    const vertex = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    ).applyMatrix4(worldMatrix);
    vertices.push(vertex);
  }

  return editMode === 'vertex' ? (
    <group>
      {vertices.map((vertex, i) => (
        <mesh
          key={i}
          position={vertex}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (editMode === 'vertex' && !objectLocked) {
              startVertexDrag(i, vertex);
            }
          }}
        >
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial
            color={objectLocked ? 'gray' : (selectedElements.vertices.includes(i) ? 'red' : 'yellow')}
            transparent
            opacity={objectLocked ? 0.3 : 0.5}
          />
        </mesh>
      ))}
    </group>
  ) : null;
};

const EdgeLines = ({ geometry, object }) => {
  const { 
    editMode, 
    draggedEdge, 
    startEdgeDrag, 
    isDraggingEdge, 
    setIsDraggingEdge, 
    endEdgeDrag,
    selectedElements,
    isObjectLocked
  } = useSceneStore();
  const { camera, raycaster, pointer, gl } = useThree();
  const positions = geometry.attributes.position;
  const edges = [];
  const worldMatrix = object.matrixWorld;
  const plane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());

  // Check if object is locked
  const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === object);
  const objectLocked = selectedObj ? isObjectLocked(selectedObj.id) : false;

  // Get all edges including vertical ones
  const indices = geometry.index ? Array.from(geometry.index.array) : null;
  
  if (indices) {
    // For indexed geometry
    for (let i = 0; i < indices.length; i += 3) {
      const addEdge = (a: number, b: number) => {
        const v1 = new THREE.Vector3(
          positions.getX(indices[a]),
          positions.getY(indices[a]),
          positions.getZ(indices[a])
        ).applyMatrix4(worldMatrix);

        const v2 = new THREE.Vector3(
          positions.getX(indices[b]),
          positions.getY(indices[b]),
          positions.getZ(indices[b])
        ).applyMatrix4(worldMatrix);

        const midpoint = v1.clone().add(v2).multiplyScalar(0.5);

        edges.push({
          vertices: [indices[a], indices[b]],
          positions: [v1, v2],
          midpoint
        });
      };

      // Add all three edges of the triangle
      addEdge(i, i + 1);
      addEdge(i + 1, i + 2);
      addEdge(i + 2, i);
    }
  } else {
    // For non-indexed geometry
    for (let i = 0; i < positions.count; i += 3) {
      const addEdge = (a: number, b: number) => {
        const v1 = new THREE.Vector3(
          positions.getX(a),
          positions.getY(a),
          positions.getZ(a)
        ).applyMatrix4(worldMatrix);

        const v2 = new THREE.Vector3(
          positions.getX(b),
          positions.getY(b),
          positions.getZ(b)
        ).applyMatrix4(worldMatrix);

        const midpoint = v1.clone().add(v2).multiplyScalar(0.5);

        edges.push({
          vertices: [a, b],
          positions: [v1, v2],
          midpoint
        });
      };

      // Add all three edges of the triangle
      addEdge(i, i + 1);
      addEdge(i + 1, i + 2);
      addEdge(i + 2, i);
    }
  }

  // Enhanced edge dragging with proper mouse tracking
  useEffect(() => {
    if (!isDraggingEdge || !draggedEdge || objectLocked) return;

    const handlePointerMove = (event: PointerEvent) => {
      // Prevent default to stop camera movement
      event.preventDefault();

      // Get normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Set up a plane perpendicular to camera for dragging
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      plane.current.setFromNormalAndCoplanarPoint(cameraDirection, draggedEdge.midpoint);

      raycaster.setFromCamera({ x, y }, camera);
      if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
        useSceneStore.getState().updateEdgeDrag(intersection.current);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button === 0) { // Left mouse button
        setIsDraggingEdge(false);
        endEdgeDrag();
      }
    };

    const handleRightClick = (event: MouseEvent) => {
      if (event.button === 2) { // Right click
        event.preventDefault();
        setIsDraggingEdge(false);
        endEdgeDrag();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDraggingEdge(false);
        endEdgeDrag();
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('contextmenu', handleRightClick);
    window.addEventListener('keydown', handleKeyDown);
    
    // Set cursor to indicate dragging
    gl.domElement.style.cursor = 'grabbing';
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('contextmenu', handleRightClick);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Reset cursor
      gl.domElement.style.cursor = '';
    };
  }, [isDraggingEdge, draggedEdge, camera, raycaster, gl, setIsDraggingEdge, endEdgeDrag, objectLocked]);

  const handleEdgeClick = (vertices: [number, number], positions: [THREE.Vector3, THREE.Vector3], midpoint: THREE.Vector3) => {
    if (objectLocked) return;
    // Single click to select and show coordinates
    startEdgeDrag(vertices, positions, midpoint);
  };

  const handleEdgeDoubleClick = (vertices: [number, number], positions: [THREE.Vector3, THREE.Vector3], midpoint: THREE.Vector3) => {
    if (objectLocked) return;
    // Double click to start dragging
    if (!isDraggingEdge) {
      setIsDraggingEdge(true);
      startEdgeDrag(vertices, positions, midpoint);
    }
  };

  return editMode === 'edge' ? (
    <group>
      {edges.map(({ vertices: [v1, v2], positions: [p1, p2], midpoint }, i) => {
        const points = [p1, p2];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const isSelected = draggedEdge?.indices.some(([a, b]) => 
          (a === v1 && b === v2) || (a === v2 && b === v1)
        );
        
        return (
          <group key={i}>
            <line geometry={geometry}>
              <lineBasicMaterial
                color={objectLocked ? 'gray' : (isSelected ? 'red' : 'yellow')}
                linewidth={isSelected ? 3 : 2}
                transparent={objectLocked}
                opacity={objectLocked ? 0.3 : 1}
              />
            </line>
            <mesh
              position={midpoint}
              onClick={(e) => {
                e.stopPropagation();
                handleEdgeClick([v1, v2], [p1, p2], midpoint);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleEdgeDoubleClick([v1, v2], [p1, p2], midpoint);
              }}
            >
              <sphereGeometry args={[0.08]} />
              <meshBasicMaterial
                color={objectLocked ? 'gray' : (isSelected ? 'red' : 'yellow')}
                transparent
                opacity={objectLocked ? 0.3 : (isSelected ? 0.9 : 0.7)}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  ) : null;
};

// Enhanced vertex dragging component with improved mouse tracking
const VertexDragController = () => {
  const { 
    selectedObject, 
    editMode,
    draggedVertex,
    updateVertexDrag,
    endVertexDrag,
    isObjectLocked
  } = useSceneStore();
  const { camera, raycaster, pointer, gl } = useThree();
  const isDraggingRef = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane());
  const intersectionRef = useRef(new THREE.Vector3());
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const dragStartDepthRef = useRef(0);

  useEffect(() => {
    if (!selectedObject || !editMode || !(selectedObject instanceof THREE.Mesh) || !draggedVertex) return;

    // Check if object is locked
    const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === selectedObject);
    const objectLocked = selectedObj ? isObjectLocked(selectedObj.id) : false;
    if (objectLocked) return;

    // Calculate the initial depth of the vertex from the camera
    const vertexWorldPos = draggedVertex.position.clone();
    vertexWorldPos.applyMatrix4(selectedObject.matrixWorld);
    const cameraToVertex = vertexWorldPos.clone().sub(camera.position);
    dragStartDepthRef.current = cameraToVertex.length();

    // Set up the drag plane perpendicular to the camera direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(cameraDirection, vertexWorldPos);

    isDraggingRef.current = true;

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || !draggedVertex) return;

      // Prevent default to stop any browser behavior
      event.preventDefault();

      // Get normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Cast ray from camera through mouse position
      raycaster.setFromCamera({ x, y }, camera);

      // Find intersection with the drag plane
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, intersectionRef.current)) {
        // Convert world position back to local object space
        const localPosition = intersectionRef.current.clone();
        const inverseMatrix = selectedObject.matrixWorld.clone().invert();
        localPosition.applyMatrix4(inverseMatrix);
        
        // Update the vertex position
        updateVertexDrag(localPosition);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button === 0) { // Left mouse button
        isDraggingRef.current = false;
        endVertexDrag();
      }
    };

    const handleRightClick = (event: MouseEvent) => {
      if (event.button === 2) { // Right click
        event.preventDefault();
        isDraggingRef.current = false;
        endVertexDrag();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        isDraggingRef.current = false;
        endVertexDrag();
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('contextmenu', handleRightClick);
    window.addEventListener('keydown', handleKeyDown);
    
    // Set cursor to indicate dragging
    gl.domElement.style.cursor = 'grabbing';
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('contextmenu', handleRightClick);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Reset cursor
      gl.domElement.style.cursor = '';
      isDraggingRef.current = false;
    };
  }, [
    selectedObject,
    editMode,
    camera,
    raycaster,
    draggedVertex,
    updateVertexDrag,
    endVertexDrag,
    isObjectLocked,
    gl
  ]);

  return null; // This component only handles events, no rendering
};

const EditModeOverlay = () => {
  const { 
    selectedObject, 
    editMode,
    setSelectedElements,
    isObjectLocked
  } = useSceneStore();

  if (!selectedObject || !editMode || !(selectedObject instanceof THREE.Mesh)) return null;

  return (
    <>
      <VertexPoints geometry={selectedObject.geometry} object={selectedObject} />
      <EdgeLines geometry={selectedObject.geometry} object={selectedObject} />
      <VertexDragController />
    </>
  );
};

// Scene Lights Component
const SceneLights = () => {
  const { lights } = useSceneStore();

  return (
    <group>
      {lights.map(light => {
        if (!light.visible || !light.object) return null;
        
        return <primitive key={light.id} object={light.object} />;
      })}
    </group>
  );
};

// Camera controller component with improved zoom behavior
const CameraController = () => {
  const { camera } = useThree();
  const { 
    cameraPerspective, 
    cameraZoom, 
    draggedVertex, 
    isDraggingEdge, 
    cameraTarget, 
    setCameraTarget 
  } = useSceneStore();
  const controlsRef = useRef();

  // Update camera target only when controls are disabled (during vertex/edge dragging)
  useEffect(() => {
    if (controlsRef.current && controlsRef.current.target && (draggedVertex || isDraggingEdge)) {
      setCameraTarget(controlsRef.current.target);
    }
  }, [draggedVertex, isDraggingEdge, setCameraTarget]);

  useEffect(() => {
    if (!camera || !controlsRef.current) return;

    const controls = controlsRef.current;
    
    // For perspective view, maintain current camera position and target for zoom
    if (cameraPerspective === 'perspective') {
      // Get current camera direction and distance
      const currentTarget = controls.target || cameraTarget;
      const currentDirection = camera.position.clone().sub(currentTarget).normalize();
      const baseDistance = 10; // Base distance for zoom level 1
      const distance = baseDistance / cameraZoom;
      
      // Set new camera position maintaining direction but adjusting distance
      const newPosition = currentTarget.clone().add(currentDirection.multiplyScalar(distance));
      camera.position.copy(newPosition);
      camera.lookAt(currentTarget);
      camera.up.set(0, 1, 0);
    } else {
      // For orthographic views, use fixed positions with zoom
      const distance = 10 / cameraZoom;
      const target = controls.target || new THREE.Vector3(0, 0, 0);

      switch (cameraPerspective) {
        case 'front':
          camera.position.copy(target.clone().add(new THREE.Vector3(0, 0, distance)));
          camera.lookAt(target);
          camera.up.set(0, 1, 0);
          break;
        case 'back':
          camera.position.copy(target.clone().add(new THREE.Vector3(0, 0, -distance)));
          camera.lookAt(target);
          camera.up.set(0, 1, 0);
          break;
        case 'right':
          camera.position.copy(target.clone().add(new THREE.Vector3(distance, 0, 0)));
          camera.lookAt(target);
          camera.up.set(0, 1, 0);
          break;
        case 'left':
          camera.position.copy(target.clone().add(new THREE.Vector3(-distance, 0, 0)));
          camera.lookAt(target);
          camera.up.set(0, 1, 0);
          break;
        case 'top':
          camera.position.copy(target.clone().add(new THREE.Vector3(0, distance, 0)));
          camera.lookAt(target);
          camera.up.set(0, 0, -1);
          break;
        case 'bottom':
          camera.position.copy(target.clone().add(new THREE.Vector3(0, -distance, 0)));
          camera.lookAt(target);
          camera.up.set(0, 0, 1);
          break;
      }
    }

    // Update controls
    if (controls.target) {
      // Don't reset target for perspective view during zoom
      if (cameraPerspective !== 'perspective') {
        controls.target.set(0, 0, 0);
      }
    }
    controls.update();
  }, [cameraPerspective, camera, cameraZoom, cameraTarget]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle numpad keys when not typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

      const { setCameraPerspective } = useSceneStore.getState();

      switch (event.code) {
        case 'Numpad0':
          setCameraPerspective('perspective');
          break;
        case 'Numpad1':
          if (event.ctrlKey) {
            setCameraPerspective('back');
          } else {
            setCameraPerspective('front');
          }
          break;
        case 'Numpad3':
          if (event.ctrlKey) {
            setCameraPerspective('left');
          } else {
            setCameraPerspective('right');
          }
          break;
        case 'Numpad7':
          if (event.ctrlKey) {
            setCameraPerspective('bottom');
          } else {
            setCameraPerspective('top');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enabled={!draggedVertex && !isDraggingEdge} // Disable controls when dragging vertices or edges
    />
  );
};

// Enhanced placement helper component with surface-oriented placement
const PlacementHelper = () => {
  const { placementMode, pendingObject, placeObjectAt, cancelObjectPlacement, objects } = useSceneStore();
  const { camera, raycaster, pointer, scene } = useThree();
  const [hoverPosition, setHoverPosition] = useState<THREE.Vector3 | null>(null);
  const [surfaceNormal, setSurfaceNormal] = useState<THREE.Vector3 | null>(null);
  const [objectRotation, setObjectRotation] = useState<THREE.Euler | null>(null);

  // Helper function to get bounding box of an object
  const getObjectBoundingBox = (object: THREE.Object3D) => {
    const box = new THREE.Box3();
    
    if (object instanceof THREE.Mesh) {
      box.setFromObject(object);
    } else if (object instanceof THREE.Group) {
      // For groups, compute bounding box of all children
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const childBox = new THREE.Box3().setFromObject(child);
          box.union(childBox);
        }
      });
    }
    
    return box;
  };

  // Helper function to get approximate bounding box for pending object
  const getPendingObjectBoundingBox = (position: THREE.Vector3, rotation?: THREE.Euler) => {
    if (!pendingObject) return new THREE.Box3();

    const geometryOrGroup = pendingObject.geometry();
    let tempObject: THREE.Object3D;

    if (geometryOrGroup instanceof THREE.Group) {
      tempObject = geometryOrGroup.clone();
    } else {
      const material = new THREE.MeshStandardMaterial();
      tempObject = new THREE.Mesh(geometryOrGroup, material);
    }

    tempObject.position.copy(position);
    if (rotation) {
      tempObject.rotation.copy(rotation);
    }
    
    const box = getObjectBoundingBox(tempObject);
    
    // Clean up
    if (tempObject instanceof THREE.Mesh) {
      tempObject.geometry.dispose();
      (tempObject.material as THREE.Material).dispose();
    }

    return box;
  };

  // Calculate object orientation based on surface normal
  const calculateObjectOrientation = (normal: THREE.Vector3) => {
    // Default up vector for objects (Y-axis)
    const objectUp = new THREE.Vector3(0, 1, 0);
    
    // Calculate rotation to align object's up vector with surface normal
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(objectUp, normal);
    
    return new THREE.Euler().setFromQuaternion(quaternion);
  };

  // Get object dimensions in its current orientation
  const getOrientedObjectDimensions = (rotation: THREE.Euler) => {
    if (!pendingObject) return { width: 1, height: 1, depth: 1 };

    // Create a temporary object to measure dimensions
    const geometryOrGroup = pendingObject.geometry();
    let tempObject: THREE.Object3D;

    if (geometryOrGroup instanceof THREE.Group) {
      tempObject = geometryOrGroup.clone();
    } else {
      const material = new THREE.MeshStandardMaterial();
      tempObject = new THREE.Mesh(geometryOrGroup, material);
    }

    // Apply rotation
    tempObject.rotation.copy(rotation);
    tempObject.updateMatrixWorld();

    // Get bounding box in world space
    const box = new THREE.Box3().setFromObject(tempObject);
    
    const dimensions = {
      width: box.max.x - box.min.x,
      height: box.max.y - box.min.y,
      depth: box.max.z - box.min.z
    };

    // Clean up
    if (tempObject instanceof THREE.Mesh) {
      tempObject.geometry.dispose();
      (tempObject.material as THREE.Material).dispose();
    }

    return dimensions;
  };

  // Check if object is a nature object that should be placed with base at cursor
  const isNatureObject = (objectName: string) => {
    const natureNames = [
      'Pine Tree', 'Oak Tree', 'Flower', 
      'Boulder', 'Small Rock', 'Grass Patch'
    ];
    return natureNames.includes(objectName);
  };

  // Enhanced placement logic with proper base positioning for nature objects
  const findPlacementPosition = (intersectionPoint: THREE.Vector3, normal?: THREE.Vector3) => {
    if (!pendingObject) return { position: intersectionPoint, rotation: null };

    let rotation: THREE.Euler | null = null;
    let offsetDistance = 0;

    // Check if this is a nature object
    const isNature = isNatureObject(pendingObject.name);

    // If we have a surface normal, orient the object to the surface
    if (normal) {
      rotation = calculateObjectOrientation(normal);
      
      if (isNature) {
        // For nature objects, place the base exactly at the intersection point
        offsetDistance = 0;
      } else {
        // For regular objects, use the smallest dimension as offset
        const dimensions = getOrientedObjectDimensions(rotation);
        offsetDistance = Math.min(dimensions.width, dimensions.height, dimensions.depth) / 2;
        
        // For very flat surfaces (like ground), use height
        if (Math.abs(normal.y) > 0.9) {
          offsetDistance = dimensions.height / 2;
        }
      }
    } else {
      // Fallback: use default orientation
      if (isNature) {
        // For nature objects without normal, place base at intersection
        offsetDistance = 0;
      } else {
        // For regular objects, use height offset
        const tempBox = getPendingObjectBoundingBox(intersectionPoint);
        offsetDistance = (tempBox.max.y - tempBox.min.y) / 2;
      }
    }

    // Calculate final position
    let finalPosition: THREE.Vector3;
    
    if (isNature) {
      // For nature objects, place base exactly at intersection point
      finalPosition = intersectionPoint.clone();
      
      // Only apply minimal offset if we're on a surface with normal
      if (normal && Math.abs(normal.y) < 0.9) {
        // On angled surfaces, apply small offset to prevent clipping
        finalPosition.add(normal.clone().multiplyScalar(0.01));
      }
    } else {
      // For regular objects, apply proper offset
      finalPosition = normal 
        ? intersectionPoint.clone().add(normal.clone().multiplyScalar(offsetDistance))
        : new THREE.Vector3(intersectionPoint.x, intersectionPoint.y + offsetDistance, intersectionPoint.z);
    }

    return { position: finalPosition, rotation };
  };

  useEffect(() => {
    if (!placementMode) return;

    const handlePointerMove = (event) => {
      // Cast ray from camera through mouse position
      raycaster.setFromCamera(pointer, camera);
      
      // Check intersections with existing objects first
      const intersects = raycaster.intersectObjects(
        objects.filter(obj => obj.visible).map(obj => obj.object), 
        true
      );

      let targetPosition: THREE.Vector3;
      let normal: THREE.Vector3 | null = null;

      if (intersects.length > 0) {
        // Hit an existing object - use the intersection point and normal
        const intersection = intersects[0];
        targetPosition = intersection.point;
        normal = intersection.face?.normal?.clone();
        
        // Transform normal to world space
        if (normal && intersection.object) {
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
          normal.applyMatrix3(normalMatrix).normalize();
        }
        
        setSurfaceNormal(normal);
      } else {
        // Check intersection with ground plane at Y=0
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
          targetPosition = intersection;
          normal = new THREE.Vector3(0, 1, 0); // Ground normal
          setSurfaceNormal(normal);
        } else {
          return; // No valid intersection
        }
      }

      // Find the best placement position and orientation
      const { position, rotation } = findPlacementPosition(targetPosition, normal);
      
      setHoverPosition(position);
      setObjectRotation(rotation);
    };

    const handleClick = (event) => {
      if (event.button === 0 && hoverPosition) { // Left click
        placeObjectAt(hoverPosition, objectRotation);
        setHoverPosition(null);
        setSurfaceNormal(null);
        setObjectRotation(null);
      }
    };

    const handleRightClick = (event) => {
      if (event.button === 2) { // Right click
        event.preventDefault();
        cancelObjectPlacement();
        setHoverPosition(null);
        setSurfaceNormal(null);
        setObjectRotation(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        cancelObjectPlacement();
        setHoverPosition(null);
        setSurfaceNormal(null);
        setObjectRotation(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleRightClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleRightClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [placementMode, hoverPosition, camera, raycaster, pointer, placeObjectAt, cancelObjectPlacement, objects, pendingObject, objectRotation]);

  if (!placementMode || !hoverPosition || !pendingObject) return null;

  // Create preview object with proper orientation
  const geometryOrGroup = pendingObject.geometry();
  let previewObject;

  if (geometryOrGroup instanceof THREE.Group) {
    previewObject = geometryOrGroup.clone();
  } else {
    const material = new THREE.MeshStandardMaterial({ 
      color: pendingObject.color || '#44aa88',
      transparent: true,
      opacity: 0.6
    });
    previewObject = new THREE.Mesh(geometryOrGroup, material);
  }

  // Apply rotation if calculated
  if (objectRotation) {
    previewObject.rotation.copy(objectRotation);
  }

  return (
    <group>
      <primitive 
        object={previewObject} 
        position={hoverPosition}
      />
      
      {/* Surface normal indicator */}
      {surfaceNormal && (
        <arrowHelper
          args={[
            surfaceNormal,
            hoverPosition,
            1,
            '#00ff00'
          ]}
        />
      )}
    </group>
  );
};

const Scene: React.FC = () => {
  const { 
    objects, 
    lights,
    selectedLight,
    selectedObject, 
    setSelectedObject, 
    transformMode, 
    editMode, 
    draggedVertex, 
    draggedEdge,
    selectedElements, 
    updateVertexDrag,
    updateEdgeDrag,
    canSelectObject,
    placementMode,
    sceneSettings
  } = useSceneStore();
  const [selectedPosition, setSelectedPosition] = useState<THREE.Vector3 | null>(null);
  const [selectedEdgePosition, setSelectedEdgePosition] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (editMode === 'vertex' && selectedObject instanceof THREE.Mesh) {
      if (draggedVertex) {
        setSelectedPosition(draggedVertex.position);
      } else if (selectedElements.vertices.length > 0) {
        const geometry = selectedObject.geometry;
        const positions = geometry.attributes.position;
        const vertexIndex = selectedElements.vertices[0];
        const position = new THREE.Vector3(
          positions.getX(vertexIndex),
          positions.getY(vertexIndex),
          positions.getZ(vertexIndex)
        );
        position.applyMatrix4(selectedObject.matrixWorld);
        setSelectedPosition(position);
      } else {
        setSelectedPosition(null);
      }
    } else {
      setSelectedPosition(null);
    }
  }, [editMode, selectedObject, draggedVertex, selectedElements.vertices]);

  useEffect(() => {
    if (editMode === 'edge' && selectedObject instanceof THREE.Mesh) {
      if (draggedEdge) {
        setSelectedEdgePosition(draggedEdge.midpoint);
      } else {
        setSelectedEdgePosition(null);
      }
    } else {
      setSelectedEdgePosition(null);
    }
  }, [editMode, selectedObject, draggedEdge]);

  const handleVertexPositionChange = (newPosition: THREE.Vector3) => {
    if (selectedObject instanceof THREE.Mesh && draggedVertex) {
      // Convert world position back to local position
      const localPosition = newPosition.clone();
      const inverseMatrix = selectedObject.matrixWorld.clone().invert();
      localPosition.applyMatrix4(inverseMatrix);
      
      updateVertexDrag(localPosition);
      
      // Update the displayed position to match the world position
      setSelectedPosition(newPosition);
    }
  };

  const handleEdgePositionChange = (newPosition: THREE.Vector3) => {
    if (selectedObject instanceof THREE.Mesh && draggedEdge) {
      updateEdgeDrag(newPosition);
      setSelectedEdgePosition(newPosition);
    }
  };

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        className="w-full h-full"
        style={{ backgroundColor: sceneSettings.backgroundColor }}
        onContextMenu={(e) => e.preventDefault()} // Prevent default right-click menu
        shadows
      >
        {/* Default Scene Lighting - Always present for basic illumination */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* User-created Scene Lights */}
        <SceneLights />
        
        {sceneSettings.showGrid && (
          <Grid
            infiniteGrid
            cellSize={1}
            sectionSize={3}
            fadeDistance={30}
            fadeStrength={1}
          />
        )}

        {objects.map(({ object, visible, id }) => (
          visible && (
            <primitive
              key={id}
              object={object}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                if (!placementMode && canSelectObject(object)) {
                  setSelectedObject(object);
                }
              }}
            />
          )
        ))}

        {selectedObject && transformMode && canSelectObject(selectedObject) && !placementMode && (
          <TransformControls
            object={selectedObject}
            mode={transformMode}
          />
        )}

        <EditModeOverlay />
        <PlacementHelper />
        <LightHelpers lights={lights} selectedLight={selectedLight} />
        <CameraController />
      </Canvas>
      
      {editMode === 'vertex' && selectedPosition && (
        <VertexCoordinates 
          position={selectedPosition}
          onPositionChange={handleVertexPositionChange}
        />
      )}
      {editMode === 'edge' && selectedEdgePosition && (
        <EdgeCoordinates 
          position={selectedEdgePosition}
          onPositionChange={handleEdgePositionChange}
        />
      )}
      {editMode === 'vertex' && selectedObject && !(selectedObject.geometry instanceof THREE.ConeGeometry) && (
        <VertexCountSelector />
      )}
    </div>
  );
};

export default Scene;