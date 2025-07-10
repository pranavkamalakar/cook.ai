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

  async signIn(): Promise<User> {
    try {
      await this.initialize();
      
      if (!window.google?.accounts?.id) {
        throw new Error('Google Authentication service is not available. Please refresh the page and try again.');
      }
    } catch (error) {
      throw new Error('Failed to initialize Google Authentication. Please refresh the page and try again.');
    }
    
    // Always show the sign-in button modal instead of trying prompt first
    return this.showSignInModal();
  }

  private async showSignInModal(): Promise<User> {
    return new Promise((resolve, reject) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 450px;
        width: 90%;
        position: relative;
        animation: modalSlideIn 0.3s ease-out;
      `;

      // Add animation keyframes
      const style = document.createElement('style');
      style.textContent = `
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `;
      document.head.appendChild(style);

      // Close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        font-size: 28px;
        color: #999;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      `;
      closeButton.onmouseover = () => {
        closeButton.style.background = '#f5f5f5';
        closeButton.style.color = '#333';
      };
      closeButton.onmouseout = () => {
        closeButton.style.background = 'none';
        closeButton.style.color = '#999';
      };

      // Logo/Icon
      const icon = document.createElement('div');
      icon.style.cssText = `
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #f97316, #ea580c);
        border-radius: 15px;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      `;
      icon.innerHTML = '👨‍🍳';

      const title = document.createElement('h2');
      title.textContent = 'Welcome to Cook.AI';
      title.style.cssText = `
        margin: 0 0 10px 0;
        color: #333;
        font-size: 28px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const subtitle = document.createElement('p');
      subtitle.textContent = 'Sign in with Google to start generating personalized recipes';
      subtitle.style.cssText = `
        margin: 0 0 30px 0;
        color: #666;
        font-size: 16px;
        line-height: 1.5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-button-' + Date.now();
      buttonContainer.style.cssText = `
        margin: 30px 0 20px 0;
        display: flex;
        justify-content: center;
      `;

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        color: #6c757d;
        padding: 12px 24px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      cancelButton.onmouseover = () => {
        cancelButton.style.background = '#e9ecef';
        cancelButton.style.borderColor = '#dee2e6';
      };
      cancelButton.onmouseout = () => {
        cancelButton.style.background = '#f8f9fa';
        cancelButton.style.borderColor = '#e9ecef';
      };

      const cleanup = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };

      closeButton.onclick = () => {
        cleanup();
        reject(new Error('Sign-in cancelled by user'));
      };

      cancelButton.onclick = () => {
        cleanup();
        reject(new Error('Sign-in cancelled by user'));
      };

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          cleanup();
          reject(new Error('Sign-in cancelled by user'));
        }
      };

      modal.appendChild(closeButton);
      modal.appendChild(icon);
      modal.appendChild(title);
      modal.appendChild(subtitle);
      modal.appendChild(buttonContainer);
      modal.appendChild(cancelButton);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      try {
        // Initialize Google Auth with callback
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
          use_fedcm_for_prompt: false,
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
          width: 300,
        });

        // Auto-cleanup after 5 minutes
        setTimeout(() => {
          cleanup();
          reject(new Error('Sign-in timeout'));
        }, 300000);

      } catch (error) {
        cleanup();
        reject(new Error('Failed to create sign-in interface'));
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