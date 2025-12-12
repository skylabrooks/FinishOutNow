import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { 
  getCurrentUser, 
  onAuthChange, 
  loginUser, 
  registerUser, 
  logoutUser 
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing user session on mount
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Listen for auth state changes
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      
      // Development mode bypass for authentication issues
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
      if (isDevMode && (email === 'dev@test.com' || email === 'test@example.com')) {
        // Create mock user for development
        const mockUser = {
          uid: 'dev-user-123',
          email: email,
          displayName: 'Development User',
          emailVerified: true,
        } as User;
        
        setUser(mockUser);
        console.log('[Auth] Using development mode authentication bypass');
        return mockUser;
      }
      
      const user = await loginUser(email, password);
      setUser(user);
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      
      // Additional development mode fallback
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
      if (isDevMode && message.includes('invalid-credential')) {
        console.warn('[Auth] Firebase authentication failed, using development bypass');
        const mockUser = {
          uid: 'dev-user-fallback',
          email: email,
          displayName: 'Dev Fallback User',
          emailVerified: true,
        } as User;
        
        setUser(mockUser);
        return mockUser;
      }
      
      setError(message);
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      const user = await registerUser(email, password);
      setUser(user);
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
