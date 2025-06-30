import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

interface LightHelpersProps {
  lights: any[];
  selectedLight: any;
}

const LightHelpers: React.FC<LightHelpersProps> = ({ lights, selectedLight }) => {
  const { setSelectedLight, sceneSettings } = useSceneStore();
  const helpersRef = useRef<{ [key: string]: THREE.Object3D }>({});

  useFrame(() => {
    // Update helper positions and properties
    lights.forEach(light => {
      const helper = helpersRef.current[light.id];
      if (helper && light.visible && sceneSettings.showLightHelpers) {
        // Update helper visibility and properties based on light changes
        helper.visible = true;
      } else if (helper) {
        helper.visible = false;
      }
    });
  });

  // Don't render anything if light helpers are disabled
  if (!sceneSettings.showLightHelpers) {
    return null;
  }

  return (
    <group>
      {lights.map(light => {
        if (!light.visible) return null;

        const isSelected = selectedLight?.id === light.id;
        const helperColor = isSelected ? '#00ff00' : '#ffff00';

        switch (light.type) {
          case 'directional':
            return (
              <group key={light.id}>
                {/* Directional light helper */}
                <mesh
                  position={light.position}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLight(light);
                  }}
                >
                  <sphereGeometry args={[0.1]} />
                  <meshBasicMaterial color={helperColor} />
                </mesh>
                
                {/* Direction indicator */}
                <arrowHelper
                  args={[
                    new THREE.Vector3(...light.target).sub(new THREE.Vector3(...light.position)).normalize(),
                    new THREE.Vector3(...light.position),
                    2,
                    helperColor
                  ]}
                />
              </group>
            );

          case 'point':
            return (
              <group key={light.id}>
                {/* Point light helper */}
                <mesh
                  position={light.position}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLight(light);
                  }}
                >
                  <sphereGeometry args={[0.15]} />
                  <meshBasicMaterial 
                    color={helperColor} 
                    transparent 
                    opacity={isSelected ? 0.8 : 0.6}
                  />
                </mesh>
                
                {/* Range indicator */}
                {light.distance > 0 && (
                  <mesh position={light.position}>
                    <sphereGeometry args={[light.distance]} />
                    <meshBasicMaterial 
                      color={helperColor} 
                      transparent 
                      opacity={0.1} 
                      wireframe 
                    />
                  </mesh>
                )}
              </group>
            );

          case 'spot':
            return (
              <group key={light.id}>
                {/* Spot light helper */}
                <mesh
                  position={light.position}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLight(light);
                  }}
                >
                  <coneGeometry args={[0.1, 0.2, 8]} />
                  <meshBasicMaterial color={helperColor} />
                </mesh>
                
                {/* Cone visualization */}
                <mesh
                  position={[
                    (light.position[0] + light.target[0]) / 2,
                    (light.position[1] + light.target[1]) / 2,
                    (light.position[2] + light.target[2]) / 2
                  ]}
                  lookAt={light.target}
                >
                  <coneGeometry 
                    args={[
                      Math.tan(light.angle) * (light.distance || 10),
                      light.distance || 10,
                      8,
                      1,
                      true
                    ]} 
                  />
                  <meshBasicMaterial 
                    color={helperColor} 
                    transparent 
                    opacity={0.2} 
                    wireframe 
                  />
                </mesh>
              </group>
            );

          default:
            return null;
        }
      })}
    </group>
  );
};

export default LightHelpers;