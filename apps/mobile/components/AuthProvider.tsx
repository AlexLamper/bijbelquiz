import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import { initRevenueCat, logoutRevenueCat } from '../services/revenuecat';

import { API_BASE_URL } from '../constants/api';

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
  const [rcPremium, setRcPremium] = useState(false);

  // We are premium if the database says so, OR if RevenueCat entitlement is active
  const isPremium = Boolean(user?.isPremium) || rcPremium;

  useEffect(() => {
    loadUser();

    // Listen for changes in purchases/entitlements
    const customerInfoUpdateListener = (info: any) => {
      const hasPremium = info.entitlements.active['BijbelQuiz Premium'] !== undefined;
      setRcPremium(hasPremium);
    };
    
    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
    };
  }, []);

  const checkRCPremium = async () => {
    try {
      const isConfigured = await Purchases.isConfigured();
      if (isConfigured) {
        const customerInfo = await Purchases.getCustomerInfo();
        setRcPremium(customerInfo.entitlements.active['BijbelQuiz Premium'] !== undefined);
      }
    } catch(e) {
      console.log("Error checking RC premium status", e);
    }
  }

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        try {
          // Refresh user data from API
          const response = await fetch(`${API_BASE_URL}/api/user/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const freshUser = await response.json();
            setUser(freshUser);
            await SecureStore.setItemAsync('userData', JSON.stringify(freshUser));
            await initRevenueCat(freshUser.id);
            await checkRCPremium();
          } else {
             // Fallback to local
             await initRevenueCat(parsedUser.id);
             await checkRCPremium();
          }
        } catch (apiError) {
           console.error('Failed to fetch fresh user profile', apiError);       
           await initRevenueCat(parsedUser.id);
           await checkRCPremium();
        }      
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
      await checkRCPremium();
    } catch (e) {
      console.error('Failed to sign in', e);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setUser(null);
      setRcPremium(false);
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
