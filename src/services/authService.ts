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
        }, 500);
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
        // Enable FedCM to suppress warnings
        use_fedcm_for_prompt: true,
        // Suppress console warnings in production
        log_level: 'error',
        // Add allowed parent origin for iframe
        allowed_parent_origin: window.location.origin,
      });
    } catch (error) {
      console.warn('Google Auth initialization warning (non-critical):', error);
      // Continue anyway as some warnings are non-critical
    }
  }

  async signIn(): Promise<User> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Sign-in timeout. Please try again.'));
      }, 90000); // 90 second timeout for slower connections

      try {
        // Use a more robust callback approach
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

        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false, // Prevent accidental cancellation
          use_fedcm_for_prompt: true,
          log_level: 'error',
          allowed_parent_origin: window.location.origin,
        });

        // Try prompt first, then fallback to popup
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Clear the timeout and try popup method
            clearTimeout(timeoutId);
            this.openSignInPopup()
              .then(resolve)
              .catch((popupError) => {
                // If popup also fails, try the renderButton approach
                this.renderSignInButton()
                  .then(resolve)
                  .catch(reject);
              });
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
      try {
        // Create a popup window for sign-in
        const popup = window.open(
          `https://accounts.google.com/oauth/authorize?client_id=${this.clientId}&response_type=token&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent(window.location.origin)}`,
          'google-signin',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups and try again.'));
          return;
        }

        // Fallback to button method if popup doesn't work
        setTimeout(() => {
          if (popup && !popup.closed) {
            popup.close();
          }
          this.renderSignInButton().then(resolve).catch(reject);
        }, 5000);

      } catch (error) {
        this.renderSignInButton().then(resolve).catch(reject);
      }
    });
  }

  private async renderSignInButton(): Promise<User> {
    return new Promise((resolve, reject) => {
      // Create a temporary container for the Google Sign-In button
      const container = document.createElement('div');
      container.id = 'google-signin-container-' + Date.now();
      container.style.position = 'fixed';
      container.style.top = '50%';
      container.style.left = '50%';
      container.style.transform = 'translate(-50%, -50%)';
      container.style.zIndex = '10000';
      container.style.backgroundColor = 'white';
      container.style.padding = '20px';
      container.style.borderRadius = '10px';
      container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
      backdrop.style.zIndex = '9999';
      
      document.body.appendChild(backdrop);
      document.body.appendChild(container);

      const cleanup = () => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        if (document.body.contains(backdrop)) {
          document.body.removeChild(backdrop);
        }
      };

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '10px';
      closeButton.style.border = 'none';
      closeButton.style.background = 'none';
      closeButton.style.fontSize = '20px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => {
        cleanup();
        reject(new Error('Sign-in cancelled by user'));
      };
      
      const title = document.createElement('div');
      title.textContent = 'Sign in to Cook.AI';
      title.style.marginBottom = '15px';
      title.style.fontWeight = 'bold';
      title.style.textAlign = 'center';
      
      container.appendChild(closeButton);
      container.appendChild(title);

      try {
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 280,
        });

        // Set up the callback for this button
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            cleanup();
            
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

        // Auto-cleanup after 60 seconds
        setTimeout(() => {
          cleanup();
          reject(new Error('Sign-in timeout'));
        }, 60000);

      } catch (error) {
        cleanup();
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