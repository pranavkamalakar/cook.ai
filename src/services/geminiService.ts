import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types/Recipe';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GOOGLE_SEARCH_API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = '70abbb6c38bda4a32';
const CUSTOM_SEARCH_API_URL = 'https://customsearch.googleapis.com/customsearch/v1';

if (!GEMINI_API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private maxRetries = 3;
  private baseDelay = 2000; // 2 seconds

  async generateRecipe(query: string): Promise<Recipe> {
    const prompt = `
Create a detailed recipe for: "${query}"

Please provide a JSON response with the following structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "cookTime": number (in minutes),
  "difficulty": "Easy" | "Medium" | "Hard",
  "servings": number,
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity with unit"
    }
  ],
  "steps": [
    {
      "id": number,
      "instruction": "detailed step instruction",
      "duration": number (in minutes for this step)
    }
  ]
}

Make sure the recipe is practical, detailed, and includes realistic cooking times. The steps should be clear and easy to follow. Only return the JSON, no additional text.
`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Generating recipe (attempt ${attempt}/${this.maxRetries})...`);
        
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid response format from Gemini');
        }
        
        const recipeData = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
          throw new Error('Incomplete recipe data received');
        }
        
        // Fetch the main recipe image
        const recipeImage = await this.fetchRecipeImage(`${recipeData.title} ${query}`);
        
        // Use the same image for all steps to avoid multiple API calls
        const stepsWithImages = recipeData.steps.map((step: any, index: number) => ({
          ...step,
          id: index + 1,
          image: recipeImage
        }));

        const recipe: Recipe = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: recipeData.title,
          description: recipeData.description,
          image: recipeImage,
          cookTime: recipeData.cookTime || 30,
          difficulty: recipeData.difficulty || 'Medium',
          servings: recipeData.servings || 4,
          ingredients: recipeData.ingredients,
          steps: stepsWithImages,
          rating: 0,
          isFavorite: false,
          createdAt: new Date()
        };
        
        console.log('Recipe generated successfully');
        return recipe;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`Recipe generation attempt ${attempt} failed:`, error);
        
        // Check if it's a rate limit or overload error
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('overloaded') || 
              errorMessage.includes('503') || 
              errorMessage.includes('rate limit') ||
              errorMessage.includes('quota')) {
            
            if (attempt < this.maxRetries) {
              const delay = this.baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
              console.log(`Waiting ${delay}ms before retry...`);
              await this.sleep(delay);
              continue;
            }
          }
        }
        
        // If it's not a retryable error, throw immediately
        if (attempt === 1 && !this.isRetryableError(error as Error)) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Wait before retrying
        const delay = this.baseDelay * attempt;
        await this.sleep(delay);
      }
    }
    
    // If all retries failed, provide a helpful error message
    const errorMessage = this.getHelpfulErrorMessage(lastError);
    throw new Error(errorMessage);
  }

  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('overloaded') ||
           errorMessage.includes('503') ||
           errorMessage.includes('rate limit') ||
           errorMessage.includes('quota') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('network');
  }

  private getHelpfulErrorMessage(error: Error | null): string {
    if (!error) return 'Failed to generate recipe. Please try again.';
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
      return 'The AI service is currently busy. Please try again in a few moments.';
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    
    if (errorMessage.includes('api key')) {
      return 'API configuration error. Please contact support.';
    }
    
    return 'Failed to generate recipe. Please try again or try a different recipe request.';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchRecipeImage(query: string): Promise<string> {
    // Always return fallback image first to avoid API quota issues
    if (!GOOGLE_SEARCH_API_KEY) {
      return this.getFallbackFoodImage();
    }

    try {
      const params = new URLSearchParams({
        key: GOOGLE_SEARCH_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: `${query} finished dish food photography professional`,
        searchType: 'image',
        num: '1',
        imgType: 'photo',
        safe: 'active',
        imgSize: 'LARGE',
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(`${CUSTOM_SEARCH_API_URL}?${params.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Image search failed: ${res.status} ${res.statusText}. Using fallback image.`);
        return this.getFallbackFoodImage();
      }

      const data = await res.json();
      if (data.items && data.items.length > 0 && data.items[0].link) {
        // Validate that the image URL is accessible
        try {
          const imageResponse = await fetch(data.items[0].link, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          });
          if (imageResponse.ok) {
            return data.items[0].link;
          }
        } catch {
          // Image not accessible, use fallback
        }
      }
      
      console.warn('No valid images found in search results. Using fallback image.');
      return this.getFallbackFoodImage();
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Image search timeout, using fallback image');
      } else {
        console.warn('Error fetching recipe image, using fallback:', error);
      }
      return this.getFallbackFoodImage();
    }
  }

  private getFallbackFoodImage(): string {
    const foodImages = [
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=800',
    ];
    return foodImages[Math.floor(Math.random() * foodImages.length)];
  }
}

export const geminiService = new GeminiService();