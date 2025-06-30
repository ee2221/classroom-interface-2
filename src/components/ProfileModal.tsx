import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Send,
  Shield,
  Clock
} from 'lucide-react';
import { 
  updateProfile, 
  updateEmail, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../config/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email verification cooldown state
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [cooldownInterval, setCooldownInterval] = useState<NodeJS.Timeout | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || ''
  });

  // Account form state
  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    currentPassword: ''
  });

  // Security form state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
    };
  }, [cooldownInterval]);

  const startEmailCooldown = (seconds: number = 60) => {
    setEmailCooldown(seconds);
    
    const interval = setInterval(() => {
      setEmailCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCooldownInterval(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCooldownInterval(interval);
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSendVerificationEmail = async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (auth.currentUser) {
        // Send verification email without custom continue URL to avoid domain issues
        await sendEmailVerification(auth.currentUser);
        
        setMessage({ 
          type: 'success', 
          text: 'Verification email sent! Please check your inbox and verify your email address.' 
        });
        
        // Start cooldown after successful send
        startEmailCooldown(60);
        clearMessage();
      }
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      let errorMessage = 'Failed to send verification email';
      let cooldownTime = 60; // Default cooldown
      
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait before requesting another verification email.';
          cooldownTime = 120; // Longer cooldown for rate limiting
          break;
        case 'auth/user-not-found':
          errorMessage = 'User not found. Please sign in again.';
          break;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      
      // Start cooldown even on error to prevent spam
      if (error.code === 'auth/too-many-requests') {
        startEmailCooldown(cooldownTime);
      }
      
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.displayName.trim() || null,
          photoURL: profileData.photoURL.trim() || null
        });
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        clearMessage();
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Re-authenticate user before email change
      const credential = EmailAuthProvider.credential(
        user.email,
        accountData.currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, accountData.email);
      
      // Send verification email for the new email address without custom continue URL
      await sendEmailVerification(auth.currentUser);
      
      setMessage({ 
        type: 'success', 
        text: 'Email updated successfully! A verification email has been sent to your new email address.' 
      });
      setAccountData({ ...accountData, currentPassword: '' });
      
      // Start cooldown after email update verification send
      startEmailCooldown(60);
      clearMessage();
    } catch (error: any) {
      console.error('Email update error:', error);
      let errorMessage = 'Failed to update email';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please sign out and sign in again before changing email';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait before trying again.';
          startEmailCooldown(120);
          break;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords
    if (securityData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      setLoading(false);
      clearMessage();
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      clearMessage();
      return;
    }

    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        user.email,
        securityData.currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, securityData.newPassword);
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      clearMessage();
    } catch (error: any) {
      console.error('Password update error:', error);
      let errorMessage = 'Failed to update password';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please sign out and sign in again before changing password';
          break;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' });
      clearMessage();
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      clearMessage();
      return;
    }

    setUploadingPhoto(true);
    setMessage(null);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile-photos/${auth.currentUser.uid}/${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, fileName);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update profile data with the new URL
      setProfileData({
        ...profileData,
        photoURL: downloadURL
      });
      
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      clearMessage();
    } catch (error: any) {
      console.error('Photo upload error:', error);
      let errorMessage = 'Failed to upload photo';
      
      switch (error.code) {
        case 'storage/unauthorized':
          errorMessage = 'You do not have permission to upload files';
          break;
        case 'storage/canceled':
          errorMessage = 'Upload was canceled';
          break;
        case 'storage/unknown':
          errorMessage = 'An unknown error occurred during upload';
          break;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      clearMessage();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Mail },
    { id: 'security', label: 'Security', icon: Lock }
  ] as const;

  const isEmailVerificationDisabled = loading || emailCooldown > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white/90">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                  : 'text-white/70 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Profile Picture */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
                    {profileData.photoURL ? (
                      <img 
                        src={profileData.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={triggerFileUpload}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                    title="Change profile picture"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-sm text-white/60 mt-2">
                  {uploadingPhoto 
                    ? 'Uploading photo...' 
                    : 'Click the camera icon to change your profile picture'
                  }
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                  placeholder="Enter your display name"
                />
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Profile Picture URL (optional)
                </label>
                <input
                  type="url"
                  value={profileData.photoURL}
                  onChange={(e) => setProfileData({ ...profileData, photoURL: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <button
                type="submit"
                disabled={loading || uploadingPhoto}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Email Verification Status */}
              <div className={`p-4 rounded-lg border ${
                user?.emailVerified 
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-orange-500/10 border-orange-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${
                      user?.emailVerified ? 'text-green-400' : 'text-orange-400'
                    }`} />
                    <div>
                      <div className={`text-sm font-medium ${
                        user?.emailVerified ? 'text-green-400' : 'text-orange-400'
                      }`}>
                        Email {user?.emailVerified ? 'Verified' : 'Not Verified'}
                      </div>
                      <div className="text-xs text-white/60 mt-0.5">
                        {user?.emailVerified 
                          ? 'Your email address has been verified'
                          : 'Please verify your email address for enhanced security'
                        }
                      </div>
                    </div>
                  </div>
                  {!user?.emailVerified && (
                    <button
                      onClick={handleSendVerificationEmail}
                      disabled={isEmailVerificationDisabled}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg font-medium transition-colors"
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : emailCooldown > 0 ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      {loading 
                        ? 'Sending...' 
                        : emailCooldown > 0 
                          ? `Wait ${emailCooldown}s`
                          : 'Verify Email'
                      }
                    </button>
                  )}
                </div>
              </div>

              {/* Email Update Form */}
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Current Password (required to change email)
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={accountData.currentPassword}
                      onChange={(e) => setAccountData({ ...accountData, currentPassword: e.target.value })}
                      className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 pr-10 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {loading ? 'Updating...' : 'Update Email'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 pr-10 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 pr-10 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 pr-10 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;