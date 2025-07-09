import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import RecipeGeneration from './components/RecipeGeneration';
import CookingMode from './components/CookingMode';
import RecipeLibrary from './components/RecipeLibrary';
import AuthModal from './components/AuthModal';
import { Recipe } from './types/Recipe';
import { User } from './types/User';
import { geminiService } from './services/geminiService';
import { authService } from './services/authService';
import { recipeStorageService } from './services/recipeStorageService';

type Screen = 'home' | 'generation' | 'cooking' | 'library';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadUserRecipes(currentUser);
    }
  }, []);

  const loadUserRecipes = (user: User) => {
    try {
      // Migrate any legacy recipes first
      recipeStorageService.migrateLegacyRecipes(user);
      
      // Load user-specific recipes
      const userRecipes = recipeStorageService.getUserRecipes(user);
      setRecipes(userRecipes);
    } catch (error) {
      console.error('Error loading user recipes:', error);
      setError('Failed to load your recipes');
    }
  };

  const saveRecipe = (recipe: Recipe) => {
    if (!user) {
      setError('You must be signed in to save recipes');
      return;
    }

    try {
      const updatedRecipes = recipeStorageService.saveUserRecipe(user, recipe);
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError('Failed to save recipe');
    }
  };

  const deleteRecipe = (recipeId: string) => {
    if (!user) return;

    try {
      const updatedRecipes = recipeStorageService.deleteUserRecipe(user, recipeId);
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setError('Failed to delete recipe');
    }
  };

  const toggleRecipeFavorite = (recipeId: string) => {
    if (!user) return;

    try {
      const updatedRecipes = recipeStorageService.toggleRecipeFavorite(user, recipeId);
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error updating recipe favorite:', error);
      setError('Failed to update recipe');
    }
  };

  const rateRecipe = (recipeId: string, rating: number) => {
    if (!user) return;

    try {
      const updatedRecipes = recipeStorageService.rateRecipe(user, recipeId, rating);
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error rating recipe:', error);
      setError('Failed to rate recipe');
    }
  };

  const handleNavigation = (screen: Screen) => {
    setCurrentScreen(screen);
    setError(null);
  };

  const handleRecipeGenerated = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    saveRecipe(recipe);
  };

  const handleStartCooking = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setCurrentScreen('cooking');
  };

  const handleGenerateRecipe = async (query: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsGenerating(true);
    setCurrentScreen('generation');
    setError(null);
    
    try {
      const generatedRecipe = await geminiService.generateRecipe(query);
      handleRecipeGenerated(generatedRecipe);
      setIsGenerating(false);
    } catch (error) {
      console.error('Recipe generation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate recipe');
      setIsGenerating(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    loadUserRecipes(authenticatedUser);
    setAuthError(null);
    setShowAuthModal(false);
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleSignOut = () => {
    authService.signOut();
    setUser(null);
    setRecipes([]); // Clear recipes from state
    setCurrentScreen('home');
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <Home 
            onNavigate={handleNavigation}
            onGenerateRecipe={handleGenerateRecipe}
            recentRecipes={recipes.slice(-6)}
            onSelectRecipe={handleStartCooking}
            user={user}
            onAuthRequired={handleAuthRequired}
          />
        );
      
      case 'generation':
        return (
          <RecipeGeneration
            isGenerating={isGenerating}
            recipe={currentRecipe}
            onStartCooking={handleStartCooking}
            onBack={() => setCurrentScreen('home')}
            error={error}
          />
        );
      
      case 'cooking':
        return (
          <CookingMode
            recipe={currentRecipe!}
            onBack={() => setCurrentScreen('home')}
          />
        );
      
      case 'library':
        return (
          <RecipeLibrary
            recipes={recipes}
            onSelectRecipe={handleStartCooking}
            onDeleteRecipe={deleteRecipe}
            onToggleFavorite={toggleRecipeFavorite}
            onRateRecipe={rateRecipe}
            onBack={() => setCurrentScreen('home')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <Header 
        currentScreen={currentScreen}
        onNavigate={handleNavigation}
        user={user}
        onSignOut={handleSignOut}
      />
      <main>
        {renderScreen()}
      </main>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
      />
      
      {authError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <p>{authError}</p>
          <button
            onClick={() => setAuthError(null)}
            className="ml-2 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;