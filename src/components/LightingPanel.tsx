import React, { useState, useRef, useEffect } from 'react';
import { 
  Lightbulb, 
  Sun, 
  Zap, 
  Target,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  Move3D,
  Palette,
  Gauge,
  ChevronLeft,
  ChevronUp,
  GripHorizontal,
  Zap as LightHelperIcon
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const LightingPanel: React.FC = () => {
  const { 
    lights, 
    selectedLight,
    addLight,
    removeLight,
    updateLight,
    toggleLightVisibility,
    setSelectedLight,
    selectedObject,
    sceneSettings,
    updateSceneSettings
  } = useSceneStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['lights']);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom right
  useEffect(() => {
    if (panelRef.current && position.x === 0 && position.y === 0) {
      const rect = panelRef.current.getBoundingClientRect();
      const rightX = window.innerWidth - rect.width - 16; // 16px from right
      const bottomY = window.innerHeight - rect.height - 16; // 16px from bottom
      setPosition({ x: rightX, y: bottomY });
    }
  }, []);

  // Handle mouse down on drag handle
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    
    // Prevent text selection while dragging
    e.preventDefault();
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 0);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Add dragging cursor to body
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Reset cursor and selection
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  // Handle window resize to keep panel in bounds
  useEffect(() => {
    const handleResize = () => {
      if (!panelRef.current) return;
      
      const maxX = window.innerWidth - panelRef.current.offsetWidth;
      const maxY = window.innerHeight - panelRef.current.offsetHeight;
      
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const lightTypes = [
    {
      type: 'directional',
      name: 'Directional Light',
      icon: Sun,
      description: 'Parallel rays like sunlight'
    },
    {
      type: 'point',
      name: 'Point Light',
      icon: Lightbulb,
      description: 'Omnidirectional like a bulb'
    },
    {
      type: 'spot',
      name: 'Spot Light',
      icon: Zap,
      description: 'Focused cone of light'
    }
  ] as const;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleAddLight = (type: 'directional' | 'point' | 'spot') => {
    const position = selectedObject 
      ? [
          selectedObject.position.x + 2,
          selectedObject.position.y + 2,
          selectedObject.position.z + 2
        ]
      : [2, 2, 2];

    addLight(type, position);
    setShowAddMenu(false);
  };

  const handleLightPropertyChange = (lightId: string, property: string, value: any) => {
    updateLight(lightId, { [property]: value });
  };

  const formatPosition = (position: number[]) => {
    return position.map(p => p.toFixed(1)).join(', ');
  };

  // Helper function to format intensity display
  const formatIntensity = (intensity: number) => {
    if (intensity >= 1) {
      return intensity.toFixed(1);
    } else if (intensity >= 0.1) {
      return intensity.toFixed(2);
    } else {
      return intensity.toFixed(3);
    }
  };

  // Helper function to get intensity step based on current value
  const getIntensityStep = (intensity: number) => {
    if (intensity >= 1) {
      return 0.1;
    } else if (intensity >= 0.1) {
      return 0.01;
    } else {
      return 0.001;
    }
  };

  const handleLightHelpersToggle = () => {
    updateSceneSettings({ showLightHelpers: !sceneSettings.showLightHelpers });
  };

  // Collapsed state - just a small tab with only expand arrow clickable
  if (isCollapsed) {
    return (
      <div 
        ref={panelRef}
        className="absolute bg-[#1a1a1a] rounded-lg shadow-2xl shadow-black/20 border border-white/5 z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="p-3 flex items-center gap-2 text-white/90">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium">Lighting ({lights.length})</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(false);
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Expand Lighting Panel"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className="absolute bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 border border-white/5 max-h-[70vh] overflow-hidden z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '384px' // w-96 equivalent
      }}
    >
      {/* Drag Handle */}
      <div
        className={`flex items-center justify-between p-4 border-b border-white/10 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } select-none`}
        onMouseDown={handleMouseDown}
        title="Drag to move panel"
      >
        <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2 pointer-events-none">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Lighting
        </h2>
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-white/50 pointer-events-none" />
          
          {/* Light Helpers Toggle Button - Only show when lights exist */}
          {lights.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLightHelpersToggle();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                sceneSettings.showLightHelpers
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'hover:bg-white/10 text-white/70'
              }`}
              title={sceneSettings.showLightHelpers ? 'Hide Light Helpers' : 'Show Light Helpers'}
            >
              <LightHelperIcon className="w-4 h-4" />
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(!showAddMenu);
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
              title="Add Light"
            >
              <Plus className="w-4 h-4" />
            </button>
            
            {showAddMenu && (
              <div className="absolute right-0 top-8 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-lg z-20 min-w-56">
                {lightTypes.map(({ type, name, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => handleAddLight(type)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-start gap-3 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Icon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white/90">{name}</div>
                      <div className="text-xs text-white/60 mt-0.5">{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(true);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
            title="Collapse Panel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
        {/* Light Helpers Status Info - Only show when lights exist */}
        {lights.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg border ${
            sceneSettings.showLightHelpers
              ? 'bg-yellow-500/10 border-yellow-500/20'
              : 'bg-gray-500/10 border-gray-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LightHelperIcon className={`w-4 h-4 ${
                  sceneSettings.showLightHelpers ? 'text-yellow-400' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  sceneSettings.showLightHelpers ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  Light Helpers {sceneSettings.showLightHelpers ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <button
                onClick={handleLightHelpersToggle}
                className={`p-1.5 rounded-lg transition-colors ${
                  sceneSettings.showLightHelpers
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
                title={sceneSettings.showLightHelpers ? 'Hide Light Helpers' : 'Show Light Helpers'}
              >
                {sceneSettings.showLightHelpers ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {sceneSettings.showLightHelpers 
                ? 'Visual indicators show light positions and directions'
                : 'Enable to see light position and direction helpers'
              }
            </div>
          </div>
        )}

        {/* Lights List */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('lights')}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors text-white/90"
          >
            <div className="flex items-center gap-2">
              {expandedSections.includes('lights') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Scene Lights ({lights.length})</span>
            </div>
          </button>

          {expandedSections.includes('lights') && (
            <div className="space-y-1 ml-4">
              {lights.length === 0 ? (
                <div className="text-center py-6 text-white/50">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No lights in scene</p>
                  <p className="text-xs mt-1">Add lights to illuminate your objects</p>
                </div>
              ) : (
                lights.map((light) => {
                  const LightIcon = light.type === 'directional' ? Sun : 
                                  light.type === 'point' ? Lightbulb : Zap;
                  
                  return (
                    <div
                      key={light.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedLight?.id === light.id
                          ? 'bg-blue-500/20 border-blue-500/30'
                          : 'bg-[#2a2a2a] border-white/10 hover:bg-[#3a3a3a]'
                      }`}
                      onClick={() => setSelectedLight(light)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <LightIcon className={`w-4 h-4 ${light.visible ? 'text-yellow-400' : 'text-gray-500'}`} />
                          <span className="text-sm font-medium text-white/90">{light.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLightVisibility(light.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title={light.visible ? 'Hide Light' : 'Show Light'}
                          >
                            {light.visible ? (
                              <Eye className="w-3 h-3 text-white/70" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-white/50" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLight(light.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-red-400 hover:text-red-300"
                            title="Delete Light"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-white/60 space-y-1">
                        <div className="flex justify-between">
                          <span>Position:</span>
                          <span className="font-mono">{formatPosition(light.position)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Intensity:</span>
                          <span>{formatIntensity(light.intensity)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Color:</span>
                          <div 
                            className="w-4 h-4 rounded border border-white/20"
                            style={{ backgroundColor: light.color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Light Properties */}
        {selectedLight && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Light Properties
              </h3>
              <button
                onClick={() => setSelectedLight(null)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-white/70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Name</label>
                <input
                  type="text"
                  value={selectedLight.name}
                  onChange={(e) => handleLightPropertyChange(selectedLight.id, 'name', e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2 flex items-center gap-1">
                  <Move3D className="w-3 h-3" />
                  Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['x', 'y', 'z'] as const).map((axis, index) => (
                    <div key={axis}>
                      <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                      <input
                        type="number"
                        value={selectedLight.position[index]}
                        onChange={(e) => {
                          const newPosition = [...selectedLight.position];
                          newPosition[index] = parseFloat(e.target.value) || 0;
                          handleLightPropertyChange(selectedLight.id, 'position', newPosition);
                        }}
                        step="0.1"
                        className="w-full bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Target (for directional and spot lights) */}
              {(selectedLight.type === 'directional' || selectedLight.type === 'spot') && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Target
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map((axis, index) => (
                      <div key={axis}>
                        <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                        <input
                          type="number"
                          value={selectedLight.target[index]}
                          onChange={(e) => {
                            const newTarget = [...selectedLight.target];
                            newTarget[index] = parseFloat(e.target.value) || 0;
                            handleLightPropertyChange(selectedLight.id, 'target', newTarget);
                          }}
                          step="0.1"
                          className="w-full bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intensity - Extended Range */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2 flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  Intensity
                  <span className="text-xs text-white/50 ml-1">(0.001 - 10.0)</span>
                </label>
                <div className="space-y-2">
                  {/* Slider for coarse adjustment */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={Math.min(selectedLight.intensity, 10)}
                      onChange={(e) => handleLightPropertyChange(selectedLight.id, 'intensity', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-white/90 w-16 text-right">
                      {formatIntensity(selectedLight.intensity)}
                    </span>
                  </div>
                  
                  {/* Number input for precise control */}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.001"
                      max="100"
                      step={getIntensityStep(selectedLight.intensity)}
                      value={selectedLight.intensity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          handleLightPropertyChange(selectedLight.id, 'intensity', value);
                        }
                      }}
                      className="flex-1 bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                      placeholder="Enter precise value"
                    />
                    
                    {/* Quick preset buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleLightPropertyChange(selectedLight.id, 'intensity', 0.01)}
                        className="px-2 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-xs text-white/70 border border-white/10"
                        title="Very dim"
                      >
                        0.01
                      </button>
                      <button
                        onClick={() => handleLightPropertyChange(selectedLight.id, 'intensity', 0.1)}
                        className="px-2 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-xs text-white/70 border border-white/10"
                        title="Dim"
                      >
                        0.1
                      </button>
                      <button
                        onClick={() => handleLightPropertyChange(selectedLight.id, 'intensity', 1.0)}
                        className="px-2 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-xs text-white/70 border border-white/10"
                        title="Normal"
                      >
                        1.0
                      </button>
                    </div>
                  </div>
                  
                  {/* Intensity description */}
                  <div className="text-xs text-white/50">
                    {selectedLight.intensity < 0.01 && "Ultra dim - barely visible"}
                    {selectedLight.intensity >= 0.01 && selectedLight.intensity < 0.1 && "Very dim - subtle ambient"}
                    {selectedLight.intensity >= 0.1 && selectedLight.intensity < 0.5 && "Dim - soft lighting"}
                    {selectedLight.intensity >= 0.5 && selectedLight.intensity < 1.0 && "Moderate - balanced"}
                    {selectedLight.intensity >= 1.0 && selectedLight.intensity < 2.0 && "Normal - standard lighting"}
                    {selectedLight.intensity >= 2.0 && selectedLight.intensity < 5.0 && "Bright - strong illumination"}
                    {selectedLight.intensity >= 5.0 && "Very bright - intense lighting"}
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2 flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedLight.color}
                    onChange={(e) => handleLightPropertyChange(selectedLight.id, 'color', e.target.value)}
                    className="w-12 h-8 rounded cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={selectedLight.color}
                    onChange={(e) => handleLightPropertyChange(selectedLight.id, 'color', e.target.value)}
                    className="flex-1 bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Distance (for point and spot lights) */}
              {(selectedLight.type === 'point' || selectedLight.type === 'spot') && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">Distance</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={selectedLight.distance}
                      onChange={(e) => handleLightPropertyChange(selectedLight.id, 'distance', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-white/90 w-12 text-right">
                      {selectedLight.distance}
                    </span>
                  </div>
                </div>
              )}

              {/* Decay (for point and spot lights) */}
              {(selectedLight.type === 'point' || selectedLight.type === 'spot') && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">Decay</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={selectedLight.decay}
                      onChange={(e) => handleLightPropertyChange(selectedLight.id, 'decay', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-white/90 w-12 text-right">
                      {selectedLight.decay.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Spot Light specific properties */}
              {selectedLight.type === 'spot' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-2">Angle (degrees)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={(selectedLight.angle * 180) / Math.PI}
                        onChange={(e) => handleLightPropertyChange(selectedLight.id, 'angle', (parseFloat(e.target.value) * Math.PI) / 180)}
                        className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-white/90 w-12 text-right">
                        {Math.round((selectedLight.angle * 180) / Math.PI)}°
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-2">Penumbra</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedLight.penumbra}
                        onChange={(e) => handleLightPropertyChange(selectedLight.id, 'penumbra', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-white/90 w-12 text-right">
                        {selectedLight.penumbra.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Cast Shadow */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/70">Cast Shadows</label>
                <button
                  onClick={() => handleLightPropertyChange(selectedLight.id, 'castShadow', !selectedLight.castShadow)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedLight.castShadow ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedLight.castShadow ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {selectedObject && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <h3 className="text-sm font-medium text-white/90 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const pos = selectedObject.position;
                  handleAddLight('point', [pos.x + 2, pos.y + 2, pos.z + 2]);
                }}
                className="p-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs text-white/90 transition-colors flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3" />
                Add Point Light
              </button>
              <button
                onClick={() => {
                  const pos = selectedObject.position;
                  handleAddLight('spot', [pos.x + 2, pos.y + 3, pos.z + 2]);
                }}
                className="p-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs text-white/90 transition-colors flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Add Spot Light
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LightingPanel;