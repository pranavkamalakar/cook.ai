import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Users, ChefHat, Heart, Star, Play, AlertCircle } from 'lucide-react';
import { Recipe } from '../types/Recipe';

interface RecipeGenerationProps {
  isGenerating: boolean;
  recipe: Recipe | null;
  onStartCooking: (recipe: Recipe) => void;
  onBack: () => void;
  error: string | null;
}

const RecipeGeneration: React.FC<RecipeGenerationProps> = ({
  isGenerating,
  recipe,
  onStartCooking,
  onBack,
  error,
}) => {
  const [showRecipe, setShowRecipe] = useState(false);

  useEffect(() => {
    if (recipe && !isGenerating) {
      setTimeout(() => setShowRecipe(true), 500);
    }
  }, [recipe, isGenerating]);

  const LoadingAnimation = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center animate-bounce-gentle">
          <ChefHat className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -inset-2 bg-gradient-to-br from-primary-600/20 to-accent-500/20 rounded-3xl animate-pulse"></div>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Creating your recipe...</h2>
        <p className="text-gray-600">Our AI chef is crafting something delicious for you</p>
      </div>
      
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Oops! Something went wrong</h2>
        <p className="text-gray-600 max-w-md">{error}</p>
      </div>
      
      <button
        onClick={onBack}
        className="bg-gradient-to-r from-primary-600 to-accent-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
      >
        Try Again
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to search</span>
        </button>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50">
          <ErrorDisplay />
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to search</span>
        </button>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50">
          <LoadingAnimation />
        </div>
      </div>
    );
  }

  if (!recipe || !showRecipe) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search</span>
      </button>

      <div className="bg-white/60 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-200/50 animate-fade-in">
        {/* Recipe Header */}
        <div className="relative h-64 md:h-80">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {recipe.title}
            </h1>
            <p className="text-gray-200 text-lg">
              {recipe.description}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Recipe Stats */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{recipe.cookTime} mins</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{recipe.servings} servings</span>
              </div>
              <div className="flex items-center space-x-2">
                <ChefHat className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{recipe.difficulty}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Heart className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Star className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl border border-gray-200/50"
                >
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  <span className="font-medium text-gray-900">{ingredient.amount}</span>
                  <span className="text-gray-600">{ingredient.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Preview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
            <div className="space-y-4">
              {recipe.steps.slice(0, 3).map((step) => (
                <div
                  key={step.id}
                  className="flex space-x-4 p-4 bg-white/80 rounded-xl border border-gray-200/50"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {step.id}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 mb-2">{step.instruction}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{step.duration} minutes</span>
                    </div>
                  </div>
                </div>
              ))}
              {recipe.steps.length > 3 && (
                <div className="text-center py-2">
                  <p className="text-gray-500">
                    + {recipe.steps.length - 3} more steps
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Start Cooking Button */}
          <div className="text-center">
            <button
              onClick={() => onStartCooking(recipe)}
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Play className="w-6 h-6" />
              <span>Start Cooking</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeGeneration;