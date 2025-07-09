import { Recipe } from '../types/Recipe';
import { User } from '../types/User';

export class RecipeStorageService {
  private getStorageKey(userId: string): string {
    return `cook-ai-recipes-${userId}`;
  }

  private getFavoritesKey(userId: string): string {
    return `cook-ai-favorites-${userId}`;
  }

  private getRatingsKey(userId: string): string {
    return `cook-ai-ratings-${userId}`;
  }

  /**
   * Get all recipes for a specific user
   */
  getUserRecipes(user: User): Recipe[] {
    try {
      const storageKey = this.getStorageKey(user.id);
      const recipesData = localStorage.getItem(storageKey);
      
      if (!recipesData) return [];
      
      const recipes = JSON.parse(recipesData);
      
      // Ensure recipes have proper date objects
      return recipes.map((recipe: any) => ({
        ...recipe,
        createdAt: new Date(recipe.createdAt)
      }));
    } catch (error) {
      console.error('Error loading user recipes:', error);
      return [];
    }
  }

  /**
   * Save a recipe for a specific user
   */
  saveUserRecipe(user: User, recipe: Recipe): Recipe[] {
    try {
      const existingRecipes = this.getUserRecipes(user);
      
      // Check if recipe already exists (prevent duplicates)
      const existingIndex = existingRecipes.findIndex(r => r.id === recipe.id);
      
      let updatedRecipes: Recipe[];
      if (existingIndex >= 0) {
        // Update existing recipe
        updatedRecipes = [...existingRecipes];
        updatedRecipes[existingIndex] = recipe;
      } else {
        // Add new recipe
        updatedRecipes = [...existingRecipes, recipe];
      }
      
      const storageKey = this.getStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(updatedRecipes));
      
      return updatedRecipes;
    } catch (error) {
      console.error('Error saving user recipe:', error);
      throw new Error('Failed to save recipe');
    }
  }

  /**
   * Delete a recipe for a specific user
   */
  deleteUserRecipe(user: User, recipeId: string): Recipe[] {
    try {
      const existingRecipes = this.getUserRecipes(user);
      const updatedRecipes = existingRecipes.filter(recipe => recipe.id !== recipeId);
      
      const storageKey = this.getStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(updatedRecipes));
      
      return updatedRecipes;
    } catch (error) {
      console.error('Error deleting user recipe:', error);
      throw new Error('Failed to delete recipe');
    }
  }

  /**
   * Toggle favorite status for a recipe
   */
  toggleRecipeFavorite(user: User, recipeId: string): Recipe[] {
    try {
      const existingRecipes = this.getUserRecipes(user);
      const updatedRecipes = existingRecipes.map(recipe => {
        if (recipe.id === recipeId) {
          return { ...recipe, isFavorite: !recipe.isFavorite };
        }
        return recipe;
      });
      
      const storageKey = this.getStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(updatedRecipes));
      
      return updatedRecipes;
    } catch (error) {
      console.error('Error toggling recipe favorite:', error);
      throw new Error('Failed to update recipe');
    }
  }

  /**
   * Rate a recipe
   */
  rateRecipe(user: User, recipeId: string, rating: number): Recipe[] {
    try {
      const existingRecipes = this.getUserRecipes(user);
      const updatedRecipes = existingRecipes.map(recipe => {
        if (recipe.id === recipeId) {
          return { ...recipe, rating: Math.max(0, Math.min(5, rating)) };
        }
        return recipe;
      });
      
      const storageKey = this.getStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(updatedRecipes));
      
      return updatedRecipes;
    } catch (error) {
      console.error('Error rating recipe:', error);
      throw new Error('Failed to rate recipe');
    }
  }

  /**
   * Get user's favorite recipes
   */
  getUserFavorites(user: User): Recipe[] {
    return this.getUserRecipes(user).filter(recipe => recipe.isFavorite);
  }

  /**
   * Get recently created recipes (last 7 days)
   */
  getRecentRecipes(user: User, days: number = 7): Recipe[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.getUserRecipes(user)
      .filter(recipe => new Date(recipe.createdAt) > cutoffDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Clear all data for a user (useful for sign out)
   */
  clearUserData(user: User): void {
    try {
      const storageKey = this.getStorageKey(user.id);
      const favoritesKey = this.getFavoritesKey(user.id);
      const ratingsKey = this.getRatingsKey(user.id);
      
      localStorage.removeItem(storageKey);
      localStorage.removeItem(favoritesKey);
      localStorage.removeItem(ratingsKey);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Migrate legacy recipes to user-specific storage
   */
  migrateLegacyRecipes(user: User): void {
    try {
      const legacyRecipes = localStorage.getItem('cook-ai-recipes');
      if (legacyRecipes && legacyRecipes !== '[]') {
        const recipes = JSON.parse(legacyRecipes);
        const userStorageKey = this.getStorageKey(user.id);
        
        // Only migrate if user doesn't already have recipes
        const existingUserRecipes = localStorage.getItem(userStorageKey);
        if (!existingUserRecipes) {
          localStorage.setItem(userStorageKey, legacyRecipes);
          console.log(`Migrated ${recipes.length} recipes to user account`);
        }
        
        // Remove legacy storage
        localStorage.removeItem('cook-ai-recipes');
      }
    } catch (error) {
      console.error('Error migrating legacy recipes:', error);
    }
  }

  /**
   * Export user recipes as JSON
   */
  exportUserRecipes(user: User): string {
    const recipes = this.getUserRecipes(user);
    return JSON.stringify(recipes, null, 2);
  }

  /**
   * Import recipes from JSON
   */
  importUserRecipes(user: User, recipesJson: string): Recipe[] {
    try {
      const importedRecipes = JSON.parse(recipesJson);
      const existingRecipes = this.getUserRecipes(user);
      
      // Merge recipes, avoiding duplicates by title
      const mergedRecipes = [...existingRecipes];
      
      importedRecipes.forEach((importedRecipe: Recipe) => {
        const exists = existingRecipes.some(existing => 
          existing.title.toLowerCase() === importedRecipe.title.toLowerCase()
        );
        
        if (!exists) {
          // Generate new ID and update creation date
          const newRecipe = {
            ...importedRecipe,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date()
          };
          mergedRecipes.push(newRecipe);
        }
      });
      
      const storageKey = this.getStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(mergedRecipes));
      
      return mergedRecipes;
    } catch (error) {
      console.error('Error importing recipes:', error);
      throw new Error('Failed to import recipes');
    }
  }
}

export const recipeStorageService = new RecipeStorageService();