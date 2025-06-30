import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Palette, 
  X, 
  ChevronDown, 
  ChevronRight,
  Monitor,
  Sun,
  Moon,
  Grid3X3,
  Eye,
  EyeOff,
  GripHorizontal,
  Layout,
  LayoutDashboard
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const SettingsPanel: React.FC = () => {
  const { 
    sceneSettings, 
    updateSceneSettings 
  } = useSceneStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['appearance', 'interface']);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize position to top left area, avoiding other UI elements
  useEffect(() => {
    if (panelRef.current && position.x === 0 && position.y === 0) {
      // Position in top left area, with some margin from edges
      setPosition({ x: 80, y: 16 }); // 80px from left to avoid hide interface button, 16px from top
    }
  }, [isOpen]);

  // Handle window resize to keep panel in bounds
  useEffect(() => {
    const handleResize = () => {
      if (!panelRef.current) return;
      
      const rect = panelRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 16;
      const maxY = window.innerHeight - rect.height - 16;
      
      setPosition(prev => ({
        x: Math.max(16, Math.min(prev.x, maxX)),
        y: Math.max(16, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    e.preventDefault();
  };

  // Handle mouse move and up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport bounds with margins
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 0) - 16;
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 0) - 16;
      
      setPosition({
        x: Math.max(16, Math.min(newX, maxX)),
        y: Math.max(16, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const backgroundPresets = [
    { name: 'Dark Space', color: '#0f0f23', icon: Moon },
    { name: 'Studio Gray', color: '#2a2a2a', icon: Monitor },
    { name: 'Midnight Blue', color: '#1a1a2e', icon: Moon },
    { name: 'Deep Purple', color: '#16213e', icon: Moon },
    { name: 'Charcoal', color: '#36454f', icon: Monitor },
    { name: 'Light Gray', color: '#f5f5f5', icon: Sun },
    { name: 'Soft White', color: '#fafafa', icon: Sun },
    { name: 'Warm Beige', color: '#f5f5dc', icon: Sun },
  ];

  const handleBackgroundChange = (color: string) => {
    updateSceneSettings({ backgroundColor: color });
  };

  const handleGridToggle = () => {
    updateSceneSettings({ showGrid: !sceneSettings.showGrid });
  };

  const handleHideMenusToggle = () => {
    updateSceneSettings({ hideAllMenus: !sceneSettings.hideAllMenus });
  };

  // Settings button (always visible) - positioned under Hide Interface button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 left-4 p-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 border border-white/5 transition-all duration-200 hover:scale-105 z-50"
        title="Open Settings"
      >
        <Settings className="w-5 h-5 text-white/90" />
      </button>
    );
  }

  // Collapsed state
  if (isCollapsed) {
    return (
      <div 
        ref={panelRef}
        className="fixed bg-[#1a1a1a] rounded-lg shadow-2xl shadow-black/20 border border-white/5 z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
          }}
          className="p-3 hover:bg-white/10 rounded-lg transition-colors text-white/90 flex items-center gap-2"
          title="Expand Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className="fixed bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 border border-white/5 max-h-[80vh] overflow-hidden z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px'
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b border-white/10 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } select-none`}
        onMouseDown={handleMouseDown}
        title="Drag to move panel"
      >
        <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2 pointer-events-none">
          <Settings className="w-5 h-5" />
          Settings
        </h2>
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-white/50 pointer-events-none" />
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
        {/* Interface Section */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => toggleSection('interface')}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors text-white/90"
          >
            <div className="flex items-center gap-2">
              {expandedSections.includes('interface') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Layout className="w-4 h-4" />
              <span className="text-sm font-medium">Interface</span>
            </div>
          </button>

          {expandedSections.includes('interface') && (
            <div className="space-y-4 ml-4">
              {/* Hide All Menus Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 text-white/70" />
                  <div>
                    <div className="text-sm font-medium text-white/90">Hide All Tool Menus</div>
                    <div className="text-xs text-white/60 mt-0.5">
                      Clean workspace mode - hides all UI panels
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleHideMenusToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    sceneSettings.hideAllMenus ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                  title={sceneSettings.hideAllMenus ? 'Show All Menus' : 'Hide All Menus'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sceneSettings.hideAllMenus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {sceneSettings.hideAllMenus && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="text-xs text-orange-400 font-medium mb-1 flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    Clean Mode Active
                  </div>
                  <div className="text-xs text-white/60">
                    All tool menus are hidden. Use this settings panel or keyboard shortcuts to access features.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Appearance Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('appearance')}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors text-white/90"
          >
            <div className="flex items-center gap-2">
              {expandedSections.includes('appearance') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Appearance</span>
            </div>
          </button>

          {expandedSections.includes('appearance') && (
            <div className="space-y-4 ml-4">
              {/* Background Color */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-3">
                  Background Color
                </label>
                
                {/* Current Color Display */}
                <div className="flex items-center gap-3 mb-3 p-3 bg-[#2a2a2a] rounded-lg border border-white/10">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/20 shadow-inner"
                    style={{ backgroundColor: sceneSettings.backgroundColor }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Current</div>
                    <div className="text-xs text-white/60 font-mono">
                      {sceneSettings.backgroundColor}
                    </div>
                  </div>
                  <input
                    type="color"
                    value={sceneSettings.backgroundColor}
                    onChange={(e) => handleBackgroundChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-white/20 bg-transparent"
                    title="Custom Color Picker"
                  />
                </div>

                {/* Preset Colors */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    Presets
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backgroundPresets.map(({ name, color, icon: Icon }) => (
                      <button
                        key={name}
                        onClick={() => handleBackgroundChange(color)}
                        className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 group ${
                          sceneSettings.backgroundColor === color
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20 bg-[#2a2a2a] hover:bg-[#3a3a3a]'
                        }`}
                        title={`Set background to ${name}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-3 h-3 text-white/60" />
                          <span className="text-xs font-medium text-white/90 truncate">
                            {name}
                          </span>
                        </div>
                        <div 
                          className="w-full h-6 rounded border border-white/20 shadow-inner"
                          style={{ backgroundColor: color }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid Settings */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-white/70 flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    Grid
                  </label>
                  <button
                    onClick={handleGridToggle}
                    className={`p-1.5 rounded-lg transition-colors ${
                      sceneSettings.showGrid
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-white/10 text-white/70'
                    }`}
                    title={sceneSettings.showGrid ? 'Hide Grid' : 'Show Grid'}
                  >
                    {sceneSettings.showGrid ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                <div className="text-xs text-white/50">
                  {sceneSettings.showGrid ? 'Grid is visible' : 'Grid is hidden'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-xs text-blue-400 font-medium mb-2">
            💡 Keyboard Shortcuts
          </div>
          <div className="text-xs text-white/60 space-y-1">
            <div><kbd className="bg-white/10 px-1 rounded">Tab</kbd> - Toggle clean mode</div>
            <div><kbd className="bg-white/10 px-1 rounded">G</kbd> - Toggle grid</div>
            <div><kbd className="bg-white/10 px-1 rounded">Ctrl+Z</kbd> - Undo</div>
            <div><kbd className="bg-white/10 px-1 rounded">Ctrl+Y</kbd> - Redo</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hide Interface Button Component - Positioned at top left corner
const HideInterfaceButton: React.FC = () => {
  const { sceneSettings, updateSceneSettings } = useSceneStore();

  const handleToggleInterface = () => {
    updateSceneSettings({ hideAllMenus: !sceneSettings.hideAllMenus });
  };

  return (
    <button
      onClick={handleToggleInterface}
      className="bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 transition-all duration-200 hover:scale-105 group"
      title={sceneSettings.hideAllMenus ? 'Show Interface (Tab)' : 'Hide Interface (Tab)'}
    >
      <div className="flex items-center gap-2">
        {sceneSettings.hideAllMenus ? (
          <>
            <Eye className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-white/90 hidden group-hover:block">
              Show Interface
            </span>
          </>
        ) : (
          <>
            <EyeOff className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium text-white/90 hidden group-hover:block">
              Hide Interface
            </span>
          </>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {sceneSettings.hideAllMenus ? 'Show Interface (Tab)' : 'Hide Interface (Tab)'}
      </div>
    </button>
  );
};

export default SettingsPanel;
export { HideInterfaceButton };