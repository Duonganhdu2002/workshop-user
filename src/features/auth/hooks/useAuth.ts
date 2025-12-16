import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { authService, LoginCredentials } from '../services/auth.service';
import { User } from '@/types';

/**
 * Authentication state interface
 */
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Return type for useAuth hook
 */
interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Authentication options
 */
interface AuthOptions {
  /** Token time-to-live in milliseconds */
  tokenTTL?: number;
  /** Automatically refresh user data on mount */
  autoRefresh?: boolean;
}

/**
 * Custom hook for authentication state management
 * 
 * @param options - Configuration options
 * @returns Authentication state and methods
 */
export function useAuth(options: AuthOptions = {}): UseAuthReturn {
  const {
    tokenTTL = 7 * 24 * 60 * 60 * 1000, // 7 days by default
    autoRefresh = true,
  } = options;

  const [token, setToken, removeToken] = useLocalStorage<string | null>('auth_token', null, {
    ttl: tokenTTL,
    syncAcrossTabs: true,
  });

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: autoRefresh && !!token,
    error: null,
  });

  /**
   * Fetch current user data from API
   */
  const refreshUser = useCallback(async () => {
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false, user: null }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = await authService.getCurrentUser();
      setState({ user, isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch user'),
      });
      
      // Token is likely invalid, remove it
      removeToken();
    }
  }, [token, removeToken]);

  // Fetch user data on mount if token exists and autoRefresh is enabled
  useEffect(() => {
    if (autoRefresh && token) {
      refreshUser();
    } else if (!token) {
      setState((prev) => ({ ...prev, isLoading: false, user: null }));
    }
  }, [token, autoRefresh, refreshUser]);

  /**
   * Login with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, token } = await authService.login(credentials);
      setToken(token);
      setState({ user, isLoading: false, error: null });
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Login failed'),
      });
    }
  }, [setToken]);

  /**
   * Logout and clear auth state
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      setState({ user: null, isLoading: false, error: null });
    }
  }, [token, removeToken]);

  return {
    ...state,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!token,
  };
} 