import { User } from '../types/User';

declare global {
  interface Window {
    google: any;
  }
}

export class AuthService {
  private clientId: string;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!this.clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID environment variable is not set');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      // Check if Google Identity Services script is already loaded
      if (window.google?.accounts?.id) {
        try {
          this.initializeGoogleAuth();
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }

      // Remove any existing Google scripts to prevent conflicts
      const existingScripts = document.querySelectorAll('script[src*="accounts.google.com"]');
      existingScripts.forEach(script => script.remove());

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Add a delay to ensure the script is fully loaded and initialized
        setTimeout(() => {
          try {
            this.initializeGoogleAuth();
            this.isInitialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 200);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });

    return this.initPromise;
  }

  private initializeGoogleAuth(): void {
    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services not available');
    }

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        // Suppress console warnings
        log_level: 'error',
      });
    } catch (error) {
      console.warn('Google Auth initialization warning:', error);
      // Continue anyway as some warnings are non-critical
    }
  }

  async signIn(): Promise<User> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Sign-in timeout. Please try again.'));
      }, 30000); // 30 second timeout

      try {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            clearTimeout(timeoutId);
            
            if (response.credential) {
              try {
                const user = this.parseJwtToken(response.credential);
                this.saveUserToStorage(user);
                resolve(user);
              } catch (error) {
                reject(new Error('Failed to process sign-in credentials'));
              }
            } else if (response.error) {
              reject(new Error(`Sign-in failed: ${response.error}`));
            } else {
              reject(new Error('Sign-in was cancelled'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          log_level: 'error',
        });

        // Use the prompt method which is more reliable in development
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            // If prompt is not displayed, try the popup method
            this.openSignInPopup().then(resolve).catch(reject);
          } else if (notification.isSkippedMoment()) {
            clearTimeout(timeoutId);
            reject(new Error('Sign-in was skipped by user'));
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(new Error('Failed to initialize sign-in process'));
      }
    });
  }

  private async openSignInPopup(): Promise<User> {
    return new Promise((resolve, reject) => {
      // Create a temporary container for the Google Sign-In button
      const container = document.createElement('div');
      container.id = 'google-signin-container';
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.visibility = 'hidden';
      document.body.appendChild(container);

      try {
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 250,
          callback: (response: any) => {
            // Clean up
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
            
            if (response.credential) {
              try {
                const user = this.parseJwtToken(response.credential);
                this.saveUserToStorage(user);
                resolve(user);
              } catch (error) {
                reject(new Error('Failed to process sign-in credentials'));
              }
            } else {
              reject(new Error('Sign-in was cancelled or failed'));
            }
          }
        });

        // Programmatically click the button to trigger sign-in
        setTimeout(() => {
          const button = container.querySelector('[role="button"]') as HTMLElement;
          if (button) {
            button.click();
          } else {
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
            reject(new Error('Unable to create sign-in button'));
          }
        }, 100);
      } catch (error) {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        reject(new Error('Failed to render sign-in button'));
      }
    });
  }

  private parseJwtToken(token: string): User {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid token format');
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      // Validate required fields
      if (!payload.sub || !payload.email || !payload.name) {
        throw new Error('Missing required user information');
      }
      
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture || '',
        accessToken: token,
      };
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  }

  private saveUserToStorage(user: User): void {
    try {
      localStorage.setItem('cook-ai-user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('cook-ai-user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      // Validate user object structure
      if (!user.id || !user.email || !user.name) {
        this.signOut(); // Clear invalid user data
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Failed to get user from storage:', error);
      this.signOut(); // Clear corrupted data
      return null;
    }
  }

  signOut(): void {
    try {
      localStorage.removeItem('cook-ai-user');
      
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
        
        // Try to revoke the session if we have user info
        const currentUser = this.getCurrentUser();
        if (currentUser?.email) {
          window.google.accounts.id.revoke(currentUser.email, () => {
            console.log('User session revoked successfully');
          });
        }
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still clear local storage even if Google revocation fails
      localStorage.removeItem('cook-ai-user');
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();