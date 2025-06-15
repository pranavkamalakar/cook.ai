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

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }
      
      const recipeData = JSON.parse(jsonMatch[0]);
      
      // First fetch the main recipe image
      const recipeImage = await this.fetchRecipeImage(`${recipeData.title} ${query}`);
      
      // Now use the same image for all steps
      const stepsWithImages = recipeData.steps.map((step: any, index: number) => ({
        ...step,
        id: index + 1,
        image: recipeImage // Reuse the main recipe image
      }));

      const recipe: Recipe = {
        id: Date.now().toString(),
        title: recipeData.title,
        description: recipeData.description,
        image: recipeImage,
        cookTime: recipeData.cookTime,
        difficulty: recipeData.difficulty,
        servings: recipeData.servings,
        ingredients: recipeData.ingredients,
        steps: stepsWithImages,
        rating: 0,
        isFavorite: false,
        createdAt: new Date()
      };
      
      return recipe;
    } catch (error) {
      console.error('Error generating recipe:', error);
      throw new Error('Failed to generate recipe. Please try again.');
    }
  }

  private async fetchRecipeImage(query: string): Promise<string> {
    if (!GOOGLE_SEARCH_API_KEY) {
      console.warn('Google Search API key not set, using fallback images');
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

      const res = await fetch(`${CUSTOM_SEARCH_API_URL}?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Image search failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].link;
      }
    } catch (error) {
      console.error('Error fetching recipe image:', error);
    }

    return this.getFallbackFoodImage();
  }

  private getFallbackFoodImage(): string {
    const foodImages = [
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
    ];
    return foodImages[Math.floor(Math.random() * foodImages.length)];
  }
}

export const geminiService = new GeminiService();