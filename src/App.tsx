import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import ClassroomPage from './components/ClassroomPage';
import ProjectWrapper from './components/ProjectWrapper';
import AuthModal from './components/AuthModal';
import { useSceneStore } from './store/sceneStore';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Reset scene store when switching projects
  const resetScene = useSceneStore(state => state.resetScene);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Show auth modal if no user is signed in
      if (!user) {
        setShowAuthModal(true);
        setCurrentProject(null); // Clear current project when user signs out
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentProject(null);
    setShowAuthModal(true);
  };

  const handleProjectSelect = (projectId: string, projectName: string) => {
    // Reset the scene store for the new project
    if (resetScene) {
      resetScene();
    }
    
    setCurrentProject({ id: projectId, name: projectName });
  };

  const handleBackToClassroom = () => {
    setCurrentProject(null);
    // Optionally reset scene when going back to classroom
    if (resetScene) {
      resetScene();
    }
  };

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Show project view if a project is selected
  if (currentProject && user) {
    return (
      <ProjectWrapper
        projectId={currentProject.id}
        projectName={currentProject.name}
        user={user}
        onBackToClassroom={handleBackToClassroom}
      />
    );
  }

  // Show classroom view if user is authenticated but no project selected
  if (user) {
    return (
      <ClassroomPage
        user={user}
        onProjectSelect={handleProjectSelect}
        onSignOut={handleSignOut}
      />
    );
  }

  // Show auth modal if no user
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">3D Modeling Classroom</h1>
        <p className="text-white/60 mb-8">Create and manage your 3D projects</p>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;