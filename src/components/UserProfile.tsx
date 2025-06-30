import React, { useState } from 'react';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Mail,
  Calendar,
  Shield,
  Edit3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import ProfileModal from './ProfileModal';

interface UserProfileProps {
  user: any;
  onSignOut: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onSignOut }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onSignOut();
      setShowDropdown(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleEditProfile = () => {
    setShowProfileModal(true);
    setShowDropdown(false);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg border border-white/10 transition-colors"
          title="User Menu"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-white/90 truncate max-w-32">
              {user.displayName || 'User'}
            </div>
            <div className="text-xs text-white/60 truncate max-w-32">
              {user.email}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50">
              {/* User Info Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-white/90 truncate">
                      {user.displayName || 'User'}
                    </div>
                    <div className="text-sm text-white/60 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-white/50" />
                  <span className="text-white/70">Email:</span>
                  <span className="text-white/90 truncate flex-1">{user.email}</span>
                </div>
                
                {user.metadata?.creationTime && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <span className="text-white/70">Joined:</span>
                    <span className="text-white/90">
                      {formatDate(user.metadata.creationTime)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-white/50" />
                  <span className="text-white/70">Status:</span>
                  <div className="flex items-center gap-1">
                    {user.emailVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                        <span className="text-orange-400">Unverified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-white/10">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors text-blue-400 hover:text-blue-300 border-b border-white/10"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="font-medium">Edit Profile</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </>
  );
};

export default UserProfile;