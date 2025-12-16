import { api, ApiError, ApiErrorType } from '@/lib/api';
import { User } from '@/types';

/**
 * Login request payload
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
}

/**
 * Authentication response 
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Authentication errors
 */
export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }

  static fromApiError(error: ApiError): AuthError {
    let code = 'auth_error';
    
    if (error.type === ApiErrorType.UNAUTHORIZED) {
      code = 'invalid_credentials';
    } else if (error.type === ApiErrorType.VALIDATION) {
      code = 'validation_error';
    } else if (error.type === ApiErrorType.NETWORK) {
      code = 'network_error';
    }
    
    return new AuthError(error.message, code);
  }
}

/**
 * Authentication service for managing user sessions
 */
export const authService = {
  /**
   * Log in a user with email and password
   * 
   * @param credentials - Login credentials
   * @returns Authentication response with user data and token
   * @throws AuthError
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      return await api.post<AuthResponse>('/auth/login', credentials);
    } catch (error) {
      if (error instanceof ApiError) {
        throw AuthError.fromApiError(error);
      }
      throw new AuthError((error as Error).message, 'unknown_error');
    }
  },

  /**
   * Log out the current user
   * 
   * @throws AuthError
   */
  async logout(): Promise<void> {
    try {
      await api.post<void>('/auth/logout', {}, { withAuth: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw on logout errors, just log them
    }
  },

  /**
   * Get the current user's profile
   * 
   * @returns Current user data
   * @throws AuthError if user is not authenticated or request fails
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await api.get<User>('/auth/me', { withAuth: true });
    } catch (error) {
      if (error instanceof ApiError) {
        // Special handling for auth errors
        if (error.type === ApiErrorType.UNAUTHORIZED) {
          throw new AuthError('User session expired or invalid', 'session_expired');
        }
        throw AuthError.fromApiError(error);
      }
      throw new AuthError((error as Error).message, 'unknown_error');
    }
  },

  /**
   * Register a new user
   * 
   * @param userData - User registration data
   * @returns Authentication response with user data and token
   * @throws AuthError
   */
  async register(userData: RegistrationData): Promise<AuthResponse> {
    try {
      return await api.post<AuthResponse>('/auth/register', userData);
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle known error types
        if (error.type === ApiErrorType.VALIDATION) {
          throw new AuthError('Registration validation failed', 'validation_error');
        }
        throw AuthError.fromApiError(error);
      }
      throw new AuthError((error as Error).message, 'unknown_error');
    }
  },

  /**
   * Request password reset email
   * 
   * @param email - User's email address
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post<void>('/auth/forgot-password', { email });
    } catch (error) {
      if (error instanceof ApiError) {
        throw AuthError.fromApiError(error);
      }
      throw new AuthError((error as Error).message, 'unknown_error');
    }
  },

  /**
   * Reset password with token
   * 
   * @param token - Reset token from email
   * @param password - New password
   * @param passwordConfirmation - Password confirmation
   */
  async resetPassword(
    token: string, 
    password: string, 
    passwordConfirmation: string
  ): Promise<void> {
    try {
      await api.post<void>('/auth/reset-password', {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw AuthError.fromApiError(error);
      }
      throw new AuthError((error as Error).message, 'unknown_error');
    }
  },
}; 