import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  Send
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setShowPassword(false);
    setShowVerificationSent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const sendVerificationEmail = async (user: any) => {
    try {
      // Send verification email without custom continue URL to avoid domain issues
      await sendEmailVerification(user);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Sign in existing user
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          // Optionally send verification email again for unverified users
          await sendVerificationEmail(userCredential.user);
          console.log('User signed in but email not verified. Verification email sent.');
        }
        
        onAuthSuccess();
        handleClose();
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Update user profile with name
        await updateProfile(userCredential.user, {
          displayName: formData.name.trim()
        });

        // Send email verification
        const verificationSent = await sendVerificationEmail(userCredential.user);
        
        if (verificationSent) {
          setShowVerificationSent(true);
          // Don't close the modal immediately, show verification message
          setTimeout(() => {
            onAuthSuccess();
            handleClose();
          }, 3000); // Give user time to see the verification message
        } else {
          // Even if verification email fails, still proceed with authentication
          onAuthSuccess();
          handleClose();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later');
          break;
        default:
          setError('Authentication failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {isLogin ? (
              <LogIn className="w-6 h-6 text-blue-400" />
            ) : (
              <UserPlus className="w-6 h-6 text-green-400" />
            )}
            <h2 className="text-xl font-semibold text-white/90">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Success Message */}
        {showVerificationSent && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-green-400">Account Created Successfully!</div>
                <div className="text-xs text-white/60 mt-1">
                  A verification email has been sent to {formData.email}. Please check your inbox and verify your email address.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name field (signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-[#3a3a3a] transition-colors"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-[#3a3a3a] transition-colors"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg pl-10 pr-12 py-3 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-[#3a3a3a] transition-colors"
                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors text-white/50"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password field (signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-[#3a3a3a] transition-colors"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email Verification Info (signup only) */}
          {!isLogin && !showVerificationSent && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Send className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-400">
                <div className="font-medium">Email Verification</div>
                <div className="text-white/60 mt-0.5">
                  We'll send a verification email to confirm your account after signup.
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || showVerificationSent}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              loading || showVerificationSent
                ? 'bg-gray-600 cursor-not-allowed text-white/50'
                : isLogin
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : showVerificationSent ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Account Created!</span>
              </>
            ) : (
              <>
                {isLogin ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>

          {/* Toggle mode */}
          {!showVerificationSent && (
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;