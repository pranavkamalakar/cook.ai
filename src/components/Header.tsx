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
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-stone-900 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900 leading-none">
                Cook.AI
              </h1>
              <p className="text-[10px] text-stone-400">Cooking Assistant</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                currentScreen === 'home'
                  ? 'bg-stone-100 text-stone-900 font-medium'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            
            <button
              onClick={() => onNavigate('library')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                currentScreen === 'library'
                  ? 'bg-stone-100 text-stone-900 font-medium'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Recipes</span>
            </button>
            
            {user && (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-stone-200">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-stone-200"
                  />
                  <span className="hidden sm:inline text-xs text-stone-700">{user.name}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all duration-200"
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