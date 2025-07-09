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
}

const Home: React.FC<HomeProps> = ({ onNavigate, onGenerateRecipe, recentRecipes, onSelectRecipe, user, onAuthRequired }) => {
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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            What would you like to
            <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-food-500 bg-clip-text text-transparent">
              {' '}cook today?
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell us what you want to cook, and our AI will create a personalized recipe with step-by-step guidance
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="I want to cook chicken pasta..."
              className="w-full pl-12 pr-32 py-4 bg-white text-gray-900 border border-gray-200/50 rounded-2xl text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <div className="bg-gradient-to-r from-primary-600 to-accent-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                Generate Recipe
              </div>
            </button>
          </div>
        </form>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
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
              className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white/80 transition-all duration-200 border border-gray-200/50 hover:shadow-md"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">AI-Powered</p>
              <p className="text-gray-600">Recipe Generation</p>
            </div>
            <ChefHat className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">Step-by-Step</p>
              <p className="text-gray-600">Cooking Guidance</p>
            </div>
            <Clock className="w-8 h-8 text-food-500" />
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">Smart</p>
              <p className="text-gray-600">Recipe Management</p>
            </div>
            <Users className="w-8 h-8 text-accent-500" />
          </div>
        </div>
      </div>

      {/* Recent Recipes */}
      {recentRecipes.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Recipes</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user ? `${recentRecipes.length} saved recipes` : 'Sign in to save recipes'}
              </span>
              <button
                onClick={() => onNavigate('library')}
                className="text-primary-600 hover:text-primary-700 font-medium"
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
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/60 transition-all duration-200 cursor-pointer"
              >
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{recipe.title}</p>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {recipe.cookTime}m
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
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