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
    <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-orange-600 rounded-full animate-spin" />
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-stone-900">Creating your recipe</h2>
        <p className="text-stone-500 text-sm">Please wait while our assistant drafts the details...</p>
      </div>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center min-h-[350px] space-y-5">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-stone-900">Something went wrong</h2>
        <p className="text-stone-500 text-sm max-w-md">{error}</p>
      </div>
      
      <button
        onClick={onBack}
        className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm"
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
        
        <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
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
        
        <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
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
        className="flex items-center space-x-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search</span>
      </button>

      <div className="bg-white dark:bg-dark-500 border border-[#f2ede4] dark:border-dark-400/50 rounded-xl overflow-hidden shadow-sm text-stone-900 dark:text-stone-100">
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
          <div className="flex items-center justify-between mb-8 border-b border-[#f2ede4] dark:border-dark-400/50 pb-5">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">{recipe.cookTime} mins</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">{recipe.servings} servings</span>
              </div>
              <div className="flex items-center space-x-2">
                <ChefHat className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">{recipe.difficulty}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-dark-455 text-stone-500 dark:text-stone-400 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-dark-455 text-stone-500 dark:text-stone-400 transition-colors">
                <Star className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">Ingredients</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2.5 bg-[#faf8f5] dark:bg-dark-450/30 rounded-lg border border-[#f2ede4] dark:border-dark-400/40"
                >
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  <span className="font-medium text-stone-900 dark:text-stone-100 text-sm">{ingredient.amount}</span>
                  <span className="text-stone-600 dark:text-stone-400 text-sm">{ingredient.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* YouTube Video Embed */}
          {recipe.video && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center">
                Video Tutorial
              </h2>
              <div className="bg-[#faf8f5] dark:bg-dark-450/30 border border-[#f2ede4] dark:border-dark-400/40 rounded-xl p-4">
                <div className="relative w-full pb-[56.25%] h-0 rounded-lg overflow-hidden border border-[#f2ede4] dark:border-dark-400/50 bg-stone-100 dark:bg-dark-600">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${recipe.video.videoId}`}
                    title={recipe.video.videoTitle}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                  <span className="truncate font-medium text-stone-700 dark:text-stone-300">
                    Video: {recipe.video.videoTitle}
                  </span>
                  <span className="flex-shrink-0 text-orange-650 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-md">
                    Courtesy: {recipe.video.channelTitle}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions Preview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">Instructions</h2>
            <div className="space-y-4">
              {recipe.steps.slice(0, 3).map((step) => (
                <div
                  key={step.id}
                  className="flex space-x-3 p-3.5 bg-[#faf8f5] dark:bg-dark-450/30 rounded-lg border border-[#f2ede4] dark:border-dark-400/40"
                >
                  <div className="w-7 h-7 bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 border border-orange-100 dark:border-orange-900/30">
                    {step.id}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="text-stone-800 dark:text-stone-250 mb-1.5 font-medium leading-relaxed">{step.instruction}</p>
                    <div className="flex items-center space-x-2 text-stone-500 dark:text-stone-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{step.duration} minutes</span>
                    </div>
                  </div>
                </div>
              ))}
              {recipe.steps.length > 3 && (
                <div className="text-center py-2">
                  <p className="text-stone-400 dark:text-stone-500 font-medium">
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
              className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold text-base hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Play className="w-5 h-5" />
              <span>Start Cooking</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeGeneration;