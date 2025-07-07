import React from 'react';
import { ChefHat, Home, Book, LogOut, User } from 'lucide-react';
import { User as UserType } from '../types/User';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: 'home' | 'library') => void;
  user: UserType | null;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, user, onSignOut }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Cook.AI
              </h1>
              <p className="text-xs text-gray-500">Smart Cooking Assistant</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                currentScreen === 'home'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            
            <button
              onClick={() => onNavigate('library')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                currentScreen === 'library'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Recipes</span>
            </button>
            
            {user && (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden sm:inline text-sm text-gray-700">{user.name}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;