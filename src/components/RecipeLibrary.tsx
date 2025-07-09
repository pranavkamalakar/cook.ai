import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, Clock, Users, Star, Heart, Trash2 } from 'lucide-react';
import { Recipe } from '../types/Recipe';

interface RecipeLibraryProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onToggleFavorite: (recipeId: string) => void;
  onRateRecipe: (recipeId: string, rating: number) => void;
  onBack: () => void;
}

const RecipeLibrary: React.FC<RecipeLibraryProps> = ({ 
  recipes, 
  onSelectRecipe, 
  onDeleteRecipe, 
  onToggleFavorite, 
  onRateRecipe, 
  onBack 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'cookTime'>('newest');

  const filteredAndSortedRecipes = recipes
    .filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      switch (filterBy) {
        case 'favorites':
          return matchesSearch && recipe.isFavorite;
        case 'recent':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return matchesSearch && new Date(recipe.createdAt) > oneWeekAgo;
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'cookTime':
          return a.cookTime - b.cookTime;
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recipe Library</h1>
            <p className="text-gray-600">{recipes.length} recipes saved</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 border border-gray-200/50 rounded-xl placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex space-x-3">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'favorites' | 'recent')}
              className="px-4 py-3 bg-white text-gray-900 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Recipes</option>
              <option value="favorites">Favorites</option>
              <option value="recent">Recent</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'rating' | 'cookTime')}
              className="px-4 py-3 bg-white text-gray-900 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rated</option>
              <option value="cookTime">Quick Recipes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {filteredAndSortedRecipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search terms' : 'Start by generating your first recipe!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200/50 hover:shadow-lg transition-all duration-200 group cursor-pointer"
              onClick={() => onSelectRecipe(recipe)}
            >
              {/* Recipe Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(recipe.id);
                    }}
                    className="p-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                  {recipe.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {recipe.description}
                </p>

                {/* Recipe Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.cookTime}m</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{recipe.servings}</span>
                    </div>
                  </div>
                  {recipe.rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span>{recipe.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRecipe(recipe);
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Start Cooking
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this recipe?')) {
                        onDeleteRecipe(recipe.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeLibrary;

// Utility CSS classes that should be added to your global CSS
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;