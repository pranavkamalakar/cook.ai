import React, { useState, useEffect } from 'react';
import { X, ChefHat, Shield, Sparkles, Clock } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types/User';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  onAuthError: (error: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && googleButtonRef.current) {
      setIsLoading(true);
      authService.renderGoogleButton(
        googleButtonRef.current,
        (user) => {
          setIsLoading(false);
          onAuthSuccess(user);
        },
        (error) => {
          setIsLoading(false);
          console.error('Authentication failed:', error);
          const errorMessage = error.message || 'Authentication failed';
          
          let friendlyMessage = errorMessage;
          if (errorMessage.includes('popup')) {
            friendlyMessage = 'Please allow popups for this site and try again.';
          } else if (errorMessage.includes('timeout')) {
            friendlyMessage = 'Sign-in is taking longer than expected. Please try again.';
          } else if (errorMessage.includes('cancelled')) {
            friendlyMessage = 'Sign-in was cancelled. Please try again if you want to continue.';
          }
          
          onAuthError(friendlyMessage);
        }
      );
    }
  }, [isOpen, onAuthSuccess, onAuthError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative border border-stone-200 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-stone-50 border border-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-6 h-6 text-stone-700" />
          </div>
          <h2 className="text-2xl font-semibold text-stone-900 mb-2">Welcome to Cook.AI</h2>
          <p className="text-stone-500 text-sm">Sign in to start generating personalized recipes</p>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
            <Sparkles className="w-4 h-4 text-stone-600" />
            <span className="text-stone-600 text-sm">AI-powered recipe generation</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
            <Clock className="w-4 h-4 text-stone-600" />
            <span className="text-stone-600 text-sm">Step-by-step cooking guidance</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
            <Shield className="w-4 h-4 text-stone-600" />
            <span className="text-stone-600 text-sm">Save and organize your recipes</span>
          </div>
        </div>

        <div className="flex justify-center min-h-[48px]">
          <div ref={googleButtonRef} />
        </div>

        {isLoading && (
          <p className="text-xs text-stone-400 text-center mt-2">
            Loading Google authentication...
          </p>
        )}

        <p className="text-xs text-stone-400 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
          <br className="hidden sm:block" />
          <span className="block sm:inline mt-1 sm:mt-0">
            We use Google's secure authentication.
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;