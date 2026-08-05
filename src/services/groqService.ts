import { Recipe } from '../types/Recipe';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GOOGLE_SEARCH_API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = '70abbb6c38bda4a32';
const CUSTOM_SEARCH_API_URL = 'https://customsearch.googleapis.com/customsearch/v1';

if (!GROQ_API_KEY) {
  throw new Error('VITE_GROQ_API_KEY environment variable is not set');
}

export class GroqService {
  private model = 'llama-3.3-70b-versatile';
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
        console.log(`Generating recipe via Groq (attempt ${attempt}/${this.maxRetries})...`);
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const status = response.status;
          const statusText = response.statusText;
          let errorDetail = '';
          try {
            const errorJson = await response.json();
            errorDetail = errorJson?.error?.message || JSON.stringify(errorJson);
          } catch {
            // Ignore if response body cannot be parsed as JSON
          }
          throw new Error(`Groq API error (${status} ${statusText}): ${errorDetail}`);
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        
        if (!text) {
          throw new Error('Empty response from Groq API');
        }

        // Clean the response to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid JSON format returned from Groq');
        }
        
        const recipeData = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
          throw new Error('Incomplete recipe data received');
        }
        
        // Fetch the main recipe image
        const recipeImage = await this.fetchRecipeImage(`${recipeData.title} ${query}`);
        
        interface RawCookingStep {
          id: number;
          instruction: string;
          duration: number;
        }

        // Use the same image for all steps to avoid multiple API calls
        const stepsWithImages = (recipeData.steps as RawCookingStep[]).map((step, index) => ({
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
        
        console.log('Recipe generated successfully via Groq');
        return recipe;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`Recipe generation attempt ${attempt} failed:`, error);
        
        // Check if it's a retryable error
        if (attempt < this.maxRetries && this.isRetryableError(error as Error)) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
          continue;
        }
        
        // If it's not retryable or it's the last attempt, break and throw
        break;
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
           errorMessage.includes('429') ||
           errorMessage.includes('rate limit') ||
           errorMessage.includes('quota') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('network') ||
           errorMessage.includes('fetch');
  }

  private getHelpfulErrorMessage(error: Error | null): string {
    if (!error) return 'Failed to generate recipe. Please try again.';
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
      return 'The AI service is currently busy. Please try again in a few moments.';
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('quota')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    
    if (errorMessage.includes('api key') || errorMessage.includes('401')) {
      return 'API configuration error. Please check your Groq API key.';
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

export const groqService = new GroqService();
