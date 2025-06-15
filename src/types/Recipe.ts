export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  cookTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  rating: number;
  isFavorite: boolean;
  createdAt: Date;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface CookingStep {
  id: number;
  instruction: string;
  duration: number; // minutes
  image?: string;
}