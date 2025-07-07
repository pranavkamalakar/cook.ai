import { User } from '../types/User';

declare global {
  interface Window {
    google: any;
  }
}

export class AuthService {
  private clientId: string;
  private isInitialized = false;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!this.clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID environment variable is not set');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Check if Google Identity Services script is already loaded
      if (window.google?.accounts?.id) {
        this.initializeGoogleAuth();
        this.isInitialized = true;
        resolve();
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.initializeGoogleAuth();
        this.isInitialized = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  private initializeGoogleAuth(): void {
    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  private handleCredentialResponse(response: any): void {
    // This will be handled by the promise in signIn method
    this.credentialResponse = response;
  }

  private credentialResponse: any = null;

  async signIn(): Promise<User> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      // Set up callback for this specific sign-in attempt
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          if (response.credential) {
            try {
              const user = this.parseJwtToken(response.credential);
              this.saveUserToStorage(user);
              resolve(user);
            } catch (error) {
              reject(new Error('Failed to parse user credentials'));
            }
          } else {
            reject(new Error('Sign-in was cancelled or failed'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Show the sign-in prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to popup if prompt is not displayed
          this.showPopup().then(resolve).catch(reject);
        }
      });
    });
  }

  private async showPopup(): Promise<User> {
    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          if (response.credential) {
            try {
              const user = this.parseJwtToken(response.credential);
              this.saveUserToStorage(user);
              resolve(user);
            } catch (error) {
              reject(new Error('Failed to parse user credentials'));
            }
          } else {
            reject(new Error('Sign-in was cancelled or failed'));
          }
        },
      });

      // Use the popup method
      window.google.accounts.id.prompt();
    });
  }

  private parseJwtToken(token: string): User {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        accessToken: token,
      };
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem('cook-ai-user', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('cook-ai-user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  signOut(): void {
    localStorage.removeItem('cook-ai-user');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();