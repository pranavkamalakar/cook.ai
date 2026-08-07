import React, { useState } from 'react';
import { Search, Clock, Users, ChefHat } from 'lucide-react';
import { Recipe } from '../types/Recipe';
import { User } from '../types/User';

interface HomeProps {
  onNavigate: (screen: 'library') => void;
  onGenerateRecipe: (query: string) => void;
  recentRecipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  user: User | null;
  onAuthRequired: () => void;
  userCountry: string | null;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onGenerateRecipe, recentRecipes, onSelectRecipe, user, onAuthRequired, userCountry }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      onGenerateRecipe(searchQuery);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onAuthRequired();
    } else {
      handleSearchSubmit();
    }
  };

  const quickSuggestions = [
    'Chicken pasta',
    'Beef tacos',
    'Vegetarian curry',
    'Salmon dinner',
    'Breakfast pancakes',
    'Chocolate cake',
    'Stir fry vegetables',
    'Pizza margherita'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-3">
            What would you like to cook today?
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            Tell us what you want to cook, and we'll create a personalized recipe with step-by-step guidance.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="I want to cook chicken pasta..."
              className="w-full pl-12 pr-40 py-3.5 bg-white dark:bg-dark-500 text-stone-900 dark:text-stone-100 border border-[#f2ede4] dark:border-dark-400/50 rounded-xl text-base placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
            >
              Generate Recipe
            </button>
          </div>
          {userCountry && (
            <p className="text-xs text-stone-400 mt-2 font-medium">
              Customizing recipe ingredients and units for: <span className="text-orange-600 font-semibold">{userCountry}</span>
            </p>
          )}
        </form>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                if (!user) {
                  onAuthRequired();
                } else {
                  onGenerateRecipe(suggestion);
                }
              }}
              className="px-3.5 py-1.5 bg-[#f5ebd7]/50 dark:bg-dark-500/50 hover:bg-[#f5ebd7] dark:hover:bg-dark-450 text-stone-700 dark:text-stone-300 rounded-full text-xs font-medium border border-transparent dark:border-dark-400/30 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-dark-500 border border-[#f2ede4] dark:border-dark-400/50 rounded-xl p-5 shadow-sm hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">AI-Powered</p>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Recipe Generation</p>
            </div>
            <ChefHat className="w-7 h-7 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-500 border border-[#f2ede4] dark:border-dark-400/50 rounded-xl p-5 shadow-sm hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">Step-by-Step</p>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Cooking Guidance</p>
            </div>
            <Clock className="w-7 h-7 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-500 border border-[#f2ede4] dark:border-dark-400/50 rounded-xl p-5 shadow-sm hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">Smart</p>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Recipe Management</p>
            </div>
            <Users className="w-7 h-7 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Recent Recipes */}
      {recentRecipes.length > 0 && (
        <div className="bg-white dark:bg-dark-500 border border-[#f2ede4] dark:border-dark-400/50 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Recent Recipes</h2>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-stone-400">
                {user ? `${recentRecipes.length} saved recipes` : 'Sign in to save recipes'}
              </span>
              <button
                onClick={() => onNavigate('library')}
                className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-350 text-xs font-semibold"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-dark-450/50 transition-colors cursor-pointer border border-transparent hover:border-stone-100 dark:hover:border-dark-400/30"
              >
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 dark:text-stone-100 truncate text-sm">{recipe.title}</p>
                  <div className="flex items-center space-x-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {recipe.cookTime}m
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      {recipe.servings}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;