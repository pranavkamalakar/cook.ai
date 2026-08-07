import { User } from '../types/User';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

export class AuthService {
  private clientId: string;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (!this.clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID environment variable is not set');
    }
  }

  async initialize(): Promise<void> {
    if (!this.clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID environment variable is not set');
    }
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
            if (!window.google?.accounts?.id) {
              reject(new Error('Google Identity Services failed to load properly'));
              return;
            }
            this.initializeGoogleAuth();
            this.isInitialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 1000);
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
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: false, // Disable FedCM to use traditional popup
        log_level: 'error',
      });
    } catch (error) {
      console.warn('Google Auth initialization warning (non-critical):', error);
    }
  }

  renderGoogleButton(
    element: HTMLElement,
    onSuccess: (user: User) => void,
    onError: (error: Error) => void
  ): void {
    element.innerHTML = '';

    this.initialize().then(() => {
      if (!window.google?.accounts?.id) {
        throw new Error('Google Authentication service is not available');
      }

      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            try {
              const user = this.parseJwtToken(response.credential);
              this.saveUserToStorage(user);
              onSuccess(user);
            } catch {
              onError(new Error('Failed to process sign-in credentials'));
            }
          } else {
            onError(new Error('Sign-in was cancelled or failed'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: false,
        log_level: 'error',
      });

      window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: 320,
      });
    }).catch(err => {
      onError(err);
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
    } catch {
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
        try {
          const currentUser = this.getCurrentUser();
          if (currentUser?.email) {
            window.google.accounts.id.revoke(currentUser.email, () => {
              console.log('User session revoked successfully');
            });
          }
        } catch (revokeError) {
          // Ignore revoke errors as they're not critical
          console.warn('Could not revoke session:', revokeError);
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