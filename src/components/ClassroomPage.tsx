import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Star,
  StarOff,
  BookOpen,
  Lightbulb,
  Palette,
  Box,
  Eye,
  Settings,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { 
  createProject,
  updateProjectMetadata,
  deleteProject,
  ProjectDocument
} from '../services/firestoreService';
import { useUserProjects } from '../hooks/useFirestore';

interface ClassroomPageProps {
  user: any;
  onProjectSelect: (projectId: string, projectName: string) => void;
  onSignOut: () => void;
}

const ClassroomPage: React.FC<ClassroomPageProps> = ({ user, onProjectSelect, onSignOut }) => {
  const { projects, loading, error } = useUserProjects(user?.uid);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'starred' | 'recent'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDocument | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);

  // Create project form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const projectColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#eab308'
  ];

  const projectTemplates = [
    {
      name: 'Blank Project',
      description: 'Start with an empty 3D scene',
      icon: Box,
      color: '#6b7280'
    },
    {
      name: 'Architecture Model',
      description: 'Pre-configured for building designs',
      icon: BookOpen,
      color: '#3b82f6'
    },
    {
      name: 'Product Design',
      description: 'Optimized for product prototyping',
      icon: Lightbulb,
      color: '#10b981'
    },
    {
      name: 'Art & Sculpture',
      description: 'Creative tools for artistic projects',
      icon: Palette,
      color: '#8b5cf6'
    }
  ];

  const handleCreateProject = async (template: string = 'blank') => {
    if (!user || !newProject.name.trim()) return;

    try {
      const projectId = await createProject(
        user.uid,
        newProject.name.trim(),
        newProject.description.trim(),
        newProject.color,
        template
      );
      
      // Reset form
      setNewProject({ name: '', description: '', color: '#3b82f6' });
      setShowCreateModal(false);
      
      // Open the new project
      onProjectSelect(projectId, newProject.name.trim());
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProject(projectId);
      setShowProjectMenu(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleToggleStarProject = async (projectId: string, currentStarred: boolean) => {
    try {
      await updateProjectMetadata(projectId, {
        isStarred: !currentStarred
      });
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDuplicateProject = async (project: ProjectDocument) => {
    try {
      await createProject(
        user.uid,
        `${project.name} (Copy)`,
        project.description,
        project.color,
        'blank'
      );
      setShowProjectMenu(null);
    } catch (error) {
      console.error('Error duplicating project:', error);
    }
  };

  const handleOpenProject = async (project: ProjectDocument) => {
    try {
      // Update last opened timestamp
      await updateProjectMetadata(project.id!, {
        lastOpened: new Date() as any
      });
      
      onProjectSelect(project.id!, project.name);
    } catch (error) {
      console.error('Error opening project:', error);
      // Still open the project even if timestamp update fails
      onProjectSelect(project.id!, project.name);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'starred' && project.isStarred) ||
                         (filterBy === 'recent' && project.lastOpened);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(timestamp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading your classroom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">3D Modeling Classroom</h1>
                <p className="text-white/60 text-sm">Create and manage your 3D projects</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-white truncate max-w-32">
                    {user.displayName || 'User'}
                  </div>
                  <div className="text-xs text-white/60 truncate max-w-32">
                    {user.email}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-white/10">
                      <div className="text-sm font-medium text-white">{user.displayName || 'User'}</div>
                      <div className="text-xs text-white/60">{user.email}</div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Add settings functionality here
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 rounded-lg transition-colors text-white/90"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 rounded-lg transition-colors text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-white/20 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="all" className="bg-slate-800">All Projects</option>
              <option value="starred" className="bg-slate-800">Starred</option>
              <option value="recent" className="bg-slate-800">Recently Opened</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-white/10 rounded-xl p-1 border border-white/20">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Create Project Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-12 h-12 text-white/50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Create your first 3D modeling project to get started'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Project Color Bar */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: project.color }}
                    />

                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {project.name}
                        </h3>
                        <p className="text-white/60 text-sm line-clamp-2">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStarProject(project.id!, project.isStarred);
                          }}
                          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          {project.isStarred ? (
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowProjectMenu(showProjectMenu === project.id ? null : project.id!);
                            }}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-white/70" />
                          </button>
                          
                          {showProjectMenu === project.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50">
                                <button
                                  onClick={() => {
                                    // Add edit functionality
                                    setShowProjectMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 text-white/90"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDuplicateProject(project)}
                                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 text-white/90"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicate
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(project.id!)}
                                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                      <div className="flex items-center gap-1">
                        <Box className="w-4 h-4" />
                        <span>{project.sceneData?.objects?.length || 0} objects</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(project.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Project Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/20 text-white/80 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 2 && (
                          <span className="px-2 py-1 bg-white/20 text-white/80 text-xs rounded-full">
                            +{project.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Open Button */}
                    <button
                      onClick={() => handleOpenProject(project)}
                      className="w-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 border border-blue-500/30 text-white py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Open Project
                    </button>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div 
                      className="w-1 h-12 rounded-full mr-4"
                      style={{ backgroundColor: project.color }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {project.name}
                        </h3>
                        {project.isStarred && (
                          <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-white/60 text-sm truncate">
                        {project.description || 'No description'}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Box className="w-4 h-4" />
                        <span>{project.sceneData?.objects?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenProject(project)}
                      className="ml-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      Open
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Project Templates */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Choose a Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewProject(prev => ({ ...prev, color: template.color }));
                      }}
                      className={`p-4 border-2 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
                        newProject.color === template.color
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/20 bg-white/5 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: template.color + '20' }}
                        >
                          <template.icon className="w-5 h-5" style={{ color: template.color }} />
                        </div>
                        <h4 className="font-medium text-white">{template.name}</h4>
                      </div>
                      <p className="text-white/60 text-sm">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                    placeholder="Enter project name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 resize-none"
                    placeholder="Describe your project (optional)"
                    rows={3}
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Project Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {projectColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewProject(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                          newProject.color === color ? 'border-white' : 'border-white/30'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateProject()}
                disabled={!newProject.name.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomPage;