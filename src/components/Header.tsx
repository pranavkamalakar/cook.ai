import React from 'react';
import { ChefHat, Home, Book, LogOut, Sun, Moon } from 'lucide-react';
import { User as UserType } from '../types/User';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: 'home' | 'library') => void;
  user: UserType | null;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, user, onSignOut, theme, onToggleTheme }) => {
  return (
    <header className="bg-white/95 dark:bg-dark-500/95 border-b border-[#f2ede4] dark:border-dark-400/50 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-none">
                Cook.AI
              </h1>
              <p className="text-[10px] text-stone-400">Cooking Assistant</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                currentScreen === 'home'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-medium'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-orange-50/50 hover:text-orange-600 dark:hover:bg-dark-400/50 dark:hover:text-orange-400'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            
            <button
              onClick={() => onNavigate('library')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                currentScreen === 'library'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-medium'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-orange-50/50 hover:text-orange-600 dark:hover:bg-dark-400/50 dark:hover:text-orange-400'
              }`}
            >
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Recipes</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-dark-400 rounded-lg transition-all duration-200"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {user && (
              <div className="flex items-center space-x-3 ml-2 pl-2 sm:ml-4 sm:pl-4 border-l border-[#f2ede4] dark:border-dark-400">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-stone-200 dark:border-dark-400"
                  />
                  <span className="hidden lg:inline text-xs text-stone-700 dark:text-stone-300">{user.name}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-dark-400 rounded-lg transition-all duration-200"
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