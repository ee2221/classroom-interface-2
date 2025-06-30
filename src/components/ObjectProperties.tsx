import React, { useState, useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import * as THREE from 'three';

const ObjectProperties: React.FC = () => {
  const { selectedObject, updateObjectProperties, updateObjectColor, updateObjectOpacity, isObjectLocked } = useSceneStore();
  const [localOpacity, setLocalOpacity] = useState(1);
  const [showWireframe, setShowWireframe] = useState(false);
  const [wireframeColor, setWireframeColor] = useState('#ffffff');
  const [wireframeOpacity, setWireframeOpacity] = useState(1);
  const [wireframeLinewidth, setWireframeLinewidth] = useState(1);

  const getMaterial = () => {
    if (selectedObject instanceof THREE.Mesh) {
      return selectedObject.material as THREE.MeshStandardMaterial;
    }
    return null;
  };

  const getWireframeMaterial = () => {
    if (selectedObject instanceof THREE.Mesh) {
      // Check if wireframe material already exists as userData
      return selectedObject.userData.wireframeMaterial as THREE.LineBasicMaterial | undefined;
    }
    return null;
  };

  const getWireframeObject = () => {
    if (selectedObject instanceof THREE.Mesh) {
      return selectedObject.userData.wireframeObject as THREE.LineSegments | undefined;
    }
    return null;
  };

  const material = getMaterial();
  const currentColor = material ? '#' + material.color.getHexString() : '#44aa88';

  // Check if selected object is locked
  const selectedObj = useSceneStore.getState().objects.find(obj => obj.object === selectedObject);
  const objectLocked = selectedObj ? isObjectLocked(selectedObj.id) : false;

  useEffect(() => {
    if (material) {
      setLocalOpacity(material.opacity);
    }

    // Initialize wireframe state
    if (selectedObject instanceof THREE.Mesh) {
      const wireframeObj = getWireframeObject();
      const wireframeMat = getWireframeMaterial();
      
      setShowWireframe(!!wireframeObj && wireframeObj.visible);
      
      if (wireframeMat) {
        setWireframeColor('#' + wireframeMat.color.getHexString());
        setWireframeOpacity(wireframeMat.opacity);
        // Get linewidth from userData since THREE.js doesn't support it directly in WebGL
        setWireframeLinewidth(selectedObject.userData.wireframeLinewidth || 1);
      }
    }
  }, [selectedObject, material]);

  if (!selectedObject) return null;

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (objectLocked) return;
    selectedObject.position[axis] = value;
    updateObjectProperties();
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (objectLocked) return;
    selectedObject.rotation[axis] = (value * Math.PI) / 180;
    updateObjectProperties();
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (objectLocked) return;
    selectedObject.scale[axis] = value;
    updateObjectProperties();
  };

  const handleOpacityChange = (value: number) => {
    if (objectLocked) return;
    setLocalOpacity(value);
    updateObjectOpacity(value);
  };

  const handleColorChange = (color: string) => {
    if (objectLocked) return;
    updateObjectColor(color);
  };

  const createWireframeGeometry = (geometry: THREE.BufferGeometry) => {
    // Create edges geometry for wireframe
    const edges = new THREE.EdgesGeometry(geometry);
    return edges;
  };

  const createThickWireframe = (geometry: THREE.BufferGeometry, linewidth: number) => {
    // For thick lines, we need to use a different approach since WebGL doesn't support linewidth > 1
    // We'll create tube geometry along the edges
    if (linewidth <= 1) {
      return createWireframeGeometry(geometry);
    }

    const edges = new THREE.EdgesGeometry(geometry);
    const positions = edges.attributes.position;
    const group = new THREE.Group();

    // Create tubes for each edge
    for (let i = 0; i < positions.count; i += 2) {
      const start = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const end = new THREE.Vector3(
        positions.getX(i + 1),
        positions.getY(i + 1),
        positions.getZ(i + 1)
      );

      const direction = end.clone().sub(start);
      const length = direction.length();
      
      if (length > 0.001) { // Avoid zero-length edges
        const tubeGeometry = new THREE.CylinderGeometry(
          linewidth * 0.01, // radius based on linewidth
          linewidth * 0.01,
          length,
          4 // low segment count for performance
        );

        const tubeMesh = new THREE.Mesh(tubeGeometry);
        
        // Position and orient the tube
        tubeMesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
        tubeMesh.lookAt(end);
        tubeMesh.rotateX(Math.PI / 2);

        group.add(tubeMesh);
      }
    }

    return group;
  };

  const toggleWireframe = () => {
    if (objectLocked || !(selectedObject instanceof THREE.Mesh)) return;

    const newShowWireframe = !showWireframe;
    setShowWireframe(newShowWireframe);

    if (newShowWireframe) {
      // Create wireframe if it doesn't exist
      let wireframeObj = getWireframeObject();
      let wireframeMat = getWireframeMaterial();

      if (!wireframeObj || !wireframeMat) {
        // Create new wireframe
        wireframeMat = new THREE.LineBasicMaterial({
          color: wireframeColor,
          transparent: true,
          opacity: wireframeOpacity
        });

        if (wireframeLinewidth <= 1) {
          // Use standard line segments for thin lines
          const wireframeGeometry = createWireframeGeometry(selectedObject.geometry);
          wireframeObj = new THREE.LineSegments(wireframeGeometry, wireframeMat);
        } else {
          // Use tube geometry for thick lines
          const thickWireframe = createThickWireframe(selectedObject.geometry, wireframeLinewidth);
          wireframeObj = thickWireframe;
          
          // Apply material to all children if it's a group
          if (thickWireframe instanceof THREE.Group) {
            thickWireframe.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = wireframeMat;
              }
            });
          }
        }
        
        // Store references
        selectedObject.userData.wireframeObject = wireframeObj;
        selectedObject.userData.wireframeMaterial = wireframeMat;
        selectedObject.userData.wireframeLinewidth = wireframeLinewidth;
        
        // Add to the mesh
        selectedObject.add(wireframeObj);
      }

      wireframeObj.visible = true;
    } else {
      // Hide wireframe
      const wireframeObj = getWireframeObject();
      if (wireframeObj) {
        wireframeObj.visible = false;
      }
    }

    updateObjectProperties();
  };

  const handleWireframeColorChange = (color: string) => {
    if (objectLocked) return;
    setWireframeColor(color);

    const wireframeMat = getWireframeMaterial();
    if (wireframeMat) {
      wireframeMat.color.setStyle(color);
      wireframeMat.needsUpdate = true;
    }
  };

  const handleWireframeOpacityChange = (opacity: number) => {
    if (objectLocked) return;
    setWireframeOpacity(opacity);

    const wireframeMat = getWireframeMaterial();
    if (wireframeMat) {
      wireframeMat.opacity = opacity;
      wireframeMat.transparent = opacity < 1;
      wireframeMat.needsUpdate = true;
    }
  };

  const handleWireframeLinewidthChange = (linewidth: number) => {
    if (objectLocked || !(selectedObject instanceof THREE.Mesh)) return;
    setWireframeLinewidth(linewidth);

    // Store the linewidth value
    selectedObject.userData.wireframeLinewidth = linewidth;

    // Recreate wireframe with new linewidth if it's currently visible
    if (showWireframe) {
      const oldWireframeObj = getWireframeObject();
      const wireframeMat = getWireframeMaterial();
      
      if (oldWireframeObj && wireframeMat) {
        // Remove old wireframe
        selectedObject.remove(oldWireframeObj);
        
        // Dispose of old geometry
        if (oldWireframeObj instanceof THREE.LineSegments) {
          oldWireframeObj.geometry.dispose();
        } else if (oldWireframeObj instanceof THREE.Group) {
          oldWireframeObj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
            }
          });
        }

        // Create new wireframe with updated linewidth
        let newWireframeObj;
        
        if (linewidth <= 1) {
          // Use standard line segments for thin lines
          const wireframeGeometry = createWireframeGeometry(selectedObject.geometry);
          newWireframeObj = new THREE.LineSegments(wireframeGeometry, wireframeMat);
        } else {
          // Use tube geometry for thick lines
          const thickWireframe = createThickWireframe(selectedObject.geometry, linewidth);
          newWireframeObj = thickWireframe;
          
          // Apply material to all children if it's a group
          if (thickWireframe instanceof THREE.Group) {
            thickWireframe.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = wireframeMat;
              }
            });
          }
        }

        // Update reference and add to mesh
        selectedObject.userData.wireframeObject = newWireframeObj;
        selectedObject.add(newWireframeObj);
      }
    }

    updateObjectProperties();
  };

  return (
    <div className="absolute top-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 w-64 border border-white/5 max-h-[85vh] overflow-y-auto z-40"
         style={{ 
           right: '360px' // Position to the left of the layers panel (320px width + 40px margin)
         }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white/90">Properties</h2>
          {objectLocked && <Lock className="w-4 h-4 text-orange-400" />}
        </div>
        <button
          onClick={() => useSceneStore.getState().setSelectedObject(null)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {objectLocked && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-sm text-orange-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Object is locked
          </p>
          <p className="text-xs text-white/50 mt-1">
            Unlock to modify properties
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Position</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`pos-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={selectedObject.position[axis]}
                  onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                  step="0.1"
                  disabled={objectLocked}
                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Rotation (degrees)</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`rot-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={(selectedObject.rotation[axis] * 180) / Math.PI}
                  onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value))}
                  step="5"
                  disabled={objectLocked}
                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Scale</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`scale-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={selectedObject.scale[axis]}
                  onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value))}
                  step="0.1"
                  min="0.1"
                  disabled={objectLocked}
                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {material && (
          <>
            <div>
              <h3 className="font-medium mb-2 text-white/70 text-sm">Surface Color</h3>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={objectLocked}
                  className={`w-12 h-8 rounded cursor-pointer border ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 cursor-not-allowed opacity-50'
                      : 'bg-[#2a2a2a] border-white/10'
                  }`}
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={objectLocked}
                  className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                  }`}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-white/70 text-sm">Surface Opacity</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localOpacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  disabled={objectLocked}
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                    objectLocked 
                      ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                      : 'bg-[#2a2a2a]'
                  }`}
                />
                <span className={`text-sm w-12 text-right ${
                  objectLocked ? 'text-white/30' : 'text-white/90'
                }`}>
                  {Math.round(localOpacity * 100)}%
                </span>
              </div>
            </div>

            {/* Edge/Wireframe Properties */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white/70 text-sm">Edges & Wireframe</h3>
                <button
                  onClick={toggleWireframe}
                  disabled={objectLocked}
                  className={`p-1.5 rounded-lg transition-colors ${
                    objectLocked
                      ? 'text-white/30 cursor-not-allowed'
                      : showWireframe
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-white/10 text-white/70'
                  }`}
                  title={objectLocked ? 'Object is locked' : (showWireframe ? 'Hide Wireframe' : 'Show Wireframe')}
                >
                  {showWireframe ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {showWireframe && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-2">Edge Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={wireframeColor}
                        onChange={(e) => handleWireframeColorChange(e.target.value)}
                        disabled={objectLocked}
                        className={`w-12 h-8 rounded cursor-pointer border ${
                          objectLocked 
                            ? 'bg-[#1a1a1a] border-white/5 cursor-not-allowed opacity-50'
                            : 'bg-[#2a2a2a] border-white/10'
                        }`}
                      />
                      <input
                        type="text"
                        value={wireframeColor}
                        onChange={(e) => handleWireframeColorChange(e.target.value)}
                        disabled={objectLocked}
                        className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none ${
                          objectLocked 
                            ? 'bg-[#1a1a1a] border-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-[#2a2a2a] border-white/10 text-white/90 focus:border-blue-500/50'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-2">Edge Opacity</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={wireframeOpacity}
                        onChange={(e) => handleWireframeOpacityChange(parseFloat(e.target.value))}
                        disabled={objectLocked}
                        className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                          objectLocked 
                            ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                            : 'bg-[#2a2a2a]'
                        }`}
                      />
                      <span className={`text-sm w-12 text-right ${
                        objectLocked ? 'text-white/30' : 'text-white/90'
                      }`}>
                        {Math.round(wireframeOpacity * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-2">
                      Line Thickness
                      {wireframeLinewidth > 1 && (
                        <span className="text-xs text-blue-400 ml-1">(3D tubes)</span>
                      )}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={wireframeLinewidth}
                        onChange={(e) => handleWireframeLinewidthChange(parseFloat(e.target.value))}
                        disabled={objectLocked}
                        className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                          objectLocked 
                            ? 'bg-[#1a1a1a] cursor-not-allowed opacity-50'
                            : 'bg-[#2a2a2a]'
                        }`}
                      />
                      <span className={`text-sm w-12 text-right ${
                        objectLocked ? 'text-white/30' : 'text-white/90'
                      }`}>
                        {wireframeLinewidth}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      {wireframeLinewidth <= 1 
                        ? 'Thin lines (standard wireframe)'
                        : 'Thick lines (3D tube geometry)'
                      }
                    </p>
                  </div>
                </div>
              )}

              {!showWireframe && (
                <div className="text-center py-4 text-white/50">
                  <p className="text-xs">Click the eye icon to show wireframe</p>
                  <p className="text-xs mt-1">Customize edge appearance</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ObjectProperties;