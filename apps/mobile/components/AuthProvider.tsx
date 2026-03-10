import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initRevenueCat, logoutRevenueCat } from '../services/revenuecat';

interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  xp?: number;
  isPremium?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  signIn: async () => {},
  signOut: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isPremium = user?.isPremium || false;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await initRevenueCat(parsedUser.id);
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (token: string, userData: User) => {
    try {
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser(userData);
      await initRevenueCat(userData.id);
    } catch (e) {
      console.error('Failed to sign in', e);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setUser(null);
      await logoutRevenueCat();
    } catch (e) {
      console.error('Failed to sign out', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, signIn, signOut, logout: signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
