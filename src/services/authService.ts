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
        // Add a small delay to ensure the script is fully loaded
        setTimeout(() => {
          this.initializeGoogleAuth();
          this.isInitialized = true;
          resolve();
        }, 100);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  private initializeGoogleAuth(): void {
    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services not available');
    }

    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true, // Enable FedCM for future compatibility
    });
  }

  private handleCredentialResponse(response: any): void {
    this.credentialResponse = response;
  }

  private credentialResponse: any = null;

  async signIn(): Promise<User> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      try {
        // Use the renderButton approach for better reliability
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '-9999px';
        buttonContainer.style.left = '-9999px';
        document.body.appendChild(buttonContainer);

        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 250,
        });

        // Set up the callback for this sign-in attempt
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            document.body.removeChild(buttonContainer);
            
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
          use_fedcm_for_prompt: true,
        });

        // Trigger the sign-in by clicking the hidden button
        const button = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
        if (button) {
          button.click();
        } else {
          // Fallback to prompt method
          this.showPrompt().then(resolve).catch(reject);
        }
      } catch (error) {
        reject(new Error('Failed to initialize sign-in process'));
      }
    });
  }

  private async showPrompt(): Promise<User> {
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
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });

      // Show the One Tap prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          reject(new Error('Sign-in prompt was not displayed or was skipped'));
        }
      });
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
      // Revoke the user's session
      window.google.accounts.id.revoke(this.getCurrentUser()?.email || '', () => {
        console.log('User session revoked');
      });
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();