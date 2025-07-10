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
        }, 1000); // Increased delay to ensure proper loading
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
        log_level: 'error',
        allowed_parent_origin: window.location.origin,
      });
    } catch (error) {
      console.warn('Google Auth initialization warning (non-critical):', error);
      // Continue anyway as some warnings are non-critical
    }
  }

  async signIn(): Promise<User> {
    try {
      // Ensure Google Auth is properly initialized
      await this.initialize();
      
      if (!window.google?.accounts?.id) {
        throw new Error('Google Authentication service is not available. Please refresh the page and try again.');
      }
    } catch (error) {
      throw new Error('Failed to initialize Google Authentication. Please refresh the page and try again.');
    }
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Sign-in timeout. Please try again.'));
      }, 90000); // 90 second timeout for slower connections

      try {
        // Create a more robust callback approach
        const handleCredentialResponse = (response: any) => {
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
        };

        // Re-initialize with callback to ensure it's properly set
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
          log_level: 'error',
          allowed_parent_origin: window.location.origin,
        });

        // Try prompt first
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Clear the timeout and try alternative methods
            clearTimeout(timeoutId);
            this.showSignInButton()
              .then(resolve)
              .catch(reject);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Sign-in initialization error:', error);
        reject(new Error('Failed to start sign-in process. Please refresh the page and try again.'));
      }
    });
  }

  private async showSignInButton(): Promise<User> {
    return new Promise((resolve, reject) => {
      // Create a modal overlay for the sign-in button
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const container = document.createElement('div');
      container.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
      `;

      const title = document.createElement('h2');
      title.textContent = 'Sign in to Cook.AI';
      title.style.cssText = `
        margin: 0 0 10px 0;
        color: #333;
        font-size: 24px;
        font-weight: bold;
      `;

      const subtitle = document.createElement('p');
      subtitle.textContent = 'Click the button below to sign in with Google';
      subtitle.style.cssText = `
        margin: 0 0 20px 0;
        color: #666;
        font-size: 16px;
      `;

      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-button-' + Date.now();
      buttonContainer.style.cssText = `
        margin: 20px 0;
        display: flex;
        justify-content: center;
      `;

      const closeButton = document.createElement('button');
      closeButton.textContent = 'Cancel';
      closeButton.style.cssText = `
        background: #f5f5f5;
        border: 1px solid #ddd;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 15px;
      `;

      closeButton.onclick = () => {
        document.body.removeChild(overlay);
        reject(new Error('Sign-in cancelled by user'));
      };

      container.appendChild(title);
      container.appendChild(subtitle);
      container.appendChild(buttonContainer);
      container.appendChild(closeButton);
      overlay.appendChild(container);
      document.body.appendChild(overlay);

      try {
        // Set up the callback for the button
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            document.body.removeChild(overlay);
            
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
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
          log_level: 'error',
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 280,
        });

        // Auto-cleanup after 2 minutes
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
            reject(new Error('Sign-in timeout'));
          }
        }, 120000);

      } catch (error) {
        document.body.removeChild(overlay);
        reject(new Error('Failed to create sign-in button'));
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